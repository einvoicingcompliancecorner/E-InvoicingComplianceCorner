-- ================================================================
-- ROI planner: strings for the sanity guards and the adjust panel.
--
-- Migration 518 made the planner's text a pure INSERT job. This is the
-- first change to collect on that: a new feature, and its copy arrives
-- as rows rather than as edits scattered through a 1,300-line module.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'adjust.hint', 'en', 'Move a country to a different wave, or pin its own start date. The chart and the elapsed figures redraw from your changes; nothing else on the page moves.'),
  ('roi', 'adjust.note', 'en', 'Changes live in this page only &mdash; nothing is saved, and reloading restores the back-planned schedule. A country you move later than its own deadline stays visible and is called out above, because a plan that misses a date is a decision rather than an error.'),
  ('roi', 'adjust.reset', 'en', 'Reset to the computed plan'),
  ('roi', 'adjust.title', 'en', 'Adjust the plan');

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('adjust.hint', 'adjust.note', 'adjust.reset', 'adjust.title') = 4
--
-- And the invariant 518 established, restated against the new total so
-- a half-applied INSERT is caught rather than rendering an unlabelled
-- panel: the code falls back to English, so nothing would look wrong.
--
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key NOT LIKE 'help.%' = 100
