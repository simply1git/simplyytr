/**
 * Ad-Safe Lexicon, Brand Safety, and Regulatory Compliance Gate (SIMPLYYTR SOTA 2026)
 * Enforces FTC disclosure placement, claim linting, link validation, and asset licensing checks.
 */

export interface ComplianceScanResult {
    riskScore: number;
    riskCategory: 'SAFE' | 'BORDERLINE' | 'HIGH_RISK';
    replacements: Array<{ original: string; replacement: string }>;
    cleanText: string;
}

export interface DetailedComplianceReport {
    passed: boolean;
    adSafety: ComplianceScanResult;
    unsupportedClaims: string[];
    affiliateDisclosureValid: boolean;
    disclosureMissingReasons: string[];
    linkValidationIssues: string[];
    mediaRightsIssues: string[];
    scriptIntegrityIssues: string[];
    legalDisclaimer: string;
    requiresHumanReview: boolean;
}

const BANNED_PATTERNS: Array<{ regex: RegExp; replacement: string }> = [
    { regex: /\bkilled it\b/gi, replacement: 'crushed it' },
    { regex: /\binsane\b/gi, replacement: 'wild' },
    { regex: /\bdestroy(ed|ing)?\b/gi, replacement: 'transform$1' },
    { regex: /\bdeadly\b/gi, replacement: 'extreme' },
    { regex: /\bhate\b/gi, replacement: 'dislike' },
    { regex: /\blethal\b/gi, replacement: 'intense' },
    { regex: /\bexplode(d|ing)?\b/gi, replacement: 'erupt$1' },
    { regex: /\bkill(ed|ing)?\b/gi, replacement: 'eliminate$1' },
    { regex: /\bweapon\b/gi, replacement: 'tool' },
    { regex: /\battack(ed|ing)?\b/gi, replacement: 'target$1' }
];

const UNSUPPORTED_CLAIM_PATTERNS: RegExp[] = [
    /\b(guaranteed\s*(results|income|profit|cure|weight loss))\b/i,
    /\b(100%\s*(effective|safe|cure|guaranteed|free money))\b/i,
    /\b(miracle\s*(cure|pill|drug|trick))\b/i,
    /\b(FDA\s*approved)\b/i,
    /\b(secret\s*(glitch|loophole|trick)\s*(to get rich|banks don't want you to know))\b/i,
    /\b(cure(s)?\s*(cancer|diabetes|disease|illness))\b/i,
    /\b(make\s*\$?[0-9,]+\s*(per day|a day|overnight|in 24 hours))\b/i
];

export function scanAndSanitizeScript(text: string): ComplianceScanResult {
    if (!text) {
        return {
            riskScore: 0.0,
            riskCategory: 'SAFE',
            replacements: [],
            cleanText: ''
        };
    }

    let cleanText = text;
    const replacements: Array<{ original: string; replacement: string }> = [];

    for (const pattern of BANNED_PATTERNS) {
        const matches = text.match(pattern.regex);
        if (matches) {
            for (const match of matches) {
                replacements.push({ original: match, replacement: pattern.replacement });
                cleanText = cleanText.replace(new RegExp(match, 'gi'), pattern.replacement);
            }
        }
    }

    const riskScore = replacements.length > 3 ? 4.5 : replacements.length > 0 ? 1.2 : 0.4;
    const riskCategory = riskScore > 5.0 ? 'HIGH_RISK' : riskScore > 2.0 ? 'BORDERLINE' : 'SAFE';

    return {
        riskScore,
        riskCategory,
        replacements,
        cleanText
    };
}

/**
 * Rigorous multi-factor compliance verification for scripts, affiliate disclosures,
 * product links, and media asset licensing metadata.
 */
export function validateContentPackageCompliance(pkg: {
    script: string;
    title: string;
    description: string;
    pinnedComment?: string;
    affiliateLink?: string;
    productName?: string;
    visualPrompts?: string[];
    mediaAssets?: Array<{ url?: string; license?: string; source?: string }>;
}): DetailedComplianceReport {
    const adSafety = scanAndSanitizeScript(pkg.script);
    const unsupportedClaims: string[] = [];
    const disclosureMissingReasons: string[] = [];
    const linkValidationIssues: string[] = [];
    const mediaRightsIssues: string[] = [];
    const scriptIntegrityIssues: string[] = [];

    // 1. Script integrity checks
    const trimmedScript = (pkg.script || '').trim();
    if (!trimmedScript) {
        scriptIntegrityIssues.push('Script text is empty or missing.');
    } else if (trimmedScript.length < 30) {
        scriptIntegrityIssues.push('Script is excessively short or malformed (<30 characters).');
    }

    // 2. Unsupported factual and performance claims
    for (const pat of UNSUPPORTED_CLAIM_PATTERNS) {
        const match = trimmedScript.match(pat);
        if (match) {
            unsupportedClaims.push(`Flagged unsupported claim phrase: "${match[0]}"`);
        }
    }

    // 3. Affiliate disclosure verification (FTC 16 CFR Part 255 compliance)
    const hasAffiliateLinks = Boolean(
        pkg.affiliateLink ||
        (pkg.description && /amazon\.com\/dp\/search\?|amzn\.to|affiliate/i.test(pkg.description)) ||
        (pkg.pinnedComment && /amazon\.com\/dp\/search\?|amzn\.to|affiliate/i.test(pkg.pinnedComment))
    );

    let affiliateDisclosureValid = true;
    if (hasAffiliateLinks) {
        const descHasDisclosure = /disclosure|affiliate|commission|amazon associate|as an associate/i.test(pkg.description || '');
        const commentHasDisclosure = !pkg.pinnedComment || /disclosure|affiliate|commission/i.test(pkg.pinnedComment);

        if (!descHasDisclosure) {
            disclosureMissingReasons.push('Description includes commercial/affiliate links but lacks an explicit FTC disclosure statement.');
            affiliateDisclosureValid = false;
        }
        if (pkg.pinnedComment && !commentHasDisclosure) {
            disclosureMissingReasons.push('Pinned comment features commercial links but lacks inline affiliate disclosure.');
            affiliateDisclosureValid = false;
        }
    }

    // 4. Product link validation
    if (pkg.affiliateLink) {
        try {
            const parsed = new URL(pkg.affiliateLink);
            if (parsed.protocol !== 'https:') {
                linkValidationIssues.push(`Insecure link protocol: "${pkg.affiliateLink}". Must use https.`);
            }
            if (!parsed.hostname.includes('amazon.') && !parsed.hostname.includes('amzn.to') && !parsed.hostname.includes('simplyytr.')) {
                linkValidationIssues.push(`Unverified affiliate domain: "${parsed.hostname}". External links must point to approved merchants.`);
            }
        } catch {
            linkValidationIssues.push(`Malformed or invalid affiliate URL: "${pkg.affiliateLink}".`);
        }
    }

    // 5. Media asset licensing & provenance validation
    if (pkg.mediaAssets && pkg.mediaAssets.length > 0) {
        for (const [idx, asset] of pkg.mediaAssets.entries()) {
            if (!asset.license || asset.license === 'UNKNOWN') {
                mediaRightsIssues.push(`Asset #${idx + 1} (${asset.url || 'unspecified'}) has unverified license metadata.`);
            }
        }
    }

    const passed = (
        scriptIntegrityIssues.length === 0 &&
        unsupportedClaims.length === 0 &&
        affiliateDisclosureValid &&
        linkValidationIssues.length === 0 &&
        mediaRightsIssues.length === 0 &&
        adSafety.riskCategory !== 'HIGH_RISK'
    );

    return {
        passed,
        adSafety,
        unsupportedClaims,
        affiliateDisclosureValid,
        disclosureMissingReasons,
        linkValidationIssues,
        mediaRightsIssues,
        scriptIntegrityIssues,
        legalDisclaimer: 'Notice: Automated compliance checks verify basic ad-safety lexicons, link formatting, claim patterns, and disclosure presence. They do NOT guarantee legal or regulatory compliance. Human review is required before commercial publishing.',
        requiresHumanReview: !passed || hasAffiliateLinks
    };
}
