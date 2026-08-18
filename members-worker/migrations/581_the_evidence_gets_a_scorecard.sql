-- ================================================================
-- The evidence gets a scorecard, and the page stops apologising.
--
-- Dan, 18 August 2026: "please pickup the remaining items from the
-- usability assessment." Items 12, 13, 7 and 11 of the 17 August review.
--
-- ---- ITEM 12: NOTHING SUMMARISED THE EVIDENCE, WHICH IS THE PRODUCT -
--
-- The assessment's own words. Grades sit on every benchmark and nowhere
-- in aggregate, so a CFO asking HOW MUCH OF THIS IS EVIDENCED had to
-- hover chips across four sections and total them. The page's strongest
-- claim was the one thing the reader had to assemble.
--
-- Three treatments were mocked on the real numbers. Dan: "A + C
-- combined" -- the stacked bar for the proportion, with the paragraph
-- version as its body, absorbing the caveats it replaces.
--
-- ================================================================
-- THE NUMBER THAT DECIDED THE WHOLE SHAPE
-- ================================================================
--
-- The obvious set to score is "every active benchmark". It is also the
-- wrong set and the flattering one.
--
--   27 active benchmarks, 7 grade A          ->  7 of 27.  True.
--   20 the page COMPUTES WITH, 3 grade A     ->  3 of 20.  Honest.
--
-- Seven of the 27 are held only so a claim somewhere can CITE them --
-- the cycle-time figure, the VAT gap, the OECD mechanism. They are good
-- rows and they move nothing. Scoring them beside the numbers the
-- arithmetic actually runs on answers a question nobody asked.
--
-- Scored on the 20: 3 A, 10 B, 0 C, 7 D. Two thirds of what this page
-- computes with is not grade A. That is the fact the page has been
-- careful about everywhere else and had never once stated.
--
-- ---- AND THE SET IS COLLECTED, NOT WRITTEN DOWN --------------------
--
-- val() is the function that reads a benchmark's value, so CALLING val()
-- is what it means to compute with one. The renderer now records each
-- key val() is asked for, and the scorecard scores exactly that set.
--
-- A hand-maintained list of "the driving twenty" would be a literal
-- sitting beside the code it has to agree with -- which is precisely the
-- defect migration 580 found in the grade tags one file ago. Repeating
-- it, in the feature whose entire job is to describe the grades, would
-- have been hard to explain afterwards.
--
-- The count is taken as the LAST statement before the render returns,
-- because the final val() calls are the taxmodel and platform-fee
-- payloads at the very end. Taken any earlier the scorecard silently
-- omits the two grade-D ratios the whole indirect layer rests on, and
-- reports a better answer. It throws below 10 rather than shipping a
-- number it cannot stand behind.
--
-- ---- ONE COUNT WAS WRONG IN THE MOCKUP AND IS DERIVED HERE ---------
--
-- The mockup said "six of the seven grade-D figures are the cost
-- placeholders". It is FOUR. I counted them by reading the list, in a
-- paragraph about how carefully this page counts things. It is now
-- computed from is_cost, which is the only reason the error is not still
-- on the page -- and the third time in this project a figure I quoted
-- about my own work was wrong.

INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'score.h', 'en', 'How much of this is evidenced'),
  ('roi', 'score.kA', 'en', 'measured and primary'),
  ('roi', 'score.kB', 'en', 'credible body, unattributed'),
  ('roi', 'score.kC', 'en', 'weak or anecdotal'),
  ('roi', 'score.kD', 'en', 'our estimate'),
  ('roi', 'score.lead', 'en', 'Of the {0} benchmarks this page computes with, <strong>{1} are measured primary sources</strong>, {2} come from a credible body but are unattributed or carry arithmetic of ours, and {3} are our own estimate. A further {4} are held only so a claim elsewhere can cite them, and are not scored here.'),
  ('roi', 'score.dcost', 'en', '{0} of the {1} grade-D figures are the cost placeholders the investment side is built from &mdash; yours to replace, and marked below.'),
  ('roi', 'score.yours', 'en', '<strong>{0} {1} still hold our numbers rather than yours.</strong>'),
  ('roi', 'score.yoursDone', 'en', '<strong>Every field that needs your own number has one.</strong>'),
  ('roi', 'score.durations', 'en', '<strong>And every date in the wave plan rests on a grade D.</strong> Phase durations are {0}, because no analyst firm publishes credible per-country implementation durations &mdash; this was checked. They are yours to change in section 3.'),
  -- "practitioner estimates", not "grade D". The first version read
  -- "practitioner estimates grade DD" on the page, because ev() renders
  -- its label AND then appends the grade letter as a chip -- so a label
  -- naming the grade prints it twice. Ten suites passed on it. Found by
  -- reading the rendered sentence, which is now the fourth defect on this
  -- page found that way and none of them by a check.
  ('roi', 'ev.durationsShort', 'en', 'practitioner estimates'),
  ('roi', 'word.field', 'en', 'field'),
  ('roi', 'word.fields', 'en', 'fields');

-- The durations sentence is the sharpest thing the independent reviewer
-- said, and it was true: "the entire wave plan rests on a grade D". It
-- was a small underlined caption below the chart, while determining
-- every date in the section most likely to be lifted into a board slide.
-- By this page's own standard that deserves the prominence of the money
-- caveats, not less. It is now a line of the scorecard.

-- ================================================================
-- ITEM 13: ONE SCORECARD INSTEAD OF SCATTERED APOLOGY
-- ================================================================
--
-- The assessment counted, between the headline figures and the first
-- graphic: a scope caveat, a collapsed two-item warning, "6 fields still
-- hold our numbers", "treat the ROI as illustrative", a jurisdiction
-- conflict, a regime-composition paragraph and four "why" links. Then
-- "these figures are placeholders only", "not tax, legal or investment
-- advice", and "carry no slice, because this model does not price them".
--
-- Each defensible. Past a density, honesty stops reading as rigour and
-- starts reading as pre-emptive disclaiming, which is what actually
-- kills a business case in a board room.
--
-- ITS PRESCRIPTION WAS NOT FEWER CAVEATS. It was one scorecard instead
-- of scattered apology -- so the scorecard has to REMOVE something, or
-- it is the eighth hedge rather than the replacement for two of them.
--
-- `guard.placeholders` goes. It was filed as a guard on this reasoning,
-- recorded in the code it is being removed from:
--
--   "the same KIND of thing as the guards -- a conditional statement
--    about this reader's scenario, not about our method"
--
-- That is wrong on its own terms. How many fields still hold OUR
-- defaults is a statement about our method wearing a conditional. Every
-- other guard in that list fires on something the reader's own inputs
-- make true. It also carried the SECOND copy of "treat the ROI as
-- illustrative" -- the first being the static line directly above the
-- four cost inputs it names, which stays, because it sits beside the
-- thing it describes.
--
-- The count now sits in the scorecard beside the grades it qualifies,
-- where it reads as part of an answer rather than as a third apology.
DELETE FROM translations WHERE namespace = 'roi' AND key = 'guard.placeholders';

-- ================================================================
-- ITEM 7: TWENTY-SEVEN AMBER BARS AND NO LEGEND
-- ================================================================
--
-- Every input carries an amber left bar until edited, then turns green.
-- There was no legend for it anywhere. A form marked entirely amber
-- signals nothing: amber conventionally means ATTENTION, and marking
-- every field with it says only that the page has fields.
--
-- Dan chose the legend alone. The assessment also argued for a way to
-- ACCEPT A DEFAULT DELIBERATELY -- as it stands the only route from
-- amber to green is changing a value, so the page rewards typing over
-- the best-evidenced numbers on it and gives a reader who has read the
-- 60% reduction and agreed with it no way to say so.
--
-- THAT GAP IS REAL AND STAYS OPEN, recorded here rather than quietly
-- dropped. A single "I have reviewed these" control cannot tell the
-- field someone studied from the one they scrolled past, so its green
-- would assert more than the click establishes; per-field ticks are 27
-- new pieces of state that must survive a currency switch and a Reset.
-- An honest legend beats a green tick that means less than it looks.
--
-- THE COLOURS ARE SLOTS, NOT MARKUP, and two standing invariants are the
-- reason. The first draft inlined them -- <span style="color:#c98a3a">
-- amber</span> -- and the replay refused the file twice over: migration
-- 551 bans style= in any roi string, and 571 bans the double quote an
-- attribute needs. Both were right for a reason neither states in these
-- words: a translator should receive a sentence with two slots, not
-- markup to preserve, and the colours belong beside the ribbon rules they
-- describe rather than inside a sentence about them.
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'ribbon.legend', 'en', 'The bar down the left of every input says whose number it is: {0} is ours, {1} is yours. Ours are defaults you can argue with, not blanks you must fill.'),
  ('roi', 'word.amber', 'en', 'amber'),
  ('roi', 'word.green', 'en', 'green');

-- ================================================================
-- ITEM 11: THE PAGE SAID "LIVE" FOUR TIMES AND CARRIED A TYPED DATE
-- ================================================================
--
-- The footer read "Country mandate data is live as of 11 August 2026".
-- The assessment was written on the 17th. This migration is the 18th.
-- The date was a literal in a translated string, so it was wrong six
-- days after it was typed and would have been wrong for ever.
--
-- THE FIRST FIX ATTEMPTED WAS TO DERIVE IT, and it was rejected on
-- inspection. There is no freshness field: countries and milestones
-- carry no reviewed-at or updated-at column. schema_migrations.applied_at
-- exists and is tempting, and it answers a DIFFERENT question -- a
-- migration that reworded a tooltip would refresh the date without anyone
-- having looked at Poland. A derived date would have been more precise
-- and no more true, which is worse than an obviously stale one because
-- it stops looking stale.
--
-- So the claim is withdrawn rather than restated. What this page can
-- actually back is TRACEABILITY: every mandate date is traceable to the
-- cited legal instrument on that country's deep dive, which is where a
-- reader checks it. That was always the real guarantee; "live" was
-- decoration on top of it, and the four occurrences said it about the
-- one thing that is not verifiable from the page.
--
-- If a genuine reviewed-at date is ever wanted, it needs a column and a
-- process that maintains it, not a sentence.
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'footer.text', 'en', '<strong>The E-Invoicing Compliance Corner</strong> &mdash; ROI &amp; wave planner. Every mandate date here is traceable to the cited legal instrument on that country&rsquo;s deep dive, which is where to check it. Benchmark figures carry the evidence grade shown against each. This tool models a business case; it is not tax, legal or investment advice.'),
  ('roi', 'ev.site.body', 'en', 'Mandate data from this site&rsquo;s own tracker: status, model and dated deadlines per jurisdiction, each traceable to the cited legal instrument on that country&rsquo;s deep dive &mdash; which is the guarantee, rather than any claim about how recently it was checked.'),
  ('roi', 'ev.siteLabel', 'en', 'Source: tracker data'),
  ('roi', 'pdf.foot1', 'en', 'Mandate data comes from this site&rsquo;s tracker and every date is traceable to each country&rsquo;s deep dive. Assumptions, sources and evidence grades are on page 2.');

-- ---- what this migration claims it did ------------------------------
-- Ten, and it said nine on the first run. The replay refused the file
-- until it was right, which is the fourth time in this project a count I
-- quoted about my own work was wrong and the second in two migrations --
-- and the reason every count the READER sees is a slot rather than a
-- literal is the same reason.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'score.%' = 10
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('ribbon.legend','ev.durationsShort','word.field','word.fields','word.amber','word.green') = 6
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'guard.placeholders' = 0
--
-- Every count in the scorecard is a SLOT, never a literal. This is the
-- rule migration 557 learned when `res.placeholders` hardcoded "of 4 cost
-- inputs" and the set became six -- and the scorecard is the worst place
-- on the page to relearn it, because a sentence about how many figures
-- are evidenced is the one sentence a reader will check.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'score.lead' AND value LIKE '%{0}%{1}%{2}%{3}%{4}%' = 1
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'score.dcost' AND value LIKE '%{0}%{1}%' = 1
--
-- And no roi string may carry a typed calendar year again. This is the
-- invariant item 11 actually needs: the footer date was not wrong
-- because someone chose badly, it was wrong because a date was typed
-- into a sentence at all. Written as a pattern rather than a key list so
-- that the next sentence to acquire one is caught rather than the one
-- that already had it.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND (value LIKE '%20\_\_ %' ESCAPE '\' OR value LIKE '%as of %20%') AND key NOT IN ('assumptions.h.weeks') = 0
--
-- The ribbon legend must keep naming BOTH states. A legend that explains
-- amber and not green would leave a reader who has edited three fields
-- with no account of why those three look different, which is the whole
-- mechanism it exists to explain.
--
-- Stated on the SLOTS rather than on the words, because the words moved
-- out of the string in the rewrite above and a check for '%amber%' would
-- now pass only in English.
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'ribbon.legend' AND value LIKE '%{0}%{1}%' = 1
