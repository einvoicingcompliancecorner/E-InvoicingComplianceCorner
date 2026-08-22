-- ================================================================
-- The methodology page says out loud what the data already does.
-- ================================================================
--
-- Dan, 22 August 2026: "Our strategy around grading sources, and our
-- stance on obligation status is probably something we need to document
-- for the user to see."
--
-- 30 strings x 4 languages for /methodology. Two of them carry live
-- counts rather than written numbers -- how many headline facts are
-- recorded as not confirmed, and how many jurisdictions are covered --
-- because a page about rigour that prints a stale figure of its own is
-- an argument against itself. The renderer queries them.
--
-- ---- WHAT IT DELIBERATELY DOES NOT CLAIM ----------------------------
--
-- Not that every country claim carries a graded source. It does not:
-- source_tier is not a column, so whether a given citation is a statute
-- or a professional tracker is not recorded in any form we could show a
-- reader. The page says that in gap.p1 rather than implying otherwise,
-- because opening a page about evidence standards with a promise the
-- database cannot keep would be the worst possible first paragraph.
--
-- The A-D grading that IS real and reader-facing belongs to the ROI
-- planner's benchmarks, and ev.p1 attributes it there rather than to the
-- country data.
--
-- ---- WHY method.* SITS INSIDE tracker -------------------------------
--
-- Same reason guides.* does: generate_files.py rebuilds `tracker` into
-- i18n/<lang>.json, which is the file the route reads through
-- authStrings(). A new namespace would need a new file, a new fetch and
-- a new failure mode.
--
-- It is in D1 at all -- rather than in a SOURCES_UI-style object in
-- site-worker, which is what the two neighbouring public pages do --
-- because those objects are invisible to the language runbook. A fifth
-- language would translate every D1 namespace, pass every test, and
-- leave /sources and /insights in English. ADDING-A-LANGUAGE.md
-- documents that trap for the country names; widening it the same week
-- would have been careless.

-- ---- the strings ----------------------------------------------------
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.ev.h', 'en', 'Graded evidence, where we have it');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.ev.h', 'de', 'Bewertete Belege, wo vorhanden');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.ev.h', 'fr', 'Preuves notées, là où nous en avons');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.ev.h', 'es', 'Evidencia calificada, donde la tenemos');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.ev.p1', 'en', 'The ROI planner grades every benchmark it uses from A to D and shows the grade beside the number, because the published evidence for e-invoicing savings is much weaker than the figures in circulation suggest. Our own review of 47 sources found no measured post-mandate study of accounts-payable cost anywhere in the world.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.ev.p1', 'de', 'Der ROI-Planer bewertet jeden verwendeten Benchmark von A bis D und zeigt die Note neben der Zahl, denn die veröffentlichte Evidenz für Einsparungen durch E-Rechnungen ist weit schwächer, als die kursierenden Zahlen nahelegen. Unsere Prüfung von 47 Quellen fand weltweit keine gemessene Studie zu Kreditorenkosten nach Einführung einer Pflicht.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.ev.p1', 'fr', 'Le planificateur de ROI note de A à D chaque référence qu''il utilise et affiche la note à côté du chiffre, car les preuves publiées sur les économies liées à la facturation électronique sont bien plus faibles que ne le laissent croire les chiffres en circulation. Notre examen de 47 sources n''a trouvé, nulle part au monde, aucune étude mesurée du coût des comptes fournisseurs après l''entrée en vigueur d''une obligation.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.ev.p1', 'es', 'El planificador de ROI califica de A a D cada referencia que utiliza y muestra la nota junto a la cifra, porque la evidencia publicada sobre los ahorros de la factura electrónica es mucho más débil de lo que sugieren las cifras en circulación. Nuestra revisión de 47 fuentes no encontró en ningún lugar del mundo un estudio medido del coste de cuentas por pagar tras la entrada en vigor de una obligación.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.eyebrow', 'en', 'How we decide');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.eyebrow', 'de', 'Wie wir entscheiden');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.eyebrow', 'fr', 'Comment nous décidons');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.eyebrow', 'es', 'Cómo decidimos');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.fix.cta', 'en', 'Send a correction');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.fix.cta', 'de', 'Korrektur senden');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.fix.cta', 'fr', 'Envoyer une correction');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.fix.cta', 'es', 'Enviar una corrección');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.fix.h', 'en', 'Tell us when we are wrong');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.fix.h', 'de', 'Sagen Sie uns, wenn wir falsch liegen');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.fix.h', 'fr', 'Signalez-nous nos erreurs');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.fix.h', 'es', 'Díganos cuándo nos equivocamos');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.fix.p1', 'en', 'Mandates move and we get things wrong. If a fact on this site does not match what you are being told locally, we would rather hear it than not — a correction with a source attached is the most useful thing anyone sends us.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.fix.p1', 'de', 'Pflichten verschieben sich, und wir liegen mitunter falsch. Wenn eine Angabe auf dieser Website nicht dem entspricht, was Ihnen vor Ort gesagt wird, hören wir davon lieber als nicht — eine Korrektur mit Quellenangabe ist das Nützlichste, was uns jemand schickt.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.fix.p1', 'fr', 'Les obligations évoluent et il nous arrive de nous tromper. Si un fait présenté ici ne correspond pas à ce qu''on vous dit localement, nous préférons le savoir — une correction accompagnée d''une source est ce que l''on peut nous envoyer de plus utile.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.fix.p1', 'es', 'Los mandatos cambian y a veces nos equivocamos. Si un dato de este sitio no coincide con lo que le dicen localmente, preferimos saberlo — una corrección con su fuente es lo más útil que alguien puede enviarnos.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.gap.h', 'en', 'What we do not do yet');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.gap.h', 'de', 'Was wir noch nicht tun');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.gap.h', 'fr', 'Ce que nous ne faisons pas encore');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.gap.h', 'es', 'Qué no hacemos todavía');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.gap.p1', 'en', 'We do not publish a grade against each country claim. Every claim carries its source and the date it was checked, but whether that source is a statute or a professional tracker is not yet recorded in a form we can show you. Until it is, this page is the honest description of the standard we apply rather than a per-fact guarantee that it was met.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.gap.p1', 'de', 'Wir veröffentlichen keine Note zu jeder Länderaussage. Jede Aussage trägt ihre Quelle und das Prüfdatum, doch ob diese Quelle ein Gesetz oder ein Fachtracker ist, wird noch nicht in einer für Sie darstellbaren Form erfasst. Bis dahin ist diese Seite die ehrliche Beschreibung des von uns angelegten Maßstabs und keine Garantie pro Einzelfakt.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.gap.p1', 'fr', 'Nous ne publions pas de note pour chaque affirmation pays. Chaque affirmation porte sa source et la date de vérification, mais le fait que cette source soit un texte de loi ou un tracker professionnel n''est pas encore consigné sous une forme que nous puissions vous montrer. D''ici là, cette page est la description honnête de la norme que nous appliquons, non une garantie fait par fait.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.gap.p1', 'es', 'No publicamos una calificación para cada afirmación por país. Cada afirmación lleva su fuente y la fecha de comprobación, pero si esa fuente es una ley o un rastreador profesional aún no se registra de forma que podamos mostrárselo. Hasta entonces, esta página es la descripción honesta del criterio que aplicamos, no una garantía dato por dato.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.gap.p2', 'en', 'We also cannot yet show you what a fact used to say. Corrections are made in a versioned migration history, so nothing is lost, but that history is not readable from these pages.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.gap.p2', 'de', 'Ebenso können wir Ihnen noch nicht zeigen, was ein Sachverhalt früher aussagte. Korrekturen erfolgen in einer versionierten Migrationshistorie, es geht also nichts verloren, doch diese Historie ist von diesen Seiten aus nicht lesbar.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.gap.p2', 'fr', 'Nous ne pouvons pas non plus vous montrer ce qu''un fait indiquait auparavant. Les corrections sont faites dans un historique de migrations versionné, rien n''est donc perdu, mais cet historique n''est pas consultable depuis ces pages.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.gap.p2', 'es', 'Tampoco podemos mostrarle todavía qué decía antes un dato. Las correcciones se hacen en un historial de migraciones versionado, así que nada se pierde, pero ese historial no puede leerse desde estas páginas.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.intro', 'en', 'This tracker makes claims that businesses act on. This page sets out what we require of a source, what our status words mean, where we are deliberately stricter than other trackers, and what we do not yet do.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.intro', 'de', 'Dieser Tracker trifft Aussagen, nach denen Unternehmen handeln. Diese Seite legt dar, was wir von einer Quelle verlangen, was unsere Statusangaben bedeuten, wo wir bewusst strenger sind als andere Tracker und was wir noch nicht leisten.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.intro', 'fr', 'Ce tracker formule des affirmations sur lesquelles des entreprises s''appuient. Cette page expose ce que nous exigeons d''une source, ce que signifient nos statuts, les points sur lesquels nous sommes délibérément plus stricts que d''autres trackers, et ce que nous ne faisons pas encore.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.intro', 'es', 'Este rastreador hace afirmaciones sobre las que las empresas actúan. Esta página expone qué exigimos a una fuente, qué significan nuestros estados, en qué somos deliberadamente más estrictos que otros rastreadores y qué todavía no hacemos.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.h', 'en', 'A status describes the duty to issue');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.h', 'de', 'Ein Status beschreibt die Pflicht zum Ausstellen');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.h', 'fr', 'Un statut décrit l''obligation d''émettre');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.h', 'es', 'Un estado describe la obligación de emitir');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.p1', 'en', 'This is the single rule that most often makes us disagree with other trackers. Being obliged to receive an e-invoice is not the same as being obliged to send one, and only the second changes what a business has to build.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.p1', 'de', 'Das ist die eine Regel, die uns am häufigsten von anderen Trackern abweichen lässt. Verpflichtet zu sein, eine E-Rechnung zu empfangen, ist nicht dasselbe wie verpflichtet zu sein, eine auszustellen — und nur Letzteres ändert, was ein Unternehmen aufbauen muss.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.p1', 'fr', 'C''est la règle qui nous fait le plus souvent diverger des autres trackers. Être tenu de recevoir une facture électronique n''équivaut pas à être tenu d''en émettre une, et seul le second cas change ce qu''une entreprise doit mettre en place.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.p1', 'es', 'Es la regla que con más frecuencia nos hace discrepar de otros rastreadores. Estar obligado a recibir una factura electrónica no es lo mismo que estar obligado a emitirla, y solo lo segundo cambia lo que una empresa debe construir.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.p2', 'en', 'So where public bodies must accept e-invoices but suppliers may still send paper, we record no mandate and say why underneath. Ireland, Cyprus, Malta and the United Kingdom are all read this way. Where suppliers to government must issue electronically — Germany, Denmark, Sweden — we record an active mandate.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.p2', 'de', 'Wo also öffentliche Stellen E-Rechnungen annehmen müssen, Lieferanten aber weiter Papier senden dürfen, erfassen wir keine Pflicht und begründen es darunter. Irland, Zypern, Malta und das Vereinigte Königreich werden so gelesen. Wo Lieferanten der öffentlichen Hand elektronisch ausstellen müssen — Deutschland, Dänemark, Schweden — erfassen wir eine aktive Pflicht.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.p2', 'fr', 'Ainsi, lorsque les organismes publics doivent accepter les factures électroniques mais que les fournisseurs peuvent encore envoyer du papier, nous indiquons aucune obligation et l''expliquons en dessous. L''Irlande, Chypre, Malte et le Royaume-Uni sont lus ainsi. Lorsque les fournisseurs du secteur public doivent émettre par voie électronique — Allemagne, Danemark, Suède — nous indiquons une obligation en vigueur.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.p2', 'es', 'Así, cuando los organismos públicos deben aceptar facturas electrónicas pero los proveedores aún pueden enviar papel, registramos sin obligación y lo explicamos debajo. Irlanda, Chipre, Malta y el Reino Unido se leen así. Cuando los proveedores del sector público deben emitir electrónicamente — Alemania, Dinamarca, Suecia — registramos una obligación en vigor.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.p3', 'en', 'The duty to receive is never dropped. It is stated in the line under the status, because a business that can only receive still has something to prepare for.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.p3', 'de', 'Die Empfangspflicht entfällt nie. Sie steht in der Zeile unter dem Status, denn auch ein Unternehmen, das nur empfangen muss, hat etwas vorzubereiten.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.p3', 'fr', 'L''obligation de réception n''est jamais omise. Elle figure dans la ligne sous le statut, car une entreprise qui doit seulement recevoir a malgré tout quelque chose à préparer.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.iss.p3', 'es', 'La obligación de recibir nunca se omite. Se indica en la línea bajo el estado, porque una empresa que solo debe recibir también tiene algo que preparar.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.link.sources', 'en', 'The sources we monitor');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.link.sources', 'de', 'Die von uns überwachten Quellen');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.link.sources', 'fr', 'Les sources que nous surveillons');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.link.sources', 'es', 'Las fuentes que supervisamos');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.h', 'en', 'What counts as a source');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.h', 'de', 'Was als Quelle gilt');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.h', 'fr', 'Ce qui compte comme source');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.h', 'es', 'Qué cuenta como fuente');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.p1', 'en', 'A citation has to substantiate the specific claim it is attached to, not the general topic. A country''s tax-authority homepage is not a source for a date, a threshold or a penalty; the notice, resolution or statute that sets them is.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.p1', 'de', 'Ein Beleg muss die konkrete Aussage stützen, an der er hängt, nicht das allgemeine Thema. Die Startseite einer Steuerbehörde ist keine Quelle für ein Datum, eine Schwelle oder eine Sanktion; die Bekanntmachung, Verordnung oder das Gesetz, die sie festlegen, ist es.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.p1', 'fr', 'Une citation doit étayer l''affirmation précise à laquelle elle est rattachée, et non le sujet en général. La page d''accueil d''une administration fiscale n''est pas une source pour une date, un seuil ou une sanction ; l''avis, la résolution ou le texte qui les fixent l''est.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.p1', 'es', 'Una cita debe sustentar la afirmación concreta a la que se adjunta, no el tema en general. La página de inicio de una autoridad fiscal no es fuente de una fecha, un umbral o una sanción; lo es el aviso, la resolución o la ley que los establecen.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.p2', 'en', 'We prefer the government or authority text over anyone''s summary of it. Where the only reachable source is a professional tracker or an advisory firm, the claim still carries that source rather than a better-looking one, and we treat it as weaker evidence.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.p2', 'de', 'Wir bevorzugen den Behörden- oder Gesetzestext gegenüber jeder Zusammenfassung davon. Ist die einzig erreichbare Quelle ein Fachtracker oder eine Beratungsgesellschaft, trägt die Aussage weiterhin diese Quelle statt einer besser aussehenden, und wir behandeln sie als schwächeren Beleg.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.p2', 'fr', 'Nous privilégions le texte officiel ou réglementaire sur tout résumé qui en est fait. Lorsque la seule source accessible est un tracker professionnel ou un cabinet de conseil, l''affirmation conserve cette source plutôt qu''une plus flatteuse, et nous la traitons comme une preuve plus faible.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.p2', 'es', 'Preferimos el texto oficial o normativo antes que cualquier resumen de él. Cuando la única fuente accesible es un rastreador profesional o una firma asesora, la afirmación conserva esa fuente en lugar de otra de mejor apariencia, y la tratamos como evidencia más débil.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.p3', 'en', 'This standard was written after auditing our own citations and finding that most did not meet it. 121 milestone sources and 99 story sources were corrected as a result.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.p3', 'de', 'Dieser Maßstab entstand, nachdem wir unsere eigenen Belege geprüft und festgestellt hatten, dass die meisten ihm nicht genügten. 121 Meilenstein-Quellen und 99 Beitragsquellen wurden daraufhin korrigiert.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.p3', 'fr', 'Cette exigence a été écrite après avoir audité nos propres citations et constaté que la plupart ne la respectaient pas. 121 sources de jalons et 99 sources d''articles ont été corrigées en conséquence.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.src.p3', 'es', 'Este criterio se escribió tras auditar nuestras propias citas y comprobar que la mayoría no lo cumplía. Se corrigieron 121 fuentes de hitos y 99 fuentes de artículos.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.active', 'en', 'In force now for the segment named.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.active', 'de', 'Derzeit in Kraft für das genannte Segment.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.active', 'fr', 'En vigueur pour le segment indiqué.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.active', 'es', 'En vigor para el segmento indicado.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.h', 'en', 'What a status means');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.h', 'de', 'Was ein Status bedeutet');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.h', 'fr', 'Ce que signifie un statut');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.h', 'es', 'Qué significa un estado');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.lead', 'en', 'Every jurisdiction we track carries the same five facts: the e-invoicing obligation for business-to-government, business-to-business and business-to-consumer transactions, the archiving period, and whether a digital signature is required.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.lead', 'de', 'Jede von uns erfasste Rechtsordnung trägt dieselben fünf Angaben: die E-Rechnungspflicht für Geschäfte mit der öffentlichen Hand, zwischen Unternehmen und gegenüber Verbrauchern, die Aufbewahrungsfrist und ob eine digitale Signatur erforderlich ist.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.lead', 'fr', 'Chaque juridiction que nous suivons porte les mêmes cinq éléments : l''obligation de facturation électronique pour les transactions avec le secteur public, entre entreprises et vers les consommateurs, la durée d''archivage, et l''exigence ou non d''une signature numérique.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.lead', 'es', 'Cada jurisdicción que seguimos lleva los mismos cinco datos: la obligación de factura electrónica en operaciones con el sector público, entre empresas y con consumidores, el período de archivo, y si se exige firma digital.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.none', 'en', 'No obligation and no operating voluntary scheme.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.none', 'de', 'Keine Pflicht und kein betriebenes freiwilliges System.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.none', 'fr', 'Aucune obligation et aucun dispositif facultatif en service.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.none', 'es', 'Sin obligación y sin régimen voluntario operativo.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.planned', 'en', 'Enacted and dated, not yet in force. We do not use it without a date.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.planned', 'de', 'Verabschiedet und datiert, noch nicht in Kraft. Ohne Datum verwenden wir ihn nicht.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.planned', 'fr', 'Adopté et daté, pas encore en vigueur. Nous ne l''utilisons pas sans date.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.planned', 'es', 'Aprobado y con fecha, aún no en vigor. No lo usamos sin fecha.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.unknown', 'en', 'Researched and unconfirmable, or not yet researched. Never a guess.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.unknown', 'de', 'Recherchiert und nicht bestätigbar oder noch nicht recherchiert. Nie geraten.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.unknown', 'fr', 'Recherché sans confirmation possible, ou pas encore recherché. Jamais une supposition.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.unknown', 'es', 'Investigado sin poder confirmarse, o aún no investigado. Nunca una suposición.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.voluntary', 'en', 'A real, operating, optional scheme — not merely the absence of a ban.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.voluntary', 'de', 'Ein tatsächlich betriebenes, freiwilliges System — nicht bloß das Fehlen eines Verbots.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.voluntary', 'fr', 'Un dispositif réel, en service et facultatif — pas simplement l''absence d''interdiction.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.st.voluntary', 'es', 'Un régimen real, operativo y opcional — no la mera ausencia de prohibición.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.strict.h', 'en', 'Where we are deliberately stricter');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.strict.h', 'de', 'Wo wir bewusst strenger sind');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.strict.h', 'fr', 'Où nous sommes délibérément plus stricts');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.strict.h', 'es', 'Dónde somos deliberadamente más estrictos');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.strict.p1', 'en', 'A draft bill is not a plan. We record a scheduled mandate only where an instrument has been adopted and a date set — so a country with a proposal before its parliament reads as having no mandate here and as "planned" on some other trackers.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.strict.p1', 'de', 'Ein Gesetzentwurf ist kein Plan. Wir erfassen eine terminierte Pflicht nur dort, wo ein Rechtsakt verabschiedet und ein Datum festgelegt wurde — ein Land mit einem Vorschlag im Parlament erscheint hier daher ohne Pflicht und auf manchen anderen Trackern als „geplant".');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.strict.p1', 'fr', 'Un projet de loi n''est pas un calendrier. Nous n''indiquons une obligation programmée que lorsqu''un texte a été adopté et une date fixée — un pays dont le parlement examine une proposition apparaît donc ici sans obligation, et « prévu » sur certains autres trackers.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.strict.p1', 'es', 'Un proyecto de ley no es un plan. Registramos una obligación programada solo cuando se ha aprobado un instrumento y fijado una fecha — por eso un país con una propuesta en su parlamento figura aquí sin obligación y como «previsto» en algunos otros rastreadores.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.strict.p2', 'en', 'The effect is that we sometimes publish a less exciting answer than the market does. That is the point. A compliance sheet that overstates an obligation costs a reader budget and attention they did not need to spend.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.strict.p2', 'de', 'Das führt dazu, dass wir mitunter eine weniger aufregende Antwort veröffentlichen als der Markt. Genau darum geht es. Ein Compliance-Blatt, das eine Pflicht überzeichnet, kostet Leser Budget und Aufmerksamkeit, die sie nicht hätten aufwenden müssen.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.strict.p2', 'fr', 'Il en résulte que nous publions parfois une réponse moins spectaculaire que le marché. C''est précisément l''objectif. Une fiche de conformité qui exagère une obligation coûte au lecteur un budget et une attention qu''il n''avait pas à dépenser.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.strict.p2', 'es', 'El efecto es que a veces publicamos una respuesta menos llamativa que el mercado. Esa es la idea. Una ficha de cumplimiento que exagera una obligación cuesta al lector presupuesto y atención que no necesitaba gastar.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.title', 'en', 'Methodology');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.title', 'de', 'Methodik');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.title', 'fr', 'Méthodologie');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.title', 'es', 'Metodología');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.unk.count', 'en', 'Right now {0} of the {1} headline facts we publish are recorded as not confirmed.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.unk.count', 'de', 'Derzeit sind {0} der {1} von uns veröffentlichten Kennzahlen als nicht bestätigt erfasst.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.unk.count', 'fr', 'Actuellement, {0} des {1} faits clés que nous publions sont enregistrés comme non confirmés.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.unk.count', 'es', 'Actualmente, {0} de los {1} datos principales que publicamos están registrados como no confirmados.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.unk.h', 'en', '"Not confirmed" is an answer');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.unk.h', 'de', '„Nicht bestätigt" ist eine Antwort');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.unk.h', 'fr', '« Non confirmé » est une réponse');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.unk.h', 'es', '«No confirmado» es una respuesta');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.unk.p1', 'en', 'Where we could not confirm a fact, we say so and record why. We do not leave it blank and we do not infer it, because a blank reads as "no requirement" — a different claim, and the one that gets somebody fined.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.unk.p1', 'de', 'Konnten wir einen Sachverhalt nicht bestätigen, sagen wir das und halten fest, warum. Wir lassen ihn nicht leer und leiten ihn nicht ab, denn eine Leerstelle liest sich als „keine Pflicht" — eine andere Aussage, und diejenige, die zu einem Bußgeld führt.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.unk.p1', 'fr', 'Lorsque nous n''avons pas pu confirmer un fait, nous le disons et consignons pourquoi. Nous ne laissons pas de vide et nous ne le déduisons pas, car un vide se lit comme « aucune obligation » — une affirmation différente, et celle qui vaut une amende.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.unk.p1', 'es', 'Cuando no hemos podido confirmar un dato, lo decimos y registramos por qué. No lo dejamos en blanco ni lo inferimos, porque un blanco se lee como «sin obligación»: una afirmación distinta, y la que acaba en multa.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.verified', 'en', 'Covering {0} jurisdictions. Last fact-check recorded {1}.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.verified', 'de', 'Umfasst {0} Rechtsordnungen. Letzte erfasste Faktenprüfung {1}.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.verified', 'fr', 'Couvre {0} juridictions. Dernière vérification enregistrée le {1}.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'method.verified', 'es', 'Cubre {0} jurisdicciones. Última comprobación registrada el {1}.');

-- ---- and the way in ------------------------------------------------
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'menu.methodology', 'en', 'Methodology');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'menu.methodology', 'de', 'Methodik');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'menu.methodology', 'fr', 'Méthodologie');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'menu.methodology', 'es', 'Metodología');

-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'method.%' = 136
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'menu.methodology' = 4
--
-- FOUR LANGUAGES OR NONE, per key -- the same invariant 609 declares for
-- the guides, restated for this namespace because the count above would
-- also be satisfied by 34 English strings and nothing else.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT key FROM translations WHERE namespace = 'tracker' AND key LIKE 'method.%' GROUP BY key HAVING count(DISTINCT lang) != 4) = 0

