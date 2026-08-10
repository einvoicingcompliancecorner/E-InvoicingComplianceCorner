-- ================================================================
-- Announcement tracking: `features` + `announcements`.
--
-- Dan's ask (10 Aug 2026): "flag news articles with an 'announced'
-- flag, and perhaps a 'date of announcement'. The same with new
-- content that we add, such as whitepapers and insights, or new
-- features... so that if we add new content... We know if it has been
-- announced, and when. We can then skip these in subsequent
-- announcements as we know they have been communicated. The email
-- digest would include anything not yet announced."
--
-- WHY A TABLE RATHER THAN FLAGS ON EACH ROW. A boolean + date on
-- `stories` and `articles` was the other option and was considered.
-- The table wins on four counts: (1) it keeps a dated history rather
-- than a single overwritable bit; (2) it supports more than one
-- channel per item, which a flag cannot express without lying the
-- first time something is posted to LinkedIn but not emailed;
-- (3) `features` had no table at all to add a column to; and (4) it
-- adds no columns to two tables that are already read on hot public
-- paths.
--
-- WHY `channel` IS UNCONSTRAINED TEXT. Every other enum-ish column in
-- this schema (articles.type, milestones.mandate_scope) uses a CHECK
-- constraint, so this is a deliberate departure. Channels are the one
-- axis here that is expected to grow on a whim -- adding Bluesky, or
-- an ad-hoc "mentioned in a talk", should not require a schema
-- migration and a deploy. Conventional values are documented below;
-- keep to them so queries stay predictable.
--   'newsletter' -- the monthly subscriber email (written automatically
--                   by sendMonthlyNotifications, see src/index.js)
--   'linkedin'   -- posted to LinkedIn
--   anything else you like, recorded by hand
--
-- This table is DETECTION-ADJACENT, not publishing. Consistent with
-- CONTENT-MONITORING.md's framing section: nothing here ever decides
-- to announce something. It records that a human did, and the weekly
-- digest reads it back to say "these are still waiting."
-- ================================================================

-- Features have no home in D1 today -- they exist only as prose in
-- PROGRESS.md. This gives them a minimal one, so "we shipped The Map"
-- is a first-class trackable item alongside a story or a whitepaper,
-- and so a public changelog page could read from it later without
-- another migration.
CREATE TABLE IF NOT EXISTS features (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,          -- one or two sentences, plain language, reader-facing
  shipped_at  TEXT NOT NULL,          -- ISO date, the day it went live
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_features_shipped ON features(shipped_at);

CREATE TABLE IF NOT EXISTS announcements (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type    TEXT NOT NULL CHECK (item_type IN ('story', 'article', 'feature')),
  -- The referenced row's primary key, always stored as TEXT because the
  -- three sources disagree on type: stories.id is a TEXT slug,
  -- articles.id and features.id are INTEGERs. No foreign key for the
  -- same reason -- SQLite cannot express a polymorphic one. The digest
  -- query JOINs per type, so a dangling row is inert rather than
  -- dangerous; it simply stops matching anything.
  item_id      TEXT NOT NULL,
  channel      TEXT NOT NULL,
  announced_at TEXT NOT NULL,         -- ISO date or datetime
  note         TEXT,                  -- optional: a post URL, or why it was skipped
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (item_type, item_id, channel)
);

-- The digest's "what is still unannounced" query looks up by
-- (item_type, item_id) for every candidate item, so index that pair.
CREATE INDEX IF NOT EXISTS idx_announcements_item ON announcements(item_type, item_id);

-- ----------------------------------------------------------------
-- Seed: a starting set of genuinely user-visible features shipped in
-- the last week, so the mechanism has something real to show on its
-- first run rather than an empty section.
--
-- These are deliberately seeded WITHOUT announcement rows, which means
-- they will appear in the next digest as "not yet announced." If any
-- of them has in fact already been talked about, record it and it will
-- drop out -- that is the intended workflow, not a bug:
--
--   INSERT INTO announcements (item_type, item_id, channel, announced_at)
--   SELECT 'feature', id, 'linkedin', '2026-08-11' FROM features WHERE slug = 'the-map';
--
-- Nothing older than 3 Aug is backfilled on purpose. Reaching further
-- back would open the first digest with a wall of stale items that are
-- either long since announced or no longer worth announcing, which is
-- exactly the "reads like a list of things to do" problem this whole
-- change is meant to fix.
-- ----------------------------------------------------------------
INSERT OR IGNORE INTO features (slug, title, description, shipped_at) VALUES
  ('the-map',
   'The Map — e-invoicing mandates worldwide, visually',
   'An interactive world map showing every tracked jurisdiction colour-coded by mandate status: in force, upcoming, B2G-only, or no mandate yet. Available as its own page and inside the tracker, with a live "latest updates" news panel alongside it.',
   '2026-08-03'),
  ('archive-country-filter',
   'Filter the newsletter archive by country',
   'The newsletter archive gained a country dropdown, plus a one-click "show my subscribed countries" option for signed-in subscribers that applies every country you follow at once.',
   '2026-08-04'),
  ('insights-and-whitepapers',
   'Insights & Whitepapers',
   'A new section for longer-form owned research, starting with the CTC rollouts whitepaper. Teasers are public and indexable; the full pieces sit behind a free subscriber sign-in.',
   '2026-08-04'),
  ('tracker-due-soon-default',
   'The tracker now opens on what is due soon',
   'The "Recent & Upcoming" board defaults to deadlines falling in the next 90 days, instead of showing everything at once, so the first thing you see is what is actually close.',
   '2026-08-05');

-- ----------------------------------------------------------------
-- Baseline backfill: everything that already went out.
--
-- Without this, the very first digest would open with roughly thirty
-- newsletter stories listed as "never announced" — which is both
-- untrue and precisely the wall-of-tasks tone this whole change is
-- meant to remove.
--
-- The rule is deliberately conservative and only claims what is
-- demonstrably true: the monthly notification job sends on the 1st of
-- each month and covers that month's stories, so every story in a
-- month BEFORE the current one (2026-08) was covered by a send that
-- has already happened. Those get a 'newsletter' record dated to the
-- 1st of the month after publication.
--
-- Explicitly NOT backfilled:
--   * August 2026 stories — the 1 Aug send predates most of them, so
--     claiming they were announced would be false. They are queued for
--     the 1 Sep send and the digest deliberately stays quiet about the
--     current month for exactly that reason.
--   * ANY 'linkedin' record — this system has no idea what was posted
--     socially, and inventing that would poison the one signal the
--     digest exists to give.
--   * The seeded features and the whitepaper above — those are real
--     candidates and should appear in the first digest.
-- ----------------------------------------------------------------
INSERT OR IGNORE INTO announcements (item_type, item_id, channel, announced_at, note)
SELECT 'story',
       s.id,
       'newsletter',
       date(s.month || '-01', '+1 month'),
       'baseline backfill (migration 503): covered by the monthly subscriber email for ' || s.month
  FROM stories s
 WHERE s.published = 1
   AND s.month < '2026-08';
