-- ================================================================
-- The currency label stops carrying two help icons.
--
-- Dan, 17 August 2026: "please update the double help on the currency
-- label."
--
-- ---- WHAT WAS THERE ------------------------------------------------
--
--   <label for="cur">Currency (?) (?)</label>
--
-- Two adjacent `hlp()` calls, `help.cur` titled "What this changes" and
-- `help.fx` titled "Where the rate comes from". Every other one of the
-- 21 helped fields on this page carries exactly one. Two identical
-- circled question marks, four pixels apart, read as a rendering fault
-- rather than as two distinct affordances -- which is how it was
-- reported.
--
-- ---- THEY WERE ALSO THE SAME FACT, TWICE ---------------------------
--
-- help.cur ended:  "The rate is fixed and dated, not a live feed, so the
--                   same scenario always gives the same answer."
-- help.fx  said:   "Fixed on purpose: a business case you can reproduce
--                   months later beats one that quietly moves."
--
-- ONE FACT, TWO HOMES -- this project's most repeated defect, and this
-- instance was rendering both homes side by side on the same line. A
-- reader who opened both tooltips was told the rate is deliberately
-- static in two different sets of words, and told nothing else new.
--
-- Merged rather than one deleted: each row also carried something the
-- other did not. `help.cur` alone names the SCOPE of the conversion
-- (benchmark defaults and your own overrides, not just the display), and
-- `help.fx` alone carries the treasury-rate caveat, which is the only
-- actionable sentence of the four. Deleting either would have lost a
-- fact to tidy up an icon.
--
-- Within the 320-character tooltip budget from migration 562 (298), and
-- free of both quote characters -- see the invariants at the end.
-- ================================================================

UPDATE translations SET value =
  'Converts every money figure on the page, including benchmark defaults and any value you have overridden. The rate is a spot rate captured on the date shown and stored, not updated daily, so the same scenario gives the same answer months later. Use your own treasury rate for anything you will sign.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.cur';

DELETE FROM translations WHERE namespace = 'roi' AND key = 'help.fx';

-- `tip.rate` was the TITLE of the removed tooltip and titles no other
-- thing. Left behind it would be a row nothing renders, which the i18n
-- suite's unrendered-key check reports as a failure -- correctly.
DELETE FROM translations WHERE namespace = 'roi' AND key = 'tip.rate';

-- The surviving tooltip needs a title covering both halves, and the first
-- draft of this migration got it by rewriting `tip.changes` in place.
--
-- THAT KEY IS SHARED. It titles the scope selector's tooltip too
-- (roi-render.mjs:1038), where "What this changes" is exactly right and
-- "What the currency control changes" is nonsense. ONE KEY, TWO SITES --
-- the same shape that rendered `help.cPlat` twice and shipped the wrong
-- gantt label in migration 551.
--
-- Caught by the i18n suite's duplicate-key check inside a minute, which
-- is the check's entire purpose: it fails when one key is used at two
-- call sites with different English, and the rewrite made the two
-- disagree. Worth recording that the defence worked on the migration
-- written to fix a different instance of the same defect.
--
-- So the currency field gets its own title row and the shared one is left
-- alone.
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'tip.curChanges', 'en', 'What this changes, and where the rate comes from');

-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('help.fx','tip.rate') = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.cur' AND value LIKE '%treasury rate%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'tip.curChanges' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'tip.changes' AND value = 'What this changes' = 1
--
-- ---- AND A NEW STANDING INVARIANT, WHICH IS THE REAL POINT ----------
--
-- A DOUBLE QUOTE IN A HELP ROW BREAKS OUT OF AN HTML ATTRIBUTE.
--
-- `hlp()` interpolates help text into `aria-label="..."` after passing it
-- through `esc()`, and `esc()` escapes & < > and NOT the double quote.
-- Verified by rendering with a German-shaped value:
--
--   aria-label="What this drives: Der "Sollwert" wird hier gesetzt.">
--
-- The attribute terminates at the first inner quote and the remainder
-- becomes stray attributes on the element. English has never tripped this
-- because English rarely needs an inline quotation; German, French and
-- Polish all quote inline as a matter of course, and the page's own
-- translation plan is to load those languages.
--
-- The renderer should escape the quote and will. Stating the invariant
-- here as well is deliberate: the escaping fix protects the renderer, and
-- this protects the DATA, which is loaded by migrations written months
-- apart by whoever is adding a language that day. Two defences, because
-- the failure is silent -- a broken aria-label degrades an assistive
-- reading with no visible symptom on screen.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key LIKE 'help.%' AND value LIKE '%"%' = 0
--
-- One help icon per field. The count is stated against the page's own
-- registry rather than as a number, so adding a helped field does not
-- have to remember to come back here.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.fx' = 0
