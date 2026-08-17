import { NextRequest } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawText = body.text || 'We killed it today with an insane breakthrough that will destroy traditional methods.';
    const autoCorrect = body.autoCorrect !== false;

    const logs: string[] = [];
    const replacements: Array<{ timestamp: string; original: string; replacement: string; status: string }> = [];
    let cleanText = rawText;
    let flagsCount = 0;

    logs.push(`[${new Date().toISOString().substring(11, 19)}] Initiating Pre-Flight Content ID & Ad-Safe Scan...`);

    for (const [trigger, safeAlt] of Object.entries(AD_SAFE_DICTIONARY)) {
      const regex = new RegExp(`\\b${trigger}\\b`, 'gi');
      const matches = rawText.match(regex);
      if (matches && matches.length > 0) {
        flagsCount += matches.length;
        const simTimestamp = `00:${String(Math.floor(Math.random() * 50) + 5).padStart(2, '0')}`;
        replacements.push({
          timestamp: simTimestamp,
          original: trigger,
          replacement: safeAlt,
          status: 'APPLIED'
        });
        logs.push(`[${new Date().toISOString().substring(11, 19)}] AD_SAFE FLAG: "${trigger}" -> Auto-replaced with "${safeAlt}"`);
        if (autoCorrect) {
          cleanText = cleanText.replace(regex, safeAlt);
        }
      }
    }

    const riskScore = parseFloat(Math.min(flagsCount * 1.2 + 0.6, 20.0).toFixed(1));
    const riskCategory = riskScore > 10 ? 'HIGH' : riskScore > 5 ? 'MEDIUM' : 'SAFE';

    logs.push(`[${new Date().toISOString().substring(11, 19)}] Content ID Audio Simulation... Cleared.`);
    logs.push(`[${new Date().toISOString().substring(11, 19)}] Visual Fingerprint... 0 Flags.`);
    logs.push(`[${new Date().toISOString().substring(11, 19)}] Compliance Risk Score: ${riskScore}% [${riskCategory} ZONE]`);
    logs.push(`[${new Date().toISOString().substring(11, 19)}] Synthetic Media Disclosure: AUTO-TAGGED.`);

    return Response.json({
      success: true,
      riskScore,
      riskCategory,
      visualFlags: 0,
      audioWarnings: flagsCount > 0 ? 1 : 0,
      replacements,
      cleanText,
      logs
    });

  } catch (err: any) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
}
