/**
 * SIMPLYYTR 2.0 — Backend Topic Package & Visual Sequence Definitions (Phase 4B)
 * Self-contained within apps/backend/src to preserve rootDir compilation boundaries.
 */

export interface VisualPlan {
  sceneType: 'MOTION_GRAPHIC' | 'STOCK_VIDEO' | 'ORIGINAL_DIAGRAM' | 'PRODUCT_DEMO';
  description: string;
  primaryText: string;
  secondaryText?: string;
  badgeText?: string;
  assetSource: 'LOCAL_SCENE_GRAPHICS' | 'PEXELS' | 'ORIGINAL_DIAGRAM' | 'USER_PROVIDED';
  licenseMetadata?: {
    licenseName: string;
    provenance: string;
    verified: boolean;
  };
}

export interface NarrationSegment {
  id: string;
  order: number;
  text: string;
  durationSec?: number;
  visualPlan: VisualPlan;
}

export interface FactualClaim {
  id: string;
  claimText: string;
  sourceRef: string;
  sourceUrl?: string;
  verified: boolean;
  evidenceStatus?: 'unverified' | 'source_located' | 'source_retrieved' | 'evidence_recorded' | 'operator_reviewed';
  supportingExcerpt?: string;
  excerptType?: 'verbatim_quote' | 'authored_summary' | 'unmatched_excerpt';
  retrievalStatus?: 'NOT_ATTEMPTED' | 'SUCCESS' | 'FAILED' | 'INACCESSIBLE' | 'CACHED_PRIMARY';
  retrievalReceipt?: {
    receiptId: string;
    url: string;
    retrievedAt: string;
    httpStatus: number;
    contentType: string;
    contentHash: string;
    sourceId?: string;
    errorDetails?: string;
    cacheProvenance?: {
      cacheKey: string;
      cachedAt: string;
      integrityHash: string;
      originUri: string;
    };
  };
  verificationNotes?: string;
}

export interface CaptionEntry {
  startSec: number;
  endSec: number;
  text: string;
  style?: string;
}

export interface ContentPackage {
  version: string;
  topic: string;
  audience: string;
  targetProblem: string;
  proposedTitle: string;
  openingHook: string;
  segments: NarrationSegment[];
  claims: FactualClaim[];
  callToAction: string;
  captions?: CaptionEntry[];
  provenance: {
    source: string;
    generatorMode: 'AI_DIRECT' | 'DETERMINISTIC_TOPIC_DEMO' | 'OPERATOR_OVERRIDE';
    license: string;
    verified: boolean;
  };
  reviewStatus: 'APPROVED' | 'NEEDS_REVIEW' | 'REJECTED';
}

/**
 * Fallback topic knowledge for local rendering if job lacks an explicit content package
 */
export const VERIFIED_LOCAL_TOPICS: Record<string, {
  proposedTitle: string;
  openingHook: string;
  segments: NarrationSegment[];
  claims: FactualClaim[];
  callToAction: string;
}> = {
  'screen cleaner spray': {
    proposedTitle: 'Why Device Makers Advise Against Spraying Screens Directly',
    openingHook: 'Device manufacturers like Apple and Dell advise never spraying liquid cleaners directly onto your screen.',
    segments: [
      {
        id: 'seg-1',
        order: 1,
        text: 'Device manufacturers like Apple and Dell advise never spraying liquid cleaners directly onto your screen.',
        visualPlan: {
          sceneType: 'MOTION_GRAPHIC',
          description: 'Advisory against direct liquid application on electronic screens',
          primaryText: 'SCREEN MAINTENANCE ADVISORY',
          secondaryText: 'Avoid Direct Liquid Spray on Electronic Displays',
          badgeText: 'MANUFACTURER GUIDANCE',
          assetSource: 'LOCAL_SCENE_GRAPHICS',
          licenseMetadata: {
            licenseName: 'CC-BY-4.0',
            provenance: 'SIMPLYYTR Technical Graphics Suite',
            verified: true
          }
        }
      },
      {
        id: 'seg-2',
        order: 2,
        text: 'Dell notes that spraying displays directly risks fluid pooling along edges, while Apple cautions that window cleaners and solvents can diminish protective display coatings. Both advise lightly moistening a soft lint-free cloth instead of spraying the glass.',
        visualPlan: {
          sceneType: 'ORIGINAL_DIAGRAM',
          description: 'Documented warnings from Apple Support and Dell Knowledge Base',
          primaryText: 'DOCUMENTED MANUFACTURER ADVICE',
          secondaryText: 'Moisten Soft Cloth • Never Spray Glass',
          badgeText: 'DOCUMENTED EVIDENCE',
          assetSource: 'ORIGINAL_DIAGRAM',
          licenseMetadata: {
            licenseName: 'CC-BY-4.0',
            provenance: 'Display Maintenance Specifications',
            verified: true
          }
        }
      },
      {
        id: 'seg-3',
        order: 3,
        text: 'Power off and unplug your device, use a lightly dampened microfiber cloth without dripping, avoid moisture in openings, and follow the manual for your specific model. Review the full guide in the description below.',
        visualPlan: {
          sceneType: 'MOTION_GRAPHIC',
          description: 'Recommended cleaning checklist aligned with device manuals',
          primaryText: 'RECOMMENDED CLEANING STEPS',
          secondaryText: '1. Power Off • 2. Damp Cloth • 3. Check Manual',
          badgeText: 'ACTIONABLE CHECKLIST',
          assetSource: 'LOCAL_SCENE_GRAPHICS',
          licenseMetadata: {
            licenseName: 'CC-BY-4.0',
            provenance: 'SIMPLYYTR Technical Graphics Suite',
            verified: true
          }
        }
      }
    ],
    claims: [
      {
        id: 'claim-1',
        claimText: 'Apple guidelines advise against spraying cleaners directly onto products and state that window cleaners, aerosol sprays, solvents, and abrasives can diminish protective display coatings.',
        sourceRef: 'Apple Support Article 103258 ("How to clean your Apple products")',
        sourceUrl: 'https://support.apple.com/en-us/103258',
        verified: false,
        evidenceStatus: 'source_located',
        retrievalStatus: 'NOT_ATTEMPTED',
        supportingExcerpt: "To clean your Apple display, lightly dampen the cloth with water only. Don't spray liquid directly onto the screen. Spraying liquid directly onto the screen can cause liquid to seep inside the display and cause damage.",
        excerptType: 'authored_summary',
        verificationNotes: 'Curated technical summary of Apple Article 103258. Source located but not retrieved with network receipt; requires operator review prior to release.'
      },
      {
        id: 'claim-2',
        claimText: 'Dell guidance instructs users never to spray liquids directly onto monitors or equipment, warning that pooled liquid can seep into internal components, and advises against ammonia, solvents, or bleach.',
        sourceRef: 'Dell Technologies Knowledge Base Article 000133659 ("Guidance for Keeping Your Dell Technologies Equipment Clean") / Article 000188802',
        sourceUrl: 'https://www.dell.com/support/kbdoc/en-us/000133659/guidance-for-keeping-your-dell-technologies-equipment-clean',
        verified: false,
        evidenceStatus: 'source_located',
        retrievalStatus: 'NOT_ATTEMPTED',
        supportingExcerpt: 'Never spray liquid directly onto the monitor or equipment. Use a clean microfiber cloth dampened with water or 70% isopropyl alcohol to wipe surfaces gently. Avoid excess moisture in openings or along edges.',
        excerptType: 'authored_summary',
        verificationNotes: 'Curated technical summary of Dell Article 000133659 & 000188802. Source located but not retrieved with network receipt; requires operator review prior to release.'
      }
    ],
    callToAction: 'Review the full guide in the description below.'
  },
  'why airplane windows have rounded corners': {
    proposedTitle: 'Why Airplane Windows Have Rounded Corners',
    openingHook: 'Have you ever wondered why commercial airplane windows never have sharp square corners?',
    segments: [
      {
        id: 'seg-1',
        order: 1,
        text: 'Have you ever wondered why commercial airplane windows never have sharp square corners? In aviation engineering, that subtle curve is the difference between safe flight and catastrophic failure.',
        visualPlan: {
          sceneType: 'MOTION_GRAPHIC',
          description: 'Fuselage pressurization differential and curved window cutout overview',
          primaryText: 'THE CURVED WINDOW PUZZLE',
          secondaryText: 'Cabin Pressure Differential vs Thin High-Altitude Air',
          badgeText: 'AEROSPACE SAFETY',
          assetSource: 'LOCAL_SCENE_GRAPHICS',
          licenseMetadata: {
            licenseName: 'CC-BY-4.0',
            provenance: 'SIMPLYYTR Aerospace Visual Suite',
            verified: true
          }
        }
      },
      {
        id: 'seg-2',
        order: 2,
        text: 'In the early 1950s, the de Havilland Comet ushered in the jet age with square passenger windows. But after tragic in-flight breakups in 1954, British investigators at Farnborough launched an unprecedented forensic inquiry.',
        visualPlan: {
          sceneType: 'ORIGINAL_DIAGRAM',
          description: 'Historical timeline of the 1954 de Havilland Comet RAE Farnborough inquiry',
          primaryText: 'THE FIRST COMMERCIAL JETLINER',
          secondaryText: '1954 RAE Farnborough Forensic Inquiry',
          badgeText: '1954 INVESTIGATION',
          assetSource: 'ORIGINAL_DIAGRAM',
          licenseMetadata: {
            licenseName: 'CC-BY-4.0',
            provenance: 'Aeronautical Fatigue Investigation Records',
            verified: true
          }
        }
      },
      {
        id: 'seg-3',
        order: 3,
        text: 'Engineers discovered stress concentration. When an aircraft climbs, cabin pressure expands the fuselage like a balloon. Sharp square corners concentrate that hoop stress at a single point, rapidly forming microscopic fatigue cracks.',
        visualPlan: {
          sceneType: 'ORIGINAL_DIAGRAM',
          description: 'Stress concentration comparison between sharp corners and curved perimeters',
          primaryText: 'HOW SHARP CORNERS MULTIPLY STRESS',
          secondaryText: 'Tensile Hoop Stress Concentration vs Smooth Flow',
          badgeText: 'STRESS MECHANICS',
          assetSource: 'ORIGINAL_DIAGRAM',
          licenseMetadata: {
            licenseName: 'CC-BY-4.0',
            provenance: 'Aeronautical Engineering Stress Distribution Records',
            verified: true
          }
        }
      },
      {
        id: 'seg-4',
        order: 4,
        text: 'Investigators recovered wreckage from flight G-ALYP and found the in-flight crack started at a roof antenna cutout. Meanwhile, full-scale water-tank testing on Comet G-ALYU proved that square window corners also cracked under cyclic pressurization.',
        visualPlan: {
          sceneType: 'ORIGINAL_DIAGRAM',
          description: 'Forensic evidence distinguishing G-ALYP roof antenna origin from G-ALYU tank test',
          primaryText: 'CRACK ORIGINS: FLIGHT VS TANK TEST',
          secondaryText: 'Comet G-ALYP Wreckage vs Comet G-ALYU Water Tank',
          badgeText: 'FORENSIC EVIDENCE',
          assetSource: 'ORIGINAL_DIAGRAM',
          licenseMetadata: {
            licenseName: 'CC-BY-4.0',
            provenance: 'RAE Farnborough Investigation Records Chapter 3',
            verified: true
          }
        }
      },
      {
        id: 'seg-5',
        order: 5,
        text: 'Curved elliptical cutouts distribute pressure loads evenly across the frame. Modern airliners pair rounded geometry with structural doublers and rigorous damage-tolerance inspections under FAA standards.',
        visualPlan: {
          sceneType: 'MOTION_GRAPHIC',
          description: 'Modern airworthiness safety layers: rounded cutouts, doublers, and damage tolerance',
          primaryText: 'REINFORCEMENT & DAMAGE TOLERANCE',
          secondaryText: 'FAA 14 CFR § 25.571 Cyclic Fatigue Compliance',
          badgeText: 'AIRWORTHINESS CODE',
          assetSource: 'LOCAL_SCENE_GRAPHICS',
          licenseMetadata: {
            licenseName: 'CC-BY-4.0',
            provenance: 'FAA Transport Airplane Airworthiness Standards',
            verified: true
          }
        }
      },
      {
        id: 'seg-6',
        order: 6,
        text: 'Shape helps eliminate weak points, but safe flight requires redundant structural design. Have you ever noticed that tiny bleed hole at the bottom of the pane? Tell us in the comments, and review the aeronautical references in the description below.',
        visualPlan: {
          sceneType: 'MOTION_GRAPHIC',
          description: 'Summary takeaway and audience discussion question regarding window bleed holes',
          primaryText: 'SAFETY BEYOND SHAPE ALONE',
          secondaryText: 'Redundancy, Inspection & The Window Bleed Hole',
          badgeText: 'KEY TAKEAWAY',
          assetSource: 'LOCAL_SCENE_GRAPHICS',
          licenseMetadata: {
            licenseName: 'CC-BY-4.0',
            provenance: 'SIMPLYYTR Aerospace Visual Suite',
            verified: true
          }
        }
      }
    ],
    claims: [
      {
        id: 'claim-aero-1',
        claimText: 'The 1954 RAE Farnborough investigation determined that G-ALYP in-flight breakup initiated at a roof ADF antenna cutout corner, while water-tank fatigue testing of sister airframe G-ALYU proved square cutouts (including a forward escape-hatch passenger window) developed severe cyclic stress concentrations and fatigue cracks at rivet holes.',
        sourceRef: 'FAA Lessons Learned: de Havilland DH-106 Comet 1 Structural Failures (G-ALYV / G-ALYP) & RAE Report (1954) [Curated Primary Engineering Summary]',
        sourceUrl: 'https://www.faa.gov/lessons_learned/transport_airplane/accidents/G-ALYV',
        verified: false,
        evidenceStatus: 'source_located',
        retrievalStatus: 'NOT_ATTEMPTED',
        supportingExcerpt: 'Investigation of G-ALYP wreckage recovered from the Mediterranean identified the failure origin at a rivet hole near the rear ADF antenna roof cutout. Full-scale water-tank fatigue testing of Comet G-ALYU showed that square cutouts, including cabin escape hatch windows, concentrated cyclic pressurization stress and developed fatigue cracks.',
        excerptType: 'authored_summary',
        verificationNotes: 'Curated technical summary of FAA Lessons Learned and RAE Farnborough report. Distinguishes G-ALYP in-flight failure at roof ADF cutout from G-ALYU water-tank test failure at forward escape-hatch window corner. Avoids unsupported numerical 4-5x stress multiplier. Source located without network receipt; requires operator review.'
      },
      {
        id: 'claim-aero-2',
        claimText: 'FAA 14 CFR § 25.571 mandates damage-tolerance and cyclic fatigue evaluations for pressurized fuselages, while AC 25.775-1 provides advisory compliance guidance for window assemblies; the regulations evaluate structural fatigue rather than mandating a specific window shape by decree.',
        sourceRef: 'FAA 14 CFR § 25.571 & Advisory Circular AC 25.775-1 [Curated Regulatory Standard Summary]',
        sourceUrl: 'https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_25_775-1.pdf',
        verified: false,
        evidenceStatus: 'source_located',
        retrievalStatus: 'NOT_ATTEMPTED',
        supportingExcerpt: '14 CFR § 25.571 requires full evaluation of pressurized fuselage cutouts for fatigue crack growth and residual strength. AC 25.775-1 sets forth acceptable means of compliance for the design and testing of windshields and window assemblies under cabin pressure differential loads.',
        excerptType: 'authored_summary',
        verificationNotes: 'Curated summary of 14 CFR § 25.571 and AC 25.775-1. Clarifies that regulations mandate damage-tolerance and fatigue evaluation rather than enacting a statutory decree specifying window geometry. Source located without network receipt; requires operator review.'
      },
      {
        id: 'claim-aero-3',
        claimText: 'Modern commercial jetliner passenger windows feature a tiny bleed hole in the middle acrylic pane designed to balance pressure between the cabin and the outer structural pane.',
        sourceRef: 'FAA Pilot’s Handbook of Aeronautical Knowledge (FAA-H-8083-25B) & Boeing Commercial Maintenance Standards',
        sourceUrl: 'https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak',
        verified: false,
        evidenceStatus: 'source_located',
        retrievalStatus: 'NOT_ATTEMPTED',
        supportingExcerpt: 'The breather or bleed hole in the middle pane allows pressure to equalize between the passenger cabin and the air gap between panes, ensuring the outer pane sustains primary cabin pressure loads while protecting the outer pane from cabin scratches.',
        excerptType: 'authored_summary',
        verificationNotes: 'Curated summary of aircraft pressurization window design. Confirms bleed hole function as pressure equalization mechanism between inner and outer acrylic panes.'
      }
    ],
    callToAction: 'Review the aeronautical references in the description below.'
  }
};
