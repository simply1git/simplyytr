# SIMPLYYTR 2.0 — Official Gemini API CLI Evaluation & Integration Report

---

## 1. Executive Summary

This report documents the evaluation, cryptographic verification, and optional architectural integration of the official **Gemini API CLI** (`google-gemini/gemini-api-cli`, Apache-2.0) into the SIMPLYYTR 2.0 video production engine.

The Gemini API CLI provides shell-accessible models and managed agents directly via command line. In SIMPLYYTR 2.0, it has been integrated as an **optional, cost-controlled, and audited creative tool adapter**, ensuring that the engine remains 100% functional offline while unlocking neural speech, concept illustrations, and multimodal storyboard evaluations when an operator chooses to supply a `GEMINI_API_KEY`.

### Key Verification Metrics
| Verification Dimension | Status | Evidence / Artifact |
| :--- | :--- | :--- |
| **Official Repository** | Audited | `https://github.com/google-gemini/gemini-api-cli` |
| **Official Documentation** | Audited | `https://aistudio.google.com/learn/introducing-the-gemini-api-cli` |
| **Stable Release Tag** | `v0.4.3` (Oct 19, 2026) | Verified via GitHub API release manifest |
| **Cryptographic Integrity** | **PASS (100% byte match)** | SHA-256 `4DA567622F6117A75BF3C10DAFC33180F336B73D10B589FB17C3E536C4D1637E` |
| **Software License** | **Apache-2.0** | Compatible with SIMPLYYTR; zero copyleft risk |
| **Zero Remote Script Pipe** | **VERIFIED** | Downloaded official `.zip`, verified SHA-256, unpacked locally to `local_tools/bin/gemini-api.exe` |
| **Safe Dry-Run Testing** | **PASS** | Validated `--dry-run` across image, speech, analyze, and transcribe |
| **Zero Secret Leakage** | **VERIFIED** | Credentials read from environment; never printed to logs or committed |
| **Non-Deception Rules** | **ENFORCED** | AI imagery tagged `assetType: 'AI_SYNTHETIC'`, `isHistoricalEvidence: false` |
| **Safety & Port Isolation** | **PASS** | Experimind ERP port 55432 untouched (PID 17828); DB stopped cleanly |
| **Automated Tests** | **PASS (12/12 new, 95/95 suite)**| `tests/pipeline/gemini_cli_adapter.test.mjs` |

---

## 2. Phase 1 — Verification & Platform Audit

### Official Repository & Release Artifact
- **Repository**: `google-gemini/gemini-api-cli`
- **Release**: `v0.4.3` (Release ID `417635570`, Published `2026-10-19T18:57:43Z`)
- **Binary Architecture**: Single, self-contained Go executable (`gemini-api.exe`, 17,387,520 bytes uncompressed).
- **Windows Package**: `gemini-api_Windows_x86_64.zip` (6,247,988 bytes).
- **Verification Hash**:
  - Official Release `checksums.txt`: `4da567622f6117a75bf3c10dafc33180f336b73d10b589fb17c3e536c4d1637e`
  - Computed Local SHA-256: `4DA567622F6117A75BF3C10DAFC33180F336B73D10B589FB17C3E536C4D1637E`
  - Match: **Exact 100% byte match**.

### Platform Compatibility & Requirements
- **Windows Native**: Fully compatible with Windows 10/11 x86_64 and ARM64. Does not require WSL, Python runtimes, or external C++ redistributables.
- **Cross-Platform**: Prebuilt binaries also available for Linux (`x86_64`, `arm64`) and macOS (`arm64`, `x86_64`).
- **Dependencies**: Zero external runtime dependencies. Runs standalone.

### Pricing, Quotas & Terms of Service
1. **Free Tier (Google AI Studio Key)**:
   - **Cost**: $0.00.
   - **Limits**: Enforced by rate limits (RPM / RPD) per model.
   - **Privacy Notice**: Prompts and generated outputs on the free tier may be logged and reviewed by human reviewers to train Google models.
   - **Recommendation**: Suitable for development, testing, and public content generation.
2. **Paid Tier (Google Cloud Project Billing)**:
   - **Cost**: Pay-per-token / pay-per-request.
   - **Privacy Guarantee**: Customer data is enterprise-confidential and not used for Google model training.
   - **Commercial Rights**: Commercial reuse granted under Google Terms of Service.
3. **Model Footprint**:
   - `gemini-3.8-flash`: Default text, multimodal analysis, and transcription model. Low latency, high throughput.
   - `gemini-nano-banana-2.1`: Default image generation model.
   - `gemini-3.8-flash-tts`: Studio-grade multi-speaker text-to-speech.
   - `lyria-3.5`: Music generation model.
   - `gemini-omni-1.1-flash`: Multimodal video generation model.

---

## 3. Phase 2 — Capability Testing & Dry-Run Validation

The CLI provides self-describing discovery and safe preview capabilities:
- `gemini-api --help`: Hierarchical command overview.
- `gemini-api models`: Offline curated model catalog.
- `gemini-api <cmd> --schema`: JSON Schema (draft 2020-12) of the request body.
- `gemini-api <cmd> --dry-run`: Previews the resolved HTTP request with credentials redacted without making any network calls or reading the OS keychain.

### Dry-Run Test Matrix (Zero Network Calls, Zero Cost)
```powershell
# 1. Image Generation Preview (9:16 portrait)
.\local_tools\bin\gemini-api.exe image "1954 aircraft fuselage window stress testing diagram" `
  --aspect-ratio 9:16 --out scratch/test_gemini_image.jpg --dry-run --output-format json

# Output:
# {"dry_run":true,"request":{"method":"POST","url":"https://generativelanguage.googleapis.com/v1beta/interactions",
#  "body":{"input":"1954 aircraft fuselage window stress testing diagram","model":"gemini-nano-banana-2.1",
#  "response_format":{"aspect_ratio":"9:16","type":"image"},"stream":false}}}

# 2. Text-to-Speech Preview (Fenrir voice)
.\local_tools\bin\gemini-api.exe tts "In 1952, square windows on the de Havilland Comet cracked under pressure." `
  --voice Fenrir --out scratch/test_gemini_tts.wav --dry-run

# 3. Multimodal Video Frame Analysis Preview
.\local_tools\bin\gemini-api.exe analyze -i scratch/contact_sheet_cmvkps4wq0000onnrufncpsln/04_stress_flow_mechanics.jpg `
  "Verify that this diagram explains stress concentration accurately" --dry-run

# 4. Multimodal Audio/Video Transcription Preview (.srt format)
.\local_tools\bin\gemini-api.exe transcribe -i storage/processed/cmvkps4wq0000onnrufncpsln_short.mp4 `
  --format srt --out scratch/test_transcript.srt --dry-run
```

All 4 dry-run commands validated successfully with exit code 0, proving command syntax correctness without incurring billing.

---

## 4. Phase 3 — Comparative Analysis

| Dimension | SIMPLYYTR Local Engine (Current) | Gemini API CLI (Optional Tool) | Strategic Recommendation |
| :--- | :--- | :--- | :--- |
| **Visual Relevance** | Authentic NASA flight footage, CC BY-SA 3.0 archival photos, procedural vector diagrams. | High flexibility for concept art, futuristic scenes, and custom diagrams. | **Hybrid**: Use authentic footage for historical facts; use Gemini for conceptual scenes where no archival footage exists. |
| **Factual Integrity** | 100% grounded in primary FAA/RAE reports. | Risk of AI hallucination in synthetic imagery. | **Strict Rule**: Never use Gemini-generated imagery to substantiate factual claims. Tag as `AI_SYNTHETIC`. |
| **Narration Quality** | Windows SAPI ("Microsoft David"): Robotic, mono 22kHz, but 100% offline, zero latency, $0. | `gemini-3.8-flash-tts`: Studio-quality, natural inflection, multi-speaker dialogue. | **Integrate as optional upgrade**: SAPI remains offline default; Gemini activates when API key is set. |
| **Sound Design** | Procedural D-minor drone, 88 BPM pulse, sidechain ducking (-14 dB). Instantaneous, royalty-free. | `lyria-3.5`: AI-generated music tracks. High latency, subject to quota. | **Retain local procedural audio**: Local audio mixing is faster, deterministic, and free. |
| **Rendering Latency** | **36.3s total** for 65s 1080x1920 video. | Network latency adds 2-15s per image/TTS call; video takes 30-120s. | **Local-First**: Keep offline pipeline fast; use cloud generation asynchronously or during script planning. |
| **Cost** | **$0.00**. | Free tier (quota-limited) or paid per-call. | **Bounded**: Do not generate full videos via paid cloud models. |

---

## 5. Phase 4 — Architecture & Integration

The adapter was implemented cleanly without touching core editorial contracts:

### 1. `apps/backend/src/services/geminiCliAdapter.ts`
- **`resolveGeminiCliPath()`**: Discovers `local_tools/bin/gemini-api.exe` or system PATH.
- **`getGeminiCliStatus()`**: Inspects installation, version (`0.4.3`), and credentials.
- **`isGeminiApiKeyConfigured()`**: Safely checks `process.env.GEMINI_API_KEY` or `GOOGLE_API_KEY` without exposing secrets.
- **`runGeminiCliCommand()`**: Executes CLI commands with bounded timeout (25s), `--no-interactive`, `--output-format json`, and secret sanitization.
- **`generateGeminiCreativeAsset(prompt, options)`**:
  - Automatically falls back to `--dry-run` preview when API key is unset.
  - When API key is present: writes asset to `storage/assets/gemini_generated/`, calculates SHA-256 hash, and generates `.meta.json` enforcing `assetType: 'AI_SYNTHETIC'`, `isHistoricalEvidence: false`, `canSubstantiateClaims: false`.
- **`evaluateFrameWithGemini(framePath, rubric)`**: Uses `gemini-3.8-flash` to evaluate visual clarity and text legibility.

### 2. `apps/backend/src/services/localTts.ts`
- Registered `GeminiCliTtsProvider` under unified `ITtsProvider` interface.
- Priority: Windows SAPI remains default priority on Windows (`offline: true`). When `preferredEngine: 'GEMINI_CLI'` is requested and `GEMINI_API_KEY` is configured, it synthesizes neural audio via `gemini-3.8-flash-tts`.

---

## 6. Phase 5 — Verification & Automated Test Results

### 1. Gemini CLI Adapter Tests (`tests/pipeline/gemini_cli_adapter.test.mjs`)
- **Result**: **12 passed, 0 failed**
  - Binary discovery & version verification (`gemini-api 0.4.3`).
  - Safe unconfigured credential detection.
  - Offline model catalog discovery (Gemini, Gemma, Image, Speech, Music, Video).
  - JSON schema discovery for image generation.
  - 9:16 portrait image generation dry-run.
  - Multimodal frame evaluation dry-run.
  - Non-deception and provenance enforcement (`assetType: 'AI_SYNTHETIC'`).
  - `ITtsProvider` integration and offline priority retention.

### 2. Cross-Platform TTS Test Suite (`tests/security/cross_platform_tts.test.mjs`)
- **Result**: **22 passed, 0 failed**
  - All 5 registered providers validated (`WINDOWS_SAPI`, `ESPEAK_NG`, `PIPER`, `EDGE_TTS`, `GEMINI_CLI`).
  - Windows SAPI offline availability and synthesis.

### 3. Safety & Boundary Checklist
- [x] **Experimind ERP Port 55432**: Untouched and listening on PID 17828 throughout testing.
- [x] **Local PostgreSQL Port 5432**: Started safely for DB tests and cleanly stopped.
- [x] **Publishing Settings**: `autoPublishOnline: false` preserved. Zero publishing requests.
- [x] **No Paid Resources Created**: Zero network calls or cloud costs incurred.
- [x] **Zero Leaked Secrets**: `GEMINI_API_KEY` remained unconfigured; no credentials printed or committed.
- [x] **Zero Git Commits / Pushes**: Repository working tree preserved intact.

---

## 7. Operator Setup Guide (Optional Activation)

If an operator wishes to activate live Gemini API creative capabilities:

```powershell
# 1. Obtain an API key from Google AI Studio:
# https://aistudio.google.com/apikey

# 2. Configure the key in local .env (never commit .env):
# GEMINI_API_KEY="AIzaSy..."

# 3. Verify configuration offline and live via CLI:
.\local_tools\bin\gemini-api.exe whoami

# 4. Generate an optional concept illustration for an upcoming video:
node -e "
import('./apps/backend/src/services/geminiCliAdapter.ts').then(async m => {
  const res = await m.generateGeminiCreativeAsset(
    'Futuristic airliner wing inspection robot concept',
    { aspectRatio: '9:16' }
  );
  console.log(res);
});
"
```
