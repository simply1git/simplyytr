import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, callGroq, prisma } from '../../lib/utils';

async function fetchTrendingTopics(): Promise<string[]> {
  try {
    const res = await fetch('https://trends.google.com/trending/rss?geo=US', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    if (!res.ok) return [];
    const text = await res.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titles: string[] = [];
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);
      if (titleMatch && titleMatch[1]) {
        const title = titleMatch[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        titles.push(title.trim());
      }
    }
    return titles.slice(0, 10);
  } catch (err) {
    console.error('Failed to fetch trending topics:', err);
    return [];
  }
}

// POST /api/pipeline/trigger
// Called by GitHub Actions cron or manually from the dashboard.
// Generates a script using Groq and creates a render job in the database.
export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyAuth(request)) return unauthorized();

  try {
    const body = await request.json().catch(() => ({}));
    const count = Math.min(body.count || 1, 4); // Max 4 videos per trigger

    // Fetch system settings
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      return Response.json({ error: 'System settings not configured' }, { status: 500 });
    }

    if (!settings.autoPilotEnabled && !body.force) {
      return Response.json({ message: 'Auto-pilot is disabled. Use force=true to override.' }, { status: 200 });
    }

    // Fetch top performing topics for self-learning context
    let performanceContext = '';
    if (settings.enableSelfLearningAI) {
      const topPerformers = await prisma.renderJob.findMany({
        where: { status: 'UPLOADED', views: { gt: 0 } },
        orderBy: { views: 'desc' },
        take: 5,
        select: { topic: true, generatedTitle: true, views: true, ctr: true },
      });
      const bottomPerformers = await prisma.renderJob.findMany({
        where: { status: 'UPLOADED', views: { gt: 0 } },
        orderBy: { views: 'asc' },
        take: 5,
        select: { topic: true, generatedTitle: true, views: true, ctr: true },
      });
      if (topPerformers.length > 0) {
        performanceContext = `
PERFORMANCE DATA (use this to improve):
Top performing videos: ${JSON.stringify(topPerformers)}
Worst performing videos: ${JSON.stringify(bottomPerformers)}
Generate content that follows patterns from top performers and avoids patterns from worst performers.
`;
      }
    }

    // Fetch live trends from Google Trends RSS
    const trendingTopics = await fetchTrendingTopics();
    const trendsContext = trendingTopics.length > 0
      ? `
CURRENT REAL-TIME DAILY TRENDS:
${trendingTopics.map((t, idx) => `- "${t}"`).join('\n')}

INSTRUCTION: You MUST select one of the daily trending topics/queries/celebrities above (e.g. FIFA World Cup, or a trending celebrity/event) to base the script on, making it highly versatile, relevant, and adaptive to what the world is searching for right now.
`
      : "";

    const S_TIER_NICHES = [
      'AI & Future Technology Breakthroughs',
      'Viral Problem-Solving Gadgets & Inventions',
      'Dark Psychology & Subconscious Human Behavior',
      'Mind-Blowing Mysteries & Cosmic Paradoxes',
      'Live Viral Trending Sports & Pop Culture Moments'
    ];

    const jobs = [];
    for (let i = 0; i < count; i++) {
      // Dynamic autonomous niche selection if targetNiche is flexible
      const dynamicNiche = (!settings.targetNiche || settings.targetNiche.toLowerCase().includes('auto') || settings.targetNiche.toLowerCase().includes('all') || settings.targetNiche === 'General / Multi-Niche')
        ? S_TIER_NICHES[Math.floor(Math.random() * S_TIER_NICHES.length)]
        : settings.targetNiche;

      const videoStyle = (settings as any).defaultVideoStyle || 'PRODUCT_FIND';
      const amazonTag = (settings as any).amazonAssociateTag || 'simplyytr-20';
      const customPrefix = (settings as any).customAffiliatePrefix || '';

      let scriptPrompt = '';
      if (videoStyle === 'PRODUCT_FIND') {
        scriptPrompt = `
You are the Top 1% YouTube Shorts Product Affiliate Scriptwriter.
RESEARCHED DYNAMIC NICHE: "${dynamicNiche}"
TONE: "${settings.geminiTone}"
${trendsContext}
${performanceContext}

Autonomously research and select a viral, high-converting problem-solving gadget / Amazon find fitting this niche.
Generate a high-retention 30-35 second script with:
1. HOOK: 0-2s pattern interrupt opening.
2. BODY: Fast-paced visual payoff, revealing 1 insight every 3s.
3. CTA: Directing viewers to pinned discount links with a seamless infinite loop ending.

Return a JSON object with EXACTLY these keys:
{
  "product_name": "Precise name of product (e.g. 2-in-1 Screen Cleaner Spray)",
  "topic": "Concise topic summary",
  "hook": "Opening problem hook line (0-2s)",
  "body": "Main demonstration body (20-25s spoken aloud)",
  "cta": "Call to action pointing to pinned comment link",
  "visual_prompts": ["scene 1 product problem demo", "scene 2 product solution in action", "scene 3 satisfying result", "scene 4 close-up product feature"],
  "title": "Viral YouTube Shorts title under 65 chars with #shorts #amazonfinds",
  "description": "Engaging description under 150 chars with affiliate disclosure",
  "tags": ["shorts", "amazonfinds", "tiktokmademebuyit", "gadget", "viral"]
}
`;
      } else {
        scriptPrompt = `
You are the Top 1% YouTube Shorts Growth Strategist and Scriptwriter.
AUTONOMOUSLY RESEARCHED NICHE: "${dynamicNiche}"
TONE: "${settings.geminiTone}"
${trendsContext}
${performanceContext}

Research and generate a unique, high-retention viral YouTube Shorts script (35-45 seconds) with an open loop and seamless loop ending.
Return a JSON object with EXACTLY these keys:
{
  "product_name": null,
  "topic": "A concise topic summary (3-6 words)",
  "hook": "Opening hook line (first 2 seconds, must grab attention immediately)",
  "body": "Main content body (30-40 seconds of high-velocity narrative)",
  "cta": "Call to action ending engineered to loop back to hook",
  "visual_prompts": ["scene 1 cinematic visual", "scene 2 visual", "scene 3 visual", "scene 4 visual"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}
`;
      }

      const script = await callGroq(scriptPrompt);

      const prodName = script.product_name || script.topic || 'Viral Find';
      const amazonLink = `https://www.amazon.com/dp/search?k=${encodeURIComponent(prodName)}&tag=${amazonTag}`;
      const globalLink = customPrefix && customPrefix.startsWith('http')
        ? `${customPrefix.replace(/\/$/, '')}/${encodeURIComponent(prodName.toLowerCase().replace(/\s+/g, '-'))}`
        : `https://www.amazon.com/dp/search?k=${encodeURIComponent(prodName + ' official')}&tag=${amazonTag}`;
      const bundleLink = `https://www.amazon.com/dp/search?k=${encodeURIComponent(prodName + ' accessories bundle')}&tag=${amazonTag}`;

      let pinnedComment = '';
      let generatedDesc = script.description || '';

      if (videoStyle === 'PRODUCT_FIND') {
        pinnedComment = `🔥 GET THE ${prodName.toUpperCase()} & ACCESSORIES:
1️⃣ Amazon Official Deal: ${amazonLink}
2️⃣ Global / Direct Store: ${globalLink}
3️⃣ Recommended Accessories: ${bundleLink}

⚡ 50% Off Flash Sale Active Today!
(Disclosure: As an affiliate, I earn a small commission on qualifying purchases at zero extra cost to you!)`;

        generatedDesc = `${script.description || ''}

🔥 DIRECT PRODUCT LINKS:
• Amazon Deal: ${amazonLink}
• Global Store: ${globalLink}
• Accessories Bundle: ${bundleLink}

(FTC Disclosure: As an affiliate partner, I earn from qualifying purchases.)`;
      }

      // Create the render job in the database
      const job = await prisma.renderJob.create({
        data: {
          status: 'SCRIPTED',
          topic: script.topic || `${settings.targetNiche} Short`,
          scriptHook: script.hook || '',
          scriptBody: script.body || '',
          scriptCta: script.cta || '',
          visualPrompts: script.visual_prompts || [],
          voiceName: settings.voiceName,
          generatedTitle: script.title || '',
          generatedDescription: generatedDesc,
          generatedTags: script.tags || [],
          videoStyle: videoStyle,
          productName: prodName,
          affiliateLink: amazonLink,
          pinnedCommentText: pinnedComment,
          scriptedAt: new Date(),
        },
      });

      jobs.push(job);
    }

    // Trigger GitHub Action to wake up Kaggle GPU
    try {
      const ghToken = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;
      if (ghToken) {
        await fetch('https://api.github.com/repos/simply1git/simplyytr/actions/workflows/trigger-kaggle.yml/dispatches', {
          method: 'POST',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${ghToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ref: 'main' })
        });
        console.log('[Pipeline Trigger] Woke up Kaggle via GitHub Actions');
      } else {
        console.warn('[Pipeline Trigger] No GITHUB_PAT found. Kaggle must be triggered manually or via cron.');
      }
    } catch (e) {
      console.error('[Pipeline Trigger] Failed to trigger GitHub Action:', e);
    }

    return Response.json({
      status: 'success',
      message: `Created ${jobs.length} render job(s) and waking up Kaggle GPU!`,
      jobs: jobs.map(j => ({ id: j.id, topic: j.topic, status: j.status })),
    });
  } catch (err) {
    console.error('[Pipeline Trigger] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
