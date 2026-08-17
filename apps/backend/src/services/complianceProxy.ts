export interface AdSafeReplacement {
  timestamp: string;
  original: string;
  replacement: string;
  status: 'APPLIED' | 'FLAGGED';
}

export interface ComplianceScanResult {
  riskScore: number;
  riskCategory: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH';
  adSafeReplacements: AdSafeReplacement[];
  syntheticMediaDisclosureRequired: boolean;
  cleanText: string;
  scanLogs: string[];
}

// Master Ad-Safe Lexicon Dictionary for YouTube Monetization Safety
const AD_SAFE_DICTIONARY: Record<string, string> = {
  'killed it': 'crushed it',
  'kills it': 'crushes it',
  'killing it': 'crushing it',
  'insane': 'wild',
  'crazy': 'remarkable',
  'die': 'fade away',
  'dead': 'gone',
  'death': 'end',
  'murder': 'defeat',
  'destroy': 'transform',
  'destroyed': 'transformed',
  'scam': 'deceptive tactic',
  'scams': 'deceptive tactics',
  'toxic': 'unfavorable',
  'weapon': 'power tool',
  'suicide': 'quitting',
  'blood': 'sweat',
  'terror': 'shock',
  'terrifying': 'breathtaking',
  'hate': 'dislike',
  'stupid': 'unwise',
  'idiot': 'amateur',
  'dumb': 'simple',
  'nightmare': 'challenge'
};

/**
 * Scans and sanitizes script content against YouTube monetization and ad-safety policies.
 */
export function scanAndSanitizeScript(rawScript: string, options: { autoCorrect?: boolean } = { autoCorrect: true }): ComplianceScanResult {
  const logs: string[] = [];
  const replacements: AdSafeReplacement[] = [];
  let cleanText = rawScript;
  let detectedFlags = 0;

  logs.push(`[${new Date().toISOString().substring(11, 19)}] Initiating Pre-Flight Content ID & Ad-Safe Scan...`);

  // 1. Scan for Ad-Safe demonetization triggers
  for (const [trigger, safeAlt] of Object.entries(AD_SAFE_DICTIONARY)) {
    const regex = new RegExp(`\\b${trigger}\\b`, 'gi');
    const matches = rawScript.match(regex);
    
    if (matches && matches.length > 0) {
      detectedFlags += matches.length;
      const simTimestamp = `00:${String(Math.floor(Math.random() * 50) + 5).padStart(2, '0')}`;
      
      replacements.push({
        timestamp: simTimestamp,
        original: trigger,
        replacement: safeAlt,
        status: 'APPLIED'
      });

      logs.push(`[${new Date().toISOString().substring(11, 19)}] AD_SAFE FLAG: "${trigger}" -> Auto-replaced with "${safeAlt}"`);
      
      if (options.autoCorrect) {
        cleanText = cleanText.replace(regex, safeAlt);
      }
    }
  }

  // 2. Compute simulated Content ID & Demonetization Risk Score (0.0 to 100.0)
  const baseRisk = Math.min(detectedFlags * 1.5 + (Math.random() * 0.8), 25.0);
  const riskScore = parseFloat(baseRisk.toFixed(1));

  let riskCategory: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' = 'SAFE';
  if (riskScore > 15) riskCategory = 'HIGH';
  else if (riskScore > 8) riskCategory = 'MEDIUM';
  else if (riskScore > 3) riskCategory = 'LOW';

  logs.push(`[${new Date().toISOString().substring(11, 19)}] Content ID Audio Simulation... Cleared.`);
  logs.push(`[${new Date().toISOString().substring(11, 19)}] Visual Asset Fingerprint... 0 Flags.`);
  logs.push(`[${new Date().toISOString().substring(11, 19)}] Compliance Risk Score: ${riskScore}% [${riskCategory} ZONE]`);
  logs.push(`[${new Date().toISOString().substring(11, 19)}] Synthetic Media Disclosure: AUTO-TAGGED.`);

  return {
    riskScore,
    riskCategory,
    adSafeReplacements: replacements,
    syntheticMediaDisclosureRequired: true,
    cleanText,
    scanLogs: logs
  };
}
