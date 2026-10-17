import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Client detail distinguishes absent financial values from recorded zero', async () => {
  const clients = await read('src/pages/admin/AdminClients.tsx');

  assert.match(clients, /typeof selectedClient\.totalSpend === 'number' && Number\.isFinite\(selectedClient\.totalSpend\) \? formatAmount\(selectedClient\.totalSpend, currency\) : \(language === 'id' \? 'Belum tercatat' : 'Not recorded'\)/);
  assert.match(clients, /typeof selectedClient\.slaDailyAdSpendBudget === 'number' && Number\.isFinite\(selectedClient\.slaDailyAdSpendBudget\)/);
  assert.match(clients, /typeof selectedClient\.currentDailyAdSpend === 'number' && Number\.isFinite\(selectedClient\.currentDailyAdSpend\)/);
  assert.match(clients, /language === 'id' \? 'Belum dicatat' : 'Not recorded'/);
  assert.match(clients, /language === 'id' \? 'Belum ditetapkan' : 'Not configured'/);
  assert.doesNotMatch(clients, /formatAmount\(selectedClient\.currentDailyAdSpend \|\| 0, currency\)/);
  assert.doesNotMatch(clients, /formatAmount\(selectedClient\.slaDailyAdSpendBudget \|\| 0, currency\)/);
});
