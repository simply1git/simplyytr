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

// POST /api/pipeline/auto-trigger
// Called by the Kaggle Python worker in a continuous loop.
// Generates a single script and returns the job data immediately for processing.
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();

  try {
    const workerVersion = request.headers.get('x-worker-version');
    if (workerVersion !== '36') {
      return Response.json({ message: 'Old worker versions are disabled' }, { status: 404 });
    }

    // Fetch system settings
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      return Response.json({ error: 'System settings not configured' }, { status: 500 });
    }

    if (!settings.autoPilotEnabled) {
      return Response.json({ error: 'Auto-pilot is disabled' }, { status: 403 });
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

    // Fetch top performing videos for Self-Learning AI prompt engineering
    let selfLearningContext = "";
    if (settings.enableSelfLearningAI) {
      const topVideos = await prisma.renderJob.findMany({
        where: { views: { gt: 0 } },
        orderBy: { views: 'desc' },
        take: 5,
        select: { generatedTitle: true, scriptHook: true, views: true, topic: true }
      });

      if (topVideos.length > 0) {
        selfLearningContext = `
WINNING PERFORMANCE PATTERNS (Self-Learning AI Active):
Analyze these top-performing video titles and hooks from past uploads to model style and high-CTR patterns:
${topVideos.map(v => `- Title: "${v.generatedTitle}" | Hook: "${v.scriptHook}" | Views: ${v.views}`).join('\n')}

INSTRUCTION: Adapt your hook structure and title style to match the pacing and viral hook mechanics of these top-performing examples.
`;
      }
    }

    const videoStyle = (settings as any).defaultVideoStyle || 'PRODUCT_FIND';
    const amazonTag = (settings as any).amazonAssociateTag || 'simplyytr-20';
    const customPrefix = (settings as any).customAffiliatePrefix || '';

    let scriptPrompt = '';
    if (videoStyle === 'PRODUCT_FIND') {
      scriptPrompt = `
You are an expert YouTube Shorts viral product affiliate marketer and high-CTR copywriter.
TARGET NICHE: "${settings.targetNiche}"
TONE: "${settings.geminiTone}"
${trendsContext}
${selfLearningContext}

Select a viral, problem-solving trending gadget / Amazon find suitable for this niche.
Generate a high-conversion 30-40 second video script:
1. HOOK: 3s opening showing the annoying everyday problem and how this gadget solves it.
2. BODY: Fast-paced demonstration of features and visual satisfaction.
3. CTA: Directing viewers to the discount link in the pinned comment!

Return a JSON object with EXACTLY these keys:
{
  "product_name": "Precise name of product (e.g. 2-in-1 Screen Cleaner Spray)",
  "topic": "Concise topic summary",
  "hook": "Opening problem hook line (3-4 seconds)",
  "body": "Main demonstration body (25-35 seconds spoken aloud)",
  "cta": "Call to action pointing to pinned comment link",
  "visual_prompts": ["scene 1 product problem demo", "scene 2 product solution in action", "scene 3 satisfying result", "scene 4 close-up product feature"],
  "title": "Viral YouTube Shorts title under 70 chars with #shorts #amazonfinds",
  "description": "Engaging description under 150 chars with affiliate disclosure",
  "tags": ["shorts", "amazonfinds", "tiktokmademebuyit", "gadget", "viral"]
}
`;
    } else {
      scriptPrompt = `
TARGET NICHE / TOPIC AREA: "${settings.targetNiche}"
TARGET CHANNELS / INSPIRATION: "${settings.targetChannels || 'Alex Hormozi, Andrew Huberman, Motivation'}"
COPY-PASTE MODE: "${settings.copyPasteMode || 'clone_avatar'}"
TONE: "${settings.geminiTone}"
${trendsContext}
${selfLearningContext}
Generate a unique, highly engaging YouTube Shorts video script (under 60 seconds when spoken aloud).

Return a JSON object with EXACTLY these keys:
{
  "product_name": null,
  "topic": "A concise topic summary (3-6 words)",
  "hook": "Opening hook line (first 3 seconds, must grab attention immediately)",
  "body": "Main content body (40-50 seconds of spoken content, informative and engaging)",
  "cta": "Call to action (last 5 seconds, encourage like/subscribe/comment)",
  "visual_prompts": ["scene 1 description for stock video search", "scene 2 description", "scene 3 description", "scene 4 description"],
  "title": "Viral YouTube Shorts title under 70 chars with 1-2 hashtags",
  "description": "Engaging description under 200 chars",
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
        status: 'SCRIPTED', // Worker will immediately pick this up
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

    return Response.json({
      status: 'success',
      job: {
        id: job.id,
        topic: job.topic,
        scriptHook: job.scriptHook,
        scriptBody: job.scriptBody,
        scriptCta: job.scriptCta,
        visualPrompts: job.visualPrompts,
        voiceName: job.voiceName,
        generatedTitle: job.generatedTitle,
        videoStyle: job.videoStyle,
        productName: job.productName,
        affiliateLink: job.affiliateLink,
        pinnedCommentText: job.pinnedCommentText,
        jobType: settings.copyPasteMode === 'split_screen' ? 'aggregator' : (settings.copyPasteMode === 'renarration' ? 'generative' : 'clone')
      }
    });
  } catch (err) {
    console.error('[Pipeline Auto-Trigger] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
