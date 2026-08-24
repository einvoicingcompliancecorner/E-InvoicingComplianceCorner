#!/usr/bin/env node
// methodology.mjs — the page that explains how we decide must agree with
// what we actually do.
//
//   node tests/methodology.mjs
//
// Dan, 22 August 2026: "Our strategy around grading sources, and our
// stance on obligation status is probably something we need to document
// for the user to see."
//
// A methodology page is a promise, and the two ways it goes wrong are
// both silent. It can drift from the data — printing a count that was
// true in August — or it can drift from the product, explaining a word
// the tiles no longer use. Neither breaks anything. Both are worse than
// having no page, because a reader who checks and finds it stale learns
// something about the whole site rather than about one number.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("methodology");
const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;
const { d1 } = await openReplayDb();

const env = {
  eicc_content: d1,
  SESSION_SECRET: "test-secret-not-a-real-one",
  ASSETS: {
    async fetch(req) {
      const p = new URL(req.url).pathname;
      try { return new Response(readFileSync(join(REPO, p.replace(/^\//, "")), "utf8")); }
      catch { return new Response("not found", { status: 404 }); }
    },
  },
};
const get = (path) => worker.fetch(
  new Request(`https://e-invoicingcompliancecorner.com${path}`), env, { waitUntil() {} });

const res = await get("/methodology");
const html = await res.text();

t.check("the page is served", res.status === 200, `status ${res.status}`);

// INDEXABLE, DELIBERATELY. It is the page another publication would cite
// and the page a reader is sent to when they disagree with a status.
// Both of those need a URL a crawler can reach — which is also why it is
// not a section of the About modal, which has no URL at all.
t.check("it is indexable", !/noindex/.test(html), "a citable page was marked noindex");
t.check("it declares a canonical URL",
  html.includes('rel="canonical" href="https://e-invoicingcompliancecorner.com/methodology"'));
t.check("it is cacheable — nothing here is per-reader",
  /max-age=\d+/.test(res.headers.get("cache-control") || ""),
  res.headers.get("cache-control"));

// ---- the counts are queried, not written -------------------------------
//
// The site has been bitten by a hand-swept number before: the
// jurisdiction count sat at 62 across thirty-odd files for two days, and
// tests/jurisdiction-count.mjs exists because of it. A page arguing that
// this site is careful with figures cannot print a stale one about
// itself.
const row = (await d1.prepare(`
  SELECT count(*) AS countries, count(*) * 5 AS facts,
         sum((b2g_status = 'unknown') + (b2b_status = 'unknown') + (b2c_status = 'unknown')
           + (archiving_status = 'unknown') + (signature_status = 'unknown')) AS unknowns
    FROM country_headline_facts`).bind().first());

t.check(`the unknown count is live (${row.unknowns} of ${row.facts})`,
  html.includes(String(row.unknowns)) && html.includes(String(row.facts)),
  "the page does not contain the figures the database holds");
t.check(`the jurisdiction count is live (${row.countries})`,
  html.includes(String(row.countries)));

// A STRONGER FORM WAS DRAFTED AND DELETED, and the reason is worth a
// line. It read `before !== 0 || true` -- a check that cannot fail,
// which is the defect menu-routes.mjs was caught by earlier the same
// day. Proving the figure MOVES needs a second render against mutated
// data, which is more machinery than the claim is worth here: the two
// checks above compare the page against a live query, so a hardcoded
// number fails them the moment the data changes.

// ---- it explains the words the tiles actually print ---------------------
//
// The five status words are defined here and printed on every country
// page and every compliance guide. They come from one place — the guides
// subtree — precisely so this page cannot explain a word the product no
// longer uses.
const en = JSON.parse(readFileSync(join(REPO, "i18n", "en.json"), "utf8"));
const hl = (en.guides && en.guides.hl) || {};
const words = [hl.active, hl.planned, hl.voluntary, hl.none, hl.unknown];
t.check("the five status words exist in the guides strings",
  words.every((w) => typeof w === "string" && w), JSON.stringify(words));
const missing = words.filter((w) => w && !html.includes(w));
t.check("the page prints every status word the tiles use",
  missing.length === 0,
  missing.length ? `${missing.join(", ")} explained nowhere — a reader meeting that `
    + "tile has no definition to find" : "");

// ---- the source grade, counted rather than claimed -----------------------
//
// This section replaced a paragraph admitting the grade did not exist.
// Migration 613 made it exist; 614 rewrote the admission. Both halves are
// checked, because either surviving alone is a defect: a table with no
// live numbers behind it, or a page printing the grade one section below
// a paragraph saying it has none.
{
  const tiers = (await d1.prepare(`
    SELECT sh.tier AS tier, count(*) AS n
      FROM cited_sources cs JOIN source_hosts sh ON sh.host = cs.host
     GROUP BY sh.tier`).bind().all()).results;
  const total = tiers.reduce((a, r) => a + r.n, 0);
  t.check(`the tier breakdown is live (${total} citations)`,
    tiers.length > 0 && html.includes(String(total)),
    "the page does not contain the citation total the database holds");
  const wrong = tiers.filter((r) =>
    !html.includes(`${r.n} \u00b7 ${(r.n * 100 / total).toFixed(1)}%`));
  t.check("every tier prints its own count and share", wrong.length === 0,
    wrong.map((r) => `${r.tier}: ${r.n}`).join(", "));

  // ONE DECIMAL, DELIBERATELY. The ungraded tier is under 1% and rounding
  // it to a whole number prints 0%, which reads as "none" -- the opposite
  // of what that row is on the page to admit.
  const ungraded = tiers.find((r) => r.tier === "unknown");
  if (ungraded) {
    t.check("the ungraded tier is not rounded away to nothing",
      !html.includes(`${ungraded.n} \u00b7 0%`),
      "a non-empty tier displayed as 0%");
  }

  // THE JOIN IS ONLY HONEST IF NOTHING FALLS OUT OF IT. An inner join
  // drops a citation from an ungraded host silently, so the page would
  // under-report its own secondary sourcing rather than fail. Migration
  // 613 asserts this too; it is repeated here because this is the page
  // that publishes the number to readers.
  const orphans = await d1.prepare(
    "SELECT count(*) AS n FROM cited_sources WHERE host NOT IN (SELECT host FROM source_hosts)")
    .bind().first();
  t.check("no citation is missing from the totals", orphans.n === 0,
    `${orphans.n} citations come from a host with no grade`);
}

// ---- and it still admits what it does not do ----------------------------
//
// The old admission -- "whether that source is a statute or a professional
// tracker is not yet recorded in a form we can show you" -- became false
// the moment 613 landed, and a page contradicting itself on one screen is
// the exact defect Dan raised about the guides. It has to be gone, and
// replaced by the limitation that genuinely remains.
t.check("the retired admission is gone",
  !/statute or a professional tracker|grade against each country claim/i.test(html),
  "the page says the grade does not exist, one section below printing it");
t.check("and the real remaining gap is stated",
  /publisher/i.test(en.method.gap.p1) && html.includes(en.method.gap.p1),
  "the 'what we do not do yet' section no longer says the grade is per "
  + "publisher rather than per citation");

// ---- reachable ----------------------------------------------------------
const tracker = readFileSync(join(REPO, "einvoicing-compliance-tracker.html"), "utf8");
// A POP-OUT UNDER Menu, not a link under Resources. Dan, 22 August:
// "This needs to go under the menu - menu option and popout, like the
// About this site link." So the menu item is a <button> and the route is
// reached by the modal's iframe, which is why this does not look for an
// href the way the guides check does.
t.check("the Menu dropdown carries a Methodology button",
  /<button class="dropdown-item" id="ddMethodology"/.test(tracker));
t.check("it opens the pop-out rather than navigating",
  tracker.includes("openMethodology()") && tracker.includes('id="methodOverlay"'));
// THE ROUTE AND THE ?frame=1 ARE NOW ASSEMBLED SEPARATELY, because there
// are two of these pop-outs and openDocPopout builds the src for both.
// So both halves are checked: the caller names the right route, and the
// shared builder frames it. Checking only the concatenated literal would
// have started passing vacuously the moment it stopped existing.
t.check("the pop-out names the methodology route",
  /openDocPopout\('methodOverlay','methodFrame','\/methodology'\)/.test(tracker),
  "the modal would load some other page");
t.check("and the shared builder asks for the framed copy",
  /openDocPopout\([^)]*\)\{[\s\S]{0,400}?\?frame=1&lang=/.test(tracker),
  "the modal would load the standalone page, whose own back link "
  + "navigates the iframe to a whole tracker inside a dialog");
t.check("the iframe is not fetched until it is opened",
  !/<iframe id="methodFrame"[^>]*\ssrc=/.test(tracker),
  "a src in the markup downloads the page on every visit to the board");
t.check("the menu label is translatable",
  tracker.includes('data-i18n="menu.methodology"'));
// THE SITEMAP IS A ROUTE NOW, not a file — generated from D1 since 24
// August, because the hand-maintained file had drifted to listing 28 of
// the site's 70 country pages. Reading the response rather than a
// checked-in copy is what keeps this check honest.
const sitemap = await (await get("/sitemap.xml")).text();
t.check("it is in the sitemap", sitemap.includes("/methodology"),
  "a citable page absent from the sitemap");

// ---- four languages -----------------------------------------------------
for (const lang of ["en", "es", "de", "fr"]) {
  const doc = JSON.parse(readFileSync(join(REPO, "i18n", `${lang}.json`), "utf8"));
  const flat = {};
  const walk = (node, prefix) => {
    for (const [k, v] of Object.entries(node || {})) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object") walk(v, key);
      else if (typeof v === "string") flat[key] = v;
    }
  };
  walk(doc.method, "");
  const want = ["title", "intro", "src.h", "src.p1", "unk.h", "unk.count",
    "st.h", "iss.h", "iss.p1", "strict.h", "ev.h", "gap.h", "gap.p1", "fix.h",
    // The tier section. A language missing these renders a table of
    // numbers with no legend, which is worse than not rendering it.
    "tier.h", "tier.lead", "tier.count",
    "tier.w.primary", "tier.d.primary",
    "tier.w.institutional", "tier.d.institutional",
    "tier.w.secondary", "tier.d.secondary",
    "tier.w.unknown", "tier.d.unknown"];
  const gone = want.filter((k) => typeof flat[k] !== "string");
  t.check(`i18n/${lang}.json carries the methodology strings`, gone.length === 0,
    `missing: ${gone.join(", ")}`);
  t.check(`i18n/${lang}.json has the menu label`,
    typeof doc.menu?.methodology === "string");
}

// And it renders in a non-English language rather than falling back
// silently — the failure this whole runbook worries about.
const de = await (await get("/methodology?lang=de")).text();
const deDoc = JSON.parse(readFileSync(join(REPO, "i18n", "de.json"), "utf8"));
t.check("the German render uses the German strings",
  de.includes(deDoc.method.title) && de.includes(deDoc.method.src.h),
  "the page fell back to English for a language that has translations");

// ---- the framed render ---------------------------------------------------
{
  const framed = await (await get("/methodology?frame=1")).text();
  t.check("framed: no back link — it would navigate the iframe",
    !framed.includes('class="back-link"'),
    "the modal would contain a link that loads the tracker inside itself");
  t.check("framed: no language row — the site's own banner governs",
    !framed.includes('class="langs"'));
  t.check("framed: noindex, so only the real URL is crawlable",
    /<meta name="robots" content="noindex,nofollow">/.test(framed),
    "a second indexable copy of the same page");
  t.check("framed: the content itself is unchanged",
    framed.includes(en.method.src.h) && framed.includes(en.method.gap.h));
}

process.exit(t.report() ? 0 : 1);
