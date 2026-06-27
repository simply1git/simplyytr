import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { generateViralMetadata } from '../services/aiRewriter';
import { uploadViaPuppeteer } from '../services/puppeteerUploader';

const router = Router();
const prisma = new PrismaClient();

// In a production environment, store these securely.
// For the MVP, we expect a client_secret.json in the backend root.
const CREDENTIALS_PATH = path.resolve(__dirname, '../../client_secret.json');

export function getOAuth2Client() {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        throw new Error("client_secret.json not found. Please download it from Google Cloud Console and place it in apps/backend/");
    }
    const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8')).web || JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8')).installed;
    return new google.auth.OAuth2(
        creds.client_id,
        creds.client_secret,
        creds.redirect_uris[0] || 'http://localhost:3001/api/publish/oauth2callback'
    );
}

// 1. Generate Auth URL
router.get('/auth', (req, res) => {
    try {
        const oauth2Client = getOAuth2Client();
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly']
        });
        res.json({ authUrl: url });
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});

// 2. Handle OAuth Callback
let globalTokens: any = null; // Storing in memory for MVP. Should be in DB.

export function getGlobalTokens() {
    return globalTokens;
}

router.get('/oauth2callback', async (req, res) => {
    try {
        const code = req.query.code as string;
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        globalTokens = tokens;
        res.send('Authentication successful! You can close this tab and go back to the dashboard to publish.');
    } catch (err) {
        res.status(500).send(`Auth error: ${String(err)}`);
    }
});

export async function uploadToYouTube(videoPath: string, title: string, description: string) {
    if (!globalTokens) {
        throw new Error('Not authenticated. Please authenticate via the dashboard first.');
    }

    if (!fs.existsSync(videoPath)) {
        throw new Error(`File missing at ${videoPath}`);
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(globalTokens);

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    console.log(`[YouTube] Uploading ${title}...`);

    const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
            snippet: {
                title: title,
                description: description,
                tags: ['shorts', 'viral'],
                categoryId: '24' // Entertainment
            },
            status: {
                privacyStatus: 'private', // Upload as private for safety in MVP
                selfDeclaredMadeForKids: false // "No, it's not made for kids"
            }
        },
        media: {
            body: fs.createReadStream(videoPath)
        }
    });

    return response.data.id;
}

// Force Upload Next Ready Video
router.post('/force-next', async (req, res) => {
    try {
        const trend = await prisma.trendSignal.findFirst({
            where: { downloadStatus: 'COMPLETED' },
            orderBy: { score: 'desc' }
        });

        if (!trend || !trend.processedFilePath) {
            return res.status(404).json({ error: "No completed videos ready for upload." });
        }

        const settings = await (prisma as any).systemSettings.findUnique({ where: { id: 1 } });
        const videoPath = path.resolve(__dirname, '../..', trend.processedFilePath);
        const { title, description } = await generateViralMetadata(trend.topic, settings);

        const videoId = await uploadViaPuppeteer(videoPath, title, description);
        
        await prisma.trendSignal.update({
            where: { youtubeId: trend.youtubeId },
            data: { downloadStatus: 'UPLOADED', publishedYoutubeId: videoId }
        });

        res.json({ status: 'success', videoId, topic: trend.topic });
    } catch (err: any) {
        console.error(err);
        if (err.message && err.message.includes('Not authenticated')) {
            res.status(401).json({ error: err.message, needsAuth: true });
        } else {
            res.status(500).json({ error: String(err) });
        }
    }
});

// 3. Publish Video
router.post('/:youtubeId', async (req, res) => {
    try {
        const { youtubeId } = req.params;
        const trend = await prisma.trendSignal.findUnique({ where: { youtubeId } });
        if (!trend || !trend.processedFilePath) {
            return res.status(404).json({ error: "Processed video not found." });
        }
        
        const settings = await (prisma as any).systemSettings.findUnique({ where: { id: 1 } });
        const videoPath = path.resolve(__dirname, '../..', trend.processedFilePath);
        const { title, description } = await generateViralMetadata(trend.topic, settings);

        const videoId = await uploadViaPuppeteer(videoPath, title, description);
        
        // Mark as uploaded in DB
        await prisma.trendSignal.update({
            where: { youtubeId },
            data: { downloadStatus: 'UPLOADED', publishedYoutubeId: videoId }
        });

        res.json({ status: 'success', videoId });
    } catch (err: any) {
        console.error(err);
        if (err.message && err.message.includes('Not authenticated')) {
            res.status(401).json({ error: err.message, needsAuth: true });
        } else {
            res.status(500).json({ error: String(err) });
        }
    }
});


export default router;
