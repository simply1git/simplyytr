const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/metadata', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Using yt-dlp to fetch metadata as JSON
    const ytdlpProcess = spawn('yt-dlp', ['--dump-json', url]);

    let data = '';
    let errorData = '';

    ytdlpProcess.stdout.on('data', (chunk) => {
        data += chunk;
    });

    ytdlpProcess.stderr.on('data', (chunk) => {
        errorData += chunk;
    });

    ytdlpProcess.on('close', (code) => {
        if (code === 0) {
            try {
                const info = JSON.parse(data);
                res.json({
                    title: info.title,
                    thumbnail: info.thumbnail,
                    duration: info.duration_string,
                    uploader: info.uploader,
                    view_count: info.view_count,
                    formats: info.formats
                        .filter(f => f.resolution !== 'audio only' || f.acodec !== 'none')
                        .map(f => ({
                            format_id: f.format_id,
                            ext: f.ext,
                            resolution: f.resolution,
                            note: f.format_note,
                            vcodec: f.vcodec !== 'none' ? f.vcodec : null,
                            acodec: f.acodec !== 'none' ? f.acodec : null
                        }))
                });
            } catch (err) {
                res.status(500).json({ error: 'Failed to parse metadata' });
            }
        } else {
            res.status(500).json({ error: 'yt-dlp failed', details: errorData });
        }
    });
});

app.get('/api/select-directory', (req, res) => {
    const script = `import tkinter as tk\nfrom tkinter import filedialog\nroot = tk.Tk()\nroot.withdraw()\nroot.attributes('-topmost', True)\nprint(filedialog.askdirectory())`;
    const child = spawn('python', ['-c', script]);
    let result = '';
    child.stdout.on('data', d => result += d.toString());
    child.on('close', () => {
        res.json({ path: result.trim() });
    });
});

app.get('/api/download', (req, res) => {
    const { url, format, outputDir } = req.query;

    if (!url) {
        return res.status(400).end();
    }

    // Set up Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (type, data) => {
        res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    let downloadPath = outputDir || path.join(process.env.USERPROFILE, 'Downloads', 'youtubbot');
    if (!fs.existsSync(downloadPath)) {
        try {
            fs.mkdirSync(downloadPath, { recursive: true });
        } catch (err) {
            sendEvent('error', { message: 'Failed to create output directory' });
            return res.end();
        }
    }

    const args = [url, '--newline', '-o', path.join(downloadPath, '%(title)s.%(ext)s')];
    
    if (format === 'audio') {
        args.push('-x', '--audio-format', 'mp3', '--embed-thumbnail', '--embed-metadata');
    } else if (format && format !== 'best') {
        args.push('-f', `${format}+bestaudio/best`);
        args.push('--merge-output-format', 'mp4');
    } else {
        args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
        args.push('--merge-output-format', 'mp4');
    }

    const ytdlp = spawn('yt-dlp', args);

    ytdlp.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        // Typical yt-dlp line: [download]  10.0% of ~10.00MiB at  1.00MiB/s ETA 00:09
        const match = text.match(/\[download\]\s+(\d+\.?\d*)%\s+of[ ~]+([^ ]+)\s+at\s+([^ ]+)\s+ETA\s+([^ ]+)/);
        if (match) {
            sendEvent('progress', {
                percent: parseFloat(match[1]),
                size: match[2],
                speed: match[3],
                eta: match[4]
            });
        }
    });

    ytdlp.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        sendEvent('log', { message: text });
    });

    ytdlp.on('close', (code) => {
        if (code === 0) {
            sendEvent('complete', { message: 'Download finished' });
        } else {
            sendEvent('error', { message: `Process exited with code ${code}` });
        }
        res.end();
    });

    req.on('close', () => {
        ytdlp.kill();
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
