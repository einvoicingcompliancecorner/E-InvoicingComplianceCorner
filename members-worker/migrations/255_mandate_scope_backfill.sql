-- Backfill of mandate_scope (254) for all 79 current on_tracker
-- milestones, derived from each milestone's own description text
-- (cross-checked against 202_tracker_backfill.sql for ids/dates/
-- confidence) plus real-world knowledge of each country's regime.
-- Every row is set explicitly, including the ones already 'b2b'
-- by column default, so this file is a complete self-documenting
-- audit trail rather than relying on the default to be silently
-- correct -- same reasoning as 202's exhaustive confidence list.
--
-- Notable calls, for future maintainers reclassifying a milestone:
--  * Software/format-certification requirements that don't
--    themselves mandate B2B transmission (Spain's VeriFactu,
--    Portugal's QES layer) are 'none', not 'b2b' -- they're real
--    obligations but not e-invoicing-mandate-scope facts.
--  * Voluntary/pilot programs and consultation-only milestones
--    (UAE's pilot window, Slovakia's voluntary phase, the US's
--    DBNAlliance, Canada's CRA research) are 'none' -- no legal
--    mandate exists yet.
--  * Systems that cover B2B alongside B2C/B2G (Italy's SDI,
--    Mexico's CFDI, Chile's DTE, Peru's CPE, China's e-fapiao,
--    Brazil's NF-e/CBS-IBS fields) are 'b2b' -- their B2B
--    coverage is what this field exists to capture.
--  * uk-mandate covers both B2B and B2G in one milestone; scoped
--    'b2b' since that's the more informative fact and the status
--    algorithm only needs one qualifying b2b milestone.
--  * Countries whose only real, past-dated milestones are b2g_only
--    (Luxembourg, Finland, Sweden, Canada, Australia, New Zealand,
--    Portugal) correctly compute to the 'b2gonly' status via
--    computeCountryMapStatus() -- see PROGRESS.md for the earlier
--    reclassification work this backfill preserves. UAE and Slovakia
--    have real firm (non-'expected') future b2b milestones and
--    correctly compute to 'upcoming' instead.
--  * us-federal-b2g is 'none', not 'b2g_only', despite describing a
--    government-procurement e-invoicing push -- its own text says
--    explicitly "there is no single mandated format", i.e. it's a
--    discretionary directive ("directed... to move to"), not an
--    operative requirement the way Canada's PSPC system or Australia's
--    Peppol-receiving rule are. Scoping it 'b2g_only' would make the US
--    compute to 'b2gonly'; the correct, verified status is 'nomandate'
--    (confirmed against the map mock-up's hand-checked COUNTRIES data)
--    -- the one case where this backfill's derivation disagreed with
--    the mock-up and the mock-up's own status was the one kept.

-- European Union
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'eu-transpose';
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'eu-platform-svr-2028';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'eu-drr';
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'eu-align';

-- Luxembourg
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'lx-b2g';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'lx-b2b-receipt';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'lx-b2b-issue-large';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'lx-b2b-issue-all';

-- Belgium
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'be-mandate';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'be-penalty';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'be-ereport';

-- Germany
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'de-receive';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'de-issue-large';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'de-issue-all';

-- France
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'fr-receive';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'fr-issue-all';

-- Poland
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'pl-large';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'pl-all';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'pl-micro';

-- Italy
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'it-sdi';

-- Saudi Arabia
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'sa-wave23';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'sa-wave24';

-- Malaysia
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'my-phase4';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'my-related';

-- India
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'in-threshold';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'in-30day';

-- Brazil
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'br-fields';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'br-validate';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'br-mandatory';

-- Spain
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'es-verifactu-corp';
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'es-verifactu-rest';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'es-b2b-large';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'es-b2b-all';

-- United Kingdom
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'uk-mandate';

-- Romania
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'ro-established';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'ro-sme';

-- United Arab Emirates
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'uae-pilot';
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'uae-asp';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'uae-phase1';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'uae-phase2';

-- Mexico
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'mx-cfdi';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'mx-reform';

-- Australia
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'au-ncereceive';
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'au-30pct';
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'au-automate';

-- New Zealand
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'nz-central';
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'nz-2000';
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'nz-largesupplier';

-- Singapore
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'sg-voluntary2025';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'sg-allvoluntary';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'sg-existing2028';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'sg-full2031';

-- Slovakia
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'sk-voluntary';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'sk-mandate';

-- Peru
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'pe-established';

-- Chile
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'cl-established';
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'cl-digital-delivery';

-- Ireland
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'ie-phase1';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'ie-phase2';

-- Norway
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'no-issue';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'no-receive';

-- Denmark
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'dk-established';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'dk-small';

-- Portugal
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'pt-b2g-large';
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'pt-b2g-sme';
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'pt-qes';

-- Finland
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'fi-b2g';
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'fi-en-standard';
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'fi-vida';

-- Sweden
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'se-b2g';
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'se-b2b-expected';

-- China
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'cn-nationwide';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'cn-paper-phaseout';

-- Croatia
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'hr-b2b';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'hr-nonvat';

-- United States
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'us-federal-b2g';
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'us-dbnalliance';

-- Canada
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'ca-federal-b2g';
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'ca-watch';

-- ----------------------------------------------------------------
-- Austria, Cyprus, Egypt, Greece, Netherlands -- added to D1 (and
-- their milestones marked on_tracker) AFTER 202_tracker_backfill.sql
-- was written, so they're absent from that file and were NOT among
-- the 79 ids audited above. Caught by actually replaying this
-- migration against a local in-memory copy of the full migration
-- chain (schema.sql + every migrations/*.sql file, sqlite3) and
-- checking mandate_scope's resulting distribution -- these 25 rows
-- would otherwise have silently kept the column's 'b2b' schema
-- default, which is wrong for most of them (several are B2G-only
-- facts) and would have mis-colored all 5 countries on The Map.
-- Classified from each milestone's own English translation text
-- (milestone_translations, lang='en'), same rigor as the 79 above.
--
-- Two of these five are NOT the stale "no data yet" the original map
-- mock-up showed them as (built before their milestone data existed
-- in D1) -- Egypt and Greece both already have a real, past-dated,
-- firm domestic B2B mandate in force (Egypt since 2023; Greece's
-- large-business phase since 2 March 2026). This is exactly what a
-- live D1-rendered map is *for*: it reflects today's real data, not
-- a snapshot's assumptions about which countries "aren't there yet".
--
-- Austria, Cyprus, and the Netherlands each carry their own country-
-- specific copy of the confirmed-EU-law "ViDA cross-border B2B by
-- 1 July 2030" milestone (Council Directive (EU) 2025/516) --
-- genuinely firm (confidence NULL) and B2B-scoped, so each computes
-- to 'upcoming' via the firmUpcoming branch even though none of the
-- three has any domestic B2B mandate proposed yet. This is correct,
-- not a quirk: a confirmed, dated, EU-law B2B floor is real upcoming
-- news, and the algorithm's precedence deliberately lets a firm
-- future B2B fact outrank a real past B2G-only fact (see
-- 254_mandate_scope_schema.sql and computeCountryMapStatus's own
-- header for the Luxembourg/Ireland reasoning this mirrors).

-- Austria
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'at-b2g-2014';
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'at-b2g-extended-2018';
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'at-b2b-proposal-2026';
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'at-ebinterface-70';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'at-vida-2030';

-- Cyprus
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'cy-b2g-central-2019';
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'cy-b2g-subcentral-2020';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'cy-vida-2030';

-- Egypt
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'eg-law-2020';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'eg-einvoicing-all';
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'eg-ereceipt-wave8';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'eg-enforcement-2026';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'eg-threshold-250k';

-- Greece
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'gr-mydata-mandatory';
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'gr-b2g-2025';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'gr-b2b-phase1-2026';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'gr-b2b-phase2-2026';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'gr-vida-2030';

-- Netherlands
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'nl-b2g-2017';
UPDATE milestones SET mandate_scope = 'b2g_only' WHERE id = 'nl-b2g-subcentral-2019';
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'nl-b2b-voluntary';
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'nl-eyreport-2026';
UPDATE milestones SET mandate_scope = 'b2b' WHERE id = 'nl-vida-2030';
