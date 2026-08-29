-- The ROI whitepaper in German, Spanish and French.
--
-- REVERSING A DECISION, NOT CORRECTING AN OVERSIGHT. Migration 508
-- published this report English-only at Dan's explicit choice on
-- 12 August 2026, and recorded why: "this report's whole value is
-- precision about what a source does and does not say, and a
-- mistranslated hedge would destroy that faster than an untranslated
-- one." That reasoning was right and has not changed. What changed is
-- Dan's judgement of the trade, on 29 August, after a DE/FR/ES reader's
-- view of the Insights hub showed an English card in an otherwise
-- translated page: "the Resources -> Insights & Whitepapers does not
-- translate ... at surface / description level or drill into the
-- whitepaper." Asked whether to leave it, translate the card only, or
-- translate everything, he chose everything.
--
-- SO THE HEDGES WERE THE SPECIFICATION. The document's central claims
-- are negative -- no measured post-mandate AP study exists anywhere, ten
-- analyst houses have nothing that isolates e-invoicing, the figures
-- filling the gap do not survive being traced -- and each one is a
-- statement about the EVIDENCE, never about e-invoicing. "We found no
-- measured study" must not become "there are no savings"; "not publicly
-- available" must not become "unpublished"; "we could not retrieve the
-- primary document" must not become "the document does not exist". The
-- translators were briefed on that specifically and asked to prefer the
-- clumsy faithful rendering over the fluent lossy one, and the places
-- where they made that trade are listed in the commit message.
--
-- WHAT IS CHECKED MECHANICALLY, AND WHAT IS NOT. tools/whitepaper_i18n.py
-- takes the four documents apart and asserts that every figure, URL,
-- inline tag and source-type marker is identical across all four
-- editions -- the markup is never translated, only substituted, so the
-- four files have the same structure by construction. That caught a real
-- error: the Spanish had silently reclassified an Inter-American
-- Development Bank discussion paper from [study] to [official], in a
-- document whose entire subject is how sources are graded. Nobody would
-- have found that by reading.
--
-- It cannot check whether a hedge survived. That still needs a reader,
-- and the report says so.
--
-- doc_url per language is what the tracker's whitepaper pop-out uses:
-- since migration 450 a translated listing carries its own doc_url and
-- the pop-out uses it directly instead of probing for a "-es.html" that
-- may not exist. All three exist now.
--
-- FILES AND WORKER BOTH SHIP WITH THIS. The three static editions are
-- assets, and site-worker's sitemap and its file-per-language branch
-- both had to learn about them; applying this migration alone would
-- advertise three documents in four languages whose files are not there.

INSERT OR REPLACE INTO article_translations
  (article_slug, lang, title, dek, teaser_html, doc_url)
VALUES ('einvoicing-roi-evidence', 'de',
  'Was E-Invoicing tatsächlich einspart: Die veröffentlichte Evidenz für Käufer und Lieferanten',
  'Wir haben nach veröffentlichter, mit Quellen belegter Evidenz dafür gesucht, dass E-Invoicing Käufern und Lieferanten Geld spart. Auf der Käuferseite (AP) gibt es keine — nirgendwo, und auch die Analystenhäuser verfügen nicht darüber. Hier ist der Prüfpfad: 47 Quellen, bewertet von A bis D.',
  '<p>Länder betreiben verpflichtendes E-Invoicing seit Langem — Chile seit 2003, Brasilien seit 2008, Korea seit 2011, Mexiko flächendeckend seit 2014, Italien seit 2019. Zusammen haben sie Hunderte Milliarden Rechnungen verarbeitet. Was also wurde tatsächlich <em>veröffentlicht</em>, mit Quellen, darüber, was E-Invoicing den beteiligten Unternehmen eingespart hat — und zwar getrennt für Käufer, die Verbindlichkeiten verarbeiten, und Lieferanten, die Forderungen ausstellen?</p><p>Nahezu nichts. Nachdem wir jede Zahl, die wir in Lateinamerika, Europa, im asiatisch-pazifischen Raum, im Nahen Osten und in Afrika finden konnten, bis zu ihrem Ursprungsdokument zurückverfolgt haben, fanden wir <strong>keine gemessene Studie nach der Einführung zu AP-Rechnungsverarbeitungskosten, zur Durchlaufzeit von Rechnungseingang bis Freigabe, zu Ausnahmequoten oder zum Archivierungsaufwand, die einem E-Invoicing-Mandat zurechenbar wäre — in keiner Jurisdiktion und auf keinem Niveau methodischer Strenge</strong>. Auch keine schwache. Die Kategorie ist leer.</p><p>Auch die Analystenhäuser verfügen nicht darüber, und das hat uns überrascht. Forrester, Gartner, IDC, Hackett, Ardent Partners, Spend Matters und die Big Four haben genau die Quantifizierung solcher Effekte zum Geschäft — deshalb haben wir alle zehn geprüft. Es gibt sehr viel Forschung im Umfeld, teilweise von hoher Qualität, und <strong>nicht eine einzige Studie trennt den E-Invoicing-Austausch von der Kreditorenautomatisierung (AP), in die er eingebettet ist</strong>. Das gilt auch für die Forrester-Studie, die weithin als Beleg für den ROI von E-Invoicing zirkuliert und sich als Neuverpackung einer Steuerermittlungsstudie aus dem Jahr 2022 erweist, die das E-Invoicing-Modul ausdrücklich ausgeschlossen hat.</p><p>Was diese Lücke füllt, hält der Nachverfolgung nicht stand. Die australischen Zahlen zu den Kosten je Rechnung, die im asiatisch-pazifischen Raum durchgängig zitiert werden, sind eine <em>gemeinsame</em> Schätzung für Sender und Empfänger mit einer angenommenen 60/40-Aufteilung und stützen sich auf eine Beratungsstudie aus dem Jahr 2016, die nicht öffentlich zugänglich ist — und Deloittes eigene aktuelle E-Invoicing-Seite gibt diese Zahlen wieder, schreibt sie dabei jedoch einer anderen Stelle zu. Die von der European Commission angegebenen Einsparungen je Rechnung sind eine Bewertung von Arbeitszeit zu einem angenommenen Stundenlohn, und zwar für die &ldquo;Automatisierung des Rechnungsstellungsprozesses&rdquo;. Ihre größere Zahl je Zyklus ist in einem formellen Bericht an das European Parliament mit einer Fußnote auf einen Technik-Nachrichtenartikel über eine Studie aus dem Jahr 2013 belegt. Die vielzitierte Einsparungsbehauptung Dänemarks existiert in drei miteinander unvereinbaren, nicht mit Quellen belegten Versionen, in der falschen Währung.</p><p>Die Forschung zur Steuer-Compliance ist demgegenüber wirklich ausgezeichnet — peer-reviewed, kausal und konsistent über Peru, Italien, Ruanda, Argentinien, Ecuador, Uruguay und Mexiko hinweg. Sie misst die Einnahmen des Staates und nicht die Kosten eines Unternehmens, und dieser Unterschied ist wesentlich: Die eigene Folgenabschätzung der European Commission zu ViDA verortet &euro;335.6bn ihres modellierten Nutzens von &euro;371.9bn in der Mehrwertsteuererhebung und &euro;5.6bn — 1.5% — im E-Invoicing selbst.</p><p>Dieser Bericht ist der Prüfpfad. Jede Zahl wird bis zu ihrem Ursprung zurückverfolgt, von A bis D bewertet, und wo sie der Rückverfolgung nicht standhält, sagen wir es. Er endet dort, wohin die Evidenz weist: Messen Sie Ihre eigene Ausgangsbasis, bevor Sie beginnen, denn die einzigen belastbaren Zahlen zu den Kosten je Rechnung in Ihrem Business Case sind Ihre eigenen.</p>',
  '/whitepaper-einvoicing-roi-evidence-de.html');

INSERT OR REPLACE INTO article_translations
  (article_slug, lang, title, dek, teaser_html, doc_url)
VALUES ('einvoicing-roi-evidence', 'es',
  'Lo que la facturación electrónica ahorra realmente: la evidencia publicada para compradores y proveedores',
  'Salimos a buscar evidencia publicada y con fuentes de que la facturación electrónica ahorra dinero a compradores y proveedores. En el lado comprador (AP) no la hay — en ninguna parte, y las casas de analistas tampoco la tienen. Esta es la traza de auditoría, 47 fuentes calificadas de A a D.',
  '<p>Hay países que llevan mucho tiempo aplicando la facturación electrónica obligatoria — Chile desde 2003, Brasil desde 2008, Corea desde 2011, México de forma universal desde 2014, Italia desde 2019. Entre todos ellos han procesado cientos de miles de millones de facturas. Así pues, ¿qué se ha <em>publicado</em> realmente, con fuentes, sobre lo que la facturación electrónica ahorró a las empresas implicadas — por separado, para los compradores que procesan cuentas por pagar y para los proveedores que emiten cuentas por cobrar?</p><p>Casi nada. Tras rastrear hasta su documento de origen todas las cifras que pudimos encontrar en América Latina, Europa, Asia-Pacífico, Oriente Medio y África, no encontramos <strong>ningún estudio medido y posterior a la implantación sobre el coste de procesamiento de facturas en AP, el tiempo de ciclo desde la recepción hasta la aprobación, las tasas de excepción o el esfuerzo de archivo atribuible a un mandato de facturación electrónica — en ninguna jurisdicción y con ningún nivel de rigor</strong>. Ni siquiera uno débil. La categoría está vacía.</p><p>Las casas de analistas tampoco la tienen, y eso nos sorprendió. Forrester, Gartner, IDC, Hackett, Ardent Partners, Spend Matters y las Big Four se dedican precisamente a cuantificar esto — así que revisamos las diez. Existe una gran cantidad de investigación en ese terreno, parte de ella muy buena, y <strong>ni un solo estudio aísla el intercambio de facturación electrónica de la automatización de cuentas por pagar en la que está inserto</strong>. Eso incluye el estudio de Forrester ampliamente difundido como prueba del ROI de la facturación electrónica, que resulta ser el reempaquetado de un estudio de determinación fiscal de 2022 que excluía explícitamente el módulo de facturación electrónica.</p><p>Lo que llena ese vacío no sobrevive al rastreo. Las cifras australianas de coste por factura citadas en toda Asia-Pacífico son una estimación <em>conjunta</em> de emisor y receptor con un reparto supuesto de 60/40, apoyada en un estudio de consultoría de 2016 que no está disponible públicamente — y la propia página actual de facturación electrónica de Deloitte reproduce esas cifras atribuyéndolas a un tercero. El ahorro por factura de la Comisión Europea es una valoración del tiempo de trabajo a un salario por hora supuesto, correspondiente a &ldquo;automatizar el proceso de facturación&rdquo;. Su cifra mayor, la de ahorro por ciclo, remite en nota al pie, dentro de un informe formal al Parlamento Europeo, a un artículo de prensa tecnológica sobre un estudio de 2013. La muy citada afirmación de ahorro de Dinamarca existe en tres versiones mutuamente incompatibles y sin fuente, y en la moneda equivocada.</p><p>La investigación sobre cumplimiento tributario, en cambio, es realmente excelente — revisada por pares, causal y coherente en Perú, Italia, Ruanda, Argentina, Ecuador, Uruguay y México. Mide los ingresos del Estado y no los costes de una empresa, y la diferencia importa: la propia evaluación de impacto de la Comisión Europea para ViDA sitúa &euro;335.6bn de su beneficio modelizado de &euro;371.9bn en la recaudación del IVA, y &euro;5.6bn — un 1.5% — en la facturación electrónica en sí.</p><p>Este informe es la traza de auditoría. Cada cifra se rastrea hasta su origen, se califica de A a D y, allí donde no sobrevive al rastreo, lo indicamos. Termina donde apunta la evidencia: mida su propia línea de base antes de empezar, porque las únicas cifras de coste por factura defendibles en su caso de negocio son las suyas.</p>',
  '/whitepaper-einvoicing-roi-evidence-es.html');

INSERT OR REPLACE INTO article_translations
  (article_slug, lang, title, dek, teaser_html, doc_url)
VALUES ('einvoicing-roi-evidence', 'fr',
  'Ce que la facturation électronique fait réellement économiser : les preuves publiées pour les acheteurs et les fournisseurs',
  'Nous avons cherché des preuves publiées et sourcées que la facturation électronique fait économiser de l''argent aux acheteurs et aux fournisseurs. Du côté acheteur, il n''en existe aucune — nulle part, et les cabinets d''analystes n''en disposent pas davantage. Voici la piste d''audit : 47 sources notées de A à D.',
  '<p>Des pays appliquent la facturation électronique obligatoire depuis longtemps — le Chili depuis 2003, le Brésil depuis 2008, la Corée depuis 2011, le Mexique de manière universelle depuis 2014, l''Italie depuis 2019. À eux tous, ils ont traité des centaines de milliards de factures. Qu''a-t-on donc réellement <em>publié</em>, sources à l''appui, sur ce que la facturation électronique a fait économiser aux entreprises concernées — séparément, pour les acheteurs traitant leurs comptes fournisseurs et pour les fournisseurs émettant leurs créances clients ?</p><p>Presque rien. Après avoir remonté jusqu''à son document d''origine chaque chiffre que nous avons pu trouver en Amérique latine, en Europe, en Asie-Pacifique, au Moyen-Orient et en Afrique, nous n''avons trouvé <strong>aucune étude mesurée, postérieure à la mise en œuvre, portant sur le coût de traitement des factures en AP, le délai entre réception et approbation, les taux d''exceptions ou l''effort d''archivage imputables à un mandat de facturation électronique — dans aucune juridiction, à aucun niveau de rigueur</strong>. Pas même une étude peu rigoureuse. La catégorie est vide.</p><p>Les cabinets d''analystes n''en disposent pas davantage, et cela nous a surpris. Forrester, Gartner, IDC, Hackett, Ardent Partners, Spend Matters et les Big Four ont précisément pour métier de quantifier ce type d''effets — nous les avons donc tous les dix examinés. Il existe quantité de travaux dans les domaines voisins, dont certains d''excellente qualité, et <strong>aucune étude n''isole l''échange de factures électroniques de l''automatisation des comptes fournisseurs dans laquelle il s''inscrit</strong>. Cela vaut aussi pour l''étude Forrester largement diffusée comme preuve du ROI de la facturation électronique, qui se révèle être la reformulation d''une étude de 2022 sur la détermination fiscale, laquelle excluait explicitement le module de facturation électronique.</p><p>Ce qui comble ce vide ne résiste pas à la remontée aux sources. Les chiffres australiens de coût par facture, cités dans toute l''Asie-Pacifique, sont une estimation <em>commune</em> à l''émetteur et au destinataire, assortie d''une répartition supposée de 60/40, et reposent sur une étude de cabinet de conseil de 2016 qui n''est pas accessible au public — et la page actuelle de Deloitte consacrée à la facturation électronique reprend ces chiffres tout en les attribuant à un tiers. Les économies par facture avancées par la Commission européenne sont une valorisation du temps de travail à un taux horaire supposé, pour &ldquo;automatiser le processus de facturation&rdquo;. Son chiffre plus élevé, par cycle, est renvoyé en note de bas de page, dans un rapport officiel au Parlement européen, à un article de presse technologique portant sur une étude de 2013. L''affirmation danoise très citée en matière d''économies existe en trois versions mutuellement incompatibles et dépourvues de source, dans une devise erronée.</p><p>Les travaux sur la conformité fiscale, en revanche, sont véritablement excellents — évalués par les pairs, causaux et cohérents entre le Pérou, l''Italie, le Rwanda, l''Argentine, l''Équateur, l''Uruguay et le Mexique. Ils mesurent les recettes de l''État plutôt que les coûts d''une entreprise, et la différence compte : dans sa propre analyse d''impact relative à ViDA, la Commission européenne situe &euro;335.6bn de ses &euro;371.9bn de bénéfices modélisés dans la collecte de la TVA, et &euro;5.6bn — 1.5% — dans la facturation électronique elle-même.</p><p>Ce rapport constitue la piste d''audit. Chaque chiffre y est remonté jusqu''à son origine et noté de A à D, et lorsqu''il ne résiste pas à cette remontée, nous le disons. Il se conclut là où mènent les preuves : mesurez votre propre référence de départ avant de commencer, car les seuls coûts par facture défendables dans votre dossier d''investissement sont les vôtres.</p>',
  '/whitepaper-einvoicing-roi-evidence-fr.html');

-- ---- what this migration claims it did ----
-- Three editions, and the English row untouched.
-- ASSERT: SELECT count(*) FROM article_translations WHERE article_slug = 'einvoicing-roi-evidence' = 3
--
-- Each one points at its own file, not at the English one. This is the
-- field the pop-out actually opens, and the failure it prevents is a
-- Spanish card that opens an English document.
-- ASSERT: SELECT count(*) FROM article_translations WHERE article_slug = 'einvoicing-roi-evidence' AND doc_url = '/whitepaper-einvoicing-roi-evidence-' || lang || '.html' = 3
--
-- And the teasers are real translations rather than copies of the
-- English, which is what a half-finished run of this would leave behind.
-- ASSERT: SELECT count(*) FROM article_translations t JOIN articles a ON a.slug = t.article_slug WHERE t.article_slug = 'einvoicing-roi-evidence' AND t.teaser_html = a.teaser_html = 0
--
-- STANDING: no translated article may point at another language's file.
-- Written against the whole table rather than this article, because the
-- next whitepaper to be translated will inherit the same trap -- and
-- stated as a count of violations so it stays true at any table size.
-- ASSERT ALWAYS: SELECT COUNT(*) FROM article_translations WHERE doc_url IS NOT NULL AND doc_url NOT LIKE '%-' || lang || '.html' = 0
