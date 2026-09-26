import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('accepted proposals freeze financial and linkage fields',async()=>{const s=await fs.readFile(path.join(root,'server/postgres-proposal-repository.ts'),'utf8');assert.match(s,/protectedFields=\['clientId','dealId','projectId','subtotal','discount','taxPercent','tax','total','currency','items'\]/);assert.match(s,/ACCEPTED_PROPOSAL_IMMUTABLE/);});
