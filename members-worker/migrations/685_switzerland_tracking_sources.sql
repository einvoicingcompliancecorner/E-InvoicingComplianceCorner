-- Switzerland: tracking sources for /sources and the weekly monitor.
--
-- Guarded on (country, url): tracking_sources has an autoincrement key
-- and an unguarded re-run duplicates rows -- the Luxembourg 193 precedent.
--
-- The procurement page is here because of where this country's duty
-- actually lives. There is no ordinance to watch; the binding text is a
-- clause in the Confederation's standard terms, so the standard terms
-- are the thing whose change would change the obligation.

INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://www.efv.admin.ch/de/elektronische-rechnungen-stellen-und-empfangen', 0, 1 FROM countries c WHERE c.code = 'CH' AND NOT EXISTS (
  SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.efv.admin.ch/de/elektronische-rechnungen-stellen-und-empfangen');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'Federal Finance Administration — the Confederation''s own e-invoicing pages, where any change to the federal supplier obligation appears first.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'CH' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Administración Federal de Finanzas: las páginas de facturación electrónica de la Confederación, donde aparecerá antes cualquier cambio.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'CH' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Eidgenössische Finanzverwaltung — die E-Rechnungs-Seiten des Bundes, auf denen jede Änderung der Lieferantenpflicht zuerst erscheint.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'CH' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Administration fédérale des finances — les pages de facturation électronique de la Confédération, où tout changement paraît en premier.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'CH' AND t.sort_order = 0;

INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://www.bkb.admin.ch/de/agb-des-bundes', 1, 1 FROM countries c WHERE c.code = 'CH' AND NOT EXISTS (
  SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.bkb.admin.ch/de/agb-des-bundes');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'Federal Procurement Conference — the standard terms whose clause 9.4 IS the obligation. There is no ordinance; this document is the law of it.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'CH' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Conferencia Federal de Contratación: las condiciones generales cuya cláusula 9.4 ES la obligación. No hay reglamento; este documento lo es.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'CH' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Beschaffungskonferenz des Bundes — die AGB, deren Ziffer 9.4 die Pflicht IST. Eine Verordnung gibt es nicht; dieses Dokument ist sie.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'CH' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Conférence des achats de la Confédération — les conditions générales dont la clause 9.4 EST l''obligation. Il n''existe pas d''ordonnance.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'CH' AND t.sort_order = 1;

INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://www.estv.admin.ch/de/mwst-online-abrechnen', 2, 1 FROM countries c WHERE c.code = 'CH' AND NOT EXISTS (
  SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.estv.admin.ch/de/mwst-online-abrechnen');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'Federal Tax Administration — VAT filing. Watch for any move from aggregate returns toward transaction data, which is the change that would matter.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'CH' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Administración Federal de Contribuciones: declaración del IVA. Vigile cualquier paso de totales periódicos hacia datos de operaciones.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'CH' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Eidgenössische Steuerverwaltung — MWST-Abrechnung. Auf einen Wechsel von Periodensummen zu Transaktionsdaten achten; das wäre die Änderung.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'CH' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Administration fédérale des contributions — déclaration de TVA. Guetter tout passage des totaux périodiques aux données de transactions.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'CH' AND t.sort_order = 2;

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM tracking_sources WHERE country_id = (SELECT id FROM countries WHERE code = 'CH') = 3
-- ASSERT: SELECT count(*) FROM tracking_source_translations WHERE source_id IN (SELECT id FROM tracking_sources WHERE country_id = (SELECT id FROM countries WHERE code = 'CH')) = 12
-- ASSERT ALWAYS: SELECT count(*) FROM countries WHERE slug IS NOT NULL AND id NOT IN (SELECT country_id FROM tracking_sources) = 0
