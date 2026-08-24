"""Translate the titles and descriptions of the static pages.

Run:  python3 migrations/gen_static_page_meta.py
Writes: nothing to D1 — patches i18n/*.json only, and wires the pages.

Dan chose "translate them properly" over shipping the structural half
first, 24 August 2026.

THE PROBLEM THIS CLOSES. Eleven static pages have fully translated
bodies -- 64 data-i18n keys on the mandate-types explainer alone -- and
an English <title>, an English meta description and <html lang="en"> in
every language. Those three are what a search engine reads before it
reads a word of the page, so a German reader saw German copy inside a
document that described itself, to every machine that asked, as English.

WHY THERE IS NO MIGRATION. Same reason as gen_country_names.py: these
strings have no D1 consumer. The static pages are assets and cannot
query the database for their own titles, so the i18n JSON is the source
of truth and this generator plus a test is what keeps it complete.
Writing a translations row nothing reads would be a second home for a
fact, which is the drift this project keeps paying for.

THE CTC WHITEPAPER IS NOT HERE, deliberately. It already ships as four
separate files with their own translated titles and a correct
reciprocal hreflang cluster -- it is the one thing on the site that was
always doing this properly. Its pages carry data-lang-mode="files" so
the loader leaves their canonical alone.
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
I18N = os.path.join(REPO, "i18n")
LANGS = ["en", "de", "fr", "es"]

# page key -> file, then title/description per language. The key is what
# the page declares as data-page.
PAGES = {
    # NOTE ON WHAT IS ABSENT. index.html and the ROI whitepaper load no
    # i18n loader at all -- their bodies are English only -- so a
    # translated title there would describe an English page, and an
    # hreflang cluster would advertise ?lang= URLs that return the same
    # English document. Both were briefly given one by an earlier run of
    # this generator; unwire_pages() below takes it back off.
    "tracker": {
        "file": "einvoicing-compliance-tracker.html",
        "ns": "",
        "title": {
            "en": "The E-Invoicing Compliance Corner",
            "de": "The E-Invoicing Compliance Corner",
            "fr": "The E-Invoicing Compliance Corner",
            "es": "The E-Invoicing Compliance Corner",
        },
        "description": {
            "en": "Track e-invoicing mandates and compliance deadlines across 70 countries, updated monthly.",
            "de": "E-Invoicing-Pflichten und Compliance-Fristen in 70 Ländern verfolgen, monatlich aktualisiert.",
            "fr": "Suivez les obligations de facturation électronique et les échéances de conformité dans 70 pays, mis à jour chaque mois.",
            "es": "Siga los mandatos de facturación electrónica y los plazos de cumplimiento en 70 países, con actualización mensual.",
        },
    },
    "mandate-types": {
        "file": "education-mandate-types.html",
        "ns": "edu-mandate-types",
        "title": {
            "en": "Types of Mandate — 7 E-Invoicing Compliance Models Explained",
            "de": "Mandatstypen — die 7 E-Invoicing-Compliance-Modelle erklärt",
            "fr": "Types de mandat — les 7 modèles de conformité e-invoicing expliqués",
            "es": "Tipos de mandato — los 7 modelos de cumplimiento de facturación electrónica",
        },
        "description": {
            "en": "The seven e-invoicing compliance models explained: post-audit, real-time reporting, clearance, centralised platforms and Peppol-based networks — and how to tell which one applies to you.",
            "de": "Die sieben E-Invoicing-Compliance-Modelle erklärt: Post-Audit, Echtzeitmeldung, Clearing, zentrale Plattformen und Peppol-Netze — und woran Sie erkennen, welches für Sie gilt.",
            "fr": "Les sept modèles de conformité expliqués : post-audit, déclaration en temps réel, clearance, plateformes centralisées et réseaux Peppol — et comment savoir lequel vous concerne.",
            "es": "Los siete modelos de cumplimiento explicados: post-auditoría, declaración en tiempo real, clearance, plataformas centralizadas y redes Peppol, y cómo saber cuál le aplica.",
        },
    },
    "impact-of-mandate": {
        "file": "education-impact-of-mandate.html",
        "ns": "edu-impact-of-mandate",
        "title": {
            "en": "Impact of an E-Invoicing Mandate — Technical, Financial & Organisational",
            "de": "Auswirkungen einer E-Invoicing-Pflicht — technisch, finanziell, organisatorisch",
            "fr": "Impact d'un mandat de facturation électronique — technique, financier et organisationnel",
            "es": "Impacto de un mandato de facturación electrónica — técnico, financiero y organizativo",
        },
        "description": {
            "en": "What an e-invoicing mandate actually changes: technical integration, data residency, financial impact, and the organisational readiness most compliance teams underestimate.",
            "de": "Was eine E-Invoicing-Pflicht tatsächlich verändert: technische Integration, Datenresidenz, finanzielle Folgen und die organisatorische Bereitschaft, die die meisten Teams unterschätzen.",
            "fr": "Ce qu'un mandat change réellement : intégration technique, résidence des données, impact financier et la préparation organisationnelle que la plupart des équipes sous-estiment.",
            "es": "Lo que un mandato cambia realmente: integración técnica, residencia de datos, impacto financiero y la preparación organizativa que casi todos los equipos subestiman.",
        },
    },
    "preparing-for-mandate": {
        "file": "education-preparing-for-mandate.html",
        "ns": "edu-preparing-for-mandate",
        "title": {
            "en": "Preparing for an E-Invoicing Mandate — Timeline & Vendor Selection Guide",
            "de": "Vorbereitung auf eine E-Invoicing-Pflicht — Zeitplan und Anbieterauswahl",
            "fr": "Se préparer à un mandat de facturation électronique — calendrier et choix du prestataire",
            "es": "Prepararse para un mandato de facturación electrónica — calendario y elección de proveedor",
        },
        "description": {
            "en": "How to prepare for a new e-invoicing mandate: who to involve, a realistic 12–18 month timeline, and a step-by-step vendor selection process.",
            "de": "So bereiten Sie sich auf eine neue E-Invoicing-Pflicht vor: wen Sie einbinden, ein realistischer Zeitplan über 12–18 Monate und ein schrittweiser Auswahlprozess für Anbieter.",
            "fr": "Comment se préparer à un nouveau mandat : qui impliquer, un calendrier réaliste de 12 à 18 mois et un processus de sélection du prestataire étape par étape.",
            "es": "Cómo prepararse para un nuevo mandato: a quién implicar, un calendario realista de 12 a 18 meses y un proceso paso a paso para elegir proveedor.",
        },
    },
    "types-of-provider": {
        "file": "education-types-of-provider.html",
        "ns": "edu-types-of-provider",
        "title": {
            "en": "Types of E-Invoicing Provider — ERP, Solution, Tax & Consultancy Compared",
            "de": "Anbietertypen im E-Invoicing — ERP, Lösung, Steuern und Beratung im Vergleich",
            "fr": "Types de prestataires e-invoicing — ERP, solution, fiscalité et conseil comparés",
            "es": "Tipos de proveedor de facturación electrónica — ERP, solución, fiscal y consultoría",
        },
        "description": {
            "en": "The five categories of e-invoicing provider explained — ERP, Solution Provider, Tax Compliance, Technology and Consultancy — with a side-by-side comparison.",
            "de": "Die fünf Kategorien von E-Invoicing-Anbietern erklärt — ERP, Lösungsanbieter, Steuer-Compliance, Technologie und Beratung — mit direktem Vergleich.",
            "fr": "Les cinq catégories de prestataires expliquées — ERP, éditeur de solution, conformité fiscale, technologie et conseil — avec un comparatif côte à côte.",
            "es": "Las cinco categorías de proveedor explicadas — ERP, proveedor de solución, cumplimiento fiscal, tecnología y consultoría — con una comparativa directa.",
        },
    },
    "certified-providers": {
        "file": "education-certified-providers.html",
        "ns": "edu-certified-providers",
        "title": {
            "en": "Government Certified E-Invoicing Providers — Official Registries by Country",
            "de": "Staatlich zertifizierte E-Invoicing-Anbieter — amtliche Register nach Ländern",
            "fr": "Prestataires e-invoicing certifiés — registres officiels par pays",
            "es": "Proveedores de facturación electrónica certificados — registros oficiales por país",
        },
        "description": {
            "en": "Direct links to official government registries of accredited e-invoicing service providers — ASP, PAC, OSE, GSP and Peppol Access Points — verified country by country.",
            "de": "Direkte Links zu amtlichen Registern akkreditierter E-Invoicing-Dienstleister — ASP, PAC, OSE, GSP und Peppol Access Points — Land für Land geprüft.",
            "fr": "Liens directs vers les registres officiels de prestataires accrédités — ASP, PAC, OSE, GSP et points d'accès Peppol — vérifiés pays par pays.",
            "es": "Enlaces directos a los registros oficiales de proveedores acreditados — ASP, PAC, OSE, GSP y puntos de acceso Peppol — verificados país por país.",
        },
    },
    "subscribe": {
        "file": "subscribe.html",
        "ns": "subscribe",
        "title": {
            "en": "Subscribe — The E-Invoicing Compliance Corner",
            "de": "Abonnieren — The E-Invoicing Compliance Corner",
            "fr": "S'abonner — The E-Invoicing Compliance Corner",
            "es": "Suscribirse — The E-Invoicing Compliance Corner",
        },
        "description": {
            "en": "Get notified when a government changes its e-invoicing rules. Monthly compliance updates across 70 countries, tailored to the jurisdictions you actually operate in.",
            "de": "Werden Sie benachrichtigt, wenn ein Staat seine E-Invoicing-Regeln ändert. Monatliche Compliance-Updates aus 70 Ländern, zugeschnitten auf Ihre Märkte.",
            "fr": "Soyez averti lorsqu'un État modifie ses règles de facturation électronique. Mises à jour mensuelles sur 70 pays, adaptées aux juridictions où vous opérez.",
            "es": "Reciba aviso cuando un país cambie sus normas de facturación electrónica. Novedades mensuales sobre 70 países, ajustadas a sus jurisdicciones.",
        },
    },
    "feedback": {
        "file": "feedback.html",
        "ns": "feedback",
        "title": {
            "en": "Feedback — The E-Invoicing Compliance Corner",
            "de": "Feedback — The E-Invoicing Compliance Corner",
            "fr": "Commentaires — The E-Invoicing Compliance Corner",
            "es": "Comentarios — The E-Invoicing Compliance Corner",
        },
        "description": {
            "en": "Spot a gap, an outdated date or a broken link on The E-Invoicing Compliance Corner? Let us know.",
            "de": "Eine Lücke, ein veraltetes Datum oder einen defekten Link entdeckt? Sagen Sie uns Bescheid.",
            "fr": "Vous avez repéré une lacune, une date périmée ou un lien mort ? Dites-le-nous.",
            "es": "¿Ha detectado una laguna, una fecha desfasada o un enlace roto? Díganoslo.",
        },
    },
    "privacy": {
        "file": "privacy-policy.html",
        "ns": "privacy-policy",
        "title": {
            "en": "Privacy Policy — The E-Invoicing Compliance Corner",
            "de": "Datenschutzerklärung — The E-Invoicing Compliance Corner",
            "fr": "Politique de confidentialité — The E-Invoicing Compliance Corner",
            "es": "Política de privacidad — The E-Invoicing Compliance Corner",
        },
        "description": {
            "en": "How The E-Invoicing Compliance Corner collects, uses and protects your data, including subscriber information and site analytics.",
            "de": "Wie The E-Invoicing Compliance Corner Ihre Daten erhebt, nutzt und schützt — einschließlich Abonnentendaten und Website-Analyse.",
            "fr": "Comment The E-Invoicing Compliance Corner collecte, utilise et protège vos données, y compris les informations d'abonné et les statistiques du site.",
            "es": "Cómo The E-Invoicing Compliance Corner recopila, usa y protege sus datos, incluida la información de suscriptor y la analítica del sitio.",
        },
    },
}

# Separate files per language, so the loader must not rewrite their
# canonical or redirect between them.
FILE_PER_LANGUAGE = [
    "whitepaper-ctc-rollouts-compared.html",
    "whitepaper-ctc-rollouts-compared-de.html",
    "whitepaper-ctc-rollouts-compared-fr.html",
    "whitepaper-ctc-rollouts-compared-es.html",
]

ORIGIN = "https://e-invoicingcompliancecorner.com"


def check():
    problems = []
    for key, page in PAGES.items():
        path = os.path.join(REPO, page["file"])
        if not os.path.exists(path):
            problems.append(f"{key}: {page['file']} does not exist")
        for field in ("title", "description"):
            for lang in LANGS:
                v = page[field].get(lang)
                if not v:
                    problems.append(f"{key}.{field}: no {lang}")
                elif field == "description" and len(v) > 220:
                    # Search engines truncate well before this. Past it the
                    # tail is written for nobody.
                    problems.append(f"{key}.{field}/{lang}: {len(v)} chars, too long to be shown")
    if problems:
        raise SystemExit("REFUSING TO GENERATE:\n  " + "\n  ".join(problems))


def patch_i18n():
    """Write each page's meta into the i18n file that page actually loads.

    THE FILE MATTERS, and it is not obvious. i18n.js reads
    `i18n/<lang>.json` by default but `i18n/<lang>-<namespace>.json` when
    the page's script tag declares data-namespace -- which eight of these
    nine do. Writing everything into the main file, as the first version
    of this generator did, produced a German page with a German <html
    lang> and an English title, because applyHead() was looking in a file
    the page had never loaded. Nothing failed; the words simply did not
    change.
    """
    written = {}
    for key, page in PAGES.items():
        ns = page.get("ns", "")
        for lang in LANGS:
            name = f"{lang}-{ns}.json" if ns else f"{lang}.json"
            path = os.path.join(I18N, name)
            if not os.path.exists(path):
                raise SystemExit(f"REFUSING: {page['file']} loads {name}, which does not exist")
            with open(path, encoding="utf-8") as fh:
                doc = json.load(fh)
            pages = doc.setdefault("pages", {})
            pages[key] = {"title": page["title"][lang], "description": page["description"][lang]}
            doc["pages"] = {k: pages[k] for k in sorted(pages)}
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(doc, fh, ensure_ascii=False, indent=2)
                fh.write("\n")
            written[name] = written.get(name, 0) + 1
    for name in sorted(written):
        print(f"  i18n/{name}: {written[name]} page meta")


def unwire_pages():
    """Take the wiring back off pages that cannot use it.

    index.html and the ROI whitepaper load no i18n loader, so their
    bodies are English in every language. An hreflang cluster on them
    advertises ?lang=de URLs that serve the same English document --
    which is worse than saying nothing, because it invites a crawler to
    index four addresses for one page. An earlier run of this generator
    added exactly that; this removes it.
    """
    for file_name in ("index.html", "whitepaper-einvoicing-roi-evidence.html"):
        path = os.path.join(REPO, file_name)
        with open(path, encoding="utf-8") as fh:
            html = fh.read()
        before = html
        html = re.sub(r'\n<link rel="alternate" hreflang="[^"]*" href="[^"]*">', "", html)
        html = re.sub(r'\s*data-page="[^"]*"', "", html)
        if html != before:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(html)
            print(f"  {file_name}: hreflang and data-page removed (no i18n loader)")


def hreflang_block(file_name):
    """The cluster for a ?lang= page: four variants plus x-default.

    EXTENSIONLESS, because that is the address that answers 200. Verified
    24 August 2026: /education-mandate-types returns 200 and
    /education-mandate-types.html returns a 307 to it. A canonical
    pointing at the .html form names a URL that redirects -- and a 307 is
    TEMPORARY, which tells Google not to consolidate signals onto the
    target at all. So every one of these pages was canonicalising to an
    address search engines are told to treat as provisional.
    """
    # THE TRACKER IS SERVED AT THE ROOT (25 August 2026) and canonicalises
    # to it, so its cluster is `/`, `/?lang=de` and so on -- not the
    # extensionless slug this function derives for everything else. Named
    # here rather than left to the caller because this function is the
    # only thing that knows what a cluster looks like, and the version it
    # would otherwise emit contradicts the canonical two lines above it in
    # the file it writes into.
    base = ORIGIN + "/" if file_name == "einvoicing-compliance-tracker.html" \
        else f"{ORIGIN}/{file_name}".replace(".html", "")
    lines = [f'<link rel="alternate" hreflang="{l}" href="{base}{"" if l == "en" else f"?lang={l}"}">'
             for l in LANGS]
    lines.append(f'<link rel="alternate" hreflang="x-default" href="{base}">')
    return "\n".join(lines)


def patch_pages():
    for key, page in PAGES.items():
        path = os.path.join(REPO, page["file"])
        with open(path, encoding="utf-8") as fh:
            html = fh.read()
        before = html
        # 1. the page names itself, so the loader knows which title is its
        if 'data-page="' not in html:
            html = re.sub(r"<body([^>]*)>", rf'<body\1 data-page="{key}">', html, count=1)
        # 2. its hreflang cluster, right after the canonical
        if 'rel="alternate" hreflang' not in html:
            html = re.sub(r'(<link rel="canonical"[^>]*>)',
                          r"\1\n" + hreflang_block(page["file"]), html, count=1)
        if html != before:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(html)
            print(f"  {page['file']}: wired")

    for file_name in FILE_PER_LANGUAGE:
        path = os.path.join(REPO, file_name)
        with open(path, encoding="utf-8") as fh:
            html = fh.read()
        if 'data-lang-mode' in html:
            continue
        html = re.sub(r"<body([^>]*)>", r'<body\1 data-lang-mode="files">', html, count=1)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(html)
        print(f"  {file_name}: marked as file-per-language")


if __name__ == "__main__":
    check()
    patch_i18n()
    patch_pages()
    unwire_pages()
