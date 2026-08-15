-- ================================================================
-- A pie, a two-page PDF, and fields that line up.
--
-- Dan, three requests in one:
--   1. "make sure that the text alignment and spacing is correct. For
--      example; section 1 the field headings wrap sometimes causing the
--      fields to appear at different heights."
--   2. "Rather than printing the page, I would like a professionally
--      oriented PDF download that summarises the page outputs... It
--      should outline headline findings, and display the wave plan.
--      However, any assumptions, or caveats should be displayed on page
--      2. It should be no longer than 2 pages."
--   3. "It might be useful to include a barchart" -- corrected a minute
--      later to "I mean piechart, not barchart".
--
-- ALIGNMENT. Measured before fixing: the footprint row was 19px out, a
-- whole wrapped line, and the assumptions grids 1px. A reserved label
-- height already existed but only on #assump, and was set BELOW the
-- natural two-line height so it never bound. Grid cells are now flex
-- columns with a computed reserved height, on every grid.
--
-- THE PIE. The form guidance prefers a stacked bar for part-to-whole, and
-- objects to pies specifically for comparing CLOSE values -- which this
-- is: two slices are 195,000 and 194,667, 0.2 percent apart and
-- impossible to rank by angle. Built as asked, with the documented relief
-- for that exact case: every slice direct-labelled with both percentage
-- and value, so ranking is read from the labels while the shape carries
-- the gist.
--
-- Three hues, stepped from the site's own families and validated against
-- BOTH the dark card surface and white paper, because the same pie goes
-- into the PDF. The existing pill colours failed as a categorical set --
-- above the lightness band, chroma under the floor, and green/amber only
-- 13.0 apart on the normal-vision scale against a hard floor of 15. The
-- replacements score worst-adjacent CVD 8.4, normal-vision 17.7, and
-- clear 3:1 on both surfaces.
--
-- Percentages use largest-remainder so they sum to 100. Three rounded
-- percentages that visibly total 99 is the small wrongness that makes a
-- reader doubt the large numbers.
--
-- Cycle time gets no slice: this page does not price it, and inventing a
-- number for a chart is the one thing the model refuses to do. The
-- unbanked remainder is not a slice either -- it is not a component of
-- the savings, and on a compliance scope it exceeds all three combined,
-- so it would dominate a chart about savings with money the scope does
-- not realise. It sits beside the pie instead.
--
-- THE PDF. Not the page with things hidden: a separate two-page document
-- built from the same variables at the same moment, with the interactive
-- page suppressed entirely. Page 1 is findings and the wave plan; page 2
-- is every assumption, a figure table with sources and grades, and the
-- disclaimer.
--
-- The on-screen wave chart does NOT appear in it. That chart is
-- 1000x1282 -- portrait -- so capping its height to fit squeezed it to a
-- third of the page width and it became an unreadable smear. A wave table
-- is the better artefact on paper regardless: legible at 8pt, and it
-- states the latest responsible start date, which the chart only implies
-- through the position of a bar.
--
-- Verified by generating real PDFs across four shapes -- 51
-- jurisdictions, both scopes, a million invoices, and a single country --
-- all two pages.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'sv.alt', 'en', 'Composition of annual savings this scope banks'),
  ('roi', 'sv.title', 'en', 'Where the banked saving comes from'),
  ('roi', 'sv.total', 'en', 'Banked annually'),
  ('roi', 'sv.unbankedNote', 'en', 'plus'),
  ('roi', 'sv.unbanked', 'en', 'Unlocked, not banked'),
  -- Same words, different sentence position: one opens a legend row,
  -- the other closes a sentence. One key with two casings silently
  -- picked whichever the extractor met first.
  ('roi', 'sv.unbankedTail', 'en', 'unlocked, not banked'),
  ('roi', 'sv.note', 'en', 'Faster cycle time, fewer supplier queries and avoided penalty exposure carry no slice, because this model does not price them.'),
  ('roi', 'sv.capture', 'en', 'Invoice capture and keying'),
  ('roi', 'sv.issue', 'en', 'Invoice issuing (AR)'),
  ('roi', 'sv.tax', 'en', 'Tax reporting and audit prep'),
  ('roi', 'sv.rework', 'en', 'Rework avoided'),
  ('roi', 'pdf.title', 'en', 'E-Invoicing ROI<br>&amp; Wave Plan'),
  ('roi', 'pdf.masthead', 'en', 'The E-Invoicing Compliance Corner'),
  ('roi', 'pdf.jur', 'en', 'jurisdictions'),
  ('roi', 'pdf.scopeBoth', 'en', 'Compliance + AP automation'),
  ('roi', 'pdf.scopeOnly', 'en', 'Compliance only'),
  ('roi', 'pdf.kpi1', 'en', 'Banked annually'),
  ('roi', 'pdf.kpi2', 'en', 'One-off investment'),
  ('roi', 'pdf.kpi3', 'en', 'Net annual'),
  ('roi', 'pdf.kpi4', 'en', 'Payback'),
  ('roi', 'pdf.h.mix', 'en', 'Where the banked saving comes from'),
  ('roi', 'pdf.h.plan', 'en', 'Compliance wave plan'),
  ('roi', 'pdf.th.golive', 'en', 'Go-live'),
  ('roi', 'pdf.th.who', 'en', 'Jurisdictions'),
  ('roi', 'pdf.th.n', 'en', 'No.'),
  ('roi', 'pdf.th.start', 'en', 'Latest responsible start'),
  ('roi', 'pdf.th.elapsed', 'en', 'Elapsed'),
  ('roi', 'pdf.flags', 'en', 'Flagged by the model:'),
  ('roi', 'pdf.flagsMore', 'en', 'Reasoning overleaf.'),
  ('roi', 'pdf.foot1', 'en', 'Mandate data is live from this site&rsquo;s tracker and traceable to each country&rsquo;s deep dive. Assumptions, sources and evidence grades are on page 2.'),
  ('roi', 'pdf.title2', 'en', 'Assumptions<br>&amp; sources'),
  ('roi', 'pdf.page2', 'en', 'Page 2 of 2'),
  ('roi', 'pdf.h.reasoning', 'en', 'The reasoning'),
  ('roi', 'pdf.h.figures', 'en', 'The figures this rests on'),
  ('roi', 'pdf.th.fig', 'en', 'Figure'),
  ('roi', 'pdf.th.val', 'en', 'Value'),
  ('roi', 'pdf.th.src', 'en', 'Source'),
  ('roi', 'pdf.th.grade', 'en', 'Grade'),
  ('roi', 'pdf.fig.apfte', 'en', 'Invoices per AP FTE / year'),
  ('roi', 'pdf.fig.capture', 'en', 'Capture share of AP effort'),
  ('roi', 'pdf.placeholder', 'en', 'Placeholder &mdash; replace with a vendor quote'),
  ('roi', 'pdf.derivedfee', 'en', 'Derived from your volumes &times; per-invoice fee'),
  ('roi', 'pdf.grades', 'en', 'Grade A measured, primary and attributable &middot; B published by a credible body but unattributed within it &middot; C a single anecdote &middot; D our assumption, nothing claimed. Every D figure is exposed in the tool so it can be argued with rather than believed.'),
  ('roi', 'footer.pdf', 'en', 'This tool models a business case; it is not tax, legal or investment advice. Figures marked D are assumptions, not benchmarks, and should be replaced with your own before any decision rests on them.');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'pdf.%' = 32
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'sv.%' = 11
--
-- The PDF is the one surface nobody sees by accident: generated on
-- demand, read once, and forwarded to someone who was not in the room.
-- So assert its two mastheads actually differ, because a page 2 headed
-- the same as page 1 is precisely the error that ships unnoticed.
--
-- ASSERT: SELECT count(*) FROM (SELECT DISTINCT value FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('pdf.title','pdf.title2')) = 2
--
-- And the standing one. The PDF exists to be handed to someone who
-- cannot ask a question about it, so its disclaimer is load-bearing in
-- a way the page's is not.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'footer.pdf' AND value LIKE '%not tax, legal or investment advice%' = 1
