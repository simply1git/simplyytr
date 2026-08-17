import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import readline from 'readline';
import path from 'path';
import { systemState } from '../state';
import { addIngestJob } from './ingestQueue';

const prisma = new PrismaClient();

export async function executeScrape() {
    console.log('[Competitive Pulse] Waking up to scan viral topics & competitor velocity...');
    
    try {
        let newDownloadsCount = 0;
        const settings = await (prisma as any).systemSettings.findUnique({ where: { id: 1 } });
        if (!settings || !settings.autoPilotEnabled) {
            console.log('[Competitive Pulse] Auto-pilot is disabled. Going back to sleep.');
            return;
        }

        const query = `${settings.targetNiche} shorts`;
        console.log(`[Competitive Pulse] Searching YouTube for: "${query}" (Max: ${settings.maxDownloadsPerRun || 1})`);

        const storageDir = path.resolve(__dirname, '../../storage/raw');
        
        const ytDlp = spawn('yt-dlp', [
            `ytsearch20:${query}`,
            '--dump-json',
            '-o', `${storageDir}/%(id)s.%(ext)s`,
            '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4'
        ]);

        const rl = readline.createInterface({
            input: ytDlp.stdout,
            terminal: false
        });

        rl.on('line', async (line) => {
            try {
                const metadata = JSON.parse(line);
                
                // Calculate velocity per hour based on upload timestamp
                const uploadTimestamp = metadata.timestamp || (Date.now() / 1000 - 86400);
                const hoursOld = Math.max(0.5, (Date.now() / 1000 - uploadTimestamp) / 3600);
                const viewCount = metadata.view_count || 1000;
                const velocityPerHour = Math.round(viewCount / hoursOld);
                
                // Predation score (0 to 100)
                let predationScore = 40.0;
                if (velocityPerHour > 10000) predationScore = 95.0;
                else if (velocityPerHour > 4000) predationScore = 80.0;
                else if (velocityPerHour > 1000) predationScore = 60.0;

                // Check if already processed
                const existing = await prisma.trendSignal.findUnique({ where: { youtubeId: metadata.id } });
                if (existing) {
                    // Update velocity
                    await prisma.trendSignal.update({
                        where: { youtubeId: metadata.id },
                        data: {
                            velocityPerHour,
                            predationScore,
                            youtubeViews: viewCount
                        }
                    });
                    return;
                }

                if (newDownloadsCount >= (settings.maxDownloadsPerRun || 1)) {
                    return;
                }

                console.log(`[Competitive Pulse] Found HIGH VELOCITY video: "${metadata.title}" (${velocityPerHour} v/hr, Score: ${predationScore})`);
                newDownloadsCount++;

                const result = await prisma.trendSignal.upsert({
                    where: { youtubeId: metadata.id },
                    update: {
                        velocityPerHour,
                        predationScore,
                        youtubeViews: viewCount
                    },
                    create: {
                        youtubeId: metadata.id,
                        topic: metadata.title,
                        score: viewCount,
                        velocityPerHour,
                        predationScore,
                        metadata: JSON.stringify(metadata),
                        downloadStatus: 'PENDING',
                    }
                });
                
                if (result.downloadStatus === 'PENDING') {
                    addIngestJob(metadata.id);
                }
            } catch (e) {
                // Ignore non-json output
            }
        });

        ytDlp.on('close', (code) => {
            console.log(`[Competitive Pulse] Scan finished with code ${code}`);
            systemState.setTask("Sleeping / Waiting for Next Task");
        });

    } catch (err) {
        systemState.setTask("Sleeping / Waiting for Next Task");
        console.error('[Competitive Pulse] Error during scraping cycle:', err);
    }
}
