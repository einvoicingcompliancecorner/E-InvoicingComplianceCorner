#!/usr/bin/env node
// mock-sponsor-card.mjs — THROWAWAY. Three treatments of a sponsor clip
// on the share card, for Dan to choose between.
//
//   node tools/mock-sponsor-card.mjs
//
// Writes /tmp/sponsor-a.png, -b.png, -c.png. Nothing here ships: the real
// generator is gen-social-images.mjs, and this file should be deleted
// once a treatment is picked and folded into it.
//
// THE LOGO IS A PLACEHOLDER ON PURPOSE. Tradeshift's wordmark is their
// trademark and I do not have the asset; drawing it from memory would get
// the letterforms, weight and spacing wrong, and a wrong version of a
// company's mark is worse than an obvious gap. The dashed box is sized to
// a typical wordmark aspect (roughly 4:1) so the layout is honest about
// how much room the real thing needs.
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const INK = "#0f1a2b", CREAM = "#f2f0e8", ACCENT = "#c98a3a", MUTED = "#93a3c0", LINE = "#2b3c5a";

const font = (pkg, file) =>
  readFileSync(join(REPO, "node_modules", pkg, "files", file)).toString("base64");
const DISPLAY = font("@fontsource/big-shoulders-display", "big-shoulders-display-latin-800-normal.woff2");
const MONO = font("@fontsource/ibm-plex-mono", "ibm-plex-mono-latin-500-normal.woff2");

const FACES = `
@font-face{font-family:'Big Shoulders Display';font-weight:800;src:url(data:font/woff2;base64,${DISPLAY}) format('woff2');}
@font-face{font-family:'IBM Plex Mono';font-weight:500;src:url(data:font/woff2;base64,${MONO}) format('woff2');}
html,body{margin:0;padding:0;background:${INK};}*{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
.mark{font-family:'Big Shoulders Display',sans-serif;font-weight:800;color:${CREAM};text-transform:uppercase;line-height:0.88;font-size:112px;}
.eyebrow{font-family:'IBM Plex Mono',monospace;font-weight:500;letter-spacing:0.13em;text-transform:uppercase;}
.slot{display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;
  font-size:12px;letter-spacing:0.08em;text-transform:uppercase;}
`;

// The card body, identical in all three — only the clip differs.
const BODY = `
  <div style="width:74px;height:5px;background:${ACCENT};margin-bottom:40px;"></div>
  <div class="mark">The E-Invoicing<br>Compliance Corner</div>
  <div class="eyebrow" style="font-size:23px;color:${MUTED};margin-top:44px;">
    Mandates, deadlines and official sources
  </div>`;

const wrap = (clip) => `<div style="width:100%;height:100%;background:${INK};position:relative;
  display:flex;flex-direction:column;justify-content:center;padding:0 96px;">${clip}${BODY}</div>`;

const CLIPS = {
  // A — QUIET. A line of mono type over the mark, no container. Reads as
  // a credit rather than an advertisement, which is the register the rest
  // of this site is written in.
  a: `<div style="position:absolute;top:48px;right:96px;text-align:right;">
        <div class="eyebrow" style="font-size:13px;color:${MUTED};margin-bottom:10px;">Sponsored by</div>
        <div class="slot" style="width:200px;height:50px;border:1px dashed ${MUTED};color:${MUTED};margin-left:auto;">logo goes here</div>
      </div>`,

  // B — PILL. A cream tablet, which is what most corporate wordmarks
  // actually need: they are drawn for light backgrounds and many have no
  // approved reversed version. Costs more visual weight.
  b: `<div style="position:absolute;top:44px;right:96px;display:flex;align-items:center;gap:14px;
        background:${CREAM};border-radius:999px;padding:12px 20px;">
        <span class="eyebrow" style="font-size:11px;color:#5a6473;">Sponsored by</span>
        <span class="slot" style="width:170px;height:38px;border:1px dashed #9aa3b0;color:#5a6473;">logo goes here</span>
      </div>`,

  // C — RULED CORNER. Boxed in the site's own line colour, no fill. Sits
  // between the other two: contained, but still clearly the site's
  // furniture rather than a banner dropped on top of it.
  c: `<div style="position:absolute;top:44px;right:96px;border:1px solid ${LINE};border-radius:10px;
        padding:14px 20px;text-align:right;">
        <div class="eyebrow" style="font-size:11px;color:${ACCENT};margin-bottom:9px;">Sponsored by</div>
        <div class="slot" style="width:180px;height:44px;border:1px dashed ${MUTED};color:${MUTED};margin-left:auto;">logo goes here</div>
      </div>`,
};

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium",
});
mkdirSync("/tmp", { recursive: true });
for (const [key, clip] of Object.entries(CLIPS)) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
  await page.setContent(`<style>${FACES}</style>${wrap(clip)}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `/tmp/sponsor-${key}.png`, type: "png" });
  console.log(`  /tmp/sponsor-${key}.png`);
  await page.close();
}
await browser.close();
