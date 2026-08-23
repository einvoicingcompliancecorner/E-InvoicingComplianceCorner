// guides-fit-harness.mjs — render every country and measure it against the
// one-page rule. This is how the rule is enforced: the fitter runs in the
// browser, so the only honest check is to print all seventy and count.
// Not wired into run-all yet — the routes it will guard do not exist.
import { writeFileSync } from "node:fs";
import { openReplayDb } from "./replay-db.mjs";
import { getGuideBundle, renderGuideDocument, GUIDE_STYLE, GUIDE_FIT_SCRIPT } from "../../shared/guides-render.mjs";
import { loadPlaywright } from "./browser.mjs";
const TODAY = "2026-08-21";
const { d1 } = await openReplayDb();
const { results } = await d1.prepare("SELECT name_en FROM countries WHERE code != 'EU' ORDER BY name_en").bind().all();
const names = results.map(r => r.name_en);
const bundle = await getGuideBundle(d1, names, "en");
const { html, condensed } = renderGuideDocument({ bundle, order: names, lang: "en", strings: {},
  today: TODAY, siteOrigin: "https://e-invoicingcompliancecorner.com" });
writeFileSync("/tmp/all70.html", `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${GUIDE_STYLE}</style></head><body>${html}<scr`+`ipt>${GUIDE_FIT_SCRIPT}</scr`+`ipt></body></html>`);
const { chromium } = await loadPlaywright();
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1100, height: 1000 } });
await p.goto("file:///tmp/all70.html", { waitUntil: "load" });
await p.waitForTimeout(8000);
console.log("fitted:", await p.evaluate(()=>document.documentElement.getAttribute("data-fitted")));
const PAGE_PX = 1010;
const m = await p.evaluate((PP) => [...document.querySelectorAll(".country")].map(el => ({
  n: (el.querySelector("h2")||{}).textContent, px: Math.round(el.getBoundingClientRect().height),
  zoom: el.style.zoom || "1",
  cards: el.querySelectorAll(".statstrip.hl > .hcard").length,
  // STRUCTURE, NOT JUST COUNTS. An unbalanced </div> inside one of these
  // template literals does not throw and does not fail any other check --
  // the browser silently reparents whatever came next. On 22 August a
  // missing closer on the timeline block put the full-width newsletter
  // band inside the two-column flow on all seventy pages, and the only
  // way it was caught was looking at a screenshot. These say where the
  // two full-width bands must sit.
  // A TIMELINE OUT OF ORDER IS WORSE THAN A SHORT ONE. The earlier
  // milestones the window leaves out used to render as a second list
  // appended underneath, so eight countries printed forwards and then
  // jumped backwards -- on the one component whose order carries its
  // meaning, and where a reader scanning for "what next" reads the last
  // row. Checked on the VISIBLE rows, because the fitter decides how many
  // of the hidden ones to reveal.
  tlDates: [...el.querySelectorAll(".tl li")]
    .filter((li) => li.style.display !== "none")
    .map((li) => li.querySelector(".d").textContent.trim()),
  newsDirect: el.querySelector(".news") ? el.querySelector(".news").parentElement === el : true,
  stripDirect: el.querySelector(".statstrip") ? el.querySelector(".statstrip").parentElement === el : true,
  facts: el.querySelectorAll(".statstrip.hl .seg").length
       + el.querySelectorAll(".statstrip.hl > .hcard").length - 1,
  pages: +(el.getBoundingClientRect().height / PP).toFixed(2) })), PAGE_PX);
// THE SIX TILES ARE NOT NEGOTIABLE, so the harness checks them rather than
// printing them. Dan asked for the same facts "consistently on each
// country page"; a fitter that shed one to save 8px would satisfy the
// one-page rule by breaking the thing the page is for. Six since
// 23 August, when e-Reporting joined the strip. The fitter's ladder
// deliberately has no rung that touches them -- this is what proves it.
// THREE CARDS, FIVE FACTS. The strip was five cards until 22 August, when
// Dan asked for the three business segments to be combined ("we should
// only have 5 boxes / cards at the top of the page. We can combine B2G,
// B2B and B2C into one card"). The card count changed; the number of
// facts a reader gets did not, and that is the half worth asserting.
const MONTHS_ORD = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const sortKey = (d) => {
  const [mo, y] = d.split(" ");
  return `${y}-${String(MONTHS_ORD.indexOf(mo) + 1).padStart(2, "0")}`;
};
const unordered = m.filter((x) => {
  const keys = x.tlDates.map(sortKey);
  return JSON.stringify(keys) !== JSON.stringify([...keys].sort());
});
console.log(`timelines: ${m.length - unordered.length}/${m.length} in chronological order`);
if (unordered.length) {
  console.log("OUT OF ORDER: " + unordered.map(x => `${x.n} (${x.tlDates.join(" | ")})`).join("; "));
  process.exitCode = 1;
}

const misplaced = m.filter(x => !x.newsDirect || !x.stripDirect);
console.log(`full-width bands: ${m.length - misplaced.length}/${m.length} countries have the strip and newsletter as direct children`);
if (misplaced.length) {
  console.log("REPARENTED: " + misplaced.map(x => x.n).join(", ")
    + "  — an unbalanced </div> in a template literal has nested a full-width band inside .cols");
  process.exitCode = 1;
}

const shortTiles = m.filter(x => x.cards !== 4 || x.facts !== 6);
console.log(`headline strip: ${m.length - shortTiles.length}/${m.length} countries show 4 cards carrying all 6 facts`);
if (shortTiles.length) {
  console.log("MALFORMED STRIP: " + shortTiles.map(x => `${x.n} (${x.cards} cards, ${x.facts} facts)`).join(", "));
  process.exitCode = 1;
}
const zoomed = m.filter(x => x.zoom !== "1");
console.log(`scaled to fit: ${zoomed.length} of ${m.length}` + (zoomed.length ? " — " + zoomed.map(x=>`${x.n} ${Math.round(+x.zoom*100)}%`).join(", ") : ""));
await b.close();
const over = m.filter(x => x.pages > 1.0);
console.log(`countries: ${m.length}`);
console.log(`OVER ONE PAGE: ${over.length}`);
for (const o of over.sort((a,b)=>b.pages-a.pages).slice(0,10)) console.log(`   ${o.n} ${o.px}px = ${o.pages}`);
const sorted=[...m].sort((a,b)=>b.px-a.px);
console.log(`tallest that fits: ${sorted.find(x=>x.pages<=1).n} ${sorted.find(x=>x.pages<=1).px}px`);
console.log(`median fill: ${(m.map(x=>x.pages).sort((a,b)=>a-b)[Math.floor(m.length/2)]*100).toFixed(0)}% of a page`);
console.log(`condensed countries: ${condensed.length}; rows capped on ${condensed.filter(c=>c.dropped.includes("factRows")).length}`);
process.exit(0);
