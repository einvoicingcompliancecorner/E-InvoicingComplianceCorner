#!/usr/bin/env node
// sync-palette.mjs — write the one palette into every file that carries it.
//
//   node tools/sync-palette.mjs          # rewrite in place
//   node tools/sync-palette.mjs --check  # exit 1 if anything is out of date
//
// The palette used to be hand-written in 23 :root blocks across 18 files
// and was believed identical. It was not -- see the header of
// shared/palette.mjs. This is the generator for those blocks, and
// tests/palette.mjs runs it in --check mode, so a hand edit fails the
// suite rather than shipping.
//
// WHY REPLACE THE BLOCKS RATHER THAN LINK ONE STYLESHEET. A <link> would
// be one source of truth too, and cheaper to write. It would also be a
// render-blocking request added to every page, and -- more to the point --
// the static pages are served straight off the asset layer while the
// renderers build their CSS inline, so a link would have introduced a
// second delivery path for the same bytes. Generating into both keeps one
// path and one source.
//
// THE MARKERS ARE LOAD-BEARING. First run matches a bare `:root{...}`;
// afterwards it matches between the markers, so re-running is idempotent
// and a block that someone has edited by hand is overwritten rather than
// duplicated.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { paletteCss, PALETTE_MARKERS, themeBootScript } from "../shared/palette.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const CHECK = process.argv.includes("--check");

// Every file that defines the palette. Listed rather than globbed: a new
// page that defines its own :root should be a deliberate addition here,
// and tests/palette.mjs fails on any :root block in the tree that this
// list does not cover -- which is how a page that quietly grew its own
// copy gets noticed.
export const PALETTE_FILES = [
  "education-certified-providers.html",
  "education-impact-of-mandate.html",
  "education-mandate-types.html",
  "education-preparing-for-mandate.html",
  "education-types-of-provider.html",
  "einvoicing-compliance-tracker.html",
  "feedback.html",
  "privacy-policy.html",
  "subscribe.html",
  "whitepaper-ctc-rollouts-compared.html",
  "whitepaper-ctc-rollouts-compared-de.html",
  "whitepaper-ctc-rollouts-compared-es.html",
  "whitepaper-ctc-rollouts-compared-fr.html",
  "whitepaper-einvoicing-roi-evidence.html",
  "whitepaper-einvoicing-roi-evidence-de.html",
  "whitepaper-einvoicing-roi-evidence-es.html",
  "whitepaper-einvoicing-roi-evidence-fr.html",
  "shared/deep-dive-render.mjs",
  "shared/roi-render.mjs",
  "site-worker/src/index.js",
  "members-worker/src/index.js",
];

// ONLY RUN WHEN INVOKED DIRECTLY. tests/palette.mjs imports
// PALETTE_FILES from this module, and without this guard the import ran
// the whole generator -- including the process.exit(0) at the bottom, so
// the suite terminated silently with a zero status and printed not one
// check. A test that exits 0 having asserted nothing is worse than a
// failing one.
const MAIN = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BETWEEN = new RegExp(
  `[ \\t]*${esc(PALETTE_MARKERS.start)}[\\s\\S]*?${esc(PALETTE_MARKERS.end)}`, "g");
// A bare :root block, for the first run.
//
// THE BODY MUST BE NOTHING BUT CUSTOM-PROPERTY DECLARATIONS, and that is
// not fussiness. The first version of this matched `:root\s*\{[^}]*\}`,
// which is fine against CSS and catastrophic against the JavaScript in
// site-worker: `.replace(':root{', ':host{')` starts with the same seven
// characters, and `[^}]*` then ran forward through real code to the next
// closing brace and replaced all of it with a palette. It rewrote 459
// lines of site-worker and 179 of the tracker before the diff was read.
//
// Requiring `--name: value;` throughout means the pattern can only match
// a declaration block, so a string literal that happens to contain the
// selector is not a candidate. Read the diff anyway.
const BARE = /[ \t]*:root\s*\{(?:\s*--[\w-]+\s*:[^;{}]*;)+\s*\}/g;

// ---- and the boot script, which has the same problem twice over -------
//
// The renderers interpolate `${themeBootScript()}` and are therefore
// always current. The fourteen STATIC pages cannot: the script was pasted
// into their <head> once, and from that moment they carried a frozen copy
// that no longer tracked the module.
//
// That bit on 28 August. `?skin=` was added to themeBootScript(), the
// renderers picked it up, the static pages did not, and the tracker --
// which is a static page -- silently ignored the parameter while every
// module-level check passed. Exactly the shape this file was written to
// prevent for the palette, on the other half of the same feature.
//
// So the boot script is generated into them too, between the same marker
// it already carried, and tests/palette.mjs fails when a page's copy
// drifts from the module.
const BOOT_MARK = "<!-- theme:boot -->";
const BOOT_RE = new RegExp(`${esc(BOOT_MARK)}<script>[\\s\\S]*?<\\/script>`, "g");

export const BOOT_FILES = PALETTE_FILES.filter((f) => f.endsWith(".html"));

if (!MAIN) { /* imported for PALETTE_FILES only */ }
else {
let changed = 0, stale = [];
for (const rel of PALETTE_FILES) {
  const path = join(REPO, rel);
  const src = readFileSync(path, "utf8");
  let out = src, n = 0;

  const replace = (re) => {
    out = out.replace(re, (m) => {
      n += 1;
      const indent = (m.match(/^[ \t]*/) || [""])[0];
      return paletteCss(indent);
    });
  };

  if (BETWEEN.test(src)) { BETWEEN.lastIndex = 0; replace(BETWEEN); }
  else replace(BARE);

  if (!n) {
    console.error(`sync-palette: no palette block found in ${rel}. `
      + "Either it stopped defining one, or the markers were damaged.");
    process.exit(1);
  }

  // The static pages also carry a pasted copy of the boot script.
  if (BOOT_FILES.includes(rel)) {
    const want = BOOT_MARK + themeBootScript();
    let bootN = 0;
    out = out.replace(BOOT_RE, () => { bootN += 1; return want; });
    if (!bootN) {
      console.error(`sync-palette: no ${BOOT_MARK} script found in ${rel}.`);
      process.exit(1);
    }
    if (bootN > 1) {
      console.error(`sync-palette: ${bootN} boot scripts in ${rel}; expected one.`);
      process.exit(1);
    }
  }
  if (out !== src) {
    changed += 1; stale.push(`${rel} (${n} block${n > 1 ? "s" : ""})`);
    if (!CHECK) writeFileSync(path, out);
  }
}

if (CHECK) {
  if (changed) {
    console.error("PALETTE OUT OF DATE — these files do not match shared/palette.mjs:");
    stale.forEach((s) => console.error(`  ${s}`));
    console.error("\n  node tools/sync-palette.mjs\n");
    process.exit(1);
  }
  console.log(`palette in sync across ${PALETTE_FILES.length} files`);
} else {
  console.log(changed ? `rewrote ${changed} file(s):\n  ${stale.join("\n  ")}`
    : `already in sync across ${PALETTE_FILES.length} files`);
}
process.exit(0);
}
