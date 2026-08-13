-- ================================================================
-- ROI planner: split the one-off integration cost by complexity, and
-- write the whole classification rule into the assumptions panel where
-- a reader can actually find it.
--
-- Dan, 12 Aug 2026, two instructions in the same exchange:
--   1. '...as a simple model as $10k implementation cost. Where there
--      is a CTC, or 5-Corner model we should allocate complex and
--      assume $20k implementation cost.'
--   2. 'Can these assumptions be written somewhere, perhaps in the
--      appropriate section / tab on the roi calculator?'
--
-- The second instruction is the more important of the two. A cost model
-- that treats Belgium and Brazil identically is wrong; a cost model that
-- treats them differently for reasons the reader cannot see is worse,
-- because it looks authoritative and cannot be argued with. Migration
-- 506 already built the place for this — the D1-backed help layer behind
-- the `?` markers — so this is an INSERT into a mechanism that exists,
-- not a new one.
--
-- WHAT CHANGES IN THE MATHS. The old model had a single
-- cost_per_integration of $20,000 applied to a count derived by a fudge:
-- clearance countries x ERPs, plus HALF that for reporting countries.
-- The half was never defensible — it stood in for "reporting is a bit
-- easier" without anyone claiming to know by how much. It is now gone.
--
--     simple  countries x ERP systems  @  $10,000
--     complex countries x ERP systems  @  $20,000
--
-- Every country you have to build for now counts once per ERP system,
-- and the difference in effort shows up in the RATE rather than in a
-- discounted count. That is both easier to explain to a CFO and easier
-- to override with a real quote, which is the point of the panel.
--
-- This also closes open item 3 from the 11 Aug build note, which flagged
-- the integration-count formula as crude and warned that it drove the
-- entire one-off figure.
--
-- STILL PLACEHOLDERS, AND STILL SAID SO. $10,000 and $20,000 are Dan's
-- practitioner estimates, not benchmarks. Grade D, exactly as before —
-- no analyst firm publishes credible per-country e-invoicing
-- implementation costs, which the 12 Aug evidence audit went and
-- confirmed across ten of them. Splitting a placeholder in two does not
-- promote it to a benchmark, and the help text says so in both rows.
--
-- WHY DEACTIVATE RATHER THAN DELETE cost_per_integration. The row is the
-- audit trail for what the tool used to assume. `active = 0` removes it
-- from getRoiBenchmarks()'s WHERE clause and therefore from the panel,
-- while leaving the history intact — the same reasoning as on_tracker
-- for milestones. Deleting it would erase the evidence that the model
-- ever worked differently.
-- ================================================================

-- ---- 1. retire the single blended rate ----
UPDATE roi_benchmarks SET active = 0 WHERE key = 'cost_per_integration';

-- ---- 2. two rates in its place ----
INSERT OR IGNORE INTO roi_benchmarks
  (key, default_value, unit, evidence_grade, source_url, source_year, is_cost, sort_order, active)
VALUES
  ('cost_per_integration_simple',  10000, 'currency', 'D', NULL, NULL, 1, 20, 1),
  ('cost_per_integration_complex', 20000, 'currency', 'D', NULL, NULL, 1, 21, 1);

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Cost per SIMPLE integration',
  'PLACEHOLDER — a decentralised 4-corner connection',
  'Dan''s practitioner estimate for connecting one billing system to one 4-corner jurisdiction. Not a benchmark: no analyst firm publishes credible per-country e-invoicing implementation costs, which the evidence audit confirmed across ten of them. Replace it with a vendor quote.'
FROM roi_benchmarks WHERE key = 'cost_per_integration_simple';

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Cost per COMPLEX integration',
  'PLACEHOLDER — a CTC or 5-corner connection',
  'Dan''s practitioner estimate for connecting one billing system to one CTC or 5-corner jurisdiction, where the tax authority is a party to the transaction. Not a benchmark, for the same reason as the simple rate. Replace it with a vendor quote.'
FROM roi_benchmarks WHERE key = 'cost_per_integration_complex';

-- ---- 3. the rule itself, in the panel, where it is being applied ----
-- Namespace 'roi', key help.<inputId> — the ids are cImplS and cImplC, so
-- the keys must be help.cImplS and help.cImplC. Getting that wrong is
-- silent: hlp() renders no marker at all when the row is missing, which is
-- deliberate (better than a ? that rewards a hover with nothing) but does
-- mean a typo here shows up as an absence rather than an error. Caught by
-- counting rendered markers, not by reading. Read by getRoiStrings() and
-- rendered into the `?` tooltip beside the label. Delete-then-insert so
-- re-running updates rather than silently keeping a stale draft.
DELETE FROM translations WHERE namespace = 'roi' AND lang = 'en'
  AND key IN ('help.complexity','help.integrations','help.cImpl',
              'help.cImplS','help.cImplC','help.nomandate');

INSERT INTO translations (namespace, key, lang, value) VALUES

('roi', 'help.complexity', 'en',
 'Stored against each country in the tracker database and hand-assigned, not guessed from prose — until 12 August 2026 it was inferred by keyword match, which silently mis-scored nine countries with real mandates as having none. The dividing line is whether the tax authority is a party to the transaction. COMPLEX means a CTC in any form — clearance, pre-validation, or invoice-level data reported to the authority — or a 5-corner model where the exchange network also reports; assume the higher integration rate. SIMPLE means decentralised 4-corner exchange only: structured invoices move between accredited access points and the authority is not involved; most B2G-only Peppol regimes sit here. NO MANDATE means there is nothing you are obliged to build. Complexity sets the integration rate and the phase durations, so changing your country selection moves the cost and the timeline together.'),

('roi', 'help.integrations', 'en',
 'Derived, not entered: every country you have to build for, counted once per ERP or billing system, priced at the simple or complex rate for that country. Countries with no mandate are included only if you select them, on the basis that you are choosing to roll out there rather than being compelled to. Note what this deliberately does NOT model: economies after the first few countries. Real programmes get them and this does not, which makes the figure conservative. Treat it as a first-cut sizing to replace with a vendor quote, not as an estimate.'),

('roi', 'help.cImplS', 'en',
 'One-off cost to connect one billing system to one SIMPLE jurisdiction — a decentralised 4-corner exchange, where you register with an access point and send structured invoices, and the tax authority is not in the loop. A placeholder, not a benchmark. The evidence audit on this site checked Forrester, Gartner, IDC, Hackett, Ardent, Spend Matters and the Big Four: none publishes a credible per-country e-invoicing implementation cost. Put your own quote in.'),

('roi', 'help.cImplC', 'en',
 'One-off cost to connect one billing system to one COMPLEX jurisdiction — a CTC or 5-corner regime, where invoices are cleared, pre-validated or reported to the tax authority. The premium over the simple rate covers authority certification or accreditation, response and error handling, status reconciliation, and the local field-level requirements that clearance regimes impose. A placeholder, not a benchmark, for the same reason as the simple rate.'),

('roi', 'help.nomandate', 'en',
 'Jurisdictions you have selected that carry no e-invoicing obligation today. They are costed at the simple rate, on the basis that with no mandate to comply with there is nothing beyond a straightforward connection to build. Drop them from your selection if you have no intention of rolling out there. On the timeline they sit in the NO FIXED DEADLINE band, which they share with a second and quite different group: countries whose mandate is already fully in force with no further dated step. Both have no deadline to back-plan from, which is why they are drawn forward rather than backwards from a date. They still start where contracting ends, not today: no country track can begin before the platform is procured and signed — but only the first group is genuinely optional. The second is marked IN FORCE, because if you have not built there yet you are not early, you are late.');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- The old benchmark is retired and both replacements exist at the rates
-- Dan set. Asserting the VALUES rather than the row count matters here:
-- the planner was understating its own default one-off cost by half
-- before this split, and a row that exists at the wrong number looks
-- exactly like a row that exists at the right one.
--
-- ASSERT: SELECT active FROM roi_benchmarks WHERE key = 'cost_per_integration' = 0
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'cost_per_integration_simple' = 10000
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'cost_per_integration_complex' = 20000
-- ASSERT: SELECT count(*) FROM roi_benchmark_translations WHERE lang = 'en' AND benchmark_id IN (SELECT id FROM roi_benchmarks WHERE key LIKE 'cost_per_integration_%') = 2
