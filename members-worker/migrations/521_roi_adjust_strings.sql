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
  ('roi', 'adjust.title', 'en', 'Adjust the plan'),
  ('roi', 'adjust.inforce', 'en', 'in force \u00b7 no further date'),
  ('roi', 'adjust.nodeadline', 'en', 'no deadline'),
  ('roi', 'adjust.undated', 'en', 'No fixed deadline &middot; startable once contracting completes'),
  ('roi', 'chart.anytime', 'en', 'ANY TIME'),
  ('roi', 'chart.clamped', 'en', 'CLAMPED'),
  ('roi', 'chart.inforce', 'en', 'IN FORCE'),
  ('roi', 'chart.pinned', 'en', 'PINNED');

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'adjust.%' = 7
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'chart.%' = 4
--
-- And the total, restated: the code falls back to English when a row is
-- missing, so a half-applied INSERT renders a page that looks correct.
-- The count is the only thing that would notice.
--
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key NOT LIKE 'help.%' = 107
