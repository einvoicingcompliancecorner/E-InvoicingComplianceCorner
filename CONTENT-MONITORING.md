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
3. If it is: update `DATA` (and its three translation files), update the
   relevant deep-dive page (and its translations, if that page has been
   translated), and consider whether it's newsletter-worthy for the next
   monthly issue — following the exact same source-linking discipline
   already used throughout this site (link to the actual government page,
   not just a paraphrase).
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
