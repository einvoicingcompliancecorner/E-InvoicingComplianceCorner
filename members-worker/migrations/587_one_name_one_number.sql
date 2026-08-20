-- ================================================================
-- The six things the reassessment left open.
--
-- Dan, 19 August 2026: "please address the remaining items, like
-- Jurisdiction reference."
--
-- None of these was a defect. All six are places where the page is
-- correct and does not look it, which on a document that goes into a
-- board pack is a distinction without much of a difference.
--
-- ================================================================
-- 1. "JURISDICTION" MEANT THREE THINGS ON ONE PAGE
-- ================================================================
--
-- Section 1: "11 jurisdictions in scope."
-- Section 2: "Across 12 jurisdictions you have 9 complex and 3 simple."
-- Box 5:     "10 of your selected jurisdictions have a dated deadline."
--
-- Every figure right, none of them reconciled. 11 is what the reader
-- ticked; 12 is the plan, which injects the EU-wide obligation as its own
-- track; 10 of those carry a date. The page explained the 11-to-12 step
-- in the very next clause -- "One of these is the EU-wide obligation,
-- added automatically" -- but only AFTER printing a number the reader had
-- not seen before and could not place.
--
-- So the sentence starts from the reader's own count and shows the step:
-- "You selected 11 jurisdictions. The plan covers 12: ..."
--
-- One sentence, and the first question in the room stops being asked.
-- The clause about the EU row stays where it is and now explains a jump
-- the reader has already been shown rather than one they have to spot.

-- ================================================================
-- 2. TWENTY-TWO INTEGRATIONS FROM TWELVE JURISDICTIONS AND ONE ERP
-- ================================================================
--
-- "With 1 ERP/billing system that is roughly 22 country-system
-- integrations to deliver." 12 x 1 = 12, and the reader has just been
-- told both numbers.
--
-- 22 IS RIGHT AND IT IS LOAD-BEARING: the $310,000 implementation figure
-- is nine complex builds at $20,000 and thirteen simple connections at
-- $10,000. The extra ten are the EU-wide obligation reaching each member
-- state separately, which is a real cost and the single least obvious
-- thing about this model.
--
-- It was explained in a tooltip. An investment figure that cannot be
-- derived from the sentence containing it does not belong behind a hover,
-- so the sentence says it.

INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'card.mix2', 'en', 'You selected {4}. The plan covers {0}: {1} (CTC or 5-corner) and {2} (4-corner exchange){3}.'),
  ('roi', 'card.integrations2', 'en', 'With {0} that is roughly {1}{2} to deliver &mdash; one per jurisdiction in the plan, and one more per EU member state, because the EU-wide obligation reaches each of them separately.');

DELETE FROM translations WHERE namespace = 'roi' AND key IN ('card.mix', 'card.integrations');

-- ================================================================
-- 3. THE PIE AND THE TABLE NAMED THE SAME MONEY DIFFERENTLY
-- ================================================================
--
--   pie                              table
--   Invoice capture and keying   ->  Processing cost reduction (AP)
--   Invoice issuing (AR)         ->  Issuing cost reduction (AR)
--   Tax reporting and audit prep ->  Reduced tax reporting & audit-prep
--
-- Identical figures, three renamed rows, two inches apart. An independent
-- reader matched them by the money rather than by the label.
--
-- THIRD INSTANCE IN THREE DAYS -- the A/B/C/D grade labels in 582, the
-- platform-versus-software-fees split in 584, and now this. The fix is
-- the one that worked twice: delete the second vocabulary rather than
-- edit it into agreement. The pie reads the ROW keys now, so a row
-- renamed once is renamed in both places.
DELETE FROM translations WHERE namespace = 'roi'
  AND key IN ('sv.capture', 'sv.issue', 'sv.tax', 'sv.rework');

-- ================================================================
-- 4. A ONE-DAY GAP IN THE PAGE'S MOST ALARMING STYLING
-- ================================================================
--
-- "1 selected jurisdiction has an obligation earlier than the date this
-- plan plans for. Poland -- 2026-12-31 (planned for 2027-01-01)."
--
-- One day, full width, red rule, directly under the KPI row. The warning
-- is literally true and the runway it describes is a rounding error. A
-- board member who does that subtraction discounts every other guard on
-- the page, which costs far more than this one protects.
--
-- THIRTY DAYS, chosen as roughly the resolution the plan honestly has:
-- phases are whole weeks, the pace control moves in months, and nothing
-- in this model can distinguish a fortnight. A gap smaller than the
-- plan's own precision is not a finding.
--
-- CHECKED AGAINST THE DATA rather than assumed. Four jurisdictions carry
-- an off-tracker dated obligation. Poland is the only one with a planned
-- date at all, at one day; Brazil, Denmark and Portugal have NO planned
-- date, so the plan files a real dated obligation under "start whenever
-- you have capacity". Those three are the serious case, they fire on a
-- different branch, and they still fire. The threshold silences exactly
-- one row, and it is the one that was costing the other three their
-- credibility.

-- ================================================================
-- 5. VOCABULARY THAT IS OURS RATHER THAN THE READER'S
-- ================================================================
--
-- "L1", "L2" appear against every country in the chart whenever more than
-- one workstream is running, with no key anywhere. They are the parallel
-- workstream a country is assigned to -- a real and useful fact, rendered
-- as an unexplained code. The legend now says so, and only when lanes are
-- actually in play.
--
-- "The arrivals board" is our internal name for our own public tracker.
-- It appeared inside a warning, which is the worst place for a word only
-- we know: a reader who does not recognise it cannot tell whether the
-- warning is about their data or about our site.
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'chart.key.lane', 'en', 'L1&ndash;Ln &middot; which parallel workstream a country runs in'),
  ('roi', 'guard.mistimed.one', 'en', '<strong>{0} selected jurisdiction has an obligation earlier than the date this plan plans for.</strong> {1}. These are dated, live obligations that this site&rsquo;s public tracker does not display, so the wave plan does not schedule it. The runway shown for it is longer than the runway it actually has.'),
  ('roi', 'guard.mistimed.other', 'en', '<strong>{0} selected jurisdictions have obligations earlier than the date this plan plans for.</strong> {1}. These are dated, live obligations that this site&rsquo;s public tracker does not display, so the wave plan does not schedule them. The runway shown for them is longer than the runway they actually have.');

-- ================================================================
-- 6. TWO LABELS THAT DID NOT COVER WHAT THEY LABELLED
-- ================================================================
--
-- "IMPLEMENTATION -- WEEKS" headed a column containing "Parallel
-- workstreams: 5" and "Delivery pace: Typical", neither of which is a
-- number of weeks. A reader scanning it reads "5 weeks of parallel
-- workstreams".
--
-- And the step chip said "Calculate" while the button it links to said
-- "Recalculate" the moment anything was touched -- two names for one
-- action, twelve inches apart, on a strip whose job is to tell a first
-- visitor what to do. The chip is now filled by the same line that
-- relabels the button, so they cannot disagree again.
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'assumptions.h.weeks2', 'en', 'Implementation &mdash; durations and delivery'),
  -- AND THE COLUMN THAT VARIES 43% / 100% / 0% WITH NO REASON ON ITS FACE.
  -- The reviewer called this "where a hostile finance director will
  -- start", and was right: AP clips to 43%, AR and tax stay whole, rework
  -- zeroes, and the badges alone cannot carry the argument. Each row's
  -- justification does explain it -- but 585 folded those, so this is the
  -- one place the fold made something harder rather than easier. The
  -- column heading now answers it once, above all four.
  ('roi', 'help.colBanks', 'en', 'Whether a saving arrives with the compliance build itself, or needs a wider AP change programme you may not be running. Structured invoices post and clear without one; workflow redesign does not. Each row says which, and why, in its justification.');

DELETE FROM translations WHERE namespace = 'roi' AND key = 'assumptions.h.weeks';

-- ================================================================
-- 7. AND A COUNT LABELLED WITH THE WRONG NOUN -- MINE, FROM 585
-- ================================================================
--
-- The nearest-date tile read "10 of your SELECTED jurisdictions have a
-- dated deadline ahead". It counts `dated`, which filters TRACKS -- and
-- tracks include the injected EU-wide row the reader never ticked. So it
-- counted twelve things and named eleven, in the same summary where this
-- migration had just gone to the trouble of distinguishing them.
--
-- Written by me four days ago and found by reading the tile beside the
-- card that reconciles the two counts. Fourth instance this week of a
-- figure labelled with the wrong noun, after the grade tags, the pie
-- labels and the software-fee split -- which is why the count and the
-- card now share a denominator and can be read against each other.
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'res.nearest3.one', 'en', '{0} of the {1} in the plan has a dated deadline ahead.'),
  ('roi', 'res.nearest3.other', 'en', '{0} of the {1} in the plan have a dated deadline ahead.');

DELETE FROM translations WHERE namespace = 'roi' AND key LIKE 'res.nearest2.%';

-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('card.mix2','card.integrations2','chart.key.lane','assumptions.h.weeks2','help.colBanks') = 5
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('card.mix','card.integrations','assumptions.h.weeks','sv.capture','sv.issue','sv.tax','sv.rework') = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key LIKE 'res.nearest2.%' = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'res.nearest3.%' = 2
--
-- Both counts, in both plural forms. The tile states a numerator and a
-- denominator that must be the SAME denominator the footprint card uses,
-- or the summary is back to two numbers nobody can reconcile -- which is
-- the whole subject of this file.
--
-- RETIRED IN PLACE BY MIGRATION 597 (German), 21 August 2026.
--
-- IT COUNTED ROWS, and a second language adds rows. It broke the moment
-- the planner gained one, with nothing actually wrong: the rule it states
-- is still true of every row, and the arithmetic around it was written in
-- a world where there was only ever one.
--
-- The successor in 597 counts VIOLATIONS instead of matches and expects
-- zero, which is strictly stronger — it holds for English, for German and
-- for every language after them, and it does not have to be edited again
-- when the next one lands. That matters more than it sounds: the slot
-- rules exist FOR translators, and this was the check that would have
-- caught a dropped {0} in a language nobody on the team reads.
--
--   was: ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key LIKE 'res.nearest3.%' AND value LIKE '%{0}%{1}%' = 2
--
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'guard.mistimed.%' AND value LIKE '%arrivals board%' = 0
--
-- The footprint sentence must keep BOTH counts. Its whole purpose is
-- showing that 11 and 12 are the same footprint counted before and after
-- the EU row -- drop either and it goes back to printing a number the
-- reader has never seen, which is the defect rather than a symptom of it.
--
-- RETIRED IN PLACE BY MIGRATION 597 (German), 21 August 2026.
--
-- IT COUNTED ROWS, and a second language adds rows. It broke the moment
-- the planner gained one, with nothing actually wrong: the rule it states
-- is still true of every row, and the arithmetic around it was written in
-- a world where there was only ever one.
--
-- The successor in 597 counts VIOLATIONS instead of matches and expects
-- zero, which is strictly stronger — it holds for English, for German and
-- for every language after them, and it does not have to be edited again
-- when the next one lands. That matters more than it sounds: the slot
-- rules exist FOR translators, and this was the check that would have
-- caught a dropped {0} in a language nobody on the team reads.
--
--   was: ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'card.mix2' AND value LIKE '%{0}%' AND value LIKE '%{4}%' = 1
--
--
-- And the integration sentence must keep saying where the extra ones come
-- from. The whole investment side rests on that count, and "roughly 22"
-- beside "12 jurisdictions, 1 system" reads as a mistake unless the
-- sentence accounts for the difference.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'card.integrations2' AND value LIKE '%member state%' = 1
