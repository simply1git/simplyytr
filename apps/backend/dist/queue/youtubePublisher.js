"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePublish = executePublish;
const client_1 = require("@prisma/client");
const puppeteerUploader_1 = require("../services/puppeteerUploader");
const editorQueue_1 = require("./editorQueue");
const aiRewriter_1 = require("../services/aiRewriter");
const state_1 = require("../state");
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
// Run the auto-publisher at peak times (e.g. 15:00 and 18:00)
// For testing purposes, we can run it every hour: '0 * * * *'
// Or daily at 3 PM: '0 15 * * *'
async function executePublish() {
    console.log('[Publisher] Waking up to process pending videos...');
    try {
        const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
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
            const rawPath = video.localFilePath;
            const processedPath = rawPath.replace('raw', 'processed').replace('.mp4', '_shorts.mp4');
            state_1.systemState.setTask(`Triggering Editor AI for ${video.topic}...`);
            console.log(`[Publisher] Triggering Editor AI for ${video.topic}...`);
            const musicDir = path_1.default.resolve(__dirname, '../../storage/music');
            const musicPath = await (0, editorQueue_1.getOrDownloadMusic)(musicDir);
            // Trigger the Editor Pipeline
            await (0, editorQueue_1.processVideoForShorts)(rawPath, processedPath, settings, musicPath);
            // Trigger the AI Meta-writer
            state_1.systemState.setTask(`Writing metadata using Gemini for ${video.topic}...`);
            console.log(`[Publisher] Triggering Gemini AI Meta-Writer...`);
            const meta = await (0, aiRewriter_1.generateViralMetadata)(video.topic, settings);
            state_1.systemState.setTask(`Uploading to YouTube: ${meta.title}...`);
            console.log(`[Publisher] Uploading to YouTube... Title: ${meta.title}`);
            // Upload to YouTube via Puppeteer Stealth
            const videoId = await (0, puppeteerUploader_1.uploadViaPuppeteer)(processedPath, meta.title, meta.description);
            // Mark as UPLOADED
            await prisma.trendSignal.update({
                where: { id: video.id },
                data: { downloadStatus: 'UPLOADED', processedFilePath: processedPath, publishedYoutubeId: videoId }
            });
            console.log(`[Publisher] ✅ Successfully published video: ${video.topic}`);
        }
        console.log('[Publisher] Cycle complete. Going back to sleep.');
    }
    catch (err) {
        console.error('[Publisher] Error during publisher cycle:', err);
    }
}
