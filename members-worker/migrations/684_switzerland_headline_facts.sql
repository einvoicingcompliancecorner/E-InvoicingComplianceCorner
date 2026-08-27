-- Switzerland: the six headline facts, notes in four languages, and the
-- fact_history rows that record them for the first time.
--
-- READ THIS AGAINST LIECHTENSTEIN, BECAUSE THE PAIR IS THE POINT. The
-- two countries share a VAT statute in substance -- Swiss VAT law governs
-- in Liechtenstein under the treaty of 28 October 1994 -- and their
-- e-invoicing duties run in OPPOSITE DIRECTIONS from entirely different
-- sources:
--
--   Liechtenstein  EEA-derived, on the AUTHORITY to receive, 2018,
--                  transposed in procurement law, status 'voluntary'
--   Switzerland    contractual, on the SUPPLIER to issue, 2016, from
--                  procurement standard terms, status 'active'
--
-- Switzerland's rule sits OUTSIDE the MWSTG entirely. It is a
-- procurement and finance rule, not a tax rule, which is why nothing in
-- the VAT Act mentions it. Reasoning from either country to the other
-- gets it backwards in every dimension, and that is worth a card.
--
-- B2G IS 'active' AND THE NOTE HAS TO CARRY THREE QUALIFIERS, because
-- the bare word will otherwise be read as Italy or France.
--
--   1. IT IS SATISFIED BY A PDF SENT BY E-MAIL. The Federal Finance
--      Administration confirmed this publicly in June 2018 and EY's
--      tracker still recorded it in June 2026. The duty is to invoice
--      WITHOUT PAPER, not to invoice in a STRUCTURED FORMAT. Anyone who
--      reads "mandatory since 2016" and provisions an EN 16931 or Peppol
--      pipeline has over-built, and this is the single most consequential
--      fact about the country.
--   2. THE THRESHOLD IS CHF 5,000 EXCLUDING VAT. Only the procurement
--      standard terms say "excluding"; every official prose page omits
--      it.
--   3. IT REACHES THE CENTRAL FEDERAL ADMINISTRATION ONLY. Cantons,
--      communes and the ETH domain are outside it. Zurich declared
--      digital delivery its standard from 2027, receive-side and
--      exhortatory, which is the current cantonal frontier and not a
--      duty.
--
-- THERE IS NO SR-NUMBERED ORDINANCE. The obligation rests on a Federal
-- Council decision of 8 October 2014 executed through clause 9.4 of the
-- Confederation's procurement standard terms. A reader looking for the
-- law will not find one, and the page says so rather than leaving them
-- hunting.
--
-- E-REPORTING IS 'no_mandate', AND ELECTRONIC FILING IS WHY THAT NEEDS
-- SAYING. Online VAT filing has been compulsory since 1 January 2025
-- under art. 65a MWSTG. Aggregate periodic returns travel; no invoice or
-- transaction data does. This is the same distinction Liechtenstein's
-- eMWST portal required, and filing a country under digital reporting
-- because its returns moved online is the error both notes exist to
-- prevent.
--
-- ARCHIVING IS TEN YEARS AND TWENTY-SIX, NOT TWENTY. Ten under Code of
-- Obligations art. 958f; twenty-six for records concerning immovable
-- property, per the ESTV's own current guidance -- the ten-year absolute
-- limitation running past the twenty-year adjustment period. Twenty is
-- the number a page guesses.
--
-- SIGNATURE IS 'not_required', AND "ABOLISHED IN 2010" IS TOO SHORT A
-- STORY. The 2010 VAT Act removed the necessity by introducing free
-- evaluation of evidence, but the ElDI-V ordinance survived as an
-- optional safe harbour; the ESTV confirmed the practice change for
-- 2016/17 and repeal is reported at 1 January 2018 on professional
-- sources only. What governs now is art. 957a OR, the GeBueV, art. 122
-- MWSTV and art. 81(3) MWSTG.
--
-- Nothing here is 'unknown', so no unknown_reason is set. What could not
-- be verified is on the deep dive: fedlex.admin.ch is JavaScript-only,
-- so no Swiss statute text could be read directly and every article
-- number rests on official guidance rather than the enacted text.

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
  'active', '2016-01-01', 'https://www.efv.admin.ch/de/e-rechnungen-zustellen',
  'no_mandate', NULL, 'https://www.efv.admin.ch/de/e-rechnungen-empfangen',
  'no_mandate', NULL, 'https://www.ebill.ch/en/home/about/about-us.html',
  10, 'years', 'https://www.kmu.admin.ch/kmu/en/home/concrete-know-how/finances/accounting-and-auditing/electronic-bookkeeping.html',
  'not_required', 'https://www.estv.admin.ch/de/elektronische-signaturen',
  'no_mandate', NULL, NULL,
  NULL, 'https://www.estv.admin.ch/de/mwst-online-abrechnen',
  '2026-08-27', NULL
FROM countries WHERE code = 'CH';

-- ---- notes, four languages, each measured under the 150-char ceiling ----

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'en',
  'Central federal administration suppliers must invoice electronically above CHF 5,000 excl. VAT. A PDF by e-mail counts; cantons are outside it.',
  'No B2B mandate and none announced. Business e-invoicing is voluntary and market-led, through swissDIGIN and commercial providers rather than law.',
  'No B2C mandate. eBill is a bank-operated network run by SIX, widely used and entirely voluntary — not a legal requirement and not EN 16931.',
  'Ten years under Code of Obligations art. 958f, and twenty-six for records concerning immovable property. Electronic media are permitted.',
  'Not required. The former ElDI-V signature regime ended; authenticity now rests on ordinary bookkeeping controls and free evaluation of evidence.',
  'None. VAT returns must be filed online since January 2025, but only periodic totals reach the administration — no invoice or transaction data.'
FROM countries WHERE code = 'CH';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'es',
  'Los proveedores de la administración federal central deben facturar electrónicamente por encima de 5.000 CHF sin IVA. Un PDF por correo vale.',
  'Sin obligación B2B ni anuncio. La facturación electrónica entre empresas es voluntaria y de mercado, vía swissDIGIN y proveedores comerciales.',
  'Sin obligación B2C. eBill es una red bancaria operada por SIX, muy usada y del todo voluntaria: ni requisito legal ni EN 16931.',
  'Diez años según el art. 958f del Código de Obligaciones, y veintiséis para documentos sobre inmuebles. Se admiten soportes electrónicos.',
  'No exigida. El antiguo régimen de firma ElDI-V terminó; la autenticidad descansa en los controles contables y la libre valoración de la prueba.',
  'Ninguna. El IVA se declara en línea obligatoriamente desde enero de 2025, pero solo llegan totales periódicos: ningún dato de factura.'
FROM countries WHERE code = 'CH';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'de',
  'Lieferanten der zentralen Bundesverwaltung müssen über 5''000 CHF exkl. MWST elektronisch fakturieren. Ein PDF per E-Mail genügt.',
  'Keine B2B-Pflicht und keine angekündigt. Die Rechnungsstellung unter Unternehmen ist freiwillig und marktgetrieben, über swissDIGIN und Anbieter.',
  'Keine B2C-Pflicht. eBill ist ein von SIX betriebenes Banknetz, weit verbreitet und völlig freiwillig — keine Rechtspflicht und kein EN 16931.',
  'Zehn Jahre nach Art. 958f OR, sechsundzwanzig für Unterlagen zu Grundstücken. Elektronische Datenträger sind zulässig.',
  'Nicht erforderlich. Das frühere ElDI-V-Signaturregime endete; die Echtheit stützt sich auf Buchführungskontrollen und freie Beweiswürdigung.',
  'Keine. Die MWST ist seit Januar 2025 zwingend online abzurechnen, doch nur periodische Summen erreichen die Verwaltung — keine Rechnungsdaten.'
FROM countries WHERE code = 'CH';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'fr',
  'Les fournisseurs de l''administration fédérale centrale doivent facturer par voie électronique au-delà de 5 000 CHF hors TVA. Un PDF suffit.',
  'Aucune obligation B2B ni annonce. La facturation entre entreprises est volontaire et portée par le marché, via swissDIGIN et des prestataires.',
  'Aucune obligation B2C. eBill est un réseau bancaire exploité par SIX, très utilisé et entièrement volontaire : ni obligation légale ni EN 16931.',
  'Dix ans selon l''art. 958f du Code des obligations, et vingt-six pour les documents relatifs aux immeubles. Les supports électroniques sont admis.',
  'Non exigée. L''ancien régime de signature ElDI-V a pris fin ; l''authenticité repose sur les contrôles comptables et la libre appréciation des preuves.',
  'Aucune. La TVA se déclare obligatoirement en ligne depuis janvier 2025, mais seuls des totaux périodiques parviennent à l''administration.'
FROM countries WHERE code = 'CH';

-- ---- fact_history: first recorded ----

INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2g_status', NULL, 'active', '2026-08-27', 'first_recorded',
       'https://www.efv.admin.ch/de/e-rechnungen-zustellen' FROM countries WHERE code = 'CH';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2b_status', NULL, 'no_mandate', '2026-08-27', 'first_recorded',
       'https://www.efv.admin.ch/de/e-rechnungen-empfangen' FROM countries WHERE code = 'CH';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2c_status', NULL, 'no_mandate', '2026-08-27', 'first_recorded',
       'https://www.ebill.ch/en/home/about/about-us.html' FROM countries WHERE code = 'CH';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'archiving_status', NULL, 'years', '2026-08-27', 'first_recorded',
       'https://www.kmu.admin.ch/kmu/en/home/concrete-know-how/finances/accounting-and-auditing/electronic-bookkeeping.html' FROM countries WHERE code = 'CH';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'signature_status', NULL, 'not_required', '2026-08-27', 'first_recorded',
       'https://www.estv.admin.ch/de/elektronische-signaturen' FROM countries WHERE code = 'CH';

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'CH') = 1
-- ASSERT: SELECT b2g_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'CH') = 'active'
-- ASSERT: SELECT b2b_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'CH') = 'no_mandate'
-- ASSERT: SELECT ereporting_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'CH') = 'no_mandate'
-- ASSERT: SELECT archiving_years FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'CH') = 10
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE country_id = (SELECT id FROM countries WHERE code = 'CH') = 4
-- ASSERT: SELECT count(*) FROM fact_history WHERE country_id = (SELECT id FROM countries WHERE code = 'CH') = 5
-- Switzerland and Liechtenstein run in opposite directions, and the whole
-- pairing collapses if either side is flattened. Pin both ends:
-- ASSERT: SELECT count(*) FROM country_headline_facts f JOIN countries c ON c.id = f.country_id WHERE c.code = 'CH' AND f.b2g_status = 'active' = 1
-- ASSERT: SELECT count(*) FROM country_headline_facts f JOIN countries c ON c.id = f.country_id WHERE c.code = 'LI' AND f.b2g_status = 'voluntary' = 1
