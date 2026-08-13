-- ================================================================
-- ROI planner: make the currency selector actually convert.
--
-- Dan, 12 Aug 2026: "I've noticed a problem with the roi-calculator, in
-- that switching currency for the calculation seems to not alter the
-- underlying calculations... this changes the currency, but never
-- applies the FX rate change to the displayed field. Therefore the
-- calculator yields the same outcome regardless of whether you select
-- USD, GBP or EUR."
--
-- Correct, and worse than a missing feature. Selecting GBP relabelled
-- Ardent's USD 9.84 as GBP 9.84 — a 35% overstatement of the baseline
-- presented as a sourced benchmark, with the citation still attached.
-- Every downstream figure inherited it. The tool did not fail; it
-- produced a confident wrong answer, which is the worse failure mode.
--
-- WE DOCUMENTED IT RATHER THAN FIXING IT, AND THAT WAS THE MISTAKE.
-- Migration 506's help.cur tooltip said: "Display currency only. No FX
-- conversion is applied anywhere in this model. Enter your benchmark
-- values in the same currency you pick here, or the totals will be
-- wrong in a way nothing on the page will warn you about." All true,
-- and it did warn — in a tooltip, behind a hover, on a control most
-- people will change without reading anything. A known defect with a
-- disclosure is still a defect. Writing that sentence should have been
-- the moment it got fixed.
--
-- WHY A DATED TABLE RATHER THAN A LIVE FEED. A Worker calling an FX API
-- at request time buys precision this model cannot use — the inputs are
-- Grade D placeholders and practitioner estimates — and pays for it
-- with a network dependency, a failure mode, and a number that changes
-- between two runs of the same scenario. A rate with a visible date is
-- more honest for a business case: it is reproducible, and anyone can
-- see how stale it is. Updating is a migration with a sourcing trail,
-- the same rule this project applies to every other number.
--
-- RATES: spot, 11 August 2026, both from the same source and the same
-- date so the pair is internally consistent.
--   1 GBP = 1.3511 USD   1 EUR = 1.1543 USD
-- https://www.exchange-rates.org/exchange-rate-history/gbp-usd-2026
-- https://www.exchange-rates.org/exchange-rate-history/eur-usd-2026
--
-- base_currency exists because a benchmark has a NATIVE currency that
-- has nothing to do with what the reader wants to see. Every one of the
-- eight money benchmarks today is USD-native — Ardent publishes in USD,
-- and Dan's implementation placeholders were stated in dollars — so the
-- column is uniformly 'USD' right now. It is here so that the first
-- EUR-native or GBP-native benchmark someone adds converts correctly
-- instead of being silently mislabelled, which is precisely the bug
-- being fixed. renderRoiPage() normalises everything to USD on the way
-- out; the client only ever converts from USD.
-- ================================================================

ALTER TABLE roi_benchmarks ADD COLUMN base_currency TEXT NOT NULL DEFAULT 'USD'
  CHECK (base_currency IN ('USD', 'GBP', 'EUR'));

CREATE TABLE IF NOT EXISTS roi_fx_rates (
  currency     TEXT PRIMARY KEY CHECK (currency IN ('USD', 'GBP', 'EUR')),
  usd_per_unit REAL NOT NULL,      -- how many USD one unit of `currency` buys
  as_of        TEXT NOT NULL,      -- ISO date; shown to the reader, not hidden
  source_url   TEXT
);

INSERT OR REPLACE INTO roi_fx_rates (currency, usd_per_unit, as_of, source_url) VALUES
  ('USD', 1.0,    '2026-08-11', NULL),
  ('GBP', 1.3511, '2026-08-11', 'https://www.exchange-rates.org/exchange-rate-history/gbp-usd-2026'),
  ('EUR', 1.1543, '2026-08-11', 'https://www.exchange-rates.org/exchange-rate-history/eur-usd-2026');

-- ---- the tooltip that used to describe the bug now describes the fix ----
DELETE FROM translations WHERE namespace = 'roi' AND lang = 'en'
  AND key IN ('help.cur', 'help.fx');

INSERT INTO translations (namespace, key, lang, value) VALUES

('roi', 'help.cur', 'en',
 'Changes the currency of every money figure on the page, including the benchmark defaults and any value you have overridden — switch to GBP and Ardent''s USD 9.84 becomes its sterling equivalent, not a relabelled 9.84. Conversion runs through a stored rate with a visible date rather than a live feed, so the same scenario gives the same answer twice and you can see how stale the rate is. Your own overrides are preserved in real terms: type a figure in one currency and it follows you into the next. Until 12 August 2026 this control changed only the symbol, which quietly overstated a GBP business case by about a third.'),

('roi', 'help.fx', 'en',
 'Benchmarks are held in their native currency — all of today''s are US dollars, because that is what Ardent Partners publishes in and how the implementation placeholders were stated — and converted for display at a stored spot rate. The rate and its date are shown rather than buried, because a business case that is reproducible next quarter is worth more than one that silently tracked the market. Updating the rate is a migration with a source, exactly like updating a benchmark. For anything you are going to sign, use your own treasury rate: put the figures straight in, in your own currency, and override the defaults.');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- Three currencies, with USD pinned at parity -- if the base row ever
-- drifts off 1.0 every figure on the page moves silently.
--
-- ASSERT: SELECT count(*) FROM roi_fx_rates = 3
-- ASSERT: SELECT usd_per_unit FROM roi_fx_rates WHERE currency = 'USD' = 1
-- ASSERT: SELECT usd_per_unit FROM roi_fx_rates WHERE currency = 'GBP' = 1.3511
