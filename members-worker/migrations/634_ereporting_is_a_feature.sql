-- ================================================================
-- The e-Reporting card gets registered as a feature, a day late.
-- ================================================================
--
-- Dan, 24 August 2026: "some changes and new features have introduced
-- errors, such as not knowing about the notification functionality ...
-- Could these have been avoided with a more thorough design document."
--
-- For this one: yes. And the evidence is that the machinery to catch it
-- already existed and could not see it.
--
-- The `features` table is what the weekly content-monitor digest reads
-- to say "these have shipped and nobody has been told", and what
-- /admin/announce-features sends from. It held eight rows, the newest
-- dated 22 August. The e-Reporting card shipped on the 24th as the
-- largest addition to the compliance guides since they launched -- 39
-- countries with a live reporting duty, a sixth headline fact on every
-- page -- and it was never added.
--
-- So the digest could not flag it, the announcement job could not send
-- it, and the only thing standing between that feature and permanent
-- silence was me remembering to mention it in chat. Which I did, twice,
-- as a to-do rather than as a row.
--
-- ---- THE SHAPE OF THIS, WHICH IS NOT NEW ----------------------------
--
-- A monitor cannot see what was never declared to it. That is exactly
-- migration 628's finding a day earlier: cited_sources enumerates
-- columns, so seventy new source URLs were invisible and "every cited
-- host is graded" passed on nothing. Same failure, different table --
-- REGISTRATION IS A STEP, AND AN UNPERFORMED STEP LOOKS IDENTICAL TO A
-- CLEAN RESULT.
--
-- The durable half of the fix is in tests/feature-announcement.mjs,
-- which now checks `features` against FEATURE_LINKS in both directions.
-- That cannot tell you a feature was never written down -- nothing can,
-- short of a human running a checklist -- but it does catch the more
-- likely half, where one of the two is updated and the other is not.
-- ================================================================

INSERT OR REPLACE INTO features (slug, title, description, shipped_at, requires_signin)
VALUES (
  'ereporting-card',
  'e-Reporting: the second obligation, now on every guide',
  'Every compliance guide now carries a sixth headline fact: whether a country obliges you to REPORT transaction data separately from issuing the invoice, how often, and what the system is called — SAF-T, myDATA, JPK_V7M, SII, kontrolní hlášení and about thirty others. Thirty-nine of the seventy countries have a live duty and only four of those use SAF-T. Satisfying an e-invoicing mandate does not always satisfy this one, and until now nothing on the page said so.',
  '2026-08-24',
  1
);

-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM features = 9
-- ASSERT: SELECT count(*) FROM features WHERE slug = 'ereporting-card' AND shipped_at = '2026-08-24' = 1

-- IT IS UNANNOUNCED, which is the state that makes the digest mention
-- it. Asserted so that a future migration cannot quietly mark it sent.
-- ASSERT: SELECT count(*) FROM announcements WHERE item_type = 'feature' AND item_id = (SELECT id FROM features WHERE slug = 'ereporting-card') = 0

-- ---- and what must stay true afterwards -----------------------------

-- EVERY FEATURE CAN BE DESCRIBED TO A SUBSCRIBER. A row with no title
-- or no description reaches the email as a blank line, and the send has
-- no way to know it should have been held back.
-- ASSERT ALWAYS: SELECT count(*) FROM features WHERE ifnull(title,'') = '' OR ifnull(description,'') = '' OR ifnull(shipped_at,'') = '' = 0

-- AND NO TWO FEATURES SHARE A SLUG, because the slug is what joins this
-- table to FEATURE_LINKS in the worker and to announcements below it.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT slug FROM features GROUP BY slug HAVING count(*) > 1) = 0
