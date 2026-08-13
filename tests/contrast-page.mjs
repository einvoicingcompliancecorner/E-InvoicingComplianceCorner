#!/usr/bin/env node
// contrast-page.mjs — audit any page this project ships.
//
//   node tests/contrast-page.mjs design-review.html
//   node tests/contrast-page.mjs whitepaper-einvoicing-roi-evidence.html
//   node tests/contrast-page.mjs https://e-invoicingcompliancecorner.com/
//
// The ROI planner has its own suite (contrast-audit.mjs) because it needs
// building from D1 first and has three interactive states. Everything
// else this project ships is a static HTML file, and every one of them
// has been hand-checked at some point. This is that check, on demand.
//
// Exits non-zero on any AA failure, so it can gate a deliverable.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { launch } from "./lib/browser.mjs";
import { AUDIT_EXPR } from "./lib/contrast.mjs";

const target = process.argv[2];
if (!target) {
  console.error("usage: node tests/contrast-page.mjs <file.html | url> [viewport-width]");
  process.exit(2);
}
const width = +(process.argv[3] || 1280);
const url = /^https?:\/\//.test(target)
  ? target
  : (existsSync(resolve(target)) ? `file://${resolve(target)}`
    : (console.error(`no such file: ${target}`), process.exit(2)));

const browser = await launch();
const page = await browser.newPage({ viewport: { width, height: 1400 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(300);

const r = await page.evaluate(AUDIT_EXPR);
const fails = [...r.visible, ...r.hidden];

console.log(`${target} @ ${width}px`);
console.log(`  ${r.counts.elements} elements audited`
  + (r.counts.tips ? `, ${r.counts.tips} hidden tooltips` : ""));

const seen = new Set();
fails.forEach((f) => {
  const key = f.color + "|" + f.bg + "|" + f.cls;
  if (seen.has(key)) return;
  seen.add(key);
  console.log(`  ${f.ratio}:1 (needs ${f.need})  ${f.color} on ${f.bg}  `
    + `${f.size}px${f.bold ? " bold" : ""} ${f.tag}.${f.cls || "-"} — "${f.text}"`);
});

if (pageErrors.length) console.log(`  page errors: ${[...new Set(pageErrors)].join("; ")}`);
console.log(fails.length
  ? `\n${fails.length} AA failure(s), ${seen.size} distinct.`
  : "\n0 AA failures.");

await browser.close();
process.exit(fails.length || pageErrors.length ? 1 : 0);
