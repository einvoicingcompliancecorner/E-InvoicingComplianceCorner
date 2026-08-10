-- Uzbekistan + Azerbaijan tracking sources for /sources, per
-- ADDING-A-COUNTRY.md step 4. Two per country, all four languages.
--
-- Every URL here was fetched directly in the 10 Aug 2026 research
-- round except Azerbaijan's technical-resources page, which was
-- reached via the State Tax Service's own e-qaime page. Deliberately
-- NOT listed: soliq.uz and my.soliq.uz (robots-blocked to automated
-- checking from this sandbox, so their availability could not be
-- independently verified -- same caution applied to Taiwan's MOF
-- portal and South Korea's NTS link earlier in this project), and
-- e-taxes.gov.az (live and officially cited, but an authenticated
-- portal returning 403 to automated retrieval; it appears as a
-- deep-dive portal link instead, where the login requirement is
-- stated).
--
-- Uses the idempotent NOT EXISTS / COALESCE(MAX(sort_order),-1)+1
-- pattern established in migration 479.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://gov.uz/en/soliq',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'UZ'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://gov.uz/en/soliq');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'State Tax Committee of Uzbekistan — the official government portal for the tax authority that operates the ESF electronic invoice regime.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'UZ' AND ts.url = 'https://gov.uz/en/soliq';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Comité Estatal de Impuestos de Uzbekistán — el portal gubernamental oficial de la autoridad fiscal que gestiona el régimen de facturas electrónicas ESF.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'UZ' AND ts.url = 'https://gov.uz/en/soliq';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Staatliches Steuerkomitee Usbekistans — das offizielle Regierungsportal der Steuerbehörde, die das ESF-E-Rechnungssystem betreibt.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'UZ' AND ts.url = 'https://gov.uz/en/soliq';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Comité national des impôts d''Ouzbékistan — le portail gouvernemental officiel de l''administration fiscale qui gère le régime de factures électroniques ESF.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'UZ' AND ts.url = 'https://gov.uz/en/soliq';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://lex.uz/en/docs/4386771',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'UZ'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://lex.uz/en/docs/4386771');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'lex.uz — Uzbekistan''s national legislation database. Cabinet of Ministers Resolution No. 522 of 25 June 2019, the founding instrument of the ESF mandate.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'UZ' AND ts.url = 'https://lex.uz/en/docs/4386771';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'lex.uz — la base de datos legislativa nacional de Uzbekistán. Resolución n.º 522 del Gabinete de Ministros, de 25 de junio de 2019, el instrumento fundacional del mandato ESF.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'UZ' AND ts.url = 'https://lex.uz/en/docs/4386771';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'lex.uz — Usbekistans nationale Gesetzesdatenbank. Beschluss Nr. 522 des Ministerkabinetts vom 25. Juni 2019, das Gründungsinstrument der ESF-Pflicht.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'UZ' AND ts.url = 'https://lex.uz/en/docs/4386771';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'lex.uz — la base de données législative nationale de l''Ouzbékistan. Résolution n° 522 du Cabinet des ministres du 25 juin 2019, l''instrument fondateur du mandat ESF.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'UZ' AND ts.url = 'https://lex.uz/en/docs/4386771';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.taxes.gov.az/en/page/elektron-qaime-faktura',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'AZ'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.taxes.gov.az/en/page/elektron-qaime-faktura');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'State Tax Service of Azerbaijan — the official e-qaimə (electronic invoice) page, the primary source for Azerbaijan''s e-invoicing rules.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'AZ' AND ts.url = 'https://www.taxes.gov.az/en/page/elektron-qaime-faktura';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Servicio Tributario Estatal de Azerbaiyán — la página oficial de e-qaimə (factura electrónica), la fuente primaria de las normas de facturación electrónica del país.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'AZ' AND ts.url = 'https://www.taxes.gov.az/en/page/elektron-qaime-faktura';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Staatlicher Steuerdienst Aserbaidschans — die offizielle e-qaimə-Seite (elektronische Rechnung), die Primärquelle für Aserbaidschans E-Rechnungsvorschriften.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'AZ' AND ts.url = 'https://www.taxes.gov.az/en/page/elektron-qaime-faktura';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Service national des impôts d''Azerbaïdjan — la page officielle e-qaimə (facture électronique), la source primaire des règles de facturation électronique du pays.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'AZ' AND ts.url = 'https://www.taxes.gov.az/en/page/elektron-qaime-faktura';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.taxes.gov.az/en/page/e-qaime-faktura',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'AZ'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.taxes.gov.az/en/page/e-qaime-faktura');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'State Tax Service — e-invoice technical resources: the XML file-format specification, sample templates, and the goods, works and services classification file.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'AZ' AND ts.url = 'https://www.taxes.gov.az/en/page/e-qaime-faktura';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Servicio Tributario Estatal — recursos técnicos de la factura electrónica: la especificación del formato XML, plantillas de ejemplo y el archivo de clasificación de bienes, obras y servicios.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'AZ' AND ts.url = 'https://www.taxes.gov.az/en/page/e-qaime-faktura';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Staatlicher Steuerdienst — technische Ressourcen zur E-Rechnung: die XML-Formatspezifikation, Beispielvorlagen und die Klassifikationsdatei für Waren, Arbeiten und Dienstleistungen.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'AZ' AND ts.url = 'https://www.taxes.gov.az/en/page/e-qaime-faktura';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Service national des impôts — ressources techniques de la facture électronique : la spécification du format XML, des modèles types et le fichier de classification des biens, travaux et services.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'AZ' AND ts.url = 'https://www.taxes.gov.az/en/page/e-qaime-faktura';
