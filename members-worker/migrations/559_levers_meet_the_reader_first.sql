-- ================================================================
-- The two largest levers move out of the panel nobody opens.
--
-- Dan: "Given that the 'e-Invoices Received Today' and 'Time to fix an
-- exception' fields are so integral to the business case. I think it
-- makes sense to move these two fields into section 1."
--
-- ---- WHY THIS IS MORE THAN A LAYOUT PREFERENCE ----------------------
--
-- The assumptions panel is a `<details>` element and it is COLLAPSED BY
-- DEFAULT. That is correct for twenty benchmark defaults a reader should
-- only meet if they want to argue with them. It is wrong for these two,
-- and the reason is arithmetic rather than taste:
--
--   eShare   the processing row is (1 - share) x the per-invoice gap.
--            At 0% the row is at its maximum; at 100% it is zero. No
--            other single input on the page can take a row to nothing.
--   errMins  the rework row is minutes x rate x volume x elimination.
--            It is linear in minutes with no cap and no floor.
--
-- So the two inputs with the most leverage over the savings table were
-- the two the reader was least likely to ever see. Both were added in
-- the last three days -- 557 and 558 -- and both inherited the panel
-- because that is where inputs went, not because anyone decided it.
--
-- ---- WHERE THEY GO, AND WHY NOT SIMPLY APPENDED ---------------------
--
-- Section 1 already asks four questions, and all four are about SIZE:
-- how many invoices in, how many out, how many integrations, which
-- currency. These two are about STARTING POSITION -- where you are
-- today, before anything is built. Different question, so a second row
-- with its own label rather than six fields in one undifferentiated
-- grid.
--
-- ---- AND THE CAVEAT THAT WOULD HAVE ROTTED ON THE SPOT --------------
--
-- The needs-you counter read "N of 6 fields BELOW are still our numbers,
-- not yours." The word "below" was true when all six sat under it in the
-- panel. Moving two of them up would have made it false immediately, on
-- a line whose entire job is to tell the reader where to look.
--
-- That is the failure mode this project named on 15 August and hit again
-- on 16 August -- prose that outlives the model it describes, and prose
-- that describes a mechanism that was never built. It renders perfectly,
-- passes every check, and is only detectable by reading it. Catching it
-- inside the same change that would have caused it is the first time
-- that has happened here, and it happened because the failure mode had
-- been written down.
--
-- The counter is therefore REWORDED to name no location, and MOVED to
-- sit under the fields it counts in section 1. Precedent for the move is
-- migration 540, which promoted the placeholder warning out of section 5
-- and into the executive summary on exactly this reasoning: a caveat
-- belongs above the numbers it qualifies, not below them and not inside
-- a panel the reader may never open. It still counts all six, four of
-- which remain in the panel -- so the wording says "wherever they
-- appear" rather than naming a split that a future change would falsify.
--
-- ---- AN ASYMMETRY THE MOVE MADE VISIBLE -----------------------------
--
-- `eShare` carried no evidence chip. Every other graded input on the
-- page carries its A/B/D letter, and `einvoice_share_now` is graded B in
-- D1 -- the chip was dropped by migration 557 when its YOURS tag was
-- removed, and nothing put the grade back. Invisible while the field sat
-- among twenty others; obvious the moment it stood beside `errMins` and
-- its B. Restored here rather than filed, because it is one attribute
-- and the fix is smaller than the note explaining it.
--
-- ---- WHAT IS DELIBERATELY NOT DONE ----------------------------------
--
-- The four cost placeholders stay in the panel. They are vendor
-- estimates a reader replaces once, at the point they are seriously
-- costing a programme, and promoting all six would rebuild in section 1
-- the crowding migration 556 removed from the page. Two inputs and one
-- line is the whole change.
--
-- No arithmetic moves. Every figure on the page is identical before and
-- after; this is entirely about which of them a reader meets.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'input.h.today', 'en', 'Where you are today');

-- "below" is now false for two of the six, and a direction is exactly
-- the kind of word that goes stale silently. Naming no location survives
-- the next move as well as this one.
UPDATE translations SET value =
  '<strong>{0} of {1} figures we need from you are still our defaults.</strong> They are marked wherever they appear, here and in the assumptions panel, and the business case is illustrative until they are set.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'assumptions.needsYou';

-- AND THE ALL-CLEAR STRING HAD THE SAME BUG, which the standing
-- invariant below found on its first run rather than a reader finding it
-- in a month. `assumptions.needsYouDone` ended "the grades BELOW say how
-- far to trust each" -- written when the line sat at the top of the
-- panel with the grades under it, false the moment the line moved to
-- section 1. Two strings, one habit: describing a layout instead of a
-- fact. Both now describe the fact.
UPDATE translations SET value =
  '<strong>Every figure that needs your own number has one.</strong> The rest are benchmarks, and the grade beside each says how far to trust it.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'assumptions.needsYouDone';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'input.h.today' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'assumptions.needsYou' AND value LIKE '%wherever they appear%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'assumptions.needsYouDone' AND value LIKE '%beside each%' = 1
--
-- The counter must never again tell the reader to look in a particular
-- direction, because the fields it counts have now moved once and there
-- is no reason to think they will not move again. This is a standing
-- invariant rather than a point-in-time assertion for that reason: it is
-- protecting against a future edit, not recording a past one.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('assumptions.needsYou','assumptions.needsYouDone') AND (value LIKE '%below%' OR value LIKE '%above%') = 0
