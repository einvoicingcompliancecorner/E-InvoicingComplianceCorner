"""Generate migration 637 — the specification register's twenty rows.

Run:  python3 migrations/gen_spec_register.py
Writes: migrations/637_spec_register_facts.sql

Dan, 24 August 2026: "Yes, I think this would be good value-add for a
subscriber" — on the finding that the capturable product here is not a
validator but the register of what each country's specification IS.

WHAT DECIDED THE SCOPE. Dan asked for "tier 1 only, where artefacts are
open". Researching it moved the line: of twenty jurisdictions,
exactly TWO publish machine-readable artefacts under a named licence —
Germany (Apache-2.0) and the Netherlands (MIT). Croatia comes closest
after them and still does not qualify: its terms are an explicit
permission to reuse with no licence name attached. The rest publish
openly on terms that are unstated, unknown, or — in Peppol's case —
explicitly restrictive. So 'tier 1' is not a property a country has;
it is three separate facts that are usually collapsed, and the schema
keeps them apart (see 636).

WHY THE NINE THAT FALL SHORT ARE HERE ANYWAY. A register that silently omits
Italy, Romania and Turkey reads as though those countries mandate
nothing. They mandate a great deal; what they do not do is publish it
in a form anyone can build against, and saying so precisely — with the
reason — is the most valuable row in the table. Those rows carry no
artefacts and their capture_status says why. This is the same
discipline as `unknown` on the headline facts: a stored reason beats a
blank.

THE RESEARCH IS THE SOURCE. Every field was read from a primary
source — the authority, the ministry, the Peppol Authority, or the
official repository — on 24 August 2026, except where a field is left
NULL precisely because it could not be confirmed. Nothing here is
inferred from a vendor summary. Where a publisher blocked us, the row
says 'unreachable' rather than guessing, and that is a claim about our
access, not about their diligence.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
LANGS = ["en", "de", "fr", "es"]
CAP = 220
VERIFIED = "2026-08-24"

# code -> (capture_status, format_name, format_version, syntax, is_en16931,
#          governance, licence, licence_status, access,
#          version_released, mandatory_from, changelog_url, validator_url)
SPEC = {
    "DE": ("published", "XRechnung", "3.0.2", "multiple", "yes",
           "KoSIT (Koordinierungsstelle für IT-Standards)", "Apache-2.0", "named", "open",
           "2024-06-20", None, "https://xeinkauf.de/xrechnung/versionen-und-bundles/", None),
    "NL": ("published", "SI-UBL 2.0 (NLCIUS)", "2.0.3.13", "ubl", "yes",
           "Nederlandse Peppolautoriteit / Logius", "MIT", "named", "open",
           "2025-11-27", "2026-02-23",
           "https://www.peppolautoriteit.nl/actueel/nieuws", None),
    "HR": ("published", "eRačun (Fiskalizacija 2.0)", "1.3", "multiple", "yes",
           "Porezna uprava", None, "permissive_unnamed", "open",
           "2025-06-20", None,
           "https://porezna.gov.hr/fiskalizacija/bezgotovinski-racuni/bezgotovinski-racuni-novosti", None),
    "DK": ("published", "OIOUBL 2.1", "1.17.1", "ubl", "yes",
           "Erhvervsstyrelsen", None, "unknown", "open",
           "2026-02-19", "2026-05-15",
           "https://nemhandel.dk/oioubl-21-schematron-version-1171",
           "https://oioubl.nemhandel.dk/validation"),
    "NO": ("published", "EHF Billing 3.0", "3.0.3", "ubl", "yes",
           "DFØ (Direktoratet for forvaltning og økonomistyring)", None, "unknown", "open",
           "2026-08-13", None,
           "https://anskaffelser.dev/postaward/g3/spec/current/billing-3.0/norway/",
           "https://anskaffelser.dev/service/validator/"),
    "BE": ("published", "Peppol BIS Billing 3.0", "3.0.21", "ubl", "yes",
           "OpenPeppol AISBL", None, "restrictive", "open",
           "2026-05-20", "2026-08-17",
           "https://docs.peppol.eu/poacc/billing/3.0/release-notes/", None),
    "SE": ("published", "Peppol BIS Billing 3.0", "3.0.21", "ubl", "yes",
           "OpenPeppol AISBL", None, "restrictive", "open",
           "2026-05-20", "2026-08-17",
           "https://docs.peppol.eu/poacc/billing/3.0/release-notes/", None),
    "JP": ("published", "JP PINT", "1.1.2", "ubl", "yes",
           "OpenPeppol AISBL / Digital Agency", None, "restrictive", "open",
           "2025-11-17", None,
           "https://docs.peppol.eu/poac/jp/pint-jp/release-notes/", None),
    "AU": ("published", "PINT A-NZ", "1.1.2", "ubl", "yes",
           "OpenPeppol AISBL / ATO", None, "restrictive", "open",
           "2025-11-21", None,
           "https://docs.peppol.eu/poac/aunz/pint-aunz/release-notes/", None),
    "NZ": ("published", "PINT A-NZ", "1.1.2", "ubl", "yes",
           "OpenPeppol AISBL / MBIE", None, "restrictive", "open",
           "2025-11-21", None,
           "https://docs.peppol.eu/poac/aunz/pint-aunz/release-notes/", None),
    "SG": ("published", "PINT SG", "1.4.0", "ubl", "yes",
           "OpenPeppol AISBL / IMDA", None, "restrictive", "open",
           "2025-11-28", None,
           "https://docs.peppol.eu/poac/sg/pint-sg/specialized-release-notes/", None),
    "FR": ("partial", "Spécifications externes B2B / Factur-X", "3.2", "multiple", "yes",
           "DGFiP / AIFE, with Factur-X by FNFE-MPE", None, "unstated", "registration",
           "2026-04-30", None,
           "https://www.impots.gouv.fr/specifications-externes-b2b", None),
    "IT": ("partial", "FatturaPA", "1.9.1", "national_xml", "no",
           "Agenzia delle Entrate", None, "unstated", "open",
           None, "2026-05-15", None, None),
    "PL": ("partial", "KSeF FA(3)", "v1-0", "national_xml", "no",
           "Ministerstwo Finansów", None, "unstated", "open",
           None, None, None, None),
    "ES": ("partial", "Facturae / Veri*Factu", "Facturae 3.2.2", "multiple", "no",
           "AEAT / Ministerio de Economía", None, "unstated", "open",
           None, None, None, None),
    "FI": ("partial", "Finvoice", "3.0", "national_xml", "yes",
           "Finanssiala ry (a private banking association)", None, "unstated", "open",
           "2025-09-16", None,
           "https://www.finanssiala.fi/en/topics/finvoice-standard/", None),
    "RO": ("unpublished", "RO_CIUS", "1.0.1", "ubl", "yes",
           "Ministerul Finanțelor / ANAF", None, "unstated", "open",
           "2021-11-05", None, None, None),
    "TR": ("unreachable", "UBL-TR", None, "national_xml", "no",
           "Gelir İdaresi Başkanlığı (GİB)", None, "unknown", "blocked",
           None, None, None, None),
    "PT": ("unreachable", "CIUS-PT", "1.5.2", "ubl", "yes",
           "eSPap", None, "unknown", "blocked",
           "2021-07-22", None, None, None),
    "IE": ("not_yet", None, None, "unknown", "yes",
           "Revenue Commissioners", None, "unknown", "none",
           None, None, None, None),
}

# code -> [(kind, url, publisher), ...]  in display order
ARTEFACTS = {
    "DE": [
        ("schematron", "https://github.com/itplr-kosit/xrechnung-schematron", "KoSIT"),
        ("sdk", "https://github.com/itplr-kosit/validator", "KoSIT"),
        ("testsuite", "https://github.com/itplr-kosit/xrechnung-testsuite", "KoSIT"),
        ("spec_pdf", "https://xeinkauf.de/xrechnung/", "KoSIT / xeinkauf.de"),
    ],
    "NL": [
        ("schematron", "https://github.com/peppolautoriteit-nl/validation", "Nederlandse Peppolautoriteit"),
        ("repo", "https://github.com/peppolautoriteit-nl/publications", "Nederlandse Peppolautoriteit"),
    ],
    "HR": [
        ("xsd", "https://porezna.gov.hr/fiskalizacija/api/dokumenti/175", "Porezna uprava"),
        ("xsd", "https://porezna.gov.hr/fiskalizacija/api/dokumenti/187", "Porezna uprava"),
        ("spec_pdf", "https://fiskalizacija2.hr/wp-content/uploads/2025/07/Tehnicka_specifikacija_Fiskalizacija_eRacuna_i_eIzvjestavanje.pdf", "Porezna uprava"),
    ],
    "DK": [
        ("schematron", "https://nemhandel.dk/oioubl-21-schematron-version-1171", "Erhvervsstyrelsen"),
    ],
    "NO": [
        ("schematron", "https://github.com/anskaffelser/ehf-postaward-g3", "DFØ"),
        ("sdk", "https://github.com/anskaffelser/vefa-validator", "DFØ"),
        ("spec_pdf", "https://anskaffelser.dev/postaward/g3/spec/current/billing-3.0/norway/", "DFØ"),
    ],
    "BE": [
        ("schematron", "https://github.com/OpenPEPPOL/peppol-bis-invoice-3", "OpenPeppol AISBL"),
        ("spec_pdf", "https://docs.peppol.eu/poacc/billing/3.0/bis/", "OpenPeppol AISBL"),
    ],
    "SE": [
        ("schematron", "https://github.com/OpenPEPPOL/peppol-bis-invoice-3", "OpenPeppol AISBL"),
        ("spec_pdf", "https://docs.peppol.eu/poacc/billing/3.0/bis/", "OpenPeppol AISBL"),
    ],
    "JP": [
        ("xsd", "https://docs.peppol.eu/poac/jp/pint-jp/resources.zip", "OpenPeppol AISBL"),
        ("spec_pdf", "https://docs.peppol.eu/poac/jp/pint-jp/bis/", "OpenPeppol AISBL"),
    ],
    "AU": [
        ("xsd", "https://docs.peppol.eu/poac/aunz/pint-aunz/resources.zip", "OpenPeppol AISBL"),
        ("spec_pdf", "https://docs.peppol.eu/poac/aunz/pint-aunz/bis/", "OpenPeppol AISBL"),
    ],
    "NZ": [
        ("xsd", "https://docs.peppol.eu/poac/aunz/pint-aunz/resources.zip", "OpenPeppol AISBL"),
        ("spec_pdf", "https://docs.peppol.eu/poac/aunz/pint-aunz/bis/", "OpenPeppol AISBL"),
    ],
    "SG": [
        ("xsd", "https://docs.peppol.eu/poac/sg/pint-sg/resources.zip", "OpenPeppol AISBL"),
        ("spec_pdf", "https://docs.peppol.eu/poac/sg/pint-sg/bis/", "OpenPeppol AISBL"),
    ],
    "FR": [
        ("spec_pdf", "https://www.impots.gouv.fr/specifications-externes-b2b", "DGFiP / AIFE"),
        ("schematron", "https://fnfe-mpe.org/factur-x/factur-x_en/", "FNFE-MPE"),
    ],
    "IT": [
        ("xsd", "https://www.fatturapa.gov.it/it/norme-e-regole/documentazione-fattura-elettronica/formato-fatturapa/", "Agenzia delle Entrate"),
    ],
    "PL": [
        ("xsd", "https://ksef.podatki.gov.pl/media/ukrllh1e/schemat_fa_vat-3-_v1-0.xsd", "Ministerstwo Finansów"),
    ],
    "ES": [
        ("xsd", "https://www.facturae.gob.es/formato/Paginas/version-3-2.aspx", "Ministerio de Economía"),
    ],
    "FI": [
        ("xsd", "https://www.finanssiala.fi/en/topics/finvoice-standard/", "Finanssiala ry"),
        ("spec_pdf", "https://file.finanssiala.fi/finvoice/Finvoice_3_0_implementation_guidelines.pdf", "Finanssiala ry"),
    ],
    "RO": [
        ("spec_pdf", "https://mfinante.gov.ro/documents/35673/1120722/ordin1366_MO10658112021.pdf", "Ministerul Finanțelor"),
    ],
    "TR": [],
    "PT": [],
    "IE": [],
}

# THE COLUMN THE REGISTER EXISTS FOR. Everything else can be read off a
# page in an afternoon; this is the finding. Kept under CAP characters
# in every language because it renders as a paragraph in a card.
GAP = {
    "DE": {
        "en": "The federal receipt platforms (ZRE and OZG-RE) apply their own routing and registration checks when an invoice arrives. Only the schema and the Schematron are published.",
        "de": "Die Empfangsplattformen des Bundes (ZRE, OZG-RE) prüfen beim Eingang zusätzlich Routing und Registrierung. Veröffentlicht sind nur Schema und Schematron.",
        "fr": "Les plateformes fédérales de réception (ZRE, OZG-RE) appliquent leurs propres contrôles de routage et d'enregistrement. Seuls le schéma et le Schematron sont publiés.",
        "es": "Las plataformas federales de recepción (ZRE, OZG-RE) aplican sus propios controles de enrutamiento y registro. Solo se publican el esquema y el Schematron.",
    },
    "NL": {
        "en": "There is no domestic B2B mandate, so nothing is enforced beyond the B2G Peppol route, where a government access point may still apply acceptance checks of its own.",
        "de": "Es gibt keine nationale B2B-Pflicht; durchgesetzt wird nur der B2G-Peppol-Weg, wo ein staatlicher Access Point eigene Annahmeprüfungen anwenden kann.",
        "fr": "Il n'existe aucune obligation B2B nationale : seule la voie B2G Peppol est appliquée, où un point d'accès public peut ajouter ses propres contrôles d'acceptation.",
        "es": "No existe mandato B2B nacional: solo se aplica la vía B2G Peppol, donde un punto de acceso público puede añadir sus propios controles de aceptación.",
    },
    "HR": {
        "en": "Access-point conformance testing and FiskAplikacija onboarding must both be passed before an invoice is accepted, and neither process is described in the schema files.",
        "de": "Vor der Annahme müssen Access-Point-Konformitätstests und das FiskAplikacija-Onboarding bestanden werden; beides ist in den Schemadateien nicht beschrieben.",
        "fr": "Les tests de conformité du point d'accès et l'enrôlement FiskAplikacija doivent être franchis avant acceptation ; ni l'un ni l'autre ne figure dans les schémas.",
        "es": "Antes de aceptar una factura hay que superar las pruebas de conformidad del punto de acceso y el alta en FiskAplikacija; ninguna consta en los esquemas.",
    },
    "DK": {
        "en": "Denmark consulted in March 2026 on retiring OIOUBL for Peppol BIS 4 by around 2029; the successor rules are not published. The licence terms are not stated either.",
        "de": "Dänemark hat im März 2026 zur Ablösung von OIOUBL durch Peppol BIS 4 bis etwa 2029 konsultiert; die Nachfolgeregeln fehlen. Auch Lizenzbedingungen fehlen.",
        "fr": "Le Danemark a consulté en mars 2026 sur l'abandon d'OIOUBL au profit de Peppol BIS 4 vers 2029 ; les règles successeurs ne sont pas publiées, ni les licences.",
        "es": "Dinamarca consultó en marzo de 2026 sobre sustituir OIOUBL por Peppol BIS 4 hacia 2029; las reglas sucesoras no están publicadas, ni los términos de licencia.",
    },
    "NO": {
        "en": "The format itself is fully public. The 2027 B2B mandate's detailed rules are delegated to a regulation (forskrift) that has not yet been issued.",
        "de": "Das Format selbst ist vollständig öffentlich. Die Detailregeln der B2B-Pflicht 2027 sind einer Verordnung (forskrift) überlassen, die noch nicht vorliegt.",
        "fr": "Le format lui-même est entièrement public. Les règles détaillées de l'obligation B2B de 2027 sont renvoyées à un règlement (forskrift) non encore publié.",
        "es": "El formato en sí es totalmente público. Las reglas detalladas del mandato B2B de 2027 se remiten a un reglamento (forskrift) que aún no se ha publicado.",
    },
    "BE": {
        "en": "The royal decree lets two parties agree an alternative EN 16931 format between them. The audit criteria for that opt-out are legal text, not part of any artefact.",
        "de": "Der Königliche Erlass erlaubt zwei Parteien, ein alternatives EN-16931-Format zu vereinbaren. Die Prüfkriterien dafür sind Rechtstext, kein Artefakt.",
        "fr": "L'arrêté royal permet à deux parties de convenir d'un autre format EN 16931. Les critères de contrôle de cette option sont un texte juridique, pas un artefact.",
        "es": "El real decreto permite a dos partes pactar otro formato EN 16931. Los criterios de control de esa excepción son texto jurídico, no forman parte de artefacto alguno.",
    },
    "SE": {
        "en": "There is no Swedish artefact of its own: rules such as SE-R-011 sit inside the core Peppol rule set. Agency onboarding requirements are published separately, if at all.",
        "de": "Es gibt kein eigenes schwedisches Artefakt: Regeln wie SE-R-011 stehen im Peppol-Kernregelwerk. Onboarding-Anforderungen der Behörden erscheinen gesondert, wenn überhaupt.",
        "fr": "Il n'existe pas d'artefact suédois propre : des règles comme SE-R-011 figurent dans le socle Peppol. Les exigences d'enrôlement des agences sont publiées à part, voire pas.",
        "es": "No hay artefacto sueco propio: reglas como SE-R-011 están en el núcleo Peppol. Los requisitos de alta de cada organismo se publican aparte, si es que se publican.",
    },
    "JP": {
        "en": "Japan mandates no format at all — JP PINT is voluntary and the Qualified Invoice System governs content, not syntax. Peppol accreditation is governance, not schema.",
        "de": "Japan schreibt kein Format vor: JP PINT ist freiwillig, das Qualified Invoice System regelt Inhalte, nicht Syntax. Peppol-Akkreditierung ist Governance, kein Schema.",
        "fr": "Le Japon n'impose aucun format : JP PINT est volontaire et le Qualified Invoice System régit le contenu, pas la syntaxe. L'accréditation Peppol relève de la gouvernance.",
        "es": "Japón no impone formato alguno: JP PINT es voluntario y el Qualified Invoice System regula el contenido, no la sintaxis. La acreditación Peppol es gobernanza, no esquema.",
    },
    "AU": {
        "en": "The ATO's scope rules — which entities are covered, and the 30% and automation targets — are procurement policy stated in guidance pages, not encoded in the artefacts.",
        "de": "Die Geltungsregeln der ATO – welche Stellen erfasst sind, die 30-%- und Automatisierungsziele – sind Beschaffungspolitik in Leitfäden, nicht in den Artefakten kodiert.",
        "fr": "Les règles de périmètre de l'ATO — entités concernées, cibles de 30 % et d'automatisation — relèvent de la politique d'achat publiée en guides, non des artefacts.",
        "es": "Las reglas de alcance de la ATO —qué entidades y los objetivos del 30% y de automatización— son política de compras publicada en guías, no van en los artefactos.",
    },
    "NZ": {
        "en": "MBIE's rules for mandated agencies, including paying 95% of e-invoices within five business days, are payment policy rather than anything the schema can express.",
        "de": "Die MBIE-Regeln für verpflichtete Stellen, etwa 95 % der E-Rechnungen binnen fünf Werktagen zu zahlen, sind Zahlungspolitik und im Schema nicht abbildbar.",
        "fr": "Les règles du MBIE pour les agences concernées, dont le paiement de 95 % des e-factures sous cinq jours ouvrés, relèvent du paiement, non de ce que le schéma exprime.",
        "es": "Las reglas del MBIE para los organismos obligados, como pagar el 95% de las e-facturas en cinco días hábiles, son política de pago, no algo que el esquema exprese.",
    },
    "SG": {
        "en": "The current PINT SG release is still marked draft, and IRAS's turnover-band phase-in running to 2031 is tax policy layered on the network, not part of the artefacts.",
        "de": "Die aktuelle PINT-SG-Fassung gilt noch als Entwurf; die Umsatzstaffelung der IRAS bis 2031 ist Steuerpolitik über dem Netz, nicht Teil der Artefakte.",
        "fr": "La version PINT SG actuelle est encore marquée « draft », et l'entrée en vigueur par tranches de l'IRAS jusqu'en 2031 est fiscale, hors artefacts.",
        "es": "La versión actual de PINT SG sigue marcada como borrador, y la entrada por tramos de facturación de IRAS hasta 2031 es política fiscal, no parte de los artefactos.",
    },
    "FR": {
        "en": "The Factur-X package asks for an email address, and the accreditation test suite every certified platform must pass is not published. Platforms may add checks of their own.",
        "de": "Das Factur-X-Paket verlangt eine E-Mail-Adresse, und die Akkreditierungstests jeder zertifizierten Plattform sind unveröffentlicht. Plattformen prüfen zusätzlich.",
        "fr": "Le package Factur-X demande une adresse e-mail, et la suite de tests d'accréditation que chaque plateforme agréée doit passer n'est pas publiée. Chacune peut ajouter des contrôles.",
        "es": "El paquete Factur-X pide un correo electrónico, y la batería de pruebas de acreditación de cada plataforma homologada no se publica. Cada una puede añadir controles.",
    },
    "IT": {
        "en": "SdI checks VAT-registry validity and routing codes that no schema describes, no Schematron is published, and the test channel needs an Italian digital identity.",
        "de": "Das SdI prüft Registergültigkeit und Empfängercodes, die kein Schema beschreibt; ein Schematron fehlt, und der Testkanal verlangt eine italienische digitale Identität.",
        "fr": "Le SdI contrôle la validité du registre TVA et les codes de routage qu'aucun schéma ne décrit ; aucun Schematron n'est publié et le canal de test exige une identité numérique italienne.",
        "es": "El SdI comprueba la validez del registro de IVA y los códigos de destino que ningún esquema describe; no se publica Schematron y el canal de pruebas exige identidad digital italiana.",
    },
    "PL": {
        "en": "The XSD is structural only. KSeF applies a layer of semantic rejections — identifier cross-checks, duplicates, field dependencies — that no official artefact documents.",
        "de": "Das XSD ist rein strukturell. KSeF wendet semantische Ablehnungen an – Kennungsabgleich, Duplikate, Feldabhängigkeiten –, die kein offizielles Artefakt dokumentiert.",
        "fr": "Le XSD n'est que structurel. KSeF applique des rejets sémantiques — contrôles d'identifiants, doublons, dépendances de champs — qu'aucun artefact officiel ne documente.",
        "es": "El XSD es solo estructural. KSeF aplica rechazos semánticos —cruces de identificadores, duplicados, dependencias entre campos— que ningún artefacto oficial documenta.",
    },
    "ES": {
        "en": "There is no single Spanish specification: Facturae for B2G, Veri*Factu from 2027, the general B2B format still unfinalised, and TicketBAI regionally in the Basque Country.",
        "de": "Es gibt keine einheitliche spanische Spezifikation: Facturae für B2G, Veri*Factu ab 2027, das allgemeine B2B-Format offen und regional TicketBAI im Baskenland.",
        "fr": "Il n'existe pas de spécification espagnole unique : Facturae pour le B2G, Veri*Factu dès 2027, le format B2B général non finalisé, et TicketBAI au Pays basque.",
        "es": "No hay una especificación española única: Facturae para B2G, Veri*Factu desde 2027, el formato B2B general sin cerrar y TicketBAI a nivel regional en el País Vasco.",
    },
    "FI": {
        "en": "Finvoice is governed by a private banking association rather than a public authority, so its roadmap and version decisions go through no public standards process.",
        "de": "Finvoice wird von einem privaten Bankenverband und nicht von einer Behörde verantwortet; Roadmap und Versionsentscheidungen durchlaufen kein öffentliches Normverfahren.",
        "fr": "Finvoice est gouverné par une association bancaire privée et non par une autorité publique : sa feuille de route et ses versions ne suivent aucun processus normatif public.",
        "es": "Finvoice lo gobierna una asociación bancaria privada, no una autoridad pública, así que su hoja de ruta y sus versiones no pasan por ningún proceso normativo público.",
    },
    "RO": {
        "en": "RO_CIUS exists only as prose in a ministerial ordinance. No ANAF-published XSD or Schematron could be found; what the SPV validates lives inside government software.",
        "de": "RO_CIUS existiert nur als Fließtext in einer Ministerialverordnung. Kein XSD oder Schematron der ANAF auffindbar; die Prüfungen des SPV stecken in Behördensoftware.",
        "fr": "RO_CIUS n'existe qu'en texte dans un arrêté ministériel. Aucun XSD ni Schematron publié par l'ANAF n'a été trouvé ; ce que valide le SPV réside dans un logiciel public.",
        "es": "RO_CIUS solo existe como texto en una orden ministerial. No se halló XSD ni Schematron publicado por la ANAF; lo que valida el SPV vive dentro del software estatal.",
    },
    "TR": {
        "en": "GİB blocks automated access to its own technical portal, so we could not read the UBL-TR package or its terms. This records that we could not verify, not that it is absent.",
        "de": "Die GİB sperrt automatisierten Zugriff auf ihr Technikportal; das UBL-TR-Paket und seine Bedingungen blieben ungeprüft. Festgehalten ist: nicht verifizierbar, nicht: fehlend.",
        "fr": "La GİB bloque l'accès automatisé à son portail technique : nous n'avons pu lire ni le package UBL-TR ni ses conditions. Ceci consigne une non-vérification, pas une absence.",
        "es": "La GİB bloquea el acceso automatizado a su portal técnico, así que no pudimos leer el paquete UBL-TR ni sus condiciones. Esto registra que no se pudo verificar, no que falte.",
    },
    "PT": {
        "en": "eSPap could not be reached, and the newest CIUS-PT version we can see indexed dates from 2021 — which is itself a question about how current the specification is.",
        "de": "eSPap war nicht erreichbar, und die neueste indexierte CIUS-PT-Fassung stammt von 2021 – was schon für sich die Frage nach der Aktualität der Spezifikation aufwirft.",
        "fr": "eSPap est resté inaccessible, et la version CIUS-PT la plus récente que nous voyons indexée date de 2021 — ce qui pose en soi la question de l'actualité de la spécification.",
        "es": "No pudimos acceder a eSPap, y la versión de CIUS-PT más reciente que vemos indexada es de 2021, lo que ya plantea la duda de si la especificación está al día.",
    },
    "IE": {
        "en": "Revenue says the technical specification will be published well ahead of the 2028 phase. It does not exist yet, so there is nothing to build against or to validate.",
        "de": "Revenue kündigt an, die technische Spezifikation lange vor der Stufe 2028 zu veröffentlichen. Sie existiert noch nicht – es gibt nichts zu implementieren oder zu prüfen.",
        "fr": "Revenue annonce la publication de la spécification technique bien avant l'échéance de 2028. Elle n'existe pas encore : il n'y a rien à implémenter ni à valider.",
        "es": "Revenue afirma que publicará la especificación técnica bastante antes de la fase de 2028. Todavía no existe, así que no hay nada que implementar ni validar.",
    },
}


def q(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def check():
    problems = []
    if set(SPEC) != set(GAP) or set(SPEC) != set(ARTEFACTS):
        problems.append("SPEC, GAP and ARTEFACTS cover different countries")
    for code, vals in GAP.items():
        for lang in LANGS:
            v = vals.get(lang)
            if not v:
                problems.append(f"{code}: no {lang} gap note")
                continue
            if len(v) > CAP:
                problems.append(f"{code}/{lang}: gap note is {len(v)} chars, cap is {CAP}")
    for code, row in SPEC.items():
        (status, _n, _v, _syn, _en, _gov, licence, lic_status, access,
         released, mandatory, _cl, _val) = row
        # The same pairs the standing invariants police, checked here so
        # the generator refuses rather than the migration failing.
        if lic_status == "named" and not licence:
            problems.append(f"{code}: licence_status 'named' with no licence string")
        if lic_status in ("unstated", "unknown") and licence:
            problems.append(f"{code}: licence_status '{lic_status}' but a licence is named")
        if released and mandatory and mandatory < released:
            problems.append(f"{code}: mandatory_from {mandatory} precedes release {released}")
        if status == "published" and not ARTEFACTS[code]:
            problems.append(f"{code}: claimed 'published' with no artefact")
        machine = [a for a in ARTEFACTS[code] if a[0] in ("xsd", "schematron", "xslt", "sdk")]
        if status in ("unreachable", "not_yet") and machine:
            problems.append(f"{code}: '{status}' but lists a machine-readable artefact")
        if access == "blocked" and ARTEFACTS[code]:
            problems.append(f"{code}: access 'blocked' but lists artefacts we could not reach")
    if problems:
        raise SystemExit("REFUSING TO GENERATE:\n  " + "\n  ".join(problems))


HEADER = """-- ================================================================
-- The specification register: twenty jurisdictions.
-- ================================================================
--
-- Generated by gen_spec_register.py -- edit that, not this.
--
-- Researched 24 August 2026 against primary sources. A field is NULL
-- where it could not be confirmed from one; nothing here is inferred
-- from a vendor summary.
--
-- WHAT THE RESEARCH CHANGED. The feasibility study called Germany,
-- France, Denmark, the Netherlands, Turkey and the Peppol countries
-- 'tier 1 -- clone and run'. Two of those are wrong and this file is
-- the correction: France's Factur-X package asks for an email address,
-- and Turkey's GIB blocks automated access altogether so nothing about
-- it could be verified.
--
-- ONLY TWO OF TWENTY publish machine-readable artefacts under a NAMED
-- licence -- Germany (Apache-2.0) and the Netherlands (MIT). Croatia is
-- third and still does not qualify: an explicit permission to reuse,
-- with no licence name on it. The rest publish openly on terms that are
-- unstated, unknown, or -- for every Peppol jurisdiction -- explicitly
-- restrictive: the artefacts download without a login and then forbid
-- redistribution without OpenPeppol's consent. 'Open' and 'licensed'
-- are different questions and this table answers them separately.
--
-- FOUR ROWS CARRY NOTHING MACHINE-READABLE AT ALL, and they are the
-- most useful rows here. Romania's RO_CIUS exists only as prose in an ordinance.
-- Ireland's does not exist yet. Turkey's and Portugal's publishers
-- refuse us. Saying so precisely, with the reason, is what a register
-- can do that a validator cannot.
-- ================================================================

"""


def sql():
    out = [HEADER, "-- ---- the register ---------------------------------------------------"]
    for code in sorted(SPEC):
        (status, name, version, syntax, en, gov, licence, lic_status, access,
         released, mandatory, changelog, validator) = SPEC[code]
        out.append(
            "INSERT OR REPLACE INTO country_spec (country_id, capture_status, format_name,\n"
            "    format_version, syntax, is_en16931, governance, licence, licence_status,\n"
            "    access, version_released, mandatory_from, changelog_url, validator_url,\n"
            "    last_verified)\n"
            f"  SELECT id, {q(status)}, {q(name)}, {q(version)}, {q(syntax)}, {q(en)},\n"
            f"         {q(gov)}, {q(licence)}, {q(lic_status)}, {q(access)},\n"
            f"         {q(released)}, {q(mandatory)}, {q(changelog)}, {q(validator)}, {q(VERIFIED)}\n"
            f"    FROM countries WHERE code = {q(code)};")

    out.append("\n-- ---- the artefacts --------------------------------------------------")
    for code in sorted(ARTEFACTS):
        for i, (kind, url, publisher) in enumerate(ARTEFACTS[code]):
            out.append(
                "INSERT INTO country_spec_artefacts (country_id, kind, url, publisher, sort_order)\n"
                f"  SELECT id, {q(kind)}, {q(url)}, {q(publisher)}, {i}\n"
                f"    FROM countries WHERE code = {q(code)};")

    out.append("\n-- ---- what the artefacts do not tell you -----------------------------")
    for code in sorted(GAP):
        for lang in LANGS:
            out.append(
                "INSERT OR REPLACE INTO country_spec_translations (country_id, lang, gap_note)\n"
                f"  SELECT id, '{lang}', {q(GAP[code][lang])}\n"
                f"    FROM countries WHERE code = {q(code)};")

    n = len(SPEC)
    artefact_count = sum(len(v) for v in ARTEFACTS.values())
    published = sum(1 for v in SPEC.values() if v[0] == "published")
    named = sum(1 for v in SPEC.values() if v[7] == "named")
    out.append(f"""
-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM country_spec = {n}
-- ASSERT: SELECT count(*) FROM country_spec_artefacts = {artefact_count}
-- ASSERT: SELECT count(*) FROM country_spec_translations = {n * len(LANGS)}

-- The two findings, asserted so that a later edit cannot quietly
-- soften them. {published} of {n} publish machine-readable artefacts they
-- consider current; only {named} do so under a licence with a name.
-- ASSERT: SELECT count(*) FROM country_spec WHERE capture_status = 'published' = {published}
-- ASSERT: SELECT count(*) FROM country_spec WHERE licence_status = 'named' = {named}

-- ---- and what must stay true afterwards -----------------------------

-- EVERY REGISTERED COUNTRY IS A REAL, TRACKED JURISDICTION. A row
-- against a country the site does not otherwise cover would render a
-- page with no guide to link to.
-- ASSERT ALWAYS: SELECT count(*) FROM country_spec s JOIN countries c ON c.id = s.country_id WHERE c.slug IS NULL = 0

-- NO ARTEFACT IS ORPHANED. The artefact table has no foreign-key
-- enforcement in D1, so the invariant does the work.
-- ASSERT ALWAYS: SELECT count(*) FROM country_spec_artefacts a WHERE a.country_id NOT IN (SELECT country_id FROM country_spec) = 0

-- AND EVERY ARTEFACT URL IS ONE, so that a card cannot render a link
-- that goes nowhere.
-- ASSERT ALWAYS: SELECT count(*) FROM country_spec_artefacts WHERE url NOT LIKE 'https://%' = 0
""")
    return "\n".join(out) + "\n"


if __name__ == "__main__":
    check()
    path = os.path.join(HERE, "637_spec_register_facts.sql")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(sql())
    print(f"{path}: {len(SPEC)} countries, "
          f"{sum(len(v) for v in ARTEFACTS.values())} artefacts, "
          f"{len(GAP) * len(LANGS)} notes")
    longest = max((len(v[l]), c, l) for c, v in GAP.items() for l in LANGS)
    print(f"  longest gap note: {longest[0]}/{CAP} chars ({longest[1]}/{longest[2]})")
