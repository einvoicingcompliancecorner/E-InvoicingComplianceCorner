-- ================================================================
-- What share of your invoices already arrives as an e-invoice.
--
-- Dan: "Is the Current eInvoice rate, as a percentage - something we
-- could assert in the assumptions, with the user having to update. As we
-- have done with other metrics?" And, choosing the default: "Default 50%
-- already electronic".
--
-- ---- WHY THIS INPUT EXISTS -----------------------------------------
--
-- The evidence review of `cost_reduction_pct` found that the model was
-- applying a ratio and a baseline drawn from different populations:
--
--   the 60-80% range   Ardent's own words: "ePayables solutions ...
--                      contributing to processing cost reductions that
--                      can be as much as 60-80% WHEN COMPARED TO MANUAL-
--                      AND PAPER-BASED METHODS."
--   the $9.84 baseline Ardent's BLENDED market average, which the same
--                      report says is 51.4% electronic already.
--
-- You cannot save 60% of a cost that is already half optimised. Before
-- this migration the page did exactly that, and the direction of the
-- error depended on a fact it never asked for.
--
-- ---- THE DECOMPOSITION ---------------------------------------------
--
-- Two published numbers pin the two channel costs. At a 60% reduction and
-- a 51.4% market share, the blend of $9.84 resolves to:
--
--   manual invoice      $14.23
--   e-invoice           $5.69      0.486 x 14.23 + 0.514 x 5.69 = 9.84
--
-- A reader's saving is then (1 - their share) x $8.54 per invoice, which
-- is zero when everything already arrives structured and maximal when
-- nothing does. That is the shape the arithmetic should always have had.
--
-- ---- WHAT MOVES, AND WHY THAT IS THE POINT --------------------------
--
-- At the 50% default the AP saving falls from $5.90 to $4.27 per invoice,
-- about 28%. THE HEADLINE GOES DOWN. That is the correct direction and
-- worth stating plainly: a model whose numbers only ever improve when its
-- authors revisit it is a model nobody should trust. This page has
-- rebuilt its economics five times this fortnight and this is the first
-- change that reduces the answer.
--
-- ---- A DEFINITIONAL PROBLEM NEITHER SOURCE SOLVES -------------------
--
-- Ardent never defines "electronically". Checked against the report: it
-- gives 51.4% received electronically against 48.6% paper, and 57.4% of
-- suppliers submitting electronically, with no breakdown by format. If
-- that figure counts emailed PDFs, the decomposition above is optimistic,
-- because the ATO puts a PDF at AUD 27.67 against paper at 30.87 and a
-- true e-invoice at 9.18 -- a PDF is barely cheaper than paper.
--
-- THIS IS THE STRONGEST ARGUMENT FOR THE INPUT rather than against it.
-- No published source resolves the term, so the only honest number is
-- the reader's own -- and the label says STRUCTURED so they are not
-- answering Ardent's ambiguous question.
--
-- `market_einvoice_share` is graded B for the same reason: Ardent
-- measured it, which is grade A behaviour, but published it without
-- defining the denominator, which is not.
--
-- ---- AR IS DELIBERATELY UNTOUCHED ----------------------------------
--
-- `ar_cost_per_invoice` is derived from the ATO channel figures, which
-- are already channel-specific rather than blended, so it does not carry
-- the same defect. Left alone rather than adjusted by the same share:
-- issuing and receiving adoption are different facts about a business,
-- and one input standing in for both would be a guess wearing a number.
-- Flagged rather than fixed, because fixing it needs its own evidence.
-- ================================================================

INSERT OR IGNORE INTO roi_benchmarks (key, default_value, unit, evidence_grade, source_url, source_year, is_cost, sort_order) VALUES
  ('einvoice_share_now', 50, '%', 'B',
   'https://d15fjz85703yz4.cloudfront.net/1517/5157/1685/Ardent_Partners_-_State_of_ePayables_2025_-_Bottomline_-_FINAL.pdf',
   '2025 data', 0, 9),
  ('market_einvoice_share', 51.4, '%', 'B',
   'https://d15fjz85703yz4.cloudfront.net/1517/5157/1685/Ardent_Partners_-_State_of_ePayables_2025_-_Bottomline_-_FINAL.pdf',
   '2025 data', 0, 10);

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Invoices already received as e-invoices',
  'Your own figure &mdash; the market average is 51%',
  'The share of your supplier invoices that ALREADY arrive as structured e-invoices. Not PDFs: a PDF still has to be read and keyed, and the ATO puts one at AUD 27.67 against AUD 30.87 for paper and AUD 9.18 for a true e-invoice. <strong>This is the single largest lever on the processing-cost row</strong>, because a saving can only be taken once &mdash; whatever already arrives structured has already banked it. Defaulted to 50%, close to the market average, at Dan&rsquo;s direction; set it to your own position, and to 0 if you are starting from nothing.'
  FROM roi_benchmarks WHERE key = 'einvoice_share_now';

INSERT OR IGNORE INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
SELECT id, 'en', 'Market e-invoice share (used to decompose the benchmark)',
  'Ardent Partners, 2025 data',
  'Ardent Partners, <em>The State of ePayables 2025</em>: <strong>51.4%</strong> of invoices are received electronically against 48.6% on paper. Used only to split the blended $9.84 market-average cost into its manual and electronic components, so that a reader&rsquo;s own share can be applied to the right baseline. <strong>Graded B rather than A because Ardent does not define &ldquo;electronically&rdquo;</strong> &mdash; the report gives no breakdown by format, so it is not established whether emailed PDFs are counted. Measured, which is grade A behaviour; published without a denominator, which is not.'
  FROM roi_benchmarks WHERE key = 'market_einvoice_share';

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'input.eShare', 'en', 'E-invoices received today %'),
  ('roi', 'basis.apShare', 'en', '{0} invoices &times; {1} {2} &times; {3}% {4}, less the {5}% already arriving structured {6}');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'einvoice_share_now' = 50
-- ASSERT: SELECT default_value FROM roi_benchmarks WHERE key = 'market_einvoice_share' = 51.4
-- ASSERT: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'einvoice_share_now' AND t.citation LIKE '%Not PDFs%' = 1
-- ASSERT: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'market_einvoice_share' AND t.citation LIKE '%does not define%' = 1
--
-- The decomposition needs BOTH shares to mean something. The market share
-- splits the benchmark; the reader's share is applied to the result. Lose
-- either and the processing row silently reverts to taking 60% of a
-- blended cost, which is the defect this file exists to remove -- and it
-- would look entirely normal on screen.
--
-- ASSERT ALWAYS: SELECT count(*) FROM roi_benchmarks WHERE active = 1 AND key IN ('einvoice_share_now','market_einvoice_share') = 2
--
-- And the label must keep saying STRUCTURED. Ardent's undefined
-- "electronically" is the reason this input exists; asking the same
-- ambiguous question would inherit the ambiguity rather than resolve it.
--
-- ASSERT ALWAYS: SELECT count(*) FROM roi_benchmark_translations t JOIN roi_benchmarks b ON b.id = t.benchmark_id WHERE b.key = 'einvoice_share_now' AND t.lang = 'en' AND t.citation LIKE '%structured%' = 1

-- ---- and the guidance Dan asked for in the same breath ---------------
-- "Please also - under assumptions, ensure that the user is guided to
--  those fields that we need them to update to make the business case
--  real."
--
-- The grade tags answer "how good is OUR number". These answer a
-- different question the panel never asked: "which of these are not ours
-- to give". Six fields carry it -- the four vendor placeholders, the
-- rework cost, and the reader's own e-invoice share -- and the line
-- counts DOWN as they are filled in, because a static warning becomes
-- furniture and a shrinking one is progress.
--
-- HOW THE SIX ARE MARKED, and the constraint that decided it. The first
-- draft put a YOURS chip on the field and gave it the page's amber. Both
-- were wrong, and a screenshot said so before any test could:
--
--   * AMBER WAS ALREADY TAKEN. markOverridden() has bordered every
--     changed input in --soon since this panel was built, and writes
--     "Your value." into its hint. On this panel amber already means YOU
--     SET THIS. Reusing it for "we still need you to set this" would have
--     one colour asserting a thing and its negation in the same grid row.
--   * ONE CHIP ON ONE FIELD READ AS AN EXCEPTION. Twenty fields carry an
--     A/B/D grade; a YOURS chip on a single one implied the other five
--     needs-you fields were fine, which is the opposite of the message.
--
-- So there is no chip. The mark is an inset rule in --stamp on all six,
-- turning --live as each is set -- the reader watches marks go green
-- rather than watching them vanish, and no cell moves. `tag.yours` is
-- therefore not created at all rather than created and left unused: an
-- orphan row would fail roi-i18n's zero-orphan check, which is what that
-- check exists for.
--
-- `res.placeholders` is superseded rather than reworded: it hardcoded
-- "of 4 cost inputs", and the set is now six and no longer only costs.
INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'assumptions.needsYou', 'en', '<strong>{0} of {1} fields below are still our numbers, not yours.</strong> They are highlighted, and the business case is illustrative until they are set.'),
  ('roi', 'assumptions.needsYouDone', 'en', '<strong>Every field that needs your own number has one.</strong> The rest are benchmarks, and the grades below say how far to trust each.'),
  ('roi', 'res.placeholders2b', 'en', 'fields still hold our numbers rather than yours.');

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('assumptions.needsYou','assumptions.needsYouDone','res.placeholders2b') = 3
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'tag.yours' = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'assumptions.needsYou' AND value LIKE '%{0}%{1}%' = 1
--
-- Both states of the line must exist. A missing "done" string would leave
-- a reader who has filled everything in staring at a warning that no
-- longer applies, which teaches them to ignore the next one.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('assumptions.needsYou','assumptions.needsYouDone') = 2

-- ---- two keys the change orphans --------------------------------------
-- `res.placeholders` hardcoded "of 4 cost inputs" and the set is now six
-- and no longer only costs. `basis.ap` stated the row without the share
-- clause. Both were correct until this file and neither has a use after
-- it.
DELETE FROM translations WHERE namespace = 'roi' AND key IN ('res.placeholders', 'basis.ap');

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('res.placeholders','basis.ap') = 0
