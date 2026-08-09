-- ================================================================
-- Bulgaria (BG) milestones + EN translations. 8 milestones, 5 on
-- the tracker board (anchor: the 1 Nov 2019 B2G go-live).
--
-- Sourcing (9 Aug 2026 research session, house standard): the
-- European Commission's own "eInvoicing in Bulgaria" country
-- factsheet (canonical page 467108878, confirmed via live fetch)
-- is the primary source for the B2G mandate, legal basis (Article
-- 115a of the Public Procurement Act, SG 86/18, transposing
-- Directive 2014/55/EU) and B2B status. SAF-T phase dates and
-- thresholds are cross-corroborated across three independent
-- industry sources -- EDICOM, PwC Bulgaria, and Penkov, Markov &
-- Partners (a Bulgarian law firm) -- all agreeing on the same
-- five-phase structure; Bulgaria's own NRA SAF-T portal page
-- (portal.nra.bg/details/saft, nra.bg's dedicated SAF-T project
-- page) could not be machine-read this round (timeout/robots),
-- so the phase dates are flagged as industry-sourced rather than
-- government-primary, per the house sourcing standard. Penalty
-- figures (BGN 5,000-15,000 initial / BGN 10,000-30,000 repeat)
-- come from a single specialist compliance source (SNI Technology)
-- and are flagged PLAUSIBLE, not corroborated elsewhere, and kept
-- out of milestone/tracker text -- reserved for the deep-dive's
-- penalties card only, with an explicit hedge.
--
-- Key finding: Bulgaria has NO B2B e-invoicing or clearance
-- mandate of any kind today, and SAF-T is a periodic accounting
-- data file submission (general ledger, AP/AR, invoice line data),
-- not an invoice-issuance or clearance requirement -- so every
-- SAF-T milestone here uses mandate_scope='none', consistent with
-- how Spain's VeriFactu (a software-integrity requirement, not an
-- invoicing mandate) is classified. Bulgaria's B2G requirement is
-- 'b2g_only'; only the 2030 ViDA floor is a genuine future 'b2b'
-- mandate.
-- ================================================================

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'bg-b2g-2019', id, '2019-11-01', 1,
    'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108878/eInvoicing+in+Bulgaria',
    1, '[{"label": "Public Procurement Agency (PPA) — CAIS EPP", "url": "https://www2.aop.bg/en/registration-of-economic-operators-with-cais-epp/"}]', NULL, 'b2g_only'
  FROM countries WHERE code = 'BG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'bg-b2g-2019', 'en',
  'B2G e-invoicing mandatory for public procurement',
  'Since 1 November 2019, all Bulgarian public sector contracting authorities must be able to receive and process structured, EN 16931-compliant electronic invoices for public procurement contracts above the EU public procurement thresholds, via the Centralized Automated Information System for Electronic Public Procurement (CAIS EPP). The obligation applies uniformly to central and sub-central government under a single compliance date. Legal basis: Article 115a of the Public Procurement Act (State Gazette 86/18), transposing EU Directive 2014/55/EU.',
  '["Historical context — no action needed for existing suppliers to Bulgarian public bodies", "Confirm invoices to Bulgarian contracting authorities are submitted as structured EN 16931 e-invoices via CAIS EPP, not PDF or paper"]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'bg-b2b-voluntary', id, '2019-11-01', 0,
    'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108878/eInvoicing+in+Bulgaria',
    1, '[]', NULL, 'none'
  FROM countries WHERE code = 'BG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'bg-b2b-voluntary', 'en',
  'B2B e-invoicing remains voluntary — no CTC or clearance mandate',
  'Unlike neighbouring Romania or Poland, Bulgaria has no business-to-business e-invoicing mandate, real-time clearance system, or continuous transaction control of any kind. Structured e-invoicing between businesses is optional, contingent on mutual agreement, and governed by the Bulgarian VAT Act aligned with EU Directive 2014/55/EU — a supplier and buyer may agree to exchange EN 16931 e-invoices, but neither side is required to.', '["No domestic B2B e-invoicing action required today", "The incoming SAF-T reporting obligation (below) is a periodic accounting-data filing, not an invoice-issuance mandate — the two should not be conflated"]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'bg-saft-large-2026', id, '2026-01-01', 0,
    'https://edicomgroup.com/blog/bulgaria-electronic-invoice-saft-reporting',
    1, '[{"label": "NRA — SAF-T (portal.nra.bg)", "url": "https://portal.nra.bg/details/saft"}]', NULL, 'none'
  FROM countries WHERE code = 'BG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'bg-saft-large-2026', 'en',
  'SAF-T periodic reporting mandatory — large enterprises (Phase 1)',
  'From 1 January 2026, Bulgaria''s largest taxpayers — those with 2023 annual net revenue above BGN 300 million, or annual tax and social-security payments above BGN 3.5 million — must submit a monthly Standard Audit File for Tax (SAF-T) to the National Revenue Agency (NAP): general ledger, accounts payable/receivable, and purchase/sales invoice data, due by the 14th of the following month, plus an annual fixed-asset report. This is a periodic bookkeeping-data filing under the amended Tax and Social Insurance Procedure Code (ДОПК) — it does not require issuing e-invoices or route them through any government platform.', '["Large taxpayers: confirm SAF-T-capable accounting software is in place ahead of the first monthly filing", "This is a reporting obligation, not an e-invoicing mandate — no change to how invoices are issued or exchanged"]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'bg-saft-mediumsmall-2027', id, '2027-01-01', 0,
    'https://www.pwc.bg/bg/services/tax/saf-t.html',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'BG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'bg-saft-mediumsmall-2027', 'en',
  'SAF-T Phase 2 — medium and small enterprises join at the same threshold',
  'From 1 January 2027, entities classified as medium or small enterprises (under Bulgaria''s general accounting size classification) that still exceed the Phase 1 thresholds — BGN 300 million 2024 revenue or BGN 3.5 million 2024 tax/social payments — join the large enterprises already reporting since 2026.', '[]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'bg-saft-midtier-2028', id, '2028-01-01', 0,
    'https://www.pwc.bg/bg/services/tax/saf-t.html',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'BG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'bg-saft-midtier-2028', 'en',
  'SAF-T Phase 3 — threshold drops sharply',
  'From 1 January 2028, the qualifying threshold falls to 2025 annual net revenue above BGN 15 million, or annual tax and social-security payments above BGN 1.5 million — pulling in a much wider band of mid-sized Bulgarian businesses.', '[]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'bg-saft-all-2029', id, '2029-01-01', 0,
    'https://www.pwc.bg/bg/services/tax/saf-t.html',
    1, '[]', NULL, 'none'
  FROM countries WHERE code = 'BG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'bg-saft-all-2029', 'en',
  'SAF-T Phase 4 — all large, medium and small enterprises',
  'From 1 January 2029, SAF-T reporting extends to all enterprises classified as large, medium or small under Bulgarian accounting law, regardless of revenue or tax thresholds — leaving only micro-enterprises outside the regime for one more year.', '["Confirm SAF-T-capable accounting software well ahead of this date if not already required in an earlier phase"]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'bg-saft-micro-2030', id, '2030-01-01', 0,
    'https://www.pwc.bg/bg/services/tax/saf-t.html',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'BG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'bg-saft-micro-2030', 'en',
  'SAF-T Phase 5 — full rollout, including micro-enterprises',
  'From 1 January 2030, SAF-T reporting reaches every remaining VAT-registered entity, including micro-enterprises, completing a five-year phased rollout that began with the largest taxpayers in 2026.', '[]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'bg-vida-2030', id, '2030-07-01', 0,
    'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32025L0516',
    1, '[{"label": "Council Directive (EU) 2025/516", "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32025L0516"}]', NULL, 'b2b'
  FROM countries WHERE code = 'BG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'bg-vida-2030', 'en',
  'ViDA cross-border B2B e-invoicing and digital reporting become mandatory (confirmed EU law)',
  'From 1 July 2030, under Council Directive (EU) 2025/516, structured e-invoicing and digital reporting become mandatory for all intra-Community B2B supplies — a firm EU-law floor that applies to Bulgaria regardless of whether it introduces its own domestic B2B mandate first. Bulgaria has announced no domestic B2B e-invoicing plans of its own as of this research round; SAF-T reporting (above) is a separate, parallel obligation.', '["Prepare for mandatory structured e-invoicing on all intra-EU B2B trade from mid-2030", "Monitor for any domestic Bulgarian B2B mandate announcement, which would likely arrive well before the 2030 EU floor if it follows the pattern of other EU member states"]'
);
