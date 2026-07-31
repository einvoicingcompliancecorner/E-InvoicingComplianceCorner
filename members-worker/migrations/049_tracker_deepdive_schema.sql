-- Schema for the tracker's dynamic milestones and deep-dive page content.
-- Milestones are shared between the tracker's own timeline and each
-- country's deep-dive page timeline section, since they're the same
-- underlying events -- one entry updates both places at once.

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  country_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  anchor INTEGER DEFAULT 0,
  source_url TEXT,
  FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS milestone_translations (
  milestone_id TEXT NOT NULL,
  lang TEXT NOT NULL,
  system TEXT NOT NULL,
  desc TEXT NOT NULL,
  actions TEXT NOT NULL,
  PRIMARY KEY (milestone_id, lang),
  FOREIGN KEY (milestone_id) REFERENCES milestones(id)
);

-- Deep-dive page: top-level per-country content (header eyebrow line,
-- footer disclaimer). Stable, rarely-changing per-country prose.
CREATE TABLE IF NOT EXISTS deep_dive_pages (
  country_id INTEGER PRIMARY KEY,
  last_updated TEXT,
  FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS deep_dive_page_translations (
  country_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  compliance_model TEXT NOT NULL,
  footer_disclaimer TEXT NOT NULL,
  PRIMARY KEY (country_id, lang)
);

-- Stat strip: 4-6 short number+label pairs per country
CREATE TABLE IF NOT EXISTS deep_dive_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS deep_dive_stat_translations (
  stat_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  stat_value TEXT NOT NULL,
  stat_label TEXT NOT NULL,
  PRIMARY KEY (stat_id, lang),
  FOREIGN KEY (stat_id) REFERENCES deep_dive_stats(id)
);

-- Spec/related cards: file format, scope & transmission, penalties &
-- related sections. 'rows_json' holds k/v pairs for spec-style cards;
-- 'body' holds prose for related-card style entries. A card uses one
-- or the other, not both.
CREATE TABLE IF NOT EXISTS deep_dive_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id INTEGER NOT NULL,
  section TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS deep_dive_card_translations (
  card_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  title TEXT NOT NULL,
  rows_json TEXT,
  note TEXT,
  body TEXT,
  PRIMARY KEY (card_id, lang),
  FOREIGN KEY (card_id) REFERENCES deep_dive_cards(id)
);

-- Getting-compliant steps
CREATE TABLE IF NOT EXISTS deep_dive_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS deep_dive_step_translations (
  step_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (step_id, lang),
  FOREIGN KEY (step_id) REFERENCES deep_dive_steps(id)
);

-- Official portal links
CREATE TABLE IF NOT EXISTS deep_dive_portals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS deep_dive_portal_translations (
  portal_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  label TEXT NOT NULL,
  PRIMARY KEY (portal_id, lang),
  FOREIGN KEY (portal_id) REFERENCES deep_dive_portals(id)
);
