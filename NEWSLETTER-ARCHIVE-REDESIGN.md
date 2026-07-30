# Newsletter Archive Redesign — From Monthly Blobs to Per-Story Records

This document designs a shift from the current "one big blob per month"
archive structure to individual, country-tagged stories that publish
continuously and can be filtered by country in the archive UI. It's a
design document only — nothing here has been built yet.

---

## Why this matters

The newsletter archive is the paid core of the site. Right now it can't
do the one thing a paying subscriber most obviously wants: skip straight
to just the countries they care about. A subscriber interested only in
Poland and Brazil currently has to read whole months of mixed content to
find the parts relevant to them, because each month is authored and
stored as a single HTML blob covering every country that came up.

---

## The core shift

**Today:** `ISSUES` KV, keyed by `YYYY-MM`, one record per month:
```json
{ "title": "...", "date": "2026-01-01", "summary": "...", "countries": ["Belgium", "Malaysia", ...], "html": "<everything for January, all countries mixed together>" }
```

**Proposed:** `STORIES` KV, keyed by a unique per-story ID, one record per
individual news item:
```json
{
  "id": "2026-08-15-poland-ksef-update",
  "title": "KSeF submission deadline moves for small taxpayers",
  "countries": ["Poland"],
  "date": "2026-08-15",
  "month": "2026-08",
  "summary": "One or two sentences — same role as today's issue summary.",
  "html": "<full story content, this one item only>",
  "sourceUrl": "https://ksef.mf.gov.pl/..."
}
```

Note `countries` stays an array, not a single string — most stories will
name exactly one country, but some (a Peppol network-wide update, an EU
ViDA development) genuinely span several, and the schema shouldn't force
those into an artificial single-country box.

A `published: true` field is worth including from the start too — a
lightweight way to prepare a story ahead of time without it appearing in
the public archive yet, without needing a separate draft/staging system
built later.

### Key naming: date-prefixed, deliberately

Using `YYYY-MM-DD-country-topic-slug` as the key format means Cloudflare
KV's `list()` — which returns keys in lexicographic order — naturally
returns stories in chronological order for free, no separate sorting or
index needed for that particular ordering. Worth keeping this convention
consistent for exactly that reason.

---

## Archive UI changes

**List view** — shifts from one card per month to one card per story:
title, country tag(s), date, summary snippet. This is a bigger list over
time than the current ~monthly cards, but far more directly useful.

**Country filter — checkboxes, not single-toggle pills.** The current
archive already has country filter pills, but they toggle one active
filter at a time. The actual ask here is genuine multi-select: check
Poland and Brazil together, see the union of stories matching either.
This is the same interaction pattern already used successfully on the
subscribe page's own country picker — worth reusing that visual style
for consistency.

**Individual story pages** — `/members/archive/<story-id>` replaces
`/members/archive/<month>`. Each page shows one story, full content,
country tag(s), date, and source link.

**Search** — the existing live-search-by-title/summary logic carries over
unchanged, just operating on the larger, finer-grained story list instead
of the smaller month list.

### Reuse the existing country-name translation dictionary — don't add a fourth copy

`ADDING-A-COUNTRY.md` already flagged that country-name translations are
duplicated in three separate places (tracker chrome, subscribe page,
members-worker's `COUNTRY_NAME_TRANSLATIONS`). The archive's new
checkbox filter needs the same translated names — it should read from the
members-worker's existing dictionary, not introduce a fourth copy of the
same data.

---

## Continuous publishing — what this actually changes operationally

Per your direction: stories go live in the archive the moment they're
written and published, not held until a monthly release. Practically,
today's authoring workflow (write the story, `wrangler kv key put` it)
barely changes — a story simply appears in the archive as soon as that
command runs, since there's no monthly gate anymore. The `published`
field mentioned above gives an escape hatch if you ever want to prepare
something slightly ahead of when it should actually go live.

This also fits the content-monitoring watcher design (`CONTENT-MONITORING.md`)
better than the old monthly-blob model did — a single detected government
change naturally becomes one new story about one country, publishable
immediately once reviewed, rather than sitting in a queue until a monthly
compile.

---

## Email changes

### Monthly digest — becomes a query, not a pre-written document

Instead of reading one pre-written blob for the month, the monthly cron
job queries "all stories where `month == X`" and renders each into one
combined email — a list of that month's stories, not a single authored
document. The rendering work is similar to today; what changes is the
*source* being several small records instead of one large one.

### Country-tailored notification — a genuine upgrade, not just a rebuild

Today's per-country notification can only say "yes, your countries came
up this month" or "no, but here's the full digest" — a vague signal,
because it's working with whole-month blobs with no way to point at
anything more specific. With per-story data, this becomes concrete: **the
email can name the actual matching story headlines and link straight to
each one.** For a subscriber who selected Poland and Brazil, the email
becomes "2 stories matched your countries this month: [Poland headline],
[Brazil headline]" with direct links — a meaningfully better product for
essentially the same underlying send logic, once the data is
restructured to support it.

---

## Migration of existing content

The 7 existing issues (Jan–Jul 2026) are authored as mixed-country blobs
and don't fit the new per-story shape as-is. To bring the archive fully
in line with the new model, each existing issue would need splitting into
its individual country sections as separate story records (e.g.
January's single blob covering six countries becomes six separate story
records, each dated 2026-01-01, each `month: "2026-01"`). This is
mechanical rather than difficult — the content already exists and is
already organised by country section within each issue — but it's real
work, not automatic, and was deliberately scoped as a separate step from
this design.

---

## What this design deliberately doesn't decide yet

- Whether `/members/archive/<month>` (old URLs, if any were ever sent to
  a real subscriber) need a redirect/legacy route, or whether it's
  acceptable for them to simply stop resolving, given the site hasn't
  had real subscribers relying on archive links until very recently.
- Whether the archive ever needs a maintained index/manifest record
  instead of a live `list()` call — not a concern at the realistic scale
  of this project for a long time (KV `list()` handles up to 1,000 keys
  per call without pagination), but worth revisiting if the story count
  ever grows into the hundreds-plus range.

---

## Language translation — a genuinely different cost under this model

Worth confronting directly: **every piece of actual newsletter content has
stayed English-only throughout this project, on purpose**, even though
every surrounding page — chrome, buttons, labels, the archive's own UI —
is translated into ES/DE/FR. The sample-issue modal on the subscribe page
even states outright that it stays English regardless of site language,
specifically because translating it would break the "exactly as
published" claim. So this isn't an oversight to quietly fix; it's an
existing, deliberate line that this redesign should either reinforce or
knowingly cross.

### Why continuous publishing changes the calculus

The static pages (tracker, education content, subscribe, feedback) were
each translated **once** — a fixed, one-time cost. Stories under this new
model publish **continuously and indefinitely**. If every story needs
translating into three more languages, that's not a one-time investment
like the rest of the site — it's a **permanent addition to the cost of
publishing every single future story**, forever. That's a materially
different kind of commitment than anything else translated so far, and
worth deciding deliberately rather than defaulting into.

### Recommendation: design the schema to support it now, decide the actual commitment separately

Two things can be true at once: the `STORIES` schema should be built so
translation is possible without a painful retrofit later, while the
actual decision to translate every story (or none, or some) stays a
separate, revisitable choice — not something forced by today's design.

**Schema approach — stay consistent with how the rest of the site
already does this.** Every other translated thing on this site (the
tracker's DATA array, country names, education pages) uses **separate
per-language files/records keyed by matching IDs** — `es-data.json`,
`de-data.json`, etc. Stories should follow the same convention rather
than inventing a new one: either separate KV namespaces
(`STORIES`, `STORIES_ES`, `STORIES_DE`, `STORIES_FR`) or a language
prefix on the key within one namespace. Either keeps translated content
as its own record, mirroring the established pattern, rather than nesting
`{en: "...", es: "..."}` objects inline — which nothing else on this site
does, and would be its own small inconsistency to maintain.

**A sensible phased default:** stories are authored in English by
default, exactly as today. Translation becomes a per-story decision —
maybe every story eventually gets translated once there's real subscriber
demand data showing which languages are actually being read, maybe only
particularly significant stories are worth the effort, maybe none are for
now. The schema doesn't need to force an answer today.

### Two related pieces this touches

**Subscriber-level language preference.** If stories do get translated,
the country-tailored notification email should ideally render in a
subscriber's own language — which means the `SUBSCRIBERS` record needs a
`lang` field, currently absent entirely (it only tracks country
preferences today). The natural, low-friction source for this: whatever
UI language a person had selected on the subscribe page at signup, rather
than asking a new, separate question nobody wants to answer.

**A per-story language switcher on the archive itself**, if translations
exist for a given story — reusing the exact `?lang=` query param + cookie
mechanism already used consistently everywhere else on the site, rather
than building a second, different switching mechanism just for this page.

---

## Rough build scope, when ready to build this

- New `STORIES` KV namespace (or repurpose `ISSUES` with the new schema —
  either works; a fresh namespace avoids any ambiguity with old-shape
  records sitting alongside new ones).
- Archive list/search/filter logic reworked to operate on stories instead
  of issues — a genuine rewrite of that page's rendering and filtering
  code, though the overall visual pattern (search box, filter checkboxes,
  card grid) carries over.
- New individual story page route, replacing the current month-page route.
- Monthly cron job's aggregation logic rewritten to query by month across
  stories rather than read one issue record.
- Country-tailored notification email logic upgraded to list specific
  matching stories.
- Migration pass splitting the 7 existing issues into per-story records.
- If translation is pursued: per-language `STORIES` records/namespaces
  following the site's existing translation-file convention, a `lang`
  field added to `SUBSCRIBERS`, and a per-story language switcher reusing
  the existing `?lang=` mechanism.
