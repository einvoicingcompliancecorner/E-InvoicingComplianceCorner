-- ================================================================
-- ROI planner: make country complexity an explicit, stored attribute
-- instead of a regex guess against free-text prose.
--
-- Dan, 12 Aug 2026, after being shown the impact: 'I would have "No
-- mandate", and "Simple Mandate" being decentralised 4-corner only, as
-- a simple model as $10k implementation cost. Where there is a CTC, or
-- 5-Corner model we should allocate complex and assume $20k
-- implementation cost.'
--
-- WHY THIS MIGRATION EXISTS AT ALL — a live defect, not a refinement.
-- getRoiCountries() derived each country's complexity by running a
-- regex over deep_dive_page_translations.compliance_model, a field
-- written as prose for human readers:
--
--     cx = /clearance|ctc|pre-validation/  ? 3
--        : /reporting|post-issuance/       ? 2
--        : status === 'b2g_only'           ? 1 : 0
--
-- That silently mis-scored NINE countries with real B2B mandates as
-- "watch only": Belgium, Denmark, Singapore and Uruguay (in force) and
-- Norway, Slovakia, Slovenia, Spain and the United Kingdom (dated
-- deadlines). None of their compliance_model strings happens to contain
-- one of those five words. A complexity of zero does not merely mark a
-- country as low-effort — it contributes zero integrations AND drops
-- the country out of the wave plan entirely, because buildGantt()
-- filters on `c[5] && c[4] > 0`.
--
-- Measured on the planner's own default selection (UK, France, Germany,
-- Italy, Spain, Poland, Netherlands, Belgium) at one ERP:
--     before   4 integrations, $80,000 one-off, 3 of 8 countries planned
--     after    8 integrations, $160,000 one-off, 6 of 8 planned
-- The tool was understating its own default one-off cost by half, and
-- silently omitting the United Kingdom from a UK-facing business case.
--
-- (Italy is correctly absent either way: its mandate has been fully in
-- force since 2019, so there is genuinely nothing left to plan.)
--
-- THE LESSON, WHICH IS THE REAL POINT. Inferring a customer-facing cost
-- driver from a prose field cannot be made safe by improving the regex.
-- The next country whose model is worded differently breaks it again,
-- silently, and nothing in the data distinguishes a country that was
-- classified deliberately from one that fell through. Storing the
-- decision makes it reviewable, diffable and testable.
--
-- THE SCALE, per Dan's definition. Three values, not four:
--   'complex'  CTC in any form — clearance, pre-validation, or
--              invoice-level data reported to the tax authority — or a
--              5-corner model where the exchange network also reports.
--   'simple'   Decentralised 4-corner exchange only. Structured
--              invoices move between accredited access points and the
--              tax authority is not a party to the transaction. This
--              is where most B2G-only Peppol regimes sit.
--   'none'     No mandate to build for.
--
-- The old four-point scale had a B2G-only tier and no slot at all for
-- "mandatory decentralised exchange with no authority involvement",
-- which is where Belgium, Norway, the UK and Slovenia actually live and
-- where the European direction of travel is heading. Dan's three-value
-- scale fixes that by making the authority's involvement the dividing
-- line, which is also what actually drives integration effort.
--
-- THE RULE APPLIED TO THE JUDGEMENT CALLS, stated so it can be argued
-- with rather than reverse-engineered: **if the tax authority receives
-- invoice-level data, it is complex.** That is why Bulgaria (SAF-T),
-- Latvia (VID reporting), Lithuania (i.SAF) and Portugal (certified
-- software plus SAF-T) are complex despite having no B2B exchange
-- mandate, and why Estonia and Germany are simple despite being large,
-- serious regimes — neither has clearance and neither reports invoices.
--
-- Flagged as genuinely arguable, and cheap to change with a one-line
-- UPDATE: Bulgaria, Czech Republic, Denmark, Japan, Latvia, Lithuania,
-- Portugal, Singapore, Slovenia and Uruguay.
--
-- SQLite note: ALTER TABLE ADD COLUMN does accept a CHECK constraint,
-- verified before writing this. So a future country added without a
-- value fails loudly at insert rather than defaulting into a wrong
-- answer — which is the entire point of the change.
-- ================================================================

ALTER TABLE countries ADD COLUMN roi_complexity TEXT NOT NULL DEFAULT 'none'
  CHECK (roi_complexity IN ('none', 'simple', 'complex'));

-- ---- complex: CTC, clearance, invoice-level reporting, or 5-corner ----
UPDATE countries SET roi_complexity = 'complex' WHERE code IN (
  'AR','AZ','BG','BR','CL','CN','CO','CR','DO','EC','EG','ES','FR','GR','HR',
  'HU','ID','IE','IL','IN','IT','JO','KE','KR','KZ','LT','LV','MX','MY','NG',
  'OM','PE','PH','PK','PL','PT','RO','RS','SA','SG','SK','TR','TW','UY','UZ',
  'VN','AE'
);

-- ---- simple: decentralised 4-corner exchange only ----
UPDATE countries SET roi_complexity = 'simple' WHERE code IN (
  'AT','AU','BE','CA','CY','DE','DK','EE','FI','GB','IS','LU','MT','NL','NO','NZ','SE','SI'
);

-- ---- none: nothing to build for ----
UPDATE countries SET roi_complexity = 'none' WHERE code IN (
  'BH','CZ','JP','QA','US'
);

-- The European Union row is a container, never a jurisdiction to
-- implement in, and getRoiCountries() excludes it with `code <> 'EU'`.
-- Left at the 'none' default deliberately.

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- Sixty-five of the seventy tracked jurisdictions carry a hand-assigned
-- complexity; the rest are genuinely 'none'. The 'complex' count is
-- point-in-time and moves to 48 at migration 515, when Belgium is
-- corrected.
--
-- ASSERT: SELECT count(*) FROM countries WHERE roi_complexity <> 'none' = 65
-- ASSERT: SELECT count(*) FROM countries WHERE roi_complexity = 'complex' = 47
-- ASSERT: SELECT roi_complexity FROM countries WHERE code = 'FR' = 'complex'
