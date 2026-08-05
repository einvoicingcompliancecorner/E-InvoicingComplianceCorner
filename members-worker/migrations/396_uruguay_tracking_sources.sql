-- Uruguay tracking sources for /sources -- built now, per
-- ADDING-A-COUNTRY.md's step 4. DGI's e-Factura portal (the taxpayer-
-- facing CFE resource) and DGI's institutional Facturación Electrónica
-- page. Uruguay is not an EU/EEA member, so no EC eInvoicing factsheet
-- is added, matching the Pakistan/Ecuador precedent (377/384).

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.efactura.dgi.gub.uy/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Uruguay'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.efactura.dgi.gub.uy/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'DGI e-Factura — the official CFE portal: technical specifications, document-type definitions, and the public invoice verification tool at the heart of Uruguay''s e-invoicing regime.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Uruguay' AND ts.url = 'https://www.efactura.dgi.gub.uy/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'DGI e-Factura — el portal oficial de CFE: especificaciones técnicas, definiciones de los tipos de comprobante y la herramienta pública de verificación de facturas, en el núcleo del régimen de facturación electrónica de Uruguay.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Uruguay' AND ts.url = 'https://www.efactura.dgi.gub.uy/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'DGI e-Factura — das offizielle CFE-Portal: technische Spezifikationen, Definitionen der Belegtypen und das öffentliche Rechnungsprüfungstool im Zentrum von Uruguays E-Rechnungs-Regime.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Uruguay' AND ts.url = 'https://www.efactura.dgi.gub.uy/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'DGI e-Factura — le portail officiel du CFE : spécifications techniques, définitions des types de documents et l''outil public de vérification des factures, au cœur du régime de facturation électronique de l''Uruguay.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Uruguay' AND ts.url = 'https://www.efactura.dgi.gub.uy/';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.gub.uy/direccion-general-impositiva/tematica/factura-electronica',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Uruguay'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.gub.uy/direccion-general-impositiva/tematica/factura-electronica');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Dirección General Impositiva (DGI) — the institutional page on Facturación Electrónica, covering official announcements, resolutions (including 2548/023), and the current exemption list.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Uruguay' AND ts.url = 'https://www.gub.uy/direccion-general-impositiva/tematica/factura-electronica';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Dirección General Impositiva (DGI) — la página institucional sobre Facturación Electrónica, que cubre anuncios oficiales, resoluciones (incluida la 2548/023) y la lista vigente de exoneraciones.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Uruguay' AND ts.url = 'https://www.gub.uy/direccion-general-impositiva/tematica/factura-electronica';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Dirección General Impositiva (DGI) — die institutionelle Seite zur Facturación Electrónica mit offiziellen Ankündigungen, Resolutionen (einschließlich 2548/023) und der aktuellen Liste der Ausnahmen.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Uruguay' AND ts.url = 'https://www.gub.uy/direccion-general-impositiva/tematica/factura-electronica';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Dirección General Impositiva (DGI) — la page institutionnelle sur la Facturación Electrónica, couvrant les annonces officielles, les résolutions (dont 2548/023) et la liste actuelle des exonérations.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Uruguay' AND ts.url = 'https://www.gub.uy/direccion-general-impositiva/tematica/factura-electronica';
