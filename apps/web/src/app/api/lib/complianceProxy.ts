/**
 * Ad-Safe Lexicon & Brand Safety Compliance Proxy
 */

export interface ComplianceScanResult {
    riskScore: number;
    riskCategory: 'SAFE' | 'BORDERLINE' | 'HIGH_RISK';
    replacements: Array<{ original: string; replacement: string }>;
    cleanText: string;
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
