-- Turkey: country row + name translations. Added to Europe per Dan's
-- explicit instruction (3 August 2026) -- Turkey is transcontinental
-- and this tracker's "Middle East" region (relabeled "Middle East /
-- North Africa" in migration 297) is MENA-flavored, so Dan chose
-- Europe rather than either MENA or a new region. Turkey surfaced as
-- a genuine new candidate in the same day's Middle East rollout
-- recheck (see PROGRESS.md) -- not because it's Middle Eastern, but
-- because it's the most mature, best-documented mandate not yet on
-- this tracker: e-Fatura has been mandatory since 1 April 2014.
--
-- World-atlas topology check (Phase 1 step 6): vendor/countries-50m.json
-- already spells this country exactly "Turkey", matching name_en --
-- no TOPO_NAME_OVERRIDES entry needed. Full-size country geometry, so
-- no MARKER_LONLAT_OVERRIDES fallback needed either. Turkey's real
-- extent (roughly 26-45 deg E) does exceed the Europe region's current
-- REGION_BOUNDS box in shared/map-data.mjs (east edge was 35 deg E) --
-- widened as part of this same static-file commit so Turkey's shape
-- isn't clipped on The Map's Europe tab.

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('TR', 'Turkey', 'Europe', 'turkey', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Turkey' FROM countries WHERE code = 'TR';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Turquía' FROM countries WHERE code = 'TR';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Türkei' FROM countries WHERE code = 'TR';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Turquie' FROM countries WHERE code = 'TR';
