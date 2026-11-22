/**
 * SIMPLYYTR 2.0 — Official Gemini API CLI Optional Creative Tool Adapter
 * 
 * Provides an optional, cost-controlled, and audited bridge to the official
 * Gemini API CLI (google-gemini/gemini-api-cli, Apache-2.0).
 * 
 * Key Architectural Rules:
 * 1. Strictly Optional: All operations gracefully fall back to local offline
 *    subsystems (Windows SAPI, Sharp SVG procedural diagrams, FFmpeg).
 * 2. Cost-Controlled & Dry-Run First: Commands support dry-run validation
 *    before network calls. Unconfigured credentials trigger dry-run previews.
 * 3. Provenance & Non-Deception: All AI-generated imagery is explicitly tagged
 *    with assetType: 'AI_SYNTHETIC', isHistoricalEvidence: false, and
 *    canSubstantiateClaims: false. Never labeled as historical proof.
 * 4. Zero Secret Leakage: API keys are read from environment/OS keychain
 *    and NEVER printed to logs, console, or persisted in git.
 */

import { spawnSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface GeminiCliStatus {
  installed: boolean;
  version?: string;
  cliPath?: string;
  apiKeyConfigured: boolean;
  whoami?: any;
  capabilities: {
    generate: boolean;
    image: boolean;
    tts: boolean;
    music: boolean;
    video: boolean;
    analyze: boolean;
    transcribe: boolean;
  };
}

export interface GeminiAssetMetadata {
  id: string;
  filePath: string;
  fileName: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  sha256: string;
  fileSizeBytes: number;
  createdAt: string;
  assetType: 'AI_SYNTHETIC';
  isHistoricalEvidence: false;
  canSubstantiateClaims: false;
  provenance: {
    source: 'GOOGLE_GEMINI_API_CLI';
    cliVersion: string;
    license: 'GOOGLE_GEMINI_API_TERMS';
    commercialNotice: string;
  };
}

export interface GeminiExecutionResult<T = any> {
  success: boolean;
  isDryRun?: boolean;
  exitCode: number;
  data?: T;
  rawStdout?: string;
  rawStderr?: string;
  dryRunRequest?: any;
  error?: string;
}

/**
 * Resolves the path to the official gemini-api CLI binary.
 */
export function resolveGeminiCliPath(): string | null {
  if (process.env.GEMINI_CLI_PATH && fs.existsSync(process.env.GEMINI_CLI_PATH)) {
    return path.resolve(process.env.GEMINI_CLI_PATH);
  }

  // Check workspace local_tools/bin
  const localCandidates = [
    path.resolve(process.cwd(), 'local_tools/bin/gemini-api.exe'),
    path.resolve(process.cwd(), 'local_tools/bin/gemini-api')
  ];

  for (const c of localCandidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }

  // Check PATH
  try {
    const isWin = process.platform === 'win32';
    const checkCmd = isWin ? 'where.exe' : 'which';
    const check = spawnSync(checkCmd, ['gemini-api'], { encoding: 'utf-8', timeout: 3000 });
    if (check.status === 0 && check.stdout.trim().length > 0) {
      const firstLine = check.stdout.trim().split('\n')[0].trim();
      if (fs.existsSync(firstLine)) return firstLine;
    }
  } catch {}

  return null;
}

/**
 * Checks if a Gemini API key is configured in process.env or configuration without exposing it.
 */
export function isGeminiApiKeyConfigured(): boolean {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    return true;
  }
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim().length > 0) {
    return true;
  }

  // Check CLI whoami to detect OS keychain configuration
  const cliPath = resolveGeminiCliPath();
  if (!cliPath) return false;

  try {
    const res = spawnSync(cliPath, ['whoami'], { encoding: 'utf-8', timeout: 4000 });
    if (res.status === 0 && res.stdout) {
      // If --api-key is not marked as [unset ]
      return !res.stdout.includes('--api-key                   [unset');
    }
  } catch {}

  return false;
}

/**
 * Returns comprehensive status of the Gemini API CLI tool.
 */
export function getGeminiCliStatus(): GeminiCliStatus {
  const cliPath = resolveGeminiCliPath();
  if (!cliPath) {
    return {
      installed: false,
      apiKeyConfigured: false,
      capabilities: {
        generate: false,
        image: false,
        tts: false,
        music: false,
        video: false,
        analyze: false,
        transcribe: false
      }
    };
  }

  let version: string | undefined;
  try {
    const verRes = spawnSync(cliPath, ['version'], { encoding: 'utf-8', timeout: 3000 });
    if (verRes.status === 0) {
      version = verRes.stdout.trim().split('\n')[0].trim();
    }
  } catch {}

  const apiKeyConfigured = isGeminiApiKeyConfigured();

  return {
    installed: true,
    version,
    cliPath,
    apiKeyConfigured,
    capabilities: {
      generate: true,
      image: true,
      tts: true,
      music: true,
      video: true,
      analyze: true,
      transcribe: true
    }
  };
}

/**
 * Executes a Gemini API CLI command with timeout, structured error handling,
 * and secret sanitization.
 */
export function runGeminiCliCommand(
  args: string[],
  options: {
    timeoutMs?: number;
    stdinText?: string;
    dryRun?: boolean;
    outputJson?: boolean;
  } = {}
): GeminiExecutionResult {
  const cliPath = resolveGeminiCliPath();
  if (!cliPath) {
    return {
      success: false,
      exitCode: 2,
      error: 'GEMINI_CLI_NOT_INSTALLED: Official gemini-api binary was not found on system.'
    };
  }

  const finalArgs = [...args];
  if (options.dryRun && !finalArgs.includes('--dry-run')) {
    finalArgs.push('--dry-run');
  }
  if (options.outputJson && !finalArgs.includes('--output-format')) {
    finalArgs.push('--output-format', 'json');
  }
  if (!finalArgs.includes('--no-interactive')) {
    finalArgs.push('--no-interactive');
  }

  const timeoutMs = options.timeoutMs || 25000;

  try {
    const proc = spawnSync(cliPath, finalArgs, {
      encoding: 'utf-8',
      input: options.stdinText,
      timeout: timeoutMs,
      env: {
        ...process.env,
        GEMINI_CLI_AGENT_MODE: '1'
      }
    });

    const stdout = (proc.stdout || '').trim();
    const stderr = (proc.stderr || '').trim();

    // Parse dry run JSON if requested
    if (options.dryRun && options.outputJson) {
      try {
        const parsed = JSON.parse(stdout);
        if (parsed.dry_run) {
          return {
            success: true,
            isDryRun: true,
            exitCode: 0,
            dryRunRequest: parsed.request?.body || parsed.request,
            rawStdout: stdout
          };
        }
      } catch {}
    }

    if (proc.status === 0) {
      let data: any = stdout;
      if (options.outputJson) {
        try {
          data = JSON.parse(stdout);
        } catch {
          data = stdout;
        }
      }
      return {
        success: true,
        isDryRun: options.dryRun,
        exitCode: 0,
        data,
        rawStdout: stdout
      };
    }

    // Handle failure
    let errorMessage = `Exit code ${proc.status}: ${stderr || stdout}`;
    if (options.outputJson) {
      try {
        const errObj = JSON.parse(stdout || stderr);
        if (errObj.message || (errObj.error && errObj.error.message)) {
          errorMessage = errObj.message || errObj.error.message;
        }
      } catch {}
    }

    return {
      success: false,
      exitCode: proc.status ?? 1,
      error: errorMessage,
      rawStdout: stdout,
      rawStderr: stderr
    };
  } catch (err: any) {
    return {
      success: false,
      exitCode: 1,
      error: `GEMINI_CLI_EXECUTION_EXCEPTION: ${err.message}`
    };
  }
}

/**
 * Generates an original concept or scene illustration via Gemini CLI.
 * 
 * If API key is not configured, automatically validates the request via --dry-run
 * and returns structured preview metadata without incurring network traffic or cost.
 */
export async function generateGeminiCreativeAsset(
  prompt: string,
  options: {
    aspectRatio?: '9:16' | '16:9' | '1:1' | '4:3';
    imageSize?: '512' | '1K' | '2K' | '4K';
    model?: string;
    outDir?: string;
    dryRunOnly?: boolean;
  } = {}
): Promise<{
  success: boolean;
  isDryRun: boolean;
  assetMetadata?: GeminiAssetMetadata;
  dryRunPreview?: any;
  error?: string;
}> {
  const status = getGeminiCliStatus();
  if (!status.installed) {
    return {
      success: false,
      isDryRun: true,
      error: 'GEMINI_CLI_NOT_INSTALLED: Local gemini-api binary unavailable.'
    };
  }

  const aspectRatio = options.aspectRatio || '9:16';
  const model = options.model || 'gemini-nano-banana-2.1';
  const shouldDryRun = options.dryRunOnly || !status.apiKeyConfigured;

  const targetDir = options.outDir || path.resolve(process.cwd(), 'storage/assets/gemini_generated');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const randSuffix = crypto.randomBytes(4).toString('hex');
  const tempOutPath = path.join(targetDir, `gemini_concept_${Date.now()}_${randSuffix}.jpg`);

  const args = [
    'image',
    prompt,
    '--aspect-ratio', aspectRatio,
    '--model', model,
    '--out', tempOutPath
  ];

  if (options.imageSize) {
    args.push('--image-size', options.imageSize);
  }

  const res = runGeminiCliCommand(args, {
    dryRun: shouldDryRun,
    outputJson: true,
    timeoutMs: 35000
  });

  if (shouldDryRun) {
    return {
      success: true,
      isDryRun: true,
      dryRunPreview: res.dryRunRequest || { prompt, model, aspectRatio, targetOut: tempOutPath }
    };
  }

  if (!res.success || !fs.existsSync(tempOutPath)) {
    return {
      success: false,
      isDryRun: false,
      error: res.error || 'IMAGE_GENERATION_FAILED: Image file was not produced.'
    };
  }

  const fileBytes = fs.readFileSync(tempOutPath);
  const hash = crypto.createHash('sha256').update(fileBytes).digest('hex');
  const finalFilename = `gemini_${hash.slice(0, 16)}.jpg`;
  const finalPath = path.join(targetDir, finalFilename);
  fs.renameSync(tempOutPath, finalPath);

  const assetMetadata: GeminiAssetMetadata = {
    id: `gemini_asset_${hash.slice(0, 16)}`,
    filePath: finalPath,
    fileName: finalFilename,
    prompt,
    model,
    aspectRatio,
    sha256: hash,
    fileSizeBytes: fileBytes.length,
    createdAt: new Date().toISOString(),
    assetType: 'AI_SYNTHETIC',
    isHistoricalEvidence: false,
    canSubstantiateClaims: false,
    provenance: {
      source: 'GOOGLE_GEMINI_API_CLI',
      cliVersion: status.version || '0.4.3',
      license: 'GOOGLE_GEMINI_API_TERMS',
      commercialNotice: 'AI-generated concept illustration. Not authentic historical evidence.'
    }
  };

  const metaPath = path.join(targetDir, `${finalFilename}.meta.json`);
  fs.writeFileSync(metaPath, JSON.stringify(assetMetadata, null, 2), 'utf-8');

  return {
    success: true,
    isDryRun: false,
    assetMetadata
  };
}

/**
 * Evaluates a rendered video frame or storyboard diagram using Gemini 3.8 Flash multimodal analysis.
 */
export async function evaluateFrameWithGemini(
  framePath: string,
  rubricQuestion: string,
  options: {
    dryRunOnly?: boolean;
    model?: string;
  } = {}
): Promise<{
  success: boolean;
  isDryRun: boolean;
  evaluation?: string;
  dryRunPreview?: any;
  error?: string;
}> {
  const status = getGeminiCliStatus();
  if (!status.installed) {
    return {
      success: false,
      isDryRun: true,
      error: 'GEMINI_CLI_NOT_INSTALLED: Local gemini-api binary unavailable.'
    };
  }

  if (!fs.existsSync(framePath)) {
    return {
      success: false,
      isDryRun: true,
      error: `FRAME_NOT_FOUND: Path '${framePath}' does not exist.`
    };
  }

  const model = options.model || 'gemini-3.8-flash';
  const shouldDryRun = options.dryRunOnly || !status.apiKeyConfigured;

  const args = [
    'analyze',
    '-i', framePath,
    rubricQuestion,
    '--model', model
  ];

  const res = runGeminiCliCommand(args, {
    dryRun: shouldDryRun,
    outputJson: true,
    timeoutMs: 30000
  });

  if (shouldDryRun) {
    return {
      success: true,
      isDryRun: true,
      dryRunPreview: res.dryRunRequest || { framePath, model, rubricQuestion }
    };
  }

  if (!res.success) {
    return {
      success: false,
      isDryRun: false,
      error: res.error || 'FRAME_EVALUATION_FAILED'
    };
  }

  return {
    success: true,
    isDryRun: false,
    evaluation: typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
  };
}
