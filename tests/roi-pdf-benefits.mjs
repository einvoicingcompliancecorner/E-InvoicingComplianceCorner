#!/usr/bin/env node
// roi-pdf-benefits.mjs — the planner's PDF is two pages, in every
// language, at every jurisdiction count.
//
//   node tests/roi-pdf-benefits.mjs
//
// WHY THIS EXISTS. Dan, 26 August 2026, asking for the unpriced benefits
// on page one: "Importantly, I'd like this information to appear only on
// page one, and not spill into a second page. So page real-estate is
// important."
//
// That is a hard constraint on a document whose height varies with the
// reader's country selection AND with the language, and page one had no
// room to give. Measuring it turned up a defect older than the request:
// THE PDF WAS ALREADY PRINTING THREE PAGES. Real page counts as shipped
// on 25 August, before any of this work:
//
//     lang   n=20   n=30   n=45   n=70
//     en        2      2      3      3
//     de        2      3      3      3
//     fr        2      3      3      3
//     es        3      3      3      3
//
// Spanish broke at twenty jurisdictions, against Dan's rule of 15 August
// that it "should be no longer than 2 pages". Nothing measured it, so
// nothing knew. This file is what knows.
//
// ---- IT COUNTS PAGES IN A REAL PDF, AND THAT IS THE WHOLE POINT ------
//
// The obvious cheap check is to measure the page-one element in the DOM
// under print media and compare it against A4's usable height. I built
// that first, validated it against real page counts, and used it for the
// design work — it is fast and it is directionally right.
//
// IT IS ALSO OPTIMISTIC BY 25-30px AND WOULD HAVE PASSED THIS FEATURE
// BROKEN. The German table candidate measured 24px of headroom by that
// method and printed three pages. The cause is `break-inside: avoid` on
// the benefits grid: a block that does not fit does not part-fill page
// one and continue, it moves WHOLE to page three. So the relationship
// between "content height" and "page count" is a step function, and only
// the page count is the truth.
//
// Hence: render, print to PDF, count the pages in the bytes.
import { readFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { suite } from "./lib/browser.mjs";
import { buildRoiPage } from "./lib/build-page.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("ROI PDF benefits");

/** Pages in a Chromium-produced PDF, without shelling out to poppler.
 *
 *  Two independent readings that must agree: the page-tree /Count, and
 *  the number of /Type /Page objects. They agree on Chromium's output
 *  today (checked against pdfinfo for 1, 2, 3 and 4 page documents). If
 *  Chromium ever changes shape they stop agreeing, and this says so
 *  rather than quietly returning whichever number it found first — a
 *  page-count check that silently reads the wrong field would pass this
 *  whole suite while the document was broken.
 */
function pdfPageCount(path) {
  const txt = readFileSync(path).toString("latin1");
  const counts = [...txt.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  const objs = (txt.match(/\/Type\s*\/Page[^s]/g) || []).length;
  const tree = counts.length ? Math.max(...counts) : null;
  if (tree === null || tree !== objs)
    throw new Error(`cannot read the page count reliably: /Count=${counts} vs /Type/Page=${objs}. `
      + "Chromium's PDF shape has changed and this reader needs updating — "
      + "do NOT relax it, the whole file depends on this number being right.");
  return tree;
}

const LANGS = ["en", "de", "fr", "es"];
const COUNTS = [1, 11, 30, 70];

const files = {};
for (const lang of LANGS) files[lang] = (await buildRoiPage({ lang })).file;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

/** Render the planner, calculate with `n` jurisdictions, print, measure. */
async function render(lang, n) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`file://${files[lang]}`, { waitUntil: "load" });
  await page.waitForTimeout(400);
  const picked = await page.evaluate((c) => {
    const boxes = [...document.querySelectorAll("#countryList input[type=checkbox]")];
    boxes.forEach((b) => { b.checked = false; });
    boxes.slice(0, c).forEach((b) => { b.checked = true; b.dispatchEvent(new Event("change", { bubbles: true })); });
    return boxes.filter((b) => b.checked).length;
  }, n);
  await page.click("#run");
  await page.waitForTimeout(1100);

  const dom = await page.evaluate(() => {
    const pgs = [...document.querySelectorAll("#pdfdoc .pg")];
    if (pgs.length < 2) return { missing: true };
    const cards = [...pgs[0].querySelectorAll(".bgrid .c")];
    return {
      blockOnPage1: !!pgs[0].querySelector(".bgrid"),
      vatOnPage1: !!pgs[0].querySelector(".bvat"),
      cards: cards.map((c) => ({
        key: c.getAttribute("data-b") || "",
        title: (c.querySelector("h4") || {}).textContent || "",
        cited: !!c.querySelector("cite"),
        graded: c.classList.contains("a"),
      })),
      planRows: pgs[0].querySelectorAll("table tbody tr").length,
      folded: !!pgs[0].querySelector("tr.planfold"),
      // The plan's OWN count column, summed. Parsing the names out of the
      // jurisdictions column is what roi-regression.mjs does properly;
      // repeating it badly here undercounted and failed on documents that
      // were correct. The count column is the table's own arithmetic and
      // it does not care what language the row is written in.
      planTotal: [...pgs[0].querySelectorAll("table tbody tr")]
        .reduce((a, tr) => a + (Number(((tr.children[2] || {}).textContent || "").trim()) || 0), 0),
      notesOnPage1: pgs[0].querySelectorAll(".note").length,
      notesOnPage2: pgs[1].querySelectorAll(".note").length,
      page1Text: pgs[0].textContent || "",
    };
  });

  const out = join(REPO, "tests", `.tmp-pdf-${lang}-${n}.pdf`);
  await page.pdf({ path: out, format: "A4", printBackground: true,
    margin: { top: "13mm", bottom: "13mm", left: "12mm", right: "12mm" } });
  await page.close();
  const pages = pdfPageCount(out);
  unlinkSync(out);
  return { picked, pages, dom, errors };
}

// ---- 1. two pages, always ----------------------------------------------
const spills = [];
const seen = [];
let rendered = 0;
for (const lang of LANGS) {
  for (const n of COUNTS) {
    const r = await render(lang, n);
    rendered++;
    seen.push(r);
    if (r.errors.length) spills.push(`${lang} n=${n}: page error — ${r.errors[0]}`);
    if (r.dom.missing) { spills.push(`${lang} n=${n}: fewer than two .pg blocks built`); continue; }
    if (r.pages !== 2) spills.push(`${lang} n=${n}: ${r.pages}-page PDF`);
  }
}
t.check("this check actually rendered something",
  rendered === LANGS.length * COUNTS.length, `${rendered} renders`);
t.check("the PDF is two pages in every language at every jurisdiction count",
  spills.length === 0, spills.join(" | "));

// ---- 2. the block is on page one, which is the whole request -----------
{
  const bad = seen.filter((r) => !r.dom.missing && !(r.dom.blockOnPage1 && r.dom.vatOnPage1));
  t.check("the benefits block and its VAT exclusion are on page one",
    bad.length === 0, `${bad.length} renders without it`);

  // NAMED, NOT SELF-REFERENTIAL. The first version of this compared
  // `cited` against `graded` — and both are derived from the same `src`
  // argument inside benefitCard(), so it compared a variable with itself.
  // Pinning a citation onto the Grade D fraud card left it green. Caught
  // by breaking the renderer on purpose and watching nothing happen.
  //
  // The intended set is written here instead, so the check has something
  // independent to be wrong about. Changing this line is a claim about
  // this site's evidence grading, which lives on page 2 of the same
  // document: Ardent Partners 2025 and ATO / Deloitte are Grade A;
  // penalty exposure and fraud have nothing at that grade to point at.
  const GRADE_A = new Set(["cycle", "paper"]);
  const EXPECTED = ["cycle", "paper", "penalty", "fraud"];
  const wrong = [];
  for (const r of seen) {
    if (r.dom.missing) continue;
    const keys = r.dom.cards.map((c) => c.key);
    if (keys.join(",") !== EXPECTED.join(","))
      { wrong.push(`cards are [${keys}], expected [${EXPECTED}]`); continue; }
    for (const c of r.dom.cards) {
      const shouldCite = GRADE_A.has(c.key);
      if (c.cited !== shouldCite)
        wrong.push(`${c.key}: cited=${c.cited}, but it is ${shouldCite ? "" : "not "}Grade A`);
      if (c.graded !== shouldCite)
        wrong.push(`${c.key}: styled Grade A=${c.graded}, expected ${shouldCite}`);
    }
  }
  t.check("exactly the Grade A cards carry a source, and only those",
    wrong.length === 0, [...new Set(wrong)].slice(0, 4).join(" | "));
}

// ---- 3. the two paragraphs moved, and moved rather than vanished -------
{
  const bad = seen.filter((r) => !r.dom.missing && r.dom.notesOnPage2 < 2);
  t.check("the scope paragraph and the go-live caveat are on page two",
    bad.length === 0,
    "they were moved off page one to make room; if they are on neither page they were DELETED, "
    + "which is a different and worse change than the one that was agreed");
}

// ---- 3b. the PDF does not offer a scope the reader did not choose -----
//
// Dan, 26 August: "remove the sentence saying 'Available on a wider
// scope' and the saving figure from the pdf report ... the additional
// saving is a mute point."
//
// ASSERTED ON THE PDF ONLY, AND THAT BOUNDARY IS THE POINT. The screen
// still states this twice on compliance scope, and roi-regression.mjs
// asserts both carriers there on purpose -- an earlier tidy-up dropped
// one on the understanding the other kept the fact. If this check ever
// starts failing because someone deleted the disclosure everywhere
// rather than from the board paper, that is the defect, not this line.
{
  const offering = seen.filter((r) => !r.dom.missing && /wider scope/i.test(r.dom.page1Text));
  t.check("page one never offers a saving on a scope the reader did not pick",
    offering.length === 0, `${offering.length} renders still carry it`);
}

// ---- 4. the wave table folds, and folding is not dropping -------------
//
// THE FIRST VERSION OF THIS FEATURE TRUNCATED, AND THREE TESTS CAUGHT IT.
// roi-regression's "the PDF plan accounts for every ticked jurisdiction"
// found 15 named of 32 ticked; "a pinned start prints as the pinned date"
// and "the no-deadline row says so in words" found the two row types that
// must never be folded away. A reader who ticks a country and cannot find
// it in the plan has been told it does not need one.
//
// So the checks here are about the fold preserving people, not about a
// row count. The row count is the means; the accounting is the point.
{
  const withPlan = seen.filter((r) => !r.dom.missing && r.dom.planRows > 0);

  // Bounded, or the fold is not doing its job. PLAN_ROW_CAP is 6 and the
  // always-printed tail (pinned rows, the no-deadline row) sits outside
  // it, so a small allowance above the cap is expected and unbounded
  // growth is not.
  const tooTall = withPlan.filter((r) => r.dom.planRows > 9);
  t.check("the wave table stays bounded however many waves there are",
    tooTall.length === 0,
    tooTall.map((r) => `${r.picked} jurisdictions -> ${r.dom.planRows} rows`).slice(0, 3).join(" | "));

  // It must actually have folded somewhere, or the bound above is being
  // met by documents that never had enough waves to need folding.
  t.check("and the fold fired at least once across the matrix",
    withPlan.some((r) => r.dom.folded),
    "no render had enough dated waves to trigger it — the bound above proved nothing");

  // AND NOBODY WAS LOST ON THE WAY. The plan's own count column must
  // still add up to at least what the reader ticked -- at least, because
  // the plan injects the EU-wide obligation as an extra row when a member
  // state is selected. Folding several waves into one row must carry
  // their counts with them; the first version threw the rows away and
  // this number collapsed with them.
  const lost = withPlan.filter((r) => r.dom.planTotal < r.picked);
  t.check("the plan still counts every ticked jurisdiction after folding",
    lost.length === 0,
    lost.map((r) => `${r.picked} ticked, plan counts ${r.dom.planTotal}`).slice(0, 3).join(" | "));
}

await browser.close();

// ---- 5. one fact, two surfaces -----------------------------------------
//
// The card copy is a SHORTER restatement of section 4's rows, because
// section 4's strings are written for a full-width scrolling column and
// put the block 60px over budget. Two copies of a figure is how this
// project's Ardent numbers drifted before. The words may differ; the
// numbers may not.
//
// IT READS THE TRANSLATION DEFAULTS, NOT THE FILE. The first version
// counted occurrences of each figure in roi-render.mjs and required two
// — and passed when the PDF's 2.9 was changed to 3.4, because the
// SECOND occurrence it was counting was a prose comment I had written
// three hundred lines above describing the figure. A check satisfied by
// its own documentation is not a check. This pulls the tj() defaults out
// by key and compares string to string.
{
  const src = readFileSync(join(REPO, "shared", "roi-render.mjs"), "utf8");
  // tj("key", "default") — the default is the English the page ships with
  // when D1 has no row, and it is what these two surfaces are compared on.
  const defaults = new Map();
  for (const m of src.matchAll(/tj\("([\w.]+)",\s*"((?:[^"\\]|\\.)*)"\)/g))
    defaults.set(m[1], m[2]);
  const t4 = (k) => defaults.get(k) || "";
  const figures = (v) => (v.match(/\d+(?:[.,]\d+)?%?/g) || []);

  t.check("the translation defaults could actually be read",
    defaults.size > 50 && t4("pdf.ben.cycleD") && t4("basis.cycle2.just"),
    `${defaults.size} keys parsed — if this collapses, everything below is vacuous`);

  // Each PDF card against the section 4 row it restates. Every number the
  // card prints must appear in the row it came from.
  const PAIRS = [
    ["pdf.ben.cycleD", "basis.cycle2.just", "cycle time and supplier queries"],
    ["pdf.ben.paperD", "basis.paper.just", "paper vs electronic invoice cost"],
  ];
  const drift = [];
  for (const [pdfKey, secKey, what] of PAIRS) {
    const inPdf = figures(t4(pdfKey));
    const inSection = t4(secKey);
    if (!inPdf.length) { drift.push(`${pdfKey} states no figure at all`); continue; }
    for (const f of inPdf)
      if (!inSection.includes(f))
        drift.push(`${what}: the PDF says ${f}, section 4 does not`);
  }
  t.check("every figure on a benefit card also appears in the section 4 row it restates",
    drift.length === 0, drift.join(" | "));
}

process.exit(t.report() ? 0 : 1);
