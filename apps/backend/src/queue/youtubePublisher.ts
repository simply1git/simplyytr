import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { uploadViaPuppeteer } from '../services/puppeteerUploader';
import { processVideoForShorts, getOrDownloadMusic } from './editorQueue';
import { generateViralMetadata } from '../services/aiRewriter';
import { systemState } from '../state';
import path from 'path';

const prisma = new PrismaClient();

// Run the auto-publisher at peak times (e.g. 15:00 and 18:00)
// For testing purposes, we can run it every hour: '0 * * * *'
// Or daily at 3 PM: '0 15 * * *'
export async function executePublish() {
    console.log('[Publisher] Waking up to process pending videos...');
    
    try {
        const settings = await (prisma as any).systemSettings.findUnique({ where: { id: 1 } });
        if (!settings || !settings.autoPilotEnabled) {
            console.log('[Publisher] Auto-Pilot is disabled. Returning to sleep.');
            return;
        }

        // Fetch videos that have been downloaded but not yet uploaded
        const pendingVideos = await prisma.trendSignal.findMany({
            where: { downloadStatus: 'COMPLETED' },
            take: settings.maxUploadsPerDay || 2 // Limit to max uploads
        });

        if (pendingVideos.length === 0) {
            console.log('[Publisher] No pending videos to process.');
            return;
        }

        console.log(`[Publisher] Found ${pendingVideos.length} pending videos. Starting editing and upload sequence...`);

        // Check if OAuth tokens exist before trying to upload (Deprecating for Puppeteer)
        // if (!getGlobalTokens()) {
        //     console.log('[Publisher] ⚠️ User has not authenticated YouTube yet. Please visit http://localhost:3000 to sign in.');
        //     return;
        // }

        for (const video of pendingVideos) {
            const rawPath = video.localFilePath!;
            const processedPath = rawPath.replace('raw', 'processed').replace('.mp4', '_shorts.mp4');
            
            systemState.setTask(`Triggering Editor AI for ${video.topic}...`);
            console.log(`[Publisher] Triggering Editor AI for ${video.topic}...`);
            
            const musicDir = path.resolve(__dirname, '../../storage/music');
            const musicPath = await getOrDownloadMusic(musicDir);

            // Trigger the Editor Pipeline
            await processVideoForShorts(rawPath, processedPath, settings, musicPath);

            // Trigger the AI Meta-writer
            systemState.setTask(`Writing metadata using Gemini for ${video.topic}...`);
            console.log(`[Publisher] Triggering Gemini AI Meta-Writer...`);
            const meta = await generateViralMetadata(video.topic, settings);

            systemState.setTask(`Uploading to YouTube: ${meta.title}...`);
            console.log(`[Publisher] Uploading to YouTube... Title: ${meta.title}`);
            
            // Upload to YouTube via Puppeteer Stealth
            const videoId = await uploadViaPuppeteer(processedPath, meta.title, meta.description);
            
            // Mark as UPLOADED
            await prisma.trendSignal.update({
                where: { id: video.id },
                data: { downloadStatus: 'UPLOADED', processedFilePath: processedPath, publishedYoutubeId: videoId }
            });

            console.log(`[Publisher] ✅ Successfully published video: ${video.topic}`);
        }

        console.log('[Publisher] Cycle complete. Going back to sleep.');
    } catch (err) {
        console.error('[Publisher] Error during publisher cycle:', err);
    }
}
