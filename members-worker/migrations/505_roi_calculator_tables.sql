-- ================================================================
-- ROI & Wave Planner: benchmark and phase tables, translation-ready.
--
-- Dan, 11 Aug 2026: "consider supporting translations in the future,
-- during the design of the D1 tables."
--
-- Taken seriously rather than deferred, because retrofitting i18n onto
-- a page with this much copy is genuinely painful and this project has
-- already paid that bill once (privacy-policy.html shipped unwired and
-- had to be retro-fitted on 4 Aug). Every table below therefore follows
-- the house pattern used by milestones, stories, deep-dive content and
-- tracking sources: a language-neutral parent row carrying the numbers
-- and the structure, plus an X_translations child keyed on
-- (parent_id, lang) carrying every word a reader sees.
--
-- Nothing here needs a code change to add Spanish, German or French —
-- only INSERTs. That is the whole point of doing it now.
--
-- WHAT LIVES WHERE, and why the split is where it is:
--
--   roi_benchmarks       — the numbers and their evidence grade. A
--                          benchmark is DATA, not code: when Ardent
--                          publishes its 2026 edition, that should be a
--                          migration with a sourcing trail, exactly like
--                          a milestone correction, not an edit buried in
--                          a Worker deploy. The `source_url`, `source_year`
--                          and `evidence_grade` columns exist so the page
--                          can keep its promise that every figure shows
--                          where it came from.
--
--   roi_phases           — implementation phases, their default weeks and
--                          their chart colour. Adding a phase becomes an
--                          INSERT rather than a code change.
--
--   translations         — the page's own chrome (headings, labels,
--                          explanatory prose) under namespace 'roi', the
--                          same mechanism every other page already uses.
--                          Seeded EN-only here; ES/DE/FR are a follow-up
--                          migration and need no code change.
--
-- EVIDENCE GRADES (deliberately a constrained vocabulary — this is the
-- tool's core claim and must not drift into freeform text):
--   'A' measured, primary, attributable
--   'B' published by a credible body but unattributed within it
--   'C' single anecdote or contested causal claim — named, never counted
--   'D' our estimate or the customer's own input — nothing claimed
--
-- The grades below come from the 11 Aug 2026 verification pass. Two
-- corrections from that pass are baked in and must not be quietly
-- reversed: the VAT-gap figures are European Commission/CASE rather
-- than OECD, and their own country analyses credit post-pandemic
-- economic recovery rather than digital reporting, so they are graded C
-- and carry no monetary value anywhere in the model.
-- ================================================================

CREATE TABLE IF NOT EXISTS roi_benchmarks (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  key            TEXT NOT NULL UNIQUE,   -- stable code-facing identifier, e.g. 'ap_cost_per_invoice'
  default_value  REAL,                   -- NULL where the benchmark is qualitative
  unit           TEXT,                   -- 'currency' | 'percent' | 'weeks' | 'count' | NULL
  evidence_grade TEXT NOT NULL CHECK (evidence_grade IN ('A','B','C','D')),
  source_url     TEXT,
  source_year    TEXT,                   -- TEXT, not INTEGER: '2016 estimates' and '2019-21' are both real
  is_cost        INTEGER NOT NULL DEFAULT 0 CHECK (is_cost IN (0,1)),  -- 1 = investment side, 0 = benefit side
  sort_order     INTEGER NOT NULL DEFAULT 0,
  active         INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1))
);

CREATE TABLE IF NOT EXISTS roi_benchmark_translations (
  benchmark_id INTEGER NOT NULL REFERENCES roi_benchmarks(id),
  lang         TEXT NOT NULL,
  label        TEXT NOT NULL,   -- the input's label
  hint         TEXT,            -- the one-line "where this came from" under the input
  citation     TEXT,            -- the full evidence tooltip, may contain inline HTML
  PRIMARY KEY (benchmark_id, lang)
);

CREATE TABLE IF NOT EXISTS roi_phases (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  key           TEXT NOT NULL UNIQUE,
  default_weeks REAL NOT NULL,
  colour        TEXT NOT NULL,   -- validated against the dark chart surface; see PROGRESS.md
  is_programme  INTEGER NOT NULL DEFAULT 0 CHECK (is_programme IN (0,1)), -- run once, not per country
  scope         TEXT NOT NULL DEFAULT 'all' CHECK (scope IN ('all','automation')), -- 'automation' = only when AP automation is in scope
  sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS roi_phase_translations (
  phase_id INTEGER NOT NULL REFERENCES roi_phases(id),
  lang     TEXT NOT NULL,
  name     TEXT NOT NULL,
  note     TEXT,
  PRIMARY KEY (phase_id, lang)
);

CREATE INDEX IF NOT EXISTS idx_roi_benchmarks_active ON roi_benchmarks(active, sort_order);

-- ----------------------------------------------------------------
-- Benchmarks. Every figure below was verified on 11 Aug 2026; the
-- grade records how well it survived. Note how few are grade A — that
-- is the honest picture of this field, not a gap in the research.
-- ----------------------------------------------------------------
INSERT OR IGNORE INTO roi_benchmarks (key, default_value, unit, evidence_grade, source_url, source_year, is_cost, sort_order) VALUES
  ('ap_cost_per_invoice', 9.84, 'currency', 'A', 'https://payablesplace.ardentpartners.com/2026/01/state-of-epayables-part-nine-ap-benchmarks-and-best-in-class-performance/', '2025 data', 0, 0),
  ('ar_cost_per_invoice', 6.50, 'currency', 'B', 'https://www.ato.gov.au/businesses-and-organisations/einvoicing/peppol-einvoicing-value-assessment/value-assessment-report/cost-calculations', '2016 estimates', 0, 1),
  ('cost_reduction_pct',  60,   'percent',  'B', 'https://www.gov.uk/government/consultations/promoting-electronic-invoicing-across-uk-businesses-and-the-public-sector/electronic-invoicing-promoting-e-invoicing-across-uk-businesses-and-the-public-sector', '2025', 0, 2),
  ('manual_error_rate',   10,   'percent',  'B', 'https://www.gov.uk/government/consultations/promoting-electronic-invoicing-across-uk-businesses-and-the-public-sector/electronic-invoicing-promoting-e-invoicing-across-uk-businesses-and-the-public-sector', '2025', 0, 3),
  ('rework_per_error',    45,   'currency', 'D', NULL, NULL, 0, 4),
  ('loaded_fte_cost',  62000,   'currency', 'D', NULL, NULL, 0, 5),
  ('cycle_time_days',   8.2,    'count',    'A', 'https://payablesplace.ardentpartners.com/2026/01/state-of-epayables-part-nine-ap-benchmarks-and-best-in-class-performance/', '2025 data', 0, 6),
  ('exception_rate',   18.4,    'percent',  'A', 'https://payablesplace.ardentpartners.com/2026/01/state-of-epayables-part-nine-ap-benchmarks-and-best-in-class-performance/', '2025 data', 0, 7),
  ('nhs_query_reduction', 15,   'percent',  'C', 'https://www.smallbusinesscommissioner.gov.uk/help-and-guidance/all-advice/e-invoicing-for-small-businesses/', 'updated Jan 2026', 0, 8),
  ('vat_gap_context',   NULL,   NULL,       'C', 'https://taxation-customs.ec.europa.eu/system/files/2023-10/VAT%20Gap%20Report%202023_0.pdf', '2019-21', 0, 9),
  ('dctr_mechanism',    NULL,   NULL,       'A', 'https://www.oecd.org/en/publications/2026/01/digital-continuous-transactional-reporting-for-value-added-tax_09f49627.html', '2026', 0, 10),
  ('cost_per_integration', 20000, 'currency', 'D', NULL, NULL, 1, 20),
  ('platform_cost_year',   45000, 'currency', 'D', NULL, NULL, 1, 21),
  ('internal_run_cost',    30000, 'currency', 'D', NULL, NULL, 1, 22);

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'AP cost per invoice', 'Ardent Partners market average, 2025 data',
  'Ardent Partners, <em>The State of ePayables 2025</em>, published 22 Jan 2026. Market-average cost per invoice USD 9.84 across 204 AP professionals. Free and primary.'
  FROM roi_benchmarks WHERE key = 'ap_cost_per_invoice';
INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'AR cost per invoice', 'Derived from ATO/Deloitte figures — see citation',
  'Derived from the Australian Taxation Office / Deloitte Access Economics <em>Peppol eInvoicing value assessment</em> (paper AUD 30.87, PDF AUD 27.67, eInvoice AUD 9.18, combined sender and receiver, ATO states these date from 2016). Graded B rather than A because the split to an AR-only figure is <strong>our derivation</strong>, not the ATO''s published number.'
  FROM roi_benchmarks WHERE key = 'ar_cost_per_invoice';
INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Cost reduction %', 'HMRC quotes 60-80%; defaulted to the bottom',
  'HMRC / DBT consultation, 13 Feb 2025: &ldquo;Industry estimates suggest that moving to e-invoicing reduces invoicing costs by 60-80%.&rdquo; <strong>Note:</strong> HMRC attributes this to unnamed industry estimates and cites no study, so it is an illustrative range rather than a measured finding.'
  FROM roi_benchmarks WHERE key = 'cost_reduction_pct';
INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Manual error rate %', 'HMRC consultation — unsourced within it',
  'Same HMRC / DBT consultation: &ldquo;Manually entering supplier invoice data has an average error rate of approximately 10%.&rdquo; No source is given for the figure within the document.'
  FROM roi_benchmarks WHERE key = 'manual_error_rate';
INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Rework per errored invoice', 'No benchmark exists — our estimate',
  'Our estimate. No analyst firm publishes a defensible cost-per-exception figure; replacing this with your own is strictly better than our guess.'
  FROM roi_benchmarks WHERE key = 'rework_per_error';
INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Loaded cost per finance FTE', 'Our estimate — use your own',
  'Our estimate, used only to size the indirect tax-effort saving. Your own loaded cost is the right input.'
  FROM roi_benchmarks WHERE key = 'loaded_fte_cost';
INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Invoice cycle time (days)', 'Ardent Partners, 2025 data', 'Ardent Partners, The State of ePayables 2025: market-average cycle time 8.2 days.'
  FROM roi_benchmarks WHERE key = 'cycle_time_days';
INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Exception rate', 'Ardent Partners, 2025 data', 'Ardent Partners, The State of ePayables 2025: market-average exception rate 18.4%. Note this rose from 14% in the prior edition.'
  FROM roi_benchmarks WHERE key = 'exception_rate';
INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Supplier query reduction', 'One NHS trust — an anecdote, not a benchmark',
  'UK Small Business Commissioner guidance, page updated 16 Jan 2026: one NHS trust processed e-invoices within 24 hours versus 10 days on paper, was paid almost twice as quickly, and saw supplier queries fall about 15%. <strong>A single unnamed, undated organisation.</strong> Directional only; never monetised in this model.'
  FROM roi_benchmarks WHERE key = 'nhs_query_reduction';
INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'VAT gap context', 'Widely quoted, not causally defensible',
  'VAT-gap falls often quoted for Hungary (10.4%&rarr;4.4%), Italy (21.8%&rarr;10.8%), Poland (12.5%&rarr;3.3%) and Spain (6.1%&rarr;0.8%), 2019&ndash;21. <strong>Two corrections from verification:</strong> these are European Commission / CASE figures, not OECD; and the Commission''s own country analyses for Hungary, Italy and Poland credit post-pandemic economic recovery rather than digital reporting. <strong>Carries no value anywhere in this model.</strong>'
  FROM roi_benchmarks WHERE key = 'vat_gap_context';
INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'CTC compliance mechanism', 'OECD, Jan 2026 — mechanism, not magnitude',
  'OECD, <em>Digital Continuous Transactional Reporting for Value Added Tax</em>, 9 Jan 2026: DCTR &ldquo;typically requires the (near) real-time reporting of invoices or transactional data to tax authorities, most often with the objective of strengthening VAT compliance and risk management.&rdquo; Establishes the mechanism; it is design guidance, not an outcomes study, so it supports no percentage.'
  FROM roi_benchmarks WHERE key = 'dctr_mechanism';
INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Cost per integration (one-off)', 'PLACEHOLDER — no credible benchmark exists',
  'A placeholder, not a benchmark. No analyst firm publishes credible per-country e-invoicing implementation costs &mdash; this was checked directly. Replace with your own quotes before showing anyone the payback figure.'
  FROM roi_benchmarks WHERE key = 'cost_per_integration';
INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Platform / network fees per year', 'PLACEHOLDER — depends entirely on your vendor', 'A placeholder, not a benchmark. Vendor pricing in this market varies by an order of magnitude and is rarely published.'
  FROM roi_benchmarks WHERE key = 'platform_cost_year';
INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Internal run cost per year', 'PLACEHOLDER — your own run-rate', 'A placeholder, not a benchmark. Your own run-rate is the only meaningful input here.'
  FROM roi_benchmarks WHERE key = 'internal_run_cost';

-- ----------------------------------------------------------------
-- Phases. Durations are practitioner estimates for a country rollout
-- once a platform is in place, NOT a published benchmark -- no analyst
-- firm publishes these either. Colours were validated against the
-- chart's dark surface (all six accessibility checks pass, including
-- colour-blind separation); do not change them without re-validating.
-- ----------------------------------------------------------------
INSERT OR IGNORE INTO roi_phases (key, default_weeks, colour, is_programme, scope, sort_order) VALUES
  ('vendor',   8, '#d55181', 1, 'all',        0),
  ('contract', 6, '#008300', 1, 'all',        1),
  ('mobilise', 2, '#3987e5', 0, 'all',        2),
  ('design',   2, '#d95926', 0, 'all',        3),
  ('build',    2, '#199e70', 0, 'all',        4),
  ('uat',      1, '#c98500', 0, 'all',        5),
  ('change',   6, '#9085e9', 0, 'automation', 6);

INSERT OR IGNORE INTO roi_phase_translations (phase_id, lang, name, note)
SELECT id, 'en', 'Vendor selection', 'Run once for the programme, not per country.' FROM roi_phases WHERE key = 'vendor';
INSERT OR IGNORE INTO roi_phase_translations (phase_id, lang, name, note)
SELECT id, 'en', 'Contracting', 'Run once for the programme, not per country.' FROM roi_phases WHERE key = 'contract';
INSERT OR IGNORE INTO roi_phase_translations (phase_id, lang, name, note)
SELECT id, 'en', 'Mobilisation', NULL FROM roi_phases WHERE key = 'mobilise';
INSERT OR IGNORE INTO roi_phase_translations (phase_id, lang, name, note)
SELECT id, 'en', 'Design', NULL FROM roi_phases WHERE key = 'design';
INSERT OR IGNORE INTO roi_phase_translations (phase_id, lang, name, note)
SELECT id, 'en', 'Build', NULL FROM roi_phases WHERE key = 'build';
INSERT OR IGNORE INTO roi_phase_translations (phase_id, lang, name, note)
SELECT id, 'en', 'UAT', NULL FROM roi_phases WHERE key = 'uat';
INSERT OR IGNORE INTO roi_phase_translations (phase_id, lang, name, note)
SELECT id, 'en', 'Process change &amp; training', 'Only when AP process automation is in scope: this is business change, not integration.' FROM roi_phases WHERE key = 'change';

-- ----------------------------------------------------------------
-- Page chrome, namespace 'roi'. EN only for now; adding a language is
-- purely INSERTs against this namespace and needs no code change.
-- ----------------------------------------------------------------
INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'page.title',      'en', 'E-Invoicing ROI &amp; Wave Planner'),
  ('roi', 'page.lede',       'en', 'Build a board-ready business case from your own volumes and footprint — with a dated, sourced compliance wave plan drawn from the jurisdictions this site tracks. Every benchmark carries a visible evidence grade, so your CFO can see exactly which numbers are independently evidenced and which are your own assumptions.'),
  ('roi', 'sec.footprint',   'en', 'Your footprint'),
  ('roi', 'sec.summary',     'en', 'Executive summary'),
  ('roi', 'sec.waves',       'en', 'Compliance wave plan'),
  ('roi', 'sec.direct',      'en', 'Direct savings — cash-releasing'),
  ('roi', 'sec.indirect',    'en', 'Indirect savings — cost and risk avoided'),
  ('roi', 'sec.invest',      'en', 'Investment &amp; payback'),
  ('roi', 'sec.evidence',    'en', 'What the evidence actually supports'),
  ('roi', 'input.volAP',     'en', 'Invoices received / year (AP)'),
  ('roi', 'input.volAR',     'en', 'Invoices issued / year (AR)'),
  ('roi', 'input.erp',       'en', 'ERP / billing integrations'),
  ('roi', 'input.currency',  'en', 'Currency'),
  ('roi', 'input.countries', 'en', 'Countries in scope'),
  ('roi', 'input.scope',     'en', 'What are you modelling?'),
  ('roi', 'scope.compliance','en', 'Compliance only — meet the mandates (IT workstream)'),
  ('roi', 'scope.both',      'en', 'Compliance + AP process automation — also bank the savings'),
  ('roi', 'assumptions.title','en','Assumptions &amp; benchmarks'),
  ('roi', 'assumptions.hint','en', 'Everything below is pre-filled with our defaults. Open it only if you know better numbers — every one can be overridden.'),
  ('roi', 'subs.label',      'en', 'Use my subscribed countries'),
  ('roi', 'subs.locked',     'en', 'sign in to use your saved countries'),
  ('roi', 'btn.calculate',   'en', 'Calculate business case'),
  ('roi', 'btn.recalculate', 'en', 'Recalculate'),
  ('roi', 'btn.pdf',         'en', 'Download PDF'),
  ('roi', 'gate.eyebrow',    'en', 'Subscriber content'),
  ('roi', 'gate.title',      'en', 'Your results are ready'),
  ('roi', 'gate.body',       'en', 'Sign in free to see the full wave plan, the two-layer ROI model and the evidence panel, to pull in the countries you already follow, and to download the PDF for your board pack.'),
  ('roi', 'gate.cta',        'en', 'Sign in / subscribe free'),
  ('roi', 'tag.tangible',    'en', 'tangible'),
  ('roi', 'tag.intangible',  'en', 'intangible'),
  ('roi', 'menu.label',      'en', 'ROI &amp; Wave Planner');

-- Register the tool as a trackable feature (migration 503), so the
-- weekly digest surfaces it as ready to announce once it ships.
INSERT OR IGNORE INTO features (slug, title, description, shipped_at) VALUES
  ('roi-wave-planner',
   'E-Invoicing ROI &amp; Wave Planner',
   'A subscriber tool that builds a board-ready e-invoicing business case from your own invoice volumes, ERP count and country footprint — including a delivery wave plan back-planned from the real published mandate deadlines, and an evidence grade against every benchmark used.',
   '2026-08-11');
