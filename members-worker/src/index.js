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
const COUNTRIES_BY_REGION = {
  "Europe": [
    "Belgium", "Croatia", "Denmark", "France", "Germany", "Ireland",
    "Italy", "Norway", "Poland", "Romania", "Slovakia", "Spain",
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
    "Belgium": "Bélgica", "Croatia": "Croacia", "Denmark": "Dinamarca", "France": "Francia",
    "Germany": "Alemania", "Ireland": "Irlanda", "Italy": "Italia", "Norway": "Noruega",
    "Poland": "Polonia", "Romania": "Rumania", "Slovakia": "Eslovaquia", "Spain": "España",
    "Sweden": "Suecia", "United Kingdom": "Reino Unido", "Saudi Arabia": "Arabia Saudita",
    "United Arab Emirates": "Emiratos Árabes Unidos", "Australia": "Australia", "China": "China",
    "India": "India", "Malaysia": "Malasia", "New Zealand": "Nueva Zelanda", "Singapore": "Singapur",
    "Brazil": "Brasil", "Canada": "Canadá", "Chile": "Chile", "Mexico": "México", "Peru": "Perú",
    "United States": "Estados Unidos"
  },
  de: {
    "Belgium": "Belgien", "Croatia": "Kroatien", "Denmark": "Dänemark", "France": "Frankreich",
    "Germany": "Deutschland", "Ireland": "Irland", "Italy": "Italien", "Norway": "Norwegen",
    "Poland": "Polen", "Romania": "Rumänien", "Slovakia": "Slowakei", "Spain": "Spanien",
    "Sweden": "Schweden", "United Kingdom": "Vereinigtes Königreich", "Saudi Arabia": "Saudi-Arabien",
    "United Arab Emirates": "Vereinigte Arabische Emirate", "Australia": "Australien", "China": "China",
    "India": "Indien", "Malaysia": "Malaysia", "New Zealand": "Neuseeland", "Singapore": "Singapur",
    "Brazil": "Brasilien", "Canada": "Kanada", "Chile": "Chile", "Mexico": "Mexiko", "Peru": "Peru",
    "United States": "Vereinigte Staaten"
  },
  fr: {
    "Belgium": "Belgique", "Croatia": "Croatie", "Denmark": "Danemark", "France": "France",
    "Germany": "Allemagne", "Ireland": "Irlande", "Italy": "Italie", "Norway": "Norvège",
    "Poland": "Pologne", "Romania": "Roumanie", "Slovakia": "Slovaquie", "Spain": "Espagne",
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
    archive: {
      title: "Newsletter archive", signedInAs: "Signed in as",
      issuesPublished: (n) => `${n} issue${n === 1 ? "" : "s"} published. Search by keyword, or filter to a specific country.`,
      searchPlaceholder: "Search issue titles and summaries…",
      noIssuesYet: "No issues published yet — check back after the next monthly send.",
      noMatch: "No issues match your search or filter.",
      managePrefs: "Manage which countries you get alerts for →",
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
    checkEmail: { eyebrow: "Ya casi está", title: "Revise su correo",
      body: "Si ese correo tiene una suscripción activa, un enlace de acceso está en camino — caduca en 15 minutos y funciona una sola vez. Revise el spam si no llega en uno o dos minutos." },
    archive: {
      title: "Archivo del boletín", signedInAs: "Sesión iniciada como",
      issuesPublished: (n) => `${n} número${n === 1 ? "" : "s"} publicado${n === 1 ? "" : "s"}. Busque por palabra clave o filtre por país.`,
      searchPlaceholder: "Buscar en títulos y resúmenes de los números…",
      noIssuesYet: "Aún no se ha publicado ningún número — vuelva después del próximo envío mensual.",
      noMatch: "Ningún número coincide con su búsqueda o filtro.",
      managePrefs: "Gestione los países sobre los que recibe alertas →",
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
    checkEmail: { eyebrow: "Fast geschafft", title: "Prüfen Sie Ihre E-Mails",
      body: "Falls diese E-Mail ein aktives Abonnement hat, ist ein Anmeldelink unterwegs — er läuft nach 15 Minuten ab und funktioniert einmal. Prüfen Sie den Spam-Ordner, falls er nicht innerhalb weniger Minuten ankommt." },
    archive: {
      title: "Newsletter-Archiv", signedInAs: "Angemeldet als",
      issuesPublished: (n) => `${n} Ausgabe${n === 1 ? "" : "n"} veröffentlicht. Durchsuchen Sie sie nach Stichwort oder filtern Sie nach Land.`,
      searchPlaceholder: "Ausgabentitel und Zusammenfassungen durchsuchen…",
      noIssuesYet: "Noch keine Ausgabe veröffentlicht — schauen Sie nach dem nächsten monatlichen Versand wieder vorbei.",
      noMatch: "Keine Ausgabe entspricht Ihrer Suche oder Ihrem Filter.",
      managePrefs: "Verwalten Sie, für welche Länder Sie Benachrichtigungen erhalten →",
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
    checkEmail: { eyebrow: "Presque terminé", title: "Consultez vos e-mails",
      body: "Si cet e-mail correspond à un abonnement actif, un lien de connexion est en route — il expire dans 15 minutes et ne fonctionne qu'une fois. Vérifiez vos spams s'il n'arrive pas sous quelques minutes." },
    archive: {
      title: "Archives de la newsletter", signedInAs: "Connecté en tant que",
      issuesPublished: (n) => `${n} numéro${n === 1 ? "" : "s"} publié${n === 1 ? "" : "s"}. Recherchez par mot-clé ou filtrez par pays.`,
      searchPlaceholder: "Rechercher dans les titres et résumés des numéros…",
      noIssuesYet: "Aucun numéro publié pour l'instant — revenez après le prochain envoi mensuel.",
      noMatch: "Aucun numéro ne correspond à votre recherche ou filtre.",
      managePrefs: "Gérez les pays pour lesquels vous recevez des alertes →",
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
      } else if (request.method === "GET" && url.pathname === "/members/verify") {
        response = await handleVerify(request, env, lang);
      } else if (request.method === "GET" && url.pathname === "/members/archive") {
        response = await handleArchiveList(request, env, lang);
      } else if (request.method === "GET" && url.pathname.startsWith("/members/archive/")) {
        const slug = decodeURIComponent(url.pathname.replace("/members/archive/", ""));
        response = await handleArchiveIssue(request, env, slug, lang);
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
async function sendMonthlyNotifications(env) {
  const monthKey = currentMonthKey();
  const issueRaw = await env.ISSUES.get(monthKey);
  if (!issueRaw) {
    console.log(`No issue published for ${monthKey} yet — skipping this month's notification run.`);
    return;
  }
  const issue = JSON.parse(issueRaw);
  const issueCountries = issue.countries || [];

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
        const matched = followed.filter((c) => issueCountries.includes(c));

        let message;
        if (followed.length === 0) {
          // No specific preference set — they get the full-digest framing every time.
          message = `This month's issue is live, covering: ${issueCountries.join(", ")}.`;
        } else if (matched.length > 0) {
          message = `This month's issue covers updates on: ${matched.join(", ")} — among others.`;
        } else {
          message = `None of your followed countries came up in this month's issue, but it's there if you're curious — this month covers: ${issueCountries.join(", ")}.`;
        }

        const unsubToken = await signToken(env.SESSION_SECRET, { email, purpose: "unsub-notifications" }, 60 * 60 * 24 * 365 * 5); // 5-year effective validity — this link should still work whenever someone gets around to clicking it
        await sendMonthlyNotificationEmail(env, email, issue.title, issue.summary, message, monthKey, unsubToken);
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
    await putSubscriber(env, email, { active, plan: "recurring", countries: resolvedCountries, updated: Date.now() });
  } else if (RECURRING_INACTIVE_EVENTS.includes(eventName)) {
    const existing = await getSubscriber(env, email);
    await putSubscriber(env, email, { ...(existing || {}), active: false, updated: Date.now() });
  } else if (eventName === "order_created") {
    // One-time purchase. Only treat as an active grant if it matches your
    // configured one-time product variant — everything else is ignored here.
    const variantId = String(attrs.first_order_item?.variant_id || "");
    if (env.ONE_TIME_VARIANT_ID && variantId === env.ONE_TIME_VARIANT_ID) {
      const purchasedAt = Date.now();
      const expiresAt = purchasedAt + 365 * 24 * 60 * 60 * 1000; // 12 months
      await putSubscriber(env, email, { active: true, plan: "onetime", countries, purchasedAt, expiresAt });
    }
  }

  return new Response("OK", { status: 200 });
}

async function putSubscriber(env, email, data) {
  await env.SUBSCRIBERS.put(email.toLowerCase().trim(), JSON.stringify(data));
}
async function getSubscriber(env, email) {
  const raw = await env.SUBSCRIBERS.get(email.toLowerCase().trim());
  return raw ? JSON.parse(raw) : null;
}
async function isCurrentlyActive(env, email) {
  const sub = await getSubscriber(env, email);
  if (!sub || !sub.active) return false;
  if (sub.plan === "onetime" && sub.expiresAt && Date.now() > sub.expiresAt) return false;
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

  const list = await env.ISSUES.list();
  const issues = [];
  for (const key of list.keys) {
    const raw = await env.ISSUES.get(key.name);
    if (raw) {
      const meta = JSON.parse(raw);
      issues.push({ slug: key.name, title: meta.title, date: meta.date, summary: meta.summary || "", countries: meta.countries || [] });
    }
  }
  issues.sort((a, b) => new Date(b.date) - new Date(a.date));

  return htmlResponse(renderArchiveList(issues, email, lang));
}

async function handleArchiveIssue(request, env, slug, lang) {
  const email = await requireSession(request, env);
  if (!email) return redirectToLogin();

  const raw = await env.ISSUES.get(slug);
  if (!raw) return new Response("Issue not found", { status: 404 });
  const issue = JSON.parse(raw);
  return htmlResponse(renderIssue(issue, lang));
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

async function sendMonthlyNotificationEmail(env, email, issueTitle, issueSummary, personalizedMessage, monthKey, unsubToken) {
  const archiveLink = `${env.SITE_URL}/members/archive/${encodeURIComponent(monthKey)}`;
  const unsubLink = `${env.SITE_URL}/members/unsubscribe-notifications?token=${encodeURIComponent(unsubToken)}`;

  const safeTitle = escapeHtml(issueTitle);
  const safeSummary = escapeHtml(issueSummary || "");
  const safeMessage = escapeHtml(personalizedMessage);

  const body = `
    <p style="margin:0 0 6px; font-family:'Courier New',Courier,monospace; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#c98a3a;">This month's issue</p>
    <h1 style="margin:0 0 12px; font-size:21px; line-height:1.3; color:#241d10; font-family:Georgia,'Times New Roman',serif;">${safeTitle}</h1>
    ${safeSummary ? `<p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#4a4030;">${safeSummary}</p>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e4dcc6; border-radius:8px; margin:0 0 24px;">
      <tr>
        <td style="padding:14px 16px;">
          <p style="margin:0; font-size:13.5px; line-height:1.55; color:#241d10;">${safeMessage}</p>
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#b5432f; border-radius:6px;">
          <a href="${archiveLink}" style="display:inline-block; padding:12px 22px; font-family:'Courier New',Courier,monospace; font-size:13px; font-weight:bold; color:#ffffff; text-decoration:none;">Read the full issue →</a>
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
    subject: `This month's issue is live — ${issueTitle}`,
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
  .country-pills{display:flex; flex-wrap:wrap; gap:6px; margin-bottom:22px;}
  .country-pill{
    font-family:'IBM Plex Mono',monospace; font-size:11.5px; background:var(--ink-2); border:1px solid var(--line);
    color:var(--muted); padding:5px 13px; border-radius:999px; cursor:pointer; transition:all .1s ease;
  }
  .country-pill:hover{border-color:var(--soon); color:var(--text-lo);}
  .country-pill.active{background:var(--stamp); border-color:var(--stamp); color:#fff;}
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
      <a class="back-link" href="/" style="margin:0;">${t(lang, "backToTracker")}</a>
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
      <p class="fineprint">${t(lang, "login.notSubscribed")} <a href="/subscribe.html" style="color:var(--stamp); text-decoration:underline;">${t(lang, "login.subscribeHere")}</a>.</p>
    </div>
  </div>`;
  return pageShell(body, lang);
}

function renderCheckEmailPage(lang) {
  lang = lang || "en";
  const body = `
  <div class="wrap">
    <a class="back-link" href="/">${t(lang, "backToTracker")}</a>
    <div class="card">
      <p class="eyebrow">${t(lang, "checkEmail.eyebrow")}</p>
      <h1 class="title">${t(lang, "checkEmail.title")}</h1>
      <p class="sub">${t(lang, "checkEmail.body")}</p>
    </div>
  </div>`;
  return pageShell(body, lang);
}

function renderArchiveList(issues, email, lang) {
  lang = lang || "en";
  // Build the master list of countries that actually appear across every
  // published issue, so the filter pills only ever show options that do
  // something — no point offering a country with zero matching issues.
  const allCountries = Array.from(new Set(issues.flatMap((i) => i.countries || []))).sort();

  const pillsHtml = allCountries
    .map((c) => `<button type="button" class="country-pill" data-country="${escapeHtml(c)}">${escapeHtml(translateCountryName(lang, c))}</button>`)
    .join("");

  // Ship the issue data to the client as JSON so search/filter can run
  // instantly without a round-trip to the Worker for every keystroke.
  const issuesJson = JSON.stringify(
    issues.map((i) => ({
      slug: i.slug,
      title: i.title,
      date: i.date,
      summary: i.summary || "",
      countries: (i.countries || []).map((c) => translateCountryName(lang, c)),
    }))
  );

  const body = `
  <div class="topbar topbar-wide">
    <a class="back-link" href="/" style="margin:0;">${t(lang, "backToTracker")}</a>
    <div style="display:flex; align-items:center; gap:16px;">
      ${renderLangSwitcher(lang, "/members/archive")}
      <form method="POST" action="/members/logout"><button type="submit" class="logout-btn">${t(lang, "logout")}</button></form>
    </div>
  </div>
  <div class="archive-wrap">
    <div class="archive-head">
      <p class="eyebrow">${t(lang, "archive.signedInAs")} ${escapeHtml(email)}</p>
      <h1 class="title">${t(lang, "archive.title")}</h1>
      <p class="sub" style="margin-bottom:18px;">${t(lang, "archive.issuesPublished")(issues.length)}</p>
    </div>

    <div class="archive-toolbar">
      <input type="text" id="archiveSearch" class="archive-search" placeholder="${t(lang, "archive.searchPlaceholder")}">
    </div>
    ${allCountries.length ? `<div class="country-pills" id="countryPills">${pillsHtml}</div>` : ""}

    <div class="issue-grid" id="issueGrid"></div>

    <p class="fineprint"><a href="/members/preferences" style="color:var(--stamp); text-decoration:underline;">${t(lang, "archive.managePrefs")}</a></p>
  </div>
  <script>
    const ARCHIVE_ISSUES = ${issuesJson};
    const NO_ISSUES_TEXT = ${JSON.stringify(t(lang, "archive.noIssuesYet"))};
    const NO_MATCH_TEXT = ${JSON.stringify(t(lang, "archive.noMatch"))};
    let activeCountry = null;

    function escapeHtmlClient(str){
      return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function renderGrid(){
      const q = document.getElementById('archiveSearch').value.trim().toLowerCase();
      const filtered = ARCHIVE_ISSUES.filter(i => {
        const matchesSearch = !q || i.title.toLowerCase().includes(q) || i.summary.toLowerCase().includes(q);
        const matchesCountry = !activeCountry || i.countries.includes(activeCountry);
        return matchesSearch && matchesCountry;
      });
      const grid = document.getElementById('issueGrid');
      if(ARCHIVE_ISSUES.length === 0){
        grid.innerHTML = '<p class="no-match">' + NO_ISSUES_TEXT + '</p>';
        return;
      }
      if(filtered.length === 0){
        grid.innerHTML = '<p class="no-match">' + NO_MATCH_TEXT + '</p>';
        return;
      }
      grid.innerHTML = filtered.map(i => \`
        <a class="issue-card" href="/members/archive/\${encodeURIComponent(i.slug)}">
          <div class="issue-date">\${escapeHtmlClient(i.date)}</div>
          <div class="issue-title">\${escapeHtmlClient(i.title)}</div>
          \${i.summary ? \`<div class="issue-summary">\${escapeHtmlClient(i.summary)}</div>\` : ''}
          \${i.countries.length ? \`<div class="issue-country-tags">\${i.countries.map(c => \`<span>\${escapeHtmlClient(c)}</span>\`).join('')}</div>\` : ''}
        </a>
      \`).join('');
    }

    document.getElementById('archiveSearch').addEventListener('input', renderGrid);
    document.querySelectorAll('.country-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const c = pill.dataset.country;
        activeCountry = (activeCountry === c) ? null : c;
        document.querySelectorAll('.country-pill').forEach(p => p.classList.toggle('active', p.dataset.country === activeCountry));
        renderGrid();
      });
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

function renderIssue(issue, lang) {
  lang = lang || "en";
  const body = `
  <div class="topbar">
    <a class="back-link" href="/members/archive" style="margin:0;">${t(lang, "backToArchive")}</a>
    <div style="display:flex; align-items:center; gap:16px;">
      ${renderLangSwitcher(lang, "/members/archive")}
      <form method="POST" action="/members/logout"><button type="submit" class="logout-btn">${t(lang, "logout")}</button></form>
    </div>
  </div>
  <div class="wrap">
    <div class="card">
      <p class="eyebrow">${escapeHtml(issue.date)}</p>
      <h1 class="title">${escapeHtml(issue.title)}</h1>
      <div>${issue.html}</div>
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
