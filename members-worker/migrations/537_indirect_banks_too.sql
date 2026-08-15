-- ================================================================
-- The indirect row joins the banking model it was quietly exempt from.
--
-- Dan, asked whether indirect savings are banked: "The only indirect
-- saving reported is 'Reduced tax reporting & audit-prep effort', which
-- seems like a valid saving to bank."
--
-- WHAT WAS ACTUALLY TRUE BEFORE THIS. Indirect was not banked at 0%, and
-- it was not banked at 100% either -- it was never put through the
-- banking model at all. It entered `netAnnual` in full on both scopes,
-- byte-identical at $70,080 whether the reader picked compliance-only or
-- compliance + AP automation, while every direct row beside it declared
-- a rate. Not a wrong number: an absent decision, which reads exactly
-- like a decision to anyone auditing the page.
--
-- WHY THAT MATTERED MORE THAN IT LOOKS. Avoided rework is held to ZERO on
-- a compliance scope because it is "the weakest-evidenced row here". Set
-- the two side by side and that ranking does not survive:
--
--   rework, banked 0%      manual_error_rate      10       B
--                          rework_per_error       45       D
--                          error_elimination_pct  80       D
--
--   tax effort, banked     ap_invoices_per_fte    12,000   A
--   in full, silently      tax_effort_per_jur     0.018    D
--                          tax_effort_cap         0.20     D
--                          loaded_fte_cost        116,800  B
--
-- Two D-grade assumptions each. The reason one banked at zero and the
-- other in full was not evidence quality -- it was that the banking model
-- had only ever been built for the direct table. Rework was being held to
-- a standard the indirect row was never asked to meet.
--
-- DAN'S CALL, AND WHY IT IS THE RIGHT ONE. The argument for banking it in
-- full is stronger than the argument for the AP capture share it now sits
-- beside: tax reporting and audit-prep effort falls BECAUSE you are
-- filing structured data to a tax authority, which is the compliance
-- build itself rather than a workflow change layered on top. AP capture
-- banks at 42.86% because part of AP effort is review and approval, and
-- that genuinely does need the change programme. There is no equivalent
-- split here -- the whole row is the reporting work.
--
-- So the arithmetic does not move by a cent. What changes is that the
-- decision is now VISIBLE: the indirect table carries the same "Banks on
-- this scope" column as the direct table, the row carries a `banks` tag,
-- and it states its reason inline the way every direct row does. The
-- model is uniform, and a reader can audit the choice instead of
-- inferring it from an absence.
--
-- Migration 536 established the column; this one finishes the job it
-- started, on the half of the page 536 did not reach.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'row.tax.banks', 'en', 'Banks on either scope: the reporting effort falls with the compliance build itself, not with a workflow change.');

-- ---- the prose, which described a page with one banking model --------
-- Dan: "update prose". These three all described the state of affairs
-- BEFORE this migration -- a banking rule that lived only in section 4's
-- direct table -- and each would now be read as saying the indirect row
-- is outside it. UPDATE rather than INSERT: 530, 535 and 536 seeded them.
UPDATE translations SET value =
 'Two kinds, reported separately because the evidence behind them differs. Direct savings are cash that stops leaving the business; indirect savings are cost and risk you avoid rather than money you release. Every priced row states what it banks on the scope you chose, and section 5 uses both.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.savings.lede';

UPDATE translations SET value =
 'Cost you avoid rather than cash you release. Mechanisms are well evidenced; magnitudes mostly are not, so most of this section is named rather than priced. The one row that is priced banks in full on either scope.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.indirect.lede';

-- The notes-panel card is titled "What compliance alone banks" and
-- explained only the AP split. It was the one place a reader could go to
-- understand the rule, and it stopped short of the row this migration
-- brings under it.
UPDATE translations SET value =
 'Capture and issuing arrive with the integration: once invoices come in structured and go out cleared, nobody keys or posts them. Review and approval are workflow and need a separate change programme. The split is the ATO / Deloitte task times &mdash; receipt 7 and validation 2 minutes against review 7 and approval 5 &mdash; not our judgement. Tax reporting and audit-prep effort banks in full on either scope: you file structured data to the tax authority whether or not you ever touch AP workflow, so there is no equivalent split to make.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.banks';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'row.tax.banks' AND value LIKE '%either scope%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.indirect.lede' AND value LIKE '%banks in full on either scope%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.savings.lede' AND value LIKE '%Every priced row states what it banks%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.banks' AND value LIKE '%no equivalent split to make%' = 1
--
-- Both tables now use the same two column headings, which is the whole
-- point of this file: one banking model, stated once, applied to every
-- monetised row on the page. If a later migration ever renames one of
-- these keys for one table only, the two halves start describing the
-- same concept in different words and the uniformity silently rots.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('col.gross','col.banks') = 2
--
-- And the ranking that started this. Whatever rates the model uses, it
-- must never again bank a row in full while holding a BETTER-EVIDENCED
-- row to zero. That is a judgement no SQL assertion can make, so what is
-- asserted is the thing that made it invisible: every monetised row
-- declares a banking position on the page. Checked in
-- tests/roi-regression.mjs, where the rendered table can actually be
-- read -- a D1 assertion could only have restated this comment.
