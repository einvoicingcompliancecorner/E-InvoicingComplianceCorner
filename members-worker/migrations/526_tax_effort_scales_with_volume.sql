-- ================================================================
-- The indirect layer learns how big the business is.
--
-- Dan: "Does our FTE cost scale in todays calculator. When I change the
-- invoice volume to 1000000 invoices, how are the FTE savings
-- incorporated into the outputs?"
--
-- They were not. At all. The calculation read:
--
--     taxFteSaved = min(complexCount * 0.15, 3)
--
-- Two invented absolutes, neither of which knew how many invoices the
-- business processes. Measured on the EU preset:
--
--                        100k AP invoices    1,000,000 AP invoices
--   direct (unlocked)         $1,145,400              $11,454,000
--   INDIRECT (this line)        $186,000                 $186,000
--   annual run cost              $90,000                 $630,000
--   net annual, compliance      +$96,000                -$444,000
--   payback                    71 months             never (n/a)
--
-- Direct savings rose tenfold; the indirect line did not move one dollar.
-- And because migration 524 made the platform fee scale with volume, the
-- compliance-only case flipped sign and reported that the programme never
-- pays back. 524 did not cause that — the frozen benefit did — but it
-- turned a hidden defect into a visibly wrong answer, which is the best
-- thing a change can do to a latent bug.
--
-- THE FIX: stop counting FTE in absolute terms and start counting them as
-- a share of the AP headcount the volume implies. APQC publishes a median
-- of 12,000 invoices per AP FTE per year — grade A, primary, attributable,
-- and the only citable bridge from invoice volume to headcount that
-- survived checking. Everything else on offer was vendor content
-- marketing, including the ubiquitous and entirely unsourced claim that
-- "80% of AP time is data entry".
--
-- The two ratios below are still ours and still grade D. What changed is
-- that they are DIMENSIONLESS — a share of a benchmarked base rather than
-- a headcount pulled out of the air — so the answer scales with the
-- business instead of standing still.
--
-- CALIBRATED FOR EXACT CONTINUITY, DELIBERATELY. At the page's default
-- 100k AP volume these reproduce the old constants to the penny:
--
--     implied AP FTE      100,000 / 12,000 = 8.333
--     per jurisdiction    8.333 * 0.018    = 0.15   (was 0.15)
--     cap                 8.333 * 0.36     = 3.00   (was 3)
--     cap starts binding  0.36 / 0.018     = 20 jurisdictions (was 20)
--
-- Nothing a reader saw yesterday moves. This migration changes the SHAPE
-- of the model, not its magnitude, because doing both at once would make
-- it impossible to tell which one moved a number.
--
-- THE MAGNITUDE IS A SEPARATE, OPEN QUESTION. 0.36 means 36% of the entire
-- AP function saved on tax reporting and audit prep alone, which is hard
-- to defend. It was exactly as hard to defend yesterday — it was just
-- invisible, because a headcount of "3" does not announce what proportion
-- of anything it represents. Expressing it as a proportion is what made it
-- arguable, and tuning it is now one UPDATE rather than a code change.
-- ================================================================

INSERT OR IGNORE INTO roi_benchmarks (key, default_value, unit, evidence_grade, source_url, source_year, is_cost, sort_order) VALUES
  ('ap_invoices_per_fte', 12000, 'count', 'A',
   'https://www.apqc.org/what-we-do/benchmarking/open-standards-benchmarking/measures/number-invoices-processed-fte-1',
   'Open Standards Benchmarking', 0, 9),
  ('tax_effort_per_jurisdiction', 0.018, NULL, 'D', NULL, NULL, 0, 10),
  ('tax_effort_cap',              0.36,  NULL, 'D', NULL, NULL, 0, 11);

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Invoices per AP FTE per year', 'APQC Open Standards Benchmarking median',
  'APQC Open Standards Benchmarking, measure &ldquo;number of invoices processed per FTE that performs the process process accounts payable&rdquo;: <strong>median 12,000 per FTE per year</strong>. Primary, attributable and publicly stated on the measure page; the quartile values sit behind APQC membership and are not used here. APQC separately reports that top performers are around five times more productive than bottom performers, so a single median hides a very wide spread &mdash; it is used in this model only to give invoice volume a defensible relationship to headcount, never to assert what any particular business should be running.'
  FROM roi_benchmarks WHERE key = 'ap_invoices_per_fte';

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Tax effort in scope per jurisdiction', 'PLACEHOLDER &mdash; our assumption, as a ratio',
  'Our assumption, not a benchmark: each clearance or invoice-level-reporting jurisdiction is modelled as putting 1.8% of the AP effort implied by your volume into scope for reduced tax reporting and audit preparation. Nothing is claimed for it. It is expressed as a RATIO rather than a headcount so that it scales with the size of the business; at the page default of 100,000 AP invoices it is identical to the flat 0.15 FTE per jurisdiction it replaces.'
  FROM roi_benchmarks WHERE key = 'tax_effort_per_jurisdiction';

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Tax effort ceiling', 'PLACEHOLDER &mdash; our assumption, as a ratio',
  'A ceiling on the above, because the magnitude is an assumption and an uncapped assumption runs away: no more than 36% of the AP effort implied by your volume is credited, however many jurisdictions are selected. It binds at 20 clearance jurisdictions, which both the EU preset and the everywhere-with-a-mandate preset exceed &mdash; so the page now says out loud when the cap is active, which it previously did not. <strong>36% is high and known to be high.</strong> It is carried forward unchanged only so that this migration changes the model''s shape without also changing its magnitude.'
  FROM roi_benchmarks WHERE key = 'tax_effort_cap';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'ap_invoices_per_fte' = 12000
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'tax_effort_per_jurisdiction' = 0.018
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'tax_effort_cap' = 0.36
-- ASSERT: SELECT count(*) FROM roi_benchmarks WHERE active = 1 = 19
--
-- The continuity claim, as arithmetic rather than prose. If someone edits
-- any of the three values without meaning to change what the page showed
-- before this migration, these are the checks that will say so. 12000 is
-- the reference volume divided by the implied headcount; the two products
-- below must land on the old constants exactly.
--
-- ASSERT: SELECT round((100000.0 / (SELECT default_value FROM roi_benchmarks WHERE key = 'ap_invoices_per_fte')) * (SELECT default_value FROM roi_benchmarks WHERE key = 'tax_effort_per_jurisdiction'), 4) = 0.15
-- ASSERT: SELECT round((100000.0 / (SELECT default_value FROM roi_benchmarks WHERE key = 'ap_invoices_per_fte')) * (SELECT default_value FROM roi_benchmarks WHERE key = 'tax_effort_cap'), 4) = 3.0
--
-- NOTE ON MIGRATION 525. Its standing invariant lists the grade-A keys the
-- renderer is allowed to carry, and `ap_invoices_per_fte` is a new grade-A
-- key. That list has been extended by hand in 525 itself — an
-- assertion-comment edit only, no executable change, so the replay is
-- byte-identical and `--refresh-checksums` re-records it. Editing an
-- applied migration is normally the thing this repository refuses to do;
-- it is allowed here for exactly the reason the list was made
-- hand-maintained in the first place, which is that adding a key to it
-- should be a deliberate act at the moment the renderer starts using it.
