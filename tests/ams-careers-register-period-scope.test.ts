import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Careers Jobs and Applicants remain complete registers outside global reporting-period scope', async () => {
  const source = await read('src/pages/admin/AdminCmsCareers.tsx');
  assert.doesNotMatch(source, /useReportingPeriod|matchesDate|reportPeriodValue|reportPeriodEnabled/,
    'Career registers must not silently hide records when the global report period is active.');
  assert.ok(source.includes("return matchesStatus && (!q || fields.some(value => String(value || '').toLowerCase().includes(q)));"));
  assert.ok(source.includes('}, [positions, jobSearch, jobStatusFilter]);'));
  assert.ok(source.includes('}, [applicants, applicantSearch, applicantStatusFilter]);'));
  assert.ok(source.includes('setJobsPage(1); }, [jobSearch, jobStatusFilter, jobsPageSize]);'));
  assert.ok(source.includes('setApplicantsPage(1); }, [applicantSearch, applicantStatusFilter, applicantsPageSize]);'));
});

test('Careers preserves role-aware tabs and unavailable recruitment-history boundary', async () => {
  const source = await read('src/pages/admin/AdminCmsCareers.tsx');
  assert.ok(source.includes("canAccessAmsRoute(role, '/admin/cms/careers')"));
  assert.ok(source.includes("available: false"));
  assert.ok(source.includes("if (activeTab === 'applicants') void loadApplicants();"));
  assert.ok(source.includes("(result.data.leads as Applicant[]).filter(item => (item as any).type === 'career')"));
});
