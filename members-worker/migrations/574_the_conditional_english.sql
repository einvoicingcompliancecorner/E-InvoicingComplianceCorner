-- ================================================================
-- The English that only appears when something goes wrong.
--
-- Dan, 17 August 2026: "ensure we are fully ready for translation."
--
-- Nineteen strings, all of them in the renderer, all of them English, on
-- a page whose hardcoded-strings suite has reported ZERO for three days.
--
-- ---- WHY THE DETECTOR NEVER SAW THEM -------------------------------
--
-- It renders the page, presses Calculate, opens three panels, walks the
-- visible text and reports what survived a sentinel render. Its logic is
-- correct. Its ITINERARY is short:
--
--   * it never expands the wave chart, and the chart's own labels --
--     PROGRAMME, WAVE 2027-01-01, EU-WIDE, NO FIXED DEADLINE, and every
--     bar and marker tooltip -- exist only in the expanded view;
--   * it never drives a scenario that trips a guard, and all six
--     remaining guards are conditional by definition.
--
-- Six of seven guards were raw template literals. The seventh -- the
-- mistimed-obligation one -- was already D1-backed with slots and
-- plurals, because it was written most recently, and it is the shape the
-- other six now use.
--
-- This is the third instance of the same shape in a week: the harness
-- rendering in substitute fonts, render-lint reading one of two template
-- literals, and now this. It has a card in the design review. The fix
-- that matters is not these nineteen rows, it is the detector's route --
-- which is why the suite now expands the chart and drives two guard
-- conditions, and would fail on the next conditional string rather than
-- on this one.

-- ---- the six guards ------------------------------------------------
--
-- Two carry a count whose plural changes more of the sentence than the
-- noun -- "jurisdiction has"/"jurisdictions have", "meets that
-- date"/"meets those dates" -- so they are whole forms keyed by CLDR
-- category, exactly like the mistimed guard beside them.
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'guard.zeroInt.one', 'en', '<strong>{0} selected jurisdiction has a mandate, but the model has costed zero integrations.</strong> That is not a cheap programme, it is a broken calculation &mdash; treat every figure below as unsafe until it is explained.'),
  ('roi', 'guard.zeroInt.other', 'en', '<strong>{0} selected jurisdictions have a mandate, but the model has costed zero integrations.</strong> That is not a cheap programme, it is a broken calculation &mdash; treat every figure below as unsafe until it is explained.'),
  ('roi', 'guard.late.one', 'en', '<strong>{0} pinned start date finishes after the deadline.</strong> {1}. That may be deliberate &mdash; an accepted late position is a decision a board can take &mdash; but the plan below no longer meets that date.'),
  ('roi', 'guard.late.other', 'en', '<strong>{0} pinned start dates finish after the deadline.</strong> {1}. That may be deliberate &mdash; an accepted late position is a decision a board can take &mdash; but the plan below no longer meets those dates.'),
  ('roi', 'guard.payback', 'en', '<strong>Payback under one month.</strong> No e-invoicing programme pays back that fast. Check the volumes and the per-invoice costs &mdash; one of them is out by an order of magnitude, and the rest of this page inherits it.'),
  ('roi', 'guard.taxCap', 'en', '<strong>The tax-effort saving is capped and the cap is binding.</strong> {0} would imply {1}% of your AP effort; the model will not credit more than {2}%, because the magnitude is our assumption rather than a benchmark and an uncapped one would run away. Adding further jurisdictions will not move the indirect figure &mdash; though it will keep adding cost, which is the honest asymmetry.'),
  ('roi', 'guard.capture', 'en', '<strong>The capture headcount is worth more than the whole processing saving.</strong> {0} of released data-entry cost against {1} of total AP processing reduction. These are two routes to the same money, so the first cannot exceed the second &mdash; check the data-entry rate and the AP cost per invoice, because one of them is out.'),
  ('roi', 'guard.excGap', 'en', '<strong>This model removes more exceptions than separate the best quartile of AP from everyone else.</strong> Your error rate and elimination assumption together take {0} points of invoices out of exception; Ardent measures the whole gap between Best-in-Class and all others at {1} points {2}, across every cause and with e-invoicing only one contributor. Lower the error rate or the elimination percentage &mdash; as it stands the rework row is claiming more than the market&rsquo;s best performers achieve.');

-- ---- and the expanded chart ----------------------------------------
--
-- The band headers are UPPERCASE IN THE DATA, not uppercased by CSS, and
-- that is deliberate: they are SVG text, there is no text-transform to
-- apply, and a translator who needs a lowercase form in their language --
-- or a shorter one, because the gutter is 190px -- can supply it. Casing
-- decided in code is a decision taken away from the person who knows the
-- language.
--
-- The em-dash separators and the "w" week suffix stay inside the
-- sentences for the same reason.
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'chart.programme', 'en', 'PROGRAMME'),
  ('roi', 'chart.waveBand', 'en', 'WAVE {0}'),
  ('roi', 'chart.waveBandMeta', 'en', '{0} &middot; {1}w effort &middot; {2}w elapsed{3}'),
  ('roi', 'chart.euWide', 'en', 'EU-WIDE'),
  ('roi', 'chart.segTip', 'en', '{0} — {1}'),
  ('roi', 'chart.segWeeks', 'en', '{0} weeks: {1} to {2}'),
  ('roi', 'chart.aheadTip', 'en', '{0} completes ahead of the {1} wave deadline'),
  ('roi', 'chart.noDeadlineBand', 'en', 'NO FIXED DEADLINE'),
  ('roi', 'chart.noDeadlineMeta', 'en', '{0} &middot; {1} once contracting completes'),
  ('roi', 'chart.startInForce', 'en', 'already in force, or startable any time'),
  ('roi', 'chart.startAny', 'en', 'start any time'),
  -- FOUND BY THE EXTENDED ITINERARY, not by the sweep that preceded it.
  -- The per-row go-live marker and the three risk chips on the right of
  -- each track were still literals after every string above had been
  -- moved -- because moving strings is done by reading code, and the
  -- reason these were missed is the same reason they were missed the
  -- first time: they only exist in a view nobody had opened.
  --
  -- The detector found them inside a minute of being taught to press
  -- #ganttToggle. That is the argument for fixing the route rather than
  -- the strings, made by the route on its first run.
  ('roi', 'chart.goliveRowTip', 'en', '{0} go-live &mdash; mandate deadline {1}'),
  ('roi', 'chart.risk.lateDays', 'en', 'late {0}d'),
  ('roi', 'chart.risk.startDays', 'en', 'start {0}d'),
  ('roi', 'chart.risk.days', 'en', '{0}d'),
  -- AND THE LAST ENGLISH ON THE PAGE, which was hiding under a threshold
  -- rather than behind a click. The payback figure prints "6mo", "<1mo"
  -- or "n/a" on both the page and the PDF, and the detector's noise
  -- filter skips anything under three lowercase letters -- a necessary
  -- filter, since the page is full of two-letter country codes and
  -- single-letter evidence grades, and a hiding place for exactly the
  -- kind of string easiest to forget.
  --
  -- "mo" is not universal: German writes Mon., French mois. "n/a" is
  -- English shorthand for a concept every language abbreviates its own
  -- way. Found by reading a German render rather than by any check, which
  -- is the argument for the cold read that has its own recommendation.
  ('roi', 'res.payback.na', 'en', 'n/a'),
  ('roi', 'res.payback.under', 'en', '&lt;1mo'),
  ('roi', 'res.payback.months', 'en', '{0}mo');

-- The wave band said "{n} countries". It counts TRACKS, and one of them
-- can be the European Union, which is not a country -- the same noun
-- error migration 568 fixed on the footprint card and migration 570
-- fixed in the wave table. Third surface, same sentence, found only
-- because translating it meant reading it.
--
-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'guard.%' = 15
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'chart.%' = 41
--
-- Every guard must keep the slot that names WHICH jurisdictions tripped
-- it. A guard that says "3 pinned start dates finish after the deadline"
-- and does not say which three is a warning the reader cannot act on,
-- and losing a slot in translation is silent -- the English still reads.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('guard.late.one','guard.late.other','guard.mistimed.one','guard.mistimed.other') AND value LIKE '%{0}%' AND value LIKE '%{1}%' = 4
--
-- And no wave-plan string may call a track a country. The EU row is one.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('chart.waveBandMeta','chart.noDeadlineMeta','res.dated') AND (value LIKE '%countr%') = 0
