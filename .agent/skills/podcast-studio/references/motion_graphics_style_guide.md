# Podcast Studio Motion Graphics & Typography Style Guide

Derived from professional broadcast editing standards on Raj Shamani Clips, The Ranveer Show Clips, JRE Clips, and Modern Wisdom.

---

## 1. Stream 1: Horizontal Broadcast Long Clips (16:9 Format)

### Core Creative Principle: Zero Screen Clutter
Traditional amateur editing places permanent, raw subtitle bars or giant yellow text blocks across the video. Professional studio clips keep the screen **100% clean and unobstructed**, using text only for timed contextual identification and dynamic semantic impact.

### Rule 1: The Cold Open Teaser Badge (0:00 to 0:17)
- **Position:** Top-Left corner (`x: 100, y: 70`).
- **Design:** Sleek broadcast recording badge with a vibrant red recording dot.
- **ASS Syntax:**
  ```ass
  Style: TeaserBadge,Montserrat Black,18,&H00E0E0E0&,&H00E0E0E0&,&H00000000&,&H90000000&,-1,0,0,0,100,100,2,0,1,1,1,7,80,80,60,1
  Dialogue: 1,0:00:00.00,{co_end},TeaserBadge,,0,0,0,,{\fad(250,250)\pos(100,70)}{\c&H003333FF&}● {\c&H00E0E0E0&}PREVIEW HIGHLIGHT\N
  ```
- **Motion:** 250ms smooth fade-in, 250ms smooth fade-out.

### Rule 2: The 7-Second Lower-Third Window (0:20 to 0:27)
- **Timing:** Appears 3 seconds after the main discussion begins; stays for exactly 7 seconds; fades out permanently.
- **Design:** Frosted dark pill with a brand vertical indicator stripe (`❙` in `#FFA726` or `#00F0FF`).
- **Hierarchy:**
  - **Line 1 (Name):** Bold Uppercase Sans-Serif (Montserrat Black, 26pt, `#FFFFFF`, tracking 2).
  - **Line 2 (Role/Topic):** Medium Sans-Serif (Arial, 17pt, `#26A7FF`, italic).
- **ASS Syntax:**
  ```ass
  Style: LowerThirdBar,Montserrat Black,26,&H00FFFFFF&,&H00FFFFFF&,&H00000000&,&HA0000000&,-1,0,0,0,100,100,2,0,1,2,2,1,100,100,70,1
  Style: LowerThirdSub,Arial,17,&H0026A7FF&,&H0026A7FF&,&H00000000&,&H00000000&,0,1,0,0,100,100,1,0,1,1,1,1,100,100,42,1
  Dialogue: 1,{lt_start},{lt_end},LowerThirdBar,,0,0,0,,{\fad(400,400)\pos(120,950)}{\c&H0026A7FF&}❙ {\c&H00FFFFFF&}{GUEST_NAME}\N
  Dialogue: 1,{lt_start},{lt_end},LowerThirdSub,,0,0,0,,{\fad(400,400)\pos(138,985)}{GUEST_ROLE} • {TOPIC}\N
  ```

### Rule 3: Dynamic Semantic Impact Callouts
- **Purpose:** Highlights staggering metrics, rules, or shock revelations without covering the speaker's face.
- **Duration:** 2.2 seconds maximum per callout.
- **Position:** Lower-center (`pos(960, 940)`), safely below the speaker's chest.
- **ASS Syntax:**
  ```ass
  Style: ImpactCallout,Montserrat Black,34,&H00FFFFFF&,&H00FFFFFF&,&H00000000&,&H80000000&,-1,0,0,0,100,100,2,0,1,2,2,2,60,60,110,1
  Dialogue: 1,{cs},{ce},ImpactCallout,,0,0,0,,{\fad(180,180)\an2\pos(960,940)}{\c&H0026A7FF&}⚡ {\c&H00FFFFFF&}{PUNCHLINE_TEXT}\N
  ```

### Rule 4: Non-Intrusive Watermark
- **Position:** Top-Right (`pos(1860, 45)`).
- **Styling:** Arial 15pt, 50% opacity (`&H70A0A0A0&`), zero black border.
- **ASS Syntax:**
  ```ass
  Style: Watermark,Arial,15,&H70A0A0A0&,&H70A0A0A0&,&H00000000&,&H00000000&,0,0,0,0,100,100,2,0,1,0,0,9,60,60,40,1
  Dialogue: 2,0:00:00.00,{total_end},Watermark,,0,0,0,,{\an9\pos(1860,45)}FIGURING OUT // CLIPS\N
  ```

### Rule 5: Sleek Outro Badge (Final 7 Seconds)
- **Position:** Bottom-Right corner (`pos(1820, 1020)`).
- **Design:** Minimalist frosted glass badge prompting the viewer to the full episode.
- **ASS Syntax:**
  ```ass
  Style: OutroBadge,Montserrat Black,22,&H00FFFFFF&,&H00FFFFFF&,&H00000000&,&HA0000000&,-1,0,0,0,100,100,2,0,1,2,2,3,100,100,50,1
  Dialogue: 1,{cta_start},{cta_end},OutroBadge,,0,0,0,,{\fad(400,400)\an3\pos(1820,1020)}{\c&H00FFFFFF&}WATCH FULL PODCAST {\c&H0000F0FF&}↗\N{\fnArial\fs15\c&H00A0A0A0&}Link in description & pinned comment\N
  ```

---

## 2. Stream 2: Vertical Viral Shorts (9:16 Format)

### Pillar 1: Multi-Layer Ambient Canvas
- **Main Video:** Centered 1080×1400 crop (`Y: 260 to 1660`) preserving speaker gestures and table context.
- **Backdrop:** 320% scaled duplicate video, Gaussian blurred (`sigma=35`), desaturated and darkened (`brightness=-0.32`).

### Pillar 2: Floating Neon Hook Banner
- **Vertical Position:** Y ≈ 180px (no solid bounding box).
- **Dual-Color Split:** Word 1 in vivid neon green (`#00FF66`, ASS `&H0066FF00&`) with radial neon aura (`\blur16`), remaining phrasing in crisp white (`#FFFFFF`) with topic emoji (`🔥`, `🧠`, `⚡`).

### Pillar 3: Kinetic Amber Subtitles
- **Position:** Y ≈ 1240px (safe chest level, strictly above microphones).
- **Typography:** Montserrat Black 80pt in rich golden yellow (`#FFB800`) with outer Gaussian aura (`#FF8000`). Context words above in italic silver.

### Pillar 4: Algorithmic Loop Engineering
- **Rule:** Hard cut within 0.12s of the final spoken word for infinite loop replay (retention > 100%).
