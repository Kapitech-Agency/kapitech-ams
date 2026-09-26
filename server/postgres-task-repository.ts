import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

type Row = Record<string, any>;
const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' ? v as Record<string, unknown> : {};
const iso = (v: Date | string): string => v instanceof Date ? v.toISOString() : new Date(v).toISOString();
const date = (v: unknown): string => v == null ? '' : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);

function mapTask(row: Row): Record<string, unknown> {
  const metadata = obj(row.metadata);
  return {
    ...metadata,
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    projectId: row.project_id ?? '',
    projectName: String(metadata.projectName ?? ''),
    assignee: String(metadata.assignee ?? metadata.assignedTo ?? row.assignee_user_id ?? ''),
    assigneeUserId: typeof row.assignee_user_id === 'string' ? row.assignee_user_id : undefined,
    reporter: String(metadata.reporter ?? ''),
    priority: row.priority || 'medium',
    status: row.status,
    dueDate: date(row.due_date),
    estimatedHours: Number(metadata.estimatedHours ?? 0),
    actualHours: Number(metadata.actualHours ?? 0),
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    subtasks: Array.isArray(metadata.subtasks) ? metadata.subtasks : [],
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

async function resolveAssigneeUserId(client: { query: (text: string, values?: unknown[]) => Promise<any> }, value: unknown): Promise<string | null> {
  const candidate = String(value ?? '').trim();
  if (!candidate) return null;
  const result = await client.query(
    'SELECT id FROM users WHERE status = $2 AND (id = $1 OR lower(username) = lower($1) OR lower(name) = lower($1)) LIMIT 1',
    [candidate, 'active']
  );
  if (!result.rows[0]?.id) throw new Error('ASSIGNEE_NOT_FOUND');
  return String(result.rows[0].id);
}

function taskMetadata(task: Record<string, unknown>): Record<string, unknown> {
  const {
    id, title, description, projectId, projectName, assignee, reporter, priority, status, dueDate,
    createdAt, updatedAt, estimatedHours, actualHours, tags, subtasks, ...rest
  } = task;
  return { ...rest, projectName, assignee, reporter, estimatedHours, actualHours, tags, subtasks };
}

export class PostgresTaskRepository {
  async list(): Promise<Record<string, unknown>[]> {
    const result = await getPostgresPool().query('SELECT * FROM tasks ORDER BY created_at DESC');
    return (result.rows as Row[]).map(mapTask);
  }

  async findById(id: string): Promise<Record<string, unknown> | null> {
    const result = await getPostgresPool().query('SELECT * FROM tasks WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapTask(result.rows[0]) : null;
  }

  async create(task: Record<string, unknown>, audit?: AuditEntry): Promise<Record<string, unknown>> {
    const now = typeof task.createdAt === 'string' ? task.createdAt : new Date().toISOString();
    const projectId = typeof task.projectId === 'string' && task.projectId ? task.projectId : null;
    return withPostgresTransaction(async client => {
      if (projectId) {
        const project = await client.query('SELECT id FROM projects WHERE id = $1 FOR UPDATE', [projectId]);
        if (!project.rows[0]) throw new Error('Project not found.');
      }
      const assigneeUserId = await resolveAssigneeUserId(client, task.assignee);
      await client.query(
        `INSERT INTO tasks (id,project_id,title,description,status,priority,assignee_user_id,due_date,metadata,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          task.id, projectId, task.title, task.description || null, task.status, task.priority || 'medium',
          assigneeUserId, task.dueDate || null, JSON.stringify(taskMetadata(task)), now, task.updatedAt || now
        ]
      );
      if (projectId) {
        await client.query('UPDATE projects SET updated_at = NOW() WHERE id = $1', [projectId]);
      }
      const result = await client.query('SELECT * FROM tasks WHERE id = $1', [task.id]);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapTask(result.rows[0]);
    });
  }

  async update(id: string, patch: Record<string, unknown>, audit?: AuditEntry): Promise<Record<string, unknown> | null> {
    return withPostgresTransaction(async client => {
      const currentSnapshot = await client.query('SELECT project_id, updated_at FROM tasks WHERE id = $1 LIMIT 1', [id]);
      if (!currentSnapshot.rows[0]) return null;
      const currentProjectId = currentSnapshot.rows[0].project_id ? String(currentSnapshot.rows[0].project_id) : null;
      const requestedProjectId = typeof patch.projectId === 'string' && patch.projectId ? patch.projectId : currentProjectId;
      const projectIds = Array.from(new Set([currentProjectId, requestedProjectId].filter((value): value is string => Boolean(value)))).sort();
      for (const projectId of projectIds) {
        const project = await client.query('SELECT id FROM projects WHERE id = $1 FOR UPDATE', [projectId]);
        if (!project.rows[0]) throw new Error('Project not found.');
      }
      const currentResult = await client.query('SELECT * FROM tasks WHERE id = $1 FOR UPDATE', [id]);
      if (!currentResult.rows[0]) return null;
      const current = mapTask(currentResult.rows[0]);
      if (patch.updatedAt && iso(currentResult.rows[0].updated_at) !== patch.updatedAt) {
        throw new Error('Task has been modified since it was loaded. Refresh and retry.');
      }
      const next: Record<string, unknown> = { ...current, ...patch, id, updatedAt: new Date().toISOString() };
      const projectId = typeof next.projectId === 'string' && next.projectId ? next.projectId : null;
      if (projectId && !projectIds.includes(projectId)) {
        const project = await client.query('SELECT id FROM projects WHERE id = $1 FOR UPDATE', [projectId]);
        if (!project.rows[0]) throw new Error('Project not found.');
      }
      if (projectId !== (current.projectId ? String(current.projectId) : null)) {
        const logs = await client.query('SELECT COUNT(*)::int AS count FROM time_logs WHERE task_id=$1',[id]);
        if (Number(logs.rows[0]?.count || 0) > 0) throw new Error('TASK_PROJECT_MOVE_FORBIDDEN');
      }
      const assigneeUserId = await resolveAssigneeUserId(client, next.assignee);
      await client.query(
        `UPDATE tasks
         SET project_id=$2,title=$3,description=$4,status=$5,priority=$6,assignee_user_id=$7,due_date=$8,metadata=$9,updated_at=$10
         WHERE id=$1`,
        [id, projectId, next.title, next.description || null, next.status, next.priority || 'medium',
         assigneeUserId, next.dueDate || null, JSON.stringify(taskMetadata(next)), next.updatedAt]
      );
      if (currentProjectId) {
        await client.query('UPDATE projects SET updated_at = NOW() WHERE id = $1', [currentProjectId]);
      }
      if (projectId && projectId !== currentProjectId) {
        await client.query('UPDATE projects SET updated_at = NOW() WHERE id = $1', [projectId]);
      }
      const result = await client.query('SELECT * FROM tasks WHERE id = $1', [id]);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapTask(result.rows[0]);
    });
  }

  async delete(id: string, audit?: AuditEntry): Promise<boolean> {
    return withPostgresTransaction(async client => {
      const snapshot = await client.query('SELECT project_id FROM tasks WHERE id=$1 LIMIT 1',[id]);
      if (!snapshot.rows[0]) return false;
      const projectId = snapshot.rows[0].project_id ? String(snapshot.rows[0].project_id) : null;
      if (projectId) {
        const project = await client.query('SELECT id FROM projects WHERE id=$1 FOR UPDATE',[projectId]);
        if (!project.rows[0]) return false;
      }
      const current = await client.query('SELECT id, project_id FROM tasks WHERE id=$1 FOR UPDATE',[id]);
      if (!current.rows[0]) return false;
      const references = await client.query('SELECT COUNT(*)::int AS count FROM time_logs WHERE task_id=$1',[id]);
      if (Number(references.rows[0]?.count || 0) > 0) {
        throw new Error('TASK_HAS_TIME_LOGS');
      }
      const result = await client.query('DELETE FROM tasks WHERE id=$1',[id]);
      if (result.rowCount === 1 && projectId) {
        await client.query('UPDATE projects SET updated_at = NOW() WHERE id = $1', [projectId]);
      }
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return result.rowCount === 1;
    });
  }
}

export const postgresTaskRepository = new PostgresTaskRepository();
