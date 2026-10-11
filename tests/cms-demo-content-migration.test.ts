import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Temporary demo CMS migration republishes only existing AMS demo work and testimonials', async () => {
  const migration = await fs.readFile(path.join(root, 'db/postgres/051_publish_existing_demo_cms_content.sql'), 'utf8');
  const projectIds = [
    'bank-digital-nusantara-mobile',
    'siloam-care-telehealth-ui',
    'prism-ai-analytics-ui',
    'logistik-cepat-nusantara-driver-ui',
    'bursa-efek-nusantara-terminal-ui',
    'astra-motor-commercial-tvc',
    'ayana-bali-luxury-wedding-film',
    'java-heritage-coffee-documentary',
    'hyperion-electric-commercial',
    'qris-bi-fast-explainer-animation',
    'ruangedu-math-animated-curriculum',
    'vanguard-lottie-saas-kit',
    'wonderful-indonesia-eco-tourism-animation',
    'kalyana-bali-hospitality-branding',
    'danar-kencana-batik-heritage-rebrand',
    'titik-temu-coffee-brand-identity',
    'aethelgard-fine-jewelry-branding',
    'tokopedia-mega-promo-kinetic-motion',
    'glowskin-d2c-social-motion-kit',
    'mrt-jakarta-digital-signage-motion',
    'apex-esports-championship-broadcast',
    'telkom-akses-sustainability-report',
    'nusantara-venture-pitch-deck',
    'sinar-mas-land-property-lookbook',
    'lumina-esg-whitepaper-design',
    'senopati-penthouse-3d-architectural',
    'samudra-bali-villa-3d-showcase',
    'indorobotics-agv-3d-industrial',
    'kronos-chronograph-3d-webgl',
    'samudera-logistik-maritim-portal',
    'indorama-tekstil-corporate-website',
    'bumi-energi-terbarukan-portal',
    'adhi-rekayasa-konstruksi-portal',
    'vanguard-wealth-portal',
    'batik-keris-modern-ecommerce',
    'aura-skincare-headless-store',
    'jati-jepara-furniture-export-store',
    'kopi-kenangan-roastery-online',
    'aethelgard-luxury-jewelry-boutique',
    'midtrans-qris-merchant-dashboard',
    'medikapro-hospital-emr-saas',
    'tanimakmur-agritech-supply-chain',
    'hrnusantara-enterprise-payroll-saas',
    'syncra-collaborative-design-engine',
    'pabrik-cikarang-multiplant-erp',
    'kalla-property-crm-sales-pipeline',
    'omniretail-warehouse-pos-erp',
    'distribusi-farmasi-bpom-erp',
    'vanguard-global-asset-erp',
    'bank-mandiri-mitra-cloud-migration',
    'tokopedia-kubernetes-autoscaling-infra',
    'rs-pondok-indah-hybrid-cloud-infra',
    'telkomsel-partner-devops-cicd',
    'apex-global-low-latency-server-fleet',
  ];
  for (const id of projectIds) assert.ok(migration.includes("'" + id + "'"), 'Missing demo project: ' + id);
  assert.match(migration, /INSERT INTO cms_projects[\s\S]*?ON CONFLICT \(id\) DO UPDATE[\s\S]*?'\{isPublished\}', 'true'::jsonb/);
  assert.match(migration, /UPDATE cms_testimonials[\s\S]*?'\{isPublished\}', 'true'::jsonb/);
  for (const id of ['t_01', 't_02', 't_03', 't_04', 't_05', 't_06']) {
    assert.ok(migration.includes("'" + id + "'"), 'Missing demo testimonial: ' + id);
  }
  assert.match(migration, /ON CONFLICT \(id\) DO UPDATE/);\n  assert.match(migration, /INSERT INTO cms_projects/);
});
