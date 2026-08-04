-- Taiwan: country row + name translations. Mirrors the shape produced by
-- new_country_scaffold.py; INSERT OR IGNORE throughout (idempotent).

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('TW', 'Taiwan', 'Asia-Pacific', 'taiwan', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Taiwan' FROM countries WHERE code = 'TW';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Taiwán' FROM countries WHERE code = 'TW';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Taiwan' FROM countries WHERE code = 'TW';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Taïwan' FROM countries WHERE code = 'TW';
