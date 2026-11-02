import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createSharedUiInventory, exactDuplicateRules } from '../scripts/audit-shared-ui.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventory = createSharedUiInventory(root);

test('Shared UI inventory is regenerated from actual source and all shipped component files have consumers', () => {
  const saved = JSON.parse(fs.readFileSync(path.join(root,'docs/ui/shared-ui-inventory.json'),'utf8'));
  assert.deepEqual(saved,inventory,'Run npm run ui:audit and review the consumer/coverage diff.');
  assert.deepEqual(inventory.unresolvedDynamicImports,[],'A dynamic import needs explicit audit support before assuming reachability.');
  assert.deepEqual(inventory.components.filter(item=>!item.reachable),[],'Do not ship unconsumed UI or a second unused legacy implementation.');
  assert.ok(inventory.components.some(item=>item.file.endsWith('/DashboardControls.tsx') && item.consumers.length>1));
  assert.ok(inventory.components.some(item=>item.file.endsWith('/AdminFilterToolbar.tsx') && item.consumers.length>1));
});

test('Exact CSS cleanup keeps the last complete copy and never merges different states or conditions', () => {
  const css = '.x{color:red}.x{color:blue}.x{color:red}.x{color:red!important}@media(max-width:600px){.x{color:red}}@supports(display:grid){.x{color:red}}';
  const {ast,duplicates} = exactDuplicateRules(css);
  assert.equal(duplicates.length,1);
  assert.equal(duplicates[0].source?.start?.column,1);
  duplicates.forEach(rule=>rule.remove());
  const result = ast.toString();
  assert.ok(result.startsWith('.x{color:blue}.x{color:red}.x{color:red!important}'));
  assert.ok(result.includes('@media(max-width:600px){.x{color:red}}'));
  assert.ok(result.includes('@supports(display:grid){.x{color:red}}'));
  assert.equal(exactDuplicateRules('.x{display:block;display:grid}.x{display:grid}').duplicates.length,0,'Keep fallback sequences.');
  assert.equal(exactDuplicateRules('@layer a{.x{color:red}.x{color:red}}@keyframes spin{0%{opacity:0}0%{opacity:0}}').duplicates.length,0,'Layer/keyframe cleanup requires separate review.');
});

test('Shipped stylesheets have no exact duplicate complete rules after the approved cleanup', () => {
  assert.deepEqual(inventory.stylesheets.filter(item=>item.exactDuplicateRules>0),[]);
});

test('Inventory is identical for Windows CRLF and CI LF checkouts', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(),'ams-ui-inventory-'));
  try {
    fs.mkdirSync(path.join(temporary,'src/components/ui'),{recursive:true});
    fs.writeFileSync(path.join(temporary,'tsconfig.json'),JSON.stringify({compilerOptions:{moduleResolution:'bundler',module:'esnext'}}));
    const sources = {
      'src/main.tsx': "import './components/ui/Fixture';\nexport {};\n",
      'src/components/ui/Fixture.tsx': "import './Fixture.css';\nexport const Fixture = () => null;\n",
      'src/components/ui/Fixture.css': '.fixture {\n  color: var(--text);\n}\n',
    };
    for (const [file,text] of Object.entries(sources)) fs.writeFileSync(path.join(temporary,file),text);
    const lf = createSharedUiInventory(temporary);
    for (const [file,text] of Object.entries(sources)) fs.writeFileSync(path.join(temporary,file),text.replace(/\n/g,'\r\n'));
    assert.deepEqual(createSharedUiInventory(temporary),lf);
  } finally {
    assert.equal(path.dirname(path.resolve(temporary)),path.resolve(os.tmpdir()));
    assert.ok(path.basename(temporary).startsWith('ams-ui-inventory-'));
    fs.rmSync(temporary,{recursive:true,force:true});
  }
});

test('Removed decorative dependency and unused UI do not remove CRM APIs or compatibility route', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.equal(pkg.dependencies.ogl,undefined);
  const app = fs.readFileSync(path.join(root,'src/App.tsx'),'utf8');
  assert.match(app,/path="clients\/lead-accounts" element=\{<Navigate to="\/admin\/clients\/all-clients" replace/);
  assert.ok(fs.existsSync(path.join(root,'src/lib/crmStore.ts')));
  const client = fs.readFileSync(path.join(root,'src/lib/apiClient.ts'),'utf8');
  assert.ok(client.includes('convertWonDeal:'));
  assert.ok(client.includes('productionReadiness:'));
});
