import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const read=(p:string)=>fs.readFileSync(p,'utf8');
test('operational time-log deletion is ownership restricted',()=>{
 const s=read('server/routes.ts');
 assert.match(s,/const canManageAllTimeLogs = Boolean\(req\.user!\.permissions\?\.canManageProjects\)/);
 assert.match(s,/existing\.userId \|\| ''\) !== String\(req\.user!\.id\)/);
 assert.match(s,/You can only delete your own time entries\./);
});
