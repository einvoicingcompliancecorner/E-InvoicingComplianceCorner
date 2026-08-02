-- Feedback submissions from the public feedback form. Until now the
-- form was demo scaffolding: it called a window.storage API that
-- doesn't exist in browsers, swallowed the error, and showed success
-- anyway — every submission was silently discarded. Submissions now
-- land here (durable record) AND get emailed via Resend; the row is
-- written first so a Resend failure can't lose the message.
-- ip supports a light rate limit (count recent rows per IP).

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,        -- ISO timestamp (UTC)
  email TEXT NOT NULL,             -- submitter's address (for replies)
  subject TEXT NOT NULL,
  comments TEXT NOT NULL,
  lang TEXT,                       -- UI language at submission time
  ip TEXT                          -- for rate limiting / abuse control
);
CREATE INDEX IF NOT EXISTS idx_feedback_ip_time ON feedback (ip, created_at);
