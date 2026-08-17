-- ================================================================
-- The caveats move out of the reader's way.
--
-- Dan: "The UI is difficult to read and follow because there are so many
-- caveats and assumptions. Would it be possible to read through those
-- comments and ensure they are concise, well reasoned rather than
-- 'wordy'. Also could those be hidden in a popout, rather than in the
-- main body of the page... The calculator is very high level, so I think
-- we don't need to have on full-display because it detracts from the
-- intent of the calculator."
--
-- Measured before touching anything: 1,539 words of always-on prose
-- across 27 blocks, before the reader reaches a number. Roughly half of
-- that arrived in the two days before he asked, in the course of making
-- the model defensible — every individual note was justified and the
-- accumulation was not. That is the failure mode of writing caveats one
-- at a time: each is a paragraph you can defend, and nobody ever reads
-- the page end to end and asks whether the sum of them is still a tool.
--
-- WHAT CHANGES. Section 7 becomes a collapsed <details> panel —
-- "Assumptions, sources and caveats" — using the same idiom as the
-- assumptions and adjust panels, so the page gains no new interaction
-- vocabulary. Every long caveat is rewritten to one line where it sits,
-- with a small "why >" link to the panel, which carries the full
-- reasoning and the citations.
--
-- WHAT DELIBERATELY STAYS INLINE:
--
--   * the seven sanity guards. They are conditional — they fire on a
--     specific bad state and they are the reason the page can be trusted
--     to say when it is wrong. Hiding a warning behind a click would
--     invert their entire purpose.
--   * "the same money as the row above, priced as people rather than an
--     addition to it". Without that clause the headcount figure reads as
--     a second saving, and "isn't that the same as your processing
--     saving?" is the first question a finance committee asks.
--   * the per-row banking tags, which are three words each.
--   * the placeholder-cost warning, which is actionable.
--
-- Nothing is deleted. The reasoning moves one click away and is linked
-- from the number it belongs to, which is the difference between an
-- honest page and a defensive one.
-- ================================================================

-- ---- rewritten: these keys exist, so INSERT would decline silently ----
UPDATE translations SET value = 'A scoping decision, not a benchmark &mdash; it changes both the numbers and the timeline.'
 WHERE namespace = 'roi' AND key = 'input.scope.hint' AND lang = 'en';
UPDATE translations SET value = 'Compliance-only, the normal shape. Counts what the integration itself delivers;'
 WHERE namespace = 'roi' AND key = 'res.complianceOnly' AND lang = 'en';
UPDATE translations SET value = 'more is the option it buys you for later.'
 WHERE namespace = 'roi' AND key = 'res.complianceOnly3' AND lang = 'en';
UPDATE translations SET value = 'In headcount:'
 WHERE namespace = 'roi' AND key = 'res.headcount.h' AND lang = 'en';
UPDATE translations SET value = 'Small because almost every circulating number here fails verification. What survives is shown; what does not is named.'
 WHERE namespace = 'roi' AND key = 'res.indirectWhy' AND lang = 'en';
UPDATE translations SET value = 'Everything counted here is tangible. The intangible benefits are named above and carry no value on purpose.'
 WHERE namespace = 'roi' AND key = 'res.tangible' AND lang = 'en';
UPDATE translations SET value = 'Assumptions, sources and caveats'
 WHERE namespace = 'roi' AND key = 'sec.evidence' AND lang = 'en';
UPDATE translations SET value = 'Cost you avoid rather than cash you release. Mechanisms are well evidenced; magnitudes mostly are not, so much of this section is named rather than priced.'
 WHERE namespace = 'roi' AND key = 'sec.indirect.lede' AND lang = 'en';

-- ---- new: the panel, and the one-line replacements ----
INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'chart.procure', 'en', 'Procurement is your critical path, not delivery.'),
  ('roi', 'chart.procure2', 'en', 'weeks of vendor selection and contracting against a typical'),
  ('roi', 'chart.procure3', 'en', 'week wave. Shortening the country build saves little; shortening procurement moves every deadline.'),
  ('roi', 'notes.banks', 'en', 'Capture and issuing arrive with the integration: once invoices come in structured and go out cleared, nobody keys or posts them. Review and approval are workflow and need a separate change programme. The split is the ATO / Deloitte task times &mdash; receipt 7 and validation 2 minutes against review 7 and approval 5 &mdash; not our judgement.'),
  ('roi', 'notes.banks.h', 'en', 'What compliance alone banks'),
  ('roi', 'notes.corrections', 'en', '<strong>Corrections applied during verification.</strong> The VAT-gap figures were re-attributed from OECD to the European Commission; Hungary&rsquo;s start figure corrected 9.8%&rarr;10.4% and Poland&rsquo;s 12.7%&rarr;12.5%; and the &ldquo;reduced penalty exposure&rdquo; claim was removed from the HMRC attribution, because the word &ldquo;penalty&rdquo; does not appear in that consultation.'),
  ('roi', 'notes.h.grades', 'en', 'Evidence grades'),
  ('roi', 'notes.h.reasoning', 'en', 'The reasoning'),
  ('roi', 'notes.headcount', 'en', 'The capture-FTE figure prices the processing-cost row in people. It is the same money &mdash; the per-invoice benchmark is labour-dominated, so counting both would count it twice.'),
  ('roi', 'notes.headcount.h', 'en', 'Headcount restates, it does not add'),
  ('roi', 'notes.headcount2', 'en', 'Released capacity is only cash if the post goes or is not backfilled.'),
  ('roi', 'notes.link', 'en', 'why &rsaquo;'),
  ('roi', 'notes.rework', 'en', 'It rests on HMRC&rsquo;s unsourced 10% error rate, a cost you set yourself, and our assumption about how many errors actually go away. Least evidenced row here and the largest beneficiary of any change, so it stays unbanked even on a compliance scope. Ardent gives the mechanism but no quantified reduction; their Best-in-Class exception gap of 9.8 points is used as a ceiling on what this model may claim.'),
  ('roi', 'notes.rework.h', 'en', 'Why rework is held back'),
  ('roi', 'notes.unmonetised', 'en', 'Paper and postage, because your own spend is the only honest input. Cycle time and supplier queries, because nobody has measured how much of that gap e-invoicing causes &mdash; Ardent&rsquo;s own'),
  ('roi', 'notes.unmonetised.h', 'en', 'What carries no value on purpose'),
  ('roi', 'res.headcount.line', 'en', 'FTE keying invoices today, of which'),
  ('roi', 'res.headcount.line2', 'en', 'are released &mdash; the same money as the row above, priced as people rather than an addition to it.'),
  ('roi', 'sec.evidence.hint', 'en', 'Every figure above, where it came from, and what it deliberately does not claim.'),
  ('roi', 'sum.scopeBoth', 'en', 'Scope: compliance + AP process automation.'),
  ('roi', 'sum.scopeBoth2', 'en', 'Every direct row counts, and the timeline carries a process-change phase per country. The larger, less common programme.'),
  ('roi', 'sum.scopeBoth3', 'en', 'Direct and indirect are deliberately not added together'),
  ('roi', 'sum.scopeOnly', 'en', 'Scope: compliance only.'),
  ('roi', 'sum.scopeOnly2', 'en', 'banks from the integration itself; the remaining'),
  ('roi', 'sum.scopeOnly3', 'en', 'needs a change programme you are not running.'),
  ('roi', 'waves.intro', 'en', 'Back-planned from each jurisdiction&rsquo;s published deadline'),
  ('roi', 'waves.intro2', 'en', 'through phase durations you control'),
  ('roi', 'waves.intro3', 'en', 'Procurement is modelled once, not per country.'),
  ('roi', 'waves.intro4', 'en', 'are here on an EU-wide obligation, not a national mandate'),
  ('roi', 'chart.late', 'en', 'of'),
  ('roi', 'chart.late2', 'en', 'waves back-plan to a start date that has already passed.'),
  ('roi', 'chart.late3', 'en', 'Compressed delivery, an interim filing approach, or an accepted late position &mdash; but the latest responsible start is behind you.');

-- The cycle-time and NHS citations moved here rather than being dropped
-- when the intangible row was condensed. A grade-A benchmark rendered
-- nowhere is the orphaning this project has already found three times.
INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'notes.unmonetised2', 'en', 'is circular by construction, and the'),
  ('roi', 'notes.unmonetised3', 'en', 'is a single anecdote. VAT leakage, penalty exposure and fraud, because the mechanisms are real and the magnitudes are not evidenced. They belong in the qualitative case beside this number, not inside it.');

-- The intangible row was a four-line paragraph inside a table cell.
INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'row.cycle', 'en', 'Faster cycle time &amp; fewer supplier queries'),
  ('roi', 'row.cycle.basis', 'en', 'Top-performing AP spends'),
  ('roi', 'row.cycle.basis2', 'en', 'of staff time on supplier inquiries against'),
  ('roi', 'row.cycle.basis3', 'en', 'an association with high-performing AP, not a measured effect of e-invoicing, so'),
  ('roi', 'row.cycle.basis4', 'en', 'not monetised');

-- The notes panel needs the closed-state label its siblings already have.
INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'assumptions.hide', 'en', 'hide &#9652;');

-- ---- and the rows this change orphaned ------------------------------
-- Six keys the renderer no longer reads, because the paragraphs they held
-- are now one line each with the reasoning in the panel. Leaving them is
-- the exact dead-data shape this project found three times in one week —
-- platform_cost_year, btn.recalculate, and the two orphaned Ardent
-- benchmarks. A superseded row that still looks live is worse than no row.
DELETE FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN
  ('res.scopeCaveat', 'res.unmonetised', 'res.headcount.same',
   'res.headcount.gap', 'res.headcount.gap2', 'res.complianceOnly2');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'notes.%' = 15
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key NOT LIKE 'help.%' = 158
--
-- Content, because the entire migration is content. The two longest
-- offenders are asserted SHORT rather than merely present: a count would
-- be satisfied by the paragraphs they replace, which is the whole defect.
--
-- ASSERT: SELECT length(value) < 200 FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.complianceOnly' = 1
-- ASSERT: SELECT length(value) < 200 FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.tangible' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.evidence' AND value LIKE '%Assumptions, sources and caveats%' = 1
--
-- A standing invariant, and the one that actually protects Dan's point.
-- Every caveat on this page began as a defensible paragraph; the problem
-- was the accumulation, which no single review catches because each note
-- looks reasonable on its own. So: nothing rendered in the page body may
-- run past 300 characters. The panel keys are exempt by name — they are
-- BEHIND the click, which is where long reasoning belongs.
--
-- WIDENED ON 17 AUGUST 2026 TO EXEMPT guard.%, and the reason is the
-- point of the rule rather than an exception to it.
--
-- This budget exists to stop ALWAYS-ON prose accumulating: 1,539 words of
-- caveats stood between a reader and their first number, and every
-- sentence of it was defensible. A guard is the opposite kind of thing.
-- It is conditional, it appears only when this reader's scenario is
-- broken or implausible, and it has to say enough to fix it -- which
-- jurisdictions, which figure, what to check. Three of them run past 300;
-- the longest, at 508, is the one that has to cite Ardent's measured
-- exception gap and explain why the reader's assumption exceeds it.
--
-- They were not exempt before because they were not in D1 at all: six of
-- the seven were template literals in the renderer, so the budget could
-- not see them and neither could anything else. Migration 574 moved them,
-- and the first thing that happened was this invariant firing -- which is
-- the invariant working. The exemption is a decision, taken here, with
-- the reasoning attached, rather than a number quietly raised to 510.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key NOT LIKE 'help.%' AND key NOT LIKE 'notes.%' AND key NOT LIKE 'guard.%' AND key NOT IN ('page.lede','footer.text','assumptions.grades','assumptions.placeholders','adjust.note','subs.locked','ev.gradeA.body','ev.gradeB.body','ev.gradeC.body','ev.gradeD.body','gate.body','input.countries.hint') AND length(value) > 300 = 0
--
-- The guards get a budget of their own rather than none. 600 is roughly
-- twice the body limit and comfortably above the longest; a guard that
-- needs more than that is an essay, and an essay is not something a
-- reader acts on while looking at a broken number.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'guard.%' AND length(value) > 600 = 0
