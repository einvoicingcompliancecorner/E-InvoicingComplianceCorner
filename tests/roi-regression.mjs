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

// The chart groups by wave by default (Dan, 15 Aug: 27 rows in one band
// made it unreadable). Checks that inspect per-jurisdiction scheduling
// have to open it first, and must be able to do so more than once
// without toggling it shut again.
const expandGantt = async () => {
  if (/Show every/.test(await page.locator("#ganttToggle").innerText())) {
    await page.click("#ganttToggle");
    await page.waitForTimeout(600);
  }
};

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
const direct = await page.locator("#savingsTable").innerText();
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
  const el = [...document.querySelectorAll("#savingsTable .ev")]
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
await expandGantt();
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
const indirect = () => page.locator('#savingsTable tr[data-row="tax"]');
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

const directTotal = Number((await page.locator('#savingsTable tr[data-row="ap"]')
  .locator("td").nth(2).innerText()).replace(/[^\d]/g, ""));
const head = await page.locator("#savingsTable .note").first().innerText();
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

const totalRow = () => page.locator('#savingsTable tr[data-row="total"]');
const bankedTotal = async () =>
  Number((await totalRow().locator("td").last().innerText()).replace(/[^\d]/g, ""));

// 590,400 x 0.4286 capture share = 253,045 banked, plus 195,000 AR in
// full. Rework is held out deliberately: it is the weakest-evidenced row
// and would have been the largest single beneficiary.
//
// Asserted per ROW rather than against a subtotal. 538 merged the two
// tables, so the only total on the page is now the whole section's — and
// that moves whenever the country selection changes the indirect row,
// which would make this check about jurisdiction mix rather than about
// banking. The rows are where the banking decision actually lives.
const cell = async (row, n) => Number((await page.locator(`#savingsTable tr[data-row="${row}"]`)
  .locator("td").nth(n).innerText()).replace(/[^\d]/g, ""));
t.check("compliance-only banks the capture share of AP, not all of it",
  (await cell("ap", 3)) === 253045, await cell("ap", 3));
t.check("and banks AR in full, because the mandate compels structured issuing",
  (await cell("ar", 3)) === 195000 && (await cell("ar", 2)) === 195000);
t.check("and banks none of the rework",
  /^\s*(—|&mdash;)\s*$/.test(await page.locator('#savingsTable tr[data-row="rework"] td').nth(3).innerText()),
  await page.locator('#savingsTable tr[data-row="rework"] td').nth(3).innerText());
// Until 536 this asserted a parenthetical reading "($697,355 unlocked and
// not banked, of $1,145,400)", which was the only bridge between a column
// summing to 1,145,400 and a total reading 448,045. Dan hit exactly that
// gap while checking the model by hand. The bridge is now a second column,
// so the property to assert is that the total row states BOTH figures —
// and, separately, that the unbanked amount is still named on the page.
// The total was the direct table's subtotal until 538; it is now the
// section's, and it is the figure section 5 divides into for payback.
// Asserted as a relationship rather than a literal, because the indirect
// component moves with the country selection.
const totCells = await totalRow().locator("td").allInnerTexts();
const totGross = Number(totCells[totCells.length - 2].replace(/[^\d]/g, ""));
const totBanked = Number(totCells[totCells.length - 1].replace(/[^\d]/g, ""));
t.check(`the total row states the gross and the banked figure side by side (${totGross} / ${totBanked})`,
  totGross > 0 && totBanked > 0 && totGross > totBanked, totCells.join(" | "));
const runFromNote = async () => {
  const note = await page.locator("#summary .note:not(.warn)").innerText();
  const m = note.match(/less\s+\D?([\d,]+)\s+of platform fees.*?\D([\d,]+)\s+of internal run cost/is);
  return m ? Number(m[1].replace(/,/g, "")) + Number(m[2].replace(/,/g, "")) : null;
};
const netStat = async () => Number((await page.locator("#summary .stat").nth(2)
  .locator(".n").innerText()).replace(/[^\d]/g, ""));
t.check("and the banked total is what the executive summary works from",
  totBanked === (await netStat()) + (await runFromNote()),
  `${totBanked} vs net ${await netStat()} + run ${await runFromNote()}`);
t.check("the run cost that bridges banked to net is stated, not left implicit",
  (await runFromNote()) !== null, await page.locator("#summary .note:not(.warn)").innerText());
t.check("and the unlocked remainder is still stated somewhere on the page",
  (await page.locator("body").innerText()).includes("697,355"));

// The tags are the whole defence of this change: the reasoning has to be
// on the row, not in a footnote, because the change makes the answer
// better and that is exactly when a reader should be able to audit it.
const tags = await page.evaluate(() =>
  [...document.querySelectorAll("#savingsTable .tag.bank, #savingsTable .tag.unbank")].map((e) => e.textContent));
t.check("every direct row says whether it banks on compliance",
  tags.includes("43% banks") && tags.includes("banks") && tags.includes("not banked"), tags);

// This used to match lowercase "not banked" inside the total row's
// parenthetical rather than the tag on the rework row — so when 536
// replaced the parenthetical it failed, having never tested the row it
// names. innerText applies text-transform, so the tag reads "NOT BANKED":
// match case-insensitively, and against the rework row specifically.
const reworkBankRow = await page.locator('#savingsTable tr[data-row="rework"]').innerText();
t.check("rework is not banked on a compliance scope",
  /not banked/i.test(reworkBankRow) && /—|&mdash;/.test(reworkBankRow.split("\t").pop()),
  reworkBankRow.slice(0, 120));

await page.selectOption("#scope", "both"); await page.waitForTimeout(400);
await page.click("#run"); await page.waitForTimeout(700);
// The property is that on the fuller scope EVERY priced row banks in
// full — which is what "banks the lot" meant. The literal 1,145,400 was
// the direct subtotal and is no longer rendered on its own after 538.
const bothRows = await page.evaluate(() =>
  ["ap", "ar", "tax", "rework"].map((r) => {
    const tr = document.querySelector(`#savingsTable tr[data-row="${r}"]`);
    const c = [...tr.children].map((x) => x.textContent.trim());
    return { r, gross: c[2], banks: c[3] };
  }));
t.check("the fuller programme banks the lot — every priced row in full",
  bothRows.every((x) => x.gross === x.banks), JSON.stringify(bothRows));

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
const reworkRow = await page.locator('#savingsTable tr[data-row="rework"]').innerText();
t.check("an unchanged rework cost is labelled as our estimate, not the reader's",
  /our estimate, not yours/.test(reworkRow), reworkRow.slice(0, 200));
await page.fill("#errCost", "70");
await page.click("#run"); await page.waitForTimeout(700);
t.check("and becomes theirs once they change it",
  /your rework cost/.test(await page.locator('#savingsTable tr[data-row="rework"]').innerText()));

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
    // Exempt: behind the click, or inside the print-only document. An
    // element with display:none returns textContent from innerText, so
    // #pdfdoc counted as if it were on screen and blew the budget to 1195.
    if (el.closest("#notes") || el.closest("#pdfdoc")) return;
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

// ---- 20. fields line up ----
// Dan: "section 1 the field headings wrap sometimes causing the fields to
// appear at different heights." Measured 19px out in the footprint row —
// a whole wrapped line — because the reserved label height existed only
// on #assump and was set below the natural two-line height, so it never
// bound. Checked at three widths because the wrap point moves.
await page.evaluate(() => { document.getElementById("assump").open = true; });
for (const w of [1280, 1000, 860]) {
  await page.setViewportSize({ width: w, height: 1000 });
  await page.waitForTimeout(150);
  const off = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll(".grid").forEach((g) => {
      const f = [...g.querySelectorAll(":scope > div > input, :scope > div > select")];
      if (f.length < 2) return;
      const tops = [...new Set(f.map((i) => Math.round(i.getBoundingClientRect().top)))];
      if (tops.length > 1) bad.push(Math.max(...tops) - Math.min(...tops));
    });
    return bad;
  });
  t.check(`grid fields share a baseline at ${w}px`, off.length === 0, off.join("/"));
}
await page.setViewportSize({ width: 1280, height: 1000 });
await page.waitForTimeout(150);

// ---- 21. the savings pie ----
await page.click("#selEU"); await page.waitForTimeout(200);
await page.click("#run"); await page.waitForTimeout(800);
const pie = await page.evaluate(() => {
  const svg = document.querySelector("#savings .svpie");
  const pct = [...svg.querySelectorAll("text")].map((t) => parseInt(t.textContent, 10));
  return { slices: svg.querySelectorAll("path").length, pct,
           keys: document.querySelectorAll("#savings .svkey li").length };
});
t.check(`the pie has one slice per banked component (${pie.slices})`, pie.slices === 3, pie.slices);
// Largest remainder, so the labels total 100. Three rounded percentages
// that visibly sum to 99 is the small wrongness that makes a reader doubt
// the large numbers.
t.check(`slice percentages sum to 100 (${pie.pct.join("+")})`,
  pie.pct.reduce((a, c) => a + c, 0) === 100, pie.pct);
t.check("and each is direct-labelled in the legend with its value",
  pie.keys === 3, pie.keys);
// Cycle time must never acquire a slice: the model does not price it, and
// inventing a number for the chart is the one thing it refuses to do.
t.check("nothing unpriced is charted",
  !/cycle time/i.test(await page.locator("#savings .svkey").innerText()));

// ---- 22. the PDF is two pages, and the right things are on each ----
const pdf = await page.evaluate(() => {
  const d = document.getElementById("pdfdoc");
  const pgs = [...d.querySelectorAll(".pg")];
  return { pages: pgs.length, p1: pgs[0] ? pgs[0].innerText : "", p2: pgs[1] ? pgs[1].innerText : "" };
});
t.check(`the PDF document is exactly two pages (${pdf.pages})`, pdf.pages === 2, pdf.pages);
// "Banked annually" sat over l1Banked + l2 — a figure including the
// modelled indirect row, which is not banked in this page's sense of the
// word. 536 relabelled it rather than changing the arithmetic, per Dan.
t.check("page 1 carries the headline findings", /Annual benefit/.test(pdf.p1) && /Payback/.test(pdf.p1));
t.check("page 1 carries the wave plan", /Latest responsible start/i.test(pdf.p1));
t.check("page 2 carries the assumptions and their grades",
  /Assumptions/i.test(pdf.p2) && /Grade A measured/i.test(pdf.p2));
t.check("and the disclaimer, which is load-bearing on a forwarded document",
  /not tax, legal or investment advice/i.test(pdf.p2));
// Dan asked for caveats on page 2 specifically. This is the check that
// they did not creep back onto page 1 with the next edit.
t.check("the reasoning is NOT on page 1",
  !/ATO \/ Deloitte task times/.test(pdf.p1));

await page.emulateMedia({ media: "print" });
await page.waitForTimeout(300);
const printed = await page.evaluate(() => {
  const mm = (px) => px / 96 * 25.4;
  const pgs = [...document.querySelectorAll("#pdfdoc .pg")];
  return { wrap: getComputedStyle(document.querySelector("body>.wrap")).display,
           heights: pgs.map((p) => Math.round(mm(p.getBoundingClientRect().height))) };
});
t.check("the interactive page is suppressed in print", printed.wrap === "none");
// A4 is 297mm less 13mm margins top and bottom.
printed.heights.forEach((h, i) =>
  t.check(`PDF page ${i + 1} fits on A4 (${h}mm of 271mm)`, h <= 271, h));
await page.emulateMedia({ media: "screen" });

// ---- 23. the European Union is one row ----
// Dan: the per-country ViDA waves were "too messy", and the EU already
// exists as its own entry on the board. Migration 504 had settled the
// same argument there — ViDA is ONE EU fact, not twenty-seven national
// ones — and the planner had been going the other way ever since.
await page.goto(`file://${file}`);
await page.click("#selEU"); await page.waitForTimeout(200);
await page.click("#run"); await page.waitForTimeout(900);

// Nobody selects the EU. It binds you if any member state does, and
// requiring a tick would silently omit a real obligation.
t.check("the EU is not in the country picker",
  !(await page.locator("#countryList").innerText()).includes("European Union"));

await expandGantt();
const labels = () => page.evaluate(() =>
  [...document.querySelectorAll("#gantt svg text")]
    .map((n) => (n.firstChild && n.firstChild.textContent) || ""));
const lab = await labels();
t.check("but it appears in the plan automatically", lab.includes("European Union"), lab.slice(0, 6));
t.check("exactly once, however many member states are selected",
  lab.filter((x) => x === "European Union").length === 1);
t.check("and Germany appears once, on its national date only",
  lab.filter((x) => /^Germany/.test(x)).length === 1, lab.filter((x) => /Germany/.test(x)));

// Dan's correction mid-build: a member state with no national mandate is
// still implementable, peer to peer, so it stays in the plan as
// discretionary rather than being dropped.
t.check("a member state with no national mandate is still plannable",
  lab.includes("Austria"), lab.filter((x) => /Austria/.test(x)));

// One complex build plus a simple connection per member state. 27 members
// on this preset, so the EU row adds 1 complex and 26 simple.
const oneOff = Number((await page.locator("#summary .stat").nth(1)
  .locator(".n").innerText()).replace(/[^\d]/g, ""));
t.check(`the EU row costs one build plus a connection each (${oneOff})`,
  oneOff === 770000, oneOff);

await page.evaluate(() => { document.getElementById("adjust").open = true; });
await page.waitForTimeout(250);
const adj = await page.evaluate(() =>
  [...document.querySelectorAll("[data-ovr-dl]")].map((e) => e.getAttribute("data-ovr-dl")));
t.check("and the EU obligation is adjustable like any other",
  adj.includes("European Union"), adj.filter((a) => /Euro|Germany/.test(a)));

// ---- 24. the chart groups by wave, and expands on demand ----
// Dan, after the ViDA second waves landed: the plan "becomes difficult to
// read". Measured — the time axis had not moved (18 quarters either way,
// because the 2030 edge already existed for the member states with no
// national date), but the chart grew 31% taller and ONE wave held 27 of
// its 46 rows. Density, not extent.
await page.goto(`file://${file}`);
await page.click("#selEU"); await page.waitForTimeout(200);
await page.click("#run"); await page.waitForTimeout(900);

const chartH = () => page.evaluate(() =>
  +document.querySelector("#gantt svg").getAttribute("viewBox").split(" ")[3]);
const grouped = await chartH();
t.check(`grouped by default, and it fits on a screen (${grouped}px, was 1674)`,
  grouped < 600, grouped);
// The EU wave covers every member state selected, so counting tracks
// would print "1 JURISDICTION" over an obligation binding twenty-seven.
t.check("the EU wave is labelled by member states, not by track count",
  await page.evaluate(() => [...document.querySelectorAll("#gantt svg text")]
    .some((n) => /27 MEMBER STATES/.test(n.textContent))));
// The whole point of grouping is that nothing is lost, only folded.
t.check("no per-jurisdiction row is drawn while grouped",
  await page.evaluate(() => ![...document.querySelectorAll("#gantt svg text")]
    .some((n) => /^Germany/.test((n.firstChild && n.firstChild.textContent) || ""))));

await page.click("#ganttToggle"); await page.waitForTimeout(700);
const expanded = await chartH();
t.check(`expanding restores every jurisdiction (${grouped} -> ${expanded}px)`,
  expanded > grouped * 2, `${grouped} -> ${expanded}`);
t.check("and every jurisdiction is named once expanded",
  await page.evaluate(() => {
    const l = [...document.querySelectorAll("#gantt svg text")]
      .map((n) => (n.firstChild && n.firstChild.textContent) || "");
    return l.includes("Germany") && l.includes("European Union");
  }));
await page.click("#ganttToggle"); await page.waitForTimeout(700);
t.check("and it folds back", (await chartH()) === grouped);


// ---- 25. the steps strip is navigation, not decoration ----
// Dan asked for "simple and discrete instructions at the top". The risk
// with a strip like this is that it becomes a picture of a workflow
// rather than a route through one: a chip whose href points at an anchor
// nobody emits looks identical to a working one until it is clicked.
const steps = await page.evaluate(() => {
  const li = [...document.querySelectorAll(".steps li")];
  return {
    n: li.length,
    labels: li.map((e) => e.querySelector("span").firstChild.textContent.trim()),
    optional: li.filter((e) => e.querySelector("em")).length,
    noprint: !![...document.querySelectorAll(".steps")].every((e) => e.classList.contains("noprint")),
    rows: new Set(li.map((e) => Math.round(e.getBoundingClientRect().top))).size,
    dead: li.map((e) => e.querySelector("a").getAttribute("href"))
      .filter((h) => !h || !document.querySelector(h)),
    numbered: li.map((e) => e.querySelector("b").textContent).join(""),
  };
});
t.check(`five steps, in order (${steps.numbered})`,
  steps.n === 5 && steps.numbered === "12345", `${steps.n} / ${steps.numbered}`);
t.check(`they name the four actions and the button (${steps.labels.join(" > ")})`,
  ["footprint", "countries", "assumptions", "Calculate", "go-live"]
    .every((w, i) => (steps.labels[i] || "").includes(w)), steps.labels.join(" | "));
t.check("every chip points at an anchor the page actually emits",
  steps.dead.length === 0, steps.dead.join(", "));
t.check("exactly two are marked optional — assumptions and go-live dates",
  steps.optional === 2, steps.optional);
t.check("and the strip does not follow the reader into the PDF", steps.noprint);
// It reads as one route only while it is one line. Five chips plus four
// separators measured 1087px against 1040px of wrap on first build, so
// this wrapped on a full-width desktop; the spacing in .steps was cut to
// fit and this check is what stops a later word choice undoing that.
t.check(`the strip is one line at desktop width (${steps.rows} row)`,
  steps.rows === 1, steps.rows);

// ---- 26. direct and indirect live under one Savings heading ----
// The page's most important claim about these two totals is that they
// are never added together. That claim belongs to the pair, so it can
// only be stated once they share a heading — which is why this is an
// invariant and not a preference. Migration 535 carries the reasoning.
const sav = await page.evaluate(() => {
  const hs = [...document.querySelectorAll("h2")];
  const head = hs.find((e) => /^4\s/.test(e.textContent.trim()));
  const idx = hs.indexOf(head);
  const next = idx >= 0 ? hs[idx + 1] : null;
  const own = [];
  if (head) {
    let n = head.nextElementSibling;
    while (n && n !== next) { own.push(n); n = n.nextElementSibling; }
  }
  return {
    headings: hs.map((e) => e.textContent.trim()),
    savingsHeadings: hs.filter((e) => /^\d+\s\S+\s*Savings$/.test(e.textContent.trim())).length,
    holdsBoth: own.some((e) => e.id === "savingsTable"),
    subheads: [...document.querySelectorAll("#savingsTable tr.grp td")].map((e) => e.textContent.trim()),
    lede: (own.find((e) => e.classList.contains("lede")) || {}).textContent || "",
  };
});
t.check("exactly one numbered Savings section", sav.savingsHeadings === 1,
  `${sav.savingsHeadings}: ${sav.headings.join(" / ")}`);
t.check("and the savings table hangs off it", sav.holdsBoth, sav.headings.join(" / "));
// 535 split the section into a Direct and an Indirect subhead. 538
// merged the two tables and reordered by whether a number exists, so the
// groups are now "Priced" and "Named, not priced" — the distinction the
// reader navigates by. Direct/indirect moved onto the row as a tag, and
// is asserted below rather than lost.
t.check(`the table groups by priced and not priced (${sav.subheads.join(" / ")})`,
  sav.subheads.length === 2
  && /^Priced\b/.test(sav.subheads[0]) && /^Named, not priced\b/.test(sav.subheads[1]),
  sav.subheads.join(" | "));
t.check("neither group label repeats the word the heading above already says",
  sav.subheads.every((s) => !/savings/i.test(s)), sav.subheads.join(" | "));
// 538 tagged every row direct or indirect; 539 took the tag off, because
// once both kinds share a column, a rule, a table, a total and a payback
// calculation the label changed no decision. Dan: "Savings are savings -
// let the reader decide." What has to survive is that the reader CAN
// still decide — the evidence stays on every row.
t.check("no row carries a direct/indirect label any more",
  (await page.locator("#savingsTable .tag.kd, #savingsTable .tag.ki").count()) === 0);
t.check("but every priced row still shows the evidence to judge it by",
  await page.evaluate(() => ["ap", "ar", "tax", "rework"].every((r) =>
    document.querySelector(`#savingsTable tr[data-row="${r}"]`).querySelector(".ev"))));
// This asserted "never added together" when 535 wrote it. Validating the
// arithmetic showed that was false — section 5 and the pie both add them
// — so 536 reworded it and this check follows. What the lede has to do is
// unchanged: state, once and where both halves can see it, how the two
// kinds relate. Only the true version of that sentence differs.
t.check("the lede describes the order the single table is actually in",
  /named below the total/.test(sav.lede) && /section 2 works from/i.test(sav.lede),
  sav.lede.slice(0, 110));
t.check("the page is four numbered sections, with investment inside the summary",
  sav.headings.some((x) => /^2 \S* Executive summary/.test(x))
  && sav.headings.some((x) => /^4 \S* Savings$/.test(x))
  && !sav.headings.some((x) => /^5 /.test(x)),
  sav.headings.join(" / "));
t.check("and the summary heading says it carries the investment case",
  sav.headings.some((x) => /^2 .*(investment|payback)/i.test(x)),
  sav.headings.join(" / "));


// ---- 27. section 4's totals are the sums of their own columns ----
// Dan, validating the model: "the annual values shared in section 4, how
// do these factor into the direct total banked savings at the bottom of
// the same section?" They did not, and could not: the column was gross
// and the total was banked, with the reconciliation in a grey
// parenthetical. Two numeric columns now, and this asserts that BOTH add
// up — which is the property that was missing, not the arithmetic.
const money = (x) => { const m = String(x).replace(/[^0-9.\-]/g, ""); return m === "" ? null : parseFloat(m); };
const readDirect = () => page.evaluate(() => {
  const trs = [...document.querySelectorAll("#savingsTable tr[data-row]")]
    .filter((tr) => tr.dataset.row !== "total");
  const cells = (tr) => [...tr.children].map((c) => c.textContent.trim());
  const tot = document.querySelector('#savingsTable tr[data-row="total"]');
  return { body: trs.map(cells), total: cells(tot) };
});
for (const scope of ["compliance", "both"]) {
  await page.selectOption("#scope", scope);
  await page.click("#run"); await page.waitForTimeout(800);
  const { body, total } = await readDirect();
  const col = (i) => body.map((r) => money(r[r.length - i])).filter((v) => v !== null)
    .reduce((a, b) => a + b, 0);
  const banksSum = col(1), grossSum = col(2);
  const banksTot = money(total[total.length - 1]), grossTot = money(total[total.length - 2]);
  t.check(`${scope}: gross column sums to its total (${Math.round(grossSum).toLocaleString()})`,
    Math.abs(grossSum - grossTot) <= 1, `${grossSum} vs ${grossTot}`);
  t.check(`${scope}: banks column sums to its total (${Math.round(banksTot).toLocaleString()})`,
    Math.abs(banksSum - banksTot) <= 1, `${banksSum} vs ${banksTot}`);
  t.check(`${scope}: every monetised row states what it banks`,
    body.slice(0, 3).every((r) => money(r[r.length - 1]) !== null || r[r.length - 1].includes("—")),
    JSON.stringify(body.map((r) => r[r.length - 1])));
}
await page.selectOption("#scope", "compliance");
await page.click("#run"); await page.waitForTimeout(800);
const dcols = await readDirect();
t.check("on compliance the two totals differ — that is the point",
  money(dcols.total[dcols.total.length - 2]) > money(dcols.total[dcols.total.length - 1]));

// ---- 28. the page no longer claims a rule it breaks ----
// It said in two places that direct and indirect are never added
// together, while section 5 and the pie both add them. Dan: "The page can
// include direct and indirect savings added together." So the arithmetic
// stands and the wording has to match it — in D1 and in the fallbacks.
const claims = await page.evaluate(() => document.body.innerText);
t.check("no text claims the two savings kinds are never combined",
  !/never added together|not added together|kept apart/i.test(claims),
  (claims.match(/[^.]*(never added together|not added together|kept apart)[^.]*/i) || [""])[0].slice(0, 90));
const pieWhole = await page.evaluate(() => {
  const tot = document.querySelector(".svtot strong");
  const segs = [...document.querySelectorAll(".svkey li b")].map((e) => e.textContent.trim());
  return { total: tot && tot.textContent.trim(), segs,
           title: (document.querySelector(".svtitle") || {}).textContent };
});
t.check(`the pie's whole is labelled as benefit, not as banked (${pieWhole.title})`,
  !/banked/i.test(pieWhole.title || ""), pieWhole.title);
t.check("and its slices sum to the total it prints",
  Math.abs(pieWhole.segs.map(money).reduce((a, b) => a + b, 0) - money(pieWhole.total)) <= 1,
  `${pieWhole.segs.join("+")} vs ${pieWhole.total}`);

// ---- 29. a sub-month payback reads as one ----
// At 1M invoices payback is 0.4 months and rendered "0mo", which reads as
// a failure rather than as very fast.
// Drive the one-off down as well as the volume up, so this genuinely
// lands under a month. The first version of this check asserted at 1M
// invoices alone, got 2mo, and passed without ever reaching the branch
// it exists to test.
await page.evaluate(() => { document.getElementById("assump").open = true; });
await page.fill("#volAP", "1000000"); await page.fill("#volAR", "500000");
await page.fill("#cImplS", "500"); await page.fill("#cImplC", "500");
await page.click("#run"); await page.waitForTimeout(900);
const pb = await page.evaluate(() =>
  [...document.querySelectorAll("#summary .stat")].map((e) => e.querySelector(".n").textContent.trim()));
t.check(`a sub-month payback reads as under a month, not 0mo (${pb[3]})`,
  /^<\s*1\s*mo$/.test(pb[3]), pb[3]);
await page.fill("#cImplS", "8000"); await page.fill("#cImplC", "22000");

// ---- 30. the AP row's basis reproduces the AP row's value ----
// It printed "$9.8" from a 9.84 benchmark, so multiplying out the basis
// on screen gave $588,000 against the $590,400 beside it. A $2,400 gap in
// the row a finance reader is most likely to check by hand.
await page.fill("#volAP", "100000"); await page.fill("#volAR", "50000");
await page.click("#run"); await page.waitForTimeout(900);
const apRow = await page.evaluate(() => {
  const tr = document.querySelector('#savingsTable tr[data-row="ap"]');
  return { basis: tr.children[1].textContent.replace(/\s+/g, " "),
           value: tr.children[2].textContent.trim() };
});
const rate = parseFloat((apRow.basis.match(/invoices\s*\S\s*[^\d]*([\d.]+)/) || [])[1]);
const pctOff = parseFloat((apRow.basis.match(/(\d+)%/) || [])[1]);
t.check(`the AP basis multiplies out to the AP value (${rate} x 60%)`,
  Math.abs(100000 * rate * (pctOff / 100) - money(apRow.value)) <= 1,
  `${100000 * rate * (pctOff / 100)} vs ${apRow.value}`);


// ---- 31. every monetised row declares a banking position ----
// Indirect was never put through the banking model: no column, no tag,
// and it entered netAnnual in full on both scopes while every direct row
// beside it declared a rate. Not a wrong number, an absent decision --
// which is indistinguishable from a decision to anyone auditing the page,
// and which meant a row resting on two D-grade assumptions banked in full
// while rework, resting on two D-grade assumptions, banked at zero.
// Dan: "which seems like a valid saving to bank." Migration 537.
await page.selectOption("#scope", "compliance");
await page.click("#run"); await page.waitForTimeout(800);
const priced = await page.evaluate(() => {
  const rows = [...document.querySelectorAll("#savingsTable tr[data-row]")]
    .filter((tr) => tr.dataset.row !== "total");
  const grp = [...document.querySelectorAll("#savingsTable tr.grp")];
  // Which group a row falls in: above the second group row = priced.
  const secondGrpTop = grp[1] ? grp[1].getBoundingClientRect().top : Infinity;
  return rows.map((tr) => ({
    row: tr.dataset.row,
    name: tr.children[0].textContent.replace(/\s+/g, " ").trim().slice(0, 34),

    tag: [...tr.querySelectorAll(".tag.bank, .tag.unbank")].map((e) => e.textContent).join("/"),
    gross: tr.children[2].textContent.trim(),
    banks: tr.children[3] ? tr.children[3].textContent.trim() : null,
    inPricedGroup: tr.getBoundingClientRect().top < secondGrpTop,
  }));
});
const monetised = priced.filter((r) => /\d/.test(r.gross));
t.check(`every monetised row declares a banking position (${monetised.length} rows)`,
  monetised.every((r) => r.tag && r.banks !== null),
  JSON.stringify(monetised.filter((r) => !r.tag || r.banks === null)));
t.check("and every one of them sits above the total, in the priced group",
  monetised.every((r) => r.inPricedGroup),
  JSON.stringify(monetised.filter((r) => !r.inPricedGroup).map((r) => r.row)));
t.check("while every unpriced benefit sits below it",
  priced.filter((r) => !/\d/.test(r.gross)).every((r) => !r.inPricedGroup),
  JSON.stringify(priced.filter((r) => !/\d/.test(r.gross) && r.inPricedGroup).map((r) => r.row)));
// Dan: "With tangible banked entries at the top" — the rows that bank
// come before the one that does not, inside the priced group.
const bankIdx = monetised.map((r, i) => ({ i, banks: /\d/.test(r.banks || "") }));
t.check("banked rows come before the priced row that does not bank",
  Math.max(...bankIdx.filter((x) => x.banks).map((x) => x.i))
    < Math.min(...bankIdx.filter((x) => !x.banks).map((x) => x.i)),
  JSON.stringify(monetised.map((r) => `${r.row}:${r.banks}`)));
const tax = monetised.find((r) => r.row === "tax");
t.check(`the tax row banks in full (${tax.tag})`,
  tax.tag === "banks" && tax.gross === tax.banks, JSON.stringify(tax));
t.check("and states its reason inline, as the direct rows do",
  /falls with the compliance build itself/.test(
    await page.locator('#savingsTable tr[data-row="tax"]').innerText()));

// The arithmetic must NOT have moved: 537 made a decision visible and
// 538 moved where the total is drawn, but neither changed a figure.
//
// This check itself had to change with 538, and the way it broke is the
// point. It read the total row's banked cell and ADDED the indirect row
// to it — correct while the total was the direct table's subtotal, a
// double count the moment the total became the section's. It failed
// loudly rather than drifting, which is what the assertion is for.
const net538 = await page.evaluate(() => {
  const n = (x) => parseFloat(String(x).replace(/[^0-9.]/g, ""));
  const tot = document.querySelector('#savingsTable tr[data-row="total"]');
  const cells = [...tot.children];
  const stat = (i) => n([...document.querySelectorAll("#summary .stat")][i].querySelector(".n").textContent);
  const note = document.querySelector("#summary .note:not(.warn)").textContent;
  const m = note.match(/less\s+\D?([\d,]+)\s+of platform fees[\s\S]*?\D([\d,]+)\s+of internal run cost/i);
  return { banked: n(cells[cells.length - 1].textContent), net: stat(2),
           run: m ? Number(m[1].replace(/,/g, "")) + Number(m[2].replace(/,/g, "")) : NaN };
});
t.check(`net annual is the section's banked total minus run cost (${net538.net.toLocaleString()})`,
  Math.abs((net538.banked - net538.run) - net538.net) <= 1,
  `${net538.banked} - ${net538.run} vs ${net538.net}`);
t.check("and the banked total is the figure section 4 now shows, not one only section 5 knew",
  net538.banked > 0 && net538.banked === net538.net + net538.run,
  `${net538.banked} vs ${net538.net}+${net538.run}`);


// ---- 32. the scope is stated once, and where the figures are ----
// Dan: "what does 'Net annual (compliance scope)' mean?" — a label whose
// job is preventing confusion, asked about by the person who commissioned
// the page. It was a survivor from the pre-528 model, where compliance
// scope zeroed every direct saving and the parenthetical warned you were
// looking at the crippled figure. 528 fixed the model; the label outlived
// it by thirteen migrations.
//
// Dropping it is only safe while the bold "Scope:" note beneath the grid
// carries the fact, so that is what this asserts — plus the consistency
// problem the parenthetical had: three stats move with scope and only one
// was ever labelled.
for (const scope of ["compliance", "both"]) {
  await page.selectOption("#scope", scope);
  await page.click("#run"); await page.waitForTimeout(800);
  const labels = await page.evaluate(() => [...document.querySelectorAll("#summary .stat")]
    .map((e) => e.querySelector(".l").textContent.replace(/\s+/g, " ").trim()));
  t.check(`${scope}: no stat carries a scope parenthetical`,
    labels.every((l) => !/\(compliance scope\)/i.test(l)), labels.join(" | "));
  const note = await page.locator("#summary .note:not(.warn)").innerText();
  t.check(`${scope}: the note states which scope the figures are on`,
    /^\s*Scope:/i.test(note), note.slice(0, 70));
}
// And the thing the parenthetical was half-doing: the reader can still
// see that these figures move with scope, because the note quantifies
// what compliance-only leaves on the table.
await page.selectOption("#scope", "compliance");
await page.click("#run"); await page.waitForTimeout(800);
t.check("and on compliance scope it quantifies what is excluded",
  /needs a change programme you are not running/.test(
    await page.locator("#summary .note:not(.warn)").innerText()));


// ---- 33. the SaaS cost is named, not buried in a sum ----
// Dan: "should the executive summary include - Estimated Annual SaaS
// cost... or is that included already in the cost element?" It was
// included and invisible: $60,000 of platform fees added to $30,000 of
// internal run cost and reported as one "$90,000 annual run cost". Those
// are a vendor subscription and absorbed headcount — the first is the
// number an executive challenges first, and the page showed them a sum.
await page.selectOption("#scope", "compliance");
await page.click("#run"); await page.waitForTimeout(800);
const bridgeNote = await page.locator("#summary .note:not(.warn)").innerText();
const parts = bridgeNote.match(/less\s+\D?([\d,]+)\s+of platform fees[\s\S]*?\D([\d,]+)\s+of internal run cost/i);
t.check("the note names platform fees and internal run cost separately",
  parts !== null, bridgeNote.slice(0, 150));
const plat = Number(parts[1].replace(/,/g, "")), run = Number(parts[2].replace(/,/g, ""));
t.check(`platform fees are stated in their own right (${plat.toLocaleString()})`, plat > 0);
t.check(`internal run cost is stated separately (${run.toLocaleString()})`, run > 0 && run !== plat);
// It still has to close the arithmetic — that is why it is in the note.
const netNow = Number((await page.locator("#summary .stat").nth(2).locator(".n").innerText())
  .replace(/[^\d]/g, ""));
const bankedNow = Number((await page.locator('#savingsTable tr[data-row="total"] td').last().innerText())
  .replace(/[^\d]/g, ""));
t.check(`the two still bridge banked to net (${bankedNow} - ${plat} - ${run} = ${netNow})`,
  bankedNow - plat - run === netNow, `${bankedNow - plat - run} vs ${netNow}`);
// Platform fees scale with volume, internal run cost does not — which is
// the substantive difference between them and the reason the split is
// worth making rather than cosmetic.
await page.evaluate(() => { document.getElementById("assump").open = true; });
await page.fill("#volAP", "200000");
await page.click("#run"); await page.waitForTimeout(900);
const platAfter = (await page.locator("#summary .note:not(.warn)").innerText())
  .match(/less\s+\D?([\d,]+)\s+of platform fees[\s\S]*?\D([\d,]+)\s+of internal run cost/i);
t.check(`platform fees track volume (${plat.toLocaleString()} -> ${Number(platAfter[1].replace(/,/g,"")).toLocaleString()})`,
  Number(platAfter[1].replace(/,/g, "")) > plat);
t.check("while internal run cost does not",
  Number(platAfter[2].replace(/,/g, "")) === run);
await page.fill("#volAP", "100000");


// ---- 34. the summary labels avoid the untranslatable idiom ----
// Dan: "The banked term, I think might not translate well - when we look
// at internationalising the page." Correct: "banked" is a finance idiom
// meaning realised-and-keepable as distinct from identified. English
// carries that in one word; a translator falls back on "saved", and the
// distinction migrations 528 and 536 built collapses into the ordinary
// word for saving, in three languages at once, silently.
await page.selectOption("#scope", "compliance");
await page.click("#run"); await page.waitForTimeout(800);
const sumLabels = await page.evaluate(() => [...document.querySelectorAll("#summary .stat")]
  .map((e) => e.querySelector(".l").textContent.replace(/\s+/g, " ").trim()));
t.check(`no summary stat label uses "bank" (${sumLabels.length} labels)`,
  sumLabels.every((l) => !/bank/i.test(l)), sumLabels.filter((l) => /bank/i.test(l)).join(" | "));
t.check(`the headline reads as a saving (${sumLabels[0]})`,
  /annual saving/i.test(sumLabels[0]), sumLabels[0]);
t.check(`and the net figure too (${sumLabels[2]})`,
  /net annual saving/i.test(sumLabels[2]), sumLabels[2]);
// res.unbanked renders INSIDE the res.banked label, so fixing the
// heading and leaving the parenthetical would have put the idiom back
// three words later.
t.check("including the parenthetical inside the headline label",
  /available on a wider scope/i.test(sumLabels[0]), sumLabels[0]);

// The known gap, asserted so it cannot be forgotten when i18n is scoped:
// the banking TAGS are English literals in the template, not D1 rows, so
// no amount of translation reaches them. This check documents the debt
// rather than failing on it.
const tagText = await page.evaluate(() =>
  [...document.querySelectorAll("#savingsTable .tag.bank, #savingsTable .tag.unbank")]
    .map((e) => e.textContent.trim()));
t.check(`the row tags are still hardcoded English — known i18n debt (${tagText.join(", ")})`,
  tagText.length > 0, tagText.join(", "));

await browser.close();
process.exit(t.report() ? 0 : 1);
