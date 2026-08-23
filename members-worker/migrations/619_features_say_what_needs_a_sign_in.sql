-- ================================================================
-- A link in the announcement email should land where the menu lands,
-- and should say when it will ask you to sign in first.
-- ================================================================
--
-- Dan, 23 August 2026, after the first send: "The links in the email are
-- incorrect though. Mainly they lead to the standalone version of the
-- form, rather than in-frame. The newsletter archive link is incorrect
-- and points to e-invoicingcompliancecorner.com/members/archive instead
-- of members.e-invoicingcompliancecorner.com/members/archive. Some other
-- features hidden behind the subscription wall show the sign in page,
-- which probably needs clarifying in the email."
--
-- Three faults, and only the third is data. The other two are fixed in
-- the worker and the tracker in the same commit:
--
--   * every link now goes to the tracker with ?view=, so a reader lands
--     in the panelled site they know rather than on the bare page the
--     panel embeds. The archive link fault disappears with it -- there is
--     no cross-host URL to get wrong any more, which is a better fix
--     than remembering the right host;
--
--   * the wrong host came from ONE hardcoded origin used for every path.
--     The email builder now refuses to emit a /members/ link at all.
--
-- ---- WHAT THIS MIGRATION ADDS --------------------------------------
--
-- requires_signin. Two of the eight features answer with a sign-in wall
-- to a signed-out reader -- the ROI planner and the compliance guides,
-- both of which return renderSubscriberGate BEFORE they touch D1. An
-- email that links to them without saying so sends a subscriber to a
-- login form with no warning, which reads as a broken link rather than
-- as a door.
--
-- ONLY THOSE TWO, TODAY. The newsletter archive is behind
-- ARCHIVE_PUBLIC = "true" -- a promotion, currently open to everyone --
-- and both published insights pieces carry gated = 0. Marking either as
-- requiring a sign-in would be wrong right now and would make the email
-- warn about a wall that is not there. When the promo ends, this column
-- is the one place to change.
--
-- tests/feature-announcement.mjs checks this column against the routes
-- that actually call renderSubscriberGate in site-worker, so the two
-- cannot drift apart quietly: gate a third route and the build says the
-- email is about to under-warn.
-- ================================================================

ALTER TABLE features ADD COLUMN requires_signin INTEGER NOT NULL DEFAULT 0;

UPDATE features SET requires_signin = 1
 WHERE slug IN ('roi-wave-planner', 'compliance-guides');

-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM features WHERE requires_signin = 1 = 2
-- ASSERT: SELECT requires_signin FROM features WHERE slug = 'roi-wave-planner' = 1
-- ASSERT: SELECT requires_signin FROM features WHERE slug = 'compliance-guides' = 1

-- A THREE-STATE FLAG IS NOT A FLAG. SQLite will happily store 2, or
-- 'yes', in an INTEGER column, and the renderer treats anything truthy
-- as walled -- so a typo here would silently start warning readers about
-- a wall that is not there.
-- ASSERT ALWAYS: SELECT count(*) FROM features WHERE requires_signin NOT IN (0, 1) = 0
