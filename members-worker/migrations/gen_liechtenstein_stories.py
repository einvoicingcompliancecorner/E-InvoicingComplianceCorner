#!/usr/bin/env python3
"""gen_liechtenstein_stories.py — emits 670_liechtenstein_stories.sql.

Edit this file, not the SQL. Run:
    python3 gen_liechtenstein_stories.py > 670_liechtenstein_stories.sql

Three stories, not four. Botswana's arc was four because the delays were
the story; Liechtenstein's story is an asymmetry, and it is told once
properly rather than three times thinly. Each of these is a real dated
event with a source, and together they answer the question a reader
actually has: why does a country outside the EU have a European
obligation, and why will the next one not reach it?

No body links back to this site -- the archive renderer adds the deep-dive
link itself, and a standing invariant fails the replay on any body
carrying the site's own domain.
"""

LANGS = ("en", "es", "de", "fr")

def esc(s):
    return s.replace("'", "''")

def lit(s):
    return "'" + esc(s) + "'"

STORIES = [
{
 "id": "2018-11-27-liechtenstein-eea-route-to-en16931",
 "date": "2018-11-27",
 "source_url": "https://www.efta.int/eea-lex/32014l0055",
 "t": {
 "en": ("🇱🇮 How a non-EU state ended up accepting EN 16931",
        "Liechtenstein's contracting authorities must accept and process EN 16931 electronic invoices from today. The obligation arrived through the EEA Agreement rather than EU membership — and it lands on the buyer, not the supplier.",
        "<h3>🇱🇮 How a non-EU state ended up accepting EN 16931</h3>"
        "<p>From today Liechtenstein's contracting authorities must receive and process electronic invoices conforming to the European standard, for procurement above EU thresholds. Liechtenstein is not an EU member, and the route by which this obligation reached it is worth following, because it predicts what will and will not arrive next.</p>"
        "<p>Directive 2014/55/EU was incorporated into the EEA Agreement by Joint Committee Decision 166/2015 of 11 June 2015, entering into force on 1 January 2016; Liechtenstein notified fulfilment of its constitutional requirements on 19 November 2015. The compliance date across the EEA is today. Annex XVI of the Agreement covers public procurement, and that is the door the directive came through.</p>"
        "<p><strong>Read the obligation carefully, because it is easy to overstate and easy to dismiss.</strong> The duty is on the contracting authority to receive and process a compliant invoice. There is no duty on a supplier to send one. What a supplier gains is an assurance: invoice the administration electronically and it must be able to handle it. That is different from a mandate, and it is also different from nothing.</p>"
        "<p>There is no national platform to do it through. Above-threshold invoices are sent to the contracting authority by email, in XML or PDF. Liechtenstein has no Peppol Authority, and neither does Switzerland.</p>"),
 "es": ("🇱🇮 Cómo un Estado no perteneciente a la UE acabó aceptando EN 16931",
        "Desde hoy los organismos contratantes de Liechtenstein deben aceptar y procesar facturas electrónicas EN 16931. La obligación llegó por el Acuerdo EEE y no por la pertenencia a la UE, y recae en el comprador, no en el proveedor.",
        "<h3>🇱🇮 Cómo un Estado no perteneciente a la UE acabó aceptando EN 16931</h3>"
        "<p>Desde hoy los organismos contratantes de Liechtenstein deben recibir y procesar facturas electrónicas conformes a la norma europea, en contratación por encima de los umbrales de la UE. Liechtenstein no es miembro de la UE, y merece la pena seguir la vía por la que le llegó esta obligación, porque predice qué llegará después y qué no.</p>"
        "<p>La Directiva 2014/55/UE se incorporó al Acuerdo EEE mediante la Decisión 166/2015 del Comité Mixto, de 11 de junio de 2015, con entrada en vigor el 1 de enero de 2016; Liechtenstein notificó el cumplimiento de sus requisitos constitucionales el 19 de noviembre de 2015. La fecha de cumplimiento en todo el EEE es hoy. El anexo XVI del Acuerdo cubre la contratación pública, y esa es la puerta por la que entró la directiva.</p>"
        "<p><strong>Lea la obligación con cuidado, porque es fácil exagerarla y fácil descartarla.</strong> El deber recae en el organismo contratante, que debe recibir y procesar una factura conforme. No hay deber alguno del proveedor de enviarla. Lo que el proveedor gana es una garantía: si factura electrónicamente a la administración, esta debe poder tramitarla. Eso no es una obligación, y tampoco es nada.</p>"
        "<p>No hay plataforma nacional para hacerlo. Las facturas por encima del umbral se envían por correo electrónico al organismo contratante, en XML o PDF. Liechtenstein no tiene autoridad Peppol, y Suiza tampoco.</p>"),
 "de": ("🇱🇮 Wie ein Nicht-EU-Staat dazu kam, EN 16931 anzunehmen",
        "Ab heute müssen Liechtensteins Auftraggeber elektronische Rechnungen nach EN 16931 annehmen und verarbeiten. Die Pflicht kam über das EWR-Abkommen und nicht über eine EU-Mitgliedschaft — und sie trifft den Käufer, nicht den Lieferanten.",
        "<h3>🇱🇮 Wie ein Nicht-EU-Staat dazu kam, EN 16931 anzunehmen</h3>"
        "<p>Ab heute müssen Liechtensteins Auftraggeber elektronische Rechnungen nach der europäischen Norm entgegennehmen und verarbeiten, im Beschaffungswesen oberhalb der EU-Schwellenwerte. Liechtenstein ist kein EU-Mitglied, und der Weg, auf dem diese Pflicht dorthin gelangte, lohnt die Betrachtung, denn er sagt voraus, was als Nächstes ankommt und was nicht.</p>"
        "<p>Die Richtlinie 2014/55/EU wurde durch Beschluss 166/2015 des Gemeinsamen Ausschusses vom 11. Juni 2015 in das EWR-Abkommen übernommen und trat am 1. Januar 2016 in Kraft; Liechtenstein zeigte die Erfüllung seiner verfassungsrechtlichen Anforderungen am 19. November 2015 an. Der Umsetzungstermin im gesamten EWR ist heute. Anhang XVI des Abkommens erfasst das öffentliche Beschaffungswesen, und das ist die Tür, durch die die Richtlinie kam.</p>"
        "<p><strong>Lesen Sie die Pflicht genau, denn sie lässt sich leicht überzeichnen und leicht abtun.</strong> Die Pflicht trifft den Auftraggeber, eine konforme Rechnung zu empfangen und zu verarbeiten. Eine Pflicht des Lieferanten zu senden besteht nicht. Was der Lieferant gewinnt, ist eine Zusicherung: Wer der Verwaltung elektronisch fakturiert, dem muss sie das auch abnehmen können. Das ist keine Pflicht — und es ist auch nicht nichts.</p>"
        "<p>Eine nationale Plattform dafür gibt es nicht. Rechnungen oberhalb der Schwelle gehen per E-Mail an den Auftraggeber, als XML oder PDF. Liechtenstein hat keine Peppol-Behörde, die Schweiz ebenso wenig.</p>"),
 "fr": ("🇱🇮 Comment un État hors UE en est venu à accepter l'EN 16931",
        "Depuis aujourd'hui, les pouvoirs adjudicateurs du Liechtenstein doivent accepter et traiter les factures électroniques EN 16931. L'obligation est arrivée par l'accord EEE et non par l'adhésion à l'UE — et elle pèse sur l'acheteur, non sur le fournisseur.",
        "<h3>🇱🇮 Comment un État hors UE en est venu à accepter l'EN 16931</h3>"
        "<p>Depuis aujourd'hui, les pouvoirs adjudicateurs du Liechtenstein doivent recevoir et traiter les factures électroniques conformes à la norme européenne, pour les marchés au-dessus des seuils de l'UE. Le Liechtenstein n'est pas membre de l'UE, et la voie par laquelle cette obligation lui est parvenue mérite d'être suivie, car elle annonce ce qui arrivera ensuite et ce qui n'arrivera pas.</p>"
        "<p>La directive 2014/55/UE a été reprise dans l'accord EEE par la décision 166/2015 du Comité mixte du 11 juin 2015, entrée en vigueur le 1er janvier 2016 ; le Liechtenstein a notifié l'accomplissement de ses exigences constitutionnelles le 19 novembre 2015. La date de conformité dans tout l'EEE est aujourd'hui. L'annexe XVI de l'accord couvre les marchés publics, et c'est par cette porte que la directive est passée.</p>"
        "<p><strong>Lisez l'obligation avec soin, car elle se surestime aussi facilement qu'elle se balaie.</strong> L'obligation pèse sur le pouvoir adjudicateur, qui doit recevoir et traiter une facture conforme. Aucune obligation ne pèse sur le fournisseur d'en émettre. Ce que le fournisseur y gagne, c'est une assurance : s'il facture l'administration par voie électronique, celle-ci doit pouvoir la traiter. Ce n'est pas un mandat, et ce n'est pas rien non plus.</p>"
        "<p>Il n'existe aucune plateforme nationale pour le faire. Les factures au-dessus du seuil sont envoyées par courriel au pouvoir adjudicateur, en XML ou en PDF. Le Liechtenstein n'a pas d'autorité Peppol, la Suisse non plus.</p>"),
 },
},
{
 "id": "2025-01-01-liechtenstein-emwst-portal-is-not-e-reporting",
 "date": "2025-01-01",
 "source_url": "https://www.llv.li/serviceportal2/amtsstellen/steuerverwaltung/newsletter/stv_newsletter_uebersicht.pdf",
 "t": {
 "en": ("🇱🇮 The eMWST portal becomes mandatory — and it is not e-reporting",
        "VAT returns must now be filed through the Steuerverwaltung's eMWST portal. It is a filing channel, not a reporting regime: periodic totals go in, and no invoice or transaction detail reaches the authority.",
        "<h3>🇱🇮 The eMWST portal becomes mandatory — and it is not e-reporting</h3>"
        "<p>From today, filing a Liechtenstein VAT return means using the Steuerverwaltung's eMWST portal. Electronic submission has been possible since 2014; what changes now is that it is the only route.</p>"
        "<p>This is worth stating plainly because it is the kind of measure that gets mis-filed. A country whose returns must be submitted through a government portal looks, at a glance, like a country moving toward digital reporting. It is not. What travels through eMWST is the periodic return: the same totals that were previously sent on paper. No invoice-level data, no transaction-level data, and nothing that would let the authority see a sale as it happens.</p>"
        "<p>The distinction matters for anyone comparing markets. A clearance regime and a mandatory filing portal both produce the sentence \"VAT is filed electronically\", and they imply completely different amounts of work. Liechtenstein has the second and shows no sign of moving toward the first — the Steuerverwaltung's own newsletter archive, which is where it announces changes of this kind, contains no entry on electronic invoicing anywhere in its history.</p>"),
 "es": ("🇱🇮 El portal eMWST pasa a ser obligatorio, y no es e-reporting",
        "Las declaraciones de IVA deben presentarse ya por el portal eMWST de la Steuerverwaltung. Es un canal de presentación, no un régimen de declaración: entran totales periódicos y ningún detalle de factura u operación llega a la administración.",
        "<h3>🇱🇮 El portal eMWST pasa a ser obligatorio, y no es e-reporting</h3>"
        "<p>Desde hoy, presentar una declaración de IVA de Liechtenstein significa usar el portal eMWST de la Steuerverwaltung. La presentación electrónica es posible desde 2014; lo que cambia ahora es que es la única vía.</p>"
        "<p>Conviene decirlo con claridad porque es el tipo de medida que se clasifica mal. Un país cuyas declaraciones deben presentarse por un portal público parece, a primera vista, un país que avanza hacia la declaración digital. No lo es. Por eMWST viaja la declaración periódica: los mismos totales que antes se enviaban en papel. Ningún dato a nivel de factura, ninguno a nivel de operación, y nada que permita a la administración ver una venta mientras ocurre.</p>"
        "<p>La distinción importa a quien compara mercados. Un régimen de clearance y un portal de presentación obligatorio producen ambos la frase «el IVA se declara electrónicamente», y suponen cantidades de trabajo completamente distintas. Liechtenstein tiene lo segundo y no da señales de moverse hacia lo primero: el propio archivo de boletines de la Steuerverwaltung, donde anuncia cambios de este tipo, no recoge nada sobre facturación electrónica en toda su historia.</p>"),
 "de": ("🇱🇮 Das eMWST-Portal wird verbindlich — und ist kein E-Reporting",
        "MWST-Abrechnungen sind ab sofort über das eMWST-Portal der Steuerverwaltung einzureichen. Es ist ein Einreichungskanal und kein Meldeverfahren: periodische Summen gehen hinein, und weder Rechnungs- noch Transaktionsdetails erreichen die Behörde.",
        "<h3>🇱🇮 Das eMWST-Portal wird verbindlich — und ist kein E-Reporting</h3>"
        "<p>Ab heute bedeutet eine liechtensteinische MWST-Abrechnung den Weg über das eMWST-Portal der Steuerverwaltung. Elektronisch einreichen liess sich seit 2014; neu ist, dass es der einzige Weg ist.</p>"
        "<p>Das gehört klar gesagt, denn es ist die Art Massnahme, die falsch einsortiert wird. Ein Land, dessen Abrechnungen über ein Behördenportal laufen müssen, sieht auf den ersten Blick nach einem Land aus, das sich auf digitale Meldung zubewegt. Das tut es nicht. Über eMWST läuft die periodische Abrechnung: dieselben Summen, die zuvor auf Papier gingen. Keine Daten auf Rechnungsebene, keine auf Transaktionsebene, und nichts, was der Behörde einen Verkauf im Moment seines Entstehens zeigen würde.</p>"
        "<p>Für Marktvergleiche ist der Unterschied entscheidend. Ein Clearance-Regime und ein verbindliches Einreichungsportal ergeben beide den Satz «die MWST wird elektronisch abgerechnet» und bedeuten völlig unterschiedlichen Aufwand. Liechtenstein hat das Zweite und zeigt keine Anzeichen, sich auf das Erste zuzubewegen — das Newsletter-Archiv der Steuerverwaltung, in dem sie solche Änderungen ankündigt, enthält in seiner gesamten Geschichte keinen Eintrag zur elektronischen Rechnungsstellung.</p>"),
 "fr": ("🇱🇮 Le portail eMWST devient obligatoire — et ce n'est pas de l'e-reporting",
        "Les déclarations de TVA doivent désormais passer par le portail eMWST de la Steuerverwaltung. C'est un canal de dépôt, non un régime déclaratif : des totaux périodiques y entrent, et aucun détail de facture ou de transaction ne parvient à l'administration.",
        "<h3>🇱🇮 Le portail eMWST devient obligatoire — et ce n'est pas de l'e-reporting</h3>"
        "<p>À partir d'aujourd'hui, déposer une déclaration de TVA liechtensteinoise passe par le portail eMWST de la Steuerverwaltung. Le dépôt électronique est possible depuis 2014 ; ce qui change, c'est qu'il devient la seule voie.</p>"
        "<p>Cela mérite d'être dit clairement, car c'est le genre de mesure que l'on classe mal. Un pays dont les déclarations doivent transiter par un portail public ressemble, au premier regard, à un pays qui s'oriente vers la déclaration numérique. Il ne l'est pas. Ce qui passe par eMWST, c'est la déclaration périodique : les mêmes totaux qui partaient auparavant sur papier. Aucune donnée au niveau de la facture, aucune au niveau de la transaction, et rien qui permette à l'administration de voir une vente au moment où elle se produit.</p>"
        "<p>La distinction compte pour qui compare des marchés. Un régime de clearance et un portail de dépôt obligatoire produisent tous deux la phrase « la TVA se déclare par voie électronique », et supposent des charges de travail radicalement différentes. Le Liechtenstein a le second et ne montre aucun signe d'aller vers le premier : les archives de bulletins de la Steuerverwaltung, où elle annonce ce type de changement, ne comportent aucune entrée sur la facturation électronique.</p>"),
 },
},
{
 "id": "2026-08-27-liechtenstein-why-vida-will-never-arrive",
 "date": "2026-08-27",
 "source_url": "https://www.efta.int/sites/default/files/publications/Fact%20Sheets//EEA%20Relevance%20%E2%80%93%20What%20is%20covered%20by%20the%20EEA%20.pdf",
 "t": {
 "en": ("🇱🇮 Why ViDA will never reach Liechtenstein, and what that is worth knowing",
        "Liechtenstein takes European procurement law and not European VAT law. The EEA Agreement expressly excludes indirect taxation — so a country bound to accept EN 16931 will never be bound by a European B2B or digital reporting mandate.",
        "<h3>🇱🇮 Why ViDA will never reach Liechtenstein, and what that is worth knowing</h3>"
        "<p>Liechtenstein presents an asymmetry that is easy to miss and useful once seen. Its contracting authorities must accept EN 16931 electronic invoices, an obligation that came from EU law. Its businesses face no e-invoicing mandate of any kind, and will not face one as a consequence of anything the EU legislates.</p>"
        "<p>Both facts follow from the same document. The EEA Agreement covers public procurement in Annex XVI, which is how Directive 2014/55/EU arrived. It expressly does not cover taxation: EFTA's own fact sheet on what the EEA includes lists direct and indirect taxation among the matters outside it, alongside the customs union and the common trade policy. VAT is not EEA-relevant, and no Joint Committee Decision is going to make it so.</p>"
        "<p>What governs VAT in Liechtenstein instead is the treaty of 28 October 1994 with Switzerland, which makes Swiss VAT substance applicable — through Liechtenstein's own Value Added Tax Act and its own Steuerverwaltung. Rates, the CHF 100,000 threshold, invoice content and the absence of any signature requirement all come from there. Switzerland has no B2B e-invoicing mandate, so neither does Liechtenstein.</p>"
        "<p><strong>The practical value of this is predictive.</strong> If you run entities across Europe and you are modelling where the next obligation lands, Liechtenstein sits outside the ViDA perimeter permanently, not provisionally. But it is inside the procurement perimeter, so a future European procurement instrument would reach it the same way the last one did. That is a strange shape, and it is a stable one.</p>"),
 "es": ("🇱🇮 Por qué ViDA nunca llegará a Liechtenstein, y por qué conviene saberlo",
        "Liechtenstein toma el derecho europeo de contratación y no el del IVA. El Acuerdo EEE excluye expresamente la fiscalidad indirecta, así que un país obligado a aceptar EN 16931 nunca quedará obligado por un mandato europeo B2B o de declaración digital.",
        "<h3>🇱🇮 Por qué ViDA nunca llegará a Liechtenstein, y por qué conviene saberlo</h3>"
        "<p>Liechtenstein presenta una asimetría fácil de pasar por alto y útil una vez vista. Sus organismos contratantes deben aceptar facturas electrónicas EN 16931, obligación que vino del derecho de la UE. Sus empresas no afrontan mandato alguno de facturación electrónica, ni lo afrontarán como consecuencia de nada que legisle la UE.</p>"
        "<p>Ambos hechos derivan del mismo documento. El Acuerdo EEE cubre la contratación pública en su anexo XVI, y así llegó la Directiva 2014/55/UE. Expresamente no cubre la fiscalidad: la propia ficha de la AELC sobre lo que incluye el EEE enumera la imposición directa e indirecta entre las materias que quedan fuera, junto con la unión aduanera y la política comercial común. El IVA no es relevante a efectos del EEE, y ninguna decisión del Comité Mixto va a hacerlo relevante.</p>"
        "<p>Lo que rige el IVA en Liechtenstein es, en cambio, el tratado de 28 de octubre de 1994 con Suiza, que hace aplicable la sustancia del IVA suizo, a través de la Ley del Impuesto sobre el Valor Añadido propia de Liechtenstein y de su propia Steuerverwaltung. Los tipos, el umbral de 100.000 francos, el contenido de la factura y la ausencia de todo requisito de firma proceden de ahí. Suiza no tiene mandato B2B de facturación electrónica, y Liechtenstein tampoco.</p>"
        "<p><strong>El valor práctico de esto es predictivo.</strong> Si gestiona entidades por toda Europa y modela dónde caerá la próxima obligación, Liechtenstein queda fuera del perímetro de ViDA de forma permanente, no provisional. Pero está dentro del perímetro de la contratación, así que un futuro instrumento europeo de contratación le alcanzaría igual que el anterior. Es una forma extraña, y es estable.</p>"),
 "de": ("🇱🇮 Warum ViDA Liechtenstein nie erreichen wird, und warum das zu wissen lohnt",
        "Liechtenstein übernimmt europäisches Beschaffungsrecht, nicht europäisches Mehrwertsteuerrecht. Das EWR-Abkommen schliesst indirekte Steuern ausdrücklich aus — ein Land, das EN 16931 annehmen muss, wird also nie von einer europäischen B2B- oder Meldepflicht erfasst.",
        "<h3>🇱🇮 Warum ViDA Liechtenstein nie erreichen wird, und warum das zu wissen lohnt</h3>"
        "<p>Liechtenstein zeigt eine Asymmetrie, die leicht übersehen wird und nützlich ist, sobald man sie sieht. Seine Auftraggeber müssen elektronische Rechnungen nach EN 16931 annehmen — eine Pflicht aus EU-Recht. Seine Unternehmen unterliegen keinerlei E-Rechnungs-Pflicht und werden ihr auch nicht als Folge von EU-Gesetzgebung unterliegen.</p>"
        "<p>Beides folgt aus demselben Dokument. Das EWR-Abkommen erfasst in Anhang XVI das öffentliche Beschaffungswesen; so kam die Richtlinie 2014/55/EU. Steuern erfasst es ausdrücklich nicht: das EFTA-Merkblatt darüber, was der EWR umfasst, führt direkte und indirekte Besteuerung unter den ausgenommenen Bereichen auf, neben Zollunion und gemeinsamer Handelspolitik. Die Mehrwertsteuer ist nicht EWR-relevant, und kein Beschluss des Gemeinsamen Ausschusses wird sie dazu machen.</p>"
        "<p>Was die Mehrwertsteuer in Liechtenstein stattdessen regiert, ist der Staatsvertrag vom 28. Oktober 1994 mit der Schweiz, der schweizerische MWST-Substanz anwendbar macht — über Liechtensteins eigenes Mehrwertsteuergesetz und seine eigene Steuerverwaltung. Sätze, die Schwelle von 100'000 Franken, der Rechnungsinhalt und das Fehlen jeder Signaturpflicht kommen von dort. Die Schweiz hat keine B2B-Pflicht zur elektronischen Rechnungsstellung, folglich Liechtenstein auch nicht.</p>"
        "<p><strong>Der praktische Wert davon ist prognostisch.</strong> Wer Gesellschaften quer durch Europa führt und modelliert, wo die nächste Pflicht landet, findet Liechtenstein dauerhaft ausserhalb des ViDA-Perimeters, nicht vorläufig. Innerhalb des Beschaffungsperimeters liegt es aber sehr wohl, sodass ein künftiges europäisches Beschaffungsinstrument es genauso erreichen würde wie das letzte. Eine seltsame Form — und eine stabile.</p>"),
 "fr": ("🇱🇮 Pourquoi ViDA n'atteindra jamais le Liechtenstein, et pourquoi le savoir",
        "Le Liechtenstein reprend le droit européen de la commande publique, pas celui de la TVA. L'accord EEE exclut expressément la fiscalité indirecte — un pays tenu d'accepter l'EN 16931 ne sera donc jamais lié par un mandat européen B2B ou de déclaration numérique.",
        "<h3>🇱🇮 Pourquoi ViDA n'atteindra jamais le Liechtenstein, et pourquoi le savoir</h3>"
        "<p>Le Liechtenstein présente une asymétrie facile à manquer et utile une fois vue. Ses pouvoirs adjudicateurs doivent accepter les factures électroniques EN 16931, obligation venue du droit de l'UE. Ses entreprises ne sont soumises à aucun mandat de facturation électronique, et ne le seront pas du fait de ce que légifère l'UE.</p>"
        "<p>Les deux faits découlent du même document. L'accord EEE couvre les marchés publics à son annexe XVI ; c'est par là qu'est arrivée la directive 2014/55/UE. Il ne couvre expressément pas la fiscalité : la fiche de l'AELE sur ce que comprend l'EEE range la fiscalité directe et indirecte parmi les matières exclues, aux côtés de l'union douanière et de la politique commerciale commune. La TVA n'est pas pertinente au regard de l'EEE, et aucune décision du Comité mixte ne l'y rendra.</p>"
        "<p>Ce qui régit la TVA au Liechtenstein, c'est le traité du 28 octobre 1994 avec la Suisse, qui rend applicable la substance de la TVA suisse — à travers la loi liechtensteinoise sur la taxe sur la valeur ajoutée et sa propre Steuerverwaltung. Les taux, le seuil de 100 000 francs, le contenu de la facture et l'absence de toute exigence de signature en proviennent. La Suisse n'a pas de mandat B2B de facturation électronique ; le Liechtenstein non plus.</p>"
        "<p><strong>La valeur pratique de tout ceci est prédictive.</strong> Si vous pilotez des entités à travers l'Europe et modélisez où tombera la prochaine obligation, le Liechtenstein se situe hors du périmètre ViDA de façon permanente, non provisoire. Mais il est bien dans le périmètre de la commande publique : un futur instrument européen en la matière l'atteindrait comme l'a fait le précédent. Une forme étrange — et stable.</p>"),
 },
},
]

out = []
w = out.append
w("-- Liechtenstein: three stories on an asymmetry.")
w("-- GENERATED by gen_liechtenstein_stories.py -- edit the generator.")
w("")
for s in STORIES:
    en = s["t"]["en"]
    w("INSERT OR IGNORE INTO stories (id, date, month, summary_en, html_en, source_url, published)")
    w(f"VALUES ({lit(s['id'])}, {lit(s['date'])}, {lit(s['date'][:7])}, {lit(en[1])}, {lit(en[2])}, {lit(s['source_url'])}, 1);")
    w(f"INSERT OR IGNORE INTO story_countries (story_id, country_id) SELECT {lit(s['id'])}, id FROM countries WHERE code = 'LI';")
    for lang in LANGS:
        title, summary, html = s["t"][lang]
        w("INSERT OR IGNORE INTO story_translations (story_id, lang, title, summary, html)")
        w(f"VALUES ({lit(s['id'])}, '{lang}', {lit(title)}, {lit(summary)}, {lit(html)});")
    w("")

ids = ",".join(lit(s["id"]) for s in STORIES)
w("-- ---- what this migration claims it did ----")
w(f"-- ASSERT: SELECT count(*) FROM stories WHERE id IN ({ids}) = {len(STORIES)}")
w(f"-- ASSERT: SELECT count(*) FROM story_countries WHERE story_id IN ({ids}) = {len(STORIES)}")
for lang in LANGS:
    w(f"-- ASSERT: SELECT count(*) FROM story_translations WHERE lang = '{lang}' AND story_id IN ({ids}) = {len(STORIES)}")
w(f"-- ASSERT: SELECT count(*) FROM stories WHERE id IN ({ids}) AND (source_url IS NULL OR source_url = '') = 0")
w(f"-- ASSERT: SELECT count(*) FROM stories WHERE id IN ({ids}) AND html_en LIKE '%e-invoicingcompliancecorner.com%' = 0")

print("\n".join(out))
