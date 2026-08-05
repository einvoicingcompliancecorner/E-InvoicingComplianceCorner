-- Hungary: milestones + English translations. Hand-written, following the
-- Czech Republic/Taiwan pattern. Six milestones -- a genuinely rich
-- history for this tracker, live-researched against the International VAT
-- Association's own 2018 launch writeup, Sovos, EDICOM, vatit.com,
-- globalvatcompliance.com, RTC Suite, and VATupdate's December 2025
-- briefing:
--
-- 1. hu-rtir-launch-2018 (2018-07-01, anchor, off-board,
--    mandate_scope='none') -- Real-Time Invoice Reporting (RTIR) launches
--    via NAV's Online Szamla system: invoices with a VAT amount above HUF
--    100,000 had to be reported, immediately for software-generated
--    invoices, within 5 days (HUF 100,000-500,000) or 1 day (above HUF
--    500,000) for handwritten paper invoices. A pure transaction-data
--    reporting duty from day one -- the invoice itself could remain paper
--    or PDF; only its data had to reach NAV.
-- 2. hu-rtir-threshold-2020 (2020-07-01, on-board, mandate_scope='none')
--    -- the HUF 100,000 threshold is eliminated: every domestic B2B
--    invoice must be reported regardless of value.
-- 3. hu-rtir-scope-2021 (2021-01-01, on-board, mandate_scope='none') --
--    reporting extends to B2C invoices, intra-Community supplies, and
--    exports -- by this point RTIR covers essentially every VAT-relevant
--    transaction a Hungarian business issues.
-- 4. hu-energy-b2b-2025 (2025-07-01, on-board, mandate_scope='b2b') --
--    genuinely different in kind from the three RTIR entries above: from
--    this date, electricity, natural gas, and water utility suppliers
--    must actually ISSUE electronic invoices (not just report data) for
--    B2B supplies to non-private customers. Hungary's first real,
--    sector-specific e-invoicing issuance mandate.
-- 5. hu-b2c-receipt-2026 (2026-09-01, on-board, mandate_scope='none') --
--    the reporting net widens again, this time to receipts: all
--    businesses must supply receipt data to NAV, automatically via
--    connected cash registers/e-cash registers or within 3 days
--    otherwise. Full transition to e-cash registers follows by 1 July
--    2028. A receipt/sales-reporting duty, not an invoicing one -- the
--    same VeriFactu/EET-style treatment used elsewhere in this tracker.
-- 6. hu-vida-2030 (2030-07-01, on-board, mandate_scope='b2b') -- the
--    confirmed EU-wide ViDA cross-border floor, same as every other
--    tracked EU member state (Cyprus, Austria, Greece, Netherlands, Czech
--    Republic).
--
-- Deliberately NOT built as a milestone: the November 2025 NAV/Ministry
-- for National Economy public consultation on a comprehensive future
-- B2B/B2G e-invoicing framework (unified EN 16931 XML, buyer-side
-- reporting, optional Peppol), updated as a concept paper on 31 March
-- 2026. No enacted date exists for this yet -- same "real, sourced, but
-- not yet law" treatment already applied to Qatar's draft law and
-- Austria's pending B2B proposal. Covered instead as a story (352).

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'hu-rtir-launch-2018', id, '2018-07-01', 1, 'https://www.vatassociation.org/2018/02/26/hungary-real-time-invoice-reporting/', 0, '[]', NULL, 'none' FROM countries WHERE code = 'HU';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('hu-rtir-launch-2018', 'en', 'Real-Time Invoice Reporting (RTIR) launches', 'From 1 July 2018, Hungary''s National Tax and Customs Administration (NAV) required domestic B2B invoices with a VAT amount above HUF 100,000 to be reported through the Online Szamla system. Software-generated invoices had to be reported immediately, without human intervention; handwritten paper invoices had 5 calendar days (VAT HUF 100,000-500,000) or 1 calendar day (VAT above HUF 500,000). This is a transaction-data reporting duty, not an e-invoicing mandate -- the invoice itself could remain paper or PDF, and nothing required it to be issued electronically. Only its data had to reach NAV, in real time.', '["No action required yet for this historical milestone -- included for context ahead of the entries below", "If you already report under RTIR, note that the original HUF 100,000 threshold and manual-invoice grace periods described here have since been superseded -- see the following milestones"]');

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'hu-rtir-threshold-2020', id, '2020-07-01', 0, 'https://sovos.com/vat/tax-rules/rtir-hungary/', 1, '[{"label": "NAV Online Szamla", "url": "https://onlineszamla.nav.gov.hu/"}]', NULL, 'none' FROM countries WHERE code = 'HU';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('hu-rtir-threshold-2020', 'en', 'RTIR''s VAT threshold is eliminated -- every domestic B2B invoice must be reported', 'From 1 July 2020, the HUF 100,000 VAT threshold that had limited RTIR''s scope since 2018 was removed entirely: every domestic B2B invoice between taxable persons in Hungary now has to be reported to NAV via Online Szamla, regardless of its value. Still a data-reporting duty rather than an e-invoicing mandate -- issuing the invoice itself electronically remains optional.', '["Confirm your invoicing or accounting software reports every domestic B2B invoice to Online Szamla, not just those above the old HUF 100,000 threshold", "Review any manual/low-value invoicing workflow that assumed small invoices fell outside RTIR -- that carve-out no longer exists"]');

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'hu-rtir-scope-2021', id, '2021-01-01', 0, 'https://www.globalvatcompliance.com/e-invoicing-in-hungary/', 1, '[{"label": "NAV Online Szamla", "url": "https://onlineszamla.nav.gov.hu/"}]', NULL, 'none' FROM countries WHERE code = 'HU';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('hu-rtir-scope-2021', 'en', 'RTIR extends to B2C, exports, and intra-Community supplies', 'From 1 January 2021, Hungary widened RTIR''s scope again to cover B2C invoices, intra-Community supplies, and export invoices -- not just domestic B2B. By this point, RTIR''s real-time transaction-data reporting duty applies to essentially every VAT-relevant invoice a Hungarian business issues, regardless of who the customer is or where they''re located. This remains a reporting obligation, not a requirement to issue e-invoices.', '["Extend your RTIR reporting coverage to B2C, export, and intra-Community invoices if it was previously scoped to domestic B2B only", "Confirm your invoicing system captures and reports the correct transaction type for each of these newly in-scope categories"]');

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'hu-energy-b2b-2025', id, '2025-07-01', 0, 'https://vatit.com/e-invoicing-guide/hungary/', 1, '[{"label": "Nemzeti Ado- es Vamhivatal (NAV)", "url": "https://nav.gov.hu/"}]', NULL, 'b2b' FROM countries WHERE code = 'HU';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('hu-energy-b2b-2025', 'en', 'Electricity, gas, and water suppliers must issue e-invoices for B2B customers', 'From 1 July 2025, invoices for the supply of electricity, natural gas, and water utilities to non-private (business) customers must be issued exclusively in electronic form. This is a genuinely different obligation from RTIR''s data-reporting duty above: it''s Hungary''s first real requirement that an invoice actually be issued electronically, not merely reported. The legislation doesn''t prescribe a specific format or transmission channel -- any format and method accepted by NAV qualifies. Scope is narrow -- energy and water B2B supplies only -- not an economy-wide B2B e-invoicing mandate.', '["If you supply electricity, natural gas, or water to business customers in Hungary, confirm your invoicing process issues electronic invoices, not paper, for those supplies", "Because no specific format is mandated, confirm with your counterpart or NAV which electronic format and channel they''ll actually accept before relying on this alone"]');

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'hu-b2c-receipt-2026', id, '2026-09-01', 0, 'https://rtcsuite.com/e-invoicing-hungary/', 1, '[{"label": "NAV Online Szamla", "url": "https://onlineszamla.nav.gov.hu/"}]', NULL, 'none' FROM countries WHERE code = 'HU';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('hu-b2c-receipt-2026', 'en', 'Receipt data reporting to NAV becomes mandatory', 'From 1 September 2026, Hungarian businesses must also supply receipt data -- not just invoice data -- to NAV''s systems. Businesses using connected cash registers or e-cash registers comply automatically; others must transmit receipt data within 3 days. A full transition to e-cash registers is required by 1 July 2028. Like RTIR itself, this is a data-reporting duty covering the receipt/point-of-sale side of a transaction, not a requirement to issue receipts or invoices in any particular electronic format.', '["If you issue paper receipts without a connected cash register, plan for either transmitting receipt data within 3 days or adopting a connected/e-cash register ahead of this date", "Budget for the full e-cash-register transition required by 1 July 2028, even if your current process only needs the 3-day manual reporting route for now"]');

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'hu-vida-2030', id, '2030-07-01', 0, 'https://taxation-customs.ec.europa.eu/taxation/vat/vat-digital-age-vida_en', 1, '[{"label": "EC — eInvoicing in Hungary", "url": "https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108888/eInvoicing+in+Hungary"}]', NULL, 'b2b' FROM countries WHERE code = 'HU';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('hu-vida-2030', 'en', 'ViDA cross-border B2B digital reporting takes effect', 'Regardless of whether Hungary ever enacts a general domestic B2B e-invoicing mandate -- as of this writing, only sector-specific rules (energy/water) and data-reporting duties (RTIR, receipts) exist, though a comprehensive framework is under consultation -- the EU''s VAT in the Digital Age (ViDA) directive requires structured e-invoicing and digital reporting for intra-Community B2B transactions from 1 July 2030, confirmed EU law (Council Directive (EU) 2025/516).', '["Businesses trading cross-border within the EU should plan for EN 16931-compliant e-invoicing and reporting capability by this date, independent of Hungary''s own domestic timeline", "Watch Hungary''s own comprehensive e-invoicing consultation (opened November 2025) for signs its domestic rollout may arrive ahead of this EU-wide floor"]');
