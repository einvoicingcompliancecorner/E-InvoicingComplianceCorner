-- The gate stops withholding what it never held.
--
-- Dan, 20 August 2026, choosing between three ways of placing the code:
-- "results immediately with the code protecting the account, and code
-- used in other locations when signing in."
--
-- WHAT THESE FIVE STRINGS USED TO CLAIM. "Subscriber content ... Your
-- results are ready ... Subscribing is free. It unlocks the full wave
-- plan, the two-layer ROI model and the evidence panel."
--
-- None of that was true, and the page proved it in view-source. This
-- planner computes everything in the reader's browser: the anonymous
-- render has always shipped every benchmark, every phase, the whole
-- model and the unlock flag itself. Pressing the button set a variable.
-- Nothing was ever withheld and nothing could be, so what stood here was
-- a toll gate with no road behind it -- collected only from the readers
-- who did not look.
--
-- The new copy asks for the same thing and stops pretending about why.
-- What an account actually gives is a saved country list, an email when
-- a mandate really moves, and a session -- all of which live on the
-- server and none of which can be had by reading the page. That is a
-- smaller promise and it is one this site can keep.
--
-- ALSO A SMALLER ASK. It says the cost up front: a 6-digit code, no
-- password, without leaving the page. The previous version's ask was
-- eleven fields on another domain and an email round-trip, and it did
-- not mention any of that either.
--
-- The English is GENERATED from shared/roi-render.mjs by
-- generate_595_prompt.py, never retyped -- tests/roi-i18n.mjs compares
-- the two character by character, and migration 590 was caught by that
-- check after an em-dash was typed where the code had &mdash;.


UPDATE translations SET value = 'Free account' WHERE namespace = 'roi' AND lang = 'en' AND key = 'gate.eyebrow';
UPDATE translations SET value = 'Keep this, and hear when it changes' WHERE namespace = 'roi' AND lang = 'en' AND key = 'gate.title';
UPDATE translations SET value = 'Your figures are above and they are yours to keep. A free account saves the jurisdictions you selected, emails you when one of these mandates actually moves, and remembers your assumptions for next time. It takes a 6-digit code and no password &mdash; and you stay on this page.' WHERE namespace = 'roi' AND lang = 'en' AND key = 'gate.body2';
UPDATE translations SET value = 'Create a free account' WHERE namespace = 'roi' AND lang = 'en' AND key = 'gate.cta2';
UPDATE translations SET value = 'Already have one? {0}.' WHERE namespace = 'roi' AND lang = 'en' AND key = 'gate.signin';

-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('gate.eyebrow','gate.title','gate.body2','gate.cta2','gate.signin') = 5
-- ASSERT: SELECT value FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'gate.eyebrow' = 'Free account'
-- ASSERT: SELECT value FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'gate.title' = 'Keep this, and hear when it changes'

-- ---- INHERITED FROM 592, INVERTED -----------------------------------
--
-- 592 required this sentence to NAME the PDF, because the PDF was one
-- of the things a session genuinely bought. It does not any more: the
-- results and the print button are there for everyone, so naming it
-- would be the exact defect 592 was guarding against -- a panel
-- promising something that is not behind it.
--
-- The rule is unchanged. Only reality moved, so the test moved with
-- it. 592 carries the retired text as `was:` rather than losing it.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'gate.body2' AND value LIKE '%PDF%' = 0
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'gate.body2' AND lower(value) LIKE '%unlock%' = 0
--
-- AND THE OLD CLAIM ITSELF STAYS BURIED. "Your results are ready" was
-- true and irrelevant: they were ready for everyone, all along.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'gate.title' AND value LIKE '%results are ready%' = 0
