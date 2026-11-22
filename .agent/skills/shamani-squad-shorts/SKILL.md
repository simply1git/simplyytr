---
name: shamani-squad-shorts
description: Produce 10/10 viral podcast shorts replicating the exact forensic visual, typographical, audio, and loop-retention formula of @shamani_squad (Raj Shamani / Shamani Squad shorts). Use when extracting viral moments from podcasts or interviews and rendering high-retention 9:16 vertical videos with floating neon banners, ambient blurred pillarbox backgrounds, glowing amber kinetic subtitles, ducked phonk music, and loop-optimized hard cuts.
metadata:
  version: "1.0.0"
---

# Shamani Squad Viral Shorts Production Skill

This skill codifies the exact production formula used by **[@shamani_squad](https://www.youtube.com/@shamani_squad/shorts)**, the premier Indian podcast shorts channel curating viral moments from *Figuring Out with Raj Shamani* and top entrepreneurship podcasts.

Use this skill whenever you need to:
1. Extract viral high-retention short clips from full-length podcast or interview footage.
2. Render vertical 1080×1920 (9:16) videos matching the signature Shamani Squad studio aesthetic.
3. Generate floating dual-tone neon hook banners, glowing amber kinetic typography, and ambient blurred background pillarboxes.
4. Export native editable project drafts directly into **CapCut Desktop**.

---

## 1. The 6 Signature Pillars of Shamani Squad

Through forensic frame-by-frame DevTools audit of the channel, 6 core rules define the Shamani Squad signature style:

### Pillar 1: Multi-Layer Ambient Canvas
- **Canvas Resolution:** 1080×1920 (9:16 vertical).
- **Foreground Video:** Centered 1080×1400 crop (`Y: 260 to 1660`) preserving speaker body language, hand gestures, microphones, and studio desk context.
- **Background Ambient Padding:** Duplicate instance of main video scaled to cover the canvas, heavily blurred (`Gaussian blur sigma=35`), desaturated, and darkened (`brightness=-0.25`).
- **Color Grade:** Warm amber shift (+10 to +15 warm), high contrast (+15%), deep crushed blacks, and high-pass edge sharpening (`unsharp`).

### Pillar 2: Floating Neon Hook Banner
- **Placement:** Pinned at Y ≈ 180px (top padding zone), floating without a solid box.
- **Dual-Color Split:**
  - **First / Key Action Word:** Vivid Neon Green (`#00FF66`) with outer radial glow (`\blur16\c&H0066FF00&`).
  - **Remaining Phrasing:** Clean Crisp White (`#FFFFFF`) with dark shadow.
- **Emoji Hook:** Outline topic emojis (`🔥`, `🧠`, `⚡`, `💀`, `💯`) rendered natively via DirectWrite (`Segoe UI Emoji`).
- **Duration:** Permanently pinned across 100% of video duration.

### Pillar 3: Golden Watermark & Branding
- **Location:** Top-Right quadrant (`x: 880, y: 160`).
- **Two-Line Stack:**
  - Line 1: `SHAMANI` in bold sans-serif, uppercase, Golden Yellow (`#FFCA28`).
  - Line 2: `SQUAD` in expressive brush script / cursive italic, Amber (`#FFA726`).

### Pillar 4: Two-Tier Kinetic Subtitles
- **Placement:** Upper mid-section (Y ≈ 1150px), strictly above the desk microphone and clear of YouTube Shorts right-side buttons.
- **Chunking:** 2 to 4 words per chunk; maximum 2 lines.
- **Typography:**
  - Base & Accent: Golden Yellow / Amber (`#FFB800`) with outer Gaussian aura (`#FF8000`, `\blur12`).
  - Climax / Punchline Words: Neon Ice Blue (`#00D2FF`) with outer glow (`#0099FF`).
- **Pacing:** Word-by-word karaoke synchronization aligned acoustically to speech transients.

### Pillar 5: Layered Sound Design
- **Dialogue Chain:** Broadcast vocal EQ, 80Hz high-pass filter, 3kHz clarity boost, normalized to -14 LUFS, hard brickwall limiter at -1.0 dBTP.
- **Background Music (BGM):** Driving motivational phonk or dark atmospheric beat ducked to -22 dB under dialogue.
- **Foley:** Clean sub-bass drop / bass hit on 0.0s to 1.5s opening hook.

### Pillar 6: Algorithmic Loop Engineering (Outro)
- **Zero End Screens / No CTA Bumpers:** Never add subscribe cards, outro animations, or verbal pitches.
- **Hard Climax Cutoff:** Video cuts instantaneously at spoken voice endpoint + 0.12s.
- **Algorithm Lift:** Instant seamless replay drives YouTube Shorts retention > 100%, triggering explosive algorithmic recommendation.

---

## 2. Platform Tools & CLI Usage

### A. Direct Python Rendering
Render a Shamani Squad short directly from any podcast video:

```powershell
& "scratch\test_kokoro_venv\Scripts\python.exe" .agent\skills\shamani-squad-shorts\scripts\shamani_renderer.py `
  --video "C:\path\to\podcast.mp4" `
  --start 298.5 `
  --end 335.0 `
  --banner "BE DELUSIONAL AND GO ALL IN 🔥" `
  --title "Why You Must Be Delusional to Succeed" `
  --output "d:\Projects\SIMPLYYTR\scratch\shorts-pipeline\output_10outof10\short_delusion.mp4"
```

### B. SIMPLYYTR Shorts Platform CLI
The skill is integrated into the core SIMPLYYTR platform CLI:

```powershell
# Check status of platform and CapCut drafts
& "scratch\test_kokoro_venv\Scripts\python.exe" scratch\shorts-pipeline\scripts\simplyytr_shorts_cli.py status

# List curated viral candidates
& "scratch\test_kokoro_venv\Scripts\python.exe" scratch\shorts-pipeline\scripts\simplyytr_shorts_cli.py list

# Export all clips as native CapCut Desktop drafts
& "scratch\test_kokoro_venv\Scripts\python.exe" scratch\shorts-pipeline\scripts\simplyytr_shorts_cli.py export-capcut --all

# Launch CapCut Desktop with projects loaded
& "scratch\test_kokoro_venv\Scripts\python.exe" scratch\shorts-pipeline\scripts\simplyytr_shorts_cli.py open-capcut
```

---

## 3. Reference Files & Schemas

- Forensic Style Guide: [`references/style_guide.md`](./references/style_guide.md)
- Core FFmpeg / ASS Production Renderer: [`scripts/shamani_renderer.py`](./scripts/shamani_renderer.py)
- CapCut Desktop Project Bridge: [`scripts/capcut_bridge.py`](../../../scratch/shorts-pipeline/scripts/capcut_bridge.py)
