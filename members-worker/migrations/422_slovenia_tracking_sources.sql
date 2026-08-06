-- Slovenia tracking sources for /sources -- built now, per
-- ADDING-A-COUNTRY.md's step 4. All three URLs independently fetched
-- and confirmed live in this session.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2025-01-3032/zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov-zierded',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'SI'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2025-01-3032/zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov-zierded');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Official Gazette (Uradni list RS) — ZIERDED full legal text, the primary source for Slovenia''s B2B e-invoicing law.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'SI' AND ts.url = 'https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2025-01-3032/zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov-zierded';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Diario Oficial (Uradni list RS) — texto legal completo de la ZIERDED, la fuente primaria de la ley eslovena de facturación electrónica B2B.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'SI' AND ts.url = 'https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2025-01-3032/zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov-zierded';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Amtsblatt (Uradni list RS) — vollständiger Gesetzestext der ZIERDED, die Primärquelle für Sloweniens B2B-E-Rechnungsgesetz.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'SI' AND ts.url = 'https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2025-01-3032/zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov-zierded';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Journal officiel (Uradni list RS) — texte juridique complet de la ZIERDED, la source primaire de la loi slovène sur la facturation électronique B2B.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'SI' AND ts.url = 'https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2025-01-3032/zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov-zierded';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://eracuni.ujp.gov.si/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'SI'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://eracuni.ujp.gov.si/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'UJP e-Racuni — the public-sector (B2G) e-invoice submission portal, operated by the Administration of the Republic of Slovenia for Public Payments.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'SI' AND ts.url = 'https://eracuni.ujp.gov.si/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'UJP e-Racuni — el portal de envío de facturas electrónicas del sector público (B2G), operado por la Administración de la República de Eslovenia para Pagos Públicos.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'SI' AND ts.url = 'https://eracuni.ujp.gov.si/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'UJP e-Racuni — das Übermittlungsportal für elektronische Rechnungen des öffentlichen Sektors (B2G), betrieben von der Verwaltung der Republik Slowenien für öffentliche Zahlungen.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'SI' AND ts.url = 'https://eracuni.ujp.gov.si/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'UJP e-Racuni — le portail de soumission des factures électroniques du secteur public (B2G), exploité par l''Administration de la République de Slovénie pour les paiements publics.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'SI' AND ts.url = 'https://eracuni.ujp.gov.si/';

-- Slovenia is an EU member state -> also add the EC eInvoicing country
-- factsheet, matching the pattern established in migration 236 etc.
-- Note: the EC sheet (last updated 14 Aug 2025) still describes
-- ZIERDED as a February 2025 draft targeting 1 Jan 2027 -- superseded
-- by the actual enacted law (6 Nov 2025 gazette publication, 1 Jan
-- 2028 core date). The gazette above, not this factsheet, is this
-- tracker's source for ZIERDED's dates.
INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983598/2025+Slovenia+2025+eInvoicing+Country+Sheet',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'SI'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url LIKE '%digital-building-blocks%');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission''s country factsheet — legal framework, B2G/B2B/B2C scope, and mandate status, reviewed and updated periodically.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'SI' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de la Comisión Europea — marco legal, alcance B2G/B2B/B2C y estado del mandato, revisada y actualizada periódicamente.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'SI' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Länderfactsheet der Europäischen Kommission — Rechtsrahmen, B2G/B2B/B2C-Umfang und Pflichtstatus, regelmäßig überprüft und aktualisiert.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'SI' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays de la Commission européenne — cadre juridique, périmètre B2G/B2B/B2C et statut de l''obligation, révisée et mise à jour périodiquement.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'SI' AND ts.url LIKE '%digital-building-blocks%';
