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

// Dan removed the "EU only" and "Everywhere with a mandate" presets from
// the country selector on 16 Aug 2026. They were also how most of this
// suite built a selection, so the SELECTION LOGIC MOVES HERE rather than
// the coverage going with the buttons. Same rules the handlers used:
// region 'Eu' for the first, status in-force or upcoming for the second.
//
// Deliberately not a click on some other control: these set up a state
// so that a later assertion has something to measure, and a setup step
// that depends on UI chrome is a setup step that breaks when the chrome
// moves — which is exactly what happened here.
const selectEU = () => page.evaluate(() => {
  document.getElementById("useSubs").checked = false;
  document.querySelectorAll("#countryList input[type=checkbox][data-i]")
    .forEach((b) => { b.checked = COUNTRIES[+b.dataset.i][2] === "Eu"; });
});
// Migration 565 grouped the scenario warnings into one <details> headed
// with a count, so a reader is not met by a wall of red. The block is
// CLOSED by default, which means innerText on it returns the heading and
// nothing else — so every check that reads a guard has to open it first.
//
// Deliberately a helper rather than a global "open everything" in setup:
// the closed state is the shipped state, and a suite that silently
// expands it would stop being able to tell whether the detail is
// reachable at all.
const guardText = async () => {
  await page.evaluate(() => {
    const d = document.querySelector("#guards details");
    if (d) d.open = true;
  });
  return page.locator("#guards").innerText();
};
const selectMandate = () => page.evaluate(() => {
  document.getElementById("useSubs").checked = false;
  document.querySelectorAll("#countryList input[type=checkbox][data-i]")
    .forEach((b) => { const st = COUNTRIES[+b.dataset.i][3]; b.checked = st === "i" || st === "u"; });
});
await page.goto(`file://${file}`);

// ---- 0. the page is rendering in the typefaces a reader gets ----
//
// Until 17 August 2026 it was not. members-worker's shell loads three
// families from Google Fonts and this harness loaded none of them, so
// every width, wrap, overflow and min-height check below was measured in
// system fallbacks and reported as verified. The fonts are now vendored
// and served from disk (see build-page.mjs).
//
// This check exists because the failure mode has no symptom. If the
// @font-face rules stop resolving -- a renamed file, a moved vendor
// directory, a browser that declines file:// subresources -- nothing
// errors and nothing looks wrong. The suite just quietly goes back to
// measuring a different document, which is the exact defect this closed.
//
// Measured rather than asserted on document.fonts, because "loaded"
// there only means the file parsed. The question worth asking is whether
// TEXT IS ACTUALLY SET IN IT. Big Shoulders Display is condensed: the
// same string sets about 36% narrower than the sans fallback. A 15%
// threshold is far below that and far above any hinting noise.
const fontsReal = await page.evaluate(async () => {
  await document.fonts.ready;
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;left:-9999px;font-size:100px;font-weight:800";
  probe.textContent = "HAMBURGEFONS";
  document.body.appendChild(probe);
  const width = (fam) => { probe.style.fontFamily = fam; return probe.getBoundingClientRect().width; };
  const out = {
    display: width("'Big Shoulders Display'"), displayFallback: width("sans-serif"),
    sans: width("'IBM Plex Sans'"), mono: width("'IBM Plex Mono'"),
  };
  probe.remove();
  return out;
});
t.check("the display face is really loaded, not substituted",
  fontsReal.display < fontsReal.displayFallback * 0.85,
  `${Math.round(fontsReal.display)}px vs ${Math.round(fontsReal.displayFallback)}px fallback`);
t.check("and the two Plex faces are distinct from it and from each other",
  fontsReal.sans !== fontsReal.display && fontsReal.mono !== fontsReal.sans,
  `display ${Math.round(fontsReal.display)}, sans ${Math.round(fontsReal.sans)}, mono ${Math.round(fontsReal.mono)}`);

// The chart groups by wave by default (Dan, 15 Aug: 27 rows in one band
// made it unreadable). Checks that inspect per-jurisdiction scheduling
// have to open it first, and must be able to do so more than once
// without toggling it shut again.
// TWO EXPLICIT HELPERS, not one that infers the current view from the
// button's label. The label flipped when the default did on 17 August,
// and a helper that reads "Show every jurisdiction" to decide silently
// became a no-op in one direction -- which is a test moving to a state it
// did not intend and asserting there anyway.
const toRunway = async () => {
  if (/Show every/i.test(await page.locator("#ganttToggle").innerText())) {
    await page.click("#ganttToggle"); await page.waitForTimeout(600);
  }
};
const toGrouped = async () => {
  if (/Group by wave/i.test(await page.locator("#ganttToggle").innerText())) {
    await page.click("#ganttToggle"); await page.waitForTimeout(600);
  }
};
const expandGantt = toRunway;

// ---- 1. it calculates at all ----
// ---- 1a. the page assumes no footprint ----
//
// It used to open with eight large European economies. Migration 570
// fixed the BUG in that -- it indexed a name-ordered list and ticked
// positions in a region-ordered one, so the eight landed on Czech
// Republic, Poland, Portugal, the UK, Australia, New Zealand, Canada and
// Ecuador. Migration 579 fixed the PRINCIPLE: every other default on this
// page is a published benchmark a reader can accept, and the country list
// is a fact about their business that we cannot know.
//
// The check that used to live here asserted the eight by name, which was
// right at the time and is exactly the check that would have caught the
// positional bug had it existed. It is kept in spirit: assert the opening
// state precisely, whatever it is, because "some countries are selected"
// is what let eight wrong ones through.
const opening = await page.evaluate(() =>
  [...document.querySelectorAll("#countryList input[type=checkbox][data-i]")]
    .filter((b) => b.checked).map((b) => COUNTRIES[+b.dataset.i][1]));
t.check("nothing is selected on load, so no footprint is assumed",
  opening.length === 0, opening.join(","));
t.check("and the picker says so rather than looking broken",
  await page.evaluate(() => /No jurisdictions selected/i.test(
    document.getElementById("selCount").innerText)));

// The subscribed list is a one-tap shortcut the reader chooses, not a
// silent premise -- and it is an ALERTS list, so the page says what it is.
await page.check("#useSubs"); await page.waitForTimeout(250);
t.check("the saved-countries box is a working shortcut",
  await page.evaluate(() => document.querySelectorAll("#countryList input:checked").length) === 11);
t.check("and the page says the saved list is an alerts list, not a footprint",
  await page.evaluate(() => /alerts/i.test(document.getElementById("subsWhat").innerText)));

// SEARCH. Seventy rows in a scrolling box is a haystack; it matches the
// country code too, because half this audience says DE for Germany.
await page.fill("#cSearch", "german"); await page.waitForTimeout(250);
const byName = await page.evaluate(() =>
  [...document.querySelectorAll("#countryList .crow")].filter((r) => !r.classList.contains("hidden")).length);
t.check(`search by name narrows the list (${byName} rows)`, byName === 1, byName);
t.check("and empty region headings go with their rows",
  await page.evaluate(() =>
    [...document.querySelectorAll("#countryList .creg")].filter((r) => !r.classList.contains("hidden")).length === 1));
await page.fill("#cSearch", "zzzz"); await page.waitForTimeout(250);
t.check("and a search with no hits says so",
  await page.evaluate(() => !document.getElementById("cNoMatch").classList.contains("hidden")));
await page.fill("#cSearch", ""); await page.waitForTimeout(250);

// Back to a real selection for everything below, which was written when
// eight countries were selected on load.
await selectEU(); await page.waitForTimeout(200);
await page.click("#run");
await page.waitForTimeout(500);
t.check("results panel shown",
  !(await page.locator("#results").getAttribute("class")).includes("hidden"));
t.check("gantt drawn", (await page.locator("#gantt svg").count()) === 1);
const headline = await page.locator("#summary .stat .n").first().textContent();
t.check("summary carries a money figure", /[\d,]+/.test(headline), headline);

// ---- 1b. the summary's tooltips are filled by the render that emits them ----
//
// The platform-fee and running-cost tooltips carry a meta line written by
// markOverridden() into an empty span, because the figure has to survive a
// currency switch. That function ran on input, change, reset and the
// currency recalc -- and not after build(). So both opened blank after
// Calculate and filled on the reader's next keystroke anywhere.
//
// Asserted on the SUMMARY specifically: the panel's own 22 slots were
// always filled, so a whole-page count of empty spans read 2-of-24 and
// looked like rounding.
const summaryMeta = await page.evaluate(() =>
  [...document.querySelectorAll("#summary [data-tm]")].map((s) => s.textContent.trim()));
t.check("summary tooltips are filled by Calculate, not by the next keystroke",
  summaryMeta.length >= 2 && summaryMeta.every((x) => x.length > 0),
  `${summaryMeta.filter((x) => !x).length} of ${summaryMeta.length} empty`);

// ---- 2. presets actually select ----
await selectEU(); await page.waitForTimeout(100);
const eu = await page.locator("#countryList input:checked").count();
await page.click("#selNone"); await page.waitForTimeout(100);
const none = await page.locator("#countryList input:checked").count();
await selectMandate(); await page.waitForTimeout(100);
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
// The hint line under each panel field went in migration 563; what it
// said now lives in the last line of the tooltip. The check follows the
// content rather than the element, because the content is the promise.
t.check("override annotates the tooltip",
  /Your value/.test(await page.locator('[data-tm="costNow"]').textContent()));
t.check("and the tooltip still says what the default was",
  /Our default is 9\.84/.test(await page.locator('[data-tm="costNow"]').textContent()),
  await page.locator('[data-tm="costNow"]').textContent());
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
// The "Nw elapsed" text lives in the WAVE BAND HEADERS, which only the
// grouped view draws -- and grouping stopped being the default on 17
// August. The measurement is unchanged; it just has to be taken in the
// view that renders it.
await toGrouped();
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
// MIGRATION 585 FOLDS THE WORKING AT EVERY WIDTH, not only on a phone, so
// every check that reads a row's derivation has to open it first. Opening
// it explicitly is stronger than the old read, not weaker: it proves the
// disclosure works as well as that the text is there. Reading textContent
// instead would have been one character and would have passed against a
// row nobody can open.
const openWorkings = async (pg = page) => {
  await pg.evaluate(() => document.querySelectorAll("details.working").forEach((d) => { d.open = true; }));
  await pg.waitForTimeout(120);
};
await openWorkings();
const direct = await page.locator("#savingsTable").innerText();
t.check("the cycle-time row carries Ardent's supplier-inquiry split",
  /12\.8%/.test(direct) && /24\.0%/.test(direct), direct.slice(0, 160));
t.check("and no longer says the only figure is an anecdote",
  !/only figures available are one NHS anecdote/i.test(direct));

// AND IT MOVED BACK TO THE ROW. The citation lived in the notes panel's
// "Named, but not priced" card, which went with "The reasoning" block in
// 582 -- leaving a grade-A citation rendered nowhere, which is the
// orphaning this project has already found three times and would have
// made four. It is now in the justification of the cycle-time row, which
// is the row it describes, alongside the NHS query figure that lost its
// home in the same edit.
const cycTip = await page.evaluate(() => {
  const el = [...document.querySelectorAll('#savingsTable tr[data-row="cycle"] .ev')]
    .find((e) => e.firstChild && /2\.9 vs 13\.5 days/.test(e.firstChild.textContent || ""));
  return el ? el.querySelector(".tip").textContent : "";
});
// The figure is quoted; the reason it proves nothing has to be quoted
// with it, or citing it is worse than omitting it.
t.check("the cycle-time citation explains that the gap is definitional",
  /tautology/.test(cycTip) && /Best-in-Class/.test(cycTip), cycTip.slice(0, 140));

// Match the MARKER's own label, not the element's textContent — that
// includes the tooltip, and three markers on this row now mention an
// exception rate, so the loose match started picking the wrong one.
const excTip = await page.evaluate(() => {
  const el = [...document.querySelectorAll("#savingsTable .ev")]
    .find((e) => e.firstChild && /market exception rate/.test(e.firstChild.textContent || ""));
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
const guards = await guardText();
t.check("the mistimed-obligation guard fires", /earlier than the date this plan plans for/.test(guards),
  guards.slice(0, 120));
t.check("it names the countries and both dates",
  ["Denmark", "Portugal", "Brazil", "2027-01-01", "2028-01-01"].every((x) => guards.includes(x)),
  guards.slice(0, 200));

// ---- 9. the adjust panel actually rearranges the plan ----
// READS THE WAVE DATES, not the "Nw elapsed" caption.
//
// That caption lived in the EXPANDED view's band headers, and the runway
// view has no bands -- so after 17 August this returned an empty array
// and the check compared [] with [] and passed. A check whose two sides
// are both empty is not a weaker check, it is no check, and it would have
// gone on reporting PASS for as long as anyone left it alone.
//
// The wave dates are what actually has to change when a country is moved
// between waves, and the grouped view draws them.
const waveText = () => page.evaluate(() =>
  [...document.querySelectorAll("#gantt svg text")].map((n) => n.textContent)
    .filter((x) => /\d{4}-\d{2}-\d{2}/.test(x)));
await selectMandate(); await page.waitForTimeout(150);
await page.click("#run"); await page.waitForTimeout(600);
await toGrouped();
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
  /pinned start date finishes after the deadline/i.test(await guardText()));

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
await toRunway();
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
await selectMandate(); await page.waitForTimeout(150);
await page.click("#run"); await page.waitForTimeout(600);
// `before` was captured in the grouped view; the intervening checks moved
// to the runway view, and comparing wave labels across two different
// renderings compares two different things.
await toGrouped();
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
  /550,000 invoices\s*×\s*\$0\.40/.test(await page.locator('#assump [data-tm="cPlat"]').textContent()),
  await page.locator('#assump [data-tm="cPlat"]').textContent());

// A vendor quote beats our multiplier permanently. Getting this wrong in
// the other direction — recomputing over a number someone typed — would
// be worse than never deriving it at all.
await page.fill("#cPlat", "125000"); await page.waitForTimeout(200);
await page.fill("#volAR", "250000"); await page.waitForTimeout(250);
t.check("a typed vendor price stops tracking the volumes",
  (await page.inputValue("#cPlat")) === "125000", await page.inputValue("#cPlat"));
t.check("and is flagged as an override",
  /Your value/.test(await page.locator('#assump [data-tm="cPlat"]').textContent()));

await page.selectOption("#cur", "GBP"); await page.waitForTimeout(400);
t.check("the per-invoice rate is quoted in the selected currency",
  /£0\.30/.test(await page.locator('#assump [data-tm="cPlat"]').textContent()),
  await page.locator('#assump [data-tm="cPlat"]').textContent());
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

await selectEU(); await page.waitForTimeout(200);
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
await openWorkings();
t.check("1.67 FTE at the tax rate, not the data-entry rate",
  /1\.67 FTE × \$116,800/.test(await indirect().innerText()), await indirect().innerText());

await page.fill("#volAP", "1000000"); await page.fill("#volAR", "500000");
await page.click("#run"); await page.waitForTimeout(800);
const ind1m = await indValue();
// Tolerance of a few dollars: both figures are rounded for display, so
// exact equality would be testing the rounding rather than the scaling.
t.check(`ten times the volume, ten times the saving (${ind100k} -> ${ind1m})`,
  Math.abs(ind1m - ind100k * 10) <= 10, `${ind100k} -> ${ind1m}`);
await openWorkings();
t.check("and the row shows the APQC-implied headcount it scaled from",
  /83\.3 AP FTE/.test(await indirect().innerText()), await indirect().innerText());

// The cap is still there and still binding at 25 jurisdictions — the
// difference is that it now says so. An invisible ceiling is
// indistinguishable from a model that has stopped working.
t.check("the binding cap is called out",
  /cap is binding/.test(await guardText()));

await page.click("#selNone");
await page.evaluate(() => {
  [...document.querySelectorAll("#countryList label")].forEach((l) => {
    if (/^\s*(France|Italy)/.test(l.textContent)) l.querySelector("input").click();
  });
});
await page.click("#run"); await page.waitForTimeout(700);
t.check("and stays quiet when the cap is not binding",
  !/cap is binding/.test(await guardText()));

// ---- 15. two FTE rates, and the decomposition that must not double count ----
// One field used to price both a tax professional reconciling clearance
// regimes and a mailroom clerk keying invoices — roles that differ by
// roughly double and offshore completely differently. The data-entry rate
// exists to restate a saving already counted, never to add one, because
// the ATO source says the per-invoice benchmark IS the labour.
await selectEU(); await page.waitForTimeout(200);
await page.fill("#volAP", "100000"); await page.fill("#volAR", "50000");
await page.click("#run"); await page.waitForTimeout(700);

t.check("both rates are in the assumptions panel, and differ",
  (await page.inputValue("#fteCost")) === "116800"
  && (await page.inputValue("#fteEntry")) === "54000",
  `${await page.inputValue("#fteCost")} / ${await page.inputValue("#fteEntry")}`);

const directTotal = Number((await page.locator('#savingsTable tr[data-row="ap"]')
  .locator("td").nth(2).innerText()).replace(/[^\d]/g, ""));
// Dan, 15 Aug 2026: the headcount note and the tangible/intangible note
// "overcrowd the main roi-calculator page, and I think should reside in
// assumptions, sources and caveats". Both did — and both DUPLICATED a
// panel card that already existed and said more. So the notes come off
// the page entirely, and the only thing they carried that the panel did
// not (the FTE figures) moves into the card that already explains them.
//
// The earlier reasoning for keeping the clause inline — "without it this
// is a double count" — went with it, and correctly: the double-count risk
// existed because a headcount figure was on the page beside a money
// figure. With no headcount on the page there is nothing to double-count,
// and the figure now sits in the same paragraph as its own caveat.
t.check("the headcount note is off the main page",
  (await page.locator("#savingsTable .note").count()) === 0,
  await page.locator("#savingsTable").innerText().then((x) => x.slice(-160)));
// THE HEADCOUNT CARD WENT WITH "THE REASONING" IN 582, and it is the one
// removal with nothing behind it.
//
// Dan mapped three of the four cards onto what already carries them, each
// unprompted and each correct: "compliance alone is referenced in the
// gross savings headline... 'Annual saving (+$295,851 available on a
// wider scope)'", and "Avoided rework on data-entry errors also appears
// on the savings section, with a tooltip that clarifies". "Named, but not
// priced" is the savings table's own group heading.
//
// THIS ONE HAS NO SUCH HOME. It expressed the processing saving in people
// -- 3.6 FTE keying invoices today, 2.1 released -- said in terms that
// "adding both would count it twice", and reconciled the headcount back
// to the AP row it decomposes. Nothing else on the page states the saving
// in headcount at all.
//
// captureFte and captureValue are still COMPUTED, and still drive guard 6
// (the bottom-up labour cannot exceed the top-down saving), so this is not
// dead data -- it is a reader-facing view that was removed. Retired here
// rather than deleted so it is one edit to restore, and flagged to Dan
// rather than absorbed quietly.
//
//   was: /3\.6 FTE keying invoices today/
//        /2\.1 are released/
//        /adding both would count it twice/i
//        notesText.includes(String(directTotal.toLocaleString("en-US")))
//
// directTotal is read above and still used by the guard-6 checks below.
void directTotal;

// Guard 6: the bottom-up labour cannot exceed the top-down saving it is a
// component of. Forced by pushing the data-entry rate far past market.
await page.evaluate(() => { document.getElementById("assump").open = true; });
await page.fill("#fteEntry", "900000");
await page.click("#run"); await page.waitForTimeout(700);
t.check("a data-entry rate that outruns the whole saving is called out",
  /capture headcount is worth more than the whole processing saving/i
    .test(await guardText()));
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
await selectEU(); await page.waitForTimeout(200);
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
// Recalculated for migration 557. The AP baseline is no longer Ardent's
// blended $9.84 but the manual-invoice cost implied by it ($14.23), and
// the saving is scaled by how much is NOT already arriving structured.
// At the 50% default: 100,000 x 14.23 x 60% x 50% = $426,900 gross,
// x 42.86% capture share = $182,969 banked.
t.check("compliance-only banks the capture share of AP, not all of it",
  (await cell("ap", 3)) === 182969, await cell("ap", 3));
// Migration 580: NO LONGER IN FULL. The AR row carried no already-
// structured discount at all while the AP row above it carried one, so
// the page enforced "a saving can only be taken once" on the half it
// receives and waived it on the half it sends. Dan: "I'm not sure it
// makes sense for us to claim 100% of the AR invoice cost as savings."
// 50,000 x $6.50 x 60% x (1 - 64% already issued structured) = $70,200.
// Both columns still agree: what the mandate compels, it banks in full --
// that part of the old check was right and is deliberately kept.
t.check("banks the AR saving in full, on the share not already structured",
  (await cell("ar", 3)) === 70200 && (await cell("ar", 2)) === 70200,
  [await cell("ar", 2), await cell("ar", 3)].join(" / "));
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
// Migration 584 turned the tile into YEAR ONE COST, so its sub-line now
// names three figures rather than two -- implementation, software fees,
// internal running cost. Parsed by the label beside each number rather
// than by their order, because the order is the thing most likely to be
// reworded next and a positional parser would then read the wrong figure
// while continuing to pass.
const runParts = async () => {
  const sub = await page.locator("#summary .stat").nth(1).locator(".statrun").innerText();
  const num = (label) => {
    const m = sub.match(new RegExp(label + "\\s*\\(\\D?([\\d,]+)", "i"));
    return m ? Number(m[1].replace(/,/g, "")) : null;
  };
  const plat = num("software fees"), run = num("internal running cost");
  return plat === null || run === null ? null : [plat, run];
};
const implFromTile = async () => {
  const sub = await page.locator("#summary .stat").nth(1).locator(".statrun").innerText();
  const m = sub.match(/implementation\s*\(\D?([\d,]+)/i);
  return m ? Number(m[1].replace(/,/g, "")) : null;
};
const runFromNote = async () => {
  const p = await runParts();
  return p ? p[0] + p[1] : null;
};
const netStat = async () => Number((await page.locator("#summary .stat").nth(2)
  .locator(".n").innerText()).replace(/[^\d]/g, ""));
t.check("and the banked total is what the executive summary works from",
  totBanked === (await netStat()) + (await runFromNote()),
  `${totBanked} vs net ${await netStat()} + run ${await runFromNote()}`);
t.check("the running costs that bridge saving to net are stated in the year one tile",
  (await runFromNote()) !== null,
  await page.locator("#summary .stat").nth(1).innerText());
// AND THE TILE MUST ADD UP TO ITS OWN HEADLINE. Migration 584 made the
// headline the year one TOTAL and moved the implementation figure into
// the breakdown beneath it, so the tile is now the only place on the page
// where a reader can check that sum -- and the only place it can be
// wrong without any other figure moving.
const yrOneHead = Number((await page.locator("#summary .stat").nth(1).locator(".n").innerText())
  .replace(/[^\d]/g, ""));
const [platY, runY] = (await runParts()) || [];
t.check(`the year one headline is its own three parts (${yrOneHead.toLocaleString()})`,
  yrOneHead === (await implFromTile()) + platY + runY,
  `${yrOneHead} vs ${await implFromTile()} + ${platY} + ${runY}`);
// AND THE PAYBACK TILE DIVIDES THE IMPLEMENTATION, not the year one total.
// This is the trap the whole arrangement exists to avoid: year one cost
// over net annual saving is 15 months where the correct figure is 11.6,
// because the recurring costs are already out of the denominator. If the
// numerator ever silently becomes yearOne this check is what says so.
const payTxt = await page.locator("#summary .stat").nth(3).locator(".n").innerText();
const payMo = Number(payTxt.replace(/[^\d]/g, ""));
const netForPay = await netStat();
t.check(`payback divides the implementation, not the year one cost (${payTxt.trim()})`,
  Math.abs(payMo - Math.round((await implFromTile()) / netForPay * 12)) <= 1,
  `${payTxt.trim()} vs impl ${await implFromTile()} / net ${netForPay}`);
// And the bridge states the year one net, which is the figure that makes
// the payback tile reconcile with the cost tile beside it.
const bridgeTxt = await page.locator("#summary .stat").nth(2).locator(".statbridge").innerText();
// \D* not \D?, because a large footprint makes year one net NEGATIVE and
// the rendered figure carries both a minus and a currency symbol. The
// first version matched only one non-digit and read NaN on exactly the
// case worth checking -- a check that works while the answer is
// comfortable and gives up when it is not.
const yrNetM = bridgeTxt.match(/nets\s*([^\d]*)([\d,]+)/i);
const yrNet = yrNetM
  ? Number(yrNetM[2].replace(/,/g, "")) * (/[-\u2212(]/.test(yrNetM[1]) ? -1 : 1)
  : NaN;
const grossStat = Number((await page.locator("#summary .stat").nth(0).locator(".n").innerText())
  .replace(/[^\d]/g, ""));
t.check(`the bridge states year one net, and it reconciles (${yrNet})`,
  Number.isFinite(yrNet) && yrNet === grossStat - yrOneHead,
  `${yrNet} vs ${grossStat} - ${yrOneHead}`);
// DERIVED, not hardcoded. This read `.includes("603,931")` until
// migration 558, and that literal broke on every legitimate change to
// any priced row — three times in a fortnight. A baseline you re-type
// each time it goes red is not a check, it is a chore that teaches you
// to silence it. What the page actually promises is that the gap
// between the two totals is stated rather than left for the reader to
// subtract, so assert exactly that and let the value move.
const unlocked = totGross - totBanked;
t.check(`and the unlocked remainder is stated, not left to be subtracted (${unlocked.toLocaleString()})`,
  (await page.locator("body").innerText()).includes(unlocked.toLocaleString()),
  `${unlocked.toLocaleString()} not found on the page`);

// The tags are the whole defence of this change: the reasoning has to be
// on the row, not in a footnote, because the change makes the answer
// better and that is exactly when a reader should be able to audit it.
const tags = await page.evaluate(() =>
  [...document.querySelectorAll("#savingsTable .tag.bank, #savingsTable .tag.unbank")].map((e) => e.textContent));
// 544 replaced the hardcoded English literals 'banks' / 'not banked' /
// '43% banks' with the D1-backed tag.saved and tag.notSaved, so these are
// translatable for the first time.
t.check("every priced row says what it saves on compliance",
  tags.includes("43% saved") && tags.includes("saved") && tags.includes("not saved"), tags);

// This used to match lowercase "not banked" inside the total row's
// parenthetical rather than the tag on the rework row — so when 536
// replaced the parenthetical it failed, having never tested the row it
// names. innerText applies text-transform, so the tag reads "NOT BANKED":
// match case-insensitively, and against the rework row specifically.
const reworkBankRow = await page.locator('#savingsTable tr[data-row="rework"]').innerText();
t.check("rework is not counted as saved on a compliance scope",
  /not saved/i.test(reworkBankRow) && /—|&mdash;/.test(reworkBankRow.split("\t").pop()),
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
    .test(await guardText()));

await page.fill("#errRate", "20");
await page.click("#run"); await page.waitForTimeout(700);
t.check("claiming more than the best quartile achieves is called out",
  /removes more exceptions than separate the best quartile/i
    .test(await guardText()),
  (await guardText()).slice(0, 160));

await page.click("#resetDefaults"); await page.waitForTimeout(400);
await page.click("#run"); await page.waitForTimeout(700);
t.check("reset restores the elimination assumption too",
  (await page.inputValue("#errElim")) === "80");

// Migration 558 replaced the $45 with a duration. Until then the row was
// priced by an ungraded guess, so the label had to say "our estimate,
// not yours" — the honest thing to do with a number nobody could source.
// It is now the ATO's 15 minutes at the BLS-derived data-entry rate, so
// the unchanged state cites a source rather than apologising for the
// absence of one, and the changed state is still attributed to the
// reader.
await openWorkings();
const reworkRow = await page.locator('#savingsTable tr[data-row="rework"]').innerText();
// Migration 564 split the cell into Calculation and Justification, so
// the arithmetic and its sourcing are now asserted separately — which is
// the point of the split.
t.check("the calculation line carries the rate the money comes from",
  /\$25\.96\/h/.test(reworkRow), reworkRow.slice(0, 260));
t.check("and the justification names the source, unchanged",
  /ATO exception times/.test(reworkRow) && /loaded data-entry rate/.test(reworkRow),
  reworkRow.slice(0, 260));
await page.fill("#errMins", "30");
await page.click("#run"); await page.waitForTimeout(700);
await openWorkings();
const reworkMine = await page.locator('#savingsTable tr[data-row="rework"]').innerText();
t.check("and becomes theirs once they change it",
  /your resolution time/.test(reworkMine), reworkMine.slice(0, 220));

// The lever has to be linear in minutes, which is the whole argument for
// asking for a duration: doubling the time doubles the cost, and a
// reader can sanity-check that against their own experience.
const reworkAt = async (mins) => {
  await page.fill("#errMins", String(mins));
  await page.click("#run"); await page.waitForTimeout(700);
  return +(await page.locator('#savingsTable tr[data-row="rework"] td').nth(2).innerText())
    .replace(/[^\d]/g, "");
};
const m15 = await reworkAt(15), m30 = await reworkAt(30), m0 = await reworkAt(0);
t.check(`doubling the minutes doubles the row (${m15.toLocaleString()} -> ${m30.toLocaleString()})`,
  Math.abs(m30 - m15 * 2) <= 2, `${m15} x 2 vs ${m30}`);
t.check("and zero minutes prices nothing", m0 === 0, m0);
// The ATO's own data-accuracy line is 5 minutes and the citation offers
// it. A reader taking that option must not meet a broken page.
const m5 = await reworkAt(5);
// Tolerance is the cent-rounding, not slack. The per-error cost is
// rounded to cents so the basis sentence and the arithmetic agree —
// the same fix migrations 536 and 557 applied after a printed figure
// disagreed with the total computed from it. At 10,000 errors and 80%
// elimination, a half-cent is $40 per comparison.
const centSlack = 10_000 * 0.8 * 0.005 * 3;
t.check(`the citation's narrower 5-minute option works too (${m5.toLocaleString()})`,
  m5 > 0 && Math.abs(m5 * 3 - m15) <= centSlack, `${m5} x 3 vs ${m15}, slack ${centSlack}`);
await page.fill("#errMins", "15");
await page.click("#run"); await page.waitForTimeout(700);

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
await selectEU(); await page.waitForTimeout(200);
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
// "Corrections applied" was removed in 565 at Dan's request: it was a
// changelog entry rather than a caveat, describing work done to the page
// rather than anything about the reader's case, and all three fixes it
// named were already reflected in the figures it sat beneath.
//
// AND THE FOUR REASONING CARDS WENT IN 582. Dan, 18 August 2026: "Remove
// 'The reasoning' part of the 'Assumptions, sources and caveats', and
// replace it with the 'How much of this is evidenced' bar."
//
// Retired here rather than deleted, with what each carried, because three
// of the four were duplicates and two facts were not -- see the note in
// migration 582. A check that stops existing leaves no record that the
// thing it defended ever mattered.
//
//   "What compliance alone saves"       -> the SAVED / NOT SAVED badges
//                                          and the AP row's justification
//   "Rework sits outside the total"     -> the rework row's own basis
//                                          column and the grade D card
//   "Named, but not priced"             -> the savings table's own
//                                          "Named, not priced" group
//   "The same saving, counted in people"-> NOWHERE. Flagged to Dan.
["Grade A", "Grade D"].forEach((phrase) =>
  t.check(`the panel carries: ${phrase}`, notes.includes(phrase)));
// The scorecard replaced them, so the panel must open ON the scorecard
// rather than on a gap. This is the check that would fail if the swap had
// removed a section and put nothing in its place.
// Matched case-insensitively: .scoreh is text-transform:uppercase and
// innerText honours the computed style, so the rendered string is
// "HOW MUCH OF THIS IS EVIDENCED". The first version of this check
// compared against the source casing and failed on a correct page.
t.check("the panel now opens on the evidence scorecard",
  /how much of this is evidenced/i.test(notes), notes.slice(0, 120));

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
    // A grid may legitimately WRAP -- the cost group holds five fields in
    // four columns since migration 557 -- so "every input shares a top"
    // stopped being the property. What still has to hold is that inputs
    // in the SAME ROW line up: the original defect was a label wrapping
    // to two lines and pushing its input below its neighbours'.
    // Rows are identified by the CELL top, not the input top, because a
    // misaligned input is exactly what this is looking for.
    const bad = [];
    document.querySelectorAll(".grid").forEach((g) => {
      const cells = [...g.querySelectorAll(":scope > div")]
        .filter((d) => d.querySelector("input, select"));
      if (cells.length < 2) return;
      const rows = new Map();
      for (const c of cells) {
        const key = Math.round(c.getBoundingClientRect().top);
        (rows.get(key) || rows.set(key, []).get(key)).push(c);
      }
      for (const row of rows.values()) {
        if (row.length < 2) continue;
        const tops = [...new Set(row.map((c) =>
          Math.round(c.querySelector("input, select").getBoundingClientRect().top)))];
        if (tops.length > 1) bad.push(Math.max(...tops) - Math.min(...tops));
      }
    });
    return bad;
  });
  t.check(`grid fields share a baseline at ${w}px`, off.length === 0, off.join("/"));
}
await page.setViewportSize({ width: 1280, height: 1000 });
await page.waitForTimeout(150);

// ---- 21. the savings pie ----
await selectEU(); await page.waitForTimeout(200);
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
// 567: five KPI boxes, not four, and page 1 carries the footprint
// sentence. Both asked for by Dan; both checked against the SCREEN's own
// content rather than literals, because the whole point of that
// migration was that the PDF stopped holding its own copies.
const strip = await page.evaluate(() => ({
  pdfBoxes: document.querySelectorAll("#pdfdoc .kpi").length,
  screenStats: document.querySelectorAll("#summary .grid .stat").length,
}));
t.check(`the PDF strip has as many boxes as the screen (${strip.pdfBoxes} vs ${strip.screenStats})`,
  strip.pdfBoxes === strip.screenStats && strip.pdfBoxes === 5, JSON.stringify(strip));
// Migration 587 rewrote this sentence to reconcile the reader's own count
// with the plan's -- "You selected 11 jurisdictions. The plan covers 12"
// -- so the check follows the fact rather than the old opening words, and
// gets stricter: BOTH counts have to reach the PDF, because the whole
// point of the rewrite is that one without the other is the defect.
t.check("and page 1 states the footprint before it states the money",
  /You selected \d+ jurisdiction/.test(pdf.p1) && /plan covers \d+/.test(pdf.p1)
    && /country-system integration/.test(pdf.p1), pdf.p1.slice(0, 220));
// And the integration count has to say where the extra ones come from.
// The investment side is built on it, and "roughly 22" beside "12
// jurisdictions, 1 system" reads as an error unless the sentence accounts
// for the gap.
t.check("and says why there are more integrations than jurisdictions",
  /member state/i.test(pdf.p1), pdf.p1.slice(0, 260));
// The ribbon on each box says which way the number points. Dan: "green,
// indicating positive saving, or net benefit, and red ribbon to indicate
// a cost. I can see that the one-off investment is green, but this is an
// overhead." Every box carried the same green before 567, so the one
// figure a reader most needs to read as money going OUT was coloured as
// money coming in.
// #pdfdoc's rules live inside @media print, so computed styles are the
// SCREEN values unless print is emulated. Read that way, every ribbon
// came back the same off-white and the check would have "passed" against
// a colour the reader never sees. Restored to screen afterwards, because
// every later check in this suite reads the on-screen page.
await page.emulateMedia({ media: "print" });
await page.waitForTimeout(200);
const ribbons = await page.evaluate(() => {
  const out = {};
  document.querySelectorAll("#pdfdoc .kpi").forEach((k) => {
    const label = k.querySelector(".l").innerText.trim();
    out[label] = getComputedStyle(k).borderLeftColor;
  });
  return out;
});
const GREEN = "rgb(47, 125, 85)", RED = "rgb(181, 67, 47)";
t.check(`the saving is green (${ribbons["Gross annual saving"]})`,
  ribbons["Gross annual saving"] === GREEN, JSON.stringify(ribbons));
t.check(`the year one cost is red, not green (${ribbons["Year one cost"]})`,
  ribbons["Year one cost"] === RED, JSON.stringify(ribbons));
t.check(`a positive net annual is green (${ribbons["Net annual saving, year two onward"]})`,
  ribbons["Net annual saving, year two onward"] === GREEN, JSON.stringify(ribbons));
await page.emulateMedia({ media: "screen" });
t.check("and the year one box carries its three-part breakdown",
  /Implementation \(/i.test(pdf.p1) && /software fees/i.test(pdf.p1)
    && /internal running cost/i.test(pdf.p1), pdf.p1.slice(0, 260));
// The bridge has to reach the PDF too. It is the surface most likely to
// be read with nobody to ask, so it is the one that can least afford a
// cost tile and a payback tile that do not reconcile.
t.check("and the PDF carries the bridge that makes the payback reconcile",
  /Year one nets/i.test(pdf.p1), pdf.p1.slice(0, 300));

// MIGRATION 585 MOVED THIS OUT OF THE PARAGRAPH AND INTO A TILE. It was
// the fifth sentence of the footprint prose while being the most
// board-relevant fact on the page. The check follows the fact rather than
// the sentence that used to carry it -- and the PDF is the surface where
// it matters most, because a board pack is read without the tool open.
t.check("naming the nearest binding date, or saying there is none",
  /Nearest binding date|None of the selected jurisdictions/i.test(pdf.p1),
  pdf.p1.slice(0, 240));
t.check("and the PDF prints the date itself, not just the label",
  /Nearest binding date/i.test(pdf.p1)
    ? /\d{4}-\d{2}-\d{2}/.test(pdf.p1) : true, pdf.p1.slice(0, 240));
// "Banked annually" sat over l1Banked + l2 — a figure including the
// modelled indirect row, which is not banked in this page's sense of the
// word. 536 relabelled it rather than changing the arithmetic, per Dan.
//
// 567: the PDF now uses the SAME words as the screen. 543 renamed the
// summary stats and the PDF kept its own copies for six days, so one
// figure had two names depending on where you read it. Asserted against
// the screen's label rather than a literal, so the two cannot drift
// apart again without this failing.
// Case-insensitive: the screen label is uppercased by CSS and innerText
// reports the rendered case, while the PDF prints it as stored. The
// WORDS are the thing that must match, not the styling.
const screenLabel = (await page.locator("#summary .stat .l").first().innerText())
  .split("(")[0].trim().toLowerCase();
t.check(`page 1 uses the screen's own headline label (${screenLabel})`,
  pdf.p1.toLowerCase().includes(screenLabel) && /Payback/.test(pdf.p1),
  `${screenLabel} :: ${pdf.p1.slice(0, 140)}`);
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
await selectEU(); await page.waitForTimeout(200);
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
//
// READ FROM THE TILE'S BREAKDOWN, not its headline. Migration 584 made
// the headline year one cost -- implementation plus a year of recurring
// -- so a check on the headline is no longer a check on the one-off it
// was written to test, and would have silently become a check of
// implementation + $90,000 instead.
const oneOff = await implFromTile();
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
await selectEU(); await page.waitForTimeout(200);
await page.click("#run"); await page.waitForTimeout(900);

// THE DEFAULT REVERSED ON 17 AUGUST 2026. Grouping was the default
// because 46 per-jurisdiction rows were unreadable, and that was right
// about the chart it described: a four-year axis with a median bar two
// pixels wide. The runway view draws each row from today to its own
// deadline, so the empty space becomes the slack and the rows are worth
// having one each. Grouping is still a click away.
const chartH = () => page.evaluate(() =>
  +document.querySelector("#gantt svg").getAttribute("viewBox").split(" ")[3]);
const runway = await chartH();
t.check(`runway view by default, one row per jurisdiction (${runway}px)`,
  await page.evaluate(() => {
    const l = [...document.querySelectorAll("#gantt svg text")]
      .map((n) => (n.firstChild && n.firstChild.textContent) || "");
    return l.includes("Germany") && l.includes("European Union");
  }), runway);

// EVERY ROW CARRIES A RUNWAY LINE. Without it the view is the old chart
// with the bands removed: the gap between today and the deadline has to
// be drawn or it reads as absence rather than as slack.
const runwayLines = await page.evaluate(() =>
  [...document.querySelectorAll("#gantt svg line")]
    .filter((n) => n.getAttribute("stroke") === "#2b3c5a"
      && n.getAttribute("stroke-width") === "2").length);
t.check(`each dated row is drawn on a runway (${runwayLines} tracks)`,
  runwayLines >= 5, runwayLines);

// SORTED BY URGENCY. The row you must act on is the first one, which is
// the entire reason for abandoning the wave ordering here.
const order = await page.evaluate(() => {
  const svg = document.querySelector("#gantt svg");
  const names = [...svg.querySelectorAll('text[font-size="12"]')]
    .map((n) => (n.firstChild && n.firstChild.textContent) || "");
  return names.filter((n) => n && n !== "Select & contract");
});
t.check("and the most urgent jurisdiction is drawn first",
  order[0] === "France", order.slice(0, 4).join(" > "));

// EVERY ROW GETS ITS OWN STATUS. The old condition drew one per WAVE, so
// two countries sharing a deadline left the second with no slack figure.
// Measured on the pair that exposed it: Germany and Poland share
// 2027-01-01, so under the old one-per-wave condition the second of them
// rendered with no slack figure at all.
const sharedPair = await page.evaluate(() => {
  const svg = document.querySelector("#gantt svg");
  const rows = [...svg.querySelectorAll('text[font-size="12"]')]
    .filter((n) => ["Germany", "Poland"].includes((n.firstChild && n.firstChild.textContent) || ""));
  return rows.map((n) => {
    const y = n.getAttribute("y");
    const status = [...svg.querySelectorAll("text")]
      .find((m) => m.getAttribute("y") === y && /\d+d/.test(m.textContent));
    return { name: n.firstChild.textContent, status: status ? status.textContent.trim() : null };
  });
});
t.check("two jurisdictions sharing a deadline each get their own slack figure",
  sharedPair.length === 2 && sharedPair.every((r) => r.status),
  JSON.stringify(sharedPair));

await page.click("#ganttToggle"); await page.waitForTimeout(700);
const grouped = await chartH();
t.check(`grouping folds it down (${runway} -> ${grouped}px)`,
  grouped < runway, `${runway} -> ${grouped}`);
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
t.check("and it unfolds back", (await chartH()) === runway);


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
    numbered: li.filter((e) => e.querySelector("b")).length,
    optional: li.filter((e) => e.querySelector("em")).length,
    noprint: !![...document.querySelectorAll(".steps")].every((e) => e.classList.contains("noprint")),
    rows: new Set(li.map((e) => Math.round(e.getBoundingClientRect().top))).size,
    dead: li.map((e) => e.querySelector("a").getAttribute("href"))
      .filter((h) => !h || !document.querySelector(h)),
  };
});
// Dan: "the steps numbering does not follow the headings in the body of
// the roi-calculator." It could not: four of the five old steps happened
// inside section 1 and the fifth in section 3, so two numbering systems
// shared one page and agreed nowhere. The digits are gone and the
// headings are now the only numbering — asserted, because re-adding them
// is the obvious "improvement" for someone who has not read this.
t.check(`six steps, none of them numbered (${steps.n})`,
  steps.n === 6 && steps.numbered === 0, `${steps.n} chips / ${steps.numbered} numbered`);
t.check(`they run from footprint to download (${steps.labels.join(" > ")})`,
  ["footprint", "countries", "assumptions", "Calculate", "go-live", "Download"]
    .every((w, i) => (steps.labels[i] || "").includes(w)), steps.labels.join(" | "));
// Dan asked whether go-live could move before Calculate so the flow ended
// on "Calculate and download". It cannot — #adjust lives inside #results,
// which is hidden until Calculate runs — but Download genuinely is the
// last action, and the strip had stopped one step short of saying so.
t.check("Calculate sits before the adjust step, because the panel does not exist until it runs",
  steps.labels.findIndex((l) => l.includes("Calculate"))
    < steps.labels.findIndex((l) => l.includes("go-live")));
t.check("and Download is last",
  steps.labels[steps.labels.length - 1].includes("Download"), steps.labels.join(" | "));
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
// Dan, 15 Aug 2026: the evidence panel should read "Assumptions, sources
// and caveats" and "should not be a separate section". Dropping its "5 ·"
// also settles a rule the page had been applying inconsistently: a
// NUMBERED h2 is a section, an UNNUMBERED <details> is supporting detail
// you open when you want it. The other two panels — assumptions and
// adjust — were already unnumbered; the evidence panel was the only one
// carrying a section number while behaving like a panel.
const numbering = await page.evaluate(() => ({
  sections: [...document.querySelectorAll(".wrap h2")].map((e) => e.textContent.trim()),
  panels: [...document.querySelectorAll("details > summary")]
    .map((e) => e.textContent.replace(/\s+/g, " ").trim()),
}));
t.check(`sections are numbered 1-4 and nothing beyond (${numbering.sections.length})`,
  numbering.sections.every((h, i) => h.startsWith(`${i + 1} `)) && numbering.sections.length === 4,
  numbering.sections.join(" / "));
t.check("and no collapsible panel carries a section number",
  numbering.panels.every((p) => !/^\d+\s*[·&]/.test(p)),
  numbering.panels.filter((p) => /^\d+\s*[·&]/.test(p)).join(" | "));
t.check("the evidence panel keeps its name without a number",
  numbering.panels.some((p) => p.startsWith("Assumptions, sources and caveats")),
  numbering.panels.join(" | "));

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
  // Tooltip bodies live inside the cell and carry percentages of their
  // own -- the reduction citation quotes "60-80%", the capture one "43%".
  // Reading the raw cell text picked those up and multiplied the row out
  // against a number the reader never sees. Strip the tips first.
  const cell = tr.children[1].cloneNode(true);
  cell.querySelectorAll(".tip").forEach((n) => n.remove());
  return { basis: cell.textContent.replace(/\s+/g, " "),
           value: tr.children[2].textContent.trim() };
});
const rate = parseFloat((apRow.basis.match(/invoices\s*\S\s*[^\d]*([\d.]+)/) || [])[1]);
const pcts = [...apRow.basis.matchAll(/(\d+)%/g)].map((m) => Number(m[1]));
// Since 557 the row states three numbers, not two: the manual-invoice
// baseline, the reduction, and the share already arriving structured.
// A reader multiplying them out must land on the printed value, which is
// the whole point of showing the basis at all.
t.check(`the AP basis multiplies out to the AP value (${rate} x ${pcts[0]}% x ${100 - pcts[1]}%)`,
  Math.abs(100000 * rate * (pcts[0] / 100) * (1 - pcts[1] / 100) - money(apRow.value)) <= 1,
  `${100000 * rate * (pcts[0] / 100) * (1 - pcts[1] / 100)} vs ${apRow.value}`);


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
t.check(`the tax row is saved in full (${tax.tag})`,
  tax.tag === "saved" && tax.gross === tax.banks, JSON.stringify(tax));
await openWorkings();
t.check("and states its reason inline, as the direct rows do",
  /falls with the compliance build, not with a workflow change/.test(
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
  const stats = [...document.querySelectorAll("#summary .stat")];
  const stat = (i) => n(stats[i].querySelector(".n").textContent);
  // 584: three labelled figures in the tile, matched by their label
  // rather than their order. See the note on runParts().
  const sub = stats[1].querySelector(".statrun").textContent;
  const grab = (label) => {
    const m = sub.match(new RegExp(label + "\\s*\\(\\D?([\\d,]+)", "i"));
    return m ? Number(m[1].replace(/,/g, "")) : NaN;
  };
  return { banked: n(cells[cells.length - 1].textContent), net: stat(2),
           run: grab("software fees") + grab("internal running cost") };
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
// THE SCOPE NOTE ITSELF IS NOW GONE TOO. Dan, 18 August 2026: "Remove the
// message altogether... We keep adding new messages that clutter the
// screen." Item 13 of the usability assessment, applied by him rather
// than by me.
//
// WHICH MAKES THIS CHECK MORE IMPORTANT, NOT LESS, and it is why it is
// rewritten rather than deleted. The parenthetical was dropped in the
// first place ON THE CONDITION that the note carried the fact. Delete the
// note as well and that trade quietly becomes a subtraction: the reader
// would be left with no statement anywhere that a compliance-only figure
// leaves money on the table.
//
// It survives in two places, both of which existed before the note went
// and neither of which was checked for this. The check now asserts the
// FACT rather than the element that used to carry it -- so the next
// person to tidy one of these away finds out here.
for (const scope of ["compliance", "both"]) {
  await page.selectOption("#scope", scope);
  await page.click("#run"); await page.waitForTimeout(800);
  const labels = await page.evaluate(() => [...document.querySelectorAll("#summary .stat")]
    .map((e) => e.querySelector(".l").textContent.replace(/\s+/g, " ").trim()));
  t.check(`${scope}: no stat carries a scope parenthetical`,
    labels.every((l) => !/\(compliance scope\)/i.test(l)), labels.join(" | "));
}
t.check("the removed scope note left no empty shell behind",
  (await page.locator("#scopeNote").count()) === 0);
// On the wider scope there is nothing left on the table, so neither
// carrier should claim there is -- an "available on a wider scope" line
// under a figure that already includes it would be worse than silence.
await page.selectOption("#scope", "both");
await page.click("#run"); await page.waitForTimeout(800);
const bothCarriers = await page.evaluate(() => ({
  kpi: document.querySelector("#summary .stat .l").innerText,
  pie: (document.querySelector("#savings .svtot") || {}).innerText || "",
}));
t.check("on the wider scope neither carrier offers a wider scope",
  !/wider scope/i.test(bothCarriers.kpi + bothCarriers.pie),
  `${bothCarriers.kpi} / ${bothCarriers.pie}`.replace(/\s+/g, " ").slice(0, 100));
// And on compliance scope BOTH still quantify it. Asserted on both rather
// than on either, because "one of them says it" would pass while the page
// was in the state where only the one nobody scrolls to does.
await page.selectOption("#scope", "compliance");
await page.click("#run"); await page.waitForTimeout(800);
const onlyCarriers = await page.evaluate(() => ({
  kpi: document.querySelector("#summary .stat .l").innerText,
  pie: (document.querySelector("#savings .svtot") || {}).innerText || "",
}));
t.check("the headline label still quantifies what a compliance scope excludes",
  /available on a wider scope/i.test(onlyCarriers.kpi),
  onlyCarriers.kpi.replace(/\s+/g, " "));
t.check("and so does the composition chart's total",
  /available on a wider scope/i.test(onlyCarriers.pie),
  onlyCarriers.pie.replace(/\s+/g, " "));


// ---- 33. the SaaS cost is named, not buried in a sum ----
// Dan: "should the executive summary include - Estimated Annual SaaS
// cost... or is that included already in the cost element?" It was
// included and invisible: $60,000 of platform fees added to $30,000 of
// internal run cost and reported as one "$90,000 annual run cost". Those
// are a vendor subscription and absorbed headcount — the first is the
// number an executive challenges first, and the page showed them a sum.
await page.selectOption("#scope", "compliance");
await page.click("#run"); await page.waitForTimeout(800);
const oneOffStat = await page.locator("#summary .stat").nth(1).innerText();
const parts = await runParts();
t.check("the year one stat names software fees and internal run cost separately",
  parts !== null, oneOffStat.replace(/\s+/g, " ").slice(0, 150));
const [plat, run] = parts;
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
const platAfter = await runParts();
t.check(`platform fees track volume (${plat.toLocaleString()} -> ${platAfter[0].toLocaleString()})`,
  platAfter[0] > plat);
t.check("while internal run cost does not", platAfter[1] === run);
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
// 543 logged these as untranslatable literals; 544 moved them into D1.
t.check(`the row tags come from D1 now, not the template (${tagText.join(", ")})`,
  tagText.length > 0 && tagText.every((x) => /saved/i.test(x)), tagText.join(", "));


// ---- 35. the PDF prints every jurisdiction the reader selected ----
// Dan: "please can you update the pdf output to include all countries
// that are checked." The wave table was built from WAVES, which holds
// only back-planned waves, so a selection with no dated deadline was
// costed into the one-off on page 1 and appeared nowhere on the plan --
// sixteen of thirty-two at the EU preset.
//
// Asserted as a SET COMPARISON rather than a count, because a count can
// be right while the names are wrong, and this is the artefact that
// leaves the building.
await selectEU(); await page.waitForTimeout(400);
await page.click("#run"); await page.waitForTimeout(1400);
const ticked = await page.evaluate(() =>
  [...document.querySelectorAll("#s-countries input[type=checkbox]:checked")]
    .map((e) => (e.closest("label") || e.parentElement).textContent.replace(/\s+/g, " ").trim()));
await page.click("#print"); await page.waitForTimeout(1300);
const pdfNames = await page.evaluate(() => {
  const rows = [...document.querySelectorAll("#pdfdoc table tr")].slice(1);
  const names = [];
  for (const tr of rows) {
    const who = tr.children[1];
    if (!who) continue;
    const txt = who.textContent.trim();
    if (/^[\d.$]/.test(txt)) continue;              // the figures table
    for (const n of txt.split(",")) {
      const c = n.replace(/\+\d+$/, "").trim();
      if (c) names.push(c);
    }
  }
  return names;
});
const pdfNamesSet = new Set(pdfNames);
// The grouped rows truncate past six with "+N", so a truncated row cannot
// name everyone — count the +N back in rather than pretending it does.
const plus = await page.evaluate(() =>
  [...document.querySelectorAll("#pdfdoc table tr")]
    .map((tr) => (tr.children[1] || {}).textContent || "")
    .join(" ").match(/\+(\d+)/g) || []);
const hidden = plus.reduce((a, x) => a + Number(x.slice(1)), 0);
t.check(`the PDF plan accounts for every ticked jurisdiction (${ticked.length} ticked, ${pdfNamesSet.size} named + ${hidden} folded)`,
  pdfNamesSet.size + hidden >= ticked.length,
  `${pdfNamesSet.size} + ${hidden} vs ${ticked.length}`);
t.check("undated jurisdictions get a row rather than being dropped",
  [...pdfNamesSet].some((n) => n === "Austria") || hidden > 0,
  [...pdfNamesSet].slice(0, 8).join(", "));
const undatedRow = await page.evaluate(() =>
  [...document.querySelectorAll("#pdfdoc table tr")]
    .map((tr) => tr.textContent.replace(/\s+/g, " ").trim())
    .find((t) => /Not yet defined/.test(t)) || "");
t.check(`the no-deadline row says so in words (${undatedRow.slice(0, 40)})`,
  /Not yet defined/.test(undatedRow), undatedRow.slice(0, 90));
t.check("and a note explains that their dates are a choice, not an obligation",
  /planning choice, not an obligation/.test(
    await page.evaluate(() => document.getElementById("pdfdoc").innerText)));

// A pinned date is honoured and labelled — the other half of Dan's ask.
await page.evaluate(() => { const d = document.getElementById("adjust"); if (d) d.open = true; });
await page.waitForTimeout(300);
await page.evaluate(() => {
  const el = document.querySelector('[data-ovr-start="Austria"]');
  if (el) { el.value = "2029-03-01"; el.dispatchEvent(new Event("change", { bubbles: true })); }
});
await page.waitForTimeout(1400);
await page.click("#print"); await page.waitForTimeout(1300);
const pinRow = await page.evaluate(() =>
  [...document.querySelectorAll("#pdfdoc table tr")]
    .map((tr) => tr.textContent.replace(/\s+/g, " ").trim())
    .find((t) => /Austria/.test(t)) || "");
t.check(`a pinned start prints as the pinned date (${pinRow.slice(0, 44)})`,
  /2029-03-01/.test(pinRow) && /pinned/i.test(pinRow), pinRow.slice(0, 90));
const pagesNow = await page.evaluate(() =>
  document.querySelectorAll("#pdfdoc .pg").length);
t.check(`and the PDF is still exactly two pages with all of it (${pagesNow})`,
  pagesNow === 2, pagesNow);


// ---- 36. the e-invoice share is a live lever, and guidance points at it ----
// Dan: "Is the Current eInvoice rate, as a percentage - something we could
// assert in the assumptions, with the user having to update." It is now
// the largest single lever on the processing row, because a saving can
// only be taken once: whatever already arrives structured has taken it.
await page.evaluate(() => { document.getElementById("assump").open = true; });
await page.waitForTimeout(200);
const apAt = async (pct) => {
  await page.fill("#eShare", String(pct));
  await page.click("#run"); await page.waitForTimeout(800);
  return Number((await page.locator('#savingsTable tr[data-row="ap"] td').nth(2).innerText())
    .replace(/[^\d]/g, ""));
};
const at0 = await apAt(0), at50 = await apAt(50), at100 = await apAt(100);
t.check(`0% already structured gives the largest saving (${at0.toLocaleString()})`,
  at0 > at50 && at50 > at100, `${at0} / ${at50} / ${at100}`);
t.check("and 100% gives none, because there is nothing left to take",
  at100 === 0, at100);
t.check("the halfway point is half the full saving, so the lever is linear",
  Math.abs(at50 * 2 - at0) <= 2, `${at50} x 2 vs ${at0}`);
await apAt(50);

// ---- 35d. the ribbon legend, and the affordance that is NOT here -------
// Migration 589 removed the Keep control. It came from item 7 of my own
// assessment, Dan had already declined it once in favour of the legend
// alone, and I revived it off a broad "fix the remaining items" without
// checking whether that reversed the specific choice. It did not.
//
// WHAT THE REMOVAL COSTS is worth a check rather than a comment, because
// it is the thing that will look like an oversight later: green means
// CHANGED again, so a reader who reads a grade-A benchmark and agrees
// with it leaves the same amber mark as one who never looked. That was
// the criticism. Two signals from the person who knows this audience beat
// one analysis of mine, and the criticism stays open by decision.
await page.evaluate(() => { document.getElementById("assump").open = true; });
await page.waitForTimeout(200);
t.check("no keep control survives the removal",
  (await page.locator(".keepbtn").count()) === 0);
t.check("and the legend describes the two states that actually exist",
  await page.evaluate(() => {
    const p = [...document.querySelectorAll(".hint")].find((e) => e.querySelector(".lgsw"));
    return !!p && !/keep/i.test(p.innerText);
  }));

// ---- 35d2. four things an independent read found ----------------------
// Screenshots only, no source. Two of its findings were wrong and are
// recorded in migration 586; these four were right and one of them was a
// regression introduced hours earlier by the fix for item 10.
//
// (a) THE ARITHMETIC RECONCILES FROM WHAT IS ON SCREEN. The reviewer took
//     the AP cost visible in the panel and could not reach the AP row.
//     The row is right and the figure that reconciles it -- the manual
//     cost decomposed out of the blend -- had gone behind a disclosure.
await page.click("#run"); await page.waitForTimeout(900);
const apCalc = await page.evaluate(() => {
  const c = document.querySelector('#savingsTable tr[data-row="ap"] .bcalc');
  return c ? c.innerText.replace(/\s+/g, " ") : "";
});
const apShown = Number((await page.locator('#savingsTable tr[data-row="ap"] td').nth(2).innerText())
  .replace(/[^\d]/g, ""));
const apParts = apCalc.match(/([\d,]+)\s*invoices.*?\$?([\d.]+)\s*manual cost.*?(\d+)%.*?(\d+)%/i);
t.check("the AP row can be checked from the figures printed on it",
  !!apParts && Math.abs(Number(apParts[1].replace(/,/g, "")) * Number(apParts[2])
    * (Number(apParts[3]) / 100) * (Number(apParts[4]) / 100) - apShown) <= 2,
  `${apCalc.slice(0, 120)} -> ${apShown}`);
// (b) NO TWO LEGEND ENTRIES SHARE A COLOUR. Migration 576 picked the
//     solid block's fill without checking it against the six phase
//     colours, and landed on mobilise's own.
const legendColours = await page.evaluate(() =>
  [...document.querySelectorAll("#ganttLegend span span")]
    .map((e) => getComputedStyle(e).backgroundColor)
    .filter((c) => c && c !== "rgba(0, 0, 0, 0)"));
t.check(`the chart legend has no duplicate colour (${legendColours.length} swatches)`,
  legendColours.length > 0 && new Set(legendColours).size === legendColours.length,
  JSON.stringify(legendColours));
// (c) A CONTROL THAT CANNOT ACT IS NOT OFFERED.
await page.evaluate(() => { document.getElementById("selNone").click(); });
await page.waitForTimeout(200);
t.check("Clear is not offered when there is nothing to clear",
  await page.evaluate(() => { const b = document.getElementById("selNone"); return !(b.offsetWidth || b.offsetHeight); }));
await page.evaluate(() => { const c = [...document.querySelectorAll(".foot2 input[type=checkbox]")]
  .filter((x) => x.id && x.id !== "subOnly"); c.slice(0, 4).forEach((x) => { x.checked = true; x.dispatchEvent(new Event("change", { bubbles: true })); }); });
await page.waitForTimeout(200);
t.check("and comes back as soon as there is",
  await page.evaluate(() => { const b = document.getElementById("selNone"); return !!(b.offsetWidth || b.offsetHeight); }));
await page.click("#run"); await page.waitForTimeout(900);

// ---- 35d3. the six the reassessment left open (migration 587) ---------
await page.click("#run"); await page.waitForTimeout(900);
// (a) ONE NAME PER NUMBER. The pie and the table described the same three
//     figures with different words. Third instance of this defect in
//     three days, after the grade labels and platform-vs-software-fees.
const naming = await page.evaluate(() => ({
  pie: [...document.querySelectorAll("#savings .svkey li span")].map((e) => e.innerText.trim()),
  rows: [...document.querySelectorAll('#savingsTable tr[data-row] td:first-child')]
    .map((e) => e.childNodes[0].textContent.trim()),
}));
t.check(`the pie names rows the way the table does (${naming.pie.length} slices)`,
  naming.pie.length > 0 && naming.pie.every((n) => naming.rows.includes(n)),
  JSON.stringify(naming.pie) + " vs " + JSON.stringify(naming.rows));
// (b) THE SCOPE COLUMN EXPLAINS ITSELF. It varies 43% / 100% / 0% across
//     rows, and 585 folded the justifications that said why.
t.check("the scope column carries an explanation of its own three states",
  await page.evaluate(() => {
    const th = [...document.querySelectorAll("#savingsTable th")].pop();
    return !!th.querySelector(".hlp");
  }));
// (c) A ONE-DAY GAP DOES NOT GET THE PAGE'S LOUDEST STYLING, and a real
//     one still does. Poland's off-tracker obligation is one day before
//     its planned date; Denmark's has no planned date at all. Both are
//     asserted, because a threshold that silences everything is not a
//     threshold, it is a deletion.
const guardFor = async (name) => {
  await page.evaluate((w) => {
    document.querySelectorAll("#countryList input[type=checkbox]").forEach((bx) => {
      const lab = bx.closest("label") || bx.parentElement;
      bx.checked = (lab.textContent || "").trim().startsWith(w);
    });
    document.getElementById("countryList").dispatchEvent(new Event("change", { bubbles: true }));
  }, name);
  await page.click("#run"); await page.waitForTimeout(900);
  return page.evaluate(() => (document.getElementById("guards") || {}).innerText || "");
};
t.check("a one-day mistiming no longer raises an alarm",
  !/obligation earlier than the date this plan plans for/i.test(await guardFor("Poland")));
t.check("but an obligation the plan does not schedule at all still does",
  /obligation earlier than the date this plan plans for/i.test(await guardFor("Denmark")));
// (d) NO WORD OF OURS THAT IS NOT ALSO THE READER'S.
t.check("no guard calls the tracker by our internal name for it",
  !/arrivals board/i.test(await page.locator("#results").innerText()));

// ---- 35e. the nearest binding date leads its tile ---------------------
// Item 9's last part. It was the fifth sentence of the footprint
// paragraph while the tile beside it spent a KPI slot on the count -- the
// less useful half of the same fact, since a reader plans against the
// first date rather than against how many there are.
await page.click("#run"); await page.waitForTimeout(900);
const dateTile = await page.evaluate(() => {
  const st = [...document.querySelectorAll("#summary .stat")].pop();
  return { n: st.querySelector(".n").innerText.trim(), l: st.querySelector(".l").innerText.replace(/\s+/g, " ") };
});
t.check(`the last tile leads with a date (${dateTile.n})`,
  /^\d{4}-\d{2}-\d{2}$/.test(dateTile.n) || /^None$/i.test(dateTile.n), JSON.stringify(dateTile));
t.check("and keeps the count as its sub-line",
  /dated deadline ahead/i.test(dateTile.l), dateTile.l.slice(0, 120));
// AND THE COUNT USES THE SAME DENOMINATOR AS THE CARD BELOW IT. The first
// version of this tile said "of your SELECTED jurisdictions" while
// counting TRACKS, which include the injected EU-wide row nobody ticked
// -- so it counted twelve things and named eleven, in the summary whose
// other half exists to keep those two numbers apart.
const cardCounts = (await page.locator("#summary .card p").first().innerText())
  .replace(/\s+/g, " ");
const planCount = Number((cardCounts.match(/plan covers (\d+)/) || [])[1]);
const tileDenom = Number((dateTile.l.match(/of the (\d+)/) || [])[1]);
t.check(`the tile counts out of the plan, not out of the selection (${tileDenom} vs ${planCount})`,
  Number.isFinite(planCount) && tileDenom === planCount,
  `${dateTile.l.slice(0, 90)} | ${cardCounts.slice(0, 90)}`);
// ONE FACT, ONE HOME. Moving it and leaving the original is how a page
// ends up with two statements that can disagree -- the shape 580 found in
// the grade tags and 582 found in the scorecard.
t.check("and the footprint paragraph no longer says it too",
  !/nearest binding date/i.test(await page.locator("#summary .card p").first().innerText()),
  (await page.locator("#summary .card p").first().innerText()).slice(-140));

// ---- 35f. the last three (migration 588) ------------------------------
// (a) NOTHING ON THE PHONE CITES A FIGURE THAT APPEARS BELOW IT. Since 584
//     the net tile ends by naming software fees, internal running cost and
//     a year-one net -- all printed in the cost tile that 577's reordering
//     had pushed underneath it.
{
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  t.watch(m);
  await m.goto(`file://${file}`); await m.waitForTimeout(700);
  await m.evaluate(() => { const c = [...document.querySelectorAll(".foot2 input[type=checkbox]")]
    .filter((x) => x.id && x.id !== "subOnly"); c.slice(0, 4).forEach((x) => { x.checked = true; x.dispatchEvent(new Event("change", { bubbles: true })); }); });
  await m.click("#run"); await m.waitForTimeout(1200);
  const order = await m.evaluate(() => [...document.querySelectorAll("#summary .stat")]
    .map((e) => ({ y: Math.round(e.getBoundingClientRect().top + window.scrollY),
                   t: e.querySelector(".n").innerText.trim() })));
  const yOf = (txt) => (order.find((o) => o.t.includes(txt)) || {}).y;
  const cost = order[1], net = order[2];
  t.check("390px: the cost tile comes before the tile that cites it",
    cost.y < net.y, JSON.stringify(order.map((o) => o.t + "@" + o.y)));
  // And they read in document order, which is the dependency order:
  // gross, then what it costs, then what is left.
  t.check("390px: and the money tiles read in document order",
    order[0].y <= order[1].y && order[1].y <= order[2].y,
    JSON.stringify(order.map((o) => o.y)));
  await m.close();
}
// (b) THE PHASE BREAKDOWN IS READABLE WITHOUT A MOUSE. Every per-country
//     phase has scope 'all', so the breakdown is identical on every row --
//     one sentence was hiding behind twelve tooltips.
const legendTxt = await page.locator("#ganttLegend").innerText();
t.check("the phase breakdown is in the legend, not only in a tooltip",
  /\d+w/.test(legendTxt) && /same shape on every country/i.test(legendTxt),
  legendTxt.replace(/\s+/g, " ").slice(0, 160));
t.check("and no legend entry tells a reader to hover",
  !/hover/i.test(legendTxt), legendTxt.replace(/\s+/g, " ").slice(0, 160));
// The weeks are read from the durations the reader controls, so the line
// moves with them. A hardcoded sentence here would be the
// literal-beside-the-truth defect this project keeps finding.
await page.evaluate(() => { document.getElementById("assump").open = true; });
await page.fill("#wBld", "9");
await page.click("#run"); await page.waitForTimeout(900);
t.check("and it follows the durations rather than restating them",
  /9w/.test(await page.locator("#ganttLegend").innerText()),
  (await page.locator("#ganttLegend").innerText()).replace(/\s+/g, " ").slice(0, 160));
await page.fill("#wBld", "3");
await page.click("#run"); await page.waitForTimeout(900);
// ---- 36a. the evidence scorecard says what the page can prove ---------
// Item 12 of the usability assessment: "Nothing summarises the evidence,
// which is the product." The counts are derived from which benchmarks
// val() is actually asked for, so this checks the RENDERED numbers against
// the database rather than against a literal in the test -- a literal here
// would pass just as happily if the renderer stopped counting.
await page.click("#run"); await page.waitForTimeout(900);
// IT LIVES INSIDE THE COLLAPSED CAVEATS PANEL. Dan, 18 August 2026:
// "Remove 'The reasoning' part of the 'Assumptions, sources and caveats',
// and replace it with the 'How much of this is evidenced' bar... This is
// hidden until expanded by a user who would like to understand how the
// results are evidenced."
//
// So the panel has to be OPENED before any of this is measurable, and
// that is the point of the first check rather than a setup step: a
// scorecard nobody can reach is the same as no scorecard, and every check
// below would pass just as happily against an empty selector -- the shape
// that made waveText() a no-check in migration 576.
await page.evaluate(() => { document.getElementById("notes").open = true; });
await page.waitForTimeout(400);
const card = await page.evaluate(() => {
  const host = document.getElementById("evidence");
  if (!host) return { segs: [], keys: [], text: "", visible: false };
  const bar = host.querySelector(".scorebar");
  const segs = [...host.querySelectorAll(".scoreseg")]
    .map((e) => ({ g: (e.className.match(/sg([ABCD])/) || [])[1], n: Number(e.textContent) }));
  const keys = [...host.querySelectorAll(".scorekey .tag")]
    .map((e) => (e.className.match(/\bt([ABCD])\b/) || [])[1]);
  return { segs, keys, visible: !!bar && bar.getBoundingClientRect().width > 0,
           text: [...host.querySelectorAll("p")].map((e) => e.innerText).join(" ") };
});
t.check("the scorecard renders, and only once the panel is open",
  card.visible && card.segs.length > 0 && card.keys.length === 4,
  `visible ${card.visible}, ${card.segs.length} segments, ${card.keys.length} key entries`);
// It heads the panel: the bar says HOW MANY sit at each grade, the four
// cards below say WHICH sources those are. Order asserted rather than
// assumed, because the duplication Dan rejected was exactly these two
// things saying the same thing in two places.
const scoreOrder = await page.evaluate(() => {
  const host = document.getElementById("evidence");
  const bar = host.querySelector(".scorebar");
  const gradeCard = host.querySelector(".card.tierA");
  const top = (e) => (e ? e.getBoundingClientRect().top + window.scrollY : NaN);
  return { bar: top(bar), gradeCard: top(gradeCard) };
});
t.check("and it heads the panel, above the four grade cards",
  scoreOrder.bar < scoreOrder.gradeCard, JSON.stringify(scoreOrder));
// "The reasoning" block it replaced is gone rather than pushed below.
t.check("the reasoning block it replaced is not still there",
  !/The reasoning/i.test(await page.locator("#evidence").innerText()));
const segTotal = card.segs.reduce((a, s) => a + s.n, 0);
t.check(`the scorecard totals the benchmarks it scores (${segTotal})`,
  segTotal > 0 && new RegExp(`Of the ${segTotal} benchmarks`).test(card.text),
  `${segTotal} vs ${(card.text.match(/Of the \d+ benchmarks/) || [])[0]}`);
// The bar and the sentence are two renderings of one object. Migration 580
// found a grade tag disagreeing with the database it was drawn from; this
// is the same failure one level up, and the only check that would see it.
const segA = (card.segs.find((s) => s.g === "A") || {}).n;
const textA = Number((card.text.match(/(\d+) are measured primary/) || [])[1]);
t.check("and the bar agrees with the sentence on how many are grade A",
  segA !== undefined && segA === textA, `bar ${segA} / sentence ${textA}`);
// A grade with no rows must not draw a segment nobody can read, and must
// still appear in the key -- "nothing here rests on grade C" is worth
// saying. Migration 576 made the same call about chart phases below 44px.
t.check("a zero-count grade is absent from the bar and present in the key",
  !card.segs.some((s) => s.n === 0) && keysHasAll(card.keys),
  `bar ${card.segs.map((s) => s.g + s.n).join(",")} / key ${card.keys.join(",")}`);
function keysHasAll(k){ return ["A","B","C","D"].every((g) => k.includes(g)); }
// NO "WHY" LINK INSIDE THE PANEL THAT EVERY "WHY" OPENS. Dan, 18 August
// 2026: "Why is a circular reference of its own section. Please remove
// the why link." Correct until 582 moved the block, a loop the moment it
// landed -- and invisible to every suite, because a link that goes
// nowhere useful still renders, still resolves and still passes.
t.check("the scorecard carries no why-link back to its own panel",
  (await page.locator("#evidence a.nlink").count()) === 0,
  await page.locator("#evidence").innerText().then((x) => x.slice(-120)));
// AND IT DIRECTS BY NAME, NOT BY POSITION. "Marked below" was true where
// the block used to sit and false the moment it moved; "section 3" was
// wrong before that, because phase durations are edited in the
// assumptions panel in section 1, not in the adjust panel. Both read
// perfectly while being wrong, which is why Dan found them and no check
// did. Asserted on the direction words rather than on the sentences.
const scoreText = await page.locator("#evidence").innerText();
t.check("and points at section 1, where the fields it names actually are",
  /section 1/i.test(scoreText) && !/\bbelow\b|\bsection 3\b/i.test(scoreText),
  scoreText.slice(0, 400).replace(/\s+/g, " "));

// The sharpest finding of the independent review, promoted from a caption
// under the chart to a line of the summary.
t.check("the scorecard states that the wave plan rests on a grade D",
  /every date in the wave plan rests on a grade D/i.test(card.text), card.text.slice(0, 90));
// And item 13: the scorecard must REPLACE a caveat, not join them. The
// placeholder guard said the same count in the warnings panel.
const warnText = await page.evaluate(() =>
  (document.getElementById("guards") || {}).innerText || "");
t.check("and the placeholder count is not also in the guards",
  !/still hold our numbers rather than yours/i.test(warnText), warnText.slice(0, 90));

// ---- 36b. and the SENDING side is a live lever too (migration 580) ----
// Dan: "I'm not sure it makes sense for us to claim 100% of the AR invoice
// cost as savings." Until 580 this lever did not exist and the AR row took
// the lot. Exercised at three points rather than read once, because the
// defect this file keeps finding is a check whose logic is right and whose
// itinerary is short -- a check that only ever reads the default would
// have passed against the old code, where the input was not wired to
// anything at all.
const arAt = async (pct) => {
  await page.fill("#arShare", String(pct));
  await page.click("#run"); await page.waitForTimeout(800);
  return Number((await page.locator('#savingsTable tr[data-row="ar"] td').nth(2).innerText())
    .replace(/[^\d]/g, ""));
};
const ar0 = await arAt(0), ar64 = await arAt(64), ar100 = await arAt(100);
t.check(`0% already issued structured gives the whole AR saving (${ar0.toLocaleString()})`,
  ar0 === 195000, ar0);
t.check(`the 64% default takes 64% of it off (${ar64.toLocaleString()})`,
  ar64 === 70200, `${ar64} vs 70200`);
t.check("and 100% leaves nothing, because the mandate would change no channel",
  ar100 === 0, ar100);
// The two shares are INDEPENDENT facts about a business -- migration 557
// declined to reuse eShare here for exactly this reason. If one input were
// ever wired to both rows this would catch it, and nothing else would:
// both rows would still move, both would still look plausible, and the
// page would be asserting that issuing and receiving adoption are the same
// number.
await arAt(0);
const apWhileArZero = Number((await page.locator('#savingsTable tr[data-row="ap"] td').nth(2)
  .innerText()).replace(/[^\d]/g, ""));
t.check("moving the issuing share leaves the receiving row alone",
  apWhileArZero === 426900, apWhileArZero);
await arAt(64);

// ---- 36c. no input overstates its own evidence grade (migration 580) ----
// "AR cost per invoice" rendered a green A for as long as the ribbons have
// existed, while D1 has held ar_cost_per_invoice at B since migration 505
// -- and migration 527's citation, which this page displays three fields
// away, grades both FTE rates B on the strength of it.
//
// Ten suites checked that a grade tag RENDERS. None had reason to ask
// whether it rendered the RIGHT LETTER, which is why one field spent
// twenty-three migrations claiming better evidence than the database
// behind it. The grades are derived from D1 now; this asserts the letters
// a reader actually sees, so a future hardcoded tag cannot creep back.
const grades = await page.evaluate(() => {
  const out = {};
  document.querySelectorAll("label[for]").forEach((l) => {
    const tag = l.querySelector("span.tag[class*='t']");
    const m = tag && tag.className.match(/\bt([ABCD])\b/);
    if (m) out[l.getAttribute("for")] = m[1];
  });
  return out;
});
const EXPECTED_GRADES = {
  costNow: "A", costAR: "B", savePct: "B", errRate: "B", fteCost: "B",
  fteEntry: "B", errElim: "D", eShare: "B", arShare: "B",
};
const wrongGrade = Object.entries(EXPECTED_GRADES)
  .filter(([id, g]) => grades[id] !== g)
  .map(([id, g]) => `${id}: want ${g}, got ${grades[id]}`);
t.check(`every input grade matches D1 (${Object.keys(EXPECTED_GRADES).length} fields)`,
  wrongGrade.length === 0, wrongGrade.join("; "));
t.check("and AR cost per invoice is B, which is what the database has always said",
  grades.costAR === "B", grades.costAR);

// Dan, same message: "ensure that the user is guided to those fields that
// we need them to update to make the business case real." Six fields are
// ours rather than theirs, and the line counts down as they are set --
// a static warning becomes furniture, a shrinking one is progress.
// Counted across the PAGE, not inside #assump. Scoping this to the panel
// was the same assumption as the word "below" in the counter it checks:
// true while all six lived there, false the moment migration 559 moved
// two into section 1. It is also the check that caught the real bug in
// that migration — two fields outside the panel stopped firing the
// delegated input listener bound to it, so their marks never retired.
const needs = await page.evaluate(() => ({
  marked: document.querySelectorAll(".needsyou").length,
  note: (document.getElementById("needsYou") || {}).innerText || "",
  warn: (document.getElementById("needsYou") || {}).className || "",
}));
// Every input on the page now carries a ribbon. Dan, 16 Aug 2026:
// "change all input fields in assumptions and benchmarks to have a
// yellow unchanged ribbon... a useful distinction on all fields to see
// if anything has changed." The class renamed with the meaning —
// `.needsyou` was false the moment a grade-A benchmark carried it.
//
// Counted per region rather than as a total, because a total would pass
// if every ribbon were in one place. Asserted against the input count
// rather than a literal, so adding a field cannot silently skip its mark.
const marked = await page.evaluate(() => {
  const q = (sel) => document.querySelectorAll(sel).length;
  return {
    // input[type=number] and select only: .foot2 also contains the 70
    // country checkboxes, which are a selection rather than a value and
    // carry no ribbon.
    foot: q(".foot2 .ribbon"),
    footInputs: q('.foot2 input[type=number], .foot2 select'),
    panel: q("#assump .ribbon"), panelInputs: q("#assump input, #assump select"),
  };
});
// 6 -> 7 with the AR structured-issuing share added by migration 580.
// The literal is the half of this check that has to be edited on purpose;
// foot === footInputs is the half that catches a field shipped without a
// ribbon, and it passed through this change unaided.
t.check(`every footprint field is marked (${marked.foot}/${marked.footInputs})`,
  marked.foot === marked.footInputs && marked.foot === 7, JSON.stringify(marked));
t.check(`and every assumptions field too (${marked.panel}/${marked.panelInputs})`,
  marked.panel === marked.panelInputs && marked.panel === 20, JSON.stringify(marked));
// Migration 562 removed the counting sentence at Dan's request. The
// ribbons carry the whole message now, which is why the colour checks
// below matter more than they did: there is no prose to fall back on.
t.check("the counting sentence is gone, not merely emptied",
  await page.evaluate(() => !document.getElementById("needsYou")));
// "They are highlighted" has to be true, and the first cut of this change
// shipped that sentence with no CSS behind it at all — the note counted
// six fields and pointed at nothing. Assert the mark is really painted,
// and that it is NOT the amber markOverridden() already uses for "you set
// this", because one colour cannot mean a claim and its negation.
const mark = await page.evaluate(() => {
  const s = getComputedStyle(document.getElementById("cPlat"));
  // costNow, not volAP: every field in section 1 carries a ribbon now, so
  // volAP stopped being a valid "unmarked" control on 16 Aug. A benchmark
  // in the panel is the real negative case.
  // Nothing carries "no ribbon" any more, so the negative case is the
  // GREEN state rather than an unmarked field.
  const plain = { boxShadow: "none" };
  return { on: s.boxShadow, off: plain.boxShadow, border: s.borderColor };
});
t.check(`an untouched field is visibly marked (${mark.on.slice(0, 40)})`,
  mark.on !== mark.off && /inset/.test(mark.on), `${mark.on} vs ${mark.off}`);
// 557 used red here, reasoning that amber was taken by markOverridden().
// Dan asked for amber, and it resolves because the two states are
// mutually exclusive: an amber RIBBON means untouched, so the field
// cannot also carry the amber BORDER that means you set it. That
// exclusivity is the thing worth asserting — if it ever breaks, one
// colour is claiming a thing and its opposite on one control.
t.check("a still-ours field is amber-ribboned and has no amber border",
  /201,\s*138,\s*58/.test(mark.on) && !/201,\s*138,\s*58/.test(mark.border),
  `${mark.on} :: ${mark.border}`);
// Fill every one of them and the warning should turn into an all-clear.
await page.evaluate(() => {
  for (const id of ["cImplS", "cImplC", "cPlat", "cRun", "errMins", "eShare"]) {
    const el = document.getElementById(id);
    el.value = String(Number(el.value) + 1);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
});
await page.click("#run"); await page.waitForTimeout(800);
// With the sentence gone, the ribbons ARE the message — so the check
// that used to read the note now reads the colour that replaced it.
const allGreen = await page.evaluate(() => {
  const ids = ["cImplS", "cImplC", "cPlat", "cRun", "errMins", "eShare"];
  return ids.map((id) => getComputedStyle(document.getElementById(id)).boxShadow)
    .every((sh) => /63,\s*125,\s*92/.test(sh));
});
t.check("setting all six turns every ribbon green", allGreen);
// Each field's own mark retires too, not just the aggregate count — a
// reader four of six through needs to see WHICH two are left without
// re-reading twenty fields.
// Six, counted among the six that were filled — not a page-wide total.
// The total is 8 here because the volume fields were touched earlier in
// this suite, and a page-wide count would have quietly passed on the
// wrong six.
const cleared = await page.evaluate(() => {
  const ids = ["cImplS", "cImplC", "cPlat", "cRun", "errMins", "eShare"];
  return ids.filter((id) => document.getElementById(id).parentElement
    .classList.contains("changed")).length;
});
t.check(`and every field's own mark retires with it (${cleared} of 6)`,
  cleared === 6, cleared);

// ---- 38. what you ticked is not what the plan schedules ----
// Dan, 16 Aug 2026: selecting Germany alone showed "2 countries with a
// dated deadline ahead". The COUNT was right -- Germany carries its own
// 2027 mandate and ViDA in 2030, and the planner schedules both -- but
// the footprint card read "Across 1 jurisdictions you have 1 complex and
// 1 simple regime", which is one not equalling one plus one.
//
// The card counted the ticked set and the mix counted the scheduled set.
// This check is the reconciliation, on the smallest selection that can
// expose it: a single EU member state.
await page.evaluate(() => {
  document.getElementById("useSubs").checked = false;
  document.querySelectorAll("#countryList input[type=checkbox][data-i]")
    .forEach((bx) => { bx.checked = COUNTRIES[+bx.dataset.i][0] === "Germany"; });
});
await page.click("#run"); await page.waitForTimeout(900);
const solo = await page.evaluate(() => ({
  ticked: document.querySelectorAll("#countryList input:checked").length,
  card: document.querySelector("#summary .card").innerText.replace(/\s+/g, " "),
  stat: [...document.querySelectorAll("#summary .stat")].pop().innerText.replace(/\s+/g, " "),
}));
t.check(`one tick, and the card counts what is scheduled (${solo.ticked} ticked)`,
  solo.ticked === 1 && /plan covers 2\b/.test(solo.card), solo.card.slice(0, 120));
// AND IT SHOWS ITS WORKING. The whole reason 587 rewrote this sentence is
// that a reader who ticked one country met the number 2 with nothing
// linking the two. Both counts, in one sentence, or it is back where it
// started.
t.check("and reconciles it against what the reader actually ticked",
  /You selected 1 jurisdiction\b/.test(solo.card), solo.card.slice(0, 120));
const mix = solo.card.match(/(\d+) complex[\s\S]*?(\d+) simple/);
t.check(`and the mix reconciles to that count (${mix ? mix[1] + "+" + mix[2] : "?"})`,
  !!mix && Number(mix[1]) + Number(mix[2]) === 2, solo.card.slice(0, 160));
t.check("the injected EU row is named, not left to be inferred",
  /EU-wide obligation/.test(solo.card), solo.card.slice(0, 200));
t.check("and the stat is not labelled with a noun that is false of it",
  !/countr/i.test(solo.stat) && /2/.test(solo.stat), solo.stat);

// ---- 38b. and the wave table explains the right row ----
//
// 568 fixed the card and stopped there. Underneath it the wave table was
// exactly inverted: Germany's own 2027 national deadline carried the EU
// badge and the ViDA explanation, and the European Union row -- the one
// track that IS the EU-wide obligation -- carried neither.
//
// Index 8 was repurposed from "deadline derived from EU law" to plain
// membership when the EU became a row. Two consumers were updated and
// four were not, so the flag meaning "is an EU member" was read as "is
// the EU obligation" on every member state, and never on the EU.
//
// Checked by ROW, not by page text: the words "EU-wide obligation" appear
// somewhere on the page in both the right and the wrong arrangement, and
// a substring check would have passed against the inverted version. What
// distinguishes them is WHICH row carries them.
const waveRows = await page.evaluate(() =>
  [...document.querySelectorAll("#waves tbody tr")].map((tr) => ({
    jur: tr.children[1].innerText.trim(),
    badged: /\bEU\b/.test(tr.children[0].innerText),
    why: tr.children[5].innerText.replace(/\s+/g, " ").slice(0, 60),
  })));
const euRow = waveRows.find((r) => /European Union/.test(r.jur));
const natRow = waveRows.find((r) => !/European Union/.test(r.jur));
t.check("the EU row is the one badged EU and explained as EU-wide",
  !!euRow && euRow.badged && /EU-wide obligation/.test(euRow.why),
  euRow && `${euRow.jur} badged=${euRow.badged} ${euRow.why}`);
t.check("and the member state's own national deadline is not",
  !!natRow && !natRow.badged && !/EU-wide obligation/.test(natRow.why),
  natRow && `${natRow.jur} badged=${natRow.badged} ${natRow.why}`);
t.check("the ViDA sentence does not say 'this member state' on the EU row",
  !!euRow && !/this member state/.test(euRow.why), euRow && euRow.why);

// The introduction described the same wrong set: it counted ticked member
// states and printed the total under "are here on an EU-wide obligation",
// so one ticked country produced "1 are here on an EU-wide obligation".
const intro = (await page.locator("#waveIntro").innerText()).replace(/\s+/g, " ");
t.check("the wave introduction states one EU row rather than counting countries",
  /One of these waves is the EU-wide obligation/.test(intro)
  && !/\b1 are\b/.test(intro), intro.slice(-130));

// ---- 37. the compliance-only share shows its working ----
// Migration 561. The page credited compliance with 43% of the AP
// reduction and said nowhere what 43% was — the least explained number
// on a page whose whole proposition is that its numbers are explained.
// The derivation belongs on the row, and only on the scope where it
// applies: on the wider scope the full saving is banked and a sentence
// about crediting a share would be false.
await page.selectOption("#scope", "compliance");
await page.click("#run"); await page.waitForTimeout(900);
await openWorkings();
const apCompliance = await page.locator('#savingsTable tr[data-row="ap"]').innerText();
t.check("compliance scope states where the 43% comes from",
  /9 of the 21 minutes of AP handling/.test(apCompliance), apCompliance.slice(0, 240));
t.check("and says what is deliberately not counted",
  /review and approval are business decisions/i.test(apCompliance), apCompliance.slice(0, 240));
await page.selectOption("#scope", "both");
await page.click("#run"); await page.waitForTimeout(900);
const apBoth = await page.locator('#savingsTable tr[data-row="ap"]').innerText();
t.check("the wider scope does not claim a share it is not taking",
  !/9 of the 21 minutes/.test(apBoth), apBoth.slice(0, 200));
await page.selectOption("#scope", "compliance");
await page.click("#run"); await page.waitForTimeout(900);

// THE BRACKET CARD IS GONE, and this is the loss worth being loudest
// about. It carried three readings of how conservative the compliance-only
// figure is -- 25.7% by the route used here, 42.9% if capture is credited
// with its full share of handling time, 70.3% on the ATO's paper-to-
// eInvoice gap -- and said the lowest is used.
//
// It was an ARGUMENT FOR THE PAGE'S NUMBERS, not a caveat: it says a
// compliance-only case that looks marginal here may be understated by up
// to threefold. Nothing else on the page says it, and it went out with
// "The reasoning" block Dan asked to remove.
//
// Retired in place rather than deleted so that this is recoverable in one
// edit if he wants it back, and so the next person to read this file
// learns the figures existed. See migration 582.
//
//   was: for (const fig of ["25.7", "42.9", "70.3"])
//          t.check(`the bracket names the ${fig}% reading`, ...)
//        t.check("and says which end was taken", /lowest is used/i...)
await page.evaluate(() => { document.getElementById("notes").open = true; });
await page.waitForTimeout(250);

// ---- 38c. the four things a usability read found ---------------------
//
// None of these was caught by any of the ten suites. Three were found by
// rendering the page and looking at it, which is worth stating in the
// file that exists to stop them coming back.

// (a) RESULTS GO STALE, AND SAY SO. Silent staleness is the worst thing
//     this page can produce: a screenshot of figures that no longer
//     describe the inputs above them.
await page.evaluate(() => {
  document.getElementById("useSubs").checked = false;
  document.querySelectorAll("#countryList input[type=checkbox][data-i]")
    .forEach((bx) => { bx.checked = COUNTRIES[+bx.dataset.i][1] === "DE"; });
});
await page.click("#run"); await page.waitForTimeout(800);
const freshAfterRun = await page.evaluate(() =>
  document.getElementById("stale").classList.contains("hidden"));
t.check("results are not marked stale immediately after Calculate", freshAfterRun);
await page.fill("#volAP", "654321"); await page.waitForTimeout(300);
const staleState = await page.evaluate(() => ({
  shown: !document.getElementById("stale").classList.contains("hidden"),
  btn: document.getElementById("run").textContent.trim() }));
t.check("editing an input after a run marks the results stale",
  staleState.shown, JSON.stringify(staleState));
t.check("and the button asks to be pressed again",
  /recalc/i.test(staleState.btn), staleState.btn);
// The country list is not one of the ribboned inputs, and it drives more
// of the model than any single field does.
await page.click("#run"); await page.waitForTimeout(700);
await page.evaluate(() => {
  const bx = [...document.querySelectorAll("#countryList input[data-i]")].find((b) => !b.checked);
  bx.click();
});
await page.waitForTimeout(300);
t.check("changing the country selection marks them stale too",
  await page.evaluate(() => !document.getElementById("stale").classList.contains("hidden")));

// (b) AN EMPTY SELECTION IS NOT A BUSINESS CASE. The payback guard used
//     to exclude a payback of exactly zero, which is what a zero one-off
//     produces -- so the most implausible output the model can make was
//     the one case the implausibility guard skipped.
await page.click("#selNone"); await page.waitForTimeout(200);
await page.click("#run"); await page.waitForTimeout(900);
const empty = await guardText();
t.check("an empty selection is called out", /No jurisdictions are selected/.test(empty),
  empty.slice(0, 120));
t.check("and a zero-cost instant payback trips the plausibility guard",
  /Payback under one month/.test(empty), empty.slice(0, 200));

// (c) THE HINT DOES NOT CLAIM OUR NUMBER IS THEIRS. It read "Your own
//     figure" on load, on an untouched field holding our default, four
//     pixels from a tooltip correctly saying "Our default is 50."
await page.reload(); await page.waitForTimeout(500);
const hintOnLoad = await page.evaluate(() => ({
  hint: document.getElementById("h-eShare").textContent.trim(),
  tip: (document.querySelector('[data-tm="eShare"]') || {}).textContent }));
t.check("the untouched hint does not claim the reader's ownership",
  !/^Your/i.test(hintOnLoad.hint), JSON.stringify(hintOnLoad));
await page.fill("#eShare", "72"); await page.waitForTimeout(300);
const hintAfter = await page.evaluate(() => document.getElementById("h-eShare").textContent.trim());
t.check("and does not gain a second copy of the tooltip's state",
  hintAfter === hintOnLoad.hint && !/Your value/.test(hintAfter), hintAfter);

// (d) NO NAME COLLIDES WITH ITS META LABEL IN THE CHART GUTTER.
//     "European Union" overlapped by 25px and "United Kingdom" cleared by
//     7. Two SVG text nodes overlapping do not error and do not fail any
//     assertion, so this is measured rather than assumed.
//
//     The reload above resets the page, and since migration 579 that
//     means NOTHING IS SELECTED -- so a bare Calculate draws no chart and
//     this measured nothing. It has to choose a footprint first, which is
//     now true of every check that wants a plan.
await selectEU(); await page.waitForTimeout(200);
await page.click("#run"); await page.waitForTimeout(800);
await expandGantt();
const gutter = await page.evaluate(() => {
  const svg = document.querySelector("#gantt svg");
  const names = [...svg.querySelectorAll('text[font-size="12"]')];
  const metas = [...svg.querySelectorAll('text[text-anchor="end"]')];
  return names.map((n) => {
    const m = metas.find((x) => x.getAttribute("y") === n.getAttribute("y"));
    if (!m) return null;
    return { name: n.textContent, gap: Math.round(m.getBoundingClientRect().left - n.getBoundingClientRect().right) };
  }).filter(Boolean);
});
const collided = gutter.filter((r) => r.gap < 0);
t.check(`no chart row name overlaps its meta label (${gutter.length} rows checked)`,
  gutter.length > 3 && collided.length === 0,
  collided.map((r) => `${r.name} by ${-r.gap}px`).join(", "));
// And the fix must not have been "truncate until it fits" -- the names
// the tool shows most often have to survive intact.
const truncated = gutter.filter((r) => /\u2026/.test(r.name));
t.check("and the common names are not truncated to make that true",
  truncated.length === 0, truncated.map((r) => r.name).join(", "));

// ---- 39. the page renders in a language that is not English ----------
//
// Every check above this one runs in English, and so did all nine suites
// until 17 August 2026 -- build-page.mjs has accepted opts.lang since it
// was written and nothing ever passed it. The consequence was not a weak
// test but an absent one: the page could not have survived its first
// French string and every suite was green.
//
// German and French are chosen because they are the two already carrying
// full country_translations coverage, and because they differ from
// English in the two ways that matter here: number formatting, and names.
// The roi namespace itself is still English-only, so the STRINGS on these
// pages are English by design -- what is under test is everything around
// them.
// The roi namespace is English-only, so the noun itself renders in
// English in every language -- what is being checked is which FORM the
// category selector picks, not what it says.
const PLURAL_SINGULAR = "jurisdiction";
for (const [lang, sep] of [["de", "."], ["fr", "\u202f"]]) {
  const { file: f } = await buildRoiPage({ lang });
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  t.watch(p2);
  await p2.goto(`file://${f}`);

  // Country names come from country_translations, which the picker, the
  // story list and the archive have all joined for months. The planner
  // was the one surface that did not.
  const names = await p2.evaluate(() =>
    COUNTRIES.filter((c) => ["DE", "NL"].includes(c[1])).map((c) => c[0]).sort());
  const expected = lang === "de" ? ["Deutschland", "Niederlande"] : ["Allemagne", "Pays-Bas"];
  t.check(`${lang}: country names are translated`,
    names.join(",") === expected.join(","), names.join(","));

  // Sorted on the TRANSLATED name. A French list ordered on English names
  // puts Allemagne between Georgia and Ghana.
  const sorted = await p2.evaluate(() => {
    const n = COUNTRIES.filter((c) => c[1] !== "EU").map((c) => c[0]);
    return n.every((v, i) => i === 0 || n[i - 1].localeCompare(v, undefined, { sensitivity: "base" }) <= 0);
  });
  t.check(`${lang}: and the list is sorted in that language`, sorted);

  // THE ONE THAT NEARLY SHIPPED BROKEN. Preferences are stored in
  // English; the box matched on the displayed name. Translating the label
  // alone would have selected nothing here -- silently, because selecting
  // nothing is a legal state.
  await p2.check("#useSubs"); await p2.waitForTimeout(200);
  const subsN = await p2.locator("#countryList input:checked").count();
  t.check(`${lang}: the subscribed-countries box still matches (${subsN})`, subsN === 11, subsN);

  // Money in the reader's locale: separator and symbol placement are one
  // decision per locale, not three, so Intl makes them together.
  await p2.click("#run"); await p2.waitForTimeout(700);
  const fig = (await p2.locator("#summary .stat .n").first().textContent()).trim();
  t.check(`${lang}: money uses the local thousands separator (${fig})`,
    fig.includes(sep), fig);
  t.check(`${lang}: and does not prefix the symbol the way en-US does`,
    !/^[$£€]/.test(fig), fig);

  // Plurals pick a CLDR CATEGORY, not `n === 1`. The page shipped a
  // two-form ternary under a comment saying languages with more forms
  // "need more rows, not different code" -- the rows were never added
  // and neither was the code.
  //
  // FRENCH TREATS ZERO AS SINGULAR. That is the check that would have
  // failed before migration 573 and passes now, and it needs no French
  // rows to be meaningful: the category machinery is what is under test,
  // and French is a language this site already sells.
  const plurals = await p2.evaluate(() => ({
    zero: plur(0, PLURALS.jur),
    one: plur(1, PLURALS.jur),
    two: plur(2, PLURALS.jur),
    // Polish selects `few` for 22 and `many` for 25. With no Polish rows
    // loaded both fall back to `other`, which is correct behaviour and
    // proves the selector is running rather than a ternary.
    cats: [0, 1, 2, 5, 22, 25].map((n) => new Intl.PluralRules(document.documentElement.lang).select(n)),
    keys: Object.keys(PLURALS).length,
  }));
  t.check(`${lang}: plural sets reach the page (${plurals.keys} nouns)`, plurals.keys >= 10, plurals.keys);
  t.check(`${lang}: 1 is singular`, plurals.one === PLURAL_SINGULAR, plurals.one);
  t.check(`${lang}: 2 is plural`, plurals.two !== PLURAL_SINGULAR, plurals.two);
  t.check(`${lang}: zero is ${lang === "fr" ? "singular, as French requires" : "plural, as German requires"}`,
    lang === "fr" ? plurals.zero === PLURAL_SINGULAR : plurals.zero !== PLURAL_SINGULAR,
    `${lang} zero -> ${plurals.zero} (categories seen: ${plurals.cats.join(",")})`);

  await p2.close();
}

// ---- 40. the page works at 390px ------------------------------------
//
// NOTHING IN THIS SUITE HAD EVER OPENED A NARROW VIEWPORT. Every check
// above runs at 1280 or 1440, which is why a whole column of the savings
// table could sit 81 pixels off the right edge of a phone -- showing the
// gross figure and hiding the scope-adjusted one -- and pass 246 checks.
//
// 390px is the iPhone 12-15 logical width and the narrowest common
// screen; 360 covers most Android.
for (const width of [390, 360]) {
  const m = await browser.newPage({ viewport: { width, height: 844 } });
  t.watch(m);
  await m.goto(`file://${file}`);
  // A FOOTPRINT FIRST. Since migration 579 nothing is selected on load,
  // so a bare Calculate produces no wave plan -- and the wave-table half
  // of the fold check measured zero rows and said so. The check was
  // right; the scenario was empty.
  await m.evaluate(() => {
    document.getElementById("useSubs").checked = false;
    document.querySelectorAll("#countryList input[type=checkbox][data-i]")
      .forEach((b) => { b.checked = COUNTRIES[+b.dataset.i][2] === "Eu"; });
  });
  await m.click("#run"); await m.waitForTimeout(900);

  // (a) NOTHING OFF THE RIGHT EDGE. A horizontal scrollbar on a phone
  //     means something is unreachable, and the reader has no way to know
  //     what.
  const doc = await m.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth, vp: window.innerWidth }));
  t.check(`${width}px: the page does not scroll sideways (${doc.scrollW} vs ${doc.vp})`,
    doc.scrollW <= doc.vp + 1, JSON.stringify(doc));

  // (b) THE SCOPE-ADJUSTED FIGURE IS ON SCREEN. This is the one that was
  //     wrong: the phone kept "annual value" and lost "saved on this
  //     scope", which is the number the whole page exists to be careful
  //     about.
  const scoped = await m.evaluate(() => {
    const cells = [...document.querySelectorAll('#savingsTable td[data-col]')];
    const banks = cells.filter((c) => /scope/i.test(c.getAttribute("data-col")));
    return { count: banks.length,
             offscreen: banks.filter((c) => c.getBoundingClientRect().right > window.innerWidth + 1).length,
             labelled: banks.every((c) => (c.getAttribute("data-col") || "").length > 3) };
  });
  t.check(`${width}px: every scope figure is on screen (${scoped.count} cells)`,
    scoped.count >= 4 && scoped.offscreen === 0, JSON.stringify(scoped));
  t.check(`${width}px: and carries its own heading, since the header row is hidden`,
    scoped.labelled);

  // (c) THE PLAN IS THE TABLE, NOT A CHART THAT IS 60% OFF SCREEN. Four
  //     of seven rows rendered as empty runways at this width.
  const view = await m.evaluate(() => ({
    table: !document.getElementById("waves").classList.contains("hidden"),
    chart: !document.getElementById("gantt").parentElement.classList.contains("hidden") }));
  t.check(`${width}px: the wave table is the default view of the plan`,
    view.table && !view.chart, JSON.stringify(view));

  // And the chart is still reachable, because hiding it would be a
  // different defect from showing it broken.
  await m.click("#tblToggle"); await m.waitForTimeout(500);
  t.check(`${width}px: and the chart is one tap away`,
    await m.evaluate(() => !document.getElementById("gantt").parentElement.classList.contains("hidden")));

  // (c2) EVIDENCE COLLAPSES ON A PHONE, AND ONLY ON A PHONE. The working
  //      under each savings row and the "Why" under each wave row were
  //      most of a ~9,700px page. Desktop is asserted separately below,
  //      because collapsing evidence on the page whose proposition is
  //      evidence would be a far worse defect than the one it fixes.
  await m.click("#tblToggle"); await m.waitForTimeout(400);   // back to the table
  const fold = await m.evaluate(() => {
    const tot = document.querySelector("#savingsTable tr.tot");
    return {
      savings: document.querySelectorAll("#savingsTable details.working").length,
      waves: document.querySelectorAll("#waves details.working").length,
      open: [...document.querySelectorAll("details.working")].filter((d) => d.open).length,
      // The total row's first cell spans two columns, so a collapser
      // working by position folds a headline FIGURE into a disclosure.
      totalFolded: !!(tot && tot.querySelector("details")),
      totalOrder: tot ? [...tot.children].map((c) => c.getAttribute("data-col") || "title") : [],
    };
  });
  t.check(`${width}px: the working is folded away (${fold.savings} savings, ${fold.waves} wave rows)`,
    fold.savings >= 8 && fold.waves >= 5 && fold.open === 0, JSON.stringify(fold));
  t.check(`${width}px: and no figure was folded with it`,
    !fold.totalFolded && fold.totalOrder.join(",") === "title,Annual value,Saved on this scope",
    JSON.stringify(fold.totalOrder));
  // It has to open, or this is not a fold, it is a deletion.
  //
  // JUSTIFICATION, not Calculation. Migration 586 stopped folding the
  // arithmetic: an independent reviewer took the visible $9.84 AP cost,
  // multiplied it out, and got $295,200 against a table saying $426,900,
  // because the $14.23 that reconciles it had gone behind this very
  // disclosure. The calculation is now always on the row and only the
  // sourcing folds -- so the check follows what the fold actually
  // contains, and the line below asserts the other half stayed out.
  await m.evaluate(() => document.querySelector("#savingsTable details.working").open = true);
  await m.waitForTimeout(150);
  t.check(`${width}px: and opens to the full working`,
    await m.evaluate(() => /Justification/i.test(
      document.querySelector("#savingsTable details.working").textContent)));
  t.check(`${width}px: and the arithmetic never folded in the first place`,
    await m.evaluate(() => {
      const cell = document.querySelector('#savingsTable tr[data-row="ap"] td:nth-child(2)');
      const calc = cell.querySelector(".bcalc");
      return !!calc && !calc.closest("details");
    }));

  // (d) TAP TARGETS. Seventy country rows at 13px was the hardest thing
  //     on the page to operate and the first task anyone performs.
  const small = await m.evaluate(() =>
    [...document.querySelectorAll("#countryList label")]
      .filter((e) => e.getBoundingClientRect().height < 44).length);
  t.check(`${width}px: no country row is below the 44px tap target`, small === 0, small);
  await m.close();
}

// Desktop is unchanged by any of it -- the chart is the default view and
// the table is not. Worth asserting, because every rule above is inside a
// media query and a mistyped breakpoint would move the desktop silently.
const wide = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await wide.goto(`file://${file}`);
await wide.click("#run"); await wide.waitForTimeout(800);
t.check("1440px: the chart is still the default and the table is not",
  await wide.evaluate(() => !document.getElementById("gantt").parentElement.classList.contains("hidden")
    && document.getElementById("waves").classList.contains("hidden")));
// THE EVIDENCE FOLDS ON A DESKTOP TOO, since migration 585 and item 10 of
// the usability assessment. This check used to assert the opposite, on the
// reasoning that "the fold was asked for on mobile only, and a change that
// quietly reached the wide layout would remove the thing the page is for".
//
// The concern was right and the remedy is not the absence of a fold: it is
// that folding must never make the derivation UNREACHABLE. So the check
// inverts and gets stricter -- the rows fold, the working is still in the
// DOM, and opening one actually reveals it.
const wideFold = await wide.evaluate(() => {
  const ds = [...document.querySelectorAll("#savingsTable details.working")];
  if(!ds.length) return { n: 0 };
  const first = ds[0];
  const shut = first.querySelector("div, span") ? first.scrollHeight : 0;
  first.open = true;
  return { n: ds.length, shut, open: first.scrollHeight,
           hasText: /Calculation|Justification/i.test(first.textContent) };
});
t.check(`1440px: the working folds, and opens (${wideFold.n} rows)`,
  wideFold.n > 0 && wideFold.hasText && wideFold.open > wideFold.shut,
  JSON.stringify(wideFold));
// And no figure was folded with it -- the same guard the mobile block
// carries, because the total row's first cell spans two columns and the
// first version of this mechanism folded a headline number.
// THE GRADES STAY VISIBLE ON A COLLAPSED ROW. The assessment's own
// condition on this change -- "with the grade chips still visible when
// collapsed" -- and the first implementation failed it: the chips went
// inside the fold and the BASIS column became nine identical links, which
// is the repetition this item was raised about, reproduced by its fix.
const sumGrades = await wide.evaluate(() =>
  [...document.querySelectorAll("#savingsTable details.working > summary")]
    .map((sm) => [...sm.querySelectorAll(".sumg")].map((c) => c.textContent.trim()).join("")));
t.check(`1440px: every folded row shows its grades (${sumGrades.join("/")})`,
  sumGrades.length > 0 && sumGrades.every((g) => g.length > 0), JSON.stringify(sumGrades));
// And they DIFFER row to row, which is the whole point: a column of nine
// identical summaries carries no information, and would pass a check that
// only asked whether chips were present.
t.check("1440px: and the grades differ between rows",
  new Set(sumGrades).size > 1, JSON.stringify([...new Set(sumGrades)]));
t.check("1440px: and no figure was folded with it",
  await wide.evaluate(() => ![...document.querySelectorAll("#savingsTable td.num")]
    .some((td) => td.querySelector("details.working"))));
await wide.close();

await browser.close();
process.exit(t.report() ? 0 : 1);
