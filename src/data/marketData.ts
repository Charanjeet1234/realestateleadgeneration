export interface Property {
  id: string;
  title: string;
  tagline: string;
  developer: string;
  developerTier: 'Tier 1 Ultra' | 'Prime Master' | 'Boutique Luxury' | 'High Yield Value';
  emirate: 'Dubai' | 'Abu Dhabi';
  community: string;
  category: 'Off-Plan' | 'Ready Apartments' | 'Ready Villas' | 'Annual Rent' | 'Short-Term Holiday';
  unitTypes: ('Studio' | '1BR' | '2BR' | '3BR+' | 'Villa/Townhouse' | 'Penthouse')[];
  priceAED: number;
  priceUSD: number;
  priceRangeFormatted: string;
  rentalBenchmarkAED?: string;
  handoverDate?: string; // e.g. "Q4 2026", "Ready", "Q2 2027"
  paymentPlan?: {
    summary: string;
    downPayment: string;
    duringConstruction: string;
    onHandover: string;
    postHandover?: string;
  };
  rentalFactors?: {
    chequesAccepted: '1 Cheque' | '2 Cheques' | '4 Cheques' | 'Up to 6 Cheques';
    estimatedServiceCharge: string;
    securityDeposit: string;
    minTerm: string;
  };
  projectedROI: number; // in percent e.g. 7.4
  capitalGrowthForecast: string; // e.g. "+24% by Q4 2026"
  goldenVisaEligible: boolean; // AED 2M+
  imageUrl: string;
  featured: boolean;
  dldCosts: {
    registrationFeeAED: number;
    adminFeeAED: number;
    agencyFeeAED: number;
    oqoodOrDeedAED: number;
  };
  highlights: string[];
  floorPlanCount: number;
}

export interface CommunityBenchmark {
  community: string;
  emirate: 'Dubai' | 'Abu Dhabi';
  avgPriceSqftAED: number;
  studioRentAED: string;
  oneBedRentAED: string;
  twoBedRentAED: string;
  threeBedRentAED: string;
  villaRentAED?: string;
  avgYield: string;
  chequeNorm: string;
  serviceChargePerSqft: string;
  topDeveloper: string;
  growthYoY: string;
  rentalTrend: 'Surging' | 'High Demand' | 'Stable Prime' | 'Accelerating';
}

export interface DeveloperInfo {
  name: string;
  emirate: 'Dubai' | 'Abu Dhabi';
  establishedYear: number;
  completedProjects: number;
  activeProjects: number;
  signatureMasterpieces: string[];
  reputationSummary: string;
  standardPaymentPlan: string;
  onTimeDeliveryRate: string;
  logoInitial: string;
}

export const DUBAI_COMMUNITIES = [
  'Downtown Dubai',
  'Dubai Marina',
  'Palm Jumeirah',
  'Business Bay',
  'Jumeirah Village Circle (JVC)',
  'Dubai Hills Estate',
  'Dubai Creek Harbour',
  'Dubai South',
  'MBK City',
  'Arabian Ranches',
  'DAMAC Hills',
  'Motor City',
  'Meydan',
] as const;

export const ABU_DHABI_COMMUNITIES = [
  'Saadiyat Island',
  'Yas Island',
  'Al Reem Island',
  'Al Raha Beach',
  'Yas Bay',
  'Jubail Island',
  'Al Shamkha',
] as const;

export const ALL_COMMUNITIES = [...DUBAI_COMMUNITIES, ...ABU_DHABI_COMMUNITIES];

export const DUBAI_DEVELOPERS = [
  'Emaar',
  'DAMAC',
  'Sobha Realty',
  'Nakheel',
  'Meraas',
  'Ellington',
  'Binghatti',
  'Danube',
  'Select Group',
  'Omniyat',
  'Union Properties',
] as const;

export const ABU_DHABI_DEVELOPERS = [
  'Aldar Properties',
  'Q Properties',
  'Bloom Holding',
  'IMKAN',
  'Modon Properties',
] as const;

export const ALL_DEVELOPERS = [...DUBAI_DEVELOPERS, ...ABU_DHABI_DEVELOPERS];

// Live Rental Benchmarks index across all key communities
export const LIVE_RENTAL_BENCHMARKS: CommunityBenchmark[] = [
  {
    community: 'Downtown Dubai',
    emirate: 'Dubai',
    avgPriceSqftAED: 2650,
    studioRentAED: 'AED 80,000 – 95,000',
    oneBedRentAED: 'AED 115,000 – 145,000',
    twoBedRentAED: 'AED 150,000 – 210,000',
    threeBedRentAED: 'AED 280,000 – 450,000',
    avgYield: '5.8% – 6.6%',
    chequeNorm: '1–2 Cheques preferred',
    serviceChargePerSqft: 'AED 22 – 32 / sqft',
    topDeveloper: 'Emaar Properties',
    growthYoY: '+16.2%',
    rentalTrend: 'Surging',
  },
  {
    community: 'Dubai Marina',
    emirate: 'Dubai',
    avgPriceSqftAED: 2150,
    studioRentAED: 'AED 68,000 – 82,000',
    oneBedRentAED: 'AED 90,000 – 120,000',
    twoBedRentAED: 'AED 140,000 – 190,000',
    threeBedRentAED: 'AED 230,000 – 360,000',
    avgYield: '6.4% – 7.2%',
    chequeNorm: '1–4 Cheques',
    serviceChargePerSqft: 'AED 16 – 24 / sqft',
    topDeveloper: 'Select Group / Emaar',
    growthYoY: '+14.8%',
    rentalTrend: 'High Demand',
  },
  {
    community: 'Palm Jumeirah',
    emirate: 'Dubai',
    avgPriceSqftAED: 3850,
    studioRentAED: 'AED 110,000 – 135,000',
    oneBedRentAED: 'AED 165,000 – 240,000',
    twoBedRentAED: 'AED 260,000 – 420,000',
    threeBedRentAED: 'AED 500,000 – 1,100,000',
    villaRentAED: 'AED 900,000 – 3,500,000',
    avgYield: '5.2% – 6.1%',
    chequeNorm: '1–2 Cheques',
    serviceChargePerSqft: 'AED 24 – 38 / sqft',
    topDeveloper: 'Nakheel / Omniyat',
    growthYoY: '+24.5%',
    rentalTrend: 'Surging',
  },
  {
    community: 'Business Bay',
    emirate: 'Dubai',
    avgPriceSqftAED: 2050,
    studioRentAED: 'AED 62,000 – 74,000',
    oneBedRentAED: 'AED 82,000 – 110,000',
    twoBedRentAED: 'AED 130,000 – 175,000',
    threeBedRentAED: 'AED 210,000 – 320,000',
    avgYield: '6.8% – 7.5%',
    chequeNorm: '1–4 Cheques',
    serviceChargePerSqft: 'AED 15 – 22 / sqft',
    topDeveloper: 'DAMAC / Omniyat',
    growthYoY: '+15.1%',
    rentalTrend: 'High Demand',
  },
  {
    community: 'Jumeirah Village Circle (JVC)',
    emirate: 'Dubai',
    avgPriceSqftAED: 1250,
    studioRentAED: 'AED 45,000 – 56,000',
    oneBedRentAED: 'AED 65,000 – 80,000',
    twoBedRentAED: 'AED 90,000 – 125,000',
    threeBedRentAED: 'AED 135,000 – 170,000',
    villaRentAED: 'AED 170,000 – 240,000',
    avgYield: '7.8% – 8.7%',
    chequeNorm: '2–4 Cheques',
    serviceChargePerSqft: 'AED 11 – 15 / sqft',
    topDeveloper: 'Danube / Binghatti / Ellington',
    growthYoY: '+18.4%',
    rentalTrend: 'Accelerating',
  },
  {
    community: 'Dubai Hills Estate',
    emirate: 'Dubai',
    avgPriceSqftAED: 2200,
    studioRentAED: 'AED 62,000 – 72,000',
    oneBedRentAED: 'AED 85,000 – 105,000',
    twoBedRentAED: 'AED 135,000 – 175,000',
    threeBedRentAED: 'AED 220,000 – 310,000',
    villaRentAED: 'AED 290,000 – 650,000',
    avgYield: '6.5% – 7.3%',
    chequeNorm: '1–2 Cheques',
    serviceChargePerSqft: 'AED 14 – 19 / sqft',
    topDeveloper: 'Emaar Properties',
    growthYoY: '+17.0%',
    rentalTrend: 'High Demand',
  },
  {
    community: 'Dubai Creek Harbour',
    emirate: 'Dubai',
    avgPriceSqftAED: 2100,
    studioRentAED: 'AED 58,000 – 68,000',
    oneBedRentAED: 'AED 82,000 – 102,000',
    twoBedRentAED: 'AED 130,000 – 165,000',
    threeBedRentAED: 'AED 210,000 – 290,000',
    avgYield: '6.6% – 7.4%',
    chequeNorm: '1–3 Cheques',
    serviceChargePerSqft: 'AED 16 – 22 / sqft',
    topDeveloper: 'Emaar Properties',
    growthYoY: '+15.8%',
    rentalTrend: 'High Demand',
  },
  {
    community: 'Dubai South',
    emirate: 'Dubai',
    avgPriceSqftAED: 1100,
    studioRentAED: 'AED 38,000 – 48,000',
    oneBedRentAED: 'AED 52,000 – 66,000',
    twoBedRentAED: 'AED 75,000 – 95,000',
    threeBedRentAED: 'AED 110,000 – 140,000',
    villaRentAED: 'AED 145,000 – 210,000',
    avgYield: '8.2% – 9.1%',
    chequeNorm: '2–4 Cheques',
    serviceChargePerSqft: 'AED 9 – 13 / sqft',
    topDeveloper: 'Emaar South / Danube',
    growthYoY: '+21.3%',
    rentalTrend: 'Surging',
  },
  {
    community: 'Saadiyat Island',
    emirate: 'Abu Dhabi',
    avgPriceSqftAED: 2450,
    studioRentAED: 'AED 72,000 – 85,000',
    oneBedRentAED: 'AED 105,000 – 135,000',
    twoBedRentAED: 'AED 160,000 – 220,000',
    threeBedRentAED: 'AED 260,000 – 380,000',
    villaRentAED: 'AED 420,000 – 1,200,000',
    avgYield: '6.3% – 7.1%',
    chequeNorm: '1–2 Cheques',
    serviceChargePerSqft: 'AED 18 – 28 / sqft',
    topDeveloper: 'Aldar Properties',
    growthYoY: '+23.8%',
    rentalTrend: 'Surging',
  },
  {
    community: 'Yas Island',
    emirate: 'Abu Dhabi',
    avgPriceSqftAED: 1850,
    studioRentAED: 'AED 55,000 – 68,000',
    oneBedRentAED: 'AED 78,000 – 98,000',
    twoBedRentAED: 'AED 115,000 – 155,000',
    threeBedRentAED: 'AED 180,000 – 260,000',
    villaRentAED: 'AED 240,000 – 480,000',
    avgYield: '6.9% – 7.7%',
    chequeNorm: '1–3 Cheques',
    serviceChargePerSqft: 'AED 14 – 20 / sqft',
    topDeveloper: 'Aldar Properties',
    growthYoY: '+19.2%',
    rentalTrend: 'High Demand',
  },
  {
    community: 'Al Reem Island',
    emirate: 'Abu Dhabi',
    avgPriceSqftAED: 1400,
    studioRentAED: 'AED 46,000 – 58,000',
    oneBedRentAED: 'AED 62,000 – 78,000',
    twoBedRentAED: 'AED 88,000 – 118,000',
    threeBedRentAED: 'AED 135,000 – 185,000',
    avgYield: '7.4% – 8.2%',
    chequeNorm: '2–4 Cheques',
    serviceChargePerSqft: 'AED 12 – 16 / sqft',
    topDeveloper: 'Aldar / Bloom Holding',
    growthYoY: '+13.5%',
    rentalTrend: 'Stable Prime',
  },
];

// Developer Profiles
export const DEVELOPERS_DATABASE: DeveloperInfo[] = [
  {
    name: 'Emaar',
    emirate: 'Dubai',
    establishedYear: 1997,
    completedProjects: 105,
    activeProjects: 24,
    signatureMasterpieces: ['Burj Khalifa', 'Downtown Dubai', 'Dubai Mall', 'Dubai Hills Estate', 'Dubai Creek Harbour'],
    reputationSummary: 'UAE flagship master-developer known for global icons, master-planned self-sufficient communities, and premium asset retention.',
    standardPaymentPlan: '80/20 (10% Booking, 70% during construction, 20% on completion)',
    onTimeDeliveryRate: '98.4%',
    logoInitial: 'EM',
  },
  {
    name: 'Aldar Properties',
    emirate: 'Abu Dhabi',
    establishedYear: 2004,
    completedProjects: 78,
    activeProjects: 18,
    signatureMasterpieces: ['Saadiyat Grove', 'Yas Acres', 'Louvre Abu Dhabi Residences', 'The Gate Towers', 'Al Raha Beach'],
    reputationSummary: 'The dominant sovereign-backed master developer of Abu Dhabi, setting the benchmark for sustainable island living and cultural capital.',
    standardPaymentPlan: '60/40 or 70/30 (10% Booking, linked to construction milestones)',
    onTimeDeliveryRate: '97.2%',
    logoInitial: 'AL',
  },
  {
    name: 'Sobha Realty',
    emirate: 'Dubai',
    establishedYear: 1976,
    completedProjects: 52,
    activeProjects: 12,
    signatureMasterpieces: ['Sobha Hartland', 'Sobha Hartland II', 'Sobha SeaHaven', 'Verde'],
    reputationSummary: 'Renowned for backward integration, in-house master craftsmenship, German architectural engineering, and zero-defect handover policy.',
    standardPaymentPlan: '60/40 or 80/20 (20% Down, 40-60% during construction, remainder on handover)',
    onTimeDeliveryRate: '99.1%',
    logoInitial: 'SB',
  },
  {
    name: 'Ellington',
    emirate: 'Dubai',
    establishedYear: 2014,
    completedProjects: 26,
    activeProjects: 14,
    signatureMasterpieces: ['Ellington Beach House (Palm)', 'Ocean House', 'DT1', 'Wilton Terraces', 'Belgravia'],
    reputationSummary: 'Dubai boutique design pioneer celebrated for resort-style hospitality amenities, artisanal finishes, and ultra-high tenant appeal.',
    standardPaymentPlan: '70/30 (20% Down, 50% during construction, 30% on handover)',
    onTimeDeliveryRate: '96.8%',
    logoInitial: 'EL',
  },
  {
    name: 'Danube',
    emirate: 'Dubai',
    establishedYear: 1993,
    completedProjects: 38,
    activeProjects: 16,
    signatureMasterpieces: ['Sportz by Danube', 'Oceanz', 'Bayz 102', 'Opalz', 'Diamondz'],
    reputationSummary: 'Trailblazer of the revolutionary 1% monthly payment plan, offering luxury furnished units with 40+ presidential amenities.',
    standardPaymentPlan: '65/35 with 1% monthly installments and up to 35-month post-handover terms',
    onTimeDeliveryRate: '95.5%',
    logoInitial: 'DN',
  },
  {
    name: 'DAMAC',
    emirate: 'Dubai',
    establishedYear: 2002,
    completedProjects: 92,
    activeProjects: 21,
    signatureMasterpieces: ['DAMAC Lagoons', 'DAMAC Hills', 'DAMAC Bay by Cavalli', 'Safa One & Two by de GRISOGONO'],
    reputationSummary: 'Pioneer of branded luxury real estate partnered with global fashion icons (Cavalli, Fendi, de Grisogono).',
    standardPaymentPlan: '70/30 or 60/40 milestone plans with generous cash investor incentives',
    onTimeDeliveryRate: '94.2%',
    logoInitial: 'DM',
  },
  {
    name: 'Binghatti',
    emirate: 'Dubai',
    establishedYear: 2008,
    completedProjects: 45,
    activeProjects: 19,
    signatureMasterpieces: ['Bugatti Residences', 'Mercedes-Benz Places', 'Burj Binghatti Jacob & Co Residences', 'Binghatti Hills'],
    reputationSummary: 'Hyper-tower developer creating branded architectural marvels with fastest-in-market construction velocity.',
    standardPaymentPlan: '70/30 (20% Down, 50% during construction, 30% on handover)',
    onTimeDeliveryRate: '98.0%',
    logoInitial: 'BG',
  },
  {
    name: 'Omniyat',
    emirate: 'Dubai',
    establishedYear: 2005,
    completedProjects: 18,
    activeProjects: 8,
    signatureMasterpieces: ['The Opus by Zaha Hadid', 'One at Palm Jumeirah (Dorchester)', 'AVA at Palm Jumeirah', 'ORLA'],
    reputationSummary: 'Ultra-high-net-worth trophy developer exclusively collaborating with starchitects and Dorchester Collection hospitality.',
    standardPaymentPlan: '50/50 (10% Booking, 40% during construction, 50% on Handover)',
    onTimeDeliveryRate: '97.5%',
    logoInitial: 'OM',
  },
];

// Rich Property Inventory Catalog
export const PROPERTIES_DATABASE: Property[] = [
  {
    id: 'prop-1',
    title: 'The Haven Waterfront Residences',
    tagline: 'Signature Luxury by Emaar with Panoramic Skyline Views',
    developer: 'Emaar',
    developerTier: 'Tier 1 Ultra',
    emirate: 'Dubai',
    community: 'Dubai Creek Harbour',
    category: 'Off-Plan',
    unitTypes: ['1BR', '2BR', '3BR+'],
    priceAED: 1750000,
    priceUSD: 476800,
    priceRangeFormatted: 'AED 1.75M – 4.2M',
    rentalBenchmarkAED: 'Est. AED 125,000/yr',
    handoverDate: 'Q3 2027',
    paymentPlan: {
      summary: '80/20 Construction Linked',
      downPayment: '10% on Booking',
      duringConstruction: '70% in linked milestones',
      onHandover: '20% on 100% completion',
    },
    projectedROI: 7.2,
    capitalGrowthForecast: '+26% projected upon metro extension link',
    goldenVisaEligible: false,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    dldCosts: {
      registrationFeeAED: 70000,
      adminFeeAED: 4200,
      agencyFeeAED: 35000,
      oqoodOrDeedAED: 3000,
    },
    highlights: ['Direct Creek Marina Promenade', 'Infinity Sky Pool facing Burj Khalifa', 'Private Yacht Berth Access', 'Smart Home Automation'],
    floorPlanCount: 6,
  },
  {
    id: 'prop-2',
    title: 'Saadiyat Lagoons Sanctuary',
    tagline: 'Eco-Luxury Nature Villas on Abu Dhabi Cultural Coastline',
    developer: 'Aldar Properties',
    developerTier: 'Prime Master',
    emirate: 'Abu Dhabi',
    community: 'Saadiyat Island',
    category: 'Off-Plan',
    unitTypes: ['Villa/Townhouse', '3BR+'],
    priceAED: 6950000,
    priceUSD: 1893700,
    priceRangeFormatted: 'AED 6.95M – 13.8M',
    rentalBenchmarkAED: 'Est. AED 480,000/yr',
    handoverDate: 'Q2 2027',
    paymentPlan: {
      summary: '60/40 Milestone Linked',
      downPayment: '10% on Booking',
      duringConstruction: '50% during structural build',
      onHandover: '40% upon Key Handover',
    },
    projectedROI: 6.8,
    capitalGrowthForecast: '+32% backed by Guggenheim & Zayed Museum debuts',
    goldenVisaEligible: true,
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    dldCosts: {
      registrationFeeAED: 139000, // 2% DMT
      adminFeeAED: 2000,
      agencyFeeAED: 139000, // 2% agency
      oqoodOrDeedAED: 1000,
    },
    highlights: ['Steps from Saadiyat White Sand Beach', '10-Year Golden Visa Included', 'Solar & Estidama Pearl Certified', 'Private Infinity Lagoon'],
    floorPlanCount: 8,
  },
  {
    id: 'prop-3',
    title: 'Ellington Beach House',
    tagline: 'Artisanal Palm Jumeirah Oceanfront Sanctuary',
    developer: 'Ellington',
    developerTier: 'Boutique Luxury',
    emirate: 'Dubai',
    community: 'Palm Jumeirah',
    category: 'Ready Apartments',
    unitTypes: ['2BR', '3BR+', 'Penthouse'],
    priceAED: 11500000,
    priceUSD: 3133500,
    priceRangeFormatted: 'AED 11.5M – 24M',
    rentalBenchmarkAED: 'AED 650,000/yr (Actual rental)',
    handoverDate: 'Ready / Immediate Handover',
    paymentPlan: {
      summary: '100% Cash / Mortgage Ready',
      downPayment: '20% Deposit',
      duringConstruction: 'N/A (Ready Property)',
      onHandover: '80% Balance via Bank Mortgage or Transfer',
    },
    projectedROI: 6.2,
    capitalGrowthForecast: 'Prime Palm beachfront historical +24% YoY',
    goldenVisaEligible: true,
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    dldCosts: {
      registrationFeeAED: 460000, // 4% DLD
      adminFeeAED: 4200,
      agencyFeeAED: 230000, // 2% agency
      oqoodOrDeedAED: 580,
    },
    highlights: ['Private Beach Club with Cabanas', 'Turnkey Designer Furniture Package', 'Hotel Concierge & Valet Service', 'Direct Arabian Gulf Views'],
    floorPlanCount: 5,
  },
  {
    id: 'prop-4',
    title: 'Sportz by Danube — High Yield Tower',
    tagline: 'Revolutionary 1% Monthly Plan in High Cash-Flow Corridor',
    developer: 'Danube',
    developerTier: 'High Yield Value',
    emirate: 'Dubai',
    community: 'Dubai South',
    category: 'Off-Plan',
    unitTypes: ['Studio', '1BR', '2BR'],
    priceAED: 720000,
    priceUSD: 196180,
    priceRangeFormatted: 'AED 720K – 1.45M',
    rentalBenchmarkAED: 'Est. AED 58,000/yr',
    handoverDate: 'Q4 2026',
    paymentPlan: {
      summary: '1% Monthly Payment Plan (65/35)',
      downPayment: '10% on Booking + 10% in 60 days',
      duringConstruction: '45% (1% Monthly across 45 months)',
      onHandover: 'N/A',
      postHandover: '35% (1% Monthly post-handover across 35 months)',
    },
    projectedROI: 8.6,
    capitalGrowthForecast: '+28% driven by Al Maktoum Int Airport expansion',
    goldenVisaEligible: false,
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    dldCosts: {
      registrationFeeAED: 28800,
      adminFeeAED: 4200,
      agencyFeeAED: 14400,
      oqoodOrDeedAED: 3000,
    },
    highlights: ['1% Monthly Payment Plan', '40+ Olympic Sports Amenities', 'Fully Furnished with European Appliances', 'Highest Net Yields in Dubai'],
    floorPlanCount: 4,
  },
  {
    id: 'prop-5',
    title: 'Sobha Hartland II Waterfront Estate',
    tagline: 'German Engineering Meets Crystal Lagoons in Downtown MBR',
    developer: 'Sobha Realty',
    developerTier: 'Tier 1 Ultra',
    emirate: 'Dubai',
    community: 'MBK City',
    category: 'Off-Plan',
    unitTypes: ['1BR', '2BR', '3BR+', 'Villa/Townhouse'],
    priceAED: 2150000,
    priceUSD: 585800,
    priceRangeFormatted: 'AED 2.15M – 7.8M',
    rentalBenchmarkAED: 'Est. AED 145,000/yr',
    handoverDate: 'Q1 2027',
    paymentPlan: {
      summary: '60/40 Construction Linked',
      downPayment: '20% on Booking',
      duringConstruction: '40% in milestones',
      onHandover: '40% on completion',
    },
    projectedROI: 7.5,
    capitalGrowthForecast: '+22% projected appreciation',
    goldenVisaEligible: true,
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    dldCosts: {
      registrationFeeAED: 86000,
      adminFeeAED: 4200,
      agencyFeeAED: 43000,
      oqoodOrDeedAED: 3000,
    },
    highlights: ['Crystal Water Lagoon with Boardwalk', 'Backward Integrated Zero-Defect Handover', '100% Golden Visa Eligible', '5 Mins to Downtown Dubai'],
    floorPlanCount: 6,
  },
  {
    id: 'prop-6',
    title: 'Yas Golf Collection Residences',
    tagline: 'Frontline Championship Course Living by Aldar',
    developer: 'Aldar Properties',
    developerTier: 'Prime Master',
    emirate: 'Abu Dhabi',
    community: 'Yas Island',
    category: 'Annual Rent',
    unitTypes: ['1BR', '2BR'],
    priceAED: 92000, // Annual Rent
    priceUSD: 25060,
    priceRangeFormatted: 'AED 92,000 / year',
    rentalBenchmarkAED: 'AED 92,000/yr (Annual Contract)',
    rentalFactors: {
      chequesAccepted: '2 Cheques',
      estimatedServiceCharge: 'Included in rent',
      securityDeposit: '5% Unfurnished (AED 4,600)',
      minTerm: '12 Months Ejari / Tawtheeq',
    },
    projectedROI: 7.2,
    capitalGrowthForecast: 'N/A (Rental Contract)',
    goldenVisaEligible: false,
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    dldCosts: {
      registrationFeeAED: 1840, // Tawtheeq registration
      adminFeeAED: 500,
      agencyFeeAED: 4600, // 5% rental agency fee
      oqoodOrDeedAED: 0,
    },
    highlights: ['Yas Links Golf Course Views', 'Fully Furnished Scandinavian Style', 'Direct Access to Yas Theme Parks', '2 Cheques accepted'],
    floorPlanCount: 3,
  },
  {
    id: 'prop-7',
    title: 'Downtown Opera Grand Signature Suite',
    tagline: 'Front Row Opera & Burj Khalifa Fountain Residence',
    developer: 'Emaar',
    developerTier: 'Tier 1 Ultra',
    emirate: 'Dubai',
    community: 'Downtown Dubai',
    category: 'Ready Apartments',
    unitTypes: ['2BR', '3BR+'],
    priceAED: 3850000,
    priceUSD: 1049000,
    priceRangeFormatted: 'AED 3.85M – 5.9M',
    rentalBenchmarkAED: 'AED 210,000/yr',
    handoverDate: 'Ready / Immediate',
    paymentPlan: {
      summary: '100% Cash or 80/20 Mortgage',
      downPayment: '20% down',
      duringConstruction: 'N/A',
      onHandover: '80% balance on deed transfer',
    },
    projectedROI: 6.4,
    capitalGrowthForecast: 'Consistently +15% annual capital demand',
    goldenVisaEligible: true,
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    dldCosts: {
      registrationFeeAED: 154000,
      adminFeeAED: 4200,
      agencyFeeAED: 77000,
      oqoodOrDeedAED: 580,
    },
    highlights: ['Unobstructed Dubai Fountain Views', 'Rooftop Pool & Private Health Club', 'Golden Visa Eligibility', 'Direct Skybridge to Dubai Mall'],
    floorPlanCount: 4,
  },
  {
    id: 'prop-8',
    title: 'Binghatti Hills at Dubai Science Park',
    tagline: 'Modern Architectural Marvel with Resort-Inspired Amenities',
    developer: 'Binghatti',
    developerTier: 'High Yield Value',
    emirate: 'Dubai',
    community: 'Motor City',
    category: 'Off-Plan',
    unitTypes: ['Studio', '1BR', '2BR'],
    priceAED: 890000,
    priceUSD: 242500,
    priceRangeFormatted: 'AED 890K – 1.65M',
    rentalBenchmarkAED: 'Est. AED 72,000/yr',
    handoverDate: 'Q2 2026',
    paymentPlan: {
      summary: '70/30 Flexible Construction Linked',
      downPayment: '20% on Booking',
      duringConstruction: '50% during construction',
      onHandover: '30% upon Handover',
    },
    projectedROI: 8.4,
    capitalGrowthForecast: '+24% appreciation forecast',
    goldenVisaEligible: false,
    imageUrl: 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    dldCosts: {
      registrationFeeAED: 35600,
      adminFeeAED: 4200,
      agencyFeeAED: 17800,
      oqoodOrDeedAED: 3000,
    },
    highlights: ['Private Jacuzzi Balconies', 'Smart AI Home Tech', 'Paddle Tennis Courts & Wave Pool', '8.4% Net Yield Target'],
    floorPlanCount: 3,
  },
  {
    id: 'prop-9',
    title: 'Arabian Ranches III — Sun Townhouses',
    tagline: 'Family Haven with Championship Green Belt & Splash Parks',
    developer: 'Emaar',
    developerTier: 'Tier 1 Ultra',
    emirate: 'Dubai',
    community: 'Arabian Ranches',
    category: 'Ready Villas',
    unitTypes: ['Villa/Townhouse', '3BR+'],
    priceAED: 3250000,
    priceUSD: 885500,
    priceRangeFormatted: 'AED 3.25M – 4.4M',
    rentalBenchmarkAED: 'AED 220,000/yr',
    handoverDate: 'Ready for Move-In',
    paymentPlan: {
      summary: 'Cash / Mortgage Pre-Approved',
      downPayment: '20% Cash Deposit',
      duringConstruction: 'N/A',
      onHandover: '80% Balance',
    },
    projectedROI: 6.9,
    capitalGrowthForecast: 'Established high-demand expat family hub',
    goldenVisaEligible: true,
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    dldCosts: {
      registrationFeeAED: 130000,
      adminFeeAED: 4200,
      agencyFeeAED: 65000,
      oqoodOrDeedAED: 580,
    },
    highlights: ['Private Landscaped Garden', 'Ranches Golf Club Access', 'Premier International Schools on Site', '10-Year Golden Visa'],
    floorPlanCount: 4,
  },
  {
    id: 'prop-10',
    title: 'JVC Prime Luxury Boutique 1BR',
    tagline: 'Designer Finished Cashflow Engine with High Occupancy Rate',
    developer: 'Ellington',
    developerTier: 'Boutique Luxury',
    emirate: 'Dubai',
    community: 'Jumeirah Village Circle (JVC)',
    category: 'Annual Rent',
    unitTypes: ['1BR'],
    priceAED: 72000,
    priceUSD: 19618,
    priceRangeFormatted: 'AED 72,000 / year',
    rentalBenchmarkAED: 'AED 72,000/yr',
    rentalFactors: {
      chequesAccepted: '4 Cheques',
      estimatedServiceCharge: 'Owner Covered',
      securityDeposit: '5% Unfurnished (AED 3,600)',
      minTerm: '12 Months Ejari',
    },
    projectedROI: 8.3,
    capitalGrowthForecast: 'N/A (Rental Contract)',
    goldenVisaEligible: false,
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    dldCosts: {
      registrationFeeAED: 220, // Ejari fee
      adminFeeAED: 0,
      agencyFeeAED: 3600, // 5% rental agency fee
      oqoodOrDeedAED: 0,
    },
    highlights: ['4 Cheques Accepted', 'Hotel-grade Gymnasium & Sauna', 'Low DEWA Utility Overhead', 'Next to Circle Mall'],
    floorPlanCount: 2,
  },
  {
    id: 'prop-11',
    title: 'The Bay Residences at Yas Bay',
    tagline: 'Waterfront Boulevard Apartments Overlooking Yas Marina',
    developer: 'Aldar Properties',
    developerTier: 'Prime Master',
    emirate: 'Abu Dhabi',
    community: 'Yas Bay',
    category: 'Off-Plan',
    unitTypes: ['1BR', '2BR', '3BR+'],
    priceAED: 1850000,
    priceUSD: 504000,
    priceRangeFormatted: 'AED 1.85M – 3.9M',
    rentalBenchmarkAED: 'Est. AED 130,000/yr',
    handoverDate: 'Q4 2026',
    paymentPlan: {
      summary: '60/40 Construction Linked',
      downPayment: '10% on Booking',
      duringConstruction: '50% during build',
      onHandover: '40% on Handover',
    },
    projectedROI: 7.6,
    capitalGrowthForecast: '+21% capital upside',
    goldenVisaEligible: false,
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    dldCosts: {
      registrationFeeAED: 37000, // 2% DMT
      adminFeeAED: 2000,
      agencyFeeAED: 37000,
      oqoodOrDeedAED: 1000,
    },
    highlights: ['Direct Yas Bay Boardwalk', '2% DMT Registration Fee', '5 Mins to Etihad Arena', 'High Rental Demand from F1 & Leisure Visitors'],
    floorPlanCount: 4,
  },
  {
    id: 'prop-12',
    title: 'DAMAC Lagoons — Ibiza Townhouses',
    tagline: 'Mediterranean Resort Lifestyle with Private Swimmable Lagoons',
    developer: 'DAMAC',
    developerTier: 'Prime Master',
    emirate: 'Dubai',
    community: 'DAMAC Hills',
    category: 'Off-Plan',
    unitTypes: ['Villa/Townhouse', '3BR+'],
    priceAED: 2600000,
    priceUSD: 708400,
    priceRangeFormatted: 'AED 2.6M – 3.8M',
    rentalBenchmarkAED: 'Est. AED 185,000/yr',
    handoverDate: 'Q4 2026',
    paymentPlan: {
      summary: '70/30 Milestone Plan',
      downPayment: '20% on Booking',
      duringConstruction: '50% in milestones',
      onHandover: '30% on Handover',
    },
    projectedROI: 7.4,
    capitalGrowthForecast: '+25% by completion',
    goldenVisaEligible: true,
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    dldCosts: {
      registrationFeeAED: 104000,
      adminFeeAED: 4200,
      agencyFeeAED: 52000,
      oqoodOrDeedAED: 3000,
    },
    highlights: ['Swimmable Crystal Lagoon with Sandy Beaches', 'Bohemian Clubhouse & Boho Lounge', 'Golden Visa Eligibility', 'Trump International Golf Club Membership'],
    floorPlanCount: 5,
  }
];
