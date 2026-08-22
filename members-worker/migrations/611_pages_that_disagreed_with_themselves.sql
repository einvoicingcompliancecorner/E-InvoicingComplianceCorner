-- ================================================================
-- Five places where a guide page contradicted itself.
-- ================================================================
--
-- Dan, 22 August 2026: "A guide that contradicts itself in the same page,
-- loses the site credibility immediately. Can you ensure this does not
-- happen."
--
-- Found by a checker written for the purpose (tests/guides-consistency.mjs,
-- added in the same commit), which reads every country's headline facts and
-- every other assertion on that country's page -- card titles, fact rows and
-- the on_tracker milestones the board publishes -- and reports where they
-- disagree about the same segment. It is now part of npm test, so this class
-- of defect fails a build rather than reaching a reader.
--
-- WHAT IT FOUND, AND WHY EACH WAS WRONG.
--
-- The pattern is not carelessness in the research. It is that
-- country_headline_facts was filled by reading sources, while the
-- milestones and cards were written months earlier by reading different
-- sources, and until this week nothing had ever put the two on one page and
-- compared them. Every one of these has been live on the deep dives or the
-- board for some time.

-- ---- CANADA: three of our own artefacts say mandatory, the tile said not -
--
-- The tile read VOLUNTARY with the note "No legal duty to e-invoice;
-- CanadaBuys/Peppol optional, email and mail accepted". On the same page:
-- an on_tracker milestone dated 1 Apr 2022, scope b2g_only, reading "All
-- federal government suppliers must invoice electronically (B2G, in force
-- since 2022)"; a card titled "Federal B2G (mandatory)" naming Public
-- Services and Procurement Canada as the authority and SAP Ariba via
-- CanadaBuys as the platform; and a second card, "For federal government
-- suppliers", giving the required formats.
--
-- RESOLVED IN FAVOUR OF THE BOARD, AND FLAGGED. Three artefacts against
-- one, and the three are the ones this site has been publishing on the
-- tracker for months -- a guide that disagreed with the board it is drawn
-- from would be the worse of the two errors. But this is the one fix in
-- this migration decided on the balance of our own evidence rather than on
-- a primary source: the milestone cites recommand.eu, a secondary tracker,
-- and no PSPC page has been read directly. It should be re-verified against
-- PSPC in a session with web search, and if the duty turns out to be on
-- departments to RECEIVE rather than on suppliers to ISSUE, this row goes
-- back to no_mandate and the milestone and card are what change.
UPDATE country_headline_facts
   SET b2g_status = 'active',
       b2g_date   = '2022-04-01',
       b2g_source = 'https://www.recommand.eu/en/countries/canada'
 WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Canada');
UPDATE country_headline_fact_translations
   SET b2g_note = 'Federal suppliers invoice electronically via CanadaBuys/Ariba since Apr 2022; secondary source, unverified against PSPC'
 WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Canada') AND lang = 'en';

-- ---- NORWAY: the board publishes a date the tile said it did not have ---
--
-- The tile read NOT CONFIRMED for B2B. The same page carries an on_tracker
-- milestone dated 1 January 2027, scope b2b, "Mandatory B2B e-invoice
-- issuance (EHF 3.0 / Peppol BIS)" -- which is also what the tracker board
-- has been showing.
--
-- The caveat behind the 'unknown' is real and stays in the note: the
-- Storting adopted the enabling law on 19 June 2026 and left commencement
-- to a royal decree, so 1 January 2027 is a target. But this site has
-- already decided to publish that date, on the board, and a tile that
-- silently declines to is not more careful -- it just disagrees with the
-- page it is printed on. 'planned' with the date and the caveat says both
-- true things at once, which is what the column was built for.
UPDATE country_headline_facts
   SET b2b_status = 'planned',
       b2b_date   = '2027-01-01',
       unknown_reason = NULL
 WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Norway');
UPDATE country_headline_fact_translations
   SET b2b_note = 'Law adopted 19 Jun 2026; 1 Jan 2027 is the stated target, commencement set by royal decree'
 WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Norway') AND lang = 'en';

-- ---- OMAN: a mandate the page dates in the past, called 'planned' -------
--
-- Three problems on one page, all the same shape.
--
-- B2B read PLANNED Feb 2027. The page's own timeline shows Phase 1 -- "Oman's
-- 100 largest taxpayers must issue and receive e-invoices" -- dated 1 August
-- 2026, which is three weeks in the PAST as this migration is written, and
-- the fitter prints past milestones in the past style. A reader saw a
-- mandate described as forthcoming directly above a dated entry saying it
-- had already started.
--
-- This is the convention this table already applies elsewhere: India sits
-- at 'active' above a turnover threshold, Saudi Arabia at 'active' through
-- its waves. A threshold mandate that binds somebody is in force. Oman's
-- Phase 1 binds a hundred named taxpayers, so 'active' from 1 Aug 2026,
-- with the phases in the note.
--
-- B2C read NOT CONFIRMED. Two cards on the page state the requirement
-- outright -- "B2C requirement: Mandatory QR code on every consumer-facing
-- invoice" and "B2C invoices: Must additionally carry a QR code". The
-- unknown_reason said the OTA publishes phases by VAT registration rather
-- than by counterparty type, which is true and is the wrong conclusion: it
-- means consumer invoices are in scope with their issuer, not that nobody
-- knows whether they are.
--
-- B2G read NOT CONFIRMED because the OTA named February with no year. The
-- page answers that too: an on_tracker milestone at 1 Aug 2028, "Phase 4
-- (government counterparties)", and a card row saying the same. The date
-- carries the OTA's own "not yet confirmed" into the note.
UPDATE country_headline_facts
   SET b2b_status = 'active', b2b_date = '2026-08-01',
       b2c_status = 'active', b2c_date = '2026-08-01',
       b2g_status = 'planned', b2g_date = '2028-08-01',
       unknown_reason = 'Signature: the OTA FAQ calls e-invoices electronically certified without stating whether the issuer signs.'
 WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Oman');
UPDATE country_headline_fact_translations
   SET b2b_note = 'Phase 1 (100 largest) live since Aug 2026; all large firms Feb 2027; all VAT-registered Aug 2027',
       b2c_note = 'Consumer invoices are in scope with their issuer''s phase and must carry a QR code',
       b2g_note = 'Phase 4 covers government counterparties from Aug 2028; the OTA has not confirmed the date'
 WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Oman') AND lang = 'en';

-- ---- SINGAPORE: in force for somebody, printed as forthcoming ----------
--
-- The tile read PLANNED Apr 2028. The board carries two in-force b2b
-- milestones: 1 Nov 2025, "GST InvoiceNow mandatory -- new voluntary GST
-- registrants (within 6mo of incorporation)", and 1 Apr 2026, "Mandate
-- extends to all new voluntary GST registrants". Both are issuing duties,
-- both are in the past, and both were printing above a tile calling the
-- mandate forthcoming.
--
-- SAME CONVENTION, SAME ANSWER AS OMAN ABOVE. India sits at 'active' above
-- a turnover threshold and Saudi Arabia through its waves; a mandate that
-- binds somebody is in force, and 2028 is when it reaches most people
-- rather than when it starts. That belongs in the note, which is where the
-- reader looks to find out whether it binds them.
--
-- This was one of five calls put to Dan on 22 August as needing judgement
-- rather than research. It stops being a judgement once the page states
-- both answers at once: whatever the right status is, the page cannot say
-- forthcoming and in-force about the same obligation.
UPDATE country_headline_facts
   SET b2b_status = 'active', b2b_date = '2025-11-01'
 WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Singapore');
UPDATE country_headline_fact_translations
   SET b2b_note = 'New voluntary GST registrants since Nov 2025; existing GST-registered firms phase in from Apr 2028'
 WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Singapore') AND lang = 'en';

-- ---- BULGARIA: the milestone overstated, not the tile -------------------
--
-- The only one of the five where the headline fact was right and the rest
-- of the page was wrong. The tile reads NO MANDATE with the note "Public
-- bodies must receive EN 16931 invoices since 2019; no supplier issuing
-- duty" -- correct, and the same treatment Ireland has had since 604. The
-- milestone said "B2G e-invoicing mandatory for public procurement", which
-- a reader can only take as a duty to issue.
--
-- THIS CHANGES THE TRACKER BOARD TOO, deliberately. The milestone is
-- on_tracker, so this wording is what the board has been showing. It is
-- imprecise there for exactly the same reason it is imprecise here, and
-- migration 408 has already established that correcting milestone prose is
-- a normal repair. All four languages, so the board does not disagree with
-- itself across editions.
UPDATE milestone_translations
   SET system = 'B2G e-invoice receipt mandatory for public bodies'
 WHERE lang = 'en' AND milestone_id IN (
   SELECT m.id FROM milestones m JOIN countries c ON c.id = m.country_id
    WHERE c.name_en = 'Bulgaria' AND m.mandate_scope = 'b2g_only');
UPDATE milestone_translations
   SET system = 'Empfang von B2G-E-Rechnungen für öffentliche Stellen verpflichtend'
 WHERE lang = 'de' AND milestone_id IN (
   SELECT m.id FROM milestones m JOIN countries c ON c.id = m.country_id
    WHERE c.name_en = 'Bulgaria' AND m.mandate_scope = 'b2g_only');
UPDATE milestone_translations
   SET system = 'Réception obligatoire des factures électroniques B2G par les organismes publics'
 WHERE lang = 'fr' AND milestone_id IN (
   SELECT m.id FROM milestones m JOIN countries c ON c.id = m.country_id
    WHERE c.name_en = 'Bulgaria' AND m.mandate_scope = 'b2g_only');
UPDATE milestone_translations
   SET system = 'Recepción obligatoria de facturas electrónicas B2G por los organismos públicos'
 WHERE lang = 'es' AND milestone_id IN (
   SELECT m.id FROM milestones m JOIN countries c ON c.id = m.country_id
    WHERE c.name_en = 'Bulgaria' AND m.mandate_scope = 'b2g_only');

-- ---- what this migration claims it did ------------------------------
--
-- Each UPDATE names its country through a subquery on name_en, so a
-- misspelling updates nothing and reports success -- the shape migration
-- 500 shipped for three releases. These assertions are what make that
-- impossible to miss.
-- ASSERT: SELECT b2g_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Canada') = 'active'
-- ASSERT: SELECT b2b_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Norway') = 'planned'
-- ASSERT: SELECT b2b_date FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Norway') = '2027-01-01'
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Oman') AND b2b_status = 'active' AND b2c_status = 'active' AND b2g_status = 'planned' = 1
-- ASSERT: SELECT count(*) FROM milestone_translations WHERE system LIKE '%receipt mandatory for public bodies%' = 1
-- ASSERT: SELECT b2b_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Singapore') = 'active'
--
-- AND THE ONE THAT OUTLIVES THIS FILE. Norway's row was the only 'unknown'
-- whose reason described a date rather than a missing fact, and clearing it
-- while setting a status is the pairing that is easy to half-do. 608's
-- standing invariant already refuses an unknown fact with no reason; this
-- is the other direction -- a reason left behind on a row that no longer
-- has an unknown fact is a stale explanation, and stale explanations are
-- what a reader trusts by mistake.
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_facts WHERE unknown_reason IS NOT NULL AND 'unknown' NOT IN (b2g_status, b2b_status, b2c_status, archiving_status, signature_status) = 0
