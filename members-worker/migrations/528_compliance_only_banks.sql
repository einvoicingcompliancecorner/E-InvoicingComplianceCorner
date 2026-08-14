-- ================================================================
-- Compliance-only stops being modelled as a failure.
--
-- Dan, from customer conversations: "Every customer I have talked with
-- looking to implement compliance in the last 2-3 years is meeting
-- mandates alone, and never wants to combine it with AP automation. That
-- project is just too large for any enterprise to tackle in one project.
-- Our calculator asks if we are including AP automation, before realising
-- the savings."
--
-- He is right, and the model was built on the opposite assumption. It ran
--
--     banked = (scope === 'both')
--     annualBenefit = (banked ? l1 : 0) + l2
--
-- so on the scope that every real customer picks, the whole direct total
-- was multiplied by zero. The page then explained that the negative
-- result "is the correct answer rather than a broken one" and that the
-- real investment case was "doing both at once" — advice nobody takes,
-- offered to everybody. A tool whose headline answer for its entire
-- audience is "this does not pay back" is not conservative, it is wrong.
--
-- THE ROWS DO NOT ALL DEPEND ON THE SAME THING. That was the error: one
-- global switch over benefits with different dependencies.
--
--   AP capture and validation   BANKS ON COMPLIANCE. You cannot receive a
--     cleared structured invoice and still key it. The integration that
--     makes you compliant is the integration that removes the keying.
--     Split at the ATO / Deloitte purchase-invoice task times already in
--     D1 as `capture_share_of_ap`: receipt 7 + validation 2 of 21
--     minutes, against review 7 + approval 5.
--   AP review and approval      DOES NOT. Workflow needs the change
--     programme, and the change programme is the thing nobody is doing.
--   AR issuing                  BANKS ON COMPLIANCE. The mandate forces
--     structured issuance; printing and PDF-ing stop by law, not choice.
--   Avoided rework              HELD UNBANKED, on Dan's call, though the
--     argument for banking it is decent — no keying, no keying errors. It
--     rests on HMRC's unsourced 10% error rate on top of a user-set
--     rework cost, making it the weakest-evidenced row in the model AND
--     the largest single beneficiary of this change. Banking it would
--     have taken payback to about seven months on the strength of the
--     least defensible number here. The row that gains most from a change
--     is the wrong row to be generous with.
--
-- EFFECT, EU preset at 100k invoices, compliance-only:
--   before   $0 banked of $1,145,400        net +$104,667   65 months
--   after    $448,045 banked                net +$642,712   ~11 months
--
-- THIS MAKES THE ANSWER MATERIALLY BETTER, WHICH IS THE PROBLEM WITH IT.
-- "The number improved after the vendor changed the model" is the exact
-- criticism this page has spent its existence trying to be immune to. So
-- the reasoning is stated per row, on the row, in a tag the reader cannot
-- miss — `banks`, `43% banks`, `not banked` — and the split comes from a
-- cited external source rather than from us. Anyone who disagrees can see
-- precisely which row and which benchmark to argue with.
--
-- The scope control keeps both options but stops implying that combining
-- them is the goal. Compliance-only is labelled as what most programmes
-- actually do, because it is.
-- ================================================================

-- ---- reworded: these keys already exist, so INSERT would decline ----
-- silently. That is the shape migration 522 exists to remember.
UPDATE translations SET value = 'Compliance only &mdash; meet the mandates (what most programmes do)'
 WHERE namespace = 'roi' AND key = 'scope.compliance' AND lang = 'en';

UPDATE translations SET value = 'Compliance + AP process automation &mdash; the fuller, larger programme'
 WHERE namespace = 'roi' AND key = 'scope.both' AND lang = 'en';

UPDATE translations SET value = 'unlocked, not banked'
 WHERE namespace = 'roi' AND key = 'res.unbanked' AND lang = 'en';

UPDATE translations SET value = 'banked annually'
 WHERE namespace = 'roi' AND key = 'res.banked' AND lang = 'en';

UPDATE translations SET value = '<strong>What banks, and what you have to go and get.</strong> Each row above says which it is. Capture and issuing arrive with the integration &mdash; once invoices come in structured and go out cleared, nobody is keying or posting them, whatever else you do or do not change. Review, approval and the rework that follows them are workflow, and workflow only improves if you redesign and retrain, which is a separate programme with its own cost and its own risk. The split between the two comes from the ATO / Deloitte task times, not from us. Rework is held unbanked even on a compliance scope despite a decent argument that it should not be: it rests on the least well-evidenced figures in this model, and the row that gains most from a change is the wrong row to be generous with.'
 WHERE namespace = 'roi' AND key = 'res.scopeCaveat' AND lang = 'en';


-- ---- new ----
INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'res.complianceOnly', 'en', '<strong>This is a compliance-only case, and it is the normal one.</strong> Enterprises meeting a mandate almost never bundle AP process automation into the same programme &mdash; it is too large to land in one go. What counts above is only what the integration itself delivers: you stop keying inbound invoices and stop issuing paper, because the mandate leaves you no way to do either.'),
  ('roi', 'res.complianceOnly2', 'en', 'The further'),
  ('roi', 'res.complianceOnly3', 'en', 'is review, approval and rework. It stays unbanked because it needs a change programme you are not running &mdash; but it does not go away, and it is the option this integration buys you for later. If the net figure is negative, that is a real answer rather than a broken one: you are buying the right to keep trading in these markets.');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'res.complianceOnly%' = 3
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key NOT LIKE 'help.%' = 123
--
-- Content, because the whole migration is content and a count would be
-- satisfied by the wording it replaces.
--
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.scopeCaveat' AND value LIKE '%What banks, and what you have to go and get%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'scope.compliance' AND value LIKE '%what most programmes do%' = 1
--
-- A standing invariant. The old copy told the reader that compliance-only
-- banks nothing and that the answer is to widen scope. If that sentiment
-- ever returns, the model and the prose have diverged again — the
-- arithmetic now banks capture and issuing on a compliance scope, and
-- prose saying otherwise would be describing a page that no longer exists.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND (value LIKE '%without banking any of it%' OR value LIKE '%actual investment case for doing both at once%') = 0
