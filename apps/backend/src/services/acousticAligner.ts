/**
 * SIMPLYYTR 2.0 — Acoustic Subtitle Alignment Service
 * 
 * Replaces linear mathematical word-duration estimations with locally computed,
 * audio-grounded word timestamps extracted via offline faster-whisper and reconciled
 * against canonical script text.
 * 
 * Safety & Design Principles:
 * 1. 100% Offline: Local faster-whisper ONNX/CTranslate2 INT8 model (zero network calls, $0.00 spend).
 * 2. Exact Script Preservation: Aligns timestamps to the author's original script tokens,
 *    preserving punctuation, capitalization, numbers, and contractions.
 * 3. Graceful Fallback: If Python, faster-whisper, or the model is missing/unavailable,
 *    transparently falls back to linear estimated timing and marks `isAcoustic: false`.
 * 4. Acoustic Truth & Diagnostics: Never marks estimated timestamps as acoustic; records
 *    telemetry (matchRate, alignedWords, rtf, method).
 * 5. Monotonic & Safe: Guarantees non-negative, non-inverting, bounded timestamps.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { KineticCaptionCue } from './editDecisionPlan';

export interface AlignedWord {
  word: string;
  start: number;
  end: number;
  matched: boolean;
  confidence?: number;
}

export interface AcousticAlignmentResult {
  success: boolean;
  method: 'ACOUSTIC_WHISPER_RECONCILED' | 'ESTIMATED_LINEAR';
  isAcoustic: boolean;
  model?: string;
  audioDurationSec: number;
  alignmentDurationSec?: number;
  realTimeFactor?: number;
  totalScriptWords: number;
  matchedWords: number;
  interpolatedWords: number;
  matchRate: number;
  words: AlignedWord[];
  error?: string;
  diagnostic?: string;
}

export interface AlignCaptionsOptions {
  audioPath: string;
  scriptText: string;
  pythonBin?: string;
  modelPath?: string;
  timeoutMs?: number;
  fallbackToLinear?: boolean;
}

/**
 * Resolves the Python executable to run faster-whisper.
 */
export function resolveWhisperPythonBin(overrideBin?: string): string {
  if (overrideBin) {
    return overrideBin;
  }
  if (process.env.WHISPER_PYTHON_BIN && fs.existsSync(process.env.WHISPER_PYTHON_BIN)) {
    return process.env.WHISPER_PYTHON_BIN;
  }
  if (process.env.KOKORO_PYTHON_BIN && fs.existsSync(process.env.KOKORO_PYTHON_BIN)) {
    return process.env.KOKORO_PYTHON_BIN;
  }

  // Local dedicated virtualenv check
  const candidateVenvs = [
    path.resolve(process.cwd(), 'scratch/test_kokoro_venv/Scripts/python.exe'),
    path.resolve(process.cwd(), 'scratch/test_kokoro_venv/bin/python'),
    path.resolve(process.cwd(), '.venv/Scripts/python.exe'),
    path.resolve(process.cwd(), '.venv/bin/python'),
    path.resolve(process.cwd(), 'local_tools/whisper/venv/Scripts/python.exe')
  ];

  for (const c of candidateVenvs) {
    if (fs.existsSync(c)) {
      return c;
    }
  }

  return process.platform === 'win32' ? 'python' : 'python3';
}

/**
 * Resolves the acoustic aligner Python runner script.
 */
export function resolveAcousticAlignerRunnerPath(): string {
  const candidate = path.resolve(process.cwd(), 'local_tools/subtitles/acoustic_aligner.py');
  if (fs.existsSync(candidate)) {
    return candidate;
  }
  throw new Error(`ACOUSTIC_ALIGNER_RUNNER_NOT_FOUND: ${candidate}`);
}

/**
 * Executes acoustic word alignment by invoking the local Python runner via child_process.spawn.
 */
export async function alignNarrationAcoustically(
  options: AlignCaptionsOptions
): Promise<AcousticAlignmentResult> {
  const {
    audioPath,
    scriptText,
    pythonBin: requestedPython,
    modelPath,
    timeoutMs = 60000
  } = options;

  if (!fs.existsSync(audioPath)) {
    return {
      success: false,
      method: 'ESTIMATED_LINEAR',
      isAcoustic: false,
      audioDurationSec: 0,
      totalScriptWords: 0,
      matchedWords: 0,
      interpolatedWords: 0,
      matchRate: 0,
      words: [],
      error: `Audio file does not exist: ${audioPath}`,
      diagnostic: 'AUDIO_FILE_MISSING'
    };
  }

  if (!scriptText || !scriptText.trim()) {
    return {
      success: false,
      method: 'ESTIMATED_LINEAR',
      isAcoustic: false,
      audioDurationSec: 0,
      totalScriptWords: 0,
      matchedWords: 0,
      interpolatedWords: 0,
      matchRate: 0,
      words: [],
      error: 'Script text is empty.',
      diagnostic: 'EMPTY_SCRIPT'
    };
  }

  let runnerPath: string;
  try {
    runnerPath = resolveAcousticAlignerRunnerPath();
  } catch (err: any) {
    return {
      success: false,
      method: 'ESTIMATED_LINEAR',
      isAcoustic: false,
      audioDurationSec: 0,
      totalScriptWords: 0,
      matchedWords: 0,
      interpolatedWords: 0,
      matchRate: 0,
      words: [],
      error: err.message,
      diagnostic: 'ALIGNER_RUNNER_MISSING'
    };
  }

  const pythonExecutable = resolveWhisperPythonBin(requestedPython);
  const args = [runnerPath, '--audio', path.resolve(audioPath)];
  if (modelPath) {
    args.push('--model-path', path.resolve(modelPath));
  }

  return new Promise((resolve) => {
    let stdoutData = '';
    let stderrData = '';
    let timedOut = false;

    const child = spawn(pythonExecutable, args, {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGKILL');
      } catch {
        // Process may already have terminated
      }
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString('utf-8');
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString('utf-8');
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        success: false,
        method: 'ESTIMATED_LINEAR',
        isAcoustic: false,
        audioDurationSec: 0,
        totalScriptWords: 0,
        matchedWords: 0,
        interpolatedWords: 0,
        matchRate: 0,
        words: [],
        error: `Failed to spawn Python process: ${err.message}`,
        diagnostic: 'PYTHON_SPAWN_FAILED'
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);

      if (timedOut) {
        return resolve({
          success: false,
          method: 'ESTIMATED_LINEAR',
          isAcoustic: false,
          audioDurationSec: 0,
          totalScriptWords: 0,
          matchedWords: 0,
          interpolatedWords: 0,
          matchRate: 0,
          words: [],
          error: `Acoustic aligner timed out after ${timeoutMs}ms`,
          diagnostic: 'TIMEOUT'
        });
      }

      if (code !== 0) {
        const cleanErr = stderrData.replace(/([A-Za-z0-9+/=]{32,})/g, '[REDACTED]').trim();
        return resolve({
          success: false,
          method: 'ESTIMATED_LINEAR',
          isAcoustic: false,
          audioDurationSec: 0,
          totalScriptWords: 0,
          matchedWords: 0,
          interpolatedWords: 0,
          matchRate: 0,
          words: [],
          error: `Acoustic aligner exited with code ${code}: ${cleanErr || 'Unknown error'}`,
          diagnostic: 'PROCESS_EXIT_NONZERO'
        });
      }

      try {
        const parsed = JSON.parse(stdoutData.trim());
        if (!parsed.success) {
          return resolve({
            success: false,
            method: 'ESTIMATED_LINEAR',
            isAcoustic: false,
            audioDurationSec: parsed.audioDurationSec || 0,
            totalScriptWords: 0,
            matchedWords: 0,
            interpolatedWords: 0,
            matchRate: 0,
            words: [],
            error: parsed.error || 'Acoustic alignment unsuccessful',
            diagnostic: 'ALIGNMENT_INTERNAL_FAILURE'
          });
        }

        resolve({
          success: true,
          method: 'ACOUSTIC_WHISPER_RECONCILED',
          isAcoustic: true,
          model: parsed.model || 'Systran/faster-whisper-tiny.en',
          audioDurationSec: parsed.audioDurationSec,
          alignmentDurationSec: parsed.alignmentDurationSec,
          realTimeFactor: parsed.realTimeFactor,
          totalScriptWords: parsed.totalScriptWords,
          matchedWords: parsed.matchedWords,
          interpolatedWords: parsed.interpolatedWords,
          matchRate: parsed.matchRate,
          words: parsed.words || []
        });
      } catch (parseErr: any) {
        resolve({
          success: false,
          method: 'ESTIMATED_LINEAR',
          isAcoustic: false,
          audioDurationSec: 0,
          totalScriptWords: 0,
          matchedWords: 0,
          interpolatedWords: 0,
          matchRate: 0,
          words: [],
          error: `Failed to parse aligner JSON output: ${parseErr.message}`,
          diagnostic: 'MALFORMED_OUTPUT'
        });
      }
    });

    // Stream script text to stdin
    try {
      child.stdin.write(scriptText, 'utf-8');
      child.stdin.end();
    } catch {
      // stdin may have closed early on immediate process error
    }
  });
}

/**
 * Converts seconds to ASS timestamp format: H:MM:SS.cs
 */
export function toAssTimestamp(sec: number): string {
  const safeSec = Math.max(0, sec);
  const h = Math.floor(safeSec / 3600);
  const m = Math.floor((safeSec % 3600) / 60);
  const s = Math.floor(safeSec % 60);
  const cs = Math.floor(Math.round((safeSec % 1) * 100));
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/**
 * Groups aligned words into natural rhythmic kinetic subtitle phrases (typically 3-5 words).
 * Splits at punctuation marks and natural acoustic pauses (> 0.35s gap between words).
 */
export function groupAlignedWordsIntoCues(
  words: AlignedWord[],
  options?: {
    maxWordsPerCue?: number;
    pauseThresholdSec?: number;
    totalDurationSec?: number;
  }
): KineticCaptionCue[] {
  if (!words || words.length === 0) return [];

  const maxWords = options?.maxWordsPerCue || 4;
  const pauseThreshold = options?.pauseThresholdSec || 0.35;
  const totalDuration = options?.totalDurationSec || words[words.length - 1].end;

  const phrases: AlignedWord[][] = [];
  let current: AlignedWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    current.push(w);
    const next = words[i + 1];

    const endsWithPunct = /[,.!?;:]$/.test(w.word);
    const isAcousticPause = next ? (next.start - w.end > pauseThreshold) : false;
    const reachedWordLimit = current.length >= maxWords;

    if (!next || isAcousticPause || (endsWithPunct && current.length >= 2) || reachedWordLimit) {
      phrases.push([...current]);
      current = [];
    }
  }

  if (current.length > 0) {
    phrases.push(current);
  }

  const cues: KineticCaptionCue[] = [];

  phrases.forEach((phrase, idx) => {
    const rawStart = phrase[0].start;
    const startTime = Math.min(totalDuration, Math.max(0, rawStart));
    const lastWord = phrase[phrase.length - 1];
    const rawEnd = Math.max(startTime + 0.1, lastWord.end);
    const naturalEnd = rawEnd + 0.15;
    const nextPhrase = phrases[idx + 1];

    // Cue end extends slightly for natural readability, but is bounded by the next phrase start and totalDuration
    const rawCalculatedEnd = nextPhrase
      ? Math.min(naturalEnd, Math.max(startTime + 0.5, Math.max(0, nextPhrase[0].start)))
      : Math.min(totalDuration, Math.max(startTime + 0.5, naturalEnd + 0.2));
    const endTime = Math.min(totalDuration, Math.max(startTime, rawCalculatedEnd));

    const phraseText = phrase.map((w) => w.word).join(' ');

    // Highlight key topic keywords in gold
    const highlights = phrase
      .map((w) => w.word.replace(/[^\w]/g, ''))
      .filter((w) =>
        /corner|square|crack|stress|pressure|comet|curve|balloon|danger|safe|bleed|rupture|fatigue|doubler|inquiry|screen|cleaner|liquid|display|spray|cloth|glass/i.test(w)
      );

    const style = idx === 0
      ? 'HOOK'
      : idx === phrases.length - 1
        ? 'CALL_TO_ACTION'
        : 'BODY';

    cues.push({
      id: `cue-aligned-${idx}`,
      startTime: parseFloat(startTime.toFixed(2)),
      endTime: parseFloat(Math.max(startTime + 0.2, endTime).toFixed(2)),
      text: phraseText,
      highlightWords: highlights,
      style,
      isAcoustic: true,
      wordTimestamps: phrase.map((w) => ({
        word: w.word,
        start: Math.max(0, w.start),
        end: Math.max(Math.max(0, w.start) + 0.05, w.end),
        confidence: w.confidence
      }))
    });
  });

  return cues;
}

/**
 * Deterministic fallback generator for estimated captions when acoustic alignment is unavailable.
 */
export function generateEstimatedKineticCaptions(
  scriptText: string,
  totalDurationSec: number,
  segments?: Array<{ text: string }>
): KineticCaptionCue[] {
  const cues: KineticCaptionCue[] = [];
  const rawSegments = segments && segments.length > 0
    ? segments
    : scriptText.split(/[.!?]+/).map((s) => ({ text: s.trim() })).filter((s) => s.text.length > 0);

  if (rawSegments.length === 0) return [];

  const totalDur = Math.max(totalDurationSec, 5.0);
  let currentCapTime = 0.2;
  const capSegmentDur = (totalDur - 0.5) / rawSegments.length;

  rawSegments.forEach((seg, idx) => {
    const text = seg.text || '';
    const words = text.split(/\s+/).filter(Boolean);
    const chunkSize = 4;

    for (let c = 0; c < words.length; c += chunkSize) {
      const chunkWords = words.slice(c, c + chunkSize);
      const cueDuration = Math.max(1.1, (capSegmentDur * chunkWords.length) / Math.max(words.length, 1));
      const endCapTime = Math.min(totalDur - 0.2, currentCapTime + cueDuration);

      const highlights = chunkWords
        .map((w) => w.replace(/[^\w]/g, ''))
        .filter((w) =>
          /corner|square|crack|stress|pressure|comet|curve|balloon|danger|safe|bleed|rupture|fatigue|doubler|inquiry|screen|cleaner|liquid|display|spray|cloth|glass/i.test(w)
        );

      cues.push({
        id: `cue-est-${idx}-${c}`,
        startTime: parseFloat(currentCapTime.toFixed(2)),
        endTime: parseFloat(endCapTime.toFixed(2)),
        text: chunkWords.join(' '),
        highlightWords: highlights,
        style: idx === 0 ? 'HOOK' : idx === rawSegments.length - 1 ? 'CALL_TO_ACTION' : 'BODY',
        isAcoustic: false
      });

      currentCapTime = endCapTime;
    }
  });

  return cues;
}

/**
 * High-level orchestrator: attempts acoustic alignment on audio WAV and falls back to
 * linear estimation if alignment fails or is disabled.
 */
export async function generateAcousticKineticCaptions(
  audioPath: string,
  scriptText: string,
  totalDurationSec: number,
  options?: {
    pythonBin?: string;
    modelPath?: string;
    segments?: Array<{ text: string }>;
  }
): Promise<{
  captions: KineticCaptionCue[];
  alignment: AcousticAlignmentResult;
}> {
  const alignment = await alignNarrationAcoustically({
    audioPath,
    scriptText,
    pythonBin: options?.pythonBin,
    modelPath: options?.modelPath
  });

  if (alignment.success && alignment.matchRate >= 0.50 && alignment.words.length > 0) {
    const cues = groupAlignedWordsIntoCues(alignment.words, {
      totalDurationSec
    });
    return {
      captions: cues,
      alignment
    };
  }

  // Graceful fallback to estimated linear captions
  const fallbackCues = generateEstimatedKineticCaptions(
    scriptText,
    totalDurationSec,
    options?.segments
  );

  return {
    captions: fallbackCues,
    alignment: {
      ...alignment,
      success: false,
      method: 'ESTIMATED_LINEAR',
      isAcoustic: false,
      diagnostic: alignment.diagnostic || 'FALLBACK_TO_ESTIMATED'
    }
  };
}

/**
 * Builds kinetic ASS subtitle file from caption cues.
 * Supports keyword highlighting and safe-zone margin (MarginV=240 for 9:16 Shorts).
 */
export function buildKineticAssSubtitles(
  captions: KineticCaptionCue[],
  outAssPath: string,
  options?: {
    fontFamily?: string;
    marginV?: number;
  }
): string {
  const fontFamily = options?.fontFamily || (process.platform === 'win32' ? 'Segoe UI' : 'DejaVu Sans');
  const marginV = options?.marginV || 240;

  const events = captions.map((cue) => {
    let formattedText = cue.text;
    if (cue.highlightWords && cue.highlightWords.length > 0) {
      for (const word of cue.highlightWords) {
        const regex = new RegExp(`\\b(${word})\\b`, 'gi');
        formattedText = formattedText.replace(regex, '{\\c&H0000FFFF&}$1{\\c&H00FFFFFF&}');
      }
    }
    const cleanText = formattedText.replace(/[\r\n]+/g, ' ');
    const styleName = cue.style === 'HOOK' ? 'HookStyle' : cue.style === 'CALL_TO_ACTION' ? 'CtaStyle' : 'BodyStyle';
    return `Dialogue: 0,${toAssTimestamp(cue.startTime)},${toAssTimestamp(cue.endTime)},${styleName},,0,0,0,,${cleanText}`;
  }).join('\n');

  const assContent = `[Script Info]
Title: SIMPLYYTR 2.0 Kinetic Story Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: HookStyle,${fontFamily},44,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,4,2,2,80,80,${marginV},1
Style: BodyStyle,${fontFamily},42,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,4,2,2,80,80,${marginV},1
Style: CtaStyle,${fontFamily},42,&H0038BDF8,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,4,2,2,80,80,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events}
`;

  const outDir = path.dirname(outAssPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outAssPath, assContent, 'utf-8');
  return outAssPath;
}
