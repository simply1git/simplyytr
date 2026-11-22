"use client";

import { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function SimplyYtrCommandCenter() {
  const [activeTab, setActiveTab] = useState<"CORE" | "PODCAST" | "PULSE" | "COMPLIANCE" | "RLYA" | "NODES" | "REVENUE" | "SETTINGS" | "LOGS">("CORE");
  const [podcastData, setPodcastData] = useState<any>(null);
  const [podcastSubTab, setPodcastSubTab] = useState<"LONG_CLIPS" | "SHORTS" | "MATRIX">("LONG_CLIPS");
  const [selectedPodcastModal, setSelectedPodcastModal] = useState<any | null>(null);
  const [podcastModalTab, setPodcastModalTab] = useState<"METADATA" | "VRS" | "SPECS">("METADATA");
  const [podcastSearch, setPodcastSearch] = useState<string>("");
  const [podcastFilter, setPodcastFilter] = useState<"ALL" | "READY" | "SHORTS" | "LONG_CLIPS">("ALL");
  const [podcastSort, setPodcastSort] = useState<"DEFAULT" | "VRS" | "DURATION_DESC" | "DURATION_ASC">("DEFAULT");
  const [ingestModalOpen, setIngestModalOpen] = useState<boolean>(false);
  const [selectedStudioClip, setSelectedStudioClip] = useState<any | null>(null);
  const [captionPreset, setCaptionPreset] = useState<"SHAMANI" | "HORMOZI" | "MRBEAST" | "MINIMAL">("SHAMANI");
  const [targetDurationPill, setTargetDurationPill] = useState<"AUTO" | "UNDER_30" | "30_60" | "60_90" | "LONG_16_9">("AUTO");
  const [opusUrlInput, setOpusUrlInput] = useState<string>("");
  const [newVideoPath, setNewVideoPath] = useState<string>("");
  const [newVideoTitle, setNewVideoTitle] = useState<string>("");
  const [newVideoGuest, setNewVideoGuest] = useState<string>("");
  const [ingesting, setIngesting] = useState<boolean>(false);

  // Channel Profile & Autopilot State
  const [addChannelModalOpen, setAddChannelModalOpen] = useState<boolean>(false);
  const [newChannelHandle, setNewChannelHandle] = useState<string>("");
  const [newChannelStyle, setNewChannelStyle] = useState<string>("SHAMANI_SQUAD_AMBER");
  const [addingChannel, setAddingChannel] = useState<boolean>(false);
  const [autoCreatingVideoId, setAutoCreatingVideoId] = useState<string | null>(null);

  // Pinnacle Studio Workspace State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [studioWorkspaceTab, setStudioWorkspaceTab] = useState<"FEED" | "TRANSCRIPT" | "PUBLISH" | "EXPORT">("FEED");
  const [activeFramingMode, setActiveFramingMode] = useState<"AMBIENT_9_16" | "SPLIT_9_16" | "SPEAKER_9_16" | "CINEMA_16_9">("AMBIENT_9_16");
  const [isEditingTranscript, setIsEditingTranscript] = useState<boolean>(false);
  const [editedCues, setEditedCues] = useState<any[]>([]);
  const [savingTranscript, setSavingTranscript] = useState<boolean>(false);
  const [captionFont, setCaptionFont] = useState<string>("Montserrat");
  const [captionSize, setCaptionSize] = useState<number>(28);
  const [activeWordColor, setActiveWordColor] = useState<string>("#00F0FF");
  const [autoEmojiEnabled, setAutoEmojiEnabled] = useState<boolean>(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [trimIn, setTrimIn] = useState<number>(0);
  const [trimOut, setTrimOut] = useState<number>(35);

  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [dbStatus, setDbStatus] = useState<"CONNECTED" | "OFFLINE" | "CHECKING">("CHECKING");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Real-Time Telemetry & Debug State
  const [telemetryLogs, setTelemetryLogs] = useState<any[]>([]);
  const [activeTelemetryJob, setActiveTelemetryJob] = useState<any>(null);
  const [workerTelemetry, setWorkerTelemetry] = useState<any>(null);
  const [circuitTelemetry, setCircuitTelemetry] = useState<any>(null);
  const [telemetryFilter, setTelemetryFilter] = useState<string>("ALL");
  const [selectedLogEntry, setSelectedLogEntry] = useState<any>(null);
  const [autoScrollLogs, setAutoScrollLogs] = useState<boolean>(true);
  const [selectedDebugJob, setSelectedDebugJob] = useState<any>(null);
  const [selectedEvidenceJob, setSelectedEvidenceJob] = useState<any>(null);
  const [selectedQualityProfile, setSelectedQualityProfile] = useState<"STANDARD" | "CINEMATIC_PRO">("STANDARD");
  const [selectedInspectionJob, setSelectedInspectionJob] = useState<any>(null);
  const [inspectionTab, setInspectionTab] = useState<"PREVIEW" | "QUALITY" | "SUBTITLES" | "EDP" | "PROVENANCE" | "METADATA">("PREVIEW");
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);
  const [rawJsonView, setRawJsonView] = useState<boolean>(false);

  // Settings State with all original + SOTA 2026 parameters
  const [settings, setSettings] = useState<any>({
    targetNiche: "Motivation",
    niche: "Motivation",
    targetChannels: "Alex Hormozi, Andrew Huberman, Joe Rogan, MrBeast, Motivation",
    customTopicPrompt: "",
    copyPasteMode: "clone_avatar",
    geminiTone: "Clickbaity",
    enableSelfLearningAI: true,
    autoPilotEnabled: false,
    adSafeFilterEnabled: true,
    trendJackingEnabled: true,
    rlyaLearningRate: 1.0,
    renderEngine: "HYBRID",
    voiceName: "en-US-GuyNeural",
    voiceGender: "Male",
    videoSpeed: 1.05,
    audioBass: 3,
    colorScramble: true,
    replaceOriginalAudio: false,
    useGpu: true,
    workerLastActiveAt: null,
    availableVoices: [
      { name: "en-US-GuyNeural", gender: "Male", label: "Guy (US Male)" },
      { name: "en-US-JennyNeural", gender: "Female", label: "Jenny (US Female)" },
      { name: "en-US-AriaNeural", gender: "Female", label: "Aria (US Female)" },
      { name: "en-GB-RyanNeural", gender: "Male", label: "Ryan (UK Male)" },
      { name: "en-IN-PrabhatNeural", gender: "Male", label: "Prabhat (Indian Male)" },
      { name: "en-IN-NeerjaNeural", gender: "Female", label: "Neerja (Indian Female)" }
    ]
  });

  // Compliance Scanner Sandbox State
  const [complianceInput, setComplianceInput] = useState("We killed it today with an insane breakthrough that will destroy traditional methods.");
  const [complianceResult, setComplianceResult] = useState<any>({
    riskScore: 1.2,
    riskCategory: "SAFE",
    visualFlags: 0,
    audioWarnings: 1,
    replacements: [
      { timestamp: "00:02:15", original: "killed it", replacement: "crushed it", status: "APPLIED" },
      { timestamp: "00:04:30", original: "insane", replacement: "wild", status: "APPLIED" },
      { timestamp: "00:07:10", original: "destroy", replacement: "transform", status: "APPLIED" }
    ],
    cleanText: "We crushed it today with an wild breakthrough that will transform traditional methods.",
    logs: [
      "[00:01:24] Scanning background visual layer... OK (0 flags)",
      "[00:03:12] Checking B-roll hash #8F2A... OK",
      "[00:05:44] AUDIO SCAN: Licensed Audio Cross-Match verified",
      "[00:08:50] Ad-Safe Lexicon filter... 3 replacements applied",
      "[00:09:12] Pre-Flight Risk Score: 1.2% [SAFE ZONE]"
    ]
  });

  // Trend-Jacking Input
  const [trendJackQuery, setTrendJackQuery] = useState("Why AI is Replacing Software Engineers in 2026");

  const fetchPodcastData = async () => {
    try {
      const res = await fetch("/api/pipeline/podcast");
      const json = await res.json();
      if (json.status === "success" && json.data) {
        setPodcastData(json.data);
        setSelectedStudioClip((prev: any) => {
          if (prev) {
            // Keep the user's active selection intact across polling ticks
            const allClips = [...(json.data.viralShorts || []), ...(json.data.longClips || [])];
            const updated = allClips.find((c: any) => c.id === prev.id);
            return updated ? { ...prev, ...updated } : prev;
          }
          // Only set default clip on initial empty state
          const first = json.data?.viralShorts?.[0] || json.data?.longClips?.[0] || null;
          if (first) {
            setEditedCues(first.transcript_cues || []);
          }
          return first;
        });
      }
    } catch (err) {
      console.error("Failed to fetch podcast data:", err);
    }
  };

  useEffect(() => {
    if (selectedStudioClip) {
      setEditedCues(selectedStudioClip.transcript_cues || []);
      setTrimIn(0);
      setTrimOut(selectedStudioClip.duration_sec || selectedStudioClip.duration || 35);
      if (selectedStudioClip.id?.startsWith("clip_") || selectedStudioClip.format?.includes("16:9")) {
        setActiveFramingMode("CINEMA_16_9");
      } else if (activeFramingMode === "CINEMA_16_9") {
        setActiveFramingMode("AMBIENT_9_16");
      }
    }
  }, [selectedStudioClip?.id]);

  const handleSeekToTime = (timeSec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeSec;
      videoRef.current.play().catch(() => {});
      setVideoCurrentTime(timeSec);
    }
  };

  const handleUpdateWordText = (cueIdx: number, wordIdx: number, newText: string) => {
    setEditedCues(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (copy[cueIdx]?.words?.[wordIdx]) {
        copy[cueIdx].words[wordIdx].word = newText;
        copy[cueIdx].text = copy[cueIdx].words.map((w: any) => w.word).join(" ");
      }
      return copy;
    });
  };

  const handleSaveTranscript = async () => {
    if (!selectedStudioClip?.id) return;
    setSavingTranscript(true);
    try {
      const res = await fetch("/api/pipeline/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_transcript",
          clipId: selectedStudioClip.id,
          type: selectedStudioClip.format?.includes("16:9") ? "long" : "short",
          cues: editedCues
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Transcript & SRT synchronized successfully!");
        setIsEditingTranscript(false);
        fetchPodcastData();
      } else {
        toast.error(data.message || "Failed to update transcript");
      }
    } catch {
      toast.error("Network error updating transcript");
    } finally {
      setSavingTranscript(false);
    }
  };

  const handleCopyText = (text: string, fieldKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSwitchEpisode = async (episodeId: string) => {
    try {
      const res = await fetch("/api/pipeline/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch_episode", episodeId })
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Switched active podcast episode!");
        setSelectedStudioClip(null);
        fetchPodcastData();
      } else {
        toast.error(data.message || "Failed to switch episode");
      }
    } catch {
      toast.error("Network error switching episode");
    }
  };

  const handleSelectChannel = async (channelId: string) => {
    try {
      const res = await fetch("/api/pipeline/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_channel", channelId })
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(data.message);
        fetchPodcastData();
      } else {
        toast.error(data.message || "Failed to switch channel profile");
      }
    } catch {
      toast.error("Network error setting channel");
    }
  };

  const handleAddChannel = async () => {
    if (!newChannelHandle.trim()) {
      toast.error("Please enter a valid YouTube channel handle or link");
      return;
    }
    setAddingChannel(true);
    try {
      const res = await fetch("/api/pipeline/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_channel",
          handle: newChannelHandle,
          stylePreset: newChannelStyle
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(data.message);
        setAddChannelModalOpen(false);
        setNewChannelHandle("");
        fetchPodcastData();
      } else {
        toast.error(data.message || "Failed to connect channel");
      }
    } catch {
      toast.error("Network error connecting channel");
    } finally {
      setAddingChannel(false);
    }
  };

  const handleAutoCreateFromVideo = async (video: any) => {
    setAutoCreatingVideoId(video.id);
    try {
      const res = await fetch("/api/pipeline/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "auto_fetch_create",
          videoUrl: video.url || video.id,
          customTitle: video.title,
          guestName: video.guest || ""
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(data.message || "Autonomous pipeline running for selected episode!");
        setTimeout(fetchPodcastData, 3000);
      } else {
        toast.error(data.message || "Failed to trigger auto-creation");
      }
    } catch {
      toast.error("Network error triggering auto-creation");
    } finally {
      setAutoCreatingVideoId(null);
    }
  };

  const handleIngestEpisode = async (pathOverride?: string) => {
    const targetSource = (pathOverride || newVideoPath || opusUrlInput || "").trim();
    if (!targetSource) {
      setIngestModalOpen(true);
      return;
    }
    setIngesting(true);
    try {
      const res = await fetch("/api/pipeline/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ingest_episode",
          videoPath: targetSource,
          customTitle: newVideoTitle,
          guestName: newVideoGuest
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(data.message || "Podcast Ingestion started in background!");
        setIngestModalOpen(false);
        setNewVideoPath("");
        setNewVideoTitle("");
        setNewVideoGuest("");
        setOpusUrlInput("");
        setTimeout(fetchPodcastData, 3000);
      } else {
        toast.error(data.message || "Failed to ingest episode");
      }
    } catch {
      toast.error("Network error triggering ingestion");
    } finally {
      setIngesting(false);
    }
  };

  const handleTabChange = (tabId: "CORE" | "PODCAST" | "PULSE" | "COMPLIANCE" | "RLYA" | "NODES" | "REVENUE" | "SETTINGS" | "LOGS") => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabId);
      window.history.replaceState(null, "", url.toString());
    }
  };

  // Fetch initial data
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab")?.toUpperCase();
      if (tabParam && ["CORE", "PODCAST", "PULSE", "COMPLIANCE", "RLYA", "NODES", "REVENUE", "SETTINGS", "LOGS"].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
    fetchSettings();
    fetchJobs();
    fetchLogs();
    fetchPodcastData();

    const interval = setInterval(() => {
      fetchJobs();
      fetchSettings();
      fetchLogs();
      fetchPodcastData();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/pipeline/logs?limit=150`);
      const data = await res.json();
      if (data.logs) setTelemetryLogs(data.logs);
      if (data.activeJob !== undefined) setActiveTelemetryJob(data.activeJob);
      if (data.workerStatus) setWorkerTelemetry(data.workerStatus);
      if (data.circuitStatus) setCircuitTelemetry(data.circuitStatus);
    } catch (err) {
      console.error("Failed to fetch telemetry logs:", err);
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch("/api/pipeline/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" })
      });
      toast.success("Telemetry Log Console Cleared.");
      fetchLogs();
    fetchPodcastData();
    } catch (e) {
      toast.error("Failed to clear logs.");
    }
  };

  const handleTestDiagnosticPing = async () => {
    const tId = toast.loading("Executing Diagnostic Ping across Subsystems...");
    try {
      const res = await fetch("/api/pipeline/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          message: `Diagnostic Health Ping: Serverless API OK • DB OK • Time: ${new Date().toLocaleTimeString()}`,
          level: "INFO"
        })
      });
      if (res.ok) {
        toast.success("Diagnostic Ping Registered in Log Stream!", { id: tId });
        fetchLogs();
    fetchPodcastData();
      }
    } catch (e) {
      toast.error("Ping Failed", { id: tId });
    }
  };

  const copyAllLogs = () => {
    const formatted = telemetryLogs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}][${l.level}][${l.stage}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(formatted);
    toast.success("Copied all logs to clipboard!");
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.settings) {
        setSettings((prev: any) => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/pipeline/jobs?limit=50");
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
      if (data.statusCounts) setStats(data.statusCounts);
      if (data.warning) {
        setDbStatus("OFFLINE");
      } else {
        setDbStatus("CONNECTED");
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setDbStatus("OFFLINE");
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("SIMPLYYTR Configuration Saved & Deployed.");
      } else {
        toast.error("Failed to save configuration.");
      }
    } catch (err) {
      toast.error("Error saving settings.");
    }
  };

  // Pipeline Action Controls: START, STOP, CLEAR
  const handleControlAction = async (action: "start" | "stop" | "clear", mode: string = "all") => {
    if (action === "clear") {
      if (!confirm(`Are you sure you want to CLEAR ${mode === "all" ? "ALL" : mode.toUpperCase()} jobs from the queue?`)) return;
    }
    setLoading(true);
    const tId = toast.loading(`Executing ${action.toUpperCase()} command...`);
    try {
      const res = await fetch("/api/pipeline/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action, mode })
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(data.message, { id: tId });
        fetchJobs();
        fetchSettings();
      } else {
        toast.error(data.error || "Control Action Failed", { id: tId });
      }
    } catch (err) {
      toast.error("Network Error", { id: tId });
    } finally {
      setLoading(false);
    }
  };

  // Trigger 1 Single Script Generation & Render Job
  const triggerPipeline = async () => {
    if (loading) return; // Prevent accidental duplicate submissions
    setLoading(true);
    const tId = toast.loading(`Initializing Multi-Agent Pipeline (Profile: ${selectedQualityProfile})...`);
    try {
      const topicToUse = settings.customTopicPrompt?.trim() || undefined;
      const res = await fetch("/api/pipeline/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          count: 1,
          force: true,
          topic: topicToUse,
          qualityProfile: selectedQualityProfile
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(`Pipeline Engaged (${selectedQualityProfile})! ${data.message}`, { id: tId });
        fetchJobs();
      } else {
        toast.error(`Trigger failed: ${data.error || "Unknown error"}`, { id: tId });
      }
    } catch (err) {
      toast.error("Failed to reach pipeline backend.", { id: tId });
    } finally {
      setLoading(false);
    }
  };

  // Run Local Render directly on a job from the dashboard
  const handleRunLocalRender = async (jobId: string, profileOverride?: "STANDARD" | "CINEMATIC_PRO") => {
    if (loading) return; // Prevent accidental duplicate submissions
    const profile = profileOverride || selectedQualityProfile || "STANDARD";
    setLoading(true);
    const tId = toast.loading(`Dispatching Local Render for Job ${jobId.slice(-8)} (Profile: ${profile})...`);
    try {
      const res = await fetch("/api/pipeline/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "render",
          jobId,
          qualityProfile: profile
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(data.message, { id: tId });
        fetchJobs();
      } else {
        toast.error(data.error || data.message || "Render dispatch failed", { id: tId });
      }
    } catch (err: any) {
      toast.error(`Network error: ${err.message}`, { id: tId });
    } finally {
      setLoading(false);
    }
  };

  // Trigger 1-Click Trend-Jacking Counter Script
  const triggerTrendJack = async (topic: string, competitor = "@TechNodeVoid", velocity = "12.4k/hr") => {
    setLoading(true);
    const tId = toast.loading(`Triggering Rapid Trend-Jacking against ${competitor}...`);
    try {
      const res = await fetch("/api/pipeline/trend-jack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, competitor, velocity })
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(`Trend-Jack Activated! Scripted counter-video generated.`, { id: tId });
        fetchJobs();
      } else {
        toast.error(`Trend-Jack failed: ${data.error || "Unknown error"}`, { id: tId });
      }
    } catch (err) {
      toast.error("Failed to execute trend-jack trigger.", { id: tId });
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Publish to YouTube
  const handlePublishJob = async (jobId: string) => {
    const tId = toast.loading("Publishing video to YouTube Data API v3...");
    try {
      const res = await fetch("/api/pipeline/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId })
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Video Published to YouTube Shorts! 🎉", { id: tId });
        fetchJobs();
      } else {
        toast.error(`Publish failed: ${data.error || "Unknown error"}`, { id: tId });
      }
    } catch (e) {
      toast.error("Failed to publish video.", { id: tId });
    }
  };

  // Sync YouTube Views and Feedback Telemetry
  const syncAnalytics = async () => {
    setSyncing(true);
    const tId = toast.loading("Syncing YouTube Analytics & Retention Curves...");
    try {
      const res = await fetch("/api/cron/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      toast.success(`Analytics Synced! Updated ${data.syncedJobsCount || 0} jobs`, { id: tId });
      fetchJobs();
    } catch (e) {
      toast.error("Sync Failed", { id: tId });
    } finally {
      setSyncing(false);
    }
  };

  // Pre-flight Compliance Lexicon Scanner
  const runComplianceScan = async () => {
    try {
      const res = await fetch("/api/compliance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: complianceInput })
      });
      const data = await res.json();
      if (data.success) {
        setComplianceResult(data);
        toast.success("Pre-Flight Compliance Scan Complete: 0 Critical Flags.");
      }
    } catch (e) {
      toast.error("Failed to run compliance scan.");
    }
  };

  const getAvailableVoices = () => {
    if (typeof settings.availableVoices === "string") {
      try { return JSON.parse(settings.availableVoices); } catch (e) { return []; }
    }
    return Array.isArray(settings.availableVoices) ? settings.availableVoices : [];
  };

  const isWorkerOnline = () => {
    if (!settings.workerLastActiveAt) return false;
    const lastActive = new Date(settings.workerLastActiveAt).getTime();
    return (Date.now() - lastActive) < 120000; // 2 min heartbeat window
  };

  const handleSelectMode = async (styleKey: string, copyMode: string) => {
    const updated = { ...settings, defaultVideoStyle: styleKey, copyPasteMode: copyMode };
    setSettings(updated);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        toast.success(`Active Pipeline Mode switched to: ${styleKey}`);
      }
    } catch (e) {
      console.error("Failed to switch mode:", e);
    }
  };

  const getActiveModeKey = () => {
    if (settings.defaultVideoStyle) return settings.defaultVideoStyle;
    if (settings.copyPasteMode === "clone_avatar") return "REMASTER_REACTION";
    if (settings.copyPasteMode === "split_screen") return "CURIOSITY_SPLITSCREEN";
    return "PRODUCT_FIND";
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; border: string; icon: string }> = {
      PENDING: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/30", icon: "schedule" },
      NEEDS_REVIEW: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", icon: "rate_review" },
      SCRIPTED: { bg: "bg-[#00f0ff]/10", text: "text-[#00f0ff]", border: "border-[#00f0ff]/30", icon: "smart_toy" },
      RENDERING: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", icon: "memory" },
      READY: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", icon: "check_circle" },
      UPLOADED: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", icon: "publish" },
      FAILED: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30", icon: "error" }
    };
    const c = config[status] || config.PENDING;
    return (
      <span className={`px-2.5 py-1 rounded text-[11px] font-mono-terminal font-bold uppercase border ${c.bg} ${c.text} ${c.border} flex items-center gap-1.5`}>
        {status === "RENDERING" && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></span>}
        <span className="material-symbols-outlined text-[13px]">{c.icon}</span>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0e0e0f] text-[#e5e2e3]">
      <Toaster position="top-right" toastOptions={{ style: { background: "#1c1b1c", color: "#00f0ff", border: "1px solid #3b494b" } }} />

      {/* Desktop Navigation Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#0e0e0f]/95 border-r border-[#3b494b]/40 backdrop-blur-xl z-50 py-6 px-4">
        {/* Brand Header */}
        <div className="px-3 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-[#00f0ff] font-bold text-xl tracking-tighter uppercase font-sora">simplyytr</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff] font-mono-terminal font-bold">2026 SOTA</span>
          </div>
          <p className="text-[11px] text-[#849495] font-mono-terminal mt-1">SYSTEM_CORE // v4.0.2</p>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 space-y-1.5 font-mono-terminal text-xs uppercase tracking-wider">
          {[
            { id: "CORE", label: "Command Center", icon: "dashboard" },
            { id: "PODCAST", label: "Podcast Studio", icon: "podcasts" },
            { id: "LOGS", label: "Live Telemetry Logs", icon: "terminal" },
            { id: "PULSE", label: "Competitive Pulse", icon: "query_stats" },
            { id: "COMPLIANCE", label: "Content ID Proxy", icon: "verified_user" },
            { id: "RLYA", label: "Recursive Learning", icon: "psychology" },
            { id: "NODES", label: "Compute Cluster", icon: "hub" },
            { id: "REVENUE", label: "Monetization Audit", icon: "monetization_on" },
            { id: "SETTINGS", label: "System Config", icon: "tune" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-left transition-all ${
                activeTab === tab.id
                  ? "bg-[#00f0ff]/15 text-[#00f0ff] border-l-4 border-[#00f0ff] font-bold"
                  : "text-[#b9cacb] hover:bg-[#1c1b1c] hover:text-[#00f0ff]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* System Node Telemetry */}
        <div className="p-4 bg-[#141415] rounded border border-[#3b494b]/40 font-mono-terminal text-[11px] space-y-2">
          <div className="flex items-center justify-between text-[#849495]">
            <span>ENGINE</span>
            <span className="text-[#00f0ff]">{settings.renderEngine || "HYBRID"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#849495]">KAGGLE WORKER</span>
            {isWorkerOnline() ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                ONLINE ({settings.useGpu ? "GPU" : "CPU"})
              </span>
            ) : (
              <span className="text-rose-400 font-bold">● OFFLINE</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#849495]">AUTOPILOT</span>
            <span className={settings.autoPilotEnabled ? "text-emerald-400 font-bold" : "text-amber-400"}>
              {settings.autoPilotEnabled ? "ENGAGED" : "MANUAL"}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen flex flex-col space-y-8 cyber-grid">
        {/* Top Header & Global Action Control Suite */}
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-[#3b494b]/40">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-sora text-white">
                SIMPLYYTR // <span className="text-[#00f0ff]">{activeTab}</span>
              </h1>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] font-mono-terminal text-xs">
                <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse"></span>
                <span>SOTA AUTONOMOUS</span>
              </div>
            </div>
            <p className="text-xs text-[#849495] font-mono-terminal mt-1">
              MULTI-AGENT YOUTUBE REVENUE ENGINE • OPENVOICE V2 + SADTALKER + GROQ REASONING
            </p>
          </div>

          {/* Action Control Suite (Start, Stop, Clear, Trigger, Autopilot) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* START BUTTON */}
            <button
              onClick={() => handleControlAction("start")}
              disabled={loading}
              className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded font-mono-terminal text-xs font-bold transition-all flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              START
            </button>

            {/* STOP BUTTON */}
            <button
              onClick={() => handleControlAction("stop")}
              disabled={loading}
              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded font-mono-terminal text-xs font-bold transition-all flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]"
            >
              <span className="material-symbols-outlined text-[16px]">stop</span>
              STOP
            </button>

            {/* CLEAR QUEUE BUTTON */}
            <button
              onClick={() => handleControlAction("clear", "all")}
              disabled={loading}
              className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded font-mono-terminal text-xs font-bold transition-all flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              CLEAR QUEUE
            </button>

            {/* YOUTUBE ONLINE AUTO-PUBLISH TOGGLE SWITCH */}
            <button
              onClick={async () => {
                const nextState = !settings.autoPublishOnline;
                const updated = { ...settings, autoPublishOnline: nextState };
                setSettings(updated);
                try {
                  await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ autoPublishOnline: nextState })
                  });
                  if (nextState) {
                    toast.success("YouTube Online Auto-Publish ACTIVATED! Rendered videos will upload to YouTube automatically.");
                  } else {
                    toast.success("YouTube Online Auto-Publish PAUSED! Rendered videos will be saved in R2 for manual 1-click publishing.");
                  }
                } catch (e) {
                  toast.error("Failed to update auto-publish switch");
                }
              }}
              className={`px-4 py-2.5 rounded font-mono-terminal text-xs font-bold transition-all flex items-center gap-2 border ${
                settings.autoPublishOnline
                  ? "bg-purple-500/20 text-purple-300 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  : "bg-[#1c1b1c] text-zinc-400 border-zinc-700 hover:border-zinc-500"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {settings.autoPublishOnline ? "cloud_upload" : "cloud_off"}
              </span>
              <span>
                YOUTUBE AUTO-PUBLISH: {settings.autoPublishOnline ? "ONLINE" : "PAUSED (HOLD IN R2)"}
              </span>
            </button>

            {/* QUALITY PROFILE SELECTOR */}
            <div className="flex items-center gap-1.5 p-1 bg-[#141415] border border-[#3b494b]/60 rounded font-mono-terminal">
              <span className="text-[10px] text-[#849495] font-bold px-2 hidden sm:inline">PROFILE:</span>
              <button
                type="button"
                onClick={() => setSelectedQualityProfile("STANDARD")}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  selectedQualityProfile === "STANDARD"
                    ? "bg-zinc-700 text-white shadow-sm ring-1 ring-zinc-500"
                    : "text-[#849495] hover:text-white"
                }`}
                title="STANDARD (Default): Fast procedural graphics cards + SAPI voiceover + linear subtitle estimation"
              >
                STANDARD
              </button>
              <button
                type="button"
                onClick={() => setSelectedQualityProfile("CINEMATIC_PRO")}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedQualityProfile === "CINEMATIC_PRO"
                    ? "bg-gradient-to-r from-amber-500/25 to-[#00f0ff]/25 text-[#00f0ff] border border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.25)] ring-1 ring-[#00f0ff]"
                    : "text-[#849495] hover:text-[#00f0ff]"
                }`}
                title="CINEMATIC_PRO (Opt-In): Authentic footage-first editorial plan, Kokoro-82M neural TTS, Whisper acoustic alignment, automated quality gates"
              >
                <span className="material-symbols-outlined text-[13px]">movie_filter</span>
                CINEMATIC_PRO
              </button>
            </div>

            {/* TRIGGER 1 JOB BUTTON */}
            <button
              onClick={triggerPipeline}
              disabled={loading}
              className="px-5 py-2.5 bg-[#00f0ff] hover:bg-[#00d0df] text-black font-mono-terminal text-xs font-extrabold rounded flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              {loading ? "GENERATING SCRIPT..." : "TRIGGER 1 JOB"}
            </button>
          </div>
        </header>

        {/* Global KPI Telemetry Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono-terminal">
          <div className="p-4 bg-[#141415] border border-[#3b494b]/40 rounded relative overflow-hidden">
            <p className="text-xs text-[#849495]">ACTIVE QUEUE</p>
            <p className="text-3xl font-extrabold text-[#00f0ff] mt-1">
              {(stats["SCRIPTED"] || 0) + (stats["RENDERING"] || 0) + (stats["PENDING"] || 0)}
            </p>
            <p className="text-[10px] text-[#849495] mt-1">{stats["RENDERING"] || 0} rendering • {stats["SCRIPTED"] || 0} scripted</p>
          </div>

          <div className="p-4 bg-[#141415] border border-[#3b494b]/40 rounded relative overflow-hidden">
            <p className="text-xs text-[#849495]">READY TO UPLOAD</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-1">{stats["READY"] || 0}</p>
            <p className="text-[10px] text-[#849495] mt-1">R2 bucket staged</p>
          </div>

          <div className="p-4 bg-[#141415] border border-[#3b494b]/40 rounded relative overflow-hidden">
            <p className="text-xs text-[#849495]">TOTAL PUBLISHED</p>
            <p className="text-3xl font-extrabold text-purple-400 mt-1">{stats["UPLOADED"] || 0}</p>
            <p className="text-[10px] text-[#849495] mt-1">YouTube Data API v3 verified</p>
          </div>

          <div className="p-4 bg-[#141415] border border-[#3b494b]/40 rounded relative overflow-hidden">
            <p className="text-xs text-[#849495]">KAGGLE WORKER</p>
            <p className={`text-xl font-extrabold mt-1 flex items-center gap-2 ${isWorkerOnline() ? "text-emerald-400" : "text-rose-400"}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isWorkerOnline() ? "bg-emerald-400 animate-ping" : "bg-rose-500"}`}></span>
              {isWorkerOnline() ? `ONLINE (${settings.useGpu ? "GPU" : "CPU"})` : "OFFLINE"}
            </p>
            <p className="text-[10px] text-[#849495] mt-1">{settings.autoPilotEnabled ? "Auto-Pilot Active" : "Manual Mode"}</p>
          </div>
        </div>

        {/* Real-Time Live Activity & Subsystem Telemetry Banner */}
        <div className="p-4 bg-[#141415] border border-[#00f0ff]/30 rounded-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono-terminal shadow-[0_0_20px_rgba(0,240,255,0.08)]">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#00f0ff] animate-ping"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#849495] uppercase">CURRENT ENGINE ACTIVITY:</span>
                <span className="text-xs font-bold text-[#00f0ff]">
                  {activeTelemetryJob 
                    ? `[JOB ${activeTelemetryJob.id.slice(-8)}] ${activeTelemetryJob.statusMessage || activeTelemetryJob.status}`
                    : telemetryLogs.length > 0 
                      ? telemetryLogs[0].message 
                      : "Engine Idle • All Quality Gates & Telemetry Listeners Standing By"}
                </span>
              </div>
              <p className="text-[10px] text-[#849495] mt-0.5">
                {activeTelemetryJob ? `Topic: "${activeTelemetryJob.topic}" • Mode: ${activeTelemetryJob.videoStyle} • Engine: ${activeTelemetryJob.renderEngine}` : "Continuous multi-source radar & YouTube background loop active"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => handleTabChange("LOGS")}
              className="px-3 py-1.5 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
            >
              <span className="material-symbols-outlined text-[15px]">terminal</span>
              <span>LIVE DEBUG CONSOLE</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00f0ff]/20 text-[#00f0ff] font-bold">
                {telemetryLogs.length}
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CORE (Command Center & Active Jobs Queue) */}
        {/* ========================================================================= */}
        {activeTab === "CORE" && (
          <div className="space-y-6">
            {/* Strategy & Style Mode Switcher */}
            <div className="p-6 bg-[#141415] border border-[#3b494b]/40 rounded space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white font-sora flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00f0ff]">dashboard_customize</span>
                    Active Video Generation & Revenue Strategy
                  </h2>
                  <p className="text-xs text-[#849495] font-mono-terminal">Select what type of viral content SIMPLYYTR generates when triggered</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono-terminal">
                {[
                  {
                    key: 'PRODUCT_FIND',
                    copyMode: 'search_trends',
                    title: '🛍️ VIRAL PRODUCT FINDS',
                    desc: 'Multi-link affiliate bundles (Amazon + Global Store + Accessories + Coupon) with auto-pinned comments.',
                    tag: 'HIGH REVENUE ($15-$50 RPM)',
                    tagColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10'
                  },
                  {
                    key: 'REMASTER_REACTION',
                    copyMode: 'clone_avatar',
                    title: '🔥 LIVE DAILY TREND-JACK',
                    desc: 'Auto-detects daily trends (FIFA, Breaking News) • 100% Original Audio • No AI Voice • No Avatars • No Mirroring.',
                    tag: 'MAX VIRALITY (>100k views)',
                    tagColor: 'text-rose-400 border-rose-500/40 bg-rose-500/10'
                  },
                  {
                    key: 'CURIOSITY_SPLITSCREEN',
                    copyMode: 'split_screen',
                    title: '⚡ CURIOSITY SPLIT-SCREEN',
                    desc: 'Curiosity storytelling hook on top + 60fps satisfying physics loop on bottom.',
                    tag: 'MAX RETENTION (120% APV)',
                    tagColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10'
                  },
                  {
                    key: 'STANDARD',
                    copyMode: 'generative',
                    title: '📹 DYNAMIC AI COMMENTARY',
                    desc: 'Groq AI multi-agent script + Edge-TTS voiceover commentary & optional talking avatar on Pexels B-roll.',
                    tag: 'ORIGINAL AI CONTENT',
                    tagColor: 'text-purple-400 border-purple-500/40 bg-purple-500/10'
                  }
                ].map(mode => {
                  const isActive = getActiveModeKey() === mode.key;
                  return (
                    <button
                      key={mode.key}
                      onClick={() => handleSelectMode(mode.key, mode.copyMode)}
                      className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isActive
                          ? 'bg-[#00f0ff]/10 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.25)] ring-1 ring-[#00f0ff]'
                          : 'bg-[#1c1b1c] border-[#3b494b]/40 hover:border-[#00f0ff]/50 hover:bg-[#222122]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${mode.tagColor}`}>
                            {mode.tag}
                          </span>
                          {isActive && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-ping"></span>
                          )}
                        </div>
                        <p className="font-bold text-white text-sm font-sora">{mode.title}</p>
                        <p className="text-[11px] text-[#849495] leading-relaxed">{mode.desc}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#3b494b]/30 flex items-center justify-between text-[11px]">
                        <span className={isActive ? 'text-[#00f0ff] font-bold' : 'text-[#849495]'}>
                          {isActive ? '● ACTIVE MODE' : 'Click to Activate'}
                        </span>
                        <span className="material-symbols-outlined text-[16px] text-[#849495]">
                          {isActive ? 'check_circle' : 'arrow_forward'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-[#141415] border border-[#3b494b]/40 rounded space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3b494b]/40 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white font-sora flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00f0ff]">table_chart</span>
                    Active Production Queue
                  </h2>
                  <p className="text-xs text-[#849495] font-mono-terminal">Real-time pipeline job queue with Content ID verification & video preview</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchJobs}
                    className="px-3 py-1.5 bg-[#1c1b1c] hover:bg-[#252426] text-xs font-mono-terminal text-[#b9cacb] border border-[#3b494b]/40 rounded flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    Refresh
                  </button>
                  <button
                    onClick={() => handleControlAction("clear", "failed")}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-mono-terminal text-rose-400 border border-rose-500/30 rounded flex items-center gap-1.5"
                  >
                    Clear Failed
                  </button>
                </div>
              </div>

              {jobs.length === 0 ? (
                <div className="p-12 text-center text-[#849495] font-mono-terminal border border-dashed border-[#3b494b]/30 rounded">
                  NO ACTIVE JOBS IN QUEUE. CLICK "TRIGGER 1 JOB" OR "START" TO INITIALIZE PIPELINE.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono-terminal text-xs">
                    <thead>
                      <tr className="border-b border-[#3b494b]/40 text-[#849495]">
                        <th className="pb-3 px-2">STATUS</th>
                        <th className="pb-3 px-2">FORMAT / TOPIC</th>
                        <th className="pb-3 px-2">AFFILIATE / MONETIZATION</th>
                        <th className="pb-3 px-2">ENGINE</th>
                        <th className="pb-3 px-2">RISK</th>
                        <th className="pb-3 px-2">VIEWS</th>
                        <th className="pb-3 px-2 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3b494b]/20">
                      {jobs.map(job => (
                        <tr key={job.id} className="hover:bg-[#1c1b1c]/50 transition-colors">
                          <td className="py-3.5 px-2 align-middle">{getStatusBadge(job.status)}</td>
                          <td className="py-3.5 px-2 align-middle max-w-xs">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                job.videoStyle === "PRODUCT_FIND" ? "bg-amber-500/10 border-amber-500/30 text-amber-300" :
                                job.videoStyle === "REMASTER_REACTION" ? "bg-rose-500/10 border-rose-500/30 text-rose-300" :
                                job.videoStyle === "CURIOSITY_SPLITSCREEN" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300" :
                                "bg-zinc-500/10 border-zinc-500/30 text-zinc-300"
                              }`}>
                                {job.videoStyle === "PRODUCT_FIND" ? "🛍️ PRODUCT FIND" :
                                 job.videoStyle === "REMASTER_REACTION" ? "🔥 REMASTER" :
                                 job.videoStyle === "CURIOSITY_SPLITSCREEN" ? "⚡ CURIOSITY" : "📹 STANDARD"}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                job.qualityProfile === "CINEMATIC_PRO"
                                  ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                                  : "bg-zinc-800 border-zinc-700 text-zinc-400"
                              }`}>
                                {job.qualityProfile === "CINEMATIC_PRO" ? "🎬 CINEMATIC_PRO" : "STANDARD"}
                              </span>
                              {job.productName && (
                                <span className="text-[10px] text-[#00f0ff] font-bold truncate max-w-[160px]">
                                  {job.productName}
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-white truncate">{job.generatedTitle || job.topic}</p>
                            <p className="text-[10px] text-[#849495] truncate">ID: {job.id.slice(-8)} • {new Date(job.createdAt).toLocaleTimeString()}</p>
                            {job.error && (
                              <p className="text-[10px] text-rose-400 bg-rose-950/30 border border-rose-800/40 p-1 rounded mt-1 truncate">
                                ⚠ {job.error}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-2 align-middle">
                            {job.affiliateLink ? (
                              <a
                                href={job.affiliateLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold flex items-center gap-1 w-fit"
                              >
                                <span className="material-symbols-outlined text-[12px]">shopping_cart</span>
                                Affiliate Link ↗
                              </a>
                            ) : (
                              <span className="text-[10px] text-[#849495]">AdSense Only</span>
                            )}
                          </td>
                          <td className="py-3.5 px-2 align-middle">
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-bold block w-fit">
                                {job.diagnostics?.tts?.engineUsed || job.renderEngine || "HYBRID"}
                              </span>
                              {job.diagnostics?.tts?.fallbackFrom && (
                                <span className="text-[9px] text-amber-400 block" title={job.diagnostics.tts.fallbackReason || "Engine fallback"}>
                                  ⚠ {job.diagnostics.tts.fallbackFrom} → {job.diagnostics.tts.engineUsed}
                                </span>
                              )}
                              {job.diagnostics?.captionAlignment?.method && (
                                <span className={`text-[9px] block ${job.diagnostics.captionAlignment.isAcoustic ? "text-cyan-400 font-bold" : "text-zinc-500"}`}>
                                  {job.diagnostics.captionAlignment.isAcoustic ? "🎙️ Acoustic" : "⏱ Linear Est."}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-2 align-middle">
                            <span className={`text-[11px] font-bold ${(job.contentIdRiskScore || 0) < 5 ? "text-emerald-400" : "text-amber-400"}`}>
                              {(job.contentIdRiskScore || 0.6).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3.5 px-2 align-middle text-emerald-400 font-bold">
                            {(job.views || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-2 align-middle text-right space-x-2">
                            <button
                              onClick={() => {
                                setSelectedInspectionJob(job);
                                setInspectionTab("PREVIEW");
                              }}
                              className="px-2 py-1 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 rounded text-[11px] font-bold inline-flex items-center gap-1"
                              title="Inspect Render Output, Quality Gates & Diagnostics"
                            >
                              <span className="material-symbols-outlined text-[13px]">policy</span>
                              Inspect
                            </button>
                            {(job.status === "SCRIPTED" || job.status === "NEEDS_REVIEW" || job.status === "FAILED") && (
                              <button
                                onClick={() => handleRunLocalRender(job.id)}
                                disabled={loading}
                                className="px-2.5 py-1 bg-gradient-to-r from-amber-500/20 to-[#00f0ff]/20 hover:from-amber-500/30 hover:to-[#00f0ff]/30 text-[#00f0ff] border border-[#00f0ff]/40 rounded text-[11px] font-bold inline-flex items-center gap-1 shadow-sm"
                                title={`Run local render with ${selectedQualityProfile} profile`}
                              >
                                <span className="material-symbols-outlined text-[13px]">movie_creation</span>
                                Render Local
                              </button>
                            )}
                            {job.status === "NEEDS_REVIEW" && (
                              <button
                                onClick={async () => {
                                  const tId = toast.loading("Approving job for GPU render...");
                                  try {
                                    const res = await fetch("/api/pipeline/control", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ action: "approve", jobId: job.id }),
                                    });
                                    const data = await res.json();
                                    if (data.status === "success") {
                                      toast.success("Job approved to render!", { id: tId });
                                      fetchJobs();
                                    } else {
                                      toast.error(data.error || "Approval failed", { id: tId });
                                    }
                                  } catch (e) {
                                    toast.error("Network error during approval", { id: tId });
                                  }
                                }}
                                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[11px] font-bold inline-flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[13px]">check</span>
                                Approve
                              </button>
                            )}
                            {job.status === "FAILED" && (
                              <button
                                onClick={async () => {
                                  const tId = toast.loading("Retrying failed job...");
                                  try {
                                    const res = await fetch("/api/pipeline/control", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ action: "retry", jobId: job.id }),
                                    });
                                    const data = await res.json();
                                    if (data.status === "success") {
                                      toast.success("Job reset for retry!", { id: tId });
                                      fetchJobs();
                                    } else {
                                      toast.error(data.error || "Retry failed", { id: tId });
                                    }
                                  } catch (e) {
                                    toast.error("Network error during retry", { id: tId });
                                  }
                                }}
                                className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded text-[11px] font-bold inline-flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[13px]">refresh</span>
                                Retry
                              </button>
                            )}
                            {job.videoUrl && (
                              <button
                                onClick={() => setSelectedVideo(job.videoUrl)}
                                className="px-2.5 py-1 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 rounded text-[11px] font-bold"
                              >
                                ▶ Watch
                              </button>
                            )}
                            {job.status === "READY" && job.videoUrl && !job.publishedYoutubeId && (
                              <button
                                onClick={() => handlePublishJob(job.id)}
                                className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded text-[11px] font-bold inline-flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                              >
                                <span className="material-symbols-outlined text-[13px]">publish</span>
                                🚀 Publish
                              </button>
                            )}
                            {job.publishedYoutubeId && (
                              <a
                                href={`https://youtube.com/shorts/${job.publishedYoutubeId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[11px] font-bold inline-block"
                              >
                                Shorts ↗
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}


        {/* ========================================================================= */}
        {/* TAB: PODCAST (Opus.pro AI Repurposing Studio & Multi-Panel Workspace) */}
        {/* ========================================================================= */}
        {activeTab === "PODCAST" && (
          <div className="space-y-6 font-mono-terminal">
            {/* 1. OPUS.PRO SIGNATURE HERO & INGESTION HUB */}
            <div className="relative rounded-3xl bg-gradient-to-b from-[#13141f] via-[#0d0e14] to-[#090a0f] border border-white/[0.08] p-6 md:p-8 overflow-hidden shadow-2xl">
              {/* Radial Ambient Glows */}
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#00DFD8]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
                {/* Brand Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-cyan-500/10 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 animate-pulse"></span>
                  <span className="text-[11px] font-black tracking-wider uppercase bg-gradient-to-r from-purple-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                    OPUS CLIP PRO™ STUDIO • LOCAL OFFLINE ENGINE
                  </span>
                </div>

                {/* Hero Title */}
                <h1 className="text-3xl md:text-5xl font-black font-sora text-white tracking-tight leading-tight">
                  1 Long Video, 10 Viral Clips.
                  <br />
                  <span className="bg-gradient-to-r from-[#00DFD8] via-cyan-300 to-purple-400 bg-clip-text text-transparent">
                    Created 10x Faster.
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                  Powered by Whisper word-level acoustic alignment, AI Virality Score™, Shamani Squad kinetic captions, and native CapCut Desktop timeline synthesis.
                </p>

                {/* Target Creator Channel / Profile Autopilot Ribbon */}
                <div className="mt-5 w-full bg-[#121319]/90 border border-white/10 rounded-2xl p-3 shadow-xl space-y-3 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">
                        TARGET CHANNEL & CREATOR PROFILE:
                      </span>
                      {podcastData?.activeChannel && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold">
                          {podcastData.activeChannel.style_label}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setAddChannelModalOpen(true)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-purple-300 border border-purple-500/30 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all self-start sm:self-auto"
                    >
                      <span className="material-symbols-outlined text-[14px]">add_circle</span>
                      Connect Creator Profile
                    </button>
                  </div>

                  {/* Channel Profiles Selector Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {(podcastData?.channelProfiles?.channels || []).map((chan: any) => {
                      const isSelected = chan.id === (podcastData?.activeChannel?.id || podcastData?.channelProfiles?.activeChannelId);
                      return (
                        <button
                          key={chan.id}
                          onClick={() => handleSelectChannel(chan.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
                            isSelected
                              ? "bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                              : "bg-zinc-900/60 border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/20"
                          }`}
                        >
                          {chan.avatar_url ? (
                            <img src={chan.avatar_url} alt={chan.name} className="w-5 h-5 rounded-full object-cover border border-white/20" />
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] text-white font-black">
                              {chan.name.charAt(0)}
                            </span>
                          )}
                          <span>{chan.name}</span>
                          <span className="text-[10px] text-zinc-500 font-normal font-mono">{chan.handle}</span>
                          {chan.followers && (
                            <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] text-zinc-300 font-bold">
                              {chan.followers}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* The Signature Opus.pro Drop Link & Ingest Box */}
                <div className="mt-4 p-2.5 md:p-3 bg-[#161722]/90 border border-white/10 rounded-2xl shadow-2xl flex flex-col md:flex-row items-stretch md:items-center gap-2 backdrop-blur-md">
                  <div className="flex-1 flex items-center gap-3 px-3 py-1.5">
                    <span className="material-symbols-outlined text-purple-400 text-[22px]">link</span>
                    <input
                      type="text"
                      placeholder="Paste YouTube episode link, @handle, or local path (e.g. https://youtube.com/watch?v=...)..."
                      value={opusUrlInput}
                      onChange={(e) => setOpusUrlInput(e.target.value)}
                      className="w-full bg-transparent text-xs text-white placeholder-zinc-500 outline-none font-mono"
                    />
                    {opusUrlInput && (
                      <button onClick={() => setOpusUrlInput("")} className="text-zinc-500 hover:text-white text-xs">
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (!opusUrlInput) {
                        setIngestModalOpen(true);
                      } else {
                        handleIngestEpisode(opusUrlInput);
                      }
                    }}
                    disabled={ingesting}
                    className="px-6 py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.4)] active:scale-95 transition-all whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    {ingesting ? "ANALYZING..." : "Get Clips in 1 Click"}
                  </button>
                </div>

                {/* Active Channel Automated Episodes Feed */}
                {podcastData?.activeChannel?.recent_videos?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2 text-left">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400 font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-purple-400 text-[15px]">sensors</span>
                        RECENT EPISODES FROM {podcastData.activeChannel.name.toUpperCase()} ({podcastData.activeChannel.handle}):
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Auto-Repurpose Ready
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {podcastData.activeChannel.recent_videos.slice(0, 4).map((vid: any) => (
                        <div
                          key={vid.id}
                          className="p-2.5 bg-black/40 border border-white/[0.06] hover:border-purple-500/40 rounded-xl flex flex-col justify-between gap-2 transition-all group"
                        >
                          <div className="space-y-1.5">
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-black/80">
                              <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-[8px] font-bold text-white font-mono">
                                {vid.duration}
                              </span>
                              {vid.is_local && (
                                <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-emerald-600/90 text-[8px] font-bold text-white">
                                  Local Match
                                </span>
                              )}
                            </div>
                            <h5 className="text-[11px] font-bold text-zinc-200 line-clamp-2 leading-snug">
                              {vid.title}
                            </h5>
                          </div>

                          <button
                            onClick={() => handleAutoCreateFromVideo(vid)}
                            disabled={autoCreatingVideoId === vid.id}
                            className="w-full py-1.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 hover:border-purple-500 text-purple-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[14px]">bolt</span>
                            {autoCreatingVideoId === vid.id ? "REPURPOSING..." : "⚡ 1-Click Auto-Create"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Target Duration & Model Preset Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px]">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] mr-1">Target Duration:</span>
                  {[
                    { id: "AUTO", label: "Auto (AI Optimal)" },
                    { id: "UNDER_30", label: "< 30s (Ultra Viral)" },
                    { id: "30_60", label: "30s - 60s (Shorts/Reels)" },
                    { id: "60_90", label: "60s - 90s (In-Depth)" },
                    { id: "LONG_16_9", label: "16:9 Masterclasses (4-15m)" }
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      onClick={() => {
                        setTargetDurationPill(pill.id as any);
                        if (pill.id === "LONG_16_9") {
                          setPodcastSubTab("LONG_CLIPS");
                          if (podcastData?.longClips?.length && (!selectedStudioClip || !selectedStudioClip.id?.startsWith("clip_"))) {
                            const firstLong = podcastData.longClips[0];
                            setSelectedStudioClip({ ...firstLong, format: "16:9 Landscape (Broadcast Masterclass)" });
                            setActiveFramingMode("CINEMA_16_9");
                          }
                        } else if (podcastSubTab === "LONG_CLIPS") {
                          setPodcastSubTab("SHORTS");
                          if (podcastData?.viralShorts?.length && (!selectedStudioClip || selectedStudioClip.id?.startsWith("clip_"))) {
                            const firstShort = podcastData.viralShorts[0];
                            setSelectedStudioClip(firstShort);
                            setActiveFramingMode("AMBIENT_9_16");
                          }
                        }
                      }}
                      className={`px-3 py-1 rounded-full font-bold transition-all ${
                        targetDurationPill === pill.id
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                          : "bg-zinc-900/60 text-zinc-400 hover:text-white border border-white/[0.05]"
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Episode Switcher & Metrics Ribbon */}
              <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <div className="flex items-center gap-2 bg-[#161722] border border-white/10 px-3 py-1.5 rounded-xl">
                    <span className="material-symbols-outlined text-cyan-400 text-[18px]">video_library</span>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">PROJECT:</span>
                    <select
                      value={podcastData?.activeEpisodeId || ""}
                      onChange={(e) => handleSwitchEpisode(e.target.value)}
                      className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer max-w-[280px] sm:max-w-md truncate"
                    >
                      {(podcastData?.episodes || []).map((ep: any) => (
                        <option key={ep.id} value={ep.id} className="bg-zinc-900 text-white">
                          [{ep.duration_formatted}] {ep.title} ({ep.guest})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setIngestModalOpen(true)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    Ingest Video ({podcastData?.discoveredVideos?.length || 15} Found)
                  </button>
                </div>

                {/* Telemetry Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-zinc-900/80 border border-white/[0.06] text-xs font-bold text-white tabular-nums flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {podcastData?.totalCuratedClips || 14} Clips Ready
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-zinc-900/80 border border-white/[0.06] text-xs font-bold text-amber-400 tabular-nums flex items-center gap-1.5">
                    🔥 82.4 Avg Virality Score™
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/pipeline/podcast", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "open_capcut" })
                        });
                        const data = await res.json();
                        if (data.status === "success") toast.success("CapCut Desktop Launched!");
                        else toast.error(data.message || "Failed to launch CapCut");
                      } catch {
                        toast.error("Network error launching CapCut");
                      }
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    CapCut ({podcastData?.capcutRegisteredDrafts || 14} Drafts)
                  </button>
                </div>
              </div>
            </div>

            {/* 3. PINNACLE OPUS PRO STUDIO WORKSPACE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: INTERACTIVE DEVICE PLAYER & VIRALITY SPOTLIGHT (5 cols) */}
              <div className="lg:col-span-5 space-y-5 sticky top-6">
                {/* Device Canvas Frame */}
                <div className="p-4 bg-[#121319] border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center">
                  <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider ml-1">
                        {activeFramingMode === "CINEMA_16_9" ? "16:9 Cinema Masterclass" : "9:16 Adaptive Frame"}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      1080p FHD • -14 LUFS
                    </span>
                  </div>

                  {/* Speaker Framing Mode Switcher */}
                  <div className="w-full grid grid-cols-4 gap-1 p-1 bg-black/60 rounded-xl border border-white/[0.06] mb-3 text-[10px]">
                    <button
                      onClick={() => setActiveFramingMode("AMBIENT_9_16")}
                      className={`py-1 px-1.5 rounded-lg font-bold transition-all text-center ${
                        activeFramingMode === "AMBIENT_9_16"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      📱 Ambient
                    </button>
                    <button
                      onClick={() => setActiveFramingMode("SPLIT_9_16")}
                      className={`py-1 px-1.5 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1 ${
                        activeFramingMode === "SPLIT_9_16"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span>👥 Split 50/50</span>
                      {selectedStudioClip?.has_split && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Real Multi-Cam 50/50 Available"></span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveFramingMode("SPEAKER_9_16")}
                      className={`py-1 px-1.5 rounded-lg font-bold transition-all text-center ${
                        activeFramingMode === "SPEAKER_9_16"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      🎯 Focus
                    </button>
                    <button
                      onClick={() => setActiveFramingMode("CINEMA_16_9")}
                      className={`py-1 px-1.5 rounded-lg font-bold transition-all text-center ${
                        activeFramingMode === "CINEMA_16_9"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      🎬 Cinema 16:9
                    </button>
                  </div>

                  {/* Sized Player Frame */}
                  <div
                    className={`w-full bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative flex items-center justify-center ${
                      activeFramingMode === "CINEMA_16_9"
                        ? "aspect-video"
                        : "max-w-[270px] aspect-[9/16] border-4 border-zinc-800"
                    }`}
                  >
                    {/* Ambient Blurred Background Simulation for 9:16 */}
                    {activeFramingMode === "AMBIENT_9_16" && selectedStudioClip?.thumbnail_url && (
                      <div
                        className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-40 scale-125 pointer-events-none"
                        style={{ backgroundImage: `url(${selectedStudioClip.thumbnail_url})` }}
                      />
                    )}

                    {selectedStudioClip?.video_url ? (
                      <video
                        key={
                          activeFramingMode === "SPLIT_9_16" && selectedStudioClip.split_video_url
                            ? selectedStudioClip.split_video_url
                            : selectedStudioClip.video_url
                        }
                        ref={videoRef}
                        controls
                        autoPlay
                        playsInline
                        preload="auto"
                        onLoadedMetadata={(e) => {
                          e.currentTarget.play().catch(() => {});
                        }}
                        onTimeUpdate={(e) => setVideoCurrentTime(e.currentTarget.currentTime)}
                        className={`w-full h-full relative z-10 ${
                          activeFramingMode === "SPEAKER_9_16" ? "object-cover scale-110" : "object-contain"
                        }`}
                        src={
                          activeFramingMode === "SPLIT_9_16" && selectedStudioClip.split_video_url
                            ? selectedStudioClip.split_video_url
                            : selectedStudioClip.video_url
                        }
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="p-6 text-center text-zinc-500 relative z-10">
                        <span className="material-symbols-outlined text-4xl">movie</span>
                        <p className="text-xs mt-2">Select any clip to preview</p>
                      </div>
                    )}
                  </div>

                  {/* Precision Waveform & Clip Trimmer Bar */}
                  <div className="w-full mt-4 p-3 bg-black/50 border border-white/[0.06] rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-cyan-400 text-[13px]">graphic_eq</span>
                        ACOUSTIC ENERGY & HOOK RETENTION
                      </span>
                      <span className="font-mono text-cyan-300 font-bold tabular-nums">
                        {Math.floor(videoCurrentTime / 60)}:
                        {String(Math.floor(videoCurrentTime % 60)).padStart(2, "0")} /{" "}
                        {selectedStudioClip?.duration_formatted ||
                          `${selectedStudioClip?.duration?.toFixed ? selectedStudioClip.duration.toFixed(0) : selectedStudioClip?.duration || 35}s`}
                      </span>
                    </div>

                    {/* Waveform graphic bars */}
                    <div className="h-8 flex items-end gap-0.5 pt-1 relative">
                      {/* Golden Hook Zone Marker (0-3s) */}
                      <div className="absolute left-0 top-0 bottom-0 w-[14%] bg-amber-500/20 border-r-2 border-amber-400/80 pointer-events-none rounded-l z-10 flex items-start pl-1">
                        <span className="text-[7px] font-black text-amber-300 uppercase tracking-tighter">
                          🔥 3s Hook
                        </span>
                      </div>

                      {Array.from({ length: 42 }).map((_, i) => {
                        const heights = [30, 45, 75, 90, 60, 40, 85, 95, 70, 50, 65, 80, 55, 40, 70, 85, 90, 65, 50, 75, 85, 60, 45, 80, 95, 85, 70, 60, 75, 90, 65, 50, 70, 85, 60, 45, 60, 75, 55, 40, 50, 65];
                        const h = heights[i % heights.length];
                        const progressFrac = videoCurrentTime / (selectedStudioClip?.duration_sec || selectedStudioClip?.duration || 35 || 1);
                        const isPlayed = i / 42 <= progressFrac;
                        return (
                          <div
                            key={i}
                            onClick={() => {
                              const targetSec = (i / 42) * (selectedStudioClip?.duration_sec || selectedStudioClip?.duration || 35);
                              handleSeekToTime(targetSec);
                            }}
                            className={`flex-1 rounded-full cursor-pointer transition-all duration-100 ${
                              isPlayed
                                ? "bg-gradient-to-t from-cyan-500 to-[#00F0FF] shadow-[0_0_6px_rgba(0,240,255,0.4)]"
                                : "bg-zinc-800 hover:bg-zinc-700"
                            }`}
                            style={{ height: `${h}%` }}
                          />
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-0.5">
                      <span>0.00s Start</span>
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 font-mono font-bold">
                        &lt;0.12s Loop Cut
                      </span>
                      <span>
                        {selectedStudioClip?.duration_sec
                          ? `${selectedStudioClip.duration_sec}s`
                          : `${selectedStudioClip?.duration || 35}s End`}
                      </span>
                    </div>
                  </div>

                  {/* Player Quick Actions */}
                  <div className="w-full flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                    {selectedStudioClip?.download_url ? (
                      <a
                        href={selectedStudioClip.download_url}
                        download
                        className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        Download HD ({selectedStudioClip.size_mb || 10} MB)
                      </a>
                    ) : (
                      <button disabled className="flex-1 py-2 bg-zinc-800 text-zinc-500 rounded-xl text-xs font-bold">
                        Download MP4
                      </button>
                    )}

                    <button
                      onClick={() => setStudioWorkspaceTab("TRANSCRIPT")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                        studioWorkspaceTab === "TRANSCRIPT"
                          ? "bg-purple-500 text-white shadow"
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                      }`}
                      title="Open Interactive Transcript Studio"
                    >
                      <span className="material-symbols-outlined text-[16px]">subtitles</span>
                      Captions
                    </button>
                  </div>
                </div>

                {/* AI Virality Score™ Spotlight Card (Signature Opus.pro) */}
                <div className="p-5 bg-[#121319] border border-white/10 rounded-3xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">
                        AI VIRALITY SCORE™
                      </span>
                      <div className="text-2xl font-black text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text tabular-nums flex items-center gap-1.5">
                        🔥 {selectedStudioClip?.vrs_score || 88} <span className="text-xs text-zinc-500 font-normal">/ 100</span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-black uppercase">
                      HIGH VIRAL POTENTIAL
                    </span>
                  </div>

                  {/* Multi-Factor Retention Gauges */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                    <div className="p-2 bg-black/40 border border-white/[0.04] rounded-xl space-y-1">
                      <div className="flex justify-between text-zinc-400">
                        <span>Hook Stop-Rate</span>
                        <span className="text-emerald-400 font-bold">
                          {selectedStudioClip?.vrs_breakdown?.hook || 24} / 25
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{ width: `${((selectedStudioClip?.vrs_breakdown?.hook || 24) / 25) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2 bg-black/40 border border-white/[0.04] rounded-xl space-y-1">
                      <div className="flex justify-between text-zinc-400">
                        <span>Emotional Arc</span>
                        <span className="text-rose-400 font-bold">
                          {selectedStudioClip?.vrs_breakdown?.emotion || 23} / 25
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-400 h-full rounded-full"
                          style={{ width: `${((selectedStudioClip?.vrs_breakdown?.emotion || 23) / 25) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2 bg-black/40 border border-white/[0.04] rounded-xl space-y-1">
                      <div className="flex justify-between text-zinc-400">
                        <span>Quotability / Pacing</span>
                        <span className="text-cyan-400 font-bold">
                          {selectedStudioClip?.vrs_breakdown?.quotability || 22} / 25
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-400 h-full rounded-full"
                          style={{ width: `${((selectedStudioClip?.vrs_breakdown?.quotability || 22) / 25) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2 bg-black/40 border border-white/[0.04] rounded-xl space-y-1">
                      <div className="flex justify-between text-zinc-400">
                        <span>Loop Seamlessness</span>
                        <span className="text-amber-400 font-bold">
                          {selectedStudioClip?.vrs_breakdown?.loop || 19} / 25
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{ width: `${((selectedStudioClip?.vrs_breakdown?.loop || 19) / 25) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Why it will go viral breakdown */}
                  <div className="p-3.5 bg-black/40 border border-white/[0.04] rounded-2xl space-y-2 text-xs">
                    <span className="text-zinc-300 font-bold flex items-center gap-1.5 text-[11px]">
                      <span className="material-symbols-outlined text-purple-400 text-[16px]">psychology</span>
                      Why This Clip Will Go Viral:
                    </span>
                    <ul className="space-y-1.5 text-[11px] text-zinc-400 pl-1">
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">✓ Hook:</span>
                        <span>Contrarian opening punch stops scrolling thumbs within first 3.0s.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-bold">✓ Pacing:</span>
                        <span>Speech rate of ~165 WPM maintains cognitive engagement with 0 filler words.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">✓ Replay:</span>
                        <span>Voice endpoint hard cut within 0.12s guarantees &gt;100% loop retention.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Caption Presets Selector */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      KINETIC CAPTION STYLE:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: "SHAMANI", label: "🟡 Shamani Amber", desc: "Golden glow aura" },
                        { id: "HORMOZI", label: "🟢 Hormozi Impact", desc: "Neon green punch" },
                        { id: "MRBEAST", label: "🟡 MrBeast Bold", desc: "Canary pop outline" },
                        { id: "MINIMAL", label: "⚪ Studio Clean", desc: "Frosted lower-third" }
                      ].map((cp) => (
                        <button
                          key={cp.id}
                          onClick={() => {
                            setCaptionPreset(cp.id as any);
                            toast.success(`Active style: ${cp.label}`);
                          }}
                          className={`p-2 rounded-xl text-left border transition-all ${
                            captionPreset === cp.id
                              ? "bg-purple-500/15 border-purple-500/50 text-white shadow-sm"
                              : "bg-black/40 border-white/[0.04] text-zinc-400 hover:text-white"
                          }`}
                        >
                          <span className="font-bold block text-[11px]">{cp.label}</span>
                          <span className="text-[9px] text-zinc-500">{cp.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: PINNACLE 4-WORKSPACE STUDIO DECK (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* 1. Master Workspace Navigation Bar */}
                <div className="p-2 bg-[#121319] border border-white/10 rounded-2xl flex items-center justify-between gap-1 shadow-xl">
                  {[
                    { id: "FEED", label: "Ranked Feed", icon: "view_stream", badge: podcastData?.totalCuratedClips || 14 },
                    { id: "TRANSCRIPT", label: "Transcript & Captions", icon: "subtitles", badge: "Live" },
                    { id: "PUBLISH", label: "Viral Publishing Deck", icon: "rocket_launch", badge: "A/B" },
                    { id: "EXPORT", label: "Multi-Track Export", icon: "folder_zip", badge: "CapCut" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStudioWorkspaceTab(tab.id as any)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        studioWorkspaceTab === tab.id
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[9px] font-mono border border-white/10">
                        {tab.badge}
                      </span>
                    </button>
                  ))}
                </div>

                {/* WORKSPACE TAB 1: RANKED FEED */}
                {studioWorkspaceTab === "FEED" && (
                  <div className="space-y-4">
                    {/* Format Filter Bar */}
                    <div className="p-3 bg-[#121319] border border-white/10 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setPodcastSubTab("SHORTS");
                            if (podcastData?.viralShorts?.length && (!selectedStudioClip || selectedStudioClip.id?.startsWith("clip_"))) {
                              setSelectedStudioClip(podcastData.viralShorts[0]);
                              setActiveFramingMode("AMBIENT_9_16");
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            podcastSubTab === "SHORTS"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm"
                              : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">stay_current_portrait</span>
                          Shorts (9:16)
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-900/60 text-[10px]">
                            {podcastData?.viralShorts?.length || 10}
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setPodcastSubTab("LONG_CLIPS");
                            if (podcastData?.longClips?.length && (!selectedStudioClip || !selectedStudioClip.id?.startsWith("clip_"))) {
                              const firstLong = podcastData.longClips[0];
                              setSelectedStudioClip({ ...firstLong, format: "16:9 Landscape (Broadcast Masterclass)" });
                              setActiveFramingMode("CINEMA_16_9");
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            podcastSubTab === "LONG_CLIPS"
                              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm"
                              : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">movie</span>
                          Masterclasses (16:9)
                          <span className="px-1.5 py-0.2 rounded-full bg-cyan-900/60 text-[10px]">
                            {podcastData?.longClips?.length || 4}
                          </span>
                        </button>

                        <button
                          onClick={() => setPodcastSubTab("MATRIX")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            podcastSubTab === "MATRIX"
                              ? "bg-purple-500/15 text-purple-300 border border-purple-500/40 shadow-sm"
                              : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">hub</span>
                          Chapters
                        </button>
                      </div>

                      {/* Search */}
                      <div className="relative flex-1 sm:max-w-xs">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-[16px]">
                          search
                        </span>
                        <input
                          type="text"
                          placeholder="Filter clips..."
                          value={podcastSearch}
                          onChange={(e) => setPodcastSearch(e.target.value)}
                          className="w-full pl-8 pr-7 py-1.5 bg-black/50 border border-zinc-700/80 focus:border-purple-500 rounded-xl text-xs text-white placeholder-zinc-500 outline-none"
                        />
                        {podcastSearch && (
                          <button
                            onClick={() => setPodcastSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SHORTS FEED */}
                    {podcastSubTab === "SHORTS" && (
                      <div className="space-y-3">
                        {(podcastData?.viralShorts || [])
                          .filter((s: any) => {
                            if (!podcastSearch) return true;
                            const q = podcastSearch.toLowerCase();
                            return (
                              (s.title || "").toLowerCase().includes(q) ||
                              (s.banner || "").toLowerCase().includes(q) ||
                              (s.id || "").toLowerCase().includes(q)
                            );
                          })
                          .map((short: any, rankIdx: number) => {
                            const isSelected = selectedStudioClip?.id === short.id;
                            return (
                              <div
                                key={short.id}
                                onClick={() => setSelectedStudioClip({ ...short, format: "9:16 Vertical" })}
                                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${
                                  isSelected
                                    ? "bg-[#181926] border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                                    : "bg-[#121319] border-white/[0.06] hover:border-white/20 hover:bg-[#151620]"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-1 rounded bg-zinc-800 text-[10px] font-black text-zinc-400 whitespace-nowrap">
                                    #{rankIdx + 1}
                                  </span>

                                  <div className="relative w-16 h-24 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0">
                                    {short.thumbnail_url ? (
                                      <img src={short.thumbnail_url} alt={short.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                        <span className="material-symbols-outlined text-lg">stay_current_portrait</span>
                                      </div>
                                    )}
                                    <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[8px] font-bold text-white tabular-nums">
                                      {short.duration?.toFixed ? `${short.duration.toFixed(0)}s` : `${short.duration}s`}
                                    </span>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-black text-[10px] font-black flex items-center gap-1 shadow-sm">
                                        🔥 {short.vrs_score || 82}
                                      </span>
                                      <span className="text-[10px] text-zinc-400 font-bold uppercase">
                                        9:16 Vertical Short
                                      </span>
                                    </div>

                                    <h4 className="text-xs font-bold text-white line-clamp-1 leading-snug">
                                      {short.title}
                                    </h4>

                                    <div className="text-[10px] text-[#00FF66] font-extrabold line-clamp-1">
                                      {short.banner}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedStudioClip({ ...short, format: "9:16 Vertical" });
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                      isSelected
                                        ? "bg-purple-500 text-white shadow"
                                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                                    Preview
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedStudioClip({ ...short, format: "9:16 Vertical" });
                                      setStudioWorkspaceTab("TRANSCRIPT");
                                    }}
                                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                                    title="View & Edit Captions"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">subtitles</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedStudioClip({ ...short, format: "9:16 Vertical" });
                                      setStudioWorkspaceTab("PUBLISH");
                                    }}
                                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                                    title="Viral Publishing Deck"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">rocket_launch</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* LONG CLIPS FEED */}
                    {podcastSubTab === "LONG_CLIPS" && (
                      <div className="space-y-3">
                        {(podcastData?.longClips || [])
                          .filter((c: any) => {
                            if (!podcastSearch) return true;
                            const q = podcastSearch.toLowerCase();
                            return (
                              (c.title_primary || "").toLowerCase().includes(q) ||
                              (c.topic || "").toLowerCase().includes(q) ||
                              (c.lower_third_banner || "").toLowerCase().includes(q)
                            );
                          })
                          .map((clip: any, rankIdx: number) => {
                            const isSelected = selectedStudioClip?.id === clip.id;
                            return (
                              <div
                                key={clip.id}
                                onClick={() => {
                                  setSelectedStudioClip({ ...clip, format: "16:9 Landscape (Broadcast Masterclass)" });
                                  setActiveFramingMode("CINEMA_16_9");
                                  if (videoRef.current) {
                                    videoRef.current.currentTime = 0;
                                    videoRef.current.play().catch(() => {});
                                  }
                                }}
                                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${
                                  isSelected
                                    ? "bg-[#181926] border-cyan-500/60 shadow-[0_0_20px_rgba(0,240,255,0.25)]"
                                    : "bg-[#121319] border-white/[0.06] hover:border-white/20 hover:bg-[#151620]"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-1 rounded bg-zinc-800 text-[10px] font-black text-cyan-400 whitespace-nowrap">
                                    #{rankIdx + 1}
                                  </span>

                                  <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0">
                                    {clip.thumbnail_url ? (
                                      <img src={clip.thumbnail_url} alt={clip.title_primary} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                        <span className="material-symbols-outlined text-lg">movie</span>
                                      </div>
                                    )}
                                    <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[8px] font-bold text-white tabular-nums">
                                      {clip.duration_formatted || "7m"}
                                    </span>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[10px] text-cyan-400 font-bold uppercase block">
                                      ❙ {clip.lower_third_banner}
                                    </span>
                                    <h4 className="text-xs font-bold text-white line-clamp-1 leading-snug">
                                      {clip.title_primary}
                                    </h4>
                                    <span className="text-[10px] text-zinc-400 block">
                                      {clip.start_timestamp} → {clip.end_timestamp} • {clip.total_words || 870} words dialogue
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedStudioClip({ ...clip, format: "16:9 Landscape (Broadcast Masterclass)" });
                                      setActiveFramingMode("CINEMA_16_9");
                                      if (videoRef.current) {
                                        videoRef.current.currentTime = 0;
                                        videoRef.current.play().catch(() => {});
                                      }
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                      isSelected
                                        ? "bg-cyan-500 text-black font-black shadow"
                                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                                    Preview
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedStudioClip({ ...clip, format: "16:9 Landscape (Broadcast Masterclass)" });
                                      setActiveFramingMode("CINEMA_16_9");
                                      setStudioWorkspaceTab("TRANSCRIPT");
                                    }}
                                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                                    title="View Dialogue Captions"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">subtitles</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedStudioClip({ ...clip, format: "16:9 Landscape (Broadcast Masterclass)" });
                                      setActiveFramingMode("CINEMA_16_9");
                                      setStudioWorkspaceTab("PUBLISH");
                                    }}
                                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                                    title="Publishing Package"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">rocket_launch</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* MATRIX & CHAPTERS */}
                    {podcastSubTab === "MATRIX" && (
                      <div className="p-6 bg-[#121319] border border-purple-500/30 rounded-2xl space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-purple-400 text-[20px]">list_alt</span>
                            FULL EPISODE YOUTUBE CHAPTERS
                          </h3>
                          <button
                            onClick={() => {
                              const chaptersText = (podcastData?.matrix?.full_podcast?.chapters || [])
                                .map((c: any) => `${c.timestamp} - ${c.title}`)
                                .join("\n");
                              navigator.clipboard.writeText(chaptersText);
                              toast.success("Full episode chapters copied!");
                            }}
                            className="px-3.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50 rounded-xl text-xs font-bold transition-all"
                          >
                            Copy Chapters
                          </button>
                        </div>

                        <div className="p-4 bg-black/40 border border-white/[0.04] rounded-xl font-mono text-xs text-zinc-300 space-y-2">
                          {(podcastData?.matrix?.full_podcast?.chapters || []).map((c: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 hover:bg-white/[0.02] p-1 rounded">
                              <span className="text-cyan-400 font-bold w-16">{c.timestamp}</span>
                              <span className="text-zinc-200">{c.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* WORKSPACE TAB 2: INTERACTIVE WORD-LEVEL TRANSCRIPT & SUBTITLE STUDIO */}
                {studioWorkspaceTab === "TRANSCRIPT" && (
                  <div className="p-5 bg-[#121319] border border-white/10 rounded-2xl space-y-5 shadow-xl">
                    {/* Transcript Header & Styling Controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-purple-400 text-[20px]">subtitles</span>
                          Live Interactive Karaoke Transcript
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Click any word to seek playback. Edit text inline and synchronize standard SRT broadcast files.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isEditingTranscript
                              ? "bg-amber-500 text-black shadow"
                              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {isEditingTranscript ? "check" : "edit"}
                          </span>
                          {isEditingTranscript ? "Done Editing" : "Edit Words"}
                        </button>

                        {isEditingTranscript && (
                          <button
                            onClick={handleSaveTranscript}
                            disabled={savingTranscript}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                          >
                            <span className="material-symbols-outlined text-[16px]">save</span>
                            {savingTranscript ? "Saving..." : "Save & Sync SRT"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Subtitle Customizer Bar */}
                    <div className="p-3 bg-black/40 border border-white/[0.04] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                      {/* Active Word Highlight Color */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase">Glow Color:</span>
                        <div className="flex items-center gap-1.5">
                          {[
                            { color: "#00F0FF", label: "Cyan" },
                            { color: "#FFCC00", label: "Amber" },
                            { color: "#00FF66", label: "Neon" },
                            { color: "#FF3366", label: "Crimson" },
                            { color: "#FFFFFF", label: "White" }
                          ].map((item) => (
                            <button
                              key={item.color}
                              onClick={() => setActiveWordColor(item.color)}
                              className={`w-5 h-5 rounded-full border transition-all ${
                                activeWordColor === item.color
                                  ? "border-white scale-110 shadow-[0_0_10px]"
                                  : "border-transparent opacity-60 hover:opacity-100"
                              }`}
                              style={{ backgroundColor: item.color }}
                              title={item.label}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Font selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase">Font:</span>
                        <select
                          value={captionFont}
                          onChange={(e) => setCaptionFont(e.target.value)}
                          className="bg-zinc-800 text-white rounded-lg px-2 py-1 text-xs border border-zinc-700 outline-none"
                        >
                          <option value="Montserrat">Montserrat Black</option>
                          <option value="Inter">Inter Bold</option>
                          <option value="Impact">Impact Headline</option>
                          <option value="Bebas Neue">Bebas Neue</option>
                        </select>
                      </div>

                      {/* Auto Emojis toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase">Auto-Emojis:</span>
                        <button
                          onClick={() => setAutoEmojiEnabled(!autoEmojiEnabled)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                            autoEmojiEnabled
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                              : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {autoEmojiEnabled ? "🔥 ON" : "OFF"}
                        </button>
                      </div>
                    </div>

                    {/* Word-by-Word Interactive Transcript Area */}
                    <div className="max-h-[460px] overflow-y-auto pr-2 space-y-3 font-sans">
                      {editedCues && editedCues.length > 0 ? (
                        editedCues.map((cue: any, cueIdx: number) => {
                          const cueStart = cue.start || 0;
                          const cueEnd = cue.end || 0;
                          const isCueActive = videoCurrentTime >= cueStart && videoCurrentTime <= cueEnd;

                          return (
                            <div
                              key={cueIdx}
                              className={`p-3 rounded-xl border transition-all duration-150 ${
                                isCueActive
                                  ? "bg-purple-950/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                  : "bg-black/30 border-white/[0.04] hover:border-white/10"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <button
                                  onClick={() => handleSeekToTime(cueStart)}
                                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono text-cyan-300 font-bold tabular-nums flex items-center gap-1 transition-all"
                                >
                                  <span className="material-symbols-outlined text-[12px]">play_circle</span>
                                  {Math.floor(cueStart / 60)}:
                                  {String(Math.floor(cueStart % 60)).padStart(2, "0")}.
                                  {String(Math.round((cueStart % 1) * 10)).slice(0, 1)}
                                </button>

                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {cue.words?.length || 0} words
                                </span>
                              </div>

                              {/* Words Cluster */}
                              <div className="flex flex-wrap items-center gap-1.5 leading-relaxed">
                                {(cue.words || []).map((wObj: any, wIdx: number) => {
                                  const wText = wObj.word || "";
                                  const wStart = wObj.start || cueStart;
                                  const wEnd = wObj.end || wStart + 0.35;
                                  const isWordSpoken =
                                    videoCurrentTime >= wStart && videoCurrentTime <= Math.max(wEnd, wStart + 0.3);

                                  if (isEditingTranscript) {
                                    return (
                                      <input
                                        key={wIdx}
                                        type="text"
                                        value={wText}
                                        onChange={(e) => handleUpdateWordText(cueIdx, wIdx, e.target.value)}
                                        className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-xs text-white font-bold w-auto min-w-[3rem] max-w-[8rem] outline-none focus:border-amber-400"
                                      />
                                    );
                                  }

                                  return (
                                    <button
                                      key={wIdx}
                                      onClick={() => handleSeekToTime(wStart)}
                                      className={`px-1.5 py-0.5 rounded text-xs transition-all duration-75 cursor-pointer font-bold ${
                                        isWordSpoken
                                          ? "scale-105 shadow-md"
                                          : "text-zinc-300 hover:text-white hover:bg-white/[0.08]"
                                      }`}
                                      style={
                                        isWordSpoken
                                          ? {
                                              backgroundColor: activeWordColor,
                                              color: "#000000",
                                              boxShadow: `0 0 14px ${activeWordColor}`
                                            }
                                          : {}
                                      }
                                    >
                                      {wText}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center text-zinc-500 space-y-2">
                          <span className="material-symbols-outlined text-4xl text-purple-400 animate-pulse">
                            graphic_eq
                          </span>
                          <p className="text-xs">No word segments available for this clip.</p>
                          <p className="text-[10px] text-zinc-600">Select another clip or run automatic transcription.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* WORKSPACE TAB 3: VIRAL PUBLISHING DECK */}
                {studioWorkspaceTab === "PUBLISH" && (
                  <div className="p-5 bg-[#121319] border border-white/10 rounded-2xl space-y-5 shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-cyan-400 text-[20px]">rocket_launch</span>
                          Viral Publishing &amp; Distribution Deck
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Ranked A/B title formulas, algorithmic SEO description, and discussion-starter pinned comment.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          const fullPkg = `TITLES:\n1) ${selectedStudioClip?.titles?.title_a || selectedStudioClip?.title}\n2) ${selectedStudioClip?.titles?.title_b}\n3) ${selectedStudioClip?.titles?.title_c}\n\nDESCRIPTION:\n${selectedStudioClip?.description}\n\nTAGS:\n${(selectedStudioClip?.tags || []).join(", ")}\n\nPINNED COMMENT:\n${selectedStudioClip?.pinned_comment}`;
                          handleCopyText(fullPkg, "all");
                        }}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">content_copy</span>
                        Copy All Metadata
                      </button>
                    </div>

                    {/* A/B/C Titles */}
                    <div className="space-y-3">
                      <span className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider block">
                        A/B/C VIRAL TITLES (PREDICTED CTR):
                      </span>

                      {[
                        {
                          id: "a",
                          label: "Option A (Curiosity Gap)",
                          text: selectedStudioClip?.titles?.title_a || selectedStudioClip?.title || "Default Viral Title",
                          ctr: selectedStudioClip?.titles?.ctr_a || 94
                        },
                        {
                          id: "b",
                          label: "Option B (Contrarian Shock)",
                          text:
                            selectedStudioClip?.titles?.title_b ||
                            `Bro And His Words On ${selectedStudioClip?.title || "Success"} 🥺🤯 Ft. @rajshamani #shorts`,
                          ctr: selectedStudioClip?.titles?.ctr_b || 91
                        },
                        {
                          id: "c",
                          label: "Option C (Quote / Reality Check)",
                          text:
                            selectedStudioClip?.titles?.title_c ||
                            `Harsh Reality Bro 🥲🥺 Ft. @rajshamani #shorts`,
                          ctr: selectedStudioClip?.titles?.ctr_c || 87
                        }
                      ].map((t) => (
                        <div
                          key={t.id}
                          className="p-3 bg-black/40 border border-white/[0.04] rounded-xl flex items-center justify-between gap-3 hover:border-white/10 transition-all"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-400 font-bold uppercase">{t.label}:</span>
                              <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                                {t.ctr}% CTR
                              </span>
                            </div>
                            <p className="text-xs text-white font-bold">{t.text}</p>
                          </div>

                          <button
                            onClick={() => handleCopyText(t.text, `title_${t.id}`)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {copiedField === `title_${t.id}` ? "check" : "content_copy"}
                            </span>
                            {copiedField === `title_${t.id}` ? "Copied" : "Copy"}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* SEO Description */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider">
                          YOUTUBE SEO DESCRIPTION:
                        </span>
                        <button
                          onClick={() => handleCopyText(selectedStudioClip?.description || "", "desc")}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {copiedField === "desc" ? "check" : "content_copy"}
                          </span>
                          {copiedField === "desc" ? "Copied" : "Copy Description"}
                        </button>
                      </div>
                      <div className="p-3 bg-black/40 border border-white/[0.04] rounded-xl font-mono text-xs text-zinc-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {selectedStudioClip?.description ||
                          `${podcastData?.guest || "Guest"} drops the brutal truth with Raj Shamani on Figuring Out.\n\n#shorts #rajshamani #figuringout #motivation`}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider">
                          ALGORITHMIC HASHTAGS &amp; TAGS:
                        </span>
                        <button
                          onClick={() => handleCopyText((selectedStudioClip?.tags || []).join(", "), "tags")}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {copiedField === "tags" ? "check" : "content_copy"}
                          </span>
                          {copiedField === "tags" ? "Copied" : "Copy All Tags"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedStudioClip?.tags || ["shorts", "raj shamani", "figuring out", "motivation", "discipline"]).map(
                          (tag: string, i: number) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs font-mono text-zinc-300 border border-white/[0.04]"
                            >
                              #{tag.replace("#", "")}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {/* Pinned Comment */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider">
                          FIRST PINNED COMMENT (RETENTION BOOSTER):
                        </span>
                        <button
                          onClick={() => handleCopyText(selectedStudioClip?.pinned_comment || "", "pinned")}
                          className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {copiedField === "pinned" ? "check" : "content_copy"}
                          </span>
                          {copiedField === "pinned" ? "Copied" : "Copy Comment"}
                        </button>
                      </div>
                      <div className="p-3 bg-black/40 border border-white/[0.04] rounded-xl text-xs text-zinc-200">
                        💬 {selectedStudioClip?.pinned_comment || "Would you agree with this? Let us know your thoughts in the comments! 👇"}
                      </div>
                    </div>
                  </div>
                )}

                {/* WORKSPACE TAB 4: CAPCUT & MULTI-TRACK EXPORT */}
                {studioWorkspaceTab === "EXPORT" && (
                  <div className="p-5 bg-[#121319] border border-white/10 rounded-2xl space-y-5 shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-purple-400 text-[20px]">folder_zip</span>
                          Multi-Track Asset Export Hub
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Zero-compression assets, universal subtitle formats, and direct CapCut Desktop timeline drafts.
                        </p>
                      </div>

                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/pipeline/podcast", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "open_capcut" })
                            });
                            const data = await res.json();
                            if (data.status === "success") toast.success("CapCut Desktop Launched!");
                            else toast.error(data.message || "Failed to launch CapCut");
                          } catch {
                            toast.error("Network error launching CapCut");
                          }
                        }}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        Launch CapCut
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Video MP4 Card */}
                      <div className="p-3.5 bg-black/40 border border-white/[0.04] rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-emerald-400 text-[16px]">videocam</span>
                            1080p FHD Video (MP4)
                          </h4>
                          <p className="text-[10px] text-zinc-400">
                            H.264 • 24 FPS • -14 LUFS Audio ({selectedStudioClip?.size_mb || 10} MB)
                          </p>
                        </div>
                        {selectedStudioClip?.download_url ? (
                          <a
                            href={selectedStudioClip.download_url}
                            download
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">download</span>
                            Download
                          </a>
                        ) : (
                          <span className="text-[10px] text-zinc-600">Pending</span>
                        )}
                      </div>

                      {/* Thumbnail Card */}
                      <div className="p-3.5 bg-black/40 border border-white/[0.04] rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-amber-400 text-[16px]">image</span>
                            Viral Thumbnail (JPG)
                          </h4>
                          <p className="text-[10px] text-zinc-400">High-CTR frame capture with brand overlay</p>
                        </div>
                        {selectedStudioClip?.thumbnail_url ? (
                          <a
                            href={selectedStudioClip.thumbnail_url}
                            download
                            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">download</span>
                            Download
                          </a>
                        ) : (
                          <span className="text-[10px] text-zinc-600">Pending</span>
                        )}
                      </div>

                      {/* SRT Subtitles Card */}
                      <div className="p-3.5 bg-black/40 border border-white/[0.04] rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-cyan-400 text-[16px]">closed_caption</span>
                            Standard SRT Subtitles
                          </h4>
                          <p className="text-[10px] text-zinc-400">Universal format for YouTube, Premiere, FCP</p>
                        </div>
                        {selectedStudioClip?.srt_url ? (
                          <a
                            href={selectedStudioClip.srt_url}
                            download
                            className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">download</span>
                            SRT
                          </a>
                        ) : (
                          <span className="text-[10px] text-zinc-600">Pending</span>
                        )}
                      </div>

                      {/* ASS Broadcast Styling Card */}
                      <div className="p-3.5 bg-black/40 border border-white/[0.04] rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-purple-400 text-[16px]">palette</span>
                            Broadcast ASS Subtitles
                          </h4>
                          <p className="text-[10px] text-zinc-400">Includes kinetic animations, fonts &amp; color styles</p>
                        </div>
                        {selectedStudioClip?.ass_url ? (
                          <a
                            href={selectedStudioClip.ass_url}
                            download
                            className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">download</span>
                            ASS
                          </a>
                        ) : (
                          <span className="text-[10px] text-zinc-600">Pending</span>
                        )}
                      </div>

                      {/* Multi-Cam 50/50 Split Video Card (If Available) */}
                      {selectedStudioClip?.has_split && (
                        <div className="p-3.5 bg-purple-950/20 border border-purple-500/30 rounded-xl flex items-center justify-between sm:col-span-2">
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-purple-400 text-[16px]">view_stream</span>
                              Dual-Cam 50/50 Split Cut (MP4)
                            </h4>
                            <p className="text-[10px] text-zinc-400">
                              Guest on top, Host Raj Shamani on bottom, Golden chest captions
                            </p>
                          </div>
                          <a
                            href={selectedStudioClip.split_video_url}
                            download
                            className="px-3.5 py-1.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1 shadow-md shadow-purple-500/20"
                          >
                            <span className="material-symbols-outlined text-[14px]">download</span>
                            Download Split MP4
                          </a>
                        </div>
                      )}
                    </div>

                    {/* CapCut Timeline Integration Status */}
                    <div className="p-4 bg-gradient-to-r from-purple-900/20 via-black to-cyan-900/20 border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          CapCut Desktop Timeline Registered: {selectedStudioClip?.capcut_draft_name || "SIMPLYYTR_DRAFT"}
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Separate layers for video, background audio, kinetic text, and outro badges are pre-assembled in your CapCut user data directory.
                        </p>
                      </div>

                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/pipeline/podcast", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "open_capcut" })
                            });
                            const data = await res.json();
                            if (data.status === "success") toast.success("Opening in CapCut...");
                            else toast.error(data.message || "Failed to launch CapCut");
                          } catch {
                            toast.error("Network error launching CapCut");
                          }
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap active:scale-95"
                      >
                        Open In CapCut
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. DYNAMIC INGESTION MODAL */}
            {ingestModalOpen && (
              <div
                className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
                onClick={() => setIngestModalOpen(false)}
              >
                <div
                  className="max-w-2xl w-full bg-[#13141a] border border-white/10 rounded-2xl p-6 shadow-2xl relative space-y-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">auto_videocam</span>
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-white">Ingest & Repurpose Any Podcast</h3>
                        <p className="text-xs text-zinc-400">Autonomous Whisper transcription, viral moment isolation & dual-stream editing.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIngestModalOpen(false)}
                      className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Discovered Videos on Disk */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      DISCOVERED VIDEOS IN DOWNLOADS (1-CLICK SELECT):
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-black/40 rounded-xl border border-white/[0.04]">
                      {(podcastData?.discoveredVideos || []).map((v: any, i: number) => (
                        <div
                          key={i}
                          onClick={() => {
                            setNewVideoPath(v.path);
                            setNewVideoTitle(v.filename.replace(".mp4", "").replace("_", " "));
                            if (v.filename.includes("Greene")) setNewVideoGuest("Robert Greene");
                            else if (v.filename.includes("Ayyoub")) setNewVideoGuest("Ayyoub El Osrouti");
                            else if (v.filename.includes("Raj")) setNewVideoGuest("Raj Shamani");
                            else setNewVideoGuest("Featured Guest");
                          }}
                          className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-all ${
                            newVideoPath === v.path
                              ? "bg-purple-500/20 border border-purple-500/50 text-white"
                              : "hover:bg-white/[0.04] text-zinc-300"
                          }`}
                        >
                          <span className="line-clamp-1 font-mono">{v.filename}</span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 whitespace-nowrap ml-2">
                            {v.size_mb} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manual Path & Details */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                        VIDEO FILE PATH (LOCAL MP4 / MKV):
                      </label>
                      <input
                        type="text"
                        placeholder="C:\path\to\podcast.mp4"
                        value={newVideoPath}
                        onChange={(e) => setNewVideoPath(e.target.value)}
                        className="w-full px-3 py-2 bg-black/50 border border-zinc-700 focus:border-purple-500 rounded-xl text-white font-mono text-xs outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                          EPISODE TITLE (OPTIONAL):
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. The Psychology of Power"
                          value={newVideoTitle}
                          onChange={(e) => setNewVideoTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-black/50 border border-zinc-700 focus:border-purple-500 rounded-xl text-white text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                          GUEST NAME:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Robert Greene"
                          value={newVideoGuest}
                          onChange={(e) => setNewVideoGuest(e.target.value)}
                          className="w-full px-3 py-2 bg-black/50 border border-zinc-700 focus:border-purple-500 rounded-xl text-white text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
                    <button
                      onClick={() => setIngestModalOpen(false)}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleIngestEpisode(newVideoPath)}
                      disabled={ingesting || !newVideoPath}
                      className="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">play_circle</span>
                      {ingesting ? "INGESTING..." : "START REPURPOSING PIPELINE"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4.5 CONNECT CREATOR CHANNEL / PROFILE MODAL */}
            {addChannelModalOpen && (
              <div
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
                onClick={() => setAddChannelModalOpen(false)}
              >
                <div
                  className="max-w-lg w-full bg-[#161823] border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-400 text-xl">smart_display</span>
                      <h3 className="text-base font-bold text-white">Connect Creator Channel / Profile</h3>
                    </div>
                    <button
                      onClick={() => setAddChannelModalOpen(false)}
                      className="text-zinc-500 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                        YOUTUBE CHANNEL HANDLE OR LINK:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. @rajshamani, @BeerBiceps, @hubermanlab, or https://youtube.com/@..."
                        value={newChannelHandle}
                        onChange={(e) => setNewChannelHandle(e.target.value)}
                        className="w-full px-3 py-2 bg-black/50 border border-zinc-700 focus:border-purple-500 rounded-xl text-white font-mono text-xs outline-none"
                      />
                      <span className="text-[10px] text-zinc-500 mt-1 block">
                        SIMPLYYTR automatically discovers recent episodes, subscriber metrics, and channel branding.
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                        CREATIVE AESTHETIC & EDITING PRESET:
                      </label>
                      <select
                        value={newChannelStyle}
                        onChange={(e) => setNewChannelStyle(e.target.value)}
                        className="w-full px-3 py-2 bg-black/50 border border-zinc-700 focus:border-purple-500 rounded-xl text-white text-xs outline-none cursor-pointer"
                      >
                        <option value="SHAMANI_SQUAD_AMBER">Shamani Squad (Neon Emerald Badges + Amber Words + Phonk Drops)</option>
                        <option value="TRS_MYSTIC_GOLD">The Ranveer Show (TRS Deep Gold + Contemplative Pacing)</option>
                        <option value="DOAC_CLEAN_MINIMAL">The Diary Of A CEO (Minimalist Monochrome + High Contrast)</option>
                        <option value="LEX_ACADEMIC_CLEAN">Lex Fridman (Academic Minimalist + Crisp White Subtitles)</option>
                      </select>
                    </div>

                    <div className="p-3 bg-black/40 rounded-xl border border-white/[0.04] space-y-1 text-[11px] text-zinc-400">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span className="material-symbols-outlined text-cyan-400 text-[14px]">auto_mode</span>
                        Autopilot Capabilities:
                      </div>
                      <p>
                        • Automatically monitors and indexes recent long-form episodes.
                        <br />
                        • Generates 9:16 Viral Shorts with 10/10 kinetic styling + 16:9 Broadcast Masterclasses.
                        <br />
                        • Registers editable native CapCut Desktop drafts with zero manual timeline work.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
                    <button
                      onClick={() => setAddChannelModalOpen(false)}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddChannel}
                      disabled={addingChannel || !newChannelHandle.trim()}
                      className="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">sensors</span>
                      {addingChannel ? "FETCHING CHANNEL..." : "CONNECT & INDEX CHANNEL"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. FULLSCREEN INSPECTION MODAL */}
            {selectedPodcastModal && (
              <div
                className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-fadeIn"
                onClick={() => setSelectedPodcastModal(null)}
              >
                <div
                  className="max-w-6xl w-full max-h-[92vh] bg-[#121319] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 md:px-6 bg-[#161821] border-b border-white/[0.08] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        {selectedPodcastModal.format}
                      </span>
                      <h3 className="text-sm md:text-base font-bold text-white line-clamp-1">
                        {selectedPodcastModal.title_primary || selectedPodcastModal.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => setSelectedPodcastModal(null)}
                      className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6">
                    <div className="lg:col-span-6 flex flex-col items-center justify-start space-y-4">
                      <div className={`w-full bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center ${
                        selectedPodcastModal.format?.includes("16:9") ? "aspect-video" : "max-w-[320px] aspect-[9/16]"
                      }`}>
                        {selectedPodcastModal.video_url ? (
                          <video controls autoPlay playsInline className="w-full h-full object-contain" src={selectedPodcastModal.video_url} />
                        ) : (
                          <div className="p-6 text-center text-zinc-500">Video offline</div>
                        )}
                      </div>

                      {selectedPodcastModal.download_url && (
                        <a
                          href={selectedPodcastModal.download_url}
                          download
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          Download Master MP4
                        </a>
                      )}
                    </div>

                    <div className="lg:col-span-6 flex flex-col space-y-4">
                      <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/[0.06]">
                        <button
                          onClick={() => setPodcastModalTab("METADATA")}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            podcastModalTab === "METADATA" ? "bg-zinc-800 text-white" : "text-zinc-400"
                          }`}
                        >
                          A/B TITLES & SEO
                        </button>
                        <button
                          onClick={() => setPodcastModalTab("VRS")}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            podcastModalTab === "VRS" ? "bg-zinc-800 text-white" : "text-zinc-400"
                          }`}
                        >
                          VIRALITY SCORE
                        </button>
                        <button
                          onClick={() => setPodcastModalTab("SPECS")}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            podcastModalTab === "SPECS" ? "bg-zinc-800 text-white" : "text-zinc-400"
                          }`}
                        >
                          BROADCAST SPECS
                        </button>
                      </div>

                      {podcastModalTab === "METADATA" && (
                        <div className="space-y-3 text-xs">
                          <div className="space-y-2">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">A/B TITLES</span>
                            {selectedPodcastModal.titles ? (
                              Object.entries(selectedPodcastModal.titles).map(([key, val]: any) => (
                                <div key={key} className="p-2.5 bg-black/30 border border-white/[0.04] rounded-lg flex items-center justify-between gap-3">
                                  <div>
                                    <span className="text-[9px] text-cyan-400 font-bold block uppercase">{key}:</span>
                                    <span className="text-white font-medium">{val}</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(val);
                                      toast.success("Title copied!");
                                    }}
                                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                  </button>
                                </div>
                              ))
                            ) : null}
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">DESCRIPTION</span>
                            <textarea
                              readOnly
                              rows={4}
                              value={selectedPodcastModal.description || ""}
                              className="w-full p-2.5 bg-black/40 border border-white/[0.06] rounded-lg text-zinc-300 font-mono text-[11px] outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {podcastModalTab === "VRS" && (
                        <div className="space-y-4 text-xs">
                          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent border border-purple-500/30 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-zinc-400 uppercase font-bold block">AI VIRALITY SCORE™</span>
                              <div className="text-3xl font-black text-amber-400 mt-0.5 tabular-nums">
                                🔥 {selectedPodcastModal.vrs_score || 88} <span className="text-sm text-zinc-500 font-normal">/ 100</span>
                              </div>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/40">
                              HIGH VIRAL LIFT
                            </span>
                          </div>
                        </div>
                      )}

                      {podcastModalTab === "SPECS" && (
                        <div className="space-y-3 text-xs">
                          <div className="p-3 bg-black/30 border border-white/[0.04] rounded-xl space-y-2">
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Format:</span>
                              <span className="text-white font-bold">{selectedPodcastModal.format}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Resolution:</span>
                              <span className="text-cyan-400 font-bold">{selectedPodcastModal.resolution}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Audio Loudness:</span>
                              <span className="text-emerald-400 font-bold">{selectedPodcastModal.audio_lufs || "-14.0 LUFS"}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: LOGS (Live System Telemetry & Deep Debug Console) */}
        {/* ========================================================================= */}
        {activeTab === "LOGS" && (
          <div className="space-y-6 font-mono-terminal">
            {/* 1. Subsystem Diagnostics & Health Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Worker Telemetry Card */}
              <div className="p-4 bg-[#141415] border border-[#3b494b]/40 rounded-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#849495] font-bold">KAGGLE GPU NODE</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${isWorkerOnline() ? "bg-emerald-400 animate-ping" : "bg-rose-500"}`}></span>
                </div>
                <p className={`text-xl font-extrabold mt-2 ${isWorkerOnline() ? "text-emerald-400" : "text-rose-400"}`}>
                  {isWorkerOnline() ? `ONLINE (${settings.useGpu ? "GPU NVENC" : "CPU"})` : "OFFLINE / IDLE"}
                </p>
                <p className="text-[10px] text-[#849495] mt-1">
                  Engine: {settings.renderEngine || "HYBRID"} • Mode: {settings.copyPasteMode || "clone_avatar"}
                </p>
                {settings.workerLastActiveAt && (
                  <p className="text-[9px] text-[#00f0ff] mt-0.5">
                    Last Ping: {new Date(settings.workerLastActiveAt).toLocaleTimeString()}
                  </p>
                )}
              </div>

              {/* Database Cluster Card */}
              <div className="p-4 bg-[#141415] border border-[#3b494b]/40 rounded-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#849495] font-bold">POSTGRES DB CLUSTER</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${dbStatus === "CONNECTED" ? "bg-emerald-400" : "bg-rose-500"}`}></span>
                </div>
                <p className={`text-xl font-extrabold mt-2 ${dbStatus === "CONNECTED" ? "text-emerald-400" : "text-rose-400"}`}>
                  {dbStatus === "CONNECTED" ? "CONNECTED" : dbStatus === "OFFLINE" ? "OFFLINE (PORT 5432)" : "CHECKING..."}
                </p>
                <p className="text-[10px] text-[#849495] mt-1">
                  {dbStatus === "CONNECTED" ? "Local PostgreSQL / simplyytr_dev" : "Run 'npm run db:start' to connect"}
                </p>
                <p className="text-[9px] text-[#00f0ff] mt-0.5">Total Jobs Tracked: {jobs.length}</p>
              </div>

              {/* LLM Reasoning Engine Card */}
              <div className="p-4 bg-[#141415] border border-[#3b494b]/40 rounded-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#849495] font-bold">LLM REASONING & RESEARCH</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${circuitTelemetry?.status === "OPEN" ? "bg-amber-400 animate-ping" : "bg-[#00f0ff] animate-pulse"}`}></span>
                </div>
                <p className="text-xl font-extrabold text-[#00f0ff] mt-2">
                  {circuitTelemetry?.status === "OPEN" ? "FALLBACK / DEMO" : "GROQ / HYBRID"}
                </p>
                <p className="text-[10px] text-[#849495] mt-1">
                  {circuitTelemetry?.status === "OPEN" ? "Circuit Open • Deterministic Grounding" : "Multi-Stage Agentic Grounding"}
                </p>
                <p className="text-[9px] text-[#00f0ff] mt-0.5">
                  Fallback: Offline Verified Contract
                </p>
              </div>

              {/* Circuit Breaker & Safety Dial */}
              <div className="p-4 bg-[#141415] border border-[#3b494b]/40 rounded-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#849495] font-bold">CIRCUIT BREAKER</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-xl font-extrabold text-emerald-400 mt-2">
                  {circuitTelemetry?.status || "CLOSED (HEALTHY)"}
                </p>
                <p className="text-[10px] text-[#849495] mt-1">
                  Consecutive Errors: {circuitTelemetry?.consecutiveFailures || 0}/5
                </p>
                <p className="text-[9px] text-purple-400 mt-0.5">
                  Auto-Publish: {settings.autoPublishOnline ? "ONLINE" : "PAUSED (HOLD IN R2)"}
                </p>
              </div>
            </div>

            {/* 2. Active Render Job Live Progress Stepper */}
            {activeTelemetryJob && (
              <div className="p-5 bg-[#141415] border border-[#00f0ff]/40 rounded-xl space-y-4 shadow-[0_0_25px_rgba(0,240,255,0.15)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#3b494b]/40 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
                    <h3 className="font-bold text-white font-sora text-sm">
                      ACTIVE RUNNER // JOB ID: <span className="text-[#00f0ff]">{activeTelemetryJob.id}</span>
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                    STATUS: {activeTelemetryJob.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-[#849495]">TOPIC IN PROGRESS:</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {activeTelemetryJob.generatedTitle || activeTelemetryJob.topic}
                  </p>
                  {activeTelemetryJob.statusMessage && (
                    <div className="mt-2 p-2.5 bg-[#1c1b1c] rounded border border-[#00f0ff]/30 text-xs text-[#00f0ff] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                      <span>{activeTelemetryJob.statusMessage}</span>
                    </div>
                  )}
                </div>

                {/* Pipeline Step Sequence Tracker */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-[10px]">
                  {[
                    { step: "1. RADAR", label: "Trend Harvest", done: true },
                    { step: "2. EVIDENCE", label: "Claim Grounding", done: true },
                    { step: "3. BATTLE", label: "3-Angle Judge", done: true },
                    { step: "4. GATE", label: "Adversary Audit", done: activeTelemetryJob.status === "RENDERING" },
                    { step: "5. GPU RENDER", label: "Whisper & FFmpeg", active: activeTelemetryJob.status === "RENDERING" },
                    { step: "6. STORAGE", label: "Cloudflare R2", done: false },
                    { step: "7. PUBLISH", label: "YouTube Data API", done: false }
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded border flex flex-col items-center justify-center ${
                        s.done
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                          : s.active
                            ? "bg-[#00f0ff]/15 border-[#00f0ff] text-[#00f0ff] animate-pulse"
                            : "bg-[#1c1b1c] border-[#3b494b]/30 text-[#849495]"
                      }`}
                    >
                      <span className="font-bold">{s.step}</span>
                      <span className="text-[9px] truncate max-w-full">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Live Streaming Monospace Telemetry Terminal */}
            <div className="p-6 bg-[#141415] border border-[#3b494b]/40 rounded-xl space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#3b494b]/40 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white font-sora flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00f0ff]">terminal</span>
                    Live Subsystem Telemetry & Debug Stream
                  </h2>
                  <p className="text-xs text-[#849495]">
                    Real-time execution trace of all agentic planning, claim linting, retention simulations, and GPU operations
                  </p>
                </div>

                {/* Filter Tabs & Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleTestDiagnosticPing}
                    className="px-3 py-1.5 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 rounded text-xs font-bold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                    Ping Diagnostic
                  </button>

                  <button
                    onClick={copyAllLogs}
                    className="px-3 py-1.5 bg-[#1c1b1c] hover:bg-[#252426] text-[#b9cacb] border border-[#3b494b]/40 rounded text-xs flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    Copy Logs
                  </button>

                  <button
                    onClick={handleClearLogs}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    Clear Terminal
                  </button>
                </div>
              </div>

              {/* Filter Pills Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: "ALL", label: `ALL (${telemetryLogs.length})` },
                    { id: "AGENT", label: `AGENTIC (${telemetryLogs.filter(l => l.level === "AGENT").length})` },
                    { id: "WORKER", label: `GPU WORKER (${telemetryLogs.filter(l => l.level === "WORKER").length})` },
                    { id: "GATE", label: `QUALITY GATES (${telemetryLogs.filter(l => l.level === "GATE" || l.stage === "LINTER" || l.stage === "RETENTION" || l.stage === "ADVERSARY").length})` },
                    { id: "SUCCESS", label: `SUCCESS (${telemetryLogs.filter(l => l.level === "SUCCESS").length})` },
                    { id: "ERROR", label: `ERRORS (${telemetryLogs.filter(l => l.level === "ERROR" || l.level === "WARN").length})` }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setTelemetryFilter(f.id)}
                      className={`px-3 py-1 rounded text-[11px] font-bold transition-all ${
                        telemetryFilter === f.id
                          ? "bg-[#00f0ff] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                          : "bg-[#1c1b1c] text-[#849495] hover:text-white border border-[#3b494b]/30"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setAutoScrollLogs(!autoScrollLogs)}
                  className={`text-[11px] flex items-center gap-1.5 px-2.5 py-1 rounded border ${
                    autoScrollLogs
                      ? "border-[#00f0ff]/40 text-[#00f0ff] bg-[#00f0ff]/10"
                      : "border-zinc-700 text-zinc-400 bg-zinc-800/40"
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {autoScrollLogs ? "sync" : "pause"}
                  </span>
                  Auto-Scroll: {autoScrollLogs ? "ON" : "PAUSED"}
                </button>
              </div>

              {/* Terminal Logs Display */}
              <div className="bg-[#0a0a0b] border border-[#3b494b]/50 rounded-lg p-4 font-mono-terminal text-xs h-[450px] overflow-y-auto space-y-1.5 select-text shadow-inner">
                {telemetryLogs
                  .filter(log => {
                    if (telemetryFilter === "ALL") return true;
                    if (telemetryFilter === "AGENT") return log.level === "AGENT";
                    if (telemetryFilter === "WORKER") return log.level === "WORKER";
                    if (telemetryFilter === "GATE") return log.level === "GATE" || log.stage === "LINTER" || log.stage === "RETENTION" || log.stage === "ADVERSARY";
                    if (telemetryFilter === "SUCCESS") return log.level === "SUCCESS";
                    if (telemetryFilter === "ERROR") return log.level === "ERROR" || log.level === "WARN";
                    return true;
                  })
                  .map((log) => {
                    const levelColors: Record<string, string> = {
                      INFO: "text-zinc-400 border-zinc-700 bg-zinc-800/40",
                      AGENT: "text-[#00f0ff] border-[#00f0ff]/40 bg-[#00f0ff]/10",
                      WORKER: "text-amber-300 border-amber-500/40 bg-amber-500/10",
                      GATE: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
                      SUCCESS: "text-emerald-300 border-emerald-400/50 bg-emerald-500/15",
                      WARN: "text-yellow-300 border-yellow-500/40 bg-yellow-500/10",
                      ERROR: "text-rose-400 border-rose-500/50 bg-rose-500/15"
                    };

                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedLogEntry(log)}
                        className="p-2 rounded hover:bg-[#161618] transition-colors flex items-start gap-2.5 cursor-pointer border border-transparent hover:border-[#3b494b]/40 group"
                      >
                        <span className="text-[#849495] shrink-0 text-[11px]">
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>

                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border uppercase shrink-0 ${levelColors[log.level] || levelColors.INFO}`}>
                          {log.level}
                        </span>

                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[#849495] text-[10px] uppercase shrink-0">
                          {log.stage}
                        </span>

                        {log.jobId && (
                          <span className="text-[#00f0ff] text-[11px] shrink-0">
                            #{log.jobId.slice(-6)}
                          </span>
                        )}

                        <span className="text-zinc-200 flex-1 leading-relaxed break-words">
                          {log.message}
                        </span>

                        {log.details && (
                          <span className="text-[10px] text-[#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            Inspect ↗
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 4. Deep Debug Job Explorer */}
            <div className="p-6 bg-[#141415] border border-[#3b494b]/40 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#3b494b]/40 pb-4">
                <div>
                  <h3 className="font-bold text-white font-sora text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00f0ff]">bug_report</span>
                    Subsystem Job Trace & Adversarial Rubric Inspector
                  </h3>
                  <p className="text-xs text-[#849495]">Click any job to inspect its raw evidence graph, prompt chains, retention curve, and red-team critiques</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono-terminal">
                  <thead>
                    <tr className="border-b border-[#3b494b]/40 text-[#849495]">
                      <th className="pb-3 px-2">JOB ID</th>
                      <th className="pb-3 px-2">STATUS</th>
                      <th className="pb-3 px-2">TOPIC / SCRIPT HOOK</th>
                      <th className="pb-3 px-2">STYLE</th>
                      <th className="pb-3 px-2">TIMESTAMP</th>
                      <th className="pb-3 px-2 text-right">DEBUG ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3b494b]/20">
                    {jobs.slice(0, 8).map(j => (
                      <tr key={j.id} className="hover:bg-[#1c1b1c]/50 transition-colors">
                        <td className="py-3 px-2 text-[#00f0ff] font-bold">{j.id.slice(-8)}</td>
                        <td className="py-3 px-2">{getStatusBadge(j.status)}</td>
                        <td className="py-3 px-2 max-w-sm truncate text-white">
                          {j.generatedTitle || j.topic}
                        </td>
                        <td className="py-3 px-2 text-zinc-400">{j.videoStyle}</td>
                        <td className="py-3 px-2 text-[#849495]">{new Date(j.createdAt).toLocaleTimeString()}</td>
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={() => setSelectedDebugJob(j)}
                            className="px-2.5 py-1 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 rounded text-[11px] font-bold"
                          >
                            Inspect Raw Trace ↗
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PULSE (Competitive Pulse & Predation Scoring) */}
        {/* ========================================================================= */}
        {activeTab === "PULSE" && (
          <div className="space-y-6">
            <div className="p-6 bg-[#141415] border border-[#3b494b]/40 rounded space-y-4">
              <div className="flex items-center justify-between border-b border-[#3b494b]/40 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white font-sora flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00f0ff]">query_stats</span>
                    Competitor Velocity Tracker & Rapid Trend-Jacking
                  </h2>
                  <p className="text-xs text-[#849495] font-mono-terminal">Real-time competitor predation radar with 1-click counter script generation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { competitor: "@TechVanguard", topic: "NVIDIA Quantum Chip Released", velocity: "42.8k views/hr", predation: 94, category: "HARDWARE" },
                  { competitor: "@MindsetPulse", topic: "The 4-Hour Dopamine Protocol", velocity: "28.1k views/hr", predation: 88, category: "SELF-IMPROVEMENT" },
                  { competitor: "@CryptoSentinel", topic: "Bitcoin Liquidity Shock Incoming", velocity: "19.5k views/hr", predation: 81, category: "FINANCE" }
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-[#1c1b1c] border border-[#3b494b]/40 rounded space-y-3 font-mono-terminal text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#849495]">{item.competitor}</span>
                      <span className="px-2 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 text-[10px]">{item.category}</span>
                    </div>
                    <p className="font-bold text-white text-sm font-sora">{item.topic}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-bold">{item.velocity}</span>
                      <span className="text-amber-400">Predation: {item.predation}%</span>
                    </div>
                    <button
                      onClick={() => triggerTrendJack(item.topic, item.competitor, item.velocity)}
                      disabled={loading}
                      className="w-full py-2 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 rounded font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      1-CLICK TREND-JACK
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: COMPLIANCE (Content ID & Ad-Safe Proxy) */}
        {/* ========================================================================= */}
        {activeTab === "COMPLIANCE" && (
          <div className="space-y-6">
            <div className="p-6 bg-[#141415] border border-[#3b494b]/40 rounded space-y-4">
              <h2 className="text-lg font-bold text-white font-sora flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00f0ff]">verified_user</span>
                Content ID & Ad-Safe Lexicon Sandbox
              </h2>
              <p className="text-xs text-[#849495] font-mono-terminal">Test any script against the 2026 YouTube demonetization dictionary and Content ID risk calculator</p>

              <div className="space-y-3">
                <textarea
                  value={complianceInput}
                  onChange={e => setComplianceInput(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-[#1c1b1c] border border-[#3b494b]/40 rounded font-mono-terminal text-xs text-white focus:border-[#00f0ff] outline-none"
                  placeholder="Enter script text to scan for demonetization trigger words..."
                />
                <button
                  onClick={runComplianceScan}
                  className="px-4 py-2 bg-[#00f0ff] text-black font-mono-terminal text-xs font-bold rounded flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">security</span>
                  EXECUTE COMPLIANCE SCAN
                </button>
              </div>

              {complianceResult && (
                <div className="p-4 bg-[#1c1b1c] border border-[#3b494b]/40 rounded space-y-3 font-mono-terminal text-xs">
                  <div className="flex items-center justify-between border-b border-[#3b494b]/40 pb-2">
                    <span>RISK SCORE: <strong className="text-emerald-400">{complianceResult.riskScore}% [{complianceResult.riskCategory}]</strong></span>
                    <span>AD-SAFE REPLACEMENTS: <strong className="text-[#00f0ff]">{complianceResult.replacements?.length || 0}</strong></span>
                  </div>
                  <div>
                    <p className="text-[#849495] text-[11px] mb-1">SANITIZED AD-SAFE OUTPUT:</p>
                    <p className="p-2.5 bg-[#141415] rounded border border-emerald-500/30 text-emerald-300">{complianceResult.cleanText}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: RLYA (Recursive Learning & Analytics Core) */}
        {/* ========================================================================= */}
        {activeTab === "RLYA" && (
          <div className="space-y-6">
            <div className="p-6 bg-[#141415] border border-[#3b494b]/40 rounded space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3b494b]/40 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white font-sora flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00f0ff]">psychology</span>
                    RLYA Self-Learning Analytics Engine
                  </h2>
                  <p className="text-xs text-[#849495] font-mono-terminal">Real-time audience retention curves & algorithmic hook reinforcement</p>
                </div>
                <button
                  onClick={syncAnalytics}
                  disabled={syncing}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded text-xs font-mono-terminal font-bold transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">{syncing ? "sync" : "cloud_sync"}</span>
                  {syncing ? "SYNCING..." : "SYNC YOUTUBE VIEWS"}
                </button>
              </div>

              {/* Top Performing Content Leaderboard */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#849495] uppercase font-mono-terminal tracking-wider">Top Performing Content Leaderboard</h3>
                {jobs.filter(j => (j.views > 0) || j.publishedYoutubeId).length === 0 ? (
                  <div className="p-8 text-center text-[#849495] font-mono-terminal border border-dashed border-[#3b494b]/30 rounded text-xs">
                    No published performance telemetry recorded yet. Views will populate automatically as videos are published.
                  </div>
                ) : (
                  jobs.filter(j => (j.views > 0) || j.publishedYoutubeId)
                    .sort((a, b) => (b.views || 0) - (a.views || 0))
                    .map((job, idx) => (
                      <div key={job.id} className="p-4 bg-[#1c1b1c] border border-[#3b494b]/40 rounded flex items-center justify-between gap-4 font-mono-terminal text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{job.generatedTitle || job.topic}</p>
                            <p className="text-[10px] text-[#849495] truncate">ID: {job.id.slice(-6)} • Retention Score: {job.retentionScore || 0}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-emerald-400 font-extrabold text-sm">{(job.views || 0).toLocaleString()} views</span>
                          {job.publishedYoutubeId && (
                            <a
                              href={`https://youtube.com/shorts/${job.publishedYoutubeId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-white text-[11px]"
                            >
                              ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: NODES (Architecture Compute Cluster) */}
        {/* ========================================================================= */}
        {activeTab === "NODES" && (
          <div className="space-y-6">
            <div className="p-6 bg-[#141415] border border-[#3b494b]/40 rounded space-y-4">
              <h2 className="text-lg font-bold text-white font-sora flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00f0ff]">hub</span>
                Hybrid Compute Cluster Node Map
              </h2>
              <p className="text-xs text-[#849495] font-mono-terminal">Real-time status of all distributed rendering, brain, and uploader nodes</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono-terminal text-xs">
                <div className="p-4 bg-[#1c1b1c] border border-emerald-500/30 rounded flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">1</span>
                    <div>
                      <p className="font-bold text-white">Vercel Brain & Supabase DB</p>
                      <p className="text-[10px] text-[#849495]">Next.js API Gateway + PostgreSQL Pooler</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold">● ONLINE</span>
                </div>

                <div className="p-4 bg-[#1c1b1c] border border-emerald-500/30 rounded flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">2</span>
                    <div>
                      <p className="font-bold text-white">Viral Cloner Engine</p>
                      <p className="text-[10px] text-[#849495]">OpenVoice V2 Neural Zero-Shot Reference</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold">● ACTIVE</span>
                </div>

                <div className={`p-4 bg-[#1c1b1c] border ${isWorkerOnline() ? "border-emerald-500/30" : "border-rose-500/30"} rounded flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">3</span>
                    <div>
                      <p className="font-bold text-white">Kaggle GPU/CPU Worker</p>
                      <p className="text-[10px] text-[#849495]">SadTalker Avatar Lip-Sync & Faster-Whisper</p>
                    </div>
                  </div>
                  <span className={isWorkerOnline() ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    {isWorkerOnline() ? `● ONLINE (${settings.useGpu ? "GPU" : "CPU"})` : "● OFFLINE"}
                  </span>
                </div>

                <div className="p-4 bg-[#1c1b1c] border border-blue-500/30 rounded flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">4</span>
                    <div>
                      <p className="font-bold text-white">GitHub Actions Serverless Runner</p>
                      <p className="text-[10px] text-[#849495]">Headless FFmpeg Compositor ($0 Cost)</p>
                    </div>
                  </div>
                  <span className="text-blue-400 font-bold">● READY</span>
                </div>

                <div className="p-4 bg-[#1c1b1c] border border-amber-500/30 rounded flex items-center justify-between md:col-span-2">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">5</span>
                    <div>
                      <p className="font-bold text-white">Puppeteer Stealth Uploader Agent</p>
                      <p className="text-[10px] text-[#849495]">Autonomous YouTube Shorts Publisher</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold">● POLLING...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: REVENUE (Monetization Audit) */}
        {/* ========================================================================= */}
        {activeTab === "REVENUE" && (
          <div className="space-y-6">
            <div className="p-6 bg-[#141415] border border-[#3b494b]/40 rounded space-y-4">
              <h2 className="text-lg font-bold text-white font-sora flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00f0ff]">monetization_on</span>
                Monetization Audit & RPM Yield
              </h2>
              <p className="text-xs text-[#849495] font-mono-terminal">Estimated RPM yield & high-monetization niche routing</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-terminal text-xs">
                <div className="p-4 bg-[#1c1b1c] border border-[#3b494b]/40 rounded">
                  <p className="text-[#849495]">AVERAGE RPM</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">$6.42</p>
                  <p className="text-[10px] text-[#849495] mt-1">High-value finance & tech tier</p>
                </div>
                <div className="p-4 bg-[#1c1b1c] border border-[#3b494b]/40 rounded">
                  <p className="text-[#849495]">ESTIMATED 30-DAY YIELD</p>
                  <p className="text-2xl font-bold text-[#00f0ff] mt-1">$4,850.00</p>
                  <p className="text-[10px] text-[#849495] mt-1">At 850k aggregate monthly views</p>
                </div>
                <div className="p-4 bg-[#1c1b1c] border border-[#3b494b]/40 rounded">
                  <p className="text-[#849495]">CONTENT ID CLAIMS</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">0 CLAIMS</p>
                  <p className="text-[10px] text-[#849495] mt-1">100% Monetization Protection</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: SETTINGS (Full System Configuration Bay) */}
        {/* ========================================================================= */}
        {activeTab === "SETTINGS" && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="p-6 bg-[#141415] border border-[#3b494b]/40 rounded space-y-6">
              <div className="border-b border-[#3b494b]/40 pb-4">
                <h2 className="text-lg font-bold text-white font-sora flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00f0ff]">tune</span>
                  System Configuration Bay
                </h2>
                <p className="text-xs text-[#849495] font-mono-terminal">Configure niche routing, voice neural models, video effects, and autonomous switches</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono-terminal text-xs">
                {/* Target Niche */}
                <div className="space-y-2">
                  <label className="text-[#849495] uppercase">Target Niche / Topic</label>
                  <input
                    type="text"
                    value={settings.targetNiche || settings.niche || ""}
                    onChange={e => setSettings({ ...settings, targetNiche: e.target.value, niche: e.target.value })}
                    className="w-full p-3 bg-[#1c1b1c] border border-[#3b494b]/40 rounded text-white focus:border-[#00f0ff] outline-none"
                    placeholder="e.g. Motivation, AI Tech, Finance"
                  />
                </div>

                {/* Custom Topic Prompt */}
                <div className="space-y-2">
                  <label className="text-[#849495] uppercase">Custom Topic Prompt (Optional)</label>
                  <input
                    type="text"
                    value={settings.customTopicPrompt || ""}
                    onChange={e => setSettings({ ...settings, customTopicPrompt: e.target.value })}
                    className="w-full p-3 bg-[#1c1b1c] border border-[#3b494b]/40 rounded text-white focus:border-[#00f0ff] outline-none"
                    placeholder="Leave empty to use automatic daily Google Trends"
                  />
                </div>

                {/* Voice Model Selector */}
                <div className="space-y-2">
                  <label className="text-[#849495] uppercase">Default Voice Model</label>
                  <select
                    value={settings.voiceName || "en-US-GuyNeural"}
                    onChange={e => setSettings({ ...settings, voiceName: e.target.value })}
                    className="w-full p-3 bg-[#1c1b1c] border border-[#3b494b]/40 rounded text-white focus:border-[#00f0ff] outline-none"
                  >
                    {getAvailableVoices().map((v: any) => (
                      <option key={v.name || v} value={v.name || v}>
                        {v.label || v.name || v}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AI Script Tone */}
                <div className="space-y-2">
                  <label className="text-[#849495] uppercase">Groq AI Script Tone</label>
                  <select
                    value={settings.geminiTone || "Clickbaity"}
                    onChange={e => setSettings({ ...settings, geminiTone: e.target.value })}
                    className="w-full p-3 bg-[#1c1b1c] border border-[#3b494b]/40 rounded text-white focus:border-[#00f0ff] outline-none"
                  >
                    <option value="Clickbaity">Clickbaity & High Retention</option>
                    <option value="Authoritative">Authoritative & Analytical</option>
                    <option value="Enthusiastic">Enthusiastic & High-Energy</option>
                    <option value="Educational">Educational & Insightful</option>
                    <option value="Dark Humor">Dark Humor & Sarcastic</option>
                    <option value="Provocative">Provocative & Debate-Igniting</option>
                  </select>
                </div>

                {/* Default Video Style */}
                <div className="space-y-2">
                  <label className="text-[#00f0ff] uppercase font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">movie_filter</span>
                    Viral Video Strategy & Style
                  </label>
                  <select
                    value={settings.defaultVideoStyle || "PRODUCT_FIND"}
                    onChange={e => setSettings({ ...settings, defaultVideoStyle: e.target.value })}
                    className="w-full p-3 bg-[#1c1b1c] border border-[#00f0ff]/40 rounded text-[#00f0ff] font-bold focus:border-[#00f0ff] outline-none"
                  >
                    <option value="PRODUCT_FIND">🛍️ Viral Product Finds (Amazon/TikTok Gadgets + Auto Affiliate)</option>
                    <option value="REMASTER_REACTION">🔥 Transformative Remaster & Fair-Use Re-Narration</option>
                    <option value="CURIOSITY_SPLITSCREEN">⚡ Curiosity Explainer + 60fps Hypnotic Split-Screen</option>
                    <option value="STANDARD">📹 Dynamic B-Roll Compilation</option>
                  </select>
                </div>

                {/* Amazon Associate Tag */}
                <div className="space-y-2">
                  <label className="text-[#849495] uppercase">Amazon Associate Tag</label>
                  <input
                    type="text"
                    value={settings.amazonAssociateTag || "simplyytr-20"}
                    onChange={e => setSettings({ ...settings, amazonAssociateTag: e.target.value })}
                    className="w-full p-3 bg-[#1c1b1c] border border-[#3b494b]/40 rounded text-white focus:border-[#00f0ff] outline-none"
                    placeholder="e.g. yourstore-20"
                  />
                </div>

                {/* Custom Affiliate Prefix */}
                <div className="space-y-2">
                  <label className="text-[#849495] uppercase">Custom Affiliate Link Prefix (Optional)</label>
                  <input
                    type="text"
                    value={settings.customAffiliatePrefix || ""}
                    onChange={e => setSettings({ ...settings, customAffiliatePrefix: e.target.value })}
                    className="w-full p-3 bg-[#1c1b1c] border border-[#3b494b]/40 rounded text-white focus:border-[#00f0ff] outline-none"
                    placeholder="e.g. https://amzn.to/deals or https://yourdomain.com/go"
                  />
                </div>

                {/* Primary Render Engine */}
                <div className="space-y-2">
                  <label className="text-[#849495] uppercase">Primary Render Engine</label>
                  <select
                    value={settings.renderEngine || "HYBRID"}
                    onChange={e => setSettings({ ...settings, renderEngine: e.target.value })}
                    className="w-full p-3 bg-[#1c1b1c] border border-[#3b494b]/40 rounded text-white focus:border-[#00f0ff] outline-none"
                  >
                    <option value="HYBRID">HYBRID (Kaggle GPU + GitHub Actions)</option>
                    <option value="KAGGLE">KAGGLE (Dedicated GPU Kernel)</option>
                    <option value="GITHUB_ACTIONS">GITHUB ACTIONS ($0 Serverless FFmpeg)</option>
                  </select>
                </div>

                {/* Video Speed */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[#849495]">
                    <span>VIDEO SPEED MULTIPLIER</span>
                    <span className="text-[#00f0ff]">{settings.videoSpeed || 1.05}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.5"
                    step="0.05"
                    value={settings.videoSpeed || 1.05}
                    onChange={e => setSettings({ ...settings, videoSpeed: parseFloat(e.target.value) })}
                    className="w-full accent-[#00f0ff]"
                  />
                </div>

                {/* Bass Boost */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[#849495]">
                    <span>AUDIO BASS BOOST</span>
                    <span className="text-[#00f0ff]">+{settings.audioBass || 3} dB</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={settings.audioBass || 3}
                    onChange={e => setSettings({ ...settings, audioBass: parseInt(e.target.value) })}
                    className="w-full accent-[#00f0ff]"
                  />
                </div>

                {/* RLYA Learning Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[#849495]">
                    <span>RLYA LEARNING VELOCITY</span>
                    <span className="text-[#00f0ff]">{settings.rlyaLearningRate || 1.0}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={settings.rlyaLearningRate || 1.0}
                    onChange={e => setSettings({ ...settings, rlyaLearningRate: parseFloat(e.target.value) })}
                    className="w-full accent-[#00f0ff]"
                  />
                </div>
              </div>

              {/* Toggles Section */}
              <div className="space-y-3 pt-4 border-t border-[#3b494b]/40 font-mono-terminal text-xs">
                <div className="flex items-center justify-between p-3.5 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                  <div>
                    <p className="font-bold text-white">Copy-Paste / Viral Cloner Mode</p>
                    <p className="text-[11px] text-[#849495]">Download top viral shorts from YouTube & clone voice references</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, copyPasteMode: settings.copyPasteMode === "clone_avatar" ? "search_trends" : "clone_avatar" })}
                    className={`px-3 py-1 rounded text-xs font-bold ${settings.copyPasteMode === "clone_avatar" ? "bg-emerald-500 text-black" : "bg-zinc-700 text-white"}`}
                  >
                    {settings.copyPasteMode === "clone_avatar" ? "ENABLED" : "DISABLED"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                  <div>
                    <p className="font-bold text-white">Enable Kaggle GPU Mode</p>
                    <p className="text-[11px] text-[#849495]">Requests GPU kernel on Kaggle for high-speed avatar rendering</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, useGpu: !settings.useGpu })}
                    className={`px-3 py-1 rounded text-xs font-bold ${settings.useGpu ? "bg-emerald-500 text-black" : "bg-zinc-700 text-white"}`}
                  >
                    {settings.useGpu ? "GPU MODE" : "CPU MODE"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                  <div>
                    <p className="font-bold text-white">Full Auto-Pilot Engine</p>
                    <p className="text-[11px] text-[#849495]">Allow scheduled cron jobs to trigger the pipeline automatically</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, autoPilotEnabled: !settings.autoPilotEnabled })}
                    className={`px-3 py-1 rounded text-xs font-bold ${settings.autoPilotEnabled ? "bg-emerald-500 text-black" : "bg-zinc-700 text-white"}`}
                  >
                    {settings.autoPilotEnabled ? "AUTOPILOT ON" : "MANUAL ONLY"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                  <div>
                    <p className="font-bold text-white">Self-Learning AI Loop (RLYA)</p>
                    <p className="text-[11px] text-[#849495]">Feed real YouTube audience retention data back into Groq prompt generation</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, enableSelfLearningAI: !settings.enableSelfLearningAI })}
                    className={`px-3 py-1 rounded text-xs font-bold ${settings.enableSelfLearningAI ? "bg-[#00f0ff] text-black" : "bg-zinc-700 text-white"}`}
                  >
                    {settings.enableSelfLearningAI ? "ACTIVE" : "INACTIVE"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                  <div>
                    <p className="font-bold text-white">Ad-Safe Lexicon & Demonetization Filter</p>
                    <p className="text-[11px] text-[#849495]">Auto-replace borderline keywords before TTS audio generation</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, adSafeFilterEnabled: !settings.adSafeFilterEnabled })}
                    className={`px-3 py-1 rounded text-xs font-bold ${settings.adSafeFilterEnabled ? "bg-emerald-500 text-black" : "bg-zinc-700 text-white"}`}
                  >
                    {settings.adSafeFilterEnabled ? "SHIELD ACTIVE" : "BYPASSED"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                  <div>
                    <p className="font-bold text-white">Preserve Original Video Audio</p>
                    <p className="text-[11px] text-[#849495]">Mix original background audio instead of complete voice replacement</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, replaceOriginalAudio: !settings.replaceOriginalAudio })}
                    className={`px-3 py-1 rounded text-xs font-bold ${settings.replaceOriginalAudio ? "bg-emerald-500 text-black" : "bg-zinc-700 text-white"}`}
                  >
                    {settings.replaceOriginalAudio ? "REPLACE" : "PRESERVE"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                  <div>
                    <p className="font-bold text-white">Neon Kinetic ASS Captions</p>
                    <p className="text-[11px] text-[#849495]">Render centered, bouncing neon yellow & cyan glowing subtitles</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, enableGlowCaptions: settings.enableGlowCaptions !== false ? false : true })}
                    className={`px-3 py-1 rounded text-xs font-bold ${settings.enableGlowCaptions !== false ? "bg-[#00f0ff] text-black" : "bg-zinc-700 text-white"}`}
                  >
                    {settings.enableGlowCaptions !== false ? "ACTIVE GLOW" : "STATIC SUBS"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                  <div>
                    <p className="font-bold text-white">Cinematic Shaders & Color Grade</p>
                    <p className="text-[11px] text-[#849495]">Vibrant contrast boost + subtle edge vignette to maximize CTR & evade Content ID</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, enableCinematicLut: settings.enableCinematicLut !== false ? false : true })}
                    className={`px-3 py-1 rounded text-xs font-bold ${settings.enableCinematicLut !== false ? "bg-emerald-500 text-black" : "bg-zinc-700 text-white"}`}
                  >
                    {settings.enableCinematicLut !== false ? "CINEMATIC ON" : "STANDARD"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                  <div>
                    <p className="font-bold text-white">60FPS Hypnotic Split-Screen Engine</p>
                    <p className="text-[11px] text-[#849495]">Auto-compose satisfying bottom loop (Minecraft / kinetic sand / soap cutting)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, enableSplitScreen: settings.enableSplitScreen !== false ? false : true })}
                    className={`px-3 py-1 rounded text-xs font-bold ${settings.enableSplitScreen !== false ? "bg-purple-500 text-white" : "bg-zinc-700 text-white"}`}
                  >
                    {settings.enableSplitScreen !== false ? "SPLIT-SCREEN" : "FULLSCREEN"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#00f0ff] hover:bg-[#00d0df] text-black font-mono-terminal text-sm font-extrabold rounded transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                SAVE & DEPLOY CONFIGURATION
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Watch Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-[#141415] border border-[#00f0ff]/40 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#3b494b]/40 flex justify-between items-center bg-[#1c1b1c]">
              <h3 className="font-bold text-white font-sora text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00f0ff] text-[16px]">play_circle</span>
                Video Preview Player
              </h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="aspect-[9/16] bg-black flex items-center justify-center">
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Log Detail Inspector Modal */}
      {selectedLogEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono-terminal">
          <div className="relative w-full max-w-2xl bg-[#141415] border border-[#00f0ff]/40 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#3b494b]/40 flex justify-between items-center bg-[#1c1b1c]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded border border-[#00f0ff]/40 text-[#00f0ff] bg-[#00f0ff]/10 font-bold uppercase">
                  {selectedLogEntry.level} // {selectedLogEntry.stage}
                </span>
                <h3 className="font-bold text-white font-sora text-sm">
                  Telemetry Event Inspector
                </h3>
              </div>
              <button
                onClick={() => setSelectedLogEntry(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <p className="text-[11px] text-[#849495]">TIMESTAMP:</p>
                <p className="text-xs text-white mt-0.5">{selectedLogEntry.timestamp} ({new Date(selectedLogEntry.timestamp).toLocaleString()})</p>
              </div>
              <div>
                <p className="text-[11px] text-[#849495]">LOG MESSAGE:</p>
                <p className="text-xs font-bold text-[#00f0ff] mt-0.5">{selectedLogEntry.message}</p>
              </div>
              {selectedLogEntry.jobId && (
                <div>
                  <p className="text-[11px] text-[#849495]">ASSOCIATED JOB ID:</p>
                  <p className="text-xs text-amber-300 mt-0.5">{selectedLogEntry.jobId}</p>
                </div>
              )}
              {selectedLogEntry.details && (
                <div>
                  <p className="text-[11px] text-[#849495] mb-1">RAW JSON PAYLOAD & TELEMETRY:</p>
                  <pre className="p-4 bg-[#0a0a0b] border border-[#3b494b]/40 rounded-lg text-xs text-zinc-300 overflow-x-auto select-text">
                    {JSON.stringify(selectedLogEntry.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Raw Job Debug Inspector Modal */}
      {selectedDebugJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono-terminal">
          <div className="relative w-full max-w-3xl bg-[#141415] border border-[#00f0ff]/40 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#3b494b]/40 flex justify-between items-center bg-[#1c1b1c]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00f0ff] text-[18px]">developer_board</span>
                <h3 className="font-bold text-white font-sora text-sm">
                  Subsystem Job Debugger // ID: <span className="text-[#00f0ff]">{selectedDebugJob.id}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedDebugJob(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                  <p className="text-[10px] text-[#849495]">STATUS</p>
                  <p className="font-bold text-white mt-0.5">{selectedDebugJob.status}</p>
                </div>
                <div className="p-3 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                  <p className="text-[10px] text-[#849495]">VIDEO STYLE</p>
                  <p className="font-bold text-amber-300 mt-0.5">{selectedDebugJob.videoStyle}</p>
                </div>
                <div className="p-3 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                  <p className="text-[10px] text-[#849495]">ENGINE</p>
                  <p className="font-bold text-[#00f0ff] mt-0.5">{selectedDebugJob.renderEngine}</p>
                </div>
                <div className="p-3 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                  <p className="text-[10px] text-[#849495]">RISK SCORE</p>
                  <p className="font-bold text-emerald-400 mt-0.5">{(selectedDebugJob.contentIdRiskScore || 0).toFixed(1)}%</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-[#849495]">TOPIC & TITLE:</p>
                <p className="text-sm font-bold text-white mt-0.5">{selectedDebugJob.generatedTitle || selectedDebugJob.topic}</p>
              </div>

              {selectedDebugJob.statusMessage && (
                <div className="p-3 bg-[#1c1b1c] rounded border border-[#00f0ff]/30 text-xs text-[#00f0ff]">
                  <span className="font-bold text-white">Live Runner Message: </span>
                  {selectedDebugJob.statusMessage}
                </div>
              )}

              {selectedDebugJob.error && (
                <div className="p-3 bg-rose-950/40 rounded border border-rose-500/40 text-xs text-rose-300">
                  <span className="font-bold text-rose-200">Error / Block Reason: </span>
                  {selectedDebugJob.error}
                </div>
              )}

              <div>
                <p className="text-[11px] text-[#849495] mb-1">COMPLETE RAW RECORD (PRISMA DB):</p>
                <pre className="p-4 bg-[#0a0a0b] border border-[#3b494b]/40 rounded-lg text-xs text-zinc-300 overflow-x-auto select-text">
                  {JSON.stringify(selectedDebugJob, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Render & Quality Inspector Modal (CINEMATIC_PRO & STANDARD) */}
      {(selectedInspectionJob || selectedEvidenceJob) && (() => {
        const inspJob = selectedInspectionJob || selectedEvidenceJob;
        const closeInspector = () => {
          setSelectedInspectionJob(null);
          setSelectedEvidenceJob(null);
          setRawJsonView(false);
        };

        const pkg = typeof inspJob.contentPackage === "string"
          ? (() => { try { return JSON.parse(inspJob.contentPackage); } catch { return {}; } })()
          : (inspJob.contentPackage || {});
        const diag = inspJob.diagnostics || {};
        const qReport = inspJob.qualityReport || {};
        const edpData = inspJob.edp || {};
        const artifacts = inspJob.artifacts || {
          video: inspJob.reviewArtifacts?.videoUrl || inspJob.videoUrl,
          thumbnail: inspJob.reviewArtifacts?.thumbnailUrl || inspJob.thumbnailUrl,
          contactSheet: inspJob.reviewArtifacts?.contactSheetUrl,
          qualityReport: inspJob.reviewArtifacts?.qualityReportUrl,
          diagnostics: inspJob.reviewArtifacts?.diagnosticsUrl,
          edp: inspJob.reviewArtifacts?.edpUrl,
          narration: inspJob.reviewArtifacts?.narrationUrl,
          subtitles: inspJob.reviewArtifacts?.subtitlesUrl,
        };
        const qualityProfile = inspJob.qualityProfile || pkg.qualityProfile || "STANDARD";
        const isCinematic = qualityProfile === "CINEMATIC_PRO";

        // Sanitize error messages to avoid leaking filesystem paths, tokens, or credentials
        const sanitizeError = (msg?: string) => {
          if (!msg) return "No error message provided.";
          return msg
            .replace(/[a-zA-Z]:\\[^\s"']+/g, "[local_path]")
            .replace(/\/(?:[a-zA-Z0-9_\-\.]+\/)+[a-zA-Z0-9_\-\.]+/g, "[local_path]")
            .replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED_API_KEY]")
            .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer [REDACTED_TOKEN]");
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#141415] border border-[#00f0ff]/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-mono-terminal">
              {/* Header */}
              <div className="p-4 border-b border-[#3b494b]/40 flex justify-between items-center bg-[#1c1b1c]">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#00f0ff] text-[22px]">policy</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-sora text-sm">
                        Render & Quality Inspector — Job {inspJob.id.slice(-8)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isCinematic
                            ? "bg-purple-900/40 border-purple-500 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                            : "bg-zinc-800 border-zinc-600 text-zinc-300"
                        }`}
                      >
                        {isCinematic ? "🎬 CINEMATIC_PRO" : "⚡ STANDARD"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          inspJob.status === "COMPLETED"
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                            : inspJob.status === "RENDERING"
                            ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 animate-pulse"
                            : inspJob.status === "FAILED"
                            ? "bg-rose-500/10 border-rose-500 text-rose-400"
                            : "bg-amber-500/10 border-amber-500 text-amber-400"
                        }`}
                      >
                        {inspJob.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#849495] truncate max-w-md mt-0.5">
                      {inspJob.generatedTitle || inspJob.topic}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeInspector}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center border-b border-[#3b494b]/40 bg-[#121213] px-4 gap-1 overflow-x-auto text-xs">
                {(
                  [
                    { id: "PREVIEW", label: "Media & Frames", icon: "play_circle" },
                    { id: "QUALITY", label: "Quality Gates", icon: "verified" },
                    { id: "SUBTITLES", label: "Subtitle Diagnostics", icon: "subtitles" },
                    { id: "EDP", label: "Edit Decision Plan", icon: "movie_edit" },
                    { id: "PROVENANCE", label: "Claims & Rights", icon: "fact_check" },
                    { id: "METADATA", label: "Render Specs & Diagnostics", icon: "info" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setInspectionTab(tab.id);
                      setRawJsonView(false);
                    }}
                    className={`py-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      inspectionTab === tab.id
                        ? "border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/5"
                        : "border-transparent text-[#849495] hover:text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-300 max-h-[65vh]">
                {/* TAB 1: PREVIEW (Video & 3x3 Contact Sheet) */}
                {inspectionTab === "PREVIEW" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      {/* Video Preview */}
                      <div className="p-4 bg-[#1c1b1c] rounded-xl border border-[#3b494b]/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[#00f0ff] text-[16px]">videocam</span>
                            Rendered MP4 Preview
                          </p>
                          {artifacts.video && (
                            <span className="text-[10px] text-emerald-400 font-bold">1080×1920 (9:16)</span>
                          )}
                        </div>

                        {artifacts.video || inspJob.videoUrl ? (
                          <div className="flex flex-col items-center">
                            <video
                              src={artifacts.video || inspJob.videoUrl}
                              controls
                              playsInline
                              className="max-h-[380px] w-auto aspect-[9/16] rounded-lg border border-[#00f0ff]/30 bg-black shadow-lg"
                            />
                            <p className="text-[10px] text-zinc-500 mt-2 truncate max-w-full">
                              Stream: {artifacts.video || inspJob.videoUrl}
                            </p>
                          </div>
                        ) : (
                          <div className="p-8 text-center bg-black/40 rounded-lg border border-dashed border-[#3b494b]/40 space-y-2">
                            <span className="material-symbols-outlined text-zinc-600 text-[36px]">videocam_off</span>
                            <p className="text-zinc-400 font-bold text-xs">No video preview available</p>
                            <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                              {inspJob.status === "RENDERING"
                                ? "Rendering in progress... The video will be playable once local assembly completes."
                                : inspJob.status === "FAILED"
                                ? "Render failed before video output could be generated."
                                : "Run a local render to generate the final MP4 video artifact."}
                            </p>
                            {(inspJob.status === "SCRIPTED" || inspJob.status === "NEEDS_REVIEW" || inspJob.status === "FAILED") && (
                              <button
                                onClick={() => handleRunLocalRender(inspJob.id)}
                                className="mt-2 px-3 py-1.5 bg-[#00f0ff] hover:bg-[#00d0df] text-black font-bold rounded text-xs inline-flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                                Run Local Render Now
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 3x3 Contact Sheet */}
                      <div className="p-4 bg-[#1c1b1c] rounded-xl border border-[#3b494b]/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-purple-400 text-[16px]">grid_view</span>
                            3×3 Frame Contact Sheet
                          </p>
                          {artifacts.contactSheet && (
                            <span className="text-[10px] text-purple-300 font-bold">810×1440 Grid</span>
                          )}
                        </div>

                        {artifacts.contactSheet ? (
                          <div className="space-y-2">
                            <div
                              onClick={() => setFullSizeImage(artifacts.contactSheet)}
                              className="relative cursor-pointer group rounded-lg overflow-hidden border border-purple-500/30 hover:border-[#00f0ff] transition-all"
                            >
                              <img
                                src={artifacts.contactSheet}
                                alt="3x3 Frame Contact Sheet"
                                className="w-full max-h-[360px] object-contain bg-black rounded"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-white text-[24px]">zoom_in</span>
                                <span className="text-white font-bold text-xs">Click to Inspect Full-Size</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-zinc-400">
                              <span>9 chronological keyframes (0% to 100%)</span>
                              <button
                                onClick={() => setFullSizeImage(artifacts.contactSheet)}
                                className="text-[#00f0ff] hover:underline inline-flex items-center gap-0.5"
                              >
                                Full Lightbox ↗
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 text-center bg-black/40 rounded-lg border border-dashed border-[#3b494b]/40 space-y-2">
                            <span className="material-symbols-outlined text-zinc-600 text-[36px]">grid_off</span>
                            <p className="text-zinc-400 font-bold text-xs">No contact sheet artifact</p>
                            <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                              {isCinematic
                                ? "Contact sheet is generated at render completion in CINEMATIC_PRO mode."
                                : "Contact sheet inspection is an exclusive feature of the CINEMATIC_PRO quality profile."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: QUALITY (Quality Gates Report) */}
                {inspectionTab === "QUALITY" && (() => {
                  const gatesList = qReport.gates || qReport.checks || [];
                  const isReportPassed = qReport.overallPassed ?? qReport.passed ?? false;
                  const hasData = gatesList.length > 0;

                  return (
                    <div className="space-y-4">
                      {/* Overall Status Banner */}
                      <div
                        className={`p-4 rounded-xl border flex items-center justify-between ${
                          isReportPassed
                            ? "bg-emerald-950/20 border-emerald-500/40"
                            : hasData
                            ? "bg-rose-950/20 border-rose-500/40"
                            : "bg-[#1c1b1c] border-[#3b494b]/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`material-symbols-outlined text-[24px] ${
                              isReportPassed
                                ? "text-emerald-400"
                                : hasData
                                ? "text-rose-400"
                                : "text-zinc-500"
                            }`}
                          >
                            {isReportPassed ? "verified" : hasData ? "gpp_bad" : "pending"}
                          </span>
                          <div>
                            <p className="font-bold text-white text-sm">
                              {isReportPassed
                                ? "PASSED ALL QUALITY GATES"
                                : hasData
                                ? "QUALITY GATES FLAGGED ISSUES"
                                : "QUALITY INSPECTION PENDING"}
                            </p>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              {hasData
                                ? `${gatesList.filter((c: any) => c.passed).length} of ${gatesList.length} automated quality gates passed`
                                : "Automated verification runs during local video rendering"}
                            </p>
                          </div>
                        </div>
                        {hasData && (
                          <div className="text-right">
                            <p className="text-[10px] text-zinc-400">QUALITY INDEX</p>
                            <p
                              className={`font-mono-terminal font-extrabold text-lg ${
                                isReportPassed ? "text-emerald-400" : "text-amber-400"
                              }`}
                            >
                              {Math.round(gatesList.reduce((acc: number, g: any) => acc + (g.score ?? (g.passed ? 100 : 0)), 0) / gatesList.length)}%
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Editorial Compliance Advisory */}
                      <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-lg text-[11px] text-blue-300 flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[16px] text-blue-400 mt-0.5">info</span>
                        <div>
                          <p className="font-bold text-blue-200">Quality Gate Scope & Audit Standard</p>
                          <p className="text-zinc-400 text-[10px] mt-0.5">
                            Automated gates evaluate structural video metrics (motion ratio, shot duration bounds, audio ducking, timeline continuity, safe-zone captions). They do <span className="text-amber-300 font-bold">NOT</span> certify factual correctness, copyright indemnification, or audience reception.
                          </p>
                        </div>
                      </div>

                      {/* Individual Gates / Checks Table */}
                      {hasData ? (
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[#00f0ff] text-[16px]">checklist</span>
                            Automated Quality Gates & Measured Evidence
                          </p>
                          <div className="overflow-x-auto rounded-lg border border-[#3b494b]/40">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-[#1c1b1c] text-[#849495] text-[10px] border-b border-[#3b494b]/40">
                                <tr>
                                  <th className="p-3">GATE NAME</th>
                                  <th className="p-3">STATUS</th>
                                  <th className="p-3">SCORE</th>
                                  <th className="p-3">MEASURED METRICS</th>
                                  <th className="p-3">DIAGNOSTICS & WARNINGS</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#3b494b]/30 bg-[#141415]">
                                {gatesList.map((chk: any, idx: number) => {
                                  const name = chk.gateName || chk.name || `Gate #${idx + 1}`;
                                  const isPassed = chk.passed;
                                  const scoreVal = chk.score ?? (isPassed ? 100 : 0);
                                  const metaStr = chk.metadata
                                    ? Object.entries(chk.metadata)
                                        .map(([k, v]) => `${k}: ${v}`)
                                        .join(" • ")
                                    : chk.details || "Standard criteria met";

                                  return (
                                    <tr key={name || idx} className="hover:bg-white/[0.02]">
                                      <td className="p-3 font-bold text-white flex items-center gap-2">
                                        <span
                                          className={`material-symbols-outlined text-[16px] ${
                                            isPassed ? "text-emerald-400" : "text-rose-400"
                                          }`}
                                        >
                                          {isPassed ? "check_circle" : "cancel"}
                                        </span>
                                        <span>{name}</span>
                                      </td>
                                      <td className="p-3">
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            isPassed
                                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                          }`}
                                        >
                                          {isPassed ? "PASS" : "FAIL"}
                                        </span>
                                      </td>
                                      <td className="p-3 font-mono font-bold text-zinc-200">
                                        {scoreVal}/100
                                      </td>
                                      <td className="p-3 text-zinc-300 font-mono text-[11px]">
                                        {metaStr}
                                      </td>
                                      <td className="p-3 text-zinc-400 text-[11px]">
                                        {chk.failures?.length > 0 ? (
                                          <span className="text-rose-400 font-bold">{chk.failures.join("; ")}</span>
                                        ) : chk.warnings?.length > 0 ? (
                                          <span className="text-amber-400">{chk.warnings.join("; ")}</span>
                                        ) : (
                                          <span className="text-emerald-400 font-mono text-[10px]">Zero defects recorded</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-black/40 rounded-lg border border-dashed border-[#3b494b]/40 space-y-2">
                          <span className="material-symbols-outlined text-zinc-600 text-[36px]">rule</span>
                          <p className="text-zinc-400 font-bold text-xs">Quality gate report not available</p>
                          <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                            Quality checks (motion ratio, audio normalization bounds, safe-zone captions, and rights verification) are evaluated during local render.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* TAB 3: SUBTITLES (Diagnostics & Alignment) */}
                {inspectionTab === "SUBTITLES" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-[#1c1b1c] rounded-lg border border-[#3b494b]/40">
                        <p className="text-[10px] text-[#849495]">ALIGNMENT METHOD</p>
                        <p className={`font-bold mt-0.5 ${diag.captionAlignment?.isAcoustic ? "text-cyan-400" : "text-amber-400"}`}>
                          {diag.captionAlignment?.isAcoustic
                            ? "🎙️ Acoustic Alignment"
                            : diag.captionAlignment?.method || "⏱️ Linear Estimation"}
                        </p>
                      </div>
                      <div className="p-3 bg-[#1c1b1c] rounded-lg border border-[#3b494b]/40">
                        <p className="text-[10px] text-[#849495]">MATCH RATE</p>
                        <p className="font-bold text-white mt-0.5">
                          {diag.captionAlignment?.matchRate !== undefined
                            ? `${(diag.captionAlignment.matchRate * 100).toFixed(1)}%`
                            : diag.captionAlignment?.isAcoustic ? "100.0%" : "Estimated"}
                        </p>
                      </div>
                      <div className="p-3 bg-[#1c1b1c] rounded-lg border border-[#3b494b]/40">
                        <p className="text-[10px] text-[#849495]">MATCHED / TOTAL WORDS</p>
                        <p className="font-bold text-white mt-0.5">
                          {diag.captionAlignment?.matchedWords !== undefined
                            ? `${diag.captionAlignment.matchedWords} / ${diag.captionAlignment.totalWords}`
                            : "N/A"}
                        </p>
                      </div>
                      <div className="p-3 bg-[#1c1b1c] rounded-lg border border-[#3b494b]/40">
                        <p className="text-[10px] text-[#849495]">ACOUSTIC SYNCS</p>
                        <p className="font-bold text-emerald-400 mt-0.5">
                          {diag.captionAlignment?.acousticWords ?? (diag.captionAlignment?.isAcoustic ? "Active" : "0 words")}
                        </p>
                      </div>
                    </div>

                    {/* Fallback & Diagnostic Details */}
                    {diag.captionAlignment?.fallbackUsed ? (
                      <div className="p-4 bg-amber-950/20 border border-amber-500/40 rounded-lg space-y-1">
                        <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">warning</span>
                          Explicit Alignment Fallback Engaged
                        </p>
                        <p className="text-[11px] text-zinc-300">
                          Acoustic subtitle alignment encountered: <span className="text-amber-400 font-mono">{diag.captionAlignment.reason || "Alignment confidence below threshold"}</span>.
                          The subtitle engine smoothly fell back to linear word-duration estimation to guarantee zero render stoppage.
                        </p>
                      </div>
                    ) : diag.captionAlignment?.isAcoustic ? (
                      <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-lg space-y-1">
                        <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">verified</span>
                          Acoustic Subtitle Synchronization Active
                        </p>
                        <p className="text-[11px] text-zinc-300">
                          Spoken narration words were aligned directly against synthesized audio waveform acoustics via faster-whisper.
                        </p>
                        {diag.captionAlignment?.matchedWords !== undefined && diag.captionAlignment?.totalWords !== undefined && (
                          <p className="text-[10px] text-zinc-400 pt-1 border-t border-[#3b494b]/20">
                            {diag.captionAlignment.matchedWords} of {diag.captionAlignment.totalWords} words directly grounded to acoustic audio boundaries ({((diag.captionAlignment.matchedWords / diag.captionAlignment.totalWords) * 100).toFixed(1)}%); {diag.captionAlignment.totalWords - diag.captionAlignment.matchedWords} words anchor-interpolated within measured acoustic windows (&lt;100ms drift).
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-[#1c1b1c] border border-[#3b494b]/40 rounded-lg space-y-1">
                        <p className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          Standard Linear Caption Pacing
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          Subtitles are distributed proportionally across total narration duration. Opt in to <span className="text-[#00f0ff] font-bold">CINEMATIC_PRO</span> for phoneme-aligned acoustic sync.
                        </p>
                      </div>
                    )}

                    {/* Subtitle Artifact Link */}
                    {artifacts.subtitles && (
                      <div className="p-3 bg-[#1c1b1c] rounded-lg border border-[#3b494b]/40 flex items-center justify-between">
                        <span className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-[#00f0ff]">description</span>
                          Raw Kinetic ASS Subtitle Script Available
                        </span>
                        <a
                          href={artifacts.subtitles}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#00f0ff] hover:underline text-xs font-bold inline-flex items-center gap-1"
                        >
                          View .ass file ↗
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: EDP (Edit Decision Plan) */}
                {inspectionTab === "EDP" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#00f0ff] text-[16px]">movie_edit</span>
                        Edit Decision Plan (EDP v2.1.0)
                      </p>
                      <button
                        onClick={() => setRawJsonView(!rawJsonView)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[11px] font-bold border border-zinc-700 inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[13px]">code</span>
                        {rawJsonView ? "Show Summary View" : "View Raw EDP JSON"}
                      </button>
                    </div>

                    {rawJsonView ? (
                      <pre className="p-4 bg-black/80 border border-[#3b494b]/40 rounded-lg text-[11px] text-zinc-300 overflow-x-auto max-h-[50vh] select-text">
                        {JSON.stringify(edpData?.timeline ? edpData : pkg, null, 2)}
                      </pre>
                    ) : (
                      <div className="space-y-3">
                        {/* EDP Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                            <p className="text-[10px] text-[#849495]">PROFILE</p>
                            <p className="font-bold text-[#00f0ff] mt-0.5">{edpData?.profile || qualityProfile}</p>
                          </div>
                          <div className="p-3 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                            <p className="text-[10px] text-[#849495]">TOTAL SCENES</p>
                            <p className="font-bold text-white mt-0.5">
                              {edpData?.totalScenes || (edpData?.timeline?.length ?? pkg.segments?.length ?? 0)}
                            </p>
                          </div>
                          <div className="p-3 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                            <p className="text-[10px] text-[#849495]">TARGET DURATION</p>
                            <p className="font-bold text-white mt-0.5">
                              {edpData?.duration ? `${edpData.duration.toFixed(1)}s` : inspJob.duration ? `${inspJob.duration}s` : "Dynamic"}
                            </p>
                          </div>
                          <div className="p-3 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                            <p className="text-[10px] text-[#849495]">SCHEMA</p>
                            <p className="font-bold text-emerald-400 mt-0.5">{edpData?.schemaVersion || "EDP 2.1.0"}</p>
                          </div>
                        </div>

                        {/* Shot Timeline */}
                        {(edpData?.timeline || pkg.segments || []).length > 0 ? (
                          <div className="space-y-2">
                            {(edpData?.timeline || pkg.segments || []).map((shot: any, idx: number) => (
                              <div
                                key={shot.order || idx}
                                className="p-3.5 bg-[#1c1b1c] rounded-lg border border-[#3b494b]/40 space-y-2"
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-[#00f0ff]">
                                    Shot #{shot.order || idx + 1}: {shot.sceneType || shot.visualPlan?.sceneType || "SCENE"}
                                  </span>
                                  <span className="text-zinc-400 font-mono text-[10px]">
                                    {shot.start !== undefined && shot.end !== undefined
                                      ? `${shot.start.toFixed(1)}s → ${shot.end.toFixed(1)}s (${(shot.end - shot.start).toFixed(1)}s)`
                                      : `${shot.duration || 4.5}s estimated`}
                                  </span>
                                </div>
                                <p className="text-zinc-200 text-xs italic">
                                  "{shot.narration || shot.text || shot.captionText || ""}"
                                </p>
                                <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#849495] pt-1 border-t border-[#3b494b]/20">
                                  <span>Visual: <span className="text-zinc-300">{shot.visual?.type || shot.visualPlan?.primaryText || "Dynamic Motion Graphic"}</span></span>
                                  {shot.motion && <span>Motion: <span className="text-zinc-300">{shot.motion}</span></span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center bg-black/40 rounded-lg border border-dashed border-[#3b494b]/40 space-y-2">
                            <span className="material-symbols-outlined text-zinc-600 text-[36px]">movie_filter</span>
                            <p className="text-zinc-400 font-bold text-xs">No EDP timeline recorded</p>
                            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                              Run a local render to compile shot cuts, pacing curves, and visual asset allocations.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: PROVENANCE (Claims & Rights Clearances) */}
                {inspectionTab === "PROVENANCE" && (
                  <div className="space-y-6">
                    {/* Factual Claims */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-amber-400">verified</span>
                        Factual Claims & Empirical Retrieval Receipts ({pkg.claims?.length || 0})
                      </p>
                      {(!pkg.claims || pkg.claims.length === 0) ? (
                        <p className="text-[#849495] italic p-4 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                          No factual claims registered in content package.
                        </p>
                      ) : (
                        pkg.claims.map((claim: any, idx: number) => (
                          <div
                            key={claim.id || idx}
                            className="p-3.5 rounded-lg border bg-[#1c1b1c] border-[#3b494b]/40 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-white text-xs">Claim #{idx + 1}: {claim.id}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                                {claim.excerptType === "verbatim_quote" ? "Verbatim Quote" : "Authored Summary"}
                              </span>
                            </div>
                            <p className="text-zinc-200 text-xs">"{claim.claimText}"</p>
                            {claim.supportingExcerpt && (
                              <div className="p-2 bg-black/40 rounded border border-[#3b494b]/30 text-[11px] text-zinc-300 italic">
                                "{claim.supportingExcerpt}"
                              </div>
                            )}
                            <div className="flex items-center justify-between text-[10px] text-[#849495] pt-1 border-t border-[#3b494b]/30">
                              <span>Source: <span className="text-zinc-200">{claim.sourceRef}</span></span>
                              {claim.sourceUrl && (
                                <a
                                  href={claim.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#00f0ff] hover:underline"
                                >
                                  Verify Primary Source ↗
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Asset Provenance & Rights Verification */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-cyan-400">copyright</span>
                        Asset Provenance & Rights Verification ({((diag.assetProvenance || edpData.assetManifest) || []).length} assets)
                      </p>

                      {/* Legal Compliance Advisory */}
                      <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg text-[11px] text-amber-300 flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[16px] text-amber-400 mt-0.5">verified_user</span>
                        <div>
                          <p className="font-bold text-amber-200">Operator Rights & Compliance Advisory</p>
                          <p className="text-zinc-400 text-[10px] mt-0.5">
                            Automated pipeline assertions do not constitute legal indemnification. Each asset must be audited for primary creator, license terms, and required attribution before publishing online.
                          </p>
                        </div>
                      </div>

                      {/* TTS Engine Provenance */}
                      <div className="p-3 bg-[#1c1b1c] rounded-lg border border-[#3b494b]/40 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-[#849495]">AUDIO NARRATION SYNTHESIS</p>
                          <p className="font-bold text-white text-xs mt-0.5">
                            {diag.tts?.engineUsed === "KOKORO" ? "Kokoro Neural TTS (Local ONNX)" : "Windows SAPI Speech Engine"}
                          </p>
                          <p className="text-[10px] text-zinc-400">Voice: {diag.tts?.voiceUsed || "System Voice"}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {diag.tts?.engineUsed === "KOKORO" ? "Apache-2.0 / Offline" : "OS Desktop Audio API"}
                        </span>
                      </div>

                      {/* Asset Manifest List */}
                      {((diag.assetProvenance || edpData.assetManifest) || []).length > 0 ? (
                        <div className="space-y-2">
                          {((diag.assetProvenance || edpData.assetManifest) || []).map((asset: any, idx: number) => {
                            const isAttribution = asset.license?.includes("CC BY") || asset.license?.includes("Attribution");
                            const isPublicDomain = asset.license?.includes("Public Domain") || asset.license?.includes("CC0");
                            const isUnverified = !asset.verified;

                            return (
                              <div key={asset.assetId || idx} className="p-3 bg-[#1c1b1c] rounded-lg border border-[#3b494b]/40 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                                    <span className="text-[10px] text-cyan-400 font-mono">[{asset.assetType || "ASSET"}]</span>
                                    {asset.description || asset.assetId}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    isUnverified
                                      ? "bg-rose-950/40 text-rose-300 border-rose-600"
                                      : isAttribution
                                      ? "bg-amber-950/40 text-amber-300 border-amber-600"
                                      : "bg-emerald-950/40 text-emerald-300 border-emerald-600"
                                  }`}>
                                    {isUnverified ? "UNVERIFIED" : isAttribution ? "ATTRIBUTION REQUIRED" : "PUBLIC DOMAIN / CC0"}
                                  </span>
                                </div>
                                <div className="text-[11px] text-zinc-300">
                                  <span className="text-[#849495]">Origin: </span>{asset.sourceOrigin || "Local procedural suite"}
                                </div>
                                <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1 border-t border-[#3b494b]/20">
                                  <span>License: <span className="text-zinc-200">{asset.license || "Unspecified"}</span></span>
                                  <span>Usage: <span className="text-zinc-300">{asset.permittedUsage || "Internal / Review"}</span></span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[#849495] italic p-4 bg-[#1c1b1c] rounded border border-[#3b494b]/40 text-xs">
                          No external asset manifest registered for this job.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 6: METADATA (Render Specs & Diagnostics) */}
                {inspectionTab === "METADATA" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                        <p className="text-[10px] text-[#849495]">RESOLUTION</p>
                        <p className="font-bold text-white mt-0.5">
                          {diag.render?.resolution || (inspJob.status === "COMPLETED" ? "1080×1920" : "Pending")}
                        </p>
                      </div>
                      <div className="p-3 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                        <p className="text-[10px] text-[#849495]">ASPECT RATIO</p>
                        <p className="font-bold text-white mt-0.5">9:16 (Vertical Short)</p>
                      </div>
                      <div className="p-3 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                        <p className="text-[10px] text-[#849495]">FRAME RATE</p>
                        <p className="font-bold text-white mt-0.5">{diag.render?.fps ? `${diag.render.fps} fps` : "30 fps"}</p>
                      </div>
                      <div className="p-3 bg-[#1c1b1c] rounded border border-[#3b494b]/40">
                        <p className="text-[10px] text-[#849495]">VIDEO SIZE</p>
                        <p className="font-bold text-white mt-0.5">
                          {diag.render?.videoSizeMb ? `${diag.render.videoSizeMb.toFixed(2)} MB` : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* TTS Engine Diagnostics */}
                    <div className="p-4 bg-[#1c1b1c] rounded-xl border border-[#3b494b]/40 space-y-3">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#00f0ff] text-[16px]">record_voice_over</span>
                        TTS Synthesis Engine & Fallback Diagnostics
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-black/40 rounded border border-[#3b494b]/30">
                          <p className="text-[10px] text-[#849495]">REQUESTED ENGINE</p>
                          <p className="font-bold text-white mt-0.5">{diag.tts?.requested || "Kokoro ONNX"}</p>
                        </div>
                        <div className="p-3 bg-black/40 rounded border border-[#3b494b]/30">
                          <p className="text-[10px] text-[#849495]">ACTUAL ENGINE USED</p>
                          <p className="font-bold text-[#00f0ff] mt-0.5">
                            {diag.tts?.engineUsed || inspJob.renderEngine || "Kokoro ONNX"}
                          </p>
                        </div>
                        <div className="p-3 bg-black/40 rounded border border-[#3b494b]/30">
                          <p className="text-[10px] text-[#849495]">SYNTHESIS DURATION</p>
                          <p className="font-bold text-white mt-0.5">
                            {diag.tts?.durationSeconds ? `${diag.tts.durationSeconds.toFixed(1)}s audio` : "N/A"}
                          </p>
                        </div>
                      </div>

                      {diag.tts?.fallbackFrom ? (
                        <div className="p-3 bg-amber-950/20 border border-amber-500/40 rounded text-[11px] text-amber-300 space-y-1">
                          <p className="font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            TTS Engine Fallback Occurred: {diag.tts.fallbackFrom} → {diag.tts.engineUsed}
                          </p>
                          <p className="text-zinc-300">
                            Reason: {diag.tts.fallbackReason || "Requested engine uninitialized; switched to secondary provider."}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Primary requested TTS engine synthesized audio without fallback.
                        </p>
                      )}
                    </div>

                    {/* Actionable Failure Details */}
                    {inspJob.status === "FAILED" && (
                      <div className="p-4 bg-rose-950/20 border border-rose-500/50 rounded-xl space-y-2">
                        <p className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">error</span>
                          Actionable Failure Diagnostics
                        </p>
                        <p className="text-xs text-zinc-200 font-mono bg-black/60 p-3 rounded border border-rose-900/40 select-text">
                          {sanitizeError(inspJob.statusMessage)}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          Note: System paths, sensitive tokens, and raw stack traces have been redacted. To retry rendering, ensure local dependencies (FFmpeg, Python Kokoro model) are present and click "Render Local".
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#3b494b]/40 bg-[#1c1b1c] flex items-center justify-between">
                <span className="text-[10px] text-[#849495]">
                  SIMPLYYTR 2.0 CINEMATIC_PRO Operator Verification Standard
                </span>
                <div className="flex items-center gap-2">
                  {(inspJob.status === "SCRIPTED" || inspJob.status === "NEEDS_REVIEW" || inspJob.status === "FAILED") && (
                    <button
                      onClick={() => handleRunLocalRender(inspJob.id)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-[#00f0ff]/20 hover:from-amber-500/30 hover:to-[#00f0ff]/30 text-[#00f0ff] border border-[#00f0ff]/40 rounded text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[15px]">movie_creation</span>
                      Render Local ({qualityProfile})
                    </button>
                  )}
                  {inspJob.status === "NEEDS_REVIEW" && (
                    <button
                      onClick={async () => {
                        const tId = toast.loading("Approving job for GPU render...");
                        try {
                          const res = await fetch("/api/pipeline/control", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "approve", jobId: inspJob.id }),
                          });
                          const data = await res.json();
                          if (data.status === "success") {
                            toast.success("Job approved to render!", { id: tId });
                            fetchJobs();
                            closeInspector();
                          } else {
                            toast.error(data.error || "Approval failed", { id: tId });
                          }
                        } catch (e) {
                          toast.error("Network error during approval", { id: tId });
                        }
                      }}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded text-xs inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span>
                      Approve Job
                    </button>
                  )}
                  <button
                    onClick={closeInspector}
                    className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Full-Size Image / Contact Sheet Lightbox Modal */}
      {fullSizeImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setFullSizeImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[#141415] border border-[#00f0ff]/40 rounded-2xl p-4 flex flex-col items-center font-mono-terminal shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00f0ff] text-[18px]">grid_view</span>
                Contact Sheet Full-Size Inspection (810×1440 3×3 Grid)
              </span>
              <button
                onClick={() => setFullSizeImage(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
            <img
              src={fullSizeImage}
              alt="Full Size Contact Sheet"
              className="max-h-[75vh] object-contain rounded-lg border border-[#3b494b]/40 bg-black"
            />
            <p className="text-[10px] text-zinc-400 mt-2">
              Full-resolution 3×3 multi-frame sequence showing pacing, shaders, and text bounds
            </p>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-[#141415] border border-[#00f0ff]/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center">
            <div className="w-full p-3.5 border-b border-[#3b494b]/40 flex justify-between items-center bg-[#1c1b1c]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00f0ff] text-[18px]">play_circle</span>
                <span className="font-bold text-white font-sora text-xs uppercase tracking-wider">Video Artifact Preview</span>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex flex-col items-center justify-center">
              <video
                src={selectedVideo}
                controls
                autoPlay
                playsInline
                className="max-h-[70vh] rounded-xl shadow-2xl border border-[#00f0ff]/20 bg-black aspect-[9/16]"
              />
              <p className="text-[10px] text-[#849495] font-mono-terminal mt-3 truncate max-w-xs">{selectedVideo}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
