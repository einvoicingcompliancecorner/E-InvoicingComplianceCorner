-- Thailand: the six headline facts, notes in four languages, and the
-- fact_history rows that record them for the first time.
--
-- B2B AND B2C ARE 'voluntary', AND THIS IS THE STRONGEST CASE FOR THAT
-- WORD ON THE SITE. Migration 645's vocabulary reserves VOLUNTARY for a
-- channel that exists AND is guaranteed in law, as against NO MANDATE
-- where nothing is in place. Thailand is the cleanest instance we have:
-- Ministerial Regulation No. 384, made under the Revenue Code and in the
-- Royal Gazette, authorises electronic tax documents outright, and the
-- Director-General announcements build two working routes on top of it.
-- The channel is statutory; using it is a choice. Compare Hong Kong,
-- where the same word rests on a government portal with no instrument
-- behind it at all.
--
--   Clause 12 of Director-General Announcement No. 15 lets a registrant
--   CHOOSE electronic or paper form per transaction, and withdraw by
--   form bor.or.09. The 2023 announcements say "may choose" in terms.
--   This is not inference from an absence; it is the words of the
--   instruments.
--
-- B2G IS 'no_mandate' AND THAT IS A JUDGEMENT. Nothing in the Revenue
-- Department's material distinguishes supplying the government, and the
-- system is open to all VAT registrants on the same voluntary footing.
-- What we did NOT examine is the Comptroller General's e-GP procurement
-- platform, which could carry its own contractual expectations. The deep
-- dive says so. If e-GP turns out to oblige suppliers, this becomes
-- 'voluntary' on Canada's precedent, not 'active'.
--
-- SIGNATURE IS 'conditional', AND THE WORD IS DOING REAL WORK. The two
-- routes differ precisely here: the full XML system needs an enterprise
-- certificate under Thailand's National Root CA, held on a token or HSM,
-- while the by-email route substitutes an ETDA trusted time stamp and
-- needs no certificate at all. A single yes or no would misdescribe one
-- of the two routes whichever way it fell.
--
-- E-REPORTING IS 'voluntary', WHICH IS A FIRST HERE. Participants in the
-- full system must transmit invoice XML to the Revenue Department by the
-- 15th of the following month -- invoice-level data on a schedule, which
-- is squarely within the e-Reporting card's scope rule. But the duty
-- attaches only to those who opted in. It is neither a standing duty on
-- taxpayers generally nor an absence, and 'voluntary' is the value that
-- says so. Frequency stays NULL, as migration 627's invariant requires
-- for any non-active status; the cadence is in the note where a reader
-- will actually meet it.
--
-- ARCHIVING IS FIVE YEARS, NOT TEN. Revenue Code s.87/3 says five from
-- filing, extendable by the Director-General to more than five but not
-- exceeding seven. Thomson Reuters publishes ten. We follow the Code.
--
-- Nothing here is 'unknown', so no unknown_reason is set.

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
  'no_mandate', NULL, 'https://www.rd.go.th/fileadmin/user_upload/kormor/newlaw/dgg15.pdf',
  'voluntary', NULL, 'https://www.rd.go.th/fileadmin/user_upload/kormor/newlaw/mr384.pdf',
  'voluntary', NULL, 'https://etax.rd.go.th/etax_staticpage/app/emag/flipbook/01_Overview.pdf',
  5, 'years', 'https://www.rd.go.th/english/37747.html',
  'conditional', 'https://www.rd.go.th/fileadmin/user_upload/kormor/newlaw/dgg15.pdf',
  'voluntary', NULL, NULL,
  NULL, 'https://etax.rd.go.th/etax_staticpage/app/emag/flipbook/01_Overview.pdf',
  '2026-08-27', NULL
FROM countries WHERE code = 'TH';

-- ---- notes, four languages, each measured under the 150-char ceiling ----
-- The figures are identical across the four: 384 and 87/3 appear in every
-- language, which is what tests/headline-notes-langs.mjs compares.

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'en',
  'No mandate. Government suppliers invoice on the same voluntary footing as anyone else; no procurement rule requires an electronic invoice.',
  'Voluntary and guaranteed in law. Ministerial Regulation No. 384 authorises electronic tax documents; nothing compels their use.',
  'Voluntary. E-receipts run through the same opt-in system as invoices, with the same registration and the same certificate.',
  'Five years under Revenue Code s.87/3, extendable to seven by the Director-General. Electronic retention is expressly permitted.',
  'Conditional. The full XML system needs a certificate under the National Root CA; the e-mail route uses an ETDA time stamp instead.',
  'Voluntary. Join the full system and you must send invoice XML to the Revenue Department monthly; stay outside it and nothing is reported.'
FROM countries WHERE code = 'TH';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'es',
  'Sin obligación. Los proveedores públicos facturan en el mismo régimen voluntario que cualquiera; ninguna norma de contratación lo exige.',
  'Voluntaria y garantizada por ley. El Reglamento Ministerial n.º 384 autoriza los documentos fiscales electrónicos; nada obliga a usarlos.',
  'Voluntaria. Los recibos electrónicos usan el mismo sistema de adhesión que las facturas, con igual registro y certificado.',
  'Cinco años según el art. 87/3 del Código Fiscal, ampliables a siete por el Director General. La conservación electrónica está permitida.',
  'Condicional. El sistema XML completo exige certificado bajo la CA raíz nacional; la vía por correo usa un sello de tiempo de ETDA.',
  'Voluntaria. Si entra en el sistema completo debe enviar el XML al Departamento de Hacienda cada mes; fuera de él no se declara nada.'
FROM countries WHERE code = 'TH';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'de',
  'Keine Pflicht. Lieferanten der öffentlichen Hand fakturieren auf derselben freiwilligen Grundlage; keine Vergaberegel verlangt es.',
  'Freiwillig und gesetzlich abgesichert. Die Ministerialverordnung Nr. 384 lässt elektronische Steuerdokumente zu; niemand muss sie nutzen.',
  'Freiwillig. Elektronische Quittungen laufen über dasselbe Opt-in-System wie Rechnungen, mit gleicher Registrierung und gleichem Zertifikat.',
  'Fünf Jahre nach Art. 87/3 der Abgabenordnung, vom Generaldirektor auf sieben verlängerbar. Elektronische Aufbewahrung ist ausdrücklich zulässig.',
  'Bedingt. Das volle XML-System verlangt ein Zertifikat der nationalen Root-CA; der E-Mail-Weg nutzt stattdessen einen ETDA-Zeitstempel.',
  'Freiwillig. Wer dem vollen System beitritt, muss die Rechnungs-XML monatlich an die Steuerbehörde senden; ausserhalb wird nichts gemeldet.'
FROM countries WHERE code = 'TH';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'fr',
  'Aucune obligation. Les fournisseurs publics facturent sur la même base volontaire que les autres ; aucune règle de marché ne l''impose.',
  'Volontaire et garantie par la loi. Le règlement ministériel n° 384 autorise les documents fiscaux électroniques ; rien n''en impose l''usage.',
  'Volontaire. Les reçus électroniques passent par le même système d''adhésion que les factures, même inscription et même certificat.',
  'Cinq ans selon l''art. 87/3 du Code des impôts, portés à sept par le Directeur général. La conservation électronique est expressément admise.',
  'Conditionnelle. Le système XML complet exige un certificat de l''AC racine nationale ; la voie par courriel utilise un horodatage ETDA.',
  'Volontaire. Entrer dans le système complet oblige à transmettre le XML au fisc chaque mois ; en dehors, rien n''est déclaré.'
FROM countries WHERE code = 'TH';

-- ---- fact_history: first recorded ----
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2g_status', NULL, 'no_mandate', '2026-08-27', 'first_recorded',
       'https://www.rd.go.th/fileadmin/user_upload/kormor/newlaw/dgg15.pdf' FROM countries WHERE code = 'TH';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2b_status', NULL, 'voluntary', '2026-08-27', 'first_recorded',
       'https://www.rd.go.th/fileadmin/user_upload/kormor/newlaw/mr384.pdf' FROM countries WHERE code = 'TH';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2c_status', NULL, 'voluntary', '2026-08-27', 'first_recorded',
       'https://etax.rd.go.th/etax_staticpage/app/emag/flipbook/01_Overview.pdf' FROM countries WHERE code = 'TH';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'archiving_status', NULL, 'years', '2026-08-27', 'first_recorded',
       'https://www.rd.go.th/english/37747.html' FROM countries WHERE code = 'TH';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'signature_status', NULL, 'conditional', '2026-08-27', 'first_recorded',
       'https://www.rd.go.th/fileadmin/user_upload/kormor/newlaw/dgg15.pdf' FROM countries WHERE code = 'TH';

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'TH') = 1
-- ASSERT: SELECT b2b_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'TH') = 'voluntary'
-- ASSERT: SELECT b2g_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'TH') = 'no_mandate'
-- ASSERT: SELECT archiving_years FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'TH') = 5
-- ASSERT: SELECT signature_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'TH') = 'conditional'
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE country_id = (SELECT id FROM countries WHERE code = 'TH') = 4
-- ASSERT: SELECT count(*) FROM fact_history WHERE country_id = (SELECT id FROM countries WHERE code = 'TH') = 5
--
-- ARCHIVING MUST NOT DRIFT TO TEN. A widely-published vendor figure says
-- ten years; Revenue Code s.87/3 says five, extendable to seven. Pin it.
-- ASSERT: SELECT count(*) FROM country_headline_facts f JOIN countries c ON c.id = f.country_id WHERE c.code = 'TH' AND f.archiving_years > 7 = 0
--
-- AND B2B MUST NOT DRIFT TO active. Three vendor pages this month have
-- asserted mandates that do not exist, one of them Thailand's. The
-- instruments say "may choose"; the database must keep saying so.
-- ASSERT: SELECT count(*) FROM country_headline_facts f JOIN countries c ON c.id = f.country_id WHERE c.code = 'TH' AND f.b2b_status = 'voluntary' = 1
