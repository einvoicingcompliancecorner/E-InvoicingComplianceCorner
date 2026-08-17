#!/usr/bin/env node
// roi-i18n.mjs — the ROI planner's text really comes from D1.
//
//   node tests/roi-i18n.mjs
//
// `t(key, "English")` falls back to the English at the use site if the D1
// row is missing. That is the right behaviour for a reader — a missing
// row degrades to English rather than to a blank page — and exactly the
// wrong behaviour for us, because it fails silently. Migration 505 seeded
// 31 of these keys in August 2026 and nothing read them for a week; the
// page looked perfect throughout.
//
// So the fallback is a safety net and never the thing actually
// rendering, and this is what holds that line:
//
//   1. every key the renderer asks for exists in D1
//   2. every D1 value is character-identical to the fallback beside it,
//      so the two cannot drift into disagreeing about the English
//   3. the strings are genuinely reaching the page — proved by rendering
//      with sentinel values and watching the English disappear
//
// (3) is the one that catches a key being defined, translated, and then
// quietly not used — the failure that (1) and (2) both pass.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { openReplayDb, REPO } from "./lib/replay-db.mjs";
import { suite } from "./lib/browser.mjs";

const t = suite("ROI i18n");
const SRC = join(REPO, "shared", "roi-render.mjs");

/** Every t()/tj() call site: key -> the English fallback beside it. */
const clashes = [];
function callSites() {
  const src = readFileSync(SRC, "utf8");
  const pat = /\bt(j?)\("([a-zA-Z0-9._]+)",\s*"/g;
  const out = new Map();
  let m;
  while ((m = pat.exec(src))) {
    let i = pat.lastIndex, buf = "";
    while (i < src.length) {
      if (src[i] === "\\") { buf += src.slice(i, i + 2); i += 2; continue; }
      if (src[i] === '"') break;
      buf += src[i]; i++;
    }
    const value = buf.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    // TWO CALL SITES, ONE KEY, DIFFERENT ENGLISH is how migration 551
    // shipped a chart label reading "Procurement is your critical path,
    // not delivery." Its INSERT OR IGNORE declined against a key that
    // already existed, and this map silently kept whichever fallback came
    // last — which happened to match D1, so the character-identical check
    // passed while the page rendered the wrong sentence. Collisions are
    // now recorded rather than overwritten.
    if (out.has(m[2]) && out.get(m[2]) !== value) clashes.push(m[2]);
    out.set(m[2], value);
  }
  return out;
}

const db = await openReplayDb();
try {
  const sites = callSites();
  t.check(`the renderer asks for a real number of strings (${sites.size})`, sites.size >= 85, sites.size);
  t.check("no key is used twice with different English",
    clashes.length === 0,
    clashes.length ? `${[...new Set(clashes)].join(", ")}\n    One key cannot hold two strings: D1 stores one value and both `
      + `sites render it.` : "");

  const rows = await db.query("SELECT key, value FROM translations WHERE namespace = 'roi' AND lang = 'en'");
  const d1 = new Map(rows.map((r) => [r.key, r.value]));

  // 1. no silent fallbacks
  const missing = [...sites.keys()].filter((k) => !d1.has(k));
  t.check(`every key used by the renderer exists in D1 (${sites.size} keys)`,
    missing.length === 0, missing.slice(0, 6));

  // 2. D1 and the code agree on the English, character for character
  const drifted = [...sites.entries()]
    .filter(([k, fb]) => d1.has(k) && d1.get(k) !== fb)
    .map(([k, fb]) => `${k}\n      code: ${fb.slice(0, 90)}\n      D1:   ${String(d1.get(k)).slice(0, 90)}`);
  t.check("D1 and the inline fallbacks are character-identical",
    drifted.length === 0, "\n    " + drifted.slice(0, 3).join("\n    "));

  // 3. the strings actually reach the page
  // Render once normally and once with every key replaced by a sentinel.
  // Anything that survives unchanged is hardcoded, whatever the code
  // looks like. Sampled across every section rather than exhaustively,
  // because markup, numbers and country names legitimately do not move.
  const roi = await import(SRC);
  const [countries, benchmarks, phases, fx] = await Promise.all([
    roi.getRoiCountries(db.d1), roi.getRoiBenchmarks(db.d1, "en"),
    roi.getRoiPhases(db.d1, "en"), roi.getRoiFxRates(db.d1)]);
  const sentinel = Object.fromEntries([...sites.keys()].map((k) => [k, `«${k}»`]));
  const render = (strings) => {
    const r = roi.renderRoiPage({ countries, benchmarks, phases, strings, fx,
      locked: false, subscribed: [], signedInAs: "t@example.com" });
    return r.body + r.script;
  };
  const real = render(Object.fromEntries(d1));
  const stubbed = render(sentinel);

  const SAMPLE = [
    ["page title", "Wave Planner"],
    ["page lede", "board-ready business case"],
    ["an input label", "Invoices received / year (AP)"],
    ["a scope option", "meet the mandates (what most programmes do)"],
    ["an assumptions heading", "Implementation &mdash; weeks"],
    ["the placeholder warning", "placeholders only"],
    ["the paywall gate", "Your results are ready"],
    ["a results heading", "Assumptions, sources and caveats"],
    ["a step chip", "Move go-live dates"],
    ["the savings lede", "named below the total"],
    ["a savings group label", "Named, not priced"],
    ["a savings column heading", "Saved on this scope"],
    ["a row tag, newly translatable", "not saved"],
    ["a runtime stat label", "Jurisdictions with a dated deadline ahead"],
    ["a notes-panel card", "The same saving, counted in people"],
    ["an evidence card", "credible body, unattributed"],
    ["the footer", "not tax, legal or investment advice"],
  ];
  const stillHardcoded = SAMPLE.filter(([, phrase]) => stubbed.includes(phrase));
  t.check(`all ${SAMPLE.length} sampled strings come from D1, not from the template`,
    stillHardcoded.length === 0, stillHardcoded.map(([what]) => what).join(", "));
  t.check("the sample is real — every phrase is present in the normal render",
    SAMPLE.every(([, phrase]) => real.includes(phrase)),
    SAMPLE.filter(([, p]) => !real.includes(p)).map(([w]) => w).join(", "));

  // 4. unused rows. This REPORTED and never failed until 15 Aug 2026, on
  // the reasoning that a key nothing renders is usually a string the page
  // will want later, and deleting content to make a number come out round
  // is how you lose it. That was right while the list was long and the
  // answer to each row was judgement.
  //
  // It is wrong now. Migration 545 swept the list to zero, and the sweep
  // found that three of the thirty-three "unused" rows were not dead at
  // all — the renderer was hardcoding their English. A report nobody has
  // to act on would have hidden that for another month. Keeping the list
  // empty costs nothing, and a new orphan is now a signal at the moment
  // it appears.
  //
  // A key genuinely worth keeping unused is a decision, so make it one:
  // add it to KEPT with the reason. That is friction on purpose — the
  // same shape as the hand-maintained grade-A allowlist in migration 525,
  // which has caught its own author three times.
  const KEPT = new Set([
    // (empty — every roi key is currently rendered)
  ]);
  const helpIds = new Set([...readFileSync(SRC, "utf8")
    .matchAll(/\bhlp\(\s*['"]([a-zA-Z0-9._]+)['"]/g)].map((m) => m[1]));
  const unused = [...d1.keys()].filter((k) => !KEPT.has(k)
    && (k.startsWith("help.") ? !helpIds.has(k.slice(5)) : !sites.has(k)));
  t.check(`no D1 key is left unrendered (${d1.size} keys, ${KEPT.size} kept by decision)`,
    unused.length === 0,
    unused.length ? `${unused.length} unused: ${unused.join(", ")}`
      + "\n    Either wire it up, delete it in a migration, or add it to KEPT with a reason." : "");

  // 5. and the help layer, which was already wired, still is
  const helpKeys = [...d1.keys()].filter((k) => k.startsWith("help."));
  t.check(`the help layer still has its rows (${helpKeys.length})`, helpKeys.length >= 20, helpKeys.length);

  // 6. THE REVERSE, which nothing asked until 16 Aug 2026. Check (4)
  // above asks whether every help row is rendered. Nothing asked whether
  // every hlp() call site HAS a row — and hlp() renders nothing at all
  // when the text is missing, no icon and no error. Migration 557 added
  // the e-invoice share input, called it "the single largest lever on the
  // processing-cost row" in its own comment, wired hlp("eShare") into the
  // label, and never wrote the row. It shipped and was deployed.
  //
  // Same asymmetry the eighth and ninth suites closed for strings, in the
  // help layer: one direction covered, the other not, and the gap in the
  // SHAPE of the coverage rather than in any single check.
  //
  // The phase inputs are the documented exception — their text comes from
  // roi_phases.note through PHASE_INPUT, not from a help.% row.
  const PHASE_IDS = new Set(["wMob", "wDes", "wBld", "wUat", "wChg", "wVen", "wCon"]);
  const noRow = [...helpIds].filter((id) => !PHASE_IDS.has(id) && !d1.has("help." + id));
  t.check(`every hlp() call site has text behind it (${helpIds.size} sites)`,
    noRow.length === 0,
    noRow.length ? `${noRow.join(", ")}\n    hlp() renders NOTHING when the row is missing — no icon, no error.`
      : "");

  // 7. help is the one string channel that is escaped rather than
  // rendered, so an HTML entity reaches the reader as its source text.
  // Two rows shipped with a literal "&mdash;" before anyone looked.
  const entity = helpKeys.filter((k) => /&[a-z]+;|&#\d+;/i.test(String(d1.get(k))));
  t.check("no help row contains an HTML entity, which would render literally",
    entity.length === 0,
    entity.map((k) => `${k}: ${(String(d1.get(k)).match(/&[a-z]+;/gi) || []).join(" ")}`).join(", "));

  // 8. THE PAGE SURVIVES A TRANSLATION WITH QUOTES IN IT.
  //
  // Every check above this line is about English. On 17 August 2026 this
  // renderer could not have survived its first French string, and all
  // seven passed throughout:
  //
  //   tj() escaped the backtick and ${ -- which would end a template
  //   literal -- and not the apostrophe. 89 call sites embed its result
  //   inside a SINGLE-QUOTED JavaScript string, so one apostrophe closed
  //   the literal and the client script failed to parse. No calculator,
  //   no chart, no PDF, no guards, on a page that still rendered.
  //
  //   esc() escaped & < > and not the double quote, and hlp() writes its
  //   result into aria-label="...". A German help row quoting a term
  //   inline terminated the attribute and turned the rest of the sentence
  //   into stray attributes -- silently, with nothing visible on screen.
  //
  // English never tripped either. The convention is &rsquo;, unwritten and
  // unenforced, and English copy rarely quotes inline. Both defects were
  // therefore invisible until the moment they would have been
  // catastrophic, which is the shape worth testing rather than the two
  // characters.
  //
  // So: replace EVERY string with a value carrying both quote characters
  // in the shapes the target languages actually produce, render, and ask
  // whether the client script still parses and the attributes still close.
  const HOSTILE = "l'operation d'un \"Sollwert\" n'est-ce pas 'x' \"y\"";
  const hostileStrings = Object.fromEntries([...sites.keys()].map((k) => [k, HOSTILE]));
  const hostileRender = roi.renderRoiPage({ countries, benchmarks, phases,
    strings: hostileStrings, fx, locked: false, subscribed: [], signedInAs: "t@example.com" });
  let parsed = "ok";
  try { new Function(hostileRender.script); } catch (err) { parsed = err.message; }
  t.check("a translation containing apostrophes does not break the client script",
    parsed === "ok", parsed);

  // The attribute half. A raw double quote inside aria-label ends the
  // attribute, so the damage is visible as the hostile text appearing
  // OUTSIDE any quoted value -- i.e. between the closing quote and the >.
  const brokenAttr = /aria-label="[^"]*"[^>]*Sollwert/.test(hostileRender.body);
  t.check("and does not break out of an HTML attribute",
    !brokenAttr,
    brokenAttr ? "aria-label terminated early by a quote in the translated value" : "");
} finally {
  db.close();
}

process.exit(t.report() ? 0 : 1);
