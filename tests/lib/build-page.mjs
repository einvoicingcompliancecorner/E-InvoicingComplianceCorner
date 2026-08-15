// build-page.mjs — render the ROI & Wave Planner exactly the way a
// signed-in member receives it, and write it somewhere Playwright can
// open it.
//
// THIS FILE IS THE LESSON FROM 12 AUGUST 2026. The planner was audited
// as a standalone page, passed with zero contrast failures, and shipped
// with 55 elements of near-black text on dark navy — because
// members-worker's pageShell() concatenates BASE_STYLE BEFORE the page's
// own ROI_STYLE, and BASE_STYLE paints .card cream with color:#241d10.
// ROI_STYLE re-declared that rule's background and not its colour. The
// standalone render was a page nobody loads.
//
// So the fixture pulls BASE_STYLE out of members-worker/src/index.js
// itself rather than keeping a copy, concatenates it in the same order
// pageShell does, and drives the real exported query functions against
// the replayed migration chain. Everything here is the real thing except
// the transport.
//
// Known, deliberate omissions: the Google Fonts <link> (no network in
// CI, and fallback fonts do not change computed font-size, which is what
// the contrast thresholds turn on) and renderLangBanner()'s strip, which
// sits above the tool and shares no styles with it.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { openReplayDb, REPO } from "./replay-db.mjs";

export const TMP = join(REPO, "tests", ".tmp");

/** Lift BASE_STYLE out of the Worker source. Deliberately not a copy. */
export function extractBaseStyle() {
  const src = readFileSync(join(REPO, "members-worker", "src", "index.js"), "utf8");
  const start = src.indexOf("const BASE_STYLE = `");
  if (start < 0) throw new Error("BASE_STYLE not found in members-worker/src/index.js — "
    + "if it was renamed, this fixture is silently testing the wrong page. Fix it here.");
  const from = start + "const BASE_STYLE = `".length;
  const end = src.indexOf("\n`;", from);
  if (end < 0) throw new Error("BASE_STYLE's closing backtick not found");
  const css = src.slice(from, end);
  if (css.includes("${")) throw new Error("BASE_STYLE now interpolates — this extractor "
    + "would emit literal ${...} into the stylesheet. Evaluate it properly instead.");
  return css;
}

const DEFAULT_SUBSCRIBED = ["France", "Germany", "Italy", "Poland", "Spain",
  "Netherlands", "Belgium", "Greece", "Croatia", "Estonia", "Latvia"];

/**
 * Build the members-shell ROI page.
 * Returns { file, body, script, countries, benchmarks, phases, strings, fx }.
 */
export async function buildRoiPage(opts = {}) {
  const lang = opts.lang || "en";
  const subscribed = opts.subscribed || DEFAULT_SUBSCRIBED;
  const db = await openReplayDb();
  try {
    const roi = await import(join(REPO, "shared", "roi-render.mjs"));

    // The same five queries handleRoiCalculator runs, through the same
    // exported functions. A hand-written copy of this SQL would be one
    // more thing that can be wrong on its own.
    const [countries, benchmarks, phases, strings, fx] = await Promise.all([
      roi.getRoiCountries(db.d1, opts.today),
      roi.getRoiBenchmarks(db.d1, lang),
      roi.getRoiPhases(db.d1, lang),
      roi.getRoiStrings(db.d1, lang),
      roi.getRoiFxRates(db.d1),
    ]);

    // opts.stubStrings replaces every D1 value with a sentinel, so a
    // rendered page can be searched for English that survived — the
    // reverse of asking whether every D1 row is used. Recommendation 1
    // on the design review, and the check that would have found the nine
    // hardcoded strings migrations 544 and 545 fixed by accident.
    const used = opts.stubStrings
      ? Object.fromEntries(Object.keys(strings).map((k) => [k, `«${k}»`]))
      : strings;

    // Benchmarks and phases carry user-facing text of their own — labels,
    // hints, citations, phase names and notes — and it is all D1-backed.
    // Stub it too, or the detector reports every citation on the page as
    // hardcoded and buries the real findings in noise.
    const stubRow = (row, fields) => opts.stubStrings
      ? { ...row, ...Object.fromEntries(fields
          .filter((f) => row[f] != null && row[f] !== "")
          .map((f) => [f, `«${row.key || row.id}.${f}»`])) }
      : row;
    // source_year carries user-facing words too ("2025 data", "2016
    // estimates", "updated Jan 2026"), so it is D1-backed text and must be
    // stubbed or the detector reports it as hardcoded.
    const usedBenchmarks = benchmarks.map((b) => stubRow(b, ["label", "hint", "citation", "source_year"]));
    const usedPhases = phases.map((p) => stubRow(p, ["name", "note"]));

    const { body, script } = roi.renderRoiPage({
      countries, benchmarks: usedBenchmarks, phases: usedPhases,
      strings: used, fx,
      locked: false, subscribed, signedInAs: "tests@example.com",
    });

    // pageShell()'s order, verbatim: BASE_STYLE first, page style second.
    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${extractBaseStyle()}${roi.ROI_STYLE}</style></head>
<body>
<div class="topbar"><a class="back-link" href="#" style="margin:0;">Back</a></div>
${body}
<script>${script}</script>
</body></html>`;

    mkdirSync(TMP, { recursive: true });
    const file = join(TMP, `roi-${lang}${opts.stubStrings ? "-stub" : ""}.html`);
    writeFileSync(file, html);
    return { file, html, body, script, countries, benchmarks, phases, strings, fx,
             migrations: db.migrations };
  } finally {
    db.close();
  }
}
