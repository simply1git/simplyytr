"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrDownloadMusic = getOrDownloadMusic;
exports.addEditorJob = addEditorJob;
exports.processVideoForShorts = processVideoForShorts;
const client_1 = require("@prisma/client");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const state_1 = require("../state");
const execPromise = util_1.default.promisify(child_process_1.exec);
const prisma = new client_1.PrismaClient();
const editorQueue = [];
let isEditing = false;
async function getOrDownloadMusic(musicDir) {
    if (!fs_1.default.existsSync(musicDir))
        fs_1.default.mkdirSync(musicDir, { recursive: true });
    const files = fs_1.default.readdirSync(musicDir).filter(f => f.endsWith('.mp3'));
    if (files.length > 0) {
        // Return a random music file
        return path_1.default.join(musicDir, files[Math.floor(Math.random() * files.length)]);
    }
    console.log('[Editor] No background music found. Downloading a default Lo-Fi track...');
    const bgUrl = 'https://www.youtube.com/watch?v=1fueZCTYkpA'; // Example free lofi track
    try {
        const outputPath = path_1.default.join(musicDir, 'default_lofi.mp3');
        await execPromise(`yt-dlp -x --audio-format mp3 -o "${outputPath}" ${bgUrl}`);
        return outputPath;
    }
    catch (err) {
        console.error('[Editor] Failed to download default music:', err);
        return null; // Proceed without music
    }
}
function addEditorJob(youtubeId) {
    editorQueue.push(youtubeId);
    console.log(`[Editor] Added editing job for ${youtubeId}. Queue length: ${editorQueue.length}`);
    processEditorQueue();
}
async function processEditorQueue() {
    if (isEditing || editorQueue.length === 0)
        return;
    isEditing = true;
    const youtubeId = editorQueue.shift();
    try {
        state_1.systemState.setTask(`Editing video for Shorts: ${youtubeId}`);
        console.log(`[Editor] Processing auto-edit for ${youtubeId}...`);
        // Fetch the raw file path
        const trend = await prisma.trendSignal.findUnique({ where: { youtubeId } });
        if (!trend || !trend.localFilePath) {
            throw new Error(`No local file found for ${youtubeId}`);
        }
        const inputPath = path_1.default.resolve(__dirname, '../..', trend.localFilePath);
        const outputPath = path_1.default.resolve(__dirname, '../../storage/processed', `${youtubeId}_shorts.mp4`);
        // Ensure processed directory exists
        const processedDir = path_1.default.dirname(outputPath);
        if (!fs_1.default.existsSync(processedDir)) {
            fs_1.default.mkdirSync(processedDir, { recursive: true });
        }
        let settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
        if (!settings) {
            settings = { videoSpeed: 1.05, audioBass: 3, overlayPosition: 'CENTER', overlayFontSize: 80, overlayText: 'Wait for the end...', colorScramble: true };
        }
        const musicDir = path_1.default.resolve(__dirname, '../../storage/music');
        const musicPath = await getOrDownloadMusic(musicDir);
        await processVideoForShorts(inputPath, outputPath, settings, musicPath);
        // Update DB
        await prisma.trendSignal.update({
            where: { youtubeId },
            data: {
                processedFilePath: `storage/processed/${youtubeId}_shorts.mp4`
            }
        });
        console.log(`[Editor] Successfully edited video for ${youtubeId}. Saved to ${outputPath}`);
    }
    catch (err) {
        console.error(`[Editor] Editing failed for ${youtubeId}:`, err);
    }
    finally {
        isEditing = false;
        state_1.systemState.setTask("Sleeping / Waiting for Next Task");
        processEditorQueue();
    }
}
function processVideoForShorts(inputPath, outputPath, settings, musicPath) {
    return new Promise((resolve, reject) => {
        // Use relative path for FFmpeg on Windows to avoid 'C:/' drive letter colon parsing issues
        const fontPath = 'assets/font.ttf';
        let yPos = '(h/2)';
        if (settings.overlayPosition === 'TOP')
            yPos = '(h/5)';
        if (settings.overlayPosition === 'BOTTOM')
            yPos = '(h*4/5)';
        const colorStr = settings.colorScramble ? 'eq=brightness=0.01:contrast=1.02:saturation=1.05,' : '';
        const videoFilter = `crop=ih*9/16:ih,scale=1080:1920:flags=lanczos,setpts=${1 / settings.videoSpeed}*PTS,${colorStr}drawtext=fontfile='${fontPath}':text='${settings.overlayText}':fontcolor=white:fontsize=${settings.overlayFontSize}:x=(w-text_w)/2:y=${yPos}:shadowcolor=black:shadowx=5:shadowy=5`;
        let cmd = (0, fluent_ffmpeg_1.default)(inputPath);
        let complexFilter = [];
        let outputOptions = [];
        if (musicPath) {
            cmd = cmd.input(musicPath);
            // Mix original audio and background music (background volume lower)
            complexFilter = [
                `[0:v]${videoFilter}[v]`,
                `[0:a]atempo=${settings.videoSpeed},bass=g=${settings.audioBass},volume=1.0[a1]`,
                `[1:a]volume=0.2[a2]`,
                `[a1][a2]amix=inputs=2:duration=first:dropout_transition=2[a]`
            ];
            outputOptions = ['-map [v]', '-map [a]'];
        }
        else {
            complexFilter = [
                `[0:v]${videoFilter}[v]`,
                `[0:a]atempo=${settings.videoSpeed},bass=g=${settings.audioBass}[a]`
            ];
            outputOptions = ['-map [v]', '-map [a]'];
        }
        cmd.complexFilter(complexFilter)
            .outputOptions([
            ...outputOptions,
            '-c:v libx264',
            '-preset medium', // Better quality than fast
            '-crf 18', // High quality setting, replaces hardcoded videoBitrate
            '-c:a aac',
            '-b:a 192k', // Higher quality audio
            // limit duration to 60s for Shorts
            '-t 60'
        ])
            .save(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
    });
}
