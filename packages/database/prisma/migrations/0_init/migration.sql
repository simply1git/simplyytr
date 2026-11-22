-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenderJob" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "channelId" TEXT,
    "topic" TEXT NOT NULL,
    "scriptHook" TEXT,
    "scriptBody" TEXT,
    "scriptCta" TEXT,
    "visualPrompts" JSONB,
    "contentPackage" JSONB,
    "voiceName" TEXT NOT NULL DEFAULT 'en-US-GuyNeural',
    "contentIdRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "adSafeReplacements" JSONB DEFAULT '[]',
    "renderEngine" TEXT NOT NULL DEFAULT 'KAGGLE',
    "videoStyle" TEXT NOT NULL DEFAULT 'PRODUCT_FIND',
    "productName" TEXT,
    "productUrl" TEXT,
    "affiliateLink" TEXT,
    "pinnedCommentText" TEXT,
    "voiceoverUrl" TEXT,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "generatedTitle" TEXT,
    "generatedDescription" TEXT,
    "generatedTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publishedYoutubeId" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "avgWatchTime" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "retentionScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "statusMessage" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scriptedAt" TIMESTAMP(3),
    "renderedAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3),
    "analyticsSyncedAt" TIMESTAMP(3),

    CONSTRAINT "RenderJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendSignal" (
    "id" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "metadata" TEXT,
    "transcript" TEXT,
    "embedding" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "velocityPerHour" INTEGER NOT NULL DEFAULT 0,
    "predationScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "localFilePath" TEXT,
    "processedFilePath" TEXT,
    "downloadStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "youtubeViews" INTEGER NOT NULL DEFAULT 0,
    "publishedYoutubeId" TEXT,

    CONSTRAINT "TrendSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentBrief" (
    "id" TEXT NOT NULL,
    "generatedTitle" TEXT NOT NULL,
    "generatedScript" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "ContentBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoCandidate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "channelId" TEXT NOT NULL,

    CONSTRAINT "VideoCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishJob" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,

    CONSTRAINT "PublishJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "targetNiche" TEXT NOT NULL DEFAULT 'Motivation',
    "targetChannels" TEXT NOT NULL DEFAULT 'Alex Hormozi, Andrew Huberman, Joe Rogan, MrBeast, Motivation',
    "copyPasteMode" TEXT NOT NULL DEFAULT 'clone_avatar',
    "geminiTone" TEXT NOT NULL DEFAULT 'Clickbaity',
    "customTopicPrompt" TEXT,
    "enableSelfLearningAI" BOOLEAN NOT NULL DEFAULT false,
    "autoPilotEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoPublishOnline" BOOLEAN NOT NULL DEFAULT false,
    "adSafeFilterEnabled" BOOLEAN NOT NULL DEFAULT true,
    "trendJackingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rlyaLearningRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "renderEngine" TEXT NOT NULL DEFAULT 'HYBRID',
    "defaultVideoStyle" TEXT NOT NULL DEFAULT 'PRODUCT_FIND',
    "amazonAssociateTag" TEXT NOT NULL DEFAULT 'simplyytr-20',
    "customAffiliatePrefix" TEXT NOT NULL DEFAULT 'https://amzn.to/finds',
    "enableGlowCaptions" BOOLEAN NOT NULL DEFAULT true,
    "enableSplitScreen" BOOLEAN NOT NULL DEFAULT true,
    "enableCinematicLut" BOOLEAN NOT NULL DEFAULT true,
    "voiceName" TEXT NOT NULL DEFAULT 'en-US-GuyNeural',
    "voiceGender" TEXT NOT NULL DEFAULT 'Male',
    "availableVoices" JSONB NOT NULL DEFAULT '[{"name":"en-US-GuyNeural","gender":"Male","label":"Guy (US Male)"},{"name":"en-US-JennyNeural","gender":"Female","label":"Jenny (US Female)"},{"name":"en-US-AriaNeural","gender":"Female","label":"Aria (US Female)"},{"name":"en-GB-RyanNeural","gender":"Male","label":"Ryan (UK Male)"},{"name":"en-IN-PrabhatNeural","gender":"Male","label":"Prabhat (Indian Male)"},{"name":"en-IN-NeerjaNeural","gender":"Female","label":"Neerja (Indian Female)"}]',
    "scrapeIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "uploadTimes" TEXT NOT NULL DEFAULT '09:00,12:00,15:00,18:00',
    "videosPerDay" INTEGER NOT NULL DEFAULT 4,
    "lastScrapedAt" TIMESTAMP(3),
    "maxDownloadsPerRun" INTEGER NOT NULL DEFAULT 1,
    "maxUploadsPerDay" INTEGER NOT NULL DEFAULT 4,
    "videoSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1.05,
    "audioBass" INTEGER NOT NULL DEFAULT 3,
    "colorScramble" BOOLEAN NOT NULL DEFAULT true,
    "overlayText" TEXT NOT NULL DEFAULT 'Wait for the end...',
    "overlayPosition" TEXT NOT NULL DEFAULT 'CENTER',
    "overlayFontSize" INTEGER NOT NULL DEFAULT 80,
    "replaceOriginalAudio" BOOLEAN NOT NULL DEFAULT false,
    "useGpu" BOOLEAN NOT NULL DEFAULT false,
    "workerLastActiveAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundJob" (
    "id" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "BackgroundJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContentBriefToTrendSignal" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_youtubeId_key" ON "Channel"("youtubeId");

-- CreateIndex
CREATE UNIQUE INDEX "TrendSignal_youtubeId_key" ON "TrendSignal"("youtubeId");

-- CreateIndex
CREATE UNIQUE INDEX "PublishJob_videoId_key" ON "PublishJob"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentBriefToTrendSignal_AB_unique" ON "_ContentBriefToTrendSignal"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentBriefToTrendSignal_B_index" ON "_ContentBriefToTrendSignal"("B");

-- AddForeignKey
ALTER TABLE "RenderJob" ADD CONSTRAINT "RenderJob_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoCandidate" ADD CONSTRAINT "VideoCandidate_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishJob" ADD CONSTRAINT "PublishJob_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "VideoCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentBriefToTrendSignal" ADD CONSTRAINT "_ContentBriefToTrendSignal_A_fkey" FOREIGN KEY ("A") REFERENCES "ContentBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentBriefToTrendSignal" ADD CONSTRAINT "_ContentBriefToTrendSignal_B_fkey" FOREIGN KEY ("B") REFERENCES "TrendSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
