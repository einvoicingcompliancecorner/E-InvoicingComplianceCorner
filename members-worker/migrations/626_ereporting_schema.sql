-- ================================================================
-- A sixth headline fact: e-Reporting.
-- ================================================================
--
-- Dan, 23 August 2026: "I'd like to add another box/card to the top of
-- the compliance guides, which sits between the E-invoice mandate box,
-- and the Archiving box ... for e-Reporting, and will alert the user to
-- any e-Reporting mandates that are in place such as SAF-T."
--
-- And, mid-build: "I was just using SAF-T as an example - not an
-- exclusive request. Please ensure if there is a B2B e-Reporting
-- requirement, it is listed, regardless of whether SAF-T or another."
--
-- That second message is why this column set looks the way it does.
-- Only four of the thirty-nine countries with a live duty use SAF-T.
-- The rest run on about thirty different things -- myDATA, SII, RTIR,
-- JPK_V7M, KMD INF, kontrolni hlaseni, GSTR-1, i.SAF, D406, SIRE, DIOT,
-- SPED, the Dominican 606/607/608/609. A schema that assumed SAF-T
-- would have been wrong for thirty-five countries out of thirty-nine.
--
-- ---- WHAT COUNTS, AND WHY IT IS NOT THE SAME AS THE MANDATE BOX -----
--
-- A standing duty to TRANSMIT transaction or ledger data to the tax
-- authority as a step DISTINCT FROM ISSUING THE INVOICE.
--
-- Clearance is excluded. Where the invoice IS the report -- Italy's SdI,
-- Mexico's CFDI, Poland's KSeF -- that is the e-invoicing mandate, and
-- it is already in the card immediately to the left. Recording it twice
-- would make forty countries read ACTIVE in both boxes for one system
-- and teach a reader nothing.
--
-- Retail and cash-register fiscalisation is excluded, on Dan's decision:
-- the box is about ledger and invoice-data reporting, which is what a
-- finance team scoping an e-invoicing programme actually has to build.
-- That call costs eight countries their ACTIVE -- Azerbaijan, Canada,
-- Egypt, Nigeria, Slovenia, Uzbekistan's till limb and others -- and
-- every one of them is recorded in ereporting_decisions.py with its
-- reason, because most competitor trackers show them as live.
--
-- ---- THE MISTAKE THAT NEARLY SHIPPED --------------------------------
--
-- The research brief said to exclude the periodic VAT return, being a
-- summary declaration. Several researchers applied that to INVOICE-LEVEL
-- SCHEDULES ATTACHED TO A RETURN, which is a different thing. It was
-- inconsistent on its face: Poland's JPK_V7M merges the VAT return and
-- the sales/purchase ledger into one file and was being counted, while
-- Indonesia's identical-in-substance annexes were being dropped for
-- arriving stapled to a return.
--
-- The rule is CONTENT, NOT ENVELOPE. Invoice-level or per-counterparty
-- data counts wherever it travels; totals by tax rate do not. That
-- recovered Indonesia, Pakistan, Uzbekistan and Kenya, and it settled
-- Chile the other way -- the SII's own FAQ says it BUILDS the Registro
-- de Compras y Ventas from documents it already holds, and that the
-- register replaced the file taxpayers used to send.
--
-- EU recapitulative statements (VIES, EC Sales Lists) are excluded as a
-- deliberate decision rather than an oversight: they are per-counterparty
-- data filed on a schedule and so fit the rule, but all twenty-seven
-- member states have one, and a column that reads ACTIVE for all of them
-- tells a reader nothing about where the work is.
--
-- ---- WHY FREQUENCY IS A COLUMN AND NOT PROSE ------------------------
--
-- Same reason archiving_years is a column. "MONTHLY" against "REAL-TIME"
-- is the comparison a reader makes across markets, and it is the thing
-- that decides what they have to build. A sentence saying "monthly" in
-- English and "mensuel" in French cannot be compared or sorted, so the
-- cadence is an enum and the qualifying sentence is the note.
--
-- ON_REQUEST is a frequency AND a status, which looks redundant and is
-- not. Eighteen countries have a SAF-T-style file they must produce only
-- when asked in an audit -- Norway, France's FEC, Luxembourg's FAIA,
-- Poland's JPK na zadanie. By this site's own rule that is a capability,
-- not a standing duty, and the same reasoning retired Denmark's
-- Bookkeeping Act from the map this morning. But showing Norway as NO
-- MANDATE while it has a SAF-T obligation would read as an error to
-- anyone who knows the file. So it gets its own value: neither a
-- scheduled duty nor nothing. Where a country has BOTH -- Poland files
-- JPK_V7M monthly and produces JPK na zadanie on demand -- the standing
-- duty wins the box and the audit file goes in the note.
-- ================================================================

ALTER TABLE country_headline_facts ADD COLUMN ereporting_status TEXT NOT NULL DEFAULT 'unknown'
  CHECK (ereporting_status IN ('active','planned','voluntary','no_mandate','on_request','unknown'));

-- The cadence a reader compares. NULL where there is nothing to report.
ALTER TABLE country_headline_facts ADD COLUMN ereporting_frequency TEXT
  CHECK (ereporting_frequency IS NULL OR ereporting_frequency IN
    ('real_time','near_real_time','daily','monthly','quarterly','annual','varies','on_request'));

-- The token a practitioner recognises -- JPK_V7M, myDATA, SAF-T. Never
-- translated: it is a proper noun and a reader matching it against their
-- own portal must see the identical string in all four editions.
ALTER TABLE country_headline_facts ADD COLUMN ereporting_system TEXT;

ALTER TABLE country_headline_facts ADD COLUMN ereporting_date TEXT;
ALTER TABLE country_headline_facts ADD COLUMN ereporting_source TEXT;

-- The qualifying sentence, in every language, beside the other five.
ALTER TABLE country_headline_fact_translations ADD COLUMN ereporting_note TEXT;

-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE ereporting_status = 'unknown' = 70
--
-- EVERY ROW STARTS UNKNOWN ON PURPOSE. The column lands with a default
-- and 627 fills it, so that a reader of 627 sees seventy explicit
-- decisions rather than a diff against a half-populated table -- and so
-- that a country added between the two migrations shows NOT CONFIRMED
-- rather than silently claiming there is no duty.

-- ---- and what must stay true afterwards -----------------------------

-- A SCHEDULE IS A PROMISE ABOUT A DATE, exactly as b2b_status is. The
-- three CHECKs on the mandate columns cannot be extended by ALTER, so
-- this states the same rule at the level the reader cares about.
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_facts WHERE ereporting_status = 'planned' AND ereporting_date IS NULL = 0

-- AN ACTIVE DUTY HAS A CADENCE. If a country reports ACTIVE with no
-- frequency the card prints a status word where a reader expects
-- "MONTHLY", which is the one thing this box exists to say.
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_facts WHERE ereporting_status = 'active' AND ereporting_frequency IS NULL = 0

-- AND IT HAS A NAME. Dan asked for "frequency plus the system's name";
-- a nameless ACTIVE row means the card is half empty.
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_facts WHERE ereporting_status IN ('active','on_request') AND ifnull(ereporting_system,'') = '' = 0

-- ON_REQUEST IS BOTH, OR NEITHER. The status and the frequency describe
-- the same fact; letting them drift would put "MONTHLY" on a card whose
-- status says the file is only ever produced for an audit.
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_facts WHERE (ereporting_status = 'on_request') != (ifnull(ereporting_frequency,'') = 'on_request') = 0

-- THE VOCABULARY DOES NOT WIDEN. Same defence 600 built for b2b_status,
-- and for the same reason: this is the column where a future migration
-- would quietly re-admit "mandatory" or "SAF-T" as a status.
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_facts WHERE ereporting_status NOT IN ('active','planned','voluntary','no_mandate','on_request','unknown') = 0
