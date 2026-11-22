/**
 * Canonical Cross-Platform Local TTS Engine for SIMPLYYTR 2.0
 * 
 * Provides authentic, high-integrity spoken narration across Windows and Linux:
 * 1. Windows Native SAPI (System.Speech.Synthesis) for 100% offline local generation on Windows.
 * 2. eSpeak NG (espeak-ng / espeak) for 100% offline, lightweight local generation on Linux.
 * 3. Piper TTS (piper) for 100% offline, fast neural voice synthesis on Linux when models are provided.
 * 4. Microsoft Edge Neural TTS (edge-tts) when installed and online generation is requested.
 * 
 * Enforces explicit availability detection, input text sanitization, output-path confinement,
 * audio header verification, and fail-closed actionable error reporting.
 */

import { spawnSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export type TtsEngineType = 'WINDOWS_SAPI' | 'EDGE_TTS' | 'PIPER' | 'ESPEAK_NG' | 'GEMINI_CLI' | 'KOKORO' | 'NONE';

export interface TtsResult {
  success: boolean;
  wavPath?: string;
  durationSec: number;
  engineUsed: TtsEngineType;
  voiceUsed: string;
  error?: string;
  sampleRate?: number;
  channels?: number;
  fallbackFrom?: TtsEngineType;
  fallbackReason?: string;
  telemetry?: {
    modelLoadSec?: number;
    synthesisSec?: number;
    realTimeFactor?: number;
    sampleRate?: number;
  };
}

export interface TtsProviderOptions {
  voiceName?: string;
  voiceGender?: string;
  speed?: number;
  engine?: string;
  targetPlatform?: string;
  fallbackOnFailure?: boolean;
}

export interface TtsProviderInfo {
  name: TtsEngineType;
  platform: 'win32' | 'linux' | 'darwin' | 'all';
  available: boolean;
  offline: boolean;
  license: string;
  description: string;
  installGuide: string;
}

export interface ITtsProvider {
  name: TtsEngineType;
  platform: 'win32' | 'linux' | 'darwin' | 'all';
  isAvailable(): boolean;
  getInfo(): TtsProviderInfo;
  synthesize(cleanText: string, outputWavPath: string, options?: TtsProviderOptions): TtsResult;
}

/**
 * Checks whether an executable command is discoverable and available on system PATH.
 */
export function isCommandAvailable(command: string): boolean {
  try {
    const isWin = process.platform === 'win32';
    const checkTool = isWin ? 'where' : 'which';
    const res = spawnSync(checkTool, [command], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 3000
    });
    return res.status === 0;
  } catch {
    return false;
  }
}

/**
 * Confines output path to prevent directory traversal outside permitted workspace directories.
 */
export function assertSafeOutputPath(filePath: string): string {
  const resolved = path.resolve(filePath);
  const cwd = process.cwd();
  const rel = path.relative(cwd, resolved);
  if (rel.startsWith('..') && !path.isAbsolute(rel)) {
    throw new Error(`TTS_PATH_CONFINEMENT_VIOLATION: Target path '${filePath}' traverses outside the workspace directory.`);
  }
  return resolved;
}

/**
 * Validates and normalizes script text before TTS synthesis.
 */
export function validateScriptText(text: string): { valid: boolean; cleanText: string; error?: string } {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      valid: false,
      cleanText: '',
      error: 'TTS_EMPTY_TEXT: Cannot synthesize speech for empty text.'
    };
  }
  if (text.length > 10000) {
    return {
      valid: false,
      cleanText: '',
      error: 'TTS_TEXT_TOO_LONG: Script exceeds 10,000 character maximum.'
    };
  }
  // Normalize whitespace and remove control characters
  const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  return { valid: true, cleanText };
}

/**
 * Probes the exact duration of an audio file in seconds via local FFmpeg.
 */
export function probeAudioDuration(filePath: string): number {
  try {
    const isWin = process.platform === 'win32';
    const binName = isWin ? 'ffmpeg.exe' : 'ffmpeg';
    const localToolsPath = path.resolve(process.cwd(), `local_tools/bin/${binName}`);
    const parentPath = path.resolve(process.cwd(), `../../local_tools/bin/${binName}`);
    let bin = 'ffmpeg';
    if (fs.existsSync(localToolsPath)) bin = localToolsPath;
    else if (fs.existsSync(parentPath)) bin = parentPath;

    const res = spawnSync(bin, ['-i', filePath], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000
    });
    const output = (res.stdout || '') + (res.stderr || '');
    const match = output.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
    if (match) {
      return parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseFloat(match[3]);
    }
  } catch {}
  return 5;
}

/**
 * Resolves the absolute path to ffmpeg binary, verifying availability before execution.
 * Supports Windows (ffmpeg.exe) and Linux/POSIX (ffmpeg).
 */
export function resolveFFmpegPath(): string {
  const envPath = process.env.FFMPEG_PATH;
  if (envPath !== undefined) {
    return envPath;
  }

  const isWin = process.platform === 'win32';
  const binName = isWin ? 'ffmpeg.exe' : 'ffmpeg';

  // Repository root relative tools
  const localToolsPath = path.resolve(process.cwd(), `local_tools/bin/${binName}`);
  if (fs.existsSync(localToolsPath)) {
    return localToolsPath;
  }

  // Root workspace tools if called from subdirectory
  const parentToolsPath = path.resolve(process.cwd(), `../../local_tools/bin/${binName}`);
  if (fs.existsSync(parentToolsPath)) {
    return parentToolsPath;
  }

  return 'ffmpeg';
}

/**
 * Resolves a reliable system font path for FFmpeg drawtext and ASS subtitles across OSes.
 */
export function resolveDefaultFontPath(): string {
  const isWin = process.platform === 'win32';
  if (isWin) {
    const candidates = [
      'C:/Windows/Fonts/segoeuib.ttf',
      'C:/Windows/Fonts/arialbd.ttf',
      'C:/Windows/Fonts/arial.ttf'
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        return c.replace(/:/g, '\\:');
      }
    }
    return 'C\\:/Windows/Fonts/segoeuib.ttf';
  } else {
    const candidates = [
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
      '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf'
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        return c;
      }
    }
    return '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  }
}

/**
 * Validates whether FFmpeg is genuinely executable.
 */
export async function verifyFFmpegAvailable(): Promise<{ available: boolean; version?: string; error?: string }> {
  const ffmpegPath = resolveFFmpegPath();
  return new Promise((resolve) => {
    try {
      const proc = spawn(ffmpegPath, ['-version']);
      let output = '';
      let errOutput = '';

      proc.stdout.on('data', (d: any) => { output += d.toString(); });
      proc.stderr.on('data', (d: any) => { errOutput += d.toString(); });

      proc.on('error', (err: any) => {
        resolve({ available: false, error: `FFmpeg binary not found or failed to spawn: ${err.message}` });
      });

      proc.on('close', (code: any) => {
        if (code === 0) {
          const firstLine = output.split('\n')[0] || '';
          resolve({ available: true, version: firstLine.trim() });
        } else {
          resolve({ available: false, error: `FFmpeg exited with code ${code}: ${errOutput}` });
        }
      });
    } catch (err: any) {
      resolve({ available: false, error: err.message });
    }
  });
}


/**
 * Verifies that a generated audio file exists, is non-empty, and contains a valid audio header.
 */
export function validateAudioFile(
  filePath: string,
  options: { expectedSampleRate?: number; expectedChannels?: number } = {}
): { valid: boolean; durationSec: number; sampleRate?: number; channels?: number; error?: string } {
  if (!fs.existsSync(filePath)) {
    return {
      valid: false,
      durationSec: 0,
      error: 'TTS_MISSING_AUDIO_OUTPUT: Audio file was not generated on disk.'
    };
  }

  const stat = fs.statSync(filePath);
  // WAV header is minimum 44 bytes; require at least 100 bytes for minimal playable audio
  if (stat.size < 100) {
    return {
      valid: false,
      durationSec: 0,
      error: `TTS_AUDIO_EMPTY: Audio file is empty or too small (${stat.size} bytes).`
    };
  }

  let sampleRate: number | undefined;
  let channels: number | undefined;

  try {
    const fd = fs.openSync(filePath, 'r');
    const headerBuffer = Buffer.alloc(44);
    const bytesRead = fs.readSync(fd, headerBuffer, 0, 44, 0);
    fs.closeSync(fd);

    const riff = headerBuffer.toString('ascii', 0, 4);
    const wave = headerBuffer.toString('ascii', 8, 12);
    const isWav = riff === 'RIFF' && wave === 'WAVE';
    const isMp3 = (headerBuffer[0] === 0x49 && headerBuffer[1] === 0x44 && headerBuffer[2] === 0x33) ||
                  (headerBuffer[0] === 0xFF && (headerBuffer[1] & 0xE0) === 0xE0);

    if (!isWav && !isMp3) {
      return {
        valid: false,
        durationSec: 0,
        error: 'TTS_INVALID_AUDIO_FORMAT: File does not contain a valid RIFF/WAVE or MP3 audio header.'
      };
    }

    if (isWav && bytesRead >= 44) {
      channels = headerBuffer.readUInt16LE(22);
      sampleRate = headerBuffer.readUInt32LE(24);

      if (options.expectedSampleRate && sampleRate !== options.expectedSampleRate) {
        return {
          valid: false,
          durationSec: 0,
          sampleRate,
          channels,
          error: `TTS_SAMPLE_RATE_MISMATCH: Expected sample rate ${options.expectedSampleRate} Hz, got ${sampleRate} Hz.`
        };
      }
      if (options.expectedChannels && channels !== options.expectedChannels) {
        return {
          valid: false,
          durationSec: 0,
          sampleRate,
          channels,
          error: `TTS_CHANNEL_MISMATCH: Expected ${options.expectedChannels} channel(s), got ${channels}.`
        };
      }
    }
  } catch (err: any) {
    return {
      valid: false,
      durationSec: 0,
      error: `TTS_AUDIO_HEADER_READ_FAILED: ${err.message}`
    };
  }

  const durationSec = probeAudioDuration(filePath);
  if (durationSec <= 0) {
    return {
      valid: false,
      durationSec: 0,
      error: 'TTS_INVALID_AUDIO_DURATION: Probed audio duration is 0 seconds.'
    };
  }

  return { valid: true, durationSec, sampleRate, channels };
}

// ─── Provider Implementations ────────────────────────────────────────────────

/**
 * Windows SAPI Provider (System.Speech.Synthesis)
 * 100% Offline, default on Windows.
 */
export class WindowsSapiProvider implements ITtsProvider {
  name: TtsEngineType = 'WINDOWS_SAPI';
  platform: 'win32' = 'win32';

  isAvailable(): boolean {
    return process.platform === 'win32' && isCommandAvailable('powershell.exe');
  }

  getInfo(): TtsProviderInfo {
    return {
      name: this.name,
      platform: this.platform,
      available: this.isAvailable(),
      offline: true,
      license: 'Proprietary (Microsoft Windows Component)',
      description: 'Windows native SpeechSynthesizer (.NET System.Speech). 100% offline, guaranteed on Windows.',
      installGuide: 'Included by default in Windows 10/11.'
    };
  }

  synthesize(cleanText: string, outputWavPath: string, options: TtsProviderOptions = {}): TtsResult {
    const isFemale = (options.voiceGender && options.voiceGender.toLowerCase() === 'female') ||
                     (options.voiceName && /female|zira|jenny|aria|neerja/i.test(options.voiceName));
    const sapiVoice = isFemale ? 'Microsoft Zira Desktop' : 'Microsoft David Desktop';

    const psScript = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
try {
  $synth.SelectVoice('${sapiVoice}')
} catch {
  # fallback to system default voice
}
$synth.SetOutputToWaveFile('${outputWavPath.replace(/\\/g, '\\\\')}')
$synth.Speak('${cleanText.replace(/'/g, "''")}')
$synth.Dispose()
`;

    try {
      const psRes = spawnSync('powershell.exe', ['-NoProfile', '-Command', psScript], {
        encoding: 'utf-8',
        timeout: 30000
      });

      if (psRes.status !== 0) {
        return {
          success: false,
          durationSec: 0,
          engineUsed: 'NONE',
          voiceUsed: sapiVoice,
          error: `TTS_SAPI_FAILED: PowerShell exited with code ${psRes.status}. ${(psRes.stderr || '').trim()}`
        };
      }

      const validation = validateAudioFile(outputWavPath);
      if (!validation.valid) {
        return {
          success: false,
          durationSec: 0,
          engineUsed: 'NONE',
          voiceUsed: sapiVoice,
          error: validation.error
        };
      }

      return {
        success: true,
        wavPath: outputWavPath,
        durationSec: validation.durationSec,
        sampleRate: validation.sampleRate,
        engineUsed: 'WINDOWS_SAPI',
        voiceUsed: sapiVoice
      };
    } catch (err: any) {
      return {
        success: false,
        durationSec: 0,
        engineUsed: 'NONE',
        voiceUsed: sapiVoice,
        error: `TTS_EXECUTION_ERROR: ${err.message}`
      };
    }
  }
}

/**
 * eSpeak NG Provider (Linux standard offline TTS)
 * 100% Offline, standard package on Ubuntu/Debian/Fedora/Arch.
 */
export class EspeakNgProvider implements ITtsProvider {
  name: TtsEngineType = 'ESPEAK_NG';
  platform: 'all' = 'all';

  private resolveBinary(): string | null {
    if (process.env.ESPEAK_PATH && fs.existsSync(process.env.ESPEAK_PATH)) {
      return process.env.ESPEAK_PATH;
    }
    if (isCommandAvailable('espeak-ng')) return 'espeak-ng';
    if (isCommandAvailable('espeak')) return 'espeak';
    return null;
  }

  isAvailable(): boolean {
    return this.resolveBinary() !== null;
  }

  getInfo(): TtsProviderInfo {
    return {
      name: this.name,
      platform: this.platform,
      available: this.isAvailable(),
      offline: true,
      license: 'GPL-3.0-or-later',
      description: 'Lightweight open-source multi-lingual software speech synthesizer for Linux and POSIX.',
      installGuide: 'Debian/Ubuntu: sudo apt-get install espeak-ng | Fedora: sudo dnf install espeak-ng | Arch: sudo pacman -S espeak-ng'
    };
  }

  synthesize(cleanText: string, outputWavPath: string, options: TtsProviderOptions = {}): TtsResult {
    const bin = this.resolveBinary();
    if (!bin) {
      return {
        success: false,
        durationSec: 0,
        engineUsed: 'NONE',
        voiceUsed: 'none',
        error: 'TTS_ESPEAK_UNAVAILABLE: Neither espeak-ng nor espeak is installed on this system.'
      };
    }

    const isFemale = (options.voiceGender && options.voiceGender.toLowerCase() === 'female') ||
                     (options.voiceName && /female|zira|jenny|aria|neerja/i.test(options.voiceName));
    const voice = isFemale ? 'en-us+f2' : 'en-us+m3';

    try {
      const res = spawnSync(bin, ['-v', voice, '-w', outputWavPath, cleanText], {
        encoding: 'utf-8',
        timeout: 30000
      });

      if (res.status !== 0) {
        return {
          success: false,
          durationSec: 0,
          engineUsed: 'NONE',
          voiceUsed: voice,
          error: `TTS_ESPEAK_FAILED: ${bin} exited with code ${res.status}. ${(res.stderr || '').trim()}`
        };
      }

      const validation = validateAudioFile(outputWavPath);
      if (!validation.valid) {
        return {
          success: false,
          durationSec: 0,
          engineUsed: 'NONE',
          voiceUsed: voice,
          error: validation.error
        };
      }

      return {
        success: true,
        wavPath: outputWavPath,
        durationSec: validation.durationSec,
        engineUsed: 'ESPEAK_NG',
        voiceUsed: voice
      };
    } catch (err: any) {
      return {
        success: false,
        durationSec: 0,
        engineUsed: 'NONE',
        voiceUsed: voice,
        error: `TTS_EXECUTION_ERROR: ${err.message}`
      };
    }
  }
}

/**
 * Piper TTS Provider (Local neural TTS for Linux)
 * 100% Offline when model file is present.
 */
export class PiperProvider implements ITtsProvider {
  name: TtsEngineType = 'PIPER';
  platform: 'all' = 'all';

  private resolveBinary(): string | null {
    if (process.env.PIPER_PATH && fs.existsSync(process.env.PIPER_PATH)) {
      return process.env.PIPER_PATH;
    }
    if (isCommandAvailable('piper')) return 'piper';
    return null;
  }

  isAvailable(): boolean {
    const hasBin = this.resolveBinary() !== null;
    const hasModel = Boolean(process.env.PIPER_MODEL_PATH && fs.existsSync(process.env.PIPER_MODEL_PATH));
    return hasBin && hasModel;
  }

  getInfo(): TtsProviderInfo {
    return {
      name: this.name,
      platform: this.platform,
      available: this.isAvailable(),
      offline: true,
      license: 'MIT License',
      description: 'Fast, local neural text-to-speech engine optimized for Linux and edge devices.',
      installGuide: 'Download binary from github.com/rhasspy/piper and set PIPER_PATH and PIPER_MODEL_PATH environment variables.'
    };
  }

  synthesize(cleanText: string, outputWavPath: string, options: TtsProviderOptions = {}): TtsResult {
    const bin = this.resolveBinary();
    const modelPath = process.env.PIPER_MODEL_PATH;

    if (!bin || !modelPath || !fs.existsSync(modelPath)) {
      return {
        success: false,
        durationSec: 0,
        engineUsed: 'NONE',
        voiceUsed: 'none',
        error: 'TTS_PIPER_UNAVAILABLE: Piper binary or PIPER_MODEL_PATH is missing.'
      };
    }

    try {
      const res = spawnSync(bin, ['--model', modelPath, '--output_file', outputWavPath], {
        input: cleanText,
        encoding: 'utf-8',
        timeout: 45000
      });

      if (res.status !== 0) {
        return {
          success: false,
          durationSec: 0,
          engineUsed: 'NONE',
          voiceUsed: path.basename(modelPath),
          error: `TTS_PIPER_FAILED: Piper exited with code ${res.status}. ${(res.stderr || '').trim()}`
        };
      }

      const validation = validateAudioFile(outputWavPath);
      if (!validation.valid) {
        return {
          success: false,
          durationSec: 0,
          engineUsed: 'NONE',
          voiceUsed: path.basename(modelPath),
          error: validation.error
        };
      }

      return {
        success: true,
        wavPath: outputWavPath,
        durationSec: validation.durationSec,
        engineUsed: 'PIPER',
        voiceUsed: path.basename(modelPath)
      };
    } catch (err: any) {
      return {
        success: false,
        durationSec: 0,
        engineUsed: 'NONE',
        voiceUsed: path.basename(modelPath || 'piper'),
        error: `TTS_EXECUTION_ERROR: ${err.message}`
      };
    }
  }
}

/**
 * Microsoft Edge Neural TTS Provider (edge-tts)
 * High quality neural voices; requires network connection.
 */
export class EdgeTtsProvider implements ITtsProvider {
  name: TtsEngineType = 'EDGE_TTS';
  platform: 'all' = 'all';

  private resolveBinary(): string | null {
    if (process.env.EDGE_TTS_PATH && fs.existsSync(process.env.EDGE_TTS_PATH)) {
      return process.env.EDGE_TTS_PATH;
    }
    if (isCommandAvailable('edge-tts')) return 'edge-tts';
    return null;
  }

  isAvailable(): boolean {
    return this.resolveBinary() !== null;
  }

  getInfo(): TtsProviderInfo {
    return {
      name: this.name,
      platform: this.platform,
      available: this.isAvailable(),
      offline: false,
      license: 'Microsoft Service Terms / MIT Client CLI',
      description: 'Python CLI accessing Microsoft Edge online neural voices. High quality, requires internet connection.',
      installGuide: 'Install via python pip: pip install edge-tts'
    };
  }

  synthesize(cleanText: string, outputWavPath: string, options: TtsProviderOptions = {}): TtsResult {
    const bin = this.resolveBinary();
    if (!bin) {
      return {
        success: false,
        durationSec: 0,
        engineUsed: 'NONE',
        voiceUsed: 'none',
        error: 'TTS_EDGE_UNAVAILABLE: edge-tts binary is not installed on this system.'
      };
    }

    const isFemale = (options.voiceGender && options.voiceGender.toLowerCase() === 'female') ||
                     (options.voiceName && /female|zira|jenny|aria|neerja/i.test(options.voiceName));
    const edgeVoice = isFemale ? 'en-US-JennyNeural' : 'en-US-GuyNeural';

    try {
      const res = spawnSync(bin, [
        '--voice', edgeVoice,
        '--text', cleanText,
        '--write-media', outputWavPath
      ], {
        encoding: 'utf-8',
        timeout: 30000
      });

      if (res.status !== 0) {
        return {
          success: false,
          durationSec: 0,
          engineUsed: 'NONE',
          voiceUsed: edgeVoice,
          error: `TTS_EDGE_FAILED: edge-tts exited with code ${res.status}. ${(res.stderr || '').trim()}`
        };
      }

      const validation = validateAudioFile(outputWavPath);
      if (!validation.valid) {
        return {
          success: false,
          durationSec: 0,
          engineUsed: 'NONE',
          voiceUsed: edgeVoice,
          error: validation.error
        };
      }

      return {
        success: true,
        wavPath: outputWavPath,
        durationSec: validation.durationSec,
        engineUsed: 'EDGE_TTS',
        voiceUsed: edgeVoice
      };
    } catch (err: any) {
      return {
        success: false,
        durationSec: 0,
        engineUsed: 'NONE',
        voiceUsed: edgeVoice,
        error: `TTS_EXECUTION_ERROR: ${err.message}`
      };
    }
  }
}

/**
 * Official Gemini API CLI Provider (google-gemini/gemini-api-cli, Apache 2.0).
 * Generates natural high-fidelity neural speech via gemini-3.8-flash-tts when API key is provided.
 */
export class GeminiCliTtsProvider implements ITtsProvider {
  name: TtsEngineType = 'GEMINI_CLI';
  platform: 'win32' | 'linux' | 'darwin' | 'all' = 'all';

  resolveBinary(): string | null {
    const localCandidates = [
      path.resolve(process.cwd(), 'local_tools/bin/gemini-api.exe'),
      path.resolve(process.cwd(), 'local_tools/bin/gemini-api')
    ];
    for (const c of localCandidates) {
      if (fs.existsSync(c)) return c;
    }
    if (isCommandAvailable('gemini-api')) return 'gemini-api';
    return null;
  }

  isAvailable(): boolean {
    const bin = this.resolveBinary();
    if (!bin) return false;
    return !!(
      (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) ||
      (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim().length > 0)
    );
  }

  getInfo(): TtsProviderInfo {
    return {
      name: this.name,
      platform: this.platform,
      available: this.isAvailable(),
      offline: false,
      license: 'Google Gemini API Terms / Apache-2.0 CLI',
      description: 'Official Gemini API CLI generating high-fidelity speech via gemini-3.8-flash-tts.',
      installGuide: 'Included in local_tools/bin. Set GEMINI_API_KEY in .env to activate.'
    };
  }

  synthesize(cleanText: string, outputWavPath: string, options: TtsProviderOptions = {}): TtsResult {
    const bin = this.resolveBinary();
    if (!bin) {
      return {
        success: false,
        durationSec: 0,
        engineUsed: 'NONE',
        voiceUsed: 'none',
        error: 'TTS_GEMINI_UNAVAILABLE: gemini-api binary is not installed.'
      };
    }

    const voice = options.voiceName || 'Kore';

    try {
      const res = spawnSync(bin, [
        'tts',
        cleanText,
        '--voice', voice,
        '--out', outputWavPath,
        '--no-interactive',
        '--output-format', 'json'
      ], {
        encoding: 'utf-8',
        timeout: 30000,
        env: {
          ...process.env,
          GEMINI_CLI_AGENT_MODE: '1'
        }
      });

      if (res.status !== 0) {
        return {
          success: false,
          durationSec: 0,
          engineUsed: 'NONE',
          voiceUsed: voice,
          error: `TTS_GEMINI_FAILED: gemini-api exited with code ${res.status}. ${(res.stderr || res.stdout || '').trim()}`
        };
      }

      const validation = validateAudioFile(outputWavPath);
      if (!validation.valid) {
        return {
          success: false,
          durationSec: 0,
          engineUsed: 'NONE',
          voiceUsed: voice,
          error: validation.error
        };
      }

      return {
        success: true,
        wavPath: outputWavPath,
        durationSec: validation.durationSec,
        engineUsed: 'GEMINI_CLI',
        voiceUsed: voice
      };
    } catch (err: any) {
      return {
        success: false,
        durationSec: 0,
        engineUsed: 'NONE',
        voiceUsed: voice,
        error: `TTS_EXECUTION_ERROR: ${err.message}`
      };
    }
  }
}

// ─── Kokoro-82M ONNX Provider ───────────────────────────────────────────────

/**
 * Kokoro-82M ONNX Provider (thewh1teagle/kokoro-onnx, Apache-2.0 / MIT).
 * Studio-grade, natural neural voice synthesis running 100% locally and offline on CPU (24kHz).
 * Supported voices:
 * - American Male: am_michael (default), am_adam
 * - American Female: af_bella (default female), af_nicole, af_sarah, af_sky, af
 * - British: bm_george, bm_lewis, bf_emma, bf_isabella
 */
export class KokoroTtsProvider implements ITtsProvider {
  name: TtsEngineType = 'KOKORO';
  platform: 'win32' | 'linux' | 'darwin' | 'all' = 'all';

  resolvePythonBinary(): string | null {
    if (process.env.KOKORO_PYTHON_BIN && fs.existsSync(process.env.KOKORO_PYTHON_BIN)) {
      return process.env.KOKORO_PYTHON_BIN;
    }
    if (process.env.PYTHON_BIN && fs.existsSync(process.env.PYTHON_BIN)) {
      return process.env.PYTHON_BIN;
    }

    const isWin = process.platform === 'win32';
    const pyRel = isWin ? 'Scripts/python.exe' : 'bin/python';
    const candidates = [
      path.resolve(process.cwd(), `scratch/test_kokoro_venv/${pyRel}`),
      path.resolve(process.cwd(), `../../scratch/test_kokoro_venv/${pyRel}`),
      path.resolve(process.cwd(), `.venv/${pyRel}`),
      path.resolve(process.cwd(), `../../.venv/${pyRel}`),
      path.resolve(process.cwd(), `local_tools/kokoro_venv/${pyRel}`),
      path.resolve(process.cwd(), `local_tools/python/${isWin ? 'python.exe' : 'bin/python'}`)
    ];

    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }

    if (isCommandAvailable('python3')) return 'python3';
    if (isCommandAvailable('python')) return 'python';

    return null;
  }

  resolveModelPath(): string | null {
    if (process.env.KOKORO_MODEL_PATH && fs.existsSync(process.env.KOKORO_MODEL_PATH)) {
      return process.env.KOKORO_MODEL_PATH;
    }
    const candidates = [
      path.resolve(process.cwd(), 'local_tools/kokoro/kokoro-v0_19.int8.onnx'),
      path.resolve(process.cwd(), '../../local_tools/kokoro/kokoro-v0_19.int8.onnx'),
      path.resolve(process.cwd(), 'local_tools/kokoro/kokoro-v0_19.onnx'),
      path.resolve(process.cwd(), '../../local_tools/kokoro/kokoro-v0_19.onnx')
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return null;
  }

  resolveVoicesPath(): string | null {
    if (process.env.KOKORO_VOICES_PATH && fs.existsSync(process.env.KOKORO_VOICES_PATH)) {
      return process.env.KOKORO_VOICES_PATH;
    }
    const candidates = [
      path.resolve(process.cwd(), 'local_tools/kokoro/voices.bin'),
      path.resolve(process.cwd(), '../../local_tools/kokoro/voices.bin')
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return null;
  }

  resolveRunnerScript(): string | null {
    const candidates = [
      path.resolve(process.cwd(), 'local_tools/kokoro/kokoro_tts_runner.py'),
      path.resolve(process.cwd(), '../../local_tools/kokoro/kokoro_tts_runner.py')
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return null;
  }

  isAvailable(): boolean {
    const py = this.resolvePythonBinary();
    const model = this.resolveModelPath();
    const voices = this.resolveVoicesPath();
    const runner = this.resolveRunnerScript();
    return !!(
      py &&
      model && fs.existsSync(model) &&
      voices && fs.existsSync(voices) &&
      runner && fs.existsSync(runner)
    );
  }

  getInfo(): TtsProviderInfo {
    return {
      name: this.name,
      platform: this.platform,
      available: this.isAvailable(),
      offline: true,
      license: 'Apache-2.0 (Model Weights) / MIT (kokoro-onnx inference engine)',
      description: 'Studio-grade local neural speech synthesis via Kokoro-82M ONNX. 100% offline, 24kHz audio.',
      installGuide: 'Requires local_tools/kokoro/kokoro-v0_19.int8.onnx and voices.bin with kokoro-onnx installed in python environment.'
    };
  }

  synthesize(cleanText: string, outputWavPath: string, options: TtsProviderOptions = {}): TtsResult {
    const py = this.resolvePythonBinary();
    const model = this.resolveModelPath();
    const voices = this.resolveVoicesPath();
    const runner = this.resolveRunnerScript();

    const missing: string[] = [];
    if (!py) missing.push('Python runtime');
    if (!model || !fs.existsSync(model)) missing.push('model weights');
    if (!voices || !fs.existsSync(voices)) missing.push('voices.bin');
    if (!runner || !fs.existsSync(runner)) missing.push('kokoro_tts_runner.py');

    if (missing.length > 0) {
      return {
        success: false,
        durationSec: 0,
        engineUsed: 'NONE',
        voiceUsed: 'none',
        error: `TTS_KOKORO_UNAVAILABLE: Kokoro neural TTS dependencies missing: ${missing.join(', ')}.`
      };
    }

    // Determine voice
    let voice = options.voiceName || 'am_michael';
    const isFemale = (options.voiceGender && options.voiceGender.toLowerCase() === 'female') ||
                     (options.voiceName && /female|zira|jenny|aria|bella|nicole|sarah|sky/i.test(options.voiceName));
    if (isFemale && !options.voiceName?.startsWith('af_')) {
      voice = 'af_bella';
    } else if (!options.voiceName || options.voiceName === 'Microsoft David Desktop' || options.voiceName === 'en-US-GuyNeural') {
      voice = 'am_michael';
    }

    const speed = options.speed || 1.0;

    try {
      const res = spawnSync(py!, [
        runner!,
        '--model', model!,
        '--voices', voices!,
        '--voice', voice,
        '--speed', String(speed),
        '--out', outputWavPath,
        '--stdin'
      ], {
        input: cleanText,
        encoding: 'utf-8',
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024
      });

      if (res.error) {
        if ((res.error as any).code === 'ETIMEDOUT') {
          return {
            success: false,
            durationSec: 0,
            engineUsed: 'KOKORO',
            voiceUsed: voice,
            error: 'TTS_KOKORO_TIMEOUT: Synthesis timed out after 60,000ms.'
          };
        }
        return {
          success: false,
          durationSec: 0,
          engineUsed: 'KOKORO',
          voiceUsed: voice,
          error: `TTS_KOKORO_SPAWN_ERROR: ${res.error.message}`
        };
      }

      if (res.status !== 0) {
        const rawErr = (res.stderr || res.stdout || '').trim();
        let parsedErr = rawErr;
        try {
          const jsonErr = JSON.parse(rawErr);
          if (jsonErr && jsonErr.error) parsedErr = jsonErr.error;
        } catch {}
        // Sanitize error string to prevent secret exposure
        const safeErr = parsedErr.replace(/[a-zA-Z0-9_\-]{32,}/g, '[REDACTED]').slice(0, 300);
        return {
          success: false,
          durationSec: 0,
          engineUsed: 'KOKORO',
          voiceUsed: voice,
          error: `TTS_KOKORO_FAILED: Exit code ${res.status}. ${safeErr}`
        };
      }

      // Parse JSON telemetry from runner stdout
      let runnerTelemetry: any = {};
      try {
        const lines = (res.stdout || '').trim().split('\n');
        const lastLine = lines[lines.length - 1];
        runnerTelemetry = JSON.parse(lastLine);
      } catch {}

      // Validate output WAV file with 24000 Hz sample rate check
      const validation = validateAudioFile(outputWavPath, { expectedSampleRate: 24000 });
      if (!validation.valid) {
        if (fs.existsSync(outputWavPath)) {
          try { fs.unlinkSync(outputWavPath); } catch {}
        }
        return {
          success: false,
          durationSec: 0,
          engineUsed: 'KOKORO',
          voiceUsed: voice,
          error: validation.error
        };
      }

      return {
        success: true,
        wavPath: outputWavPath,
        durationSec: validation.durationSec,
        engineUsed: 'KOKORO',
        voiceUsed: runnerTelemetry.voice || voice,
        sampleRate: validation.sampleRate,
        channels: validation.channels,
        telemetry: {
          modelLoadSec: runnerTelemetry.modelLoadSec,
          synthesisSec: runnerTelemetry.synthesisSec,
          realTimeFactor: runnerTelemetry.realTimeFactor,
          sampleRate: validation.sampleRate
        }
      };
    } catch (err: any) {
      if (fs.existsSync(outputWavPath)) {
        try { fs.unlinkSync(outputWavPath); } catch {}
      }
      return {
        success: false,
        durationSec: 0,
        engineUsed: 'KOKORO',
        voiceUsed: voice,
        error: `TTS_EXECUTION_ERROR: ${err.message}`
      };
    }
  }
}

// ─── Provider Registry & Selection ──────────────────────────────────────────

/**
 * Returns list of registered TTS providers configured for the environment.
 */
export function getAllTtsProviders(): ITtsProvider[] {
  return [
    new WindowsSapiProvider(),
    new EspeakNgProvider(),
    new PiperProvider(),
    new EdgeTtsProvider(),
    new GeminiCliTtsProvider(),
    new KokoroTtsProvider()
  ];
}

/**
 * Detects available TTS providers for the specified or current platform.
 */
export function getAvailableTtsProviders(targetPlatform: string = process.platform): ITtsProvider[] {
  // Only permit supported platforms
  if (!['win32', 'linux', 'darwin', 'all'].includes(targetPlatform)) {
    return [];
  }

  return getAllTtsProviders().filter(p => {
    if (p.platform !== 'all' && p.platform !== targetPlatform) {
      return false;
    }
    return p.isAvailable();
  });
}

/**
 * Returns detailed availability and licensing metadata for all providers.
 */
export function getTtsProvidersStatus(targetPlatform: string = process.platform): TtsProviderInfo[] {
  return getAllTtsProviders().map(p => {
    const info = p.getInfo();
    if (p.platform !== 'all' && p.platform !== targetPlatform) {
      return { ...info, available: false };
    }
    return info;
  });
}

/**
 * Selects the optimal TTS provider according to platform priority:
 * - Explicit preference match (via options.engine or env TTS_PROVIDER)
 * - On Windows: SAPI (100% offline default) -> edge-tts (if preferred)
 * - On Linux: Piper (offline neural) -> eSpeak NG (offline standard) -> edge-tts (online)
 * - Note: Kokoro is opt-in by design and is only selected when explicitly requested.
 */
export function selectTtsProvider(
  targetPlatform: string = process.platform,
  preferredEngineOrOptions?: string | { engine?: string }
): ITtsProvider | null {
  const available = getAvailableTtsProviders(targetPlatform);
  if (available.length === 0) {
    return null;
  }

  const preferredEngine = typeof preferredEngineOrOptions === 'object' && preferredEngineOrOptions !== null
    ? preferredEngineOrOptions.engine
    : preferredEngineOrOptions;

  // 1. Explicit preference match (preferredEngine or TTS_PROVIDER environment variable)
  const requestedEngine = preferredEngine || process.env.TTS_PROVIDER;
  if (requestedEngine) {
    const matched = available.find(p => p.name.toUpperCase() === requestedEngine.toUpperCase());
    if (matched) return matched;
  }

  // 2. Platform-specific priority (preserves existing production defaults)
  if (targetPlatform === 'win32') {
    const sapi = available.find(p => p.name === 'WINDOWS_SAPI');
    if (sapi) return sapi;
    const edge = available.find(p => p.name === 'EDGE_TTS');
    if (edge) return edge;
  } else if (targetPlatform === 'linux') {
    const piper = available.find(p => p.name === 'PIPER');
    if (piper) return piper;
    const espeak = available.find(p => p.name === 'ESPEAK_NG');
    if (espeak) return espeak;
    const edge = available.find(p => p.name === 'EDGE_TTS');
    if (edge) return edge;
  }

  return null;
}

// ─── Canonical Entry Point ──────────────────────────────────────────────────

/**
 * Synthesizes spoken speech from script text.
 * Enforces text validation, output path confinement, audio verification, and fail-closed error reporting.
 */
export function synthesizeSpeechLocally(
  text: string,
  outputWavPath: string,
  options: TtsProviderOptions = {}
): TtsResult {
  // 1. Validate text input
  const textValidation = validateScriptText(text);
  if (!textValidation.valid) {
    return {
      success: false,
      durationSec: 0,
      engineUsed: 'NONE',
      voiceUsed: 'none',
      error: textValidation.error
    };
  }

  // 2. Confinement check on output path
  let safeOutputPath: string;
  try {
    safeOutputPath = assertSafeOutputPath(outputWavPath);
  } catch (err: any) {
    return {
      success: false,
      durationSec: 0,
      engineUsed: 'NONE',
      voiceUsed: 'none',
      error: err.message
    };
  }

  // Ensure output directory exists
  const outDir = path.dirname(safeOutputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 3. Platform & provider selection
  const targetPlatform = options.targetPlatform || process.platform;
  const provider = selectTtsProvider(targetPlatform, options.engine);

  if (!provider) {
    const isLinux = targetPlatform === 'linux';
    const guidance = isLinux
      ? 'On Linux, install eSpeak NG: `sudo apt-get install espeak-ng` or edge-tts: `pip install edge-tts`.'
      : 'On Windows, ensure PowerShell and System.Speech are available, or install edge-tts: `pip install edge-tts`.';
    return {
      success: false,
      durationSec: 0,
      engineUsed: 'NONE',
      voiceUsed: 'none',
      error: `TTS_NO_AVAILABLE_PROVIDER: No functional TTS provider found for platform '${targetPlatform}'. ${guidance}`
    };
  }

  // 4. Execute synthesis
  let result = provider.synthesize(textValidation.cleanText, safeOutputPath, options);

  // 5. Optional graceful fallback on failure when explicitly requested
  if (!result.success && options.fallbackOnFailure && provider.name === 'KOKORO') {
    const available = getAvailableTtsProviders(targetPlatform);
    const fallbackProvider = targetPlatform === 'win32'
      ? available.find(p => p.name === 'WINDOWS_SAPI')
      : available.find(p => p.name === 'ESPEAK_NG' || p.name === 'PIPER');

    if (fallbackProvider && fallbackProvider.name !== provider.name) {
      console.warn(`[TTS] ${provider.name} synthesis failed (${result.error}); attempting graceful fallback to ${fallbackProvider.name}...`);
      const fallbackResult = fallbackProvider.synthesize(textValidation.cleanText, safeOutputPath, options);
      if (fallbackResult.success) {
        return {
          ...fallbackResult,
          fallbackFrom: provider.name,
          fallbackReason: result.error
        };
      }
    }
  }

  return result;
}
