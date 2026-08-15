-- ================================================================
-- The dead-data sweep. Recommendation 1, finally run.
--
-- Dan: "please can you address - The dead-data sweep now has twelve
-- orphaned keys waiting for it, which is the largest that list has been."
--
-- Twelve when that was written; THIRTY-THREE by the time it ran, because
-- migrations 540-544 restructured the page around them. That growth is
-- the argument for the sweep rather than against it: every one was left
-- deliberately, by a migration that said so, and the list still tripled
-- in a day. Restraint kept them findable; it was never going to clean
-- them.
--
-- WHAT THE SWEEP ACTUALLY CHECKED. Three tables, one question each --
-- does any renderer read this row? -- across all six source files:
--
--   translations, 'roi'   278 rows   33 unread
--   roi_phases              7 rows    0 unread
--   roi_benchmarks         26 rows    0 unread that are still active
--                                     (3 inactive and unread, correctly
--                                      retired by 511, 524 and 534)
--
-- The two clean tables matter as much as the dirty one. "Retire, don't
-- delete" has been working exactly as designed on benchmarks, and phases
-- have never drifted because every row is reached through PHASE_INPUT
-- rather than by name.
--
-- ---- THE DETECTOR WAS WRONG TWICE BEFORE IT WAS RIGHT ---------------
--
-- Worth recording, because a sweep that trusts a bad detector deletes
-- live content. The first version reported all 25 help keys and 4 of the
-- 7 phases as dead. Both were false:
--
--   * help rows are read through hlp(id) after the "help." prefix is
--     stripped, and 26 of the 32 call sites use double quotes while the
--     regex only matched single. Deleting on that evidence would have
--     removed every tooltip on the page.
--   * phases are reached through the PHASE_INPUT map, never by literal,
--     so searching the source for their key finds nothing.
--
-- Both were caught by disbelieving a result that was too convenient. A
-- sweep is only as good as the question it asks.
--
-- ---- THREE ROWS WERE NOT DEAD, THEY WERE STRANDED -------------------
--
-- The whole point of doing this by hand. `tag.tangible`, `tag.intangible`
-- and `subs.locked` were unread because the RENDERER HARDCODED THEIR
-- ENGLISH -- nine literal tag spans and one signed-out hint -- exactly
-- the gap migration 544 closed for `tag.saved`. They are wired up in this
-- change rather than deleted: the row was right and the code was wrong,
-- and a mechanical sweep would have deleted the evidence and left the
-- bug.
--
-- That is nine hardcoded English strings found and fixed in two days. Any
-- future i18n work now starts from a page whose D1 layer is real.
--
-- ---- AND ONE THING THE SWEEP REVEALED BY ACCIDENT -------------------
--
-- The `roi` namespace holds 278 rows in ENGLISH ONLY. No es, de or fr.
-- The whole t()/tj() apparatus, the character-identical fallback test and
-- the COALESCE-per-column reads are in place and carrying one language.
-- Not a defect -- the machinery is what makes translation a data job
-- later -- but anyone estimating that work should know the ROI page is a
-- greenfield 248 rows, not a partial translation to finish.
--
-- ---- WHAT IS DELETED, AND WHY DELETED RATHER THAN RETIRED -----------
--
-- 30 rows, every one a string the page rendered until a dated migration
-- stopped using it. They describe a structure that no longer exists: a
-- Direct section and an Indirect section (536-539), a section 5 for
-- investment (540), a bridge note carrying figures the grid now shows
-- (544), and four generations of one savings lede.
--
-- `translations` has no `active` column, so retirement is not available
-- the way it is for benchmarks -- and adding one to hold thirty dead
-- strings would be schema for hoarding. The text is not lost: every row
-- below was inserted by a migration in this directory, under a comment
-- explaining why, and git holds all of it. THAT is the audit trail the
-- convention exists to protect, and it survives deletion intact.
-- ================================================================

DELETE FROM translations WHERE namespace = 'roi' AND key IN (
  'menu.label',
  'res.annualRun',
  'res.complianceOnly',
  'res.complianceOnly3',
  'res.direct',
  'res.inScope',
  'res.indirect',
  'res.indirectWhy',
  'res.indirectWhy2',
  'res.tangible',
  'row.directTotal',
  'sec.direct',
  'sec.direct.lede',
  'sec.indirect',
  'sec.indirect.lede',
  'sec.invest',
  'sec.savings.lede',
  'sec.savings.lede2',
  'sec.savings.lede3',
  'sec.savings.lede4',
  'sec.summary',
  'sum.bridge',
  'sum.bridge2',
  'sum.bridge3',
  'sum.bridge4',
  'sum.bridge5',
  'sum.scopeBoth3',
  'sum.scopeBoth4',
  'tag.direct',
  'tag.indirect'
);

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' = 248
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('sec.direct','sec.indirect','sec.invest','sec.summary','sum.bridge','tag.direct') = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('tag.tangible','tag.intangible','subs.locked') = 3
--
-- The three stranded rows must survive, because they are the sweep's
-- actual finding: rows that looked dead because the code was wrong.
-- Deleting them later "for tidiness" would restore the hardcoded English
-- and undo migration 544's argument in the same stroke.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('tag.tangible','tag.intangible','tag.saved','tag.notSaved','subs.locked') = 5
--
-- ---- and the bridge invariant, inherited from 540 and 542 ----------
-- Both files carried a standing invariant that the run-cost bridge stays
-- stated. 544 moved the bridge from the summary note onto the One-off
-- stat and this file deletes the note keys, so those invariants could no
-- longer hold where they stood -- and could not simply be repointed,
-- because an ASSERT ALWAYS is checked at its own migration's position in
-- the chain, where `res.running*` does not yet exist. The invariant is
-- therefore inherited here, at the first file where the keys it names
-- are present. Same rule, new home:
--
--   annual saving, less platform fees, less internal run cost, is net
--   annual saving -- and all three of those must be on the page, or the
--   reader is back to the gap Dan found in section 4.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('res.running','res.running2','res.running3') = 3
--
-- And the reason this sweep should not need running twice.
-- tests/roi-i18n.mjs reported unused keys and never failed on them --
-- deliberately, so that content was never deleted to make a number look
-- round. That was the right call while the list was long and the answer
-- was judgement. It is the wrong call now: the list is empty, keeping it
-- empty costs nothing, and a future orphan is a signal at the moment it
-- appears rather than a line in a report nobody reads. The check now
-- FAILS, names the keys, and says how to record a deliberate exception.
