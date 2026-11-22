# SIMPLYYTR 2.0 — OPERATOR RUNBOOK & SYSTEM HANDOFF

**Version:** 2.0.0 (Post-Acceptance)  
**Classification:** Operational Guide  
**Target Platform:** Windows 10/11 x64 & Linux x64  
**Workspace:** `D:\Projects\SIMPLYYTR`  

---

## 1. System Prerequisites

Before starting the platform, ensure the following core tools are installed on your host machine:

| Component | Minimum Version | Verified Status on Host | Purpose |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` (Recommended: v24.x) | Node v24.11.0 active | Core runtime for Next.js, Express, and Worker |
| **npm** | `>= 10.0.0` | npm v10.9.0 active | Package and workspace manager |
| **FFmpeg & FFprobe** | `>= 5.0` | Installed & in system PATH | Local 1080x1920 MP4 video and audio compositing |
| **Voice Synthesizer** | SAPI (Windows) or eSpeak/Piper (Linux) | Windows SAPI (David Desktop) active | Authentic local voiceover narration generation |
| **PostgreSQL Port** | Port `5432` available | Embedded Postgres 18.4 configured | Primary transactional storage (`simplyytr_dev`) |
| **Web Port** | Port `3000` available | Available | Next.js Command Center Dashboard |

> [!IMPORTANT]
> **Port Isolation Rule:** SIMPLYYTR is bound to port `5432` (PostgreSQL) and port `3000` (Next.js). It will **never** bind to or interfere with the unrelated host ERP service running on port `55432`.

---

## 2. Quick-Start Commands

### Step A: Start the Database Safely
Run the preflight-safe database startup command. The `--skip-env-sync` flag ensures your `.env` configuration file is preserved without automatic overwrites:

```powershell
npm run db:start:safe
```
*Verify database status:*
```powershell
npm run db:status
```
*(Expected output: `[LocalDB] Status: RUNNING on port 5432`)*

### Step B: Launch the Command Center Dashboard
Start the Next.js development server:

```powershell
npm run dev --workspace=web
```
*Open your browser locally to:*
👉 **`http://localhost:3000`**

### Step C: Execute the Local Media Worker
In a separate terminal, launch the media worker:

- **To render one pending job (Single-Shot Mode):**
  ```powershell
  npm run worker:once
  ```
- **To run as a continuous polling daemon:**
  ```powershell
  npm run worker
  ```

---

## 3. End-to-End Operator Workflow

Here is how to create, inspect, approve, render, and review a video:

```
[1. Trigger Topic] ──► [2. Evidence Extraction] ──► [3. Quality Gate (NEEDS_REVIEW)]
                                                               │
[5. Local Worker Render] ◄── [4. Operator Evidence Approval] ◄─┘
         │
         ▼
[6. Technical Verification] ──► [7. Authenticated Streaming / Manual Publish]
```

### Step 1: Trigger Topic Generation
1. In the Dashboard (`http://localhost:3000`), navigate to the **Command Center** tab.
2. Under **Quick Launch**, type your topic in the prompt box (e.g., *"Why airplane windows have rounded corners"* or *"Why modern smartphones no longer have headphone jacks"*).
3. Select your desired video style (e.g., `REMASTER_REACTION`).
4. Click **Generate Video Short**.

### Step 2: Automated Evidence Grounding & Quality Gate
- The pipeline harvests the topic, extracts factual claims, and evaluates required evidence citations.
- If live external LLM keys are absent, the system **honestly degrades** to deterministic topic-grounded generation (`DETERMINISTIC_TOPIC_DEMO`).
- The Strict Quality Gate automatically holds the job in **`NEEDS_REVIEW`** status to prevent ungrounded autonomous publishing.

### Step 3: Inspect Evidence in the Command Center
1. In the **Pipeline Job Execution Queue**, find your job.
2. In the **Actions** column, click the **"Evidence"** button.
3. The **Evidence & Provenance Inspector Modal** will display:
   - Every factual claim and required manufacturer source citation.
   - The primary source reference URL.
   - The extracted excerpt (clearly labeled as *Verbatim Quote* or *Authored Summary*).
   - The SHA-256 content hash and cryptographic HMAC-SHA256 receipt signature.
   - The status of statutory compliance disclosures (FTC / ASCI).

### Step 4: Grant Operator Approval
- Click **"Approve & Release to SCRIPTED Queue"** inside the Evidence Inspector.
- The system validates the content contract, calculates the deterministic **package fingerprint**, seals it to prevent downstream tampering, and transitions status to `SCRIPTED`.

### Step 5: Render Artifacts via the Worker
- The worker daemon claims the `SCRIPTED` job from the queue.
- Windows SAPI synthesizes the narration audio into clean WAV audio.
- FFmpeg generates a vertical 1080x1920 MP4 montage with topic-grounded graphics, synchronized word-for-word glowing subtitles, and normalized audio levels (-19.5 dB mean volume).
- Artifacts are saved to `storage/processed/<jobId>_short.mp4` and `storage/processed/<jobId>_thumb.jpg`.
- The webhook validates artifact existence and transitions status to `READY`.

### Step 6: Stream & Verify Locally
- In the dashboard, click **"Preview"** on the `READY` job to watch the rendered video in the high-definition video player.
- All media streaming URLs use signed, time-limited HMAC tokens (`/api/media/<jobId>_short.mp4?token=...&expires=...`).
- When satisfied, download the MP4 for manual upload to YouTube Studio, or keep it stored locally.

---

## 4. Feature Capability & Degradation Matrix

SIMPLYYTR 2.0 is designed **local-first and open-source first**. You can run the complete pipeline without paid subscriptions:

| Feature / Subsystem | Without External Credentials (Zero Config) | With Configured External Credentials |
| :--- | :--- | :--- |
| **Topic Video Rendering** | ✅ **100% Functional** via local FFmpeg & SAPI TTS | ✅ Functional (Can also use cloud GPU workers) |
| **Subtitle Burn-in** | ✅ **100% Functional** (Synchronized word-for-word ASS) | ✅ Functional |
| **Voiceover Narration** | ✅ **100% Functional** (Windows SAPI offline) | ✅ Functional (edge-tts, Piper neural TTS) |
| **Dashboard UI & Playback** | ✅ **100% Functional** (`http://localhost:3000`) | ✅ Functional |
| **Evidence & Provenance Modal**| ✅ **100% Functional** (HMAC receipts & fingerprints) | ✅ Functional |
| **Affiliate Intelligence** | ✅ **100% Functional** (India `.in`, US `.com`, UK `.co.uk`) | ✅ Functional with custom tracking IDs |
| **Topic Script Generation** | ⚠️ **Degrades Gracefully** to topic-grounded demo | ✅ Live LLM generation via Groq or Gemini |
| **Visual B-Roll Footage** | ⚠️ **Degrades Gracefully** to procedural motion graphics | ✅ Live stock footage download via Pexels API |
| **Direct YouTube Publishing** | 🛑 **Safely Disabled** (`autoPublishOnline=false`) | ✅ 1-click or automated via YouTube Data API v3 |

---

## 5. External Credentials Configuration Guide

When you are ready to connect cloud accounts, configure them in your `.env` file. **Never commit `.env` to Git.**

```ini
# ──────────────────────────────────────────────────────────
# SIMPLYYTR 2.0 — External Provider Configuration
# ──────────────────────────────────────────────────────────

# 1. Pipeline Signing Secret (MANDATORY FOR LOCAL USE - PRE-CONFIGURED)
PIPELINE_SECRET="your-64-character-hex-pipeline-secret"

# 2. Free LLM API (Groq) — Enables live script generation
# Obtain free key at: https://console.groq.com/keys
GROQ_API_KEY="gsk_..."

# 3. Google Gemini API (Alternative LLM)
# Obtain free key at: https://aistudio.google.com/
GEMINI_API_KEY="AIzaSy..."

# 4. Free Stock Video (Pexels) — Enables live video background clips
# Obtain free key at: https://www.pexels.com/api/
PEXELS_API_KEY="your_pexels_api_key_here"

# 5. Amazon Associates Tracking IDs — Region-aware affiliate links
AMAZON_ASSOCIATE_TAG_IN="yourchannel-21"       # Amazon India (.in)
AMAZON_ASSOCIATE_TAG_US="yourchannel-20"       # Amazon US (.com)
AMAZON_ASSOCIATE_TAG_UK="yourchannel-21-uk"    # Amazon UK (.co.uk)

# 6. Google Cloud OAuth 2.0 (YouTube Data API v3) — Required for live upload
# Obtain at: https://console.cloud.google.com/apis/credentials
YOUTUBE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
YOUTUBE_CLIENT_SECRET="GOCSPX-your-secret"
YOUTUBE_REFRESH_TOKEN="1//04your-refresh-token"
```

### How to Obtain Google OAuth Credentials for YouTube Data API v3:
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **YouTube Data API v3**.
3. Go to **APIs & Services > OAuth consent screen**:
   - Set User Type to **External**.
   - Add scope: `https://www.googleapis.com/auth/youtube.upload`.
   - Add your Google account as a **Test User**.
4. Go to **Credentials > Create Credentials > OAuth client ID**:
   - Application type: **Web application** or **Desktop app**.
   - Copy the Client ID and Client Secret into `.env`.
5. Run the authentication flow once to obtain your refresh token, and save it to `YOUTUBE_REFRESH_TOKEN`.

---

## 6. Publishing Guardrails & Safe Operation

Autonomous publishing is **permanently disabled by default** in SIMPLYYTR 2.0:
1. **Database Default**: `SystemSettings.autoPublishOnline` defaults to `false`.
2. **Review Barrier**: All generated topics enter `NEEDS_REVIEW`. An operator must explicitly review claims and click **Approve** in the Evidence modal.
3. **Manual Upload Choice**: You can always download the rendered `.mp4` file directly from the dashboard and upload it manually via YouTube Studio.
4. **Publish Route Safeguard**: The publishing API endpoint rejects requests for jobs that are not in the authoritative `READY` state.

---

## 7. Testing & Verification Commands

To verify system integrity at any time, execute the following commands:

```powershell
# 1. Run all core test suites (217 checks):
npm test

# 2. Run preflight isolation test suite:
node tests/security/preflight_isolation.test.mjs

# 3. Verify Next.js frontend build (Turbopack):
npm run build

# 4. Verify backend TypeScript build:
npm run build --workspace=@youtubbot/backend

# 5. Verify zero secrets leaked:
node scripts/verify_no_secrets.js
```

---

## 8. Shutdown & Recovery Procedures

### Safe System Shutdown
To stop the platform cleanly:
1. In your dashboard terminal window, press `Ctrl + C` to stop the Next.js development server.
2. In your worker terminal window, press `Ctrl + C` to stop the media worker daemon.
3. Stop the PostgreSQL database:
   ```powershell
   npm run db:stop
   ```
4. Verify port closure:
   ```powershell
   npm run db:status
   ```
   *(Expected output: `[LocalDB] Status: STOPPED (Port 5432 closed)`)*

### Troubleshooting & Common Fixes

| Issue | Root Cause | Safe Resolution |
| :--- | :--- | :--- |
| `Port 5432 is already in use` | Previous Postgres instance was not cleanly stopped | Run `npm run db:stop` or run `node scripts/local_db.js status` to inspect PID. |
| `Worker: PIPELINE_SECRET is not configured` | Missing or empty secret in environment | Add `PIPELINE_SECRET="64-char-hex"` to `.env`. |
| `Job held in NEEDS_REVIEW` | Quality gate requires operator inspection | Open `http://localhost:3000`, open the **Evidence** modal, and click **Approve**. |
| `FFmpeg not found in PATH` | FFmpeg binary missing | Ensure `ffmpeg.exe` and `ffprobe.exe` are in your Windows PATH. |
| `Stale lease (RENDERING > 30m)` | Worker crashed during an earlier run | The worker route automatically recovers stale leases after 30 minutes, or click **Retry** in the dashboard. |

---

*SIMPLYYTR 2.0 is fully verified, operational, and ready for operator use.*
