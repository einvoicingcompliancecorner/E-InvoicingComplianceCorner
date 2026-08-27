-- Hong Kong: grade the hosts its citations introduce.
--
-- The HKSAR Government publishes exceptionally well and almost every
-- claim on this country rests on a .gov.hk page, so most of this file is
-- routine. Four entries need explaining.
--
-- elegislation.gov.hk is graded primary and IS NOT CITED ANYWHERE. It is
-- the official statute database and it refuses automated fetching, so
-- the Inland Revenue Ordinance and the Electronic Transactions Ordinance
-- could not be read in their enacted text. Every section number on this
-- country therefore rests on the IRD's or the Digital Policy Office's
-- own paraphrase, and the deep dive says so. It is graded here so that
-- the day someone can read it, the grade is already right -- and so that
-- this comment exists where the next person will look. This is the same
-- shape as Switzerland's fedlex.admin.ch and Ghana's scanned statutes:
-- three countries in one week where the primary law was unreadable.
--
-- gov.cn is already graded from the China work. It is load-bearing here
-- for the opposite reason: it carries the mainland instruments that
-- prove the fapiao regime does NOT reach Hong Kong.
--
-- europe.thomsonreuters.com is already graded secondary and stays there.
-- Its Hong Kong page states "B2G: e-Procurement System mandatory", which
-- two primary pages contradict. That is the second time in one week the
-- same publisher has been the source of a claim this site had to refuse
-- on primary evidence; the first was the March 2026 Botswana date.
--
-- opengovasia.com is graded secondary rather than unknown because it is
-- cited on the deep dive as EVIDENCE OF DRIFT, not as authority: it
-- reported a government study that the government's own reply does not
-- confirm. A citation can be honest about being an exhibit.

INSERT OR IGNORE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('ird.gov.hk',           'primary',       'Inland Revenue Department; the authority for profits tax, record keeping and iXBRL e-filing', '2026-08-27'),
  ('info.gov.hk',          'primary',       'HKSAR Government Information Services; the official press release and LegCo reply archive', '2026-08-27'),
  ('gov.hk',               'primary',       'GovHK, the Government''s own portal; publishes the e-Procurement Programme terms and FAQs', '2026-08-27'),
  ('fstb.gov.hk',          'primary',       'Financial Services and the Treasury Bureau; owns the Stores and Procurement Regulations', '2026-08-27'),
  ('customs.gov.hk',       'primary',       'Hong Kong Customs and Excise; Trade Single Window and import/export declarations', '2026-08-27'),
  ('cedb.gov.hk',          'primary',       'Commerce and Economic Development Bureau; policy owner for Trade Single Window', '2026-08-27'),
  ('digitalpolicy.gov.hk', 'primary',       'Digital Policy Office, successor to OGCIO from 25 July 2024; owns the Electronic Transactions Ordinance', '2026-08-27'),
  ('basiclaw.gov.hk',      'primary',       'Constitutional and Mainland Affairs Bureau; the official text of the Basic Law', '2026-08-27'),
  ('tid.gov.hk',           'primary',       'Trade and Industry Department; Hong Kong''s WTO membership and CEPA', '2026-08-27'),
  ('cr.gov.hk',            'primary',       'Companies Registry; the company-name disclosure rules that do reach invoices', '2026-08-27'),
  ('taxreform.gov.hk',     'primary',       'The 2006-07 tax base consultation''s own site; the interim and final reports on GST', '2026-08-27'),
  ('legalhub.gov.hk',      'primary',       'Department of Justice; the official statement that there is no sales tax or VAT', '2026-08-27'),
  ('budget.gov.hk',        'primary',       'The Financial Secretary''s Budget speeches', '2026-08-27'),
  ('elegislation.gov.hk',  'primary',       'Hong Kong e-Legislation, the official statute database — refuses automated access, so it could not be read', '2026-08-27'),
  ('wto.org',              'institutional', 'World Trade Organization; confirms Hong Kong, China as a member in its own right since 1995', '2026-08-27'),
  ('opengovasia.com',      'secondary',     'Regional public-sector trade press; cited on Hong Kong as an exhibit in how a claim drifted, not as authority', '2026-08-27');

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM source_hosts WHERE host LIKE '%.gov.hk' >= 13
-- ASSERT: SELECT tier FROM source_hosts WHERE host = 'ird.gov.hk' = 'primary'
-- ASSERT: SELECT tier FROM source_hosts WHERE host = 'opengovasia.com' = 'secondary'
-- The vendor page this country contradicts must stay secondary, or the
-- deep dive would be citing an error at the same grade as the primary
-- sources that refute it.
-- ASSERT: SELECT tier FROM source_hosts WHERE host = 'europe.thomsonreuters.com' = 'secondary'
-- ASSERT ALWAYS: SELECT count(*) FROM source_hosts WHERE tier = 'unknown' AND ifnull(note,'') = '' = 0
