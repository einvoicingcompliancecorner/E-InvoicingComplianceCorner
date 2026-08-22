# Adding a New Language — Runbook

> Written 17 August 2026, immediately after migrations 569–574 made the
> ROI & Wave Planner actually translatable. Before those, this document
> could not honestly have been written: the page would have failed to
> parse on its first French apostrophe, plurals were a ternary on
> `n === 1`, and nineteen strings sat in the renderer where no
> translator could reach them.
>
> Everything below was verified against the replayed migration chain and
> a rendered page on the date above. Where a number appears, it was
> counted, not remembered.
>
> **Updated 22 August 2026** for the compliance guides (Phase 5c), which
> added 72 chrome strings and 350 per-country note cells, and for the
> second copy of the country names that lives in code rather than in D1
> (Phase 3). Both were re-counted against the chain on that date. The
> planner sections are unchanged and were already accurate.

The failure mode this document guards against is **not errors**. A
missing translation renders in English and looks fine. A half-loaded
language renders a working page that mixes two languages inside one field
group. Nothing warns, because falling back to English is correct
behaviour for the reader and useless behaviour for you.

The planner is the one place with a real defence — `resolveRoiLang()`
refuses to serve a partial language at all. **Nothing else on the site
has that**, and the compliance guides deliberately do not: they fall back
key by key, so a 60%-translated guides namespace prints a
60%-translated document that looks finished. Where a phase below says a
job has no test behind it, that is the sentence it is repeating.

---

## Before you start

Decide these once, and write them down:

**The language code.** A two-letter ISO 639-1 code, lowercase — `it`,
`pt`, `pl`. The codebase treats it as an opaque string and hands it
straight to `Intl`, so it must be a tag `Intl` recognises. Regional
variants (`pt-BR`, `zh-Hans`) work everywhere the code touches, but no
existing row uses one and the language chips render the code in
uppercase, so `PT-BR` will look odd beside `EN`. Prefer the bare code
unless you genuinely need the distinction.

**Whether you are translating the whole site or just the planner.** The
ROI page is not standalone. A reader arrives from the tracker, and a
tracker in English leading to a planner in Italian is worse than either.
The planner is 521 cells; the rest of the site is another 653 rows. See
Phase 5.

**Who is translating.** This matters more than usual, because **68 of the
417** planner strings are *evidence and finance copy* — the `ev.`, `src.`
and `basis.` families: citations, benchmark provenance, and the
derivation printed under every figure in the savings table. A
translator who does not know what "clearance regime" or "loaded FTE cost"
means will produce fluent nonsense in exactly the rows a CFO reads
hardest. Give them the glossary in Phase 2.

---

## What "a language" consists of

Four D1 tables and one code constant. Nothing else.

| Where | What | English size |
| --- | --- | --- |
| `translations`, namespace `roi` | every string on the planner | **430 keys** |
| `roi_benchmark_translations` | benchmark `label`, `hint`, `citation` | **31 rows × 3 = 93 cells** |
| `roi_phase_translations` | phase `name`, `note` | **7 rows × 2 = 14 cells** |
| `translations`, namespace `tracker`, `guides.*` | the compliance guides — chooser, wall and printed document | **72 keys** |
| `translations`, namespace `tracker`, `method.*` | the /methodology page | **34 keys** |
| `country_headline_fact_translations` | the qualifying line under each headline fact | **70 rows × 5 = 350 cells** |
| `country_translations` | jurisdiction display names | **71 rows** |
| `COUNTRY_NAME_TRANSLATIONS` (code) | the same names again, for the deep dives and the guides | see Phase 3 |
| `SUPPORTED_LANGS` (code) | which codes the routers accept | 1 declaration |

The planner's own coverage figure — what `tests/roi-coverage.mjs`
reports — is the first three: **537 cells**. Country names are counted
separately because they are shared with the rest of the site and are
already done for `de`, `es` and `fr`.

**The compliance guides are the two rows after the planner, and the
second of them is the largest single job on this page.** 350 note cells,
and they are English-only in every language today — see Phase 5c. No
coverage test reports them, which is exactly why they are in this table.

**Do not retype those totals from this table.** They moved by fifteen
cells in three days and this document was wrong about them until it was
checked. Run `node tests/roi-coverage.mjs`, which prints the live count
and is the only figure worth quoting.

---

## Phase 0 — open the gate

Until you do this, everything else is invisible. `?lang=it` does not
error; it is silently served in English.

`SUPPORTED_LANGS` lives in **one place**, `shared/deep-dive-render.mjs`,
exported and imported by both workers. It used to exist twice, and this
runbook used to carry a paragraph telling you to remember to edit both
copies — migration 589 deleted the duplicate, because a runbook
instruction to keep two lists in step is a defect with documentation
attached.

Three things read the constant, and all three matter:

- `resolveLanguage()` (`members-worker/src/index.js:326`) — query
  parameter, then cookie, then `"en"`
- `pickBestSupportedLanguage()` (`site-worker/src/index.js:250`) —
  `Accept-Language` negotiation on the public side only
- `renderLangBanner()` — the EN/ES/DE/FR chips, generated by mapping over
  the array, so a code that is not in it cannot be clicked either

### And the planner has a second gate, which you do not edit

Adding a code to `SUPPORTED_LANGS` makes the language selectable
everywhere on the site. The ROI planner then applies its own rule on top,
in `resolveRoiLang()` (`shared/roi-render.mjs`):

> **Complete or English.** If the requested language is missing even one
> `roi` key, the planner serves English — all of it, including country
> names — and prints one line saying so, naming the language the way that
> language names itself.

**This is not something to work around.** Before migration 589 the
planner served whatever it had: `?lang=de` returned `<html lang="de">`
with a country picker reading BELGIEN and DEUTSCHLAND, sorted by German
collation, and every other string in English. Three of the four offered
languages did that, and had since country names were first joined into
the picker.

The mix is worse than either side of it. English throughout is a tool
that has not been translated yet, which a reader understands. German
nouns inside English prose reads as a translation that broke.

The practical consequence for you is good: **adding a language to the
planner is one operation — load its rows.** At the moment the last key
lands, `resolveRoiLang` starts returning it, all four getters follow, the
fallback notice stops rendering, and no code changes anywhere. You never
edit the gate.

The corollary is that a half-finished language shows nothing. Use
`IN_PROGRESS` in `tests/roi-coverage.mjs` while you work, and expect the
page to stay English until you are done.

### Which is why the planner was English for everyone until 21 August 2026

Worth knowing, because nothing on the site said so and the gate was
working exactly as designed the whole time.

The `roi` namespace held **433 English keys and zero rows in any other
language** — not a partial translation, none at all. `resolveRoiLang`
therefore fell back for `es`, `de` and `fr` on every request, and had done
since the planner was built. A Spanish reader got a fully Spanish tracker,
clicked Resources → ROI & Wave Planner, and landed on an English page with
one line explaining why.

Everything around it was translated: the tracker, the education pages,
`subscribe`, `feedback`, country names, milestones, deep dives, and as of
migration 596 the sign-up panel. The planner was the one surface that
never had been.

**All four languages are done** — German (597), French (598), Spanish
(599). No supported language falls back any more, which means this
runbook is now written for the language *after* these: a fifth one would
be Phases 1–4 for a language that does **not** already exist elsewhere on
the site, so it needs country names, tracker strings and the sign-up
panel as well as the planner. Read Phase 5b before starting either way,
because most of what the first one cost was not translation.

---

## Phase 1 — the string contract

Give the translator these rules **before** they start, not after review.
Every one of them exists because it was broken.

**Slots are `{0}`, `{1}`, `{2}` and they may be reordered.** That is the
whole point of them. `fill()` substitutes positionally, so
`"{1} von {0}"` is legal and correct where the language needs it. What is
*not* legal is dropping a slot: `guard.late` without `{1}` renders a
warning that names no jurisdictions, and the English still reads
perfectly, so nothing catches it but a standing invariant.

**A slot may contain markup.** Several carry an evidence chip or a
`<strong>`-wrapped figure. Treat them as opaque and place them; do not
try to translate inside one.

**Never a raw double quote (`"`).** Help text is written into an
`aria-label` attribute, and a `"` terminates it — silently, with nothing
visible on screen and a truncated assistive reading. Use the language's
own quotation marks: `„…"` for German, `«…»` for French, `‹…›`, `「…」`.
A standing invariant in migration 571 fails the replay if a `"` reaches
any `roi` value. One key, `assumptions.grades`, is exempt by name because
its value carries HTML attributes; if you find yourself wanting a second
exemption, the string wants rewriting rather than exempting.

**Apostrophes are fine.** They were not before 17 August 2026 — one
`l'opération` broke the entire client script. `tj()` escapes them now,
and the i18n suite renders the whole page with a hostile value to prove
it. Write French and Italian normally.

**HTML entities are fine everywhere except `help.%`.** Help text is
escaped rather than rendered, so `&mdash;` in a help row reaches the
reader as the literal six characters. Everywhere else `&mdash;`,
`&rsquo;` and `&times;` are ordinary.

**Length budgets are enforced.** Body strings are capped at 300
characters, tooltips (`help.%` and phase notes) at 320, guards at 600.
Translating German into 340 characters where English used 290 fails the
replay rather than overflowing the layout in production. If a string
genuinely cannot be said shorter, that is a conversation, not a
workaround.

**Case in the data is deliberate.** The chart's band headers —
`PROGRAMME`, `EU-WIDE`, `NO FIXED DEADLINE` — are uppercase *in the
rows*, not uppercased by CSS, because they are SVG text. A language that
should not shout, or that has no case, supplies whatever is right. Do not
assume the renderer will fix it.

**Some things are deliberately not translated**, and a translator asking
about them is asking a good question:

- **Deadline dates stay ISO** (`2027-01-01`). They are compared down a
  column and quoted into board packs, and `01/02/2027` means two
  different days on two sides of the Atlantic.
- **Numbers and money are formatted by `Intl`**, from the page language.
  Do not put thousands separators or currency symbols in a translation —
  `483.089 $` in German and `483 089 $US` in French are produced by code.
- **Currency codes** (`USD`, `GBP`, `EUR`) and **evidence grades**
  (A/B/C/D) are identifiers.
- **Organisation names** — Ardent Partners, HMRC, the ATO, APQC, OECD —
  and **legal instruments** — Council Directive (EU) 2025/516 — stay as
  they are. Translating a citation makes it unverifiable.

### Extracting the English

Do not retype it. This project shipped a JavaScript escape as six literal
characters that way, and the code and the row agreed with each other
afterwards.

```sql
SELECT key, value FROM translations
 WHERE namespace = 'roi' AND lang = 'en'
 ORDER BY key;
```

Hand that out as a two-column file. The keys are stable identifiers, not
copy — they come back unchanged.

---

## Phase 2 — the benchmark and phase tables

These are the two most often forgotten, because the big table is the one
everyone looks at, and they fall back **per column** rather than per row.
A benchmark with a translated `label` and a `NULL` hint renders an
Italian label above an English provenance line.

```sql
INSERT INTO roi_benchmark_translations (benchmark_id, lang, label, hint, citation)
  SELECT benchmark_id, 'it', '…', '…', '…' FROM roi_benchmark_translations
   WHERE lang = 'en' AND benchmark_id = ?;
```

The `citation` column is the full evidence tooltip and **may contain
inline HTML** — `<em>` around publication titles, mostly. Keep the tags.

`roi_phase_translations` is the seven implementation phases: vendor
selection, contracting, mobilisation, design, build, UAT & cutover,
process change. The `note` column is what the reader sees on hover in the
wave chart, and it carries the two facts the plan most depends on —
procurement being the critical path, and the change phase appearing only
on the wider scope. A standing invariant checks both survive.

**The glossary worth handing over with these:** *clearance / CTC* (the
tax authority is a party to the transaction), *4-corner exchange*
(structured invoices between accredited access points, authority not in
the loop), *loaded cost* (salary plus employer costs and overhead),
*AP / AR* (accounts payable / receivable), *one-off vs running*, *banked*
(a saving this scope actually realises).

---

## Phase 3 — country names

Already done for `de`, `es` and `fr`. For a new language, 71 rows:

```sql
INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'it', '…' FROM countries WHERE name_en = 'Germany';
```

Two things the planner does with these that the rest of the site does
not:

- **It sorts on the translated name**, using `Intl.Collator` rather than
  SQL, because SQLite has no locale-aware collation and puts every
  accented initial after Z.
- **It keeps the English name alongside** at tuple index 7, because
  subscriber preferences are stored in English. Do not remove it.

The `European Union` row is not in `countries` — it is a page string,
`country.eu`, in the `roi` namespace.

### And there is a SECOND copy of these names, in code

`country_translations` is what the tracker, the subscribe picker and the
planner read, through `generate_files.py`. The **deep-dive pages and the
compliance guides do not read it at all** — they call
`translateCountryName()` in `shared/deep-dive-render.mjs`, which looks up
a hardcoded `COUNTRY_NAME_TRANSLATIONS` constant:

```js
export function translateCountryName(lang, name) {
  return COUNTRY_NAME_TRANSLATIONS[lang]?.[name] || name;
}
```

Two sources for one fact, and the failure is silent in the direction you
will hit it: fill in D1 and not the constant, and the tracker is
translated while seventy guide pages and every deep dive print English
country names in an otherwise translated document. `|| name` is a good
fallback and it is also what hides the omission.

This is worth knowing rather than fixing in passing. Collapsing the two
means the deep-dive renderer taking a D1 dependency it currently does
not have, which is a larger change than adding a language and should not
be smuggled into one.

---

## Phase 4 — plurals

For most languages you do nothing. The nine nouns and three whole
sentences already have `one` and `other` forms, and `Intl.PluralRules`
picks between them.

You need extra rows only when the language has more than two categories.
Verified with `Intl.PluralRules`:

| Language | Categories |
| --- | --- |
| Italian, Portuguese, Spanish, German, Dutch | `one`, `other` |
| French | `one`, `other` — but **zero is `one`** |
| Polish, Russian, Czech | `one`, `few`, `many`, `other` |
| Welsh | `zero`, `one`, `two`, `few`, `other` |
| Arabic | `zero`, `one`, `two`, `few`, `many`, `other` |
| Chinese, Japanese, Korean | `other` only |

Extra forms are rows named after the **singular** key plus the category:

```sql
INSERT INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'word.jur',      'pl', 'jurysdykcja'),   -- one
  ('roi', 'word.jurs',     'pl', 'jurysdykcji'),   -- other
  ('roi', 'word.jur.few',  'pl', 'jurysdykcje'),   -- 2–4
  ('roi', 'word.jur.many', 'pl', 'jurysdykcji');   -- 5+
```

The nine nouns are `word.jur`, `word.wave`, `word.regime`, `word.erp`,
`word.integration`, `word.member`, `word.ctcJur`, `word.erroredInvoice`,
`word.thing`. Three sentences use whole forms instead, because their
plural changes more of the sentence than the noun:
`guard.zeroInt.{one,other}`, `guard.late.{one,other}`,
`guard.mistimed.{one,other}` — those take `.few` / `.many` in the same
way.

A language with a single category (Chinese) needs nothing: `other` is
selected for every count, and the `one` row is never read.

---

## Phase 5 — the rest of the site

The planner alone is not a translated site. The other namespaces, all
currently at four-language parity:

| Namespace | Keys |
| --- | --- |
| `edu-types-of-provider` | 103 |
| `edu-preparing-for-mandate` | 102 |
| `edu-impact-of-mandate` | 100 |
| `edu-mandate-types` | 81 |
| `tracker` | 76 + **67 `auth.*`** + **72 `guides.*`** + **34 `method.*`** + 2 menu labels = 251 |
| `edu-certified-providers` | 50 |
| `subscribe` | 50 |
| `feedback` | 20 |
| `regions` | 4 |

That is **761 rows per language** as at 22 August 2026, up from 653 when
this was written — the compliance guides and the methodology page put 108
of their strings inside `tracker`, which is why that row is now a third
of the table. Recount
rather than quoting this; the sentence above the first table in this file
applies to every number in it.

```sql
SELECT namespace, count(*) FROM translations WHERE lang = 'en'
 GROUP BY namespace ORDER BY 2 DESC;
```

Plus the per-country content tables —
`milestone_translations` (412 rows in each language),
`story_translations`, and the eight
`deep_dive_*_translations` tables — which are a much larger job and are
covered by `ADDING-A-COUNTRY.md` rather than here.

### The sign-up panel lives inside `tracker`, under `auth.*`

Added 21 August 2026 (migration 596). This is the panel that opens over
whatever page the reader is on when they press Sign in or Subscribe — 67
strings, and the route people now actually create an account through, so
it is not optional polish.

**It is not its own namespace, deliberately.** `generate_files.py` maps
the `tracker` namespace to `i18n/<lang>.json` and every other namespace
to `i18n/<lang>-<ns>.json`. A namespace called `auth` would have produced
`i18n/<lang>-auth.json`, which nothing loads. The panel reads the `auth`
block of the shared file, and dotted keys unflatten into exactly that.

**Twelve of the 67 are inherited from `subscribe`** rather than
translated twice: the five field labels, their five error messages, the
benefits eyebrow and the free badge. The panel's English was changed to
match `subscribe.html` word for word so this could work — two
vocabularies for one form is a defect this project has hit four times.
`generate_auth_i18n.mjs` refuses to run if the two sides drift, so if you
translate `subscribe` for a new language those twelve come across free:
re-run the generator rather than writing them again.

**Two strings carry `{0}` slots and both exist *because* of
translation.** `auth.code.lede` holds the address, which German puts
before the verb, so the original "prefix + address" version could only
ever have read wrongly there. `auth.err.wrongMany` holds the attempt
count, which used to sit between two fragments and had no singular at
all — English itself said "1 tries left." Dropping either brace loses the
value out of the sentence while the rest still reads perfectly; standing
invariants in 596 catch it.

**Every panel string has an English fallback in the code behind it.**
That is what makes a missing language invisible rather than broken: it
serves English inside an otherwise translated page. 596 asserts all four
languages hold all 67 keys, and `tests/auth-code.mjs` asserts the English
in the file still matches the fallback in the code character for
character.

---

## Phase 5b — what the FIRST added language breaks

Written 21 August 2026, immediately after German landed as migration 597.
None of this was predicted by this document, and all of it cost time.

**Eighteen standing invariants failed, and not one because anything was
wrong.** Every one counted ROWS — *"exactly one row carries `{0}{1}{2}`"*
— written in a world where there was only ever one row per key. A second
language doubles the count and the assertion fails while the rule it
states is still true of every row.

Twelve of the eighteen are SLOT rules, which is the sharp end of it:
those exist **for translators**, so the checks most needed the day a
language arrives are precisely the ones guaranteed to break that day.

The fix is not to narrow them to `lang = 'en'` — that would retire the
protection exactly where it is most needed. Restate each to count
VIOLATIONS and expect zero:

```sql
-- was: ... AND value LIKE '%{0}%{1}%' = 1
-- now: ... AND value NOT LIKE '%{0}%{1}%' = 0
```

Strictly stronger, and it never needs editing again. 597 carries all
eighteen; each is retired in place at its own migration with its text
kept as `was:`.

**The coverage counter and a standing invariant disagreed.**
`roi_benchmark_translations.label` is read by nothing —
`getRoiBenchmarks` selects only `hint` and `citation`, and an invariant
forbids a non-English label so nobody fills in a dead field. The coverage
counter did not know that and counted three columns for every language,
so a German row that obeyed the invariant perfectly scored 2 of 3 and the
language reported **94.3%: stranded by arithmetic at a number it could
never improve on.** Non-English now counts two columns, denominator
included. The column is `NOT NULL`, so pass `''`, not `NULL`.

**Four tests were using the untranslated language as their fixture.**
The complete-or-English checks asked about German because German was the
language nobody had translated, and a plural check compared against the
literal word `"jurisdiction"` — correct for a year only because every
language rendered the English noun. They now find an incomplete language
at runtime, and read the expected plural form off the page. *A fixture
that depends on a language staying untranslated has an expiry date
nobody wrote down.*

**And the second language cost almost none of that.** French landed the
next day as migration 598 and the replay passed first time: no invariant
broke, the coverage counter was already right, and the only test that
moved was one that had been quietly naming the untranslated language.
That is the whole argument for doing the structural language first —
whatever you translate second is data.

Two things French found that German could not:

- **`pays` is invariable.** A plural check asserted that the singular and
  plural forms could not be equal, which is an English-shaped assumption:
  French has `pays`, `prix`, `mois`, `cas`, `temps`. What is under test
  is that the CLDR selector picks the `other` form, not that the form
  reads differently.
- **The fallback test named its language for the third time.** It said
  German, then French, then German again. Any test that names the
  untranslated language expires the next time someone does good work; it
  discovers one at runtime now, and says so plainly when there are none
  left rather than passing on nothing.

**And the third language ran the discovery out.** Spanish landed as
migration 599 and there is no fourth: every language this site offers is
complete, so a fixture that *finds* an untranslated one has nothing left
to find. Discovering it at runtime was a better rule than naming it and
still had an expiry date, because it depended on the work not being
finished.

`pickUntranslatableLang()` in `tests/roi-regression.mjs` settles it. It
picks a tag that is **not in `SUPPORTED_LANGS`** — today `it` — so no
migration can ever complete it, and it asserts that `Intl.DisplayNames`
can name that tag in its own language, because naming it is what the
notice does. If Italian is ever added to the site the picker moves to the
next candidate on its own. **Two checks that expired three times between
them now cannot expire at all.** Use the same shape for anything else
that needs a language the site does not serve.

It also replaced a hand-written `ENDONYM` map. That map could only ever
confirm three strings somebody had typed out twice; the endonym now comes
from the same `Intl` call the renderer makes, so the check proves the
renderer can name a language nobody wrote a table entry for.

**One real defect, found by looking rather than by any check.** The scope
`<select>` — the control that decides whether you are modelling
compliance or compliance plus AP automation — carried `max-width:560px`.
That number was measured against the English option, which needs 458px.
German needs 646, French 695, Spanish 733. **All three translated
languages shipped a truncated sentence** in the one control that changes
both the totals and the timeline, reading *"Solo cumplimiento —
satisfacer los mandatos (lo que hacen la"*. A `<select>` does not wrap,
does not ellipsize and does not error; it just stops.

Worse, the comment directly above it described fixing this exact defect
in English, a month earlier. **A cap measured in one language is wrong in
every other one, and it fails silently.** The renderer now says
`width:max-content;max-width:100%` — the control asks its longest option
how wide it is instead of being told — and `roi-regression` measures the
widest option against the available space **in each supported language**,
so a future constant fails in three languages at once rather than in
production in none of ours.

If you add a language, that check is the one that will tell you a control
no longer says what it means. **Look for the same shape anywhere a fixed
pixel width meets translated text.**

**Length, measured rather than feared.** German came out **15% longer
overall**, French **17%** and Spanish **14%**, with the worst short
labels up 60–77%. Rendered at 1280px with
six countries selected: **zero horizontal overflow anywhere in `.wrap`,
zero page-level scroll.** Two assumption labels wrap to a second line and
the layout takes it. The length worry was real enough to justify going
first, and the layout survived it.

---

## Phase 5c — the compliance guides

Added 22 August 2026, and the reason it is its own phase rather than a
line in Phase 5 is the fallback. **The planner is all-or-nothing; the
guides are not.**

`resolveRoiLang()` refuses to serve a half-translated planner at all (see
Phase 0). The guides have no equivalent gate: `makeT()` in
`shared/guides-render.mjs` and `subtreeT()` in the site-worker both fall
back **per key**, so a `guides` namespace that is 60% done ships a
document that is 60% translated, renders cleanly, and looks finished.
Nobody sees a fault. That is the same shape as the drift bugs this
project keeps meeting, and here it is the DESIGNED behaviour — correct at
runtime, because a missing key must never take the page down, and exactly
why the finishing has to be driven from this runbook instead of from
something going visibly wrong.

### What there is

| Where | What | Size |
| --- | --- | --- |
| `translations`, `tracker`, `guides.*` | the chooser, the sign-up wall, and every heading, column and status word in the printed document | **72 keys** |
| `translations`, `tracker`, `menu.guides` | the Resources menu entry | 1 key |
| `translations`, namespace `regions` | the picker's region headings | 4 keys, already parity |
| `country_headline_fact_translations` | the qualifying line under each of the five headline facts, per country | **350 cells** |

`guides.*` lives inside `tracker`, not in a namespace of its own, for the
same reason `auth.*` does — `generate_files.py` rebuilds `tracker` into
`i18n/<lang>.json`, which is the file both guides routes read through
`authStrings()`. A new namespace would have meant a new file, a new fetch
and a new failure mode for sixty-odd strings that are site chrome like
everything else in there.

### The status words are the ones to get right

Fifteen of the 72 are the words printed in the headline cards — ACTIVE,
PLANNED, NO MANDATE, NOT CONFIRMED, REQUIRED, VARIES and the rest. They
are set at 11.5pt across a third of a page and they are what a reader
skimming eleven countries actually reads.

**Length is a correctness constraint here, not taste.** The German for
"not confirmed" was chosen as `NICHT BESTÄTIGT` over `NICHT VERIFIZIERT`
because the second wraps to three lines in the narrowest card and pushes
the strip taller on every German page — which the fitter then pays for by
trimming something else. Set the language, run the fit harness, and read
the result:

```bash
node tests/lib/guides-fit-harness.mjs
```

It prints how many of the seventy fit one page, how many had to be
scaled, and the median fill. If a language costs more than a point or two
of median fill, shorten the status words rather than letting seventy
pages shrink.

### The 350 note cells, which are English in every language today

`country_headline_fact_translations` holds five short sentences per
country — "no supplier issuing duty", "above TRY 3m turnover", "Phase 1
(100 largest) live since Aug 2026". Only `en` exists.

**These are not decoration.** They are the clause that stops a status
being misread: NO MANDATE against the United Kingdom's B2G means
something quite different once "contracting authorities must accept and
process compliant e-invoices" is under it. A German reader currently gets
German labels, German status words and English qualifiers.

They are also the one part of this job with no test behind it. Nothing
counts them, nothing fails, and the guide renders perfectly without them.
Query the gap directly:

```sql
SELECT lang, count(*) FROM country_headline_fact_translations GROUP BY lang;
```

Seventy rows per language is complete. Anything less is a partial
translation that will not announce itself.

### Country names come from CODE here, not from D1

A trap worth one line before it costs an afternoon. The tracker's country
names come from `country_translations` through `generate_files.py`. The
**deep dives and the compliance guides do not** — they call
`translateCountryName()` in `shared/deep-dive-render.mjs`, which reads a
hardcoded `COUNTRY_NAME_TRANSLATIONS` constant. Adding a language to D1
and not to that constant gives you a chooser and seventy guide pages
with English country names in an otherwise translated document, and no
error anywhere. See Phase 3.

### The methodology page is in the same namespace, and says the same words

`/methodology` (34 keys under `method.*`, added 22 August) explains the
five status words to readers. It **reads them from the `guides` subtree
rather than restating them**, so a language that translates
`hl.active` changes the tiles and the page that defines them together.
Translating one and not the other is not possible, which is deliberate:
a page explaining ACTIVE while the tile prints AKTIV would be worse than
no page. `tests/methodology.mjs` asserts every status word the tiles use
appears on the page.

Its two figures — how many facts are unconfirmed, how many jurisdictions
are covered — are queried at request time and need no translation.

**One sentence on that page must survive translation intact**: the
section saying we do not publish a per-claim source grade. It is true
because `source_tier` is not a column. If that ever changes, the page
changes with it; until then, softening it in any language makes a promise
the database cannot keep.

### Verify

```bash
node tests/guides-routes.mjs          # asserts the guides strings exist per language
node tests/methodology.mjs            # and the methodology page's, in all four
node tests/lib/guides-fit-harness.mjs # the one-page rule survives the new language
```

`guides-routes.mjs` checks a named subset of keys in all four
`i18n/*.json` files. It is a smoke test, not a coverage report — it will
not tell you the namespace is complete, only that it is not empty. The
standing invariant in migration 609 is the one that refuses an
English-only key in D1, and it is worth reading before you write the
migration:

```
-- ASSERT ALWAYS: ... GROUP BY key HAVING count(DISTINCT lang) != 4 = 0
```

**That number is four.** A fifth language makes it wrong, and it is
deliberately a standing invariant so it fails loudly rather than
silently admitting a partial row. Update it in the same migration that
adds the language.

---

## Phase 6 — verify

```bash
node tests/roi-coverage.mjs             # per-language, all three ROI tables
node tests/auth-code.mjs                # the sign-up panel's 67 strings
node tests/guides-routes.mjs            # the guides strings exist in all four files
node tests/lib/guides-fit-harness.mjs   # the one-page rule survives the new language
npm test                                # every suite
```

The fit harness is not in `npm test` and is the one to run by hand. A
language with longer status words does not fail anything — it makes
seventy pages print a little smaller, which no assertion notices and a
reader does. It prints the median fill; compare it against English.

**The suite count is not written down here on purpose.** It was "10
suites" in this file while the repository had fifteen, which is the same
class of defect as a hardcoded country count: a number with no
connection to the thing it counts. `npm test` prints the real one.

The coverage report is the one to run first and last. It fails on a
language stranded past 20% and under 100%, on a stale in-progress
exemption, and on the three ROI tables disagreeing about which languages
exist — that last one is the check for "strings done, benchmarks
forgotten".

While the work is in progress, add the code to `IN_PROGRESS` in
`tests/roi-coverage.mjs` so the suite stays green, and **take it out when
you finish** — the check fails on an exemption that has outlived its
work, which is the stale-allowlist problem this repo has met before.

Then render it and look at it. Nothing here replaces that:

```js
import { buildRoiPage } from "./tests/lib/build-page.mjs";
const { file } = await buildRoiPage({ lang: "it" });
```

**If that renders in English, your language is not complete** — that is
the `resolveRoiLang` gate, working. Run `roi-coverage.mjs` to see which
keys are missing. To look at a partial translation deliberately, pass
`{ lang: "it", resolveLang: false }`, which bypasses the gate; the
regression suite uses exactly that to test collation, locale money and
plural categories against `de` and `fr` without either being complete.

Do not leave the bypass in anything that decides whether the work is
done. A check that renders a language the worker would refuse to serve is
a check of a page nobody loads.

The last three defects found in this area — a hardcoded `"6mo"`, an
inverted EU explanation, and a default country selection that ticked the
wrong eight countries — were all found by a person reading a rendered
page, not by any check.

---

## Latin-script European languages

**Italian, Portuguese, Spanish, Dutch, and the Nordics are data only.**
No code change beyond Phase 0. Budget roughly a day of translation for
the planner's 521 cells if the translator knows the domain, plus review.

The one thing to watch is **length**. German runs 20–35% longer than
English and Polish similar; the page is already close to its limits in
English, and `shared/roi-render.mjs` records two separate occasions when
a label overflowed at 860px. Specific pressure points:

- `.steps span{white-space:nowrap}` — six step chips forced onto one row
- the wave chart's **fixed 190px left gutter** (`const L = 190`), which
  holds the jurisdiction name *and* a right-anchored region and
  complexity label
- `shortName()` truncates row labels at **22 characters**
- 43 `letter-spacing` declarations and 34 `text-transform:uppercase`
  rules, which multiply the width penalty on uppercase compounds
- the PDF's A4 portrait page, which has overflowed to 307mm once already

None of these break the build. They produce a slightly worse-looking
page, which is why they need a person to look.

---

## Complex languages

This section is honest about what has **not** been tested. Everything
above has been exercised in German and French; none of what follows has
been run.

### Polish, Russian, Czech — plural categories

The only genuinely solved one. Add `.few` and `.many` rows as in Phase 4
and the selector handles the rest, including the fact that Polish decides
on the last two digits rather than on whether the number is one. Nothing
in the codebase encodes that rule; CLDR does.

Watch the length budgets: Polish is long and the 300-character body cap
is not generous.

### Arabic, Hebrew, Farsi — right-to-left

**Not supported, and it is not a translation job.** Concretely:

- **No `dir` attribute exists anywhere.** `<html lang="…">` is set on
  every shell; `dir` is set on none. Adding `dir="rtl"` is the first
  line, and it is the easy part.
- **The wave chart is drawn in absolute LTR coordinates.** `buildGantt()`
  computes `x` positions from a fixed 190px left gutter with the meta
  label at `x = L - 10` and `text-anchor="end"`, and time runs left to
  right across a 1000px canvas. SVG does not mirror under `dir`. A
  correct RTL chart means mirroring the time axis and the gutter — a real
  piece of work, not a CSS property.
- **The PDF inherits all of it**, on a fixed A4 layout.
- **The vendored fonts are Latin-only.** `vendor/fonts/` holds ten
  `*-latin-*.woff2` files, and the production `<link>` requests the same
  subsets. Arabic text would render in whatever the browser substitutes —
  in the test harness *and* in production. Both would need Arabic
  subsets, and Big Shoulders Display has no Arabic at all, so the display
  face needs a substitute chosen deliberately rather than by fallback.
- **Six plural categories**, including `zero` and `two`, so every noun
  needs four extra rows.
- **Digit shaping.** `Intl.NumberFormat('ar')` may emit Eastern Arabic
  numerals depending on the locale tag. That is correct for the reader
  and worth deciding explicitly, because a board pack mixing `٤٨٣٬٠٨٩`
  and an ISO date is a choice, not an accident.

Estimate: days, not hours, and mostly in the chart.

### Chinese, Japanese, Korean

Easier than Arabic and not trivial.

- **Plurals are free** — one category, so `plur()` always returns
  `other` and no extra rows are needed.
- **Fonts are the blocker**, same as Arabic: the vendored subsets are
  Latin, and no IBM Plex Latin subset covers CJK. Both the harness and
  production need CJK faces, and they are large — the current
  `vendor/fonts/` is 196KB total, where a CJK subset is measured in
  megabytes. This is the one case where vendoring the font may be the
  wrong answer and a network load the right one.
- **No spaces means no wrapping points.** `shortName()`'s 22-character
  truncation counts UTF-16 code units, so it cuts CJK at roughly the
  right *count* and roughly **twice** the right *width*, since CJK glyphs
  are full-width. The 190px gutter holds far fewer characters than it
  does in English.
- **`letter-spacing` is wrong for CJK**, and there are 43 declarations.
  Latin tracking applied to Han characters looks broken rather than
  spaced.
- **`text-transform:uppercase` is a no-op**, which is harmless, but the
  34 rules that use it were designed around uppercase Latin as a visual
  device. The typographic hierarchy they create simply will not exist.

### Turkish — one specific trap

`cx[0].toUpperCase()` at `shared/roi-render.mjs:2371` uppercases a
*translated* complexity name in the chart. In Turkish, `i` uppercases to
`İ`, not `I`, and `String.prototype.toUpperCase()` without a locale
argument gets it wrong. Either use `toLocaleUpperCase(LANG)` or, better,
store the uppercase form in the row as the band headers already do.

---

## A migration skeleton

Number it after the current highest file. Keep the reasoning in the
comments — that is where this project keeps its engineering diary.

```sql
-- ================================================================
-- Italian.
--
-- 417 roi strings, 30 benchmark rows, 7 phase rows, 71 country names.
-- Translated by <who>, <date>. Domain glossary agreed first; the
-- evidence rows were reviewed separately because a mistranslated
-- citation is worse than an untranslated one.
-- ================================================================

INSERT INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'page.title', 'it', '…'),
  …;

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'it' = 417
--
-- The three ROI tables must agree about which languages exist, or a
-- reader gets Italian labels above English provenance lines.
--
-- ASSERT: SELECT count(*) FROM roi_benchmark_translations WHERE lang = 'it' = 30
-- ASSERT: SELECT count(*) FROM roi_phase_translations WHERE lang = 'it' = 7
-- ASSERT: SELECT count(*) FROM country_translations WHERE lang = 'it' = 71
```

Then, on your machine:

```bash
python3 members-worker/migrations/apply_migrations.py --remote --dry-run
python3 members-worker/migrations/apply_migrations.py --remote
```

---

## Summary

| Language kind | Code change | Extra plural rows | Realistic effort |
| --- | --- | --- | --- |
| Italian, Portuguese, Dutch, Spanish | `SUPPORTED_LANGS` only | none | data only |
| German, Polish (length pressure) | `SUPPORTED_LANGS` only | Polish: `.few`, `.many` | data, plus a layout read |
| *any of the above, planner alone* | **none** | as above | data only — see Phase 0 |
| Turkish | `toLocaleUpperCase` fix | none | data, plus one line |
| Chinese, Japanese, Korean | fonts, tracking, truncation | none | days |
| Arabic, Hebrew, Farsi | RTL throughout, chart mirroring, fonts | four per noun | days, mostly the chart |

Whatever the language, the work splits three ways:

| Part | Size | Guarded by |
| --- | --- | --- |
| The planner | 537 cells | `roi-coverage.mjs`, and a gate that refuses a partial language |
| The rest of the site chrome | 761 rows, 108 of them the guides and methodology | `tracker-i18n.mjs` parity, `guides-routes.mjs` and `methodology.mjs` |
| The headline-fact notes | **350 cells** | **nothing** — see Phase 5c |

The third column is the one to read. The last row is the largest single
job and the only one where finishing is a decision rather than a green
test, which is why it is still English in `de`, `es` and `fr` today.
