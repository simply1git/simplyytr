import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { executeScrape } from '../queue/youtubeScraper';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
    try {
        let settings = await (prisma as any).systemSettings.findUnique({ where: { id: 1 } });
        if (!settings) {
            settings = await (prisma as any).systemSettings.create({ data: { targetNiche: 'Podcast Clips shorts', autoPilotEnabled: false } });
        }
        res.json({ success: true, settings });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const payload = { ...req.body };
        delete payload.id; // Don't allow changing ID
        delete payload.updatedAt;
        delete payload.lastScrapedAt; // Handled by backend
        
        // Ensure types are correct
        if (payload.scrapeIntervalMinutes) payload.scrapeIntervalMinutes = Number(payload.scrapeIntervalMinutes);
        if (payload.maxDownloadsPerRun) payload.maxDownloadsPerRun = Number(payload.maxDownloadsPerRun);
        if (payload.maxUploadsPerDay) payload.maxUploadsPerDay = Number(payload.maxUploadsPerDay);
        if (payload.videoSpeed) payload.videoSpeed = Number(payload.videoSpeed);
        if (payload.audioBass) payload.audioBass = Number(payload.audioBass);
        if (payload.overlayFontSize) payload.overlayFontSize = Number(payload.overlayFontSize);

        payload.lastScrapedAt = null;

        const settings = await (prisma as any).systemSettings.upsert({
            where: { id: 1 },
            update: payload,
            create: { id: 1, ...payload }
        });

        if (payload.autoPilotEnabled) {
            // Instantly start working when user clicks save
            executeScrape().catch(console.error);
        }

        res.json({ status: 'success', settings });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
