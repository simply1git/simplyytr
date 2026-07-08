"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const prisma = new client_1.PrismaClient();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const state_1 = require("./state");
app.get('/api/status', (req, res) => {
    res.json({ task: state_1.systemState.currentTask, lastUpdate: state_1.systemState.lastUpdate });
});
app.get('/health', async (req, res) => {
    try {
        // Basic query to check DB connection
        const channelsCount = await prisma.channel.count();
        res.json({ status: 'ok', service: 'youtubbot-backend', db: 'connected', channelsCount });
    }
    catch (err) {
        res.status(500).json({ status: 'error', error: String(err) });
    }
});
const trends_1 = __importDefault(require("./routes/trends"));
const briefs_1 = __importDefault(require("./routes/briefs"));
const publish_1 = __importDefault(require("./routes/publish"));
const settings_1 = __importDefault(require("./routes/settings"));
// Mount modular routes
app.use('/api/trends', trends_1.default);
app.use('/api/briefs', briefs_1.default);
app.use('/api/publish', publish_1.default);
app.use('/api/settings', settings_1.default);
const youtubeScraper_1 = require("./queue/youtubeScraper");
const youtubePublisher_1 = require("./queue/youtubePublisher");
const analyticsTracker_1 = require("./queue/analyticsTracker");
const node_cron_1 = __importDefault(require("node-cron"));
app.listen(PORT, () => {
    console.log(`Backend service is running on http://localhost:${PORT}`);
    console.log('[Master Clock] Initializing the Master Configuration Engine...');
    // The Master Clock ticks every minute
    node_cron_1.default.schedule('* * * * *', async () => {
        try {
            const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
            if (!settings || !settings.autoPilotEnabled)
                return;
            const now = new Date();
            const currentHour = now.getHours().toString().padStart(2, '0');
            const currentMinute = now.getMinutes().toString().padStart(2, '0');
            const currentTimeString = `${currentHour}:${currentMinute}`;
            // 1. Check if we should scrape
            if (!settings.lastScrapedAt) {
                state_1.systemState.setTask("Checking for new trends...");
                await (0, youtubeScraper_1.executeScrape)();
                state_1.systemState.setTask("Sleeping / Waiting for Next Task");
                await prisma.systemSettings.update({ where: { id: 1 }, data: { lastScrapedAt: new Date() } });
            }
            else {
                const minutesSinceLastScrape = Math.abs(now.getTime() - new Date(settings.lastScrapedAt).getTime()) / (60 * 1000);
                if (minutesSinceLastScrape >= settings.scrapeIntervalMinutes) {
                    state_1.systemState.setTask("Checking for new trends...");
                    await (0, youtubeScraper_1.executeScrape)();
                    state_1.systemState.setTask("Sleeping / Waiting for Next Task");
                    await prisma.systemSettings.update({ where: { id: 1 }, data: { lastScrapedAt: new Date() } });
                }
            }
            // 2. Check if we should publish
            const uploadTimes = settings.uploadTimes.split(',').map((t) => t.trim());
            if (uploadTimes.includes(currentTimeString)) {
                state_1.systemState.setTask("Starting publisher task...");
                await (0, youtubePublisher_1.executePublish)();
                state_1.systemState.setTask("Sleeping / Waiting for Next Task");
            }
            // 3. Analytics (Midnight)
            if (currentTimeString === '00:00') {
                await (0, analyticsTracker_1.executeAnalytics)();
            }
        }
        catch (err) {
            console.error('[Master Clock] Error reading settings or executing tasks:', err);
        }
    });
});
