-- ================================================================
-- Sentences stop being assembled from fragments, and plurals stop being
-- a ternary on n === 1.
--
-- Dan, 17 August 2026: "Please can you look at the translator split
-- sentences, and ensure we are fully ready for translation."
--
-- ---- FIRST, A CORRECTION -------------------------------------------
--
-- The design review said thirty-one split-sentence keys. It is SEVENTEEN
-- numbered continuation keys, and only eleven of those are actually
-- unreorderable; the rest are separate labels that happen to share a
-- prefix. The 31 came from a pattern count that included every key ending
-- in a digit, and it was repeated onward without being checked.
--
-- Worth writing down because it is the failure this project keeps
-- meeting from the other side: a number that is individually plausible,
-- quoted forward, and never re-derived. It was wrong by 14 in the
-- direction that made the job look bigger.
--
-- ---- WHAT A FRAGMENT ACTUALLY IS -----------------------------------
--
-- Not "a key ending in 2". A fragment is a row the translator cannot
-- place, because the renderer decides where its neighbours go:
--
--   chart.late  = "of"
--   chart.late2 = "waves back-plan to a start date that has already
--                  passed."
--
-- rendered as {count} + "of" + {total} + the rest. Two numbers threaded
-- through two rows, one of which is a bare preposition. German and Polish
-- do not put the numeral there and cannot say so.
--
-- Against that, this is FINE and stays:
--
--   basis.ap.calc2 = " &times; {0}% compliance share"
--
-- because it is a WHOLE optional clause dropped into a named slot of a
-- whole sentence. The translator holds both, and can place the clause
-- wherever their language puts it. Optional-clause-in-a-slot is the
-- pattern; fragment-between-two-numbers is the defect. They look alike
-- in a key listing and are opposites in a translator's hands.
--
-- Six sentences were genuinely split and are now one row each.

UPDATE translations SET value =
  '{0} of {1} waves back-plan to a start date that has already passed.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'chart.late';

UPDATE translations SET value =
  '{0} is saved from the integration itself; the remaining {1} needs a change programme you are not running.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'sum.scopeOnly2';

-- The running-cost line was FOUR rows and rendered in TWO places -- the
-- executive summary and the PDF -- each assembling them in its own order.
-- Merging the page's copy alone would have left res.running holding two
-- different Englishes, which the i18n suite treats as a failure and is
-- right to. The PDF has no help icons, so it passes empty strings for
-- slots 1 and 3: a slot one surface does not need is cheaper than a
-- second row that says almost the same thing.
UPDATE translations SET value =
  'plus each year: {0} platform{1} + {2} internal{3}'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.running';

UPDATE translations SET value =
  'plus {0} available on a wider scope'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'sv.unbankedNote';

-- The parentheses and the plus sign move INTO the string. They are
-- punctuation, and punctuation is a language's business: French spaces
-- inside its brackets and several languages bracket differently.
UPDATE translations SET value =
  '(+{0} available on a wider scope)'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.unbanked';

-- These two were split around EVIDENCE CHIPS rather than around numbers
-- -- a superscript grade marker rendered mid-sentence. Same problem: the
-- chip is a citation and different languages cite in different places.
-- Now slots, so it can move.
UPDATE translations SET value =
  'Back-planned from each jurisdiction&rsquo;s published deadline {0} through phase durations you control {1}.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'waves.intro';

UPDATE translations SET value =
  'Paper and postage, because your own spend beats any average. Cycle time and supplier queries, because no study separates the part e-invoicing causes &mdash; Ardent&rsquo;s own {0} compares the most automated quartile with everyone else, and the {1} comes from one unnamed organisation. VAT leakage, penalty exposure and fraud have real mechanisms and no measured magnitudes. They belong in the qualitative case alongside this number.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'notes.unmonetised';

-- The fragments they absorbed. Left in place they would be rows nothing
-- renders, which the i18n suite reports as a failure -- and it did,
-- naming all nine, within a minute of the renderer change.
DELETE FROM translations WHERE namespace = 'roi' AND key IN (
  'chart.late2', 'sum.scopeOnly3', 'waves.intro2',
  'notes.unmonetised2', 'notes.unmonetised3',
  'res.running2', 'res.running3', 'sv.unbankedTail');

-- ================================================================
-- PLURALS BECOME CATEGORIES
-- ================================================================
--
-- plur() was:
--
--     const plur = (n, one, many) => (n === 1 ? one : many);
--
-- above a comment reading "languages with more than two plural forms
-- need more rows, not different code". That sentence was true and it
-- described work that had not been done -- the rows were never added and
-- the ternary stayed. PROSE THAT DESCRIBES A MECHANISM NOBODY BUILT has
-- its own card in the design review; this is another instance, and it was
-- sitting inside the fix for the previous one.
--
-- What two forms gets wrong, in languages this site already sells:
--
--   FRENCH treats ZERO as singular. plur(0, ...) has been returning the
--   plural form. Live today, for French readers, on any count that can
--   reach zero.
--
--   POLISH has three: 1 kraj, 2-4 kraje, 5+ krajow, chosen on the last
--   two digits rather than on whether the number is one. Every one of the
--   fourteen call sites would be wrong at most counts.
--
-- Now: PLURALS carries one entry per noun keyed by CLDR plural category,
-- built server-side from D1; Intl.PluralRules picks the category for the
-- page language. Nothing in this codebase decides what Polish does with
-- 22 -- CLDR does, and it is right about Welsh as well.
--
-- ENGLISH KEEPS ITS EXISTING TWO ROWS. word.jur and word.jurs are
-- unchanged and still carry their fallbacks, so the i18n suite can go on
-- checking that every rendered key exists and matches. A language needing
-- more supplies extra rows named after the singular key --
-- word.jur.few, word.jur.many -- which are language-specific and
-- therefore invisible to the English checks by construction. Adding
-- Polish is INSERTs, which is what migration 505 promised and could not
-- deliver.
--
-- ---- ONE RENAME, AND THE REASON IS NOT COSMETIC --------------------
--
-- The mistimed-obligation guard was already written as two WHOLE
-- sentences rather than a noun in a slot, because its plural changes
-- three separate clauses -- has/have, it/them, "the runway it has"/"the
-- runway they have". That was the right call and it generalises: any
-- sentence whose agreement reaches past the noun belongs as whole forms.
--
-- Its keys were .one and .many. In CLDR, `many` IS A REAL CATEGORY --
-- Polish and Russian both use it, and it is not the plural. Keeping it as
-- a synonym for "the English plural" would collide with the actual
-- category the first time someone adds a Polish row, and the collision
-- would be silent: the sentence would render, in the wrong form, for
-- counts ending in 5 through 9.
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'guard.mistimed.other', 'en', '<strong>{0} selected jurisdictions have obligations earlier than the date this plan plans for.</strong> {1}. These are dated, live obligations that the arrivals board does not display, so the wave plan does not schedule them. The runway shown for them is longer than the runway they actually have.');

DELETE FROM translations WHERE namespace = 'roi' AND key = 'guard.mistimed.many';

-- ---- AND THE SUITE HAD TO LEARN TO SEE THEM ------------------------
--
-- plurSet() calls t() with VARIABLES, so its twenty keys are invisible to
-- the regex the i18n suite uses to find call sites. Left alone, this
-- migration would have dropped twenty keys out of "every key exists in
-- D1" and "D1 is character-identical to the fallback" while both went on
-- reporting PASS against a smaller set.
--
-- Nothing about a refactor looks like a test change, which is exactly
-- when a check's itinerary shortens without anyone deciding it should.
-- The extractor now reads plurSet() and plurSetBase() too, and throws if
-- it finds fewer than eighteen keys rather than quietly checking less.
--
-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('chart.late2','sum.scopeOnly3','waves.intro2','notes.unmonetised2','notes.unmonetised3','res.running2','res.running3','sv.unbankedTail','guard.mistimed.many') = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'guard.mistimed.other' AND value LIKE '%{0}%{1}%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.running' AND value LIKE '%{0}%{1}%{2}%{3}%' = 1
--
-- Every merged sentence must keep the slots that make it reorderable. A
-- future edit that drops a slot puts the number back in the renderer's
-- hands and silently un-does this migration -- silently, because the
-- English still reads correctly either way. That is the whole failure
-- mode: these rows look fine in the language that does not need them.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('chart.late','sum.scopeOnly2','res.running','sv.unbankedNote','res.unbanked','waves.intro','notes.unmonetised') AND value LIKE '%{0}%' = 7
--
-- TWENTY-FOUR keys still end in a digit, and the first draft of this
-- migration asserted there would be nine. That was the same mistake as
-- the "thirty-one fragments" it opens by correcting: treating the KEY
-- SHAPE as the defect rather than the sentence shape.
--
-- The twenty-four were read one at a time. steps.1 through steps.6 are
-- the six step chips. pdf.page2, pdf.title2 and pdf.foot1 name parts of
-- the PDF. ev.ardent2025 carries a year. sum.bridge6 and
-- sec.savings.lede5 are complete sentences whose digit is a rewrite
-- count, not a position. basis.ap.calc2, basis.ap.just2 and
-- card.plusNoMandate are whole optional clauses in named slots -- the
-- correct pattern, not the defect. waves.intro3, waves.intro4,
-- notes.headcount2, sum.scopeBoth2, res.oneOff2 and sec.summary2 are
-- independently placeable sentences or separate labels.
--
-- So the count is recorded as a point-in-time fact rather than a rule. A
-- rule on key names would have deleted six step chips and kept nothing
-- that mattered.
--
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key GLOB '*[0-9]' = 24
--
-- ---- TWO INVARIANTS INHERITED FROM EARLIER MIGRATIONS ---------------
--
-- 545 required res.running, res.running2 and res.running3 all to exist,
-- because annual saving less platform fees less internal run cost is net
-- annual saving and all three parts must be visible. The three became
-- one; THE RULE IS UNCHANGED and is restated against the merged row,
-- checking that both figures still have a slot to go in.
--
-- 550 required both halves of the mistimed guard to exist and to keep
-- their slots. Only the name changed.
--
-- Both are inherited HERE rather than edited in place, because an
-- ASSERT ALWAYS is checked at its own position too, and at 545 and 550
-- these are not yet true. Same rule 545 itself used when it inherited an
-- invariant from an earlier file.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.running' AND value LIKE '%{0}%' AND value LIKE '%{2}%' = 1
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('guard.mistimed.one','guard.mistimed.other') AND value LIKE '%{0}%' AND value LIKE '%{1}%' = 2
