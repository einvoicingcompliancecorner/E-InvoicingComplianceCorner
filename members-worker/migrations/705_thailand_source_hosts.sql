-- Thailand: grade the hosts its citations introduce.
--
-- The Revenue Department publishes its instruments as PDFs on its own
-- domain, which makes this country unusually well sourced for one with
-- no mandate: the claim "both routes are voluntary" rests on the words
-- of the announcements themselves rather than on anyone's summary.
--
-- etax.teda.th is the ETDA time-stamp service that the by-email route
-- runs through. It is graded primary because it is the operator of the
-- mechanism, not a commentator on it -- the address invoices are copied
-- to lives there.
--
-- ratchakitcha.soc.go.th is graded primary and IS NOT CITED. The Royal
-- Gazette refused automated access, so no Gazette text was read
-- directly; every promulgation date on this country comes from a
-- Revenue-Department-hosted PDF or index instead. Graded here so the
-- grade is already right the day someone can read it -- the same reason
-- Hong Kong's elegislation.gov.hk entry exists. Four countries this
-- month whose official law source could not be opened.
--
-- prd.go.th is the Government PR Department. It reported the same June
-- 2026 Cabinet decision as the Revenue Department and named a DIFFERENT
-- assessment body -- DEPA where the Revenue Department names ETDA. We
-- follow the Revenue Department, and the discrepancy is on the page.

INSERT OR IGNORE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('rd.go.th',       'primary',   'Thai Revenue Department; publishes its own announcements, decrees and press releases as PDFs', '2026-08-27'),
  ('etda.or.th',     'primary',   'Electronic Transactions Development Agency; owns the XML standard the full system uses', '2026-08-27'),
  ('etax.rd.go.th',  'primary',   'The Revenue Department''s e-tax portal. A JavaScript application at its root, so only its static PDF booklets were readable', '2026-08-27'),
  ('etax.teda.th',   'primary',   'ETDA''s time-stamp service — the operator of the e-Tax Invoice by Email route, not a commentator on it', '2026-08-27'),
  ('prd.go.th',      'primary',   'Government PR Department; its account of the June 2026 Cabinet decision differs from the Revenue Department''s on one detail', '2026-08-27'),
  ('ratchakitcha.soc.go.th', 'primary', 'Royal Gazette — refused automated access, so no Gazette text could be read directly', '2026-08-27'),
  ('hlbthai.com',    'secondary', 'HLB Thailand; corroborates the VAT rate extension', '2026-08-27'),
  ('mahanakornpartners.com', 'secondary', 'Thai law firm; the deduction mechanics rest on this and dlo.co.th rather than on the decree text', '2026-08-27'),
  ('dlo.co.th',      'secondary', 'Thai law firm; the Royal Decree 718/766 lineage rests on this', '2026-08-27'),
  ('bizwings.co',    'secondary', 'Thai advisory blog; sole source for the 2025 withholding-tax e-filing claim, which we therefore do not publish as established', '2026-08-27');

-- ---- what this migration claims it did ----
-- ASSERT: SELECT tier FROM source_hosts WHERE host = 'rd.go.th' = 'primary'
-- ASSERT: SELECT tier FROM source_hosts WHERE host = 'etda.or.th' = 'primary'
-- ASSERT: SELECT count(*) FROM source_hosts WHERE host IN ('rd.go.th','etax.rd.go.th','etda.or.th','etax.teda.th','prd.go.th','ratchakitcha.soc.go.th') = 6
-- The vendor page this country contradicts must stay secondary, or the
-- deep dive would cite an invented mandate at the grade of the
-- instruments that disprove it.
-- ASSERT: SELECT tier FROM source_hosts WHERE host = 'dddinvoices.com' = 'secondary'
-- ASSERT ALWAYS: SELECT count(*) FROM source_hosts WHERE tier = 'unknown' AND ifnull(note,'') = '' = 0
