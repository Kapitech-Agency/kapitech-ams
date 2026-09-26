import type { AgencyProject, ProjectTask } from '../src/lib/projectStore.ts';
import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

type Row = Record<string, any>;
const iso = (v: Date | string): string => v instanceof Date ? v.toISOString() : new Date(v).toISOString();
const date = (v: unknown): string => v == null ? '' : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);
const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' ? v as Record<string, unknown> : {};

export class ProjectConcurrencyError extends Error {
  constructor() { super('Project has been modified since it was loaded. Refresh and retry.'); this.name = 'ProjectConcurrencyError'; }
}

function mapTask(row: Row): ProjectTask {
  const metadata = obj(row.metadata);
  return {
    ...(metadata as Partial<ProjectTask>),
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as ProjectTask['status'],
    priority: (row.priority || 'medium') as ProjectTask['priority'],
    assignedTo: String(metadata.assignedTo ?? row.assignee_user_id ?? ''),
    dueDate: date(row.due_date),
    createdAt: iso(row.created_at)
  };
}

function mapProject(row: Row, tasks: ProjectTask[]): AgencyProject {
  const metadata = obj(row.metadata);
  return {
    ...(metadata as Partial<AgencyProject>),
    id: row.id,
    name: row.name,
    clientId: row.client_id ?? (metadata.clientId ? String(metadata.clientId) : undefined),
    clientName: String(metadata.clientName ?? ''),
    clientCompany: String(metadata.clientCompany ?? ''),
    clientEmail: String(metadata.clientEmail ?? ''),
    crmLeadId: metadata.crmLeadId ? String(metadata.crmLeadId) : undefined,
    serviceCategory: String(metadata.serviceCategory ?? ''),
    status: row.status as AgencyProject['status'],
    budget: Number(row.budget || 0),
    progressPercent: Number(metadata.progressPercent ?? 0),
    startDate: date(row.start_date),
    targetEndDate: date(row.end_date),
    teamLead: String(metadata.teamLead ?? row.owner ?? ''),
    teamMembers: Array.isArray(metadata.teamMembers) ? metadata.teamMembers as string[] : [],
    techStack: Array.isArray(metadata.techStack) ? metadata.techStack as string[] : [],
    milestones: Array.isArray(metadata.milestones) ? metadata.milestones as AgencyProject['milestones'] : [],
    tasks,
    repositoryUrl: typeof metadata.repositoryUrl === 'string' ? metadata.repositoryUrl : undefined,
    figmaUrl: typeof metadata.figmaUrl === 'string' ? metadata.figmaUrl : undefined,
    liveStagingUrl: typeof metadata.liveStagingUrl === 'string' ? metadata.liveStagingUrl : undefined,
    notes: typeof row.description === 'string' ? row.description : undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

function projectMetadata(project: AgencyProject): Record<string, unknown> {
  const { id, name, clientId, clientName, clientCompany, clientEmail, crmLeadId, serviceCategory, status, budget, startDate, targetEndDate, teamLead, teamMembers, techStack, milestones, tasks, repositoryUrl, figmaUrl, liveStagingUrl, notes, createdAt, updatedAt, progressPercent, ...rest } = project;
  return { ...rest, clientId, clientName, clientCompany, clientEmail, crmLeadId, serviceCategory, progressPercent, teamLead, teamMembers, techStack, milestones, repositoryUrl, figmaUrl, liveStagingUrl };
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

function taskMetadata(task: ProjectTask): Record<string, unknown> {
  const { id, title, description, status, priority, assignedTo, dueDate, createdAt, ...metadata } = task;
  return metadata;
}

export class PostgresProjectRepository {
  async list(): Promise<AgencyProject[]> {
    const pool = getPostgresPool();
    const [projects, tasks] = await Promise.all([
      pool.query('SELECT * FROM projects ORDER BY created_at DESC'),
      pool.query('SELECT * FROM tasks ORDER BY created_at ASC')
    ]);
    const grouped = new Map<string, ProjectTask[]>();
    for (const row of tasks.rows as Row[]) {
      if (!row.project_id) continue;
      const list = grouped.get(row.project_id) ?? [];
      list.push(mapTask(row));
      grouped.set(row.project_id, list);
    }
    return (projects.rows as Row[]).map(row => mapProject(row, grouped.get(row.id) ?? []));
  }

  async findById(id: string): Promise<AgencyProject | null> {
    const pool = getPostgresPool();
    const [project, tasks] = await Promise.all([
      pool.query('SELECT * FROM projects WHERE id = $1 LIMIT 1', [id]),
      pool.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at ASC', [id])
    ]);
    return project.rows[0] ? mapProject(project.rows[0], (tasks.rows as Row[]).map(mapTask)) : null;
  }

  async create(project: AgencyProject, audit?: AuditEntry): Promise<AgencyProject> {
    return withPostgresTransaction(async client => {
      if (project.clientId) {
        const linkedClient = await client.query('SELECT id FROM clients WHERE id = $1 FOR SHARE', [project.clientId]);
        if (!linkedClient.rows[0]) throw new Error('Client not found.');
      }
      await client.query(
        `INSERT INTO projects (id,client_id,name,description,status,owner,budget,start_date,end_date,metadata,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [project.id, project.clientId || null, project.name, project.notes || null, project.status, project.teamLead || null, project.budget,
         project.startDate || null, project.targetEndDate || null, JSON.stringify(projectMetadata(project)), project.createdAt, project.updatedAt]
      );
      for (const task of project.tasks || []) await this.insertTask(client, project.id, task);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return project;
    });
  }

  async update(id: string, patch: Partial<AgencyProject>, audit?: AuditEntry): Promise<AgencyProject | null> {
    return withPostgresTransaction(async client => {
      const currentResult = await client.query('SELECT * FROM projects WHERE id = $1 FOR UPDATE', [id]);
      if (!currentResult.rows[0]) return null;
      const current = currentResult.rows[0] as Row;
      if (patch.updatedAt && iso(current.updated_at) !== patch.updatedAt) throw new ProjectConcurrencyError();
      const tasksResult = await client.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at ASC FOR UPDATE', [id]);
      const currentProject = mapProject(current, (tasksResult.rows as Row[]).map(mapTask));
      const next = { ...currentProject, ...patch, id, updatedAt: new Date().toISOString() };
      if (next.clientId) {
        const linkedClient = await client.query('SELECT id FROM clients WHERE id = $1 FOR SHARE', [next.clientId]);
        if (!linkedClient.rows[0]) throw new Error('Client not found.');
      }
      const currentClientId = current.client_id ? String(current.client_id) : null;
      const nextClientId = next.clientId ? String(next.clientId) : null;
      if (currentClientId !== nextClientId) {
        const linkedBusiness = await client.query(
          'SELECT (SELECT COUNT(*)::int FROM proposals WHERE project_id=$1) + (SELECT COUNT(*)::int FROM invoices WHERE project_id=$1) AS count',
          [id]
        );
        if (Number(linkedBusiness.rows[0]?.count || 0) > 0) throw new Error('PROJECT_CLIENT_IMMUTABLE');
      }
      await client.query(
        `UPDATE projects SET client_id=$2,name=$3,description=$4,status=$5,owner=$6,budget=$7,start_date=$8,end_date=$9,metadata=$10,updated_at=$11 WHERE id=$1`,
        [id, next.clientId || null, next.name, next.notes || null, next.status, next.teamLead || null, next.budget, next.startDate || null,
         next.targetEndDate || null, JSON.stringify(projectMetadata(next)), next.updatedAt]
      );
      if (patch.tasks !== undefined) {
        const incoming = Array.isArray(next.tasks) ? next.tasks : [];
        const incomingIds = new Set(incoming.map(task => String(task.id)).filter(Boolean));
        if (incomingIds.size !== incoming.length) throw new Error('DUPLICATE_TASK_ID');
        const existingById = new Map((tasksResult.rows as Row[]).map(row => [String(row.id), row]));
        // Never delete-and-recreate tasks: historical time logs reference task IDs.
        for (const task of incoming) {
          const taskStatus = String(task.status || 'todo');
          const taskPriority = String(task.priority || 'medium');
          if (!['todo','in_progress','review','done'].includes(taskStatus)) throw new Error('INVALID_TASK_STATUS');
          if (!['low','medium','high','urgent'].includes(taskPriority)) throw new Error('INVALID_TASK_PRIORITY');
          const taskId = String(task.id || '');
          if (!taskId) throw new Error('TASK_ID_REQUIRED');
          const existingTask = existingById.get(taskId);
          if (existingTask) {
            const mapped = mapTask(existingTask);
            const merged = { ...mapped, ...task, id: taskId };
            const assigneeUserId = await resolveAssigneeUserId(client, merged.assignedTo);
            await client.query(
              `UPDATE tasks SET title=$2,description=$3,status=$4,priority=$5,assignee_user_id=$6,due_date=$7,metadata=$8,updated_at=$9 WHERE id=$1 AND project_id=$10`,
              [taskId, merged.title, merged.description || null, merged.status, merged.priority || 'medium',
               assigneeUserId, merged.dueDate || null, JSON.stringify({ ...taskMetadata(merged), assignedTo: merged.assignedTo || '' }),
               new Date().toISOString(), id]
            );
          } else {
            await this.insertTask(client, id, task);
          }
        }
        for (const row of tasksResult.rows as Row[]) {
          const taskId = String(row.id);
          if (!incomingIds.has(taskId)) {
            const logs = await client.query('SELECT COUNT(*)::int AS count FROM time_logs WHERE task_id=$1', [taskId]);
            if (Number(logs.rows[0]?.count || 0) > 0) throw new Error('TASK_HAS_TIME_LOGS');
            await client.query('DELETE FROM tasks WHERE id=$1 AND project_id=$2', [taskId, id]);
          }
        }
      }
      const refreshed = await client.query('SELECT * FROM projects WHERE id = $1', [id]);
      const refreshedTasks = await client.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at ASC', [id]);
      const result = mapProject(refreshed.rows[0], (refreshedTasks.rows as Row[]).map(mapTask));
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return result;
    });
  }

  async delete(id: string, audit?: AuditEntry): Promise<boolean> {
    const client = await getPostgresPool().connect();
    try {
      await client.query('BEGIN');
      const locked = await client.query('SELECT id FROM projects WHERE id=$1 FOR UPDATE',[id]);
      if (!locked.rows[0]) { await client.query('ROLLBACK'); return false; }
      const references = await client.query(
        `SELECT
          (SELECT COUNT(*)::int FROM proposals WHERE project_id=$1) AS proposals,
          (SELECT COUNT(*)::int FROM invoices WHERE project_id=$1) AS invoices,
          (SELECT COUNT(*)::int FROM tasks WHERE project_id=$1) AS tasks,
          (SELECT COUNT(*)::int FROM time_logs WHERE project_id=$1) AS time_logs`,
        [id]
      );
      if (Object.values(references.rows[0] || {}).some(v=>Number(v)>0)) {
        await client.query('ROLLBACK');
        throw new Error('PROJECT_HAS_BUSINESS_RECORDS');
      }
      const result=await client.query('DELETE FROM projects WHERE id=$1',[id]);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      await client.query('COMMIT');
      return result.rowCount===1;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch {}
      throw error;
    } finally {
      client.release();
    }
  }

  private async insertTask(client: { query: (text: string, values?: unknown[]) => Promise<any> }, projectId: string, task: ProjectTask): Promise<void> {
    const assigneeUserId = await resolveAssigneeUserId(client, task.assignedTo);
    await client.query(
      `INSERT INTO tasks (id,project_id,title,description,status,priority,assignee_user_id,due_date,metadata,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [task.id, projectId, task.title, task.description || null, task.status, task.priority || 'medium', assigneeUserId, task.dueDate || null,
       JSON.stringify({ ...taskMetadata(task), assignedTo: task.assignedTo || '' }), task.createdAt, task.createdAt]
    );
  }
}

export const postgresProjectRepository = new PostgresProjectRepository();
