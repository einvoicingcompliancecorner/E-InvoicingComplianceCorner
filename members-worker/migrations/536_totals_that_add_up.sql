-- ================================================================
-- A total that is the sum of its column, and a claim the page can keep.
--
-- Dan, validating the arithmetic: "I'm a bit confused by the figures that
-- are shared in section 2, section 4 and section 5. For example - the
-- annual values shared in section 4, how do these factor into the direct
-- total banked savings at the bottom of the same section?"
--
-- THE ARITHMETIC WAS RIGHT. Every figure was recomputed from the inputs
-- in a separate harness -- at both scopes and at 100k and 1M invoices --
-- and every one reconciled to the penny. Nothing here changes a number.
-- What changes is that the page now shows its working.
--
-- WHAT HE ACTUALLY HIT. Section 4's "Annual value" column listed GROSS
-- savings ($590,400 + $195,000 + $360,000 = $1,145,400) under a total
-- reading $448,045, because the total was BANKED and the column was not.
-- The per-row banking rates existed only as tags ("43% banks", "not
-- banked") and the reconciliation lived in a grey parenthetical. A
-- finance reader adds a column and expects the total to match it; here
-- it could not, and the page offered no column that did.
--
-- Section 4 now carries two numeric columns -- gross, and what this
-- scope banks -- and BOTH sum to their own total. The banking rates stay
-- as tags because they carry the reason; the money is now stated as
-- money. On compliance + AP automation the columns are identical, which
-- says "everything banks here" better than a sentence would.
--
-- ---- the claim the page could not keep -----------------------------
--
-- Validating this turned up something worse than a confusing table. The
-- page said, in TWO places, that direct and indirect savings are never
-- added together -- and then added them, in two others:
--
--   section 5   annualBenefit = l1Banked + l2, and payback divides into
--               it. The headline output of the whole tool.
--   the pie     its whole is $518,125, which is exactly direct-banked
--               plus indirect, so the tax slice's 13% was a share of a
--               total the page said did not exist.
--   the PDF     "Banked annually" over that same combined figure.
--
-- Both statements and both contradictions were on screen at once, which
-- is the same shape as the Ardent contradiction migration 525 exists to
-- remember: not a wrong number, a page disagreeing with itself about
-- what its numbers mean.
--
-- Dan's call, given the choice between honouring the rule and dropping
-- it: "The page can include direct and indirect savings added together.
-- please update accordingly, and amend wording." So the arithmetic
-- stands and the wording is corrected to describe it. The reason for
-- reporting them separately survives -- the evidence behind them differs,
-- which is the actual point -- but "never added together" was a claim
-- about arithmetic, and it was false.
--
-- EVERY KEY BELOW IS AN UPDATE, NOT AN INSERT. All seven were seeded by
-- earlier migrations (505, 518, 530, 531, 535), so INSERT OR IGNORE
-- would have declined in silence and left the page saying the opposite
-- of what this file claims. Fifth time migration 522's lesson has come
-- up, and the first time it has applied to every statement in a file.
-- ================================================================

-- ---- new: the two column headings and the total row ----------------
INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'col.gross',            'en', 'Annual value'),
  ('roi', 'col.banks',            'en', 'Banks on this scope'),
  ('roi', 'row.directTotal',      'en', 'Direct total'),
  ('roi', 'row.directTotal.gap',  'en', 'the difference needs a change programme you are not running');

-- ---- the claim, corrected in both places it was made ---------------
UPDATE translations SET value =
 'Reported separately because the evidence behind them differs; the investment case below uses both'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'sum.scopeBoth3';

UPDATE translations SET value =
 'Two kinds, reported separately because the evidence behind them differs. Direct savings are cash that stops leaving the business; indirect savings are cost and risk you avoid rather than money you release. Section 5 uses both.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.savings.lede';

-- ---- and everywhere the combined figure was labelled "banked" ------
-- The pie's whole and the PDF's headline KPI are both l1Banked + l2.
-- "Banked" is the page's word for cash a compliance-only programme
-- actually releases, and the tax row is not that -- it is modelled.
UPDATE translations SET value = 'Where the annual benefit comes from'
 WHERE namespace = 'roi' AND lang = 'en' AND key IN ('sv.title', 'pdf.h.mix');
UPDATE translations SET value = 'Annual benefit'
 WHERE namespace = 'roi' AND lang = 'en' AND key IN ('sv.total', 'pdf.kpi1');
UPDATE translations SET value = 'Composition of the annual benefit on this scope'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'sv.alt';

-- `res.banked` is deliberately NOT touched. It labels the section 2 stat
-- showing l1Banked alone, which genuinely is banked annually. Changing
-- it would have been a sweep by string match rather than by meaning.

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('col.gross','col.banks','row.directTotal','row.directTotal.gap') = 4
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND value LIKE '%added together%' = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND value LIKE '%banked saving%' = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'sum.scopeBoth3' AND value LIKE '%uses both%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.savings.lede' AND value LIKE '%Section 5 uses both%' = 1
-- ASSERT: SELECT value FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.banked' = 'banked annually'
--
-- The standing invariant this episode argues for, and it is about
-- CONSISTENCY rather than correctness. Any string that describes how the
-- two savings kinds relate must not claim they are kept apart, because
-- section 5 and the pie both add them. If someone reinstates that
-- wording without changing the arithmetic, the page starts contradicting
-- itself again in exactly the way it just did -- and the contradiction
-- is invisible from either end on its own, which is why it survived four
-- migrations and a design review.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND (value LIKE '%never added%' OR value LIKE '%not added together%' OR value LIKE '%kept apart%') = 0
