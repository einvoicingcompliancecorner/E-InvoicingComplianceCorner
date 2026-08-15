-- ================================================================
-- The page's taxonomy and tooltip chrome move into D1.
--
-- Dan: "Please can you action '1 · Finish moving the ROI page's English
-- into D1'".
--
-- ---- WHAT THE CHECK FOUND, AND WHY THE ESTIMATE WAS WRONG -----------
--
-- The recommendation was written at "half a day" on the assumption that
-- 544 and 545 had found most of the hardcoded English by accident. The
-- detector built for this migration says otherwise: render the page with
-- every D1 value replaced by a sentinel, drive it in a browser, read the
-- visible text, and whatever is still English is hardcoded.
--
-- It found 166 strings. Not nine.
--
-- The first run reported 240, and 74 of those were the detector's fault:
-- it stubbed the `strings` map but not benchmark labels, hints and
-- citations, nor phase names and notes -- all of which are D1-backed and
-- were surviving the stub legitimately. Fixed by stubbing those too.
-- Same lesson as the dead-data sweep two migrations ago: the sweep is
-- only as good as the question, and a too-convenient result is the
-- signal to re-read the question.
--
-- ---- WHAT THIS MIGRATION MOVES, AND WHY THIS SUBSET -----------------
--
-- 26 strings: the page's TAXONOMY and its tooltip CHROME.
--
--   5  status labels     In force, Upcoming, B2G only, No mandate, Tracked
--   3  complexity labels Complex, Simple, No mandate
--   3  complexity notes  the sentence explaining each
--   4  region headings   Europe, MEA, Asia-Pacific, Americas
--  12  tooltip titles    "What this drives", "How this is derived", ...
--
-- These were chosen first because they are the page's vocabulary rather
-- than its prose. Every country row carries a status pill and a
-- complexity pill; every input carries a tooltip title. If those twelve
-- words stay English, nothing below them reads as translated however
-- carefully the surrounding sentences are handled -- and they are the
-- cheapest strings on the page to move, because each is a label with no
-- surrounding sentence to restructure.
--
-- ---- WHAT IS DELIBERATELY LEFT, AND THE HONEST SIZE ----------------
--
-- About 120 strings remain, and they are NOT another afternoon. They
-- are not labels; they are prose fragments interleaved with computed
-- values, of this shape:
--
--   'Across ' + N + ' jurisdictions you have ' + X + ' complex (CTC or
--    5-corner) and ' + Y + ' simple (4-corner exchange) regimes'
--
-- Extracting that as one translatable sentence means restructuring it
-- into a formatter with positional arguments, because word order moves
-- between languages and a German translator cannot reorder fragments
-- that JavaScript concatenates in a fixed sequence. Doing it fragment by
-- fragment -- 'Across', 'jurisdictions you have', '(CTC or 5-corner) and'
-- -- would produce rows that are individually translatable and
-- collectively untranslatable, which is worse than leaving it in English
-- because it looks finished.
--
-- The same applies to the guard messages, the evidence-tooltip bodies,
-- the savings-table row labels and their basis clauses, and the gantt
-- tooltips. Roughly: 40 short labels that are straightforward, and 80
-- fragments that need the sentence rebuilt around a formatter first.
--
-- That is a real piece of work and it should be scoped as one, not
-- smuggled into a migration whose comment claims it was half a day.
-- tests/roi-i18n.mjs now carries the full inventory as an explicit
-- allowlist, so the number can go down and cannot go up.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'tip.drives', 'en', 'What this drives'),
  ('roi', 'tip.changes', 'en', 'What this changes'),
  ('roi', 'tip.rate', 'en', 'Where the rate comes from'),
  ('roi', 'tip.data', 'en', 'Where this data comes from'),
  ('roi', 'tip.phase', 'en', 'What this phase covers'),
  ('roi', 'tip.once', 'en', 'What “once” means here'),
  ('roi', 'tip.means', 'en', 'What this means'),
  ('roi', 'tip.covers', 'en', 'What this covers'),
  ('roi', 'tip.nomandate', 'en', 'Why these are still in the plan'),
  ('roi', 'tip.derived', 'en', 'How this is derived'),
  ('roi', 'tip.deadlines', 'en', 'Where these deadlines come from'),
  ('roi', 'tip.complexity', 'en', 'How complexity is assigned'),
  ('roi', 'status.inforce', 'en', 'In force'),
  ('roi', 'status.upcoming', 'en', 'Upcoming'),
  ('roi', 'status.b2g', 'en', 'B2G only'),
  ('roi', 'status.nomandate', 'en', 'No mandate'),
  ('roi', 'status.tracked', 'en', 'Tracked'),
  ('roi', 'cx.complex', 'en', 'Complex'),
  ('roi', 'cx.simple', 'en', 'Simple'),
  ('roi', 'cx.complex.note', 'en', 'CTC or 5-corner: the tax authority is a party to the transaction &mdash; clearance, pre-validation, or invoice-level reporting. Certification, response handling and status reconciliation on top of the exchange.'),
  ('roi', 'cx.simple.note', 'en', 'Decentralised 4-corner exchange only. Structured invoices move between accredited access points; the tax authority is not in the loop.'),
  ('roi', 'cx.none.note', 'en', 'No mandate to build for. Included only because you selected it &mdash; there is no deadline, so this work can start whenever you have capacity.'),
  ('roi', 'region.eu', 'en', 'Europe'),
  ('roi', 'region.mea', 'en', 'Middle East / Africa'),
  ('roi', 'region.apac', 'en', 'Asia-Pacific'),
  ('roi', 'region.am', 'en', 'Americas');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'tip.%' = 12
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'status.%' = 5
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'cx.%' = 5
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'region.%' = 4
--
-- `status.nomandate` is used by BOTH the status pill and the complexity
-- pill, which is why cx.* is five rows and not six. That is deliberate:
-- they are the same words meaning the same thing, and giving them two
-- rows would let a translator render them differently on one screen.
--
-- The standing invariant is the taxonomy itself. These are the labels a
-- reader sees on every country row, and a later edit adding a sixth
-- status or a fourth complexity tier in English would be invisible --
-- the page would render, the tests would pass, and one pill in every
-- table would be untranslated.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('status.inforce','status.upcoming','status.b2g','status.nomandate','status.tracked','cx.complex','cx.simple','region.eu','region.mea','region.apac','region.am') = 11
