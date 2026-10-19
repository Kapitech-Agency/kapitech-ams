import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

type Row = Record<string, any>;
const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' ? v as Record<string, unknown> : {};
const iso = (v: Date | string): string => v instanceof Date ? v.toISOString() : new Date(v).toISOString();
const date = (v: unknown): string => v == null ? '' : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);

function mapTimeLog(row: Row): Record<string, unknown> {
  const metadata = obj(row.metadata);
  const hours = Number(row.hours || 0);
  return {
    ...metadata,
    id: row.id,
    projectId: row.project_id ?? '',
    taskId: row.task_id ?? '',
    userId: row.user_id ?? '',
    user: String(metadata.user ?? ''),
    durationMinutes: Math.round(hours * 60),
    hours,
    billable: metadata.billable !== undefined ? Boolean(metadata.billable) : true,
    date: date(row.logged_at),
    loggedAt: iso(row.logged_at),
    notes: String(row.description ?? metadata.notes ?? ''),
    createdAt: iso(row.created_at)
  };
}

function logMetadata(log: Record<string, unknown>): Record<string, unknown> {
  const { id, projectId, taskId, userId, user, durationMinutes, hours, billable, date, loggedAt, notes, createdAt, ...rest } = log;
  return { ...rest, user, billable };
}

export class PostgresTimeLogRepository {
  async list(): Promise<Record<string, unknown>[]> {
    const result = await getPostgresPool().query('SELECT * FROM time_logs ORDER BY logged_at DESC, created_at DESC');
    return (result.rows as Row[]).map(mapTimeLog);
  }

  async findById(id: string): Promise<Record<string, unknown> | null> {
    const result = await getPostgresPool().query('SELECT * FROM time_logs WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapTimeLog(result.rows[0]) : null;
  }

  async create(log: Record<string, unknown>, audit?: AuditEntry): Promise<Record<string, unknown>> {
    const durationMinutes = Number(log.durationMinutes ?? Number(log.hours || 0) * 60);
    const hours = Math.round((durationMinutes / 60) * 100) / 100;
    if (!Number.isFinite(hours) || hours <= 0) throw new Error('Time log duration must be greater than zero.');
    const loggedAt = typeof log.date === 'string' && log.date ? `${log.date}T00:00:00.000Z` : new Date().toISOString();
    const projectId = typeof log.projectId === 'string' && log.projectId ? log.projectId : null;
    const taskId = typeof log.taskId === 'string' && log.taskId ? log.taskId : null;
    return withPostgresTransaction(async client => {
      let resolvedProjectId = projectId;
      if (projectId) {
        const project = await client.query('SELECT id FROM projects WHERE id = $1 FOR SHARE', [projectId]);
        if (!project.rows[0]) throw new Error('Project not found.');
      }
      if (taskId) {
        const task = await client.query('SELECT id, project_id FROM tasks WHERE id = $1 FOR SHARE', [taskId]);
        if (!task.rows[0]) throw new Error('Task not found.');
        const taskProjectId = task.rows[0].project_id ? String(task.rows[0].project_id) : null;
        if (resolvedProjectId && taskProjectId !== resolvedProjectId) {
          throw new Error('Task does not belong to the selected project.');
        }
        if (!resolvedProjectId && taskProjectId) resolvedProjectId = taskProjectId;
        if (!resolvedProjectId && !taskProjectId) {
          throw new Error('Task must belong to a project before time can be logged.');
        }
      }
      if (!resolvedProjectId && !taskId) {
        throw new Error('Time log must reference a project or task.');
      }
      const metadata = logMetadata(log);
      await client.query(
        `INSERT INTO time_logs (id,project_id,task_id,user_id,hours,description,logged_at,created_at,metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
        [log.id, resolvedProjectId, taskId, typeof log.userId === 'string' && log.userId ? log.userId : null,
         hours, String(log.notes ?? ''), loggedAt, log.createdAt || new Date().toISOString(), JSON.stringify(metadata)]
      );
      const result = await client.query('SELECT * FROM time_logs WHERE id = $1', [log.id]);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapTimeLog(result.rows[0]);
    });
  }

  async delete(id: string, audit?: AuditEntry): Promise<boolean> {
    return withPostgresTransaction(async client => {
      const result = await client.query('DELETE FROM time_logs WHERE id = $1', [id]);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return result.rowCount === 1;
    });
  }
}

export const postgresTimeLogRepository = new PostgresTimeLogRepository();
