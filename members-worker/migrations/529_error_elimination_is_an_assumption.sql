-- ================================================================
-- The one multiplier on the page you could not argue with.
--
-- Dan: "Question - where did the rework number come from. It's not
-- something I have provided?"
--
-- It is not. The $360,000 was
--
--     100,000 AP invoices x 10% error rate x $45 per error x 80%
--
-- and all three inputs are ours until the reader changes them. Two of the
-- three were at least visible and graded: `manual_error_rate` at B from
-- the HMRC/DBT consultation, which asserts 10% and cites no study for it,
-- and `rework_per_error` at D with source_url NULL, whose own citation
-- says plainly that no analyst firm publishes a defensible
-- cost-per-exception figure.
--
-- THE 80% WAS A BARE LITERAL IN THE SOURCE:
--
--     const errSave = errNow * errCost * 0.8;   // user-owned assumption
--
-- The comment was false on both counts. It was not user-owned — there was
-- no control for it — and it was not stated as such anywhere the reader
-- would meet it. The REASONING was sound and was written down (some
-- exceptions are commercial disputes rather than clerical errors, and
-- structured data will not fix those), but it sat in the tooltip of a
-- DIFFERENT input, `errCost`, while the reader met a bare "x 80%" in the
-- results table with nothing attached to it at all.
--
-- Being a literal, it was also the only assumption on this page that
-- could not be graded, cited, overridden or reset. An assumption you
-- cannot argue with is precisely the thing the assumptions panel exists
-- to prevent, and this one was multiplying the largest of the three
-- direct rows.
--
-- SO IT BECOMES A ROW LIKE EVERY OTHER: graded D, exposed in the panel,
-- reset-able, and cited at the point of use rather than next door.
--
-- AND THE $45 STOPS CALLING ITSELF THE READER'S. The results table
-- labelled it "your rework cost" for a figure nobody had supplied. A
-- default of ours wearing the reader's name is worse than an unlabelled
-- default, because it borrows credibility it has not earned. It now reads
-- "our estimate, not yours" until the value is actually changed, at which
-- point it becomes "your rework cost" — the page already knows the
-- difference, since markOverridden() compares against the same registry.
--
-- Nothing arithmetic changes: 80 is the same 0.8. This migration is about
-- whether the reader can see it, grade it and disagree with it.
-- ================================================================

INSERT OR IGNORE INTO roi_benchmarks (key, default_value, unit, evidence_grade, source_url, source_year, is_cost, sort_order) VALUES
  ('error_elimination_pct', 80, 'percent', 'D', NULL, NULL, 0, 5);

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Errors eliminated %', 'Our assumption — deliberately not 100%',
  'Our assumption, not a benchmark. Structured invoice data removes clerical error at the point of capture, but <strong>not every exception is a clerical error</strong> &mdash; a disputed price, a short delivery or a missing purchase order will still stop an invoice however cleanly the data arrived, and no format fixes a commercial disagreement. 80% is a deliberate haircut on the assumption that most, not all, of the current exception load is data quality.<br><br><strong>What Ardent does and does not support.</strong> Ardent Partners states the mechanism directly &mdash; &ldquo;eInvoicing drives process efficiencies by eliminating data capture and manual data entry&rdquo; &mdash; and reports that 48% of AP professionals name a high exception rate as a top challenge. But the report contains <strong>no breakdown of exceptions by cause</strong> and <strong>no quantified reduction</strong> from automation, so it can neither confirm nor refute the 80%. Mechanism evidenced, magnitude ours: the same evidential position as the OECD on the indirect layer.<br><br>It does set a <strong>ceiling</strong>, which is now enforced. See the exception-reduction envelope beside this row.'
  FROM roi_benchmarks WHERE key = 'error_elimination_pct';

-- ---- the ceiling Ardent DOES give us -------------------------------
-- Best-in-Class run an 11.1% exception rate against 20.9% for all others
-- (report Table 2). That 9.8-point gap is the whole observed difference
-- between the most automated quartile in the market and everybody else —
-- and it is the TOTAL gap, across every cause of exception, not just the
-- clerical ones e-invoicing addresses.
--
-- So it bounds this model. The rework row claims errRate x errElim of all
-- invoices stop being exceptions: on the defaults, 10% x 80% = 8.0
-- percentage points. That fits inside 9.8 with room to spare, which is
-- the first real evidence the 80% is not absurd. Push either input up and
-- it stops fitting — a model claiming to remove more exceptions than
-- separate the best quartile from the rest is claiming e-invoicing alone
-- outperforms every practice Best-in-Class organisations have combined.
-- Guard 7 now says so.
--
-- Graded B, not A: both figures are Ardent primary, the subtraction is
-- ours. Same basis as ar_cost_per_invoice and the two FTE rates.
INSERT OR IGNORE INTO roi_benchmarks (key, default_value, unit, evidence_grade, source_url, source_year, is_cost, sort_order) VALUES
  ('exception_reduction_pp', 9.8, 'percent', 'B',
   'https://payablesplace.ardentpartners.com/2026/01/state-of-epayables-part-nine-ap-benchmarks-and-best-in-class-performance/',
   '2025 data', 0, 13);

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Observed exception-rate gap', 'Ardent Partners: Best-in-Class vs all others',
  'Ardent Partners, <em>The State of ePayables 2025</em>: Best-in-Class organisations run an exception rate of <strong>11.1%</strong> against <strong>20.9%</strong> for all others &mdash; a gap of <strong>9.8 percentage points</strong>. Used here as a CEILING rather than a target. It is the entire observed difference between the most automated quartile in the market and everyone else, across every cause of exception; e-invoicing is one contributor among many, since Best-in-Class also process 51% of invoices straight through against 29%, and have 1.4&times; more suppliers enabled. If this model''s own claim (error rate &times; errors eliminated) exceeds 9.8 points, it is asserting that e-invoicing alone beats everything Best-in-Class organisations do combined, and the page says so. <strong>Graded B: Ardent''s figures, our subtraction.</strong> Note also that Ardent publishes no breakdown of exceptions by cause, so nothing here establishes what share of that gap is clerical.'
  FROM roi_benchmarks WHERE key = 'exception_reduction_pp';

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'input.errElim', 'en', 'Errors eliminated %'),
  ('roi', 'help.errElim', 'en',
   'What share of today''s errored invoices e-invoicing actually removes. Structured data eliminates clerical error at capture, but an exception is not always a clerical error: disputed prices, short deliveries and missing purchase orders stop an invoice whatever format it arrived in. Defaulted to 80% rather than 100% for that reason, and exposed here so you can disagree with it — it multiplies the rework row directly, and a business with a lot of genuine supplier disputes should pull it down.');

-- The 80% now explains itself where it is used, so `errCost` no longer
-- has to carry someone else's footnote.
UPDATE translations SET value =
 'What it costs to investigate and correct one invoice that arrived with bad data — chasing, re-keying, re-approval. Our estimate, and a weak one: no analyst firm publishes a defensible cost-per-exception figure, so your own number is strictly better than ours and this row is the first place to put it. Note the results table calls this "our estimate" until you change it, and "your rework cost" afterwards. How MANY of these errors go away is a separate assumption, set beside this one.'
 WHERE namespace = 'roi' AND key = 'help.errCost' AND lang = 'en';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'error_elimination_pct' = 80
-- ASSERT: SELECT evidence_grade FROM roi_benchmarks WHERE key = 'error_elimination_pct' = 'D'
-- ASSERT: SELECT count(*) FROM roi_benchmarks WHERE active = 1 = 23
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'exception_reduction_pp' = 9.8
--
-- The envelope, as arithmetic: the defaults must sit INSIDE the observed
-- gap, or the model is over-claiming on the day it ships.
--
-- ASSERT: SELECT CASE WHEN (SELECT default_value FROM roi_benchmarks WHERE key = 'manual_error_rate') * (SELECT default_value FROM roi_benchmarks WHERE key = 'error_elimination_pct') / 100.0 < (SELECT default_value FROM roi_benchmarks WHERE key = 'exception_reduction_pp') THEN 1 ELSE 0 END = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key NOT LIKE 'help.%' = 124
--
-- The point of the migration, asserted as content: the reasoning has to
-- travel with the number, or this is just a literal in a different place.
--
-- ASSERT: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'error_elimination_pct' AND t.lang = 'en' AND t.citation LIKE '%not every exception is a clerical error%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.errCost' AND value LIKE '%separate assumption%' = 1
--
-- A standing invariant, and the general form of what Dan found. Every
-- benchmark this page renders is graded, so an ungraded number reaching
-- the reader means it bypassed the registry entirely — which is exactly
-- what a hardcoded literal does. This cannot catch a literal in the
-- renderer (nothing in SQL can), but it does guarantee that anything
-- which HAS made it into the registry carries a grade and a translation,
-- so the panel and the evidence cards can never render a bare figure.
--
-- ASSERT ALWAYS: SELECT count(*) FROM roi_benchmarks WHERE active = 1 AND (evidence_grade IS NULL OR evidence_grade NOT IN ('A','B','C','D')) = 0
