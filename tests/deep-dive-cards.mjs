#!/usr/bin/env node
// deep-dive-cards.mjs — every card a country authored reaches the page,
// and nothing reaches the page that is not content.
//
//   node tests/deep-dive-cards.mjs
//
// WHY THIS EXISTS. `renderRelatedCard` rendered only `card.body`, so a
// penalties_related card authored with rows_json and no body printed the
// literal string "null" — escapeHtml(null) is "null" — where its content
// should have been. Dan found it on Ghana on 27 August 2026. Kenya and
// Nigeria had been shipping it since they were added: twelve cards
// across five countries.
//
// The instructive part is that the mirror of this bug had ALREADY been
// found and fixed. renderSpecCard's own comment records that
// file_format and scope_transmission cards rendered an empty box for a
// body-only card, "since only renderRelatedCard (penalties_related) used
// to read .body". That fix taught spec cards to read bodies and never
// taught related cards to read rows. Half a fix is how the second half
// survives, and it survived in production for weeks.
//
// So this file does not check for "null". It checks the property that
// makes "null" impossible: what a country AUTHORED is what the reader
// SEES. Both directions, over every country and every card section,
// because the same renderer bug will next appear in whichever section
// nobody is looking at.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("deep dive cards");

const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;
const { d1 } = await openReplayDb();
const all = async (sql) => (await d1.prepare(sql).bind().all()).results || [];

const env = {
  eicc_content: d1,
  ASSETS: {
    async fetch(req) {
      const p = new URL(req.url).pathname;
      try { return new Response(readFileSync(join(REPO, p.replace(/^\//, "")), "utf8")); }
      catch { return new Response("not found", { status: 404 }); }
    },
  },
  SESSION_SECRET: "test-secret-not-a-real-one",
  ROI_PUBLIC: "true",
};
const get = (path) => worker.fetch(
  new Request(`https://e-invoicingcompliancecorner.com${path}`), env, { waitUntil() {} });

const countries = await all(
  "SELECT slug, name_en FROM countries WHERE slug IS NOT NULL AND code != 'EU' ORDER BY slug");
t.check("there are country pages to read", countries.length >= 50, `${countries.length}`);

const cards = await all(`
  SELECT c.name_en AS country, c.slug, d.section, d.sort_order,
         t.title, t.rows_json, t.body, t.note
    FROM deep_dive_cards d
    JOIN deep_dive_card_translations t ON t.card_id = d.id AND t.lang = 'en'
    JOIN countries c ON c.id = d.country_id
   WHERE c.slug IS NOT NULL
   ORDER BY c.name_en, d.section, d.sort_order`);
t.check("there are cards to check", cards.length >= 200, `${cards.length} cards`);

// One render per country, reused by every check below.
const pages = new Map();
for (const c of countries) {
  const res = await get(`/${c.slug}`);
  pages.set(c.name_en, res.status === 200 ? await res.text() : "");
}
const textOf = (html) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&")
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/\s+/g, " ");

// ---- 1. no placeholder ever reaches a reader ---------------------------
//
// The symptom this file was written for. Checked on the rendered TEXT,
// not the markup, so a legitimate attribute or class containing the word
// cannot mask a real one — and a bare "null" between tags cannot hide.
{
  const bad = [];
  for (const [name, html] of pages) {
    if (!html) continue;
    const stray = textOf(html).match(/(?:^|[\s>(])(null|undefined|NaN|\[object Object\])(?=[\s<).,]|$)/g);
    if (stray) bad.push(`${name}: ${[...new Set(stray.map((s) => s.trim()))].join(", ")}`);
  }
  t.check("no deep dive renders a placeholder value as content",
    bad.length === 0, bad.slice(0, 10).join("; "));
}

// ---- 2. every authored card renders its own content -------------------
//
// The property that makes check 1 impossible to fail rather than merely
// unlikely. A card that carries rows must put those rows on the page; a
// card that carries a body must put the body there.
{
  const missing = [];
  for (const c of cards) {
    const html = pages.get(c.country);
    if (!html) continue;
    const text = textOf(html);
    if (!text.includes(c.title)) { missing.push(`${c.country} [${c.section}] title absent: ${c.title}`); continue; }
    let rows = [];
    try { rows = c.rows_json ? JSON.parse(c.rows_json) : []; } catch { rows = []; }
    // The first row is enough to prove the renderer reads rows at all;
    // checking every row would report the same defect hundreds of times.
    if (rows.length) {
      const [k, v] = rows[0];
      if (!text.includes(String(k)) || !text.includes(String(v).slice(0, 40))) {
        missing.push(`${c.country} [${c.section}/${c.sort_order}] rows not rendered: ${String(k).slice(0, 40)}`);
      }
    }
    if (c.body && !text.includes(String(c.body).slice(0, 40))) {
      missing.push(`${c.country} [${c.section}/${c.sort_order}] body not rendered`);
    }
    if (c.note && !text.includes(String(c.note).slice(0, 40))) {
      missing.push(`${c.country} [${c.section}/${c.sort_order}] note not rendered`);
    }
  }
  t.check(`every authored card renders its content (${cards.length} cards)`,
    missing.length === 0, missing.slice(0, 10).join("; ")
      + (missing.length > 10 ? ` … and ${missing.length - 10} more` : ""));
}

// ---- 3. the sections are covered, not just the one that broke ---------
//
// If a future card section is added and its renderer has the same gap,
// check 2 covers it only if this file is reading that section at all.
// Stating the reach makes a silently-narrowed sweep visible.
{
  const bySection = cards.reduce((a, c) => { a[c.section] = (a[c.section] || 0) + 1; return a; }, {});
  const sections = Object.keys(bySection).sort();
  t.check("all three card sections are represented in the sweep",
    sections.length >= 3, sections.map((s) => `${s} ${bySection[s]}`).join(", "));
}

// ---- 4. a card with nothing in it is not rendered as an empty box -----
//
// The other half of the same judgement. A titled card with no rows, body
// or note reads to a reader as content that failed to load, which is
// worse than its absence — so the renderers skip it, and this pins that.
{
  const empties = cards.filter((c) => !c.rows_json && !c.body && !c.note);
  const shown = empties.filter((c) => (pages.get(c.country) || "").includes(`>${c.title}<`));
  t.check(`a card with no content is not rendered at all (${empties.length} such cards)`,
    shown.length === 0, shown.map((c) => `${c.country}: ${c.title}`).join("; "));
}

console.log(`\n  note  ${cards.length} cards across ${pages.size} rendered country pages`);

process.exit(t.report() ? 0 : 1);
