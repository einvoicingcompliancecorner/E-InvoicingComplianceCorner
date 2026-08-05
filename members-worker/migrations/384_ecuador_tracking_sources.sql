-- Ecuador tracking sources for /sources -- built now, per
-- ADDING-A-COUNTRY.md's step 4. SRI's e-invoicing hub (the taxpayer-
-- facing page for the actual mandate) and SRI's general site (the
-- resolution chain, from NAC-DGERCGC14-00790 through
-- NAC-DGERCGC25-00000017, plus broader VAT/tax rules). Ecuador is not
-- an EU/EEA member, so no EC eInvoicing factsheet is added, matching
-- the Indonesia precedent (362).

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.sri.gob.ec/facturacion-electronica',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Ecuador'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.sri.gob.ec/facturacion-electronica');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'SRI — Facturación Electrónica, the taxpayer-facing hub for Ecuador''s electronic-invoicing regime.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Ecuador' AND ts.url = 'https://www.sri.gob.ec/facturacion-electronica';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'SRI — Facturación Electrónica, el centro orientado al contribuyente para el régimen de facturación electrónica de Ecuador.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Ecuador' AND ts.url = 'https://www.sri.gob.ec/facturacion-electronica';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'SRI — Facturación Electrónica, das für Steuerpflichtige zugängliche Zentrum für Ecuadors Regime der elektronischen Rechnungsstellung.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Ecuador' AND ts.url = 'https://www.sri.gob.ec/facturacion-electronica';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'SRI — Facturación Electrónica, le portail destiné aux contribuables pour le régime de facturation électronique de l''Équateur.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Ecuador' AND ts.url = 'https://www.sri.gob.ec/facturacion-electronica';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.sri.gob.ec/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Ecuador'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.sri.gob.ec/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Servicio de Rentas Internas (SRI) — Ecuador''s tax authority general site, covering the full resolution chain (NAC-DGERCGC14-00790 through NAC-DGERCGC25-00000017) and general VAT/tax rules.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Ecuador' AND ts.url = 'https://www.sri.gob.ec/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Servicio de Rentas Internas (SRI) — sitio general de la autoridad tributaria de Ecuador, que cubre toda la cadena de resoluciones (de NAC-DGERCGC14-00790 a NAC-DGERCGC25-00000017) y las normas generales de IVA/impuestos.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Ecuador' AND ts.url = 'https://www.sri.gob.ec/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Servicio de Rentas Internas (SRI) — die allgemeine Website der ecuadorianischen Steuerbehörde, die die gesamte Entschließungskette (von NAC-DGERCGC14-00790 bis NAC-DGERCGC25-00000017) sowie die allgemeinen USt-/Steuervorschriften abdeckt.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Ecuador' AND ts.url = 'https://www.sri.gob.ec/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Servicio de Rentas Internas (SRI) — le site général de l''administration fiscale équatorienne, couvrant l''ensemble de la chaîne des résolutions (de NAC-DGERCGC14-00790 à NAC-DGERCGC25-00000017) et les règles générales de TVA/fiscalité.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Ecuador' AND ts.url = 'https://www.sri.gob.ec/';
