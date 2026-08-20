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
  targetChannels?: string;
  defaultStyle?: 'PRODUCT_FIND' | 'REMASTER_REACTION' | 'CURIOSITY_SPLITSCREEN' | 'STANDARD';
  settings?: any;
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

    // 3. Multi-Armed Bandit Strategy Selection (80% Exploit / 20% Explore)
    const bandit = await selectBanditStrategy(0.20);

    // 4. Dynamic Multi-Source Opportunity Discovery
    const opportunity = await discoverDynamicOpportunity(options.forceNiche, memory.pastTopics);
    const selectedNiche = opportunity.niche;
    const selectedTopic = opportunity.topic;
    const selectedStyle = options.defaultStyle || opportunity.recommendedStyle;
    const sourceUrl = opportunity.sourceSignal?.url;
    const sourceTitle = opportunity.sourceSignal?.title;

    // 5. Evidence Graph Grounding: Deconstruct topic into verified claims
    const claimSet = await buildEvidenceGraph(selectedTopic, selectedNiche, opportunity.sourceSignal?.summary, sourceUrl, sourceTitle);

    // 6. Multi-Stage AI Generation with Head-to-Head Angle Battle
    const rawPackage = await executeMultiStageGeneration(
      selectedTopic,
      selectedNiche,
      selectedStyle,
      options.settings,
      bandit.selectedStrategy,
      claimSet
    );

    // 7. Claim-Linter Pass: Verify every assertive sentence is backed by evidence
    const linterResult = await lintScriptAgainstClaims(rawPackage.fullNarrationText, claimSet);

    // 8. Second-by-Second Retention Curve Simulation
    const retentionSim = await simulateSecondBySecondRetention(rawPackage.hook, rawPackage.body, rawPackage.cta, opportunity.targetDurationSec);

    // 9. Red-Team Adversary Attack
    const adversary = await runRedTeamAdversary(rawPackage.selectedTitle, rawPackage.hook, rawPackage.body, rawPackage.cta);

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
    const jobStatus = passedAllGates ? 'SCRIPTED' : 'NEEDS_REVIEW';

    // 11. Persist into Database RenderJob
    const job = await prisma.renderJob.create({
      data: {
        status: jobStatus,
        topic: selectedTopic,
        scriptHook: rawPackage.hook,
        scriptBody: rawPackage.body,
        scriptCta: rawPackage.cta,
        visualPrompts: rawPackage.visualPrompts,
        voiceName: options.settings?.voiceName || 'en-US-GuyNeural',
        generatedTitle: rawPackage.selectedTitle,
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
