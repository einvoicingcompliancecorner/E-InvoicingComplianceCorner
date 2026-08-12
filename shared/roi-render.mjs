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
  const { results: countries } = await db.prepare(`
    SELECT c.id, c.name_en, c.code, c.region, c.slug,
           (SELECT COUNT(*) FROM deep_dive_penalty_rows p WHERE p.country_id = c.id) AS penalty_rows,
           (SELECT dpt.compliance_model FROM deep_dive_page_translations dpt
             WHERE dpt.country_id = c.id AND dpt.lang = 'en') AS compliance_model
      FROM countries c
     WHERE c.code <> 'EU'
     ORDER BY c.name_en
  `).all();
  const { results: ms } = await db.prepare(
    `SELECT country_id, date, mandate_scope, confidence FROM milestones WHERE on_tracker = 1`
  ).all();

  const byCountry = new Map();
  for (const m of ms) {
    if (!byCountry.has(m.country_id)) byCountry.set(m.country_id, []);
    byCountry.get(m.country_id).push(m);
  }

  const REG = { "Europe": "Eu", "Middle East / Africa": "Mi", "Asia-Pacific": "As", "Americas": "Am" };
  return countries.map((c) => {
    const mine = byCountry.get(c.id) || [];
    let status = "t";
    if (mine.some((m) => m.mandate_scope === "b2b" && m.date <= today)) status = "i";
    else if (mine.some((m) => m.mandate_scope === "b2b" && m.date > today && m.confidence !== "expected")) status = "u";
    else if (mine.some((m) => m.mandate_scope === "b2g_only" && m.date <= today)) status = "b";
    else if (mine.some((m) => m.mandate_scope === "b2b" && m.date > today && m.confidence === "expected")) status = "u";
    else if (mine.length) status = "n";

    const model = String(c.compliance_model || "").toLowerCase();
    let cx = 0;
    if (/clearance|ctc|pre-validation/.test(model)) cx = 3;
    else if (/reporting|post-issuance/.test(model)) cx = 2;
    else if (status === "b") cx = 1;

    const future = mine.filter((m) => m.date > today && m.mandate_scope === "b2b").map((m) => m.date).sort();
    return [c.name_en, c.code, REG[c.region] || "Eu", status, cx, future[0] || "", c.penalty_rows || 0, c.slug];
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
.countries{max-height:260px;overflow:auto;border:1px solid var(--line);border-radius:8px;padding:10px;background:var(--ink)}
.creg{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--soon);margin:10px 0 5px}
.creg:first-child{margin-top:0}
.cbox{display:flex;align-items:flex-start;gap:7px;padding:2px 0;font-size:13.5px}
.cbox input{margin-top:3px}
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
.tierA{border-left:4px solid var(--live)}.tierB{border-left:4px solid var(--soon)}.tierC{border-left:4px solid var(--stamp)}.tierD{border-left:4px solid var(--upcoming)}
.tag{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.5px;text-transform:uppercase;padding:1px 6px;border-radius:3px;border:1px solid currentColor;margin-left:6px}
.tA{color:#7fd0a8}.tB{color:#e2b978}.tC{color:#e0907f}.tD{color:#9fb2d4}
.tang{color:#7fd0a8;border-color:#3f7d5c}.intang{color:#9fb2d4;border-color:#3a4864}
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
  table{font-size:11px}
  h2{border-bottom:1px solid #999}
}
`;

// The page. `locked` controls whether results are reachable without a
// session; `subscribed` is the signed-in reader's own saved countries
// (empty for anonymous visitors, which disables that control).
export function renderRoiPage({ countries, benchmarks = [], phases = [], strings = {},
                                locked = true, subscribed = [], unlockUrl = "", signedInAs = "" }) {
  // Benchmarks, phases and citations are injected from D1 rather than
  // hardcoded here. This is what makes the tool translation-ready without
  // a code change: a Spanish reader gets Spanish labels, hints and
  // citations from roi_benchmark_translations, while the NUMBERS — which
  // are language-neutral — come from the parent row and stay identical
  // across languages. Getting that split right is why these went into D1.
  const byKey = Object.fromEntries(benchmarks.map((b) => [b.key, b]));
  const val = (k, fb) => (byKey[k] && byKey[k].default_value != null ? byKey[k].default_value : fb);
  const hintOf = (k) => (byKey[k] && byKey[k].hint) || "";

  const defaults = {
    costNow: { v: val("ap_cost_per_invoice", 9.84), h: hintOf("ap_cost_per_invoice") },
    costAR:  { v: val("ar_cost_per_invoice", 6.5),  h: hintOf("ar_cost_per_invoice") },
    savePct: { v: val("cost_reduction_pct", 60),    h: hintOf("cost_reduction_pct") },
    errRate: { v: val("manual_error_rate", 10),     h: hintOf("manual_error_rate") },
    errCost: { v: val("rework_per_error", 45),      h: hintOf("rework_per_error") },
    fteCost: { v: val("loaded_fte_cost", 62000),    h: hintOf("loaded_fte_cost") },
    cImpl:   { v: val("cost_per_integration", 20000), h: hintOf("cost_per_integration") },
    cPlat:   { v: val("platform_cost_year", 45000),   h: hintOf("platform_cost_year") },
    cRun:    { v: val("internal_run_cost", 30000),    h: hintOf("internal_run_cost") },
    lanes:   { v: 2 },
    pace:    { v: "1" },
  };
  const PHASE_INPUT = { mobilise: "wMob", design: "wDes", build: "wBld", uat: "wUat",
                        change: "wChg", vendor: "wVen", contract: "wCon" };
  phases.forEach((p) => { const id = PHASE_INPUT[p.key]; if (id) defaults[id] = { v: p.default_weeks }; });

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
    durations: { t: "D", s: "Phase durations are practitioner estimates for a country rollout once a platform is in place, held in D1 and editable above. No analyst firm publishes credible per-country e-invoicing implementation durations — this was checked." },
    yours: { t: "D", s: "Your assumption. Nothing is claimed for this figure — it is exposed so the model can be argued with rather than believed." },
    site: { t: "A", s: "Live mandate data from this site's own tracker: status, model and dated deadlines per jurisdiction, each traceable to the cited legal instrument on that country's deep dive." },
  };
  const chartPhases = phases.map((p) => ({ k: p.key, n: p.name, w: p.default_weeks, c: p.colour,
                                           prog: !!p.is_programme, scope: p.scope }));

  const body = `<div class="wrap">

<p class="eyebrow">The E-Invoicing Compliance Corner</p>
<h1>E-Invoicing ROI &amp;<br>Wave Planner</h1>
<p class="lede">Build a board-ready business case from your own volumes and footprint &mdash; with a dated, sourced compliance wave plan drawn from the 70 jurisdictions this site tracks. Every benchmark carries a visible evidence grade, so your CFO can see exactly which numbers are independently evidenced and which are your own assumptions.</p>


<h2 class="noprint">1 &middot; Your footprint</h2>
<div class="card noprint">
  <div class="grid g4">
    <div>
      <label for="volAP">Invoices received / year (AP)</label>
      <input type="number" id="volAP" value="250000" min="0" step="1000">
    </div>
    <div>
      <label for="volAR">Invoices issued / year (AR)</label>
      <input type="number" id="volAR" value="180000" min="0" step="1000">
      <p class="hint">What the mandates actually bite on.</p>
    </div>
    <div>
      <label for="erp">ERP / billing integrations</label>
      <input type="number" id="erp" value="4" min="1" max="60">
    </div>
    <div>
      <label for="cur">Currency</label>
      <select id="cur"><option value="GBP">GBP &pound;</option><option value="EUR">EUR &euro;</option><option value="USD" selected>USD $</option></select>
    </div>
  </div>
</div>

<div class="card noprint">
  <label for="scope">What are you modelling?</label>
  <select id="scope" style="max-width:460px">
    <option value="compliance" selected>Compliance only &mdash; meet the mandates (IT workstream)</option>
    <option value="both">Compliance + AP process automation &mdash; also bank the savings</option>
  </select>
  <p class="hint">Kept out front rather than buried in the assumptions: it is a scoping decision, not a benchmark, and it changes both the numbers and the timeline.</p>
</div>

<div class="card noprint">
  <label>Countries in scope</label>
  <p class="hint" style="margin-bottom:8px">Live mandate data for all 70 tracked jurisdictions. <button id="selEU" style="padding:3px 9px;font-size:12px">EU only</button> <button id="selMandate" style="padding:3px 9px;font-size:12px">Everywhere with a mandate</button> <button id="selNone" style="padding:3px 9px;font-size:12px">Clear</button></p>
  <label class="cbox" id="subsRow" style="align-items:center;gap:8px;padding:9px 12px;margin:0 0 10px;background:var(--ink-3);border:1px solid var(--line);border-radius:6px;font-size:13.5px">
    <input type="checkbox" id="useSubs">
    <span>Use <strong>my subscribed countries</strong> <span id="subsCount" class="hint" style="display:inline"></span></span>
  </label>
  <div class="countries" id="countryList"></div>
</div>

<details class="card noprint" id="assump" style="padding:0">
  <summary style="cursor:pointer;padding:16px 20px;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px">
    <span>
      <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:var(--soon)">Assumptions &amp; benchmarks</span>
      <span class="hint" style="display:block;margin:4px 0 0">Everything below is pre-filled with our defaults. Open it only if you know better numbers &mdash; every one can be overridden.</span>
    </span>
    <span id="assumpChevron" style="font-family:'IBM Plex Mono',monospace;color:var(--muted);font-size:12px;white-space:nowrap">show &#9662;</span>
  </summary>
  <div style="padding:0 20px 18px">
    <p class="note" style="margin-bottom:14px">Each figure shows where it came from. <span class="tag tA">A</span> measured and primary &middot; <span class="tag tB">B</span> credible body, unattributed &middot; <span class="tag tD">D</span> our estimate. Overriding a value with your own always beats our default &mdash; that is what this panel is for. <button type="button" id="resetDefaults" style="padding:3px 9px;font-size:12px;margin-left:6px">Reset all to defaults</button></p>

    <p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--soon);margin:0 0 8px">Cost &amp; benefit</p>
    <div class="grid g4">
      <div><label for="costNow">AP cost per invoice <span class="tag tA">A</span></label><input type="number" id="costNow" value="9.84" min="0" step="0.01"><p class="hint" id="h-costNow"></p></div>
      <div><label for="costAR">AR cost per invoice <span class="tag tA">A</span></label><input type="number" id="costAR" value="6.50" min="0" step="0.01"><p class="hint" id="h-costAR"></p></div>
      <div><label for="savePct">Cost reduction % <span class="tag tB">B</span></label><input type="number" id="savePct" value="60" min="0" max="95"><p class="hint" id="h-savePct"></p></div>
      <div><label for="errCost">Rework per errored invoice <span class="tag tD">D</span></label><input type="number" id="errCost" value="45" min="0" step="1"><p class="hint" id="h-errCost"></p></div>
    </div>
    <div class="grid g4" style="margin-top:12px">
      <div><label for="errRate">Manual error rate % <span class="tag tB">B</span></label><input type="number" id="errRate" value="10" min="0" max="100" step="0.5"><p class="hint" id="h-errRate"></p></div>
      <div><label for="fteCost">Loaded cost / finance FTE <span class="tag tD">D</span></label><input type="number" id="fteCost" value="62000" min="0" step="1000"><p class="hint" id="h-fteCost"></p></div>
      <div></div><div></div>
    </div>

    <p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--soon);margin:20px 0 8px">Investment &mdash; costs <span class="tag tD">D</span></p>
    <p class="hint" style="margin:-4px 0 8px;color:#e0907f">These are <strong>placeholders, not benchmarks</strong>. We checked: no analyst firm publishes credible per-country e-invoicing implementation or platform costs. Replace them with your own quotes &mdash; until you do, treat the payback figure as illustrative only.</p>
    <div class="grid g4">
      <div><label for="cImpl" style="font-size:11px">Cost per integration (one-off)</label><input type="number" id="cImpl" value="20000" min="0" step="1000"><p class="hint" id="h-cImpl"></p></div>
      <div><label for="cPlat" style="font-size:11px">Platform / network fees per year</label><input type="number" id="cPlat" value="45000" min="0" step="1000"><p class="hint" id="h-cPlat"></p></div>
      <div><label for="cRun" style="font-size:11px">Internal run cost per year</label><input type="number" id="cRun" value="30000" min="0" step="1000"><p class="hint" id="h-cRun"></p></div>
      <div></div>
    </div>

    <p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--soon);margin:20px 0 8px">Implementation &mdash; weeks <span class="tag tD">D</span></p>
    <div class="grid g4">
      <div><label for="wMob" style="font-size:11px">Mobilisation</label><input type="number" id="wMob" value="2" min="0" step="0.5"></div>
      <div><label for="wDes" style="font-size:11px">Design</label><input type="number" id="wDes" value="2" min="0" step="0.5"></div>
      <div><label for="wBld" style="font-size:11px">Build</label><input type="number" id="wBld" value="2" min="0" step="0.5"></div>
      <div><label for="wUat" style="font-size:11px">UAT</label><input type="number" id="wUat" value="1" min="0" step="0.5"></div>
    </div>
    <div class="grid g4" style="margin-top:12px" id="chgRow">
      <div><label for="wChg" style="font-size:11px">Process change &amp; training</label><input type="number" id="wChg" value="6" min="0" step="0.5"><p class="hint">AP automation scope only.</p></div>
      <div></div><div></div><div></div>
    </div>
    <div class="grid g4" style="margin-top:12px">
      <div><label for="wVen" style="font-size:11px">Vendor selection (once)</label><input type="number" id="wVen" value="8" min="0" step="1"></div>
      <div><label for="wCon" style="font-size:11px">Contracting (once)</label><input type="number" id="wCon" value="6" min="0" step="1"></div>
      <div><label for="lanes" style="font-size:11px">Parallel workstreams</label><input type="number" id="lanes" value="2" min="1" max="10"></div>
      <div><label for="pace" style="font-size:11px">Delivery pace</label><select id="pace"><option value="0.75">Aggressive</option><option value="1" selected>Typical</option><option value="1.3">Conservative</option></select></div>
    </div>
    <p class="hint" style="margin-top:10px">Durations are per country. Countries sharing a go-live date form a wave, so a five-country wave costs roughly five country-tracks of effort, divided across however many workstreams you can genuinely run at once.</p>
  </div>
</details>

<p class="noprint" style="margin:16px 0 0"><button class="primary" id="run">Calculate business case</button> <button id="print" class="hidden">Download PDF</button></p>

<div id="gate" class="gate noprint hidden">
  <p class="eyebrow" style="color:var(--soon)">Subscriber content</p>
  <h3 style="font-family:'Big Shoulders Display';font-size:22px;text-transform:uppercase;letter-spacing:.5px">Your results are ready</h3>
  <p class="lede" style="margin:0 auto 14px;max-width:52ch">Sign in free to see the full wave plan, the two-layer ROI model and the evidence panel, to pull in the countries you already follow, and to download the PDF for your board pack.</p>
  <button class="primary" id="signin">Sign in / subscribe free</button>
  
</div>

<div id="results" class="hidden">
  <h2>2 &middot; Executive summary</h2>
  <div id="summary"></div>
  <h2>3 &middot; Compliance wave plan</h2>
  <p class="lede" id="waveIntro"></p>
  <div class="card" style="padding:14px 16px 6px">
    <div id="ganttHead"></div>
    <div style="overflow-x:auto"><div id="gantt"></div></div>
    <div id="ganttLegend"></div>
  </div>
  <p class="noprint" style="margin:-4px 0 14px"><button id="tblToggle" style="padding:5px 11px;font-size:12.5px">Show as table</button></p>
  <div id="waves" class="hidden"></div>
  <h2>4 &middot; Direct savings &mdash; cash-releasing</h2>
  <p class="lede">Money that stops leaving the business: processing cost per invoice, and rework you no longer pay for. Available wherever you digitise, mandate or not.</p>
  <div id="direct"></div>
  <h2>5 &middot; Indirect savings &mdash; cost and risk avoided</h2>
  <p class="lede">Cost you avoid rather than cash you release: tax and audit effort, penalty exposure, fraud. The <em>mechanisms</em> are well evidenced; the <em>magnitudes</em> mostly are not, which is why so much of this section is named rather than monetised.</p>
  <div id="indirect"></div>
  <h2>6 &middot; Investment &amp; payback</h2>
  <div id="invest"></div>
  <h2>7 &middot; What the evidence actually supports</h2>
  <div id="evidence"></div>
</div>

<footer>
  <p><strong>The E-Invoicing Compliance Corner</strong> &mdash; ROI &amp; wave planner. Country mandate data is live as of 11 August 2026 and traceable to the per-country deep dives. Benchmark figures carry the evidence grade shown against each. This tool models a business case; it is not tax, legal or investment advice.</p>
</footer>
</div>

`;
  const script = `
const COUNTRIES = __ROI_COUNTRIES__;
let unlocked = __ROI_UNLOCKED__;
const REGION = {Eu:'Europe', Mi:'Middle East / Africa', As:'Asia-Pacific', Am:'Americas'};
const STATUS = {i:['In force','p-inforce'], u:['Upcoming','p-upcoming'], b:['B2G only','p-b2gonly'], n:['No mandate','p-nomandate'], t:['Tracked','p-nomandate']};
const CXNAME = {3:['Complex','cx3'], 2:['Moderate','cx2'], 1:['Light','cx1'], 0:['Watch only','cx0']};
const CXNOTE = {3:'Clearance / CTC: the tax authority is inside the transaction. Per-country integration, structured format, real-time validation.',
  2:'Post-issuance reporting: the invoice is valid on delivery; transmission is a separate duty. Less invasive than clearance.',
  1:'B2G only: obligations apply when invoicing the public sector. Usually Peppol-shaped and comparatively light.',
  0:'No mandate today. Worth monitoring, no build required.'};
const SYM = {GBP:'£', EUR:'€', USD:'$'};
let cur='USD';
const fmt = n => SYM[cur] + Math.round(n).toLocaleString('en-US');
const fmt1 = n => SYM[cur] + (Math.round(n*10)/10).toLocaleString('en-US');

// ---- evidence grades -------------------------------------------------
// A = measured, primary, attributable      B = published by a credible body but unattributed within it
// C = single anecdote, not a benchmark     D = your assumption, nothing claimed
const EV = __ROI_EVIDENCE__;
const ev = (key, txt) => \`<span class="ev" tabindex="0">\${txt}<span class="tip"><b>Evidence grade \${EV[key].t}</b>\${EV[key].s}</span></span>\`;

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
  markOverridden(); syncScope(); if(unlocked) showResults();
};
document.getElementById('assump').addEventListener('input', markOverridden);

// ---- country picker --------------------------------------------------
const list = document.getElementById('countryList');
const byRegion = {};
COUNTRIES.forEach((c,i) => { (byRegion[c[2]] ||= []).push([c,i]); });
let html='';
['Eu','Mi','As','Am'].forEach(r => {
  if(!byRegion[r]) return;
  html += \`<div class="creg">\${REGION[r]}</div>\`;
  byRegion[r].forEach(([c,i]) => {
    const st = STATUS[c[3]], cx = CXNAME[c[4]];
    html += \`<label class="cbox"><input type="checkbox" data-i="\${i}"><span>\${c[0]} <span class="pill \${st[1]}">\${st[0]}</span> <span class="pill \${cx[1]}">\${cx[0]}</span>\${c[5]?\` <span class="hint" style="display:inline">&middot; \${c[5]}</span>\`:''}</span></label>\`;
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
// Compressed relative to the old model: on a lean 7-week track the spread
// between a clearance and a B2G country is proportionally much smaller.
const CXF = {3:1.0, 2:0.75, 1:0.6, 0:0};
const addW = (d,w) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + Math.round(w*7)); return x; };
const D = s => new Date(s + 'T00:00:00Z');
const isoD = d => d.toISOString().slice(0,10);
const NOW = new Date();

function buildGantt(sel, erp, pace){
  const host = document.getElementById('gantt');
  const erpF = 1 + Math.min((erp-1)*0.12, 0.6); // gentler: a lean track scales less with system count
  const dated = sel.filter(c => c[5] && c[4] > 0);
  if(!dated.length){
    document.getElementById('ganttHead').innerHTML = '<div class="note">No selected jurisdiction has both a future dated deadline and a mandate to build for, so there is no delivery timeline to plot. Jurisdictions already in force still need remediation — see the table below.</div>';
    host.innerHTML = ''; document.getElementById('ganttLegend').innerHTML = ''; return null;
  }
  const maxCx = Math.max(...dated.map(c=>c[4]));
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
    waveRows.sort((a,b) => a.start - b.start || a.lane - b.lane);
    const progStart = addW(waveStart, -progWeeks);
    const slipDays = Math.round((progStart - NOW)/86400000);
    const risk = slipDays < 0 ? 'critical' : slipDays < 90 ? 'warning' : 'good';
    const elapsed = Math.round((golive - waveStart)/(86400000*7));
    waveMeta.push({dl, golive, n: members.length, effort, elapsed, waveStart, progStart, slipDays, risk});
    waveRows.forEach(r => rows.push({...r, slipDays, risk, waveKey: dl}));
  });

  const progEnd = new Date(Math.min(...rows.map(r=>r.start.getTime())));
  const progBegin = addW(progEnd, -progWeeks);
  const t0 = new Date(Math.min(progBegin.getTime(), NOW.getTime()));
  const t1 = new Date(Math.max(...rows.map(r=>r.golive.getTime())));
  const pad = (t1-t0)*0.03;
  const X0 = t0.getTime()-pad, X1 = t1.getTime()+pad;

  const L = 168, R = 116, W = 1000, RH = 24, GAP = 4, HEAD = 34;
  const groups = [...new Set(rows.map(r=>r.waveKey))];
  const H = HEAD + (RH+GAP)*(rows.length + groups.length + 2) + 16;
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
    s += \`<text x="0" y="\${y+15}" fill="#f2f0e8" font-size="12">\${r.c[0]}</text>\`;
    s += \`<text x="\${L-10}" y="\${y+15}" fill="#93a3c0" font-family="'IBM Plex Mono',monospace" font-size="9" text-anchor="end">\${REGSHORT[r.c[2]]} &middot; \${cx[0].toUpperCase()}\${lanes>1?\` &middot; L\${r.lane+1}\`:''}</text>\`;
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
  // today marker
  const nx = x(NOW.getTime());
  if(nx > L && nx < W-R){
    s += \`<line x1="\${nx}" y1="\${HEAD-8}" x2="\${nx}" y2="\${H-10}" stroke="#b5432f" stroke-width="2" stroke-dasharray="4 3"/>\`;
    s += \`<text x="\${nx+5}" y="\${H-1}" fill="#b5432f" font-family="'IBM Plex Mono',monospace" font-size="9.5">today</text>\`;
  }
  s += \`</svg>\`;
  host.innerHTML = s;

  const late = waveMeta.filter(w=>w.risk==='critical').length, soon = waveMeta.filter(w=>w.risk==='warning').length;
  const typicalTrack = Math.round(waveMeta.reduce((a,w)=>a+w.elapsed,0)/waveMeta.length);
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
function showResults(){
  build();
  document.getElementById('results').classList.remove('hidden');
  document.getElementById('print').classList.remove('hidden');
  document.getElementById('results').scrollIntoView({behavior:'smooth'});
}
document.getElementById('run').onclick = () => {
  if(unlocked){ showResults(); return; }
  document.getElementById('gate').classList.remove('hidden');
  document.getElementById('gate').scrollIntoView({behavior:'smooth', block:'center'});
};
document.getElementById('signin').onclick = () => {
  unlocked = true;
  setSubsAvailable(true);
  document.getElementById('gate').classList.add('hidden');
  document.getElementById('run').textContent = 'Recalculate';
  showResults();
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
  const complex = sel.filter(c=>c[4]===3), moderate = sel.filter(c=>c[4]===2);
  const light = sel.filter(c=>c[4]===1), watch = sel.filter(c=>c[4]===0);
  const dated = sel.filter(c=>c[5]).sort((a,b)=>a[5]<b[5]?-1:1);
  const integrations = complex.length*erp + moderate.length*Math.max(1,Math.round(erp*0.5));

  // --- Layer 2 (modelled from assumptions only)
  const ctcCount = complex.length + moderate.length;
  const taxFteSaved = ctcCount ? Math.min(ctcCount*0.15, 3) : 0;
  const l2 = taxFteSaved * fteCost;

  const scope = scopeVal(), banked = scope === 'both';
  document.getElementById('summary').innerHTML = \`
    <div class="grid g4">
      <div class="stat"><div class="n" style="color:\${banked?'#7fd0a8':'#8d9bb5'}">\${fmt(l1)}</div><div class="l">Direct &mdash; \${banked?'banked annually':'unlocked, NOT banked'}</div></div>
      <div class="stat"><div class="n" style="color:#e2b978">\${fmt(l2)}</div><div class="l">Indirect &mdash; modelled</div></div>
      <div class="stat"><div class="n">\${sel.length}</div><div class="l">Jurisdictions in scope</div></div>
      <div class="stat"><div class="n" style="color:\${dated.length?'#e08b7a':'#8d9bb5'}">\${dated.length}</div><div class="l">With a dated deadline ahead</div></div>
    </div>
    <div class="note \${banked?'':'warn'}" style="margin-top:14px">\${banked
      ? \`<strong>Scope: compliance + AP process automation.</strong> Direct savings count, because your programme includes the process redesign and retraining needed to realise it &mdash; and the timeline below carries a process-change phase per country to match. \`
      : \`<strong>Scope: compliance only.</strong> Direct savings are greyed because this programme <em>unlocks</em> \${fmt(l1)} a year without banking any of it. A mandate integration makes structured data available and removes the paper; it does not change how AP works. Switch scope above to model actually capturing it. \`}Direct savings are what AP process automation delivers; indirect savings are what the compliance regime itself delivers. A mandate integration is an IT workstream that unlocks the first and delivers the second &mdash; worth separating in front of a board, because only one of them is non-negotiable. The two are deliberately <strong>not</strong> added together. Direct savings rest on published figures; indirect ones rest on assumptions you set, because no credible source quantifies them. A CFO will trust a smaller defended number over a larger asserted one.</div>
    <div class="card"><p style="margin:0">Across <strong>\${sel.length}</strong> jurisdictions you have <strong>\${complex.length} clearance</strong>, <strong>\${moderate.length} reporting</strong> and <strong>\${light.length} B2G-only</strong> regimes, plus \${watch.length} to monitor. With \${erp} ERP/billing system\${erp===1?'':'s'} that is roughly <strong>\${integrations} country-system integration\${integrations===1?'':'s'}</strong> to deliver. \${dated.length?\`The nearest binding date is <strong>\${dated[0][5]}</strong> (\${dated[0][0]}).\`:'None of the selected jurisdictions has a future dated deadline on the tracker today.'} \${ev('site','Source: live tracker data')}</p></div>\`;

  const pace = +document.getElementById('pace').value || 1;
  const ganttRows = buildGantt(sel, erp, pace);
  document.getElementById('waveIntro').innerHTML = \`Back-planned from each jurisdiction's actual published deadline \${ev('site','dates from the tracker')}, through phase durations you control \${ev('durations','practitioner estimates')}. Grouped by region, then by go-live date. Vendor selection and contracting are modelled once at programme level rather than repeated per country.\`;
  let w = dated.length ? \`<table><thead><tr><th>Deadline</th><th>Jurisdiction</th><th>Status</th><th>Model</th><th class="num">Integrations</th><th>Why</th></tr></thead><tbody>\` : '';
  dated.forEach(c=>{
    const st=STATUS[c[3]], cx=CXNAME[c[4]];
    const ints = c[4]===3?erp : c[4]===2?Math.max(1,Math.round(erp*0.5)) : 1;
    w += \`<tr><td><strong>\${c[5]}</strong></td><td>\${c[0]}</td><td><span class="pill \${st[1]}">\${st[0]}</span></td><td><span class="pill \${cx[1]}">\${cx[0]}</span></td><td class="num">\${ints}</td><td style="font-size:12px;color:var(--muted)">\${CXNOTE[c[4]]}</td></tr>\`;
  });
  w += dated.length ? '</tbody></table>' : '<div class="note">No selected jurisdiction has a future dated deadline. Those already in force still need remediation work &mdash; see the in-force list below.</div>';
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
    <tr class="tierA"><td>Processing cost reduction (AP) <span class="tag tang">tangible</span></td><td>\${volAP.toLocaleString()} invoices &times; \${fmt1(costNow)} \${ev('ardent','baseline')} &times; \${Math.round(savePct*100)}% \${ev('hmrc60','reduction')}</td><td class="num">\${fmt(saving)}</td></tr>
    <tr class="tierA"><td>Issuing cost reduction (AR) <span class="tag tang">tangible</span></td><td>\${volAR.toLocaleString()} invoices &times; \${fmt1(costAR)} \${ev('ato','ATO / Deloitte')} &times; \${Math.round(savePct*100)}% \${ev('hmrc60','reduction')}</td><td class="num">\${fmt(savingAR)}</td></tr>
    <tr class="tierB"><td>Avoided rework on data-entry errors <span class="tag tang">tangible</span></td><td>\${Math.round(errNow).toLocaleString()} errored invoices \${ev('hmrcErr',\`at ~\${Math.round(errRate*100)}%\`)} &times; \${fmt(errCost)} \${ev('yours','your rework cost')} &times; 80%</td><td class="num">\${fmt(errSave)}</td></tr>
    <tr class="tierC"><td>Faster cycle time &amp; fewer supplier queries <span class="tag intang">intangible</span></td><td>Real, but the only figures available are one NHS anecdote \${ev('nhs','see evidence')} &mdash; <strong>deliberately not monetised</strong></td><td class="num">&mdash;</td></tr>
    <tr class="tierA"><td>Paper, print, postage, storage <span class="tag tang">tangible</span></td><td>Paper AUD 30.87 vs e-invoice AUD 9.18 \${ev('ato','ATO / Deloitte')}; your own spend is the better input</td><td class="num">&mdash;</td></tr>
    <tr style="border-top:2px solid var(--line)"><td colspan="2"><strong>Direct total &mdash; \${banked?'banked':'unlocked, not banked'}</strong></td><td class="num"><strong style="color:\${banked?'#7fd0a8':'#8d9bb5'}">\${fmt(l1)}</strong></td></tr>
    </tbody></table>
    <div class="note warn" style="margin-top:12px"><strong>Important scope caveat.</strong> These savings come from automating the accounts-payable <em>process</em> &mdash; not from the compliance integration on its own. An e-invoicing mandate integration is largely an IT workstream: it makes structured invoice data available and removes the paper, which is what <em>enables</em> the saving, but the saving is only realised if you also change how AP actually works. If your programme is scoped as compliance-only, treat the direct savings as unlocked rather than banked, and the indirect savings as what compliance itself delivers.</div>
    <div class="note" style="margin-top:10px">Two benefits above are left unmonetised on purpose. Both are real; neither has a benchmark that survives scrutiny, and inventing one would undermine every other number on this page.</div>\`;

  document.getElementById('indirect').innerHTML = \`
    <table><thead><tr><th>Benefit</th><th>Evidence position</th><th class="num">Annual value</th></tr></thead><tbody>
    <tr class="tierA"><td>Reduced tax reporting &amp; audit-prep effort <span class="tag tang">tangible</span></td><td>Mechanism evidenced \${ev('oecd','OECD DCTR, 2026')}; magnitude modelled from \${taxFteSaved.toFixed(2)} FTE &times; \${fmt(fteCost)} \${ev('yours','your figures')}</td><td class="num">\${fmt(l2)}</td></tr>
    <tr class="tierC"><td>VAT leakage / gap recovery <span class="tag intang">intangible</span></td><td>Often quoted, <strong>not defensible</strong> \${ev('vatgap','why not')} &mdash; excluded from this model entirely</td><td class="num">&mdash;</td></tr>
    <tr class="tierD"><td>Penalty &amp; remediation exposure avoided <span class="tag intang">intangible</span></td><td>\${sel.filter(c=>c[6]>0).length} of your jurisdictions publish a quantified penalty schedule \${ev('site','on their deep dives')}. Size it from those, per country &mdash; there is no credible aggregate</td><td class="num">&mdash;</td></tr>
    <tr class="tierD"><td>Fraud detection, working-capital visibility <span class="tag intang">intangible</span></td><td>Strategic benefits; no benchmark exists \${ev('yours','your call')}</td><td class="num">&mdash;</td></tr>
    </tbody></table>
    <div class="note warn" style="margin-top:12px"><strong>Why the indirect column is smaller than you would expect.</strong> The compliance case is genuinely compelling &mdash; but almost every circulating number attached to it fails verification. This model shows only what can be defended and names what cannot, which is a stronger position in front of a finance committee than a bigger number that collapses under a single question.</div>\`;

  // ---- investment: without a cost side this is a benefits calculator, not ROI
  const cImpl = +document.getElementById('cImpl').value || 0;
  const cPlat = +document.getElementById('cPlat').value || 0;
  const cRun  = +document.getElementById('cRun').value || 0;
  const oneOff = integrations * cImpl;
  const annualCost = cPlat + cRun;
  const annualBenefit = (banked ? l1 : 0) + l2;
  const netAnnual = annualBenefit - annualCost;
  const paybackMonths = netAnnual > 0 ? (oneOff / netAnnual) * 12 : null;
  const placeholders = ['cImpl','cPlat','cRun'].filter(id => String(document.getElementById(id).value) === String(DEFAULTS[id].v));

  document.getElementById('invest').innerHTML = \`
    \${placeholders.length ? \`<div class="note warn"><strong>\${placeholders.length} of 3 cost inputs are still our placeholders.</strong> No analyst firm publishes credible per-country e-invoicing implementation or platform costs &mdash; we checked, and would rather say so than invent one. Put your own quotes in the assumptions panel before showing anyone the payback figure.</div>\` : ''}
    <div class="grid g4">
      <div class="stat"><div class="n" style="color:#e0907f">\${fmt(oneOff)}</div><div class="l">One-off &mdash; \${integrations} integration\${integrations===1?'':'s'}</div></div>
      <div class="stat"><div class="n" style="color:#e0907f">\${fmt(annualCost)}</div><div class="l">Annual run cost</div></div>
      <div class="stat"><div class="n" style="color:\${netAnnual>=0?'#7fd0a8':'#e0907f'}">\${fmt(netAnnual)}</div><div class="l">Net annual \${banked?'benefit':'(compliance scope)'}</div></div>
      <div class="stat"><div class="n" style="color:\${paybackMonths&&paybackMonths<=24?'#7fd0a8':'#e2b978'}">\${paybackMonths===null?'n/a':Math.round(paybackMonths)+'mo'}</div><div class="l">Payback on one-off</div></div>
    </div>
    \${!banked ? \`<div class="note" style="margin-top:12px">On a compliance-only scope the net figure is negative by design, and that is the correct answer rather than a broken one: you are buying the right to keep trading in these markets, not a return. The \${fmt(l1)} of direct savings sits unclaimed until the scope widens &mdash; which is the actual investment case for doing both at once.</div>\` : ''}
    <div class="note" style="margin-top:12px"><strong>Tangible versus intangible.</strong> Everything counted above is tangible: a number someone can be held to. The intangible benefits &mdash; faster cycle times, penalty exposure avoided, fraud detection, VAT position &mdash; are listed in the two sections above and deliberately carry no value. They are real, they often matter more to a board than the arithmetic, and there is no honest way to price them. Present them as the qualitative case alongside this number, not inside it.</div>\`;

  document.getElementById('evidence').innerHTML = \`
    <div class="grid g2">
      <div class="card tierA"><h3>Grade A <span class="tag tA">measured &amp; primary</span></h3><p class="hint">Ardent Partners 2025 (cost, cycle time, exceptions) &middot; ATO / Deloitte Access Economics (paper vs PDF vs e-invoice, 2016 vintage, stated) &middot; OECD DCTR 2026 (mechanism) &middot; this site&rsquo;s own tracker data.</p></div>
      <div class="card tierB"><h3>Grade B <span class="tag tB">credible body, unattributed</span></h3><p class="hint">HMRC/DBT 60&ndash;80% cost reduction and ~10% manual error rate. Both appear in a UK government consultation; neither carries a source within it. Real enough to use, not strong enough to lead with.</p></div>
      <div class="card tierC"><h3>Grade C <span class="tag tC">anecdote, not benchmark</span></h3><p class="hint">The NHS trust figures (24h vs 10 days, 2&times; payment speed, 15% fewer queries) &mdash; one unnamed, undated organisation. The VAT-gap figures, which are European Commission/CASE rather than OECD, and whose own country analyses credit economic recovery rather than digital reporting.</p></div>
      <div class="card tierD"><h3>Grade D <span class="tag tD">your assumption</span></h3><p class="hint">Rework cost per errored invoice, loaded FTE cost, tax-effort saving. Nothing is claimed for these; they are exposed so the model can be argued with rather than believed.</p></div>
    </div>
    <div class="note" style="margin-top:14px">Corrections applied during verification: the VAT-gap figures were re-attributed from OECD to the European Commission, Hungary&rsquo;s start figure corrected 9.8%&rarr;10.4% and Poland&rsquo;s 12.7%&rarr;12.5%, and the &ldquo;reduced penalty exposure&rdquo; claim was removed from the HMRC attribution &mdash; the word &ldquo;penalty&rdquo; does not appear in that consultation.</div>\`;
}
`
    .replace("__ROI_COUNTRIES__", JSON.stringify(countries))
    .replace("__ROI_SUBSCRIBED__", JSON.stringify(subscribed))
    .replace("__ROI_UNLOCKED__", locked ? "false" : "true")
    .replace("__ROI_DEFAULTS__", JSON.stringify(defaults))
    .replace("__ROI_EVIDENCE__", JSON.stringify(evidence))
    .replace("__ROI_PHASES__", JSON.stringify(chartPhases));
  return { body, script };
}
