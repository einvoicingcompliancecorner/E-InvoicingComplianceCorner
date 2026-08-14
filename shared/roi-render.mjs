// ================================================================
// ROI & Wave Planner — shared renderer
// ================================================================
// A subscriber tool: build a board-ready e-invoicing business case from
// your own volumes and footprint, with a delivery wave plan back-planned
// from the REAL published deadlines this site already tracks.
//
// Same shape as shared/resources-render.mjs and shared/map-data.mjs: the
// D1 query and the HTML live here once, and both Workers import them.
// site-worker serves the public, SEO-indexable teaser at /roi-calculator
// with results locked; members-worker serves the same page unlocked at
// /members/roi-calculator behind requireSession(). Nothing is duplicated
// between them but the route registration.
//
// WHY THE GATE IS WHERE IT IS. The calculation itself runs client-side,
// so gating it server-side would be theatre — the value being protected
// is not the arithmetic. What genuinely cannot work for an anonymous
// visitor is "use my subscribed countries", which reads real saved
// preferences. So the public page is a complete, honest, indexable
// explanation with a worked example, and signing in unlocks the results
// plus the personalisation. Same reasoning as the Insights teaser split
// recorded in PROGRESS.md.
//
// EVERY BENCHMARK CARRIES AN EVIDENCE GRADE. This is not decoration —
// it is the reason this tool is worth using rather than a vendor's. The
// grades and their sourcing were verified in the 11 Aug 2026 research
// pass; see PROGRESS.md for what was corrected (notably: the circulating
// VAT-gap figures are European Commission/CASE, not OECD, and their own
// country analyses do not support a causal e-invoicing claim).
// ================================================================

// Country rows the calculator needs: mandate status, model complexity,
// the next dated B2B deadline, and whether a quantified penalty schedule
// exists. Deliberately mirrors computeCountryMapStatus()'s own logic in
// shared/map-data.mjs rather than reimplementing it differently — if the
// map says a country is "upcoming", this must agree.
export async function getRoiCountries(db, todayISO) {
  const today = todayISO || new Date().toISOString().slice(0, 10);
  // The European Union row is fetched deliberately and filtered out at the
  // end. It is not a jurisdiction anyone implements in, but it carries the
  // EU-wide milestones — and since migration 504 de-duplicated the eleven
  // per-country ViDA 2030 entries off the board, the surviving EU entry is
  // the ONLY on-tracker record of an obligation that binds 27 countries.
  const { results: countries } = await db.prepare(`
    SELECT c.id, c.name_en, c.code, c.region, c.slug, c.roi_complexity, c.eu_member,
           (SELECT COUNT(*) FROM deep_dive_penalty_rows p WHERE p.country_id = c.id) AS penalty_rows
      FROM countries c
     ORDER BY c.name_en
  `).all();
  const { results: ms } = await db.prepare(
    `SELECT country_id, date, mandate_scope, confidence FROM milestones WHERE on_tracker = 1`
  ).all();

  // OBLIGATIONS THE BOARD DOES NOT SHOW. `on_tracker` is a presentation
  // flag (migration 520); `obligation_status` is the substance. A row that
  // is off the board but classified 'live' is a real dated obligation that
  // every consumer filtering on on_tracker is blind to — and three
  // countries have one as their ONLY future deadline, so the planner
  // currently files Denmark, Portugal and Brazil under "no fixed deadline,
  // start any time".
  //
  // This is read for WARNING ONLY and deliberately does not feed the wave
  // plan. Changing what the planner schedules is a decision about the
  // product, not a side effect of making the data available; until that
  // decision is taken, the honest behaviour is to keep planning exactly as
  // before and tell the reader what is missing from it.
  const { results: hidden } = await db.prepare(
    `SELECT country_id, min(date) AS date FROM milestones
      WHERE on_tracker = 0 AND obligation_status = 'live'
        AND mandate_scope = 'b2b' AND date > ?
      GROUP BY country_id`
  ).bind(today).all();
  const hiddenBy = new Map(hidden.map((h) => [h.country_id, h.date]));

  const byCountry = new Map();
  for (const m of ms) {
    if (!byCountry.has(m.country_id)) byCountry.set(m.country_id, []);
    byCountry.get(m.country_id).push(m);
  }

  // EU-WIDE OBLIGATIONS APPLY TO MEMBER STATES.
  //
  // This reads the EU row's own live milestones rather than readmitting
  // the eleven off-board per-country copies, for two reasons. First, it
  // mirrors the reasoning behind the de-duplication itself: ViDA is one
  // EU fact, not eleven national ones, which is precisely why only the
  // European Union entry was kept on the board. Second, `on_tracker = 0`
  // turns out to do two unrelated jobs — of 159 off-tracker B2B
  // milestones, 148 are genuinely superseded or interim and only 11 are
  // true-but-deduplicated. A blanket readmission was modelled and moved
  // the United Kingdom's deadline from April 2029 to November 2026.
  //
  // Nothing here changes any milestone row, the Arrivals board, or the
  // deep-dive timelines — which never lost these entries in the first
  // place, since getMilestonesForCountry() applies no on_tracker filter.
  const euRow = countries.find((c) => c.code === "EU");
  const euWide = euRow
    ? (byCountry.get(euRow.id) || []).filter((m) => m.mandate_scope === "b2b" && m.date > today)
    : [];

  const REG = { "Europe": "Eu", "Middle East / Africa": "Mi", "Asia-Pacific": "As", "Americas": "Am" };
  return countries.filter((c) => c.code !== "EU").map((c) => {
    const mine = byCountry.get(c.id) || [];
    let status = "t";
    if (mine.some((m) => m.mandate_scope === "b2b" && m.date <= today)) status = "i";
    else if (mine.some((m) => m.mandate_scope === "b2b" && m.date > today && m.confidence !== "expected")) status = "u";
    else if (mine.some((m) => m.mandate_scope === "b2g_only" && m.date <= today)) status = "b";
    else if (mine.some((m) => m.mandate_scope === "b2b" && m.date > today && m.confidence === "expected")) status = "u";
    else if (mine.length) status = "n";

    // COMPLEXITY IS STORED, NOT INFERRED (migration 510, 12 Aug 2026).
    // This used to be a regex over deep_dive_page_translations
    // .compliance_model — a field written as prose for human readers —
    // which silently scored NINE countries with real B2B mandates as
    // having none, because their wording happened to miss five keywords.
    // Belgium, Denmark, Singapore and Uruguay were in force at the time;
    // Norway, Slovakia, Slovenia, Spain and the United Kingdom had dated
    // deadlines. A zero here does not just mean "low effort": it means
    // zero integrations AND exclusion from the wave plan, because
    // buildGantt() filters on `c[5] && c[4] > 0`. On the tool's own
    // default selection that halved the one-off cost and dropped the UK
    // out of a UK-facing business case.
    //
    // The lesson generalises past this one field: a customer-facing cost
    // driver inferred from prose cannot be made safe by improving the
    // pattern. Store the decision so it is reviewable and diffable.
    // Dan's scale, on whether the tax authority is a party to the
    // transaction: 2 = complex (CTC, clearance, invoice-level reporting,
    // or 5-corner), 1 = simple (decentralised 4-corner exchange only),
    // 0 = no mandate to build for.
    const CXVAL = { complex: 2, simple: 1, none: 0 };
    const cx = CXVAL[c.roi_complexity] ?? 0;

    const national = mine.filter((m) => m.date > today && m.mandate_scope === "b2b").map((m) => m.date).sort();
    const euDates = c.eu_member ? euWide.map((m) => m.date).sort() : [];
    const future = [...national, ...euDates].sort();

    // Status stays NATIONAL. An EU-wide deadline changes what you have to
    // deliver and when, but calling Austria "Upcoming" on a page where the
    // tracker board calls it "B2G only" would put two of this site's own
    // surfaces in visible disagreement. The EU-derived deadline is flagged
    // instead, and labelled EU-WIDE wherever it drives a row.
    const euDriven = future.length > 0 && !national.length && euDates.length > 0 ? 1 : 0;

    // AN EU-DRIVEN DEADLINE IS COMPLEX WORK.
    //
    // Dan settled this on 12 Aug 2026, and the rule is his: "If there is
    // clearance via CTC, 5-corner peppol, or some kind of digital
    // reporting, then that would be complex. If it is only 4-corner
    // peppol, no mandate at all, or e-Invoicing mandate only - this would
    // be simple." ViDA is not an exchange mandate: Council Directive (EU)
    // 2025/516 carries a Digital Reporting Requirement, so the tax
    // authority receives invoice-level data and the row qualifies as
    // complex on the plain reading of that rule.
    //
    // Note this deliberately overrides the country's STORED complexity,
    // and only for rows whose deadline is EU-driven. That is the point:
    // roi_complexity describes the regime a country runs TODAY, while the
    // row in the plan is scoped to the deadline actually being planned
    // for. Austria's own regime is 4-corner B2G and stays 'simple' in the
    // database; the 2030 wave it appears in is ViDA work and is priced as
    // complex. Getting that backwards in either direction would misprice
    // it — leaving it simple understates a reporting build, and changing
    // the stored value would misdescribe Austria everywhere else.
    const cxEff = euDriven ? 2 : cx;

    // Index 9: the earliest live obligation this country has that the board
    // does not show, or "" — surfaced so the render can warn when it is
    // planning a country as deadline-free that is not.
    const hiddenDate = hiddenBy.get(c.id) || "";
    return [c.name_en, c.code, REG[c.region] || "Eu", status, cxEff, future[0] || "", c.penalty_rows || 0, c.slug, euDriven,
            hiddenDate && (!future.length || hiddenDate < future[0]) ? hiddenDate : ""];
  });
}


// Benchmarks and phases come from D1 (migration 505), not from constants
// in this file. A benchmark is data: when Ardent publishes its 2026
// edition that should be a migration with a sourcing trail, exactly like
// a milestone correction — not an edit buried in a Worker deploy.
// Language falls back to English per row, so a partially-translated
// language degrades gracefully instead of rendering blanks.
export async function getRoiBenchmarks(db, lang = "en") {
  const { results } = await db.prepare(`
    SELECT b.key, b.default_value, b.unit, b.evidence_grade, b.source_url, b.source_year, b.is_cost, b.sort_order,
           COALESCE(t.label, te.label) AS label,
           COALESCE(t.hint, te.hint) AS hint,
           COALESCE(t.citation, te.citation) AS citation
      FROM roi_benchmarks b
      LEFT JOIN roi_benchmark_translations t  ON t.benchmark_id = b.id AND t.lang = ?1
      LEFT JOIN roi_benchmark_translations te ON te.benchmark_id = b.id AND te.lang = 'en'
     WHERE b.active = 1
     ORDER BY b.sort_order
  `).bind(lang).all();
  return results;
}

export async function getRoiPhases(db, lang = "en") {
  const { results } = await db.prepare(`
    SELECT p.key, p.default_weeks, p.colour, p.is_programme, p.scope, p.sort_order,
           COALESCE(t.name, te.name) AS name,
           COALESCE(t.note, te.note) AS note
      FROM roi_phases p
      LEFT JOIN roi_phase_translations t  ON t.phase_id = p.id AND t.lang = ?1
      LEFT JOIN roi_phase_translations te ON te.phase_id = p.id AND te.lang = 'en'
     ORDER BY p.sort_order
  `).bind(lang).all();
  return results;
}

// FX rates, stored and dated rather than fetched live. See migration 513:
// an ROI model built on Grade D placeholders cannot use the precision a
// live feed buys, and pays for it with a network dependency and a number
// that changes between two runs of the same scenario.
export async function getRoiFxRates(db) {
  const { results } = await db.prepare(
    `SELECT currency, usd_per_unit, as_of, source_url FROM roi_fx_rates`
  ).all();
  const out = {};
  for (const r of results) out[r.currency] = { r: r.usd_per_unit, asOf: r.as_of, src: r.source_url };
  if (!out.USD) out.USD = { r: 1, asOf: "", src: null };
  return out;
}

// Page chrome from the 'roi' translations namespace, same mechanism as
// every other page. Returns a plain object keyed by the translation key.
export async function getRoiStrings(db, lang = "en") {
  const { results } = await db.prepare(`
    SELECT key, COALESCE(
             (SELECT value FROM translations WHERE namespace='roi' AND key = t.key AND lang = ?1),
             (SELECT value FROM translations WHERE namespace='roi' AND key = t.key AND lang = 'en')
           ) AS value
      FROM (SELECT DISTINCT key FROM translations WHERE namespace='roi') t
  `).bind(lang).all();
  return Object.fromEntries(results.map((r) => [r.key, r.value]));
}

export const ROI_STYLE = `
:root{
  --ink:#0f1a2b; --ink-2:#152238; --ink-3:#1c2c48; --line:#2b3c5a;
  --paper:#efe9db; --paper-2:#e4dcc6; --paper-line:#c9bd9e;
  --text-lo:#f2f0e8; --muted:#93a3c0;
  --stamp:#b5432f; --stamp-dim:#7c3628;
  --live:#3f7d5c; --live-dim:#274a38;
  --soon:#c98a3a; --soon-dim:#6e4c22;
  --upcoming:#6b7a95; --upcoming-dim:#3a4864;
  --radius:10px;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--text-lo);font-family:'IBM Plex Sans',system-ui,sans-serif;line-height:1.55}
.wrap{max-width:1080px;margin:0 auto;padding:28px 20px 80px}
.eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--soon);margin:0 0 6px}
h1{font-family:'Big Shoulders Display',sans-serif;font-weight:800;font-size:clamp(30px,5vw,46px);line-height:1;letter-spacing:.5px;text-transform:uppercase;margin:0 0 10px}
h2{font-family:'Big Shoulders Display',sans-serif;font-weight:700;font-size:24px;text-transform:uppercase;letter-spacing:.6px;margin:34px 0 12px;border-bottom:1px solid var(--line);padding-bottom:8px}
h3{font-size:15px;margin:0 0 6px}
p{margin:0 0 12px}
.lede{color:var(--muted);max-width:70ch}
.card{background:var(--ink-2);color:var(--text-lo);border:1px solid var(--line);border-radius:var(--radius);padding:18px 20px;margin:0 0 14px}
/* COLOUR MUST BE SET EXPLICITLY ON EVERY SURFACE HERE, not left to
   inherit. members-worker's pageShell() concatenates its own BASE_STYLE
   BEFORE this sheet, and that stylesheet paints .card cream with
   near-black text (#241d10). Appending our styles only overrides the
   properties we actually declare — so setting the background to dark
   navy while saying nothing about colour left near-black text on dark
   navy at 1.05:1 contrast: invisible. Reported by Dan 11 Aug 2026,
   found by measuring the members-rendered page rather than the
   standalone one, which passes cleanly because BASE_STYLE is not there.
   Any new surface added below needs its own colour for the same reason. */
.stat{color:var(--text-lo)}
.note{color:var(--muted)}
.gate{color:var(--text-lo)}
.countries{color:var(--text-lo)}
table{color:var(--text-lo)}
.wrap{color:var(--text-lo)}
footer{color:var(--muted)}
.grid{display:grid;gap:14px}
@media(min-width:760px){.g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:repeat(3,1fr)}.g4{grid-template-columns:repeat(4,1fr)}}
label{display:block;font-size:12px;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin:0 0 5px}
input[type=number],input[type=text],select{width:100%;background:var(--ink);border:1px solid var(--line);color:var(--text-lo);border-radius:6px;padding:9px 11px;font:inherit;font-size:15px}
input:focus,select:focus{outline:2px solid var(--soon);outline-offset:1px}
.hint{font-size:11.5px;color:var(--muted);margin:5px 0 0}
button{font:inherit;cursor:pointer;border-radius:6px;border:1px solid var(--line);background:var(--ink-3);color:var(--text-lo);padding:10px 16px}
button.primary{background:var(--soon);border-color:var(--soon);color:#231a09;font-weight:700}
button.primary:hover{filter:brightness(1.08)}
button:disabled{opacity:.5;cursor:not-allowed}
.pill{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;padding:2px 7px;border-radius:99px;border:1px solid currentColor}
.p-inforce{color:#7fd0a8}.p-upcoming{color:#e2b978}.p-b2gonly{color:#9fb2d4}.p-nomandate{color:#b9a9a4}
.cx3{color:#e08b7a}.cx2{color:#e2b978}.cx1{color:#9fb2d4}.cx0{color:#8d9bb5}
.countries{max-height:260px;overflow:auto;border:1px solid var(--line);border-radius:8px;padding:0 10px 10px;background:var(--ink)}
.creg{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--soon);margin:10px 0 5px}
.cbox{display:flex;align-items:flex-start;gap:7px;padding:2px 0;font-size:13.5px}
.cbox input{margin-top:3px}
/* THE COUNTRY LIST IS A TABLE, so it is laid out as one. It used to be a
   flowing line per row — name, then two pills, then the date, each
   starting wherever the previous one happened to end. Seventy rows of
   that gives four ragged edges and no way to scan down a single
   attribute, which is the only thing anyone does with this list. One
   shared grid template on the header and every row is what makes the
   columns line up; the header is sticky so it survives the scroll.
   Widths are sized to the longest value each column can hold: "No
   mandate" in both pill columns, an ISO date in the last, and 190px of
   name because "United Arab Emirates" measures 179 and a name that
   wrapped would break the row rhythm the alignment exists for. The
   trailing 1fr is the reason for that cap — without it the name column
   takes all the slack on a wide screen and leaves 600 empty pixels
   between a country and its own mandate, which is aligned but no easier
   to read. Both elements declare six columns and fill five; the sixth is
   the slack. */
.crow,.chead{display:grid;grid-template-columns:15px minmax(70px,190px) 100px 100px 84px 1fr;align-items:center;gap:0 10px}
.crow{padding:3px 0;font-size:13.5px}
.crow input{margin:0}
.crow .pill{justify-self:start}
.cdate{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--muted);text-align:right}
.chead{position:sticky;top:0;z-index:2;background:var(--ink);padding:10px 0 6px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--soon)}
.chead span:last-child{text-align:right}
/* Below this the fixed columns leave the name 40-odd pixels and the whole
   point is lost, so fall back to the flowing line the list had before. */
@media (max-width:700px){
  .crow{display:flex;flex-wrap:wrap;align-items:center;gap:7px}
  .crow input{margin-top:0}
  .cdate{text-align:left}
  .chead{display:none}
  .countries{padding:10px}
}
.stat{background:var(--ink-3);border:1px solid var(--line);border-radius:8px;padding:14px}
.stat .n{font-family:'Big Shoulders Display',sans-serif;font-size:30px;font-weight:800;line-height:1}
.stat .l{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.7px;text-transform:uppercase;color:var(--muted);margin-top:4px}
table{width:100%;border-collapse:collapse;font-size:13.5px}
th,td{text-align:left;padding:8px 9px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.7px;text-transform:uppercase;color:var(--muted);font-weight:500}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
.ev{position:relative;display:inline-block;cursor:help;border-bottom:1px dotted var(--soon);color:var(--soon)}
.ev .tip{display:none;position:absolute;left:0;bottom:calc(100% + 8px);width:320px;background:var(--paper);color:#241d10;border:1px solid var(--paper-line);border-radius:8px;padding:11px 13px;font-size:12px;line-height:1.5;z-index:40;box-shadow:0 8px 26px rgba(0,0,0,.45)}
.ev:hover .tip,.ev:focus .tip{display:block}
.ev .tip b{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}
/* Assumption help. Same tooltip machinery as .ev, a different job: .ev
   says where a number CAME FROM, .hlp says what it MEANS and what it
   moves. Rendered as a small circled ? so a label can carry both without
   the row becoming a paragraph. Deliberately NOT a title= attribute —
   those are invisible on touch, unreachable by keyboard, and cannot hold
   the 200-600 characters these texts actually need. Note the explicit
   font-weight / letter-spacing / text-transform resets on .tip: these sit
   inside <label>, which is uppercase mono here, and a tooltip inheriting
   that is unreadable. */
.hlp{position:relative;display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;margin-left:5px;border:1px solid var(--muted);border-radius:50%;color:var(--muted);font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;line-height:1;cursor:help;vertical-align:middle;letter-spacing:0;text-transform:none;flex:none}
.hlp:hover,.hlp:focus{border-color:var(--soon);color:var(--soon);outline:none}
.hlp .tip{display:none;position:absolute;left:0;bottom:calc(100% + 9px);width:min(330px,78vw);background:var(--paper);color:#241d10;border:1px solid var(--paper-line);border-radius:8px;padding:11px 13px;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:12px;font-weight:400;line-height:1.55;letter-spacing:0;text-transform:none;text-align:left;white-space:normal;z-index:41;box-shadow:0 8px 26px rgba(0,0,0,.45)}
/* The ? adds ~19px to a label, which was enough to wrap four of the longer
   ones onto a second line and drop their inputs out of alignment with the
   rest of the row (caught on screenshot review, not by the DOM tests —
   nothing was broken, it just looked untidy). Reserving two lines of label
   height inside the panel keeps every input on the same baseline whether
   its label wraps or not. */
#assump .grid label{min-height:36px}
.hlp:hover .tip,.hlp:focus .tip{display:block}
.hlp .tip b{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}
.tierA{border-left:4px solid var(--live)}.tierB{border-left:4px solid var(--soon)}.tierC{border-left:4px solid var(--stamp)}.tierD{border-left:4px solid var(--upcoming)}
.tag{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.5px;text-transform:uppercase;padding:1px 6px;border-radius:3px;border:1px solid currentColor;margin-left:6px}
.tA{color:#7fd0a8}.tB{color:#e2b978}.tC{color:#e0907f}.tD{color:#9fb2d4}
.tang{color:#7fd0a8;border-color:#3f7d5c}.intang{color:#9fb2d4;border-color:#3a4864}
/* Whether a row banks on compliance alone. Dan, 14 Aug 2026: every
   customer he has spoken to in 2-3 years meets mandates on their own and
   never combines them with AP automation, so the question "does this
   arrive with the mandate or do I have to go and get it?" is the one the
   reader is actually asking of every line. */
.bank{color:#7fd0a8;border-color:#3f7d5c}.unbank{color:#8d9bb5;border-color:#3a4864}
.gate{background:linear-gradient(180deg,rgba(21,34,56,0) 0%,var(--ink-2) 42%);border:1px solid var(--soon);border-radius:var(--radius);padding:26px 22px;text-align:center;margin:18px 0}
.note{background:var(--ink-3);border-left:3px solid var(--soon);border-radius:0 6px 6px 0;padding:11px 14px;font-size:13px;color:var(--muted);margin:0 0 14px}
.warn{border-left-color:var(--stamp)}
.hidden{display:none !important}
.blur{filter:blur(5px);opacity:.55;pointer-events:none;user-select:none}
footer{margin-top:40px;padding-top:16px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}
@media print{
  body{background:#fff;color:#111}
  .noprint{display:none !important}
  .wrap{max-width:none;padding:0}
  .card,.stat{background:#fff;border:1px solid #bbb;break-inside:avoid}
  h1,h2,h3{color:#111}.lede,.hint,th,.stat .l,footer{color:#444}
  .ev{color:#111;border-bottom:none}.ev .tip{display:none !important}
  .hlp{display:none !important}
  table{font-size:11px}
  h2{border-bottom:1px solid #999}
}
`;

// The page. `locked` controls whether results are reachable without a
// session; `subscribed` is the signed-in reader's own saved countries
// (empty for anonymous visitors, which disables that control).
export function renderRoiPage({ countries, benchmarks = [], phases = [], strings = {}, fx = {},
                                locked = true, subscribed = [], unlockUrl = "", signedInAs = "" }) {
  // Benchmarks, phases and citations are injected from D1 rather than
  // hardcoded here. This is what makes the tool translation-ready without
  // a code change: a Spanish reader gets Spanish labels, hints and
  // citations from roi_benchmark_translations, while the NUMBERS — which
  // are language-neutral — come from the parent row and stay identical
  // across languages. Getting that split right is why these went into D1.
  const byKey = Object.fromEntries(benchmarks.map((b) => [b.key, b]));
  const hintOf = (k) => (byKey[k] && byKey[k].hint) || "";

  // EVERY MONEY DEFAULT LEAVES HERE IN USD, whatever it is stored in.
  // A benchmark has a native currency that has nothing to do with what
  // the reader wants to see: Ardent publishes in USD, and a future
  // EUR-native benchmark must not be handed to the client as though it
  // were dollars. Normalising once, server-side, means the client only
  // ever converts in one direction and there is exactly one place where
  // a currency assumption lives.
  const FX_RATES = { USD: 1, ...Object.fromEntries(Object.entries(fx).map(([k, v]) => [k, v.r])) };
  const val = (k, fb) => {
    const b = byKey[k];
    if (!b || b.default_value == null) return fb;
    if (b.unit !== "currency") return b.default_value;
    const rate = FX_RATES[b.base_currency || "USD"] || 1;
    return b.default_value * rate;   // -> USD
  };

  // This registry holds ASSUMPTIONS ONLY — the benchmark, cost and
  // duration figures behind "Reset all to defaults". The three footprint
  // inputs (volAP, volAR, erp) carry their opening values as plain HTML
  // attributes and are deliberately NOT registered here: they are the
  // visitor's own data, not our estimates, and a Reset that silently wiped
  // the volumes someone had just typed in would be a bug wearing a
  // button. Same reason they get no "Your value / default was…"
  // annotation — there is no default to have departed from.
  // Opening values set to 100k AP / 50k AR / 1 ERP at Dan's request,
  // 12 Aug 2026. Named constants because the platform fee is now derived
  // from them and the two used to be typed out in three separate places.
  const OPEN_VOL_AP = 100000, OPEN_VOL_AR = 50000;
  const defaults = {
    costNow: { v: val("ap_cost_per_invoice", 9.84), h: hintOf("ap_cost_per_invoice") },
    costAR:  { v: val("ar_cost_per_invoice", 6.5),  h: hintOf("ar_cost_per_invoice") },
    savePct: { v: val("cost_reduction_pct", 60),    h: hintOf("cost_reduction_pct") },
    errRate: { v: val("manual_error_rate", 10),     h: hintOf("manual_error_rate") },
    errCost: { v: val("rework_per_error", 45),      h: hintOf("rework_per_error") },
    // TWO RATES, BECAUSE THERE ARE TWO JOBS (Dan, 14 Aug 2026). One field
    // was pricing both a tax professional reconciling clearance regimes
    // and a mailroom clerk keying invoices, which differ by a factor of
    // two and offshore completely differently. Dan spotted it from the
    // other end: "$62000 seems high", which was true of the data-entry
    // role and wrong by half for the tax role the field actually drove.
    fteCost:  { v: val("loaded_fte_cost", 116800),       h: hintOf("loaded_fte_cost") },
    fteEntry: { v: val("loaded_fte_cost_entry", 54000),  h: hintOf("loaded_fte_cost_entry") },
    cImplS:  { v: val("cost_per_integration_simple", 10000),  h: hintOf("cost_per_integration_simple") },
    cImplC:  { v: val("cost_per_integration_complex", 20000), h: hintOf("cost_per_integration_complex") },
    // cPlat is DERIVED, not a flat placeholder. Until 14 Aug 2026 it was a
    // standing 45,000 a year that took no notice of whether the reader had
    // typed 5,000 invoices or 5,000,000 — the one input on the investment
    // side that ignored the footprint the whole rest of the page is built
    // on. It is now the per-invoice fee times AP + AR volume, recomputed
    // client-side whenever either volume moves, and still fully
    // overridable: a typed value wins and stops tracking. The opening
    // value here must agree with the volumes the two inputs open on, or
    // the panel would show one number for the half-second before the
    // client's first recalcPlat().
    cPlat:   { v: Math.round(val("platform_fee_per_invoice", 0.4) * (OPEN_VOL_AP + OPEN_VOL_AR)),
               h: hintOf("platform_fee_per_invoice") },
    cRun:    { v: val("internal_run_cost", 30000),    h: hintOf("internal_run_cost") },
    // lanes and pace are the two implementation levers that are not
    // phases, so they have no roi_phases row to live in. Kept here rather
    // than inventing a table for two numbers. Dan set lanes to 5 on
    // 12 Aug 2026: with the shortened per-country track, running one or
    // two countries at a time stretched multi-country waves far enough
    // back that several opened already-late, which reads as a broken
    // model rather than a real warning.
    lanes:   { v: 5 },
    pace:    { v: "1" },
  };
  const PHASE_INPUT = { mobilise: "wMob", design: "wDes", build: "wBld", uat: "wUat",
                        change: "wChg", vendor: "wVen", contract: "wCon" };
  phases.forEach((p) => { const id = PHASE_INPUT[p.key]; if (id) defaults[id] = { v: p.default_weeks }; });

  // ONE SOURCE OF TRUTH FOR EVERY ASSUMPTION'S OPENING VALUE.
  // Until 12 Aug 2026 the panel's `value="..."` attributes were hardcoded
  // in the HTML while the DEFAULTS registry read the same figures from D1.
  // Nothing looked broken, because the two agreed — but they only agreed by
  // hand. Editing roi_phases.default_weeks or roi_benchmarks.default_value
  // would have changed what "Reset all to defaults" restored and what
  // counted as an override, WITHOUT changing the number the visitor
  // actually sees on load. Migrating a value would have silently done half
  // its job. Found while changing the phase durations, which is exactly the
  // edit that would have exposed it. Every input below now renders from the
  // registry, so D1 is authoritative end to end.
  const dv = (id) => (defaults[id] != null ? defaults[id].v : "");

  // ---- assumption help ------------------------------------------------
  // Dan, 12 Aug 2026, having asked what "Contracting (once)" and "Parallel
  // workstreams" actually meant: "can you include tooltip description for
  // these and other assumptions, so it's clear what they mean, or how they
  // have been derived."
  //
  // TWO DISTINCT THINGS, KEPT DISTINCT. The `hint` under a benchmark input
  // says where the number CAME FROM (Ardent, HMRC, ATO) and pairs with an
  // evidence grade. This says what the number MEANS and what moves when you
  // change it. Collapsing them would have lost the evidence grading, which
  // is the spine of the whole page.
  //
  // ALL TEXT COMES FROM D1, NONE FROM HERE. Phase explanations live in
  // roi_phase_translations.note — a column that already existed, was
  // already being SELECTed with a COALESCE to English, and had simply
  // never been rendered. Everything else lives in the `roi` translations
  // namespace under help.<inputId>, which getRoiStrings() already loads
  // wholesale. So translating the entire help layer is an INSERT, not a
  // code change. That was the point of designing these tables for
  // translation up front, and this is the first change to collect on it.
  //
  // A missing row degrades to no marker at all rather than an empty
  // tooltip — silence beats a ? that rewards a hover with nothing.
  const helpText = { ...Object.fromEntries(Object.entries(strings)
    .filter(([k]) => k.startsWith("help."))
    .map(([k, v]) => [k.slice(5), v])) };
  phases.forEach((p) => { const id = PHASE_INPUT[p.key]; if (id && p.note) helpText[id] = p.note; });
  // ---- page text -------------------------------------------------------
  // Every user-facing string on this page goes through t(). The key is the
  // D1 row in the `roi` namespace; the second argument is the English,
  // kept AT THE USE SITE so the template still reads as prose rather than
  // as a table of key lookups.
  //
  // The fallback is deliberate. A missing row degrades to English rather
  // than to a blank page — but it degrades SILENTLY, which is exactly the
  // failure mode this project keeps being bitten by. So
  // tests/roi-i18n.mjs asserts that every key used here exists in D1: the
  // fallback is a safety net, never the thing actually rendering.
  //
  // Migration 505 seeded 31 of these keys in August 2026 with the comment
  // "adding a language is purely INSERTs and needs no code change". The
  // code never read them, so that was untrue for a week. It is true now.
  const t = (k, fb) => {
    const v = strings[k];
    return v === undefined || v === null || v === "" ? fb : v;
  };
  // Same value, escaped for embedding inside the client script's template
  // literals. A backtick or a ${ in a translation would otherwise end the
  // literal and take the whole page with it.
  const tj = (k, fb) => String(t(k, fb))
    .replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const hlp = (id, title = "How this is derived") => (helpText[id]
    ? `<span class="hlp" tabindex="0" role="note" aria-label="${esc(title)}: ${esc(helpText[id])}">?<span class="tip"><b>${esc(title)}</b>${esc(helpText[id])}</span></span>`
    : "");

  const cite = (k) => {
    const b = byKey[k];
    if (!b) return { t: "D", s: "" };
    const yr = b.source_year ? ` <span style="opacity:.75">(${b.source_year})</span>` : "";
    const link = b.source_url ? ` <a href="${b.source_url}" style="color:#241d10">source</a>` : "";
    return { t: b.evidence_grade, s: `${b.citation || ""}${yr}${link}` };
  };
  const evidence = {
    ardent: cite("ap_cost_per_invoice"), hmrc60: cite("cost_reduction_pct"),
    hmrcErr: cite("manual_error_rate"),  nhs: cite("nhs_query_reduction"),
    ato: cite("ar_cost_per_invoice"),    vatgap: cite("vat_gap_context"),
    oecd: cite("dctr_mechanism"),
    // Three Ardent figures that were held in D1 and rendered nowhere. The
    // Grade A card has claimed "cost, cycle time, exceptions" since the
    // page was built, while the cycle-time row told the reader the only
    // figures available were one NHS anecdote. Both cannot be true.
    ardentCycle: cite("cycle_time_days"), ardentExc: cite("exception_rate"),
    ardentInq: cite("supplier_inquiry_time"),
    // The only citable bridge between invoice volume and headcount that
    // survived checking. Without it the indirect layer had no way to know
    // how big the business was.
    apqc: cite("ap_invoices_per_fte"),
    atoCapture: cite("capture_share_of_ap"),
    durations: { t: "D", s: "Phase durations are practitioner estimates for a country rollout once a platform is in place, held in D1 and editable above. No analyst firm publishes credible per-country e-invoicing implementation durations — this was checked." },
    yours: { t: "D", s: "Your assumption. Nothing is claimed for this figure — it is exposed so the model can be argued with rather than believed." },
    site: { t: "A", s: "Live mandate data from this site's own tracker: status, model and dated deadlines per jurisdiction, each traceable to the cited legal instrument on that country's deep dive." },
  };
  const chartPhases = phases.map((p) => ({ k: p.key, n: p.name, w: p.default_weeks, c: p.colour,
                                           prog: !!p.is_programme, scope: p.scope }));

  const body = `<div class="wrap">

<p class="eyebrow">${t("page.eyebrow", "The E-Invoicing Compliance Corner")}</p>
<h1>${t("page.title", "E-Invoicing ROI &amp;<br>Wave Planner")}</h1>
<p class="lede">${t("page.lede", "Build a board-ready business case from your own volumes and footprint &mdash; with a dated, sourced compliance wave plan drawn from the 70 jurisdictions this site tracks. Every benchmark carries a visible evidence grade, so your CFO can see exactly which numbers are independently evidenced and which are your own assumptions.")}</p>


<h2 class="noprint">1 &middot; ${t("sec.footprint", "Your footprint")}</h2>
<div class="card noprint">
  <div class="grid g4">
    <div>
      <label for="volAP">${t("input.volAP", "Invoices received / year (AP)")}${hlp("volAP","What this drives")}</label>
      <input type="number" id="volAP" value="${OPEN_VOL_AP}" min="0" step="1000">
    </div>
    <div>
      <label for="volAR">${t("input.volAR", "Invoices issued / year (AR)")}${hlp("volAR","What this drives")}</label>
      <input type="number" id="volAR" value="${OPEN_VOL_AR}" min="0" step="1000">
      <p class="hint">${t("input.volAR.hint", "What the mandates actually bite on.")}</p>
    </div>
    <div>
      <label for="erp">${t("input.erp", "ERP / billing integrations")}${hlp("erp","What this drives")}</label>
      <input type="number" id="erp" value="1" min="1" max="60">
    </div>
    <div>
      <label for="cur">${t("input.currency", "Currency")}${hlp("cur","What this changes")}${hlp("fx","Where the rate comes from")}</label>
      <select id="cur"><option value="GBP">GBP &pound;</option><option value="EUR">EUR &euro;</option><option value="USD" selected>USD $</option></select>
      <p class="hint" id="fxNote"></p>
    </div>
  </div>
</div>

<div class="card noprint">
  <label for="scope">${t("input.scope", "What are you modelling?")}${hlp("scope","What this changes")}</label>
  <select id="scope" style="max-width:460px">
    <option value="compliance" selected>${t("scope.compliance", "Compliance only &mdash; meet the mandates (what most programmes do)")}</option>
    <option value="both">${t("scope.both", "Compliance + AP process automation &mdash; the fuller, larger programme")}</option>
  </select>
  <p class="hint">${t("input.scope.hint", "Kept out front rather than buried in the assumptions: it is a scoping decision, not a benchmark, and it changes both the numbers and the timeline.")}</p>
</div>

<div class="card noprint">
  <label>${t("input.countries", "Countries in scope")}${hlp("countries","Where this data comes from")}</label>
  <p class="hint" style="margin-bottom:8px">${t("input.countries.hint", "Live mandate data for all 70 tracked jurisdictions.")} <button id="selEU" style="padding:3px 9px;font-size:12px">${t("btn.selEU", "EU only")}</button> <button id="selMandate" style="padding:3px 9px;font-size:12px">${t("btn.selMandate", "Everywhere with a mandate")}</button> <button id="selNone" style="padding:3px 9px;font-size:12px">${t("btn.selNone", "Clear")}</button></p>
  <label class="cbox" id="subsRow" style="align-items:center;gap:8px;padding:9px 12px;margin:0 0 10px;background:var(--ink-3);border:1px solid var(--line);border-radius:6px;font-size:13.5px">
    <input type="checkbox" id="useSubs">
    <span>${t("subs.label", "Use <strong>my subscribed countries</strong>")} <span id="subsCount" class="hint" style="display:inline"></span></span>
  </label>
  <div class="countries" id="countryList"></div>
</div>

<details class="card noprint" id="assump" style="padding:0">
  <summary style="cursor:pointer;padding:16px 20px;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px">
    <span>
      <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:var(--soon)">${t("assumptions.title", "Assumptions &amp; benchmarks")}</span>
      <span class="hint" style="display:block;margin:4px 0 0">${t("assumptions.hint", "Everything below is pre-filled with our defaults. Open it only if you know better numbers &mdash; every one can be overridden.")}</span>
    </span>
    <span id="assumpChevron" style="font-family:'IBM Plex Mono',monospace;color:var(--muted);font-size:12px;white-space:nowrap">${t("assumptions.show", "show &#9662;")}</span>
  </summary>
  <div style="padding:0 20px 18px">
    <p class="note" style="margin-bottom:14px">${t("assumptions.grades", "Each figure shows where it came from. <span class=\"tag tA\">A</span> measured and primary &middot; <span class=\"tag tB\">B</span> credible body, unattributed &middot; <span class=\"tag tD\">D</span> our estimate. Overriding a value with your own always beats our default &mdash; that is what this panel is for.")} <button type="button" id="resetDefaults" style="padding:3px 9px;font-size:12px;margin-left:6px">${t("btn.reset", "Reset all to defaults")}</button></p>

    <p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--soon);margin:0 0 8px">${t("assumptions.h.cost", "Cost &amp; benefit")}</p>
    <div class="grid g4">
      <div><label for="costNow">${t("input.costNow", "AP cost per invoice")} <span class="tag tA">A</span>${hlp("costNow","What this drives")}</label><input type="number" id="costNow" value="${dv('costNow')}" min="0" step="0.01"><p class="hint" id="h-costNow"></p></div>
      <div><label for="costAR">${t("input.costAR", "AR cost per invoice")} <span class="tag tA">A</span>${hlp("costAR","What this drives")}</label><input type="number" id="costAR" value="${dv('costAR')}" min="0" step="0.01"><p class="hint" id="h-costAR"></p></div>
      <div><label for="savePct">${t("input.savePct", "Cost reduction %")} <span class="tag tB">B</span>${hlp("savePct","What this drives")}</label><input type="number" id="savePct" value="${dv('savePct')}" min="0" max="95"><p class="hint" id="h-savePct"></p></div>
      <div><label for="errCost">${t("input.errCost", "Rework per errored invoice")} <span class="tag tD">D</span>${hlp("errCost","What this drives")}</label><input type="number" id="errCost" value="${dv('errCost')}" min="0" step="1"><p class="hint" id="h-errCost"></p></div>
    </div>
    <div class="grid g4" style="margin-top:12px">
      <div><label for="errRate">${t("input.errRate", "Manual error rate %")} <span class="tag tB">B</span>${hlp("errRate","What this drives")}</label><input type="number" id="errRate" value="${dv('errRate')}" min="0" max="100" step="0.5"><p class="hint" id="h-errRate"></p></div>
      <div><label for="fteCost">${t("input.fteCost", "Loaded cost / tax or finance FTE")} <span class="tag tB">B</span>${hlp("fteCost","What this drives")}</label><input type="number" id="fteCost" value="${dv('fteCost')}" min="0" step="1000"><p class="hint" id="h-fteCost"></p></div>
      <div><label for="fteEntry">${t("input.fteEntry", "Loaded cost / data-entry FTE")} <span class="tag tB">B</span>${hlp("fteEntry","What this drives")}</label><input type="number" id="fteEntry" value="${dv('fteEntry')}" min="0" step="1000"><p class="hint" id="h-fteEntry"></p></div>
      <div></div>
    </div>

    <p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--soon);margin:20px 0 8px">${t("assumptions.h.invest", "Investment &mdash; costs")} <span class="tag tD">D</span></p>
    <p class="hint" style="margin:-4px 0 8px;color:#e0907f">${t("assumptions.placeholders", "These figures are <strong>placeholders only</strong>. Please replace with vendor budgetary estimates and treat the ROI as illustrative, until actuals can be provided.")}</p>
    <div class="grid g4">
      <div><label for="cImplS" style="font-size:11px">${t("input.cImplS", "Cost per SIMPLE integration")}${hlp("cImplS","What this drives")}</label><input type="number" id="cImplS" value="${dv('cImplS')}" min="0" step="1000"><p class="hint" id="h-cImplS"></p></div>
      <div><label for="cImplC" style="font-size:11px">${t("input.cImplC", "Cost per COMPLEX integration")}${hlp("cImplC","What this drives")}</label><input type="number" id="cImplC" value="${dv('cImplC')}" min="0" step="1000"><p class="hint" id="h-cImplC"></p></div>
      <div><label for="cPlat" style="font-size:11px">${t("input.cPlat", "Platform / network fees per year")}${hlp("cPlat","What this drives")}</label><input type="number" id="cPlat" value="${dv('cPlat')}" min="0" step="1000"><p class="hint" id="h-cPlat"></p></div>
      <div><label for="cRun" style="font-size:11px">${t("input.cRun", "Internal run cost per year")}${hlp("cRun","What this drives")}</label><input type="number" id="cRun" value="${dv('cRun')}" min="0" step="1000"><p class="hint" id="h-cRun"></p></div>
      <div></div>
    </div>

    <p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--soon);margin:20px 0 8px">${t("assumptions.h.weeks", "Implementation &mdash; weeks")} <span class="tag tD">D</span></p>
    <div class="grid g4">
      <div><label for="wMob" style="font-size:11px">${t("input.wMob", "Mobilisation")}${hlp("wMob","What this phase covers")}</label><input type="number" id="wMob" value="${dv('wMob')}" min="0" step="0.5"></div>
      <div><label for="wDes" style="font-size:11px">${t("input.wDes", "Design")}${hlp("wDes","What this phase covers")}</label><input type="number" id="wDes" value="${dv('wDes')}" min="0" step="0.5"></div>
      <div><label for="wBld" style="font-size:11px">${t("input.wBld", "Build")}${hlp("wBld","What this phase covers")}</label><input type="number" id="wBld" value="${dv('wBld')}" min="0" step="0.5"></div>
      <div><label for="wUat" style="font-size:11px">${t("input.wUat", "UAT")}${hlp("wUat","What this phase covers")}</label><input type="number" id="wUat" value="${dv('wUat')}" min="0" step="0.5"></div>
    </div>
    <div class="grid g4" style="margin-top:12px" id="chgRow">
      <div><label for="wChg" style="font-size:11px">${t("input.wChg", "Process change &amp; training")}${hlp("wChg","What this phase covers")}</label><input type="number" id="wChg" value="${dv('wChg')}" min="0" step="0.5"><p class="hint">${t("input.wChg.hint", "AP automation scope only.")}</p></div>
      <div></div><div></div><div></div>
    </div>
    <div class="grid g4" style="margin-top:12px">
      <div><label for="wVen" style="font-size:11px">${t("input.wVen", "Vendor selection (once)")}${hlp("wVen","What “once” means here")}</label><input type="number" id="wVen" value="${dv('wVen')}" min="0" step="1"></div>
      <div><label for="wCon" style="font-size:11px">${t("input.wCon", "Contracting (once)")}${hlp("wCon","What “once” means here")}</label><input type="number" id="wCon" value="${dv('wCon')}" min="0" step="1"></div>
      <div><label for="lanes" style="font-size:11px">${t("input.lanes", "Parallel workstreams")}${hlp("lanes","What this means")}</label><input type="number" id="lanes" value="${dv('lanes')}" min="1" max="10"></div>
      <div><label for="pace" style="font-size:11px">${t("input.pace", "Delivery pace")}${hlp("pace","What this means")}</label><select id="pace">${[["0.75",t("pace.aggressive","Aggressive")],["1",t("pace.typical","Typical")],["1.3",t("pace.conservative","Conservative")]].map(([v,n])=>`<option value="${v}"${String(dv('pace'))===v?" selected":""}>${n}</option>`).join("")}</select></div>
    </div>
    <p class="hint" style="margin-top:10px">${t("assumptions.durations", "Durations are per country. Countries sharing a go-live date form a wave, so a five-country wave costs roughly five country-tracks of effort, divided across however many workstreams you can genuinely run at once.")}</p>
  </div>
</details>

<p class="noprint" style="margin:16px 0 0"><button class="primary" id="run">${t("btn.calculate", "Calculate business case")}</button> <button id="print" class="hidden">${t("btn.pdf", "Download PDF")}</button></p>

<div id="gate" class="gate noprint hidden">
  <p class="eyebrow" style="color:var(--soon)">${t("gate.eyebrow", "Subscriber content")}</p>
  <h3 style="font-family:'Big Shoulders Display';font-size:22px;text-transform:uppercase;letter-spacing:.5px">${t("gate.title", "Your results are ready")}</h3>
  <p class="lede" style="margin:0 auto 14px;max-width:52ch">${t("gate.body", "Sign in free to see the full wave plan, the two-layer ROI model and the evidence panel, to pull in the countries you already follow, and to download the PDF for your board pack.")}</p>
  <button class="primary" id="signin">${t("gate.cta", "Sign in / subscribe free")}</button>
  
</div>

<div id="results" class="hidden">
  <div id="guards"></div>
  <h2>2 &middot; ${t("sec.summary", "Executive summary")}</h2>
  <div id="summary"></div>
  <h2>3 &middot; ${t("sec.waves", "Compliance wave plan")}</h2>
  <p class="lede" id="waveIntro"></p>
  <div class="card" style="padding:14px 16px 6px">
    <div id="ganttHead"></div>
    <div style="overflow-x:auto"><div id="gantt"></div></div>
    <div id="ganttLegend"></div>
  </div>
  <details class="card noprint" id="adjust" style="padding:0">
    <summary style="cursor:pointer;padding:14px 18px;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px">
      <span>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:var(--soon)">${t("adjust.title", "Adjust the plan")}</span>
        <span class="hint" style="display:block;margin:4px 0 0">${t("adjust.hint", "Move a country to a different wave, or pin its own start date. The chart and the elapsed figures redraw from your changes; nothing else on the page moves.")}</span>
      </span>
      <span id="adjustChevron" style="font-family:'IBM Plex Mono',monospace;color:var(--muted);font-size:12px;white-space:nowrap">${t("assumptions.show", "show &#9662;")}</span>
    </summary>
    <div style="padding:0 18px 16px">
      <div id="adjustRows"></div>
      <p class="hint" style="margin:12px 0 0">${t("adjust.note", "Changes live in this page only &mdash; nothing is saved, and reloading restores the back-planned schedule. A country you move later than its own deadline stays visible and is called out above, because a plan that misses a date is a decision rather than an error.")} <button type="button" id="adjustReset" style="padding:3px 9px;font-size:12px;margin-left:6px">${t("adjust.reset", "Reset to the computed plan")}</button></p>
    </div>
  </details>

  <p class="noprint" style="margin:-4px 0 14px"><button id="tblToggle" style="padding:5px 11px;font-size:12.5px">${t("btn.table", "Show as table")}</button></p>
  <div id="waves" class="hidden"></div>
  <h2>4 &middot; ${t("sec.direct", "Direct savings &mdash; cash-releasing")}</h2>
  <p class="lede">${t("sec.direct.lede", "Money that stops leaving the business: processing cost per invoice, and rework you no longer pay for. Available wherever you digitise, mandate or not.")}</p>
  <div id="direct"></div>
  <h2>5 &middot; ${t("sec.indirect", "Indirect savings &mdash; cost and risk avoided")}</h2>
  <p class="lede">${t("sec.indirect.lede", "Cost you avoid rather than cash you release: tax and audit effort, penalty exposure, fraud. The <em>mechanisms</em> are well evidenced; the <em>magnitudes</em> mostly are not, which is why so much of this section is named rather than monetised.")}</p>
  <div id="indirect"></div>
  <h2>6 &middot; ${t("sec.invest", "Investment &amp; payback")}</h2>
  <div id="invest"></div>
  <h2>7 &middot; ${t("sec.evidence", "What the evidence actually supports")}</h2>
  <div id="evidence"></div>
</div>

<footer>
  <p>${t("footer.text", "<strong>The E-Invoicing Compliance Corner</strong> &mdash; ROI &amp; wave planner. Country mandate data is live as of 11 August 2026 and traceable to the per-country deep dives. Benchmark figures carry the evidence grade shown against each. This tool models a business case; it is not tax, legal or investment advice.")}</p>
</footer>
</div>

`;
  const script = `
const COUNTRIES = __ROI_COUNTRIES__;
let unlocked = __ROI_UNLOCKED__;
const REGION = {Eu:'Europe', Mi:'Middle East / Africa', As:'Asia-Pacific', Am:'Americas'};
const STATUS = {i:['In force','p-inforce'], u:['Upcoming','p-upcoming'], b:['B2G only','p-b2gonly'], n:['No mandate','p-nomandate'], t:['Tracked','p-nomandate']};
// Three values, not four (Dan, 12 Aug 2026). The dividing line is whether
// the tax authority is a party to the transaction, which is also what
// actually drives integration effort. The old four-point scale carried a
// B2G-only tier and had no slot at all for "mandatory decentralised
// exchange with no authority involvement" — which is exactly where
// Belgium, Norway, the UK and Slovenia live, and where the European
// direction of travel is heading.
const CXNAME = {2:['Complex','cx3'], 1:['Simple','cx2'], 0:['No mandate','cx0']};
const CXNOTE = {2:'CTC or 5-corner: the tax authority is a party to the transaction — clearance, pre-validation, or invoice-level reporting. Certification, response handling and status reconciliation on top of the exchange.',
  1:'Decentralised 4-corner exchange only. Structured invoices move between accredited access points; the tax authority is not in the loop.',
  0:'No mandate to build for. Included only because you selected it — there is no deadline, so this work can start whenever you have capacity.'};
const SYM = {GBP:'£', EUR:'€', USD:'$'};
let cur='USD';

// ---- currency conversion ------------------------------------------------
// Until 12 Aug 2026 the currency selector changed the SYMBOL and nothing
// else, so picking GBP relabelled Ardent's USD 9.84 as GBP 9.84 and
// overstated a sterling business case by about a third — with the citation
// still attached. Dan found it.
//
// Every money default arrives from the server already normalised to USD
// (see renderRoiPage), so USD is the canonical unit here and conversion
// only ever runs one way. Two canonical maps are kept in USD rather than
// converting the displayed values in place: round-tripping 62,000 through
// GBP and back loses a pound each time, and a figure that drifts when you
// toggle a dropdown destroys confidence in everything else on the page.
const FX = __ROI_FX__;
const rateOf = c => (FX[c] && FX[c].r) || 1;
const CUR_INPUTS = ['costNow','costAR','errCost','fteCost','fteEntry','cImplS','cImplC','cPlat','cRun'];
// Per-invoice figures need pennies; five-figure ones do not, and showing
// 45,888.53 for a placeholder implies a precision nobody has.
const roundCur = v => v >= 1000 ? Math.round(v) : Math.round(v*100)/100;
const usdDefault = {}, usdCurrent = {};
const fmt = n => SYM[cur] + Math.round(n).toLocaleString('en-US');
const fmt1 = n => SYM[cur] + (Math.round(n*10)/10).toLocaleString('en-US');

// ---- evidence grades -------------------------------------------------
// A = measured, primary, attributable      B = published by a credible body but unattributed within it
// C = single anecdote, not a benchmark     D = your assumption, nothing claimed
const EV = __ROI_EVIDENCE__;
const ev = (key, txt) => \`<span class="ev" tabindex="0">\${txt}<span class="tip"><b>Evidence grade \${EV[key].t}</b>\${EV[key].s}</span></span>\`;

// ---- tooltip edge handling -------------------------------------------
// A 330px tooltip anchored left:0 runs off the RIGHT edge whenever its
// marker sits in the fourth column of a g4 grid or a right-aligned table
// header — which is exactly where several of these live. The obvious fix,
// flipping the anchor to right:0, then runs off the LEFT edge on a phone:
// browser-tested at 420px, a naive flip put 23 of 27 tips partly outside
// the viewport, some starting at -231px. So CLAMP rather than flip —
// compute the offset that keeps the tip inside the viewport with a 12px
// margin and set it explicitly.
//
// Measure the MARKER, not the tip: the marker is always visible, so
// getBoundingClientRect is meaningful, whereas the tip is display:none
// until hover and would measure zero. Delegated from document so it also
// covers markers that build() renders later, and re-run on every hover
// because column widths move with the viewport.
function fitTip(el){
  const t = el.querySelector('.tip'); if(!t) return;
  const r = el.getBoundingClientRect();
  const w = Math.min(330, window.innerWidth * 0.78);
  const M = 12;
  const want = r.left;
  const max = Math.max(M, window.innerWidth - w - M);
  const clamped = Math.min(Math.max(want, M), max);
  t.style.right = 'auto';
  t.style.left = Math.round(clamped - r.left) + 'px';
}
['mouseover','focusin'].forEach(evt => document.addEventListener(evt, e => {
  const el = e.target.closest && e.target.closest('.hlp, .ev');
  if(el) fitTip(el);
}));

// ---- assumption defaults: one registry, so hints, reset and overrides
// ---- can never drift apart from the values actually used in the maths.
const DEFAULTS = __ROI_DEFAULTS__;
Object.entries(DEFAULTS).forEach(([id,d]) => {
  const hint = document.getElementById('h-'+id);
  if(hint && d.h) hint.textContent = d.h;
});
function markOverridden(){
  Object.entries(DEFAULTS).forEach(([id,d]) => {
    const el = document.getElementById(id); if(!el) return;
    const changed = String(el.value) !== String(d.v);
    el.style.borderColor = changed ? '#c98a3a' : '';
    const hint = document.getElementById('h-'+id);
    if(hint && d.h) hint.innerHTML = changed
      ? \`<span style="color:#e2b978">Your value.</span> Default \${d.v} &mdash; \${d.h}\`
      : d.h;
  });
}
document.getElementById('assump').addEventListener('toggle', e => {
  document.getElementById('assumpChevron').innerHTML = e.target.open ? 'hide &#9652;' : 'show &#9662;';
});
document.getElementById('resetDefaults').onclick = () => {
  Object.entries(DEFAULTS).forEach(([id,d]) => { const el = document.getElementById(id); if(el) el.value = d.v; });
  CUR_INPUTS.forEach(id => { usdCurrent[id] = usdDefault[id]; });   // re-anchor the canon too
  dirtyCur.clear();
  markOverridden(); syncScope(); if(unlocked) showResults();
};
document.getElementById('assump').addEventListener('input', markOverridden);

// ---- currency: convert the values, not just the symbol ------------------
// Seed the canon from the server's USD-normalised defaults. DEFAULTS[id].v
// is mutated on every switch so that "Reset all to defaults" restores the
// right currency and markOverridden() compares like with like — otherwise
// switching to GBP would flag all eight inputs as user overrides.
CUR_INPUTS.forEach(id => {
  if(DEFAULTS[id] == null) return;
  usdDefault[id] = +DEFAULTS[id].v;
  usdCurrent[id] = +DEFAULTS[id].v;
});

// Re-anchor the canon ONLY when the user actually edits a field, and do it
// at that moment in the currency they typed in. Re-reading every displayed
// value on each currency switch instead compounds the rounding: USD ->
// GBP -> EUR -> USD returned 9.83 for a 9.84 benchmark, and a figure that
// drifts when you toggle a dropdown twice undermines confidence in every
// other number on the page. Untouched inputs keep their exact canonical
// value forever; edited ones are captured once, which is the user's
// intent, and never re-rounded afterwards.
const dirtyCur = new Set();
document.getElementById('assump').addEventListener('input', (e) => {
  const id = e.target && e.target.id;
  if(!CUR_INPUTS.includes(id)) return;
  dirtyCur.add(id);
  usdCurrent[id] = (+e.target.value || 0) * rateOf(cur);
});
function applyCurrency(next){
  const r = rateOf(next);
  CUR_INPUTS.forEach(id => {
    const el = document.getElementById(id); if(!el) return;
    el.value = roundCur(usdCurrent[id] / r);
    if(DEFAULTS[id]) DEFAULTS[id].v = roundCur(usdDefault[id] / r);
  });
  cur = next;
  const note = document.getElementById('fxNote');
  if(note){
    const f = FX[next];
    // Says "fixed rate" in the ALWAYS-VISIBLE note, not only in the
    // tooltip. Dan asked for the static basis to be acknowledged, and this
    // project was bitten this week by exactly the opposite instinct:
    // migration 513 existed because a material warning about this control
    // sat behind a hover instead of in front of the reader.
    note.innerHTML = next === 'USD' || !f
      ? 'Benchmark defaults are published in US dollars.'
      : \`Converted at a <strong>fixed rate</strong> of 1 \${next} = \${f.r} USD\${f.asOf ? ', spot ' + f.asOf : ''} &mdash; not updated daily. \${ev('yours','Use your own treasury rate for anything you will sign')}\`;
  }
  // recalcPlat() rather than markOverridden() directly: the platform fee's
  // hint quotes the per-invoice rate, so it has to be rebuilt in the new
  // currency too, and it ends by calling markOverridden() itself. The
  // initial applyCurrency() call therefore sits BELOW recalcPlat's
  // definition — PLAT is a const, and calling it any earlier would hit
  // the temporal dead zone.
  recalcPlat();
}
document.getElementById('cur').addEventListener('change', (e) => {
  applyCurrency(e.target.value);
  if(unlocked) showResults();
});

// ---- platform / network fees: derived from the volumes above ----------
// Every other figure on the investment side is a flat placeholder, which
// is honest for a one-off integration cost — that genuinely does not
// scale with volume. Platform and network fees do. A standing 45,000 a
// year was the one input on this page that took no notice of whether the
// reader had typed 5,000 invoices or 5,000,000, while the whole benefit
// side moved with them: a business case whose costs were fixed and whose
// savings were linear, which is not a model, it is a slope.
//
// So: fee per invoice times AP + AR. Both directions, because a network
// charges for a document whether you send it or receive it, and because
// AR-only would leave the larger flow unpriced.
//
// Three things this must not do, each of which it would be easy to get
// wrong. It must not overwrite a value the reader typed — a vendor quote
// beats our multiplier, permanently, and dirtyCur already records
// exactly that (it is set on any edit to a currency input and cleared by
// Reset). It must keep usdDefault in step, or the next currency switch
// would restore the OLD derived figure. And the hint has to show the
// arithmetic: a number that moves when you edit something else, without
// saying why, reads as a bug.
const TAXM = __ROI_TAXMODEL__;
const PLAT = __ROI_PLATFEE__;
function recalcPlat(){
  const el = document.getElementById('cPlat');
  if(!el || !DEFAULTS.cPlat) return;
  const vol = (+document.getElementById('volAP').value || 0)
            + (+document.getElementById('volAR').value || 0);
  const r = rateOf(cur);
  usdDefault.cPlat = Math.round(PLAT.fee * vol);
  DEFAULTS.cPlat.v = roundCur(usdDefault.cPlat / r);
  DEFAULTS.cPlat.h = PLAT.tpl
    .replace('{vol}', vol.toLocaleString('en-US'))
    .replace('{fee}', SYM[cur] + (PLAT.fee / r).toFixed(2));
  if(!dirtyCur.has('cPlat')){
    usdCurrent.cPlat = usdDefault.cPlat;
    el.value = DEFAULTS.cPlat.v;
  }
  markOverridden();
}
['volAP','volAR'].forEach(id => {
  const el = document.getElementById(id);
  if(el) el.addEventListener('input', recalcPlat);
});
applyCurrency(document.getElementById('cur').value);

// ---- country picker --------------------------------------------------
const list = document.getElementById('countryList');
const byRegion = {};
COUNTRIES.forEach((c,i) => { (byRegion[c[2]] ||= []).push([c,i]); });
// One header row, sticky, sharing the grid template with every country
// row. The empty first cell is the checkbox column: aligning against a
// control the header cannot label is the whole reason the template is
// declared once in CSS rather than per element. aria-hidden because the
// checkboxes are already individually labelled — a screen reader gets the
// country name and both pill texts from the label itself, and announcing
// four column headings that belong to no table would be noise.
let html = \`<div class="chead" aria-hidden="true"><span></span><span>${tj("col.jurisdiction","Jurisdiction")}</span><span>${tj("col.mandate","Mandate")}</span><span>${tj("col.complexity","Complexity")}</span><span>${tj("col.deadline","Deadline")}</span></div>\`;
['Eu','Mi','As','Am'].forEach(r => {
  if(!byRegion[r]) return;
  html += \`<div class="creg">\${REGION[r]}</div>\`;
  byRegion[r].forEach(([c,i]) => {
    const st = STATUS[c[3]], cx = CXNAME[c[4]];
    html += \`<label class="crow"><input type="checkbox" data-i="\${i}"><span>\${c[0]}</span><span class="pill \${st[1]}">\${st[0]}</span><span class="pill \${cx[1]}">\${cx[0]}</span><span class="cdate">\${c[5] || '&mdash;'}</span></label>\`;
  });
});
list.innerHTML = html;
const boxes = () => [...list.querySelectorAll('input[type=checkbox]')].filter(b => b.dataset.i !== undefined);

// ---- "my subscribed countries" -----------------------------------------
// In production this reads the signed-in subscriber's saved preferences from
// the SAME source the members preferences page and the newsletter archive
// already use, so a reader who has told us which countries they follow never
// has to tell us twice. Mocked here, and gated: it is one of the few things
// on the page that genuinely CANNOT work for an anonymous visitor, which
// makes it an honest reason to sign in rather than an artificial one.
const MOCK_SUBSCRIBED = __ROI_SUBSCRIBED__;
const subsBox = document.getElementById('useSubs');
const subsRow = document.getElementById('subsRow');
function setSubsAvailable(on){
  subsBox.disabled = !on;
  subsRow.style.opacity = on ? '1' : '.55';
  document.getElementById('subsCount').textContent = on
    ? \`(\${MOCK_SUBSCRIBED.length}) — from your saved preferences\`
    : '— sign in to use your saved countries';
}
// Initialise from the unlock state, NOT unconditionally false. On the
// members page the reader is already signed in and the sign-in handler
// never runs, so hardcoding false left a subscriber staring at their own
// saved countries permanently greyed out. Caught in browser testing of
// the real rendered page rather than the prototype, because the
// prototype always starts locked.
setSubsAvailable(unlocked && MOCK_SUBSCRIBED.length > 0);
subsBox.onchange = () => {
  if(subsBox.checked){
    boxes().forEach(b => { b.checked = MOCK_SUBSCRIBED.includes(COUNTRIES[+b.dataset.i][0]); });
  } else {
    boxes().forEach(b => b.checked = false);
  }
  if(typeof unlocked !== 'undefined' && unlocked) showResults();
};
// Any manual change means the selection is no longer "my subscribed countries".
list.addEventListener('change', e => { if(e.target !== subsBox) subsBox.checked = false; });

const chosen = () => boxes().filter(b=>b.checked).map(b=>COUNTRIES[+b.dataset.i]);
document.getElementById('selEU').onclick = () => { subsBox.checked = false; boxes().forEach(b=>{ b.checked = COUNTRIES[+b.dataset.i][2]==='Eu'; }); };
document.getElementById('selMandate').onclick = () => { subsBox.checked = false; boxes().forEach(b=>{ const s=COUNTRIES[+b.dataset.i][3]; b.checked = s==='i'||s==='u'; }); };
document.getElementById('selNone').onclick = () => { subsBox.checked = false; boxes().forEach(b=>b.checked=false); };
['GB','FR','DE','IT','ES','PL','NL','BE'].forEach(code=>{const i=COUNTRIES.findIndex(c=>c[1]===code); if(i>=0) boxes()[i].checked=true;});


// ---- Gantt: back-planned delivery waves --------------------------------
// Phase durations are ASSUMPTIONS (evidence grade D) — exposed and adjustable,
// never presented as benchmarks. Vendor selection and contracting are modelled
// ONCE at programme level, because that is how these actually run; per-country
// tracks begin at mobilisation and depend on that programme work completing.
// Durations come from the inputs above. Defaults are Dan's own practitioner
// estimates for an e-invoicing country rollout (mobilise 1-2w, design 2w,
// build 2w, UAT 1w) rather than my earlier ERP-programme-scale guesses, which
// were roughly 4x too long and produced a misleadingly bleak picture.
const num = id => +document.getElementById(id).value || 0;
const scopeVal = () => document.getElementById('scope').value;
const ALL_PHASES = __ROI_PHASES__;
const PH = () => ALL_PHASES.filter(p => !p.prog && (p.scope === 'all' || scopeVal() === 'both'))
  .map(p => ({...p, w: num(({mobilise:'wMob',design:'wDes',build:'wBld',uat:'wUat',change:'wChg'})[p.k]) || p.w}));
const PROG = () => ALL_PHASES.filter(p => p.prog)
  .map(p => ({...p, w: num(({vendor:'wVen',contract:'wCon'})[p.k]) || p.w}));
// Duration multiplier per complexity. A simple 4-corner connection is a
// genuinely lighter build than a clearance integration, but on a lean
// 7-week track the spread is proportionally small — hence 0.7 rather
// than something dramatic. No-mandate countries take the same effort as
// a simple one (0.7): with nothing to comply with, what remains IS a
// straightforward connection. They differ from simple countries only in
// having no deadline, which is handled in buildGantt(), not here.
const CXF = {2:1.0, 1:0.7, 0:0.7};
const addW = (d,w) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + Math.round(w*7)); return x; };
const D = s => new Date(s + 'T00:00:00Z');
const isoD = d => d.toISOString().slice(0,10);
const NOW = new Date();

// ---- user overrides -------------------------------------------------
// Session only, by design: no storage, no server, no per-subscriber
// state. Someone assembling a board pack does it in one sitting and
// downloads the PDF; persisting a plan raises a question this tool
// cannot yet answer well, which is what should happen to a saved
// override when the published deadline underneath it moves.
//
// Keyed by country name because that is what the row carries. Shape is
// deliberately serialisable so persisting it later is a storage
// decision rather than a rewrite.
const OVR = {};                       // name -> {dl?: 'YYYY-MM-DD', start?: 'YYYY-MM-DD'}
// renderAdjust() replaces the panel's DOM wholesale, which drops focus.
// Without this you have to re-click the field after every single edit.
let ovrRefocus = null;
const ovrOf = n => OVR[n] || {};
const anyOvr = () => Object.values(OVR).some(o => o.dl || o.start);

function buildGantt(sel0, erp, pace){
  const host = document.getElementById('gantt');
  // A wave override rewrites the country's effective deadline, which is
  // all "move it to another wave" means here: waves ARE the set of
  // countries sharing a date. Copy the row rather than mutating it —
  // COUNTRIES is shared with the table, the summary and the cost model,
  // and none of those should move because someone dragged a wave.
  const sel = sel0.map(c => {
    const o = ovrOf(c[0]);
    if(!o.dl) return c;
    const c2 = c.slice(); c2[5] = o.dl; return c2;
  });
  const erpF = 1 + Math.min((erp-1)*0.12, 0.6); // gentler: a lean track scales less with system count
  // Dated countries drive the back-planned waves. No-mandate countries
  // have no deadline by definition, so they are pulled out here and given
  // their own discretionary wave below (Dan, 12 Aug 2026: "Include
  // countries with no mandate in the same phase because there is no
  // mandate go-live date to track therefore it can start anytime").
  const dated = sel.filter(c => c[5] && c[4] > 0);
  const undated = sel.filter(c => !(c[5] && c[4] > 0));
  if(!dated.length && undated.length){
    document.getElementById('ganttHead').innerHTML = '<div class="note">None of your selected jurisdictions has a future dated deadline, so there is no back-planned wave to draw. What follows is discretionary work you can schedule whenever you have capacity.</div>';
  }
  if(!dated.length && !undated.length){
    document.getElementById('ganttHead').innerHTML = '<div class="note">No selected jurisdiction has both a future dated deadline and a mandate to build for, so there is no delivery timeline to plot. Jurisdictions already in force still need remediation — see the table below.</div>';
    host.innerHTML = ''; document.getElementById('ganttLegend').innerHTML = ''; return null;
  }
  // Guarded: a selection of nothing but no-mandate jurisdictions is a
  // legitimate state now that they get their own band, and Math.max of an
  // empty spread is -Infinity, which would silently poison every duration
  // downstream as NaN.
  const maxCx = dated.length ? Math.max(...dated.map(c=>c[4])) : 1;
  const progPhases = PROG().map(p => ({...p, weeks: Math.max(2, Math.round(p.w * CXF[maxCx] * pace))}));
  const progWeeks = progPhases.reduce((a,p)=>a+p.weeks,0);

  // Countries sharing a go-live date form a WAVE. Phase durations are PER
  // COUNTRY, so a wave's effort is the sum of its members' tracks — not one
  // track regardless of size, which is what the first version wrongly
  // assumed. Members are distributed across \`lanes\` parallel workstreams
  // (hardest first, round-robin) and each lane is back-planned from the
  // shared deadline, so the last country in a lane finishes on the date and
  // the earlier ones sit behind it.
  const lanes = Math.max(1, +document.getElementById('lanes').value || 1);
  const durOf = c => {
    const phases = PH().map(p => ({...p, weeks: Math.max(1, Math.round(p.w * CXF[c[4]] * pace * ((p.k==='design'||p.k==='build') ? erpF : 1)))}));
    return {phases, total: phases.reduce((a,p)=>a+p.weeks,0)};
  };
  const waveMap = {};
  dated.forEach(c => (waveMap[c[5]] ||= []).push(c));
  const REGORDER = ['Eu','Mi','As','Am'];
  const rows = [];
  const waveMeta = [];
  Object.keys(waveMap).sort().forEach(dl => {
    const members = [...waveMap[dl]].sort((a,b) => b[4]-a[4] || REGORDER.indexOf(a[2])-REGORDER.indexOf(b[2]) || a[0].localeCompare(b[0]));
    const lane = Array.from({length: lanes}, () => []);
    members.forEach((c,i) => lane[i % lanes].push(c));
    const golive = D(dl);
    let waveStart = golive, effort = 0;
    const waveRows = [];
    lane.forEach((L, li) => {
      let end = golive;
      for(let i = L.length-1; i >= 0; i--){
        const {phases, total} = durOf(L[i]);
        effort += total;
        const start = addW(end, -total);
        let t = start.getTime();
        const segs = phases.map(p => { const s = new Date(t); const e = addW(s, p.weeks); t = e.getTime(); return {...p, s, e}; });
        if(start < waveStart) waveStart = start;
        waveRows.push({c: L[i], segs, start, golive, lane: li, seq: i, total});
        end = start;
      }
    });
    // A pinned start date shifts that country's whole track, keeping its
    // durations. golive is left alone on purpose: if the shift pushes the
    // finish past the deadline, the bar visibly runs past it and the
    // guard above the summary says so. Hiding that would defeat the point
    // of letting someone move it.
    waveRows.forEach(r => {
      const o = ovrOf(r.c[0]);
      if(!o.start) return;
      const pinned = D(o.start);
      if(isNaN(pinned)) return;
      const shift = pinned.getTime() - r.start.getTime();
      r.start = new Date(r.start.getTime() + shift);
      r.segs = r.segs.map(sg => ({...sg, s: new Date(sg.s.getTime()+shift), e: new Date(sg.e.getTime()+shift)}));
      r.pinned = true;
      if(r.start < waveStart) waveStart = r.start;
    });
    waveRows.sort((a,b) => a.start - b.start || a.lane - b.lane);
    const progStart = addW(waveStart, -progWeeks);
    const slipDays = Math.round((progStart - NOW)/86400000);
    const risk = slipDays < 0 ? 'critical' : slipDays < 90 ? 'warning' : 'good';
    const elapsed = Math.round((golive - waveStart)/(86400000*7));
    waveMeta.push({dl, golive, n: members.length, effort, elapsed, waveStart, progStart, slipDays, risk});
    waveRows.forEach(r => rows.push({...r, slipDays, risk, waveKey: dl}));
  });

  // Same guard, for the same reason: with no dated rows there is nothing
  // to back-plan from, so the axis runs from today across the longest
  // discretionary track instead.
  const longestUndated = undated.length ? Math.max(...undated.map(c => durOf(c).total)) : 0;
  const progEnd = rows.length ? new Date(Math.min(...rows.map(r=>r.start.getTime()))) : addW(NOW, progWeeks);
  const progBegin = rows.length ? addW(progEnd, -progWeeks) : new Date(NOW.getTime());
  const t0 = new Date(Math.min(progBegin.getTime(), NOW.getTime()));
  // Without overrides the last segment always ends exactly on golive, so
  // this is identical to taking golive alone — it only differs once a
  // pinned start pushes a track past its deadline, which is precisely
  // when the chart must not crop it.
  // Undated tracks are drawn later, from progEnd or from a pin, so their
  // right-hand edge has to be predicted here or a pinned discretionary
  // country runs off the end of the chart.
  const discStart0 = rows.length ? Math.max(new Date(Math.min(...rows.map(r=>r.start.getTime()))).getTime(), NOW.getTime()) : NOW.getTime();
  const undatedEnd = undated.length ? Math.max(...undated.map(c => {
    const o = ovrOf(c[0]);
    const w = o.start ? D(o.start).getTime() : NaN;
    const st = isNaN(w) ? discStart0 : Math.max(w, discStart0);
    return addW(new Date(st), durOf(c).total).getTime();
  })) : 0;
  const t1 = rows.length
    ? new Date(Math.max(undatedEnd, ...rows.map(r => Math.max(r.golive.getTime(), r.segs[r.segs.length-1].e.getTime()))))
    : new Date(Math.max(undatedEnd, addW(NOW, progWeeks + longestUndated + 2).getTime()));
  const pad = (t1-t0)*0.03;
  const X0 = t0.getTime()-pad, X1 = t1.getTime()+pad;

  // L is the left gutter: country name at x=0, meta label right-anchored at
  // L-10. Widened from 168 because "United Kingdom · EU · SIMPLE · L1" and
  // "Czech Republic · EU · DISCRETIONARY" ran into each other (caught on
  // screenshot review, not by any assertion — nothing errors when two SVG
  // text nodes overlap, it just becomes unreadable). Long names are also
  // truncated, with the full name kept in a <title> for hover.
  const L = 190, R = 116, W = 1000, RH = 24, GAP = 4, HEAD = 34;
  const shortName = n => n.length > 18 ? n.slice(0, 17) + '\u2026' : n;
  const groups = [...new Set(rows.map(r=>r.waveKey))];
  const H = HEAD + (RH+GAP)*(rows.length + groups.length + 2 + (undated.length ? undated.length + 1 : 0)) + 16;
  const x = t => L + ((t - X0)/(X1 - X0))*(W - L - R);

  let s = \`<svg viewBox="0 0 \${W} \${H}" width="100%" style="min-width:820px;display:block" role="img" aria-label="Back-planned delivery timeline by jurisdiction">\`;
  // quarter gridlines
  let q = new Date(Date.UTC(t0.getUTCFullYear(), Math.floor(t0.getUTCMonth()/3)*3, 1));
  while(q.getTime() < X1){
    const px = x(q.getTime());
    if(px > L-1){
      s += \`<line x1="\${px}" y1="\${HEAD-8}" x2="\${px}" y2="\${H-10}" stroke="#2b3c5a" stroke-width="1"/>\`;
      s += \`<text x="\${px}" y="\${HEAD-14}" fill="#93a3c0" font-family="'IBM Plex Mono',monospace" font-size="9.5" text-anchor="middle">Q\${Math.floor(q.getUTCMonth()/3)+1} \${String(q.getUTCFullYear()).slice(2)}</text>\`;
    }
    q = new Date(Date.UTC(q.getUTCFullYear(), q.getUTCMonth()+3, 1));
  }
  let y = HEAD;
  // programme-level bar
  s += \`<text x="0" y="\${y+15}" fill="#e2b978" font-family="'IBM Plex Mono',monospace" font-size="9.5" letter-spacing="1">PROGRAMME</text>\`;
  y += RH + GAP;
  let pt = progBegin.getTime();
  s += \`<text x="0" y="\${y+15}" fill="#f2f0e8" font-size="12">Select &amp; contract</text>\`;
  progPhases.forEach(p => {
    const e = addW(new Date(pt), p.weeks);
    const x1 = x(pt), x2 = x(e.getTime());
    s += \`<rect x="\${x1+1}" y="\${y+4}" width="\${Math.max(2,x2-x1-2)}" height="\${RH-8}" rx="3" fill="\${p.c}"><title>\${p.n} — \${p.weeks} weeks (\${isoD(new Date(pt))} to \${isoD(e)})\\nProgramme-level: run once, not per country.</title></rect>\`;
    pt = e.getTime();
  });
  s += \`<text x="\${x(pt)+6}" y="\${y+16}" fill="#93a3c0" font-family="'IBM Plex Mono',monospace" font-size="9.5">\${progWeeks}w</text>\`;
  y += RH + GAP + 6;

  const REGSHORT = {Eu:'EU', Mi:'MEA', As:'APAC', Am:'AM'};
  let lastWave = null;
  rows.forEach(r => {
    if(r.waveKey !== lastWave){
      lastWave = r.waveKey;
      const wm = waveMeta.find(w => w.dl === lastWave);
      s += \`<text x="0" y="\${y+15}" font-family="'IBM Plex Mono',monospace" font-size="9.5" letter-spacing="1"><tspan fill="#e2b978">WAVE \${wm.dl}</tspan><tspan fill="#93a3c0" letter-spacing="0"> &middot; \${wm.n} countr\${wm.n===1?'y':'ies'} &middot; \${wm.effort}w effort &middot; \${wm.elapsed}w elapsed\${lanes>1&&wm.n>1?\` across \${Math.min(lanes,wm.n)} lanes\`:''}</tspan></text>\`;
      y += RH + GAP;
    }
    const cx = CXNAME[r.c[4]];
    s += \`<text x="0" y="\${y+15}" fill="#f2f0e8" font-size="12">\${shortName(r.c[0])}<title>\${r.c[0]}</title></text>\`;
    // c[8] marks a deadline that comes from EU law rather than the
    // country's own legislature. Worth saying on the row: a reader who
    // knows Austria has no national mandate needs to see why it is in a
    // 2030 wave, or they will assume the plan is wrong.
    s += \`<text x="\${L-10}" y="\${y+15}" fill="\${r.c[8] ? '#c98a3a' : '#93a3c0'}" font-family="'IBM Plex Mono',monospace" font-size="9" text-anchor="end">\${r.c[8] ? 'EU-WIDE' : REGSHORT[r.c[2]]} &middot; \${cx[0].toUpperCase()}\${lanes>1?\` &middot; L\${r.lane+1}\`:''}</text>\`;
    r.segs.forEach(sg => {
      const x1 = x(sg.s.getTime()), x2 = x(sg.e.getTime());
      s += \`<rect x="\${x1+1}" y="\${y+4}" width="\${Math.max(2,x2-x1-2)}" height="\${RH-8}" rx="3" fill="\${sg.c}"><title>\${r.c[0]} — \${sg.n}\\n\${sg.weeks} weeks: \${isoD(sg.s)} to \${isoD(sg.e)}</title></rect>\`;
    });
    // Go-live milestone. Only drawn on rows whose track actually ENDS at the
    // deadline — in a multi-country wave the earlier countries finish before
    // it, and putting a diamond on every row left them floating detached from
    // their own bars (caught on screenshot review).
    const gx = x(r.golive.getTime());
    const endsAtGoLive = Math.abs(r.segs[r.segs.length-1].e - r.golive) < 86400000;
    if(endsAtGoLive){
      s += \`<polygon points="\${gx},\${y+3} \${gx+7},\${y+RH/2} \${gx},\${y+RH-3} \${gx-7},\${y+RH/2}" fill="#efe9db" stroke="#0f1a2b" stroke-width="2"><title>\${r.c[0]} go-live — mandate deadline \${r.c[5]}</title></polygon>\`;
    } else {
      s += \`<line x1="\${gx}" y1="\${y+4}" x2="\${gx}" y2="\${y+RH-4}" stroke="#efe9db" stroke-width="1" stroke-dasharray="2 2" opacity="0.5"><title>\${r.c[0]} completes ahead of the \${r.c[5]} wave deadline</title></line>\`;
    }
    if(r.seq === 0 && r.lane === 0){
      const ICON = {critical:'▲', warning:'●', good:'✓'};
      const COL  = {critical:'#e0907f', warning:'#e2b978', good:'#7fd0a8'};
      const LBL  = {critical:\`late \${Math.abs(r.slipDays)}d\`, warning:\`start \${r.slipDays}d\`, good:\`\${r.slipDays}d\`};
      s += \`<text x="\${W-R+16}" y="\${y+15}" fill="\${COL[r.risk]}" font-family="'IBM Plex Mono',monospace" font-size="10">\${ICON[r.risk]} \${LBL[r.risk]}</text>\`;
    }
    y += RH + GAP;
  });

  // ---- discretionary wave: selected jurisdictions with no mandate ----
  // Dan, 12 Aug 2026: "Include countries with no mandate in the same phase
  // because there is no mandate go-live date to track therefore it can
  // start anytime." So they get one shared band, drawn from today
  // forwards rather than back-planned, with NO go-live diamond and no
  // slip calculation — there is no date to be late against, and drawing
  // a deadline marker on a country that has no deadline would be the
  // single most misleading thing this chart could do.
  if(undated.length){
    // Header says NO FIXED DEADLINE, not NO MANDATE. This band holds two
    // different populations and calling them all "no mandate" was wrong:
    // countries with no obligation at all, AND countries whose mandate is
    // already fully in force with nothing further dated. Both share the
    // property Dan actually gave as the reason — there is no go-live date
    // to back-plan from — but only one of them is optional. Caught on
    // screenshot review when Portugal and Ecuador, both live clearance
    // regimes, appeared under a "NO MANDATE" heading.
    const anyOverdue = undated.some(c => c[3] === 'i');
    s += \`<text x="0" y="\${y+15}" font-family="'IBM Plex Mono',monospace" font-size="9.5" letter-spacing="1"><tspan fill="#8d9bb5">NO FIXED DEADLINE</tspan><tspan fill="#93a3c0" letter-spacing="0"> &middot; \${undated.length} jurisdiction\${undated.length===1?'':'s'} &middot; \${anyOverdue ? 'already in force, or startable any time' : 'start any time'} once contracting completes</tspan></text>\`;
    y += RH + GAP;
    // NO COUNTRY TRACK MAY BEGIN BEFORE PROCUREMENT COMPLETES.
    // Dan, 12 Aug 2026: "all implementation phases need to start after the
    // contracting phase has complete." The dated waves already satisfy
    // this by construction — the programme bar is drawn backwards from the
    // earliest country start, so implementation begins exactly where
    // contracting ends. The discretionary band did not: it started at
    // today, which is before the platform exists. You cannot mobilise a
    // country onto a vendor you have not signed.
    //
    // Clamped to NOW as well, because when a wave is already late progEnd
    // sits in the past and no work can start there either.
    const discStart = Math.max(progEnd.getTime(), NOW.getTime());
    undated.forEach(c => {
      const {phases, total} = durOf(c);
      // A pinned start applies here too. "Start any time" is the default,
      // not a constraint — and "any time" is exactly the thing a planner
      // wants to turn into a date. The floor still holds: nothing may
      // begin before contracting completes, so a pin earlier than that is
      // clamped rather than honoured, and the row says so.
      const o = ovrOf(c[0]);
      const wanted = o.start ? D(o.start).getTime() : null;
      const pinnedEarly = wanted !== null && !isNaN(wanted) && wanted < discStart;
      let t = (wanted !== null && !isNaN(wanted)) ? Math.max(wanted, discStart) : discStart;
      const isPinned = wanted !== null && !isNaN(wanted);
      s += \`<text x="0" y="\${y+15}" fill="#8d9bb5" font-size="12">\${shortName(c[0])}<title>\${c[0]}</title></text>\`;
      // An already-in-force jurisdiction is not "start any time" — you are
      // late, and saying otherwise would be the comfortable lie rather than
      // the useful one.
      const meta = c[3] === 'i' ? '${tj("chart.inforce","IN FORCE")}' : (isPinned ? (pinnedEarly ? '${tj("chart.clamped","CLAMPED")}' : '${tj("chart.pinned","PINNED")}') : '${tj("chart.anytime","ANY TIME")}');
      s += \`<text x="\${L-10}" y="\${y+15}" fill="\${c[3]==='i' ? '#c98a3a' : (isPinned ? '#7fd0a8' : '#6b7a95')}" font-family="'IBM Plex Mono',monospace" font-size="9" text-anchor="end">\${meta}</text>\`;
      phases.forEach(pz => {
        const st = new Date(t), en = addW(st, pz.weeks);
        const x1 = x(st.getTime()), x2 = x(en.getTime());
        s += \`<rect x="\${x1+1}" y="\${y+4}" width="\${Math.max(2,x2-x1-2)}" height="\${RH-8}" rx="3" fill="\${pz.c}" opacity="0.5"><title>\${c[0]} — \${pz.n}\\n\${pz.weeks} weeks. Indicative placement only: there is no fixed deadline, so this can move — but it cannot start before contracting completes.</title></rect>\`;
        t = en.getTime();
      });
      s += \`<text x="\${x(t)+6}" y="\${y+16}" fill="#6b7a95" font-family="'IBM Plex Mono',monospace" font-size="9.5">\${total}w</text>\`;
      y += RH + GAP;
    });
  }

  // today marker
  const nx = x(NOW.getTime());
  if(nx > L && nx < W-R){
    s += \`<line x1="\${nx}" y1="\${HEAD-8}" x2="\${nx}" y2="\${H-10}" stroke="#b5432f" stroke-width="2" stroke-dasharray="4 3"/>\`;
    s += \`<text x="\${nx+5}" y="\${H-1}" fill="#b5432f" font-family="'IBM Plex Mono',monospace" font-size="9.5">today</text>\`;
  }
  s += \`</svg>\`;
  host.innerHTML = s;

  const late = waveMeta.filter(w=>w.risk==='critical').length, soon = waveMeta.filter(w=>w.risk==='warning').length;
  const typicalTrack = waveMeta.length ? Math.round(waveMeta.reduce((a,w)=>a+w.elapsed,0)/waveMeta.length) : 0;
  // With no dated waves there is no risk verdict to give and no critical
  // path to name, so the head note written above stands rather than being
  // overwritten with a reassurance about zero waves.
  if(!waveMeta.length){ document.getElementById('ganttLegend').innerHTML = ''; return rows; }
  const critPath = progWeeks > typicalTrack
    ? \`<div class="note"><strong>Procurement is your critical path, not delivery.</strong> Vendor selection and contracting run \${progWeeks} weeks against a typical wave of \${typicalTrack} weeks elapsed &mdash; so the date that actually moves everything is when you start procurement, not when a country team mobilises. Shortening the country build saves little; shortening procurement moves every deadline.</div>\`
    : '';
  document.getElementById('ganttHead').innerHTML = critPath + (late
    ? \`<div class="note warn"><strong>\${late} of \${waveMeta.length} waves back-plan to a start date that has already passed.</strong> Working backwards from the published deadline through your own phase assumptions, the latest responsible start for \${late === 1 ? 'that wave' : 'those waves'} in the past — so \${late === 1 ? 'it needs' : 'they need'} either compressed delivery, an interim filing approach, or an accepted late position. This is the single most useful output on the page, and it only exists because the deadlines are real.</div>\`
    : soon ? \`<div class="note"><strong>\${soon} wave\${soon===1?'':'s'} must start within 90 days</strong> to hit the published deadline on your current phase assumptions.</div>\`
    : \`<div class="note"><strong>Runway is comfortable across all \${waveMeta.length} waves</strong> on your current assumptions.</div>\`);

  document.getElementById('ganttLegend').innerHTML =
    \`<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:8px 0 10px;font-size:11.5px;color:#93a3c0">
      <span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:1px;text-transform:uppercase">Phase</span>
      \${PROG().concat(PH()).map(p=>\`<span style="display:inline-flex;align-items:center;gap:5px"><span style="width:11px;height:11px;border-radius:2px;background:\${p.c};display:inline-block"></span>\${p.n}</span>\`).join('')}
      <span style="display:inline-flex;align-items:center;gap:5px"><span style="display:inline-block;width:0;height:0;border:6px solid transparent;border-left-color:#efe9db;transform:rotate(45deg)"></span>Go-live</span>
      <span style="display:inline-flex;align-items:center;gap:5px;color:#e0907f">▲ already late</span>
      <span style="display:inline-flex;align-items:center;gap:5px;color:#e2b978">● start &lt;90d</span>
      <span style="display:inline-flex;align-items:center;gap:5px;color:#7fd0a8">✓ runway</span>
      <span>\${ev('durations','Durations: practitioner estimates')}</span>
    </div>\`;
  return rows;
}

// ---- calculate -------------------------------------------------------
// Once the visitor is through the gate they stay through it — changing an
// input and pressing Calculate again must just recalculate, not re-prompt.
// (Caught in browser testing: the first version re-showed the gate every
// time, which made the tool feel broken exactly when someone was doing the
// thing you want them to do — iterating on their own numbers.)
// ---- the adjust panel ------------------------------------------------
// Rebuilt on every calculation because the country selection drives it.
// Dated countries get both controls. Undated ones get the start date
// only, with the wave control disabled: there is no wave to move them
// between, but "start any time" is a default rather than a constraint,
// and turning "any time" into a date is most of what planning is. The
// first version left them out entirely, on reasoning Dan corrected.
function renderAdjust(sel){
  const host = document.getElementById('adjustRows');
  if(!host) return;
  const dated = sel.filter(c => c[5] && c[4] > 0)
                   .sort((a,b) => (a[5]||'').localeCompare(b[5]||'') || a[0].localeCompare(b[0]));
  // Countries with no fixed deadline are listed too, with the wave control
  // disabled and the start date live. The first version left them out on
  // the reasoning that there is no wave to move them between — true, and
  // beside the point: "start any time" is a default, not a constraint, and
  // turning "any time" into a date is most of what planning is.
  const undated = sel.filter(c => !(c[5] && c[4] > 0))
                     .sort((a,b) => a[0].localeCompare(b[0]));
  const waves = [...new Set(sel.map(c => ovrOf(c[0]).dl || c[5]).filter(Boolean))].sort();
  if(!dated.length && !undated.length){
    host.innerHTML = '<p class="hint">Nothing is selected, so there is nothing to rearrange.</p>';
    return;
  }
  host.innerHTML = \`
    <div class="grid" style="grid-template-columns:1fr auto auto;gap:8px 12px;align-items:center">
      <span class="hint" style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase">Jurisdiction</span>
      <span class="hint" style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase">Wave (go-live)</span>
      <span class="hint" style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase">Pinned start</span>
      \${dated.map(c => {
        const o = ovrOf(c[0]);
        const cur = o.dl || c[5];
        // The marker on one option says WHY that date is this country's
        // default, and it had better name the right source. It read
        // "computed", which was wrong twice over: nothing here is derived,
        // and for an EU member with no national B2B date the date is not
        // the country's own at all — it is the ViDA 2030 row, which is
        // exactly the distinction a reader adjusting a plan needs.
        const src = c[8] ? '${tj("adjust.eudeadline", "EU-wide deadline")}'
                         : '${tj("adjust.owndeadline", "own deadline")}';
        const opts = waves.map(w => \`<option value="\${w}"\${w===cur?' selected':''}>\${w}\${w===c[5]?' \\u00b7 '+src:''}</option>\`).join('');
        return \`
        <span style="font-size:13px">\${c[0]}\${(o.dl||o.start)?' <span class="tag tD" style="margin-left:4px">adjusted</span>':''}</span>
        <select data-ovr-dl="\${c[0]}" style="font-size:12.5px;padding:3px 6px;max-width:190px">\${opts}</select>
        <input type="date" data-ovr-start="\${c[0]}" value="\${o.start||''}" style="font-size:12.5px;padding:3px 6px">\`;
      }).join('')}
      \${undated.length ? \`<span class="hint" style="grid-column:1/-1;margin:8px 0 0;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase">${tj("adjust.undated","No fixed deadline &middot; startable once contracting completes")}</span>\` : ''}
      \${undated.map(c => {
        const o = ovrOf(c[0]);
        return \`
        <span style="font-size:13px">\${c[0]}\${o.start?' <span class="tag tD" style="margin-left:4px">adjusted</span>':''}</span>
        <select disabled style="font-size:12.5px;padding:3px 6px;min-width:190px;opacity:.55"><option>\${c[3]==='i' ? '${tj("adjust.inforce","in force &middot; no further date")}' : '${tj("adjust.nodeadline","no deadline")}'}</option></select>
        <input type="date" data-ovr-start="\${c[0]}" value="\${o.start||''}" style="font-size:12.5px;padding:3px 6px">\`;
      }).join('')}
    </div>\`;
  if(ovrRefocus){
    const back = host.querySelector(ovrRefocus);
    if(back) back.focus({preventScroll: true});
    ovrRefocus = null;
  }
  host.querySelectorAll('[data-ovr-dl]').forEach(el => el.onchange = () => {
    const n = el.getAttribute('data-ovr-dl');
    OVR[n] = {...ovrOf(n), dl: el.value};
    ovrRefocus = '[data-ovr-dl="' + n + '"]';
    showResults();
  });
  host.querySelectorAll('[data-ovr-start]').forEach(el => el.onchange = () => {
    const n = el.getAttribute('data-ovr-start');
    const v = el.value;
    OVR[n] = {...ovrOf(n)};
    if(v) OVR[n].start = v; else delete OVR[n].start;
    ovrRefocus = '[data-ovr-start="' + n + '"]';
    showResults();
  });
}
document.getElementById('adjustReset').onclick = (e) => {
  e.preventDefault();
  Object.keys(OVR).forEach(k => delete OVR[k]);
  showResults();
};
document.getElementById('adjust').addEventListener('toggle', function(){
  document.getElementById('adjustChevron').textContent =
    this.open ? 'hide ▴' : 'show ▾';
});

// The scroll argument is opt-in, and only the two deliberate "show me
// the results" actions pass it. Everything else here is someone EDITING
// while reading — a currency switch, a scope change, a pinned date — and
// yanking the viewport back to the top of the results on every keystroke
// makes the adjust panel unusable. Dan found this within minutes.
function showResults(scroll){
  // The panel's own controls call this, and build() re-renders the panel
  // from scratch — so remember whether it was open, or changing a wave
  // would slam the drawer shut on the person using it.
  const adj = document.getElementById('adjust');
  const wasOpen = adj && adj.open;
  build();
  if(adj && wasOpen) adj.open = true;
  document.getElementById('results').classList.remove('hidden');
  document.getElementById('print').classList.remove('hidden');
  if(scroll) document.getElementById('results').scrollIntoView({behavior:'smooth'});
}
document.getElementById('run').onclick = () => {
  if(unlocked){ showResults(true); return; }
  document.getElementById('gate').classList.remove('hidden');
  document.getElementById('gate').scrollIntoView({behavior:'smooth', block:'center'});
};
document.getElementById('signin').onclick = () => {
  unlocked = true;
  setSubsAvailable(true);
  document.getElementById('gate').classList.add('hidden');
  document.getElementById('run').textContent = '${t("btn.recalculate", "Recalculate")}';
  showResults(true);
};
document.getElementById('print').onclick = () => window.print();
const syncScope = () => { document.getElementById('chgRow').style.display = scopeVal()==='both' ? '' : 'none'; };
document.getElementById('scope').onchange = () => { syncScope(); if(unlocked) showResults(); };
syncScope();

function build(){
  cur = document.getElementById('cur').value;
  const volAP = +document.getElementById('volAP').value || 0;
  const volAR = +document.getElementById('volAR').value || 0;
  const erp   = +document.getElementById('erp').value || 1;
  const costNow = +document.getElementById('costNow').value || 0;
  const savePct = (+document.getElementById('savePct').value || 0)/100;
  const errCost = +document.getElementById('errCost').value || 0;
  const fteCost = +document.getElementById('fteCost').value || 0;
  const fteEntry = +document.getElementById('fteEntry').value || 0;
  const sel = chosen();

  // --- Layer 1
  // AR is included deliberately. An earlier version collected the AR volume
  // and then never used it, which was backwards: a mandate applies to what
  // you ISSUE, so the sending side is the half that is actually compelled.
  const costAR  = +document.getElementById('costAR').value || 0;
  const errRate = (+document.getElementById('errRate').value || 0)/100;
  const baseline = volAP * costNow;
  const saving   = baseline * savePct;
  const savingAR = volAR * costAR * savePct;
  const errNow   = volAP * errRate;
  const errSave  = errNow * errCost * 0.8;        // user-owned assumption, stated as such
  const l1 = saving + savingAR + errSave;

  // --- complexity / waves
  const complex = sel.filter(c=>c[4]===2), simple = sel.filter(c=>c[4]===1);
  const watch = sel.filter(c=>c[4]===0);
  const dated = sel.filter(c=>c[5]).sort((a,b)=>a[5]<b[5]?-1:1);
  // Every country you build for counts once per ERP system. The old model
  // counted clearance countries at full rate and "reporting" countries at
  // HALF — a fudge that stood in for "reporting is a bit easier" without
  // anyone claiming to know by how much, and which drove the entire
  // one-off figure. The difference in effort now lives in the RATE
  // instead, which is both easier to defend and easier to override with a
  // real quote. No-mandate countries are costed at the simple rate: with
  // nothing to comply with, a plain connection is all that is left.
  const intSimple  = (simple.length + watch.length) * erp;
  const intComplex = complex.length * erp;
  const integrations = intSimple + intComplex;

  // --- Layer 2 (modelled from assumptions only)
  //
  // THIS USED TO BE VOLUME-BLIND, and at scale it produced a wrong answer
  // with a straight face. It read:
  //
  //     taxFteSaved = min(complexCount * 0.15, 3)
  //
  // Two invented absolutes, neither of which knew how many invoices the
  // business processes. Dan found it by putting 1,000,000 in the volume
  // box: direct savings went up tenfold, the indirect line did not move
  // one dollar, and because the platform fee now scales with volume the
  // compliance-only case flipped from +96,000 to -444,000 and reported
  // that the programme never pays back. A larger invoice estate means
  // MORE tax reporting effort, not the same amount.
  //
  // The fix is to stop counting FTE in absolute terms and start counting
  // them as a SHARE OF THE AP HEADCOUNT THE VOLUME IMPLIES, using APQC's
  // published median of 12,000 invoices per AP FTE per year — a grade A,
  // primary, attributable benchmark, and the only citable bridge between
  // invoice volume and headcount that survived checking.
  //
  // The two ratios are still ours and still grade D. What changed is that
  // they are now DIMENSIONLESS: a share of a benchmarked base rather than
  // a headcount pulled out of the air, so the answer scales with the
  // business instead of standing still.
  //
  // CALIBRATED FOR EXACT CONTINUITY. 0.018 and 0.36 are not new opinions:
  // at the page's default 100k AP volume they reproduce the old 0.15 and
  // 3 to the penny (100,000/12,000 = 8.333 implied FTE; 8.333 x 0.018 =
  // 0.15; 8.333 x 0.36 = 3.00), and the cap still starts binding at 20
  // complex jurisdictions. Nothing a reader saw yesterday moves. This
  // change is about SHAPE, not magnitude, and doing both at once would
  // have made it impossible to tell which one caused a number to move.
  //
  // The magnitude is a separate and open question, raised with Dan rather
  // than decided here: 0.36 means 36% of the entire AP function saved on
  // tax reporting and audit prep alone, which is hard to defend. It was
  // equally hard to defend yesterday — it was just invisible, because a
  // headcount of "3" does not announce what proportion it represents.
  // Expressing it as a proportion is what made it arguable at all, and
  // tuning it is now a one-line migration rather than a code change.
  const apFteImplied = TAXM.invPerFte > 0 ? volAP / TAXM.invPerFte : 0;
  const ctcCount = complex.length;
  const shareRaw  = ctcCount * TAXM.perJur;
  const shareUsed = Math.min(shareRaw, TAXM.cap);
  const taxFteSaved = ctcCount ? apFteImplied * shareUsed : 0;
  const l2 = taxFteSaved * fteCost;
  const taxCapBinds = ctcCount > 0 && shareRaw > TAXM.cap;

  // --- the same AP saving, expressed as data-entry headcount.
  //
  // Dan asked for two rates under the assumptions panel: one for the
  // data-entry and mailroom role e-invoicing actually removes, one for
  // the tax or finance professional whose reporting effort falls. This
  // is the first of the two.
  //
  // IT IS DELIBERATELY NOT A BENEFIT ROW. The ATO / Deloitte source this
  // page already cites states that most of the paper and PDF invoice cost
  // "is attributable to the manual work required to enter the invoice
  // data into your systems" — so the per-invoice benchmark IS the labour,
  // and adding an FTE-priced saving beside the processing-cost row would
  // count the same money twice. It is the first question a finance
  // committee asks, and the answer would have been yes.
  //
  // What it does instead is decompose a number already in the model into
  // people, which is what anyone actually acts on: nobody approves a
  // programme on "$590,400 of processing cost", they approve it on "two
  // of your three-and-a-half capture heads".
  const captureFte   = apFteImplied * TAXM.captureShare;
  const captureSaved = captureFte * savePct;
  const captureValue = captureSaved * fteEntry;

  const scope = scopeVal(), banked = scope === 'both';

  // WHAT COMPLIANCE ALONE ACTUALLY BANKS (Dan, 14 Aug 2026).
  //
  // "Every customer I have talked with looking to implement compliance in
  // the last 2-3 years is meeting mandates alone, and never wants to
  // combine it with AP automation. That project is just too large for any
  // enterprise to tackle in one project."
  //
  // Until now this was an all-or-nothing switch: banked = scope === both,
  // and annualBenefit = (banked ? l1 : 0) + l2. So on the scope that every
  // real customer picks, the entire direct total was multiplied by zero,
  // and the page told them the actual investment case was to do both at
  // once — advice nobody takes, offered to everybody.
  //
  // The reality is not all-or-nothing, because the rows do not depend on
  // the same thing:
  //
  //   AP capture and validation  BANKED BY COMPLIANCE. You cannot receive
  //     a cleared structured invoice and still key it. The integration
  //     that makes you compliant is the integration that removes the
  //     keying. Split at the ATO / Deloitte task times already in D1 —
  //     receipt 7 + validation 2, against review 7 + approval 5.
  //   AP review and approve      NOT BANKED. That is workflow, and
  //     workflow needs the change programme.
  //   AR issuing                 BANKED BY COMPLIANCE. The mandate forces
  //     structured issuance; the printing and PDF-ing stops by law rather
  //     than by choice.
  //   Avoided rework             NOT BANKED, deliberately, though the
  //     argument for it is decent — no keying, no keying errors. It rests
  //     on HMRC's unsourced 10% error rate on top of a user-set rework
  //     cost, which makes it the weakest-evidenced row in the model and
  //     the largest single beneficiary of this change. Dan's call, and
  //     the right one: banking it would have moved payback to about seven
  //     months on the back of the least defensible number here.
  //
  // This makes the answer materially better, which is exactly why the
  // reasoning is stated per row on the page rather than in a footnote.
  // "The number improved after the vendor changed the model" is the
  // criticism this page exists to be immune to.
  const bankedAP  = banked ? saving : saving * TAXM.captureShare;
  const bankedErr = banked ? errSave : 0;
  const l1Banked  = bankedAP + savingAR + bankedErr;
  const l1Unbanked = l1 - l1Banked;
  document.getElementById('summary').innerHTML = \`
    <div class="grid g4">
      <div class="stat"><div class="n" style="color:#7fd0a8">\${fmt(l1Banked)}</div><div class="l">${tj("res.direct","Direct")} &mdash; ${tj("res.banked","banked annually")}\${l1Unbanked > 0 ? \` (+\${fmt(l1Unbanked)} ${tj("res.unbanked","unlocked, not banked")})\` : ''}</div></div>
      <div class="stat"><div class="n" style="color:#e2b978">\${fmt(l2)}</div><div class="l">${tj("res.indirect","Indirect &mdash; modelled")}</div></div>
      <div class="stat"><div class="n">\${sel.length}</div><div class="l">${tj("res.inScope","Jurisdictions in scope")}</div></div>
      <div class="stat"><div class="n" style="color:\${dated.length?'#e08b7a':'#8d9bb5'}">\${dated.length}</div><div class="l">${tj("res.dated","With a dated deadline ahead")}</div></div>
    </div>
    <div class="note" style="margin-top:14px">\${banked
      ? \`<strong>Scope: compliance + AP process automation.</strong> Every direct row counts, because your programme includes the process redesign and retraining, and the timeline below carries a process-change phase per country to match. This is the less common shape: most enterprises meet the mandate on its own first, because doing both at once is too large a programme to land in one go. \`
      : \`<strong>Scope: compliance only &mdash; the usual shape.</strong> \${fmt(l1Banked)} a year banks without any process-change programme, because the integration that makes you compliant is the same integration that stops you keying invoices and stops you posting paper. The remaining \${fmt(l1Unbanked)} is review, approval and rework &mdash; workflow, which needs the change programme, and which is why it sits unbanked above rather than counted. \`}Direct savings are what AP process automation delivers; indirect savings are what the compliance regime itself delivers. A mandate integration is an IT workstream that unlocks the first and delivers the second &mdash; worth separating in front of a board, because only one of them is non-negotiable. The two are deliberately <strong>not</strong> added together. Direct savings rest on published figures; indirect ones rest on assumptions you set, because no credible source quantifies them. A CFO will trust a smaller defended number over a larger asserted one.</div>
    <div class="card"><p style="margin:0">Across <strong>\${sel.length}</strong> jurisdictions you have <strong>\${complex.length} complex</strong> (CTC or 5-corner) and <strong>\${simple.length} simple</strong> (4-corner exchange) regime\${simple.length===1?'':'s'}\${watch.length?\`, plus \${watch.length} with no mandate${hlp('nomandate','Why these are still in the plan')}\`:''}. With \${erp} ERP/billing system\${erp===1?'':'s'} that is roughly <strong>\${integrations} country-system integration\${integrations===1?'':'s'}</strong>${hlp('integrations','How this is derived')} to deliver. \${dated.length?\`The nearest binding date is <strong>\${dated[0][5]}</strong> (\${dated[0][0]}).\`:'None of the selected jurisdictions has a future dated deadline on the tracker today.'} \${ev('site','Source: live tracker data')}</p></div>\`;

  const pace = +document.getElementById('pace').value || 1;
  const ganttRows = buildGantt(sel, erp, pace);
  const euDrivenCount = sel.filter(c=>c[8]).length;
  document.getElementById('waveIntro').innerHTML = \`Back-planned from each jurisdiction's actual published deadline \${ev('site','dates from the tracker')}, through phase durations you control \${ev('durations','practitioner estimates')}. Grouped by region, then by go-live date. Vendor selection and contracting are modelled once at programme level rather than repeated per country.\${euDrivenCount?\` <strong>\${euDrivenCount} of your jurisdictions are here on an EU-wide obligation</strong> rather than a national mandate${hlp('vida','Where these deadlines come from')}.\`:''}\`;
  let w = dated.length ? \`<table><thead><tr><th>Deadline</th><th>Jurisdiction</th><th>Status</th><th>Model${hlp('complexity','How complexity is assigned')}</th><th class="num">Integrations${hlp('integrations','How this is derived')}</th><th>Why</th></tr></thead><tbody>\` : '';
  dated.forEach(c=>{
    const st=STATUS[c[3]], cx=CXNAME[c[4]];
    const ints = erp;   // every country you build for, once per ERP system
    const why = c[8]
      ? \`<strong style="color:#e2b978">EU-wide obligation.</strong> Council Directive (EU) 2025/516 binds this member state from 1 July 2030 regardless of whether it legislates a domestic mandate. \${CXNOTE[c[4]]}\`
      : CXNOTE[c[4]];
    w += \`<tr><td><strong>\${c[5]}</strong>\${c[8]?' <span class="pill p-upcoming">EU</span>':''}</td><td>\${c[0]}</td><td><span class="pill \${st[1]}">\${st[0]}</span></td><td><span class="pill \${cx[1]}">\${cx[0]}</span></td><td class="num">\${ints}</td><td style="font-size:12px;color:var(--muted)">\${why}</td></tr>\`;
  });
  w += dated.length ? '</tbody></table>' : '<div class="note">No selected jurisdiction has a future dated deadline. Those already in force still need remediation work &mdash; see the in-force list below.</div>';
  if(watch.length) w += \`<div class="note" style="margin-top:12px"><strong>No mandate, included by your selection (\${watch.length}):</strong> \${watch.map(c=>c[0]).join(', ')}. Costed at the simple rate and scheduled as one discretionary wave &mdash; there is no deadline to miss, so this work can start whenever you have capacity.</div>\`;
  const inforceNoDate = sel.filter(c=>c[3]==='i' && !c[5]);
  if(inforceNoDate.length) w += \`<div class="note" style="margin-top:12px"><strong>Already in force, no further dated step (\${inforceNoDate.length}):</strong> \${inforceNoDate.map(c=>c[0]).join(', ')}. These are compliance-now, not project-plan items.</div>\`;
  document.getElementById('waves').innerHTML = w;
  const tbl = document.getElementById('tblToggle');
  tbl.onclick = () => {
    const el = document.getElementById('waves');
    const shown = !el.classList.contains('hidden');
    el.classList.toggle('hidden');
    tbl.textContent = shown ? 'Show as table' : 'Hide table';
  };

  document.getElementById('direct').innerHTML = \`
    <table><thead><tr><th>Benefit</th><th>Basis</th><th class="num">Annual value</th></tr></thead><tbody>
    <tr class="tierA"><td>Processing cost reduction (AP) <span class="tag tang">tangible</span> <span class="tag \${banked?'bank':'unbank'}">\${banked?'banks':Math.round(TAXM.captureShare*100)+'% banks'}</span></td><td>\${volAP.toLocaleString()} invoices &times; \${fmt1(costNow)} \${ev('ardent','baseline')} &times; \${Math.round(savePct*100)}% \${ev('hmrc60','reduction')}</td><td class="num">\${fmt(saving)}</td></tr>
    <tr class="tierA"><td>Issuing cost reduction (AR) <span class="tag tang">tangible</span> <span class="tag bank">banks</span></td><td>\${volAR.toLocaleString()} invoices &times; \${fmt1(costAR)} \${ev('ato','ATO / Deloitte')} &times; \${Math.round(savePct*100)}% \${ev('hmrc60','reduction')}</td><td class="num">\${fmt(savingAR)}</td></tr>
    <tr class="tierB"><td>Avoided rework on data-entry errors <span class="tag tang">tangible</span> <span class="tag \${banked?'bank':'unbank'}">\${banked?'banks':'not banked'}</span></td><td>\${Math.round(errNow).toLocaleString()} errored invoices \${ev('hmrcErr',\`at ~\${Math.round(errRate*100)}%\`)} &times; \${fmt(errCost)} \${ev('yours','your rework cost')} &times; 80% \${ev('ardentExc','not Ardent&rsquo;s 18.4% exception rate')}</td><td class="num">\${fmt(errSave)}</td></tr>
    <tr class="tierA"><td>Faster cycle time &amp; fewer supplier queries <span class="tag intang">intangible</span></td><td>Top-performing AP spends <strong>12.8%</strong> of staff time on supplier inquiries against <strong>24.0%</strong> for everyone else \${ev('ardentInq','Ardent Partners, 2025 data')}. Measured and primary &mdash; but an association with high-performing AP as a whole, not a measured effect of e-invoicing, so <strong>deliberately not monetised</strong>. The matching cycle-time gap \${ev('ardentCycle','2.9 vs 13.5 days')} is circular by construction and is not offered as evidence; \${ev('nhs','one NHS trust')} reports queries down ~15%, which is an anecdote.</td><td class="num">&mdash;</td></tr>
    <tr class="tierA"><td>Paper, print, postage, storage <span class="tag tang">tangible</span></td><td>Paper AUD 30.87 vs e-invoice AUD 9.18 \${ev('ato','ATO / Deloitte')}; your own spend is the better input</td><td class="num">&mdash;</td></tr>
    <tr style="border-top:2px solid var(--line)"><td colspan="2"><strong>Direct total &mdash; banked on this scope</strong>\${l1Unbanked > 0 ? \` <span class="hint" style="display:inline">(\${fmt(l1Unbanked)} unlocked and not banked, of \${fmt(l1)})</span>\` : ''}</td><td class="num"><strong style="color:#7fd0a8">\${fmt(l1Banked)}</strong></td></tr>
    </tbody></table>
    <div class="note warn" style="margin-top:12px">${tj("res.scopeCaveat","<strong>What banks, and what you have to go and get.</strong> Each row above says which it is. Capture and issuing arrive with the integration &mdash; once invoices come in structured and go out cleared, nobody is keying or posting them, whatever else you do or do not change. Review, approval and the rework that follows them are workflow, and workflow only improves if you redesign and retrain, which is a separate programme with its own cost and its own risk. The split between the two comes from the ATO / Deloitte task times, not from us. Rework is held unbanked even on a compliance scope despite a decent argument that it should not be: it rests on the least well-evidenced figures in this model, and the row that gains most from a change is the wrong row to be generous with.")}</div>
    <div class="note warn" style="margin-top:12px"><strong>${tj("res.headcount.h","What this means in headcount.")}</strong> Your \${volAP.toLocaleString()} AP invoices imply <strong>\${apFteImplied.toFixed(1)} AP FTE</strong> \${ev('apqc','APQC median, 12,000 per FTE')}, of which \${Math.round(TAXM.captureShare*100)}% is capture and validation \${ev('atoCapture','ATO / Deloitte task times')} &mdash; about <strong>\${captureFte.toFixed(1)} FTE keying invoices today</strong>. At \${Math.round(savePct*100)}% reduction that releases <strong>\${captureSaved.toFixed(1)} FTE</strong>, worth \${fmt(captureValue)} at your data-entry rate.<br><br>${tj("res.headcount.same","<strong>This is the same money as the processing-cost row above, expressed as people &mdash; not an additional saving.</strong> The per-invoice benchmark is labour-dominated, so counting both would count it twice.")}\${saving > 0 ? \`<br><br>${tj("res.headcount.gap","Worth noticing how much of the top line it accounts for:")} \${fmt(captureValue)} of \${fmt(saving)}, or \${Math.round(captureValue/saving*100)}%. ${tj("res.headcount.gap2","The rest is the review-and-approve half of the process, technology and overhead &mdash; all inside the per-invoice benchmark, none of it a data-entry head. And released capacity is only cash if the post goes or is not backfilled, which is a decision rather than a benefit.")}\` : ''}</div>
    <div class="note" style="margin-top:10px">${tj("res.unmonetised", "Two benefits above are left unmonetised on purpose, and for <em>different</em> reasons. Paper, print and postage has no benchmark worth defending &mdash; your own spend is the only honest input. Cycle time and supplier queries has a good one, and still cannot be monetised: nobody has measured how much of that gap e-invoicing itself causes, and assuming all of it would undermine every other number on this page.")}</div>\`;

  document.getElementById('indirect').innerHTML = \`
    <table><thead><tr><th>Benefit</th><th>Evidence position</th><th class="num">Annual value</th></tr></thead><tbody>
    <tr class="tierA"><td>Reduced tax reporting &amp; audit-prep effort <span class="tag tang">tangible</span></td><td>Mechanism evidenced \${ev('oecd','OECD DCTR, 2026')}. Your \${volAP.toLocaleString()} AP invoices imply <strong>\${apFteImplied.toFixed(1)} AP FTE</strong> \${ev('apqc','APQC median, 12,000 per FTE')}; \${ctcCount} clearance or reporting \${ctcCount===1?'jurisdiction':'jurisdictions'} put <strong>\${(shareUsed*100).toFixed(1)}%</strong> of that in scope \${ev('yours','our assumption')}\${taxCapBinds?' <em>(capped)</em>':''} &mdash; \${taxFteSaved.toFixed(2)} FTE &times; \${fmt(fteCost)}</td><td class="num">\${fmt(l2)}</td></tr>
    <tr class="tierC"><td>VAT leakage / gap recovery <span class="tag intang">intangible</span></td><td>Often quoted, <strong>not defensible</strong> \${ev('vatgap','why not')} &mdash; excluded from this model entirely</td><td class="num">&mdash;</td></tr>
    <tr class="tierD"><td>Penalty &amp; remediation exposure avoided <span class="tag intang">intangible</span></td><td>\${sel.filter(c=>c[6]>0).length} of your jurisdictions publish a quantified penalty schedule \${ev('site','on their deep dives')}. Size it from those, per country &mdash; there is no credible aggregate</td><td class="num">&mdash;</td></tr>
    <tr class="tierD"><td>Fraud detection, working-capital visibility <span class="tag intang">intangible</span></td><td>Strategic benefits; no benchmark exists \${ev('yours','your call')}</td><td class="num">&mdash;</td></tr>
    </tbody></table>
    <div class="note warn" style="margin-top:12px">${tj("res.indirectWhy","<strong>Why the indirect column is smaller than you would expect.</strong> The compliance case is genuinely compelling &mdash; but almost every circulating number attached to it fails verification. This model shows only what can be defended and names what cannot, which is a stronger position in front of a finance committee than a bigger number that collapses under a single question.")}</div>\`;

  // ---- investment: without a cost side this is a benefits calculator, not ROI
  const cImplS = +document.getElementById('cImplS').value || 0;
  const cImplC = +document.getElementById('cImplC').value || 0;
  const cPlat = +document.getElementById('cPlat').value || 0;
  const cRun  = +document.getElementById('cRun').value || 0;
  const oneOff = intSimple * cImplS + intComplex * cImplC;
  const annualCost = cPlat + cRun;
  const annualBenefit = l1Banked + l2;
  const netAnnual = annualBenefit - annualCost;
  const paybackMonths = netAnnual > 0 ? (oneOff / netAnnual) * 12 : null;
  const placeholders = ['cImplS','cImplC','cPlat','cRun'].filter(id => String(document.getElementById(id).value) === String(DEFAULTS[id].v));

  document.getElementById('invest').innerHTML = \`
    \${placeholders.length ? \`<div class="note warn"><strong>\${placeholders.length} of 4 cost inputs are still placeholders.</strong> Please replace them with vendor budgetary estimates in the assumptions panel, and treat the ROI as illustrative until actuals can be provided.</div>\` : ''}
    <div class="grid g4">
      <div class="stat"><div class="n" style="color:#e0907f">\${fmt(oneOff)}</div><div class="l">One-off &mdash; \${intComplex} complex + \${intSimple} simple</div></div>
      <div class="stat"><div class="n" style="color:#e0907f">\${fmt(annualCost)}</div><div class="l">${tj("res.annualRun","Annual run cost")}</div></div>
      <div class="stat"><div class="n" style="color:\${netAnnual>=0?'#7fd0a8':'#e0907f'}">\${fmt(netAnnual)}</div><div class="l">Net annual \${banked?'benefit':'(compliance scope)'}</div></div>
      <div class="stat"><div class="n" style="color:\${paybackMonths&&paybackMonths<=24?'#7fd0a8':'#e2b978'}">\${paybackMonths===null?'n/a':Math.round(paybackMonths)+'mo'}</div><div class="l">${tj("res.payback","Payback on one-off")}</div></div>
    </div>
    \${!banked ? \`<div class="note" style="margin-top:12px">${tj("res.complianceOnly","<strong>This is a compliance-only case, and it is the normal one.</strong> Enterprises meeting a mandate almost never bundle AP process automation into the same programme &mdash; it is too large to land in one go. What counts above is only what the integration itself delivers: you stop keying inbound invoices and stop issuing paper, because the mandate leaves you no way to do either.")} \${l1Unbanked > 0 ? \`${tj("res.complianceOnly2","The further")} \${fmt(l1Unbanked)} ${tj("res.complianceOnly3","is review, approval and rework. It stays unbanked because it needs a change programme you are not running &mdash; but it does not go away, and it is the option this integration buys you for later. If the net figure is negative, that is a real answer rather than a broken one: you are buying the right to keep trading in these markets.")}\` : ''}</div>\` : ''}
    <div class="note" style="margin-top:12px">${tj("res.tangible","<strong>Tangible versus intangible.</strong> Everything counted above is tangible: a number someone can be held to. The intangible benefits &mdash; faster cycle times, penalty exposure avoided, fraud detection, VAT position &mdash; are listed in the two sections above and deliberately carry no value. They are real, they often matter more to a board than the arithmetic, and there is no honest way to price them. Present them as the qualitative case alongside this number, not inside it.")}</div>\`;

  document.getElementById('evidence').innerHTML = \`
    <div class="grid g2">
      <div class="card tierA"><h3>${tj("ev.gradeA","Grade A")} <span class="tag tA">${tj("ev.gradeA.tag","measured &amp; primary")}</span></h3><p class="hint">${tj("ev.gradeA.body","Ardent Partners 2025 (cost, cycle time, exception and supplier-inquiry rates) &middot; ATO / Deloitte Access Economics (paper vs PDF vs e-invoice, 2016 vintage, stated) &middot; OECD DCTR 2026 (mechanism) &middot; this site&rsquo;s own tracker data.")}</p></div>
      <div class="card tierB"><h3>${tj("ev.gradeB","Grade B")} <span class="tag tB">${tj("ev.gradeB.tag","credible body, unattributed")}</span></h3><p class="hint">${tj("ev.gradeB.body","HMRC/DBT 60&ndash;80% cost reduction and ~10% manual error rate. Both appear in a UK government consultation; neither carries a source within it. Real enough to use, not strong enough to lead with.")}</p></div>
      <div class="card tierC"><h3>${tj("ev.gradeC","Grade C")} <span class="tag tC">${tj("ev.gradeC.tag","anecdote, not benchmark")}</span></h3><p class="hint">${tj("ev.gradeC.body","The NHS trust figures (24h vs 10 days, 2&times; payment speed, 15% fewer queries) &mdash; one unnamed, undated organisation. The VAT-gap figures, which are European Commission/CASE rather than OECD, and whose own country analyses credit economic recovery rather than digital reporting.")}</p></div>
      <div class="card tierD"><h3>${tj("ev.gradeD","Grade D")} <span class="tag tD">${tj("ev.gradeD.tag","your assumption")}</span></h3><p class="hint">${tj("ev.gradeD.body","Rework cost per errored invoice, loaded FTE cost, tax-effort saving. Nothing is claimed for these; they are exposed so the model can be argued with rather than believed.")}</p></div>
    </div>
    <div class="note" style="margin-top:14px">Corrections applied during verification: the VAT-gap figures were re-attributed from OECD to the European Commission, Hungary&rsquo;s start figure corrected 9.8%&rarr;10.4% and Poland&rsquo;s 12.7%&rarr;12.5%, and the &ldquo;reduced penalty exposure&rdquo; claim was removed from the HMRC attribution &mdash; the word &ldquo;penalty&rdquo; does not appear in that consultation.</div>\`;

  // ---- sanity guards on what we just rendered ----------------------
  // Design review, "add sanity assertions to rendered output": the page
  // should refuse to present an obviously wrong number confidently. The
  // failure mode this system is most prone to is not a crash, it is a
  // plausible answer, and every one of these has actually occurred.
  const warn = [];

  // 1. Integrations of zero against a selection that includes a mandated
  //    country. This is what nine countries scoring 'none' looked like in
  //    August: a business case that quietly halved its own cost.
  const mandated = sel.filter(c => c[4] > 0);
  if(mandated.length && (intSimple + intComplex) === 0){
    warn.push(\`<strong>\${mandated.length} selected \${mandated.length===1?'jurisdiction has':'jurisdictions have'} a mandate, but the model has costed zero integrations.</strong> That is not a cheap programme, it is a broken calculation — treat every figure below as unsafe until it is explained.\`);
  }

  // 2. A payback so fast it is not credible. Nothing in this field pays
  //    back in under a month; if it does, an input is wrong by an order
  //    of magnitude.
  if(paybackMonths !== null && paybackMonths > 0 && paybackMonths < 1){
    warn.push(\`<strong>Payback under one month.</strong> No e-invoicing programme pays back that fast. Check the volumes and the per-invoice costs — one of them is out by an order of magnitude, and the rest of this page inherits it.\`);
  }

  // 3. THE ONE THAT NEEDED MIGRATION 520. A selected country whose
  //    planned deadline is later than an obligation it actually has, or
  //    which is being scheduled as discretionary while holding a dated
  //    one. Before obligation_status existed there was no way to ask
  //    this: an off-board row was indistinguishable from a superseded
  //    one, so the planner could file Denmark under "no fixed deadline"
  //    with a straight face.
  const mistimed = sel.filter(c => c[9] && (!c[5] || c[9] < c[5]));
  if(mistimed.length){
    warn.push(\`<strong>\${mistimed.length} selected \${mistimed.length===1?'jurisdiction has an obligation':'jurisdictions have obligations'} earlier than the date this plan plans for.</strong> \${mistimed.map(c => \`\${c[0]} &mdash; \${c[9]}\${c[5] ? \` (planned for \${c[5]})\` : ' (planned as discretionary)'}\`).join('; ')}. These are dated, live obligations that the arrivals board does not display, so the wave plan below does not schedule them. The runway shown for \${mistimed.length===1?'it':'them'} is longer than the runway \${mistimed.length===1?'it':'they'} actually \${mistimed.length===1?'has':'have'}.\`);
  }

  // 4. An override that pushes a country past its own deadline. Not an
  //    error — someone may be modelling exactly that — but it must never
  //    be silent.
  const late = (ganttRows || []).filter(r => r.pinned && r.segs[r.segs.length-1].e > r.golive);
  if(late.length){
    warn.push(\`<strong>\${late.length} pinned \${late.length===1?'start date finishes':'start dates finish'} after the deadline.</strong> \${late.map(r=>r.c[0]).join(', ')}. That may be deliberate — an accepted late position is a decision a board can take — but the plan below no longer meets \${late.length===1?'that date':'those dates'}.\`);
  }

  // 5. The tax-effort cap is binding. It used to be an absolute 3 FTE and
  //    it bound at 20 complex jurisdictions, which both the EU preset (25)
  //    and the mandate preset (46) blow straight through — so selecting 46
  //    countries instead of 25 added 400,000 of one-off cost and exactly
  //    zero benefit, with nothing on screen saying the number had stopped
  //    responding. A ceiling nobody is told about is indistinguishable
  //    from a model that does not work.
  if(taxCapBinds){
    warn.push(\`<strong>The tax-effort saving is capped and the cap is binding.</strong> \${ctcCount} clearance or reporting jurisdictions would imply \${(shareRaw*100).toFixed(0)}% of your AP effort; the model will not credit more than \${(TAXM.cap*100).toFixed(0)}%, because the magnitude is our assumption rather than a benchmark and an uncapped one would run away. Adding further jurisdictions will not move the indirect figure &mdash; though it will keep adding cost, which is the honest asymmetry.\`);
  }

  // 6. The capture labour, priced from headcount, exceeds the whole
  //    processing saving it is supposed to be a component of. That is a
  //    contradiction rather than just a large number: you cannot release
  //    more capture wages than the total reduction in processing cost.
  //    This is the reconciliation the two-route design exists to make
  //    possible — a top-down and a bottom-up estimate of the same money
  //    that disagree in the wrong direction mean one input is wrong.
  if(saving > 0 && captureValue > saving){
    warn.push(\`<strong>The capture headcount is worth more than the whole processing saving.</strong> \${fmt(captureValue)} of released data-entry cost against \${fmt(saving)} of total AP processing reduction. These are two routes to the same money, so the first cannot exceed the second — check the data-entry rate and the AP cost per invoice, because one of them is out.\`);
  }

  document.getElementById('guards').innerHTML = warn.length
    ? warn.map(w => \`<div class="note warn" style="margin:0 0 12px">\${w}</div>\`).join('')
    : '';

  renderAdjust(sel);

}
`
    .replace("__ROI_COUNTRIES__", JSON.stringify(countries))
    .replace("__ROI_SUBSCRIBED__", JSON.stringify(subscribed))
    .replace("__ROI_UNLOCKED__", locked ? "false" : "true")
    .replace("__ROI_DEFAULTS__", JSON.stringify(defaults))
    .replace("__ROI_EVIDENCE__", JSON.stringify(evidence))
    .replace("__ROI_PHASES__", JSON.stringify(chartPhases))
    // The indirect layer's three model constants. invPerFte is APQC's
    // published median and grade A; the other two are ours and grade D,
    // but they are ratios rather than headcounts, which is what lets the
    // answer scale with the business. All three live in D1 so they can be
    // argued with in a migration rather than a deploy.
    .replace("__ROI_TAXMODEL__", JSON.stringify({
      invPerFte: val("ap_invoices_per_fte", 12000),
      perJur:    val("tax_effort_per_jurisdiction", 0.018),
      cap:       val("tax_effort_cap", 0.20),
      // ATO / Deloitte purchase-invoice task times: receipt 7 min +
      // validation 2 min of a 21-minute process. The capture-and-key
      // portion, which is the part e-invoicing actually removes.
      captureShare: val("capture_share_of_ap", 0.4286),
    }))
    .replace("__ROI_PLATFEE__", JSON.stringify({
      fee: val("platform_fee_per_invoice", 0.4),   // USD, per invoice, either direction
      tpl: t("input.cPlat.derived",
        "Approximate: {vol} invoices &times; {fee} each. This is a rough per-invoice multiplier for the technology &mdash; your vendor&rsquo;s actual price will differ, and should be entered here."),
    }))
    .replace("__ROI_FX__", JSON.stringify(fx && Object.keys(fx).length ? fx : { USD: { r: 1, asOf: "", src: null } }));
  return { body, script };
}
