import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import path from 'path';
import { addEditorJob } from './editorQueue';
import { systemState } from '../state';

const prisma = new PrismaClient();

// In-Memory Queue Fallback (Since Docker/Redis is not available)
const queue: string[] = [];
let isProcessing = false;

export function addIngestJob(youtubeId: string) {
    queue.push(youtubeId);
    console.log(`[Queue] Added job for ${youtubeId}. Queue length: ${queue.length}`);
    processQueue();
}

async function processQueue() {
    if (isProcessing || queue.length === 0) return;

    isProcessing = true;
    const youtubeId = queue.shift()!;

    try {
        console.log(`[Queue] Processing job for ${youtubeId}... downloading media.`);
        await prisma.trendSignal.update({
            where: { youtubeId },
            data: { downloadStatus: 'DOWNLOADING' }
        });

        systemState.setTask(`Processing media for ${youtubeId}`);
        const localFilePath = await downloadMedia(youtubeId);
        
        await prisma.trendSignal.update({
            where: { youtubeId },
            data: { 
                localFilePath,
                downloadStatus: 'COMPLETED'
            }
        });
        console.log(`[Queue] Successfully downloaded media for ${youtubeId}. Saved to ${localFilePath}`);
        
        // Trigger auto-editing pipeline
        addEditorJob(youtubeId);
        
    } catch (err) {
        console.error(`[Queue] Job failed for ${youtubeId}:`, err);
        await prisma.trendSignal.update({
            where: { youtubeId },
            data: { downloadStatus: 'FAILED' }
        });
    } finally {
        isProcessing = false;
        systemState.setTask("Sleeping / Waiting for Next Task");
        // Process next job
        processQueue();
    }
}

// Use yt-dlp to download the actual high-quality mp4 video
function downloadMedia(youtubeId: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const url = `https://www.youtube.com/watch?v=${youtubeId}`;
        const outputTemplate = `../../storage/raw/${youtubeId}.%(ext)s`;
        
        // Download best video+audio, merge into mp4
        const ytdlp = spawn('yt-dlp', [
            '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            '-o', outputTemplate,
            '--merge-output-format', 'mp4',
            url
        ], { cwd: __dirname });
        
        ytdlp.stdout.on('data', (c) => console.log(`[yt-dlp ${youtubeId}] ${c.toString().trim()}`));
        ytdlp.stderr.on('data', (c) => console.error(`[yt-dlp ERR ${youtubeId}] ${c.toString().trim()}`));
        
        ytdlp.on('close', (code) => {
            if (code === 0) {
                // Return the expected file path
                resolve(`storage/raw/${youtubeId}.mp4`);
            } else {
                reject(new Error(`yt-dlp exited with code ${code}`));
            }
        });
    });
}
