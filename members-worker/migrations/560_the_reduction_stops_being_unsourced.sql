-- ================================================================
-- The 60-80% range gets its first independent support, and the AR
-- benchmark loses a grade it should never have had.
--
-- This file was scoped as "re-ground the AP benchmark on the ATO's
-- channel measurement instead of Ardent's blend", which is what the
-- design review had recommended and what Dan asked for. READING THE
-- PRIMARY SOURCE PROPERLY KILLED THAT PLAN AND REPLACED IT WITH A
-- BETTER ONE, and the reasoning is the point of this comment.
--
-- ---- WHY THE PROPOSED CHANGE WAS A DOWNGRADE ------------------------
--
-- The ATO publishes cost per invoice by channel, which is structurally
-- exactly what this model wants: no blend, so no decomposition, so
-- `market_einvoice_share` could retire and migration 557's arithmetic
-- would simplify. That is a real attraction and it is why it was on the
-- list.
--
-- It is also a swap of a better source for a worse one:
--
--                       Ardent                    ATO / Deloitte
--   vintage             2025 data                 2016 estimates
--   geography           US market                 Australia
--   sample              204 AP professionals      none published
--   currency            USD, page-native          AUD, needs a rate
--                                                 the page does not have
--   primary obtainable  yes, free                 no -- the Deloitte
--                                                 report is not public
--   grade               A                         B at best
--
-- The AP manual cost would have moved from $14.23 to roughly $11-12,
-- cutting the headline a second time in a day -- for a reason that is
-- EVIDENCE QUALITY GOING DOWN rather than an error being corrected. A
-- model that gets quieter every time you improve it is fine; a model
-- that gets quieter because you swapped in a weaker source is not the
-- same thing, and telling them apart afterwards is impossible.
--
-- Dan's call from three options: the ATO corroborates, Ardent stays.
--
-- ---- WHAT THE ATO ACTUALLY GIVES US ---------------------------------
--
-- Per-invoice cost by channel, which the page states is "a shared cost
-- estimate between the invoice sender and receiver":
--
--     paper       AUD 30.87
--     PDF         AUD 27.67
--     eInvoice    AUD  9.18
--
-- The ratio is scale-free, so it survives both the currency and the
-- sender/receiver split untouched:
--
--     paper -> eInvoice    70.3% reduction
--     PDF   -> eInvoice    66.8% reduction
--
-- THAT LANDS INSIDE HMRC'S 60-80% RANGE, and it is the first thing this
-- page has ever had that supports that range from measurement rather
-- than from assertion. HMRC's own words are "industry estimates suggest"
-- with no study named -- verified against the primary consultation.
-- Ardent publishes the same range for full AP automation. Until today
-- every source for this number was either unattributed or describing a
-- different programme.
--
-- The default STAYS AT 60. The ATO would support 67; taking it would
-- raise the headline about 12%, and a range whose bottom is now
-- corroborated is a better place to sit than its middle. What changes is
-- that 60 is a conservative floor under a supported range rather than an
-- arbitrary pick from an unsupported one.
--
-- ---- AND A GRADE THAT WAS WRONG -------------------------------------
--
-- `ar_cost_per_invoice` has been graded B since migration 505 with this
-- reason attached: "the split to an AR-only figure is OUR DERIVATION,
-- not the ATO's published number."
--
-- The ATO publishes the split. It is on the same page, three sentences
-- below the channel costs: "How this cost is split between accounts
-- payable and accounts receivable can vary substantially. For the
-- purposes of this assessment 40% of this cost is attributed to the
-- accounts receivable process and 60% to accounts payable."
--
-- So the stated reason for the B grade is not true and has not been true
-- since the row was created. This is the dead-data pattern in a third
-- form: not an orphaned row, not prose that outlived its model, but A
-- CITATION THAT MISDESCRIBES ITS OWN SOURCE -- and, being a caveat
-- rather than a claim, it made the page look MORE careful than it was
-- while being wrong.
--
-- THE GRADE STAYS AT B ANYWAY, for reasons the old citation never gave:
-- the figures are 2016, Australian, carry no sample size, and the
-- currency conversion into USD genuinely is ours. Same letter, honest
-- reason. The correction matters because the old reason would have been
-- "fixed" by someone finding the split sentence, and they would then
-- have promoted a 2016 unsampled estimate to grade A.
-- ================================================================

-- The ATO's own AP/AR split, published rather than derived. Held as a
-- benchmark so the AR citation can point at a row instead of restating
-- a number, and so a future reader can see it was 60/40 on the day.
INSERT OR IGNORE INTO roi_benchmarks (key, default_value, unit, evidence_grade, source_url, source_year, is_cost, sort_order) VALUES
  ('ato_ap_cost_share', 0.60, NULL, 'B',
   'https://www.ato.gov.au/businesses-and-organisations/einvoicing/peppol-einvoicing-value-assessment/value-assessment-report/cost-calculations',
   '2016 estimates', 0, 13);

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'AP share of total invoice cost', 'ATO splits the shared cost 60 AP / 40 AR',
  'Australian Taxation Office, <em>Peppol eInvoicing value assessment</em>: the per-invoice costs it publishes are <strong>a shared cost estimate between the invoice sender and receiver</strong>, and the ATO states that &ldquo;for the purposes of this assessment 40% of this cost is attributed to the accounts receivable process and 60% to accounts payable&rdquo;. Held here because two other figures on this page rest on it. Graded B, not A: the ATO publishes the split without a sample size and states the underlying estimates date from 2016.'
  FROM roi_benchmarks WHERE key = 'ato_ap_cost_share';

-- The reduction range, corroborated. Same figure, same grade, a
-- completely different evidential position.
UPDATE roi_benchmark_translations SET
  hint = 'HMRC 60-80%; ATO channel data implies 67-70%',
  citation = 'HMRC / DBT consultation, 13 Feb 2025: &ldquo;Industry estimates suggest that moving to e-invoicing reduces invoicing costs by 60-80%.&rdquo; <strong>HMRC names no study</strong> &mdash; checked against the primary consultation &mdash; and Ardent Partners publishes the same range for <em>full AP automation compared to manual and paper-based methods</em>, which is a larger programme than compliance alone.<br><br><strong>The range is nonetheless supported, by an independent channel measurement.</strong> The ATO''s Peppol value assessment prices a paper invoice at AUD 30.87, a PDF at 27.67 and an eInvoice at 9.18. Those ratios imply a <strong>70.3% reduction from paper and 66.8% from PDF</strong> &mdash; scale-free, so the currency and the sender/receiver split do not affect them, and squarely inside HMRC''s range. Two unrelated sources, two methods, one answer.<br><br><strong>Defaulted to 60%, the floor rather than the middle.</strong> The ATO would support 67%. A conservative figure under a corroborated range is a better place to sit than the centre of one, and this input is yours to raise if your baseline is genuinely paper.'
 WHERE lang = 'en' AND benchmark_id = (SELECT id FROM roi_benchmarks WHERE key = 'cost_reduction_pct');

-- The AR grade keeps its letter and loses its false reason.
UPDATE roi_benchmark_translations SET
  citation = 'Derived from the Australian Taxation Office / Deloitte Access Economics <em>Peppol eInvoicing value assessment</em>: paper AUD 30.87, PDF AUD 27.67, eInvoice AUD 9.18, which the ATO states is <strong>a shared cost estimate between the invoice sender and receiver</strong>. The ATO also publishes the split &mdash; <strong>40% to accounts receivable, 60% to accounts payable</strong> &mdash; so the AR share is the ATO''s own attribution, not ours.<br><br><strong>Graded B, and until 16 August 2026 for the wrong reason.</strong> The citation used to say the B grade was because splitting to an AR-only figure was our derivation. It is not: the ATO publishes that split, on the same page. The real reasons are that the estimates are Australian, date from 2016, carry no published sample size, and the conversion into US dollars is ours. Same grade, stated honestly &mdash; and worth correcting, because anyone who found the split sentence would reasonably have promoted this row to A on the strength of the old wording.'
 WHERE lang = 'en' AND benchmark_id = (SELECT id FROM roi_benchmarks WHERE key = 'ar_cost_per_invoice');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'ato_ap_cost_share' = 0.6
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'cost_reduction_pct' = 60
-- ASSERT: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'cost_reduction_pct' AND t.citation LIKE '%70.3%' = 1
-- ASSERT: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'ar_cost_per_invoice' AND t.citation LIKE '%not ours%' = 1
-- ASSERT: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'ar_cost_per_invoice' AND t.citation LIKE '%rather than A because the split%' = 0
--
-- That last one matches the OLD SENTENCE rather than the phrase "our
-- derivation", which was the first draft and which failed against this
-- file's own text: the new citation quotes the old claim in order to
-- correct it. An assertion that cannot tell a claim from a description
-- of a retracted claim is too blunt to be useful, and the replay caught
-- it immediately -- which is the mechanism working on the person
-- writing the mechanism.
--
-- The default must not drift upward on the strength of the
-- corroboration. That is the specific risk this file creates: having
-- shown that 67% is supportable, the obvious next edit is to take it,
-- and the whole argument above is for holding the floor instead. If
-- someone decides to raise it later that should be a migration with its
-- own reasoning, not a number that crept.
--
-- ASSERT ALWAYS: SELECT count(*) FROM roi_benchmarks WHERE key = 'cost_reduction_pct' AND default_value <= 60 = 1
--
-- And HMRC's citation must keep saying that HMRC cites nobody. That
-- sentence is the reason this page can claim to grade evidence rather
-- than collect it, and it is the first thing that would be tidied away
-- by an editor making the tooltip shorter.
--
-- ASSERT ALWAYS: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'cost_reduction_pct' AND t.lang = 'en' AND t.citation LIKE '%names no study%' = 1
