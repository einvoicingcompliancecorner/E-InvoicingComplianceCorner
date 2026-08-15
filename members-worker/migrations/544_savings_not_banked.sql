-- ================================================================
-- "Banked" leaves the whole page, and the cost side is spelled out.
--
-- Dan, two things:
--   "1) yes, please relabel to savings generally where banked is used.
--    so long as it makes sense in the sentence context.
--    2) please explicitly under One-off investment, state the
--    implementation (cost) + annual saas (cost). This will make the net
--    annual savings amount easier to decode."
--
-- ---- 1. the relabel, judged per sentence ---------------------------
--
-- 543 took the idiom out of three summary labels and left ten live
-- strings using it, on the argument that changing three and leaving ten
-- reads worse than either extreme. This finishes it. "So long as it makes
-- sense in the sentence context" is the whole instruction, and it is why
-- this is eleven separate rewrites rather than a find-and-replace:
--
--   'Banks on this scope'        -> 'Saved on this scope'
--   'What compliance alone banks'-> 'What compliance alone saves'
--   'banks in full on either'    -> 'is saved in full on either'
--   'it stays unbanked even on'  -> 'it is not counted as saved, even on'
--   'Banks on either scope:'     -> 'Saved on either scope:'
--   'banks from the integration' -> 'is saved from the integration'
--   'Unlocked, not banked'       -> 'Available on a wider scope'
--
-- A blind replace would have produced "saves from the integration itself"
-- and "it stays unsaved", both of which are wrong English, and
-- "Unlocked, not saved", which is worse than the original because
-- "unlocked but not saved" invites the question the phrase exists to
-- answer. The pie labels get the same wording as `res.unbanked` in 543,
-- so the chart and the summary now describe that money identically.
--
-- ---- THE THREE TAGS THAT WERE NEVER TRANSLATABLE --------------------
--
-- 543's comment flagged that 'banks', 'not banked' and the '43% banks'
-- construction were English LITERALS in the renderer's template rather
-- than D1 rows, so no translation could ever reach them. Relabelling them
-- meant touching those lines anyway, so they become `tag.saved` and
-- `tag.notSaved` here. The percentage tag is now composed -- the number,
-- then the same `tag.saved` row -- rather than carrying its own copy of
-- the word, which is one fewer string to keep in step across four
-- languages.
--
-- That closes the i18n gap this page had at the point it was found,
-- rather than logging it. It was three lines of code.
--
-- ---- help.scope was not just idiomatic, it was WRONG ----------------
--
-- It read: "it unlocks the direct savings but does not bank them, because
-- nothing about AP actually changes."
--
-- That describes the PRE-528 model, where compliance-only multiplied the
-- entire direct total by zero. Since 528 a compliance-only programme
-- banks capture and issuing -- $518,125 of $1,215,480 at the defaults --
-- and this tooltip has been telling readers the opposite for a day, on
-- the one control that changes both the totals and the timeline.
--
-- Second time this week that prose outlived the model it described, after
-- "(compliance scope)" in 541. Both were found by a reader asking what
-- something meant, and neither is detectable by any check in this
-- repository. Worth stating plainly: THE TEST SUITE CANNOT SEE STALE
-- PROSE. It is 166 checks deep and blind to the class of defect that has
-- now produced two migrations in two days.
--
-- ---- 2. the cost side, stated where the reader needs it -------------
--
-- The One-off stat now carries two sub-lines: what the big number is
-- ("implementation"), and the recurring money it is NOT ("plus each year:
-- $60,000 platform + $30,000 internal", each with its existing tooltip).
--
-- Dan's reason is the right one: it makes the net figure decode without
-- hunting. Annual saving $518,125, less the two running costs shown
-- immediately beside it, is net annual saving $428,125 -- three of the
-- five stats now reconcile against each other in the grid itself.
--
-- AND THE BRIDGE NOTE GIVES THE FIGURES UP, because they would otherwise
-- be stated twice within four lines. 542 put them in that note precisely
-- because the grid had no room; the grid has made room, so the note goes
-- back to naming the relationship rather than repeating the numbers.
-- `sum.bridge`, `sum.bridge3`, `sum.bridge4` and `sum.bridge5` are
-- orphaned by that -- four keys, one day old, and the reason 542's own
-- comment argued for putting them in a note is now obsolete.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'tag.saved', 'en', 'saved'),
  ('roi', 'tag.notSaved', 'en', 'not saved'),
  ('roi', 'res.oneOff2', 'en', 'implementation'),
  ('roi', 'res.running', 'en', 'plus each year:'),
  ('roi', 'res.running2', 'en', 'platform'),
  ('roi', 'res.running3', 'en', 'internal'),
  ('roi', 'sum.bridge6', 'en', 'Net annual saving is the annual saving less the two running costs above; section 4 shows what makes up the annual saving, row by row.'),
  ('roi', 'sec.savings.lede5', 'en', 'Priced savings first, the ones this scope actually saves at the top; what this model will not put a number on is named below the total. Every priced row says what it saves on your chosen scope, and that total is what section 2 works from.');

UPDATE translations SET value =
 'Saved on this scope'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'col.banks';

UPDATE translations SET value =
 'What compliance alone saves'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.banks.h';

UPDATE translations SET value =
 'Capture and issuing arrive with the integration: once invoices come in structured and go out cleared, nobody keys or posts them. Review and approval are workflow and need a separate change programme. The split is the ATO / Deloitte task times &mdash; receipt 7 and validation 2 minutes against review 7 and approval 5 &mdash; not our judgement. Tax reporting and audit-prep effort is saved in full on either scope: you file structured data to the tax authority whether or not you ever touch AP workflow, so there is no equivalent split to make.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.banks';

UPDATE translations SET value =
 'It rests on HMRC&rsquo;s unsourced 10% error rate, a cost you set yourself, and our assumption about how many errors actually go away. Least evidenced row here and the largest beneficiary of any change, so it is not counted as saved, even on a compliance scope. Ardent gives the mechanism but no quantified reduction; their Best-in-Class exception gap of 9.8 points is used as a ceiling on what this model may claim.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.rework';

UPDATE translations SET value =
 'Saved on either scope: the reporting effort falls with the compliance build itself, not with a workflow change.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'row.tax.banks';

UPDATE translations SET value =
 'is saved from the integration itself; the remaining'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'sum.scopeOnly2';

UPDATE translations SET value =
 'Available on a wider scope'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'sv.unbanked';

UPDATE translations SET value =
 'available on a wider scope'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'sv.unbankedTail';

-- ---- a CSS class-name collision found while building this -----------
-- The One-off sub-lines were first written as `.sub` and `.sub2`.
-- members-worker's own page shell defines a GLOBAL `.sub` at 13.8px in
-- #4a4030 -- a dark brown sized for its paper surfaces -- and the ROI
-- page inherits that stylesheet. The collision was silent: the sub-label
-- rendered 38% larger than the label above it and carried a 22px bottom
-- margin nobody asked for, and it looked like a deliberate hierarchy
-- rather than a bug. Renamed to `.statwhat` / `.statrun`, which cannot
-- collide with a shell this module does not own. No D1 change; recorded
-- because the next person to add a class here should know the ROI page
-- is not the only author of its stylesheet.

-- ---- and the tooltip that described a model retired on 14 August ----
UPDATE translations SET value =
 'Compliance-only models the mandate integration as an IT workstream, and it is what almost every programme actually buys. Capture and issuing are saved by it: once invoices arrive structured and go out cleared, nobody keys or posts them, whatever else stays the same. Review, approval and rework are workflow &mdash; they need the process redesign and retraining that compliance + AP automation adds, which also adds a process-change phase to every country track. This one control changes both the totals and the timeline, which is why it sits out here rather than in the assumptions panel.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.scope';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('tag.saved','tag.notSaved') = 2
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('res.oneOff2','res.running','res.running2','res.running3') = 4
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.scope' AND value LIKE '%Capture and issuing are saved by it%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.scope' AND value LIKE '%does not bank them%' = 0
--
-- The point of the whole file, and the one thing a later edit would undo
-- without noticing, because "banks" is the natural word for someone who
-- has read this codebase: no roi string may use the idiom again. Held
-- across every key rather than a list, because the list is the problem --
-- 543 fixed three and left ten, and the page spent a day saying "saving"
-- in the summary and "banks" in the table it summarises.
--
-- Orphans and retired rows are excluded by name: they are kept for the
-- dead-data sweep with their original wording, which is the record of
-- what the page used to say.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations t WHERE t.namespace = 'roi' AND t.lang = 'en' AND t.value LIKE '%bank%' AND t.key NOT IN ('sec.direct.lede','sec.indirect.lede','sec.savings.lede','sec.savings.lede2','sec.savings.lede3','sec.savings.lede4','sum.bridge','sum.bridge2','sum.bridge5','res.indirectWhy','sum.scopeBoth3') = 0
