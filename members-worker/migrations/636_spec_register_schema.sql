-- ================================================================
-- The specification register: what format a country mandates, and
-- where the authoritative file actually is.
-- ================================================================
--
-- Dan, 24 August 2026, having read the schema-checker feasibility
-- study: "Yes, I think this would be good value-add for a subscriber."
--
-- WHAT THIS IS NOT. It is not a validator. The study found that a
-- checker can honestly say "this conforms to the published
-- specification" and can never say "this will be accepted", because
-- what a tax authority's platform actually rejects exceeds every
-- downloadable artefact in most jurisdictions -- and because for most
-- clearance regimes you cannot even test against the authority's own
-- validator without credentials tied to a registered domestic
-- taxpayer. A green tick read as "you will pass" is this project's
-- dominant failure class in the one product a reader would act on
-- directly.
--
-- So this table publishes the thing that IS capturable: which format,
-- which version, which file, under what licence, from what date, and
-- -- the column that matters most -- WHAT THE ARTEFACTS DO NOT TELL
-- YOU. See gap_note below.
--
-- ---- three facts that are usually collapsed into one ---------------
--
-- The research made a distinction the feasibility study had blurred,
-- and the schema keeps the three apart because they fail differently:
--
--   * capture_status -- can the specification be captured at all?
--   * access         -- can a stranger download it right now?
--   * licence_status -- may they then build on what they downloaded?
--
-- Germany scores open/named/published. Japan scores open/RESTRICTIVE:
-- the Peppol artefacts download without a login and then say "may not
-- be modified, re-distribute, sold or repackaged ... without the prior
-- consent of OpenPeppol AISBL". France scores REGISTRATION: the
-- Factur-X package wants an email address. Collapsing those three into
-- one word called "open" is how a reader ends up believing a licence
-- exists because a download worked.
--
-- ---- what this table deliberately does NOT hold --------------------
--
-- The mandate itself. Which segments are mandated, from when, for whom
-- -- that is country_headline_facts and milestones, and it is already
-- published, translated, sourced and version-tracked. Restating it
-- here would create a second home for one fact, which is failure class
-- B and the most common defect in this system. The page links to the
-- country's compliance guide for that.
-- ================================================================

-- ---- the register ---------------------------------------------------

CREATE TABLE country_spec (
  country_id INTEGER PRIMARY KEY REFERENCES countries(id),

  -- CAN THIS BE CAPTURED AT ALL? The register's own verdict, and the
  -- honest reason a country may carry no artefacts.
  --
  --   published   -- machine-readable artefacts, downloadable, current
  --   partial     -- some published, a material layer is not
  --   unpublished -- the specification exists only as prose or law
  --   unreachable -- the publisher blocks us; we will not guess
  --   not_yet     -- mandated in law, specification not yet issued
  --
  -- 'unreachable' is a first-class answer, not a gap. Turkey's GIB and
  -- Portugal's eSPap both refuse automated access, and "we could not
  -- read it" is a different claim from "it is not published" -- the
  -- same discipline as unknown_reason on the headline facts.
  capture_status TEXT NOT NULL
    CHECK (capture_status IN ('published','partial','unpublished','unreachable','not_yet')),

  format_name TEXT,          -- 'XRechnung', 'PINT A-NZ', 'RO_CIUS'
  format_version TEXT,       -- the version current at last_verified
  -- The syntax a taxpayer must actually produce. 'multiple' where a
  -- country accepts more than one and none is preferred in law --
  -- France and Germany both do, and picking one for them would be the
  -- site asserting something the law does not.
  syntax TEXT
    CHECK (syntax IN ('ubl','cii','hybrid','national_xml','json','multiple','unknown')),
  is_en16931 TEXT NOT NULL
    CHECK (is_en16931 IN ('yes','no','unknown')),

  -- WHO PUBLISHES IT. Not decoration: Finland's format is governed by
  -- a private banking association rather than a public authority, and
  -- a reader planning a decade-long integration should be told that.
  governance TEXT,

  -- The exact licence string where one is stated -- 'Apache-2.0',
  -- 'MIT', 'EUPL 1.2'. NULL where none is.
  licence TEXT,
  --   named               -- a real, named licence
  --   permissive_unnamed  -- explicit permission to reuse, no licence name
  --   restrictive         -- published openly, redistribution refused
  --   unstated            -- public, silent on terms
  --   unknown             -- we could not check
  licence_status TEXT NOT NULL
    CHECK (licence_status IN ('named','permissive_unnamed','restrictive','unstated','unknown')),

  --   open          -- download it now, no account
  --   registration  -- an email address or free account
  --   credentials   -- a national digital identity or taxpayer account
  --   blocked       -- the publisher refuses automated access
  --   none          -- there is nothing to download yet
  access TEXT NOT NULL
    CHECK (access IN ('open','registration','credentials','blocked','none')),

  version_released TEXT,     -- ISO date the current version was issued
  -- THE DATE THE VERSION BECOMES OBLIGATORY, which is a different date
  -- and the one that ends up in a project plan. Peppol publishes in
  -- May and enforces in August; Denmark published 19 February and
  -- enforced 15 May. NULL where versions carry no valid-from date.
  mandatory_from TEXT,

  changelog_url TEXT,
  -- A validator a stranger can use without registering, or NULL. Only
  -- three of twenty have one, which is itself worth publishing.
  validator_url TEXT,

  last_verified TEXT NOT NULL,

  -- A version cannot be obligatory before it exists.
  CHECK (mandatory_from IS NULL OR version_released IS NULL OR mandatory_from >= version_released)
);

-- ---- the artefacts --------------------------------------------------

CREATE TABLE country_spec_artefacts (
  id INTEGER PRIMARY KEY,
  country_id INTEGER NOT NULL REFERENCES countries(id),
  kind TEXT NOT NULL
    CHECK (kind IN ('xsd','schematron','xslt','codelist','sdk','testsuite','spec_pdf','repo')),
  url TEXT NOT NULL,
  publisher TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_spec_artefacts_country ON country_spec_artefacts(country_id);

-- ---- the column the register exists for -----------------------------

CREATE TABLE country_spec_translations (
  country_id INTEGER NOT NULL REFERENCES countries(id),
  lang TEXT NOT NULL,

  -- WHAT THE PUBLISHED ARTEFACTS DO NOT TELL YOU.
  --
  -- Every other column in this register can be read off a web page in
  -- an afternoon. This one is the finding. Poland publishes a clean
  -- XSD and enforces a layer of semantic rejections documented
  -- nowhere; Italy's SdI checks registry validity no schema describes;
  -- Singapore's current PINT SG release is still marked draft. A
  -- reader who downloads the artefact and believes they now have the
  -- specification is the reader this field is written for.
  --
  -- Capped at 220 characters because it is rendered as a paragraph in
  -- a card, and because a note nobody finishes reading is a note that
  -- did not warn anyone.
  gap_note TEXT NOT NULL CHECK (length(gap_note) <= 220),

  PRIMARY KEY (country_id, lang)
);

-- ---- what must stay true --------------------------------------------

-- FOUR LANGUAGES OR NONE, per country. The rule that has been learned
-- three times on this project: a table that gains English rows first
-- and translations later ships a page that is English inside a German
-- frame, and no other check can see it.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT country_id FROM country_spec_translations GROUP BY country_id HAVING count(DISTINCT lang) != 4) = 0

-- EVERY REGISTERED COUNTRY HAS A NOTE, in every language. The register
-- without its gap column is a list of download links, which is the
-- part a competitor can copy in a morning.
-- ASSERT ALWAYS: SELECT count(*) FROM country_spec s WHERE (SELECT count(*) FROM country_spec_translations t WHERE t.country_id = s.country_id) != 4 = 0

-- A COUNTRY CLAIMED AS 'published' MUST ACTUALLY HAVE AN ARTEFACT.
-- Otherwise the register's own verdict is unsupported by the register,
-- which is exactly the shape of defect this site publishes about.
-- ASSERT ALWAYS: SELECT count(*) FROM country_spec s WHERE s.capture_status = 'published' AND NOT EXISTS (SELECT 1 FROM country_spec_artefacts a WHERE a.country_id = s.country_id) = 0

-- AND THE CONVERSE. If we could not reach the publisher, or the
-- specification is not written yet, we must not be showing a download.
-- ASSERT ALWAYS: SELECT count(*) FROM country_spec s WHERE s.capture_status IN ('unreachable','not_yet') AND EXISTS (SELECT 1 FROM country_spec_artefacts a WHERE a.country_id = s.country_id AND a.kind IN ('xsd','schematron','xslt','sdk')) = 0

-- A NAMED LICENCE MUST BE NAMED. licence_status = 'named' with a NULL
-- licence is the drift this pair of columns exists to prevent.
-- ASSERT ALWAYS: SELECT count(*) FROM country_spec WHERE licence_status = 'named' AND ifnull(licence,'') = '' = 0

-- AND AN UNNAMED ONE MUST NOT CARRY A NAME, so that a reader cannot
-- see 'Apache-2.0' beside the word 'unstated'.
-- ASSERT ALWAYS: SELECT count(*) FROM country_spec WHERE licence_status IN ('unstated','unknown') AND ifnull(licence,'') <> '' = 0

-- NOTHING IS REGISTERED AGAINST THE EUROPEAN UNION ROW. It is a
-- container, not a jurisdiction, and it has no tax authority that
-- mandates a format.
-- ASSERT ALWAYS: SELECT count(*) FROM country_spec s JOIN countries c ON c.id = s.country_id WHERE c.code = 'EU' = 0

-- ---- what this migration did ----------------------------------------

-- ASSERT: SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name IN ('country_spec','country_spec_artefacts','country_spec_translations') = 3
-- ASSERT: SELECT count(*) FROM country_spec = 0
