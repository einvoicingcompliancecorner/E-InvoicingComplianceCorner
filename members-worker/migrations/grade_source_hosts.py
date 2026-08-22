#!/usr/bin/env python3
"""grade_source_hosts.py -- the rules migration 613 was built from, kept
runnable so the next ungraded host is a two-minute job rather than an
afternoon.

WHY THIS FILE EXISTS AT ALL. 613 installed a standing assertion:

    -- ASSERT ALWAYS: SELECT count(*) FROM cited_sources
    --   WHERE host NOT IN (SELECT host FROM source_hosts) = 0

so adding a milestone, a story, a tracking source, a portal or a headline
fact whose source comes from a host nobody has graded FAILS THE REPLAY.
That is the point of it -- "we grade our sources" is a sentence a build
can now fail on -- but a rule with no tool beside it is a rule people
route around. Run this and it tells you which hosts are new, grades the
ones the rules already cover, and prints the INSERT for a new migration.

    python3 migrations/grade_source_hosts.py            # what is ungraded
    python3 migrations/grade_source_hosts.py --audit    # regrade everything

WHAT IT WILL NOT DO IS GUESS. A host the rules do not cover is printed
for a human, not rounded to secondary. If you look and genuinely cannot
establish who runs it, 'unknown' with the reason in the note column is a
correct answer -- the four already in the table are there for that
reason, and /methodology publishes the count.

THE ONE LESSON FROM BUILDING IT. A pattern-only classifier (.gov, .gob,
.gouv, .go.xx) graded revenue.ie, sii.cl, erhvervsstyrelsen.dk,
canada.ca, valtiokonttori.fi, aade.gr, vmi.lt, digg.se, logius.nl,
skatteetaten.no, belastingdienst.nl and twenty more national agencies the
same as a vendor blog, because they hold no .gov label. Roughly one in
eight citations was misgraded by pattern alone. If you add a rule here,
add the agency to PRIMARY by name; do not widen the regex.
"""
import os
import re
import sqlite3
import sys
from collections import Counter

# Government / official-gazette host patterns. Matched on the host because a
# path can be anything; the host is who is answering.
GOV_RE = re.compile(
    r"(^|\.)gov\.|(^|\.)gob\.|(^|\.)gouv\.|(^|\.)go\.[a-z]{2}$|"
    r"\.gov$|\.govt\.nz$|\.gv\.at$|\.admin\.ch$|\.gc\.ca$|\.gob\.[a-z]{2}$|"
    r"(^|\.)go\.[a-z]{2}\.|(^|\.)gov$"
)

# host -> (tier, note). Suffix-matched: a rule for "pwc.com" also covers
# "taxsummaries.pwc.com".
PRIMARY = {
 # national tax authority, ministry, or the state's own e-invoicing operator
 "revenue.ie":"Revenue Commissioners, Ireland",
 "sii.cl":"Servicio de Impuestos Internos, Chile",
 "financnasprava.sk":"Financial Administration, Slovakia",
 "erhvervsstyrelsen.dk":"Danish Business Authority",
 "nemhandel.dk":"Nemhandel, run by the Danish Business Authority",
 "canada.ca":"Government of Canada",
 "valtiokonttori.fi":"State Treasury, Finland",
 "gub.uy":"Government of Uruguay",
 "island.is":"Government of Iceland portal",
 "skatturinn.is":"Iceland Revenue and Customs",
 "fin.ee":"Ministry of Finance, Estonia",
 "aade.gr":"Independent Authority for Public Revenue, Greece",
 "upphandlingsmyndigheten.se":"National Agency for Public Procurement, Sweden",
 "digg.se":"Agency for Digital Government, Sweden",
 "vmi.lt":"State Tax Inspectorate, Lithuania",
 "bundesfinanzministerium.de":"Federal Ministry of Finance, Germany",
 "e-rechnung-bund.de":"Federal e-invoicing portal, Germany",
 "gesetze-im-internet.de":"Federal law online, Germany (BMJ)",
 "logius.nl":"Logius, Dutch Ministry of the Interior",
 "rijksoverheid.nl":"Central government, Netherlands",
 "belastingdienst.nl":"Tax Administration, Netherlands",
 "skatteetaten.no":"Norwegian Tax Administration",
 "regjeringen.no":"Government of Norway",
 "stortinget.no":"Parliament of Norway",
 "nen.nipez.cz":"National electronic procurement tool, Czechia",
 "aop.bg":"Public Procurement Agency, Bulgaria",
 "nra.bg":"National Revenue Agency, Bulgaria",
 "anaf.ro":"National Agency for Fiscal Administration, Romania",
 "guichet.public.lu":"Official state portal, Luxembourg",
 # official gazettes and state legal registers
 "legislation.gov.uk":"official UK statute",
 "boe.es":"Boletin Oficial del Estado, Spain",
 "diariodarepublica.pt":"Diario da Republica, Portugal",
 "dre.pt":"Diario da Republica, Portugal",
 "retsinformation.dk":"official legal information, Denmark",
 "lovdata.no":"publisher of Norsk Lovtidend",
 "stjornartidindi.is":"official gazette, Iceland",
 "uradni-list.si":"Uradni list, Slovenia",
 "narodne-novine.nn.hr":"Narodne novine, Croatia",
 "riksdagen.se":"Swedish parliament, statute text",
 "impo.com.uy":"IMPO, official publisher, Uruguay",
 "busquedas.elperuano.pe":"El Peruano, official gazette, Peru",
 "lex.uz":"national legislation database, Uzbekistan",
 "adilet.zan.kz":"official legal information system, Kazakhstan",
 "fjs.atlassian.net":"Fjarsysla rikisins, the Icelandic Financial Management Authority -- its own wiki, hosted on Atlassian Cloud",
 "pravno-informacioni-sistem.rs":"official legal information system, Serbia",
 "qanoon.om":"Oman legal portal, Ministry of Legal Affairs",
 "almeezan.qa":"Al Meezan, Qatar legal portal, Ministry of Justice",
 "kenyalaw.org":"National Council for Law Reporting, a state corporation",
 "normattiva.it":"official consolidated statute, Italy",
 "eur-lex.europa.eu":"Official Journal of the EU -- the legal text itself",
}
INSTITUTIONAL = {
 "ec.europa.eu":"European Commission",
 "europa.eu":"European Union institution",
 "peppol.org":"OpenPeppol",
 "peppol.eu":"OpenPeppol",
 "openpeppol.org":"OpenPeppol",
 "peppol.nu":"Swedish Peppol authority",
 "peppolautoriteit.nl":"Dutch Peppol authority",
 "dbnalliance.org":"Digital Business Networks Alliance, US Peppol-equivalent body",
 "fnfe-mpe.org":"Forum National de la Facture Electronique, France",
 "tieke.fi":"TIEKE, non-profit registry operator -- not the tax authority",
 "ciat.org":"Inter-American Center of Tax Administrations",
 "oecd.org":"OECD", "gs1.org":"GS1", "unece.org":"UNECE",
 "iso.org":"ISO", "cen.eu":"CEN",
}
SECONDARY_EXACT = {
 # trackers and vendor / adviser content
 "vatupdate.com","sovos.com","edicomgroup.com","vatcalc.com","e-invoice.app","ecosio.com",
 "rtcsuite.com","fiscal-requirements.com","comarch.com","recommand.eu","fonoa.com",
 "avalara.com","dddinvoices.com","basware.com","pagero.com","storecove.com","unifiedpost.com",
 "billentis.com","theinvoicinghub.com","invoicing.hub","invoice-portal.de","eu-einvoicing.com",
 "banqup.com","cleartax.com","cygnet.one","jomeinvoice.my","hanumaglobal.com","marosavat.com",
 "fiskaly.com","dext.com","babelway.com","vertexinc.com","globalindirecttaxmanagement.com",
 "inventti.com.br","senior.com.br","involvia.ai","clearvo.io","alitium.com","t4sadvance.com",
 "saphety.com","voxelgroup.net","facturele.com","numbero.app","fakturko.io","ticofactura.cr",
 "qoyod.com","digitdoc.hu","pajakku.com","billbox.bg","taxually.com","orbitax.com",
 "regfollower.com","comparateur-efacturation.fr","vatit.com","llbsolutions.com","muc.co.id",
 "ddtc.co.id","tmconsulting.co.rs","hcat.co","stripe.com","bbva.com","bankgirot.se",
 "wafeq.com","aurifer.tax","misfacturas.com.co","avl.com.ec","seres.com","impositus.com",
 # accountancy and law firms, professional bodies, chambers
 "kpmg.com","ey.com","pwc.com","pwc.bg","pwc.no","deloitte.com","bdo.global","roedl.com",
 "grantthornton.com.ph","grantthornton.global","forvismazars.com","hawksford.com",
 "thelemabogados.pe","reyestacandong.com","sclawyer.com.do","ancgroup.biz","pcga.mx",
 "abk-korea.com","thomsonreuters.com","europe.thomsonreuters.com",
 "wko.at","occ.pt","icas.com","incp.org.co","cijuf.org.co","cpcef.org.ar",
 "vatassociation.org","oaf.ucr.ac.cr","compta-online.com","aaptaxlaw.com",
 # private legal and tax databases -- they reproduce the law, they are not it
 "lawphil.net","law.cornell.edu","dejure.org","brocardi.it","arslege.pl","jusline.at",
 "zakon.hr","lawspot.gr","taxheaven.gr","universuljuridic.ro","paragraf.rs","esnai.cn",
 "uchet.kz","pro1c.kz","thuvienphapluat.vn","luatvietnam.vn","vlex.com.pe","lexis.com.ec",
 "normaslegais.com.br","danovky.sk","informazionefiscale.it","contabeis.com.br",
 "ifinanses.lv","taxguru.in","taxmanagementindia.com","leyes-mx.com","leyesmx.com","mley.mx",
 "buxgalter.uz","siemprealdia.co","actualicese.com","expats.cz","5percado.hu",
 # press and newswires
 "thisdaylive.com","premiumtimesng.com","gulfnews.com","dawn.com","brecorder.com",
 "infobae.com","gestion.pe","primicias.ec","acento.com.do","uzdaily.uz","capital.ro",
 "prnewswire.com","azertag.az","lsm.lv","snl.no","reuters.com","bloomberg.com","forbes.com",
 "vietnam-briefing.com","china-briefing.com","aseanbriefing.com","medium.com","linkedin.com",
}
# Deliberately not guessed. Stored as unknown with the reason, the same way a
# headline fact we cannot source is stored.
UNKNOWN = {
 "plz.lv":"could not establish who operates this host",
 "sabis.evaf.lt":"could not establish who operates this host",
 "bj148.org":"could not establish who operates this host",
 "ibac.uz":"could not establish who operates this host",
}

def norm(u):
    h = re.sub(r"^https?://", "", u or "").split("/")[0].lower().split(":")[0]
    return h[4:] if h.startswith("www.") else h

def suffixes(h):
    parts = h.split(".")
    return [".".join(parts[i:]) for i in range(len(parts))]

def tier(host):
    for s in suffixes(host):
        if s in UNKNOWN: return "unknown", UNKNOWN[s]
        if s in PRIMARY: return "primary", PRIMARY[s]
        if s in INSTITUTIONAL: return "institutional", INSTITUTIONAL[s]
        if s in SECONDARY_EXACT: return "secondary", ""
    if GOV_RE.search(host): return "primary", ""
    return None, "unclassified"

# ---- what is ungraded, and what to do about it -------------------------

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(REPO, "tests", "lib"))


def replay():
    """The migration chain in memory -- the same one the tests run on."""
    import replay_server
    conn, unexpected = replay_server.build()
    if unexpected:
        raise SystemExit("replay produced NEW errors; fix the chain first:\n  "
                         + "\n  ".join(unexpected))
    conn.row_factory = sqlite3.Row
    return conn


def main(audit=False):
    conn = replay()
    rows = conn.execute("""
        SELECT cs.host AS host, count(*) AS n,
               (SELECT tier FROM source_hosts sh WHERE sh.host = cs.host) AS graded
          FROM cited_sources cs GROUP BY cs.host ORDER BY n DESC, cs.host""").fetchall()

    ungraded = [r for r in rows if r["graded"] is None]
    if not ungraded:
        print(f"{len(rows)} cited hosts, all graded.")
    else:
        print(f"{len(ungraded)} host(s) cited but not in source_hosts:\n")
        lines = []
        for r in ungraded:
            ti, note = tier(r["host"])
            mark = ti or "DECIDE"
            print(f"  {r['n']:4}  {r['host']:44} {mark}")
            # A DECIDE line gets a note that is obviously a placeholder.
            # "unclassified" pasted into a migration would read as a
            # stated reason, and 613's assertion that an unknown tier
            # carries one would pass on a sentence nobody wrote.
            if ti:
                note_sql = ("'" + note.replace("'", "''") + "'") if note else "NULL"
            else:
                note_sql = "'DECIDE -- name the operator, or say why you could not'"
            lines.append("  ('{}', '{}', {}, 'YYYY-MM-DD')".format(
                r["host"].replace("'", "''"), ti or "unknown", note_sql))
        print("\nFor the new migration (check every DECIDE line by hand first):\n")
        print("INSERT INTO source_hosts (host, tier, note, classified_on) VALUES")
        print(",\n".join(lines) + ";")

    if audit:
        # Regrade every host from the rules and report where the table and
        # the rules disagree. They can legitimately: a host graded by hand
        # in a migration is the record, and this is the reminder to bring
        # the rule up to it rather than the other way round.
        print("\n---- audit: table vs rules ----")
        drift = 0
        for r in rows:
            if r["graded"] is None:
                continue
            ti, _ = tier(r["host"])
            if ti and ti != r["graded"]:
                drift += 1
                print(f"  {r['host']:44} table={r['graded']:14} rules={ti}")
        counts = Counter(r["graded"] for r in rows)
        print(f"\n  {sum(r['n'] for r in rows)} citations across {len(rows)} hosts")
        for k, v in counts.most_common():
            print(f"    {k or 'UNGRADED':15}{v:5} hosts")
        print(f"  {drift} host(s) where the rules would say something else.")


if __name__ == "__main__":
    main(audit="--audit" in sys.argv)
