-- ================================================================
-- The reasoning panel stops arguing and starts explaining.
--
-- Dan: "could you read through the reasoning section and check the
-- language used is appropriate for a visitor first time reading. Maybe
-- I'm biased, but it reads like a defence statement, rather than an
-- informative message."
--
-- He is right, and it is measurable. Four tells, counted across the 31
-- strings in that panel before this file:
--
--   NEGATION-LED         "Nothing is claimed for these", "not our
--                        judgement", "it does not add", "carries no
--                        value on purpose", "not strong enough to lead
--                        with". The reader learns what the page is not
--                        doing before what it is.
--   ARGUES WITH SOMEONE  "so the model can be argued with rather than
--                        believed", "the honest conclusion", "three
--                        DEFENSIBLE methods", "what this model MAY
--                        CLAIM", "circular by construction". Answers to
--                        challenges a first-time reader has not made.
--   COURTROOM VOCABULARY claimed, credited, ceiling, held back, exposed.
--   SELF-REFERENTIAL     "this page", "this model", "the route this page
--                        takes" -- to someone who arrived ninety seconds
--                        ago, the page is not yet a character.
--
-- ---- WHY IT HAPPENED, WHICH IS THE USEFUL PART ----------------------
--
-- Every one of these strings was written DURING an argument. The rework
-- note exists because Dan asked where the number came from. The
-- unmonetised note exists because an evidence audit found the NHS figure
-- was one anecdote. The bracket note exists because a proposal to triple
-- the compliance share was rejected.
--
-- Each was, at the moment it was written, a correct answer to a real
-- challenge. Kept, they became the transcript of a defence -- and a
-- reader who arrives with no challenge in mind meets a page bracing for
-- one. That is the same failure as the caveat sprawl in 556 and the
-- nine-shaped basis column in 564: written one at a time, in context,
-- never read cold by someone who was not in the conversation.
--
-- ---- WHAT CHANGED AND WHAT DID NOT ---------------------------------
--
-- Register, not content. Every source, every grade, every "this is ours
-- rather than measured" and every conservative-choice disclosure is
-- still there. Lead with what is true, then how we know, then the limit.
--
--   "Nothing is claimed for these; they are exposed so the model can be
--    argued with rather than believed."
--   -> "These are our starting estimates, shown so you can replace them
--       with your own."
--
-- Same fact. The first defends the page; the second tells the reader
-- what to do.
--
-- Headings moved the furthest, because three of four were answering an
-- accusation: "Why rework is held back" -> "Rework sits outside the
-- total"; "Headcount restates, it does not add" -> "The same saving,
-- counted in people"; "What carries no value on purpose" -> "Named, but
-- not priced".
--
-- Net effect on length: 3,589 characters to 3,418. Not the point, but
-- worth noting that the defensive version was also the longer one.
--
-- ---- AND A STALE LINE THE READ-THROUGH CAUGHT -----------------------
--
-- The grade-D card listed "Rework cost per errored invoice". Migration
-- 558 replaced that input with a RESOLUTION TIME in minutes eight hours
-- earlier, so the card named a field that no longer exists. Prose
-- outliving its model again -- found by reading the panel end to end for
-- a different reason entirely, which is the only detector this class has
-- ever had.
-- ================================================================

UPDATE translations SET value = 'Structured invoices arrive ready to post and leave already cleared, so the capture and issuing work goes with the integration itself. Review and approval are workflow decisions, and changing those is a separate programme. The ATO&rsquo;s task times set the split: receipt 7 minutes and validation 2, against review 7 and approval 5. Tax reporting is saved on either scope, because you file structured data to the authority whether or not AP workflow ever changes.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.banks';

UPDATE translations SET value = 'Rework sits outside the total'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.rework.h';

UPDATE translations SET value = 'This row rests on the three figures we are least sure of: HMRC&rsquo;s 10% error rate, published without a source; the time you tell us one fix takes; and our estimate of how many errors structured data removes. So it is shown in full and left out of the total. Ardent evidences the mechanism without quantifying it, and their 9.8-point gap between best-in-class and average exception rates sets the ceiling used here.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.rework';

UPDATE translations SET value = 'The same saving, counted in people'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.headcount.h';

UPDATE translations SET value = 'The capture-FTE figure shows the processing-cost saving as people instead of money. It is one saving in two units &mdash; the per-invoice benchmark is mostly labour, so adding both would count it twice.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.headcount';

UPDATE translations SET value = 'Released time becomes cash only if the role goes, or is not backfilled.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.headcount2';

UPDATE translations SET value = 'Named, but not priced'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.unmonetised.h';

UPDATE translations SET value = 'Paper and postage, because your own spend beats any average. Cycle time and supplier queries, because no study separates the part e-invoicing causes &mdash; Ardent&rsquo;s own'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.unmonetised';

UPDATE translations SET value = 'compares the most automated quartile with everyone else, and the'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.unmonetised2';

UPDATE translations SET value = 'comes from one unnamed organisation. VAT leakage, penalty exposure and fraud have real mechanisms and no measured magnitudes. They belong in the qualitative case alongside this number.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.unmonetised3';

UPDATE translations SET value = 'Three methods give three answers for what a compliance-only programme saves, as a share of the manual AP cost: <strong>25.7%</strong> by the route used here, <strong>42.9%</strong> if capture is credited with its full share of handling time, and <strong>70.3%</strong> if the ATO&rsquo;s paper-to-eInvoice gap is read as capture and exception work throughout. The lowest is used. The spread is roughly threefold, so a compliance-only case that looks marginal here may be understated.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.bracket';

UPDATE translations SET value = 'HMRC/DBT 60&ndash;80% cost reduction and ~10% manual error rate. Both appear in a UK government consultation, neither with a source inside it. Used here, with that gap on the record.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'ev.gradeB.body';

UPDATE translations SET value = 'The NHS trust figures (24h vs 10 days, 2&times; payment speed, 15% fewer queries) come from one unnamed, undated organisation. The VAT-gap figures are European Commission and CASE rather than OECD, and their own country analyses attribute the change to economic recovery rather than to digital reporting.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'ev.gradeC.body';

UPDATE translations SET value = 'Resolution time per errored invoice, the loaded FTE costs, the tax-effort share. These are our starting estimates, shown so you can replace them with your own.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'ev.gradeD.body';

-- The panel's own lede had the same tell in its last clause -- "what it
-- deliberately does not claim" -- which is the whole diagnosis in six
-- words: the reader is told what the page refuses before being told what
-- it offers. It now says what the panel contains.
UPDATE translations SET value = 'Where each figure comes from, how far it can be trusted, and which benefits are named without a number.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.evidence.hint';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.evidence.hint' AND value LIKE '%how far it can be trusted%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'notes.%' AND (value LIKE '%argued with%' OR value LIKE '%no value on purpose%' OR value LIKE '%does not add%') = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'ev.gradeD.body' AND value LIKE '%Resolution time%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.rework' AND value LIKE '%9.8-point%' = 1
--
-- The grade-D card must keep describing the inputs that actually exist.
-- It named a rework COST for eight hours after 558 replaced that input
-- with a duration, and nothing could see it: the card is prose, the
-- input is a benchmark row, and no check relates the two.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'ev.gradeD.body' AND value LIKE '%Rework cost%' = 0
--
-- And the substance must survive the register change. These three are
-- the panel's load-bearing admissions: the error rate has no source, the
-- NHS figure is one organisation, and the compliance share is the lowest
-- of three defensible readings. A future tidy that made this prose
-- friendlier still must not make it quieter.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.rework' AND value LIKE '%without a source%' = 1
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'ev.gradeC.body' AND value LIKE '%one unnamed%' = 1
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.bracket' AND value LIKE '%lowest is used%' = 1
