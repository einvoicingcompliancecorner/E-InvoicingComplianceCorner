-- Ecuador: country row + name translations. Hand-written, following the
-- Indonesia (356_indonesia_country.sql) template. Ecuador's SRI
-- (Servicio de Rentas Internas) e-invoicing regime is a genuine, mature
-- Americas clearance-model mandate -- near-real-time transmission has
-- been the standing requirement since at least the 2014 resolution chain
-- (NAC-DGERCGC14-00790), not a January 2026 novelty. What actually
-- happened in January 2026 was the closure of a temporary 4-business-day
-- grace period granted in November 2024 during Ecuador's national
-- electrical-emergency/blackout crisis, reverting to the standing
-- immediate-transmission baseline -- see the milestones and deep-dive
-- content for the full framing. Live-researched via direct reads of
-- SRI's own resolution PDFs (sri.gob.ec) plus Primicias, El Comercio,
-- AVL Abogados, Sovos, and EDICOM.
--
-- Naming decision: name_en = 'Ecuador' (the standard English name used
-- by every research source checked, matching the world-atlas topology's
-- own spelling as far as could be confirmed -- no TOPO_NAME_OVERRIDES
-- entry expected to be needed).
--
-- Per-language translations: Spanish "Ecuador" (identical to English,
-- the standard Spanish form -- and Ecuador's own official language),
-- German "Ecuador" (identical, standard German usage), French
-- "Équateur" (the standard French exonym, note the acute accent) --
-- all verified against general usage.

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('EC', 'Ecuador', 'Americas', 'ecuador', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Ecuador' FROM countries WHERE code = 'EC';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Ecuador' FROM countries WHERE code = 'EC';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Ecuador' FROM countries WHERE code = 'EC';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Équateur' FROM countries WHERE code = 'EC';
