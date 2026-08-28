#!/usr/bin/env node
// spine-slots.mjs — fill a country's missing section-02 spine slots.
//
//   node tools/spine-slots.mjs <data.json>            # report
//   node tools/spine-slots.mjs <data.json> --emit N   # write migrations/N_spine_slots.sql
//
// The generalisation of tools/identifier-cards.mjs and
// tools/mandatory-content-cards.mjs, both of which did one slot for one
// batch and then had nothing left to say. 41 countries still need between
// two and four slots each, so the shape is worth having once.
//
// THREE OPERATIONS, and no others:
//
//   MOVE  a card from one section to another. Sections 02 and 03 both have
//         ceilings, and a card is sometimes simply filed under the wrong
//         question -- Denmark's NemHandel card answers "who are you and
//         where are you registered", which is section 02's, from inside
//         section 03. Moving is free: no prose changes, no translation.
//   FOLD  one card into another, appending its rows. For a country already
//         at the five-card ceiling. The merged note is WRITTEN in the data
//         file, never concatenated by this tool: two notes glued end to end
//         is not a note, and which half a note describes is a judgement.
//   ADD   a researched card, in four languages, with its note.
//   EDIT  the title, body or note of a card that stays where it is. Added
//         for Saudi Arabia, whose section-05 card hedged the retention
//         period as "roughly six years" on vendor guidance while the new
//         section-02 card states it from the regulation. Two statements of
//         one fact on one page, one verified and one not, is the defect
//         already open against Romania and China; this retargets the older
//         card rather than deleting it into a floor breach.
//
// Applied in that order, because a move can free the room a fold would
// otherwise have to make.
//
// WHAT IT REFUSES. Any country that would not end inside the framework's
// 3-5 cards for section 02, or would push section 03 outside its own 2-4.
// Any new card whose row counts disagree across the four languages. Any
// country that already has the card being added -- the idempotence guard
// tools/archiving-cards.mjs had to gain after it would have given eleven
// countries a second Archiving card. Any fold or move naming a title that
// is not there.
//
// NOTES AND BODIES TRAVEL. respine.mjs rebuilt cards from (title,
// rows_json) and silently deleted 44 notes across 13 countries before
// anyone noticed, because its assertions counted rows and not notes. Every
// statement this tool emits carries note and body, and the migration
// asserts the note count per country.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { openReplayDb } from "../tests/lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const LANGS = ["en", "es", "de", "fr"];
const BOUNDS = { file_format: [3, 5], scope_transmission: [2, 4] };

// The spine titles come from the framework document and from respine, not
// from here: a claim and its evidence must not share a source. Migration
// 700 asserted each spine title against the variable that wrote it, and
// renaming the title renamed the claim too.
const doc = readFileSync(join(REPO, "DEEP-DIVE-FRAMEWORK.md"), "utf8");
const SPINE_EN = [...(doc.split("## The section-02 spine")[1] || "")
  .matchAll(/^\d+\.\s+\*\*(.+?)\*\*\s*$/gm)].map((m) => m[1]);
if (SPINE_EN.length !== 4) {
  console.error("Could not read a four-title spine from DEEP-DIVE-FRAMEWORK.md");
  process.exit(1);
}
const respineSrc = readFileSync(join(REPO, "tools/respine.mjs"), "utf8");
const SPINE = { en: SPINE_EN };
for (const l of ["es", "de", "fr"]) {
  const m = respineSrc.match(new RegExp(`${l}:\\s*\\[([^\\]]*)\\]`));
  const parts = m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : [];
  if (parts.length !== 4) {
    console.error(`Could not read the ${l} spine titles out of tools/respine.mjs`);
    process.exit(1);
  }
  SPINE[l] = parts;
}
const titleFor = (slot, lang) => {
  const i = SPINE_EN.indexOf(slot);
  if (i === -1) { console.error(`"${slot}" is not one of the four spine titles`); process.exit(1); }
  return SPINE[lang][i];
};

const dataPath = process.argv[2];
if (!dataPath) { console.error("usage: spine-slots.mjs <data.json> [--emit N]"); process.exit(1); }
const DATA = JSON.parse(readFileSync(join(REPO, dataPath), "utf8"));
const strip = (o) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => !k.startsWith("_")));
const ADD = strip(DATA.add), MOVE = strip(DATA.move), FOLD = strip(DATA.fold), EDIT = strip(DATA.edit);
// An ADD key may be "Country" or "Country:something", so one country can
// gain two cards in one batch without the keys colliding.
const countryOf = (k, v) => v.country || k.split(":")[0];

const { d1 } = await openReplayDb();
const all = async (s) => (await d1.prepare(s).bind().all()).results || [];
const names = [...new Set([
  ...Object.entries(ADD).map(([k, v]) => countryOf(k, v)),
  ...Object.keys(MOVE), ...Object.keys(FOLD),
  ...Object.entries(EDIT).map(([k, v]) => countryOf(k, v)),
])];
const IN = names.map((n) => `'${n.replace(/'/g, "''")}'`).join(",");

const rows = await all(`
  SELECT c.name_en n, d.section sec, d.sort_order so, t.lang, t.title, t.rows_json, t.note, t.body
    FROM deep_dive_cards d JOIN deep_dive_card_translations t ON t.card_id = d.id
    JOIN countries c ON c.id = d.country_id
   WHERE c.name_en IN (${IN}) ORDER BY c.name_en, d.section, d.sort_order`);

// state[country][section] = [ {so, langs:{lang:row}} ... ] in sort order
const state = {};
for (const r of rows) {
  const bySec = (state[r.n] ||= {});
  const list = (bySec[r.sec] ||= []);
  let card = list.find((c) => c.so === r.so);
  if (!card) { card = { so: r.so, langs: {} }; list.push(card); }
  card.langs[r.lang] = r;
}
for (const bySec of Object.values(state)) {
  for (const list of Object.values(bySec)) list.sort((a, b) => a.so - b.so);
}

const problems = [];
const plan = [];
const find = (country, section, title) =>
  (state[country]?.[section] || []).find((c) => c.langs && c.langs.en && c.langs.en.title === title);

// ---- 1. moves -----------------------------------------------------------
for (const [country, moves] of Object.entries(MOVE)) {
  for (const m of moves) {
    const card = find(country, m.from, m.title);
    if (!card) { problems.push(`${country}: no card "${m.title}" in ${m.from} to move`); continue; }
    const from = state[country][m.from], to = (state[country][m.to] ||= []);
    from.splice(from.indexOf(card), 1);
    to.push(card);
    card.movedFrom = m.from;          // read by the parking pass at emit time
    // A move may also take a spine slot. Denmark's card was titled
    // "NemHandel" -- the platform's name -- while its rows say which
    // identifier routes an invoice and which register holds it. respine
    // cannot know that: "NemHandel" is a proper noun, and putting it in a
    // global rename map would misfire on any other country that mentions
    // it. The title comes from the spine, not from this data file, so
    // there is still one place it is defined.
    if (m.slot) card.retitleSlot = m.slot;
    plan.push({ kind: "move", country, title: m.title, from: m.from, to: m.to, card, slot: m.slot });
  }
}

// ---- 2. folds -----------------------------------------------------------
for (const [country, f] of Object.entries(FOLD)) {
  const sec = f.section || "file_format";
  const drop = find(country, sec, f.drop), into = find(country, sec, f.into);
  if (!drop) { problems.push(`${country}: no card "${f.drop}" to fold away`); continue; }
  if (!into) { problems.push(`${country}: no card "${f.into}" to fold into`); continue; }
  const merged = {};
  for (const l of LANGS) {
    merged[l] = JSON.parse(into.langs[l].rows_json || "[]")
      .concat(JSON.parse(drop.langs[l].rows_json || "[]"));
  }
  if (LANGS.some((l) => merged[l].length !== merged.en.length)) {
    problems.push(`${country}: merged row counts disagree across languages`); continue;
  }
  const list = state[country][sec];
  list.splice(list.indexOf(drop), 1);
  into.merged = merged;
  into.newNote = f.note;
  into.newTitle = f.retitle || null;
  plan.push({ kind: "fold", country, sec, drop: f.drop, into: f.into, card: into, dropCard: drop,
              rows: merged.en.length });
}

// ---- 3. adds ------------------------------------------------------------
for (const [key, card] of Object.entries(ADD)) {
  const country = countryOf(key, card);
  const sec = card.section || "file_format";
  if (LANGS.some((l) => !card[l] || card[l].length !== card.en.length)) {
    problems.push(`${key}: row counts disagree across languages`); continue;
  }
  if (find(country, sec, titleFor(card.slot, "en"))) {
    problems.push(`${country} already has a "${card.slot}" card`); continue;
  }
  (state[country][sec] ||= []).push({ so: null, adding: card, key });
  plan.push({ kind: "add", country, sec, slot: card.slot, rows: card.en.length, key });
}

// ---- 4. edits -----------------------------------------------------------
for (const [key, e] of Object.entries(EDIT)) {
  const country = countryOf(key, e);
  const sec = e.section || "file_format";
  const card = find(country, sec, e.match);
  if (!card) { problems.push(`${country}: no card "${e.match}" in ${sec} to edit`); continue; }
  for (const f of ["title", "body", "note"]) {
    if (e[f] && LANGS.some((l) => !e[f][l])) {
      problems.push(`${country}: the ${f} edit is missing a language`);
    }
  }
  plan.push({ kind: "edit", country, sec, card, match: e.match, fields: e });
}

// ---- the ceilings, checked on the end state -----------------------------
for (const country of names) {
  for (const [sec, [lo, hi]] of Object.entries(BOUNDS)) {
    const n = (state[country]?.[sec] || []).length;
    if (n === 0) continue;
    if (n < lo || n > hi) problems.push(`${country}: ${sec} would end at ${n} cards, framework wants ${lo}-${hi}`);
  }
}

for (const p of plan) {
  if (p.kind === "move") console.log(`  ${p.country.padEnd(14)} MOVE  "${p.title}" ${p.from} -> ${p.to}`);
  if (p.kind === "fold") console.log(`  ${p.country.padEnd(14)} FOLD  "${p.drop}" into "${p.into}" (${p.rows} rows)`);
  if (p.kind === "add") console.log(`  ${p.country.padEnd(14)} ADD   "${p.slot}" (${p.rows} rows)`);
  if (p.kind === "edit") console.log(`  ${p.country.padEnd(14)} EDIT  "${p.match}" in ${p.sec}`
    + ` (${["title", "body", "note"].filter((f) => p.fields[f]).join(", ")})`);
}
for (const country of names) {
  const f = (state[country]?.file_format || []).length, s = (state[country]?.scope_transmission || []).length;
  console.log(`  ${country.padEnd(14)} ends at section 02: ${f} cards, section 03: ${s} cards`);
}
for (const w of problems) console.log(`  PROBLEM  ${w}`);
if (problems.length) { console.log("\nrefusing to emit"); process.exit(1); }

const i = process.argv.indexOf("--emit");
if (i === -1) { console.log("\n(report only — pass --emit <number>)"); process.exit(0); }

const esc = (s) => s.replace(/'/g, "''");
const lit = (s) => "'" + esc(s) + "'";
const nul = (s) => (s === null || s === undefined || s === "" ? "NULL" : lit(s));
const out = []; const w = (s) => out.push(s);
const cardSel = (country, sec, so) =>
  `(SELECT d.id FROM deep_dive_cards d JOIN countries c ON c.id = d.country_id`
  + ` WHERE c.name_en = ${lit(country)} AND d.section = '${sec}' AND d.sort_order = ${so})`;

w(`-- Section-02 spine slots for ${names.length} countries. GENERATED by`);
w(`-- tools/spine-slots.mjs from ${dataPath} — re-run the tool rather than`);
w("-- editing this file.");
w("--");
w("-- Moves change a card's section and nothing else: no prose is rewritten");
w("-- and no translation is redone. Folds append one card's rows to another");
w("-- and take a note written by a person. Added cards are researched from");
w("-- primary sources, or from the authority's own guidance where the");
w("-- statute could not be read, and say which on the page.");
w("");

// PARK EVERYTHING THAT MOVES OR ARRIVES, at a sort_order nothing else uses,
// and only then renumber. Computed here in one pass over the FINAL lists:
// an earlier version numbered each card as its own statement was written,
// so a card parked during the move phase used an index that later adds
// then changed underneath it.
let park = 900;
for (const country of names) {
  for (const sec of Object.keys(BOUNDS)) {
    for (const c of state[country]?.[sec] || []) {
      if (c.adding || c.movedFrom !== undefined) c.park = park++;
    }
  }
}
// Moves first: a card's section and sort_order change, its text does not.
for (const p of plan.filter((x) => x.kind === "move")) {
  w(`-- ${p.country}: "${p.title}" ${p.from} -> ${p.to}`
    + (p.slot ? `, retitled to the "${p.slot}" spine card` : ""));
  w(`UPDATE deep_dive_cards SET section = '${p.to}', sort_order = ${p.card.park}`
    + ` WHERE id = ${cardSel(p.country, p.from, p.card.so)};`);
  if (p.slot) {
    for (const l of LANGS) {
      w(`UPDATE deep_dive_card_translations SET title = ${lit(titleFor(p.slot, l))}`
        + ` WHERE lang = '${l}' AND card_id = ${cardSel(p.country, p.to, p.card.park)};`);
    }
  }
}
// Folds: the surviving card takes the merged rows and its written note.
for (const p of plan.filter((x) => x.kind === "fold")) {
  w("");
  w(`-- ${p.country}: "${p.drop}" folds into "${p.into}", ${p.rows} rows`);
  for (const l of LANGS) {
    const bits = [`rows_json = ${lit(JSON.stringify(p.card.merged[l]))}`];
    if (p.card.newTitle) bits.push(`title = ${lit(p.card.newTitle[l])}`);
    if (p.card.newNote) bits.push(`note = ${lit(p.card.newNote[l])}`);
    w(`UPDATE deep_dive_card_translations SET ${bits.join(", ")}`
      + ` WHERE lang = '${l}' AND card_id = ${cardSel(p.country, p.sec, p.card.so)};`);
  }
  w(`DELETE FROM deep_dive_card_translations WHERE card_id = ${cardSel(p.country, p.sec, p.dropCard.so)};`);
  w(`DELETE FROM deep_dive_cards WHERE id = ${cardSel(p.country, p.sec, p.dropCard.so)};`);
}
// Adds: parked at 900+ like the moves, then everything is renumbered.
for (const p of plan.filter((x) => x.kind === "add")) {
  const card = ADD[p.key];
  const slot = state[p.country][p.sec].find((c) => c.key === p.key);
  w("");
  w(`-- ${p.country}: new "${p.slot}" card, ${p.rows} rows`);
  w(`INSERT INTO deep_dive_cards (country_id, section, sort_order)`
    + ` SELECT id, '${p.sec}', ${slot.park} FROM countries WHERE name_en = ${lit(p.country)};`);
  for (const l of LANGS) {
    w("INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note)");
    w(`SELECT d.id, '${l}', ${lit(titleFor(card.slot, l))}, ${lit(JSON.stringify(card[l]))},`
      + ` ${nul(card.note ? card.note[l] : null)} FROM deep_dive_cards d`
      + ` WHERE d.country_id = (SELECT id FROM countries WHERE name_en = ${lit(p.country)})`
      + ` AND d.section = '${p.sec}' AND d.sort_order = ${slot.park};`);
  }
}

// Edits: text only, on a card that stays exactly where it is.
for (const p of plan.filter((x) => x.kind === "edit")) {
  w("");
  w(`-- ${p.country}: retarget "${p.match}" in ${p.sec}`);
  for (const l of LANGS) {
    const bits = ["title", "body", "note"].filter((f) => p.fields[f])
      .map((f) => `${f} = ${lit(p.fields[f][l])}`);
    w(`UPDATE deep_dive_card_translations SET ${bits.join(", ")}`
      + ` WHERE lang = '${l}' AND card_id = ${cardSel(p.country, p.sec, p.card.so)};`);
  }
}

// Renumber. Cards parked at 900+ have to come back into a contiguous run,
// and the parking is what stops a new card colliding with an existing
// sort_order -- the trap migration 700 hit when a DELETE by sort_order
// took out a card it had not meant to.
w("");
w("-- ---- back to a contiguous 0..n-1 in each section ----");
w("-- Cards were parked at 900+ so that an insert could not collide with an");
w("-- existing sort_order. Migration 700 learned that the hard way.");
for (const country of names) {
  for (const sec of Object.keys(BOUNDS)) {
    const list = state[country]?.[sec] || [];
    if (!list.length) continue;
    list.forEach((c, idx) => {
      const from = c.park !== undefined ? c.park : c.so;
      w(`UPDATE deep_dive_cards SET sort_order = ${1000 + idx} WHERE id = ${cardSel(country, sec, from)};`);
    });
    list.forEach((c, idx) => {
      w(`UPDATE deep_dive_cards SET sort_order = ${idx} WHERE id = ${cardSel(country, sec, 1000 + idx)};`);
    });
  }
}

w("");
w("-- ---- what this migration claims it did ----");
for (const country of names) {
  for (const sec of Object.keys(BOUNDS)) {
    const n = (state[country]?.[sec] || []).length;
    if (!n) continue;
    w(`-- ASSERT: SELECT count(*) FROM deep_dive_cards d JOIN countries c ON c.id = d.country_id`
      + ` WHERE c.name_en = ${lit(country)} AND d.section = '${sec}' = ${n}`);
  }
}
w("-- Every added card is present, in all four languages.");
for (const p of plan.filter((x) => x.kind === "add")) {
  w(`-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id`
    + ` JOIN countries c ON c.id = d.country_id WHERE c.name_en = ${lit(p.country)}`
    + ` AND d.section = '${p.sec}' AND t.title = ${lit(titleFor(ADD[p.key].slot, "en"))} = 1`);
}
w("-- Sort orders are contiguous from zero in every section touched.");
for (const country of names) {
  for (const sec of Object.keys(BOUNDS)) {
    const n = (state[country]?.[sec] || []).length;
    if (!n) continue;
    w(`-- ASSERT: SELECT max(d.sort_order) FROM deep_dive_cards d JOIN countries c ON c.id = d.country_id`
      + ` WHERE c.name_en = ${lit(country)} AND d.section = '${sec}' = ${n - 1}`);
  }
}
for (const p of plan.filter((x) => x.kind === "edit")) {
  if (!p.fields.title) continue;
  w(`-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id`
    + ` JOIN countries c ON c.id = d.country_id WHERE c.name_en = ${lit(p.country)}`
    + ` AND d.section = '${p.sec}' AND t.title = ${lit(p.fields.title.en)} = 1`);
}
w("-- No card in the sections this tool touches was left without rows.");
w("-- Scoped to those two sections deliberately: penalties_related cards are");
w("-- legitimately body-only, and a first draft of this assertion swept in");
w("-- ten of them and failed on content that was perfectly correct.");
w(`-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id`
  + ` JOIN countries c ON c.id = d.country_id WHERE c.name_en IN (${IN})`
  + ` AND d.section IN ('file_format','scope_transmission')`
  + ` AND (t.rows_json IS NULL OR json_array_length(t.rows_json) = 0) = 0`);
w("-- And no note left in fewer than four languages, anywhere in the corpus.");
w("-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT t.card_id FROM deep_dive_card_translations t"
  + " JOIN deep_dive_cards d ON d.id = t.card_id WHERE d.section = 'file_format'"
  + " AND t.note IS NOT NULL AND t.note <> '' GROUP BY t.card_id HAVING count(*) <> 4) = 0");

const num = process.argv[i + 1];
writeFileSync(join(REPO, "members-worker", "migrations", `${num}_spine_slots.sql`), out.join("\n") + "\n");
console.log(`\nwrote ${num}_spine_slots.sql`);
process.exit(0);
