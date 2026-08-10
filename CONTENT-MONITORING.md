# Ongoing Content Monitoring & Maintenance

This document covers how to keep the site's compliance content accurate
over time — specifically, how to detect when a government changes its
e-invoicing rules, and how that detection should (and shouldn't) flow into
updates to the tracker, deep dives, and newsletter.

**Read the framing section first.** The temptation with a task like this is
to build something that fully automates content updates. That would be a
mistake here, and the reasoning below explains why, before getting into
the actual design.

---

## Framing: this is a detection tool, not a publishing tool

This site's entire value proposition rests on accuracy. Every DATA entry,
every deep dive, every newsletter issue links to a primary government
source specifically so a reader can verify it themselves rather than take
the site's word for it. That standard doesn't change just because a step
gets automated.

A system that **automatically publishes** changes to the tracker or a deep
dive — without a human genuinely reading and confirming what changed —
introduces a real risk: a government page's cosmetic redesign, a broken
link, or a change to an unrelated part of the page could get
misinterpreted as a substantive regulatory change and published as fact.
Given people may make real compliance decisions based on this site, that's
not an acceptable failure mode.

So the system below is deliberately split into two halves with a hard line
between them:

1. **Detection & alerting** (safe to automate) — "this specific government
   page changed since we last checked, here's what's different."
2. **Interpretation & publishing** (stays human + AI collaborative, same as
   today) — deciding whether a detected change is substantive, what it
   means, and how to phrase it accurately across DATA, the deep dive, and
   the newsletter.

Nothing in part 1 should ever write directly to `DATA`, a deep-dive page,
or a newsletter issue. It only ever produces a list of "go look at this."

---

## Two different kinds of monitoring — and why they need different approaches

**A. "Did a page we already track change?"** — narrow, mechanical, and
genuinely automatable. We already have ~40 verified official URLs across
the 29 countries in `DATA` and the deep dives. Fetching each one
periodically and diffing it against last time is a well-understood,
low-risk automation problem.

**B. "Is there a new mandate or country we don't know about at all yet?"**
— open-ended discovery. This is a fundamentally different, harder problem:
there's no fixed URL list to check, because the whole point is finding
things not already on our radar. This is much better suited to a periodic
research pass done together in a session (using web search, the way we
already do when adding a country) than to full automation — open-ended
"did anything happen anywhere" monitoring is exactly the kind of task
where false confidence in an automated system is most dangerous.

**Recommendation:** build A now, since it's tractable and genuinely useful.
Treat B as a periodic manual/collaborative exercise — e.g., "let's do a
sweep for new countries" every quarter — rather than trying to automate it.

---

## Architecture for A: the "known-page watcher"

This fits the same pattern as the members-worker's monthly notification
job — a small Cloudflare Worker with a Cron Trigger, using KV for storage.
Could live in its own Worker, or as an additional route + scheduled handler
in the existing members-worker, whichever is simpler to manage.

### What it monitors
A maintained list of `{ country, url, lastSnapshotHash }` — starting from
the ~40 official URLs already embedded in `DATA` and the deep dives, pulled
out into their own list rather than left scattered across entries.

### How it checks for change
1. Fetch each URL on a schedule (see cadence below).
2. Strip the page down to its actual text content — not raw HTML — before
   comparing. Government pages change cosmetically (styling, cookie
   banners, session tokens in URLs, unrelated announcements elsewhere on
   the page) far more often than they change substantively. Comparing raw
   HTML byte-for-byte would generate constant false alarms; comparing
   extracted text content is much closer to "did the actual information
   change."
3. Hash the cleaned text and compare to the stored hash from last check.
4. If different: store the new hash, and add the page to a "changed since
   last check" list in KV, along with a snippet of what's different if
   feasible (even a crude before/after text diff is useful context for the
   human review step).

### How you find out
Simplest option, reusing infrastructure that already exists: a weekly
digest email via Resend (the same service already wired up for magic
links and notifications) listing every page that changed, with a link to
each. No new email infrastructure needed.

**This is strictly an internal/operator email — sent only to you (or
whatever admin address you designate), never to subscribers.** It's raw,
unreviewed "these pages changed, go look" material. Subscribers should
only ever receive content that's been through the actual review-and-write
process (the monthly digest, the country-tailored notification) — sending
unverified raw change-detection noise to a paying subscriber would
undermine the entire premise of the site, which is that people are paying
specifically so they don't have to monitor raw government pages
themselves.

### Cadence
**Weekly, not daily.** Based on what we've actually seen across 29
countries over the life of this project, meaningful regulatory changes
happen on the order of once a month per country at most, often far less.
Daily checking 40 pages would mean ~280 fetches a week for essentially
no gain in responsiveness, and raises the false-positive noise floor for
no real benefit. Weekly is frequent enough to stay ahead of any deadline
that matters, and cheap enough that it's a non-issue on Cloudflare's free
tier.

### Practical/legal considerations
- **Respect `robots.txt`** for each site before adding it to the watch
  list — most government portals allow reasonable automated access to
  public pages, but check per-site rather than assuming.
- **Rate limit yourself** — space requests out (e.g., a few seconds apart)
  rather than firing 40 requests simultaneously; considerate of the
  government's own infrastructure, and less likely to trip any
  bot-detection that would block future checks.
- **Expect some sites to block automated fetches outright.** Build in a
  "couldn't fetch — check manually" flag rather than treating a failed
  fetch as "no change," which would silently create a blind spot.

---

## The actual update workflow once a change is flagged

This is where it stays exactly as collaborative as it is today:

1. Weekly digest arrives, listing which official pages changed.
2. In a working session, go through the flagged pages together — same as
   reviewing any other update. Read what actually changed, decide whether
   it's substantive.
3. If it is: update the milestone data (D1's `milestones` /
   `milestone_translations` — the tracker board and deep-dive timeline
   both read these live, see ADDING-A-COUNTRY.md's Stage 5 note), update
   the relevant deep-dive page (and its translations, if that page has
   been translated), and consider whether it's newsletter-worthy for the
   next monthly issue — following the exact same source-linking
   discipline already used throughout this site (link to the actual
   government page, not just a paraphrase).
   - **Re-check `mandate_scope` on every milestone you touch or add**
     (migration 254; see `ADDING-A-COUNTRY.md`'s Phase 1 step 2 and
     `255_mandate_scope_backfill.sql`'s header for the `'b2b'` /
     `'b2g_only'` / `'none'` definitions and worked precedent). This is
     the field The Map's live status computation reads — a mandate
     that just moved from "expected" to firm, a country that gained
     its first real B2B milestone, or a brand-new milestone left at
     the column's `'b2b'` schema default when it should be
     `'b2g_only'` or `'none'` will each silently mis-color that
     country on `/map` until someone happens to notice. There's no
     separate reminder for this the way the jurisdiction count (Phase
     3) has one — it rides along with the milestone edit itself, so
     it's easy to skip precisely because the milestone edit "already
     felt complete" without it.
4. If it's a false positive (cosmetic change, unrelated content): no
   action needed, the watcher just did its job by ruling it out.

Nothing here changes how content actually gets written — it just means
you stop having to manually recheck ~40 pages yourself to find out where
to look.

---

## What this deliberately does not do

- Does not use an LLM to auto-interpret whether a page change is
  significant and auto-publish based on that judgment. A human reads the
  actual change before anything gets published.
- Does not attempt to discover entirely new countries/mandates
  automatically (see Part B above) — that stays a periodic collaborative
  research task.
- Does not touch `DATA`, a deep-dive page, or a newsletter issue directly.
  Its only output is a list of things to go look at.
- Does not send anything to subscribers, ever. The weekly digest is an
  internal operator email only.

---

## Rough build scope, if/when you want this built

- One new Worker (or an addition to members-worker): a `scheduled()`
  handler, a KV namespace for snapshot hashes, and a fetch+hash+compare
  loop over the watch list.
- A one-time task to extract the ~40 official URLs currently embedded in
  `DATA`/deep-dives into their own maintained watch list.
- Reuse of the existing Resend integration for the weekly digest email —
  no new email infrastructure.
- Comparable in size to the monthly notification job already built —
  not a large addition to the existing stack.


---

## Status: built (2 August 2026)

Implemented in `members-worker/src/index.js`, as an addition to the
existing Worker rather than a separate one (per the "whichever is
simpler" note above) — reuses its D1 binding, its `sendViaResend`
helper, and its Cron Trigger config with a second schedule string.

**What shipped, matching this design exactly:**
- Watch list: `tracking_sources WHERE active = 1` (migration 214) —
  the same table backing the public `/sources` page. This is a better
  foundation than the original "~40 URLs embedded in DATA" plan this
  doc described, since it didn't exist yet when this doc was written;
  one registry now serves both the public sources page and monitoring,
  and setting `active = 0` pulls a source out of both at once.
- Weekly cron, Monday 08:00 UTC (`0 8 * * 1`), dispatched from the same
  `scheduled()` handler as the existing monthly notification job —
  `event.cron` tells the two apart.
- Fetch → strip HTML to comparable text (scripts/styles/comments
  removed, tags stripped, whitespace collapsed) → SHA-256 hash →
  compare to the stored hash in a **dedicated** `CONTENT_MONITOR` KV
  namespace (deliberately separate from `SUBSCRIBERS` — monitoring
  hashes and subscriber PII shouldn't share a keyspace).
- A source's first-ever check establishes the baseline silently
  (doesn't fire as "changed" — that would make the very first digest
  meaningless noise).
- A failed fetch is reported as `failed`, distinct from `unchanged` —
  never silently treated as "no change happened," per this doc's
  explicit requirement.
- A crude prefix/suffix diff snippet (not a real diff algorithm — just
  enough context to help a human decide whether to look closer).
- Single weekly digest email via the existing Resend integration, to
  `CONTENT_MONITOR_EMAIL` (a `wrangler.toml` var) — internal only,
  never to subscribers, exactly as specified. Always sends something,
  even a quiet week, so the digest itself is a heartbeat that the
  system is alive.
- Manual trigger: `POST /admin/run-content-monitor` with the same
  `X-Admin-Secret` header pattern as the existing notification job's
  manual trigger — for testing without waiting for Monday.
- Respecting `robots.txt` and rate-limiting: per this doc's original
  framing, `robots.txt` suitability is a **one-time check made before
  setting a source `active = 1`**, not a runtime check on every fetch
  (parsing robots.txt correctly at runtime is its own can of worms, and
  the meaningful decision — "is this site OK to poll automatically" —
  is a one-time editorial judgment, not a per-request one). The Worker
  identifies itself with an honest, identifiable User-Agent
  (`EICC-ContentMonitor/1.0 (+.../about; weekly check for compliance
  updates)`) so any site operator can recognize and block it if they
  choose. Fetches are spaced 3 seconds apart within a run.
- Tested: pure functions (text extraction, hashing determinism, diff
  isolation), `checkOneSource`'s full state machine (baseline →
  unchanged → changed → failed, verified across real state transitions
  with mocked KV/fetch), the digest HTML's content in both a quiet week
  and an eventful one, the `scheduled()` dispatcher choosing the right
  job by cron string, and the time-budget/cursor mechanics below.

**A real bug found the hard way, then fixed (3 August 2026):** the
first live manual-trigger test silently failed — the digest email
never arrived. `wrangler tail` showed why: *"waitUntil() tasks did not
complete within the allowed time after invocation end and have been
cancelled."* Cloudflare only grants `ctx.waitUntil()` a short grace
period once an HTTP response has already been sent — nowhere near
enough for a sequential loop over 50+ sources with considerate spacing
between fetches, which takes several minutes. The run was getting
silently killed partway through, every time, with no error surfaced
anywhere a human would see it.

**The fix is a self-imposed time budget, not a tuned delay.** Rather
than guess at exactly where Cloudflare's undocumented ceiling sits (and
risk hitting it again under different conditions — slower government
sites, more sources added later, etc.), the run now polices its own
clock: it stops itself well before any plausible limit (a conservative
20-second budget), persists a cursor (the next source's id) in KV, and
resumes from exactly that point on the *next* run — cron or manual —
rather than always restarting from the top. A source that gets deferred
this week is simply the first one checked next week; every source still
gets covered, just not necessarily inside a single run if the full list
doesn't fit the budget. The digest is explicit about this whenever it
happens ("N source(s) not reached this run — will be checked first next
run") — never a silent partial check masquerading as a complete one.
Fetch spacing was also reduced from 3s to 750ms per source, since 3s
was needlessly conservative and made the time-budget math far tighter
than necessary.

**What deliberately did NOT change from this design:** still detection
only. Nothing here writes to `milestones`, `deep_dive_*`, or `stories`.
The weekly digest is exactly what part 1 of this doc describes — "go
look at this" — and the actual update workflow (part 2 of this doc)
stays 100% human-reviewed, same as every other content change on this
site to date. Part B (open-ended discovery of new countries/mandates
not yet on the radar) remains explicitly out of scope, per this doc's
original recommendation — that stays a periodic collaborative research
session, exactly like how Egypt and the Netherlands were found and
added this session.

**One-time setup needed before this runs for real:**
```
cd members-worker
wrangler kv namespace create CONTENT_MONITOR
```
Paste the printed `id` into `wrangler.toml`'s `CONTENT_MONITOR` KV
binding (currently a placeholder), then `wrangler deploy`. The first
Monday run (or a manual trigger via `/admin/run-content-monitor`) will
baseline every active tracking source; the digest will start reporting
real changes from the second run onward.


---

## A second real bug, caught by the first genuinely completing run (3 August 2026)

The very first live run that actually finished within its time budget
immediately surfaced a real false positive: Belgium and Croatia's EC
factsheet pages were flagged as "changed" when nothing regulatory had
changed at all. The diff showed why — Confluence (the platform behind
`ec.europa.eu`'s eInvoicing factsheets) embeds a per-request tracing
blob at the very end of every page's rendered text:
`{"serverDuration": N, "requestCorrelationId": "hex"}`. Both values are
different on literally every single page load, regardless of whether
the actual content changed — exactly the class of "cosmetic churn"
this tool's design was supposed to filter out, and would have cried
wolf on all 17 EC-factsheet-sourced pages every week, forever, if left
unfixed.

**This is the design working, not failing** — this is precisely why
detection stays separate from publishing: a human read the actual diff
before anything was taken as fact, immediately recognized it as noise,
and nothing false ever reached the tracker or a subscriber.

**Fixed**: `extractComparableText` now strips this specific
Confluence-tracing pattern before hashing, with a regression test
locking in the exact real text observed. Applied generically (not
special-cased to one domain), since the same class of problem —
request IDs, timing metadata, or cache-busting tokens rendered as
visible text rather than living safely inside a stripped `<script>`
tag — is a plausible recurrence on other platforms.

**One-time operational note**: because the extraction method itself
changed, every source's *already-stored* hash (computed under the old,
noisier extraction) will no longer match a freshly-computed hash even
where the actual page content is unchanged — guaranteed one-time false
positives across every previously-baselined source on the next run.
Since this is still the very first (partial) baseline pass, the clean
fix is to wipe the `CONTENT_MONITOR` KV namespace once and let every
source re-baseline fresh under the corrected extraction, rather than
manually reasoning about which of the first 10 baselined sources are
now stale:
```
wrangler kv key list --namespace-id=<CONTENT_MONITOR namespace id>
# then delete each hash:<id> key, or simply delete and recreate the
# namespace if it's easier: wrangler kv namespace delete --namespace-id=...
# followed by wrangler kv namespace create CONTENT_MONITOR and updating
# the id in wrangler.toml again.
```

Also observed in that first run: **Brazil's tracking source
(`nfe.fazenda.gov.br`) fails with "Too many redirects"** — an ASP.NET
cookie-support-detection redirect loop that a simple one-shot `fetch()`
genuinely cannot resolve (it needs a cookie jar carried across
redirects, which is a meaningfully bigger feature than this tool's
scope). This is correctly reported as `failed`, not silently swallowed
— but it will fail the same way every week indefinitely unless a
better source URL is found for Brazil (a page on the same domain that
doesn't trigger the cookie-detection dance), which is a source-curation
task for a human, not a code fix — see `tracking_sources` for Brazil.


---

## Rebranded to match the site's own email language (3 August 2026)

The digest started as plain unstyled paragraphs — functional but
unappealing, and not recognizably "the site" the way every other
transactional email already is. Rebuilt around `buildEmailShell`, the
branded wrapper already used by the magic-link and monthly-notification
emails (dark-ink header band with the site's wordmark, cream card body,
dashed-line footer) — reusing an established pattern rather than
inventing a fourth visual language. Georgia serif for headings, Courier
New for labels/URLs/error text, the same amber/stamp-red/ink-brown
palette used throughout the site's other transactional email and the
`/sources` page.

Content changes: a stat strip up top (Checked / Changed / Failed /
Deferred as big numbers) replaces the old opening sentence; each
changed/failed source renders as a bordered card (amber accent for
changed, stamp red for failed) instead of a bare list; the before/after
diff snippet gets its own monospace lines; the quiet-week case is now a
calm centered panel rather than a single line of text. Every substantive
fact the old version reported is still present — nothing was trimmed
for the sake of looking nicer, only re-presented.

---

## Small refinements on Dan's feedback (3 August 2026)

1. **Bolder masthead.** The header eyebrow-only treatment felt too
   quiet. Added an optional `headerHtml` parameter to `buildEmailShell`
   (defaulting to the old small eyebrow, so the magic-link and monthly-
   notification emails are completely unaffected) and gave the content
   monitor its own bold masthead mirroring the tracker page's actual
   `brand-eyebrow` + `brand-title` copy and proportions. Web fonts
   don't reliably render in email — 'Big Shoulders Display' is listed
   first as a best-effort, with Arial Black/Impact as the fallback that
   carries the same bold, condensed, high-impact feel at a matching
   size and weight in the clients that will actually render it.

2. **Plain-language failures, not raw errors.** "HTTP 530" or a
   20-URL-long redirect chain means nothing at a glance. A new
   `humanizeFetchError()` translates the raw error into a one-line,
   common-sense explanation (e.g. "This site is blocking automated
   visits," "This site couldn't be reached right now — likely a
   temporary problem on their end"), shown as the primary text on each
   failed-source card. The raw technical detail is still shown — just
   small and clearly secondary — rather than discarded outright, so
   nothing is lost if it's ever needed for real troubleshooting.

3. **Plainer deferred-sources wording.** "Not reached this run (time
   budget)" became "We didn't get to N source(s) this time — checking
   sources gradually and considerately means a run occasionally runs
   out of time," answering the "why deferred" question in the same
   breath rather than requiring the reader to already know what a
   time budget is.
## Coverage bug, digest rewrite, and announcement tracking (10 August 2026)

Dan's prompt was about tone: the weekly digest "reads a little bit like
a list of things that could not be done." The run he was looking at
reported 10 of 117 sources checked, 0 changed, 2 failed, 107 deferred.
Investigating the tone found a real bug underneath it, so this round
fixed the cause first and the wording second.

### The run was only ever reaching ~8% of its sources

`CONTENT_MONITOR_TIME_BUDGET_MS` was 20 seconds. At the deliberate
750ms spacing between fetches, that is about 10 sources. With 117
sources and a weekly cron, **a full sweep took roughly twelve weeks** —
every tracked government page was effectively on a quarterly check
cycle, from a job described everywhere as weekly. The digest reported
this honestly every single week; nobody read "107 deferred" as
"quarterly coverage."

The 20-second figure came from a real incident (see the 3 August entry
above): an earlier version ran everything sequentially, took minutes,
and was killed mid-run with no digest sent. The diagnosis at the time —
an undocumented, very short ceiling — was **wrong**. The actual problem
was `ctx.waitUntil(runContentMonitor(env))` in the `scheduled()`
handler. Cloudflare's scheduled-handler documentation is explicit:

> The runtime waits for the promise returned by the `scheduled()`
> handler to resolve (up to the 15-minute duration limit).
> ...
> You do not need to use `waitUntil()` for the runtime to wait for a
> single asynchronous task.

Fixed by `await`ing the run, and raising the budget to **8 minutes**.
Expected real duration is around 3.5 minutes for all 117 sources, so
the budget is headroom rather than a constraint — but it is retained,
because a pathological run where every source hits the 15-second fetch
timeout would need ~30 minutes and would be cut off with no digest at
all. The KV cursor logic is unchanged and still handles that case.

**The monthly subscriber notification still uses `ctx.waitUntil()`** and
has the same latent exposure. It was deliberately not changed in the
same commit: it sends real email to real subscribers and deserves its
own change and verification rather than riding along with an internal
tool's fix. Worth doing.

### Digest rewritten around what the reader has to do

The old digest opened with a four-up stat grid in which three of the
four numbers were shortfalls, so a completely healthy week still read
as failure. The new order is: **attention → reassurance → housekeeping.**

- Changed pages first, unchanged.
- Then "Ready to announce" (below).
- Then **newly** unreachable sources.
- Then, only when there is genuinely nothing to do, an "All quiet" panel.
- Then a small, muted "For the record" block carrying known blockers,
  baselines, and anything deferred.

**Known blockers.** A consecutive-failure count per source now lives in
KV (`fail:<id>`, cleared on any success). After
`CONTENT_MONITOR_KNOWN_BLOCKER_RUNS` (3) consecutive failures a source
drops out of the alerting section into a single "for the record" line
with its run count. Israel's two gov.il services block automated
requests as a matter of policy and will never succeed; repeating two
identical full-size failure cards every week is how a reader learns to
skim the section where a genuinely new failure would appear. Nothing is
ever silently dropped, and a blocker that recovers and later breaks
again is treated as new.

The deferred note also now lists **distinct countries** rather than one
entry per source — it previously rendered "Kazakhstan, Kazakhstan,
Latvia, Latvia, Latvia" and looked broken.

### Announcement tracking (migration 503)

Dan's second idea, and a better use of the digest than source-watching
alone: track whether published content has actually been *told to
anyone*, and surface whatever has not.

Two new tables. `features` gives shipped features a home in D1 for the
first time (they previously existed only as prose in PROGRESS.md), so a
feature is a first-class trackable item alongside a story or a
whitepaper — and a public changelog page could read from it later.
`announcements` records `(item_type, item_id, channel, announced_at)`.

A table rather than an `announced` flag on each row, because it keeps a
dated history rather than one overwritable bit, supports more than one
channel per item, and works for features (which had no table to add a
column to).

**Expected channels are per item type**, which is the design decision
that keeps this useful:

```
story   -> newsletter
article -> newsletter, linkedin
feature -> newsletter, linkedin
```

A newsletter story is announced by the monthly email and that is
normally the whole job; a whitepaper or a shipped feature is worth a
post as well. Applying "needs LinkedIn too" to all ~35 stories in a
60-day window would bury the two or three items that actually need a
decision.

**The newsletter channel records itself.** `sendMonthlyNotifications()`
writes an announcement row for every story it included, after the send
loop and only when at least one email went out — under-recording is the
safe direction, since a re-announced story is a minor annoyance and a
falsely-recorded one is a silent gap.

**Stories are only chased once their month's send has passed.** The
monthly job fires on the 1st, so a story added on the 10th was never
announced to anyone — that is the real gap this catches. Current-month
stories are queued for the next send and deliberately stay quiet.

**Two guards against nagging**, both deliberate: a 60-day lookback
(something nobody announced three months ago is a decision, not an
oversight), and a baseline backfill in migration 503 marking every
pre-August story as newsletter-announced, since those sends demonstrably
happened. No `linkedin` row was ever backfilled — this system has no
idea what was posted socially, and inventing that would poison the one
signal it exists to give.

Verified against a full replay: the first digest surfaces **5 items**
(the CTC whitepaper plus four seeded features), not 40.

To record an announcement by hand:

```sql
INSERT INTO announcements (item_type, item_id, channel, announced_at, note)
SELECT 'feature', id, 'linkedin', '2026-08-11', 'https://linkedin.com/posts/...'
  FROM features WHERE slug = 'the-map';
```

To add a feature as you ship it:

```sql
INSERT INTO features (slug, title, description, shipped_at)
VALUES ('some-slug', 'Reader-facing title',
        'One or two plain-language sentences.', '2026-08-20');
```
