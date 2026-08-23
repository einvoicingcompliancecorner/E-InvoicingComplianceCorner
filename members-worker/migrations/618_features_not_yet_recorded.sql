-- ================================================================
-- Three things shipped and were never written down, and one is dated
-- from the day it was built rather than the day anyone could use it.
-- ================================================================
--
-- Dan, 22 August 2026: "I'd like to add an email alert for new content
-- and functionality, which has not been announced to subscribers. This
-- should include the roi-calculator and the compliance guides."
--
-- The bookkeeping for that already exists -- `features` lists what
-- shipped, `announcements` records what has been told to whom -- and it
-- says nothing has ever been announced on any channel. It also does not
-- know about three of the things worth announcing, because nobody added
-- the row when they shipped. This fixes the data before anything is sent
-- from it: an announcement email is a poor place to discover that the
-- table it reads is incomplete.
--
-- ---- THE DATE ON THE ROI PLANNER WAS WRONG -------------------------
--
-- features.shipped_at is documented as "the day it went live". The
-- planner's row said 11 August, which is the day it was BUILT. It was
-- unreachable to readers until 19 August, when ROI_PUBLIC went true --
-- site-worker/wrangler.toml records that date and the reason. Between
-- those two dates the route answered 404 by design.
--
-- Left alone, the announcement email would tell subscribers a tool has
-- been available since a date on which it deliberately was not. Corrected
-- to the 19th.
--
-- ---- AND ONE TITLE WAS STORED AS MARKUP ----------------------------
--
-- The same row's title read "E-Invoicing ROI &amp; Wave Planner" --
-- HTML-escaped in the DATABASE, which only works while every consumer
-- forgets to escape it. The email being built now does escape, so it
-- would have gone out reading "ROI &amp;amp; Wave Planner" to every
-- subscriber. Data holds text; the renderer escapes. The assertion at
-- the foot of this file makes that a rule rather than a fix.
-- ================================================================

-- ---- the three that shipped without a row ---------------------------

INSERT OR IGNORE INTO features (slug, title, description, shipped_at) VALUES
  ('compliance-guides',
   'Build your own compliance guide',
   'Pick the countries you operate in and get one printable guide covering all of them: the headline mandate status for each, the dated milestones ahead, formats, archiving periods and signature rules, and the source behind every claim. Built on demand from the same data the tracker publishes, so it is current on the day you print it.',
   '2026-08-20'),
  ('methodology',
   'How we decide, and how we grade a source',
   'A citable page setting out what we require of a source, what each status word means, and where we are deliberately stricter than other trackers — being obliged to receive an e-invoice is not the same as being obliged to send one, and a draft bill with no date is not a plan. Every source we cite is now graded by who is answering: the jurisdiction''s own authority, an official body such as the European Commission, or someone reporting on the law rather than making it.',
   '2026-08-22'),
  ('change-record',
   'What changed, and what it said before',
   'Every change to the five headline facts we publish for a country — what it said before, when it changed, and why. A status cannot change on this site without the change being recorded.',
   '2026-08-22');

-- ---- the planner's date, and its title ------------------------------

UPDATE features
   SET shipped_at = '2026-08-19',
       title      = 'E-Invoicing ROI & Wave Planner'
 WHERE slug = 'roi-wave-planner';

-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM features = 8
-- ASSERT: SELECT shipped_at FROM features WHERE slug = 'roi-wave-planner' = '2026-08-19'
-- ASSERT: SELECT count(*) FROM features WHERE slug IN ('compliance-guides','methodology','change-record') = 3

-- NOTHING HAS BEEN ANNOUNCED YET, and this migration must not change
-- that. It prepares what an announcement would say; deciding to send one
-- is a separate, deliberate act performed by a human against production.
-- ASSERT: SELECT count(*) FROM announcements WHERE item_type = 'feature' = 0

-- DATA HOLDS TEXT, THE RENDERER ESCAPES. The planner's title was stored
-- as "&amp;", which reads correctly only in a consumer that forgets to
-- escape and reads "&amp;amp;" in one that does not. The email this was
-- written for escapes.
-- ASSERT ALWAYS: SELECT count(*) FROM features WHERE title LIKE '%&amp;%' OR title LIKE '%&lt;%' OR title LIKE '%&gt;%' OR title LIKE '%&quot;%' OR description LIKE '%&amp;%' OR description LIKE '%&lt;%' OR description LIKE '%&gt;%' OR description LIKE '%&quot;%' = 0

-- A feature with no shipped date cannot be ordered in an announcement,
-- and an announcement that lists things in an arbitrary order reads as
-- an unedited dump.
-- ASSERT ALWAYS: SELECT count(*) FROM features WHERE shipped_at IS NULL OR shipped_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' = 0
