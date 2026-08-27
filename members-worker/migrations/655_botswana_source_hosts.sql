-- Botswana: grade the hosts its citations introduce.
--
-- This file exists because the replay refused the country without it:
-- 613/628/639 each assert that every host in cited_sources is graded,
-- and Botswana's milestone and headline-fact sources bring in hosts the
-- register has never seen. That is the invariant working as intended.
--
-- Botswana's official record is unusually scattered. BURS's own site
-- carries nothing on electronic billing that could be fetched, so the
-- primary-tier citations here are Parliament (the VAT Bill text), the
-- Budget Speech (hosted in the Bank of Botswana's publication library),
-- the government news agency, and the communications regulator. The
-- commencement date itself rests on an institutional reading of a
-- statutory formula -- see 656's header.

INSERT OR IGNORE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('burs.org.bw',           'primary',   'Botswana Unified Revenue Service', '2026-08-26'),
  ('eservices.burs.org.bw', 'primary',   'BURS e-Tax portal', '2026-08-26'),
  ('dailynews.gov.bw',      'primary',   'Botswana Daily News, the government news agency', '2026-08-26'),
  ('bankofbotswana.bw',     'primary',   'Bank of Botswana; hosts the national Budget Speech', '2026-08-26'),
  ('botswanaspeaks.gov.bw', 'primary',   'Parliament of Botswana; bill and act texts', '2026-08-26'),
  ('bocra.org.bw',          'primary',   'Botswana Communications Regulatory Authority', '2026-08-26'),
  ('mondaq.com',            'secondary', 'Republisher of law-firm briefings; the ENSafrica Africa Tax in Brief series', '2026-08-26'),
  ('bw.andersen.com',       'secondary', 'Andersen Botswana tax commentary', '2026-08-26');

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM source_hosts WHERE host LIKE '%.bw' = 6
-- ASSERT: SELECT tier FROM source_hosts WHERE host = 'burs.org.bw' = 'primary'
-- ASSERT: SELECT tier FROM source_hosts WHERE host = 'mondaq.com' = 'secondary'
-- ASSERT: SELECT count(*) FROM source_hosts WHERE tier = 'unknown' AND ifnull(note,'') = '' = 0
