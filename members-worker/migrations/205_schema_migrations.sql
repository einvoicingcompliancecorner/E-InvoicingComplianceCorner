-- Migration bookkeeping (the long-planned "Stage 1" of the
-- country-adding rework): records which migration files have been
-- applied to this database, so the apply_migrations.py runner can
-- compute what's pending, refuse double-applies (which genuinely
-- duplicate rows on the autoincrement-PK content tables -- see the
-- Luxembourg 193 near-miss in PROGRESS.md), and detect edited-after-
-- apply files via checksum. Existing databases get their history
-- recorded via the runner's --baseline mode rather than replaying.

CREATE TABLE IF NOT EXISTS schema_migrations (
  name TEXT PRIMARY KEY,          -- migration filename, e.g. '199_peru_stories.sql'
  checksum TEXT NOT NULL,         -- sha256 of the file content at apply time
  applied_at TEXT NOT NULL        -- ISO timestamp (UTC)
);
