-- AMS PostgreSQL migration 022
-- Give the audit chain a database-backed canonical order independent of timestamp collisions.
BEGIN;

CREATE SEQUENCE IF NOT EXISTS audit_logs_sequence_v1 AS BIGINT;

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS sequence BIGINT;

WITH ordered AS (
  SELECT ctid,
         ROW_NUMBER() OVER (ORDER BY timestamp ASC, id ASC) AS sequence_number
  FROM audit_logs
  WHERE sequence IS NULL
)
UPDATE audit_logs AS logs
SET sequence = ordered.sequence_number
FROM ordered
WHERE logs.ctid = ordered.ctid;

SELECT setval(
  'audit_logs_sequence_v1',
  GREATEST(COALESCE((SELECT MAX(sequence) FROM audit_logs), 0), 1),
  COALESCE((SELECT MAX(sequence) FROM audit_logs), 0) > 0
);

ALTER TABLE audit_logs
  ALTER COLUMN sequence SET DEFAULT nextval('audit_logs_sequence_v1'),
  ALTER COLUMN sequence SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_audit_logs_sequence_v1
  ON audit_logs(sequence);

COMMIT;
