-- Turkey: milestones + English translations. Hand-written (not
-- scaffolded) since the research was already done for the Middle East
-- rollout recheck. Four milestones tracing e-Fatura/e-Arsiv from their
-- 2014 origin to the 2026 threshold changes still unfolding right now:
--
-- 1. tr-efatura-2014 (2014-04-01, anchor, off-board) -- e-Fatura
--    becomes mandatory; this is Turkey's actual mandate origin, dated
--    the same way South Korea's 2011 corporate mandate is (anchor=1,
--    on_tracker=0 -- a founding fact, not a live board entry 12 years
--    on).
-- 2. tr-edefter-2015 (2015-01-01, off-board, mandate_scope='none') --
--    e-Defter (electronic ledgers), a related bookkeeping duty, not
--    itself an invoicing-mandate-scope fact.
-- 3. tr-ewaybill-2023 (2023-07-01, on-board, mandate_scope='none') --
--    e-Irsaliye (e-Waybill/dispatch note) becomes mandatory above a
--    revenue threshold -- real, binding, recent, but a goods-movement
--    document rather than an invoice itself, so 'none' per
--    ADDING-A-COUNTRY.md's guidance (the Spain VeriFactu precedent).
-- 4. tr-earsiv-threshold-2026 (2026-01-01, on-board, mandate_scope=
--    'b2b') -- the e-Archive monetary floor is removed entirely
--    (mandatory regardless of invoice value) alongside the 2026
--    general/lower thresholds -- the "current floor" entry, same
--    shape as South Korea's 2024 threshold milestone, and the one
--    that correctly drives The Map's "inforce" status since it's a
--    past, on-board 'b2b' fact.

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'tr-efatura-2014', id, '2014-04-01', 1, 'https://sovos.com/en-gb/vat/tax-rules/e-transformation-turkey/', 0, '[]', NULL, 'b2b' FROM countries WHERE code = 'TR';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('tr-efatura-2014', 'en', 'e-Fatura becomes mandatory for larger taxpayers', 'From 1 April 2014, Turkey''s Revenue Administration (Gelir İdaresi Başkanlığı, GİB) made e-Fatura mandatory for companies with turnover exceeding TRY 5 million, alongside several sectors required regardless of size -- energy companies, fruit and vegetable wholesalers, online marketplaces and service providers, and importers. e-Fatura works as a clearance model: the seller submits a UBL-TR structured, digitally-signed invoice to GİB''s central platform, which validates it and distributes the cleared invoice to the registered buyer -- the seller and buyer never exchange the document directly. This built on e-Transformation groundwork GİB had been laying since 2012.', '["No action required yet for this historical milestone -- included for context ahead of the entries below", "Businesses already over the TRY 5 million threshold, or in one of the always-mandatory sectors, should confirm their e-Fatura registration if they haven''t already"]');

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'tr-edefter-2015', id, '2015-01-01', 0, 'https://sovos.com/en-gb/vat/tax-rules/e-transformation-turkey/', 0, '[]', NULL, 'none' FROM countries WHERE code = 'TR';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('tr-edefter-2015', 'en', 'e-Defter (electronic ledgers) becomes mandatory alongside e-Fatura', 'From 2015, e-Defter -- electronic general ledgers and journals, submitted to GİB in a standard XBRL-based format -- became mandatory for every e-Fatura user, as well as companies subject to independent audit under Turkish Commercial Code thresholds. This is a bookkeeping duty layered on top of e-Fatura, not a change to the invoicing mandate''s own scope.', '["No action required yet for this historical milestone -- included for context", "Any business already using e-Fatura should confirm its e-Defter submissions are current"]');

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'tr-ewaybill-2023', id, '2023-07-01', 0, 'https://sovos.com/en-gb/vat/tax-rules/e-transformation-turkey/', 1, '[{"label": "Revenue Administration (Gelir Idaresi Baskanligi, GIB) -- e-Belge portal", "url": "https://ebelge.gib.gov.tr"}]', NULL, 'none' FROM countries WHERE code = 'TR';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('tr-ewaybill-2023', 'en', 'e-Irsaliye (e-Waybill) becomes mandatory above a revenue threshold', 'From 1 July 2023, e-İrsaliye -- Turkey''s electronic dispatch note/waybill accompanying the physical movement of goods -- became mandatory for taxpayers with revenue exceeding TRY 10 million, with voluntary adoption open to everyone else. e-İrsaliye documents the goods movement itself rather than the sale, so it sits alongside e-Fatura rather than replacing any part of it -- a business can be fully e-Fatura compliant and still need to onboard e-İrsaliye separately once it crosses this threshold.', '["Confirm whether your revenue has crossed the TRY 10 million e-Irsaliye threshold, separately from any e-Fatura threshold check", "If you dispatch goods above the threshold, integrate e-Irsaliye issuance alongside your existing e-Fatura/e-Arsiv systems -- it is a distinct document type, not a variant of the invoice"]');

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'tr-earsiv-threshold-2026', id, '2026-01-01', 0, 'https://www.fiscal-requirements.com/news/5764-turkeys-2026-e-invoice-deadline-applies-to-businesses-exceeding-2025-turnover-thresholds', 1, '[{"label": "Revenue Administration (Gelir Idaresi Baskanligi, GIB) -- e-Belge portal", "url": "https://ebelge.gib.gov.tr"}]', NULL, 'b2b' FROM countries WHERE code = 'TR';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('tr-earsiv-threshold-2026', 'en', 'e-Arsiv''s monetary floor is removed; 2026 thresholds tighten further', 'From 1 January 2026, GİB removed the previous monetary floor on mandatory e-Arşiv issuance entirely -- any invoice to a non-e-Fatura-registered recipient must now be issued electronically as an e-Arşiv invoice regardless of its value, closing what had been a real gap for small transactions. Alongside this, the 2026 e-Fatura turnover threshold based on 2025 revenue is TRY 3 million generally, with a lower TRY 500,000 threshold applying to e-commerce businesses, and real-estate, motor-vehicle, and licensed-accommodation transactions. Registration for businesses crossing either threshold on 2025 revenue is due by 1 July 2026.', '["Check your 2025 revenue against the TRY 3 million general threshold, or the lower TRY 500,000 threshold if you''re in e-commerce, real estate, motor vehicles, or licensed accommodation", "If you cross either threshold, register for e-Fatura by 1 July 2026", "If you don''t cross the e-Fatura threshold, confirm your invoicing system now issues every e-Arsiv invoice electronically -- the prior low-value paper carve-out no longer applies"]');
