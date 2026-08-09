-- ================================================================
-- Kenya (KE) milestones + EN translations. 7 milestones, 4 on the
-- tracker board (anchor: the 30 Nov 2022 TIMS deadline -- the date
-- from which VAT-registered businesses have had to issue electronic
-- tax invoices).
--
-- Sourcing (7 Aug 2026 research session, house standard): built
-- almost entirely from KRA's own pages (public notices 1944 & 2323,
-- the KRA ETR blog, KRA eTIMS FAQ/solutions pages) plus Big-4 alerts
-- (EY) for the statute-level changes. Kenya's model: device-based
-- fiscalisation (TIMS ETRs) evolved into software/API-based
-- continuous transaction reporting (eTIMS) -- invoices transmit to
-- KRA in real time or near-real time at issuance. No B2G-only phase
-- ever existed (scope has always been transaction-type-agnostic), so
-- no milestone uses mandate_scope='b2g_only'.
--
-- Deliberately excluded per the sourcing standard: the claimed
-- "Finance Act 2026 redefines allowable expenses" (not corroborated
-- -- the deductibility rule dates from Finance Act 2023, and FA2026's
-- eTIMS change was a penalty reduction per a single law-firm source);
-- FA2026 penalty figures (single-source, PLAUSIBLE only); the exact
-- eTIMS wire format (XML vs JSON API -- sources conflict, so
-- descriptions say "structured format via KRA's eTIMS API"); the
-- "1 Jan 2025 mandatory pre-filled VAT returns" date (secondary
-- only).
-- ================================================================

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ke-tims-regulations-2020', id, '2020-09-25', 0,
    'https://www.kra.go.ke/news-center/blog/1691-what-you-should-know-about-the-upgraded-electronic-tax-registers-etrs',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'KE';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ke-tims-regulations-2020', 'en',
  'Electronic Tax Invoice Regulations gazetted (TIMS)',
  'The VAT (Electronic Tax Invoice) Regulations, 2020 (Legal Notice No. 189 of 25 September 2020) created the legal basis for Kenya''s Tax Invoice Management System (TIMS): VAT-registered businesses would have to replace their old fiscal-memory Electronic Tax Registers (in use since 2005) with internet-enabled devices that validate each invoice and transmit it to the Kenya Revenue Authority in real time or near-real time. The rollout itself began on 1 August 2021 with a 12-month migration window.',
  '["No immediate obligation at gazettement -- the migration window opened 1 August 2021.","VAT-registered businesses needed to plan the upgrade to a TIMS-compliant ETR device (Types A-D, by business type and volume)."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ke-tims-mandatory-2022', id, '2022-11-30', 1,
    'https://www.kra.go.ke/news-center/blog/1691-what-you-should-know-about-the-upgraded-electronic-tax-registers-etrs',
    1, '[{"label":"KRA -- eTIMS information hub","url":"https://www.kra.go.ke/business/etims-electronic-tax-invoice-management-system/learn-about-etims/types-of-etims-solutions"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'KE';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ke-tims-mandatory-2022', 'en',
  'Electronic tax invoices mandatory for all VAT-registered businesses',
  'After a one-year migration window (from 1 August 2021) and a public-notice extension, 30 November 2022 was the final deadline for every VAT-registered business in Kenya to issue electronic tax invoices through TIMS-compliant devices, validated and transmitted to KRA at issuance. From 1 June 2023 KRA enforced the regime hard: only electronic tax invoices are accepted to support input VAT claims and refunds, and non-compliant taxpayers face withheld Tax Compliance Certificates.',
  '["Confirm every sales system issues invoices through TIMS/eTIMS with KRA validation.","Check inbound supplier invoices are valid electronic tax invoices -- non-compliant purchase invoices cannot support input VAT claims.","If a compliance gap exists, engage KRA early: Tax Compliance Certificates are withheld from non-compliant businesses."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ke-etims-all-businesses-2023', id, '2023-09-01', 0,
    'https://www.ey.com/en_gl/technical/tax-alerts/kenya-requires-non-vat-registered-taxpayers-to-onboard-on-e-tims',
    1, '[{"label":"eTIMS taxpayer portal","url":"https://etims.kra.go.ke"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'KE';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ke-etims-all-businesses-2023', 'en',
  'eTIMS extended to ALL businesses -- including non-VAT-registered',
  'The Finance Act 2023 inserted section 23A into the Tax Procedures Act, extending the electronic tax invoice obligation beyond VAT-registered taxpayers to every person carrying on business in Kenya -- companies, partnerships and sole proprietors, including rental-income, turnover-tax and income-tax-only payers -- effective 1 September 2023. KRA''s free eTIMS software channels (portal, app, USSD *222# via eTIMS Lite) replaced the need for hardware devices, with a penalty-free onboarding window for non-VAT businesses that closed on 31 March 2024. Businesses with turnover at or below KES 5 million are not required to onboard directly -- instead their buyers must capture the purchase via reverse (buyer-initiated) invoicing.',
  '["Every business -- VAT-registered or not -- should be onboarded on eTIMS (portal, app, eCitizen Lite, or USSD *222#).","Small suppliers (turnover <= KES 5m): expect your business buyers to self-issue reverse invoices for purchases from you.","Buyers purchasing from small unregistered suppliers must generate buyer-initiated invoices through eTIMS."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ke-deductibility-2024', id, '2024-01-01', 0,
    'https://www.ey.com/en_gl/technical/tax-alerts/kenya-enacts-tax-changes-under-finance-act--2023',
    1, '[{"label":"eTIMS taxpayer portal","url":"https://etims.kra.go.ke"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'KE';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ke-deductibility-2024', 'en',
  'No eTIMS invoice, no tax deduction',
  'From 1 January 2024, section 16(1)(c) of the Income Tax Act (as amended by the Finance Act 2023) disallows any business expense that is not supported by an electronic tax invoice generated through TIMS/eTIMS. This is Kenya''s sharpest enforcement mechanism: rather than only policing issuers, it turns every business buyer into an enforcer, because a paper or non-compliant invoice from a supplier now costs the buyer the income-tax deduction on that whole expense.',
  '["Reject supplier invoices that are not eTIMS-generated -- they cost you the income-tax deduction.","Ensure your own invoices carry the buyer''s PIN where the buyer will claim the expense.","Reconcile expense records against eTIMS purchase data before filing income tax returns."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ke-eti-regulations-2024', id, '2024-05-03', 0,
    'https://www.ey.com/en_gl/technical/tax-alerts/kenya-gazettes-tax-procedures-electronic-tax-invoice-regulations-2024',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'KE';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ke-eti-regulations-2024', 'en',
  'Electronic Tax Invoice Regulations 2024 gazetted',
  'The Tax Procedures (Electronic Tax Invoice) Regulations, 2024 (Legal Notice No. 64, gazetted 3 May 2024) codified the operational detail of the eTIMS regime: mandatory invoice content (seller PIN, buyer PIN where the buyer will claim the expense, unique system and invoice identifiers, QR code), a 24-hour written-notice rule for system failures, and the scope exclusions (emoluments, imports, interest, airline ticketing, final-withholding-tax payments, and supplies by non-residents without a Kenyan permanent establishment). Notably, a draft full exemption for businesses under KES 5 million turnover was scrapped -- the obligation shifts to the buyer instead.',
  '["Verify your invoice layouts carry all mandatory content fields, including the QR code and buyer PIN where relevant.","Put a 24-hour KRA notification process in place for system outages.","Map which of your transaction types fall under the regulation''s exclusions."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ke-reverse-invoicing-2024', id, '2024-12-27', 0,
    'https://taxnews.ey.com/news/2025-0233-kenya-enacts-changes-under-the-tax-laws-amendment-act-2024-and-other-legislation',
    0, '[]', NULL, 'b2b'
  FROM countries WHERE code = 'KE';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ke-reverse-invoicing-2024', 'en',
  'Buyer-initiated invoicing mandatory for small-supplier purchases',
  'The Tax Procedures (Amendment) Act 2024 and Tax Laws (Amendment) Act 2024 (both effective 27 December 2024) formalised reverse invoicing: business buyers must self-issue electronic invoices through eTIMS for purchases from suppliers with annual turnover at or below KES 5 million, and KRA gained the power to compel data-system integration for businesses above KES 5 million turnover, backed by a penalty of up to KES 100,000 per month for failure to integrate.',
  '["If you buy from small suppliers, set up buyer-initiated invoicing in eTIMS for those purchases.","Businesses above KES 5m turnover: prepare for KRA-compelled system integration if not already integrated."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ke-return-validation-2026', id, '2026-01-01', 0,
    'https://www.kra.go.ke/news-center/public-notices/2323-validation-of-income-and-expenses-in-the-income-tax-returns',
    1, '[{"label":"iTax (returns filing)","url":"https://itax.kra.go.ke"},{"label":"eTIMS taxpayer portal","url":"https://etims.kra.go.ke"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'KE';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ke-return-validation-2026', 'en',
  'KRA cross-checks every income tax return against eTIMS data',
  'Per a KRA public notice of 10 November 2025, from 1 January 2026 the declared income and expenses in income tax returns (2025 year of income onward) are validated against TIMS/eTIMS invoice data, withholding tax records and customs import records. In practice KRA takes the higher of declared income versus eTIMS sales data, and the lower of declared expenses versus eTIMS purchase data -- so unsupported expenses face administrative disallowance at filing time. This operationalises, at national scale, the "no eTIMS invoice, no deduction" rule in force since January 2024.',
  '["Reconcile your books against eTIMS sales and purchase data BEFORE filing -- discrepancies now surface automatically.","Chase suppliers for compliant e-invoices during the year, not at filing time.","Confirm withholding-tax credits and customs import records match your declared figures."]'
);
