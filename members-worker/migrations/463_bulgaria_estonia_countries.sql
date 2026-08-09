-- Bulgaria + Estonia: country rows + name translations. Two EU
-- member states (#63 and #64), added to the existing 'Europe'
-- region -- no region taxonomy change needed (unlike Kenya/Nigeria's
-- Middle East / Africa widening). Hand-written following
-- new_country_scaffold.py's output shape; INSERT OR IGNORE
-- throughout (idempotent).

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('BG', 'Bulgaria', 'Europe', 'bulgaria', 1);
INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('EE', 'Estonia', 'Europe', 'estonia', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Bulgaria' FROM countries WHERE code = 'BG';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Bulgaria' FROM countries WHERE code = 'BG';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Bulgarien' FROM countries WHERE code = 'BG';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Bulgarie' FROM countries WHERE code = 'BG';

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Estonia' FROM countries WHERE code = 'EE';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Estonia' FROM countries WHERE code = 'EE';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Estland' FROM countries WHERE code = 'EE';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Estonie' FROM countries WHERE code = 'EE';
