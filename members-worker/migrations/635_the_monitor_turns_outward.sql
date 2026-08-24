-- ================================================================
-- The content monitor stops watching a list and starts watching
-- the evidence.
-- ================================================================
--
-- Dan, 24 August 2026: "Please can you look at 'The content monitor
-- turned outward'."
--
-- ---- THE GAP, MEASURED ----------------------------------------------
--
-- The monitor watches tracking_sources: 140 curated URLs, one to three
-- per country, hashed weekly and diffed. That is a good tool and it has
-- been watching the wrong list.
--
-- The site cites 849 distinct URLs. 709 of them are watched by nothing.
-- The number that matters:
--
--   OF THE 420 CITATIONS BEHIND THE SIX HEADLINE FACTS -- the six cards
--   at the top of every compliance guide, the most prominent claims the
--   site makes -- 397 ARE UNWATCHED. Ninety-five per cent.
--
-- So the site records what a fact USED to say (fact_history, 361 rows)
-- and watches almost nothing for what it is ABOUT TO become. That is the
-- difference between an archive and a tracker.
--
-- ---- WHAT CHANGES, AND WHAT DELIBERATELY DOES NOT -------------------
--
-- The framing in CONTENT-MONITORING.md is unchanged and load-bearing:
-- THIS IS A DETECTION TOOL, NOT A PUBLISHING TOOL. Nothing here writes
-- to a milestone, a fact or a story. The entire output is still one
-- internal email saying "go look at this". Widening the watch list makes
-- that email more useful; it does not move the line.
--
-- What changes is WHAT THE EMAIL CAN SAY. Watching tracking_sources, a
-- change means "a page we track changed". Watching cited_sources, it
-- means "the page behind Saudi Arabia's B2B status changed, and that
-- status was last verified on 21 August" -- which is a task rather than
-- an errand.
--
-- ---- STORY CITATIONS ARE EXCLUDED, ON PURPOSE -----------------------
--
-- 91 of the 849 are sources cited inside past newsletter issues. A story
-- is a DATED RECORD of what was true when it was written; its source
-- changing later is not evidence that anything currently published is
-- wrong, it is the world moving on -- which is what the tracker is for.
-- Watching them would add 2.7 minutes a sweep and a class of digest line
-- nobody can act on. Dan's decision, and the reasoning is here so that
-- re-including them is a choice rather than a discovery.
--
-- ---- THE BUDGET, WHICH IS THE REAL CONSTRAINT -----------------------
--
-- 758 URLs at ~1.75s each is ~22 minutes. Cloudflare's ceiling for a
-- scheduled handler is 15, and this job's self-imposed budget is 8.
-- It does not fit, and the honest options were cadence or coverage.
--
-- The monitor moves to a DAILY cron. Each run works through the list
-- from wherever the last one stopped, so ~270 URLs a night and a full
-- sweep every three days -- better coverage AND better freshness than
-- the weekly run it replaces, with the 8-minute budget untouched.
--
-- This is the same shape as the 10 August fix and it is worth being
-- explicit about the trap: a run that only gets through part of a list
-- is fine, a job DESCRIBED as weekly that in fact sweeps quarterly is
-- not. The digest states the cycle it is actually achieving.
-- ================================================================

-- ---- what the monitor watches ---------------------------------------
--
-- Distinct URLs, because a page cited by four facts should be fetched
-- once. is_fact_source is what the digest sorts on: a change behind a
-- published headline fact leads the email, everything else follows.
DROP VIEW IF EXISTS monitored_sources;
CREATE VIEW monitored_sources AS
  SELECT url,
         max(CASE WHEN kind LIKE 'headline_fact%' THEN 1 ELSE 0 END) AS is_fact_source,
         max(CASE WHEN kind = 'tracking_source'   THEN 1 ELSE 0 END) AS is_curated,
         count(*) AS citations
    FROM cited_sources
   WHERE kind <> 'story'
   GROUP BY url;

-- ---- and what a changed URL actually supports ------------------------
--
-- For headline facts, cited_sources.row_id IS country_id -- which is
-- what lets the digest name the country and the field, and read the
-- date the fact was last verified. THAT DATE IS THE POINT: a source
-- that changed after its fact was last verified is the line worth
-- acting on, and it is the only signal here that distinguishes "this
-- page moved" from "what we publish may now be wrong".
DROP VIEW IF EXISTS fact_source_map;
CREATE VIEW fact_source_map AS
  SELECT cs.url,
         replace(cs.kind, 'headline_fact.', '') AS field,
         c.name_en   AS country,
         f.last_verified
    FROM cited_sources cs
    JOIN countries c              ON c.id = cs.row_id
    JOIN country_headline_facts f ON f.country_id = c.id
   WHERE cs.kind LIKE 'headline_fact%';

-- ---- what this migration claims it did ------------------------------

-- THE WATCH LIST GREW BY MORE THAN FIVE TIMES. 140 curated URLs before;
-- 758 distinct URLs now, story citations excluded.
-- ASSERT: SELECT count(*) FROM monitored_sources = 758
-- 371 DISTINCT URLs CARRY THE 420 FACT CITATIONS -- some pages are the
-- source for several facts in one country, which is exactly why the
-- watch list is keyed on URL and fetched once.
-- ASSERT: SELECT count(*) FROM monitored_sources WHERE is_fact_source = 1 = 371
-- ASSERT: SELECT count(*) FROM monitored_sources WHERE is_fact_source = 1 OR is_curated = 1 = 492

-- EVERY CURATED SOURCE SURVIVED THE WIDENING. The new list is a superset
-- of the old one, and this is the assertion that would catch a WHERE
-- clause that replaced the curated list instead of absorbing it.
-- ASSERT: SELECT count(*) FROM tracking_sources ts WHERE ts.active = 1 AND ts.url NOT IN (SELECT url FROM monitored_sources) = 0

-- AND EVERY HEADLINE FACT'S SOURCE IS NOW MAPPED TO ITS COUNTRY.
-- ASSERT: SELECT count(*) FROM fact_source_map = 420

-- ---- and what must stay true afterwards -----------------------------

-- NO STORY CITATION LEAKS IN. Stated as an invariant rather than trusted
-- to the WHERE clause, because the exclusion is an editorial decision
-- and a later edit to cited_sources could quietly undo it.
-- ASSERT ALWAYS: SELECT count(*) FROM monitored_sources ms WHERE ms.url IN (SELECT url FROM cited_sources WHERE kind = 'story') AND ms.url NOT IN (SELECT url FROM cited_sources WHERE kind <> 'story') = 0

-- THE CURATED LIST STAYS INSIDE THE WATCHED LIST. If a future migration
-- narrows monitored_sources, the 140 hand-picked pages must not be what
-- falls out -- they are the ones a person chose deliberately.
-- ASSERT ALWAYS: SELECT count(*) FROM tracking_sources ts WHERE ts.active = 1 AND ts.url NOT IN (SELECT url FROM monitored_sources) = 0

-- EVERY FACT SOURCE IS WATCHED. This is the invariant the whole
-- migration exists to establish: a headline fact whose source nothing
-- checks is a published claim with no way of learning it has gone stale.
-- ASSERT ALWAYS: SELECT count(*) FROM cited_sources cs WHERE cs.kind LIKE 'headline_fact%' AND cs.url NOT IN (SELECT url FROM monitored_sources) = 0
