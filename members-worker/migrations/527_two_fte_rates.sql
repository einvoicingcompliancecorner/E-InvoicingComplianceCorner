-- ================================================================
-- Two FTE rates, because there were always two jobs.
--
-- Dan: "I'd like to have two FTE rates displayed under the assumptions
-- and benchmarks then. One loaded FTE rate for data entry, and a second
-- loaded FTE rate for an accounting clerk / tax professional. Savings can
-- be calculated on invoice entry for one, and tax determination for 2."
--
-- HOW THIS WAS FOUND. Dan said $62,000 looked high. It did — for the role
-- he had in mind, which is the mailroom and data-entry work e-invoicing
-- actually removes. But the field drove `l2`, which models reduced TAX
-- REPORTING AND AUDIT-PREP effort: a qualified tax or finance person. For
-- that role $62,000 is wrong by nearly half in the other direction. One
-- field was pricing two roles that differ by a factor of two and offshore
-- completely differently — nobody moves their tax function to Manila, and
-- plenty of people move capture there.
--
-- I also got this wrong first time and Dan corrected it: I had priced
-- bookkeeping clerks, and the role being displaced is more junior than
-- that. Data Entry Keyers is the right occupation.
--
-- THE WAGE ARITHMETIC, from primary government statistics:
--
--   US BLS, Occupational Employment and Wage Statistics
--     Data Entry Keyers (43-9021), May 2023   median  $37,790
--     Accountants and Auditors (13-2011), May 2024    $81,680
--   US BLS, Employer Costs for Employee Compensation, March 2026
--     private industry wages = 69.9% of total compensation, so the
--     employer's cost is wages / 0.699 = x1.43
--
--   data entry     37,790 x 1.43 = 54,040  -> 54,000
--   tax / finance  81,680 x 1.43 = 116,802 -> 116,800
--
-- Both are graded B rather than A. Every input is BLS primary, but the
-- multiplication is OURS — the same reasoning that grades
-- `ar_cost_per_invoice` at B because the AR split is our derivation and
-- not the ATO's published number. Consistency matters more than the
-- flattering grade.
--
-- AND THE CAP MOVES AT THE SAME TIME, 0.36 -> 0.20. These two numbers are
-- multiplied together, so correcting one without the other compounds the
-- error rather than fixing it. Raising the rate alone would have taken
-- the EU preset from $186,000 to $350,400 and payback from 71 months to
-- 26 — nearly doubling the business case on the back of a correction to
-- one input while the weaker assumption beside it sat untouched. Together
-- they land at $194,667 and 65 months, within a whisker of where the page
-- already was, with both components now individually defensible.
--
-- 36% meant 36% of the entire AP function saved on tax reporting alone. A
-- business with 100,000 invoices might have two to five tax people across
-- all taxes; we were claiming e-invoicing removes most of the tax
-- function. 20% is 1.67 FTE across 25 clearance jurisdictions — about
-- three weeks a year each of reduced reconciliation and audit-sample
-- preparation, which is defensible in a room.
--
-- ON "SAVINGS CALCULATED ON INVOICE ENTRY". The data-entry rate does NOT
-- add a benefit row, and this is deliberate. The ATO / Deloitte source
-- this page already cites states that most of the paper and PDF invoice
-- cost "is attributable to the manual work required to enter the invoice
-- data into your systems" — the per-invoice benchmark IS the labour. An
-- FTE-priced saving beside the processing-cost row would count the same
-- money twice, and "isn't that the same as your processing saving?" is
-- the first question a finance committee asks.
--
-- Instead it decomposes a number already in the model into people, which
-- is what anyone actually acts on: nobody approves a programme on
-- "$590,400 of processing cost", they approve it on "two of your
-- three-and-a-half capture heads". The page states the equivalence
-- explicitly, and reports what share of the top line the capture
-- headcount accounts for — about 20% on the defaults, which is itself
-- worth knowing.
-- ================================================================

-- ---- the tax / finance rate: corrected, regraded, and renamed --------
UPDATE roi_benchmarks
   SET default_value = 116800, evidence_grade = 'B',
       source_url = 'https://www.bls.gov/ooh/business-and-financial/accountants-and-auditors.htm',
       source_year = 'May 2024 wages, March 2026 loading'
 WHERE key = 'loaded_fte_cost';

UPDATE roi_benchmark_translations SET
  label = 'Loaded cost / tax or finance FTE',
  hint  = 'BLS median wage, loaded at the BLS employer-cost factor',
  citation = 'US Bureau of Labor Statistics, Occupational Employment and Wage Statistics: accountants and auditors, median annual wage <strong>$81,680</strong> (May 2024). Loaded at <strong>&times;1.43</strong>, derived from BLS Employer Costs for Employee Compensation (March 2026), where wages and salaries are 69.9% of total compensation for private industry workers &mdash; so the employer''s cost is wages / 0.699. Gives <strong>$116,800</strong>. Graded B rather than A because both inputs are BLS primary but <strong>the multiplication is ours</strong>, the same basis on which the AR cost per invoice is graded B. This is the rate for the person doing tax reporting and audit preparation, <em>not</em> the person keying invoices &mdash; those are different jobs at roughly double the price, and until 14 August 2026 one field priced both. Overhead beyond statutory employer costs is not included; add it if your own loaded rate carries it.'
 WHERE lang = 'en' AND benchmark_id = (SELECT id FROM roi_benchmarks WHERE key = 'loaded_fte_cost');


-- ---- the data-entry rate: new ----------------------------------------
INSERT OR IGNORE INTO roi_benchmarks (key, default_value, unit, evidence_grade, source_url, source_year, is_cost, sort_order) VALUES
  ('loaded_fte_cost_entry', 54000, 'currency', 'B',
   'https://www.bls.gov/oes/2023/may/oes439021.htm', 'May 2023 wages, March 2026 loading', 0, 6);

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Loaded cost / data-entry FTE',
  'BLS median wage, loaded at the BLS employer-cost factor',
  'US Bureau of Labor Statistics, Occupational Employment and Wage Statistics: <strong>Data Entry Keyers</strong> (SOC 43-9021), median annual wage <strong>$37,790</strong> (May 2023); tenth percentile $28,250, ninetieth $55,330. Loaded at <strong>&times;1.43</strong> from BLS Employer Costs for Employee Compensation (March 2026) gives <strong>$54,000</strong>. Graded B: BLS inputs, our multiplication. <strong>This is a US in-house figure and capture is the most offshored function in finance</strong> &mdash; a shared-service centre in Krak&oacute;w, Lisbon or Manila will be materially lower, and a reader who knows their own rate should use it. Note also that BLS projects this occupation to decline 6% to 2034 and attributes the decline to automation of routine accounting tasks, which is the same effect this model is pricing.'
  FROM roi_benchmarks WHERE key = 'loaded_fte_cost_entry';


-- ---- what share of AP effort is capture and keying -------------------
-- From the ATO / Deloitte purchase-invoice task times, which is the same
-- source already behind the AR cost per invoice on this page.
INSERT OR IGNORE INTO roi_benchmarks (key, default_value, unit, evidence_grade, source_url, source_year, is_cost, sort_order) VALUES
  ('capture_share_of_ap', 0.4286, NULL, 'A',
   'https://www.ato.gov.au/businesses-and-organisations/einvoicing/peppol-einvoicing-value-assessment/value-assessment-report/cost-calculations',
   '2016 estimates', 0, 12);

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Capture and validation share of AP effort', 'ATO / Deloitte purchase-invoice task times',
  'Australian Taxation Office / Deloitte Access Economics, <em>Peppol eInvoicing value assessment</em>: the purchase-invoice process is broken into receipt 7 minutes, validation 2, review 7 and approval 5 &mdash; 21 minutes in total, of which <strong>9 minutes (43%) is receipt and validation</strong>, the capture-and-key work e-invoicing removes. The same page states that most of the paper and PDF cost &ldquo;is attributable to the manual work required to enter the invoice data into your systems&rdquo;, which is why the per-invoice benchmark cannot ALSO be counted as an FTE saving. Review and approval are business-side and are not assumed to go away. ATO states these times date from 2016.'
  FROM roi_benchmarks WHERE key = 'capture_share_of_ap';


-- ---- the ceiling, corrected alongside the rate it multiplies ---------
UPDATE roi_benchmarks SET default_value = 0.20 WHERE key = 'tax_effort_cap';

UPDATE roi_benchmark_translations SET
  citation = 'A ceiling on the per-jurisdiction rate, because the magnitude is an assumption and an uncapped assumption runs away: no more than <strong>20%</strong> of the AP effort implied by your volume is credited, however many jurisdictions are selected. Reduced from 36% on 14 August 2026 <strong>at the same time as the tax FTE rate rose from $62,000 to $116,800</strong>, because the two are multiplied together and correcting one without the other compounds the error rather than fixing it. 36% meant most of a tax function removed by e-invoicing alone, which is not defensible; 20% is about 1.67 FTE across 25 clearance jurisdictions, roughly three weeks a year each of reduced reconciliation and audit-sample preparation. Still ours, still grade D, and still the number to argue with first.'
 WHERE lang = 'en' AND benchmark_id = (SELECT id FROM roi_benchmarks WHERE key = 'tax_effort_cap');


INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'input.fteEntry', 'en', 'Loaded cost / data-entry FTE'),
  ('roi', 'help.fteEntry', 'en',
   'Fully loaded annual cost of the data-entry, keying or mailroom role that receives and captures supplier invoices — salary plus employer costs. This is the job e-invoicing actually removes, and it is deliberately separate from the tax or finance rate beside it: the two differ by roughly double, and capture is the most offshored function in finance while tax reporting is one of the least. It does NOT add a saving of its own. It restates the processing-cost reduction already counted above in headcount terms, because the per-invoice benchmark is labour-dominated and counting both would count the same money twice.'),
  ('roi', 'res.headcount.h', 'en', 'What this means in headcount.'),
  ('roi', 'res.headcount.same', 'en', '<strong>This is the same money as the processing-cost row above, expressed as people &mdash; not an additional saving.</strong> The per-invoice benchmark is labour-dominated, so counting both would count it twice.'),
  ('roi', 'res.headcount.gap', 'en', 'Worth noticing how much of the top line it accounts for:'),
  ('roi', 'res.headcount.gap2', 'en', 'The rest is the review-and-approve half of the process, technology and overhead &mdash; all inside the per-invoice benchmark, none of it a data-entry head. And released capacity is only cash if the post goes or is not backfilled, which is a decision rather than a benefit.');

-- The input's own label, which lives in `translations` rather than in the
-- benchmark row and would otherwise still say "finance FTE" beside a
-- field that now means something narrower. roi-i18n.mjs caught this: it
-- asserts D1 and the inline fallback are character-identical, and the
-- fallback had already been changed in the same commit.
UPDATE translations SET value = 'Loaded cost / tax or finance FTE'
 WHERE namespace = 'roi' AND key = 'input.fteCost' AND lang = 'en';

-- Existing help text for the tax rate no longer describes the right role.
UPDATE translations SET value =
 'Fully loaded annual cost of a tax or finance FTE — salary plus employer costs. Used only in the indirect section, where the model assumes reduced tax-reporting and audit-preparation effort per clearance or reporting jurisdiction, capped so the assumption cannot run away. This is deliberately NOT the rate for the data-entry role beside it: e-invoicing displaces keying, but the effort that falls here belongs to whoever reconciles to the tax authority, which is roughly twice the price and almost never offshored. The mechanism is evidenced by the OECD; the magnitude is ours, and it is capped precisely because it is not evidenced.'
 WHERE namespace = 'roi' AND key = 'help.fteCost' AND lang = 'en';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'loaded_fte_cost' = 116800
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'loaded_fte_cost_entry' = 54000
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'tax_effort_cap' = 0.2
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'capture_share_of_ap' = 0.4286
-- ASSERT: SELECT evidence_grade FROM roi_benchmarks WHERE key = 'loaded_fte_cost' = 'B'
-- ASSERT: SELECT value FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'input.fteCost' = 'Loaded cost / tax or finance FTE'
-- ASSERT: SELECT count(*) FROM roi_benchmarks WHERE active = 1 = 21
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key NOT LIKE 'help.%' = 120
--
-- The pair claim, as arithmetic. The whole argument for touching the cap
-- in the same migration as the rate is that they multiply; if a later
-- edit moves one and not the other, this is what says so. 8.333 implied
-- FTE at the reference volume x 0.20 x 116,800 = 194,667.
--
-- ASSERT: SELECT round((100000.0 / (SELECT default_value FROM roi_benchmarks WHERE key = 'ap_invoices_per_fte')) * (SELECT default_value FROM roi_benchmarks WHERE key = 'tax_effort_cap') * (SELECT default_value FROM roi_benchmarks WHERE key = 'loaded_fte_cost'), 0) = 194667
--
-- Content, because a count cannot see whether the two rates still say
-- which role they are for. That confusion is the entire defect this
-- migration exists to fix, and it would reappear silently.
--
-- ASSERT: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'loaded_fte_cost' AND t.lang = 'en' AND t.citation LIKE '%not%the person keying invoices%' = 1
-- ASSERT: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'loaded_fte_cost_entry' AND t.lang = 'en' AND t.citation LIKE '%most offshored function%' = 1
--
-- A standing invariant. The two rates exist because they are different;
-- if a later edit ever makes them equal, the distinction has been lost
-- and one field is doing two jobs again.
--
-- ASSERT ALWAYS: SELECT count(*) FROM roi_benchmarks a JOIN roi_benchmarks b ON b.key = 'loaded_fte_cost_entry' WHERE a.key = 'loaded_fte_cost' AND a.default_value <= b.default_value = 0
