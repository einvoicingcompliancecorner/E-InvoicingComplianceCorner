-- ================================================================
-- Headline facts, batch 5: Benelux, the Nordics, three of southern
-- Europe, and three of the Middle East.
--
-- Takes the corpus to 48 of 70.
-- ================================================================
--
-- DENMARK IS THE TRAP IN THIS BATCH AND IT IS WIDELY GOT WRONG.
-- The new Bookkeeping Act obliges businesses to use digital bookkeeping
-- systems CAPABLE of sending and receiving e-invoices. That is a systems
-- capability duty. It is not an obligation to issue e-invoices to other
-- businesses, and it is constantly reported as though it were. Denmark
-- is '''no_mandate''' for B2B with the capability duty in the note.
--
-- THE SAME DISTINCTION, INVERTED, IS WHY SO MANY B2G ROWS HERE ARE
-- '''active'''. Directive 2014/55/EU only obliges public bodies to RECEIVE.
-- Belgium, the Netherlands, Luxembourg, Denmark, Sweden and Norway each
-- went further and obliged SUPPLIERS to issue -- so those are genuine
-- issuing mandates, not the Directive being restated. The Netherlands is
-- the one to read carefully: central government requires issuing, other
-- public bodies need only receive, and the note says so.
--
-- NORWAY IS THE SECOND '''unknown'''. The Storting adopted the enabling law
-- on 19 June 2026 and left commencement to a later royal decree. 1
-- January 2027 is a stated target, not an enacted date. '''planned'''
-- demands a date this project would have to invent, so unknown_reason
-- carries the explanation instead -- the same treatment Spain got in 604
-- for the same reason.
--
-- GREECE: myDATA is a REPORTING duty and is not the e-invoicing mandate.
-- The genuine B2B issuing obligation began 2 March 2026 for businesses
-- over EUR 1m turnover, with the rest following on 1 October 2026. Both
-- facts are in one row and the note keeps myDATA out of it.
--
-- PORTUGAL HAS A DEADLINE FOUR MONTHS OUT that is easy to miss: PDFs
-- count as electronic invoices only until 31 December 2026, after which
-- a qualified electronic signature is required. That deferral has moved
-- several times, which is exactly why the row is dated and sourced.
--
-- ISRAEL IS A THRESHOLD REGIME, NOT A UNIVERSAL ONE. The allocation
-- number is required at NIS 5,000 and above since June 2026 -- the
-- threshold has fallen in steps from NIS 25,000 and will keep falling.
-- '''active''' is right, and the note has to carry the threshold or the
-- tile overstates the duty. Note also that Israel'''s B2G is outside the
-- regime entirely.
--
-- ---- AND THE ARABIC-LANGUAGE PORTALS WERE UNREACHABLE ---------------
--
-- eta.gov.eg and jofotara.gov.jo could not be fetched, so Egypt and
-- Jordan are cited to English secondary sources that quote the
-- underlying decrees. Those six rows are the least well anchored in this
-- batch and should be re-sourced by anyone who can reach the originals.

-- ---- the rows ------------------------------------------------------
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2023-11-01', 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108877/eInvoicing+in+Belgium',
         'active', '2026-01-01', 'https://www.ey.com/en_gl/technical/tax-alerts/belgium-s-mandatory-e-invoicing-to-apply-from-1-january-2026',
         'no_mandate', NULL, 'https://www.vatupdate.com/2026/05/19/faq-on-e-invoicing-implementation-in-belgium/',
         10, 'years', 'https://www.deloitte.com/be/en/services/tax/blogs/new-vat-circular-on-extended-limitation-and-retention-period.html',
         'not_required', 'https://edicomgroup.com/electronic-invoicing/belgium', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Belgium';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2017-01-01', 'https://www.logius.nl/onze-dienstverlening/gegevensuitwisseling/e-factureren',
         'no_mandate', NULL, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108895/eInvoicing+in+The+Netherlands',
         'no_mandate', NULL, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983602/2025+The+Netherlands+2025+eInvoicing+Country+Sheet',
         7, 'years', 'https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/administratie_bijhouden/administratie_bewaren/',
         'not_required', 'https://edicomgroup.com/electronic-invoicing/netherlands', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Netherlands';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2023-03-18', 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983588/2025+Luxembourg+2025+eInvoicing+Country+Sheet',
         'no_mandate', NULL, 'https://kpmg.com/lu/en/insights/regulatory-updates/luxembourgs-b2b-e-invoicing-mandate-takes-shape.html',
         'no_mandate', NULL, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108893/eInvoicing+in+Luxembourg',
         10, 'years', 'https://guichet.public.lu/fr/entreprises/gestion-juridique-comptabilite/comptable/enregistrement/obligations-comptables.html',
         'not_required', 'https://edicomgroup.com/electronic-invoicing/luxembourg', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Luxembourg';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2005-02-01', 'https://erhvervsstyrelsen.dk/nemhandel-faelles-digital-infrastruktur',
         'no_mandate', NULL, 'https://erhvervsstyrelsen.dk/vejledning-bogfoeringsloven',
         'no_mandate', NULL, 'https://www.vatupdate.com/2026/02/05/denmark-comprehensive-vat-country-guide-2026/',
         5, 'years', 'https://erhvervsstyrelsen.dk/vejledning-bogfoeringsloven#retention',
         'not_required', 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=853082139', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Denmark';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2019-04-01', 'https://www.upphandlingsmyndigheten.se/en/public-procurement/e-commerce/the-law-and-regulation-on-e-invoices/',
         'no_mandate', NULL, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108902/eInvoicing+in+Sweden',
         'voluntary', NULL, 'https://www.bankgirot.se/tjanster/fakturaprodukter/e-faktura-internetbank/',
         7, 'years', 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/bokforingslag-19991078_sfs-1999-1078/',
         'not_required', 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=758743138', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Sweden';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2019-04-02', 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108905/eInvoicing+in+Norway',
         'unknown', NULL, 'https://www.stortinget.no/no/Saker-og-publikasjoner/Vedtak/Beslutninger/Lovvedtak/2025-2026/vedtak-202526-052/',
         'voluntary', NULL, 'https://snl.no/eFaktura',
         5, 'years', 'https://www.skatteetaten.no/en/rettskilder/type/kunngjoringer/oppbevaringstiden-for-regnskapsmateriale-endres-fra-ti-ar-til-fem-ar/',
         'not_required', 'https://www.vatupdate.com/2026/05/16/briefing-document-podcast-e-invoicing-and-e-reporting-in-norway/', '2026-08-21',
         'The Storting adopted the enabling law on 19 June 2026 but left commencement to a later royal decree. 1 January 2027 is a stated target, not an enacted date, so there is no date the schema can honestly record.'
  FROM countries WHERE name_en = 'Norway';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2025-09-01', 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108887/eInvoicing+in+Greece',
         'active', '2026-03-02', 'https://www.taxheaven.gr/circulars/52245/a-1044-2026',
         'no_mandate', NULL, 'https://www.vatupdate.com/2026/01/15/briefing-document-podcast-greece-e-compliance-mandates-2025/',
         5, 'years', 'https://www.lawspot.gr/nomikes-plirofories/nomothesia/n-4308-2014/arthro-7-nomos-4308-2014-diafylaxi-logistikon-arheion',
         'conditional', 'https://www.taxheaven.gr/law/4308/2014/article/15/view', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Greece';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2026-01-01', 'https://saphety.com/blog/obrigatoriedade-da-faturacao-eletronica-para-pme-com-contratos-publicos',
         'no_mandate', NULL, 'https://www.fiscal-requirements.com/news/5503',
         'no_mandate', NULL, 'https://www.vatupdate.com/2026/05/29/portugals-e-invoicing-rules-certified-software-atcud-qr-codes-and-saf-t/',
         10, 'years', 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/civa_rep/Pages/iva52.aspx',
         'conditional', 'https://www.occ.pt/sites/default/files/public/2025-12/OE202631dez_v2.pdf', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Portugal';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2019-07-01', 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108879/eInvoicing+in+Croatia',
         'active', '2026-01-01', 'https://porezna-uprava.gov.hr/UserDocsImages/Fiskalizacija/Fiskalizacija_eRacun/Pitanja%20i%20odgovori%20vezani%20uz%20Zakon%20o%20fiskalizaciji.pdf',
         'no_mandate', NULL, 'https://narodne-novine.nn.hr/clanci/sluzbeni/full/2025_06_89_1233.html',
         6, 'years', 'https://www.zakon.hr/z/3960/zakon-o-fiskalizaciji',
         'conditional', 'https://narodne-novine.nn.hr/clanci/sluzbeni/full/2025_06_89_1233.html#art35', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Croatia';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2021-07-01', 'https://www.vatupdate.com/2026/02/23/briefing-document-podcast-e-invoicing-e-reporting-in-egypt/',
         'active', '2023-04-01', 'https://www.vatcalc.com/egypt/egypt-vat-e-invoice-update/',
         'active', '2022-07-01', 'https://sovos.com/regulatory-updates/global-vat/egypt-tax-authority-extends-e-receipt-obligations-for-b2c-transactions/',
         5, 'years', 'https://www.fonoa.com/resources/country-tax-guides/egypt/e-invoicing-and-digital-reporting',
         'required', 'https://rtcsuite.com/e-invoicing-egypt/', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Egypt';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'no_mandate', NULL, 'https://dddinvoices.com/learn/e-invoicing-israel',
         'active', '2024-01-01', 'https://www.gov.il/en/service/request-assignment-number-for-tax-invoice',
         'no_mandate', NULL, 'https://www.vatupdate.com/2026/01/27/briefing-document-podcast-e-invoicing-and-e-reporting-in-israel/',
         7, 'years', 'https://www.avalara.com/vatlive/en/country-guides/africa-and-middle-east/israel/e-invoicing-in-israel.html',
         'conditional', 'https://www.vatupdate.com/2026/01/27/briefing-document-podcast-e-invoicing-and-e-reporting-in-israel/', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Israel';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2025-04-01', 'https://www.vatupdate.com/2026/03/20/briefing-document-podcast-e-invoicing-e-reporting-in-jordan/',
         'active', '2025-04-01', 'https://www.vatupdate.com/2025/07/17/jordans-e-invoicing-phase-2-mandatory-compliance-begins-april-1-2025/',
         'active', '2025-04-01', 'https://www.qoyod.com/en/blog/e-invoicing/who-must-use-e-invoicing-in-jordan/',
         4, 'years', 'https://edicomgroup.com/electronic-invoicing/jordan',
         'not_required', 'https://www.cleartax.com/jo/jordan-e-invoicing', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Jordan';

-- ---- the notes, English ---------------------------------------------
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Public procurement suppliers must issue; phased 2022-2023; under EUR 3,000 exempt', 'Belgian-established VAT payers, domestic B2B; Peppol BIS default; flat-rate out', 'No B2C e-invoicing mandate; invoices to private individuals stay outside scope',
         'VAT books and invoices: 10-year retention in force since 1 January 2023 (was 7)', 'No e-signature required; authenticity and integrity ensured by business controls'
  FROM countries WHERE name_en = 'Belgium';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Central-government suppliers must issue; other public bodies need only receive', 'No domestic B2B mandate; e-invoicing voluntary with the buyer''s consent', 'No B2C mandate; voluntary adoption only, with consent of the buyer',
         '7 years for VAT records; 10 years for immovable property data', 'An e-signature is not mandatory for either B2G or B2B invoices'
  FROM countries WHERE name_en = 'Netherlands';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'All economic operators must issue; phased May 2022, Oct 2022, Mar 2023', 'Draft bill of 30 Jul 2026 proposes 2028-2029 phases; not yet adopted law', 'No B2C mandate; adoption rests on voluntary agreement between the parties',
         'Accounting records and invoices kept 10 years; 5 years in case of liquidation', 'Applying an electronic signature to e-invoices is not mandatory'
  FROM countries WHERE name_en = 'Luxembourg';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Suppliers must send e-invoices to public authorities via Nemhandel since 2005', 'Bookkeeping Act mandates e-invoice-capable systems, not issuing e-invoices B2B', 'No obligation to e-invoice consumers; paper or PDF remains acceptable',
         '5 years from end of the financial year; retail sales receipts 1 year', 'No e-signature required; integrity assured by business controls'
  FROM countries WHERE name_en = 'Denmark';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Suppliers must issue e-invoices to public bodies since 1 Apr 2019, SFS 2018:1277', 'No B2B mandate; evaluation of mandatory B2B and G2B ongoing, no date set', 'No mandate; Bankgirot E-faktura Internetbank is a real optional B2C scheme',
         '7 years after the calendar year the financial year ended (BFL 7 kap. 2 par.)', 'No electronic signature is required for e-invoices'
  FROM countries WHERE name_en = 'Sweden';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Suppliers must send EHF invoices above NOK 100,000 since Apr 2019 (FOR-2019-444)', 'Law passed 19 Jun 2026; start set later by royal decree, 1 Jan 2027 only a target', 'No mandate; eFaktura to consumers via banks and Vipps is a real optional scheme',
         '5 years for primary documentation; 10 for certain specification documents', 'No qualified electronic signature or seal is mandated on individual invoices'
  FROM countries WHERE name_en = 'Norway';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'General Government spend over EUR 2,500 needs supplier e-invoices; phased from 2024', 'Phase 1 (over EUR 1m turnover) live; others 1 Oct 2026. myDATA reporting is separate', 'Domestic B2C retail out of scope; cash-register data reporting to myDATA applies',
         'L.4308/2014 art.7: 5 years from period end, or longer if another law demands', 'Art.15 L.4308/2014: business controls, AES, EDI or provider - no signature required'
  FROM countries WHERE name_en = 'Greece';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Large firms since 2021; DL 13-A/2025 pushed micro and SMEs to Jan 2026, CIUS-PT', 'No B2B mandate; certified software, ATCUD/QR and monthly SAF-T billing instead', 'No B2C e-invoice duty; QR since 2022, ATCUD since 2023, certified software required',
         'CIVA art.52: records and supporting documents kept 10 years after the relevant year', 'PDFs count as e-invoices until 31 Dec 2026 (OE2026 art.95); QES due from Jan 2027'
  FROM countries WHERE name_en = 'Portugal';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Suppliers have issued EN 16931 e-invoices to public bodies since 1 July 2019', 'VAT-registered must issue since Jan 2026; non-VAT taxpayers issue from Jan 2027', 'No B2C e-invoice duty; separate receipt fiscalisation covers all payment methods',
         'Fiscalisation Act art.35: e-invoices kept in original form 6 yrs from year end', 'The e-invoice needs no signature; a certificate signs the fiscalisation message'
  FROM countries WHERE name_en = 'Croatia';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Sales to government and public sector cleared via the ETA portal since Jul 2021', 'All VAT-registered suppliers; paper invalid for VAT purposes since Jul 2023', 'E-receipts phased by ETA decree; waves through 2025, smaller merchants pending',
         'Keep 5 years after the return''s tax period; offshore storage allowed if accessible', 'B2B and B2G invoices signed with an HSM or USB token e-seal certificate, plus UUID'
  FROM countries WHERE name_en = 'Egypt';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'B2G sits outside the mandatory allocation-number clearance regime', 'Domestic B2B only; allocation number needed at NIS 5,000 ex-VAT since Jun 2026', 'Consumer sales explicitly excluded from clearance; no duty to issue e-invoices',
         'Invoices must be retained digitally for seven years under Israeli tax law', 'None needed to request the allocation number; the invoice sent needs integrity proof'
  FROM countries WHERE name_en = 'Israel';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Phase 2 covers B2G alongside B2B and B2C from 1 Apr 2025', 'JoFotara clearance required for validity; fines waived only until 31 May 2025', 'All sellers incl. non-GST-registered; narrow activity and turnover exemptions only',
         '4 years from end of the tax period under Regulation No. 34 of 2019', 'No taxpayer certificate; ISTD validates and returns a QR code as proof of clearance'
  FROM countries WHERE name_en = 'Jordan';

-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM country_headline_facts = 48
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE lang = 'en' = 48
--
-- EVERY ROW LANDED ON A REAL COUNTRY. These are SELECT..FROM countries
-- inserts, so a misspelled name inserts nothing and reports success --
-- the shape migration 500 shipped for three releases.
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id IS NULL = 0

