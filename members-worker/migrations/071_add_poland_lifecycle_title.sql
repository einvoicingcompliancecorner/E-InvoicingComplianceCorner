-- Targeted fix for Poland, mirroring 070: the title column now exists
-- (added by 070, which is schema-wide, not per-country), but Poland's
-- own title value was never set -- 070 only updated France's row.
-- Poland's other content (8 milestones, deep-dive content, lifecycle
-- statuses, translations) is already confirmed live, so this is the
-- only remaining gap.
UPDATE deep_dive_lifecycle_intro_translations
SET title = 'Offline modes & QR codes'
WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Poland') AND lang = 'en';

UPDATE deep_dive_lifecycle_intro_translations
SET title = 'Modos sin conexión y códigos QR'
WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Poland') AND lang = 'es';

UPDATE deep_dive_lifecycle_intro_translations
SET title = 'Offline-Modi & QR-Codes'
WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Poland') AND lang = 'de';

UPDATE deep_dive_lifecycle_intro_translations
SET title = 'Modes hors ligne et codes QR'
WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Poland') AND lang = 'fr';
