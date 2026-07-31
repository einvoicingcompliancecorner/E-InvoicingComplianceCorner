-- Generalizes the lifecycle-pills infrastructure from one-per-country to
-- many-per-country, needed because Malaysia has two genuinely separate
-- pill-list cards in the same section ("Submission methods" and
-- "Validation lifecycle"), which the original country_id-keyed design
-- couldn't support. New tables; the old ones are left in place
-- (unused going forward) rather than dropped, since France and Poland's
-- existing live data needs migrating into this new structure, not lost.

CREATE TABLE IF NOT EXISTS deep_dive_lifecycle_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id INTEGER NOT NULL,
  section TEXT NOT NULL DEFAULT 'scope_transmission',
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS deep_dive_lifecycle_card_translations (
  card_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  title TEXT,
  intro_text TEXT,
  outro_text TEXT,
  PRIMARY KEY (card_id, lang),
  FOREIGN KEY (card_id) REFERENCES deep_dive_lifecycle_cards(id)
);

CREATE TABLE IF NOT EXISTS deep_dive_lifecycle_statuses_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  is_special INTEGER DEFAULT 0,
  FOREIGN KEY (card_id) REFERENCES deep_dive_lifecycle_cards(id)
);

CREATE TABLE IF NOT EXISTS deep_dive_lifecycle_status_v2_translations (
  status_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  label TEXT NOT NULL,
  PRIMARY KEY (status_id, lang),
  FOREIGN KEY (status_id) REFERENCES deep_dive_lifecycle_statuses_v2(id)
);
