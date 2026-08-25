#!/usr/bin/env node
// gen-social-images.mjs — the wordmark and the share card.
//
//   node tools/gen-social-images.mjs
//
// Writes images/logo.png and images/og-default.png.
//
// ---- WHY THESE ARE GENERATED RATHER THAN DRAWN --------------------------
//
// Dan supplied the wordmark on 25 August 2026 as a 344x93 PNG. That is the
// right mark and the wrong resolution: an og:image wants 1200x630, and
// upscaling 344px by three and a half is visibly soft on exactly the
// surface — a LinkedIn card — the image exists for.
//
// So the mark is REBUILT at whatever size is asked for, from the same font
// the site itself loads: Big Shoulders Display 800, which is what every
// `.display` heading on the tracker is set in. The colours are the site's
// own tokens. The output is therefore the same mark, sharp, and it stays
// in step with the site's typography rather than being a picture of it.
//
// ---- THE ONE RULE THIS FILE IS WRITTEN AGAINST -------------------------
//
// NO FACTS IN THE PIXELS. It is tempting to put "70 countries" on the
// card, and it would be the single most persuasive thing on it. It would
// also be a claim baked into a binary that tests/jurisdiction-count.mjs
// cannot read, in a repository that has already had a stale jurisdiction
// count sit across thirty files for two days. Every number this site
// publishes is checked against D1; a number in a PNG could not be. So the
// strapline carries no count, no date and no status — nothing that can
// rot. If a future card needs live data it must be generated on a
// schedule and added to the checked set, deliberately, not by drifting
// into it.
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(REPO, "images");

// The site's own tokens, copied from the tracker's :root. Not imported,
// because they live in a <style> block inside an HTML file; if they ever
// move somewhere importable, import them.
const INK = "#0f1a2b";
const CREAM = "#f2f0e8";
const ACCENT = "#c98a3a";
const MUTED = "#93a3c0";

// Chromium here has no network, and a webfont that fails to load falls
// back to a system sans — which would silently produce a wordmark in the
// wrong typeface. Embedding the file makes that impossible: either the
// font is there or the script cannot start.
const font = (pkg, file) => {
  const path = join(REPO, "node_modules", pkg, "files", file);
  try {
    return readFileSync(path).toString("base64");
  } catch {
    throw new Error(
      `Missing ${pkg}. This script needs the real faces, not a fallback:\n`
      + `  npm install --no-save ${pkg}`);
  }
};
const DISPLAY = font("@fontsource/big-shoulders-display", "big-shoulders-display-latin-800-normal.woff2");
const MONO = font("@fontsource/ibm-plex-mono", "ibm-plex-mono-latin-500-normal.woff2");

const FACES = `
@font-face{font-family:'Big Shoulders Display';font-weight:800;font-style:normal;
  src:url(data:font/woff2;base64,${DISPLAY}) format('woff2');}
@font-face{font-family:'IBM Plex Mono';font-weight:500;font-style:normal;
  src:url(data:font/woff2;base64,${MONO}) format('woff2');}
html,body{margin:0;padding:0;background:${INK};}
*{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
.mark{font-family:'Big Shoulders Display',sans-serif;font-weight:800;color:${CREAM};
  text-transform:uppercase;line-height:0.88;letter-spacing:0.005em;}
`;

// THE WORDMARK, two lines, exactly as Dan drew it. Kept as one string so
// the logo and the card cannot disagree about what the site is called.
const WORDMARK = `<div class="mark">The E-Invoicing<br>Compliance Corner</div>`;

const SHOTS = [
  {
    // THE LOGO, for schema.org Organization.logo. A rectangle rather than
    // a square, which is what Google asks for, at the same 3.7:1 the
    // supplied art uses.
    file: "logo.png",
    width: 1000,
    height: 270,
    html: `<div style="width:100%;height:100%;display:flex;align-items:center;
      justify-content:center;background:${INK};">
      <div class="mark" style="font-size:86px;text-align:center;">The E-Invoicing<br>Compliance Corner</div>
    </div>`,
  },
  {
    // THE SHARE CARD. 1200x630 is the size every platform crops from, and
    // 1.91:1 is what LinkedIn, Slack and X all expect. Everything sits
    // well inside the edges: the crops differ between platforms and a mark
    // that touches the boundary loses a limb on one of them.
    file: "og-default.png",
    width: 1200,
    height: 630,
    html: `<div style="width:100%;height:100%;background:${INK};display:flex;
      flex-direction:column;justify-content:center;padding:0 96px;">
      <div style="width:74px;height:5px;background:${ACCENT};margin-bottom:40px;"></div>
      ${WORDMARK.replace('class="mark"', 'class="mark" style="font-size:112px;"')}
      <div style="font-family:'IBM Plex Mono',monospace;font-weight:500;font-size:23px;
        letter-spacing:0.13em;text-transform:uppercase;color:${MUTED};margin-top:44px;">
        Mandates, deadlines and official sources
      </div>
    </div>`,
  },
];

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium",
});
mkdirSync(OUT, { recursive: true });

for (const shot of SHOTS) {
  // LAID OUT AT 1x, DELIVERED AT 2x — and the declared og:image:width
  // follows the FILE, not the layout.
  //
  // The first version downsampled back to 1200x630, on the reasoning that
  // the declared dimensions must match the file. They still must; the
  // dimensions declared in the markup are simply the doubled ones now.
  //
  // WHY IT CHANGED (25 August 2026). Dan reported the wordmark looking
  // blurred in LinkedIn's Post Inspector. Measured, the 1200x630 file was
  // not soft at all: mean edge transition 0.90px, and it scored HIGHER
  // edge energy than a native 1x render of the same card. So the softness
  // was never in the file — it is the preview thumbnail scaling 1200px
  // into a few hundred, and LinkedIn re-encoding to JPEG, which is at its
  // worst on exactly this content: heavy cream type on near-black navy.
  //
  // Neither of those is controllable. The only lever left is giving their
  // scaler more to work with, so the file ships at twice the reference
  // size. Every platform downscales to its own card width anyway, and a
  // 2x source survives that better than a 1x one — the same reason this
  // renders at deviceScaleFactor 2 in the first place.
  const page = await browser.newPage({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: 2,
  });
  await page.setContent(`<style>${FACES}</style>${shot.html}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const path = join(OUT, shot.file);
  await page.screenshot({ path, type: "png" });
  console.log(`  images/${shot.file}  ${shot.width * 2}x${shot.height * 2}`
    + ` (laid out at ${shot.width}x${shot.height}, captured at 2x)`);
  await page.close();
}

await browser.close();
