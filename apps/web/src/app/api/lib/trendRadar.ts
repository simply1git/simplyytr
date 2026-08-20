/**
 * SOTA 2026 Multi-Source Trend Harvester & Autonomous Decider (SIMPLYYTR)
 */

export interface TrendSignalCandidate {
  id: string;
  source: 'GOOGLE_TRENDS' | 'REDDIT' | 'HACKER_NEWS' | 'YOUTUBE_TRENDS' | 'NICHE_VAULT';
  title: string;
  url?: string;
  velocityScore: number; // 0-100
  freshnessScore: number; // 0-100
  niche: string;
  recommendedStyle: 'PRODUCT_FIND' | 'REMASTER_REACTION' | 'CURIOSITY_SPLITSCREEN' | 'STANDARD';
  rpmTier: 'ULTRA_HIGH' | 'HIGH' | 'MAX_VIRALITY';
  estimatedAPV: string;
  summary?: string;
}

export interface OpportunityPlan {
  niche: string;
  topic: string;
  recommendedStyle: 'PRODUCT_FIND' | 'REMASTER_REACTION' | 'CURIOSITY_SPLITSCREEN' | 'STANDARD';
  rpmTier: 'ULTRA_HIGH' | 'HIGH' | 'MAX_VIRALITY';
  estimatedAPV: string;
  targetDurationSec: number;
  reasoning: string;
  sourceSignal?: TrendSignalCandidate;
}

export const S_TIER_HIGH_RPM_NICHES = [
  {
    niche: 'Blockbuster Movies & Marvel Secrets',
    rpmTier: 'MAX_VIRALITY' as const,
    style: 'CURIOSITY_SPLITSCREEN' as const,
    topics: [
      'The Deleted Spider-Man Scene Marvel Had To Ban From Theaters',
      'Spider-Man 4 & Secret Wars Hidden Leaks Nobody Noticed',
      'Mind-Bending Movie Easter Eggs That Completely Change The Ending',
      'Why Directors Secretly Hide This Symbol In Almost Every Movie',
      'The Real Reason This Actor Was Secretly Replaced in the Franchise',
      'Crazy Blockbuster Movie Mistakes That Made It Into The Final Cut'
    ]
  },
  {
    niche: 'Viral Gaming & Pop-Culture Lore',
    rpmTier: 'MAX_VIRALITY' as const,
    style: 'CURIOSITY_SPLITSCREEN' as const,
    topics: [
      'GTA 6 Leaked Gameplay Mechanics That Will Break The Internet',
      'The Impossible Gaming World Record That Nobody Has Ever Broken',
      'Hidden Video Game Details That Only 0.1% Of Players Discovered',
      'The Creepy Gaming Easter Egg That Took 10 Years To Find'
    ]
  },
  {
    niche: 'AI & Future Technology',
    rpmTier: 'ULTRA_HIGH' as const,
    style: 'STANDARD' as const,
    topics: [
      'Mind-Blowing AI Tools Nobody Knows About Yet',
      'The New Humanoid Robot That Will Replace Manual Labor',
      'Why Everyone Is Secretly Using This Hidden AI Workflow',
      'Insane Tech Inventions That Feel Illegal To Know',
      'Quantum Computing Breakthrough That Changed Everything'
    ]
  },
  {
    niche: 'Problem-Solving Viral Finds',
    rpmTier: 'HIGH' as const,
    style: 'PRODUCT_FIND' as const,
    topics: [
      'The $10 Amazon Gadget That Solves Everyday Annoyances',
      'TikTok Made Me Buy It: Problem Solving Inventions',
      'Genius Home Gadgets You Didn\'t Know Existed',
      'Desk Setup Inventions That Eliminate Cable Clutter',
      'Crazy Useful Cleaning Tools Going Viral Everywhere'
    ]
  },
  {
    niche: 'Psychology & Human Behavior Hacks',
    rpmTier: 'HIGH' as const,
    style: 'CURIOSITY_SPLITSCREEN' as const,
    topics: [
      'Psychological Tricks To Read Anyone Instantly',
      'Why Your Brain Always Craves What You Cannot Have',
      'The Dark Psychology Trick People Use To Manipulate You',
      'How To Tell If Someone Is Subconsciously Lying To You',
      'The 3-Second Rule That Cures Procrastination Forever'
    ]
  },
  {
    niche: 'Unsolved Mysteries & Cosmic Paradoxes',
    rpmTier: 'HIGH' as const,
    style: 'CURIOSITY_SPLITSCREEN' as const,
    topics: [
      'The Bizarre Deep Ocean Discovery That Scientists Cannot Explain',
      'The Creepiest Unsolved Glitch in the Matrix Stories',
      'What Actually Happens If You Fall Into a Black Hole',
      'The Secret Ancient Civilization That Vanished Overnight',
      'The Most Terrifying Sound Ever Recorded in Space'
    ]
  },
  {
    niche: 'Elite Mindset & Business Podcasts',
    rpmTier: 'HIGH' as const,
    style: 'REMASTER_REACTION' as const,
    topics: [
      'Raj Shamani Brutal Truth About Money & Startups',
      'Raj Shamani Business Secrets 99% of People Ignore',
      'Raj Shamani Career Advice That Changed Everything',
      'Alex Hormozi 1 Million Dollar Skillset Formula',
      'Andrew Huberman Subconscious Dopamine & Focus Protocol',
      'Ranveer Allahbadia Dark Reality of Success & Wealth'
    ]
  },
  {
    niche: 'Live Daily Trend-Jacking & Sports Highlights',
    rpmTier: 'MAX_VIRALITY' as const,
    style: 'REMASTER_REACTION' as const,
    topics: [
      'FIFA World Cup Shocking Moments Nobody Saw Coming',
      'Crazy Sports Comebacks That Broke The Internet',
      'Viral Celebrity Moments Everyone Is Talking About Today',
      'The Wildest Live TV Moments Caught On Camera'
    ]
  }
];

export async function fetchLiveGoogleTrends(): Promise<TrendSignalCandidate[]> {
  try {
    const res = await fetch('https://trends.google.com/trending/rss?geo=US', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return [];
    const text = await res.text();
    const matches = text.match(/<title>(.*?)<\/title>/g) || [];
    const trends = matches
      .map(m => m.replace(/<\/?title>/g, '').replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim())
      .filter(t => t && !t.toLowerCase().includes('daily search trends') && !t.toLowerCase().includes('google trends') && t.length > 2);
    
    return trends.slice(0, 8).map((t, idx) => ({
      id: `gt-${Date.now()}-${idx}`,
      source: 'GOOGLE_TRENDS',
      title: t,
      velocityScore: 95 - (idx * 3),
      freshnessScore: 98,
      niche: 'Live Daily Trending Events',
      recommendedStyle: 'REMASTER_REACTION',
      rpmTier: 'MAX_VIRALITY',
      estimatedAPV: '135%',
      summary: `Live Google Trends spike query: ${t}`
    }));
  } catch (e) {
    return [];
  }
}

export async function fetchLiveEntertainmentAndMovieTrends(): Promise<TrendSignalCandidate[]> {
  const queries = [
    'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q=Spider-Man+OR+Marvel+OR+Movie+trailer+when:3d&hl=en-US&gl=US&ceid=US:en'
  ];

  const candidates: TrendSignalCandidate[] = [];

  for (const url of queries) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) continue;
      const text = await res.text();
      const matches = text.match(/<title>(.*?)<\/title>/g) || [];
      const cleanTitles = matches
        .map(m => m.replace(/<\/?title>/g, '').replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/ - [^-]+$/, '').trim())
        .filter(t => t && !t.toLowerCase().includes('google news') && t.length > 10);

      for (let i = 0; i < Math.min(cleanTitles.length, 5); i++) {
        const raw = cleanTitles[i];
        candidates.push({
          id: `ent-${Date.now()}-${candidates.length}`,
          source: 'GOOGLE_TRENDS',
          title: raw,
          velocityScore: 96 - (candidates.length * 2),
          freshnessScore: 99,
          niche: 'Blockbuster Movies & Marvel Secrets',
          recommendedStyle: 'CURIOSITY_SPLITSCREEN',
          rpmTier: 'MAX_VIRALITY',
          estimatedAPV: '140%',
          summary: `Live Pop-Culture & Movie Entertainment Trend: ${raw}`
        });
      }
    } catch (e) {}
  }
  return candidates;
}

export async function fetchLiveTechAndGamingTrends(): Promise<TrendSignalCandidate[]> {
  try {
    const res = await fetch('https://news.google.com/rss/search?q=AI+breakthrough+OR+GTA6+OR+gaming+when:3d&hl=en-US&gl=US&ceid=US:en', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return [];
    const text = await res.text();
    const matches = text.match(/<title>(.*?)<\/title>/g) || [];
    const cleanTitles = matches
      .map(m => m.replace(/<\/?title>/g, '').replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/ - [^-]+$/, '').trim())
      .filter(t => t && !t.toLowerCase().includes('google news') && t.length > 10);

    return cleanTitles.slice(0, 4).map((t, idx) => ({
      id: `tech-${Date.now()}-${idx}`,
      source: 'GOOGLE_TRENDS',
      title: t,
      velocityScore: 92 - (idx * 2),
      freshnessScore: 95,
      niche: 'AI & Future Technology',
      recommendedStyle: 'STANDARD',
      rpmTier: 'ULTRA_HIGH',
      estimatedAPV: '130%',
      summary: `Live Tech & Gaming Trend: ${t}`
    }));
  } catch (e) {
    return [];
  }
}

export async function fetchHackerNewsTrends(): Promise<TrendSignalCandidate[]> {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok) return [];
    const ids: number[] = await res.json();
    const topIds = ids.slice(0, 3);

    const candidates: TrendSignalCandidate[] = [];
    for (const id of topIds) {
      try {
        const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          signal: AbortSignal.timeout(2000)
        });
        if (!itemRes.ok) continue;
        const item = await itemRes.json();
        if (item && item.title) {
          candidates.push({
            id: `hn-${id}`,
            source: 'HACKER_NEWS',
            title: item.title,
            url: item.url,
            velocityScore: Math.min(100, 75 + Math.floor((item.score || 50) / 20)),
            freshnessScore: 92,
            niche: 'AI & Future Technology',
            recommendedStyle: 'STANDARD',
            rpmTier: 'ULTRA_HIGH',
            estimatedAPV: '120%',
            summary: `Hacker News Top Story with ${item.score} points: ${item.title}`
          });
        }
      } catch (e) {}
    }
    return candidates;
  } catch (e) {
    return [];
  }
}

export async function harvestMultiSourceSignals(): Promise<TrendSignalCandidate[]> {
  const [google, ent, tech, hn] = await Promise.all([
    fetchLiveGoogleTrends(),
    fetchLiveEntertainmentAndMovieTrends(),
    fetchLiveTechAndGamingTrends(),
    fetchHackerNewsTrends()
  ]);

  const all = [...ent, ...google, ...tech, ...hn];
  return all.sort((a, b) => (b.velocityScore + b.freshnessScore) - (a.velocityScore + a.freshnessScore));
}

export async function discoverDynamicOpportunity(
  userNichePreference?: string,
  excludedTopics: string[] = []
): Promise<OpportunityPlan> {
  const harvestedSignals = await harvestMultiSourceSignals();
  const lowerExcluded = excludedTopics.map(e => e.toLowerCase().trim());

  const validSignals = harvestedSignals.filter(s => {
    const titleLower = s.title.toLowerCase();
    return !lowerExcluded.some(ex => ex.length > 2 && (titleLower.includes(ex) || ex.includes(titleLower)));
  });

  if (validSignals.length > 0 && (!userNichePreference || userNichePreference.toLowerCase().includes('auto') || userNichePreference.toLowerCase().includes('all') || userNichePreference === 'General / Multi-Niche')) {
    const topSignal = validSignals[0];
    return {
      niche: topSignal.niche,
      topic: topSignal.title,
      recommendedStyle: topSignal.recommendedStyle,
      rpmTier: topSignal.rpmTier,
      estimatedAPV: topSignal.estimatedAPV,
      targetDurationSec: topSignal.recommendedStyle === 'PRODUCT_FIND' ? 35 : 45,
      reasoning: `Selected via ${topSignal.source} (Velocity Score: ${topSignal.velocityScore}/100, Freshness: ${topSignal.freshnessScore}/100).`,
      sourceSignal: topSignal
    };
  }

  const availableNiches = S_TIER_HIGH_RPM_NICHES;
  const filteredTopics: Array<{ niche: string; topic: string; style: any; rpmTier: any }> = [];

  for (const n of availableNiches) {
    for (const t of n.topics) {
      if (!lowerExcluded.some(ex => ex.length > 2 && (t.toLowerCase().includes(ex) || ex.includes(t.toLowerCase())))) {
        filteredTopics.push({
          niche: n.niche,
          topic: t,
          style: n.style,
          rpmTier: n.rpmTier
        });
      }
    }
  }

  const chosen = filteredTopics.length > 0
    ? filteredTopics[Math.floor(Math.random() * filteredTopics.length)]
    : {
        niche: 'AI & Future Technology',
        topic: 'Autonomous AI Robots Changing Every Industry',
        style: 'STANDARD' as const,
        rpmTier: 'ULTRA_HIGH' as const
      };

  return {
    niche: chosen.niche,
    topic: chosen.topic,
    recommendedStyle: chosen.style,
    rpmTier: chosen.rpmTier,
    estimatedAPV: '125%',
    targetDurationSec: chosen.style === 'PRODUCT_FIND' ? 35 : 45,
    reasoning: `S-Tier High-RPM Vault Selection with 0 repetition from recent history.`
  };
}
