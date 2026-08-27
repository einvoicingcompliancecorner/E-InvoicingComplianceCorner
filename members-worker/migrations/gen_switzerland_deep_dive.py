#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_switzerland_deep_dive.py — emits 687_switzerland_deep_dive.sql.

Edit this file, not the SQL. Run:
    python3 gen_switzerland_deep_dive.py > 687_switzerland_deep_dive.sql

TWO THINGS THIS PAGE EXISTS TO SAY.

1. The federal obligation is a duty to invoice WITHOUT PAPER, not a duty
   to invoice in a STRUCTURED format. A PDF sent by e-mail satisfies it,
   confirmed by the Federal Finance Administration in 2018 and still true
   in 2026. Read "B2G mandatory since 2016" without that and you provision
   an EN 16931 pipeline you do not need.

2. Switzerland and Liechtenstein share a VAT statute in substance and
   have opposite-polarity e-invoicing duties from different sources.
   Liechtenstein: EEA-derived, on the authority to receive. Switzerland:
   contractual, on the supplier to issue, from procurement terms, outside
   the VAT Act entirely. Reasoning from either to the other inverts every
   dimension.

The stat strip carries the rate, the contract-value threshold and the
registration threshold. Nothing in it restates a headline tile.
"""
import json
LANGS=("en","es","de","fr")
def esc(s): return s.replace("'","''")
def lit(s): return "NULL" if s is None else "'"+esc(s)+"'"
CID="(SELECT id FROM countries WHERE code = 'CH')"

PAGE={
"en":dict(
compliance_model="A narrow procurement duty and nothing else. Suppliers to the central federal administration must invoice electronically where the contract value exceeds CHF 5,000 excluding VAT — a duty satisfied by a PDF sent by e-mail. No B2B or B2C mandate, no reporting to the tax administration, and no Peppol authority.",
mandate_summary="Switzerland requires suppliers to the central federal administration to invoice electronically above CHF 5,000 excluding VAT, in force since 1 January 2016. The obligation is contractual rather than statutory, is satisfied by a PDF sent by e-mail, and reaches neither cantons nor communes. There is no B2B or B2C mandate and no transaction reporting. Electronic VAT filing has been compulsory since January 2025, which is a channel and not a regime.",
mandate_summary_icon="🇨🇭",
timeline_intro="A short timeline for a country that legislated once and then largely left the matter to the market. The Federal Council decided in October 2014, the obligation took effect in January 2016, and the most consequential development since was the Confederation confirming in 2018 that a PDF by e-mail counts. The live frontier is cantonal rather than federal.",
file_format_intro="No format is prescribed. The Confederation offers two routes: structured data through a service provider, or a PDF sent by e-mail — and since 30 June 2023 a PDF must go by e-mail rather than through a provider. Switzerland has no Peppol Authority and no OpenPeppol country profile, and the Confederation's own pages mention neither Peppol nor EN 16931. A Swiss business may of course use a Peppol-certified provider commercially; that is a market fact, not a Swiss regime.",
scope_intro="The central federal administration, and nothing below it. Federal offices, departments, courts and the Federal Chancellery are in scope, and the Federal Finance Administration publishes the list that decides any given counterparty. Cantons, communes and the ETH domain are outside. The Canton of Zurich declared digital delivery its standard from 2027, but suppliers are invited rather than obliged and no threshold or format is set.",
steps_intro="There is very little to do here, and the useful work is mostly in not over-doing it. Establish whether your counterparty is in scope at all, then choose the lightest channel that satisfies the duty, then keep records for the period Swiss company law requires.",
penalties_intro="No e-invoicing penalty regime exists, because the obligation is contractual rather than statutory — non-compliance is a matter between supplier and buyer under the procurement terms. What is legally enforced is bookkeeping: retention periods under company law, and the integrity requirements of the business-records ordinance.",
footer_disclaimer="This page reflects the Federal Council decision of 8 October 2014 as executed through clause 9.4 of the Confederation's procurement standard terms, the Federal Finance Administration's published guidance, the Federal Tax Administration's guidance on electronic signatures and on online VAT filing, and the federal SME portal's statement of the Code of Obligations retention rules. Article numbers are cited from that official guidance rather than from the enacted text: fedlex.admin.ch is a JavaScript-only application and Swiss statute text could not be read directly.",
),
"es":dict(
compliance_model="Un deber de contratación pública estrecho y nada más. Los proveedores de la administración federal central deben facturar electrónicamente cuando el valor del contrato supere los 5.000 francos sin IVA, deber que se satisface con un PDF enviado por correo. Sin obligación B2B ni B2C, sin declaración a la administración tributaria y sin autoridad Peppol.",
mandate_summary="Suiza exige a los proveedores de la administración federal central facturar electrónicamente por encima de 5.000 francos sin IVA, en vigor desde el 1 de enero de 2016. La obligación es contractual y no legal, se satisface con un PDF por correo y no alcanza a cantones ni municipios. No hay obligación B2B ni B2C ni declaración de operaciones. La declaración electrónica del IVA es obligatoria desde enero de 2025, lo que es un canal y no un régimen.",
mandate_summary_icon="🇨🇭",
timeline_intro="Una cronología breve para un país que legisló una vez y dejó el resto al mercado. El Consejo Federal decidió en octubre de 2014, la obligación entró en vigor en enero de 2016 y lo más determinante desde entonces fue que la Confederación confirmara en 2018 que un PDF por correo vale. La frontera viva es cantonal, no federal.",
file_format_intro="No se prescribe formato. La Confederación ofrece dos vías: datos estructurados a través de un proveedor de servicios, o un PDF por correo electrónico; y desde el 30 de junio de 2023 el PDF debe ir por correo y no por proveedor. Suiza no tiene autoridad Peppol ni perfil de país en OpenPeppol, y las páginas de la Confederación no mencionan ni Peppol ni EN 16931. Una empresa suiza puede usar comercialmente un proveedor certificado Peppol; eso es un hecho de mercado, no un régimen suizo.",
scope_intro="La administración federal central, y nada por debajo. Oficinas, departamentos, tribunales federales y la Cancillería están dentro, y la Administración Federal de Finanzas publica la lista que decide cada contraparte. Cantones, municipios y el ámbito de las EPF quedan fuera. El cantón de Zúrich declaró la entrega digital su estándar desde 2027, pero invita a los proveedores en lugar de obligarlos y no fija umbral ni formato.",
steps_intro="Hay muy poco que hacer aquí, y el trabajo útil consiste sobre todo en no excederse. Determine si su contraparte está siquiera en el ámbito, elija después el canal más ligero que satisfaga el deber y conserve los registros durante el plazo que exige el derecho societario suizo.",
penalties_intro="No existe régimen sancionador de facturación electrónica, porque la obligación es contractual y no legal: el incumplimiento es un asunto entre proveedor y comprador bajo las condiciones de contratación. Lo que sí se exige legalmente es la contabilidad: los plazos de conservación del derecho societario y los requisitos de integridad del reglamento sobre libros de comercio.",
footer_disclaimer="Esta página refleja la decisión del Consejo Federal de 8 de octubre de 2014 ejecutada mediante la cláusula 9.4 de las condiciones generales de contratación de la Confederación, la orientación publicada por la Administración Federal de Finanzas, la de la Administración Federal de Contribuciones sobre firmas electrónicas y declaración en línea del IVA, y la exposición del portal federal para pymes sobre los plazos del Código de Obligaciones. Los números de artículo se citan desde esa orientación oficial y no desde el texto promulgado: fedlex.admin.ch es una aplicación solo con JavaScript y el texto legal suizo no pudo leerse directamente.",
),
"de":dict(
compliance_model="Eine enge Beschaffungspflicht und sonst nichts. Lieferanten der zentralen Bundesverwaltung müssen elektronisch fakturieren, wenn der Vertragswert 5'000 Franken exklusive MWST übersteigt — eine Pflicht, die ein per E-Mail gesandtes PDF erfüllt. Keine B2B- oder B2C-Pflicht, keine Meldung an die Steuerverwaltung, keine Peppol-Behörde.",
mandate_summary="Die Schweiz verlangt von Lieferanten der zentralen Bundesverwaltung die elektronische Rechnungsstellung oberhalb von 5'000 Franken exklusive MWST, in Kraft seit dem 1. Januar 2016. Die Pflicht ist vertraglich und nicht gesetzlich, wird durch ein per E-Mail gesandtes PDF erfüllt und erreicht weder Kantone noch Gemeinden. Es gibt keine B2B- oder B2C-Pflicht und keine Transaktionsmeldung. Die elektronische MWST-Abrechnung ist seit Januar 2025 zwingend, was ein Kanal ist und kein Regime.",
mandate_summary_icon="🇨🇭",
timeline_intro="Eine kurze Zeitleiste für ein Land, das einmal geregelt und das Übrige weitgehend dem Markt überlassen hat. Der Bundesrat entschied im Oktober 2014, die Pflicht trat im Januar 2016 in Kraft, und das Folgenreichste seither war die Bestätigung des Bundes im Jahr 2018, dass ein PDF per E-Mail genügt. Die lebendige Grenze ist kantonal, nicht föderal.",
file_format_intro="Ein Format ist nicht vorgeschrieben. Der Bund bietet zwei Wege: strukturierte Daten über einen Service-Provider oder ein PDF per E-Mail — und seit dem 30. Juni 2023 muss ein PDF per E-Mail statt über einen Provider kommen. Die Schweiz hat keine Peppol-Behörde und kein OpenPeppol-Länderprofil, und die Seiten des Bundes erwähnen weder Peppol noch EN 16931. Ein Schweizer Unternehmen kann kommerziell einen Peppol-zertifizierten Anbieter nutzen; das ist eine Marktfrage, kein Schweizer Regime.",
scope_intro="Die zentrale Bundesverwaltung und nichts darunter. Bundesämter, Departemente, Bundesgerichte und die Bundeskanzlei sind erfasst, und die Eidgenössische Finanzverwaltung führt die Liste, die über jede Gegenpartei entscheidet. Kantone, Gemeinden und der ETH-Bereich liegen ausserhalb. Der Kanton Zürich erklärte die digitale Zustellung ab 2027 zum Standard, ruft Lieferanten aber auf, statt sie zu verpflichten, und setzt weder Schwelle noch Format.",
steps_intro="Hier ist sehr wenig zu tun, und die nützliche Arbeit besteht vor allem darin, es nicht zu übertreiben. Klären Sie, ob Ihre Gegenpartei überhaupt erfasst ist, wählen Sie dann den leichtesten Kanal, der die Pflicht erfüllt, und bewahren Sie die Unterlagen so lange auf, wie das Schweizer Gesellschaftsrecht verlangt.",
penalties_intro="Ein Sanktionsregime für die elektronische Rechnungsstellung gibt es nicht, weil die Pflicht vertraglich und nicht gesetzlich ist -- Nichterfüllung ist eine Sache zwischen Lieferant und Käufer nach den Beschaffungsbedingungen. Rechtlich durchgesetzt wird die Buchführung: Aufbewahrungsfristen des Gesellschaftsrechts und die Integritätsanforderungen der Geschäftsbücherverordnung.",
footer_disclaimer="Diese Seite gibt den Bundesratsbeschluss vom 8. Oktober 2014 wieder, umgesetzt über Ziffer 9.4 der AGB des Bundes, die veröffentlichten Hinweise der Eidgenössischen Finanzverwaltung, jene der Eidgenössischen Steuerverwaltung zu elektronischen Signaturen und zur Online-MWST-Abrechnung sowie die Darstellung der Aufbewahrungsfristen des Obligationenrechts auf dem KMU-Portal des Bundes. Artikelnummern sind aus diesen amtlichen Hinweisen zitiert und nicht aus dem verkündeten Text: fedlex.admin.ch ist eine reine JavaScript-Anwendung, und Schweizer Gesetzestext war nicht direkt lesbar.",
),
"fr":dict(
compliance_model="Une obligation de commande publique étroite, et rien d'autre. Les fournisseurs de l'administration fédérale centrale doivent facturer par voie électronique lorsque la valeur du contrat dépasse 5 000 francs hors TVA — obligation qu'un PDF envoyé par courriel satisfait. Aucune obligation B2B ou B2C, aucune déclaration à l'administration fiscale, aucune autorité Peppol.",
mandate_summary="La Suisse impose aux fournisseurs de l'administration fédérale centrale de facturer par voie électronique au-delà de 5 000 francs hors TVA, en vigueur depuis le 1er janvier 2016. L'obligation est contractuelle et non légale, se satisfait d'un PDF envoyé par courriel et n'atteint ni les cantons ni les communes. Il n'existe aucune obligation B2B ou B2C ni déclaration de transactions. La déclaration électronique de TVA est obligatoire depuis janvier 2025, ce qui est un canal et non un régime.",
mandate_summary_icon="🇨🇭",
timeline_intro="Une chronologie brève pour un pays qui a légiféré une fois et laissé le reste au marché. Le Conseil fédéral a décidé en octobre 2014, l'obligation est entrée en vigueur en janvier 2016, et le fait le plus lourd depuis lors a été la confirmation par la Confédération, en 2018, qu'un PDF par courriel suffit. La frontière vivante est cantonale, non fédérale.",
file_format_intro="Aucun format n'est prescrit. La Confédération propose deux voies : des données structurées via un prestataire, ou un PDF envoyé par courriel — et depuis le 30 juin 2023 le PDF doit passer par courriel et non par un prestataire. La Suisse n'a pas d'autorité Peppol ni de profil pays OpenPeppol, et les pages de la Confédération ne mentionnent ni Peppol ni l'EN 16931. Une entreprise suisse peut recourir commercialement à un prestataire certifié Peppol ; c'est un fait de marché, non un régime suisse.",
scope_intro="L'administration fédérale centrale, et rien en dessous. Offices, départements, tribunaux fédéraux et Chancellerie fédérale sont visés, et l'Administration fédérale des finances publie la liste qui tranche pour chaque contrepartie. Cantons, communes et domaine des EPF en sont exclus. Le canton de Zurich a fait de la remise numérique son standard dès 2027, mais il invite les fournisseurs au lieu de les obliger et ne fixe ni seuil ni format.",
steps_intro="Il y a très peu à faire ici, et le travail utile consiste surtout à ne pas en faire trop. Établissez si votre contrepartie est seulement dans le champ, choisissez ensuite le canal le plus léger qui satisfait l'obligation, puis conservez les documents pendant la durée qu'exige le droit des sociétés suisse.",
penalties_intro="Il n'existe pas de régime de sanctions pour la facturation électronique, l'obligation étant contractuelle et non légale : le manquement se règle entre fournisseur et acheteur selon les conditions de marché. Ce qui est juridiquement exigé, c'est la comptabilité : les durées de conservation du droit des sociétés et les exigences d'intégrité de l'ordonnance sur les livres de comptes.",
footer_disclaimer="Cette page reflète la décision du Conseil fédéral du 8 octobre 2014 exécutée par la clause 9.4 des conditions générales de la Confédération, les indications publiées par l'Administration fédérale des finances, celles de l'Administration fédérale des contributions sur les signatures électroniques et la déclaration en ligne de TVA, ainsi que l'exposé du portail PME de la Confédération sur les durées du Code des obligations. Les numéros d'articles sont cités depuis ces indications officielles et non depuis le texte promulgué : fedlex.admin.ch est une application uniquement en JavaScript et le texte légal suisse n'a pas pu être lu directement.",
),
}

STATS=[
 {"en":("8.1%","Standard VAT rate, unchanged since January 2024"),
  "es":("8,1 %","Tipo general del IVA, sin cambios desde enero de 2024"),
  "de":("8,1 %","Regulärer MWST-Satz, unverändert seit Januar 2024"),
  "fr":("8,1 %","Taux normal de TVA, inchangé depuis janvier 2024")},
 {"en":("CHF 5,000","Contract value above which a federal supplier must invoice electronically — excluding VAT, a qualifier only the procurement terms carry"),
  "es":("5.000 CHF","Valor de contrato por encima del cual un proveedor federal debe facturar electrónicamente; sin IVA, matiz que solo recogen las condiciones de contratación"),
  "de":("CHF 5'000","Vertragswert, ab dem ein Bundeslieferant elektronisch fakturieren muss — exklusive MWST, ein Zusatz, den nur die AGB nennen"),
  "fr":("5 000 CHF","Valeur de contrat au-delà de laquelle un fournisseur fédéral doit facturer par voie électronique — hors TVA, précision propre aux conditions générales")},
 {"en":("CHF 100,000","VAT registration threshold, worldwide turnover measured over twelve months"),
  "es":("100.000 CHF","Umbral de registro del IVA, cifra de negocio mundial medida en doce meses"),
  "de":("CHF 100'000","Registrierungsschwelle, weltweiter Umsatz über zwölf Monate gemessen"),
  "fr":("100 000 CHF","Seuil d'assujettissement à la TVA, chiffre d'affaires mondial mesuré sur douze mois")},
]

CARDS=[
 dict(section="scope_transmission",sort=0,t={
  "en":("⚠️ A duty to invoice without paper, not in a structured format",[
   ["What the rule says","A supplier to the central federal administration must submit an electronic invoice where the contract value exceeds CHF 5,000 excluding VAT."],
   ["What satisfies it","A PDF sent by e-mail. The Federal Finance Administration confirmed this publicly in June 2018, reporting the e-invoice share had risen fourfold to around 60 per cent, and EY's tracker still recorded it in June 2026."],
   ["Why that matters","\"B2G mandatory since 2016\" reads exactly like Italy or France. It is not. Provisioning an EN 16931 or Peppol pipeline against this rule is over-building; the duty is only that the invoice not be paper."],
   ["One detail that has moved","Since 30 June 2023 a PDF must go by e-mail rather than through a service provider. The provider route is for structured data."],
  ]),
  "es":("⚠️ Un deber de facturar sin papel, no en formato estructurado",[
   ["Qué dice la norma","Un proveedor de la administración federal central debe presentar una factura electrónica cuando el valor del contrato supere los 5.000 francos sin IVA."],
   ["Qué lo satisface","Un PDF enviado por correo electrónico. La Administración Federal de Finanzas lo confirmó públicamente en junio de 2018, al informar de que la cuota de factura electrónica se había cuadruplicado hasta cerca del 60 %, y el rastreador de EY seguía recogiéndolo en junio de 2026."],
   ["Por qué importa","«B2G obligatorio desde 2016» se lee igual que Italia o Francia. No lo es. Dimensionar una cadena EN 16931 o Peppol contra esta norma es excederse; el deber es solo que la factura no sea de papel."],
   ["Un detalle que cambió","Desde el 30 de junio de 2023 el PDF debe ir por correo y no a través de un proveedor de servicios. La vía del proveedor es para datos estructurados."],
  ]),
  "de":("⚠️ Eine Pflicht, ohne Papier zu fakturieren, nicht strukturiert",[
   ["Was die Regel sagt","Ein Lieferant der zentralen Bundesverwaltung muss eine elektronische Rechnung einreichen, wenn der Vertragswert 5'000 Franken exklusive MWST übersteigt."],
   ["Was sie erfüllt","Ein per E-Mail gesandtes PDF. Die Eidgenössische Finanzverwaltung bestätigte dies im Juni 2018 öffentlich, bei der Meldung, der E-Rechnungs-Anteil habe sich auf rund 60 Prozent vervierfacht; EYs Tracker hielt es im Juni 2026 weiterhin fest."],
   ["Warum das zählt","«B2G verpflichtend seit 2016» liest sich genau wie Italien oder Frankreich. Das ist es nicht. Eine EN-16931- oder Peppol-Strecke gegen diese Regel zu planen heisst überbauen; die Pflicht lautet nur, dass die Rechnung nicht auf Papier ist."],
   ["Ein Detail, das sich bewegt hat","Seit dem 30. Juni 2023 muss ein PDF per E-Mail statt über einen Service-Provider kommen. Der Provider-Weg ist für strukturierte Daten."],
  ]),
  "fr":("⚠️ Une obligation de facturer sans papier, non en format structuré",[
   ["Ce que dit la règle","Un fournisseur de l'administration fédérale centrale doit remettre une facture électronique lorsque la valeur du contrat dépasse 5 000 francs hors TVA."],
   ["Ce qui la satisfait","Un PDF envoyé par courriel. L'Administration fédérale des finances l'a confirmé publiquement en juin 2018, en annonçant que la part de factures électroniques avait quadruplé pour atteindre environ 60 %, et le tracker d'EY le relevait encore en juin 2026."],
   ["Pourquoi cela compte","« B2G obligatoire depuis 2016 » se lit exactement comme l'Italie ou la France. Ce n'en est pas. Dimensionner une chaîne EN 16931 ou Peppol contre cette règle, c'est surdimensionner ; l'obligation est seulement que la facture ne soit pas du papier."],
   ["Un détail qui a bougé","Depuis le 30 juin 2023, un PDF doit passer par courriel et non par un prestataire. La voie du prestataire est réservée aux données structurées."],
  ]),
 }),
 dict(section="scope_transmission",sort=1,t={
  "en":("Switzerland and Liechtenstein run in opposite directions",[
   ["They share a VAT statute","Swiss VAT law governs in Liechtenstein under the treaty of 28 October 1994, through Liechtenstein's own act and its own administration."],
   ["Their e-invoicing duties are opposites","Liechtenstein's is EEA-derived and falls on the contracting AUTHORITY to receive, from 2018. Switzerland's is contractual and falls on the SUPPLIER to issue, from 2016."],
   ["And they come from different bodies of law","Liechtenstein's sits in procurement law transposing an EU directive. Switzerland's sits outside the VAT Act entirely — it is a procurement and finance rule, which is why nothing in Swiss tax law mentions it."],
   ["What follows","Reasoning from either country to the other inverts every dimension: who is bound, in which direction, from what source, and from when. They are the clearest illustration on this site that a shared tax law does not imply a shared e-invoicing position."],
  ]),
  "es":("Suiza y Liechtenstein van en sentidos opuestos",[
   ["Comparten una ley del IVA","La ley suiza del IVA rige en Liechtenstein por el tratado de 28 de octubre de 1994, a través de la ley propia de Liechtenstein y de su propia administración."],
   ["Sus deberes de facturación son opuestos","El de Liechtenstein deriva del EEE y recae en el ORGANISMO contratante que recibe, desde 2018. El de Suiza es contractual y recae en el PROVEEDOR que emite, desde 2016."],
   ["Y proceden de cuerpos jurídicos distintos","El de Liechtenstein está en el derecho de contratación que transpone una directiva de la UE. El de Suiza queda del todo fuera de la Ley del IVA: es una norma de contratación y finanzas, y por eso nada en el derecho tributario suizo lo menciona."],
   ["Qué se sigue","Razonar de un país al otro invierte todas las dimensiones: quién queda obligado, en qué sentido, desde qué fuente y desde cuándo. Son la ilustración más clara de este sitio de que compartir una ley tributaria no implica compartir una posición de facturación electrónica."],
  ]),
  "de":("Die Schweiz und Liechtenstein laufen in entgegengesetzte Richtungen",[
   ["Sie teilen ein Mehrwertsteuergesetz","Schweizerisches MWST-Recht gilt in Liechtenstein kraft des Staatsvertrags vom 28. Oktober 1994, über Liechtensteins eigenes Gesetz und seine eigene Verwaltung."],
   ["Ihre E-Rechnungs-Pflichten sind Gegenteile","Liechtensteins ist EWR-abgeleitet und trifft den AUFTRAGGEBER beim Empfangen, seit 2018. Die schweizerische ist vertraglich und trifft den LIEFERANTEN beim Ausstellen, seit 2016."],
   ["Und sie stammen aus verschiedenen Rechtsgebieten","Liechtensteins liegt im Beschaffungsrecht, das eine EU-Richtlinie umsetzt. Die schweizerische liegt vollständig ausserhalb des MWSTG -- sie ist eine Beschaffungs- und Finanzregel, weshalb das schweizerische Steuerrecht sie nicht erwähnt."],
   ["Was folgt","Von einem Land auf das andere zu schliessen kehrt jede Dimension um: wer gebunden ist, in welche Richtung, aus welcher Quelle und seit wann. Sie sind auf dieser Seite die klarste Illustration dafür, dass ein geteiltes Steuerrecht keine geteilte E-Rechnungs-Position bedeutet."],
  ]),
  "fr":("La Suisse et le Liechtenstein vont en sens inverse",[
   ["Ils partagent une loi TVA","Le droit suisse de la TVA s'applique au Liechtenstein par le traité du 28 octobre 1994, à travers la loi propre au Liechtenstein et sa propre administration."],
   ["Leurs obligations de facturation sont opposées","Celle du Liechtenstein est issue de l'EEE et pèse sur le POUVOIR ADJUDICATEUR qui reçoit, depuis 2018. Celle de la Suisse est contractuelle et pèse sur le FOURNISSEUR qui émet, depuis 2016."],
   ["Et elles viennent de corps de règles différents","Celle du Liechtenstein relève du droit des marchés publics transposant une directive de l'UE. Celle de la Suisse est entièrement hors de la loi TVA : c'est une règle de commande publique et de finances, et c'est pourquoi le droit fiscal suisse n'en dit rien."],
   ["Ce qui s'ensuit","Raisonner d'un pays à l'autre inverse toutes les dimensions : qui est tenu, dans quel sens, depuis quelle source et depuis quand. C'est l'illustration la plus nette, sur ce site, qu'une loi fiscale partagée n'implique pas une position partagée sur la facturation électronique."],
  ]),
 }),
 dict(section="file_format",sort=0,t={
  "en":("Where the obligation actually lives",[
   ["There is no ordinance","No instrument in the Systematic Compilation imposes it. Every official page attributes it to a Federal Council decision of 8 October 2014."],
   ["The binding text","Clause 9.4 of the Confederation's procurement standard terms: the seller is obliged to submit an electronic invoice if the contract value exceeds CHF 5,000, and the buyer determines the delivery options."],
   ["Which is why the threshold reads oddly","Only the standard terms say \"excluding VAT\". The official prose pages give the figure without the qualifier."],
   ["And why enforcement is contractual","Non-compliance is a matter between supplier and buyer under those terms, not a tax offence. There is no penalty schedule to cite."],
  ]),
  "es":("Dónde reside realmente la obligación",[
   ["No hay reglamento","Ningún instrumento de la Compilación Sistemática la impone. Toda página oficial la atribuye a una decisión del Consejo Federal de 8 de octubre de 2014."],
   ["El texto vinculante","La cláusula 9.4 de las condiciones generales de contratación de la Confederación: el vendedor está obligado a presentar una factura electrónica si el valor del contrato supera los 5.000 francos, y el comprador determina las vías de entrega."],
   ["Por eso el umbral se lee raro","Solo las condiciones generales dicen «sin IVA». Las páginas oficiales dan la cifra sin el matiz."],
   ["Y por eso la exigencia es contractual","El incumplimiento es un asunto entre proveedor y comprador bajo esas condiciones, no una infracción tributaria. No hay cuadro de sanciones que citar."],
  ]),
  "de":("Wo die Pflicht tatsächlich steht",[
   ["Eine Verordnung gibt es nicht","Kein Erlass der Systematischen Sammlung schreibt sie vor. Jede amtliche Seite führt sie auf einen Bundesratsbeschluss vom 8. Oktober 2014 zurück."],
   ["Der verbindliche Text","Ziffer 9.4 der AGB des Bundes: Der Verkäufer ist verpflichtet, eine elektronische Rechnung einzureichen, wenn der Vertragswert 5'000 Franken übersteigt, und der Käufer bestimmt die Zustellwege."],
   ["Deshalb liest sich die Schwelle eigentümlich","Nur die AGB sagen «exklusive MWST». Die amtlichen Fliesstextseiten nennen den Betrag ohne den Zusatz."],
   ["Und deshalb ist die Durchsetzung vertraglich","Nichterfüllung ist eine Sache zwischen Lieferant und Käufer nach diesen Bedingungen, kein Steuerdelikt. Es gibt keinen Sanktionskatalog zu zitieren."],
  ]),
  "fr":("Où réside réellement l'obligation",[
   ["Il n'existe pas d'ordonnance","Aucun acte du Recueil systématique ne l'impose. Toute page officielle la rattache à une décision du Conseil fédéral du 8 octobre 2014."],
   ["Le texte contraignant","La clause 9.4 des conditions générales de la Confédération : le vendeur est tenu de remettre une facture électronique si la valeur du contrat dépasse 5 000 francs, l'acheteur déterminant les modalités de remise."],
   ["D'où la lecture curieuse du seuil","Seules les conditions générales disent « hors TVA ». Les pages officielles en prose donnent le montant sans la précision."],
   ["Et d'où le caractère contractuel de la sanction","Le manquement se règle entre fournisseur et acheteur selon ces conditions, ce n'est pas une infraction fiscale. Il n'existe aucun barème de sanctions à citer."],
  ]),
 }),
 dict(section="penalties_related",sort=0,t={
  "en":("Retention, and what governs authenticity",[
   ["Ten years","From the end of the financial year, under Code of Obligations art. 958f, for accounting books and records, annual reports and audit reports."],
   ["Twenty-six years","For records concerning immovable property — the ten-year absolute limitation running past the twenty-year adjustment period. Twenty is the number a page guesses; the tax administration's own current guidance says twenty-six."],
   ["Electronic media are permitted","Unalterable media satisfy the business-records ordinance without further conditions. Alterable media require technical safeguards including signatures and time stamps, with logs retained. Cloud backup alone does not meet the unalterable standard."],
   ["Authenticity","No signature is required. The former ElDI-V regime survives only as history; what governs is ordinary bookkeeping control and the free evaluation of evidence under the VAT Act."],
  ]),
  "es":("Conservación, y qué rige la autenticidad",[
   ["Diez años","Desde el cierre del ejercicio, según el art. 958f del Código de Obligaciones, para libros y comprobantes contables, informes anuales e informes de auditoría."],
   ["Veintiséis años","Para documentos relativos a inmuebles: la prescripción absoluta de diez años corriendo más allá del periodo de ajuste de veinte. Veinte es la cifra que una página adivina; la orientación vigente de la administración tributaria dice veintiséis."],
   ["Se admiten soportes electrónicos","Los soportes inalterables satisfacen el reglamento sobre libros de comercio sin más condiciones. Los alterables exigen salvaguardas técnicas, incluidas firmas y sellos de tiempo, con registros conservados. La copia en la nube por sí sola no cumple el estándar de inalterabilidad."],
   ["Autenticidad","No se exige firma. El antiguo régimen ElDI-V solo pervive como historia; rige el control contable ordinario y la libre valoración de la prueba de la Ley del IVA."],
  ]),
  "de":("Aufbewahrung, und was die Echtheit regelt",[
   ["Zehn Jahre","Ab Ende des Geschäftsjahres, nach Art. 958f OR, für Geschäftsbücher und Buchungsbelege, Geschäftsberichte und Revisionsberichte."],
   ["Sechsundzwanzig Jahre","Für Unterlagen zu Grundstücken -- die zehnjährige absolute Verjährung, die über die zwanzigjährige Berichtigungsdauer hinausläuft. Zwanzig ist die Zahl, die eine Seite errät; die aktuelle Wegleitung der Steuerverwaltung nennt sechsundzwanzig."],
   ["Elektronische Datenträger sind zulässig","Unveränderbare Datenträger erfüllen die Geschäftsbücherverordnung ohne weitere Bedingungen. Veränderbare verlangen technische Sicherungen einschliesslich Signaturen und Zeitstempeln, mit aufbewahrten Protokollen. Eine Cloud-Sicherung allein genügt dem Unveränderbarkeitsstandard nicht."],
   ["Echtheit","Eine Signatur ist nicht erforderlich. Das frühere ElDI-V-Regime besteht nur noch als Geschichte; massgeblich sind die ordentliche Buchführungskontrolle und die freie Beweiswürdigung nach dem MWSTG."],
  ]),
  "fr":("Conservation, et ce qui régit l'authenticité",[
   ["Dix ans","À compter de la clôture de l'exercice, selon l'art. 958f du Code des obligations, pour les livres et pièces comptables, les rapports annuels et les rapports de révision."],
   ["Vingt-six ans","Pour les documents relatifs aux immeubles — la prescription absolue de dix ans courant au-delà de la période d'ajustement de vingt ans. Vingt est le chiffre qu'une page devine ; les indications actuelles de l'administration fiscale disent vingt-six."],
   ["Les supports électroniques sont admis","Les supports inaltérables satisfont l'ordonnance sur les livres de comptes sans condition supplémentaire. Les supports altérables exigent des garanties techniques, dont signatures et horodatages, avec conservation des journaux. Une sauvegarde en nuage seule ne satisfait pas le standard d'inaltérabilité."],
   ["Authenticité","Aucune signature n'est exigée. L'ancien régime ElDI-V ne subsiste que comme histoire ; ce qui régit, c'est le contrôle comptable ordinaire et la libre appréciation des preuves selon la loi TVA."],
  ]),
 }),
 dict(section="penalties_related",sort=1,t={
  "en":("🔍 What we could not confirm",[
   ["Swiss statute text, at all","fedlex.admin.ch is a JavaScript-only application that serves no text, and its data host blocks automated access. Every article number on this page is cited from official guidance — the tax administration's and the federal SME portal's — rather than from the enacted text."],
   ["An ordinance behind the B2G duty","None found. If one exists it is not cited by any official page, all of which point to the Federal Council decision instead."],
   ["The repeal date of the ElDI-V","Reported as 1 January 2018 by professional sources. The tax administration treats the material as archival, which is consistent but not dispositive."],
   ["A comprehensive cantonal survey","Only Zurich was examined. Cantonal practice is heterogeneous, so \"no canton obliges suppliers\" is not found rather than proven."],
   ["Whether any B2B mandate is under consideration","The federal parliament's business database is JavaScript-only and could not be read. The negative rests on EY's June 2026 tracker recording no planned mandate."],
  ]),
  "es":("🔍 Lo que no pudimos confirmar",[
   ["El texto legal suizo, en absoluto","fedlex.admin.ch es una aplicación solo con JavaScript que no sirve texto, y su host de datos bloquea el acceso automatizado. Todo número de artículo de esta página se cita desde orientación oficial —la de la administración tributaria y la del portal federal para pymes— y no desde el texto promulgado."],
   ["Un reglamento tras el deber B2G","No se halló ninguno. Si existe, ninguna página oficial lo cita; todas remiten a la decisión del Consejo Federal."],
   ["La fecha de derogación del ElDI-V","Fuentes profesionales la sitúan el 1 de enero de 2018. La administración tributaria trata ese material como archivo, lo que es coherente pero no concluyente."],
   ["Un examen cantonal completo","Solo se examinó Zúrich. La práctica cantonal es heterogénea, así que «ningún cantón obliga a los proveedores» es un dato no hallado y no probado."],
   ["Si se estudia alguna obligación B2B","La base de datos parlamentaria federal es solo con JavaScript y no pudo leerse. La negativa se apoya en el rastreador de EY de junio de 2026, que no registra obligación prevista."],
  ]),
  "de":("🔍 Was wir nicht bestätigen konnten",[
   ["Schweizer Gesetzestext, überhaupt","fedlex.admin.ch ist eine reine JavaScript-Anwendung, die keinen Text ausliefert, und ihr Datenhost sperrt den automatisierten Zugriff. Jede Artikelnummer auf dieser Seite ist aus amtlichen Hinweisen zitiert -- jenen der Steuerverwaltung und des KMU-Portals -- und nicht aus dem verkündeten Text."],
   ["Eine Verordnung hinter der B2G-Pflicht","Keine gefunden. Falls es eine gibt, zitiert sie keine amtliche Seite; alle verweisen stattdessen auf den Bundesratsbeschluss."],
   ["Das Aufhebungsdatum der ElDI-V","Von Fachquellen auf den 1. Januar 2018 datiert. Die Steuerverwaltung führt das Material als Archiv, was stimmig, aber nicht entscheidend ist."],
   ["Eine vollständige kantonale Erhebung","Untersucht wurde nur Zürich. Die kantonale Praxis ist uneinheitlich; «kein Kanton verpflichtet Lieferanten» ist daher nicht gefunden, nicht bewiesen."],
   ["Ob eine B2B-Pflicht erwogen wird","Die Geschäftsdatenbank des Bundesparlaments ist reine JavaScript und war nicht lesbar. Der negative Befund stützt sich auf EYs Tracker vom Juni 2026, der keine geplante Pflicht verzeichnet."],
  ]),
  "fr":("🔍 Ce que nous n'avons pas pu confirmer",[
   ["Le texte légal suisse, tout simplement","fedlex.admin.ch est une application uniquement en JavaScript qui ne sert aucun texte, et son hôte de données bloque l'accès automatisé. Tout numéro d'article de cette page est cité depuis des indications officielles — celles de l'administration fiscale et du portail PME — et non depuis le texte promulgué."],
   ["Une ordonnance derrière l'obligation B2G","Aucune trouvée. S'il en existe une, aucune page officielle ne la cite ; toutes renvoient à la décision du Conseil fédéral."],
   ["La date d'abrogation de l'ElDI-V","Située au 1er janvier 2018 par des sources professionnelles. L'administration fiscale traite ce matériel comme archivé, ce qui est cohérent sans être décisif."],
   ["Un relevé cantonal complet","Seul Zurich a été examiné. La pratique cantonale est hétérogène : « aucun canton n'oblige les fournisseurs » est non trouvé, non démontré."],
   ["Si une obligation B2B est à l'étude","La base des affaires du Parlement fédéral est uniquement en JavaScript et n'a pas pu être lue. Le constat négatif repose sur le tracker d'EY de juin 2026, qui n'enregistre aucune obligation prévue."],
  ]),
 }),
]

STEPS=[
 {"en":("Check whether your counterparty is actually in scope","The obligation reaches the central federal administration only. The Federal Finance Administration publishes the list of units that receive e-invoices; a cantonal or communal buyer is not on it, and neither is the ETH domain."),
  "es":("Compruebe si su contraparte está realmente en el ámbito","La obligación alcanza solo a la administración federal central. La Administración Federal de Finanzas publica la lista de unidades que reciben facturas electrónicas; un comprador cantonal o municipal no figura, ni tampoco el ámbito de las EPF."),
  "de":("Prüfen Sie, ob Ihre Gegenpartei überhaupt erfasst ist","Die Pflicht erreicht nur die zentrale Bundesverwaltung. Die Eidgenössische Finanzverwaltung veröffentlicht die Liste der Einheiten, die E-Rechnungen empfangen; ein kantonaler oder kommunaler Käufer steht nicht darauf, der ETH-Bereich ebenso wenig."),
  "fr":("Vérifiez si votre contrepartie relève effectivement du champ","L'obligation n'atteint que l'administration fédérale centrale. L'Administration fédérale des finances publie la liste des unités qui reçoivent des factures électroniques ; un acheteur cantonal ou communal n'y figure pas, ni le domaine des EPF.")},
 {"en":("Choose the lightest channel that satisfies it","A PDF by e-mail is enough. Use a service provider and structured data if you want the automation, not because the rule requires it — and remember that since June 2023 a PDF must go by e-mail rather than through a provider."),
  "es":("Elija el canal más ligero que lo satisfaga","Basta un PDF por correo. Use un proveedor de servicios y datos estructurados si quiere la automatización, no porque la norma lo exija; y recuerde que desde junio de 2023 el PDF debe ir por correo y no por proveedor."),
  "de":("Wählen Sie den leichtesten Kanal, der die Pflicht erfüllt","Ein PDF per E-Mail genügt. Nutzen Sie einen Service-Provider und strukturierte Daten, wenn Sie die Automatisierung wollen, nicht weil die Regel es verlangt -- und denken Sie daran, dass ein PDF seit Juni 2023 per E-Mail und nicht über einen Provider kommen muss."),
  "fr":("Choisissez le canal le plus léger qui la satisfait","Un PDF par courriel suffit. Recourez à un prestataire et à des données structurées si vous voulez l'automatisation, non parce que la règle l'exige — et rappelez-vous que depuis juin 2023 un PDF doit passer par courriel et non par un prestataire.")},
 {"en":("Get onto the tax administration's portal","Online VAT filing has been compulsory since January 2025 and the portal was consolidated in May 2026, retiring the old simplified filing route. This is unrelated to invoicing but it is the one Swiss deadline that has actually moved recently."),
  "es":("Dese de alta en el portal de la administración tributaria","La declaración en línea del IVA es obligatoria desde enero de 2025 y el portal se unificó en mayo de 2026, retirando la antigua vía simplificada. No guarda relación con la facturación, pero es el único plazo suizo que se ha movido últimamente."),
  "de":("Registrieren Sie sich im Portal der Steuerverwaltung","Die Online-MWST-Abrechnung ist seit Januar 2025 zwingend, und das Portal wurde im Mai 2026 zusammengeführt, wobei der alte vereinfachte Weg entfiel. Das hat mit der Rechnungsstellung nichts zu tun, ist aber die einzige Schweizer Frist, die sich jüngst bewegt hat."),
  "fr":("Inscrivez-vous au portail de l'administration fiscale","La déclaration en ligne de TVA est obligatoire depuis janvier 2025 et le portail a été regroupé en mai 2026, supprimant l'ancienne voie simplifiée. Cela n'a rien à voir avec la facturation, mais c'est la seule échéance suisse qui ait bougé récemment.")},
 {"en":("Keep ten years, and twenty-six for property","Retention runs from the end of the financial year under company law. If your records touch immovable property, the period is twenty-six years, not twenty — and electronic storage is fine provided the medium is genuinely unalterable."),
  "es":("Conserve diez años, y veintiséis para inmuebles","La conservación corre desde el cierre del ejercicio según el derecho societario. Si sus registros afectan a inmuebles, el plazo es de veintiséis años y no de veinte; y el almacenamiento electrónico vale siempre que el soporte sea de verdad inalterable."),
  "de":("Bewahren Sie zehn Jahre auf, sechsundzwanzig bei Grundstücken","Die Frist läuft ab Ende des Geschäftsjahres nach Gesellschaftsrecht. Betreffen Ihre Unterlagen Grundstücke, sind es sechsundzwanzig Jahre und nicht zwanzig -- und die elektronische Ablage ist zulässig, sofern der Datenträger wirklich unveränderbar ist."),
  "fr":("Conservez dix ans, et vingt-six pour l'immobilier","La durée court depuis la clôture de l'exercice selon le droit des sociétés. Si vos documents touchent à des immeubles, la durée est de vingt-six ans et non de vingt — et le stockage électronique convient pourvu que le support soit véritablement inaltérable.")},
]

PORTALS=[
 ("https://www.efv.admin.ch/de/e-rechnungen-zustellen",{"en":"Sending an e-invoice to the Confederation","es":"Enviar una factura electrónica a la Confederación","de":"E-Rechnung dem Bund zustellen","fr":"Adresser une facture électronique à la Confédération"}),
 ("https://www.efv.admin.ch/de/liste-verwaltungseinheiten",{"en":"The list of federal units that receive e-invoices","es":"Lista de unidades federales que reciben facturas electrónicas","de":"Liste der Verwaltungseinheiten, die E-Rechnungen empfangen","fr":"Liste des unités fédérales recevant des factures électroniques"}),
 ("https://www.bkb.admin.ch/de/agb-des-bundes",{"en":"The Confederation's procurement standard terms — clause 9.4 is the obligation","es":"Condiciones generales de contratación de la Confederación: la cláusula 9.4 es la obligación","de":"AGB des Bundes — Ziffer 9.4 ist die Pflicht","fr":"Conditions générales de la Confédération — la clause 9.4 est l'obligation"}),
 ("https://www.estv.admin.ch/de/mwst-online-abrechnen",{"en":"Federal Tax Administration — filing VAT online","es":"Administración Federal de Contribuciones: declarar el IVA en línea","de":"Eidgenössische Steuerverwaltung — MWST online abrechnen","fr":"Administration fédérale des contributions — déclarer la TVA en ligne"}),
]

out=[]; w=out.append
w("-- Switzerland deep dive. GENERATED by gen_switzerland_deep_dive.py --")
w("-- edit the generator. See its docstring for the two things this page")
w("-- exists to say: the duty is non-paper rather than structured, and the")
w("-- Liechtenstein pairing runs in the opposite direction.")
w("")
w("INSERT OR IGNORE INTO deep_dive_pages (country_id, last_updated) SELECT id, '2026-08-27' FROM countries WHERE code = 'CH';")
w("")
for lang in LANGS:
    p=PAGE[lang]
    w("INSERT OR IGNORE INTO deep_dive_page_translations (country_id, lang, compliance_model, footer_disclaimer,"
      " timeline_intro, file_format_intro, scope_intro, steps_intro, penalties_intro, mandate_summary, mandate_summary_icon)")
    w(f"SELECT id, '{lang}', {lit(p['compliance_model'])}, {lit(p['footer_disclaimer'])}, {lit(p['timeline_intro'])},"
      f" {lit(p['file_format_intro'])}, {lit(p['scope_intro'])}, {lit(p['steps_intro'])}, {lit(p['penalties_intro'])},"
      f" {lit(p['mandate_summary'])}, {lit(p['mandate_summary_icon'])} FROM countries WHERE code = 'CH';")
    w("")
w("-- ---- stat strip: nothing the headline tiles above already state ----")
for i,s in enumerate(STATS):
    w(f"INSERT INTO deep_dive_stats (country_id, sort_order) SELECT c.id, {i} FROM countries c WHERE c.code = 'CH'")
    w(f"  AND NOT EXISTS (SELECT 1 FROM deep_dive_stats d WHERE d.country_id = c.id AND d.sort_order = {i});")
    for lang in LANGS:
        v,l=s[lang]
        w("INSERT OR IGNORE INTO deep_dive_stat_translations (stat_id, lang, stat_value, stat_label)")
        w(f"SELECT d.id, '{lang}', {lit(v)}, {lit(l)} FROM deep_dive_stats d WHERE d.country_id = {CID} AND d.sort_order = {i};")
    w("")
w("-- ---- cards ----")
for c in CARDS:
    sec,so=c["section"],c["sort"]
    w(f"INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT c.id, '{sec}', {so} FROM countries c WHERE c.code = 'CH'")
    w(f"  AND NOT EXISTS (SELECT 1 FROM deep_dive_cards d WHERE d.country_id = c.id AND d.section = '{sec}' AND d.sort_order = {so});")
    for lang in LANGS:
        title,rows=c["t"][lang]
        w("INSERT OR IGNORE INTO deep_dive_card_translations (card_id, lang, title, rows_json)")
        w(f"SELECT d.id, '{lang}', {lit(title)}, {lit(json.dumps(rows, ensure_ascii=False))} FROM deep_dive_cards d WHERE d.country_id = {CID} AND d.section = '{sec}' AND d.sort_order = {so};")
    w("")
w("-- ---- steps ----")
for i,s in enumerate(STEPS):
    w(f"INSERT INTO deep_dive_steps (country_id, sort_order) SELECT c.id, {i} FROM countries c WHERE c.code = 'CH'")
    w(f"  AND NOT EXISTS (SELECT 1 FROM deep_dive_steps d WHERE d.country_id = c.id AND d.sort_order = {i});")
    for lang in LANGS:
        t,d=s[lang]
        w("INSERT OR IGNORE INTO deep_dive_step_translations (step_id, lang, title, description)")
        w(f"SELECT s.id, '{lang}', {lit(t)}, {lit(d)} FROM deep_dive_steps s WHERE s.country_id = {CID} AND s.sort_order = {i};")
    w("")
w("-- ---- portals ----")
for i,(url,labels) in enumerate(PORTALS):
    w(f"INSERT INTO deep_dive_portals (country_id, url, sort_order) SELECT c.id, {lit(url)}, {i} FROM countries c WHERE c.code = 'CH'")
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
