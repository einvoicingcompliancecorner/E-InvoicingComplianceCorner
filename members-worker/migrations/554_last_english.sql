-- ================================================================
-- The last ten: evidence bodies, source labels, and the discretionary
-- band's tooltips. The ROI page's visible English is now all in D1.
--
-- ---- WHAT THESE WERE, AND WHY THEY WERE LAST ------------------------
--
-- Three are the SYNTHETIC evidence entries. Most of the page's evidence
-- tooltips are built by cite(), which reads a benchmark's citation,
-- source year and URL straight from D1 -- so they were already
-- translatable. Three keys have no benchmark row behind them at all:
-- `durations` (phase estimates), `yours` (the reader's own assumption)
-- and `site` (the tracker itself). Those three carried their prose as
-- object literals in the renderer, sitting in the middle of a structure
-- where every neighbour was D1-backed, which is the best possible
-- camouflage.
--
-- One is the word "source" -- the link text at the end of every evidence
-- tooltip that has a URL. It appears on roughly twenty tooltips and was
-- written once, inside cite(), as part of an HTML string.
--
-- Three are source descriptions in the PDF's figures table that contain
-- actual words rather than only proper nouns: "HMRC / DBT consultation",
-- "Our assumption, capped by Ardent exception gap", "ATO / Deloitte task
-- times". The organisation names beside them -- "Ardent Partners 2025",
-- "US BLS OEWS + ECEC", "APQC Open Standards Benchmarking" -- are left
-- alone deliberately: they are names, and a translated name is a wrong
-- citation.
--
-- The rest are the discretionary band's two tooltips.
--
-- ---- AND A DETECTOR CORRECTION -------------------------------------
--
-- `source_year` was reporting as hardcoded. It is not: "2025 data",
-- "2016 estimates" and "updated Jan 2026" are D1 column values, and the
-- stub was not replacing them because the harness only stubbed label,
-- hint and citation. Fixed in the harness rather than by adding rows.
-- Third time the detector has been wrong in the direction of alarm,
-- against zero times in the direction of comfort -- which is the right
-- way round for a tool whose output drives deletions and edits.
--
-- ---- WHERE THIS LEAVES THE WORK ------------------------------------
--
-- The inventory in tests/roi-hardcoded.mjs is empty. Every string a
-- reader sees on the ROI planner now comes from the database, and the
-- suite fails if that stops being true.
--
-- That is NOT the same as the page being translatable, and the
-- distinction matters: 278 rows exist in English only, the plural rules
-- encoded here are two-form (correct for English, German, Spanish and
-- French; wrong for Polish and Arabic), and no date or number formatting
-- has been localised at all. What is finished is the extraction. What
-- remains is translation, and it is now a data job rather than a code
-- job -- which was the entire point.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'ev.sourceLink', 'en', 'source'),
  ('roi', 'ev.durations.body', 'en', 'Phase durations are practitioner estimates for a country rollout once a platform is in place, held in D1 and editable above. No analyst firm publishes credible per-country e-invoicing implementation durations &mdash; this was checked.'),
  ('roi', 'ev.yours.body', 'en', 'Your assumption. Nothing is claimed for this figure &mdash; it is exposed so the model can be argued with rather than believed.'),
  ('roi', 'ev.site.body', 'en', 'Live mandate data from this site&rsquo;s own tracker: status, model and dated deadlines per jurisdiction, each traceable to the cited legal instrument on that country&rsquo;s deep dive.'),
  ('roi', 'chart.discTip', 'en', '{0} with no fixed deadline{1}. Indicative placement only — nothing can start before contracting completes, and there is no date to work back from.'),
  ('roi', 'chart.someInForce', 'en', ', some already in force'),
  ('roi', 'chart.discRowTip', 'en', '{0} weeks. Indicative placement only: there is no fixed deadline, so this can move — but it cannot start before contracting completes.'),
  ('roi', 'src.hmrcDbt', 'en', 'HMRC / DBT consultation 2025'),
  ('roi', 'src.cappedAssumption', 'en', 'Our assumption, capped by Ardent exception gap'),
  ('roi', 'src.atoTaskTimes', 'en', 'ATO / Deloitte task times');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('ev.sourceLink','ev.durations.body','ev.yours.body','ev.site.body') = 4
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'src.%' = 3
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('chart.discTip','chart.discRowTip','chart.someInForce') = 3
--
-- The three synthetic evidence bodies are the ones to protect. Every
-- other tooltip on the page is generated from a benchmark row, so a
-- missing citation is visible as a gap; these three are constructed in
-- code, and if their rows vanish the tooltip renders the English
-- fallback silently and looks entirely correct to anyone reviewing in
-- English. That is the whole class of bug this work exists to remove.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('ev.durations.body','ev.yours.body','ev.site.body') = 3
