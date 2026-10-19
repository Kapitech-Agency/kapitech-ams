import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (file: string) => fs.readFileSync(file, 'utf8');

test('Services editor supports edit and preserves rich service fields not shown in the form', () => {
  const page = read('src/pages/admin/AdminCmsServices.tsx');

  assert.ok(page.includes('const openServiceEditor = (service?: CmsServiceRecord)'));
  assert.ok(page.includes('onSubmit={handleSaveService}'));
  assert.ok(page.includes('await api.cms.updateService(editingService.id, payload)'));
  assert.ok(page.includes('const saved = normalizeCmsService(response.data?.service || payload)'));
  assert.ok(page.includes('...editingService'));
  assert.ok(page.includes('capabilities: tempCapabilities.map((item) => ({ ...item }))'));
  assert.ok(page.includes('metrics: []'));
  assert.ok(page.includes('businessOutcomes: { heading: \'\', headingId: \'\', benefits: [], benefitsId: [] }'));
});

test('Service publish status is explicit and visible in the CMS directory', () => {
  const page = read('src/pages/admin/AdminCmsServices.tsx');
  const routes = read('server/routes.ts');

  assert.ok(page.includes('const [newIsPublished, setNewIsPublished] = useState(false)'));
  assert.ok(page.includes('checked={newIsPublished}'));
  assert.ok(page.includes('await api.cms.updateService(service.id, { isPublished: nextPublished })'));
  assert.ok(page.includes("item.isPublished === true ? 'Published' : 'Draft'"));
  assert.ok(page.includes('onClick={() => void handleTogglePublished(item)}'));
  assert.ok(routes.includes('isPublished: item.isPublished === true'));
  assert.match(routes, /source\.filter\(\(item: any\) =>\s*item\.isPublished === true/);
});

test('Service CRUD uses CMS record IDs, not public slugs, for update and deletion', () => {
  const page = read('src/pages/admin/AdminCmsServices.tsx');
  const routes = read('server/routes.ts');

  assert.ok(page.includes('await api.cms.updateService(editingService.id, payload)'));
  assert.ok(page.includes('await api.cms.deleteService(target.id)'));
  assert.ok(page.includes('if (!service.id)'));
  assert.ok(page.includes('current.filter((item) => item.id !== target.id)'));
  assert.ok(routes.includes("apiRouter.delete('/cms/services/:id'"));
  assert.ok(routes.includes("String(service?.id || '') === id"));
});

test('Service routes validate titles/categories and resolve unique canonical slugs', () => {
  const routes = read('server/routes.ts');
  const helper = routes.slice(routes.indexOf('async function resolveCmsServiceSlug'), routes.indexOf('function getInvoicePaidAmount'));
  const create = routes.slice(routes.indexOf("apiRouter.post('/cms/services'"), routes.indexOf("apiRouter.put('/cms/services/:id'"));
  const update = routes.slice(routes.indexOf("apiRouter.put('/cms/services/:id'"), routes.indexOf("apiRouter.delete('/cms/services/:id'"));

  assert.ok(helper.includes("postgresCmsRepository.list('service')"));
  assert.ok(helper.includes('const used = new Set'));
  assert.ok(helper.includes('while (used.has(slug))'));
  assert.ok(create.includes("const title = cleanText(item.title, 200)"));
  assert.ok(create.includes("Service title is required."));
  assert.ok(create.includes('const slug = await resolveCmsServiceSlug(item.slug, title)'));
  assert.ok(create.includes("isPublished: item.isPublished === true"));
  assert.ok(update.includes('patch.isPublished = patch.isPublished === true'));
  assert.ok(update.includes('patch.slug = slug'));
});
