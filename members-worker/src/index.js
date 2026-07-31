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

const SESSION_COOKIE = "eicc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MAGIC_LINK_TTL_SECONDS = 60 * 15; // 15 minutes

// Kept in sync with /countries.js on the static site — see the note at
// the top of that file. This Worker runs in a separate JS environment
// and can't load that file directly, so it keeps its own copy here.
// Maps a country's canonical English name to its deep-dive page filename
// on the main site. Not a simple lowercase-and-hyphenate transform —
// several use abbreviated filenames (uae.html, uk.html) — so this is an
// explicit table rather than a derived one. Countries without an entry
// here (e.g. European Union, which has no dedicated deep-dive page)
// simply get no deep-dive link rendered, rather than a broken one.
const COUNTRY_DEEP_DIVE_SLUGS = {
  "Australia": "australia", "Belgium": "belgium", "Brazil": "brazil", "Canada": "canada",
  "Chile": "chile", "China": "china", "Croatia": "croatia", "Denmark": "denmark", "Finland": "finland",
  "France": "france", "Germany": "germany", "India": "india", "Ireland": "ireland",
  "Italy": "italy", "Malaysia": "malaysia", "Mexico": "mexico", "New Zealand": "new-zealand",
  "Norway": "norway", "Peru": "peru", "Poland": "poland", "Portugal": "portugal", "Romania": "romania",
  "Saudi Arabia": "saudi-arabia", "Singapore": "singapore", "Slovakia": "slovakia",
  "Spain": "spain", "Sweden": "sweden", "United Arab Emirates": "uae",
  "United Kingdom": "uk", "United States": "united-states",
};

const COUNTRIES_BY_REGION = {
  "Europe": [
    "Belgium", "Croatia", "Denmark", "Finland", "France", "Germany", "Ireland",
    "Italy", "Norway", "Poland", "Portugal", "Romania", "Slovakia", "Spain",
    "Sweden", "United Kingdom"
  ],
  "Middle East": [
    "Saudi Arabia", "United Arab Emirates"
  ],
  "Asia-Pacific": [
    "Australia", "China", "India", "Malaysia", "New Zealand", "Singapore"
  ],
  "Americas": [
    "Brazil", "Canada", "Chile", "Mexico", "Peru", "United States"
  ]
};

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

const COUNTRY_NAME_TRANSLATIONS = {
  es: {
    "Belgium": "Bélgica", "Croatia": "Croacia", "Denmark": "Dinamarca", "Finland": "Finlandia", "France": "Francia",
    "Germany": "Alemania", "Ireland": "Irlanda", "Italy": "Italia", "Norway": "Noruega",
    "Poland": "Polonia", "Portugal": "Portugal", "Romania": "Rumania", "Slovakia": "Eslovaquia", "Spain": "España",
    "Sweden": "Suecia", "United Kingdom": "Reino Unido", "Saudi Arabia": "Arabia Saudita",
    "United Arab Emirates": "Emiratos Árabes Unidos", "Australia": "Australia", "China": "China",
    "India": "India", "Malaysia": "Malasia", "New Zealand": "Nueva Zelanda", "Singapore": "Singapur",
    "Brazil": "Brasil", "Canada": "Canadá", "Chile": "Chile", "Mexico": "México", "Peru": "Perú",
    "United States": "Estados Unidos"
  },
  de: {
    "Belgium": "Belgien", "Croatia": "Kroatien", "Denmark": "Dänemark", "Finland": "Finnland", "France": "Frankreich",
    "Germany": "Deutschland", "Ireland": "Irland", "Italy": "Italien", "Norway": "Norwegen",
    "Poland": "Polen", "Portugal": "Portugal", "Romania": "Rumänien", "Slovakia": "Slowakei", "Spain": "Spanien",
    "Sweden": "Schweden", "United Kingdom": "Vereinigtes Königreich", "Saudi Arabia": "Saudi-Arabien",
    "United Arab Emirates": "Vereinigte Arabische Emirate", "Australia": "Australien", "China": "China",
    "India": "Indien", "Malaysia": "Malaysia", "New Zealand": "Neuseeland", "Singapore": "Singapur",
    "Brazil": "Brasilien", "Canada": "Kanada", "Chile": "Chile", "Mexico": "Mexiko", "Peru": "Peru",
    "United States": "Vereinigte Staaten"
  },
  fr: {
    "Belgium": "Belgique", "Croatia": "Croatie", "Denmark": "Danemark", "Finland": "Finlande", "France": "France",
    "Germany": "Allemagne", "Ireland": "Irlande", "Italy": "Italie", "Norway": "Norvège",
    "Poland": "Pologne", "Portugal": "Portugal", "Romania": "Roumanie", "Slovakia": "Slovaquie", "Spain": "Espagne",
    "Sweden": "Suède", "United Kingdom": "Royaume-Uni", "Saudi Arabia": "Arabie saoudite",
    "United Arab Emirates": "Émirats arabes unis", "Australia": "Australie", "China": "Chine",
    "India": "Inde", "Malaysia": "Malaisie", "New Zealand": "Nouvelle-Zélande", "Singapore": "Singapour",
    "Brazil": "Brésil", "Canada": "Canada", "Chile": "Chili", "Mexico": "Mexique", "Peru": "Pérou",
    "United States": "États-Unis"
  }
};

function translateCountryName(lang, name) {
  return COUNTRY_NAME_TRANSLATIONS[lang]?.[name] || name;
}
function translateRegionName(lang, name) {
  const map = {
    es: { "Europe": "Europa", "Middle East": "Oriente Medio", "Asia-Pacific": "Asia-Pacífico", "Americas": "América" },
    de: { "Europe": "Europa", "Middle East": "Naher Osten", "Asia-Pacific": "Asien-Pazifik", "Americas": "Amerika" },
    fr: { "Europe": "Europe", "Middle East": "Moyen-Orient", "Asia-Pacific": "Asie-Pacifique", "Americas": "Amériques" },
  };
  return map[lang]?.[name] || name;
}

const WORKER_I18N = {
  en: {
    backToTracker: "← Back to global tracker", backToArchive: "← Back to archive", backToSignIn: "← Back to sign in", logout: "Log out",
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
    trialAlreadyUsed: { eyebrow: "Already used", title: "This email already had a free trial",
      body: "Each email address gets one free 60-day trial. If yours has already ended, you can still get full access by subscribing — no trial needed.",
      ctaButton: "Subscribe now →" },
    archive: {
      title: "Newsletter archive", signedInAs: "Signed in as",
      issuesPublished: (n) => `${n} issue${n === 1 ? "" : "s"} published. Search by keyword, or filter to a specific country.`,
      searchPlaceholder: "Search issue titles and summaries…",
      noIssuesYet: "No issues published yet — check back after the next monthly send.",
      noMatch: "No issues match your search or filter.",
      managePrefs: "Manage which countries you get alerts for →",
      officialSource: "Official source",
      editionAll: "All editions", editionLatest: "Latest edition", editionThisYear: "This year",
      readDeepDive: (country) => `Read the full ${country} Deep Dive for complete technical detail →`,
      accuracyNote: (date) => `Dates and thresholds above reflect the situation as of ${date} and may have changed since — check the official source and country deep dive below for the latest.`,
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
    login: {
      eyebrow: "Solo suscriptores", title: "Archivo del boletín",
      intro: "Introduzca el correo electrónico con el que se suscribió — le enviaremos un enlace de acceso de un solo clic. Sin contraseña que recordar.",
      emailLabel: "Correo electrónico", sendButton: "Enviar enlace de acceso",
      notSubscribed: "¿Aún no es suscriptor?", subscribeHere: "Suscríbase aquí",
      errorInvalid: "Introduzca una dirección de correo electrónico válida.",
      errorExpired: "Ese enlace ha caducado o no es válido — solicite uno nuevo.",
      errorNoActive: "No hemos encontrado una suscripción activa para ese correo. Si acaba de suscribirse, puede tardar un minuto en sincronizarse — inténtelo de nuevo enseguida.",
    },
    trialAlreadyUsed: { eyebrow: "Ya utilizado", title: "Este correo ya tuvo una prueba gratuita",
      body: "Cada dirección de correo electrónico obtiene una prueba gratuita de 60 días. Si la suya ya ha finalizado, aún puede obtener acceso completo suscribiéndose — sin necesidad de otra prueba.",
      ctaButton: "Suscribirse ahora →" },
    checkEmail: { eyebrow: "Ya casi está", title: "Revise su correo",
      body: "Si ese correo tiene una suscripción activa, un enlace de acceso está en camino — caduca en 15 minutos y funciona una sola vez. Revise el spam si no llega en uno o dos minutos." },
    archive: {
      title: "Archivo del boletín", signedInAs: "Sesión iniciada como",
      issuesPublished: (n) => `${n} número${n === 1 ? "" : "s"} publicado${n === 1 ? "" : "s"}. Busque por palabra clave o filtre por país.`,
      searchPlaceholder: "Buscar en títulos y resúmenes de los números…",
      noIssuesYet: "Aún no se ha publicado ningún número — vuelva después del próximo envío mensual.",
      noMatch: "Ningún número coincide con su búsqueda o filtro.",
      managePrefs: "Gestione los países sobre los que recibe alertas →",
      officialSource: "Fuente oficial",
      editionAll: "Todas las ediciones", editionLatest: "Última edición", editionThisYear: "Este año",
      readDeepDive: (country) => `Lea el análisis completo de ${country} para el detalle técnico completo →`,
      accuracyNote: (date) => `Las fechas y umbrales anteriores reflejan la situación a ${date} y pueden haber cambiado desde entonces — consulte la fuente oficial y el análisis del país a continuación para conocer las últimas novedades.`,
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
    login: {
      eyebrow: "Nur für Abonnenten", title: "Newsletter-Archiv",
      intro: "Geben Sie die E-Mail-Adresse ein, mit der Sie abonniert haben — wir senden Ihnen einen Ein-Klick-Anmeldelink. Kein Passwort nötig.",
      emailLabel: "E-Mail-Adresse", sendButton: "Anmeldelink senden",
      notSubscribed: "Noch kein Abonnent?", subscribeHere: "Hier abonnieren",
      errorInvalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      errorExpired: "Dieser Link ist abgelaufen oder ungültig — bitte fordern Sie einen neuen an.",
      errorNoActive: "Wir konnten kein aktives Abonnement für diese E-Mail finden. Falls Sie sich gerade erst angemeldet haben, kann die Synchronisierung einen Moment dauern — versuchen Sie es gleich noch einmal.",
    },
    trialAlreadyUsed: { eyebrow: "Bereits genutzt", title: "Für diese E-Mail wurde bereits eine kostenlose Testphase genutzt",
      body: "Jede E-Mail-Adresse erhält eine kostenlose 60-tägige Testphase. Wenn Ihre bereits beendet ist, erhalten Sie dennoch vollen Zugang durch ein Abonnement — keine weitere Testphase nötig.",
      ctaButton: "Jetzt abonnieren →" },
    checkEmail: { eyebrow: "Fast geschafft", title: "Prüfen Sie Ihre E-Mails",
      body: "Falls diese E-Mail ein aktives Abonnement hat, ist ein Anmeldelink unterwegs — er läuft nach 15 Minuten ab und funktioniert einmal. Prüfen Sie den Spam-Ordner, falls er nicht innerhalb weniger Minuten ankommt." },
    archive: {
      title: "Newsletter-Archiv", signedInAs: "Angemeldet als",
      issuesPublished: (n) => `${n} Ausgabe${n === 1 ? "" : "n"} veröffentlicht. Durchsuchen Sie sie nach Stichwort oder filtern Sie nach Land.`,
      searchPlaceholder: "Ausgabentitel und Zusammenfassungen durchsuchen…",
      noIssuesYet: "Noch keine Ausgabe veröffentlicht — schauen Sie nach dem nächsten monatlichen Versand wieder vorbei.",
      noMatch: "Keine Ausgabe entspricht Ihrer Suche oder Ihrem Filter.",
      managePrefs: "Verwalten Sie, für welche Länder Sie Benachrichtigungen erhalten →",
      officialSource: "Offizielle Quelle",
      editionAll: "Alle Ausgaben", editionLatest: "Neueste Ausgabe", editionThisYear: "Dieses Jahr",
      readDeepDive: (country) => `Lesen Sie die vollständige Länderanalyse ${country} für alle technischen Details →`,
      accuracyNote: (date) => `Die obigen Daten und Schwellenwerte spiegeln den Stand vom ${date} wider und können sich seither geändert haben — die aktuellsten Informationen finden Sie in der offiziellen Quelle und der Länderanalyse unten.`,
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
    login: {
      eyebrow: "Réservé aux abonnés", title: "Archives de la newsletter",
      intro: "Saisissez l'adresse e-mail utilisée pour votre abonnement — nous vous enverrons un lien de connexion en un clic. Pas de mot de passe à retenir.",
      emailLabel: "Adresse e-mail", sendButton: "Envoyer le lien de connexion",
      notSubscribed: "Pas encore abonné ?", subscribeHere: "Abonnez-vous ici",
      errorInvalid: "Veuillez saisir une adresse e-mail valide.",
      errorExpired: "Ce lien a expiré ou n'est pas valide — veuillez en demander un nouveau.",
      errorNoActive: "Nous n'avons trouvé aucun abonnement actif pour cet e-mail. Si vous venez de vous abonner, la synchronisation peut prendre un instant — réessayez sous peu.",
    },
    trialAlreadyUsed: { eyebrow: "Déjà utilisé", title: "Cet e-mail a déjà bénéficié d'un essai gratuit",
      body: "Chaque adresse e-mail bénéficie d'un essai gratuit de 60 jours. Si le vôtre est déjà terminé, vous pouvez tout de même obtenir un accès complet en vous abonnant — aucun nouvel essai nécessaire.",
      ctaButton: "S'abonner maintenant →" },
    checkEmail: { eyebrow: "Presque terminé", title: "Consultez vos e-mails",
      body: "Si cet e-mail correspond à un abonnement actif, un lien de connexion est en route — il expire dans 15 minutes et ne fonctionne qu'une fois. Vérifiez vos spams s'il n'arrive pas sous quelques minutes." },
    archive: {
      title: "Archives de la newsletter", signedInAs: "Connecté en tant que",
      issuesPublished: (n) => `${n} numéro${n === 1 ? "" : "s"} publié${n === 1 ? "" : "s"}. Recherchez par mot-clé ou filtrez par pays.`,
      searchPlaceholder: "Rechercher dans les titres et résumés des numéros…",
      noIssuesYet: "Aucun numéro publié pour l'instant — revenez après le prochain envoi mensuel.",
      noMatch: "Aucun numéro ne correspond à votre recherche ou filtre.",
      managePrefs: "Gérez les pays pour lesquels vous recevez des alertes →",
      officialSource: "Source officielle",
      editionAll: "Toutes les éditions", editionLatest: "Dernière édition", editionThisYear: "Cette année",
      readDeepDive: (country) => `Lire l'analyse complète de ${country} pour tous les détails techniques →`,
      accuracyNote: (date) => `Les dates et seuils ci-dessus reflètent la situation au ${date} et peuvent avoir changé depuis — consultez la source officielle et l'analyse du pays ci-dessous pour les dernières informations.`,
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
  const fromQuery = url.searchParams.get("lang");
  if (fromQuery && SUPPORTED_LANGS.includes(fromQuery)) return { lang: fromQuery, shouldSetCookie: true };

  const cookieLang = getCookie(request, LANG_COOKIE);
  if (cookieLang && SUPPORTED_LANGS.includes(cookieLang)) return { lang: cookieLang, shouldSetCookie: false };

  return { lang: "en", shouldSetCookie: false };
}

function withLangCookie(response, lang, shouldSetCookie) {
  if (!shouldSetCookie) return response;
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", `${LANG_COOKIE}=${lang}; Path=/; Max-Age=${LANG_COOKIE_TTL_SECONDS}; SameSite=Lax`);
  return new Response(response.body, { status: response.status, headers });
}

function renderLangSwitcher(lang, currentPath) {
  const links = SUPPORTED_LANGS.map((code) => {
    const isActive = code === lang;
    return `<a href="${currentPath}?lang=${code}" style="color:${isActive ? "var(--soon)" : "var(--muted)"}; font-weight:${isActive ? "700" : "400"}; text-decoration:none; margin-left:10px;">${code.toUpperCase()}</a>`;
  }).join("");
  return `<span style="font-family:'IBM Plex Mono',monospace; font-size:11.5px;">🌐${links}</span>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { lang, shouldSetCookie } = resolveLanguage(request);
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
        response = htmlResponse(renderLoginPage(null, lang));
      } else if (request.method === "POST" && url.pathname === "/members/login") {
        response = await handleLoginRequest(request, env, lang);
      } else if (request.method === "POST" && url.pathname === "/members/start-trial") {
        response = await handleStartTrial(request, env, lang);
      } else if (request.method === "GET" && url.pathname === "/members/verify") {
        response = await handleVerify(request, env, lang);
      } else if (request.method === "GET" && url.pathname === "/members/archive") {
        response = await handleArchiveList(request, env, lang);
      } else if (request.method === "GET" && url.pathname.startsWith("/members/archive/")) {
        const slug = decodeURIComponent(url.pathname.replace("/members/archive/", ""));
        response = await handleArchiveIssue(request, env, slug, lang);
      } else if (request.method === "GET" && url.pathname === "/admin/preview/milestones") {
        response = await handleMilestonesPreview(request, env, lang);
      } else if (request.method === "GET" && url.pathname === "/admin/preview/deep-dive") {
        response = await handleDeepDivePreview(request, env, lang);
      } else if (request.method === "GET" && url.pathname === "/members/preferences") {
        response = await handlePreferencesGet(request, env, lang);
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
      } else {
        response = new Response("Not found", { status: 404 });
      }
      return withLangCookie(response, lang, shouldSetCookie);
    } catch (err) {
      return new Response("Server error — " + err.message, { status: 500 });
    }
  },

  // Cloudflare Workers Cron Trigger entry point — see wrangler.toml's
  // [triggers] section for the actual schedule. Sends every active
  // subscriber a short, personalised notification about the current
  // month's issue, without emailing the full digest content itself.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendMonthlyNotifications(env));
  },
};

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

async function sendMonthlyNotifications(env) {
  const monthKey = currentMonthKey();
  const monthStories = await getStoriesForMonth(env, monthKey);
  if (monthStories.length === 0) {
    console.log(`No stories published for ${monthKey} yet — skipping this month's notification run.`);
    return;
  }

  let cursor = undefined;
  let sent = 0;
  do {
    const list = await env.SUBSCRIBERS.list({ cursor });
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
        await sendMonthlyNotificationEmail(env, email, monthKey, introText, storiesToShow, unsubToken);
        sent++;
      } catch (err) {
        console.error(`Failed to notify ${email}:`, err);
        // Deliberately continue to the next subscriber rather than aborting
        // the whole run over one failure.
      }
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  console.log(`Monthly notification run for ${monthKey} complete — sent ${sent} emails.`);
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
  await sendMonthlyNotifications(env);
  return new Response("Monthly notification run triggered — check `wrangler tail` for logs.", { status: 200 });
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

  if (!email || !email.includes("@")) {
    return htmlResponse(renderLoginPage(t(lang, "login.errorInvalid"), lang));
  }

  const active = await isCurrentlyActive(env, email);
  // Always show the same confirmation regardless of whether the email is an
  // active subscriber — this avoids revealing which emails are/aren't customers.
  if (active) {
    const token = await signToken(env.SESSION_SECRET, { email, purpose: "login" }, MAGIC_LINK_TTL_SECONDS);
    const link = `${env.SITE_URL}/members/verify?token=${encodeURIComponent(token)}${lang !== "en" ? `&lang=${lang}` : ""}`;
    await sendMagicLinkEmail(env, email, link);
  }

  return htmlResponse(renderCheckEmailPage(lang));
}

async function handleStartTrial(request, env, lang) {
  const form = await request.formData();
  const email = (form.get("email") || "").toString().toLowerCase().trim();
  const countriesRaw = (form.get("countries") || "").toString().trim();
  const countries = countriesRaw ? countriesRaw.split(",").map((c) => c.trim()).filter(Boolean) : [];

  if (!email || !email.includes("@")) {
    return htmlResponse(renderLoginPage(t(lang, "login.errorInvalid"), lang));
  }

  const existing = await getSubscriber(env, email);

  // One free trial per email, permanently — this is the actual blocking
  // mechanism (see the conversation this was designed in: IP address is
  // logged alongside the trial record for visibility into any organised
  // abuse patterns, but isn't used to block on its own, since a shared
  // office/coffee-shop IP would otherwise wrongly lock out a genuinely
  // different second customer).
  if (existing?.hadTrial) {
    return htmlResponse(renderTrialAlreadyUsedPage(lang));
  }

  const trialStartedAt = Date.now();
  const expiresAt = trialStartedAt + 60 * 24 * 60 * 60 * 1000; // 60 days
  const signupIp = request.headers.get("CF-Connecting-IP") || "";

  await putSubscriber(env, email, {
    active: true,
    plan: "trial",
    countries,
    hadTrial: true,
    trialStartedAt,
    trialSignupIp: signupIp,
    expiresAt,
  });

  // Send a login link immediately, so starting the trial and actually
  // getting into the archive is genuinely one step, not two — the whole
  // point of a low-friction trial is undermined if they then have to
  // separately go find the login page and re-type their email.
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
  const headers = new Headers();
  headers.set("Location", "/members/archive");
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
  const cookie = getCookie(request, SESSION_COOKIE);
  if (!cookie) return null;
  const payload = await verifyToken(env.SESSION_SECRET, cookie);
  if (!payload || payload.purpose !== "session") return null;
  const active = await isCurrentlyActive(env, payload.email);
  if (!active) return null;
  return payload.email;
}

async function handleArchiveList(request, env, lang) {
  const email = await requireSession(request, env);
  if (!email) return redirectToLogin();

  const { stories, regionByCountryName, englishNameByDisplayName } = await getStoriesWithCountries(env, lang);
  const subscriber = await getSubscriber(env, email);
  const preferredCountries = subscriber?.countries || [];

  return htmlResponse(renderArchiveList(stories, regionByCountryName, englishNameByDisplayName, preferredCountries, email, lang));
}

async function handleArchiveIssue(request, env, slug, lang) {
  const email = await requireSession(request, env);
  if (!email) return redirectToLogin();

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
    SELECT c.name_en, COALESCE(ct.display_name, c.name_en) as name
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
    countries: countryRows.map((r) => ({ displayName: r.name, englishName: r.name_en })),
  };

  return htmlResponse(renderIssue(story, lang));
}

// ---------------------------------------------------------------
// PROOF-OF-CONCEPT: dynamic milestones, queried live from D1, fed
// into two genuinely different templates -- the tracker's own card
// style, and the deep-dive page's timeline style. Not yet wired into
// the real tracker or deep-dive pages (those are still static Pages
// files) -- this is a preview route for verifying the architecture
// before committing to the full migration and cutover.
// ---------------------------------------------------------------
async function getMilestonesForCountry(env, countryName, lang) {
  const rows = await d1All(env, `
    SELECT m.id, m.date, m.anchor, m.source_url,
           COALESCE(mt.system, mt_en.system) as system,
           COALESCE(mt.desc, mt_en.desc) as desc,
           COALESCE(mt.actions, mt_en.actions) as actions
    FROM milestones m
    JOIN countries c ON c.id = m.country_id
    LEFT JOIN milestone_translations mt ON mt.milestone_id = m.id AND mt.lang = ?
    LEFT JOIN milestone_translations mt_en ON mt_en.milestone_id = m.id AND mt_en.lang = 'en'
    WHERE c.name_en = ?
    ORDER BY m.date ASC
  `, lang, countryName);
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    anchor: !!r.anchor,
    sourceUrl: r.source_url,
    system: r.system,
    desc: r.desc,
    actions: JSON.parse(r.actions || "[]"),
  }));
}

function formatMilestoneDate(dateStr) {
  const [y, m] = dateStr.split("-");
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
}

// Tracker-style rendering: matches the tracker's own card structure —
// active/upcoming milestones in the main list, anchor (settled,
// historical) milestones in a separate "Established regulations" group.
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
function renderDeepDiveStyleMilestones(milestones) {
  let lastMonthMarker = "";
  const cards = milestones.map((m) => {
    const marker = formatMilestoneDate(m.date);
    const markerHtml = marker !== lastMonthMarker
      ? `<div class="rmonth-marker">${escapeHtml(marker.split(" ")[1])}</div>`
      : "";
    lastMonthMarker = marker;
    const badgeClass = m.anchor || new Date(m.date) < new Date() ? "inforce" : "upcoming";
    const badgeLabel = badgeClass === "inforce" ? "In effect" : "Upcoming";
    return `${markerHtml}<div class="rcard">
      <div class="rcard-top"><span class="rcard-date">${escapeHtml(m.date)}</span><span class="rbadge ${badgeClass}">${badgeLabel}</span></div>
      <div class="rcard-title">${escapeHtml(m.system)}</div>
      <p class="rcard-desc">${escapeHtml(m.desc)}</p>
    </div>`;
  }).join("");
  return `<div class="rtimeline">${cards}</div>`;
}

async function getDeepDiveContent(env, countryName, lang) {
  const page = await d1First(env, `
    SELECT COALESCE(dpt.compliance_model, dpt_en.compliance_model) as compliance_model,
           COALESCE(dpt.footer_disclaimer, dpt_en.footer_disclaimer) as footer_disclaimer,
           COALESCE(dpt.timeline_intro, dpt_en.timeline_intro) as timeline_intro,
           COALESCE(dpt.file_format_intro, dpt_en.file_format_intro) as file_format_intro,
           COALESCE(dpt.scope_intro, dpt_en.scope_intro) as scope_intro,
           COALESCE(dpt.steps_intro, dpt_en.steps_intro) as steps_intro,
           COALESCE(dpt.penalties_intro, dpt_en.penalties_intro) as penalties_intro,
           ddp.last_updated
    FROM countries c
    JOIN deep_dive_pages ddp ON ddp.country_id = c.id
    LEFT JOIN deep_dive_page_translations dpt ON dpt.country_id = c.id AND dpt.lang = ?
    LEFT JOIN deep_dive_page_translations dpt_en ON dpt_en.country_id = c.id AND dpt_en.lang = 'en'
    WHERE c.name_en = ?
  `, lang, countryName);
  if (!page) return null;

  const stats = await d1All(env, `
    SELECT COALESCE(dst.stat_value, dst_en.stat_value) as stat_value,
           COALESCE(dst.stat_label, dst_en.stat_label) as stat_label
    FROM deep_dive_stats ds
    JOIN countries c ON c.id = ds.country_id
    LEFT JOIN deep_dive_stat_translations dst ON dst.stat_id = ds.id AND dst.lang = ?
    LEFT JOIN deep_dive_stat_translations dst_en ON dst_en.stat_id = ds.id AND dst_en.lang = 'en'
    WHERE c.name_en = ? ORDER BY ds.sort_order
  `, lang, countryName);

  const cardRows = await d1All(env, `
    SELECT dc.section,
           COALESCE(dct.title, dct_en.title) as title,
           COALESCE(dct.rows_json, dct_en.rows_json) as rows_json,
           COALESCE(dct.note, dct_en.note) as note,
           COALESCE(dct.body, dct_en.body) as body
    FROM deep_dive_cards dc
    JOIN countries c ON c.id = dc.country_id
    LEFT JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = ?
    LEFT JOIN deep_dive_card_translations dct_en ON dct_en.card_id = dc.id AND dct_en.lang = 'en'
    WHERE c.name_en = ? ORDER BY dc.section, dc.sort_order
  `, lang, countryName);
  const cards = { file_format: [], scope_transmission: [], penalties_related: [] };
  for (const r of cardRows) {
    (cards[r.section] ||= []).push({
      title: r.title,
      rows: r.rows_json ? JSON.parse(r.rows_json) : null,
      note: r.note,
      body: r.body,
    });
  }

  const steps = await d1All(env, `
    SELECT COALESCE(dstt.title, dstt_en.title) as title,
           COALESCE(dstt.description, dstt_en.description) as description
    FROM deep_dive_steps dst
    JOIN countries c ON c.id = dst.country_id
    LEFT JOIN deep_dive_step_translations dstt ON dstt.step_id = dst.id AND dstt.lang = ?
    LEFT JOIN deep_dive_step_translations dstt_en ON dstt_en.step_id = dst.id AND dstt_en.lang = 'en'
    WHERE c.name_en = ? ORDER BY dst.sort_order
  `, lang, countryName);

  const portals = await d1All(env, `
    SELECT dp.url, COALESCE(dpt.label, dpt_en.label) as label
    FROM deep_dive_portals dp
    JOIN countries c ON c.id = dp.country_id
    LEFT JOIN deep_dive_portal_translations dpt ON dpt.portal_id = dp.id AND dpt.lang = ?
    LEFT JOIN deep_dive_portal_translations dpt_en ON dpt_en.portal_id = dp.id AND dpt_en.lang = 'en'
    WHERE c.name_en = ? ORDER BY dp.sort_order
  `, lang, countryName);

  return { ...page, stats, cards, steps, portals };
}

function renderSpecCard(card) {
  const rowsHtml = (card.rows || []).map(([k, v]) => `<div class="spec-row"><span class="k">${escapeHtml(k)}</span><span class="v">${escapeHtml(v)}</span></div>`).join("");
  return `<div class="spec-card"><h3>${escapeHtml(card.title)}</h3>${rowsHtml}${card.note ? `<p class="note">${escapeHtml(card.note)}</p>` : ""}</div>`;
}

function renderRelatedCard(card) {
  return `<div class="related-card"><h4>${escapeHtml(card.title)}</h4><p>${escapeHtml(card.body)}</p></div>`;
}

// Full deep-dive page render, sourced entirely from D1 -- structurally
// matching the static portugal.html this is meant to replace, reusing
// the exact same CSS. Milestones come from the shared table (same data
// the tracker itself will read once that side is migrated too).
async function renderFullDeepDivePage(countryName, flag, code, region, content, milestones, lang) {
  const timelineHtml = renderDeepDiveStyleMilestones(milestones);
  const statsHtml = content.stats.map((s) => `<div class="stat"><div class="num display">${escapeHtml(s.stat_value)}</div><div class="lbl">${escapeHtml(s.stat_label)}</div></div>`).join("");
  const fileFormatHtml = content.cards.file_format.map(renderSpecCard).join("");
  const scopeHtml = content.cards.scope_transmission.map(renderSpecCard).join("");
  const relatedHtml = content.cards.penalties_related.map(renderRelatedCard).join("");
  const stepsHtml = content.steps.map((s, i) => `
    <div class="step"><div class="step-num"></div><div class="step-body"><h4>${escapeHtml(s.title)}</h4><p>${escapeHtml(s.description)}</p></div></div>`).join("");
  const portalsHtml = content.portals.map((p) => `<a class="portal-btn" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.label)}</a>`).join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(countryName)} E-Invoicing Requirements — The E-Invoicing Compliance Corner</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{--ink:#0f1a2b; --ink-2:#152238; --line:#2b3c5a; --text-lo:#f2f0e8; --muted:#93a3c0; --stamp:#b5432f; --live-dim:#274a38; --soon:#c98a3a; --upcoming-dim:#3a4864; --radius:10px;}
  *{box-sizing:border-box;} html,body{margin:0;padding:0;}
  body{background:var(--ink); color:var(--text-lo); font-family:'IBM Plex Sans',sans-serif; line-height:1.55;}
  .display{font-family:'Big Shoulders Display',sans-serif; font-weight:800;}
  .wrap{max-width:980px; margin:0 auto; padding:0 5vw 60px;}
  .back-link{display:inline-flex; align-items:center; gap:6px; margin:24px 0 0; font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--muted); text-decoration:none;}
  .back-link:hover{color:var(--soon);}
  .country-head{display:flex; flex-wrap:wrap; gap:18px; align-items:flex-start; justify-content:space-between; padding:18px 0 26px; border-bottom:1px solid var(--line); margin-bottom:28px;}
  .country-flag{font-size:46px; line-height:1;}
  .country-eyebrow{font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--soon); margin:0 0 4px;}
  .country-title{font-size:clamp(28px,4.5vw,42px); margin:0; text-transform:uppercase; line-height:0.95;}
  .country-region{font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--muted); margin-top:6px;}
  .country-meta{font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:var(--muted); text-align:right;}
  .stat-strip{display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:1px; background:var(--line); border:1px solid var(--line); border-radius:var(--radius); overflow:hidden; margin-bottom:36px;}
  .stat-strip .stat{background:var(--ink-2); padding:16px 18px;}
  .stat-strip .stat .num{font-family:'Big Shoulders Display',sans-serif; font-weight:800; font-size:22px; line-height:1.15;}
  .stat-strip .stat .lbl{font-size:10.8px; color:var(--muted); text-transform:uppercase; letter-spacing:0.07em; margin-top:5px;}
  .section{margin-bottom:44px;}
  .section-head{display:flex; align-items:baseline; gap:12px; margin-bottom:6px;}
  .section-head .num{color:var(--soon); font-size:13px;}
  .section-head h2{margin:0; font-size:clamp(20px,3vw,28px); text-transform:uppercase;}
  .section-intro{color:var(--muted); font-size:14.5px; max-width:760px; margin:0 0 20px;}
  .rtimeline{position:relative; padding-left:20px; border-left:2px solid var(--line);}
  .rmonth-marker{font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--soon); text-transform:uppercase; letter-spacing:0.08em; margin:22px 0 8px -20px; padding-left:20px;}
  .rmonth-marker:first-child{margin-top:0;}
  .rcard{background:var(--ink-2); border:1px solid var(--line); border-radius:var(--radius); padding:14px 18px; margin-bottom:10px;}
  .rcard-top{display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;}
  .rcard-date{font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--muted);}
  .rbadge{font-family:'IBM Plex Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.06em; padding:3px 9px; border-radius:999px;}
  .rbadge.inforce{background:var(--live-dim); color:#8fd4ac;}
  .rbadge.upcoming{background:var(--upcoming-dim); color:#c3ceE0;}
  .rcard-title{font-weight:600; margin-bottom:4px;}
  .rcard-desc{color:var(--muted); font-size:13.5px; margin:0;}
  .spec-grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px;}
  .spec-card{background:var(--ink-2); border:1px solid var(--line); border-radius:var(--radius); padding:18px 20px;}
  .spec-card h3{margin:0 0 12px; font-size:15px;}
  .spec-row{display:flex; justify-content:space-between; gap:12px; padding:6px 0; border-bottom:1px dashed var(--line); font-size:13.5px;}
  .spec-row:last-of-type{border-bottom:none;}
  .spec-row .k{color:var(--muted);} .spec-row .v{text-align:right; font-weight:600;}
  .note{color:var(--muted); font-size:12.5px; margin:10px 0 0; line-height:1.5;}
  .steps{display:flex; flex-direction:column; gap:12px;}
  .step{display:flex; gap:14px; background:var(--ink-2); border:1px solid var(--line); border-radius:var(--radius); padding:16px 20px;}
  .step-num{width:8px; height:8px; border-radius:50%; background:var(--soon); margin-top:7px; flex-shrink:0;}
  .step-body h4{margin:0 0 4px; font-size:14.5px;} .step-body p{margin:0; color:var(--muted); font-size:13.5px;}
  .related-grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:14px;}
  .related-card{background:var(--ink-2); border:1px solid var(--line); border-radius:var(--radius); padding:16px 18px;}
  .related-card h4{margin:0 0 6px; font-size:14px;} .related-card p{margin:0; color:var(--muted); font-size:13px;}
  .portal-row{display:flex; flex-wrap:wrap; gap:10px; margin:8px 0 40px;}
  .portal-btn{display:inline-block; background:var(--ink-2); border:1px solid var(--line); border-radius:999px; padding:9px 18px; font-family:'IBM Plex Mono',monospace; font-size:12.5px; text-decoration:none; color:var(--text-lo);}
  footer{border-top:1px solid var(--line); padding-top:20px; color:var(--muted); font-size:12px; line-height:1.6;}
</style>
</head>
<body>
<div class="wrap">
  <a class="back-link" href="einvoicing-compliance-tracker.html">← Back to global tracker</a>
  <div class="country-head">
    <div style="display:flex; gap:16px; align-items:center;">
      <div class="country-flag">${flag}</div>
      <div>
        <p class="country-eyebrow">Country deep dive — dynamically rendered from D1</p>
        <h1 class="country-title display">${escapeHtml(countryName)}</h1>
        <div class="country-region">${escapeHtml(region)} · ${escapeHtml(code)} · VAT area: EU</div>
      </div>
    </div>
    <div class="country-meta">Last updated: ${escapeHtml(content.last_updated)}<br>Compliance model: ${escapeHtml(content.compliance_model)}</div>
  </div>

  <div class="stat-strip">${statsHtml}</div>

  <div class="section">
    <div class="section-head"><span class="num mono">01</span><h2 class="display">Compliance timeline</h2></div>
    <p class="section-intro">${escapeHtml(content.timeline_intro)}</p>
    ${timelineHtml}
  </div>

  <div class="section">
    <div class="section-head"><span class="num mono">02</span><h2 class="display">File format &amp; data specification</h2></div>
    <p class="section-intro">${escapeHtml(content.file_format_intro)}</p>
    <div class="spec-grid">${fileFormatHtml}</div>
  </div>

  <div class="section">
    <div class="section-head"><span class="num mono">03</span><h2 class="display">Scope &amp; transmission</h2></div>
    <p class="section-intro">${escapeHtml(content.scope_intro)}</p>
    <div class="spec-grid">${scopeHtml}</div>
  </div>

  <div class="section">
    <div class="section-head"><span class="num mono">04</span><h2 class="display">Getting compliant</h2></div>
    <p class="section-intro">${escapeHtml(content.steps_intro)}</p>
    <div class="steps">${stepsHtml}</div>
  </div>

  <div class="section">
    <div class="section-head"><span class="num mono">05</span><h2 class="display">Penalties &amp; enforcement</h2></div>
    <p class="section-intro">${escapeHtml(content.penalties_intro)}</p>
    <div class="related-grid">${relatedHtml}</div>
  </div>

  <div class="portal-row">${portalsHtml}</div>

  <footer><p>${escapeHtml(content.footer_disclaimer)}</p></footer>
</div>
</body>
</html>`;
}

async function handleDeepDivePreview(request, env, lang) {
  const url = new URL(request.url);
  const countryName = url.searchParams.get("country") || "Portugal";

  const countryRow = await d1First(env, `SELECT code, region FROM countries WHERE name_en = ?`, countryName);
  if (!countryRow) return new Response(`Country "${countryName}" not found.`, { status: 404 });

  const content = await getDeepDiveContent(env, countryName, lang);
  if (!content) return new Response(`No deep-dive content in D1 for "${countryName}" yet.`, { status: 404 });

  const milestones = await getMilestonesForCountry(env, countryName, lang);
  const flagMap = { PT: "🇵🇹" }; // proof-of-concept only — full flag lookup comes with the real migration
  const flag = flagMap[countryRow.code] || "🏳️";

  const html = await renderFullDeepDivePage(countryName, flag, countryRow.code, countryRow.region, content, milestones, lang);
  return htmlResponse(html);
}


async function handleMilestonesPreview(request, env, lang) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country") || "Portugal";
  const milestones = await getMilestonesForCountry(env, country, lang);

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
      .rcard{background:#1c2c48; border:1px solid #2b3c5a; border-radius:10px; padding:14px 18px; margin-bottom:10px;}
      .rcard-top{display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;}
      .rcard-date{font-family:'IBM Plex Mono',monospace; font-size:12px; color:#93a3c0;}
      .rbadge{font-family:'IBM Plex Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.06em; padding:3px 9px; border-radius:999px;}
      .rbadge.inforce{background:#274a38; color:#8fd4ac;}
      .rbadge.upcoming{background:#3a4864; color:#c3ceE0;}
      .rcard-title{font-weight:600; margin-bottom:4px; color:#f2f0e8;}
      .rcard-desc{color:#93a3c0; font-size:13.5px; margin:0;}
    </style>
    ${renderDeepDiveStyleMilestones(milestones)}
  </div>`;

  return htmlResponse(pageShell(body, lang));
}



function redirectToLogin() {
  return new Response(null, { status: 302, headers: { Location: "/members" } });
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
  return htmlResponse(renderPreferencesPage(email, currentCountries, false, notificationsEnabled, lang));
}

async function handlePreferencesPost(request, env, lang) {
  const email = await requireSession(request, env);
  if (!email) return redirectToLogin();

  const form = await request.formData();
  const selected = form.getAll("countries"); // array of checked values
  const notificationsEnabled = form.get("notificationsEnabled") === "on";

  const existing = await getSubscriber(env, email);
  await putSubscriber(env, email, { ...(existing || {}), countries: selected, notificationsEnabled, updated: Date.now() });

  return htmlResponse(renderPreferencesPage(email, selected, true, notificationsEnabled, lang));
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
function buildEmailShell(bodyHtml, footerHtml) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f1a2b; padding:0; margin:0;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#efe9db; border-radius:10px;">
        <tr>
          <td style="background-color:#0f1a2b; padding:18px 28px; border-radius:10px 10px 0 0; border-bottom:3px solid #b5432f;">
            <p style="margin:0; font-family:'Courier New',Courier,monospace; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#c98a3a;">The E-Invoicing Compliance Corner</p>
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

// Wraps the raw Resend API call so failures are actually visible. A bare
// fetch() only rejects on network-level failures — it resolves normally
// even for a 401 (bad API key), 422 (rejected recipient/sender), or any
// other error Resend returns, meaning a broken send could previously
// look completely successful from this Worker's own perspective. This
// logs the full response body on any non-2xx status so `wrangler tail`
// actually shows what went wrong, instead of the failure being silent.
async function sendViaResend(env, payload) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "(could not read response body)");
    console.error(`Resend send failed — status ${res.status} for ${payload.to}: ${errorBody}`);
  }
  return res.ok;
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
    html: buildEmailShell(body, footer),
  });
}

async function sendMonthlyNotificationEmail(env, email, monthKey, introText, stories, unsubToken) {
  const archiveLink = `${env.SITE_URL}/members/archive`;
  const unsubLink = `${env.SITE_URL}/members/unsubscribe-notifications?token=${encodeURIComponent(unsubToken)}`;

  const monthLabel = new Date(monthKey + "-01T00:00:00Z").toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  const storyListHtml = stories
    .map((s) => {
      const link = `${env.SITE_URL}/members/archive/${encodeURIComponent(s.id)}`;
      return `<li style="margin:0 0 8px; font-size:14px; line-height:1.5;"><a href="${escapeHtml(link)}" style="color:#241d10; text-decoration:underline;">${escapeHtml(s.title)}</a></li>`;
    })
    .join("");

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

  await sendViaResend(env, {
    from: env.FROM_EMAIL,
    to: email,
    subject: `This month's e-invoicing updates — ${monthLabel}`,
    html: buildEmailShell(body, footer),
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

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
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
  .country-checkboxes{display:flex; flex-direction:column; gap:5px;}
  .country-checkboxes.two-col{display:block; column-count:2; column-gap:16px;}
  .country-checkboxes.two-col .country-check-filter{display:flex; margin-bottom:5px; break-inside:avoid;}
  .country-check-filter{
    display:inline-flex; align-items:center; gap:6px; font-family:'IBM Plex Mono',monospace; font-size:11.5px;
    color:var(--muted); cursor:pointer; user-select:none;
  }
  .country-check-filter:hover{color:var(--text-lo);}
  .country-check-filter input[type="checkbox"]{accent-color:var(--stamp); cursor:pointer;}
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
  .region-columns{display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:16px 24px; margin-bottom:22px;}
  .region-columns > .wide-region{grid-column:span 2;}
  @media (max-width:480px){ .region-columns > .wide-region{grid-column:span 1;} }
  .country-check{display:flex; align-items:center; gap:8px; padding:3px 0; font-size:12.8px; color:#241d10;}
  .country-check input{width:auto; margin:0;}
  .prefs-actions{display:flex; gap:14px; margin:10px 0;}
  .prefs-actions a{font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--stamp); text-decoration:underline; cursor:pointer;}
  .saved-banner{background:var(--live-dim); color:#bfe6cf; border-radius:6px; padding:10px 14px; font-size:12.8px; margin-bottom:16px;}
`;

function pageShell(bodyHtml, lang) {
  return `<!DOCTYPE html>
<html lang="${lang || "en"}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Subscriber Archive — The E-Invoicing Compliance Corner</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${BASE_STYLE}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

function renderLoginPage(error, lang) {
  lang = lang || "en";
  const body = `
  <div class="wrap">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <a class="back-link" href="https://e-invoicingcompliancecorner.com/einvoicing-compliance-tracker.html" style="margin:0;">${t(lang, "backToTracker")}</a>
      ${renderLangSwitcher(lang, "/members")}
    </div>
    <div class="card" style="margin-top:16px;">
      <p class="eyebrow">${t(lang, "login.eyebrow")}</p>
      <h1 class="title">${t(lang, "login.title")}</h1>
      <p class="sub">${t(lang, "login.intro")}</p>
      ${error ? `<div class="form-error">${escapeHtml(error)}</div>` : ""}
      <form method="POST" action="/members/login">
        <input type="hidden" name="lang" value="${lang}">
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
      <a href="https://e-invoicingcompliancecorner.com/subscribe.html" class="form-submit" style="display:inline-block; text-decoration:none; text-align:center; margin-top:10px;">${t(lang, "trialAlreadyUsed.ctaButton")}</a>
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
  const REGION_ORDER = ["Europe", "Middle East", "Asia-Pacific", "Americas"];
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

  const checkboxesHtml = `<div class="region-columns">${orderedRegions
    .map((region) => {
      const checks = countriesByRegion[region]
        .map((c) => {
          const isPreferred = preferredSet.has(englishNameByDisplayName[c] || c);
          return `<label class="country-check-filter"><input type="checkbox" class="country-filter-cb" value="${escapeHtml(c)}" ${isPreferred ? "checked" : ""}>${escapeHtml(c)}</label>`;
        })
        .join("");
      // Long lists wrap into two columns and span two grid tracks —
      // this isn't hardcoded to Europe specifically, so it applies to
      // any region that grows past the threshold, not just the one
      // that triggered it. Everything else keeps its original compact
      // width rather than every column being widened to accommodate
      // whichever region happens to be largest.
      const isWide = countriesByRegion[region].length > 8;
      const wrapClass = isWide ? " two-col" : "";
      const outerClass = isWide ? ' class="wide-region"' : "";
      return `<div${outerClass}><p class="region-group-label">${escapeHtml(translateRegionName(lang, region))}</p><div class="country-checkboxes${wrapClass}">${checks}</div></div>`;
    })
    .join("")}</div>`;

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

  const body = `
  <div class="topbar topbar-wide">
    <a class="back-link" href="https://e-invoicingcompliancecorner.com/einvoicing-compliance-tracker.html" style="margin:0;">${t(lang, "backToTracker")}</a>
    <div style="display:flex; align-items:center; gap:16px;">
      ${renderLangSwitcher(lang, "/members/archive")}
      <form method="POST" action="/members/logout"><button type="submit" class="logout-btn">${t(lang, "logout")}</button></form>
    </div>
  </div>
  <div class="archive-wrap">
    <div class="archive-head">
      <p class="eyebrow">${t(lang, "archive.signedInAs")} ${escapeHtml(email)}</p>
      <h1 class="title">${t(lang, "archive.title")}</h1>
      <p class="sub" style="margin-bottom:18px;">${t(lang, "archive.issuesPublished")(stories.length)}</p>
    </div>

    <p class="fineprint" style="margin:0 0 16px;"><a href="/members/preferences" style="color:var(--stamp); text-decoration:underline;">${t(lang, "archive.managePrefs")}</a></p>

    <div class="archive-toolbar">
      <input type="text" id="archiveSearch" class="archive-search" placeholder="${t(lang, "archive.searchPlaceholder")}">
      <select id="editionFilter" class="archive-search" style="flex:0 0 auto; cursor:pointer;">
        <option value="thisYear" selected>${t(lang, "archive.editionThisYear")}</option>
        <option value="latest">${t(lang, "archive.editionLatest")}</option>
        <option value="all">${t(lang, "archive.editionAll")}</option>
      </select>
    </div>
    ${allCountries.length ? `<div id="countryCheckboxes">${checkboxesHtml}</div>` : ""}

    <div class="issue-grid" id="issueGrid"></div>
  </div>
  <script>
    const ARCHIVE_STORIES = ${storiesJson};
    const NO_ISSUES_TEXT = ${JSON.stringify(t(lang, "archive.noIssuesYet"))};
    const NO_MATCH_TEXT = ${JSON.stringify(t(lang, "archive.noMatch"))};

    function escapeHtmlClient(str){
      return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function getCheckedCountries(){
      return Array.from(document.querySelectorAll('.country-filter-cb:checked')).map(cb => cb.value);
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
    document.querySelectorAll('.country-filter-cb').forEach(cb => {
      cb.addEventListener('change', renderGrid);
    });

    renderGrid();
  </script>`;
  return pageShell(body);
}

function renderPreferencesPage(email, selectedCountries, justSaved, notificationsEnabled, lang) {
  lang = lang || "en";
  const selectedSet = new Set(selectedCountries || []);
  const notifChecked = notificationsEnabled !== false ? "checked" : "";
  const regionGroups = Object.keys(COUNTRIES_BY_REGION)
    .map((region) => {
      const checks = COUNTRIES_BY_REGION[region]
        .map((country) => {
          const checked = selectedSet.has(country) ? "checked" : "";
          // The submitted VALUE stays the canonical English name (that's
          // what's stored in KV and matched against issue tags) — only the
          // visible label is translated.
          return `<label class="country-check"><input type="checkbox" name="countries" value="${escapeHtml(country)}" ${checked}>${escapeHtml(translateCountryName(lang, country))}</label>`;
        })
        .join("");
      return `<div class="region-group"><p class="region-group-label">${escapeHtml(translateRegionName(lang, region))}</p>${checks}</div>`;
    })
    .join("");

  const body = `
  <div class="topbar">
    <a class="back-link" href="/members/archive" style="margin:0;">${t(lang, "backToArchive")}</a>
    <div style="display:flex; align-items:center; gap:16px;">
      ${renderLangSwitcher(lang, "/members/preferences")}
      <form method="POST" action="/members/logout"><button type="submit" class="logout-btn">${t(lang, "logout")}</button></form>
    </div>
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

function renderIssue(story, lang) {
  lang = lang || "en";
  const countryTagsHtml = (story.countries || []).length
    ? `<div class="issue-country-tags" style="margin:10px 0 0;">${story.countries.map((c) => `<span>${escapeHtml(c.displayName)}</span>`).join("")}</div>`
    : "";
  const sourceLinkHtml = story.sourceUrl
    ? `<p style="margin-top:18px;"><a href="${escapeHtml(story.sourceUrl)}" target="_blank" rel="noopener" style="color:var(--stamp); text-decoration:underline; font-size:13px;">🔗 ${escapeHtml(t(lang, "archive.officialSource"))}</a></p>`
    : "";
  // Deep-dive links are always rendered below the source link, never
  // embedded in a story's own HTML — a country with no deep-dive page
  // (e.g. European Union) is silently skipped rather than linking
  // somewhere broken. A story tagged with several countries gets one
  // link per country that actually has a page.
  const deepDiveLinksHtml = (story.countries || [])
    .filter((c) => COUNTRY_DEEP_DIVE_SLUGS[c.englishName])
    .map((c) => {
      const url = `https://e-invoicingcompliancecorner.com/${COUNTRY_DEEP_DIVE_SLUGS[c.englishName]}.html`;
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
  const body = `
  <div class="topbar">
    <a class="back-link" href="/members/archive" style="margin:0;">${t(lang, "backToArchive")}</a>
    <div style="display:flex; align-items:center; gap:16px;">
      ${renderLangSwitcher(lang, `/members/archive/${encodeURIComponent(story.id)}`)}
      <form method="POST" action="/members/logout"><button type="submit" class="logout-btn">${t(lang, "logout")}</button></form>
    </div>
  </div>
  <div class="wrap">
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
