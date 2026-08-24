-- ================================================================
-- The specification register is a feature, and the register knows it.
-- ================================================================
--
-- REGISTRATION IS A STEP, AND AN UNPERFORMED STEP LOOKS IDENTICAL TO A
-- CLEAN RESULT. That sentence is migration 634's, written the day the
-- e-Reporting card shipped as the largest addition to the guides since
-- launch and reached the announcement digest as nothing at all --
-- because no row said it existed. Absence has no representation, so no
-- check can find it; only a checklist can, and this is that item.
--
-- Written in the same migration as the feature rather than "later",
-- because later is precisely what happened last time.
--
-- UNANNOUNCED ON PURPOSE. The row exists so the digest can raise it;
-- whether it is worth an email is a decision for a person, and the
-- announcement job is manual by design. It joins eleven other items
-- already waiting, which is its own open question -- see PROGRESS.md's
-- live list.
-- ================================================================

INSERT OR REPLACE INTO features (slug, title, description, shipped_at, requires_signin)
VALUES (
  'spec-register',
  'The specification register: what each country mandates, and where the file is',
  'For twenty jurisdictions: the mandated format, its current version, the authoritative file, '
  || 'the licence, and the date a version becomes obligatory -- with, for every country, what the '
  || 'published artefacts do not tell you. Two of the twenty publish under a named licence; two '
  || 'offer a validator anyone can use without registering; four publish nothing machine-readable '
  || 'at all, and the register says why.',
  '2026-08-24',
  1
);

-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM features = 10
-- ASSERT: SELECT count(*) FROM features WHERE slug = 'spec-register' AND requires_signin = 1 = 1

-- SHIPPED AND NOT YET ANNOUNCED, which is the state the digest exists
-- to surface. If this assertion ever fails it means the announcement
-- went out, and this line should be deleted rather than "fixed".
-- ASSERT: SELECT count(*) FROM announcements WHERE item_type = 'feature' AND item_id = (SELECT CAST(id AS TEXT) FROM features WHERE slug = 'spec-register') = 0

-- ---- and what must stay true afterwards -----------------------------

-- EVERY FEATURE HAS A DESCRIPTION A READER COULD ACT ON. An empty one
-- would go out in an announcement email as a headline with nothing
-- under it.
-- ASSERT ALWAYS: SELECT count(*) FROM features WHERE ifnull(description,'') = '' = 0

-- AND A GATED FEATURE STAYS GATED. requires_signin drives what the
-- announcement email promises; a feature that says "no sign-in needed"
-- while its route answers a wall makes the email wrong rather than the
-- page.
-- ASSERT ALWAYS: SELECT count(*) FROM features WHERE slug = 'spec-register' AND requires_signin != 1 = 0
