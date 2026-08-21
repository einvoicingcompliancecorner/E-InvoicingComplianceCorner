// guides-render.mjs — Compliance Guides: pick your countries, get one
// printable briefing pack.
//
// Dan, 21 August 2026: "a new page under Resources... lets the user select
// the countries they are interested in, and download a PDF guide for each
// country, which would be based on content from the deep-dives. This
// should be a gated page." Then, mid-build: "try and orient the deep-dive
// information for each country onto one page only. Each country should not
// occupy more than one page." And: "with 70 countries tracked, it might
// already get pretty big."
//
// Those three sentences are the whole design brief, and the last two are
// constraints that fight the first.
//
// ---- ONE PAGE PER COUNTRY IS THE HARD RULE ----------------------------
//
// A rendered deep dive runs four to six printed pages. Dan chose "the
// whole deep dive" for the guide's content and then set a one-page limit,
// which cannot both be honoured literally. The resolution here, stated
// plainly because a future editor will otherwise read the omissions as
// oversights:
//
//   Everything STRUCTURED survives -- the mandate summary, every stat,
//   every dated milestone, the whole penalty table, every card's key/value
//   rows, every step's title. These are what somebody actually looks a
//   country up FOR.
//
//   The PROSE is what gives way, in a fixed order, and only as far as it
//   has to for that country: card notes first, then card body paragraphs,
//   then step descriptions. See CONDENSE below. The order is deliberate --
//   it removes commentary before it removes fact.
//
//   And the page always carries a link to the full deep dive, so nothing
//   is lost, only relocated. A guide that quietly dropped half a country's
//   content would be this project's favourite defect wearing a new hat.
//
// Every condensation is REPORTED rather than silent: renderGuideDocument
// returns a `condensed` array naming each country and what was dropped,
// and tests/guides.mjs asserts the rule held for all 70.
//
// ---- AND THE QUERIES DO NOT SCALE WITH THE SELECTION ------------------
//
// getDeepDiveContent() in deep-dive-render.mjs takes ONE country and runs
// six queries, plus one more per lifecycle card. Called in a loop for a
// reader who ticks all seventy, that is upwards of four hundred round
// trips in a single request -- which is Dan's "it might already get pretty
// big", and he is right.
//
// So every getter here takes the whole SET and runs one query with an IN
// clause, grouping in JS. Six queries for one country and six for seventy.
// The lifecycle cards are not fetched at all: they are the flow-diagram
// pills, they are the one N+1 in the original, and they are decoration on
// a page this dense.
import { escapeHtml, translateCountryName, deriveFlagFromCode } from "./deep-dive-render.mjs";

/** Placeholders in a translated string: {0}, {1}... */
function fill(str, ...args) {
  return String(str).replace(/\{(\d+)\}/g, (m, i) => (args[i] === undefined ? m : args[i]));
}

// ---- the strings -------------------------------------------------------
//
// Same contract as the planner: t(key, English) reads the `guides`
// namespace and falls back to the English written here. The migration that
// loads the other three languages is GENERATED from these fallbacks rather
// than retyped, so the two cannot drift -- tests/guides-i18n.mjs compares
// them character for character.
export function makeT(strings) {
  return (key, fallback) => {
    const v = strings && strings[key];
    return typeof v === "string" && v ? v : fallback;
  };
}

// ---- content, fetched for the whole selection at once ------------------

function placeholders(n) { return new Array(n).fill("?").join(","); }

/** Dan's "maximum of three", and the number the strip is laid out for. */
export const STORIES_PER_COUNTRY = 3;

/** The first sentence of a summary, which is what the card shows.
 *  Abbreviations are the trap here -- splitting on every full stop turns
 *  "approx. 40% of filers" into a one-word card. So a sentence has to end
 *  with a stop followed by a space and a capital, and a very short result
 *  is treated as a bad split and the whole summary kept. */
export function firstSentence(text) {
  const s = String(text || "").trim();
  const m = s.match(/^(.+?[.!?])\s+[A-Z0-9"«“]/);
  const cut = m ? m[1] : s;
  return cut.length < 40 ? s : cut;
}

async function all(db, sql, params) {
  const { results } = await db.prepare(sql).bind(...params).all();
  return results || [];
}

/**
 * Everything the guide needs for a set of countries, in six queries.
 * Returns a Map keyed by countries.name_en.
 */
export async function getGuideBundle(db, names, lang) {
  if (!names.length) return new Map();
  const p = placeholders(names.length);
  const args = [lang, ...names];

  const pages = await all(db, `
    SELECT c.name_en, c.code, c.region, c.roi_complexity, c.eu_member,
           ddp.last_updated,
           COALESCE(dpt.compliance_model, dpt_en.compliance_model) AS compliance_model,
           COALESCE(dpt.mandate_summary, dpt_en.mandate_summary)   AS mandate_summary,
           COALESCE(dpt.timeline_intro, dpt_en.timeline_intro)     AS timeline_intro,
           COALESCE(dpt.footer_disclaimer, dpt_en.footer_disclaimer) AS footer_disclaimer
    FROM countries c
    JOIN deep_dive_pages ddp ON ddp.country_id = c.id
    LEFT JOIN deep_dive_page_translations dpt    ON dpt.country_id = c.id AND dpt.lang = ?1
    LEFT JOIN deep_dive_page_translations dpt_en ON dpt_en.country_id = c.id AND dpt_en.lang = 'en'
    WHERE c.name_en IN (${p})`, args);

  const stats = await all(db, `
    SELECT c.name_en,
           COALESCE(dst.stat_value, dst_en.stat_value) AS stat_value,
           COALESCE(dst.stat_label, dst_en.stat_label) AS stat_label
    FROM deep_dive_stats ds
    JOIN countries c ON c.id = ds.country_id
    LEFT JOIN deep_dive_stat_translations dst    ON dst.stat_id = ds.id AND dst.lang = ?1
    LEFT JOIN deep_dive_stat_translations dst_en ON dst_en.stat_id = ds.id AND dst_en.lang = 'en'
    WHERE c.name_en IN (${p}) ORDER BY c.name_en, ds.sort_order`, args);

  const cards = await all(db, `
    SELECT c.name_en, dc.section,
           COALESCE(dct.title, dct_en.title)       AS title,
           COALESCE(dct.rows_json, dct_en.rows_json) AS rows_json,
           COALESCE(dct.note, dct_en.note)         AS note,
           COALESCE(dct.body, dct_en.body)         AS body
    FROM deep_dive_cards dc
    JOIN countries c ON c.id = dc.country_id
    LEFT JOIN deep_dive_card_translations dct    ON dct.card_id = dc.id AND dct.lang = ?1
    LEFT JOIN deep_dive_card_translations dct_en ON dct_en.card_id = dc.id AND dct_en.lang = 'en'
    WHERE c.name_en IN (${p}) ORDER BY c.name_en, dc.section, dc.sort_order`, args);

  const steps = await all(db, `
    SELECT c.name_en,
           COALESCE(dstt.title, dstt_en.title)             AS title,
           COALESCE(dstt.description, dstt_en.description) AS description
    FROM deep_dive_steps dst
    JOIN countries c ON c.id = dst.country_id
    LEFT JOIN deep_dive_step_translations dstt    ON dstt.step_id = dst.id AND dstt.lang = ?1
    LEFT JOIN deep_dive_step_translations dstt_en ON dstt_en.step_id = dst.id AND dstt_en.lang = 'en'
    WHERE c.name_en IN (${p}) ORDER BY c.name_en, dst.sort_order`, args);

  const penalties = await all(db, `
    SELECT c.name_en,
           COALESCE(dprt.failure_description, dprt_en.failure_description) AS failure_description,
           COALESCE(dprt.fine_amount, dprt_en.fine_amount) AS fine_amount,
           COALESCE(dprt.annual_cap, dprt_en.annual_cap)   AS annual_cap
    FROM deep_dive_penalty_rows dpr
    JOIN countries c ON c.id = dpr.country_id
    LEFT JOIN deep_dive_penalty_row_translations dprt    ON dprt.row_id = dpr.id AND dprt.lang = ?1
    LEFT JOIN deep_dive_penalty_row_translations dprt_en ON dprt_en.row_id = dpr.id AND dprt_en.lang = 'en'
    WHERE c.name_en IN (${p}) ORDER BY c.name_en, dpr.sort_order`, args);

  // MILESTONES ARE THE ONE THING A GUIDE CANNOT BE WRONG ABOUT, so they
  // come from the same on_tracker filter the board and the planner use.
  // on_tracker is a PRESENTATION flag rather than a statement of fact --
  // recorded at length in the project pointer -- but it is the flag that
  // decides what this site shows as a live obligation, and a guide that
  // disagreed with the board it is drawn from would be worse than one
  // that inherits its editorial judgement.
  const milestones = await all(db, `
    SELECT c.name_en, m.date, m.anchor,
           COALESCE(mt.system, mt_en.system) AS system,
           COALESCE(mt.desc, mt_en.desc)     AS desc
    FROM milestones m
    JOIN countries c ON c.id = m.country_id
    LEFT JOIN milestone_translations mt    ON mt.milestone_id = m.id AND mt.lang = ?1
    LEFT JOIN milestone_translations mt_en ON mt_en.milestone_id = m.id AND mt_en.lang = 'en'
    WHERE c.name_en IN (${p}) AND m.on_tracker = 1
    ORDER BY c.name_en, m.date`, args);

  const portals = await all(db, `
    SELECT c.name_en, dp.url, COALESCE(dpt.label, dpt_en.label) AS label
    FROM deep_dive_portals dp
    JOIN countries c ON c.id = dp.country_id
    LEFT JOIN deep_dive_portal_translations dpt    ON dpt.portal_id = dp.id AND dpt.lang = ?1
    LEFT JOIN deep_dive_portal_translations dpt_en ON dpt_en.portal_id = dp.id AND dpt_en.lang = 'en'
    WHERE c.name_en IN (${p}) ORDER BY c.name_en, dp.sort_order`, args);

  // NEWSLETTER STORIES, three per country, newest first.
  //
  // Dan, 21 August 2026: "a small section at the bottom of each page with
  // Newsletter Articles - maximum of three cards listed horizontally in
  // their own boxes. Each with a small headline and summary, maybe the
  // first sentence, but with a hyperlink to the actual article on our
  // site."
  //
  // Batched like everything else here: one query for the whole selection,
  // windowed to three per country in JS rather than seventy correlated
  // subqueries. published = 1 only -- the flag exists to stage a story
  // before it is ready, and a guide is exactly where an unready one would
  // do damage.
  const stories = await all(db, `
    SELECT c.name_en, s.id, s.date,
           COALESCE(st.title, st_en.title)     AS title,
           COALESCE(st.summary, st_en.summary) AS summary
    FROM stories s
    JOIN story_countries sc ON sc.story_id = s.id
    JOIN countries c ON c.id = sc.country_id
    LEFT JOIN story_translations st    ON st.story_id = s.id AND st.lang = ?1
    LEFT JOIN story_translations st_en ON st_en.story_id = s.id AND st_en.lang = 'en'
    WHERE c.name_en IN (${p}) AND s.published = 1
    ORDER BY c.name_en, s.date DESC`, args);

  const out = new Map();
  for (const row of pages) {
    out.set(row.name_en, { ...row, stats: [], cards: [], steps: [], penalties: [], milestones: [], portals: [], stories: [] });
  }
  const push = (rows, key, map) => {
    for (const r of rows) {
      const c = out.get(r.name_en);
      if (c) c[key].push(map ? map(r) : r);
    }
  };
  push(stats, "stats");
  push(cards, "cards", (r) => ({
    section: r.section, title: r.title, note: r.note, body: r.body,
    rows: r.rows_json ? safeJson(r.rows_json) : null,
  }));
  push(steps, "steps");
  push(penalties, "penalties");
  push(milestones, "milestones");
  push(portals, "portals");
  // Newest three. The query is already ordered by date DESC per country.
  for (const r of stories) {
    const c = out.get(r.name_en);
    if (c && c.stories.length < STORIES_PER_COUNTRY) c.stories.push(r);
  }
  return out;
}

// rows_json is authored by hand in migrations. A malformed one should cost
// that card, not the whole guide.
function safeJson(s) {
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : null; }
  catch (e) { return null; }
}

// ---- the timeline window ----------------------------------------------
//
// Dan, 21 August 2026: "the compliance timeline can be limited. Perhaps
// include most recently and future events only. Some countries already
// live for many years do not need a full history."
//
// Exactly right, and it is a content judgement rather than a space saving,
// though it is both. A guide answers "what do I have to do about this
// country" -- and for Chile or Argentina, live since 2015 and 2019, six
// historical rows push the one dated thing that has not happened yet off
// the page. The history belongs on the deep dive, which is linked.
//
// THE RULE: every future-dated milestone, plus the most recent PAST_KEEP
// that have already passed. The past ones stay because "in force since
// April 2019" is the sentence that tells a reader they are already late,
// and a guide showing only future dates would make a mature mandate look
// like a future project. Two is enough to establish that without becoming
// a history.
//
// A country whose obligations are ALL in the past keeps its most recent
// two and nothing else, which is the correct answer for it: there is
// nothing coming, and that is the finding.
export const PAST_KEEP = 2;

export function windowMilestones(milestones, todayISO) {
  const today = todayISO || new Date().toISOString().slice(0, 10);
  const past = milestones.filter((m) => m.date && m.date < today);
  const future = milestones.filter((m) => m.date && m.date >= today);
  const keptPast = past.slice(-PAST_KEEP);
  return {
    rows: [...keptPast, ...future],
    // The ones it left out, oldest first -- kept rather than discarded so
    // the fitter can put them back on a country with room to spare. Dates
    // and system names only: the descriptions are what made the full
    // history too heavy to show by default.
    hidden: past.slice(0, Math.max(0, past.length - PAST_KEEP)),
    hiddenPast: past.length - keptPast.length,
    future,
  };
}

// ---- the summary front page -------------------------------------------
//
// Dan chose this over content alone: "a one-page cross-country table --
// deadline, model, complexity per selected country -- so the reader sees
// their whole footprint before the detail."
//
// The next dated deadline is computed here rather than stored, from the
// same milestone set the country pages use, so the front page and the
// page it summarises cannot disagree.
export function summariseForFront(bundle, order, todayISO) {
  const today = todayISO || new Date().toISOString().slice(0, 10);
  return order.map((name) => {
    const c = bundle.get(name);
    if (!c) return null;
    const w = windowMilestones(c.milestones, today);
    const next = w.future.length ? w.future[0] : null;
    return {
      name,
      code: c.code,
      region: c.region,
      complexity: c.roi_complexity,
      euMember: !!c.eu_member,
      model: c.compliance_model,
      nextDate: next ? next.date : null,
      nextWhat: next ? next.system : null,
      milestoneCount: w.rows.length,
      // Named so the front page can say "in force" rather than leaving a
      // dash that reads as "we do not know".
      inForceOnly: w.future.length === 0 && c.milestones.length > 0,
    };
  }).filter(Boolean);
}

// ---- the condensation ladder ------------------------------------------
//
// WHY A LADDER AND NOT A BUDGET. The honest way to fit one page would be
// to measure the rendered height, which no server can do. So the rule is
// structural and deterministic instead: an estimated length is computed
// from the content itself, and prose is shed a rung at a time until the
// estimate fits. Deterministic matters more than exact -- the same country
// must produce the same page every time, or a reader printing twice gets
// two different documents.
//
// The estimate is calibrated against real rendered pages (see
// tests/guides.mjs, which prints all seventy and counts). It is a
// proxy, and the test is what keeps the proxy honest.
// CALIBRATED AGAINST RENDERED PAGES, NOT GUESSED. The first value here was
// 2350 characters, picked by eye, and every one of the six countries first
// measured ran over -- including the one that shed the least prose, which
// is how it became obvious the estimate was measuring the wrong thing.
//
// It now predicts HEIGHT rather than counting characters, from the four
// things that actually drive it: prose length, the number of key/value
// rows, the number of timeline entries and the number of steps. The
// coefficients are px-per-unit fitted to measured pages (tmpwork mock, six
// countries spanning the corpus), and tests/guides.mjs re-measures all
// seventy so the fit cannot rot quietly.
const PAGE_PX = 1010;         // A4 content box at 13mm/12mm margins, 96dpi
// A MARGIN, BECAUSE THE MODEL HAS ERROR BARS AND THE RULE DOES NOT.
// The fit's mean absolute error is ~113px and its worst case ~570px. A
// ladder that aims at exactly one page therefore lands just over it for
// the countries nearest the line -- Costa Rica measured 1.02 pages while
// the estimate said it fitted. Aiming at 92% of the page costs a little
// density on the fullest sheets and is the difference between a rule that
// holds and one that nearly holds.
// A COARSE PRE-PASS ONLY, now that GUIDE_FIT_SCRIPT does the real fitting
// in the browser. Its job is to keep a seventy-country pack from shipping
// megabytes of prose that would only be removed on arrival -- not to
// decide what fits. Set well ABOVE a page on purpose: trimming here is
// permanent and blind, trimming there is measured.
const TARGET_PX = Math.round(PAGE_PX * 1.30);
// FITTED, NOT CHOSEN. Least squares over all seventy countries rendered in
// print emulation (tmpwork/fit.mjs). The first two attempts at these
// numbers were picked by eye and were wrong in both directions -- too
// small, so nothing condensed and every page overflowed; then too large.
// The dominant term is not prose at all: it is the key/value rows, at
// ~32px each, which is why a country with nine fact cards overflows even
// with every sentence stripped out of it.
const FIXED_PX = 380;
const PX_PER_CHAR = 0.224;
const PX_PER_KV = 32.4;

export const CONDENSE = ["notes", "bodies", "stepDescriptions", "milestoneDescriptions"];

// THE LAST RUNG, AND THE ONLY ONE THAT TOUCHES FACTS.
//
// After every sentence has gone, a handful of countries are still over --
// Costa Rica at 1.12 pages with nine fact cards behind it. Nothing is left
// to cut except the key/value rows themselves, which are the densest and
// most useful thing on the sheet, so this is a cap rather than a rung: keep
// as many rows as the remaining space holds, in the order the deep dive
// puts them, and say on the page how many were left behind.
//
// A silent truncation here would be indefensible -- a compliance sheet that
// quietly stops listing requirements is worse than one that admits it is a
// summary. So the count is printed and it links to the full page.
function rowBudget(fixedPlusProsePx) {
  return Math.max(6, Math.floor((TARGET_PX - fixedPlusProsePx) / PX_PER_KV));
}

function proseLength(c) {
  let n = (c.mandate_summary || "").length;
  for (const card of c.cards) n += (card.note || "").length + (card.body || "").length;
  for (const s of c.steps) n += (s.description || "").length;
  for (const m of windowMilestones(c.milestones, c.__today).rows) n += (m.desc || "").length;
  return n;
}

/**
 * Decide, deterministically, what this country has to shed to fit a page.
 * Returns { drop: Set, dropped: string[] }.
 */
export function planCondensation(c) {
  const drop = new Set();
  const dropped = [];
  const tl = windowMilestones(c.milestones, c.__today).rows;
  const kvRows = c.cards.reduce((n, card) => n + ((card.rows || []).length || 1), 0);

  const measure = () => {
    let chars = (c.mandate_summary || "").length;
    for (const card of c.cards) {
      if (!drop.has("notes")) chars += (card.note || "").length;
      if (!drop.has("bodies")) chars += (card.body || "").length;
    }
    if (!drop.has("stepDescriptions")) for (const s of c.steps) chars += (s.description || "").length;
    if (!drop.has("milestoneDescriptions")) for (const m of tl) chars += (m.desc || "").length;
    // Prose flows two-up, so it costs half the height it would in one
    // column. The structural counts do not -- a key/value row is a row
    // whichever column it lands in.
    // Already flow-adjusted: the fit was done on the two-column render, so
    // the coefficients describe the page as it is actually laid out rather
    // than a single ribbon that then gets halved.
    return FIXED_PX + chars * PX_PER_CHAR + kvRows * PX_PER_KV;
  };
  for (const rung of CONDENSE) {
    if (measure() <= TARGET_PX) break;
    drop.add(rung);
    dropped.push(rung);
  }

  // Still over with nothing left to drop: cap the rows.
  let rowCap = Infinity, rowsHidden = 0;
  if (measure() > TARGET_PX) {
    const proseOnly = measure() - kvRows * PX_PER_KV;
    rowCap = rowBudget(proseOnly);
    rowsHidden = Math.max(0, kvRows - rowCap);
    if (rowsHidden) dropped.push("factRows");
  }
  return { drop, dropped, rowCap, rowsHidden,
    estimate: Math.round(measure()), fits: measure() <= TARGET_PX, raw: proseLength(c) };
}

// ---- the printed document ---------------------------------------------
//
// A4, because this is a document rather than a screen. Two columns inside
// each country so the structure (timeline, penalties, key facts, steps)
// sits side by side rather than in one long ribbon -- that is what makes
// one page possible at all.
export const GUIDE_STYLE = `
/* INK ON WHITE, AND NOT AS AN OVERRIDE.
   Dan, 21 August 2026: "this may need to be printed, so we need to abandon
   the dark background. The roi-calculator permits a PDF download, so
   similar look and feel to that would be preferable."
   The first version was the site's navy with a print stylesheet on top,
   which is the wrong way round for a document whose only purpose is to be
   printed -- it makes the thing you see the thing you do not use. So the
   light treatment IS the design here, on screen and on paper both, and it
   borrows the planner's PDF idiom directly: #111 on white, mono uppercase
   section rules in #7a5a20, hairline borders, Big Shoulders masthead. A
   reader who prints the planner and a guide gets two documents that
   plainly come from the same place. */
@page { size: A4 portrait; margin: 13mm 12mm; }
*{box-sizing:border-box}
html,body{background:#fff;color:#111}
body{margin:0;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:8.6pt;line-height:1.32}
a{color:inherit;text-decoration:none}
h1,h2,h3,h4{font-family:'Big Shoulders Display','IBM Plex Sans',sans-serif;margin:0}
.sheet{max-width:186mm;margin:0 auto}
.eyebrow{font-family:'IBM Plex Mono',monospace;font-size:7.4pt;letter-spacing:1.5px;
  text-transform:uppercase;color:#7a5a20;margin:0 0 3px}

/* ---- cover ---- */
.cover{break-after:page}
.cover .mast{display:flex;justify-content:space-between;align-items:flex-end;
  border-bottom:2px solid #111;padding-bottom:6px;margin:0 0 10px}
.cover h1{font-size:26pt;font-weight:800;text-transform:uppercase;letter-spacing:.4px;
  line-height:.95;color:#111;margin:0}
.cover .who{font-family:'IBM Plex Mono',monospace;font-size:7.2pt;letter-spacing:.7px;
  text-transform:uppercase;color:#555;text-align:right;line-height:1.5}
.cover .lede{color:#444;margin:0 0 12px;max-width:150mm;font-size:9pt}
table.summary{width:100%;border-collapse:collapse;font-size:8.4pt;color:#111;table-layout:fixed}
table.summary col.a{width:23%} table.summary col.b{width:15%} table.summary col.c{width:34%} table.summary col.d{width:28%}
table.summary th{font-family:'IBM Plex Mono',monospace;font-size:7.2pt;letter-spacing:.8px;
  text-transform:uppercase;color:#555;text-align:left;border-bottom:1px solid #999;
  padding:4px 6px 4px 0;font-weight:500}
table.summary td{padding:4px 6px 4px 0;border-bottom:1px solid #e2e2e2;vertical-align:top;color:#222}
table.summary td.date{font-family:'IBM Plex Mono',monospace;white-space:nowrap;color:#111}
.pill{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:6.6pt;
  letter-spacing:.5px;text-transform:uppercase;padding:1px 5px;border-radius:2px;
  border:1px solid #c9c9c9;color:#555;white-space:nowrap}
.pill.cx{border-color:#d8b878;color:#7a5a20}
.pill.eu{border-color:#a8ccb4;color:#2f7d55}

/* ---- one country ---- */
/* ONE SCALE FOR THE WHOLE DOCUMENT.
   Per-page scaling fitted every country but produced four different type
   sizes across one pack -- 100%, 96%, 92%, 88% -- and a reader flipping
   through sees that as the pages being inconsistent, which is the thing
   Dan raised in the first place. A designed document has one type size.
   88% is the size the densest pages need once the newsletter strip is
   kept, so it is the size they all get. The thin pages simply have more
   air, which the fitter then fills with the optional extras.
   The per-page fallback below still exists for anything that cannot fit
   even here -- it just no longer runs on two thirds of the pack. */
.country{break-after:page;zoom:0.88}
.country:last-child{break-after:auto}
.chead{display:flex;align-items:baseline;gap:8px;border-bottom:2px solid #111;
  padding-bottom:5px;margin-bottom:7px}
.chead .flag{font-size:16pt;line-height:1}
.chead h2{font-size:20pt;font-weight:800;text-transform:uppercase;letter-spacing:.3px;color:#111}
.chead .meta{margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:6.9pt;
  letter-spacing:.6px;text-transform:uppercase;color:#555;text-align:right;line-height:1.5}
.summ{margin:0 0 7px;color:#333;font-size:8.8pt}
.statstrip{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:0 0 8px}
.statstrip div{border:1px solid #c9c9c9;border-left:3px solid #6b7a95;padding:5px 7px;min-width:0}
.statstrip .v{font-family:'Big Shoulders Display',sans-serif;font-weight:700;font-size:14pt;color:#111;line-height:1}
.statstrip .l{font-size:6.9pt;color:#555;line-height:1.25;margin-top:2px}

/* THE COLUMNS FLOW, AND THE BIG BLOCK IS ALLOWED TO SPLIT.
   Germany's first render left a third of the page empty down the right and
   along the bottom. The cause was break-inside:avoid on the whole Key
   facts group: it carries about thirty rows, could not be divided, and so
   took a column to itself and pushed everything after it onto another
   page. The individual fact cards still stay whole -- splitting one across
   a column boundary is what actually looks broken -- but the group they
   sit in may now break wherever it needs to. */
.cols{column-count:2;column-gap:9px;orphans:2;widows:2}

/* SECTIONS ARE TILES. Dan, 21 August 2026: "would it be possible to put
   the sections into cards or tiles on the page... sometimes the wall of
   text is overwhelming."
   Right, and the reason is that the blocks had headings but no edges: five
   headings down one narrow column with nothing between them reads as one
   long ribbon no matter how well the fields inside it align.
   WHICH THING BECOMES A TILE IS THE WHOLE DESIGN. Timeline, penalties and
   steps are single indivisible sections, so each is one tile. Key facts is
   NOT -- it is eight or nine separate cards behind one heading, and boxing
   the group would make it unbreakable, which is exactly the mistake that
   left a third of Germany's page empty two rounds ago. So its heading
   stays bare and each FACT is its own tile: the run still flows across the
   column break, and every tile is whole.
   Chrome costs about 18px a tile. The fitter pays for it. */
.blk{margin:0 0 6px}
.blk.keep{break-inside:avoid;border:1px solid #d3d3d3;background:#fbfcfd;padding:5px 7px 5px}
.blk.bare > h3{margin-bottom:5px}
.blk > h3{font-family:'IBM Plex Mono',monospace;font-size:7.4pt;letter-spacing:1.2px;
  text-transform:uppercase;color:#7a5a20;margin:0 0 4px;break-after:avoid}
.tl{list-style:none;margin:0;padding:0}
.tl li{display:grid;grid-template-columns:14mm 1fr;gap:5px;padding:2.5px 0;
  border-bottom:1px solid #e2e2e2;break-inside:avoid}
.tl .d{font-family:'IBM Plex Mono',monospace;font-size:7.4pt;color:#7a5a20;white-space:nowrap}
.tl .s{font-weight:600;color:#111}
.tl .x{color:#555}
.tl li.past .d{color:#888}
table.pen{width:100%;border-collapse:collapse;font-size:8pt;color:#111;table-layout:fixed}
table.pen col.f{width:44%} table.pen col.n{width:34%} table.pen col.c{width:22%}
table.pen.nocap col.f{width:56%} table.pen.nocap col.n{width:44%}
table.pen th{font-family:'IBM Plex Mono',monospace;font-size:6.9pt;letter-spacing:.8px;
  text-transform:uppercase;color:#555;text-align:left;padding:0 5px 3px 0;
  border-bottom:1px solid #999;font-weight:500}
table.pen td{padding:3px 5px 3px 0;border-bottom:1px solid #e2e2e2;vertical-align:top;color:#222}
.kv{margin:0 0 5px;break-inside:avoid;border:1px solid #d3d3d3;background:#fbfcfd;
  border-top:2px solid #c8ccd2;padding:4px 7px 5px}
.kv h4{font-size:9.2pt;font-weight:700;color:#111;margin:0 0 3px}
/* ONE GRID PER CARD, NOT ONE PER ROW.
   Dan, 21 August 2026: "the tabulation of fields is inconsistent making
   [it] difficult to read in almost all sections of that page."
   Every row used to be its own auto/1fr grid, so the key column was
   sized to THAT row's key and every value started at a different x. Down
   Nigeria's Format & clearance card that is five different indents in
   five rows, and the eye has nothing to run along.
   The grid now lives on the container and the rows are display:contents,
   so every key in a card shares one column measured on the longest of
   them. fit-content caps it, because "Processing taxable supplies outside
   the fiscalisation system" as a key would otherwise leave no room for
   its own value. */
.kv .rows{display:grid;grid-template-columns:9.2em 1fr;column-gap:7px;row-gap:1.5px;align-items:start}
.kv .r{display:contents}
.kv .r .k{color:#666;font-size:7.7pt;line-height:1.25;overflow-wrap:anywhere}
.kv .r .v{color:#222;font-size:8.1pt;line-height:1.25}
.kv p{margin:2px 0 0;color:#444;font-size:8.1pt}
ol.steps{margin:0;padding-left:15px}
ol.steps li{padding:1.5px 0;break-inside:avoid}
ol.steps b{color:#111;font-weight:600}
ol.steps span{color:#555}
/* NEWSLETTER STRIP. Three boxes across the foot of the country page.
   It sits OUTSIDE .cols deliberately: it is a footer band, and letting it
   flow with the columns would put one card at the bottom of the left
   column and two at the top of the right.
   It is also invisible to the fitting script by construction -- none of
   the ladder's selectors reach inside .news -- because it is the thing
   Dan asked for rather than filler to be reclaimed when a page is tight.
   A dense country loses another fact row instead. */
.news{margin-top:9px;border-top:1px solid #bbb;padding-top:6px;break-inside:avoid}
.news > h3{font-family:'IBM Plex Mono',monospace;font-size:7.4pt;letter-spacing:1.2px;
  text-transform:uppercase;color:#7a5a20;margin:0 0 5px}
.news .row{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.news a{display:block;border:1px solid #c9c9c9;border-top:2px solid #7a5a20;
  padding:6px 8px;min-width:0}
.news .d{font-family:'IBM Plex Mono',monospace;font-size:6.6pt;letter-spacing:.5px;color:#777}
.news h4{font-size:8.8pt;font-weight:700;color:#111;margin:1px 0 2px;line-height:1.22}
.news p{margin:0;font-size:7.6pt;color:#444;line-height:1.3}
.news .go{display:block;margin-top:3px;font-family:'IBM Plex Mono',monospace;
  font-size:6.4pt;color:#7a5a20;overflow-wrap:anywhere}
.cfoot{border-top:1px solid #bbb;margin-top:7px;padding-top:4px;
  font-family:'IBM Plex Mono',monospace;font-size:6.9pt;color:#666;
  display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between}
@media screen{
  body{padding:16px;background:#eceff4}
  .sheet{background:#fff;padding:13mm 12mm;box-shadow:0 1px 4px rgba(0,0,0,.18)}
}
`;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function shortDate(d) {
  if (!d) return "";
  const [y, m] = String(d).split("-");
  return `${MONTHS[parseInt(m, 10) - 1] || ""} ${y}`;
}

/**
 * The whole pack: a summary page then one page per country.
 * Returns { html, condensed } — condensed names every country that had to
 * shed prose and what it shed, so a caller can report it rather than
 * leaving the reader to notice.
 */
export function renderGuideDocument({ bundle, order, lang, strings, today, siteOrigin,
  membersOrigin = "https://members.e-invoicingcompliancecorner.com", condense = true }) {
  const t = makeT(strings);
  const esc = escapeHtml;
  const rows = summariseForFront(bundle, order, today);
  const condensed = [];

  const cover = `<section class="cover">
  <div class="mast">
    <div><p class="eyebrow">${t("doc.eyebrow", "The E-Invoicing Compliance Corner")}</p>
      <h1>${t("doc.title", "Compliance guide")}</h1></div>
    <div class="who">${fill(t("doc.generated", "Generated {0}"), esc(today))}<br>${fill(t("doc.count", "{0} jurisdictions"), rows.length)}</div>
  </div>
  <p class="lede">${fill(t("doc.lede", "{0} jurisdictions, drawn from this site's tracked mandate data on {1}. Each country follows on its own page. Dates are the published obligations as we hold them; the full detail for every country is on its deep dive."), rows.length, esc(today))}</p>
  <table class="summary">
    <colgroup><col class="a"><col class="b"><col class="c"><col class="d"></colgroup>
    <tr><th>${t("col.country", "Jurisdiction")}</th><th>${t("col.next", "Next dated obligation")}</th>
        <th>${t("col.what", "What changes")}</th><th>${t("col.model", "Model")}</th></tr>
    ${rows.map((r) => `<tr>
      <td>${esc(translateCountryName(lang, r.name))} ${r.euMember ? `<span class="pill eu">${t("pill.eu", "EU")}</span>` : ""}${r.complexity === "complex" ? ` <span class="pill cx">${t("pill.complex", "Complex")}</span>` : ""}</td>
      <td class="date">${r.nextDate ? esc(r.nextDate) : `<span class="pill">${r.inForceOnly ? t("pill.inforce", "In force") : t("pill.nodate", "No dated step")}</span>`}</td>
      <td>${esc(r.nextWhat || "—")}</td>
      <td>${esc((r.model || "—").split(/[.;]/)[0].slice(0, 64))}</td>
    </tr>`).join("")}
  </table>
</section>`;

  const pages = order.map((name) => {
    const c = bundle.get(name);
    if (!c) return "";
    c.__today = today;
    // condense:false renders the deep dive whole, over however many pages
    // it takes. It exists for the calibration harness and for showing the
    // trade-off honestly -- NOT as a route option. A reader who could ask
    // for the uncondensed version would get a document whose length nobody
    // predicted, which is the thing the one-page rule exists to prevent.
    const plan = condense
      ? planCondensation(c)
      : { drop: new Set(), dropped: [], estimate: 0, fits: true, raw: 0 };
    if (plan.dropped.length) condensed.push({ country: name, dropped: plan.dropped, estimate: plan.estimate });
    const w = windowMilestones(c.milestones, today);
    const slug = String(name).toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");

    const stats = c.stats.slice(0, 5).map((s) =>
      `<div><div class="v">${esc(s.stat_value)}</div><div class="l">${esc(s.stat_label)}</div></div>`).join("");

    const timeline = w.rows.length ? `<div class="blk keep"><h3>${t("sec.timeline", "Compliance timeline")}</h3>
      <ul class="tl">${w.rows.map((m) => `<li class="${m.date < today ? "past" : ""}">
        <span class="d">${esc(shortDate(m.date))}</span>
        <span><span class="s">${esc(m.system || "")}</span>${m.desc && !plan.drop.has("milestoneDescriptions") ? ` <span class="x">${esc(m.desc)}</span>` : ""}</span>
      </li>`).join("")}</ul>
      ${w.hiddenPast ? `<ul class="tl" data-opt="history" style="display:none">${
        w.hidden.map((m) => `<li class="past">
          <span class="d">${esc(shortDate(m.date))}</span>
          <span><span class="s">${esc(m.system || "")}</span></span>
        </li>`).join("")}</ul>
        <p class="tlnote" data-optnote style="margin:3px 0 0;font-size:7.4pt;color:#777">${
          fill(t("tl.hidden", "{0} earlier milestones are on the full deep dive."), w.hiddenPast)}</p>` : ""}
    </div>` : "";

    // A COLUMN THAT SAYS THE SAME THING ON EVERY ROW IS NOT A COLUMN.
    // Azerbaijan prints "No cap published" five times down the annual-cap
    // column; Spain prints an em dash four times. That is a third of the
    // table's width carrying one fact, on the page that is hardest to fit.
    // Collapsed into a line under the table when every row agrees, which
    // reads better AND is the cheapest height this sheet has to give.
    const caps = c.penalties.map((r) => (r.annual_cap || "").trim());
    const capsAllSame = caps.length > 1 && caps.every((v) => v === caps[0]);
    const penalties = c.penalties.length ? `<div class="blk keep"><h3>${t("sec.penalties", "Penalties")}</h3>
      <table class="pen${capsAllSame ? " nocap" : ""}">
      <colgroup><col class="f"><col class="n">${capsAllSame ? "" : '<col class="c">'}</colgroup>
      <tr><th>${t("col.failure", "Failure")}</th><th>${t("col.fine", "Fine")}</th>${
        capsAllSame ? "" : `<th>${t("col.cap", "Annual cap")}</th>`}</tr>
      ${c.penalties.map((r) => `<tr><td>${esc(r.failure_description)}</td><td>${esc(r.fine_amount || "—")}</td>${
        capsAllSame ? "" : `<td>${esc(r.annual_cap || "—")}</td>`}</tr>`).join("")}
      </table>${capsAllSame ? `<p style="margin:3px 0 0;font-size:7.4pt;color:#666">${
        fill(t("pen.capsAll", "Annual cap: {0}"), esc(caps[0] || "—"))}</p>` : ""}</div>` : "";

    let rowsLeft = plan.rowCap === undefined ? Infinity : plan.rowCap;
    const facts = c.cards.length ? `<div class="blk bare"><h3>${t("sec.facts", "Key facts")}</h3>
      ${c.cards.map((card) => {
        const take = (card.rows || []).slice(0, Math.max(0, rowsLeft));
        rowsLeft -= take.length;
        const rws = take.length ? `<div class="rows">${take.map(([k, v]) =>
          `<div class="r"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join("")}</div>` : "";
        const body = !plan.drop.has("bodies") && card.body ? `<p>${esc(card.body)}</p>` : "";
        const note = !plan.drop.has("notes") && card.note ? `<p>${esc(card.note)}</p>` : "";
        if (!rws && !body && !note) return "";
        return `<div class="kv"><h4>${esc(card.title)}</h4>${rws}${body}${note}</div>`;
      }).join("")}
      <p class="kv" data-more="${esc(t("facts.more", "{0} further detail rows are on the full deep dive."))}"
         data-more-one="${esc(t("facts.more.one", "1 further detail row is on the full deep dive."))}"
         style="display:none;border:0;background:none;padding:0;color:#666;font-size:7.6pt"></p>
      </div>` : "";

    const steps = c.steps.length ? `<div class="blk keep"><h3>${t("sec.steps", "What to do")}</h3>
      <ol class="steps">${c.steps.map((s) => `<li><b>${esc(s.title)}</b>${
        !plan.drop.has("stepDescriptions") && s.description ? ` <span>${esc(s.description)}</span>` : ""}</li>`).join("")}</ol></div>` : "";

    // THE LINK IS REAL, AND IT HAS TO SURVIVE PAPER.
    //
    // /members/archive/<id> is a genuine server route, so the anchor works
    // in the PDF a reader saves. But a printed sheet has no hyperlinks at
    // all, and a card that just says "read more" is a dead end on the one
    // medium this document is designed for -- so the URL is printed under
    // each card as well. That is also why the guide is gated: the archive
    // route requires a session, and sending a signed-out reader to a login
    // screen from a printed page would be the worse half of both worlds.
    // OPTIONAL, AND ONLY IF THERE IS ROOM. The portals are already named in
    // the footer; this spells out where each one lives, which is worth
    // having on a thin country and is the first thing to go on a full one.
    const sourcesExtra = c.portals.length ? `<div class="blk bare" data-opt="sources" style="display:none">
      <h3>${t("sec.sources", "Where this is tracked")}</h3>
      ${c.portals.map((pt) => `<div class="kv"><h4>${esc(pt.label)}</h4>
        <p style="font-family:'IBM Plex Mono',monospace;font-size:7pt;overflow-wrap:anywhere;margin:1px 0 0">${
          esc(String(pt.url || "").replace(/^https?:\/\//, ""))}</p></div>`).join("")}</div>` : "";

    const news = c.stories.length ? `<div class="news"><h3>${t("sec.news", "From the newsletter")}</h3>
      <div class="row">${c.stories.map((st) => {
        const href = `${membersOrigin}/members/archive/${encodeURIComponent(st.id)}`;
        return `<a href="${esc(href)}">
          <span class="d">${esc(st.date || "")}</span>
          <h4>${esc(st.title || "")}</h4>
          <p>${esc(firstSentence(st.summary))}</p>
          <span class="go">${esc(href.replace(/^https:\/\//, ""))}</span>
        </a>`;
      }).join("")}</div></div>` : "";

    return `<section class="country">
  <div class="chead">
    <span class="flag">${deriveFlagFromCode(c.code)}</span>
    <h2>${esc(translateCountryName(lang, name))}</h2>
    <div class="meta">${esc(c.region || "")}${c.last_updated ? `<br>${t("lbl.updated", "Updated")} ${esc(c.last_updated)}` : ""}</div>
  </div>
  ${c.mandate_summary ? `<p class="summ">${esc(c.mandate_summary)}</p>` : ""}
  ${stats ? `<div class="statstrip">${stats}</div>` : ""}
  <div class="cols">${timeline}${penalties}${facts}${steps}${sourcesExtra}</div>
  ${news}
  <div class="cfoot">
    <span>${c.portals.map((p) => esc(p.label)).join(" · ")}</span>
    <span>${fill(t("doc.full", "Full detail: {0}"), esc(`${siteOrigin}/${slug}`))}</span>
  </div>
</section>`;
  }).join("");

  return { html: `<div class="sheet">${cover}${pages}</div>`, condensed };
}

// ---- fitting the page, by measuring it -------------------------------
//
// THE SERVER CANNOT MEASURE A PAGE, SO IT SHOULD STOP PRETENDING TO.
//
// Three attempts at predicting height from content all failed the same
// way. A character count was wrong because the key/value rows dominate. A
// least-squares fit over all seventy countries did better and still
// carried ~130px of mean error with a NEGATIVE coefficient on steps --
// collinearity, not physics. Aiming under the line to absorb that error
// left the median page 79% full, which is the opposite of what Dan asked
// for: "need to make better use of real estate on the page."
//
// A predictor that is conservative enough to be safe is too conservative
// to be dense. The way out is not a better predictor. It is to measure in
// the one place where measuring is possible -- the browser that is about
// to print.
//
// So the server sends the whole country and this trims it to fit, using
// the same order the ladder used: commentary before fact, and facts last.
// It removes ONE element at a time and re-measures, so every page ends up
// as full as it can be without spilling. Exact, not estimated.
//
// IF IT DOES NOT RUN, NOTHING BREAKS. No JavaScript means some countries
// print over two pages, which is the old behaviour and is not a failure.
// That is why the server-side ladder stays as a coarse pre-pass: it keeps
// the payload sane for a seventy-country pack without being the thing the
// one-page rule depends on.
export const GUIDE_FIT_SCRIPT = `
(function(){
  var PAGE = ${1010};
  // Shed in this order. Each entry finds the next removable element within
  // one country; commentary goes before fact, and a fact row is the last
  // thing to go.
  var LADDER = [
    function(s){ return s.querySelector('.kv > p'); },
    function(s){ var n = s.querySelectorAll('ol.steps span'); return n[n.length-1]; },
    function(s){ var n = s.querySelectorAll('.tl .x'); return n[n.length-1]; },
    function(s){ var n = s.querySelectorAll('.kv .r'); return n[n.length-1]; },
    // THE LAST TWO RUNGS EXIST BECAUSE THE LADDER RAN OUT. Six countries
    // stopped 10-20px over with nothing left matching the rules above --
    // their remaining height was whole cards and steps, not rows. A ladder
    // that can run out is a ladder that quietly fails, so it now ends with
    // rungs that always match while anything removable is left: a trailing
    // step, then a trailing fact card. Both are counted and declared.
    function(s){ var n = s.querySelectorAll('ol.steps li'); return n.length > 1 ? n[n.length-1] : null; },
    function(s){ var n = s.querySelectorAll('.kv'); return n.length > 1 ? n[n.length-2] : null; },
    // "MAXIMUM OF THREE" IS A MAXIMUM. Dan's words, and they are what makes
    // these the right last rungs rather than a betrayal of the request: on
    // the twenty-odd countries whose facts alone fill a page, the strip
    // gives up its third card, then its second, before anything else does.
    // Dropping the whole strip is the final resort and means that country's
    // structure genuinely does not leave room for one more box.
  ];
  // NOT IN THE LADDER, and the reason is an ordering mistake worth keeping.
  //
  // These two used to sit at the end of the ladder above, so a page that
  // was 20px over gave up the whole newsletter strip -- 110px of content
  // Dan had specifically asked for -- while SCALING, which costs nothing at
  // all, had not yet been tried. Germany lost its strip to save six pixels.
  //
  // The right order is cheapest-first, and scaling is the only lever here
  // that loses nothing: shrink, then scale, and only sacrifice the strip if
  // a page cannot be saved by either. So these run after the zoom step.
  var NEWS_LADDER = [
    function(s){ var n = s.querySelectorAll('.news a'); return n.length > 1 ? n[n.length-1] : null; },
    function(s){ return s.querySelector('.news'); }
  ];
  function fit(section){
    var hidden = 0, guard = 0, rung = 0, undo = [];
    // A REMOVAL THAT DOES NOT SHRINK THE PAGE IS PURE LOSS, and the first
    // version of this did nothing else on a country like Azerbaijan.
    //
    // The section is two flowing columns, so its height is whichever column
    // is taller. Azerbaijan's height comes from a five-row penalty table on
    // the right; the ladder was dutifully deleting key/value rows from the
    // left, which changed the height by nothing at all. It emptied the Key
    // facts block completely, cut What to do from five steps to one, threw
    // away the whole newsletter strip -- and still left half the page
    // blank, because not one of those removals was on the critical path.
    //
    // So each removal is now provisional: take it out, re-measure, and put
    // it straight back if the page did not get shorter. When a rung stops
    // paying, move to the next one. The page ends up shedding only what is
    // actually in the way, which is also the answer to Dan's "build out the
    // white space with valuable information" -- most of what was being
    // destroyed never needed to go.
    while(section.getBoundingClientRect().height > PAGE && guard++ < 600){
      var el = null;
      while(rung < LADDER.length && !(el = LADDER[rung](section))) rung++;
      if(!el) break;                       // nothing left to give
      var before = section.getBoundingClientRect().height;
      var anchor = el.nextSibling, owner0 = el.parentNode;
      owner0.removeChild(el);
      if(section.getBoundingClientRect().height >= before){
        // No gain: restore it and stop trying this rung.
        owner0.insertBefore(el, anchor);
        rung++;
        continue;
      }
      // It paid. el is already out; remember where it came from, so the
      // grow pass below can reconsider it once everything else has settled.
      undo.push({ el: el, parent: owner0, anchor: anchor });
      if(el.classList && el.classList.contains('r')) hidden++;
      else if(el.classList && el.classList.contains('kv')) hidden += el.querySelectorAll('.r').length;
      var owner = owner0;
      // A CARD STRIPPED OF ITS LAST ROW IS A HEADING WITH NOTHING UNDER IT,
      // and five of those in a column is what the first version of this
      // shipped -- Germany printed "German CIUS quirks", "B2B: fully
      // decentralised", "Audit access" and two more as bare titles above a
      // line saying seventeen rows had moved elsewhere. It reads as a
      // rendering fault rather than a deliberate summary, which is worse
      // than either being complete or being absent.
      // So an emptied card goes with its rows. The effect is that the
      // ladder sheds whole cards from the end once it reaches this depth,
      // which is what it should have been doing all along.
      // .r rows now live inside a .rows wrapper, so "did this card empty"
      // has to be asked of the card, not of the row's immediate parent.
      if(owner.classList && owner.classList.contains('rows') && !owner.querySelector('.r')){
        var card0 = owner.parentNode; owner.parentNode.removeChild(owner); owner = card0;
      }
      if(owner.classList && owner.classList.contains('kv')
         && !owner.querySelector('.r') && !owner.querySelector('p')){
        owner.parentNode.removeChild(owner);
      }
    }
    // ---- AND NOW GROW IT BACK ----------------------------------------
    //
    // Dan, 21 August 2026: "there are still some countries like Costa Rica,
    // and Azerbaijan with limited information. If we can build out the
    // white space with valuable information (if it exists) that would be
    // optimal."
    //
    // Azerbaijan is the case that shows why shrinking alone is not enough.
    // Its height comes from a five-row penalty table, and nothing in the
    // ladder touches penalties -- so the only removal that ever paid was
    // the full-width newsletter strip. It surrendered 110px to save 15, and
    // left a quarter of the page empty for nothing.
    //
    // So the last thing that happens is the opposite of the first: walk the
    // removals backwards and put back whatever still fits, then reveal any
    // optional extras the page has room for. A page ends up as full as it
    // can be rather than as small as the ladder could make it.
    for(var u = undo.length - 1; u >= 0; u--){
      var it = undo[u];
      it.parent.insertBefore(it.el, it.anchor && it.anchor.parentNode === it.parent ? it.anchor : null);
      if(section.getBoundingClientRect().height > PAGE){
        it.parent.removeChild(it.el);      // still does not fit; leave it out
      } else {
        undo.splice(u, 1);
        if(it.el.classList && it.el.classList.contains('r')) hidden--;
        else if(it.el.classList && it.el.classList.contains('kv')) hidden -= it.el.querySelectorAll('.r').length;
      }
    }
    // Optional extras, in the order they are worth having. Each is rendered
    // hidden and revealed only if the page can carry it -- so a sparse
    // country gains history and sources, and a dense one never sees them.
    var extras = section.querySelectorAll('[data-opt]');
    for(var x = 0; x < extras.length; x++){
      extras[x].style.display = '';
      var note = extras[x].parentNode.querySelector('[data-optnote]');
      if(note) note.style.display = 'none';
      if(section.getBoundingClientRect().height > PAGE){
        extras[x].style.display = 'none';
        if(note) note.style.display = '';
        break;
      }
    }
    if(hidden > 0){
      var tag = section.querySelector('[data-more]');
      if(tag){
        // A COUNT SLOTTED INTO A PLURAL SENTENCE. "1 further detail rows
        // are on the full deep dive" was printing on Germany. The planner
        // learned this in migration 573 and selects on CLDR categories;
        // here there are exactly two cases and no arithmetic, so two
        // strings is the honest amount of machinery -- but a translator
        // still gets both, rather than one with a number jammed into it.
        tag.textContent = hidden === 1
          ? tag.getAttribute('data-more-one')
          : tag.getAttribute('data-more').replace('{0}', String(hidden));
        tag.style.display = '';
      }
    }
    // ---- AND IF IT STILL WILL NOT FIT, SET IT SMALLER --------------
    //
    // Dan, 21 August 2026: "remember our 1-page per country rule though."
    //
    // Six countries reached this point with nothing left that the ladder
    // was willing to take. Their remaining height is the header, the
    // mandate summary, the stats, the dated timeline and the penalty
    // table -- and the only way to cut those is to delete compliance
    // facts to satisfy a layout rule, which is the wrong trade in a
    // document somebody may act on.
    //
    // So the last resort costs nothing at all: the densest pages print a
    // little smaller. Type steps down in half-point increments to a floor
    // of 7pt, which is small but is still a readable briefing sheet --
    // below that it would be worse than a second page, so the floor is
    // real and the rule can still, in principle, fail loudly.
    //
    // Nothing is lost. A reader with a dense country gets every fact,
    // set tighter; a reader with a thin one sees no difference.
    // zoom, NOT font-size. Setting font-size on the section changes almost
    // nothing here: every rule in GUIDE_STYLE sets an absolute pt size, so
    // the children do not inherit it and the first version of this scaled
    // the two or three elements that happened to be unstyled. zoom scales
    // the whole laid-out box -- type, rules, tables and gaps together --
    // which is what "print it smaller" actually means.
    var z = 0.88;   // the document scale set in CSS; see .country
    function scaleTo(floor){
      while(section.getBoundingClientRect().height > PAGE && z > floor){
        z = Math.round((z - 0.04) * 100) / 100;
        section.style.zoom = z;
      }
    }
    // A modest scale first: 88% is still comfortable reading, and it saves
    // the strip on every page that is merely a little over.
    scaleTo(0.84);
    // Only now, if scaling alone was not enough, does content go.
    var nrung = 0;
    while(section.getBoundingClientRect().height > PAGE && nrung < NEWS_LADDER.length){
      var nel = NEWS_LADDER[nrung](section);
      if(!nel){ nrung++; continue; }
      nel.parentNode.removeChild(nel);
    }
    // And the hard floor for anything still standing.
    scaleTo(0.80);
    return section.getBoundingClientRect().height <= PAGE;
  }
  function run(){
    var over = [];
    var list = document.querySelectorAll('.country');
    for(var i=0;i<list.length;i++) if(!fit(list[i])) over.push(i);
    document.documentElement.setAttribute('data-fitted', String(list.length - over.length) + '/' + String(list.length));
  }
  // After webfonts, or the measurement is of the fallback face and every
  // line reflows underneath it.
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(run);
  else window.addEventListener('load', run);
})();
`;
