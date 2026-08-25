#!/usr/bin/env node
// menu-in-page.mjs — every Menu item opens in the tracker, none of them
// leaves it.
//
//   node tests/menu-in-page.mjs
//
// WHY THIS EXISTS. Dan, 25 August 2026: "please can the subscribe page
// under the menu option be replaced with the popout subscribe box that
// appears when you click subscribe via the compliance guide?"
//
// It had been the pop-out, since 21 August. On 24 August commit 1052487
// ("Nothing points at a URL that 307s") rewrote 26 internal links to
// their extensionless form, and the tracker's click handler matched the
// raw href attribute against literal strings — 'subscribe.html',
// 'feedback.html', and a map keyed '/education-mandate-types.html'.
// Every one of those comparisons stopped matching on the same afternoon.
//
// SEVEN MENU ITEMS SILENTLY WENT BACK TO BEING ORDINARY LINKS: Subscribe,
// Give feedback, and all five Education pages. Thirty suites passed.
//
// ---- WHY THIRTY SUITES PASSED ----------------------------------------
//
// menu-routes.mjs is the file named for this and it could not see it. It
// begins by filtering the menu down to site-absolute hrefs:
//
//     .filter((h) => h.startsWith("/"))
//
// with a comment explaining that "a relative link (feedback.html,
// subscribe.html) is a static asset and is served by the asset layer
// without the worker being consulted at all". That is CORRECT for the
// question that file asks — does the worker serve this route — and it
// means the seven relative menu links had no interception coverage at
// all. Its one interception check runs only over flag-gated route Sets.
//
// seo-crawlability.mjs saw the links change and approved: extensionless
// is what it wants. Nothing owned the question "does the click still do
// what the menu promises".
//
// ---- SO THIS CLICKS THEM ---------------------------------------------
//
// Static analysis is what missed it. A handler matching a literal string
// is invisible to a checker that does not know which literal, and the
// next regression will be a different literal. This drives a real
// browser, clicks every item in the Menu, and asserts the reader stayed
// on the tracker.
//
// THE TARGETS COME FROM THE MARKUP, not from a list here. Every
// <a class="dropdown-item"> in the file is clicked, so a menu item added
// tomorrow is covered without anyone remembering to add it — which is the
// property menu-routes.mjs's own header argues for and this file needed.
//
// ---- WHAT IS MEASURED, AND WHY IT IS THE CLICK AND NOT THE PANEL -----
//
// The check is not "did the URL change" — opening an Education page
// pushes /education-mandate-types into the address bar on purpose, and
// that is the panel working, not a navigation.
//
// It is whether the anchor's default action SURVIVED THE CLICK: a
// sentinel listener added after the site's own reads
// event.defaultPrevented, synchronously, in the same event dispatch. A
// click that reaches it unprevented is a click the browser was about to
// follow, and that single boolean is exactly what commit 1052487 flipped
// on seven menu items.
//
// TAKING IT SYNCHRONOUSLY IS DELIBERATE AND IT IS WHAT MAKES THE CHECK
// COVER EVERY LINK. Six of these menu items open content this harness
// cannot serve — /map, /sources, /insights and the three framed routes
// are rendered by site-worker out of D1, not read off disk. Their panels
// fetch, get a 404 from the little server below, and correctly fall back
// to a full navigation a moment later. Judging them by what ended up on
// screen would mean either excluding them from the file that exists to
// catch uncovered menu links, or teaching this harness to be site-worker.
// Judging them by the click covers all fourteen with one rule.
//
// Then, and only for the ones this harness genuinely serves, it also
// checks that something actually opened — because an href that is
// intercepted into a handler that renders nothing is a different bug the
// first measurement cannot see.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { suite } from "./lib/browser.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("menu in-page");

// ---- a static server, because the panels fetch ------------------------
//
// openEducationPage() and openFeedbackPage() fetch their HTML and mount
// it in a shadow root. Over file:// that fetch is blocked by the origin
// rules, the code correctly falls back to a full navigation, and the test
// would report a defect that only exists in the harness. Ask me how I
// know. Nothing here touches the network.
const TYPES = { ".html": "text/html", ".js": "text/javascript",
  ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".woff2": "font/woff2" };
const server = createServer((req, res) => {
  const rel = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  let file = join(REPO, rel);
  if (!existsSync(file) || !statSync(file).isFile()) file += ".html";     // extensionless routes
  if (!existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); return res.end("nope"); }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const HOME = `http://127.0.0.1:${server.address().port}/einvoicing-compliance-tracker.html`;

// ---- what to click ----------------------------------------------------
const TRACKER = readFileSync(join(REPO, "einvoicing-compliance-tracker.html"), "utf8");
const menu = [...TRACKER.matchAll(/<a class="dropdown-item"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
const extras = [...TRACKER.matchAll(/<a class="perks-cta"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
const targets = [...new Set([...menu, ...extras])];

/** Is this route a static file this harness can actually serve?
 *
 *  Relative hrefs are assets on disk (subscribe, feedback, the five
 *  education pages). Site-absolute and cross-origin ones are rendered by
 *  site-worker or live on the members subdomain — real routes, just not
 *  ones a static server has. Their clicks are still checked; only the
 *  "and something opened" half is skipped.
 *
 *  This is the same boundary menu-routes.mjs draws, from the other side:
 *  it checks the site-absolute links and filters the relative ones out,
 *  which is why the relative ones had no coverage at all until this file.
 */
const servedHere = (href) => !href.startsWith("/") && !/^https?:/.test(href);

t.check(`the Menu has links to click (${targets.length} found)`, targets.length >= 10,
  "if this drops, the selector stopped matching the markup and everything below is vacuous");

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const problems = [];
let clicked = 0;

for (const href of targets) {
  // A FRESH PAGE PER TARGET. The panels are mutually exclusive and close
  // one another; reusing one page makes each result depend on the last.
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await page.goto(HOME, { waitUntil: "load" });
    await page.waitForTimeout(1400);
    await page.evaluate(() => {
      window.__seen = [];
      document.addEventListener("click", (e) => {
        const a = e.target.closest && e.target.closest("a[href]");
        if (!a) return;
        // RECORD THE VERDICT BEFORE ALTERING IT. The first version read
        // ev.defaultPrevented back on the dispatching side instead — and
        // by then this listener had already called preventDefault(), so
        // it read true for every link including the ones nothing caught.
        // For the six routes whose panels this harness cannot serve, that
        // boolean is the ONLY signal, so the check could not fail on
        // them: it reported the sentinel's own handiwork. Caught by
        // breaking the tracker on purpose and reading the message, which
        // said "intercepted, then the handler navigated" about a link
        // that had never been intercepted at all.
        window.__seen.push({ href: a.getAttribute("href"), prevented: e.defaultPrevented });
        // Then stop it, so one escaped link cannot end the whole run by
        // navigating the page out from under the next measurement.
        e.preventDefault();
      });
    });

    // THE CLICK, AND ITS VERDICT, IN ONE SYNCHRONOUS STEP — before any
    // fetch inside the handler can fail and navigate away underneath us.
    const click = await page.evaluate((h) => {
      const el = document.querySelector(`a[href="${h}"]`);
      if (!el) return { missing: true };
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      // The sentinel's own record, taken before it interfered.
      return { seen: window.__seen.slice() };
    }, href);
    if (click.missing) { problems.push(`${href}: no anchor with this href in the DOM`); continue; }
    clicked++;
    if (!click.seen.length) {
      problems.push(`${href}: the click never reached the document — the sentinel saw nothing`);
      continue;
    }
    if (!click.seen[0].prevented) {
      problems.push(`${href}: NOT intercepted — the browser would follow this link off the tracker`);
      continue;
    }
    // Only the static-asset routes are servable here; see the header.
    if (!servedHere(href)) continue;
    await page.waitForTimeout(900);

    // A REAL NAVIGATION DESTROYS THE EXECUTION CONTEXT, so the sentinel
    // and everything else measured below goes with it. That is itself the
    // loudest possible failure signal — record it as one rather than
    // letting the exception end the run on the first bad link.
    const r = await page.evaluate(() => {
      // Content may be in a shadow root one or two levels down — the
      // education and feedback panels mount it that way, so the host's
      // own textContent reads zero even when the panel is full.
      const chars = (root) => {
        let n = 0;
        (function walk(el, d) {
          if (!el || d > 3) return;
          if (el.shadowRoot) n += (el.shadowRoot.textContent || "").trim().length;
          for (const c of el.children) walk(c, d + 1);
        })(root, 0);
        return n || (root.textContent || "").trim().length;
      };
      const panels = [...document.querySelectorAll('[id$="View"]')]
        .filter((p) => p.id !== "boardView" && getComputedStyle(p).display !== "none")
        .map((p) => ({ id: p.id, chars: chars(p) }))
        .filter((p) => p.chars > 400);
      return {
        escaped: window.__seen.slice(1).map((r) => r.href),
        overlay: !!document.querySelector(".eicc-auth-veil.open"),
        panels,
      };
    }).catch((err) => ({ destroyed: String(err && err.message || err) }));

    if (r.destroyed) {
      problems.push(`${href}: the page navigated after being intercepted — ${r.destroyed}`);
      continue;
    }
    // Anything the sentinel saw AFTER the first record is a second
    // click it did not dispatch — a handler following its own fallback
    // link. Different from the link never having been caught, and worth
    // saying differently.
    if (r.escaped.length)
      problems.push(`${href}: intercepted, then the handler navigated to ${r.escaped.join(", ")}`);
    else if (!r.overlay && !r.panels.length)
      problems.push(`${href}: intercepted, but nothing opened — no overlay and no panel with content`);
  } finally {
    await page.close();
  }
}

await browser.close();
server.close();

t.check("this check actually clicked something", clicked === targets.length,
  `${clicked} of ${targets.length} clicked`);

t.check("every Menu item opens in the tracker rather than navigating away",
  problems.length === 0, problems.join(" | "));

process.exit(t.report() ? 0 : 1);
