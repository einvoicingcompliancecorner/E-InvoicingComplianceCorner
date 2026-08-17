#!/usr/bin/env node
// roi-coverage.mjs — how far each language actually is.
//
//   node tests/roi-coverage.mjs            report, and fail on a regression
//   node tests/roi-coverage.mjs --report   report only, always exit 0
//
// WHY THIS EXISTS. Until 17 August 2026 nothing anywhere computed "French
// is 78% done". That is not a reporting gap, it is a correctness one,
// because of how partial translation degrades:
//
//   getRoiStrings COALESCEs PER KEY. getRoiBenchmarks and getRoiPhases
//   COALESCE PER COLUMN. So a language with 300 of 400 rows renders a
//   page that WORKS -- and mixes languages inside a single field group,
//   a French label above an English hint, with nothing on the page and
//   nothing in the build to say so.
//
// A missing translation is invisible by design: falling back to English
// is the right behaviour for the reader and the wrong behaviour for the
// person who has to know whether the job is finished. This file is the
// other half of that trade.
//
// It reports on THREE TABLES, because a language is not done when
// `translations` is done. Benchmarks carry labels, hints and citations;
// phases carry names and notes. Both are user-facing, both are per
// column, and both are easy to forget precisely because the big table is
// the one everyone looks at.
import { openReplayDb } from "./lib/replay-db.mjs";
import { suite } from "./lib/browser.mjs";

const t = suite("ROI translation coverage");
const REPORT_ONLY = process.argv.includes("--report");
const db = await openReplayDb();

try {
  const q = (sql) => db.query(sql);

  // English is the reference set. Every other language is measured
  // against what English actually has, not against a remembered total --
  // the count moves every time a migration adds a string, and a coverage
  // figure measured against a stale denominator is worse than none.
  const enKeys = (await q(
    "SELECT key FROM translations WHERE namespace = 'roi' AND lang = 'en'")).map((r) => r.key);
  const langs = (await q(
    "SELECT DISTINCT lang FROM translations WHERE namespace = 'roi' ORDER BY lang")).map((r) => r.lang);

  // The other two tables, measured per COLUMN because that is how they
  // fall back. A row that exists with a translated label and a NULL hint
  // is not a translated row.
  const benchCols = ["label", "hint", "citation"];
  const phaseCols = ["name", "note"];
  const cellCount = async (table, idCol, cols, lang) => {
    const rows = await q(`SELECT ${cols.join(", ")} FROM ${table} WHERE lang = '${lang}'`);
    let filled = 0;
    for (const r of rows) for (const c of cols) if (r[c] !== null && String(r[c]).trim() !== "") filled++;
    return filled;
  };
  const benchEn = await cellCount("roi_benchmark_translations", "benchmark_id", benchCols, "en");
  const phaseEn = await cellCount("roi_phase_translations", "phase_id", phaseCols, "en");

  // country_translations is deliberately NOT in the percentage. It is
  // shared with the rest of the site, it is already at four-language
  // parity, and folding it in would flatter the ROI figure with work
  // somebody else finished. It is reported separately.
  const countryLangs = await q(
    "SELECT lang, count(*) n FROM country_translations GROUP BY lang ORDER BY lang");

  const report = [];
  for (const lang of langs) {
    const have = new Set((await q(
      `SELECT key FROM translations WHERE namespace = 'roi' AND lang = '${lang}'`)).map((r) => r.key));
    const strings = enKeys.filter((k) => have.has(k)).length;
    const bench = await cellCount("roi_benchmark_translations", "benchmark_id", benchCols, lang);
    const phase = await cellCount("roi_phase_translations", "phase_id", phaseCols, lang);
    const total = enKeys.length + benchEn + phaseEn;
    const done = strings + bench + phase;
    const pct = total ? Math.round((done / total) * 1000) / 10 : 0;
    report.push({ lang, strings, bench, phase, done, total, pct });
  }

  console.log("\n  language   strings        benchmarks   phases    overall");
  console.log("  ---------------------------------------------------------");
  for (const r of report) {
    console.log(`  ${r.lang.padEnd(10)} ${String(r.strings).padStart(3)}/${String(enKeys.length).padEnd(4)}`
      + `      ${String(r.bench).padStart(2)}/${String(benchEn).padEnd(3)}`
      + `        ${String(r.phase).padStart(2)}/${String(phaseEn).padEnd(3)}`
      + `      ${String(r.pct).padStart(5)}%`);
  }
  console.log("\n  country names (shared with the rest of the site, not counted above):");
  console.log("    " + countryLangs.map((c) => `${c.lang} ${c.n}`).join(" · "));

  // ---- what actually fails ------------------------------------------
  //
  // NOT "every language must be 100%". A language is loaded over days and
  // a suite that goes red the moment translation starts is a suite people
  // switch off. What fails is a language that is PARTIALLY loaded and
  // then stops being worked on -- and the only honest line between those
  // two is a threshold plus a deliberate exemption.
  //
  // The rule: once a language is past 20% it is a language this site
  // offers, and it must reach 100% or be listed here as in progress.
  const IN_PROGRESS = new Set([
    // Add a language code here while it is being translated, and take it
    // out when it is done. An entry that outlives its work is exactly the
    // kind of stale exemption this project keeps finding, so the check
    // below also fails on an entry that is already complete.
  ]);

  const started = report.filter((r) => r.lang !== "en" && r.pct >= 20);
  const stalled = started.filter((r) => r.pct < 100 && !IN_PROGRESS.has(r.lang));
  t.check("no language is stranded part-translated",
    stalled.length === 0,
    stalled.map((r) => `${r.lang} at ${r.pct}% — finish it, or add it to IN_PROGRESS`).join(", "));

  const staleExempt = [...IN_PROGRESS].filter((c) => {
    const r = report.find((x) => x.lang === c);
    return !r || r.pct >= 100;
  });
  t.check("no stale IN_PROGRESS entry",
    staleExempt.length === 0,
    staleExempt.map((c) => `${c} is finished (or absent) and still listed`).join(", "));

  // English is the reference and must be whole in all three tables, or
  // every percentage above is measured against a hole.
  const en = report.find((r) => r.lang === "en");
  t.check(`English is complete in all three tables (${enKeys.length} + ${benchEn} + ${phaseEn})`,
    !!en && en.pct === 100, en && en.pct);

  // The three ROI tables must agree about which languages exist. A
  // language with strings and no benchmark labels renders a French page
  // with English money labels -- the per-column fallback at work, and
  // invisible without this line.
  const stringLangs = new Set(langs);
  const otherLangs = new Set([
    ...(await q("SELECT DISTINCT lang FROM roi_benchmark_translations")).map((r) => r.lang),
    ...(await q("SELECT DISTINCT lang FROM roi_phase_translations")).map((r) => r.lang),
  ]);
  const lopsided = [...stringLangs].filter((l) => !otherLangs.has(l))
    .concat([...otherLangs].filter((l) => !stringLangs.has(l)));
  t.check("the three ROI tables carry the same set of languages",
    lopsided.length === 0,
    lopsided.length ? `${lopsided.join(", ")} is in one table and not the others` : "");
} finally {
  db.close();
}

if (REPORT_ONLY) { t.report(); process.exit(0); }
process.exit(t.report() ? 0 : 1);
