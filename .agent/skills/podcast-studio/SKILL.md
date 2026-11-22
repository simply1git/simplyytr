---
name: podcast-studio
description: End-to-end studio podcast production suite for 10/10 viral short clips (9:16 vertical) and broadcast-grade long clips (16:9 horizontal) derived from top YouTube podcast networks (Raj Shamani, Figuring Out, BeerBiceps, Diary of a CEO). Use when curating, extracting, formatting, motion-designing, and distributing podcast content across YouTube, Shorts, Reels, and CapCut Desktop.
metadata:
  version: "1.0.0"
---

# Podcast Studio Dual-Stream Production Suite

This skill codifies the complete high-growth podcast publishing system used by top-tier interview shows (**Raj Shamani / Figuring Out**, **The Ranveer Show**, **The Diary Of A CEO**, and **Joe Rogan Experience**).

Rather than producing disconnected videos, this skill operates on the **1-5-15 Multiplier Funnel**:
1. **1 Full Episode** (2–3 hours master interview)
2. **4–5 Horizontal Masterclass Long Clips** (16:9, 4–15 minutes, topic-focused, search-optimized)
3. **10–15 Vertical Viral Shorts** (9:16, 15–60 seconds, algorithmic dopamine hooks, infinite loop cut)

---

## 1. Stream 1: Horizontal Broadcast Long Clips (16:9 Format)

### Core Creative Standard: Zero Screen Clutter
Amateur clip channels ruin long videos by plastering permanent subtitle bars or large static text blocks over the footage. Viewers abandon clips when text obstructs the speaker's face. 

Professional broadcast clips maintain a **clean, cinematic viewing experience**, utilizing text strictly for timed contextual identification and dynamic semantic emphasis:

### 1. The Cold Open Teaser Badge (0:00 – 0:17)
- **Position:** Top-Left corner (`pos(100, 70)`).
- **Design:** Broadcast recording pill with a subtle red dot (`● PREVIEW HIGHLIGHT`) in Montserrat Black 18pt.
- **Timing:** Fades in over 250ms at start, fades out 250ms before the title card / riser transition.

### 2. The 7-Second Lower-Third Window (0:20 – 0:27)
- **Position:** Bottom-Left corner (`pos(120, 950)`).
- **Timing:** Displays 3 seconds after the main discussion begins; stays active for exactly 7 seconds; fades out permanently.
- **Design:** Frosted dark pill with a signature brand vertical indicator bar (`❙` in `#26A7FF` or `#FFA726`).
  - **Line 1 (Name):** Bold Uppercase Sans-Serif (Montserrat Black 26pt, `#FFFFFF`).
  - **Line 2 (Role & Topic):** Clean Italic Sans-Serif (Arial 17pt, `#26A7FF`).

### 3. Dynamic Semantic Impact Callouts
- **Purpose:** Visually punctuate shocking data points, athlete milestones, or core rules without cluttering continuous speech.
- **Duration:** Exactly 2.2 seconds per callout.
- **Position:** Lower-Center (`pos(960, 940)`), safely below speaker chest and microphones.
- **Styling:** Montserrat Black 34pt, white font with ice blue lightning accent (`⚡ 93 CONSECUTIVE LOOPS`).

### 4. Discreet Top-Right Watermark
- **Position:** Top-Right (`pos(1860, 45)`).
- **Styling:** Arial 15pt, 50% opacity silver (`&H70A0A0A0&`), zero borders.

### 5. Sleek Outro Badge (Final 7 Seconds)
- **Position:** Bottom-Right corner (`pos(1820, 1020)`).
- **Design:** Frosted glass call-to-action (`WATCH FULL PODCAST ↗` with subtitle `Link in description & pinned comment`).

---

## 2. Stream 2: Vertical Viral Shorts (9:16 Format)

Codified from forensic analysis of **@shamani_squad**:

1. **Multi-Layer Ambient Canvas:** 1080×1400 centered speaker crop layered over a 320% scaled, Gaussian-blurred (`sigma=35`), desaturated background pillarbox.
2. **Floating Neon Hook Banner:** Pinned at Y ≈ 180px with dual-color split (first word neon green `#00FF66` with `\blur16` aura; rest in clean white `#FFFFFF`) plus emoji.
3. **Kinetic Amber Subtitles:** Pinned at Y ≈ 1240px in Montserrat Black 80pt rich amber (`#FFB800`) with outer aura (`#FF8000`).
4. **Ducked Phonk Sound Design:** Driving motivational beat ducked to -22 dB under broadcast-equalized vocals.
5. **Algorithmic Loop Cut:** Instant hard cut within 0.12s of the final spoken word for infinite loop replay (retention > 100%).

---

## 3. Desktop Suite & CapCut Integration

Both horizontal long clips and vertical shorts integrate natively into **CapCut Desktop**:
- **Draft Location:** `C:\Users\Hp\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft\`
- **Project Structure:** Automated creation of `SIMPLYYTR_LONG_*` (1920×1080) and `SIMPLYYTR_short_*` (1080×1920) projects with audio tracks, cut points, and caption layers pre-populated.

---

## 4. CLI & Production Commands

### Render Horizontal Broadcast Long Clip:
```powershell
& "scratch\test_kokoro_venv\Scripts\python.exe" .agent\skills\podcast-studio\scripts\long_clip_renderer.py `
  --clip-id "clip_01_the_623km_journey"
```

### Render Vertical Viral Short:
```powershell
& "scratch\test_kokoro_venv\Scripts\python.exe" .agent\skills\shamani-squad-shorts\scripts\shamani_renderer.py `
  --video "C:\path\to\podcast.mp4" `
  --start 298.5 --end 335.0 `
  --banner "BE DELUSIONAL AND GO ALL IN 🔥" `
  --title "Why You Must Be Delusional to Succeed" `
  --output "scratch\shorts-pipeline\output_10outof10\short_001.mp4"
```

### Launch CapCut Desktop Suite:
```powershell
& "scratch\test_kokoro_venv\Scripts\python.exe" scratch\shorts-pipeline\scripts\simplyytr_shorts_cli.py open-capcut
```

---

## 5. Reference Files
- Motion Graphics Style Guide: [`references/motion_graphics_style_guide.md`](./references/motion_graphics_style_guide.md)
- Broadcast Long Clip Renderer: [`scripts/long_clip_renderer.py`](./scripts/long_clip_renderer.py)
