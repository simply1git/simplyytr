# Shamani Squad Forensic Style Guide & Blueprint

Derived from the visual, audio, and editorial forensic audit of [@shamani_squad](https://www.youtube.com/@shamani_squad/shorts).

## 1. Visual Composition & Geometry
- **Canvas Resolution:** 1080 × 1920 px (9:16 vertical ratio), 30 fps or 60 fps.
- **Video Layering:**
  - **Background Track:** Native 16:9 podcast video scaled to cover 1080×1920 (`scale=3413:1920,crop=1080:1920`), blurred (`gblur=sigma=35:steps=3` or `boxblur=50:50`), desaturated and darkened (`eq=brightness=-0.25:saturation=0.75`).
  - **Foreground Track:** Native 16:9 podcast video cropped to 1080×1400 (aspect ratio ≈ 0.77), centered vertically (Y: 260 to 1660), preserving the desk, microphones, and speaker hand gestures.
  - **Color Grading:** Warm amber grade (`colorbalance=rs=0.08:gs=0.02:bs=-0.08`), contrast boosted (`eq=contrast=1.18:saturation=1.12`), unsharp mask clarity pop (`unsharp=lx=5:ly=5:la=1.1:cx=3:cy=3:ca=0.8`).

## 2. Floating Neon Hook Banner
- **Vertical Position:** Y ≈ 180px to 220px (6% to 11% from canvas top).
- **Bounding Box:** Zero solid pill or box; text floats cleanly over the dark blurred ambient top padding.
- **Format:** All uppercase, ultra-bold condensed sans-serif (e.g. Montserrat Black, Arial Black, Impact).
- **Dual-Color Split:**
  - **Primary Keyword (First Word / Action Word):** Vivid Neon Green (`#00FF66`, ASS `&H0066FF00&`) with layered radial neon drop-aura (`\blur16\c&H0066FF00&`).
  - **Secondary Phrasing:** Clean Crisp White (`#FFFFFF`, ASS `&H00FFFFFF&`) with dark drop shadow (`\shad2\4c&H00000000&`).
- **Emoji Accent:** Outline topic emoji (`🔥`, `🤯`, `⚡`, `💀`, `🧠`) rendered via DirectWrite (`Segoe UI Emoji`).
- **Persistence:** Pinned for 100% of video duration to anchor context for viewers scrolling in mid-stream.

## 3. Watermark & Branding
- **Location:** Top-Right quadrant of the canvas (`x: 880 to 920, y: 160 to 200`).
- **Two-Line Stacked Structure:**
  - **Line 1:** `SHAMANI` (Sans-serif bold, uppercase, tracked, Golden Yellow `#FFCA28` / ASS `&H0028CAFF&`).
  - **Line 2:** `SQUAD` (Brush Script / Cursive script, italicized, Amber `#FFA726` / ASS `&H0026A7FF&`).
- **Persistence:** Present across all frames.

## 4. Kinetic Subtitles & Typography
- **Position:** Safe lower-chest / upper mid-section (Y ≈ 1150px to 1250px), strictly above desk microphones and avoiding YouTube Shorts right-side and bottom UI elements.
- **Chunking:** Rapid 2 to 4 words per display chunk; maximum 2 lines.
- **Color Palette:**
  - **Primary Base & Glowing Color:** Rich Golden Yellow / Amber (`#FFB800` / ASS `&H0000B8FF&`) with outer Gaussian aura/glow (`#FF8000` / ASS `\blur12\c&H000080FF&`).
  - **Climax / Punchline Accent:** Neon Ice Cyan (`#00D2FF` / ASS `&H00FFD200&`) with outer glow (`#0099FF` / ASS `\blur12\c&H00FF9900&`).
  - **Minor Syllables:** Crisp White (`#FFFFFF` / ASS `&H00FFFFFF&`).
- **Pacing:** Word-by-word karaoke synchronization aligned acoustically to speech transients.

## 5. Audio Architecture
- **Dialogue Track:** Broadcast vocal compression, 80Hz high-pass filter, 3kHz clarity boost, normalized to -14 LUFS, hard brickwall limiter at -1.0 dBTP.
- **Background Music (BGM):** Motivational phonk or dark atmospheric synth pad looped seamlessly, ducked to -22 dB to -24 dB under active speech.
- **SFX / Foley:** Deep sub-bass drop / bass hit on 0.0s to 1.5s hook opening.

## 6. Algorithmic Loop Engineering (Outro)
- **Zero End Screens / No CTA Bumpers:** There is NO 2-3 second subscribe animation, NO channel logo sting, and NO audible subscribe pitch.
- **Hard Climax Cutoff:** Video cuts instantaneously at spoken voice endpoint + 0.12s.
- **Algorithmic Lift:** Immediate seamless replay drives YouTube Shorts retention > 100%, signaling high engagement to the recommendation engine.
