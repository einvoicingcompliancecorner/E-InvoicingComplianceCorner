-- ================================================================
-- "Banked" leaves the executive summary.
--
-- Dan: "Can you update the headings on the executive summary; From
-- 'banked annually' to Annual Saving', and from 'Net annual' to Net
-- Annual Saving'. The banked term, I think might not translate well -
-- when we look at internationalising the page."
--
-- He is right, and the reason is worth stating because it generalises.
-- "Banked" here is a finance idiom meaning realised-and-keepable, as
-- distinct from identified. English carries that in one word; Spanish,
-- German and French do not. A translator handed "banked annually" has to
-- either coin a phrase or fall back on "saved", at which point the
-- careful distinction this page spent migrations 528 and 536 building
-- collapses into the ordinary word for saving -- in three languages at
-- once, silently, because a translation that reads fluently looks
-- correct.
--
-- WHAT CHANGES HERE, and it is deliberately only the summary:
--   res.banked     'banked annually'      -> 'Annual saving'
--   res.netAnnual  'Net annual'           -> 'Net annual saving'
--   res.unbanked   'unlocked, not banked' -> 'available on a wider scope'
--
-- THE THIRD ONE WAS NOT REQUESTED AND IS NOT OPTIONAL. `res.unbanked`
-- renders INSIDE the label `res.banked` produces: the stat reads "Annual
-- saving (+$697,355 unlocked, not banked)". Changing the heading and
-- leaving the parenthetical would have put the untranslatable word back
-- into the very label being fixed, three words later. Its replacement
-- also says something truer: that money is not un-bankable, it is
-- available on the wider scope this reader has not selected.
--
-- Note the labels render through `text-transform: uppercase`, so the
-- title case Dan wrote is not what appears -- ANNUAL SAVING either way.
-- Stored as written, because the CSS is a presentation choice that could
-- change and the string should read correctly if it does.
--
-- ---- WHAT IS DELIBERATELY NOT CHANGED, AND WHY IT MATTERS MORE -------
--
-- "Banked" is load-bearing vocabulary across the rest of this page:
-- `col.banks` ("Banks on this scope"), `notes.banks.h` ("What compliance
-- alone banks"), `row.tax.banks`, `sum.scopeOnly2`, `sum.bridge`,
-- `sum.bridge5`, `sec.savings.lede4`, `sv.unbanked`, `sv.unbankedTail`
-- and `notes.rework` -- ten live strings, plus the two ledes and other
-- orphans that still carry it.
--
-- Changing three and leaving ten would make the page LESS coherent than
-- either changing all of them or none: the summary would say "saving"
-- while the table it summarises says "banks", and a reader would
-- reasonably wonder whether they are two different things. So this
-- migration fixes what was asked and the string that had to move with
-- it, and the rest is raised as a decision rather than taken quietly.
--
-- AND THE PART A TRANSLATION PASS WOULD HIT FIRST. Three of the banking
-- labels are NOT IN D1 AT ALL -- 'banks', 'not banked' and the
-- '43% banks' construction are English literals in the renderer's
-- template, on the tags attached to every priced row. They cannot be
-- translated by adding rows; they need code changes. Any
-- internationalisation of this page starts there, not with the strings
-- above, and this comment exists so that is discovered before the work
-- is scoped rather than during it.
-- ================================================================

UPDATE translations SET value = 'Annual saving'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.banked';
UPDATE translations SET value = 'Net annual saving'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.netAnnual';
UPDATE translations SET value = 'available on a wider scope'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.unbanked';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.banked' AND value = 'Annual saving' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.netAnnual' AND value = 'Net annual saving' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.unbanked' AND value = 'available on a wider scope' = 1
--
-- The three summary labels must stay free of the idiom, which is the
-- whole point of the change and the thing a later edit could undo
-- without noticing -- "banked annually" is a natural phrase to reach for
-- when editing a stat about money kept.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('res.banked','res.netAnnual','res.unbanked') AND value LIKE '%bank%' = 0
