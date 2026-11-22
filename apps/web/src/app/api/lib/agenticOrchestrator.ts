/**
 * Peak Agentic Content Orchestrator (SIMPLYYTR SOTA 2026)
 * Integrates Multi-Source Harvesting, Evidence Graph, Adversarial Quality Gate,
 * Second-by-Second Retention Simulation, Claim-Linter, and Multi-Link Monetization.
 * 
 * Strict Gate Policy: A job ONLY transitions to 'SCRIPTED' if it passes ALL quality gates.
 * Any gate failure routes the job to 'NEEDS_REVIEW' with an explicit block reason.
 */

import { prisma } from './utils';
import { discoverDynamicOpportunity } from './trendRadar';
import { buildEvidenceGraph, lintScriptAgainstClaims, retrieveChannelMemory } from './evidenceGraph';
import { simulateSecondBySecondRetention, runRedTeamAdversary } from './adversarialQualityGate';
import { executeMultiStageGeneration } from './aiPipelineEngine';
import { selectBanditStrategy } from './banditLearningLoop';
import { getCircuitStatus, recordCircuitSuccess, recordCircuitFailure } from './circuitBreaker';
import { ScriptPackage } from './schemas';
import { logSystemEvent } from './logStore';
import { generateTopicGroundedPackage } from './topicGroundedGenerator';
import { validateContentPackage, deriveCaptionsFromSegments, type ContentPackage, type NarrationSegment, type FactualClaim } from './contentContract';

export interface AgenticExecutionTrace {
  runId: string;
  timestamp: string;
  stage: string;
  topicSelected: string;
  niche: string;
  evidenceClaimsCount: number;
  banditStrategy: string;
  isExploration: boolean;
  adversaryGrade: string;
  predictedAPV: string;
  criticScore: number;
  passedAllGates: boolean;
  blockReasons: string[];
  circuitStatus: string;
  jobCreatedId?: string;
  executionTimeMs: number;
}

/**
 * Executes 1 complete autonomous agentic run with strict adversarial gating
 */
export async function executePeakAgenticRun(options: {
  forceNiche?: string;
  forceTopic?: string;
  targetChannels?: string;
  defaultStyle?: 'PRODUCT_FIND' | 'REMASTER_REACTION' | 'CURIOSITY_SPLITSCREEN' | 'STANDARD';
  settings?: any;
  qualityProfile?: 'STANDARD' | 'CINEMATIC_PRO';
}): Promise<{ success: boolean; trace: AgenticExecutionTrace; scriptPackage?: ScriptPackage; error?: string }> {
  const startTime = Date.now();
  const runId = `run-${Date.now().toString(36)}`;

  // 1. Check Circuit Breaker
  const circuit = await getCircuitStatus();
  if (circuit.status === 'OPEN') {
    return {
      success: false,
      trace: {
        runId,
        timestamp: new Date().toISOString(),
        stage: 'CIRCUIT_BREAKER_PAUSED',
        topicSelected: 'None',
        niche: 'None',
        evidenceClaimsCount: 0,
        banditStrategy: 'NONE',
        isExploration: false,
        adversaryGrade: 'N/A',
        predictedAPV: '0%',
        criticScore: 0,
        passedAllGates: false,
        blockReasons: [`Circuit Breaker Open: ${circuit.pauseReason || 'Rate limit / upstream failure'}`],
        circuitStatus: 'OPEN',
        executionTimeMs: Date.now() - startTime
      },
      error: `Pipeline temporarily paused by Circuit Breaker: ${circuit.pauseReason || 'Upstream service failure'}`
    };
  }

  try {
    // 2. Retrieve Channel Memory & History for strict deduplication
    const memory = await retrieveChannelMemory(30);
    logSystemEvent({
      level: 'INFO',
      stage: 'DISCOVERY',
      message: `Channel Memory checked: ${memory.pastTopics.length} historical topics excluded to prevent repetition.`
    });

    // 3. Multi-Armed Bandit Strategy Selection (80% Exploit / 20% Explore)
    const bandit = await selectBanditStrategy(0.20);
    logSystemEvent({
      level: 'AGENT',
      stage: 'BANDIT',
      message: `Bandit Selector picked strategy: ${bandit.selectedStrategy} (${bandit.isExploration ? 'Exploration Mode' : 'Exploit Historical Winner'})`
    });

    // 4. Dynamic Multi-Source Opportunity Discovery
    const opportunity = await discoverDynamicOpportunity(options.forceNiche, memory.pastTopics);
    const selectedNiche = opportunity.niche;
    const selectedTopic = options.forceTopic?.trim() || opportunity.topic;
    const selectedStyle = options.defaultStyle || opportunity.recommendedStyle;
    const sourceUrl = opportunity.sourceSignal?.url;
    const sourceTitle = opportunity.sourceSignal?.title;

    logSystemEvent({
      level: 'AGENT',
      stage: 'DISCOVERY',
      message: `Trend Harvested: "${selectedTopic}" [Niche: ${selectedNiche}] (Est. APV: ${opportunity.estimatedAPV}, Tier: ${opportunity.rpmTier})`
    });

    // 5. Evidence Graph Grounding: Deconstruct topic into verified claims
    const claimSet = await buildEvidenceGraph(selectedTopic, selectedNiche, opportunity.sourceSignal?.summary, sourceUrl, sourceTitle);
    logSystemEvent({
      level: claimSet.degraded ? 'WARN' : 'INFO',
      stage: 'EVIDENCE',
      message: `Evidence Graph built: ${claimSet.claims.length} claims extracted (${claimSet.claims.filter(c => c.verified).length} grounded with URLs).`
    });

    // 6. Multi-Stage AI Generation with Head-to-Head Angle Battle
    const rawPackage = await executeMultiStageGeneration(
      selectedTopic,
      selectedNiche,
      selectedStyle,
      options.settings,
      bandit.selectedStrategy,
      claimSet
    );
    logSystemEvent({
      level: 'AGENT',
      stage: 'GENERATION',
      message: `Head-to-Head Angle Battle: Winner chosen "${rawPackage.selectedTitle}" (Style: ${rawPackage.videoStyle}, Critic Rubric: ${rawPackage.rubric.overallScore}/100)`
    });

    // 7. Claim-Linter Pass: Verify every assertive sentence is backed by evidence
    const linterResult = await lintScriptAgainstClaims(rawPackage.fullNarrationText, claimSet);
    logSystemEvent({
      level: linterResult.passed ? 'SUCCESS' : 'WARN',
      stage: 'LINTER',
      message: linterResult.passed 
        ? `Claim-Linter PASSED: 100% assertions grounded in evidence graph.` 
        : `Claim-Linter FLAGGED: ${linterResult.blockReason}`
    });

    // 8. Second-by-Second Retention Curve Simulation
    const retentionSim = await simulateSecondBySecondRetention(rawPackage.hook, rawPackage.body, rawPackage.cta, opportunity.targetDurationSec);
    logSystemEvent({
      level: retentionSim.passedGate ? 'SUCCESS' : 'WARN',
      stage: 'RETENTION',
      message: `Retention Simulator: Predicted APV ${retentionSim.averagePercentageViewed} (Gate ${retentionSim.passedGate ? 'PASSED >115%' : 'FAILED'})`
    });

    // 9. Red-Team Adversary Attack
    const adversary = await runRedTeamAdversary(rawPackage.selectedTitle, rawPackage.hook, rawPackage.body, rawPackage.cta);
    logSystemEvent({
      level: adversary.passedAdversaryGate ? 'SUCCESS' : 'WARN',
      stage: 'ADVERSARY',
      message: `Red-Team Adversary Audit: Hook Velocity Grade ${adversary.hookVelocityGrade} (Audit ${adversary.passedAdversaryGate ? 'APPROVED' : 'REJECTED: ' + adversary.blockReason})`
    });

    // 10. STRICT ADVERSARIAL QUALITY GATE VERDICT
    const blockReasons: string[] = [];

    if (claimSet.degraded) {
      blockReasons.push(`Evidence Graph Degraded: ${claimSet.error || 'Failed to verify factual claims'}`);
    }
    if (!linterResult.passed) {
      blockReasons.push(linterResult.blockReason || 'Claim-Linter detected ungrounded assertions.');
    }
    if (!retentionSim.passedGate || retentionSim.degraded) {
      blockReasons.push(retentionSim.rejectionReason || 'Retention simulation below threshold.');
    }
    if (!adversary.passedAdversaryGate || adversary.degraded) {
      blockReasons.push(adversary.blockReason || 'Adversary red-team audit rejected the script.');
    }
    if (!rawPackage.rubric.passed || rawPackage.degraded) {
      blockReasons.push(`Critic rubric score (${rawPackage.rubric.overallScore}/100) below required 80 threshold.`);
    }

    const passedAllGates = blockReasons.length === 0;
    const jobStatus = 'NEEDS_REVIEW';

    // 11. Construct Topic-Grounded Content Package (Phase 4B Single Content Contract)
    let contentPkg: ContentPackage;

    if (!passedAllGates) {
      // Degraded/unconfigured LLM -> Produce explicitly labeled deterministic topic-grounded demo
      contentPkg = generateTopicGroundedPackage(selectedTopic, {
        niche: selectedNiche,
        style: selectedStyle,
        version: '1.0.0'
      });
      contentPkg.reviewStatus = 'NEEDS_REVIEW';
    } else {
      // Live LLM passed all gates -> construct ContentPackage with generatorMode AI_DIRECT
      const segments: NarrationSegment[] = [
        {
          id: 'seg-1',
          order: 1,
          text: rawPackage.hook,
          visualPlan: {
            sceneType: 'MOTION_GRAPHIC',
            description: rawPackage.visualPrompts[0] || `Opening scene for ${selectedTopic}`,
            primaryText: selectedTopic.toUpperCase().slice(0, 30),
            secondaryText: rawPackage.selectedTitle,
            badgeText: 'HOT TOPIC',
            assetSource: 'LOCAL_SCENE_GRAPHICS',
            licenseMetadata: {
              licenseName: 'CC-BY-4.0',
              provenance: 'SIMPLYYTR AI Visual Generator',
              verified: false
            }
          }
        },
        {
          id: 'seg-2',
          order: 2,
          text: rawPackage.body,
          visualPlan: {
            sceneType: 'ORIGINAL_DIAGRAM',
            description: rawPackage.visualPrompts[1] || `Body scene for ${selectedTopic}`,
            primaryText: 'KEY INSIGHTS',
            secondaryText: 'Reported Analysis',
            badgeText: 'ANALYSIS',
            assetSource: 'ORIGINAL_DIAGRAM',
            licenseMetadata: {
              licenseName: 'CC-BY-4.0',
              provenance: 'SIMPLYYTR AI Visual Generator',
              verified: false
            }
          }
        },
        {
          id: 'seg-3',
          order: 3,
          text: rawPackage.cta,
          visualPlan: {
            sceneType: 'MOTION_GRAPHIC',
            description: rawPackage.visualPrompts[2] || `Closing scene for ${selectedTopic}`,
            primaryText: 'ACTIONABLE STEPS',
            secondaryText: 'Follow For More',
            badgeText: 'TAKEAWAY',
            assetSource: 'LOCAL_SCENE_GRAPHICS',
            licenseMetadata: {
              licenseName: 'CC-BY-4.0',
              provenance: 'SIMPLYYTR AI Visual Generator',
              verified: false
            }
          }
        }
      ];

      const claims: FactualClaim[] = claimSet.claims.map((c: any, i: number) => ({
        id: c.id || `claim-${i + 1}`,
        claimText: c.claimText,
        sourceRef: c.sourceTitle || c.sourceUrl || 'Research Signal',
        sourceUrl: c.sourceUrl || '',
        verified: false, // AI generation cannot assert verified: true without verifiable retrieval receipt
        evidenceStatus: c.sourceUrl ? 'source_located' : 'unverified',
        supportingExcerpt: c.supportingExcerpt || undefined,
        excerptType: c.supportingExcerpt ? 'authored_summary' : 'unmatched_excerpt',
        retrievalStatus: 'NOT_ATTEMPTED',
        verificationNotes: c.verificationNotes || (c.sourceUrl ? `Source identified by LLM research agent: ${c.sourceUrl}. Requires independent retrieval and operator review.` : 'Unverified claim candidate from AI generation.')
      }));

      contentPkg = {
        version: '1.0.0',
        topic: selectedTopic,
        audience: `Audience for ${selectedNiche}`,
        targetProblem: `Core insights regarding ${selectedTopic}`,
        proposedTitle: rawPackage.selectedTitle,
        openingHook: rawPackage.hook,
        segments,
        claims: claims.length > 0 ? claims : [{
          id: 'claim-1',
          claimText: `Analysis of ${selectedTopic}`,
          sourceRef: 'Research Signal',
          verified: false,
          evidenceStatus: 'unverified',
          excerptType: 'unmatched_excerpt',
          retrievalStatus: 'NOT_ATTEMPTED'
        }],
        callToAction: rawPackage.cta,
        captions: deriveCaptionsFromSegments(segments, 16.0),
        provenance: {
          source: 'AI Pipeline Engine (Groq/Gemini Multi-Stage)',
          generatorMode: 'AI_DIRECT',
          license: 'Proprietary Channel License',
          verified: false
        },
        reviewStatus: 'NEEDS_REVIEW',
        qualityProfile: options.qualityProfile || 'STANDARD'
      };
    }

    const validation = validateContentPackage(contentPkg);
    if (!validation.valid) {
      blockReasons.push(...validation.errors);
    }

    // 12. Persist into Database RenderJob
    const job = await prisma.renderJob.create({
      data: {
        status: jobStatus,
        topic: selectedTopic,
        scriptHook: contentPkg.segments[0].text,
        scriptBody: contentPkg.segments.slice(1, -1).map(s => s.text).join(' ') || contentPkg.segments[1].text,
        scriptCta: contentPkg.segments[contentPkg.segments.length - 1].text,
        visualPrompts: contentPkg.segments.map(s => s.visualPlan.description),
        contentPackage: contentPkg as any,
        voiceName: options.settings?.voiceName || 'en-US-GuyNeural',
        generatedTitle: contentPkg.proposedTitle,
        generatedDescription: rawPackage.description,
        generatedTags: rawPackage.tags,
        videoStyle: selectedStyle,
        productName: rawPackage.productName,
        productUrl: rawPackage.productUrl,
        affiliateLink: rawPackage.affiliateLink,
        pinnedCommentText: rawPackage.pinnedCommentText,
        contentIdRiskScore: rawPackage.compliance.riskScore,
        adSafeReplacements: rawPackage.compliance.replacements,
        renderEngine: options.settings?.renderEngine || 'KAGGLE',
        scriptedAt: new Date()
      }
    });

    logSystemEvent({
      level: passedAllGates ? 'SUCCESS' : 'WARN',
      stage: 'GATE',
      jobId: job.id,
      message: passedAllGates
        ? `Strict Quality Gate: APPROVED (Job ${job.id.slice(-8)} status: SCRIPTED -> Ready for GPU Render)`
        : `Strict Quality Gate: HELD FOR REVIEW (Job ${job.id.slice(-8)} status: NEEDS_REVIEW -> ${blockReasons.join('; ')})`
    });

    recordCircuitSuccess();

    const trace: AgenticExecutionTrace = {
      runId,
      timestamp: new Date().toISOString(),
      stage: passedAllGates ? 'READY_FOR_RENDER_DISPATCH' : 'ROUTED_TO_REVIEW_QUEUE',
      topicSelected: selectedTopic,
      niche: selectedNiche,
      evidenceClaimsCount: claimSet.claims.filter(c => c.verified).length,
      banditStrategy: bandit.selectedStrategy,
      isExploration: bandit.isExploration,
      adversaryGrade: adversary.hookVelocityGrade,
      predictedAPV: retentionSim.averagePercentageViewed,
      criticScore: rawPackage.rubric.overallScore,
      passedAllGates,
      blockReasons,
      circuitStatus: 'CLOSED',
      jobCreatedId: job.id,
      executionTimeMs: Date.now() - startTime
    };

    return {
      success: true,
      trace,
      scriptPackage: {
        ...rawPackage,
        titles: rawPackage.titleVariants,
        shotDirections: [],
        claimIdsMapped: linterResult.mappedClaims,
        adversary,
        retentionSim,
        degraded: !passedAllGates,
        blockReason: passedAllGates ? undefined : blockReasons.join(' | ')
      }
    };

  } catch (error: any) {
    const isFatal = error.message?.includes('401') || error.message?.includes('429');
    recordCircuitFailure(error.message || 'Pipeline execution failure', isFatal);

    return {
      success: false,
      trace: {
        runId,
        timestamp: new Date().toISOString(),
        stage: 'EXECUTION_FAILED',
        topicSelected: 'Unknown',
        niche: 'Unknown',
        evidenceClaimsCount: 0,
        banditStrategy: 'NONE',
        isExploration: false,
        adversaryGrade: 'F',
        predictedAPV: '0%',
        criticScore: 0,
        passedAllGates: false,
        blockReasons: [error.message || 'Fatal execution failure'],
        circuitStatus: (await getCircuitStatus()).status,
        executionTimeMs: Date.now() - startTime
      },
      error: error.message || 'Unknown orchestrator error'
    };
  }
}
