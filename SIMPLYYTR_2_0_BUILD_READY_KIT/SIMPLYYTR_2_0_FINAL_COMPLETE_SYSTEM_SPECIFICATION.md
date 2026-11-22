# SIMPLYYTR 2.0 --- Final Master Product, Architecture, Technology and Implementation Specification

**Status:** FINAL COMPLETE SYSTEM SPECIFICATION / architecture freeze\
**Date:** 2026-10-04\
**Decision:** Build a new SIMPLYYTR 2.0 core and selectively migrate
proven components from the existing `simply1git/simplyytr` repository.

------------------------------------------------------------------------

## 1. Executive decision

SIMPLYYTR 2.0 is not a downloader, generic AI video generator, or upload
bot. It is a **local-first autonomous content and affiliate operating
system**.

Its core loop is:

> **Research → Decide → Create → Verify → Publish → Measure → Learn →
> Improve**

The system should eventually operate after one-time setup with minimal
intervention. The user defines goals, niches, channels, policies,
affiliate programs, hardware limits and publishing boundaries. The
system then researches opportunities, selects what is worth producing,
verifies evidence and rights, creates original content, renders it,
publishes through supported official APIs, measures results, performs
postmortems, updates its strategy and continues.

The platform must remain useful when every paid cloud AI provider is
disabled. Paid providers, cloud GPUs, cloud storage and external
affiliate services are optional adapters.

### Final build decision

**Do not patch the current architecture into the new system.** Create a
clean SIMPLYYTR 2.0 architecture and migrate only reusable concepts and
proven integrations from the old repository.

The old project remains valuable as:

-   a source of working integrations;
-   a source of UI ideas;
-   a source of migration/test cases;
-   a record of previous design decisions;
-   a source of FFmpeg and YouTube integration code that can be cleaned
    and reused.

It is not the architectural base for 2.0.

------------------------------------------------------------------------

# 2. Product definition

## 2.1 What SIMPLYYTR should become

A standalone system that can:

1.  Discover emerging opportunities.
2.  Research them.
3.  Determine whether they are worth producing.
4.  Identify an audience and content angle.
5.  Find and verify products when monetization is relevant.
6.  Create original scripts and scene plans.
7.  Acquire, generate or create suitable visual assets.
8.  Generate narration and captions.
9.  Compile a complete timeline.
10. Render high-quality video.
11. Verify factuality, rights, disclosures, compliance and quality.
12. Publish through official platform APIs where supported.
13. Collect real analytics.
14. Attribute affiliate clicks/conversions/revenue where available.
15. Diagnose failures.
16. Run experiments.
17. Update strategy from evidence.
18. Continue operating within hard user-defined limits.

## 2.2 What it is not

SIMPLYYTR should not be designed as:

-   a mass-produced content spammer;
-   a clone-avatar factory;
-   a random-product generator;
-   a fake analytics system;
-   a browser automation bot whose survival depends on bypassing
    platform APIs;
-   a cloud-AI wrapper that stops working when an API key expires;
-   a system that forces a video to be produced when the opportunity is
    weak.

YouTube's current monetization policy explicitly emphasizes
original/authentic content and says repetitive or mass-produced content
can be ineligible for monetization. This makes originality and viewer
value a hard architectural requirement, not a marketing preference.

------------------------------------------------------------------------

# 3. Design principles

## 3.1 Free forever in the core

The core must work with local/open software and local storage.

Minimum core:

-   Python
-   FastAPI
-   PostgreSQL
-   pgvector
-   SQLAlchemy
-   Alembic
-   Pydantic
-   Ollama/local model runtime
-   local open-weight LLM
-   faster-whisper
-   local TTS
-   OpenCV
-   PaddleOCR
-   FFmpeg
-   local filesystem
-   official YouTube APIs when publishing to YouTube

Optional services must be adapters, never hard dependencies.

## 3.2 Provider independence

Every external capability gets an interface:

``` text
LLMProvider
EmbeddingProvider
VisionProvider
ASRProvider
TTSProvider
ImageProvider
VideoProvider
ResearchProvider
AffiliateProvider
PublishingProvider
AnalyticsProvider
```

The business logic must not know whether the provider is local or cloud.

## 3.3 Evidence before claims

A generated claim must be traceable to evidence where factuality
matters.

``` text
Claim
  ↓
Evidence
  ↓
Source
  ↓
Confidence
```

If confidence is below policy threshold, the system should:

-   research further;
-   soften the claim;
-   remove it;
-   or hold publication.

## 3.4 Rights before publishing

Every external/generated asset must have a rights record.

``` text
Asset
Source
Creator
License
Commercial use
Attribution
Downloaded at
Hash
Used in
```

"Free" does not automatically mean commercially safe.

## 3.5 Autonomy through controlled workflows

Do not create a swarm of unrestricted agents.

Use a deterministic state machine with specialized workers.

``` text
RESEARCH
→ OPPORTUNITY_FOUND
→ CONCEPT_SELECTED
→ RESEARCH_VERIFIED
→ SCRIPT_CREATED
→ ASSETS_READY
→ VIDEO_CREATED
→ QUALITY_CHECK
→ APPROVED
→ PUBLISHED
→ ANALYTICS_AVAILABLE
→ LEARNING
→ STRATEGY_UPDATED
→ NEXT_CYCLE
```

Every state has:

-   input schema;
-   output schema;
-   validator;
-   confidence;
-   retry policy;
-   timeout;
-   failure state;
-   audit log.

------------------------------------------------------------------------

# 4. Current SIMPLYYTR assessment

The current repository contains useful work but multiple generations of
architecture.

## 4.1 Keep conceptually

-   Trend Radar concept.
-   RLYA/self-learning concept.
-   RenderJob concept.
-   BackgroundJob concept.
-   FFmpeg integration.
-   YouTube OAuth/API integration.
-   Product-focused content mode.
-   Scene-level visual prompting.
-   Command-center/dashboard concept.
-   Multi-affiliate concept.

## 4.2 Rewrite

-   AI rewriter/content engine.
-   Compliance system.
-   Trend scoring.
-   Analytics/RLYA.
-   Database model.
-   Frontend command center.
-   Publishing orchestration.
-   Settings/configuration architecture.

## 4.3 Replace/delete

-   Hardcoded random product catalog as the product source of truth.
-   Hardcoded/generated coupon codes.
-   Likes/views-derived fake retention score.
-   Synthetic RPM/APV claims.
-   Simulated Content ID.
-   Clone-avatar as a default strategy.
-   Stealth browser uploader as a core publisher.
-   Rigid fixed daily upload count.
-   Mandatory cloud storage/Redis/Kaggle architecture.
-   Mandatory Groq/Gemini dependency.

## 4.4 Specific old files

### `apps/backend/src/services/productRadar.ts`

Use only as a reference for product-content categories. Replace
implementation with a real Product/Offer/Affiliate data model and
provider system.

### `apps/backend/src/services/aiRewriter.ts`

Use the response schema ideas, but rebuild around Research → Concept →
Evidence → Script → Scene Plan. The LLM is a compiler component, not the
entire content system.

### `apps/backend/src/services/complianceProxy.ts`

Retain the idea of a compliance gate, but replace simple word
substitution with claim/evidence/rights/disclosure/policy checks.

### `apps/backend/src/queue/analyticsTracker.ts`

Rewrite completely. Do not retain the current likes/views retention
estimate as a learning signal.

### `apps/web/src/app/page.tsx`

Reuse visual concepts only. Rebuild as separate dashboard sections.

------------------------------------------------------------------------

# 5. High-level architecture

``` text
                         USER
                          │
               GOALS / CONSTRAINTS
                          │
                          ▼
                 ┌──────────────────┐
                 │ AUTONOMOUS BRAIN │
                 │                  │
                 │ Goals            │
                 │ Planning         │
                 │ Decisions        │
                 │ Memory           │
                 │ Evaluation       │
                 │ Learning         │
                 └────────┬─────────┘
                          │
                    WORKFLOW STATE
                          │
        ┌─────────────────┼──────────────────┐
        ▼                 ▼                  ▼
    RESEARCH           CREATION         MONETIZATION
        │                 │                  │
        └─────────────────┼──────────────────┘
                          ▼
                       EXECUTION
                          │
                          ▼
                      PUBLISHING
                          │
                          ▼
                       ANALYTICS
                          │
                          ▼
                        LEARNING
                          │
                          └──────────► BRAIN
```

------------------------------------------------------------------------

# 6. Repository architecture

``` text
simplyytr/
├── apps/
│   ├── web/                    # Next.js UI
│   ├── api/                    # FastAPI application
│   ├── worker/                 # Background workers
│   └── cli/                    # Local administration/automation CLI
│
├── brain/
│   ├── orchestrator/           # Main autonomous state machine
│   ├── planner/                # Goal decomposition and scheduling
│   ├── decision/               # Opportunity/strategy decisions
│   ├── memory/                 # Persistent semantic/episodic memory
│   ├── policy/                 # User and platform constraints
│   └── evaluator/              # Self-evaluation/postmortem
│
├── engines/
│   ├── research/
│   ├── strategy/
│   ├── content/
│   ├── assets/
│   ├── voice/
│   ├── vision/
│   ├── video/
│   ├── affiliate/
│   ├── compliance/
│   ├── publishing/
│   ├── analytics/
│   └── learning/
│
├── providers/
│   ├── llm/
│   ├── embeddings/
│   ├── asr/
│   ├── tts/
│   ├── vision/
│   ├── image/
│   ├── video/
│   ├── research/
│   ├── affiliate/
│   ├── publishing/
│   └── analytics/
│
├── database/
│   ├── models/
│   ├── repositories/
│   └── migrations/
│
├── schemas/
├── workflows/
├── storage/
├── tests/
├── docs/
└── docker/
```

------------------------------------------------------------------------

# 7. Exact technology stack

  ----------------------------------------------------------------------------
  Area              Primary choice    Role                   Core?
  ----------------- ----------------- ---------------------- -----------------
  Frontend          Next.js + React + UI                     Yes
                    TypeScript                               

  Styling           Tailwind CSS      UI                     Yes

  Backend           Python + FastAPI  API/application        Yes

  Validation        Pydantic          Typed contracts        Yes

  ORM               SQLAlchemy 2.x    DB access              Yes

  Migrations        Alembic           DB migrations          Yes

  Database          PostgreSQL        System of record       Yes

  Vector search     pgvector          Memory/search          Yes

  LLM runtime       Ollama initially  Local inference        Yes

  LLM               Qwen3 family      Reasoning/content      Yes

  High-throughput   vLLM              Optional later         No
  runtime                                                    

  ASR               faster-whisper    Transcription          Yes

  TTS               Kokoro            Local speech           Yes

  Vision            Qwen-VL family    Semantic vision        Yes

  OCR               PaddleOCR         Text extraction        Yes

  CV                OpenCV            Deterministic visual   Yes
                                      processing             

  Rendering         FFmpeg            Final video            Yes

  Motion graphics   Motion Canvas     Advanced graphics      Optional core
                                                             module

  Timeline          SIMPLYYTR JSON    Internal edit model    Yes

  Timeline          OpenTimelineIO    Import/export          Optional
  interchange                                                

  Image generation  Provider          Generated visuals      Optional
                    abstraction                              capability

  Video generation  Provider          Generated shots        Optional
                    abstraction                              capability

  Media workflows   ComfyUI adapter   Optional AI workflow   No
                                      backend                

  Queue             PostgreSQL jobs   Background execution   Yes initially

  Storage           Local filesystem  Assets/renders/cache   Yes

  Publishing        YouTube Data API  Upload/metadata        Yes for YouTube
                                                             integration

  Analytics         YouTube Analytics Real performance data  Yes for YouTube
                    API                                      integration

  Learning          Python +          Strategy improvement   Yes
                    SQL/statistics                           

  Deployment        Docker Compose    Reproducible local     Yes initially
                                      deployment             
  ----------------------------------------------------------------------------

Qwen3's current official repository documents local execution through
Ollama and OpenAI-compatible serving, and states that its open-weight
models are Apache 2.0. vLLM is the planned higher-throughput serving
path when hardware justifies it. citeturn0search12turn0search10

pgvector keeps vector data in PostgreSQL and supports exact and
approximate nearest-neighbor search, which is appropriate for combining
structured business data and semantic memory in one database.
citeturn0search0turn0search1

faster-whisper is MIT licensed according to its current repository
metadata. Kokoro's repository currently lists Apache-2.0.
citeturn0search6turn0search13

FFmpeg is primarily LGPL 2.1+ but has optional GPL components; the build
configuration must deliberately control whether GPL components are
enabled. citeturn0search5

------------------------------------------------------------------------

# 8. Local AI model strategy

## 8.1 LLM

Default local family: **Qwen3**.

Initial runtime:

``` text
Ollama
  ↓
Qwen3 model selected for hardware
```

Later, high-throughput hardware can use vLLM.

Do not hardcode a single model size. Implement a model registry:

``` text
ModelProfile
- provider
- model_id
- version
- parameter_size
- quantization
- context_length
- VRAM_estimate
- RAM_estimate
- quality_class
- license
- commercial_allowed
- enabled
```

The Model Router selects a model based on task complexity, available
hardware, latency and configured constraints.

## 8.2 Model tasks

### Small/local model

-   classification
-   extraction
-   tagging
-   simple transformations
-   metadata

### Medium model

-   research synthesis
-   scripting
-   product comparison
-   content strategy

### Large/reasoning model

-   strategic planning
-   difficult research synthesis
-   postmortems
-   complex decisions

## 8.3 Model license registry

Every model record must contain:

``` text
code_license
weight_license
commercial_use
redistribution
attribution
restrictions
source_url
version
checksum
download_date
```

Never infer model-weight rights from the software library's license.

------------------------------------------------------------------------

# 9. Research engine

## 9.1 Purpose

The research engine turns the internet and configured data sources into
structured evidence.

``` text
Source
 ↓
Fetch
 ↓
Parse
 ↓
Normalize
 ↓
Deduplicate
 ↓
Extract claims
 ↓
Score source
 ↓
Store evidence
 ↓
Generate research brief
```

## 9.2 Providers

Initial providers:

-   RSS feeds
-   Google Trends/trend feeds where accessible
-   Hacker News public API
-   YouTube public/channel/video data where authorized
-   Bluesky public APIs where appropriate
-   configured news/search providers
-   configured product/merchant sources
-   user-provided URLs

Reddit should remain optional because API/data access rules can change.

## 9.3 Research objects

``` text
ResearchProject
Source
Evidence
Claim
ResearchSignal
ResearchSnapshot
```

## 9.4 Source scoring

Score based on:

-   source reputation;
-   primary vs secondary source;
-   freshness;
-   independence;
-   directness;
-   agreement with other sources.

## 9.5 Opportunity scoring

A candidate opportunity should be scored using measurable features such
as:

``` text
trend_growth
freshness
audience_fit
competition
production_cost
monetization_fit
source_confidence
historical_channel_performance
content_gap
```

The old synthetic RPM/APV scores must not be used as facts.

------------------------------------------------------------------------

# 10. Autonomous Brain

The Brain is the highest-level controller.

## 10.1 Responsibilities

-   maintain goals;
-   maintain policies;
-   inspect memory;
-   select objectives;
-   create plans;
-   call specialized engines;
-   inspect outputs;
-   retry failed tasks;
-   stop bad workflows;
-   evaluate outcomes;
-   update strategy.

## 10.2 Specialized workers

``` text
Research Worker
Trend Analyst
Audience Analyst
Product/Affiliate Analyst
Content Strategist
Script Director
Visual Director
Video Editor
Quality Controller
Compliance Controller
Publisher
Analytics Analyst
Learning Director
```

Workers communicate through typed workflow state, not uncontrolled
agent-to-agent conversation.

## 10.3 State machine

``` text
IDLE
 ↓
GOAL_SELECTED
 ↓
RESEARCHING
 ↓
OPPORTUNITY_EVALUATION
 ↓
OPPORTUNITY_SELECTED
 ↓
RESEARCH_VERIFICATION
 ↓
CONCEPT_CREATION
 ↓
SCRIPT_CREATION
 ↓
ASSET_PLANNING
 ↓
ASSET_ACQUISITION
 ↓
VOICE_CREATION
 ↓
TIMELINE_BUILD
 ↓
RENDERING
 ↓
QUALITY_CHECK
 ├── FAIL → REWORK
 └── PASS
       ↓
RIGHTS_CHECK
 ├── FAIL → HOLD
 └── PASS
       ↓
COMPLIANCE_CHECK
 ├── FAIL → REWORK/HOLD
 └── PASS
       ↓
PUBLISHING
 ↓
ANALYTICS_WAIT
 ↓
ANALYSIS
 ↓
POSTMORTEM
 ↓
LEARNING
 ↓
STRATEGY_UPDATE
 ↓
NEXT_CYCLE
```

------------------------------------------------------------------------

# 11. Persistent memory

Memory is not one vector table. It is several forms of knowledge.

## 11.1 Audience memory

-   topics of interest;
-   successful/failed themes;
-   audience segments;
-   format response;
-   retention patterns;
-   conversion behavior.

## 11.2 Content memory

-   hooks;
-   structures;
-   pacing;
-   visual patterns;
-   CTA styles;
-   successful formats;
-   failed formats.

## 11.3 Product memory

-   products;
-   prices;
-   offers;
-   commissions;
-   historical clicks;
-   conversions;
-   product claims;
-   source confidence.

## 11.4 Platform memory

-   API limitations;
-   publishing rules;
-   channel configuration;
-   policy checks;
-   previous failures.

## 11.5 Experiment memory

``` text
hypothesis
variable
control
treatment
sample
result
confidence
conclusion
```

## 11.6 Failure memory

The system must explicitly remember failures.

Example:

``` text
topic: acceptable
research: strong
title: good
thumbnail: good
hook: strong
first_visual: weak
information_density: low
product_placement: too early
CTA: aggressive
audience_match: moderate
result: poor
```

The next strategy should use this information.

------------------------------------------------------------------------

# 12. Content strategy engine

The system should never jump directly from trend → script.

Correct flow:

``` text
Opportunity
 ↓
Audience
 ↓
Problem/desire
 ↓
Content angle
 ↓
Promise
 ↓
Format
 ↓
Hook candidates
 ↓
Narrative structure
 ↓
Concept
```

Generate several concepts when useful, score them, then select one.

The system should be able to decide **not to produce** if expected value
is low.

------------------------------------------------------------------------

# 13. Psychology / attention architecture

The content engine should model:

``` text
Attention entry
 ↓
Expectation
 ↓
Curiosity
 ↓
Progress
 ↓
Payoff
 ↓
New question
 ↓
Resolution
```

Useful mechanisms:

-   curiosity gaps;
-   concrete demonstrations;
-   pattern interruption;
-   expectation matching;
-   information progression;
-   emotional arousal without rage-bait;
-   narrative transportation;
-   proof and specificity;
-   open loops that are actually resolved.

Do not hardcode a universal "3-second scene change" rule. Pacing is an
experimental variable.

------------------------------------------------------------------------

# 14. Script compiler

Input:

``` text
ResearchProject
Audience
ContentConcept
Evidence
Product/Offer
Brand policy
```

Output:

``` text
Script
 ├── Hook
 ├── Setup
 ├── Problem
 ├── Development
 ├── Evidence
 ├── Demonstration
 ├── Comparison
 ├── Payoff
 ├── CTA
 └── Disclosure
```

The LLM output must be validated with Pydantic.

No arbitrary unstructured response should directly enter rendering.

------------------------------------------------------------------------

# 15. Video creation system

## 15.1 Asset hierarchy

Prefer:

1.  User-owned media.
2.  Properly licensed media.
3.  Public-domain/compatible open-license media with verified rights.
4.  Generated images.
5.  Generated video.
6.  Procedural graphics.

AI generation should solve visual gaps, not become a requirement for
every scene.

## 15.2 Scene schema

``` json
{
  "scene_id": "S01",
  "duration": 4.2,
  "narration": "...",
  "visual_type": "product_demo",
  "asset_ids": [],
  "captions": [],
  "motion": {},
  "transition": {},
  "sfx": [],
  "music": {},
  "purpose": "demonstrate_claim",
  "evidence_ids": []
}
```

## 15.3 Timeline

The internal timeline contains:

-   video tracks;
-   audio tracks;
-   voice tracks;
-   music;
-   SFX;
-   captions;
-   overlays;
-   graphics;
-   transitions;
-   metadata.

FFmpeg is the final compiler.

------------------------------------------------------------------------

# 16. Voice/audio engine

Default local TTS: **Kokoro**.

ASR: **faster-whisper**.

Audio pipeline:

------------------------------------------------------------------------

# 54. Final research update and architecture supersession

This section is authoritative wherever it conflicts with an earlier section.
The earlier master specification remains the historical foundation; the
following decisions incorporate the final deep research pass performed on
2026-10-04.

The system is now defined as:

> **SIMPLYYTR 2.0 — an autonomous, local-first content, commerce,
affiliate-intelligence and learning operating system.**

The platform is not merely an AI video generator with affiliate links. Its
business loop is:

```text
AUDIENCE
  -> PROBLEM
  -> INTENT
  -> OPPORTUNITY
  -> RESEARCH
  -> PRODUCT / SOLUTION
  -> OFFER
  -> CONTENT
  -> DISTRIBUTION
  -> CLICK
  -> CONVERSION
  -> REVENUE
  -> POSTMORTEM
  -> LEARNING
  -> STRATEGY UPDATE
```

The final architecture therefore has four equally important intelligence
planes:

1. **Audience and Research Intelligence**
2. **Content and Media Intelligence**
3. **Commerce and Affiliate Intelligence**
4. **Measurement and Learning Intelligence**

The Autonomous Brain coordinates all four.

------------------------------------------------------------------------

# 55. Research findings that materially changed the design

## 55.1 YouTube Shopping is now a first-class commerce channel

YouTube's current Shopping affiliate program is available to eligible
creators in India and other listed markets. Eligible creators can tag
products, inspect affiliate offers and commission rates, and view shopping
performance in YouTube Studio. YouTube also supports custom commission
campaigns for eligible creators.

Source:
https://support.google.com/youtube/answer/13376398

## 55.2 YouTube supports Amazon product tagging in India

YouTube currently documents direct Amazon product tagging for eligible
creators enrolled in YPP and the YouTube Shopping affiliate program in
India, the United States and Brazil.

Source:
https://support.google.com/youtube/answer/17105501

This makes India a strategically important first marketplace for the
system's commerce engine.

## 55.3 YouTube Shopping can localize products

YouTube may match tagged products to local merchants for international
viewers based on relevance, reliability, pricing and availability. The
commission can therefore depend on the actual fulfilling merchant/rate,
not merely the product originally tagged.

Source:
https://support.google.com/youtube/answer/10191533

The database must therefore model **country, merchant, localized offer and
commission rate** separately.

## 55.4 YouTube now has auto-tagging

YouTube documents Shopping auto-tagging that can identify products in
videos, generate timestamps and convert supported seller URLs into product
tags. This is useful, but SIMPLYYTR should treat platform auto-tagging as a
provider capability rather than as the system's only product-recognition
mechanism.

Source:
https://support.google.com/youtube/answer/17046000

## 55.5 YouTube's monetization rules make originality a hard requirement

YouTube's current monetization policy explicitly describes repetitive or
mass-produced content as inauthentic and potentially ineligible for
monetization. It also says similar formats can monetize when the substance
is materially varied and provides creative, educational or other value.

Source:
https://support.google.com/youtube/answer/1311392

Therefore SIMPLYYTR must optimize for **original value**, not upload volume.
The Brain is explicitly allowed to choose **NO VIDEO**.

## 55.6 AI is an implementation tool, not the value proposition

YouTube's current guidance allows AI-assisted creation when the resulting
content remains original/authentic and follows applicable disclosure rules.
SIMPLYYTR therefore uses AI to accelerate research, writing, visual design,
editing and analysis while requiring a distinct concept, evidence, creative
decisions and viewer value.

## 55.7 Google product-review guidance reinforces evidence-first commerce

Google's current review guidance emphasizes original research, first-hand
evidence, quantitative measurements, competitor comparisons, benefits and
drawbacks, and useful decision-making information. It specifically notes
that reviews often use affiliate links.

Sources:
https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews
https://developers.google.com/search/docs/appearance/reviews-system

SIMPLYYTR therefore treats **evidence quality** as a product/content feature,
not a final proofreading step.

## 55.8 Amazon's current Creators API changes the integration plan

Amazon India's current Creators API documentation identifies the following
operations:

- SearchItems
- GetItems
- GetVariations
- GetBrowseNodes

The current documentation also states prerequisites for Creators API access,
including Associates enrollment, qualifying activity requirements and API
registration.

Source:
https://affiliate-program.amazon.in/creatorsapi/docs/en-us/introduction

The old PA-API-centric design is therefore retired. Amazon integration is a
provider adapter with capability detection and a manual-link fallback.

## 55.9 Commission rates are dynamic

YouTube explicitly states that displayed commission rates are estimates and
that actual payout reflects the rate on the purchase date. Rates can change
because of merchant strategy and promotions.

Source:
https://support.google.com/youtube/answer/17263096

Therefore SIMPLYYTR must never permanently associate a product with one
commission rate.

## 55.10 Disclosure is a system feature

FTC guidance requires affiliate relationships to be disclosed clearly and
conspicuously. ASCI's current influencer guidance explicitly lists
"Affiliate" as a permitted disclosure label and requires disclosure of
material connections.

Sources:
https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking
https://www.ascionline.in/the-asci-code-guidelines/
https://www.ascionline.in/social/tools/

Disclosure is therefore generated and verified by policy engines rather than
left to an LLM prompt.

------------------------------------------------------------------------

# 56. The final product architecture

```text
                                  USER
                                   |
                         GOALS / LIMITS / POLICIES
                                   |
                                   v
                        +------------------------+
                        |    AUTONOMOUS BRAIN    |
                        | planner / decision     |
                        | memory / policy        |
                        | evaluator / recovery   |
                        +-----------+------------+
                                    |
            +-----------------------+------------------------+
            |                       |                        |
            v                       v                        v
       RESEARCH                 CONTENT                 COMMERCE
       INTELLIGENCE             INTELLIGENCE            INTELLIGENCE
            |                       |                        |
            +-----------+-----------+-----------+------------+
                        |                       |
                        v                       v
                  QUALITY / TRUST        DISTRIBUTION
                        |                       |
                        +-----------+-----------+
                                    |
                                    v
                               PUBLISHING
                                    |
                                    v
                                ANALYTICS
                                    |
                                    v
                                 LEARNING
                                    |
                                    v
                             STRATEGY MEMORY
                                    |
                                    +------> BRAIN

              COMPUTE FABRIC supports every heavy worker
```

The system is intentionally **not** a swarm of unrestricted autonomous
agents. Agents are workers operating under typed contracts and a controlled
state machine.

------------------------------------------------------------------------

# 57. Autonomous Brain — final specification

The Brain is responsible for:

- goals;
- priorities;
- planning;
- opportunity selection;
- resource selection;
- policy enforcement;
- experiment selection;
- failure recovery;
- memory retrieval;
- strategy updates;
- stopping decisions.

It must never be allowed to override hard policy constraints.

## 57.1 Brain inputs

```text
channel goals
niche boundaries
audience knowledge
current trends
research evidence
product/offer data
historical performance
revenue data
compute availability
provider health
rights/compliance state
user constraints
```

## 57.2 Brain outputs

```text
NO_ACTION
RESEARCH_MORE
CREATE_CONTENT
CREATE_WITHOUT_MONETIZATION
MONETIZE_EXISTING_CONTENT
RUN_EXPERIMENT
WAIT_FOR_OFFER
WAIT_FOR_COMPUTE
HOLD_FOR_REVIEW
PUBLISH
STOP_SYSTEM
```

## 57.3 Hard policy examples

```text
max_daily_uploads
max_daily_compute
max_product_price
allowed_regions
allowed_affiliate_programs
allowed_categories
blocked_categories
minimum_evidence_confidence
minimum_quality_score
minimum_originality_score
maximum_commercial_density
auto_publish_enabled
manual_approval_required
paid_provider_allowed
cloud_gpu_allowed
```

No learning algorithm can modify these without explicit user authorization.

------------------------------------------------------------------------

# 58. Controlled state machine

The canonical lifecycle is:

```text
RESEARCH
 -> OPPORTUNITY_FOUND
 -> CONCEPT_SELECTED
 -> RESEARCH_VERIFIED
 -> COMMERCE_EVALUATED
 -> SCRIPT_CREATED
 -> ASSETS_READY
 -> VIDEO_CREATED
 -> QUALITY_CHECK
 -> COMPLIANCE_CHECK
 -> APPROVED
 -> PUBLISHED
 -> ANALYTICS_AVAILABLE
 -> POSTMORTEM
 -> LEARNING
 -> STRATEGY_UPDATED
 -> NEXT_CYCLE
```

Any state can produce:

```text
RETRY
WAIT
HOLD
REWORK
REJECT
```

Every transition records:

```text
input
output
actor
model/provider
confidence
policy version
evidence IDs
attempt number
error
elapsed time
```

------------------------------------------------------------------------

# 59. Affiliate Intelligence becomes a core engine

The affiliate subsystem is no longer a small provider module.

It is a full commerce operating system:

```text
engines/affiliate/
|
+-- intelligence/
|   +-- source_discovery
|   +-- knowledge_ingestion
|   +-- source_ranker
|   +-- claim_extractor
|   +-- method_extractor
|   +-- case_study_extractor
|   +-- knowledge_graph
|
+-- discovery/
|   +-- program_discovery
|   +-- merchant_discovery
|   +-- product_discovery
|   +-- offer_discovery
|
+-- qualification/
|   +-- program_score
|   +-- product_score
|   +-- trust_score
|   +-- commerce_score
|
+-- catalog/
|   +-- product_truth
|   +-- price
|   +-- availability
|   +-- freshness
|
+-- placement/
|   +-- surface_selector
|   +-- cta_optimizer
|   +-- product_tagger
|   +-- commercial_density
|
+-- links/
|   +-- link_manager
|   +-- provider_policy
|   +-- attribution
|   +-- redirect_policy
|
+-- compliance/
|   +-- disclosures
|   +-- claims
|   +-- rights
|   +-- platform_rules
|
+-- analytics/
|   +-- impressions
|   +-- clicks
|   +-- conversions
|   +-- commission
|   +-- revenue
|
+-- experiments/
|   +-- experiment_manager
|   +-- allocator
|   +-- evaluator
|
+-- forecasting/
|   +-- revenue_forecast
|   +-- conversion_forecast
|   +-- simulator
|
+-- strategy/
    +-- portfolio
    +-- postmortem
    +-- optimizer
```

------------------------------------------------------------------------

# 60. Affiliate Knowledge Engine

The system must learn from public affiliate resources without blindly
believing them.

```text
SOURCE DISCOVERY
      |
      v
SOURCE QUALITY / AUTHORITY
      |
      v
CONTENT EXTRACTION
      |
      +---- claims
      +---- methods
      +---- case studies
      +---- experiments
      +---- program rules
      |
      v
KNOWLEDGE BASE
      |
      v
HYPOTHESIS
      |
      v
SIMPLYYTR EXPERIMENT
      |
      v
OBSERVED RESULT
      |
      v
CONFIDENCE UPDATE
      |
      v
STRATEGY MEMORY
```

The system never converts a guru claim directly into a permanent rule.

## 60.1 Source hierarchy

Initial trust ordering:

1. official platform documentation;
2. official affiliate-program documentation;
3. regulatory guidance;
4. official measured experiments;
5. established specialist resources;
6. credible practitioner case studies;
7. community discussions;
8. anonymous earnings claims.

The ranking is a prior. SIMPLYYTR's own measured evidence can eventually
outweigh external advice for its own audience.

## 60.2 Knowledge object

```text
AffiliateKnowledge
- source_id
- claim
- method
- context
- niche
- platform
- audience
- evidence_type
- evidence_strength
- observed_result
- confidence
- created_at
- verified_at
- expiry_at
```

------------------------------------------------------------------------

# 61. Commerce model: audience-first, not product-first

The system must not start from a random catalog item.

Canonical reasoning:

```text
AUDIENCE
  -> PROBLEM
  -> INTENT
  -> DESIRED OUTCOME
  -> SOLUTION CLASS
  -> PRODUCT CLASS
  -> PRODUCT
  -> OFFER
  -> CONTENT
```

## 61.1 Audience intent classes

```text
INFORMATIONAL
NAVIGATIONAL
COMMERCIAL_RESEARCH
TRANSACTIONAL
POST_PURCHASE
```

## 61.2 Commerce opportunity classes

```text
PRODUCT_LED
PROBLEM_LED
COMPARISON
SEARCH_LED
TREND_LED
TUTORIAL_LED
UPGRADE_LED
DEAL_LED
ALTERNATIVE_LED
SAAS / RECURRING
LEAD_GENERATION
```

------------------------------------------------------------------------

# 62. Product Truth System

Every commercially recommended product receives a structured truth record.

```text
ProductTruth
- product_id
- merchant
- region
- canonical_url
- title
- specifications
- price
- currency
- availability
- rating
- review_count
- source
- checked_at
- freshness
```

Claims are separate:

```text
Claim
- text
- source_id
- source_type
- evidence_type
- confidence
- allowed_wording
- expires_at
```

The script engine must distinguish:

```text
MANUFACTURER_CLAIM
INDEPENDENT_EVIDENCE
USER_REPORT
FIRST_HAND_EXPERIENCE
SYSTEM_INFERENCE
```

A missing source means the claim cannot be presented as fact.

------------------------------------------------------------------------

# 63. First-hand experience ledger

SIMPLYYTR must never invent experience.

```text
ProductExperience
- product_id
- owner
- test_date
- test_duration
- test_conditions
- measurements
- footage_ids
- notes
- result
```

Statements such as:

> "I tested this for 30 days"

are permitted only when an experience record exists.

This follows the core principle that endorsements and reviews must represent
honest experience and must not create unsupported impressions.

------------------------------------------------------------------------

# 64. Product and offer scoring

## 64.1 ProductScore

```text
ProductScore =
  audience_fit
+ problem_fit
+ evidence_quality
+ demonstrability
+ trust
+ content_uniqueness
+ value_for_money
+ availability
+ historical_conversion
+ strategic_learning_value
- uncertainty
- refund_risk
- policy_risk
```

## 64.2 OfferScore

```text
OfferScore =
  conversion_probability
* expected_order_value
* effective_commission
+ strategic_value
+ repeat_value
- price_friction
- offer_uncertainty
```

Commission percentage alone must never determine selection.

------------------------------------------------------------------------

# 65. Commerce graph

The database must support this graph:

```text
Audience
  |
  +--> Problem
        |
        +--> Intent
              |
              +--> Solution
                    |
                    +--> Product
                          |
                          +--> Merchant
                          |
                          +--> Offer
                                |
                                +--> AffiliateProgram
                                      |
                                      +--> Link
                                            |
                                            +--> Content
                                                  |
                                                  +--> Click
                                                        |
                                                        +--> Conversion
                                                              |
                                                              +--> Commission
```

This lets the Brain learn which audience/problem/offer combinations
actually generate business value.

------------------------------------------------------------------------

# 66. Affiliate provider architecture

```text
providers/affiliate/
|
+-- amazon/
|   +-- creators_api
|   +-- associates
|   +-- policy
|
+-- youtube_shopping/
|
+-- impact/
+-- partnerstack/
+-- cj/
+-- awin/
+-- rakuten/
+-- direct_merchant/
+-- generic/
```

Provider adapters must expose common contracts:

```text
search_products()
get_product()
get_offer()
get_commission()
get_tracking_link()
validate_link()
get_program_rules()
get_eligibility()
get_conversion_data()
get_revenue_data()
```

A provider may legitimately return `UNSUPPORTED` for any capability.

------------------------------------------------------------------------

# 67. Amazon provider — final design

Amazon is a provider, not the architecture.

Current India Creators API operations include:

```text
SearchItems
GetItems
GetVariations
GetBrowseNodes
```

Source:
https://affiliate-program.amazon.in/creatorsapi/docs/en-us/introduction

The provider must implement:

```text
capability detection
credential health
quota management
caching
product lookup
offer freshness
link generation
policy validation
API failure handling
manual-link fallback
```

## 67.1 Amazon quota manager

```text
APIQuota
- requests_used
- requests_remaining
- daily_limit
- tps_limit
- reset_at
- last_request_at
```

## 67.2 Amazon fallback

If API access is unavailable:

```text
verified manually configured URL
        -> known product record
        -> no invented price/specification
```

The system may still create content using user-supplied or independently
verified product information.

------------------------------------------------------------------------

# 68. YouTube Shopping provider — final design

```text
providers/affiliate/youtube_shopping/
├── eligibility
├── catalog
├── offers
├── tagging
├── localization
├── analytics
└── policy
```

The provider must model:

```text
creator eligibility
seller eligibility
product eligibility
country
localized merchant
commission rate
campaign rate
product availability
tag status
analytics
```

YouTube documents that commissions can vary by merchant and purchase date,
and international purchases can use localized products/merchant rates.

Source:
https://support.google.com/youtube/answer/17263096
https://support.google.com/youtube/answer/10191533

------------------------------------------------------------------------

# 69. Product tagging intelligence

The system should maintain a scene-to-product graph:

```text
Scene
  -> mentioned product
  -> visible product
  -> inferred product category
  -> verified product candidate
  -> eligible shopping tag
  -> confidence
```

Tagging rule:

> A product must be meaningfully related to the content.

The system should prefer fewer highly relevant tags over many weak tags.

YouTube's current guidance says products must be meaningfully related to the
video and also provides automated product-detection features.

------------------------------------------------------------------------

# 70. Existing-content monetization engine

One of the highest-value features is monetizing existing videos.

```text
PUBLISHED VIDEO
      |
      v
TRANSCRIPT + SCENES + COMMENTS + METADATA
      |
      v
ENTITY / PROBLEM / INTENT EXTRACTION
      |
      v
COMMERCE INTENT SCORE
      |
      v
PRODUCT DISCOVERY
      |
      v
PROGRAM / OFFER CHECK
      |
      v
MONETIZATION OPPORTUNITY
      |
      +--> SHOPPING TAG
      +--> DESCRIPTION LINK
      +--> PINNED COMMENT
      +--> EXTERNAL COMPARISON PAGE
```

This lets the system extract value from successful content already published.

------------------------------------------------------------------------

# 71. Commerce Intent Score

```text
CommerceIntent =
  purchase_intent
+ product_mentions
+ solution_language
+ comparison_language
+ audience_questions
+ historical_click_behavior
- commercial_intrusion
```

Classes:

```text
NONE
WEAK
MODERATE
STRONG
```

The threshold is learned by audience and channel.

------------------------------------------------------------------------

# 72. Affiliate placement optimizer

Possible surfaces:

```text
YouTube Shopping tag
Amazon product tag
Description link
Pinned comment
Verbal CTA
On-screen CTA
End-screen CTA
Channel/storefront link
External comparison page
Website affiliate link
SaaS referral link
Lead-gen link
```

The optimizer chooses a surface using:

```text
platform capability
content format
viewer intent
country
product eligibility
historical conversion
commercial density
provider policy
```

It should never create a link/surface that the provider does not permit.

------------------------------------------------------------------------

# 73. Affiliate link manager

Every link is represented as:

```text
AffiliateLink
- provider
- merchant
- product
- offer
- destination_url
- tracking_method
- tracking_identifier
- content_id
- placement_id
- campaign_id
- experiment_id
- disclosure_rule_id
- policy_version
- created_at
- last_validated_at
```

The system does not implement universal cloaking. Redirects, shortening,
parameters and tracking methods are provider-specific and policy-controlled.

------------------------------------------------------------------------

# 74. Commerce event model

```text
CommerceEvent
- event_id
- event_type
- content_id
- video_id
- product_id
- offer_id
- link_id
- placement_id
- campaign_id
- experiment_id
- timestamp
- region
- attribution_state
- source
```

Event types:

```text
TAG_VIEW
LINK_VIEW
LINK_CLICK
OUTBOUND
PRODUCT_VIEW
CONVERSION
COMMISSION
REFUND
REVERSAL
```

Attribution states:

```text
DIRECT
PROVIDER_REPORTED
NETWORK_REPORTED
INFERRED
UNKNOWN
```

The system must never turn an inferred value into an observed value.

------------------------------------------------------------------------

# 75. Affiliate funnel

```text
IMPRESSION
  -> VIEW
  -> PRODUCT AWARENESS
  -> PRODUCT INTEREST
  -> CLICK / TAG INTERACTION
  -> MERCHANT SESSION
  -> PURCHASE
  -> COMMISSION
```

Core KPIs:

```text
views
product_views
click_rate
conversion_rate
commission_per_order
revenue_per_view
revenue_per_1000_views
revenue_per_video
revenue_per_production_hour
revenue_per_compute_hour
refund_rate
forecast_error
```

------------------------------------------------------------------------

# 76. Revenue forecasting

Baseline model:

```text
ExpectedRevenue =
  expected_views
* expected_product_interest_rate
* expected_click_rate
* expected_conversion_rate
* expected_order_value
* effective_commission_rate
```

Then calculate:

```text
ExpectedBusinessValue =
  ExpectedRevenue
+ audience_growth_value
+ learning_value
+ evergreen_value
- production_cost
- compute_cost
- policy_risk
```

The forecast must include uncertainty intervals rather than one fake-precise
number once enough historical data exists.

------------------------------------------------------------------------

# 77. Forecast calibration

Store:

```text
forecast_views
actual_views
forecast_clicks
actual_clicks
forecast_conversions
actual_conversions
forecast_revenue
actual_revenue
```

Measure:

```text
absolute_error
relative_error
bias
calibration
```

The Brain should learn whether it systematically overestimates viral reach or
conversion.

------------------------------------------------------------------------

# 78. Affiliate experimentation system

Every experiment contains:

```text
Experiment
- hypothesis
- object
- control
- treatment
- audience
- variable
- metric
- minimum_sample
- start
- end
- result
- confidence
- decision
```

Examples:

```text
problem-first vs product-first
single product vs comparison
premium vs budget
video demo vs talking explanation
CTA at 30s vs 60s
tag vs description link
one product vs three products
price-first vs benefit-first
high-commission vs high-conversion product
```

Do not optimize on tiny samples. Use confidence intervals and minimum sample
rules appropriate to the metric.

------------------------------------------------------------------------

# 79. Portfolio intelligence

Affiliate opportunities are managed as a portfolio:

```text
EVERGREEN
FAST-CONVERSION
HIGH-TICKET
RECURRING-SAAS
SEASONAL
EXPERIMENTAL
```

The portfolio optimizer balances:

```text
cash-flow potential
long-term value
risk
learning value
production effort
```

The Brain should not concentrate the entire business on one merchant or one
product category unless policy explicitly requires it.

------------------------------------------------------------------------

# 80. Price and offer intelligence

Every supported product can have:

```text
PriceSnapshot
- product_id
- merchant
- region
- price
- currency
- timestamp
- availability
- offer_type
```

Offer states:

```text
NORMAL
DISCOUNTED
COUPON
PROMOTION
LIMITED_TIME
OUT_OF_STOCK
UNKNOWN
```

Historical prices must be distinguished from current prices.

The system may say an offer is unusually good only when historical evidence
supports the comparison.

------------------------------------------------------------------------

# 81. Seasonality and product lifecycle

The commerce engine should model:

```text
product_launch
product_growth
product_maturity
discount_cycle
replacement
seasonality
festival_period
back_to_school
holiday
new_model_release
```

This allows the Brain to search for:

> rising demand + relevant product + unusually good offer

instead of simply:

> trending product.

------------------------------------------------------------------------

# 82. Trust engine

Every commercial recommendation receives a trust score based on:

```text
first_hand_evidence
source_quality
claim_verification
merchant_reputation
product_consistency
transparent_disclosure
balanced_pros_cons
comparison_quality
```

High commission cannot compensate for low trust.

The system should be allowed to say:

> **Do not buy this.**

This is an intentional feature, not a failure.

------------------------------------------------------------------------

# 83. Review/content quality architecture

A serious product review should contain as appropriate:

```text
what problem it solves
who it is for
who it is not for
key evidence
measurements
comparison
benefits
drawbacks
alternatives
price/value context
first-hand experience when available
disclosure
```

This aligns with current Google review guidance emphasizing original research,
first-hand evidence, measurements, comparisons and benefits/drawbacks.

------------------------------------------------------------------------

# 84. Content formats supported by the commerce engine

```text
BEST X
BEST X UNDER Y
X VS Y
I TESTED X
BEFORE YOU BUY X
X ALTERNATIVES
IS X WORTH IT?
X AFTER 30 DAYS
X SETUP GUIDE
X MISTAKES
X FOR BEGINNERS
X FOR PROFESSIONALS
BUYING GUIDE
DEAL ANALYSIS
ALTERNATIVE TO X
```

These are format primitives, not scripts. The actual substance must vary and
be supported by evidence.

------------------------------------------------------------------------

# 85. Commercial density control

Every video receives:

```text
commercial_density = 0..5
```

Conceptually:

```text
0  informational
1  lightly monetized
2  balanced
3  commerce-forward
4  heavy commercial
5  advertisement-like
```

The system learns acceptable density by audience and format.

A hard maximum can be configured by the user.

------------------------------------------------------------------------

# 86. Disclosure and compliance engine

The compliance layer must operate before publication.

```text
AFFILIATE RELATIONSHIP
        |
        v
PROGRAM RULES
        |
        v
COUNTRY RULES
        |
        v
PLATFORM RULES
        |
        v
DISCLOSURE GENERATION
        |
        v
PLACEMENT CHECK
        |
        v
CLAIM CHECK
        |
        v
PASS / HOLD
```

Supported disclosure concepts include:

```text
Affiliate
Ad
Sponsored
Paid Partnership
Free Gift
Includes Paid Promotion
```

Exact wording and placement are provider/platform/region dependent.

Sources:
https://www.ascionline.in/the-asci-code-guidelines/
https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking

------------------------------------------------------------------------

# 87. Claim-substantiation engine

Each claim is classified:

```text
FACT
OPINION
COMPARATIVE_CLAIM
PERFORMANCE_CLAIM
PRICE_CLAIM
AVAILABILITY_CLAIM
FIRST_HAND_CLAIM
```

Required evidence is determined by class.

Example:

```text
"Supports 65W"
-> technical source required

"Best battery life"
-> comparative evidence required

"I used it for 30 days"
-> experience record required

"Currently ₹1,299"
-> fresh price source required
```

Unsupported claims are rewritten or removed.

------------------------------------------------------------------------

# 88. Rights and asset provenance

Every asset gets:

```text
AssetLicense
- asset_id
- source_url
- creator
- platform
- license
- commercial_use
- attribution_required
- attribution_text
- downloaded_at
- hash
- used_in_content
```

Model/license registry:

```text
ModelProfile
- model
- version
- task
- code_license
- weight_license
- commercial_use
- redistribution
- attribution
- restrictions
- source
- download_date
```

Code license and model-weight license must never be conflated.

------------------------------------------------------------------------

# 89. Originality engine

Before publication:

```text
CONTENT_ORIGINALITY_SCORE
```

Signals include:

```text
original research
original narration
original analysis
original footage
unique argument
unique structure
source transformation
creative contribution
```

The system should reject content that is effectively a lightly modified copy of
another creator's content.

This directly addresses current YouTube reused/inauthentic-content risks.

------------------------------------------------------------------------

# 90. Anti-mass-production architecture

The Brain must maintain a **Content Similarity Budget**.

For every new candidate, compare against recent channel output:

```text
topic similarity
hook similarity
script structure
visual pattern
thumbnail pattern
title pattern
CTA pattern
product pattern
```

If the content becomes too interchangeable:

```text
REWORK
WAIT
OR REJECT
```

This is preferable to simply increasing upload frequency.

------------------------------------------------------------------------

# 91. Content Quality Vector

Every video receives:

```text
StoryQuality
VisualQuality
AudioQuality
EditingQuality
InformationQuality
TrustQuality
OriginalityQuality
CommerceQuality
ComplianceQuality
BrandQuality
```

Overall quality is not a simple average when critical failures exist.

For example:

```text
Rights failure -> HOLD
False claim -> HOLD
Missing disclosure -> HOLD
Corrupt render -> HOLD
Low visual polish -> REWORK
Weak CTA -> OPTIMIZE
```

------------------------------------------------------------------------

# 92. Video intelligence architecture

Final asset hierarchy:

```text
original/user footage
        > licensed stock
        > verified product imagery
        > screenshots / diagrams
        > generated images
        > generated video
        > procedural motion graphics
```

The hierarchy is selected according to the evidence and story requirement,
not a fixed rule.

Timeline remains structured:

```text
Scene
- duration
- narration
- visual
- caption
- transition
- SFX
- music
- purpose
- evidence_ids
- product_ids
```

FFmpeg is the deterministic final compiler.

Motion Canvas can be used for programmatic motion graphics.

------------------------------------------------------------------------

# 93. Psychology and attention engine

The platform should model:

```text
ATTENTION ENTRY
 -> EXPECTATION
 -> CURIOSITY
 -> PROGRESS
 -> PAYOFF
 -> NEW QUESTION
 -> RESOLUTION
```

Learnable variables include:

```text
hook type
information density
scene duration
cut rate
caption density
visual novelty
proof timing
product timing
CTA timing
```

The old hardcoded rule of universal "3-second scene changes" is retired.
Pacing is an experimental variable.

------------------------------------------------------------------------

# 94. Real learning architecture

The old synthetic retention calculation is permanently removed.

Do not estimate audience retention from likes/views.

Store actual available metrics from supported platform APIs, including:

```text
views
watch time
average view duration
retention curves where available
likes
comments
shares
subscribers
traffic sources
clicks
shopping metrics
affiliate conversions
commission
revenue
```

Scene-level features are stored alongside performance data.

------------------------------------------------------------------------

# 95. Learning hierarchy

Learning operates at seven levels:

```text
1. VIDEO
2. FORMAT
3. TOPIC
4. AUDIENCE
5. MONETIZATION
6. PRODUCTION
7. STRATEGY
```

A learning result must identify its level and confidence.

Example:

```text
VIDEO:
weak first demonstration

FORMAT:
demo-first performs better

TOPIC:
portable power content strong

AUDIENCE:
entry-level buyers prefer lower price points

MONETIZATION:
comparison videos produce stronger conversion

PRODUCTION:
original demo footage improves trust

STRATEGY:
prioritize evidence-rich comparison content
```

------------------------------------------------------------------------

# 96. Postmortem engine

Every completed experiment/video can generate:

```text
what was expected
what happened
what differed
what probably caused it
evidence
confidence
what to change
what not to change
```

Example:

```text
Topic: acceptable
Title: strong
Thumbnail: strong
Hook: strong
First visual: weak
Information density: low
Product timing: too early
CTA: acceptable
Audience fit: moderate

Likely cause:
viewer expectation mismatch caused by weak visual proof.
```

The Brain learns from postmortems, not just scores.

------------------------------------------------------------------------

# 97. Experiment allocation

Initial method:

```text
controlled A/B tests
minimum sample sizes
confidence intervals
```

Later:

```text
Bayesian experimentation
contextual bandits
multi-armed bandits
causal inference
```

Do not introduce bandits before the event/experiment data model is reliable.

------------------------------------------------------------------------

# 98. Memory architecture

Persistent memory categories:

```text
AudienceMemory
ContentMemory
TopicMemory
ProductMemory
MerchantMemory
AffiliateMemory
ExperimentMemory
FailureMemory
PlatformMemory
PolicyMemory
ProductionMemory
```

Memory entries have:

```text
source
confidence
last_verified
scope
expiry
```

The system must be able to forget stale assumptions without deleting the
historical record.

------------------------------------------------------------------------

# 99. Compute Fabric — final design

The old Kaggle concept is retained, but upgraded from "free server" to an
elastic compute fabric.

```text
engines/compute/
├── scheduler.py
├── dispatcher.py
├── capability.py
├── worker_registry.py
├── checkpoint.py
├── retry.py
├── resource_manager.py
└── providers/
    ├── local.py
    ├── kaggle.py
    ├── user_machine.py
    └── cloud.py
```

## 99.1 Control plane

The local machine owns:

```text
FastAPI
PostgreSQL
Autonomous Brain
scheduler
workflow manager
memory
analytics
dashboard
storage manager
job state
```

## 99.2 Worker plane

Workers may be:

```text
LOCAL_CPU
LOCAL_GPU
KAGGLE_GPU
USER_MACHINE_GPU
OPTIONAL_CLOUD_GPU
```

The core must continue if Kaggle disappears.

------------------------------------------------------------------------

# 100. Kaggle worker architecture

Kaggle is a **burst GPU worker**, not the persistent control plane.

```text
LOCAL BRAIN
    |
    v
GPU JOB
    |
    v
KAGGLE WORKER
    |
    v
GPU INFERENCE / MEDIA TASK
    |
    v
CHECKPOINT / RESULT
    |
    v
PERSISTENT STORAGE
    |
    v
LOCAL BRAIN
```

Current Kaggle notebook documentation states that notebook sessions provide
remote compute, currently documents 12-hour CPU/GPU execution sessions and
20 GB autosaved `/kaggle/working` storage, with hardware availability subject
to the service's current conditions.

Source:
https://www.kaggle.com/docs/notebooks

Therefore SIMPLYYTR must never promise continuous free GPU availability.

"24/7" means the **control system remains operational 24/7 and schedules work
whenever suitable compute becomes available**.

------------------------------------------------------------------------

# 101. Compute job model

```text
ComputeJob
- id
- workload_type
- capability_required
- model_profile
- input_artifacts
- output_artifacts
- priority
- checkpoint_state
- progress
- provider
- worker_id
- attempt
- deadline
- retry_policy
- created_at
- updated_at
```

Workload classes:

```text
CPU
GPU
GPU_HEAVY
LONG_RUNNING
NETWORK
LOCAL_ONLY
```

------------------------------------------------------------------------

# 102. Checkpoint protocol

Every long-running GPU task must be resumable.

Example:

```text
Scene generation: 63%
```

Worker failure:

```text
SAVE CHECKPOINT
MARK WORKER LOST
REQUEUE REMAINING WORK
RESUME FROM 63%
```

Never store the only copy of a result on a temporary Kaggle filesystem.

Checkpoint contents can include:

```text
job progress
scene index
model state where supported
completed asset IDs
input hashes
output hashes
random seed where relevant
provider metadata
```

------------------------------------------------------------------------

# 103. Model routing

Every model receives a profile:

```text
ModelProfile
- name
- version
- task
- VRAM_required
- RAM_required
- quantization
- license
- commercial_use
- runtime
- provider
- download_source
```

Routing considers:

```text
task complexity
quality requirement
latency
available hardware
VRAM
CPU/RAM
job priority
license
compute cost
provider health
```

Example:

```text
simple classification -> local CPU model
normal research -> local LLM
large media generation -> Kaggle GPU
urgent task -> local GPU if available
optional premium quality -> paid provider if policy permits
```

------------------------------------------------------------------------

# 104. Free-first compute tiers

```text
TIER 0  local CPU/GPU
TIER 1  Kaggle free GPU burst
TIER 2  other legitimately available free compute
TIER 3  user-owned machines
TIER 4  optional paid cloud
```

A higher tier is never required for the system's fundamental operation.

------------------------------------------------------------------------

# 105. Local AI stack

Core local stack remains:

```text
LLM          Qwen3 family + Ollama initially
Serving      vLLM later where beneficial
ASR          faster-whisper
TTS          Kokoro; Piper fallback
Vision       Qwen-VL family
OCR          PaddleOCR
CV           OpenCV
Embeddings   local embedding model
```

The provider layer must allow replacement of any model without rewriting the
business logic.

------------------------------------------------------------------------

# 106. Video/media stack

```text
FFmpeg
Motion Canvas
OpenTimelineIO adapter where useful
custom SIMPLYYTR timeline
OpenCV
Pillow / image tooling as needed
```

The timeline is the source of truth; generated media is an implementation
artifact.

------------------------------------------------------------------------

# 107. Research engine

Research sources should include, where permitted:

```text
RSS
official APIs
public documentation
search results
news
public creator content
public discussion
product catalogs
affiliate program documentation
```

Research records:

```text
ResearchProject
Source
Claim
Evidence
Conflict
SourceSnapshot
```

Conflicting claims remain visible instead of being silently merged.

------------------------------------------------------------------------

# 108. Research confidence

Every research claim gets:

```text
source_authority
recency
independence
corroboration
specificity
conflict_level
```

This produces:

```text
EvidenceConfidence
```

Minimum confidence can be set per content category.

------------------------------------------------------------------------

# 109. Database — final logical model

Core entities:

```text
Workspace
Channel
Audience
AudienceProblem
AudienceIntent
Topic
TrendSignal
ResearchProject
Source
Claim
Evidence
ContentConcept
Script
ScriptVariant
Scene
Asset
AssetLicense
Voice
Timeline

AffiliateKnowledgeSource
AffiliateKnowledgeClaim
AffiliateMethod
AffiliateCaseStudy
AffiliateProgram
AffiliateProgramRule
AffiliateMerchant
AffiliateProduct
AffiliateProductVariant
AffiliateOffer
AffiliatePriceSnapshot
AffiliatePromotion
AffiliateLink
AffiliatePlacement
ProductEvidence
ProductExperience
CommerceIntent

Campaign
Experiment
ExperimentObservation
PublishedVideo
RetentionPoint
CommerceEvent
AffiliateConversion
AffiliateCommission
RevenueEvent
RevenueForecast

LearningModel
StrategyRule
MemoryEntry
Postmortem

BackgroundJob
ComputeWorker
ComputeJob
ComputeCheckpoint
ModelProfile
Provider
Policy
SystemConstraint
```

------------------------------------------------------------------------

# 110. Storage architecture

Local-first:

```text
PostgreSQL
  -> structured state

pgvector
  -> semantic memory / evidence retrieval

local filesystem
  -> media artifacts

object-storage abstraction
  -> optional R2/S3/etc.
```

The system must retain content hashes and metadata so media can be moved
between storage providers without losing identity.

------------------------------------------------------------------------

# 111. API architecture

```text
apps/api/
├── auth
├── brain
├── research
├── content
├── affiliate
├── commerce
├── media
├── publishing
├── analytics
├── learning
├── compute
├── memory
└── admin
```

FastAPI provides typed endpoints and Pydantic contracts.

The API must not expose unrestricted agent execution to the browser.

------------------------------------------------------------------------

# 112. Frontend architecture

Next.js + TypeScript.

Primary screens:

```text
Command Center
Research
Opportunities
Content Studio
Commerce / Affiliate
Products
Offers
Experiments
Published Content
Analytics
Learning
Compute
Memory
Policies
Providers
Logs
System Health
```

The old single giant `page.tsx` is not migrated as-is.

------------------------------------------------------------------------

# 113. Command Center

The dashboard should answer:

```text
What is the system doing?
Why is it doing it?
What is it waiting for?
What failed?
What did it learn?
What is expected next?
How much compute is available?
What content is earning money?
Which products are working?
```

The user should be able to inspect the reasoning chain through evidence IDs,
not hidden chain-of-thought.

------------------------------------------------------------------------

# 114. Privacy and secrets

Secrets must never be stored in generated prompts, logs or database rows in
plain text.

Use:

```text
OS environment variables
secret store abstraction
encrypted credentials where persistence is required
OAuth token rotation
least privilege
```

No API key belongs in frontend code.

------------------------------------------------------------------------

# 115. Provider health system

Every external provider receives:

```text
ProviderHealth
- availability
- authentication
- quota
- latency
- error_rate
- last_success
- last_failure
```

The Brain can route around provider failures.

------------------------------------------------------------------------

# 116. Failure and recovery

Failure categories:

```text
RESEARCH_FAILURE
MODEL_FAILURE
ASSET_FAILURE
RIGHTS_FAILURE
RENDER_FAILURE
PROVIDER_FAILURE
PUBLISH_FAILURE
ANALYTICS_FAILURE
AFFILIATE_FAILURE
COMPUTE_FAILURE
POLICY_FAILURE
```

Recovery rules are typed.

Example:

```text
Kaggle unavailable
-> move GPU job to local GPU if capable
-> otherwise checkpoint and wait

Amazon API unavailable
-> use cached verified product data if still fresh
-> otherwise hold price-dependent content

YouTube upload fails
-> retry with backoff
-> preserve upload state
-> never duplicate publish blindly
```

------------------------------------------------------------------------

# 117. Security boundaries

The autonomous Brain must not be able to:

- bypass authentication;
- defeat platform restrictions;
- evade affiliate program rules;
- publish prohibited content;
- modify hard user limits;
- expose secrets;
- create uncontrolled network tunnels;
- silently install arbitrary software.

Browser automation, where ever used, is a fallback adapter and not the core
publishing mechanism.

------------------------------------------------------------------------

# 118. Old SIMPLYYTR migration map — final

```text
OLD COMPONENT                    FINAL DECISION
---------------------------------------------------------------
Next.js UI                       reuse technology, rebuild UI
React components                 selectively reuse
Trend Radar                      keep concept, rewrite
Trend collectors                 selectively reuse
AI Rewriter                      rewrite
Groq integration                 optional provider
Product Radar                    delete implementation
Affiliate concept               keep and greatly expand
Compliance proxy                keep concept, rewrite
RLYA concept                    keep
RLYA implementation             delete
RenderJob concept               keep
FFmpeg integration              keep/clean
YouTube OAuth                   keep/clean
Puppeteer uploader              optional fallback only
Database schema                 replace
SystemSettings                  replace with policy/config
BackgroundJob                   keep concept
Redis/BullMQ                    optional later
R2                              optional storage provider
Kaggle                          keep as Compute Fabric provider
Clone avatar                    remove as core/default
Synthetic analytics             delete
Hardcoded products              delete
Hardcoded coupons               delete
```

------------------------------------------------------------------------

# 119. Final repository structure

```text
simplyytr/
├── apps/
│   ├── web/
│   ├── api/
│   ├── worker/
│   └── cli/
│
├── brain/
│   ├── orchestrator/
│   ├── planner/
│   ├── decision/
│   ├── memory/
│   ├── policy/
│   ├── evaluator/
│   └── recovery/
│
├── engines/
│   ├── research/
│   ├── strategy/
│   ├── audience/
│   ├── content/
│   ├── assets/
│   ├── voice/
│   ├── vision/
│   ├── video/
│   ├── affiliate/
│   ├── commerce/
│   ├── compliance/
│   ├── publishing/
│   ├── analytics/
│   ├── learning/
│   └── compute/
│
├── providers/
│   ├── llm/
│   ├── embeddings/
│   ├── asr/
│   ├── tts/
│   ├── vision/
│   ├── image/
│   ├── video/
│   ├── research/
│   ├── affiliate/
│   ├── publishing/
│   └── compute/
│
├── database/
│   ├── models/
│   ├── migrations/
│   └── repositories/
│
├── schemas/
├── workflows/
├── storage/
├── tests/
├── docs/
└── docker/
```

------------------------------------------------------------------------

# 120. Development sequence — final

The system should be built in the following order.

## Phase 0 — architecture and contracts

- repository skeleton;
- configuration;
- logging;
- database;
- Pydantic schemas;
- provider interfaces;
- policy engine.

## Phase 1 — local job infrastructure

- PostgreSQL-backed jobs;
- worker registry;
- retries;
- checkpoints;
- artifact store.

## Phase 2 — Compute Fabric

- local worker;
- capability detection;
- Kaggle adapter;
- checkpoint/resume;
- provider health;
- model router.

## Phase 3 — Research

- source ingestion;
- source ranking;
- claims/evidence;
- trend detection;
- research memory.

## Phase 4 — Local intelligence

- Qwen3/Ollama;
- embeddings;
- faster-whisper;
- Kokoro;
- vision/OCR.

## Phase 5 — Content compiler

- concept;
- script;
- scene plan;
- asset selection;
- timeline;
- narration;
- captions;
- FFmpeg render.

## Phase 6 — Quality and rights

- evidence gates;
- originality;
- asset rights;
- claim verification;
- audio/video quality.

## Phase 7 — Affiliate vertical slice

Implement exactly one complete path:

```text
Audience problem
-> product discovery
-> product verification
-> offer economics
-> script
-> video
-> affiliate integration
-> disclosure
-> publish-ready package
-> click tracking
-> revenue event
-> postmortem
```

Start with Generic + Amazon/YouTube Shopping capability adapters.

## Phase 8 — Publishing

- YouTube OAuth;
- metadata;
- upload;
- product tags where supported;
- retry/reconciliation.

## Phase 9 — Analytics

- YouTube analytics ingestion;
- shopping metrics;
- affiliate events;
- revenue;
- retention.

## Phase 10 — Learning

- experiment DB;
- postmortems;
- forecast calibration;
- strategy memory;
- recommendations.

## Phase 11 — Autonomous Brain

- opportunity selection;
- planning;
- automatic execution;
- recovery;
- staged autonomy.

## Phase 12 — Expansion

Only after the core loop works:

- more affiliate networks;
- more platforms;
- advanced image/video models;
- Bayesian optimization;
- contextual bandits;
- more compute providers.

------------------------------------------------------------------------

# 121. Staged autonomy

## Level A — Automation

User initiates jobs.

## Level B — Assisted autonomy

System recommends decisions.

## Level C — Supervised autonomy

System executes within policies; user reviews high-risk actions.

## Level D — Full autonomy

System continuously operates within hard constraints.

Full autonomy requires successful acceptance tests for every critical path.

------------------------------------------------------------------------

# 122. Acceptance test suite — final

## Foundation

- create job;
- execute job;
- retry job;
- checkpoint job;
- resume job;
- preserve artifacts.

## Compute

- dispatch GPU job locally;
- dispatch GPU job to Kaggle;
- survive worker loss;
- resume from checkpoint;
- continue without Kaggle.

## Research

- discover opportunity;
- store sources;
- detect conflicts;
- assign confidence;
- explain selection.

## AI

- local LLM works without paid API;
- ASR works;
- TTS works;
- vision works;
- model routing works.

## Content

- create original concept;
- produce script;
- create scene plan;
- produce timeline;
- render valid video.

## Trust

- every factual claim has evidence;
- every asset has rights metadata;
- first-hand claims require experience records;
- unsupported claims are blocked.

## Affiliate

- product discovered;
- product verified;
- offer verified;
- commission freshness checked;
- provider rules applied;
- disclosure generated;
- link validated;
- click event recorded;
- conversion stored when available;
- revenue never fabricated.

## YouTube Shopping

- eligibility checked;
- relevant product identified;
- tag prepared;
- localization handled where supported;
- shopping metrics ingested.

## Publishing

- OAuth works;
- upload succeeds;
- duplicate upload protection works;
- failure recovery works.

## Analytics

- real performance stored;
- retention is not synthetically fabricated;
- commerce metrics are joined to content.

## Learning

- experiment runs;
- result evaluated;
- forecast compared with actual;
- postmortem generated;
- strategy updated.

## Autonomy

- system can plan;
- decide;
- execute;
- stop;
- recover;
- learn;
- obey policies.

------------------------------------------------------------------------

# 123. What must never be built into the core

The following are explicitly rejected as core architecture:

- clone-avatar automation;
- mass-produced interchangeable videos;
- fake retention metrics;
- random hardcoded product selection;
- fabricated discounts/coupons;
- fabricated personal product experience;
- fake reviews;
- universal commission assumptions;
- unrestricted autonomous browser control;
- stealth uploader dependence;
- bypassing platform limits;
- dependence on a free GPU provider being online continuously;
- dependence on a single LLM provider;
- dependence on Amazon alone;
- forced content production when evidence is weak.

------------------------------------------------------------------------

# 124. Definition of "free forever"

"Free forever" means:

```text
CORE SOFTWARE COST = ZERO
CORE AI CAN RUN LOCALLY
CORE DATABASE = SELF-HOSTED
CORE MEDIA PIPELINE = OPEN / LOCAL
CORE JOB SYSTEM = SELF-HOSTED
CORE STORAGE = LOCAL
PAID PROVIDERS = OPTIONAL
CLOUD GPU = OPTIONAL
AFFILIATE PROGRAM FEES = PROVIDER-SPECIFIC
PLATFORM ELIGIBILITY = NOT GUARANTEED BY SOFTWARE
```

It does **not** mean that every external API, affiliate program, marketplace
or platform will always remain free or available.

The architecture must remain functional when all optional paid providers are
disabled.

------------------------------------------------------------------------

# 125. Definition of "24/7"

SIMPLYYTR can be designed to operate continuously at the orchestration level,
but no honest architecture can guarantee uninterrupted free third-party GPU
availability.

The final model is:

```text
24/7 CONTROL PLANE
       |
       +--> local compute when available
       |
       +--> Kaggle burst compute when available
       |
       +--> other free compute when available
       |
       +--> user-owned machines when available
       |
       +--> optional paid compute when permitted
```

All long-running work is checkpointable.

Therefore compute scarcity causes **delay**, not data loss or architectural
failure.

------------------------------------------------------------------------

# 126. Final strategic principles

1. **Audience before product.**
2. **Problem before promotion.**
3. **Evidence before claim.**
4. **Trust before commission.**
5. **Original value before volume.**
6. **Observed revenue before imagined revenue.**
7. **Experiments before assumptions.**
8. **Local-first before paid APIs.**
9. **Checkpointing before distributed compute.**
10. **Provider abstraction before platform lock-in.**
11. **Policy enforcement before autonomy.**
12. **Learning from results before fine-tuning models.**
13. **One complete vertical slice before a huge feature list.**
14. **The system may choose not to publish.**
15. **The system may choose not to monetize.**

------------------------------------------------------------------------

# 127. Final one-page system definition

SIMPLYYTR 2.0 is a local-first autonomous operating system for building an
original content and affiliate business.

It researches audiences and problems, discovers opportunities, evaluates
products and offers, creates evidence-backed original content, integrates
appropriate monetization surfaces, verifies rights and disclosures, publishes
through official APIs, collects real performance and commerce data, performs
postmortems, runs controlled experiments, learns what works, and updates its
strategy.

Its control plane runs locally. Its intelligence can run locally. Its media
pipeline can run locally. Heavy workloads can opportunistically use Kaggle or
other compute workers through a checkpointable Compute Fabric. Paid services
are adapters, not dependencies.

Its affiliate system is not a link generator. It is a commerce intelligence
layer connecting:

```text
Audience
-> Problem
-> Intent
-> Solution
-> Product
-> Offer
-> Content
-> Placement
-> Click
-> Conversion
-> Commission
-> Learning
```

Its most important long-term asset is not the model. It is the accumulated
structured knowledge of:

```text
what audiences want
what content works
what products help
what claims are trustworthy
what offers convert
what monetization surfaces work
what experiments succeeded
what failed
and why
```

That accumulated evidence becomes the platform's proprietary strategic memory
while the underlying software remains local-first and free to operate.

------------------------------------------------------------------------

# 128. Research source register — final pass

Primary sources used to update this specification:

1. YouTube Shopping affiliate overview and eligibility:
   https://support.google.com/youtube/answer/13376398
2. YouTube Shopping general documentation:
   https://support.google.com/youtube/answer/12257682
3. YouTube Shopping commission and earnings:
   https://support.google.com/youtube/answer/17263096
4. YouTube product tagging/localization/analytics:
   https://support.google.com/youtube/answer/10191533
5. YouTube Shopping auto-tagging:
   https://support.google.com/youtube/answer/17046000
6. YouTube Amazon tagging:
   https://support.google.com/youtube/answer/17105501
7. YouTube monetization policies:
   https://support.google.com/youtube/answer/1311392
8. Google high-quality product reviews:
   https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews
9. Google reviews system:
   https://developers.google.com/search/docs/appearance/reviews-system
10. Amazon India Creators API:
    https://affiliate-program.amazon.in/creatorsapi/docs/en-us/introduction
11. FTC endorsements/influencer guidance:
    https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews
12. FTC affiliate disclosure guidance:
    https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking
13. ASCI Code:
    https://www.ascionline.in/the-asci-code-guidelines/
14. ASCI disclosure tool:
    https://www.ascionline.in/social/tools/
15. Kaggle notebook specifications:
    https://www.kaggle.com/docs/notebooks

These sources establish current external constraints. Provider terms,
platform eligibility, commissions, APIs, model licenses and policies can
change; the implementation must therefore store provider-policy versions and
revalidate before consequential actions.

------------------------------------------------------------------------

# 129. Final architecture freeze

**Decision: BUILD.**

The previous master specification is superseded by this complete system
specification where the two differ.

The implementation target is not an idealized autonomous agent. It is a
measurable, policy-controlled, recoverable operating system whose autonomy is
earned through successful tests and evidence.

The first implementation milestone remains one complete end-to-end vertical
slice. Everything else should be built around making that slice reliable,
observable, commercially meaningful and capable of learning.
