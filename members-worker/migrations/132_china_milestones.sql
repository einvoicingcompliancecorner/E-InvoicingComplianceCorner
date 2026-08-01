-- China milestone backfill (Stage 4). English only for now.
-- 7 milestones total: 5 deep-dive-only entries, PLUS cn-nationwide and
-- cn-paper-phaseout reused directly from the tracker's own DATA array.
-- cn-nationwide matches deep-dive card #4 (1 Dec 2024) exactly by date;
-- cn-paper-phaseout matches the deep-dive's 'Ongoing' regional
-- paper-phaseout card by topic, with the tracker's more specific date
-- (2026-07-01, citing Dalian) used in preference to the static page's
-- vague 'Ongoing' marker, per the Slovakia precedent (tracker can have
-- more current/specific info than the deep-dive). cn-nationwide
-- inherits anchor=1 from the tracker's anchor:true; cn-paper-phaseout
-- keeps anchor=0 to match (no anchor:true set).

INSERT INTO milestones (id, country_id, date, anchor, source_url) SELECT 'cn-general-vat-2015', id, '2015-01-01', 1, 'https://www.chinatax.gov.cn/eng/home.html' FROM countries WHERE name_en = 'China';
INSERT INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('cn-general-vat-2015', 'en', 'General VAT e-fapiao rolled out nationwide', 'Mostly used for B2C, non-deductible transactions — the first nationwide digital invoice format, built on the existing Golden Tax System.', '[]');
INSERT INTO milestones (id, country_id, date, anchor, source_url) SELECT 'cn-special-vat-pilot-2020', id, '2020-01-01', 1, 'https://www.chinatax.gov.cn/eng/home.html' FROM countries WHERE name_en = 'China';
INSERT INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('cn-special-vat-pilot-2020', 'en', 'Special VAT e-fapiao pilots begin', 'These B2B, VAT-deductible invoices start piloting in selected regions — new taxpayers are often required to use them, while existing companies can join voluntarily.', '[]');
INSERT INTO milestones (id, country_id, date, anchor, source_url) SELECT 'cn-pilots-allprovinces-2023', id, '2023-12-01', 1, 'https://www.chinatax.gov.cn/eng/home.html' FROM countries WHERE name_en = 'China';
INSERT INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('cn-pilots-allprovinces-2023', 'en', 'Pilots expand to cover all provinces', 'The Tibet Autonomous Region''s local STA branch launches its pilot, completing nationwide provincial coverage ahead of the full national rollout.', '[]');
INSERT INTO milestones (id, country_id, date, anchor, source_url) SELECT 'cn-railway-2024', id, '2024-11-01', 1, 'https://www.chinatax.gov.cn/eng/home.html' FROM countries WHERE name_en = 'China';
INSERT INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('cn-railway-2024', 'en', 'Railway passenger transport e-fapiao rules take effect', 'Announced jointly with the Ministry of Finance and China State Railway Group, covering rules for invoice numbers/codes and passenger verification procedures.', '[]');
INSERT INTO milestones (id, country_id, date, anchor, source_url) SELECT 'cn-aviation-2024', id, '2024-11-06', 1, 'https://www.chinatax.gov.cn/eng/home.html' FROM countries WHERE name_en = 'China';
INSERT INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('cn-aviation-2024', 'en', 'Civil aviation passenger transport e-fapiao promoted', 'Sector-specific rollout continues, expanding the fully digitalized format to another major transaction category.', '[]');
INSERT INTO milestones (id, country_id, date, anchor, source_url) SELECT 'cn-nationwide', id, '2024-12-01', 1, 'https://www.chinatax.gov.cn/eng/home.html' FROM countries WHERE name_en = 'China';
INSERT INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('cn-nationwide', 'en', 'Fully digitalized e-invoice (e-fapiao) rolled out nationwide (in force since Dec 2024)', 'The State Taxation Administration (STA) completed the nationwide rollout of fully digitalized electronic invoices (e-fapiao), giving them the same legal validity as paper invoices and superseding the earlier Golden Tax System pilot phases.', '["Set up a digital tax account with the STA to issue and receive e-fapiao", "Confirm ERP/invoicing systems can produce e-fapiao with the mandatory simplified-Chinese fields and OFD/XML rendering", "Retain the STA invoice code, digital signature, dynamic QR code, and clearance timestamp for each invoice"]');
INSERT INTO milestones (id, country_id, date, anchor, source_url) SELECT 'cn-paper-phaseout', id, '2026-07-01', 0, 'https://www.chinatax.gov.cn/eng/home.html' FROM countries WHERE name_en = 'China';
INSERT INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('cn-paper-phaseout', 'en', 'Regional discontinuation of paper invoices accelerates', 'Local tax authorities across multiple regions (e.g. Dalian, effective 1 July 2026) have begun discontinuing specific tax-supervised paper invoice types in favor of e-fapiao, with more regions expected to follow through 2026.', '["Check your local STA branch''s announcements for paper-invoice discontinuation dates specific to your region and sector", "Invoices issued before a region''s cutoff date remain valid, but new paper issuance may be blocked from that date"]');
