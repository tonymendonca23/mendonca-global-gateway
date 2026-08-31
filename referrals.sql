-- Referral Program
-- Existing customers earn GYD shipping credit when a new customer signs up
-- using their Customer ID (customer_code) as the referral code.
--
-- Run with: node scripts/run-migration.mjs referrals.sql

-- Track which customer referred each user (optional; NULL = not referred)
ALTER TABLE users ADD COLUMN referred_by_id TEXT REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by_id);

-- Referral events ledger: one row per referred customer signup.
-- A referrer may have any number of referrals (no cap).
-- credit_status: pending (awaiting the referee's first paid order or admin action)
--              | credited (reward awarded)
--              | revoked  (manually cancelled by staff)
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT,
  credit_amount_gyd INTEGER NOT NULL DEFAULT 1000,
  credit_status TEXT NOT NULL DEFAULT 'pending',
  credited_at INTEGER,
  awarded_by TEXT REFERENCES staff(id),
  notes TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(credit_status);
