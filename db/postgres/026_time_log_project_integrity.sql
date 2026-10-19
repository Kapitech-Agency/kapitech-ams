-- AMS PostgreSQL migration 026
-- Database-level integrity for time-log project/task references.
-- A time log tied to a task must use the same project as that task.
-- A task with historical time logs cannot be moved between projects.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM time_logs tl
    JOIN tasks t ON t.id = tl.task_id
    WHERE tl.task_id IS NOT NULL
      AND (tl.project_id IS DISTINCT FROM t.project_id)
  ) THEN
    RAISE EXCEPTION 'TIME_LOG_TASK_PROJECT_INCONSISTENCY: existing time logs do not match their task project.';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION enforce_time_log_task_project_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  task_project_id TEXT;
BEGIN
  IF NEW.task_id IS NULL THEN
    IF NEW.project_id IS NULL THEN
      RAISE EXCEPTION 'TIME_LOG_PROJECT_REQUIRED';
    END IF;
    RETURN NEW;
  END IF;

  SELECT project_id
    INTO task_project_id
  FROM tasks
  WHERE id = NEW.task_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TIME_LOG_TASK_NOT_FOUND';
  END IF;

  IF task_project_id IS NULL THEN
    RAISE EXCEPTION 'TIME_LOG_TASK_PROJECT_REQUIRED';
  END IF;

  IF NEW.project_id IS DISTINCT FROM task_project_id THEN
    RAISE EXCEPTION 'TIME_LOG_TASK_PROJECT_MISMATCH';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS time_logs_task_project_integrity_v1 ON time_logs;
CREATE TRIGGER time_logs_task_project_integrity_v1
BEFORE INSERT OR UPDATE OF project_id, task_id ON time_logs
FOR EACH ROW
EXECUTE FUNCTION enforce_time_log_task_project_v1();

CREATE OR REPLACE FUNCTION prevent_task_project_move_with_logs_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.project_id IS DISTINCT FROM OLD.project_id
     AND EXISTS (
       SELECT 1
       FROM time_logs
       WHERE task_id = OLD.id
     )
  THEN
    RAISE EXCEPTION 'TASK_PROJECT_MOVE_FORBIDDEN';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_project_move_integrity_v1 ON tasks;
CREATE TRIGGER tasks_project_move_integrity_v1
BEFORE UPDATE OF project_id ON tasks
FOR EACH ROW
EXECUTE FUNCTION prevent_task_project_move_with_logs_v1();

COMMIT;
