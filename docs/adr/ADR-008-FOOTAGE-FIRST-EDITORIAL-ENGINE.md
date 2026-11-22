# ADR-008: Footage-First Story-Driven Video Production Engine & Extended Edit Decision Plan (EDP v2.1.0)
Status: ACCEPTED
Date: 2026-10-23
Deciders: Antigravity Architect, SIMPLYYTR Core Systems Team

## Context
SIMPLYYTR's initial pipeline generated vertical videos using procedural vector cards (sharp SVG-to-PNG plates) and synthetic audio drones. While structurally stable and fully grounded in factual claims, visual inspection revealed that videos were essentially animated slideshows. Viewers expect real footage, archival imagery, dynamic editing pacing, contextual sound design, and style diversity.

Furthermore, several modern open-source projects exist (OpenMontage, Montage AI, Auto-Editor, PySceneDetect, LTX-Video, HyperFrames), but possess varying licenses (AGPL-3.0 copyleft risk, unlicensed repositories), heavy GPU/model overheads, or poor Windows native support.

## Decisions

### 1. Independent Clean-Room Architecture
- Reject AGPL-3.0 code incorporation (OpenMontage) and unlicensed code (Montage AI, OpenVideo Studio).
- Implement an independent, decoupled production orchestrator natively in TypeScript/Node.js, keeping the existing PostgreSQL worker leasing, idempotency, and fail-closed security guarantees intact.

### 2. Specialist Modular Architecture
Split creative generation into specialized modules:
- **Creative Director (`creativeDirector.ts`)**: Narrative arc, emotional tone, style selection.
- **Asset Curator (`assetLibrary.ts`)**: Lawful asset discovery (NASA, Wikimedia, Internet Archive, local cache), metadata extraction, provenance tracking, and deduplication.
- **Editor & Story Timeline (`editorialEngine.ts`)**: Constructs EDP v2.1.0, calculates speech tempo, selects in/out points, sets motivated transitions, and balances visual density.
- **Motion Designer (`motionToolkit.ts`)**: Procedural vector diagrams and schematics used selectively when footage alone is insufficient.
- **Sound Designer (`soundDesign.ts`)**: Multichannel audio mixing with sidechain voiceover ducking, ambient bed, and semantic sound effect cues.
- **Quality Gates (`qualityGates.ts`)**: Anti-slideshow verification, rights validation, audio loudness compliance (EBU R128).

### 3. Extended Edit Decision Plan (EDP v2.1.0)
Upgrade EDP to support:
- `footageTrack`: In/out cut points, playback speed, aspect ratio reframing (16:9 to 9:16 safe crop), and source attribution.
- `compositionType`: Distinguishing motion footage (`REAL_FOOTAGE`, `ARCHIVAL_RECORD`), hybrid overlays, and technical diagrams (`VECTOR_DIAGRAM`).
- `pacingRationale`: Explicit editorial motivation for every cut, transition, and movement.
- `antiSlideshowScore`: Measured motion entropy, shot duration bounds, and visual variety index.

### 4. Zero-Dependency Core Engine with Optional Specialist Adapters
- **FFmpeg (`local_tools/bin/ffmpeg.exe`)**: Core compositing, native scene change detection (`select='gt(scene,0.3)'`), loudness normalization, sidechain ducking, and subtitle burning.
- Optional adapters for external tools (Auto-Editor, PySceneDetect, Whisper, ComfyUI, LTX-Video) wrapped with strict timeouts, input/output contracts, and guaranteed offline fallbacks.

## Consequences

### Positive
- Videos contain authentic motion footage, historical photography, and varied visual compositions.
- Elimination of repetitive, unmotivated camera zoom on static text boxes.
- 100% lawful media provenance with zero copyright infringement risk.
- Zero extra mandatory runtime dependencies or paid API requirements.
- Full compatibility with the existing worker, Next.js web application, and PostgreSQL database.

### Negative / Trade-offs
- Video rendering involves additional video-to-video transcode, smart cropping, and multi-track audio mixing, requiring modest additional CPU time (~10–20 seconds per 60s video).
- Local asset cache requires ~50–100MB of verified public domain test footage.
