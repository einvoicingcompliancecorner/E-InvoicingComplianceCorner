-- ================================================================
-- The rework row stops asking for a price and starts asking for a
-- duration.
--
-- Dan: "how was the default rework amount estimated?" Then, on being
-- told: "I like the change to Average total resolution time for an
-- exception rework, instead of cost per rework. Especially if we have a
-- better citation to support it."
--
-- ---- THE ANSWER TO THE QUESTION, WHICH IS WHY THIS FILE EXISTS -------
--
-- It was not estimated. `rework_per_error` was seeded by migration 505 on
-- 11 August 2026 at 45, grade D, source_url NULL, and its own citation
-- said so plainly: "Our estimate. No analyst firm publishes a defensible
-- cost-per-exception figure." No migration in the 53 that followed
-- revisited it. There is no derivation to find.
--
-- Dan had ALREADY ASKED A VERSION OF THIS on 14 August -- "where did the
-- rework number come from. It's not something I have provided?" --
-- and migration 529 answered a different part of the same row. It turned
-- the bare `0.8` elimination literal into a graded, overridable input,
-- and it stopped the $45 labelling itself "your rework cost". The $45
-- itself got a new label and no new evidence. THE QUESTION WAS ANSWERED
-- HALFWAY AND THE HALF THAT WAS LEFT WAS THE NUMBER ITSELF.
--
-- ---- WHY TIME IS A BETTER QUESTION THAN MONEY -----------------------
--
-- "$45 per errored invoice" is a figure a reader can only accept or
-- reject. "How long does it take your team to sort out one bad invoice?"
-- is a question they can actually answer from their own experience.
--
-- It also inherits a graded input instead of inventing an ungraded one.
-- The money now comes from `loaded_fte_cost_entry` -- $54,000, grade B,
-- BLS Data Entry Keyers median loaded at the BLS employer-cost factor --
-- which is already on the page and already cited. Cost per error becomes
-- minutes x that rate rather than a number with nothing behind it.
--
-- ---- WHAT THE $45 WAS ACTUALLY CLAIMING -----------------------------
--
-- $54,000 / 2,080 h = $25.96/h = $0.4327 per minute.
--
--     $45 / $0.4327 = 104 minutes.
--
-- The old default asserted that ONE MIS-KEYED INVOICE TAKES ONE HOUR AND
-- FORTY-FOUR MINUTES of hands-on work to put right. Nobody ever wrote
-- that down, because nobody ever converted it. Stating an assumption in
-- units the reader cannot check is how it survives three months without
-- being argued with.
--
-- ---- THE CITATION, AND IT IS ONE WE ALREADY USE ---------------------
--
-- The Australian Taxation Office's Peppol eInvoicing value assessment
-- publishes per-exception CORRECTION TIME IN MINUTES for purchase
-- invoices -- on the same page this model already cites for
-- `ar_cost_per_invoice`:
--
--     contested payment       10%     20 min
--     processing exception    24%     15 min
--     late payment            48%      5 min
--     data accuracy          3.6%      5 min
--
-- It is LABOUR EFFORT, not elapsed time, and the page's own construction
-- proves it: the ATO converts these minutes to dollars using Australian
-- Bureau of Statistics wage data, which you cannot do to a duration that
-- includes waiting for a supplier to answer the phone.
--
-- DAN'S CHOICE OF THREE: processing exception, 15 minutes. The narrower
-- "data accuracy" line at 5 minutes is the closer match to this row's
-- NAME, but the row's help text has always described "chasing, re-keying,
-- re-approval" -- which is a processing exception, not a corrected
-- keystroke. The citation names all four rates and times so a reader who
-- means the narrow thing can set 5 and a reader with genuine supplier
-- disputes can set 20.
--
-- ---- THE TRAP THIS FILE WALKED UP TO AND DID NOT FALL INTO ----------
--
-- APQC publishes two measures that look perfect for this and are not:
--
--     average cycle time, exception detected to resolved   5.0 working
--                                                          days, n=461
--     cycle time to resolve an invoice error               4.0 calendar
--                                                          days, n=2,861
--
-- Bigger samples than the ATO has, from a source this page already
-- grades A elsewhere. Both are ELAPSED TIME -- APQC's own definition
-- says so -- and elapsed time cannot be multiplied by an FTE rate.
-- Doing it anyway gives $1,038 per exception, twenty-three times the
-- figure being replaced, and it would have looked impeccably sourced.
--
-- THAT IS MIGRATION 557'S DEFECT WEARING DIFFERENT CLOTHES: a real
-- citation, correctly quoted, measuring a different quantity from the
-- one the model needs. Two in three days. It is written down here
-- because the next person to improve this row will find those same two
-- APQC measures first, and they are the obvious thing to reach for.
--
-- ---- THE CROSS-POPULATION JOIN, STATED RATHER THAN HIDDEN -----------
--
-- The ATO puts its own data-accuracy exception rate at 3.6%. This model
-- uses HMRC's 10%. So the row now multiplies an ATO duration by an HMRC
-- rate -- two sources, two populations -- which is precisely the shape
-- of error 557 removed from the processing row.
--
-- Dan's call was to keep HMRC's 10% and SAY SO IN THE TOOLTIP rather
-- than switch both to the ATO's numbers, and the reasoning is that the
-- two are not the same measurement: HMRC's 10% is the rate at which
-- manual keying introduces an error, and the ATO's 3.6% is the rate at
-- which data-accuracy exceptions are RAISED. Not every keying error
-- becomes a raised exception. Silently adopting 3.6% would have looked
-- like tightening the evidence while quietly changing what the row
-- counts.
--
-- The single-source alternative stays on the table and is named in the
-- citation, because a reader who wants one methodology end to end
-- should be able to find that option rather than infer it.
--
-- ---- WHAT MOVES ------------------------------------------------------
--
--     cost per error       $45.00   ->  $6.49    (15 min x $0.4327)
--     rework row           $360,000 -> $51,920
--     savings table, full  $1,051,980 -> $743,900
--     savings table, saved $448,049 -> $448,049   (unchanged)
--
-- Both row figures are AFTER the 80% elimination assumption, which is
-- where this comment was wrong in its first draft: it quoted $450,000
-- and $64,904, the pre-elimination products, against a page that has
-- never displayed either. Read off the rendered row rather than
-- recomputed, which is the only way that error surfaces.
--
-- The headline on the DEFAULT compliance-only scope does not move at
-- all: this row has been held back from the saved column since migration
-- 529, on the grounds that it is the least evidenced row on the page and
-- the largest beneficiary of any change to itself. That reasoning is now
-- weaker -- the row is graded B on both its inputs where it was D on one
-- -- but whether to start banking it is a separate decision from this
-- one and is left alone here.
--
-- ---- AND A CONSISTENCY PROBLEM WORTH RECORDING ----------------------
--
-- The ATO's base purchase-invoice process is 7 + 2 + 7 + 5 = 21 minutes
-- of touch time, which implies 5,943 invoices per FTE-year. APQC
-- measures 12,000. The ATO's process times run about TWICE AS SLOW as
-- APQC's throughput implies, and this page uses both.
--
-- It does not invalidate the 15 minutes -- if anything it means the ATO
-- is the generous source, so the figure is not being talked down -- but
-- the two cannot both be right and the page now depends on each. Noted
-- rather than resolved.
-- ================================================================

-- Retire, don't delete: the old row keeps its trail, and a reader
-- comparing against a business case built before today can still find
-- what the page used to assume.
UPDATE roi_benchmarks SET active = 0 WHERE key = 'rework_per_error';

INSERT OR IGNORE INTO roi_benchmarks (key, default_value, unit, evidence_grade, source_url, source_year, is_cost, sort_order) VALUES
  ('rework_minutes', 15, 'count', 'B',
   'https://www.ato.gov.au/businesses-and-organisations/einvoicing/peppol-einvoicing-value-assessment/value-assessment-report/cost-calculations',
   '2016 estimates', 0, 4);

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Minutes to resolve one errored invoice',
  'ATO / Deloitte: 15 min for a processing exception',
  'Australian Taxation Office, <em>Peppol eInvoicing value assessment</em>. Purchase-invoice exceptions, with the average time attributed to correcting each: <strong>contested payment 20 min</strong> (10% of invoices), <strong>processing exception 15 min</strong> (24%), <strong>late payment 5 min</strong> (48%), <strong>data accuracy 5 min</strong> (3.6%). Defaulted to the 15-minute processing exception, because this row covers chasing, re-keying and re-approval rather than a corrected keystroke &mdash; set it to 5 if you mean only the keystroke, or 20 if your exceptions are genuinely contested.<br><br><strong>This is labour effort, not elapsed time.</strong> The ATO converts these minutes to money using Australian Bureau of Statistics wage data, which is only valid for hands-on time. APQC publishes larger samples for exception resolution &mdash; 5.0 working days (n=461) and 4.0 calendar days (n=2,861) &mdash; but both are <em>elapsed</em> by their own definition, and multiplying either by a wage rate would give roughly $1,000 per exception.<br><br><strong>Graded B, and the reason is the provenance rather than the publisher.</strong> The ATO is primary and free, but attributes the underlying estimates to Deloitte Access Economics and states they date to 2016; no sample size is published for the times themselves, and the Deloitte report is not publicly obtainable. Measured or modelled is not established &mdash; which is grade B behaviour, not A.<br><br><strong>Note the rate beside it comes from a different source.</strong> This model uses HMRC&rsquo;s 10% manual error rate; the ATO&rsquo;s own data-accuracy exception rate is 3.6%. They are not the same measurement &mdash; HMRC counts errors introduced by keying, the ATO counts exceptions raised &mdash; but if you want one methodology end to end, set the error rate to 3.6% as well.'
  FROM roi_benchmarks WHERE key = 'rework_minutes';

-- The input label, the basis sentence and the help text all named a
-- price. Generated from the renderer's fallbacks rather than retyped,
-- per the convention migration 521 taught this project.
INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'input.errMins', 'en', 'Minutes to resolve one error'),
  ('roi', 'ev.atoMins', 'en', 'ATO, 15 min per processing exception'),
  ('roi', 'ev.yourMins', 'en', 'your resolution time'),
  ('roi', 'ev.blsEntry', 'en', 'loaded data-entry rate'),
  ('roi', 'basis.rework2', 'en', '{0} {1} &times; {2} min {3} at {4}/h {5} &times; {6}% {7} {8}'),
  ('roi', 'help.errMins', 'en', 'How long it takes your team, hands on, to sort out one invoice that arrived with bad data &mdash; chasing the supplier, re-keying, getting it re-approved. Multiplied by the loaded data-entry rate below, so you set a duration and the page prices it. The ATO puts a processing exception at 15 minutes and a pure data-accuracy correction at 5; this is the input to change if your exceptions are mostly one or mostly the other. How MANY of these errors go away is a separate assumption, set beside this one.');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'rework_minutes' = 15
-- ASSERT: SELECT evidence_grade FROM roi_benchmarks WHERE key = 'rework_minutes' = 'B'
-- ASSERT: SELECT active FROM roi_benchmarks WHERE key = 'rework_per_error' = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('input.errMins','ev.atoMins','ev.yourMins','ev.blsEntry','basis.rework2','help.errMins') = 6
--
-- The citation must keep saying that the figure is effort rather than
-- elapsed time, and must keep naming the APQC measures it is NOT. That
-- warning is the whole reason this row is defensible: the two APQC
-- measures have bigger samples and a better-graded publisher, they are
-- the first thing anyone improving this row will find, and using either
-- would overstate the row twenty-three fold while looking better
-- sourced than what is there now.
--
-- ASSERT ALWAYS: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'rework_minutes' AND t.lang = 'en' AND t.citation LIKE '%elapsed%' = 1
--
-- And the cross-population join must stay disclosed. The row multiplies
-- an ATO duration by an HMRC rate; that is defensible and was chosen
-- deliberately, but only while the reader is told. An edit that tidied
-- this paragraph out of the citation would leave the page doing exactly
-- what migration 557 existed to stop it doing, with no visible trace.
--
-- ASSERT ALWAYS: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'rework_minutes' AND t.lang = 'en' AND t.citation LIKE '%3.6%' = 1

-- ---- the keys this orphans ------------------------------------------
-- `input.errCost` named a price, `basis.rework` had a slot for one, and
-- `help.errCost` explained one. `ev.ourEstimate` and `ev.yourRework`
-- were the two halves of a label that only existed because the figure
-- was ungraded; the new row is graded B whether or not the reader
-- changes it, so "our estimate, not yours" is no longer true.
DELETE FROM translations WHERE namespace = 'roi' AND key IN
  ('input.errCost', 'basis.rework', 'help.errCost', 'ev.ourEstimate', 'ev.yourRework');

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('input.errCost','basis.rework','help.errCost','ev.ourEstimate','ev.yourRework') = 0
