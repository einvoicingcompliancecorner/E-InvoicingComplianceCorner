-- ================================================================
-- Headline facts, batch 4: the CIS trio, Taiwan and Pakistan, and the
-- first six of Europe.
--
-- Takes the corpus to 36 of 70.
-- ================================================================
--
-- ---- ONE FINDING CONTRADICTS THIS SITE'''S OWN DEEP DIVE -------------
--
-- TAIWAN IS RECORDED HERE AS VOLUNTARY, AND THE TRACKER SAYS MANDATORY.
--
-- The Taiwan deep dive, built 4 August 2026, states that eGUI became a
-- universal domestic mandate for every business-tax-registered entity on
-- 1 January 2021. The research for this batch reaches the opposite
-- conclusion and cites the reason: the MOF'''s own notice retiring the
-- computer-generated GUI says a business whose nature or scale makes
-- e-invoicing unsuitable MAY INSTEAD use another of the GUI types listed
-- in Article 7 of the Uniform Invoice Regulations. Electronic invoice is
-- one of five permitted types, not the only one. What 2021 ended was the
-- COMPUTER-GENERATED GUI, not paper GUIs generally.
--
-- On that reading the only genuine issuing mandate is Article 7-1:
-- non-resident suppliers of electronic services must issue cloud
-- invoices. Everything else is opt-in, and the 7-day/2-day transmission
-- deadlines bite only on those who have opted in.
--
-- I HAVE RECORDED THE RESEARCHED ANSWER AND FLAGGED THE CONFLICT rather
-- than quietly matching the tile to the existing page. Two possibilities
-- and they need different fixes: either the deep dive overstates the
-- mandate and should be corrected, or this reading of Article 7 is wrong
-- and these three rows should be. It is Dan'''s call which, and it wants a
-- human who can read the Chinese source. Until then the guide and the
-- deep dive will disagree about Taiwan, visibly, which is better than
-- agreeing by assumption.
--
-- Two smaller corrections from the same research: the 1 Jan 2026 format
-- cutover is to MIG 4.1, not 4.0 (4.0 landed in 2024), and the
-- transmission deadlines run from 1 Jan 2025 rather than 2024.
--
-- ---- SPAIN IS THE FIRST '''unknown''' AND IT IS THE RIGHT ANSWER -------
--
-- Real Decreto 238/2026 came into force on 20 April 2026 and develops the
-- Crea y Crece B2B system -- but it defers application to twelve or
-- twenty-four months after a ministerial order which was still
-- unpublished on 21 August 2026. So the obligation is enacted and has no
-- legally fixed start date. '''planned''' would require a date the schema
-- refuses to invent; '''no_mandate''' would be false. unknown_reason
-- carries the explanation.
--
-- Note also that VeriFactu and Crea y Crece are two different reforms
-- that are constantly conflated: VeriFactu governs invoicing SOFTWARE
-- (Jan and Jul 2027) and is not an e-invoicing mandate at all.
--
-- ---- HUNGARY: DATA REPORTING IS NOT AN INVOICING MANDATE ------------
--
-- RTIR reports invoice DATA to NAV in real time and the invoice itself
-- may stay paper. This tracker already classifies RTIR milestones as
-- mandate_scope '''none''' for that reason, and the same distinction is
-- applied here: Hungary'''s only genuine issuing mandate is sectoral
-- (energy and gas from Jul 2025, water from Jan 2026). B2G is
-- '''no_mandate''' -- public bodies must RECEIVE, suppliers need not send.
--
-- ---- AND FRANCE IS TEN DAYS AWAY ------------------------------------
--
-- B2B issuing for large and mid-sized businesses starts 1 September
-- 2026. At the moment this row was written it is '''planned'''; it becomes
-- '''active''' in ten days, which is exactly the kind of fact a dated
-- last_verified column exists to expose.

-- ---- the rows ------------------------------------------------------
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2017-04-01', 'https://www.vatupdate.com/2025/05/17/e-invoicing-in-azerbaijan/',
         'active', '2017-04-01', 'https://www.taxes.gov.az/en/page/elektron-qaime-faktura',
         'no_mandate', NULL, 'https://www.vatupdate.com/2026/01/14/comprehensive-vat-guide-azerbaijan-2026/',
         5, 'years', 'https://www.vatupdate.com/2026/07/26/azerbaijan-e-invoicing-e-reporting-country-booklet/',
         'required', 'https://www.grantthornton.global/en/insights/indirect-tax-guide/indirect-tax---Azerbaijan/', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Azerbaijan';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2019-01-01', 'https://www.vatupdate.com/2026/05/23/briefing-document-podcast-kazakhstan-advances-e-invoicing-and-e-reporting-mandate-key-details-for-2026-implementation/',
         'active', '2019-01-01', 'https://vko.kgd.gov.kz/en/node/64420',
         'no_mandate', NULL, 'https://www.vatupdate.com/2025/08/11/new-tax-code-2026-changes-in-electronic-invoicing-and-obligations-for-vat-payers/',
         NULL, 'varies', 'https://taxsummaries.pwc.com/kazakhstan/corporate/tax-administration',
         'required', 'https://www.vatcalc.com/kazakhstan/kazakhstan-e-invoicing-is-esf/', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Kazakhstan';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2020-01-01', 'https://europe.thomsonreuters.com/compliance/regulatory-updates/uzbekistan',
         'active', '2020-01-01', 'https://www.vatupdate.com/2026/07/09/uzbekistan-e-invoicing-e-reporting-country-booklet/',
         'no_mandate', NULL, 'https://buxgalter.uz/oz/publish/doc/text180080_elektron_hisobvaraq-faktura_qachon_qanday_shaklda_va_qaysi_muddatlarda_taqdim_qilinadi_kim_imzolaydi111',
         5, 'years', 'https://www.ibac.uz/en/media-center/legal-framework/52.htm',
         'required', 'https://edicomgroup.com/electronic-invoicing/uzbekistan', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Uzbekistan';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'voluntary', NULL, 'https://tpctax.gov.taipei/News.aspx?n=401009EFEC2295C3&sms=36824339176527E4',
         'voluntary', NULL, 'https://www.mof.gov.tw/singlehtml/384fb3077bb349ea973e7fc6f13b6974?cntId=d0ae777759e34552842bc82e0064bde0',
         'voluntary', NULL, 'https://law-out.mof.gov.tw/LawContent.aspx?id=FL006084',
         5, 'years', 'https://www.etax.nat.gov.tw/etwmain/tax-info/understanding/tax-q-and-a/national/profit-seeking-enterprise-income-tax/imputation-credit-account/GA8Rb37',
         'required', 'https://law-out.mof.gov.tw/LawContent.aspx?id=FL041411', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Taiwan';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2025-12-31', 'https://kpmg.com/us/en/taxnewsflash/news/2025/08/pakistan-compliance-deadlines-e-invoicing.html',
         'active', '2025-12-31', 'https://www.dawn.com/news/1944640',
         'active', '2025-12-31', 'https://fbr.gov.pk/faqs/173967/173969',
         6, 'years', 'https://download1.fbr.gov.pk/Docs/20247231874252122SalesTaxAct,1990updatedbyFinanceAct,2024upto30.06.2024--12.07.2024.pdf',
         'required', 'https://www.ey.com/en_gl/technical/tax-alerts/pakistan-amends-sales-tax-rules-for-implementation-of-electronic-invoicing', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Pakistan';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2020-01-01', 'https://www.collectivites-locales.gouv.fr/animer-les-territoires/commande-publique/les-formulaires-de-la-commande-publique/la-facturation-electronique',
         'planned', '2026-09-01', 'https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_pratique_facturation_electronique.pdf',
         'no_mandate', NULL, 'https://www.impots.gouv.fr/international-professionnel/le-reporting-pour-les-entreprises-etrangeres-sans-etablissement-stable',
         10, 'years', 'https://www.economie.gouv.fr/entreprises/gerer-sa-comptabilite-et-ses-demarches/entreprises-combien-de-temps-devez-vous',
         'conditional', 'https://bofip.impots.gouv.fr/bofip/8862-PGP.html/identifiant=BOI-TVA-DECLA-30-20-30-10-20180207', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'France';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2015-03-31', 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983583/2025+Italy+2025+eInvoicing+Country+Sheet',
         'active', '2019-01-01', 'https://www.agenziaentrate.gov.it/portale/documents/20143/2891698/Slide+novit%C3%A0+2024+fatturaz+elettronica.pdf/a4196470-b717-3713-e5c0-47c6754d7276',
         'active', '2019-01-01', 'https://www.mef.gov.it/focus/1-gennaio-2019-la-fattura-diventa-elettronica-00001/',
         10, 'years', 'https://www.brocardi.it/codice-civile/libro-quinto/titolo-ii/capo-iii/sezione-iii/art2220.html',
         'conditional', 'https://www.agid.gov.it/it/piattaforme/fatturazione-elettronica/professionisti-imprese', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Italy';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2015-01-15', 'https://www.facturae.gob.es/factura-electronica/noticias-destacadas/obligatoriedad-facturas-electronicas',
         'unknown', NULL, 'https://sede.agenciatributaria.gob.es/Sede/todas-noticias/2026/marzo/31/facturacion-electronica-obligatoria.html',
         'no_mandate', NULL, 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-7295',
         4, 'years', 'https://sede.agenciatributaria.gob.es/Sede/iva/facturacion-registro/facturacion-iva/obligacion-conservar-facturas.html',
         'conditional', 'https://www.boe.es/buscar/act.php?id=BOE-A-2012-14696', '2026-08-21',
         'RD 238/2026 is in force from 20 Apr 2026 but defers application to 12 months (turnover over EUR 8m) or 24 months after a ministerial order that was still unpublished at 21 Aug 2026. There is therefore no legally fixed start date to record.'
  FROM countries WHERE name_en = 'Spain';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2026-02-01', 'https://efaktura.gov.pl/uslugi-pef/pef-a-ksef/',
         'active', '2026-02-01', 'https://www.gov.pl/web/finanse/drugi-etap-wdrozenia-krajowego-systemu-e-faktur',
         'voluntary', NULL, 'https://www.gov.pl/web/finanse/krajowy-system-e-faktur--plan-wdrozenia',
         10, 'years', 'https://arslege.pl/przechowywanie-faktur-ustrukturyzowanych/k76/a134718/',
         'not_required', 'https://ksef.podatki.gov.pl/media/cq3laefg/podrecznik-ksef-2-0-cz-i-rozpoczecie-korzystania-z-ksef.pdf', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Poland';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2022-07-01', 'https://www.ey.com/ro_ro/insights/tax/obligatia-de-a-utiliza-sistemul-national-ro-e-facturare-in-contractele-de-achizitie-publica',
         'active', '2024-07-01', 'https://static.anaf.ro/static/10/Brasov/Brasov/facturarea_electronica.pdf',
         'active', '2025-01-01', 'https://static.anaf.ro/static/10/Brasov/Brasov/oug_138_efactura.pdf',
         5, 'years', 'https://www.universuljuridic.ro/legea-contabilitatii-nr-82-1991-o-u-g-nr-28-1999-privind-obligatia-operatorilor-economici-de-a-utiliza-aparate-de-marcat-electronice-fiscale-modificari-legea-nr-36-2023/',
         'not_required', 'https://www.universuljuridic.ro/o-u-g-nr-120-2021-privind-administrarea-functionarea-si-implementarea-sistemului-national-privind-factura-electronica-ro-e-factura-si-factura-electronica-in-romania-modificari-legea-nr-139-2022/', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Romania';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'no_mandate', NULL, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108888/eInvoicing+in+Hungary',
         'active', '2025-07-01', 'https://orbitax.com/news/country/article/Hungary-is-making-e-invoicing-_e12197f3-c0ec-11f0-aea1-3a8aa5358275',
         'no_mandate', NULL, 'https://www.vatupdate.com/2026/05/02/hungary-e-invoicing-2026-key-dates-rtir-sector-mandates-and-compliance-requirements/',
         8, 'years', 'https://5percado.hu/iratok-selejtezese-birone-zeller-judit/',
         'not_required', 'https://www.digitdoc.hu/megoldasaink/e-szamla/jogszabalyi-hatter', '2026-08-21',
         NULL
  FROM countries WHERE name_en = 'Hungary';

-- ---- the notes, English ---------------------------------------------
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Supplies to state bodies fall under the same e-qaime rule; no separate B2G portal', 'e-qaime via e-taxes.gov.az for VAT payers and Art.218.1.2 persons; universal 2018', 'Consumer sales use certified online cash registers issuing receipts, not e-qaime',
         'E-qaime stored in the STS system; 5-year retention matches the audit limitation', 'Every e-qaime must be authorised with Asan Imza or an enhanced e-signature'
  FROM countries WHERE name_en = 'Azerbaijan';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Government procurement invoices go through IS ESF like any other B2B supply', 'Art.412 ESF duty for VAT payers; from 1 Jan 2026 extended to more non-VAT issuers', 'No e-invoice for retail sales covered by a fiscal cash register receipt',
         'Storage tied to the limitation period: 3 years generally, 5 for large taxpayers', 'Each XML e-invoice needs a GOST digital signature before IS ESF will accept it'
  FROM countries WHERE name_en = 'Kazakhstan';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'ESF mandatory for B2B and B2G since 1 Jan 2020 under Cabinet Resolution 522', 'From 2026 invoices are risk-scored; input VAT on flagged ones waits for tax paid', 'Cash retail to individuals uses online cash register receipts instead of an ESF',
         'Accounting Law art.29: keep documents at least 5 years after the reporting year', 'Every ESF is signed with an EDS certificate registered via e-imzo'
  FROM countries WHERE name_en = 'Uzbekistan';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'No B2G issuance mandate; suppliers opt in to eGUI to invoice government agencies', 'MOF: e-invoice optional; other GUI types allowed under Art.7 of the UI Regulations', 'Same optional eGUI; cloud invoice compulsory only for non-resident e-service sellers',
         'Invoices and vouchers 5 yrs; account books 10 (Commercial Accounting Act Art.38)', 'Art.5: MOF-approved or government CA certificates must sign platform messages'
  FROM countries WHERE name_en = 'Taiwan';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'No B2G-specific scheme; sales to govt fall under the general registered-person rule', 'Phased Sep-Dec 2025 by turnover; legally universal, actual integration still patchy', 'Covers sales to unregistered buyers; POS retailers deemed already integrated',
         'Sales Tax Act s.24 requires records and documents to be kept for six years', 'Integrated systems sign invoices; FBR returns a 22-digit IRN plus a QR code'
  FROM countries WHERE name_en = 'Pakistan';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'All suppliers to public bodies e-invoice via Chorus Pro; micro-firms since 2020', '1 Sep 2026 large and mid issue, 2027 SMEs; all must receive 2026; PDP-only model', 'No B2C e-invoice duty; only e-reporting of transaction data from Sep 2026/2027',
         '10 yrs accounting records (Code de commerce); 6 yrs minimum under LPF art. L102 B', 'Qualified signature is one of three options with EDI and audit trail (CGI 289 VII)'
  FROM countries WHERE name_en = 'France';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Suppliers send FatturaPA via SdI: central bodies Jun 2014, all PAs Mar 2015', 'Mandatory via SdI since 2019; last exempt group, flat-rate forfettari, in from 2024', 'Invoices to consumers also go through SdI; the buyer must also be given a copy',
         'Civil Code art. 2220: books and invoices kept 10 years from the last entry', 'Qualified signature required on FatturaPA to public bodies; SdI accepts unsigned B2B'
  FROM countries WHERE name_en = 'Italy';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Facturae via FACe since Jan 2015; bodies may exempt invoices under EUR 5,000', 'Crea y Crece: RD 238/2026 in force but start awaits an unpublished ministerial order', 'RD 238/2026 covers B2B only; VeriFactu software rules are not an e-invoice duty',
         'AEAT: 4 years for VAT; 5 for investment gold; longer where regularisation applies', 'Optional under RD 1619/2012 (controls, EDI or signature); B2G Facturae is signed'
  FROM countries WHERE name_en = 'Spain';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'B2G invoices go through KSeF; PEF stays a procurement-only exchange channel', 'Large firms 1 Feb 2026; all others 1 Apr 2026; sub-PLN10k monthly issuers 2027', 'MF kept consumer invoices in KSeF voluntary; no B2C issuing duty',
         'Art. 112aa: KSeF stores structured invoices 10 yrs; art. 112 and 112a disapplied', 'No signature on the invoice; a certificate is only for KSeF system access'
  FROM countries WHERE name_en = 'Poland';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Law 139/2022: RO-established suppliers e-invoice public procurement contracts', 'From 1 Jul 2024 B2B invoices are valid only if sent through RO e-Factura', 'OUG 138/2024: B2C in e-Factura; 13 zeros used when the buyer gives no tax code',
         'Law 36/2023 cut it to 5 yrs from 1 July of the year after the financial year', 'The system applies the MF seal; the sealed XML is the original, no issuer signature'
  FROM countries WHERE name_en = 'Romania';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Public bodies must receive EN 16931 invoices; suppliers have no issuing duty', 'Sectoral only: power and gas from Jul 2025, water Jan 2026; no general B2B duty', 'RTIR reports data only; no consumer e-invoice mandate, residential users exempt',
         'Accounting Act s.169: bizonylatok kept at least 8 years in readable form', 'No mandatory e-signature; business controls, EDI or e-signature all accepted'
  FROM countries WHERE name_en = 'Hungary';

-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM country_headline_facts = 36
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE lang = 'en' = 36
--
-- EVERY ROW LANDED ON A REAL COUNTRY. These are SELECT..FROM countries
-- inserts, so a misspelled name inserts nothing and reports success --
-- the shape migration 500 shipped for three releases.
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id IS NULL = 0

