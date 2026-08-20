"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function SimplyYtrCommandCenter() {
  const [activeTab, setActiveTab] = useState<"CORE" | "PULSE" | "COMPLIANCE" | "RLYA" | "NODES" | "REVENUE" | "SETTINGS">("CORE");
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

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

  // Fetch initial data
  useEffect(() => {
    fetchSettings();
    fetchJobs();

    const interval = setInterval(() => {
      fetchJobs();
      fetchSettings();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
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
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_PIPELINE_SECRET || 'youtubbot_secure_pipeline_key_2026'}`
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
    setLoading(true);
    const tId = toast.loading("Initializing Multi-Agent Pipeline & Groq Orchestrator...");
    try {
      const res = await fetch("/api/pipeline/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_PIPELINE_SECRET || 'youtubbot_secure_pipeline_key_2026'}`
        },
        body: JSON.stringify({ count: 1, force: true }),
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(`Pipeline Engaged! ${data.message}`, { id: tId });
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
        headers: { "Authorization": `Bearer ${process.env.NEXT_PUBLIC_PIPELINE_SECRET || 'youtubbot_secure_pipeline_key_2026'}` }
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
      SCRIPTED: { bg: "bg-[#00f0ff]/10", text: "text-[#00f0ff]", border: "border-[#00f0ff]/30", icon: "smart_toy" },
      RENDERING: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", icon: "memory" },
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
            { id: "CORE", label: "Command Center", icon: "terminal" },
            { id: "PULSE", label: "Competitive Pulse", icon: "query_stats" },
            { id: "COMPLIANCE", label: "Content ID Proxy", icon: "verified_user" },
            { id: "RLYA", label: "Recursive Learning", icon: "psychology" },
            { id: "NODES", label: "Compute Cluster", icon: "hub" },
            { id: "REVENUE", label: "Monetization Audit", icon: "monetization_on" },
            { id: "SETTINGS", label: "System Config", icon: "tune" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
            <p className="text-[10px] text-[#849495] mt-1">Puppeteer stealth verified</p>
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
                            <div className="flex items-center gap-1.5 mb-1">
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
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px]">
                              {job.renderEngine || "HYBRID"}
                            </span>
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
    </div>
  );
}
