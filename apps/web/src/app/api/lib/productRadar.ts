/**
 * SOTA 2026 Viral Product & Multi-Link Affiliate Radar
 */

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
        couponCode: 'CLEAN50'
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
        couponCode: 'DESK40'
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
        couponCode: 'PRINT30'
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
        couponCode: 'GLOW50'
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
        couponCode: 'SAVE50'
    }
];

export interface MultiAffiliateBundle {
    amazonLink: string;
    globalStoreLink: string;
    accessoriesLink: string;
    couponCode: string;
    discountPercent: string;
}

export function buildMultiAffiliateBundle(
    product: ViralProduct,
    amazonAssociateTag: string = 'simplyytr-20',
    customAffiliatePrefix?: string
): MultiAffiliateBundle {
    const encodedSearch = encodeURIComponent(product.amazonSearchQuery);
    const encodedAccessories = encodeURIComponent(product.accessoriesSearchQuery);
    const tag = amazonAssociateTag || 'simplyytr-20';

    const amazonLink = `https://www.amazon.com/dp/search?k=${encodedSearch}&tag=${tag}`;
    const accessoriesLink = `https://www.amazon.com/dp/search?k=${encodedAccessories}&tag=${tag}`;
    
    const globalStoreLink = customAffiliatePrefix && customAffiliatePrefix.startsWith('http')
        ? `${customAffiliatePrefix.replace(/\/$/, '')}/${encodeURIComponent(product.id)}`
        : `https://www.amazon.com/dp/search?k=${encodeURIComponent(product.name + ' official store')}&tag=${tag}`;

    return {
        amazonLink,
        globalStoreLink,
        accessoriesLink,
        couponCode: product.couponCode || 'FLASH50',
        discountPercent: '50%'
    };
}

export function buildPinnedComment(product: ViralProduct, bundle: MultiAffiliateBundle): string {
    return `🔥 GET THE ${product.name.toUpperCase()}:
1️⃣ Amazon Official Direct Deal: ${bundle.amazonLink}
2️⃣ Global / Alternative Store: ${bundle.globalStoreLink}
3️⃣ Essential Accessories Bundle: ${bundle.accessoriesLink}

⚡ Use VIP Coupon Code: [ ${bundle.couponCode} ] for extra savings today!
(Disclosure: As an affiliate, I earn a small commission on qualifying purchases at zero extra cost to you!)`;
}

export function buildMultiLinkDescription(product: ViralProduct, baseDescription: string, bundle: MultiAffiliateBundle): string {
    return `${baseDescription}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛒 MULTI-STORE DIRECT LINKS & DISCOUNTS:
• Amazon Official Deal: ${bundle.amazonLink}
• Global / Direct Store: ${bundle.globalStoreLink}
• Companion Accessories: ${bundle.accessoriesLink}
• Exclusive Promo Code: ${bundle.couponCode} (${bundle.discountPercent} Off)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

#shorts #amazonfinds #tiktokmademebuyit #gadget #lifehack #viral`;
}

export function getRandomViralProduct(): ViralProduct {
    return VIRAL_PRODUCT_VAULT[Math.floor(Math.random() * VIRAL_PRODUCT_VAULT.length)];
}
