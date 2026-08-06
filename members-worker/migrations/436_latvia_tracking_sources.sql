-- Latvia tracking sources for /sources -- built now, per
-- ADDING-A-COUNTRY.md's step 4. All URLs independently fetched and
-- confirmed live in this session. Latvia is an EU member state, so
-- the EC eInvoicing country factsheet is included too, per the
-- pattern in migration 215/222 -- but flagged in its own description
-- as stale on the B2B date specifically, since it still shows 1 Jan
-- 2026 rather than the actual, postponed 1 Jan 2028 date.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ifinanses.lv/raksti/aktuali/vid-informacija/lv-strukturetie-elektroniskie-rekini-no-2025-gada/30259',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'LV'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ifinanses.lv/raksti/aktuali/vid-informacija/lv-strukturetie-elektroniskie-rekini-no-2025-gada/30259');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'ifinanses.lv (VID-linked public information site) — guidance on Latvia''s structured e-invoice requirements from 2025, including the B2G mandate and the Accounting Law basis.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LV' AND ts.url = 'https://ifinanses.lv/raksti/aktuali/vid-informacija/lv-strukturetie-elektroniskie-rekini-no-2025-gada/30259';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'ifinanses.lv (sitio de información pública vinculado a VID) — orientación sobre los requisitos de facturas electrónicas estructuradas de Letonia desde 2025, incluido el mandato B2G y la base en la Ley de Contabilidad.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LV' AND ts.url = 'https://ifinanses.lv/raksti/aktuali/vid-informacija/lv-strukturetie-elektroniskie-rekini-no-2025-gada/30259';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'ifinanses.lv (mit VID verbundene öffentliche Informationsseite) — Hinweise zu Lettlands Anforderungen an strukturierte E-Rechnungen ab 2025, einschließlich der B2G-Pflicht und der Grundlage im Buchhaltungsgesetz.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LV' AND ts.url = 'https://ifinanses.lv/raksti/aktuali/vid-informacija/lv-strukturetie-elektroniskie-rekini-no-2025-gada/30259';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'ifinanses.lv (site d''information publique lié à VID) — indications sur les exigences de factures électroniques structurées de la Lettonie à partir de 2025, y compris l''obligation B2G et le fondement dans la loi sur la comptabilité.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LV' AND ts.url = 'https://ifinanses.lv/raksti/aktuali/vid-informacija/lv-strukturetie-elektroniskie-rekini-no-2025-gada/30259';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.plz.lv/gramatvedibas-likuma-grozijumi-par-e-rekinu-apriti-uznemumu-starpa/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'LV'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.plz.lv/gramatvedibas-likuma-grozijumi-par-e-rekinu-apriti-uznemumu-starpa/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'plz.lv — coverage of the 5 June 2025 Saeima amendment postponing the B2B e-invoicing mandate from 2026 to 2028, the primary source for that correction.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LV' AND ts.url = 'https://www.plz.lv/gramatvedibas-likuma-grozijumi-par-e-rekinu-apriti-uznemumu-starpa/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'plz.lv — cobertura de la enmienda del Saeima del 5 de junio de 2025 que aplaza el mandato de facturación electrónica B2B de 2026 a 2028, la fuente primaria de esa corrección.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LV' AND ts.url = 'https://www.plz.lv/gramatvedibas-likuma-grozijumi-par-e-rekinu-apriti-uznemumu-starpa/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'plz.lv — Berichterstattung über die Saeima-Änderung vom 5. Juni 2025, die die B2B-E-Rechnungspflicht von 2026 auf 2028 verschiebt, die Primärquelle für diese Korrektur.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LV' AND ts.url = 'https://www.plz.lv/gramatvedibas-likuma-grozijumi-par-e-rekinu-apriti-uznemumu-starpa/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'plz.lv — couverture de l''amendement du Saeima du 5 juin 2025 reportant l''obligation de facturation électronique B2B de 2026 à 2028, la source primaire de cette correction.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LV' AND ts.url = 'https://www.plz.lv/gramatvedibas-likuma-grozijumi-par-e-rekinu-apriti-uznemumu-starpa/';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108891/eInvoicing+in+Latvia',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'LV'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url LIKE '%digital-building-blocks%');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission''s country factsheet — legal framework and B2G/B2B/B2C scope. Note: as of this research, it has not been updated since the 5 June 2025 postponement and still shows a 1 Jan 2026 B2B date; treat this page''s other sources as authoritative for the current B2B date.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LV' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de la Comisión Europea — marco legal y alcance B2G/B2B/B2C. Nota: a fecha de esta investigación, no se ha actualizado desde el aplazamiento del 5 de junio de 2025 y todavía muestra una fecha B2B del 1 de enero de 2026; considere las demás fuentes de esta página como referencia para la fecha B2B actual.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LV' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Länderfactsheet der Europäischen Kommission — Rechtsrahmen und B2G/B2B/B2C-Umfang. Hinweis: Zum Zeitpunkt dieser Recherche wurde es seit der Verschiebung vom 5. Juni 2025 nicht aktualisiert und zeigt weiterhin ein B2B-Datum vom 1. Januar 2026; betrachten Sie die übrigen Quellen dieser Seite als maßgeblich für das aktuelle B2B-Datum.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LV' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays de la Commission européenne — cadre juridique et périmètre B2G/B2B/B2C. Remarque : à la date de cette recherche, elle n''a pas été mise à jour depuis le report du 5 juin 2025 et indique toujours une échéance B2B au 1er janvier 2026 ; considérez les autres sources de cette page comme faisant autorité pour la date B2B actuelle.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LV' AND ts.url LIKE '%digital-building-blocks%';
