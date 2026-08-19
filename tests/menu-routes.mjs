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
const posted = new Set([...WORKER.matchAll(/postMessage\(\s*\{\s*type:\s*'([^']+)'/g)]
  .map((m) => m[1]));
const handled = new Set([...TRACKER.matchAll(/e\.data\.type\s*===\s*'([^']+)'/g)]
  .map((m) => m[1]));

t.check(`the framed planner posts ${posted.size} message type(s)`, posted.size > 0);
const unhandled = [...posted].filter((m) => !handled.has(m));
t.check("every message the frame posts is handled by the tracker",
  unhandled.length === 0,
  unhandled.length ? `${unhandled.join(", ")} — posted and ignored` : "");
const unposted = [...handled].filter((m) => m.startsWith("eicc:roi-") && !posted.has(m));
t.check("and the tracker handles no message the frame never sends",
  unposted.length === 0,
  unposted.length ? `${unposted.join(", ")} — handled but never posted, so it is dead code `
    + "or the sender was renamed" : "");

process.exit(t.report() ? 0 : 1);
