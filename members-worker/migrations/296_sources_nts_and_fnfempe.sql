-- Two /sources fixes requested by Dan directly (3 August 2026), not
-- part of any country-add:
--
-- 1. South Korea: Dan confirmed https://www.nts.go.kr/english/ (added
--    in migration 286) now routes to an invalid page when opened in a
--    browser -- genuine link rot, not a hypothetical concern. Swapped
--    to https://www.nts.go.kr/nts/main.do (the NTS's general
--    homepage) per Dan's own confirmation that this URL works. Plain
--    UPDATE, not INSERT OR IGNORE, since this corrects an existing row
--    rather than adding a new one -- safe to re-run (the WHERE clause
--    stops matching once applied).
--
-- 2. France: added FNFE-MPE (Forum National de la Facture
--    Électronique et des Marchés Publics Électroniques) as a second
--    tracking source alongside Chorus Pro, per Dan's explicit choice
--    ("add fnfe-mpe.org alongside Chorus Pro") after being told it's a
--    public-private consultation association, not a government body
--    itself -- it coordinates France's e-invoicing reform across
--    government and industry stakeholders and publishes the
--    implementation guidance most of the field actually uses, but per
--    the description below is honestly labeled as consultative rather
--    than governmental, unlike every other source on /sources.

UPDATE tracking_sources
SET url = 'https://www.nts.go.kr/nts/main.do'
WHERE url = 'https://www.nts.go.kr/english/'
  AND country_id = (SELECT id FROM countries WHERE name_en = 'South Korea');

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://fnfe-mpe.org/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'France'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://fnfe-mpe.org/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'FNFE-MPE (Forum National de la Facture Électronique) — the public-private consultation body coordinating France''s e-invoicing reform, publishing implementation guidance and best practices. Not a government body itself.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'France' AND ts.url = 'https://fnfe-mpe.org/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'FNFE-MPE (Foro Nacional de la Factura Electrónica) — el organismo de consulta público-privado que coordina la reforma de facturación electrónica de Francia, y que publica guías de implementación y buenas prácticas. No es un organismo gubernamental en sí mismo.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'France' AND ts.url = 'https://fnfe-mpe.org/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'FNFE-MPE (Nationales Forum für elektronische Rechnungsstellung) — das öffentlich-private Konsultationsgremium, das Frankreichs E-Invoicing-Reform koordiniert und Umsetzungsleitfäden sowie bewährte Verfahren veröffentlicht. Selbst keine Regierungsstelle.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'France' AND ts.url = 'https://fnfe-mpe.org/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'FNFE-MPE (Forum National de la Facture Électronique et des Marchés Publics Électroniques) — l''instance de concertation public-privé qui coordonne la réforme de facturation électronique de la France, et publie des guides de mise en œuvre et des bonnes pratiques. N''est pas elle-même un organisme public.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'France' AND ts.url = 'https://fnfe-mpe.org/';
