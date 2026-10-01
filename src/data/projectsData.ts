export interface ProjectItem {
  id: string;
  slug: string;
  title: string;
  client: string;
  industry: string;
  pillar: 'Visual Experience' | 'Innovation Development';
  service:
    | 'UI/UX Design'
    | 'Video Production'
    | '2D Animation'
    | 'Branding & Identity'
    | 'Motion & Graphic Design'
    | 'Creative Design'
    | '3D Visualization'
    | 'Company Profile Website'
    | 'E-Commerce Website'
    | 'Web Application'
    | 'ERP / CRM System'
    | 'IT Support & Infrastructure';
  featured: boolean;
  image: string;
  desc: string;
  descId: string;
  challenge: string;
  challengeId: string;
  solution: string;
  solutionId: string;
  deliverables: string[];
  technologies: string[];
  impact: { label: string; value: string }[];
  year: string;
}

export const allProjects: ProjectItem[] = [
  // ==========================================
  // 1. UI/UX Design (Visual Experience) - 5 projects
  // ==========================================
  {
    id: 'bank-digital-nusantara-mobile',
    title: 'Bank Digital Nusantara Mobile Banking',
    client: 'PT Bank Digital Nusantara',
    industry: 'FinTech & Perbankan Indonesia',
    pillar: 'Visual Experience',
    service: 'UI/UX Design',
    featured: true,
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1200',
    desc: 'Next-generation Indonesian mobile banking application crafted for instant BI-FAST transfers, QRIS payments, automated deposit vaults, and spending analytics.',
    descId: 'Aplikasi mobile banking Indonesia generasi baru dengan transfer instan BI-FAST, pembayaran QRIS, tabungan deposito otomatis, dan analitik pengeluaran real-time.',
    challenge: 'Legacy banking interfaces created high drop-offs during customer onboarding and daily P2P QRIS transaction verifications.',
    challengeId: 'Antarmuka perbankan lama menyebabkan tingginya pembatalan saat registrasi nasabah dan verifikasi transaksi QRIS harian.',
    solution: 'Engineered an ultra-accessible biometric onboarding flow, modular quick-transfer widgets, and light/dark theme design systems in Figma.',
    solutionId: 'Merancang alur onboarding biometrik cepat, widget transfer kilat modular, dan sistem desain Figma yang siap diimplementasikan developer.',
    deliverables: ['Mobile Design System (Figma)', 'BI-FAST & QRIS User Flows', 'Interactive Prototyping', 'Design Tokens & Handoff'],
    technologies: ['Figma', 'FigJam', 'React Native', 'Design Tokens'],
    impact: [
      { label: 'Onboarding Rate', value: '96.4%' },
      { label: 'Daily QRIS Volume', value: '320K+' },
      { label: 'App Store Rating', value: '4.9/5' }
    ],
    year: '2024'
  },
  {
    id: 'siloam-care-telehealth-ui',
    title: 'Siloam Digital Care Telemedicine App',
    client: 'PT Siloam Digital Care Indonesia',
    industry: 'Healthcare & MedTech Indonesia',
    pillar: 'Visual Experience',
    service: 'UI/UX Design',
    featured: false,
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200',
    desc: 'Inclusive UI/UX architecture for digital doctor consultations, BPJS integration, encrypted e-prescriptions, and hospital appointment booking across Indonesia.',
    descId: 'Arsitektur UI/UX inklusif untuk telekonsultasi dokter digital, integrasi rujukan, resep elektronik terenkripsi, dan booking RS di seluruh Indonesia.',
    challenge: 'Patients of varying digital literacy across Indonesian cities found medical appointment booking confusing under emergency stress.',
    challengeId: 'Pasien dari berbagai tingkat literasi digital di kota-kota Indonesia merasa alur pemesanan dokter membingungkan saat kondisi mendesak.',
    solution: 'Designed a high-contrast WCAG 2.1 AAA interface with 3-step triage booking, prescription tracking, and direct consultation rooms.',
    solutionId: 'Membangun antarmuka WCAG 2.1 AAA dengan 3 langkah booking terpandu, pelacakan obat tebus, dan ruang video konsultasi dokter.',
    deliverables: ['Accessible Mobile UI/UX', 'Patient & Doctor Journey Maps', 'Micro-interactions', 'Figma Component Library'],
    technologies: ['Figma', 'Tailwind UI', 'Miro', 'Spline'],
    impact: [
      { label: 'Consultation Drop-off', value: '-65%' },
      { label: 'User Satisfaction', value: '98.2%' },
      { label: 'Booking Time', value: '40s' }
    ],
    year: '2024'
  },
  {
    id: 'prism-ai-analytics-ui',
    title: 'Prism AI Enterprise Workflow Studio',
    client: 'Prism Intelligence',
    industry: 'Enterprise AI SaaS Global',
    pillar: 'Visual Experience',
    service: 'UI/UX Design',
    featured: false,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
    desc: 'High-density canvas interface for building multi-step generative AI pipelines, automated prompt chains, and dataset transformation graphs.',
    descId: 'Antarmuka kanvas berdensitas tinggi untuk membangun alur kerja pipeline generative AI multi-langkah dan transformasi dataset.',
    challenge: 'Enterprise data scientists struggled with complex node-graph configurations and visualization clutter.',
    challengeId: 'Data scientist enterprise kesulitan mengelola alur node-graph yang kompleks dan kelebihan beban visual.',
    solution: 'Created an infinite node-graph editor with contextual inspector panels, real-time debugging indicators, and dark-mode optimization.',
    solutionId: 'Membuat editor node-graph tanpa batas dengan panel inspektur kontekstual dan indikator visual debugging real-time.',
    deliverables: ['Node Editor Canvas UI', 'Dark Luxury Theme Design', 'Component Library', 'Design System Spec'],
    technologies: ['Figma', 'React Flow', 'Tailwind CSS', 'TypeScript'],
    impact: [
      { label: 'Workflow Setup Time', value: '-70%' },
      { label: 'Enterprise Retention', value: '99%' },
      { label: 'Weekly Active Nodes', value: '1.2M+' }
    ],
    year: '2024'
  },
  {
    id: 'logistik-cepat-nusantara-driver-ui',
    title: 'Logistik Cepat Nusantara Fleet Driver App',
    client: 'PT Logistik Cepat Nusantara',
    industry: 'Logistics & Supply Chain Indonesia',
    pillar: 'Visual Experience',
    service: 'UI/UX Design',
    featured: false,
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200',
    desc: 'High-visibility Android driver UI tailored for courier delivery fleets operating across Greater Jakarta and inter-city Java logistics corridors.',
    descId: 'UI Android visibilitas tinggi untuk kurir armada logistik di Jabodetabek dan jalur distribusi lintas kota Jawa.',
    challenge: 'Couriers experienced high error rates when verifying multi-parcel barcodes and digital proof-of-delivery signatures in direct sunlight.',
    challengeId: 'Kurir sering mengalami kesalahan pemindaian multi-resi dan tanda tangan digital bukti terima paket di bawah terik matahari.',
    solution: 'Engineered high-contrast typography, large touch zones for gloved hands, instant offline caching, and acoustic scan confirmations.',
    solutionId: 'Merancang tipografi kontras tinggi, tombol aksi besar yang ramah sentuhan, mode offline instan, dan konfirmasi audio saat scan resi.',
    deliverables: ['Mobile Driver App UI', 'Outdoor UX Field Testing', 'Design Tokens', 'Figma Interactive Specs'],
    technologies: ['Figma', 'Android Jetpack Compose Guidelines', 'Material Design 3'],
    impact: [
      { label: 'Delivery Turnaround', value: '+38%' },
      { label: 'Signature Errors', value: '-88%' },
      { label: 'Courier Rating', value: '4.9/5' }
    ],
    year: '2023'
  },
  {
    id: 'bursa-efek-nusantara-terminal-ui',
    title: 'Nusantara Capital Pro Trading Terminal',
    client: 'PT Nusantara Capital Sekuritas',
    industry: 'Finansial & Pasar Modal Indonesia',
    pillar: 'Visual Experience',
    service: 'UI/UX Design',
    featured: false,
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1200',
    desc: 'Ultra-fast institutional stock and bond trading interface connected to Indonesia Stock Exchange (IDX) data feeds and algorithmic order routing.',
    descId: 'Antarmuka trading saham dan obligasi institusional yang terhubung langsung ke data feed Bursa Efek Indonesia (BEI) dengan eksekusi kilat.',
    challenge: 'Institutional traders needed to monitor dozens of IDX tickers simultaneously without eye fatigue or order lag.',
    challengeId: 'Trader institusional perlu memantau puluhan saham BEI secara bersamaan tanpa kelelahan mata atau keterlambatan order.',
    solution: 'Designed a high-density modular trading workspace with dark theme calibration, customizable shortcut macros, and depth-of-market heatmaps.',
    solutionId: 'Membangun workstation trading modular dengan kalibrasi tema gelap, tombol shortcut kustom, dan heatmap kedalaman pasar.',
    deliverables: ['Desktop Trading UI', 'Component Library', 'Design Tokens', 'UX Micro-interactions'],
    technologies: ['Figma', 'Tailwind CSS', 'Electron UX', 'Design Tokens'],
    impact: [
      { label: 'Order Execution Speed', value: '<5ms' },
      { label: 'Daily Trading Volume', value: 'Rp 450B+' },
      { label: 'Trader Retention', value: '99.4%' }
    ],
    year: '2024'
  },

  // ==========================================
  // 2. Video Production (Visual Experience) - 4 projects
  // ==========================================
  {
    id: 'astra-motor-commercial-tvc',
    title: 'Astra Otomotif Commercial TVC Campaign',
    client: 'PT Astra Otomotif Indonesia',
    industry: 'Otomotif & Komersial TVC Indonesia',
    pillar: 'Visual Experience',
    service: 'Video Production',
    featured: true,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1200',
    desc: 'High-octane commercial TVC and national digital launch campaign shot on ARRI Alexa across Jakarta skyscrapers and coastal highways.',
    descId: 'Kampanye iklan komersial TVC nasional yang diproduksi dengan kamera bioskop ARRI Alexa di lanskap Jakarta dan jalur pesisir.',
    challenge: 'Client required a cinematic, premium visual tone that bridged futuristic urban performance with Indonesian family reliability.',
    challengeId: 'Klien membutuhkan tone visual sinematik premium yang memadukan performa modern dengan keandalan kendaraan keluarga Indonesia.',
    solution: 'Delivered full end-to-end production: concept storyboarding, aerial drone cinematography, custom orchestral scoring, and DaVinci color grading.',
    solutionId: 'Memproduksi seluruh siklus: storyboard kreatif, sinematografi drone udara, scoring musik orkestra, dan grading warna DaVinci.',
    deliverables: ['60s Main TVC Broadcast Cut', '15s Social Ads', 'Behind-the-scenes Reel', 'Master Cinema 4K DCP'],
    technologies: ['ARRI Alexa Mini LF', 'DaVinci Resolve Studio', 'Pro Tools', 'After Effects'],
    impact: [
      { label: 'Campaign Views', value: '14.2M+' },
      { label: 'Pre-order Boost', value: '+210%' },
      { label: 'Brand Recall', value: '88%' }
    ],
    year: '2024'
  },
  {
    id: 'ayana-bali-luxury-wedding-film',
    title: 'The Royal Ayana Estate Bali Wedding Film',
    client: 'Ayana Estate & Wedding Destination',
    industry: 'Hospitality & Luxury Wedding Bali',
    pillar: 'Visual Experience',
    service: 'Video Production',
    featured: false,
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200',
    desc: 'Cinematic destination wedding film capturing high-society celebrations, traditional Balinese blessings, and cliffside sunset receptions in Jimbaran, Bali.',
    descId: 'Film pernikahan destinasi mewah yang mengabadikan prosesi adat Bali, pemberkatan sakral, dan resepsi matahari terbenam di tebing Jimbaran Bali.',
    challenge: 'High dynamic range lighting shifts between scorching outdoor tropical sunlight and dim candlelit cliffside dinners.',
    challengeId: 'Perubahan pencahayaan ekstrem antara terik matahari tropis luar ruangan dan suasana malam tebing dengan lilin temaram.',
    solution: 'Deployed dual Sony FX6 cinema rigs with fast prime lenses, precision gimbal stabilization, and acoustic lavalier mastering.',
    solutionId: 'Menggunakan kamera sinema Sony FX6 ganda dengan lensa prime cepat, stabilisasi gimbal presisi, dan mastering audio suara jernih.',
    deliverables: ['12-Minute Cinematic Featurette', '60s Instagram Highlight', 'Full Ceremony 4K Master', 'Color-graded RAW Stills'],
    technologies: ['Sony FX6 Cinema Line', 'G-Master Primes', 'DaVinci Resolve', 'DJI Ronin 4D'],
    impact: [
      { label: 'Client Satisfaction', value: '100%' },
      { label: 'Organic Shares', value: '85K+' },
      { label: 'Destination Inquiries', value: '+140%' }
    ],
    year: '2024'
  },
  {
    id: 'java-heritage-coffee-documentary',
    title: 'Java Heritage Coffee Roasters Documentary',
    client: 'PT Java Heritage Roasters',
    industry: 'F&B & Kopi Nusantara Indonesia',
    pillar: 'Visual Experience',
    service: 'Video Production',
    featured: false,
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=1200',
    desc: 'Inspiring documentary series celebrating single-origin coffee farmers in Garut and Ciwidey, West Java, tracing bean cultivation to modern specialty cafes.',
    descId: 'Serial dokumenter brand yang mengangkat kisah petani kopi single-origin di Garut dan Ciwidey Jawa Barat hingga ke cangkir specialty cafe modern.',
    challenge: 'Remote mountain farm terrains required compact, rugged cinema rigs capable of capturing authentic human emotion and macro bean details.',
    challengeId: 'Medan perkebunan pegunungan terpencil membutuhkan perangkat kamera ringkas yang tangguh untuk menangkap detail makro biji kopi.',
    solution: 'Shot documentary-style handheld footage with natural atmospheric light, macro probe lenses, and intimate local farmer interviews.',
    solutionId: 'Mengambil visual dokumenter artistik dengan pencahayaan alami, lensa makro probe, dan wawancara intim bersama petani lokal.',
    deliverables: ['3-Episode Documentary Series', 'Brand Manifesto Video', 'Social Cutdowns', 'Digital Billboard Cuts'],
    technologies: ['RED Komodo 6K', 'Canon Cinema Primes', 'Adobe Premiere Pro', 'Sound Design Suite'],
    impact: [
      { label: 'Brand Trust Index', value: '94%' },
      { label: 'Export Inquiries', value: '+75%' },
      { label: 'YouTube Watch Time', value: '8.4 Min Avg' }
    ],
    year: '2023'
  },
  {
    id: 'hyperion-electric-commercial',
    title: 'Hyperion GT Electric Supercar Global Launch',
    client: 'Hyperion Automotive',
    industry: 'Automotive & CleanTech Global',
    pillar: 'Visual Experience',
    service: 'Video Production',
    featured: false,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200',
    desc: 'High-speed race track cinema production demonstrating torque acceleration, aerodynamic telemetry, and carbon fiber craftsmanship.',
    descId: 'Produksi film komersial sirkuit berkecepatan tinggi yang menampilkan akselerasi torsi instan dan aerodinamika mobil listrik sport.',
    challenge: 'Capturing 280 km/h straightaway speeds with crisp focus and cinematic motion blur.',
    challengeId: 'Menangkap kecepatan mobil 280 km/h dengan fokus tajam dan efek motion blur sinematik.',
    solution: 'Used Russian Arm pursuit chase vehicles, high-speed Phantom Flex 4K cameras, and photorealistic CGI speed trails.',
    solutionId: 'Menggunakan kendaraan kejar Russian Arm, kamera Phantom Flex 4K berkecepatan tinggi, dan efek visual CGI terintegrasi.',
    deliverables: ['Global Launch Film', 'TV Spot 30s', 'Soundtrack LP Master', 'Digital Showcase'],
    technologies: ['Phantom Flex 4K', 'ARRI Ultra Primes', 'DaVinci Resolve', 'CGI Integration'],
    impact: [
      { label: 'Global Video Views', value: '28M+' },
      { label: 'Sold Out Allocations', value: '100%' },
      { label: 'Award', value: 'Cannes Lions Shortlist' }
    ],
    year: '2024'
  },

  // ==========================================
  // 3. 2D Animation (Visual Experience) - 4 projects
  // ==========================================
  {
    id: 'qris-bi-fast-explainer-animation',
    title: 'Asosiasi Sistem Pembayaran QRIS Explainer Series',
    client: 'Asosiasi Sistem Pembayaran Indonesia (ASPI)',
    industry: 'FinTech & Edukasi Finansial Indonesia',
    pillar: 'Visual Experience',
    service: '2D Animation',
    featured: false,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200',
    desc: 'Dynamic, colorful 2D animated motion explainer series educating MSMEs (UMKM) on QRIS Cross-Border and BI-FAST settlement security.',
    descId: 'Serial animasi 2D edukatif yang menjelaskan kemudahan transaksi QRIS Antarnegara dan keamanan kliring instan BI-FAST bagi pelaku UMKM.',
    challenge: 'Complex banking clearing mechanics needed to be translated into friendly, jargon-free visual metaphors for everyday merchants.',
    challengeId: 'Mekanisme kliring perbankan yang rumit perlu disederhanakan menjadi visual metafora yang mudah dipahami pedagang UMKM.',
    solution: 'Designed charismatic Indonesian merchant character vectors, snappy kinetic typography, and fluid morphing transitions.',
    solutionId: 'Merancang karakter pedagang Indonesia yang ramah, tipografi kinetik dinamis, dan transisi animasi mulus tanpa henti.',
    deliverables: ['5 Explainer Video Episodes', 'Lottie App Animations', 'Social Sticker Pack', 'Vector Asset Library'],
    technologies: ['Adobe After Effects', 'Adobe Illustrator', 'Lottie / Bodymovin', 'Audition'],
    impact: [
      { label: 'UMKM Adoption Rate', value: '+82%' },
      { label: 'Average Retention', value: '91%' },
      { label: 'Total Views', value: '5.6M+' }
    ],
    year: '2024'
  },
  {
    id: 'ruangedu-math-animated-curriculum',
    title: 'RuangEdu Interactive Animated Math Series',
    client: 'PT RuangEdu Edukasi Digital',
    industry: 'EdTech & Animasi Edukasi Indonesia',
    pillar: 'Visual Experience',
    service: '2D Animation',
    featured: false,
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1200',
    desc: 'High-retention 2D animated learning episodes designed for elementary students across Indonesia to master algebra and geometry visually.',
    descId: 'Episode animasi 2D edukatif yang dirancang untuk siswa sekolah dasar di seluruh Indonesia agar memahami konsep matematika secara visual.',
    challenge: 'Abstract mathematical formulas caused intimidation and fast student drop-offs in standard video lessons.',
    challengeId: 'Rumus matematika abstrak sering membuat siswa cepat bosan dan meninggalkan materi belajar konvensional.',
    solution: 'Created an animated storyline with Indonesian mythical animal companions, visual pizza fraction graphs, and gamified problem reveals.',
    solutionId: 'Membangun alur cerita petualangan dengan maskot fauna nusantara, pecahan pizza visual, dan penyelesaian soal interaktif.',
    deliverables: ['24 Animated Curriculum Episodes', 'In-app Lottie Micro-interactions', 'Teacher Slide Deck Templates'],
    technologies: ['After Effects', 'Toon Boom Harmony', 'Illustrator', 'Lottie Files'],
    impact: [
      { label: 'Student Test Scores', value: '+45%' },
      { label: 'Lesson Completion', value: '94%' },
      { label: 'App Play Store Rating', value: '4.8/5' }
    ],
    year: '2023'
  },
  {
    id: 'vanguard-lottie-saas-kit',
    title: 'Vanguard SaaS Animated Lottie Asset Kit',
    client: 'Vanguard Cloud Inc',
    industry: 'Enterprise SaaS Global',
    pillar: 'Visual Experience',
    service: '2D Animation',
    featured: false,
    image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=1200',
    desc: 'Lightweight JSON Lottie micro-animations for cloud backup state indicators, success states, and live telemetry graphs.',
    descId: 'Animasi mikro Lottie JSON berukuran super ringan untuk status backup cloud, notifikasi sukses, dan indikator grafik live.',
    challenge: 'Heavy GIF animations slowed web app load times and consumed excessive mobile data.',
    challengeId: 'Animasi format GIF memperlambat waktu muat aplikasi dan memakan kuota data seluler berlebih.',
    solution: 'Exported vector JSON animations under 25KB each with 60fps buttery smooth vector scaling across devices.',
    solutionId: 'Mengekspor animasi vektor JSON di bawah 25KB dengan performa 60fps yang sangat halus di semua resolusi layar.',
    deliverables: ['40 Lottie JSON Animation Files', 'After Effects Source Files', 'React Integration Code Snippets'],
    technologies: ['After Effects', 'Bodymovin', 'LottieFiles', 'SVG / JSON'],
    impact: [
      { label: 'Asset Payload Size', value: '-85%' },
      { label: '60fps Rendering', value: '100%' },
      { label: 'User Delight Rating', value: '96%' }
    ],
    year: '2024'
  },
  {
    id: 'wonderful-indonesia-eco-tourism-animation',
    title: 'Wonderful Indonesia Eco-Tourism Campaign Motion',
    client: 'Kemenparekraf & Indonesia Tourism Board',
    industry: 'Pariwisata & Kebudayaan Indonesia',
    pillar: 'Visual Experience',
    service: '2D Animation',
    featured: false,
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1200',
    desc: 'Lush 2D animated visual celebration highlighting conservation initiatives in Raja Ampat, Komodo Island, and Mount Bromo.',
    descId: 'Karya animasi 2D memukau yang mempromosikan pariwisata berkelanjutan di Raja Ampat, Taman Nasional Komodo, dan Gunung Bromo.',
    challenge: 'Engaging both international travelers and domestic youths on eco-conscious travel habits without preachy tones.',
    challengeId: 'Menarik minat wisatawan mancanegara dan generasi muda Indonesia untuk berwisata ramah lingkungan tanpa kesan menggurui.',
    solution: 'Crafted breathtaking hand-drawn vector scenery, fluid camera transitions, and traditional gamelan-modern fusion soundtrack.',
    solutionId: 'Membuat latar visual vektor lukisan tangan, transisi kamera dinamis, dan perpaduan musik gamelan dengan aransemen modern.',
    deliverables: ['90s Main Animation Film', 'Global Embassy Screening DCP', 'Instagram Reel Variations', 'Print Posters'],
    technologies: ['Adobe After Effects', 'Photoshop Painting', 'Adobe Illustrator', 'Dolby Atmos Mastering'],
    impact: [
      { label: 'International Reach', value: '8.2M+' },
      { label: 'Engagement Rate', value: '12.4%' },
      { label: 'Official Endorsement', value: 'Kemenparekraf RI' }
    ],
    year: '2024'
  },

  // ==========================================
  // 4. Branding & Identity (Visual Experience) - 4 projects
  // ==========================================
  {
    id: 'kalyana-bali-hospitality-branding',
    title: 'Kalyana Sanctuary Resorts & Spa Brand Identity',
    client: 'Kalyana Hospitality Group Bali',
    industry: 'Hospitality & Luxury Wellness Bali',
    pillar: 'Visual Experience',
    service: 'Branding & Identity',
    featured: true,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1200',
    desc: 'Holistic luxury identity system blending ancient Balinese Tri Hita Karana philosophy with minimalist modern Scandinavian elegance.',
    descId: 'Sistem identitas brand resor mewah yang memadukan filosofi kearifan lokal Bali Tri Hita Karana dengan estetika minimalis modern.',
    challenge: 'Standing out in the ultra-competitive Bali luxury hospitality landscape while honoring indigenous cultural motifs respectfully.',
    challengeId: 'Tampil menonjol di antara resor mewah Bali sekaligus menghormati ornamen budaya lokal secara otentik.',
    solution: 'Developed custom hand-drawn typography, gold foil stationery guidelines, earth-toned color palettes, and sensorial guest amenities packaging.',
    solutionId: 'Merancang tipografi kustom, pedoman cetak foil emas, palet warna bernuansa alam Bali, dan kemasan produk spa eksklusif.',
    deliverables: ['Comprehensive Brandbook (120 Pages)', 'Logo Architecture & Monograms', 'Guest Collateral & Amenities Kit', 'Signage Typography'],
    technologies: ['Adobe Illustrator', 'InDesign', 'Figma', 'Custom Font Foundry'],
    impact: [
      { label: 'Direct Booking Lift', value: '+165%' },
      { label: 'ADR (Avg Daily Rate)', value: '+40%' },
      { label: 'Press Features', value: 'Vogue & Conde Nast' }
    ],
    year: '2024'
  },
  {
    id: 'danar-kencana-batik-heritage-rebrand',
    title: 'Batik Danar Kencana Modern Heritage Rebranding',
    client: 'PT Danar Kencana Batik Indonesia',
    industry: 'Fashion Heritage & Retail Indonesia',
    pillar: 'Visual Experience',
    service: 'Branding & Identity',
    featured: false,
    image: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=1200',
    desc: 'Strategic heritage rebranding transforming a 40-year-old Solo batik house into a contemporary luxury fashion label for modern professionals.',
    descId: 'Rebranding strategis yang mentransformasi rumah batik Solo berusia 40 tahun menjadi label busana mewah kontemporer untuk profesional muda.',
    challenge: 'Overcoming perceptions of batik as only traditional formal wear to appeal to younger urban demographics in Jakarta and overseas.',
    challengeId: 'Mengubah persepsi bahwa batik hanya pakaian formal konvensional agar digemari profesional muda di Jakarta dan pasar ekspor.',
    solution: 'Created an iconic geometric canting emblem, editorial lookbook systems, refined typography, and eco-friendly woven packaging tags.',
    solutionId: 'Menciptakan lambang geometris canting modern, tata letak lookbook editorial, tipografi elegan, dan tag pakaian ramah lingkungan.',
    deliverables: ['Brand Guidelines & Token Kit', 'Boutique Storefront Signage System', 'Packaging & Woven Garment Labels', 'E-commerce Identity Kit'],
    technologies: ['Adobe Illustrator', 'Adobe Photoshop', 'Figma', 'InDesign'],
    impact: [
      { label: 'Younger Demographic Sales', value: '+190%' },
      { label: 'Boutique Foot Traffic', value: '+65%' },
      { label: 'International Export', value: '4 Countries' }
    ],
    year: '2023'
  },
  {
    id: 'titik-temu-coffee-brand-identity',
    title: 'Kopi Titik Temu Franchise Identity System',
    client: 'PT Titik Temu Retail Group',
    industry: 'F&B & Coffee Franchise Indonesia',
    pillar: 'Visual Experience',
    service: 'Branding & Identity',
    featured: false,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1200',
    desc: 'Scalable brand identity architecture, cup packaging, and interior environmental graphics for an Indonesian specialty coffee franchise expanding across 20+ cities.',
    descId: 'Arsitektur identitas brand, kemasan cup kopi, dan grafis interior kafe untuk jaringan franchise specialty coffee di 20+ kota Indonesia.',
    challenge: 'Maintaining razor-sharp visual consistency across dozens of franchised store formats from grab-and-go kiosks to flagship duplex cafes.',
    challengeId: 'Menjaga konsistensi visual di puluhan format outlet franchise mulai dari booth cepat saji hingga kafe flagship dua lantai.',
    solution: 'Designed a modular identity system with standardized neon signage specs, recyclable cup art, barista apparel, and a franchise brandbook.',
    solutionId: 'Merancang sistem modular dengan panduan neon sign, cup daur ulang, seragam barista, dan brandbook panduan franchise.',
    deliverables: ['Franchise Brandbook Manual', 'Packaging Suite (Hot/Cold Cups, Bean Bags)', 'Environmental Graphics & Neon Specs', 'Digital Menu Boards'],
    technologies: ['Illustrator', 'Photoshop', 'Dimension 3D', 'InDesign'],
    impact: [
      { label: 'Outlets Opened', value: '28 Stores' },
      { label: 'Daily Cups Sold', value: '14,000+' },
      { label: 'Franchise Partner Satisfaction', value: '99%' }
    ],
    year: '2024'
  },
  {
    id: 'aethelgard-fine-jewelry-branding',
    title: 'Aethelgard High-Jewelry Global Brand System',
    client: 'Aethelgard Fine Jewels',
    industry: 'Luxury Goods & Haute Horlogerie Global',
    pillar: 'Visual Experience',
    service: 'Branding & Identity',
    featured: false,
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1200',
    desc: 'Bespoke identity crafted with custom serif typefaces, blind-debossed velvet packaging, and museum-grade certification cards for rare gemstones.',
    descId: 'Identitas mewah dengan font serif kustom, kemasan beludru blind-deboss, dan kartu sertifikasi batu mulia berstandar museum.',
    challenge: 'Communicating uncompromising pedigree and investment-grade authenticity.',
    challengeId: 'Mengomunikasikan keaslian batu mulia bernilai investasi tinggi dengan standar visual tanpa kompromi.',
    solution: 'Engineered a monogram system inspired by diamond facet geometry, paired with midnight-obsidian paper stocks.',
    solutionId: 'Menciptakan monogram geometris terinspirasi dari faset berlian yang dipadukan dengan palet kertas midnight obsidian.',
    deliverables: ['Brand Manual & Typeface', 'Velvet Jewelry Box Suite', 'Digital Authenticity Portal', 'Store Interior Guide'],
    technologies: ['Adobe Illustrator', 'Custom Type Foundry', 'InDesign', 'Blender'],
    impact: [
      { label: 'Average Ticket Size', value: '$45,000+' },
      { label: 'Collector Base Growth', value: '+120%' },
      { label: 'Retail Expansion', value: 'Geneva & Dubai' }
    ],
    year: '2024'
  },

  // ==========================================
  // 5. Motion & Graphic Design (Visual Experience) - 4 projects
  // ==========================================
  {
    id: 'tokopedia-mega-promo-kinetic-motion',
    title: 'Toko Digital Nusantara National 3D OOH & Kinetic Motion',
    client: 'PT Toko Digital Nusantara',
    industry: 'E-Commerce & Digital Advertising Indonesia',
    pillar: 'Visual Experience',
    service: 'Motion & Graphic Design',
    featured: false,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=1200',
    desc: 'Illusionary anamorphic 3D billboard motion graphics and high-conversion social ad campaigns for national shopping festival celebrations in Jakarta.',
    descId: 'Animasi billboard 3D ilusi anamorfik dan rangkaian iklan motion grafis sosial media untuk festival belanja nasional di pusat kota Jakarta.',
    challenge: 'Capturing instant commuter attention in high-traffic intersections (Bundaran HI & Sudirman) within 3 seconds of viewing time.',
    challengeId: 'Menarik perhatian pengendara di persimpangan padat Bundaran HI & Sudirman dalam waktu pandang 3 detik pertama.',
    solution: 'Rendered perspective-bending 3D parcels breaking through screen boundaries, coupled with neon kinetic typography and seasonal vouchers.',
    solutionId: 'Merender efek 3D kardus belanja yang menembus bingkai layar billboard, dipadukan tipografi kinetik neon dan promo interaktif.',
    deliverables: ['Anamorphic 3D LED Billboard Master', 'Social Story & Reel Motion Ads', 'Static Key Visuals', 'Digital Display Banners'],
    technologies: ['Cinema 4D', 'After Effects', 'Octane Render', 'Photoshop'],
    impact: [
      { label: 'Campaign Footfall Reach', value: '4.5M Daily' },
      { label: 'App Install Spike', value: '+310%' },
      { label: 'Social Engagement', value: '1.8M Interactions' }
    ],
    year: '2024'
  },
  {
    id: 'glowskin-d2c-social-motion-kit',
    title: 'GlowSkin Indonesia D2C Motion Ad Suite',
    client: 'PT GlowSkin Kosmetik Indonesia',
    industry: 'Beauty & Skincare D2C Indonesia',
    pillar: 'Visual Experience',
    service: 'Motion & Graphic Design',
    featured: false,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1200',
    desc: 'High-frequency TikTok & Instagram Reels motion advertising kit featuring ingredient kinetic breakdowns, clinical test results, and flash sale countdowns.',
    descId: 'Paket iklan motion TikTok & Reels berkonversi tinggi yang menampilkan breakdown bahan aktif produk, hasil uji klinis, dan timer diskon.',
    challenge: 'Achieving lower Customer Acquisition Cost (CAC) amidst saturated local skincare marketing competition.',
    challengeId: 'Menurunkan biaya akuisisi pelanggan (CAC) di tengah persaingan ketat pasar brand kecantikan lokal.',
    solution: 'Designed fast-paced 9:16 vertical motion templates with vibrant product splash dynamics, glowing text overlays, and hook-optimized first 2 seconds.',
    solutionId: 'Membuat template motion vertikal 9:16 dengan efek dinamika splash serum, teks highlight, dan hook pembuka 2 detik pertama.',
    deliverables: ['30 Modular Motion Ad Templates', 'TikTok Shop Live Motion Overlays', 'Feed Carousel Graphics', 'Product Key Visuals'],
    technologies: ['After Effects', 'Photoshop', 'Illustrator', 'CapCut Pro Templates'],
    impact: [
      { label: 'ROAS (Return on Ad Spend)', value: '6.4x' },
      { label: 'CAC Reduction', value: '-42%' },
      { label: 'Monthly Sales Units', value: '85,000+' }
    ],
    year: '2024'
  },
  {
    id: 'mrt-jakarta-digital-signage-motion',
    title: 'MRT Jakarta Passenger Wayfinding & Digital Signage',
    client: 'PT MRT Transportasi Jakarta',
    industry: 'Transportasi Publik & Smart City Indonesia',
    pillar: 'Visual Experience',
    service: 'Motion & Graphic Design',
    featured: false,
    image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&q=80&w=1200',
    desc: 'Clear, high-contrast motion graphic displays and platform screen door indicators designed for thousands of daily MRT Jakarta commuters.',
    descId: 'Display motion grafis informatif dan indikator pintu peron berdaya baca tinggi untuk ribuan penumpang harian MRT Jakarta.',
    challenge: 'Ensuring absolute legibility and rapid comprehension for multi-lingual commuters, tourists, and elderly passengers in rushing crowds.',
    challengeId: 'Memastikan keterbacaan instan bagi penumpang lokal, turis mancanegara, dan lansia di tengah keramaian stasiun jam sibuk.',
    solution: 'Created bilingual kinetic transit charts, synchronized train arrival countdowns, and accessible color-coded line switch maps.',
    solutionId: 'Merancang grafik waktu tiba kereta dwibahasa, hitung mundur kedatangan, dan peta transit berbasis kode warna aksesibel.',
    deliverables: ['Station Platform Motion Graphics', 'Emergency Broadcast Screen Layouts', 'Wayfinding Iconography System', 'Digital Ad Grid Specs'],
    technologies: ['After Effects', 'Illustrator', 'Figma', 'Transit UI Standards'],
    impact: [
      { label: 'Commuter Wayfinding Errors', value: '-78%' },
      { label: 'Passenger Satisfaction', value: '97%' },
      { label: 'Daily Commuters Served', value: '110,000+' }
    ],
    year: '2023'
  },
  {
    id: 'apex-esports-championship-broadcast',
    title: 'Apex Esports Global Championship Broadcast Motion',
    client: 'Apex League International',
    industry: 'Gaming & Live Streaming Global',
    pillar: 'Visual Experience',
    service: 'Motion & Graphic Design',
    featured: false,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200',
    desc: 'Real-time live broadcast motion graphics, player kill-feed overlays, dynamic tournament brackets, and kinetic match intros for Twitch/YouTube live streams.',
    descId: 'Paket grafis siaran langsung esports, overlay statistik pemain real-time, bagan turnamen dinamis, dan intro pertandingan kinetik.',
    challenge: 'Integrating real-time game API telemetry into zero-latency broadcast overlays without frame drops.',
    challengeId: 'Mengintegrasikan data telemetri API game secara real-time ke dalam tampilan overlay siaran tanpa jeda lag.',
    solution: 'Engineered NodeCG HTML/CSS motion overlays paired with high-impact 3D team entrance transitions.',
    solutionId: 'Mengembangkan grafis overlay siaran berbasis NodeCG dengan transisi 3D pembuka tim yang spektakuler.',
    deliverables: ['Live Stream Overlay Package', 'Animated Lower Thirds & Scoreboards', 'Championship Intro Stingers', 'Social Winner Cards'],
    technologies: ['After Effects', 'Cinema 4D', 'NodeCG', 'OBS / vMix Integration'],
    impact: [
      { label: 'Peak Concurrent Viewers', value: '480K+' },
      { label: 'Total Tournament Hours Watched', value: '12.8M' },
      { label: 'Broadcaster Rating', value: '99%' }
    ],
    year: '2024'
  },

  // ==========================================
  // 6. Creative Design (Visual Experience) - 4 projects
  // ==========================================
  {
    id: 'telkom-akses-sustainability-report',
    title: 'PT Telkom Akses Sustainability & Annual Report',
    client: 'PT Telkom Akses Indonesia',
    industry: 'Telekomunikasi & Korporat BUMN Indonesia',
    pillar: 'Visual Experience',
    service: 'Creative Design',
    featured: true,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
    desc: 'Comprehensive 180-page corporate annual & ESG sustainability report featuring data infographics, audited fiber network metrics, and digital flipbook.',
    descId: 'Laporan tahunan korporat & keberlanjutan ESG setebal 180 halaman dengan infografis data interaktif, audit jaringan fiber, dan buku digital interaktif.',
    challenge: 'Presenting dense audited financial tables and technical nationwide fiber deployment data in an engaging, executive-friendly narrative.',
    challengeId: 'Menyajikan data audit finansial yang padat dan metrik teknis jaringan fiber optik nasional agar menarik dibaca para pemangku kepentingan.',
    solution: 'Designed bespoke data visualizers, clear iconography, clean typography grid systems, and a responsive interactive web flipbook version.',
    solutionId: 'Merancang visualisasi grafik keuangan kustom, sistem grid tipografi rapi, dan format web flipbook interaktif responsif.',
    deliverables: ['Hardcover Printed Annual Report', 'Interactive Digital PDF & Flipbook', 'Infographic Social Media Cards', 'Boardroom Executive Summary Deck'],
    technologies: ['Adobe InDesign', 'Adobe Illustrator', 'Figma', 'Datawrapper Charts'],
    impact: [
      { label: 'Stakeholder Readership', value: '+140%' },
      { label: 'GRI Compliance Score', value: '100% Verified' },
      { label: 'Award', value: 'Best Corporate Report Category' }
    ],
    year: '2024'
  },
  {
    id: 'nusantara-venture-pitch-deck',
    title: 'Nusantara Capital Series B Investor Pitch Deck',
    client: 'Nusantara Venture Capital',
    industry: 'Venture Capital & Startup FinTech Indonesia',
    pillar: 'Visual Experience',
    service: 'Creative Design',
    featured: false,
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200',
    desc: 'High-impact investor presentation deck, financial model visualizations, and valuation thesis for a $35M Series B funding round.',
    descId: 'Deck presentasi investor berstandar global, visualisasi model keuangan, dan tesis valuasi untuk penggalangan dana Series B sebesar $35 juta.',
    challenge: 'Distilling complex multi-cohort unit economics and Indonesian market expansion metrics into 18 crisp, high-conviction slides.',
    challengeId: 'Merangkum data unit ekonomi multi-kohort dan rencana ekspansi pasar Indonesia ke dalam 18 slide presentasi yang tajam dan meyakinkan.',
    solution: 'Structured a narrative-driven visual hierarchy with custom cohort retention heatmaps, TAM breakdowns, and dark luxury aesthetic styling.',
    solutionId: 'Menyusun narasi visual dengan heatmap retensi pengguna kustom, visualisasi TAM pasar, dan tipografi bertema dark luxury elegan.',
    deliverables: ['18-Slide Master Keynote & Pitch Deck', 'Figma Editable Presentation Kit', 'Executive Teaser One-Pager', 'Financial Chart Templates'],
    technologies: ['Figma', 'Apple Keynote', 'Adobe Illustrator', 'Financial Modeling Charts'],
    impact: [
      { label: 'Funding Closed', value: '$35M Raised' },
      { label: 'Lead Investor Term Sheet', value: '14 Days' },
      { label: 'Partner Pitch Rating', value: '10/10' }
    ],
    year: '2024'
  },
  {
    id: 'sinar-mas-land-property-lookbook',
    title: 'Sinar Mas Land Luxury Property Editorial Lookbook',
    client: 'PT Sinar Mas Land Properti',
    industry: 'Real Estate & Properti Mewah BSD City',
    pillar: 'Visual Experience',
    service: 'Creative Design',
    featured: false,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
    desc: 'Editorial coffee-table publication and digital brochure showcasing ultra-luxury residential estates in BSD City and NavaPark Tangerang.',
    descId: 'Buku publikasi editorial premium dan brosur digital yang memamerkan kluster hunian mewah di BSD City dan kawasan prestisius NavaPark.',
    challenge: 'Appealing to ultra-high-net-worth buyers seeking architectural elegance, privacy, and long-term generational wealth value.',
    challengeId: 'Menarik minat pembeli kelas atas yang menginginkan keanggunan arsitektur, privasi eksklusif, dan nilai investasi properti jangka panjang.',
    solution: 'Crafted a tactile editorial layout with generous negative space, architectural photography curation, textured foil finishes, and architectural floorplans.',
    solutionId: 'Merancang tata letak editorial dengan ruang negatif luas, kurasi foto arsitektur profesional, finishing kertas bertekstur, dan denah arsitektur detail.',
    deliverables: ['Hardcover Luxury Coffee-Table Book', 'Interactive iPad Client App', 'Architectural Floorplan Infographics', 'VIP Invitation Collateral'],
    technologies: ['Adobe InDesign', 'Photoshop', 'Illustrator', 'Color Calibration Proofing'],
    impact: [
      { label: 'Estate Units Sold Out', value: '100% in 3 Months' },
      { label: 'Average Unit Value', value: 'Rp 18M+' },
      { label: 'Buyer Satisfaction', value: '99%' }
    ],
    year: '2023'
  },
  {
    id: 'lumina-esg-whitepaper-design',
    title: 'Lumina Global Climate & Carbon Whitepaper',
    client: 'Lumina Institute Global',
    industry: 'Clean Energy & Global Think Tank',
    pillar: 'Visual Experience',
    service: 'Creative Design',
    featured: false,
    image: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&q=80&w=1200',
    desc: 'Authoritative 80-page scientific publication on carbon credit registries, renewable grid economics, and global decarbonization roadmaps.',
    descId: 'Publikasi ilmiah 80 halaman tentang registri kredit karbon, ekonomi jaringan listrik terbarukan, dan peta jalan dekarbonisasi global.',
    challenge: 'Making complex climate science modeling accessible to policymakers and institutional investment managers.',
    challengeId: 'Menyajikan permodelan sains iklim yang rumit agar mudah dipahami para pengambil kebijakan dan manajer investasi institusional.',
    solution: 'Designed clear flow diagrams, multi-axis energy cost curves, and typographic hierarchies formatted for both digital viewing and print.',
    solutionId: 'Merancang diagram alur energi yang jelas, kurva biaya listrik multi-sumbu, dan tipografi terstruktur untuk format digital dan cetak.',
    deliverables: ['Digital Interactive PDF Whitepaper', 'Print-ready Publication Masters', 'Social Summary Carousel Graphics', 'Presentation Slides'],
    technologies: ['InDesign', 'Illustrator', 'Figma', 'LaTeX Integration'],
    impact: [
      { label: 'Downloads by Global Policymakers', value: '95,000+' },
      { label: 'Citations in Industry Reports', value: '340+' },
      { label: 'Global Media Mentions', value: '45 Outlets' }
    ],
    year: '2024'
  },

  // ==========================================
  // 7. 3D Visualization (Visual Experience) - 4 projects
  // ==========================================
  {
    id: 'senopati-penthouse-3d-architectural',
    title: 'The Peak Senopati Luxury Penthouse 3D Architectural Render',
    client: 'PT Senopati Griya Mandiri',
    industry: 'Arsitektur & Real Estate Jakarta Selatan',
    pillar: 'Visual Experience',
    service: '3D Visualization',
    featured: true,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200',
    desc: 'Photorealistic 3D architectural rendering and interactive virtual walkthrough for multi-level sky penthouses overlooking the Senopati & SCBD skyline.',
    descId: 'Render arsitektur 3D fotorealistis dan virtual tour interaktif untuk hunian penthouse bertingkat dengan pemandangan cakrawala SCBD Jakarta.',
    challenge: 'Capturing exact material textures (Italian Statuario marble, teakwood joinery, brushed brass fittings) under changing diurnal lighting conditions.',
    challengeId: 'Menghadirkan tekstur material nyata (marmer Statuario Italia, kayu jati solid, aksen kuningan) di berbagai kondisi pencahayaan siang hingga malam.',
    solution: 'Built ray-traced 3D models with calibrated physical shaders, volumetric sunlight, accurate Jakarta panoramic backplates, and 360 virtual reality tours.',
    solutionId: 'Membangun model 3D ray-traced dengan shader material fisik akurat, tata cahaya matahari volumetrik, dan virtual tour panorama 360 derajat.',
    deliverables: ['12 Ultra-HD 8K Architectural Renders', 'Interactive 360 VR Virtual Tour', 'Cinematic 3D Video Walkthrough (60s)', 'Marketing Brochure Renders'],
    technologies: ['3ds Max', 'Corona Renderer', 'Unreal Engine 5', 'Blender & Photoshop'],
    impact: [
      { label: 'Off-plan Unit Sales', value: '85% Pre-sold' },
      { label: 'Client Inquiry Conversion', value: '+175%' },
      { label: 'Render Realism Score', value: '99.2%' }
    ],
    year: '2024'
  },
  {
    id: 'samudra-bali-villa-3d-showcase',
    title: 'Samudra Beachfront Luxury Villa 3D Virtual Experience',
    client: 'Samudra Bali Developments',
    industry: 'Real Estate & Villa Mewah Canggu Bali',
    pillar: 'Visual Experience',
    service: '3D Visualization',
    featured: false,
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200',
    desc: 'Real-time Unreal Engine 5 interactive 3D villa walkthrough allowing overseas international investors to customize interior furniture finishes and sunset lighting.',
    descId: 'Pengalaman interaktif 3D Unreal Engine 5 yang memungkinkan investor internasional mengkustomisasi furnitur interior dan simulasi suasana sunset Bali.',
    challenge: 'Enabling remote buyers in Australia, Singapore, and Europe to experience spatial volume and ocean breezes before ground breaking.',
    challengeId: 'Memungkinkan calon pembeli di Australia, Singapura, dan Eropa merasakan proporsi ruang dan suasana pantai sebelum pembangunan fisik dimulai.',
    solution: 'Programmed an interactive WebGL & UE5 tour featuring real-time water physics for infinity pools, dynamic foliage wind simulation, and day/night toggles.',
    solutionId: 'Memprogram tur interaktif WebGL & UE5 dengan simulasi air kolam infinity, angin pada tanaman tropis, dan opsi pencahayaan waktu nyata.',
    deliverables: ['Real-time WebGL Villa Tour', '8K Still Exterior Renders', 'Interior Mood Lighting Variations', 'Investor Virtual Reality Build'],
    technologies: ['Unreal Engine 5', 'Lumen & Nanite', 'Blender', 'WebGL Three.js'],
    impact: [
      { label: 'Overseas Investor Sales', value: '100% Allocated' },
      { label: 'Virtual Tour Sessions', value: '45,000+' },
      { label: 'Development ROI', value: '14x' }
    ],
    year: '2024'
  },
  {
    id: 'indorobotics-agv-3d-industrial',
    title: 'IndoRobotics Autonomous Warehouse AGV 3D Showcase',
    client: 'PT Robotika Otomasi Nusantara',
    industry: 'Otomasi Industri & Robotika Cikarang',
    pillar: 'Visual Experience',
    service: '3D Visualization',
    featured: false,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
    desc: 'Exploded-view 3D mechanical rendering and interactive Spline 3D web model demonstrating automated guided vehicle (AGV) sensors, LiDAR, and battery chassis.',
    descId: 'Render mekanikal 3D exploded-view dan model web interaktif 3D yang memperlihatkan sensor LiDAR, motor penggerak, dan sasis baterai robot logistik AGV.',
    challenge: 'Demonstrating proprietary internal sensor arrays and robotic payload mechanisms without dismantling expensive physical factory prototypes.',
    challengeId: 'Menjelaskan susunan sensor internal dan mekanisme hidrolik tanpa harus membongkar prototipe fisik robotik yang mahal.',
    solution: 'Modelled CAD-accurate 3D assemblies with interactive peel-away layers, ghosted transparent casings, and animated rotational web controls.',
    solutionId: 'Membuat model 3D presisi CAD dengan lapisan transparan interaktif yang dapat diputar 360 derajat langsung di browser web klien.',
    deliverables: ['Spline 3D Interactive Web Canvas', 'Exploded-View 4K Motion Animation', 'Product Spec Sheet Renders', 'Expo Booth Video Loop'],
    technologies: ['Spline 3D', 'Blender', 'Fusion 360', 'Three.js'],
    impact: [
      { label: 'Industrial B2B Leads', value: '+220%' },
      { label: 'Pitch Decision Speed', value: '2x Faster' },
      { label: 'Factory Client Deals', value: '18 Sites' }
    ],
    year: '2023'
  },
  {
    id: 'kronos-chronograph-3d-webgl',
    title: 'Kronos Master Chronograph 3D Interactive WebGL',
    client: 'Kronos Swiss Horlogerie',
    industry: 'Haute Horlogerie & Luxury Goods Global',
    pillar: 'Visual Experience',
    service: '3D Visualization',
    featured: false,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200',
    desc: 'Microsecond-accurate 3D escapement wheel and tourbillon visualization rendered directly in browser canvas via WebGL with metallic reflection shaders.',
    descId: 'Visualisasi 3D tourbillon dan roda mekanik jam tangan mewah yang dirender langsung di browser web dengan pantulan logam fotorealistis.',
    challenge: 'Rendering 200+ miniature moving mechanical watch gears smoothly on mobile browsers without battery drain.',
    challengeId: 'Merender 200+ roda gigi mekanik bergerak secara lancar di browser smartphone tanpa menguras daya baterai.',
    solution: 'Optimized low-poly geometric meshes with baked 8K normal maps and procedural metallic reflection maps in Three.js.',
    solutionId: 'Mengoptimalkan mesh 3D geometris dengan tekstur normal map 8K dan refleksi logam prosedural di Three.js.',
    deliverables: ['Interactive 3D Web Watch Customizer', '4K Still Renders for Print', 'Mechanical Motion Loop Video', 'Social Media 3D Reels'],
    technologies: ['Three.js', 'Blender', 'Substance Painter', 'GLTF Pipeline'],
    impact: [
      { label: 'E-Commerce Engagement Time', value: '4.5 Min Avg' },
      { label: 'Pre-order Conversion', value: '+185%' },
      { label: 'Mobile 60fps Stability', value: '99%' }
    ],
    year: '2024'
  },

  // ==========================================
  // 8. Company Profile Website (Innovation Development) - 5 projects
  // ==========================================
  {
    id: 'samudera-logistik-maritim-portal',
    title: 'Samudera Logistik Maritim Corporate Portal',
    client: 'PT Samudera Maritim Indonesia',
    industry: 'Pelayaran, Ekspedisi & Logistik Indonesia',
    pillar: 'Innovation Development',
    service: 'Company Profile Website',
    featured: true,
    image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=1200',
    desc: 'Enterprise corporate portal with real-time container cargo tracking, port schedules across Indonesian archipelago, investor relations, and bilingual CMS.',
    descId: 'Portal korporat perusahaan pelayaran dengan pelacakan kontainer real-time, jadwal sandar pelabuhan nusantara, pusat investor, dan CMS dwibahasa.',
    challenge: 'Outdated legacy website lacked mobile responsiveness, container status transparency, and struggled with slow page load speeds.',
    challengeId: 'Website lama tidak responsif di perangkat seluler, belum memiliki fitur cek resi kontainer, dan lambat saat dibuka di jaringan pelabuhan.',
    solution: 'Engineered a modern Next.js website with Edge CDN caching, live shipping schedule APIs, investor financial disclosure hubs, and ISO-compliant security.',
    solutionId: 'Membangun website Next.js modern dengan Edge CDN, integrasi API pelacakan jadwal kapal, portal laporan investor, dan keamanan bersertifikasi ISO.',
    deliverables: ['Custom Next.js Corporate Portal', 'Container Tracking Search Widget', 'Investor Relations Document CMS', 'Multi-lingual Support (ID/EN)'],
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Sanity CMS'],
    impact: [
      { label: 'Page Load Speed', value: '0.8s' },
      { label: 'Direct Quote Inquiries', value: '+240%' },
      { label: 'Google PageSpeed Score', value: '99/100' }
    ],
    year: '2024'
  },
  {
    id: 'indorama-tekstil-corporate-website',
    title: 'Indorama Tekstil Industri Global Export Portal',
    client: 'PT Indorama Tekstil Indonesia',
    industry: 'Manufaktur Tekstil & Ekspor Indonesia',
    pillar: 'Innovation Development',
    service: 'Company Profile Website',
    featured: false,
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200',
    desc: 'High-performance bilingual digital showcase detailing certified sustainable fabric catalogs, export compliance certifications, and factory virtual tours in Purwakarta.',
    descId: 'Website showcase korporat dwibahasa yang menampilkan katalog kain ekspor bersertifikasi ramah lingkungan dan tur fasilitas pabrik di Purwakarta.',
    challenge: 'International buyers from Europe, Japan, and the US needed quick verification of ESG compliance standards and fabric technical specs.',
    challengeId: 'Pembeli internasional dari Eropa, Jepang, dan AS memerlukan verifikasi cepat terkait standar keberlanjutan ESG dan spesifikasi teknis kain.',
    solution: 'Designed a structured digital product catalog with downloadable Oeko-Tex test certificates, factory 3D virtual maps, and direct B2B inquiry routing.',
    solutionId: 'Merancang katalog produk digital dengan sertifikasi Oeko-Tex yang dapat diunduh, peta virtual pabrik, dan routing pesan B2B ke tim sales ekspor.',
    deliverables: ['B2B Export Corporate Website', 'Interactive Fabric Catalog Filter', 'Certifications & ESG Repository', 'Inquiry Lead Dispatcher'],
    technologies: ['React', 'Vite', 'Tailwind CSS', 'Node.js', 'Framer Motion'],
    impact: [
      { label: 'Global B2B Inquiries', value: '+190%' },
      { label: 'Export RFQ Volume', value: '$8.2M Pipe' },
      { label: 'Uptime Reliability', value: '99.99%' }
    ],
    year: '2023'
  },
  {
    id: 'bumi-energi-terbarukan-portal',
    title: 'Bumi Energi Hijau Nusantara Corporate Website',
    client: 'PT Bumi Energi Hijau Nusantara',
    industry: 'Energi Terbarukan & Solar Panel Indonesia',
    pillar: 'Innovation Development',
    service: 'Company Profile Website',
    featured: false,
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&q=80&w=1200',
    desc: 'Modern, clean company profile website showcasing utility-scale solar PV installations, commercial rooftop projects, and real-time megawatt telemetry.',
    descId: 'Website profil perusahaan energi bersih yang memamerkan proyek pembangkit listrik tenaga surya (PLTS), instalasi atap industri, dan total megawatt energi.',
    challenge: 'Industrial clients (factories, malls) needed clear ROI calculation previews before scheduling corporate energy audit consultations.',
    challengeId: 'Klien industri (pabrik, mal) membutuhkan simulasi estimasi penghematan listrik sebelum memesan jadwal audit energi pabrik.',
    solution: 'Built an interactive solar electricity savings calculator, project portfolio map across Indonesia, and automated lead capture form.',
    solutionId: 'Membangun kalkulator penghematan biaya listrik surya interaktif, peta portofolio proyek di seluruh Indonesia, dan form konsultasi otomatis.',
    deliverables: ['Next.js Corporate Website', 'Interactive Solar Savings Calculator', 'Project Map Geo-Visualizer', 'Headless CMS Integration'],
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Prisma', 'PostgreSQL'],
    impact: [
      { label: 'Industrial Leads Generated', value: '450+ Sites' },
      { label: 'Average Session Duration', value: '3.8 Min' },
      { label: 'Energy Audit Bookings', value: '+320%' }
    ],
    year: '2024'
  },
  {
    id: 'adhi-rekayasa-konstruksi-portal',
    title: 'Adhi Rekayasa Konstruksi BUMN & Infrastructure Portal',
    client: 'PT Adhi Rekayasa Konstruksi',
    industry: 'Konstruksi, Jembatan & Infrastruktur Indonesia',
    pillar: 'Innovation Development',
    service: 'Company Profile Website',
    featured: false,
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&q=80&w=1200',
    desc: 'Stately corporate web portal presenting national strategic infrastructure projects (toll roads, LRT bridges, dams) with high-res drone photography.',
    descId: 'Portal korporat resmi yang menampilkan proyek strategis nasional (jalan tol, jembatan bentang panjang, bendungan) dengan foto udara beresolusi tinggi.',
    challenge: 'Government auditors and financial partners required transparent project milestone data and safety governance documentation.',
    challengeId: 'Auditor pemerintah dan mitra perbankan membutuhkan data progres proyek yang transparan serta dokumen tata kelola keselamatan K3.',
    solution: 'Developed a robust, high-security corporate site with project milestone timelines, audited safety certifications, and career recruitment portal.',
    solutionId: 'Mengembangkan website berkeamanan tinggi dengan linimasa progres proyek, sertifikasi K3, dan portal rekrutmen talenta teknik terintegrasi.',
    deliverables: ['Corporate Infrastructure Portal', 'Interactive Project Milestone Timeline', 'Procurement Vendor Portal', 'Careers Management Module'],
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Express.js', 'Cloudflare Enterprise'],
    impact: [
      { label: 'Tender Verification Speed', value: '+60%' },
      { label: 'Monthly Visitors', value: '220K+' },
      { label: 'Cybersecurity Audit', value: 'Zero Vulnerabilities' }
    ],
    year: '2023'
  },
  {
    id: 'vanguard-wealth-portal',
    title: 'Vanguard Private Wealth Management Portal',
    client: 'Vanguard Wealth Partners',
    industry: 'Financial Advisory & Wealth Global',
    pillar: 'Innovation Development',
    service: 'Company Profile Website',
    featured: false,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
    desc: 'Bespoke corporate portal featuring portfolio performance calculators, wealth management insight whitepapers, and private client portal access.',
    descId: 'Portal korporat penasihat keuangan privat dengan kalkulator pertumbuhan aset, laporan riset pasar, dan akses portal klien eksklusif.',
    challenge: 'High-net-worth clients expected a tailored, discreet digital experience that mirrored bespoke in-person family office advisory.',
    challengeId: 'Klien private banking menginginkan pengalaman digital yang elegan, eksklusif, dan mencerminkan layanan konsultasi tatap muka premium.',
    solution: 'Designed a sophisticated dark luxury layout with encrypted client inquiries, automated market commentary feeds, and responsive security headers.',
    solutionId: 'Mendesain tata letak bernuansa dark luxury dengan formulir konsultasi terenkripsi, data pasar otomatis, dan sistem keamanan tingkat tinggi.',
    deliverables: ['Wealth Management Corporate Portal', 'Asset Allocation Interactive Widget', 'Insights Blog & Whitepaper CMS', 'Client Portal Gateway'],
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Vercel Edge Functions'],
    impact: [
      { label: 'AUM Inquiries Generated', value: '$120M+' },
      { label: 'Client Engagement Time', value: '4.2 Min' },
      { label: 'Conversion to Consultations', value: '18.4%' }
    ],
    year: '2024'
  },

  // ==========================================
  // 9. E-Commerce Website (Innovation Development) - 5 projects
  // ==========================================
  {
    id: 'batik-keris-modern-ecommerce',
    title: 'Batik Keris Nusantara Headless Flagship Storefront',
    client: 'PT Keris Nusantara Apparel',
    industry: 'Retail Fashion & E-Commerce Indonesia',
    pillar: 'Innovation Development',
    service: 'E-Commerce Website',
    featured: true,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200',
    desc: 'High-speed headless e-commerce store with Midtrans payment gateway, automatic Indonesian courier shipping rates (JNE, SiCepat, J&T), and localized size guides.',
    descId: 'Toko online headless berkecepatan tinggi dengan integrasi Midtrans, kalkulasi ongkir otomatis (JNE, SiCepat, J&T), dan panduan ukuran fitting pintar.',
    challenge: 'Previous monolithic online shop crashed during payday flash sales and lacked multi-courier real-time Indonesian shipping calculation.',
    challengeId: 'Toko online sebelumnya sering down saat promo tanggal kembar/gajian dan belum mendukung cek ongkir otomatis multi-ekspedisi.',
    solution: 'Engineered a headless storefront on Next.js with sub-second page transitions, automated inventory synchronization, and 1-click Midtrans QRIS checkout.',
    solutionId: 'Membangun storefront headless Next.js dengan navigasi instan, sinkronisasi stok gudang real-time, dan checkout 1-klik via Midtrans QRIS.',
    deliverables: ['Headless Next.js Storefront', 'Midtrans & QRIS Payment Gateway', 'RajaOngkir Multi-Courier Integration', 'Custom CMS & Admin Panel'],
    technologies: ['Next.js', 'Shopify Storefront API', 'Tailwind CSS', 'Midtrans API', 'Redis'],
    impact: [
      { label: 'Checkout Conversion Rate', value: '+180%' },
      { label: 'Cart Abandonment', value: '-45%' },
      { label: 'Payday Flash Sale Uptime', value: '100.0%' }
    ],
    year: '2024'
  },
  {
    id: 'aura-skincare-headless-store',
    title: 'Aura Kosmetika D2C Beauty Store & Subscriptions',
    client: 'PT Aura Kosmetika Indonesia',
    industry: 'Beauty & Wellness E-Commerce Indonesia',
    pillar: 'Innovation Development',
    service: 'E-Commerce Website',
    featured: false,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1200',
    desc: 'High-converting direct-to-consumer skincare webstore with personalized skin quiz diagnostics, recurring auto-replenish subscriptions, and WhatsApp order alerts.',
    descId: 'Website e-commerce skincare D2C dengan kuis diagnosa kulit wajah pintar, sistem langganan produk berkala otomatis, dan notifikasi resi via WhatsApp.',
    challenge: 'Customers were unsure which skincare routine matched their skin type, leading to high cart hesitation.',
    challengeId: 'Pelanggan sering ragu memilih paket skincare yang tepat untuk jenis kulitnya, menyebabkan tingginya pembatalan keranjang belanja.',
    solution: 'Developed an interactive 60-second skin diagnostic quiz that auto-bundles recommended products directly into cart with 15% bundle discounts.',
    solutionId: 'Mengembangkan kuis diagnosa kulit 60 detik yang otomatis menyusun paket bundling produk ke keranjang belanja dengan diskon khusus.',
    deliverables: ['Custom Next.js E-Commerce Store', 'Interactive Skin Quiz Engine', 'Recurring Subscription Module', 'WhatsApp API Automated Notifications'],
    technologies: ['Next.js', 'Tailwind CSS', 'Stripe & Midtrans', 'Prisma', 'PostgreSQL'],
    impact: [
      { label: 'Average Order Value (AOV)', value: '+62%' },
      { label: 'Repeat Subscription Orders', value: '44%' },
      { label: 'Mobile Page Load Speed', value: '0.9s' }
    ],
    year: '2024'
  },
  {
    id: 'jati-jepara-furniture-export-store',
    title: 'Furnitur Jati Jepara Global D2C Export Store',
    client: 'PT Jati Kusuma Jepara',
    industry: 'Mebel, Kayu Jati & Ekspor Indonesia',
    pillar: 'Innovation Development',
    service: 'E-Commerce Website',
    featured: false,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1200',
    desc: 'International direct-to-consumer luxury furniture storefront supporting multi-currency pricing (USD, EUR, AUD), sea freight shipping estimators, and 3D AR room placement.',
    descId: 'Toko e-commerce ekspor mebel jati mewah dengan dukungan multi-mata uang, kalkulator estimasi kargo laut internasional, dan fitur 3D AR di ruangan.',
    challenge: 'Overseas buyers found calculating international wooden crate shipping and customs clearance fees complicated.',
    challengeId: 'Pembeli luar negeri kesulitan memperkirakan biaya kirim kontainer kayu dan bea cukai pengiriman internasional.',
    solution: 'Integrated an automated freight volumetric calculator, 3D Augmented Reality previews, and secure Stripe / Wire Transfer escrow checkout.',
    solutionId: 'Mengintegrasikan kalkulator ongkir kargo laut otomatis, fitur Augmented Reality untuk mencoba furnitur di ruangan, dan pembayaran Stripe aman.',
    deliverables: ['Global E-Commerce Storefront', '3D AR Web Placement Viewer', 'Automated Sea Freight Estimator', 'Bilingual Admin Dashboard'],
    technologies: ['Shopify Plus', 'Three.js / WebXR', 'Tailwind CSS', 'Stripe Elements', 'GraphQL'],
    impact: [
      { label: 'Export Revenue Growth', value: '+280%' },
      { label: 'Return Rates', value: '<1%' },
      { label: 'International Inquiries', value: '38 Countries' }
    ],
    year: '2023'
  },
  {
    id: 'kopi-kenangan-roastery-online',
    title: 'Kopi Kenangan Online Roastery & Bean Subscription',
    client: 'PT Kopi Kenangan Nusantara',
    industry: 'Retail Kopi & D2C Indonesia',
    pillar: 'Innovation Development',
    service: 'E-Commerce Website',
    featured: false,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=1200',
    desc: 'Direct-to-consumer specialty coffee beans subscription portal with automated recurring delivery schedules, grind level pickers, and loyalty reward points.',
    descId: 'Portal langganan biji kopi Nusantara dengan pengiriman berkala otomatis, pilihan tingkat gilingan (grind size), dan poin loyalitas pelanggan.',
    challenge: 'Coffee enthusiasts wanted freshly roasted beans delivered weekly without having to manually re-order every week.',
    challengeId: 'Pelanggan ingin biji kopi yang baru disangrai terkirim otomatis setiap minggu tanpa harus memesan ulang secara manual.',
    solution: 'Engineered a flexible subscription scheduler with automated recurring billing via GoPay/OVO/Credit Card and dynamic roast date scheduling.',
    solutionId: 'Membangun jadwal langganan fleksibel dengan pembayaran otomatis GoPay/OVO/Kartu Kredit dan pencatatan tanggal roasting kopi real-time.',
    deliverables: ['Custom Subscription Webstore', 'E-Wallet Recurring Billing Engine', 'Roast Batch Tracker', 'Loyalty Tier Integration'],
    technologies: ['Next.js', 'Node.js', 'PostgreSQL', 'Midtrans Recurring Tokenization', 'Tailwind CSS'],
    impact: [
      { label: 'Active Monthly Subscribers', value: '18,500+' },
      { label: 'Customer Lifetime Value', value: '+140%' },
      { label: 'Delivery On-Time Rate', value: '99.4%' }
    ],
    year: '2024'
  },
  {
    id: 'aethelgard-luxury-jewelry-boutique',
    title: 'Aethelgard High-Jewelry Digital Boutique',
    client: 'Aethelgard Fine Jewels',
    industry: 'Luxury E-Commerce & Haute Joaillerie Global',
    pillar: 'Innovation Development',
    service: 'E-Commerce Website',
    featured: false,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200',
    desc: 'Exclusive private digital boutique featuring concierge appointment booking, high-security armored delivery logistics, and bespoke gem ring customizer.',
    descId: 'Boutique online perhiasan mewah dengan layanan concierge privat, asuransi pengiriman berlian berkeamanan tinggi, dan kustomisasi cincin interaktif.',
    challenge: 'Enabling ultra-high-value online checkouts ($10,000+) with bulletproof anti-fraud security and white-glove delivery tracking.',
    challengeId: 'Memfasilitasi transaksi online bernilai tinggi dengan sistem mitigasi penipuan super ketat dan pelacakan pengiriman kurir khusus.',
    solution: 'Architected an invitation-only checkout flow with multi-factor fraud detection, Stripe Treasury escrow, and private concierge video calls.',
    solutionId: 'Membangun alur checkout dengan deteksi fraud multi-faktor, rekening escrow terpercaya, dan integrasi konsultasi video concierge privat.',
    deliverables: ['Custom Luxury Storefront', 'Interactive Ring Configurator', 'Armored Logistics Tracking API', 'VIP Concierge Scheduler'],
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Stripe Treasury', 'Three.js'],
    impact: [
      { label: 'Average Order Value', value: '$18,500' },
      { label: 'Zero Fraud Incidents', value: '100% Secure' },
      { label: 'Global VIP Clients', value: '1,400+' }
    ],
    year: '2024'
  },

  // ==========================================
  // 10. Web Application (Innovation Development) - 5 projects
  // ==========================================
  {
    id: 'midtrans-qris-merchant-dashboard',
    title: 'Nusantara Pay QRIS Real-Time Merchant Dashboard',
    client: 'PT Fintek Integrasi Nusantara',
    industry: 'FinTech & Payment Gateway SaaS Indonesia',
    pillar: 'Innovation Development',
    service: 'Web Application',
    featured: true,
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1200',
    desc: 'High-throughput real-time payment dashboard processing 500+ transactions per second with live settlement analytics, QRIS static/dynamic generators, and webhook monitors.',
    descId: 'Dashboard pembayaran real-time berkecepatan tinggi yang memproses 500+ transaksi per detik dengan analitik settlement pencairan dana, generator QRIS, dan monitor webhook.',
    challenge: 'Merchants needed sub-second transaction visibility and instant reconciliation across hundreds of outlet cashiers simultaneously.',
    challengeId: 'Merchant membutuhkan visibilitas transaksi instan dan rekonsiliasi otomatis di ratusan kasir cabang secara bersamaan.',
    solution: 'Engineered a reactive WebSocket web app with sub-50ms transaction latency, automated PDF tax invoice generator, and role-based cashier permissions.',
    solutionId: 'Membangun web app berbasis WebSocket dengan latensi di bawah 50ms, pembuatan faktur pajak otomatis, dan hak akses kasir bertingkat.',
    deliverables: ['React & TypeScript Merchant Dashboard', 'WebSocket Real-Time Stream Engine', 'Dynamic QRIS API Generator', 'Automated Financial Reconciliation Engine'],
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Redis', 'PostgreSQL', 'WebSockets'],
    impact: [
      { label: 'Peak TPS Supported', value: '1,200 TPS' },
      { label: 'Daily Transaction Value', value: 'Rp 85B+' },
      { label: 'Dashboard Latency', value: '<45ms' }
    ],
    year: '2024'
  },
  {
    id: 'medikapro-hospital-emr-saas',
    title: 'MedikaPro Hospital Electronic Medical Records (EMR) SaaS',
    client: 'PT Medika Sistem Kesehatan',
    industry: 'HealthTech & Rumah Sakit Indonesia',
    pillar: 'Innovation Development',
    service: 'Web Application',
    featured: false,
    image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=1200',
    desc: 'SATUSEHAT-integrated hospital web application handling patient medical records, ICD-10 diagnostics, doctor scheduling, pharmacy inventory, and digital billing.',
    descId: 'Aplikasi web rumah sakit terintegrasi SATUSEHAT Kemenkes untuk rekam medis elektronik pasien, diagnosa ICD-10, jadwal dokter, stok farmasi, dan billing kasir.',
    challenge: 'Complying with Ministry of Health SATUSEHAT FHIR standards while eliminating slow paper chart transfers in busy hospital wards.',
    challengeId: 'Memenuhi integrasi standar FHIR SATUSEHAT Kemenkes RI serta menghilangkan ketergantungan dokumen kertas di rumah sakit yang padat.',
    solution: 'Developed a zero-latency hospital SaaS application with AES-256 encrypted health records, automated BPJS claim validation, and doctor prescription pads.',
    solutionId: 'Mengembangkan aplikasi SaaS rumah sakit dengan enkripsi data medis AES-256, validasi klaim BPJS otomatis, dan e-resep dokter instan.',
    deliverables: ['Hospital EMR Web Application', 'SATUSEHAT FHIR API Bridge', 'Pharmacy & Inventory Module', 'Doctor Consultation Interface'],
    technologies: ['Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'FHIR HL7 API'],
    impact: [
      { label: 'Patient Queue Wait Times', value: '-65%' },
      { label: 'Prescription Dispense Errors', value: 'Zero Errors' },
      { label: 'Hospitals Deployed', value: '34 Clinics & RS' }
    ],
    year: '2024'
  },
  {
    id: 'tanimakmur-agritech-supply-chain',
    title: 'TaniMakmur Agritech Supply Chain Web Portal',
    client: 'PT Tani Makmur Indonesia',
    industry: 'Agritech & Rantai Pasok Pangan Indonesia',
    pillar: 'Innovation Development',
    service: 'Web Application',
    featured: false,
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1200',
    desc: 'B2B agricultural marketplace and cold-chain logistics platform connecting 8,000+ local vegetable farmers directly with supermarket chains in Jakarta & Surabaya.',
    descId: 'Platform marketplace agritech B2B yang menghubungkan 8.000+ petani lokal langsung dengan jaringan supermarket di Jakarta & Surabaya dengan transparansi harga.',
    challenge: 'Inefficient traditional middlemen caused harvest spoilage rates of over 30% and erratic farmer payment delays.',
    challengeId: 'Rantai tengkulak konvensional menyebabkan 30% hasil panen rusak di jalan dan keterlambatan pembayaran ke petani.',
    solution: 'Built an end-to-end harvest forecasting web app with real-time commodity pricing indices, cold-truck dispatch tracking, and automated escrow payouts.',
    solutionId: 'Membangun web app estimasi panen dengan indeks harga komoditas real-time, pelacakan truk berpendingin, dan pencairan dana panen cepat.',
    deliverables: ['B2B Agritech Web Application', 'Real-time Commodity Price Index', 'Cold-Truck GPS Telemetry', 'Farmer Escrow Payout Engine'],
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'Google Maps Fleet API'],
    impact: [
      { label: 'Food Waste Spoilage', value: '-74%' },
      { label: 'Farmer Income Increase', value: '+35%' },
      { label: 'Monthly Produce Moved', value: '1,400 Tons' }
    ],
    year: '2023'
  },
  {
    id: 'hrnusantara-enterprise-payroll-saas',
    title: 'HRNusantara Enterprise Payroll & PPh 21 SaaS',
    client: 'PT Human Capital Nusantara',
    industry: 'HRTech & Payroll SaaS Indonesia',
    pillar: 'Innovation Development',
    service: 'Web Application',
    featured: false,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200',
    desc: 'Comprehensive Indonesian HR & Payroll platform with automatic TER PPh 21 tax formulas, BPJS Ketenagakerjaan & Kesehatan calculations, GPS attendance, and employee self-service.',
    descId: 'Platform HR & Payroll Indonesia lengkap dengan formula pajak PPh 21 tarif efektif rata-rata (TER), kalkulasi BPJS Ketenagakerjaan & Kesehatan, absensi GPS, dan portal karyawan.',
    challenge: 'Adapting to newly mandated Indonesian PPh 21 TER tax regulations across thousands of multi-tier employee contracts.',
    challengeId: 'Menyesuaikan perhitungan aturan baru tarif pajak PPh 21 TER bagi ribuan karyawan dengan berbagai skema kontrak kerja.',
    solution: 'Engineered an automated payroll engine that computes gross-to-net salaries, generates Bank Transfer bulk payroll files (BCA, Mandiri, BRI), and delivers digital e-payslips.',
    solutionId: 'Membangun engine payroll otomatis yang menghitung gaji bersih, menghasilkan file bulk transfer bank (BCA, Mandiri, BRI), dan mengirim e-slip gaji terenkripsi.',
    deliverables: ['Enterprise HR SaaS Web Application', 'Automated TER PPh 21 Tax Engine', 'Bank Bulk Payroll File Generator', 'Employee Mobile Portal'],
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Prisma', 'PostgreSQL', 'Redis Queue'],
    impact: [
      { label: 'Payroll Processing Time', value: '4 Hours vs 3 Days' },
      { label: 'Tax Calculation Accuracy', value: '100% Audited' },
      { label: 'Active Employees Managed', value: '45,000+' }
    ],
    year: '2024'
  },
  {
    id: 'syncra-collaborative-design-engine',
    title: 'Syncra Collaborative Canvas Web Application',
    client: 'Syncra Inc Global',
    industry: 'Productivity & Creative SaaS Global',
    pillar: 'Innovation Development',
    service: 'Web Application',
    featured: false,
    image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=1200',
    desc: 'Real-time collaborative infinite canvas application supporting 100+ concurrent multi-cursor collaborators, vector drawing, and automated layout generation.',
    descId: 'Aplikasi kanvas kolaboratif real-time yang mendukung 100+ pengguna multi-kursor bersamaan, gambar vektor instan, dan pembuatan layout otomatis.',
    challenge: 'Preventing CRDT operational transformation conflicts during high-frequency concurrent canvas edits.',
    challengeId: 'Mencegah konflik data saat puluhan desainer mengedit kanvas visual yang sama secara bersamaan.',
    solution: 'Implemented WebAssembly-powered CRDT algorithms with WebSockets and GPU-accelerated HTML5 Canvas rendering at 120fps.',
    solutionId: 'Menerapkan algoritma CRDT berbasis WebAssembly dengan WebSockets dan akselerasi grafis GPU kanvas pada 120fps.',
    deliverables: ['Real-time Canvas Web App', 'CRDT Collaboration Server', 'Vector Math Geometry Engine', 'Export Pipeline to SVG/PNG'],
    technologies: ['TypeScript', 'WebAssembly / Rust', 'WebSockets', 'Tailwind CSS', 'WebGL Canvas'],
    impact: [
      { label: 'Concurrent Users / Room', value: '100+ Live' },
      { label: 'Canvas Frame Rate', value: '120fps Smooth' },
      { label: 'Weekly Active Teams', value: '8,500+' }
    ],
    year: '2024'
  },

  // ==========================================
  // 11. ERP / CRM System (Innovation Development) - 5 projects
  // ==========================================
  {
    id: 'pabrik-cikarang-multiplant-erp',
    title: 'Astra Manufaktur Cikarang Multi-Plant ERP System',
    client: 'PT Astra Manufaktur Komponen',
    industry: 'Manufaktur Otomotif & ERP Cikarang-Karawang',
    pillar: 'Innovation Development',
    service: 'ERP / CRM System',
    featured: true,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=1200',
    desc: 'Comprehensive multi-factory ERP system controlling raw sheet metal inventory, CNC machine production schedules, Bill of Materials (BOM), and QC barcode telemetry.',
    descId: 'Sistem ERP manufaktur multi-pabrik yang mengontrol inventaris bahan baku baja, jadwal mesin CNC, Bill of Materials (BOM), dan telemetri barcode QC produk.',
    challenge: 'Production bottlenecks and manual paper job orders led to machine idle times and inventory discrepancy across 3 manufacturing plants.',
    challengeId: 'Hambatan jalur produksi dan surat perintah kerja kertas manual menyebabkan mesin sering menganggur dan selisih stok di 3 pabrik.',
    solution: 'Designed and deployed a unified web ERP with IoT machine telemetry, automated raw material re-ordering, digital job ticket dispatching, and ISO audit tracking.',
    solutionId: 'Merancang dan mengimplementasikan sistem ERP terpadu dengan telemetri mesin IoT, auto re-order bahan baku, SPK digital, dan pelacakan audit mutu ISO.',
    deliverables: ['Multi-Plant Manufacturing ERP', 'BOM & Production Scheduling Module', 'Inventory Barcode Scanner Web App', 'Executive Financial Dashboard'],
    technologies: ['Next.js', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Tailwind CSS'],
    impact: [
      { label: 'Machine Downtime Reduction', value: '-48%' },
      { label: 'Inventory Accuracy', value: '99.8%' },
      { label: 'Annual Operational Savings', value: 'Rp 4.2B+' }
    ],
    year: '2024'
  },
  {
    id: 'kalla-property-crm-sales-pipeline',
    title: 'Kalla Properti Multi-Tenant CRM & Sales Pipeline',
    client: 'PT Kalla Properti Nusantara',
    industry: 'Real Estate & Properti Komersial Indonesia',
    pillar: 'Innovation Development',
    service: 'ERP / CRM System',
    featured: false,
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200',
    desc: 'Enterprise CRM managing property lead attribution, automated WhatsApp follow-ups, unit booking fee lockouts, and mortgage (KPR) banking pipeline tracking.',
    descId: 'Sistem CRM enterprise untuk atribusi leads properti, follow-up otomatis WhatsApp, penguncian booking fee unit, dan pelacakan proses akad KPR bank.',
    challenge: 'Sales agents lost track of high-intent buyers across multiple social channels and lacked real-time unit availability maps.',
    challengeId: 'Agen sales sering kehilangan follow-up prospek pembeli potensial dan tidak memiliki denah ketersediaan unit rumah yang real-time.',
    solution: 'Engineered an omnichannel CRM with 2-way WhatsApp Cloud API, interactive siteplan unit picker, and automated mortgage status alerts.',
    solutionId: 'Membangun CRM omnichannel dengan integrasi WhatsApp Cloud API, denah interaktif pemilihan blok unit rumah, dan notifikasi status pengajuan KPR.',
    deliverables: ['Enterprise Real Estate CRM', 'Interactive Siteplan Unit Lockout', 'WhatsApp Automated Lead Follow-up', 'Commission Calculation Module'],
    technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'WhatsApp Business Cloud API'],
    impact: [
      { label: 'Lead-to-Booking Conversion', value: '+72%' },
      { label: 'Mortgage Approval Speed', value: '12 Days vs 35 Days' },
      { label: 'Property Sales Value', value: 'Rp 680B Tracked' }
    ],
    year: '2024'
  },
  {
    id: 'omniretail-warehouse-pos-erp',
    title: 'Retailindo Nusantara Multi-Warehouse & POS ERP',
    client: 'PT Retailindo Nusantara Makmur',
    industry: 'Retail FMCG & Distribusi Nasional Indonesia',
    pillar: 'Innovation Development',
    service: 'ERP / CRM System',
    featured: false,
    image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=1200',
    desc: 'Centralized ERP connecting 5 regional distribution centers (Jakarta, Surabaya, Medan, Makassar, Bali) with 120+ retail store Point-of-Sale terminals.',
    descId: 'Sistem ERP terpusat yang menghubungkan 5 pusat distribusi regional (Jakarta, Surabaya, Medan, Makassar, Bali) dengan 120+ mesin kasir POS toko.',
    challenge: 'Stock stockouts in high-demand stores while other regional warehouses had excess aging inventory expiring on shelves.',
    challengeId: 'Terjadinya kekosongan stok di toko yang ramai sementara gudang regional lain mengalami kelebihan stok barang yang mendekati kadaluarsa.',
    solution: 'Built an intelligent inter-warehouse transfer algorithm, automated purchase orders based on sales velocity, and offline-capable cloud POS sync.',
    solutionId: 'Membangun algoritma mutasi stok antar-gudang pintar, pembuatan PO otomatis berbasis tren penjualan, dan sinkronisasi POS kasir offline-ready.',
    deliverables: ['Centralized Multi-Warehouse ERP', 'Cloud Point-of-Sale (POS) Module', 'Inter-Warehouse Transfer Optimizer', 'Supplier Procurement Portal'],
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Redis', 'GraphQL'],
    impact: [
      { label: 'Stockout Incidents', value: '-82%' },
      { label: 'Inventory Turnover', value: '+55%' },
      { label: 'Daily Store Transactions', value: '250,000+' }
    ],
    year: '2023'
  },
  {
    id: 'distribusi-farmasi-bpom-erp',
    title: 'Sehat Farma BPOM CDOB Compliant Distribution ERP',
    client: 'PT Sehat Farma Distribusi',
    industry: 'Farmasi & Distribusi Medis Indonesia',
    pillar: 'Innovation Development',
    service: 'ERP / CRM System',
    featured: false,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=1200',
    desc: 'Pharmaceutical distribution ERP built strictly to Indonesian BPOM CDOB standards with batch tracking, cold-storage temperature logs, and e-faktur tax sync.',
    descId: 'Sistem ERP distribusi farmasi berstandar BPOM CDOB dengan pelacakan nomor batch obat, pemantauan suhu cold-chain, dan sinkronisasi e-faktur pajak.',
    challenge: 'Manual batch record keeping failed rapid recall simulations and risked non-compliance during BPOM pharmaceutical audits.',
    challengeId: 'Pencatatan batch obat secara manual gagal saat simulasi penarikan obat cepat dan berisiko melanggar standar audit BPOM.',
    solution: 'Engineered an end-to-end serialized batch tracking ERP with IoT temperature alarm integration and automatic Surat Pesanan (SP) verification.',
    solutionId: 'Membangun ERP pelacakan batch obat terserialisasi dengan alarm sensor suhu otomatis dan verifikasi Surat Pesanan (SP) apotek digital.',
    deliverables: ['BPOM CDOB Compliant ERP', 'Batch Tracking & Recall Engine', 'Pharmacy Electronic Ordering Portal', 'Tax & Invoice Integration'],
    technologies: ['React', 'TypeScript', 'Express.js', 'PostgreSQL', 'Docker', 'IoT Sensor APIs'],
    impact: [
      { label: 'BPOM Audit Score', value: '100% Compliant' },
      { label: 'Recall Identification Time', value: '<60 Seconds' },
      { label: 'Pharmacies Supplied', value: '1,800+ Outlets' }
    ],
    year: '2024'
  },
  {
    id: 'vanguard-global-asset-erp',
    title: 'Vanguard Global Enterprise Resource & Portfolio ERP',
    client: 'Vanguard Enterprise Systems',
    industry: 'Asset Management & Enterprise ERP Global',
    pillar: 'Innovation Development',
    service: 'ERP / CRM System',
    featured: false,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
    desc: 'Multi-entity corporate resource platform unifying cross-border subsidiary accounting, currency hedging calculations, and global compliance filings.',
    descId: 'Platform ERP korporat multi-entitas yang menyatukan pembukuan anak perusahaan lintas negara, lindung nilai valuta asing, dan laporan kepatuhan.',
    challenge: 'Consolidating financial statements across 14 global entities in differing currencies and local tax regulations consumed 3 weeks every quarter.',
    challengeId: 'Konsolidasi laporan keuangan 14 anak perusahaan global memakan waktu hingga 3 minggu setiap kuartal.',
    solution: 'Engineered automated multi-currency journal reconciliation, automated transfer pricing tax modules, and real-time ledger auditing.',
    solutionId: 'Membangun rekonsiliasi jurnal multi-valuta otomatis, modul pajak transfer pricing, dan audit buku besar instan.',
    deliverables: ['Global Multi-Entity ERP Suite', 'Automated Currency Conversion Engine', 'Executive Consolidation Dashboard', 'Tax Compliance Module'],
    technologies: ['Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Tailwind CSS'],
    impact: [
      { label: 'Quarterly Close Time', value: '2 Days vs 21 Days' },
      { label: 'Reconciliation Errors', value: 'Zero Discrepancies' },
      { label: 'Entities Managed', value: '14 Countries' }
    ],
    year: '2024'
  },

  // ==========================================
  // 12. IT Support & Infrastructure (Innovation Development) - 5 projects
  // ==========================================
  {
    id: 'bank-mandiri-mitra-cloud-migration',
    title: 'Mitra Finansial Mandiri 24/7 Cloud Migration & Managed SLA',
    client: 'PT Mitra Finansial Mandiri',
    industry: 'FinTech & Cloud Infrastructure Indonesia',
    pillar: 'Innovation Development',
    service: 'IT Support & Infrastructure',
    featured: true,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1200',
    desc: 'Zero-downtime migration of core banking workloads to Google Cloud Jakarta Region (asia-southeast2) with 99.999% SLA, auto-healing Kubernetes, and 24/7 SOC monitoring.',
    descId: 'Migrasi beban kerja perbankan digital ke Google Cloud Region Jakarta (asia-southeast2) dengan jaminan SLA 99.999%, Kubernetes auto-healing, dan monitoring SOC 24/7.',
    challenge: 'Aging on-premise data centers suffered from hardware bottlenecks and lacked automated disaster recovery failover during peak transactional surges.',
    challengeId: 'Server data center lama sering mengalami bottleneck perangkat keras dan belum memiliki disaster recovery otomatis saat lonjakan transaksi.',
    solution: 'Designed a high-availability multi-zone Kubernetes architecture with automated database sharding, Terraform Infrastructure-as-Code, and sub-second failover.',
    solutionId: 'Merancang arsitektur Kubernetes multi-zona dengan sharding database otomatis, Terraform Infrastructure-as-Code, dan failover pemulihan instan.',
    deliverables: ['Google Cloud Multi-Zone Architecture', 'Terraform Infrastructure as Code (IaC)', '24/7 Security Operations Center (SOC)', 'Zero-Downtime Data Migration'],
    technologies: ['Google Cloud Platform', 'Kubernetes (GKE)', 'Terraform', 'PostgreSQL HA', 'Prometheus & Grafana'],
    impact: [
      { label: 'Uptime Achieved', value: '99.999%' },
      { label: 'Infrastructure Cost Saved', value: '-38%' },
      { label: 'Failover Recovery Time (RTO)', value: '<15 Seconds' }
    ],
    year: '2024'
  },
  {
    id: 'tokopedia-kubernetes-autoscaling-infra',
    title: 'Toko Digital Nusantara Kubernetes Multi-Region Autoscaling',
    client: 'PT Toko Digital Nusantara',
    industry: 'E-Commerce Cloud Architecture Indonesia',
    pillar: 'Innovation Development',
    service: 'IT Support & Infrastructure',
    featured: false,
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200',
    desc: 'Robust DevOps CI/CD pipeline and multi-region Kubernetes cluster autoscaling engineered to withstand 50x flash sale traffic spikes during national shopping festivals.',
    descId: 'Pipeline DevOps CI/CD dan kluster Kubernetes multi-region yang dirancang mampu menahan lonjakan trafik 50x lipat saat festival belanja nasional.',
    challenge: 'Sudden traffic surges during midnight flash sales overloaded container pods and caused sporadic checkout timeouts.',
    challengeId: 'Lonjakan trafik mendadak saat promo tengah malam membebani pod server dan menyebabkan sebagian pengguna mengalami timeout checkout.',
    solution: 'Implemented predictive horizontal pod autoscaling (KEDA), Redis cluster caching, Cloudflare Enterprise DDoS mitigation, and blue-green deployments.',
    solutionId: 'Menerapkan horizontal pod autoscaling prediktif (KEDA), cluster cache Redis, mitigasi proteksi DDoS Cloudflare, dan deployment blue-green tanpa jeda.',
    deliverables: ['High-Concurrency Kubernetes Architecture', 'Automated GitLab CI/CD Pipeline', 'DDoS Protection & Cloudflare Edge Rules', 'Real-Time Telemetry Dashboard'],
    technologies: ['Kubernetes', 'KEDA Autoscaler', 'Terraform', 'Redis Cluster', 'GitLab CI', 'Datadog'],
    impact: [
      { label: 'Flash Sale Peak Requests', value: '850K Req/Sec' },
      { label: 'Checkout Success Rate', value: '99.98%' },
      { label: 'Deployment Time', value: '4 Mins vs 45 Mins' }
    ],
    year: '2024'
  },
  {
    id: 'rs-pondok-indah-hybrid-cloud-infra',
    title: 'RS Pondok Indah Group Hybrid Cloud & PACS Archiving',
    client: 'PT Rumah Sakit Pondok Indah Group',
    industry: 'Healthcare IT & Infrastruktur Medis Indonesia',
    pillar: 'Innovation Development',
    service: 'IT Support & Infrastructure',
    featured: false,
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200',
    desc: 'High-speed medical PACS imaging storage and hybrid cloud infrastructure enabling doctors to retrieve high-resolution MRI and CT scans in under 2 seconds across all hospital branches.',
    descId: 'Infrastruktur hybrid cloud dan sistem arsip gambar medis PACS yang memungkinkan dokter membuka hasil scan MRI & CT Scan resolusi tinggi dalam 2 detik di seluruh cabang RS.',
    challenge: 'Massive gigabyte-sized radiology DICOM files clogged internal hospital local networks, delaying emergency diagnosis reviews.',
    challengeId: 'File radiologi DICOM berukuran gigabyte memperlambat jaringan internal rumah sakit dan menunda review diagnosa darurat dokter.',
    solution: 'Built a tiered hybrid cloud archive with local NVMe caching, fiber optic interconnects between hospital branches, and immutable backup snapshots.',
    solutionId: 'Membangun sistem arsip hybrid cloud dengan cache NVMe lokal, interkoneksi fiber optik antar-cabang RS, dan backup data terenkripsi.',
    deliverables: ['Hospital PACS Hybrid Cloud Architecture', 'Inter-Branch Fiber Interconnect Setup', 'Immutable Disaster Recovery Backups', '24/7 IT Infrastructure SLA'],
    technologies: ['AWS / GCP Hybrid', 'TrueNAS Enterprise', 'Kubernetes', 'DICOM PACS Protocols', 'WireGuard VPN'],
    impact: [
      { label: 'Scan Retrieval Speed', value: '1.4s vs 35s' },
      { label: 'Data Redundancy', value: '99.9999999%' },
      { label: 'Doctor Diagnosis Speed', value: '+45%' }
    ],
    year: '2023'
  },
  {
    id: 'telkomsel-partner-devops-cicd',
    title: 'Telekomunikasi Partner DevOps Automation & 24/7 SLA',
    client: 'PT Telekomunikasi Partner Nusantara',
    industry: 'Telekomunikasi & DevOps Indonesia',
    pillar: 'Innovation Development',
    service: 'IT Support & Infrastructure',
    featured: false,
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200',
    desc: 'Fully automated enterprise GitOps CI/CD delivery pipeline for 80+ microservices with automated security vulnerability scanning and guaranteed 15-minute response SLA.',
    descId: 'Pipeline otomatisasi GitOps CI/CD enterprise untuk 80+ microservices dengan pemindaian kerentanan keamanan otomatis dan garansi SLA respon 15 menit.',
    challenge: 'Manual release deployments caused production bugs, long release cycles, and configuration drift across staging and production environments.',
    challengeId: 'Rilis pembaruan manual sering menimbulkan bug, siklus rilis berminggu-minggu, dan perbedaan konfigurasi antar server.',
    solution: 'Architected ArgoCD GitOps pipelines with automated vulnerability scanning (SonarQube, Trivy), canary release rollouts, and 24/7 on-call engineers.',
    solutionId: 'Menerapkan pipeline ArgoCD GitOps dengan pemindaian keamanan otomatis (SonarQube, Trivy), rilis bertahap canary, dan tim insinyur on-call 24/7.',
    deliverables: ['GitOps ArgoCD Deployment Pipeline', 'Automated Security Vulnerability Scanning', 'Infrastructure Monitoring & Alerting', 'Dedicated 24/7 SLA Support'],
    technologies: ['ArgoCD', 'Kubernetes', 'SonarQube', 'Trivy', 'Prometheus', 'Slack Ops Bot'],
    impact: [
      { label: 'Deployment Frequency', value: '45x per Week' },
      { label: 'Change Failure Rate', value: '<0.2%' },
      { label: 'Mean Time to Recovery (MTTR)', value: '<8 Mins' }
    ],
    year: '2024'
  },
  {
    id: 'apex-global-low-latency-server-fleet',
    title: 'Apex Global Multi-Region Low-Latency Server Fleet',
    client: 'Apex Games Global',
    industry: 'Gaming Cloud Infrastructure Global',
    pillar: 'Innovation Development',
    service: 'IT Support & Infrastructure',
    featured: false,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200',
    desc: 'Global bare-metal edge server fleet operating across 16 worldwide locations ensuring sub-20ms game ping times for 2.5 million concurrent multiplayer gamers.',
    descId: 'Infrastruktur server edge bare-metal global di 16 lokasi dunia untuk menjamin ping game di bawah 20ms bagi 2,5 juta gamer multiplayer bersamaan.',
    challenge: 'High packet loss and jitter during cross-continent matchmaking caused player disconnections and competitive ranking frustration.',
    challengeId: 'Tingginya packet loss dan lag jaringan saat matchmaking antar-benua menyebabkan pemain terputus dari server game.',
    solution: 'Deployed custom Anycast BGP routing, UDP packet optimization proxies, and automated server scaling based on match demand.',
    solutionId: 'Menerapkan perutean Anycast BGP kustom, optimasi paket protokol UDP, dan penambahan server otomatis berbasis kebutuhan pertandingan.',
    deliverables: ['16-Region Edge Server Fleet', 'Anycast BGP Low-Latency Routing', 'Anti-DDoS Game Shielding Engine', '24/7 Global Infrastructure NOC'],
    technologies: ['Bare-Metal Linux', 'Anycast BGP', 'Docker', 'WireGuard', 'Grafana Enterprise'],
    impact: [
      { label: 'Global Average Game Ping', value: '<18ms' },
      { label: 'Concurrent Players Hosted', value: '2.5M+' },
      { label: 'DDoS Attacks Mitigated', value: '100% Defended' }
    ],
    year: '2024'
  }
].map((project) => ({ ...project, slug: project.id }));