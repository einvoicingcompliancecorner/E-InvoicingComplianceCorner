-- ================================================================
-- The e-Reporting sources join the citation grading.
-- ================================================================
--
-- 627 added seventy source URLs and none of them were visible to
-- anything. cited_sources -- the view every tier statistic and the
-- /methodology page read -- was built by 613, before the column existed,
-- so the site's own count of "how much of this is primary" silently
-- excluded a whole fact.
--
-- That is the same shape as the defect 613 was written to prevent, and
-- it is worth naming: A VIEW THAT ENUMERATES COLUMNS DOES NOT NOTICE A
-- NEW COLUMN. The standing assertion "every cited host is graded" went
-- on passing throughout, because as far as it could see there was
-- nothing new to grade.
--
-- ---- WHY A FOURTH PART AND NOT A FOURTH TERM ------------------------
--
-- D1 refuses a compound SELECT past about three terms. This database has
-- hit that twice, and 613 is already built as three parts of three
-- precisely because a nine-term UNION ALL would not run.
--
-- Adding e-reporting as a fourth branch of the existing `raw` CTE would
-- make that CTE four terms -- past the widest compound this database has
-- ever successfully run. So instead there is a fourth part view, and the
-- union happens in two levels of three and two:
--
--     cited_sources_all = p1 UNION ALL p2 UNION ALL p3     (3 terms)
--     cited_sources     = cited_sources_all UNION ALL p4   (2 terms)
--
-- Nothing anywhere is wider than three. The next fact to be added gets
-- p5 and a third level rather than a fourth term here.
-- ================================================================

DROP VIEW IF EXISTS cited_sources_p4;
CREATE VIEW cited_sources_p4 AS
  SELECT 'headline_fact.ereporting' AS kind, country_id AS row_id, ereporting_source AS url
    FROM country_headline_facts WHERE ifnull(ereporting_source,'') <> '';

-- The three-term level, unchanged in substance from 613's `raw` CTE and
-- now named so the second level can reach it.
DROP VIEW IF EXISTS cited_sources_all;
CREATE VIEW cited_sources_all AS
            SELECT kind, row_id, url FROM cited_sources_p1
  UNION ALL SELECT kind, row_id, url FROM cited_sources_p2
  UNION ALL SELECT kind, row_id, url FROM cited_sources_p3;

-- Rebuilt with the two-term outer union. The host expression is 613's,
-- character for character: strip the scheme, take everything up to the
-- first slash, lowercase, drop a leading www. and any :port.
DROP VIEW IF EXISTS cited_sources;
CREATE VIEW cited_sources AS
WITH raw AS (
            SELECT kind, row_id, url FROM cited_sources_all
  UNION ALL SELECT kind, row_id, url FROM cited_sources_p4
), no_scheme AS (
  SELECT kind, row_id, url,
         lower(CASE WHEN instr(url,'://') > 0 THEN substr(url, instr(url,'://')+3) ELSE url END) AS rest
    FROM raw
), no_path AS (
  SELECT kind, row_id, url,
         CASE WHEN instr(rest,'/') > 0 THEN substr(rest, 1, instr(rest,'/')-1) ELSE rest END AS hp
    FROM no_scheme
), no_www AS (
  SELECT kind, row_id, url,
         CASE WHEN substr(hp,1,4) = 'www.' THEN substr(hp,5) ELSE hp END AS hw
    FROM no_path
)
SELECT kind, row_id, url,
       CASE WHEN instr(hw,':') > 0 THEN substr(hw, 1, instr(hw,':')-1) ELSE hw END AS host
  FROM no_www;

-- ---- the nineteen hosts the e-Reporting research introduced ---------
--
-- Graded the same way 613 grades: by who OPERATES the host, not by how
-- authoritative the page looked. A ministry that publishes a PDF is
-- primary even when the PDF is a summary; a competent accountancy firm
-- reproducing a statute is secondary even when the reproduction is
-- accurate and the ministry's own site is unreachable.

INSERT OR REPLACE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('bmf.gv.at',            'primary', 'Bundesministerium für Finanzen, Austria', '2026-08-23'),
  ('cdn.gib.gov.tr',       'primary', 'Gelir İdaresi Başkanlığı (Revenue Administration), Turkey', '2026-08-23'),
  ('dot.gov.tw',           'primary', 'Taxation Administration, Ministry of Finance, Taiwan', '2026-08-23'),
  ('e-kassa.gov.az',       'primary', 'State Tax Service e-kassa portal, Azerbaijan', '2026-08-23'),
  ('emta.ee',              'primary', 'Maksu- ja Tolliamet (Tax and Customs Board), Estonia', '2026-08-23');

INSERT OR REPLACE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('financnisprava.gov.cz','primary', 'Finanční správa (Financial Administration), Czech Republic', '2026-08-23'),
  ('news.belgium.be',      'primary', 'Federal government news service, Belgium', '2026-08-23'),
  ('pfi.public.lu',        'primary', 'Portail des finances indirectes (AED), Luxembourg', '2026-08-23'),
  ('revenuquebec.ca',      'primary', 'Revenu Québec', '2026-08-23'),
  ('skatteverket.se',      'primary', 'Skatteverket (Tax Agency), Sweden', '2026-08-23');

INSERT OR REPLACE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('tutorial.gst.gov.in',  'primary', 'GSTN official user guidance, India', '2026-08-23'),
  ('vero.fi',              'primary', 'Verohallinto (Tax Administration), Finland', '2026-08-23'),
  -- An intergovernmental body hosting a National Tax Service of Korea
  -- presentation. Not the NTS, so not primary; not a vendor either.
  ('britacom.org',         'institutional', 'Belt and Road Initiative Tax Administration Cooperation Mechanism', '2026-08-23');

INSERT OR REPLACE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('amir-cpa.net',            'secondary', 'Israeli accountancy practice', '2026-08-23'),
  ('fiscoetasse.com',         'secondary', 'Italian tax publisher', '2026-08-23'),
  ('knowledgebase.ptabcp.com','secondary', 'Philippine compliance knowledge base', '2026-08-23');

INSERT OR REPLACE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('ortax.org',            'secondary', 'Indonesian commercial tax portal', '2026-08-23'),
  ('taxcom.mx',            'secondary', 'Mexican tax software vendor', '2026-08-23'),
  ('vanbanphapluat.co',    'secondary', 'unofficial Vietnamese legal translations', '2026-08-23');

-- ---- what this migration claims it did ------------------------------

-- THE NEW FACT IS NOW COUNTED. Seventy e-reporting citations, one per
-- country, all of them reachable from the view the statistics read.
-- ASSERT: SELECT count(*) FROM cited_sources WHERE kind = 'headline_fact.ereporting' = 70

-- AND NOTHING ELSE MOVED. The restructure into two levels must be a
-- pure refactor of 613's three parts; if a part were dropped on the way
-- this count would fall. 1,178, not the 1,176 613 recorded: 625 added
-- two sourced milestones this morning, us-dfars-2003 and
-- is-supplier-terms-2020. Worth stating rather than adjusting silently,
-- because a number that moves for an unexplained reason is how a
-- refactor hides a dropped branch.
-- ASSERT: SELECT count(*) FROM cited_sources_all = 1178

-- ---- and what must stay true afterwards -----------------------------

-- 613's invariant, restated because the view it guards was rebuilt here
-- and a rebuild is exactly when an invariant gets lost.
-- ASSERT ALWAYS: SELECT count(*) FROM cited_sources WHERE host NOT IN (SELECT host FROM source_hosts) = 0

-- NO COMPOUND IN THIS FILE IS WIDER THAN THREE TERMS. Stated as a claim
-- a reader can check by eye rather than as SQL, because the failure mode
-- is a D1 error at apply time, not a wrong answer -- and because the two
-- occasions this database hit the ceiling both cost a deploy.
