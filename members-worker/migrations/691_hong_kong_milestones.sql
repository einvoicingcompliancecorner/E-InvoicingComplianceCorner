-- Hong Kong: milestones + English translations.
--
-- ONE ROW ON THE BOARD, AND IT IS NOT AN E-INVOICING ROW. Hong Kong has
-- no e-invoicing obligation to put there. What it does have, live since
-- 1 April 2026, is mandatory electronic filing of the profits tax
-- return with iXBRL-tagged financial statements. That is a real duty a
-- reader must act on, so it goes on the arrivals board with
-- mandate_scope 'none' -- the same treatment Switzerland's compulsory
-- online VAT filing got in migration 682, and for the same reason: a
-- filing channel is not an e-invoicing mandate and the scope column is
-- where that distinction is kept honest.
--
-- WHAT IS DELIBERATELY ABSENT. The IRD's stated ambition of full-scale
-- mandatory e-filing "by 2030" appears in a November 2021 consultation
-- paper and nowhere since. It is a goal, not a legislated deadline, and
-- no intermediate phase has been announced. Putting a 2030 row on the
-- timeline would require inventing a day, which is precisely the failure
-- that produced the phantom March 2026 Botswana mandate. It is stated on
-- the deep dive, with its provenance, instead.
--
-- Trade Single Window batches 2 and 3 are likewise absent: "targeted
-- mid-2027" is not a date, and customs declarations are not invoices.
-- The deep dive covers them.

-- 1. The consumption tax that was not introduced. Without this the page
--    cannot explain why Hong Kong has no tax invoice: it is a policy
--    outcome, not an oversight.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope, obligation_status) SELECT 'hk-gst-shelved', id, '2006-12-05', 0, 'https://www.info.gov.hk/gia/general/200612/05/P200612050102.htm', 0, '[]', NULL, 'none', 'context' FROM countries WHERE code = 'HK';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('hk-gst-shelved', 'en', 'The Government drops a goods and services tax from its tax-base consultation', 'The consultation launched in July 2006 proposed a low, single-rate GST. In December the Government withdrew it, the interim report recording that there was "insufficient public support nor are the conditions right". The final report of June 2007 closed the exercise. Every e-invoicing mandate on this site exists to protect a consumption tax; Hong Kong has none to protect, and this is the day that was settled.', '["Read Hong Kong''s empty mandate boxes as a consequence of this, not as a gap in our research"]');

-- 2. Where the government's own e-invoice channel came from.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope, obligation_status) SELECT 'hk-eprocurement-launch', id, '2009-12-29', 0, 'https://www.info.gov.hk/gia/general/200912/29/P200912290097.htm', 0, '[]', NULL, 'none', 'context' FROM countries WHERE code = 'HK';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('hk-eprocurement-launch', 'en', 'The e-Procurement Pilot Programme opens with three departments', 'Announced with a Procurement Portal, e-Catalogue, e-Sourcing and an internal workflow system, piloted at OGCIO, Immigration and Environmental Protection. Electronic invoice submission was added later. The programme is administered today by the Digital Policy Office, not the Government Logistics Department, and participation has been optional throughout its life.', '["Registering is not a condition of being invited to quote -- see clause 2.6 of the participation terms"]');

-- 3. The change most likely to be mistaken for an e-invoicing mandate.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope, obligation_status) SELECT 'hk-supplier-payments-electronic', id, '2025-06-01', 0, 'https://www.fstb.gov.hk/en/treasury/gov_procurement/guide-to-procurement.htm', 0, '[]', NULL, 'none', 'live' FROM countries WHERE code = 'HK';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('hk-supplier-payments-electronic', 'en', 'The Government stops paying suppliers by cheque', 'From this date the Government pays suppliers by bank transfer or FPS only, physical cheques having been withdrawn. This is an electronic PAYMENT change and touches the invoice not at all, but it is the single Hong Kong development most likely to be reported elsewhere as the arrival of e-invoicing. It is recorded here so that a reader who meets that claim can see what it actually was.', '["Give the paying department your bank details", "Do not read a payments change as an invoicing obligation"]');

-- 4. A genuine hard cutover, and genuinely not about invoices.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope, obligation_status) SELECT 'hk-tsw-phase3-rocars', id, '2026-05-01', 0, 'https://www.customs.gov.hk/en/customs-announcement/press-release/index_id_5259.html', 0, '[]', NULL, 'none', 'live' FROM countries WHERE code = 'HK';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('hk-tsw-phase3-rocars', 'en', 'Trade Single Window Phase 3 replaces the Road Cargo System', 'The first batch of Phase 3 took over road advance cargo information from ROCARS, which ceased operation at midnight with no parallel run. The statutory basis is the Import and Export (Amendment) Ordinance 2025, whose main provisions commenced on 11 July 2025. Trade Single Window carries customs and regulatory documents, not commercial invoices, and remaining batches are targeted for mid-2027 with no date fixed.', '["If you move road cargo, you are already on Trade Single Window", "Do not budget this as invoicing work"]');

-- 5. THE BOARD ROW. Hong Kong's only mandatory electronic obligation.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope, obligation_status) SELECT 'hk-ixbrl-efiling-phase1', id, '2026-04-01', 0, 'https://www.ird.gov.hk/eng/ppr/archives/26040102.htm', 1, '[{"label": "IRD — electronic filing of profits tax returns", "url": "https://www.ird.gov.hk/eng/tax/bus_epf.htm"}, {"label": "IRD — iXBRL filing and the taxonomy package", "url": "https://www.ird.gov.hk/eng/tax/bus_ixbrl.htm"}]', NULL, 'none', 'live' FROM countries WHERE code = 'HK';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('hk-ixbrl-efiling-phase1', 'en', 'Mandatory electronic filing of profits tax returns begins, with financial statements tagged in iXBRL', 'Phase one binds entities of multinational groups within scope of the global minimum tax and the Hong Kong minimum top-up tax, for years of assessment beginning on or after 1 April 2025. The basis is section 51AAB of and Schedule 65 to the Inland Revenue Ordinance. Once mandated, an entity stays mandated even if its group later falls out of scope. The IRD''s own taxonomy package and preparation tools are free but optional -- the iXBRL format is required, the tooling is not.', '["Establish whether your group is in scope of the Hong Kong minimum top-up tax -- that is the test", "Budget for tagging financial statements, not for transmitting invoices", "Once in, always in: plan for every subsequent year"]');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- The on_tracker count is the one to watch. One row, and it is the
-- iXBRL row -- assert the identity, not just the count, because a count
-- of one would also be satisfied by the wrong row being promoted.
--
-- ASSERT: SELECT count(*) FROM milestones WHERE country_id = (SELECT id FROM countries WHERE code = 'HK') = 5
-- ASSERT: SELECT count(*) FROM milestones WHERE on_tracker = 1 AND country_id = (SELECT id FROM countries WHERE code = 'HK') = 1
-- ASSERT: SELECT id FROM milestones WHERE on_tracker = 1 AND country_id = (SELECT id FROM countries WHERE code = 'HK') = 'hk-ixbrl-efiling-phase1'
-- ASSERT: SELECT count(*) FROM milestone_translations WHERE lang = 'en' AND milestone_id IN ('hk-gst-shelved','hk-eprocurement-launch','hk-supplier-payments-electronic','hk-tsw-phase3-rocars','hk-ixbrl-efiling-phase1') = 5
-- Nothing here is an e-invoicing-scope fact. If a future edit gives any
-- Hong Kong milestone a b2b or b2g_only scope, the map will recolour the
-- country with no error anywhere -- so pin the whole set at 'none'.
-- ASSERT: SELECT count(*) FROM milestones WHERE country_id = (SELECT id FROM countries WHERE code = 'HK') AND mandate_scope != 'none' = 0
