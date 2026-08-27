-- Liechtenstein: the six headline facts, notes in four languages, and
-- the fact_history rows that record them for the first time.
--
-- THE STRUCTURAL FACT THAT DECIDES EVERY OTHER ONE. Swiss VAT law
-- governs in Liechtenstein under the treaty of 28 October 1994, but
-- through Liechtenstein's own Mehrwertsteuergesetz (LGBl 2009 Nr. 330)
-- and administered by Liechtenstein's own Steuerverwaltung -- competence
-- is allocated by seat, not turnover, so a Liechtenstein-seated business
-- never deals with the Swiss FTA for domestic VAT. Meanwhile Annex XVI
-- of the EEA Agreement DOES bind Liechtenstein on public procurement.
--
-- So the country sits across two regimes at once, and the split is
-- clean: B2G is EEA-derived and genuinely Liechtenstein's own, while
-- B2B, B2C, e-reporting and signature are Swiss substance arriving by
-- treaty. Archiving is Liechtenstein's own PGR and happens to land on
-- the same ten years as Switzerland.
--
-- B2G IS 'voluntary', AND THAT WORD IS DOING PRECISE WORK. Directive
-- 2014/55/EU was incorporated by EEA Joint Committee Decision 166/2015
-- (in force 1 January 2016, compliance date 27 November 2018) and
-- transposed in the procurement act, whose Art. 1a lists the directive
-- by name and whose Art. 7 Ziff. 49-53 carries the EN 16931 vocabulary.
-- The duty it creates is on the CONTRACTING AUTHORITY to receive and
-- process; there is no duty on a supplier to send.
--
-- That is exactly the distinction migration 645 drew for Cyprus and the
-- Czech Republic: NO MANDATE says nothing is in place and a supplier
-- sending a structured invoice has no assurance anyone can accept it;
-- VOLUNTARY says the channel exists and is guaranteed in law and using
-- it is the supplier's choice. Liechtenstein is the second kind.
--
-- THE CITATION TRAP HERE IS REAL AND WORTH NAMING. The European
-- Commission's own country page says "Liechtenstein does not have a
-- business-to-government (B2G) eInvoicing mandate", meaning no
-- SUPPLIER-side mandate -- and the same page asserts the receive
-- obligation two paragraphs later. Vendor trackers re-quote the first
-- sentence to mean there is no B2G obligation at all. Recording this as
-- 'no_mandate' would repeat that error and understate a duty that
-- genuinely exists, so the citation here is the EFTA Secretariat's
-- record of the incorporation rather than the Commission's summary.
--
-- E-REPORTING IS 'no_mandate', NOT 'active', AND THE eMWST PORTAL IS THE
-- REASON TO SAY SO EXPLICITLY. Filing VAT returns through eMWST has been
-- mandatory since January 2025. That is a filing CHANNEL obligation:
-- periodic return totals, no invoice-level or transaction-level detail.
-- A country whose returns are filed electronically is not a country that
-- reports transactions, and conflating the two would put Liechtenstein
-- in the same bucket as a clearance regime. No frequency is set, which
-- 627's invariant requires of anything not active or on-request.
--
-- ARCHIVING RESTS ON TWO DOMESTIC BASES, EITHER OF WHICH WOULD DO: PGR
-- Art. 1059 (ten years from the end of the financial year of the last
-- entries) and MWSTG Art. 57(2) read with Art. 42(6), where absolute
-- prescription of the tax claim is ten years. Twenty years applies to
-- records concerning immovable property; the schema holds one number and
-- the note carries the exception.
--
-- NOTHING HERE IS 'unknown', so no unknown_reason is set. What is not
-- known is narrower than on most countries and is recorded on the deep
-- dive rather than in a status: the exact article of the procurement act
-- that imposes the receive duty could not be read, because the
-- Commission attributes it to Art. 44a and Art. 44a is about consulting
-- trade associations, while gesetze.li truncates the Act on fetch.

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
  'voluntary', '2018-11-27', 'https://www.efta.int/eea-lex/32014l0055',
  'no_mandate', NULL, 'https://www.gesetze.li/konso/pdf/2009330000?version=24',
  'no_mandate', NULL, 'https://www.gesetze.li/konso/pdf/2009330000?version=24',
  10, 'years', 'https://www.llv.li/serviceportal2/amtsstellen/amt-fuer-justiz/handelsregister/merkblaetter/015_merkblatt_betreffend_die_fuehrung_aufbewahrung_und_archivierung_von_geschaeftsbuechern.pdf',
  'not_required', 'https://www.llv.li/serviceportal2/amtsstellen/amt-fuer-justiz/handelsregister/merkblaetter/015_merkblatt_betreffend_die_fuehrung_aufbewahrung_und_archivierung_von_geschaeftsbuechern.pdf',
  'no_mandate', NULL, NULL,
  NULL, 'https://www.llv.li/serviceportal2/amtsstellen/steuerverwaltung/newsletter/stv_newsletter_uebersicht.pdf',
  '2026-08-27', NULL
FROM countries WHERE code = 'LI';

-- ---- notes, four languages, each measured under the 150-char ceiling ----

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'en',
  'Authorities must accept EN 16931 invoices for procurement above EU thresholds since Nov 2018. Suppliers may send them; they need not.',
  'No B2B mandate and none announced. The VAT Act sets invoice contents but no format, and EU VAT law does not reach the EEA.',
  'No B2C mandate. Nothing in the VAT Act or its ordinance imposes an electronic form on a consumer invoice.',
  'Ten years under the PGR and the VAT Act, twenty for immovable property. Electronic retention is allowed if records stay unalterable.',
  'Not required. The ordinance names digital signatures as one example of assuring integrity, among others -- never as a duty.',
  'None. VAT returns go through the eMWST portal, mandatory since January 2025, but carry no invoice or transaction detail.'
FROM countries WHERE code = 'LI';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'es',
  'Desde nov. 2018 los organismos deben aceptar facturas EN 16931 en contratación sobre umbrales UE. El proveedor puede enviarlas, no debe.',
  'Sin obligación B2B ni anuncio. La Ley del IVA fija el contenido de la factura, no el formato, y el IVA de la UE no llega al EEE.',
  'Sin obligación B2C. Ni la Ley del IVA ni su reglamento imponen forma electrónica a una factura de consumo.',
  'Diez años según el PGR y la Ley del IVA, veinte para inmuebles. Se admite el archivo electrónico si los registros son inalterables.',
  'No exigida. El reglamento cita la firma digital como un ejemplo de garantizar la integridad, entre otros, nunca como deber.',
  'Ninguna. Las declaraciones de IVA pasan por el portal eMWST, obligatorio desde enero de 2025, sin detalle de facturas.'
FROM countries WHERE code = 'LI';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'de',
  'Seit Nov. 2018 müssen Auftraggeber EN-16931-Rechnungen oberhalb der EU-Schwellen annehmen. Lieferanten dürfen senden, müssen aber nicht.',
  'Keine B2B-Pflicht und keine angekündigt. Das MWSTG regelt den Rechnungsinhalt, nicht das Format; EU-Mehrwertsteuerrecht gilt im EWR nicht.',
  'Keine B2C-Pflicht. Weder MWSTG noch MWSTV schreiben für eine Verbraucherrechnung eine elektronische Form vor.',
  'Zehn Jahre nach PGR und MWSTG, zwanzig bei Grundstücken. Elektronische Aufbewahrung ist zulässig, wenn nichts unbemerkt änderbar bleibt.',
  'Nicht erforderlich. Die Verordnung nennt digitale Signaturen als ein Beispiel der Integritätssicherung, nie als Pflicht.',
  'Keine. Die MWST-Abrechnung läuft seit Januar 2025 zwingend über das eMWST-Portal, überträgt aber keine Rechnungsdaten.'
FROM countries WHERE code = 'LI';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'fr',
  'Depuis nov. 2018, les pouvoirs adjudicateurs doivent accepter les factures EN 16931 au-dessus des seuils UE. Le fournisseur peut, sans devoir.',
  'Aucune obligation B2B ni annonce. La loi TVA fixe le contenu de la facture, pas le format, et la TVA de l''UE ne s''applique pas à l''EEE.',
  'Aucune obligation B2C. Ni la loi TVA ni son ordonnance n''imposent une forme électronique à une facture de consommation.',
  'Dix ans selon le PGR et la loi TVA, vingt pour les immeubles. L''archivage électronique est admis si les documents restent inaltérables.',
  'Non exigée. L''ordonnance cite la signature numérique comme un exemple d''assurance de l''intégrité, parmi d''autres, jamais comme un devoir.',
  'Aucune. Les déclarations de TVA passent par le portail eMWST, obligatoire depuis janvier 2025, sans aucun détail de facture.'
FROM countries WHERE code = 'LI';

-- ---- fact_history: first recorded ----
--
-- Five tracked fields; e-reporting is not among them (see the CHECK on
-- fact_history.field). first_recorded takes old_value NULL and is the
-- one kind that needs no four-language note, there being no change to
-- explain.

INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2g_status', NULL, 'voluntary', '2026-08-27', 'first_recorded',
       'https://www.efta.int/eea-lex/32014l0055' FROM countries WHERE code = 'LI';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2b_status', NULL, 'no_mandate', '2026-08-27', 'first_recorded',
       'https://www.gesetze.li/konso/pdf/2009330000?version=24' FROM countries WHERE code = 'LI';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2c_status', NULL, 'no_mandate', '2026-08-27', 'first_recorded',
       'https://www.gesetze.li/konso/pdf/2009330000?version=24' FROM countries WHERE code = 'LI';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'archiving_status', NULL, 'years', '2026-08-27', 'first_recorded',
       'https://www.llv.li/serviceportal2/amtsstellen/amt-fuer-justiz/handelsregister/merkblaetter/015_merkblatt_betreffend_die_fuehrung_aufbewahrung_und_archivierung_von_geschaeftsbuechern.pdf' FROM countries WHERE code = 'LI';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'signature_status', NULL, 'not_required', '2026-08-27', 'first_recorded',
       'https://www.llv.li/serviceportal2/amtsstellen/amt-fuer-justiz/handelsregister/merkblaetter/015_merkblatt_betreffend_die_fuehrung_aufbewahrung_und_archivierung_von_geschaeftsbuechern.pdf' FROM countries WHERE code = 'LI';

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'LI') = 1
-- ASSERT: SELECT b2g_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'LI') = 'voluntary'
-- ASSERT: SELECT ereporting_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'LI') = 'no_mandate'
-- ASSERT: SELECT archiving_years FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'LI') = 10
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE country_id = (SELECT id FROM countries WHERE code = 'LI') = 4
-- ASSERT: SELECT count(*) FROM fact_history WHERE country_id = (SELECT id FROM countries WHERE code = 'LI') = 5
-- The whole point of 'voluntary' over 'no_mandate' here -- if a later
-- edit flattens it, this line says what was meant and why:
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'LI') AND b2g_status = 'no_mandate' = 0
