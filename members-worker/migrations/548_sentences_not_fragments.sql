-- ================================================================
-- Sentences, not fragments: the ROI page's prose moves into D1.
--
-- Dan, choosing the approach before any of it was written: the
-- positional formatter, over fragment-by-fragment.
--
-- ---- WHY THAT CHOICE IS THE WHOLE MIGRATION -------------------------
--
-- This page builds prose by concatenating English around computed
-- values. The summary card was the worst of them:
--
--   'Across ' + n + ' jurisdictions you have ' + x + ' complex (CTC or
--    5-corner) and ' + y + ' simple (4-corner exchange) regime' +
--    (y===1?'':'s') + ...
--
-- Split into rows -- 'Across', 'jurisdictions you have', '(CTC or
-- 5-corner) and' -- each fragment is translatable and the SENTENCE is
-- not, because word order moves between languages and no translator can
-- reorder pieces that JavaScript joins in a fixed sequence. The result
-- would look finished and be unusable, which is worse than English.
--
-- One row holds the whole sentence with {0}-style slots, and fill()
-- substitutes them. The slot carries its meaning with it, so a German
-- translator can put the verb where German puts the verb.
--
-- ---- AND THE PLURALS, WHICH WERE THE SAME BUG IN MINIATURE ----------
--
-- Nine places did n===1?'':'s'. English pluralises by suffix; no other
-- language does, and several inflect the surrounding words too. Two rows
-- per noun is the smallest honest fix -- the template holds a slot, the
-- count picks which row fills it. Languages with more than two plural
-- forms need more rows, not different code. `word.regime`/`word.regimes`,
-- `word.erp`/`word.erps`, `word.integration`/`word.integrations`.
--
-- ---- WHAT IS IN THIS FILE ------------------------------------------
--
-- 45 keys, covering the summary card, the savings-table row labels and
-- their basis clauses, the chart's furniture and the wave table's
-- headers. Every one was GENERATED from the renderer's own fallbacks,
-- never retyped -- migration 522's lesson, and the reason roi-i18n can
-- assert the two are character-identical.
--
-- The inventory in tests/roi-hardcoded.mjs falls from 103 to whatever
-- survives this file. It cannot rise: the suite fails on any string it
-- has not seen, and on any entry that has silently been fixed.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'chart.today', 'en', 'today'),
  ('roi', 'chart.phase', 'en', 'Phase'),
  ('roi', 'chart.golive', 'en', 'Go-live'),
  ('roi', 'adjust.jur', 'en', 'Jurisdiction'),
  ('roi', 'adjust.wave', 'en', 'Wave (go-live)'),
  ('roi', 'adjust.pin', 'en', 'Pinned start'),
  ('roi', 'card.mix', 'en', 'Across {0} jurisdictions you have {1} (CTC or 5-corner) and {2} (4-corner exchange){3}.'),
  ('roi', 'word.complex', 'en', 'complex'),
  ('roi', 'word.regime', 'en', 'simple regime'),
  ('roi', 'word.regimes', 'en', 'simple regimes'),
  ('roi', 'card.plusNoMandate', 'en', ', plus {0} with no mandate{1}'),
  ('roi', 'card.integrations', 'en', 'With {0} that is roughly {1}{2} to deliver.'),
  ('roi', 'word.erp', 'en', 'ERP/billing system'),
  ('roi', 'word.erps', 'en', 'ERP/billing systems'),
  ('roi', 'word.integration', 'en', 'country-system integration'),
  ('roi', 'word.integrations', 'en', 'country-system integrations'),
  ('roi', 'card.nearest', 'en', 'The nearest binding date is {0} ({1}).'),
  ('roi', 'card.noDated', 'en', 'None of the selected jurisdictions has a future dated deadline on the tracker today.'),
  ('roi', 'ev.siteLabel', 'en', 'Source: live tracker data'),
  ('roi', 'th.deadline', 'en', 'Deadline'),
  ('roi', 'th.status', 'en', 'Status'),
  ('roi', 'th.model', 'en', 'Model'),
  ('roi', 'th.integrations', 'en', 'Integrations'),
  ('roi', 'th.why', 'en', 'Why'),
  ('roi', 'btn.showTable', 'en', 'Show as table'),
  ('roi', 'btn.hideTable', 'en', 'Hide table'),
  ('roi', 'row.ap', 'en', 'Processing cost reduction (AP)'),
  ('roi', 'basis.ap', 'en', '{0} invoices &times; {1} {2} &times; {3}% {4}'),
  ('roi', 'ev.baseline', 'en', 'baseline'),
  ('roi', 'ev.reduction', 'en', 'reduction'),
  ('roi', 'row.ar', 'en', 'Issuing cost reduction (AR)'),
  ('roi', 'basis.ar', 'en', '{0} invoices &times; {1} {2} &times; {3}% {4}'),
  ('roi', 'row.tax', 'en', 'Reduced tax reporting &amp; audit-prep effort'),
  ('roi', 'row.rework', 'en', 'Avoided rework on data-entry errors'),
  ('roi', 'row.paper', 'en', 'Paper, print, postage, storage'),
  ('roi', 'basis.paper', 'en', 'Paper AUD 30.87 vs e-invoice AUD 9.18 {0}; your own spend is the better input'),
  ('roi', 'row.vat', 'en', 'VAT leakage / gap recovery'),
  ('roi', 'basis.vat', 'en', 'Often quoted, <strong>not defensible</strong> {0} &mdash; excluded from this model entirely'),
  ('roi', 'ev.whyNot', 'en', 'why not'),
  ('roi', 'row.penalty', 'en', 'Penalty &amp; remediation exposure avoided'),
  ('roi', 'basis.penalty', 'en', '{0} of your jurisdictions publish a quantified penalty schedule {1}. Size it from those, per country &mdash; there is no credible aggregate'),
  ('roi', 'ev.deepDives', 'en', 'on their deep dives'),
  ('roi', 'row.fraud', 'en', 'Fraud detection, working-capital visibility'),
  ('roi', 'basis.fraud', 'en', 'Strategic benefits; no benchmark exists {0}'),
  ('roi', 'ev.yourCall', 'en', 'your call');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'basis.%' = 6
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'row.%' = 16
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'word.%' = 7
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'card.mix' AND value LIKE '%{0}%{1}%{2}%{3}%' = 1
--
-- The slots are the point, and they are the thing a well-meaning edit
-- would destroy: someone tidying "Across {0} jurisdictions" into "Across
-- 8 jurisdictions" produces a sentence that reads correctly in English
-- and is permanently wrong for every reader after them. Every template
-- row must keep at least one slot.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('card.mix','card.integrations','card.nearest','card.plusNoMandate','basis.ap','basis.ar','basis.paper','basis.vat','basis.penalty','basis.fraud') AND value NOT LIKE '%{0}%' = 0
--
-- And the plural pairs, which only work as pairs. A missing half means
-- one count renders the key name or falls back to English while the
-- other translates -- on the same screen, in the same sentence.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('word.regime','word.regimes','word.erp','word.erps','word.integration','word.integrations') = 6
