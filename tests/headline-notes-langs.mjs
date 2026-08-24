#!/usr/bin/env node
// headline-notes-langs.mjs — the headline notes, in the three languages
// nothing else reads.
//
//   node tests/headline-notes-langs.mjs
//
// Migration 624 added 1,050 strings to country_headline_fact_translations:
// five notes per country in de, fr and es. Before it, that table held
// English and nothing else, and every lexical check in this repository —
// guides-consistency.mjs above all — is written in English and reads the
// 'en' rows. So the site's most-read box gained a thousand sentences that
// no check could see.
//
// This is the check that sees them. It deliberately does NOT try to be
// guides-consistency in four languages: that suite's precision comes from
// four hard-won suppressions tuned against real English pages, and
// reproducing that tuning three more times would produce a check that
// cries wolf and gets switched off. It asks three narrower questions that
// need no comprehension at all.
//
//   1. STRUCTURE. Wherever English has a note, the other three have one,
//      and no translated note is longer than the cap the guide's fitter
//      can absorb. The database asserts this too (624's standing
//      invariants); this asserts it against what the RENDERER returns,
//      which is the thing a reader actually gets.
//
//   2. FIGURES. Every digit-run in the English note — dates, thresholds,
//      instrument numbers, article numbers — appears in all three
//      translations. A translation that drops "1 Jan 2027" reads
//      perfectly well and is a different fact.
//
//   3. THE ONE DISTINCTION THIS SITE IS BUILT ON. A duty to ISSUE is not
//      a duty to RECEIVE, and a status of voluntary or no_mandate means
//      there is no duty to issue at all. If the German note for a
//      no-mandate segment says suppliers must issue, that is the Canada
//      failure — the one that took migrations 611, 621 and 622 to clear
//      out of English — recurring in a language nobody on this project
//      reads. The patterns below are per-language and deliberately
//      literal: they match a modal followed by an issuing verb, and they
//      stand down for the receive/accept wording and for negation.
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const t = suite("headline notes, de/fr/es");
const { d1 } = await openReplayDb();
const all = async (sql, ...args) =>
  (await d1.prepare(sql).bind(...args).all()).results || [];

const LANGS = ["de", "fr", "es"];
// Six since 23 August, when e-Reporting joined the strip. Adding the
// field here is what makes the structure and figure checks below cover
// the new note without another line of code -- and what would have
// caught 630 shipping with a language missing.
const FIELDS = ["b2g", "b2b", "b2c", "archiving", "signature", "ereporting"];
const SEGMENTS = ["b2g", "b2b", "b2c"];
// The looser of 624's two caps. The tight one (130) belongs to the
// migration, which knows what it just wrote; this is the line past which
// GUIDE_FIT_SCRIPT starts shrinking the whole country page to compensate.
const CAP = 150;

const rows = await all(`
  SELECT c.name_en AS name, t.lang, t.b2g_note, t.b2b_note, t.b2c_note,
         t.archiving_note, t.signature_note, t.ereporting_note
    FROM country_headline_fact_translations t
    JOIN countries c ON c.id = t.country_id
   ORDER BY c.name_en, t.lang`);
const facts = await all(`
  SELECT c.name_en AS name, f.b2g_status, f.b2b_status, f.b2c_status
    FROM country_headline_facts f JOIN countries c ON c.id = f.country_id`);

const byCountry = new Map();
for (const r of rows) {
  if (!byCountry.has(r.name)) byCountry.set(r.name, {});
  byCountry.get(r.name)[r.lang] = r;
}
const statusOf = new Map(facts.map((f) => [f.name, f]));

t.check("there are translated notes to check", rows.length >= 200,
  `${rows.length} rows across ${byCountry.size} countries`);

// ---- 1. structure ------------------------------------------------------

const missing = [];
const overlong = [];
for (const [name, langs] of byCountry) {
  const en = langs.en;
  if (!en) { missing.push(`${name}: no English row at all`); continue; }
  for (const lang of LANGS) {
    const row = langs[lang];
    if (!row) { missing.push(`${name}: no ${lang} row`); continue; }
    for (const f of FIELDS) {
      const col = `${f}_note`;
      if (en[col] && !row[col]) missing.push(`${name}/${lang}: no ${f} note where English has one`);
      if (row[col] && row[col].length > CAP) {
        overlong.push(`${name}/${lang}/${f}: ${row[col].length} chars`);
      }
    }
  }
}
t.check("every English note exists in all three translations",
  missing.length === 0, "\n        " + missing.join("\n        "));
t.check(`no translated note runs past ${CAP} characters`,
  overlong.length === 0, "\n        " + overlong.join("\n        "));

// ---- 2. figures --------------------------------------------------------
//
// A digit-run with its internal separators: "5,000", "2019", "80m" is
// caught by its "80", "art.48" by its "48". Trailing punctuation is not
// part of it, so a note ending "...since 2019." still matches "2019".
const DIGITS = /\d[\d,.]*\d|\d/g;
const lostFigures = [];
for (const [name, langs] of byCountry) {
  const en = langs.en;
  if (!en) continue;
  for (const f of FIELDS) {
    const col = `${f}_note`;
    if (!en[col]) continue;
    const figures = [...new Set(en[col].match(DIGITS) || [])];
    for (const lang of LANGS) {
      const text = (langs[lang] || {})[col];
      if (!text) continue;
      const lost = figures.filter((n) => !text.includes(n));
      if (lost.length) lostFigures.push(`${name}/${lang}/${f}: lost ${lost.map((x) => `"${x}"`).join(", ")}`);
    }
  }
}
t.check("no translation dropped a date, threshold or instrument number",
  lostFigures.length === 0, "\n        " + lostFigures.join("\n        "));

// ---- 3. issue versus receive ------------------------------------------
//
// Per language: a modal of obligation followed within a few words by a
// verb of ISSUING. Kept literal on purpose — this fires on the shape
// "must issue" and on nothing subtler, because the alternative is a check
// nobody trusts. RECEIVE stands down the match: "Behörden müssen
// E-Rechnungen empfangen" is the convention the whole table rests on
// (migration 601) and is not an issuing duty. NEGATED stands it down too.
const DUTY = {
  de: /\b(?:muss|müssen|verpflichtet|Pflicht|verbindlich|vorgeschrieben)\b[^.;]{0,40}\b(?:ausstellen|stellen|senden|übermitteln|fakturieren|e-fakturieren|Ausstellung|ausgestellt)\b/i,
  fr: /\b(?:doit|doivent|obligation|obligatoire|tenus?)\b[^.;]{0,40}\b(?:émettre|émission|facturer|e-facturer|envoyer|transmettre|émises?)\b/i,
  es: /\b(?:debe|deben|obligación|obligatori[oa]s?|obligad[oa]s?)\b[^.;]{0,40}\b(?:emitir|emisión|facturar|e-facturar|enviar|transmitir|emitidas?)\b/i,
};
const RECEIVE = {
  de: /empfang|entgegennehmen|annehmen|akzeptier/i,
  fr: /recevoir|réception|reçoi|accept/i,
  es: /recibir|recepción|recib|acept/i,
};
const NEGATED = {
  de: /\b(?:kein|keine|keinen|keiner|keinem|nicht|niemand|nichts|ohne)\b/i,
  fr: /\b(?:aucun|aucune|pas|ni|rien|nul|sans|non)\b/i,
  es: /\b(?:sin|ningún|ninguna|ningun[oa]s?|no|nada|nadie)\b/i,
};
// The statuses under which an issuing duty may honestly be asserted. Same
// set guides-consistency uses for English, and for the same reason: a
// planned mandate is a duty with a date on it, a voluntary one is not a
// duty at all.
const DUTY_OK = new Set(["active", "planned"]);

const contradictions = [];
// How often the duty pattern matches at all, before any filter. A check
// that passes because its regex stopped matching German is worse than no
// check, and zero contradictions is exactly what a dead pattern looks
// like. This counts every segment note in every language, including the
// active ones the loop below skips, and is asserted non-trivial.
const fires = { de: 0, fr: 0, es: 0 };
for (const [, langs] of byCountry) {
  for (const seg of SEGMENTS) {
    for (const lang of LANGS) {
      const text = ((langs[lang] || {})[`${seg}_note`] || "");
      if (text && DUTY[lang].test(text)) fires[lang]++;
    }
  }
}

for (const [name, langs] of byCountry) {
  const st = statusOf.get(name);
  if (!st) continue;
  for (const seg of SEGMENTS) {
    if (DUTY_OK.has(st[`${seg}_status`])) continue;
    for (const lang of LANGS) {
      const text = ((langs[lang] || {})[`${seg}_note`] || "");
      if (!text) continue;
      const m = DUTY[lang].exec(text);
      if (!m) continue;
      // The clause the modal sits in, not the whole note: a second
      // sentence saying something must be received should not suppress a
      // first one saying something must be issued, and vice versa.
      const clause = text.slice(Math.max(0, m.index - 60), m.index + m[0].length + 20);
      if (RECEIVE[lang].test(clause)) continue;
      if (NEGATED[lang].test(clause)) continue;
      contradictions.push(
        `${name}/${lang}: the ${seg.toUpperCase()} tile says ${st[`${seg}_status`].toUpperCase()}, `
        + `but the ${lang} note asserts an issuing duty — "${text}"`);
    }
  }
}
t.check("no translated note claims a duty to issue its own tile denies",
  contradictions.length === 0, "\n        " + contradictions.join("\n        "));

// EACH LANGUAGE'S PATTERN IS STILL ALIVE. The three are not equally
// sensitive and are not meant to be — Spanish "deben emitir" is one
// phrase where German splits "stellen ... aus" across the clause — but a
// language that drops to zero has stopped reading its own notes, and the
// contradiction check above would go on passing in silence.
for (const lang of LANGS) {
  t.check(`the ${lang} duty pattern still matches real notes`,
    fires[lang] >= 3, `${fires[lang]} match(es) across ${byCountry.size} countries`);
}

// A check whose reach nobody states is a check that can quietly stop
// reaching anything. Print what it looked at.
console.log(`  note  ${byCountry.size} countries x ${LANGS.length} languages, `
  + `${rows.filter((r) => r.lang !== "en").reduce((n, r) => n + FIELDS.filter((f) => r[`${f}_note`]).length, 0)} translated notes read`);

process.exit(t.report() ? 0 : 1);
