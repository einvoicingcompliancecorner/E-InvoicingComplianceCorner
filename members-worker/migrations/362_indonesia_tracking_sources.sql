-- Indonesia tracking sources for /sources -- built now, per
-- ADDING-A-COUNTRY.md's step 4. Coretax DJP (the actual taxpayer-facing
-- clearance portal) and DJP's general site (regulations, KEP-54/PJ/2025,
-- PER-11/PJ/2025, and the broader e-Faktur/Coretax framework). Indonesia
-- is not an EU/EEA member, so no EC eInvoicing factsheet is added, unlike
-- the Hungary precedent (353).

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://coretaxdjp.pajak.go.id/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Indonesia'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://coretaxdjp.pajak.go.id/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Coretax DJP — the taxpayer-facing platform at the heart of Indonesia''s real-time e-invoice clearance system.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Indonesia' AND ts.url = 'https://coretaxdjp.pajak.go.id/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Coretax DJP — la plataforma orientada al contribuyente que constituye el núcleo del sistema de clearance de facturación electrónica en tiempo real de Indonesia.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Indonesia' AND ts.url = 'https://coretaxdjp.pajak.go.id/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Coretax DJP — die für Steuerpflichtige zugängliche Plattform im Zentrum von Indonesiens Echtzeit-E-Rechnungs-Freigabesystem.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Indonesia' AND ts.url = 'https://coretaxdjp.pajak.go.id/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Coretax DJP — la plateforme destinée aux contribuables au cœur du système de dédouanement des factures électroniques en temps réel de l''Indonésie.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Indonesia' AND ts.url = 'https://coretaxdjp.pajak.go.id/';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.pajak.go.id/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Indonesia'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.pajak.go.id/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Direktorat Jenderal Pajak (DJP) — the Directorate General of Taxes'' general site, covering regulations (including KEP-54/PJ/2025 and PER-11/PJ/2025), the e-Faktur/Coretax framework, and VAT rules generally.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Indonesia' AND ts.url = 'https://www.pajak.go.id/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Direktorat Jenderal Pajak (DJP) — el sitio general de la Dirección General de Impuestos, que cubre reglamentos (incluidos KEP-54/PJ/2025 y PER-11/PJ/2025), el marco e-Faktur/Coretax y las normas de IVA en general.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Indonesia' AND ts.url = 'https://www.pajak.go.id/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Direktorat Jenderal Pajak (DJP) — die allgemeine Website der Generaldirektion für Steuern, die Verordnungen (einschließlich KEP-54/PJ/2025 und PER-11/PJ/2025), das e-Faktur-/Coretax-Rahmenwerk und die allgemeinen USt-Vorschriften abdeckt.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Indonesia' AND ts.url = 'https://www.pajak.go.id/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Direktorat Jenderal Pajak (DJP) — le site général de la Direction générale des impôts, couvrant les règlements (dont KEP-54/PJ/2025 et PER-11/PJ/2025), le cadre e-Faktur/Coretax et les règles de TVA en général.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Indonesia' AND ts.url = 'https://www.pajak.go.id/';
