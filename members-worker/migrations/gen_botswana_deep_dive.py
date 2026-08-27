#!/usr/bin/env python3
"""gen_botswana_deep_dive.py — emits 660_botswana_deep_dive.sql.

Edit this file, not the SQL it writes. Run:
    python3 gen_botswana_deep_dive.py > 660_botswana_deep_dive.sql

WHY THIS PAGE READS THE WAY IT DOES
-----------------------------------
Botswana's obligation is real and on the statute book, and it is NOT in
force. Section 15 of the Tax Administration Act, 2026 (Act 14 of 2026)
requires a taxpayer to issue an electronic invoice through an electronic
billing system; section 1 defers the Act's own commencement to a
Ministerial Order, and ENSafrica reads the Act as starting the billing
system nine months after commencement -- approximately 1 April 2027. No
gazetted Order fixing a calendar date has been found.

THE PAGE HAS TO SAY WHY A READER MAY HAVE SEEN MARCH 2026, because most
of them will have. The 2025/26 Budget Speech said the system would "be
implemented by March 2026, subject to supporting legislation" -- a target
for BURS to finish BUILDING its system, expressly conditional on a law
that did not then exist. Vendor compliance pages dropped both qualifiers
and have carried "mandatory from March 2026" ever since; several still
did in August 2026, five months after the date passed with no BURS
notice, no accredited-device list and no enforcement. Correcting that in
a card is not editorialising, it is the single most useful thing this
page can tell a reader who arrives holding the wrong date.

The free-form stat strip deliberately carries NOTHING the headline tiles
above it already state -- no mandate statuses, no archiving years, no
signature. It carries the VAT rate, the registration threshold that
decides who is in scope, and the monthly penalty. That is the division
migrations 643-648 established.
"""

LANGS = ("en", "es", "de", "fr")

def esc(s):
    return s.replace("'", "''")

def lit(s):
    return "NULL" if s is None else "'" + esc(s) + "'"

CID = "(SELECT id FROM countries WHERE code = 'BW')"

# ---------------------------------------------------------------- page ----
PAGE = {
"en": dict(
compliance_model="Legislated, not in force. The Tax Administration Act 2026 requires an electronic invoice issued through an electronic billing system, with approved devices transmitting receipt data to BURS in real time. Commencement is deferred and expected around April 2027.",
mandate_summary="Botswana has legislated mandatory electronic billing for VAT-registered persons but has not started it. Section 15 of the Tax Administration Act 2026 creates the duty; commencement runs nine months from the Act's own start of 1 July 2026, so approximately April 2027. No commencement Order has been gazetted and no technical specification published.",
mandate_summary_icon="🇧🇼",
timeline_intro="Botswana's path is a sequence of announcements that moved before the law arrived. BURS announced e-billing as a three-year project in February 2024; a pilot ran into 2025; the 2025/26 Budget Speech targeted March 2026 for the system, subject to legislation; the 2026 Budget Speech anticipated an April 2026 rollout. Neither happened. The legislation finally arrived on 30 June 2026, and it defers the obligation again.",
file_format_intro="There is no published specification. BURS has not issued a format, a transmission protocol, a device accreditation list, or guidance on whether the model is clearance or post-transaction reporting. What is known comes from the statute and from the language of the VAT (Amendment) Act 2025, which points at physical fiscal devices, and the Tax Administration Act 2026, which speaks of an electronic billing system. How those two fit together has not been explained.",
scope_intro="Scope follows the supplier, not the customer. The duty attaches to a VAT-registered person issuing a receipt or tax invoice, whoever the counterparty is, which is why this site records B2G, B2B and B2C at the same status and the same date rather than as three separate instruments. The VAT registration threshold is P1,000,000 of annual taxable supplies. BURS has said the rollout will be phased rather than nationwide on day one.",
steps_intro="Nothing is required of a Botswana taxpayer today. The useful work before commencement is knowing whether you are in scope, watching for the Order that fixes the date, and asking your billing vendor a question it may not yet be able to answer.",
penalties_intro="The penalties are legislated and substantial, and they attach to the device rather than to the invoice: billing outside authorised equipment carries a monthly penalty, and tampering or issuing false receipts is a criminal matter. None of it bites until commencement.",
footer_disclaimer="This page reflects the Tax Administration Act 2026 (Act 14 of 2026) and the VAT Act 2026 as gazetted on 30 June 2026, read alongside the 2026 Budget Speech, Botswana Daily News reporting and briefings from ENSafrica, Andersen, KPMG and RSM. BURS has published no e-invoicing guidance that could be retrieved, so no claim here rests on one. Dates described as expected are exactly that.",
),
"es": dict(
compliance_model="Legislado, no en vigor. La Ley de Administración Tributaria de 2026 exige una factura electrónica emitida por un sistema de facturación electrónica, con equipos homologados que transmiten los datos a BURS en tiempo real. El inicio está aplazado y se espera hacia abril de 2027.",
mandate_summary="Botsuana ha legislado la facturación electrónica obligatoria para los inscritos en el IVA, pero no la ha puesto en marcha. El artículo 15 de la Ley de Administración Tributaria de 2026 crea la obligación; su inicio corre nueve meses desde la entrada en vigor de la Ley el 1 de julio de 2026, es decir, hacia abril de 2027. No se ha publicado ninguna orden de entrada en vigor ni especificación técnica.",
mandate_summary_icon="🇧🇼",
timeline_intro="El camino de Botsuana es una sucesión de anuncios que se movieron antes de que llegara la ley. BURS anunció la facturación electrónica como proyecto a tres años en febrero de 2024; un piloto se prolongó hasta 2025; el Presupuesto 2025/26 fijó marzo de 2026 para el sistema, supeditado a la legislación; el Presupuesto 2026 preveía un despliegue en abril de 2026. Ninguno se cumplió. La ley llegó el 30 de junio de 2026 y vuelve a aplazar la obligación.",
file_format_intro="No hay especificación publicada. BURS no ha emitido formato, protocolo de transmisión, lista de equipos homologados ni orientación sobre si el modelo es de clearance o de declaración posterior. Lo que se sabe procede de la ley y del lenguaje de la Ley de Modificación del IVA de 2025, que apunta a dispositivos fiscales físicos, y de la Ley de Administración Tributaria de 2026, que habla de un sistema de facturación electrónica. Cómo encajan ambos no se ha explicado.",
scope_intro="El alcance sigue al proveedor, no al cliente. La obligación recae en el inscrito en el IVA que emite un tique o una factura, sea quien sea la contraparte, y por eso este sitio registra B2G, B2B y B2C con el mismo estado y la misma fecha, y no como tres instrumentos distintos. El umbral de registro del IVA es de 1.000.000 de pulas de operaciones anuales. BURS ha indicado que el despliegue será por fases.",
steps_intro="Hoy no se exige nada a un contribuyente de Botsuana. El trabajo útil antes del inicio consiste en saber si está en el ámbito, vigilar la orden que fije la fecha y preguntar a su proveedor de facturación algo que quizá aún no pueda responder.",
penalties_intro="Las sanciones están legisladas y son considerables, y se vinculan al equipo más que a la factura: facturar fuera de equipos autorizados conlleva una sanción mensual, y manipularlos o emitir tiques falsos es materia penal. Nada de ello se aplica hasta el inicio.",
footer_disclaimer="Esta página refleja la Ley de Administración Tributaria de 2026 (Ley 14 de 2026) y la Ley del IVA de 2026 publicadas el 30 de junio de 2026, leídas junto con el Presupuesto 2026, la información de Botswana Daily News y los análisis de ENSafrica, Andersen, KPMG y RSM. BURS no ha publicado orientación sobre facturación electrónica que pudiera consultarse, de modo que ninguna afirmación aquí se apoya en una. Las fechas descritas como previstas son exactamente eso.",
),
"de": dict(
compliance_model="Gesetzlich geregelt, nicht in Kraft. Das Steuerverwaltungsgesetz 2026 verlangt eine elektronische Rechnung über ein E-Billing-System; zugelassene Geräte übermitteln die Belegdaten in Echtzeit an BURS. Der Start ist aufgeschoben und wird um April 2027 erwartet.",
mandate_summary="Botsuana hat die verpflichtende elektronische Abrechnung für umsatzsteuerlich registrierte Personen beschlossen, aber nicht gestartet. § 15 des Steuerverwaltungsgesetzes 2026 begründet die Pflicht; der Start läuft neun Monate ab dem Inkrafttreten des Gesetzes am 1. Juli 2026, also etwa April 2027. Weder eine Inkrafttretensanordnung noch eine technische Spezifikation wurde veröffentlicht.",
mandate_summary_icon="🇧🇼",
timeline_intro="Botsuanas Weg ist eine Folge von Ankündigungen, die sich bewegten, bevor das Gesetz kam. BURS kündigte E-Billing im Februar 2024 als Dreijahresprojekt an; ein Pilot lief bis 2025; die Haushaltsrede 2025/26 nannte März 2026 für das System, vorbehaltlich der Gesetzgebung; die Haushaltsrede 2026 erwartete einen Rollout im April 2026. Nichts davon geschah. Das Gesetz kam am 30. Juni 2026 und schiebt die Pflicht erneut auf.",
file_format_intro="Es gibt keine veröffentlichte Spezifikation. BURS hat weder Format noch Übertragungsprotokoll, weder eine Liste zugelassener Geräte noch Hinweise darauf herausgegeben, ob das Modell Clearance oder nachgelagerte Meldung ist. Bekannt ist nur, was im Gesetz steht, dazu die Sprache des Umsatzsteueränderungsgesetzes 2025, das auf physische Fiskalgeräte deutet, und des Steuerverwaltungsgesetzes 2026, das von einem E-Billing-System spricht. Wie beides zusammenpasst, wurde nicht erklärt.",
scope_intro="Der Anwendungsbereich folgt dem Lieferanten, nicht dem Kunden. Die Pflicht trifft die registrierte Person, die einen Beleg oder eine Rechnung ausstellt, unabhängig von der Gegenseite. Deshalb führt diese Seite B2G, B2B und B2C mit gleichem Status und gleichem Datum und nicht als drei getrennte Regelungen. Die Registrierungsschwelle liegt bei 1.000.000 Pula Jahresumsatz. BURS hat einen stufenweisen Rollout angekündigt.",
steps_intro="Von einem Steuerpflichtigen in Botsuana wird heute nichts verlangt. Die sinnvolle Arbeit vor dem Start besteht darin, den eigenen Anwendungsbereich zu kennen, auf die Anordnung mit dem Datum zu achten und dem Abrechnungsanbieter eine Frage zu stellen, die er womöglich noch nicht beantworten kann.",
penalties_intro="Die Sanktionen sind gesetzlich geregelt und erheblich, und sie knüpfen eher am Gerät als an der Rechnung an: Abrechnung außerhalb zugelassener Geräte zieht eine monatliche Strafe nach sich, Manipulation oder falsche Belege sind strafrechtlich relevant. Nichts davon greift vor dem Start.",
footer_disclaimer="Diese Seite gibt das Steuerverwaltungsgesetz 2026 (Gesetz 14 von 2026) und das Umsatzsteuergesetz 2026 in der am 30. Juni 2026 verkündeten Fassung wieder, gelesen zusammen mit der Haushaltsrede 2026, Berichten von Botswana Daily News und Analysen von ENSafrica, Andersen, KPMG und RSM. BURS hat keine abrufbaren Hinweise zur elektronischen Rechnungsstellung veröffentlicht, sodass hier keine Aussage darauf beruht. Als erwartet bezeichnete Daten sind genau das.",
),
"fr": dict(
compliance_model="Légiféré, non entré en vigueur. La loi de 2026 sur l'administration fiscale impose une facture électronique émise par un système de facturation électronique, des appareils agréés transmettant les données à BURS en temps réel. Le démarrage est différé et attendu autour d'avril 2027.",
mandate_summary="Le Botswana a légiféré la facturation électronique obligatoire pour les assujettis à la TVA sans l'avoir lancée. L'article 15 de la loi de 2026 sur l'administration fiscale crée l'obligation ; son démarrage court neuf mois à compter de l'entrée en vigueur de la loi le 1er juillet 2026, soit environ avril 2027. Aucun arrêté d'entrée en vigueur ni spécification technique n'a été publié.",
mandate_summary_icon="🇧🇼",
timeline_intro="Le parcours du Botswana est une suite d'annonces qui ont bougé avant l'arrivée de la loi. BURS a annoncé la facturation électronique comme un projet sur trois ans en février 2024 ; un pilote s'est prolongé jusqu'en 2025 ; le budget 2025/26 visait mars 2026 pour le système, sous réserve de législation ; le budget 2026 attendait un déploiement en avril 2026. Rien de tout cela n'a eu lieu. La loi est arrivée le 30 juin 2026 et repousse encore l'obligation.",
file_format_intro="Aucune spécification n'est publiée. BURS n'a diffusé ni format, ni protocole de transmission, ni liste d'appareils agréés, ni indication sur le caractère de clearance ou de déclaration postérieure du modèle. Ce que l'on sait vient du texte, ainsi que du vocabulaire de la loi modificative TVA de 2025, qui évoque des appareils fiscaux physiques, et de la loi de 2026, qui parle d'un système de facturation électronique. L'articulation des deux n'a pas été expliquée.",
scope_intro="Le champ suit le fournisseur, non le client. L'obligation pèse sur l'assujetti qui émet un reçu ou une facture, quelle que soit la contrepartie, et c'est pourquoi ce site enregistre B2G, B2B et B2C au même statut et à la même date plutôt que comme trois dispositifs distincts. Le seuil d'assujettissement est de 1 000 000 de pulas de livraisons annuelles. BURS a indiqué un déploiement par étapes.",
steps_intro="Rien n'est exigé aujourd'hui d'un contribuable botswanais. Le travail utile avant le démarrage consiste à savoir si vous êtes dans le champ, à guetter l'arrêté qui fixera la date et à poser à votre éditeur de facturation une question à laquelle il ne peut peut-être pas encore répondre.",
penalties_intro="Les sanctions sont légiférées et lourdes, et elles se rattachent à l'appareil plutôt qu'à la facture : facturer hors d'un équipement autorisé entraîne une pénalité mensuelle, et l'altération ou l'émission de faux reçus relève du pénal. Rien ne s'applique avant le démarrage.",
footer_disclaimer="Cette page reflète la loi de 2026 sur l'administration fiscale (loi 14 de 2026) et la loi TVA de 2026 publiées le 30 juin 2026, lues avec le budget 2026, les articles de Botswana Daily News et les analyses d'ENSafrica, Andersen, KPMG et RSM. BURS n'a publié aucune orientation consultable sur la facturation électronique, de sorte qu'aucune affirmation ici ne s'y appuie. Les dates dites attendues le sont bien.",
),
}

# --------------------------------------------------------------- stats ----
# Nothing here restates a headline tile: no mandate status, no archiving
# years, no signature. Rate, threshold, penalty.
STATS = [
  {"en": ("14%", "Standard VAT rate"),
   "es": ("14 %", "Tipo general del IVA"),
   "de": ("14 %", "Regulärer Umsatzsteuersatz"),
   "fr": ("14 %", "Taux normal de TVA")},
  {"en": ("P1,000,000", "VAT registration threshold — the line that decides who the mandate will cover"),
   "es": ("1.000.000 P", "Umbral de registro del IVA: la línea que decidirá a quién alcanza la obligación"),
   "de": ("1.000.000 P", "Registrierungsschwelle — die Linie, die entscheidet, wen die Pflicht erfasst"),
   "fr": ("1 000 000 P", "Seuil d'assujettissement à la TVA — la ligne qui décidera du champ")},
  {"en": ("P10,000", "Monthly penalty for billing outside authorised equipment, once in force"),
   "es": ("10.000 P", "Sanción mensual por facturar fuera de equipos autorizados, una vez en vigor"),
   "de": ("10.000 P", "Monatliche Strafe für Abrechnung außerhalb zugelassener Geräte, ab Inkrafttreten"),
   "fr": ("10 000 P", "Pénalité mensuelle pour facturation hors équipement autorisé, une fois en vigueur")},
]

# --------------------------------------------------------------- cards ----
CARDS = [
 dict(section="scope_transmission", sort=0, t={
   "en": ("Who will have to comply", [
     ["VAT-registered persons", "The duty in section 15 attaches to the taxpayer issuing the receipt or tax invoice, at any threshold above P1,000,000 of annual taxable supplies."],
     ["Government bodies", "Captured as VAT-registered persons rather than by a separate B2G rule. Government entities began registering and self-accounting under reverse charge on 1 August 2026."],
     ["Below the threshold", "Not addressed in the Act. BURS has signalled a phased rollout, and smaller businesses being brought in later or left out entirely is the pattern its own commentary describes."],
   ]),
   "es": ("Quién deberá cumplir", [
     ["Inscritos en el IVA", "La obligación del artículo 15 recae en el contribuyente que emite el tique o la factura, por encima de 1.000.000 de pulas de operaciones anuales."],
     ["Entidades públicas", "Alcanzadas como inscritos en el IVA, no por una norma B2G aparte. Empezaron a registrarse y a autoliquidar por inversión del sujeto pasivo el 1 de agosto de 2026."],
     ["Por debajo del umbral", "No se aborda en la ley. BURS ha señalado un despliegue por fases, y que las empresas menores entren después o queden fuera es lo que describe su propio discurso."],
   ]),
   "de": ("Wer betroffen sein wird", [
     ["Registrierte Personen", "Die Pflicht aus § 15 trifft den Steuerpflichtigen, der den Beleg oder die Rechnung ausstellt, oberhalb von 1.000.000 Pula Jahresumsatz."],
     ["Behörden", "Erfasst als registrierte Personen, nicht durch eine eigene B2G-Regel. Sie begannen am 1. August 2026 mit Registrierung und Reverse-Charge-Abrechnung."],
     ["Unter der Schwelle", "Im Gesetz nicht geregelt. BURS hat einen stufenweisen Rollout angedeutet; dass kleinere Unternehmen später oder gar nicht erfasst werden, entspricht den eigenen Aussagen."],
   ]),
   "fr": ("Qui devra se conformer", [
     ["Assujettis à la TVA", "L'obligation de l'article 15 pèse sur le contribuable qui émet le reçu ou la facture, au-delà de 1 000 000 de pulas de livraisons annuelles."],
     ["Entités publiques", "Visées en tant qu'assujettis, non par une règle B2G distincte. Elles ont commencé à s'enregistrer et à autoliquider le 1er août 2026."],
     ["Sous le seuil", "Non traité par la loi. BURS a annoncé un déploiement par étapes, et l'entrée plus tardive ou l'exclusion des plus petites entreprises est ce que décrivent ses propres propos."],
   ]),
 }),
 dict(section="scope_transmission", sort=1, t={
   "en": ("⚠️ If you have seen a March 2026 date", [
     ["Where it came from", "The 2025/26 Budget Speech said the system would be implemented by March 2026, subject to supporting legislation. That was a target for BURS to finish building its system, and it was conditional."],
     ["What happened to it", "The legislation did not exist by then. Botswana's government news service reported the Bill still before Parliament on 8 April 2026; the Act was gazetted on 30 June 2026 and defers the billing system a further nine months."],
     ["Why it is still circulating", "Several compliance vendors published the date in 2025 without its conditions and have not revised the pages since. As of August 2026 there is no BURS notice, no accredited-device list and no enforcement — five months after the date passed."],
   ]),
   "es": ("⚠️ Si ha visto una fecha de marzo de 2026", [
     ["De dónde viene", "El Presupuesto 2025/26 dijo que el sistema se implantaría para marzo de 2026, supeditado a la legislación de apoyo. Era un objetivo para que BURS terminara de construir su sistema, y era condicional."],
     ["Qué pasó con ella", "La legislación no existía entonces. El servicio de noticias del Gobierno informó el 8 de abril de 2026 de que el proyecto seguía en el Parlamento; la ley se publicó el 30 de junio de 2026 y aplaza el sistema otros nueve meses."],
     ["Por qué sigue circulando", "Varios proveedores publicaron la fecha en 2025 sin sus condiciones y no han revisado las páginas. En agosto de 2026 no hay aviso de BURS, ni lista de equipos homologados, ni sanciones: cinco meses después de la fecha."],
   ]),
   "de": ("⚠️ Falls Sie ein Datum im März 2026 gesehen haben", [
     ["Woher es stammt", "Die Haushaltsrede 2025/26 sagte, das System werde bis März 2026 umgesetzt, vorbehaltlich der unterstützenden Gesetzgebung. Das war ein Ziel für den Systembau bei BURS, und es stand unter Vorbehalt."],
     ["Was daraus wurde", "Die Gesetzgebung existierte bis dahin nicht. Der staatliche Nachrichtendienst berichtete am 8. April 2026, der Entwurf liege noch im Parlament; das Gesetz erschien am 30. Juni 2026 und schiebt das System um weitere neun Monate."],
     ["Warum es weiter kursiert", "Mehrere Anbieter veröffentlichten das Datum 2025 ohne seine Bedingungen und haben die Seiten nicht überarbeitet. Im August 2026 gibt es keine BURS-Mitteilung, keine Geräteliste, keine Durchsetzung — fünf Monate danach."],
   ]),
   "fr": ("⚠️ Si vous avez vu une date de mars 2026", [
     ["D'où elle vient", "Le budget 2025/26 indiquait que le système serait mis en œuvre d'ici mars 2026, sous réserve de la législation d'appui. C'était un objectif de construction du système par BURS, et il était conditionnel."],
     ["Ce qu'elle est devenue", "La législation n'existait pas alors. Le service d'information du gouvernement signalait le 8 avril 2026 que le projet était encore au Parlement ; la loi a paru le 30 juin 2026 et repousse le système de neuf mois de plus."],
     ["Pourquoi elle circule encore", "Plusieurs éditeurs ont publié la date en 2025 sans ses conditions et n'ont pas revu leurs pages. En août 2026, aucun avis de BURS, aucune liste d'appareils agréés, aucune sanction — cinq mois après."],
   ]),
 }),
 dict(section="file_format", sort=0, t={
   "en": ("Format and transmission — what is not yet published", [
     ["Invoice format", "Not published. No syntax, schema or content specification has been issued."],
     ["Transmission", "Approved devices transmitting receipt data directly to BURS, described in the 2026 Budget Speech as enabling real-time transaction monitoring. The protocol is not published."],
     ["Clearance or reporting", "Not stated. Whether an invoice must be cleared before issue or reported after it is the single most consequential unknown for anyone scoping an integration."],
     ["Device accreditation", "No list, no process, no vendor criteria published. The VAT (Amendment) Act 2025 points at physical fiscal devices; the Tax Administration Act 2026 speaks of an electronic billing system, and how the two relate has not been explained."],
   ]),
   "es": ("Formato y transmisión: lo que aún no se ha publicado", [
     ["Formato de factura", "Sin publicar. No se ha emitido sintaxis, esquema ni especificación de contenido."],
     ["Transmisión", "Equipos homologados que transmiten los datos del tique directamente a BURS; el Presupuesto 2026 lo describe como seguimiento de operaciones en tiempo real. El protocolo no está publicado."],
     ["Clearance o declaración", "No se indica. Si la factura debe autorizarse antes de emitirse o declararse después es la incógnita más determinante para dimensionar una integración."],
     ["Homologación de equipos", "Sin lista, sin procedimiento, sin criterios para proveedores. La Ley de Modificación del IVA de 2025 apunta a dispositivos fiscales físicos; la de 2026 habla de un sistema de facturación electrónica, y su relación no se ha explicado."],
   ]),
   "de": ("Format und Übertragung — was noch nicht veröffentlicht ist", [
     ["Rechnungsformat", "Nicht veröffentlicht. Weder Syntax noch Schema noch Inhaltsspezifikation wurden herausgegeben."],
     ["Übertragung", "Zugelassene Geräte übermitteln Belegdaten direkt an BURS; die Haushaltsrede 2026 beschreibt dies als Echtzeitüberwachung von Transaktionen. Das Protokoll ist nicht veröffentlicht."],
     ["Clearance oder Meldung", "Nicht angegeben. Ob eine Rechnung vor Ausstellung freigegeben oder danach gemeldet werden muss, ist die folgenreichste Unbekannte für jede Integrationsplanung."],
     ["Gerätezulassung", "Keine Liste, kein Verfahren, keine Anbieterkriterien. Das Umsatzsteueränderungsgesetz 2025 deutet auf physische Fiskalgeräte, das Steuerverwaltungsgesetz 2026 auf ein E-Billing-System; das Verhältnis ist ungeklärt."],
   ]),
   "fr": ("Format et transmission — ce qui n'est pas encore publié", [
     ["Format de facture", "Non publié. Aucune syntaxe, aucun schéma, aucune spécification de contenu n'a été diffusé."],
     ["Transmission", "Des appareils agréés transmettant les données du reçu directement à BURS ; le budget 2026 y voit un suivi des transactions en temps réel. Le protocole n'est pas publié."],
     ["Clearance ou déclaration", "Non précisé. Savoir si la facture doit être validée avant émission ou déclarée après est l'inconnue la plus lourde de conséquences pour cadrer une intégration."],
     ["Agrément des appareils", "Ni liste, ni procédure, ni critères éditeurs. La loi modificative TVA de 2025 évoque des appareils fiscaux physiques, celle de 2026 un système de facturation électronique ; leur articulation n'est pas expliquée."],
   ]),
 }),
 dict(section="penalties_related", sort=0, t={
   "en": ("Statutory penalties, once the system commences", [
     ["Billing outside authorised equipment", "P10,000 per month."],
     ["Tampering with a device, or issuing false receipts", "Up to P100,000, or up to two years' imprisonment."],
     ["Record-keeping", "Eight years for VAT and income tax, harmonised by the Tax Administration Act 2026 and already in force since 1 July 2026. Records must be kept in Botswana."],
   ]),
   "es": ("Sanciones legales, una vez iniciado el sistema", [
     ["Facturar fuera de equipos autorizados", "10.000 pulas al mes."],
     ["Manipular un equipo o emitir tiques falsos", "Hasta 100.000 pulas o hasta dos años de prisión."],
     ["Conservación de registros", "Ocho años para IVA y renta, unificados por la Ley de 2026 y ya en vigor desde el 1 de julio de 2026. Los registros deben conservarse en Botsuana."],
   ]),
   "de": ("Gesetzliche Sanktionen, sobald das System startet", [
     ["Abrechnung außerhalb zugelassener Geräte", "10.000 Pula pro Monat."],
     ["Manipulation eines Geräts oder falsche Belege", "Bis zu 100.000 Pula oder bis zu zwei Jahre Haft."],
     ["Aufbewahrung", "Acht Jahre für Umsatz- und Einkommensteuer, vereinheitlicht durch das Gesetz von 2026 und seit dem 1. Juli 2026 in Kraft. Die Unterlagen müssen in Botsuana bleiben."],
   ]),
   "fr": ("Sanctions légales, une fois le système démarré", [
     ["Facturer hors équipement autorisé", "10 000 pulas par mois."],
     ["Altérer un appareil ou émettre de faux reçus", "Jusqu'à 100 000 pulas ou jusqu'à deux ans d'emprisonnement."],
     ["Conservation", "Huit ans pour la TVA et l'impôt sur le revenu, harmonisés par la loi de 2026 et en vigueur depuis le 1er juillet 2026. Les documents doivent être conservés au Botswana."],
   ]),
 }),
 dict(section="penalties_related", sort=1, t={
   "en": ("🔍 What we could not confirm", [
     ["The exact commencement date", "The nine-month formula is ENSafrica's reading of the Act's transitional provisions. No gazetted Ministerial Order fixing a calendar date has been found, so April 2027 is an approximation, not a deadline."],
     ["BURS's own published position", "No BURS page covering electronic billing could be retrieved. Every claim on this page rests on Parliament, the Budget Speech, the government news service or professional briefings."],
     ["Whether the pilot formally completed", "BURS announced a three-year project in February 2024 with phase one due December 2024, and national press reported a pilot ending March 2025. No source confirms completion."],
     ["The registration threshold in the new Act", "P1,000,000 is corroborated by PwC, RSM and ENSafrica but could not be read from the VAT Act 2026's own schedule."],
   ]),
   "es": ("🔍 Lo que no pudimos confirmar", [
     ["La fecha exacta de inicio", "La regla de los nueve meses es la lectura que ENSafrica hace de las disposiciones transitorias. No se ha hallado orden ministerial publicada que fije una fecha, así que abril de 2027 es una aproximación, no un plazo."],
     ["La posición publicada de BURS", "No se pudo recuperar ninguna página de BURS sobre facturación electrónica. Todo lo afirmado aquí se apoya en el Parlamento, el Presupuesto, el servicio de noticias del Gobierno o análisis profesionales."],
     ["Si el piloto concluyó formalmente", "BURS anunció un proyecto a tres años en febrero de 2024 con la primera fase para diciembre de 2024, y la prensa informó de un piloto que terminaba en marzo de 2025. Ninguna fuente confirma su conclusión."],
     ["El umbral de registro en la nueva ley", "1.000.000 de pulas está corroborado por PwC, RSM y ENSafrica, pero no pudo leerse en el anexo de la propia Ley del IVA de 2026."],
   ]),
   "de": ("🔍 Was wir nicht bestätigen konnten", [
     ["Das genaue Startdatum", "Die Neun-Monats-Regel ist ENSafricas Lesart der Übergangsvorschriften. Eine verkündete Ministeranordnung mit Kalenderdatum wurde nicht gefunden; April 2027 ist eine Näherung, keine Frist."],
     ["Die veröffentlichte Position von BURS", "Keine BURS-Seite zur elektronischen Abrechnung war abrufbar. Jede Aussage hier stützt sich auf Parlament, Haushaltsrede, den staatlichen Nachrichtendienst oder Fachanalysen."],
     ["Ob der Pilot förmlich abgeschlossen wurde", "BURS kündigte im Februar 2024 ein Dreijahresprojekt an, erste Phase Dezember 2024; die Presse berichtete von einem Pilot bis März 2025. Kein Beleg bestätigt den Abschluss."],
     ["Die Registrierungsschwelle im neuen Gesetz", "1.000.000 Pula wird von PwC, RSM und ENSafrica bestätigt, konnte aber nicht aus der Anlage des Umsatzsteuergesetzes 2026 gelesen werden."],
   ]),
   "fr": ("🔍 Ce que nous n'avons pas pu confirmer", [
     ["La date exacte de démarrage", "La règle des neuf mois est la lecture qu'ENSafrica fait des dispositions transitoires. Aucun arrêté ministériel publié fixant une date n'a été trouvé : avril 2027 est une approximation, non une échéance."],
     ["La position publiée de BURS", "Aucune page de BURS sur la facturation électronique n'a pu être consultée. Toute affirmation ici s'appuie sur le Parlement, le budget, le service d'information du gouvernement ou des analyses professionnelles."],
     ["Si le pilote s'est formellement achevé", "BURS a annoncé en février 2024 un projet sur trois ans, première phase en décembre 2024, et la presse a évoqué un pilote s'achevant en mars 2025. Aucune source ne confirme l'achèvement."],
     ["Le seuil d'assujettissement dans la nouvelle loi", "1 000 000 de pulas est corroboré par PwC, RSM et ENSafrica, mais n'a pu être lu dans l'annexe de la loi TVA de 2026 elle-même."],
   ]),
 }),
]

# --------------------------------------------------------------- steps ----
STEPS = [
 {"en": ("Work out whether you are in scope", "The line is VAT registration, at P1,000,000 of annual taxable supplies. If you are registered, assume the obligation reaches you; if you are near the threshold, model both sides of it."),
  "es": ("Determine si está en el ámbito", "La línea es el registro del IVA, en 1.000.000 de pulas de operaciones anuales. Si está inscrito, suponga que la obligación le alcanza; si está cerca del umbral, contemple ambos escenarios."),
  "de": ("Klären Sie Ihren Anwendungsbereich", "Die Linie ist die Umsatzsteuerregistrierung bei 1.000.000 Pula Jahresumsatz. Sind Sie registriert, gehen Sie von der Pflicht aus; liegen Sie nahe der Schwelle, rechnen Sie beide Fälle durch."),
  "fr": ("Déterminez si vous êtes dans le champ", "La ligne est l'assujettissement à la TVA, à 1 000 000 de pulas de livraisons annuelles. Si vous êtes assujetti, supposez que l'obligation vous atteint ; si vous êtes proche du seuil, modélisez les deux cas.")},
 {"en": ("Watch for the commencement Order, not the calendar", "The Act commences the billing system nine months after its own start, but no gazetted Order has fixed a date. The Order is the event worth monitoring; a date circulating without one is a projection."),
  "es": ("Vigile la orden de entrada en vigor, no el calendario", "La ley inicia el sistema nueve meses después de su propia entrada en vigor, pero ninguna orden publicada ha fijado fecha. La orden es el hecho que conviene seguir; una fecha sin ella es una previsión."),
  "de": ("Achten Sie auf die Anordnung, nicht auf den Kalender", "Das Gesetz startet das System neun Monate nach seinem eigenen Inkrafttreten, doch keine verkündete Anordnung nennt ein Datum. Die Anordnung ist das beobachtenswerte Ereignis; ein Datum ohne sie ist eine Prognose."),
  "fr": ("Guettez l'arrêté d'entrée en vigueur, pas le calendrier", "La loi démarre le système neuf mois après sa propre entrée en vigueur, mais aucun arrêté publié n'a fixé de date. L'arrêté est l'événement à surveiller ; une date sans lui est une projection.")},
 {"en": ("Ask your billing vendor the device question early", "The obligation runs through equipment BURS approves, and no accreditation list exists yet. Asking now tells you whether your vendor is engaged with BURS at all, which is the useful answer while the specification is unpublished."),
  "es": ("Pregunte pronto a su proveedor por los equipos", "La obligación pasa por equipos que BURS homologue, y aún no existe lista. Preguntar ahora le dirá si su proveedor está en contacto con BURS, que es la respuesta útil mientras no haya especificación."),
  "de": ("Fragen Sie Ihren Anbieter früh nach den Geräten", "Die Pflicht läuft über von BURS zugelassene Geräte, und eine Zulassungsliste gibt es noch nicht. Die Frage zeigt Ihnen, ob Ihr Anbieter überhaupt mit BURS im Austausch steht — die nützliche Antwort, solange die Spezifikation fehlt."),
  "fr": ("Posez tôt la question des appareils à votre éditeur", "L'obligation passe par des équipements agréés par BURS, et aucune liste n'existe encore. Poser la question maintenant vous dit si votre éditeur est en relation avec BURS, ce qui est la réponse utile tant que la spécification manque.")},
 {"en": ("Get record-keeping to eight years, in Botswana", "This part is already in force. Retention was harmonised at eight years across VAT and income tax on 1 July 2026, and the requirement is that records be kept in Botswana — which is a hosting question as much as a filing one."),
  "es": ("Lleve la conservación a ocho años, en Botsuana", "Esta parte ya está en vigor. La conservación se unificó en ocho años para IVA y renta el 1 de julio de 2026, y los registros deben guardarse en Botsuana, lo que es tanto una cuestión de alojamiento como de archivo."),
  "de": ("Bringen Sie die Aufbewahrung auf acht Jahre, in Botsuana", "Dieser Teil gilt bereits. Die Frist wurde am 1. Juli 2026 für Umsatz- und Einkommensteuer auf acht Jahre vereinheitlicht, und die Unterlagen müssen in Botsuana liegen — ebenso eine Hosting- wie eine Ablagefrage."),
  "fr": ("Portez la conservation à huit ans, au Botswana", "Cette partie est déjà en vigueur. La durée a été harmonisée à huit ans pour la TVA et l'impôt sur le revenu le 1er juillet 2026, et les documents doivent être conservés au Botswana — question d'hébergement autant que d'archivage.")},
]

# ------------------------------------------------------------- portals ----
PORTALS = [
 ("https://burs.org.bw/", {"en": "BURS — Botswana Unified Revenue Service",
   "es": "BURS — Servicio Unificado de Ingresos de Botsuana",
   "de": "BURS — Botswana Unified Revenue Service",
   "fr": "BURS — Botswana Unified Revenue Service"}),
 ("https://eservices.burs.org.bw/", {"en": "BURS e-Tax (registration, filing, payments)",
   "es": "BURS e-Tax (registro, declaración y pago)",
   "de": "BURS e-Tax (Registrierung, Erklärung, Zahlung)",
   "fr": "BURS e-Tax (immatriculation, déclaration, paiement)"}),
 ("https://www.burs.org.bw/index.php/tax/tax-laws-2026", {"en": "BURS — Tax Laws 2026, including the Tax Administration Act",
   "es": "BURS — Leyes tributarias de 2026, incluida la Ley de Administración Tributaria",
   "de": "BURS — Steuergesetze 2026, einschließlich des Steuerverwaltungsgesetzes",
   "fr": "BURS — Lois fiscales 2026, dont la loi sur l'administration fiscale"}),
]

import json

out = []
w = out.append
w("-- Botswana deep dive. GENERATED by gen_botswana_deep_dive.py --")
w("-- edit the generator, not this file. See its docstring for why the")
w("-- page leads with a not-in-force mandate and carries a card")
w("-- correcting the March 2026 date most readers will arrive holding.")
w("")
w(f"INSERT OR IGNORE INTO deep_dive_pages (country_id, last_updated) SELECT id, '2026-08-27' FROM countries WHERE code = 'BW';")
w("")
for lang in LANGS:
    p = PAGE[lang]
    w("INSERT OR IGNORE INTO deep_dive_page_translations (country_id, lang, compliance_model, footer_disclaimer,"
      " timeline_intro, file_format_intro, scope_intro, steps_intro, penalties_intro, mandate_summary, mandate_summary_icon)")
    w(f"SELECT id, '{lang}', {lit(p['compliance_model'])}, {lit(p['footer_disclaimer'])}, {lit(p['timeline_intro'])},"
      f" {lit(p['file_format_intro'])}, {lit(p['scope_intro'])}, {lit(p['steps_intro'])}, {lit(p['penalties_intro'])},"
      f" {lit(p['mandate_summary'])}, {lit(p['mandate_summary_icon'])} FROM countries WHERE code = 'BW';")
    w("")

w("-- ---- stat strip: nothing the headline tiles above already state ----")
for i, s in enumerate(STATS):
    w(f"INSERT INTO deep_dive_stats (country_id, sort_order) SELECT c.id, {i} FROM countries c WHERE c.code = 'BW'")
    w(f"  AND NOT EXISTS (SELECT 1 FROM deep_dive_stats d WHERE d.country_id = c.id AND d.sort_order = {i});")
    for lang in LANGS:
        v, l = s[lang]
        w("INSERT OR IGNORE INTO deep_dive_stat_translations (stat_id, lang, stat_value, stat_label)")
        w(f"SELECT d.id, '{lang}', {lit(v)}, {lit(l)} FROM deep_dive_stats d WHERE d.country_id = {CID} AND d.sort_order = {i};")
    w("")

w("-- ---- cards ----")
for c in CARDS:
    sec, so = c["section"], c["sort"]
    w(f"INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT c.id, '{sec}', {so} FROM countries c WHERE c.code = 'BW'")
    w(f"  AND NOT EXISTS (SELECT 1 FROM deep_dive_cards d WHERE d.country_id = c.id AND d.section = '{sec}' AND d.sort_order = {so});")
    for lang in LANGS:
        title, rows = c["t"][lang]
        rj = json.dumps(rows, ensure_ascii=False)
        w("INSERT OR IGNORE INTO deep_dive_card_translations (card_id, lang, title, rows_json)")
        w(f"SELECT d.id, '{lang}', {lit(title)}, {lit(rj)} FROM deep_dive_cards d WHERE d.country_id = {CID} AND d.section = '{sec}' AND d.sort_order = {so};")
    w("")

w("-- ---- steps ----")
for i, s in enumerate(STEPS):
    w(f"INSERT INTO deep_dive_steps (country_id, sort_order) SELECT c.id, {i} FROM countries c WHERE c.code = 'BW'")
    w(f"  AND NOT EXISTS (SELECT 1 FROM deep_dive_steps d WHERE d.country_id = c.id AND d.sort_order = {i});")
    for lang in LANGS:
        t, d = s[lang]
        w("INSERT OR IGNORE INTO deep_dive_step_translations (step_id, lang, title, description)")
        w(f"SELECT s.id, '{lang}', {lit(t)}, {lit(d)} FROM deep_dive_steps s WHERE s.country_id = {CID} AND s.sort_order = {i};")
    w("")

w("-- ---- portals ----")
for i, (url, labels) in enumerate(PORTALS):
    w(f"INSERT INTO deep_dive_portals (country_id, url, sort_order) SELECT c.id, {lit(url)}, {i} FROM countries c WHERE c.code = 'BW'")
    w(f"  AND NOT EXISTS (SELECT 1 FROM deep_dive_portals d WHERE d.country_id = c.id AND d.url = {lit(url)});")
    for lang in LANGS:
        w("INSERT OR IGNORE INTO deep_dive_portal_translations (portal_id, lang, label)")
        w(f"SELECT p.id, '{lang}', {lit(labels[lang])} FROM deep_dive_portals p WHERE p.country_id = {CID} AND p.url = {lit(url)};")
    w("")

w("-- ---- what this migration claims it did ----")
w("-- Counts per language, not one total: a language silently missing a")
w("-- row renders as English in the middle of a translated page.")
w("--")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_pages WHERE country_id = {CID} = 1")
for lang in LANGS:
    w(f"-- ASSERT: SELECT count(*) FROM deep_dive_page_translations WHERE country_id = {CID} AND lang = '{lang}' = 1")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_stats WHERE country_id = {CID} = {len(STATS)}")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_cards WHERE country_id = {CID} = {len(CARDS)}")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_steps WHERE country_id = {CID} = {len(STEPS)}")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_portals WHERE country_id = {CID} = {len(PORTALS)}")
for lang in LANGS:
    w(f"-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id WHERE d.country_id = {CID} AND t.lang = '{lang}' = {len(CARDS)}")
    w(f"-- ASSERT: SELECT count(*) FROM deep_dive_step_translations t JOIN deep_dive_steps s ON s.id = t.step_id WHERE s.country_id = {CID} AND t.lang = '{lang}' = {len(STEPS)}")
w("-- The page must not restate a headline tile in its free-form strip:")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_stat_translations t JOIN deep_dive_stats d ON d.id = t.stat_id WHERE d.country_id = {CID} AND (t.stat_label LIKE '%archiv%' OR t.stat_label LIKE '%signature%') = 0")

print("\n".join(out))
