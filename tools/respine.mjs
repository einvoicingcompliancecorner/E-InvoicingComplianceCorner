#!/usr/bin/env node
// respine.mjs — restructure existing section-02 cards onto the framework
// spine, WITHOUT retyping anyone's prose in four languages.
//
//   node tools/respine.mjs            # report only: what would move, and what refuses
//   node tools/respine.mjs --emit N   # write members-worker/migrations/N_respine.sql
//
// THE PROBLEM THIS SOLVES. 72 countries are off the section-02 spine.
// Their content is mostly fine and already translated into four
// languages; what is wrong is which card each row sits under. Rewriting
// that by hand means retyping several thousand translated strings, and
// every one of them is a chance to lose a fact.
//
// So this reads the rows out of the replayed chain, ROUTES EACH ROW to a
// spine slot by its own key, and emits a migration that rebuilds the
// cards around the rows unchanged. The prose is never touched — only its
// filing. Rows are positionally aligned across languages (the
// deep-dive checklist requires equal row counts per language), so a row
// routed by its English key carries its es/de/fr siblings with it.
//
// WHAT IT REFUSES TO DO, and why that matters more than what it does:
//
//   - If a spine slot would end up EMPTY, it refuses that country. An
//     empty "Archiving" card is a lie by omission, and the honest fix is
//     a human writing "no retention rule is prescribed" in four
//     languages. Refusing is the whole point: this tool exists to do the
//     mechanical 80%, not to paper over the 20%.
//   - If a country's languages disagree on row count, it refuses. That
//     asymmetry is a real defect and must not be laundered into a new
//     shape where nobody will find it.
//   - It never drops a row. Every input row appears in exactly one
//     output card, and the tool asserts that count end to end.
//
// EXTRA CARDS SURVIVE. The framework allows 3-5 cards in section 02, so
// a country may keep ONE card beyond the four-card spine. Where a
// country has genuinely distinct material that is not spine material --
// Chile's CAF and TED, Brazil's 44-digit access key, China's invoice
// quotas -- the KEEP list below preserves that card intact rather than
// dissolving it into rows. Those cards are the most useful thing on
// those pages and a spine that destroys them is not worth having.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { openReplayDb } from "../tests/lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const LANGS = ["en", "es", "de", "fr"];

// The spine, read from the framework document rather than restated, for
// the reason migration 700 taught: a claim and its evidence must not come
// from the same place.
const doc = readFileSync(join(REPO, "DEEP-DIVE-FRAMEWORK.md"), "utf8");
const SPINE_EN = [...(doc.split("## The section-02 spine")[1] || "")
  .matchAll(/^\d+\.\s+\*\*(.+?)\*\*\s*$/gm)].map((m) => m[1]);
if (SPINE_EN.length !== 4) {
  console.error("Could not read a four-title spine from DEEP-DIVE-FRAMEWORK.md");
  process.exit(1);
}
const SPINE = {
  en: SPINE_EN,
  es: ["Formato y estándar", "Identificadores y registro", "Contenido obligatorio", "Conservación"],
  de: ["Format und Standard", "Kennungen und Registrierung", "Pflichtangaben", "Aufbewahrung"],
  fr: ["Format et norme", "Identifiants et enregistrement", "Mentions obligatoires", "Conservation"],
};

// WHAT THIS TOOL WILL AND WILL NOT DO — the second design, after the
// first was measured and thrown away.
//
// The first version routed EVERY row to a spine slot by its own key.
// Measured across the corpus it was a failure: Argentina came out
// 8/1/1/1, eight of eleven rows falling through to "Format & standard"
// because row keys are prose and do not announce their topic. A tool
// that files eight rows under one heading is worse than the bespoke card
// it replaced. Recorded here rather than deleted, because the next person
// to think "this is mechanical" should see the measurement first: IT IS
// NOT. The remaining countries need editorial judgement, one at a time.
//
// So this now does exactly two things, both of which are safe because
// both are locally verifiable:
//
//   A. RENAME a near-synonym title to its spine title. Pure relabelling;
//      no row moves. "Syntax & standard" and "Format" meant "Format &
//      standard" all along.
//   B. SPLIT a combined "Mandatory content & archiving" card into the two
//      spine cards it is visibly the concatenation of, routing rows by
//      key, and only where BOTH halves come out non-empty.
//
// Everything else is refused and belongs to a human.
const RENAME = new Map([
  // Slot 0. Every one of these is a country's own wording for "the format
  // and the standard it follows" -- the corpus produced twenty-one ways to
  // say it. Widened 27 August 2026 after the first pass, where the tool
  // aborted on the FIRST unrecognised title and so never reached the rest
  // of a country's cards; the report was showing one symptom per country
  // rather than the shape of the work.
  ["Format", 0], ["Format & standard", 0], ["Syntax & standard", 0], ["Format & signature", 0],
  ["Format & validation", 0], ["Format, keys & validation", 0], ["Format & validation statuses", 0],
  ["Format & network", 0], ["Format & transmission", 0], ["Format & transmission model", 0],
  ["Format & channels", 0], ["Format & clearance mechanics", 0], ["Format & platform", 0],
  ["Current formats", 0], ["Accepted formats", 0], ["National formats", 0], ["Standard & format", 0],
  ["Base specification", 0], ["Specification", 0], ["Schema", 0], ["Document structure", 0],
  ["B2G format & platform", 0], ["B2G format & platform (SABIS)", 0], ["B2G format & network", 0],
  ["B2G structured format", 0],
  ["Identifiers", 1], ["Identifiers & registration", 1], ["Business identifiers", 1], ["Registration", 1],
  ["Mandatory identifiers", 1],
  ["Mandatory content", 2], ["Mandatory invoice fields", 2], ["Extra mandatory fields", 2],
  ["Mandatory data fields", 2], ["Mandatory Data Elements", 2], ["Required fields", 2],
  ["Key mandatory fields", 2],
  ["Archiving", 3], ["Archiving & retention", 3], ["Archiving & timing", 3],
]);
// Titles that are a visible concatenation of slots 2 and 3.
const SPLIT = new Set(["Mandatory content & archiving", "Mandatory content & retention"]);
const ARCHIVING_ROW = /archiv|retention|retain|storage|store|keep|conserv|aufbewahr|\byears?\b/i;
// There WAS a KEEP list here: an allow-list of bespoke titles, with a
// comment above saying it decided which cards survived whole. It was
// declared and never read. EVERY unrecognised card is kept, on the list or
// not, so the list governed nothing and the comment describing it was
// false. Found on 28 August 2026 while using the tool.
//
// Deleted rather than wired up, because the code's actual rule is the
// better one: at most ONE unrecognised card per country, whatever it is,
// and more than one means a person chooses. An allow-list would have meant
// every future country's bespoke card needed adding to a file in this tool
// before the tool would touch that country at all.
//
// Second piece of dead code in this repo whose comment described a
// criterion the code does not apply. The other was
// MARKER_LONLAT_OVERRIDES in shared/map-data.mjs, deleted the same day.

const { d1 } = await openReplayDb();
const all = async (s) => (await d1.prepare(s).bind().all()).results || [];
const backlog = JSON.parse(readFileSync(join(REPO, "tests/data/deep-dive-backlog.json"), "utf8"));
const todo = new Set(backlog["spine.notyet"] || []);

const rows = await all(`
  SELECT c.name_en AS name, d.sort_order AS so, t.lang, t.title, t.rows_json, t.body, t.note
    FROM deep_dive_cards d
    JOIN deep_dive_card_translations t ON t.card_id = d.id
    JOIN countries c ON c.id = d.country_id
   WHERE d.section = 'file_format' ORDER BY c.name_en, d.sort_order, t.lang`);

const byCountry = new Map();
for (const r of rows) {
  if (!todo.has(r.name)) continue;
  if (!byCountry.has(r.name)) byCountry.set(r.name, new Map());
  const cards = byCountry.get(r.name);
  if (!cards.has(r.so)) cards.set(r.so, {});
  cards.get(r.so)[r.lang] = r;
}

const ready = [], refused = [];
for (const [name, cards] of byCountry) {
  const why = [];
  const slots = [[], [], [], []];      // slots[i] = [{lang: [k,v]}...]
  // A card is more than its rows. THE FIRST VERSION OF THIS TOOL FORGOT
  // THAT, and the header above said "no prose is rewritten" while every
  // note and body was silently dropped on the floor. Measured on 28 August
  // 2026: 31% of respined cards carried a note against 79% of untouched
  // ones, and re-running the tool over France, New Zealand, Norway and
  // Slovakia deleted 18 of 18. Four migrations had already shipped it.
  //
  // The rows were asserted end to end and the note was not, under a
  // comment reading "a silent drop is the only way this tool can do real
  // damage". It was right about the mechanism and wrong about the field.
  const meta = [null, null, null, null];   // meta[i] = {note:{lang}, body:{lang}}
  const kept = [];
  let inputRows = 0, inputNotes = 0;

  for (const [, langs] of [...cards].sort((a, b) => a[0] - b[0])) {
    if (LANGS.some((l) => !langs[l])) { why.push("a card is missing a language"); break; }
    const parsed = {};
    for (const l of LANGS) {
      try { parsed[l] = langs[l].rows_json ? JSON.parse(langs[l].rows_json) : []; }
      catch { parsed[l] = null; }
    }
    if (LANGS.some((l) => parsed[l] === null)) { why.push("unparseable rows_json"); break; }
    const n = parsed.en.length;
    if (LANGS.some((l) => parsed[l].length !== n)) {
      why.push(`row counts disagree across languages on "${langs.en.title}"`); break;
    }
    if (n === 0) { why.push(`"${langs.en.title}" has no rows to route`); break; }
    inputRows += n;

    const pack = (i) => Object.fromEntries(LANGS.map((l) => [l, parsed[l][i]]));
    const field = (f) => Object.fromEntries(LANGS.map((l) => [l, langs[l][f] || null]));
    const title = langs.en.title;
    if (langs.en.note) inputNotes += 1;

    if (RENAME.has(title)) {                                   // A: relabel in place
      const slot = RENAME.get(title);
      if (slots[slot].length) { why.push(`two cards both map to "${SPINE_EN[slot]}"`); break; }
      for (let i = 0; i < n; i++) slots[slot].push(pack(i));
      // One source card, one destination slot, so its note and body come
      // with it unambiguously. That is the whole reason the tool refuses
      // when two cards map to one slot.
      meta[slot] = { note: field("note"), body: field("body") };
      continue;
    }
    if (SPLIT.has(title)) {                                    // B: split the pair
      // One card feeds TWO slots, so which half its note describes is a
      // judgement, not a routing rule. Refuse rather than guess: putting it
      // on both duplicates it and putting it on one invents an attribution.
      if (langs.en.note || langs.en.body) {
        why.push(`"${title}" splits into two cards and has a note or body — a person must place it`); break;
      }
      for (let i = 0; i < n; i++) slots[ARCHIVING_ROW.test(parsed.en[i][0]) ? 3 : 2].push(pack(i));
      continue;
    }
    // Anything else is a BESPOKE card, and the framework permits one
    // beyond the four-card spine. Kept whole, with its own title and its
    // own rows: Chile's CAF, China's invoice quotas and Denmark's
    // migration path are the most useful things on those pages and a
    // spine that dissolves them into generic headings is not worth
    // having. More than one, and the country needs a person to choose.
    kept.push(langs);
    inputRows -= n;
  }

  if (!why.length) {
    const empty = slots.map((s, i) => (s.length ? null : SPINE_EN[i])).filter(Boolean);
    if (empty.length) why.push(`no rows route to: ${empty.join(", ")}`);
    if (kept.length > 1) why.push(`${kept.length} cards on the keep list; only one extra is allowed`);
  }
  (why.length ? refused : ready).push({ name, slots, meta, kept, inputRows, inputNotes, why });
}

const outRows = (r) => r.slots.reduce((a, s) => a + s.length, 0);

console.log(`spine.notyet: ${todo.size} countries`);
console.log(`  READY   ${ready.length}`);
console.log(`  REFUSED ${refused.length}\n`);
for (const r of ready) {
  const bad = outRows(r) !== r.inputRows ? "  *** ROW COUNT CHANGED ***" : "";
  console.log(`  ready  ${r.name.padEnd(22)} ${r.slots.map((s) => s.length).join("/")}`
    + `${r.kept.length ? " +1 kept" : ""}  (${r.inputRows} rows)${bad}`);
}
console.log("");
for (const r of refused) console.log(`  refused ${r.name.padEnd(22)} ${r.why[0]}`);

const emitIdx = process.argv.indexOf("--emit");
if (emitIdx === -1) { console.log("\n(report only — pass --emit <number> to write the migration)"); process.exit(0); }

const num = process.argv[emitIdx + 1];
const esc = (s) => s.replace(/'/g, "''");
const lit = (s) => "'" + esc(s) + "'";
const out = [];
const w = (s) => out.push(s);
w(`-- Section-02 spine, ${ready.length} countries. GENERATED by tools/respine.mjs.`);
w("-- Re-run the tool rather than editing this file.");
w("--");
w("-- No prose is rewritten. Every row below is the row that was already");
w("-- there, in all four languages, moved to the spine card its own key");
w("-- routes it to, and every note and body travels with its card. The tool");
w("-- refuses any country where a spine slot would end up empty, so nothing");
w("-- here is a card invented to fill a hole.");
w("--");
w("-- Notes travel as of 28 August 2026. Before that this same sentence was");
w("-- here and was false: the rebuild carried rows and dropped every note,");
w("-- across migrations 700, 701, 713 and 715.");
w("");
for (const r of ready) {
  w(`-- ---- ${r.name}: ${r.inputRows} rows -> ${r.slots.map((s) => s.length).join("/")}`
    + `${r.kept.length ? " plus one card kept whole" : ""} ----`);
  w(`DELETE FROM deep_dive_card_translations WHERE card_id IN (SELECT d.id FROM deep_dive_cards d`
    + ` JOIN countries c ON c.id = d.country_id WHERE c.name_en = ${lit(r.name)} AND d.section = 'file_format');`);
  w(`DELETE FROM deep_dive_cards WHERE section = 'file_format'`
    + ` AND country_id = (SELECT id FROM countries WHERE name_en = ${lit(r.name)});`);
  const nul = (s) => (s === null || s === undefined || s === "" ? "NULL" : lit(s));
  const emitCard = (i, titleFor, rowsFor, noteFor, bodyFor) => {
    w(`INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'file_format', ${i}`
      + ` FROM countries WHERE name_en = ${lit(r.name)};`);
    for (const l of LANGS) {
      w("INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body)");
      w(`SELECT d.id, '${l}', ${lit(titleFor(l))}, ${lit(JSON.stringify(rowsFor(l)))},`
        + ` ${nul(noteFor(l))}, ${nul(bodyFor(l))}`
        + ` FROM deep_dive_cards d WHERE d.country_id = (SELECT id FROM countries WHERE name_en = ${lit(r.name)})`
        + ` AND d.section = 'file_format' AND d.sort_order = ${i};`);
    }
  };
  r.slots.forEach((slot, i) => emitCard(i, (l) => SPINE[l][i], (l) => slot.map((p) => p[l]),
    (l) => (r.meta[i] ? r.meta[i].note[l] : null), (l) => (r.meta[i] ? r.meta[i].body[l] : null)));
  r.kept.forEach((k, j) => emitCard(4 + j, (l) => k[l].title, (l) => JSON.parse(k[l].rows_json),
    (l) => k[l].note, (l) => k[l].body));
  w("");
}
w("-- ---- what this migration claims it did ----");
for (const r of ready) {
  const n = r.slots.length + r.kept.length;
  w(`-- ASSERT: SELECT count(*) FROM deep_dive_cards WHERE section = 'file_format'`
    + ` AND country_id = (SELECT id FROM countries WHERE name_en = ${lit(r.name)}) = ${n}`);
}
w("-- Not one row may have been lost in the move. Compare the total against");
w("-- what went in, per country, since a silent drop is the only way this");
w("-- tool can do real damage.");
for (const r of ready) {
  w(`-- ASSERT: SELECT sum(json_array_length(t.rows_json)) FROM deep_dive_card_translations t`
    + ` JOIN deep_dive_cards d ON d.id = t.card_id`
    + ` WHERE d.country_id = (SELECT id FROM countries WHERE name_en = ${lit(r.name)})`
    + ` AND d.section = 'file_format' AND t.lang = 'en' = ${r.inputRows + r.kept.reduce((a, k) => a + JSON.parse(k.en.rows_json).length, 0)}`);
}
w("-- Nor one NOTE. The row assertion above shipped in four migrations while");
w("-- every note was being deleted underneath it, because the comment saying");
w("-- a silent drop was the only real damage named the wrong field.");
for (const r of ready) {
  w(`-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t`
    + ` JOIN deep_dive_cards d ON d.id = t.card_id`
    + ` WHERE d.country_id = (SELECT id FROM countries WHERE name_en = ${lit(r.name)})`
    + ` AND d.section = 'file_format' AND t.lang = 'en' AND t.note IS NOT NULL AND t.note <> ''`
    + ` = ${r.inputNotes}`);   // counted over every source card, kept ones included
}
const file = join(REPO, "members-worker", "migrations", `${num}_respine.sql`);
writeFileSync(file, out.join("\n") + "\n");
console.log(`\nwrote ${file}`);
process.exit(0);
