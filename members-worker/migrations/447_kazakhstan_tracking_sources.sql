-- Kazakhstan tracking sources for /sources, per ADDING-A-COUNTRY.md's
-- step 4. All URLs independently fetched and confirmed live in this
-- session.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://kgd.gov.kz/en/section/elektronnye-scheta-faktury',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'KZ'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://kgd.gov.kz/en/section/elektronnye-scheta-faktury');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'State Revenue Committee (Ministry of Finance) — official Electronic Invoices (IS ESF) section, the primary source for Kazakhstan''s e-invoicing rules.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KZ' AND ts.url = 'https://kgd.gov.kz/en/section/elektronnye-scheta-faktury';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Comité Estatal de Ingresos (Ministerio de Finanzas) — sección oficial de Facturas Electrónicas (IS ESF), la fuente primaria de las normas de facturación electrónica de Kazajistán.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KZ' AND ts.url = 'https://kgd.gov.kz/en/section/elektronnye-scheta-faktury';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Staatliches Einnahmenkomitee (Finanzministerium) — offizieller Bereich für elektronische Rechnungen (IS ESF), die Primärquelle für Kasachstans E-Rechnungsvorschriften.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KZ' AND ts.url = 'https://kgd.gov.kz/en/section/elektronnye-scheta-faktury';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Comité national des recettes (ministère des Finances) — section officielle des factures électroniques (IS ESF), la source primaire des règles de facturation électronique du Kazakhstan.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KZ' AND ts.url = 'https://kgd.gov.kz/en/section/elektronnye-scheta-faktury';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://adilet.zan.kz/eng/docs/V1900018583',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'KZ'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://adilet.zan.kz/eng/docs/V1900018583');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Adilet — Kazakhstan''s official legal database. Order No. 370 (2019), the implementing rules for the mandatory e-invoicing era, English text.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KZ' AND ts.url = 'https://adilet.zan.kz/eng/docs/V1900018583';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Adilet — la base de datos jurídica oficial de Kazajistán. Orden N.º 370 (2019), las normas de aplicación de la era de facturación electrónica obligatoria, texto en inglés.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KZ' AND ts.url = 'https://adilet.zan.kz/eng/docs/V1900018583';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Adilet — Kasachstans offizielle Rechtsdatenbank. Verordnung Nr. 370 (2019), die Durchführungsvorschriften für die verbindliche E-Rechnungs-Ära, englischer Text.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KZ' AND ts.url = 'https://adilet.zan.kz/eng/docs/V1900018583';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Adilet — la base de données juridique officielle du Kazakhstan. Arrêté n° 370 (2019), les règles d''application de l''ère de la facturation électronique obligatoire, texte en anglais.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KZ' AND ts.url = 'https://adilet.zan.kz/eng/docs/V1900018583';
