-- ================================================================
-- Qatar + Bahrain tracking sources for /sources, per
-- ADDING-A-COUNTRY.md step 4. Both countries' only "official" links
-- are general tax-authority portals with no e-invoicing content yet
-- -- described accurately as watch pages, not e-invoicing sources,
-- since that's what they actually are.
-- ================================================================

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://dhareeba.gov.qa',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'QA'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://dhareeba.gov.qa');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'General Tax Authority (Dhareeba portal) — no dedicated e-invoicing section yet; monitor for updates once the draft law advances.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'QA' AND ts.url = 'https://dhareeba.gov.qa';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Autoridad Fiscal General (portal Dhareeba) — sin sección dedicada a facturación electrónica todavía; a vigilar cuando avance el proyecto de ley.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'QA' AND ts.url = 'https://dhareeba.gov.qa';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Allgemeine Steuerbehörde (Dhareeba-Portal) — noch kein eigener Bereich für E-Rechnungen; zur Beobachtung, sobald der Gesetzentwurf voranschreitet.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'QA' AND ts.url = 'https://dhareeba.gov.qa';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Autorité fiscale générale (portail Dhareeba) — aucune section dédiée à la facturation électronique pour l''instant ; à surveiller à mesure que le projet de loi avance.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'QA' AND ts.url = 'https://dhareeba.gov.qa';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.ey.com/en_gl/technical/tax-alerts/qatar-approves-draft-e-invoicing-law-and-implementing-regulations',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'QA'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.ey.com/en_gl/technical/tax-alerts/qatar-approves-draft-e-invoicing-law-and-implementing-regulations');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'EY tax alert — summary of the 6 May 2026 draft law approval (industry source, not government-published).'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'QA' AND ts.url = 'https://www.ey.com/en_gl/technical/tax-alerts/qatar-approves-draft-e-invoicing-law-and-implementing-regulations';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Alerta fiscal de EY — resumen de la aprobación del proyecto de ley del 6 de mayo de 2026 (fuente del sector, no publicada por el gobierno).'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'QA' AND ts.url = 'https://www.ey.com/en_gl/technical/tax-alerts/qatar-approves-draft-e-invoicing-law-and-implementing-regulations';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'EY-Steuerhinweis — Zusammenfassung der Genehmigung des Gesetzentwurfs vom 6. Mai 2026 (Branchenquelle, nicht behördlich veröffentlicht).'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'QA' AND ts.url = 'https://www.ey.com/en_gl/technical/tax-alerts/qatar-approves-draft-e-invoicing-law-and-implementing-regulations';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Alerte fiscale EY — résumé de l''approbation du projet de loi du 6 mai 2026 (source professionnelle, non publiée par le gouvernement).'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'QA' AND ts.url = 'https://www.ey.com/en_gl/technical/tax-alerts/qatar-approves-draft-e-invoicing-law-and-implementing-regulations';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.nbr.gov.bh',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'BH'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.nbr.gov.bh');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'National Bureau for Revenue (NBR) — general VAT administration; no e-invoicing mandate content, monitor for updates.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BH' AND ts.url = 'https://www.nbr.gov.bh';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Oficina Nacional de Ingresos (NBR) — administración general del IVA; sin contenido sobre un mandato de facturación electrónica, a vigilar.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BH' AND ts.url = 'https://www.nbr.gov.bh';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Nationale Steuerbehörde (NBR) — allgemeine Umsatzsteuerverwaltung; keine Inhalte zu einer E-Rechnungspflicht, zur Beobachtung.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BH' AND ts.url = 'https://www.nbr.gov.bh';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Bureau national des recettes (NBR) — administration générale de la TVA ; aucun contenu sur une obligation de facturation électronique, à surveiller.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BH' AND ts.url = 'https://www.nbr.gov.bh';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.fonoa.com/resources/blog/bahrain-eliminates-tax-authority-approval-requirement-for-e-invoice-issuance',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'BH'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.fonoa.com/resources/blog/bahrain-eliminates-tax-authority-approval-requirement-for-e-invoice-issuance');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Fonoa — summary of the Nov 2023 prior-approval removal (industry source, not government-published).'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BH' AND ts.url = 'https://www.fonoa.com/resources/blog/bahrain-eliminates-tax-authority-approval-requirement-for-e-invoice-issuance';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Fonoa — resumen de la eliminación del requisito de aprobación previa de noviembre de 2023 (fuente del sector, no publicada por el gobierno).'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BH' AND ts.url = 'https://www.fonoa.com/resources/blog/bahrain-eliminates-tax-authority-approval-requirement-for-e-invoice-issuance';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Fonoa — Zusammenfassung der Abschaffung der Vorabgenehmigung vom November 2023 (Branchenquelle, nicht behördlich veröffentlicht).'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BH' AND ts.url = 'https://www.fonoa.com/resources/blog/bahrain-eliminates-tax-authority-approval-requirement-for-e-invoice-issuance';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fonoa — résumé de la suppression de l''approbation préalable de novembre 2023 (source professionnelle, non publiée par le gouvernement).'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BH' AND ts.url = 'https://www.fonoa.com/resources/blog/bahrain-eliminates-tax-authority-approval-requirement-for-e-invoice-issuance';
