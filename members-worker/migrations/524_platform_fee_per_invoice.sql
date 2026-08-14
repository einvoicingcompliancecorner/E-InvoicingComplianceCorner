-- ================================================================
-- Platform / network fees stop being a flat number and start being a
-- function of the reader's own volumes. Plus column headings for the
-- countries-in-scope list.
--
-- Dan: "adjust the 'Platform / network fees per year' fee, so that it is
-- calculated as $0.40 multiplied by the invoice volume earlier in the
-- page. Update the tool tip, to indicate that this is an approximate
-- multiplier for cost-per-invoice, for the technology. The actual vendor
-- price may vary and should be updated manually."
--
-- WHY THIS MATTERED MORE THAN IT LOOKS. `platform_cost_year` was 45,000
-- a year regardless of whether the visitor had typed 5,000 invoices or
-- 5,000,000. Every benefit on the page scales with volume; this was the
-- one cost that did not. A model whose savings are linear and whose
-- costs are constant does not have an ROI, it has a slope, and it will
-- always eventually say yes. On the opening 100k AP / 50k AR footprint
-- the new figure is 60,000 rather than 45,000 — but the point is not the
-- 15,000, it is that at 500k invoices it now reads 200,000 instead of
-- still reading 45,000.
--
-- WHICH VOLUME. AP + AR, Dan's choice of the three offered. A network
-- charges for a document whether you send it or receive it, and it is
-- the only basis on which the fee responds to either input moving.
--
-- STILL OVERRIDABLE, AND STILL A PLACEHOLDER. A typed value wins
-- permanently and stops tracking the volumes; Reset restores the
-- derivation. The field keeps its place in the "n of 4 cost inputs are
-- still placeholders" warning, because an approximate multiplier is
-- exactly that. The old 45,000 row is retired rather than deleted —
-- `active = 0` keeps its grade and provenance readable.
-- ================================================================

INSERT OR IGNORE INTO roi_benchmarks (key, default_value, unit, evidence_grade, source_url, source_year, is_cost, sort_order) VALUES
  ('platform_fee_per_invoice', 0.40, 'currency', 'D', NULL, NULL, 1, 21);

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Platform / network fee per invoice',
  'PLACEHOLDER &mdash; an approximate per-document multiplier',
  'A placeholder, not a benchmark. Vendor pricing in this market varies by an order of magnitude and is rarely published; USD 0.40 per document is a round order-of-magnitude figure for network and platform fees, not a surveyed average. The annual figure it produces should be replaced with your vendor''s own quote.'
  FROM roi_benchmarks WHERE key = 'platform_fee_per_invoice';

-- Retired: nothing reads it after this migration. Kept, not dropped.
UPDATE roi_benchmarks SET active = 0 WHERE key = 'platform_cost_year';


-- ---- the tooltip Dan asked for ----------------------------------
-- UPDATE, not INSERT OR IGNORE: 506 already applied, so an insert would
-- decline in silence. That is the shape of defect migration 522 exists
-- to remember.
UPDATE translations SET value =
 'Annual fees to your e-invoicing platform, network or access-point provider, across all countries in scope. Derived, not entered: an approximate cost-per-invoice multiplier for the technology, applied to your AP and AR volumes together — a network charges for a document whether you send it or receive it. The multiplier is a placeholder and nothing is claimed for it. Actual vendor pricing varies by an order of magnitude, is rarely published, and should be entered here manually once you have a quote; a value you type wins permanently and stops tracking your volumes.'
 WHERE namespace = 'roi' AND key = 'help.cPlat' AND lang = 'en';


INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  -- The hint under the field, which has to show its own arithmetic. A
  -- number that moves when you edit something else, without saying why,
  -- reads as a bug. {vol} and {fee} are substituted client-side, in the
  -- selected currency.
  ('roi', 'input.cPlat.derived', 'en', 'Approximate: {vol} invoices &times; {fee} each. This is a rough per-invoice multiplier for the technology &mdash; your vendor&rsquo;s actual price will differ, and should be entered here.'),

  -- Column headings for the countries-in-scope list, which is a table and
  -- is now laid out as one. Seventy rows of name-then-pill-then-pill-then-
  -- date, each starting wherever the last one ended, gave four ragged
  -- edges and no way to scan down a single attribute — which is the only
  -- thing anyone does with that list.
  ('roi', 'col.jurisdiction', 'en', 'Jurisdiction'),
  ('roi', 'col.mandate',      'en', 'Mandate'),
  ('roi', 'col.complexity',   'en', 'Complexity'),
  ('roi', 'col.deadline',     'en', 'Deadline');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'platform_fee_per_invoice' = 0.4
-- ASSERT: SELECT active FROM roi_benchmarks WHERE key = 'platform_cost_year' = 0
-- ASSERT: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'platform_fee_per_invoice' AND t.lang = 'en' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'col.%' = 4
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key NOT LIKE 'help.%' = 114
--
-- The tooltip is the part a count cannot see, so assert its content —
-- specifically the two claims Dan asked it to make, that the multiplier
-- is approximate and that the real price is entered by hand.
--
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.cPlat' AND value LIKE '%approximate cost-per-invoice multiplier%' AND value LIKE '%entered here manually%' = 1
--
-- A standing one. An ACTIVE benchmark row that nothing renders is dead
-- data that reads as live — the same shape as the D1 key nothing
-- consumed. Every active row must carry an English translation, so a
-- retired row is retired deliberately rather than by neglect.
--
-- ASSERT ALWAYS: SELECT count(*) FROM roi_benchmarks b WHERE b.active = 1 AND NOT EXISTS (SELECT 1 FROM roi_benchmark_translations t WHERE t.benchmark_id = b.id AND t.lang = 'en') = 0
