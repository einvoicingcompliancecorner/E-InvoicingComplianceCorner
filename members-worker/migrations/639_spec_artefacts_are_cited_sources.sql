-- ================================================================
-- The register's artefact URLs are citations, and the monitor watches
-- them.
-- ================================================================
--
-- The register publishes twenty download links and calls them
-- authoritative. A link the site vouches for and nothing watches is
-- exactly the exposure migration 635 closed for the headline facts one
-- day ago, and it would be reopened here by a table nobody added to the
-- view. That is failure class C: A MONITOR CANNOT SEE WHAT WAS NEVER
-- DECLARED TO IT.
--
-- Adding the artefacts to cited_sources does three things at once, all
-- of them for free: every URL is graded by who operates its host, every
-- URL joins the nightly watch list, and a specification page that
-- changes raises a flag in the digest. That last one is the whole
-- reason the register is worth publishing rather than writing down
-- once -- a spec register that silently goes stale is worse than none.
--
-- ---- the compound-SELECT ceiling, for the third time ---------------
--
-- D1 refuses a compound SELECT past about three terms. 613 is three
-- parts of three; 628 added p4 and a second level of two. As 628's
-- header instructed in as many words: THE NEXT FACT ADDED GETS A FIFTH
-- PART AND A THIRD LEVEL, NEVER A FOURTH TERM. This is that fact, and
-- this is that third level. No compound in this file is wider than
-- three terms.
--
-- ---- changelog and validator URLs are cited too ---------------------
--
-- Not only the artefacts. A version-history page is how the register
-- knows a version moved, and a public validator is a claim the site
-- makes on a reader's behalf -- both should be watched, and both should
-- be graded. They ride in on the same part view.
-- ================================================================

-- ---- the fifth part -------------------------------------------------

DROP VIEW IF EXISTS cited_sources_p5;
CREATE VIEW cited_sources_p5 AS
            SELECT 'spec_artefact' AS kind, country_id AS row_id, url FROM country_spec_artefacts
  UNION ALL SELECT 'spec_changelog', country_id, changelog_url FROM country_spec WHERE ifnull(changelog_url,'') <> ''
  UNION ALL SELECT 'spec_validator', country_id, validator_url FROM country_spec WHERE ifnull(validator_url,'') <> '';

-- ---- the third level ------------------------------------------------
--
-- cited_sources_all (3) -> _all2 (2) -> cited_sources (2). Each level
-- exists only to keep the one above it inside the ceiling.
DROP VIEW IF EXISTS cited_sources_all2;
CREATE VIEW cited_sources_all2 AS
            SELECT kind, row_id, url FROM cited_sources_all
  UNION ALL SELECT kind, row_id, url FROM cited_sources_p4;

-- Rebuilt on the new level. The host expression is 613's, character for
-- character -- copied rather than adapted, because a host computed two
-- ways is a source that grades differently depending on which view read
-- it.
DROP VIEW IF EXISTS cited_sources;
CREATE VIEW cited_sources AS
WITH raw AS (
            SELECT kind, row_id, url FROM cited_sources_all2
  UNION ALL SELECT kind, row_id, url FROM cited_sources_p5
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

-- ---- grading the new hosts ------------------------------------------
--
-- By WHO OPERATES THE HOST, which is the rule, and it produces one
-- uncomfortable answer worth stating plainly rather than fudging.
--
-- GITHUB.COM IS SECONDARY. Germany's XRechnung rules, Norway's EHF
-- artefacts, the Netherlands' NLCIUS Schematron and Peppol's own rule
-- sets all live in repositories owned by the authorities themselves --
-- and every one of them is served by a commercial code-hosting company
-- in another jurisdiction. Grading it 'primary' because the repository
-- owner is official would be grading the page rather than the host,
-- which is the one thing the tier rule forbids.
--
-- Marking it secondary is not a criticism of KoSIT. It is a fact a
-- reader planning a decade-long integration should have: the canonical
-- copy of several national specifications is not on a government
-- server. The note says so, so nobody has to infer it from a tier.
--
-- Five per statement, per 628 -- D1's ceiling applies to a multi-row
-- INSERT differently, but the batching has been cheap insurance twice.
INSERT OR REPLACE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('xeinkauf.de', 'primary', 'KoSIT, the German public-sector IT standards coordination office', '2026-08-24'),
  ('anskaffelser.dev', 'primary', 'DFØ, the Norwegian agency for financial management', '2026-08-24'),
  ('porezna.gov.hr', 'primary', 'Croatian Tax Administration', '2026-08-24'),
  ('fiskalizacija2.hr', 'primary', 'The Croatian Tax Administration''s Fiskalizacija 2.0 project site', '2026-08-24'),
  ('oioubl.nemhandel.dk', 'primary', 'Nemhandel, run by the Danish Business Authority', '2026-08-24');

INSERT OR REPLACE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('github.com', 'secondary', 'A commercial code-hosting platform. The repositories cited here are owned by national authorities, but the host is not one of them', '2026-08-24'),
  ('finanssiala.fi', 'secondary', 'Finance Finland, a private banking association -- Finvoice''s publisher is not a public authority', '2026-08-24'),
  ('file.finanssiala.fi', 'secondary', 'Finance Finland, a private banking association', '2026-08-24');

-- ---- what this migration claims it did ------------------------------

-- The register contributes 33 artefacts, 13 changelog URLs and 2
-- validator URLs. The last number is worth reading twice: of twenty
-- jurisdictions, TWO publish a validator a stranger can use without
-- registering -- Denmark and Norway. That is a finding, not a gap in
-- the research, and asserting it here means a later edit that quietly
-- adds a third has to say so.
-- ASSERT: SELECT count(*) FROM cited_sources_p5 = 48
-- ASSERT: SELECT count(*) FROM cited_sources WHERE kind = 'spec_artefact' = 33
-- ASSERT: SELECT count(*) FROM cited_sources WHERE kind = 'spec_changelog' = 13
-- ASSERT: SELECT count(*) FROM cited_sources WHERE kind = 'spec_validator' = 2

-- AND THE LEVELS BELOW ARE UNTOUCHED. 1,248 was the total before this
-- file; if this number moves, a part view was edited rather than added
-- to, which is how a citation disappears without anything failing.
-- ASSERT: SELECT count(*) FROM cited_sources_all2 = 1248
-- ASSERT: SELECT count(*) FROM cited_sources = 1296

-- ---- and what must stay true afterwards -----------------------------

-- 613's invariant, restated because a view rebuild is exactly when an
-- invariant gets lost, and because the methodology page's tier query is
-- an INNER JOIN that would silently drop an ungraded host rather than
-- report it.
-- ASSERT ALWAYS: SELECT count(*) FROM cited_sources WHERE host NOT IN (SELECT host FROM source_hosts) = 0

-- EVERY ARTEFACT THE REGISTER SHOWS IS WATCHED. This is the standing
-- version of the reason this file exists: the register publishes links
-- and calls them authoritative, so nothing it publishes may be
-- unwatched. monitored_sources excludes only story citations.
-- ASSERT ALWAYS: SELECT count(*) FROM country_spec_artefacts a WHERE a.url NOT IN (SELECT url FROM monitored_sources) = 0

-- AND SO IS EVERY VERSION HISTORY, which is how the register finds out
-- that a version it publishes has been superseded.
-- ASSERT ALWAYS: SELECT count(*) FROM country_spec WHERE ifnull(changelog_url,'') <> '' AND changelog_url NOT IN (SELECT url FROM monitored_sources) = 0

-- NO COMPOUND IN THIS FILE IS WIDER THAN THREE TERMS. Stated as a claim
-- to be read rather than as SQL, because the failure is an error at
-- apply time and the only defence is somebody checking before it ships.
