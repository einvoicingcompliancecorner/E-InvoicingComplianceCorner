-- Two new deep-dive content types, added after France's page revealed
-- genuine structural variety beyond what Portugal's page needed:
-- invoice lifecycle status pills, and a real tabular penalty schedule
-- (as opposed to narrative-only related-cards, which stay available
-- for countries without a formal fine schedule to cite).

CREATE TABLE IF NOT EXISTS deep_dive_lifecycle_statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  is_special INTEGER DEFAULT 0,
  FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS deep_dive_lifecycle_status_translations (
  status_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  label TEXT NOT NULL,
  PRIMARY KEY (status_id, lang),
  FOREIGN KEY (status_id) REFERENCES deep_dive_lifecycle_statuses(id)
);

CREATE TABLE IF NOT EXISTS deep_dive_lifecycle_intro (
  country_id INTEGER PRIMARY KEY,
  FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS deep_dive_lifecycle_intro_translations (
  country_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  intro_text TEXT NOT NULL,
  PRIMARY KEY (country_id, lang),
  FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS deep_dive_penalty_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS deep_dive_penalty_row_translations (
  row_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  failure_description TEXT NOT NULL,
  fine_amount TEXT,
  annual_cap TEXT,
  PRIMARY KEY (row_id, lang),
  FOREIGN KEY (row_id) REFERENCES deep_dive_penalty_rows(id)
);
