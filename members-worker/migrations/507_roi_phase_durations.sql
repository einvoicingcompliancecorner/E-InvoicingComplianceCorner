-- ================================================================
-- ROI planner: revised phase durations.
--
-- Dan, 12 Aug 2026: "can you also set 1 week mobilisation, 3 week build
-- and 4 week contracting as default. parallel workstreams can be set to
-- 5."
--
--   mobilise   2 -> 1 weeks
--   build      2 -> 3 weeks
--   contract   6 -> 4 weeks
--
-- (Parallel workstreams 2 -> 5 is a code change, not a migration: it is
-- not a phase, so it has no roi_phases row. It lives in the DEFAULTS
-- registry in shared/roi-render.mjs.)
--
-- These are Dan's practitioner estimates and supersede his own earlier
-- ones from the build (1-2 / 2 / 2 / 1), which in turn superseded my
-- first attempt at ERP-programme scale — roughly 4x too long and it
-- produced a misleadingly bleak picture. The direction of travel is
-- consistent and worth stating: an e-invoicing country rollout onto an
-- existing platform is a short, IT-weighted track. Mobilisation is
-- lighter than a full programme's, build is where the real work is, and
-- procurement is faster than a first-time enterprise purchase.
--
-- NET EFFECT ON A COUNTRY TRACK: 7 weeks unchanged (1+2+3+1 vs 2+2+2+1)
-- — mobilisation loses the week that build gains. What actually moves is
-- the PROGRAMME-LEVEL front end: contracting drops 6 -> 4, so the whole
-- plan shifts two weeks later and every wave gains two weeks of runway
-- before it turns red. That is the change that matters here, and it is
-- easy to miss because the per-country arithmetic is a wash.
--
-- WHY UPDATE AND NOT INSERT OR IGNORE. These rows exist (505 created
-- them), so an INSERT OR IGNORE would match nothing and leave the old
-- durations in place with no error and no log line. That exact failure
-- put this project's jurisdiction count two days stale in production
-- when 470/480/490 all silently matched zero rows. Guarding on the
-- natural key (roi_phases.key) rather than an autoincremented id keeps
-- this correct regardless of insertion order.
--
-- ONE-SOURCE-OF-TRUTH FIX SHIPS WITH THIS. Until today the panel's HTML
-- carried these durations as hardcoded `value="2"` attributes while the
-- DEFAULTS registry read them from D1. The two agreed only because
-- someone had kept them in step by hand — so this migration on its own
-- would have changed what "Reset all to defaults" restores and what
-- counts as an override, WITHOUT changing the number a visitor sees on
-- load. Half a migration, silently. shared/roi-render.mjs now renders
-- every opening value from the registry, so D1 is authoritative end to
-- end; this migration and that code change must deploy together.
-- ================================================================

UPDATE roi_phases SET default_weeks = 1 WHERE key = 'mobilise';
UPDATE roi_phases SET default_weeks = 3 WHERE key = 'build';
UPDATE roi_phases SET default_weeks = 4 WHERE key = 'contract';

-- Keep the phase note honest: it quoted the old 1-2 week estimate.
UPDATE roi_phase_translations SET note =
  'Per country. Team stood up, scope confirmed with the local finance and tax owners, access arranged to that country''s ERP instance. Practitioner estimate of one week for an e-invoicing rollout onto a platform that is already in place — not an ERP-programme mobilisation, which is several times longer.'
WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'mobilise');

UPDATE roi_phase_translations SET note =
  'Per country. Configure and integrate — connector, transformation, validation, error handling. The longest of the technical phases, and the one where the real work sits. Scales with complexity and system count exactly as design does, since the two move together.'
WHERE lang = 'en' AND phase_id = (SELECT id FROM roi_phases WHERE key = 'build');
