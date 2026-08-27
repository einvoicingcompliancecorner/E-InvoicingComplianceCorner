#!/usr/bin/env python3
"""gen_ghana_deep_dive.py — emits 678_ghana_deep_dive.sql.

Edit this file, not the SQL. Run:
    python3 gen_ghana_deep_dive.py > 678_ghana_deep_dive.sql

THREE THINGS THIS PAGE HAS TO GET RIGHT
---------------------------------------
1. The date that matters is 1 January 2026, not 2022. E-VAT has run since
   an October 2022 pilot, but Act 1151 s.43(2) turned it from a phased
   programme aimed at named taxpayers into a general duty on every
   taxable person. Most write-ups still lead with the rollout.

2. It is fiscalisation, not portal clearance. Vendor trackers describe
   Ghana as a clearance model where the GRA returns a clearance number
   before an invoice is valid. GRA's own documents describe a Virtual
   Sales Data Controller stamping locally with a daily key from the GRA's
   key management module, with offline operation permitted for up to 24
   hours. Those are different architectures and they cost different
   amounts to build.

3. "The threshold is GHS 750,000" is wrong, and it is wrong because it
   followed the official source. GRA's own December 2025 notice announces
   the goods threshold and is silent on services, for which Act 1151
   removed the threshold entirely -- register within 30 days of
   commencing taxable activity. Every consultant, freelancer and digital
   service provider in Ghana is caught by the half the notice omits.

The stat strip carries the rate, the transmission window and the penalty
ceiling. Nothing in it restates a headline tile.
"""
import json

LANGS = ("en", "es", "de", "fr")
def esc(s): return s.replace("'", "''")
def lit(s): return "NULL" if s is None else "'" + esc(s) + "'"
CID = "(SELECT id FROM countries WHERE code = 'GH')"

PAGE = {
"en": dict(
compliance_model="Live continuous transaction control. Every taxable person must issue invoices through a GRA-certified system that stamps each one with a daily key and transmits it to the authority in real time, or within 24 hours when offline. Universal since 1 January 2026 under Act 1151, after a phased rollout from an October 2022 pilot.",
mandate_summary="Ghana's Certified Invoicing System, branded E-VAT, has been mandatory for every taxable person since 1 January 2026, when the Value Added Tax Act, 2025 (Act 1151) replaced a phased onboarding programme with a general statutory duty. Invoices are stamped by an accredited system and transmitted to the GRA in real time; the invoicing system is also the reporting channel. Onboarding and enforcement are still in progress.",
mandate_summary_icon="🇬🇭",
timeline_intro="Ghana's rollout ran about a year behind its published plan, and the plan is worth reading against what happened. The 2023 timetable had Phase 1 complete by June 2023, Phase 2 by December 2023 and every VAT-registered taxpayer onboarded by December 2024. Phase 1 actually onboarded in May 2024 and Phase 2 in September 2024; no GRA notice exists for any later phase. Act 1151 then made the question moot by imposing the duty on everyone at once.",
file_format_intro="A certified invoicing system rather than a government portal. The taxpayer's own accredited software — or the GRA's free E-VAT application — runs a Virtual Sales Data Controller that stamps each transaction using a daily key issued by the GRA's Security Key Management Module, and forwards it to the Certified Invoicing Management System. Every invoice carries a QR code, an invoice signature, a verification engine identifier, encrypted data and a time stamp. No published register of accredited vendors could be found.",
scope_intro="Every taxable person, and the registration test is now two different tests. For goods, the threshold rose from GHS 200,000 to GHS 750,000 on 1 January 2026, with early triggers at GHS 62,500 in a month, GHS 187,500 over three and GHS 375,000 over six. For services there is no threshold at all: registration follows from commencing taxable activity, within thirty days. Non-resident suppliers of electronic services register on the same basis, with no revenue floor.",
steps_intro="This is a live obligation with a real integration behind it, so the work is real. The order below reflects what actually blocks: knowing whether you are registered at all, then how you will stamp and transmit, then what happens when the connection drops.",
penalties_intro="The penalty ceiling for invoicing outside the certified system rose a hundredfold on 1 January 2026, from 500 currency points to 50,000, or three times the tax involved, whichever is higher. Enforcement is active rather than theoretical: GRA field operations in Accra in May 2026 sealed premises and made an arrest over selective receipt issuance.",
footer_disclaimer="This page reflects the Value Added Tax Act, 2025 (Act 1151) in force from 1 January 2026, the Revenue Administration Act, 2016 (Act 915), the Taxation (Use of Fiscal Electronic Device) Act, 2018 (Act 966), and the GRA's E-VAT administrative guidelines GRA/AG/2024/005. An important caveat: the official texts of Act 1151 and of the GRA's January 2026 VAT guidelines are scanned images with no extractable text, so section-level quotations here rest on legal-database transcriptions corroborated against EY's and KPMG's published summaries rather than on the statute as published.",
),
"es": dict(
compliance_model="Control continuo de transacciones, en vigor. Todo sujeto pasivo debe emitir facturas mediante un sistema certificado por la GRA que sella cada una con una clave diaria y la transmite a la administración en tiempo real, o en 24 horas si no hay conexión. Universal desde el 1 de enero de 2026 con la Ley 1151, tras un despliegue por fases iniciado con el piloto de octubre de 2022.",
mandate_summary="El Sistema Certificado de Facturación de Ghana, con la marca E-VAT, es obligatorio para todo sujeto pasivo desde el 1 de enero de 2026, cuando la Ley del IVA de 2025 (Ley 1151) sustituyó un programa de incorporación por fases por un deber legal general. Las facturas las sella un sistema acreditado y se transmiten a la GRA en tiempo real; el sistema de facturación es además el canal de declaración. La incorporación y la fiscalización siguen en curso.",
mandate_summary_icon="🇬🇭",
timeline_intro="El despliegue de Ghana fue cerca de un año por detrás de su plan publicado, y conviene leer el plan contra lo ocurrido. El calendario de 2023 preveía la Fase 1 concluida en junio de 2023, la Fase 2 en diciembre de 2023 y a todos los inscritos en el IVA para diciembre de 2024. La Fase 1 se incorporó en mayo de 2024 y la Fase 2 en septiembre de 2024; no existe aviso de la GRA para ninguna fase posterior. La Ley 1151 zanjó la cuestión imponiendo el deber a todos a la vez.",
file_format_intro="Un sistema certificado de facturación, no un portal público. El software acreditado del propio contribuyente —o la aplicación E-VAT gratuita de la GRA— ejecuta un Controlador Virtual de Datos de Venta que sella cada operación con una clave diaria emitida por el módulo de gestión de claves de la GRA y la reenvía al sistema de gestión de facturación certificada. Cada factura lleva código QR, firma de factura, identificador del motor de verificación, datos cifrados y sello de tiempo. No se ha localizado un registro publicado de proveedores acreditados.",
scope_intro="Todo sujeto pasivo, y la prueba de registro son ahora dos pruebas distintas. Para bienes, el umbral subió de 200.000 a 750.000 GHS el 1 de enero de 2026, con activadores anticipados de 62.500 GHS en un mes, 187.500 en tres y 375.000 en seis. Para servicios no hay umbral alguno: el registro deriva del inicio de la actividad, en treinta días. Los proveedores no residentes de servicios electrónicos se registran igual, sin mínimo de ingresos.",
steps_intro="Es una obligación viva con una integración real detrás, así que el trabajo es real. El orden siguiente refleja lo que de verdad bloquea: saber si está registrado, luego cómo va a sellar y transmitir, y luego qué ocurre cuando cae la conexión.",
penalties_intro="El techo sancionador por facturar fuera del sistema certificado se multiplicó por cien el 1 de enero de 2026, de 500 a 50.000 puntos de moneda, o tres veces el impuesto en juego, lo que sea mayor. La fiscalización es activa y no teórica: en mayo de 2026 operaciones de campo de la GRA en Accra precintaron locales y practicaron una detención por emisión selectiva de tiques.",
footer_disclaimer="Esta página refleja la Ley del IVA de 2025 (Ley 1151) vigente desde el 1 de enero de 2026, la Ley de Administración de Ingresos de 2016 (Ley 915), la Ley de Uso de Dispositivos Fiscales Electrónicos de 2018 (Ley 966) y las directrices administrativas E-VAT de la GRA GRA/AG/2024/005. Una advertencia importante: los textos oficiales de la Ley 1151 y de las directrices de IVA de la GRA de enero de 2026 son imágenes escaneadas sin texto extraíble, de modo que las citas de artículos se apoyan en transcripciones de bases de datos jurídicas contrastadas con los resúmenes publicados de EY y KPMG, y no en la ley tal como se publicó.",
),
"de": dict(
compliance_model="Laufende Transaktionskontrolle, in Kraft. Jeder Steuerpflichtige muss Rechnungen über ein von der GRA zertifiziertes System ausstellen, das jede mit einem Tagesschlüssel stempelt und in Echtzeit an die Behörde übermittelt, offline binnen 24 Stunden. Seit dem 1. Januar 2026 durch Gesetz 1151 allgemein, nach einem Phasenrollout ab dem Pilotbetrieb im Oktober 2022.",
mandate_summary="Ghanas zertifiziertes Rechnungssystem, als E-VAT vermarktet, ist seit dem 1. Januar 2026 für jeden Steuerpflichtigen verbindlich, als das Mehrwertsteuergesetz 2025 (Gesetz 1151) ein phasenweises Onboarding-Programm durch eine allgemeine gesetzliche Pflicht ersetzte. Rechnungen werden von einem akkreditierten System gestempelt und in Echtzeit an die GRA übermittelt; das Rechnungssystem ist zugleich der Meldekanal. Onboarding und Durchsetzung laufen weiter.",
mandate_summary_icon="🇬🇭",
timeline_intro="Ghanas Rollout lag rund ein Jahr hinter dem veröffentlichten Plan, und der Plan lohnt den Vergleich mit dem Geschehenen. Der Zeitplan von 2023 sah Phase 1 bis Juni 2023, Phase 2 bis Dezember 2023 und alle MWST-Registrierten bis Dezember 2024 vor. Phase 1 fand tatsächlich im Mai 2024 statt, Phase 2 im September 2024; für spätere Phasen existiert keine GRA-Mitteilung. Gesetz 1151 erledigte die Frage, indem es die Pflicht allen zugleich auferlegte.",
file_format_intro="Ein zertifiziertes Rechnungssystem, kein Behördenportal. Die akkreditierte Software des Steuerpflichtigen — oder die kostenlose E-VAT-Anwendung der GRA — betreibt einen virtuellen Verkaufsdaten-Controller, der jede Transaktion mit einem Tagesschlüssel des Schlüsselverwaltungsmoduls der GRA stempelt und an das zentrale System weiterleitet. Jede Rechnung trägt QR-Code, Rechnungssignatur, Kennung der Prüf-Engine, verschlüsselte Daten und Zeitstempel. Ein veröffentlichtes Verzeichnis akkreditierter Anbieter war nicht auffindbar.",
scope_intro="Jeder Steuerpflichtige — und der Registrierungstest sind nun zwei verschiedene Tests. Für Waren stieg die Schwelle am 1. Januar 2026 von 200.000 auf 750.000 GHS, mit früheren Auslösern bei 62.500 GHS im Monat, 187.500 in drei und 375.000 in sechs Monaten. Für Dienstleistungen gibt es überhaupt keine Schwelle: die Registrierung folgt aus der Aufnahme der Tätigkeit, binnen dreissig Tagen. Gebietsfremde Anbieter elektronischer Leistungen registrieren sich ebenso, ohne Umsatzuntergrenze.",
steps_intro="Dies ist eine lebende Pflicht mit einer echten Integration dahinter, also ist die Arbeit echt. Die Reihenfolge unten bildet ab, was tatsächlich blockiert: ob Sie überhaupt registriert sind, dann wie Sie stempeln und übermitteln, dann was geschieht, wenn die Verbindung abreisst.",
penalties_intro="Die Sanktionsobergrenze für Rechnungsstellung ausserhalb des zertifizierten Systems stieg am 1. Januar 2026 um das Hundertfache, von 500 auf 50.000 Währungspunkte, oder das Dreifache der betroffenen Steuer, je nachdem, was höher ist. Die Durchsetzung ist aktiv und nicht theoretisch: Feldeinsätze der GRA in Accra versiegelten im Mai 2026 Geschäftsräume und führten zu einer Festnahme wegen selektiver Belegausgabe.",
footer_disclaimer="Diese Seite gibt das Mehrwertsteuergesetz 2025 (Gesetz 1151) in der ab 1. Januar 2026 geltenden Fassung wieder, das Revenue Administration Act 2016 (Gesetz 915), das Gesetz über fiskalische elektronische Geräte 2018 (Gesetz 966) sowie die E-VAT-Verwaltungsrichtlinien der GRA GRA/AG/2024/005. Ein wichtiger Vorbehalt: die amtlichen Texte des Gesetzes 1151 und der GRA-MWST-Richtlinien vom Januar 2026 sind gescannte Bilder ohne extrahierbaren Text. Zitate auf Artikelebene stützen sich daher auf Transkriptionen juristischer Datenbanken, abgeglichen mit den veröffentlichten Zusammenfassungen von EY und KPMG, und nicht auf das Gesetz in seiner Verkündungsfassung.",
),
"fr": dict(
compliance_model="Contrôle continu des transactions, en vigueur. Tout assujetti doit émettre ses factures au moyen d'un système certifié par la GRA qui appose sur chacune une clé du jour et la transmet à l'administration en temps réel, ou sous 24 heures hors ligne. Général depuis le 1er janvier 2026 avec la loi 1151, après un déploiement par phases entamé par le pilote d'octobre 2022.",
mandate_summary="Le système certifié de facturation du Ghana, commercialisé sous le nom d'E-VAT, s'impose à tout assujetti depuis le 1er janvier 2026, date à laquelle la loi TVA de 2025 (loi 1151) a remplacé un programme d'intégration par phases par une obligation légale générale. Les factures sont estampillées par un système accrédité et transmises à la GRA en temps réel ; le système de facturation est aussi le canal déclaratif. L'intégration et le contrôle restent en cours.",
mandate_summary_icon="🇬🇭",
timeline_intro="Le déploiement du Ghana a accusé environ un an de retard sur son plan publié, et le plan mérite d'être lu face aux faits. Le calendrier de 2023 prévoyait la phase 1 achevée en juin 2023, la phase 2 en décembre 2023 et tous les assujettis intégrés pour décembre 2024. La phase 1 a eu lieu en mai 2024, la phase 2 en septembre 2024 ; aucun avis de la GRA n'existe pour une phase ultérieure. La loi 1151 a tranché la question en imposant l'obligation à tous d'un coup.",
file_format_intro="Un système certifié de facturation, non un portail public. Le logiciel accrédité de l'assujetti — ou l'application E-VAT gratuite de la GRA — fait tourner un contrôleur virtuel de données de vente qui estampille chaque opération avec une clé du jour délivrée par le module de gestion de clés de la GRA, puis la transmet au système central. Chaque facture porte un code QR, une signature de facture, un identifiant de moteur de vérification, des données chiffrées et un horodatage. Aucun registre publié de prestataires accrédités n'a été trouvé.",
scope_intro="Tout assujetti — et le test d'assujettissement en est désormais deux. Pour les biens, le seuil est passé de 200 000 à 750 000 GHS le 1er janvier 2026, avec des déclencheurs anticipés à 62 500 GHS sur un mois, 187 500 sur trois et 375 000 sur six. Pour les services, il n'existe aucun seuil : l'assujettissement découle du début de l'activité, dans les trente jours. Les fournisseurs non résidents de services électroniques s'enregistrent de même, sans plancher de recettes.",
steps_intro="C'est une obligation vivante adossée à une intégration réelle, donc le travail est réel. L'ordre ci-dessous reflète ce qui bloque effectivement : savoir si vous êtes assujetti, puis comment vous allez estampiller et transmettre, puis ce qui se passe quand la connexion tombe.",
penalties_intro="Le plafond de sanction pour facturation hors du système certifié a été centuplé le 1er janvier 2026, passant de 500 à 50 000 points monétaires, ou trois fois la taxe en jeu, le plus élevé l'emportant. Le contrôle est actif et non théorique : des opérations de terrain de la GRA à Accra ont scellé des locaux et donné lieu à une arrestation en mai 2026 pour émission sélective de tickets.",
footer_disclaimer="Cette page reflète la loi TVA de 2025 (loi 1151) en vigueur depuis le 1er janvier 2026, la loi de 2016 sur l'administration des recettes (loi 915), la loi de 2018 sur les appareils fiscaux électroniques (loi 966) et les directives administratives E-VAT de la GRA GRA/AG/2024/005. Réserve importante : les textes officiels de la loi 1151 et des directives TVA de la GRA de janvier 2026 sont des images numérisées sans texte extractible ; les citations d'articles s'appuient donc sur des transcriptions de bases de données juridiques recoupées avec les synthèses publiées d'EY et de KPMG, et non sur la loi telle que publiée.",
),
}

STATS = [
  {"en": ("20%", "Headline VAT rate — 15% plus NHIL and GETFund at 2.5% each, on a common base since January 2026"),
   "es": ("20 %", "Tipo global del IVA: 15 % más NHIL y GETFund al 2,5 % cada uno, sobre base común desde enero de 2026"),
   "de": ("20 %", "Gesamtsatz — 15 % zuzüglich NHIL und GETFund von je 2,5 %, seit Januar 2026 auf gemeinsamer Basis"),
   "fr": ("20 %", "Taux global de TVA — 15 % plus NHIL et GETFund à 2,5 % chacun, sur une base commune depuis janvier 2026")},
  {"en": ("24 hours", "The longest an invoice may go untransmitted while your system is offline"),
   "es": ("24 horas", "El máximo que una factura puede quedar sin transmitir mientras su sistema esté sin conexión"),
   "de": ("24 Stunden", "Die längste Zeit, die eine Rechnung unübermittelt bleiben darf, solange Ihr System offline ist"),
   "fr": ("24 heures", "La durée maximale pendant laquelle une facture peut rester non transmise, système hors ligne")},
  {"en": ("GHS 50,000", "Penalty ceiling for invoicing outside the certified system, or three times the tax — a hundredfold rise in January 2026"),
   "es": ("50.000 GHS", "Techo sancionador por facturar fuera del sistema certificado, o tres veces el impuesto: cien veces más desde enero de 2026"),
   "de": ("GHS 50'000", "Sanktionsobergrenze für Rechnungen ausserhalb des zertifizierten Systems, oder das Dreifache der Steuer — hundertfach erhöht"),
   "fr": ("50 000 GHS", "Plafond de sanction pour facturation hors système certifié, ou trois fois la taxe — centuplé en janvier 2026")},
]

CARDS = [
 dict(section="scope_transmission", sort=0, t={
   "en": ("⚠️ The threshold is not one number, and the official notice says only half of it", [
     ["Goods: GHS 750,000", "Raised from GHS 200,000 on 1 January 2026. Early triggers apply at GHS 62,500 in one month, GHS 187,500 over three months or GHS 375,000 over six."],
     ["Services: no threshold at all", "Act 1151 removed it. Registration follows from commencing taxable activity, within thirty days — whatever the turnover."],
     ["Why this catches people", "The GRA's own December 2025 notice announces the goods threshold and does not mention services. A page that follows the official source alone will tell every consultant, freelancer and digital service provider in Ghana that they are below the threshold. There is no threshold for them to be below."],
     ["Non-residents", "Suppliers of electronic and telecommunications services to Ghana register on the same basis, with no revenue floor, and fall within the same invoicing regime."],
   ]),
   "es": ("⚠️ El umbral no es una cifra, y el aviso oficial solo cuenta la mitad", [
     ["Bienes: 750.000 GHS", "Elevado desde 200.000 GHS el 1 de enero de 2026. Hay activadores anticipados en 62.500 GHS en un mes, 187.500 en tres o 375.000 en seis."],
     ["Servicios: ningún umbral", "La Ley 1151 lo eliminó. El registro deriva del inicio de la actividad gravada, en treinta días, sea cual sea la cifra de negocio."],
     ["Por qué esto atrapa a la gente", "El propio aviso de la GRA de diciembre de 2025 anuncia el umbral de bienes y no menciona los servicios. Una página que siga solo la fuente oficial dirá a cada consultor, autónomo y proveedor digital de Ghana que está por debajo del umbral. Para ellos no hay umbral bajo el que estar."],
     ["No residentes", "Los proveedores de servicios electrónicos y de telecomunicaciones a Ghana se registran igual, sin mínimo de ingresos, y quedan en el mismo régimen de facturación."],
   ]),
   "de": ("⚠️ Die Schwelle ist keine Zahl, und die amtliche Mitteilung nennt nur die Hälfte", [
     ["Waren: 750.000 GHS", "Am 1. Januar 2026 von 200.000 GHS angehoben. Frühere Auslöser gelten bei 62.500 GHS im Monat, 187.500 in drei oder 375.000 in sechs Monaten."],
     ["Dienstleistungen: gar keine Schwelle", "Gesetz 1151 hat sie gestrichen. Die Registrierung folgt aus der Aufnahme der steuerbaren Tätigkeit, binnen dreissig Tagen, unabhängig vom Umsatz."],
     ["Warum das Leute erwischt", "Die GRA-Mitteilung vom Dezember 2025 nennt die Warenschwelle und schweigt zu Dienstleistungen. Eine Seite, die nur der amtlichen Quelle folgt, sagt jedem Berater, Freiberufler und digitalen Anbieter in Ghana, er liege unter der Schwelle. Für ihn gibt es keine Schwelle, unter der er liegen könnte."],
     ["Gebietsfremde", "Anbieter elektronischer und Telekommunikationsleistungen nach Ghana registrieren sich ebenso, ohne Umsatzuntergrenze, und fallen unter dasselbe Rechnungsregime."],
   ]),
   "fr": ("⚠️ Le seuil n'est pas un chiffre, et l'avis officiel n'en dit que la moitié", [
     ["Biens : 750 000 GHS", "Relevé depuis 200 000 GHS le 1er janvier 2026. Des déclencheurs anticipés jouent à 62 500 GHS sur un mois, 187 500 sur trois ou 375 000 sur six."],
     ["Services : aucun seuil", "La loi 1151 l'a supprimé. L'assujettissement découle du début de l'activité taxable, dans les trente jours, quel que soit le chiffre d'affaires."],
     ["Pourquoi cela piège", "L'avis de la GRA de décembre 2025 annonce le seuil des biens et ne dit rien des services. Une page qui suit la seule source officielle dira à chaque consultant, indépendant et prestataire numérique du Ghana qu'il est sous le seuil. Pour lui, il n'existe aucun seuil sous lequel se trouver."],
     ["Non-résidents", "Les fournisseurs de services électroniques et de télécommunications vers le Ghana s'enregistrent de même, sans plancher de recettes, et relèvent du même régime de facturation."],
   ]),
 }),
 dict(section="scope_transmission", sort=1, t={
   "en": ("Clearance, or fiscalisation? The distinction changes what you build", [
     ["What vendor trackers say", "Several describe Ghana as a clearance model in which the GRA returns a clearance number before an invoice is valid."],
     ["What the GRA's own documents describe", "A Virtual Sales Data Controller running on the taxpayer's side, stamping each invoice with a daily key issued by the GRA's key management module, and forwarding to the central system. Offline operation is expressly permitted for up to 24 hours."],
     ["Which is right", "The second. Architecturally this is fiscalisation of the kind Rwanda and Zambia run, not portal clearance of the kind Italy and Chile run. The accurate sentence is: the invoice must be signed by a GRA-certified system before issue, and the data must reach the GRA in real time or within 24 hours."],
     ["Why it matters commercially", "A clearance model makes the tax authority a synchronous dependency of every sale. A fiscalisation model does not. Scoping the first when you have the second buys resilience you do not need; scoping the second when you have the first is how a go-live fails."],
   ]),
   "es": ("¿Clearance o fiscalización? La distinción cambia lo que hay que construir", [
     ["Qué dicen los rastreadores de proveedores", "Varios describen Ghana como un modelo de clearance en el que la GRA devuelve un número de autorización antes de que la factura sea válida."],
     ["Qué describen los documentos de la propia GRA", "Un Controlador Virtual de Datos de Venta que se ejecuta del lado del contribuyente, sella cada factura con una clave diaria emitida por el módulo de claves de la GRA y la reenvía al sistema central. El funcionamiento sin conexión se permite expresamente hasta 24 horas."],
     ["Cuál es correcto", "El segundo. Arquitectónicamente esto es fiscalización, del tipo que operan Ruanda y Zambia, no clearance por portal como en Italia o Chile. La frase exacta es: la factura debe firmarla un sistema certificado por la GRA antes de emitirse, y los datos deben llegar a la GRA en tiempo real o en 24 horas."],
     ["Por qué importa comercialmente", "Un modelo de clearance convierte a la administración en una dependencia síncrona de cada venta. Uno de fiscalización, no. Dimensionar el primero teniendo el segundo compra una resiliencia innecesaria; dimensionar el segundo teniendo el primero es como fracasa una puesta en marcha."],
   ]),
   "de": ("Clearance oder Fiskalisierung? Der Unterschied ändert, was Sie bauen", [
     ["Was Anbieter-Tracker sagen", "Mehrere beschreiben Ghana als Clearance-Modell, bei dem die GRA vor Gültigkeit der Rechnung eine Freigabenummer zurückgibt."],
     ["Was die Dokumente der GRA beschreiben", "Einen virtuellen Verkaufsdaten-Controller auf Seiten des Steuerpflichtigen, der jede Rechnung mit einem Tagesschlüssel des GRA-Schlüsselmoduls stempelt und an das Zentralsystem weiterleitet. Offline-Betrieb ist ausdrücklich bis zu 24 Stunden zulässig."],
     ["Was stimmt", "Das Zweite. Architektonisch ist das Fiskalisierung, wie sie Ruanda und Sambia betreiben, nicht Portal-Clearance wie in Italien oder Chile. Der zutreffende Satz lautet: Die Rechnung muss vor Ausstellung von einem GRA-zertifizierten System signiert werden, und die Daten müssen die GRA in Echtzeit oder binnen 24 Stunden erreichen."],
     ["Warum das kommerziell zählt", "Ein Clearance-Modell macht die Steuerbehörde zur synchronen Abhängigkeit jedes Verkaufs. Ein Fiskalisierungsmodell nicht. Wer das erste plant und das zweite hat, kauft überflüssige Ausfallsicherheit; wer das zweite plant und das erste hat, erlebt ein gescheitertes Go-live."],
   ]),
   "fr": ("Clearance ou fiscalisation ? La distinction change ce qu'il faut construire", [
     ["Ce que disent les trackers d'éditeurs", "Plusieurs décrivent le Ghana comme un modèle de clearance où la GRA renvoie un numéro d'autorisation avant que la facture soit valable."],
     ["Ce que décrivent les documents de la GRA", "Un contrôleur virtuel de données de vente exécuté côté contribuable, qui estampille chaque facture avec une clé du jour délivrée par le module de clés de la GRA, puis la transmet au système central. Le fonctionnement hors ligne est expressément admis jusqu'à 24 heures."],
     ["Lequel est juste", "Le second. Sur le plan architectural, il s'agit de fiscalisation, comme au Rwanda ou en Zambie, et non de clearance par portail comme en Italie ou au Chili. La phrase exacte : la facture doit être signée par un système certifié GRA avant émission, et les données doivent parvenir à la GRA en temps réel ou sous 24 heures."],
     ["Pourquoi cela compte commercialement", "Un modèle de clearance fait de l'administration une dépendance synchrone de chaque vente. Un modèle de fiscalisation, non. Dimensionner le premier quand on a le second achète une résilience inutile ; dimensionner le second quand on a le premier, c'est ainsi qu'une mise en service échoue."],
   ]),
 }),
 dict(section="file_format", sort=0, t={
   "en": ("How an invoice is made, stamped and transmitted", [
     ["Three ways in", "Integrate your own ERP or POS by API; use the GRA's free E-VAT software as desktop, Android or web; or use accredited third-party software."],
     ["What stamps it", "A Virtual Sales Data Controller, using a daily key issued by the GRA's Security Key Management Module."],
     ["What the invoice must carry", "QR code, invoice signature, verification engine identifier, encrypted data and a time stamp."],
     ["When it must arrive", "Real time when online. Offline issuance is permitted, with transmission once connectivity returns and a 24-hour ceiling; the system stops functioning after a set period of failed transmission."],
     ["Sales receipts", "Permitted for low-value, high-volume supplies, printed or sent by SMS or email. A receipt without the purchaser's full details does not support an input tax deduction."],
   ]),
   "es": ("Cómo se genera, sella y transmite una factura", [
     ["Tres vías de entrada", "Integrar su propio ERP o TPV por API; usar el software E-VAT gratuito de la GRA en escritorio, Android o web; o usar software acreditado de terceros."],
     ["Qué la sella", "Un Controlador Virtual de Datos de Venta, con una clave diaria emitida por el módulo de gestión de claves de la GRA."],
     ["Qué debe llevar la factura", "Código QR, firma de factura, identificador del motor de verificación, datos cifrados y sello de tiempo."],
     ["Cuándo debe llegar", "En tiempo real con conexión. Se permite emitir sin conexión, transmitiendo al recuperarla y con un techo de 24 horas; el sistema deja de funcionar tras un periodo determinado de transmisiones fallidas."],
     ["Tiques de venta", "Permitidos para suministros de bajo valor y alto volumen, impresos o enviados por SMS o correo. Un tique sin los datos completos del comprador no permite deducir el impuesto soportado."],
   ]),
   "de": ("Wie eine Rechnung entsteht, gestempelt und übermittelt wird", [
     ["Drei Wege hinein", "Eigenes ERP oder Kassensystem per API integrieren; die kostenlose E-VAT-Software der GRA als Desktop-, Android- oder Web-Anwendung nutzen; oder akkreditierte Drittsoftware einsetzen."],
     ["Was stempelt", "Ein virtueller Verkaufsdaten-Controller mit einem Tagesschlüssel des Schlüsselverwaltungsmoduls der GRA."],
     ["Was die Rechnung tragen muss", "QR-Code, Rechnungssignatur, Kennung der Prüf-Engine, verschlüsselte Daten und Zeitstempel."],
     ["Wann sie ankommen muss", "In Echtzeit bei Verbindung. Offline-Ausstellung ist zulässig, mit Übermittlung nach Rückkehr der Verbindung und einer Obergrenze von 24 Stunden; nach einer bestimmten Zeit fehlgeschlagener Übermittlung stellt das System den Betrieb ein."],
     ["Kassenbelege", "Zulässig für geringwertige Massengeschäfte, gedruckt oder per SMS oder E-Mail. Ein Beleg ohne vollständige Käuferangaben trägt keinen Vorsteuerabzug."],
   ]),
   "fr": ("Comment une facture est produite, estampillée et transmise", [
     ["Trois voies d'entrée", "Intégrer son propre ERP ou système de caisse par API ; utiliser le logiciel E-VAT gratuit de la GRA en version bureau, Android ou web ; ou recourir à un logiciel tiers accrédité."],
     ["Ce qui l'estampille", "Un contrôleur virtuel de données de vente, au moyen d'une clé du jour délivrée par le module de gestion de clés de la GRA."],
     ["Ce que la facture doit porter", "Code QR, signature de facture, identifiant du moteur de vérification, données chiffrées et horodatage."],
     ["Quand elle doit parvenir", "En temps réel en ligne. L'émission hors ligne est admise, avec transmission au retour de la connexion et un plafond de 24 heures ; le système cesse de fonctionner après une période donnée d'échecs de transmission."],
     ["Tickets de vente", "Admis pour les fournitures de faible valeur et de fort volume, imprimés ou envoyés par SMS ou courriel. Un ticket sans les coordonnées complètes de l'acheteur n'ouvre pas droit à déduction."],
   ]),
 }),
 dict(section="penalties_related", sort=0, t={
   "en": ("Penalties, and how hard they moved", [
     ["Invoicing outside the certified system", "Up to 50,000 currency points, or three times the tax involved, whichever is higher. Also covers false invoices, tampering, and failure to integrate or reconnect."],
     ["The scale of the change", "Under the previous Act the ceiling was 500 currency points. Act 1151 raised it a hundredfold on 1 January 2026."],
     ["Failure to issue an invoice at all", "A fine of up to 100 penalty units, or imprisonment of up to six months."],
     ["Failure to register", "Not less than three times the VAT on taxable supplies from when the duty arose, raised from twice."],
     ["Enforcement is real", "GRA field operations across Accra in May 2026 found selective receipt issuance and missing records; premises were sealed and an arrest was made."],
   ]),
   "es": ("Sanciones, y cuánto se movieron", [
     ["Facturar fuera del sistema certificado", "Hasta 50.000 puntos de moneda, o tres veces el impuesto en juego, lo que sea mayor. Cubre además facturas falsas, manipulación y no integrarse o no reconectar."],
     ["La magnitud del cambio", "Con la ley anterior el techo era de 500 puntos de moneda. La Ley 1151 lo multiplicó por cien el 1 de enero de 2026."],
     ["No emitir factura alguna", "Multa de hasta 100 unidades de sanción, o prisión de hasta seis meses."],
     ["No registrarse", "No menos de tres veces el IVA de las entregas gravadas desde que nació el deber, frente a dos veces antes."],
     ["La fiscalización es real", "Operaciones de campo de la GRA por Accra en mayo de 2026 hallaron emisión selectiva de tiques y falta de registros; se precintaron locales y se practicó una detención."],
   ]),
   "de": ("Sanktionen, und wie stark sie sich bewegt haben", [
     ["Rechnungsstellung ausserhalb des zertifizierten Systems", "Bis zu 50.000 Währungspunkte oder das Dreifache der betroffenen Steuer, je nachdem, was höher ist. Erfasst auch falsche Rechnungen, Manipulation sowie fehlende Integration oder Wiederverbindung."],
     ["Das Ausmass der Änderung", "Nach dem früheren Gesetz lag die Obergrenze bei 500 Währungspunkten. Gesetz 1151 hat sie am 1. Januar 2026 verhundertfacht."],
     ["Überhaupt keine Rechnung ausstellen", "Geldstrafe bis zu 100 Strafeinheiten oder Freiheitsstrafe bis zu sechs Monaten."],
     ["Fehlende Registrierung", "Mindestens das Dreifache der Mehrwertsteuer auf die steuerbaren Umsätze ab Entstehen der Pflicht, zuvor das Doppelte."],
     ["Die Durchsetzung ist real", "Feldeinsätze der GRA in Accra fanden im Mai 2026 selektive Belegausgabe und fehlende Aufzeichnungen; Geschäftsräume wurden versiegelt und eine Festnahme erfolgte."],
   ]),
   "fr": ("Sanctions, et l'ampleur de leur évolution", [
     ["Facturer hors du système certifié", "Jusqu'à 50 000 points monétaires, ou trois fois la taxe en jeu, le plus élevé l'emportant. Couvre aussi les fausses factures, l'altération et le défaut d'intégration ou de reconnexion."],
     ["L'ampleur du changement", "Sous la loi précédente, le plafond était de 500 points monétaires. La loi 1151 l'a centuplé le 1er janvier 2026."],
     ["Ne pas émettre de facture du tout", "Amende jusqu'à 100 unités de pénalité, ou emprisonnement jusqu'à six mois."],
     ["Défaut d'immatriculation", "Au moins trois fois la TVA sur les livraisons taxables depuis la naissance de l'obligation, contre deux fois auparavant."],
     ["Le contrôle est réel", "Des opérations de terrain de la GRA dans Accra en mai 2026 ont relevé une émission sélective de tickets et des registres manquants ; des locaux ont été scellés et une arrestation a eu lieu."],
   ]),
 }),
 dict(section="penalties_related", sort=1, t={
   "en": ("🔍 What we could not confirm", [
     ["The primary law itself", "The official texts of Act 1151 — both the Parliament copy and the GRA-hosted copy — and the GRA's January 2026 VAT guidelines are scanned images with no extractable text. Section-level quotations here rest on two legal-database transcriptions that agree with each other and with EY's and KPMG's summaries. Ghana is the first country on this site whose primary law we could not read."],
     ["Whether the later phases happened", "No GRA notice exists for Phase 3 or Phase 4. A vendor tracker reports around 4,000 taxpayers in 2025 and a 40,000 target for Q4 2025; May 2026 enforcement suggests coverage is still incomplete. Treat both as announced, not achieved."],
     ["The value of a currency point", "GHS 50,000 for 50,000 currency points is consistent across Deloitte and a Ghanaian tax-law source, but we could not read the statutory interpretation section that defines it."],
     ["Any register of accredited vendors", "The guidelines refer to authorised third-party software and Commissioner-General approval, but no published list was found."],
     ["The commencement instrument", "Act 1151 reportedly commences on a date fixed by executive instrument. The GRA states 1 January 2026, which is authoritative in practice, but the instrument itself was not located."],
   ]),
   "es": ("🔍 Lo que no pudimos confirmar", [
     ["La propia ley primaria", "Los textos oficiales de la Ley 1151 —tanto la copia del Parlamento como la alojada por la GRA— y las directrices de IVA de la GRA de enero de 2026 son imágenes escaneadas sin texto extraíble. Las citas de artículos se apoyan en dos transcripciones de bases jurídicas que concuerdan entre sí y con los resúmenes de EY y KPMG. Ghana es el primer país de este sitio cuya ley primaria no pudimos leer."],
     ["Si las fases posteriores ocurrieron", "No existe aviso de la GRA para la Fase 3 ni la 4. Un rastreador de proveedores habla de unos 4.000 contribuyentes en 2025 y un objetivo de 40.000 para el cuarto trimestre de 2025; la fiscalización de mayo de 2026 sugiere que la cobertura sigue incompleta. Trátense como anunciadas, no logradas."],
     ["El valor de un punto de moneda", "Que 50.000 puntos equivalgan a 50.000 GHS es coherente entre Deloitte y una fuente ghanesa de derecho tributario, pero no pudimos leer el artículo interpretativo que lo define."],
     ["Un registro de proveedores acreditados", "Las directrices mencionan software de terceros autorizado y la aprobación del Comisionado General, pero no se halló lista publicada."],
     ["El instrumento de entrada en vigor", "Se informa de que la Ley 1151 entra en vigor en la fecha que fije un instrumento ejecutivo. La GRA indica el 1 de enero de 2026, autoritativo en la práctica, pero no se localizó el instrumento."],
   ]),
   "de": ("🔍 Was wir nicht bestätigen konnten", [
     ["Das Primärrecht selbst", "Die amtlichen Texte des Gesetzes 1151 — sowohl die Parlamentsfassung als auch die von der GRA gehostete — und die GRA-MWST-Richtlinien vom Januar 2026 sind gescannte Bilder ohne extrahierbaren Text. Zitate auf Artikelebene stützen sich auf zwei Transkriptionen juristischer Datenbanken, die miteinander und mit den Zusammenfassungen von EY und KPMG übereinstimmen. Ghana ist das erste Land auf dieser Seite, dessen Primärrecht wir nicht lesen konnten."],
     ["Ob die späteren Phasen stattfanden", "Für Phase 3 und 4 existiert keine GRA-Mitteilung. Ein Anbieter-Tracker nennt rund 4.000 Steuerpflichtige im Jahr 2025 und ein Ziel von 40.000 für das vierte Quartal 2025; die Durchsetzung im Mai 2026 deutet auf weiterhin unvollständige Abdeckung. Beides als angekündigt behandeln, nicht als erreicht."],
     ["Der Wert eines Währungspunkts", "GHS 50.000 für 50.000 Währungspunkte deckt sich zwischen Deloitte und einer ghanaischen steuerrechtlichen Quelle, doch die definierende Auslegungsvorschrift war nicht lesbar."],
     ["Ein Verzeichnis akkreditierter Anbieter", "Die Richtlinien nennen zugelassene Drittsoftware und die Genehmigung des Commissioner-General, eine veröffentlichte Liste war jedoch nicht auffindbar."],
     ["Der Inkraftsetzungsakt", "Berichten zufolge tritt Gesetz 1151 zu einem durch Exekutivinstrument bestimmten Datum in Kraft. Die GRA nennt den 1. Januar 2026, praktisch massgeblich, doch das Instrument selbst wurde nicht gefunden."],
   ]),
   "fr": ("🔍 Ce que nous n'avons pas pu confirmer", [
     ["Le droit primaire lui-même", "Les textes officiels de la loi 1151 — copie du Parlement comme copie hébergée par la GRA — et les directives TVA de la GRA de janvier 2026 sont des images numérisées sans texte extractible. Les citations d'articles reposent sur deux transcriptions de bases juridiques concordantes entre elles et avec les synthèses d'EY et de KPMG. Le Ghana est le premier pays de ce site dont le droit primaire nous a été illisible."],
     ["Si les phases ultérieures ont eu lieu", "Aucun avis de la GRA n'existe pour la phase 3 ni la phase 4. Un tracker d'éditeurs évoque environ 4 000 contribuables en 2025 et une cible de 40 000 pour le quatrième trimestre 2025 ; les contrôles de mai 2026 suggèrent une couverture encore incomplète. À traiter comme annoncé, non comme réalisé."],
     ["La valeur d'un point monétaire", "L'équivalence de 50 000 points à 50 000 GHS est cohérente entre Deloitte et une source ghanéenne de droit fiscal, mais la disposition interprétative qui la définit n'a pas pu être lue."],
     ["Un registre de prestataires accrédités", "Les directives évoquent des logiciels tiers autorisés et l'agrément du Commissioner-General, mais aucune liste publiée n'a été trouvée."],
     ["L'acte d'entrée en vigueur", "La loi 1151 entrerait en vigueur à une date fixée par instrument exécutif. La GRA indique le 1er janvier 2026, qui fait autorité en pratique, mais l'instrument lui-même n'a pas été localisé."],
   ]),
 }),
]

STEPS = [
 {"en": ("Check which registration test applies to you", "Goods and services are now tested differently. If you supply services of any kind, there is no threshold — you register within thirty days of commencing taxable activity. If you supply goods, the threshold is GHS 750,000 with earlier monthly and quarterly triggers."),
  "es": ("Compruebe qué prueba de registro le aplica", "Bienes y servicios se prueban ahora de forma distinta. Si presta servicios de cualquier tipo, no hay umbral: se registra en treinta días desde el inicio de la actividad gravada. Si entrega bienes, el umbral es de 750.000 GHS, con activadores mensuales y trimestrales anteriores."),
  "de": ("Prüfen Sie, welcher Registrierungstest für Sie gilt", "Waren und Dienstleistungen werden inzwischen unterschiedlich geprüft. Wer Dienstleistungen jeder Art erbringt, hat keine Schwelle — Registrierung binnen dreissig Tagen ab Aufnahme der steuerbaren Tätigkeit. Wer Waren liefert, hat 750.000 GHS, mit früheren Monats- und Quartalsauslösern."),
  "fr": ("Vérifiez quel test d'assujettissement vous concerne", "Biens et services se testent désormais différemment. Si vous fournissez des services, quels qu'ils soient, il n'y a pas de seuil : vous vous enregistrez dans les trente jours du début de l'activité taxable. Pour les biens, le seuil est de 750 000 GHS, avec des déclencheurs mensuels et trimestriels antérieurs.")},
 {"en": ("Pick your route into the Certified Invoicing System", "Three exist: integrate your own ERP or POS by API, adopt the GRA's free E-VAT software, or buy accredited third-party software. No published register of accredited vendors was found, so verify a vendor's standing with the GRA directly rather than taking a claim on trust."),
  "es": ("Elija su vía hacia el Sistema Certificado de Facturación", "Hay tres: integrar su ERP o TPV por API, adoptar el software E-VAT gratuito de la GRA o comprar software acreditado de terceros. No se halló registro publicado de proveedores acreditados, así que verifique la condición de un proveedor con la GRA directamente y no por confianza."),
  "de": ("Wählen Sie Ihren Weg in das zertifizierte Rechnungssystem", "Es gibt drei: eigenes ERP oder Kassensystem per API integrieren, die kostenlose E-VAT-Software der GRA übernehmen oder akkreditierte Drittsoftware kaufen. Ein veröffentlichtes Verzeichnis akkreditierter Anbieter war nicht auffindbar; prüfen Sie den Status eines Anbieters daher direkt bei der GRA."),
  "fr": ("Choisissez votre voie vers le système certifié de facturation", "Il en existe trois : intégrer votre ERP ou votre caisse par API, adopter le logiciel E-VAT gratuit de la GRA, ou acheter un logiciel tiers accrédité. Aucun registre publié de prestataires accrédités n'a été trouvé : vérifiez le statut d'un éditeur directement auprès de la GRA.")},
 {"en": ("Design for the connection dropping, because the rules assume it will", "Offline issuance is permitted and the system keeps stamping for a period, but transmission must follow within 24 hours and E-VAT stops working after a set run of failed transmissions. Treat the offline window as an operating condition to be monitored, not an edge case."),
  "es": ("Diseñe para que se caiga la conexión, porque las reglas lo dan por hecho", "Se permite emitir sin conexión y el sistema sigue sellando durante un tiempo, pero la transmisión debe llegar en 24 horas y E-VAT deja de funcionar tras una serie determinada de envíos fallidos. Trate la ventana sin conexión como una condición operativa a vigilar, no como un caso extremo."),
  "de": ("Planen Sie für den Verbindungsabbruch, denn die Regeln setzen ihn voraus", "Offline-Ausstellung ist zulässig und das System stempelt eine Zeit lang weiter, doch die Übermittlung muss binnen 24 Stunden folgen, und E-VAT stellt nach einer bestimmten Serie fehlgeschlagener Übermittlungen den Betrieb ein. Behandeln Sie das Offline-Fenster als zu überwachende Betriebsbedingung, nicht als Sonderfall."),
  "fr": ("Concevez pour la coupure de connexion, car les règles la présupposent", "L'émission hors ligne est admise et le système continue d'estampiller un certain temps, mais la transmission doit suivre sous 24 heures et E-VAT cesse de fonctionner après une série donnée d'échecs. Traitez la fenêtre hors ligne comme une condition d'exploitation à surveiller, non comme un cas limite.")},
 {"en": ("Keep six years of records, and expect the retail layer to arrive", "Retention is six years under the Revenue Administration Act, longer while a dispute or investigation is open, and the Commissioner-General has unrestricted access during business hours. Separately, Parliament approved forty thousand fiscal electronic devices for retail points of sale in July 2026; if you sell to consumers, that is the next thing to reach you."),
  "es": ("Conserve seis años de registros, y espere la capa minorista", "La conservación es de seis años según la Ley de Administración de Ingresos, más mientras haya litigio o inspección abiertos, y el Comisionado General tiene acceso irrestricto en horario laboral. Aparte, el Parlamento aprobó cuarenta mil dispositivos fiscales para puntos de venta minoristas en julio de 2026; si vende a consumidores, eso es lo siguiente que le llegará."),
  "de": ("Bewahren Sie sechs Jahre auf und rechnen Sie mit der Einzelhandelsebene", "Die Aufbewahrung beträgt sechs Jahre nach dem Revenue Administration Act, länger bei offenem Streit oder offener Prüfung, und der Commissioner-General hat während der Geschäftszeiten uneingeschränkten Zugang. Davon getrennt bewilligte das Parlament im Juli 2026 vierzigtausend Fiskalgeräte für Einzelhandelskassen; wer an Verbraucher verkauft, wird davon als Nächstes erreicht."),
  "fr": ("Conservez six ans, et attendez-vous à la couche commerce de détail", "La conservation est de six ans selon la loi sur l'administration des recettes, davantage tant qu'un litige ou un contrôle reste ouvert, et le Commissioner-General dispose d'un accès sans restriction aux heures ouvrables. Par ailleurs, le Parlement a approuvé quarante mille appareils fiscaux pour les points de vente en juillet 2026 ; si vous vendez aux consommateurs, c'est la prochaine chose qui vous atteindra.")},
]

PORTALS = [
 ("https://gra.gov.gh/e-services/e-vat/", {"en": "GRA E-VAT — the Certified Invoicing System",
   "es": "GRA E-VAT — el Sistema Certificado de Facturación", "de": "GRA E-VAT — das zertifizierte Rechnungssystem",
   "fr": "GRA E-VAT — le système certifié de facturation"}),
 ("https://evatgra.zendesk.com/hc/en-us/", {"en": "GRA E-VAT support desk — integration and transmission guidance",
   "es": "Soporte E-VAT de la GRA — orientación de integración y transmisión", "de": "GRA E-VAT-Support — Hinweise zu Integration und Übertragung",
   "fr": "Support E-VAT de la GRA — intégration et transmission"}),
 ("https://taxpayersportal.com", {"en": "GRA Taxpayers' Portal — filing and payment",
   "es": "Portal del Contribuyente de la GRA — declaración y pago", "de": "GRA-Steuerzahlerportal — Erklärung und Zahlung",
   "fr": "Portail des contribuables de la GRA — déclaration et paiement"}),
 ("https://gra.gov.gh/practice-notes/", {"en": "GRA practice notes and administrative guidelines",
   "es": "Notas de práctica y directrices administrativas de la GRA", "de": "Praxishinweise und Verwaltungsrichtlinien der GRA",
   "fr": "Notes de pratique et directives administratives de la GRA"}),
]

out = []
w = out.append
w("-- Ghana deep dive. GENERATED by gen_ghana_deep_dive.py -- edit the")
w("-- generator. See its docstring for the three things this page has to")
w("-- get right: the date, the model, and the threshold that is not one")
w("-- number.")
w("")
w("INSERT OR IGNORE INTO deep_dive_pages (country_id, last_updated) SELECT id, '2026-08-27' FROM countries WHERE code = 'GH';")
w("")
for lang in LANGS:
    p = PAGE[lang]
    w("INSERT OR IGNORE INTO deep_dive_page_translations (country_id, lang, compliance_model, footer_disclaimer,"
      " timeline_intro, file_format_intro, scope_intro, steps_intro, penalties_intro, mandate_summary, mandate_summary_icon)")
    w(f"SELECT id, '{lang}', {lit(p['compliance_model'])}, {lit(p['footer_disclaimer'])}, {lit(p['timeline_intro'])},"
      f" {lit(p['file_format_intro'])}, {lit(p['scope_intro'])}, {lit(p['steps_intro'])}, {lit(p['penalties_intro'])},"
      f" {lit(p['mandate_summary'])}, {lit(p['mandate_summary_icon'])} FROM countries WHERE code = 'GH';")
    w("")

w("-- ---- stat strip: nothing the headline tiles above already state ----")
for i, s in enumerate(STATS):
    w(f"INSERT INTO deep_dive_stats (country_id, sort_order) SELECT c.id, {i} FROM countries c WHERE c.code = 'GH'")
    w(f"  AND NOT EXISTS (SELECT 1 FROM deep_dive_stats d WHERE d.country_id = c.id AND d.sort_order = {i});")
    for lang in LANGS:
        v, l = s[lang]
        w("INSERT OR IGNORE INTO deep_dive_stat_translations (stat_id, lang, stat_value, stat_label)")
        w(f"SELECT d.id, '{lang}', {lit(v)}, {lit(l)} FROM deep_dive_stats d WHERE d.country_id = {CID} AND d.sort_order = {i};")
    w("")

w("-- ---- cards ----")
for c in CARDS:
    sec, so = c["section"], c["sort"]
    w(f"INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT c.id, '{sec}', {so} FROM countries c WHERE c.code = 'GH'")
    w(f"  AND NOT EXISTS (SELECT 1 FROM deep_dive_cards d WHERE d.country_id = c.id AND d.section = '{sec}' AND d.sort_order = {so});")
    for lang in LANGS:
        title, rows = c["t"][lang]
        w("INSERT OR IGNORE INTO deep_dive_card_translations (card_id, lang, title, rows_json)")
        w(f"SELECT d.id, '{lang}', {lit(title)}, {lit(json.dumps(rows, ensure_ascii=False))} FROM deep_dive_cards d WHERE d.country_id = {CID} AND d.section = '{sec}' AND d.sort_order = {so};")
    w("")

w("-- ---- steps ----")
for i, s in enumerate(STEPS):
    w(f"INSERT INTO deep_dive_steps (country_id, sort_order) SELECT c.id, {i} FROM countries c WHERE c.code = 'GH'")
    w(f"  AND NOT EXISTS (SELECT 1 FROM deep_dive_steps d WHERE d.country_id = c.id AND d.sort_order = {i});")
    for lang in LANGS:
        t, d = s[lang]
        w("INSERT OR IGNORE INTO deep_dive_step_translations (step_id, lang, title, description)")
        w(f"SELECT s.id, '{lang}', {lit(t)}, {lit(d)} FROM deep_dive_steps s WHERE s.country_id = {CID} AND s.sort_order = {i};")
    w("")

w("-- ---- portals ----")
for i, (url, labels) in enumerate(PORTALS):
    w(f"INSERT INTO deep_dive_portals (country_id, url, sort_order) SELECT c.id, {lit(url)}, {i} FROM countries c WHERE c.code = 'GH'")
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
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_cards WHERE country_id = {CID} = {len(CARDS)}")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_steps WHERE country_id = {CID} = {len(STEPS)}")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_portals WHERE country_id = {CID} = {len(PORTALS)}")
for lang in LANGS:
    w(f"-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id WHERE d.country_id = {CID} AND t.lang = '{lang}' = {len(CARDS)}")
    w(f"-- ASSERT: SELECT count(*) FROM deep_dive_step_translations t JOIN deep_dive_steps s ON s.id = t.step_id WHERE s.country_id = {CID} AND t.lang = '{lang}' = {len(STEPS)}")
w("-- The free-form strip must not restate a headline tile:")
w(f"-- ASSERT: SELECT count(*) FROM deep_dive_stat_translations t JOIN deep_dive_stats d ON d.id = t.stat_id WHERE d.country_id = {CID} AND (t.stat_label LIKE '%archiv%' OR t.stat_label LIKE '%signature%' OR t.stat_label LIKE '%retention%') = 0")

print("\n".join(out))
