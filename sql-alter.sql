ALTER TABLE packages ADD COLUMN duty_usd REAL DEFAULT 0;

-- Add email_verification_tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_email_verification_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON email_verification_tokens(token_hash);

ALTER TABLE invoices ADD COLUMN duty_fee INTEGER NOT NULL DEFAULT 0;
