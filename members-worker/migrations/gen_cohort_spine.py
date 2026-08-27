#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_cohort_spine.py — emits 700_cohort_spine.sql.

Edit this file, not the SQL. Run:
    python3 gen_cohort_spine.py > 700_cohort_spine.sql

BUNDLE 3, FIRST PASS. Liechtenstein, Switzerland and Hong Kong -- the
three Dan named -- put onto the section-02 spine and brought up to the
section-05 floor. Botswana and Ghana are the same shape and come next;
the other 71 follow.

WHAT WAS WRONG. Each of these carried ONE section-02 card holding four or
five rows that covered the spine topics anyway, under a bespoke title:
"Format, transmission and what does not exist", "Where the obligation
actually lives", "What does reach an invoice, when no format rule does".
Good rows, filed where a reader comparing two markets cannot find them.
Section 02 renders its numbered heading and lead paragraph regardless, so
one card sat alone in a grid built for four.

AND ARCHIVING WAS IN THE WRONG SECTION. All three kept retention under
05 Penalties. In the July cohort "Archiving" is a section-02 card, used
by ten countries. Moving it back is most of why 05 then fell below its
floor of three, and the replacements are not padding -- they are content
already on these pages in the wrong place or in prose:
Liechtenstein's EEA asymmetry, Switzerland's cantonal frontier, and for
both, the fact that no e-invoicing penalty exists because no issuing duty
does. That last one is worth its own card on any no-mandate country.

NOTHING HERE IS NEW RESEARCH. Every row is redistributed or condensed
from what these three pages already said, or from their headline facts.
Two rows are genuinely new and both are negatives that the spine forces
into the open: Liechtenstein and Hong Kong had no statement of what
identifier a supplier uses, because nobody had asked the question in that
shape. A spine is worth having partly because it asks.

The generator REFUSES TO EMIT if a country would end up outside the
framework's card counts.
"""
import json, sys

LANGS = ("en", "es", "de", "fr")
SEC2_MIN, SEC2_MAX = 3, 5
SEC5_MIN, SEC5_MAX = 3, 4

def esc(s): return s.replace("'", "''")
def lit(s): return "'" + esc(s) + "'"

# The spine titles, in the four languages. Sixteen strings that replace
# a hundred and forty-seven distinct section-02 titles across the site.
SPINE = [
 {"en": "Format & standard",          "es": "Formato y estándar",        "de": "Format und Standard",       "fr": "Format et norme"},
 {"en": "Identifiers & registration", "es": "Identificadores y registro","de": "Kennungen und Registrierung","fr": "Identifiants et enregistrement"},
 {"en": "Mandatory content",          "es": "Contenido obligatorio",     "de": "Pflichtangaben",            "fr": "Mentions obligatoires"},
 {"en": "Archiving",                  "es": "Conservación",              "de": "Aufbewahrung",              "fr": "Conservation"},
]

# ---------------------------------------------------------------------
# section 02: four spine cards per country, rows only.
# ---------------------------------------------------------------------
SEC2 = {
"Liechtenstein": [
 [ # Format & standard
  {"en": [["Standard", "EN 16931, as the directive requires. No national CIUS is in effect; the Commission notes a draft addressing VAT requirements."],
          ["Transmission", "By e-mail to the contracting authority, in XML or PDF. There is no national e-invoicing platform and none is planned."],
          ["Peppol", "No Peppol Authority in Liechtenstein, and none in Switzerland. A supplier using Peppol does so commercially, not to comply."]],
   "es": [["Estándar", "EN 16931, como exige la directiva. No hay CIUS nacional en vigor; la Comisión menciona un borrador sobre requisitos de IVA."],
          ["Transmisión", "Por correo electrónico a la entidad contratante, en XML o PDF. No hay plataforma nacional de facturación ni está prevista."],
          ["Peppol", "No hay autoridad Peppol en Liechtenstein ni en Suiza. Quien use Peppol lo hace comercialmente, no para cumplir."]],
   "de": [["Standard", "EN 16931, wie die Richtlinie verlangt. Kein nationales CIUS in Kraft; die Kommission nennt einen Entwurf zu MWST-Anforderungen."],
          ["Übermittlung", "Per E-Mail an die Vergabestelle, als XML oder PDF. Eine nationale E-Rechnungsplattform gibt es nicht und ist nicht geplant."],
          ["Peppol", "Keine Peppol-Behörde in Liechtenstein und keine in der Schweiz. Wer Peppol nutzt, tut es kommerziell, nicht zur Erfüllung."]],
   "fr": [["Norme", "EN 16931, comme l'exige la directive. Aucun CIUS national en vigueur ; la Commission signale un projet sur les exigences de TVA."],
          ["Transmission", "Par courriel au pouvoir adjudicateur, en XML ou PDF. Il n'existe pas de plateforme nationale et aucune n'est prévue."],
          ["Peppol", "Pas d'autorité Peppol au Liechtenstein, ni en Suisse. Recourir à Peppol relève du commerce, non de la conformité."]]},
 ],
 [ # Identifiers & registration
  {"en": [["Taxpayer identifier", "The Liechtenstein VAT number, issued by the national tax administration — not a Swiss one, despite the shared VAT statute."],
          ["Supplier registration", "None. There is no register to join and no accreditation to obtain before invoicing a contracting authority."],
          ["Where competence sits", "Competence follows seat, not turnover: a Liechtenstein-seated business files with Liechtenstein."]],
   "es": [["Identificador fiscal", "El número de IVA liechtensteiniano, emitido por la administración nacional, y no uno suizo pese a compartir la ley del IVA."],
          ["Registro del proveedor", "Ninguno. No hay registro al que adherirse ni acreditación previa para facturar a una entidad contratante."],
          ["Dónde reside la competencia", "La competencia sigue a la sede, no a la cifra de negocio: una empresa con sede en Liechtenstein declara en Liechtenstein."]],
   "de": [["Steuerliche Kennung", "Die liechtensteinische MWST-Nummer der nationalen Steuerverwaltung — keine schweizerische, trotz des gemeinsamen MWST-Rechts."],
          ["Lieferantenregistrierung", "Keine. Es gibt kein Register und keine Akkreditierung, bevor man einer Vergabestelle Rechnung stellt."],
          ["Wo die Zuständigkeit liegt", "Die Zuständigkeit folgt dem Sitz, nicht dem Umsatz: ein in Liechtenstein ansässiges Unternehmen deklariert dort."]],
   "fr": [["Identifiant fiscal", "Le numéro de TVA liechtensteinois, délivré par l'administration nationale — non suisse, malgré la loi de TVA commune."],
          ["Enregistrement du fournisseur", "Aucun. Il n'existe ni registre à rejoindre ni agrément à obtenir avant de facturer un pouvoir adjudicateur."],
          ["Où siège la compétence", "La compétence suit le siège, non le chiffre d'affaires : une entreprise établie au Liechtenstein y déclare."]]},
 ],
 [ # Mandatory content
  {"en": [["Invoice particulars", "The Swiss VAT Act's content requirements apply in substance under the treaty of 28 October 1994, administered nationally."],
          ["For the B2G channel", "EN 16931's semantic model where a structured invoice is sent. Nothing additional is imposed nationally."],
          ["Threshold", "The receive obligation is expressed as applying above EU procurement thresholds."]],
   "es": [["Menciones de la factura", "Los requisitos de contenido de la ley suiza del IVA se aplican en sustancia por el tratado de 28 de octubre de 1994."],
          ["Para el canal B2G", "El modelo semántico de EN 16931 cuando se envía factura estructurada. Nada adicional se impone a escala nacional."],
          ["Umbral", "La obligación de recepción se expresa como aplicable por encima de los umbrales de contratación de la UE."]],
   "de": [["Rechnungsangaben", "Die Inhaltsvorgaben des Schweizer MWSTG gelten der Substanz nach über den Vertrag vom 28. Oktober 1994, national verwaltet."],
          ["Für den B2G-Kanal", "Das semantische Modell der EN 16931, wenn strukturiert fakturiert wird. National kommt nichts hinzu."],
          ["Schwelle", "Die Empfangspflicht ist als oberhalb der EU-Vergabeschwellen geltend formuliert."]],
   "fr": [["Mentions de la facture", "Les exigences de contenu de la loi suisse de TVA s'appliquent en substance par le traité du 28 octobre 1994."],
          ["Pour le canal B2G", "Le modèle sémantique de l'EN 16931 lorsqu'une facture structurée est envoyée. Rien de plus au niveau national."],
          ["Seuil", "L'obligation de réception est formulée comme s'appliquant au-delà des seuils de marchés publics de l'UE."]]},
 ],
 [ # Archiving
  {"en": [["Ten years", "From the end of the financial year of the last entries, under PGR Art. 1059 and separately under the VAT Act."],
          ["Twenty years", "For records concerning immovable property."],
          ["Electronic retention", "Permitted. Records must not be alterable undetectably and must remain readable at any time."],
          ["Signatures", "Named in the ordinance as one example of assuring integrity, alongside others. Not a requirement."]],
   "es": [["Diez años", "Desde el cierre del ejercicio de los últimos asientos, según el art. 1059 del PGR y, por separado, la ley del IVA."],
          ["Veinte años", "Para los documentos relativos a bienes inmuebles."],
          ["Conservación electrónica", "Permitida. Los registros no deben poder alterarse de forma indetectable y han de seguir siendo legibles."],
          ["Firmas", "El reglamento las cita como un ejemplo de garantía de integridad, junto a otros. No son un requisito."]],
   "de": [["Zehn Jahre", "Ab Ende des Geschäftsjahres der letzten Eintragungen, nach Art. 1059 PGR und gesondert nach dem MWST-Gesetz."],
          ["Zwanzig Jahre", "Für Unterlagen zu Grundstücken."],
          ["Elektronische Aufbewahrung", "Zulässig. Aufzeichnungen dürfen nicht unbemerkt veränderbar sein und müssen jederzeit lesbar bleiben."],
          ["Signaturen", "In der Verordnung als ein Beispiel der Integritätssicherung genannt, neben anderen. Keine Pflicht."]],
   "fr": [["Dix ans", "À compter de la clôture de l'exercice des dernières écritures, selon l'art. 1059 PGR et, séparément, la loi de TVA."],
          ["Vingt ans", "Pour les documents relatifs aux immeubles."],
          ["Conservation électronique", "Admise. Les documents ne doivent pas être modifiables sans détection et doivent rester lisibles à tout moment."],
          ["Signatures", "L'ordonnance les cite comme un exemple d'assurance de l'intégrité, parmi d'autres. Ce n'est pas une exigence."]]},
 ],
],
"Switzerland": [
 [ # Format & standard
  {"en": [["Prescribed format", "None. The Confederation accepts structured data through a service provider, or a PDF sent by e-mail."],
          ["Standard", "Neither EN 16931 nor Peppol BIS is referenced anywhere in the Confederation's own pages. There is no Peppol Authority."],
          ["One detail that has moved", "Since 30 June 2023 a PDF must go by e-mail rather than through a service provider."]],
   "es": [["Formato prescrito", "Ninguno. La Confederación acepta datos estructurados vía proveedor de servicios, o un PDF enviado por correo."],
          ["Estándar", "Ni EN 16931 ni Peppol BIS aparecen en las páginas de la Confederación. No hay autoridad Peppol."],
          ["Un detalle que cambió", "Desde el 30 de junio de 2023 el PDF debe ir por correo y no a través de un proveedor."]],
   "de": [["Vorgeschriebenes Format", "Keines. Der Bund akzeptiert strukturierte Daten über einen Service-Provider oder ein PDF per E-Mail."],
          ["Standard", "Weder EN 16931 noch Peppol BIS wird auf den Seiten des Bundes erwähnt. Eine Peppol-Behörde gibt es nicht."],
          ["Ein Detail, das sich bewegt hat", "Seit dem 30. Juni 2023 muss ein PDF per E-Mail und nicht über einen Provider kommen."]],
   "fr": [["Format prescrit", "Aucun. La Confédération accepte des données structurées via un prestataire, ou un PDF envoyé par courriel."],
          ["Norme", "Ni l'EN 16931 ni Peppol BIS ne figurent sur les pages de la Confédération. Il n'y a pas d'autorité Peppol."],
          ["Un détail qui a bougé", "Depuis le 30 juin 2023, un PDF doit passer par courriel et non par un prestataire."]]},
 ],
 [ # Identifiers & registration
  {"en": [["Taxpayer identifier", "The UID, the Swiss business identification number, which also serves as the VAT number."],
          ["Supplier registration", "None to invoice the Confederation. The Federal Finance Administration publishes the list of units that receive e-invoices."],
          ["eBill is not this", "A commercial network operated by SIX for the financial sector. Joining it is a business decision, not a compliance step."]],
   "es": [["Identificador fiscal", "El UID, número suizo de identificación empresarial, que sirve también como número de IVA."],
          ["Registro del proveedor", "Ninguno para facturar a la Confederación. La Administración Federal de Finanzas publica la lista de unidades receptoras."],
          ["eBill no es esto", "Una red comercial operada por SIX para el sector financiero. Adherirse es una decisión de negocio, no de cumplimiento."]],
   "de": [["Steuerliche Kennung", "Die UID, die schweizerische Unternehmens-Identifikationsnummer, die zugleich als MWST-Nummer dient."],
          ["Lieferantenregistrierung", "Keine, um dem Bund Rechnung zu stellen. Die Eidgenössische Finanzverwaltung führt die Liste der empfangenden Einheiten."],
          ["eBill ist nicht dies", "Ein von SIX für den Finanzsektor betriebenes kommerzielles Netz. Der Beitritt ist eine Geschäfts-, keine Compliance-Entscheidung."]],
   "fr": [["Identifiant fiscal", "L'IDE, le numéro suisse d'identification des entreprises, qui sert aussi de numéro de TVA."],
          ["Enregistrement du fournisseur", "Aucun pour facturer la Confédération. L'Administration fédérale des finances publie la liste des unités destinataires."],
          ["eBill n'est pas cela", "Un réseau commercial exploité par SIX pour le secteur financier. Y adhérer est un choix d'affaires, non de conformité."]]},
 ],
 [ # Mandatory content
  {"en": [["Invoice particulars", "The VAT Act's content requirements, unchanged by the procurement duty."],
          ["For the B2G duty", "Nothing additional. The obligation is to invoice without paper, not in a specified layout."],
          ["Where the obligation lives", "Clause 9.4 of the Confederation's procurement standard terms. There is no SR-numbered ordinance behind it."],
          ["Which is why the threshold reads oddly", "Only the standard terms say CHF 5,000 \"excluding VAT\". Every official prose page gives the figure without that qualifier."]],
   "es": [["Menciones de la factura", "Los requisitos de contenido de la ley del IVA, sin cambios por el deber de contratación."],
          ["Para el deber B2G", "Nada adicional. La obligación es facturar sin papel, no en un formato determinado."],
          ["Dónde vive la obligación", "La cláusula 9.4 de las condiciones generales de contratación. No hay reglamento con número SR detrás."],
          ["Por eso el umbral se lee raro", "Solo las condiciones generales dicen 5.000 CHF «sin IVA». Las páginas oficiales dan la cifra sin ese matiz."]],
   "de": [["Rechnungsangaben", "Die Inhaltsvorgaben des MWST-Gesetzes, von der Beschaffungspflicht unberührt."],
          ["Für die B2G-Pflicht", "Nichts zusätzlich. Die Pflicht ist, papierlos zu fakturieren, nicht in einem bestimmten Layout."],
          ["Wo die Pflicht wohnt", "Ziffer 9.4 der AGB des Bundes. Eine SR-nummerierte Verordnung dahinter gibt es nicht."],
          ["Daher liest sich die Schwelle seltsam", "Nur die AGB sagen CHF 5'000 «exkl. MWST». Jede amtliche Fliesstextseite nennt den Betrag ohne diesen Zusatz."]],
   "fr": [["Mentions de la facture", "Les exigences de contenu de la loi de TVA, inchangées par l'obligation de marché public."],
          ["Pour l'obligation B2G", "Rien de plus. L'obligation est de facturer sans papier, non dans une présentation donnée."],
          ["Où vit l'obligation", "La clause 9.4 des conditions générales de la Confédération. Aucune ordonnance numérotée RS derrière."],
          ["D'où un seuil qui se lit mal", "Seules les conditions générales disent 5 000 CHF « hors TVA ». Les pages officielles donnent le chiffre sans cette précision."]]},
 ],
 [ # Archiving
  {"en": [["Ten years", "From the end of the financial year, under Code of Obligations art. 958f, for accounting books and vouchers."],
          ["Twenty-six years", "For records concerning immovable property — the ten-year absolute limitation running past the twenty-year adjustment period. Not twenty, which is the number a page guesses."],
          ["Electronic media", "Permitted. Unalterable media satisfy the business-records ordinance without further conditions."],
          ["Signature", "Not required. The former ElDI-V regime survives only as history; ordinary bookkeeping controls govern."]],
   "es": [["Diez años", "Desde el cierre del ejercicio, según el art. 958f del Código de Obligaciones, para libros y justificantes."],
          ["Veintiséis años", "Para documentos sobre inmuebles: la prescripción absoluta de diez años corriendo tras el período de ajuste de veinte. No veinte, que es la cifra que se supone."],
          ["Soportes electrónicos", "Permitidos. Los soportes inalterables cumplen el reglamento sobre libros sin condiciones adicionales."],
          ["Firma", "No exigida. El antiguo régimen ElDI-V solo pervive como historia; rigen los controles contables ordinarios."]],
   "de": [["Zehn Jahre", "Ab Ende des Geschäftsjahres nach Art. 958f OR, für Geschäftsbücher und Belege."],
          ["Sechsundzwanzig Jahre", "Für Unterlagen zu Grundstücken — die zehnjährige absolute Verjährung, die über die zwanzigjährige Korrekturfrist hinausläuft. Nicht zwanzig, die geratene Zahl."],
          ["Elektronische Datenträger", "Zulässig. Unveränderbare Träger erfüllen die Geschäftsbücherverordnung ohne weitere Bedingungen."],
          ["Signatur", "Nicht erforderlich. Die frühere ElDI-V lebt nur als Geschichte fort; es gelten gewöhnliche Buchführungskontrollen."]],
   "fr": [["Dix ans", "À compter de la clôture de l'exercice, selon l'art. 958f du Code des obligations, pour les livres et pièces."],
          ["Vingt-six ans", "Pour les documents relatifs aux immeubles : la prescription absolue de dix ans courant au-delà de la période d'ajustement de vingt. Non vingt, le chiffre que l'on devine."],
          ["Supports électroniques", "Admis. Les supports inaltérables satisfont l'ordonnance sur les livres sans condition supplémentaire."],
          ["Signature", "Non exigée. L'ancien régime ElDI-V ne subsiste qu'à titre historique ; les contrôles comptables ordinaires régissent."]]},
 ],
],
"Hong Kong": [
 [ # Format & standard
  {"en": [["Prescribed format", "None, because nothing prescribes an invoice. Whether you send PDF, EDI or paper is a matter between you and your customer."],
          ["Legal recognition", "The Electronic Transactions Ordinance (Cap. 553) gives electronic records the same legal standing as paper."],
          ["The Government's own format", "The e-Procurement Programme uses UBL 2.0 with minor modifications over OASIS ebXML Messaging 2.0 — not Peppol, not EN 16931."],
          ["Peppol", "Hong Kong has no Peppol Authority. Commercial access points will onboard a Hong Kong business for trade with mandated markets; that is a vendor fact."]],
   "es": [["Formato prescrito", "Ninguno, porque nada prescribe una factura. Enviar PDF, EDI o papel es asunto entre usted y su cliente."],
          ["Reconocimiento legal", "La Electronic Transactions Ordinance (Cap. 553) da a los registros electrónicos el mismo valor legal que al papel."],
          ["El formato del Gobierno", "El programa de contratación electrónica usa UBL 2.0 con modificaciones menores sobre ebXML 2.0: ni Peppol ni EN 16931."],
          ["Peppol", "Hong Kong no tiene autoridad Peppol. Los puntos de acceso comerciales dan de alta a empresas hongkonesas: eso es un hecho de proveedor."]],
   "de": [["Vorgeschriebenes Format", "Keines, weil nichts eine Rechnung vorschreibt. Ob PDF, EDI oder Papier, ist Sache zwischen Ihnen und Ihrem Kunden."],
          ["Rechtliche Anerkennung", "Die Electronic Transactions Ordinance (Cap. 553) stellt elektronische Aufzeichnungen dem Papier rechtlich gleich."],
          ["Das Format der Regierung", "Das e-Procurement-Programm nutzt UBL 2.0 mit geringfügigen Anpassungen über ebXML 2.0 — nicht Peppol, nicht EN 16931."],
          ["Peppol", "Hongkong hat keine Peppol-Behörde. Kommerzielle Access Points nehmen Hongkonger Unternehmen auf; das ist eine Anbietertatsache."]],
   "fr": [["Format prescrit", "Aucun, puisque rien ne prescrit de facture. Envoyer un PDF, de l'EDI ou du papier relève de vous et de votre client."],
          ["Reconnaissance juridique", "L'Electronic Transactions Ordinance (Cap. 553) donne aux documents électroniques la même valeur qu'au papier."],
          ["Le format du Gouvernement", "Le programme e-Procurement emploie UBL 2.0 légèrement modifié sur ebXML 2.0 — ni Peppol, ni EN 16931."],
          ["Peppol", "Hong Kong n'a pas d'autorité Peppol. Des points d'accès commerciaux inscrivent les entreprises hongkongaises : fait de marché."]]},
 ],
 [ # Identifiers & registration
  {"en": [["Taxpayer identifier", "The Business Registration Number. There is no VAT number, because there is no VAT."],
          ["Supplier registration", "None required. Registering for the e-Procurement Programme is optional and is not a condition of being invited to quote."],
          ["Accreditation", "No register of accredited providers exists, because there is no mandate to accredit against."]],
   "es": [["Identificador fiscal", "El número de registro mercantil. No hay número de IVA, porque no hay IVA."],
          ["Registro del proveedor", "No se exige. Registrarse en el programa de contratación electrónica es opcional y no condiciona ser invitado a cotizar."],
          ["Acreditación", "No existe registro de proveedores acreditados, porque no hay obligación frente a la que acreditar."]],
   "de": [["Steuerliche Kennung", "Die Business Registration Number. Eine MWST-Nummer gibt es nicht, weil es keine Mehrwertsteuer gibt."],
          ["Lieferantenregistrierung", "Nicht erforderlich. Die Registrierung im e-Procurement-Programm ist freiwillig und keine Bedingung für eine Angebotseinladung."],
          ["Akkreditierung", "Ein Register akkreditierter Anbieter existiert nicht, weil es keine Pflicht gibt, gegen die akkreditiert würde."]],
   "fr": [["Identifiant fiscal", "Le Business Registration Number. Il n'y a pas de numéro de TVA, puisqu'il n'y a pas de TVA."],
          ["Enregistrement du fournisseur", "Non requis. S'inscrire au programme e-Procurement est facultatif et ne conditionne pas l'invitation à soumissionner."],
          ["Agrément", "Aucun registre de prestataires agréés n'existe, faute d'obligation au regard de laquelle agréer."]]},
 ],
 [ # Mandatory content
  {"en": [["The company-name rule", "Cap. 622B s.4 requires a company's registered name and liability status on invoices, in hard copy or electronic form."],
          ["The record-sufficiency rule", "IRO s.51C: invoice copies must show goods, buyers and sellers in enough detail for the Commissioner to verify readily. An evidential standard, not a field list."],
          ["What is not required", "No prescribed field list, no sequential numbering rule, no language or currency requirement."]],
   "es": [["La regla del nombre societario", "El art. 4 del Cap. 622B exige el nombre registrado y el estado de responsabilidad en las facturas, en papel o electrónicas."],
          ["La regla de suficiencia", "Art. 51C: las copias deben mostrar bienes, compradores y vendedores con detalle bastante para verificar. Un estándar probatorio, no una lista de campos."],
          ["Qué no se exige", "Ni lista de campos prescrita, ni regla de numeración correlativa, ni requisito de idioma o moneda."]],
   "de": [["Die Firmennamensregel", "Cap. 622B Abschnitt 4 verlangt eingetragenen Namen und Haftungsform auf Rechnungen, in Papier- wie elektronischer Form."],
          ["Die Regel ausreichender Aufzeichnung", "Abschnitt 51C: Kopien müssen Waren, Käufer und Verkäufer hinreichend ausweisen. Ein Beweismaßstab, keine Feldliste."],
          ["Was nicht verlangt wird", "Keine vorgeschriebene Feldliste, keine fortlaufende Nummerierung, keine Sprach- oder Währungsvorgabe."]],
   "fr": [["La règle du nom social", "L'art. 4 du Cap. 622B exige le nom enregistré et la forme de responsabilité sur les factures, papier comme électroniques."],
          ["La règle de suffisance", "Art. 51C : les copies doivent faire apparaître biens, acheteurs et vendeurs avec un détail suffisant. Norme de preuve, non liste de champs."],
          ["Ce qui n'est pas exigé", "Aucune liste de champs prescrite, aucune numérotation séquentielle, aucune exigence de langue ou de devise."]]},
 ],
 [ # Archiving
  {"en": [["Seven years", "Business records under Inland Revenue Ordinance s.51C, from the transaction date."],
          ["Electronic retention", "Permitted, and no prior IRD approval is needed."],
          ["The contradiction", "A 1995 IRD pamphlet says source documents must be kept even if books are computerised; a May 2024 pamphlet permits imaged records to replace originals. Follow the 2024 one, being later and more specific."],
          ["Signature", "Not required. Nothing requires an invoice to be signed, because nothing requires an invoice to be anything."]],
   "es": [["Siete años", "Libros de empresa según el art. 51C de la Inland Revenue Ordinance, desde la fecha de la operación."],
          ["Conservación electrónica", "Permitida, y sin aprobación previa del departamento."],
          ["La contradicción", "Un folleto de 1995 exige conservar los documentos fuente aunque los libros sean informáticos; otro de mayo de 2024 admite imágenes en lugar de originales. Siga el de 2024, posterior y más específico."],
          ["Firma", "No exigida. Nada obliga a firmar una factura, porque nada obliga a que una factura sea nada."]],
   "de": [["Sieben Jahre", "Geschäftsunterlagen nach Abschnitt 51C der Inland Revenue Ordinance, ab dem Datum des Geschäftsvorfalls."],
          ["Elektronische Aufbewahrung", "Zulässig, und ohne vorherige Genehmigung der Behörde."],
          ["Der Widerspruch", "Ein Merkblatt von 1995 verlangt Ursprungsbelege auch bei EDV-Buchführung; eines vom Mai 2024 lässt Abbilder statt Originale zu. Folgen Sie dem von 2024, dem späteren und spezielleren."],
          ["Signatur", "Nicht erforderlich. Nichts verlangt eine unterschriebene Rechnung, weil nichts verlangt, dass eine Rechnung irgendetwas ist."]],
   "fr": [["Sept ans", "Les livres d'entreprise selon l'art. 51C de l'Inland Revenue Ordinance, à compter de la date de l'opération."],
          ["Conservation électronique", "Admise, et sans approbation préalable de l'administration."],
          ["La contradiction", "Une brochure de 1995 impose de garder les pièces sources même en comptabilité informatisée ; une de mai 2024 admet des images à la place des originaux. Suivez celle de 2024, plus récente et plus précise."],
          ["Signature", "Non exigée. Rien n'impose de signer une facture, puisque rien n'impose qu'une facture soit quoi que ce soit."]]},
 ],
],
}

# ---------------------------------------------------------------------
# section 05: replacement cards. Titles are NOT a spine -- penalties
# genuinely differ between markets -- but the floor of three is real.
# ---------------------------------------------------------------------
SEC5 = {
"Liechtenstein": [
 {"t": {"en": "What is actually enforced", "es": "Qué se exige realmente",
        "de": "Was tatsächlich durchgesetzt wird", "fr": "Ce qui est réellement sanctionné"},
  "r": {"en": [["No e-invoicing penalty", "There is none, because no supplier has a duty to issue. The obligation runs the other way, onto the contracting authority."],
               ["What does bind you", "The bookkeeping and retention duties of the PGR and the VAT Act, enforced by the national tax administration."],
               ["Your practical remedy", "An authority that refuses a compliant EN 16931 invoice is the one in breach of the procurement act, not you."]],
        "es": [["Sin sanción de facturación", "No existe, porque ningún proveedor tiene deber de emitir. La obligación corre al revés, sobre la entidad contratante."],
               ["Qué sí le vincula", "Los deberes de contabilidad y conservación del PGR y de la ley del IVA, exigidos por la administración tributaria nacional."],
               ["Su recurso práctico", "La entidad que rechace una factura EN 16931 conforme es la que incumple la ley de contratación, no usted."]],
        "de": [["Keine E-Rechnungssanktion", "Es gibt keine, weil kein Lieferant eine Ausstellungspflicht hat. Die Pflicht läuft umgekehrt, auf die Vergabestelle."],
               ["Was Sie bindet", "Die Buchführungs- und Aufbewahrungspflichten des PGR und des MWST-Gesetzes, durchgesetzt von der Steuerverwaltung."],
               ["Ihr praktischer Rechtsbehelf", "Eine Stelle, die eine konforme EN-16931-Rechnung ablehnt, verstößt gegen das Vergabegesetz — nicht Sie."]],
        "fr": [["Aucune sanction de facturation", "Il n'y en a pas, aucun fournisseur n'ayant d'obligation d'émettre. L'obligation court en sens inverse, sur le pouvoir adjudicateur."],
               ["Ce qui vous lie", "Les obligations comptables et de conservation du PGR et de la loi de TVA, appliquées par l'administration fiscale nationale."],
               ["Votre recours pratique", "Le pouvoir adjudicateur qui refuse une facture EN 16931 conforme est en infraction, non vous."]]}},
 {"t": {"en": "The EU floor that reaches Liechtenstein, and the one that does not",
        "es": "El suelo europeo que alcanza a Liechtenstein y el que no",
        "de": "Die EU-Untergrenze, die Liechtenstein erreicht, und die, die es nicht tut",
        "fr": "Le plancher européen qui atteint le Liechtenstein, et celui qui ne l'atteint pas"},
  "r": {"en": [["Procurement law does", "Directive 2014/55/EU reached a non-EU state through Annex XVI of the EEA Agreement, which covers public procurement."],
               ["Indirect taxation does not", "It is expressly outside the EEA Agreement, so ViDA and any future EU B2B or digital-reporting rule do not bind Liechtenstein."],
               ["What that predicts", "Liechtenstein will keep tracking EU procurement rules and will not automatically follow EU VAT ones. Plan the two separately."]],
        "es": [["El derecho de contratación sí", "La Directiva 2014/55/UE llegó a un Estado no comunitario por el anexo XVI del Acuerdo EEE, que cubre la contratación pública."],
               ["La fiscalidad indirecta no", "Queda expresamente fuera del Acuerdo EEE, así que ViDA y cualquier futura norma B2B o de reporte de la UE no vinculan."],
               ["Qué predice eso", "Liechtenstein seguirá las reglas europeas de contratación y no automáticamente las de IVA. Planifique ambas por separado."]],
        "de": [["Das Vergaberecht ja", "Die Richtlinie 2014/55/EU erreichte einen Nicht-EU-Staat über Anhang XVI des EWR-Abkommens, der das öffentliche Beschaffungswesen erfasst."],
               ["Die indirekte Besteuerung nicht", "Sie liegt ausdrücklich außerhalb des EWR-Abkommens; ViDA und jede künftige EU-B2B- oder Meldepflicht binden Liechtenstein nicht."],
               ["Was das voraussagt", "Liechtenstein folgt weiter dem EU-Vergaberecht und nicht automatisch dem EU-Mehrwertsteuerrecht. Planen Sie beides getrennt."]],
        "fr": [["Le droit des marchés publics, oui", "La directive 2014/55/UE a atteint un État non membre par l'annexe XVI de l'accord EEE, qui couvre la commande publique."],
               ["La fiscalité indirecte, non", "Elle est expressément hors de l'accord EEE : ViDA et toute future règle B2B ou déclarative de l'UE ne lient pas le Liechtenstein."],
               ["Ce que cela prédit", "Le Liechtenstein suivra les règles européennes de marchés publics, non automatiquement celles de TVA. Planifiez-les séparément."]]}},
],
"Switzerland": [
 {"t": {"en": "What is actually enforced", "es": "Qué se exige realmente",
        "de": "Was tatsächlich durchgesetzt wird", "fr": "Ce qui est réellement sanctionné"},
  "r": {"en": [["No e-invoicing penalty", "The duty is contractual, so non-compliance is a matter between supplier and buyer under the procurement terms, not a tax offence."],
               ["What does bind you", "Retention under company law and the integrity requirements of the business-records ordinance."],
               ["The practical consequence", "A federal unit can decline a paper invoice above the threshold. That is a commercial remedy, not a fine."]],
        "es": [["Sin sanción de facturación", "El deber es contractual: el incumplimiento se dirime entre proveedor y comprador bajo las condiciones de contratación, no es infracción fiscal."],
               ["Qué sí le vincula", "La conservación según el derecho societario y los requisitos de integridad del reglamento sobre libros de comercio."],
               ["La consecuencia práctica", "Una unidad federal puede rechazar una factura en papel por encima del umbral. Es un remedio contractual, no una multa."]],
        "de": [["Keine E-Rechnungssanktion", "Die Pflicht ist vertraglich; Nichterfüllung ist eine Sache zwischen Lieferant und Käufer nach den Beschaffungsbedingungen, kein Steuerdelikt."],
               ["Was Sie bindet", "Die Aufbewahrung nach Gesellschaftsrecht und die Integritätsanforderungen der Geschäftsbücherverordnung."],
               ["Die praktische Folge", "Eine Bundesstelle kann eine Papierrechnung oberhalb der Schwelle zurückweisen. Das ist ein vertraglicher Rechtsbehelf, keine Busse."]],
        "fr": [["Aucune sanction de facturation", "L'obligation est contractuelle : le manquement se règle entre fournisseur et acheteur selon les conditions, ce n'est pas une infraction fiscale."],
               ["Ce qui vous lie", "La conservation selon le droit des sociétés et les exigences d'intégrité de l'ordonnance sur les livres de comptes."],
               ["La conséquence pratique", "Une unité fédérale peut refuser une facture papier au-delà du seuil. C'est un remède contractuel, non une amende."]]}},
 {"t": {"en": "Cantonal practice is a separate question", "es": "La práctica cantonal es otra cuestión",
        "de": "Die kantonale Praxis ist eine eigene Frage", "fr": "La pratique cantonale est une autre question"},
  "r": {"en": [["The federal duty stops at the Confederation", "Cantons, communes and the ETH domain are outside it entirely."],
               ["Zurich, from 2027", "The cantonal government declared digital delivery its standard, inviting suppliers rather than obliging them, with no threshold and no format."],
               ["What to do about it", "Check the counterparty, not the country. Below federal level there is no single Swiss answer, and only Zurich has been examined."]],
        "es": [["El deber federal se detiene en la Confederación", "Cantones, municipios y el ámbito de las EPF quedan enteramente fuera."],
               ["Zúrich, desde 2027", "El gobierno cantonal declaró la entrega digital su estándar, invitando a los proveedores en vez de obligarlos, sin umbral ni formato."],
               ["Qué hacer al respecto", "Compruebe la contraparte, no el país. Por debajo del nivel federal no hay una respuesta suiza única, y solo se examinó Zúrich."]],
        "de": [["Die Bundespflicht endet beim Bund", "Kantone, Gemeinden und der ETH-Bereich liegen vollständig ausserhalb."],
               ["Zürich, ab 2027", "Die Kantonsregierung erklärte die digitale Zustellung zum Standard, lädt Lieferanten ein statt sie zu verpflichten, ohne Schwelle und ohne Format."],
               ["Was daraus folgt", "Prüfen Sie die Gegenpartei, nicht das Land. Unterhalb des Bundes gibt es keine einheitliche Schweizer Antwort; untersucht wurde nur Zürich."]],
        "fr": [["L'obligation fédérale s'arrête à la Confédération", "Cantons, communes et domaine des EPF en sont entièrement exclus."],
               ["Zurich, dès 2027", "Le gouvernement cantonal a fait de la remise numérique son standard, invitant les fournisseurs sans les obliger, sans seuil ni format."],
               ["Ce qu'il faut en faire", "Vérifiez la contrepartie, non le pays. Sous le niveau fédéral il n'y a pas de réponse suisse unique, et seul Zurich a été examiné."]]}},
],
"Hong Kong": [
 {"t": {"en": "What is actually enforced", "es": "Qué se exige realmente",
        "de": "Was tatsächlich durchgesetzt wird", "fr": "Ce qui est réellement sanctionné"},
  "r": {"en": [["The duty", "Inland Revenue Ordinance s.51C: sufficient records of income and expenditure, in English or Chinese, to let assessable profits be readily ascertained."],
               ["The penalty", "A fine of up to HK$100,000 for failure without reasonable excuse. This is the only monetary sanction in this area."],
               ["No invoicing offence exists", "There is nothing to fine, because nothing prescribes an invoice. The enforcement risk here is records, not documents."]],
        "es": [["El deber", "Art. 51C: registros suficientes de ingresos y gastos, en inglés o chino, que permitan determinar con facilidad los beneficios imponibles."],
               ["La sanción", "Multa de hasta 100.000 dólares de Hong Kong por incumplimiento sin excusa razonable. Es la única sanción pecuniaria del ámbito."],
               ["No existe infracción de facturación", "No hay nada que multar, porque nada prescribe una factura. El riesgo aquí son los libros, no los documentos."]],
        "de": [["Die Pflicht", "Abschnitt 51C: ausreichende Aufzeichnungen über Einnahmen und Ausgaben, auf Englisch oder Chinesisch, zur leichten Gewinnermittlung."],
               ["Die Sanktion", "Bis zu 100'000 Hongkong-Dollar bei Verstoss ohne triftigen Grund. Es ist die einzige Geldsanktion in diesem Bereich."],
               ["Ein Rechnungsdelikt gibt es nicht", "Es gibt nichts zu büssen, weil nichts eine Rechnung vorschreibt. Das Risiko liegt bei den Aufzeichnungen, nicht den Dokumenten."]],
        "fr": [["L'obligation", "Art. 51C : des registres suffisants des recettes et dépenses, en anglais ou en chinois, permettant d'établir aisément les bénéfices."],
               ["La sanction", "Une amende pouvant atteindre 100 000 dollars de Hong Kong sans excuse raisonnable. C'est la seule sanction pécuniaire du domaine."],
               ["Aucune infraction de facturation", "Il n'y a rien à sanctionner, puisque rien ne prescrit de facture. Le risque porte sur les livres, non sur les documents."]]}},
],
}

# ---- refuse to emit a shape the framework would reject ---------------
problems = []
for c in SEC2:
    n2 = len(SEC2[c])
    if not (SEC2_MIN <= n2 <= SEC2_MAX):
        problems.append(f"{c}: section 02 would have {n2} cards, framework wants {SEC2_MIN}-{SEC2_MAX}")
    if n2 != len(SPINE):
        problems.append(f"{c}: section 02 must be exactly the {len(SPINE)}-card spine, got {n2}")
# section 05 keeps its trailing "what we could not confirm" card, which this
# migration does not touch -- so the emitted count is replacements + 1.
# How many LEADING section-05 cards each country replaces. One each: the
# retention card for Liechtenstein and Switzerland (it moves to 02), and
# Hong Kong's enforcement card (its archiving rows move to 02). Everything
# after that survives, shifted down to make room.
REPLACE5 = {"Liechtenstein": 1, "Switzerland": 1, "Hong Kong": 1}
KEEP5 = {"Liechtenstein": 1, "Switzerland": 1, "Hong Kong": 2}
for c, cards in SEC5.items():
    total = len(cards) + KEEP5[c]
    if not (SEC5_MIN <= total <= SEC5_MAX):
        problems.append(f"{c}: section 05 would end at {total} cards, framework wants {SEC5_MIN}-{SEC5_MAX}")
for c in SEC2:
    for i, card in enumerate(SEC2[c]):
        for lang in LANGS:
            if lang not in card[0]:
                problems.append(f"{c} section 02 card {i}: missing {lang}")
            elif len(card[0][lang]) != len(card[0]["en"]):
                problems.append(f"{c} section 02 card {i}/{lang}: {len(card[0][lang])} rows, English has {len(card[0]['en'])}")
if problems:
    sys.stderr.write("REFUSING TO EMIT:\n  " + "\n  ".join(problems) + "\n")
    sys.exit(1)

# ---- emit -------------------------------------------------------------
out = []; w = out.append
w("-- Bundle 3, first pass: Liechtenstein, Switzerland and Hong Kong onto")
w("-- the section-02 spine and up to the section-05 floor. GENERATED by")
w("-- gen_cohort_spine.py -- edit the generator, which refuses to emit a")
w("-- shape DEEP-DIVE-FRAMEWORK.md would reject.")
w("--")
w("-- Cards are DELETED and rebuilt rather than updated: the row")
w("-- distribution changes, not just the titles, so there is no one-to-one")
w("-- mapping to UPDATE. Translations go first -- deep_dive_card_translations")
w("-- has no cascade, and orphaned translation rows would be invisible.")
w("--")
w("-- Section 05's trailing \"what we could not confirm\" card is deliberately")
w("-- NOT touched. It is the best card on these pages and it is the one")
w("-- thing the spine work must not disturb.")
w("")
for c in SEC2:
    w(f"-- ================= {c} =================")
    w("-- old section-02 cards out")
    w(f"DELETE FROM deep_dive_card_translations WHERE card_id IN (SELECT d.id FROM deep_dive_cards d"
      f" JOIN countries co ON co.id = d.country_id WHERE co.name_en = {lit(c)} AND d.section = 'file_format');")
    w(f"DELETE FROM deep_dive_cards WHERE section = 'file_format'"
      f" AND country_id = (SELECT id FROM countries WHERE name_en = {lit(c)});")
    for i, card in enumerate(SEC2[c]):
        rows = card[0]
        w(f"INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'file_format', {i}"
          f" FROM countries WHERE name_en = {lit(c)};")
        for lang in LANGS:
            w("INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json)")
            w(f"SELECT d.id, '{lang}', {lit(SPINE[i][lang])}, {lit(json.dumps(rows[lang], ensure_ascii=False))}"
              f" FROM deep_dive_cards d WHERE d.country_id = (SELECT id FROM countries WHERE name_en = {lit(c)})"
              f" AND d.section = 'file_format' AND d.sort_order = {i};")
    w("")
    w("-- section-05 replacements: the retention card has moved to 02, so the")
    w("-- cards that replace it are content this page already carried elsewhere.")
    n_rep, n_new = REPLACE5[c], len(SEC5[c])
    w(f"-- replace the leading {n_rep}, keep {KEEP5[c]}, shift the survivors down by {n_new - n_rep}")
    w(f"DELETE FROM deep_dive_card_translations WHERE card_id IN (SELECT d.id FROM deep_dive_cards d"
      f" JOIN countries co ON co.id = d.country_id WHERE co.name_en = {lit(c)} AND d.section = 'penalties_related'"
      f" AND d.sort_order < {n_rep});")
    w(f"DELETE FROM deep_dive_cards WHERE section = 'penalties_related'"
      f" AND country_id = (SELECT id FROM countries WHERE name_en = {lit(c)}) AND sort_order < {n_rep};")
    if n_new != n_rep:
        # Park the survivors out of range first. A straight += would collide
        # with a row it has not moved yet if (country, section, sort_order)
        # is ever made unique, and would be a silent no-op if it were.
        w(f"UPDATE deep_dive_cards SET sort_order = sort_order + 100 WHERE section = 'penalties_related'"
          f" AND country_id = (SELECT id FROM countries WHERE name_en = {lit(c)});")
    for i, card in enumerate(SEC5[c]):
        w(f"INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'penalties_related', {i}"
          f" FROM countries WHERE name_en = {lit(c)};")
        for lang in LANGS:
            w("INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json)")
            w(f"SELECT d.id, '{lang}', {lit(card['t'][lang])}, {lit(json.dumps(card['r'][lang], ensure_ascii=False))}"
              f" FROM deep_dive_cards d WHERE d.country_id = (SELECT id FROM countries WHERE name_en = {lit(c)})"
              f" AND d.section = 'penalties_related' AND d.sort_order = {i};")
    if n_new != n_rep:
        w(f"UPDATE deep_dive_cards SET sort_order = sort_order - 100 + {n_new - n_rep}"
          f" WHERE section = 'penalties_related'"
          f" AND country_id = (SELECT id FROM countries WHERE name_en = {lit(c)}) AND sort_order >= 100;")
    w("")

w("-- ---- what this migration claims it did ----")
w("-- DELETE-and-rebuild can half-succeed in a way an INSERT cannot, so")
w("-- assert the resulting SHAPE, not the statements that produced it.")
for c in SEC2:
    w(f"-- ASSERT: SELECT count(*) FROM deep_dive_cards WHERE section = 'file_format'"
      f" AND country_id = (SELECT id FROM countries WHERE name_en = {lit(c)}) = {len(SEC2[c])}")
    w(f"-- ASSERT: SELECT count(*) FROM deep_dive_cards WHERE section = 'penalties_related'"
      f" AND country_id = (SELECT id FROM countries WHERE name_en = {lit(c)}) = {len(SEC5[c]) + KEEP5[c]}")
    for lang in LANGS:
        w(f"-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id"
          f" WHERE d.country_id = (SELECT id FROM countries WHERE name_en = {lit(c)}) AND d.section = 'file_format'"
          f" AND t.lang = '{lang}' = {len(SEC2[c])}")
w("-- The spine is the point: assert the titles themselves, in English, in order.")
for c in SEC2:
    for i, s in enumerate(SPINE):
        w(f"-- ASSERT: SELECT t.title FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id"
          f" WHERE d.country_id = (SELECT id FROM countries WHERE name_en = {lit(c)}) AND d.section = 'file_format'"
          f" AND d.sort_order = {i} AND t.lang = 'en' = {lit(s['en'])}")
w("-- No card may be left without its rows -- the renderRelatedCard defect.")
w("-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id"
  " JOIN countries c ON c.id = d.country_id WHERE c.name_en IN ('Liechtenstein','Switzerland','Hong Kong')"
  " AND (t.rows_json IS NULL OR json_array_length(t.rows_json) = 0) AND ifnull(t.body,'') = '' = 0")
w("-- And no translation may be orphaned by the delete-and-rebuild:")
w("-- ASSERT ALWAYS: SELECT count(*) FROM deep_dive_card_translations t"
  " WHERE NOT EXISTS (SELECT 1 FROM deep_dive_cards d WHERE d.id = t.card_id) = 0")
print("\n".join(out))
