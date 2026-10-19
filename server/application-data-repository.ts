import type { DatabaseSchema } from './db.ts';
import { getDatabase } from './db.ts';
import { getDataSourceMode } from './data-source.ts';
import { PostgresDatabaseRepository } from './postgres-database-repository.ts';

export interface ApplicationDatabaseRepository {
  loadDatabase(): Promise<DatabaseSchema>;
}

class JsonApplicationDatabaseRepository implements ApplicationDatabaseRepository {
  async loadDatabase(): Promise<DatabaseSchema> {
    return getDatabase();
  }
}

const jsonRepository = new JsonApplicationDatabaseRepository();
const postgresRepository = new PostgresDatabaseRepository();

export function getApplicationDatabaseRepository(): ApplicationDatabaseRepository {
  return getDataSourceMode() === 'postgres' ? postgresRepository : jsonRepository;
}

export async function loadApplicationDatabase(): Promise<DatabaseSchema> {
  return getApplicationDatabaseRepository().loadDatabase();
}
