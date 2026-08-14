-- ================================================================
-- The page contradicted itself about Ardent, on the same screen.
--
-- Dan: "take a look at the referenced sources, especially ardent, and see
-- if they benchmark 'Faster cycle time & fewer supplier queries'."
--
-- They do, better than this page admitted, and worse than the Grade A
-- card implied. Both statements were on screen at once:
--
--   * the direct-benefits row said "the only figures available are one
--     NHS anecdote" — false; and
--   * the Grade A card claimed "Ardent Partners 2025 (cost, cycle time,
--     exceptions)" — while `cycle_time_days` and `exception_rate` sat in
--     this table as active Grade A rows that NOTHING ON THE PAGE
--     RENDERED. Two orphans, the same shape as the retired
--     `platform_cost_year` and the D1 key nothing consumed.
--
-- WHAT ARDENT ACTUALLY PUBLISHES (State of ePayables 2025, verified
-- against both the report PDF and the Payables Place summary, which
-- agree to a percentage point):
--
--   metric                          all      Best-in-Class   all others
--   cost per invoice               $9.84        $2.65          $12.42
--   cycle time (days)                8.2          2.9            13.5
--   exception rate                 18.4%        11.1%           20.9%
--   staff time on supplier         21.9%*       12.8%           24.0%
--     inquiries                    (* dealing with suppliers overall)
--
-- WHY THE CYCLE-TIME GAP IS USELESS AS EVIDENCE, AND THE INQUIRY GAP IS
-- NOT. Ardent defines Best-in-Class as the 20% of enterprises with the
-- lowest processing costs and "shortest average invoice process times".
-- Cycle time IS the definition, so "Best-in-Class are 79% faster" is a
-- tautology dressed as a finding, and citing it would collapse under one
-- question from a finance committee. Staff time on supplier inquiries is
-- NOT part of that definition, which is precisely what makes 12.8% vs
-- 24.0% a real observation rather than a restatement.
--
-- It is still an association with high-performing AP as a whole. Ardent
-- does not isolate e-invoicing; it reports that top performers have 1.4x
-- more suppliers enabled to invoice electronically and 1.8x more
-- straight-through processing. So the row stays unmonetised — the
-- evidence improves, the arithmetic does not change, and the reason for
-- not pricing it changes from "there is nothing to go on" to "there is
-- something good to go on and it still does not establish cause".
-- ================================================================

INSERT OR IGNORE INTO roi_benchmarks (key, default_value, unit, evidence_grade, source_url, source_year, is_cost, sort_order) VALUES
  ('supplier_inquiry_time', NULL, NULL, 'A',
   'https://payablesplace.ardentpartners.com/2026/01/state-of-epayables-part-nine-ap-benchmarks-and-best-in-class-performance/',
   '2025 data', 0, 8);

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Staff time on supplier inquiries', 'Ardent Partners, 2025 data',
  'Ardent Partners, <em>The State of ePayables 2025</em>: Best-in-Class AP organisations spend <strong>12.8%</strong> of staff time on supplier inquiries against <strong>24.0%</strong> for all others; the market average for time dealing with suppliers overall is 21.9%. Measured, primary and attributable. <strong>Crucially, this metric is not part of Ardent''s Best-in-Class definition</strong> &mdash; which is what makes it usable where the cycle-time gap is not. It remains an association with high-performing AP as a whole: Ardent does not isolate e-invoicing, reporting only that top performers have 1.4&times; more suppliers enabled to invoice electronically and 1.8&times; more straight-through processing. <strong>Carries no value in this model.</strong>'
  FROM roi_benchmarks WHERE key = 'supplier_inquiry_time';


-- ---- the two orphans, now rendered, and told to say more ----------
-- UPDATE rather than INSERT OR IGNORE: 505 applied long ago, so an insert
-- would decline in silence. That is the shape migration 522 exists to
-- remember.
UPDATE roi_benchmark_translations SET citation =
 'Ardent Partners, <em>The State of ePayables 2025</em>: market-average cycle time 8.2 days; Best-in-Class 2.9 days against 13.5 for all others. <strong>Deliberately NOT offered as evidence that e-invoicing shortens cycle time.</strong> Ardent defines Best-in-Class as the 20% of enterprises with the lowest processing costs and &ldquo;shortest average invoice process times&rdquo; &mdash; cycle time is the definition, so the 79% gap is a tautology rather than a finding. The figure is quoted here so that it is on the record, and so is the reason for not leaning on it.'
 WHERE lang = 'en' AND benchmark_id = (SELECT id FROM roi_benchmarks WHERE key = 'cycle_time_days');

UPDATE roi_benchmark_translations SET citation =
 'Ardent Partners, <em>The State of ePayables 2025</em>: market-average exception rate 18.4%; Best-in-Class 11.1% against 20.9% for all others. Note it rose from 14% in the prior edition. <strong>Not interchangeable with the 10% manual error rate this model uses</strong>: an exception is any invoice needing manual intervention, an error is narrower, and quietly swapping one for the other would nearly double a line of the business case on a change of definition alone.'
 WHERE lang = 'en' AND benchmark_id = (SELECT id FROM roi_benchmarks WHERE key = 'exception_rate');


-- ---- what the page says about all this ---------------------------
UPDATE translations SET value =
 'Ardent Partners 2025 (cost, cycle time, exception and supplier-inquiry rates) &middot; ATO / Deloitte Access Economics (paper vs PDF vs e-invoice, 2016 vintage, stated) &middot; OECD DCTR 2026 (mechanism) &middot; this site&rsquo;s own tracker data.'
 WHERE namespace = 'roi' AND key = 'ev.gradeA.body' AND lang = 'en';

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  -- Replaces a hardcoded line that said both unmonetised rows were
  -- unmonetised for the same reason. After this migration they are not.
  ('roi', 'res.unmonetised', 'en', 'Two benefits above are left unmonetised on purpose, and for <em>different</em> reasons. Paper, print and postage has no benchmark worth defending &mdash; your own spend is the only honest input. Cycle time and supplier queries has a good one, and still cannot be monetised: nobody has measured how much of that gap e-invoicing itself causes, and assuming all of it would undermine every other number on this page.');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM roi_benchmarks WHERE key = 'supplier_inquiry_time' AND active = 1 AND evidence_grade = 'A' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key NOT LIKE 'help.%' = 115
--
-- Content, not counts. The whole point of this migration is what these
-- three citations SAY; a row count would have been satisfied by the
-- version of the page that contradicted itself.
--
-- ASSERT: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'cycle_time_days' AND t.lang = 'en' AND t.citation LIKE '%tautology rather than a finding%' = 1
-- ASSERT: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'exception_rate' AND t.lang = 'en' AND t.citation LIKE '%Not interchangeable%' = 1
-- ASSERT: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'supplier_inquiry_time' AND t.lang = 'en' AND t.citation LIKE '%not part of Ardent%Best-in-Class definition%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'ev.gradeA.body' AND value LIKE '%supplier-inquiry rates%' = 1
--
-- And the standing one this whole episode argues for. A Grade A benchmark
-- is the strongest claim this page makes about a number; carrying one in
-- D1 that no consumer renders is how the contradiction survived. Every
-- active grade-A row must be cited by the renderer. The list is
-- maintained by hand deliberately: adding a key here should be a
-- decision, taken at the moment the renderer starts using it.
--
-- (`ap_invoices_per_fte` added 14 Aug 2026 by migration 526, and
-- `capture_share_of_ap` by 527, each at the point the renderer started
-- citing it. Assertion-comment edits only — no executable change, so the
-- replay is byte-identical and --refresh-checksums re-records the file.
-- Both times the invariant caught the omission on the first replay,
-- which is the friction the hand-maintained list was designed to create,
-- working as intended rather than being worked around.)
--
-- ASSERT ALWAYS: SELECT count(*) FROM roi_benchmarks WHERE active = 1 AND evidence_grade = 'A' AND key NOT IN ('ap_cost_per_invoice','ar_cost_per_invoice','cycle_time_days','exception_rate','supplier_inquiry_time','dctr_mechanism','ap_invoices_per_fte','capture_share_of_ap') = 0
