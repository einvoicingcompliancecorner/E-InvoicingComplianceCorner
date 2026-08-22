-- ================================================================
-- Headline facts, batch 6: central Europe, the Baltics, the Balkans
-- and the northern edge.
--
-- Takes the corpus to 60 of 70.
-- ================================================================
--
-- LATVIA IS THE ONE THAT WOULD HAVE BEEN WRONG. Its B2B mandate is
-- widely published as live from 1 January 2026. The Saeima postponed it
-- to 1 JANUARY 2028 on 5 June 2025 -- confirmed by the public
-- broadcaster and by KPMG, and this project already recorded the
-- postponement when Latvia was built in August. A briefing dated October
-- 2025 still asserting the 2026 date was found and rejected. This is the
-- second time the EU Commission's own factsheet has been the stale
-- source: it showed the superseded date when Latvia was first
-- researched, and it still does.
--
-- LITHUANIA IS THE MIRROR IMAGE. A "1 January 2028" figure circulates for
-- Lithuania too, and it traces to an EU factsheet TARGET described in the
-- July 2026 country booklet as not yet legislated. This project flagged
-- exactly that risk when Lithuania was built -- that the number was
-- possibly conflated with Latvia's real 2028 date. It was.
-- 'no_mandate', not 'planned'.
--
-- ---- FOUR COUNTRIES WHERE B2G IS NOT A MANDATE ----------------------
--
-- Czech Republic, Bulgaria, Ireland and Hungary (in 604) all implement
-- Directive 2014/55/EU by obliging public bodies to RECEIVE, and impose
-- nothing on suppliers. They are 'no_mandate', and a guide that marked
-- every EU state 'active' for B2G -- which is the obvious shortcut --
-- would have been wrong in four places.
--
-- ---- AND TWO RIGHTS-ON-REQUEST, WHICH ARE NOT MANDATES --------------
--
-- Finland (Act 241/2019, since April 2020) and Estonia (from 1 July
-- 2025) both give a BUYER the right to demand a structured e-invoice,
-- which the supplier must then provide. That is more than nothing and
-- less than a mandate. Finland is recorded 'voluntary' with the right
-- in the note; Estonia 'no_mandate' with the same. The distinction is
-- the reason the enum carries 'voluntary' at all.
--
-- ---- THE CZECH EET 2.0 BILL IS NOT LAW ------------------------------
--
-- It passed the Chamber of Deputies on 15 July 2026 for a 1 January 2027
-- start, and the SENATE RETURNED IT WITH AMENDMENTS ON 19 AUGUST 2026 --
-- two days ago. It has completed neither the Senate nor the presidential
-- stage, and it is sales reporting rather than e-invoicing in any case.
-- Recorded as context in the note and in no status field.
--
-- ---- ONE CONFLICT LEFT OPEN, DELIBERATELY ---------------------------
--
-- Iceland: OpenPeppol and ecosio say suppliers to public bodies must
-- ISSUE; the European Commission country sheet frames it as a receiving
-- duty only. Recorded as 'active' on the two sources that address the
-- supplier directly, and flagged here because a primary check of
-- regulation 44/2019 would settle it and neither researcher could reach
-- the Icelandic original.


-- ---- the rows ------------------------------------------------------
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2014-01-01', 'https://www.usp.gv.at/en/themen/steuern-finanzen/umsatzsteuer-ueberblick/weitere-informationen-zur-umsatzsteuer/vorsteuerabzug-und-rechnung/e-rechnung-an-die-oeffentliche-verwaltung.html',
         'no_mandate', NULL, 'https://sovos.com/vat/tax-rules/austria-e-invoicing/',
         'no_mandate', NULL, 'https://ec.europa.eu/digital-building-blocks/sites/x/SSxHB',
         7, 'years', 'https://www.jusline.at/gesetz/bao/paragraf/132',
         'not_required', 'https://ecosio.com/de/blog/gesetzeskonforme-abwicklung-von-elektronischen-rechnungen-in-oesterreich/', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Austria';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'no_mandate', NULL, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108881/eInvoicing+in+Czech+Republic',
         'no_mandate', NULL, 'https://sovos.com/vat/tax-rules/czech-republic-e-invoicing/',
         'no_mandate', NULL, 'https://dddinvoices.com/learn/e-invoicing-czech-republic',
         10, 'years', 'https://invoice-portal.de/e-invoicing-in-czech-republic/',
         'not_required', 'https://invoice-portal.de/e-invoicing-in-czech-republic/#signature', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Czech Republic';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'planned', '2027-01-01', 'https://www.financnasprava.sk/_img/pfsedit/Dokumenty_PFS/Zverejnovanie_dok/Aktualne/DPH/2026/2026.05.25_009_DPH_2025_IM_FaQ_eFaktura.pdf',
         'planned', '2027-01-01', 'https://www.danovky.sk/sk/schvalenie-povinnej-elektronickej-fakturacie',
         'no_mandate', NULL, 'https://www.financnasprava.sk/_img/pfsedit/Dokumenty_PFS/Zverejnovanie_dok/Aktualne/DPH/2026/2026.05.25_009_DPH_2025_IM_FaQ_eFaktura.pdf#b2c',
         10, 'years', 'https://www.financnasprava.sk/_img/pfsedit/Dokumenty_PFS/Zverejnovanie_dok/Aktualne/DPH/2026/2026.05.25_009_DPH_2025_IM_FaQ_eFaktura.pdf#arch',
         'not_required', 'https://www.financnasprava.sk/_img/pfsedit/Dokumenty_PFS/Zverejnovanie_dok/Aktualne/DPH/2026/2026.05.25_009_DPH_2025_IM_FaQ_eFaktura.pdf#sig', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Slovakia';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'no_mandate', NULL, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108878/eInvoicing+in+Bulgaria',
         'no_mandate', NULL, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983567/2025+Bulgaria+2025+eInvoicing+Country+Sheet',
         'no_mandate', NULL, 'https://www.vatupdate.com/2026/08/13/bulgaria-e-invoicing-e-reporting-country-booklet/',
         10, 'years', 'https://www.comarch.com/trade-and-services/data-management/e-invoicing/e-invoicing-in-bulgaria/',
         'conditional', 'https://support.billbox.bg/%D1%87%D0%B7%D0%B2/%D0%B7%D0%B0%D0%BA%D0%BE%D0%BD%D0%BD%D0%B8-%D0%BB%D0%B8-%D1%81%D0%B0-%D0%B5%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%BE%D0%BD%D0%BD%D0%B8%D1%82%D0%B5-%D1%84%D0%B0%D0%BA%D1%82%D1%83%D1%80%D0%B8', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Bulgaria';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2015-01-01', 'https://www.stopbirokraciji.gov.si/novice/s-1-1-2015-obvezno-posiljanje-racunov-v-javni-sektor-v-elektronski-obliki',
         'planned', '2028-01-01', 'https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2025-01-3032/zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov-zierded',
         'no_mandate', NULL, 'https://rtcsuite.com/e-invoicing-in-slovenia/',
         10, 'years', 'https://dddinvoices.com/learn/e-invoicing-slovenia',
         'not_required', 'https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2025-01-3032/zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov-zierded#sig', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Slovenia';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2022-05-01', 'https://www.paragraf.rs/propisi/zakon-o-elektronskom-fakturisanju.html',
         'active', '2023-01-01', 'https://tmconsulting.co.rs/elektronske-fakture-sef-srbija/',
         'no_mandate', NULL, 'https://fakturko.io/blog/sef-za-e-fakture-sta-je-kome-je-obavezan-i-kako-da-pocnete',
         10, 'years', 'https://tmconsulting.co.rs/elektronske-fakture-sef-srbija/#arhiviranje',
         'not_required', 'https://www.paragraf.rs/propisi/zakon-o-elektronskom-fakturisanju.html#clan8', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Serbia';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2019-07-01', 'https://www.banqup.com/resources/blog/estonia-takes-e-invoicing-to-the-next-level',
         'no_mandate', NULL, 'https://sovos.com/regulatory-updates/vat/estonia-mandatory-b2b-e-invoicing-upon-buyers-request-approved/',
         'no_mandate', NULL, 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=789217307',
         7, 'years', 'https://europe.thomsonreuters.com/compliance/regulatory-updates/estonia',
         'not_required', 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=789217307#sig', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Estonia';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2025-01-01', 'https://kpmg.com/us/en/taxnewsflash/news/2025/06/latvia-implementation-e-invoicing-system-b2b-postponed.html',
         'planned', '2028-01-01', 'https://eng.lsm.lv/article/economy/business/05.06.2025-saeima-extends-e-invoices-deadline-for-business-until-2028.a601973/',
         'no_mandate', NULL, 'https://www.comarch.com/trade-and-services/data-management/e-invoicing/e-invoicing-in-latvia/',
         NULL, 'varies', 'https://www.comarch.com/trade-and-services/data-management/e-invoicing/e-invoicing-in-latvia/#archiving',
         'not_required', 'https://rtcsuite.com/latvias-e-invoicing-mandate-key-milestones-and-implementation-timeline/', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Latvia';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2017-07-01', 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108892/eInvoicing+in+Lithuania',
         'no_mandate', NULL, 'https://www.vatupdate.com/2026/07/30/lithuania-e-invoicing-e-reporting-country-booklet/',
         'no_mandate', NULL, 'https://www.vatupdate.com/2026/07/30/lithuania-e-invoicing-e-reporting-country-booklet/#b2c',
         10, 'years', 'https://ecosio.com/en/compliance/lithuania/e-invoicing/',
         'not_required', 'https://ecosio.com/en/compliance/lithuania/e-invoicing/#signature', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Lithuania';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2023-01-01', 'https://tieke.fi/eurooppanormi2022-2/',
         'voluntary', '2020-04-01', 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983573/2025+Finland+2025+eInvoicing+Country+Sheet',
         'no_mandate', NULL, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983573/2025+Finland+2025+eInvoicing+Country+Sheet#b2c',
         6, 'years', 'https://sovos.com/vat/tax-rules/finland-e-invoicing/',
         'not_required', 'https://sovos.com/vat/tax-rules/finland-e-invoicing/#signature', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Finland';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2020-01-01', 'https://ecosio.com/en/compliance/iceland/e-invoicing/',
         'no_mandate', NULL, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983581/2025+Iceland+2025+eInvoicing+Country+Sheet',
         'no_mandate', NULL, 'https://ec.europa.eu/digital-building-blocks/sites/display/DIGITAL/eInvoicing+in+Iceland',
         7, 'years', 'https://island.is/reglugerdir/nr/0505-2013',
         'not_required', 'https://www.skatturinn.is/atvinnurekstur/bokhald-og-tekjuskraning/rafraen-bokhaldskerfi/', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Iceland';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'no_mandate', NULL, 'https://www.revenue.ie/en/vat/documents/implementation-einvoicing.pdf',
         'planned', '2028-11-01', 'https://www.revenue.ie/en/vat/vida-vat-modernisation/large-corporates-vat-modernisation.aspx',
         'no_mandate', NULL, 'https://www.revenue.ie/en/vat/documents/implementation-einvoicing.pdf#b2c',
         6, 'years', 'https://europe.thomsonreuters.com/compliance/regulatory-updates/ireland',
         'not_required', 'https://europe.thomsonreuters.com/compliance/regulatory-updates/ireland#sig', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Ireland';

-- ---- the notes, English ---------------------------------------------
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Contract partners of federal bodies must issue structured e-invoices; IKTKonG s5', 'No B2B issuing mandate; voluntary by agreement, no date announced', 'Mandate scoped to federal economic operators only; no consumer e-invoicing duty',
         'BAO s132: 7 years from end of the calendar year the document relates to', 'UStG s11(2): business controls, signature, EDI or Peppol all acceptable'
  FROM countries WHERE name_en = 'Austria';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Authorities must receive EN 16931 invoices; suppliers have no issuing duty', 'No B2B issuing mandate; e-invoicing voluntary and needs the buyer''s consent', 'No B2C duty; EET 2.0 is sales reporting, Senate returned it 19 Aug 2026',
         'Ten years from end of the tax period of the supply, per VAT Act 235/2004', 'No signature required for B2B or B2G; business controls or EDI suffice'
  FROM countries WHERE name_en = 'Czech Republic';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Supplier issuing duty starts 1 Jan 2027; sending to public bodies voluntary today', 'Act 385/2025 signed 16 Dec 2025; 2026 is a voluntary transitional test year', 'eFaktura covers only B2B and B2G; supplies to final consumers are excluded',
         'Ten years from the end of the calendar year, per the Financna sprava FAQ', 'Peppol AS4 controls ensure integrity; document-level e-signature not required'
  FROM countries WHERE name_en = 'Slovakia';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Public bodies must receive EN 16931 invoices since 2019; no supplier issuing duty', 'No B2B mandate enacted; the SAF-T phase-in from 2026 is reporting, not invoicing', 'B2C e-invoicing voluntary; paper or PDF valid with the buyer''s agreement',
         '10-year retention cited; Accountancy Act periods vary by document category', 'No QES mandated; a signature or other controls may ensure authenticity'
  FROM countries WHERE name_en = 'Bulgaria';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Suppliers must send e-invoices to budget users via UJP since 1 Jan 2015', 'ZIERDED, UL RS 85/2025 of 6 Nov 2025; certified e-path providers from Apr 2027', 'ZIERDED: consumer e-invoices only by prior explicit agreement; paper on request',
         'ZDDV-1: 10 years, 20 for immovable property; the FURS app stores 5 years', 'ZIERDED sets no e-signature duty; exchange runs via registered e-path providers'
  FROM countries WHERE name_en = 'Slovenia';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Private suppliers must issue e-invoices to the public sector via SEF from May 2022', 'SEF issuing duty for the private sector from Jan 2023; delivery notes separate', 'Sales to consumers stay outside SEF; fiscal receipts continue to apply',
         'Private sector 10 years from year-end of issue; public sector stored permanently', 'No signature on the invoice; SEF transmission ensures authenticity (Art. 8)'
  FROM countries WHERE name_en = 'Serbia';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Suppliers must issue e-invoices to public sector buyers; still in force after 2025', 'No issuing duty; registered buyers may demand an e-invoice since 1 Jul 2025', 'No B2C e-invoicing obligation in Estonian law',
         '7 yrs for accounting source documents; 10 for immovable-property records', 'No e-signature required; authenticity assured via business controls'
  FROM countries WHERE name_en = 'Estonia';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Suppliers to budget institutions must issue structured e-invoices since Jan 2025', 'Saeima postponed the Jan 2026 start to Jan 2028 on 5 Jun 2025; voluntary meanwhile', 'No mandatory B2C e-invoicing planned',
         '5 yrs for goods and services invoices; 10 yrs for real-estate invoices', 'A digital signature is not required for B2G or B2B e-invoices'
  FROM countries WHERE name_en = 'Latvia';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Public-procurement suppliers must e-invoice; routed via SABIS since Jul 2024', 'No enacted mandate; the circulating 2028 date is a target, not law', 'No B2C mandate; PDF or paper allowed with the buyer''s consent',
         '10 years for invoices; storage abroad allowed within the EU', 'An e-signature is not required; integrity may be ensured by other controls'
  FROM countries WHERE name_en = 'Lithuania';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'All invoices to the state must be EN 16931 e-invoices (moved from Apr 2021)', 'Act 241/2019 buyer right: firms over EUR 10k turnover may demand an EN invoice', 'No B2C e-invoicing mandate applies in Finland',
         'Invoices retained six years after the end of the accounting year', 'Not required; integrity via business controls, EDI or an e-signature'
  FROM countries WHERE name_en = 'Finland';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Suppliers to public bodies must send structured e-invoices; reg. 44/2019, TS-236', 'No B2B mandate and none proposed; Peppol B2B exchange is voluntary', 'No B2C e-invoicing mandate in Iceland',
         'Reg. 505/2013 art. 6: e-books and vouchers kept 7 years from fiscal year end', 'Reg. 505/2013 allows an audit trail or accounting controls instead of a signature'
  FROM countries WHERE name_en = 'Iceland';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Public bodies receive via Peppol since 2019; no supplier issuing duty', 'Phase 1: large corporates issue and report; all must receive. Announced, not enacted', 'No B2C obligation; the phases cover domestic and EU cross-border B2B only',
         'Six years generally; capital goods scheme records up to 20 plus 6 years', 'An e-signature is not required; authenticity assured via business controls'
  FROM countries WHERE name_en = 'Ireland';

-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM country_headline_facts = 60
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE lang = 'en' = 60
--
-- EVERY ROW LANDED ON A REAL COUNTRY. These are SELECT..FROM countries
-- inserts, so a misspelled name inserts nothing and reports success --
-- the shape migration 500 shipped for three releases.
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id IS NULL = 0

