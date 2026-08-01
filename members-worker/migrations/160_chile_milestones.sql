-- Chile milestones (Stage 4 deep-dive/tracker migration)
-- 4 total: 2 deep-dive-only + 2 tracker-matched (cl-established, cl-digital-delivery).
-- cl-established is a topical match with a date discrepancy: the tracker claims
-- "in force since 2018" while the deep-dive's own stat-strip states "2014 -- Mandatory
-- for all VAT taxpayers" for the same underlying milestone. The deep-dive's date (2014)
-- was used for internal page consistency, while the tracker's own system/desc/actions
-- phrasing still wins, per the established tracker-phrasing-wins rule.
-- cl-digital-delivery is a straightforward exact date/event match.

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url) SELECT 'cl-sii-pilot-2000s', id, '2000-01-01', 0, NULL FROM countries WHERE name_en = 'Chile';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('cl-sii-pilot-2000s', 'en', 'SII pilots DTE with large taxpayers', 'Chile''s Servicio de Impuestos Internos begins testing electronic tax documents on a voluntary basis with the country''s largest taxpayers, ahead of any general mandate.', '[]');
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url) SELECT 'cl-established', id, '2014-01-01', 1, 'https://www.sii.cl' FROM countries WHERE name_en = 'Chile';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('cl-established', 'en', 'Electronic Tax Documents (DTE) mandatory for all businesses (in force since 2018)', 'All Chilean businesses must issue Documentos Tributarios Electrónicos (DTE) — including facturas (B2B) and boletas (B2C) — validated by the Servicio de Impuestos Internos (SII).', '["Confirm your DTE issuance system is authorised and connected to the SII", "For sales above 135 UF, boleta electrónica must identify the buyer by RUT and name"]');
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url) SELECT 'cl-boleta-2021', id, '2021-01-01', 0, NULL FROM countries WHERE name_en = 'Chile';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('cl-boleta-2021', 'en', 'Boleta Electrónica mandatory under Ley 21.210', 'The electronic consumer receipt (used for B2C retail transactions) becomes mandatory economy-wide, issued from point-of-sale systems with SII certification.', '[]');
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url) SELECT 'cl-digital-delivery', id, '2026-03-01', 0, 'https://www.sii.cl' FROM countries WHERE name_en = 'Chile';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('cl-digital-delivery', 'en', 'Digital delivery of boleta electrónica required where no printer is available', 'Businesses without printing capability must deliver the boleta electrónica digitally — by email, SMS, WhatsApp, QR code, or another equivalent electronic channel — rather than skip delivery altogether.', '["If you lack point-of-sale printing, set up an electronic delivery channel now (email/SMS/QR)", "Businesses with printers must still generally deliver the printed representation"]');
