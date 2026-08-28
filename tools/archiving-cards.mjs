#!/usr/bin/env node
// archiving-cards.mjs — give eleven countries the Archiving spine card
// they are missing, by PROMOTING content they already carry.
//
//   node tools/archiving-cards.mjs            # report
//   node tools/archiving-cards.mjs --emit N   # write migrations/N_archiving_cards.sql
//
// SECOND BATCH, 27 August 2026: Croatia, Malaysia, New Zealand, Norway
// and Singapore. Same operation as the first eleven and the same rule --
// promote what the page already carries, write the period row from that
// country's own verified headline fact, and never invent a retention
// period. Where no retention row exists to promote, the card is two rows
// rather than three; padding to reach a third is the failure the
// framework's soft minimum exists to prevent.
//
// These five were refused by tools/respine.mjs for exactly one reason:
// no row routes to "Archiving". The operation is a promotion, not an
// authoring job:
//
//   - lift any existing retention row, in all four languages, out of the
//     card it is hiding in and into a new Archiving card;
//   - add ONE row per country stating the period and its legal basis,
//     written from that country's verified headline fact;
//   - add a signature row from signature_status, using one fixed phrasing
//     per value so the countries cannot disagree about what
//     "not required" means.
//
// THE PERIOD ROW IS PARAPHRASED, NOT COPIED. Every one of these countries
// already prints its retention period in the headline archiving tile, a
// few centimetres above. Repeating that string verbatim in a card is the
// duplication Dan objected to between compliance_model and
// mandate_summary, and adding a card that says what the tile said is not
// worth a card. Each row below therefore carries the citation and the
// detail the tile has no room for.
//
// CYPRUS SAYS IT DOES NOT KNOW. Its archiving_status is 'unknown' and its
// note records that only the contents page of the Tax Department's VAT
// guide was reachable. The framework's rule is that a country with
// nothing to say under a heading says so in one row rather than dropping
// the card, and this is the first country to exercise it. An Archiving
// card asserting a period we could not read would be worse than the gap.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { openReplayDb } from "../tests/lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const LANGS = ["en", "es", "de", "fr"];
const TITLE = { en: "Archiving", es: "Conservación", de: "Aufbewahrung", fr: "Conservation" };
const RETENTION_ROW = /^(retention|archiving|conservación|aufbewahrung|conservation)$/i;

// One phrasing per signature_status value, so eleven countries cannot
// disagree about what the same status word means.
const SIG_KEY = { en: "Signature", es: "Firma", de: "Signatur", fr: "Signature" };
const SIG = {
  not_required: {
    en: "Not required for the archived copy. Integrity rests on ordinary bookkeeping controls rather than on a certificate.",
    es: "No exigida para la copia archivada. La integridad descansa en los controles contables ordinarios, no en un certificado.",
    de: "Für die archivierte Kopie nicht erforderlich. Die Integrität stützt sich auf gewöhnliche Buchführungskontrollen, nicht auf ein Zertifikat.",
    fr: "Non exigée pour la copie archivée. L'intégrité repose sur les contrôles comptables ordinaires, non sur un certificat." },
  required: {
    en: "Required. The signature is part of what makes the stored document valid, so it must survive archiving intact.",
    es: "Exigida. La firma forma parte de lo que da validez al documento almacenado, así que debe sobrevivir intacta al archivo.",
    de: "Erforderlich. Die Signatur gehört zur Gültigkeit des gespeicherten Dokuments und muss die Archivierung unversehrt überstehen.",
    fr: "Exigée. La signature fait partie de ce qui rend le document stocké valide et doit survivre intacte à l'archivage." },
  conditional: {
    en: "Conditional. Required in some circumstances only — check which apply to you before deciding how to store.",
    es: "Condicional. Exigida solo en ciertas circunstancias: compruebe cuáles le afectan antes de decidir cómo almacenar.",
    de: "Bedingt. Nur unter bestimmten Umständen erforderlich — prüfen Sie, welche auf Sie zutreffen, bevor Sie die Ablage festlegen.",
    fr: "Conditionnelle. Exigée dans certains cas seulement — vérifiez lesquels vous concernent avant de choisir votre stockage." },
  unknown: {
    en: "Not confirmed. We could not establish the requirement from a primary source; treat it as open.",
    es: "Sin confirmar. No pudimos establecer el requisito desde una fuente primaria; trátelo como abierto.",
    de: "Nicht bestätigt. Wir konnten die Anforderung nicht aus einer Primärquelle belegen; behandeln Sie sie als offen.",
    fr: "Non confirmée. Nous n'avons pas pu établir l'exigence depuis une source primaire ; considérez-la comme ouverte." },
};

// The period row: one per country, carrying the citation and the detail
// the tile has no room for. Written from that country's verified fact.
const PERIOD = {
"Argentina": { key: { en: "Period and basis", es: "Plazo y fundamento", de: "Frist und Grundlage", fr: "Durée et fondement" },
  en: "Decree 1397/79 art. 48 runs the clock from the lapse of the prescription period rather than from the invoice date, which is why practice lands around ten years rather than five.",
  es: "El art. 48 del Decreto 1397/79 cuenta desde el vencimiento de la prescripción y no desde la fecha de factura, por lo que en la práctica son unos diez años y no cinco.",
  de: "Art. 48 des Dekrets 1397/79 lässt die Frist ab Ablauf der Verjährung laufen, nicht ab dem Rechnungsdatum — daher in der Praxis rund zehn statt fünf Jahre.",
  fr: "L'art. 48 du décret 1397/79 fait courir le délai depuis l'expiration de la prescription et non depuis la date de facture, d'où une pratique proche de dix ans." },
"Austria": { key: { en: "Period and basis", es: "Plazo y fundamento", de: "Frist und Grundlage", fr: "Durée et fondement" },
  en: "Seven years under BAO §132, counted from the end of the calendar year the document relates to — not from its own date.",
  es: "Siete años según el §132 BAO, contados desde el final del año natural al que se refiere el documento, no desde su propia fecha.",
  de: "Sieben Jahre nach §132 BAO, gerechnet ab Ende des Kalenderjahres, auf das sich der Beleg bezieht — nicht ab seinem eigenen Datum.",
  fr: "Sept ans selon le §132 BAO, comptés depuis la fin de l'année civile à laquelle le document se rapporte, non depuis sa propre date." },
"Colombia": { key: { en: "Period and basis", es: "Plazo y fundamento", de: "Frist und Grundlage", fr: "Durée et fondement" },
  en: "Five years under art. 632 of the Estatuto Tributario, counted from 1 January of the year after issue or receipt, and binding on both parties.",
  es: "Cinco años según el art. 632 del Estatuto Tributario, desde el 1 de enero del año siguiente a la emisión o recepción, y obliga a ambas partes.",
  de: "Fünf Jahre nach Art. 632 des Estatuto Tributario, ab dem 1. Januar des Folgejahres der Ausstellung oder des Empfangs, und für beide Seiten bindend.",
  fr: "Cinq ans selon l'art. 632 de l'Estatuto Tributario, depuis le 1er janvier de l'année suivant l'émission ou la réception, et opposable aux deux parties." },
"Cyprus": { key: { en: "Not confirmed", es: "Sin confirmar", de: "Nicht bestätigt", fr: "Non confirmé" },
  en: "We could not establish Cyprus's retention period from a primary source. Section VIII of the Tax Department's VAT guide EE10 would settle it; only its contents page was reachable.",
  es: "No pudimos establecer el plazo de conservación de Chipre desde una fuente primaria. La sección VIII de la guía de IVA EE10 lo resolvería; solo su índice era accesible.",
  de: "Die zyprische Aufbewahrungsfrist konnte nicht aus einer Primärquelle belegt werden. Abschnitt VIII des MWST-Leitfadens EE10 würde sie klären; erreichbar war nur dessen Inhaltsverzeichnis.",
  fr: "Nous n'avons pas pu établir la durée de conservation chypriote depuis une source primaire. La section VIII du guide TVA EE10 la trancherait ; seule sa table des matières était accessible." },
"Czech Republic": { key: { en: "Period and basis", es: "Plazo y fundamento", de: "Frist und Grundlage", fr: "Durée et fondement" },
  en: "Ten years under VAT Act 235/2004, counted from the end of the tax period in which the supply took place.",
  es: "Diez años según la Ley del IVA 235/2004, contados desde el final del período impositivo en que se realizó la operación.",
  de: "Zehn Jahre nach dem MWST-Gesetz 235/2004, gerechnet ab Ende des Besteuerungszeitraums, in dem die Leistung erbracht wurde.",
  fr: "Dix ans selon la loi TVA 235/2004, comptés depuis la fin de la période d'imposition au cours de laquelle l'opération a eu lieu." },
"Greece": { key: { en: "Period and basis", es: "Plazo y fundamento", de: "Frist und Grundlage", fr: "Durée et fondement" },
  en: "Five years under L. 4308/2014 art. 7, from the end of the period — and longer wherever another statute demands it, so five is a floor rather than an answer.",
  es: "Cinco años según el art. 7 de la L. 4308/2014, desde el fin del período, y más cuando otra norma lo exija: cinco es un suelo, no una respuesta.",
  de: "Fünf Jahre nach Art. 7 des G. 4308/2014, ab Periodenende — und länger, wo ein anderes Gesetz es verlangt; fünf ist eine Untergrenze, keine Antwort.",
  fr: "Cinq ans selon l'art. 7 de la L. 4308/2014, depuis la fin de la période — et davantage si une autre loi l'exige : cinq est un plancher, non une réponse." },
"Hungary": { key: { en: "Period and basis", es: "Plazo y fundamento", de: "Frist und Grundlage", fr: "Durée et fondement" },
  en: "Eight years under Accounting Act §169, and the documents must remain readable for the whole of it — which is a storage requirement, not just a retention one.",
  es: "Ocho años según el §169 de la Ley de Contabilidad, y los documentos deben permanecer legibles durante todo el plazo: es un requisito de soporte, no solo de conservación.",
  de: "Acht Jahre nach §169 des Rechnungslegungsgesetzes, und die Belege müssen die ganze Zeit lesbar bleiben — eine Anforderung an den Datenträger, nicht nur an die Frist.",
  fr: "Huit ans selon le §169 de la loi comptable, et les documents doivent rester lisibles pendant toute la durée — une exigence de support, pas seulement de conservation." },
"Netherlands": { key: { en: "Period and basis", es: "Plazo y fundamento", de: "Frist und Grundlage", fr: "Durée et fondement" },
  en: "Seven years for VAT records, and ten for data concerning immovable property — the longer period is the one people miss.",
  es: "Siete años para los registros de IVA y diez para los datos sobre bienes inmuebles: el plazo largo es el que suele pasarse por alto.",
  de: "Sieben Jahre für MWST-Unterlagen und zehn für Daten zu Grundstücken — die längere Frist ist die, die übersehen wird.",
  fr: "Sept ans pour les documents de TVA et dix pour les données relatives aux immeubles — c'est la durée longue que l'on oublie." },
"Oman": { key: { en: "Period and basis", es: "Plazo y fundamento", de: "Frist und Grundlage", fr: "Durée et fondement" },
  en: "Ten years after the end of the tax year under VAT Law RD 121/2020 art. 70, and fifteen for real estate.",
  es: "Diez años tras el cierre del año fiscal según el art. 70 de la Ley del IVA RD 121/2020, y quince para bienes inmuebles.",
  de: "Zehn Jahre nach Ende des Steuerjahres nach Art. 70 des MWST-Gesetzes RD 121/2020, und fünfzehn für Immobilien.",
  fr: "Dix ans après la fin de l'année fiscale selon l'art. 70 de la loi TVA RD 121/2020, et quinze pour l'immobilier." },
"Philippines": { key: { en: "Period and basis", es: "Plazo y fundamento", de: "Frist und Grundlage", fr: "Durée et fondement" },
  en: "Five years under RR 7-2024, implementing the EOPT Act, counted from the day after the filing deadline for the return — not from the invoice.",
  es: "Cinco años según la RR 7-2024, que desarrolla la Ley EOPT, contados desde el día siguiente al plazo de presentación de la declaración, no desde la factura.",
  de: "Fünf Jahre nach RR 7-2024 zur Umsetzung des EOPT-Gesetzes, gerechnet ab dem Tag nach der Abgabefrist der Erklärung — nicht ab der Rechnung.",
  fr: "Cinq ans selon le RR 7-2024 appliquant la loi EOPT, comptés depuis le lendemain de l'échéance de dépôt de la déclaration, non depuis la facture." },
"Croatia": { key: { en: "Period and basis", es: "Plazo y fundamento", de: "Frist und Grundlage", fr: "Durée et fondement" },
  en: "Six years under Fiscalisation Act art. 35, from the end of the year — and the e-invoice must be kept in its ORIGINAL form, so a PDF rendering of an XML invoice does not discharge it.",
  es: "Seis años según el art. 35 de la Ley de Fiscalización, desde el fin del año, y la factura electrónica debe conservarse en su forma ORIGINAL: un PDF de una factura XML no cumple.",
  de: "Sechs Jahre nach Art. 35 des Fiskalisierungsgesetzes, ab Jahresende — und die E-Rechnung ist in ihrer URSPRÜNGLICHEN Form aufzubewahren; ein PDF-Abbild einer XML-Rechnung genügt nicht.",
  fr: "Six ans selon l'art. 35 de la loi de fiscalisation, depuis la fin de l'année — et la facture électronique doit être conservée dans sa forme D'ORIGINE : un PDF d'une facture XML ne suffit pas." },
"Malaysia": { key: { en: "Period and basis", es: "Plazo y fundamento", de: "Frist und Grundlage", fr: "Durée et fondement" },
  en: "Seven years under Income Tax Act 1967 s.82A, counted from the end of the year of assessment rather than from the invoice — which pushes the real horizon past seven years for most documents.",
  es: "Siete años según el art. 82A de la Income Tax Act 1967, contados desde el fin del año de liquidación y no desde la factura, lo que lleva el horizonte real más allá de siete años.",
  de: "Sieben Jahre nach Abschnitt 82A des Income Tax Act 1967, gerechnet ab Ende des Veranlagungsjahres und nicht ab der Rechnung — der tatsächliche Horizont liegt damit über sieben Jahren.",
  fr: "Sept ans selon l'art. 82A de l'Income Tax Act 1967, comptés depuis la fin de l'année d'imposition et non depuis la facture, ce qui repousse l'horizon réel au-delà de sept ans." },
"New Zealand": { key: { en: "Period and basis", es: "Plazo y fundamento", de: "Frist und Grundlage", fr: "Durée et fondement" },
  en: "At least seven tax years, and the duty covers electronic records on the same footing as paper — there is no separate, lighter rule for a digital original.",
  es: "Al menos siete ejercicios fiscales, y el deber alcanza a los registros electrónicos en igualdad con el papel: no hay una regla aparte y más suave para el original digital.",
  de: "Mindestens sieben Steuerjahre, und die Pflicht erfasst elektronische Aufzeichnungen gleichrangig mit Papier — eine gesonderte, mildere Regel für das digitale Original gibt es nicht.",
  fr: "Au moins sept années fiscales, et l'obligation vise les documents électroniques au même titre que le papier : il n'existe pas de règle distincte et plus souple pour l'original numérique." },
"Norway": { key: { en: "Two different periods", es: "Dos plazos distintos", de: "Zwei verschiedene Fristen", fr: "Deux durées différentes" },
  en: "Five years for primary documentation, but ten for certain specification documents. Storing everything for five is not compliance, and the longer period is the one that gets missed.",
  es: "Cinco años para la documentación primaria, pero diez para ciertos documentos de especificación. Guardarlo todo cinco años no es cumplir, y el plazo largo es el que se pasa por alto.",
  de: "Fünf Jahre für die Primärdokumentation, aber zehn für bestimmte Spezifikationsunterlagen. Alles fünf Jahre aufzubewahren ist keine Erfüllung; übersehen wird die längere Frist.",
  fr: "Cinq ans pour la documentation primaire, mais dix pour certains documents de spécification. Tout garder cinq ans n'est pas se conformer, et c'est la durée longue que l'on oublie." },
"Singapore": { key: { en: "Period and form", es: "Plazo y forma", de: "Frist und Form", fr: "Durée et forme" },
  en: "Five years for GST records including e-invoices, and they must be kept in machine-readable form — a scan of a printout does not satisfy it.",
  es: "Cinco años para los registros de GST, incluidas las facturas electrónicas, y deben conservarse en forma legible por máquina: un escaneo de una impresión no basta.",
  de: "Fünf Jahre für GST-Unterlagen einschliesslich E-Rechnungen, und sie müssen maschinenlesbar aufbewahrt werden — ein Scan eines Ausdrucks genügt nicht.",
  fr: "Cinq ans pour les documents de GST, factures électroniques comprises, et ils doivent être conservés sous forme lisible par machine : un scan d'une impression ne suffit pas." },
"Taiwan": { key: { en: "Two different periods", es: "Dos plazos distintos", de: "Zwei verschiedene Fristen", fr: "Deux durées différentes" },
  en: "Invoices and vouchers five years, account books ten, under Commercial Accounting Act art. 38. Storing everything for five is not compliance.",
  es: "Facturas y comprobantes cinco años; libros contables diez, según el art. 38 de la Ley de Contabilidad Mercantil. Guardarlo todo cinco años no es cumplir.",
  de: "Rechnungen und Belege fünf Jahre, Geschäftsbücher zehn, nach Art. 38 des Handelsbuchführungsgesetzes. Alles fünf Jahre aufzubewahren ist keine Erfüllung.",
  fr: "Factures et pièces cinq ans, livres comptables dix, selon l'art. 38 de la loi sur la comptabilité commerciale. Tout garder cinq ans n'est pas se conformer." },
};

const { d1 } = await openReplayDb();
const all = async (s) => (await d1.prepare(s).bind().all()).results || [];
const names = Object.keys(PERIOD);
const IN = names.map((n) => `'${n.replace(/'/g, "''")}'`).join(",");

const facts = new Map((await all(
  `SELECT c.name_en n, h.signature_status s FROM country_headline_facts h
     JOIN countries c ON c.id = h.country_id WHERE c.name_en IN (${IN})`)).map((r) => [r.n, r.s]));

const cards = await all(`
  SELECT c.name_en n, d.sort_order so, t.lang, t.title, t.rows_json
    FROM deep_dive_cards d JOIN deep_dive_card_translations t ON t.card_id = d.id
    JOIN countries c ON c.id = d.country_id
   WHERE c.name_en IN (${IN}) AND d.section = 'file_format' ORDER BY c.name_en, d.sort_order`);

const plan = [];
const done = [];
for (const name of names) {
  const mine = cards.filter((r) => r.n === name);
  // Idempotence, added when the second batch was run against a corpus the
  // first batch had already changed: a country that HAS an Archiving card
  // is finished, and re-emitting would give it a second one. A generator
  // whose output depends on how many times it has been run is a generator
  // that will eventually be run twice.
  if (mine.some((r) => r.lang === "en" && r.title === TITLE.en)) { done.push(name); continue; }
  const bySo = new Map();
  for (const r of mine) { if (!bySo.has(r.so)) bySo.set(r.so, {}); bySo.get(r.so)[r.lang] = r; }
  let moved = null, fromSo = null;
  const rewritten = new Map();
  for (const [so, langs] of bySo) {
    if (LANGS.some((l) => !langs[l])) continue;
    const parsed = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(langs[l].rows_json || "[]")]));
    const idx = parsed.en.findIndex((row) => RETENTION_ROW.test(String(row[0]).trim()));
    if (idx === -1) continue;
    if (LANGS.some((l) => parsed[l].length !== parsed.en.length)) continue;
    moved = Object.fromEntries(LANGS.map((l) => [l, parsed[l][idx]]));
    fromSo = so;
    rewritten.set(so, Object.fromEntries(LANGS.map((l) => [l, parsed[l].filter((_, i) => i !== idx)])));
    break;
  }
  const sig = facts.get(name);
  const rows = Object.fromEntries(LANGS.map((l) => {
    const out = [[PERIOD[name].key[l], PERIOD[name][l]]];
    if (moved) out.push(moved[l]);
    out.push([SIG_KEY[l], SIG[sig][l]]);
    return [l, out];
  }));
  plan.push({ name, rows, moved: !!moved, fromSo, rewritten, sig, nextSo: bySo.size });
}

if (done.length) console.log(`  (${done.length} already have an Archiving card and are skipped: ${done.join(", ")})\n`);
for (const p of plan) {
  console.log(`  ${p.name.padEnd(16)} ${p.rows.en.length} rows  `
    + `${p.moved ? `(promoted a retention row out of card ${p.fromSo})` : "(no existing row to promote)"}  sig=${p.sig}`);
}

const i = process.argv.indexOf("--emit");
if (i === -1) { console.log("\n(report only — pass --emit <number>)"); process.exit(0); }

const esc = (s) => s.replace(/'/g, "''");
const lit = (s) => "'" + esc(s) + "'";
const out = []; const w = (s) => out.push(s);
w("-- The Archiving spine card for eleven countries. GENERATED by");
w("-- tools/archiving-cards.mjs -- re-run the tool rather than editing this.");
w("--");
w("-- Ten of these already carried a retention row, filed inside their");
w("-- \"Mandatory content\" card. That row is MOVED here in all four");
w("-- languages rather than copied, so nothing is duplicated and nothing");
w("-- is lost. The period row is written from each country's verified");
w("-- headline fact and deliberately paraphrases rather than repeats the");
w("-- archiving tile a few centimetres above it.");
w("--");
w("-- Cyprus says it does not know, which is the framework's rule about a");
w("-- heading with nothing under it working as intended.");
w("");
for (const p of plan) {
  w(`-- ---- ${p.name} ----`);
  for (const [so, langs] of p.rewritten) {
    for (const l of LANGS) {
      w(`UPDATE deep_dive_card_translations SET rows_json = ${lit(JSON.stringify(langs[l]))}`
        + ` WHERE lang = '${l}' AND card_id = (SELECT d.id FROM deep_dive_cards d`
        + ` JOIN countries c ON c.id = d.country_id WHERE c.name_en = ${lit(p.name)}`
        + ` AND d.section = 'file_format' AND d.sort_order = ${so});`);
    }
  }
  w(`INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'file_format', ${p.nextSo}`
    + ` FROM countries WHERE name_en = ${lit(p.name)};`);
  for (const l of LANGS) {
    w("INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json)");
    w(`SELECT d.id, '${l}', ${lit(TITLE[l])}, ${lit(JSON.stringify(p.rows[l]))}`
      + ` FROM deep_dive_cards d WHERE d.country_id = (SELECT id FROM countries WHERE name_en = ${lit(p.name)})`
      + ` AND d.section = 'file_format' AND d.sort_order = ${p.nextSo};`);
  }
  w("");
}
w("-- ---- what this migration claims it did ----");
for (const p of plan) {
  w(`-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id`
    + ` WHERE d.country_id = (SELECT id FROM countries WHERE name_en = ${lit(p.name)})`
    + ` AND d.section = 'file_format' AND t.title = ${lit(TITLE.en)} AND t.lang = 'en' = 1`);
}
w("-- The promoted row must be gone from where it was, or it now appears twice:");
for (const p of plan.filter((x) => x.moved)) {
  w(`-- ASSERT: SELECT count(*) FROM deep_dive_card_translations t JOIN deep_dive_cards d ON d.id = t.card_id`
    + ` WHERE d.country_id = (SELECT id FROM countries WHERE name_en = ${lit(p.name)})`
    + ` AND d.section = 'file_format' AND d.sort_order = ${p.fromSo} AND t.lang = 'en'`
    + ` AND (t.rows_json LIKE '%"Retention"%' OR t.rows_json LIKE '%"Archiving"%') = 0`);
}
const file = join(REPO, "members-worker", "migrations", `${process.argv[i + 1]}_archiving_cards.sql`);
writeFileSync(file, out.join("\n") + "\n");
console.log(`\nwrote ${file}`);
process.exit(0);
