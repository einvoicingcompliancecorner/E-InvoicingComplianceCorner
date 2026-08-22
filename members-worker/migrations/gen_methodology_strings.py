"""Generate the `method` translation namespace — the /methodology page.

Dan, 22 August 2026: "Our strategy around grading sources, and our stance
on obligation status is probably something we need to document for the
user to see."

Written as a generator for the same reason gen_guides_strings.py is: the
English is stated once, the four languages sit beside it, and a dropped
placeholder or a missing language is visible while editing rather than
after deploying.

IN D1, NOT IN A CODE CONSTANT, and that is a deliberate break from the
two neighbouring pages. /sources and /insights keep their four-language
chrome in SOURCES_UI and INSIGHTS_UI objects inside site-worker. Those
predate the language runbook and are not listed in it, so a fifth
language would translate every D1 namespace, pass every test, and leave
two pages in English. ADDING-A-LANGUAGE.md documents exactly that trap
for country names (Phase 3) and it would be careless to widen it the same
week. `method.*` sits inside `tracker` like `guides.*`, so
generate_files.py rebuilds it into i18n/<lang>.json and the
four-languages-or-none invariant covers it.

Run:  python3 migrations/gen_methodology_strings.py
Writes: migrations/612_methodology_strings.sql, and patches i18n/*.json.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
I18N = os.path.join(REPO, "i18n")

LANGS = ["en", "de", "fr", "es"]

S = {
    # ---- chrome ---------------------------------------------------------
    "eyebrow": {
        "en": "How we decide", "de": "Wie wir entscheiden",
        "fr": "Comment nous décidons", "es": "Cómo decidimos",
    },
    "title": {
        "en": "Methodology", "de": "Methodik",
        "fr": "Méthodologie", "es": "Metodología",
    },
    "intro": {
        "en": "This tracker makes claims that businesses act on. This page sets out what we require of a source, what our status words mean, where we are deliberately stricter than other trackers, and what we do not yet do.",
        "de": "Dieser Tracker trifft Aussagen, nach denen Unternehmen handeln. Diese Seite legt dar, was wir von einer Quelle verlangen, was unsere Statusangaben bedeuten, wo wir bewusst strenger sind als andere Tracker und was wir noch nicht leisten.",
        "fr": "Ce tracker formule des affirmations sur lesquelles des entreprises s'appuient. Cette page expose ce que nous exigeons d'une source, ce que signifient nos statuts, les points sur lesquels nous sommes délibérément plus stricts que d'autres trackers, et ce que nous ne faisons pas encore.",
        "es": "Este rastreador hace afirmaciones sobre las que las empresas actúan. Esta página expone qué exigimos a una fuente, qué significan nuestros estados, en qué somos deliberadamente más estrictos que otros rastreadores y qué todavía no hacemos.",
    },

    # ---- 1. sources -----------------------------------------------------
    "src.h": {
        "en": "What counts as a source", "de": "Was als Quelle gilt",
        "fr": "Ce qui compte comme source", "es": "Qué cuenta como fuente",
    },
    "src.p1": {
        "en": "A citation has to substantiate the specific claim it is attached to, not the general topic. A country's tax-authority homepage is not a source for a date, a threshold or a penalty; the notice, resolution or statute that sets them is.",
        "de": "Ein Beleg muss die konkrete Aussage stützen, an der er hängt, nicht das allgemeine Thema. Die Startseite einer Steuerbehörde ist keine Quelle für ein Datum, eine Schwelle oder eine Sanktion; die Bekanntmachung, Verordnung oder das Gesetz, die sie festlegen, ist es.",
        "fr": "Une citation doit étayer l'affirmation précise à laquelle elle est rattachée, et non le sujet en général. La page d'accueil d'une administration fiscale n'est pas une source pour une date, un seuil ou une sanction ; l'avis, la résolution ou le texte qui les fixent l'est.",
        "es": "Una cita debe sustentar la afirmación concreta a la que se adjunta, no el tema en general. La página de inicio de una autoridad fiscal no es fuente de una fecha, un umbral o una sanción; lo es el aviso, la resolución o la ley que los establecen.",
    },
    "src.p2": {
        "en": "We prefer the government or authority text over anyone's summary of it. Where the only reachable source is a professional tracker or an advisory firm, the claim still carries that source rather than a better-looking one, and we treat it as weaker evidence.",
        "de": "Wir bevorzugen den Behörden- oder Gesetzestext gegenüber jeder Zusammenfassung davon. Ist die einzig erreichbare Quelle ein Fachtracker oder eine Beratungsgesellschaft, trägt die Aussage weiterhin diese Quelle statt einer besser aussehenden, und wir behandeln sie als schwächeren Beleg.",
        "fr": "Nous privilégions le texte officiel ou réglementaire sur tout résumé qui en est fait. Lorsque la seule source accessible est un tracker professionnel ou un cabinet de conseil, l'affirmation conserve cette source plutôt qu'une plus flatteuse, et nous la traitons comme une preuve plus faible.",
        "es": "Preferimos el texto oficial o normativo antes que cualquier resumen de él. Cuando la única fuente accesible es un rastreador profesional o una firma asesora, la afirmación conserva esa fuente en lugar de otra de mejor apariencia, y la tratamos como evidencia más débil.",
    },
    "src.p3": {
        "en": "This standard was written after auditing our own citations and finding that most did not meet it. 121 milestone sources and 99 story sources were corrected as a result.",
        "de": "Dieser Maßstab entstand, nachdem wir unsere eigenen Belege geprüft und festgestellt hatten, dass die meisten ihm nicht genügten. 121 Meilenstein-Quellen und 99 Beitragsquellen wurden daraufhin korrigiert.",
        "fr": "Cette exigence a été écrite après avoir audité nos propres citations et constaté que la plupart ne la respectaient pas. 121 sources de jalons et 99 sources d'articles ont été corrigées en conséquence.",
        "es": "Este criterio se escribió tras auditar nuestras propias citas y comprobar que la mayoría no lo cumplía. Se corrigieron 121 fuentes de hitos y 99 fuentes de artículos.",
    },

    # ---- 2. unknown -----------------------------------------------------
    "unk.h": {
        "en": "\"Not confirmed\" is an answer", "de": "„Nicht bestätigt\" ist eine Antwort",
        "fr": "« Non confirmé » est une réponse", "es": "«No confirmado» es una respuesta",
    },
    "unk.p1": {
        "en": "Where we could not confirm a fact, we say so and record why. We do not leave it blank and we do not infer it, because a blank reads as \"no requirement\" — a different claim, and the one that gets somebody fined.",
        "de": "Konnten wir einen Sachverhalt nicht bestätigen, sagen wir das und halten fest, warum. Wir lassen ihn nicht leer und leiten ihn nicht ab, denn eine Leerstelle liest sich als „keine Pflicht\" — eine andere Aussage, und diejenige, die zu einem Bußgeld führt.",
        "fr": "Lorsque nous n'avons pas pu confirmer un fait, nous le disons et consignons pourquoi. Nous ne laissons pas de vide et nous ne le déduisons pas, car un vide se lit comme « aucune obligation » — une affirmation différente, et celle qui vaut une amende.",
        "es": "Cuando no hemos podido confirmar un dato, lo decimos y registramos por qué. No lo dejamos en blanco ni lo inferimos, porque un blanco se lee como «sin obligación»: una afirmación distinta, y la que acaba en multa.",
    },
    "unk.count": {
        "en": "Right now {0} of the {1} headline facts we publish are recorded as not confirmed.",
        "de": "Derzeit sind {0} der {1} von uns veröffentlichten Kennzahlen als nicht bestätigt erfasst.",
        "fr": "Actuellement, {0} des {1} faits clés que nous publions sont enregistrés comme non confirmés.",
        "es": "Actualmente, {0} de los {1} datos principales que publicamos están registrados como no confirmados.",
    },

    # ---- 3. what a status means ----------------------------------------
    "st.h": {
        "en": "What a status means", "de": "Was ein Status bedeutet",
        "fr": "Ce que signifie un statut", "es": "Qué significa un estado",
    },
    "st.lead": {
        "en": "Every jurisdiction we track carries the same five facts: the e-invoicing obligation for business-to-government, business-to-business and business-to-consumer transactions, the archiving period, and whether a digital signature is required.",
        "de": "Jede von uns erfasste Rechtsordnung trägt dieselben fünf Angaben: die E-Rechnungspflicht für Geschäfte mit der öffentlichen Hand, zwischen Unternehmen und gegenüber Verbrauchern, die Aufbewahrungsfrist und ob eine digitale Signatur erforderlich ist.",
        "fr": "Chaque juridiction que nous suivons porte les mêmes cinq éléments : l'obligation de facturation électronique pour les transactions avec le secteur public, entre entreprises et vers les consommateurs, la durée d'archivage, et l'exigence ou non d'une signature numérique.",
        "es": "Cada jurisdicción que seguimos lleva los mismos cinco datos: la obligación de factura electrónica en operaciones con el sector público, entre empresas y con consumidores, el período de archivo, y si se exige firma digital.",
    },
    "st.active": {
        "en": "In force now for the segment named.",
        "de": "Derzeit in Kraft für das genannte Segment.",
        "fr": "En vigueur pour le segment indiqué.",
        "es": "En vigor para el segmento indicado.",
    },
    "st.planned": {
        "en": "Enacted and dated, not yet in force. We do not use it without a date.",
        "de": "Verabschiedet und datiert, noch nicht in Kraft. Ohne Datum verwenden wir ihn nicht.",
        "fr": "Adopté et daté, pas encore en vigueur. Nous ne l'utilisons pas sans date.",
        "es": "Aprobado y con fecha, aún no en vigor. No lo usamos sin fecha.",
    },
    "st.voluntary": {
        "en": "A real, operating, optional scheme — not merely the absence of a ban.",
        "de": "Ein tatsächlich betriebenes, freiwilliges System — nicht bloß das Fehlen eines Verbots.",
        "fr": "Un dispositif réel, en service et facultatif — pas simplement l'absence d'interdiction.",
        "es": "Un régimen real, operativo y opcional — no la mera ausencia de prohibición.",
    },
    "st.none": {
        "en": "No obligation and no operating voluntary scheme.",
        "de": "Keine Pflicht und kein betriebenes freiwilliges System.",
        "fr": "Aucune obligation et aucun dispositif facultatif en service.",
        "es": "Sin obligación y sin régimen voluntario operativo.",
    },
    "st.unknown": {
        "en": "Researched and unconfirmable, or not yet researched. Never a guess.",
        "de": "Recherchiert und nicht bestätigbar oder noch nicht recherchiert. Nie geraten.",
        "fr": "Recherché sans confirmation possible, ou pas encore recherché. Jamais une supposition.",
        "es": "Investigado sin poder confirmarse, o aún no investigado. Nunca una suposición.",
    },

    # ---- 4. the issuing rule -------------------------------------------
    "iss.h": {
        "en": "A status describes the duty to issue",
        "de": "Ein Status beschreibt die Pflicht zum Ausstellen",
        "fr": "Un statut décrit l'obligation d'émettre",
        "es": "Un estado describe la obligación de emitir",
    },
    "iss.p1": {
        "en": "This is the single rule that most often makes us disagree with other trackers. Being obliged to receive an e-invoice is not the same as being obliged to send one, and only the second changes what a business has to build.",
        "de": "Das ist die eine Regel, die uns am häufigsten von anderen Trackern abweichen lässt. Verpflichtet zu sein, eine E-Rechnung zu empfangen, ist nicht dasselbe wie verpflichtet zu sein, eine auszustellen — und nur Letzteres ändert, was ein Unternehmen aufbauen muss.",
        "fr": "C'est la règle qui nous fait le plus souvent diverger des autres trackers. Être tenu de recevoir une facture électronique n'équivaut pas à être tenu d'en émettre une, et seul le second cas change ce qu'une entreprise doit mettre en place.",
        "es": "Es la regla que con más frecuencia nos hace discrepar de otros rastreadores. Estar obligado a recibir una factura electrónica no es lo mismo que estar obligado a emitirla, y solo lo segundo cambia lo que una empresa debe construir.",
    },
    "iss.p2": {
        "en": "So where public bodies must accept e-invoices but suppliers may still send paper, we record no mandate and say why underneath. Ireland, Cyprus, Malta and the United Kingdom are all read this way. Where suppliers to government must issue electronically — Germany, Denmark, Sweden — we record an active mandate.",
        "de": "Wo also öffentliche Stellen E-Rechnungen annehmen müssen, Lieferanten aber weiter Papier senden dürfen, erfassen wir keine Pflicht und begründen es darunter. Irland, Zypern, Malta und das Vereinigte Königreich werden so gelesen. Wo Lieferanten der öffentlichen Hand elektronisch ausstellen müssen — Deutschland, Dänemark, Schweden — erfassen wir eine aktive Pflicht.",
        "fr": "Ainsi, lorsque les organismes publics doivent accepter les factures électroniques mais que les fournisseurs peuvent encore envoyer du papier, nous indiquons aucune obligation et l'expliquons en dessous. L'Irlande, Chypre, Malte et le Royaume-Uni sont lus ainsi. Lorsque les fournisseurs du secteur public doivent émettre par voie électronique — Allemagne, Danemark, Suède — nous indiquons une obligation en vigueur.",
        "es": "Así, cuando los organismos públicos deben aceptar facturas electrónicas pero los proveedores aún pueden enviar papel, registramos sin obligación y lo explicamos debajo. Irlanda, Chipre, Malta y el Reino Unido se leen así. Cuando los proveedores del sector público deben emitir electrónicamente — Alemania, Dinamarca, Suecia — registramos una obligación en vigor.",
    },
    "iss.p3": {
        "en": "The duty to receive is never dropped. It is stated in the line under the status, because a business that can only receive still has something to prepare for.",
        "de": "Die Empfangspflicht entfällt nie. Sie steht in der Zeile unter dem Status, denn auch ein Unternehmen, das nur empfangen muss, hat etwas vorzubereiten.",
        "fr": "L'obligation de réception n'est jamais omise. Elle figure dans la ligne sous le statut, car une entreprise qui doit seulement recevoir a malgré tout quelque chose à préparer.",
        "es": "La obligación de recibir nunca se omite. Se indica en la línea bajo el estado, porque una empresa que solo debe recibir también tiene algo que preparar.",
    },

    # ---- 5. stricter ----------------------------------------------------
    "strict.h": {
        "en": "Where we are deliberately stricter",
        "de": "Wo wir bewusst strenger sind",
        "fr": "Où nous sommes délibérément plus stricts",
        "es": "Dónde somos deliberadamente más estrictos",
    },
    "strict.p1": {
        "en": "A draft bill is not a plan. We record a scheduled mandate only where an instrument has been adopted and a date set — so a country with a proposal before its parliament reads as having no mandate here and as \"planned\" on some other trackers.",
        "de": "Ein Gesetzentwurf ist kein Plan. Wir erfassen eine terminierte Pflicht nur dort, wo ein Rechtsakt verabschiedet und ein Datum festgelegt wurde — ein Land mit einem Vorschlag im Parlament erscheint hier daher ohne Pflicht und auf manchen anderen Trackern als „geplant\".",
        "fr": "Un projet de loi n'est pas un calendrier. Nous n'indiquons une obligation programmée que lorsqu'un texte a été adopté et une date fixée — un pays dont le parlement examine une proposition apparaît donc ici sans obligation, et « prévu » sur certains autres trackers.",
        "es": "Un proyecto de ley no es un plan. Registramos una obligación programada solo cuando se ha aprobado un instrumento y fijado una fecha — por eso un país con una propuesta en su parlamento figura aquí sin obligación y como «previsto» en algunos otros rastreadores.",
    },
    "strict.p2": {
        "en": "The effect is that we sometimes publish a less exciting answer than the market does. That is the point. A compliance sheet that overstates an obligation costs a reader budget and attention they did not need to spend.",
        "de": "Das führt dazu, dass wir mitunter eine weniger aufregende Antwort veröffentlichen als der Markt. Genau darum geht es. Ein Compliance-Blatt, das eine Pflicht überzeichnet, kostet Leser Budget und Aufmerksamkeit, die sie nicht hätten aufwenden müssen.",
        "fr": "Il en résulte que nous publions parfois une réponse moins spectaculaire que le marché. C'est précisément l'objectif. Une fiche de conformité qui exagère une obligation coûte au lecteur un budget et une attention qu'il n'avait pas à dépenser.",
        "es": "El efecto es que a veces publicamos una respuesta menos llamativa que el mercado. Esa es la idea. Una ficha de cumplimiento que exagera una obligación cuesta al lector presupuesto y atención que no necesitaba gastar.",
    },

    # ---- 6. evidence grades --------------------------------------------
    "ev.h": {
        "en": "Graded evidence, where we have it",
        "de": "Bewertete Belege, wo vorhanden",
        "fr": "Preuves notées, là où nous en avons",
        "es": "Evidencia calificada, donde la tenemos",
    },
    "ev.p1": {
        "en": "The ROI planner grades every benchmark it uses from A to D and shows the grade beside the number, because the published evidence for e-invoicing savings is much weaker than the figures in circulation suggest. Our own review of 47 sources found no measured post-mandate study of accounts-payable cost anywhere in the world.",
        "de": "Der ROI-Planer bewertet jeden verwendeten Benchmark von A bis D und zeigt die Note neben der Zahl, denn die veröffentlichte Evidenz für Einsparungen durch E-Rechnungen ist weit schwächer, als die kursierenden Zahlen nahelegen. Unsere Prüfung von 47 Quellen fand weltweit keine gemessene Studie zu Kreditorenkosten nach Einführung einer Pflicht.",
        "fr": "Le planificateur de ROI note de A à D chaque référence qu'il utilise et affiche la note à côté du chiffre, car les preuves publiées sur les économies liées à la facturation électronique sont bien plus faibles que ne le laissent croire les chiffres en circulation. Notre examen de 47 sources n'a trouvé, nulle part au monde, aucune étude mesurée du coût des comptes fournisseurs après l'entrée en vigueur d'une obligation.",
        "es": "El planificador de ROI califica de A a D cada referencia que utiliza y muestra la nota junto a la cifra, porque la evidencia publicada sobre los ahorros de la factura electrónica es mucho más débil de lo que sugieren las cifras en circulación. Nuestra revisión de 47 fuentes no encontró en ningún lugar del mundo un estudio medido del coste de cuentas por pagar tras la entrada en vigor de una obligación.",
    },

    # ---- 7. what we do not do ------------------------------------------
    "gap.h": {
        "en": "What we do not do yet", "de": "Was wir noch nicht tun",
        "fr": "Ce que nous ne faisons pas encore", "es": "Qué no hacemos todavía",
    },
    "gap.p1": {
        "en": "We do not publish a grade against each country claim. Every claim carries its source and the date it was checked, but whether that source is a statute or a professional tracker is not yet recorded in a form we can show you. Until it is, this page is the honest description of the standard we apply rather than a per-fact guarantee that it was met.",
        "de": "Wir veröffentlichen keine Note zu jeder Länderaussage. Jede Aussage trägt ihre Quelle und das Prüfdatum, doch ob diese Quelle ein Gesetz oder ein Fachtracker ist, wird noch nicht in einer für Sie darstellbaren Form erfasst. Bis dahin ist diese Seite die ehrliche Beschreibung des von uns angelegten Maßstabs und keine Garantie pro Einzelfakt.",
        "fr": "Nous ne publions pas de note pour chaque affirmation pays. Chaque affirmation porte sa source et la date de vérification, mais le fait que cette source soit un texte de loi ou un tracker professionnel n'est pas encore consigné sous une forme que nous puissions vous montrer. D'ici là, cette page est la description honnête de la norme que nous appliquons, non une garantie fait par fait.",
        "es": "No publicamos una calificación para cada afirmación por país. Cada afirmación lleva su fuente y la fecha de comprobación, pero si esa fuente es una ley o un rastreador profesional aún no se registra de forma que podamos mostrárselo. Hasta entonces, esta página es la descripción honesta del criterio que aplicamos, no una garantía dato por dato.",
    },
    "gap.p2": {
        "en": "We also cannot yet show you what a fact used to say. Corrections are made in a versioned migration history, so nothing is lost, but that history is not readable from these pages.",
        "de": "Ebenso können wir Ihnen noch nicht zeigen, was ein Sachverhalt früher aussagte. Korrekturen erfolgen in einer versionierten Migrationshistorie, es geht also nichts verloren, doch diese Historie ist von diesen Seiten aus nicht lesbar.",
        "fr": "Nous ne pouvons pas non plus vous montrer ce qu'un fait indiquait auparavant. Les corrections sont faites dans un historique de migrations versionné, rien n'est donc perdu, mais cet historique n'est pas consultable depuis ces pages.",
        "es": "Tampoco podemos mostrarle todavía qué decía antes un dato. Las correcciones se hacen en un historial de migraciones versionado, así que nada se pierde, pero ese historial no puede leerse desde estas páginas.",
    },

    # ---- 8. corrections -------------------------------------------------
    "fix.h": {
        "en": "Tell us when we are wrong", "de": "Sagen Sie uns, wenn wir falsch liegen",
        "fr": "Signalez-nous nos erreurs", "es": "Díganos cuándo nos equivocamos",
    },
    "fix.p1": {
        "en": "Mandates move and we get things wrong. If a fact on this site does not match what you are being told locally, we would rather hear it than not — a correction with a source attached is the most useful thing anyone sends us.",
        "de": "Pflichten verschieben sich, und wir liegen mitunter falsch. Wenn eine Angabe auf dieser Website nicht dem entspricht, was Ihnen vor Ort gesagt wird, hören wir davon lieber als nicht — eine Korrektur mit Quellenangabe ist das Nützlichste, was uns jemand schickt.",
        "fr": "Les obligations évoluent et il nous arrive de nous tromper. Si un fait présenté ici ne correspond pas à ce qu'on vous dit localement, nous préférons le savoir — une correction accompagnée d'une source est ce que l'on peut nous envoyer de plus utile.",
        "es": "Los mandatos cambian y a veces nos equivocamos. Si un dato de este sitio no coincide con lo que le dicen localmente, preferimos saberlo — una corrección con su fuente es lo más útil que alguien puede enviarnos.",
    },
    "fix.cta": {
        "en": "Send a correction", "de": "Korrektur senden",
        "fr": "Envoyer une correction", "es": "Enviar una corrección",
    },
    "link.sources": {
        "en": "The sources we monitor", "de": "Die von uns überwachten Quellen",
        "fr": "Les sources que nous surveillons", "es": "Las fuentes que supervisamos",
    },
    "verified": {
        "en": "Covering {0} jurisdictions. Last fact-check recorded {1}.",
        "de": "Umfasst {0} Rechtsordnungen. Letzte erfasste Faktenprüfung {1}.",
        "fr": "Couvre {0} juridictions. Dernière vérification enregistrée le {1}.",
        "es": "Cubre {0} jurisdicciones. Última comprobación registrada el {1}.",
    },
}

MENU = {
    "en": "Methodology", "de": "Methodik",
    "fr": "Méthodologie", "es": "Metodología",
}


def check():
    problems = []
    for key, langs in S.items():
        missing = [l for l in LANGS if l not in langs]
        if missing:
            problems.append(f"{key}: missing {', '.join(missing)}")
            continue
        want = {p for p in ("{0}", "{1}") if p in langs["en"]}
        for l in LANGS:
            got = {p for p in ("{0}", "{1}") if p in langs[l]}
            if got != want:
                problems.append(f"{key} [{l}]: placeholders {sorted(got)} != {sorted(want)}")
    if problems:
        raise SystemExit("REFUSING TO EMIT:\n  " + "\n  ".join(problems))


def q(v):
    return "'" + v.replace("'", "''") + "'"


HEADER = """-- ================================================================
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
-- would have been careless."""


def sql():
    lines = [HEADER, "\n-- ---- the strings ----------------------------------------------------"]
    for key in sorted(S):
        for lang in LANGS:
            lines.append(
                f"INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
                f"  VALUES ('tracker', {q('method.' + key)}, '{lang}', {q(S[key][lang])});")
    lines.append("\n-- ---- and the way in ------------------------------------------------")
    for lang in LANGS:
        lines.append(
            "INSERT OR REPLACE INTO translations (namespace, key, lang, value)\n"
            f"  VALUES ('tracker', 'menu.methodology', '{lang}', {q(MENU[lang])});")
    n = len(S) * len(LANGS)
    lines.append(f"""
-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'method.%' = {n}
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'menu.methodology' = {len(LANGS)}
--
-- FOUR LANGUAGES OR NONE, per key -- the same invariant 609 declares for
-- the guides, restated for this namespace because the count above would
-- also be satisfied by {len(S)} English strings and nothing else.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT key FROM translations WHERE namespace = 'tracker' AND key LIKE 'method.%' GROUP BY key HAVING count(DISTINCT lang) != 4) = 0
""")
    return "\n".join(lines) + "\n"


def patch_i18n():
    for lang in LANGS:
        path = os.path.join(I18N, f"{lang}.json")
        with open(path, encoding="utf-8") as fh:
            doc = json.load(fh)
        node_root = doc.get("method") or {}
        for key in sorted(S):
            node = node_root
            parts = key.split(".")
            for part in parts[:-1]:
                node = node.setdefault(part, {})
            node[parts[-1]] = S[key][lang]
        doc["method"] = node_root
        doc.setdefault("menu", {})["methodology"] = MENU[lang]
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"  i18n/{lang}.json: method + menu.methodology")


if __name__ == "__main__":
    check()
    out = os.path.join(HERE, "612_methodology_strings.sql")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(sql())
    print(f"{out}: {len(S)} keys x {len(LANGS)} languages")
    patch_i18n()
