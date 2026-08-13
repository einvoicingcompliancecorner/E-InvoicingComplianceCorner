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

// Documented exceptions. Each needs a reason and an owner; an empty
// allowlist is the goal, and a growing one is a smell.
const ALLOWED = [
  // { selector: '.eyebrow', reason: '...', ratio: 3.17 },
];

const AUDIT = `(() => {
  const parse = (str) => {
    const n = (str.match(/[\\d.]+/g) || []).map(Number);
    return { r: n[0] || 0, g: n[1] || 0, b: n[2] || 0, a: n.length > 3 ? n[3] : 1 };
  };
  // src over dst, straight alpha. This is the part the first version got
  // wrong: an 0.02-alpha white over navy is navy, not white.
  const over = (src, dst) => [
    src.r * src.a + dst[0] * (1 - src.a),
    src.g * src.a + dst[1] * (1 - src.a),
    src.b * src.a + dst[2] * (1 - src.a),
  ];
  // The members shell's page background, used only if no opaque ancestor
  // is found at all (nothing above <html> to composite onto).
  const PAGE = [15, 26, 43];
  const bgOf = (el) => {
    const stack = [];
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c.a > 0) stack.push(c);
      if (c.a === 1) break;
    }
    let base = PAGE;
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  };
  const lum = (c) => {
    const s = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  };
  const ratio = (fg, bg) => {
    const l1 = lum(fg), l2 = lum(bg);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const ownText = (el) => [...el.childNodes]
    .filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();

  const audit = (nodes, { requireVisible }) => {
    const out = [];
    nodes.forEach((el) => {
      const txt = ownText(el);
      if (!txt || txt.length < 3) return;
      if (requireVisible && !el.getClientRects().length) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.opacity === "0") return;
      const bg = bgOf(el);
      const fg = over(parse(cs.color), bg);       // text alpha counts too
      const size = parseFloat(cs.fontSize);
      const bold = +cs.fontWeight >= 700;
      const large = size >= 24 || (size >= 18.66 && bold);
      const need = large ? 3 : 4.5;
      const r = ratio(fg, bg);
      if (r < need) {
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || "",
          size, bold, need, ratio: +r.toFixed(2),
          color: cs.color,
          bg: 'rgb(' + bg.map((v) => Math.round(v)).join(', ') + ')',
          text: txt.slice(0, 60),
        });
      }
    });
    return out;
  };

  return {
    // Everything on screen.
    visible: audit([...document.querySelectorAll("body *")], { requireVisible: true }),
    // Tooltips and evidence popovers are display:none until hover, so
    // they have no box to measure — audit them by declared style. They
    // carry the sourcing, which is the text a sceptical reader squints at
    // hardest, and they were unreadable once already (inherited uppercase
    // mono from their <label> parent).
    hidden: audit([...document.querySelectorAll(".tip, .tip *")], { requireVisible: false }),
    counts: {
      elements: document.querySelectorAll("body *").length,
      tips: document.querySelectorAll(".tip").length,
      markers: document.querySelectorAll(".hlp").length,
    },
  };
})()`;

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
