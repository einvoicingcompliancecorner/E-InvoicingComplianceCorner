-- ================================================================
-- Two savings tables become one, ordered by whether a number exists.
--
-- Dan: "I would like to combine direct and indirect tables, such as to
-- tidy the savings section." And then: "With tangible banked entries at
-- the top, and intangible savings at the bottom."
--
-- THEY HAD ALREADY CONVERGED. Migration 536 gave the direct table a
-- second numeric column so its total would be the sum of something
-- visible; 537 gave the indirect table the same column, because the one
-- priced row there had been sitting outside the banking model entirely.
-- After those two the tables had identical headers, an identical banking
-- rule, and a subtotal each -- while section 5 only ever quoted their
-- sum. Splitting them was carrying a distinction the reader does not
-- navigate by.
--
-- WHAT THE READER DOES NAVIGATE BY is whether there is a number. So the
-- merged table is ordered by that and not by kind: everything priced sits
-- above the total with the banked rows first, and the five benefits this
-- model refuses to put a figure on sit below it under their own heading.
-- The old arrangement interleaved them -- a reader scanning the direct
-- table for money passed two em-dashes on the way to the total, and then
-- found four more in the table underneath.
--
-- THE DIRECT/INDIRECT DISTINCTION IS NOT LOST, it moves onto the row as a
-- tag. It still matters -- direct is cash released, indirect is cost
-- avoided, and their evidence differs -- but it is a property of a row,
-- not a reason to build two of everything. The tag is deliberately the
-- quietest of the three a row can carry: tangible/intangible and
-- banks/not-banked tell the reader whether to believe a number and
-- whether they get to spend it, which are the louder questions.
--
-- THE TOTAL CHANGES MEANING, AND THIS IS THE PART TO CHECK. It was the
-- direct table's subtotal ($1,145,400 gross / $448,045 banked). It is now
-- the section's ($1,215,480 / $518,125) -- and $518,125 is exactly the
-- figure section 5 divides into for payback. Before this, section 5's
-- headline number appeared NOWHERE in section 4, which is a large part of
-- why the roll-up was hard to follow in the first place. No arithmetic
-- moved; a number that was already being used is now also shown.
--
-- The gap the hint describes is still l1Unbanked to the cent, because the
-- indirect row banks in full: 1,215,480 - 518,125 = 697,355.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'col.benefit',      'en', 'Benefit'),
  ('roi', 'col.basis',        'en', 'Basis'),
  ('roi', 'tag.direct',       'en', 'direct'),
  ('roi', 'tag.indirect',     'en', 'indirect'),
  ('roi', 'grp.priced',       'en', 'Priced &mdash; counted in the business case'),
  ('roi', 'grp.named',        'en', 'Named, not priced &mdash; real, and this model will not invent a number for them'),
  ('roi', 'row.savingsTotal', 'en', 'Annual benefit'),

  -- The section lede stops promising two sub-sections and describes the
  -- order the single table is actually in.
  ('roi', 'sec.savings.lede2', 'en', 'Priced savings first, banked ones at the top; what this model will not put a number on is named below the total. Direct is cash that stops leaving the business, indirect is cost avoided &mdash; each row says which, and what it banks on your scope. Section 5 uses both.'),

  -- 'Small because almost every circulating number here fails
  -- verification' described the indirect SECTION being short. There is no
  -- indirect section now, and the sentence has to point at the group it
  -- is actually explaining.
  ('roi', 'res.indirectWhy2', 'en', 'That last group is long because almost every circulating number in this field fails verification. What survives is priced above; what does not is named rather than quietly dropped.');

-- ---- the headcount note pointed at a row that moved ------------------
-- "the same money as the row above" was true when this note sat directly
-- under the direct table, whose last row was AP capture. The row above it
-- now is a group heading. This is the clause that stops the headcount
-- line being read as a second saving on top of the first, so it being
-- precise is load-bearing rather than tidy.
UPDATE translations SET value =
 'are released &mdash; the same money as the AP capture row above, priced as people rather than an addition to it.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.headcount.line2';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('col.benefit','col.basis','tag.direct','tag.indirect','grp.priced','grp.named','row.savingsTotal','sec.savings.lede2','res.indirectWhy2') = 9
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.headcount.line2' AND value LIKE '%AP capture row above%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.savings.lede2' AND value LIKE '%named below the total%' = 1
--
-- `sec.direct`, `sec.indirect`, `sec.direct.lede`, `sec.indirect.lede`,
-- `sec.savings.lede` and `res.indirectWhy` are now unread by the
-- renderer. They are LEFT IN PLACE rather than deleted: the dead-data
-- sweep on the recommendations list is the right place to decide which
-- of them are genuinely retired and which the page will want back, and
-- doing it here by hand -- in the same migration that orphaned them --
-- is how the last six orphans were created. Recorded so the sweep finds
-- them on purpose rather than by accident.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('col.gross','col.banks','col.benefit','col.basis') = 4
