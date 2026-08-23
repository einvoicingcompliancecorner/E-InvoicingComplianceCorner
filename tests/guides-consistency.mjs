#!/usr/bin/env node
// guides-consistency.mjs — no country page may contradict itself.
//
//   node tests/guides-consistency.mjs
//
// Dan, 22 August 2026: "A guide that contradicts itself in the same page,
// loses the site credibility immediately. Can you ensure this does not
// happen."
//
// WHY THIS COULD HAPPEN AT ALL, which is the part worth understanding
// before reading the rules. A country page assembles four bodies of
// content that were written at different times from different sources:
//
//   country_headline_facts   the five tiles, researched Aug 2026
//   milestones               the dated timeline, also on the tracker board
//   deep_dive_cards          the fact cards, written when the country was added
//   deep_dive_pages          the mandate summary
//
// Nothing had ever put them side by side. The compliance guide is the
// first artefact in this project that prints all four on one sheet, and
// the moment it did, five disagreements became visible — Canada's tile
// said VOLUNTARY directly above a card titled "Federal B2G (mandatory)";
// Oman's said PLANNED Feb 2027 above a dated entry saying the mandate
// began three weeks ago. Migration 611 repairs those five. This exists so
// the sixth fails a build instead of reaching a reader.
//
// ---- WHAT IT DOES AND DOES NOT CLAIM -----------------------------------
//
// It is a lexical check, not a comprehension one. It looks for a segment
// token (B2G / B2B / B2C) and a status word near each other in the same
// sentence, and asks whether that claim can live with what the tile says.
// It will never catch a contradiction expressed in prose it cannot parse,
// and it is not a substitute for reading the pages.
//
// So it is tuned hard for PRECISION rather than recall. A check that cries
// wolf gets switched off — this repository says so out loud in
// render-lint.mjs about a lint that flagged six correct lines — and a
// consistency check that fails on legitimate nuance would be turned off
// within a week. Four suppressions carry that weight, each one written
// because a real page needed it:
//
//   RECEIPT   "public bodies must receive" is not an issuing duty. This is
//             the convention the whole table rests on (migration 601), and
//             without it Ireland, Cyprus, Malta and the UK all fail.
//   HEDGE     a proposal, a draft, a consultation or a target is not a
//             mandate. Without it Estonia's draft VAT Act amendment and
//             Luxembourg's bill both fail.
//   NEGATED   "not mandatory" is not a claim that something is mandatory.
//   CROSSING  another segment between the token and the claim breaks the
//             link, so "the recommended channel for both B2G and voluntary
//             B2B" cannot attach 'voluntary' to B2G.
//
// TWO TIERS, and the split is the honest part. A page asserting a DUTY
// while its tile says there is none is a contradiction: both cannot be
// true, and it fails. A page asserting something is OPTIONAL while the
// tile says ACTIVE usually is not: real mandates have carve-outs, and
// Greece genuinely is active for domestic B2B with intra-EU still
// optional. Those are reported and do not fail.
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const t = suite("guides consistency");
const { d1 } = await openReplayDb();

const all = async (sql, ...args) =>
  (await d1.prepare(sql).bind(...args).all()).results || [];

const SEG = { b2g: "B2G", b2b: "B2B", b2c: "B2C" };
const WINDOW = 60;
// "nothing mandatory to fail to adopt" is a denial, not a duty. The first
// version listed only not/never/no/nor, and \b kept "no" from matching
// inside "nothing" — so Canada's penalties intro, a sentence whose whole
// point is that nothing is required, read as an assertion that something
// is.
const NEGATED = /\b(not|never|no|nor|none|nothing|neither|without)\b[^.;]{0,24}$|n't\b[^.;]{0,24}$/i;
const HEDGE = /\b(propos\w*|draft\w*|consultation|discussed|planned|expected|recommend\w*|would|may |never enacted|not yet|request)/i;
const RECEIPT = /\breceiv|\breceipt\b|\baccept/i;

// A claim, the statuses it can live with, and whether disagreeing is fatal.
const CLAIMS = [
  // "must issue" alone missed "must invoice", which is how Canada's
  // mandate summary phrased the duty it turned out not to have.
  { label: "asserts a duty",
    re: /mandator(?:y|ily)|must\s+(?:issue|invoice|send|submit|transmit)|required to (?:issue|invoice)/i,
    ok: new Set(["active", "planned"]), fatal: true },
  { label: "asserts optional", re: /voluntar(?:y|ily)|optional/i,
    ok: new Set(["voluntary", "no_mandate", "planned"]), fatal: false },
  { label: "asserts none", re: /no mandate|no obligation/i,
    ok: new Set(["no_mandate", "voluntary", "unknown"]), fatal: false },
];

const facts = await all(`
  SELECT c.name_en AS name, f.b2g_status, f.b2b_status, f.b2c_status
    FROM country_headline_facts f JOIN countries c ON c.id = f.country_id
   ORDER BY c.name_en`);
t.check("there are headline facts to check", facts.length >= 60, `${facts.length} countries`);

// Everything else the page asserts, per country.
const cards = await all(`
  SELECT c.name_en AS name, dct.title, dct.rows_json
    FROM deep_dive_cards dc JOIN countries c ON c.id = dc.country_id
    LEFT JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = 'en'`);
const miles = await all(`
  SELECT c.name_en AS name, mt.system
    FROM milestones m JOIN countries c ON c.id = m.country_id
    LEFT JOIN milestone_translations mt ON mt.milestone_id = m.id AND mt.lang = 'en'
   WHERE m.on_tracker = 1`);

const pages = await all(`
  SELECT c.name_en AS name, pt.mandate_summary, pt.scope_intro,
         pt.penalties_intro, pt.compliance_model
    FROM deep_dive_page_translations pt JOIN countries c ON c.id = pt.country_id
   WHERE pt.lang = 'en'`);

const byCountry = new Map(facts.map((f) => [f.name, []]));
const add = (name, kind, text) => {
  if (!text || !byCountry.has(name)) return;
  byCountry.get(name).push({ kind, text: String(text) });
};
for (const c of cards) {
  add(c.name, "card title", c.title);
  if (!c.rows_json) continue;
  try {
    for (const [k, v] of JSON.parse(c.rows_json)) add(c.name, "fact row", `${k}: ${v}`);
  } catch { /* a malformed rows_json is the render lint's problem, not this one */ }
}
for (const m of miles) add(m.name, "milestone", m.system);

// AND THE DEEP DIVE'S OWN PROSE, added 23 August after Canada showed the
// gap. The checker compared tiles against cards and milestones and never
// against the paragraphs above them — so when Canada's B2G went back to
// voluntary, its mandate_summary went on saying "suppliers to the
// Government of Canada MUST invoice electronically via SAP Ariba", in
// four languages, and nothing complained. That summary is the most-read
// paragraph on the page.
for (const p of pages) {
  add(p.name, "mandate summary", p.mandate_summary);
  add(p.name, "scope intro", p.scope_intro);
  add(p.name, "penalties intro", p.penalties_intro);
  add(p.name, "compliance model", p.compliance_model);
}

const fatal = [];
const soft = [];
const seen = new Set();

for (const f of facts) {
  const status = { b2g: f.b2g_status, b2b: f.b2b_status, b2c: f.b2c_status };
  for (const { kind, text } of byCountry.get(f.name)) {
    for (const [seg, token] of Object.entries(SEG)) {
      const others = Object.entries(SEG).filter(([k]) => k !== seg).map(([, v]) => v);
      for (const sm of text.matchAll(new RegExp(token, "gi"))) {
        const from = Math.max(0, sm.index - WINDOW);
        const near = text.slice(from, sm.index + token.length + WINDOW);
        if (HEDGE.test(near)) continue;
        for (const claim of CLAIMS) {
          for (const cm of near.matchAll(new RegExp(claim.re.source, "gi"))) {
            if (claim.fatal && RECEIPT.test(near.slice(Math.max(0, cm.index - 40), cm.index + 40))) continue;
            if (NEGATED.test(near.slice(0, cm.index))) continue;
            const [lo, hi] = [sm.index - from, cm.index].sort((a, b) => a - b);
            if (others.some((o) => new RegExp(o, "i").test(near.slice(lo, hi)))) continue;
            // AND WHAT THE CLAIM IS ABOUT MAY SIT AFTER IT. "Voluntary
            // B2B — mandatory B2G since 2014" attached "mandatory" to the
            // B2B token simply because B2B came first in the string. If
            // another segment's name follows the claim within a few
            // words, the claim is that segment's, not this one's.
            const after = near.slice(cm.index + cm[0].length, cm.index + cm[0].length + 12);
            if (others.some((o) => new RegExp(o, "i").test(after))) continue;
            if (claim.ok.has(status[seg])) continue;
            const key = `${f.name}|${seg}|${text}`;
            if (seen.has(key)) continue;
            seen.add(key);
            (claim.fatal ? fatal : soft).push(
              `${f.name}: the ${seg.toUpperCase()} tile says ${status[seg].toUpperCase()}, `
              + `but a ${kind} on the same page ${claim.label} — "${text.slice(0, 120)}"`);
          }
        }
      }
    }
  }
}

t.check("no page asserts a duty its own headline tile denies",
  fatal.length === 0, "\n        " + fatal.join("\n        "));

// ---- and the tile agrees with the dates the board publishes ------------
//
// A separate rule, because it needs no language at all. If the tracker
// shows an in-force dated obligation for a segment and the tile calls that
// segment forthcoming, the page prints "planned" above a date in the past.
// That was Oman, and a reader does not need to parse a sentence to see it.
const TODAY = new Date().toISOString().slice(0, 10);
// THE SAME RECEIPT EXCEPTION AS ABOVE, and it is doing real work here.
// mandate_scope says which SEGMENT a milestone is about, not whether the
// duty is to issue or to receive -- Germany's 1 Jan 2025 entry is scope
// b2b and reads "Mandatory receipt of structured e-invoices", and New
// Zealand's 2026 entry is agencies sending to each other. Without this the
// rule fires on both, and their tiles are correct.
const scoped = (await all(`
  SELECT c.name_en AS name, m.date, m.mandate_scope, mt.system
    FROM milestones m JOIN countries c ON c.id = m.country_id
    LEFT JOIN milestone_translations mt ON mt.milestone_id = m.id AND mt.lang = 'en'
   WHERE m.on_tracker = 1 AND m.mandate_scope IN ('b2b','b2g_only')`))
  .filter((m) => !RECEIPT.test(String(m.system || "")));
const stale = [];
for (const f of facts) {
  for (const [seg, scope] of [["b2b", "b2b"], ["b2g", "b2g_only"]]) {
    const past = scoped.filter((m) => m.name === f.name && m.mandate_scope === scope && m.date <= TODAY);
    if (past.length && f[`${seg}_status`] === "planned") {
      stale.push(`${f.name}: the ${seg.toUpperCase()} tile says PLANNED, but the board carries an `
        + `in-force ${scope} milestone dated ${past.map((m) => m.date).join(", ")}`);
    }
  }
}
t.check("no tile calls an obligation forthcoming that the board dates in the past",
  stale.length === 0, "\n        " + stale.join("\n        "));

// ---- nuance, reported rather than enforced -----------------------------
console.log(`  note  ${soft.length} softer disagreement(s) — a carve-out reads like a `
  + "contradiction to a lexical check and usually is not; listed, not enforced");
for (const s of soft) console.log(`        ${s}`);

// A suppression that stops matching anything is a check quietly getting
// weaker. State the reach so a future edit that guts it is visible.
console.log(`  note  ${facts.length} countries, `
  + `${[...byCountry.values()].reduce((n, v) => n + v.length, 0)} assertions compared`);

process.exit(t.report() ? 0 : 1);
