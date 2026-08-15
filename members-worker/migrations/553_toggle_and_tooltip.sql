-- ================================================================
-- The wave tooltip, the headcount split, and one chevron.
--
-- Sixth pass, and the end of what can be moved without a design
-- decision. Three strings, one of which had been hiding in the least
-- likely place on the page.
--
-- ---- THE CHEVRON, AND WHY IT MATTERS MORE THAN ITS SIZE ------------
--
-- The assumptions panel writes its own toggle label in two places: once
-- in the server-rendered HTML, which has used `assumptions.show` from
-- D1 since migration 518, and once in a JavaScript toggle handler, which
-- has been writing 'hide &#9652;' as a literal the whole time.
--
-- So the FIRST render was translated and every render after the reader
-- clicked was not. In a translated build the label would have been
-- correct until the moment it was used, then silently reverted to
-- English and stayed there. That is the hardest class of i18n bug to
-- find by reading: the string exists, the key exists, the key is used,
-- and a second code path quietly writes over it.
--
-- Migration 549 caught the equivalent literal on the notes panel. This
-- is the same defect on the panel next to it, which is what happens when
-- a fix is applied to the instance rather than to the pattern. Both are
-- now the same two keys.
--
-- ---- AND THE PLURAL COUNT REACHES SIXTEEN --------------------------
--
-- `word.jur`/`word.jurs`. Sixteen plural rows now, eight nouns. Every
-- one replaced a ternary on n===1 that only worked in English.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'chart.waveTip', 'en', 'Wave {0} — {1}, {2}w effort, {3}w elapsed{4}'),
  ('roi', 'word.jur', 'en', 'jurisdiction'),
  ('roi', 'word.jurs', 'en', 'jurisdictions'),
  ('roi', 'chart.acrossLanes', 'en', ' across {0} lanes'),
  ('roi', 'notes.headcountSplit', 'en', '{0} of {1}, or {2}%; the rest is review, technology and overhead.');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('assumptions.show','assumptions.hide') = 2
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'chart.waveTip' AND value LIKE '%{4}%' = 1
--
-- Both halves of the toggle must exist, because a missing `hide` is
-- exactly the bug this migration fixes wearing different clothes: the
-- label would fall back to the English at the use site and look right to
-- everyone reviewing in English.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('assumptions.show','assumptions.hide','btn.show','btn.hide') = 4
