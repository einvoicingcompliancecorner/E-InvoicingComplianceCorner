#!/usr/bin/env node
// identifier-cards.mjs — give four countries the "Identifiers &
// registration" spine card they lack.
//
//   node tools/identifier-cards.mjs            # report
//   node tools/identifier-cards.mjs --emit N   # write migrations/N_identifier_cards.sql
//
// Croatia, Malaysia, Poland and Romania were each refused by
// tools/respine.mjs for exactly one missing slot. Unlike the two Archiving
// batches this could NOT be filled by promotion: Poland and Croatia had a
// single identifier row each and nothing more, and a one-row card reads as
// broken. So the facts were researched from primary sources first and the
// card content lives in tools/data/identifier-cards.json.
//
// WHAT THE RESEARCH CHANGED, which is why it was worth doing rather than
// writing down what the trackers say:
//
//   POLAND    "no registration needed for KSeF" is incomplete. There is no
//             register to join, but a non-natural person whose qualified
//             seal does not carry its NIP must file ZAW-FA to name its
//             first authorised person. And the KSeF certificate is issued
//             to TAXPAYERS for authentication and offline invoicing; it
//             certifies no software, which vendor pages blur.
//   ROMANIA   the SPV precondition does NOT come from OUG 120/2021. The
//             ordinance was read in full and never mentions Spatiul Privat
//             Virtual; the requirement is in the implementing procedure,
//             OMF 1365/2021.
//   CROATIA   it is not "Peppol-based". It borrows Peppol's identifier
//             scheme 9934 and an AS4 profile but exchanges over a NATIONAL
//             network with its own address metadata service run by the Tax
//             Administration. That changes who you can route through.
//   MALAYSIA  accreditation is a split answer. The tax authority accredits
//             nothing, so a portal or direct-API submitter needs no
//             approved vendor; MDEC accredits only for the Peppol route.
//
// TWO COUNTRIES ARE AT THE FIVE-CARD CEILING, so the new card displaces
// rather than adds, and nothing is dropped without its rows moving:
//
//   Croatia   "Signatures" folds into "Format & standard", where its rows
//             belong -- they say WHERE the signature sits (the SOAP
//             envelope, not the invoice XML), which is a fact about the
//             format.
//   Malaysia  "Peppol as a separate track" is absorbed by the new card,
//             the Peppol route being the only one with an
//             accredited-provider requirement. Its rows are appended.
//
// The fold is done HERE rather than in SQL because it concatenates two
// arrays of translated rows in four languages; expressing that as a
// json_each union was unreadable and would have been unreviewable.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { openReplayDb } from "../tests/lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const LANGS = ["en", "es", "de", "fr"];
const SEC2_MIN = 3, SEC2_MAX = 5;
const TITLE = { en: "Identifiers & registration", es: "Identificadores y registro",
                de: "Kennungen und Registrierung", fr: "Identifiants et enregistrement" };
const CARDS = JSON.parse(readFileSync(join(REPO, "tools/data/identifier-cards.json"), "utf8"));
const FOLD = {
  // Croatia's slot-0 card is still titled in its own words -- the spine
  // rename has not reached it. Fold into the title that is there, not the
  // one it will have; a tool that assumes a later migration has run is a
  // tool that works once.
  Croatia:  { drop: "Signatures", into: "Syntax & standard" },
  Malaysia: { drop: "Peppol as a separate track", into: null },   // into the new card
};

const { d1 } = await openReplayDb();
const all = async (s) => (await d1.prepare(s).bind().all()).results || [];
const names = Object.keys(CARDS);
const IN = names.map((n) => `'${n.replace(/'/g, "''")}'`).join(",");

const rows = await all(`
  SELECT c.name_en n, d.id cid, d.sort_order so, t.lang, t.title, t.rows_json
    FROM deep_dive_cards d JOIN deep_dive_card_translations t ON t.card_id = d.id
    JOIN countries c ON c.id = d.country_id
   WHERE c.name_en IN (${IN}) AND d.section = 'file_format' ORDER BY c.name_en, d.sort_order`);

const plan = [];
const problems = [];
for (const name of names) {
  const mine = rows.filter((r) => r.n === name);
  const bySo = new Map();
  for (const r of mine) { if (!bySo.has(r.so)) bySo.set(r.so, {}); bySo.get(r.so)[r.lang] = r; }
  if ([...bySo.values()].some((g) => g.en && g.en.title === TITLE.en)) {
    problems.push(`${name} already has an "${TITLE.en}" card`); continue;
  }
  const fold = FOLD[name];
  let dropSo = null, mergedInto = null, merged = null;
  if (fold) {
    for (const [so, g] of bySo) if (g.en && g.en.title === fold.drop) dropSo = so;
    if (dropSo === null) { problems.push(`${name}: no card titled "${fold.drop}" to fold`); continue; }
    const dropRows = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(bySo.get(dropSo)[l].rows_json || "[]")]));
    if (fold.into) {
      for (const [so, g] of bySo) if (g.en && g.en.title === fold.into) mergedInto = so;
      if (mergedInto === null) { problems.push(`${name}: no card titled "${fold.into}" to fold into`); continue; }
      merged = Object.fromEntries(LANGS.map((l) =>
        [l, JSON.parse(bySo.get(mergedInto)[l].rows_json || "[]").concat(dropRows[l])]));
    } else {
      // Absorbed by the NEW card: its rows are appended to the researched ones.
      for (const l of LANGS) CARDS[name][l] = CARDS[name][l].concat(dropRows[l]);
    }
  }
  const after = bySo.size + 1 - (fold ? 1 : 0);
  if (after < SEC2_MIN || after > SEC2_MAX) {
    problems.push(`${name}: would end at ${after} cards, framework wants ${SEC2_MIN}-${SEC2_MAX}`); continue;
  }
  if (LANGS.some((l) => CARDS[name][l].length !== CARDS[name].en.length)) {
    problems.push(`${name}: row counts disagree across languages on the new card`); continue;
  }
  plan.push({ name, before: bySo.size, after, dropSo, mergedInto, merged,
              nextSo: Math.max(...bySo.keys()) + 1 });
}

for (const p of plan) {
  console.log(`  ${p.name.padEnd(10)} ${p.before} -> ${p.after} cards, new card has `
    + `${CARDS[p.name].en.length} rows`
    + (p.dropSo !== null ? `  (folded away card ${p.dropSo}${p.merged ? ` into ${p.mergedInto}` : ", absorbed"})` : ""));
}
for (const w of problems) console.log(`  PROBLEM  ${w}`);
if (problems.length) { console.log("\nrefusing to emit"); process.exit(1); }

const i = process.argv.indexOf("--emit");
if (i === -1) { console.log("\n(report only — pass --emit <number>)"); process.exit(0); }

const esc = (s) => s.replace(/'/g, "''");
const lit = (s) => "'" + esc(s) + "'";
const out = []; const w = (s) => out.push(s);
w("-- The Identifiers & registration spine card for Croatia, Malaysia,");
w("-- Poland and Romania. GENERATED by tools/identifier-cards.mjs -- re-run");
w("-- the tool rather than editing this file. Card content, researched from");
w("-- primary sources, is in tools/data/identifier-cards.json.");
w("--");
w("-- Croatia and Malaysia were already at the framework's five-card");
w("-- ceiling, so the new card displaces one. Nothing is dropped without");
w("-- its rows moving: Croatia's \"Signatures\" rows are appended to");
w("-- \"Format & standard\", Malaysia's \"Peppol as a separate track\" rows");
w("-- are appended to the new card.");
w("");
for (const p of plan) {
  w(`-- ---- ${p.name}: ${p.before} -> ${p.after} cards ----`);
  if (p.merged) {
    for (const l of LANGS) {
      w(`UPDATE deep_dive_card_translations SET rows_json = ${lit(JSON.stringify(p.merged[l]))}`
        + ` WHERE lang = '${l}' AND card_id = (SELECT d.id FROM deep_dive_cards d`
        + ` JOIN countries c ON c.id = d.country_id WHERE c.name_en = ${lit(p.name)}`
        + ` AND d.section = 'file_format' AND d.sort_order = ${p.mergedInto});`);
    }
  }
  if (p.dropSo !== null) {
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
    w("INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json)");
    w(`SELECT d.id, '${l}', ${lit(TITLE[l])}, ${lit(JSON.stringify(CARDS[p.name][l]))}`
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
    + ` AND d.section = 'file_format' AND t.lang = 'en' AND t.title = ${lit(TITLE.en)} = 1`);
}
w("-- The folded cards are gone, and their rows survived the move.");
for (const [c, f] of Object.entries(FOLD)) {
  w(`-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id`
    + ` JOIN countries co ON co.id = d.country_id WHERE co.name_en = ${lit(c)}`
    + ` AND d.section = 'file_format' AND t.title = ${lit(f.drop)} = 0`);
}
w("-- No card left without rows, and no translation left without a card.");
w(`-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id`
  + ` JOIN countries c ON c.id = d.country_id WHERE c.name_en IN (${IN}) AND d.section = 'file_format'`
  + ` AND (t.rows_json IS NULL OR json_array_length(t.rows_json) = 0) = 0`);
w("-- ASSERT ALWAYS: SELECT count(*) FROM deep_dive_card_translations t"
  + " WHERE NOT EXISTS (SELECT 1 FROM deep_dive_cards d WHERE d.id = t.card_id) = 0");
writeFileSync(join(REPO, "members-worker", "migrations", `${process.argv[i + 1]}_identifier_cards.sql`),
  out.join("\n") + "\n");
console.log(`\nwrote ${process.argv[i + 1]}_identifier_cards.sql`);
process.exit(0);
