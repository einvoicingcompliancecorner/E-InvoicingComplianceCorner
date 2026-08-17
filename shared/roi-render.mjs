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
  const out = countries.filter((c) => c.code !== "EU").map((c) => {
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

    // ONLY NATIONAL OBLIGATIONS BELONG TO A COUNTRY (Dan, 15 Aug 2026).
    //
    // This used to fold the EU-wide ViDA date into every member state, so
    // Austria appeared in the plan as a country with a 2030 deadline when
    // Austria has no national mandate at all — the chart then had to print
    // "EU-WIDE" beside it to explain why it was there. Migration 532 made
    // it worse by giving the fourteen states with an earlier national date
    // a second row each, which put 27 rows in one wave.
    //
    // Migration 504 had already settled this for the arrivals board:
    // ViDA is ONE EU fact, not twenty-seven national ones, which is why
    // only the European Union entry was kept on the board. The planner
    // now agrees with it. The EU obligation is returned separately and
    // rendered as a single European Union row.
    const national = mine.filter((m) => m.date > today && m.mandate_scope === "b2b").map((m) => m.date).sort();
    const future = national;

    // Status stays NATIONAL. An EU-wide deadline changes what you have to
    // deliver and when, but calling Austria "Upcoming" on a page where the
    // tracker board calls it "B2G only" would put two of this site's own
    // surfaces in visible disagreement. The EU-derived deadline is flagged
    // instead, and labelled EU-WIDE wherever it drives a row.
    // Index 8 was `euDriven` — "this country's deadline came from EU law".
    // Nothing is EU-driven any more, because EU law now has its own row.
    // Repurposed to plain membership, which is what the client actually
    // needs: how many of the selected jurisdictions the European Union
    // row covers.
    const euMember = c.eu_member ? 1 : 0;

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
    const cxEff = cx;   // no EU-driven override: the EU row carries its own complexity

    // Index 9: the earliest live obligation this country has that the board
    // does not show, or "" — surfaced so the render can warn when it is
    // planning a country as deadline-free that is not.
    const hiddenDate = hiddenBy.get(c.id) || "";

    // INDEX 10: THE SECOND WAVE.
    //
    // An EU member state with a national deadline before July 2030 has TWO
    // obligations, and until now the planner scheduled only the first.
    // Germany is the case the design review named: a 4-corner exchange
    // build in 2027, scored SIMPLE, and then ViDA's digital reporting
    // requirement in 2030, which is COMPLEX. The tool showed the easier,
    // nearer build and hid the harder, later one — for fourteen member
    // states, over half of those tracked.
    //
    // Note this is computed HERE rather than in the client, because it
    // needs `eu_member`. Deriving it from the tuple would sweep in Norway
    // and the United Kingdom, which sit in the Europe region and are not
    // bound by ViDA at all. That mistake was made and caught on the way in.
    return [c.name_en, c.code, REG[c.region] || "Eu", status, cxEff, future[0] || "", c.penalty_rows || 0, c.slug, euMember,
            hiddenDate && (!future.length || hiddenDate < future[0]) ? hiddenDate : ""];
  });

  // THE EUROPEAN UNION AS A ROW OF ITS OWN.
  //
  // Returned in the same array as the jurisdictions, with code "EU", and
  // skipped by the country picker — nobody selects the EU, it applies to
  // you if any member state does. The planner adds it automatically.
  //
  // Complexity is fixed at 2 rather than read from `roi_complexity`,
  // which is 'none' on this row because the EU is not a jurisdiction that
  // runs a regime. ViDA is a Digital Reporting Requirement: the tax
  // authority receives invoice-level data, which is complex work on the
  // rule Dan set on 12 August.
  if (euRow && euWide.length) {
    out.push(["European Union", "EU", "Eu", "u", 2, euWide.map((m) => m.date).sort()[0],
              0, null, 0, ""]);
  }
  return out;
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
/* Dan, 15 Aug 2026: "all of the savings table font seems to be in bold...
   It jumps off the page a little too much."
   It was never bold -- computed weight is 400 in every cell, and only 6%
   of a row sits inside a <strong>. It was CONTRAST. --text-lo is #f2f0e8
   despite the name, so the table rendered at the brightest value on the
   page while the prose around it sits at --muted #93a3c0. Dense 13.5px
   rows at maximum brightness on dark navy read as heavier than the
   paragraphs beside them.
   Body cells drop to #c6cfdd -- 11.1:1 on --ink and 8.9:1 on --ink-3,
   comfortably past AA -- and the NUMERIC cells stay at full strength.
   That is the hierarchy the table never had: the money is what you are
   meant to read first, and it was competing with its own labels. */
table{color:var(--text-lo)}
#savingsTable td{color:#c6cfdd}
#savingsTable td.num,#savingsTable tr.tot td{color:var(--text-lo)}
.wrap{color:var(--text-lo)}
footer{color:var(--muted)}
.grid{display:grid;gap:14px}
/* Inputs sit at the BOTTOM of their cell, so a label that wraps to two
   lines cannot push its field below its neighbours'. Migration 531 fixed
   one instance of that by shortening a label; 557 reintroduced it at
   860px with "Invoices already received as e-invoices %". Shortening
   again would only defer it -- every future label is a chance to break
   the row. Reserving two lines of label height in every such cell is the
   general fix. Bottom-aligning the inputs was tried first and was worse:
   several cells carry a hint paragraph BELOW the input, so pushing the
   input to the bottom of the cell misaligned the ones that do not. */
.grid > div:has(> input, > select) > label{min-height:37px}
@media(min-width:760px){.g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:repeat(3,1fr)}.g4{grid-template-columns:repeat(4,1fr)}.g5{grid-template-columns:repeat(3,1fr)}}
@media(min-width:1000px){.g5{grid-template-columns:repeat(5,1fr)}}
label{display:block;font-size:12px;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin:0 0 5px}
input[type=number],input[type=text],select{width:100%;background:var(--ink);border:1px solid var(--line);color:var(--text-lo);border-radius:6px;padding:9px 11px;font:inherit;font-size:15px}
input:focus,select:focus{outline:2px solid var(--soon);outline-offset:1px}
.hint{font-size:11.5px;color:var(--muted);margin:5px 0 0}
/* AMBER while the value is still ours, GREEN once the reader has touched
   it. Dan, 16 Aug 2026: "change all input fields in assumptions and
   benchmarks to have a yellow unchanged ribbon... a useful distinction on
   all fields to see if anything has changed."
   THE CLASS IS RENAMED WITH THE MEANING. It was .needsyou, true while
   six fields carried it and false the moment every field did: a benchmark
   with a grade-A citation is not a figure we need from you. A class name
   describing a retired model is the same defect as a caption that does --
   it just rots somewhere only developers read.
   Migration 557 used red here, reasoning that amber was already spoken
   for -- markOverridden() borders any changed input in --soon. Dan asked
   for amber, and it resolves: the two states are MUTUALLY EXCLUSIVE. A
   field with an amber ribbon has never been touched, so it has no amber
   border; a field with an amber border is set, so its ribbon is green.
   The pair can only ever read "untouched" or "yours", never both. Red
   was also carrying a severity this never had -- six unset defaults on a
   first visit is the expected state of the page, not an error.
   Inset box-shadow rather than a border or padding because both of those
   move the cell, and these sit in a grid beside fields that do not. */
/* Section 1: inputs stacked left, country selection right. One column
   below 900px -- two columns of anything on a phone is a scroll trap. The
   country list stretches to the height the inputs set instead of its old
   fixed 260px, which is why the cap moves onto the flex child. */
.foot2{display:grid;gap:22px}
@media(min-width:900px){.foot2{grid-template-columns:minmax(260px,1fr) minmax(0,1.25fr)}}
.footcol{display:flex;flex-direction:column;gap:14px;min-width:0}
.footcol > .cwrap{display:flex;flex-direction:column;flex:1;min-height:0}
.footcol > .cwrap > .countries{flex:1;min-height:220px;max-height:430px}
/* Taller than the old 260px, because the column has the room now --
   but still capped. Uncapped it drew all 70 jurisdictions and took
   the card past 1,100px, which is not 'using the space', it is
   losing the scroll. */
.cbox,.cbox *{text-transform:none;font-family:'IBM Plex Sans',system-ui,sans-serif;letter-spacing:0}
/* The assumptions panel as three groups side by side rather than three
   stacked full-width grids. One column below 1000px: three columns of
   form fields on a phone is a scroll trap, and this panel is opt-in
   anyway. align-items:start so a short column does not stretch. */
.acols{display:grid;gap:26px;align-items:start}
@media(min-width:1000px){.acols{grid-template-columns:repeat(3,1fr)}}
.acol{display:flex;flex-direction:column;gap:12px;min-width:0}
.acol > p{margin:0}
/* The tip surface is --paper, a light cream, NOT the page's navy. The
   first cut used the panel's light grey here and scored 1.19:1 --
   caught by the contrast auditor, which is the third time it has
   caught a colour chosen for the wrong surface. #5f5540 is the tone
   already used for secondary text on paper elsewhere. */
.tipmeta{display:block;margin-top:7px;padding-top:6px;border-top:1px solid var(--paper-line);color:#5f5540}
/* The basis column, one labelled line each. Dan, 16 Aug 2026: "could the
   basis column be a little more concise and consistent across all rows...
   a 'Calculation:' sentence, and on the next line a 'Justification:'
   sentence with citation and source."
   The rows had drifted into nine different shapes -- the AP row ran two
   full sentences together with no separator, the AR row was five words.
   Same information, one form. */
/* One grouped warning block instead of a stack. The summary line is the
   alarm -- it states the count and stays visible -- and the detail opens
   in place. Deliberately NOT inside the caveats panel: these are
   conditional statements about the reader's scenario, and that panel is
   collapsed by default. */
.guardbox{margin:14px 0 0;padding:10px 13px}
.guardbox > summary{cursor:pointer;font-weight:700;color:#e8b9ae;list-style:none;display:flex;align-items:center;gap:7px}
.guardbox > summary::-webkit-details-marker{display:none}
/* Literal character, not a \\25B8 escape: this stylesheet lives inside a
   template literal, where a backslash-two is an OCTAL escape and a syntax
   error. Same family as the backticks-in-CSS-comments trap. */
.guardbox > summary::before{content:'▸';display:inline-block;transition:transform .12s;font-size:11px}
.guardbox[open] > summary::before{transform:rotate(90deg)}
.guarditem{margin-top:10px;padding-top:10px;border-top:1px solid rgba(181,67,47,.35)}
.bcalc,.bjust{display:block;margin:0}
.bjust{margin-top:4px}
.blab{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);margin-right:5px}
.evg{margin-left:4px;padding:0 4px;font-size:9px}
.ribbon > input,.ribbon > select{box-shadow:inset 3px 0 0 var(--soon)}
.ribbon.changed > input,.ribbon.changed > select{box-shadow:inset 3px 0 0 var(--live)}
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
.crow,.chead{display:grid;grid-template-columns:15px 1fr 84px;align-items:center;gap:0 10px}
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
/* Two sub-lines under a stat label. Dan asked the One-off figure to name
   the implementation cost AND the annual platform cost, so the net annual
   saving decodes without hunting: annual saving, less these two, is net.
   The sub class qualifies what the big number IS; sub2 is the recurring
   money the big number is NOT, which is why it gets its own line and a
   warmer colour than the muted label. */
/* NOT .sub / .sub2 -- members-worker's own page shell defines a global
   .sub at 13.8px in #4a4030, a dark brown sized for its paper surfaces,
   and the ROI page inherits that stylesheet. The name collided silently:
   the label rendered 38% larger than the one above it and carried a 22px
   bottom margin nobody asked for. Prefixed names cannot collide with a
   shell this module does not own. */
.stat .l .statwhat{color:var(--text-lo);opacity:.75}
.stat .l .statrun{display:block;margin-top:5px;color:#e2b978;text-transform:none;letter-spacing:.2px;font-size:10.5px;line-height:1.5}
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
/* GRID CELLS ARE FLEX COLUMNS WITH A RESERVED LABEL HEIGHT.
   Dan, 15 Aug 2026: "section 1 the field headings wrap sometimes causing
   the fields to appear at different heights." Measured: 19px out in the
   footprint row — a whole wrapped line — and 1px in the assumptions
   grids, where a min-height was already reserved but sat BELOW the
   natural two-line height, so it did not bind. The .hlp marker is an
   inline-flex 14px box inside a 12px label, which raises the line box
   above what the font size alone predicts; pinning line-height makes the
   reserved height computable rather than guessed.
   Applied to every .grid, not just #assump: the footprint row had the
   worse offset and no rule at all. */
/* THE STEP STRIP. Numbered chips with chevrons between them, each linking
   to the control it names. Two are marked optional, which is the whole
   point of showing them: a reader who does not know the assumptions and
   adjust panels are skippable will either work through them dutifully or
   give up. Wraps to two lines on a phone rather than scrolling
   horizontally, because a step you cannot see is a step you will not
   take. */
/* Five chips have to clear 1040px of wrap, separators included, or the
   strip wraps to two rows on a full-width desktop and stops reading as
   one route. The measured need was 1087; the spacing below is what
   brought it under, and is the reason these numbers look over-specified. */
.steps{list-style:none;display:flex;flex-wrap:wrap;align-items:stretch;gap:5px;margin:0 0 24px;padding:0}
.steps li{display:flex;align-items:center}
.steps li+li::before{content:'\\203a';color:var(--upcoming);font-size:16px;margin-right:5px;line-height:1}
.steps a{display:flex;align-items:center;gap:8px;text-decoration:none;background:var(--ink-2);
  border:1px solid var(--line);border-radius:99px;padding:7px 13px;transition:border-color .15s}
.steps a:hover,.steps a:focus{border-color:var(--soon);outline:none}
.steps span{font-size:13px;color:var(--text-lo);white-space:nowrap}
.steps em{font-style:normal;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.06em;
  text-transform:uppercase;color:var(--muted);margin-left:6px}
@media(max-width:700px){.steps span{white-space:normal}.steps em{display:block;margin:1px 0 0}}
/* A section subhead inside the merged Savings section. Not an h3: the two
   halves are peers under one heading, and an h3 would imply the second is
   subordinate to the first. */
.subhead{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;
  color:var(--soon);margin:0 0 6px;padding-top:2px}
.grid > div{display:flex;flex-direction:column;min-width:0}
.grid label{line-height:1.35;min-height:38px}
.grid > div > .hint{margin-top:6px}
@media(max-width:759px){.grid label{min-height:0}}
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
/* Group and total rows in the merged table. The group row is a label,
   not data: no borders, no hover, and it must not read as a benefit with
   a missing value. */
tr.grp td{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.2px;
  text-transform:uppercase;color:var(--soon);padding:22px 0 6px;border-bottom:1px solid var(--line)}
tbody tr.grp:first-child td{padding-top:4px}
tr.tot td{border-top:2px solid var(--line);border-bottom:none}
/* SAVINGS-COMPOSITION PALETTE. Three categorical slots, stepped for the
   dark card surface and validated with the dataviz validator against BOTH
   that surface and white paper, because the same bar has to survive the
   PDF. The site's existing pill colours FAILED as a categorical set — too
   light, chroma below the floor, and green/amber only 13.0 apart on the
   normal-vision scale, under the 15 hard floor. These are the same hue
   families re-stepped: worst adjacent CVD dE 8.4, normal-vision 17.7,
   every slot over 3:1 on both surfaces.
   The fourth band is deliberately NOT a fourth category — it is money the
   model does not count, so it carries no hue, only a 45-degree hatch. */
.sv1{fill:#399a6c}.sv2{fill:#c07d1c}.sv3{fill:#6b86d8}
.svwrap{display:flex;gap:22px;align-items:center;flex-wrap:wrap;margin:14px 0 0}
.svpie{flex:none}
.svpie text{font-family:'IBM Plex Mono',monospace}
.svside{flex:1;min-width:260px}
.svtitle{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--soon);margin:0 0 8px}
.svkey{list-style:none;margin:0;padding:0;font-size:13px}
.svkey li{display:grid;grid-template-columns:12px 1fr auto 46px;align-items:center;gap:9px;padding:3px 0}
.svkey i{width:12px;height:12px;border-radius:3px;display:inline-block}
.svkey b{font-variant-numeric:tabular-nums}
.svkey em{font-style:normal;font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--muted);text-align:right}
.svtot{margin:10px 0 0;padding-top:9px;border-top:1px solid var(--line);font-size:13px;color:var(--muted)}
.svtot strong{color:#7fd0a8;font-size:15px}
.svtot span{display:block;font-size:12px}
/* The pointer from a one-line caveat to the full reasoning in section 7.
   Dan, 15 Aug 2026: "The UI is difficult to read and follow because there
   are so many caveats and assumptions... could those be hidden in a
   popout". The reasoning is not deleted, it is moved one click away and
   linked from the number it belongs to. */
a.nlink{color:var(--soon);border-bottom:1px dotted var(--soon);text-decoration:none;white-space:nowrap;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.4px}
a.nlink:hover,a.nlink:focus{color:var(--text);border-bottom-color:var(--text)}
.gate{background:linear-gradient(180deg,rgba(21,34,56,0) 0%,var(--ink-2) 42%);border:1px solid var(--soon);border-radius:var(--radius);padding:26px 22px;text-align:center;margin:18px 0}
.note{background:var(--ink-3);border-left:3px solid var(--soon);border-radius:0 6px 6px 0;padding:11px 14px;font-size:13px;color:var(--muted);margin:0 0 14px}
.warn{border-left-color:var(--stamp)}
.hidden{display:none !important}
.blur{filter:blur(5px);opacity:.55;pointer-events:none;user-select:none}
footer{margin-top:40px;padding-top:16px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}
/* ---- the PDF ------------------------------------------------------
   Dan, 15 Aug 2026: "Rather than printing the page, I would like a
   professionally oriented PDF download that summarises the page outputs
   ... It should outline headline findings, and display the wave plan.
   However, any assumptions, or caveats should be displayed on page 2. It
   should be no longer than 2 pages."
   So this is not the page with things hidden. #pdfdoc is a separate
   two-page document, built from the same numbers at the same moment, and
   the entire interactive page is suppressed. Everything is laid out for
   ink on white: no dark surfaces to burn through a printer, hairline
   rules, and the pie redrawn on the light surface it was validated
   against. */
#pdfdoc{display:none}
@media print{
  @page{size:A4 portrait;margin:13mm 12mm}
  html,body{background:#fff !important;color:#111 !important}
  /* Hide everything the host page wraps around us, not just .wrap — the
     members shell contributes a back-link bar of its own, and naming the
     pieces individually means the next thing it adds prints too. */
  body>*{display:none !important}
  body>#pdfdoc{display:block !important;font-size:9.6pt;line-height:1.42}
  #pdfdoc{width:100%;max-width:100%;overflow:hidden}
  #pdfdoc .pg{page-break-after:always;break-after:page}
  #pdfdoc .pg:last-child{page-break-after:auto;break-after:auto}
  #pdfdoc .mast{display:flex;justify-content:space-between;align-items:flex-end;
    border-bottom:2px solid #111;padding-bottom:6px;margin:0 0 12px}
  #pdfdoc .mast h1{font-family:'Big Shoulders Display',sans-serif;font-size:23pt;line-height:.95;
    margin:0;text-transform:uppercase;letter-spacing:.4px;color:#111}
  #pdfdoc .mast .who{font-family:'IBM Plex Mono',monospace;font-size:7.4pt;letter-spacing:.7px;
    text-transform:uppercase;color:#555;text-align:right;line-height:1.5}
  #pdfdoc h2{font-family:'IBM Plex Mono',monospace;font-size:8pt;letter-spacing:1.3px;
    text-transform:uppercase;color:#7a5a20;border:0;margin:13px 0 6px;padding:0}
  #pdfdoc .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}
  /* The ribbon says which direction the number points. Dan, 16 Aug 2026:
     "green, indicating positive saving, or net benefit, and red ribbon to
     indicate a cost. I can see that the one-off investment is green, but
     this is an overhead."
     He is right and it was worse than uninformative -- EVERY box carried
     the same green, so the one figure a reader most needs to recognise as
     money going out was reassuringly coloured money coming in.
     The rules mirror the screen's own stat colours rather than inventing
     a second scheme; only the hues are darkened for print on white.
     Payback and the deadline count are neither saving nor cost, so they
     take amber for attention and grey for none -- keeping green and red
     meaning exactly what Dan said they mean. */
  #pdfdoc .kpi{border:1px solid #c9c9c9;border-left:3px solid #6b7a95;padding:7px 9px}
  #pdfdoc .kpi.good{border-left-color:#2f7d55}
  #pdfdoc .kpi.cost{border-left-color:#b5432f}
  #pdfdoc .kpi.warn{border-left-color:#a8761f}
  #pdfdoc .kpi .n{font-family:'Big Shoulders Display',sans-serif;font-size:19pt;line-height:1;color:#111}
  #pdfdoc .kpi .l{font-size:7.4pt;color:#555;margin-top:3px}
  #pdfdoc .kpi .s{font-size:6.8pt;color:#777;margin-top:2px;line-height:1.35}
  /* The screen rule table{color:var(--text-lo)} is near-white and beat the
     colour set on body, so every cell printed at about 8% ink. Set it on
     the table itself rather than relying on inheritance. */
  #pdfdoc table{width:100%;border-collapse:collapse;font-size:8.6pt;color:#111}
  #pdfdoc td{color:#222}
  /* The second waves widened the jurisdictions column enough to wrap the
     ISO dates beside it, which reads as a data error rather than a
     layout one. */
  #pdfdoc td:first-child{white-space:nowrap}
  #pdfdoc td strong{color:#111}
  #pdfdoc th{text-align:left;font-family:'IBM Plex Mono',monospace;font-size:7.2pt;letter-spacing:.8px;
    text-transform:uppercase;color:#555;border-bottom:1px solid #999;padding:4px 6px}
  #pdfdoc td{padding:3.5px 6px;border-bottom:1px solid #e2e2e2;vertical-align:top}
  #pdfdoc td.num,#pdfdoc th.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  /* The chart carries min-width:820px on screen so it never squashes into
     an unreadable smear in a scrolling div. On paper there is no scroll
     container to protect, and 820px is wider than A4 minus margins, so it
     clipped both edges. Released here, and capped in height so the plan
     and the findings share page one. */
  #pdfdoc .gantt svg{width:100%;height:auto;min-width:0 !important;max-height:108mm}
  #pdfdoc .note{border-left:2px solid #7a5a20;background:#f6f3ec;padding:6px 9px;margin:8px 0 0;
    font-size:8.4pt;color:#333;break-inside:avoid}
  #pdfdoc .cards{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  #pdfdoc .cards div{border:1px solid #d3d3d3;padding:7px 9px;break-inside:avoid}
  #pdfdoc .cards h3{margin:0 0 3px;font-size:9pt;color:#111}
  #pdfdoc .cards p{margin:0;font-size:8.2pt;color:#444}
  #pdfdoc .foot{margin-top:10px;border-top:1px solid #bbb;padding-top:5px;font-size:7.2pt;color:#666}
  #pdfdoc .pielay{display:flex;gap:14px;align-items:center}
  #pdfdoc .pielay svg{flex:none}
  #pdfdoc .pkey{flex:1;list-style:none;margin:0;padding:0;font-size:8.6pt}
  #pdfdoc .pkey li{display:grid;grid-template-columns:10px 1fr auto 40px;gap:7px;align-items:center;padding:2px 0}
  #pdfdoc .pkey i{width:10px;height:10px;border-radius:2px;display:inline-block}
  #pdfdoc .pkey em{font-style:normal;text-align:right;color:#555;font-family:'IBM Plex Mono',monospace}
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
    // Dan, 15 Aug 2026: "Is the Current eInvoice rate, as a percentage -
    // something we could assert in the assumptions, with the user having
    // to update." It is now the largest single lever on the processing
    // row, because a saving can only be taken once and whatever already
    // arrives structured has already taken it.
    eShare:  { v: val("einvoice_share_now", 50),    h: hintOf("einvoice_share_now") },
    errRate: { v: val("manual_error_rate", 10),     h: hintOf("manual_error_rate") },
    errMins: { v: val("rework_minutes", 15),        h: hintOf("rework_minutes") },
    // THE ONLY MULTIPLIER ON THIS PAGE YOU COULD NOT TOUCH, until Dan
    // asked where the rework number came from and the honest answer was
    // "partly from a bare 0.8 in the source". The reasoning behind it was
    // sound and written down — some exceptions are commercial disputes
    // rather than clerical errors, and structured data will not fix
    // those — but it lived in the tooltip of a DIFFERENT input, while the
    // reader met "x 80%" bare in the results table. Worse, being a
    // literal it could not be graded, cited, overridden or reset like
    // every other assumption here. An assumption you cannot argue with is
    // the one thing this panel exists to prevent.
    errElim: { v: val("error_elimination_pct", 80), h: hintOf("error_elimination_pct") },
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
  // Dan, 16 Aug 2026: "the text under each field in Assumptions and
  // benchmarks can be removed, and should be a feature of the tooltip
  // help."
  //
  // The hint line was carrying two things. The SOURCE shorthand ("Ardent
  // Partners market average, 2025 data") was already duplicated word for
  // word by the tooltip's third clause after migration 562 -- removing it
  // loses nothing. The other was live state: markOverridden() rewrote it
  // to "Your value. Default 9.84 -- ..." the moment a reader typed.
  //
  // THAT SECOND PART IS NOT DUPLICATED ANYWHERE, and deleting the line
  // without replacing it would take away the only way to see what a
  // figure used to be, on the one panel whose entire purpose is
  // overriding figures. So the tooltip gets a slot for it, filled by the
  // same function that used to fill the hint. Rendered as an empty span
  // rather than as text, because the value has to survive a currency
  // switch -- DEFAULTS[id].v is rewritten on every switch, and a
  // server-rendered "Default 9.84" would be a lie in sterling.
  const hlp = (id, title = t("tip.derived","How this is derived")) => (helpText[id]
    ? `<span class="hlp" tabindex="0" role="note" aria-label="${esc(title)}: ${esc(helpText[id])}">?<span class="tip"><b>${esc(title)}</b>${esc(helpText[id])}`
      // DATA ATTRIBUTE, NOT AN ID. hlp() is deliberately reused: migration
      // 542 put help.cPlat on the executive summary's running-cost line as
      // well as on the input, rather than minting a near-duplicate help
      // row. An id here therefore rendered TWICE for cPlat and cRun, and
      // getElementById would have filled the first and left the summary's
      // copy blank. Same one-key-two-sites shape that shipped the wrong
      // gantt label in 551 -- caught this time by the rendered page having
      // 24 meta spans for 22 fields.
      + (defaults[id] ? `<span class="tipmeta" data-tm="${id}"></span>` : "")
      + `</span></span>`
    : "");

  const cite = (k) => {
    const b = byKey[k];
    if (!b) return { t: "D", s: "" };
    const yr = b.source_year ? ` <span style="opacity:.75">(${b.source_year})</span>` : "";
    const link = b.source_url ? ` <a href="${b.source_url}" style="color:#241d10">${t("ev.sourceLink","source")}</a>` : "";
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
    // 558: the rework row prices a duration at this rate, so the rate
    // needs its own tag on the row rather than only in the panel.
    blsEntry: cite("loaded_fte_cost_entry"),
    atoCapture: cite("capture_share_of_ap"),
    // Both were previously rendered as ev('yours', ...) — "your rework
    // cost" for a figure the reader had not supplied, and nothing at all
    // for the 80%. A default of ours labelled as theirs is worse than an
    // unlabelled default: it borrows credibility it has not earned.
    // 558: the row is priced from a duration now, so the citation that
    // matters is the one behind the duration. `rework_per_error` is
    // retired (active = 0) and cite() would return an empty shell.
    rework: cite("rework_minutes"),
    errElim: cite("error_elimination_pct"),
    excGap: cite("exception_reduction_pp"),
    durations: { t: "D", s: t("ev.durations.body", "Phase durations are practitioner estimates for a country rollout once a platform is in place, held in D1 and editable above. No analyst firm publishes credible per-country e-invoicing implementation durations &mdash; this was checked.") },
    yours: { t: "D", s: t("ev.yours.body", "Your assumption. Nothing is claimed for this figure &mdash; it is exposed so the model can be argued with rather than believed.") },
    site: { t: "A", s: t("ev.site.body", "Live mandate data from this site&rsquo;s own tracker: status, model and dated deadlines per jurisdiction, each traceable to the cited legal instrument on that country&rsquo;s deep dive.") },
  };
  const chartPhases = phases.map((p) => ({ k: p.key, n: p.name, w: p.default_weeks, c: p.colour,
                                           prog: !!p.is_programme, scope: p.scope }));

  const body = `<div class="wrap">

<p class="eyebrow">${t("page.eyebrow", "The E-Invoicing Compliance Corner")}</p>
<h1>${t("page.title", "E-Invoicing ROI &amp;<br>Wave Planner")}</h1>
<p class="lede">${t("page.lede", "Build a board-ready business case from your own volumes and footprint &mdash; with a dated, sourced compliance wave plan drawn from the 70 jurisdictions this site tracks. Every benchmark carries a visible evidence grade, so your CFO can see exactly which numbers are independently evidenced and which are your own assumptions.")}</p>


<!-- Dan, 15 Aug 2026: "add simple and discrete instructions at the top of
     the page for the business case, such as Step 1 -> Step 2 -> Step 3".
     Two of the six are optional and labelled as such, which matters: a
     reader who does not know the assumptions panel and the adjust panel
     are skippable will either work through them dutifully or bounce.

     THE CHIPS CARRY NO NUMBERS, and that is the fix for the second thing
     Dan noticed: "the steps numbering does not follow the headings in the
     body". It did not, and could not. Four of the five old steps happened
     inside section 1 -- the country picker, the assumptions panel and the
     Calculate button all sit under "1 - Your footprint" -- while step 5
     happened in section 3, and section 2 was no step at all. Two
     numbering systems sharing one page and agreeing nowhere.

     Numbering them by the section they act in would have printed "1" four
     times, which is accurate and reads as a bug. So the digits go and the
     chevrons stay: the strip is a sequence, the headings are the
     numbering, and there is only one of each.

     DOWNLOAD IS THE LAST CHIP. Dan asked whether go-live dates could move
     before Calculate so the flow ended on "Calculate and download". They
     cannot -- the adjust panel lives inside #results, which is hidden
     until Calculate runs, so there are no dates to move yet. But the
     instinct was right: Calculate is the middle of this flow and Download
     is the end, and the strip stopped one step short of saying so. -->
<ol class="steps noprint" aria-label="${t("steps.aria","How to use this planner")}">
  <li><a href="#s-footprint"><span>${t("steps.1","Enter your footprint")}</span></a></li>
  <li><a href="#s-countries"><span>${t("steps.2","Select your countries")}</span></a></li>
  <li><a href="#assump"><span>${t("steps.3","Adjust assumptions")}<em>${t("steps.optional","optional")}</em></span></a></li>
  <li><a href="#run"><span>${t("steps.4","Calculate")}</span></a></li>
  <li><a href="#adjust"><span>${t("steps.5","Move go-live dates")}<em>${t("steps.optional","optional")}</em></span></a></li>
  <li><a href="#print"><span>${t("steps.6","Download PDF")}</span></a></li>
</ol>

<h2 class="noprint" id="s-footprint">1 &middot; ${t("sec.footprint", "Your footprint")}</h2>
<!-- Dan, 16 Aug 2026: "I would like the fields in section 1 to run
     vertically - i.e. stacked one on top of each other. I would then like
     the countries check list box to be moved to the right of the stacked
     list of input fields."
     The six inputs and the country selection are ONE question -- who you
     are and where you operate -- and were three stacked cards you scrolled
     through. Side by side they are answered together, and the country list
     gets the vertical room it always wanted: it was capped at 260px beside
     nothing, and now fills the height the inputs set. -->
<div class="card noprint foot2">
  <div class="footcol">
    <div class="ribbon">
      <label for="volAP">${t("input.volAP", "Invoices received / year (AP)")}${hlp("volAP",t("tip.drives","What this drives"))}</label>
      <input type="number" id="volAP" value="${OPEN_VOL_AP}" min="0" step="1000">
    </div>
    <div class="ribbon">
      <label for="volAR">${t("input.volAR", "Invoices issued / year (AR)")}${hlp("volAR",t("tip.drives","What this drives"))}</label>
      <input type="number" id="volAR" value="${OPEN_VOL_AR}" min="0" step="1000">
    </div>
    <div class="ribbon">
      <label for="erp">${t("input.erp", "ERP / billing integrations")}${hlp("erp",t("tip.drives","What this drives"))}</label>
      <input type="number" id="erp" value="1" min="1" max="60">
    </div>
    <div class="ribbon"><label for="eShare">${t("input.eShare", "E-invoices received today %")} <span class="tag tB">B</span>${hlp("eShare",t("tip.drives","What this drives"))}</label><input type="number" id="eShare" value="${dv('eShare')}" min="0" max="100" step="1"><p class="hint" id="h-eShare"></p></div>
    <div class="ribbon"><label for="errMins">${t("input.errMins", "Minutes to resolve one error")} <span class="tag tB">B</span>${hlp("errMins",t("tip.drives","What this drives"))}</label><input type="number" id="errMins" value="${dv('errMins')}" min="0" step="1"><p class="hint" id="h-errMins"></p></div>
    <div class="ribbon">
      <label for="cur">${t("input.currency", "Currency")}${hlp("cur",t("tip.changes","What this changes"))}${hlp("fx",t("tip.rate","Where the rate comes from"))}</label>
      <select id="cur"><option value="GBP">GBP &pound;</option><option value="EUR">EUR &euro;</option><option value="USD" selected>USD $</option></select>
      <p class="hint" id="fxNote"></p>
    </div>
  </div>

  <div class="footcol" id="s-countries">
    <div class="cwrap">
      <label>${t("input.countries", "Countries in scope")}${hlp("countries",t("tip.data","Where this data comes from"))}</label>
      <p class="hint" style="margin-bottom:8px">${t("input.countries.hint", "Live mandate data for all 70 tracked jurisdictions.")} <button id="selNone" style="padding:3px 9px;font-size:12px">${t("btn.selNone", "Clear")}</button></p>
      <label class="cbox" id="subsRow" style="align-items:center;gap:8px;padding:9px 12px;margin:0 0 10px;background:var(--ink-3);border:1px solid var(--line);border-radius:6px;font-size:13.5px">
        <input type="checkbox" id="useSubs">
        <span>${t("subs.label", "Use <strong>my subscribed countries</strong>")} <span id="subsCount" class="hint" style="display:inline"></span></span>
      </label>
      <div class="countries" id="countryList"></div>
    </div>
  </div>
</div>

<!-- Scope stays full width and outside the two columns. It is a <select>
     carrying a 60-character option, and a select TRUNCATES rather than
     wraps -- in the right-hand column it read "Compliance only - meet the
     mandates (what most programmes c". The one control that changes both
     the totals and the timeline is not one to abbreviate. -->
<div class="card noprint">
  <label for="scope">${t("input.scope", "What are you modelling?")}${hlp("scope",t("tip.changes","What this changes"))}</label>
  <select id="scope" style="max-width:560px">
    <option value="compliance" selected>${t("scope.compliance", "Compliance only &mdash; meet the mandates (what most programmes do)")}</option>
    <option value="both">${t("scope.both", "Compliance + AP process automation &mdash; the fuller, larger programme")}</option>
  </select>
  <p class="hint">${t("input.scope.hint", "A scoping decision, not a benchmark &mdash; it changes both the numbers and the timeline.")}</p>
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
    <!-- Dan, 15 Aug 2026: "ensure that the user is guided to those fields
         that we need them to update to make the business case real."
         The grade tags answer "how good is your number"; this answers
         "which of these are not mine to give". Six fields carry it: the
         four cost placeholders, the rework cost, and the reader's own
         e-invoice share. It counts down live as they are set, because a
         static warning is furniture and a shrinking one is progress. -->
    <p class="note" style="margin-bottom:14px">${t("assumptions.grades", "Each figure shows where it came from. <span class=\"tag tA\">A</span> measured and primary &middot; <span class=\"tag tB\">B</span> credible body, unattributed &middot; <span class=\"tag tD\">D</span> our estimate. Overriding a value with your own always beats our default &mdash; that is what this panel is for.")} <button type="button" id="resetDefaults" style="padding:3px 9px;font-size:12px;margin-left:6px">${t("btn.reset", "Reset all to defaults")}</button></p>

    <!-- Dan, 16 Aug 2026: "can you tidy up the sections, so they appear
         as three individual columns, for cost & benefit,
         investment-costs, and implementation - weeks."
         Three groups that were three stacked full-width grids, so a
         reader scrolled past all of Cost & benefit to reach a phase
         duration. Side by side the panel is one screen and the
         grouping does the work the headings were doing alone.
         The per-field hint lines are gone in the same change, which
         is what makes the columns fit.

         INVESTMENT LEADS, at Dan's direction. It is the only column
         carrying a warning -- all four figures are placeholders -- and
         it was sitting in the middle where a reader arrives at it after
         seven benchmark fields that need no attention at all. The four
         numbers most likely to be wrong now come first. -->
    <div class="acols">
    <div class="acol">
      <p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--soon);margin:0 0 10px">${t("assumptions.h.invest", "Investment &mdash; costs")} <span class="tag tD">D</span></p>
      <p class="hint" style="margin:-4px 0 4px;color:#e0907f">${t("assumptions.placeholders", "These figures are <strong>placeholders only</strong>. Please replace with vendor budgetary estimates and treat the ROI as illustrative, until actuals can be provided.")}</p>
      <div class="ribbon"><label for="cImplS" style="font-size:11px">${t("input.cImplS", "Cost per SIMPLE integration")}${hlp("cImplS",t("tip.drives","What this drives"))}</label><input type="number" id="cImplS" value="${dv('cImplS')}" min="0" step="1000"></div>
      <div class="ribbon"><label for="cImplC" style="font-size:11px">${t("input.cImplC", "Cost per COMPLEX integration")}${hlp("cImplC",t("tip.drives","What this drives"))}</label><input type="number" id="cImplC" value="${dv('cImplC')}" min="0" step="1000"></div>
      <div class="ribbon"><label for="cPlat" style="font-size:11px">${t("input.cPlat", "Platform / network fees per year")}${hlp("cPlat",t("tip.drives","What this drives"))}</label><input type="number" id="cPlat" value="${dv('cPlat')}" min="0" step="1000"></div>
      <div class="ribbon"><label for="cRun" style="font-size:11px">${t("input.cRun", "Internal run cost per year")}${hlp("cRun",t("tip.drives","What this drives"))}</label><input type="number" id="cRun" value="${dv('cRun')}" min="0" step="1000"></div>
    </div>

    <div class="acol">
      <p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--soon);margin:0 0 10px">${t("assumptions.h.cost", "Cost &amp; benefit")}</p>
      <div class="ribbon"><label for="costNow">${t("input.costNow", "AP cost per invoice")} <span class="tag tA">A</span>${hlp("costNow",t("tip.drives","What this drives"))}</label><input type="number" id="costNow" value="${dv('costNow')}" min="0" step="0.01"></div>
      <div class="ribbon"><label for="costAR">${t("input.costAR", "AR cost per invoice")} <span class="tag tA">A</span>${hlp("costAR",t("tip.drives","What this drives"))}</label><input type="number" id="costAR" value="${dv('costAR')}" min="0" step="0.01"></div>
      <div class="ribbon"><label for="savePct">${t("input.savePct", "Cost reduction %")} <span class="tag tB">B</span>${hlp("savePct",t("tip.drives","What this drives"))}</label><input type="number" id="savePct" value="${dv('savePct')}" min="0" max="95"></div>
      <div class="ribbon"><label for="errRate">${t("input.errRate", "Manual error rate %")} <span class="tag tB">B</span>${hlp("errRate",t("tip.drives","What this drives"))}</label><input type="number" id="errRate" value="${dv('errRate')}" min="0" max="100" step="0.5"></div>
      <div class="ribbon"><label for="fteCost" style="font-size:11px">${t("input.fteCost", "Loaded cost / tax or finance FTE")} <span class="tag tB">B</span>${hlp("fteCost",t("tip.drives","What this drives"))}</label><input type="number" id="fteCost" value="${dv('fteCost')}" min="0" step="1000"></div>
      <div class="ribbon"><label for="fteEntry" style="font-size:11px">${t("input.fteEntry", "Loaded cost / data-entry FTE")} <span class="tag tB">B</span>${hlp("fteEntry",t("tip.drives","What this drives"))}</label><input type="number" id="fteEntry" value="${dv('fteEntry')}" min="0" step="1000"></div>
      <div class="ribbon"><label for="errElim">${t("input.errElim", "Errors eliminated %")} <span class="tag tD">D</span>${hlp("errElim",t("tip.drives","What this drives"))}</label><input type="number" id="errElim" value="${dv('errElim')}" min="0" max="100" step="1"></div>
    </div>

    <div class="acol">
      <p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--soon);margin:0 0 10px">${t("assumptions.h.weeks", "Implementation &mdash; weeks")} <span class="tag tD">D</span></p>
      <div class="ribbon"><label for="wMob" style="font-size:11px">${t("input.wMob", "Mobilisation")}${hlp("wMob",t("tip.phase","What this phase covers"))}</label><input type="number" id="wMob" value="${dv('wMob')}" min="0" step="0.5"></div>
      <div class="ribbon"><label for="wDes" style="font-size:11px">${t("input.wDes", "Design")}${hlp("wDes",t("tip.phase","What this phase covers"))}</label><input type="number" id="wDes" value="${dv('wDes')}" min="0" step="0.5"></div>
      <div class="ribbon"><label for="wBld" style="font-size:11px">${t("input.wBld", "Build")}${hlp("wBld",t("tip.phase","What this phase covers"))}</label><input type="number" id="wBld" value="${dv('wBld')}" min="0" step="0.5"></div>
      <div class="ribbon"><label for="wUat" style="font-size:11px">${t("input.wUat", "UAT &amp; cutover")}${hlp("wUat",t("tip.phase","What this phase covers"))}</label><input type="number" id="wUat" value="${dv('wUat')}" min="0" step="0.5"></div>
      <div id="chgRow" class="ribbon"><label for="wChg" style="font-size:11px">${t("input.wChg", "Process change &amp; training")}${hlp("wChg",t("tip.phase","What this phase covers"))}</label><input type="number" id="wChg" value="${dv('wChg')}" min="0" step="0.5"></div>
      <div class="ribbon"><label for="wVen" style="font-size:11px">${t("input.wVen", "Vendor selection (once)")}${hlp("wVen",t("tip.once","What “once” means here"))}</label><input type="number" id="wVen" value="${dv('wVen')}" min="0" step="1"></div>
      <div class="ribbon"><label for="wCon" style="font-size:11px">${t("input.wCon", "Contracting (once)")}${hlp("wCon",t("tip.once","What “once” means here"))}</label><input type="number" id="wCon" value="${dv('wCon')}" min="0" step="1"></div>
      <div class="ribbon"><label for="lanes" style="font-size:11px">${t("input.lanes", "Parallel workstreams")}${hlp("lanes",t("tip.means","What this means"))}</label><input type="number" id="lanes" value="${dv('lanes')}" min="1" max="10"></div>
      <div class="ribbon"><label for="pace" style="font-size:11px">${t("input.pace", "Delivery pace")}${hlp("pace",t("tip.means","What this means"))}</label><select id="pace">${[["0.75",t("pace.aggressive","Aggressive")],["1",t("pace.typical","Typical")],["1.3",t("pace.conservative","Conservative")]].map(([v,n])=>`<option value="${v}"${String(dv('pace'))===v?" selected":""}>${n}</option>`).join("")}</select></div>
      <p class="hint" style="margin-top:4px">${t("assumptions.durations", "Durations are per country. Countries sharing a go-live date form a wave, so a five-country wave costs roughly five country-tracks of effort, divided across however many workstreams you can genuinely run at once.")}</p>
    </div>
    </div>
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
  <!-- The guard block used to sit here, above the section heading, so a
       scheduling warning was the first thing a reader met after pressing
       Calculate. It now renders inside the executive summary under the
       figures -- see the note in showResults(). The container is created
       by the summary's own template, which is filled earlier in
       showResults() than the guards are, so the element exists by the
       time the guard code looks for it. -->
  <h2>2 &middot; ${t("sec.summary2", "Executive summary &mdash; savings, investment and payback")}</h2>
  <div id="summary"></div>
  <div id="savings"></div>
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

  <p class="noprint" style="margin:-4px 0 14px"><button id="ganttToggle" style="padding:5px 11px;font-size:12.5px">${t("btn.expand", "Show every jurisdiction")}</button> <button id="tblToggle" style="padding:5px 11px;font-size:12.5px">${t("btn.table", "Show as table")}</button></p>
  <div id="waves" class="hidden"></div>
  <h2>4 &middot; ${t("sec.savings", "Savings")}</h2>
  <p class="lede">${t("sec.savings.lede5", "Priced savings first, the ones this scope actually saves at the top; what this model will not put a number on is named below the total. Every priced row says what it saves on your chosen scope, and that total is what section 2 works from.")}</p>
  <div id="savingsTable"></div>
  <details class="card" id="notes" style="padding:0">
    <summary style="cursor:pointer;padding:14px 18px;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px">
      <span>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:var(--soon)">${t("sec.evidence", "Assumptions, sources and caveats")}</span>
        <span class="hint" style="display:block;margin:4px 0 0">${t("sec.evidence.hint", "Where each figure comes from, how far it can be trusted, and which benefits are named without a number.")}</span>
      </span>
      <span id="notesChevron" style="font-family:'IBM Plex Mono',monospace;color:var(--muted);font-size:12px;white-space:nowrap">${t("assumptions.show", "show &#9662;")}</span>
    </summary>
    <div style="padding:0 18px 18px"><div id="evidence"></div></div>
  </details>
</div>

<footer>
  <p>${t("footer.text", "<strong>The E-Invoicing Compliance Corner</strong> &mdash; ROI &amp; wave planner. Country mandate data is live as of 11 August 2026 and traceable to the per-country deep dives. Benchmark figures carry the evidence grade shown against each. This tool models a business case; it is not tax, legal or investment advice.")}</p>
</footer>
</div>

<!-- Outside .wrap on purpose: the print rule hides .wrap wholesale, so a
     PDF document nested inside it would be hidden with everything else.
     Cost me a blank first attempt. -->
<div id="pdfdoc" aria-hidden="true"></div>

`;
  const script = `
const COUNTRIES = __ROI_COUNTRIES__;
let unlocked = __ROI_UNLOCKED__;
const REGION = {Eu:'${t("region.eu","Europe")}', Mi:'${t("region.mea","Middle East / Africa")}', As:'${t("region.apac","Asia-Pacific")}', Am:'${t("region.am","Americas")}'};
// The five status labels, the three complexity labels and the four
// region headings are what a reader sees on every country row, and all
// twelve were English literals until 547. They are the page's taxonomy:
// if they do not translate, nothing below them reads as translated
// either, however carefully the prose around them is handled.
const STATUS = {i:['${t("status.inforce","In force")}','p-inforce'], u:['${t("status.upcoming","Upcoming")}','p-upcoming'], b:['${t("status.b2g","B2G only")}','p-b2gonly'], n:['${t("status.nomandate","No mandate")}','p-nomandate'], t:['${t("status.tracked","Tracked")}','p-nomandate']};
// Three values, not four (Dan, 12 Aug 2026). The dividing line is whether
// the tax authority is a party to the transaction, which is also what
// actually drives integration effort. The old four-point scale carried a
// B2G-only tier and had no slot at all for "mandatory decentralised
// exchange with no authority involvement" — which is exactly where
// Belgium, Norway, the UK and Slovenia live, and where the European
// direction of travel is heading.
const CXNAME = {2:['${t("cx.complex","Complex")}','cx3'], 1:['${t("cx.simple","Simple")}','cx2'], 0:['${t("status.nomandate","No mandate")}','cx0']};
const CXNOTE = {2:'${tj("cx.complex.note","CTC or 5-corner: the tax authority is a party to the transaction &mdash; clearance, pre-validation, or invoice-level reporting. Certification, response handling and status reconciliation on top of the exchange.")}',
  1:'${tj("cx.simple.note","Decentralised 4-corner exchange only. Structured invoices move between accredited access points; the tax authority is not in the loop.")}',
  0:'${tj("cx.none.note","No mandate to build for. Included only because you selected it &mdash; there is no deadline, so this work can start whenever you have capacity.")}'};
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
// errMins is deliberately ABSENT: it is a duration, and converting it
// to GBP would be nonsense. The money it produces still converts,
// because fteEntry is in this list and the cost is derived from it.
const CUR_INPUTS = ['costNow','costAR','fteCost','fteEntry','cImplS','cImplC','cPlat','cRun'];
// Per-invoice figures need pennies; five-figure ones do not, and showing
// 45,888.53 for a placeholder implies a precision nobody has.
const roundCur = v => v >= 1000 ? Math.round(v) : Math.round(v*100)/100;
const usdDefault = {}, usdCurrent = {};
// ---- positional slots, so a sentence can survive translation --------
//
// Dan chose this over fragment-by-fragment when the hardcoded-string
// detector found 103 of these. The problem it solves: this page builds
// prose by concatenating English around computed values, e.g.
//
//   'Across ' + n + ' jurisdictions you have ' + x + ' complex...'
//
// Split into rows, each fragment is translatable and the sentence is
// not, because word order moves between languages and a translator
// cannot reorder pieces that JavaScript joins in a fixed sequence. One
// row holding the whole sentence with {0}-style slots can be reordered
// freely -- the slot carries its meaning with it.
//
// Slots may contain HTML: several of these wrap their value in <strong>,
// and the substitution is textual so that keeps working. Unmatched slots
// are left visible rather than blanked, because "{3}" on screen is a bug
// report and an empty gap is not.
//
// NOT called fmt: that is the money formatter, three lines below.
const fill = (tpl, ...a) => String(tpl).replace(/\\{(\\d+)\\}/g,
  (m, i) => a[i] === undefined ? m : a[i]);
// English pluralises by adding an s, which is why this codebase did it
// with a ternary on n===1 in nine places. No other language works that way,
// and half of them inflect the surrounding words too. Two rows per noun
// is the smallest honest fix: the sentence template holds a slot, and
// the slot is filled with whichever row the count selects. Languages
// with more than two plural forms need more rows, not different code.
const plur = (n, one, many) => (n === 1 ? one : many);
const fmt = n => SYM[cur] + Math.round(n).toLocaleString('en-US');
// Two decimals, not one. This formats per-invoice costs and nothing else,
// and at one decimal the AP baseline printed as "$9.8" while the row was
// computed from 9.84 — so a reader multiplying out the basis on screen
// got $588,000 against the $590,400 beside it and had no way to see why.
// A $2,400 gap in the one row a finance reader is most likely to check
// by hand. Dan found it by doing exactly that.
const fmt1 = n => SYM[cur] + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---- evidence grades -------------------------------------------------
// A = measured, primary, attributable      B = published by a credible body but unattributed within it
// C = single anecdote, not a benchmark     D = your assumption, nothing claimed
const EV = __ROI_EVIDENCE__;
// Dan, 16 Aug 2026: "to be consistent with how evidence is referenced
// earlier in the page, using [A], [B], [C] and [D] evidence grades".
// The grade was ALREADY here and only visible on hover -- the tooltip has
// always opened "Evidence grade B". Every other graded thing on the page
// wears its letter in the open, so a reader scanning the savings table
// had to hover eleven markers to learn what one glance gives them in the
// assumptions panel. The chip sits OUTSIDE the .ev span so it does not
// inherit the dotted underline that marks the hover target.
const ev = (key, txt) => \`<span class="ev" tabindex="0">\${txt}<span class="tip"><b>\${fill('${tj("ev.gradeLabel","Evidence grade {0}")}', EV[key].t)}</b>\${EV[key].s}</span></span><span class="tag t\${EV[key].t} evg">\${EV[key].t}</span>\`;

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
// One click from any condensed caveat to the section that explains it.
// Scrolling IS wanted here, unlike everywhere else on this page — the
// reader has asked to go and read something.
const notesLink = () => \`<a href="#notes" class="nlink">${tj("notes.link","why &rsaquo;")}</a>\`;
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a.nlink');
  if(!a) return;
  e.preventDefault();
  const d = document.getElementById('notes');
  if(!d) return;
  d.open = true;
  d.scrollIntoView({behavior:'smooth', block:'start'});
});
document.getElementById('notes').addEventListener('toggle', function(){
  document.getElementById('notesChevron').innerHTML =
    this.open ? '${tj("assumptions.hide","hide &#9652;")}' : '${tj("assumptions.show","show &#9662;")}';
});

// SV is module-level so a viewport change can redraw without recomputing
// the model.
//
// A pie, at Dan's request, over the stacked bar the form guidance
// prefers. The guidance's specific objection is that a pie cannot compare
// close values — and here two slices are $195,000 and $194,667, which is
// 0.2% apart and genuinely indistinguishable as geometry. So every slice
// is direct-labelled with BOTH its percentage and its value: the ranking
// is read from the labels, the shape carries the gist. That is the
// documented relief for this exact case rather than a workaround.
//
// The pie shows what the scope BANKS. The unlocked-but-unbanked figure
// sits beside it rather than becoming a slice: it is not a component of
// the savings, and on a compliance scope it is larger than all three
// combined, so as a slice it would dominate a chart about savings with
// money the scope does not realise.
let SV = null, WAVES = [], UNDATED = [], ganttExpanded = false;
function renderSavings(){
  const el = document.getElementById('savings');
  if(!el || !SV || !SV.segs.length) return;
  const total = SV.segs.reduce((a, c) => a + c.v, 0);
  if(total <= 0){ el.innerHTML = ''; return; }

  // Largest remainder, so the labels sum to 100 rather than 99. Three
  // rounded-down percentages that visibly do not add up is the kind of
  // small wrongness that makes a reader distrust the large numbers.
  const raw = SV.segs.map(sg => sg.v / total * 100);
  const pct = raw.map(Math.floor);
  let short = 100 - pct.reduce((a, c) => a + c, 0);
  raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0])
     .forEach(([, i]) => { if(short > 0){ pct[i]++; short--; } });

  const S = 210, C = S / 2, R = 92, GAP = 0.012;   // GAP: 2px-equivalent surface gap
  let a0 = -Math.PI / 2;
  const slices = SV.segs.map((sg, i) => {
    const frac = sg.v / total;
    const a1 = a0 + frac * Math.PI * 2;
    const s = a0 + GAP, e = a1 - GAP;
    const big = (e - s) > Math.PI ? 1 : 0;
    const d = frac >= 0.9995
      ? 'M ' + C + ' ' + (C - R) + ' A ' + R + ' ' + R + ' 0 1 1 ' + (C - 0.01) + ' ' + (C - R) + ' Z'
      : ['M', C, C, 'L', (C + R * Math.cos(s)).toFixed(2), (C + R * Math.sin(s)).toFixed(2),
         'A', R, R, 0, big, 1, (C + R * Math.cos(e)).toFixed(2), (C + R * Math.sin(e)).toFixed(2), 'Z'].join(' ');
    const mid = (s + e) / 2;
    const lx = C + R * 0.62 * Math.cos(mid), ly = C + R * 0.62 * Math.sin(mid);
    a0 = a1;
    return '<path d="' + d + '" fill="' + sg.c + '"/>'
      + (frac > 0.08 ? '<text x="' + lx.toFixed(1) + '" y="' + (ly + 5).toFixed(1)
         + '" text-anchor="middle" font-size="15" font-weight="700" fill="#0f1a2b">' + pct[i] + '%</text>' : '');
  }).join('');

  const key = SV.segs.map((sg, i) => '<li><i style="background:' + sg.c + '"></i><span>' + sg.n
      + '</span><b>' + fmt(sg.v) + '</b><em>' + pct[i] + '%</em></li>').join('');

  el.innerHTML = '<div class="card svwrap">'
    + '<svg class="svpie" viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '" height="' + S + '" role="img"'
    + ' aria-label="${tj("sv.alt","Composition of the annual benefit on this scope")}">' + slices + '</svg>'
    + '<div class="svside"><p class="svtitle">${tj("sv.title","Where the annual benefit comes from")}</p>'
    + '<ul class="svkey">' + key + '</ul>'
    + '<p class="svtot">${tj("sv.total","Annual benefit")} <strong>' + fmt(total) + '</strong>'
    + (SV.unbanked > 0 ? '<span>${tj("sv.unbankedNote","plus")} ' + fmt(SV.unbanked)
        + ' ${tj("sv.unbankedTail","available on a wider scope")}</span>' : '') + '</p>'
    + '<p class="hint" style="margin:8px 0 0">${tj("sv.note","Faster cycle time, fewer supplier queries and avoided penalty exposure carry no slice, because this model does not price them.")} ' + notesLink() + '</p>'
    + '</div></div>';
}
let svResize;
window.addEventListener('resize', () => { clearTimeout(svResize); svResize = setTimeout(renderSavings, 150); });

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
// The fields the reader has to own for the case to be theirs. Four are
// vendor placeholders, one is a cost only they know, and one is a fact
// about their own operation that no published source defines (see
// migration 557 on Ardent's undefined "electronically").
const NEEDS_YOU = ['cImplS','cImplC','cPlat','cRun','errMins','eShare'];
// Dan, 16 Aug 2026: "all input fields in the 'your footprint' section can
// have an amber ribbon, until updated and turn green."
// Every field in section 1 is a fact about the reader, so every one of
// them starts as our guess. volAP, volAR, erp and cur are NOT in
// DEFAULTS -- they are opening values in the markup, not benchmarks --
// so they need their own baseline, snapshotted at load. Reading it from
// the DOM rather than restating the numbers here means the two cannot
// disagree, which is this project's most repeated defect.
const FOOT_FIELDS = ['volAP','volAR','erp','eShare','errMins','cur'];
// Every input that carries a ribbon. NEEDS_YOU stays a separate, smaller
// list on purpose: it is the six figures the executive summary counts as
// "still our numbers", and letting it become "everything with a ribbon"
// would turn a specific warning about vendor placeholders into a 26.
const RIBBONED = FOOT_FIELDS.concat([
  'costNow','costAR','savePct','errRate','fteCost','fteEntry','errElim',
  'cImplS','cImplC','cPlat','cRun',
  'wMob','wDes','wBld','wUat','wChg','wVen','wCon','lanes','pace']);
// Dan, 16 Aug 2026: "Turn green on first update to the field."
//
// The first cut compared the value to its default, which meant a reader
// whose number genuinely IS ours never got a green ribbon -- 100,000
// invoices, or USD, or 15 minutes, stayed amber however carefully they
// had been considered. Worse, typing a value and typing it back turned
// the ribbon amber again, which reads as the page forgetting.
//
// What the colour is actually claiming is "has this been through your
// hands", and that is a fact about the reader's attention, not about the
// number. So it is recorded when they touch the field and never
// withdrawn -- except by Reset, which is the one action that genuinely
// un-does the review.
//
// Programmatic writes must NOT count: applyCurrency() rewrites every
// money input on a currency switch and dispatches nothing, so it cannot
// reach this. That is load-bearing rather than lucky -- switching to GBP
// would otherwise green the whole panel.
const touched = new Set();
// The executive summary's placeholder warning counts the same thing the
// ribbons show, so it reads from the same state. Redefining this in
// terms of touched rather than value-difference is what keeps the two
// from disagreeing -- which they would have done within a day, one
// saying "4 fields still hold our numbers" while four ribbons were green.
const stillDefault = () => NEEDS_YOU.filter(id => !touched.has(id));
// Dan, 16 Aug 2026, on the counting note: "please remove this."
// The ribbons stay and now carry the whole message on their own -- amber
// is ours, green is yours, and a reader learns that from two fields
// changing colour under their hands faster than from a sentence saying
// so. The note was also the third always-on caveat in a card that is
// meant to be six questions.
//
// NOTE THE EARLY RETURN THAT USED TO BE HERE. It read
//   const el = document.getElementById('needsYou'); if(!el) return;
// so deleting the element would have silently disabled every ribbon on
// the page rather than just the sentence -- the guidance would have
// vanished with the note that described it. Same shape as the delegated
// listener bound to #assump: behaviour resting on a piece of markup
// existing.
function paintNeedsYou(){
  RIBBONED.forEach(id => {
    const cell = (document.getElementById(id) || {}).parentElement;
    if(cell) cell.classList.toggle('changed', touched.has(id));
  });
}
function markOverridden(){
  paintNeedsYou();
  Object.entries(DEFAULTS).forEach(([id,d]) => {
    const el = document.getElementById(id); if(!el) return;
    const changed = String(el.value) !== String(d.v);
    // Dan: "The field outline does not need to turn amber once changed."
    // It was the only marker of an override before the ribbons existed;
    // now it is a third amber thing next to a ribbon and a hint that both
    // say the same. Cleared rather than left unset, because a value
    // typed before this ran would keep the inline style forever.
    el.style.borderColor = '';
    // Was the hint under the field; now the last line of the tooltip.
    // Both states still render, because "what was this before I changed
    // it" is the question the assumptions panel exists to answer.
    const metas = document.querySelectorAll('[data-tm="'+id+'"]');
    metas.forEach(meta => {
      // MOST hints were the benchmark's source shorthand, which migration
      // 562 had already duplicated into the tooltip -- those are simply
      // dropped. ONE is not: the platform fee's hint is rebuilt by
      // recalcPlat() from live volumes and the per-invoice rate, so it is
      // the only hint on the page that says something the tooltip does
      // not. It follows the default rather than being lost with the rest.
      const extra = d.derived && d.h ? ' ' + d.h : '';
      meta.innerHTML = (changed
        ? \`<span style="color:#8a6524"><strong>${tj("tip.yourValue","Your value.")}</strong></span> \`
        : '') + fill('${tj("tip.ourDefault","Our default is {0}.")}', d.v) + extra;
    });
    const hint = document.getElementById('h-'+id);
    if(hint && d.h) hint.innerHTML = changed
      ? \`<span style="color:#e2b978">Your value.</span> Default \${d.v} &mdash; \${d.h}\`
      : d.h;
  });
}
document.getElementById('assump').addEventListener('toggle', e => {
  document.getElementById('assumpChevron').innerHTML = e.target.open ? '${t("assumptions.hide","hide &#9652;")}' : '${t("assumptions.show","show &#9662;")}';
});
document.getElementById('resetDefaults').onclick = () => {
  Object.entries(DEFAULTS).forEach(([id,d]) => { const el = document.getElementById(id); if(el) el.value = d.v; });
  CUR_INPUTS.forEach(id => { usdCurrent[id] = usdDefault[id]; });   // re-anchor the canon too
  touched.clear();                                  // every ribbon back to amber
  dirtyCur.clear();
  markOverridden(); syncScope(); if(unlocked) showResults();
};
// DELEGATED FROM document, not from the assumptions panel. Both of these
// listeners were bound to #assump and relied on events bubbling out of
// it, which was true for every graded input until migration 559 moved
// eShare and errMins into section 1. The moment they left the panel they
// stopped bubbling into it: no amber border, no "Your value." hint, and
// the needs-you counter would sit at "2 of 6 still ours" however many
// times the reader typed in them.
//
// Nothing errors when that happens. The fields accept input, the page
// recalculates on Calculate, and only the guidance silently stops
// tracking -- on the two fields 559 exists to make prominent. Caught by
// the regression suite, which counted six marked fields and found four.
//
// Binding to document rather than re-scoping to a new common ancestor is
// deliberate: an ancestor is a fact about today's layout, and this bug
// was caused by exactly that assumption.
// Record the touch BEFORE painting, or the ribbon lags one keystroke
// behind the reader. A <select> fires change and not input, which is why
// both are bound -- caught by the currency ribbon staying amber after a
// switch to GBP while every text field worked.
const noteTouch = (e) => {
  const id = e.target && e.target.id;
  if(id && RIBBONED.indexOf(id) !== -1) touched.add(id);
  markOverridden();
};
document.addEventListener('input', noteTouch);
document.addEventListener('change', noteTouch);

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
document.addEventListener('input', (e) => {
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
    // Dan, 16 Aug 2026: "remove the text that says 'Benchmark defaults are
    // published in US dollars.'" It stated the obvious under a selector
    // reading USD, and it was the only always-on line in section 1 that
    // told the reader nothing they could act on.
    //
    // THE NON-USD NOTE STAYS. It carries the fixed-rate warning and its
    // date, which is the whole reason migration 513 pulled that fact out
    // of a tooltip and into the open -- a converted business case that
    // does not say what rate it used is the defect Dan reported on 12
    // August, one layer down.
    note.innerHTML = next === 'USD' || !f
      ? ''
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
  DEFAULTS.cPlat.derived = true;   // its hint is computed, not a citation
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
// The EU row is in COUNTRIES but not in the picker: nobody selects the
// European Union, it applies to you if any member state does. Indices are
// left untouched, because data-i points into the unfiltered array.
COUNTRIES.forEach((c,i) => { if(c[1] !== 'EU') (byRegion[c[2]] ||= []).push([c,i]); });
// One header row, sticky, sharing the grid template with every country
// row. The empty first cell is the checkbox column: aligning against a
// control the header cannot label is the whole reason the template is
// declared once in CSS rather than per element. aria-hidden because the
// checkboxes are already individually labelled — a screen reader gets the
// country name and both pill texts from the label itself, and announcing
// four column headings that belong to no table would be noise.
// Dan, 16 Aug 2026: "The countries selector box include columns for
// mandate and complexity. These can be removed, as that information is
// superfluous at this stage." Both are still USED -- complexity drives
// the one-off cost and mandate status drives the waves -- they are just
// not what a reader is deciding while ticking boxes. Both remain visible
// where they matter, in the wave plan and the figures table.
let html = \`<div class="chead" aria-hidden="true"><span></span><span>${tj("col.jurisdiction","Jurisdiction")}</span><span>${tj("col.deadline","Deadline")}</span></div>\`;
['Eu','Mi','As','Am'].forEach(r => {
  if(!byRegion[r]) return;
  html += \`<div class="creg">\${REGION[r]}</div>\`;
  byRegion[r].forEach(([c,i]) => {
    html += \`<label class="crow"><input type="checkbox" data-i="\${i}"><span>\${c[0]}</span><span class="cdate">\${c[5] || '&mdash;'}</span></label>\`;
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
    ? fill('${tj("subs.fromSaved","({0}) — from your saved preferences")}', MOCK_SUBSCRIBED.length)
    : '— ${t("subs.locked","sign in to use your saved countries")}';
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
  // The track weight applies to DURATION as well as cost. Migration 532
  // priced a ViDA second wave at half a build on the reasoning that the
  // platform already exists by 2030 — and then left it taking a full
  // complex country track of elapsed time, which is the same claim
  // contradicting itself. It also made that one wave sprawl: 27 tracks at
  // full duration back-planned to 42 weeks, twice what the same wave took
  // before, so it swallowed most of the chart.
  const durOf = c => {
    const w = c[10] === undefined ? 1 : c[10];
    const phases = PH().map(p => ({...p, weeks: Math.max(1, Math.round(p.w * CXF[c[4]] * pace * w * ((p.k==='design'||p.k==='build') ? erpF : 1)))}));
    return {phases, total: phases.reduce((a,p)=>a+p.weeks,0)};
  };
  const waveMap = {};
  dated.forEach(c => (waveMap[c[5]] ||= []).push(c));
  const REGORDER = ['Eu','Mi','As','Am'];
  const rows = [];
  const waveMeta = [];
  WAVES = waveMeta;   // the PDF builds its wave table from this
  UNDATED = [];       // and, since Dan asked for it, everything else selected
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
  const shortName = n => n.length > 22 ? n.slice(0, 21) + '\u2026' : n;
  const groups = [...new Set(rows.map(r=>r.waveKey))];
  // Grouped mode draws one row per wave and no wave headers; expanded
  // draws a header plus a row per jurisdiction. Getting this wrong leaves
  // either a tall band of empty space or a chart clipped at the bottom.
  const bodyRows = ganttExpanded ? rows.length + groups.length : groups.length;
  const undatedRows = undated.length ? (ganttExpanded ? undated.length + 1 : 1) : 0;
  const H = HEAD + (RH+GAP)*(bodyRows + 2 + undatedRows) + 16;
  const x = t => L + ((t - X0)/(X1 - X0))*(W - L - R);

  let s = \`<svg viewBox="0 0 \${W} \${H}" width="100%" style="min-width:820px;display:block" role="img" aria-label="${tj("chart.alt","Back-planned delivery timeline by jurisdiction")}">\`;
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
  s += \`<text x="0" y="\${y+15}" fill="#f2f0e8" font-size="12">${tj("chart.procureBar","Select &amp; contract")}</text>\`;
  progPhases.forEach(p => {
    const e = addW(new Date(pt), p.weeks);
    const x1 = x(pt), x2 = x(e.getTime());
    s += \`<rect x="\${x1+1}" y="\${y+4}" width="\${Math.max(2,x2-x1-2)}" height="\${RH-8}" rx="3" fill="\${p.c}"><title>\${fill('${tj("chart.progTip","{0} — {1} weeks ({2} to {3})")}', p.n, p.weeks, isoD(new Date(pt)), isoD(e))}\\n${tj("chart.progNote","Programme-level: run once, not per country.")}</title></rect>\`;
    pt = e.getTime();
  });
  s += \`<text x="\${x(pt)+6}" y="\${y+16}" fill="#93a3c0" font-family="'IBM Plex Mono',monospace" font-size="9.5">\${progWeeks}w</text>\`;
  y += RH + GAP + 6;

  const REGSHORT = {Eu:'EU', Mi:'MEA', As:'APAC', Am:'AM'};

  // GROUPED BY DEFAULT. Dan, after the ViDA second waves landed: the plan
  // "becomes difficult to read". Measured — the time axis had not moved at
  // all (18 quarters either way, because the 2030 edge already existed for
  // the member states with no national date), but the chart grew 31% taller
  // and ONE wave held 27 of its 46 rows. Density, not extent.
  //
  // The wave is the unit anyone plans in, so it is the unit the chart shows
  // first: nine rows instead of forty-six. Per-jurisdiction lanes are one
  // button away, and the table below and the PDF both carry the full list,
  // so nothing is hidden — it is just not the default.
  if(!ganttExpanded){
    waveMeta.forEach(wm => {
      const members = rows.filter(r => r.waveKey === wm.dl);
      if(!members.length) return;
      const s0 = Math.min(...members.map(r => r.start.getTime()));
      const e0 = Math.max(...members.map(r => r.segs[r.segs.length-1].e.getTime()));
      const x1 = x(s0), x2 = x(e0);
      const names = members.map(m => m.c[0]);
      s += \`<text x="0" y="\${y+15}" fill="#f2f0e8" font-size="12" font-family="'IBM Plex Mono',monospace">\${wm.dl}<title>\${names.join(', ')}</title></text>\`;
      // Left-anchored at a fixed offset rather than right-anchored at the
      // gutter: an ISO date is always ten monospace characters, so the two
      // labels can never collide. Right-anchoring put "27 JURISDICTIONS"
      // straight through "2030-07-01".
      // A wave whose only track is the European Union covers every member
      // state selected, so counting tracks would print "1 JURISDICTION"
      // over an obligation binding twenty-seven of them.
      const euOnly = members.length === 1 && members[0].c[11];
      const metaTxt = euOnly
        ? members[0].c[12] + ' ${tj("wave.members","MEMBER STATES")} &middot; ' + wm.elapsed + 'W'
        : wm.n + ' ' + (wm.n===1?'${tj("wave.jur","JURISDICTION")}':'${tj("wave.jurs","JURISDICTIONS")}') + ' &middot; ' + wm.elapsed + 'W';
      s += \`<text x="88" y="\${y+15}" fill="#93a3c0" font-family="'IBM Plex Mono',monospace" font-size="9">\${metaTxt}</text>\`;
      s += \`<rect x="\${x1+1}" y="\${y+4}" width="\${Math.max(2,x2-x1-2)}" height="\${RH-8}" rx="3" fill="#3d5a86"><title>\${fill('${tj("chart.waveTip","Wave {0} — {1}, {2}w effort, {3}w elapsed{4}")}', wm.dl, wm.n + ' ' + plur(wm.n, '${tj("word.jur","jurisdiction")}', '${tj("word.jurs","jurisdictions")}'), wm.effort, wm.elapsed, lanes>1&&wm.n>1 ? fill('${tj("chart.acrossLanes"," across {0} lanes")}', Math.min(lanes,wm.n)) : '')}\n\${names.join(', ')}</title></rect>\`;
      const gx = x(wm.golive.getTime());
      s += \`<polygon points="\${gx},\${y+3} \${gx+7},\${y+RH/2} \${gx},\${y+RH-3} \${gx-7},\${y+RH/2}" fill="#efe9db" stroke="#0f1a2b" stroke-width="2"><title>\${fill('${tj("chart.goliveTip","Wave go-live — mandate deadline {0}")}', wm.dl)}</title></polygon>\`;
      const ICON = {critical:'\u25b2', warning:'\u25cf', good:'\u2713'};
      const COL  = {critical:'#e0907f', warning:'#e2b978', good:'#7fd0a8'};
      s += \`<text x="\${W-R+8}" y="\${y+15}" fill="\${COL[wm.risk]}" font-size="11">\${ICON[wm.risk]}<title>\${wm.risk === 'critical' ? '${tj("chart.risk.late","Latest responsible start is in the past")}' : wm.risk === 'warning' ? '${tj("chart.risk.soon","Starts within 3 months")}' : '${tj("chart.risk.ok","Comfortable runway")}'}</title></text>\`;
      y += RH + GAP;
    });
  }

  let lastWave = null;
  if(ganttExpanded) rows.forEach(r => {
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
    s += \`<text x="\${L-10}" y="\${y+15}" fill="\${r.c[11] ? '#c98a3a' : '#93a3c0'}" font-family="'IBM Plex Mono',monospace" font-size="9" text-anchor="end">\${r.c[11] ? 'EU-WIDE' : REGSHORT[r.c[2]]} &middot; \${cx[0].toUpperCase()}\${lanes>1?\` &middot; L\${r.lane+1}\`:''}</text>\`;
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
    const discStart0 = Math.max(progEnd.getTime(), NOW.getTime());
    // Collapsed, the band is a single row like a wave: the long
    // explanation moves into the tooltip, because at 9.5px it is 570px
    // wide and would run straight under the bars.
    if(!ganttExpanded){
      s += \`<text x="0" y="\${y+15}" fill="#8d9bb5" font-size="12" font-family="'IBM Plex Mono',monospace">${tj("chart.nofixed","NO DATE")}<title>\${undated.map(c=>c[0]).join(', ')}</title></text>\`;
      s += \`<text x="88" y="\${y+15}" fill="#93a3c0" font-family="'IBM Plex Mono',monospace" font-size="9">\${undated.length} \${undated.length===1?'${tj("wave.jur","JURISDICTION")}':'${tj("wave.jurs","JURISDICTIONS")}'}</text>\`;
      // Indicative only, and drawn at half opacity to say so: there is no
      // deadline to back-plan from, so this shows the earliest the work
      // COULD start and roughly how long the longest of them runs.
      const longest = Math.max(...undated.map(c => durOf(c).total));
      const bx1 = x(discStart0), bx2 = x(addW(new Date(discStart0), longest).getTime());
      s += \`<rect x="\${bx1+1}" y="\${y+4}" width="\${Math.max(2,bx2-bx1-2)}" height="\${RH-8}" rx="3" fill="#4a5670" opacity="0.55"><title>\${fill('${tj("chart.discTip","{0} with no fixed deadline{1}. Indicative placement only — nothing can start before contracting completes, and there is no date to work back from.")}', undated.length + ' ' + plur(undated.length, '${tj("word.jur","jurisdiction")}', '${tj("word.jurs","jurisdictions")}'), anyOverdue ? '${tj("chart.someInForce",", some already in force")}' : '')}\n\${undated.map(c=>c[0]).join(', ')}</title></rect>\`;
      y += RH + GAP;
    } else {
      s += \`<text x="0" y="\${y+15}" font-family="'IBM Plex Mono',monospace" font-size="9.5" letter-spacing="1"><tspan fill="#8d9bb5">NO FIXED DEADLINE</tspan><tspan fill="#93a3c0" letter-spacing="0"> &middot; \${undated.length} jurisdiction\${undated.length===1?'':'s'} &middot; \${anyOverdue ? 'already in force, or startable any time' : 'start any time'} once contracting completes</tspan></text>\`;
      y += RH + GAP;
    }
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

    // Dan: "update the pdf output to include all countries that are
    // checked. Where no mandate exists and no date has been defined you
    // can either accept the pinned date, or say not yet defined, if the
    // date is not pinned."
    //
    // The PDF's wave table was built from WAVES alone, so a selected
    // jurisdiction with no dated deadline appeared nowhere on the printed
    // plan -- it was costed, it was in the one-off total, and the reader
    // taking the PDF into a meeting could not see it. Recorded here
    // rather than in the drawing branches below, because the chart draws
    // this band differently depending on whether it is expanded and the
    // PDF should not care which way the reader happened to leave it.
    UNDATED = undated.map(c => {
      const o = ovrOf(c[0]);
      const wanted = o.start ? D(o.start).getTime() : NaN;
      const pinned = !isNaN(wanted);
      return { name: c[0], pinned,
               start: new Date(pinned ? Math.max(wanted, discStart) : discStart),
               weeks: durOf(c).total,
               // A pin earlier than contracting-complete is clamped, not
               // honoured, exactly as the chart does it. Saying "pinned"
               // while showing a different date would be a small lie on
               // the one artefact that leaves the building.
               clamped: pinned && wanted < discStart };
    });

    if(ganttExpanded) undated.forEach(c => {
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
        s += \`<rect x="\${x1+1}" y="\${y+4}" width="\${Math.max(2,x2-x1-2)}" height="\${RH-8}" rx="3" fill="\${pz.c}" opacity="0.5"><title>\${c[0]} — \${pz.n}\\n\${fill('${tj("chart.discRowTip","{0} weeks. Indicative placement only: there is no fixed deadline, so this can move — but it cannot start before contracting completes.")}', pz.weeks)}</title></rect>\`;
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
    s += \`<text x="\${nx+5}" y="\${H-1}" fill="#b5432f" font-family="'IBM Plex Mono',monospace" font-size="9.5">${tj("chart.today","today")}</text>\`;
  }
  s += \`</svg>\`;
  host.innerHTML = s;

  const late = waveMeta.filter(w=>w.risk==='critical').length, soon = waveMeta.filter(w=>w.risk==='warning').length;
  const typicalTrack = waveMeta.length ? Math.round(waveMeta.reduce((a,w)=>a+w.elapsed,0)/waveMeta.length) : 0;
  // With no dated waves there is no risk verdict to give and no critical
  // path to name, so the head note written above stands rather than being
  // overwritten with a reassurance about zero waves.
  if(!waveMeta.length){ document.getElementById('ganttLegend').innerHTML = ''; return rows; }
  // The critical-path note that used to open this block is gone (Dan,
  // 15 Aug 2026: "I think this comment can be removed altogether"). It
  // fired whenever procurement outran the average wave, which is almost
  // always, so it read as a permanent fixture rather than a finding --
  // and the chart already shows it: the programme bar runs from today to
  // the first country start, in front of every wave, which is the same
  // statement made in a way the reader cannot skim past.
  document.getElementById('ganttHead').innerHTML = (late
    ? \`<div class="note warn"><strong>\${late} ${tj("chart.late","of")} \${waveMeta.length} ${tj("chart.late2","waves back-plan to a start date that has already passed.")}</strong> ${tj("chart.late3","Compressed delivery, an interim filing approach, or an accepted late position &mdash; but the latest responsible start is behind you.")} \${notesLink()}</div>\`
    : soon ? \`<div class="note">\${fill('${tj("guard.soon","<strong>{0} must start within 90 days</strong> to hit the published deadline on your current phase assumptions.")}', soon + ' ' + plur(soon, '${tj("word.wave","wave")}', '${tj("word.waves","waves")}'))}</div>\`
    : \`<div class="note"><strong>Runway is comfortable across all \${waveMeta.length} waves</strong> on your current assumptions.</div>\`);

  document.getElementById('ganttLegend').innerHTML =
    \`<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:8px 0 10px;font-size:11.5px;color:#93a3c0">
      <span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:1px;text-transform:uppercase">${tj("chart.phase","Phase")}</span>
      \${PROG().concat(PH()).map(p=>\`<span style="display:inline-flex;align-items:center;gap:5px"><span style="width:11px;height:11px;border-radius:2px;background:\${p.c};display:inline-block"></span>\${p.n}</span>\`).join('')}
      <span style="display:inline-flex;align-items:center;gap:5px"><span style="display:inline-block;width:0;height:0;border:6px solid transparent;border-left-color:#efe9db;transform:rotate(45deg)"></span>${tj("chart.golive","Go-live")}</span>
      <span style="display:inline-flex;align-items:center;gap:5px;color:#e0907f">${tj("chart.key.late","▲ already late")}</span>
      <span style="display:inline-flex;align-items:center;gap:5px;color:#e2b978">${tj("chart.key.soon","● start &lt;90d")}</span>
      <span style="display:inline-flex;align-items:center;gap:5px;color:#7fd0a8">${tj("chart.key.ok","✓ runway")}</span>
      <span>\${ev('durations','${tj("ev.durationsLong","Durations: practitioner estimates")}')}</span>
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
      <span class="hint" style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase">${tj("adjust.jur","Jurisdiction")}</span>
      <span class="hint" style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase">${tj("adjust.wave","Wave (go-live)")}</span>
      <span class="hint" style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase">${tj("adjust.pin","Pinned start")}</span>
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
    this.open ? '${tj("btn.hide","hide ▴")}' : '${tj("btn.show","show ▾")}';
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
  const errMins = +document.getElementById('errMins').value || 0;
  const fteCost = +document.getElementById('fteCost').value || 0;
  const fteEntry = +document.getElementById('fteEntry').value || 0;
  // Migration 558: the reader sets a DURATION and the page prices it.
  // $45 was ungraded and, converted, asserted 104 minutes per errored
  // invoice -- which nobody had ever written down, because nobody had
  // ever converted it. Minutes x the loaded data-entry rate inherits
  // that rate's grade B instead of inventing a grade D.
  // 2,080 h is the standard paid year; the rate is per PAID hour, which
  // is what a loaded annual cost divides into.
  const entryPerMin = fteEntry / 2080 / 60;
  const entryPerHr  = fteEntry / 2080;
  const errCost = Math.round(errMins * entryPerMin * 100) / 100;
  const sel = chosen();

  // THE EUROPEAN UNION IS ONE ROW, NOT ONE PER MEMBER STATE.
  //
  // Dan, 15 Aug 2026: the per-country ViDA waves migration 532 added were
  // "too messy", and the EU already exists as its own entry on the board.
  // He is right, and migration 504 had settled the same argument there:
  // ViDA is ONE EU fact, not twenty-seven national ones, which is why
  // only the European Union entry was kept on the arrivals board. The
  // planner had been going the other way ever since.
  //
  // So member states carry only their NATIONAL obligations, and the EU
  // obligation is a single automatic row. It is not selectable: ViDA
  // binds you whether or not you remember to tick a box, and requiring
  // the tick would silently omit a real obligation from the plan, which
  // is the failure mode this project keeps finding.
  //
  // Index 10 is the track weight, which scales duration. Index 11 marks
  // the EU row, whose integrations are counted separately below because
  // it is one build plus a connection per member state, not a country
  // track.
  // A member state with no national deadline STAYS IN THE PLAN, as a
  // discretionary implementation. Dan, correcting a first attempt that
  // dropped them: "an EU country with no national mandate can still be
  // added to the planner, just with no current fixed date. We can
  // implement eInvoicing in those countries directly between two peers."
  //
  // He is right, and the two are different builds rather than the same
  // one counted twice: a voluntary four-corner exchange with your trading
  // partners in Austria is not the ViDA reporting connection to the
  // Austrian tax authority in 2030. The first is optional and undated,
  // the second is neither. Austria therefore appears in the discretionary
  // band AND is covered by the European Union row, and pays for both.
  const euMembers = sel.filter(c => c[8]).length;
  const euTrack = euMembers ? COUNTRIES.find(c => c[1] === 'EU') : null;
  const tracks = sel.map(c => c.concat([1, 0]));
  if(euTrack) tracks.push(euTrack.concat([1, 1, euMembers]));

  // --- Layer 1
  // AR is included deliberately. An earlier version collected the AR volume
  // and then never used it, which was backwards: a mandate applies to what
  // you ISSUE, so the sending side is the half that is actually compelled.
  const costAR  = +document.getElementById('costAR').value || 0;
  const errRate = (+document.getElementById('errRate').value || 0)/100;
  const errElim = (+document.getElementById('errElim').value || 0)/100;
  // WHAT SHARE HAS ALREADY BANKED IT (migration 557).
  //
  // Ardent's $9.84 is a BLENDED market average -- the same report puts
  // 51.4% of invoices already arriving electronically -- while the 60-80%
  // range it also publishes is measured "compared to manual- and
  // paper-based methods". Multiplying one by the other took 60% off a
  // cost that was already half optimised.
  //
  // Split the blend at the market share to recover the two channel costs,
  // then apply the READER's share to the gap between them. A business
  // already fully structured saves nothing more; one starting from paper
  // saves the lot.
  const eShare  = Math.min(1, Math.max(0, (+document.getElementById('eShare').value || 0)/100));
  const mkt     = TAXM.mktShare;
  // Rounded to the cent because the row PRINTS it to the cent. Left at
  // full precision the basis reads "$14.23 x 60% x 50%" and the value
  // beside it is $426,836 rather than the $426,900 a reader multiplying
  // it out would get -- a $64 gap with no visible cause. Same defect as
  // the "$9.8" baseline fixed in migration 536, and the same fix: the
  // number shown and the number used are one number.
  const manualCost = Math.round(costNow / ((1 - mkt) + mkt * (1 - savePct)) * 100) / 100;
  const baseline = volAP * manualCost;
  const saving   = baseline * savePct * (1 - eShare);
  const savingAR = volAR * costAR * savePct;
  const errNow   = volAP * errRate;
  const errSave  = errNow * errCost * errElim;    // duration x rate x share
  const l1 = saving + savingAR + errSave;

  // --- complexity / waves
  const complex = tracks.filter(c=>c[4]===2), simple = tracks.filter(c=>c[4]===1);
  const watch = tracks.filter(c=>c[4]===0);
  const dated = tracks.filter(c=>c[5]).sort((a,b)=>a[5]<b[5]?-1:1);
  const secondWaves = tracks.filter(c=>c[11] !== 1).length;
  // Every country you build for counts once per ERP system. The old model
  // counted clearance countries at full rate and "reporting" countries at
  // HALF — a fudge that stood in for "reporting is a bit easier" without
  // anyone claiming to know by how much, and which drove the entire
  // one-off figure. The difference in effort now lives in the RATE
  // instead, which is both easier to defend and easier to override with a
  // real quote. No-mandate countries are costed at the simple rate: with
  // nothing to comply with, a plain connection is all that is left.
  // Weighted, so a ViDA second wave costs a fraction of a full build
  // rather than charging twice for a platform you buy once. Rounded up:
  // half an integration is not a thing you can buy, and rounding down
  // would let a single second wave cost nothing at all.
  // The EU row is excluded from the weighted sums and costed explicitly,
  // because it is not a country track. ViDA's payload is harmonised —
  // one EN 16931-based dataset, one ruleset — so you BUILD the reporting
  // extract once, at the complex rate. But each member state runs its own
  // reporting endpoint, so you CONNECT to each, at the simple rate.
  //
  // Dan's choice from four costed options, and the one that needed no new
  // assumption: it reuses the model's existing complex and simple rates
  // rather than inventing a ratio. A flat single build would have charged
  // a 27-country footprint the same as a one-country one, which is the
  // volume-blindness removed from the platform fee a day earlier.
  const wsum = a => a.reduce((t, c) => t + (c[11] ? 0 : (c[10] === undefined ? 1 : c[10])), 0);
  const euIntComplex = euMembers ? erp : 0;
  const euIntSimple  = euMembers ? (euMembers - 1) * erp : 0;
  const intSimple  = Math.ceil(wsum(simple.concat(watch)) * erp) + euIntSimple;
  const intComplex = Math.ceil(wsum(complex) * erp) + euIntComplex;
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
  // CALIBRATED FOR EXACT CONTINUITY when this shipped: 0.018 and a cap of
  // 0.36 reproduced the old 0.15 and 3 to the penny at the default 100k
  // volume (100,000/12,000 = 8.333 implied FTE; 8.333 x 0.018 = 0.15).
  // The change was about SHAPE, not magnitude, so nothing a reader saw
  // moved on the day.
  //
  // THE CAP IS NOW 0.20, not the 0.36 this comment described until
  // 15 Aug 2026. Migration 527 lowered it -- 36% of an entire AP function
  // saved on tax reporting alone was never defensible, and expressing it
  // as a proportion is what made that arguable at all. At 0.20 the cap
  // starts binding at 12 complex jurisdictions rather than 20. Read the
  // live value from D1 below; this paragraph is history, not the source
  // of truth, and it was itself a migration out of date for a week.
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

  // "your rework cost" was our $45 wearing the reader's name. It is only
  // theirs once they have actually changed it, and the panel already
  // knows the difference — markOverridden() compares against the same
  // registry. Dan: "where did the rework number come from. It's not
  // something I have provided?"
  const overridden = (id) => {
    const el = document.getElementById(id);
    return el && DEFAULTS[id] && String(el.value) !== String(DEFAULTS[id].v);
  };

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
  const placeholders = stillDefault();

  // Dan, 16 Aug 2026: the placeholder warning and the scheduling guard
  // both move BELOW the headline figures.
  //
  // This reverses migration 540, which promoted this warning to the top
  // of the summary on the reasoning that "an executive reading a
  // four-month payback built on placeholder costs is told before they
  // read it, not after". That was right when it was the ONLY thing above
  // the numbers. It is no longer alone: the guard block sat above the
  // section heading as well, so a reader could meet two red boxes before
  // meeting a single figure, and a summary that opens with warnings
  // reads as a broken page rather than a qualified answer.
  //
  // The caveat is not weakened by moving -- it is immediately under the
  // stats, in the same red, still before the savings table and the wave
  // plan. What changes is that the headline gets to be the headline.
  document.getElementById('summary').innerHTML = \`
    <div class="grid g5">
      <div class="stat"><div class="n" style="color:#7fd0a8">\${fmt(l1Banked + l2)}</div><div class="l">${tj("res.banked","Annual saving")}\${l1Unbanked > 0 ? \` (+\${fmt(l1Unbanked)} ${tj("res.unbanked","available on a wider scope")})\` : ''}</div></div>
      <div class="stat"><div class="n" style="color:#e0907f">\${fmt(oneOff)}</div><div class="l">${tj("res.oneOff","One-off investment")} <span class="statwhat">${tj("res.oneOff2","implementation")}</span><span class="statrun">${tj("res.running","plus each year:")} \${fmt(cPlat)} ${tj("res.running2","platform")}${hlp('cPlat',t("tip.covers","What this covers"))} + \${fmt(cRun)} ${tj("res.running3","internal")}${hlp('cRun',t("tip.covers","What this covers"))}</span></div></div>
      <div class="stat"><div class="n" style="color:\${netAnnual>=0?'#7fd0a8':'#e0907f'}">\${fmt(netAnnual)}</div><div class="l">${tj("res.netAnnual","Net annual saving")}</div></div>
      <div class="stat"><div class="n" style="color:\${paybackMonths&&paybackMonths<=24?'#7fd0a8':'#e2b978'}">\${paybackMonths===null?'n/a':paybackMonths<1?'&lt;1mo':Math.round(paybackMonths)+'mo'}</div><div class="l">${tj("res.payback","Payback on one-off")}</div></div>
      <div class="stat"><div class="n" style="color:\${dated.length?'#e08b7a':'#8d9bb5'}">\${dated.length}</div><div class="l">${tj("res.dated","Countries with a dated deadline ahead")}</div></div>
    </div>
    <div class="note" style="margin-top:14px">\${banked
      ? \`<strong>${tj("sum.scopeBoth","Scope: compliance + AP process automation.")}</strong> ${tj("sum.scopeBoth2","Every direct row counts, and the timeline carries a process-change phase per country. The larger, less common programme.")}\`
      : \`<strong>${tj("sum.scopeOnly","Scope: compliance only.")}</strong> \${fmt(l1Banked + l2)} ${tj("sum.scopeOnly2","is saved from the integration itself; the remaining")} \${fmt(l1Unbanked)} ${tj("sum.scopeOnly3","needs a change programme you are not running.")}\`} ${tj("sum.bridge6","Net annual saving is the annual saving less the two running costs above; section 4 shows what makes up the annual saving, row by row.")} \${notesLink()}</div>
    <div id="guards"></div>
    <div class="card"><p style="margin:0">\${fill('${tj("card.mix","Across {0} jurisdictions you have {1} (CTC or 5-corner) and {2} (4-corner exchange){3}.")}',
        '<strong>' + sel.length + '</strong>',
        '<strong>' + complex.length + ' ${tj("word.complex","complex")}</strong>',
        '<strong>' + simple.length + ' ' + plur(simple.length, '${tj("word.regime","simple regime")}', '${tj("word.regimes","simple regimes")}') + '</strong>',
        watch.length ? fill('${tj("card.plusNoMandate",", plus {0} with no mandate{1}")}', watch.length, '${hlp('nomandate',t("tip.nomandate","Why these are still in the plan"))}') : '')}
      \${fill('${tj("card.integrations","With {0} that is roughly {1}{2} to deliver.")}',
        erp + ' ' + plur(erp, '${tj("word.erp","ERP/billing system")}', '${tj("word.erps","ERP/billing systems")}'),
        '<strong>' + integrations + ' ' + plur(integrations, '${tj("word.integration","country-system integration")}', '${tj("word.integrations","country-system integrations")}') + '</strong>',
        '${hlp('integrations',t("tip.derived","How this is derived"))}')}
      \${dated.length ? fill('${tj("card.nearest","The nearest binding date is {0} ({1}).")}', '<strong>' + dated[0][5] + '</strong>', dated[0][0])
        : '${tj("card.noDated","None of the selected jurisdictions has a future dated deadline on the tracker today.")}'} \${ev('site','${tj("ev.siteLabel","Source: live tracker data")}')}</p></div>\`;

  const pace = +document.getElementById('pace').value || 1;
  const ganttRows = buildGantt(tracks, erp, pace);
  const euDrivenCount = sel.filter(c=>c[8]).length;
  document.getElementById('waveIntro').innerHTML = \`${tj("waves.intro","Back-planned from each jurisdiction&rsquo;s published deadline")} \${ev('site','${tj("ev.trackerDates","tracker dates")}')} ${tj("waves.intro2","through phase durations you control")} \${ev('durations','${tj("ev.durations","practitioner estimates")}')}. ${tj("waves.intro3","Procurement is modelled once, not per country.")}\${euDrivenCount?\` <strong>\${euDrivenCount}</strong> ${tj("waves.intro4","are here on an EU-wide obligation, not a national mandate")}${hlp('vida',t("tip.deadlines","Where these deadlines come from"))}.\`:''}\`;
  let w = dated.length ? \`<table><thead><tr><th>${tj("th.deadline","Deadline")}</th><th>${tj("adjust.jur","Jurisdiction")}</th><th>${tj("th.status","Status")}</th><th>${tj("th.model","Model")}${hlp('complexity',t("tip.complexity","How complexity is assigned"))}</th><th class="num">${tj("th.integrations","Integrations")}${hlp('integrations',t("tip.derived","How this is derived"))}</th><th>${tj("th.why","Why")}</th></tr></thead><tbody>\` : '';
  dated.forEach(c=>{
    const st=STATUS[c[3]], cx=CXNAME[c[4]];
    const ints = erp;   // every country you build for, once per ERP system
    const why = c[8]
      ? \`<strong style="color:#e2b978">${tj("waves.euWide.h","EU-wide obligation.")}</strong> \${fill('${tj("waves.euWide","Council Directive (EU) 2025/516 binds this member state from 1 July 2030 regardless of whether it legislates a domestic mandate. {0}")}', CXNOTE[c[4]])}\`
      : CXNOTE[c[4]];
    w += \`<tr><td><strong>\${c[5]}</strong>\${c[8]?' <span class="pill p-upcoming">EU</span>':''}</td><td>\${c[0]}</td><td><span class="pill \${st[1]}">\${st[0]}</span></td><td><span class="pill \${cx[1]}">\${cx[0]}</span></td><td class="num">\${ints}</td><td style="font-size:12px;color:var(--muted)">\${why}</td></tr>\`;
  });
  w += dated.length ? '</tbody></table>' : '<div class="note">No selected jurisdiction has a future dated deadline. Those already in force still need remediation work &mdash; see the in-force list below.</div>';
  if(watch.length) w += \`<div class="note" style="margin-top:12px">\${fill('${tj("waves.noMandate","<strong>No mandate, included by your selection ({0}):</strong> {1}. Costed at the simple rate and scheduled as one discretionary wave &mdash; there is no deadline to miss, so this work can start whenever you have capacity.")}', watch.length, watch.map(c=>c[0]).join(', '))}</div>\`;
  const inforceNoDate = sel.filter(c=>c[3]==='i' && !c[5]);
  if(inforceNoDate.length) w += \`<div class="note" style="margin-top:12px">\${fill('${tj("waves.inforce","<strong>Already in force, no further dated step ({0}):</strong> {1}. These are compliance-now, not project-plan items.")}', inforceNoDate.length, inforceNoDate.map(c=>c[0]).join(', '))}</div>\`;
  document.getElementById('waves').innerHTML = w;
  const gt = document.getElementById('ganttToggle');
  if(gt && !gt.dataset.wired){
    gt.dataset.wired = '1';
    gt.onclick = () => {
      ganttExpanded = !ganttExpanded;
      gt.textContent = ganttExpanded
        ? '${t("btn.group", "Group by wave")}'
        : '${t("btn.expand", "Show every jurisdiction")}';
      showResults();
    };
  }
  const tbl = document.getElementById('tblToggle');
  tbl.onclick = () => {
    const el = document.getElementById('waves');
    const shown = !el.classList.contains('hidden');
    el.classList.toggle('hidden');
    tbl.textContent = shown ? '${tj("btn.showTable","Show as table")}' : '${tj("btn.hideTable","Hide table")}';
  };

  // ---- one savings table -------------------------------------------
  //
  // Dan: "I would like to combine direct and indirect tables, such as to
  // tidy the savings section. With tangible banked entries at the top,
  // and intangible savings at the bottom."
  //
  // Two tables became one the moment 537 gave the indirect side the same
  // two numeric columns as the direct side: identical headers, identical
  // banking rule, one total apiece where the page only ever quotes their
  // sum. Splitting them was carrying a distinction the reader does not
  // navigate by.
  //
  // The distinction still matters -- direct is cash released, indirect is
  // cost avoided, and their evidence differs -- so it moves onto the row
  // as a tag rather than being lost. What the reader navigates by instead
  // is whether a number exists: everything priced sits above the total,
  // banked rows first, and everything this model refuses to price sits
  // below it. The old order interleaved the two, so a reader scanning for
  // the money passed three em-dashes on the way.
  //
  // The total is now the whole section's, which is the figure section 5
  // actually uses. Before this it was the direct table's subtotal and
  // section 5's number appeared nowhere in section 4 at all.
  const dash = '<td class="num">&mdash;</td><td class="num">&mdash;</td>';

  document.getElementById('savingsTable').innerHTML = \`
    <table><thead><tr><th>${t("col.benefit","Benefit")}</th><th>${t("col.basis","Basis")}</th><th class="num">${t("col.gross","Annual value")}</th><th class="num">${t("col.banks","Saved on this scope")}</th></tr></thead><tbody>

    <tr class="grp"><td colspan="4">${t("grp.priced","Priced &mdash; counted in the business case")}</td></tr>

    <tr class="tierA" data-row="ap"><td>${t("row.ap","Processing cost reduction (AP)")} <span class="tag tang">${t("tag.tangible","tangible")}</span> <span class="tag \${banked?'bank':'unbank'}">\${banked?'${t("tag.saved","saved")}':Math.round(TAXM.captureShare*100)+'% ${t("tag.saved","saved")}'}</span></td><td><span class="bcalc"><span class="blab">${tj("basis.lab.calc","Calculation:")}</span>\${fill('${tj("basis.ap.calc","{0} invoices &times; {1} manual cost &times; {2}% reduction &times; {3}% not yet structured{4}")}', volAP.toLocaleString(), fmt1(manualCost), Math.round(savePct*100), Math.round((1-eShare)*100), banked ? '' : fill('${tj("basis.ap.calc2"," &times; {0}% compliance share")}', Math.round(TAXM.captureShare*100)))}</span><span class="bjust"><span class="blab">${tj("basis.lab.just","Justification:")}</span>\${fill('${tj("basis.ap.just","Manual cost decomposed from the market average {0}. Reduction range {1}. Structured share is yours {2}.{3}")}', ev('ardent','${tj("ev.ardentAvg","Ardent Partners")}'), ev('hmrc60','${tj("ev.hmrcAto","HMRC, ATO-corroborated")}'), ev('yours','${tj("ev.yourShare","your figure")}'), banked ? '' : fill('${tj("basis.ap.just2"," Compliance is credited with capture and validation only &mdash; 9 of the 21 minutes of AP handling {0} &mdash; because review and approval are business decisions that no invoice format removes.")}', ev('atoCapture','${tj("ev.taskSplit","the task split")}')))}</span></td><td class="num">\${fmt(saving)}</td><td class="num">\${fmt(bankedAP)}</td></tr>

    <tr class="tierA" data-row="ar"><td>${t("row.ar","Issuing cost reduction (AR)")} <span class="tag tang">${t("tag.tangible","tangible")}</span> <span class="tag bank">${t("tag.saved","saved")}</span></td><td><span class="bcalc"><span class="blab">${tj("basis.lab.calc","Calculation:")}</span>\${fill('${tj("basis.ar.calc","{0} invoices &times; {1} issuing cost &times; {2}% reduction")}', volAR.toLocaleString(), fmt1(costAR), Math.round(savePct*100))}</span><span class="bjust"><span class="blab">${tj("basis.lab.just","Justification:")}</span>\${fill('${tj("basis.ar.just","Issuing cost from the ATO channel figures on its own 60/40 split {0}. Reduction range {1}.")}', ev('ato','${tj("ev.atoDeloitte","ATO / Deloitte")}'), ev('hmrc60','${tj("ev.hmrcAto","HMRC, ATO-corroborated")}'))}</span></td><td class="num">\${fmt(savingAR)}</td><td class="num">\${fmt(savingAR)}</td></tr>

    <tr class="tierA" data-row="tax"><td>${t("row.tax","Reduced tax reporting &amp; audit-prep effort")} <span class="tag tang">${t("tag.tangible","tangible")}</span> <span class="tag bank">${t("tag.saved","saved")}</span></td><td><span class="bcalc"><span class="blab">${tj("basis.lab.calc","Calculation:")}</span>\${fill('${tj("basis.tax.calc","{0} AP invoices imply {1} AP FTE; {2} put {3}% of that in scope{4} &mdash; {5} FTE &times; {6}")}', volAP.toLocaleString(), apFteImplied.toFixed(1), ctcCount + ' ' + plur(ctcCount, '${tj("word.ctcJur","clearance or reporting jurisdiction")}', '${tj("word.ctcJurs","clearance or reporting jurisdictions")}'), (shareUsed*100).toFixed(1), taxCapBinds?' <em>${tj("word.capped","(capped)")}</em>':'', taxFteSaved.toFixed(2), fmt(fteCost))}</span><span class="bjust"><span class="blab">${tj("basis.lab.just","Justification:")}</span>\${fill('${tj("basis.tax.just","Mechanism evidenced {0}; invoices per FTE {1}; the share in scope is ours and capped {2}. Saved on either scope &mdash; reporting effort falls with the compliance build, not with a workflow change.")}', ev('oecd','${tj("ev.oecdDctr","OECD DCTR, 2026")}'), ev('apqc','${tj("ev.apqcMedian","APQC median, 12,000 per FTE")}'), ev('yours','${tj("ev.ourAssumption","our assumption")}'))}</span></td><td class="num">\${fmt(l2)}</td><td class="num">\${fmt(l2)}</td></tr>

    <tr class="tierB" data-row="rework"><td>${t("row.rework","Avoided rework on data-entry errors")} <span class="tag tang">${t("tag.tangible","tangible")}</span> <span class="tag \${banked?'bank':'unbank'}">\${banked?'${t("tag.saved","saved")}':'${t("tag.notSaved","not saved")}'}</span></td><td><span class="bcalc"><span class="blab">${tj("basis.lab.calc","Calculation:")}</span>\${fill('${tj("basis.rework.calc","{0} {1} at {2}% &times; {3} min &times; {4}/h &times; {5}% eliminated")}', Math.round(errNow).toLocaleString(), plur(Math.round(errNow), '${tj("word.erroredInvoice","errored invoice")}', '${tj("word.erroredInvoices","errored invoices")}'), Math.round(errRate*100), errMins, fmt1(entryPerHr), Math.round(errElim*100))}</span><span class="bjust"><span class="blab">${tj("basis.lab.just","Justification:")}</span>\${fill('${tj("basis.rework.just","Error rate {0}; resolution time {1}; data-entry rate {2}; the share eliminated is ours {3}, held under Ardent&rsquo;s exception gap {4}.")}', ev('hmrcErr','${tj("ev.hmrcRate","HMRC consultation")}'), overridden('errMins') ? ev('yours','${tj("ev.yourMins","your resolution time")}') : ev('rework','${tj("ev.atoMins2","ATO exception times")}'), ev('blsEntry','${tj("ev.blsEntry","loaded data-entry rate")}'), ev('errElim','${tj("ev.whyNotAll","why not all of them")}'), ev('ardentExc','${tj("ev.excRate2","18.4% market exception rate")}'))}</span></td><td class="num">\${fmt(errSave)}</td><td class="num">\${bankedErr > 0 ? fmt(bankedErr) : '&mdash;'}</td></tr>

    <tr class="tot" data-row="total"><td colspan="2"><strong>${t("row.savingsTotal","Annual benefit")}</strong>\${l1Unbanked > 0 ? \` <span class="hint" style="display:inline">&mdash; ${t("row.directTotal.gap","the difference needs a change programme you are not running")}</span>\` : ''}</td><td class="num"><strong>\${fmt(l1 + l2)}</strong></td><td class="num"><strong style="color:#7fd0a8">\${fmt(l1Banked + l2)}</strong></td></tr>

    <tr class="grp"><td colspan="4">${t("grp.named","Named, not priced &mdash; real, and this model will not invent a number for them")}</td></tr>

    <tr class="tierA" data-row="cycle"><td>${t("row.cycle","Faster cycle time &amp; fewer supplier queries")} <span class="tag intang">${t("tag.intangible","intangible")}</span></td><td><span class="bcalc"><span class="blab">${tj("basis.lab.calc","Calculation:")}</span>${tj("basis.notPriced","Named, not priced.")}</span><span class="bjust"><span class="blab">${tj("basis.lab.just","Justification:")}</span>\${fill('${tj("basis.cycle.just","Top-performing AP spends <strong>12.8%</strong> of staff time on supplier inquiries against <strong>24.0%</strong> {0} &mdash; an association with high-performing AP, not a measured effect of e-invoicing.")}', ev('ardentInq','${tj("ev.ardent2025","Ardent Partners, 2025 data")}'))} \${notesLink()}</span></td>\${dash}</tr>

    <tr class="tierA" data-row="paper"><td>${t("row.paper","Paper, print, postage, storage")} <span class="tag tang">${t("tag.tangible","tangible")}</span></td><td><span class="bcalc"><span class="blab">${tj("basis.lab.calc","Calculation:")}</span>${tj("basis.notPriced","Named, not priced.")}</span><span class="bjust"><span class="blab">${tj("basis.lab.just","Justification:")}</span>\${fill('${tj("basis.paper.just","Paper AUD 30.87 against AUD 9.18 for an e-invoice {0}; your own print, postage and storage spend is the better input.")}', ev('ato','${tj("ev.atoDeloitte","ATO / Deloitte")}'))}</span></td>\${dash}</tr>

    <tr class="tierC" data-row="vat"><td>${t("row.vat","VAT leakage / gap recovery")} <span class="tag intang">${t("tag.intangible","intangible")}</span></td><td><span class="bcalc"><span class="blab">${tj("basis.lab.calc","Calculation:")}</span>${tj("basis.notPriced","Named, not priced.")}</span><span class="bjust"><span class="blab">${tj("basis.lab.just","Justification:")}</span>\${fill('${tj("basis.vat.just","Often quoted and <strong>not defensible</strong> {0} &mdash; excluded from this model entirely.")}', ev('vatgap','${tj("ev.whyNot","why not")}'))}</span></td>\${dash}</tr>

    <tr class="tierD" data-row="penalty"><td>${t("row.penalty","Penalty &amp; remediation exposure avoided")} <span class="tag intang">${t("tag.intangible","intangible")}</span></td><td><span class="bcalc"><span class="blab">${tj("basis.lab.calc","Calculation:")}</span>${tj("basis.notPriced","Named, not priced.")}</span><span class="bjust"><span class="blab">${tj("basis.lab.just","Justification:")}</span>\${fill('${tj("basis.penalty.just","{0} of your jurisdictions publish a quantified penalty schedule {1}. Size it per country; there is no credible aggregate.")}', sel.filter(c=>c[6]>0).length, ev('site','${tj("ev.deepDives","on their deep dives")}'))}</span></td>\${dash}</tr>

    <tr class="tierD" data-row="fraud"><td>${t("row.fraud","Fraud detection, working-capital visibility")} <span class="tag intang">${t("tag.intangible","intangible")}</span></td><td><span class="bcalc"><span class="blab">${tj("basis.lab.calc","Calculation:")}</span>${tj("basis.notPriced","Named, not priced.")}</span><span class="bjust"><span class="blab">${tj("basis.lab.just","Justification:")}</span>\${fill('${tj("basis.fraud.just","Strategic benefits with no published benchmark {0}.")}', ev('yours','${tj("ev.yourCall","your call")}'))}</span></td>\${dash}</tr>
    </tbody></table>
    \`;


  // ---- savings composition ------------------------------------------
  //
  // Dan: "It might be useful to include a barchart summarising the savings
  // from the project. I.e. x% from data entry reduction y% from tax
  // preparation savings z% from improved invoice cycle time."
  //
  // Two notes on what this can honestly show. Cycle time is NOT in the
  // bar, because this page deliberately does not price it — putting it in
  // would mean inventing the number the rest of the model refuses to
  // invent. It is named underneath with no bar, the same treatment it
  // gets everywhere else here.
  //
  // And the unbanked remainder is a hatched band, not a fourth colour. It
  // is not a category of saving, it is money this scope does not realise;
  // a hue would seat it alongside the three that count. Hatched at 45
  // degrees per the texture rule, which also survives greyscale printing.
  //
  // Part-to-whole with long category names, so: horizontal stacked bar.
  // The three hues are stepped for this surface and validated against it
  // AND white paper, because the same bar goes into the PDF.
  SV = { segs: [
    { k: 'sv1', c: '#399a6c', n: '${tj("sv.capture","Invoice capture and keying")}', v: bankedAP },
    { k: 'sv2', c: '#c07d1c', n: '${tj("sv.issue","Invoice issuing (AR)")}',        v: savingAR },
    { k: 'sv3', c: '#6b86d8', n: '${tj("sv.tax","Tax reporting and audit prep")}',  v: l2 },
  ].concat(banked ? [{ k: 'sv4', c: '#b5432f', n: '${tj("sv.rework","Rework avoided")}', v: bankedErr }] : [])
   .filter(x => x.v > 0), unbanked: Math.max(0, l1Unbanked) };
  renderSavings();

  document.getElementById('evidence').innerHTML = \`
    <p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--soon);margin:0 0 8px">${tj("notes.h.reasoning","The reasoning")}</p>
    <div class="grid g2" style="margin-bottom:16px">
      <div class="card"><h3>${tj("notes.banks.h","What compliance alone saves")}</h3><p class="hint">${tj("notes.banks","Structured invoices arrive ready to post and leave already cleared, so the capture and issuing work goes with the integration itself. Review and approval are workflow decisions, and changing those is a separate programme. The ATO&rsquo;s task times set the split: receipt 7 minutes and validation 2, against review 7 and approval 5. Tax reporting is saved on either scope, because you file structured data to the authority whether or not AP workflow ever changes.")}</p></div>
      <div class="card"><h3>${tj("notes.bracket.h","How conservative is the compliance-only figure?")}</h3><p class="hint">${tj("notes.bracket","Three methods give three answers for what a compliance-only programme saves, as a share of the manual AP cost: <strong>25.7%</strong> by the route used here, <strong>42.9%</strong> if capture is credited with its full share of handling time, and <strong>70.3%</strong> if the ATO&rsquo;s paper-to-eInvoice gap is read as capture and exception work throughout. The lowest is used. The spread is roughly threefold, so a compliance-only case that looks marginal here may be understated.")}</p></div>
      <div class="card"><h3>${tj("notes.rework.h","Rework sits outside the total")}</h3><p class="hint">${tj("notes.rework","This row rests on the three figures we are least sure of: HMRC&rsquo;s 10% error rate, published without a source; the time you tell us one fix takes; and our estimate of how many errors structured data removes. So it is shown in full and left out of the total. Ardent evidences the mechanism without quantifying it, and their 9.8-point gap between best-in-class and average exception rates sets the ceiling used here.")}</p></div>
      <div class="card"><h3>${tj("notes.headcount.h","The same saving, counted in people")}</h3><p class="hint">${tj("notes.headcount","The capture-FTE figure shows the processing-cost saving as people instead of money. It is one saving in two units &mdash; the per-invoice benchmark is mostly labour, so adding both would count it twice.")}\${saving > 0 ? ' ' + fill('${tj("notes.headcountSplit","{0} of {1}, or {2}%; the rest is review, technology and overhead.")}', fmt(captureValue), fmt(saving), Math.round(captureValue/saving*100)) : ''} \${fill('${tj("notes.headcountFte","In people: {0} FTE keying invoices today, of which {1} are released.")}', captureFte.toFixed(1), captureSaved.toFixed(1))} ${tj("notes.headcount2","Released time becomes cash only if the role goes, or is not backfilled.")} \${ev('apqc','APQC')} &middot; \${ev('atoCapture','ATO / Deloitte')}</p></div>
      <div class="card"><h3>${tj("notes.unmonetised.h","Named, but not priced")}</h3><p class="hint">${tj("notes.unmonetised","Paper and postage, because your own spend beats any average. Cycle time and supplier queries, because no study separates the part e-invoicing causes &mdash; Ardent&rsquo;s own")} \${ev('ardentCycle','${tj("ev.cycleGap","2.9 vs 13.5 days")}')} ${tj("notes.unmonetised2","compares the most automated quartile with everyone else, and the")} \${ev('nhs','${tj("ev.nhsQuery","15% query reduction")}')} ${tj("notes.unmonetised3","comes from one unnamed organisation. VAT leakage, penalty exposure and fraud have real mechanisms and no measured magnitudes. They belong in the qualitative case alongside this number.")}</p></div>
    </div>
    <p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--soon);margin:0 0 8px">${tj("notes.h.grades","Evidence grades")}</p>
    <div class="grid g2">
      <div class="card tierA"><h3>${tj("ev.gradeA","Grade A")} <span class="tag tA">${tj("ev.gradeA.tag","measured &amp; primary")}</span></h3><p class="hint">${tj("ev.gradeA.body","Ardent Partners 2025 (cost, cycle time, exception and supplier-inquiry rates) &middot; ATO / Deloitte Access Economics (paper vs PDF vs e-invoice, 2016 vintage, stated) &middot; OECD DCTR 2026 (mechanism) &middot; this site&rsquo;s own tracker data.")}</p></div>
      <div class="card tierB"><h3>${tj("ev.gradeB","Grade B")} <span class="tag tB">${tj("ev.gradeB.tag","credible body, unattributed")}</span></h3><p class="hint">${tj("ev.gradeB.body","HMRC/DBT 60&ndash;80% cost reduction and ~10% manual error rate. Both appear in a UK government consultation, neither with a source inside it. Used here, with that gap on the record.")}</p></div>
      <div class="card tierC"><h3>${tj("ev.gradeC","Grade C")} <span class="tag tC">${tj("ev.gradeC.tag","anecdote, not benchmark")}</span></h3><p class="hint">${tj("ev.gradeC.body","The NHS trust figures (24h vs 10 days, 2&times; payment speed, 15% fewer queries) come from one unnamed, undated organisation. The VAT-gap figures are European Commission and CASE rather than OECD, and their own country analyses attribute the change to economic recovery rather than to digital reporting.")}</p></div>
      <div class="card tierD"><h3>${tj("ev.gradeD","Grade D")} <span class="tag tD">${tj("ev.gradeD.tag","your assumption")}</span></h3><p class="hint">${tj("ev.gradeD.body","Resolution time per errored invoice, the loaded FTE costs, the tax-effort share. These are our starting estimates, shown so you can replace them with your own.")}</p></div>
    </div>\`;

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
    warn.push(fill(plur(mistimed.length,
        '${tj("guard.mistimed.one","<strong>{0} selected jurisdiction has an obligation earlier than the date this plan plans for.</strong> {1}. These are dated, live obligations that the arrivals board does not display, so the wave plan does not schedule it. The runway shown for it is longer than the runway it actually has.")}',
        '${tj("guard.mistimed.many","<strong>{0} selected jurisdictions have obligations earlier than the date this plan plans for.</strong> {1}. These are dated, live obligations that the arrivals board does not display, so the wave plan does not schedule them. The runway shown for them is longer than the runway they actually have.")}'),
      mistimed.length,
      mistimed.map(c => fill(c[5] ? '${tj("guard.mistimed.planned","{0} &mdash; {1} (planned for {2})")}'
                                  : '${tj("guard.mistimed.disc","{0} &mdash; {1} (planned as discretionary)")}',
                             c[0], c[9], c[5])).join('; ')));
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

  // 7. The rework row claims to remove more exceptions than separate the
  //    most automated quartile in the market from everybody else.
  //
  //    Dan asked whether Ardent substantiates the rework metric. It
  //    substantiates the MECHANISM — "eInvoicing drives process
  //    efficiencies by eliminating data capture and manual data entry" —
  //    and publishes no breakdown of exceptions by cause and no
  //    quantified reduction, so it cannot confirm the magnitude. What it
  //    does give is a ceiling: Best-in-Class run 11.1% exceptions against
  //    20.9%, a 9.8-point gap covering EVERY cause, with e-invoicing only
  //    one contributor among several.
  //
  //    The model's own claim is errRate x errElim of all invoices. On the
  //    defaults that is 8.0 points inside 9.8 — tight, and the first real
  //    evidence the 80% is not absurd. Above 9.8 the model asserts that
  //    e-invoicing alone beats everything Best-in-Class do combined,
  //    which is not a big number, it is a wrong one.
  const claimedPp = errRate * errElim * 100;
  if(TAXM.excGapPp > 0 && claimedPp > TAXM.excGapPp){
    warn.push(\`<strong>This model removes more exceptions than separate the best quartile of AP from everyone else.</strong> Your error rate and elimination assumption together take \${claimedPp.toFixed(1)} points of invoices out of exception; Ardent measures the whole gap between Best-in-Class and all others at \${TAXM.excGapPp} points \${ev('excGap','${tj("ev.excSplit","11.1% against 20.9%")}')}, across every cause and with e-invoicing only one contributor. Lower the error rate or the elimination percentage &mdash; as it stands the rework row is claiming more than the market's best performers achieve.\`);
  }

  // The placeholder warning joins the list rather than sitting above it.
  // It is the same KIND of thing as the guards -- a conditional statement
  // about this reader's scenario, not about our method -- and until now
  // it was the same kind of thing rendered by a different mechanism in a
  // different place, which is how two notes end up disagreeing.
  if(placeholders.length){
    warn.unshift(fill('${tj("guard.placeholders","<strong>{0} fields still hold our numbers rather than yours.</strong> Replace them with vendor budgetary estimates in the assumptions panel, and treat the ROI as illustrative until actuals can be provided.")}', placeholders.length));
  }

  // ONE BLOCK, NOT A STACK. Dan, 16 Aug 2026, asked whether every
  // notification on the page should collect at the end of the caveats
  // panel.
  //
  // (Worded carefully: this comment ships to the browser inside the
  // client script, and the i18n suite searches the whole render for
  // English that survives stubbing. Quoting the panel's own heading here
  // failed that check -- a comment is not a rendered string, but the
  // detector cannot tell, and the cheap fix is not to quote page copy in
  // code that is served.)
  //
  // No -- and the reason is that they are two different kinds of thing.
  // These are CONDITIONAL and about the reader's own scenario: they fire
  // on their inputs, change run to run, and each says "this answer has a
  // problem you can act on". The corrections note at the end of the
  // caveats panel is STATIC and about our method. Moving these there
  // would put "your plan schedules three countries after their real
  // deadline" behind a panel that is collapsed by default -- the defect
  // migration 513 fixed by pulling the fixed-rate warning out of a
  // tooltip, and 540 fixed again by moving a caveat above its numbers.
  //
  // What was actually wrong is that three of them stacked into a wall of
  // red before the reader reached a sentence of explanation. So they are
  // grouped under one heading that states the count.
  //
  // OPEN BY DEFAULT, and that was not the first draft. Collapsing it read
  // better and the regression suite refused: there is a check asserting
  // the guards are inline, whose comment says hiding a warning behind a
  // click inverts its whole purpose. That is the same rule migrations 513
  // and 540 both exist to enforce, written down by an earlier version of
  // this work and pointed straight back at it.
  //
  // The grouping is what fixes the wall of red -- one bordered block with
  // one heading and thin rules between items, instead of three full-bleed
  // boxes. The folding was never the part that helped, and it was the
  // part that cost something. The reader can still collapse it.
  document.getElementById('guards').innerHTML = warn.length
    ? \`<details class="note warn guardbox" open><summary>\${fill('${tj("guard.heading","{0} {1} to check before you use these figures")}', warn.length, plur(warn.length, '${tj("word.thing","thing")}', '${tj("word.things","things")}'))}</summary>\`
      + warn.map(w => \`<div class="guarditem">\${w}</div>\`).join('') + '</details>'
    : '';

  // ---- the two-page PDF ---------------------------------------------
  // Built here, from the same variables that just rendered the page, so
  // it cannot drift from what the reader saw. Page 1 is the findings and
  // the wave plan; page 2 is every assumption and caveat, which is where
  // Dan asked for them and also where they belong: a board reads page 1
  // and a finance analyst turns over.
  const pdfEl = document.getElementById('pdfdoc');
  if(pdfEl){
    const gantt = document.querySelector('#gantt svg');
    const pieSvg = document.querySelector('#savings .svpie');
    const kpi = (n, l, tone, sub) => '<div class="kpi ' + (tone || '') + '"><div class="n">' + n
      + '</div><div class="l">' + l + '</div>'
      + (sub ? '<div class="s">' + sub + '</div>' : '') + '</div>';
    const money = (v) => fmt(v);
    const rows = SV.segs.map((sg, i) => '<li><i style="background:' + sg.c + '"></i><span>' + sg.n
      + '</span><b>' + money(sg.v) + '</b><em>'
      + Math.round(sg.v / SV.segs.reduce((a, c) => a + c.v, 0) * 100) + '%</em></li>').join('');
    const when = new Date().toISOString().slice(0, 10);

    pdfEl.innerHTML =
      '<section class="pg">'
      + '<div class="mast"><h1>${tj("pdf.title","E-Invoicing ROI<br>&amp; Wave Plan")}</h1>'
      + '<div class="who">${tj("pdf.masthead","The E-Invoicing Compliance Corner")}<br>'
      + sel.length + ' ${tj("pdf.jur","jurisdictions")} &middot; ' + volAP.toLocaleString() + ' AP / '
      + volAR.toLocaleString() + ' AR<br>' + (banked ? '${tj("pdf.scopeBoth","Compliance + AP automation")}' : '${tj("pdf.scopeOnly","Compliance only")}')
      + ' &middot; ' + when + '</div></div>'

      + '<div class="kpis">'
      // FIVE, and they read the PAGE'S OWN LABELS. Dan asked for the five
      // headline boxes the executive summary shows rather than four, and
      // the missing one -- the count of jurisdictions with a dated
      // deadline ahead -- is the only figure on that strip that is not
      // money, which is probably why it was dropped when this was built.
      //
      // The labels are no longer duplicated. pdf.kpi1 through kpi4
      // held their own copies and drifted for six days after migration
      // 543 renamed the stats on screen. An invariant tying the two
      // together was the first fix and the wrong one: it POLICES a
      // duplication instead of removing it. Reading the res rows directly
      // means the PDF cannot disagree with the screen, because there is
      // only one string.
      + kpi(money(l1Banked + l2), '${tj("res.banked","Annual saving")}', 'good')
      // The one-off box carries the same breakdown the screen puts under
      // it: what the money buys, and what recurs afterwards. A one-off
      // figure printed alone reads as the whole cost of the programme,
      // which it is not -- the running cost is the part that never stops.
      + kpi(money(oneOff), '${tj("res.oneOff","One-off investment")}', 'cost',
          '${tj("res.oneOff2","implementation")} &middot; ${tj("res.running","plus each year:")} '
          + money(cPlat) + ' ${tj("res.running2","platform")} + ' + money(cRun) + ' ${tj("res.running3","internal")}')
      + kpi(money(netAnnual), '${tj("res.netAnnual","Net annual saving")}', netAnnual >= 0 ? 'good' : 'cost')
      + kpi(paybackMonths === null ? 'n/a' : paybackMonths < 1 ? '&lt;1 mo' : Math.round(paybackMonths) + ' mo', '${tj("res.payback","Payback on one-off")}', paybackMonths !== null && paybackMonths <= 24 ? 'good' : 'warn')
      + kpi(dated.length, '${tj("res.dated","Countries with a dated deadline ahead")}', dated.length ? 'warn' : '')
      + '</div>'

      // Dan asked for the footprint card on page 1 too. It is the sentence
      // that says WHAT YOU SELECTED before the page says what it is worth
      // -- complexity mix, integration count, nearest binding date -- and
      // a board pack that opens with four money figures and no statement
      // of scope invites the first question it cannot answer.
      //
      // Built from the SAME D1 rows the screen renders, with the tooltip
      // and evidence-marker slots filled empty: a hover target is
      // meaningless on paper, but the words around it are not, and
      // rewriting them for print would be a third copy of a sentence this
      // migration exists to stop duplicating.
      + '<div class="note">' + fill('${tj("card.mix","Across {0} jurisdictions you have {1} (CTC or 5-corner) and {2} (4-corner exchange){3}.")}',
          '<strong>' + sel.length + '</strong>',
          '<strong>' + complex.length + ' ${tj("word.complex","complex")}</strong>',
          '<strong>' + simple.length + ' ' + plur(simple.length, '${tj("word.regime","simple regime")}', '${tj("word.regimes","simple regimes")}') + '</strong>',
          watch.length ? fill('${tj("card.plusNoMandate",", plus {0} with no mandate{1}")}', watch.length, '') : '')
        + ' ' + fill('${tj("card.integrations","With {0} that is roughly {1}{2} to deliver.")}',
          erp + ' ' + plur(erp, '${tj("word.erp","ERP/billing system")}', '${tj("word.erps","ERP/billing systems")}'),
          '<strong>' + integrations + ' ' + plur(integrations, '${tj("word.integration","country-system integration")}', '${tj("word.integrations","country-system integrations")}') + '</strong>', '')
        + ' ' + (dated.length ? fill('${tj("card.nearest","The nearest binding date is {0} ({1}).")}', '<strong>' + dated[0][5] + '</strong>', dated[0][0])
          : '${tj("card.noDated","None of the selected jurisdictions has a future dated deadline on the tracker today.")}')
        + ' ${tj("ev.siteLabel","Source: live tracker data")}.</div>'
      + '<h2>${tj("pdf.h.mix","Where the annual saving comes from")}</h2>'
      + '<div class="pielay">' + (pieSvg ? pieSvg.outerHTML.replace(/width="\d+"/, 'width="150"').replace(/height="\d+"/, 'height="150"') : '')
      + '<ul class="pkey">' + rows
      + (l1Unbanked > 0 ? '<li><i style="background:repeating-linear-gradient(45deg,#888 0 2px,transparent 2px 5px);border:1px solid #999"></i><span>${tj("sv.unbanked","Available on a wider scope")}</span><b>' + money(l1Unbanked) + '</b><em>&mdash;</em></li>' : '')
      + '</ul></div>'

      // The on-screen chart is 1000x1282 — portrait — so capping its height
      // to fit the page squeezed it to a third of the width and it became
      // an unreadable smear. A wave table is the right artefact on paper
      // anyway: it is legible at 8pt, it fits, and it states the latest
      // responsible start date, which the chart only implies through the
      // position of a bar.
      + '<h2>${tj("pdf.h.plan","Compliance wave plan")}</h2>'
      + ((WAVES.length || UNDATED.length) ? '<table><thead><tr><th>${tj("pdf.th.golive","Go-live")}</th>'
          + '<th>${tj("pdf.th.who","Jurisdictions")}</th><th class="num">${tj("pdf.th.n","No.")}</th>'
          + '<th class="num">${tj("pdf.th.start","Latest responsible start")}</th>'
          + '<th class="num">${tj("pdf.th.elapsed","Elapsed")}</th></tr></thead><tbody>'
          + WAVES.map(wv => {
              const who = ganttRows.filter(r => r.waveKey === wv.dl).map(r => r.c[0]);
              const flag = wv.risk === 'critical' ? ' &#9888;' : '';
              return '<tr><td><strong>' + wv.dl + '</strong>' + flag + '</td><td>'
                + (who.length > 6 ? who.slice(0, 6).join(', ') + ' +' + (who.length - 6) : who.join(', '))
                + '</td><td class="num">' + wv.n + '</td><td class="num">'
                + wv.waveStart.toISOString().slice(0, 10) + '</td><td class="num">'
                + Math.round(wv.elapsed) + 'w</td></tr>';
            }).join('')
          // One row per PINNED jurisdiction, because the reader chose that
          // date and it is the whole reason they pinned it. The rest share
          // a single row, the same shape the dated waves use and the same
          // shape the chart collapses them into. Printing eleven one-line
          // rows instead pushed page one to 307mm against A4's 271.
          + UNDATED.filter(u => u.pinned).map(u => '<tr><td><strong>'
              + u.start.toISOString().slice(0, 10) + '</strong> ${tj("pdf.pinned","pinned")}'
              + (u.clamped ? ' ${tj("pdf.clamped","(moved to earliest)")}' : '')
              + '</td><td>' + u.name + '</td><td class="num">1</td><td class="num">'
              + u.start.toISOString().slice(0, 10) + '</td><td class="num">'
              + Math.round(u.weeks) + 'w</td></tr>').join('')
          + (UNDATED.some(u => !u.pinned) ? (() => {
              const free = UNDATED.filter(u => !u.pinned);
              const who = free.map(u => u.name);
              return '<tr><td>${tj("pdf.nodate","Not yet defined")}</td><td>'
                + (who.length > 6 ? who.slice(0, 6).join(', ') + ' +' + (who.length - 6) : who.join(', '))
                + '</td><td class="num">' + free.length + '</td><td class="num">'
                + free[0].start.toISOString().slice(0, 10) + '</td><td class="num">'
                + Math.round(Math.max(...free.map(u => u.weeks))) + 'w</td></tr>';
            })() : '')
          + '</tbody></table>' : '')
      // The table above is now every selected jurisdiction, so say which
      // rows carry no deadline rather than leaving a reader to infer it
      // from a blank Go-live cell.
      + (UNDATED.length ? '<div class="note">' + UNDATED.length + ' ${tj("pdf.undatedNote","selected jurisdictions have no mandated go-live. They are costed and scheduled; any date shown for them is a planning choice, not an obligation.")}</div>' : '')
      // Headlines only. Each guard opens with a bolded sentence that is the
      // whole finding; the body after it is the explanation, which belongs
      // with the other reasoning on page 2. Printing them whole cost 33mm
      // and pushed page one onto a third page.
      + (warn.length ? '<div class="note"><strong>${tj("pdf.flags","Flagged by the model:")}</strong> '
          + warn.map(w => { const i = w.indexOf('<strong>'), j = w.indexOf('</strong>');
                            const head = (i >= 0 && j > i) ? w.slice(i + 8, j) : w;
                            return head.replace(/<[^>]+>/g, ''); }).join(' ')
          + ' ${tj("pdf.flagsMore","Reasoning overleaf.")}</div>' : '')
      + '<div class="foot">${tj("pdf.foot1","Mandate data is live from this site&rsquo;s tracker and traceable to each country&rsquo;s deep dive. Assumptions, sources and evidence grades are on page 2.")}</div>'
      + '</section>'

      + '<section class="pg">'
      + '<div class="mast"><h1>${tj("pdf.title2","Assumptions<br>&amp; sources")}</h1>'
      + '<div class="who">${tj("pdf.masthead","The E-Invoicing Compliance Corner")}<br>${tj("pdf.page2","Page 2 of 2")} &middot; ' + when + '</div></div>'
      + '<h2>${tj("pdf.h.reasoning","The reasoning")}</h2>'
      // Lifted from the panel that just rendered, rather than restated with
      // its own copy of the strings. Two copies of the same paragraph is
      // how the page ended up contradicting itself over Ardent, and an
      // empty inline fallback would fail the fallback-parity check for a
      // string that is not actually missing.
      + '<div class="cards">'
      + [...document.querySelectorAll('#evidence .grid.g2:first-of-type > .card')]
          .map(c => '<div>' + c.innerHTML + '</div>').join('')
      + '</div>'
      + '<h2>${tj("pdf.h.figures","The figures this rests on")}</h2>'
      + '<table><thead><tr><th>${tj("pdf.th.fig","Figure")}</th><th class="num">${tj("pdf.th.val","Value")}</th><th>${tj("pdf.th.src","Source")}</th><th>${tj("pdf.th.grade","Grade")}</th></tr></thead><tbody>'
      // 557 and 558 added the two biggest levers on the AP and rework rows
      // and NEITHER reached this table, so a reader auditing the PDF could
      // not see the share that halves the processing saving or the minutes
      // the rework row is priced from. The page's second rendering drifting
      // from its first is this project's signature failure -- 546 fixed the
      // same shape when the PDF omitted undated jurisdictions entirely.
      + [['${tj("input.costNow","AP cost per invoice")}', fmt1(costNow), 'Ardent Partners 2025', 'A'],
         ['${tj("input.eShare","E-invoices received today %")}', Math.round(eShare*100) + '%', '${tj("src.yoursAto","Yours &mdash; market average 51% (Ardent)")}', 'B'],
         ['${tj("pdf.fig.manual","Manual invoice cost, decomposed")}', fmt1(manualCost), '${tj("src.decomposed","Ardent blend split at the 51.4% market share")}', 'B'],
         ['${tj("input.costAR","AR cost per invoice")}', fmt1(costAR), 'ATO / Deloitte Access Economics', 'B'],
         ['${tj("input.savePct","Cost reduction %")}', Math.round(savePct*100) + '%', '${tj("src.hmrcAto","HMRC / DBT 2025; ATO channel data implies 67&ndash;70%")}', 'B'],
         ['${tj("input.errRate","Manual error rate %")}', Math.round(errRate*100) + '%', '${tj("src.hmrcDbt","HMRC / DBT consultation 2025")}', 'B'],
         ['${tj("input.errMins","Minutes to resolve one error")}', errMins, '${tj("src.atoExceptions","ATO / Deloitte exception times")}', 'B'],
         ['${tj("input.errElim","Errors eliminated %")}', Math.round(errElim*100) + '%', '${tj("src.cappedAssumption","Our assumption, capped by Ardent exception gap")}', 'D'],
         ['${tj("input.fteCost","Loaded cost / tax or finance FTE")}', fmt(fteCost), 'US BLS OEWS + ECEC', 'B'],
         ['${tj("input.fteEntry","Loaded cost / data-entry FTE")}', fmt(fteEntry), 'US BLS OEWS + ECEC', 'B'],
         ['${tj("pdf.fig.apfte","Invoices per AP FTE / year")}', TAXM.invPerFte.toLocaleString(), 'APQC Open Standards Benchmarking', 'A'],
         ['${tj("pdf.fig.capture","Capture share of AP effort")}', Math.round(TAXM.captureShare*100) + '%', '${tj("src.atoTaskTimes","ATO / Deloitte task times")}', 'A'],
         ['${tj("input.cImplS","Cost per SIMPLE integration")}', fmt(cImplS), '${tj("pdf.placeholder","Placeholder &mdash; replace with a vendor quote")}', 'D'],
         ['${tj("input.cImplC","Cost per COMPLEX integration")}', fmt(cImplC), '${tj("pdf.placeholder","Placeholder &mdash; replace with a vendor quote")}', 'D'],
         ['${tj("input.cPlat","Platform / network fees per year")}', fmt(cPlat), '${tj("pdf.derivedfee","Derived from your volumes &times; per-invoice fee")}', 'D'],
         ['${tj("input.cRun","Internal run cost per year")}', fmt(cRun), '${tj("pdf.placeholder","Placeholder &mdash; replace with a vendor quote")}', 'D']]
        .map(r => '<tr><td>' + r[0] + '</td><td class="num">' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>').join('')
      + '</tbody></table>'
      + '<div class="note">${tj("pdf.grades","Grade A measured, primary and attributable &middot; B published by a credible body but unattributed within it &middot; C a single anecdote &middot; D our starting estimate. Every D figure can be replaced with your own in the tool.")}</div>'
      + '<div class="foot">${tj("footer.pdf","This tool models a business case; it is not tax, legal or investment advice. Figures marked D are our starting estimates rather than benchmarks &mdash; replace them with your own before any decision rests on them.")}</div>'
      + '</section>';
  }

  renderAdjust(tracks);

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
      // The share the BENCHMARK was measured at, not the reader's. It
      // exists only to split Ardent's blended $9.84 into its manual and
      // electronic halves so the reader's own share can be applied to
      // the right one. See migration 557.
      mktShare: val("market_einvoice_share", 51.4) / 100,
      // Ardent's Best-in-Class exception rate against all others, 11.1
      // vs 20.9. The entire observed gap between the most automated
      // quartile and everyone else — used as a ceiling on what this
      // model may claim, never as a target.
      excGapPp: val("exception_reduction_pp", 9.8),
      // vidaRatio retired 15 Aug 2026. Migration 532 priced a per-country
      // ViDA second wave at half a build; the European Union row replaced
      // those entirely, and its cost is one complex build plus a simple
      // connection per member state, expressed in the model's existing
      // rates rather than a ratio of its own.
    }))
    .replace("__ROI_PLATFEE__", JSON.stringify({
      fee: val("platform_fee_per_invoice", 0.4),   // USD, per invoice, either direction
      tpl: t("input.cPlat.derived",
        "Approximate: {vol} invoices &times; {fee} each. This is a rough per-invoice multiplier for the technology &mdash; your vendor&rsquo;s actual price will differ, and should be entered here."),
    }))
    .replace("__ROI_FX__", JSON.stringify(fx && Object.keys(fx).length ? fx : { USD: { r: 1, asOf: "", src: null } }));
  return { body, script };
}
