import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import path from 'path';
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

import { systemState } from './state';

app.get('/api/status', (req, res) => {
  res.json({ task: systemState.currentTask, lastUpdate: systemState.lastUpdate });
});

app.get('/health', async (req, res) => {
  try {
    // Basic query to check DB connection
    const channelsCount = await prisma.channel.count();
    res.json({ status: 'ok', service: 'youtubbot-backend', db: 'connected', channelsCount });
  } catch (err) {
    res.status(500).json({ status: 'error', error: String(err) });
  }
});

import trendsRouter from './routes/trends';
import briefsRouter from './routes/briefs';
import publishRouter from './routes/publish';
import settingsRouter from './routes/settings';

// Mount modular routes
app.use('/api/trends', trendsRouter);
app.use('/api/briefs', briefsRouter);
app.use('/api/publish', publishRouter);
app.use('/api/settings', settingsRouter);

import { executeScrape } from './queue/youtubeScraper';
import { executePublish } from './queue/youtubePublisher';
import { executeAnalytics } from './queue/analyticsTracker';
import cron from 'node-cron';

app.listen(PORT, () => {
  console.log(`Backend service is running on http://localhost:${PORT}`);
  console.log('[Master Clock] Initializing the Master Configuration Engine...');

  // The Master Clock ticks every minute
  cron.schedule('* * * * *', async () => {
    try {
      const settings = await (prisma as any).systemSettings.findUnique({ where: { id: 1 } });
      if (!settings || !settings.autoPilotEnabled) return;

      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const currentTimeString = `${currentHour}:${currentMinute}`;

      // 1. Check if we should scrape
      if (!settings.lastScrapedAt) {
        systemState.setTask("Checking for new trends...");
        await executeScrape();
        systemState.setTask("Sleeping / Waiting for Next Task");
        await (prisma as any).systemSettings.update({ where: { id: 1 }, data: { lastScrapedAt: new Date() } });
      } else {
        const minutesSinceLastScrape = Math.abs(now.getTime() - new Date(settings.lastScrapedAt).getTime()) / (60 * 1000);
        if (minutesSinceLastScrape >= settings.scrapeIntervalMinutes) {
          systemState.setTask("Checking for new trends...");
          await executeScrape();
          systemState.setTask("Sleeping / Waiting for Next Task");
          await (prisma as any).systemSettings.update({ where: { id: 1 }, data: { lastScrapedAt: new Date() } });
        }
      }

      // 2. Check if we should publish
      const uploadTimes = settings.uploadTimes.split(',').map((t: string) => t.trim());
      if (uploadTimes.includes(currentTimeString)) {
        systemState.setTask("Starting publisher task...");
        await executePublish();
        systemState.setTask("Sleeping / Waiting for Next Task");
      }

      // 3. Analytics (Midnight)
      if (currentTimeString === '00:00') {
        await executeAnalytics();
      }

    } catch (err) {
      console.error('[Master Clock] Error reading settings or executing tasks:', err);
    }
  });
});
