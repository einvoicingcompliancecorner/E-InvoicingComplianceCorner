-- ================================================================
-- The PDF catches up with the page.
--
-- Dan: "can you look at the pdf print, and ensure that all of the
-- relevant information is captured. We have revised the financial
-- information heading and other sections, including prose, which may
-- need to be updated."
--
-- ---- WHY THE PDF DRIFTS AND THE PAGE DOES NOT -----------------------
--
-- Page 2 was already correct, and that is the useful clue. Its reasoning
-- cards and evidence panel read the SAME D1 rows the page reads, so
-- migration 566's rewrite reached the PDF the moment it was applied,
-- without anyone touching the PDF code.
--
-- Everything wrong below is a place where the PDF holds its OWN copy of
-- something: its own KPI labels, its own figures table, its own closing
-- prose. Shared rows stayed right; duplicated ones rotted. That is the
-- "one model, two renderings" card in the design review, stated as a
-- rule rather than an anecdote -- and it is the fourth time it has cost
-- something here, after the jurisdiction count, the gantt label and the
-- PDF's missing undated jurisdictions in 546.
--
-- ---- 0. AND THERE WERE FOUR BOXES WHERE THE PAGE SHOWS FIVE --------
--
-- Dan: "can we get the 5 headline executive statement boxes, rather than
-- 4 as displayed in the pdf".
--
-- The missing one is the count of jurisdictions with a dated deadline
-- ahead -- the only figure on that strip that is not money, which is
-- likely why it was dropped when the PDF was built. It is also the one
-- that says how much of the plan is compelled rather than chosen, which
-- is the first thing a board asks.
--
-- ---- 1. THE HEADLINE WAS RENAMED THIRTEEN MIGRATIONS AGO ------------
--
-- Migration 543 renamed the summary stats because "banked" does not
-- translate: `res.banked` became "Annual saving" and `res.netAnnual`
-- became "Net annual saving". The PDF prints the SAME TWO NUMBERS under
-- "Annual benefit" and "Net annual".
--
-- So the board pack and the screen have been calling one figure two
-- different things for six days, which is precisely the confusion 543
-- existed to prevent. The pie heading follows for the same reason.
--
-- Fixed by DELETING the PDF's copies, not by correcting them -- see the
-- assertions below.
--
-- ---- 2. TWO INPUTS NEVER REACHED THE FIGURES TABLE ------------------
--
-- 557 added the reader's current e-invoice share and 558 replaced the
-- rework cost with a resolution time in minutes. Both are among the
-- largest levers on the model -- the share alone halves the processing
-- saving at its default -- and NEITHER appears in "The figures this
-- rests on".
--
-- A reader auditing the PDF could see "Errors eliminated 80%" with no
-- minutes to apply it to, and could not see the share at all. The
-- decomposed manual cost is added beside them, because $14.23 appears
-- nowhere in a table whose only AP cost is Ardent's blended $9.84 --
-- printing both is what makes the AP row reconstructable.
--
-- ---- 3. THE REDUCTION'S SOURCE LINE PREDATES ITS CORROBORATION ------
--
-- Migration 560 established that the ATO's channel costs independently
-- imply a 67-70% reduction, which is the first support HMRC's 60-80%
-- range has ever had. The PDF still cited HMRC alone -- the weakest
-- version of the page's own evidence, on the artefact most likely to be
-- challenged in a room.
--
-- ---- 4. AND THE CLOSING PROSE WAS THE OLD REGISTER ------------------
--
-- "D our assumption, nothing claimed. Every D figure is exposed in the
-- tool so it can be argued with rather than believed." Migration 566
-- removed exactly that sentence from the page hours earlier; the PDF
-- holds its own copy, so it survived. Now: "D our starting estimate.
-- Every D figure can be replaced with your own in the tool."
-- ================================================================

UPDATE translations SET value = 'Where the annual saving comes from'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'pdf.h.mix';

UPDATE translations SET value = 'Grade A measured, primary and attributable &middot; B published by a credible body but unattributed within it &middot; C a single anecdote &middot; D our starting estimate. Every D figure can be replaced with your own in the tool.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'pdf.grades';

UPDATE translations SET value = 'This tool models a business case; it is not tax, legal or investment advice. Figures marked D are our starting estimates rather than benchmarks &mdash; replace them with your own before any decision rests on them.'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'footer.pdf';

-- Dan: the strip should read "Countries with a dated deadline ahead"
-- rather than "With a dated deadline ahead". The old label was a
-- fragment that only made sense sitting under its own number, which is
-- fine in a grid and poor everywhere else -- a screen reader, a
-- translation, or a PDF read out of context all get half a sentence.
--
-- ONE ROW, BOTH SURFACES. This is the first change to land on the page
-- and the PDF together with no second edit, because the deduplication
-- above means there is now one string where there were two. Worth
-- noting as the payoff rather than a coincidence.
UPDATE translations SET value = 'Countries with a dated deadline ahead'
 WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.dated';

-- The PDF's own KPI labels, now that it reads the page's.
DELETE FROM translations WHERE namespace = 'roi' AND key LIKE 'pdf.kpi%';

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'src.yoursAto', 'en', 'Yours &mdash; market average 51% (Ardent)'),
  ('roi', 'src.decomposed', 'en', 'Ardent blend split at the 51.4% market share'),
  ('roi', 'src.atoExceptions', 'en', 'ATO / Deloitte exception times'),
  ('roi', 'src.hmrcAto', 'en', 'HMRC / DBT 2025; ATO channel data implies 67&ndash;70%'),
  ('roi', 'pdf.fig.manual', 'en', 'Manual invoice cost, decomposed');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('src.yoursAto','src.decomposed','src.atoExceptions','src.hmrcAto','pdf.fig.manual') = 5
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key LIKE 'pdf.kpi%' = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'res.dated' AND value = 'Countries with a dated deadline ahead' = 1
--
-- THE DUPLICATION IS REMOVED RATHER THAN POLICED, and that was the
-- second attempt. The first fix updated `pdf.kpi1` and `pdf.kpi3` to
-- match the screen and added a standing invariant joining the two rows
-- to keep them equal. It would have worked, and it was the wrong shape:
-- an invariant that two strings must always be identical is an admission
-- that one of them should not exist.
--
-- The PDF now reads `res.banked`, `res.oneOff`, `res.netAnnual`,
-- `res.payback` and `res.dated` -- the same rows the executive summary
-- renders. There is one string per label, so the two surfaces cannot
-- disagree, and no check is needed to say so.
--
-- And neither closing paragraph may drift back into defending the model.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('pdf.grades','footer.pdf') AND (value LIKE '%argued with%' OR value LIKE '%nothing claimed%') = 0
