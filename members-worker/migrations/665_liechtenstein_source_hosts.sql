-- Liechtenstein: grade the hosts its citations introduce.
--
-- Liechtenstein's record is unusually good, and all four of these are
-- primary. The country's own consolidated law is published as PDF at
-- gesetze.li (Lilex) with a version parameter, the government's guidance
-- notes and the Steuerverwaltung's newsletters are PDFs on llv.li, and
-- the EEA incorporation of the e-invoicing directive is documented by the
-- EFTA Secretariat itself.
--
-- estv.admin.ch is the Swiss Federal Tax Administration, and it is here
-- because of the treaty: Swiss VAT law governs in Liechtenstein under the
-- 1994 treaty, so on the questions that treaty covers the Swiss
-- authority's own position IS the applicable law. It is graded primary on
-- that basis, and the deep dive says plainly which facts rest on it.
--
-- ONE WARNING FOR ANYONE RE-CHECKING THESE. gesetze.li's PDF endpoint
-- serves a STALE consolidated version when no `version` parameter is
-- given -- for the VAT act it returns the 2018 text, showing the old
-- 7.7% rate. Every gesetze.li citation on this country carries an
-- explicit version, and re-verification must keep it.

INSERT OR IGNORE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('gesetze.li',      'primary', 'Lilex, the consolidated law of Liechtenstein; cite with an explicit ?version= or it serves a stale text', '2026-08-27'),
  ('llv.li',          'primary', 'Liechtenstein national administration; the Steuerverwaltung and Amt fuer Justiz publish guidance here', '2026-08-27'),
  ('efta.int',        'primary', 'EFTA Secretariat; the authority on what the EEA Agreement incorporates and when', '2026-08-27'),
  ('estv.admin.ch',   'primary', 'Swiss Federal Tax Administration; governs in Liechtenstein for VAT under the 1994 treaty', '2026-08-27');

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM source_hosts WHERE host IN ('gesetze.li','llv.li','efta.int','estv.admin.ch') = 4
-- ASSERT: SELECT tier FROM source_hosts WHERE host = 'efta.int' = 'primary'
-- ASSERT: SELECT count(*) FROM source_hosts WHERE tier = 'unknown' AND ifnull(note,'') = '' = 0
