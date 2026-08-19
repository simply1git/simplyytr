import { NextRequest } from 'next/server';
import { prisma } from '../lib/utils';

// GET /api/settings
export async function GET() {
  try {
    let settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: {} });
    }
    return Response.json({ settings });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Allowed fields whitelist for SystemSettings
    const allowedKeys = [
      'targetNiche', 'targetChannels', 'copyPasteMode', 'geminiTone',
      'enableSelfLearningAI', 'autoPilotEnabled', 'adSafeFilterEnabled',
      'trendJackingEnabled', 'rlyaLearningRate', 'renderEngine',
      'defaultVideoStyle', 'amazonAssociateTag', 'customAffiliatePrefix',
      'enableGlowCaptions', 'enableSplitScreen', 'enableCinematicLut',
      'voiceName', 'voiceGender', 'availableVoices', 'scrapeIntervalMinutes',
      'uploadTimes', 'videosPerDay', 'maxDownloadsPerRun', 'maxUploadsPerDay',
      'videoSpeed', 'audioBass', 'colorScramble', 'overlayText',
      'overlayPosition', 'overlayFontSize', 'replaceOriginalAudio', 'useGpu',
      'customTopicPrompt'
    ];

    const updateData: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    // Support legacy field mappings
    if (body.niche && !updateData.targetNiche) {
      updateData.targetNiche = body.niche;
    }

    const settings = await prisma.systemSettings.upsert({
      where: { id: 1 },
      create: updateData,
      update: updateData,
    });
    
    return Response.json({ status: 'success', settings });
  } catch (err: any) {
    console.error('[Settings] Error:', err);
    return Response.json({ error: String(err.message || err) }, { status: 500 });
  }
}
