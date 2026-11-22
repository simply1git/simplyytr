/**
 * SOTA 2026 Viral Product & Multi-Link Affiliate Discovery Engine
 * Curates problem-solving gadgets, tech finds, and lifestyle tools
 * with automated Multi-Link bundles and strict FTC compliance disclosures.
 */

export type ProductProvenance = 'LOCAL_SAMPLE_CATALOG' | 'LIVE_MARKET_INTELLIGENCE';
export type VerificationStatus = 'SAMPLE_UNVERIFIED' | 'PROVIDER_VERIFIED';

export interface ViralProduct {
  id: string;
  name: string;
  category: 'TECH_GADGET' | 'HOME_PROBLEM_SOLVER' | 'FITNESS_LIFESTYLE' | 'PRODUCTIVITY' | 'AESTHETIC_DESK';
  problemSolved: string;
  hookAngle: string;
  pricePoint: string;
  visualSearchKeywords: string[];
  features: string[];
  affiliateKeyword: string;
  accessoriesKeyword?: string;
  amazonSearchQuery?: string;
  couponCode?: string;
  provenance: ProductProvenance;
  verificationStatus: VerificationStatus;
  retrievedAt: string;
  isAffiliateLinkVerified: boolean;
}

export interface MultiAffiliateLinks {
  amazonLink: string;
  globalStoreLink: string;
  bundleAccessoriesLink: string;
  couponCode?: string;
  allLinksFormatted: string;
  provenance: ProductProvenance;
  verificationStatus: VerificationStatus;
  isAffiliateLinkVerified: boolean;
}

export const VIRAL_PRODUCT_CATALOG: ViralProduct[] = [
  {
    id: 'prod_screen_cleaner_mist',
    name: '2-in-1 Antimicrobial Screen Cleaner Spray & Microfiber Wiper',
    category: 'TECH_GADGET',
    problemSolved: 'Disgusting greasy fingerprints and bacteria on phone, tablet, and laptop screens',
    hookAngle: 'Your phone screen is dirtier than a public toilet seat until you use this $9 gadget',
    pricePoint: '$9.99',
    visualSearchKeywords: ['dirty smartphone screen fingerprint', 'cleaning phone screen with spray', 'sparkling clean glass screen', 'satisfying screen cleaning'],
    features: ['Compact lipstick-sized bottle', 'Refillable cleaning fluid', 'Washable microfiber body', 'Safe for all oleophobic coatings'],
    affiliateKeyword: '2-in-1-screen-cleaner-spray',
    accessoriesKeyword: 'screen-cleaner-refill-solution-500ml',
    provenance: 'LOCAL_SAMPLE_CATALOG',
    verificationStatus: 'SAMPLE_UNVERIFIED',
    retrievedAt: '2026-10-13T00:00:00.000Z',
    isAffiliateLinkVerified: false
  },
  {
    id: 'prod_cable_magnetic_organizer',
    name: 'Rotating Magnetic Desk Cable Management Hub',
    category: 'AESTHETIC_DESK',
    problemSolved: 'Tangled charging cables falling behind your desk every single day',
    hookAngle: 'If your desk cables look like a messy bird nest, you need to see this $12 Amazon find',
    pricePoint: '$12.99',
    visualSearchKeywords: ['tangled desk charging cables', 'clean aesthetic desk setup', 'magnetic cable clip snap', 'satisfying cable organization'],
    features: ['Ultra-strong neodymium magnets', 'Universal cable slot size', 'Residue-free 3M adhesive', 'Minimalist matte black aluminum'],
    affiliateKeyword: 'magnetic-desk-cable-organizer',
    accessoriesKeyword: 'magnetic-cable-clips-pack-of-6',
    provenance: 'LOCAL_SAMPLE_CATALOG',
    verificationStatus: 'SAMPLE_UNVERIFIED',
    retrievedAt: '2026-10-13T00:00:00.000Z',
    isAffiliateLinkVerified: false
  },
  {
    id: 'prod_mini_sealer_cutter',
    name: 'Rechargeable 2-in-1 Bag Sealer & Heat Cutter',
    category: 'HOME_PROBLEM_SOLVER',
    problemSolved: 'Stale chips, spoiled snacks, and open plastic food bags losing freshness',
    hookAngle: 'Stop throwing away stale chips. This $11 kitchen gadget creates an airtight factory seal in 2 seconds',
    pricePoint: '$11.49',
    visualSearchKeywords: ['stale chip bag opening', 'heat sealer melting plastic bag airtight', 'satisfying clean snack sealing', 'crunchy fresh chips'],
    features: ['Instant micro-heating element', 'Built-in hidden box cutter', 'Magnetic fridge mount', 'USB-C fast charging'],
    affiliateKeyword: 'rechargeable-mini-bag-sealer',
    accessoriesKeyword: 'reusable-food-storage-bags-pack',
    provenance: 'LOCAL_SAMPLE_CATALOG',
    verificationStatus: 'SAMPLE_UNVERIFIED',
    retrievedAt: '2026-10-13T00:00:00.000Z',
    isAffiliateLinkVerified: false
  },
  {
    id: 'prod_anti_gravity_humidifier',
    name: 'Optical Illusion Anti-Gravity Water Droplet Air Humidifier',
    category: 'AESTHETIC_DESK',
    problemSolved: 'Dry room air, sinus congestion, and boring desk decor',
    hookAngle: 'Water literally flows backwards defying gravity in this insane $25 viral bedroom gadget',
    pricePoint: '$24.99',
    visualSearchKeywords: ['anti gravity water drops floating upwards', 'mist humidifier glowing desk', 'aesthetic dark bedroom lighting', 'calming water droplets'],
    features: ['Stroboscopic levitating water effect', 'Whisper-quiet ultrasonic mist', 'Warm ambient LED light', 'Auto shut-off when dry'],
    affiliateKeyword: 'anti-gravity-water-droplet-humidifier',
    accessoriesKeyword: 'aromatherapy-essential-oils-set',
    provenance: 'LOCAL_SAMPLE_CATALOG',
    verificationStatus: 'SAMPLE_UNVERIFIED',
    retrievedAt: '2026-10-13T00:00:00.000Z',
    isAffiliateLinkVerified: false
  },
  {
    id: 'prod_turbo_air_duster',
    name: '130,000 RPM Super Powerful Jet Turbo Fan & Air Duster',
    category: 'TECH_GADGET',
    problemSolved: 'Expensive compressed air cans running out and stubborn dust inside keyboards and PC vents',
    hookAngle: 'This tiny pocket rocket blows at 130,000 RPM and replaces canned air forever',
    pricePoint: '$39.99',
    visualSearchKeywords: ['blowing dust out of mechanical keyboard', 'super fast pocket turbo fan', 'cleaning car interior vents', 'intense air blower power'],
    features: ['130,000 RPM brushless motor', '52 m/s hurricane wind speed', 'CNC aluminum turbine fan', 'Type-C fast charging'],
    affiliateKeyword: '130000-rpm-turbo-jet-fan-duster',
    accessoriesKeyword: 'turbo-fan-nozzle-attachments-set',
    provenance: 'LOCAL_SAMPLE_CATALOG',
    verificationStatus: 'SAMPLE_UNVERIFIED',
    retrievedAt: '2026-10-13T00:00:00.000Z',
    isAffiliateLinkVerified: false
  },
  {
    id: 'prod_electric_jar_opener',
    name: 'Hands-Free Automatic Electric Jar & Bottle Opener',
    category: 'HOME_PROBLEM_SOLVER',
    problemSolved: 'Impossible-to-open tight jar lids, wrist strain, and arthritis difficulty',
    hookAngle: 'Never struggle with a stuck jar lid again. Watch this robot twist open any lid effortlessly',
    pricePoint: '$19.99',
    visualSearchKeywords: ['struggling to open tight pickle jar lid', 'automatic robotic jar opener clamping', 'satisfying jar lid pop open', 'kitchen gadget in action'],
    features: ['One-button automated clamp & twist', 'Fits lids from 1.2 to 3.5 inches', 'Zero grip strength needed', 'Compact drawer storage'],
    affiliateKeyword: 'hands-free-electric-jar-opener',
    accessoriesKeyword: 'silicone-jar-gripper-pads-set',
    provenance: 'LOCAL_SAMPLE_CATALOG',
    verificationStatus: 'SAMPLE_UNVERIFIED',
    retrievedAt: '2026-10-13T00:00:00.000Z',
    isAffiliateLinkVerified: false
  }
];

export function getRandomViralProduct(): ViralProduct {
  const idx = Math.floor(Math.random() * VIRAL_PRODUCT_CATALOG.length);
  return VIRAL_PRODUCT_CATALOG[idx];
}

export function buildMultiAffiliateBundle(
  product: ViralProduct,
  amazonTag: string = 'simplyytr-20',
  customPrefix?: string
): MultiAffiliateLinks {
  const amazonLink = `https://www.amazon.com/dp/search?k=${encodeURIComponent(product.name)}&tag=${amazonTag}`;
  
  const globalStoreLink = customPrefix && customPrefix.startsWith('http')
    ? `${customPrefix.replace(/\/$/, '')}/${product.affiliateKeyword}`
    : `https://www.amazon.com/dp/search?k=${encodeURIComponent(product.name + ' search')}&tag=${amazonTag}`;

  const accessoriesTerm = product.accessoriesKeyword || `${product.affiliateKeyword}-accessories`;
  const bundleAccessoriesLink = `https://www.amazon.com/dp/search?k=${encodeURIComponent(accessoriesTerm.replace(/-/g, ' '))}&tag=${amazonTag}`;

  const allLinksFormatted = `* Amazon Search: ${amazonLink}
* Global / Alternative Store: ${globalStoreLink}
* Companion Accessories: ${bundleAccessoriesLink}`;

  return {
    amazonLink,
    globalStoreLink,
    bundleAccessoriesLink,
    couponCode: product.couponCode,
    allLinksFormatted,
    provenance: product.provenance,
    verificationStatus: product.verificationStatus,
    isAffiliateLinkVerified: false
  };
}

export function buildAffiliateLink(product: ViralProduct, amazonTag: string = 'simplyytr-20', customPrefix?: string): string {
  const bundle = buildMultiAffiliateBundle(product, amazonTag, customPrefix);
  return bundle.amazonLink;
}

export function buildPinnedComment(product: ViralProduct, affiliateBundle: MultiAffiliateLinks | string): string {
  if (typeof affiliateBundle === 'string') {
    return `Product Details & Search Links for ${product.name.toUpperCase()}:
👉 ${affiliateBundle}
(Disclosure: As an affiliate, I earn a commission on qualifying purchases at zero extra cost to you. Pricing and availability subject to merchant listing.)`;
  }

  return `Product Details & Search Links for ${product.name.toUpperCase()}:
* Amazon Search: ${affiliateBundle.amazonLink}
* Alternative Options: ${affiliateBundle.globalStoreLink}
* Accessories: ${affiliateBundle.bundleAccessoriesLink}
(Disclosure: As an affiliate, I earn a small commission on qualifying purchases at zero extra cost to you. Pricing and availability subject to merchant listing.)`;
}

export function buildMultiLinkDescription(product: ViralProduct, title: string, affiliateBundle: MultiAffiliateLinks): string {
  return `${title}

Product Search & Reference Links:
* Amazon Search: ${affiliateBundle.amazonLink}
* Global / Alternative Options: ${affiliateBundle.globalStoreLink}
* Accessories: ${affiliateBundle.bundleAccessoriesLink}

(FTC Disclosure: As an Amazon Associate and affiliate partner, I earn from qualifying purchases.)`;
}
