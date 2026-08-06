-- Kazakhstan + Dominican Republic: country rows + name translations.
-- Hand-written following new_country_scaffold.py's output shape;
-- INSERT OR IGNORE throughout (idempotent). Kazakhstan placed in
-- Asia-Pacific per explicit user instruction (map + grouping).
-- Dominican Republic placed in Americas, consistent with this
-- tracker's existing Latin American/Caribbean coverage (Colombia,
-- Argentina, Peru, Chile, Mexico, Costa Rica, Ecuador, Uruguay).

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('KZ', 'Kazakhstan', 'Asia-Pacific', 'kazakhstan', 1);
INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('DO', 'Dominican Republic', 'Americas', 'dominican-republic', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Kazakhstan' FROM countries WHERE code = 'KZ';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Kazajistán' FROM countries WHERE code = 'KZ';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Kasachstan' FROM countries WHERE code = 'KZ';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Kazakhstan' FROM countries WHERE code = 'KZ';

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Dominican Republic' FROM countries WHERE code = 'DO';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'República Dominicana' FROM countries WHERE code = 'DO';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Dominikanische Republik' FROM countries WHERE code = 'DO';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'République dominicaine' FROM countries WHERE code = 'DO';
