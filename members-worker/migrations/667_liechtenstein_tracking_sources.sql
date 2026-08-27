-- Liechtenstein: tracking sources for the /sources page and the weekly
-- monitor. Guarded on (country, url) rather than inserted blind, because
-- tracking_sources has an autoincrement primary key and a re-run of an
-- unguarded INSERT genuinely duplicates rows -- the Luxembourg 193
-- precedent.
--
-- Two of these are chosen for what they would tell us if they CHANGED.
-- The Steuerverwaltung's newsletter index currently contains no entry on
-- electronic invoicing anywhere in its history, which is the strongest
-- negative evidence available that the tax authority has never announced
-- one; an entry appearing there is the earliest signal Liechtenstein's
-- position has moved. The EFTA EEA-Lex page is where any future EU
-- e-invoicing instrument would show up as incorporated into the EEA
-- Agreement, which is the only route by which a European mandate can
-- reach a non-EU state.
--
-- llv.li renders its HTML pages client-side, so the monitor will get
-- chrome rather than content from the two www pages. The PDF index is
-- the one that actually reads, and it is listed first for that reason.

INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://www.llv.li/serviceportal2/amtsstellen/steuerverwaltung/newsletter/stv_newsletter_uebersicht.pdf', 0, 1
  FROM countries c WHERE c.code = 'LI' AND NOT EXISTS (
    SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id
      AND t.url = 'https://www.llv.li/serviceportal2/amtsstellen/steuerverwaltung/newsletter/stv_newsletter_uebersicht.pdf');
INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://www.efta.int/eea-lex/32014l0055', 1, 1
  FROM countries c WHERE c.code = 'LI' AND NOT EXISTS (
    SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.efta.int/eea-lex/32014l0055');
INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://www.llv.li/en/national-administration/fiscal-authority/value-added-tax', 2, 1
  FROM countries c WHERE c.code = 'LI' AND NOT EXISTS (
    SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id
      AND t.url = 'https://www.llv.li/en/national-administration/fiscal-authority/value-added-tax');

INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'Steuerverwaltung newsletters — the authority''s own announcement channel, which in its entire history carries no entry on electronic invoicing.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'LI' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Boletines de la Steuerverwaltung: el canal de anuncios de la propia administración, que en toda su historia no recoge nada sobre facturación electrónica.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'LI' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Newsletter der Steuerverwaltung — der eigene Ankündigungskanal der Behörde, der in seiner gesamten Geschichte keinen Eintrag zur E-Rechnung enthält.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'LI' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Bulletins de la Steuerverwaltung — le canal d''annonce de l''administration, qui ne comporte aucune entrée sur la facturation électronique.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'LI' AND t.sort_order = 0;

INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'EFTA EEA-Lex — where a European e-invoicing instrument appears if it is incorporated into the EEA Agreement, the only route to a non-EU state.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'LI' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'EEA-Lex de la AELC: donde aparece un instrumento europeo de facturación electrónica si se incorpora al Acuerdo EEE, la única vía hacia un Estado no UE.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'LI' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'EFTA EEA-Lex — hier erscheint ein europäisches E-Rechnungs-Instrument, wenn es ins EWR-Abkommen übernommen wird, der einzige Weg in einen Nicht-EU-Staat.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'LI' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'EEA-Lex de l''AELE — où paraît un instrument européen de facturation électronique s''il est repris dans l''accord EEE, seule voie vers un État non-UE.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'LI' AND t.sort_order = 1;

INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'The Steuerverwaltung''s VAT section — rates, practice publications, the public VAT register and the eMWST filing portal.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'LI' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Sección de IVA de la Steuerverwaltung: tipos, publicaciones de práctica, registro público de IVA y el portal de declaración eMWST.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'LI' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'MWST-Bereich der Steuerverwaltung — Sätze, Praxispublikationen, das öffentliche MWST-Register und das Abrechnungsportal eMWST.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'LI' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Section TVA de la Steuerverwaltung — taux, publications de pratique, registre public de TVA et portail de déclaration eMWST.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'LI' AND t.sort_order = 2;

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM tracking_sources WHERE country_id = (SELECT id FROM countries WHERE code = 'LI') = 3
-- ASSERT: SELECT count(*) FROM tracking_source_translations WHERE source_id IN (SELECT id FROM tracking_sources WHERE country_id = (SELECT id FROM countries WHERE code = 'LI')) = 12
-- ASSERT ALWAYS: SELECT count(*) FROM countries WHERE slug IS NOT NULL AND id NOT IN (SELECT country_id FROM tracking_sources) = 0
