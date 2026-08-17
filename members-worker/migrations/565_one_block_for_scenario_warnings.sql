-- ================================================================
-- The scenario warnings become one block, and the rule behind them is
-- written down.
--
-- Dan, looking at the "Corrections applied during verification" note at
-- the end of the caveats panel: "Does it make sense for all
-- notifications to appear at the end of Assumptions, sources and caveats
-- section?"
--
-- ---- NO, AND THE REASON IS THAT THEY ARE TWO DIFFERENT THINGS -------
--
-- CONDITIONAL, about the reader's scenario. They fire on this reader's
-- inputs, change from run to run, and each says "this answer has a
-- problem you can act on":
--
--   N fields still hold our numbers rather than yours
--   N jurisdictions have obligations earlier than this plan schedules
--   the tax-effort cap is binding
--   N pinned start dates finish after the deadline
--   N of M waves back-plan to a start date already past
--
-- STATIC, about our method. It never changes and describes what we found
-- when we checked our own sources:
--
--   Corrections applied during verification
--
-- The second is already in the right place: the caveats panel is where
-- someone auditing the page goes, and that note is only interesting to
-- them. THE FIRST GROUP CANNOT GO THERE, because that panel is a
-- <details> COLLAPSED BY DEFAULT. "Your plan schedules three countries
-- after their real deadline" behind a click nobody makes is the defect
-- migration 513 fixed by pulling the fixed-rate warning out of a
-- tooltip, and 540 fixed again by moving the placeholder caveat above
-- the numbers it qualifies. Twice is enough.
--
-- ---- WHAT WAS ACTUALLY WRONG ----------------------------------------
--
-- Dan's instinct was right, just not about the panel. On a wide
-- selection THREE red blocks stacked under the executive summary before
-- the reader reached a sentence of explanation, and a fourth lived on
-- the wave chart, and one of the three was rendered by a different
-- mechanism in a different place from the other two. Five notifications,
-- three locations, no stated rule.
--
-- So: the placeholder warning stops being special and joins the guard
-- list -- it is the same kind of statement and was only separate for
-- historical reasons -- and the group renders as ONE block headed with
-- the count. The existence and number of problems stays visible above
-- the fold; the detail opens in place rather than a scroll away.
--
-- The wave-chart warning deliberately stays on the chart. It is about
-- the thing it sits next to, and that is the rule: a warning about your
-- scenario appears beside what it affects; a note about our method lives
-- in the caveats panel.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'guard.heading', 'en', '{0} {1} to check before you use these figures'),
  ('roi', 'guard.placeholders', 'en', '<strong>{0} fields still hold our numbers rather than yours.</strong> Replace them with vendor budgetary estimates in the assumptions panel, and treat the ROI as illustrative until actuals can be provided.'),
  ('roi', 'word.thing', 'en', 'thing'),
  ('roi', 'word.things', 'en', 'things');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('guard.placeholders','guard.heading','word.thing','word.things') = 4
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'guard.heading' AND value LIKE '%{0}%{1}%' = 1
--
-- The heading must keep both slots. A count with no noun reads as a
-- score, and a noun with no count defeats the whole change -- the point
-- of grouping was that the number of problems stays visible when the
-- detail is folded away.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'guard.heading' AND value LIKE '%{0}%' = 1

-- ---- and the corrections note is retired ---------------------------
--
-- Dan, on seeing it: "Can you just remove this message altogether."
--
-- It read "Corrections applied during verification..." and listed three
-- fixes made when the sources were checked: the VAT-gap figures
-- re-attributed from OECD to the European Commission, two national
-- start figures corrected, and a "reduced penalty exposure" claim pulled
-- from the HMRC attribution because the word does not appear in that
-- consultation.
--
-- It was honest and it was the right instinct -- and a reader does not
-- need it. IT IS A CHANGELOG ENTRY, not a caveat: it describes work done
-- to the page rather than anything about the reader's business case, and
-- the three corrections it names are all ALREADY REFLECTED in the
-- figures and citations it sits beneath. A reader auditing the VAT row
-- finds the European Commission attribution on the row itself.
--
-- The provenance is not lost. It is in the migration that made each
-- correction and in PROGRESS.md, which is where someone asking "what did
-- you change and why" would actually look -- and unlike a page note,
-- those cannot go stale, because they are dated records rather than a
-- standing claim.
DELETE FROM translations WHERE namespace = 'roi' AND key = 'notes.corrections';

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'notes.corrections' = 0

-- `res.placeholders2` and `res.placeholders2b` were the two halves of the
-- warning when the summary rendered it directly. It is one string in the
-- guard list now.
DELETE FROM translations WHERE namespace = 'roi' AND key IN ('res.placeholders2','res.placeholders2b');

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('res.placeholders2','res.placeholders2b') = 0
