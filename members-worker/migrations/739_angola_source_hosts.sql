-- The hosts Angola cites, graded before anything cites them.
--
-- Order matters here and the replay enforces it: a cited URL whose host
-- is not in this table fails the chain, so this file sits ahead of the
-- headline facts, the tracking sources and the deep dive.
--
-- SUBDOMAINS, NOT THE APEX, and the replay is what taught it. The first
-- draft graded 'minfin.gov.ao' and the chain failed: cited_sources holds
-- the host exactly as the URL spells it, so the apex matches nothing that
-- Angola actually cites. Both government hosts below are the ones that
-- appear in a URL on this site.
--
-- TWO MINISTRY PAGES ARE DELIBERATELY NOT CITED ANYWHERE. The decree PDF
-- at ucm.minfin.gov.ao has no text layer, and the Ministry's own
-- announcement of the 1 January 2026 commencement returned no readable
-- body to automated fetch. Neither could be read from this sandbox, so
-- neither is attached to a claim, and neither host is graded here.
-- Grading a host is not the same as having read a page on it.

INSERT OR IGNORE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('portaldocontribuinte.minfin.gov.ao', 'primary',
   'Portal do Contribuinte, run by Angola''s Ministério das Finanças. Where a taxpayer joins the e-invoicing regime and requests invoice series.',
   '2026-09-04'),
  ('agt.minfin.gov.ao', 'primary',
   'Administração Geral Tributária, Angola''s tax authority, on the Ministry of Finance''s domain. Its own portal, comunicados and certified-software list.',
   '2026-09-04'),
  ('angolex.com', 'secondary',
   'Private Angolan legal database republishing statute. Carries the full text of Decreto Presidencial 71/25 article by article, which the Ministry''s own PDF does not expose as text. Republication, not promulgation.',
   '2026-09-04'),
  ('expansao.co.ao', 'secondary',
   'Angolan business weekly. Used for dated reporting of AGT announcements and commencement dates, not for the content of an instrument.',
   '2026-09-04'),
  ('lidermagazine.ao', 'secondary',
   'Angolan business magazine. Cited for its April 2026 interview with the AGT board president, which carries adoption figures and the refusal to extend the first-phase deadline.',
   '2026-09-04'),
  ('saft-validator.com', 'secondary',
   'Specialist SAF-T tooling vendor. Cited for its reading of the AGT comunicado of 20 March 2026 exempting e-invoicing taxpayers from the invoicing SAF-T file, which the AGT does not appear to publish at a stable URL.',
   '2026-09-04'),
  ('cegid.com', 'secondary',
   'Software vendor with AGT-certified invoicing products in Angola. Operational detail on adhesion, series and transmission that no government page states in one place; a vendor reading of the rules, not the rules.',
   '2026-09-04');

-- ---- what this migration claims it did ----
-- All seven are graded, and none was left at the tier the column would
-- have to guess.
-- ASSERT: SELECT count(*) FROM source_hosts WHERE host IN ('portaldocontribuinte.minfin.gov.ao','agt.minfin.gov.ao','angolex.com','expansao.co.ao','lidermagazine.ao','cegid.com','saft-validator.com') = 7
--
-- The tax authority's own hosts are primary and the five readings of it
-- are not. Asserted separately because the distinction is the point of
-- the table: a vendor page describing a decree is not the decree.
-- ASSERT: SELECT count(*) FROM source_hosts WHERE host IN ('portaldocontribuinte.minfin.gov.ao','agt.minfin.gov.ao') AND tier = 'primary' = 2
-- ASSERT: SELECT count(*) FROM source_hosts WHERE host IN ('angolex.com','expansao.co.ao','lidermagazine.ao','cegid.com','saft-validator.com') AND tier = 'secondary' = 5
--
-- STANDING: an 'unknown' tier must carry the note that says why.
--
-- Restated here rather than assumed because this file adds five rows to a
-- table whose whole value is that every row has been looked at. None of
-- these five is 'unknown'; the invariant guards the ones that follow.
-- ASSERT ALWAYS: SELECT count(*) FROM source_hosts WHERE tier = 'unknown' AND (note IS NULL OR trim(note) = '') = 0
