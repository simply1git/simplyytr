/**
 * SIMPLYYTR 2.0 — Procedural Sound Design & Audio Ducking Engine
 * Generates 100% royalty-free, unencumbered cinematic ambient beds and sound design
 * accents using pure mathematical PCM synthesis in Node.js.
 * Zero external audio downloads, zero third-party copyright claims.
 */

import fs from 'fs';
import path from 'path';

/**
 * Writes a valid 16-bit PCM Stereo WAV file header and data.
 */
function writeWavFile(filePath: string, sampleRate: number, numChannels: number, samples: Float32Array[]): void {
  const numSamples = samples[0].length;
  const blockAlign = numChannels * 2;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buffer = Buffer.alloc(totalSize);

  // RIFF Chunk Descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(totalSize - 8, 4);
  buffer.write('WAVE', 8);

  // 'fmt ' Sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  buffer.writeUInt16LE(1, 20);  // AudioFormat 1 = PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // 'data' Sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = samples[ch][i];
      // Hard clamp between -1.0 and 1.0 to prevent integer overflow clipping
      sample = Math.max(-1.0, Math.min(1.0, sample));
      const int16 = sample < 0 ? Math.floor(sample * 32768) : Math.floor(sample * 32767);
      buffer.writeInt16LE(int16, offset);
      offset += 2;
    }
  }

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, buffer);
}

/**
 * Generates an atmospheric cinematic ambient sound bed in D Minor.
 * Uses rich sub-bass drone, warm detuned pad harmonics, and subtle pulse rhythm.
 */
export function generateCinematicAmbientBed(durationSec: number, outPath: string): string {
  const sampleRate = 44100;
  const numSamples = Math.ceil(durationSec * sampleRate);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  // Harmonic chord frequencies (D minor pad: D2, A2, F3, C4)
  const freqs = [73.42, 110.0, 174.61, 261.63];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Fade in over 3 seconds, fade out over 3 seconds
    let envelope = 1.0;
    if (t < 3.0) {
      envelope = t / 3.0;
    } else if (t > durationSec - 3.0) {
      envelope = Math.max(0.0, (durationSec - t) / 3.0);
    }

    // Gentle 0.2 Hz low frequency breathing modulation (LFO)
    const lfo = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.2 * t);

    let sampleL = 0;
    let sampleR = 0;

    for (let f = 0; f < freqs.length; f++) {
      const baseFreq = freqs[f];
      const weight = 1 / (f + 1.2);

      // Stereo chorus detuning (subtle pitch separation between channels)
      const phaseL = 2 * Math.PI * (baseFreq - 0.2) * t;
      const phaseR = 2 * Math.PI * (baseFreq + 0.2) * t;

      // Soft warm harmonics
      sampleL += weight * (Math.sin(phaseL) + 0.3 * Math.sin(phaseL * 2) + 0.1 * Math.sin(phaseL * 3));
      sampleR += weight * (Math.sin(phaseR) + 0.3 * Math.sin(phaseR * 2) + 0.1 * Math.sin(phaseR * 3));
    }

    // Subtle rhythmic pulse (88 BPM = ~1.46 Hz)
    const pulse = 1.0 + 0.08 * Math.sin(2 * Math.PI * (88 / 60) * t);

    // Master volume normalization (-12 dB peak before ducking)
    const masterGain = 0.28 * envelope * lfo * pulse;
    left[i] = sampleL * masterGain;
    right[i] = sampleR * masterGain;
  }

  writeWavFile(outPath, sampleRate, 2, [left, right]);
  return outPath;
}

/**
 * Generates discrete sound design accents.
 */
export function generateSoundEffect(type: 'RISER' | 'IMPACT' | 'WHOOSH' | 'CHIME' | 'VALVE', outPath: string): string {
  const sampleRate = 44100;
  let durationSec = 1.0;
  if (type === 'RISER') durationSec = 2.0;
  else if (type === 'IMPACT') durationSec = 1.8;
  else if (type === 'WHOOSH') durationSec = 0.8;
  else if (type === 'CHIME') durationSec = 1.2;
  else if (type === 'VALVE') durationSec = 0.9;

  const numSamples = Math.ceil(durationSec * sampleRate);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = t / durationSec;

    let sL = 0;
    let sR = 0;

    if (type === 'RISER') {
      // Exponential frequency sweep from 50 Hz to 450 Hz with noise build
      const freq = 50 + 400 * Math.pow(progress, 2.5);
      const phase = 2 * Math.PI * freq * t;
      const noise = (Math.random() * 2 - 1) * 0.15 * progress;
      const env = Math.pow(progress, 1.8);
      sL = (Math.sin(phase) + noise) * env * 0.6;
      sR = (Math.sin(phase * 1.01) + noise) * env * 0.6;
    } else if (type === 'IMPACT') {
      // Sub impact: pitch drop 120 Hz -> 35 Hz with exponential decay
      const freq = 35 + 85 * Math.exp(-progress * 8);
      const phase = 2 * Math.PI * freq * t;
      const env = Math.exp(-progress * 4.5);
      sL = Math.sin(phase) * env * 0.8;
      sR = Math.sin(phase) * env * 0.8;
    } else if (type === 'WHOOSH') {
      // Bandpass noise sweep with smooth bell envelope
      const env = Math.sin(Math.PI * progress);
      const noiseL = Math.random() * 2 - 1;
      const noiseR = Math.random() * 2 - 1;
      const sweep = Math.sin(2 * Math.PI * (200 + 600 * progress) * t);
      sL = (noiseL * 0.6 + sweep * 0.4) * env * 0.45;
      sR = (noiseR * 0.6 + sweep * 0.4) * env * 0.45;
    } else if (type === 'CHIME') {
      // Harmonic bell chime at 880 Hz (A5) and 1320 Hz (E6)
      const env = Math.exp(-progress * 3.5);
      const b1 = Math.sin(2 * Math.PI * 880 * t);
      const b2 = Math.sin(2 * Math.PI * 1320 * t) * 0.5;
      sL = (b1 + b2) * env * 0.4;
      sR = (b1 * 1.002 + b2) * env * 0.4;
    } else if (type === 'VALVE') {
      // Air pressure release hiss with initial click
      const click = progress < 0.05 ? Math.sin(2 * Math.PI * 1200 * t) * 0.6 : 0;
      const hiss = (Math.random() * 2 - 1) * Math.exp(-progress * 3.0) * 0.35;
      sL = (click + hiss) * 0.5;
      sR = (click + hiss) * 0.5;
    }

    left[i] = Math.max(-1.0, Math.min(1.0, sL));
    right[i] = Math.max(-1.0, Math.min(1.0, sR));
  }

  writeWavFile(outPath, sampleRate, 2, [left, right]);
  return outPath;
}

export interface SoundCueInput {
  timeSec: number;
  volume: number;
  category: 'RISER' | 'IMPACT' | 'WHOOSH' | 'CHIME' | 'VALVE' | 'PULSE' | string;
}

/**
 * Synthesizes a complete composed soundscape track containing the ambient musical bed
 * and all accurately timed discrete sound effect cues layered mathematically.
 */
export function generateComposedSoundscape(
  durationSec: number,
  sfxCues: SoundCueInput[],
  outPath: string
): string {
  const sampleRate = 44100;
  const numSamples = Math.ceil(durationSec * sampleRate);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  // 1. Layer D minor ambient musical bed
  const freqs = [73.42, 110.0, 174.61, 261.63];
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let envelope = 1.0;
    if (t < 2.5) {
      envelope = t / 2.5;
    } else if (t > durationSec - 2.5) {
      envelope = Math.max(0.0, (durationSec - t) / 2.5);
    }
    const lfo = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.2 * t);
    let sampleL = 0;
    let sampleR = 0;
    for (let f = 0; f < freqs.length; f++) {
      const baseFreq = freqs[f];
      const weight = 1 / (f + 1.2);
      const phaseL = 2 * Math.PI * (baseFreq - 0.2) * t;
      const phaseR = 2 * Math.PI * (baseFreq + 0.2) * t;
      sampleL += weight * (Math.sin(phaseL) + 0.3 * Math.sin(phaseL * 2) + 0.1 * Math.sin(phaseL * 3));
      sampleR += weight * (Math.sin(phaseR) + 0.3 * Math.sin(phaseR * 2) + 0.1 * Math.sin(phaseR * 3));
    }
    const pulse = 1.0 + 0.08 * Math.sin(2 * Math.PI * (88 / 60) * t);
    const masterGain = 0.24 * envelope * lfo * pulse;
    left[i] = sampleL * masterGain;
    right[i] = sampleR * masterGain;
  }

  // 2. Layer discrete SFX cues at exact target timestamps
  for (const cue of sfxCues) {
    const startSample = Math.floor(cue.timeSec * sampleRate);
    if (startSample >= numSamples) continue;

    let sfxDurationSec = 1.0;
    if (cue.category === 'RISER') sfxDurationSec = 2.0;
    else if (cue.category === 'IMPACT') sfxDurationSec = 1.8;
    else if (cue.category === 'WHOOSH') sfxDurationSec = 0.8;
    else if (cue.category === 'CHIME') sfxDurationSec = 1.2;
    else if (cue.category === 'VALVE') sfxDurationSec = 0.9;
    else if (cue.category === 'PULSE') sfxDurationSec = 1.0;

    const sfxNumSamples = Math.floor(sfxDurationSec * sampleRate);
    const cueVol = cue.volume || 0.6;

    for (let j = 0; j < sfxNumSamples; j++) {
      const targetIdx = startSample + j;
      if (targetIdx >= numSamples) break;

      const t = j / sampleRate;
      const progress = j / sfxNumSamples;

      let sL = 0;
      let sR = 0;

      if (cue.category === 'RISER') {
        const freq = 50 + 400 * Math.pow(progress, 2.5);
        const phase = 2 * Math.PI * freq * t;
        const noise = (Math.random() * 2 - 1) * 0.15 * progress;
        const env = Math.pow(progress, 1.8);
        sL = (Math.sin(phase) + noise) * env * 0.5 * cueVol;
        sR = (Math.sin(phase * 1.01) + noise) * env * 0.5 * cueVol;
      } else if (cue.category === 'IMPACT') {
        const freq = 35 + 85 * Math.exp(-progress * 8);
        const phase = 2 * Math.PI * freq * t;
        const env = Math.exp(-progress * 4.5);
        sL = Math.sin(phase) * env * 0.7 * cueVol;
        sR = Math.sin(phase) * env * 0.7 * cueVol;
      } else if (cue.category === 'WHOOSH') {
        const env = Math.sin(Math.PI * progress);
        const noiseL = Math.random() * 2 - 1;
        const noiseR = Math.random() * 2 - 1;
        const sweep = Math.sin(2 * Math.PI * (200 + 600 * progress) * t);
        sL = (noiseL * 0.6 + sweep * 0.4) * env * 0.4 * cueVol;
        sR = (noiseR * 0.6 + sweep * 0.4) * env * 0.4 * cueVol;
      } else if (cue.category === 'CHIME') {
        const env = Math.exp(-progress * 3.5);
        const b1 = Math.sin(2 * Math.PI * 880 * t);
        const b2 = Math.sin(2 * Math.PI * 1320 * t) * 0.5;
        sL = (b1 + b2) * env * 0.35 * cueVol;
        sR = (b1 * 1.002 + b2) * env * 0.35 * cueVol;
      } else if (cue.category === 'VALVE') {
        const click = progress < 0.05 ? Math.sin(2 * Math.PI * 1200 * t) * 0.6 : 0;
        const hiss = (Math.random() * 2 - 1) * Math.exp(-progress * 3.0) * 0.35;
        sL = (click + hiss) * 0.45 * cueVol;
        sR = (click + hiss) * 0.45 * cueVol;
      } else {
        // PULSE
        const env = Math.sin(Math.PI * progress);
        const freq = 60;
        sL = Math.sin(2 * Math.PI * freq * t) * env * 0.5 * cueVol;
        sR = Math.sin(2 * Math.PI * freq * t) * env * 0.5 * cueVol;
      }

      left[targetIdx] += sL;
      right[targetIdx] += sR;
    }
  }

  // Final soft clamping to avoid digital clipping
  for (let i = 0; i < numSamples; i++) {
    left[i] = Math.max(-0.95, Math.min(0.95, left[i]));
    right[i] = Math.max(-0.95, Math.min(0.95, right[i]));
  }

  writeWavFile(outPath, sampleRate, 2, [left, right]);
  return outPath;
}
