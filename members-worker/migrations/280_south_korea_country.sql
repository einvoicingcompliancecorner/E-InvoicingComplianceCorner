-- South Korea: country row + name translations. Generated in the same
-- shape as new_country_scaffold.py's output; INSERT OR IGNORE
-- throughout (idempotent). South Korea is the recommended first build
-- from the Asia-Pacific coverage evaluation -- the e-Tax Invoice
-- system has been mandatory for all corporations since January 2011,
-- 15 years in force, the most mature mandate found in that
-- evaluation.

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('KR', 'South Korea', 'Asia-Pacific', 'south-korea', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'South Korea' FROM countries WHERE code = 'KR';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Corea del Sur' FROM countries WHERE code = 'KR';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Südkorea' FROM countries WHERE code = 'KR';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Corée du Sud' FROM countries WHERE code = 'KR';
