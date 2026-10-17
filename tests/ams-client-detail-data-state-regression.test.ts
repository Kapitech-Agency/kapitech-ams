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
  assert.match(clients, /const getClientSlaState = \(client: AgencyClient\): Exclude<SlaFilter, 'all'> =>/);
  assert.match(clients, /if \(typeof spend !== 'number' \|\| !Number\.isFinite\(spend\)\) return 'spend-not-recorded';/);
  assert.match(clients, /value={slaFilter}/);
  assert.match(clients, /value: 'spend-not-recorded', label: language === 'id' \? 'Belanja belum tercatat' : 'Spend not recorded'/);
  assert.match(clients, /const recorded = configured\.filter\(\(\{ state \}\) => state !== 'spend-not-recorded'\);/);
  assert.match(clients, /slaCompliance: recorded\.length \? Math\.round\(\(healthy \/ recorded\.length\) \* 1000\) \/ 10 : null/);
  assert.match(clients, /clientMetrics\.recordedSla/);
  assert.match(clients, /const hasCompleteBilledData = clients\.length > 0 && clients\.every/);
  assert.match(clients, /totalBilled: hasCompleteBilledData \? clients\.reduce\(\(sum, client\) => sum \+ client\.totalSpend, 0\) : null/);
  assert.match(clients, /if \(billedA === null && billedB !== null\) return 1;/);
  assert.match(clients, /if \(billedA !== null && billedB === null\) return -1;/);
  assert.match(clients, /clientMetrics\.totalBilled === null \? '—'/);
  assert.match(clients, /clientMetrics\.missingSlaSpend === 0 \? 'text-success' : 'text-fg'/);
  assert.match(clients, /client\.slaDailyAdSpendBudget \?\? ''/);
  assert.match(clients, /client\.currentDailyAdSpend \?\? ''/);
});
