-- Ghana: the six headline facts, notes in four languages, and the
-- fact_history rows that record them for the first time.
--
-- GHANA IS LIVE, AND THE DATE THAT MATTERS IS NOT THE ONE MOST SOURCES
-- LEAD WITH. The E-VAT programme -- formally the Certified Invoicing
-- System -- has been running since a pilot on 1 October 2022, phased by
-- taxpayer size. But on 1 January 2026 the Value Added Tax Act, 2025
-- (Act 1151) replaced Act 870, and at section 43(2) it made certified
-- invoicing a GENERAL STATUTORY DUTY ON EVERY TAXABLE PERSON. The
-- obligation stopped being an administrative programme aimed at named
-- taxpayers. That is the date recorded against all three statuses here,
-- because it is the date from which the answer to "does this apply to
-- me" stopped depending on whether the GRA had written to you.
--
-- THE PHASES SLIPPED AND THE TAIL IS UNVERIFIED, WHICH THE TIMELINE
-- SHOWS AND THE STATUSES DELIBERATELY DO NOT. The 2023 plan had Phase 1
-- by June 2023, Phase 2 by December 2023 and everyone by December 2024.
-- Phase 1 actually onboarded in May 2024 and Phase 2 in September 2024.
-- No GRA notice exists for any later phase, and GRA enforcement sweeps
-- in Accra in May 2026 were still finding businesses issuing receipts
-- selectively. So: legally mandatory for all, onboarding and enforcement
-- still in progress. 'active' is right for the duty; the deep dive
-- carries the rollout's real state.
--
-- SIGNATURE IS 'conditional', AND THE ALTERNATIVES ARE BOTH WRONG. No
-- Ghanaian taxpayer needs to hold a certificate, so 'required' would
-- overstate it. But every invoice must carry a fiscal signature applied
-- by the certified system before it reaches the customer -- the Virtual
-- Sales Data Controller stamps it with a daily key from the GRA's key
-- management module -- so 'not_required' would understate it, which is
-- how at least one vendor tracker describes Ghana today. 'conditional'
-- is the value that says both halves.
--
-- E-REPORTING AND E-INVOICING ARE ONE MECHANISM HERE, WHICH IS NEW FOR
-- THIS SITE. Everywhere else the two are separate obligations that a
-- country may have in either combination. In Ghana the invoice IS the
-- report: issuance transmits to the GRA's back end, in real time when
-- online and within 24 hours otherwise, and purchases are reported as
-- well as sales. Recording e-reporting as anything less than active
-- would describe a country that does not exist.
--
-- ONE CONFLICT RESOLVED IN FAVOUR OF THE PRIMARY SOURCES: a vendor
-- tracker states a 48-hour upload window. Act 1151 s.43(10), the GRA's
-- E-VAT page and the GRA's own help centre all say 24. Use 24.
--
-- ARCHIVING RESTS ON THE REVENUE ADMINISTRATION ACT, NOT THE VAT ACT.
-- Act 1151 s.43(4) requires a copy of each invoice to be retained in
-- sequential order but sets no period; the six years comes from Act 915
-- s.27, which is the general rule across taxes, and the E-VAT guidelines
-- restate it. Longer applies while a dispute, refund claim or
-- investigation is open, which the note carries.
--
-- NOTHING HERE IS 'unknown', so no unknown_reason is set. What could not
-- be verified is recorded on the deep dive instead, and it is unusual:
-- the official text of Act 1151 and the GRA's January 2026 VAT
-- Guidelines are BOTH scanned images with no extractable text. Every
-- section-level quotation rests on transcriptions that agree with each
-- other and with EY's and KPMG's summaries. Ghana is the first country
-- on this site whose primary law we could not read.

INSERT OR IGNORE INTO country_headline_facts (
  country_id,
  b2g_status, b2g_date, b2g_source,
  b2b_status, b2b_date, b2b_source,
  b2c_status, b2c_date, b2c_source,
  archiving_years, archiving_status, archiving_source,
  signature_status, signature_source,
  ereporting_status, ereporting_frequency, ereporting_system,
  ereporting_date, ereporting_source,
  last_verified, unknown_reason)
SELECT id,
  'active', '2026-01-01', 'https://gra.gov.gh/news/portfolio/notice-to-all-vat-registered-taxpayers/',
  'active', '2026-01-01', 'https://gra.gov.gh/news/portfolio/notice-to-all-vat-registered-taxpayers/',
  'active', '2026-01-01', 'https://gra.gov.gh/wp-content/uploads/2024/07/E-VAT-GUIDELINES_20240222.pdf',
  6, 'years', 'https://gra.gov.gh/wp-content/uploads/2023/01/Revenue-Administration-Act-2016-.pdf',
  'conditional', 'https://gra.gov.gh/wp-content/uploads/2024/07/E-VAT-GUIDELINES_20240222.pdf',
  'active', 'real_time', 'Certified Invoicing System (E-VAT)',
  '2026-01-01', 'https://gra.gov.gh/wp-content/uploads/2024/07/E-VAT-GUIDELINES_20240222.pdf',
  '2026-08-27', NULL
FROM countries WHERE code = 'GH';

-- ---- notes, four languages, each measured under the 150-char ceiling ----

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'en',
  'No separate B2G rule. Supplies to government run through the same Certified Invoicing System every taxable person must use since January 2026.',
  'Act 1151 s.43(2) makes certified invoicing a duty on every taxable person from 1 January 2026, replacing the phased programme before it.',
  'Retail is in scope. Sales receipts run through the same system; fiscal devices at points of sale were approved by Parliament in July 2026.',
  'Six years under the Revenue Administration Act 2016 s.27, and longer while a dispute, refund claim or investigation is open.',
  'No taxpayer certificate is needed, but every invoice carries a fiscal signature applied by the GRA-certified system before issue.',
  'The invoicing system is the reporting channel. Invoice and purchase data reach the GRA in real time, or within 24 hours when offline.'
FROM countries WHERE code = 'GH';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'es',
  'Sin norma B2G aparte. Las entregas al Estado pasan por el mismo sistema certificado que todo sujeto pasivo debe usar desde enero de 2026.',
  'El art. 43(2) de la Ley 1151 impone la facturación certificada a todo sujeto pasivo desde el 1 de enero de 2026, en lugar del plan por fases.',
  'El comercio minorista está incluido. Los tiques usan el mismo sistema; el Parlamento aprobó los dispositivos fiscales en julio de 2026.',
  'Seis años según el art. 27 de la Ley de Administración de Ingresos de 2016, y más mientras haya litigio, devolución o inspección abiertos.',
  'No se exige certificado al contribuyente, pero cada factura lleva una firma fiscal aplicada por el sistema certificado antes de emitirse.',
  'El sistema de facturación es el canal de declaración. Los datos de ventas y compras llegan a la GRA en tiempo real, o en 24 horas si no hay conexión.'
FROM countries WHERE code = 'GH';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'de',
  'Keine eigene B2G-Regel. Lieferungen an den Staat laufen über dasselbe zertifizierte System, das seit Januar 2026 für jeden Steuerpflichtigen gilt.',
  'Art. 43(2) des Gesetzes 1151 macht die zertifizierte Rechnungsstellung ab 1. Januar 2026 zur Pflicht für jeden Steuerpflichtigen.',
  'Der Einzelhandel ist erfasst. Kassenbelege laufen über dasselbe System; Fiskalgeräte wurden im Juli 2026 vom Parlament bewilligt.',
  'Sechs Jahre nach Art. 27 des Revenue Administration Act 2016, und länger, solange Streit, Erstattung oder Prüfung offen sind.',
  'Ein Zertifikat des Steuerpflichtigen ist nicht nötig, doch jede Rechnung trägt eine vom zertifizierten System erzeugte Fiskalsignatur.',
  'Das Rechnungssystem ist der Meldekanal. Verkaufs- und Einkaufsdaten erreichen die GRA in Echtzeit oder binnen 24 Stunden ohne Verbindung.'
FROM countries WHERE code = 'GH';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'fr',
  'Pas de règle B2G distincte. Les livraisons à l''État passent par le même système certifié imposé à tout assujetti depuis janvier 2026.',
  'L''art. 43(2) de la loi 1151 impose la facturation certifiée à tout assujetti depuis le 1er janvier 2026, en remplacement du plan par phases.',
  'Le commerce de détail est visé. Les tickets passent par le même système ; le Parlement a approuvé les appareils fiscaux en juillet 2026.',
  'Six ans selon l''art. 27 de la loi de 2016 sur l''administration des recettes, et davantage tant qu''un litige ou un contrôle reste ouvert.',
  'Aucun certificat n''est exigé du contribuable, mais chaque facture porte une signature fiscale apposée par le système certifié avant émission.',
  'Le système de facturation est le canal déclaratif. Les données de ventes et d''achats parviennent à la GRA en temps réel, ou sous 24 heures.'
FROM countries WHERE code = 'GH';

-- ---- fact_history: first recorded ----

INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2g_status', NULL, 'active', '2026-08-27', 'first_recorded',
       'https://gra.gov.gh/news/portfolio/notice-to-all-vat-registered-taxpayers/' FROM countries WHERE code = 'GH';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2b_status', NULL, 'active', '2026-08-27', 'first_recorded',
       'https://gra.gov.gh/news/portfolio/notice-to-all-vat-registered-taxpayers/' FROM countries WHERE code = 'GH';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2c_status', NULL, 'active', '2026-08-27', 'first_recorded',
       'https://gra.gov.gh/wp-content/uploads/2024/07/E-VAT-GUIDELINES_20240222.pdf' FROM countries WHERE code = 'GH';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'archiving_status', NULL, 'years', '2026-08-27', 'first_recorded',
       'https://gra.gov.gh/wp-content/uploads/2023/01/Revenue-Administration-Act-2016-.pdf' FROM countries WHERE code = 'GH';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'signature_status', NULL, 'conditional', '2026-08-27', 'first_recorded',
       'https://gra.gov.gh/wp-content/uploads/2024/07/E-VAT-GUIDELINES_20240222.pdf' FROM countries WHERE code = 'GH';

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'GH') = 1
-- ASSERT: SELECT b2b_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'GH') = 'active'
-- ASSERT: SELECT ereporting_frequency FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'GH') = 'real_time'
-- ASSERT: SELECT signature_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'GH') = 'conditional'
-- ASSERT: SELECT archiving_years FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'GH') = 6
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE country_id = (SELECT id FROM countries WHERE code = 'GH') = 4
-- ASSERT: SELECT count(*) FROM fact_history WHERE country_id = (SELECT id FROM countries WHERE code = 'GH') = 5
-- Ghana is the site's first country where invoicing and reporting are one
-- mechanism. If a later edit splits them, this line says what was meant:
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'GH') AND b2b_status = 'active' AND ereporting_status = 'active' = 1
