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
// The three webfonts are NOT an omission any more. They were until 17
// August 2026, on the reasoning that "fallback fonts do not change
// computed font-size, which is what the contrast thresholds turn on" --
// true of the contrast checks, and false of every width, wrap, overflow
// and min-height check added since. They are now served from
// vendor/fonts over file://, so the harness measures the real faces
// without touching the network. See the block by FACES below.
//
// Known, deliberate omission: renderLangBanner()'s strip, which sits
// above the tool and shares no styles with it.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
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
  const askedLang = opts.lang || "en";
  const subscribed = opts.subscribed || DEFAULT_SUBSCRIBED;
  const db = await openReplayDb();
  try {
    const roi = await import(join(REPO, "shared", "roi-render.mjs"));
    // THE HARNESS RESOLVES THE LANGUAGE THE SAME WAY THE WORKER DOES.
    // It did not, and that is how a half-translated render passed every
    // suite: the fixture asked each getter for `de` directly, which is
    // exactly the call pattern the worker no longer uses. A harness that
    // takes a shortcut the real page cannot take is a harness testing a
    // page nobody loads -- the lesson this whole file exists for.
    const resolved = opts.resolveLang === false
      ? { lang: askedLang, asked: askedLang, fellBack: false }
      : await roi.resolveRoiLang(db.d1, askedLang);
    const lang = resolved.lang;

    // The same five queries handleRoiCalculator runs, through the same
    // exported functions. A hand-written copy of this SQL would be one
    // more thing that can be wrong on its own.
    const [countries, benchmarks, phases, strings, fx] = await Promise.all([
      roi.getRoiCountries(db.d1, opts.today, lang),
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
      strings: used, fx, lang, langAsked: resolved.asked,
      // Both overridable, because the harness has to be able to render
      // the PUBLIC variant as well as the members one. It could not until
      // 19 August 2026, which is part of why the gate went unexamined for
      // a week: every suite built the members shell, where there is no
      // gate to look at.
      // DEFAULTS TO SIGNED IN, which is what most suites want and what
      // `locked: opts.locked === true` used to give them. The name
      // changed and the sense inverted on 20 August when the gate stopped
      // withholding the results — renderRoiPage throws on the old name
      // rather than reading it backwards, so a missed call site here is
      // an error rather than a suite quietly testing the wrong page.
      signedIn: opts.signedIn !== false,
      membersUrl: opts.membersUrl || "",
      subscribed,
    });

    // pageShell()'s order, verbatim: BASE_STYLE first, page style second.
    //
    // Local @font-face for the three families the page shell loads from
    // Google. ALWAYS ON, and offline: the files are in vendor/fonts and
    // the harness reads them from disk, so a page built here renders in
    // the same typefaces a reader gets.
    //
    // Before 17 August 2026 this emitted nothing. Every page the harness
    // built rendered in system fallbacks, so every width, wrap and
    // overflow it measured was measured in SUBSTITUTE METRICS -- the
    // 860px overflow checks, the 37px label min-height, the three-column
    // widths, the finding that a select truncated -- and every one was
    // reported as verified. That is worse than a weak check: it is a
    // check that quietly tests a different document from the one that
    // ships, while reading as evidence.
    //
    // Fetching from Google here was the obvious alternative and is the
    // wrong one. A build that reaches the internet fails on a train, and
    // this sandbox cannot reach fonts.googleapis.com at all -- which is
    // exactly why the gap survived: the one environment that would have
    // shown it up is the one that cannot load the fonts.
    const FONT_DIR = join(REPO, "vendor", "fonts");
    const FACES = [
      ["Big Shoulders Display", 600, "big-shoulders-display-latin-600-normal.woff2"],
      ["Big Shoulders Display", 700, "big-shoulders-display-latin-700-normal.woff2"],
      ["Big Shoulders Display", 800, "big-shoulders-display-latin-800-normal.woff2"],
      ["IBM Plex Sans", 400, "ibm-plex-sans-latin-400-normal.woff2"],
      ["IBM Plex Sans", 500, "ibm-plex-sans-latin-500-normal.woff2"],
      ["IBM Plex Sans", 600, "ibm-plex-sans-latin-600-normal.woff2"],
      ["IBM Plex Sans", 700, "ibm-plex-sans-latin-700-normal.woff2"],
      ["IBM Plex Mono", 400, "ibm-plex-mono-latin-400-normal.woff2"],
      ["IBM Plex Mono", 500, "ibm-plex-mono-latin-500-normal.woff2"],
      ["IBM Plex Mono", 600, "ibm-plex-mono-latin-600-normal.woff2"],
    ];
    // Fail loudly on a missing file. A silent fallback here would put the
    // harness straight back where it was, and the symptom -- slightly
    // different measurements -- is one nobody would question.
    const missingFaces = FACES.filter(([, , f]) => !existsSync(join(FONT_DIR, f)));
    if (missingFaces.length) {
      throw new Error(`vendor/fonts is missing ${missingFaces.length} file(s): `
        + missingFaces.map(([, , f]) => f).join(", ")
        + "\n  The page shell requests these weights; see vendor/fonts/README.md.");
    }
    const LOCAL_FONTS = "<style>" + FACES.map(([fam, wt, f]) =>
      `@font-face{font-family:'${fam}';font-style:normal;font-weight:${wt};font-display:block;`
      + `src:url('file://${join(FONT_DIR, f)}') format('woff2')}`).join("") + "</style>\n";

    // Mocks ALSO carry the production <link>. A mock is opened on someone
    // else's machine, where the file:// paths above resolve to nothing --
    // the network copy is what makes it render correctly there.
    const FONTS = LOCAL_FONTS + (opts.webfonts ? `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
` : "");
    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
${FONTS}<style>${extractBaseStyle()}${roi.ROI_STYLE}</style></head>
<body>
<div class="topbar"><a class="back-link" href="#" style="margin:0;">Back</a></div>
${body}
<script>${script}</script>
</body></html>`;

    mkdirSync(TMP, { recursive: true });
    const file = join(TMP, `roi-${askedLang}${opts.stubStrings ? "-stub" : ""}${opts.webfonts ? "-fonts" : ""}.html`);
    writeFileSync(file, html);
    return { file, html, body, script, countries, benchmarks, phases, strings, fx,
             migrations: db.migrations };
  } finally {
    db.close();
  }
}
