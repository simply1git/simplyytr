# YouTubBot - Fully Automated AI Shorts Generation Platform

YouTubBot is an end-to-end, highly scalable architecture for generating, editing, and uploading YouTube Shorts autonomously. It leverages the latest AI technologies to craft viral content based on real-time Google Trends and predefined channel formulas.

## 🏗️ Architecture Overview

The system is distributed across three main operational nodes:

### 1. Vercel Backend & Dashboard (`apps/web`)
- **Framework:** Next.js + Tailwind CSS
- **Database:** Supabase (PostgreSQL) + Prisma ORM
- **Functionality:** 
  - Generates scripts dynamically using the **Groq API**.
  - Polls live Google Trends via RSS to ensure script relevance.
  - Serves as the central command dashboard for adjusting configurations, triggering jobs, and monitoring the pipeline.
  - Handles webhooks from the worker to update database statuses and perform automated cloud storage cleanup (Cloudflare R2).

### 2. Kaggle GPU Worker (`kaggle-worker`)
- **Framework:** Python + FFmpeg
- **Functionality:** 
  - Retrieves `SCRIPTED` jobs from the Vercel backend.
  - **OpenVoice V2:** Synthesizes voiceovers and clones viral voices based on the dashboard configuration.
  - **SadTalker:** Generates highly realistic avatar lip-sync animations.
  - **Faster-Whisper:** Generates word-level `.ass` kinetic typography subtitles.
  - Composites all video layers, audio tracks, and subtitles using FFmpeg.
  - Uploads the final `.mp4` and `.jpg` (thumbnail) to Cloudflare R2 and updates the Vercel backend.

### 3. Bulletproof Uploader Agent (`apps/uploader-agent`)
- **Framework:** Node.js + Puppeteer Extra (with Stealth plugin)
- **Functionality:**
  - Polls the Vercel API every 5 minutes for `READY` jobs.
  - Downloads the finished video and thumbnail from Cloudflare R2.
  - Automatically drives a Chromium browser to upload the video to YouTube Studio.
  - Safely monitors the YouTube interface to ensure 100% upload completion before publishing.
  - Emits Telegram notifications on upload success or failure.

---

## 🚀 Content Formulas

The platform operates using modular AI video pipelines depending on the selected formula in the dashboard:

1. **Formula B (Viral Clone & Avatar - Default)**
   - Downloads a viral short based on targeted channels.
   - Allows users to **Replace Original Audio** with a new AI-cloned voice (via OpenVoice) reading a fresh script.
   - Alternatively, it can preserve the original background audio and vocals, feeding it directly into SadTalker for avatar lip-syncing and Whisper for subtitles.

2. **Formula A (Split-Screen Aggregator)**
   - Combines a viral short on top with deeply satisfying B-roll (Pexels) on the bottom.
   - Professionally formatted at a `1080x1080` top and `1080x840` bottom aspect ratio with a sleek 8px solid dividing line.
   - Features customized color grading to enhance contrast and make the bottom subtitle overlay pop.

3. **Formula C (AI Re-Narration)**
   - A fully generative pipeline using Pexels B-roll, a custom Groq-generated script, and a neural TTS voiceover.

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- Python 3.10+ (for local worker testing)
- FFmpeg installed and in your system PATH
- A Supabase PostgreSQL database
- A Cloudflare R2 bucket

### 1. Environment Configuration
Duplicate `.env.example` to `.env` in the root directory and populate your API keys:
```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://user:pass@host:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/postgres"

# APIs
GROQ_API_KEY="..."
PEXELS_API_KEY="..."

# Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="..."
R2_PUBLIC_URL="..."

# Internal Security
PIPELINE_SECRET="your_custom_secret_key"
VERCEL_API_URL="http://localhost:3000"
```

### 2. Install Dependencies
Navigate to the root directory and run:
```bash
npm install
npm run postinstall --workspace=web
```

### 3. Initialize the Database
Deploy the Prisma schema to Supabase:
```bash
npx prisma generate --schema=packages/database/prisma/schema.prisma
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

---

## ⚙️ Running the System

To run the full pipeline locally:

1. **Start the Dashboard / Backend**
   ```bash
   cd apps/web
   npm run dev
   ```
   *Dashboard will be available at `http://localhost:3000`.*

2. **Start the Uploader Agent**
   Make sure you have logged into YouTube Studio via Chrome using the same profile first (`npm run login` in the agent directory).
   ```bash
   cd apps/uploader-agent
   npm start
   ```

3. **Start the Kaggle GPU Worker (Locally)**
   You can run the python script directly if you have an NVIDIA GPU (CUDA).
   ```bash
   cd kaggle-worker
   pip install -r requirements.txt
   python video_generator.py
   ```

---

## 🆕 Recent Updates

- **Strict Upload Verification:** The uploader agent now meticulously verifies that a video upload is 100% complete and bytes have been flushed before navigating away or hitting Publish.
- **Original Audio Toggle:** Introduced a flexible setting in the dashboard allowing the Clone pipeline to preserve the original viral audio track instead of defaulting to an AI Voice clone.
- **Professional Split Screen:** Upgraded the Split-Screen FFmpeg pipeline for a cleaner, cinematic layout (1080x1080 top frame) with tailored saturation enhancements.
- **Auto-Cleanup:** Once the uploader successfully posts to YouTube, a webhook signals the backend to instantly delete the heavy `.mp4`, `.jpg`, and `.wav` files from the Cloudflare R2 bucket to save storage.
