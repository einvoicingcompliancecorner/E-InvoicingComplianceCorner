-- ================================================================
-- Headline facts: the last seven. Sourced differently, and this file
-- says so at the top rather than burying it.
-- ================================================================
--
-- Cyprus, Malta, Turkey, the United Kingdom, Kenya, Nigeria and the
-- United Arab Emirates. With these the table covers all 70 tracked
-- jurisdictions.
--
-- ---- WHY THIS BATCH IS NOT LIKE THE OTHER NINE ----------------------
--
-- Batches 601-607 were researched by reading the tax authority, the
-- statute or the EU eInvoicing country page, one fact at a time, per
-- ADDING-A-COUNTRY.md. This batch could not be: the session ran out of
-- web searches at 200 of 200 before reaching these seven, and search is
-- how a primary source gets found in the first place.
--
-- What was still available was fetching a URL that had already been
-- named. Dan named one on 21 August: "Maybe you can validate your
-- results against this site when complete - https://www.e-invoice.app/
-- compare". Its per-country pages carry exactly the five facts this
-- table wants, and they name the instrument behind each one. So the
-- research here is one aggregator plus, where the aggregator named a
-- primary instrument unambiguously, that instrument's URL recorded as
-- the source.
--
-- THAT IS A WEAKER STANDARD AND THE ROWS ADMIT IT. Where the source
-- field points at e-invoice.app, the fact rests on a secondary tracker
-- this project has not audited. Those are: all of Cyprus, all of Malta
-- bar archiving, Turkey bar archiving, and the two signature rows for
-- the UK and the UAE. They should be re-verified against a primary
-- source in a session that has search. The remaining sources are the
-- instruments themselves -- legislation.gov.uk, kenyalaw.org, the UAE
-- Ministerial Decisions, gov.uk VAT Notice 700/21 -- and are as good as
-- anything in 601-607.
--
-- ---- WHAT THE AGGREGATOR GOT WRONG FOR OUR PURPOSES -----------------
--
-- Not wrong in itself; wrong if copied. e-invoice.app records Cyprus,
-- Malta and the UK as B2G "mandatory"/"phased" on the strength of
-- "public authorities must accept EN-compliant invoices". This table
-- has said since 601 that a status describes the ISSUING obligation and
-- receiving duties go in the note -- which is why Ireland already sits
-- at no_mandate with "Public bodies receive via Peppol since 2019; no
-- supplier issuing duty" while Germany, whose federal suppliers must
-- issue, sits at active.
--
-- Copying the aggregator would have printed ACTIVE B2G against three
-- countries where a supplier has no duty to send anything. All three
-- are recorded no_mandate here, with the receipt duty in the note. This
-- is the whole reason the convention was written down.
--
-- Same rule the other way for the UAE: nothing is in force, so both
-- business segments are 'planned' with their dates, matching Germany
-- rather than Saudi Arabia. And Nigeria and Turkey are 'active' though
-- both are threshold-limited, matching India and Saudi Arabia, which
-- are in force for some taxpayers and not others.
--
-- ---- ELEVEN MORE UNKNOWNS, DELIBERATELY -----------------------------
--
-- Seven signature and archiving facts are 'unknown' with a reason. In
-- four of them the reason records that the likely answer is known and
-- the citation is not: the UK almost certainly retains VAT Directive
-- art.233, Malta almost certainly follows it, Nigeria's general record
-- rule is six years. Reasoning is not a source. Every other row in this
-- table cites something that says the thing; these would have cited
-- something that merely made it plausible, which is the exact defect
-- the August citation audit found in 71% of story citations.


-- ---- the rows ------------------------------------------------------
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'no_mandate', NULL, 'https://www.e-invoice.app/country/CY',
         'no_mandate', NULL, 'https://www.e-invoice.app/country/CY',
         'no_mandate', NULL, 'https://www.e-invoice.app/country/CY',
         NULL, 'unknown', 'https://www.e-invoice.app/country/CY',
         'unknown', 'https://www.e-invoice.app/country/CY', '2026-08-22',
         'The one source reachable this session carries no retention figure for Cyprus, and the Tax Department pages that would settle it could not be fetched. A period guessed from the EU norm would be a guess.'
  FROM countries WHERE name_en = 'Cyprus';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'no_mandate', NULL, 'https://www.e-invoice.app/country/MT',
         'no_mandate', NULL, 'https://www.e-invoice.app/country/MT',
         'no_mandate', NULL, 'https://www.e-invoice.app/country/MT',
         6, 'years', 'https://www.e-invoice.app/country/MT',
         'unknown', 'https://www.e-invoice.app/country/MT', '2026-08-22',
         'Malta almost certainly follows the VAT Directive art.233 pattern of business controls, AES or EDI, but this session could not open a Maltese source that says so, and every other row in this table cites one that does.'
  FROM countries WHERE name_en = 'Malta';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2021-03-01', 'https://www.e-invoice.app/country/TR',
         'active', '2014-04-01', 'https://www.e-invoice.app/country/TR',
         'active', '2014-04-01', 'https://www.e-invoice.app/country/TR',
         10, 'years', 'https://www.gib.gov.tr/',
         'required', 'https://www.e-invoice.app/country/TR', '2026-08-22',
         NULL
  FROM countries WHERE name_en = 'Turkey';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'no_mandate', NULL, 'https://www.legislation.gov.uk/uksi/2019/624/made',
         'planned', '2029-04-01', 'https://www.gov.uk/government/consultations/promoting-electronic-invoicing-across-uk-businesses-and-the-public-sector/outcome/promoting-electronic-invoicing-across-uk-businesses-and-the-public-sector-consultation-response',
         'no_mandate', NULL, 'https://www.gov.uk/government/consultations/promoting-electronic-invoicing-across-uk-businesses-and-the-public-sector/outcome/promoting-electronic-invoicing-across-uk-businesses-and-the-public-sector-consultation-response',
         6, 'years', 'https://www.gov.uk/guidance/record-keeping-for-vat-notice-70021',
         'unknown', 'https://www.e-invoice.app/country/GB', '2026-08-22',
         'The UK retained the VAT Directive art.233 approach after exit, which would make this not_required, but that is reasoning rather than a citation and this session could not open HMRC guidance saying it.'
  FROM countries WHERE name_en = 'United Kingdom';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2023-09-01', 'https://www.kra.go.ke/news-center/public-notices/1944-enforcement-of-the-electronic-tax-invoice',
         'active', '2023-09-01', 'https://kenyalaw.org/kl/fileadmin/pdfdownloads/LegalNotices/2023/LN29_2023.pdf',
         'active', '2023-09-01', 'https://www.kra.go.ke/online-services/etims',
         5, 'years', 'https://kenyalaw.org/kl/fileadmin/pdfdownloads/LegalNotices/2023/LN29_2023.pdf',
         'required', 'https://www.kra.go.ke/online-services/etims', '2026-08-22',
         NULL
  FROM countries WHERE name_en = 'Kenya';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'active', '2025-11-01', 'https://einvoice.firs.gov.ng/',
         'active', '2025-11-01', 'https://einvoice.firs.gov.ng/',
         'active', '2025-11-01', 'https://einvoice.firs.gov.ng/',
         NULL, 'unknown', 'https://einvoice.firs.gov.ng/',
         'unknown', 'https://einvoice.firs.gov.ng/', '2026-08-22',
         'The FIRS e-invoicing portal is the only Nigerian source reachable this session and it states no retention period. Nigeria''s general tax record rule is six years, but that is not the same claim as an e-invoice archiving duty.'
  FROM countries WHERE name_en = 'Nigeria';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified, unknown_reason)
  SELECT id, 'planned', '2027-10-01', 'https://mof.gov.ae/wp-content/uploads/2025/09/Ministerial-Decision-No.-244-of-2025-on-the-Implementation-of-the-Electronic-Invoicing-System.pdf',
         'planned', '2027-01-01', 'https://mof.gov.ae/wp-content/uploads/2025/09/Ministerial-Decision-No.-244-of-2025-on-the-Implementation-of-the-Electronic-Invoicing-System.pdf',
         'no_mandate', NULL, 'https://mof.gov.ae/wp-content/uploads/2025/09/Ministerial-Decision-no.-243-of-2025-on-the-Electronic-Invoicing-System.pdf',
         5, 'years', 'https://tax.gov.ae/DataFolder/Files/Pdf/VAT-Decree-Law-No-8-of-2017.pdf',
         'unknown', 'https://www.e-invoice.app/country/AE', '2026-08-22',
         'The UAE model is a five-corner ASP network where the provider, not the taxpayer, secures the document. Whether that amounts to a signature duty on the issuer is a reading of MD 243/244 this session could not open directly.'
  FROM countries WHERE name_en = 'United Arab Emirates';

-- ---- the notes, English ---------------------------------------------
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Authorities must accept EN-compliant invoices via Peppol since Apr 2020; no supplier issuing duty', 'No B2B e-invoicing requirement as at Aug 2026', 'No B2C e-invoicing requirement as at Aug 2026',
         'The source consulted states no VAT retention period for Cyprus', 'No signature rule found in the source consulted'
  FROM countries WHERE name_en = 'Cyprus';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Authorities must accept EN-compliant invoices since Apr 2020; no supplier issuing duty', 'No B2B e-invoicing requirement as at Aug 2026', 'No B2C e-invoicing requirement as at Aug 2026',
         'VAT Act art.48(4); up to 10 years for some transactions, 20 for immovable property; cross-border storage allowed', 'No signature rule found in the source consulted'
  FROM countries WHERE name_en = 'Malta';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Public entities are registered e-Fatura users; in-scope suppliers must issue to them electronically', 'e-Fatura mandatory above TRY 3m turnover, with lower sector-specific thresholds', 'e-Arsiv covers sales to buyers outside e-Fatura; QR code mandatory since Sep 2023',
         'Per GIB; issuer and recipient both archive the XML, on a certified portal or via an approved intermediary', 'UBL-TR 1.2 invoices carry a mandatory financial seal or qualified e-signature'
  FROM countries WHERE name_en = 'Turkey';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Contracting authorities must accept and process compliant e-invoices since Apr 2019 (SI 2019/624, Procurement Act 2023 s67); no supplier issuing duty', 'All VAT invoices to be issued electronically from Apr 2029; decentralised model, no real-time reporting', 'VAT invoices are not generally issued to consumers, so the 2029 mandate does not reach these',
         'VAT records kept at least 6 years (VAT Notice 700/21); Making Tax Digital requires digital records with digital links', 'No signature rule found in the source consulted'
  FROM countries WHERE name_en = 'United Kingdom';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Public bodies require an eTIMS electronic tax invoice before paying a supplier', 'eTIMS issuance mandatory under the Tax Procedures (Electronic Tax Invoice) Regulations 2023', 'B2C sales must also be supported by an eTIMS invoice carrying the QR code',
         'Tax Procedures Act; invoices archived by the supplier and on the KRA platform', 'Each invoice is signed by the eTIMS device or software and carries a unique QR code'
  FROM countries WHERE name_en = 'Kenya';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Pre-clearance through the FIRS Merchant Buyer Solution portal, large taxpayers first', 'Same MBS pre-clearance route; rollout beyond large taxpayers still phasing', 'Real-time reporting of high-value consumer transactions for large taxpayers',
         'No retention period stated by the source consulted', 'No signature or cryptographic stamp rule found in the source consulted'
  FROM countries WHERE name_en = 'Nigeria';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Government entities join the Accredited Service Provider system from 1 Oct 2027', 'Revenue at or above AED 50m appoint an ASP by 30 Oct 2026 and go live 1 Jan 2027; all others 1 Jul 2027', 'Expressly excluded from the Electronic Invoicing System by Ministerial Decision 243 of 2025',
         'Federal Decree-Law 8/2017 on VAT; accredited providers must meet storage and archival rules', 'No signature rule found in the sources consulted'
  FROM countries WHERE name_en = 'United Arab Emirates';

-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM country_headline_facts = 70
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE lang = 'en' = 70
--
-- EVERY ROW LANDED ON A REAL COUNTRY. These are SELECT..FROM countries
-- inserts, so a misspelled name inserts nothing and reports success --
-- the shape migration 500 shipped for three releases.
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id IS NULL = 0


-- ---- one repair on the way past --------------------------------------
--
-- Oman (migration 607) has three unknown facts and no unknown_reason.
-- Not a judgement call that went the wrong way -- a generator artefact.
-- The batch file carried the reasoning on each individual fact and the
-- generator lifts only the first fact-level reason it finds into the
-- row, and Oman happened to have written its reasoning into the notes
-- instead. So the row said "we do not know" three times and offered no
-- account of why, which is the one thing unknown_reason exists to stop.
--
-- Worth catching precisely because nothing failed. The insert succeeded,
-- the assertions passed, the tile would have rendered. It is the same
-- shape as the DELETE that matched nothing in the discarded migration
-- 600 draft: a thing that looks like it worked.
UPDATE country_headline_facts
   SET unknown_reason = 'The OTA publishes Fawtara phases by VAT registration size, not by counterparty type, so the B2G and B2C scope rules are not stated anywhere public; the government-entity phase is dated February with no year. The OTA FAQ calls e-invoices electronically certified without saying whether the issuer signs.'
 WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Oman')
   AND unknown_reason IS NULL;

-- ---- and the milestone this file actually reaches --------------------
--
-- EVERY TRACKED JURISDICTION NOW HAS A ROW. The European Union sits in
-- the countries table as a bloc, not a jurisdiction with a tax
-- authority, so it is excluded by name -- the same exclusion the guide
-- renderer makes.
--
-- This is the assertion worth having, because it is the one that turns
-- the renderer's "a missing row means not yet researched" fallback from
-- a live code path into a dead one. Until now the guide had two ways to
-- draw headline tiles and only the second was exercised on most pages.
-- ASSERT: SELECT count(*) FROM countries WHERE name_en != 'European Union' AND id NOT IN (SELECT country_id FROM country_headline_facts) = 0
--
-- Coverage is not the same as knowledge. 18 of the 350 facts are
-- 'unknown', concentrated in Bahrain, Qatar and Oman (migration 607)
-- and in the signature and archiving columns of this batch. The tile
-- must render those as "not confirmed" and never as "no requirement" --
-- a blank tile would say the second while meaning the first, which is
-- the failure this whole table was built to stop.
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE unknown_reason IS NOT NULL = 10
--
-- AND NOW THE ONE THAT KEEPS IT TRUE. Ten rows carry a reason and ten
-- rows have an unknown fact, and after the repair above those are the
-- same ten. Stated as an invariant so the next batch of research cannot
-- quietly reintroduce an unexplained unknown -- which is exactly how
-- this one arrived.
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_facts WHERE 'unknown' IN (b2g_status, b2b_status, b2c_status, archiving_status, signature_status) AND unknown_reason IS NULL = 0
