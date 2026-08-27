#!/usr/bin/env python3
"""gen_botswana_stories.py — emits 661_botswana_stories.sql.

Edit this file, not the SQL. Run:
    python3 gen_botswana_stories.py > 661_botswana_stories.sql

A four-story arc about a mandate that kept moving, following the
Netherlands precedent (221-222) of giving a new country real archive
presence rather than one launch post. The arc IS the story here: BURS
announced e-billing in February 2024, a budget speech named March 2026
subject to legislation, the next budget speech expected April 2026, and
the Act that finally arrived in July 2026 moved it again to roughly
April 2027. Dan asked for exactly this: the delays, told as news.

Two rules the bodies observe. No link back to this site -- the archive
renderer adds the deep-dive link itself, and a standing invariant fails
the replay on any body containing the site's own domain. And every story
carries a source_url that supports the specific claim in its headline,
not merely the country in general.
"""
import json

LANGS = ("en", "es", "de", "fr")

def esc(s):
    return s.replace("'", "''")

def lit(s):
    return "'" + esc(s) + "'"

STORIES = [
{
 "id": "2024-02-05-botswana-burs-announces-ebilling",
 "date": "2024-02-05",
 "source_url": "https://dailynews.gov.bw/news-detail/77665",
 "t": {
 "en": ("🇧🇼 BURS commits to electronic billing, and sets a three-year clock running",
        "BURS announced electronic billing as a three-year project, with the first phase due to complete in December 2024. No legislation existed to support it, and that first date was not met.",
        "<h3>🇧🇼 BURS commits to electronic billing, and sets a three-year clock running</h3>"
        "<p>The Botswana Unified Revenue Service announced an electronic billing programme, framed as a three-year project whose first phase was scheduled to complete in December 2024. The stated purpose was closing leakages and maximising revenue — the language every revenue authority uses when it moves to transaction-level visibility.</p>"
        "<p>Two things about this announcement are worth holding on to, because they explain everything that follows. There was no legal instrument behind it: no Act, no regulation, no statutory instrument obliging anyone to do anything. And the December 2024 phase-one date was not met.</p>"
        "<p>The clock it started is nonetheless the most useful frame for the whole programme. Three years from February 2024 lands in early 2027, which is close to where the enacted law now sits.</p>"),
 "es": ("🇧🇼 BURS se compromete con la facturación electrónica y pone en marcha un reloj de tres años",
        "BURS anunció la facturación electrónica como un proyecto a tres años, con la primera fase prevista para diciembre de 2024. No había legislación que lo sostuviera y esa primera fecha no se cumplió.",
        "<h3>🇧🇼 BURS se compromete con la facturación electrónica y pone en marcha un reloj de tres años</h3>"
        "<p>El Servicio Unificado de Ingresos de Botsuana anunció un programa de facturación electrónica, planteado como un proyecto a tres años cuya primera fase debía concluir en diciembre de 2024. El propósito declarado era cerrar fugas y maximizar la recaudación: el lenguaje que emplea toda administración tributaria cuando se mueve hacia la visibilidad transacción a transacción.</p>"
        "<p>Dos aspectos de este anuncio conviene retener, porque explican todo lo que vino después. No había instrumento legal detrás: ni ley, ni reglamento, ni orden que obligara a nadie a nada. Y la fecha de diciembre de 2024 no se cumplió.</p>"
        "<p>Aun así, el reloj que puso en marcha sigue siendo el mejor marco para todo el programa. Tres años desde febrero de 2024 llevan a principios de 2027, que es aproximadamente donde se sitúa hoy la ley aprobada.</p>"),
 "de": ("🇧🇼 BURS bekennt sich zur elektronischen Abrechnung und startet eine Dreijahresuhr",
        "BURS kündigte E-Billing als Dreijahresprojekt an, dessen erste Phase im Dezember 2024 abgeschlossen sein sollte. Eine Rechtsgrundlage gab es nicht, und dieser erste Termin wurde nicht gehalten.",
        "<h3>🇧🇼 BURS bekennt sich zur elektronischen Abrechnung und startet eine Dreijahresuhr</h3>"
        "<p>Der Botswana Unified Revenue Service kündigte ein Programm zur elektronischen Abrechnung an, angelegt als Dreijahresprojekt, dessen erste Phase im Dezember 2024 abgeschlossen sein sollte. Erklärtes Ziel war es, Lecks zu schließen und Einnahmen zu maximieren — die Sprache, die jede Steuerverwaltung verwendet, wenn sie zu Sichtbarkeit auf Transaktionsebene übergeht.</p>"
        "<p>Zwei Punkte dieser Ankündigung sind es wert, im Gedächtnis zu bleiben, denn sie erklären alles Weitere. Es gab keine Rechtsgrundlage: kein Gesetz, keine Verordnung, keine Anordnung, die irgendjemanden zu irgendetwas verpflichtet hätte. Und der Termin Dezember 2024 wurde nicht gehalten.</p>"
        "<p>Die gestartete Uhr bleibt dennoch der brauchbarste Rahmen für das gesamte Programm. Drei Jahre ab Februar 2024 führen in das frühe Jahr 2027 — ungefähr dorthin, wo das beschlossene Gesetz heute steht.</p>"),
 "fr": ("🇧🇼 BURS s'engage sur la facturation électronique et lance un compte à rebours de trois ans",
        "BURS a annoncé la facturation électronique comme un projet sur trois ans, première phase attendue en décembre 2024. Aucune législation ne la soutenait, et cette première échéance n'a pas été tenue.",
        "<h3>🇧🇼 BURS s'engage sur la facturation électronique et lance un compte à rebours de trois ans</h3>"
        "<p>Le Botswana Unified Revenue Service a annoncé un programme de facturation électronique, présenté comme un projet sur trois ans dont la première phase devait s'achever en décembre 2024. L'objectif affiché était de colmater les fuites et de maximiser les recettes — le vocabulaire qu'emploie toute administration fiscale qui passe à une visibilité transaction par transaction.</p>"
        "<p>Deux éléments de cette annonce méritent d'être retenus, car ils expliquent tout ce qui a suivi. Aucun instrument juridique ne la portait : ni loi, ni règlement, ni arrêté obligeant qui que ce soit. Et l'échéance de décembre 2024 n'a pas été tenue.</p>"
        "<p>Le compte à rebours qu'elle a lancé reste néanmoins le meilleur cadre de lecture du programme. Trois ans à compter de février 2024 mènent au début de 2027, soit à peu près là où se situe aujourd'hui la loi adoptée.</p>"),
 },
},
{
 "id": "2026-02-09-botswana-budget-anticipates-april-rollout",
 "date": "2026-02-09",
 "source_url": "https://www.bankofbotswana.bw/sites/default/files/publications/2026%20Budget%20Speech.pdf",
 "t": {
 "en": ("🇧🇼 The Budget Speech anticipates an April rollout, and names real-time monitoring",
        "Paragraph 114 of the 2026 Budget Speech said the rollout of electronic invoicing was anticipated in April 2026 and would enable real-time transaction monitoring. It did not happen — but the description of the model still stands.",
        "<h3>🇧🇼 The Budget Speech anticipates an April rollout, and names real-time monitoring</h3>"
        "<p>Botswana's 2026 Budget Speech, delivered to the National Assembly in February, addressed electronic invoicing directly. Paragraph 114: the rollout was anticipated in April 2026, and would enable real-time transaction monitoring, strengthen compliance, reduce leakages and enhance revenue assurance.</p>"
        "<p>April 2026 came and went without a rollout. What survives is the description of the model, and it is the most authoritative one available: <em>real time</em>, in the government's own words, rather than a periodic return. For anyone scoping what compliance will eventually cost, the difference between real-time transmission and monthly reporting is most of the work.</p>"
        "<p>The speech also noted that the forthcoming Act would mandate electronic invoicing. That Act did not exist yet, and its absence is why this date, like the one before it, moved.</p>"),
 "es": ("🇧🇼 El Presupuesto prevé un despliegue en abril y habla de seguimiento en tiempo real",
        "El párrafo 114 del Presupuesto 2026 decía que el despliegue de la facturación electrónica se preveía en abril de 2026 y permitiría el seguimiento de operaciones en tiempo real. No ocurrió, pero la descripción del modelo sigue en pie.",
        "<h3>🇧🇼 El Presupuesto prevé un despliegue en abril y habla de seguimiento en tiempo real</h3>"
        "<p>El discurso del Presupuesto 2026 de Botsuana, pronunciado ante la Asamblea Nacional en febrero, abordó directamente la facturación electrónica. Párrafo 114: el despliegue se preveía en abril de 2026 y permitiría el seguimiento de operaciones en tiempo real, reforzar el cumplimiento, reducir las fugas y mejorar el aseguramiento de los ingresos.</p>"
        "<p>Abril de 2026 pasó sin despliegue. Lo que permanece es la descripción del modelo, y es la más autorizada disponible: <em>tiempo real</em>, en palabras del propio Gobierno, y no una declaración periódica. Para quien dimensione lo que acabará costando el cumplimiento, la diferencia entre transmisión en tiempo real y declaración mensual es casi todo el trabajo.</p>"
        "<p>El discurso señalaba además que la ley venidera impondría la facturación electrónica. Esa ley todavía no existía, y su ausencia es la razón de que esta fecha, como la anterior, se moviera.</p>"),
 "de": ("🇧🇼 Die Haushaltsrede erwartet einen Rollout im April und nennt Echtzeitüberwachung",
        "Absatz 114 der Haushaltsrede 2026 erwartete den Rollout der elektronischen Rechnungsstellung im April 2026 und eine Echtzeitüberwachung von Transaktionen. Er kam nicht — die Beschreibung des Modells gilt weiter.",
        "<h3>🇧🇼 Die Haushaltsrede erwartet einen Rollout im April und nennt Echtzeitüberwachung</h3>"
        "<p>Botsuanas Haushaltsrede 2026, im Februar vor der Nationalversammlung gehalten, ging direkt auf die elektronische Rechnungsstellung ein. Absatz 114: Der Rollout werde im April 2026 erwartet und werde eine Echtzeitüberwachung von Transaktionen ermöglichen, die Befolgung stärken, Lecks verringern und die Einnahmensicherung verbessern.</p>"
        "<p>Der April 2026 verging ohne Rollout. Was bleibt, ist die Beschreibung des Modells, und sie ist die belastbarste verfügbare: <em>Echtzeit</em>, in den Worten der Regierung selbst, und nicht eine periodische Meldung. Wer abschätzt, was die Befolgung am Ende kostet, findet zwischen Echtzeitübermittlung und Monatsmeldung den größten Teil der Arbeit.</p>"
        "<p>Die Rede hielt außerdem fest, das kommende Gesetz werde die elektronische Rechnungsstellung vorschreiben. Dieses Gesetz existierte noch nicht, und sein Fehlen ist der Grund, weshalb auch dieses Datum verrutschte.</p>"),
 "fr": ("🇧🇼 Le budget anticipe un déploiement en avril et parle de suivi en temps réel",
        "Le paragraphe 114 du budget 2026 indiquait que le déploiement de la facturation électronique était attendu en avril 2026 et permettrait un suivi des transactions en temps réel. Il n'a pas eu lieu, mais la description du modèle tient toujours.",
        "<h3>🇧🇼 Le budget anticipe un déploiement en avril et parle de suivi en temps réel</h3>"
        "<p>Le discours du budget 2026 du Botswana, prononcé devant l'Assemblée nationale en février, traitait directement de la facturation électronique. Paragraphe 114 : le déploiement était attendu en avril 2026 et permettrait un suivi des transactions en temps réel, renforcerait le civisme fiscal, réduirait les fuites et améliorerait la sécurisation des recettes.</p>"
        "<p>Avril 2026 est passé sans déploiement. Ce qui subsiste, c'est la description du modèle, et c'est la plus autorisée dont on dispose : <em>temps réel</em>, selon les mots du gouvernement lui-même, et non une déclaration périodique. Pour qui évalue le coût futur de la conformité, l'écart entre transmission en temps réel et déclaration mensuelle représente l'essentiel du travail.</p>"
        "<p>Le discours relevait aussi que la loi à venir imposerait la facturation électronique. Cette loi n'existait pas encore, et son absence explique que cette date, comme la précédente, ait bougé.</p>"),
 },
},
{
 "id": "2026-07-01-botswana-tax-administration-act-defers-again",
 "date": "2026-07-01",
 "source_url": "https://www.mondaq.com/southafrica/sales-taxes-vat-gst/1818540/africa-tax-in-brief-14-july-2026",
 "t": {
 "en": ("🇧🇼 The law finally arrives — and moves the date to roughly April 2027",
        "The Tax Administration Act 2026 was gazetted on 30 June and took effect on 1 July, creating the electronic-billing duty in section 15. It also defers that duty nine months, to approximately April 2027.",
        "<h3>🇧🇼 The law finally arrives — and moves the date to roughly April 2027</h3>"
        "<p>Botswana's Tax Administration Act, 2026 (Act 14 of 2026) was gazetted on 30 June 2026 and came into effect on 1 July, alongside a new Income Tax Act, a new VAT Act and a Customs amendment. Section 15 creates the obligation everyone has been waiting for: a taxpayer supplying goods or services must issue an electronic invoice using an electronic billing system.</p>"
        "<p>And then it defers it. The Act provides that the electronic billing system commences nine months from the Act's own commencement — approximately 1 April 2027. That is a formula rather than a printed calendar date, and no Ministerial Order fixing a day has been gazetted, so treat April 2027 as the shape of the thing rather than a deadline you can plan a go-live against.</p>"
        "<p>One part is already in force and worth acting on now: record retention is harmonised at eight years across VAT and income tax from 1 July 2026, and records must be kept in Botswana. Non-resident remote-services suppliers get five years, and small businesses under the simplified regime three.</p>"),
 "es": ("🇧🇼 La ley llega por fin, y mueve la fecha a aproximadamente abril de 2027",
        "La Ley de Administración Tributaria de 2026 se publicó el 30 de junio y entró en vigor el 1 de julio, creando en su artículo 15 la obligación de facturación electrónica. También la aplaza nueve meses, hasta aproximadamente abril de 2027.",
        "<h3>🇧🇼 La ley llega por fin, y mueve la fecha a aproximadamente abril de 2027</h3>"
        "<p>La Ley de Administración Tributaria de Botsuana de 2026 (Ley 14 de 2026) se publicó el 30 de junio de 2026 y entró en vigor el 1 de julio, junto a una nueva Ley del Impuesto sobre la Renta, una nueva Ley del IVA y una modificación aduanera. Su artículo 15 crea la obligación que todos esperaban: quien entregue bienes o preste servicios deberá emitir una factura electrónica mediante un sistema de facturación electrónica.</p>"
        "<p>Y acto seguido la aplaza. La ley dispone que el sistema de facturación electrónica comience nueve meses después de la entrada en vigor de la propia ley, es decir, hacia el 1 de abril de 2027. Se trata de una fórmula, no de una fecha impresa, y no se ha publicado orden ministerial que fije un día, de modo que conviene tomar abril de 2027 como una referencia y no como un plazo sobre el que planificar una puesta en marcha.</p>"
        "<p>Una parte ya está en vigor y merece atención inmediata: la conservación de registros se unifica en ocho años para IVA y renta desde el 1 de julio de 2026, y los registros deben guardarse en Botsuana. Los proveedores no residentes de servicios remotos disponen de cinco años, y las pequeñas empresas del régimen simplificado, de tres.</p>"),
 "de": ("🇧🇼 Das Gesetz kommt endlich — und verschiebt das Datum auf etwa April 2027",
        "Das Steuerverwaltungsgesetz 2026 wurde am 30. Juni verkündet und trat am 1. Juli in Kraft; § 15 begründet die E-Billing-Pflicht. Zugleich schiebt es sie um neun Monate auf, auf etwa April 2027.",
        "<h3>🇧🇼 Das Gesetz kommt endlich — und verschiebt das Datum auf etwa April 2027</h3>"
        "<p>Botsuanas Steuerverwaltungsgesetz 2026 (Gesetz 14 von 2026) wurde am 30. Juni 2026 verkündet und trat am 1. Juli in Kraft, zusammen mit einem neuen Einkommensteuergesetz, einem neuen Umsatzsteuergesetz und einer Zolländerung. § 15 begründet die lang erwartete Pflicht: Wer Waren liefert oder Leistungen erbringt, muss eine elektronische Rechnung über ein E-Billing-System ausstellen.</p>"
        "<p>Und dann schiebt es sie auf. Das Gesetz sieht vor, dass das E-Billing-System neun Monate nach dem Inkrafttreten des Gesetzes selbst startet — etwa am 1. April 2027. Das ist eine Formel und kein gedrucktes Datum, und eine Ministeranordnung mit konkretem Tag wurde nicht verkündet. April 2027 beschreibt daher die Größenordnung, nicht eine Frist, auf die sich ein Go-live planen ließe.</p>"
        "<p>Ein Teil gilt bereits und verdient jetzt Aufmerksamkeit: Die Aufbewahrung ist seit dem 1. Juli 2026 für Umsatz- und Einkommensteuer auf acht Jahre vereinheitlicht, und die Unterlagen müssen in Botsuana liegen. Für gebietsfremde Anbieter von Fernleistungen gelten fünf Jahre, für Kleinunternehmen im vereinfachten Regime drei.</p>"),
 "fr": ("🇧🇼 La loi arrive enfin — et repousse la date à environ avril 2027",
        "La loi de 2026 sur l'administration fiscale a été publiée le 30 juin et est entrée en vigueur le 1er juillet ; son article 15 crée l'obligation de facturation électronique. Elle la reporte aussi de neuf mois, à environ avril 2027.",
        "<h3>🇧🇼 La loi arrive enfin — et repousse la date à environ avril 2027</h3>"
        "<p>La loi de 2026 sur l'administration fiscale du Botswana (loi 14 de 2026) a été publiée au journal officiel le 30 juin 2026 et est entrée en vigueur le 1er juillet, aux côtés d'une nouvelle loi sur l'impôt sur le revenu, d'une nouvelle loi TVA et d'une modification douanière. Son article 15 crée l'obligation attendue : celui qui livre des biens ou rend des services doit émettre une facture électronique au moyen d'un système de facturation électronique.</p>"
        "<p>Puis elle la reporte. La loi prévoit que le système de facturation électronique démarre neuf mois après l'entrée en vigueur de la loi elle-même, soit environ le 1er avril 2027. C'est une formule et non une date imprimée, et aucun arrêté ministériel fixant un jour n'a été publié : avril 2027 donne donc l'ordre de grandeur, pas une échéance sur laquelle caler une mise en service.</p>"
        "<p>Une partie est déjà en vigueur et mérite d'être traitée dès maintenant : la conservation est harmonisée à huit ans pour la TVA et l'impôt sur le revenu depuis le 1er juillet 2026, et les documents doivent être conservés au Botswana. Les fournisseurs non résidents de services à distance disposent de cinq ans, et les petites entreprises du régime simplifié de trois.</p>"),
 },
},
{
 "id": "2026-08-27-botswana-the-march-2026-date-that-never-was",
 "date": "2026-08-27",
 "source_url": "https://dailynews.gov.bw/news-detail/90913",
 "t": {
 "en": ("🇧🇼 The March 2026 mandate that never was — and why you can still read about it",
        "Compliance pages across the industry still say Botswana's e-invoicing became mandatory in March 2026. It did not. The enabling law postdates the date by three months, and five months on there is no notice, no device list and no enforcement.",
        "<h3>🇧🇼 The March 2026 mandate that never was — and why you can still read about it</h3>"
        "<p>Search for Botswana e-invoicing and you will find a confident, widely repeated sentence: mandatory for all VAT-registered businesses from March 2026, following completion of a three-year pilot. It is worth explaining carefully, because it is wrong in a way that is easy to miss and expensive to act on.</p>"
        "<p>The date is real, but it was never a mandate date. The 2025/26 Budget Speech said the electronic VAT invoicing solution would be implemented by March 2026 — <em>subject to supporting legislation</em>. That was a target for the revenue authority to finish building its own system, and it was conditional. Both qualifiers were dropped as the sentence was copied from one compliance page to the next through 2025.</p>"
        "<p>The decisive fact is chronological. The supporting legislation did not exist in March 2026. Botswana's own government news service reported on 8 April 2026 that the Tax Administration Bill was still before Parliament, introducing definitions for new concepts including the electronic billing system. The Act was gazetted on 30 June 2026 — three months after the mandate had supposedly begun — and it defers the billing system a further nine months.</p>"
        "<p>The corroborating evidence is what is absent. Five months after the supposed go-live there is no BURS public notice, no accredited-device list, no taxpayer guidance, no penalties and no reporting of any business complying. That silence is telling rather than merely inconclusive: BURS published detailed implementation timelines in May 2026 for VAT on non-resident remote services, so the machinery for announcing a live obligation exists and was used one month earlier, for something else.</p>"
        "<p>The three-year pilot has drifted too. BURS announced a three-year project in February 2024; national press reported in January 2025 that a pilot had been running three years and would end by March — March <em>2025</em>. Two different Marches were fused into one sentence.</p>"
        "<p>What to do with this: treat the obligation as legislated, unstarted, and expected around April 2027, and watch for the commencement Order rather than for a date. If your own compliance calendar carries March 2026 for Botswana, it came from a page that has not been revised since July 2025.</p>"),
 "es": ("🇧🇼 El mandato de marzo de 2026 que nunca existió, y por qué aún se lee sobre él",
        "Páginas de cumplimiento de todo el sector siguen diciendo que la facturación electrónica de Botsuana pasó a ser obligatoria en marzo de 2026. No fue así. La ley habilitante es tres meses posterior a esa fecha y, cinco meses después, no hay aviso, ni lista de equipos, ni sanciones.",
        "<h3>🇧🇼 El mandato de marzo de 2026 que nunca existió, y por qué aún se lee sobre él</h3>"
        "<p>Busque facturación electrónica en Botsuana y encontrará una frase rotunda y repetida: obligatoria para todas las empresas inscritas en el IVA desde marzo de 2026, tras concluir un piloto de tres años. Conviene explicarla con cuidado, porque es errónea de un modo fácil de pasar por alto y caro de seguir.</p>"
        "<p>La fecha existe, pero nunca fue una fecha de obligación. El Presupuesto 2025/26 dijo que la solución de facturación electrónica del IVA se implantaría para marzo de 2026, <em>supeditada a la legislación de apoyo</em>. Era un objetivo para que la administración terminara de construir su sistema, y era condicional. Ambos matices se perdieron mientras la frase se copiaba de una página de cumplimiento a otra a lo largo de 2025.</p>"
        "<p>El hecho decisivo es cronológico. La legislación de apoyo no existía en marzo de 2026. El propio servicio de noticias del Gobierno informó el 8 de abril de 2026 de que el proyecto de Ley de Administración Tributaria seguía en el Parlamento, introduciendo definiciones de conceptos nuevos, entre ellos el sistema de facturación electrónica. La ley se publicó el 30 de junio de 2026 —tres meses después del supuesto inicio— y aplaza el sistema otros nueve meses.</p>"
        "<p>La prueba de refuerzo es lo que falta. Cinco meses después del supuesto arranque no hay aviso público de BURS, ni lista de equipos homologados, ni orientación al contribuyente, ni sanciones, ni noticia alguna de empresas cumpliendo. Ese silencio es significativo y no meramente inconcluyente: BURS publicó en mayo de 2026 calendarios detallados para el IVA de los servicios remotos no residentes, de modo que la maquinaria para anunciar una obligación viva existe y se usó un mes antes, para otra cosa.</p>"
        "<p>El piloto de tres años también se ha desdibujado. BURS anunció un proyecto a tres años en febrero de 2024; la prensa nacional informó en enero de 2025 de que un piloto llevaba tres años en marcha y terminaría en marzo: marzo de <em>2025</em>. Dos marzos distintos se fundieron en una sola frase.</p>"
        "<p>Qué hacer con esto: tratar la obligación como legislada, no iniciada y prevista hacia abril de 2027, y vigilar la orden de entrada en vigor en lugar de una fecha. Si su calendario de cumplimiento tiene marzo de 2026 para Botsuana, procede de una página que no se revisa desde julio de 2025.</p>"),
 "de": ("🇧🇼 Das März-2026-Mandat, das es nie gab — und warum man weiter davon liest",
        "Compliance-Seiten der ganzen Branche schreiben weiterhin, Botsuanas elektronische Rechnungsstellung sei im März 2026 verpflichtend geworden. Wurde sie nicht. Das ermächtigende Gesetz liegt drei Monate nach diesem Datum, und fünf Monate später gibt es keine Mitteilung, keine Geräteliste, keine Durchsetzung.",
        "<h3>🇧🇼 Das März-2026-Mandat, das es nie gab — und warum man weiter davon liest</h3>"
        "<p>Wer nach elektronischer Rechnungsstellung in Botsuana sucht, findet einen selbstbewussten, vielfach wiederholten Satz: verpflichtend für alle umsatzsteuerlich registrierten Unternehmen ab März 2026, nach Abschluss eines dreijährigen Pilotprojekts. Er verdient eine sorgfältige Erklärung, denn er ist auf eine leicht zu übersehende und teuer zu befolgende Weise falsch.</p>"
        "<p>Das Datum ist echt, war aber nie ein Pflichtdatum. Die Haushaltsrede 2025/26 sagte, die elektronische Umsatzsteuer-Rechnungslösung werde bis März 2026 umgesetzt — <em>vorbehaltlich der unterstützenden Gesetzgebung</em>. Das war ein Ziel für die Behörde, ihr eigenes System fertigzustellen, und es stand unter Vorbehalt. Beide Einschränkungen gingen verloren, während der Satz 2025 von einer Compliance-Seite zur nächsten kopiert wurde.</p>"
        "<p>Entscheidend ist die Chronologie. Die unterstützende Gesetzgebung existierte im März 2026 nicht. Der staatliche Nachrichtendienst berichtete am 8. April 2026, der Entwurf des Steuerverwaltungsgesetzes liege noch im Parlament und führe Definitionen neuer Begriffe ein, darunter das E-Billing-System. Das Gesetz wurde am 30. Juni 2026 verkündet — drei Monate nach dem angeblichen Beginn — und schiebt das System um weitere neun Monate auf.</p>"
        "<p>Der erhärtende Beleg ist das Fehlende. Fünf Monate nach dem angeblichen Start gibt es keine öffentliche BURS-Mitteilung, keine Liste zugelassener Geräte, keine Hinweise für Steuerpflichtige, keine Sanktionen und keinen Bericht über ein Unternehmen, das die Pflicht erfüllt. Dieses Schweigen ist aussagekräftig und nicht bloß unergiebig: BURS veröffentlichte im Mai 2026 detaillierte Umsetzungspläne für die Umsatzsteuer auf gebietsfremde Fernleistungen. Der Apparat zur Ankündigung einer lebenden Pflicht existiert also und wurde einen Monat zuvor benutzt, für etwas anderes.</p>"
        "<p>Auch der dreijährige Pilot ist verrutscht. BURS kündigte im Februar 2024 ein Dreijahresprojekt an; die Landespresse berichtete im Januar 2025, ein Pilot laufe seit drei Jahren und ende bis März — März <em>2025</em>. Zwei verschiedene Märze wurden zu einem Satz verschmolzen.</p>"
        "<p>Was daraus folgt: Behandeln Sie die Pflicht als beschlossen, nicht begonnen und um April 2027 erwartet, und achten Sie auf die Inkrafttretensanordnung statt auf ein Datum. Trägt Ihr eigener Compliance-Kalender für Botsuana den März 2026, stammt er von einer Seite, die seit Juli 2025 nicht überarbeitet wurde.</p>"),
 "fr": ("🇧🇼 Le mandat de mars 2026 qui n'a jamais existé — et pourquoi on en lit encore parler",
        "Des pages de conformité de tout le secteur affirment encore que la facturation électronique du Botswana est devenue obligatoire en mars 2026. Elle ne l'est pas. La loi habilitante est postérieure de trois mois à cette date et, cinq mois après, il n'y a ni avis, ni liste d'appareils, ni sanction.",
        "<h3>🇧🇼 Le mandat de mars 2026 qui n'a jamais existé — et pourquoi on en lit encore parler</h3>"
        "<p>Cherchez « facturation électronique Botswana » et vous trouverez une phrase assurée et très reprise : obligatoire pour toutes les entreprises assujetties à la TVA à partir de mars 2026, après l'achèvement d'un pilote de trois ans. Elle mérite une explication soignée, car elle est fausse d'une manière facile à manquer et coûteuse à suivre.</p>"
        "<p>La date existe, mais elle n'a jamais été une date d'obligation. Le budget 2025/26 indiquait que la solution de facturation électronique de TVA serait mise en œuvre d'ici mars 2026 — <em>sous réserve de la législation d'appui</em>. C'était un objectif pour que l'administration achève de construire son propre système, et il était conditionnel. Les deux réserves ont disparu à mesure que la phrase était recopiée d'une page de conformité à l'autre au cours de 2025.</p>"
        "<p>Le fait décisif est chronologique. La législation d'appui n'existait pas en mars 2026. Le service d'information du gouvernement botswanais rapportait le 8 avril 2026 que le projet de loi sur l'administration fiscale était encore au Parlement, introduisant des définitions de concepts nouveaux dont le système de facturation électronique. La loi a été publiée le 30 juin 2026 — trois mois après le prétendu démarrage — et repousse le système de neuf mois de plus.</p>"
        "<p>La preuve corroborante, c'est ce qui manque. Cinq mois après le prétendu démarrage, aucun avis public de BURS, aucune liste d'appareils agréés, aucune orientation aux contribuables, aucune sanction, aucun compte rendu d'entreprise s'y conformant. Ce silence est parlant et non simplement non concluant : BURS a publié en mai 2026 des calendriers de mise en œuvre détaillés pour la TVA sur les services à distance des non-résidents. La machinerie d'annonce d'une obligation vivante existe donc, et elle a servi un mois plus tôt, pour autre chose.</p>"
        "<p>Le pilote de trois ans a dérivé lui aussi. BURS a annoncé un projet triennal en février 2024 ; la presse nationale rapportait en janvier 2025 qu'un pilote durait depuis trois ans et s'achèverait d'ici mars — mars <em>2025</em>. Deux mars différents ont été fondus en une seule phrase.</p>"
        "<p>Ce qu'il faut en faire : considérer l'obligation comme légiférée, non démarrée, et attendue autour d'avril 2027, et guetter l'arrêté d'entrée en vigueur plutôt qu'une date. Si votre propre calendrier de conformité porte mars 2026 pour le Botswana, il vient d'une page non révisée depuis juillet 2025.</p>"),
 },
},
]

out = []
w = out.append
w("-- Botswana: a four-story arc on a mandate that kept moving.")
w("-- GENERATED by gen_botswana_stories.py -- edit the generator.")
w("--")
w("-- No body links back to this site: the archive renderer adds the")
w("-- deep-dive link itself, and a standing invariant fails the replay on")
w("-- any story body containing the site's own domain.")
w("")
for s in STORIES:
    en = s["t"]["en"]
    w(f"INSERT OR IGNORE INTO stories (id, date, month, summary_en, html_en, source_url, published)")
    w(f"VALUES ({lit(s['id'])}, {lit(s['date'])}, {lit(s['date'][:7])}, {lit(en[1])}, {lit(en[2])}, {lit(s['source_url'])}, 1);")
    w(f"INSERT OR IGNORE INTO story_countries (story_id, country_id) SELECT {lit(s['id'])}, id FROM countries WHERE code = 'BW';")
    for lang in LANGS:
        title, summary, html = s["t"][lang]
        w(f"INSERT OR IGNORE INTO story_translations (story_id, lang, title, summary, html)")
        w(f"VALUES ({lit(s['id'])}, '{lang}', {lit(title)}, {lit(summary)}, {lit(html)});")
    w("")

ids = ",".join(lit(s["id"]) for s in STORIES)
w("-- ---- what this migration claims it did ----")
w(f"-- ASSERT: SELECT count(*) FROM stories WHERE id IN ({ids}) = {len(STORIES)}")
w(f"-- ASSERT: SELECT count(*) FROM story_countries WHERE story_id IN ({ids}) = {len(STORIES)}")
for lang in LANGS:
    w(f"-- ASSERT: SELECT count(*) FROM story_translations WHERE lang = '{lang}' AND story_id IN ({ids}) = {len(STORIES)}")
w(f"-- ASSERT: SELECT count(*) FROM stories WHERE id IN ({ids}) AND (source_url IS NULL OR source_url = '') = 0")
w("-- The bodies must not carry a link back to this site (invariant in 650):")
w(f"-- ASSERT: SELECT count(*) FROM stories WHERE id IN ({ids}) AND html_en LIKE '%e-invoicingcompliancecorner.com%' = 0")

print("\n".join(out))
