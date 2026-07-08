"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeScrape = executeScrape;
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const readline_1 = __importDefault(require("readline"));
const path_1 = __importDefault(require("path"));
const state_1 = require("../state");
const ingestQueue_1 = require("./ingestQueue");
const prisma = new client_1.PrismaClient();
async function executeScrape() {
    console.log('[Scraper] Waking up to find viral videos...');
    try {
        let newDownloadsCount = 0;
        const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
        if (!settings || !settings.autoPilotEnabled) {
            console.log('[Scraper] Auto-pilot is disabled. Going back to sleep.');
            return;
        }
        const query = `${settings.targetNiche} shorts`;
        console.log(`[Scraper] Searching YouTube for: "${query}" (Max: ${settings.maxDownloadsPerRun || 1})`);
        // Using yt-dlp to search for top 20 results to find new unseen videos
        const storageDir = path_1.default.resolve(__dirname, '../../storage/raw');
        const ytDlp = (0, child_process_1.spawn)('yt-dlp', [
            `ytsearch20:${query}`,
            '--dump-json', // get metadata
            '-o', `${storageDir}/%(id)s.%(ext)s`,
            '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4' // force mp4
        ]);
        const rl = readline_1.default.createInterface({
            input: ytDlp.stdout,
            terminal: false
        });
        rl.on('line', async (line) => {
            try {
                const metadata = JSON.parse(line);
                // Check if we already have it
                const existing = await prisma.trendSignal.findUnique({ where: { youtubeId: metadata.id } });
                if (existing) {
                    console.log(`[Scraper] Already processed: ${metadata.title}, skipping...`);
                    return;
                }
                if (newDownloadsCount >= (settings.maxDownloadsPerRun || 1)) {
                    return; // We reached our quota for this run
                }
                console.log(`[Scraper] Found NEW viral video: ${metadata.title}`);
                newDownloadsCount++;
                const result = await prisma.trendSignal.upsert({
                    where: { youtubeId: metadata.id },
                    update: {},
                    create: {
                        youtubeId: metadata.id,
                        topic: metadata.title,
                        score: metadata.view_count || 0,
                        metadata: JSON.stringify(metadata),
                        downloadStatus: 'PENDING',
                    }
                });
                // If it was just created (or if we need to force it), queue it for download!
                if (result.downloadStatus === 'PENDING') {
                    (0, ingestQueue_1.addIngestJob)(metadata.id);
                }
            }
            catch (e) {
                // Ignore parse errors from non-json output
            }
        });
        ytDlp.on('close', (code) => {
            console.log(`[Scraper] Download cycle finished with code ${code}`);
            state_1.systemState.setTask("Sleeping / Waiting for Next Task");
        });
    }
    catch (err) {
        state_1.systemState.setTask("Sleeping / Waiting for Next Task");
        console.error('[Scraper] Error during scraping cycle:', err);
    }
}
