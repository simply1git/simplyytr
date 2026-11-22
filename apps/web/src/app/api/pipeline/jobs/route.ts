import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../lib/utils';
import { signMediaUrl } from '../../lib/mediaAuth';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function getProcessedArtifactPath(filename: string): string | null {
  const candidatePaths = [
    path.resolve(process.cwd(), 'storage/processed', filename),
    path.resolve(process.cwd(), '../../storage/processed', filename),
    path.resolve(process.cwd(), '../storage/processed', filename),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// GET /api/pipeline/jobs
// Returns all render jobs with their statuses and review artifacts for the dashboard.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where = status ? { status } : {};
    const jobs = await prisma.renderJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      select: {
        id: true,
        status: true,
        topic: true,
        generatedTitle: true,
        voiceName: true,
        views: true,
        ctr: true,
        statusMessage: true,
        error: true,
        retentionScore: true,
        contentIdRiskScore: true,
        renderEngine: true,
        videoStyle: true,
        productName: true,
        affiliateLink: true,
        pinnedCommentText: true,
        createdAt: true,
        scriptedAt: true,
        renderedAt: true,
        uploadedAt: true,
        publishedYoutubeId: true,
        videoUrl: true,
        thumbnailUrl: true,
        contentPackage: true,
      },
    });

    // Get counts per status
    const counts = await prisma.renderJob.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const statusCounts = counts.reduce((acc, c) => {
      acc[c.status] = c._count.id;
      return acc;
    }, {} as Record<string, number>);

    const signedJobs = jobs.map(j => {
      let pkg: any = null;
      if (j.contentPackage) {
        try {
          pkg = typeof j.contentPackage === 'string' ? JSON.parse(j.contentPackage) : j.contentPackage;
        } catch {
          pkg = null;
        }
      }
      const qualityProfile = pkg?.qualityProfile || 'STANDARD';

      // Check for review artifacts on disk
      const videoFilename = `${j.id}_short.mp4`;
      const thumbFilename = `${j.id}_thumb.jpg`;
      const contactSheetFilename = `${j.id}_contact_sheet.png`;
      const qualityReportFilename = `${j.id}_quality_report.json`;
      const diagnosticsFilename = `${j.id}_diagnostics.json`;
      const edpFilename = `${j.id}_edp.json`;
      const narrationFilename = `${j.id}_narration.wav`;
      const subtitlesFilename = `${j.id}_subtitles.ass`;

      const videoDiskPath = getProcessedArtifactPath(videoFilename);
      const thumbDiskPath = getProcessedArtifactPath(thumbFilename);
      const contactSheetDiskPath = getProcessedArtifactPath(contactSheetFilename);
      const qualityReportDiskPath = getProcessedArtifactPath(qualityReportFilename);
      const diagnosticsDiskPath = getProcessedArtifactPath(diagnosticsFilename);
      const edpDiskPath = getProcessedArtifactPath(edpFilename);
      const narrationDiskPath = getProcessedArtifactPath(narrationFilename);
      const subtitlesDiskPath = getProcessedArtifactPath(subtitlesFilename);

      // Read diagnostics if present on disk
      let diagnosticsData: any = null;
      if (diagnosticsDiskPath) {
        try {
          diagnosticsData = JSON.parse(fs.readFileSync(diagnosticsDiskPath, 'utf-8'));
        } catch {}
      }

      // Read quality report if present on disk
      let qualityReportData: any = null;
      if (qualityReportDiskPath) {
        try {
          qualityReportData = JSON.parse(fs.readFileSync(qualityReportDiskPath, 'utf-8'));
        } catch {}
      }

      // Read EDP if present on disk
      let edpData: any = null;
      if (edpDiskPath) {
        try {
          edpData = JSON.parse(fs.readFileSync(edpDiskPath, 'utf-8'));
        } catch {}
      }

      // Determine active videoUrl and thumbnailUrl
      const effectiveVideoUrl = j.videoUrl || (videoDiskPath ? `/api/media/${videoFilename}` : null);
      const effectiveThumbUrl = j.thumbnailUrl || (thumbDiskPath ? `/api/media/${thumbFilename}` : null);

      return {
        ...j,
        qualityProfile,
        videoUrl: signMediaUrl(effectiveVideoUrl),
        thumbnailUrl: signMediaUrl(effectiveThumbUrl),
        artifacts: {
          video: signMediaUrl(effectiveVideoUrl),
          thumbnail: signMediaUrl(effectiveThumbUrl),
          contactSheet: contactSheetDiskPath ? signMediaUrl('/api/media/' + contactSheetFilename) : null,
          qualityReport: qualityReportDiskPath ? signMediaUrl('/api/media/' + qualityReportFilename) : null,
          diagnostics: diagnosticsDiskPath ? signMediaUrl('/api/media/' + diagnosticsFilename) : null,
          edp: edpDiskPath ? signMediaUrl('/api/media/' + edpFilename) : null,
          narration: narrationDiskPath ? signMediaUrl('/api/media/' + narrationFilename) : null,
          subtitles: subtitlesDiskPath ? signMediaUrl('/api/media/' + subtitlesFilename) : null,
        },
        reviewArtifacts: {
          hasVideo: !!videoDiskPath || !!j.videoUrl,
          hasThumbnail: !!thumbDiskPath || !!j.thumbnailUrl,
          hasContactSheet: !!contactSheetDiskPath,
          hasQualityReport: !!qualityReportDiskPath,
          hasDiagnostics: !!diagnosticsDiskPath,
          hasEdp: !!edpDiskPath,
          hasNarration: !!narrationDiskPath,
          hasSubtitles: !!subtitlesDiskPath,
          videoUrl: signMediaUrl(effectiveVideoUrl),
          thumbnailUrl: signMediaUrl(effectiveThumbUrl),
          contactSheetUrl: contactSheetDiskPath ? signMediaUrl(`/api/media/${contactSheetFilename}`) : null,
          qualityReportUrl: qualityReportDiskPath ? signMediaUrl(`/api/media/${qualityReportFilename}`) : null,
          diagnosticsUrl: diagnosticsDiskPath ? signMediaUrl(`/api/media/${diagnosticsFilename}`) : null,
          edpUrl: edpDiskPath ? signMediaUrl(`/api/media/${edpFilename}`) : null,
          narrationUrl: narrationDiskPath ? signMediaUrl(`/api/media/${narrationFilename}`) : null,
          subtitlesUrl: subtitlesDiskPath ? signMediaUrl(`/api/media/${subtitlesFilename}`) : null,
        },
        diagnostics: diagnosticsData,
        qualityReport: qualityReportData,
        edp: edpData,
      };
    });

    return Response.json({ jobs: signedJobs, statusCounts, total: signedJobs.length });
  } catch (err) {
    console.error('[Pipeline Jobs] Error:', err);
    return Response.json({ jobs: [], statusCounts: {}, total: 0, warning: String(err) }, { status: 200 });
  }
}

