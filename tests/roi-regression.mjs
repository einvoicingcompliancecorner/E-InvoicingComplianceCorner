#!/usr/bin/env node
// roi-regression.mjs — the ROI & Wave Planner still works.
//
//   node tests/roi-regression.mjs
//
// Every check here exists because something broke. In order:
//
//   * "calculate produces results" — twice now a server-side `${hlp(...)}`
//     has been escaped into the runtime script as `\${hlp(...)}`, which
//     throws "hlp is not defined" and kills the calculate handler. The
//     page looks completely fine until you press the button.
//   * the presets and the subscribed-countries box — the selection drives
//     the integration count, the cost and the wave plan, so a preset that
//     silently selects nothing produces a confident $0 business case.
//   * override + reset — the assumptions panel hardcoded its opening
//     values in HTML while the DEFAULTS registry read them from D1. They
//     agreed only because someone kept them in step by hand.
//   * lanes — parallel workstreams must cut ELAPSED time and leave EFFORT
//     alone. If both move, the model is double-counting.
//   * tooltips — markers render only where a D1 row exists, so a missing
//     migration degrades silently rather than erroring.
import { buildRoiPage } from "./lib/build-page.mjs";
import { launch, suite } from "./lib/browser.mjs";

const t = suite("ROI regression");
const { file } = await buildRoiPage();
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
t.watch(page);
await page.goto(`file://${file}`);

// ---- 1. it calculates at all ----
await page.click("#run");
await page.waitForTimeout(500);
t.check("results panel shown",
  !(await page.locator("#results").getAttribute("class")).includes("hidden"));
t.check("gantt drawn", (await page.locator("#gantt svg").count()) === 1);
const headline = await page.locator("#summary .stat .n").first().textContent();
t.check("summary carries a money figure", /[\d,]+/.test(headline), headline);

// ---- 2. presets actually select ----
await page.click("#selEU"); await page.waitForTimeout(100);
const eu = await page.locator("#countryList input:checked").count();
await page.click("#selNone"); await page.waitForTimeout(100);
const none = await page.locator("#countryList input:checked").count();
await page.click("#selMandate"); await page.waitForTimeout(100);
const mandate = await page.locator("#countryList input:checked").count();
t.check(`EU preset selects (${eu})`, eu > 10);
t.check("clear preset clears", none === 0);
t.check(`mandate preset selects (${mandate})`, mandate > 10);

// ---- 3. the reader's own saved countries ----
await page.check("#useSubs"); await page.waitForTimeout(150);
const subs = await page.locator("#countryList input:checked").count();
t.check("subscribed countries box selects the saved 11", subs === 11, subs);

// ---- 4. overrides are flagged, and reset restores the D1 default ----
await page.click("#assump summary");
await page.fill("#costNow", "15");
await page.waitForTimeout(150);
t.check("override annotates its hint",
  /Your value/.test(await page.locator("#h-costNow").textContent()));
await page.click("#resetDefaults"); await page.waitForTimeout(300);
t.check("reset restores the benchmark default",
  (await page.inputValue("#costNow")) === "9.84", await page.inputValue("#costNow"));

// ---- 5. scope toggle drives the change-management row ----
await page.selectOption("#scope", "both"); await page.waitForTimeout(300);
t.check("change row shown when automation is in scope",
  await page.locator("#chgRow").isVisible());
await page.selectOption("#scope", "compliance"); await page.waitForTimeout(300);
t.check("change row hidden on compliance-only",
  !(await page.locator("#chgRow").isVisible()));

// ---- 6. lanes cut elapsed time without inventing or destroying effort ----
const sumOf = (svg, re) => [...svg.matchAll(re)].map((m) => +m[1]).reduce((a, c) => a + c, 0);
await page.fill("#lanes", "1"); await page.click("#run"); await page.waitForTimeout(400);
const one = await page.locator("#gantt svg").innerHTML();
await page.fill("#lanes", "5"); await page.click("#run"); await page.waitForTimeout(400);
const five = await page.locator("#gantt svg").innerHTML();
const e1 = sumOf(one, /(\d+)w elapsed/g), e5 = sumOf(five, /(\d+)w elapsed/g);
const f1 = sumOf(one, /(\d+)w effort/g), f5 = sumOf(five, /(\d+)w effort/g);
t.check(`lanes cut elapsed time (${e1}w -> ${e5}w)`, e5 < e1);
t.check(`lanes leave effort alone (${f1}w = ${f5}w)`, f1 === f5);

// ---- 7. every tooltip marker has real text behind it ----
// A floor, not an exact count: two markers are conditional on the country
// selection (the no-mandate band and the ViDA note), so an exact number
// is brittle and told us nothing the day it moved. The invariant that
// matters is that no marker is empty.
const thin = await page.evaluate(() => [...document.querySelectorAll(".hlp")]
  .filter((el) => (el.querySelector(".tip")?.textContent || "").length < 60).length);
const markers = await page.locator(".hlp").count();
t.check("no thin or empty tooltips", thin === 0, thin);
t.check(`tooltip markers present (${markers} >= 28)`, markers >= 28);

// ---- 7b. the Ardent evidence the page used to deny it had ----
// Dan asked whether the sources actually benchmark "faster cycle time &
// fewer supplier queries". They do — and the page said the only figure
// available was one NHS anecdote while its own Grade A card claimed
// Ardent for cycle time and exceptions, with both benchmark rows sitting
// in D1 rendered nowhere. Two statements on one screen, one of them
// false, and no check could see it because both were prose.
const direct = await page.locator("#direct").innerText();
t.check("the cycle-time row carries Ardent's supplier-inquiry split",
  /12\.8%/.test(direct) && /24\.0%/.test(direct), direct.slice(0, 160));
t.check("and no longer says the only figure is an anecdote",
  !/only figures available are one NHS anecdote/i.test(direct));

const cycTip = await page.evaluate(() => {
  const el = [...document.querySelectorAll("#direct .ev")]
    .find((e) => /2\.9 vs 13\.5 days/.test(e.textContent));
  return el ? el.querySelector(".tip").textContent : "";
});
// The figure is quoted; the reason it proves nothing has to be quoted
// with it, or citing it is worse than omitting it.
t.check("the cycle-time citation explains that the gap is definitional",
  /tautology/.test(cycTip) && /Best-in-Class/.test(cycTip), cycTip.slice(0, 140));

const excTip = await page.evaluate(() => {
  const el = [...document.querySelectorAll("#direct .ev")]
    .find((e) => /exception rate/.test(e.textContent));
  return el ? el.querySelector(".tip").textContent : "";
});
t.check("and the exception rate warns it is not the model's error rate",
  /Not interchangeable/.test(excTip), excTip.slice(0, 140));

// ---- 8. the sanity guards fire on the case that needed migration 520 ----
// Denmark, Portugal and Brazil each hold a dated live obligation the
// arrivals board does not show. Before obligation_status existed this was
// not expressible: an off-board row was indistinguishable from a
// superseded one, so the planner scheduled Denmark for 2030 while it has
// work due in 2027 and said nothing.
await page.click("#selNone");
await page.evaluate(() => {
  [...document.querySelectorAll("#countryList label")].forEach((l) => {
    if (/Denmark|Portugal|Brazil/.test(l.textContent)) l.querySelector("input").click();
  });
});
await page.click("#run"); await page.waitForTimeout(500);
const guards = await page.locator("#guards").innerText();
t.check("the mistimed-obligation guard fires", /earlier than the date this plan plans for/.test(guards),
  guards.slice(0, 120));
t.check("it names the countries and both dates",
  ["Denmark", "Portugal", "Brazil", "2027-01-01", "2028-01-01"].every((x) => guards.includes(x)),
  guards.slice(0, 200));

// ---- 9. the adjust panel actually rearranges the plan ----
const waveText = () => page.evaluate(() =>
  [...document.querySelectorAll("#gantt svg text")].map((n) => n.textContent).filter((x) => /w elapsed/.test(x)));
await page.click("#selMandate"); await page.waitForTimeout(150);
await page.click("#run"); await page.waitForTimeout(600);
const before = await waveText();
await page.evaluate(() => { document.getElementById("adjust").open = true; });
await page.waitForTimeout(200);
const who = await page.locator("[data-ovr-dl]").first().getAttribute("data-ovr-dl");
const waves = await page.locator(`[data-ovr-dl="${who}"] option`).allTextContents();
await page.selectOption(`[data-ovr-dl="${who}"]`, waves[waves.length - 1].split(" ")[0]);
await page.waitForTimeout(600);
const after = await waveText();
t.check(`moving a country between waves redraws the chart (${before.length} -> ${after.length} waves)`,
  JSON.stringify(before) !== JSON.stringify(after));
t.check("the panel stays open across the redraw",
  await page.locator("#adjust").evaluate((e) => e.open));
t.check("the moved country is marked adjusted",
  (await page.locator("#adjustRows .tag").count()) >= 1);

// A pinned start that lands after the deadline must be shown, not hidden:
// modelling an accepted late position is legitimate, silently drawing it
// as on time is not.
await page.fill(`[data-ovr-start="${who}"]`, "2031-06-01");
await page.dispatchEvent(`[data-ovr-start="${who}"]`, "change");
await page.waitForTimeout(600);
t.check("a pinned start past the deadline is called out",
  /pinned start date finishes after the deadline/i.test(await page.locator("#guards").innerText()));

// ---- 10. countries with no fixed deadline are adjustable too ----
// Left out of the first version on the reasoning that there is no wave to
// move them between. True, and beside the point: "start any time" is a
// default, and turning it into a date is most of what planning is.
await page.click("#selNone");
await page.evaluate(() => {
  [...document.querySelectorAll("#countryList label")].forEach((l) => {
    if (/^\s*(France|Australia|Canada)/.test(l.textContent)) l.querySelector("input").click();
  });
});
await page.click("#run"); await page.waitForTimeout(600);
// Open it idempotently. Clicking the summary TOGGLES, and showResults()
// deliberately preserves the open state across a rebuild — so a click
// here closes a panel that a previous section left open.
await page.evaluate(() => { document.getElementById("adjust").open = true; });
await page.waitForTimeout(250);
const starts = await page.evaluate(() =>
  [...document.querySelectorAll("[data-ovr-start]")].map((e) => e.getAttribute("data-ovr-start")));
const dls = await page.evaluate(() =>
  [...document.querySelectorAll("[data-ovr-dl]")].map((e) => e.getAttribute("data-ovr-dl")));
t.check("undated countries get a start field", starts.includes("Australia") && starts.includes("Canada"), starts);
t.check("but no wave field, because they have no wave", !dls.includes("Australia"), dls);

const bandLabels = () => page.evaluate(() =>
  [...document.querySelectorAll("#gantt svg text")].map((n) => n.textContent)
    .filter((x) => /ANY TIME|PINNED|CLAMPED/.test(x)));
// Far enough out to be after contracting completes in ANY selection.
// A nearer date is a test of where the programme bar happens to land,
// which depends on lanes, scope and the earliest deadline selected —
// three things earlier sections of this file have already changed.
await page.fill('[data-ovr-start="Australia"]', "2035-01-01");
await page.dispatchEvent('[data-ovr-start="Australia"]', "change");
await page.waitForTimeout(600);
t.check("a pinned discretionary start is honoured and labelled",
  (await bandLabels()).includes("PINNED"), await bandLabels());

// The floor still holds: nothing may start before contracting completes,
// so a pin earlier than that is clamped rather than silently obeyed.
await page.fill('[data-ovr-start="Australia"]', "2024-01-01");
await page.dispatchEvent('[data-ovr-start="Australia"]', "change");
await page.waitForTimeout(600);
t.check("a pin before contracting completes is clamped, and says so",
  (await bandLabels()).includes("CLAMPED"), await bandLabels());

// ---- 11. editing in the panel neither moves the page nor drops focus ----
// The panel sits near the bottom of a long page. showResults() used to
// call scrollIntoView() on the top of the results unconditionally, so
// every edit in a date field threw the reader back up to the Calculate
// button; and renderAdjust() replaces the panel's DOM wholesale, so the
// field being typed into stopped existing mid-edit. Either alone is
// irritating. Together they made the panel unusable for the one thing it
// is for, which is trying several dates in a row and watching the chart.
await page.evaluate(() =>
  document.querySelector('[data-ovr-start="Canada"]').scrollIntoView({ block: "center" }));
await page.waitForTimeout(300);
const yBefore = await page.evaluate(() => window.scrollY);
await page.fill('[data-ovr-start="Canada"]', "2033-03-01");
await page.dispatchEvent('[data-ovr-start="Canada"]', "change");
await page.waitForTimeout(800);
const yAfter = await page.evaluate(() => window.scrollY);
t.check(`editing a pinned date leaves the viewport where it was (${yBefore} -> ${yAfter})`,
  Math.abs(yAfter - yBefore) < 40, `${yBefore} -> ${yAfter}`);
t.check("and focus returns to the field being edited",
  (await page.evaluate(() => document.activeElement?.getAttribute("data-ovr-start"))) === "Canada",
  await page.evaluate(() => document.activeElement?.tagName));

// The opposite failure is just as real: make scrolling opt-in and forget
// to opt the button in, and Calculate appears to do nothing on a page
// where the results are off-screen.
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(200);
const yBottom = await page.evaluate(() => window.scrollY);
await page.click("#run");
await page.waitForTimeout(900);
const yRun = await page.evaluate(() => window.scrollY);
t.check(`but pressing Calculate still scrolls to the results (${yBottom} -> ${yRun})`,
  yRun < yBottom - 40, `${yBottom} -> ${yRun}`);

await page.evaluate(() => { document.getElementById("adjust").open = true; });
await page.click("#adjustReset"); await page.waitForTimeout(600);
t.check("reset clears discretionary pins too",
  !(await bandLabels()).some((l) => /PINNED|CLAMPED/.test(l)), await bandLabels());

// ---- back to the dated case for the final reset check ----
await page.click("#selMandate"); await page.waitForTimeout(150);
await page.click("#run"); await page.waitForTimeout(600);
t.check("reset restores the computed plan exactly",
  JSON.stringify(await waveText()) === JSON.stringify(before));

// ---- 12. the platform fee is derived from the reader's own volumes ----
// It used to be a flat 45,000 a year whatever the footprint, which made
// it the only cost on the page that ignored the volumes the entire
// benefit side is computed from. A model whose savings are linear in
// volume and whose costs are constant always eventually says yes.
await page.evaluate(() => { document.getElementById("assump").open = true; });
await page.waitForTimeout(200);
t.check("platform fee opens derived from the opening volumes (0.40 x 150,000)",
  (await page.inputValue("#cPlat")) === "60000", await page.inputValue("#cPlat"));

await page.fill("#volAP", "500000"); await page.waitForTimeout(250);
t.check("it follows a volume change (0.40 x 550,000)",
  (await page.inputValue("#cPlat")) === "220000", await page.inputValue("#cPlat"));
t.check("and the hint shows its own arithmetic",
  /550,000 invoices\s*×\s*\$0\.40/.test(await page.locator("#h-cPlat").textContent()),
  await page.locator("#h-cPlat").textContent());

// A vendor quote beats our multiplier permanently. Getting this wrong in
// the other direction — recomputing over a number someone typed — would
// be worse than never deriving it at all.
await page.fill("#cPlat", "125000"); await page.waitForTimeout(200);
await page.fill("#volAR", "250000"); await page.waitForTimeout(250);
t.check("a typed vendor price stops tracking the volumes",
  (await page.inputValue("#cPlat")) === "125000", await page.inputValue("#cPlat"));
t.check("and is flagged as an override",
  /Your value/.test(await page.locator("#h-cPlat").textContent()));

await page.selectOption("#cur", "GBP"); await page.waitForTimeout(400);
t.check("the per-invoice rate is quoted in the selected currency",
  /£0\.30/.test(await page.locator("#h-cPlat").textContent()),
  await page.locator("#h-cPlat").textContent());
await page.selectOption("#cur", "USD"); await page.waitForTimeout(400);

await page.click("#resetDefaults"); await page.waitForTimeout(400);
t.check("reset restores the derivation at the CURRENT volumes, not the opening ones",
  (await page.inputValue("#cPlat")) === "300000", await page.inputValue("#cPlat"));
await page.fill("#volAP", "100000"); await page.fill("#volAR", "50000");
await page.waitForTimeout(250);

// ---- 13. the countries list is a table, so it lines up like one ----
// Four attributes per row, each previously starting wherever the last one
// happened to end. The check that means "aligned in columns" is literally
// that: every row's nth cell starts at the same x.
const align = await page.evaluate(() => {
  const rows = [...document.querySelectorAll("#countryList .crow")];
  const lefts = rows.map((r) => [...r.children].map((e) => Math.round(e.getBoundingClientRect().left)));
  return { rows: rows.length, uniq: [1, 2, 3, 4].map((i) => new Set(lefts.map((l) => l[i])).size) };
});
t.check(`all ${align.rows} country rows share one column grid`,
  align.rows > 60 && align.uniq.every((u) => u === 1), align.uniq);

const headAligned = await page.evaluate(() => {
  const cells = (el) => [...el.children].map((e) => Math.round(e.getBoundingClientRect().left)).slice(1);
  return JSON.stringify(cells(document.querySelector("#countryList .chead")))
      === JSON.stringify(cells(document.querySelector("#countryList .crow")));
});
t.check("the column headings sit over their own columns", headAligned);

await page.evaluate(() => { document.querySelector(".countries").scrollTop = 400; });
await page.waitForTimeout(200);
const stuck = await page.evaluate(() => {
  const box = document.querySelector(".countries");
  return Math.round(box.querySelector(".chead").getBoundingClientRect().top
                  - box.getBoundingClientRect().top);
});
t.check("and survive the scroll (a heading you scroll past labels nothing)",
  Math.abs(stuck) <= 2, stuck);

await browser.close();
process.exit(t.report() ? 0 : 1);
