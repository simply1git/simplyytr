import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import { getOAuth2Client, getGlobalTokens } from '../routes/publish';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function executeAnalytics() {
    console.log('[Analytics] Waking up to fetch YouTube views...');
    
    try {
        const settings = await (prisma as any).systemSettings.findUnique({ where: { id: 1 } });
        if (!settings || !settings.enableSelfLearningAI) {
            console.log('[Analytics] Self-Learning AI is disabled. Going back to sleep.');
            return;
        }

        const tokens = getGlobalTokens();
        if (!tokens) {
            console.log('[Analytics] YouTube Auth token missing. Cannot fetch analytics.');
            return;
        }

        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials(tokens);
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

        // Fetch all videos that were uploaded and have a publishedYoutubeId
        const uploadedVideos = await prisma.trendSignal.findMany({
            where: { 
                downloadStatus: 'UPLOADED',
                publishedYoutubeId: { not: null }
            },
            orderBy: { createdAt: 'desc' },
            take: 5 // Analyze the last 5 videos
        });

        if (uploadedVideos.length === 0) {
            console.log('[Analytics] No published videos with tracked IDs found yet.');
            return;
        }

        console.log(`[Analytics] Checking views for ${uploadedVideos.length} recent videos...`);

        let totalViews = 0;
        let validVideos = 0;

        for (const video of uploadedVideos) {
            try {
                const response = await youtube.videos.list({
                    part: ['statistics'],
                    id: [video.publishedYoutubeId!]
                });

                if (response.data.items && response.data.items.length > 0) {
                    const stats = response.data.items[0].statistics;
                    const views = parseInt(stats?.viewCount || '0', 10);
                    totalViews += views;
                    validVideos++;
                    
                    // Update DB with latest views
                    await prisma.trendSignal.update({
                        where: { id: video.id },
                        data: { youtubeViews: views }
                    });
                }
            } catch (err) {
                console.error(`[Analytics] Failed to fetch stats for ${video.publishedYoutubeId}:`, err);
            }
        }

        if (validVideos === 0) return;

        const avgViews = totalViews / validVideos;
        console.log(`[Analytics] Average views across last ${validVideos} videos: ${avgViews}`);

        // Threshold for pivot (e.g. if average views are less than 50)
        const PIVOT_THRESHOLD = 50;

        if (avgViews < PIVOT_THRESHOLD) {
            console.log(`[Analytics] Average views (${avgViews}) below threshold (${PIVOT_THRESHOLD}). Triggering AI Director to pivot niche...`);
            
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
                const prompt = `
                You are an expert YouTube algorithm Data Analyst.
                My current automated channel niche is "${settings.targetNiche}".
                The tone of my channel is "${settings.geminiTone}".
                Our recent average view count has dropped to ${avgViews}, indicating the niche is saturated or boring.
                Suggest a highly-viral, specific 3-word YouTube search query (e.g., "Minecraft speedrun shorts" or "Sigma male grindset") that I should pivot to immediately for maximum views.
                Respond ONLY with the 3 to 4 word string. Do not use quotes or punctuation.
                `;

                const result = await model.generateContent(prompt);
                let newNiche = result.response.text().trim().replace(/["']/g, '');

                console.log(`[Analytics] 🧠 AI Director chose new niche: "${newNiche}"`);

                await (prisma as any).systemSettings.update({
                    where: { id: 1 },
                    data: { targetNiche: newNiche }
                });

            } catch (e) {
                console.error('[Analytics] AI Director failed to pivot:', e);
            }
        } else {
            console.log(`[Analytics] Average views (${avgViews}) are good. Holding current niche: "${settings.targetNiche}"`);
        }

    } catch (err) {
        console.error('[Analytics] Error during analytics cycle:', err);
    }
}
