"""Fill the gaps in the countryNames i18n map.

Run:  python3 migrations/gen_country_names.py
Writes: nothing to D1 — patches i18n/*.json only. See below.

Dan, 24 August 2026, on the new specification register: "I noticed that
the country names in the page are not translated."

They were not, and the cause turned out to be bigger than that page.
`countryNames` had 54 entries against 70 tracked jurisdictions, so
SEVENTEEN COUNTRIES HAVE BEEN SHOWING THEIR ENGLISH NAMES on the German,
French and Spanish tracker since the day each was added — Japan, Turkey,
South Korea, Vietnam, the whole 2026 Latin American run. The map is read
client-side by the tracker and by subscribe.html, both of which fall
back to the English name when a key is missing, so the failure renders
as a perfectly normal page. Nothing could see it.

WHY THIS IS NOT A MIGRATION. Every other string on this site has a D1
home and a generator that writes both halves. `countryNames` does not:
there is no `countries` translation namespace, and the tracker cannot
query D1 for its own labels — it is a static asset. So the asset IS the
source of truth here, and this script is the thing that keeps it
complete. tests/spec-register.mjs asserts the completeness, which is
what stops the next country being added without its names.

THE SEVENTEEN WERE NOT TRANSLATED BY GUESSWORK. Endonyms and
exonyms differ, and a wrong country name on a compliance site reads as
carelessness about the jurisdiction itself. These follow the usage of
each language's own standards body and press: German 'Tschechien' rather
than the older 'Tschechische Republik', French 'Viêt Nam' with the
diacritics the French state uses, Spanish 'Corea del Sur'.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
I18N = os.path.join(REPO, "i18n")
LANGS = ["en", "de", "fr", "es"]

NAMES = {
    "Argentina":      {"de": "Argentinien",  "fr": "Argentine",           "es": "Argentina"},
    "Colombia":       {"de": "Kolumbien",    "fr": "Colombie",            "es": "Colombia"},
    "Costa Rica":     {"de": "Costa Rica",   "fr": "Costa Rica",          "es": "Costa Rica"},
    "Czech Republic": {"de": "Tschechien",   "fr": "République tchèque",  "es": "República Checa"},
    "Ecuador":        {"de": "Ecuador",      "fr": "Équateur",            "es": "Ecuador"},
    "Hungary":        {"de": "Ungarn",       "fr": "Hongrie",             "es": "Hungría"},
    "Indonesia":      {"de": "Indonesien",   "fr": "Indonésie",           "es": "Indonesia"},
    "Israel":         {"de": "Israel",       "fr": "Israël",              "es": "Israel"},
    "Japan":          {"de": "Japan",        "fr": "Japon",               "es": "Japón"},
    "Jordan":         {"de": "Jordanien",    "fr": "Jordanie",            "es": "Jordania"},
    "Oman":           {"de": "Oman",         "fr": "Oman",                "es": "Omán"},
    "Pakistan":       {"de": "Pakistan",     "fr": "Pakistan",            "es": "Pakistán"},
    "Philippines":    {"de": "Philippinen",  "fr": "Philippines",         "es": "Filipinas"},
    "South Korea":    {"de": "Südkorea",     "fr": "Corée du Sud",        "es": "Corea del Sur"},
    "Turkey":         {"de": "Türkei",       "fr": "Turquie",             "es": "Turquía"},
    "Uruguay":        {"de": "Uruguay",      "fr": "Uruguay",             "es": "Uruguay"},
    "Vietnam":        {"de": "Vietnam",      "fr": "Viêt Nam",            "es": "Vietnam"},
}


def check(docs):
    problems = []
    for name, vals in NAMES.items():
        # The English map keys ON the English name, so en is the identity
        # and is written rather than listed above.
        for lang in ("de", "fr", "es"):
            if not vals.get(lang):
                problems.append(f"{name}: no {lang}")
    # AND THE MAPS STAY THE SAME SHAPE. A key present in German and
    # missing in French is the four-languages-or-none rule, applied to
    # the one string table that has no database to enforce it.
    keys = {lang: set(docs[lang].get("countryNames", {})) | set(NAMES) for lang in LANGS}
    for lang in LANGS[1:]:
        only_here = keys[lang] - keys["en"]
        only_en = keys["en"] - keys[lang]
        if only_here:
            problems.append(f"{lang} has names English does not: {', '.join(sorted(only_here))}")
        if only_en:
            problems.append(f"{lang} is missing: {', '.join(sorted(only_en))}")
    if problems:
        raise SystemExit("REFUSING TO PATCH:\n  " + "\n  ".join(problems))


if __name__ == "__main__":
    docs = {}
    for lang in LANGS:
        with open(os.path.join(I18N, f"{lang}.json"), encoding="utf-8") as fh:
            docs[lang] = json.load(fh)
    check(docs)
    for lang in LANGS:
        names = docs[lang].setdefault("countryNames", {})
        added = 0
        for name, vals in NAMES.items():
            value = name if lang == "en" else vals[lang]
            if names.get(name) != value:
                names[name] = value
                added += 1
        # Sorted, so a future diff shows the country that changed rather
        # than a reshuffle.
        docs[lang]["countryNames"] = {k: names[k] for k in sorted(names)}
        with open(os.path.join(I18N, f"{lang}.json"), "w", encoding="utf-8") as fh:
            json.dump(docs[lang], fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"  i18n/{lang}.json: {added} name(s) written, {len(names)} total")
