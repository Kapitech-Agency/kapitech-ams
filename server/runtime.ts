import path from 'node:path';

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production'
    || path.basename(process.argv[1] || '') === 'server.cjs';
}
