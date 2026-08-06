-- Serbia + Latvia: country rows + name translations. Hand-written
-- following new_country_scaffold.py's output shape; INSERT OR IGNORE
-- throughout (idempotent). Both are placed in the "Europe" region,
-- matching this tracker's existing treatment of non-EU European
-- jurisdictions (Norway, Iceland, United Kingdom, Turkey).

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('RS', 'Serbia', 'Europe', 'serbia', 1);
INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('LV', 'Latvia', 'Europe', 'latvia', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Serbia' FROM countries WHERE code = 'RS';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Serbia' FROM countries WHERE code = 'RS';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Serbien' FROM countries WHERE code = 'RS';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Serbie' FROM countries WHERE code = 'RS';

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Latvia' FROM countries WHERE code = 'LV';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Letonia' FROM countries WHERE code = 'LV';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Lettland' FROM countries WHERE code = 'LV';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Lettonie' FROM countries WHERE code = 'LV';
