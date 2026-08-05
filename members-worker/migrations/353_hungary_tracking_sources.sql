-- Hungary tracking sources for /sources -- built now, per
-- ADDING-A-COUNTRY.md's step 4. NAV Online Szamla (the actual RTIR
-- real-time invoice reporting portal), NAV's general site (tax policy,
-- the energy/water e-invoicing mandate, the comprehensive e-invoicing
-- consultation), and the EC's own eInvoicing country factsheet since
-- Hungary is an EU member state, matching the established pattern.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://onlineszamla.nav.gov.hu/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Hungary'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://onlineszamla.nav.gov.hu/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'NAV Online Szamla — the real-time invoice data reporting portal at the heart of Hungary''s RTIR system.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Hungary' AND ts.url = 'https://onlineszamla.nav.gov.hu/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'NAV Online Szamla — el portal de reporte de datos de facturas en tiempo real que constituye el núcleo del sistema RTIR de Hungría.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Hungary' AND ts.url = 'https://onlineszamla.nav.gov.hu/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'NAV Online Szamla — das Echtzeit-Rechnungsdatenmeldeportal im Zentrum von Ungarns RTIR-System.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Hungary' AND ts.url = 'https://onlineszamla.nav.gov.hu/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'NAV Online Szamla — le portail de déclaration des données de factures en temps réel au cœur du système RTIR hongrois.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Hungary' AND ts.url = 'https://onlineszamla.nav.gov.hu/';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://nav.gov.hu/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Hungary'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://nav.gov.hu/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Nemzeti Ado- es Vamhivatal (NAV) — the National Tax and Customs Administration''s general site, covering the energy/water e-invoicing mandate, receipt-reporting rules, and the comprehensive e-invoicing consultation.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Hungary' AND ts.url = 'https://nav.gov.hu/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Nemzeti Ado- es Vamhivatal (NAV) — el sitio general de la Administración Nacional de Hacienda y Aduanas, que cubre el mandato de facturación electrónica de energía/agua, las normas de reporte de recibos y la consulta sobre facturación electrónica integral.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Hungary' AND ts.url = 'https://nav.gov.hu/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Nemzeti Ado- es Vamhivatal (NAV) — die allgemeine Website der Nationalen Steuer- und Zollverwaltung, die die E-Rechnungspflicht für Energie/Wasser, die Belegmeldevorschriften und die umfassende E-Rechnungs-Konsultation abdeckt.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Hungary' AND ts.url = 'https://nav.gov.hu/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Nemzeti Ado- es Vamhivatal (NAV) — le site général de l''Administration nationale des impôts et des douanes, couvrant l''obligation de facturation électronique énergie/eau, les règles de déclaration des reçus et la consultation sur la facturation électronique globale.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Hungary' AND ts.url = 'https://nav.gov.hu/';

-- Hungary is an EU member state -> also add the EC eInvoicing country
-- factsheet, matching the established pattern.
INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108888/eInvoicing+in+Hungary',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Hungary'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url LIKE '%digital-building-blocks%');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission''s country factsheet — legal framework, B2G/B2B/B2C scope, and mandate status, reviewed and updated periodically.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Hungary' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de la Comisión Europea — marco legal, alcance B2G/B2B/B2C y estado del mandato, revisada y actualizada periódicamente.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Hungary' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Länderfactsheet der Europäischen Kommission — Rechtsrahmen, B2G/B2B/B2C-Umfang und Pflichtstatus, regelmäßig überprüft und aktualisiert.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Hungary' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays de la Commission européenne — cadre juridique, périmètre B2G/B2B/B2C et statut de l''obligation, révisée et mise à jour périodiquement.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Hungary' AND ts.url LIKE '%digital-building-blocks%';
