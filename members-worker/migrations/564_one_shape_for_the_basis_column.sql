-- ================================================================
-- The basis column gets one shape instead of nine.
--
-- Dan: "could the basis column in the savings table be a little more
-- concise and consistent across all rows. For example, to include a
-- 'Calculation: ' sentence, and on the next line a 'Justification: '
-- sentence with citation and source. Also to be consistent with how
-- evidence is referenced earlier in the page, using [A], [B], [C] and
-- [D] evidence grades."
--
-- ---- WHAT THE COLUMN HAD BECOME -------------------------------------
--
-- Nine rows, nine shapes, because each was written when its row was
-- added and none was ever read beside the others:
--
--   AP        two full sentences run together with no separator, the
--             second starting "Compliance alone is credited with..."
--   AR        five words and a multiplication
--   tax       arithmetic and mechanism interleaved in one sentence
--   rework    a chain of five multiplicands with four hover markers
--   cycle     a comparison, an attribution and a disclaimer
--   paper     a price comparison and a suggestion
--   vat       a refusal
--   penalty   a count and an instruction
--   fraud     four words
--
-- Not one of them was wrong. THE PROBLEM WAS THE SET, which is the
-- failure mode this project has hit before -- migration 556's caveat
-- sprawl and 535's section drift were both "every diff looked like an
-- improvement". A column read down is read as a column, and this one had
-- never been designed as one.
--
-- Now every row is: Calculation, then Justification. Rows that are named
-- rather than priced say "Named, not priced." in the calculation slot
-- rather than dropping the label, because a missing line reads as an
-- omission and a stated one reads as a decision.
--
-- ---- THE GRADES WERE ALREADY THERE, AND INVISIBLE --------------------
--
-- Every `ev()` marker's tooltip has opened with "Evidence grade B" since
-- the page was built. The letter was one hover away, on eleven markers,
-- in a table whose whole argument is that its numbers are graded --
-- while the assumptions panel wears the same letters in the open.
--
-- So this is not new information, it is information that was being
-- withheld by its own presentation. `ev()` now renders the chip beside
-- the marker, using the SAME `.tag tA` classes as the panel, so the two
-- surfaces cannot drift into different vocabularies for one fact.
--
-- The chip sits OUTSIDE the `.ev` span deliberately: inside, it inherits
-- the dotted underline that marks a hover target, which would advertise
-- a tooltip the chip does not have.
--
-- ---- WHAT THIS EXPOSED ----------------------------------------------
--
-- Writing the justifications side by side made two inconsistencies
-- obvious that nine separate sentences had hidden. The AP row cited its
-- reduction as "reduction" and the AR row as "reduction" too -- but the
-- AP row applies it to a decomposed manual cost and the AR row to a
-- blended one, which is migration 557's whole point and was invisible
-- in the old wording. Both now say what they are applied to. And the
-- rework row cited Ardent's exception rate as "not Ardent's 18.4%",
-- phrasing a bound as a denial; it now names the bound.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'basis.ap.calc', 'en', '{0} invoices &times; {1} manual cost &times; {2}% reduction &times; {3}% not yet structured{4}'),
  ('roi', 'basis.ap.calc2', 'en', ' &times; {0}% compliance share'),
  ('roi', 'basis.ap.just', 'en', 'Manual cost decomposed from the market average {0}. Reduction range {1}. Structured share is yours {2}.{3}'),
  ('roi', 'basis.ap.just2', 'en', ' Compliance is credited with capture and validation only &mdash; 9 of the 21 minutes of AP handling {0} &mdash; because review and approval are business decisions that no invoice format removes.'),
  ('roi', 'basis.ar.calc', 'en', '{0} invoices &times; {1} issuing cost &times; {2}% reduction'),
  ('roi', 'basis.ar.just', 'en', 'Issuing cost from the ATO channel figures on its own 60/40 split {0}. Reduction range {1}.'),
  ('roi', 'basis.cycle.just', 'en', 'Top-performing AP spends <strong>12.8%</strong> of staff time on supplier inquiries against <strong>24.0%</strong> {0} &mdash; an association with high-performing AP, not a measured effect of e-invoicing.'),
  ('roi', 'basis.fraud.just', 'en', 'Strategic benefits with no published benchmark {0}.'),
  ('roi', 'basis.lab.calc', 'en', 'Calculation:'),
  ('roi', 'basis.lab.just', 'en', 'Justification:'),
  ('roi', 'basis.notPriced', 'en', 'Named, not priced.'),
  ('roi', 'basis.paper.just', 'en', 'Paper AUD 30.87 against AUD 9.18 for an e-invoice {0}; your own print, postage and storage spend is the better input.'),
  ('roi', 'basis.penalty.just', 'en', '{0} of your jurisdictions publish a quantified penalty schedule {1}. Size it per country; there is no credible aggregate.'),
  ('roi', 'basis.rework.calc', 'en', '{0} {1} at {2}% &times; {3} min &times; {4}/h &times; {5}% eliminated'),
  ('roi', 'basis.rework.just', 'en', 'Error rate {0}; resolution time {1}; data-entry rate {2}; the share eliminated is ours {3}, held under Ardent&rsquo;s exception gap {4}.'),
  ('roi', 'basis.tax.calc', 'en', '{0} AP invoices imply {1} AP FTE; {2} put {3}% of that in scope{4} &mdash; {5} FTE &times; {6}'),
  ('roi', 'basis.tax.just', 'en', 'Mechanism evidenced {0}; invoices per FTE {1}; the share in scope is ours and capped {2}. Saved on either scope &mdash; reporting effort falls with the compliance build, not with a workflow change.'),
  ('roi', 'basis.vat.just', 'en', 'Often quoted and <strong>not defensible</strong> {0} &mdash; excluded from this model entirely.'),
  ('roi', 'ev.ardentAvg', 'en', 'Ardent Partners'),
  ('roi', 'ev.atoDeloitte', 'en', 'ATO / Deloitte'),
  ('roi', 'ev.atoMins2', 'en', 'ATO exception times'),
  ('roi', 'ev.excRate2', 'en', '18.4% market exception rate'),
  ('roi', 'ev.hmrcAto', 'en', 'HMRC, ATO-corroborated'),
  ('roi', 'ev.hmrcRate', 'en', 'HMRC consultation'),
  ('roi', 'ev.oecdDctr', 'en', 'OECD DCTR, 2026'),
  ('roi', 'ev.yourShare', 'en', 'your figure');

UPDATE translations SET value = 'Calculation:' WHERE namespace = 'roi' AND lang = 'en' AND key = 'basis.lab.calc';
UPDATE translations SET value = 'Justification:' WHERE namespace = 'roi' AND lang = 'en' AND key = 'basis.lab.just';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'basis.%.calc' AND key NOT LIKE 'basis.lab.%' = 4
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'basis.%.just' AND key NOT LIKE 'basis.lab.%' = 9
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('basis.lab.calc','basis.lab.just','basis.notPriced') = 3
--
-- NINE JUSTIFICATIONS AND FOUR CALCULATIONS, and the asymmetry is the
-- point: four rows are priced and nine are named. Every row must carry a
-- justification, because a row with no stated reason is the thing this
-- table exists to not be. Only the priced ones can carry arithmetic.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'basis.%.just' AND key NOT LIKE 'basis.lab.%' = 9
--
-- The NOT LIKE is not decoration. `basis.lab.calc` and `basis.lab.just`
-- are the column's two labels, and both match `basis.%.calc` /
-- `basis.%.just` -- the first draft counted 5 and 10 and failed on its
-- own new rows. Same family as migration 556, where `chart.procure_%`
-- matched `chart.procureBar` because underscore is a single-character
-- wildcard. SQL LIKE patterns over a dotted key namespace are a trap
-- worth writing down twice.

-- ---- the shapes this replaces ---------------------------------------
DELETE FROM translations WHERE namespace = 'roi' AND key IN
  ('basis.apShare','basis.apScope','basis.ar','basis.rework2','basis.tax',
   'basis.fraud','basis.paper','basis.penalty','basis.vat',
   'row.cycle.basis','row.cycle.basis2','row.cycle.basis3','row.cycle.basis4',
   'row.tax.banks','ev.baseline','ev.reduction','ev.atoMins','ev.excRate','ev.atRate');

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('basis.apShare','basis.ar','basis.tax','row.tax.banks') = 0
