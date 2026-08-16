#!/usr/bin/env node
// roi-currency.mjs — the currency selector converts, and converts back.
//
//   node tests/roi-currency.mjs
//
// Dan, 12 August 2026: "switching currency for the calculation seems to
// not alter the underlying calculations... the calculator yields the same
// outcome regardless of whether you select USD, GBP or EUR."
//
// He was right. The selector changed the SYMBOL and nothing else, so
// Ardent's USD 9.84 was relabelled as GBP 9.84 and a sterling business
// case came out about a third too high. The fix normalises every money
// benchmark to USD server-side and converts on display.
//
// Then the fix had a bug of its own: re-anchoring the canonical USD value
// on every switch meant 9.84 came back as 9.83 and 62,000 as 62,001. A
// figure that drifts when you toggle a dropdown destroys confidence in
// every other number on the page, so the round trip is tested here
// explicitly rather than eyeballed.
import { buildRoiPage } from "./lib/build-page.mjs";
import { launch, suite } from "./lib/browser.mjs";

const t = suite("Currency round trip");
const { file, fx } = await buildRoiPage();
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
t.watch(page);
await page.goto(`file://${file}`);
await page.click("#assump summary");

// The money inputs, and the page's own rounding rule: pennies below a
// thousand, whole units above it.
//
// `errMins` is NOT here, and its absence is the point of the check
// below. Migration 558 replaced the $45 rework cost with a duration in
// minutes; a duration does not convert into GBP, but the money it
// produces has to, because it is priced at the data-entry rate that
// does. Dropping errCost from this list without asserting that would
// have quietly removed coverage of the rework row's currency behaviour
// rather than moving it.
const MONEY = ["costNow", "costAR", "fteCost", "cImplS", "cImplC", "cPlat", "cRun"];
const roundCur = (v) => (v >= 1000 ? Math.round(v) : Math.round(v * 100) / 100);
const read = async () => Object.fromEntries(await Promise.all(
  MONEY.map(async (id) => [id, +(await page.inputValue(`#${id}`))])));
const setCur = async (c) => { await page.selectOption("#cur", c); await page.waitForTimeout(250); };
const money = async () => (await page.locator("#summary .stat .n").allTextContents())
  .filter((s) => /[£€$]/.test(s)).map((s) => +s.replace(/[^\d.]/g, ""));

t.check("page opens in USD", (await page.inputValue("#cur")) === "USD");
const usd = await read();
t.check("USD baseline is the published benchmark", usd.costNow === 9.84, usd.costNow);
t.check("FX table carries GBP and EUR", !!fx.GBP && !!fx.EUR, Object.keys(fx));
t.check("USD is pinned at parity", (fx.USD ? fx.USD.r : 1) === 1);

// ---- 1. converting actually converts ----
await setCur("GBP");
const gbp = await read();
const wrong = MONEY.filter((id) => gbp[id] !== roundCur(usd[id] / fx.GBP.r));
t.check("every money input converts at the stored rate", wrong.length === 0,
  wrong.map((id) => `${id}: ${gbp[id]} != ${roundCur(usd[id] / fx.GBP.r)}`).join(", "));
t.check("the headline benchmark is converted, not relabelled",
  gbp.costNow !== usd.costNow, `${usd.costNow} -> ${gbp.costNow}`);

// ---- 2. the results move with it ----
// This is the defect Dan reported, stated as an assertion: the same
// scenario in GBP must produce a smaller number than in USD, in the
// proportion of the rate.
await setCur("USD");
await page.click("#run"); await page.waitForTimeout(400);
const inUsd = await money();
await setCur("GBP");
await page.click("#run"); await page.waitForTimeout(400);
const inGbp = await money();
t.check("summary is money in both currencies", inUsd.length > 0 && inUsd.length === inGbp.length,
  `${inUsd.length} vs ${inGbp.length}`);
const ratios = inUsd.map((v, i) => v / inGbp[i]);
const offRate = ratios.filter((r) => Math.abs(r - fx.GBP.r) > 0.01);
t.check(`results scale by the rate (${ratios.map((r) => r.toFixed(4)).join(", ")} vs ${fx.GBP.r})`,
  offRate.length === 0);
t.check("the symbol follows the numbers",
  (await page.locator("#summary .stat .n").first().textContent()).startsWith("£"));

// ---- 3. the round trip is lossless ----
await setCur("USD");
const back = await read();
const drifted = MONEY.filter((id) => back[id] !== usd[id]);
t.check("USD -> GBP -> USD returns the original figures", drifted.length === 0,
  drifted.map((id) => `${id}: ${usd[id]} -> ${back[id]}`).join(", "));

await setCur("GBP"); await setCur("EUR"); await setCur("GBP"); await setCur("USD");
const back4 = await read();
const drifted4 = MONEY.filter((id) => back4[id] !== usd[id]);
t.check("four hops still return the original figures", drifted4.length === 0,
  drifted4.map((id) => `${id}: ${usd[id]} -> ${back4[id]}`).join(", "));

// ---- 4. the reader's own number survives in real terms ----
// Someone typing £20 into a sterling page means twenty pounds, not
// twenty dollars. It has to follow them into the next currency.
await setCur("GBP");
await page.fill("#cImplS", "20000");
await page.dispatchEvent("#cImplS", "input");
await page.waitForTimeout(150);
await setCur("USD");
const asUsd = +(await page.inputValue("#cImplS"));
t.check(`an override converts with you (£20,000 -> $${asUsd})`,
  asUsd === roundCur(20000 * fx.GBP.r), roundCur(20000 * fx.GBP.r));
await setCur("GBP");
t.check("and comes back unchanged", +(await page.inputValue("#cImplS")) === 20000,
  await page.inputValue("#cImplS"));

// ---- 5. reset restores the CURRENT currency's defaults ----
// Not the USD ones. Getting this wrong would silently multiply a
// sterling business case by the rate on the way out.
await page.click("#resetDefaults"); await page.waitForTimeout(300);
t.check("reset in GBP restores GBP defaults",
  +(await page.inputValue("#cImplS")) === roundCur(usd.cImplS / fx.GBP.r),
  await page.inputValue("#cImplS"));

// ---- 6. the page says the rate is fixed, and when it was taken ----
const note = await page.locator("#fxNote").textContent();
t.check("the always-visible note calls the rate fixed", /fixed rate/i.test(note), note);
t.check("and dates it", note.includes(fx.GBP.asOf), note);
await setCur("USD");
t.check("USD note explains the benchmark basis",
  /US dollars/i.test(await page.locator("#fxNote").textContent()));

// ---- 7. a duration is not money, but what it buys is ----
// Migration 558. The rework row is now minutes x the loaded data-entry
// rate. If errMins were ever added to CUR_INPUTS the input would be
// "converted" from 15 minutes to 11, which is meaningless and would
// look like a rounding bug rather than a category error. And if the
// derived cost stopped converting, a sterling business case would carry
// a dollar rework line.
await setCur("USD");
await page.click("#run"); await page.waitForTimeout(900);
const reworkUsd = await page.locator('#savingsTable tr[data-row="rework"] td').nth(2).innerText();
const minsUsd = await page.inputValue("#errMins");
await setCur("GBP");
await page.click("#run"); await page.waitForTimeout(900);
const reworkGbp = await page.locator('#savingsTable tr[data-row="rework"] td').nth(2).innerText();
const minsGbp = await page.inputValue("#errMins");
t.check(`minutes do not convert (${minsUsd} -> ${minsGbp})`,
  minsUsd === minsGbp, `${minsUsd} vs ${minsGbp}`);
const num = (s) => +String(s).replace(/[^\d.]/g, "");
t.check(`but the money the minutes buy does (${reworkUsd} -> ${reworkGbp})`,
  Math.abs(num(reworkGbp) - num(reworkUsd) / fx.GBP.r) <= Math.max(2, num(reworkUsd) * 0.002),
  `${num(reworkUsd)} / ${fx.GBP.r} = ${Math.round(num(reworkUsd) / fx.GBP.r)} vs ${num(reworkGbp)}`);
await setCur("USD");

await browser.close();
process.exit(t.report() ? 0 : 1);
