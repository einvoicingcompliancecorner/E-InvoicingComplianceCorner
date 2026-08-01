-- Italy milestones (Stage 4 deep-dive/tracker migration)
-- 4 total, matching the static page's 4 timeline rcards.
-- 1 tracker-matched (it-sdi): the tracker's 2019-01-01 date is more specific than the
-- deep-dive's bare '2017 -> 2019' range card for the same rollout-completion milestone,
-- so the tracker's date is used; tracker phrasing wins as usual. anchor=1 to match the
-- tracker's own anchor:true. The other 3 are deep-dive-only.

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url) SELECT 'it-b2g-2014', id, '2014-01-01', 0, NULL FROM countries WHERE name_en = 'Italy';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('it-b2g-2014', 'en', 'Phase 0 — FatturaPA mandatory for B2G via SDI', 'Italy pioneers e-invoicing for government suppliers, establishing the technical infrastructure, XML format, and clearance model that would later extend to the entire domestic economy.', '[]');
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url) SELECT 'it-sdi', id, '2019-01-01', 1, 'https://www.agenziaentrate.gov.it/portale/web/english/electronic-invoicing' FROM countries WHERE name_en = 'Italy';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('it-sdi', 'en', 'Mandatory B2B/B2C e-invoicing via SDI (in force since 2019)', 'Italy was the first EU member state to mandate clearance-model e-invoicing for essentially all domestic transactions — B2B, B2C and B2G — through the Sistema di Interscambio (SDI), using the FatturaPA XML format.', '["Confirm your FatturaPA generation and SDI transmission channel (PEC, FTP, or web service) remain active", "Monitor for EN 16931/ViDA alignment changes ahead of Italy''s SDI derogation renewal (through 2027) and the 2035 EU-wide harmonisation deadline"]');
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url) SELECT 'it-v191-published', id, '2026-03-31', 0, NULL FROM countries WHERE name_en = 'Italy';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('it-v191-published', 'en', 'FatturaPA v1.9.1 published', 'The Agenzia delle Entrate issues an updated technical specification: revised code lists, tighter validation controls, and updated field definitions.', '[]');
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url) SELECT 'it-v191-mandatory', id, '2026-05-15', 0, NULL FROM countries WHERE name_en = 'Italy';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('it-v191-mandatory', 'en', 'Compliance with v1.9.1 becomes mandatory', 'From this date, the SDI rejects any invoice that doesn''t conform to the new specification — a firm compliance milestone, not a soft target, given SDI''s zero-tolerance validation model.', '["Validate against FatturaPA v1.9.1 specifically -- anything still targeting an older version will be rejected outright"]');
