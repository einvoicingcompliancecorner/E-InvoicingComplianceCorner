-- ================================================================
-- Three notes leave the main page, and a live defect I shipped in 551.
--
-- Dan, on the commentary under the savings table: "I think overcrowds the
-- main roi-calculator page, and I think should reside in assumptions,
-- sources and caveats". And separately, on the chart's critical-path
-- line: "I think this comment can be removed altogether".
--
-- ---- THE TWO NOTES WERE DUPLICATES, NOT JUST CLUTTER ----------------
--
-- Better than a relocation. Both already had a card in the panel saying
-- more:
--
--   the headcount note      -> "Headcount restates, it does not add"
--   the tangible/named note -> "What carries no value on purpose"
--
-- So `res.namedWhy` is retired outright: every clause of it was already
-- in the panel, at greater length and with the evidence attached. The
-- headcount note carried ONE thing the panel did not -- the FTE figures,
-- 3.6 keying and 2.1 released -- and those move into the card that
-- already explains them.
--
-- MIGRATION 530 DELIBERATELY KEPT THAT CLAUSE INLINE, on the reasoning
-- that "without it this is a double count, and it is the first thing a
-- finance committee would challenge". That reasoning retires with it,
-- and correctly: the double-count risk existed BECAUSE a headcount
-- figure sat on the page beside a money figure. With no headcount on the
-- page there is nothing to double-count, and the figure now sits in the
-- same paragraph as its own caveat rather than one click away from it.
--
-- ---- THE CRITICAL-PATH NOTE ----------------------------------------
--
-- Removed. It fired whenever procurement outran the average wave, which
-- is almost always, so it read as a permanent fixture rather than a
-- finding. The chart already makes the point better: the programme bar
-- runs from today to the first country start, in front of every wave.
--
-- ---- AND A DEFECT THIS EXPOSED, WHICH I SHIPPED IN 551 --------------
--
-- Deleting the note left `chart.procure` with one call site instead of
-- two, and the i18n suite immediately failed on a mismatch that had been
-- live since 551 was deployed.
--
-- Migration 551 added `chart.procure` = "Select &amp; contract" for the
-- gantt's programme bar. THE KEY ALREADY EXISTED, holding "Procurement
-- is your critical path, not delivery." for the note. INSERT OR IGNORE
-- declined in silence, and the chart's programme bar has been rendering
-- a full sentence where a two-word label belongs.
--
-- WHY NO CHECK CAUGHT IT. The i18n suite builds a map of key -> fallback
-- from the call sites. With two sites on one key it kept whichever came
-- last in the file -- the note -- whose English matched D1 exactly. So
-- the character-identical check passed on the wrong pair, and the
-- rendered-strings check could not see it because both strings are
-- legitimately from D1.
--
-- This is migration 522's lesson in a form it had not taken before: not
-- "an UPDATE that should have been an INSERT", but A KEY COLLISION,
-- where the insert was correct and the key was already spoken for. The
-- gantt label is now `chart.procureBar`, and the i18n suite fails on any
-- key used twice with different English.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'chart.procureBar', 'en', 'Select &amp; contract'),
  ('roi', 'notes.headcountFte', 'en', 'In people: {0} FTE keying invoices today, of which {1} are released.');

-- ---- the three keys the page no longer reads ------------------------
DELETE FROM translations WHERE namespace = 'roi' AND key IN (
  'res.headcount.h', 'res.headcount.line', 'res.headcount.line2',
  'res.namedWhy', 'chart.procure', 'chart.procure2', 'chart.procure3'
);

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'chart.procureBar' AND value = 'Select &amp; contract' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('chart.procure2','chart.procure3') = 0
-- (written with an IN list rather than LIKE 'chart.procure_%' because
--  underscore is a single-character wildcard in SQL LIKE, so the pattern
--  also matched `chart.procureBar` -- the row this file adds -- and the
--  assertion failed on its own new key.)
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('res.headcount.h','res.namedWhy','chart.procure') = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.headcountFte' AND value LIKE '%are released%' = 1
--
-- `chart.procure` must stay deleted rather than be re-seeded with the
-- label. Re-using it would work today and reintroduce exactly the
-- collision that caused this: a key whose name suggests two different
-- things to two different authors.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'chart.procure' = 0
--
-- And the FTE figures must stay with the caveat that stops them being
-- read as a second saving. They were split across a page note and a
-- panel card for two weeks; putting them back in one paragraph is the
-- point of this file.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('notes.headcount','notes.headcountFte','notes.headcountSplit') = 3
