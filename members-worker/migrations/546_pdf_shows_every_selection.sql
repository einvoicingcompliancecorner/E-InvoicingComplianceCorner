-- ================================================================
-- The PDF stops omitting jurisdictions the reader selected.
--
-- Dan: "please can you update the pdf output to include all countries
-- that are checked. Where no mandate exists and no date has been defined
-- you can either accept the pinned date, or say not yet defined, if the
-- date is not pinned."
--
-- WHAT WAS WRONG, and it is worse than a missing table row. The PDF's
-- wave table was built from WAVES, which holds only back-planned waves --
-- so a selected jurisdiction with no dated deadline appeared NOWHERE on
-- the printed plan. It was still selected, still costed at the simple
-- rate, still inside the one-off total on page 1. At the EU preset that
-- is SIXTEEN of thirty-two jurisdictions: half the selection paid for and
-- invisible.
--
-- The interactive page always showed them -- a discretionary band on the
-- chart and a note under the table. The PDF is the artefact that leaves
-- the building, and it was the one that dropped them. That is the same
-- shape as the "one fact, two homes" problem in the design review: two
-- renderings of one model, and only one of them complete.
--
-- HOW THEY ARE SHOWN, per Dan's two cases:
--
--   pinned      the date the reader chose, marked "pinned", one row each
--               -- they pinned it deliberately and the whole point is to
--               see it. If the pin is earlier than contracting completes
--               it is clamped, exactly as the chart clamps it, and the
--               row says "(moved to earliest)" rather than printing a
--               date the plan does not actually use.
--   not pinned  one shared row reading "Not yet defined", jurisdictions
--               listed and truncated past six, the same shape the dated
--               waves use.
--
-- ONE ROW EACH FOR THE UNPINNED WAS TRIED FIRST AND DID NOT FIT: sixteen
-- single-line rows took page one to 307mm against A4's 271mm, and the
-- two-page guarantee is not negotiable -- migration 531 exists because a
-- three-page "one-pager" is not a one-pager. Grouping them also matches
-- what the chart does when collapsed, so the two renderings agree again.
--
-- A note under the table names the count and says what the dates mean:
-- a planning choice rather than an obligation. Without it, "Not yet
-- defined" beside a start date reads like an oversight.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'pdf.nodate',      'en', 'Not yet defined'),
  ('roi', 'pdf.pinned',      'en', 'pinned'),
  ('roi', 'pdf.clamped',     'en', '(moved to earliest)'),
  ('roi', 'pdf.undatedNote', 'en', 'selected jurisdictions have no mandated go-live. They are costed and scheduled; any date shown for them is a planning choice, not an obligation.');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('pdf.nodate','pdf.pinned','pdf.clamped','pdf.undatedNote') = 4
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'pdf.undatedNote' AND value LIKE '%planning choice%' = 1
--
-- The invariant is completeness, and it is the reason this migration
-- exists at all: what the reader selected and what the PDF prints must be
-- the same set. It cannot be asserted in SQL -- the selection is a
-- browser state and the PDF is built client-side -- so it is checked in
-- tests/roi-regression.mjs against a real rendered document, counting
-- jurisdictions in the printed table against boxes ticked on the page.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('pdf.nodate','pdf.undatedNote') = 2
