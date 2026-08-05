-- Japan: milestones + English translations. Six milestones, all
-- mandate_scope='none' -- deliberately, because Japan has no B2B or
-- B2G e-invoicing ISSUANCE mandate to color on the tracker's Map. What
-- exists instead is a real, dated tax-credit registration/documentation
-- regime (the Qualified Invoice System, mandatory since 1 October 2023
-- but format-agnostic -- paper and PDF both remain fully valid) layered
-- with a genuinely voluntary electronic e-invoicing standard (JP PINT /
-- Peppol, led by the Digital Agency since 2021). This mirrors how the
-- tracker has treated other "no general issuance mandate" countries
-- (Australia, Finland, the US) before/absent a real mandate.
--
-- Live-researched against Japan's Digital Agency (digital.go.jp), the
-- National Tax Agency (nta.go.jp) -- including its own PDF "JAPAN
-- INVOICE SYSTEM Oct.1,2023- (revised Apr. 2026)" for the transitional
-- relief percentages/dates -- and industry sources (EDICOM, Peppol.org).
--
-- 1. jp-peppol-authority-2021 (2021-09-01, anchor, off-board,
--    mandate_scope='none') -- Japan's Digital Agency is established and
--    becomes Japan's official Peppol Authority, launching the Japan
--    Peppol eInvoice initiative. An institutional milestone, not a
--    mandate.
-- 2. jp-registration-opens-2021 (2021-10-01, off-board,
--    mandate_scope='none') -- T-number registration for the (not yet
--    effective) Qualified Invoice System opens with the NTA, a 2-year
--    lead-in before the 2023 mandate takes effect.
-- 3. jp-invoice-system-effective-2023 (2023-10-01, anchor, on-board,
--    mandate_scope='none') -- the flagship milestone: the Qualified
--    Invoice System takes effect under the Consumption Tax Act. This is
--    explicitly NOT an e-invoicing issuance mandate -- paper and PDF
--    qualified invoices are both fully valid; only registration and
--    specific invoice CONTENT are required, for input-tax-credit
--    purposes.
-- 4. jp-pint-implementation-plan-2024 (2024-09-30, off-board,
--    mandate_scope='none') -- the Digital Agency announces an
--    implementation plan covering JP PINT and a "Wildcard Scheme"
--    extension -- continued build-out of the voluntary e-invoicing
--    layer.
-- 5. jp-transitional-relief-70pct-2026 (2026-10-01, on-board,
--    mandate_scope='none') -- the small-business transitional
--    input-tax-credit relief on purchases from non-registered suppliers
--    steps down from 80% to 70%, per the NTA's own published schedule.
-- 6. jp-transitional-relief-50pct-2028 (2028-10-01, on-board,
--    confidence='expected', mandate_scope='none') -- steps down again
--    to 50%; further scheduled reductions (30% from Oct 2030, expected
--    elimination after Sep 2031) follow under the same NTA framework.
--
-- Deliberately NOT built as a milestone: a hypothetical future
-- mandatory e-invoicing ISSUANCE requirement -- no such proposal with a
-- dated timeline was found in research. If one emerges, it would be the
-- first milestone in this set warranting mandate_scope='b2b'.

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'jp-peppol-authority-2021', id, '2021-09-01', 1, 'https://www.digital.go.jp/en/policies/electronic_invoice', 0, '[]', NULL, 'none' FROM countries WHERE code = 'JP';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('jp-peppol-authority-2021', 'en', 'Japan''s Digital Agency launches, becomes Japan''s Peppol Authority', 'On 1 September 2021, Japan established its Digital Agency, tasked with driving the country''s digital transformation. The Digital Agency has served as Japan''s official Peppol Authority since its founding, leading the Japan Peppol eInvoice initiative that would go on to develop JP PINT, Japan''s own Peppol PINT BIS Billing-compliant e-invoicing specification. This is an institutional milestone, not a mandate -- it lays the groundwork for a voluntary electronic e-invoicing standard, not a legal requirement to use one.', '["No action required -- this is background context for the voluntary JP PINT/Peppol standard covered in later milestones", "If you''re evaluating e-invoicing standards for trading with Japanese partners, note the Digital Agency -- not the National Tax Agency -- as the authority behind Japan''s Peppol implementation"]');

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'jp-registration-opens-2021', id, '2021-10-01', 0, 'https://www.nta.go.jp/english/taxes/consumption_tax/pdf/2022/simplified_13.pdf', 0, '[]', NULL, 'none' FROM countries WHERE code = 'JP';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('jp-registration-opens-2021', 'en', 'Qualified Invoice System registration opens with the National Tax Agency', 'From 1 October 2021, businesses could begin applying to Japan''s National Tax Agency (NTA) for registration as a "qualified invoice issuer" ahead of the Qualified Invoice System''s 1 October 2023 effective date. Registered businesses receive a 14-digit registration number (a "T-number") that must appear on any qualified invoice they issue. This two-year lead-in gave businesses time to register before the consumption-tax input-credit rules tied to registration took effect.', '["If you supply business customers in Japan and haven''t yet registered for a T-number, check your registration status with the NTA before the input-tax-credit rules described in the next milestone affect your customers", "Confirm your invoicing software has a field for the 14-digit T-number ahead of the 2023 effective date"]');

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'jp-invoice-system-effective-2023', id, '2023-10-01', 1, 'https://www.nta.go.jp/english/taxes/consumption_tax/pdf/2023/general_04.pdf', 1, '[{"label": "National Tax Agency (NTA)", "url": "https://www.nta.go.jp/"}]', NULL, 'none' FROM countries WHERE code = 'JP';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('jp-invoice-system-effective-2023', 'en', 'The Qualified Invoice System (Invoice System) takes effect', 'From 1 October 2023, Japan''s Qualified Invoice System (適格請求書等保存方式) took effect under the Consumption Tax Act. To claim input tax credit on a purchase, a business customer generally needs a "qualified invoice" -- issued by an NTA-registered supplier and containing specific mandatory content: the issuer''s name and 14-digit T-number, the issuance date, an itemized description of goods/services, amounts split by the applicable consumption-tax rate, and the total consumption tax amount. Crucially, this is NOT an e-invoicing issuance mandate: paper and PDF qualified invoices are both fully valid, and nothing in the law requires the invoice to be transmitted or issued electronically. It''s a registration and documentation regime tied to tax-credit eligibility. Qualified invoices and related records must be retained for a minimum of 7 years.', '["Confirm you''re registered as a qualified invoice issuer with the NTA if your business customers rely on your invoices for input tax credit", "Check that your invoicing template or software includes all six mandatory qualified-invoice elements, including your T-number -- the format, paper, PDF, or electronic, remains your choice"]');

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'jp-pint-implementation-plan-2024', id, '2024-09-30', 0, 'https://www.digital.go.jp/en/policies/electronic_invoice', 0, '[]', NULL, 'none' FROM countries WHERE code = 'JP';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('jp-pint-implementation-plan-2024', 'en', 'Digital Agency announces JP PINT / Wildcard Scheme implementation plan', 'On 30 September 2024, Japan''s Digital Agency announced an implementation plan covering JP PINT -- Japan''s Peppol PINT BIS Billing-compliant e-invoicing specification, developed with industry body EIPA -- and a "Wildcard Scheme" extension. This continues to build out the voluntary electronic e-invoicing layer that sits alongside, and remains entirely separate from, the mandatory paper-or-electronic Qualified Invoice System that took effect the previous year. No business is required to adopt JP PINT or Peppol.', '["If your trading partners are moving toward structured e-invoicing, evaluate whether adopting JP PINT/Peppol makes sense for your business -- it remains entirely optional", "Track future JP PINT specification updates via the Digital Agency''s own JP PINT page"]');

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'jp-transitional-relief-70pct-2026', id, '2026-10-01', 0, 'https://www.nta.go.jp/taxes/shiraberu/zeimokubetsu/shohi/keigenzeiritsu/pdf/0024006-039_01.pdf', 1, '[{"label": "National Tax Agency (NTA)", "url": "https://www.nta.go.jp/"}]', NULL, 'none' FROM countries WHERE code = 'JP';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('jp-transitional-relief-70pct-2026', 'en', 'Small-business transitional input-tax-credit relief steps down to 70%', 'From 1 October 2026, the transitional relief that lets buyers deduct part of the consumption tax on purchases from NON-registered suppliers (those who haven''t opted into the Qualified Invoice System) steps down from 80% to 70%, per the National Tax Agency''s published schedule. This taper -- 80% from October 2023, 70% from October 2026, 50% from October 2028, 30% from October 2030 -- gradually increases the tax cost of buying from unregistered suppliers, an economic incentive to register rather than a direct penalty.', '["If you buy from suppliers who haven''t registered for the Qualified Invoice System, budget for the reduced 70% deductible share on those purchases from this date", "Consider whether encouraging your unregistered suppliers to register would reduce your own tax exposure going forward"]');

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'jp-transitional-relief-50pct-2028', id, '2028-10-01', 0, 'https://www.nta.go.jp/taxes/shiraberu/zeimokubetsu/shohi/keigenzeiritsu/pdf/0024006-039_01.pdf', 1, '[{"label": "National Tax Agency (NTA)", "url": "https://www.nta.go.jp/"}]', 'expected', 'none' FROM countries WHERE code = 'JP';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('jp-transitional-relief-50pct-2028', 'en', 'Transitional relief steps down again to 50%, with further reductions scheduled', 'From 1 October 2028, the same NTA transitional-relief taper for purchases from non-registered suppliers drops again, from 70% to 50%. Further scheduled reductions follow under the same framework: 30% from 1 October 2030 through 30 September 2031, after which the relief is expected to be eliminated entirely, though the NTA source reviewed didn''t explicitly confirm that end state. Separately, smaller businesses (taxable sales of JPY 100 million or less, or JPY 50 million or less for certain specified periods) can continue claiming credit on purchases under JPY 10,000 tax-inclusive using ledger records alone, with no qualified invoice needed, through 30 September 2029.', '["Model the declining deductible share -- 50% from Oct 2028, 30% from Oct 2030 -- into your medium-term planning if a meaningful share of your purchases come from non-registered suppliers", "If you''re a smaller business, check whether the JPY 10,000 ledger-only exception, available through 30 Sep 2029, reduces your qualified-invoice burden for low-value purchases"]');
