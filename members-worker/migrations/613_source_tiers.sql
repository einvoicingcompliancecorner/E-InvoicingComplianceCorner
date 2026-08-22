-- ================================================================
-- Every cited host gets a tier, and nothing may be cited from a host
-- that has not been given one.
-- ================================================================
--
-- /methodology, published 22 August 2026, says what this site requires
-- of a source. It then admits, in its own words, that it cannot yet show
-- you which grade any individual claim was verified at -- because there
-- was no such column. This migration is that admission being paid off.
--
-- ---- WHY A HOST TABLE AND NOT A source_tier COLUMN ------------------
--
-- The obvious shape was a source_tier column beside every source_url:
-- one on milestones, one on stories, five on country_headline_facts,
-- one on tracking_sources, one on deep_dive_portals. That is 1,176
-- values to write and 1,176 values to keep true.
--
-- They would not stay true. A tier is not a property of a citation, it
-- is a property of WHO IS ANSWERING -- and 1,176 citations come from
-- 340 hosts. Storing it per citation means the same host can be graded
-- primary in one row and secondary in another with nothing to catch it,
-- and means that deciding revenue.ie is the Irish Revenue Commissioners
-- has to be re-decided twelve times. Storing it per host means one row,
-- one decision, and a correction that reaches every page at once.
--
-- The cost is that a citation cannot be graded below its host: a blog
-- post ON a government domain grades primary. That is a real limitation
-- and it is written down here rather than designed around, because the
-- fix -- a per-citation override -- is cheap to add on top of this table
-- the day a citation actually needs one. None does today.
--
-- ---- WHAT THE FOUR TIERS MEAN ---------------------------------------
--
-- primary        The jurisdiction's own voice. Its tax authority, its
--                ministry, its official gazette or state legal register,
--                its own e-invoicing platform. EUR-Lex is here for EU
--                instruments, because for EU law it IS the gazette.
--
-- institutional  Official, but not the jurisdiction's own authority.
--                The European Commission, OpenPeppol and the national
--                Peppol authorities, intergovernmental bodies, standards
--                organisations. Authoritative about a specification;
--                not the source of a national obligation.
--
-- secondary      Everyone reporting on the law rather than making it:
--                the professional trackers, the Big Four and the law
--                firms, software vendors, chambers and professional
--                bodies, the press, and the private legal databases
--                that reproduce statute. Useful, frequently first, and
--                never sufficient on its own.
--
-- unknown        We could not establish who operates the host. Four
--                hosts, seven citations. Recorded as unknown with the
--                reason, exactly as an unsourceable headline fact is,
--                rather than being quietly rounded to secondary.
--
-- ---- HOW THE 340 WERE DECIDED ---------------------------------------
--
-- Government and gazette hosts were matched on pattern -- .gov, .gov.xx,
-- .gob.xx, .gouv.xx, .go.xx, .gv.at, .govt.nz and so on -- on the HOST,
-- because a path can say anything and a host is who is answering. That
-- accounts for most of the primary tier and needs no judgement.
--
-- The rest was hand work, and the interesting half of it was the
-- national agencies that hold no .gov label at all: revenue.ie,
-- sii.cl, financnasprava.sk, erhvervsstyrelsen.dk, canada.ca,
-- valtiokonttori.fi, aade.gr, vmi.lt, digg.se, logius.nl,
-- skatteetaten.no, belastingdienst.nl, skatturinn.is and twenty more.
-- A pattern-only classifier graded every one of them the same as a
-- vendor blog. That is the single largest correction in this file.
--
-- Two calls worth stating out loud, because both could reasonably go
-- the other way:
--
--   Professional bodies and chambers are SECONDARY, not institutional,
--   even where they are statutory public-law corporations (wko.at,
--   occ.pt, icas.com). They comment on the law; they do not make it,
--   and institutional is reserved for bodies that are authoritative
--   about the instrument itself.
--
--   Private legal databases are SECONDARY even when the text they show
--   is verbatim statute (lawphil.net, dejure.org, brocardi.it,
--   thuvienphapluat.vn). The text may be right; the publisher is not
--   the one who can be held to it.
--
-- Two hosts were rescued from unknown by reading the URL rather than
-- the host. fjs.atlassian.net is Fjarsysla rikisins -- the Icelandic
-- Financial Management Authority -- keeping its e-invoicing guidance on
-- a hosted wiki, so it is primary despite the Atlassian domain.
-- 5percado.hu is a Hungarian tax publication with bylined articles, so
-- it is secondary. Four hosts survived the exercise unidentified and
-- are stored as such.
--
-- ---- THE INVARIANT THIS FILE INSTALLS -------------------------------
--
-- cited_sources is a view over every URL this site cites, from all nine
-- places it holds one, with the host extracted. The standing assertion
-- below says every host in that view has a row in source_hosts.
--
-- SO: adding a milestone, a story, a tracking source, a portal or a
-- headline fact whose source comes from a host nobody has graded will
-- FAIL THE REPLAY. That is deliberate and it is the whole point of the
-- table. If you hit it, add the host to source_hosts with a tier -- and
-- if you genuinely cannot tell who runs it, 'unknown' with a note in
-- the note column is a correct answer and always was.
--
-- ---- WHY THE INSERTS ARE IN BLOCKS OF 25 -----------------------------
--
-- D1 rejected the first version of this file with "too many terms in
-- compound SELECT". A multi-row INSERT ... VALUES is a compound SELECT
-- to SQLite, one term per row, and D1's limit is lower than the 500 the
-- local replay runs under -- so a file that replays clean offline can
-- still fail on the real database. 25 is comfortably under any plausible
-- limit and keeps each block readable. Nothing about the data changed.
-- ================================================================

CREATE TABLE IF NOT EXISTS source_hosts (
  host          TEXT PRIMARY KEY,
  tier          TEXT NOT NULL CHECK (tier IN ('primary','institutional','secondary','unknown')),
  note          TEXT,
  classified_on TEXT NOT NULL
);

-- Every URL the site cites, with its host, in one place.
--
-- The host expression is deliberately literal rather than clever: strip
-- the scheme, take everything up to the first slash, lowercase it, drop
-- a leading www. and any :port. Every one of the 1,176 URLs in the
-- database today is a well-formed absolute http(s) URL, checked before
-- this was written; a malformed one would surface as an ungraded host
-- and fail the assertion below, which is the right way for it to be
-- noticed.
DROP VIEW IF EXISTS cited_sources;
CREATE VIEW cited_sources AS
WITH raw AS (
            SELECT 'milestone'          AS kind, id         AS row_id, source_url       AS url FROM milestones            WHERE ifnull(source_url,'')       <> ''
  UNION ALL SELECT 'story',                      id,                   source_url             FROM stories               WHERE ifnull(source_url,'')       <> ''
  UNION ALL SELECT 'tracking_source',            id,                   url                    FROM tracking_sources      WHERE ifnull(url,'')              <> ''
  UNION ALL SELECT 'deep_dive_portal',           id,                   url                    FROM deep_dive_portals     WHERE ifnull(url,'')              <> ''
  UNION ALL SELECT 'headline_fact.b2g',          country_id,           b2g_source             FROM country_headline_facts WHERE ifnull(b2g_source,'')       <> ''
  UNION ALL SELECT 'headline_fact.b2b',          country_id,           b2b_source             FROM country_headline_facts WHERE ifnull(b2b_source,'')       <> ''
  UNION ALL SELECT 'headline_fact.b2c',          country_id,           b2c_source             FROM country_headline_facts WHERE ifnull(b2c_source,'')       <> ''
  UNION ALL SELECT 'headline_fact.archiving',    country_id,           archiving_source       FROM country_headline_facts WHERE ifnull(archiving_source,'') <> ''
  UNION ALL SELECT 'headline_fact.signature',    country_id,           signature_source       FROM country_headline_facts WHERE ifnull(signature_source,'') <> ''
), no_scheme AS (
  SELECT kind, row_id, url,
         lower(CASE WHEN instr(url,'://') > 0 THEN substr(url, instr(url,'://')+3) ELSE url END) AS rest
    FROM raw
), no_path AS (
  SELECT kind, row_id, url,
         CASE WHEN instr(rest,'/') > 0 THEN substr(rest, 1, instr(rest,'/')-1) ELSE rest END AS hp
    FROM no_scheme
), no_www AS (
  SELECT kind, row_id, url,
         CASE WHEN substr(hp,1,4) = 'www.' THEN substr(hp,5) ELSE hp END AS hw
    FROM no_path
)
SELECT kind, row_id, url,
       CASE WHEN instr(hw,':') > 0 THEN substr(hw, 1, instr(hw,':')-1) ELSE hw END AS host
  FROM no_www;

-- ---- primary (185 hosts, 577 citations) ---------------------------------
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('aade.gr', 'primary', 'Independent Authority for Public Revenue, Greece', '2026-08-22'),
  ('adilet.zan.kz', 'primary', 'official legal information system, Kazakhstan', '2026-08-22'),
  ('afip.gob.ar', 'primary', NULL, '2026-08-22'),
  ('agenziaentrate.gov.it', 'primary', NULL, '2026-08-22'),
  ('agid.gov.it', 'primary', NULL, '2026-08-22'),
  ('almeezan.qa', 'primary', 'Al Meezan, Qatar legal portal, Ministry of Justice', '2026-08-22'),
  ('ao.bundesfinanzministerium.de', 'primary', 'Federal Ministry of Finance, Germany', '2026-08-22'),
  ('arca.gob.ar', 'primary', NULL, '2026-08-22'),
  ('argentina.gob.ar', 'primary', NULL, '2026-08-22'),
  ('ato.gov.au', 'primary', NULL, '2026-08-22'),
  ('belastingdienst.nl', 'primary', 'Tax Administration, Netherlands', '2026-08-22'),
  ('bir-cdn.bir.gov.ph', 'primary', NULL, '2026-08-22'),
  ('bir.gov.ph', 'primary', NULL, '2026-08-22'),
  ('boe.es', 'primary', 'Boletin Oficial del Estado, Spain', '2026-08-22'),
  ('bofip.impots.gouv.fr', 'primary', NULL, '2026-08-22'),
  ('boletinoficial.gob.ar', 'primary', NULL, '2026-08-22'),
  ('boletinoficial.gov.ar', 'primary', NULL, '2026-08-22'),
  ('bundesfinanzministerium.de', 'primary', 'Federal Ministry of Finance, Germany', '2026-08-22'),
  ('busquedas.elperuano.pe', 'primary', 'El Peruano, official gazette, Peru', '2026-08-22'),
  ('canada.ca', 'primary', 'Government of Canada', '2026-08-22'),
  ('cgibs.gov.br', 'primary', NULL, '2026-08-22'),
  ('chinatax.gov.cn', 'primary', NULL, '2026-08-22'),
  ('chorus-pro.gouv.fr', 'primary', NULL, '2026-08-22'),
  ('collectivites-locales.gouv.fr', 'primary', NULL, '2026-08-22'),
  ('coretaxdjp.pajak.go.id', 'primary', NULL, '2026-08-22');
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('cpe.sunat.gob.pe', 'primary', NULL, '2026-08-22'),
  ('cwfwpt.ggj.gov.cn', 'primary', NULL, '2026-08-22'),
  ('dgii.gov.do', 'primary', NULL, '2026-08-22'),
  ('dhareeba.gov.qa', 'primary', NULL, '2026-08-22'),
  ('dian.gov.co', 'primary', NULL, '2026-08-22'),
  ('diariodarepublica.pt', 'primary', 'Diario da Republica, Portugal', '2026-08-22'),
  ('digg.se', 'primary', 'Agency for Digital Government, Sweden', '2026-08-22'),
  ('digital.go.jp', 'primary', NULL, '2026-08-22'),
  ('dof.gov.ph', 'primary', NULL, '2026-08-22'),
  ('download1.fbr.gov.pk', 'primary', NULL, '2026-08-22'),
  ('e-rechnung-bund.de', 'primary', 'Federal e-invoicing portal, Germany', '2026-08-22'),
  ('e-taxes.gov.az', 'primary', NULL, '2026-08-22'),
  ('ebelge.gib.gov.tr', 'primary', NULL, '2026-08-22'),
  ('eboletin.sunat.gob.pe', 'primary', NULL, '2026-08-22'),
  ('economie.gouv.fr', 'primary', NULL, '2026-08-22'),
  ('eds.vid.gov.lv', 'primary', NULL, '2026-08-22'),
  ('efactura.dgi.gub.uy', 'primary', 'Government of Uruguay', '2026-08-22'),
  ('efaktura.gov.pl', 'primary', NULL, '2026-08-22'),
  ('efaktura.gov.rs', 'primary', NULL, '2026-08-22'),
  ('einvoice.firs.gov.ng', 'primary', NULL, '2026-08-22'),
  ('einvoice.nat.gov.tw', 'primary', NULL, '2026-08-22'),
  ('einvoice1.gst.gov.in', 'primary', NULL, '2026-08-22'),
  ('einvoice6.gst.gov.in', 'primary', NULL, '2026-08-22'),
  ('einvoicing.govt.nz', 'primary', NULL, '2026-08-22'),
  ('eis.bir.gov.ph', 'primary', NULL, '2026-08-22');
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('english.www.gov.cn', 'primary', NULL, '2026-08-22'),
  ('eotpremnica.efaktura.gov.rs', 'primary', NULL, '2026-08-22'),
  ('eracuni.ujp.gov.si', 'primary', NULL, '2026-08-22'),
  ('erechnung.gv.at', 'primary', NULL, '2026-08-22'),
  ('erhvervsstyrelsen.dk', 'primary', 'Danish Business Authority', '2026-08-22'),
  ('eta.gov.eg', 'primary', NULL, '2026-08-22'),
  ('etax.nat.gov.tw', 'primary', NULL, '2026-08-22'),
  ('etims.kra.go.ke', 'primary', NULL, '2026-08-22'),
  ('eur-lex.europa.eu', 'primary', 'Official Journal of the EU -- the legal text itself', '2026-08-22'),
  ('facturae.gob.es', 'primary', NULL, '2026-08-22'),
  ('fatturapa.gov.it', 'primary', NULL, '2026-08-22'),
  ('fazenda.sp.gov.br', 'primary', NULL, '2026-08-22'),
  ('fbr.gov.pk', 'primary', NULL, '2026-08-22'),
  ('fg.dgii.gov.do', 'primary', NULL, '2026-08-22'),
  ('fin.ee', 'primary', 'Ministry of Finance, Estonia', '2026-08-22'),
  ('finance.gov.mt', 'primary', NULL, '2026-08-22'),
  ('financnasprava.sk', 'primary', 'Financial Administration, Slovakia', '2026-08-22'),
  ('fiscal.treasury.gov', 'primary', NULL, '2026-08-22'),
  ('fjs.atlassian.net', 'primary', 'Fjarsysla rikisins, the Icelandic Financial Management Authority -- its own wiki, hosted on Atlassian Cloud', '2026-08-22'),
  ('fu.gov.si', 'primary', NULL, '2026-08-22'),
  ('gdt.gov.vn', 'primary', NULL, '2026-08-22'),
  ('gib.gov.tr', 'primary', NULL, '2026-08-22'),
  ('gob.ec', 'primary', NULL, '2026-08-22'),
  ('gob.pe', 'primary', NULL, '2026-08-22'),
  ('gov.br', 'primary', NULL, '2026-08-22');
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('gov.cn', 'primary', NULL, '2026-08-22'),
  ('gov.cy', 'primary', NULL, '2026-08-22'),
  ('gov.ie', 'primary', NULL, '2026-08-22'),
  ('gov.il', 'primary', NULL, '2026-08-22'),
  ('gov.pl', 'primary', NULL, '2026-08-22'),
  ('gov.uk', 'primary', NULL, '2026-08-22'),
  ('gov.uz', 'primary', NULL, '2026-08-22'),
  ('gstcouncil.gov.in', 'primary', NULL, '2026-08-22'),
  ('gta.gov.qa', 'primary', NULL, '2026-08-22'),
  ('gub.uy', 'primary', 'Government of Uruguay', '2026-08-22'),
  ('guichet.public.lu', 'primary', 'Official state portal, Luxembourg', '2026-08-22'),
  ('hacienda.go.cr', 'primary', NULL, '2026-08-22'),
  ('hasil.gov.my', 'primary', NULL, '2026-08-22'),
  ('hoadondientu.gdt.gov.vn', 'primary', NULL, '2026-08-22'),
  ('hometax.go.kr', 'primary', NULL, '2026-08-22'),
  ('imda.gov.sg', 'primary', NULL, '2026-08-22'),
  ('impo.com.uy', 'primary', 'IMPO, official publisher, Uruguay', '2026-08-22'),
  ('impots.gouv.fr', 'primary', NULL, '2026-08-22'),
  ('info.portaldasfinancas.gov.pt', 'primary', NULL, '2026-08-22'),
  ('invoicing.eta.gov.eg', 'primary', NULL, '2026-08-22'),
  ('ipp.gov', 'primary', NULL, '2026-08-22'),
  ('iras.gov.sg', 'primary', NULL, '2026-08-22'),
  ('ird.govt.nz', 'primary', NULL, '2026-08-22'),
  ('irs.gov', 'primary', NULL, '2026-08-22'),
  ('island.is', 'primary', 'Government of Iceland portal', '2026-08-22');
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('istd.gov.jo', 'primary', NULL, '2026-08-22'),
  ('itax.kra.go.ke', 'primary', NULL, '2026-08-22'),
  ('kenyalaw.org', 'primary', 'National Council for Law Reporting, a state corporation', '2026-08-22'),
  ('kgd.gov.kz', 'primary', NULL, '2026-08-22'),
  ('kra.go.ke', 'primary', NULL, '2026-08-22'),
  ('ksef.mf.gov.pl', 'primary', NULL, '2026-08-22'),
  ('ksef.podatki.gov.pl', 'primary', NULL, '2026-08-22'),
  ('latvija.gov.lv', 'primary', NULL, '2026-08-22'),
  ('law-out.mof.gov.tw', 'primary', NULL, '2026-08-22'),
  ('legifrance.gouv.fr', 'primary', NULL, '2026-08-22'),
  ('legislacao.fazenda.sp.gov.br', 'primary', NULL, '2026-08-22'),
  ('legislation.gov.uk', 'primary', 'official UK statute', '2026-08-22'),
  ('lex.uz', 'primary', 'national legislation database, Uzbekistan', '2026-08-22'),
  ('logius.nl', 'primary', 'Logius, Dutch Ministry of the Interior', '2026-08-22'),
  ('lovdata.no', 'primary', 'publisher of Norsk Lovtidend', '2026-08-22'),
  ('mbie.govt.nz', 'primary', NULL, '2026-08-22'),
  ('mbs.gov.ng', 'primary', NULL, '2026-08-22'),
  ('mef.gov.it', 'primary', NULL, '2026-08-22'),
  ('mf.gov.cz', 'primary', NULL, '2026-08-22'),
  ('mfin.gov.rs', 'primary', NULL, '2026-08-22'),
  ('mfinante.gov.ro', 'primary', NULL, '2026-08-22'),
  ('micrositios.dian.gov.co', 'primary', NULL, '2026-08-22'),
  ('mof.gov.ae', 'primary', NULL, '2026-08-22'),
  ('mof.gov.cy', 'primary', NULL, '2026-08-22'),
  ('mof.gov.sg', 'primary', NULL, '2026-08-22');
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('mof.gov.tw', 'primary', NULL, '2026-08-22'),
  ('mtca.gov.mt', 'primary', NULL, '2026-08-22'),
  ('narodne-novine.nn.hr', 'primary', 'Narodne novine, Croatia', '2026-08-22'),
  ('nav.gov.hu', 'primary', NULL, '2026-08-22'),
  ('nbr.gov.bh', 'primary', NULL, '2026-08-22'),
  ('nemhandel.dk', 'primary', 'Nemhandel, run by the Danish Business Authority', '2026-08-22'),
  ('nen.nipez.cz', 'primary', 'National electronic procurement tool, Czechia', '2026-08-22'),
  ('nfe.fazenda.gov.br', 'primary', NULL, '2026-08-22'),
  ('normograma.dian.gov.co', 'primary', NULL, '2026-08-22'),
  ('nrs.gov.ng', 'primary', NULL, '2026-08-22'),
  ('nta.go.jp', 'primary', NULL, '2026-08-22'),
  ('nts.go.kr', 'primary', NULL, '2026-08-22'),
  ('obamawhitehouse.archives.gov', 'primary', NULL, '2026-08-22'),
  ('onlineszamla.nav.gov.hu', 'primary', NULL, '2026-08-22'),
  ('pajak.go.id', 'primary', NULL, '2026-08-22'),
  ('planalto.gov.br', 'primary', NULL, '2026-08-22'),
  ('podatki.gov.pl', 'primary', NULL, '2026-08-22'),
  ('porezna-uprava.gov.hr', 'primary', NULL, '2026-08-22'),
  ('portal.jofotara.gov.jo', 'primary', NULL, '2026-08-22'),
  ('portal.nra.bg', 'primary', 'National Revenue Agency, Bulgaria', '2026-08-22'),
  ('portaldasfinancas.gov.pt', 'primary', NULL, '2026-08-22'),
  ('portalsped.fazenda.mg.gov.br', 'primary', NULL, '2026-08-22'),
  ('pravno-informacioni-sistem.rs', 'primary', 'official legal information system, Serbia', '2026-08-22'),
  ('procurement.govt.nz', 'primary', NULL, '2026-08-22'),
  ('qanoon.om', 'primary', 'Oman legal portal, Ministry of Legal Affairs', '2026-08-22');
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('regjeringen.no', 'primary', 'Government of Norway', '2026-08-22'),
  ('retsinformation.dk', 'primary', 'official legal information, Denmark', '2026-08-22'),
  ('revenue.ie', 'primary', 'Revenue Commissioners, Ireland', '2026-08-22'),
  ('rijksoverheid.nl', 'primary', 'Central government, Netherlands', '2026-08-22'),
  ('riksdagen.se', 'primary', 'Swedish parliament, statute text', '2026-08-22'),
  ('sat.gob.mx', 'primary', NULL, '2026-08-22'),
  ('sdk.myinvois.hasil.gov.my', 'primary', NULL, '2026-08-22'),
  ('sede.agenciatributaria.gob.es', 'primary', NULL, '2026-08-22'),
  ('servicios.infoleg.gob.ar', 'primary', NULL, '2026-08-22'),
  ('sii.cl', 'primary', 'Servicio de Impuestos Internos, Chile', '2026-08-22'),
  ('skatteetaten.no', 'primary', 'Norwegian Tax Administration', '2026-08-22'),
  ('skatturinn.is', 'primary', 'Iceland Revenue and Customs', '2026-08-22'),
  ('sri.gob.ec', 'primary', NULL, '2026-08-22'),
  ('static.anaf.ro', 'primary', 'National Agency for Fiscal Administration, Romania', '2026-08-22'),
  ('stjornartidindi.is', 'primary', 'official gazette, Iceland', '2026-08-22'),
  ('stopbirokraciji.gov.si', 'primary', NULL, '2026-08-22'),
  ('stortinget.no', 'primary', 'Parliament of Norway', '2026-08-22'),
  ('sunat.gob.pe', 'primary', NULL, '2026-08-22'),
  ('tax.gov.ae', 'primary', NULL, '2026-08-22'),
  ('taxes.gov.az', 'primary', NULL, '2026-08-22'),
  ('taxinformation.cbic.gov.in', 'primary', NULL, '2026-08-22'),
  ('tms.taxoman.gov.om', 'primary', NULL, '2026-08-22'),
  ('tpctax.gov.taipei', 'primary', NULL, '2026-08-22'),
  ('upphandlingsmyndigheten.se', 'primary', 'National Agency for Public Procurement, Sweden', '2026-08-22'),
  ('uradni-list.si', 'primary', 'Uradni list, Slovenia', '2026-08-22');
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('uscode.house.gov', 'primary', NULL, '2026-08-22'),
  ('usp.gv.at', 'primary', NULL, '2026-08-22'),
  ('ustr.gov', 'primary', NULL, '2026-08-22'),
  ('valtiokonttori.fi', 'primary', 'State Treasury, Finland', '2026-08-22'),
  ('vko.kgd.gov.kz', 'primary', NULL, '2026-08-22'),
  ('vmi.lt', 'primary', 'State Tax Inspectorate, Lithuania', '2026-08-22'),
  ('www2.aop.bg', 'primary', 'Public Procurement Agency, Bulgaria', '2026-08-22'),
  ('www2.gov.pt', 'primary', NULL, '2026-08-22'),
  ('zatca.gov.sa', 'primary', NULL, '2026-08-22'),
  ('zhejiang.chinatax.gov.cn', 'primary', NULL, '2026-08-22');

-- ---- institutional (11 hosts, 133 citations) ----------------------------
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('ciat.org', 'institutional', 'Inter-American Center of Tax Administrations', '2026-08-22'),
  ('dbnalliance.org', 'institutional', 'Digital Business Networks Alliance, US Peppol-equivalent body', '2026-08-22'),
  ('docs.peppol.eu', 'institutional', 'OpenPeppol', '2026-08-22'),
  ('ec.europa.eu', 'institutional', 'European Commission', '2026-08-22'),
  ('fnfe-mpe.org', 'institutional', 'Forum National de la Facture Electronique, France', '2026-08-22'),
  ('peppol.nu', 'institutional', 'Swedish Peppol authority', '2026-08-22'),
  ('peppol.org', 'institutional', 'OpenPeppol', '2026-08-22'),
  ('peppolautoriteit.nl', 'institutional', 'Dutch Peppol authority', '2026-08-22'),
  ('taxation-customs.ec.europa.eu', 'institutional', 'European Commission', '2026-08-22'),
  ('tieke.fi', 'institutional', 'TIEKE, non-profit registry operator -- not the tax authority', '2026-08-22'),
  ('vat-one-stop-shop.ec.europa.eu', 'institutional', 'European Commission', '2026-08-22');

-- ---- secondary (140 hosts, 459 citations) -------------------------------
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('5percado.hu', 'secondary', NULL, '2026-08-22'),
  ('aaptaxlaw.com', 'secondary', NULL, '2026-08-22'),
  ('abk-korea.com', 'secondary', NULL, '2026-08-22'),
  ('acento.com.do', 'secondary', NULL, '2026-08-22'),
  ('actualicese.com', 'secondary', NULL, '2026-08-22'),
  ('alitium.com', 'secondary', NULL, '2026-08-22'),
  ('ancgroup.biz', 'secondary', NULL, '2026-08-22'),
  ('arslege.pl', 'secondary', NULL, '2026-08-22'),
  ('artikel.pajakku.com', 'secondary', NULL, '2026-08-22'),
  ('aseanbriefing.com', 'secondary', NULL, '2026-08-22'),
  ('avalara.com', 'secondary', NULL, '2026-08-22'),
  ('azertag.az', 'secondary', NULL, '2026-08-22'),
  ('babelway.com', 'secondary', NULL, '2026-08-22'),
  ('bankgirot.se', 'secondary', NULL, '2026-08-22'),
  ('banqup.com', 'secondary', NULL, '2026-08-22'),
  ('bbva.com', 'secondary', NULL, '2026-08-22'),
  ('bdo.global', 'secondary', NULL, '2026-08-22'),
  ('brecorder.com', 'secondary', NULL, '2026-08-22'),
  ('brocardi.it', 'secondary', NULL, '2026-08-22'),
  ('buxgalter.uz', 'secondary', NULL, '2026-08-22'),
  ('capital.ro', 'secondary', NULL, '2026-08-22'),
  ('china-briefing.com', 'secondary', NULL, '2026-08-22'),
  ('cijuf.org.co', 'secondary', NULL, '2026-08-22'),
  ('cleartax.com', 'secondary', NULL, '2026-08-22'),
  ('clearvo.io', 'secondary', NULL, '2026-08-22');
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('comarch.com', 'secondary', NULL, '2026-08-22'),
  ('comparateur-efacturation.fr', 'secondary', NULL, '2026-08-22'),
  ('compta-online.com', 'secondary', NULL, '2026-08-22'),
  ('contabeis.com.br', 'secondary', NULL, '2026-08-22'),
  ('cygnet.one', 'secondary', NULL, '2026-08-22'),
  ('danovky.sk', 'secondary', NULL, '2026-08-22'),
  ('dawn.com', 'secondary', NULL, '2026-08-22'),
  ('dddinvoices.com', 'secondary', NULL, '2026-08-22'),
  ('dejure.org', 'secondary', NULL, '2026-08-22'),
  ('deloitte.com', 'secondary', NULL, '2026-08-22'),
  ('dext.com', 'secondary', NULL, '2026-08-22'),
  ('digitdoc.hu', 'secondary', NULL, '2026-08-22'),
  ('documentacao.senior.com.br', 'secondary', NULL, '2026-08-22'),
  ('e-invoice.app', 'secondary', NULL, '2026-08-22'),
  ('ecosio.com', 'secondary', NULL, '2026-08-22'),
  ('edicomgroup.com', 'secondary', NULL, '2026-08-22'),
  ('eng.lsm.lv', 'secondary', NULL, '2026-08-22'),
  ('english.luatvietnam.vn', 'secondary', NULL, '2026-08-22'),
  ('eu-einvoicing.com', 'secondary', NULL, '2026-08-22'),
  ('europe.thomsonreuters.com', 'secondary', NULL, '2026-08-22'),
  ('expats.cz', 'secondary', NULL, '2026-08-22'),
  ('ey.com', 'secondary', NULL, '2026-08-22'),
  ('facturele.com', 'secondary', NULL, '2026-08-22'),
  ('fakturko.io', 'secondary', NULL, '2026-08-22'),
  ('fiscal-requirements.com', 'secondary', NULL, '2026-08-22');
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('fiskaly.com', 'secondary', NULL, '2026-08-22'),
  ('fonoa.com', 'secondary', NULL, '2026-08-22'),
  ('forvismazars.com', 'secondary', NULL, '2026-08-22'),
  ('gestion.pe', 'secondary', NULL, '2026-08-22'),
  ('globalindirecttaxmanagement.com', 'secondary', NULL, '2026-08-22'),
  ('grantthornton.com.ph', 'secondary', NULL, '2026-08-22'),
  ('grantthornton.global', 'secondary', NULL, '2026-08-22'),
  ('gulfnews.com', 'secondary', NULL, '2026-08-22'),
  ('hanumaglobal.com', 'secondary', NULL, '2026-08-22'),
  ('hawksford.com', 'secondary', NULL, '2026-08-22'),
  ('hcat.co', 'secondary', NULL, '2026-08-22'),
  ('icas.com', 'secondary', NULL, '2026-08-22'),
  ('ifinanses.lv', 'secondary', NULL, '2026-08-22'),
  ('impositus.com', 'secondary', NULL, '2026-08-22'),
  ('incp.org.co', 'secondary', NULL, '2026-08-22'),
  ('infobae.com', 'secondary', NULL, '2026-08-22'),
  ('informazionefiscale.it', 'secondary', NULL, '2026-08-22'),
  ('inventti.com.br', 'secondary', NULL, '2026-08-22'),
  ('invoice-portal.de', 'secondary', NULL, '2026-08-22'),
  ('involvia.ai', 'secondary', NULL, '2026-08-22'),
  ('jomeinvoice.my', 'secondary', NULL, '2026-08-22'),
  ('jusline.at', 'secondary', NULL, '2026-08-22'),
  ('kpmg.com', 'secondary', NULL, '2026-08-22'),
  ('law.cornell.edu', 'secondary', NULL, '2026-08-22'),
  ('law.esnai.cn', 'secondary', NULL, '2026-08-22');
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('lawphil.net', 'secondary', NULL, '2026-08-22'),
  ('lawspot.gr', 'secondary', NULL, '2026-08-22'),
  ('lexis.com.ec', 'secondary', NULL, '2026-08-22'),
  ('leyes-mx.com', 'secondary', NULL, '2026-08-22'),
  ('leyesmx.com', 'secondary', NULL, '2026-08-22'),
  ('llbsolutions.com', 'secondary', NULL, '2026-08-22'),
  ('marosavat.com', 'secondary', NULL, '2026-08-22'),
  ('mley.mx', 'secondary', NULL, '2026-08-22'),
  ('muc.co.id', 'secondary', NULL, '2026-08-22'),
  ('news.ddtc.co.id', 'secondary', NULL, '2026-08-22'),
  ('normaslegais.com.br', 'secondary', NULL, '2026-08-22'),
  ('numbero.app', 'secondary', NULL, '2026-08-22'),
  ('oaf.ucr.ac.cr', 'secondary', NULL, '2026-08-22'),
  ('occ.pt', 'secondary', NULL, '2026-08-22'),
  ('orbitax.com', 'secondary', NULL, '2026-08-22'),
  ('pagero.com', 'secondary', NULL, '2026-08-22'),
  ('paragraf.rs', 'secondary', NULL, '2026-08-22'),
  ('pcga.mx', 'secondary', NULL, '2026-08-22'),
  ('premiumtimesng.com', 'secondary', NULL, '2026-08-22'),
  ('primicias.ec', 'secondary', NULL, '2026-08-22'),
  ('prnewswire.com', 'secondary', NULL, '2026-08-22'),
  ('pro1c.kz', 'secondary', NULL, '2026-08-22'),
  ('pwc.bg', 'secondary', NULL, '2026-08-22'),
  ('pwc.com', 'secondary', NULL, '2026-08-22'),
  ('pwc.no', 'secondary', NULL, '2026-08-22');
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('qoyod.com', 'secondary', NULL, '2026-08-22'),
  ('recommand.eu', 'secondary', NULL, '2026-08-22'),
  ('regfollower.com', 'secondary', NULL, '2026-08-22'),
  ('reyestacandong.com', 'secondary', NULL, '2026-08-22'),
  ('roedl.com', 'secondary', NULL, '2026-08-22'),
  ('rtcsuite.com', 'secondary', NULL, '2026-08-22'),
  ('saphety.com', 'secondary', NULL, '2026-08-22'),
  ('sclawyer.com.do', 'secondary', NULL, '2026-08-22'),
  ('siemprealdia.co', 'secondary', NULL, '2026-08-22'),
  ('snl.no', 'secondary', NULL, '2026-08-22'),
  ('sovos.com', 'secondary', NULL, '2026-08-22'),
  ('storecove.com', 'secondary', NULL, '2026-08-22'),
  ('stripe.com', 'secondary', NULL, '2026-08-22'),
  ('support.billbox.bg', 'secondary', NULL, '2026-08-22'),
  ('support.taxually.com', 'secondary', NULL, '2026-08-22'),
  ('t4sadvance.com', 'secondary', NULL, '2026-08-22'),
  ('taxguru.in', 'secondary', NULL, '2026-08-22'),
  ('taxheaven.gr', 'secondary', NULL, '2026-08-22'),
  ('taxmanagementindia.com', 'secondary', NULL, '2026-08-22'),
  ('taxnews.ey.com', 'secondary', NULL, '2026-08-22'),
  ('taxsummaries.pwc.com', 'secondary', NULL, '2026-08-22'),
  ('theinvoicinghub.com', 'secondary', NULL, '2026-08-22'),
  ('thelemabogados.pe', 'secondary', NULL, '2026-08-22'),
  ('thisdaylive.com', 'secondary', NULL, '2026-08-22'),
  ('thuvienphapluat.vn', 'secondary', NULL, '2026-08-22');
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('ticofactura.cr', 'secondary', NULL, '2026-08-22'),
  ('tmconsulting.co.rs', 'secondary', NULL, '2026-08-22'),
  ('universuljuridic.ro', 'secondary', NULL, '2026-08-22'),
  ('uzdaily.uz', 'secondary', NULL, '2026-08-22'),
  ('vatassociation.org', 'secondary', NULL, '2026-08-22'),
  ('vatcalc.com', 'secondary', NULL, '2026-08-22'),
  ('vatit.com', 'secondary', NULL, '2026-08-22'),
  ('vatupdate.com', 'secondary', NULL, '2026-08-22'),
  ('vertexinc.com', 'secondary', NULL, '2026-08-22'),
  ('vietnam-briefing.com', 'secondary', NULL, '2026-08-22'),
  ('vlex.com.pe', 'secondary', NULL, '2026-08-22'),
  ('voxelgroup.net', 'secondary', NULL, '2026-08-22'),
  ('wko.at', 'secondary', NULL, '2026-08-22'),
  ('zakon.hr', 'secondary', NULL, '2026-08-22'),
  ('zakon.uchet.kz', 'secondary', NULL, '2026-08-22');

-- ---- unknown (4 hosts, 7 citations) -------------------------------------
INSERT INTO source_hosts (host, tier, note, classified_on) VALUES
  ('bj148.org', 'unknown', 'could not establish who operates this host', '2026-08-22'),
  ('ibac.uz', 'unknown', 'could not establish who operates this host', '2026-08-22'),
  ('plz.lv', 'unknown', 'could not establish who operates this host', '2026-08-22'),
  ('sabis.evaf.lt', 'unknown', 'could not establish who operates this host', '2026-08-22');
-- ---- what this migration claims ----------------------------------------
--
-- The four counts are point-in-time: they say what the corpus looked like
-- on 22 August 2026 and they are expected to be superseded the next time
-- a citation is added. The three ALWAYS assertions are the standing ones.

-- ASSERT: SELECT count(*) FROM source_hosts = 340
-- ASSERT: SELECT count(*) FROM source_hosts WHERE tier = 'primary' = 185
-- ASSERT: SELECT count(*) FROM source_hosts WHERE tier = 'institutional' = 11
-- ASSERT: SELECT count(*) FROM source_hosts WHERE tier = 'secondary' = 140
-- ASSERT: SELECT count(*) FROM source_hosts WHERE tier = 'unknown' = 4
-- ASSERT: SELECT count(*) FROM cited_sources = 1176
-- ASSERT: SELECT count(*) FROM cited_sources cs JOIN source_hosts sh ON sh.host = cs.host WHERE sh.tier = 'primary' = 577

-- NOTHING MAY BE CITED FROM AN UNGRADED HOST. The one that matters: it
-- turns "we grade our sources" from a sentence on a page into something
-- a build can fail on.
-- ASSERT ALWAYS: SELECT count(*) FROM cited_sources WHERE host NOT IN (SELECT host FROM source_hosts) = 0

-- An unknown tier without a stated reason is the same defect as an
-- unknown headline fact without an unknown_reason, and migration 608
-- already closed that one.
-- ASSERT ALWAYS: SELECT count(*) FROM source_hosts WHERE tier = 'unknown' AND ifnull(note,'') = '' = 0

-- The host column is the join key; a value with a scheme, a slash, an
-- uppercase letter or a leading www. in it would join to nothing and
-- grade a citation silently.
-- ASSERT ALWAYS: SELECT count(*) FROM source_hosts WHERE host <> lower(host) OR host LIKE '%/%' OR host LIKE 'www.%' OR host LIKE '%:%' = 0
