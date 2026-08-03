-- Turkey tracking sources for /sources -- per ADDING-A-COUNTRY.md's
-- step 4. Turkey is not an EU member state, so there is no EC
-- eInvoicing country factsheet to add (matching the Vietnam/South
-- Korea precedent) -- only GİB's e-Belge portal and its general
-- Revenue Administration site, the same two portals used in the
-- deep-dive content (migration 301).

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ebelge.gib.gov.tr',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Turkey'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ebelge.gib.gov.tr');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Revenue Administration (GİB) — e-Belge portal for e-Fatura, e-Arşiv, e-Defter, and e-İrsaliye registration and access.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Turkey' AND ts.url = 'https://ebelge.gib.gov.tr';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Administración Tributaria (GİB) — portal e-Belge para el registro y acceso a e-Fatura, e-Arşiv, e-Defter y e-İrsaliye.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Turkey' AND ts.url = 'https://ebelge.gib.gov.tr';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Steuerbehörde (GİB) — e-Belge-Portal für die Registrierung und den Zugang zu e-Fatura, e-Arşiv, e-Defter und e-İrsaliye.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Turkey' AND ts.url = 'https://ebelge.gib.gov.tr';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Administration fiscale (GİB) — portail e-Belge pour l''inscription et l''accès à l''e-Fatura, l''e-Arşiv, l''e-Defter et l''e-İrsaliye.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Turkey' AND ts.url = 'https://ebelge.gib.gov.tr';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.gib.gov.tr',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Turkey'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.gib.gov.tr');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Revenue Administration (Gelir İdaresi Başkanlığı, GİB) — the body administering Turkey''s e-invoicing mandates and tax law.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Turkey' AND ts.url = 'https://www.gib.gov.tr';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Administración Tributaria (Gelir İdaresi Başkanlığı, GİB) — el organismo que administra los mandatos de facturación electrónica y la legislación fiscal de Turquía.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Turkey' AND ts.url = 'https://www.gib.gov.tr';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Steuerbehörde (Gelir İdaresi Başkanlığı, GİB) — die Stelle, die Türkiyes E-Invoicing-Pflichten und Steuerrecht verwaltet.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Turkey' AND ts.url = 'https://www.gib.gov.tr';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Administration fiscale (Gelir İdaresi Başkanlığı, GİB) — l''organisme qui administre les obligations de facturation électronique et le droit fiscal de la Turquie.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Turkey' AND ts.url = 'https://www.gib.gov.tr';
