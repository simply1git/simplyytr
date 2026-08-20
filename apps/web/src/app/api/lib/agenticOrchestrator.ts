/**
 * Peak Agentic Content Orchestrator (SIMPLYYTR SOTA 2026)
 * Integrates Multi-Source Harvesting, Evidence Graph, Adversarial Quality Gate,
 * Second-by-Second Retention Simulation, Claim-Linter, and Multi-Link Monetization.
 */

import { prisma } from './utils';
import { discoverDynamicOpportunity } from './trendRadar';
import { buildEvidenceGraph, lintScriptAgainstClaims, retrieveChannelMemory } from './evidenceGraph';
import { simulateSecondBySecondRetention, runRedTeamAdversary, headToHeadJudge } from './adversarialQualityGate';
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
  circuitStatus: string;
  jobCreatedId?: string;
  executionTimeMs: number;
}

/**
 * Executes 1 complete autonomous agentic run
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
  const circuit = getCircuitStatus();
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
        circuitStatus: 'OPEN',
        executionTimeMs: Date.now() - startTime
      },
      error: `Pipeline temporarily paused by Circuit Breaker: ${circuit.pauseReason || 'Too many upstream failures'}`
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

    // 5. Evidence Graph Grounding: Deconstruct topic into verified claims
    const claimSet = await buildEvidenceGraph(selectedTopic, selectedNiche, opportunity.sourceSignal?.summary);

    // 6. Multi-Stage AI Generation
    const rawPackage = await executeMultiStageGeneration(selectedTopic, selectedNiche, selectedStyle, options.settings);

    // 7. Claim-Linter Pass: Verify every assertive sentence is backed by evidence
    const linterResult = await lintScriptAgainstClaims(rawPackage.fullNarrationText, claimSet);

    // 8. Second-by-Second Retention Curve Simulation
    const retentionSim = await simulateSecondBySecondRetention(rawPackage.hook, rawPackage.body, rawPackage.cta, opportunity.targetDurationSec);

    // 9. Red-Team Adversary Attack
    const adversary = await runRedTeamAdversary(rawPackage.selectedTitle, rawPackage.hook, rawPackage.body, rawPackage.cta);

    // 10. Persist into Database RenderJob
    const job = await prisma.renderJob.create({
      data: {
        status: 'SCRIPTED',
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
      stage: 'READY_FOR_RENDER_DISPATCH',
      topicSelected: selectedTopic,
      niche: selectedNiche,
      evidenceClaimsCount: claimSet.claims.length,
      banditStrategy: bandit.selectedStrategy,
      isExploration: bandit.isExploration,
      adversaryGrade: adversary.hookVelocityGrade,
      predictedAPV: retentionSim.averagePercentageViewed,
      criticScore: rawPackage.rubric.overallScore,
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
        retentionSim
      }
    };

  } catch (error: any) {
    recordCircuitFailure(error.message || 'Pipeline execution failure');
    return {
      success: false,
      trace: {
        runId,
        timestamp: new Date().toISOString(),
        stage: 'FAILED',
        topicSelected: 'Unknown',
        niche: 'Unknown',
        evidenceClaimsCount: 0,
        banditStrategy: 'NONE',
        isExploration: false,
        adversaryGrade: 'F',
        predictedAPV: '0%',
        criticScore: 0,
        circuitStatus: getCircuitStatus().status,
        executionTimeMs: Date.now() - startTime
      },
      error: error.message || 'Unknown orchestrator error'
    };
  }
}
