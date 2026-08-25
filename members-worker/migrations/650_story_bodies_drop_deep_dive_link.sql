-- ================================================================
-- The deep-dive link is the renderer's job. Take it out of the bodies.
-- ================================================================
--
-- Dan, 25 August 2026, reading the two stories added in 649:
--
--   "at the bottom of the article, the link to the deep dive is listed
--    twice ... Would it be possible to delete the first reference link
--    to the deep dive, so that there are only two remaining links, one
--    for the official source, and a second for the deep dive. I think
--    this would be consistent with other news article messages."
--
-- He is right on both counts, and the second half is the important one:
-- the shape he is asking for is not a new preference, it is what every
-- other story in the archive already does.
--
-- ---- WHERE THE SECOND LINK COMES FROM --------------------------------
--
-- renderIssue() in members-worker/src/index.js builds the foot of an
-- article itself, in this order, from the story's own row and its
-- country tags:
--
--   1. the accuracy note ("Dates and thresholds above reflect the
--      situation as of {date} ...")
--   2. the official source link, from stories.source_url
--   3. one deep-dive link per tagged country that HAS a deep dive
--
-- That code carries a comment stating the rule outright: "Deep-dive
-- links are always rendered below the source link, never embedded in a
-- story's own HTML." It gives two reasons, and both still hold. A
-- country with a NULL slug (the European Union has no deep-dive page)
-- is skipped rather than linked somewhere broken, and a story tagged
-- with several countries gets one link each.
--
-- So the renderer's link is the correct one and the body's is the
-- duplicate. This migration removes the body's.
--
-- ---- I WROTE THE DUPLICATE, IN 649 -----------------------------------
--
-- gen_sept_mandate_stories.py had a footer() helper that appended that
-- paragraph to all four language bodies. I did not read renderIssue()
-- before writing it, so I reproduced by hand the thing the renderer was
-- already doing, and broke a rule the code states in a comment three
-- lines above the markup it duplicates. The generator has been changed
-- so a future story built from it cannot repeat this.
--
-- ---- BUT 649 WAS NOT THE ONLY ONE ------------------------------------
--
-- Dan noticed it "also exhibited in a couple of other france messages",
-- which is why this file sweeps the whole table rather than the two rows
-- I had just added. Every story body was scanned; twenty-four rows carry
-- the paragraph, across six stories:
--
--   2026-02-24-france-ppf-pilot-opens             de, es, fr
--   2026-07-10-france-no-delay-confirmed          de, es, fr
--   2026-07-28-france-readiness-numbers           de, es, fr
--   2026-08-05-france-dgfip-guide-closeup         en, de, es, fr
--   2026-08-25-france-decret-2026-677             en, de, es, fr
--   2026-08-25-hungary-receipt-data-operational-detail
--                                                 en, de, es, fr
--
-- (Four-language stories show five rows apiece: stories.html_en plus a
-- story_translations row per language, English included.)
--
-- THE THREE OLDER FRANCE STORIES ARE THE INTERESTING ONES. Their English
-- bodies are clean and only the translations carry the link — somebody
-- fixed the English at some point and the de/es/fr rows were left
-- behind. That is precisely the shape of defect a reader in one language
-- sees and a reader in another does not, and it is why the sweep is by
-- query over every row rather than by the list of stories I remembered.
--
-- ---- TWO THINGS THIS ALSO FIXES, WITHOUT BEING ABOUT THEM ------------
--
-- Rendering the pages before and after shows both:
--
--   * 649's French, German and Spanish bodies carried the link with its
--     ENGLISH label, so a French reader got "Read the full France Deep
--     Dive" above a correctly translated one. Another 649 defect; it
--     goes away with the paragraph.
--   * the twenty-one older rows point at "/france.html", which answers
--     307 and is on the known list of legacy .html links still to be
--     repointed. Twenty-one of them stop existing here.
--
-- ---- WHY THE REMOVAL IS SAFE TO DO IN SQL ----------------------------
--
-- The paragraph is uniform and it is the last thing in every body that
-- has it. Checked, rather than assumed, across all 779 story bodies:
--
--   * exactly 24 rows contain the dashed-border style; none contains it
--     twice;
--   * in every one of those, the style opens a <p> that contains
--     nothing but the deep-dive anchor and ends the body — nothing
--     follows it;
--   * after removing it, no story body anywhere in the table contains
--     the 📖 glyph, or any link to this site at all.
--
-- That last point is what makes the standing invariant at the foot of
-- this file honest rather than aspirational: story bodies link OUT, to
-- sources. Links back into this site are the renderer's to place.
--
-- rtrim() takes the newline the paragraph was joined on with it, so a
-- body ends at its last </p> the way an untouched one does.
-- ================================================================

UPDATE stories
   SET html_en = rtrim(
         substr(html_en, 1,
                instr(html_en, '<p style="margin-top:18px; padding-top:14px; border-top:1px dashed #c9bd9e;">') - 1),
         char(32) || char(10) || char(13) || char(9))
 WHERE instr(html_en, '<p style="margin-top:18px; padding-top:14px; border-top:1px dashed #c9bd9e;">') > 0;

UPDATE story_translations
   SET html = rtrim(
         substr(html, 1,
                instr(html, '<p style="margin-top:18px; padding-top:14px; border-top:1px dashed #c9bd9e;">') - 1),
         char(32) || char(10) || char(13) || char(9))
 WHERE instr(html, '<p style="margin-top:18px; padding-top:14px; border-top:1px dashed #c9bd9e;">') > 0;

-- ---- what this migration claims it did ------------------------------

-- THE PARAGRAPH IS GONE FROM BOTH TABLES.
--
-- Counted together in one number on purpose: a version that asserted
-- only over story_translations would have passed while leaving the three
-- English bodies in `stories` untouched, which is half the defect Dan
-- reported and the more visible half.
-- ASSERT: SELECT (SELECT count(*) FROM stories WHERE html_en LIKE '%dashed #c9bd9e%') + (SELECT count(*) FROM story_translations WHERE html LIKE '%dashed #c9bd9e%') = 0

-- AND THE BODIES ARE STILL THERE.
--
-- The removal is a substr() from an instr() offset, and instr() returns
-- 0 when it does not match — so substr(html, 1, -1) on a row the WHERE
-- clause let through by some other route would silently empty it. The
-- WHERE clause prevents that; this line is what would notice if it ever
-- stopped preventing it. 779 bodies, none shorter than a sentence.
-- ASSERT: SELECT (SELECT count(*) FROM stories WHERE length(html_en) < 200) + (SELECT count(*) FROM story_translations WHERE length(html) < 200) = 0

-- ---- and what must stay true afterwards -----------------------------

-- STORY BODIES LINK OUT, NOT BACK IN.
--
-- This is the rule renderIssue() states in a comment and that 649 broke.
-- Stated here as data rather than as a comment, it now fails a migration
-- that reintroduces the pattern instead of waiting for Dan to notice it
-- on a rendered page — which is how both rounds of it were found.
--
-- Note what this does NOT say: it does not forbid the 📖 glyph, or that
-- one paragraph style. Either would be a check on the shape of the
-- particular mistake I made, and the next version of it will look
-- different. A body that links to this site is the actual defect,
-- whatever markup it arrives in.
-- ASSERT ALWAYS: SELECT (SELECT count(*) FROM stories WHERE html_en LIKE '%e-invoicingcompliancecorner.com%') + (SELECT count(*) FROM story_translations WHERE html LIKE '%e-invoicingcompliancecorner.com%') = 0
