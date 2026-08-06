-- Kazakhstan: milestones + English translations. Hand-written (not
-- scaffolder-generated, to keep full control over mandate_scope/
-- anchor/on_tracker per milestone). INSERT OR IGNORE throughout.
--
-- Sourcing: independently researched in this session against the
-- State Revenue Committee's own site (kgd.gov.kz, both ru and en
-- sections -- directly fetched and confirmed live/on-topic), the
-- official Adilet legal database (adilet.zan.kz -- Order No. 370's
-- English text fetched directly; several other Adilet pages, notably
-- Order No. 629 and the Administrative Offences Code text, returned
-- robots/SSL errors on every automated fetch attempt in this session
-- and are sourced here via reputable secondary compilers/mirrors
-- instead -- see individual milestone notes below and PROGRESS.md's
-- build entry for the full citation trail). Kazakhstan's ИС ЭСФ (IS
-- ESF) is a mature CTC clearance system: a 2014 voluntary pilot,
-- mandatory for all VAT payers from 1 Jan 2019, and a further scope
-- expansion (universal VAT-payer coverage plus 12 new non-VAT-payer
-- categories) effective 1 Jan 2026 under a wholly new Tax Code.
--
-- Flagged as NOT independently verified and deliberately excluded
-- from this migration: a rumoured pre-2019 "risk goods" (excise/
-- imported-goods) mandatory wave predating the general 2019 mandate --
-- no separately-dated, independently-sourced milestone for this could
-- be found; and the exact current IS ESF public-facing portal domain
-- (search results surfaced both "esf.gov.kz" and what appears to be an
-- unrelated phishing-clone domain, so this migration only cites
-- kgd.gov.kz's own confirmed-live e-invoicing section pages as portal
-- links, not an unverified esf.gov.kz URL).

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'kz-voluntary-2014', id, '2014-07-01', 0,
    'https://kgd.gov.kz/en/section/elektronnye-scheta-faktury',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'KZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'kz-voluntary-2014', 'en',
  'Voluntary e-invoicing launches (ИС ЭСФ)',
  'Kazakhstan''s electronic invoice information system (ИС ЭСФ) went live on 1 July 2014 on a purely voluntary basis, under Government Resolution No. 818 (23 July 2014), which set the original rules for e-invoice format, issuance, transmission, receipt, registration, and storage. This built on Article 263 of the then-current 2008 Tax Code and marked the start of a rollout that would not become mandatory for another five years.',
  '["No action required at this stage -- participation was optional.","Businesses wanting an early start could register voluntarily via the State Revenue Committee (kgd.gov.kz)."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'kz-b2b-mandatory-2019', id, '2019-01-01', 1,
    'https://kgd.gov.kz/en/news/all-vat-payers-are-required-issue-electronic-invoices-1-38899',
    1, '[{"label":"State Revenue Committee -- e-invoicing (ЭСФ) section","url":"https://kgd.gov.kz/en/section/elektronnye-scheta-faktury"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'KZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'kz-b2b-mandatory-2019', 'en',
  'E-invoicing becomes mandatory for all VAT payers',
  'From 1 January 2019, every VAT-registered taxpayer in Kazakhstan became required to issue electronic invoices for the sale of goods, works, and services, under the 2017 Tax Code (Law No. 120-VI) as implemented via Order No. 370 (22 April 2019, applied retroactively to 1 January 2019). Kazakhstan operates a real-time pre-validation clearance model: every invoice is submitted to and validated by the central IS ESF platform before it becomes visible to the buyer, comparable to the clearance systems used in Colombia and Argentina.',
  '["Register for IS ESF access and obtain a National Certification Authority (NUC RK) digital certificate.","Confirm your invoicing software submits every sale invoice to IS ESF for pre-validation before delivery to the buyer.","Retain validated invoices and their IS ESF acceptance record per Kazakhstan''s document-retention rules."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'kz-newtaxcode-2025', id, '2025-07-18', 0,
    'https://zakon.uchet.kz/rus/docs/K2500000214',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'KZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'kz-newtaxcode-2025', 'en',
  'New Tax Code signed into law',
  'Law No. 214-VIII (signed 18 July 2025) enacted an entirely new Tax Code, effective 1 January 2026, replacing the 2017 Tax Code (No. 120-VI) under which the 2019 e-invoicing mandate had operated. The new code recodifies the e-invoicing obligation at Articles 207-209 and is the legislative vehicle for the scope expansion and lowered VAT threshold that follow on 1 January 2026. Note: this source is a legal-text mirror site, not adilet.zan.kz directly -- adilet.zan.kz blocked automated fetching of this page in this session and should be checked directly before treating the citation as fully primary-verified.',
  '["Review the new Tax Code''s Articles 207-209 for the recodified e-invoicing categories ahead of the 1 January 2026 effective date."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'kz-order629-2025', id, '2025-10-28', 0,
    'https://pro1c.kz/news/zakonodatelstvo/izmeneniya-v-pravilakh-vypiski-esf-s-2026-goda/',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'KZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'kz-order629-2025', 'en',
  'New e-invoice form and rules approved (Order No. 629)',
  'The Minister of Finance''s Order No. 629 (28 October 2025) approved a new e-invoice form and rule set, replacing Order No. 370 and effective 1 January 2026 alongside the new Tax Code. It adds new invoice fields (VAT-registration date, National Product Catalogue codes, advocate/non-resident supplier categories), requires biometric ID for registration, and introduces mandatory buyer confirmation for corrected or cancelled invoices. Sourced via two independent secondary industry sites (acsour.kz, pro1c.kz) that agree on the order number and date; the corresponding Adilet primary-source page could not be independently fetched in this session and should be verified directly before further reliance.',
  '["Update invoicing software ahead of 1 January 2026 for the new mandatory fields and buyer-confirmation workflow introduced by Order No. 629."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'kz-scope-expansion-2026', id, '2026-01-01', 0,
    'https://sovos.com/regulatory-updates/vat/kazakhstan-e-invoicing-mandatory-for-all-vat-payers-and-extended-to-non-vat-payers/',
    1, '[{"label":"State Revenue Committee -- e-invoicing (ЭСФ) section","url":"https://kgd.gov.kz/en/section/elektronnye-scheta-faktury"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'KZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'kz-scope-expansion-2026', 'en',
  'Mandate expands: universal VAT-payer coverage plus 12 non-VAT-payer categories',
  'From 1 January 2026, the new Tax Code''s Articles 207-209 confirm universal e-invoicing coverage for all VAT payers and extend the obligation to roughly a dozen non-VAT-registered categories -- commission agents and freight forwarders, customs representatives and carriers, simplified-tax-regime taxpayers, medical/pharmaceutical sellers, law offices, importers, and participants in the "Virtual Warehouse" traceability module, among others. This lands alongside a lowered VAT registration threshold (10,000 MRP, roughly KZT 40-43 million annual turnover, down from about 20,000 MRP) and a VAT rate increase to 16%, both of which indirectly expand the population now subject to e-invoicing.',
  '["Non-VAT-registered businesses: check the new Tax Code''s Art. 208 categories to see if your activity (commission/forwarding, customs services, simplified regime, medical/pharma sales, legal services, imports, tracked goods) now requires e-invoicing.","Re-check your VAT registration status against the new, lower 10,000 MRP threshold for 2026."]'
);
