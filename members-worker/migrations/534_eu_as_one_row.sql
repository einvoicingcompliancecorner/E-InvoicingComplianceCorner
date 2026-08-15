-- ================================================================
-- The European Union becomes one row in the planner.
--
-- Dan: "the inclusion of the earlier twowave fix to introduce ViDA for
-- each EU country is too messy. We have a European Union country listed
-- on the main side menu. Would it be possible and made more sense to
-- simply have an European Union region placeholder in the wave planner,
-- which effectively represents any EU country."
--
-- He is right, and this is the planner catching up with a decision the
-- rest of the site took months ago. MIGRATION 504 collapsed eleven
-- per-country ViDA 2030 cards into the single European Union entry on
-- the arrivals board, on exactly this reasoning: ViDA is ONE EU fact, not
-- twenty-seven national ones. The planner went the other way -- it
-- filtered the EU row out and redistributed its date to member states --
-- and migration 532 doubled down by giving fourteen of them a second
-- row each, putting 27 rows in one wave.
--
-- IT ALSO FIXES SOMETHING CONCEPTUALLY ODD that had been papered over.
-- Austria appeared in the plan as a country with a 2030 deadline, when
-- Austria has no national mandate at all -- so the chart had to print
-- "EU-WIDE" beside it to explain why it was there. Under a single EU row
-- that explanation is unnecessary, because the row IS the EU.
--
-- WHAT IT COSTS. Dan's choice from four costed options, and the only one
-- needing no new assumption: ONE COMPLEX BUILD PLUS A SIMPLE CONNECTION
-- PER MEMBER STATE. ViDA's payload is harmonised -- one EN 16931-based
-- dataset, one ruleset -- so the reporting extract is built once, at the
-- complex rate. Each member state runs its own reporting endpoint, so
-- you connect to each, at the simple rate. It reuses the model's
-- existing rates instead of inventing a ratio, and `vida_second_wave_ratio`
-- from 532 is retired here rather than left active with nothing reading
-- it -- which is the dead-data pattern this project has now found five
-- times.
--
-- A CORRECTION DAN MADE MID-BUILD, and the reason the numbers moved. The
-- first attempt dropped member states with no national deadline from the
-- plan entirely, on the grounds that the EU row represented them. Dan:
-- "an EU country with no national mandate can still be added to the
-- planner, just with no current fixed date. We can implement eInvoicing
-- in those countries directly between two peers."
--
-- That is right, and the two are different builds rather than one counted
-- twice: a voluntary four-corner exchange with your trading partners in
-- Austria is not the ViDA reporting connection to the Austrian tax
-- authority in 2030. The first is optional and undated; the second is
-- neither. Austria therefore appears in the discretionary band AND is
-- covered by the European Union row, and is costed for both.
--
-- EU preset: one-off $710,000 -> $770,000, and the chart 470px -> 386px.
-- The money barely moved; what changed is that it is now named correctly
-- -- roughly $130,000 of optional peer-to-peer builds and $280,000 of
-- ViDA reporting, where before it was one undifferentiated $400,000 of
-- per-country tracks.
--
-- The discretionary band collapses too, so grouped mode is consistently
-- one row per group.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'wave.members',  'en', 'MEMBER STATES'),
  ('roi', 'wave.jur',      'en', 'JURISDICTION'),
  ('roi', 'wave.jurs',     'en', 'JURISDICTIONS'),
  ('roi', 'chart.nofixed', 'en', 'NO DATE');

-- ---- what 532 left behind ------------------------------------------
-- Retired, not deleted: the row keeps its reasoning and its grade, and
-- stops claiming to be live. An active benchmark nothing renders is
-- exactly what platform_cost_year, btn.recalculate and the two orphaned
-- Ardent figures were.
UPDATE roi_benchmarks SET active = 0 WHERE key = 'vida_second_wave_ratio';
DELETE FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'wave.vidaSuffix';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT active FROM roi_benchmarks WHERE key = 'vida_second_wave_ratio' = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'wave.vidaSuffix' = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'wave.%' = 3
--
-- The European Union row exists because eu-drr does. If that milestone
-- were ever taken off the board or re-dated, the planner would lose its
-- only EU obligation silently -- there is no other row carrying it, which
-- is the whole point of migration 504 and the whole risk of it.
--
-- ASSERT ALWAYS: SELECT count(*) FROM milestones m JOIN countries c ON c.id = m.country_id WHERE c.code = 'EU' AND m.id = 'eu-drr' AND m.on_tracker = 1 AND m.mandate_scope = 'b2b' AND m.obligation_status = 'live' = 1
--
-- And the reason the EU row can represent member states at all: every one
-- of them must be flagged, or the planner would quietly cover fewer
-- countries than the reader selected.
--
-- ASSERT ALWAYS: SELECT count(*) FROM countries WHERE eu_member = 1 AND code <> 'EU' = 27
