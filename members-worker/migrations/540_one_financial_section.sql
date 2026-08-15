-- ================================================================
-- Investment and payback move into the executive summary.
--
-- Dan: "Is there any reason that the investment and payback section 5,
-- could not be baked into the Executive summary in section 2. It seems
-- like information an executive would want to read, and combined the
-- financial analysis into one section."
--
-- NO REASON, AND THE PDF HAS BEEN DOING IT SINCE MIGRATION 531. Page 1
-- opens with a single four-figure strip -- annual benefit, one-off
-- investment, net annual, payback -- which is exactly this merge. The
-- board-facing artefact has been treating these as one story for a
-- fortnight while the interactive page split them across two sections.
-- When a page and its own export disagree about structure, the export is
-- usually right, because it was designed for the reader who matters most.
--
-- No dependency blocked it either. The cost figures rest on intSimple /
-- intComplex, computed long before the summary renders; the only reason
-- oneOff, netAnnual and paybackMonths were calculated further down was
-- that they sat beside the block that rendered them.
--
-- THE STAT SET, Dan's choice of three: banked annually, one-off, net
-- annual, payback, and the dated-deadline count. Dropped from the grid
-- are "Jurisdictions in scope" and the one-off's "N complex + N simple"
-- sublabel, both of which the card immediately below states in prose --
-- it already reads "Across 8 jurisdictions you have 4 complex and 4
-- simple regimes... roughly 11 country-system integrations".
--
-- ANNUAL RUN COST CAME OUT OF THE GRID AND HAD TO GO SOMEWHERE. It is the
-- bridge between the banked figure and net annual ($518,125 - $90,000 =
-- $428,125), and this page has just spent a week making every total
-- reconcile to something visible. Dropping a bridge would have rebuilt
-- the exact defect migration 536 fixed, one section higher up. It moves
-- into the note under the grid, in prose, where it still closes the
-- arithmetic without taking a sixth slot.
--
-- THE PLACEHOLDER WARNING IS PROMOTED, and this is the best argument for
-- the whole change rather than a side effect. "N of 4 cost inputs are
-- still placeholders -- treat the ROI as illustrative" used to sit in
-- section 5, BELOW the payback figure it qualifies. It now sits at the
-- top of the executive summary, above every number it applies to. An
-- executive reading a four-month payback built on placeholder costs is
-- told before they read it, not after.
--
-- ---- two duplications the merge exposed ----------------------------
--
-- Bringing the sections together put near-identical sentences side by
-- side, which is the value of a merge and the reason to do it by hand:
--
--   * `res.complianceOnly` ("Compliance-only, the normal shape. Counts
--     what the integration itself delivers; $X more is the option it buys
--     you for later") said what `sum.scopeOnly` already says better and
--     more precisely two lines above it. Dropped.
--   * `res.tangible` and `res.indirectWhy2` were one thought split across
--     two sections -- everything counted is tangible, the intangibles are
--     named on purpose. Merged into `res.namedWhy`, under the table they
--     both describe.
--
-- AND ONE REAL ERROR THE MERGE SURFACED. The scope note quoted
-- `l1Banked` -- $448,045, direct only -- while the headline stat above it
-- now reads $518,125 including the indirect row. Correct in its old home
-- beneath a direct-only total; wrong the moment it moved. Both figures
-- were on screen together, disagreeing, which is this project's signature
-- failure and was caught here by looking at the rendered page rather than
-- at the diff.
--
-- The page is now four numbered sections: footprint, executive summary,
-- wave plan, savings, with the evidence panel renumbering 6 to 5.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'sec.summary2',      'en', 'Executive summary &mdash; savings, investment and payback'),
  ('roi', 'res.oneOff',        'en', 'One-off investment'),
  ('roi', 'res.netAnnual',     'en', 'Net annual'),
  ('roi', 'res.netAnnualScope','en', '(compliance scope)'),
  ('roi', 'res.placeholders',  'en', 'of 4 cost inputs are still placeholders.'),
  ('roi', 'res.placeholders2', 'en', 'Please replace them with vendor budgetary estimates in the assumptions panel, and treat the ROI as illustrative until actuals can be provided.'),
  ('roi', 'sum.bridge',        'en', 'Net annual is the banked figure less'),
  ('roi', 'sum.bridge2',       'en', 'of annual run cost; section 4 shows what makes up the banked figure, row by row.'),
  ('roi', 'res.namedWhy',      'en', 'Everything priced here is tangible; the intangible benefits are named and carry no value on purpose. That group is long because almost every circulating number in this field fails verification &mdash; what survives is priced, what does not is named rather than quietly dropped.'),
  ('roi', 'sec.savings.lede4', 'en', 'Priced savings first, banked ones at the top; what this model will not put a number on is named below the total. Every priced row says what it banks on the scope you chose, and the banked total is the figure section 2 works from.');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('sec.summary2','res.oneOff','res.netAnnual','res.netAnnualScope','res.placeholders','res.placeholders2','sum.bridge','sum.bridge2','res.namedWhy','sec.savings.lede4') = 10
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'sum.bridge2' AND value LIKE '%annual run cost%' = 1
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'sec.savings.lede4' AND value LIKE '%section 2 works from%' = 1
--
-- The run-cost bridge is the assertion worth having, because it is the
-- one thing that can silently rot: if the reader is left with a saving
-- figure and a net figure and no visible way to get from one to the
-- other, the defect Dan hit in section 4 is back one section higher.
--
-- EDITED 15 Aug 2026, comment only. This named `sum.bridge` /
-- `sum.bridge2`, which carried the bridge when it lived in the summary
-- note. Migration 544 moved it onto the One-off stat, where it reads
-- better, and 545 deleted the orphaned note keys. The INVARIANT is
-- unchanged -- the bridge must be stated somewhere -- so it is repointed
-- at the keys that state it rather than retired. Precedent for editing
-- an applied migration's assertion comments is migration 525: no
-- executable change, replay is byte-identical, --refresh-checksums
-- re-records the file.
--
-- The invariant itself MOVED TO 545 rather than being repointed here,
-- and the reason is a property of the mechanism worth knowing: an
-- ASSERT ALWAYS is checked at its own migration's point in the chain as
-- well as at the end. Naming `res.running*` here would assert the
-- existence of keys that migration 544 does not create for another four
-- files, and the replay fails at 540. A standing invariant can only ever
-- reference rows that exist by the time its own file runs -- so when the
-- thing it protects moves forward, the invariant has to move with it.
--
-- Orphans are now SIXTEEN: `sec.invest`, `sec.summary`, `res.annualRun`,
-- `res.complianceOnly`, `res.complianceOnly3`, `res.tangible`,
-- `res.inScope`, `res.indirectWhy2`, `sec.savings.lede3`, `sum.scopeBoth4`
-- joining the twelve from 538 and 539 (minus the two that were already
-- counted). Still left in place, still for the sweep, and now well past
-- the point where doing it by hand in-flight would be safe. `npm test`
-- prints the live list on every run.
