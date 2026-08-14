-- ================================================================
-- Fix a literal · that reached production as text.
--
-- Dan, testing the adjust panel: Ecuador's wave column read
-- "in force · no further d" — a broken escape AND a clipped
-- <select>, which together looked like a rendering failure.
--
-- The cause was mine and it is worth naming precisely, because the
-- assertion mechanism could not have caught it: 521's checks assert that
-- these rows EXIST and how many there are. Nothing asserts that a
-- string's CONTENT is well-formed, and "the row is present" was true the
-- whole time. A count is not a proofread.
--
-- The escape came from the script that generated 521 from the code's
-- inline fallbacks: it emitted the JavaScript source escape rather than
-- the character, so both the fallback and the row carried the same wrong
-- six characters. Both are corrected — the code in the same commit, this
-- row here — and they still match, which tests/roi-i18n.mjs asserts.
--
-- UPDATE rather than INSERT OR IGNORE: 521 already applied, so the row
-- exists and an INSERT would decline silently. That is the exact shape
-- that hid this for a deploy cycle.
-- ================================================================

UPDATE translations SET value = 'in force &middot; no further date'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'adjust.inforce';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT value FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'adjust.inforce' = 'in force &middot; no further date'
--
-- And a standing one, because this class of defect is invisible to a row
-- count and trivial to reintroduce from any generator that writes source
-- escapes instead of characters.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND value LIKE '%\u00%' ESCAPE '~' = 0
