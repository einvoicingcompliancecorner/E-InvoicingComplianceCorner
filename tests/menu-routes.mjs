#!/usr/bin/env node
// menu-routes.mjs — the tracker's menu only links to routes the site
// actually serves, and a route behind a feature flag has that flag on.
//
//   node tests/menu-routes.mjs
//
// THE BUG THIS EXISTS FOR, in Dan's words: "I get a not found blank
// screen when clicking the menu option."
//
// The ROI & Wave Planner menu item shipped on 19 August 2026. The route
// it opens had been returning 404 since 11 August, on purpose —
// ROI_PUBLIC in site-worker/wrangler.toml was "false" while the planner
// was road-tested privately. The link and the flag were one change and
// were shipped as two, so the first click opened a full-width panel onto
// the worker's two-word 404 body.
//
// ELEVEN SUITES PASSED THAT DAY, and none of them could have caught it.
// Every ROI harness in this repo calls renderRoiCalculatorPage() — or
// renderRoiPage() below it — directly. Not one goes through the router,
// which is the only code that reads this flag. The page was perfect and
// the site was refusing to serve it, and those are tested by different
// things: the first by ten suites, the second by nothing at all.
//
// So this check reads the two files and asks whether they agree. It is
// static, it needs no browser and no network, and it is the whole of the
// coverage that was missing.
//
// WHY NOT JUST FETCH THE ROUTES. Because the flag lives in wrangler.toml
// and the deployed value can be overridden in the Cloudflare dashboard —
// fetching production would test what is deployed, which is useful and is
// not this. This tests that the repository is internally consistent
// BEFORE a deploy, which is when the mistake is cheap.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const TRACKER = readFileSync(join(REPO, "einvoicing-compliance-tracker.html"), "utf8");
const WORKER = readFileSync(join(REPO, "site-worker", "src", "index.js"), "utf8");
const WRANGLER = readFileSync(join(REPO, "site-worker", "wrangler.toml"), "utf8");

const t = suite("menu routes");

// ---- what the menus link to -------------------------------------------
//
// Only the dropdown items, and only site-absolute hrefs. A relative link
// (feedback.html, subscribe.html) is a static asset and is served by the
// asset layer without the worker being consulted at all; an external one
// is not ours to check.
const linked = [...TRACKER.matchAll(/<a class="dropdown-item"[^>]*href="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((h) => h.startsWith("/"));
t.check(`the dropdowns link to ${linked.length} site-absolute route(s)`, linked.length > 0);

// ---- every one of them is a route the worker answers ------------------
//
// The worker declares its routes as Sets of literal paths. Read those
// rather than listing them here: a route added to the worker and not to a
// list in this file would make this check quietly incomplete, which is
// the failure mode it is meant to be immune to.
const declared = new Set();
for (const m of WORKER.matchAll(/const (\w*PATHS)\s*=\s*new Set\(\[([^\]]*)\]/g)) {
  for (const p of m[2].matchAll(/"([^"]+)"/g)) declared.add(p[1]);
}
// Routes matched by a regular expression or by slug lookup rather than by
// a Set — the insights hub and its articles are the current case. Matched
// loosely on purpose: this check is about menu links pointing nowhere,
// not about re-implementing the router.
const looselyServed = (href) =>
  new RegExp(`["\`']${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(WORKER);

const unserved = linked.filter((h) => !declared.has(h) && !looselyServed(h));
t.check("every menu link points at a route the worker serves",
  unserved.length === 0,
  unserved.join(", "));

// ---- and a flagged route is switched on -------------------------------
//
// The pattern in the worker is
//
//     if (X_PATHS.has(url.pathname)) {
//       if (env.X_PUBLIC !== "true") return new Response("Not found", ...
//
// so a route set whose block tests an env var is gated. Find those, work
// out which paths they gate, and if the tracker links to any of them,
// require the flag to be "true" in wrangler.toml.
const vars = Object.fromEntries(
  [...WRANGLER.matchAll(/^(\w+)\s*=\s*"([^"]*)"/gm)].map((m) => [m[1], m[2]]));

const gates = [...WORKER.matchAll(
  /if\s*\((\w*PATHS)\.has\(url\.pathname\)\)\s*\{\s*if\s*\(env\.(\w+)\s*!==\s*"true"\)/g)];

let gatedChecks = 0;
for (const [, setName, flag] of gates) {
  const setDecl = WORKER.match(
    new RegExp(`const ${setName}\\s*=\\s*new Set\\(\\[([^\\]]*)\\]`));
  if (!setDecl) continue;
  const paths = [...setDecl[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const linkedHere = linked.filter((h) => paths.includes(h));
  if (!linkedHere.length) continue;
  gatedChecks++;
  t.check(
    `the menu links to ${linkedHere.join(", ")}, so ${flag} must be "true"`,
    vars[flag] === "true",
    `${flag} is ${vars[flag] === undefined ? "not set" : `"${vars[flag]}"`} in `
    + "site-worker/wrangler.toml — the route will answer 404 and the panel "
    + "will open onto it",
  );
}

// Stated rather than left implicit: if the gate pattern in the worker is
// ever rewritten, this file finds nothing and passes, which would look
// exactly like agreement. The count says which it was.
console.log(`  note  ${gates.length} flag-gated route set(s) found in the worker, `
  + `${gatedChecks} of them linked from a menu`);

// ---- the client intercepts every alias, or a link full-navigates ------
//
// openRoiPage() is reached from a click handler matching the href
// literally. A path the worker serves and the handler does not know about
// still works — it just leaves the tracker for the standalone page, which
// is a different experience from the one the menu promises.
for (const [, setName] of gates) {
  const setDecl = WORKER.match(
    new RegExp(`const ${setName}\\s*=\\s*new Set\\(\\[([^\\]]*)\\]`));
  if (!setDecl) continue;
  const paths = [...setDecl[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (!paths.some((p) => linked.includes(p))) continue;
  const missed = paths.filter((p) => !TRACKER.includes(`'${p}'`) && !TRACKER.includes(`"${p}"`));
  t.check(`the tracker intercepts every alias of ${setName}`,
    missed.length === 0,
    missed.length ? `${missed.join(", ")} would full-navigate instead of opening in-page` : "");
}

// ---- a framed menu item must actually be intercepted -----------------
//
// The check above only reaches FLAG-GATED route sets, because when it was
// written the planner was the only framed page and ROI_PUBLIC was how you
// found it. Compliance guides is framed too since 22 August and has no
// flag -- deliberately, since it answers a sign-up wall rather than a 404
// -- so it fell outside that loop entirely.
//
// This is the gap the file already warns about in its own words: "if the
// gate pattern in the worker is ever rewritten, this file finds nothing
// and passes, which would look exactly like agreement." Same shape, one
// level up. A framed page whose link is not intercepted still works -- it
// just full-navigates away from the board, which is the opposite of what
// framing it was for, and nothing would say so.
{
  const framedSets = ["GUIDES_PATHS"];
  for (const setName of framedSets) {
    const decl = WORKER.match(new RegExp(`const ${setName}\\s*=\\s*new Set\\(\\[([^\\]]*)\\]`));
    t.check(`${setName} is declared in the worker`, !!decl);
    if (!decl) continue;
    const paths = [...decl[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    // SINGLE QUOTES ONLY. The first version accepted either style, copied
    // from the loop above, and so was satisfied by the menu item's own
    // href="/compliance-guides" -- the very markup whose behaviour it was
    // meant to be testing. It could never have failed. Every click handler
    // in this file writes paths in single quotes and every href in double,
    // so this asks whether any SCRIPT here knows the path.
    //
    // IT IS STILL A PROXY, and the negative test says so: deleting the
    // click handler leaves FRAMED_PAGES.guides.url matching, and this
    // passes. The check below is the one that cannot be satisfied by
    // anything except the interception itself.
    const missed = paths.filter((p) => !TRACKER.includes(`'${p}'`));
    t.check(`the tracker intercepts every alias of ${setName}`,
      missed.length === 0,
      missed.length ? `${missed.join(", ")} would full-navigate instead of opening in-page` : "");
  }
  // THE HANDLER ITSELF, named. A path can appear in this file for several
  // innocent reasons -- a config entry, a history URL, a comment -- and
  // any of them satisfies the alias check above. Only one thing routes a
  // click into the panel, so that is what gets asserted.
  // THE CONDITION, not the call. A first version matched the call
  // openRoiPage({ page: 'guides' ... and passed with the click handler
  // deleted, because the popstate branch makes the same call for a reader
  // arriving on the URL directly. Only the click handler tests the href.
  t.check("a click on the guides link opens the framed panel",
    /href === '\/compliance-guides'/.test(TRACKER),
    "no interception routes /compliance-guides into the panel — the link "
    + "would full-navigate and the reader would lose the board");

  // AND THE DOCUMENT MUST NOT BE. It is printable and opens in its own
  // window; intercepting it into the panel would put a print dialogue
  // inside a content-sized iframe.
  t.check("the printable guide route is NOT intercepted",
    !TRACKER.includes("'/compliance-guides/guide'"),
    "the document would open framed instead of in its own window");
}

// ---- the two halves of the frame protocol agree ----------------------
//
// The framed planner talks to the tracker over postMessage, and the
// message names are string literals typed into two different files that
// nothing forces to match. That is the shape this project keeps getting
// caught by — the A/B/C/D grade labels, platform-versus-software fees,
// the pie's row names, and the section name in the ribbon legend, which
// is now a slot for exactly this reason.
//
// Here it cannot be a slot: one side is a Worker string and the other is
// a static HTML file, with no shared module between them. So it is a
// check instead. A rename on either side is silent otherwise — the
// planner posts, the tracker ignores, and the frame simply stops growing
// or stops scrolling with nothing in any console.
// TWO SENDERS ON THE FRAME SIDE since 20 August 2026. The height and
// scroll messages come from the reporter inside site-worker; the signup
// panel's open/close come from auth-overlay.js, which is a static asset
// the frame loads. Both are "the frame" as far as the tracker is
// concerned, and leaving the second one out would have made this check
// pass while covering half of what it claims to.
const OVERLAY = readFileSync(join(REPO, "auth-overlay.js"), "utf8");
const FRAME_SIDE = WORKER + "\n" + OVERLAY;

const types = (src, re) => new Set([...src.matchAll(re)].map((m) => m[1]));

// Single or double quotes: the Worker's reporter is written in one style
// and the overlay in the other, and a regex that knows only one of them
// silently sees fewer messages than exist.
const posted = new Set([
  ...types(FRAME_SIDE, /postMessage\(\s*\{\s*type:\s*['"]([^'"]+)['"]/g),
  // The overlay posts through a helper, so the literal sits at the call
  // site rather than at the postMessage.
  ...types(FRAME_SIDE, /tellParent\(\s*['"]([^'"]+)['"]\s*\)/g),
]);
const handled = types(TRACKER, /e\.data\.type\s*===\s*['"]([^'"]+)['"]/g);

t.check(`the framed planner posts ${posted.size} message type(s)`, posted.size > 2);
const unhandled = [...posted].filter((m) => !handled.has(m));
t.check("every message the frame posts is handled by the tracker",
  unhandled.length === 0,
  unhandled.length ? `${unhandled.join(", ")} — posted and ignored` : "");
const unposted = [...handled].filter((m) => m.startsWith("eicc:") && !posted.has(m));
t.check("and the tracker handles no message the frame never sends",
  unposted.length === 0,
  unposted.length ? `${unposted.join(", ")} — handled but never posted, so it is dead code `
    + "or the sender was renamed" : "");

// ---- AND NOW IT GOES BOTH WAYS ---------------------------------------
//
// Until the signup panel there was one direction: the frame spoke and the
// tracker listened. The panel needs an answer — the frame is sized to its
// own full content height and so has no viewport of its own, and a modal
// centred against that lands thousands of pixels off screen. The tracker
// sends the visible rect back.
//
// A reply protocol fails more quietly than a one-way one. Rename the
// frame's half and the card simply renders somewhere nobody is looking:
// no error, no missing element, and a screenshot of the wrong scroll
// position looks exactly like a screenshot of a page that did nothing.
const trackerPosts = types(TRACKER, /postMessage\(\s*\{\s*\n?\s*type:\s*['"]([^'"]+)['"]/g);
const frameHandles = types(OVERLAY, /e\.data\.type\s*[!=]==\s*['"]([^'"]+)['"]/g);

t.check(`the tracker sends ${trackerPosts.size} message type(s) back into the frame`,
  trackerPosts.size > 0, [...trackerPosts].join(", "));
const ignoredByFrame = [...trackerPosts].filter((m) => !frameHandles.has(m));
t.check("and the frame handles every one of them",
  ignoredByFrame.length === 0,
  ignoredByFrame.length
    ? `${ignoredByFrame.join(", ")} — sent by the tracker and ignored in the frame, `
      + "so the panel positions itself against a viewport it never learns"
    : "");
const neverSent = [...frameHandles].filter((m) => !trackerPosts.has(m));
t.check("and listens for nothing the tracker never sends",
  neverSent.length === 0,
  neverSent.length ? `${neverSent.join(", ")} — handled but never sent` : "");

// ---- nothing fetches the members origin from the tracker ---------------
//
// THE BUG, reported by Dan on 21 August 2026: the newsletter archive
// showed "You're viewing the full archive for free — no account needed"
// to everyone, signed in or not.
//
// members-worker was right every time. The tracker fetched
// members.e-invoicingcompliancecorner.com DIRECTLY, and fetch() defaults
// to credentials:'same-origin' — so on a cross-origin request the session
// cookie is silently left behind and the other Worker sees an anonymous
// reader. No error, no warning, a perfectly good 200: the response is
// just answering a question about nobody.
//
// The old comment beside that line contained the whole diagnosis, filed
// as an aside: "that only ever appears when signed in, which this
// cross-origin fetch never is, since cookies aren't sent across origins."
// Known, written down, and not read as a defect for weeks.
//
// The rule is therefore simple and absolute: THIS PAGE DOES NOT FETCH THE
// OTHER ORIGIN. Anything it needs from members-worker comes through
// site-worker's relay, where the cookie is first-party. Navigations are
// fine — an <a href> or a form POST carries cookies normally, which is
// why only fetch() is checked.
const fetchesMembers = [...TRACKER.matchAll(
  /fetch\(\s*[`'"][^`'"]*members\.e-invoicingcompliancecorner\.com[^`'"]*[`'"]/g)]
  .map((m) => m[0].slice(0, 80));
const fetchesMembersVar = [...TRACKER.matchAll(
  /fetch\(\s*`\$\{MEMBERS_ORIGIN\}[^`]*`/g)].map((m) => m[0].slice(0, 80));
// ONE EXEMPTION, NAMED. /members/feedback is deliberately anonymous: the
// form carries the sender's address as a field, members-worker turns CORS
// on for that route specifically, and there is no session for it to lose.
// It is listed here rather than excluded by a looser pattern so that a
// second cross-origin fetch has to come and argue with this comment.
const ALLOWED_CROSS_ORIGIN = ["/members/feedback"];
const crossOriginFetches = [...fetchesMembers, ...fetchesMembersVar]
  .filter((f) => !ALLOWED_CROSS_ORIGIN.some((p) => f.includes(p)));

t.check("the tracker never fetch()es the members origin directly",
  crossOriginFetches.length === 0,
  crossOriginFetches.length
    ? `\n         ${crossOriginFetches.join("\n         ")}`
      + "\n         fetch() defaults to credentials:'same-origin', so the session"
      + "\n         cookie is dropped and members-worker answers as if nobody is"
      + "\n         signed in — a clean 200 that is silently about the wrong reader."
      + "\n         Use site-worker's relay instead."
    : "");

// And the relay it is supposed to use actually exists.
t.check("site-worker relays the archive same-origin",
  /ARCHIVE_RELAY_PREFIX\s*=\s*"\/api\/archive"/.test(WORKER)
  && /relayArchive\(/.test(WORKER));
t.check("and the tracker asks for that path",
  /fetch\(\s*[`'"]\/api\/archive/.test(TRACKER));

// The archive panel injects members-worker's own markup into this page,
// where a root-relative href or form action resolves against the WRONG
// origin. Links were already rewritten; forms were not, and the signed-in
// archive renders a sign-out form posting to /members/logout — POST-only,
// on the other host. Left relative it 404s and the reader believes they
// signed out. That is the 20 August defect arriving by a second door, and
// it could only ever appear once the panel could see a session at all.
t.check("the archive panel rewrites relative form actions, not just links",
  /querySelectorAll\('form\[action\^="\/"\]'\)/.test(TRACKER),
  "a relative form action posts to the public origin and 404s");

process.exit(t.report() ? 0 : 1);
