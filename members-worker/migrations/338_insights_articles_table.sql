-- ================================================================
-- "Insights" — owned blog posts + whitepapers, plus a slot for
-- sponsored content, surfaced under the tracker's existing Resources
-- menu ("Insights & Whitepapers", alongside Newsletter archive and
-- Tracking sources).
--
-- Design (see PROGRESS.md's "Business threads evaluated" and the
-- follow-up content-strategy discussion for the full reasoning):
--
--   - Public, SEO-indexable teaser lives on the ROOT domain
--     (e-invoicingcompliancecorner.com/insights/<slug>, rendered by
--     site-worker straight from this table — same "D1-backed, no
--     asset file behind it" pattern as /sources and the country
--     deep-dives). Every visitor, logged in or not, sees title + dek
--     + teaser_html, so Google indexes real content, not a login wall.
--
--   - The FULL body only ever renders in two cases:
--       1. gated = 0 (an open piece — including anything sponsored;
--          a sponsor is paying for reach, so gating it would defeat
--          the point)
--       2. gated = 1 AND the visitor has an active session — which
--          can only be established on the members.* subdomain, since
--          the session cookie (SESSION_COOKIE in members-worker) is
--          host-only there, unlike the shared, domain-scoped
--          eicc_lang cookie. So a gated piece's "keep reading" link
--          on the public page points to
--          members.e-invoicingcompliancecorner.com/members/insights/<slug>,
--          which reuses requireSession()/isCurrentlyActive() exactly
--          like the existing gated newsletter archive does — no new
--          auth mechanism, no cross-subdomain cookie sharing, no CORS
--          + credentials (deliberately avoided elsewhere in this
--          Worker; see withCors()'s own comment).
--
--   - English-first: no *_translations side table yet, unlike
--     stories/milestones/deep-dives. Content marketing pieces don't
--     carry the same "every jurisdiction, every language" obligation
--     as compliance data — add a translations table later if/when
--     ES/DE/FR readership justifies it.
--
--   - `published` follows the same draft/publish convention as
--     `stories.published` — insert with published = 0 while drafting,
--     flip to 1 (and set published_at) when ready to go live. Nothing
--     unpublished is ever queried by either Worker's public routes.
-- ================================================================

CREATE TABLE articles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  type          TEXT NOT NULL CHECK (type IN ('blog', 'whitepaper')),
  title         TEXT NOT NULL,
  dek           TEXT NOT NULL,            -- one-line teaser, always shown (even when gated)
  teaser_html   TEXT NOT NULL,            -- opening paragraph(s), shown to everyone
  body_html     TEXT,                     -- full article body (blog); NULL for whitepapers, use pdf_url
  pdf_url       TEXT,                     -- whitepaper download link (only meaningful when type = 'whitepaper')
  gated         INTEGER NOT NULL DEFAULT 1 CHECK (gated IN (0, 1)),
  is_sponsored  INTEGER NOT NULL DEFAULT 0 CHECK (is_sponsored IN (0, 1)),
  sponsor_name  TEXT,
  sponsor_url   TEXT,
  author        TEXT NOT NULL DEFAULT 'The E-Invoicing Compliance Corner',
  published     INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  published_at  TEXT,                     -- ISO date string, set when published = 1
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Both Workers' public listing queries filter on published = 1 and
-- sort by published_at DESC — index covers that access pattern.
CREATE INDEX idx_articles_published ON articles(published, published_at);

-- No seed rows: this migration only stands up the schema. Add the
-- first real piece with an INSERT like:
--
--   INSERT INTO articles
--     (slug, type, title, dek, teaser_html, body_html, gated, is_sponsored, author, published, published_at)
--   VALUES
--     ('what-changed-in-2026', 'blog', 'What Changed in E-Invoicing in 2026',
--      'A country-by-country recap of this year''s mandate milestones.',
--      '<p>2026 brought e-invoicing deadlines to more jurisdictions than any prior year...</p>',
--      '<p>2026 brought e-invoicing deadlines to more jurisdictions than any prior year...</p><p>(full body)</p>',
--      1, 0, 'The E-Invoicing Compliance Corner', 1, '2026-08-04');
