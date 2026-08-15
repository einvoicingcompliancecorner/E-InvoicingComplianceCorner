-- ================================================================
-- Citation labels and page chrome follow the sentences into D1.
--
-- The second pass of the work migration 548 started, and the same rule:
-- every value here was generated from the renderer's own fallbacks.
--
-- ---- WHAT THESE ARE, AND WHY THEY WERE EASY TO MISS -----------------
--
-- Thirteen of the nineteen are `ev()` labels -- the underlined words that
-- open an evidence tooltip: "baseline", "reduction", "our estimate, not
-- yours", "why not all of them", "tracker dates". They are two or three
-- words each, they sit inside a sentence that was already translatable,
-- and every one of them was an English literal passed as an argument.
--
-- That shape is exactly why the reverse detector exists. Reading the
-- source, `ev('rework','our estimate, not yours')` looks like plumbing;
-- it is a function call with a key in it, and the eye slides over it the
-- way it slides over a CSS class. Rendered and stubbed, it is one of the
-- few phrases still in English on a page of sentinels, and it is
-- unmissable. The forward check -- is every D1 row rendered? -- cannot
-- see these at all, because there was never a row to notice.
--
-- The remaining six are page chrome: the evidence-tooltip heading
-- ("Evidence grade {0}", now a slot rather than concatenation), the
-- fixed-rate note, the saved-countries count, the chart's aria-label,
-- and the assumptions panel's show/hide toggle.
--
-- ---- THE TOGGLE IS WORTH A LINE ------------------------------------
--
-- `this.open ? 'hide ▴' : 'show ▾'` had gone unnoticed through every
-- pass over this file, including two that were specifically looking for
-- hardcoded English, because it does not read as copy. It is the
-- smallest possible string in the least prose-like position: a ternary
-- on a DOM property. It is also the first thing a reader clicks.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'ev.gradeLabel', 'en', 'Evidence grade {0}'),
  ('roi', 'fx.usdNote', 'en', 'Benchmark defaults are published in US dollars.'),
  ('roi', 'subs.fromSaved', 'en', '({0}) — from your saved preferences'),
  ('roi', 'chart.alt', 'en', 'Back-planned delivery timeline by jurisdiction'),
  ('roi', 'ev.durationsLong', 'en', 'Durations: practitioner estimates'),
  ('roi', 'btn.hide', 'en', 'hide ▴'),
  ('roi', 'btn.show', 'en', 'show ▾'),
  ('roi', 'ev.trackerDates', 'en', 'tracker dates'),
  ('roi', 'ev.durations', 'en', 'practitioner estimates'),
  ('roi', 'ev.apqcMedian', 'en', 'APQC median, 12,000 per FTE'),
  ('roi', 'ev.ourAssumption', 'en', 'our assumption'),
  ('roi', 'ev.yourRework', 'en', 'your rework cost'),
  ('roi', 'ev.ourEstimate', 'en', 'our estimate, not yours'),
  ('roi', 'ev.whyNotAll', 'en', 'why not all of them'),
  ('roi', 'ev.excRate', 'en', 'not Ardent&rsquo;s 18.4% exception rate'),
  ('roi', 'ev.ardent2025', 'en', 'Ardent Partners, 2025 data'),
  ('roi', 'ev.cycleGap', 'en', '2.9 vs 13.5 days'),
  ('roi', 'ev.nhsQuery', 'en', '15% query reduction'),
  ('roi', 'ev.excSplit', 'en', '11.1% against 20.9%');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'ev.%' = 32
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'ev.gradeLabel' AND value LIKE '%{0}%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('btn.hide','btn.show') = 2
--
-- The evidence heading takes a slot rather than concatenating the grade
-- letter, and that has to stay: "Evidence grade A" reads correctly in
-- English by accident of word order, and a language that puts the
-- qualifier first would be stuck with it forever.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'ev.gradeLabel' AND value LIKE '%{0}%' = 1
