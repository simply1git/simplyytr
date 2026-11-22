# ADR-009: Autonomous Editorial Director, Semantic Asset Acquisition & Content Intelligence Engine

**Status:** ACCEPTED  
**Date:** 2026-11-04  
**Deciders:** Antigravity Architect, SIMPLYYTR Core Systems Team  

---

## 1. Context

In SIMPLYYTR 2.0 (ADR-008), we established the Creative Production Core (`storyRenderer.ts`, `localTts.ts`, `acousticAligner.ts`, `soundDesign.ts`, and `operatorDashboard`). This proved capable of producing broadcast-grade 1080×1920 short videos with 94.78% acoustically synchronized subtitles and multi-track audio mixing.

However, forensic audits demonstrated that the editorial intelligence driving the production core was brittle and largely static:
1. **Topic Overfitting:** The rich 8-shot documentary narrative was hardcoded in `editDecisionPlan.ts` specifically for the topic *"Why Airplane Windows Have Rounded Corners"*. Any other topic collapsed to a generic 3-shot fallback card (`01 // RESEARCH OVERVIEW`).
2. **Missing Semantic Asset Acquisition:** Visual assets were mapped to a fixed local folder with no dynamic retrieval for new topics.
3. **No Semantic Quality Auditing:** Quality gates only validated structural metrics (shot length, volume levels, manifest flags). They could not evaluate whether a visual asset actually substantiated the spoken narration beat.
4. **Disconnected Feedback Loop:** Trend discovery, scriptwriting, and performance analytics operated as disconnected silos.

To realize the complete vision of an **Autonomous YouTube Content Operation (Goal B)** while strictly preserving operational safety (`autoPublishOnline: false`, $0.00 spend, zero copyright infringement), we must upgrade the upstream intelligence layers.

---

## 2. Decisions

### 2.1 Autonomous 8-Beat Documentary Story Engine (`editorialDirector.ts`)
We establish a canonical 8-beat narrative structure for all documentary, explainer, and investigative topics:
1. `CINEMATIC_HOOK` (0–8s): Pattern interrupt, anomaly, or counter-intuitive paradox.
2. `PHYSICAL_CONTEXT` (8–16s): Baseline environment, operational physics, or initial state.
3. `INCIDENT_ANOMALY` (16–24s): Historical incident, crisis, or system failure point.
4. `MECHANISM_BREAKDOWN` (24–32s): Core engineering, scientific, or systemic stress multiplication.
5. `FORENSIC_EVIDENCE` (32–40s): Recovered evidence, primary historical records, or empirical data.
6. `PROVING_EXPERIMENT` (40–48s): Lab test, water tank proof, simulation, or decisive calculation.
7. `ENGINEERING_STANDARD` (48–56s): Modern airworthiness, redundant safeguards, or fail-safe protocols.
8. `TAKEAWAY_LOOP_CTA` (56–65s): Real-world observable takeaway and continuous loop call-to-action.

### 2.2 Dual-Mode Intelligence Generation (Free/Offline Default + Optional LLM)
- **Offline Domain Synthesizer (Default / $0 Spend):** Uses structured narrative templates, deterministic domain heuristics, and engineering/historical taxonomies to generate rich, factual 8-beat scripts for any topic without network dependencies or API keys.
- **Optional LLM Adapter:** When `GROQ_API_KEY` or `GEMINI_API_KEY` is present, leverages free-tier inference (`llama-3.3-70b-versatile` or `gemini-2.5-flash`) to generate bespoke narrative scripts conforming to the exact 8-beat schema.

### 2.3 Semantic Asset Acquisition & Procedural Fallback (`assetAcquisition.ts`)
- Every beat specifies its semantic requirement (`REAL_FOOTAGE`, `HISTORICAL_ARCHIVE`, or `VECTOR_DIAGRAM`).
- The resolver inspects local verified assets first.
- If no authentic footage/photo is pre-cached, it queries open public domain repositories (Wikimedia Commons API, NASA Open API) with strict copyright filtering (`public_domain`, `CC0`, `CC-BY`, `CC-BY-SA`).
- If offline or unretrieved, it automatically generates a first-party, high-contrast procedural SVG technical illustration via `motionToolkit.ts` / `sceneIllustrations.ts`.
- **Zero synthetic SMPTE color bars:** Unverified test pattern clips are strictly forbidden.

### 2.4 Semantic Pre-Render Quality Gate (`semanticQualityGate.ts`)
Before FFmpeg executes:
- Enforces narrative arc continuity (all 8 beats present and ordered).
- Validates anti-slideshow rules (maximum shot duration $\le 12$s, visual variety $\ge 4$ distinct compositions).
- Verifies that every shot has non-empty spoken narration and grounded visual claims.
- Validates cryptographic asset hashes and ensures mandatory attribution blocks are prepared.

### 2.5 Dynamic Pipeline Decoupling
- Remove hardcoded topic checks (`/airplane.*window/i`) from `editDecisionPlan.ts`.
- Any topic supplied via UI, API, or automated trend signal dynamically receives a rich 8-beat Edit Decision Plan.

---

## 3. Consequences

### Positive
- **Universal Topic Support:** Any topic (aviation, maritime, computing, ancient history, physics) automatically generates a compelling 8-beat visual documentary instead of a 3-card generic fallback.
- **Zero Additional Cost:** Runs 100% offline with zero cloud fees ($0.00 spent).
- **Compliance & Rights Safety:** Only verified public domain or first-party procedural assets are rendered.
- **Architectural Cohesion:** Unifies research, script, visual planning, and rendering into a single continuous pipeline.

### Trade-offs / Operational Boundaries
- Dynamic procedural SVG generation for new topics requires vector rendering via Sharp (~0.5s per plate).
- `autoPublishOnline: false` remains strictly enforced: all autonomously generated videos require human operator approval prior to public YouTube broadcast.

