import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

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

export interface SceneRenderOptions {
  jobId: string;
  topic: string;
  displayTitle: string;
  segment: {
    id: string;
    order: number;
    text: string;
    visualPlan: {
      sceneType: string;
      description: string;
      primaryText: string;
      secondaryText?: string;
      badgeText?: string;
      assetSource?: string;
    };
  };
  index: number;
  totalSegments: number;
  claim?: any;
  reviewStatus?: string;
  outPath: string;
}

export async function generateSceneImage(options: SceneRenderOptions): Promise<string> {
  const { topic, displayTitle, segment, index, totalSegments, outPath } = options;
  const isAirplaneTopic = /airplane.*window|window.*airplane|aircraft.*window/i.test(topic);

  let svgContent: string;
  if (isAirplaneTopic && index < 6) {
    svgContent = buildAirplaneWindowSvg(index, displayTitle);
  } else {
    svgContent = buildGenericViewerCardSvg(options);
  }

  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  await sharp(Buffer.from(svgContent))
    .png({ compressionLevel: 6 })
    .toFile(outPath);

  return outPath;
}

function buildAirplaneWindowSvg(index: number, displayTitle: string): string {
  const width = 1080;
  const height = 1920;

  const headerSvg = `
    <!-- Top Category Pill -->
    <rect x="80" y="80" width="310" height="48" rx="24" fill="#083344" stroke="#00f0ff" stroke-width="2"/>
    <text x="235" y="112" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#00f0ff" text-anchor="middle" letter-spacing="1.5">AEROSPACE ENGINEERING</text>
    
    <!-- Topic Title -->
    <text x="80" y="175" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="bold" fill="#ffffff">Why Airplane Windows Have</text>
    <text x="80" y="230" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="bold" fill="#38bdf8">Rounded Corners</text>
    
    <!-- Header Divider Line -->
    <line x1="80" y1="265" x2="1000" y2="265" stroke="#1e293b" stroke-width="2"/>
  `;

  const subtitleZoneSvg = `
    <rect x="60" y="1520" width="960" height="300" rx="24" fill="#0b1120" fill-opacity="0.85" stroke="#1e293b" stroke-width="1.5"/>
  `;

  let contentSvg = '';

  if (index === 0) {
    // 01: THE PUZZLE (Hook)
    contentSvg = `
      <rect x="80" y="295" width="920" height="1180" rx="28" fill="#111c30" stroke="#334155" stroke-width="2"/>
      
      <rect x="110" y="325" width="220" height="42" rx="21" fill="#1e293b"/>
      <text x="220" y="353" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#94a3b8" text-anchor="middle" letter-spacing="1">01 // THE PUZZLE</text>
      
      <rect x="760" y="325" width="210" height="42" rx="21" fill="#0c4a6e" stroke="#0284c7" stroke-width="1"/>
      <text x="865" y="352" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#38bdf8" text-anchor="middle">AIRCRAFT DESIGN</text>
      
      <text x="110" y="425" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff">The Curved Window Puzzle</text>
      <text x="110" y="465" font-family="Segoe UI, Arial, sans-serif" font-size="24" fill="#94a3b8">Why don't airliners use standard square window cutouts?</text>
      
      <!-- Visual Illustration: Fuselage & Pressurization -->
      <g transform="translate(110, 510)">
        <rect x="0" y="0" width="860" height="520" rx="20" fill="#080e1a" stroke="#1e293b" stroke-width="2"/>
        
        <!-- Cross-Section Circle -->
        <circle cx="430" cy="240" r="180" fill="#0f172a" stroke="#38bdf8" stroke-width="5" stroke-dasharray="8 4"/>
        
        <!-- Cabin High Pressure Callout -->
        <circle cx="430" cy="240" r="120" fill="#0284c7" fill-opacity="0.12"/>
        <text x="430" y="215" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="bold" fill="#38bdf8" text-anchor="middle">CABIN PRESSURE</text>
        <text x="430" y="255" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#e2e8f0" text-anchor="middle">~8.5 PSI (High)</text>
        <text x="430" y="285" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#94a3b8" text-anchor="middle">Expands fuselage outward</text>
        
        <!-- Pressure Expansion Arrows -->
        <path d="M 430 110 L 430 75 M 420 85 L 430 70 L 440 85" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
        <path d="M 430 370 L 430 405 M 420 395 L 430 410 L 440 395" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
        <path d="M 300 240 L 265 240 M 275 230 L 260 240 L 275 250" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
        <path d="M 560 240 L 595 240 M 585 230 L 600 240 L 585 250" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
        
        <!-- Outside Altitude Condition -->
        <rect x="25" y="25" width="220" height="70" rx="12" fill="#1e293b" fill-opacity="0.8"/>
        <text x="135" y="55" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#94a3b8" text-anchor="middle">OUTSIDE AT 35,000 FT</text>
        <text x="135" y="80" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#f43f5e" text-anchor="middle">~3.5 PSI (Thin Air)</text>
        
        <!-- Window Cutout Spotlight -->
        <rect x="615" y="25" width="220" height="70" rx="12" fill="#1e293b" fill-opacity="0.8"/>
        <text x="725" y="55" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#94a3b8" text-anchor="middle">PRESSURE DIFFERENTIAL</text>
        <text x="725" y="80" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#eab308" text-anchor="middle">Continuous Stress</text>
      </g>
      
      <!-- Key Insight Box -->
      <g transform="translate(110, 1070)">
        <rect x="0" y="0" width="860" height="155" rx="16" fill="#082f49" fill-opacity="0.5" stroke="#0284c7" stroke-width="2"/>
        <text x="35" y="45" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#38bdf8">CORE AERONAUTICAL REALITY</text>
        <text x="35" y="85" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#e2e8f0">Every flight cycle inflates and deflates the cabin like an aluminum balloon.</text>
        <text x="35" y="120" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#facc15">Any cutout in the fuselage hull becomes a focal point for mechanical tension.</text>
      </g>
    `;
  } else if (index === 1) {
    // 02: HISTORICAL CONTEXT (Comet 1954)
    contentSvg = `
      <rect x="80" y="295" width="920" height="1180" rx="28" fill="#111c30" stroke="#334155" stroke-width="2"/>
      
      <rect x="110" y="325" width="260" height="42" rx="21" fill="#1e293b"/>
      <text x="240" y="353" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#94a3b8" text-anchor="middle" letter-spacing="1">02 // HISTORICAL ORIGIN</text>
      
      <rect x="740" y="325" width="230" height="42" rx="21" fill="#451a03" stroke="#b45309" stroke-width="1"/>
      <text x="855" y="352" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#fbbf24" text-anchor="middle">1954 INVESTIGATION</text>
      
      <text x="110" y="425" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff">The de Havilland Comet Inquiry</text>
      <text x="110" y="465" font-family="Segoe UI, Arial, sans-serif" font-size="24" fill="#94a3b8">The tragic discovery that transformed pressurized aviation</text>
      
      <!-- 3 Timeline Cards -->
      <g transform="translate(110, 505)">
        <rect x="0" y="0" width="860" height="150" rx="16" fill="#080e1a" stroke="#1e293b" stroke-width="2"/>
        <rect x="25" y="25" width="100" height="40" rx="8" fill="#0284c7"/>
        <text x="75" y="52" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">1952</text>
        <text x="150" y="52" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">Dawn of the Commercial Jet Age</text>
        <text x="25" y="105" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#94a3b8">The British de Havilland Comet 1 enters service with high-altitude speed,</text>
        <text x="25" y="132" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#e2e8f0">luxurious cabin windows, and square-cornered cutouts.</text>
        
        <rect x="0" y="175" width="860" height="150" rx="16" fill="#080e1a" stroke="#881337" stroke-width="2"/>
        <rect x="25" y="200" width="100" height="40" rx="8" fill="#e11d48"/>
        <text x="75" y="227" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">1954</text>
        <text x="150" y="227" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="#f43f5e">Two Tragic In-Flight Breakups</text>
        <text x="25" y="280" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#94a3b8">Comet airframes G-ALYP and G-ALYY suffer catastrophic disintegrations</text>
        <text x="25" y="307" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#e2e8f0">at cruising altitude, completely grounding the global fleet.</text>
        
        <rect x="0" y="350" width="860" height="150" rx="16" fill="#080e1a" stroke="#1e293b" stroke-width="2"/>
        <rect x="25" y="375" width="100" height="40" rx="8" fill="#d97706"/>
        <text x="75" y="402" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">INQUIRY</text>
        <text x="150" y="402" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="#f59e0b">RAE Farnborough Forensic Testing</text>
        <text x="25" y="455" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#94a3b8">Sir Arnold Hall leads the first full-scale forensic crash inquiry in history,</text>
        <text x="25" y="482" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#e2e8f0">pioneering cyclic pressurization water-tank tests on entire airframes.</text>
      </g>
      
      <!-- Source Documentation Reference -->
      <g transform="translate(110, 1060)">
        <rect x="0" y="0" width="860" height="165" rx="16" fill="#1e293b" fill-opacity="0.6" stroke="#475569" stroke-width="1.5"/>
        <text x="35" y="45" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#94a3b8">HISTORICAL ENGINEERING REFERENCE</text>
        <text x="35" y="85" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff">Report of the Public Inquiry into the de Havilland Comet Failures</text>
        <text x="35" y="120" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#38bdf8">Royal Aircraft Establishment (RAE) Farnborough • Lord Cohen Court of Inquiry (1954)</text>
        <text x="35" y="148" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#94a3b8">FAA Lessons Learned Database: G-ALYP / G-ALYV Transport Airplane Accident Records</text>
      </g>
    `;
  } else if (index === 2) {
    // 03: STRESS CONCENTRATION (The Physics)
    contentSvg = `
      <rect x="80" y="295" width="920" height="1180" rx="28" fill="#111c30" stroke="#334155" stroke-width="2"/>
      
      <rect x="110" y="325" width="280" height="42" rx="21" fill="#1e293b"/>
      <text x="250" y="353" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#94a3b8" text-anchor="middle" letter-spacing="1">03 // ENGINEERING PHYSICS</text>
      
      <rect x="740" y="325" width="230" height="42" rx="21" fill="#064e3b" stroke="#059669" stroke-width="1"/>
      <text x="855" y="352" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#34d399" text-anchor="middle">STRESS MECHANICS</text>
      
      <text x="110" y="425" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff">How Sharp Corners Multiply Stress</text>
      <text x="110" y="465" font-family="Segoe UI, Arial, sans-serif" font-size="24" fill="#94a3b8">The stark contrast between square and rounded fuselage cutouts</text>
      
      <!-- Side-by-Side Comparison -->
      <g transform="translate(110, 510)">
        <!-- Left: Square Window -->
        <rect x="0" y="0" width="415" height="540" rx="20" fill="#080e1a" stroke="#881337" stroke-width="2.5"/>
        <rect x="25" y="25" width="365" height="40" rx="8" fill="#e11d48"/>
        <text x="207" y="52" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">SQUARE CORNERS</text>
        
        <rect x="107" y="110" width="200" height="200" rx="4" fill="#1e293b" stroke="#64748b" stroke-width="3"/>
        
        <!-- Stress Spikes at 4 corners -->
        <circle cx="107" cy="110" r="28" fill="#e11d48" fill-opacity="0.35"/>
        <circle cx="107" cy="110" r="14" fill="#f43f5e"/>
        <line x1="85" y1="88" x2="100" y2="103" stroke="#fbbf24" stroke-width="4"/>
        
        <circle cx="307" cy="110" r="28" fill="#e11d48" fill-opacity="0.35"/>
        <circle cx="307" cy="110" r="14" fill="#f43f5e"/>
        <line x1="329" y1="88" x2="314" y2="103" stroke="#fbbf24" stroke-width="4"/>
        
        <circle cx="107" cy="310" r="28" fill="#e11d48" fill-opacity="0.35"/>
        <circle cx="107" cy="310" r="14" fill="#f43f5e"/>
        
        <circle cx="307" cy="310" r="28" fill="#e11d48" fill-opacity="0.35"/>
        <circle cx="307" cy="310" r="14" fill="#f43f5e"/>
        
        <text x="207" y="360" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#f43f5e" text-anchor="middle">Extreme Stress Concentration</text>
        <text x="25" y="405" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#e2e8f0">• Mechanical stress lines bottleneck</text>
        <text x="25" y="435" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#e2e8f0">• Tensile hoop stress spikes at 90° points</text>
        <text x="25" y="465" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#e2e8f0">• Cyclic fatigue cracks spawn at rivet holes</text>
        <text x="25" y="505" font-family="Segoe UI, Arial, sans-serif" font-size="17" font-weight="bold" fill="#fda4af">Result: Premature metal rupture</text>
        
        <!-- Right: Rounded Window -->
        <rect x="445" y="0" width="415" height="540" rx="20" fill="#080e1a" stroke="#047857" stroke-width="2.5"/>
        <rect x="470" y="25" width="365" height="40" rx="8" fill="#059669"/>
        <text x="652" y="52" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">ROUNDED CORNERS</text>
        
        <rect x="552" y="110" width="200" height="200" rx="60" fill="#1e293b" stroke="#10b981" stroke-width="4"/>
        
        <!-- Smooth concentric stress lines -->
        <rect x="532" y="90" width="240" height="240" rx="80" fill="none" stroke="#10b981" stroke-width="2.5" stroke-dasharray="6 4" stroke-opacity="0.6"/>
        <rect x="512" y="70" width="280" height="280" rx="100" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="6 4" stroke-opacity="0.3"/>
        
        <text x="652" y="360" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#34d399" text-anchor="middle">Uniform Stress Redistribution</text>
        <text x="470" y="405" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#e2e8f0">• Stress flows smoothly around curve</text>
        <text x="470" y="435" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#e2e8f0">• Peak geometric stress is drastically reduced</text>
        <text x="470" y="465" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#e2e8f0">• Hull withstands tens of thousands of cycles</text>
        <text x="470" y="505" font-family="Segoe UI, Arial, sans-serif" font-size="17" font-weight="bold" fill="#6ee7b7">Result: High cyclic fatigue life</text>
      </g>
      
      <!-- Bottom Physics Principle -->
      <g transform="translate(110, 1080)">
        <rect x="0" y="0" width="860" height="145" rx="16" fill="#082f49" fill-opacity="0.5" stroke="#0284c7" stroke-width="2"/>
        <text x="35" y="45" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#38bdf8">THE GEOMETRIC PRINCIPLE</text>
        <text x="35" y="85" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#e2e8f0">Any sharp angle acts as a "stress raiser" in a pressurized pressure vessel.</text>
        <text x="35" y="118" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#facc15">Curving the cutout eliminates the focal point, allowing fuselage metal to share load.</text>
      </g>
    `;
  } else if (index === 3) {
    // 04: FORENSIC EVIDENCE (G-ALYP vs G-ALYU)
    contentSvg = `
      <rect x="80" y="295" width="920" height="1180" rx="28" fill="#111c30" stroke="#334155" stroke-width="2"/>
      
      <rect x="110" y="325" width="270" height="42" rx="21" fill="#1e293b"/>
      <text x="245" y="353" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#94a3b8" text-anchor="middle" letter-spacing="1">04 // FORENSIC EVIDENCE</text>
      
      <rect x="730" y="325" width="240" height="42" rx="21" fill="#312e81" stroke="#4f46e5" stroke-width="1"/>
      <text x="850" y="352" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#818cf8" text-anchor="middle">PRIMARY SOURCES</text>
      
      <text x="110" y="425" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff">Distinguishing the Forensic Proof</text>
      <text x="110" y="465" font-family="Segoe UI, Arial, sans-serif" font-size="24" fill="#94a3b8">The accident wreckage vs the full-scale water-tank simulation</text>
      
      <!-- 2 Cards with ample spacing -->
      <g transform="translate(110, 510)">
        <!-- Top Card: G-ALYP -->
        <rect x="0" y="0" width="860" height="260" rx="18" fill="#080e1a" stroke="#d97706" stroke-width="2"/>
        <rect x="25" y="25" width="260" height="36" rx="8" fill="#b45309"/>
        <text x="155" y="49" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">FLIGHT G-ALYP (WRECKAGE)</text>
        <text x="305" y="50" font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="bold" fill="#f59e0b">In-Flight Failure: Roof Antenna Cutout</text>
        
        <text x="25" y="100" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#94a3b8">• Royal Navy divers recovered Mediterranean seabed wreckage of Comet G-ALYP.</text>
        <text x="25" y="130" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#e2e8f0">• Metallurgical analysis proved the in-flight fracture originated at a rivet hole near the</text>
        <text x="25" y="160" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#fbbf24">  corner of the rear ADF (Automatic Direction Finder) roof antenna cutout — NOT a window.</text>
        <text x="25" y="200" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#cbd5e1">Key Fact: Popular retellings often conflate the roof antenna origin with window corners.</text>
        <text x="25" y="230" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#64748b">Citation: RAE Farnborough Report Chapter 3 • Lord Cohen Inquiry (1954)</text>
        
        <!-- Bottom Card: G-ALYU -->
        <rect x="0" y="290" width="860" height="260" rx="18" fill="#080e1a" stroke="#0284c7" stroke-width="2"/>
        <rect x="25" y="315" width="260" height="36" rx="8" fill="#0369a1"/>
        <text x="155" y="339" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">COMET G-ALYU (WATER TANK)</text>
        <text x="305" y="340" font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="bold" fill="#38bdf8">Tank Test Failure: Window Corners</text>
        
        <text x="25" y="390" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#94a3b8">• A complete Comet airframe (G-ALYU) was submerged in a 250,000-gallon water tank.</text>
        <text x="25" y="420" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#e2e8f0">• After 3,057 simulated flight cycles, the fuselage ruptured dramatically.</text>
        <text x="25" y="450" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#38bdf8">  The fatigue crack initiated directly at the sharp corner of a passenger escape hatch window.</text>
        <text x="25" y="490" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#cbd5e1">Proof: Proved definitively that square cutouts anywhere on the fuselage hull initiate fatigue cracks.</text>
        <text x="25" y="520" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#64748b">Citation: RAE Full-Scale Tank Fatigue Investigation Records (1954)</text>
      </g>
      
      <!-- Factual Nuance Box -->
      <g transform="translate(110, 1090)">
        <rect x="0" y="0" width="860" height="135" rx="16" fill="#1e1b4b" fill-opacity="0.6" stroke="#4338ca" stroke-width="2"/>
        <text x="35" y="42" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#a5b4fc">ACCURATE HISTORICAL RECORD</text>
        <text x="35" y="80" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#e2e8f0">G-ALYP proved roof cutout vulnerability in flight. G-ALYU proved window corner</text>
        <text x="35" y="110" font-family="Segoe UI, Arial, sans-serif" font-size="19" font-weight="bold" fill="#c7d2fe">vulnerability under cyclic tank pressure. Both share the exact same stress mechanics.</text>
      </g>
    `;
  } else if (index === 4) {
    // 05: MODERN SAFETY (Multi-Layer Defense)
    contentSvg = `
      <rect x="80" y="295" width="920" height="1180" rx="28" fill="#111c30" stroke="#334155" stroke-width="2"/>
      
      <rect x="110" y="325" width="270" height="42" rx="21" fill="#1e293b"/>
      <text x="245" y="353" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#94a3b8" text-anchor="middle" letter-spacing="1">05 // MODERN SAFETY</text>
      
      <rect x="730" y="325" width="240" height="42" rx="21" fill="#047857" stroke="#10b981" stroke-width="1"/>
      <text x="850" y="352" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#6ee7b7" text-anchor="middle">AIRWORTHINESS CODE</text>
      
      <text x="110" y="425" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff">Safety Beyond Shape Alone</text>
      <text x="110" y="465" font-family="Segoe UI, Arial, sans-serif" font-size="24" fill="#94a3b8">Curved geometry works in concert with multi-layer airframe design</text>
      
      <g transform="translate(110, 510)">
        <rect x="0" y="0" width="860" height="160" rx="16" fill="#080e1a" stroke="#1e293b" stroke-width="2"/>
        <circle cx="50" cy="50" r="24" fill="#0284c7"/>
        <text x="50" y="58" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">1</text>
        <text x="95" y="55" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">Curved / Elliptical Window Geometry</text>
        <text x="95" y="95" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#94a3b8">Continuous curvature eliminates stress concentration points,</text>
        <text x="95" y="125" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#e2e8f0">smoothly routing hoop tension around the passenger opening.</text>
        
        <rect x="0" y="185" width="860" height="160" rx="16" fill="#080e1a" stroke="#1e293b" stroke-width="2"/>
        <circle cx="50" cy="235" r="24" fill="#059669"/>
        <text x="50" y="243" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">2</text>
        <text x="95" y="240" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">Reinforcement Doubler Plates</text>
        <text x="95" y="280" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#94a3b8">Thickened structural rings riveted around every opening provide</text>
        <text x="95" y="310" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#e2e8f0">added metal cross-section, carrying diverted cabin pressure loads.</text>
        
        <rect x="0" y="370" width="860" height="160" rx="16" fill="#080e1a" stroke="#1e293b" stroke-width="2"/>
        <circle cx="50" cy="420" r="24" fill="#d97706"/>
        <text x="50" y="428" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">3</text>
        <text x="95" y="425" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">Damage-Tolerance Airworthiness Standards</text>
        <text x="95" y="465" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#94a3b8">FAA 14 CFR § 25.571 mandates cyclic fatigue crack growth analysis</text>
        <text x="95" y="495" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#e2e8f0">and residual strength testing across millions of flight pressurizations.</text>
      </g>
      
      <g transform="translate(110, 1075)">
        <rect x="0" y="0" width="860" height="150" rx="16" fill="#064e3b" fill-opacity="0.4" stroke="#059669" stroke-width="2"/>
        <text x="35" y="42" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#34d399">REGULATORY CLARIFICATION (FAA 14 CFR § 25.571)</text>
        <text x="35" y="80" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#e2e8f0">Regulations do not dictate one single window shape by decree.</text>
        <text x="35" y="115" font-family="Segoe UI, Arial, sans-serif" font-size="19" font-weight="bold" fill="#a7f3d0">They require comprehensive fatigue evaluation and proven damage tolerance.</text>
      </g>
    `;
  } else {
    // 06: THE TAKEAWAY & AUDIENCE ENGAGEMENT
    contentSvg = `
      <rect x="80" y="295" width="920" height="1180" rx="28" fill="#111c30" stroke="#334155" stroke-width="2"/>
      
      <rect x="110" y="325" width="220" height="42" rx="21" fill="#1e293b"/>
      <text x="220" y="353" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#94a3b8" text-anchor="middle" letter-spacing="1">06 // THE TAKEAWAY</text>
      
      <rect x="740" y="325" width="230" height="42" rx="21" fill="#3b0764" stroke="#9333ea" stroke-width="1"/>
      <text x="855" y="352" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#d8b4fe" text-anchor="middle">FINAL THOUGHTS</text>
      
      <text x="110" y="425" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff">The Big Picture</text>
      <text x="110" y="465" font-family="Segoe UI, Arial, sans-serif" font-size="24" fill="#94a3b8">How microscopic design decisions ensure passenger safety</text>
      
      <g transform="translate(110, 510)">
        <rect x="0" y="0" width="860" height="230" rx="20" fill="#080e1a" stroke="#38bdf8" stroke-width="2"/>
        <text x="40" y="55" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#38bdf8">CORE LESSON IN AVIATION ENGINEERING</text>
        <text x="40" y="105" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#ffffff">Rounded corners prevent geometric stress traps,</text>
        <text x="40" y="140" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#94a3b8">but true safety is achieved through continuous inspection, multi-path redundancy,</text>
        <text x="40" y="175" font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="bold" fill="#38bdf8">and strict damage-tolerance maintenance across the life of every airframe.</text>
      </g>
      
      <g transform="translate(110, 775)">
        <rect x="0" y="0" width="860" height="260" rx="20" fill="#451a03" fill-opacity="0.3" stroke="#d97706" stroke-width="2.5"/>
        <rect x="35" y="30" width="230" height="36" rx="8" fill="#d97706"/>
        <text x="150" y="55" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">DID YOU KNOW?</text>
        
        <text x="35" y="105" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#fbbf24">The Mystery of the Tiny Window Bleed Hole</text>
        <text x="35" y="150" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#e2e8f0">Have you ever noticed that tiny pinhole at the bottom of passenger windows?</text>
        <text x="35" y="185" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#94a3b8">It's a bleed valve that balances cabin pressure between the middle and outer panes,</text>
        <text x="35" y="220" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#fde68a">ensuring the heavy outer structural pane carries the primary pressure load!</text>
      </g>
      
      <g transform="translate(110, 1070)">
        <rect x="0" y="0" width="860" height="150" rx="16" fill="#1e293b" fill-opacity="0.6" stroke="#475569" stroke-width="1.5"/>
        <text x="430" y="50" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">Have you ever noticed the window bleed hole?</text>
        <text x="430" y="90" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#38bdf8" text-anchor="middle">Share your thoughts in the comments below!</text>
        <text x="430" y="125" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">Full FAA lessons learned &amp; engineering citations in description</text>
      </g>
    `;
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0b1120"/>
          <stop offset="50%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#070a12"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
      ${headerSvg}
      ${contentSvg}
      ${subtitleZoneSvg}
    </svg>
  `;
}

function buildGenericViewerCardSvg(options: SceneRenderOptions): string {
  const { displayTitle, segment, index, totalSegments } = options;
  const width = 1080;
  const height = 1920;

  const stepNumber = String(index + 1).padStart(2, '0');
  const stepLabel = index === 0
    ? '01 // OVERVIEW'
    : index === totalSegments - 1
      ? `${stepNumber} // TAKEAWAY`
      : `${stepNumber} // EVIDENCE &amp; ANALYSIS`;

  const primary = escapeXml(segment.visualPlan.primaryText || 'Key Insights');
  const secondary = escapeXml(segment.visualPlan.secondaryText || '');
  const badge = escapeXml(segment.visualPlan.badgeText || 'RESEARCH');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0b1120"/>
          <stop offset="50%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#070a12"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
      
      <!-- Top Topic Header -->
      <rect x="80" y="80" width="280" height="48" rx="24" fill="#083344" stroke="#00f0ff" stroke-width="2"/>
      <text x="220" y="112" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#00f0ff" text-anchor="middle" letter-spacing="1.5">TECHNICAL ANALYSIS</text>
      <text x="80" y="180" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="bold" fill="#ffffff">${escapeXml(displayTitle)}</text>
      <line x1="80" y1="230" x2="1000" y2="230" stroke="#1e293b" stroke-width="2"/>
      
      <!-- Main Content Card -->
      <rect x="80" y="270" width="920" height="1210" rx="28" fill="#111c30" stroke="#334155" stroke-width="2"/>
      
      <!-- Badge & Step -->
      <rect x="110" y="305" width="220" height="42" rx="21" fill="#1e293b"/>
      <text x="220" y="333" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#94a3b8" text-anchor="middle">${stepLabel}</text>
      
      <rect x="740" y="305" width="230" height="42" rx="21" fill="#0c4a6e" stroke="#0284c7" stroke-width="1"/>
      <text x="855" y="332" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#38bdf8" text-anchor="middle">${badge}</text>
      
      <text x="110" y="405" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff">${primary}</text>
      <text x="110" y="445" font-family="Segoe UI, Arial, sans-serif" font-size="24" fill="#94a3b8">${secondary}</text>
      
      <!-- Inner Panel -->
      <g transform="translate(110, 480)">
        <rect x="0" y="0" width="860" height="720" rx="20" fill="#080e1a" stroke="#1e293b" stroke-width="2"/>
        <text x="40" y="60" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="#38bdf8">DOCUMENTED SUMMARY</text>
        <text x="40" y="110" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#e2e8f0">${escapeXml(segment.text.slice(0, 160))}...</text>
      </g>
      
      <!-- Lower Subtitle Zone -->
      <rect x="60" y="1520" width="960" height="300" rx="24" fill="#0b1120" fill-opacity="0.85" stroke="#1e293b" stroke-width="1.5"/>
    </svg>
  `;
}
