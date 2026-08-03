-- "Sources of truth" registry: the official reference URLs monitored
-- for announcements and notifications, per tracked country. Rendered
-- publicly at /sources (site-worker, D1 at request time — no asset
-- file, so no run_worker_first needed), and designed to double as the
-- input table for the future content-monitoring Worker
-- (CONTENT-MONITORING.md): `active` exists for that consumer, so a
-- source can be paused for monitoring without vanishing from the page.
--
-- Seeded from deep_dive_portals — the already-curated official portal
-- per country with 4-language labels — so the page launches populated
-- for all 33 countries. Curation from here happens in THIS table;
-- deep_dive_portals remains the deep-dive pages' own display list and
-- the two may diverge deliberately (monitoring wants announcement/news
-- pages; deep dives want onboarding portals).

CREATE TABLE IF NOT EXISTS tracking_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_tracking_sources_country ON tracking_sources (country_id, sort_order);

CREATE TABLE IF NOT EXISTS tracking_source_translations (
  source_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (source_id, lang)
);

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT country_id, url, sort_order FROM deep_dive_portals ORDER BY country_id, sort_order;

INSERT INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, dpt.lang, dpt.label
FROM tracking_sources ts
JOIN deep_dive_portals dp ON dp.country_id = ts.country_id AND dp.url = ts.url
JOIN deep_dive_portal_translations dpt ON dpt.portal_id = dp.id;
