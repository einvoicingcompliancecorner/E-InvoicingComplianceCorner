-- Thailand: milestones + English translations.
--
-- ONE ROW ON THE BOARD, AND IT IS THE LAPSE OF AN INCENTIVE. Thailand
-- has no e-invoicing obligation to put there -- both routes are
-- voluntary in the words of their own instruments. What a reader must
-- actually act on is that the 200 per cent corporate income tax
-- deduction that drove adoption EXPIRED on 31 December 2025, and the
-- replacement covering 2026-2027 has Cabinet approval and a Revenue
-- Department press release behind it but no Royal Decree we could find.
-- Anyone investing during 2026 is relying on an announced measure that
-- is not yet law. That is the actionable fact on this country.
--
-- WHAT IS DELIBERATELY ABSENT. The "Digital Tax Ecosystem" roadmap that
-- several vendors publish -- large companies 2025, all taxpayers 2028 --
-- appears in no primary source we could reach. Putting those dates on a
-- timeline would manufacture a mandate schedule out of vendor
-- commentary, which is the third time this month we have declined to do
-- that. It is on the deep dive as unverified instead.

-- 1. The enabling framework. An authorisation, never an obligation.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope, obligation_status) SELECT 'th-ministerial-reg-384', id, '2022-07-20', 0, 'https://www.rd.go.th/fileadmin/user_upload/kormor/newlaw/mr384.pdf', 0, '[]', NULL, 'none', 'context' FROM countries WHERE code = 'TH';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('th-ministerial-reg-384', 'en', 'Ministerial Regulation No. 384 authorises electronic tax documents', 'Issued 8 July 2022 under Revenue Code s.3 odd and s.4 as amended by the Revenue Code Amendment Act (No. 53), published in the Royal Gazette on 20 July and in force thirty days later. It permits electronic preparation, delivery and retention of tax documents. Read what it does carefully: it authorises, it does not compel, and every Thai e-invoicing instrument since has kept that shape.', '["Treat this as the permission slip, not a deadline"]');

-- 2. The second voluntary route.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope, obligation_status) SELECT 'th-etax-by-timestamp', id, '2023-06-01', 0, 'https://www.rd.go.th/fileadmin/user_upload/kormor/newlaw/pa_time_stampA.pdf', 0, '[]', NULL, 'none', 'context' FROM countries WHERE code = 'TH';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('th-etax-by-timestamp', 'en', 'The e-Tax Invoice by Time Stamp route takes effect for smaller businesses', 'Announced by the Revenue Department on 12 May 2023 and effective from this date. A VAT registrant with annual revenue up to THB 30 million may e-mail a PDF/A-3 invoice to the buyer, copying ETDA, which applies a trusted time stamp and returns the stamped file to both parties. The Thai instruments call this the Time Stamp route; the Revenue Department''s user-facing pages call it e-Tax Invoice by Email. They are the same thing.', '["Check the THB 30 million ceiling before choosing this route", "You cannot run this and the full XML system at the same time"]');

-- 3. The incentive that drove adoption.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope, obligation_status) SELECT 'th-deduction-decree-766', id, '2023-06-28', 0, 'https://www.rd.go.th/1603.html', 0, '[]', NULL, 'none', 'context' FROM countries WHERE code = 'TH';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('th-deduction-decree-766', 'en', 'A 200 per cent deduction for e-Tax Invoice and e-Withholding Tax investment', 'Royal Decree No. 766 gave a double deduction — the ordinary 100 per cent plus a further 100 — for investment in e-Tax Invoice, e-Receipt and e-Withholding Tax systems, covering hardware, software and service-provider fees. The implementing Director-General announcement is dated 28 June 2023 and applied retroactively from 1 January 2023. Thailand drives adoption with incentives rather than obligations, and this is the clearest instance.', '["If you invested between 2023 and 2025, check the claim deadline with your adviser"]');

-- 4. THE BOARD ROW.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope, obligation_status) SELECT 'th-deduction-lapsed', id, '2025-12-31', 0, 'https://www.rd.go.th/fileadmin/user_upload/news/2569thai/news14_2569.pdf', 1, '[{"label": "Revenue Department — press release 14/2569", "url": "https://www.rd.go.th/fileadmin/user_upload/news/2569thai/news14_2569.pdf"}]', NULL, 'none', 'live' FROM countries WHERE code = 'TH';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('th-deduction-lapsed', 'en', 'The 200 per cent deduction expires, and its replacement is not yet law', 'Royal Decree No. 766 ran to 31 December 2025 and was not renewed before it lapsed. On 16 June 2026 the Cabinet approved a two-year extension at the same 200 per cent for 2026 and 2027, newly covering ETDA system-assessment fees, together with a cut in e-Withholding Tax rates to a flat 1 per cent. The Revenue Department announced it in press release 14/2569. As at 27 August 2026 no enacting Royal Decree appears on the Department''s own decree index, so expenditure incurred during 2026 rests on an approved but unpromulgated measure.', '["Do not book the 2026 deduction as certain until the Royal Decree is published", "Watch the Revenue Department decree index rather than the press release", "Keep the invoices and assessment fees documented either way"]');

-- 5. Where enforcement energy actually goes.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope, obligation_status) SELECT 'th-fake-invoice-operation', id, '2026-08-17', 0, 'https://www.rd.go.th/59.html', 0, '[]', NULL, 'none', 'context' FROM countries WHERE code = 'TH';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('th-fake-invoice-operation', 'en', 'A second large fake-invoice enforcement operation is announced', 'Press release 20/2569 reports an operation against fraudulent tax invoices with damage put at around 360 million baht, following a similar action earlier in the year. It is recorded here because it answers the question a reader actually has about a country with no mandate: where does the tax administration put its effort? In Thailand the answer is anti-fraud enforcement and incentives, not obligation.', '["Expect scrutiny of invoice authenticity rather than of invoice format"]');

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM milestones WHERE country_id = (SELECT id FROM countries WHERE code = 'TH') = 5
-- ASSERT: SELECT count(*) FROM milestones WHERE on_tracker = 1 AND country_id = (SELECT id FROM countries WHERE code = 'TH') = 1
-- ASSERT: SELECT id FROM milestones WHERE on_tracker = 1 AND country_id = (SELECT id FROM countries WHERE code = 'TH') = 'th-deduction-lapsed'
-- ASSERT: SELECT count(*) FROM milestone_translations WHERE lang = 'en' AND milestone_id IN ('th-ministerial-reg-384','th-etax-by-timestamp','th-deduction-decree-766','th-deduction-lapsed','th-fake-invoice-operation') = 5
-- Nothing here is an e-invoicing-scope fact. A stray b2b or b2g_only
-- scope would recolour the country on the map with no error anywhere.
-- ASSERT: SELECT count(*) FROM milestones WHERE country_id = (SELECT id FROM countries WHERE code = 'TH') AND mandate_scope != 'none' = 0
