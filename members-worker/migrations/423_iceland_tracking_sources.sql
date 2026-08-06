-- Iceland tracking sources for /sources -- built now, per
-- ADDING-A-COUNTRY.md's step 4. All three URLs independently fetched
-- and confirmed live in this session. Iceland is EEA, not EU, but the
-- European Commission still publishes and maintains an eInvoicing
-- country sheet covering it (via EEA incorporation of the underlying
-- directive) -- confirmed live, so included here on the same basis as
-- an EU member's factsheet.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://island.is/reglugerdir/nr/0044-2019',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'IS'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://island.is/reglugerdir/nr/0044-2019');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'island.is — Regulation 44/2019 official text, the primary legal source for Iceland''s B2G e-invoicing requirement.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'IS' AND ts.url = 'https://island.is/reglugerdir/nr/0044-2019';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'island.is — texto oficial del Reglamento 44/2019, la fuente legal primaria del requisito de facturación electrónica B2G de Islandia.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'IS' AND ts.url = 'https://island.is/reglugerdir/nr/0044-2019';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'island.is — offizieller Text der Verordnung 44/2019, die primäre Rechtsquelle für Islands B2G-E-Rechnungspflicht.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'IS' AND ts.url = 'https://island.is/reglugerdir/nr/0044-2019';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'island.is — texte officiel du règlement 44/2019, la source juridique primaire de l''obligation de facturation électronique B2G de l''Islande.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'IS' AND ts.url = 'https://island.is/reglugerdir/nr/0044-2019';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://fjs.atlassian.net/wiki/spaces/FJS/pages/2059173935/Rafr+nir+reikningar',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'IS'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://fjs.atlassian.net/wiki/spaces/FJS/pages/2059173935/Rafr+nir+reikningar');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Fjarsysla rikisins (Financial Management Authority) — official guidance on receiving e-invoices for Icelandic state institutions.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'IS' AND ts.url = 'https://fjs.atlassian.net/wiki/spaces/FJS/pages/2059173935/Rafr+nir+reikningar';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Fjarsysla rikisins (Autoridad de Gestión Financiera) — orientación oficial sobre la recepción de facturas electrónicas para las instituciones estatales islandesas.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'IS' AND ts.url = 'https://fjs.atlassian.net/wiki/spaces/FJS/pages/2059173935/Rafr+nir+reikningar';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Fjarsysla rikisins (Finanzverwaltungsbehörde) — offizielle Hinweise zum Empfang elektronischer Rechnungen für isländische staatliche Institutionen.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'IS' AND ts.url = 'https://fjs.atlassian.net/wiki/spaces/FJS/pages/2059173935/Rafr+nir+reikningar';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fjarsysla rikisins (Autorité de gestion financière) — orientations officielles sur la réception des factures électroniques pour les institutions étatiques islandaises.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'IS' AND ts.url = 'https://fjs.atlassian.net/wiki/spaces/FJS/pages/2059173935/Rafr+nir+reikningar';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983581/2025+Iceland+2025+eInvoicing+Country+Sheet',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'IS'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url LIKE '%digital-building-blocks%');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission''s country factsheet for Iceland — legal framework and mandate status, self-flagged "NO VERIFICATION" by its own reviewer as of its last update, so treat with a little more caution than a fully-reviewed EU member factsheet.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'IS' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de la Comisión Europea para Islandia — marco legal y estado del mandato, marcada por su propio revisor como "SIN VERIFICAR" en su última actualización, por lo que conviene tratarla con algo más de cautela que una ficha de un Estado miembro de la UE plenamente revisada.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'IS' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Länderfactsheet der Europäischen Kommission für Island — Rechtsrahmen und Pflichtstatus, vom eigenen Prüfer bei der letzten Aktualisierung als "NICHT VERIFIZIERT" gekennzeichnet, daher mit etwas mehr Vorsicht zu behandeln als ein vollständig geprüftes Factsheet eines EU-Mitgliedstaats.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'IS' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays de la Commission européenne pour l''Islande — cadre juridique et statut de l''obligation, signalée « NON VÉRIFIÉE » par son propre relecteur lors de sa dernière mise à jour, à traiter donc avec un peu plus de prudence qu''une fiche pleinement revue d''un État membre de l''UE.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'IS' AND ts.url LIKE '%digital-building-blocks%';
