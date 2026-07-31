-- Targeted fix: your live database already has everything for France
-- (milestones, deep-dive content, lifecycle intro/statuses, milestone
-- translations all confirmed applied) except the 'title' column on
-- deep_dive_lifecycle_intro_translations, which didn't exist in the
-- version of 057 you ran before the title fix was added. This adds
-- just the missing column and backfills France's title in all 4
-- languages -- nothing else needs to be re-run.
ALTER TABLE deep_dive_lifecycle_intro_translations ADD COLUMN title TEXT;

UPDATE deep_dive_lifecycle_intro_translations
SET title = 'Lifecycle status exchange'
WHERE country_id = (SELECT id FROM countries WHERE name_en = 'France') AND lang = 'en';

UPDATE deep_dive_lifecycle_intro_translations
SET title = 'Intercambio de estados del ciclo de vida'
WHERE country_id = (SELECT id FROM countries WHERE name_en = 'France') AND lang = 'es';

UPDATE deep_dive_lifecycle_intro_translations
SET title = 'Austausch von Lebenszyklusstatus'
WHERE country_id = (SELECT id FROM countries WHERE name_en = 'France') AND lang = 'de';

UPDATE deep_dive_lifecycle_intro_translations
SET title = 'Échange des statuts de cycle de vie'
WHERE country_id = (SELECT id FROM countries WHERE name_en = 'France') AND lang = 'fr';
