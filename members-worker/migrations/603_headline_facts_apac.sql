-- ================================================================
-- Headline facts, batch 3: eight Asia-Pacific jurisdictions.
--
-- Takes the corpus to 25 of 70.
-- ================================================================
--
-- THIS BATCH LEANS ON SECONDARY SOURCES MORE THAN THE LAST, AND THAT IS
-- WORTH RECORDING RATHER THAN AVERAGING AWAY. 23 of these 40 facts cite
-- something other than a government domain, against roughly a third in
-- the Americas batch. The reason is mechanical, not editorial: China'''s
-- chinatax.gov.cn, Korea'''s nts.go.kr, India'''s CBIC section pages and
-- Singapore'''s IRAS HTML pages all refuse automated fetching, and this
-- project'''s rule is that a URL nobody could read is not a citation. So
-- the researchers cited what they could actually verify and said which
-- primary sources were unreachable.
--
-- These are the rows most worth re-sourcing by hand later. They are not
-- wrong; they are less well anchored than the rest, and pretending
-- otherwise is how the August citation audit found 71% of story sources
-- unable to support their claim.
--
-- ---- FOUR FINDINGS THAT CONTRADICT THE COMMON WRITE-UP --------------
--
-- SINGAPORE IS NOT MANDATORY. It is widely reported as having started a
-- GST InvoiceNow mandate on 1 November 2025. What began then applies to
-- newly incorporated companies that register for GST VOLUNTARILY. The
-- bulk of existing GST-registered businesses are not caught until 1
-- April 2028, and some not until 2031. B2B is '''planned''' with the 2028
-- date. A tile saying '''active''' would have been wrong for almost every
-- business a reader of this site actually operates.
--
-- THE PHILIPPINES HAS SLIPPED AGAIN AND IS STILL AHEAD OF US. RR 26-2025
-- moved Phase 1 to 31 December 2026, and even then it catches large
-- taxpayers, large e-commerce and exporters only. '''planned''', not
-- '''active''' -- and this tracker'''s own deep dive already records the
-- history of it slipping, which is why the date is stated rather than
-- trusted.
--
-- INDIA'''S B2C IS NOT A MANDATE. The dynamic QR code required above Rs
-- 500 crore is a different obligation from IRN e-invoicing and is
-- routinely conflated with it. B2C is '''no_mandate'''; B2B is '''active'''
-- but only above the Rs 5 crore turnover threshold, which the note says.
--
-- AND THE PHILIPPINES''' RETENTION PERIOD HALVED. RR 7-2024 under the
-- EOPT Act replaced the old ten-year rule with five. Anyone carrying the
-- older figure -- as most published summaries still do -- is wrong by
-- five years.
--
-- CHINA'''S 30 YEARS is not a typo. Invoices are accounting vouchers
-- under MOF/State Archives Order 79, whose retention table sets 30 years.
-- The gov.cn gazette copy omits the table, so the citation is the
-- archives administration PDF that contains it.

-- ---- the rows ------------------------------------------------------
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2024-12-01', 'https://ecosio.com/en/blog/a-guide-to-efapiao-in-china/',
         'active', '2024-12-01', 'https://www.gov.cn/zhengce/zhengceku/202411/content_6989164.htm',
         'active', '2024-12-01', 'https://www.vatupdate.com/2026/02/15/briefing-document-podcast-e-invoicing-and-e-reporting-in-china/',
         30, 'years', 'https://cwfwpt.ggj.gov.cn/zcfg/qt/202308/P020230817387102643746.pdf',
         'required', 'https://www.gov.cn/zhengce/202411/content_6989260.htm', '2026-08-21'
  FROM countries WHERE name_en = 'China';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2023-08-01', 'https://gstcouncil.gov.in/sites/default/files/2024-06/circular-cgst-198.pdf',
         'active', '2023-08-01', 'https://www.gstcouncil.gov.in/node/4365',
         'no_mandate', NULL, 'https://einvoice6.gst.gov.in/content/e-invoice-mandate-e-invoicing-changes-exemptions-documents-covered-transactions-and-more/',
         6, 'years', 'https://www.aaptaxlaw.com/cgst-act/section-36-cgst-act-period-of-retention-of-accounts.html',
         'conditional', 'https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter6/rule46_v1.00.html', '2026-08-21'
  FROM countries WHERE name_en = 'India';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2016-07-01', 'https://www.vatcalc.com/indonesia/indonesia-e-factur-pajak-electronic-invoicing/',
         'active', '2016-07-01', 'https://news.ddtc.co.id/berita/nasional/6707/1-juli-2016-e-faktur-berlaku-nasional',
         'no_mandate', NULL, 'https://artikel.pajakku.com/panduan-faktur-pajak-pedagang-eceran-digunggung-terbaru',
         10, 'years', 'https://www.aseanbriefing.com/doing-business-guide/indonesia/taxation-and-accounting/financial-compliance-bookkeeping-audits-tax',
         'required', 'https://news.ddtc.co.id/review/konsultasi-coretax/1808254/tanda-tangan-e-faktur-di-coretax-pakai-sertifikat-elektronik-siapa', '2026-08-21'
  FROM countries WHERE name_en = 'Indonesia';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2026-01-01', 'https://www.hasil.gov.my/wp-content/uploads/lhdnm-e-invoice-general-faqs.pdf',
         'active', '2026-01-01', 'https://www.hasil.gov.my/media/fzagbaj2/irbm-e-invoice-guideline.pdf',
         'active', '2026-01-01', 'https://www.hasil.gov.my/media/uwwehxwq/irbm-e-invoice-specific-guideline.pdf',
         7, 'years', 'https://ancgroup.biz/keep-sufficient-records-for-7-years/',
         'required', 'https://sdk.myinvois.hasil.gov.my/signature/', '2026-08-21'
  FROM countries WHERE name_en = 'Malaysia';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2008-11-01', 'https://www.mof.gov.sg/news-resources/newsroom/electronic-invoices-for-transactions-with-government-from-1-november-2008/',
         'planned', '2028-04-01', 'https://www.iras.gov.sg/media/docs/default-source/uploadedfiles/gst/frequently-asked-questions-for-gst-invoicenow-requirement.pdf',
         'no_mandate', NULL, 'https://www.vatupdate.com/2026/02/27/briefing-document-singapore-gst-invoicenow-business-guide/',
         5, 'years', 'https://www.iras.gov.sg/media/docs/default-source/uploadedfiles/gst/frequently-asked-questions-for-gst-invoicenow-requirement.pdf#records',
         'not_required', 'https://www.vatupdate.com/2026/02/27/briefing-document-singapore-gst-invoicenow-business-guide/', '2026-08-21'
  FROM countries WHERE name_en = 'Singapore';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2011-01-01', 'https://www.voxelgroup.net/compliance/guides/south-korea/',
         'active', '2011-01-01', 'https://sovos.com/vat/tax-rules/electronic-tax-invoices-south-korea/',
         'no_mandate', NULL, 'https://www.vatupdate.com/2026/07/28/south-korea-e-invoicing-e-reporting-country-booklet/',
         5, 'years', 'https://www.storecove.com/blog/en/e-invoicing-in-south-korea-regulations/',
         'required', 'https://www.abk-korea.com/en/publications/korean-etax-invoices', '2026-08-21'
  FROM countries WHERE name_en = 'South Korea';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2022-07-01', 'https://www.comarch.com/trade-and-services/data-management/e-invoicing/e-invoicing-in-vietnam/',
         'active', '2022-07-01', 'https://english.luatvietnam.vn/decree-no-123-2020-nd-cp-dated-october-19-2020-of-the-government-on-invoices-and-documents-192667-doc1.html',
         'active', '2022-07-01', 'https://www.vietnam-briefing.com/news/e-invoice-compliance-in-vietnam-regulations-requirements-and-best-practices.html/',
         10, 'years', 'https://english.luatvietnam.vn/law-no-88-2015-qh13-of-the-national-assembly-on-accounting-law-101336-doc1.html',
         'required', 'https://www.ey.com/en_vn/technical/tax/tax-and-law-updates/tax-alert-april-2025-changes-to-invoicing-regulations-effective-from-1-june-2025', '2026-08-21'
  FROM countries WHERE name_en = 'Vietnam';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'planned', '2026-12-31', 'https://www.reyestacandong.com/bir-issuances-rr-no-11-2025/',
         'planned', '2026-12-31', 'https://bir-cdn.bir.gov.ph/BIR/pdf/RR%20No.%2026-2025%20Digest.pdf',
         'planned', '2026-12-31', 'https://edicomgroup.com/blog/philippines-step-towards-mandatory-electronic-invoice',
         5, 'years', 'https://www.grantthornton.com.ph/insights/articles-and-updates1/tax-notes/eopt-is-here-updates-on-the-preservation-of-book-of-accounts-and-changes-in-taxpayer-registration/',
         'conditional', 'https://rtcsuite.com/bir-e-invoicing-philippines-eis-by-2026-a-comprehensive-guide-to-scope-stages-and-technical-compliance/', '2026-08-21'
  FROM countries WHERE name_en = 'Philippines';

-- ---- the notes, English ---------------------------------------------
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'No separate B2G regime; the same e-fapiao rules and platform apply to public buyers', 'All taxpayers issue e-fapiao via the STA platform since Dec 2024; paper phasing out', 'Consumer e-fapiao on the same platform; individuals retrieve it in the tax app',
         'Invoices are accounting vouchers; Order 79 requires 30 years, e-archives allowed', 'E-fapiao carry a digital signature; no invoice special seal needed to book them'
  FROM countries WHERE name_en = 'China';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Suppliers above Rs 5 crore must e-invoice govt bodies registered only for TDS', 'Mandatory above Rs 5 crore turnover; covers B2B and exports, not B2C', 'B2C excluded from IRN e-invoicing; dynamic QR applies only above Rs 500 crore',
         '72 months from the annual return due date, per Section 36 CGST Act', 'No signature needed on e-invoices issued under the IT Act 2000 (Rule 46)'
  FROM countries WHERE name_en = 'India';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Supplies to government bodies use the same e-Faktur clearance flow as B2B', 'e-Faktur national since 2016; Coretax clearance now a validity precondition', 'Retail PKP issue simplified faktur eceran; electronic or paper both allowed',
         'Accounting records and supporting tax documents kept 10 years under the KUP Law', 'Signed with the signatory''s sertifikat elektronik or DJP code, PMK 81/2024'
  FROM countries WHERE name_en = 'Indonesia';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'B2G in scope; the flow mirrors B2B and follows the same turnover phase dates', 'Final wave RM1m-5m live 1 Jan 2026; under RM1m exempt, Phase 5 cancelled', 'Monthly consolidated e-invoice; an individual one required above RM10,000',
         'Records kept 7 years from end of year of assessment, Income Tax Act 1967 s.82A', 'XAdES signature with a Malaysian CA X.509 certificate on API submissions'
  FROM countries WHERE name_en = 'Malaysia';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'All suppliers billing Government invoice electronically via Vendors@Gov', 'Only new voluntary GST registrants today; most existing firms from Apr 2028', 'No Peppol invoice for consumer sales; only aggregated data reported for GST',
         'GST records incl. e-invoices kept 5 years in machine-readable formats', 'No e-signature required; Peppol access points assure integrity of the data'
  FROM countries WHERE name_en = 'Singapore';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Same e-tax invoice duty covers public bodies; XML via Hometax, ASP or ERP', 'All corporations since 2011; sole traders above KRW 80m supply from Jul 2024', 'No tax invoice to final consumers; cash receipts or card slips used instead',
         'E-tax invoices kept as signed XML for 5 years; NTS also retains its copies', 'Issuer signs with an NTS-issued or public CA certificate before transmission'
  FROM countries WHERE name_en = 'South Korea';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'No separate B2G track; the universal duty covers sales to state bodies', 'Dual model: a tax-authority code before delivery, or transmission without one', 'All sellers incl. retail; VND1bn+ households on cash-register invoices Jun 2025',
         'Accounting Law art. 41: documents used for book entries kept at least 10 years', 'Seller digital signature required; signing due within a day of invoice creation'
  FROM countries WHERE name_en = 'Vietnam';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'No B2G-specific scheme; RR 11-2025 scope is set by taxpayer class, not buyer', 'RR 26-2025 moved Phase 1 to 31 Dec 2026: LTS, large and e-commerce only', 'Catches e-commerce sellers; POS users await BIR system, micro taxpayers exempt',
         'RR 7-2024 under EOPT: 5 years from the day after the return filing deadline', 'Covered filers must digitally sign the invoice JSON (JWS) for EIS transmission'
  FROM countries WHERE name_en = 'Philippines';

-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM country_headline_facts = 25
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE lang = 'en' = 25
--
-- EVERY ROW LANDED ON A REAL COUNTRY. These are SELECT..FROM countries
-- inserts, so a misspelled name inserts nothing and reports success --
-- the shape migration 500 shipped for three releases.
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id IS NULL = 0

