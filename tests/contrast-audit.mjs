#!/usr/bin/env node
// contrast-audit.mjs — WCAG AA contrast over the ROI page, in the shell
// that actually serves it.
//
//   node tests/contrast-audit.mjs
//
// Two failures produced this file, and it is built around both.
//
// THE REAL ONE. Dan: "the test color of the text... is very difficult to
// read." The executive summary was rendering at 1.05:1 — near-black on
// dark navy, 55 elements. The standalone page passed cleanly, which is
// why it shipped: members-worker's pageShell() puts BASE_STYLE before
// ROI_STYLE, and BASE_STYLE paints .card cream with color:#241d10, which
// ROI_STYLE overrode the background of but not the colour. Auditing a
// shared render module on its own audits a page nobody loads. So this
// runs against tests/lib/build-page.mjs, which assembles the two
// stylesheets in the Worker's own order.
//
// THE FALSE ONE. The first version of this audit invented six failures
// by walking up the ancestor chain and taking the first background it
// found, treating rgba(255,255,255,0.02) as opaque white. A tool that
// reports failures nobody can reproduce gets ignored within a week, so
// bgOf() composites the whole chain honouring alpha, and so does the
// text colour.
import { buildRoiPage } from "./lib/build-page.mjs";
import { launch, suite } from "./lib/browser.mjs";
import { AUDIT_EXPR as AUDIT } from "./lib/contrast.mjs";

// Documented exceptions. Each needs a reason and an owner; an empty
// allowlist is the goal, and a growing one is a smell.
const ALLOWED = [
  // { selector: '.eyebrow', reason: '...', ratio: 3.17 },
];

const t = suite("Contrast audit");
const { file } = await buildRoiPage();
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
t.watch(page);
await page.goto(`file://${file}`);

const allowed = (f) => ALLOWED.some((a) => f.cls.split(/\s+/).includes(a.selector.replace(/^\./, "")));
const show = (label, list) => {
  console.log(`\n  ${list.length} ${label}:`);
  const seen = new Set();
  list.forEach((f) => {
    const key = f.color + "|" + f.bg + "|" + f.cls;
    if (seen.has(key)) return;
    seen.add(key);
    console.log(`    ${f.ratio}:1 (needs ${f.need})  ${f.color} on ${f.bg}  `
      + `${f.size}px${f.bold ? " bold" : ""} ${f.tag}.${f.cls || "-"} — "${f.text}"`);
  });
};

// State 1: the page as it first loads, assumptions closed.
let r = await page.evaluate(AUDIT);
let fails = [...r.visible, ...r.hidden].filter((f) => !allowed(f));
if (fails.length) show("failing on load", fails);
t.check(`on load: ${r.counts.elements} elements audited, 0 AA failures`, fails.length === 0);

// State 2: assumptions open — 18 inputs, their hints and their evidence
// tooltips, none of which exist in the DOM's measured state until now.
await page.click("#assump summary");
await page.waitForTimeout(200);
r = await page.evaluate(AUDIT);
fails = [...r.visible, ...r.hidden].filter((f) => !allowed(f));
if (fails.length) show("failing with assumptions open", fails);
t.check(`assumptions open: ${r.counts.tips} tooltips audited, 0 AA failures`, fails.length === 0);

// State 3: results — the panel that shipped at 1.05:1.
await page.check("#useSubs").catch(() => {});
await page.click("#run");
await page.waitForTimeout(600);
r = await page.evaluate(AUDIT);
fails = [...r.visible, ...r.hidden].filter((f) => !allowed(f));
if (fails.length) show("failing with results shown", fails);
t.check(`results shown: ${r.counts.elements} elements audited, 0 AA failures`, fails.length === 0);

// State 4: the adjust panel open, with the sanity guards showing. New UI
// that only exists after a calculation, inside a <details> that is closed
// by default — three ways for an audit to miss it entirely.
await page.click("#adjust summary").catch(() => {});
await page.waitForTimeout(250);
r = await page.evaluate(AUDIT);
fails = [...r.visible, ...r.hidden].filter((f) => !allowed(f));
if (fails.length) show("failing with the adjust panel open", fails);
t.check(`adjust panel open: ${r.counts.elements} elements audited, 0 AA failures`,
  fails.length === 0);
t.check("the adjust panel is actually on screen",
  (await page.locator("[data-ovr-dl]").count()) > 0,
  await page.locator("[data-ovr-dl]").count());

// A guard on the audit itself: if the selectors ever stop matching, the
// audit passes vacuously and nobody notices. Assert it found real work.
t.check(`the audit is actually looking at something `
  + `(${r.counts.elements} elements, ${r.counts.tips} tooltips, ${r.counts.markers} markers)`,
  r.counts.elements > 300 && r.counts.tips > 20 && r.counts.markers > 20);

if (ALLOWED.length) {
  console.log(`\n  ${ALLOWED.length} documented exception(s) in force:`);
  ALLOWED.forEach((a) => console.log(`    ${a.selector} — ${a.reason}`));
}

await browser.close();
process.exit(t.report() ? 0 : 1);
