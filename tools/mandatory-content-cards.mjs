#!/usr/bin/env node
// mandatory-content-cards.mjs — give four countries the "Mandatory
// content" spine card they lack.
//
//   node tools/mandatory-content-cards.mjs            # report
//   node tools/mandatory-content-cards.mjs --emit N   # write migrations/N_mandatory_content_cards.sql
//
// France, New Zealand, Norway and Slovakia were each refused by
// tools/respine.mjs for exactly one missing slot, and it was the same slot
// for all four. Nothing on their pages could be promoted into it: what an
// invoice must legally CONTAIN was simply never written for these four, so
// it had to be researched. The card content lives in
// tools/data/mandatory-content-cards.json.
//
// WHAT THE RESEARCH CHANGED, which is the reason for doing it rather than
// summarising what the trackers say:
//
//   FRANCE       the four new mentions are real and are NOT yet in force,
//                but Legifrance's consolidated article shows them under a
//                banner reading "in force since 01/01/2025" -- the
//                commencement rule lives in article 3 of decret 2022-1299,
//                not in the code. Reading the article alone misleads. Also:
//                the amended 1 deg requires the identification number for
//                BOTH parties, not only the buyer, which is how every
//                summary states it.
//   NEW ZEALAND  there is no tax invoice. Since 1 April 2023 the duty is to
//                HOLD taxable supply information, which several records may
//                carry between them, and the buyer's GST number is not an
//                ordinary requirement at all.
//   NORWAY       the content rule is bokforingsforskriften section 5-1-1 and
//                the parties rule 5-1-2; 5-1 is only a sub-chapter heading.
//                And the list is NOT article 226 of the VAT Directive --
//                Norway is outside the EU, so the content comes from
//                bookkeeping law while the FORMAT obligation is EU-derived
//                through the EEA. Most summaries blur that split.
//   SLOVAKIA     the simplified-invoice ceiling on an e-kasa or fuel-pump
//                receipt has been EUR 400 since 1 January 2025, replacing an
//                earlier EUR 1,000 cash / EUR 1,600 card split that is still
//                widely published.
//
// WHERE THE STATUTE COULD NOT BE READ, THE PAGE SAYS SO. legislation.govt.nz
// refused every request, lovdata.no blocks automated access, and slov-lex
// could not serve the consolidated section 74. Those three countries carry a
// note on the page naming the source actually used. That is the fifth rule
// of this project and it belongs to the reader, not to this header.
//
// TWO COUNTRIES ARE AT THE FIVE-CARD CEILING, so the new card displaces
// rather than adds. In both cases the pair being merged was already
// misfiled -- "Exemptions" and "Scope of the 2027 mandate" answer section
// 03's question, not section 02's -- and section 03 is at its own ceiling of
// four for both countries, so moving them there was not available. Merging
// the two is the least-bad move, and the merged card is retitled to describe
// what it now holds rather than inheriting a title that would only cover
// half of it.
//
// The fold is done HERE rather than in SQL because it concatenates two
// arrays of translated rows in four languages, and because the merged note
// is written by a person: two notes glued end to end is not a note.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { openReplayDb } from "../tests/lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const LANGS = ["en", "es", "de", "fr"];
const SEC2_MIN = 3, SEC2_MAX = 5;

// The title is read from the framework document, not restated here, for the
// reason migration 700 taught: a claim and its evidence must not come from
// the same place. Slot 2 is "Mandatory content"; the translations are
// respine's, which is the one place they are defined.
const doc = readFileSync(join(REPO, "DEEP-DIVE-FRAMEWORK.md"), "utf8");
const SPINE_EN = [...(doc.split("## The section-02 spine")[1] || "")
  .matchAll(/^\d+\.\s+\*\*(.+?)\*\*\s*$/gm)].map((m) => m[1]);
if (SPINE_EN.length !== 4) {
  console.error("Could not read a four-title spine from DEEP-DIVE-FRAMEWORK.md");
  process.exit(1);
}
const respine = readFileSync(join(REPO, "tools/respine.mjs"), "utf8");
const TITLE = { en: SPINE_EN[2] };
for (const l of ["es", "de", "fr"]) {
  const m = respine.match(new RegExp(`${l}:\\s*\\[([^\\]]*)\\]`));
  const parts = m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : [];
  if (parts.length !== 4) {
    console.error(`Could not read the ${l} spine titles out of tools/respine.mjs`);
    process.exit(1);
  }
  TITLE[l] = parts[2];
}

const DATA = JSON.parse(readFileSync(join(REPO, "tools/data/mandatory-content-cards.json"), "utf8"));
const FOLD = DATA._folds || {};
const CARDS = Object.fromEntries(
  Object.entries(DATA).filter(([k]) => !k.startsWith("_")));

const { d1 } = await openReplayDb();
const all = async (s) => (await d1.prepare(s).bind().all()).results || [];
const names = Object.keys(CARDS);
const IN = names.map((n) => `'${n.replace(/'/g, "''")}'`).join(",");

const rows = await all(`
  SELECT c.name_en n, d.id cid, d.sort_order so, t.lang, t.title, t.rows_json, t.note
    FROM deep_dive_cards d JOIN deep_dive_card_translations t ON t.card_id = d.id
    JOIN countries c ON c.id = d.country_id
   WHERE c.name_en IN (${IN}) AND d.section = 'file_format' ORDER BY c.name_en, d.sort_order`);

const plan = [];
const problems = [];
for (const name of names) {
  const mine = rows.filter((r) => r.n === name);
  const bySo = new Map();
  for (const r of mine) { if (!bySo.has(r.so)) bySo.set(r.so, {}); bySo.get(r.so)[r.lang] = r; }

  // Idempotence. Re-run against a corpus this tool's own first pass has
  // changed, and without this it would hand every country a second card --
  // the defect tools/archiving-cards.mjs shipped without and had to gain.
  if ([...bySo.values()].some((g) => g.en && g.en.title === TITLE.en)) {
    problems.push(`${name} already has a "${TITLE.en}" card`); continue;
  }
  if (LANGS.some((l) => CARDS[name][l].length !== CARDS[name].en.length)) {
    problems.push(`${name}: row counts disagree across languages on the new card`); continue;
  }

  const fold = FOLD[name];
  let dropSo = null, intoSo = null, merged = null;
  if (fold) {
    for (const [so, g] of bySo) {
      if (g.en && g.en.title === fold.drop) dropSo = so;
      if (g.en && g.en.title === fold.into) intoSo = so;
    }
    // Fold into the title that is THERE, not the one a later migration will
    // give it. tools/identifier-cards.mjs learned this by refusing on
    // Croatia, whose slot-0 card had not yet been renamed.
    if (dropSo === null) { problems.push(`${name}: no card titled "${fold.drop}" to fold away`); continue; }
    if (intoSo === null) { problems.push(`${name}: no card titled "${fold.into}" to fold into`); continue; }
    merged = Object.fromEntries(LANGS.map((l) =>
      [l, JSON.parse(bySo.get(intoSo)[l].rows_json || "[]")
        .concat(JSON.parse(bySo.get(dropSo)[l].rows_json || "[]"))]));
    if (LANGS.some((l) => merged[l].length !== merged.en.length)) {
      problems.push(`${name}: the merged card's row counts disagree across languages`); continue;
    }
  }

  const after = bySo.size + 1 - (fold ? 1 : 0);
  if (after < SEC2_MIN || after > SEC2_MAX) {
    problems.push(`${name}: would end at ${after} cards, framework wants ${SEC2_MIN}-${SEC2_MAX}`); continue;
  }
  plan.push({ name, before: bySo.size, after, dropSo, intoSo, merged,
              nextSo: Math.max(...bySo.keys()) + 1 });
}

for (const p of plan) {
  console.log(`  ${p.name.padEnd(12)} ${p.before} -> ${p.after} cards, new card has ${CARDS[p.name].en.length} rows`
    + (p.dropSo !== null
      ? `  (folded "${FOLD[p.name].drop}" into "${FOLD[p.name].into}" -> "${FOLD[p.name].retitle.en}", `
        + `${p.merged.en.length} rows)` : ""));
}
for (const w of problems) console.log(`  PROBLEM  ${w}`);
if (problems.length) { console.log("\nrefusing to emit"); process.exit(1); }

const i = process.argv.indexOf("--emit");
if (i === -1) { console.log("\n(report only — pass --emit <number>)"); process.exit(0); }

const esc = (s) => s.replace(/'/g, "''");
const lit = (s) => "'" + esc(s) + "'";
const out = []; const w = (s) => out.push(s);
w("-- The Mandatory content spine card for France, New Zealand, Norway and");
w("-- Slovakia. GENERATED by tools/mandatory-content-cards.mjs -- re-run the");
w("-- tool rather than editing this file. Card content, researched from");
w("-- primary sources where they could be read and from the tax authority's");
w("-- own guidance where they could not, is in");
w("-- tools/data/mandatory-content-cards.json.");
w("--");
w("-- New Zealand and Norway were already at the framework's five-card");
w("-- ceiling, so the new card displaces one. Nothing is dropped without its");
w("-- rows moving, and the merged card is retitled to describe what it now");
w("-- holds rather than inheriting a title covering half of it.");
w("");
for (const p of plan) {
  const f = FOLD[p.name];
  w(`-- ---- ${p.name}: ${p.before} -> ${p.after} cards ----`);
  if (p.merged) {
    w(`-- "${f.drop}" folds into "${f.into}", retitled "${f.retitle.en}", `
      + `${p.merged.en.length} rows.`);
    for (const l of LANGS) {
      w(`UPDATE deep_dive_card_translations SET title = ${lit(f.retitle[l])},`
        + ` rows_json = ${lit(JSON.stringify(p.merged[l]))}, note = ${lit(f.note[l])}`
        + ` WHERE lang = '${l}' AND card_id = (SELECT d.id FROM deep_dive_cards d`
        + ` JOIN countries c ON c.id = d.country_id WHERE c.name_en = ${lit(p.name)}`
        + ` AND d.section = 'file_format' AND d.sort_order = ${p.intoSo});`);
    }
    w(`DELETE FROM deep_dive_card_translations WHERE card_id IN (SELECT d.id FROM deep_dive_cards d`
      + ` JOIN countries c ON c.id = d.country_id WHERE c.name_en = ${lit(p.name)}`
      + ` AND d.section = 'file_format' AND d.sort_order = ${p.dropSo});`);
    w(`DELETE FROM deep_dive_cards WHERE section = 'file_format'`
      + ` AND country_id = (SELECT id FROM countries WHERE name_en = ${lit(p.name)})`
      + ` AND sort_order = ${p.dropSo};`);
  }
  w(`INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'file_format', ${p.nextSo}`
    + ` FROM countries WHERE name_en = ${lit(p.name)};`);
  for (const l of LANGS) {
    w("INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note)");
    w(`SELECT d.id, '${l}', ${lit(TITLE[l])}, ${lit(JSON.stringify(CARDS[p.name][l]))},`
      + ` ${lit(CARDS[p.name].note[l])}`
      + ` FROM deep_dive_cards d WHERE d.country_id = (SELECT id FROM countries WHERE name_en = ${lit(p.name)})`
      + ` AND d.section = 'file_format' AND d.sort_order = ${p.nextSo};`);
  }
  w("");
}
w("-- ---- what this migration claims it did ----");
for (const p of plan) {
  w(`-- ASSERT: SELECT count(*) FROM deep_dive_cards WHERE section = 'file_format'`
    + ` AND country_id = (SELECT id FROM countries WHERE name_en = ${lit(p.name)}) = ${p.after}`);
  w(`-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id`
    + ` WHERE d.country_id = (SELECT id FROM countries WHERE name_en = ${lit(p.name)})`
    + ` AND d.section = 'file_format' AND t.title = ${lit(TITLE.en)} = 1`);
  w(`-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id`
    + ` WHERE d.country_id = (SELECT id FROM countries WHERE name_en = ${lit(p.name)})`
    + ` AND d.section = 'file_format' AND d.sort_order = ${p.nextSo} = 4`);
}
w("-- The folded cards are gone, and the merged card carries both halves.");
for (const [c, f] of Object.entries(FOLD)) {
  const p = plan.find((x) => x.name === c);
  if (!p) continue;
  w(`-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id`
    + ` JOIN countries co ON co.id = d.country_id WHERE co.name_en = ${lit(c)}`
    + ` AND d.section = 'file_format' AND t.title = ${lit(f.drop)} = 0`);
  w(`-- ASSERT: SELECT json_array_length(t.rows_json) FROM deep_dive_card_translations t`
    + ` JOIN deep_dive_cards d ON d.id = t.card_id JOIN countries co ON co.id = d.country_id`
    + ` WHERE co.name_en = ${lit(c)} AND d.section = 'file_format' AND t.lang = 'en'`
    + ` AND t.title = ${lit(f.retitle.en)} = ${p.merged.en.length}`);
}
w("-- No card left without rows, and no translation left without a card.");
w(`-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id`
  + ` JOIN countries c ON c.id = d.country_id WHERE c.name_en IN (${IN}) AND d.section = 'file_format'`
  + ` AND (t.rows_json IS NULL OR json_array_length(t.rows_json) = 0) = 0`);
w("-- ASSERT ALWAYS: SELECT count(*) FROM deep_dive_card_translations t"
  + " WHERE NOT EXISTS (SELECT 1 FROM deep_dive_cards d WHERE d.id = t.card_id) = 0");
writeFileSync(join(REPO, "members-worker", "migrations", `${process.argv[i + 1]}_mandatory_content_cards.sql`),
  out.join("\n") + "\n");
console.log(`\nwrote ${process.argv[i + 1]}_mandatory_content_cards.sql`);
process.exit(0);
