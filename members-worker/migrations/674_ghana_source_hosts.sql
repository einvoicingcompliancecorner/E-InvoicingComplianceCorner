-- Ghana: grade the hosts its citations introduce.
--
-- Ghana's revenue authority publishes properly and often, so most of
-- these are primary. Two notes on the ones that are not obvious.
--
-- ukgcc.com.gh is the UK-Ghana Chamber of Commerce, and it earns
-- 'institutional' rather than 'secondary' because the two documents
-- cited from it are GRA-AUTHORED -- the March 2023 E-VAT presentation
-- and EY Ghana's Act 1151 reference guide. The chamber is the host, not
-- the author. Where the author matters more than the host, say so in the
-- note rather than downgrading the citation silently.
--
-- a-tla.org is a legal-database transcription of Act 1151, and it is
-- here because THE OFFICIAL TEXT CANNOT BE READ. Both the Parliament of
-- Ghana copy and the GRA-hosted copy are scanned images with no
-- extractable text, as is the GRA's own January 2026 VAT Guidelines. So
-- every section-level quotation on this country rests on a third-party
-- transcription that agrees with a second transcription and with EY's
-- and KPMG's summaries -- which is corroboration, not primary text.
-- Graded 'secondary' to keep that honest, and the deep dive says so.

INSERT OR IGNORE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('gra.gov.gh',              'primary',       'Ghana Revenue Authority: practice notes, public notices and the E-VAT guidelines', '2026-08-27'),
  ('repository.parliament.gh','primary',       'Parliament of Ghana; Act texts, published as scanned images rather than machine-readable text', '2026-08-27'),
  ('evatgra.zendesk.com',     'primary',       'The GRA''s own E-VAT support and operational help centre', '2026-08-27'),
  ('taxpayersportal.com',     'primary',       'GRA Taxpayers'' Portal; filing and payment for all tax types', '2026-08-27'),
  ('ukgcc.com.gh',            'institutional', 'UK-Ghana Chamber of Commerce; hosts GRA-authored and EY-authored documents that the authors do not publish themselves', '2026-08-27'),
  ('a-tla.org',               'secondary',     'Legal-database transcription of Ghanaian Acts; used because the official texts are scanned images', '2026-08-27'),
  ('citinewsroom.com',        'secondary',     'Citi Newsroom, Ghanaian national broadcaster', '2026-08-27'),
  ('ghanaiantimes.com.gh',    'secondary',     'Ghanaian Times, national newspaper', '2026-08-27'),
  ('ghanabusinessnews.com',   'secondary',     'Ghana Business News', '2026-08-27'),
  ('crowe.com',               'secondary',     'Crowe Ghana tax commentary', '2026-08-27');

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM source_hosts WHERE host LIKE '%.gh' OR host = 'a-tla.org' OR host = 'taxpayersportal.com' OR host = 'evatgra.zendesk.com' >= 6
-- ASSERT: SELECT tier FROM source_hosts WHERE host = 'gra.gov.gh' = 'primary'
-- ASSERT: SELECT tier FROM source_hosts WHERE host = 'a-tla.org' = 'secondary'
-- ASSERT: SELECT count(*) FROM source_hosts WHERE tier = 'unknown' AND ifnull(note,'') = '' = 0
