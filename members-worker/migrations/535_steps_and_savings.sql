-- ================================================================
-- A route through the page, and one Savings section instead of two.
--
-- Dan, two requests in one message:
--
--   "1) Can we add simple and discrete instructions at the top of the
--    page for the business case, such as 'Step 1 -> Step 2 -> Step 3'
--    etc. The user needs to Enter footprint values, select countries,
--    Update assumptions and Benchmark (Optional), and adjust go-live
--    dates on wave planner (optional).
--    2) Can the sections 4 and 5 be combined into one 'Savings' section
--    listing both direct and indirect savings."
--
-- WHY THE STEPS STRIP IS FIVE AND NOT THREE. Dan's own list has four
-- actions; the fifth is Calculate, which sits between them and which the
-- page previously left the reader to find. Two of the five are marked
-- OPTIONAL in the chip itself rather than in a footnote, because the
-- honest shape of this tool is "two inputs, a button, and two things you
-- may never touch" -- and a reader who does not know that assumes all
-- five are homework. The strip is `noprint` and links to anchors that
-- already existed (#s-footprint, #s-countries, #assump, #run, #adjust);
-- nothing was moved to accommodate it.
--
-- WHY MERGING 4 AND 5 IS MORE THAN COSMETIC. The two sections were
-- already a single argument split across a heading boundary: direct and
-- indirect savings are the two halves of one answer to "what does this
-- save", and the page's most important claim about them -- that they are
-- deliberately NEVER ADDED TOGETHER -- had nowhere to live, because it
-- belongs to the pair rather than to either one. It now sits in the
-- section lede, which is the first thing read and the thing a reader
-- would otherwise have had to infer from two separate totals that never
-- meet.
--
-- WHY THESE TWO SUBHEADS HAD TO BE REWORDED, and why an UPDATE rather
-- than an INSERT. Under a heading that says "Savings", the strings
-- "Direct savings" and "Indirect savings" say the word twice in eight
-- words. The shorter forms carry the distinction that matters --
-- cash-releasing against avoided -- and drop the repetition.
--
-- The UPDATE is the point migration 522 exists to remember: these keys
-- were seeded by 505 and reseeded by 518, so an INSERT OR IGNORE here
-- would have declined in silence and the page would have kept rendering
-- the old wording while this file claimed it had changed it. D1 wins
-- over the renderer's inline fallback, always, and a fallback that
-- disagrees with D1 is a lie the tests are built to catch
-- (tests/roi-i18n.mjs asserts they are character-identical).
--
-- Renumbering is in the renderer, not here: Investment & payback 5 -> ...
-- stays 5 because Savings absorbed a number, and the evidence panel
-- moves 7 -> 6. No string carries its own number.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'steps.aria',     'en', 'How to use this planner'),
  ('roi', 'steps.1',        'en', 'Enter your footprint'),
  ('roi', 'steps.2',        'en', 'Select your countries'),
  ('roi', 'steps.3',        'en', 'Adjust assumptions'),
  ('roi', 'steps.4',        'en', 'Calculate'),
  ('roi', 'steps.5',        'en', 'Move go-live dates'),
  ('roi', 'steps.optional', 'en', 'optional'),

  ('roi', 'sec.savings',      'en', 'Savings'),
  ('roi', 'sec.savings.lede', 'en', 'Two kinds, kept apart on purpose and never added together. Direct savings are cash that stops leaving the business; indirect savings are cost and risk you avoid rather than money you release.');

-- ---- the two subheads, now under a heading that already says Savings ----
UPDATE translations SET value = 'Direct &mdash; cash-releasing'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.direct';
UPDATE translations SET value = 'Indirect &mdash; cost and risk avoided'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.indirect';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'steps.%' = 7
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.direct' AND value = 'Direct &mdash; cash-releasing' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.indirect' AND value = 'Indirect &mdash; cost and risk avoided' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.savings.lede' AND value LIKE '%never added together%' = 1
--
-- The strip is navigation, so every chip must point at an anchor the
-- renderer actually emits. That is asserted in tests/roi-regression.mjs
-- rather than here, because the anchors live in the renderer and not in
-- D1 -- a SQL assertion could only have restated this comment.
--
-- The standing invariant the merge creates: there must be exactly one
-- Savings heading, and both result containers must hang off it. If a
-- later edit ever splits them again, the lede above -- which says they
-- are never added together -- would be orphaned from one of its halves.
-- Also checked in the regression suite, for the same reason.
--
-- And the wording invariant. Neither subhead may say "savings" again
-- while the heading above it already does. (`sec.savings` itself is
-- excluded for the obvious reason, and SQLite's LIKE is case-insensitive
-- for ASCII, so this catches "Savings" as well as "savings" -- which is
-- how the first draft of this line caught itself.)
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('sec.direct','sec.indirect') AND value LIKE '%savings%' = 0
