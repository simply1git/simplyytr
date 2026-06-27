# @youtubbot/uploader-agent

Lightweight local agent that polls the Vercel pipeline API for ready upload jobs and publishes videos to YouTube via Puppeteer.

## How It Works

```
┌──────────────┐   GET /api/pipeline/ready-jobs   ┌───────────────┐
│  This Agent   │ ──────────────────────────────►  │  Vercel API   │
│  (local PC)   │ ◄──────────────────────────────  │  (cloud)      │
└──────┬───────┘       job list (JSON)             └───────────────┘
       │
       │  1. Download MP4 + thumbnail from R2
       │  2. Launch Chrome (stealth mode)
       │  3. Upload to YouTube Studio
       │  4. POST /api/pipeline/complete
       │
       ▼
┌──────────────┐
│   YouTube     │
│   Studio      │
└──────────────┘
```

The agent runs an infinite **polling loop every 5 minutes**. When it finds jobs:

1. Downloads the video (`.mp4`) and thumbnail from the provided R2 URLs
2. Opens YouTube Studio using a persistent Chrome profile (stays logged in)
3. Uploads the video, sets title, description, tags, audience, and visibility
4. Reports the published YouTube video ID back to the API
5. Cleans up downloaded files

## Prerequisites

- **Node.js 18+** (uses built-in `fetch`)
- **Google Chrome** installed at one of:
  - `C:\Program Files\Google\Chrome\Application\chrome.exe`
  - `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
  - Falls back to Puppeteer's bundled Chromium

## Setup

### 1. Install dependencies

```bash
cd apps/uploader-agent
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Vercel URL and pipeline secret
```

| Variable         | Description                          | Example                         |
| ---------------- | ------------------------------------ | ------------------------------- |
| `VERCEL_API_URL` | Your deployed Vercel app URL         | `https://your-app.vercel.app`   |
| `PIPELINE_SECRET`| Secret key for pipeline API auth     | `sk_pipeline_xxxxx`             |
| `DOWNLOAD_DIR`   | Local directory for temp downloads   | `./downloads`                   |

### 3. First-time YouTube login

Before the agent can upload, you need to log in to YouTube once:

```bash
node index.js --manual-login
# or
npm run login
```

This opens a Chrome window. Log in to your YouTube account, then **close the browser**. Your session is saved to `storage/chrome_profile/` and reused for all future uploads.

### 4. Run the agent

```bash
# Foreground (see logs)
npm start

# Or directly
node index.js
```

### 5. Run in background (Windows)

Double-click `start_agent.vbs` to run the agent silently in the background.

To stop it, open Task Manager and end the `node.exe` process, or run:

```bash
taskkill /f /im node.exe
```

## Retry Logic

If an upload fails, the agent will:
- Retry up to **2 additional times** with a **30-second delay** between attempts
- If all retries fail, report the failure to the API and move to the next job
- One failed job does **not** block other jobs from being processed

## File Structure

```
apps/uploader-agent/
├── index.js          # Main agent script
├── package.json      # Dependencies
├── .env.example      # Environment template
├── .env              # Your config (git-ignored)
├── start_agent.vbs   # Windows silent launcher
├── storage/
│   └── chrome_profile/  # Persistent Chrome session (auto-created)
├── downloads/           # Temp download dir (auto-created, auto-cleaned)
└── README.md
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Not logged in" during upload | Run `npm run login` to re-authenticate |
| Chrome not found | Install Chrome or let Puppeteer use its bundled browser |
| API 401 errors | Check `PIPELINE_SECRET` in `.env` matches your Vercel config |
| Upload stuck on processing | YouTube may be slow; the agent waits up to 5 min |
