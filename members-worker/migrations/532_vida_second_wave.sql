-- ================================================================
-- Two waves per EU member state.
--
-- The last substantive recommendation from the design review, and the
-- oldest: an EU member state with a national deadline before July 2030
-- has TWO obligations, and the planner scheduled only the first.
--
-- Germany is the case the review named. A 4-corner exchange build in
-- January 2027, scored SIMPLE. Then ViDA's digital reporting requirement
-- in July 2030, which is COMPLEX. The tool showed the easier, nearer
-- build and hid the harder, later one entirely -- and not just for
-- Germany: FOURTEEN member states are affected, over half of those
-- tracked. Five of them (Estonia, Germany, Luxembourg, Slovenia, and
-- Croatia's neighbours by the same pattern) run a simple regime today
-- and face complex work in 2030, so the hidden wave is not merely later,
-- it is harder.
--
-- WHY THIS IS COMPUTED SERVER-SIDE. It needs `eu_member`. Deriving it in
-- the client from the country tuple sweeps in Norway and the United
-- Kingdom, which sit in the Europe region and are not bound by ViDA at
-- all. That mistake was made on the way in and caught by checking the
-- list against the database rather than eyeballing it -- 16 countries
-- came back where 14 was right.
--
-- WHAT A SECOND WAVE COSTS. Dan's call, from three options offered:
-- half a complex integration. The reasoning is that vendor selection and
-- contracting are already modelled as programme-level and do not repeat;
-- the platform, the ERP connection and the master data exist by 2030.
-- What is genuinely new is the reporting extract, the transmission to
-- the tax authority, and testing it.
--
-- On the EU preset the one-off moves 570,000 -> 710,000 and payback 12
-- -> 15 months. A full second integration each would have been 850,000,
-- which charges twice for a platform bought once; costing it at zero
-- would have shown the date and denied the money. Half is ours and it is
-- grade D, so it is exposed and argued with like every other assumption
-- here rather than buried in the renderer.
--
-- Weights are summed and rounded UP into integration counts. Half an
-- integration is not a thing anyone can buy, and rounding down would let
-- a lone second wave cost nothing.
-- ================================================================

INSERT OR IGNORE INTO roi_benchmarks (key, default_value, unit, evidence_grade, source_url, source_year, is_cost, sort_order) VALUES
  ('vida_second_wave_ratio', 0.5, NULL, 'D', NULL, NULL, 1, 14);

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'ViDA second wave, as a share of a full build', 'Our assumption -- a reporting build on an existing platform',
  'Our assumption, not a benchmark. An EU member state with a national deadline before July 2030 faces a second obligation: Council Directive (EU) 2025/516''s digital reporting requirement. It is modelled at <strong>half</strong> a full country integration, because by then the platform, the access-point connection and the master data already exist, and vendor selection and contracting are modelled once at programme level and do not repeat. What is genuinely new is the reporting extract, the transmission to the tax authority, and testing it. Nothing is claimed for the figure: a full second integration would charge twice for a platform bought once, and zero would show the deadline while denying the work. If your 2027 build already produces a compliant reporting extract, lower it.'
  FROM roi_benchmarks WHERE key = 'vida_second_wave_ratio';

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'wave.vidaSuffix', 'en', '(ViDA)');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'vida_second_wave_ratio' = 0.5
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'wave.vidaSuffix' = 1
--
-- The population this feature exists for, asserted against the data
-- rather than against a number I counted once. An EU member state with a
-- national B2B deadline earlier than the EU-wide one has a second wave;
-- anything else does not. If a future country build changes this set, the
-- count moves and this line says so -- which is the point, because the
-- alternative is a feature that silently stops applying to somebody.
--
-- ASSERT: SELECT count(*) FROM countries c WHERE c.eu_member = 1 AND c.code <> 'EU' AND (SELECT min(m.date) FROM milestones m WHERE m.country_id = c.id AND m.on_tracker = 1 AND m.mandate_scope = 'b2b' AND m.date > '2026-08-15') < '2030-07-01' = 14
--
-- And the standing one. ViDA binds member states; it does not bind the
-- United Kingdom or Norway, both of which sit in this site's Europe
-- region and both of which were wrongly swept in by the first draft of
-- the client-side filter. If a non-member ever acquires eu_member = 1,
-- the second wave would appear for a country ViDA does not reach.
--
-- ASSERT ALWAYS: SELECT count(*) FROM countries WHERE eu_member = 1 AND code IN ('GB','NO','CH','IS','LI','TR','RS','UA') = 0
