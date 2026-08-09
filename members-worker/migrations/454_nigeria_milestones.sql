-- ================================================================
-- Nigeria (NG) milestones + EN translations. 8 milestones, 4 on the
-- tracker board (anchor: the 1 Aug 2025 large-taxpayer go-live --
-- Nigeria's first live cleared e-invoices).
--
-- Sourcing (7 Aug 2026 research session, house standard): the prior
-- evaluation's warning that "sources genuinely conflict" was
-- resolved into a dated sequence -- 1 Aug 2025 go-live (Deloitte,
-- Mondaq/WTS), extension to 1 Nov 2025 (Sovos + KPMG), penalties
-- legally enforceable 1 Jan 2026 when the Nigeria Tax Administration
-- Act took effect (Thomson Reuters/Pagero -- the source of stray
-- "mandatory from 1 Jan 2026" claims elsewhere), and a hard final
-- deadline of 31 Jul 2026 with enforcement from August (ThisDay,
-- Mondaq/WTS, BusinessDay -- all July 2026). Authority naming: FIRS
-- (Federal Inland Revenue Service) before 1 Jan 2026, NRS (Nigeria
-- Revenue Service) after, per the four tax reform acts signed
-- 26 Jun 2025; the platform brand is "FIRSMBS"/"Merchant Buyer
-- Solution (MBS)".
--
-- Deliberately excluded/hedged per the sourcing standard: the exact
-- MBS announcement month (Sep 2024 per SNI vs Nov 2024 per Deloitte
-- -- described as "late 2024, November per Deloitte"); the Peppol
-- Authority date uses 26 Sep 2025 (Comarch + Thomson Reuters
-- agree; vatcalc's 19 Oct is the outlier); "Africa's first Peppol
-- Authority" is hedged as "the first African country on OpenPeppol's
-- authority list" (implied by the list, not stated verbatim
-- anywhere); the 72-hour buyer-rejection window and B2C
-- NGN 50,000/day late-reporting penalty are single-source
-- (PLAUSIBLE) and kept out of milestone text; archiving-period
-- conflicts (5-6y vs 6-7y) are reported as unresolved in the deep
-- dive, not here.
-- ================================================================

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ng-mbs-announced-2024', id, '2024-11-01', 0,
    'https://www.deloitte.com/ng/en/services/tax/perspectives/FIRS-announces-e-invoicing-mandate-for-large-taxpayers-in-Nigeria.html',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'NG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ng-mbs-announced-2024', 'en',
  'FIRS announces the Merchant Buyer Solution (MBS)',
  'In late 2024 (November, per Deloitte), Nigeria''s Federal Inland Revenue Service announced a national e-invoicing initiative -- the Merchant Buyer Solution (FIRSMBS) -- applying continuous transaction controls to B2B and B2G invoices and near-real-time reporting to B2C sales. The platform was publicly unveiled and demonstrated to stakeholders on 29 April 2025, with 16 service providers (system integrators and access-point providers) certified via NITDA ahead of launch.',
  '["No obligation yet at announcement -- large taxpayers should begin scoping ERP integration.","Watch for the certified service-provider list -- production access runs through licensed integrators and access points."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ng-tax-reform-acts-2025', id, '2025-06-26', 0,
    'https://www.thisdaylive.com/2025/06/27/firs-renamed-nigeria-revenue-service-in-sweeping-new-tax-laws-effective-january-2026/',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'NG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ng-tax-reform-acts-2025', 'en',
  'Four tax reform acts signed -- FIRS becomes the Nigeria Revenue Service',
  'On 26 June 2025 President Tinubu signed four tax reform acts (the Nigeria Tax Act, Nigeria Tax Administration Act, Nigeria Revenue Service (Establishment) Act, and Joint Revenue Board Act), effective 1 January 2026. The package renamed FIRS to the Nigeria Revenue Service (NRS) and -- critically for e-invoicing -- put the fiscalisation regime''s penalties on a statutory footing: from 1 January 2026, failing to process taxable supplies through the e-invoicing system carries a NGN 200,000 penalty plus 100% of the tax due plus interest.',
  '["Note the authority rename: FIRS guidance and portals progressively re-badge as NRS from 1 Jan 2026.","Treat 1 Jan 2026 as the date e-invoicing penalties became legally enforceable, even where operational grace continued."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ng-large-golive-2025', id, '2025-08-01', 1,
    'https://www.premiumtimesng.com/business/business-news/814365-over-4000-large-taxpayers-yet-to-complete-firs-e-invoicing-system-onboarding-official.html',
    1, '[{"label":"FIRS/NRS e-invoicing portal","url":"https://einvoice.firs.gov.ng"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'NG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ng-large-golive-2025', 'en',
  'MBS goes live -- large taxpayers (>= NGN 5bn) begin clearing invoices',
  'On 1 August 2025 the Merchant Buyer Solution went live for large taxpayers (annual turnover of NGN 5 billion and above), with MTN Nigeria, Huawei Nigeria and IHS Nigeria transmitting the country''s first live cleared e-invoices. Nigeria''s model is pre-clearance for B2B/B2G -- each invoice is validated by the platform before delivery to the buyer, receiving a unique Invoice Reference Number (IRN) and cryptographic stamp with QR code -- plus 24-hour e-reporting for B2C sales. About 1,000 of the ~5,000 targeted large taxpayers onboarded within the first two weeks; the initial compliance deadline was extended in mid-August to 1 November 2025.',
  '["Large taxpayers (>= NGN 5bn turnover): onboard on the e-invoice portal and integrate via a certified system integrator or access-point provider.","Validate that outbound invoices receive an IRN and cryptographic stamp before delivery to buyers.","Set up 24-hour reporting for B2C transactions."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ng-peppol-authority-2025', id, '2025-09-26', 0,
    'https://peppol.org/members/peppol-authorities/',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'NG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ng-peppol-authority-2025', 'en',
  'Nigeria listed as a Peppol Authority -- the first in Africa',
  'On 26 September 2025 OpenPeppol listed Nigeria''s tax authority as a Peppol Authority -- the first African country on OpenPeppol''s authority list -- governing the local Peppol network, onboarding access-point providers, and registering Nigeria''s TIN under ISO/IEC 6523. The FIRS e-invoice schema follows UBL/Peppol BIS Billing 3.0 conventions (submitted as XML or JSON), placing Nigeria in the same Peppol-exchange-with-tax-clearance family as the newest European and Gulf designs. The listing now reads "Nigeria Revenue Service (NRS)" following the authority''s 1 January 2026 rename.',
  '["Service providers: Peppol access-point accreditation now runs under the national authority -- check NRS/NITDA certification requirements.","Multinationals with existing Peppol connectivity can plan to reuse it for Nigeria."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ng-large-mandatory-2025', id, '2025-11-01', 0,
    'https://sovos.com/regulatory-updates/vat/nigeria-firs-extends-e-invoicing-compliance-deadline-for-large-taxpayers/',
    0, '[]', NULL, 'b2b'
  FROM countries WHERE code = 'NG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ng-large-mandatory-2025', 'en',
  'Extended large-taxpayer compliance deadline',
  'FIRS extended the large-taxpayer compliance deadline from 1 August to 1 November 2025 (announced mid-August 2025), keeping the go-live date but giving the ~5,000 businesses in scope three further months to complete onboarding and integration. Penalties became legally enforceable on 1 January 2026 under the Nigeria Tax Administration Act, though operational grace continued into 2026.',
  '["Large taxpayers not yet live: complete onboarding, sandbox testing and production cutover before the deadline.","Document integration progress -- the authority requested evidence of active onboarding from stragglers."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ng-medium-golive-2026', id, '2026-07-01', 0,
    'https://europe.thomsonreuters.com/compliance/regulatory-updates/nigeria',
    1, '[{"label":"FIRS/NRS e-invoicing portal","url":"https://einvoice.firs.gov.ng"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'NG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ng-medium-golive-2026', 'en',
  'Medium taxpayers (NGN 1-5bn) go live',
  'Under the NRS''s phased schedule (public notice of 17 February 2026), medium taxpayers -- annual turnover between NGN 1 billion and NGN 5 billion -- became subject to mandatory e-invoicing from 1 July 2026, following an April-June 2026 pilot. A penalty soft-landing applies until enforcement begins in the January-March 2027 window.',
  '["Medium taxpayers: onboard now -- the pilot window (Apr-Jun 2026) was the intended integration runway.","Use the soft-landing period to stabilise integrations before penalty enforcement starts in early 2027."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ng-large-final-deadline-2026', id, '2026-07-31', 0,
    'https://www.thisdaylive.com/2026/07/20/nrs-issues-large-taxpayers-july-31-deadline-for-e-invoicing-compliance/',
    1, '[{"label":"FIRS/NRS e-invoicing portal","url":"https://einvoice.firs.gov.ng"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'NG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ng-large-final-deadline-2026', 'en',
  'Final large-taxpayer deadline -- enforcement begins',
  'The NRS set 31 July 2026 as the hard final deadline for large taxpayers to complete onboarding and live IRN transmission through the MBS, with compliance monitoring and enforcement actions from August 2026. Over 1,000 companies were compliant as of Q1 2026 (NRS chairman Zacch Adedeji) out of roughly 5,000 in scope -- non-compliant invoices carry the NGN 200,000 + 100%-of-tax penalty, and buyers lose the input-VAT credit on invoices issued outside the system.',
  '["Large taxpayers: live IRN transmission must be operational -- onboarding alone no longer suffices.","Buyers: verify inbound invoices carry valid IRNs; invoices outside MBS cost you the input-VAT credit.","Expect compliance monitoring visits and data requests from August 2026."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ng-emerging-golive-2027', id, '2027-07-01', 0,
    'https://europe.thomsonreuters.com/compliance/regulatory-updates/nigeria',
    1, '[{"label":"FIRS/NRS e-invoicing portal","url":"https://einvoice.firs.gov.ng"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'NG';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ng-emerging-golive-2027', 'en',
  'Emerging and small taxpayers go live',
  'The final wave of the NRS phased schedule: taxpayers below NGN 1 billion turnover become subject to mandatory e-invoicing from 1 July 2027, with enforcement from the January-March 2028 window. Micro businesses below NGN 50 million turnover -- under Nigeria''s VAT registration threshold -- are exempt.',
  '["Smaller businesses: use the long runway -- certified providers and the portal channel lower the entry cost.","Confirm whether your turnover keeps you under the NGN 50m exemption, and monitor for scope changes."]'
);
