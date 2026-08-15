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

// The citation lives in the notes panel now, not in the table cell — the
// row was condensed, and dropping a grade-A citation instead of moving it
// is the orphaning this project has already found three times.
await page.evaluate(() => { document.getElementById("notes").open = true; });
await page.waitForTimeout(200);
const cycTip = await page.evaluate(() => {
  const el = [...document.querySelectorAll("#notes .ev")]
    .find((e) => e.firstChild && /2\.9 vs 13\.5 days/.test(e.firstChild.textContent || ""));
  return el ? el.querySelector(".tip").textContent : "";
});
await page.evaluate(() => { document.getElementById("notes").open = false; });
// The figure is quoted; the reason it proves nothing has to be quoted
// with it, or citing it is worse than omitting it.
t.check("the cycle-time citation explains that the gap is definitional",
  /tautology/.test(cycTip) && /Best-in-Class/.test(cycTip), cycTip.slice(0, 140));

// Match the MARKER's own label, not the element's textContent — that
// includes the tooltip, and three markers on this row now mention an
// exception rate, so the loose match started picking the wrong one.
const excTip = await page.evaluate(() => {
  const el = [...document.querySelectorAll("#direct .ev")]
    .find((e) => e.firstChild && /not Ardent/.test(e.firstChild.textContent || ""));
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

// ---- 14. the indirect layer knows how big the business is ----
// It did not. `min(complexCount * 0.15, 3)` had no volume term at all, so
// Dan typed 1,000,000 into the volume box and watched direct savings rise
// tenfold while the indirect line sat at $186,000 — and, because the
// platform fee now scales, the compliance-only case flipped to "never
// pays back". The two checks that matter are opposites: the number must
// now MOVE with volume, and it must NOT have moved at the default volume,
// because this change was about shape and not magnitude.
const indirect = () => page.locator("#indirect tbody tr").first();
const indValue = async () =>
  Number((await indirect().locator("td").last().innerText()).replace(/[^\d]/g, ""));

await page.click("#selEU"); await page.waitForTimeout(200);
await page.fill("#volAP", "100000"); await page.fill("#volAR", "50000");
await page.click("#run"); await page.waitForTimeout(700);
const ind100k = await indValue();
// 8.333 implied FTE x 0.20 cap x $116,800 = 194,667. Migration 526
// preserved the old $186,000 exactly; 527 moved it deliberately, by
// correcting the rate UP and the ceiling DOWN in the same migration
// because they multiply. The two corrections nearly cancel, which is
// what makes the pair defensible rather than convenient.
t.check("the default volume returns the calibrated figure",
  ind100k === 194667, ind100k);
t.check("1.67 FTE at the tax rate, not the data-entry rate",
  /1\.67 FTE × \$116,800/.test(await indirect().innerText()), await indirect().innerText());

await page.fill("#volAP", "1000000"); await page.fill("#volAR", "500000");
await page.click("#run"); await page.waitForTimeout(800);
const ind1m = await indValue();
// Tolerance of a few dollars: both figures are rounded for display, so
// exact equality would be testing the rounding rather than the scaling.
t.check(`ten times the volume, ten times the saving (${ind100k} -> ${ind1m})`,
  Math.abs(ind1m - ind100k * 10) <= 10, `${ind100k} -> ${ind1m}`);
t.check("and the row shows the APQC-implied headcount it scaled from",
  /83\.3 AP FTE/.test(await indirect().innerText()), await indirect().innerText());

// The cap is still there and still binding at 25 jurisdictions — the
// difference is that it now says so. An invisible ceiling is
// indistinguishable from a model that has stopped working.
t.check("the binding cap is called out",
  /cap is binding/.test(await page.locator("#guards").innerText()));

await page.click("#selNone");
await page.evaluate(() => {
  [...document.querySelectorAll("#countryList label")].forEach((l) => {
    if (/^\s*(France|Italy)/.test(l.textContent)) l.querySelector("input").click();
  });
});
await page.click("#run"); await page.waitForTimeout(700);
t.check("and stays quiet when the cap is not binding",
  !/cap is binding/.test(await page.locator("#guards").innerText()));

// ---- 15. two FTE rates, and the decomposition that must not double count ----
// One field used to price both a tax professional reconciling clearance
// regimes and a mailroom clerk keying invoices — roles that differ by
// roughly double and offshore completely differently. The data-entry rate
// exists to restate a saving already counted, never to add one, because
// the ATO source says the per-invoice benchmark IS the labour.
await page.click("#selEU"); await page.waitForTimeout(200);
await page.fill("#volAP", "100000"); await page.fill("#volAR", "50000");
await page.click("#run"); await page.waitForTimeout(700);

t.check("both rates are in the assumptions panel, and differ",
  (await page.inputValue("#fteCost")) === "116800"
  && (await page.inputValue("#fteEntry")) === "54000",
  `${await page.inputValue("#fteCost")} / ${await page.inputValue("#fteEntry")}`);

const directTotal = Number((await page.locator("#direct tbody tr").first()
  .locator("td").last().innerText()).replace(/[^\d]/g, ""));
const head = await page.locator("#direct .note").last().innerText();
t.check("the headcount line states the capture FTE it derived",
  /3\.6 FTE keying invoices today/.test(head), head.slice(0, 200));
t.check("and the FTE it releases",
  /2\.1/.test(head) && /released/.test(head), head.slice(0, 260));

// The load-bearing clause. Without it this is a double count, and it is
// the first thing a finance committee would challenge — so it stays
// INLINE even after the caveat pass, rather than moving to the panel.
t.check("it says inline that this is a restatement, not an addition",
  /rather than an addition to it/i.test(head), head);

// The full reconciliation moved into the notes panel rather than being
// dropped: condensing the page must not lose the arithmetic.
await page.evaluate(() => { document.getElementById("notes").open = true; });
await page.waitForTimeout(200);
const notesText = await page.locator("#notes").innerText();
t.check("and the panel still reconciles it against the row it decomposes",
  notesText.includes(String(directTotal.toLocaleString("en-US"))), notesText.slice(0, 300));

// Guard 6: the bottom-up labour cannot exceed the top-down saving it is a
// component of. Forced by pushing the data-entry rate far past market.
await page.evaluate(() => { document.getElementById("assump").open = true; });
await page.fill("#fteEntry", "900000");
await page.click("#run"); await page.waitForTimeout(700);
t.check("a data-entry rate that outruns the whole saving is called out",
  /capture headcount is worth more than the whole processing saving/i
    .test(await page.locator("#guards").innerText()));
await page.click("#resetDefaults"); await page.waitForTimeout(400);
t.check("and reset restores both rates",
  (await page.inputValue("#fteEntry")) === "54000"
  && (await page.inputValue("#fteCost")) === "116800");

// ---- 16. compliance-only banks what compliance actually delivers ----
// Dan, from customer conversations: every enterprise he has spoken to in
// two to three years meets mandates alone and never bundles AP
// automation, because that programme is too large to land in one go. The
// model assumed the opposite — `banked = scope === 'both'`, so the entire
// direct total was multiplied by zero on the scope everybody picks, and
// the page told them the real answer was to widen scope. Now each row
// declares what it depends on.
await page.click("#selEU"); await page.waitForTimeout(200);
await page.fill("#volAP", "100000"); await page.fill("#volAR", "50000");
await page.selectOption("#scope", "compliance"); await page.waitForTimeout(300);
await page.click("#run"); await page.waitForTimeout(700);

const totalRow = () => page.locator("#direct tbody tr").last();
const bankedTotal = async () =>
  Number((await totalRow().locator("td").last().innerText()).replace(/[^\d]/g, ""));

// 590,400 x 0.4286 capture share + 195,000 AR = 448,045. Rework is held
// out deliberately: it is the weakest-evidenced row and would have been
// the largest single beneficiary.
const complianceBanked = await bankedTotal();
t.check(`compliance-only banks capture and issuing, not nothing (${complianceBanked})`,
  complianceBanked === 448045, complianceBanked);
t.check("and states what is left unlocked against the full total",
  /697,355/.test(await totalRow().innerText()) && /1,145,400/.test(await totalRow().innerText()),
  await totalRow().innerText());

// The tags are the whole defence of this change: the reasoning has to be
// on the row, not in a footnote, because the change makes the answer
// better and that is exactly when a reader should be able to audit it.
const tags = await page.evaluate(() =>
  [...document.querySelectorAll("#direct .tag.bank, #direct .tag.unbank")].map((e) => e.textContent));
t.check("every direct row says whether it banks on compliance",
  tags.includes("43% banks") && tags.includes("banks") && tags.includes("not banked"), tags);

const directText = await page.locator("#direct").innerText();
t.check("rework is not banked on a compliance scope",
  /not banked/.test(directText) && !/banks in full/.test(directText));

await page.selectOption("#scope", "both"); await page.waitForTimeout(400);
await page.click("#run"); await page.waitForTimeout(700);
t.check("the fuller programme banks the lot",
  (await bankedTotal()) === 1145400, await bankedTotal());

// The superseded sentiment, asserted gone. The old copy told the reader
// compliance-only banks nothing and the answer is to widen scope; the
// arithmetic no longer works that way and prose saying so would describe
// a page that does not exist.
await page.selectOption("#scope", "compliance"); await page.waitForTimeout(400);
await page.click("#run"); await page.waitForTimeout(700);
const resultsText = await page.locator("#results").innerText();
t.check("and the old 'banks nothing, widen scope' framing is gone",
  !/without banking any of it/.test(resultsText)
  && !/actual investment case for doing both at once/.test(resultsText));

// ---- 17. the rework row is bounded by what Ardent actually measured ----
// Dan asked whether Ardent substantiates the rework metric. It gives the
// mechanism — "eInvoicing drives process efficiencies by eliminating data
// capture and manual data entry" — but publishes no breakdown of
// exceptions by cause and no quantified reduction. What it does give is a
// ceiling: Best-in-Class run 11.1% exceptions against 20.9%, a 9.8-point
// gap covering every cause. The model may not claim more than that.
await page.evaluate(() => { document.getElementById("assump").open = true; });
await page.waitForTimeout(200);
t.check("the 80% is a real input now, not a literal",
  (await page.inputValue("#errElim")) === "80", await page.inputValue("#errElim"));
t.check("and the default sits inside the observed gap (10% x 80% = 8.0 < 9.8)",
  !/removes more exceptions than separate the best quartile/i
    .test(await page.locator("#guards").innerText()));

await page.fill("#errRate", "20");
await page.click("#run"); await page.waitForTimeout(700);
t.check("claiming more than the best quartile achieves is called out",
  /removes more exceptions than separate the best quartile/i
    .test(await page.locator("#guards").innerText()),
  (await page.locator("#guards").innerText()).slice(0, 160));

await page.click("#resetDefaults"); await page.waitForTimeout(400);
await page.click("#run"); await page.waitForTimeout(700);
t.check("reset restores the elimination assumption too",
  (await page.inputValue("#errElim")) === "80");

// The $45 is ours until it is theirs, and the page now says which.
const reworkRow = await page.locator("#direct tbody tr").nth(2).innerText();
t.check("an unchanged rework cost is labelled as our estimate, not the reader's",
  /our estimate, not yours/.test(reworkRow), reworkRow.slice(0, 200));
await page.fill("#errCost", "70");
await page.click("#run"); await page.waitForTimeout(700);
t.check("and becomes theirs once they change it",
  /your rework cost/.test(await page.locator("#direct tbody tr").nth(2).innerText()));

// ---- 18. the page stays readable ----
// Dan, 15 Aug 2026: "The UI is difficult to read and follow because there
// are so many caveats and assumptions... could those be hidden in a
// popout." Measured at the time: 1,539 words of always-on prose across 27
// blocks before the reader reaches a number, roughly half of it added in
// the preceding two days while making the model defensible.
//
// That is the failure mode of writing caveats one at a time — each is a
// paragraph you can defend, and nobody reads the page end to end and asks
// whether the sum is still a tool. So the budget is a test, not a
// resolution. It is the only check here that guards a quality rather than
// a fact.
// Reload first. Earlier sections leave the assumptions and adjust panels
// open and the volumes edited, and a budget measured against that state
// is not the state any reader arrives in.
await page.goto(`file://${file}`);
await page.click("#selEU"); await page.waitForTimeout(200);
await page.click("#run"); await page.waitForTimeout(800);
const prose = await page.evaluate(() => {
  const words = (s) => (s.trim().match(/\S+/g) || []).length;
  let body = 0, guards = 0;
  document.querySelectorAll(".note, .hint, p.lede").forEach((el) => {
    if (el.closest("#notes")) return;              // behind the click, exempt
    const t = el.innerText.trim(); if (words(t) < 12) return;
    const id = el.closest("[id]") ? el.closest("[id]").id : "";
    if (id === "guards") guards += words(t); else body += words(t);
  });
  return { body, guards };
});
t.check(`always-on prose stays within budget (${prose.body} words, ceiling 650, was 1539)`,
  prose.body <= 650, prose.body);
// Guards are exempt and must stay that way: they are conditional, they
// fire on a specific bad state, and hiding a warning behind a click would
// inevert their whole purpose. Asserted non-zero so a future tidy-up
// cannot quietly sweep them into the panel along with everything else.
t.check(`conditional guards are still inline (${prose.guards} words)`, prose.guards > 0);

// ---- 19. the notes panel holds what the body gave up ----
t.check("the panel is closed on arrival",
  !(await page.locator("#notes").evaluate((e) => e.open)));
const beforeOpen = await page.locator("#results").innerText();
t.check("so its reasoning is not in the body text",
  !/ATO \/ Deloitte task times — receipt 7/.test(beforeOpen));

await page.locator("a.nlink").first().click();
await page.waitForTimeout(600);
t.check("a 'why' link opens it", await page.locator("#notes").evaluate((e) => e.open));

const notes = await page.locator("#notes").innerText();
["What compliance alone banks", "Why rework is held back",
 "Headcount restates", "carries no value on purpose",
 "Grade A", "Grade D", "Corrections applied"].forEach((phrase) =>
  t.check(`the panel carries: ${phrase}`, notes.includes(phrase)));

await browser.close();
process.exit(t.report() ? 0 : 1);
