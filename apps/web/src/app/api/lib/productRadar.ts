/**
 * SOTA 2026 Viral Product & Multi-Link Affiliate Radar
 * Enforces provenance tracking, unverified sample indicators, and FTC compliance disclosures.
 */

export type ProductProvenance = 'LOCAL_SAMPLE_CATALOG' | 'LIVE_MARKET_INTELLIGENCE';
export type VerificationStatus = 'SAMPLE_UNVERIFIED' | 'PROVIDER_VERIFIED';

export interface ViralProduct {
    id: string;
    name: string;
    category: 'TECH_GADGET' | 'HOME_CLEANING' | 'DESK_SETUP' | 'LIFESTYLE_HACK';
    amazonSearchQuery: string;
    accessoriesSearchQuery: string;
    pricePoint: string;
    problemSolved: string;
    hookAngle: string;
    features: string[];
    visualSearchKeywords: string[];
    couponCode?: string;
    provenance: ProductProvenance;
    verificationStatus: VerificationStatus;
    retrievedAt: string;
    isAffiliateLinkVerified: boolean;
}

export const VIRAL_PRODUCT_VAULT: ViralProduct[] = [
    {
        id: 'screen-cleaner-spray',
        name: '2-in-1 Screen Cleaner Spray & Microfiber Wrap',
        category: 'TECH_GADGET',
        amazonSearchQuery: '2 in 1 screen cleaner spray mist microfiber cloth phone monitor cleaning',
        accessoriesSearchQuery: 'microfiber screen cleaning refill solution pack',
        pricePoint: '$9.99',
        problemSolved: 'Disgusting fingerprint smudges and bacteria on smartphone and laptop screens',
        hookAngle: 'Your phone screen has more bacteria than a toilet seat, but this $9 Amazon gadget wipes it completely clean in 2 seconds...',
        features: ['Refillable cleaning mist', 'Integrated microfiber body', 'Pocket portable design', 'Streak-free crystal clear finish'],
        visualSearchKeywords: ['dirty phone screen fingerprints', 'spraying screen cleaner wipe', 'satisfying crystal clean phone display', 'compact gadget demonstration'],
        provenance: 'LOCAL_SAMPLE_CATALOG',
        verificationStatus: 'SAMPLE_UNVERIFIED',
        retrievedAt: '2026-10-13T00:00:00.000Z',
        isAffiliateLinkVerified: false
    },
    {
        id: 'magnetic-cable-organizer',
        name: 'Magnetic Silicone Cable Clips Hub',
        category: 'DESK_SETUP',
        amazonSearchQuery: 'magnetic cable organizer desk clips cord management silicone',
        accessoriesSearchQuery: 'silicone cable management ties desk pack',
        pricePoint: '$11.99',
        problemSolved: 'Messy tangled charging cables falling behind your desk',
        hookAngle: 'If your charging cables look like an electric spaghetti disaster, this magnetic desk invention fixes it forever...',
        features: ['Ultra-strong neodymium magnets', 'Universal 4mm-8mm cord compatibility', 'Residue-free 3M adhesive', 'Sleek minimalist finish'],
        visualSearchKeywords: ['tangled cables desk clutter', 'snapping magnetic cable clip into place', 'clean aesthetic minimal desk setup', 'charging phone cleanly'],
        provenance: 'LOCAL_SAMPLE_CATALOG',
        verificationStatus: 'SAMPLE_UNVERIFIED',
        retrievedAt: '2026-10-13T00:00:00.000Z',
        isAffiliateLinkVerified: false
    },
    {
        id: 'portable-mini-thermal-printer',
        name: 'Pocket Bluetooth Inkless Thermal Printer',
        category: 'TECH_GADGET',
        amazonSearchQuery: 'mini pocket thermal printer bluetooth inkless sticker maker',
        accessoriesSearchQuery: 'thermal sticker paper rolls multi-pack',
        pricePoint: '$24.99',
        problemSolved: 'Expensive printer ink and slow printing for quick notes and study stickers',
        hookAngle: 'This viral gadget prints anything from your phone in 3 seconds without needing a single drop of ink...',
        features: ['100% Inkless thermal tech', 'Instant Bluetooth 5.0 sync', 'Prints photos, study notes, and labels', 'Rechargeable 1000mAh battery'],
        visualSearchKeywords: ['printing image from smartphone inkless', 'peeling off printed sticker memo', 'aesthetic study notes journal', 'close-up pocket printer action'],
        provenance: 'LOCAL_SAMPLE_CATALOG',
        verificationStatus: 'SAMPLE_UNVERIFIED',
        retrievedAt: '2026-10-13T00:00:00.000Z',
        isAffiliateLinkVerified: false
    },
    {
        id: 'anti-gravity-humidifier',
        name: 'Anti-Gravity Levitating Water Droplet Humidifier',
        category: 'HOME_CLEANING',
        amazonSearchQuery: 'anti gravity water droplet humidifier optical illusion led desk lamp',
        accessoriesSearchQuery: 'aromatherapy essential oils diffuser pack',
        pricePoint: '$29.99',
        problemSolved: 'Dry stuffy room air and boring room aesthetics',
        hookAngle: 'This futuristic bedroom gadget literally defies gravity while purifying the air in your room...',
        features: ['Levitating reverse droplet optical illusion', 'Ultrasonic fine mist dispersion', 'Soothing ambient ambient LED glow', 'Whisper-quiet <30dB sleep mode'],
        visualSearchKeywords: ['floating water drops reverse illusion', 'relaxing mist glowing bedroom lamp', 'aesthetic dark room setup neon', 'calm sleeping ambient atmosphere'],
        provenance: 'LOCAL_SAMPLE_CATALOG',
        verificationStatus: 'SAMPLE_UNVERIFIED',
        retrievedAt: '2026-10-13T00:00:00.000Z',
        isAffiliateLinkVerified: false
    },
    {
        id: 'rotary-lint-shaved-remover',
        name: 'Electric Rechargeable Fabric Shaver & Pill Remover',
        category: 'LIFESTYLE_HACK',
        amazonSearchQuery: 'electric fabric shaver rechargeable sweater defuzzer lint remover',
        accessoriesSearchQuery: 'replacement blade heads fabric shaver pack',
        pricePoint: '$14.99',
        problemSolved: 'Old pilled clothing and fuzzy sweaters looking worn out',
        hookAngle: 'Stop throwing away your favorite clothes when this $14 shaver makes any old sweater look brand new in 10 seconds...',
        features: ['6-blade stainless steel rotary head', 'Dual-speed motor', 'Rechargeable USB-C battery', 'Honeycomb protective mesh'],
        visualSearchKeywords: ['shaving lint off old sweater satisfying', 'before and after clothes restoration', 'close up lint remover spinning blade', 'brand new smooth fabric texture'],
        provenance: 'LOCAL_SAMPLE_CATALOG',
        verificationStatus: 'SAMPLE_UNVERIFIED',
        retrievedAt: '2026-10-13T00:00:00.000Z',
        isAffiliateLinkVerified: false
    }
];

export type AffiliateRegion = 'IN' | 'US' | 'UK' | 'GLOBAL';

export interface MultiAffiliateBundle {
    amazonLink: string;
    globalStoreLink: string;
    accessoriesLink: string;
    region: AffiliateRegion;
    currency: string;
    priceEstimate: string;
    couponCode?: string;
    discountPercent?: string;
    provenance: ProductProvenance;
    verificationStatus: VerificationStatus;
    isAffiliateLinkVerified: boolean;
}

/**
 * Resolves Amazon storefront domain and currency based on configured region or associate tag format.
 * Tags ending in -21 are standard Amazon Associates India tags.
 * Tags ending in -20 are standard Amazon Associates US tags.
 */
export function resolveAmazonDomainAndCurrency(
    region?: AffiliateRegion,
    tag?: string
): { domain: string; currency: string; resolvedRegion: AffiliateRegion } {
    if (region === 'IN' || (tag && tag.endsWith('-21'))) {
        return { domain: 'https://www.amazon.in', currency: 'INR', resolvedRegion: 'IN' };
    }
    if (region === 'UK' || (tag && tag.endsWith('-21-uk'))) {
        return { domain: 'https://www.amazon.co.uk', currency: 'GBP', resolvedRegion: 'UK' };
    }
    return { domain: 'https://www.amazon.com', currency: 'USD', resolvedRegion: 'US' };
}

/**
 * Validates whether an affiliate destination URL points to a legitimate retailer domain
 * and carries an active associate tracking tag.
 */
export function verifyAffiliateDestinationUrl(url: string): { valid: boolean; domain?: string; tag?: string; reason?: string } {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
            return { valid: false, reason: 'Invalid protocol: must be HTTPS' };
        }
        const hostname = parsed.hostname.toLowerCase();
        const isPermittedAmazon = hostname === 'www.amazon.in' || hostname === 'amazon.in' ||
            hostname === 'www.amazon.com' || hostname === 'amazon.com' ||
            hostname === 'www.amazon.co.uk' || hostname === 'amazon.co.uk';

        if (!isPermittedAmazon) {
            return { valid: false, reason: `Unrecognized affiliate merchant domain "${hostname}"` };
        }

        const tag = parsed.searchParams.get('tag');
        if (!tag || tag.trim().length < 3) {
            return { valid: false, reason: 'Missing or malformed associate tag parameter' };
        }

        return { valid: true, domain: hostname, tag };
    } catch (e: any) {
        return { valid: false, reason: `Malformed URL: ${e.message}` };
    }
}

export function buildMultiAffiliateBundle(
    product: ViralProduct,
    amazonAssociateTag?: string,
    customAffiliatePrefix?: string,
    region?: AffiliateRegion
): MultiAffiliateBundle {
    const tag = amazonAssociateTag || (region === 'IN' ? 'simplyytr-21' : 'simplyytr-20');
    const { domain, currency, resolvedRegion } = resolveAmazonDomainAndCurrency(region, tag);

    const encodedSearch = encodeURIComponent(product.amazonSearchQuery);
    const encodedAccessories = encodeURIComponent(product.accessoriesSearchQuery);

    const amazonLink = `${domain}/s?k=${encodedSearch}&tag=${tag}`;
    const accessoriesLink = `${domain}/s?k=${encodedAccessories}&tag=${tag}`;
    
    const globalStoreLink = customAffiliatePrefix && customAffiliatePrefix.startsWith('http')
        ? `${customAffiliatePrefix.replace(/\/$/, '')}/${encodeURIComponent(product.id)}`
        : `${domain}/s?k=${encodeURIComponent(product.name + ' search')}&tag=${tag}`;

    const urlCheck = verifyAffiliateDestinationUrl(amazonLink);
    const isAffiliateLinkVerified = product.verificationStatus === 'PROVIDER_VERIFIED' && urlCheck.valid;

    return {
        amazonLink,
        globalStoreLink,
        accessoriesLink,
        region: resolvedRegion,
        currency,
        priceEstimate: product.pricePoint,
        couponCode: product.couponCode,
        discountPercent: undefined,
        provenance: product.provenance,
        verificationStatus: product.verificationStatus,
        isAffiliateLinkVerified
    };
}

export function buildPinnedComment(product: ViralProduct, bundle: MultiAffiliateBundle): string {
    const isIndia = bundle.region === 'IN';
    const disclosure = isIndia
        ? '(Paid Partnership / Affiliate Disclosure: As an Amazon Associate, commissions may be earned on qualifying purchases at zero extra cost to you. Product pricing and availability are subject to merchant catalog updates.)'
        : '(Disclosure: As an Amazon Associate and affiliate partner, I earn a small commission on qualifying purchases at zero extra cost to you. Pricing and availability subject to merchant listing.)';

    return `Product Details & Search Links for ${product.name.toUpperCase()}:
* Search on Amazon (${bundle.currency}): ${bundle.amazonLink}
* Alternative Options: ${bundle.globalStoreLink}
* Replacement Accessories: ${bundle.accessoriesLink}
${disclosure}`;
}

export function buildMultiLinkDescription(product: ViralProduct, baseDescription: string, bundle: MultiAffiliateBundle): string {
    const isIndia = bundle.region === 'IN';
    const disclosure = isIndia
        ? '(Statutory Affiliate Disclosure: Links in this description are affiliate links. As an Amazon Associate, commissions may be earned from qualifying purchases at no additional expense to the viewer.)'
        : '(Affiliate Disclosure: Links in this description are affiliate links. As an affiliate, commissions may be earned on qualifying purchases at no additional cost to you.)';

    return `${baseDescription}

Product Search & Reference Links:
* Amazon Search (${bundle.currency}): ${bundle.amazonLink}
* Alternative Options: ${bundle.globalStoreLink}
* Accessories: ${bundle.accessoriesLink}

${disclosure}

#shorts #amazonfinds #gadget #lifehack`;
}

export function getRandomViralProduct(): ViralProduct {
    return VIRAL_PRODUCT_VAULT[Math.floor(Math.random() * VIRAL_PRODUCT_VAULT.length)];
}

