#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_thailand_deep_dive.py — emits 709_thailand_deep_dive.sql.

Edit this file, not the SQL. Run:
    python3 gen_thailand_deep_dive.py > 709_thailand_deep_dive.sql

THE FIRST COUNTRY BUILT TO DEEP-DIVE-FRAMEWORK.md. Every band is checked
here before a line of SQL is emitted -- lengths in all four languages,
the four-card section-02 spine in order, the section-05 floor, stats,
steps, portals and portal-label lengths. The backlog exempts the
seventy-six countries that came before; it does not exempt this one.

THREE THINGS THIS PAGE EXISTS TO SAY.

1. Nothing is mandatory, and that comes from the instruments rather than
   from an absence of evidence. Clause 12 of Director-General
   Announcement No. 15 lets a registrant CHOOSE electronic or paper per
   transaction and withdraw by form bor.or.09; the 2023 announcements say
   "may choose". Thailand is the cleanest 'voluntary' on the site.

2. The live fact is a legal gap, not a deadline. The 200 per cent
   deduction expired on 31 December 2025 and its 2026-27 replacement has
   Cabinet approval and a Revenue Department press release but no located
   Royal Decree. Money is being spent in 2026 against a measure that is
   not yet law.

3. A third vendor page this month publishes a mandate that does not
   exist -- phases, a THB 1.8 billion threshold and a standard called
   "RD STD 03-2566", none of which are real. The 1.8 billion looks like a
   corrupted rendering of the 1.8 MILLION VAT registration threshold.

The stat strip carries the VAT rate, the registration threshold, the
by-email ceiling and the lapsed deduction. Nothing in it restates a
headline tile.
"""
import json, sys

LANGS = ("en", "es", "de", "fr")
CID = "(SELECT id FROM countries WHERE code = 'TH')"
def esc(s): return s.replace("'", "''")
def lit(s): return "NULL" if s is None else "'" + esc(s) + "'"
def words(s): return len([w for w in str(s).split() if w])

# The framework's bands, restated here only so the generator can refuse
# to emit. The authority is DEEP-DIVE-FRAMEWORK.md and the enforcement is
# tests/deep-dive-shape.mjs; this is a seatbelt, not a second source.
BANDS = {"compliance_model": ("chars", 20, 64), "mandate_summary": ("words", 35, 75),
         "timeline_intro": ("words", 18, 40), "file_format_intro": ("words", 14, 35),
         "scope_intro": ("words", 15, 35), "steps_intro": ("words", 13, 40),
         "penalties_intro": ("words", 15, 35), "footer_disclaimer": ("words", 45, 70)}
LANG_ALLOWANCE = 1.5
SPINE = [
 {"en": "Format & standard",          "es": "Formato y estándar",         "de": "Format und Standard",        "fr": "Format et norme"},
 {"en": "Identifiers & registration", "es": "Identificadores y registro", "de": "Kennungen und Registrierung","fr": "Identifiants et enregistrement"},
 {"en": "Mandatory content",          "es": "Contenido obligatorio",      "de": "Pflichtangaben",             "fr": "Mentions obligatoires"},
 {"en": "Archiving",                  "es": "Conservación",               "de": "Aufbewahrung",               "fr": "Conservation"},
]

PAGE = {
"en": dict(
compliance_model="Voluntary e-tax invoicing (ETDA XML) — no mandate at any level",
mandate_summary="Thailand has no e-invoicing mandate for business, consumers or government suppliers, and none is proposed. Two voluntary routes exist: a full XML system reported monthly to the Revenue Department, and an e-mail route for smaller businesses where an ETDA time stamp replaces the digital signature. Adoption is driven by tax incentives, and the 200 per cent deduction that drove it expired at the end of 2025.",
mandate_summary_icon="🇹🇭",
timeline_intro="A timeline of permissions rather than deadlines. Thailand authorised electronic tax documents in 2022, added a lighter route for smaller businesses in 2023, and paid people to adopt both until the end of 2025.",
file_format_intro="The full system uses XML on the UN/CEFACT Cross Industry Invoice model, not UBL and not EN 16931. The e-mail route uses PDF/A-3. Thailand has no Peppol Authority.",
scope_intro="Everyone may, nobody must. What has scope is the choice between the two routes: the e-mail route is capped at THB 30 million of annual revenue, and a business cannot run both at once.",
steps_intro="The useful work here is deciding whether to opt in at all, and then not over-building. Nothing on this page requires a compliance project, and the incentive that used to pay for one has lapsed.",
penalties_intro="There is no e-invoicing penalty, because there is no e-invoicing rule. What the Revenue Department enforces hard is invoice authenticity, through fraud investigations rather than format checks.",
footer_disclaimer="This page rests on the Revenue Department's own published instruments — Ministerial Regulation No. 384, Director-General Announcement No. 15 of 2019, the 2023 announcements on the e-certificate and time-stamp routes, and press release 14/2569 — together with the ETDA standard and the Revenue Code as published in English by the Department. The Royal Gazette refused automated access, so no promulgation was read in the Gazette itself.",
),
"es": dict(
compliance_model="Factura electrónica voluntaria (XML de ETDA) — sin obligación",
mandate_summary="Tailandia no impone la factura electrónica ni a empresas, ni a consumidores, ni a proveedores públicos, y no hay propuesta alguna. Existen dos vías voluntarias: un sistema XML completo que se remite mensualmente al Departamento de Hacienda y una vía por correo para empresas menores, donde un sello de tiempo de ETDA sustituye a la firma digital. La adopción se impulsa con incentivos fiscales, y la deducción del 200 % que la impulsaba venció a finales de 2025.",
mandate_summary_icon="🇹🇭",
timeline_intro="Una cronología de permisos y no de plazos. Tailandia autorizó los documentos fiscales electrónicos en 2022, añadió una vía más ligera para empresas menores en 2023 y pagó por adoptar ambas hasta finales de 2025.",
file_format_intro="El sistema completo usa XML sobre el modelo Cross Industry Invoice de UN/CEFACT, ni UBL ni EN 16931. La vía por correo usa PDF/A-3. Tailandia no tiene autoridad Peppol.",
scope_intro="Todos pueden, nadie debe. Lo que sí tiene ámbito es la elección entre las dos vías: la de correo se limita a 30 millones de baht de ingresos anuales y no se pueden usar ambas a la vez.",
steps_intro="Aquí el trabajo útil es decidir si conviene adherirse y después no excederse. Nada de esta página exige un proyecto de cumplimiento, y el incentivo que solía pagarlo ha vencido.",
penalties_intro="No hay sanción por facturación electrónica, porque no hay norma que la imponga. Lo que el Departamento de Hacienda persigue con dureza es la autenticidad de la factura, mediante investigaciones de fraude y no controles de formato.",
footer_disclaimer="Esta página se apoya en los instrumentos publicados por el propio Departamento de Hacienda —el Reglamento Ministerial n.º 384, el anuncio n.º 15 del Director General de 2019, los anuncios de 2023 sobre las vías de certificado y de sello de tiempo, y la nota 14/2569—, junto con el estándar de ETDA y el Código Fiscal publicado en inglés por el Departamento. El Boletín Oficial rechazó el acceso automatizado, así que no se leyó allí ninguna promulgación.",
),
"de": dict(
compliance_model="Freiwillige E-Rechnung (ETDA-XML) — keinerlei Pflicht",
mandate_summary="Thailand kennt keine E-Rechnungspflicht für Unternehmen, Verbraucher oder Lieferanten der öffentlichen Hand, und es ist keine vorgeschlagen. Es gibt zwei freiwillige Wege: ein volles XML-System, das monatlich an die Steuerbehörde gemeldet wird, und einen E-Mail-Weg für kleinere Unternehmen, bei dem ein ETDA-Zeitstempel die digitale Signatur ersetzt. Getrieben wird die Einführung von Steueranreizen — und der Abzug von 200 Prozent, der sie trug, lief Ende 2025 aus.",
mandate_summary_icon="🇹🇭",
timeline_intro="Eine Zeitleiste der Erlaubnisse statt der Fristen. Thailand liess 2022 elektronische Steuerdokumente zu, ergänzte 2023 einen leichteren Weg für kleinere Unternehmen und bezahlte die Einführung beider bis Ende 2025.",
file_format_intro="Das volle System nutzt XML nach dem UN/CEFACT-Modell Cross Industry Invoice, weder UBL noch EN 16931. Der E-Mail-Weg nutzt PDF/A-3. Thailand hat keine Peppol-Behörde.",
scope_intro="Alle dürfen, niemand muss. Einen Anwendungsbereich hat die Wahl zwischen den Wegen: der E-Mail-Weg ist auf 30 Millionen Baht Jahresumsatz begrenzt, und beide zugleich sind ausgeschlossen.",
steps_intro="Die nützliche Arbeit besteht darin, den Beitritt zu entscheiden und danach nicht zu übertreiben. Nichts auf dieser Seite verlangt ein Compliance-Projekt, und der Anreiz, der es früher bezahlte, ist ausgelaufen.",
penalties_intro="Eine Sanktion für elektronische Rechnungsstellung gibt es nicht, weil es keine Regel dazu gibt. Hart durchgesetzt wird die Echtheit der Rechnung, über Betrugsermittlungen und nicht über Formatprüfungen.",
footer_disclaimer="Diese Seite stützt sich auf die veröffentlichten Instrumente der Steuerbehörde selbst — die Ministerialverordnung Nr. 384, die Bekanntmachung Nr. 15 des Generaldirektors von 2019, die Bekanntmachungen von 2023 zum Zertifikats- und zum Zeitstempelweg sowie die Mitteilung 14/2569 — dazu den ETDA-Standard und die von der Behörde auf Englisch veröffentlichte Abgabenordnung. Der Staatsanzeiger verweigerte den automatisierten Zugriff, sodass dort keine Verkündung gelesen wurde.",
),
"fr": dict(
compliance_model="Facture électronique volontaire (XML ETDA) — aucune obligation",
mandate_summary="La Thaïlande n'impose la facturation électronique ni aux entreprises, ni aux consommateurs, ni aux fournisseurs publics, et rien n'est proposé. Deux voies volontaires coexistent : un système XML complet transmis chaque mois à l'administration fiscale, et une voie par courriel pour les petites entreprises où un horodatage de l'ETDA remplace la signature numérique. L'adoption repose sur des incitations fiscales, et la déduction de 200 % qui la portait a expiré fin 2025.",
mandate_summary_icon="🇹🇭",
timeline_intro="Une chronologie d'autorisations plutôt que d'échéances. La Thaïlande a autorisé les documents fiscaux électroniques en 2022, ajouté une voie plus légère pour les petites entreprises en 2023, puis payé l'adoption des deux jusqu'à fin 2025.",
file_format_intro="Le système complet emploie du XML sur le modèle Cross Industry Invoice de l'UN/CEFACT, ni UBL ni EN 16931. La voie par courriel emploie PDF/A-3. La Thaïlande n'a pas d'autorité Peppol.",
scope_intro="Tous peuvent, nul ne doit. Ce qui a un champ, c'est le choix entre les deux voies : celle par courriel est plafonnée à 30 millions de bahts de recettes annuelles, et les deux sont exclusives l'une de l'autre.",
steps_intro="Le travail utile consiste à décider si l'on adhère, puis à ne pas en faire trop. Rien sur cette page n'exige un projet de conformité, et l'incitation qui le finançait a expiré.",
penalties_intro="Il n'existe pas de sanction en matière de facturation électronique, faute de règle. Ce que l'administration poursuit durement, c'est l'authenticité de la facture, par des enquêtes pour fraude et non par des contrôles de format.",
footer_disclaimer="Cette page repose sur les instruments publiés par l'administration fiscale elle-même — le règlement ministériel n° 384, l'annonce n° 15 du Directeur général de 2019, les annonces de 2023 sur les voies du certificat et de l'horodatage, et le communiqué 14/2569 — ainsi que sur la norme de l'ETDA et le Code des impôts publié en anglais par l'administration. Le Journal officiel a refusé l'accès automatisé : aucune promulgation n'y a été lue.",
),
}

STATS = [
 {"en": ("7%", "VAT rate, reduced by decree and extended annually — most recently to 30 September 2027"),
  "es": ("7 %", "Tipo del IVA, reducido por decreto y prorrogado cada año; la última vez hasta el 30 de septiembre de 2027"),
  "de": ("7 %", "MWST-Satz, per Dekret gesenkt und jährlich verlängert — zuletzt bis zum 30. September 2027"),
  "fr": ("7 %", "Taux de TVA, réduit par décret et prorogé chaque année — en dernier lieu jusqu'au 30 septembre 2027")},
 {"en": ("THB 1.8m", "VAT registration threshold. Not 1.8 billion, which is a vendor page's misprint of this figure"),
  "es": ("1,8 M THB", "Umbral de registro del IVA. No 1.800 millones, que es la errata de una página de proveedor"),
  "de": ("1,8 Mio. THB", "Registrierungsschwelle für die MWST. Nicht 1,8 Milliarden — das ist der Druckfehler einer Anbieterseite"),
  "fr": ("1,8 M THB", "Seuil d'assujettissement à la TVA. Non 1,8 milliard, coquille d'une page d'éditeur")},
 {"en": ("THB 30m", "Annual revenue ceiling for the lighter e-mail route, above which only the full XML system is open"),
  "es": ("30 M THB", "Techo de ingresos anuales de la vía por correo; por encima solo queda el sistema XML completo"),
  "de": ("30 Mio. THB", "Jahresumsatzgrenze des leichteren E-Mail-Wegs; darüber bleibt nur das volle XML-System"),
  "fr": ("30 M THB", "Plafond de recettes annuelles de la voie par courriel ; au-delà, seul le système XML complet reste")},
 {"en": ("200%", "The corporate income tax deduction that drove adoption, which lapsed on 31 December 2025"),
  "es": ("200 %", "La deducción del impuesto de sociedades que impulsó la adopción, vencida el 31 de diciembre de 2025"),
  "de": ("200 %", "Der Körperschaftsteuerabzug, der die Einführung trug und am 31. Dezember 2025 auslief"),
  "fr": ("200 %", "La déduction d'impôt sur les sociétés qui a porté l'adoption, expirée le 31 décembre 2025")},
]

SEC2 = [
 { # Format & standard
  "en": [["The full system", "XML on the UN/CEFACT Cross Industry Invoice v3 model, per ETDA recommendation ขมธอ. 3-2560, signed with XAdES. It is not UBL, and it is not EN 16931."],
         ["The e-mail route", "PDF/A-3 only, three megabytes maximum, unencrypted and without a password. PDF/A-3 has been compulsory on this route since 1 July 2018."],
         ["Peppol", "Thailand has no Peppol Authority and no OpenPeppol country profile. A Thai business may use a certified access point commercially; that is a vendor fact, not a Thai regime."]],
  "es": [["El sistema completo", "XML sobre el modelo Cross Industry Invoice v3 de UN/CEFACT, según la recomendación ขมธอ. 3-2560 de ETDA, firmado con XAdES. No es UBL ni es EN 16931."],
         ["La vía por correo", "Solo PDF/A-3, tres megabytes como máximo, sin cifrar y sin contraseña. El PDF/A-3 es obligatorio en esta vía desde el 1 de julio de 2018."],
         ["Peppol", "Tailandia no tiene autoridad Peppol ni perfil de país en OpenPeppol. Una empresa tailandesa puede usar comercialmente un punto de acceso certificado: eso es un hecho de proveedor."]],
  "de": [["Das volle System", "XML nach dem UN/CEFACT-Modell Cross Industry Invoice v3, gemäss ETDA-Empfehlung ขมธอ. 3-2560, mit XAdES signiert. Es ist weder UBL noch EN 16931."],
         ["Der E-Mail-Weg", "Nur PDF/A-3, höchstens drei Megabyte, unverschlüsselt und ohne Passwort. PDF/A-3 ist auf diesem Weg seit dem 1. Juli 2018 zwingend."],
         ["Peppol", "Thailand hat keine Peppol-Behörde und kein OpenPeppol-Länderprofil. Ein thailändisches Unternehmen kann einen zertifizierten Access Point kommerziell nutzen; das ist eine Anbietertatsache."]],
  "fr": [["Le système complet", "XML sur le modèle Cross Industry Invoice v3 de l'UN/CEFACT, selon la recommandation ขมธอ. 3-2560 de l'ETDA, signé en XAdES. Ce n'est ni UBL ni l'EN 16931."],
         ["La voie par courriel", "PDF/A-3 uniquement, trois mégaoctets au plus, non chiffré et sans mot de passe. Le PDF/A-3 y est obligatoire depuis le 1er juillet 2018."],
         ["Peppol", "La Thaïlande n'a ni autorité Peppol ni profil pays OpenPeppol. Une entreprise thaïlandaise peut recourir commercialement à un point d'accès certifié : c'est un fait de marché."]]},
 { # Identifiers & registration
  "en": [["Who may register", "VAT registrants and persons required to issue receipts. There is no turnover floor for the full system and no accreditation to win — you apply on form บ.อ.01."],
         ["The certificate", "An enterprise certificate issued by a certification authority under Thailand's National Root CA, held on a USB token or an HSM at FIPS 140-2 Level 3 or above."],
         ["The e-mail route instead", "No certificate at all. ETDA's trusted time stamp supplies the integrity, which is the whole legal difference between the two routes."],
         ["You may only be on one", "A business cannot run the full system and the e-mail route at the same time. Choose before you build."]],
  "es": [["Quién puede registrarse", "Sujetos pasivos de IVA y quienes deban emitir recibos. No hay umbral mínimo para el sistema completo ni acreditación que ganar: se solicita con el formulario บ.อ.01."],
         ["El certificado", "Un certificado de empresa emitido por una autoridad bajo la CA raíz nacional de Tailandia, custodiado en token USB o HSM con FIPS 140-2 nivel 3 o superior."],
         ["La vía por correo, en cambio", "Ningún certificado. El sello de tiempo de confianza de ETDA aporta la integridad, y esa es toda la diferencia jurídica entre ambas vías."],
         ["Solo se puede estar en una", "Una empresa no puede usar a la vez el sistema completo y la vía por correo. Elija antes de construir."]],
  "de": [["Wer sich registrieren darf", "MWST-Registrierte und Quittungspflichtige. Für das volle System gibt es keine Umsatzuntergrenze und keine Akkreditierung — beantragt wird mit Formular บ.อ.01."],
         ["Das Zertifikat", "Ein Unternehmenszertifikat einer Zertifizierungsstelle unter Thailands nationaler Root-CA, auf USB-Token oder HSM nach FIPS 140-2 Level 3 oder höher."],
         ["Der E-Mail-Weg stattdessen", "Gar kein Zertifikat. Der vertrauenswürdige Zeitstempel der ETDA liefert die Integrität — das ist der ganze rechtliche Unterschied."],
         ["Nur einer von beiden", "Ein Unternehmen kann das volle System und den E-Mail-Weg nicht gleichzeitig nutzen. Entscheiden Sie vor dem Bauen."]],
  "fr": [["Qui peut s'inscrire", "Les assujettis à la TVA et les personnes tenues d'émettre des reçus. Aucun seuil minimal pour le système complet et aucun agrément à obtenir : on dépose le formulaire บ.อ.01."],
         ["Le certificat", "Un certificat d'entreprise délivré par une autorité relevant de l'AC racine nationale, conservé sur jeton USB ou HSM au niveau FIPS 140-2 3 ou supérieur."],
         ["La voie par courriel, elle", "Aucun certificat. L'horodatage de confiance de l'ETDA fournit l'intégrité : c'est toute la différence juridique entre les deux voies."],
         ["Une seule à la fois", "Une entreprise ne peut pas mener de front le système complet et la voie par courriel. Choisissez avant de construire."]]},
 { # Mandatory content
  "en": [["What governs it", "The content model of ETDA recommendation ขมธอ. 3-2560 for the full system. No additional national field set beyond the standard was identified."],
         ["On the e-mail route", "The constraints are the file rather than the fields: PDF/A-3, under three megabytes, unencrypted, sent from a registered address with ETDA copied."],
         ["Integrity, not layout", "The Revenue Department's requirement is that the document keeps its meaning, stays reproducible in original form, and carries metadata for origin, destination and time."]],
  "es": [["Qué lo rige", "El modelo de contenido de la recomendación ขมธอ. 3-2560 de ETDA para el sistema completo. No se identificó un conjunto de campos nacional adicional al estándar."],
         ["En la vía por correo", "Las restricciones son del archivo y no de los campos: PDF/A-3, menos de tres megabytes, sin cifrar, enviado desde una dirección registrada con copia a ETDA."],
         ["Integridad, no maquetación", "El Departamento exige que el documento conserve su sentido, siga siendo reproducible en su forma original y lleve metadatos de origen, destino y hora."]],
  "de": [["Was es regelt", "Das Inhaltsmodell der ETDA-Empfehlung ขมธอ. 3-2560 für das volle System. Ein zusätzlicher nationaler Feldsatz über den Standard hinaus wurde nicht festgestellt."],
         ["Auf dem E-Mail-Weg", "Die Vorgaben betreffen die Datei, nicht die Felder: PDF/A-3, unter drei Megabyte, unverschlüsselt, von einer registrierten Adresse mit Kopie an ETDA."],
         ["Integrität, nicht Layout", "Die Behörde verlangt, dass das Dokument seinen Sinn behält, in ursprünglicher Form reproduzierbar bleibt und Metadaten zu Herkunft, Ziel und Zeit trägt."]],
  "fr": [["Ce qui le régit", "Le modèle de contenu de la recommandation ขมธอ. 3-2560 de l'ETDA pour le système complet. Aucun jeu de champs national supplémentaire n'a été identifié."],
         ["Sur la voie par courriel", "Les contraintes portent sur le fichier et non sur les champs : PDF/A-3, moins de trois mégaoctets, non chiffré, envoyé d'une adresse enregistrée avec copie à l'ETDA."],
         ["Intégrité, non mise en page", "L'administration exige que le document conserve son sens, reste reproductible dans sa forme d'origine et porte des métadonnées d'origine, de destination et d'heure."]]},
 { # Archiving
  "en": [["Five years, not ten", "Revenue Code s.87/3: five years from the filing of the return or the making of the report, which the Director-General may extend to more than five but not beyond seven. A widely published vendor figure of ten years is wrong."],
         ["Electronic retention", "Expressly permitted by Ministerial Regulation No. 384 and Announcement No. 15, provided the meaning stays intact, the document is reproducible in its original form, and the metadata survives."],
         ["Where", "Section 87/3 requires records at the place of business or other places the Director-General prescribes. No explicit in-country storage duty was identified, and no express permission to store offshore either."]],
  "es": [["Cinco años, no diez", "Art. 87/3 del Código Fiscal: cinco años desde la presentación de la declaración o la formación del registro, ampliables por el Director General a más de cinco pero no más de siete. La cifra de diez años que publica un proveedor es errónea."],
         ["Conservación electrónica", "Permitida expresamente por el Reglamento Ministerial n.º 384 y el anuncio n.º 15, siempre que se conserve el sentido, el documento siga siendo reproducible en su forma original y sobrevivan los metadatos."],
         ["Dónde", "El art. 87/3 exige los registros en el establecimiento o donde prescriba el Director General. No se identificó deber expreso de almacenar en el país, ni permiso expreso de hacerlo fuera."]],
  "de": [["Fünf Jahre, nicht zehn", "Art. 87/3 der Abgabenordnung: fünf Jahre ab Abgabe der Erklärung oder Erstellung des Berichts, vom Generaldirektor auf mehr als fünf, aber höchstens sieben verlängerbar. Die vielfach veröffentlichte Anbieterangabe von zehn Jahren ist falsch."],
         ["Elektronische Aufbewahrung", "Von der Ministerialverordnung Nr. 384 und der Bekanntmachung Nr. 15 ausdrücklich zugelassen, sofern der Sinn erhalten bleibt, das Dokument in ursprünglicher Form reproduzierbar ist und die Metadaten fortbestehen."],
         ["Wo", "Art. 87/3 verlangt die Aufbewahrung am Geschäftssitz oder an vom Generaldirektor bestimmten Orten. Weder eine ausdrückliche Pflicht zur Speicherung im Land noch eine ausdrückliche Erlaubnis zur Speicherung im Ausland wurde festgestellt."]],
  "fr": [["Cinq ans, non dix", "Art. 87/3 du Code des impôts : cinq ans à compter du dépôt de la déclaration ou de l'établissement du registre, que le Directeur général peut porter à plus de cinq sans dépasser sept. Le chiffre de dix ans publié par un éditeur est faux."],
         ["Conservation électronique", "Expressément admise par le règlement ministériel n° 384 et l'annonce n° 15, pourvu que le sens demeure, que le document reste reproductible dans sa forme d'origine et que les métadonnées subsistent."],
         ["Où", "L'art. 87/3 exige la conservation à l'établissement ou aux lieux prescrits par le Directeur général. Aucune obligation expresse de stockage dans le pays n'a été identifiée, ni permission expresse de stocker à l'étranger."]]},
]

SEC3 = [
 {"t": {"en": "Two routes, and you may only be on one", "es": "Dos vías, y solo se puede estar en una",
        "de": "Zwei Wege, und nur einer davon", "fr": "Deux voies, et une seule à la fois"},
  "r": {"en": [["The full system", "Register on form บ.อ.01, sign each document with a certificate, and send the XML to the Revenue Department by the fifteenth of the following month. No turnover ceiling."],
               ["The e-mail route", "Annual revenue up to THB 30 million, VAT-registered, not already in the full system, and not flagged for fraudulent invoicing. No certificate and no monthly transmission."],
               ["What the monthly send is", "Batch post-audit reporting, not clearance. Nothing is approved before issue and no invoice is blocked; the data arrives after the fact."]],
        "es": [["El sistema completo", "Se solicita con el formulario บ.อ.01, se firma cada documento con certificado y se envía el XML al Departamento antes del día quince del mes siguiente. Sin techo de ingresos."],
               ["La vía por correo", "Ingresos anuales de hasta 30 millones de baht, sujeto pasivo de IVA, no inscrito ya en el sistema completo y sin señalamiento por facturación fraudulenta. Ni certificado ni envío mensual."],
               ["Qué es el envío mensual", "Declaración por lotes posterior a la emisión, no despacho previo. Nada se aprueba antes de emitir y ninguna factura se bloquea: los datos llegan después."]],
        "de": [["Das volle System", "Antrag auf Formular บ.อ.01, jedes Dokument mit Zertifikat signieren und die XML bis zum Fünfzehnten des Folgemonats an die Steuerbehörde senden. Keine Umsatzgrenze."],
               ["Der E-Mail-Weg", "Jahresumsatz bis 30 Millionen Baht, MWST-registriert, nicht bereits im vollen System und nicht wegen Scheinrechnungen auffällig. Kein Zertifikat, keine monatliche Übermittlung."],
               ["Was die monatliche Sendung ist", "Nachgelagerte Sammelmeldung, keine Freigabe. Vor Ausstellung wird nichts genehmigt und keine Rechnung blockiert; die Daten kommen im Nachhinein."]],
        "fr": [["Le système complet", "Inscription par formulaire บ.อ.01, signature de chaque document par certificat, et envoi du XML à l'administration avant le quinze du mois suivant. Aucun plafond de recettes."],
               ["La voie par courriel", "Recettes annuelles jusqu'à 30 millions de bahts, assujetti à la TVA, non déjà inscrit au système complet et non signalé pour facturation frauduleuse. Ni certificat ni envoi mensuel."],
               ["Ce qu'est l'envoi mensuel", "Une déclaration groupée a posteriori, non un dédouanement. Rien n'est approuvé avant émission et aucune facture n'est bloquée : les données arrivent après coup."]]}},
 {"t": {"en": "⚠️ The incentive lapsed, and its replacement is not law yet",
        "es": "⚠️ El incentivo venció y su reemplazo aún no es ley",
        "de": "⚠️ Der Anreiz lief aus, und sein Ersatz ist noch kein Recht",
        "fr": "⚠️ L'incitation a expiré, et son remplacement n'est pas encore la loi"},
  "r": {"en": [["What expired", "Royal Decree No. 766 gave a 200 per cent deduction for e-Tax Invoice and e-Withholding Tax investment. It ran to 31 December 2025 and was not renewed before it lapsed."],
               ["What was approved", "On 16 June 2026 the Cabinet approved two more years at the same rate for 2026 and 2027, newly covering ETDA system-assessment fees, with e-Withholding Tax cut to a flat 1 per cent. Revenue Department press release 14/2569."],
               ["What is missing", "An enacting Royal Decree. As at 27 August 2026 none appears on the Department's own decree index, whose most recent entries are numbers 802 to 807."],
               ["What that means for you", "Expenditure incurred in 2026 rests on an approved but unpromulgated measure. Document it, but do not book the deduction as certain until the decree is published."],
               ["One discrepancy worth knowing", "The Government PR Department's account of the same decision names DEPA as the assessment body where the Revenue Department names ETDA. We follow the Revenue Department."]],
        "es": [["Qué venció", "El Decreto Real n.º 766 daba una deducción del 200 % por invertir en factura electrónica y retención electrónica. Llegaba al 31 de diciembre de 2025 y no se renovó antes de vencer."],
               ["Qué se aprobó", "El 16 de junio de 2026 el Consejo de Ministros aprobó dos años más al mismo tipo para 2026 y 2027, cubriendo además los honorarios de evaluación de ETDA, con la retención electrónica rebajada a un 1 % único. Nota 14/2569."],
               ["Qué falta", "El decreto real que lo promulgue. A 27 de agosto de 2026 no figura ninguno en el índice del propio Departamento, cuyas entradas más recientes son los números 802 a 807."],
               ["Qué significa para usted", "El gasto de 2026 se apoya en una medida aprobada pero no promulgada. Documéntelo, pero no contabilice la deducción como segura hasta que se publique el decreto."],
               ["Una discrepancia que conviene conocer", "El relato del Departamento de Información del Gobierno sobre la misma decisión nombra a DEPA como organismo evaluador donde Hacienda nombra a ETDA. Seguimos a Hacienda."]],
        "de": [["Was auslief", "Das Königliche Dekret Nr. 766 gewährte 200 Prozent Abzug für Investitionen in E-Rechnung und E-Quellensteuer. Es lief bis zum 31. Dezember 2025 und wurde vorher nicht verlängert."],
               ["Was gebilligt wurde", "Am 16. Juni 2026 billigte das Kabinett zwei weitere Jahre zum selben Satz für 2026 und 2027, neu einschliesslich ETDA-Prüfungshonoraren, mit einer Senkung der E-Quellensteuer auf einheitlich 1 Prozent. Mitteilung 14/2569."],
               ["Was fehlt", "Ein umsetzendes Königliches Dekret. Am 27. August 2026 findet sich keines im Dekretverzeichnis der Behörde, dessen jüngste Einträge die Nummern 802 bis 807 sind."],
               ["Was das für Sie heisst", "Ausgaben des Jahres 2026 beruhen auf einer gebilligten, aber nicht verkündeten Massnahme. Dokumentieren Sie sie, buchen Sie den Abzug aber erst als sicher, wenn das Dekret erscheint."],
               ["Eine Abweichung, die man kennen sollte", "Die Darstellung derselben Entscheidung durch das Regierungspresseamt nennt DEPA als Prüfstelle, wo die Steuerbehörde ETDA nennt. Wir folgen der Steuerbehörde."]],
        "fr": [["Ce qui a expiré", "Le décret royal n° 766 accordait 200 % de déduction pour l'investissement en facture et retenue électroniques. Il courait au 31 décembre 2025 et n'a pas été renouvelé avant son terme."],
               ["Ce qui a été approuvé", "Le 16 juin 2026, le Conseil des ministres a approuvé deux années de plus au même taux pour 2026 et 2027, couvrant désormais les honoraires d'évaluation de l'ETDA, avec une retenue électronique ramenée à 1 % uniforme. Communiqué 14/2569."],
               ["Ce qui manque", "Un décret royal d'application. Au 27 août 2026, aucun ne figure à l'index de l'administration, dont les entrées les plus récentes sont les numéros 802 à 807."],
               ["Ce que cela signifie pour vous", "Les dépenses de 2026 reposent sur une mesure approuvée mais non promulguée. Documentez-les, mais ne comptabilisez pas la déduction comme acquise avant la publication du décret."],
               ["Une divergence à connaître", "Le récit de la même décision par le service de presse du gouvernement nomme la DEPA comme organisme d'évaluation là où l'administration fiscale nomme l'ETDA. Nous suivons l'administration fiscale."]]}},
]

SEC5 = [
 {"t": {"en": "What is actually enforced", "es": "Qué se exige realmente",
        "de": "Was tatsächlich durchgesetzt wird", "fr": "Ce qui est réellement sanctionné"},
  "r": {"en": [["No e-invoicing offence", "There is nothing to fine, because nothing obliges an electronic invoice. Choosing paper is lawful for every taxpayer in Thailand."],
               ["What is enforced instead", "Authenticity. The Revenue Department announced two large operations against fraudulent tax invoices during 2026, the later one putting damage at around 360 million baht."],
               ["What that means in practice", "Expect scrutiny of whether an invoice is genuine, not of whether it is structured. The risk here is fraud exposure, not format non-conformity."]],
        "es": [["Sin infracción de facturación", "No hay nada que multar, porque nada obliga a la factura electrónica. Elegir papel es lícito para todo contribuyente en Tailandia."],
               ["Qué se persigue en cambio", "La autenticidad. El Departamento anunció en 2026 dos grandes operaciones contra facturas fiscales fraudulentas; la segunda cifró el perjuicio en unos 360 millones de baht."],
               ["Qué significa en la práctica", "Espere escrutinio sobre si la factura es genuina, no sobre si es estructurada. El riesgo es la exposición al fraude, no la disconformidad de formato."]],
        "de": [["Kein Rechnungsdelikt", "Es gibt nichts zu büssen, weil nichts zur elektronischen Rechnung verpflichtet. Papier zu wählen ist für jeden Steuerpflichtigen in Thailand rechtmässig."],
               ["Was stattdessen verfolgt wird", "Die Echtheit. Die Steuerbehörde meldete 2026 zwei grosse Aktionen gegen gefälschte Steuerrechnungen; die spätere bezifferte den Schaden auf rund 360 Millionen Baht."],
               ["Was das praktisch heisst", "Rechnen Sie mit Prüfungen, ob eine Rechnung echt ist, nicht ob sie strukturiert ist. Das Risiko ist Betrugsexposition, nicht Formatabweichung."]],
        "fr": [["Aucune infraction de facturation", "Il n'y a rien à sanctionner, puisque rien n'impose la facture électronique. Choisir le papier est licite pour tout contribuable en Thaïlande."],
               ["Ce qui est poursuivi à la place", "L'authenticité. L'administration a annoncé en 2026 deux vastes opérations contre les fausses factures fiscales, la seconde chiffrant le préjudice à quelque 360 millions de bahts."],
               ["Ce que cela veut dire en pratique", "Attendez-vous à un contrôle de la sincérité de la facture, non de sa structuration. Le risque est l'exposition à la fraude, non la non-conformité de format."]]}},
 {"t": {"en": "⚠️ A published mandate that does not exist",
        "es": "⚠️ Una obligación publicada que no existe",
        "de": "⚠️ Eine veröffentlichte Pflicht, die es nicht gibt",
        "fr": "⚠️ Une obligation publiée qui n'existe pas"},
  "r": {"en": [["What is claimed", "A vendor page dated 21 August 2026 asserts phased mandatory e-invoicing — large taxpayers from 2024, then businesses above THB 1.8 billion of revenue from January 2025 — under a standard it calls RD STD 03-2566."],
               ["What is true", "There are no phases, no such threshold and no such standard. The real standard is ETDA ขมธอ. 3-2560. The same page elsewhere says the regime remains voluntary, contradicting itself."],
               ["Where the number came from", "THB 1.8 billion appears to be a corrupted rendering of the THB 1.8 million VAT registration threshold — a factor of a thousand, in a figure that decides who is in scope."],
               ["Why we print this", "It is the third vendor page this month publishing a mandate that never existed, after Botswana's phantom March 2026 date and Hong Kong's compulsory e-Procurement System. If you meet a Thai mandate claim, check it here first."]],
        "es": [["Qué se afirma", "Una página de proveedor fechada el 21 de agosto de 2026 sostiene que hay obligación por fases —grandes contribuyentes desde 2024 y empresas de más de 1.800 millones de baht desde enero de 2025— bajo un estándar que llama RD STD 03-2566."],
               ["Qué es cierto", "No hay fases, ni tal umbral, ni tal estándar. El real es el ขมธอ. 3-2560 de ETDA. La misma página dice en otro punto que el régimen sigue siendo voluntario, contradiciéndose."],
               ["De dónde sale la cifra", "Los 1.800 millones de baht parecen una corrupción del umbral de registro de 1,8 millones: un factor de mil, en la cifra que decide a quién alcanza."],
               ["Por qué lo publicamos", "Es la tercera página de proveedor este mes que publica una obligación inexistente, tras la fecha fantasma de marzo de 2026 en Botsuana y el sistema de contratación «obligatorio» de Hong Kong."]],
        "de": [["Was behauptet wird", "Eine Anbieterseite vom 21. August 2026 behauptet eine stufenweise Pflicht — Grosssteuerpflichtige ab 2024, dann Unternehmen über 1,8 Milliarden Baht Umsatz ab Januar 2025 — nach einem Standard, den sie RD STD 03-2566 nennt."],
               ["Was zutrifft", "Es gibt weder Stufen noch diese Schwelle noch diesen Standard. Der wirkliche ist ETDA ขมธอ. 3-2560. Dieselbe Seite schreibt an anderer Stelle, das Regime bleibe freiwillig, und widerspricht sich."],
               ["Woher die Zahl stammt", "1,8 Milliarden Baht wirkt wie eine Verfälschung der Registrierungsschwelle von 1,8 Millionen — Faktor tausend, in genau der Zahl, die über den Anwendungsbereich entscheidet."],
               ["Warum wir das drucken", "Es ist die dritte Anbieterseite in diesem Monat mit einer Pflicht, die es nie gab, nach Botswanas Phantomdatum März 2026 und Hongkongs «verpflichtendem» e-Procurement-System."]],
        "fr": [["Ce qui est affirmé", "Une page d'éditeur datée du 21 août 2026 affirme une obligation par phases — grands contribuables dès 2024, puis entreprises au-delà de 1,8 milliard de bahts de recettes dès janvier 2025 — sous une norme qu'elle nomme RD STD 03-2566."],
               ["Ce qui est vrai", "Il n'y a ni phases, ni ce seuil, ni cette norme. La vraie est l'ETDA ขมธอ. 3-2560. La même page écrit ailleurs que le régime reste volontaire, se contredisant."],
               ["D'où vient le chiffre", "1,8 milliard de bahts paraît une corruption du seuil d'assujettissement de 1,8 million — un facteur mille, sur le chiffre même qui décide du champ d'application."],
               ["Pourquoi nous l'imprimons", "C'est la troisième page d'éditeur ce mois-ci publiant une obligation qui n'a jamais existé, après la date fantôme de mars 2026 au Botswana et le système e-Procurement « obligatoire » de Hong Kong."]]}},
 {"t": {"en": "🔍 What we could not confirm", "es": "🔍 Lo que no pudimos confirmar",
        "de": "🔍 Was wir nicht bestätigen konnten", "fr": "🔍 Ce que nous n'avons pas pu confirmer"},
  "r": {"en": [["The Royal Gazette, at all", "ratchakitcha.soc.go.th refused automated access, so no promulgation on this page was read in the Gazette itself. Every date comes from a Revenue-Department-hosted PDF or index."],
               ["The \"Digital Tax Ecosystem 2028\" roadmap", "Large companies by 2025, all taxpayers by 2028. It appears only in vendor commentary; no Revenue Department page states it. Treat it as unverified, and never as a schedule."],
               ["Mandatory e-filing of withholding tax returns", "Reported from January 2025 by one advisory blog, and not found on the Department's own site. We do not publish it as established."],
               ["Government procurement", "The Comptroller General's e-GP platform was not examined. If it carries its own contractual expectations for suppliers, the B2G answer here would move to voluntary — not to active."],
               ["The statutory VAT rate behind the 7 per cent", "Widely stated as 10 per cent reduced by decree. We did not read the Revenue Code section that sets it."]],
        "es": [["El Boletín Oficial, en absoluto", "ratchakitcha.soc.go.th rechazó el acceso automatizado, así que ninguna promulgación de esta página se leyó allí. Todas las fechas proceden de PDF o índices del propio Departamento."],
               ["La hoja de ruta «Digital Tax Ecosystem 2028»", "Grandes empresas para 2025 y todos los contribuyentes para 2028. Solo aparece en comentarios de proveedores; ninguna página del Departamento la enuncia. Trátela como no verificada."],
               ["La presentación electrónica obligatoria de retenciones", "Un blog asesor la sitúa desde enero de 2025 y no se halló en el sitio del Departamento. No la publicamos como establecida."],
               ["La contratación pública", "No se examinó la plataforma e-GP del Contralor General. Si impusiera expectativas contractuales a los proveedores, la respuesta B2G pasaría a voluntaria, no a activa."],
               ["El tipo legal del IVA tras el 7 %", "Se dice comúnmente que es del 10 % reducido por decreto. No leímos el artículo del Código Fiscal que lo fija."]],
        "de": [["Der Staatsanzeiger, überhaupt", "ratchakitcha.soc.go.th verweigerte den automatisierten Zugriff; keine Verkündung dieser Seite wurde dort gelesen. Alle Daten stammen aus PDFs oder Verzeichnissen der Steuerbehörde."],
               ["Der Fahrplan «Digital Tax Ecosystem 2028»", "Grossunternehmen bis 2025, alle Steuerpflichtigen bis 2028. Er erscheint nur in Anbieterkommentaren; keine Seite der Behörde nennt ihn. Als unbestätigt behandeln, nie als Zeitplan."],
               ["Die Pflicht zur elektronischen Quellensteuererklärung", "Von einem Beratungsblog ab Januar 2025 berichtet und auf der Behördenseite nicht auffindbar. Wir veröffentlichen sie nicht als gesichert."],
               ["Die öffentliche Beschaffung", "Die e-GP-Plattform des Comptroller General wurde nicht untersucht. Trüge sie eigene vertragliche Erwartungen, würde die B2G-Antwort hier freiwillig lauten — nicht aktiv."],
               ["Der gesetzliche MWST-Satz hinter den 7 Prozent", "Weithin mit 10 Prozent angegeben, per Dekret gesenkt. Den festlegenden Abschnitt der Abgabenordnung haben wir nicht gelesen."]],
        "fr": [["Le Journal officiel, tout simplement", "ratchakitcha.soc.go.th a refusé l'accès automatisé : aucune promulgation de cette page n'y a été lue. Toutes les dates viennent de PDF ou d'index hébergés par l'administration fiscale."],
               ["La feuille de route « Digital Tax Ecosystem 2028 »", "Grandes entreprises d'ici 2025, tous les contribuables d'ici 2028. Elle ne figure que dans des commentaires d'éditeurs ; aucune page de l'administration ne l'énonce. À tenir pour non vérifiée."],
               ["La télédéclaration obligatoire des retenues", "Rapportée à compter de janvier 2025 par un blog de conseil et introuvable sur le site de l'administration. Nous ne la publions pas comme établie."],
               ["La commande publique", "La plateforme e-GP du Comptroller General n'a pas été examinée. Si elle portait ses propres attentes contractuelles, la réponse B2G deviendrait volontaire — non active."],
               ["Le taux légal de TVA derrière les 7 %", "Communément donné à 10 %, réduit par décret. Nous n'avons pas lu l'article du Code des impôts qui le fixe."]]}},
]

STEPS = [
 {"en": ("Establish that nothing obliges you", "Both routes are voluntary in the words of their own instruments — clause 12 of Announcement No. 15 lets you choose electronic or paper per transaction. Write that down with the citation, because a vendor page may tell your team otherwise."),
  "es": ("Establezca que nada le obliga", "Ambas vías son voluntarias según sus propios instrumentos: la cláusula 12 del anuncio n.º 15 permite elegir electrónico o papel en cada operación. Déjelo por escrito con la cita, porque alguna página de proveedor dirá lo contrario."),
  "de": ("Stellen Sie fest, dass nichts Sie zwingt", "Beide Wege sind nach dem Wortlaut ihrer eigenen Instrumente freiwillig — Ziffer 12 der Bekanntmachung Nr. 15 lässt Ihnen je Geschäftsvorfall die Wahl. Halten Sie das mit Fundstelle fest; eine Anbieterseite wird Ihrem Team etwas anderes sagen."),
  "fr": ("Établissez que rien ne vous oblige", "Les deux voies sont volontaires selon leurs propres instruments — la clause 12 de l'annonce n° 15 vous laisse choisir par opération. Consignez-le avec la référence : une page d'éditeur dira le contraire à votre équipe.")},
 {"en": ("Pick a route on the THB 30 million line", "Below it, the e-mail route needs no certificate, no XML and no monthly send. Above it, only the full system is open. You cannot be on both, so decide before you build anything."),
  "es": ("Elija vía en la línea de los 30 millones de baht", "Por debajo, la vía por correo no exige certificado, ni XML, ni envío mensual. Por encima, solo queda el sistema completo. No se puede estar en ambas: decida antes de construir nada."),
  "de": ("Wählen Sie den Weg an der Grenze von 30 Millionen Baht", "Darunter braucht der E-Mail-Weg weder Zertifikat noch XML noch monatliche Sendung. Darüber bleibt nur das volle System. Beides zugleich geht nicht — entscheiden Sie vor dem Bauen."),
  "fr": ("Choisissez votre voie sur la ligne des 30 millions de bahts", "En dessous, la voie par courriel n'exige ni certificat, ni XML, ni envoi mensuel. Au-dessus, seul le système complet reste. Les deux sont exclusives : décidez avant de construire.")},
 {"en": ("If you take the full route, budget the certificate", "An enterprise certificate under the National Root CA on a token or an HSM at FIPS 140-2 Level 3 or above, plus XAdES signing and a monthly XML send by the fifteenth. That is the real cost of this route."),
  "es": ("Si va al sistema completo, presupueste el certificado", "Un certificado de empresa bajo la CA raíz nacional en token o HSM con FIPS 140-2 nivel 3 o superior, más firma XAdES y envío mensual del XML antes del día quince. Ese es el coste real de esta vía."),
  "de": ("Beim vollen Weg das Zertifikat einplanen", "Ein Unternehmenszertifikat unter der nationalen Root-CA auf Token oder HSM nach FIPS 140-2 Level 3 oder höher, dazu XAdES-Signatur und monatliche XML-Sendung bis zum Fünfzehnten. Das ist der wirkliche Aufwand."),
  "fr": ("Si vous prenez la voie complète, budgétez le certificat", "Un certificat d'entreprise sous l'AC racine nationale sur jeton ou HSM au niveau FIPS 140-2 3 ou plus, plus la signature XAdES et l'envoi mensuel du XML avant le quinze. C'est le coût réel de cette voie.")},
 {"en": ("Do not build to the vendor roadmap", "The 2025 and 2028 milestones circulating in commentary appear in no Revenue Department source. Building a mandate-shaped project against unsourced dates is how budgets get spent on obligations that never arrive."),
  "es": ("No construya según la hoja de ruta de los proveedores", "Los hitos de 2025 y 2028 que circulan en los comentarios no aparecen en ninguna fuente del Departamento. Montar un proyecto con forma de mandato sobre fechas sin fuente es como se gasta presupuesto en obligaciones que nunca llegan."),
  "de": ("Bauen Sie nicht nach dem Anbieter-Fahrplan", "Die in Kommentaren kursierenden Meilensteine 2025 und 2028 stehen in keiner Quelle der Steuerbehörde. Ein pflichtförmiges Projekt gegen unbelegte Daten zu bauen, ist der Weg, Budget für nie eintreffende Pflichten auszugeben."),
  "fr": ("Ne construisez pas selon la feuille de route des éditeurs", "Les jalons 2025 et 2028 qui circulent dans les commentaires ne figurent dans aucune source de l'administration. Monter un projet en forme d'obligation sur des dates non sourcées, c'est ainsi qu'on dépense un budget pour des obligations qui n'arrivent jamais.")},
 {"en": ("Treat the 2026 deduction as pending, not granted", "The Cabinet approved it in June 2026 and no Royal Decree has appeared. Keep the invoices and the ETDA assessment fees documented, and check the Department's decree index before you rely on the relief."),
  "es": ("Trate la deducción de 2026 como pendiente, no concedida", "El Consejo de Ministros la aprobó en junio de 2026 y no ha aparecido decreto real. Conserve documentadas las facturas y los honorarios de evaluación de ETDA, y consulte el índice de decretos antes de contar con el beneficio."),
  "de": ("Den Abzug 2026 als offen behandeln, nicht als gewährt", "Das Kabinett billigte ihn im Juni 2026, ein Königliches Dekret ist nicht erschienen. Halten Sie Rechnungen und ETDA-Prüfungshonorare dokumentiert und prüfen Sie das Dekretverzeichnis, bevor Sie auf die Entlastung bauen."),
  "fr": ("Tenez la déduction 2026 pour pendante, non acquise", "Le Conseil des ministres l'a approuvée en juin 2026 et aucun décret royal n'est paru. Conservez les factures et les honoraires d'évaluation de l'ETDA documentés, et consultez l'index des décrets avant de compter sur l'allègement.")},
 {"en": ("Keep five years, and know it is not ten", "Revenue Code s.87/3 sets five years from filing, extendable by the Director-General to no more than seven. Electronic retention is expressly permitted, provided meaning, reproducibility and metadata survive."),
  "es": ("Conserve cinco años, y sepa que no son diez", "El art. 87/3 del Código Fiscal fija cinco años desde la presentación, ampliables por el Director General hasta un máximo de siete. La conservación electrónica está expresamente permitida si se preservan sentido, reproducibilidad y metadatos."),
  "de": ("Fünf Jahre aufbewahren, und wissen, dass es nicht zehn sind", "Art. 87/3 der Abgabenordnung setzt fünf Jahre ab Abgabe, vom Generaldirektor auf höchstens sieben verlängerbar. Elektronische Aufbewahrung ist ausdrücklich zulässig, sofern Sinn, Reproduzierbarkeit und Metadaten erhalten bleiben."),
  "fr": ("Conservez cinq ans, en sachant que ce n'est pas dix", "L'art. 87/3 du Code des impôts fixe cinq ans à compter du dépôt, portés par le Directeur général à sept au plus. La conservation électronique est expressément admise si le sens, la reproductibilité et les métadonnées subsistent.")},
]

PORTALS = [
 ("https://www.rd.go.th/27659.html", {"en": "Revenue Department — e-Tax Invoice by email", "es": "Hacienda — factura electrónica por correo", "de": "Steuerbehörde — E-Rechnung per E-Mail", "fr": "Fisc — facture électronique par courriel"}),
 ("https://www.rd.go.th/1603.html", {"en": "Revenue Department — Royal Decree index", "es": "Hacienda — índice de decretos reales", "de": "Steuerbehörde — Verzeichnis der Dekrete", "fr": "Fisc — index des décrets royaux"}),
 ("https://www.etda.or.th/", {"en": "ETDA — the XML standard and time stamp", "es": "ETDA — el estándar XML y el sello de tiempo", "de": "ETDA — XML-Standard und Zeitstempel", "fr": "ETDA — la norme XML et l'horodatage"}),
]

# ---- refuse to emit anything the framework would reject ---------------
problems = []
for lang in LANGS:
    for field, (unit, lo, hi) in BANDS.items():
        v = PAGE[lang][field]
        n = len(v) if unit == "chars" else words(v)
        cap = hi if lang == "en" else int(hi * LANG_ALLOWANCE)
        if n > cap: problems.append(f"{field}/{lang}: {n} {unit} > {cap}")
        if lang == "en" and n < lo: problems.append(f"{field}/en: {n} {unit} < soft minimum {lo}")
if len(SEC2) != 4: problems.append(f"section 02 must be the four-card spine, got {len(SEC2)}")
if not (2 <= len(SEC3) <= 4): problems.append(f"section 03 has {len(SEC3)} cards, framework wants 2-4")
if not (3 <= len(SEC5) <= 4): problems.append(f"section 05 has {len(SEC5)} cards, framework wants 3-4")
if not (5 <= len(STEPS) <= 7): problems.append(f"{len(STEPS)} steps, framework wants 5-7")
if not (3 <= len(STATS) <= 5): problems.append(f"{len(STATS)} stats, framework wants 3-5")
if not (1 <= len(PORTALS) <= 3): problems.append(f"{len(PORTALS)} portals, framework wants 1-3")
for _u, labels in PORTALS:
    for lang in LANGS:
        cap = 48 if lang == "en" else 72
        if len(labels[lang]) > cap: problems.append(f"portal label/{lang}: {len(labels[lang])} > {cap} — {labels[lang]}")
for i, card in enumerate(SEC2):
    for lang in LANGS:
        if len(card[lang]) != len(card["en"]):
            problems.append(f"section 02 card {i}/{lang}: {len(card[lang])} rows, English has {len(card['en'])}")
if problems:
    sys.stderr.write("REFUSING TO EMIT — DEEP-DIVE-FRAMEWORK.md would reject this page:\n  "
                     + "\n  ".join(problems) + "\n")
    sys.exit(1)

out = []; w = out.append
w("-- Thailand deep dive. GENERATED by gen_thailand_deep_dive.py -- edit")
w("-- the generator, which refuses to emit a page DEEP-DIVE-FRAMEWORK.md")
w("-- would reject. First country built to the framework rather than")
w("-- retrofitted onto it.")
w("")
w("INSERT OR IGNORE INTO deep_dive_pages (country_id, last_updated) SELECT id, '2026-08-27' FROM countries WHERE code = 'TH';")
w("")
for lang in LANGS:
    p = PAGE[lang]
    w("INSERT OR IGNORE INTO deep_dive_page_translations (country_id, lang, compliance_model, footer_disclaimer,"
      " timeline_intro, file_format_intro, scope_intro, steps_intro, penalties_intro, mandate_summary, mandate_summary_icon)")
    w(f"SELECT id, '{lang}', {lit(p['compliance_model'])}, {lit(p['footer_disclaimer'])}, {lit(p['timeline_intro'])},"
      f" {lit(p['file_format_intro'])}, {lit(p['scope_intro'])}, {lit(p['steps_intro'])}, {lit(p['penalties_intro'])},"
      f" {lit(p['mandate_summary'])}, {lit(p['mandate_summary_icon'])} FROM countries WHERE code = 'TH';")
    w("")
w("-- ---- stat strip ----")
for i, s in enumerate(STATS):
    w(f"INSERT INTO deep_dive_stats (country_id, sort_order) SELECT c.id, {i} FROM countries c WHERE c.code = 'TH'")
    w(f"  AND NOT EXISTS (SELECT 1 FROM deep_dive_stats d WHERE d.country_id = c.id AND d.sort_order = {i});")
    for lang in LANGS:
        v, l = s[lang]
        w("INSERT OR IGNORE INTO deep_dive_stat_translations (stat_id, lang, stat_value, stat_label)")
        w(f"SELECT d.id, '{lang}', {lit(v)}, {lit(l)} FROM deep_dive_stats d WHERE d.country_id = {CID} AND d.sort_order = {i};")
    w("")
w("-- ---- section 02: the framework spine, in order ----")
for i, card in enumerate(SEC2):
    w(f"INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT c.id, 'file_format', {i} FROM countries c WHERE c.code = 'TH'")
    w(f"  AND NOT EXISTS (SELECT 1 FROM deep_dive_cards d WHERE d.country_id = c.id AND d.section = 'file_format' AND d.sort_order = {i});")
    for lang in LANGS:
        w("INSERT OR IGNORE INTO deep_dive_card_translations (card_id, lang, title, rows_json)")
        w(f"SELECT d.id, '{lang}', {lit(SPINE[i][lang])}, {lit(json.dumps(card[lang], ensure_ascii=False))}"
          f" FROM deep_dive_cards d WHERE d.country_id = {CID} AND d.section = 'file_format' AND d.sort_order = {i};")
    w("")
for sec, cards in (("scope_transmission", SEC3), ("penalties_related", SEC5)):
    w(f"-- ---- section {sec} ----")
    for i, c in enumerate(cards):
        w(f"INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT co.id, '{sec}', {i} FROM countries co WHERE co.code = 'TH'")
        w(f"  AND NOT EXISTS (SELECT 1 FROM deep_dive_cards d WHERE d.country_id = co.id AND d.section = '{sec}' AND d.sort_order = {i});")
        for lang in LANGS:
            w("INSERT OR IGNORE INTO deep_dive_card_translations (card_id, lang, title, rows_json)")
            w(f"SELECT d.id, '{lang}', {lit(c['t'][lang])}, {lit(json.dumps(c['r'][lang], ensure_ascii=False))}"
              f" FROM deep_dive_cards d WHERE d.country_id = {CID} AND d.section = '{sec}' AND d.sort_order = {i};")
        w("")
w("-- ---- steps ----")
for i, s in enumerate(STEPS):
    w(f"INSERT INTO deep_dive_steps (country_id, sort_order) SELECT c.id, {i} FROM countries c WHERE c.code = 'TH'")
    w(f"  AND NOT EXISTS (SELECT 1 FROM deep_dive_steps d WHERE d.country_id = c.id AND d.sort_order = {i});")
    for lang in LANGS:
        t, d = s[lang]
        w("INSERT OR IGNORE INTO deep_dive_step_translations (step_id, lang, title, description)")
        w(f"SELECT s.id, '{lang}', {lit(t)}, {lit(d)} FROM deep_dive_steps s WHERE s.country_id = {CID} AND s.sort_order = {i};")
    w("")
w("-- ---- portals ----")
for i, (url, labels) in enumerate(PORTALS):
    w(f"INSERT INTO deep_dive_portals (country_id, url, sort_order) SELECT c.id, {lit(url)}, {i} FROM countries c WHERE c.code = 'TH'")
    w(f"  AND NOT EXISTS (SELECT 1 FROM deep_dive_portals d WHERE d.country_id = c.id AND d.url = {lit(url)});")
    for lang in LANGS:
        w("INSERT OR IGNORE INTO deep_dive_portal_translations (portal_id, lang, label)")
        w(f"SELECT p.id, '{lang}', {lit(labels[lang])} FROM deep_dive_portals p WHERE p.country_id = {CID} AND p.url = {lit(url)};")
    w("")
w("-- ---- what this migration claims it did ----")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_pages WHERE country_id = {CID} = 1")
for lang in LANGS:
    w(f"-- ASSERT: SELECT count(*) FROM deep_dive_page_translations WHERE country_id = {CID} AND lang = '{lang}' = 1")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_stats WHERE country_id = {CID} = {len(STATS)}")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_cards WHERE country_id = {CID} AND section = 'file_format' = {len(SEC2)}")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_cards WHERE country_id = {CID} AND section = 'scope_transmission' = {len(SEC3)}")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_cards WHERE country_id = {CID} AND section = 'penalties_related' = {len(SEC5)}")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_steps WHERE country_id = {CID} = {len(STEPS)}")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_portals WHERE country_id = {CID} = {len(PORTALS)}")
w("-- The spine, in order. Asserted against literals rather than against a")
w("-- variable this file also wrote -- migration 700 made that mistake and")
w("-- the assertion passed while the title was renamed underneath it.")
for i, s in enumerate(("Format & standard", "Identifiers & registration", "Mandatory content", "Archiving")):
    w(f"-- ASSERT: SELECT t.title FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id"
      f" WHERE d.country_id = {CID} AND d.section = 'file_format' AND d.sort_order = {i} AND t.lang = 'en' = {lit(s)}")
w("-- The compliance model must survive the compliance guide's 64-char clip:")
w(f"-- ASSERT: SELECT length(compliance_model) FROM deep_dive_page_translations WHERE country_id = {CID} AND lang = 'en' <= 64")
w("-- Every card carries rows; renderRelatedCard printed \"null\" without them.")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id"
  f" WHERE d.country_id = {CID} AND (t.rows_json IS NULL OR json_array_length(t.rows_json) = 0) = 0")
print("\n".join(out))
