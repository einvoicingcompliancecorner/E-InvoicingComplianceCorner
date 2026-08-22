-- ================================================================
-- Headline facts, batch 7: the three thin Gulf jurisdictions.
--
-- Takes the corpus to 63 of 70. The remaining seven are blocked, not
-- forgotten -- see the end of this file.
-- ================================================================
--
-- THIS BATCH IS MOSTLY 'unknown' AND THAT IS THE FINDING.
--
-- Bahrain and Qatar were built into this tracker in August with an
-- explicit caveat that neither has any enacted mandate. That has not
-- changed, and the research confirms it against the registers rather
-- than against commentary: the NBR's complete guidance index (40 items,
-- the page itself updated 20 August 2026), its VAT laws page and its
-- full decisions register contain NO e-invoicing instrument of any kind.
-- Qatar's GTA laws, decisions and circulars registers likewise, and
-- Qatar still has no domestic VAT law at all.
--
-- SO B2B AND B2C ARE 'no_mandate' ON GOOD EVIDENCE -- a complete register
-- that does not contain the thing is worth more than an absence of
-- search hits.
--
-- BUT B2G IS 'unknown', AND THE DISTINCTION IS THE POINT. A B2G issuing
-- duty would live with the procurement authority -- Bahrain's Tender
-- Board, Qatar's state procurement rules -- not with the tax authority.
-- Those could not be reached. Silence at the NBR is not evidence about
-- the Tender Board, and recording 'no_mandate' there would have been an
-- inference dressed as a finding.
--
-- Bahrain's and Qatar's archiving and signature are 'unknown' for a
-- duller reason: the NBR's PDFs return 403 to automated retrieval and Al
-- Meezan's English translation of Qatar's Income Tax Law is marked
-- "translation in progress". Both are recoverable by a person opening
-- those documents.
--
-- ---- OMAN IS PHASED AND ONLY JUST BEGUN -----------------------------
--
-- Fawtara's official four-phase table: 100 named large VAT-registered
-- companies from August 2026, all large companies February 2027, all
-- remaining VAT-registered taxpayers August 2027, government entities
-- "February, year to be announced". B2B is 'planned' at February 2027
-- rather than 'active', because the phase running today binds about a
-- hundred named taxpayers and the obligation for businesses generally is
-- still ahead. A tile saying 'active' would be true of 100 companies and
-- misleading for everyone else.
--
-- ---- AND SEVEN COUNTRIES COULD NOT BE RESEARCHED AT ALL -------------
--
-- Cyprus, Malta, Turkey, the United Kingdom, Kenya, Nigeria and the
-- United Arab Emirates are absent from this table, and a missing row
-- means "not yet researched" by the design set out in migration 600 --
-- the guide falls back to that country's existing stats.
--
-- The cause is mechanical: this session exhausted its web-search budget
-- (200 of 200), which also disables the fetch tool, since a URL can only
-- be fetched once a search has surfaced it. Three research runs returned
-- nothing rather than guessing, which is the correct behaviour and is
-- recorded here so the gap is not mistaken for an oversight.


-- ---- the rows ------------------------------------------------------
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'unknown', NULL, 'https://www.nbr.gov.bh/decisions',
         'no_mandate', NULL, 'https://www.nbr.gov.bh/laws_regulations/vat',
         'no_mandate', NULL, 'https://www.nbr.gov.bh/guidelines_and_publications',
         NULL, 'unknown', 'https://www.nbr.gov.bh/publications/view/VAT_General_guide',
         'unknown', 'https://www.nbr.gov.bh/public_clarifications', '2026-08-21',
         'A B2G issuing duty would sit with the Tender Board rather than the NBR, and that source could not be reached. Absence of evidence at the tax authority is not evidence of absence at the procurement authority.'
  FROM countries WHERE name_en = 'Bahrain';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'unknown', NULL, 'https://www.gta.gov.qa/en/decisions',
         'no_mandate', NULL, 'https://www.gta.gov.qa/en/laws',
         'no_mandate', NULL, 'https://www.gta.gov.qa/en/',
         NULL, 'unknown', 'https://www.almeezan.qa/LawPage.aspx?id=7862&language=en',
         'unknown', 'https://www.gta.gov.qa/en/circulars', '2026-08-21',
         'Qatar has no enacted e-invoicing law and no domestic VAT. A B2G duty would sit in state procurement rules that could not be reached, so the tax authority''s silence does not settle it.'
  FROM countries WHERE name_en = 'Qatar';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'unknown', NULL, 'https://tms.taxoman.gov.om/portal/web/taxportal/fawtara-faqs',
         'planned', '2027-02-01', 'https://tms.taxoman.gov.om/portal/web/taxportal/fawtara-faqs',
         'unknown', NULL, 'https://tms.taxoman.gov.om/portal/fawtara-popup-terms-and-conditions',
         10, 'years', 'https://qanoon.om/p/2020/rd2020121/',
         'unknown', 'https://tms.taxoman.gov.om/portal/web/taxportal/fawtara-laws-regulations', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Oman';

-- ---- the notes, English ---------------------------------------------
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'NBR register lists no e-invoicing instrument; Tender Board procurement side unchecked', 'Full VAT framework listed (48/2018, 33/2021, Exec Regs); no e-invoicing instrument', 'NBR guide index of 40 items, page updated 20 Aug 2026, has no e-invoicing guidance',
         'VAT General Guide v1.15 exists but the NBR PDF returns 403 to automated fetch', 'No e-invoicing regime; no NBR public clarification on invoice e-signatures'
  FROM countries WHERE name_en = 'Bahrain';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'GTA decisions register has no e-invoicing decision; state procurement rules unchecked', 'GTA laws page lists no domestic VAT law and no e-invoicing law as at 21 Aug 2026', 'GTA lists income, capital gains, excise, withholding and GMT only; no VAT at all',
         'Income Tax Law: the Al Meezan English text is unavailable, so retention is unverified', 'No enacted e-invoicing law; the GTA circulars register shows no e-signature rule'
  FROM countries WHERE name_en = 'Qatar';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Phase 4 covers government entities; OTA gives the month (February) but no year', 'Ph1 100 large firms Aug 2026; Ph2 all large Feb 2027; Ph3 all VAT-registered Aug 2027', 'Phases are defined by VAT registration; no published B2C scope rule for Fawtara',
         'VAT Law RD 121/2020 Art. 70: 10 years after tax year end; 15 years for real estate', 'OTA FAQ calls e-invoices electronically certified; no issuer e-signature rule found'
  FROM countries WHERE name_en = 'Oman';

-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM country_headline_facts = 63
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE lang = 'en' = 63
--
-- EVERY ROW LANDED ON A REAL COUNTRY. These are SELECT..FROM countries
-- inserts, so a misspelled name inserts nothing and reports success --
-- the shape migration 500 shipped for three releases.
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id IS NULL = 0

