-- Lithuania + Malta: country rows + name translations. Two EU
-- member states (#65 and #66), added to the existing 'Europe'
-- region -- no region taxonomy change needed. Evaluated 10 Aug 2026
-- (see PROGRESS.md), Dan approved building both. Hand-written
-- following new_country_scaffold.py's output shape; INSERT OR
-- IGNORE throughout (idempotent).

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('LT', 'Lithuania', 'Europe', 'lithuania', 1);
INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('MT', 'Malta', 'Europe', 'malta', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Lithuania' FROM countries WHERE code = 'LT';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Lituania' FROM countries WHERE code = 'LT';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Litauen' FROM countries WHERE code = 'LT';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Lituanie' FROM countries WHERE code = 'LT';

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Malta' FROM countries WHERE code = 'MT';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Malta' FROM countries WHERE code = 'MT';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Malta' FROM countries WHERE code = 'MT';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Malte' FROM countries WHERE code = 'MT';
