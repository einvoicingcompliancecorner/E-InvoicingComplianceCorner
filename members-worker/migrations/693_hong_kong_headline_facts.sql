-- Hong Kong: the six headline facts, notes in four languages, and the
-- fact_history rows that record them for the first time.
--
-- THIS IS THE EMPTIEST ROW ON THE BOARD AND EVERY WORD OF IT IS A
-- DECISION. Five of the six tiles say some form of "no". The risk is not
-- that a reader over-builds; it is that a reader reads five noes, closes
-- the page, and misses the one obligation that is real.
--
-- WHY THERE IS NOTHING TO MANDATE. Hong Kong has no VAT, no GST and no
-- sales tax. The Department of Justice says so in terms. A goods and
-- services tax was consulted on in 2006 and withdrawn that December.
-- Every e-invoicing mandate this site tracks exists to protect a
-- consumption tax; Hong Kong has none, so there is no tax invoice, no
-- clearance, no reporting, and no statute prescribing what an invoice
-- must contain. It is the first jurisdiction here with no consumption
-- tax at all.
--
-- B2G IS 'voluntary', AND CANADA IS THE PRECEDENT, NOT CYPRUS. The
-- Government's e-Procurement Programme does accept electronic invoices,
-- in UBL 2.0 over ebXML, for goods and non-construction services up to
-- HK$1.35m and consultancies up to HK$3m. Two separate primary pages say
-- using it is optional: the FAQ ("the e-Procurement Programme allows
-- both manual and electronic procurement means") and clause 2.6 of the
-- participation terms ("registration with the e-Procurement System is
-- not a pre-requisite in order to receive invitation"). No regulation or
-- circular imposes it -- the Stores and Procurement Regulations and the
-- FSTB Guide to Procurement do not mention the programme at all.
--
--   That is migration 621's Canada shape exactly: a channel most
--   suppliers use is not a duty, so ACTIVE became VOLUNTARY. Cyprus
--   (migration 645) arrived at the same word from the other direction,
--   a duty on the receiver. Hong Kong arrives from Canada's direction.
--   NO MANDATE would be wrong: the channel demonstrably exists, is
--   government-operated, and has a published technical specification.
--
--   AND WE ARE PUBLICLY CONTRADICTING A VENDOR HERE. Thomson Reuters'
--   Hong Kong page states "B2G: e-Procurement System mandatory". It is
--   not, on two primary pages. Same publisher, same failure mode as the
--   March 2026 Botswana date, ten days apart.
--
-- E-REPORTING IS 'no_mandate', AND THIS IS THE HARDEST CALL IN THE FILE.
-- Hong Kong has a live mandatory electronic filing obligation: phase one
-- of mandatory iXBRL profits tax return filing commenced 1 April 2026
-- under IRO s.51AAB and Schedule 65, for entities of MNE groups in scope
-- of the global minimum tax. It is real, it is dated, and it is on the
-- arrivals board.
--
--   It is nevertheless not e-reporting on this site's own rule. The
--   e-Reporting card's scope (claude/ereporting-card.md, 23 August) is a
--   standing duty to transmit TRANSACTION OR LEDGER data, and the test
--   settled mid-build is CONTENT, NOT ENVELOPE: invoice-level or
--   per-counterparty data counts wherever it travels, totals do not.
--   What Hong Kong transmits is tagged financial statements and a tax
--   computation. Recording it ACTIVE would put Hong Kong beside Poland's
--   JPK_V7M, which is exactly the flattening that rule exists to stop.
--
--   The note therefore names the obligation while recording the status
--   as none, which is the same move Switzerland's note makes about
--   compulsory online VAT filing and Liechtenstein's about eMWST. Three
--   countries in one week needed that sentence, which suggests the box
--   is regularly misread and the notes are earning their space.
--
-- ARCHIVING IS SEVEN YEARS, AND THE IRD CONTRADICTS ITSELF ABOUT WHAT
-- MAY BE THROWN AWAY. Section 51C requires sufficient records of income
-- and expenditure, kept seven years, maximum fine HK$100,000. A 1995
-- IRD pamphlet says you must still keep source documents even if you
-- keep books on computer; a May 2024 IRD pamphlet permits imaged records
-- to replace originals subject to integrity and audit-trail conditions.
-- The IRD has not reconciled them. The note follows the 2024 guidance,
-- being later and more specific, and the deep dive prints both with
-- their dates rather than choosing silently.
--
-- SIGNATURE IS 'not_required'. The Electronic Transactions Ordinance
-- (Cap. 553) gives electronic records the same legal status as paper.
-- Only dealings with government entities require a digital signature
-- supported by a recognised certificate. Nothing requires an invoice to
-- be signed, because nothing requires an invoice to be anything.
--
-- Nothing here is 'unknown', so no unknown_reason is set. What could not
-- be verified is on the deep dive: elegislation.gov.hk refuses automated
-- access, so neither the Inland Revenue Ordinance nor the Electronic
-- Transactions Ordinance could be read in its enacted text, and every
-- section number rests on official paraphrase.

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
  'voluntary', NULL, 'https://www.gov.hk/en/theme/eprocurement/eppp/overview.htm',
  'no_mandate', NULL, 'https://www.legalhub.gov.hk/details.php?a=5&v=our-tax-system',
  'no_mandate', NULL, 'https://www.legalhub.gov.hk/details.php?a=5&v=our-tax-system',
  7, 'years', 'https://www.ird.gov.hk/eng/tax/bus_rke.htm',
  'not_required', 'https://www.digitalpolicy.gov.hk/en/our_work/digital_infrastructure/legal_framework/regulation/eto/',
  'no_mandate', NULL, NULL,
  NULL, 'https://www.ird.gov.hk/eng/tax/bus_ixbrl.htm',
  '2026-08-27', NULL
FROM countries WHERE code = 'HK';

-- ---- notes, four languages, each measured under the 150-char ceiling ----
--
-- The figures are deliberately identical across the four: 2.0, 1.35,
-- 51 and 2026 appear in every language. tests/headline-notes-langs.mjs
-- compares digit runs between languages, and the HK$100,000 fine was cut
-- from the English archiving note rather than padded into the other
-- three -- it is on the deep dive's penalties card, where it belongs.

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'en',
  'The e-Procurement Programme accepts UBL 2.0 invoices for contracts up to HK$1.35m, but using it is optional — no rule requires it.',
  'No mandate, and none proposed. With no VAT or GST there is no tax invoice in Hong Kong law, so nothing prescribes an invoice''s form.',
  'No mandate. Invoices and receipts to consumers are commercial documents only; no authority sees them and no format is prescribed.',
  'Seven years for business records under Inland Revenue Ordinance s.51C. Electronic records and scanned images of originals are accepted.',
  'Not required. The Electronic Transactions Ordinance validates e-records generally; only dealings with government need a recognised certificate.',
  'None. In-scope MNE groups must e-file profits tax returns in iXBRL since April 2026, but those carry accounts, not invoice or transaction data.'
FROM countries WHERE code = 'HK';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'es',
  'El Programa de Contratación Electrónica acepta facturas UBL 2.0 en contratos de hasta 1,35 M HKD, pero su uso es opcional: nada lo exige.',
  'Sin obligación ni propuesta. Al no haber IVA ni impuesto sobre ventas, no existe factura fiscal ni norma que fije la forma de una factura.',
  'Sin obligación. Las facturas y recibos al consumidor son documentos mercantiles; ninguna autoridad los ve y no se prescribe formato alguno.',
  'Siete años para los libros de empresa según el art. 51C de la Inland Revenue Ordinance. Se admiten registros electrónicos e imágenes.',
  'No exigida. La Electronic Transactions Ordinance valida los registros electrónicos; solo el trato con la Administración pide certificado.',
  'Ninguna. Los grupos multinacionales en ámbito declaran el impuesto de sociedades en iXBRL desde abril de 2026, pero envían cuentas, no facturas.'
FROM countries WHERE code = 'HK';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'de',
  'Das e-Procurement-Programm nimmt UBL-2.0-Rechnungen bis 1,35 Mio. HKD an, doch die Nutzung ist freiwillig — keine Vorschrift verlangt sie.',
  'Keine Pflicht und keine geplant. Ohne Mehrwert- oder Umsatzsteuer gibt es keine Steuerrechnung und keine Vorgabe zur Form einer Rechnung.',
  'Keine Pflicht. Rechnungen und Quittungen an Verbraucher sind reine Handelsdokumente; keine Behörde sieht sie, kein Format ist vorgeschrieben.',
  'Sieben Jahre für Geschäftsunterlagen nach s.51C der Inland Revenue Ordinance. Elektronische und eingescannte Unterlagen sind zulässig.',
  'Nicht erforderlich. Die Electronic Transactions Ordinance anerkennt elektronische Aufzeichnungen; nur Behördenverkehr braucht ein Zertifikat.',
  'Keine. Erfasste Konzerne reichen die Gewinnsteuererklärung seit April 2026 in iXBRL ein, doch darin stehen Abschlüsse, keine Rechnungsdaten.'
FROM countries WHERE code = 'HK';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'fr',
  'Le programme e-Procurement accepte les factures UBL 2.0 pour les marchés jusqu''à 1,35 M HKD, mais son usage est facultatif : rien ne l''impose.',
  'Aucune obligation ni projet. Faute de TVA ou de taxe sur les ventes, il n''existe pas de facture fiscale ni de règle sur la forme d''une facture.',
  'Aucune obligation. Les factures et reçus aux consommateurs sont de simples documents commerciaux ; aucune autorité ne les voit, aucun format.',
  'Sept ans pour les livres d''entreprise selon l''art. 51C de l''Inland Revenue Ordinance. Les documents électroniques et numérisés sont admis.',
  'Non exigée. L''Electronic Transactions Ordinance valide les documents électroniques ; seuls les échanges avec l''État exigent un certificat.',
  'Aucune. Les groupes visés déclarent l''impôt sur les bénéfices en iXBRL depuis avril 2026, mais y figurent des comptes, non des données de facture.'
FROM countries WHERE code = 'HK';

-- ---- fact_history: first recorded ----

INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2g_status', NULL, 'voluntary', '2026-08-27', 'first_recorded',
       'https://www.gov.hk/en/theme/eprocurement/eppp/overview.htm' FROM countries WHERE code = 'HK';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2b_status', NULL, 'no_mandate', '2026-08-27', 'first_recorded',
       'https://www.legalhub.gov.hk/details.php?a=5&v=our-tax-system' FROM countries WHERE code = 'HK';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2c_status', NULL, 'no_mandate', '2026-08-27', 'first_recorded',
       'https://www.legalhub.gov.hk/details.php?a=5&v=our-tax-system' FROM countries WHERE code = 'HK';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'archiving_status', NULL, 'years', '2026-08-27', 'first_recorded',
       'https://www.ird.gov.hk/eng/tax/bus_rke.htm' FROM countries WHERE code = 'HK';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'signature_status', NULL, 'not_required', '2026-08-27', 'first_recorded',
       'https://www.digitalpolicy.gov.hk/en/our_work/digital_infrastructure/legal_framework/regulation/eto/' FROM countries WHERE code = 'HK';

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'HK') = 1
-- ASSERT: SELECT b2g_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'HK') = 'voluntary'
-- ASSERT: SELECT b2b_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'HK') = 'no_mandate'
-- ASSERT: SELECT b2c_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'HK') = 'no_mandate'
-- ASSERT: SELECT archiving_years FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'HK') = 7
-- ASSERT: SELECT signature_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'HK') = 'not_required'
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE country_id = (SELECT id FROM countries WHERE code = 'HK') = 4
-- ASSERT: SELECT count(*) FROM fact_history WHERE country_id = (SELECT id FROM countries WHERE code = 'HK') = 5
--
-- B2G MUST NOT DRIFT TO no_mandate OR TO active. Both are wrong in a way
-- that reads as plausible: no_mandate erases a working government
-- channel, and active is what Thomson Reuters publishes today. Pin it.
-- ASSERT: SELECT count(*) FROM country_headline_facts f JOIN countries c ON c.id = f.country_id WHERE c.code = 'HK' AND f.b2g_status = 'voluntary' = 1
--
-- E-REPORTING MUST NOT DRIFT TO active. A future reader who finds the
-- iXBRL mandate and "corrects" this box would silently put Hong Kong in
-- the same category as invoice-level reporting regimes. The board row
-- and the fact must therefore disagree in a specific, intended way: a
-- live milestone exists, and the e-reporting status is none.
-- ASSERT: SELECT count(*) FROM country_headline_facts f JOIN countries c ON c.id = f.country_id WHERE c.code = 'HK' AND f.ereporting_status = 'no_mandate' = 1
-- ASSERT: SELECT count(*) FROM milestones WHERE id = 'hk-ixbrl-efiling-phase1' AND obligation_status = 'live' = 1
