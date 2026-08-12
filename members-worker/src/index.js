// ================================================================
// The E-Invoicing Compliance Corner — Subscribers-Only Archive
// ================================================================
// A small Cloudflare Worker that:
//   1. Receives Lemon Squeezy webhooks and keeps a real-time record
//      of who currently has an active paid subscription.
//   2. Lets a subscriber log in with a passwordless "magic link"
//      emailed to their address (no passwords to manage or leak).
//   3. Serves the gated newsletter archive ONLY to requests carrying
//      a valid, unexpired session for a currently-active subscriber.
//
// Nothing in this file is publicly downloadable content — unlike the
// static tracker site, this genuinely runs server-side, so the gate
// can't be bypassed by viewing page source.
//
// See README.md in this folder for full setup instructions.
// ================================================================

import {
  getMilestonesForCountry as sharedGetMilestonesForCountry,
  renderDeepDiveStyleMilestones as sharedRenderDeepDiveStyleMilestones,
  getDeepDiveContent as sharedGetDeepDiveContent,
  renderFullDeepDivePage as sharedRenderFullDeepDivePage,
  deriveFlagFromCode,
} from "../../shared/deep-dive-render.mjs";
import {
  getRoiCountries as sharedGetRoiCountries,
  getRoiBenchmarks as sharedGetRoiBenchmarks,
  getRoiPhases as sharedGetRoiPhases,
  getRoiStrings as sharedGetRoiStrings,
  renderRoiPage as sharedRenderRoiPage,
  ROI_STYLE,
} from "../../shared/roi-render.mjs";
import {
  getArticleBySlug as sharedGetArticleBySlug,
  renderArticleFragment as sharedRenderArticleFragment,
  INSIGHTS_STYLE,
} from "../../shared/resources-render.mjs";

const SESSION_COOKIE = "eicc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MAGIC_LINK_TTL_SECONDS = 60 * 15; // 15 minutes
// Separate, deliberately longer TTL for "convenience" login links sent
// alongside the primary magic link (the welcome email's archive/
// preferences buttons, the monthly notification's archive button) --
// these aren't the urgent sign-in action, they're "come back later and
// this still just works" links. 7 days is generous without being an
// effectively-permanent credential like the unsub-notifications token
// (5 years, a different and narrower purpose).
const CONVENIENCE_LINK_TTL_SECONDS = 60 * 60 * 24 * 7;
// Guard for handleVerify's optional ?next= redirect target -- NEVER
// honour an arbitrary redirect from a query param (open-redirect risk).
// A same-origin relative path is safe regardless of what follows a
// known-good prefix (the browser can't be sent off-site by anything
// that doesn't start with "//" or a scheme, both excluded by requiring
// an exact match or a single-"/"-prefixed startsWith below) -- so
// individual story pages (/members/archive/<slug>) are allowed via
// prefix, not just the two exact index pages.
function isSafeVerifyNextPath(next) {
  return next === "/members/archive" || next === "/members/preferences" || next.startsWith("/members/archive/")
    || next.startsWith("/members/insights/");
}

// Country data (regions, translated display names, deep-dive slugs,
// picker eligibility) now lives entirely in D1's countries /
// country_translations tables — see migration
// 198_country_slugs_and_picker.sql. This Worker used to keep three
// hardcoded copies here (COUNTRIES_BY_REGION, COUNTRY_NAME_TRANSLATIONS,
// COUNTRY_DEEP_DIVE_SLUGS), each needing a manual edit per new country;
// they were deleted in favor of loadCountryPicker() below and slug
// columns joined into the existing story queries. Adding a country no
// longer touches this file at all.
//
// The fixed presentation order for region groups — a UI choice, not
// country data, so it stays in code. Any region not listed here (there
// are none today) would sort after these.
const REGION_ORDER = ["Europe", "Middle East / Africa", "Asia-Pacific", "Americas"];

// ================================================================
// TRANSLATIONS (EN / ES / DE / FR)
// ================================================================
// This Worker is a separate origin from the static site, so it can't
// fetch the static site's /i18n/*.json files directly (relative fetches
// resolve against THIS Worker's own domain). Rather than duplicate those
// files here, the small set of UI strings this Worker actually needs are
// bundled directly into the Worker's own source below, and rendered
// server-side per request — no client-side loading step needed at all.
//
// Language is picked via a "lang" query param (which also sets a
// long-lived cookie so it persists across pages), falling back to the
// cookie, falling back to English. English is always the fallback for
// any individual missing key too.
const SUPPORTED_LANGS = ["en", "es", "de", "fr"];
const LANG_NAMES = { en: "English", es: "Español", de: "Deutsch", fr: "Français" };
const LANG_COOKIE = "eicc_lang";
const LANG_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

// Country display names come from D1's country_translations table (via
// loadCountryPicker() for the preferences page, or joined directly into
// the archive/story queries) — the hardcoded per-country dictionary that
// used to live here is gone. Region labels below stay in code: they're
// 4 fixed UI strings, not per-country data.
function translateRegionName(lang, name) {
  const map = {
    es: { "Europe": "Europa", "Middle East / Africa": "Oriente Medio / África", "Asia-Pacific": "Asia-Pacífico", "Americas": "América" },
    de: { "Europe": "Europa", "Middle East / Africa": "Naher Osten / Afrika", "Asia-Pacific": "Asien-Pazifik", "Americas": "Amerika" },
    fr: { "Europe": "Europe", "Middle East / Africa": "Moyen-Orient / Afrique", "Asia-Pacific": "Asie-Pacifique", "Americas": "Amériques" },
  };
  return map[lang]?.[name] || name;
}

const WORKER_I18N = {
  en: {
    backToTracker: "← Back to global tracker", backToArchive: "← Back to archive", backToSignIn: "← Back to sign in", logout: "Log out",
    inEffect: "In effect", upcoming: "Upcoming", penaltyFailure: "Failure", penaltyFine: "Fine", penaltyAnnualCap: "Annual cap",
    secTimeline: "Compliance timeline", secFileFormat: "File format & data specification", secScope: "Scope & transmission", secSteps: "Getting compliant", secPenalties: "Penalties & enforcement",
    countryDeepDiveEyebrow: "Country deep dive", lastUpdatedLabel: "Last updated", complianceModelLabel: "Compliance model",
    login: {
      eyebrow: "Subscribers only", title: "Newsletter archive",
      intro: "Enter the email address you subscribed with — we'll send you a one-click sign-in link. No password to remember.",
      emailLabel: "Email address", sendButton: "Send sign-in link",
      notSubscribed: "Not a subscriber yet?", subscribeHere: "Subscribe here",
      errorInvalid: "Please enter a valid email address.",
      errorExpired: "That link has expired or is invalid — please request a new one.",
      errorNoActive: "We couldn't find an active subscription for that email. If you've just subscribed, this can take a minute to sync — try again shortly.",
    },
    checkEmail: { eyebrow: "Almost there", title: "Check your email",
      body: "If that email has an active subscription, a sign-in link is on its way — it expires in 15 minutes and works once. Check spam if it doesn't arrive within a minute or two." },
    trialAlreadyUsed: { eyebrow: "Already signed up", title: "This email is already signed up",
      body: "Each email address can only sign up once. If you're having trouble getting in, use the sign-in link below instead.",
      ctaButton: "Go to sign-in" },
    archive: {
      title: "Newsletter archive", signedInAs: "Signed in as",
      issuesPublished: (n) => `${n} issue${n === 1 ? "" : "s"} published. Search by keyword, or filter to a specific country.`,
      searchPlaceholder: "Search issue titles and summaries…",
      noIssuesYet: "No issues published yet — check back after the next monthly send.",
      loading: "Loading…",
      noMatch: "No issues match your search or filter.",
      managePrefs: "Manage which countries you get alerts for →",
      officialSource: "Official source",
      editionAll: "All editions", editionLatest: "Latest edition", editionThisYear: "This year",
      readDeepDive: (country) => `Read the full ${country} Deep Dive for complete technical detail →`,
      accuracyNote: (date) => `Dates and thresholds above reflect the situation as of ${date} and may have changed since — check the official source and country deep dive below for the latest.`,
      promoBannerText: "You're viewing the full archive for free — no account needed.",
      promoBannerCta: "Subscribe for email alerts →",
      allCountries: "All Countries",
      showMyCountries: (countries) => `Show my subscribed countries (${countries})`,
      showAllCountries: "Show all countries",
    },
    preferences: {
      title: "Alert preferences",
      intro: "Choose which countries you want alerts for. Leave everything unchecked to receive the full monthly digest covering all tracked jurisdictions.",
      saved: "✓ Preferences saved.", selectAll: "Select all", clearAll: "Clear all",
      notifyLabel: "Email me a short notification when a new monthly issue is published",
      saveButton: "Save preferences",
    },
    unsubscribed: { title: "You've been unsubscribed from monthly notification emails.",
      body: "Your paid subscription itself is unaffected — you can still log in and read every issue any time. You can turn notifications back on from your preferences page whenever you like." },
    invalidUnsub: { title: "That link has expired or is invalid.",
      body: "You can manage your notification preference directly from the archive instead, once logged in." },
  },
  es: {
    backToTracker: "← Volver al panel general", backToArchive: "← Volver al archivo", backToSignIn: "← Volver al inicio de sesión", logout: "Cerrar sesión",
    inEffect: "En vigor", upcoming: "Próximamente", penaltyFailure: "Incumplimiento", penaltyFine: "Multa", penaltyAnnualCap: "Límite anual",
    secTimeline: "Cronología de cumplimiento", secFileFormat: "Formato de archivo y especificación de datos", secScope: "Alcance y transmisión", secSteps: "Cómo cumplir", secPenalties: "Sanciones y aplicación",
    countryDeepDiveEyebrow: "Análisis del país", lastUpdatedLabel: "Última actualización", complianceModelLabel: "Modelo de cumplimiento",
    login: {
      eyebrow: "Solo suscriptores", title: "Archivo del boletín",
      intro: "Introduzca el correo electrónico con el que se suscribió — le enviaremos un enlace de acceso de un solo clic. Sin contraseña que recordar.",
      emailLabel: "Correo electrónico", sendButton: "Enviar enlace de acceso",
      notSubscribed: "¿Aún no es suscriptor?", subscribeHere: "Suscríbase aquí",
      errorInvalid: "Introduzca una dirección de correo electrónico válida.",
      errorExpired: "Ese enlace ha caducado o no es válido — solicite uno nuevo.",
      errorNoActive: "No hemos encontrado una suscripción activa para ese correo. Si acaba de suscribirse, puede tardar un minuto en sincronizarse — inténtelo de nuevo enseguida.",
    },
    trialAlreadyUsed: { eyebrow: "Ya registrado", title: "Este correo ya está registrado",
      body: "Cada dirección de correo solo puede registrarse una vez. Si tiene problemas para acceder, utilice el enlace de inicio de sesión a continuación.",
      ctaButton: "Ir a iniciar sesión" },
    checkEmail: { eyebrow: "Ya casi está", title: "Revise su correo",
      body: "Si ese correo tiene una suscripción activa, un enlace de acceso está en camino — caduca en 15 minutos y funciona una sola vez. Revise el spam si no llega en uno o dos minutos." },
    archive: {
      title: "Archivo del boletín", signedInAs: "Sesión iniciada como",
      issuesPublished: (n) => `${n} número${n === 1 ? "" : "s"} publicado${n === 1 ? "" : "s"}. Busque por palabra clave o filtre por país.`,
      searchPlaceholder: "Buscar en títulos y resúmenes de los números…",
      noIssuesYet: "Aún no se ha publicado ningún número — vuelva después del próximo envío mensual.",
      loading: "Cargando…",
      noMatch: "Ningún número coincide con su búsqueda o filtro.",
      managePrefs: "Gestione los países sobre los que recibe alertas →",
      officialSource: "Fuente oficial",
      editionAll: "Todas las ediciones", editionLatest: "Última edición", editionThisYear: "Este año",
      readDeepDive: (country) => `Lea el análisis completo de ${country} para el detalle técnico completo →`,
      accuracyNote: (date) => `Las fechas y umbrales anteriores reflejan la situación a ${date} y pueden haber cambiado desde entonces — consulte la fuente oficial y el análisis del país a continuación para conocer las últimas novedades.`,
      promoBannerText: "Está viendo el archivo completo de forma gratuita — no necesita ninguna cuenta.",
      promoBannerCta: "Suscríbase para recibir alertas por correo →",
      allCountries: "Todos los países",
      showMyCountries: (countries) => `Mostrar mis países suscritos (${countries})`,
      showAllCountries: "Mostrar todos los países",
    },
    preferences: {
      title: "Preferencias de alertas",
      intro: "Elija los países sobre los que desea recibir alertas. Deje todo sin marcar para recibir el resumen mensual completo de todas las jurisdicciones seguidas.",
      saved: "✓ Preferencias guardadas.", selectAll: "Seleccionar todo", clearAll: "Borrar todo",
      notifyLabel: "Enviarme una breve notificación por correo cuando se publique un nuevo número mensual",
      saveButton: "Guardar preferencias",
    },
    unsubscribed: { title: "Se ha dado de baja de las notificaciones mensuales por correo.",
      body: "Su suscripción de pago no se ve afectada — puede seguir iniciando sesión y leyendo todos los números en cualquier momento. Puede reactivar las notificaciones desde su página de preferencias cuando quiera." },
    invalidUnsub: { title: "Ese enlace ha caducado o no es válido.",
      body: "Puede gestionar su preferencia de notificaciones directamente desde el archivo, una vez que inicie sesión." },
  },
  de: {
    backToTracker: "← Zurück zur Übersicht", backToArchive: "← Zurück zum Archiv", backToSignIn: "← Zurück zur Anmeldung", logout: "Abmelden",
    inEffect: "In Kraft", upcoming: "Bevorstehend", penaltyFailure: "Verstoß", penaltyFine: "Bußgeld", penaltyAnnualCap: "Jahresobergrenze",
    secTimeline: "Compliance-Zeitachse", secFileFormat: "Dateiformat & Datenspezifikation", secScope: "Anwendungsbereich & Übermittlung", secSteps: "So werden Sie compliant", secPenalties: "Sanktionen & Durchsetzung",
    countryDeepDiveEyebrow: "Länderanalyse", lastUpdatedLabel: "Zuletzt aktualisiert", complianceModelLabel: "Compliance-Modell",
    login: {
      eyebrow: "Nur für Abonnenten", title: "Newsletter-Archiv",
      intro: "Geben Sie die E-Mail-Adresse ein, mit der Sie abonniert haben — wir senden Ihnen einen Ein-Klick-Anmeldelink. Kein Passwort nötig.",
      emailLabel: "E-Mail-Adresse", sendButton: "Anmeldelink senden",
      notSubscribed: "Noch kein Abonnent?", subscribeHere: "Hier abonnieren",
      errorInvalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      errorExpired: "Dieser Link ist abgelaufen oder ungültig — bitte fordern Sie einen neuen an.",
      errorNoActive: "Wir konnten kein aktives Abonnement für diese E-Mail finden. Falls Sie sich gerade erst angemeldet haben, kann die Synchronisierung einen Moment dauern — versuchen Sie es gleich noch einmal.",
    },
    trialAlreadyUsed: { eyebrow: "Bereits registriert", title: "Diese E-Mail ist bereits registriert",
      body: "Jede E-Mail-Adresse kann sich nur einmal registrieren. Wenn Sie sich nicht anmelden können, verwenden Sie stattdessen den Anmeldelink unten.",
      ctaButton: "Zur Anmeldung" },
    checkEmail: { eyebrow: "Fast geschafft", title: "Prüfen Sie Ihre E-Mails",
      body: "Falls diese E-Mail ein aktives Abonnement hat, ist ein Anmeldelink unterwegs — er läuft nach 15 Minuten ab und funktioniert einmal. Prüfen Sie den Spam-Ordner, falls er nicht innerhalb weniger Minuten ankommt." },
    archive: {
      title: "Newsletter-Archiv", signedInAs: "Angemeldet als",
      issuesPublished: (n) => `${n} Ausgabe${n === 1 ? "" : "n"} veröffentlicht. Durchsuchen Sie sie nach Stichwort oder filtern Sie nach Land.`,
      searchPlaceholder: "Ausgabentitel und Zusammenfassungen durchsuchen…",
      noIssuesYet: "Noch keine Ausgabe veröffentlicht — schauen Sie nach dem nächsten monatlichen Versand wieder vorbei.",
      loading: "Wird geladen…",
      noMatch: "Keine Ausgabe entspricht Ihrer Suche oder Ihrem Filter.",
      managePrefs: "Verwalten Sie, für welche Länder Sie Benachrichtigungen erhalten →",
      officialSource: "Offizielle Quelle",
      editionAll: "Alle Ausgaben", editionLatest: "Neueste Ausgabe", editionThisYear: "Dieses Jahr",
      readDeepDive: (country) => `Lesen Sie die vollständige Länderanalyse ${country} für alle technischen Details →`,
      accuracyNote: (date) => `Die obigen Daten und Schwellenwerte spiegeln den Stand vom ${date} wider und können sich seither geändert haben — die aktuellsten Informationen finden Sie in der offiziellen Quelle und der Länderanalyse unten.`,
      promoBannerText: "Sie sehen sich das vollständige Archiv derzeit kostenlos an — kein Konto erforderlich.",
      promoBannerCta: "Für E-Mail-Benachrichtigungen abonnieren →",
      allCountries: "Alle Länder",
      showMyCountries: (countries) => `Meine abonnierten Länder anzeigen (${countries})`,
      showAllCountries: "Alle Länder anzeigen",
    },
    preferences: {
      title: "Benachrichtigungseinstellungen",
      intro: "Wählen Sie, für welche Länder Sie Benachrichtigungen erhalten möchten. Lassen Sie alles unmarkiert, um den vollständigen monatlichen Digest für alle erfassten Länder zu erhalten.",
      saved: "✓ Einstellungen gespeichert.", selectAll: "Alle auswählen", clearAll: "Alle abwählen",
      notifyLabel: "Mich per kurzer E-Mail benachrichtigen, wenn eine neue monatliche Ausgabe veröffentlicht wird",
      saveButton: "Einstellungen speichern",
    },
    unsubscribed: { title: "Sie haben die monatlichen Benachrichtigungs-E-Mails abbestellt.",
      body: "Ihr bezahltes Abonnement selbst ist davon nicht betroffen — Sie können sich weiterhin jederzeit anmelden und jede Ausgabe lesen. Sie können Benachrichtigungen jederzeit über Ihre Einstellungsseite wieder aktivieren." },
    invalidUnsub: { title: "Dieser Link ist abgelaufen oder ungültig.",
      body: "Sie können Ihre Benachrichtigungseinstellung stattdessen direkt im Archiv verwalten, sobald Sie angemeldet sind." },
  },
  fr: {
    backToTracker: "← Retour au suivi global", backToArchive: "← Retour aux archives", backToSignIn: "← Retour à la connexion", logout: "Se déconnecter",
    inEffect: "En vigueur", upcoming: "À venir", penaltyFailure: "Manquement", penaltyFine: "Amende", penaltyAnnualCap: "Plafond annuel",
    secTimeline: "Chronologie de conformité", secFileFormat: "Format de fichier et spécification des données", secScope: "Champ d'application et transmission", secSteps: "Comment se conformer", secPenalties: "Sanctions et application",
    countryDeepDiveEyebrow: "Analyse par pays", lastUpdatedLabel: "Dernière mise à jour", complianceModelLabel: "Modèle de conformité",
    login: {
      eyebrow: "Réservé aux abonnés", title: "Archives de la newsletter",
      intro: "Saisissez l'adresse e-mail utilisée pour votre abonnement — nous vous enverrons un lien de connexion en un clic. Pas de mot de passe à retenir.",
      emailLabel: "Adresse e-mail", sendButton: "Envoyer le lien de connexion",
      notSubscribed: "Pas encore abonné ?", subscribeHere: "Abonnez-vous ici",
      errorInvalid: "Veuillez saisir une adresse e-mail valide.",
      errorExpired: "Ce lien a expiré ou n'est pas valide — veuillez en demander un nouveau.",
      errorNoActive: "Nous n'avons trouvé aucun abonnement actif pour cet e-mail. Si vous venez de vous abonner, la synchronisation peut prendre un instant — réessayez sous peu.",
    },
    trialAlreadyUsed: { eyebrow: "Déjà inscrit", title: "Cet e-mail est déjà inscrit",
      body: "Chaque adresse e-mail ne peut s'inscrire qu'une seule fois. Si vous avez du mal à vous connecter, utilisez plutôt le lien de connexion ci-dessous.",
      ctaButton: "Aller à la connexion" },
    checkEmail: { eyebrow: "Presque terminé", title: "Consultez vos e-mails",
      body: "Si cet e-mail correspond à un abonnement actif, un lien de connexion est en route — il expire dans 15 minutes et ne fonctionne qu'une fois. Vérifiez vos spams s'il n'arrive pas sous quelques minutes." },
    archive: {
      title: "Archives de la newsletter", signedInAs: "Connecté en tant que",
      issuesPublished: (n) => `${n} numéro${n === 1 ? "" : "s"} publié${n === 1 ? "" : "s"}. Recherchez par mot-clé ou filtrez par pays.`,
      searchPlaceholder: "Rechercher dans les titres et résumés des numéros…",
      noIssuesYet: "Aucun numéro publié pour l'instant — revenez après le prochain envoi mensuel.",
      loading: "Chargement…",
      noMatch: "Aucun numéro ne correspond à votre recherche ou filtre.",
      managePrefs: "Gérez les pays pour lesquels vous recevez des alertes →",
      officialSource: "Source officielle",
      editionAll: "Toutes les éditions", editionLatest: "Dernière édition", editionThisYear: "Cette année",
      readDeepDive: (country) => `Lire l'analyse complète de ${country} pour tous les détails techniques →`,
      accuracyNote: (date) => `Les dates et seuils ci-dessus reflètent la situation au ${date} et peuvent avoir changé depuis — consultez la source officielle et l'analyse du pays ci-dessous pour les dernières informations.`,
      promoBannerText: "Vous consultez actuellement l'intégralité des archives gratuitement — aucun compte requis.",
      promoBannerCta: "S'abonner pour recevoir des alertes par e-mail →",
      allCountries: "Tous les pays",
      showMyCountries: (countries) => `Afficher mes pays suivis (${countries})`,
      showAllCountries: "Afficher tous les pays",
    },
    preferences: {
      title: "Préférences d'alerte",
      intro: "Choisissez les pays pour lesquels vous souhaitez des alertes. Laissez tout décoché pour recevoir la synthèse mensuelle complète couvrant toutes les juridictions suivies.",
      saved: "✓ Préférences enregistrées.", selectAll: "Tout sélectionner", clearAll: "Tout désélectionner",
      notifyLabel: "M'envoyer une courte notification par e-mail lors de la publication d'un nouveau numéro mensuel",
      saveButton: "Enregistrer les préférences",
    },
    unsubscribed: { title: "Vous avez été désabonné des e-mails de notification mensuels.",
      body: "Votre abonnement payant lui-même n'est pas affecté — vous pouvez toujours vous connecter et lire chaque numéro à tout moment. Vous pouvez réactiver les notifications depuis votre page de préférences quand vous le souhaitez." },
    invalidUnsub: { title: "Ce lien a expiré ou n'est pas valide.",
      body: "Vous pouvez gérer votre préférence de notification directement depuis les archives, une fois connecté." },
  },
};

function t(lang, path) {
  const parts = path.split(".");
  let enNode = WORKER_I18N.en;
  let node = WORKER_I18N[lang] || WORKER_I18N.en;
  for (const part of parts) {
    node = node?.[part];
    enNode = enNode?.[part];
  }
  return node !== undefined ? node : enNode;
}

function resolveLanguage(request) {
  const url = new URL(request.url);
  const { value: cookieLang, duplicated: cookieDuplicated } = getCookie(request, LANG_COOKIE);
  const fromQuery = url.searchParams.get("lang");
  if (fromQuery && SUPPORTED_LANGS.includes(fromQuery)) return { lang: fromQuery, shouldSetCookie: true, cookieDuplicated };

  if (cookieLang && SUPPORTED_LANGS.includes(cookieLang)) return { lang: cookieLang, shouldSetCookie: false, cookieDuplicated };

  return { lang: "en", shouldSetCookie: false, cookieDuplicated };
}

function withLangCookie(response, lang, shouldSetCookie, cookieDuplicated) {
  if (!shouldSetCookie && !cookieDuplicated) return response;
  const headers = new Headers(response.headers);
  if (shouldSetCookie) {
    // Domain=.e-invoicingcompliancecorner.com (not host-only) is what
    // makes the shared language banner actually shared across
    // subdomains -- this same cookie is then visible to
    // e-invoicingcompliancecorner.com itself too, and vice versa (see
    // site-worker/src/index.js and i18n.js's writeCookie).
    headers.append("Set-Cookie", `${LANG_COOKIE}=${lang}; Domain=.e-invoicingcompliancecorner.com; Path=/; Max-Age=${LANG_COOKIE_TTL_SECONDS}; SameSite=Lax`);
  }
  if (cookieDuplicated) {
    // Self-heal: the visitor is carrying both a stale host-only
    // "eicc_lang" cookie (from before Domain scoping existed) and the
    // current domain-scoped one. getCookie() already reads the
    // correct (newer) value regardless, but clear the stale host-only
    // one here too so the browser stops sending two of them.
    headers.append("Set-Cookie", `${LANG_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  }
  return new Response(response.body, { status: response.status, headers });
}

// CORS for the cross-origin fetch routes: the two archive GETs (the
// tracker embeds them in-page) and the feedback POST (feedback.html
// fetches from the main-site origin; without this header the browser
// blocks the page's JS from READING the response — the request itself
// still goes through as a CORS simple request, so a missing wrapper
// here manifests as "error shown to user, submission actually
// succeeded", which is exactly the bug this comment commemorates).
// Deliberately scoped to exactly one trusted origin, not "*", and not
// applied anywhere credentials/session state is involved.
function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "https://e-invoicingcompliancecorner.com");
  return new Response(response.body, { status: response.status, headers });
}

// Shared site-wide language banner -- same markup/colours as the one
// i18n.js injects on the static pages and shared/deep-dive-render.mjs
// renders on country pages (2 August 2026). Injected once into
// pageShell() below, so it covers every members-subdomain page without
// each render*Page() function building its own switcher. Links carry
// a plain "?lang=code" href and a tiny inline script upgrades them on
// load to preserve the current page's own path and other query params
// (e.g. the archive's ?search=, an issue's own URL).
function renderLangBanner(lang) {
  const links = SUPPORTED_LANGS.map((code) => {
    const isActive = code === lang;
    return `<a href="?lang=${code}" data-lang="${code}" style="color:${isActive ? "var(--soon)" : "var(--muted)"}; font-weight:${isActive ? "700" : "400"}; text-decoration:none;">${code.toUpperCase()}</a>`;
  }).join("");
  return `<div id="eiccLangBanner" style="background:var(--ink-2); padding:7px 18px; display:flex; align-items:center; justify-content:flex-end; gap:14px; font-family:'IBM Plex Mono',monospace; font-size:11.5px; position:relative; z-index:70;">
    <span style="color:var(--muted);">🌐</span>${links}
  </div>
  <script>(function(){var p=new URLSearchParams(window.location.search);document.querySelectorAll('#eiccLangBanner a[data-lang]').forEach(function(a){p.set('lang',a.getAttribute('data-lang'));a.href=window.location.pathname+'?'+p.toString();});})();</script>`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { lang, shouldSetCookie, cookieDuplicated } = resolveLanguage(request);
    try {
      let response;
      if (request.method === "POST" && url.pathname === "/webhooks/lemonsqueezy") {
        return handleWebhook(request, env); // webhook responses never carry a lang cookie
      } else if (request.method === "GET" && url.pathname === "/") {
        // Visiting the bare custom domain directly (no path) previously hit
        // this Worker's own 404 fallback, which looked like a broken
        // deployment rather than a missing convenience redirect.
        return new Response(null, { status: 302, headers: { Location: "/members" } });
      } else if (request.method === "GET" && url.pathname === "/members") {
        response = htmlResponse(renderLoginPage(null, lang, url.searchParams.get("next") || ""));
      } else if (request.method === "POST" && url.pathname === "/members/login") {
        response = await handleLoginRequest(request, env, lang);
      } else if (request.method === "POST" && url.pathname === "/members/start-trial") {
        response = await handleStartTrial(request, env, lang);
      } else if (request.method === "GET" && url.pathname === "/members/verify") {
        response = await handleVerify(request, env, lang);
      } else if (request.method === "GET" && url.pathname === "/members/archive") {
        // CORS-enabled: the tracker page (a different origin) fetches
        // this route directly to embed the archive in-page, matching
        // how country deep dives already load in-page there. Only
        // these two archive GET routes get CORS -- login, preferences,
        // and everything else stay same-origin only.
        response = withCors(await handleArchiveList(request, env, lang));
      } else if (request.method === "GET" && url.pathname.startsWith("/members/archive/")) {
        const slug = decodeURIComponent(url.pathname.replace("/members/archive/", ""));
        response = withCors(await handleArchiveIssue(request, env, slug, lang));
      } else if (request.method === "GET" && url.pathname.startsWith("/members/insights/")) {
        // Same-origin only (no withCors) -- unlike the archive embeds,
        // nothing fetches this cross-origin; readers arrive via a plain
        // top-level navigation from the public /insights/<slug> page's
        // "keep reading" link, or a newsletter convenience link.
        const slug = decodeURIComponent(url.pathname.replace("/members/insights/", ""));
        response = await handleArticleFull(request, env, slug, lang);
      } else if (request.method === "GET" && url.pathname === "/members/roi-calculator") {
        response = await handleRoiCalculator(request, env, lang);
      } else if (request.method === "GET" && url.pathname === "/admin/preview/milestones") {
        response = await handleMilestonesPreview(request, env, lang);
      } else if (request.method === "GET" && url.pathname === "/admin/preview/deep-dive") {
        response = await handleDeepDivePreview(request, env, lang);
      } else if (request.method === "GET" && url.pathname === "/members/preferences") {
        response = await handlePreferencesGet(request, env, lang);
      } else if (request.method === "POST" && url.pathname === "/members/feedback") {
        response = withCors(await handleFeedback(request, env));
      } else if (request.method === "POST" && url.pathname === "/members/preferences") {
        response = await handlePreferencesPost(request, env, lang);
      } else if (request.method === "GET" && url.pathname === "/members/unsubscribe-notifications") {
        response = await handleUnsubscribeNotifications(request, env, lang);
      } else if (request.method === "POST" && url.pathname === "/members/logout") {
        response = handleLogout();
      } else if (request.method === "POST" && url.pathname === "/admin/send-monthly-notifications") {
        // Manual trigger for testing the monthly notification job without
        // waiting for the actual cron schedule — see README for how to call
        // this safely (it's not linked from anywhere in the UI).
        return handleManualNotificationTrigger(request, env);
      } else if (request.method === "POST" && url.pathname === "/admin/run-content-monitor") {
        return handleManualContentMonitorTrigger(request, env, ctx);
      } else {
        response = new Response("Not found", { status: 404 });
      }
      return withLangCookie(response, lang, shouldSetCookie, cookieDuplicated);
    } catch (err) {
      return new Response("Server error — " + err.message, { status: 500 });
    }
  },

  // Cloudflare Workers Cron Trigger entry point — see wrangler.toml's
  // [triggers] section for the actual schedules. Two independent cron
  // strings both land here; event.cron tells them apart. Sends every
  // active subscriber a short, personalised notification about the
  // current month's issue (monthly), and separately runs the content
  // monitor's known-page watcher (weekly) — see CONTENT-MONITORING.md
  // for the full design and why these are deliberately kept separate
  // from anything that publishes to subscribers.
  async scheduled(event, env, ctx) {
    if (event.cron === CONTENT_MONITOR_CRON) {
      // AWAITED, not ctx.waitUntil() — this matters, see the time-budget
      // constant below. Cloudflare's scheduled-handler docs are explicit:
      // "The runtime waits for the promise returned by the scheduled()
      // handler to resolve (up to the 15-minute duration limit)" and
      // "You do not need to use waitUntil() for the runtime to wait for
      // a single asynchronous task." Handing the work to waitUntil()
      // instead is what let an earlier version get killed partway
      // through, which in turn is why the run's self-imposed budget was
      // set so defensively low that it only ever reached ~10 of 117
      // sources per week. Returning the promise is the supported
      // pattern and unlocks the real ceiling.
      await runContentMonitor(env);
    } else {
      // Also awaited, for the same reason as the monitor above (fixed
      // 10 Aug 2026, immediately after). This one mattered more: it had
      // no time budget and no resume cursor either, so a run that
      // outlived its grace period meant every subscriber past that
      // point silently received nothing that month, with no record of
      // who had been reached. It now polices its own clock and persists
      // progress — see sendMonthlyNotifications.
      await sendMonthlyNotifications(env);
    }
  },
};

// ================================================================
// CONTENT MONITOR — the "known-page watcher" from CONTENT-MONITORING.md
// ================================================================
// Detection only. This code NEVER writes to milestones, deep-dive
// content, or stories, and NEVER emails subscribers — see the design
// doc's framing section for why that line is load-bearing. Its entire
// output is one internal digest email: "these official pages changed
// since last week, go look." A human always reads the actual change
// before anything gets published.
//
// Watch list: tracking_sources WHERE active = 1 (migration 214) — the
// same registry that powers the public /sources page. Adding a source
// there automatically adds it to monitoring; setting active = 0 pulls
// it out of both places at once, by design (one registry, one meaning).

const CONTENT_MONITOR_CRON = "0 8 * * 1"; // Monday 08:00 UTC — see wrangler.toml
const CONTENT_MONITOR_FETCH_DELAY_MS = 750; // spacing between fetches — considerate of government infrastructure, not a bulk scraper
const CONTENT_MONITOR_USER_AGENT = "EICC-ContentMonitor/1.0 (+https://e-invoicingcompliancecorner.com/about; weekly check for compliance updates)";
const CONTENT_MONITOR_FETCH_TIMEOUT_MS = 15000;
// SELF-IMPOSED time budget for a single run.
//
// HISTORY, because the number moved a long way and the reasoning
// matters more than the value. This was originally 20 seconds, set
// defensively after an earlier version ran all ~50 sources with a 3s
// gap and got silently killed mid-run with no digest sent at all
// ("waitUntil() tasks did not complete... and have been cancelled").
// The diagnosis at the time — an undocumented, very short ceiling —
// was wrong. The real problem was handing the work to ctx.waitUntil()
// rather than returning it from scheduled(); see the handler above.
// Cloudflare documents a 15-MINUTE duration limit for a scheduled
// handler's returned promise, and for a cron interval of an hour or
// more the CPU allowance is 15 minutes too (this Worker's monitor cron
// is weekly, and almost all of its wall time is spent waiting on the
// network, not on CPU).
//
// The cost of getting this wrong was invisible but real: at 20s the
// run reached about 10 of 117 sources, so a full sweep took roughly
// TWELVE WEEKS and any given government page was effectively checked
// once a quarter by a job described as weekly. The digest reported it
// honestly every time; nobody read "107 deferred" as "quarterly
// coverage" until Dan asked why the email read like a list of failures
// (10 Aug 2026).
//
// 8 minutes leaves ~7 minutes of headroom under the documented 15.
// Expected real duration is far lower: 117 sources x (750ms spacing +
// ~1s fetch) is roughly 3.5 minutes. The budget still exists because
// the worst case is not the expected case — if every source hit the
// 15s fetch timeout, an unbounded run would need ~30 minutes and would
// be cut off with no digest at all. The cursor logic below is retained
// unchanged for exactly that scenario.
const CONTENT_MONITOR_TIME_BUDGET_MS = 480000;
// The manual /admin/run-content-monitor trigger runs under waitUntil()
// after an HTTP response and does NOT get the scheduled handler's
// 15-minute allowance, so it uses this much smaller budget and checks a
// slice. Same cursor, so nothing is lost — the next run continues.
const CONTENT_MONITOR_MANUAL_BUDGET_MS = 20000;
// A source that has failed this many consecutive runs is reported as a
// "known blocker" — a one-line group rather than a full card each week.
// Some official sites (Israel's gov.il, for one) block automated
// requests as a matter of policy and will never succeed; repeating an
// identical full-size failure card every week trains the reader to
// skim past the failures section, which is precisely where a NEW
// failure needs to be noticed. Nothing is ever silently dropped — the
// group is always listed, with its run count, so a blocker cannot
// quietly become a blind spot.
const CONTENT_MONITOR_KNOWN_BLOCKER_RUNS = 3;
const CONTENT_MONITOR_CURSOR_KEY = "cursor:next-source-id";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Strips a fetched HTML page down to comparable plain text: drop
// <script>/<style> entirely (their content is never meaningful to a
// reader and churns constantly — analytics IDs, cache-busting, session
// tokens), strip all remaining tags, collapse whitespace. This is
// deliberately crude — the goal is "did the actual information change",
// not a faithful text rendering, and crude-but-stable beats
// sophisticated-but-brittle for a diff baseline.
function extractComparableText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    // Per-request tracing/analytics noise that changes on EVERY load
    // regardless of actual content, confirmed empirically (3 August
    // 2026): Confluence-powered pages (the EC eInvoicing factsheets,
    // ec.europa.eu) embed a {"serverDuration": N, "requestCorrelationId":
    // "hex"} blob at the very end of the rendered page — this flagged
    // Belgium and Croatia as "changed" on the very first live run when
    // nothing regulatory had changed at all. Stripped generically here
    // rather than special-cased per domain, since the same class of
    // problem (request IDs, timing metadata, cache-busting tokens
    // embedded in visible text rather than a <script> tag) is likely to
    // recur on other platforms too.
    .replace(/\{"serverDuration":\s*\d+,\s*"requestCorrelationId":\s*"[a-f0-9]+"\}/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// A crude before/after diff snippet: find the longest common prefix and
// suffix, show what's sandwiched between them (truncated). Not a real
// diff algorithm — just enough context for a human deciding whether to
// look closer, which is all this needs to be per the design doc.
function crudeDiffSnippet(oldText, newText, context = 160) {
  let start = 0;
  const maxStart = Math.min(oldText.length, newText.length);
  while (start < maxStart && oldText[start] === newText[start]) start++;
  let oldEnd = oldText.length, newEnd = newText.length;
  while (oldEnd > start && newEnd > start && oldText[oldEnd - 1] === newText[newEnd - 1]) {
    oldEnd--; newEnd--;
  }
  const before = oldText.slice(Math.max(start - context, 0), Math.min(oldEnd + context, oldText.length));
  const after = newText.slice(Math.max(start - context, 0), Math.min(newEnd + context, newText.length));
  return { before: before.trim(), after: after.trim() };
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Consecutive-failure bookkeeping, so the digest can tell a source that
// has just broken apart from one that has been blocking us for months.
// Counter lives beside the content hash in the same KV namespace and is
// cleared the moment a source succeeds again — a site that starts
// working is immediately "recovered", not still on probation.
async function bumpSourceFailure(env, sourceId) {
  const key = `fail:${sourceId}`;
  const prev = parseInt(await env.CONTENT_MONITOR.get(key) || "0", 10) || 0;
  const next = prev + 1;
  await env.CONTENT_MONITOR.put(key, String(next));
  return next;
}

async function clearSourceFailure(env, sourceId) {
  await env.CONTENT_MONITOR.delete(`fail:${sourceId}`);
}

async function checkOneSource(env, source) {
  // source: { id, url, country, description }
  const kvKey = `hash:${source.id}`;
  let response;
  try {
    response = await fetchWithTimeout(source.url, {
      headers: { "User-Agent": CONTENT_MONITOR_USER_AGENT },
    }, CONTENT_MONITOR_FETCH_TIMEOUT_MS);
  } catch (err) {
    const consecutiveFailures = await bumpSourceFailure(env, source.id);
    return { source, status: "failed", error: String(err && err.message || err), consecutiveFailures };
  }
  if (!response.ok) {
    const consecutiveFailures = await bumpSourceFailure(env, source.id);
    return { source, status: "failed", error: `HTTP ${response.status}`, consecutiveFailures };
  }
  let html;
  try {
    html = await response.text();
  } catch (err) {
    const consecutiveFailures = await bumpSourceFailure(env, source.id);
    return { source, status: "failed", error: "could not read response body", consecutiveFailures };
  }
  await clearSourceFailure(env, source.id);
  const text = extractComparableText(html);
  const hash = await sha256Hex(text);
  const previous = await env.CONTENT_MONITOR.get(kvKey);

  if (previous === null) {
    // First time seeing this page: establish the baseline silently.
    // Flagging every source as "changed" on its first-ever check would
    // make the very first digest useless noise.
    await env.CONTENT_MONITOR.put(kvKey, JSON.stringify({ hash, text: text.slice(0, 20000), checkedAt: new Date().toISOString() }));
    return { source, status: "baseline" };
  }

  let previousParsed;
  try { previousParsed = JSON.parse(previous); } catch { previousParsed = { hash: previous, text: "" }; }

  await env.CONTENT_MONITOR.put(kvKey, JSON.stringify({ hash, text: text.slice(0, 20000), checkedAt: new Date().toISOString() }));

  if (previousParsed.hash === hash) {
    return { source, status: "unchanged" };
  }
  const diff = crudeDiffSnippet(previousParsed.text || "", text);
  return { source, status: "changed", diff };
}

// ================================================================
// ANNOUNCEMENT TRACKING (migration 503)
// ================================================================
// "Have we told anyone about this yet, and where?" Reads three
// content sources — published stories, published articles
// (whitepapers/insights), and shipped features — and reports which of
// them are missing an announcement on each expected channel.
//
// Same hard line as the rest of the content monitor: this NEVER
// announces anything. It reports what a human has not yet done.
//
// Which channels are EXPECTED, per item type. Deliberately not one
// flat list: a newsletter story is announced by the monthly email and
// that is usually the whole job, whereas a whitepaper or a shipped
// feature is worth a post as well. Applying "needs LinkedIn too" to
// every one of ~35 stories in a 60-day window would bury the two or
// three items that genuinely need a decision — the exact noise problem
// this rewrite exists to fix. Add a channel here and it starts being
// chased from the next run.
const ANNOUNCEMENT_CHANNELS_BY_TYPE = {
  story: ["newsletter"],
  article: ["newsletter", "linkedin"],
  feature: ["newsletter", "linkedin"],
};
// Only chase items published/shipped within this window. Something
// nobody announced three months ago is a decision, not an oversight,
// and nagging about it forever is exactly the "list of things not
// done" tone this digest is trying to lose.
const ANNOUNCEMENT_LOOKBACK_DAYS = 60;

function currentMonthKeyUTC() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function getUnannouncedItems(env) {
  const since = new Date(Date.now() - ANNOUNCEMENT_LOOKBACK_DAYS * 86400000).toISOString().slice(0, 10);
  const thisMonth = currentMonthKeyUTC();

  // One UNION query rather than three round trips. Each arm normalises
  // to the same shape so the digest can treat them uniformly.
  const rows = await d1All(env, `
    SELECT 'story' AS item_type, s.id AS item_id, s.summary_en AS title, s.date AS item_date, NULL AS extra
      FROM stories s
     WHERE s.published = 1 AND s.date >= ?1
       -- Only stories whose month's send has already been and gone.
       -- This month's stories are queued for the next monthly email,
       -- so flagging them would be nagging about work that is already
       -- scheduled. A story from a PREVIOUS month with no newsletter
       -- record genuinely slipped through — that is the real gap this
       -- catches (the monthly job sends on the 1st, so anything added
       -- mid-month was never announced to anyone).
       AND s.month < ?2
    UNION ALL
    SELECT 'article', CAST(a.id AS TEXT), a.title, COALESCE(a.published_at, a.created_at), a.type
      FROM articles a
     WHERE a.published = 1 AND COALESCE(a.published_at, a.created_at) >= ?1
    UNION ALL
    SELECT 'feature', CAST(f.id AS TEXT), f.title, f.shipped_at, NULL
      FROM features f
     WHERE f.shipped_at >= ?1
    ORDER BY item_date DESC
  `, since, thisMonth);
  if (rows.length === 0) return [];

  const announced = await d1All(env, `SELECT item_type, item_id, channel FROM announcements`);
  const done = new Set(announced.map((a) => `${a.item_type}|${a.item_id}|${a.channel}`));

  return rows
    .map((r) => ({
      ...r,
      missing: (ANNOUNCEMENT_CHANNELS_BY_TYPE[r.item_type] || []).filter((ch) => !done.has(`${r.item_type}|${r.item_id}|${ch}`)),
    }))
    .filter((r) => r.missing.length > 0);
}

// Called by sendMonthlyNotifications once a send has actually gone out,
// so the 'newsletter' channel stays true without anyone maintaining it.
// Deliberately called AFTER the send loop, not before: if the send dies
// partway, we would rather under-record (and re-announce next month)
// than claim subscribers were told about something they never saw.
async function recordAnnouncements(env, itemType, itemIds, channel, note) {
  const today = new Date().toISOString().slice(0, 10);
  for (const id of itemIds) {
    try {
      await env.eicc_content.prepare(`
        INSERT OR IGNORE INTO announcements (item_type, item_id, channel, announced_at, note)
        VALUES (?1, ?2, ?3, ?4, ?5)
      `).bind(itemType, String(id), channel, today, note || null).run();
    } catch (err) {
      // Never let announcement bookkeeping break a real send or a digest.
      console.log(`recordAnnouncements: could not record ${itemType} ${id} on ${channel}: ${err && err.message || err}`);
    }
  }
}

async function getActiveTrackingSources(env) {
  return d1All(env, `
    SELECT ts.id, ts.url, c.name_en AS country, tst.description
    FROM tracking_sources ts
    JOIN countries c ON c.id = ts.country_id
    LEFT JOIN tracking_source_translations tst ON tst.source_id = ts.id AND tst.lang = 'en'
    WHERE ts.active = 1
    ORDER BY c.name_en, ts.sort_order
  `);
}

function escapeHtmlCM(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Branded to match the site's established transactional-email look
// (buildEmailShell — the same dark-ink/cream-card wrapper used for
// magic-link and monthly-notification emails), rather than the plain
// unstyled paragraphs this started as. Still strictly an internal tool:
// no site-facing polish beyond making it quick to scan at a glance.
const CM_HEADING = "#241d10", CM_BODY = "#4a4030", CM_MUTED = "#8a7d5a";
const CM_AMBER = "#c98a3a", CM_STAMP = "#b5432f", CM_LIVE = "#3f7d5c";

// Bold masthead matching the tracker page's own brand-eyebrow +
// brand-title (same copy, same uppercase two-line title) — as close a
// match as an email can realistically get, since Gmail and most other
// clients strip custom @font-face/<link> web fonts. 'Big Shoulders
// Display' is listed first as a best-effort for the rare client that
// does honour it; Arial Black / Impact carry the same bold, condensed,
// high-impact feel everywhere else, at a matching weight and scale.
// Shared bold masthead for any transactional email that wants a strong,
// on-brand header instead of buildEmailShell's small default eyebrow —
// currently the content monitor's digest and the new-subscriber welcome
// email. Mirrors the tracker page's own brand-eyebrow + brand-title
// copy and proportions as closely as email clients allow (see the
// content-monitor rebrand notes for why Impact, not Arial Black, is the
// realistic condensed fallback for 'Big Shoulders Display').
function buildBoldMastheadHtml() {
  return `
    <p style="margin:0 0 6px; font-family:'Courier New',Courier,monospace; font-size:10px; letter-spacing:2px; text-transform:uppercase; color:#c98a3a;">Compliance clearance board</p>
    <h1 style="margin:0; font-family:'Big Shoulders Display',Impact,'Arial Narrow',sans-serif; font-weight:900; font-stretch:condensed; font-size:30px; line-height:0.98; text-transform:uppercase; color:#f2f0e8; letter-spacing:-0.2px;">The E-Invoicing<br>Compliance Corner</h1>
  `;
}
const CM_HEADER_HTML = buildBoldMastheadHtml();

// Plain-language translation of fetch failures for the digest email.
// The raw error (HTTP status codes, "Too many redirects" with a
// 20-URL chain, abort messages) is exact and useful for debugging, but
// meaningless to read at a glance in a weekly summary — replaced here
// with a one-line, common-sense explanation. The raw detail is still
// shown, just de-emphasized (small, muted, clearly secondary) rather
// than removed outright, so nothing is lost if it's ever needed.
function humanizeFetchError(error) {
  const e = String(error || "");
  if (/\b403\b/.test(e)) return "This site is blocking automated visits.";
  if (/\b404\b/.test(e)) return "This page no longer exists at this address — the URL may need updating.";
  if (/too many redirects/i.test(e)) return "This page gets stuck in a redirect loop and can't be checked automatically.";
  if (/\b5\d\d\b/.test(e)) return "This site couldn't be reached right now — likely a temporary problem on their end.";
  if (/\b4\d\d\b/.test(e)) return "This page couldn't be accessed (it may have moved, or now needs a login).";
  if (/abort|timeout/i.test(e)) return "This site took too long to respond.";
  return "This site couldn't be checked automatically this time.";
}

function cmStatCell(value, label, color) {
  return `<td align="center" style="padding:10px 4px; background-color:#f5f0e2; border-radius:6px;">
    <div style="font-family:Georgia,serif; font-size:22px; font-weight:bold; color:${color};">${value}</div>
    <div style="font-family:'Courier New',Courier,monospace; font-size:9px; letter-spacing:0.5px; text-transform:uppercase; color:${CM_MUTED}; margin-top:2px;">${label}</div>
  </td>`;
}

function cmSourceCard(source, accentColor, bodyHtml) {
  return `<div style="margin:0 0 14px; padding:14px 16px; background-color:#f9f6ee; border-left:3px solid ${accentColor}; border-radius:4px;">
    <p style="margin:0 0 6px; font-family:Georgia,serif; font-size:14.5px; font-weight:bold; color:${CM_HEADING};">${escapeHtmlCM(source.country)} — ${escapeHtmlCM(source.description || source.url)}</p>
    <p style="margin:0 0 8px; font-family:'Courier New',Courier,monospace; font-size:11px;"><a href="${escapeHtmlCM(source.url)}" style="color:${CM_MUTED}; text-decoration:none;">${escapeHtmlCM(source.url)}</a></p>
    ${bodyHtml}
  </div>`;
}

const CM_ITEM_TYPE_LABELS = { story: "Newsletter story", article: "Insight / whitepaper", feature: "Feature" };
const CM_CHANNEL_LABELS = { newsletter: "newsletter", linkedin: "LinkedIn" };

// The digest is ordered by what the reader has to DO, not by what the
// job happened to compute. Attention first (changed pages, then content
// waiting to be announced), reassurance second, housekeeping last and
// small. Before 10 Aug 2026 it opened with a four-up stat grid where
// three of the four numbers were shortfalls, which made a completely
// healthy week read like a list of failures.
function buildDigestHtml(results, totalSources, skipped, unannounced) {
  skipped = skipped || [];
  unannounced = unannounced || [];
  const changed = results.filter((r) => r.status === "changed");
  const failedAll = results.filter((r) => r.status === "failed");
  // Split new/intermittent failures from sites that have been refusing
  // us for weeks. A government site with a standing bot policy is a
  // known limitation, not news; repeating an identical full card every
  // week is how a reader learns to skim the section where a genuinely
  // new failure would appear.
  const knownBlockers = failedAll.filter((r) => (r.consecutiveFailures || 1) >= CONTENT_MONITOR_KNOWN_BLOCKER_RUNS);
  const newFailures = failedAll.filter((r) => (r.consecutiveFailures || 1) < CONTENT_MONITOR_KNOWN_BLOCKER_RUNS);
  const baseline = results.filter((r) => r.status === "baseline");
  const unchanged = results.filter((r) => r.status === "unchanged");
  const dateStr = new Date().toISOString().slice(0, 10);
  const fullSweep = skipped.length === 0;
  const needsAttention = changed.length + newFailures.length + unannounced.length;

  let html = `
    <p style="margin:0 0 4px; font-family:'Courier New',Courier,monospace; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:${CM_AMBER};">Content Monitor</p>
    <h1 style="margin:0 0 6px; font-family:Georgia,serif; font-size:20px; color:${CM_HEADING};">Weekly check — ${dateStr}</h1>
    <p style="margin:0 0 18px; font-size:13px; color:${CM_BODY};">${
      needsAttention === 0
        ? `Nothing needs you this week. ${fullSweep ? `All ${totalSources} sources checked` : `${results.length} of ${totalSources} sources checked`}, no changes found.`
        : `<strong>${needsAttention} item${needsAttention === 1 ? "" : "s"} for you below.</strong> ${fullSweep ? `All ${totalSources} sources checked.` : `${results.length} of ${totalSources} sources checked.`}`
    }</p>`;

  // ---- Attention: pages that changed ----
  if (changed.length) {
    html += `<h2 style="margin:0 0 10px; font-family:Georgia,serif; font-size:15px; color:${CM_HEADING};"><span style="color:${CM_AMBER};">●</span> Changed (${changed.length}) — go look</h2>`;
    for (const r of changed) {
      html += cmSourceCard(r.source, CM_AMBER, `
        <p style="margin:0 0 3px; font-family:'Courier New',Courier,monospace; font-size:11px; color:${CM_MUTED};">Before: …${escapeHtmlCM(r.diff.before)}…</p>
        <p style="margin:0; font-family:'Courier New',Courier,monospace; font-size:11px; color:${CM_LIVE};">After: …${escapeHtmlCM(r.diff.after)}…</p>
      `);
    }
  }

  // ---- Attention: published, but nobody has been told ----
  // Deliberately framed as "ready to announce" rather than "you haven't
  // done this" — these are finished pieces of work waiting for their
  // moment, which is a different thing from a task backlog.
  if (unannounced.length) {
    html += `<h2 style="margin:${changed.length ? "22px" : "0"} 0 4px; font-family:Georgia,serif; font-size:15px; color:${CM_HEADING};"><span style="color:${CM_LIVE};">●</span> Ready to announce (${unannounced.length})</h2>
      <p style="margin:0 0 10px; font-size:12px; color:${CM_MUTED};">Published on the site, not yet announced everywhere. The newsletter channel records itself when the monthly email goes out; anything else is recorded by hand.</p>`;
    for (const item of unannounced) {
      const typeLabel = CM_ITEM_TYPE_LABELS[item.item_type] || item.item_type;
      const missing = item.missing.map((c) => CM_CHANNEL_LABELS[c] || c).join(" and ");
      html += `<div style="margin:0 0 10px; padding:12px 14px; background-color:#f9f6ee; border-left:3px solid ${CM_LIVE}; border-radius:4px;">
        <p style="margin:0 0 4px; font-family:'Courier New',Courier,monospace; font-size:9.5px; letter-spacing:0.5px; text-transform:uppercase; color:${CM_MUTED};">${escapeHtmlCM(typeLabel)}${item.extra ? ` · ${escapeHtmlCM(item.extra)}` : ""} · ${escapeHtmlCM(item.item_date || "")}</p>
        <p style="margin:0 0 5px; font-family:Georgia,serif; font-size:14px; color:${CM_HEADING};">${escapeHtmlCM(String(item.title || "").slice(0, 180))}${String(item.title || "").length > 180 ? "…" : ""}</p>
        <p style="margin:0; font-size:12px; color:${CM_BODY};">Not yet announced on: <strong>${escapeHtmlCM(missing)}</strong></p>
      </div>`;
    }
  }

  // ---- Attention: something newly broke ----
  if (newFailures.length) {
    html += `<h2 style="margin:22px 0 10px; font-family:Georgia,serif; font-size:15px; color:${CM_HEADING};"><span style="color:${CM_STAMP};">●</span> Newly unreachable (${newFailures.length}) — verify manually</h2>`;
    for (const r of newFailures) {
      html += cmSourceCard(r.source, CM_STAMP, `
        <p style="margin:0 0 3px; font-size:12.5px; color:${CM_BODY};">${escapeHtmlCM(humanizeFetchError(r.error))}</p>
        <p style="margin:0; font-family:'Courier New',Courier,monospace; font-size:10px; color:${CM_MUTED};">(technical detail: ${escapeHtmlCM(r.error.slice(0, 120))})</p>
      `);
    }
    html += `<p style="margin:10px 0 0; padding:10px 14px; background-color:#f5f0e2; border-radius:4px; font-size:11.5px; color:${CM_MUTED};">A failed fetch is never treated as "no change" — it's surfaced so it can't become a silent blind spot.</p>`;
  }

  // ---- Reassurance, when there genuinely is nothing to do ----
  if (needsAttention === 0) {
    html += `<div style="padding:16px; background-color:#f5f0e2; border-radius:6px; text-align:center;">
      <p style="margin:0; font-family:Georgia,serif; font-size:15px; color:${CM_HEADING};">All quiet.</p>
      <p style="margin:6px 0 0; font-size:12.5px; color:${CM_MUTED};">${unchanged.length ? `${unchanged.length} source${unchanged.length === 1 ? "" : "s"} checked and unchanged` : "No comparisons available yet"}${baseline.length ? `, ${baseline.length} newly baselined` : ""}. Nothing published is waiting to be announced.</p>
    </div>`;
  }

  // ---- Housekeeping: quiet, factual, at the bottom ----
  const notes = [];
  if (knownBlockers.length) {
    // Country alone is ambiguous when one country has several blocked
    // sources — Israel currently has two, and "Israel (9 runs), Israel
    // (9 runs)" tells the reader nothing about which pages are dark.
    const names = knownBlockers.map((r) => {
      const label = r.source.description ? String(r.source.description).split(/\s+[—-]\s+/).pop() : r.source.url;
      return `${escapeHtmlCM(r.source.country)} — ${escapeHtmlCM(String(label).slice(0, 60))} (${r.consecutiveFailures} runs)`;
    });
    notes.push(`<strong>${knownBlockers.length} known blocker${knownBlockers.length === 1 ? "" : "s"}</strong>, unchanged: ${names.join(", ")}. These sites refuse automated visits as a matter of policy, so they're listed rather than re-explained each week — they still need occasional manual checking, and they'd move back up into "newly unreachable" if they ever started working and then broke again.`);
  }
  if (baseline.length) {
    notes.push(`${baseline.length} source${baseline.length === 1 ? "" : "s"} checked for the first time — baseline recorded, nothing to compare against yet.`);
  }
  if (skipped.length) {
    // Distinct countries, not one entry per source: listing "Latvia,
    // Latvia, Latvia" because a country has three tracked sources made
    // the old note look broken.
    const countries = [...new Set(skipped.map((s) => s.country))];
    notes.push(`${skipped.length} source${skipped.length === 1 ? "" : "s"} across ${countries.length} countr${countries.length === 1 ? "y" : "ies"} didn't fit in this run's time budget and are first in the queue next time: ${countries.slice(0, 6).map(escapeHtmlCM).join(", ")}${countries.length > 6 ? `, +${countries.length - 6} more` : ""}.`);
  }
  if (notes.length) {
    html += `<div style="margin:22px 0 0; padding:12px 14px; background-color:#f5f0e2; border-radius:4px;">
      <p style="margin:0 0 6px; font-family:'Courier New',Courier,monospace; font-size:9.5px; letter-spacing:0.5px; text-transform:uppercase; color:${CM_MUTED};">For the record</p>
      ${notes.map((n) => `<p style="margin:0 0 6px; font-size:11.5px; color:${CM_MUTED};">${n}</p>`).join("")}
    </div>`;
  }

  return html;
}

async function runContentMonitor(env, opts) {
  // timeBudgetMs is overridable because the two callers have genuinely
  // different lifetimes: the Monday cron awaits inside scheduled() and
  // gets Cloudflare's 15-minute allowance, while the manual admin
  // trigger runs under waitUntil() after a response and gets far less.
  // See CONTENT_MONITOR_MANUAL_BUDGET_MS.
  const timeBudgetMs = (opts && opts.timeBudgetMs) || CONTENT_MONITOR_TIME_BUDGET_MS;
  const allSources = await getActiveTrackingSources(env);
  if (allSources.length === 0) {
    console.log("Content monitor: no active tracking sources — nothing to check.");
    return;
  }

  // Resume from wherever the previous run's time budget cut it off.
  // The cursor is a source id; find its position in the current
  // (stable, ORDER BY-ed) list and rotate the array to start there —
  // if that source no longer exists (deleted/deactivated since), fall
  // back to the start. This also self-heals if the source list's
  // membership or order changes between runs.
  const storedCursor = await env.CONTENT_MONITOR.get(CONTENT_MONITOR_CURSOR_KEY);
  let startIndex = storedCursor ? allSources.findIndex((s) => String(s.id) === storedCursor) : -1;
  if (startIndex === -1) startIndex = 0;
  const orderedSources = [...allSources.slice(startIndex), ...allSources.slice(0, startIndex)];

  const results = [];
  const skipped = [];
  const runStart = Date.now();
  let stoppedEarly = false;

  for (let i = 0; i < orderedSources.length; i++) {
    if (Date.now() - runStart > timeBudgetMs) {
      skipped.push(...orderedSources.slice(i));
      stoppedEarly = true;
      break;
    }
    const source = orderedSources[i];
    results.push(await checkOneSource(env, source));
    if (i < orderedSources.length - 1) {
      await sleep(CONTENT_MONITOR_FETCH_DELAY_MS); // considerate spacing — see the constant's comment
    }
  }

  // Persist where to resume: the first skipped source next time, or
  // back to the very start if this run made it through everything —
  // so a fully-completing run doesn't leave a stale cursor pointing
  // partway through a list that's since changed.
  const nextCursor = skipped.length > 0 ? String(skipped[0].id) : null;
  if (nextCursor) {
    await env.CONTENT_MONITOR.put(CONTENT_MONITOR_CURSOR_KEY, nextCursor);
  } else {
    await env.CONTENT_MONITOR.delete(CONTENT_MONITOR_CURSOR_KEY);
  }

  const changed = results.filter((r) => r.status === "changed").length;
  const failed = results.filter((r) => r.status === "failed").length;

  // Published-but-unannounced content (migration 503). Wrapped so a
  // problem here can never cost us the source-change digest, which is
  // the part with a real deadline attached.
  let unannounced = [];
  try {
    unannounced = await getUnannouncedItems(env);
  } catch (err) {
    console.log(`Content monitor: could not load unannounced items — ${err && err.message || err}`);
  }

  console.log(`Content monitor: ${results.length}/${allSources.length} checked (${skipped.length} deferred to next run), ${changed} changed, ${failed} failed, ${unannounced.length} awaiting announcement.`);

  // Subject line leads with what needs doing. The old one always read
  // as a tally of problems ("0 changed, 2 failed, 107 deferred") even
  // on a healthy week, which is exactly backwards for an inbox.
  const attention = changed + unannounced.length;
  const subject = attention === 0
    ? `[Content Monitor] All quiet — week of ${new Date().toISOString().slice(0, 10)}`
    : `[Content Monitor] ${[changed ? `${changed} changed` : null, unannounced.length ? `${unannounced.length} to announce` : null].filter(Boolean).join(", ")} — week of ${new Date().toISOString().slice(0, 10)}`;

  const footerHtml = `<p style="margin:0; font-family:'Courier New',Courier,monospace; font-size:10.5px; color:${CM_MUTED};">Internal monitoring only — never sent to subscribers. Sources: <a href="https://e-invoicingcompliancecorner.com/sources" style="color:${CM_MUTED};">the tracking sources page</a>.</p>`;
  await sendViaResend(env, {
    from: env.FROM_EMAIL,
    to: env.CONTENT_MONITOR_EMAIL,
    subject,
    html: buildEmailShell(buildDigestHtml(results, allSources.length, skipped, unannounced), footerHtml, CM_HEADER_HTML),
  });
}

async function handleManualContentMonitorTrigger(request, env, ctx) {
  // Same shared-secret guard as the monthly notification's manual
  // trigger — not linked anywhere, exists for testing without waiting
  // for Monday.
  const provided = request.headers.get("X-Admin-Secret");
  if (!provided || provided !== env.SESSION_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  // Fire-and-forget, because blocking the HTTP response on a multi-
  // minute sweep would look exactly like a hang and risks the request
  // timing out before the job finishes.
  //
  // BUT this path runs under ctx.waitUntil() AFTER a response has been
  // sent, which only gets a short grace period — unlike the cron path,
  // which now awaits its promise inside scheduled() and gets
  // Cloudflare's documented 15 minutes. So the manual trigger CANNOT
  // safely use the full CONTENT_MONITOR_TIME_BUDGET_MS: it would be
  // killed mid-run, which is precisely the failure the cron path was
  // just fixed for. It gets its own short budget instead and checks a
  // slice, relying on the same KV cursor as everything else so the
  // next run continues from where it stopped.
  //
  // (Caught 10 Aug 2026, immediately after raising the cron budget from
  // 20s to 8 minutes — the change fixed the scheduled path and silently
  // broke this one. Worth remembering that these two callers have
  // genuinely different lifetimes and always did.)
  ctx.waitUntil(runContentMonitor(env, { timeBudgetMs: CONTENT_MONITOR_MANUAL_BUDGET_MS }));
  return new Response(
    "Content monitor run started in the background. NOTE: a manual run deliberately checks only a slice of the sources (~20 seconds' worth), because this path runs after the HTTP response and doesn't get the full time budget the Monday cron does. It advances the same cursor, so the next run picks up where this one stopped. Watch `wrangler tail` for progress; a digest email is sent when the slice completes.",
    { status: 202 }
  );
}

// ================================================================
// MONTHLY NOTIFICATION JOB — the core of the country-tailored alert
// ================================================================
// Does NOT email the full newsletter content. Sends a short, honest
// notification telling each subscriber whether this month's issue
// covers any of the countries they've said they care about, with a
// link to log in and read the full thing either way.
async function getStoriesForMonth(env, monthKey) {
  const stories = await d1All(env, `
    SELECT s.id, COALESCE(st.title, NULL) as title_translated, s.html_en
    FROM stories s
    LEFT JOIN story_translations st ON st.story_id = s.id AND st.lang = 'en'
    WHERE s.month = ? AND s.published = 1
    ORDER BY s.date ASC
  `, monthKey);
  if (stories.length === 0) return [];

  const countryRows = await d1All(env, `
    SELECT sc.story_id, c.name_en
    FROM story_countries sc
    JOIN stories s ON s.id = sc.story_id
    JOIN countries c ON c.id = sc.country_id
    WHERE s.month = ?
  `, monthKey);
  const countriesByStory = {};
  for (const row of countryRows) {
    (countriesByStory[row.story_id] ||= []).push(row.name_en);
  }

  return stories.map((s) => ({
    id: s.id,
    title: s.title_translated || deriveTitleFromHtml(s.html_en),
    countries: countriesByStory[s.id] || [],
  }));
}

// ---- Monthly notification run: budget, spacing and resumability ----
//
// This job was the last caller still handing its work to
// ctx.waitUntil() from scheduled(), and it carried a worse version of
// the bug the content monitor had (fixed 10 Aug 2026): the monitor at
// least polices its own clock and persists a cursor, so a truncated run
// self-heals. This one had neither. If it ran out of time, every
// subscriber past that point silently received nothing that month, with
// no record of who had been reached and no way to resume.
//
// Three protections, mirroring the monitor's:
const MONTHLY_TIME_BUDGET_MS = 600000;   // 10 min, under Cloudflare's documented 15-min scheduled-handler limit
const MONTHLY_MANUAL_BUDGET_MS = 20000;  // the admin trigger runs under a request, not the cron — same reason as the monitor's
const MONTHLY_SEND_SPACING_MS = 150;     // ~6.7/s, comfortably under Resend's 10/s, leaving headroom for magic-link email happening concurrently
// Small pages so the between-page checkpoint comes round often. KV's
// default page size is far larger; at that size a truncated run would
// overshoot its budget by many minutes before reaching a safe place to
// stop. 50 x 150ms spacing is roughly 8 seconds of overshoot at worst.
const MONTHLY_LIST_PAGE_SIZE = 50;
// State lives in the CONTENT_MONITOR namespace rather than SUBSCRIBERS
// ON PURPOSE, and this is load-bearing: the run below iterates
// SUBSCRIBERS with .list() and treats every key name as an email
// address. A state key stored there would be picked up as a subscriber
// and mailed. Despite its name, CONTENT_MONITOR is just this Worker's
// general-purpose KV store.
const monthlyStateKey = (monthKey, suffix) => `monthly:${monthKey}:${suffix}`;

async function sendMonthlyNotifications(env, opts) {
  const timeBudgetMs = (opts && opts.timeBudgetMs) || MONTHLY_TIME_BUDGET_MS;
  const monthKey = currentMonthKey();
  const monthStories = await getStoriesForMonth(env, monthKey);
  if (monthStories.length === 0) {
    console.log(`No stories published for ${monthKey} yet — skipping this month's notification run.`);
    return;
  }

  // Already finished this month? Stop. Without this, a second trigger
  // (a manual test, or a cron retry) re-emails everyone who already
  // received it. Pass { force: true } to override deliberately.
  const doneMarker = await env.CONTENT_MONITOR.get(monthlyStateKey(monthKey, "done"));
  if (doneMarker && !(opts && opts.force)) {
    console.log(`Monthly notification for ${monthKey} already completed on ${doneMarker} — nothing to do. Pass force to re-send.`);
    return;
  }

  // Resume from where a previous truncated run stopped, so the tail of
  // the subscriber list is not silently skipped.
  const savedCursor = await env.CONTENT_MONITOR.get(monthlyStateKey(monthKey, "cursor"));
  let cursor = savedCursor || undefined;
  let sent = parseInt(await env.CONTENT_MONITOR.get(monthlyStateKey(monthKey, "sent")) || "0", 10) || 0;
  const sentAtStart = sent;
  let failed = 0;
  let ranOutOfTime = false;
  const runStart = Date.now();
  if (savedCursor) console.log(`Monthly notification for ${monthKey}: resuming a previous run (${sent} already sent).`);

  // The budget is checked at PAGE BOUNDARIES ONLY, never mid-page, and
  // this is not a rounding convenience — it is a correctness
  // requirement. A KV list cursor points at the start of a page, so
  // stopping halfway through one and saving `cursor` would resume at
  // the top of that same page and re-email everyone already reached in
  // it. (Caught by a control-flow harness before this shipped: an
  // earlier draft did exactly that and double-sent 120 of 160
  // deliveries.) Pages are deliberately small so a boundary comes round
  // often enough for the checkpoint to be meaningful.
  do {
    const list = await env.SUBSCRIBERS.list({ cursor, limit: MONTHLY_LIST_PAGE_SIZE });
    for (const key of list.keys) {
      const email = key.name;
      try {
        const sub = await getSubscriber(env, email);
        if (!sub || !sub.active) continue;
        if (sub.plan === "onetime" && sub.expiresAt && Date.now() > sub.expiresAt) continue;
        if (sub.notificationsEnabled === false) continue; // explicit opt-out only — default is enabled

        const followed = sub.countries || [];
        const matched = followed.length
          ? monthStories.filter((s) => s.countries.some((c) => followed.includes(c)))
          : [];

        // The genuine upgrade over the old blob-per-month model: this can
        // now name the actual matching story headlines and link straight
        // to each, rather than a vague "yes/no, your countries came up."
        let storiesToShow;
        let introText;
        if (followed.length === 0) {
          storiesToShow = monthStories;
          introText = "Here's everything published this month:";
        } else if (matched.length > 0) {
          storiesToShow = matched;
          introText = "Here's what came up in your countries this month:";
        } else {
          storiesToShow = monthStories;
          introText = "None of your followed countries came up this month, but here's everything that was published:";
        }

        const unsubToken = await signToken(env.SESSION_SECRET, { email, purpose: "unsub-notifications" }, 60 * 60 * 24 * 365 * 5); // 5-year effective validity — this link should still work whenever someone gets around to clicking it
        // Same convenience-link treatment as the welcome email's archive
        // button (see CONVENIENCE_LINK_TTL_SECONDS): logs the subscriber
        // in and lands them on the archive, rather than a bare URL that
        // only works today because of the temporary ARCHIVE_PUBLIC promo.
        const archiveToken = await signToken(env.SESSION_SECRET, { email, purpose: "login" }, CONVENIENCE_LINK_TTL_SECONDS);
        const archiveLink = `${env.SITE_URL}/members/verify?token=${encodeURIComponent(archiveToken)}&next=${encodeURIComponent("/members/archive")}`;
        const ok = await sendMonthlyNotificationEmail(env, email, monthKey, introText, storiesToShow, unsubToken, archiveLink);
        if (ok === false) failed++; else sent++;
        // Pace the loop so a large list cannot trip Resend's 10/s cap.
        await sleep(MONTHLY_SEND_SPACING_MS);
      } catch (err) {
        failed++;
        console.error(`Failed to notify ${email}:`, err);
        // Deliberately continue to the next subscriber rather than aborting
        // the whole run over one failure.
      }
    }
    cursor = list.list_complete ? undefined : list.cursor;
    // Checkpoint every page, not only when stopping — if the run is
    // hard-killed rather than stopping cleanly, the next one still
    // resumes from the last completed page instead of the beginning.
    if (cursor) {
      await env.CONTENT_MONITOR.put(monthlyStateKey(monthKey, "cursor"), cursor);
      await env.CONTENT_MONITOR.put(monthlyStateKey(monthKey, "sent"), String(sent));
      if (Date.now() - runStart > timeBudgetMs) {
        ranOutOfTime = true;
        break;
      }
    }
  } while (cursor);

  const completed = !ranOutOfTime;

  if (completed) {
    await env.CONTENT_MONITOR.delete(monthlyStateKey(monthKey, "cursor"));
    await env.CONTENT_MONITOR.delete(monthlyStateKey(monthKey, "sent"));
    // 70-day TTL: long enough that a re-trigger inside the same month is
    // still blocked, short enough that these markers do not accumulate.
    await env.CONTENT_MONITOR.put(monthlyStateKey(monthKey, "done"), new Date().toISOString(), { expirationTtl: 60 * 60 * 24 * 70 });
    console.log(`Monthly notification run for ${monthKey} COMPLETE — ${sent} sent, ${failed} failed.`);
  } else {
    // Persist progress so the next invocation resumes rather than
    // starting over (which would double-send) or giving up (which would
    // silently skip the tail of the list).
    await env.CONTENT_MONITOR.put(monthlyStateKey(monthKey, "cursor"), cursor || "");
    await env.CONTENT_MONITOR.put(monthlyStateKey(monthKey, "sent"), String(sent));
    console.log(`Monthly notification run for ${monthKey} TRUNCATED by the ${Math.round(timeBudgetMs / 1000)}s budget — ${sent} sent so far (${sent - sentAtStart} this pass), ${failed} failed. Cursor saved; re-trigger to continue.`);
  }

  // Record what subscribers were actually told about, so the weekly
  // digest's "not yet announced" section stays true without anyone
  // maintaining it by hand (migration 503).
  //
  // Gated on the run genuinely COMPLETING, not merely on sent > 0. An
  // earlier version used the latter, which was wrong in exactly the way
  // its own comment claimed to avoid: one successful email out of a
  // truncated run would mark every story as announced, even though most
  // subscribers never received it. Under-recording is the safe
  // direction — a re-announced story is a small annoyance, a falsely
  // recorded one is a silent gap in the very signal this exists to give.
  if (completed && sent > 0) {
    await recordAnnouncements(env, "story", monthStories.map((s) => s.id), "newsletter", `monthly notification, ${monthKey}, ${sent} recipient(s)`);
  }
}

function currentMonthKey() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

async function handleManualNotificationTrigger(request, env) {
  // Deliberately requires a shared secret passed as a header, since this
  // route isn't linked from anywhere and would otherwise let anyone trigger
  // a real send to your whole subscriber list.
  const provided = request.headers.get("X-Admin-Secret");
  if (!provided || provided !== env.SESSION_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  // Awaited inside a request handler, so it must use the SHORT budget —
  // a 10-minute send would hold the HTTP connection open long past any
  // sensible client timeout. It sends a slice and saves its cursor, so
  // repeating this call continues the run; the cron picks up the
  // remainder either way.
  //
  // ?force=1 re-sends a month already marked complete. Off by default
  // because the obvious accident here is emailing every subscriber
  // twice, which is not recoverable by apologising to a log file.
  const force = new URL(request.url).searchParams.get("force") === "1";
  await sendMonthlyNotifications(env, { timeBudgetMs: MONTHLY_MANUAL_BUDGET_MS, force });
  return new Response(
    "Monthly notification run triggered. NOTE: a manual run sends only a slice (~20 seconds' worth) because it runs inside an HTTP request, and saves a cursor — call it again to continue, or let the monthly cron finish the rest. Check `wrangler tail` for progress. Add ?force=1 to re-send a month already marked complete.",
    { status: 200 }
  );
}

async function handleUnsubscribeNotifications(request, env, lang) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  const payload = await verifyToken(env.SESSION_SECRET, token);

  if (!payload || payload.purpose !== "unsub-notifications") {
    return htmlResponse(renderSimpleMessage(t(lang, "invalidUnsub.title"), t(lang, "invalidUnsub.body"), lang));
  }

  const existing = await getSubscriber(env, payload.email);
  await putSubscriber(env, payload.email, { ...(existing || {}), notificationsEnabled: false, updated: Date.now() });

  return htmlResponse(renderSimpleMessage(t(lang, "unsubscribed.title"), t(lang, "unsubscribed.body"), lang));
}

// ================================================================
// LEMON SQUEEZY WEBHOOK — keeps SUBSCRIBERS KV in sync automatically
// ================================================================
async function handleWebhook(request, env) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Signature") || "";
  const valid = await verifyHmacSha256Hex(env.LEMONSQUEEZY_WEBHOOK_SECRET, rawBody, signature);
  if (!valid) return new Response("Invalid signature", { status: 401 });

  const payload = JSON.parse(rawBody);
  const eventName = payload.meta?.event_name;
  const attrs = payload.data?.attributes || {};
  const email = (attrs.user_email || attrs.customer_email || "").toLowerCase().trim();
  if (!email) return new Response("No email in payload — ignored", { status: 200 });

  // Country-of-interest selection, passed through checkout as custom data
  // (checkout[custom][countries]=A,B,C on the subscribe page). Empty string
  // or missing means "no specific preference — send the full digest."
  const customData = payload.meta?.custom_data || {};
  const countriesRaw = (customData.countries || "").toString().trim();
  const countries = countriesRaw ? countriesRaw.split(",").map((c) => c.trim()).filter(Boolean) : [];

  const RECURRING_ACTIVE_EVENTS = [
    "subscription_created",
    "subscription_updated",
    "subscription_payment_success",
    "subscription_unpaused",
    "subscription_payment_recovered",
  ];
  const RECURRING_INACTIVE_EVENTS = [
    "subscription_cancelled",
    "subscription_expired",
    "subscription_payment_failed",
    "subscription_paused",
  ];

  if (RECURRING_ACTIVE_EVENTS.includes(eventName)) {
    // "cancelled" subscriptions can still be status:"cancelled" but paid through
    // to a future date — Lemon Squeezy's own `status` field is the source of truth.
    const status = attrs.status || "";
    const active = ["active", "on_trial", "cancelled", "past_due"].includes(status)
      ? (status !== "past_due") // treat past_due as temporarily inactive until it recovers or fails outright
      : false;
    const existing = await getSubscriber(env, email);
    // Only overwrite `countries` if this event actually carried a selection —
    // renewal/update events won't repeat the original checkout's custom data,
    // so we preserve whatever was captured at signup unless a new value arrives.
    const resolvedCountries = countriesRaw ? countries : (existing?.countries || []);
    // Preserve trial history across the trial-to-paid conversion — this is
    // what actually enforces "one free trial per email," since a fresh
    // record here would otherwise silently erase that someone already had one.
    const trialHistory = existing?.hadTrial
      ? { hadTrial: true, trialStartedAt: existing.trialStartedAt, trialSignupIp: existing.trialSignupIp }
      : {};
    await putSubscriber(env, email, { active, plan: "recurring", countries: resolvedCountries, ...trialHistory, updated: Date.now() });
  } else if (RECURRING_INACTIVE_EVENTS.includes(eventName)) {
    const existing = await getSubscriber(env, email);
    await putSubscriber(env, email, { ...(existing || {}), active: false, updated: Date.now() });
  } else if (eventName === "order_created") {
    // One-time purchase. Only treat as an active grant if it matches your
    // configured one-time product variant — everything else is ignored here.
    const variantId = String(attrs.first_order_item?.variant_id || "");
    if (env.ONE_TIME_VARIANT_ID && variantId === env.ONE_TIME_VARIANT_ID) {
      const existing = await getSubscriber(env, email);
      const trialHistory = existing?.hadTrial
        ? { hadTrial: true, trialStartedAt: existing.trialStartedAt, trialSignupIp: existing.trialSignupIp }
        : {};
      const purchasedAt = Date.now();
      const expiresAt = purchasedAt + 365 * 24 * 60 * 60 * 1000; // 12 months
      await putSubscriber(env, email, { active: true, plan: "onetime", countries, ...trialHistory, purchasedAt, expiresAt });
    }
  }

  return new Response("OK", { status: 200 });
}

async function putSubscriber(env, email, data) {
  await env.SUBSCRIBERS.put(email.toLowerCase().trim(), JSON.stringify(data));
}
// ================================================================
// D1 — newsletter stories (replacing the old ISSUES KV blob-per-month
// model with individual, country-tagged, continuously-published
// stories). See NEWSLETTER-ARCHIVE-REDESIGN.md and D1-MIGRATION-PLAN.md.
// Countries/translations chrome still lives in KV/JSON as before —
// this is scoped to stories only, per the decision to focus there first.
// ================================================================
async function d1All(env, sql, ...params) {
  const stmt = params.length ? env.eicc_content.prepare(sql).bind(...params) : env.eicc_content.prepare(sql);
  const { results } = await stmt.all();
  return results;
}

async function d1First(env, sql, ...params) {
  const stmt = params.length ? env.eicc_content.prepare(sql).bind(...params) : env.eicc_content.prepare(sql);
  return await stmt.first();
}

// The country-of-interest picker's data (the preferences page's region-
// grouped checkboxes), loaded from D1 — the single source of truth for
// which countries exist, which region each is in, and each one's
// translated display name. in_picker = 0 rows (European Union, an
// umbrella tagging entity for EU-wide stories rather than a subscribable
// jurisdiction) are excluded, matching countries.js's subscribe-page
// picker. Ordered by canonical English name within each region — the
// same ordering the old hardcoded lists had — so non-English pages show
// translated labels in English alphabetical order, exactly as before.
// Returns [{ region, countries: [{ englishName, displayName }] }] in
// REGION_ORDER presentation order.
async function loadCountryPicker(env, lang) {
  const rows = await d1All(env, `
    SELECT c.name_en, c.region, COALESCE(ct.display_name, c.name_en) AS display_name
    FROM countries c
    LEFT JOIN country_translations ct ON ct.country_id = c.id AND ct.lang = ?
    WHERE c.in_picker = 1
    ORDER BY c.name_en
  `, lang);
  const byRegion = {};
  for (const r of rows) {
    (byRegion[r.region] ||= []).push({ englishName: r.name_en, displayName: r.display_name });
  }
  const orderedRegions = [
    ...REGION_ORDER.filter((r) => byRegion[r]),
    ...Object.keys(byRegion).filter((r) => !REGION_ORDER.includes(r)),
  ];
  return orderedRegions.map((region) => ({ region, countries: byRegion[region] }));
}

async function getStoriesWithCountries(env, lang) {
  // One story can have several countries (a handful of genuinely
  // cross-cutting stories do) — fetched separately and grouped, rather
  // than a join that would duplicate story rows per country.
  const stories = await d1All(env, `
    SELECT s.id, s.date, s.month, s.source_url,
           COALESCE(st.title, NULL) as title_translated,
           COALESCE(st.summary, s.summary_en) as summary,
           COALESCE(st.html, s.html_en) as html
    FROM stories s
    LEFT JOIN story_translations st ON st.story_id = s.id AND st.lang = ?
    WHERE s.published = 1
    ORDER BY s.date DESC
  `, lang);

  const countryRows = await d1All(env, `
    SELECT sc.story_id, c.region, c.name_en, COALESCE(ct.display_name, c.name_en) as name
    FROM story_countries sc
    JOIN countries c ON c.id = sc.country_id
    LEFT JOIN country_translations ct ON ct.country_id = c.id AND ct.lang = ?
  `, lang);

  const countriesByStory = {};
  const regionByCountryName = {};
  const englishNameByDisplayName = {};
  for (const row of countryRows) {
    (countriesByStory[row.story_id] ||= []).push(row.name);
    regionByCountryName[row.name] = row.region;
    englishNameByDisplayName[row.name] = row.name_en;
  }

  const storiesOut = stories.map((s) => ({
    id: s.id,
    date: s.date,
    title: s.title_translated || deriveTitleFromHtml(s.html),
    summary: s.summary,
    html: s.html,
    sourceUrl: s.source_url,
    countries: countriesByStory[s.id] || [],
  }));

  return { stories: storiesOut, regionByCountryName, englishNameByDisplayName };
}

function deriveTitleFromHtml(html) {
  // Story titles aren't stored as their own column on `stories` itself
  // (only in story_translations, which every story has an 'en' row in)
  // — this is a defensive fallback only, in case a future story is ever
  // inserted without a translation row at all.
  const match = /<h3>(?:[^<a-zA-Z]*)([^<]+)<\/h3>/.exec(html || "");
  return match ? match[1].trim() : "Untitled";
}

async function getSubscriber(env, email) {
  const raw = await env.SUBSCRIBERS.get(email.toLowerCase().trim());
  return raw ? JSON.parse(raw) : null;
}
async function isCurrentlyActive(env, email) {
  const sub = await getSubscriber(env, email);
  if (!sub || !sub.active) return false;
  if ((sub.plan === "onetime" || sub.plan === "trial") && sub.expiresAt && Date.now() > sub.expiresAt) return false;
  return true;
}

// ================================================================
// LOGIN — passwordless magic link
// ================================================================
async function handleLoginRequest(request, env, lang) {
  const form = await request.formData();
  const email = (form.get("email") || "").toString().toLowerCase().trim();
  const requestedNext = (form.get("next") || "").toString();
  const next = isSafeVerifyNextPath(requestedNext) ? requestedNext : "";

  if (!email || !email.includes("@")) {
    return htmlResponse(renderLoginPage(t(lang, "login.errorInvalid"), lang, next));
  }

  const active = await isCurrentlyActive(env, email);
  // Always show the same confirmation regardless of whether the email is an
  // active subscriber — this avoids revealing which emails are/aren't customers.
  if (active) {
    const token = await signToken(env.SESSION_SECRET, { email, purpose: "login" }, MAGIC_LINK_TTL_SECONDS);
    const link = `${env.SITE_URL}/members/verify?token=${encodeURIComponent(token)}${lang !== "en" ? `&lang=${lang}` : ""}${next ? `&next=${encodeURIComponent(next)}` : ""}`;
    await sendMagicLinkEmail(env, email, link);
  }

  return htmlResponse(renderCheckEmailPage(lang));
}

// Despite the function/route name (kept as-is to avoid touching the
// working endpoint URL that subscribe.html's form already posts to),
// this no longer grants a time-limited trial -- as of 2 August 2026,
// Dan is going live with free sign-ups and deliberately deferring any
// paid plan to an unspecified later date, once there's a critical
// mass of subscribers (see PROGRESS.md). So this now grants ongoing
// free access with no expiry: notably, no `expiresAt` is set below.
// isCurrentlyActive() only expires an account when BOTH its plan is
// "onetime"/"trial" AND it has an expiresAt set -- omitting expiresAt
// here is what makes these accounts simply never expire.
async function handleStartTrial(request, env, lang) {
  const form = await request.formData();
  const email = (form.get("email") || "").toString().toLowerCase().trim();
  const countriesRaw = (form.get("countries") || "").toString().trim();
  const countries = countriesRaw ? countriesRaw.split(",").map((c) => c.trim()).filter(Boolean) : [];

  if (!email || !email.includes("@")) {
    return htmlResponse(renderLoginPage(t(lang, "login.errorInvalid"), lang));
  }

  const existing = await getSubscriber(env, email);

  // One free sign-up per email, permanently -- this is the actual
  // blocking mechanism (the `hadTrial` field name predates this
  // change and is kept as-is to avoid touching the Lemon Squeezy
  // webhook handler's own references to it, but it now just means
  // "has already signed up" rather than anything trial-specific). IP
  // address is logged alongside the record for visibility into any
  // organised abuse patterns, but isn't used to block on its own,
  // since a shared office/coffee-shop IP would otherwise wrongly lock
  // out a genuinely different second customer.
  if (existing?.hadTrial) {
    return htmlResponse(renderTrialAlreadyUsedPage(lang));
  }

  const trialStartedAt = Date.now();
  const signupIp = request.headers.get("CF-Connecting-IP") || "";

  await putSubscriber(env, email, {
    active: true,
    plan: "free",
    countries,
    hadTrial: true,
    trialStartedAt,
    trialSignupIp: signupIp,
    // No expiresAt -- see the function comment above.
    // Now that the Lemon Squeezy checkout step (the only other place
    // that used to collect these) is gone, the sign-up form's own
    // firstName/lastName/jobTitle/company fields are stored directly
    // here instead, rather than being collected and then discarded.
    firstName: (form.get("firstName") || "").toString().trim(),
    lastName: (form.get("lastName") || "").toString().trim(),
    jobTitle: (form.get("jobTitle") || "").toString().trim(),
    company: (form.get("company") || "").toString().trim(),
  });

  // The welcome email's "archive" and "preferences" links use a
  // separate, longer-lived login token (see CONVENIENCE_LINK_TTL_SECONDS)
  // rather than a bare /members/... URL -- both pages are session-gated
  // (archive only appears open today because of the temporary
  // ARCHIVE_PUBLIC promo; preferences always requires a session), so a
  // bare link would silently stop working the moment this is read from
  // a browser without an active session, or once the promo ends. These
  // links log the subscriber in AND land them on the right page,
  // working the same way regardless of promo state or how long ago
  // they signed up (within the 7-day window).
  const convenienceToken = await signToken(env.SESSION_SECRET, { email, purpose: "login" }, CONVENIENCE_LINK_TTL_SECONDS);
  const archiveLink = `${env.SITE_URL}/members/verify?token=${encodeURIComponent(convenienceToken)}&next=${encodeURIComponent("/members/archive")}`;
  const prefsLink = `${env.SITE_URL}/members/verify?token=${encodeURIComponent(convenienceToken)}&next=${encodeURIComponent("/members/preferences")}`;

  // Two separate emails, sent in this order so the magic link -- the
  // one thing they actually need to act on right now, with a 15-minute
  // clock -- lands as the newest message in their inbox, sitting above
  // the welcome email rather than being buried under it.
  await sendWelcomeEmail(env, email, (form.get("firstName") || "").toString().trim(), countries, archiveLink, prefsLink);

  const token = await signToken(env.SESSION_SECRET, { email, purpose: "login" }, MAGIC_LINK_TTL_SECONDS);
  const link = `${env.SITE_URL}/members/verify?token=${encodeURIComponent(token)}${lang !== "en" ? `&lang=${lang}` : ""}`;
  await sendMagicLinkEmail(env, email, link);

  return htmlResponse(renderCheckEmailPage(lang));
}

async function handleVerify(request, env, lang) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  const payload = await verifyToken(env.SESSION_SECRET, token);

  if (!payload || payload.purpose !== "login") {
    return htmlResponse(renderLoginPage(t(lang, "login.errorExpired"), lang));
  }

  const active = await isCurrentlyActive(env, payload.email);
  if (!active) {
    return htmlResponse(renderLoginPage(t(lang, "login.errorNoActive"), lang));
  }

  const sessionToken = await signToken(env.SESSION_SECRET, { email: payload.email, purpose: "session" }, SESSION_TTL_SECONDS);
  const requestedNext = url.searchParams.get("next") || "";
  const redirectTo = isSafeVerifyNextPath(requestedNext) ? requestedNext : "/members/archive";
  const headers = new Headers();
  headers.set("Location", redirectTo);
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`
  );
  return new Response(null, { status: 302, headers });
}

function handleLogout() {
  const headers = new Headers();
  headers.set("Location", "/members");
  headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return new Response(null, { status: 302, headers });
}

// ================================================================
// GATED ARCHIVE
// ================================================================
async function requireSession(request, env) {
  const { value: cookie } = getCookie(request, SESSION_COOKIE);
  if (!cookie) return null;
  const payload = await verifyToken(env.SESSION_SECRET, cookie);
  if (!payload || payload.purpose !== "session") return null;
  const active = await isCurrentlyActive(env, payload.email);
  if (!active) return null;
  return payload.email;
}

async function handleArchiveList(request, env, lang) {
  let email = await requireSession(request, env);
  if (!email) {
    // Temporary promo (see ARCHIVE_PUBLIC in wrangler.toml): let
    // anonymous visitors browse the archive read-only, rather than
    // bouncing them to the login page, while it's turned on.
    if (env.ARCHIVE_PUBLIC === "true") {
      email = null;
    } else {
      return redirectToLogin();
    }
  }

  const { stories, regionByCountryName, englishNameByDisplayName } = await getStoriesWithCountries(env, lang);
  const preferredCountries = email ? (await getSubscriber(env, email))?.countries || [] : [];

  return htmlResponse(renderArchiveList(stories, regionByCountryName, englishNameByDisplayName, preferredCountries, email, lang));
}

async function handleArchiveIssue(request, env, slug, lang) {
  let email = await requireSession(request, env);
  if (!email) {
    if (env.ARCHIVE_PUBLIC === "true") {
      email = null;
    } else {
      return redirectToLogin();
    }
  }

  const row = await d1First(env, `
    SELECT s.id, s.date, s.source_url,
           COALESCE(st.title, NULL) as title_translated,
           COALESCE(st.summary, s.summary_en) as summary,
           COALESCE(st.html, s.html_en) as html
    FROM stories s
    LEFT JOIN story_translations st ON st.story_id = s.id AND st.lang = ?
    WHERE s.id = ? AND s.published = 1
  `, lang, slug);
  if (!row) return new Response("Story not found", { status: 404 });

  const countryRows = await d1All(env, `
    SELECT c.name_en, c.slug AS deep_dive_slug, COALESCE(ct.display_name, c.name_en) as name
    FROM story_countries sc
    JOIN countries c ON c.id = sc.country_id
    LEFT JOIN country_translations ct ON ct.country_id = c.id AND ct.lang = ?
    WHERE sc.story_id = ?
  `, lang, slug);

  const story = {
    id: row.id,
    date: row.date,
    title: row.title_translated || deriveTitleFromHtml(row.html),
    html: row.html,
    sourceUrl: row.source_url,
    countries: countryRows.map((r) => ({ displayName: r.name, englishName: r.name_en, deepDiveSlug: r.deep_dive_slug })),
  };

  return htmlResponse(renderIssue(story, email, lang));
}

// ================================================================
// INSIGHTS — gated full-content view. The public teaser lives on the
// root domain (site-worker's /insights/<slug>, D1-rendered, no login
// wall — see shared/resources-render.mjs and migration 338). THIS
// route only ever renders when requireSession()+isCurrentlyActive()
// both pass, exactly like the gated archive above — same session
// cookie, same "server genuinely withholds the content" contract
// (not a client-side hide). No ARCHIVE_PUBLIC-style promo exception
// here: Insights pieces are either open (gated = 0 in the DB, so the
// public page already showed the full body and a reader never needs
// this route at all) or genuinely subscriber-only.
// ================================================================
// The unlocked ROI & Wave Planner. Two things a session buys that an
// anonymous visitor genuinely cannot have: the results panel, and the
// reader's own saved countries pulled straight from their preferences —
// the same list the archive filter and the preferences page already use,
// so nobody has to tell us their footprint twice.
async function handleRoiCalculator(request, env, lang) {
  const email = await requireSession(request, env);
  if (!email) return redirectToLogin("/members/roi-calculator");

  let subscribed = [];
  try {
    const sub = await getSubscriber(env, email);
    subscribed = Array.isArray(sub && sub.countries) ? sub.countries : [];
  } catch (err) {
    // Never let a preferences lookup failure cost the reader the tool.
    console.log(`ROI calculator: could not load saved countries for ${email}: ${err && err.message || err}`);
  }

  const [countries, benchmarks, phases, strings] = await Promise.all([
    sharedGetRoiCountries(env.eicc_content),
    sharedGetRoiBenchmarks(env.eicc_content, lang),
    sharedGetRoiPhases(env.eicc_content, lang),
    sharedGetRoiStrings(env.eicc_content, lang),
  ]);

  const { body, script } = sharedRenderRoiPage({
    countries, benchmarks, phases, strings,
    locked: false,
    subscribed,
    signedInAs: email,
  });

  const page = `
  <div class="topbar">
    <a class="back-link" href="https://e-invoicingcompliancecorner.com/roi-calculator" style="margin:0;">${t(lang, "backToTracker")}</a>
    <form method="POST" action="/members/logout"><button type="submit" class="logout-btn">${t(lang, "logout")}</button></form>
  </div>
  ${body}`;
  return htmlResponse(pageShell(page, lang, ROI_STYLE) + `<script>${script}</script>`);
}

async function handleArticleFull(request, env, slug, lang) {
  const email = await requireSession(request, env);
  if (!email) return redirectToLogin(`/members/insights/${slug}`);

  const article = await sharedGetArticleBySlug(env.eicc_content, slug, lang);
  if (!article) return new Response("Not found", { status: 404 });

  const fragment = sharedRenderArticleFragment(article, lang, { locked: false, unlockUrl: "" });
  const body = `
  <div class="topbar">
    <a class="back-link" href="https://e-invoicingcompliancecorner.com/insights" style="margin:0;">${t(lang, "backToTracker")}</a>
    <form method="POST" action="/members/logout"><button type="submit" class="logout-btn">${t(lang, "logout")}</button></form>
  </div>
  <div class="wrap">
    <div class="card">
      <p class="eyebrow">${t(lang, "archive.signedInAs")} ${escapeHtml(email)}</p>
      ${fragment}
    </div>
  </div>`;
  return htmlResponse(pageShell(body, lang, INSIGHTS_STYLE));
}

// ---------------------------------------------------------------
// PROOF-OF-CONCEPT: dynamic milestones, queried live from D1, fed
// into two genuinely different templates -- the tracker's own card
// style, and the deep-dive page's timeline style. Not yet wired into
// the real tracker or deep-dive pages (those are still static Pages
// files) -- this is a preview route for verifying the architecture
// before committing to the full migration and cutover.
// ---------------------------------------------------------------
function renderTrackerStyleMilestones(milestones, countryName) {
  const active = milestones.filter((m) => !m.anchor);
  const established = milestones.filter((m) => m.anchor);

  const card = (m) => `
    <div style="background:#1c2c48; border:1px solid #2b3c5a; border-radius:10px; padding:16px 20px; margin-bottom:12px;">
      <div style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:#93a3c0; margin-bottom:6px;">${escapeHtml(m.date)}</div>
      <div style="font-weight:600; margin-bottom:6px; color:#f2f0e8;">${escapeHtml(m.system)}</div>
      <p style="color:#93a3c0; font-size:13.5px; margin:0 0 8px;">${escapeHtml(m.desc)}</p>
      ${m.actions.length ? `<ul style="margin:8px 0 0; padding-left:18px; color:#c3ceE0; font-size:13px;">${m.actions.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>` : ""}
    </div>`;

  return `
    <h3 style="color:#f2f0e8; font-family:'IBM Plex Mono',monospace; text-transform:uppercase; font-size:13px;">Recent &amp; Upcoming — ${escapeHtml(countryName)}</h3>
    ${active.map(card).join("")}
    <details style="margin-top:16px;">
      <summary style="color:#93a3c0; font-family:'IBM Plex Mono',monospace; font-size:12px; cursor:pointer;">Established regulations (${established.length})</summary>
      <div style="margin-top:10px;">${established.map(card).join("")}</div>
    </details>`;
}

// Deep-dive-style rendering: matches portugal.html's actual timeline
// section CSS classes (.rtimeline, .rmonth-marker, .rcard, .rbadge) —
// same underlying milestone data, genuinely different template.
async function handleDeepDivePreview(request, env, lang) {
  const url = new URL(request.url);
  const countryName = url.searchParams.get("country") || "Portugal";

  const countryRow = await d1First(env, `SELECT code, region FROM countries WHERE name_en = ?`, countryName);
  if (!countryRow) return new Response(`Country "${countryName}" not found.`, { status: 404 });

  const content = await sharedGetDeepDiveContent(env.eicc_content, countryName, lang);
  if (!content) return new Response(`No deep-dive content in D1 for "${countryName}" yet.`, { status: 404 });

  const milestones = await sharedGetMilestonesForCountry(env.eicc_content, countryName, lang);
  const flag = deriveFlagFromCode(countryRow.code);

  // renderFullDeepDivePage now renders the shared site-wide language
  // banner itself (see shared/deep-dive-render.mjs's renderLangBanner),
  // whose links preserve whatever other query params are already on
  // the page (e.g. this route's ?country=) via a small inline script --
  // this replaced the bespoke switcherBar this preview route used to
  // build by hand for exactly that reason.
  const html = await sharedRenderFullDeepDivePage(
    countryName, flag, countryRow.code, countryRow.region, content, milestones, lang,
    "https://e-invoicingcompliancecorner.com/einvoicing-compliance-tracker.html"
  );
  return htmlResponse(html);
}


async function handleMilestonesPreview(request, env, lang) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country") || "Portugal";
  const milestones = await sharedGetMilestonesForCountry(env.eicc_content, country, lang);

  if (milestones.length === 0) {
    return new Response(`No milestones found in D1 for "${country}" yet.`, { status: 404 });
  }

  const body = `
  <div style="max-width:900px; margin:40px auto; padding:0 20px; font-family:'IBM Plex Sans',sans-serif;">
    <h1 style="color:#f2f0e8;">Dynamic milestones preview — ${escapeHtml(country)}</h1>
    <p style="color:#93a3c0;">Proof-of-concept: both renderings below are built from the exact same ${milestones.length} D1 rows, fed into two different templates.</p>

    <h2 style="color:#c98a3a; margin-top:40px;">1. Tracker-style rendering</h2>
    ${renderTrackerStyleMilestones(milestones, country)}

    <h2 style="color:#c98a3a; margin-top:40px;">2. Deep-dive-style rendering</h2>
    <style>
      .rtimeline{position:relative; padding-left:20px; border-left:2px solid #2b3c5a;}
      .rmonth-marker{font-family:'IBM Plex Mono',monospace; font-size:11px; color:#c98a3a; text-transform:uppercase; letter-spacing:0.08em; margin:22px 0 8px -20px; padding-left:20px;}
      .rmonth-marker:first-child{margin-top:0;}
      .rcard{background:#efe9db; color:#241d10; border:1px solid #c9bd9e; border-radius:10px; padding:14px 18px; margin-bottom:10px;}
      .rcard-top{display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;}
      .rcard-date{font-family:'IBM Plex Mono',monospace; font-size:12px; font-weight:600; color:#4a3f22;}
      .rbadge{font-family:'IBM Plex Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.06em; padding:3px 9px; border-radius:999px; font-weight:600;}
      .rbadge.inforce{background:#274a38; color:#bfe6cf;}
      .rbadge.upcoming{background:#3a4864; color:#dbe2ee;}
      .rcard-title{font-weight:600; margin-bottom:4px;}
      .rcard-desc{color:#4a4030; font-size:13.5px; margin:0;}
    </style>
    ${sharedRenderDeepDiveStyleMilestones(milestones, lang)}
  </div>`;

  return htmlResponse(pageShell(body, lang));
}



function redirectToLogin(next) {
  const location = next && isSafeVerifyNextPath(next) ? `/members?next=${encodeURIComponent(next)}` : "/members";
  return new Response(null, { status: 302, headers: { Location: location } });
}

// ================================================================
// MANAGE ALERT PREFERENCES — lets a logged-in subscriber update
// which countries they want alerts for, without going through
// Lemon Squeezy checkout again (this is just a preference, not a
// payment change).
// ================================================================
async function handlePreferencesGet(request, env, lang) {
  const email = await requireSession(request, env);
  if (!email) return redirectToLogin();

  const sub = await getSubscriber(env, email);
  const currentCountries = sub?.countries || [];
  const notificationsEnabled = sub?.notificationsEnabled !== false; // default: enabled
  const countryPicker = await loadCountryPicker(env, lang);
  return htmlResponse(renderPreferencesPage(email, currentCountries, false, notificationsEnabled, lang, countryPicker));
}

async function handlePreferencesPost(request, env, lang) {
  const email = await requireSession(request, env);
  if (!email) return redirectToLogin();

  const form = await request.formData();
  const selected = form.getAll("countries"); // array of checked values
  const notificationsEnabled = form.get("notificationsEnabled") === "on";

  const existing = await getSubscriber(env, email);
  await putSubscriber(env, email, { ...(existing || {}), countries: selected, notificationsEnabled, updated: Date.now() });

  const countryPicker = await loadCountryPicker(env, lang);
  return htmlResponse(renderPreferencesPage(email, selected, true, notificationsEnabled, lang, countryPicker));
}

// ================================================================
// EMAIL SENDING (via Resend — swap this function for any other
// transactional email API if you'd rather use Postmark, SES, etc.)
// ================================================================
//
// Email HTML has to follow much stricter rules than the site's own
// pages — most clients (Gmail, Outlook) strip <style> blocks and ignore
// modern CSS, so everything below uses inline styles and a table-based
// layout, which survives virtually every client. Fonts are a plain
// monospace/serif web-safe stack rather than the site's actual Google
// Fonts, since custom web fonts don't reliably render in email at all.
function buildEmailShell(bodyHtml, footerHtml, headerHtml) {
  // headerHtml is optional — omitted, magic-link and monthly-notification
  // emails keep their existing small eyebrow exactly as before (zero
  // change to subscriber-facing templates). The content monitor passes
  // its own bolder masthead (see cmHeaderHtml) matching the tracker
  // page's actual brand-title treatment more closely.
  const defaultHeader = `<p style="margin:0; font-family:'Courier New',Courier,monospace; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#c98a3a;">The E-Invoicing Compliance Corner</p>`;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f1a2b; padding:0; margin:0;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#efe9db; border-radius:10px;">
        <tr>
          <td style="background-color:#0f1a2b; padding:22px 28px; border-radius:10px 10px 0 0; border-bottom:3px solid #b5432f;">
            ${headerHtml || defaultHeader}
          </td>
        </tr>
        <tr>
          <td style="padding:30px 28px 26px;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 24px; border-top:1px dashed #c9bd9e;">
            ${footerHtml}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

// Public feedback form (feedback.html) submissions: store in D1 first
// (durable — a Resend outage can't lose the message), then email to the
// site owner with reply-to set to the submitter. Form-encoded POST so
// the browser sends it as a CORS "simple request" (no preflight needed).
const FEEDBACK_TO = "einvoicingcompliancecorner@gmail.com";
const FEEDBACK_MAX_PER_HOUR_PER_IP = 5;

async function handleFeedback(request, env) {
  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return jsonResponse({ ok: false, error: "bad_request" }, 400);
  }
  const email = String(form.get("email") || "").trim().slice(0, 200);
  const subject = String(form.get("subject") || "").trim().slice(0, 200);
  const comments = String(form.get("comments") || "").trim().slice(0, 5000);
  const lang = String(form.get("lang") || "en").slice(0, 5);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !subject || !comments) {
    return jsonResponse({ ok: false, error: "invalid" }, 400);
  }
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  // Light rate limit: protects the inbox and the table, not a fortress.
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recent = await d1First(env,
    "SELECT COUNT(*) AS n FROM feedback WHERE ip = ? AND created_at > ?", ip, cutoff);
  if ((recent?.n || 0) >= FEEDBACK_MAX_PER_HOUR_PER_IP) {
    return jsonResponse({ ok: false, error: "rate_limited" }, 429);
  }
  const now = new Date().toISOString();
  await env.eicc_content.prepare(
    "INSERT INTO feedback (created_at, email, subject, comments, lang, ip) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(now, email, subject, comments, lang, ip).run();

  // Email is best-effort on top of the durable row — sendViaResend logs
  // failures to wrangler tail; the submitter still gets a success,
  // because their message IS safely stored either way.
  const feedbackBody = `<p style="font-family:'Courier New',Courier,monospace; font-size:12px; color:#8a7d5a; margin:0 0 14px;">From: ${escapeHtml(email)} &bull; lang: ${escapeHtml(lang)} &bull; ${escapeHtml(now)}</p>
<h2 style="font-family:Georgia,serif; font-size:18px; color:#241d10; margin:0 0 14px;">${escapeHtml(subject)}</h2>
<p style="font-size:14px; line-height:1.6; color:#4a4030; white-space:pre-wrap;">${escapeHtml(comments)}</p>`;
  const feedbackFooter = `<p style="margin:0; font-family:'Courier New',Courier,monospace; font-size:10.5px; color:#8a7d5a;">Internal notification only — reply-to is set to the submitter.</p>`;
  await sendViaResend(env, {
    from: env.FROM_EMAIL,
    to: FEEDBACK_TO,
    reply_to: email,
    subject: `[Feedback] ${subject}`,
    html: buildEmailShell(feedbackBody, feedbackFooter, buildBoldMastheadHtml()),
  });
  return jsonResponse({ ok: true });
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  });
}

// Wraps the raw Resend API call so failures are actually visible. A bare
// fetch() only rejects on network-level failures — it resolves normally
// even for a 401 (bad API key), 422 (rejected recipient/sender), or any
// other error Resend returns, meaning a broken send could previously
// look completely successful from this Worker's own perspective. This
// logs the full response body on any non-2xx status so `wrangler tail`
// actually shows what went wrong, instead of the failure being silent.
// Resend's documented default is 10 requests per second per team,
// shared across all API keys. A 429 here used to mean one subscriber
// silently missed that month's email, because every caller logs the
// failure and moves on. A bounded retry that honours Resend's own
// `retry-after` header turns a transient rate-limit into a short pause
// instead of a lost send.
//
// Only 429 and 5xx are retried. A 4xx for a malformed or bounced
// address should fail fast rather than be attempted three times.
const RESEND_MAX_ATTEMPTS = 3;

async function sendViaResend(env, payload) {
  for (let attempt = 1; attempt <= RESEND_MAX_ATTEMPTS; attempt++) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) return true;

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === RESEND_MAX_ATTEMPTS) {
      const errorBody = await res.text().catch(() => "(could not read response body)");
      console.error(`Resend send failed — status ${res.status} for ${payload.to} after ${attempt} attempt(s): ${errorBody}`);
      return false;
    }
    // Prefer the server's own guidance; fall back to a short backoff.
    const retryAfter = parseFloat(res.headers.get("retry-after") || "");
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1000, 5000)
      : 500 * attempt;
    console.log(`Resend ${res.status} for ${payload.to} — retrying in ${waitMs}ms (attempt ${attempt}/${RESEND_MAX_ATTEMPTS})`);
    await sleep(waitMs);
  }
  return false;
}

// Sent once, right after sign-up, alongside (not instead of) the magic
// link email -- kept as a genuinely separate message rather than
// merged into it, because the magic link has one narrow, urgent job
// ("click within 15 minutes") that a long orientation tour would only
// dilute. This one has no expiry and no call to action beyond reading
// it, so it can afford to be a proper welcome. English-only for now,
// matching the existing magic-link and monthly-notification emails --
// none of this site's transactional email is localized yet.
const WELCOME_LINKS = {
  tracker: "https://e-invoicingcompliancecorner.com/einvoicing-compliance-tracker.html",
  sources: "https://e-invoicingcompliancecorner.com/sources",
  education: {
    "Types of Mandate": "https://e-invoicingcompliancecorner.com/education-mandate-types.html",
    "Impact of Mandate": "https://e-invoicingcompliancecorner.com/education-impact-of-mandate.html",
    "Preparing for a Mandate": "https://e-invoicingcompliancecorner.com/education-preparing-for-mandate.html",
    "Types of Provider": "https://e-invoicingcompliancecorner.com/education-types-of-provider.html",
    "Government Certified Providers": "https://e-invoicingcompliancecorner.com/education-certified-providers.html",
  },
  feedback: "https://e-invoicingcompliancecorner.com/feedback.html",
};

function welcomeLinkCard(title, description, href) {
  return `<div style="margin:0 0 12px; padding:14px 16px; background-color:#f9f6ee; border-left:3px solid #c98a3a; border-radius:4px;">
    <p style="margin:0 0 4px; font-family:Georgia,serif; font-size:14.5px; font-weight:bold; color:#241d10;"><a href="${href}" style="color:#241d10; text-decoration:none;">${escapeHtml(title)} →</a></p>
    <p style="margin:0; font-size:13px; color:#4a4030; line-height:1.5;">${description}</p>
  </div>`;
}

async function sendWelcomeEmail(env, email, firstName, countries, archiveLink, prefsLink) {
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,";

  const educationListHtml = Object.entries(WELCOME_LINKS.education)
    .map(([title, href]) => `<li style="margin:0 0 6px;"><a href="${href}" style="color:#241d10;">${escapeHtml(title)}</a></li>`)
    .join("");

  const countriesLine = countries.length
    ? `You told us you're watching <strong>${countries.map(escapeHtml).join(", ")}</strong>.`
    : `You haven't singled out any specific countries yet, so for now you'll hear about every update, everywhere.`;

  const body = `
    <p style="margin:0 0 4px; font-family:'Courier New',Courier,monospace; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#c98a3a;">Welcome aboard</p>
    <h2 style="margin:0 0 14px; font-size:20px; line-height:1.3; color:#241d10; font-family:Georgia,'Times New Roman',serif;">${greeting} you're all set.</h2>
    <p style="margin:0 0 22px; font-size:14px; line-height:1.6; color:#4a4030;">The E-Invoicing Compliance Corner tracks e-invoicing and digital reporting mandates across every jurisdiction we cover — deadlines, what you actually need to do about each one, and a direct link to the official government source, so you can always verify it yourself.</p>

    <h3 style="margin:0 0 10px; font-family:Georgia,serif; font-size:15px; color:#241d10;">Where to start</h3>
    ${welcomeLinkCard("The compliance tracker", "Every mandate at a glance, filterable by region or country — this is the home page and the fastest way to see what's changed.", WELCOME_LINKS.tracker)}
    ${welcomeLinkCard("Country deep dives", "Click any country in the tracker's sidebar (or the Deep Dives menu) for a full breakdown: compliance model, required format, and a step-by-step action list.", WELCOME_LINKS.tracker)}
    ${welcomeLinkCard("The newsletter archive", "Every past issue, not just this month's — searchable by keyword and filterable by country and edition.", archiveLink)}
    ${welcomeLinkCard("Tracking sources", "Curious where our information comes from? Every official government page we monitor, listed by country.", WELCOME_LINKS.sources)}

    <h3 style="margin:22px 0 10px; font-family:Georgia,serif; font-size:15px; color:#241d10;">New to e-invoicing? Start with the education library</h3>
    <p style="margin:0 0 10px; font-size:13.5px; color:#4a4030;">Five short guides covering the basics, in plain language:</p>
    <ul style="margin:0 0 22px; padding-left:18px; font-size:13.5px; line-height:1.7;">${educationListHtml}</ul>

    <h3 style="margin:0 0 10px; font-family:Georgia,serif; font-size:15px; color:#241d10;">Your country preferences</h3>
    <p style="margin:0 0 10px; font-size:13.5px; color:#4a4030; line-height:1.6;">${countriesLine} You can add, remove, or change these any time — nothing is locked in.</p>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#b5432f; border-radius:6px;">
          <a href="${prefsLink}" style="display:inline-block; padding:11px 20px; font-family:'Courier New',Courier,monospace; font-size:12.5px; font-weight:bold; color:#ffffff; text-decoration:none;">Manage my preferences →</a>
        </td>
      </tr>
    </table>`;

  const footer = `<p style="margin:0; font-size:11.5px; color:#8a7d5a; line-height:1.6;">Questions, or spotted something that looks wrong? <a href="${WELCOME_LINKS.feedback}" style="color:#8a7d5a;">Let us know</a> — a real person reads every message.</p>`;

  await sendViaResend(env, {
    from: env.FROM_EMAIL,
    to: email,
    subject: "Welcome to The E-Invoicing Compliance Corner",
    html: buildEmailShell(body, footer, buildBoldMastheadHtml()),
  });
}

async function sendMagicLinkEmail(env, email, link) {
  const body = `
    <p style="margin:0 0 6px; font-family:'Courier New',Courier,monospace; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#c98a3a;">Sign-in link</p>
    <h1 style="margin:0 0 14px; font-size:20px; line-height:1.3; color:#241d10; font-family:Georgia,'Times New Roman',serif;">Access the subscriber archive</h1>
    <p style="margin:0 0 22px; font-size:14px; line-height:1.6; color:#4a4030;">Click below to sign in. This link expires in 15 minutes and can only be used once.</p>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#b5432f; border-radius:6px;">
          <a href="${link}" style="display:inline-block; padding:12px 22px; font-family:'Courier New',Courier,monospace; font-size:13px; font-weight:bold; color:#ffffff; text-decoration:none;">Sign in →</a>
        </td>
      </tr>
    </table>`;
  const footer = `<p style="margin:0; font-size:11.5px; color:#8a7d5a; line-height:1.5;">If you didn't request this, you can safely ignore this email — nobody can access your account without clicking the link above.</p>`;

  return await sendViaResend(env, {
    from: env.FROM_EMAIL,
    to: email,
    subject: "Your sign-in link — The E-Invoicing Compliance Corner",
    html: buildEmailShell(body, footer, buildBoldMastheadHtml()),
  });
}

async function sendMonthlyNotificationEmail(env, email, monthKey, introText, stories, unsubToken, archiveLink) {
  const unsubLink = `${env.SITE_URL}/members/unsubscribe-notifications?token=${encodeURIComponent(unsubToken)}`;

  const monthLabel = new Date(monthKey + "-01T00:00:00Z").toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  // Same convenience-link treatment as the archive index button --
  // these individual story links are the actual point of this email,
  // so it matters even more that they keep working regardless of
  // ARCHIVE_PUBLIC's state or how many days old the email is (within
  // the 7-day window) rather than dropping the subscriber at a login
  // wall right when they've decided to read something.
  const storyListHtml = (await Promise.all(stories.map(async (s) => {
    const storyToken = await signToken(env.SESSION_SECRET, { email, purpose: "login" }, CONVENIENCE_LINK_TTL_SECONDS);
    const link = `${env.SITE_URL}/members/verify?token=${encodeURIComponent(storyToken)}&next=${encodeURIComponent(`/members/archive/${s.id}`)}`;
    return `<li style="margin:0 0 8px; font-size:14px; line-height:1.5;"><a href="${escapeHtml(link)}" style="color:#241d10; text-decoration:underline;">${escapeHtml(s.title)}</a></li>`;
  }))).join("");

  const body = `
    <p style="margin:0 0 6px; font-family:'Courier New',Courier,monospace; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#c98a3a;">${escapeHtml(monthLabel)}</p>
    <h1 style="margin:0 0 12px; font-size:21px; line-height:1.3; color:#241d10; font-family:Georgia,'Times New Roman',serif;">${escapeHtml(introText)}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e4dcc6; border-radius:8px; margin:0 0 24px;">
      <tr>
        <td style="padding:14px 18px;">
          <ul style="margin:0; padding-left:18px; color:#241d10;">${storyListHtml}</ul>
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#b5432f; border-radius:6px;">
          <a href="${archiveLink}" style="display:inline-block; padding:12px 22px; font-family:'Courier New',Courier,monospace; font-size:13px; font-weight:bold; color:#ffffff; text-decoration:none;">Browse the full archive →</a>
        </td>
      </tr>
    </table>`;
  const footer = `
    <p style="margin:0; font-size:11.5px; color:#8a7d5a; line-height:1.5;">
      You're receiving this because you have an active subscription to The E-Invoicing Compliance Corner.
      <a href="${unsubLink}" style="color:#8a7d5a;">Stop these monthly notification emails</a> — this won't cancel your subscription, you'll still be able to log in and read every issue any time.
    </p>`;

  // Returned, not discarded: the caller counts real failures, and a
  // send that Resend rejected must not be counted as delivered — it
  // would otherwise inflate the recipient count recorded against the
  // month's announcement rows.
  return await sendViaResend(env, {
    from: env.FROM_EMAIL,
    to: email,
    subject: `This month's e-invoicing updates — ${monthLabel}`,
    html: buildEmailShell(body, footer, buildBoldMastheadHtml()),
  });
}

// ================================================================
// TOKEN SIGNING — dependency-free HMAC-SHA256 signed tokens using
// the Web Crypto API built into the Workers runtime. No JWT library
// needed, no build step needed.
// ================================================================
async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bytesToBase64url(bytes) {
  let binary = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64urlToBytes(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function signToken(secret, payloadObj, ttlSeconds) {
  const payload = { ...payloadObj, exp: Date.now() + ttlSeconds * 1000 };
  const payloadB64 = bytesToBase64url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${bytesToBase64url(sig)}`;
}

async function verifyToken(secret, token) {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sigB64] = token.split(".");
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64urlToBytes(sigB64),
    new TextEncoder().encode(payloadB64)
  );
  if (!valid) return null;
  const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(payloadB64)));
  if (Date.now() > payload.exp) return null;
  return payload;
}

async function verifyHmacSha256Hex(secret, message, hexSignature) {
  if (!hexSignature) return false;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const computedHex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return timingSafeEqual(computedHex, hexSignature);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

// Returns the LAST matching cookie value, not the first, and reports
// whether more than one same-named cookie was present. A browser can
// send two *different* cookies with the same name at once -- e.g. a
// stale host-only "eicc_lang" cookie left over from before this site
// scoped the cookie to Domain=.e-invoicingcompliancecorner.com,
// sitting alongside the current domain-scoped one. Per RFC 6265 5.4,
// cookies with equal-length paths are sent oldest-first, so the newer
// (correct, domain-scoped) cookie is always the LAST occurrence in the
// Cookie header -- reading the first match is what caused a user's
// language choice to always revert to whatever the stale cookie held
// on refresh. See withLangCookie()'s duplicate-clearing logic below
// for the other half of the fix (actually removing the stale
// duplicate). Only LANG_COOKIE lookups care about the duplicate flag;
// SESSION_COOKIE lookups just ignore it.
function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const matches = [...cookieHeader.matchAll(new RegExp(`(?:^|; )${name}=([^;]+)`, "g"))];
  return {
    value: matches.length ? matches[matches.length - 1][1] : null,
    duplicated: matches.length > 1,
  };
}

function htmlResponse(html) {
  return new Response(html, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
}

// ================================================================
// HTML TEMPLATES — same visual language as the rest of the site
// ================================================================
const BASE_STYLE = `
  :root{
    --ink:#0f1a2b; --ink-2:#152238; --line:#2b3c5a;
    --paper:#efe9db; --paper-2:#e4dcc6; --paper-line:#c9bd9e;
    --text-lo:#f2f0e8; --muted:#93a3c0;
    --stamp:#b5432f; --live:#3f7d5c; --live-dim:#274a38;
    --soon:#c98a3a; --soon-dim:#6e4c22;
    --radius:10px;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;}
  body{
    background:var(--ink); color:var(--text-lo); font-family:'IBM Plex Sans',sans-serif; line-height:1.6;
    min-height:100vh; display:flex; flex-direction:column; align-items:center;
  }
  a{color:inherit;}
  .display{font-family:'Big Shoulders Display',sans-serif; font-weight:800;}
  .mono{font-family:'IBM Plex Mono',monospace;}
  .wrap{width:100%; max-width:640px; padding:0 5vw 60px;}
  .back-link{
    display:inline-flex; align-items:center; gap:6px; margin:24px 0 24px;
    font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--muted); text-decoration:none;
  }
  .back-link:hover{color:var(--soon);}
  .card{background:var(--paper); color:#241d10; border-radius:var(--radius); padding:30px; border:1px solid var(--paper-line);}
  .eyebrow{font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--stamp); margin:0 0 8px;}
  .title{font-family:'Big Shoulders Display',sans-serif; font-weight:800; font-size:26px; text-transform:uppercase; margin:0 0 10px;}
  .sub{font-size:13.8px; color:#4a4030; margin:0 0 22px; line-height:1.55;}
  .form-field{display:flex; flex-direction:column; gap:6px; margin-bottom:14px;}
  .form-field label{font-family:'IBM Plex Mono',monospace; font-size:10.5px; text-transform:uppercase; letter-spacing:0.08em; color:#6b5f3f;}
  .form-field input{background:#fff; border:1px solid var(--paper-line); border-radius:6px; padding:10px 12px; font-size:14px; font-family:'IBM Plex Sans',sans-serif; color:#241d10;}
  .form-field input:focus{outline:2px solid var(--stamp); outline-offset:0;}
  .form-error{background:#fdeee6; color:var(--stamp); border-radius:6px; padding:10px 12px; font-size:12.8px; margin-bottom:14px;}
  .btn{width:100%; background:var(--ink); color:var(--text-lo); border:none; border-radius:8px; padding:13px; font-family:'IBM Plex Mono',monospace; font-size:13.5px; font-weight:600; cursor:pointer; letter-spacing:0.03em; text-decoration:none; text-align:center; display:block;}
  .btn:hover{background:var(--stamp);}
  .fineprint{font-size:11.5px; color:#7a6f52; margin-top:16px; line-height:1.55;}
  .topbar{width:100%; max-width:640px; display:flex; justify-content:space-between; align-items:center; padding:0 5vw; margin-top:24px;}
  .topbar-wide{max-width:1100px;}
  .logout-btn{background:none; border:1px solid var(--line); color:var(--muted); font-family:'IBM Plex Mono',monospace; font-size:11.5px; padding:6px 12px; border-radius:999px; cursor:pointer;}
  .logout-btn:hover{border-color:var(--stamp); color:var(--stamp);}

  /* Archive: wide layout, search + country filter, card grid */
  .archive-wrap{width:100%; max-width:1100px; padding:0 5vw 60px;}
  .archive-head{margin-bottom:20px;}
  .archive-toolbar{display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-bottom:14px;}
  .archive-search{
    flex:1 1 260px; background:var(--ink-2); border:1px solid var(--line); border-radius:8px;
    padding:11px 14px; color:var(--text-lo); font-family:'IBM Plex Sans',sans-serif; font-size:14px;
  }
  .archive-search:focus{outline:2px solid var(--soon); outline-offset:0;}
  .archive-search::placeholder{color:var(--muted);}
  select.archive-search{flex:0 0 auto; cursor:pointer; min-width:160px;}
  /* Country filter: a single dropdown (grouped by region via <optgroup>,
     "All Countries" default) replaces the old balanced-columns checkbox
     block -- one country at a time from the dropdown, or, for a signed-in
     member with saved country preferences, the "my subscribed countries"
     link below applies their full saved list at once (shown as chips,
     since a plain <select> can't represent more than one selection). */
  .my-countries-row{display:flex; align-items:center; gap:10px; margin:12px 0 22px; flex-wrap:wrap;}
  .my-countries-link{
    font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--stamp); text-decoration:underline;
    cursor:pointer; background:none; border:none; padding:0;
  }
  .my-countries-link:hover{color:#8a2e1f;}
  .my-chip-row{display:flex; gap:6px; flex-wrap:wrap;}
  .my-chip{
    font-family:'IBM Plex Mono',monospace; font-size:10.5px; background:var(--paper-2); color:#6b5f3f;
    padding:4px 10px; border-radius:999px; display:inline-flex; align-items:center; gap:5px;
  }
  .issue-grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(300px,1fr)); gap:16px;}
  .issue-card{
    background:var(--paper); border:1px solid var(--paper-line); border-radius:var(--radius);
    padding:18px 20px 20px; text-decoration:none; color:#241d10; display:block; transition:border-color .1s ease;
  }
  .issue-card:hover{border-color:var(--stamp);}
  .issue-card:hover .issue-title{color:var(--stamp);}
  .issue-date{font-family:'IBM Plex Mono',monospace; font-size:11px; color:#6b5f3f; text-transform:uppercase; letter-spacing:0.05em;}
  .issue-title{font-family:'Big Shoulders Display',sans-serif; font-weight:800; font-size:17px; text-transform:uppercase; margin:6px 0; line-height:1.2;}
  .issue-summary{font-size:12.8px; color:#4a4030; margin:0 0 12px; line-height:1.5;}
  .issue-country-tags{display:flex; flex-wrap:wrap; gap:5px;}
  .issue-country-tags span{font-family:'IBM Plex Mono',monospace; font-size:10px; background:var(--paper-2); color:#6b5f3f; padding:3px 9px; border-radius:999px;}
  .no-match{color:var(--muted); font-size:13.5px; padding:40px 0; text-align:center; grid-column:1/-1;}

  /* Preferences page */
  .prefs-box{max-height:280px; overflow-y:auto; border:1px solid var(--paper-line); border-radius:8px; background:#fff; padding:4px 14px; margin:16px 0;}
  .region-group{padding:10px 0; border-top:1px dashed var(--paper-line);}
  .region-group:first-child{border-top:none;}
  .region-group-label{font-family:'IBM Plex Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.07em; color:#8a7d5a; margin:0 0 6px;}
  .country-check{display:flex; align-items:center; gap:8px; padding:3px 0; font-size:12.8px; color:#241d10;}
  .country-check input{width:auto; margin:0;}
  .prefs-actions{display:flex; gap:14px; margin:10px 0;}
  .prefs-actions a{font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--stamp); text-decoration:underline; cursor:pointer;}
  .saved-banner{background:var(--live-dim); color:#bfe6cf; border-radius:6px; padding:10px 14px; font-size:12.8px; margin-bottom:16px;}
  .promo-banner{background:var(--soon); color:#1a1207; border-radius:6px; padding:12px 16px; font-size:13.2px; font-weight:600; margin-bottom:16px; line-height:1.5;}

  /* Story pop-out modal (archive) -- same interaction pattern as the
     tracker's "About this site" overlay: dimmed backdrop, centered
     card, close on button/backdrop-click/Escape. */
  .modal-overlay{
    display:none; position:fixed; inset:0; z-index:200; background:rgba(6,10,18,0.72);
    align-items:flex-start; justify-content:center; padding:5vh 5vw 60px; overflow-y:auto;
  }
  .modal-overlay.open{display:flex;}
  .modal-card{
    position:relative; background:var(--paper); color:#241d10; border-radius:var(--radius);
    padding:32px; max-width:640px; width:100%; border:1px solid var(--paper-line);
  }
  .modal-close{
    position:absolute; top:14px; right:16px; background:none; border:none; font-size:26px;
    line-height:1; color:#6b5f3f; cursor:pointer; padding:4px;
  }
  .modal-close:hover{color:var(--stamp);}
  .modal-loading{color:#8a7d5a; font-size:13.5px; font-style:italic;}
`;

function pageShell(bodyHtml, lang, extraStyle) {
  return `<!DOCTYPE html>
<html lang="${lang || "en"}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Subscriber Archive — The E-Invoicing Compliance Corner</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${BASE_STYLE}${extraStyle || ""}</style>
</head>
<body>
${renderLangBanner(lang || "en")}
${bodyHtml}
<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "3e7e20959b7f4604a87836fc751c18f3"}'></script><!-- End Cloudflare Web Analytics -->
</body>
</html>`;
}

function renderLoginPage(error, lang, next) {
  lang = lang || "en";
  const safeNext = next && isSafeVerifyNextPath(next) ? next : "";
  const body = `
  <div class="wrap">
    <a class="back-link" href="https://e-invoicingcompliancecorner.com/einvoicing-compliance-tracker.html" style="margin:0;">${t(lang, "backToTracker")}</a>
    <div class="card" style="margin-top:16px;">
      <p class="eyebrow">${t(lang, "login.eyebrow")}</p>
      <h1 class="title">${t(lang, "login.title")}</h1>
      <p class="sub">${t(lang, "login.intro")}</p>
      ${error ? `<div class="form-error">${escapeHtml(error)}</div>` : ""}
      <form method="POST" action="/members/login">
        <input type="hidden" name="lang" value="${lang}">
        ${safeNext ? `<input type="hidden" name="next" value="${escapeHtml(safeNext)}">` : ""}
        <div class="form-field">
          <label for="email">${t(lang, "login.emailLabel")}</label>
          <input type="email" id="email" name="email" required autocomplete="email">
        </div>
        <button type="submit" class="btn">${t(lang, "login.sendButton")}</button>
      </form>
      <p class="fineprint">${t(lang, "login.notSubscribed")} <a href="https://e-invoicingcompliancecorner.com/subscribe.html" style="color:var(--stamp); text-decoration:underline;">${t(lang, "login.subscribeHere")}</a>.</p>
    </div>
  </div>`;
  return pageShell(body, lang);
}

function renderCheckEmailPage(lang) {
  lang = lang || "en";
  const body = `
  <div class="wrap">
    <a class="back-link" href="https://e-invoicingcompliancecorner.com/einvoicing-compliance-tracker.html">${t(lang, "backToTracker")}</a>
    <div class="card">
      <p class="eyebrow">${t(lang, "checkEmail.eyebrow")}</p>
      <h1 class="title">${t(lang, "checkEmail.title")}</h1>
      <p class="sub">${t(lang, "checkEmail.body")}</p>
    </div>
  </div>`;
  return pageShell(body, lang);
}

function renderTrialAlreadyUsedPage(lang) {
  lang = lang || "en";
  const body = `
  <div class="wrap">
    <a class="back-link" href="https://e-invoicingcompliancecorner.com/einvoicing-compliance-tracker.html">${t(lang, "backToTracker")}</a>
    <div class="card">
      <p class="eyebrow">${t(lang, "trialAlreadyUsed.eyebrow")}</p>
      <h1 class="title">${t(lang, "trialAlreadyUsed.title")}</h1>
      <p class="sub">${t(lang, "trialAlreadyUsed.body")}</p>
      <a href="/members" class="form-submit" style="display:inline-block; text-decoration:none; text-align:center; margin-top:10px;">${t(lang, "trialAlreadyUsed.ctaButton")}</a>
    </div>
  </div>`;
  return pageShell(body, lang);
}

function renderArchiveList(stories, regionByCountryName, englishNameByDisplayName, preferredCountries, email, lang) {
  lang = lang || "en";
  // Build the master list of countries that actually appear across every
  // published story, so the filter checkboxes only ever show options
  // that do something — no point offering a country with zero matches.
  // Grouped by region, in the same order used everywhere else on the
  // site (tracker's Deep Dives menu, sidebar, subscribe/preferences
  // pickers), rather than one long flat alphabetical list.
  const allCountries = Array.from(new Set(stories.flatMap((s) => s.countries || [])));
  const countriesByRegion = {};
  for (const country of allCountries) {
    const region = regionByCountryName[country] || "Other";
    (countriesByRegion[region] ||= []).push(country);
  }
  for (const region of Object.keys(countriesByRegion)) {
    countriesByRegion[region].sort();
  }
  const orderedRegions = [...REGION_ORDER.filter((r) => countriesByRegion[r]), ...Object.keys(countriesByRegion).filter((r) => !REGION_ORDER.includes(r))];

  // Pre-check boxes matching the subscriber's saved alert preferences.
  // preferredCountries stores canonical English names (same as KV/
  // subscriber records everywhere else) — the checkbox's own value is
  // the translated display name, so the comparison has to go through
  // englishNameByDisplayName rather than comparing the two directly,
  // or this would silently never match on any non-English page.
  const preferredSet = new Set(preferredCountries || []);

  // Preferred (saved-subscription) countries, as display names, shipped
  // to the client for the "show my subscribed countries" toggle -- see
  // renderMyCountriesRow() in the client script below. Built by walking
  // countriesByRegion/preferredSet rather than using preferredCountries
  // directly, so it only ever lists names that both match a real country
  // appearing on this page AND use the same translated display form as
  // the dropdown options below (comparisons go through
  // englishNameByDisplayName since preferredCountries stores canonical
  // English names, same as everywhere else on the site).
  const preferredDisplayNames = [];
  for (const region of orderedRegions) {
    for (const c of countriesByRegion[region]) {
      if (preferredSet.has(englishNameByDisplayName[c] || c)) preferredDisplayNames.push(c);
    }
  }
  const preferredCountriesJson = JSON.stringify(preferredDisplayNames);
  const myCountriesLinkLabel = t(lang, "archive.showMyCountries")(preferredDisplayNames.length);
  const showAllCountriesLabel = t(lang, "archive.showAllCountries");

  // Single-select country dropdown, grouped by region via <optgroup> --
  // replaces the old balanced-columns checkbox block. "All Countries" is
  // the default option. A signed-in member's full saved country list
  // can't be represented by a single-select at once, so it's applied
  // instead via the separate "show my subscribed countries" link/chips
  // built client-side from PREFERRED_COUNTRIES; picking a specific
  // country from this dropdown cancels that mode (see the client script
  // below).
  const countryOptionsHtml = orderedRegions
    .map((region) => {
      const options = countriesByRegion[region].map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
      return `<optgroup label="${escapeHtml(translateRegionName(lang, region))}">${options}</optgroup>`;
    })
    .join("");

  // Ship the story data to the client as JSON so search/filter can run
  // instantly without a round-trip to the Worker for every keystroke.
  const storiesJson = JSON.stringify(
    stories.map((s) => ({
      id: s.id,
      title: s.title,
      date: s.date,
      summary: s.summary || "",
      countries: s.countries || [],
    }))
  );

  // Anonymous (email === null) means this request came through while
  // ARCHIVE_PUBLIC's temporary promo is on and the visitor never logged
  // in — show a "free for now, subscribe for alerts" banner instead of
  // "Signed in as ___", and skip the logout button and manage-
  // preferences link, since neither applies without a real session.
  const isAnonymous = !email;
  const identityHtml = isAnonymous
    ? `<div class="promo-banner">${t(lang, "archive.promoBannerText")} <a href="https://e-invoicingcompliancecorner.com/subscribe.html" style="color:inherit; text-decoration:underline; font-weight:700; white-space:nowrap;">${t(lang, "archive.promoBannerCta")}</a></div>`
    : `<p class="eyebrow">${t(lang, "archive.signedInAs")} ${escapeHtml(email)}</p>`;

  const body = `
  <div class="topbar topbar-wide">
    <a class="back-link" href="https://e-invoicingcompliancecorner.com/einvoicing-compliance-tracker.html" style="margin:0;">${t(lang, "backToTracker")}</a>
    ${isAnonymous ? "" : `<form method="POST" action="/members/logout"><button type="submit" class="logout-btn">${t(lang, "logout")}</button></form>`}
  </div>
  <div class="archive-wrap">
    <div class="archive-head">
      ${identityHtml}
      <h1 class="title">${t(lang, "archive.title")}</h1>
      <p class="sub" style="margin-bottom:18px;">${t(lang, "archive.issuesPublished")(stories.length)}</p>
    </div>

    ${isAnonymous ? "" : `<p class="fineprint" style="margin:0 0 16px;"><a href="/members/preferences" style="color:var(--stamp); text-decoration:underline;">${t(lang, "archive.managePrefs")}</a></p>`}

    <div class="archive-toolbar">
      <input type="text" id="archiveSearch" class="archive-search" placeholder="${t(lang, "archive.searchPlaceholder")}">
      ${allCountries.length ? `<select id="countryFilter" class="archive-search">
        <option value="" selected>${t(lang, "archive.allCountries")}</option>
        ${countryOptionsHtml}
      </select>` : ""}
      <select id="editionFilter" class="archive-search" style="flex:0 0 auto; cursor:pointer;">
        <option value="thisYear" selected>${t(lang, "archive.editionThisYear")}</option>
        <option value="latest">${t(lang, "archive.editionLatest")}</option>
        <option value="all">${t(lang, "archive.editionAll")}</option>
      </select>
    </div>
    ${allCountries.length ? `<div id="myCountriesRow" class="my-countries-row"></div>` : ""}

    <div class="issue-grid" id="issueGrid"></div>

    <div class="modal-overlay" id="storyModalOverlay">
      <div class="modal-card">
        <button class="modal-close" id="storyModalClose" aria-label="Close">&times;</button>
        <div id="storyModalBody"><p class="modal-loading">${escapeHtml(t(lang, "archive.loading") || "Loading…")}</p></div>
      </div>
    </div>
  </div>
  <script>
    const ARCHIVE_STORIES = ${storiesJson};
    const PREFERRED_COUNTRIES = ${preferredCountriesJson};
    const MY_COUNTRIES_LINK_LABEL = ${JSON.stringify(myCountriesLinkLabel)};
    const SHOW_ALL_COUNTRIES_LABEL = ${JSON.stringify(showAllCountriesLabel)};
    const NO_ISSUES_TEXT = ${JSON.stringify(t(lang, "archive.noIssuesYet"))};
    const NO_MATCH_TEXT = ${JSON.stringify(t(lang, "archive.noMatch"))};

    function escapeHtmlClient(str){
      return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ---------- country filter: dropdown + saved-preference toggle ----------
    // A single <select> (one country, or "All Countries") replaces the
    // old balanced-columns checkbox block. It can't represent more than
    // one selection at a time, so a signed-in member's full saved
    // country list is applied separately via myCountriesActive -- the
    // "show my subscribed countries" link below the toolbar, rendered
    // only when PREFERRED_COUNTRIES is non-empty. Picking a specific
    // country from the dropdown cancels that mode.
    let myCountriesActive = false;

    function getCheckedCountries(){
      if(myCountriesActive) return PREFERRED_COUNTRIES.slice();
      const countryFilterEl = document.getElementById('countryFilter');
      return (countryFilterEl && countryFilterEl.value) ? [countryFilterEl.value] : [];
    }

    function renderMyCountriesRow(){
      const row = document.getElementById('myCountriesRow');
      if(!row || !PREFERRED_COUNTRIES.length) return;
      if(myCountriesActive){
        const chips = PREFERRED_COUNTRIES.map(c => \`<span class="my-chip">\${escapeHtmlClient(c)}</span>\`).join('');
        row.innerHTML = \`<div class="my-chip-row">\${chips}</div><button type="button" class="my-countries-link" id="myCountriesToggle">\${escapeHtmlClient(SHOW_ALL_COUNTRIES_LABEL)}</button>\`;
      }else{
        row.innerHTML = \`<button type="button" class="my-countries-link" id="myCountriesToggle">\${escapeHtmlClient(MY_COUNTRIES_LINK_LABEL)}</button>\`;
      }
      document.getElementById('myCountriesToggle').addEventListener('click', () => {
        myCountriesActive = !myCountriesActive;
        if(myCountriesActive){
          const countryFilterEl = document.getElementById('countryFilter');
          if(countryFilterEl) countryFilterEl.value = '';
        }
        renderMyCountriesRow();
        renderGrid();
      });
    }

    // Most recent month present in the data (e.g. "2026-07"), used for
    // the "Latest edition" option — derived from the data itself rather
    // than assumed, so it's always correct regardless of when this page
    // is viewed relative to when stories were actually published.
    const mostRecentMonth = ARCHIVE_STORIES.length
      ? ARCHIVE_STORIES.reduce((max, s) => s.date.slice(0, 7) > max ? s.date.slice(0, 7) : max, ARCHIVE_STORIES[0].date.slice(0, 7))
      : null;
    const currentYear = String(new Date().getFullYear());

    function renderGrid(){
      const q = document.getElementById('archiveSearch').value.trim().toLowerCase();
      const checked = getCheckedCountries();
      const edition = document.getElementById('editionFilter').value;
      const filtered = ARCHIVE_STORIES.filter(s => {
        const matchesSearch = !q || s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q);
        // Union match: a story shows if it matches ANY checked country,
        // not all of them — checking Poland and Brazil should surface
        // stories about either, not only stories that mention both.
        const matchesCountry = checked.length === 0 || s.countries.some(c => checked.includes(c));
        const matchesEdition = edition === 'all'
          || (edition === 'latest' && s.date.slice(0, 7) === mostRecentMonth)
          || (edition === 'thisYear' && s.date.slice(0, 4) === currentYear);
        return matchesSearch && matchesCountry && matchesEdition;
      });
      const grid = document.getElementById('issueGrid');
      if(ARCHIVE_STORIES.length === 0){
        grid.innerHTML = '<p class="no-match">' + NO_ISSUES_TEXT + '</p>';
        return;
      }
      if(filtered.length === 0){
        grid.innerHTML = '<p class="no-match">' + NO_MATCH_TEXT + '</p>';
        return;
      }
      grid.innerHTML = filtered.map(s => \`
        <a class="issue-card" href="/members/archive/\${encodeURIComponent(s.id)}">
          <div class="issue-date">\${escapeHtmlClient(s.date)}</div>
          <div class="issue-title">\${escapeHtmlClient(s.title)}</div>
          \${s.summary ? \`<div class="issue-summary">\${escapeHtmlClient(s.summary)}</div>\` : ''}
          \${s.countries.length ? \`<div class="issue-country-tags">\${s.countries.map(c => \`<span>\${escapeHtmlClient(c)}</span>\`).join('')}</div>\` : ''}
        </a>
      \`).join('');
    }

    document.getElementById('archiveSearch').addEventListener('input', renderGrid);
    document.getElementById('editionFilter').addEventListener('change', renderGrid);
    const countryFilterEl = document.getElementById('countryFilter');
    if(countryFilterEl){
      countryFilterEl.addEventListener('change', () => {
        // Picking a specific country cancels "my subscribed countries"
        // mode -- the two are mutually exclusive ways of driving the
        // same single filter.
        if(countryFilterEl.value) myCountriesActive = false;
        renderMyCountriesRow();
        renderGrid();
      });
    }

    renderMyCountriesRow();
    renderGrid();

    // ---------- story pop-out modal ----------
    // Clicking a story used to navigate away to a brand-new page. It
    // now fetches that same page and shows its content in a modal
    // right here instead -- same interaction pattern as the tracker's
    // "About this site" overlay (dimmed backdrop, centered card, close
    // on button/backdrop-click/Escape/back-button). The card's real
    // href is left untouched as a plain fallback: if this JS fails, or
    // a crawler/JS-disabled visitor follows the link directly, it
    // navigates normally to the real, fully server-rendered standalone
    // page, completely unaffected by any of this.
    const storyOverlay = document.getElementById('storyModalOverlay');
    const storyModalBody = document.getElementById('storyModalBody');
    const storyModalClose = document.getElementById('storyModalClose');
    const LOADING_HTML = '<p class="modal-loading">' + escapeHtmlClient(${JSON.stringify(t(lang, "archive.loading"))}) + '</p>';

    async function openStory(id, pushHistory){
      storyModalBody.innerHTML = LOADING_HTML;
      storyOverlay.classList.add('open');
      if(pushHistory !== false){
        history.pushState({ storyId: id }, '', '/members/archive/' + encodeURIComponent(id));
      }
      try{
        const langSuffix = ${JSON.stringify(lang)} !== 'en' ? '?lang=' + ${JSON.stringify(lang)} : '';
        const res = await fetch('/members/archive/' + encodeURIComponent(id) + langSuffix);
        if(!res.ok) throw new Error('fetch failed: ' + res.status);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const card = doc.querySelector('.wrap .card');
        if(!card) throw new Error('story card not found in response');
        storyModalBody.innerHTML = card.innerHTML;
      }catch(err){
        // Honest failure, not a silent blank modal -- the real page is
        // one click away via the plain link this same card already has.
        storyModalBody.innerHTML = '<p class="modal-loading">' + escapeHtmlClient(${JSON.stringify(t(lang, "archive.officialSource"))}) + ': <a href="/members/archive/' + encodeURIComponent(id) + '">/members/archive/' + encodeURIComponent(id) + '</a></p>';
      }
    }

    function closeStory(pushHistory){
      storyOverlay.classList.remove('open');
      if(pushHistory !== false && location.pathname !== '/members/archive'){
        history.pushState({}, '', '/members/archive');
      }
    }

    document.getElementById('issueGrid').addEventListener('click', (e) => {
      const card = e.target.closest('.issue-card');
      if(!card) return;
      e.preventDefault();
      const id = card.getAttribute('href').replace(/^\\/members\\/archive\\//, '');
      openStory(decodeURIComponent(id));
    });

    storyModalClose.addEventListener('click', () => closeStory());
    storyOverlay.addEventListener('click', (e) => { if(e.target === storyOverlay) closeStory(); });
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && storyOverlay.classList.contains('open')) closeStory();
    });
    // Back button while a story is open closes it instead of leaving
    // the archive entirely, matching pushState's own expectation.
    window.addEventListener('popstate', (e) => {
      if(e.state && e.state.storyId){
        openStory(e.state.storyId, false);
      }else{
        storyOverlay.classList.remove('open');
      }
    });
  </script>`;
  return pageShell(body, lang);
}

function renderPreferencesPage(email, selectedCountries, justSaved, notificationsEnabled, lang, countryPicker) {
  lang = lang || "en";
  const selectedSet = new Set(selectedCountries || []);
  const notifChecked = notificationsEnabled !== false ? "checked" : "";
  const regionGroups = (countryPicker || [])
    .map(({ region, countries }) => {
      const checks = countries
        .map(({ englishName, displayName }) => {
          const checked = selectedSet.has(englishName) ? "checked" : "";
          // The submitted VALUE stays the canonical English name (that's
          // what's stored in KV and matched against issue tags) — only the
          // visible label is translated.
          return `<label class="country-check"><input type="checkbox" name="countries" value="${escapeHtml(englishName)}" ${checked}>${escapeHtml(displayName)}</label>`;
        })
        .join("");
      return `<div class="region-group"><p class="region-group-label">${escapeHtml(translateRegionName(lang, region))}</p>${checks}</div>`;
    })
    .join("");

  const body = `
  <div class="topbar">
    <a class="back-link" href="/members/archive" style="margin:0;">${t(lang, "backToArchive")}</a>
    <form method="POST" action="/members/logout"><button type="submit" class="logout-btn">${t(lang, "logout")}</button></form>
  </div>
  <div class="wrap">
    <div class="card">
      <p class="eyebrow">${t(lang, "archive.signedInAs")} ${escapeHtml(email)}</p>
      <h1 class="title">${t(lang, "preferences.title")}</h1>
      <p class="sub">${t(lang, "preferences.intro")}</p>
      ${justSaved ? `<div class="saved-banner">${t(lang, "preferences.saved")}</div>` : ""}
      <form method="POST" action="/members/preferences">
        <div class="prefs-actions">
          <a id="selectAllCountries">${t(lang, "preferences.selectAll")}</a>
          <a id="clearAllCountries">${t(lang, "preferences.clearAll")}</a>
        </div>
        <div class="prefs-box" id="prefsBox">${regionGroups}</div>
        <label class="country-check" style="margin:16px 0; font-size:13.5px;">
          <input type="checkbox" name="notificationsEnabled" ${notifChecked}>
          ${t(lang, "preferences.notifyLabel")}
        </label>
        <button type="submit" class="btn">${t(lang, "preferences.saveButton")}</button>
      </form>
    </div>
  </div>
  <script>
    document.getElementById('selectAllCountries').addEventListener('click', () => {
      document.querySelectorAll('#prefsBox input[type=checkbox]').forEach(cb => cb.checked = true);
    });
    document.getElementById('clearAllCountries').addEventListener('click', () => {
      document.querySelectorAll('#prefsBox input[type=checkbox]').forEach(cb => cb.checked = false);
    });
  </script>`;
  return pageShell(body, lang);
}

function renderSimpleMessage(title, subtext, lang) {
  lang = lang || "en";
  const body = `
  <div class="wrap">
    <a class="back-link" href="/members">${t(lang, "backToSignIn")}</a>
    <div class="card">
      <h1 class="title">${escapeHtml(title)}</h1>
      <p class="sub">${escapeHtml(subtext)}</p>
    </div>
  </div>`;
  return pageShell(body, lang);
}

function renderIssue(story, email, lang) {
  lang = lang || "en";
  const countryTagsHtml = (story.countries || []).length
    ? `<div class="issue-country-tags" style="margin:10px 0 0;">${story.countries.map((c) => `<span>${escapeHtml(c.displayName)}</span>`).join("")}</div>`
    : "";
  const sourceLinkHtml = story.sourceUrl
    ? `<p style="margin-top:18px;"><a href="${escapeHtml(story.sourceUrl)}" target="_blank" rel="noopener" style="color:var(--stamp); text-decoration:underline; font-size:13px;">🔗 ${escapeHtml(t(lang, "archive.officialSource"))}</a></p>`
    : "";
  // Deep-dive links are always rendered below the source link, never
  // embedded in a story's own HTML — a country with a NULL slug in D1
  // (e.g. European Union, which has no deep-dive page) is silently
  // skipped rather than linking somewhere broken. A story tagged with
  // several countries gets one link per country that actually has a page.
  const deepDiveLinksHtml = (story.countries || [])
    .filter((c) => c.deepDiveSlug)
    .map((c) => {
      const url = `https://e-invoicingcompliancecorner.com/${c.deepDiveSlug}`;
      return `<p style="margin-top:10px;"><a href="${url}" style="color:#b5432f; text-decoration:underline; font-weight:600; font-size:13px;">📖 ${escapeHtml(t(lang, "archive.readDeepDive")(c.displayName))}</a></p>`;
    })
    .join("");
  // Accuracy disclaimer — derived from the story's own date, not
  // hand-written per story, since every article here describes
  // mandate timelines that have already proven, repeatedly, to shift.
  const LOCALE_BY_LANG = { en: "en-GB", es: "es-ES", de: "de-DE", fr: "fr-FR" };
  const formattedDate = new Date(story.date + "T00:00:00Z").toLocaleDateString(
    LOCALE_BY_LANG[lang] || "en-GB",
    { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }
  );
  const accuracyNoteHtml = `<p style="margin-top:14px; font-size:12px; color:#8a7d5a; font-style:italic;">${escapeHtml(t(lang, "archive.accuracyNote")(formattedDate))}</p>`;
  const isAnonymous = !email;
  const promoBannerHtml = isAnonymous
    ? `<div class="promo-banner">${t(lang, "archive.promoBannerText")} <a href="https://e-invoicingcompliancecorner.com/subscribe.html" style="color:inherit; text-decoration:underline; font-weight:700; white-space:nowrap;">${t(lang, "archive.promoBannerCta")}</a></div>`
    : "";

  const body = `
  <div class="topbar">
    <a class="back-link" href="/members/archive" style="margin:0;">${t(lang, "backToArchive")}</a>
    ${isAnonymous ? "" : `<form method="POST" action="/members/logout"><button type="submit" class="logout-btn">${t(lang, "logout")}</button></form>`}
  </div>
  <div class="wrap">
    ${promoBannerHtml}
    <div class="card">
      <p class="eyebrow">${escapeHtml(story.date)}</p>
      <h1 class="title">${escapeHtml(story.title)}</h1>
      ${countryTagsHtml}
      <div>${story.html}</div>
      ${accuracyNoteHtml}
      ${sourceLinkHtml}
      ${deepDiveLinksHtml}
    </div>
  </div>`;
  return pageShell(body, lang);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
