/**
 * SIMPLYYTR 2.0 — Procedural Motion Graphics & Visual Toolkit
 * Produces story-specific technical diagrams, cutaways, HUD telemetry, and forensic dossiers
 * as high-resolution 1080x1920 visual plates for dynamic video compositing.
 * Replaces generic slide cards with true documentary-grade visual storytelling.
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import type { ShotPlan } from './editDecisionPlan';

export function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Builds the visual plate for a specific ShotPlan.
 */
export async function renderShotVisualPlate(
  shot: ShotPlan,
  topicTitle: string,
  outPath: string
): Promise<string> {
  const width = 1080;
  const height = 1920;

  let sceneSvg = '';

  switch (shot.compositionType) {
    case 'CINEMATIC_HOOK':
      sceneSvg = buildCinematicHookSvg(shot, topicTitle);
      break;
    case 'CABIN_PRESSURE_SIMULATION':
      sceneSvg = buildCabinPressureSvg(shot);
      break;
    case 'HISTORICAL_CHRONOLOGY':
      sceneSvg = buildHistoricalChronologySvg(shot);
      break;
    case 'STRESS_FLOW_COMPARISON':
      sceneSvg = buildStressFlowComparisonSvg(shot);
      break;
    case 'FORENSIC_DOSSIER_ACCIDENT':
      sceneSvg = buildForensicDossierAccidentSvg(shot);
      break;
    case 'FORENSIC_DOSSIER_TANK_TEST':
      sceneSvg = buildForensicDossierTankTestSvg(shot);
      break;
    case 'AIRFRAME_3LAYER_DEFENSE':
      sceneSvg = buildAirframe3LayerDefenseSvg(shot);
      break;
    case 'WINDOW_ASSEMBLY_BLEED_HOLE':
      sceneSvg = buildWindowAssemblyBleedHoleSvg(shot);
      break;
    default:
      sceneSvg = buildEditorialTechnicalSvg(shot, topicTitle);
      break;
  }

  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  await sharp(Buffer.from(sceneSvg))
    .png({ compressionLevel: 6 })
    .toFile(outPath);

  return outPath;
}

// -------------------------------------------------------------
// SHOT 1: CINEMATIC HOOK (AIRCRAFT IN CRUISE FLIGHT)
// -------------------------------------------------------------
function buildCinematicHookSvg(shot: ShotPlan, topicTitle: string): string {
  return `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#020617"/>
          <stop offset="35%" stop-color="#0b1329"/>
          <stop offset="70%" stop-color="#0e1e3e"/>
          <stop offset="100%" stop-color="#030712"/>
        </linearGradient>
        <radialGradient id="sunGlow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#0b1329" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <rect width="1080" height="1920" fill="url(#skyGrad)"/>
      <circle cx="540" cy="780" r="500" fill="url(#sunGlow)"/>

      <!-- Header: Clean Documentary Typography -->
      <g transform="translate(80, 80)">
        <rect x="0" y="0" width="320" height="42" rx="21" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
        <text x="160" y="27" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#38bdf8" text-anchor="middle" letter-spacing="1">AERONAUTICAL MYSTERY</text>
        <text x="0" y="100" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="bold" fill="#ffffff">${escapeXml(topicTitle)}</text>
        <text x="0" y="145" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#94a3b8">The fatal design flaw that changed aviation history</text>
        <line x1="0" y1="180" x2="920" y2="180" stroke="#1e293b" stroke-width="2"/>
      </g>

      <!-- Center Visual: Enlarged Airliner with Prominent Curved Window Focus -->
      <g transform="translate(100, 560)">
        <!-- Atmospheric Grid Horizon lines -->
        <line x1="0" y1="280" x2="880" y2="280" stroke="#0284c7" stroke-opacity="0.25" stroke-width="1" stroke-dasharray="10 10"/>
        <line x1="0" y1="380" x2="880" y2="380" stroke="#0284c7" stroke-opacity="0.35" stroke-width="1.5"/>
        <line x1="0" y1="480" x2="880" y2="480" stroke="#0284c7" stroke-opacity="0.25" stroke-width="1" stroke-dasharray="10 10"/>

        <!-- Jetliner Fuselage -->
        <path d="M 60 350 C 180 300, 600 300, 780 350 C 820 360, 840 375, 810 385 C 600 420, 180 420, 60 385 Z" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>
        
        <!-- Cockpit Window -->
        <path d="M 100 345 L 145 340 L 155 354 L 105 358 Z" fill="#00f0ff"/>
        
        <!-- Passenger Window Apertures (Highlighted Ovals) -->
        <ellipse cx="220" cy="365" rx="11" ry="17" fill="#0284c7" stroke="#ffffff" stroke-width="1.5"/>
        <ellipse cx="280" cy="365" rx="11" ry="17" fill="#0284c7" stroke="#ffffff" stroke-width="1.5"/>
        <ellipse cx="340" cy="365" rx="14" ry="21" fill="#00f0ff" stroke="#f59e0b" stroke-width="3"/>
        <ellipse cx="400" cy="365" rx="11" ry="17" fill="#0284c7" stroke="#ffffff" stroke-width="1.5"/>
        <ellipse cx="460" cy="365" rx="11" ry="17" fill="#0284c7" stroke="#ffffff" stroke-width="1.5"/>
        <ellipse cx="520" cy="365" rx="11" ry="17" fill="#0284c7" stroke="#ffffff" stroke-width="1.5"/>
        <ellipse cx="580" cy="365" rx="11" ry="17" fill="#0284c7" stroke="#ffffff" stroke-width="1.5"/>

        <!-- Wing & Engine -->
        <path d="M 330 385 L 460 510 L 510 510 L 430 385 Z" fill="#0b1329" stroke="#0284c7" stroke-width="2.5"/>
        <rect x="380" y="465" width="100" height="38" rx="19" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>

        <!-- Tail Fin -->
        <path d="M 740 350 L 830 200 L 870 200 L 820 365 Z" fill="#0b1329" stroke="#38bdf8" stroke-width="2.5"/>

        <!-- Glowing Focal Target Ring around central window -->
        <circle cx="340" cy="365" r="55" fill="none" stroke="#f59e0b" stroke-width="3" stroke-dasharray="8 6"/>
        <line x1="390" y1="340" x2="520" y2="230" stroke="#f59e0b" stroke-width="2.5"/>
        
        <!-- Prominent Callout Badge -->
        <g transform="translate(520, 195)">
          <rect x="0" y="0" width="320" height="66" rx="14" fill="#0f172a" stroke="#f59e0b" stroke-width="2.5"/>
          <text x="160" y="42" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#fbbf24" text-anchor="middle" letter-spacing="1">WHY ARE THESE CURVED?</text>
        </g>
      </g>

      <!-- Subtitle Safe Zone Vignette (Unobstructed for subtitles) -->
      <rect x="0" y="1480" width="1080" height="440" fill="#030712" fill-opacity="0.95"/>
    </svg>
  `;
}

// -------------------------------------------------------------
// SHOT 2: CABIN PRESSURE SIMULATION (THE ALUMINUM BALLOON)
// -------------------------------------------------------------
function buildCabinPressureSvg(shot: ShotPlan): string {
  return `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1920" fill="#070b16"/>

      <!-- Header -->
      <g transform="translate(80, 80)">
        <rect x="0" y="0" width="310" height="44" rx="22" fill="#083344" stroke="#00f0ff" stroke-width="1.5"/>
        <text x="155" y="29" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#00f0ff" text-anchor="middle" letter-spacing="1.5">STRUCTURAL MECHANICS</text>
        <text x="0" y="100" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="bold" fill="#ffffff">The Aluminum Balloon Effect</text>
        <text x="0" y="145" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#38bdf8">Cabin pressure creates continuous outward hoop stress</text>
      </g>

      <!-- Center Cross-Section Diagram -->
      <g transform="translate(540, 800)">
        <!-- External Stratosphere Ring -->
        <circle cx="0" cy="0" r="390" fill="none" stroke="#0284c7" stroke-dasharray="12 8" stroke-width="2"/>
        
        <!-- High Pressure Outward Glow -->
        <circle cx="0" cy="0" r="300" fill="#0c4a6e" fill-opacity="0.35" stroke="#38bdf8" stroke-width="4"/>
        <circle cx="0" cy="0" r="230" fill="#082f49" fill-opacity="0.5"/>

        <!-- Outward Pressure Vector Arrows -->
        <!-- North -->
        <line x1="0" y1="-80" x2="0" y2="-260" stroke="#38bdf8" stroke-width="6"/>
        <polygon points="0,-290 -16,-250 16,-250" fill="#38bdf8"/>
        <!-- South -->
        <line x1="0" y1="80" x2="0" y2="260" stroke="#38bdf8" stroke-width="6"/>
        <polygon points="0,290 -16,250 16,250" fill="#38bdf8"/>
        <!-- East -->
        <line x1="80" y1="0" x2="260" y2="0" stroke="#38bdf8" stroke-width="6"/>
        <polygon points="290,0 250,-16 250,16" fill="#38bdf8"/>
        <!-- West -->
        <line x1="-80" y1="0" x2="-260" y2="0" stroke="#38bdf8" stroke-width="6"/>
        <polygon points="-290,0 -250,-16 -250,16" fill="#38bdf8"/>

        <!-- Diagonal Vector Arrows -->
        <line x1="60" y1="-60" x2="190" y2="-190" stroke="#00f0ff" stroke-width="4" stroke-dasharray="8 6"/>
        <line x1="-60" y1="-60" x2="-190" y2="-190" stroke="#00f0ff" stroke-width="4" stroke-dasharray="8 6"/>
        <line x1="60" y1="60" x2="190" y2="190" stroke="#00f0ff" stroke-width="4" stroke-dasharray="8 6"/>
        <line x1="-60" y1="60" x2="-190" y2="190" stroke="#00f0ff" stroke-width="4" stroke-dasharray="8 6"/>

        <!-- Center Label -->
        <rect x="-140" y="-55" width="280" height="110" rx="20" fill="#030712" stroke="#00f0ff" stroke-width="2"/>
        <text x="0" y="-12" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">CABIN PRESSURE</text>
        <text x="0" y="24" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="bold" fill="#00f0ff" text-anchor="middle">~8.5 PSI</text>
        <text x="0" y="44" font-family="Segoe UI, Arial, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Tension expands hull outward</text>
      </g>

      <!-- Outside Atmosphere Callout Boxes -->
      <g transform="translate(100, 360)">
        <rect x="0" y="0" width="380" height="90" rx="16" fill="#111c30" stroke="#0284c7" stroke-width="2"/>
        <text x="25" y="38" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#38bdf8">OUTSIDE ATMOSPHERE (35,000 FT)</text>
        <text x="25" y="70" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#ef4444">~3.5 PSI (Thin Air)</text>
      </g>

      <g transform="translate(600, 360)">
        <rect x="0" y="0" width="380" height="90" rx="16" fill="#111c30" stroke="#f59e0b" stroke-width="2"/>
        <text x="25" y="38" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#fbbf24">PRESSURE DIFFERENTIAL</text>
        <text x="25" y="70" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#fbbf24">ΔP ≈ 5.0 PSI Active</text>
      </g>

      <!-- Bottom Principle Card -->
      <g transform="translate(80, 1260)">
        <rect x="0" y="0" width="920" height="180" rx="20" fill="#0f172a" stroke="#334155" stroke-width="2"/>
        <text x="40" y="55" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="#38bdf8">HOOP STRESS LAW IN AEROSPACE STRUCTURES</text>
        <text x="40" y="100" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#e2e8f0">Circumferential tension is twice longitudinal tension in a pressurized cylinder.</text>
        <text x="40" y="135" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#fbbf24">Every hole cut into the metal skin must redirect these severe tensile forces.</text>
      </g>

      <rect x="0" y="1520" width="1080" height="400" fill="#030712" fill-opacity="0.88"/>
    </svg>
  `;
}

// -------------------------------------------------------------
// SHOT 3: HISTORICAL CHRONOLOGY (THE 1952-1954 COMET INQUIRY)
// -------------------------------------------------------------
function buildHistoricalChronologySvg(shot: ShotPlan): string {
  return `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1920" fill="#070a13"/>

      <!-- Header -->
      <g transform="translate(80, 80)">
        <rect x="0" y="0" width="270" height="44" rx="22" fill="#312e81" stroke="#818cf8" stroke-width="1.5"/>
        <text x="135" y="29" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#c7d2fe" text-anchor="middle" letter-spacing="1">1954 INVESTIGATION</text>
        <text x="0" y="100" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="bold" fill="#ffffff">The de Havilland Comet Inquiry</text>
        <text x="0" y="145" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#a5b4fc">The pioneer jetliner that revealed cyclic metal fatigue</text>
      </g>

      <!-- Chronology Cards -->
      <g transform="translate(80, 280)">
        <!-- Stage 1: 1952 -->
        <rect x="0" y="0" width="920" height="180" rx="20" fill="#111827" stroke="#374151" stroke-width="2"/>
        <rect x="35" y="30" width="120" height="40" rx="10" fill="#0284c7"/>
        <text x="95" y="58" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">1952</text>
        <text x="180" y="58" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff">Dawn of the Commercial Jet Age</text>
        <text x="35" y="115" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#94a3b8">The British Comet 1 doubled airliner cruise speed at 40,000 ft.</text>
        <text x="35" y="145" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#38bdf8">Fitted with generous square passenger window cutouts.</text>

        <!-- Stage 2: 1954 Disintegrations -->
        <rect x="0" y="210" width="920" height="200" rx="20" fill="#1e111a" stroke="#991b1b" stroke-width="2"/>
        <rect x="35" y="240" width="120" height="40" rx="10" fill="#dc2626"/>
        <text x="95" y="268" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">1954</text>
        <text x="180" y="268" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#f87171">Catastrophic In-Flight Breakups</text>
        <text x="35" y="325" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#e2e8f0">Comet G-ALYP broke up over Elba; G-ALYY broke up near Naples.</text>
        <text x="35" y="355" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#94a3b8">The worldwide fleet was grounded indefinitely.</text>
        <text x="35" y="385" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#fca5a5">Cause initially baffling: airframes possessed ample static tensile strength.</text>

        <!-- Stage 3: The Farnborough Scientific Inquiry -->
        <rect x="0" y="440" width="920" height="220" rx="20" fill="#0f172a" stroke="#4f46e5" stroke-width="2"/>
        <rect x="35" y="470" width="160" height="40" rx="10" fill="#4f46e5"/>
        <text x="115" y="498" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">INQUIRY</text>
        <text x="220" y="498" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#818cf8">RAE Farnborough Forensic Testing</text>
        <text x="35" y="555" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#e2e8f0">Sir Arnold Hall directed an unprecedented engineering investigation:</text>
        <text x="35" y="585" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#94a3b8">• Royal Navy recovered Mediterranean wreckage of G-ALYP</text>
        <text x="35" y="615" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#94a3b8">• Full-scale water-tank cyclic pressure fatigue testing on Comet G-ALYU</text>
      </g>

      <!-- Historical Investigation Seal -->
      <g transform="translate(80, 1080)">
        <rect x="0" y="0" width="920" height="190" rx="20" fill="#1e1b4b" fill-opacity="0.6" stroke="#6366f1" stroke-width="2"/>
        <text x="40" y="50" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#c7d2fe">OFFICIAL HISTORICAL INVESTIGATION RECORDS</text>
        <text x="40" y="90" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#e2e8f0">Report of the Public Inquiry into the Causes of the Accidents to Comet Aircraft</text>
        <text x="40" y="125" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#a5b4fc">Lord Cohen Court of Inquiry • Royal Aircraft Establishment (1954)</text>
        <text x="40" y="160" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#94a3b8">FAA Lessons Learned Transport Airplane Database: de Havilland DH-106</text>
      </g>

      <rect x="0" y="1520" width="1080" height="400" fill="#030712" fill-opacity="0.88"/>
    </svg>
  `;
}

// -------------------------------------------------------------
// SHOT 4: STRESS FLOW COMPARISON (SQUARE VS ROUNDED CORNER)
// -------------------------------------------------------------
function buildStressFlowComparisonSvg(shot: ShotPlan): string {
  return `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1920" fill="#070b16"/>

      <!-- Header -->
      <g transform="translate(80, 80)">
        <rect x="0" y="0" width="280" height="44" rx="22" fill="#450a0a" stroke="#ef4444" stroke-width="1.5"/>
        <text x="140" y="29" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#fca5a5" text-anchor="middle" letter-spacing="1">STRESS MECHANICS</text>
        <text x="0" y="100" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="bold" fill="#ffffff">How Sharp Corners Multiply Stress</text>
        <text x="0" y="145" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#94a3b8">Side-by-side comparison of fuselage skin tension flow</text>
      </g>

      <!-- Comparative Side-by-Side Panels -->
      <g transform="translate(80, 270)">
        <!-- LEFT: SQUARE CORNER (DANGER) -->
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="445" height="720" rx="24" fill="#180d13" stroke="#ef4444" stroke-width="3"/>
          <rect x="25" y="25" width="395" height="44" rx="12" fill="#7f1d1d"/>
          <text x="222" y="55" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">SQUARE OPENING</text>

          <!-- Square Window Cutout -->
          <rect x="75" y="120" width="295" height="310" rx="0" fill="#030712" stroke="#475569" stroke-width="4"/>

          <!-- Bottleneck Stress Concentration Nodes at Corners -->
          <circle cx="75" cy="120" r="32" fill="#ef4444" fill-opacity="0.45"/>
          <circle cx="75" cy="120" r="16" fill="#ef4444"/>
          <circle cx="370" cy="120" r="32" fill="#ef4444" fill-opacity="0.45"/>
          <circle cx="370" cy="120" r="16" fill="#ef4444"/>
          <circle cx="75" cy="430" r="32" fill="#ef4444" fill-opacity="0.45"/>
          <circle cx="75" cy="430" r="16" fill="#ef4444"/>
          <circle cx="370" cy="430" r="32" fill="#ef4444" fill-opacity="0.45"/>
          <circle cx="370" cy="430" r="16" fill="#ef4444"/>

          <!-- Micro-crack jagged lines radiating from top-left corner -->
          <path d="M 75 120 L 45 90 L 35 70" stroke="#fef08a" stroke-width="4" stroke-linecap="round"/>
          <path d="M 370 120 L 400 90 L 415 75" stroke="#fef08a" stroke-width="4" stroke-linecap="round"/>

          <text x="222" y="475" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#ef4444" text-anchor="middle">EXTREME STRESS RAISER</text>
          <text x="35" y="525" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#fca5a5">• Tension lines forced to abruptly pivot</text>
          <text x="35" y="560" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#fca5a5">• Peak stress spikes sharply at 90° corners</text>
          <text x="35" y="595" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#fca5a5">• Cyclic fatigue cracks spawn at rivet holes</text>
          <text x="35" y="650" font-family="Segoe UI, Arial, sans-serif" font-size="17" font-weight="bold" fill="#f87171">RESULT: Rapid Fatigue Rupture</text>
        </g>

        <!-- RIGHT: ROUNDED CORNER (SAFE) -->
        <g transform="translate(475, 0)">
          <rect x="0" y="0" width="445" height="720" rx="24" fill="#061c16" stroke="#10b981" stroke-width="3"/>
          <rect x="25" y="25" width="395" height="44" rx="12" fill="#065f46"/>
          <text x="222" y="55" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">ROUNDED OPENING</text>

          <!-- Oval Rounded Window Cutout -->
          <rect x="75" y="120" width="295" height="310" rx="90" fill="#030712" stroke="#10b981" stroke-width="4"/>

          <!-- Smooth Flow Streamlines -->
          <path d="M 40 180 C 40 90, 110 50, 222 50 C 335 50, 405 90, 405 180" fill="none" stroke="#34d399" stroke-width="2.5" stroke-dasharray="6 4"/>
          <path d="M 25 240 C 25 60, 110 20, 222 20 C 335 20, 420 60, 420 240" fill="none" stroke="#34d399" stroke-width="2" stroke-dasharray="8 6"/>

          <circle cx="222" cy="275" r="50" fill="#047857" fill-opacity="0.3"/>
          <text x="222" y="282" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#6ee7b7" text-anchor="middle">SMOOTH FLOW</text>

          <text x="222" y="475" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#10b981" text-anchor="middle">UNIFORM REDISTRIBUTION</text>
          <text x="35" y="525" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#a7f3d0">• Continuous radius routes load smoothly</text>
          <text x="35" y="560" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#a7f3d0">• Peak stress concentrations eliminated</text>
          <text x="35" y="595" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#a7f3d0">• Hull withstands tens of thousands of cycles</text>
          <text x="35" y="650" font-family="Segoe UI, Arial, sans-serif" font-size="17" font-weight="bold" fill="#34d399">RESULT: Damage-Tolerant Life</text>
        </g>
      </g>

      <!-- Explanatory Technical Bottom Panel -->
      <g transform="translate(80, 1030)">
        <rect x="0" y="0" width="920" height="230" rx="20" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
        <text x="40" y="45" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#fbbf24">ENGINEERING INSIGHT: NOT A REAL SIMULATION CLAIM</text>
        <text x="40" y="85" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#e2e8f0">This diagram illustrates the qualitative principle of stress concentration factors (Kt).</text>
        <text x="40" y="120" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#94a3b8">In any pressurized vessel, lines of mechanical tension act like fluid streaming around an obstacle.</text>
        <text x="40" y="155" font-family="Segoe UI, Arial, sans-serif" font-size="19" font-weight="bold" fill="#38bdf8">Eliminating sharp corners allows fuselage metal to share tension across the entire frame.</text>
        <text x="40" y="195" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#64748b">Exact numerical multipliers depend on fuselage radius, cutout geometry, rivet pitch, and reinforcement doublers.</text>
      </g>

      <rect x="0" y="1520" width="1080" height="400" fill="#030712" fill-opacity="0.88"/>
    </svg>
  `;
}

// -------------------------------------------------------------
// SHOT 5: FORENSIC DOSSIER (G-ALYP ACCIDENT EVIDENCE)
// -------------------------------------------------------------
function buildForensicDossierAccidentSvg(shot: ShotPlan): string {
  return `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1920" fill="#0a0f1d"/>

      <!-- Header -->
      <g transform="translate(80, 80)">
        <rect x="0" y="0" width="320" height="44" rx="22" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5"/>
        <text x="160" y="29" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#c7d2fe" text-anchor="middle" letter-spacing="1">FORENSIC EVIDENCE (1 OF 2)</text>
        <text x="0" y="100" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="bold" fill="#ffffff">Flight G-ALYP: The Wreckage Origin</text>
        <text x="0" y="145" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#a5b4fc">Recovered seabed wreckage proved the in-flight crack started at the roof</text>
      </g>

      <!-- Dossier Document Card -->
      <g transform="translate(80, 260)">
        <rect x="0" y="0" width="920" height="960" rx="24" fill="#0f172a" stroke="#475569" stroke-width="2"/>

        <!-- Dossier Header Bar -->
        <rect x="0" y="0" width="920" height="90" rx="24" fill="#1e293b"/>
        <text x="40" y="55" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="#f8fafc">ACCIDENT RECOVERY EVIDENCE // AIRFRAME G-ALYP</text>

        <!-- Wreckage Blueprint Visual -->
        <g transform="translate(60, 130)">
          <rect x="0" y="0" width="800" height="380" rx="16" fill="#030712" stroke="#0284c7" stroke-width="1.5"/>
          
          <!-- Roof Antenna Schematic -->
          <text x="400" y="50" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#38bdf8" text-anchor="middle">ROOF NAVIGATION CUTOUT (REAR ADF ANTENNA)</text>
          
          <!-- Square Aperture on Roof -->
          <rect x="280" y="100" width="240" height="180" fill="#0b1329" stroke="#f59e0b" stroke-width="3"/>
          
          <!-- Rivet Holes along Edge -->
          <circle cx="280" cy="100" r="14" fill="#ef4444"/>
          <circle cx="340" cy="100" r="6" fill="#94a3b8"/>
          <circle cx="400" cy="100" r="6" fill="#94a3b8"/>
          <circle cx="460" cy="100" r="6" fill="#94a3b8"/>
          <circle cx="520" cy="100" r="6" fill="#94a3b8"/>
          
          <!-- Fracture Propagation Arrow -->
          <path d="M 280 100 L 200 60 L 120 40" stroke="#ef4444" stroke-width="5" stroke-linecap="round"/>
          <text x="140" y="30" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#f87171">PRIMARY FAILURE ORIGIN</text>
          
          <text x="400" y="330" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">Recovered Mediterranean Seabed Section • Metallurgical Fracture Analysis</text>
        </g>

        <!-- Critical Fact Clarification -->
        <g transform="translate(60, 550)">
          <rect x="0" y="0" width="800" height="360" rx="16" fill="#181329" stroke="#818cf8" stroke-width="1.5"/>
          <text x="35" y="45" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#c7d2fe">CRITICAL HISTORICAL DISTINCTION</text>
          
          <text x="35" y="85" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#e2e8f0">• Popular retellings often claim the in-flight breakup began at a passenger window.</text>
          <text x="35" y="125" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#fbbf24">• Metallurgical evidence proved G-ALYP initiated at a rivet hole</text>
          <text x="50" y="152" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#fbbf24">near the rear ADF roof antenna cutout (not at a cabin window).</text>
          <text x="35" y="190" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#cbd5e1">• The roof antenna cutout was also built with sharp 90° corners.</text>
          <text x="35" y="222" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#cbd5e1">• It experienced identical cyclic hoop stress concentration as the cabin windows.</text>
          
          <line x1="35" y1="255" x2="765" y2="255" stroke="#312e81" stroke-width="1.5"/>
          <text x="35" y="290" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#94a3b8">Source: RAE Farnborough Report Chapter 3 • Court of Inquiry Official Findings (1954)</text>
          <text x="35" y="318" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#94a3b8">FAA Lessons Learned Database: Transport Airplane Structural Failures (G-ALYV/G-ALYP)</text>
        </g>
      </g>

      <rect x="0" y="1520" width="1080" height="400" fill="#030712" fill-opacity="0.88"/>
    </svg>
  `;
}

// -------------------------------------------------------------
// SHOT 6: FORENSIC DOSSIER (G-ALYU WATER TANK SIMULATION)
// -------------------------------------------------------------
function buildForensicDossierTankTestSvg(shot: ShotPlan): string {
  return `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1920" fill="#070e1c"/>

      <!-- Header -->
      <g transform="translate(80, 80)">
        <rect x="0" y="0" width="320" height="44" rx="22" fill="#0c4a6e" stroke="#0284c7" stroke-width="1.5"/>
        <text x="160" y="29" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#7dd3fc" text-anchor="middle" letter-spacing="1">FORENSIC EVIDENCE (2 OF 2)</text>
        <text x="0" y="100" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="bold" fill="#ffffff">Comet G-ALYU: Water Tank Proof</text>
        <text x="0" y="145" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#38bdf8">Full-scale water tank testing proved window corners also cracked</text>
      </g>

      <!-- Dossier Document Card -->
      <g transform="translate(80, 260)">
        <rect x="0" y="0" width="920" height="960" rx="24" fill="#0f172a" stroke="#0284c7" stroke-width="2"/>

        <rect x="0" y="0" width="920" height="90" rx="24" fill="#0c4a6e"/>
        <text x="40" y="55" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">FARNBOROUGH 250,000-GALLON WATER TANK EXPERIMENT</text>

        <!-- Water Tank Simulation Visual -->
        <g transform="translate(60, 130)">
          <rect x="0" y="0" width="800" height="380" rx="16" fill="#030712" stroke="#0284c7" stroke-width="1.5"/>
          
          <rect x="100" y="60" width="600" height="260" rx="12" fill="#082f49" fill-opacity="0.5" stroke="#38bdf8" stroke-width="2"/>
          
          <!-- Submerged Fuselage Cutout -->
          <text x="400" y="105" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#38bdf8" text-anchor="middle">CYCLIC HYDRAULIC PRESSURE CYCLES: 3,057</text>
          
          <!-- Passenger Window with Crack at Corner -->
          <rect x="300" y="140" width="200" height="130" fill="#030712" stroke="#f59e0b" stroke-width="3"/>
          <circle cx="300" cy="140" r="18" fill="#ef4444"/>
          <path d="M 300 140 L 230 100 L 180 80" stroke="#f87171" stroke-width="5" stroke-linecap="round"/>
          
          <text x="400" y="300" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#ef4444" text-anchor="middle">Rupture Initiated at Forward Escape Hatch Window Corner</text>
        </g>

        <!-- Scientific Proof Card -->
        <g transform="translate(60, 550)">
          <rect x="0" y="0" width="800" height="360" rx="16" fill="#082f49" fill-opacity="0.3" stroke="#0284c7" stroke-width="1.5"/>
          <text x="35" y="45" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#38bdf8">FORENSIC SIGNIFICANCE OF THE WATER TANK</text>
          
          <text x="35" y="95" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#e2e8f0">• Using water instead of air prevented explosive decompression, preserving fracture surfaces intact.</text>
          <text x="35" y="140" font-family="Segoe UI, Arial, sans-serif" font-size="19" font-weight="bold" fill="#6ee7b7">• At cycle 3,057, a fatigue crack initiated directly at the sharp corner of a passenger escape hatch window.</text>
          <text x="35" y="185" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#cbd5e1">• Combined with G-ALYP, this proved that square openings anywhere on the hull spawn fatigue cracks.</text>
          
          <line x1="35" y1="230" x2="765" y2="230" stroke="#0c4a6e" stroke-width="1.5"/>
          <text x="35" y="275" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#fbbf24">BOTH FAILURES SHARE THE IDENTICAL MECHANICS:</text>
          <text x="35" y="310" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#94a3b8">Sharp 90° corners concentrated cyclic cabin pressurization tension into microscopic fatigue cracks.</text>
        </g>
      </g>

      <rect x="0" y="1520" width="1080" height="400" fill="#030712" fill-opacity="0.88"/>
    </svg>
  `;
}

// -------------------------------------------------------------
// SHOT 7: AIRFRAME 3-LAYER DEFENSE (MODERN AIRWORTHINESS)
// -------------------------------------------------------------
function buildAirframe3LayerDefenseSvg(shot: ShotPlan): string {
  return `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1920" fill="#070c18"/>

      <!-- Header -->
      <g transform="translate(80, 80)">
        <rect x="0" y="0" width="310" height="44" rx="22" fill="#064e3b" stroke="#10b981" stroke-width="1.5"/>
        <text x="155" y="29" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#a7f3d0" text-anchor="middle" letter-spacing="1">MODERN AIRWORTHINESS</text>
        <text x="0" y="100" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="bold" fill="#ffffff">Safety Beyond Shape Alone</text>
        <text x="0" y="145" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#34d399">Three engineered defense layers protect modern airframes</text>
      </g>

      <!-- 3 Layer Pillars -->
      <g transform="translate(80, 270)">
        <!-- Layer 1: Curved Geometry -->
        <rect x="0" y="0" width="920" height="210" rx="20" fill="#0f172a" stroke="#0284c7" stroke-width="2"/>
        <circle cx="60" cy="60" r="28" fill="#0284c7"/>
        <text x="60" y="69" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">1</text>
        <text x="110" y="65" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff">Curved / Elliptical Cutout Geometry</text>
        <text x="110" y="110" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#94a3b8">Continuous curvature eliminates sharp stress raisers.</text>
        <text x="110" y="145" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#e2e8f0">Hoop tension routes smoothly around the perimeter without local spikes.</text>
        <text x="110" y="180" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#38bdf8">Geometry eliminates focal bottlenecks.</text>

        <!-- Layer 2: Reinforcement Doubler Plates -->
        <rect x="0" y="240" width="920" height="210" rx="20" fill="#0f172a" stroke="#059669" stroke-width="2"/>
        <circle cx="60" cy="300" r="28" fill="#059669"/>
        <text x="60" y="309" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">2</text>
        <text x="110" y="305" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff">Reinforcement Doubler Plates</text>
        <text x="110" y="350" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#94a3b8">Thickened structural rings riveted around every opening.</text>
        <text x="110" y="385" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#e2e8f0">Provides added cross-sectional metal area to carry diverted tensile loads.</text>
        <text x="110" y="420" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#34d399">Doublers physically reinforce the skin surrounding the cutout.</text>

        <!-- Layer 3: Damage Tolerance & Inspection -->
        <rect x="0" y="480" width="920" height="210" rx="20" fill="#0f172a" stroke="#d97706" stroke-width="2"/>
        <circle cx="60" cy="540" r="28" fill="#d97706"/>
        <text x="60" y="549" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">3</text>
        <text x="110" y="545" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff">Damage-Tolerance Standard (FAA 14 CFR § 25.571)</text>
        <text x="110" y="590" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#94a3b8">Mandates rigorous crack-growth evaluation and residual strength testing.</text>
        <text x="110" y="625" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#e2e8f0">Airframes must remain safe even if a fatigue flaw develops between inspections.</text>
        <text x="110" y="660" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#fbbf24">Mandatory threshold inspections catch micro-defects before failure.</text>
      </g>

      <!-- Regulatory Clarification Box -->
      <g transform="translate(80, 1030)">
        <rect x="0" y="0" width="920" height="220" rx="20" fill="#064e3b" fill-opacity="0.4" stroke="#10b981" stroke-width="2"/>
        <text x="40" y="45" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#6ee7b7">AUTHORITATIVE REGULATORY CLARIFICATION</text>
        <text x="40" y="90" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#ffffff">Federal Aviation Administration (FAA) regulations do NOT dictate one single window geometry by decree.</text>
        <text x="40" y="125" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#a7f3d0">Under 14 CFR § 25.571 and AC 25.775-1, manufacturers must prove compliance through</text>
        <text x="40" y="160" font-family="Segoe UI, Arial, sans-serif" font-size="19" font-weight="bold" fill="#ffffff">damage-tolerance fatigue evaluation, fail-safe load paths, and verified crack-growth life.</text>
        <text x="40" y="195" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#94a3b8">Curved geometry is the universal engineering solution chosen to pass these rigorous structural tests.</text>
      </g>

      <rect x="0" y="1520" width="1080" height="400" fill="#030712" fill-opacity="0.88"/>
    </svg>
  `;
}

// -------------------------------------------------------------
// SHOT 8: WINDOW ASSEMBLY & BLEED HOLE (TAKEAWAY + AUDIENCE QUESTION)
// -------------------------------------------------------------
function buildWindowAssemblyBleedHoleSvg(shot: ShotPlan): string {
  return `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1920" fill="#070a14"/>

      <!-- Header -->
      <g transform="translate(80, 80)">
        <rect x="0" y="0" width="280" height="44" rx="22" fill="#581c87" stroke="#c084fc" stroke-width="1.5"/>
        <text x="140" y="29" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#e9d5ff" text-anchor="middle" letter-spacing="1">FINAL TAKEAWAY</text>
        <text x="0" y="100" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="bold" fill="#ffffff">The Window Bleed Hole Secret</text>
        <text x="0" y="145" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#d8b4fe">The hidden secondary safety feature on every passenger window</text>
      </g>

      <!-- 3-Pane Window Cutaway Visual -->
      <g transform="translate(80, 260)">
        <rect x="0" y="0" width="920" height="580" rx="24" fill="#0f172a" stroke="#8b5cf6" stroke-width="2"/>
        
        <text x="460" y="50" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#c084fc" text-anchor="middle">3-PANE AIRCRAFT WINDOW ASSEMBLY CUTAWAY</text>

        <!-- Pane 1: Outer Structural Pane -->
        <g transform="translate(140, 100)">
          <rect x="0" y="0" width="40" height="340" rx="6" fill="#38bdf8" fill-opacity="0.8" stroke="#0284c7" stroke-width="2"/>
          <text x="20" y="380" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#38bdf8" text-anchor="middle">OUTER PANE</text>
          <text x="20" y="405" font-family="Segoe UI, Arial, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Carries 100% Cabin ΔP</text>
        </g>

        <!-- Air Gap & Bleed Airflow Arrows -->
        <g transform="translate(260, 240)">
          <path d="M 0 0 L 80 0" stroke="#fbbf24" stroke-width="3" stroke-dasharray="6 4"/>
          <polygon points="85,0 75,-6 75,6" fill="#fbbf24"/>
          <text x="40" y="-15" font-family="Segoe UI, Arial, sans-serif" font-size="14" fill="#fbbf24" text-anchor="middle">Pressure Equalization</text>
        </g>

        <!-- Pane 2: Middle Acrylic Pane with BLEED HOLE -->
        <g transform="translate(420, 100)">
          <rect x="0" y="0" width="40" height="340" rx="6" fill="#818cf8" fill-opacity="0.8" stroke="#4f46e5" stroke-width="2"/>
          <!-- The Tiny Bleed Hole Circle -->
          <circle cx="20" cy="270" r="14" fill="#030712" stroke="#f59e0b" stroke-width="4"/>
          <text x="20" y="380" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#a5b4fc" text-anchor="middle">MIDDLE PANE</text>
          <text x="20" y="405" font-family="Segoe UI, Arial, sans-serif" font-size="14" fill="#fbbf24" text-anchor="middle">With Bleed Valve</text>

          <!-- Callout Arrow to Bleed Hole -->
          <circle cx="20" cy="270" r="30" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4 4"/>
          <line x1="50" y1="270" x2="160" y2="240" stroke="#f59e0b" stroke-width="2"/>
          <rect x="160" y="210" width="220" height="60" rx="10" fill="#1e1b4b" stroke="#f59e0b" stroke-width="2"/>
          <text x="270" y="246" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#fbbf24" text-anchor="middle">TINY BLEED HOLE</text>
        </g>

        <!-- Pane 3: Inner Scratch Protective Pane -->
        <g transform="translate(740, 100)">
          <rect x="0" y="0" width="25" height="340" rx="4" fill="#94a3b8" fill-opacity="0.6" stroke="#475569" stroke-width="1.5"/>
          <text x="12" y="380" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#cbd5e1" text-anchor="middle">INNER PANE</text>
          <text x="12" y="405" font-family="Segoe UI, Arial, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Passenger Scratch Shield</text>
        </g>
      </g>

      <!-- Takeaway & Audience Question Card -->
      <g transform="translate(80, 880)">
        <rect x="0" y="0" width="920" height="380" rx="24" fill="#180e29" stroke="#c084fc" stroke-width="2.5"/>
        <rect x="40" y="35" width="200" height="36" rx="18" fill="#581c87"/>
        <text x="140" y="60" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">AUDIENCE QUESTION</text>

        <text x="40" y="125" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="bold" fill="#ffffff">Have you ever noticed that tiny hole?</text>
        <text x="40" y="170" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#d8b4fe">It balances air pressure between panes and prevents cabin fogging,</text>
        <text x="40" y="205" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#fde047">ensuring the heavy outer structural pane carries all the flight load!</text>

        <!-- Engagement Action -->
        <g transform="translate(40, 255)">
          <rect x="0" y="0" width="840" height="90" rx="16" fill="#2e1065" stroke="#a855f7" stroke-width="2"/>
          <text x="420" y="42" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">Did you know this about airplane windows?</text>
          <text x="420" y="74" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#c084fc" text-anchor="middle">Tell us in the comments! Full FAA airworthiness references in description below.</text>
        </g>
      </g>

      <rect x="0" y="1520" width="1080" height="400" fill="#030712" fill-opacity="0.88"/>
    </svg>
  `;
}

// -------------------------------------------------------------
// GENERIC TOPIC STORYBOARD (EDITORIAL TECHNICAL SUITE)
// -------------------------------------------------------------
function buildEditorialTechnicalSvg(shot: ShotPlan, topicTitle: string): string {
  const callouts = (shot.calloutLabels || []).slice(0, 3);
  const calloutBadgesSvg = callouts.map((label, idx) => {
    const yOffset = 420 + (idx * 90);
    return `
      <g transform="translate(60, ${yOffset})">
        <rect x="0" y="0" width="800" height="64" rx="14" fill="#1e293b" fill-opacity="0.8" stroke="#38bdf8" stroke-width="1.5"/>
        <circle cx="36" cy="32" r="10" fill="#38bdf8"/>
        <text x="36" y="37" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="bold" fill="#020617" text-anchor="middle">${idx + 1}</text>
        <text x="70" y="39" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#f8fafc">${escapeXml(label)}</text>
      </g>
    `;
  }).join('');

  return `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#020617"/>
          <stop offset="40%" stop-color="#0b1329"/>
          <stop offset="100%" stop-color="#030712"/>
        </linearGradient>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </linearGradient>
        <pattern id="gridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1e293b" stroke-width="1" stroke-opacity="0.4"/>
        </pattern>
      </defs>

      <rect width="1080" height="1920" fill="url(#bgGrad)"/>
      <rect width="1080" height="1920" fill="url(#gridPattern)"/>

      <!-- Header & Breadcrumb -->
      <g transform="translate(80, 80)">
        <rect x="0" y="0" width="340" height="44" rx="22" fill="#083344" stroke="#00f0ff" stroke-width="1.5"/>
        <text x="170" y="29" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#00f0ff" text-anchor="middle" letter-spacing="1.5">INVESTIGATIVE ANALYSIS</text>
        <text x="0" y="105" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff">${escapeXml(topicTitle)}</text>
        <text x="0" y="150" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#38bdf8">BEAT ${shot.order || 1} // ${escapeXml(shot.narrativePurpose || 'ANALYSIS')}</text>
      </g>

      <!-- Center Technical Dossier Plate -->
      <g transform="translate(80, 270)">
        <rect x="0" y="0" width="920" height="980" rx="28" fill="url(#cardGrad)" stroke="#38bdf8" stroke-width="2"/>

        <!-- Top Status Bar -->
        <g transform="translate(40, 40)">
          <rect x="0" y="0" width="220" height="36" rx="18" fill="#1e3a8a"/>
          <text x="110" y="24" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="bold" fill="#93c5fd" text-anchor="middle" letter-spacing="1">EVIDENCE PLATE</text>
        </g>

        <!-- Main Headline -->
        <text x="40" y="140" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="bold" fill="#ffffff">${escapeXml(shot.headline)}</text>
        <text x="40" y="185" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#94a3b8">${escapeXml(shot.subheadline)}</text>

        <!-- Divider Line -->
        <line x1="40" y1="220" x2="880" y2="220" stroke="#334155" stroke-width="1.5"/>

        <!-- Sub-Schematic Visual Area -->
        <g transform="translate(40, 250)">
          <rect x="0" y="0" width="840" height="130" rx="16" fill="#020617" stroke="#1e293b" stroke-width="1.5"/>
          <text x="40" y="55" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#38bdf8">MEASURED PARAMETERS &amp; OBSERVATIONS</text>
          <text x="40" y="90" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#cbd5e1">Systematic engineering analysis and documented literature findings.</text>
        </g>

        <!-- Callout Badges -->
        ${calloutBadgesSvg}

        <!-- Bottom Security Timestamp -->
        <text x="40" y="940" font-family="Courier New, monospace" font-size="14" fill="#64748b">SIMPLYYTR // SYSTEM RESEARCH ENGINE // VERIFIED EVIDENCE</text>
      </g>

      <!-- Bottom Subtitle Overlay Buffer Zone -->
      <rect x="0" y="1520" width="1080" height="400" fill="#030712" fill-opacity="0.88"/>
    </svg>
  `;
}
