"""Generate migration 620 — the ten countries whose every headline fact
rested on a tracker, a vendor or an adviser.

Source grading (613) made this list a query rather than a memory: ten
jurisdictions where all five headline facts cited someone reporting on the
law rather than making it. Cyprus, Egypt, Indonesia, Jordan, Latvia,
Malta, Serbia, South Korea, Uzbekistan, Vietnam.

Ten researchers, one per country, were told to find the jurisdiction's own
text and to apply this site's own rules — a status is the duty to ISSUE, a
plan needs an enacted instrument and a date, and unknown with a reason
beats a guess. They were also told, in terms, that "we could not source
this" is a useful answer. Four of them used it.

WHAT CAME BACK. 46 of the 50 facts now cite the jurisdiction's own
authority or an official institution, where none did before, and no
country in the ten is entirely secondary any more. Four published
statuses were wrong and four published dates were wrong. Two countries
could not be finished, because their state hosts refuse automated
fetching — Korea's NTS, law.go.kr and Hometax all failed at robots.txt,
and Vietnam's General Department of Taxation returns 403 to
non-Vietnamese traffic. Those four remaining facts keep their secondary
citations and say so in their notes.

THE RULE APPLIED WHEN RESEARCH AND PUBLICATION DISAGREED. A published
value was changed only where a primary source CONTRADICTED it, or where
the value turned out to be derived from something that does not support
it. Where a source simply could not be reached, the value stands with its
old citation and the note records the attempt. Downgrading a probably-true
fact to "unknown" because our fetcher was blocked would be a different
kind of dishonesty, not a smaller one.

Run:  python3 migrations/gen_weak_sources.py
Writes: migrations/620_ten_countries_own_authority.sql
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
LANGS = ["en", "de", "fr", "es"]
CHANGED_ON = "2026-08-23"

# ---- hosts this migration starts citing --------------------------------
#
# 613 refuses any citation from an ungraded host, so these come first.
NEW_HOSTS = [
    ("petra.gov.jo", "primary",
     "Petra, the Jordan News Agency -- state-owned, carrying the tax department's own statements verbatim"),
    ("likumi.lv", "primary",
     "official consolidated law portal, run by Latvijas Vestnesis, the official gazette"),
    ("legislation.mt", "primary", "official legislation portal, Malta"),
    ("call.nts.go.kr", "primary",
     "National Tax Service call-centre FAQ -- the authority's own guidance, not statute"),
    ("congbao.chinhphu.vn", "primary", "Cong bao, the Government Official Gazette, Vietnam"),
    ("xaydungchinhsach.chinhphu.vn", "primary",
     "Government Portal policy site, run by the Government Office, Vietnam"),
]

# ---- the fifty facts ----------------------------------------------------
#
# (country, field) -> dict with any of: src, status, date, years, note
FACTS = {
    # ---- CYPRUS: confirmed, upgraded from a tracker to the Commission ---
    ("Cyprus", "b2g"): dict(
        src="https://ec.europa.eu/digital-building-blocks/sites/display/DIGITAL/eInvoicing+in+Cyprus",
        note="Law 89(I)/2019 is titled 'issuing' but obliges authorities to RECEIVE; no supplier duty"),
    ("Cyprus", "b2b"): dict(
        src="https://ec.europa.eu/digital-building-blocks/sites/display/DIGITAL/eInvoicing+in+Cyprus",
        note="No B2B requirement; a stated long-term intention only, with no instrument and no date"),
    ("Cyprus", "b2c"): dict(
        src="https://ec.europa.eu/digital-building-blocks/sites/display/DIGITAL/eInvoicing+in+Cyprus",
        note="No B2C requirement; named only in the same long-term intention as B2B"),
    ("Cyprus", "archiving"): dict(
        src="https://www.mof.gov.cy/mof/TAX/taxdep.nsf/All/97DEDBA1FEDCB151C225824F0029CFE4/$file/EE10.pdf",
        note="Tax Department VAT guide EE10 section VIII would settle this; only its contents page was reachable"),
    ("Cyprus", "signature"): dict(
        src="https://www.mof.gov.cy/mof/TAX/taxdep.nsf/All/97DEDBA1FEDCB151C225824F0029CFE4/$file/EE10.pdf",
        note="EE10 paras 54-55 cover computer-issued and electronically transmitted invoices; body unreachable"),

    # ---- EGYPT: two dates wrong, and signature is not a flat yes --------
    ("Egypt", "b2g"): dict(
        src="https://www.eta.gov.eg/ar/news/mnzwmt-alfatwrt-alalktrwnyt",
        date="2020-11-15",
        note="No separate B2G instrument; a supplier's duty starts with its own wave, first bite Nov 2020. "
             "From 1 Dec 2022 government bodies neither contract nor pay except against an e-invoice"),
    ("Egypt", "b2b"): dict(
        src="https://www.eta.gov.eg/ar/news/mnzwmt-alfatwrt-alalktrwnyt",
        date="2020-11-15",
        note="ETA decree 386/2020 bound the first 134 companies from 15 Nov 2020; universal from 15 Dec 2022. "
             "The Apr 2023 date often quoted is a VAT-deduction rule on the buyer, not a duty to issue"),
    ("Egypt", "b2c"): dict(
        src="https://www.eta.gov.eg/ar/news/mslht-aldrayb-almsryt-tsdr-qrar-balzam-153-shrkt-basdar-aysalat-drybyt-alktrwnyt",
        note="A separate system: e-receipts, ETA decree 289/2022, first 153 companies from 1 Jul 2022, "
             "still rolling out wave by wave"),
    ("Egypt", "archiving"): dict(
        src="https://www.eta.gov.eg/sites/default/files/2024-02/VAT-Executive-Regulations-English.pdf",
        note="VAT Executive Regulations art.25: books, records and invoices kept five years"),
    ("Egypt", "signature"): dict(
        src="https://eta.gov.eg/sites/default/files/2024-02/ERECEIPT-FAQ-V24-31-1-2024.pdf",
        status="conditional",
        note="E-invoices must carry the issuer's e-seal certificate; ETA's own e-receipt FAQ says a receipt "
             "does not need one, so the answer depends on which document you are issuing"),

    # ---- INDONESIA: every fact confirmed, every source replaced ---------
    ("Indonesia", "b2g"): dict(
        src="https://www.pajak.go.id/id/peraturan/penetapan-pengusaha-kena-pajak-yang-diwajibkan-membuat-faktur-pajak-berbentuk-elektronik",
        note="No separate B2G track; KEP-136/PJ/2014 made e-Faktur national from 1 Jul 2016 for every PKP"),
    ("Indonesia", "b2b"): dict(
        src="https://pajak.go.id/en/node/80396",
        note="PER-03/PJ/2022 art.2(3): a PKP's tax invoice must be electronic; paper only in listed "
             "force-majeure cases"),
    ("Indonesia", "b2c"): dict(
        src="https://pajak.go.id/en/node/80396",
        note="PER-03/PJ/2022 arts.25-27: a retail PKP issues a simplified invoice, which may be a "
             "cash-register slip or receipt, so no electronic form is imposed"),
    ("Indonesia", "archiving"): dict(
        src="https://pajak.go.id/sites/default/files/2019-07/UU_2007_28.pdf",
        note="KUP art.28(11): ten years, in Indonesia, expressly including records kept electronically"),
    ("Indonesia", "signature"): dict(
        src="https://pajak.go.id/en/node/80396",
        note="PER-03/PJ/2022 art.10(5) requires an electronic signature; since 2025 either a certificate "
             "or a DJP authorisation code"),

    # ---- JORDAN: the B2C date was a vendor's inference ------------------
    ("Jordan", "b2g"): dict(
        src="https://petra.gov.jo/Include/InnerPage.jsp?ID=302931&lang=ar&name=news",
        note="Regulation 2/2025 obliges government departments to buy from JoFotara-compliant suppliers "
             "from 1 Apr 2025; the duty to issue itself dates from Regulation 13/2023"),
    ("Jordan", "b2b"): dict(
        src="https://petra.gov.jo/Include/InnerPage.jsp?ID=302284&lang=ar&name=news",
        note="From 1 Apr 2025 an invoice counts as a deductible expense only if issued through JoFotara "
             "or a system linked to it"),
    ("Jordan", "b2c"): dict(
        src="https://petra.gov.jo/Include/InnerPage.jsp?ID=302931&lang=ar&name=news",
        date=None,
        note="Scope is all establishments, companies and individuals bar narrow turnover exemptions; no "
             "official source gives a B2C-specific start date, so we no longer publish one"),
    ("Jordan", "archiving"): dict(
        src="https://www.istd.gov.jo/EBV4.0/Root_Storage/AR/Invoice/%D9%86%D8%B8%D8%A7%D9%85_%D8%AA%D9%86%D8%B8%D9%8A%D9%85_%D8%B4%D8%A4%D9%88%D9%86_%D8%A7%D9%84%D9%81%D9%88%D8%AA%D8%B1%D8%A9_2023.pdf",
        note="Four years from the LATEST of tax-period end, filing date or assessment notice; since 2023 "
             "the JoFotara record satisfies retention in place of paper"),
    ("Jordan", "signature"): dict(
        src="https://www.istd.gov.jo/ebv4.0/root_storage/ar/eb_list_page/%D8%A7%D9%84%D8%AF%D9%84%D9%8A%D9%84_%D8%A7%D9%84%D8%AA%D9%82%D9%86%D9%8A_%D9%84%D9%84%D8%B1%D8%A8%D8%B7_%D9%85%D8%B9_%D9%86%D8%B8%D8%A7%D9%85_%D8%A7%D9%84%D9%81%D9%88%D8%AA%D8%B1%D8%A9_%D8%A7%D9%84%D9%88%D8%B7%D9%86%D9%8A.pdf",
        note="ISTD's integration guide specifies UBL 2.1 with client-ID and secret-key authentication and "
             "no signing step; this is a complete spec that omits it, not an express exemption"),

    # ---- LATVIA: "varies" was a hedge the statute does not need ---------
    ("Latvia", "b2g"): dict(
        src="https://likumi.lv/ta/en/en/id/324249-accounting-law",
        note="Accounting Law s.11(14) obliges the SUPPLIER to draw up a structured e-invoice; in force for "
             "budget institutions from 1 Jan 2025"),
    ("Latvia", "b2b"): dict(
        src="https://likumi.lv/ta/en/en/id/324249-accounting-law",
        note="Transitional provision 8 of the Accounting Law itself sets 1 Jan 2028, moved from 2026 by the "
             "amendment adopted 5 Jun 2025"),
    ("Latvia", "b2c"): dict(
        src="https://likumi.lv/ta/en/en/id/324249-accounting-law",
        note="s.11(14) reaches only invoices to another undertaking registered in Latvia; natural persons "
             "are outside it"),
    ("Latvia", "archiving"): dict(
        src="https://likumi.lv/ta/en/en/id/324249-accounting-law",
        status="years", years=5,
        note="Accounting Law s.28: invoices are 'other source documents', kept not less than five years. "
             "Registers and payroll records are ten"),
    ("Latvia", "signature"): dict(
        src="https://likumi.lv/ta/en/en/id/324249-accounting-law",
        note="Neither the Accounting Law nor Cabinet Regulation 749 requires an e-signature; the format is "
             "UBL 2.1 / Peppol BIS Billing 3.0"),

    # ---- MALTA: four of five now rest on Maltese law -------------------
    ("Malta", "b2g"): dict(
        src="https://finance.gov.mt/resources/einvoicing/",
        note="The Ministry for Finance states there is no requirement for suppliers to invoice public bodies "
             "electronically; government is bound only to accept"),
    ("Malta", "b2b"): dict(
        src="https://mtca.gov.mt/business-tax/vat1/vat-information/e-invoicing-and-drr/e-invoicing-and-drr",
        note="MTCA describes a study phase towards being ViDA-ready by 2030; no instrument and no date"),
    ("Malta", "b2c"): dict(
        src="https://mtca.gov.mt/business-tax/vat1/vat-information/e-invoicing-and-drr/e-invoicing-and-drr",
        note="Same study phase; nothing imposes a duty to invoice consumers electronically"),
    ("Malta", "archiving"): dict(
        src="https://legislation.mt/eli/cap/406/eng/pdf",
        note="VAT Act (Cap.406) art.48: at least six years from the END OF THE YEAR concerned, a floor the "
             "Commissioner may extend for specified records"),
    ("Malta", "signature"): dict(
        src="https://legislation.mt/eli/cap/406/eng/pdf",
        note="The art.233 rules sit in the Twelfth Schedule to Cap.406, which legislation.mt serves only "
             "through a viewer we could not read"),

    # ---- SERBIA: one statute, published by the state, answers all five --
    ("Serbia", "b2g"): dict(
        src="https://www.efaktura.gov.rs/tekst/9490/zakon-o-elektronskom-fakturisanju-04122025.php",
        note="Law on Electronic Invoicing art.24(5): a private entity must issue to a public entity from "
             "1 May 2022. Public-to-private issuing started 1 Jul 2022"),
    ("Serbia", "b2b"): dict(
        src="https://www.efaktura.gov.rs/tekst/9490/zakon-o-elektronskom-fakturisanju-04122025.php",
        note="art.24(7): issuing and retention between private entities from 1 Jan 2023"),
    ("Serbia", "b2c"): dict(
        src="https://www.efaktura.gov.rs/tekst/9490/zakon-o-elektronskom-fakturisanju-04122025.php",
        note="The law's transactions are public-public, private-private or public-private; consumers fall "
             "outside its scope entirely"),
    ("Serbia", "archiving"): dict(
        src="https://www.efaktura.gov.rs/tekst/9490/zakon-o-elektronskom-fakturisanju-04122025.php",
        note="art.15(2): ten years from the end of the year of issue for private entities. Public sector "
             "e-invoices are kept permanently in the SEF"),
    ("Serbia", "signature"): dict(
        src="https://www.efaktura.gov.rs/tekst/9490/zakon-o-elektronskom-fakturisanju-04122025.php",
        note="No signature or seal anywhere in the law; art.15(6) assigns authenticity and integrity to the "
             "prescribed format and to storage"),

    # ---- SOUTH KOREA: three of five. The rest, honestly, refused us -----
    ("South Korea", "b2g"): dict(
        src="https://call.nts.go.kr/call/qna/selectHomeQnaInfo.do?mi=12941",
        note="No separate B2G regime: the duty attaches to the SUPPLIER's own status under VAT Act art.32, "
             "so a public-body buyer changes nothing"),
    ("South Korea", "b2b"): dict(
        src="https://call.nts.go.kr/call/qna/selectHomeQnaInfo.do?mi=12941",
        note="NTS: all corporate businesses, plus individual businesses at KRW 80m prior-year supply, who "
             "join each 1 July. The 2011 start is from the VAT Act addenda, which we have not read"),
    ("South Korea", "signature"): dict(
        src="https://call.nts.go.kr/call/qna/selectHomeQnaInfo.do?mi=12941",
        note="NTS requires a joint certificate to issue. The Enforcement Decree also allows ARS and agent "
             "channels, which may not need one, so this may prove to be conditional"),
    ("South Korea", "b2c"): dict(
        note="No tax invoice to final consumers; cash receipts or card slips instead. Whether a mandatory "
             "cash receipt counts as a B2C duty is an open editorial question we have not settled"),
    ("South Korea", "archiving"): dict(
        note="Five years, still on a secondary source: NTS confirms that invoices transmitted to it need "
             "not be separately kept, but every Korean host holding the period refused us"),

    # ---- UZBEKISTAN: the consumer carve-out is narrower than we said ----
    ("Uzbekistan", "b2g"): dict(
        src="https://lex.uz/docs/4386771",
        note="Cabinet Resolution 522 of 25 Jun 2019: voluntary from 1 Jul 2019, compulsory for all business "
             "entities from 1 Jan 2020. No separate B2G instrument"),
    ("Uzbekistan", "b2b"): dict(
        src="https://lex.uz/docs/4386771",
        note="Same resolution and same date; the current invoice-form rules are Appendix 2 to Cabinet "
             "Resolution 489 of 14 Aug 2020"),
    ("Uzbekistan", "b2c"): dict(
        src="https://lex.uz/docs/-4386769",
        status="active", date="2020-01-01",
        note="Para 18 governs sales to individuals: the seller's e-invoice is confirmed one-sidedly with "
             "its own digital signature. Only cash sales evidenced by a fiscal receipt are carved out"),
    ("Uzbekistan", "archiving"): dict(
        src="https://lex.uz/docs/-4386769",
        status="unknown",
        note="The e-invoicing regulation puts ten years on the platform operator and says nothing about the "
             "taxpayer. The five years we published cited a host we could not attribute to anyone"),
    ("Uzbekistan", "signature"): dict(
        src="https://lex.uz/docs/-4386769",
        note="Paras 14, 16 and 18 make the digital signature constitutive: the seller signs, and the buyer "
             "signs to accept or rejects with reasons"),

    # ---- VIETNAM: the instrument and its date, not yet its article ------
    ("Vietnam", "b2g"): dict(
        src="https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-123-2020-nd-cp-32290/33002.htm",
        note="No separate B2G track. Decree 123/2020 is in force from 1 Jul 2022 per the Official Gazette; "
             "its full text is served only as a PDF the Gazette refuses to release"),
    ("Vietnam", "b2b"): dict(
        src="https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-123-2020-nd-cp-32290/33002.htm",
        note="Same decree and date. Dual model: a tax-authority code before delivery, or transmission "
             "without one"),
    ("Vietnam", "b2c"): dict(
        src="https://xaydungchinhsach.chinhphu.vn/mot-so-noi-dung-moi-cua-nghi-dinh-so-70-2025-nd-cp-ve-hoa-don-chung-tu-119250403074719995.htm",
        note="In scope since Jul 2022. Decree 70/2025 widened the cash-register variant from 1 Jun 2025 to "
             "households over VND 1bn and named consumer-facing sectors"),
    ("Vietnam", "archiving"): dict(
        note="Ten years under Accounting Law art.41, still on a secondary source: the tax department returns "
             "403 to non-Vietnamese traffic and the Gazette will not serve the decree text"),
    ("Vietnam", "signature"): dict(
        note="Seller digital signature required. Decree 123 art.10 lists cases where one is not necessarily "
             "needed, cash-register invoices among them, so this may prove to be conditional"),
}

# ---- what changed, for the reader --------------------------------------
#
# Only STATUS moves get a fact_history row: that is what the table models,
# and migration 615's header says so. Three of the fifty facts moved.
CORRECTIONS = [
    ("Egypt", "signature_status", "required", "conditional", {
        "en": "Egypt's e-invoices must carry the issuer's electronic seal, but the Tax Authority's own e-receipt FAQ answers the question directly — “the receipt does not require an electronic signature”. A single “required” covered the invoice system and quietly misstated the receipt system beside it.",
        "de": "Ägyptische E-Rechnungen müssen das elektronische Siegel des Ausstellers tragen, doch die FAQ der Steuerbehörde zum elektronischen Beleg beantwortet die Frage unmittelbar: „Der Beleg benötigt keine elektronische Signatur.“ Ein pauschales „erforderlich“ erfasste das Rechnungssystem und stellte das danebenstehende Belegsystem stillschweigend falsch dar.",
        "fr": "Les factures électroniques égyptiennes doivent porter le sceau électronique de l'émetteur, mais la FAQ de l'administration fiscale sur le reçu électronique répond directement : « le reçu n'exige pas de signature électronique ». Un « requis » unique couvrait le système de facturation et faussait discrètement le système de reçus voisin.",
        "es": "Las facturas electrónicas egipcias deben llevar el sello electrónico del emisor, pero las preguntas frecuentes de la autoridad tributaria sobre el recibo electrónico responden directamente: «el recibo no requiere firma electrónica». Un «obligatoria» único abarcaba el sistema de facturación y tergiversaba en silencio el sistema de recibos contiguo.",
    }),
    ("Latvia", "archiving_status", "varies", "years", {
        "en": "“Varies” was a hedge the statute does not need. Section 28 of the Accounting Law places invoices in “other source documents” and sets not less than five years; the ten- and seventy-five-year periods elsewhere in that section belong to registers and payroll records, not to invoices.",
        "de": "„Unterschiedlich“ war eine Absicherung, die das Gesetz nicht braucht. § 28 des Rechnungslegungsgesetzes ordnet Rechnungen den „sonstigen Belegen“ zu und setzt mindestens fünf Jahre an; die dort ebenfalls genannten zehn und fünfundsiebzig Jahre betreffen Register und Lohnunterlagen, nicht Rechnungen.",
        "fr": "« Variable » était une prudence dont la loi n'a pas besoin. L'article 28 de la loi comptable range les factures parmi les « autres pièces justificatives » et fixe un minimum de cinq ans ; les durées de dix et soixante-quinze ans figurant au même article visent les registres et la paie, non les factures.",
        "es": "«Variable» era una cautela que la ley no necesita. El artículo 28 de la Ley de Contabilidad sitúa las facturas entre los «demás documentos justificativos» y fija no menos de cinco años; los plazos de diez y setenta y cinco años del mismo artículo corresponden a registros y nóminas, no a facturas.",
    }),
    ("Uzbekistan", "archiving_status", "years", "unknown", {
        "en": "The five-year period rested on a single host we could not attribute to any identifiable operator — the only ungraded source behind any published fact on this site. Uzbekistan's e-invoicing regulation itself imposes ten years on the platform operator and says nothing about how long the taxpayer must keep anything. Where the other countries in this sweep keep a secondary source we can at least name, this one had none, so it becomes what it actually is: not confirmed.",
        "de": "Die Fünfjahresfrist stützte sich auf einen einzigen Host, den wir keinem identifizierbaren Betreiber zuordnen konnten — die einzige unbewertete Quelle hinter einer veröffentlichten Aussage dieser Website. Die usbekische E-Invoicing-Verordnung selbst verpflichtet den Plattformbetreiber zu zehn Jahren und sagt nichts darüber, wie lange der Steuerpflichtige etwas aufbewahren muss. Wo die übrigen Länder dieser Runde eine wenigstens benennbare Sekundärquelle behalten, hatte diese keine — also wird daraus, was es tatsächlich ist: nicht bestätigt.",
        "fr": "La durée de cinq ans reposait sur un unique hôte que nous n'avons pu rattacher à aucun exploitant identifiable — la seule source non classée derrière un fait publié sur ce site. Le règlement ouzbek sur la facturation électronique impose lui-même dix ans à l'exploitant de la plateforme et ne dit rien de la durée de conservation incombant au contribuable. Là où les autres pays de cette série conservent une source secondaire au moins nommable, celle-ci n'en avait aucune : elle devient donc ce qu'elle est réellement, non confirmée.",
        "es": "El plazo de cinco años se apoyaba en un único host que no pudimos atribuir a ningún operador identificable: la única fuente sin clasificar detrás de un dato publicado en este sitio. El propio reglamento uzbeko de facturación electrónica impone diez años al operador de la plataforma y no dice nada sobre cuánto debe conservar el contribuyente. Donde el resto de países de esta tanda conservan una fuente secundaria al menos nombrable, esta no tenía ninguna: pasa a ser lo que realmente es, sin confirmar.",
    }),
    ("Uzbekistan", "b2c_status", "no_mandate", "active", {
        "en": "We recorded no consumer mandate on the strength of an accounting portal. The regulation itself says the opposite: paragraph 18 governs sales to individuals not in business, where the seller's e-invoice is confirmed one-sidedly with its own digital signature. The carve-out in paragraph 3 is narrow — cash sales evidenced by a fiscal receipt, tickets, export-import, finance leases.",
        "de": "Wir hatten auf Grundlage eines Buchhaltungsportals keine Verbraucherpflicht erfasst. Die Verordnung selbst sagt das Gegenteil: Ziffer 18 regelt Verkäufe an nicht unternehmerisch tätige Privatpersonen, bei denen die E-Rechnung des Verkäufers einseitig mit dessen digitaler Signatur bestätigt wird. Die Ausnahme in Ziffer 3 ist eng — Barverkäufe mit Kassenbeleg, Fahrscheine, Ex- und Import, Finanzierungsleasing.",
        "fr": "Nous avions consigné l'absence d'obligation envers les consommateurs sur la foi d'un portail comptable. Le règlement dit l'inverse : le paragraphe 18 régit les ventes aux particuliers non entrepreneurs, où la facture électronique du vendeur est confirmée unilatéralement par sa propre signature numérique. L'exclusion du paragraphe 3 est étroite — ventes au comptant justifiées par un ticket de caisse, billets, import-export, crédit-bail.",
        "es": "Habíamos registrado que no había obligación frente al consumidor apoyándonos en un portal contable. El propio reglamento dice lo contrario: el apartado 18 regula las ventas a particulares no empresarios, en las que la factura electrónica del vendedor se confirma unilateralmente con su propia firma digital. La exclusión del apartado 3 es estrecha: ventas en efectivo justificadas con ticket fiscal, billetes, importación y exportación, arrendamiento financiero.",
    }),
]

UNKNOWN_REASONS = {
    "Cyprus": "Archiving and signature: the Tax Department's VAT guide EE10 is the document that would settle "
              "both -- section VIII on keeping records, and paras 54-55 on computer-issued and electronically "
              "transmitted invoices -- but only its contents page could be retrieved, and every other Cypriot "
              "state host refused automated access. The EU norm is not a Cypriot answer.",
    "Uzbekistan": "Archiving: Cabinet Resolution 522's regulation obliges the platform operator to keep "
                  "confirmed e-invoices for at least ten years and is silent on the taxpayer's own period. "
                  "The Tax Code articles that would settle it could not be retrieved -- lex.uz serves the "
                  "whole code as one page that truncates before them, and soliq.uz refused us entirely.",
    "Malta": "Signature: Malta's implementation of VAT Directive art.233 sits in the Twelfth Schedule to the "
             "VAT Act (Cap.406), which legislation.mt serves only through a viewer whose underlying document "
             "we could not open. The other four facts now rest on Maltese law.",
}


def q(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


HEADER = '''-- ================================================================
-- Ten countries stop resting on other people's homework.
-- ================================================================
--
-- Dan, 23 August 2026: "Please can you address the 10 weak-sourced
-- countries."
--
-- They were a query, not a memory, which is what migration 613 bought:
-- ten jurisdictions where all five headline facts cited someone
-- REPORTING on the law rather than making it. Cyprus, Egypt, Indonesia,
-- Jordan, Latvia, Malta, Serbia, South Korea, Uzbekistan, Vietnam.
--
-- Ten researchers, one per country, were told to find the jurisdiction's
-- own text and to apply this site's own rules -- a status is the duty to
-- ISSUE, a plan needs an enacted instrument AND a date, and unknown with
-- a reason beats a guess. They were told in terms that "we could not
-- source this" is a useful answer. Four of them used it, which is the
-- part of this migration worth reading.
--
-- ---- WHAT CHANGED, AND WHY ONLY THAT --------------------------------
--
-- A published value was changed only where a primary source
-- CONTRADICTED it, or where the value turned out to be derived from
-- something that does not support it. Where a source simply could not be
-- reached, the value stands with its old citation and its note records
-- the attempt. Downgrading a probably-true fact to "unknown" because our
-- fetcher was blocked would be a different kind of dishonesty, not a
-- smaller one.
--
-- FOUR STATUSES MOVED, each recorded in fact_history with its reason in
-- four languages:
--
--   EGYPT, signature: required -> conditional. E-invoices must carry the
--   issuer's e-seal; ETA's own e-receipt FAQ answers the question
--   directly -- "the receipt does not require an electronic signature".
--   One word covered the invoice system and misstated the receipt system
--   sitting beside it.
--
--   LATVIA, archiving: varies -> 5 years. "Varies" was a hedge the
--   statute does not need. Accounting Law s.28 puts invoices in "other
--   source documents" at not less than five years; the ten- and
--   seventy-five-year periods in the same section are registers and
--   payroll.
--
--   UZBEKISTAN, B2C: no mandate -> active. We had recorded no consumer
--   mandate on the strength of an accounting portal. Cabinet Resolution
--   522's own regulation says the opposite at paragraph 18.
--
--   UZBEKISTAN, archiving: 5 years -> not confirmed. This one is a
--   downgrade and it is deliberate. The figure rested on the single host
--   in the whole corpus that source grading could not attribute to
--   anybody -- the only ungraded source behind a published fact on this
--   site. The e-invoicing regulation itself imposes ten years on the
--   PLATFORM OPERATOR and is silent on the taxpayer. Where Korea and
--   Vietnam keep a secondary source we can at least name, this had none.
--
-- FOUR DATES WERE WRONG and are corrected without a history row, because
-- fact_history models statuses and not dates -- a gap /methodology
-- already admits. Egypt B2G and B2B both moved from dates that describe
-- something else (a cabinet decision about government-as-seller, and a
-- VAT-deduction rule) back to 15 Nov 2020, when ETA decree 386/2020 first
-- bound anybody. Jordan B2C loses its date entirely: no official source
-- gives one, and the 1 Apr 2025 we published came from a vendor's
-- inference. Uzbekistan B2C gains 1 Jan 2020 with its new status.
--
-- ---- THE TWO WE COULD NOT FIX ---------------------------------------
--
-- SOUTH KOREA and VIETNAM keep secondary citations on two facts each,
-- and this file will not pretend otherwise. Every Korean state host --
-- nts.go.kr, law.go.kr, hometax.go.kr -- failed at robots.txt; only the
-- NTS call-centre FAQ answered, which settles three facts and not the
-- retention period. Vietnam's General Department of Taxation returns 403
-- to non-Vietnamese traffic, and the Official Gazette publishes Decree
-- 123/2020's metadata while serving its text from a CDN that refuses us,
-- so we can cite the state for "this decree, in force this date" but not
-- yet for the article that creates the duty.
--
-- Both keep their old sources and say so in their notes. Two facts in
-- each country also carry a live doubt worth publishing rather than
-- hiding: Korea's signature may be conditional once the Enforcement
-- Decree's ARS and agent channels are read, and Vietnam's may be too,
-- since Decree 123 art.10 lists invoices that need no signature.
--
-- Generated by gen_weak_sources.py -- edit that, not this.
-- ================================================================'''

FIELD_COLS = {
    "b2g": ("b2g_status", "b2g_date", "b2g_source"),
    "b2b": ("b2b_status", "b2b_date", "b2b_source"),
    "b2c": ("b2c_status", "b2c_date", "b2c_source"),
    "archiving": ("archiving_status", None, "archiving_source"),
    "signature": ("signature_status", None, "signature_source"),
}


def main():
    out = [HEADER, ""]

    out.append("-- ---- the hosts these citations come from ----------------------------")
    out.append("--")
    out.append("-- 613 refuses a citation from an ungraded host, so these land first.")
    out.append("INSERT OR REPLACE INTO source_hosts (host, tier, note, classified_on) VALUES")
    out.append(",\n".join(
        f"  ({q(h)}, {q(t)}, {q(n)}, '2026-08-23')" for h, t, n in NEW_HOSTS) + ";")
    out.append("")

    out.append("-- ---- the facts ------------------------------------------------------")
    by_country = {}
    for (country, field), spec in FACTS.items():
        by_country.setdefault(country, []).append((field, spec))

    for country in sorted(by_country):
        out.append(f"\n-- {country}")
        for field, spec in sorted(by_country[country]):
            status_col, date_col, src_col = FIELD_COLS[field]
            sets = []
            if "src" in spec:
                sets.append(f"{src_col} = {q(spec['src'])}")
            if "status" in spec:
                sets.append(f"{status_col} = {q(spec['status'])}")
            if "date" in spec:
                sets.append(f"{date_col} = {q(spec['date'])}")
            if "years" in spec:
                sets.append(f"archiving_years = {spec['years']}")
            elif spec.get("status") == "unknown" and field == "archiving":
                sets.append("archiving_years = NULL")
            if sets:
                out.append("UPDATE country_headline_facts SET " + ", ".join(sets)
                           + f"\n WHERE country_id = (SELECT id FROM countries WHERE name_en = {q(country)});")
            if "note" in spec:
                out.append(f"UPDATE country_headline_fact_translations SET {field}_note = {q(spec['note'])}"
                           + f"\n WHERE lang = 'en' AND country_id = (SELECT id FROM countries WHERE name_en = {q(country)});")

    out.append("\n-- ---- re-checked today -----------------------------------------------")
    countries = sorted(by_country)
    out.append("UPDATE country_headline_facts SET last_verified = '2026-08-23'\n"
               " WHERE country_id IN (SELECT id FROM countries WHERE name_en IN ("
               + ", ".join(q(c) for c in countries) + "));")

    out.append("\n-- ---- why something is still unknown ---------------------------------")
    for country, reason in UNKNOWN_REASONS.items():
        out.append(f"UPDATE country_headline_facts SET unknown_reason = {q(reason)}\n"
                   f" WHERE country_id = (SELECT id FROM countries WHERE name_en = {q(country)});")

    out.append("\n-- ---- and what a reader is owed: the three that moved ----------------")
    out.append("--")
    out.append("-- 615 refuses a status change with no history row, and refuses a history")
    out.append("-- row with no reason in four languages. Both refusals are why this")
    out.append("-- section exists rather than being forgotten.")
    for country, field, old, new, notes in CORRECTIONS:
        out.append(f"""
INSERT INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
  SELECT c.id, {q(field)}, {q(old)}, {q(new)}, '{CHANGED_ON}', 'correction',
         (SELECT {field.replace('_status', '_source')} FROM country_headline_facts WHERE country_id = c.id)
    FROM countries c WHERE c.name_en = {q(country)};""")
        for lang in LANGS:
            out.append(
                f"INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)\n"
                f"  SELECT h.id, '{lang}', {q(notes[lang])} FROM fact_history h\n"
                f"    JOIN countries c ON c.id = h.country_id\n"
                f"   WHERE c.name_en = {q(country)} AND h.field = {q(field)}\n"
                f"     AND h.old_value = {q(old)} AND h.new_value = {q(new)};")

    primary_before = 0
    out.append(f"""
-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM source_hosts = {340 + len(NEW_HOSTS)}
-- ASSERT: SELECT count(*) FROM fact_history WHERE changed_on = '{CHANGED_ON}' = {len(CORRECTIONS)}
-- ASSERT: SELECT count(*) FROM fact_history_notes = {24 + len(CORRECTIONS) * len(LANGS)}
-- ASSERT: SELECT archiving_years FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Latvia') = 5
-- ASSERT: SELECT b2c_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Uzbekistan') = 'active'
-- ASSERT: SELECT signature_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Egypt') = 'conditional'
-- ASSERT: SELECT b2c_date FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Jordan') = NULL

-- THE POINT OF THE EXERCISE. Of these fifty facts, 46 now cite the
-- jurisdiction's own authority or an official institution. The four that
-- do not are Korea's B2C and retention and Vietnam's retention and
-- signature -- every one of them a publisher we can at least name, and
-- every one named in the header rather than rounded up.
-- ASSERT: SELECT count(*) FROM cited_sources cs JOIN source_hosts sh ON sh.host = cs.host JOIN countries c ON c.id = cs.row_id WHERE cs.kind LIKE 'headline_fact%' AND c.name_en IN ({", ".join(q(c) for c in countries)}) AND sh.tier IN ('primary','institutional') = 46

-- NO COUNTRY IN THIS TEN IS ENTIRELY SECONDARY ANY MORE, which is the
-- condition that put them on the list in the first place.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT c.id FROM cited_sources cs JOIN source_hosts sh ON sh.host = cs.host JOIN countries c ON c.id = cs.row_id WHERE cs.kind LIKE 'headline_fact%' AND c.name_en IN ({", ".join(q(c) for c in countries)}) GROUP BY c.id HAVING sum(sh.tier IN ('primary','institutional')) = 0) = 0
""")

    path = os.path.join(HERE, "620_ten_countries_own_authority.sql")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out) + "\n")
    print(f"{path}: {len(FACTS)} facts, {len(NEW_HOSTS)} new hosts, "
          f"{len(CORRECTIONS)} corrections")


if __name__ == "__main__":
    main()
