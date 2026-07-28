# Subscribers-Only Archive — Setup Guide

This is a small Cloudflare Worker that gives your paid subscribers a real,
server-verified login to a newsletter archive. It is genuinely separate
from the static tracker site — this is the part that actually enforces
"only active subscribers can see this."

**What it does:**
- Listens for Lemon Squeezy webhooks and keeps a live record of who's
  currently paying (recurring, cancelled, or a one-time 12-month grant).
- Lets a subscriber request a one-click "magic link" sign-in email —
  no password to create, remember, or leak.
- Serves the newsletter archive only to requests holding a valid,
  server-verified session for a currently-active subscriber.

**What it costs:** Cloudflare Workers' free tier (100,000 requests/day)
and Workers KV free tier are both far more than this needs at any
realistic subscriber count. Resend's free tier (100 emails/day) is
also enough unless you have a genuinely large list. Realistically:
**$0/month** until you're at a scale where this is a nice problem to have.

---

## Prerequisites

- A [Cloudflare](https://cloudflare.com) account (free)
- A [Resend](https://resend.com) account (free) — or swap in any other
  transactional email API by editing the `sendMagicLinkEmail` function
  in `src/index.js`
- Node.js installed on your computer (to run the Wrangler CLI)
- Your Lemon Squeezy store already set up (from the earlier subscription work)

---

## Step 1 — Install Wrangler (Cloudflare's CLI) and log in

```bash
npm install -g wrangler
wrangler login
```

This opens a browser window to authorize Wrangler against your Cloudflare account.

## Step 2 — Create the two KV namespaces

```bash
cd members-worker
wrangler kv namespace create SUBSCRIBERS
wrangler kv namespace create ISSUES
```

Each command prints an `id` — copy both into `wrangler.toml`, replacing
`REPLACE_WITH_SUBSCRIBERS_KV_ID` and `REPLACE_WITH_ISSUES_KV_ID`.

## Step 3 — Set your secrets

These are never written to a file, so they can't accidentally end up in
version control:

```bash
wrangler secret put LEMONSQUEEZY_WEBHOOK_SECRET
wrangler secret put SESSION_SECRET
wrangler secret put RESEND_API_KEY
```

- `LEMONSQUEEZY_WEBHOOK_SECRET` — you'll set this value yourself when you
  create the webhook in Lemon Squeezy (Step 5) — it's a shared secret you
  invent, not something Lemon Squeezy gives you first. Generate a random
  string (e.g. `openssl rand -hex 32`) and use the same value in both places.
- `SESSION_SECRET` — another random string you generate yourself
  (e.g. `openssl rand -hex 32`). This signs login links and session
  cookies — keep it private and don't reuse it elsewhere.
- `RESEND_API_KEY` — from your Resend dashboard, under API Keys.

## Step 4 — Verify a sending domain in Resend

Resend (like any transactional email provider) requires you to verify
you own the domain you're sending "from" — follow their dashboard flow
to add the DNS records for your domain. Once verified, update
`FROM_EMAIL` in `wrangler.toml` to match (e.g. `newsletter@yourdomain.com`).

## Step 5 — Fill in the rest of `wrangler.toml`

- `SITE_URL` — leave as the default `workers.dev` URL for now; you'll
  learn your real one after your first deploy (Step 6), then update
  this and redeploy. If you later route a custom domain (e.g.
  `members.yourdomain.com`) to this Worker, update it again.
- `ONE_TIME_VARIANT_ID` — from Lemon Squeezy: Products → your one-time
  product → copy the variant ID (visible in the product URL or via
  Settings → API). Leave the placeholder if you haven't set up a
  one-time tier.

## Step 6 — Deploy

```bash
wrangler deploy
```

This prints your live URL, something like
`https://eicc-members.YOUR-SUBDOMAIN.workers.dev`. Update `SITE_URL` in
`wrangler.toml` to match this exactly, then run `wrangler deploy` again.

## Step 7 — Connect the Lemon Squeezy webhook

In Lemon Squeezy: **Settings → Webhooks → Add webhook**

- **URL:** `https://YOUR-WORKER-URL/webhooks/lemonsqueezy`
- **Signing secret:** the exact same random string you used for
  `LEMONSQUEEZY_WEBHOOK_SECRET` in Step 3
- **Events to subscribe to** (tick these):
  - `subscription_created`
  - `subscription_updated`
  - `subscription_cancelled`
  - `subscription_expired`
  - `subscription_payment_success`
  - `subscription_payment_failed`
  - `subscription_paused`
  - `subscription_unpaused`
  - `subscription_payment_recovered`
  - `order_created`

## Step 8 — Add your first newsletter issue

Issues are stored as simple KV entries — no admin panel needed for a
one-person operation. Save your issue as HTML in a file, e.g. `issue.html`,
then:

```bash
wrangler kv key put --binding=ISSUES "2026-08" --remote --path=issue.json
```

Where `issue.json` looks like:

```json
{
  "title": "August 2026: Poland KSeF penalties begin, Ireland confirms Phase 1",
  "date": "2026-08-01",
  "summary": "This month: KSeF penalties activate, Ireland locks in its large-corporate definition, and three new deep dives go live.",
  "countries": ["Poland", "Ireland"],
  "html": "<p>Your full newsletter HTML content goes here...</p>"
}
```

The key (`"2026-08"` above) becomes the issue's URL slug — use whatever
naming scheme you like, but if you want the monthly notification job
(Step 10) to find the right issue automatically, keep it in `YYYY-MM`
format matching the actual calendar month.

**The `countries` field is what powers the monthly notification email**
(Step 10) — list every country this issue actually covers, using the
exact same names as `countries.js` on the main site (e.g. `"United Arab
Emirates"`, not `"UAE"`). If you skip this field, the notification job
still runs, it just won't be able to tell any subscriber their specific
countries came up.

## Step 9 — Link to it from your main site

Add a link somewhere visible on the tracker (e.g. the Menu dropdown or
footer) pointing to `https://YOUR-WORKER-URL/members`. The tracker site
itself stays static and unchanged — this Worker is a separate, small
piece of infrastructure alongside it.

## Step 10 — The monthly notification email (already wired up, nothing to build)

Every month, on the 1st at 09:00 UTC, this Worker automatically:

1. Looks up that month's issue (using the `YYYY-MM` key)
2. Goes through every active subscriber
3. Compares their followed countries (Step 8's country-preferences work)
against that issue's `countries` field
4. Sends a short notification — **not the full newsletter content** —
   telling them either which of their countries came up, or, if none did,
   that nothing matched this month but the full digest is there if they're
   curious
5. Includes a one-click "stop these notifications" link that opts them out
   of future monthly emails without touching their paid subscription

This is deliberately a notification, not the newsletter itself — the
actual content only ever lives behind the login, in one place, in one
format. This avoids needing the full digest to render correctly as an
HTML email across Gmail/Outlook/Apple Mail, which is its own can of worms.

**This requires no setup on your part** beyond having deployed the Worker
with the `[triggers]` section in `wrangler.toml` — Cloudflare handles the
actual scheduling. You can confirm the cron is registered from the
Cloudflare dashboard: Workers & Pages → your Worker → Triggers.

**To test it without waiting for the 1st of the month**, there's a manual
trigger endpoint, protected by your `SESSION_SECRET` so nobody else can
fire it:

```bash
curl -X POST https://YOUR-WORKER-URL/admin/send-monthly-notifications \
  -H "X-Admin-Secret: YOUR_SESSION_SECRET_VALUE"
```

Watch `wrangler tail` while you run this to see it process each
subscriber and confirm how many emails were sent.

---

## Testing before you rely on it

1. Use Lemon Squeezy's **test mode** to simulate a subscription event
   (Lemon Squeezy dashboard → a test subscription → "Simulate event")
   and confirm your Worker receives it (check `wrangler tail` for logs).
2. Manually add yourself as an active subscriber to test the login flow
   without a real payment:
   ```bash
   wrangler kv key put --binding=SUBSCRIBERS "you@example.com" '{"active":true,"plan":"recurring","updated":0}'
   ```
3. Visit `/members`, enter that email, and confirm the magic link email
   arrives and successfully logs you into the archive.
4. Set `active` to `false` for that test record and confirm you're
   correctly locked out.

## Letting subscribers update their own country preferences

Subscribers can update their alert preferences any time without going
through checkout again — from the archive page, there's a "Manage
which countries you get alerts for" link that takes them to
`/members/preferences`. It's gated by the same login session as the
archive itself, shows their current selection pre-checked, and saves
straight back to their KV record on submit.

The same page also has a checkbox for the monthly notification email
itself — a subscriber can turn that off without cancelling their paid
subscription, or turn it back on later. This is the same setting the
one-click "stop these notifications" link in the email itself controls
(that link works without logging in, so it stays genuinely one-click).

**Keeping the country list in sync**: both `countries.js` (loaded by
the static subscribe page) and this Worker's `COUNTRIES_BY_REGION`
constant (in `src/index.js`) list the same countries/regions, but live
in two separate JavaScript environments that can't directly share a
file. Whenever you add a country to the tracker, update both of these
in the same step — otherwise the subscribe page and the preferences
page could show different lists.

## Segmenting subscribers by country of interest

The subscribe page now asks new subscribers which countries they'd like
alerts for (optional — leaving it blank means "send the full digest").
This selection is passed through Lemon Squeezy checkout as custom data
and lands automatically in each subscriber's KV record, e.g.:

```json
{"active": true, "plan": "recurring", "countries": ["Poland", "France"], "updated": 1721.....}
```

**To see one subscriber's interests:**
```bash
npx wrangler kv key get --binding=SUBSCRIBERS "someone@example.com" --remote
```

**To pull every active subscriber and their country preferences** (useful
before sending a targeted alert — e.g. "everyone interested in Poland"):
```bash
npx wrangler kv key list --binding=SUBSCRIBERS --remote
```
Then fetch each one with `kv key get` as above. For a handful of
subscribers this is fine to do manually; once your list grows, this is
the natural point to write a small script that loops through the list
automatically and exports a CSV — happy to build that when you're there.

**One nuance worth knowing:** renewal and payment-status webhooks (e.g.
`subscription_payment_success` on a renewal) don't repeat the original
checkout's custom data, so the Worker deliberately preserves whichever
country selection was captured at signup rather than wiping it on every
event — you'll only see it change if someone goes through checkout again.

## Ongoing maintenance

- Add a new KV entry each month when you publish an issue (Step 8) —
  **remember the `countries` field**, since that's what the monthly
  notification job reads to personalise each subscriber's email.
- Everything else — subscriber sync, login, access control, country
  preference capture, and the monthly notification email — runs
  automatically once deployed. There's no server to patch or restart,
  and no cron job to babysit beyond the initial deploy.
- **Resend's free tier caps at 100 emails/day.** Fine at low subscriber
  counts, but worth knowing this ceiling exists — if your list grows past
  that, the monthly notification run could hit the limit partway through
  and silently stop sending to the rest. Check Resend's pricing page if
  you're approaching that size.

