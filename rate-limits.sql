CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_identifier_action 
ON rate_limits(identifier, action);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start 
ON rate_limits(window_start);