#!/usr/bin/env node
// Write the signup panel's strings into i18n/{en,es,de,fr}.json.
//
//   node members-worker/migrations/generate_auth_i18n.mjs
//
// THE ENGLISH IS NEVER TYPED HERE. It is read out of auth-overlay.js's
// own t() fallbacks, so the JSON and the code cannot disagree — the same
// rule migration 590 was caught breaking when an em-dash was typed where
// the renderer had &mdash;, and the reason generate_595_prompt.py exists.
//
// TWELVE STRINGS ARE NOT TRANSLATED HERE AT ALL. The five field labels,
// their five error messages, the sell column's eyebrow and its free
// badge already exist in i18n/<lang>-subscribe.json, translated, because
// subscribe.html has asked for the same things for months. They are
// INHERITED, and the English is asserted to still match on both sides —
// so if anyone edits one, this generator stops rather than quietly
// producing two vocabularies for one form.
//
// D1 IS THE SOURCE. THE JSON IS AN ARTEFACT. This script writes both.
//
// The first version wrote only i18n/*.json, which was wrong in a way
// that would not have shown up for weeks: generate_files.py RECONSTRUCTS
// those files from D1's translations table, so a hand-edited block in
// one of them survives exactly until the next person runs it, and then
// vanishes. That is the "48 countries in eleven files while D1 said 56"
// defect with the arrow reversed — a generated file edited by hand.
//
// So the strings go into the `tracker` namespace under `auth.*` keys.
// generate_files.py unflattens dotted keys and maps that namespace to
// <lang>.json, so they land in exactly the auth block the panel reads,
// and a round trip through compare_generated.py proves the two agree.
//
// The planner gets the same data through site-worker reading the same
// asset. One source, two transports: a second COPY would be the defect,
// a second transport is not.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OVERLAY = join(REPO, "auth-overlay.js");
const LANGS = ["en", "es", "de", "fr"];

// ---- the English, read from the code -----------------------------------

function englishFromOverlay() {
  const src = readFileSync(OVERLAY, "utf8");
  const out = new Map();

  // t("key", "fallback") — the ordinary call sites.
  const re = /\bt\(\s*"([a-zA-Z0-9._]+)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (!out.has(m[1])) out.set(m[1], unescapeJs(m[2]));
  }

  // The five fields are built with t("field." + f.id, f.label), so the key
  // is never a literal and the regex above cannot see them. Read the
  // FIELDS table instead. Missing this is exactly how twenty keys once
  // dropped silently out of the ROI i18n check when plurals moved behind
  // a helper — the check kept passing on a smaller set.
  const fields = /var FIELDS = \[([\s\S]*?)\n  \];/.exec(src);
  if (!fields) throw new Error("FIELDS table not found in auth-overlay.js");
  const fre = /\{\s*id:\s*"(\w+)",\s*label:\s*"((?:[^"\\]|\\.)*)",\s*err:\s*"((?:[^"\\]|\\.)*)"/g;
  let f;
  let n = 0;
  while ((f = fre.exec(fields[1])) !== null) {
    out.set(`field.${f[1]}.label`, unescapeJs(f[2]));
    out.set(`field.${f[1]}.error`, unescapeJs(f[3]));
    n++;
  }
  if (n !== 5) throw new Error(`expected 5 fields, parsed ${n}`);
  return out;
}

function unescapeJs(v) {
  return v.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

// ---- the twelve inherited from the subscribe page ----------------------

const INHERITED = {
  "field.firstName.label": "card.form.firstName",
  "field.firstName.error": "card.form.firstNameError",
  "field.lastName.label": "card.form.lastName",
  "field.lastName.error": "card.form.lastNameError",
  "field.email.label": "card.form.email",
  "field.email.error": "card.form.emailError",
  "field.jobTitle.label": "card.form.jobTitle",
  "field.jobTitle.error": "card.form.jobTitleError",
  "field.company.label": "card.form.company",
  "field.company.error": "card.form.companyError",
  "sell.eyebrow": "benefits.eyebrow",
  "sell.free": "benefits.trialBadge",
};

// ---- everything else, translated ---------------------------------------
//
// English is deliberately ABSENT from this table: it comes from the code.
// A column here would be a second copy of it, and a second copy is the
// thing this file exists to avoid.
const T = {
  "signin.eyebrow": { es: "Iniciar sesión", de: "Anmelden", fr: "Connexion" },
  "signup.eyebrow": { es: "Cuenta gratuita", de: "Kostenloses Konto", fr: "Compte gratuit" },
  "signin.title": { es: "Bienvenido de nuevo", de: "Willkommen zurück", fr: "Bon retour" },
  "signup.title": {
    es: "Guarde esto y entérese cuando cambie",
    de: "Behalten Sie das — und erfahren Sie, wenn es sich ändert",
    fr: "Gardez ceci, et soyez averti des changements",
  },
  "signin.lede": {
    es: "Introduzca su dirección de correo y le enviaremos un código de 6 dígitos. Sin contraseña que recordar.",
    de: "Geben Sie Ihre E-Mail-Adresse ein, und wir senden Ihnen einen 6-stelligen Code. Kein Passwort zu merken.",
    fr: "Saisissez votre adresse e-mail et nous vous enverrons un code à 6 chiffres. Aucun mot de passe à retenir.",
  },
  "signup.lede": {
    es: "Gratis, sin datos de pago. Le enviaremos por correo un código de 6 dígitos para confirmar la dirección — usted permanece en esta página y no se pierde nada de lo que haya introducido.",
    de: "Kostenlos, ohne Zahlungsdaten. Wir senden Ihnen per E-Mail einen 6-stelligen Code zur Bestätigung der Adresse — Sie bleiben auf dieser Seite, und nichts von dem, was Sie eingegeben haben, geht verloren.",
    fr: "Gratuit, sans données de paiement. Nous vous enverrons par e-mail un code à 6 chiffres pour confirmer l'adresse — vous restez sur cette page et rien de ce que vous avez saisi n'est perdu.",
  },
  "signin.cta": { es: "Envíenme un código", de: "Code per E-Mail senden", fr: "Envoyez-moi un code" },
  "signup.cta": { es: "Crear mi cuenta gratuita", de: "Kostenloses Konto erstellen", fr: "Créer mon compte gratuit" },
  "signin.newHere": { es: "¿Es nuevo aquí?", de: "Neu hier?", fr: "Nouveau ici ?" },
  "signin.createOne": { es: "Cree una cuenta gratuita", de: "Kostenloses Konto erstellen", fr: "Créer un compte gratuit" },
  "signup.fine": {
    es: "¿Ya tiene una cuenta? Use la misma dirección y simplemente le iniciaremos sesión.",
    de: "Sie haben bereits ein Konto? Verwenden Sie dieselbe Adresse, und wir melden Sie einfach an.",
    fr: "Vous avez déjà un compte ? Utilisez la même adresse et nous vous connecterons simplement.",
  },

  "sell.stat1": { es: "jurisdicciones seguidas", de: "erfasste Länder", fr: "juridictions suivies" },
  "sell.stat2num": { es: "Mensual", de: "Monatlich", fr: "Mensuel" },
  "sell.stat2": { es: "resumen, más alertas", de: "Überblick, plus Warnungen", fr: "synthèse, plus alertes" },
  "sell.stat3num": { es: "Cero", de: "Null", fr: "Zéro" },
  "sell.stat3": { es: "spam entre medias", de: "Spam dazwischen", fr: "spam entre-temps" },
  "sell.title": {
    es: "Sepa en cuanto un gobierno se mueva",
    de: "Erfahren Sie es, sobald eine Regierung handelt",
    fr: "Sachez dès qu'un gouvernement bouge",
  },
  "sell.perk1": {
    es: "Cambios normativos en lenguaje claro",
    de: "Regeländerungen in klarer Sprache",
    fr: "Changements de règles en langage clair",
  },
  "sell.perk2": {
    es: "Solo los países que elija",
    de: "Nur die Länder, die Sie wählen",
    fr: "Uniquement les pays que vous choisissez",
  },
  "sell.perk3": {
    es: "Todos los números anteriores, con búsqueda",
    de: "Alle früheren Ausgaben, durchsuchbar",
    fr: "Tous les anciens numéros, avec recherche",
  },
  "sell.perk4": {
    es: "Nuevas guías antes que nadie",
    de: "Neue Leitfäden vor allen anderen",
    fr: "De nouveaux guides avant tout le monde",
  },
  "sell.perk5": {
    es: "Informes y análisis, directamente en su correo",
    de: "Whitepaper und Analysen, direkt in Ihr Postfach",
    fr: "Livres blancs et analyses, directement dans votre boîte mail",
  },
  "sell.perk6": {
    es: "Calculadora de ROI y planificación de olas de cumplimiento, con sus países guardados",
    de: "ROI-Rechner und Compliance-Wellenplanung, mit Ihren gespeicherten Ländern",
    fr: "Calculateur de ROI et planification des vagues de conformité, avec vos pays enregistrés",
  },

  "countries.lede": {
    es: "Le avisaremos cuando estos cambien — traídos de su plan. Quite los que no quiera recibir por correo:",
    de: "Wir benachrichtigen Sie, wenn sich diese ändern — aus Ihrem Plan übernommen. Entfernen Sie die, zu denen Sie keine E-Mails möchten:",
    fr: "Nous vous préviendrons lorsque ceux-ci changeront — repris de votre plan. Retirez ceux dont vous ne voulez pas d'e-mails :",
  },
  "countries.none": {
    es: "Le enviaremos el resumen mensual completo. Puede limitarlo a países concretos en cualquier momento desde sus preferencias.",
    de: "Wir senden Ihnen den vollständigen monatlichen Überblick. Sie können ihn jederzeit in Ihren Einstellungen auf bestimmte Länder eingrenzen.",
    fr: "Nous vous enverrons la synthèse mensuelle complète. Vous pouvez la restreindre à certains pays à tout moment dans vos préférences.",
  },
  "countries.pick": {
    es: "¿Sobre qué países quiere que le avisemos? Déjelo vacío y recibirá el resumen mensual completo.",
    de: "Zu welchen Ländern sollen wir Sie benachrichtigen? Lassen Sie das Feld leer, und Sie erhalten den vollständigen monatlichen Überblick.",
    fr: "Sur quels pays souhaitez-vous être alerté ? Laissez vide et vous recevrez la synthèse mensuelle complète.",
  },
  "countries.loading": { es: "Cargando la lista…", de: "Liste wird geladen…", fr: "Chargement de la liste…" },
  "countries.hide": { es: "Listo", de: "Fertig", fr: "Terminé" },
  "countries.more": { es: "Añadir o cambiar países", de: "Länder hinzufügen oder ändern", fr: "Ajouter ou modifier des pays" },
  "countries.choose": { es: "Elegir países", de: "Länder auswählen", fr: "Choisir des pays" },

  "sending": { es: "Enviando su código…", de: "Ihr Code wird gesendet…", fr: "Envoi de votre code…" },

  "code.eyebrow": { es: "Revise su correo", de: "Prüfen Sie Ihre E-Mails", fr: "Consultez vos e-mails" },
  "code.title": {
    es: "Introduzca su código de 6 dígitos",
    de: "Geben Sie Ihren 6-stelligen Code ein",
    fr: "Saisissez votre code à 6 chiffres",
  },
  // {0} IS THE ADDRESS, and it moves. German ends the clause with the
  // verb, so a version built by gluing the address onto a prefix could
  // only ever have read wrongly there. This is why the code was changed
  // to a slot before any of this was translated.
  "code.lede": {
    es: "Hemos enviado un código a {0}.",
    de: "Wir haben einen Code an {0} gesendet.",
    fr: "Nous avons envoyé un code à {0}.",
  },
  "code.lede2": {
    es: "Caduca en 10 minutos. Mantenga este panel abierto — no se pierde nada de lo que haya introducido.",
    de: "Er läuft in 10 Minuten ab. Lassen Sie dieses Fenster offen — nichts von dem, was Sie eingegeben haben, geht verloren.",
    fr: "Il expire dans 10 minutes. Gardez ce panneau ouvert — rien de ce que vous avez saisi n'est perdu.",
  },
  "code.cta": { es: "Confirmar", de: "Bestätigen", fr: "Confirmer" },
  "code.back": { es: "¿Dirección incorrecta? Volver", de: "Falsche Adresse? Zurück", fr: "Mauvaise adresse ? Revenir" },
  "code.resend": { es: "Enviar de nuevo", de: "Erneut senden", fr: "Renvoyer" },
  "code.resendIn": { es: "Enviar de nuevo", de: "Erneut senden", fr: "Renvoyer" },
  "code.checking": { es: "Comprobando…", de: "Wird geprüft…", fr: "Vérification…" },
  "code.noAccount": {
    es: "¿No llega nada? Puede que aún no tenga una cuenta.",
    de: "Kommt nichts an? Vielleicht haben Sie noch kein Konto.",
    fr: "Rien n'arrive ? Vous n'avez peut-être pas encore de compte.",
  },

  "err.rate": {
    es: "Son muchos códigos en una hora. Espere un poco e inténtelo de nuevo.",
    de: "Das sind viele Codes in einer Stunde. Bitte warten Sie etwas und versuchen Sie es erneut.",
    fr: "Cela fait beaucoup de codes en une heure. Patientez un peu et réessayez.",
  },
  "err.email": {
    es: "Esa dirección no parece correcta. Compruébela, por favor.",
    de: "Diese Adresse sieht nicht richtig aus. Bitte prüfen Sie sie.",
    fr: "Cette adresse ne semble pas correcte. Veuillez la vérifier.",
  },
  "err.fields": {
    es: "Rellene todos los campos.",
    de: "Bitte füllen Sie alle Felder aus.",
    fr: "Veuillez remplir tous les champs.",
  },
  "err.down": {
    es: "No podemos contactar con el servicio de cuentas en este momento. Inténtelo de nuevo en un minuto.",
    de: "Wir erreichen den Kontodienst gerade nicht. Bitte versuchen Sie es in einer Minute erneut.",
    fr: "Nous ne parvenons pas à joindre le service de comptes pour le moment. Réessayez dans une minute.",
  },
  "err.generic": {
    es: "Algo salió mal al enviar su código. Inténtelo de nuevo.",
    de: "Beim Senden Ihres Codes ist etwas schiefgegangen. Bitte versuchen Sie es erneut.",
    fr: "Une erreur s'est produite lors de l'envoi de votre code. Veuillez réessayer.",
  },
  "err.codeShape": {
    es: "Introduzca los seis dígitos.",
    de: "Bitte geben Sie alle sechs Ziffern ein.",
    fr: "Veuillez saisir les six chiffres.",
  },
  // ONE KEY PER PLURAL, not a number glued between two fragments. The
  // first version produced "1 tries left." in English before it had a
  // chance to produce its equivalent in three other languages.
  "err.wrongOne": {
    es: "Ese código no es correcto. Queda 1 intento.",
    de: "Dieser Code ist nicht richtig. Noch 1 Versuch.",
    fr: "Ce code n'est pas correct. Il reste 1 essai.",
  },
  "err.wrongMany": {
    es: "Ese código no es correcto. Quedan {0} intentos.",
    de: "Dieser Code ist nicht richtig. Noch {0} Versuche.",
    fr: "Ce code n'est pas correct. Il reste {0} essais.",
  },
  "err.locked": {
    es: "Demasiados intentos. Pida un código nuevo.",
    de: "Zu viele Versuche. Fordern Sie einen neuen Code an.",
    fr: "Trop de tentatives. Demandez un nouveau code.",
  },
  "err.expired": {
    es: "Ese código ha caducado. Pida uno nuevo.",
    de: "Dieser Code ist abgelaufen. Fordern Sie einen neuen an.",
    fr: "Ce code a expiré. Demandez-en un nouveau.",
  },
  "err.used": {
    es: "Ese código ya se ha usado. Pida uno nuevo.",
    de: "Dieser Code wurde bereits verwendet. Fordern Sie einen neuen an.",
    fr: "Ce code a déjà été utilisé. Demandez-en un nouveau.",
  },
  "err.browser": {
    es: "Ese código pertenece a otro navegador. Pida uno nuevo aquí.",
    de: "Dieser Code gehört zu einem anderen Browser. Fordern Sie hier einen neuen an.",
    fr: "Ce code appartient à un autre navigateur. Demandez-en un nouveau ici.",
  },
  "err.none": {
    es: "No encontramos ese código. Pida uno nuevo.",
    de: "Wir finden diesen Code nicht. Fordern Sie einen neuen an.",
    fr: "Nous ne trouvons pas ce code. Demandez-en un nouveau.",
  },
  "err.generic2": {
    es: "No hemos podido comprobar ese código. Inténtelo de nuevo.",
    de: "Wir konnten diesen Code nicht prüfen. Bitte versuchen Sie es erneut.",
    fr: "Nous n'avons pas pu vérifier ce code. Veuillez réessayer.",
  },
};

// ---- assembly ----------------------------------------------------------

function flat(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flat(v, key));
    else out[key] = v;
  }
  return out;
}

/** Nest dotted keys into objects.
 *
 *  THE GUARD IS THE POINT. The first version wrote both "field.email"
 *  (the label) and "field.email.error" — so the label became an object
 *  and vanished, silently, in all four languages. Nothing failed: the
 *  file was valid JSON, the generator reported 67 strings, and the panel
 *  would have fallen back to English labels forever while looking
 *  translated. Now a key that is both a leaf and a branch is an error.
 */
function nest(flatObj) {
  const out = {};
  for (const [k, v] of Object.entries(flatObj)) {
    const parts = k.split(".");
    let node = out;
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof node[parts[i]] === "string") {
        throw new Error(`key collision: "${k}" needs "${parts.slice(0, i + 1).join(".")}" `
          + `to be a branch, but another key already made it a leaf`);
      }
      if (typeof node[parts[i]] !== "object" || node[parts[i]] === null) node[parts[i]] = {};
      node = node[parts[i]];
    }
    const leaf = parts[parts.length - 1];
    if (node[leaf] !== undefined && typeof node[leaf] !== "string") {
      throw new Error(`key collision: "${k}" is a leaf, but another key made it a branch`);
    }
    node[leaf] = v;
  }
  return out;
}

const english = englishFromOverlay();
const subscribe = Object.fromEntries(LANGS.map((l) =>
  [l, flat(JSON.parse(readFileSync(join(REPO, "i18n", `${l}-subscribe.json`), "utf8")))]));

// The inherited twelve must still say the same thing on both sides.
for (const [authKey, subKey] of Object.entries(INHERITED)) {
  const mine = english.get(authKey);
  const theirs = subscribe.en[subKey];
  if (mine === undefined) throw new Error(`${authKey} is not in auth-overlay.js`);
  if (theirs === undefined) throw new Error(`${subKey} is not in en-subscribe.json`);
  if (mine !== theirs) {
    throw new Error(
      `INHERITED STRING HAS DRIFTED\n`
      + `  auth-overlay.js  ${authKey}: ${JSON.stringify(mine)}\n`
      + `  en-subscribe.json ${subKey}: ${JSON.stringify(theirs)}\n`
      + `  These are the same label on two surfaces of one form. Make them\n`
      + `  agree, or drop it from INHERITED and translate it properly.`);
  }
}

const missing = [];
for (const key of english.keys()) {
  if (INHERITED[key]) continue;
  if (!T[key]) missing.push(key);
}
if (missing.length) {
  throw new Error(`no translation for: ${missing.join(", ")}`);
}
const extra = Object.keys(T).filter((k) => !english.has(k));
if (extra.length) {
  throw new Error(`translated but no longer used by the panel: ${extra.join(", ")}`);
}

const perLang = {};
for (const lang of LANGS) {
  const path = join(REPO, "i18n", `${lang}.json`);
  const doc = JSON.parse(readFileSync(path, "utf8"));
  const auth = {};
  for (const [key, en] of english) {
    if (INHERITED[key]) auth[key] = subscribe[lang][INHERITED[key]];
    else auth[key] = lang === "en" ? en : T[key][lang];
    if (typeof auth[key] !== "string" || !auth[key]) {
      throw new Error(`${lang}: ${key} came out empty`);
    }
  }
  perLang[lang] = auth;
  doc.auth = nest(auth);
  writeFileSync(path, JSON.stringify(doc, null, 2) + "\n", "utf8");
  console.log(`${lang}.json: ${Object.keys(auth).length} auth strings`);
}

// ---- and the same rows into D1 -----------------------------------------

const sqlStr = (v) => "'" + String(v).replace(/'/g, "''") + "'";
const keys = [...english.keys()];
const lines = [`-- The signup panel speaks all four languages.
--
-- Dan, 21 August 2026: "please can you do the subscribe page
-- translations, into all four languages, EN / FR / ES / DE."
--
-- subscribe.html itself was already translated — 99 keys per language in
-- i18n/<lang>-subscribe.json, and has been for months. What was English
-- only was the PANEL that replaced it as the primary route: 67 strings
-- with an English fallback behind every one, so it looked healthy in
-- every language and read in one.
--
-- NAMESPACE 'tracker', KEYS PREFIXED auth. — not a namespace of its own.
-- generate_files.py maps the tracker namespace to i18n/<lang>.json and
-- unflattens dotted keys, so these land in exactly the auth block
-- auth-overlay.js reads. A namespace called 'auth' would have produced
-- i18n/<lang>-auth.json, which nothing loads.
--
-- TWELVE OF THE 67 ARE NOT NEW WORK. The five field labels, their five
-- errors, the sell column's eyebrow and its free badge already existed,
-- translated, in the subscribe namespace — the panel's English was
-- changed to match subscribe.html's word for word so they could simply
-- be inherited rather than re-commissioned in four languages. The
-- generator asserts the English still agrees on both sides, so that
-- stops being a coincidence and becomes a checked fact.
--
-- GENERATED by generate_auth_i18n.mjs, English read out of
-- auth-overlay.js's own t() fallbacks and never retyped — the rule
-- migration 590 was caught breaking over a single em-dash.

`];

for (const key of keys) {
  for (const lang of LANGS) {
    lines.push(
      "INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES "
      + `('tracker', ${sqlStr("auth." + key)}, '${lang}', ${sqlStr(perLang[lang][key])});`);
  }
}
lines.push("");
lines.push("-- ---- what this migration claims it did ------------------------------");
lines.push("-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' "
  + `AND key LIKE 'auth.%' = ${keys.length * LANGS.length}`);
for (const lang of LANGS) {
  lines.push("-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' "
    + `AND key LIKE 'auth.%' AND lang = '${lang}' = ${keys.length}`);
}
lines.push("");
lines.push("-- ---- and they stay in step -----------------------------------------");
lines.push("--");
lines.push("-- FOUR LANGUAGES OR NONE. The panel has an English fallback behind");
lines.push("-- every string, so a language that is missing rows does not break:");
lines.push("-- it silently serves English inside an otherwise translated page,");
lines.push("-- which is the half-translated render migration 589 exists to");
lines.push("-- prevent and the state this migration is fixing. Stated as an");
lines.push("-- invariant because the failure is invisible.");
lines.push("--");
lines.push("-- ASSERT ALWAYS: SELECT count(DISTINCT lang) FROM translations "
  + "WHERE namespace = 'tracker' AND key LIKE 'auth.%' = 4");
lines.push("-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT key FROM translations "
  + "WHERE namespace = 'tracker' AND key LIKE 'auth.%' GROUP BY key "
  + "HAVING count(DISTINCT lang) <> 4) = 0");
lines.push("");
lines.push("-- THE TWO SLOTS SURVIVE TRANSLATION. Both exist because of it: the");
lines.push("-- address used to be glued to the end of an English prefix, which");
lines.push("-- German cannot do, and the attempt count sat between two fragments.");
lines.push("-- A dropped brace loses the value out of the sentence entirely.");
lines.push("--");
lines.push("-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'tracker' "
  + "AND key = 'auth.code.lede' AND value LIKE '%{0}%' = 4");
lines.push("-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'tracker' "
  + "AND key = 'auth.err.wrongMany' AND value LIKE '%{0}%' = 4");
lines.push("");

writeFileSync(join(REPO, "members-worker", "migrations", "596_auth_panel_strings.sql"),
  lines.join("\n"), "utf8");
console.log(`596_auth_panel_strings.sql: ${keys.length * LANGS.length} rows`);
