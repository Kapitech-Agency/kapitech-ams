CREATE TABLE IF NOT EXISTS security_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS security_rate_limits_expires_at_idx
  ON security_rate_limits (expires_at);

CREATE TABLE IF NOT EXISTS security_login_lockouts (
  lockout_key TEXT PRIMARY KEY,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  lockout_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS security_login_lockouts_until_idx
  ON security_login_lockouts (lockout_until);
