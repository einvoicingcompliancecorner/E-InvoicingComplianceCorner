-- Botswana: the six headline facts, their notes in four languages, and
-- the fact_history rows that record them for the first time.
--
-- WHAT BOTSWANA ACTUALLY HAS, AND WHY EACH STATUS READS AS IT DOES.
--
-- The Tax Administration Act, 2026 (Act 14 of 2026) was gazetted on
-- 30 June 2026 and commenced 1 July 2026. It defines an "electronic
-- billing system" for VAT-registered persons and sets its commencement
-- at nine months from the Act's own commencement -- approximately
-- 1 April 2027. VAT-registered persons must issue receipts through
-- approved devices that transmit data directly to BURS.
--
-- THE SCOPE IS THE SUPPLIER, NOT THE COUNTERPARTY. Botswana does not
-- legislate B2G, B2B and B2C separately. The duty attaches to the
-- VAT-registered supplier issuing a receipt or tax invoice, whoever the
-- customer is. So all three read 'planned' at the same date, and each
-- note says why rather than leaving a reader to assume three separate
-- instruments exist. Recording B2G as 'no_mandate' because no B2G
-- instrument exists would understate a duty that will in fact cover
-- invoices issued to government -- the same reasoning that moved Cyprus
-- and the Czech Republic off 'no_mandate' in migration 645, running in
-- the same direction.
--
-- THE DATE IS LEGISLATED; THE CALENDAR DAY IS COMPUTED. The Act carries
-- a nine-month formula, not a printed date, and no commencement notice
-- fixing a calendar day was found. The milestone therefore carries
-- confidence = 'expected'. A February 2026 Budget Speech had announced
-- an April 2026 rollout; that did not happen, and no source explicitly
-- announces a deferral -- the shift is visible only by reading the
-- speech against the later legislation. It is recorded as context in
-- 654 rather than as a superseded obligation, because nothing states it
-- was ever in force.
--
-- E-REPORTING IS REAL-TIME, AND THAT WORD IS THE GOVERNMENT'S OWN.
-- Paragraph 114 of the 2026 Budget Speech: the rollout "will enable real
-- time transaction monitoring". Cited to the speech rather than to an
-- adviser's paraphrase, because the frequency is the harder claim.
--
-- ARCHIVING IS EIGHT YEARS, AND THE EXCEPTIONS ARE NOT MODELLED. Five
-- years applies to non-resident remote-services suppliers and three to
-- small businesses under the simplified regime. The schema holds one
-- number; eight is the general rule and the note says so.
--
-- NO SIGNATURE REQUIREMENT. Read off the primary text: the VAT Act's
-- tax-invoice contents provision lists no signature. The Electronic
-- Records (Evidence) Act 2014 makes electronic records admissible
-- without requiring a signature on them. A negative read off the statute
-- is the strongest form of "not required" available.
--
-- WHAT IS NOT KNOWN, AND IS DELIBERATELY NOT GUESSED: the format, the
-- transmission protocol, whether the model is clearance or reporting,
-- how device accreditation will work, and how the VAT (Amendment) Act
-- 2025's fiscal-device language sits against the Tax Administration
-- Act's "electronic billing system". None of that is published. No
-- status here is 'unknown', so no unknown_reason is set.

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
  'planned', '2027-04-01', 'https://www.mondaq.com/southafrica/sales-taxes-vat-gst/1818540/africa-tax-in-brief-14-july-2026',
  'planned', '2027-04-01', 'https://www.mondaq.com/southafrica/sales-taxes-vat-gst/1818540/africa-tax-in-brief-14-july-2026',
  'planned', '2027-04-01', 'https://bw.andersen.com/electronic-fiscal-devices-in-botswana-what-they-are-and-how-they-will-work/',
  8, 'years', 'https://dailynews.gov.bw/news-detail/90913',
  'not_required', 'https://botswanaspeaks.gov.bw/media/BILLS/2026%20BILLS/Bill39%2019_12_2025%20VALUE%20ADDED%20TAX.pdf',
  'planned', 'real_time', 'Electronic billing system',
  '2027-04-01', 'https://www.bankofbotswana.bw/sites/default/files/publications/2026%20Budget%20Speech.pdf',
  '2026-08-26', NULL
FROM countries WHERE code = 'BW';

-- ---- notes, four languages, each under the 150-character ceiling ----

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'en',
  'No separate B2G rule. VAT-registered suppliers bill through the electronic billing system from April 2027, government customers included.',
  'The Tax Administration Act 2026 sets commencement nine months after 1 July 2026. Approved devices transmit receipt data directly to BURS.',
  'Same regime as B2B: the duty attaches to the VAT-registered supplier, not the customer. Retail receipts run through the same approved devices.',
  'Eight years for VAT and income tax, harmonised by the Tax Administration Act 2026, and the records must be kept in Botswana.',
  'The VAT Act lists no signature among a tax invoice''s required contents. Electronic records are admissible but not mandated.',
  'Real-time transmission to BURS through approved devices. The 2026 Budget Speech calls it real time transaction monitoring. Specification unpublished.'
FROM countries WHERE code = 'BW';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'es',
  'Sin norma B2G aparte. Desde abril de 2027 los proveedores inscritos en el IVA facturan por el sistema electrónico, también al Estado.',
  'La Ley de Administración Tributaria de 2026 fija el inicio nueve meses tras el 1 de julio de 2026. Los equipos homologados transmiten a BURS.',
  'Mismo régimen que B2B: la obligación recae en el proveedor inscrito en el IVA, no en el cliente. Los tiques minoristas usan los mismos equipos.',
  'Ocho años para IVA y renta, unificados por la Ley de Administración Tributaria de 2026, y los registros deben conservarse en Botsuana.',
  'La Ley del IVA no exige firma entre los datos obligatorios de la factura. Los registros electrónicos son admisibles, pero no obligatorios.',
  'Transmisión en tiempo real a BURS mediante equipos homologados. El Presupuesto 2026 lo llama seguimiento en tiempo real. Especificación sin publicar.'
FROM countries WHERE code = 'BW';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'de',
  'Keine eigene B2G-Regel. Ab April 2027 rechnen umsatzsteuerlich registrierte Lieferanten über das E-Billing-System ab, auch gegenüber Behörden.',
  'Das Steuerverwaltungsgesetz 2026 setzt den Start neun Monate nach dem 1. Juli 2026 an. Zugelassene Geräte übermitteln Belegdaten direkt an BURS.',
  'Wie bei B2B: Die Pflicht trifft den registrierten Lieferanten, nicht den Kunden. Auch Kassenbelege laufen über dieselben zugelassenen Geräte.',
  'Acht Jahre für Umsatz- und Einkommensteuer, vereinheitlicht durch das Steuerverwaltungsgesetz 2026; die Unterlagen müssen in Botsuana bleiben.',
  'Das Umsatzsteuergesetz nennt keine Signatur unter den Pflichtangaben einer Rechnung. Elektronische Aufzeichnungen sind zulässig, aber nicht Pflicht.',
  'Echtzeitübermittlung an BURS über zugelassene Geräte. Die Haushaltsrede 2026 spricht von Echtzeitüberwachung. Spezifikation nicht veröffentlicht.'
FROM countries WHERE code = 'BW';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'fr',
  'Pas de règle B2G distincte. Dès avril 2027, les fournisseurs assujettis à la TVA facturent via le système de facturation électronique, État compris.',
  'La loi de 2026 sur l''administration fiscale fixe l''entrée en vigueur neuf mois après le 1er juillet 2026. Les appareils agréés transmettent à BURS.',
  'Même régime qu''en B2B : l''obligation pèse sur le fournisseur assujetti, pas sur le client. Les tickets de caisse passent par les mêmes appareils.',
  'Huit ans pour la TVA et l''impôt sur le revenu, harmonisés par la loi de 2026, et les documents doivent être conservés au Botswana.',
  'La loi TVA n''exige aucune signature parmi les mentions obligatoires d''une facture. Les documents électroniques sont recevables sans être imposés.',
  'Transmission en temps réel à BURS via des appareils agréés. Le budget 2026 parle de suivi en temps réel. Spécification non publiée.'
FROM countries WHERE code = 'BW';

-- ---- fact_history: first recorded ----
--
-- 615's standing invariant requires every current headline value to be
-- the newest fact_history row for that country and field. Five fields
-- are tracked; e-reporting is not among them (see the CHECK on
-- fact_history.field). kind = 'first_recorded' requires old_value NULL,
-- and first_recorded rows are the one kind that needs no four-language
-- note -- there is no change to explain.

INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2g_status', NULL, 'planned', '2026-08-26', 'first_recorded',
       'https://www.mondaq.com/southafrica/sales-taxes-vat-gst/1818540/africa-tax-in-brief-14-july-2026'
FROM countries WHERE code = 'BW';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2b_status', NULL, 'planned', '2026-08-26', 'first_recorded',
       'https://www.mondaq.com/southafrica/sales-taxes-vat-gst/1818540/africa-tax-in-brief-14-july-2026'
FROM countries WHERE code = 'BW';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2c_status', NULL, 'planned', '2026-08-26', 'first_recorded',
       'https://bw.andersen.com/electronic-fiscal-devices-in-botswana-what-they-are-and-how-they-will-work/'
FROM countries WHERE code = 'BW';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'archiving_status', NULL, 'years', '2026-08-26', 'first_recorded',
       'https://dailynews.gov.bw/news-detail/90913'
FROM countries WHERE code = 'BW';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'signature_status', NULL, 'not_required', '2026-08-26', 'first_recorded',
       'https://botswanaspeaks.gov.bw/media/BILLS/2026%20BILLS/Bill39%2019_12_2025%20VALUE%20ADDED%20TAX.pdf'
FROM countries WHERE code = 'BW';

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'BW') = 1
-- ASSERT: SELECT b2b_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'BW') = 'planned'
-- ASSERT: SELECT ereporting_frequency FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'BW') = 'real_time'
-- ASSERT: SELECT archiving_years FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'BW') = 8
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE country_id = (SELECT id FROM countries WHERE code = 'BW') = 4
-- ASSERT: SELECT count(*) FROM fact_history WHERE country_id = (SELECT id FROM countries WHERE code = 'BW') = 5
-- ASSERT: SELECT count(*) FROM countries WHERE name_en != 'European Union' AND id NOT IN (SELECT country_id FROM country_headline_facts) = 0
