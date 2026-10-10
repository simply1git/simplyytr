# OSS Technology Selection Matrix

| Area | Candidate | Role | Decision |
|---|---|---|---|
| Agent workflow | LangGraph | stateful AI workflows | strong candidate |
| Durable workflow | Temporal | durable long-running workflows | evaluate later |
| Browser | Playwright | browser automation/research | use |
| Web crawl | Crawl4AI | structured research ingestion | strong candidate |
| Local LLM | Ollama | local inference | use |
| GPU serving | vLLM | high-throughput worker inference | use where needed |
| Retrieval | pgvector | vector search/memory | use initially |
| Video | FFmpeg | core media primitive | use |
| Timeline | SIMPLYYTR Timeline IR | canonical media representation | build |
| Timeline interchange | OpenTimelineIO | optional interchange | evaluate |
| Video React | Remotion | optional renderer | adapter only; license review |
| Image workflow | ComfyUI | optional image provider | adapter only |
| ASR | faster-whisper | transcription | use |
| TTS | Kokoro/Piper | local voice | use through provider interface |
| OCR | PaddleOCR | OCR | use |
| CV | OpenCV | frame/media analysis | use |
| Telemetry | OpenTelemetry | system telemetry | use |
| LLM observability | Langfuse | traces/evals | strong candidate |
| Local S3 | MinIO | object storage backend | optional |
| Curation reference | AIHOT | signal pipeline ideas | study/reference |
| Research workbench | OpenScience | research-agent patterns | study/reference |
| Builder portability | agentic-stack | portability design reference | study/reference |
| Agent memory | Letta Code | memory patterns | study/reference |
| Instruction optimization | Backpass/OptMem | bounded memory patterns | study/reference |
| Agent runtime | DeepSeek Harness | replay/plugin patterns | study/reference |

## Lock-in rule
Exact versions and licenses must be rechecked before dependency lock-in. Optional tools must remain replaceable.
