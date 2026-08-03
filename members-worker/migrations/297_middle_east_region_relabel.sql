-- Relabel the "Middle East" region to "Middle East / North Africa",
-- per Dan's request (3 August 2026), made alongside adding Turkey to
-- Europe. The internal region string doubles as the display heading
-- in two different ways across this site: the tracker/subscribe/map
-- UIs translate it via a regionNames lookup keyed on this exact
-- string (namespace='regions' in the generic `translations` table --
-- see members-worker/migrations/002_backfill_countries.sql's own
-- header comment for why it lives there instead of a dedicated
-- table), while /sources (site-worker/src/index.js) renders the raw
-- `countries.region` column value directly with no translation layer
-- at all. Relabeling only the display value in one of those two
-- places would leave the other showing the old "Middle East" text --
-- so this migration renames the canonical region string itself,
-- everywhere it's the join/lookup key, not just its translated value:
--
-- 1. `translations` (namespace='regions'): the key changes from
--    'Middle East' to 'Middle East / North Africa' in all 4 languages,
--    and the value is updated to a real regional label per language
--    (not just the English text copy-pasted) -- "Oriente Medio / Norte
--    de África" (es), "Naher Osten / Nordafrika" (de), "Moyen-Orient /
--    Afrique du Nord" (fr).
-- 2. `countries.region`: every country currently in 'Middle East'
--    (Egypt, Israel, Jordan, Oman, Saudi Arabia, United Arab Emirates)
--    moves to the new string. This is what /sources actually displays,
--    and what feeds every CASE-based region sort order elsewhere.
--
-- Both statements are safe to re-run -- the WHERE clauses stop
-- matching once applied. The matching hand-edits to static files
-- (countries.js, shared/map-data.mjs, site-worker/src/index.js,
-- members-worker/src/index.js, i18n/*.json, the tracker's embedded
-- DATA fallback) are a separate, non-D1 commit -- this migration only
-- covers the D1 side of the rename.

UPDATE translations
SET key = 'Middle East / North Africa', value = 'Middle East / North Africa'
WHERE namespace = 'regions' AND key = 'Middle East' AND lang = 'en' AND value = 'Middle East';

UPDATE translations
SET key = 'Middle East / North Africa', value = 'Oriente Medio / Norte de África'
WHERE namespace = 'regions' AND key = 'Middle East' AND lang = 'es' AND value = 'Oriente Medio';

UPDATE translations
SET key = 'Middle East / North Africa', value = 'Naher Osten / Nordafrika'
WHERE namespace = 'regions' AND key = 'Middle East' AND lang = 'de' AND value = 'Naher Osten';

UPDATE translations
SET key = 'Middle East / North Africa', value = 'Moyen-Orient / Afrique du Nord'
WHERE namespace = 'regions' AND key = 'Middle East' AND lang = 'fr' AND value = 'Moyen-Orient';

UPDATE countries
SET region = 'Middle East / North Africa'
WHERE region = 'Middle East';
