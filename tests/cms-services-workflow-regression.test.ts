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
  assert.ok(page.includes('CMS status saved as Published. Verify the public Services page to confirm visibility.'));
  assert.ok(page.includes('CMS status saved as Draft. Verify the public Services page to confirm the service is no longer visible.'));
  assert.doesNotMatch(page, /Service published successfully\.|Service unpublished and hidden from the public website\.|Service saved and published\./,
    'The UI confirms the CMS flag was saved, not that the public site was independently verified.');
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

test('Services directory filters the saved publication state and resets every filter scope', () => {
  const page = read('src/pages/admin/AdminCmsServices.tsx');
  const header = page.indexOf('<AdminModuleHeader slug="cms-services-header"');
  const filters = page.indexOf('slug="cms-services-filters"');
  const publicationFilter = page.indexOf('slug="cms-services-publication-filter"');
  const notice = page.indexOf('{statusMessage && (', header);
  const register = page.indexOf('slug="cms-services-directory"');

  assert.ok(header >= 0 && filters > header && publicationFilter > filters && notice > filters && register > notice,
    'Publication state filtering must stay with the search/category filters before the service register.');
  assert.match(page, /publicationFilter === 'all' \|\|\s*\(publicationFilter === 'published' \? service\.isPublished === true : service\.isPublished !== true\)/);
  assert.match(page, /setPublicationFilter\('all'\)/);
  assert.match(page, /disabled=\{!searchQuery && selectedCategory === 'All' && publicationFilter === 'all'\}/);
  assert.match(page, /Manage service content, categories, capabilities, and saved publication state for the public/);
  assert.match(page, /CMS status saved as Published\. Verify the public Services page to confirm visibility\./);
  assert.match(page, /CMS status saved as Draft\. Verify the public Services page to confirm the service is no longer visible\./);
});
