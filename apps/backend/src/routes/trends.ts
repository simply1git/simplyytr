import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import { addIngestJob } from '../queue/ingestQueue';

const router = Router();
const prisma = new PrismaClient();

// Helper to run yt-dlp
function fetchMetadata(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const ytdlp = spawn('yt-dlp', ['--dump-json', url]);
        let data = '';
        let errorData = '';

        ytdlp.stdout.on('data', (chunk) => {
            data += chunk;
        });

        ytdlp.stderr.on('data', (chunk) => {
            errorData += chunk;
        });

        ytdlp.on('close', (code) => {
            if (code === 0) {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Failed to parse metadata'));
                }
            } else {
                reject(new Error(`yt-dlp failed: ${errorData}`));
            }
        });
    });
}

router.post('/ingest', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        console.log(`Ingesting metadata for ${url}...`);
        const info = await fetchMetadata(url);

        // Extract youtubeId
        const youtubeId = info.id;
        const topic = info.title;
        
        // Save to Database
        const trend = await prisma.trendSignal.upsert({
            where: { youtubeId },
            update: {
                topic,
                metadata: JSON.stringify({
                    viewCount: info.view_count,
                    likeCount: info.like_count,
                    duration: info.duration,
                    uploader: info.uploader
                }),
                score: info.view_count ? info.view_count / 1000 : 0
            },
            create: {
                youtubeId,
                topic,
                metadata: JSON.stringify({
                    viewCount: info.view_count,
                    likeCount: info.like_count,
                    duration: info.duration,
                    uploader: info.uploader
                }),
                score: info.view_count ? info.view_count / 1000 : 0
            }
        });

        // Add to background queue to fetch transcript & generate embeddings later
        addIngestJob(youtubeId);

        res.json({ status: 'success', trend });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: String(err) });
    }
});

// Get all trends
router.get('/', async (req, res) => {
    try {
        const trends = await prisma.trendSignal.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(trends);
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// Delete a trend
router.delete('/:youtubeId', async (req, res) => {
    try {
        const { youtubeId } = req.params;
        await prisma.trendSignal.delete({
            where: { youtubeId }
        });
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});

export default router;
