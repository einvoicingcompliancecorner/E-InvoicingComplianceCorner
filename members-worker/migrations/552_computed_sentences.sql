-- ================================================================
-- The last of the computed sentences: tax, rework, programme tooltip.
--
-- Fifth and final pass of this session on moving the ROI page's English
-- into D1. These three were left until last because they are the most
-- heavily computed strings on the page -- the tax basis alone
-- interpolates ten separate values, two of which are themselves
-- evidence tooltips with their own nested text.
--
-- ---- WHAT A TEN-SLOT SENTENCE ARGUES FOR ---------------------------
--
-- `basis.tax` has slots {0} through {9}. That is a lot, and it is worth
-- being clear about why it is still better than the alternative.
--
-- The sentence reads: "Mechanism evidenced [source]. Your [n] AP
-- invoices imply [n] AP FTE [source]; [n clearance or reporting
-- jurisdictions] put [n]% of that in scope [source] — [n] FTE × [money]."
--
-- Every one of those brackets is a number or a citation the reader needs
-- in that position to follow the arithmetic. Split into fragments, a
-- translator gets eleven pieces and no sentence. As one row with ten
-- slots they get the sentence, and can move any piece anywhere -- which
-- is what a language with different clause order requires.
--
-- The count is a symptom of the sentence doing real work, not of the
-- approach failing. The alternative -- shorter sentences, fewer slots --
-- is a content decision, and this migration deliberately does not make
-- it: changing what the page SAYS while changing how it is STORED would
-- make both harder to review.
--
-- ---- AND TWO MORE PLURAL PAIRS -------------------------------------
--
-- `word.ctcJur`/`word.ctcJurs` and `word.erroredInvoice`/
-- `word.erroredInvoices`. The rework row had been rendering "10,000
-- errored invoices" via a bare plural noun with no singular branch at
-- all -- correct at every volume this page has ever been run at, and
-- wrong at exactly one invoice. Nobody would have noticed; the fix costs
-- one row.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'chart.progTip', 'en', '{0} — {1} weeks ({2} to {3})'),
  ('roi', 'chart.progNote', 'en', 'Programme-level: run once, not per country.'),
  ('roi', 'basis.tax', 'en', 'Mechanism evidenced {0}. Your {1} AP invoices imply <strong>{2} AP FTE</strong> {3}; {4} put <strong>{5}%</strong> of that in scope {6}{7} &mdash; {8} FTE &times; {9}.'),
  ('roi', 'word.ctcJur', 'en', 'clearance or reporting jurisdiction'),
  ('roi', 'word.ctcJurs', 'en', 'clearance or reporting jurisdictions'),
  ('roi', 'word.capped', 'en', '(capped)'),
  ('roi', 'basis.rework', 'en', '{0} {1} &times; {2} {3} &times; {4}% {5} {6}'),
  ('roi', 'word.erroredInvoice', 'en', 'errored invoice'),
  ('roi', 'word.erroredInvoices', 'en', 'errored invoices'),
  ('roi', 'ev.atRate', 'en', 'at ~{0}%');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('basis.tax','basis.rework') = 2
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'basis.tax' AND value LIKE '%{9}%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'word.%' = 14
--
-- The ten-slot sentence has to keep its highest slot, because losing
-- {9} loses the FTE cost from the end of the arithmetic and the row
-- would still render -- shorter, plausible, and missing the number that
-- makes it add up. That is the failure mode this whole page is built to
-- avoid, so it gets an invariant rather than a comment.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'basis.tax' AND value LIKE '%{0}%' AND value LIKE '%{9}%' = 1
