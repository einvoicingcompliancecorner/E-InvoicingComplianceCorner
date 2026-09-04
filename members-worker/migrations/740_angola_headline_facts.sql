-- Angola: the six headline facts, notes in four languages, and the
-- fact_history rows that record them for the first time.
--
-- ALL THREE SEGMENTS ARE 'active' FROM 1 JANUARY 2026, and the date is
-- the same for all three because the obligation attaches to the VAT
-- regime rather than to the counterparty. Article 16 of Decreto
-- Presidencial 71/25 catches every taxpayer in the General and Simplified
-- regimes; nothing in the instrument distinguishes selling to a business,
-- a consumer or the State. What the first phase narrows is WHO is caught
-- yet -- large taxpayers, State suppliers, and invoices of 25 million
-- kwanzas or more -- and that narrowing is in the notes, where the
-- Netherlands taught us it has to be. A status is not a summary.
--
-- E-REPORTING IS 'active' AND 'annual', AND THE FREQUENCY IS THE
-- INTERESTING PART. Two precedents on this site pull opposite ways for a
-- clearance country: Ghana calls the invoicing system its reporting
-- channel and records real_time; Egypt records no_mandate on the reasoning
-- that clearance is the invoice mandate and not a separate report.
--
-- Angola resolves that cleanly because it has BOTH, and one of them has
-- just been switched off. Real-time transmission under Article 17(2) is
-- the invoice mandate and is already counted as such in the three
-- segments above -- recording it again here would be Egypt's point, and
-- would double-count one duty across four tiles. What survives as genuine
-- periodic reporting is Article 24's annual pair: the inventory file by
-- 15 February and the SAF-T accounting file for the prior year by
-- 10 April. So: active, annual, and the note names both deadlines.
--
-- AND THE INVOICING SAF-T IS GONE. Angola ran real-time e-invoicing and a
-- periodic invoicing SAF-T side by side, reporting the same transactions
-- twice, until an AGT comunicado of 20 March 2026 exempted e-invoicing
-- taxpayers from the invoicing file. A country retiring one reporting
-- channel because another superseded it is rare enough to be worth the
-- note it gets. Non-e-invoicing taxpayers still file it.
--
-- SIGNATURE IS 'conditional', ON GHANA'S PRECEDENT AND FOR GHANA'S
-- REASON. Article 19(2) guarantees authenticity, integrity and
-- non-repudiation "através da aposição de um código digital definido pela
-- Administração Geral Tributária" -- a code the certified software
-- applies, not a certificate the taxpayer holds. Ghana records exactly
-- that shape as conditional: no taxpayer certificate, but every invoice
-- carries a fiscal signature applied before issue. 'not_required' would
-- tell a reader nothing signs the document, which is false; 'required'
-- would send them shopping for a certificate they do not need.
--
-- ARCHIVING IS FIVE YEARS AND THE DECREE DOES NOT SAY SO. Article 26(1)
-- defers to the General Tax Code, and it is Article 62(7) of that Code
-- that sets five years for documents and records of operations. Cited to
-- the Code, because the decree cannot support the number.
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
  'active', '2026-01-01', 'https://www.ey.com/pt_ao/technical/tax-alerts/facturacao-electronica-a-partir-de-1-de-janeiro-de-2026',
  'active', '2026-01-01', 'https://www.ey.com/pt_ao/technical/tax-alerts/facturacao-electronica-a-partir-de-1-de-janeiro-de-2026',
  'active', '2026-01-01', 'https://angolex.com/paginas/decreto-presidencial/regime-juridico-das-facturas-71a-25a.html',
  5, 'years', 'https://angolex.com/paginas/codigos/codigo-geral-tributario.html',
  'conditional', 'https://angolex.com/paginas/decreto-presidencial/regime-juridico-das-facturas-71a-25a.html',
  'active', 'annual', 'SAF-T (AO) accounting and inventory files',
  '2026-01-01', 'https://angolex.com/paginas/decreto-presidencial/regime-juridico-das-facturas-71a-25a.html',
  '2026-09-04', NULL
FROM countries WHERE code = 'AO';

-- ---- notes, four languages, each measured under the 150-char ceiling ----
-- The digit-runs are identical across the four -- 2026, 25, 2027, 62, 7,
-- 19, 2, 15, 10 -- which is what tests/headline-notes-langs.mjs compares.

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'en',
  'Active since January 2026. Suppliers to the State were named in the first phase alongside large taxpayers, whatever their VAT regime.',
  'Active since January 2026 for large taxpayers and invoices of 25 million kwanzas or more. Remaining taxpayers are expected to follow in 2027.',
  'Active. Consumer sales are in scope. Article 5 excludes vending machines, transit tickets and licensed itinerant traders, who issue sales slips.',
  'Five years for documents and records, under article 62 of the General Tax Code. The decree defers to the Code rather than setting a period itself.',
  'No taxpayer certificate. Article 19 has the AGT-certified software apply a digital code that carries authenticity, integrity and non-repudiation.',
  'The invoicing SAF-T was dropped for e-invoicing filers in 2026. The inventory file by 15 February and the accounting file by 10 April remain.'
FROM countries WHERE code = 'AO';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'es',
  'Vigente desde enero de 2026. Los proveedores del Estado entraron en la primera fase junto a los grandes contribuyentes, sea cual sea su régimen.',
  'Vigente desde enero de 2026 para grandes contribuyentes y facturas de 25 millones de kwanzas o más. Se espera que el resto entre en 2027.',
  'Vigente. Las ventas al consumidor entran. El artículo 5 excluye máquinas expendedoras, títulos de transporte y vendedores ambulantes autorizados.',
  'Cinco años para documentos y registros, según el artículo 62 del Código Geral Tributário. El decreto remite al Código en vez de fijar un plazo.',
  'Sin certificado del contribuyente. El artículo 19 hace que el software certificado por la AGT aplique un código digital de autenticidad e integridad.',
  'El SAF-T de facturación decayó para quienes facturan electrónicamente en 2026. Siguen el fichero de existencias (15 feb) y el contable (10 abr).'
FROM countries WHERE code = 'AO';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'de',
  'Aktiv seit Januar 2026. Lieferanten des Staates gehörten zur ersten Stufe, neben den Grossunternehmen und unabhängig vom Umsatzsteuerregime.',
  'Aktiv seit Januar 2026 für Grossunternehmen und Rechnungen ab 25 Millionen Kwanza. Die übrigen Steuerpflichtigen folgen voraussichtlich 2027.',
  'Aktiv. Verkäufe an Verbraucher fallen darunter. Artikel 5 nimmt Automaten, Fahrscheine und zugelassene Wandergewerbetreibende aus.',
  'Fünf Jahre für Belege und Aufzeichnungen nach Artikel 62 der Abgabenordnung. Das Dekret verweist auf die Abgabenordnung statt selbst zu regeln.',
  'Kein Zertifikat des Steuerpflichtigen. Nach Artikel 19 setzt die AGT-zertifizierte Software einen digitalen Code für Echtheit und Unversehrtheit.',
  'Die Fakturierungs-SAF-T entfiel 2026 für E-Rechnungssteller. Die Bestandsdatei zum 15. Februar und die Buchhaltungsdatei zum 10. April bleiben.'
FROM countries WHERE code = 'AO';

INSERT OR IGNORE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note, ereporting_note)
SELECT id, 'fr',
  'En vigueur depuis janvier 2026. Les fournisseurs de l''État figuraient dans la première phase avec les grandes entreprises, quel que soit leur régime.',
  'En vigueur depuis janvier 2026 pour les grandes entreprises et les factures d''au moins 25 millions de kwanzas. Les autres suivraient en 2027.',
  'En vigueur. Les ventes aux particuliers sont visées. L''article 5 exclut distributeurs automatiques, titres de transport et marchands ambulants agréés.',
  'Cinq ans pour les documents et registres, selon l''article 62 du Code général des impôts. Le décret renvoie au Code au lieu de fixer un délai.',
  'Aucun certificat du contribuable. L''article 19 fait apposer par le logiciel agréé un code numérique portant authenticité et intégrité.',
  'Le SAF-T de facturation a disparu en 2026 pour les émetteurs électroniques. Restent le fichier de stocks au 15 février et le comptable au 10 avril.'
FROM countries WHERE code = 'AO';

-- ---- fact_history: first recorded ----
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2g_status', NULL, 'active', '2026-09-04', 'first_recorded',
       'https://www.ey.com/pt_ao/technical/tax-alerts/facturacao-electronica-a-partir-de-1-de-janeiro-de-2026' FROM countries WHERE code = 'AO';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2b_status', NULL, 'active', '2026-09-04', 'first_recorded',
       'https://www.ey.com/pt_ao/technical/tax-alerts/facturacao-electronica-a-partir-de-1-de-janeiro-de-2026' FROM countries WHERE code = 'AO';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'b2c_status', NULL, 'active', '2026-09-04', 'first_recorded',
       'https://angolex.com/paginas/decreto-presidencial/regime-juridico-das-facturas-71a-25a.html' FROM countries WHERE code = 'AO';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'archiving_status', NULL, 'years', '2026-09-04', 'first_recorded',
       'https://angolex.com/paginas/codigos/codigo-geral-tributario.html' FROM countries WHERE code = 'AO';
INSERT OR IGNORE INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
SELECT id, 'signature_status', NULL, 'conditional', '2026-09-04', 'first_recorded',
       'https://angolex.com/paginas/decreto-presidencial/regime-juridico-das-facturas-71a-25a.html' FROM countries WHERE code = 'AO';

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'AO') = 1
-- ASSERT: SELECT b2b_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'AO') = 'active'
-- ASSERT: SELECT b2g_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'AO') = 'active'
-- ASSERT: SELECT b2c_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'AO') = 'active'
-- ASSERT: SELECT archiving_years FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'AO') = 5
-- ASSERT: SELECT signature_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'AO') = 'conditional'
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE country_id = (SELECT id FROM countries WHERE code = 'AO') = 4
-- ASSERT: SELECT count(*) FROM fact_history WHERE country_id = (SELECT id FROM countries WHERE code = 'AO') = 5
--
-- THE E-REPORTING PAIR MUST STAY A PAIR. 'active' with no frequency is
-- the state 627's invariant refuses, and the value that would be reached
-- for by anyone who later decided the real-time invoice feed belongs in
-- this tile after all. It does not -- see the header. If that argument is
-- ever reopened, this assertion is where it surfaces.
-- ASSERT: SELECT ereporting_frequency FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'AO') = 'annual'
--
-- ARCHIVING MUST NOT DRIFT TO THE DECREE. The decree sets no period at
-- all; the number belongs to the General Tax Code, and a later edit that
-- "corrects" the source to the decree would be citing a document that
-- does not contain the fact.
-- ASSERT: SELECT archiving_source FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE code = 'AO') = 'https://angolex.com/paginas/codigos/codigo-geral-tributario.html'
