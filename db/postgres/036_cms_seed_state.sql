-- AMS PostgreSQL migration 036
-- Tracks one-time bootstrap of bundled public CMS defaults into PostgreSQL.
BEGIN;

CREATE TABLE IF NOT EXISTS cms_seed_state (
  key TEXT PRIMARY KEY,
  seeded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
