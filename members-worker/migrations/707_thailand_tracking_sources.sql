-- Thailand: tracking sources for /sources and the weekly monitor.
--
-- Guarded on (country, url): tracking_sources has an autoincrement key
-- and an unguarded re-run duplicates rows -- the Luxembourg 193 precedent.
--
-- The decree index is first, and it is the whole point of watching this
-- country right now. The 200 per cent deduction lapsed on 31 December
-- 2025 and its replacement has Cabinet approval but no located Royal
-- Decree. That index is where the decree will appear if it appears.

INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://www.rd.go.th/1603.html', 0, 1 FROM countries c WHERE c.code = 'TH' AND NOT EXISTS (
  SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.rd.go.th/1603.html');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'Revenue Department — the Royal Decree index. The 2026-27 incentive was approved in June and is not on it yet; this is where it would appear.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'TH' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Departamento de Hacienda: índice de decretos reales. El incentivo 2026-27 se aprobó en junio y aún no figura; aquí aparecería.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'TH' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Steuerbehörde — das Verzeichnis der Königlichen Dekrete. Der Anreiz 2026-27 wurde im Juni gebilligt und steht noch nicht darin.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'TH' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Administration fiscale — l''index des décrets royaux. L''incitation 2026-27 a été approuvée en juin et n''y figure pas encore.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'TH' AND t.sort_order = 0;

INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://www.rd.go.th/1597.html', 1, 1 FROM countries c WHERE c.code = 'TH' AND NOT EXISTS (
  SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.rd.go.th/1597.html');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'Revenue Department announcements. Every e-tax instrument since 2019 has appeared here first, and a mandate, if one ever comes, would too.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'TH' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Anuncios del Departamento de Hacienda. Todo instrumento de factura electrónica desde 2019 apareció aquí primero, y un mandato también lo haría.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'TH' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Bekanntmachungen der Steuerbehörde. Jedes E-Steuer-Instrument seit 2019 erschien zuerst hier; eine Pflicht käme denselben Weg.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'TH' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Annonces de l''administration fiscale. Tout instrument de facture électronique depuis 2019 y est paru d''abord ; une obligation aussi.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'TH' AND t.sort_order = 1;

INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://www.etda.or.th/', 2, 1 FROM countries c WHERE c.code = 'TH' AND NOT EXISTS (
  SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.etda.or.th/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'ETDA, which owns the XML standard and operates the time-stamp service. A change to the standard changes what integrators build.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'TH' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'ETDA, dueña del estándar XML y operadora del sello de tiempo. Un cambio en el estándar cambia lo que hay que construir.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'TH' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'ETDA, Eigentümerin des XML-Standards und Betreiberin des Zeitstempeldienstes. Eine Standardänderung ändert die Integration.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'TH' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'L''ETDA, propriétaire de la norme XML et opératrice de l''horodatage. Une évolution de la norme change ce qu''il faut construire.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'TH' AND t.sort_order = 2;

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM tracking_sources WHERE country_id = (SELECT id FROM countries WHERE code = 'TH') = 3
-- ASSERT: SELECT count(*) FROM tracking_source_translations WHERE source_id IN (SELECT id FROM tracking_sources WHERE country_id = (SELECT id FROM countries WHERE code = 'TH')) = 12
-- ASSERT ALWAYS: SELECT count(*) FROM countries WHERE slug IS NOT NULL AND id NOT IN (SELECT country_id FROM tracking_sources) = 0
