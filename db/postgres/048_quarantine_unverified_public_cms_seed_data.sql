-- AMS PostgreSQL migration 048
-- Quarantine bundled sample portfolio and testimonial records until an editor verifies them.
-- This preserves records for review but prevents unverified claims from appearing publicly.
BEGIN;

UPDATE cms_projects
SET data = jsonb_set(COALESCE(data, '{}'::jsonb), '{isPublished}', 'false'::jsonb, true),
    updated_at = NOW()
WHERE id = ANY (ARRAY[
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
  'apex-global-low-latency-server-fleet'
]::text[])
  AND COALESCE(data->>'isPublished', '') = '';

UPDATE cms_testimonials
SET data = jsonb_set(COALESCE(data, '{}'::jsonb), '{isPublished}', 'false'::jsonb, true),
    updated_at = NOW()
WHERE id IN ('t_01', 't_02', 't_03', 't_04', 't_05', 't_06')
  AND (data->>'isPublished') IS DISTINCT FROM 'false';

UPDATE cms_services
SET data = jsonb_set(COALESCE(data, '{}'::jsonb), '{isPublished}', 'false'::jsonb, true),
    updated_at = NOW()
WHERE slug = 'mobile-app-design'
   OR id = 'seed_srv_mobile-app-design';

COMMIT;
