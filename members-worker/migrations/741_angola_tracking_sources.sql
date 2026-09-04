-- Angola's official reference pages, so the country is watched by
-- something.
--
-- The registration nothing reminds you about: an absent country makes
-- /sources under-report the site's own coverage, and its pages never
-- reach monitored_sources, so the weekly sweep reports a clean run over a
-- country it has never looked at. 685's standing invariant is what turns
-- that from silence into a failing replay, and it is the reason this file
-- exists rather than being remembered.
--
-- THREE PAGES, AND ONE OF THEM IS NOT A GOVERNMENT PAGE. The AGT's own
-- portal and taxpayer portal are the operative sources. The third is the
-- decree text on angolex.com, and it is here deliberately: the Ministry
-- publishes Decreto Presidencial 71/25 as a PDF with no text layer, so
-- the only readable copy of the instrument this site can watch for change
-- is a republication. That is a weakness in the watch list and is better
-- recorded than papered over.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://portaldocontribuinte.minfin.gov.ao/', 0 FROM countries c WHERE c.code = 'AO'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://portaldocontribuinte.minfin.gov.ao/');
INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://agt.minfin.gov.ao/PortalAGT/', 1 FROM countries c WHERE c.code = 'AO'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://agt.minfin.gov.ao/PortalAGT/');
INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://angolex.com/paginas/decreto-presidencial/regime-juridico-das-facturas-71a-25a.html', 2 FROM countries c WHERE c.code = 'AO'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://angolex.com/paginas/decreto-presidencial/regime-juridico-das-facturas-71a-25a.html');

INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'Portal do Contribuinte — where a taxpayer joins the regime, registers each establishment and requests its invoice series.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'AO' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Portal do Contribuinte: donde el contribuyente se adhiere al régimen, registra cada establecimiento y pide sus series de facturación.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'AO' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Portal do Contribuinte — hier tritt ein Steuerpflichtiger dem Regime bei, meldet jede Betriebsstätte an und beantragt seine Rechnungsserien.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'AO' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Portal do Contribuinte — là où le contribuable adhère au régime, déclare chaque établissement et demande ses séries de facturation.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'AO' AND t.sort_order = 0;

INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'Administração Geral Tributária — the tax authority itself: the certified-software list, the e-invoicing services and its comunicados.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'AO' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Administração Geral Tributária: la propia administración tributaria, con la lista de software certificado, los servicios de factura electrónica y sus comunicados.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'AO' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Administração Geral Tributária — die Steuerbehörde selbst: Liste zertifizierter Software, E-Rechnungsdienste und ihre Mitteilungen.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'AO' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Administração Geral Tributária — l''administration fiscale elle-même : liste des logiciels agréés, services de facturation électronique et communiqués.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'AO' AND t.sort_order = 1;

INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'Decreto Presidencial 71/25, article by article. A republication, watched because the Ministry''s own PDF carries no text layer.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'AO' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'El Decreto Presidencial 71/25, artículo por artículo. Una republicación, vigilada porque el PDF del propio Ministerio no lleva capa de texto.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'AO' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Das Präsidialdekret 71/25, Artikel für Artikel. Eine Zweitveröffentlichung, beobachtet, weil das PDF des Ministeriums keine Textebene hat.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'AO' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Le décret présidentiel 71/25, article par article. Une republication, surveillée car le PDF du ministère n''a pas de couche texte.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'AO' AND t.sort_order = 2;

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM tracking_sources WHERE country_id = (SELECT id FROM countries WHERE code = 'AO') = 3
-- ASSERT: SELECT count(*) FROM tracking_source_translations t JOIN tracking_sources s ON s.id = t.source_id WHERE s.country_id = (SELECT id FROM countries WHERE code = 'AO') = 12
--
-- STANDING: every country with a page is watched by something.
--
-- Restated from 685 rather than assumed, because this file is the reason
-- the invariant passes again and the next country add is the next time it
-- will fail. Written relatively, one table against another.
-- ASSERT ALWAYS: SELECT count(*) FROM countries WHERE slug IS NOT NULL AND id NOT IN (SELECT country_id FROM tracking_sources) = 0
