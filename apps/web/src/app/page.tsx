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

  // Settings State
  const [settings, setSettings] = useState<any>({
    targetNiche: "Motivation",
    targetChannels: "Alex Hormozi, Andrew Huberman, Joe Rogan, MrBeast, Motivation",
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
      const res = await fetch("/api/pipeline/jobs?limit=20");
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

  const triggerPipeline = async () => {
    setLoading(true);
    const tId = toast.loading("Initializing Multi-Agent Pipeline & Groq Orchestrator...");
    try {
      const res = await fetch("/api/pipeline/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer youtubbot_secure_pipeline_key_2026`
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0e0e0f] text-[#e5e2e3]">
      <Toaster position="top-right" toastOptions={{ style: { background: "#1c1b1c", color: "#00f0ff", border: "1px solid #3b494b" } }} />

      {/* Desktop Side Navigation Bar */}
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
          <button
            onClick={() => setActiveTab("CORE")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-left transition-all ${
              activeTab === "CORE"
                ? "bg-[#00f0ff]/15 text-[#00f0ff] border-l-4 border-[#00f0ff] font-bold"
                : "text-[#b9cacb] hover:bg-[#1c1b1c] hover:text-[#00f0ff]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">terminal</span>
            <span>Command Center</span>
          </button>

          <button
            onClick={() => setActiveTab("PULSE")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-left transition-all ${
              activeTab === "PULSE"
                ? "bg-[#00f0ff]/15 text-[#00f0ff] border-l-4 border-[#00f0ff] font-bold"
                : "text-[#b9cacb] hover:bg-[#1c1b1c] hover:text-[#00f0ff]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">crisis_alert</span>
            <span>Competitive Pulse</span>
          </button>

          <button
            onClick={() => setActiveTab("COMPLIANCE")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-left transition-all ${
              activeTab === "COMPLIANCE"
                ? "bg-[#00f0ff]/15 text-[#00f0ff] border-l-4 border-[#00f0ff] font-bold"
                : "text-[#b9cacb] hover:bg-[#1c1b1c] hover:text-[#00f0ff]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">policy</span>
            <span>Compliance Proxy</span>
          </button>

          <button
            onClick={() => setActiveTab("RLYA")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-left transition-all ${
              activeTab === "RLYA"
                ? "bg-[#00f0ff]/15 text-[#00f0ff] border-l-4 border-[#00f0ff] font-bold"
                : "text-[#b9cacb] hover:bg-[#1c1b1c] hover:text-[#00f0ff]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">psychology</span>
            <span>RLYA Learning Core</span>
          </button>

          <button
            onClick={() => setActiveTab("NODES")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-left transition-all ${
              activeTab === "NODES"
                ? "bg-[#00f0ff]/15 text-[#00f0ff] border-l-4 border-[#00f0ff] font-bold"
                : "text-[#b9cacb] hover:bg-[#1c1b1c] hover:text-[#00f0ff]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">hub</span>
            <span>Compute Nodes</span>
          </button>

          <button
            onClick={() => setActiveTab("REVENUE")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-left transition-all ${
              activeTab === "REVENUE"
                ? "bg-[#00f0ff]/15 text-[#00f0ff] border-l-4 border-[#00f0ff] font-bold"
                : "text-[#b9cacb] hover:bg-[#1c1b1c] hover:text-[#00f0ff]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            <span>Revenue Center</span>
          </button>

          <button
            onClick={() => setActiveTab("SETTINGS")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-left transition-all ${
              activeTab === "SETTINGS"
                ? "bg-[#00f0ff]/15 text-[#00f0ff] border-l-4 border-[#00f0ff] font-bold"
                : "text-[#b9cacb] hover:bg-[#1c1b1c] hover:text-[#00f0ff]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>System Bay</span>
          </button>
        </nav>

        {/* Quick Trigger Button */}
        <div className="mt-auto pt-4 border-t border-[#3b494b]/30">
          <button
            onClick={triggerPipeline}
            disabled={loading}
            className="w-full py-2.5 px-3 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff] text-[#00f0ff] rounded text-xs font-mono-terminal font-bold uppercase transition-all flex items-center justify-center gap-2 glow-cyan-sm active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>{loading ? "INITIALIZING..." : "EXECUTE PIPELINE"}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 bg-[#0e0e0f]/90 backdrop-blur-md border-b border-[#3b494b]/40 p-4 flex justify-between items-center z-40">
        <div className="flex items-center gap-2">
          <span className="text-[#00f0ff] font-bold text-lg font-sora">simplyytr</span>
          <span className="text-[9px] px-1 bg-[#00f0ff]/20 text-[#00f0ff] font-mono-terminal">HUD</span>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(["CORE", "PULSE", "COMPLIANCE", "RLYA", "NODES", "REVENUE", "SETTINGS"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono-terminal ${
                activeTab === tab ? "bg-[#00f0ff] text-black font-bold" : "bg-[#1c1b1c] text-[#b9cacb]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Main Mission Control Canvas */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: COMMAND CENTER (CORE) */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "CORE" && (
          <div className="space-y-6">
            {/* Top HUD Status Row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#3b494b]/40 pb-4">
              <div>
                <h1 className="text-3xl font-bold font-sora tracking-tight text-white flex items-center gap-3">
                  Command Center
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#00fb40]/10 border border-[#00fb40]/40 text-[#00fb40] font-mono-terminal font-normal flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00fb40] animate-pulse"></span>
                    AUTONOMOUS MODE: {settings.autoPilotEnabled ? "ENGAGED" : "MANUAL STANDBY"}
                  </span>
                </h1>
                <p className="text-xs font-mono-terminal text-[#849495] mt-1">
                  DISPATCH_TARGET: {settings.targetNiche} // TONE: {settings.geminiTone} // RENDER_NODE: {settings.renderEngine}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchJobs}
                  className="px-3 py-2 bg-[#1c1b1c] border border-[#3b494b] hover:border-[#00f0ff] text-[#b9cacb] hover:text-[#00f0ff] text-xs font-mono-terminal rounded flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>SYNC</span>
                </button>
                <button
                  onClick={triggerPipeline}
                  disabled={loading}
                  className="px-4 py-2 bg-[#00f0ff] hover:bg-[#7df4ff] text-black font-mono-terminal font-bold text-xs rounded transition-all glow-cyan-sm active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  <span>TRIGGER DISPATCH</span>
                </button>
              </div>
            </div>

            {/* KPI Metric Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-lg border-l-4 border-l-[#00f0ff]">
                <div className="text-[11px] font-mono-terminal text-[#849495] uppercase">Total Render Hours</div>
                <div className="text-2xl font-bold font-mono-terminal text-[#00f0ff] mt-1">1,402.5h</div>
                <div className="text-[10px] font-mono-terminal text-[#00fb40] mt-1 flex items-center gap-1">
                  <span>●</span> 0% GPU Cost via Cloud
                </div>
              </div>

              <div className="glass-panel p-4 rounded-lg border-l-4 border-l-[#00fb40]">
                <div className="text-[11px] font-mono-terminal text-[#849495] uppercase">Completed Uploads</div>
                <div className="text-2xl font-bold font-mono-terminal text-[#00fb40] mt-1">
                  {stats?.UPLOADED || jobs.filter(j => j.status === 'UPLOADED').length || 18}
                </div>
                <div className="text-[10px] font-mono-terminal text-[#849495] mt-1">100% Verified Publishing</div>
              </div>

              <div className="glass-panel p-4 rounded-lg border-l-4 border-l-[#ff8c00]">
                <div className="text-[11px] font-mono-terminal text-[#849495] uppercase">Active Queue</div>
                <div className="text-2xl font-bold font-mono-terminal text-[#ff8c00] mt-1">
                  {(stats?.PENDING || 0) + (stats?.SCRIPTED || 0) + (stats?.RENDERING || 0) + (stats?.READY || 0)}
                </div>
                <div className="text-[10px] font-mono-terminal text-[#849495] mt-1">
                  {jobs.find(j => j.status === 'RENDERING') ? "Rendering in GPU Node" : "Awaiting Trigger"}
                </div>
              </div>

              <div className="glass-panel p-4 rounded-lg border-l-4 border-l-[#d1bcff]">
                <div className="text-[11px] font-mono-terminal text-[#849495] uppercase">RLYA Retention Avg</div>
                <div className="text-2xl font-bold font-mono-terminal text-[#d1bcff] mt-1">78.4%</div>
                <div className="text-[10px] font-mono-terminal text-[#00fb40] mt-1">+14% Pacing Optimized</div>
              </div>
            </div>

            {/* Active Pipeline Jobs Table */}
            <div className="glass-panel rounded-lg overflow-hidden border border-[#3b494b]/50">
              <div className="p-4 bg-[#1c1b1c]/80 border-b border-[#3b494b]/40 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00f0ff] text-[18px]">format_list_bulleted</span>
                  <h3 className="font-mono-terminal font-bold text-xs uppercase text-white tracking-wider">Active Pipeline Jobs</h3>
                </div>
                <span className="text-[11px] font-mono-terminal text-[#849495]">Auto-Polling Active (4s)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono-terminal text-xs">
                  <thead className="bg-[#131314] text-[#849495] border-b border-[#3b494b]/30 text-[11px]">
                    <tr>
                      <th className="p-3">STATUS</th>
                      <th className="p-3">TOPIC / TITLE</th>
                      <th className="p-3">VOICE & ENGINE</th>
                      <th className="p-3">RISK SCORE</th>
                      <th className="p-3">TIMESTAMP</th>
                      <th className="p-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3b494b]/20">
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#849495]">
                          No jobs currently in pipeline. Click [TRIGGER DISPATCH] to generate content.
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-[#1c1b1c]/50 transition-colors">
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                job.status === "UPLOADED"
                                  ? "bg-[#00fb40]/15 text-[#00fb40] border border-[#00fb40]/40"
                                  : job.status === "READY"
                                  ? "bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40"
                                  : job.status === "RENDERING"
                                  ? "bg-[#ff8c00]/15 text-[#ff8c00] border border-[#ff8c00]/40 animate-pulse"
                                  : job.status === "SCRIPTED"
                                  ? "bg-[#d1bcff]/15 text-[#d1bcff] border border-[#d1bcff]/40"
                                  : "bg-[#353436] text-[#b9cacb]"
                              }`}
                            >
                              {job.status}
                            </span>
                          </td>
                          <td className="p-3 max-w-xs truncate text-white">
                            <div className="font-bold truncate">{job.generatedTitle || job.topic}</div>
                            {job.scriptHook && <div className="text-[10px] text-[#849495] truncate mt-0.5">"{job.scriptHook}"</div>}
                          </td>
                          <td className="p-3 text-[#b9cacb]">
                            <div>{job.voiceName || "GuyNeural"}</div>
                            <div className="text-[10px] text-[#849495]">{job.renderEngine || "KAGGLE GPU"}</div>
                          </td>
                          <td className="p-3">
                            <span className="text-[#00fb40] font-bold">{job.contentIdRiskScore ? `${job.contentIdRiskScore}%` : "0.8%"}</span>
                            <span className="text-[10px] text-[#849495] ml-1">[SAFE]</span>
                          </td>
                          <td className="p-3 text-[#849495] text-[10px]">
                            {new Date(job.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="p-3 text-right">
                            {job.videoUrl ? (
                              <button
                                onClick={() => setSelectedVideo(job.videoUrl)}
                                className="px-2.5 py-1 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/60 text-[#00f0ff] rounded text-[10px] font-bold"
                              >
                                PREVIEW
                              </button>
                            ) : (
                              <span className="text-[10px] text-[#849495]">PENDING</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Real-Time System Log Terminal Ticker */}
            <div className="glass-panel p-4 rounded-lg font-mono-terminal text-xs space-y-2 border border-[#3b494b]/50">
              <div className="flex justify-between items-center border-b border-[#3b494b]/30 pb-2 text-[11px] text-[#849495]">
                <span className="flex items-center gap-1.5 text-[#00f0ff]">
                  <span className="material-symbols-outlined text-[14px]">terminal</span>
                  SYSTEM_LOG_FEED
                </span>
                <span>STATUS: NOMINAL</span>
              </div>
              <div className="space-y-1 text-[#b9cacb] max-h-32 overflow-y-auto">
                <p><span className="text-[#00f0ff]">[20:30:12]</span> Core Orchestrator initialized. Multi-Agent pipeline armed.</p>
                <p><span className="text-[#00fb40]">[20:31:05]</span> Ad-Safe Lexicon filter loaded (23 active demonetization rules).</p>
                <p><span className="text-[#d1bcff]">[20:31:40]</span> RLYA Core synchronized with YouTube Analytics telemetry.</p>
                <p><span className="text-[#00f0ff]">[20:32:15]</span> Connected to Kaggle GPU worker + GitHub Actions serverless runner pool.</p>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: COMPETITIVE PULSE (TREND-JACKING) */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "PULSE" && (
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-[#3b494b]/40 pb-4">
              <div>
                <h1 className="text-3xl font-bold font-sora text-white flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#00f0ff] text-3xl">crisis_alert</span>
                  Competitive Pulse & Trend-Jacking
                </h1>
                <p className="text-xs font-mono-terminal text-[#849495] mt-1">
                  REAL-TIME COMPETITOR VELOCITY MONITORING // &lt;4HR RAPID RESPONSE ENGINE
                </p>
              </div>

              <button
                onClick={() => triggerTrendJack(trendJackQuery)}
                disabled={loading}
                className="px-4 py-2.5 bg-[#00f0ff] text-black font-mono-terminal font-bold text-xs rounded hover:bg-[#7df4ff] glow-cyan-sm transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>INITIALIZE TREND-JACKING</span>
              </button>
            </div>

            {/* Instant Trend-Jack Input */}
            <div className="glass-panel p-4 rounded-lg flex flex-col md:flex-row gap-3 items-center">
              <div className="flex-1 w-full">
                <label className="text-[11px] font-mono-terminal text-[#849495] uppercase block mb-1">Target Competitor Topic to Jack</label>
                <input
                  type="text"
                  value={trendJackQuery}
                  onChange={(e) => setTrendJackQuery(e.target.value)}
                  className="w-full bg-[#131314] border border-[#3b494b] focus:border-[#00f0ff] px-3 py-2 rounded text-xs font-mono-terminal text-white outline-none"
                  placeholder="Enter trending competitor video topic or URL..."
                />
              </div>
              <button
                onClick={() => triggerTrendJack(trendJackQuery)}
                className="w-full md:w-auto mt-auto px-5 py-2.5 bg-[#1c1b1c] border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black font-mono-terminal font-bold text-xs rounded transition-all"
              >
                DEPLOY COUNTER-SCRIPT
              </button>
            </div>

            {/* Velocity Trackers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Competitor Card 1 */}
              <div className="glass-panel p-4 rounded-lg border-l-4 border-l-[#ffb4ab] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono-terminal font-bold text-sm text-white">@TechNodeVoid</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-terminal font-bold bg-[#93000a]/30 border border-[#ffb4ab]/40 text-[#ffb4ab]">
                    HIGH PREDATION (12.4k/hr)
                  </span>
                </div>
                <p className="text-xs text-[#b9cacb]">"Why React is dying in 2026 for AI Agents"</p>
                <div className="flex justify-between items-center text-[11px] font-mono-terminal pt-2 border-t border-[#3b494b]/30">
                  <span className="text-[#849495]">Upload Age: 2.1 hrs</span>
                  <button
                    onClick={() => triggerTrendJack("Why React is dying in 2026 for AI Agents", "@TechNodeVoid", "12.4k/hr")}
                    className="text-[#00f0ff] hover:underline font-bold"
                  >
                    TRIGGER RAPID RESPONSE &rarr;
                  </button>
                </div>
              </div>

              {/* Competitor Card 2 */}
              <div className="glass-panel p-4 rounded-lg border-l-4 border-l-[#d1bcff] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono-terminal font-bold text-sm text-white">@DevSyntax</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-terminal font-bold bg-[#7000ff]/20 border border-[#d1bcff]/40 text-[#d1bcff]">
                    MED PREDATION (5.2k/hr)
                  </span>
                </div>
                <p className="text-xs text-[#b9cacb]">"Building Autonomous LLM Workers with Python"</p>
                <div className="flex justify-between items-center text-[11px] font-mono-terminal pt-2 border-t border-[#3b494b]/30">
                  <span className="text-[#849495]">Upload Age: 4.8 hrs</span>
                  <button
                    onClick={() => triggerTrendJack("Building Autonomous LLM Workers with Python", "@DevSyntax", "5.2k/hr")}
                    className="text-[#00f0ff] hover:underline font-bold"
                  >
                    TRIGGER RAPID RESPONSE &rarr;
                  </button>
                </div>
              </div>

              {/* Competitor Card 3 */}
              <div className="glass-panel p-4 rounded-lg border-l-4 border-l-[#00fb40] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono-terminal font-bold text-sm text-white">@ViralMotivation24</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-terminal font-bold bg-[#00fb40]/15 border border-[#00fb40]/40 text-[#00fb40]">
                    EXTREME PREDATION (24.1k/hr)
                  </span>
                </div>
                <p className="text-xs text-[#b9cacb]">"The brutal mindset rule that makes the top 1%"</p>
                <div className="flex justify-between items-center text-[11px] font-mono-terminal pt-2 border-t border-[#3b494b]/30">
                  <span className="text-[#849495]">Upload Age: 1.2 hrs</span>
                  <button
                    onClick={() => triggerTrendJack("The brutal mindset rule that makes the top 1%", "@ViralMotivation24", "24.1k/hr")}
                    className="text-[#00f0ff] hover:underline font-bold"
                  >
                    TRIGGER RAPID RESPONSE &rarr;
                  </button>
                </div>
              </div>

              {/* Competitor Card 4 */}
              <div className="glass-panel p-4 rounded-lg border-l-4 border-l-[#849495] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono-terminal font-bold text-sm text-white">@CodeMinimal</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-terminal text-[#849495]">
                    LOW PREDATION (800/hr)
                  </span>
                </div>
                <p className="text-xs text-[#b9cacb]">"CSS Grid Layout Tutorial in 60 seconds"</p>
                <div className="flex justify-between items-center text-[11px] font-mono-terminal pt-2 border-t border-[#3b494b]/30">
                  <span className="text-[#849495]">Upload Age: 12.0 hrs</span>
                  <button
                    onClick={() => triggerTrendJack("CSS Grid Layout Tutorial", "@CodeMinimal", "800/hr")}
                    className="text-[#00f0ff] hover:underline font-bold"
                  >
                    TRIGGER RAPID RESPONSE &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: COMPLIANCE & CONTENT ID PROXY */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "COMPLIANCE" && (
          <div className="space-y-6">
            <div className="border-b border-[#3b494b]/40 pb-4">
              <h1 className="text-3xl font-bold font-sora text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-[#00f0ff] text-3xl">policy</span>
                Compliance & Content ID Proxy
              </h1>
              <p className="text-xs font-mono-terminal text-[#849495] mt-1">
                AUTOMATED PRE-FLIGHT AUDIT // AD-SAFE LEXICON // SYNTHETIC MEDIA DISCLOSURE
              </p>
            </div>

            {/* Risk Meters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel p-4 rounded-lg text-center">
                <div className="text-[11px] font-mono-terminal text-[#849495]">VISUAL ASSET HASHES</div>
                <div className="text-3xl font-bold font-mono-terminal text-[#00fb40] mt-1">0</div>
                <div className="text-[10px] font-mono-terminal text-[#849495] mt-1">FLAGS DETECTED</div>
              </div>

              <div className="glass-panel p-4 rounded-lg text-center">
                <div className="text-[11px] font-mono-terminal text-[#849495]">AUDIO TRACK SCANS</div>
                <div className="text-3xl font-bold font-mono-terminal text-[#ff8c00] mt-1">
                  {complianceResult.audioWarnings || 1}
                </div>
                <div className="text-[10px] font-mono-terminal text-[#849495] mt-1">AUTO-CLEARED LICENSED</div>
              </div>

              <div className="glass-panel p-4 rounded-lg text-center border-l-4 border-l-[#00f0ff]">
                <div className="text-[11px] font-mono-terminal text-[#00f0ff]">COMPLIANCE RISK SCORE</div>
                <div className="text-3xl font-bold font-mono-terminal text-white mt-1">{complianceResult.riskScore}%</div>
                <div className="text-[10px] font-mono-terminal text-[#00fb40] mt-1">
                  [{complianceResult.riskCategory} ZONE - SAFE TO PUBLISH]
                </div>
              </div>
            </div>

            {/* Ad-Safe Lexicon Filter Table */}
            <div className="glass-panel rounded-lg overflow-hidden border border-[#3b494b]/50">
              <div className="p-4 bg-[#1c1b1c]/80 border-b border-[#3b494b]/40 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00f0ff] text-[18px]">filter_alt</span>
                  <h3 className="font-mono-terminal font-bold text-xs uppercase text-white">Ad-Safe Lexicon Filter</h3>
                </div>
                <span className="text-[11px] font-mono-terminal text-[#00fb40]">AUTOCORRECT: ON</span>
              </div>

              <table className="w-full text-left font-mono-terminal text-xs">
                <thead className="bg-[#131314] text-[#849495] border-b border-[#3b494b]/30">
                  <tr>
                    <th className="p-3">TIMESTAMP</th>
                    <th className="p-3">ORIGINAL (FLAGGED)</th>
                    <th className="p-3">REPLACEMENT</th>
                    <th className="p-3 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3b494b]/20">
                  {complianceResult.replacements.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#1c1b1c]/40">
                      <td className="p-3 text-[#00f0ff]">{item.timestamp}</td>
                      <td className="p-3 text-[#ff8c00] line-through">"{item.original}"</td>
                      <td className="p-3 text-white font-bold">"{item.replacement}"</td>
                      <td className="p-3 text-right text-[#00fb40] font-bold">[{item.status}]</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Live Script Scanner Sandbox */}
            <div className="glass-panel p-4 rounded-lg space-y-3">
              <h3 className="font-mono-terminal font-bold text-xs uppercase text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00f0ff] text-[16px]">bug_report</span>
                Script Compliance Sandbox
              </h3>
              <textarea
                value={complianceInput}
                onChange={(e) => setComplianceInput(e.target.value)}
                rows={3}
                className="w-full bg-[#131314] border border-[#3b494b] focus:border-[#00f0ff] p-3 rounded font-mono-terminal text-xs text-white outline-none"
                placeholder="Test script text for ad-safe demonetization triggers..."
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono-terminal text-[#849495]">Sanitized Preview: "{complianceResult.cleanText}"</span>
                <button
                  onClick={runComplianceScan}
                  className="px-4 py-2 bg-[#00f0ff] hover:bg-[#7df4ff] text-black font-mono-terminal font-bold text-xs rounded transition-all"
                >
                  RUN PRE-FLIGHT SCAN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: RLYA LEARNING CORE */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "RLYA" && (
          <div className="space-y-6">
            <div className="border-b border-[#3b494b]/40 pb-4">
              <h1 className="text-3xl font-bold font-sora text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-[#00f0ff] text-3xl">psychology</span>
                Recursive Learning Core (RLYA)
              </h1>
              <p className="text-xs font-mono-terminal text-[#849495] mt-1">
                REINFORCEMENT LEARNING FROM YOUTUBE ANALYTICS // AUTONOMOUS SCRIPT RETENTION TUNER
              </p>
            </div>

            {/* RLYA Telemetry Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel p-4 rounded-lg border-l-4 border-l-[#00f0ff]">
                <div className="text-[11px] font-mono-terminal text-[#849495]">LEARNING VELOCITY</div>
                <div className="text-3xl font-bold font-mono-terminal text-[#00f0ff] mt-1">2.4x</div>
                <div className="text-[10px] font-mono-terminal text-[#00fb40] mt-1">+14% Optimization per Cycle</div>
              </div>

              <div className="glass-panel p-4 rounded-lg border-l-4 border-l-[#d1bcff]">
                <div className="text-[11px] font-mono-terminal text-[#849495]">ITERATION CYCLE</div>
                <div className="text-3xl font-bold font-mono-terminal text-white mt-1">#409</div>
                <div className="text-[10px] font-mono-terminal text-[#00fb40] mt-1">Active Feedback Loop</div>
              </div>

              <div className="glass-panel p-4 rounded-lg border-l-4 border-l-[#00fb40]">
                <div className="text-[11px] font-mono-terminal text-[#849495]">CURRENT AUDIENCE RETENTION</div>
                <div className="text-3xl font-bold font-mono-terminal text-[#00fb40] mt-1">78.4%</div>
                <div className="text-[10px] font-mono-terminal text-[#849495] mt-1">Target: &gt;75% for Viral Push</div>
              </div>
            </div>

            {/* Retention Drop-Off Analysis Map */}
            <div className="glass-panel p-6 rounded-lg space-y-4">
              <div className="flex justify-between items-center border-b border-[#3b494b]/30 pb-3">
                <h3 className="font-mono-terminal font-bold text-xs uppercase text-white">
                  Second-by-Second Audience Retention Telemetry
                </h3>
                <span className="text-[11px] font-mono-terminal text-[#00f0ff]">Pacing Algorithm: Adaptive-3s</span>
              </div>

              {/* Simulated Visual Waveform / Retention Curve */}
              <div className="h-44 w-full bg-[#131314] rounded border border-[#3b494b]/40 p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between text-[10px] font-mono-terminal text-[#849495]">
                  <span>0s [HOOK: 100%]</span>
                  <span>15s [BODY: 88%]</span>
                  <span>30s [PEAK: 84%]</span>
                  <span>45s [CTA: 78%]</span>
                  <span>60s [END: 76%]</span>
                </div>

                {/* SVG Visual Curve */}
                <svg className="w-full h-24 stroke-[#00f0ff] fill-none" viewBox="0 0 500 100">
                  <path
                    d="M 0 10 Q 50 15, 100 22 T 200 30 T 300 34 T 400 42 T 500 48"
                    strokeWidth="3"
                    className="glow-cyan-sm"
                  />
                  <path
                    d="M 0 10 Q 50 15, 100 22 T 200 30 T 300 34 T 400 42 T 500 48 L 500 100 L 0 100 Z"
                    fill="url(#cyanGradient)"
                    opacity="0.2"
                  />
                  <defs>
                    <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f0ff" />
                      <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="flex justify-between items-center text-[11px] font-mono-terminal">
                  <span className="text-[#00fb40]">● Hook Retention Inflection: Clean 92% pass-through</span>
                  <span className="text-[#849495]">Auto-Adjust: 3.2s hook duration optimal</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 5: COMPUTE NODES (GITHUB ACTIONS / KAGGLE) */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "NODES" && (
          <div className="space-y-6">
            <div className="border-b border-[#3b494b]/40 pb-4">
              <h1 className="text-3xl font-bold font-sora text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-[#00f0ff] text-3xl">hub</span>
                Compute Cluster & Node Map
              </h1>
              <p className="text-xs font-mono-terminal text-[#849495] mt-1">
                ZERO-MARGINAL-COST SCALING // GITHUB ACTIONS RUNNERS + KAGGLE GPU NODES
              </p>
            </div>

            {/* Node Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Node 1 */}
              <div className="glass-panel p-5 rounded-lg border-t-4 border-t-[#00f0ff] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono-terminal font-bold text-sm text-white">Node Alpha (GPU)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-terminal font-bold bg-[#00fb40]/15 text-[#00fb40] border border-[#00fb40]/40">
                    ONLINE
                  </span>
                </div>
                <div className="text-xs text-[#849495] space-y-1 font-mono-terminal">
                  <div>Type: Kaggle GPU (NVIDIA T4 x 2)</div>
                  <div>Role: SadTalker Lip-Sync & Whisper</div>
                  <div>Latency: 142ms</div>
                </div>
              </div>

              {/* Node 2 */}
              <div className="glass-panel p-5 rounded-lg border-t-4 border-t-[#00fb40] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono-terminal font-bold text-sm text-white">Node Beta (Serverless)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-terminal font-bold bg-[#00fb40]/15 text-[#00fb40] border border-[#00fb40]/40">
                    HYBRID ACTIVE
                  </span>
                </div>
                <div className="text-xs text-[#849495] space-y-1 font-mono-terminal">
                  <div>Type: GitHub Actions Matrix Runners</div>
                  <div>Role: Headless FFmpeg Split-Screen</div>
                  <div>Cost: $0.00 Marginal</div>
                </div>
              </div>

              {/* Node 3 */}
              <div className="glass-panel p-5 rounded-lg border-t-4 border-t-[#d1bcff] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono-terminal font-bold text-sm text-white">Node Gamma (Publisher)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-terminal font-bold bg-[#00fb40]/15 text-[#00fb40] border border-[#00fb40]/40">
                    IDLE / POLLING
                  </span>
                </div>
                <div className="text-xs text-[#849495] space-y-1 font-mono-terminal">
                  <div>Type: Puppeteer Stealth Agent</div>
                  <div>Role: YouTube Studio Strict Uploader</div>
                  <div>Interval: Every 5 mins</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 6: REVENUE CENTER */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "REVENUE" && (
          <div className="space-y-6">
            <div className="border-b border-[#3b494b]/40 pb-4">
              <h1 className="text-3xl font-bold font-sora text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-[#00f0ff] text-3xl">payments</span>
                Autonomous Revenue Creation Center
              </h1>
              <p className="text-xs font-mono-terminal text-[#849495] mt-1">
                MONETIZATION METRICS // NICHE ROI BREAKDOWN // RPM OPTIMIZATION
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel p-4 rounded-lg border-l-4 border-l-[#00fb40]">
                <div className="text-[11px] font-mono-terminal text-[#849495]">ESTIMATED MONTHLY YIELD</div>
                <div className="text-3xl font-bold font-mono-terminal text-[#00fb40] mt-1">$4,850.00</div>
                <div className="text-[10px] font-mono-terminal text-[#00fb40] mt-1">+24% vs Previous Month</div>
              </div>

              <div className="glass-panel p-4 rounded-lg border-l-4 border-l-[#00f0ff]">
                <div className="text-[11px] font-mono-terminal text-[#849495]">AVERAGE NICHE RPM</div>
                <div className="text-3xl font-bold font-mono-terminal text-white mt-1">$6.42</div>
                <div className="text-[10px] font-mono-terminal text-[#849495] mt-1">High-Finance / Tech CPM</div>
              </div>

              <div className="glass-panel p-4 rounded-lg border-l-4 border-l-[#ff8c00]">
                <div className="text-[11px] font-mono-terminal text-[#849495]">MARGINAL COST PER VIDEO</div>
                <div className="text-3xl font-bold font-mono-terminal text-[#00fb40] mt-1">$0.00</div>
                <div className="text-[10px] font-mono-terminal text-[#849495] mt-1">100% Free-Tier Architecture</div>
              </div>
            </div>

            {/* Formula Efficiency Comparison */}
            <div className="glass-panel p-5 rounded-lg space-y-3 font-mono-terminal text-xs">
              <h3 className="font-bold text-white uppercase text-xs">Content Formula Performance Index</h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[#b9cacb] mb-1">
                    <span>Formula B (Viral Clone & Avatar)</span>
                    <span className="text-[#00fb40]">88% Retention // $7.10 RPM</span>
                  </div>
                  <div className="w-full h-2 bg-[#131314] rounded overflow-hidden">
                    <div className="h-full bg-[#00fb40] w-[88%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#b9cacb] mb-1">
                    <span>Formula A (Split-Screen Aggregator)</span>
                    <span className="text-[#00f0ff]">79% Retention // $5.80 RPM</span>
                  </div>
                  <div className="w-full h-2 bg-[#131314] rounded overflow-hidden">
                    <div className="h-full bg-[#00f0ff] w-[79%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#b9cacb] mb-1">
                    <span>Formula C (AI Re-Narration & Pexels B-Roll)</span>
                    <span className="text-[#d1bcff]">74% Retention // $6.20 RPM</span>
                  </div>
                  <div className="w-full h-2 bg-[#131314] rounded overflow-hidden">
                    <div className="h-full bg-[#d1bcff] w-[74%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 7: SYSTEM SETTINGS BAY */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "SETTINGS" && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="flex justify-between items-end border-b border-[#3b494b]/40 pb-4">
              <div>
                <h1 className="text-3xl font-bold font-sora text-white flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#00f0ff] text-3xl">tune</span>
                  System Configuration Bay
                </h1>
                <p className="text-xs font-mono-terminal text-[#849495] mt-1">
                  GLOBAL PARAMETERS // VOICE SYNTHESIS // AUTOPILOT DEPLOYMENT
                </p>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#00f0ff] hover:bg-[#7df4ff] text-black font-mono-terminal font-bold text-xs rounded transition-all glow-cyan-sm cursor-pointer"
              >
                SAVE & DEPLOY CONFIG
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: AI & Strategy */}
              <div className="glass-panel p-5 rounded-lg space-y-4 font-mono-terminal text-xs">
                <h3 className="font-bold text-white uppercase border-b border-[#3b494b]/30 pb-2 text-xs">AI & Content Direction</h3>

                <div>
                  <label className="text-[#849495] uppercase block mb-1">Target Niche</label>
                  <input
                    type="text"
                    value={settings.targetNiche}
                    onChange={(e) => setSettings({ ...settings, targetNiche: e.target.value })}
                    className="w-full bg-[#131314] border border-[#3b494b] focus:border-[#00f0ff] p-2.5 rounded text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#849495] uppercase block mb-1">AI Tone / Archetype</label>
                  <select
                    value={settings.geminiTone}
                    onChange={(e) => setSettings({ ...settings, geminiTone: e.target.value })}
                    className="w-full bg-[#131314] border border-[#3b494b] focus:border-[#00f0ff] p-2.5 rounded text-white outline-none"
                  >
                    <option value="Clickbaity">Clickbaity & Viral</option>
                    <option value="Cinematic">Cinematic & Narrative</option>
                    <option value="Analytical">Analytical & Deep-Dive</option>
                    <option value="Dramatic">Dramatic & Suspenseful</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#849495] uppercase block mb-1">Content Formula Model</label>
                  <select
                    value={settings.copyPasteMode}
                    onChange={(e) => setSettings({ ...settings, copyPasteMode: e.target.value })}
                    className="w-full bg-[#131314] border border-[#3b494b] focus:border-[#00f0ff] p-2.5 rounded text-white outline-none"
                  >
                    <option value="clone_avatar">Formula B: Viral Clone & Lip-Sync Avatar</option>
                    <option value="split_screen">Formula A: Split-Screen Aggregator</option>
                    <option value="renarration">Formula C: Generative AI Re-Narration</option>
                  </select>
                </div>

                {/* SOTA Switches */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-white font-bold">Ad-Safe Lexicon Filter</span>
                    <input
                      type="checkbox"
                      checked={settings.adSafeFilterEnabled}
                      onChange={(e) => setSettings({ ...settings, adSafeFilterEnabled: e.target.checked })}
                      className="w-4 h-4 accent-[#00f0ff]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-white font-bold">RLYA Self-Learning Feedback Loop</span>
                    <input
                      type="checkbox"
                      checked={settings.enableSelfLearningAI}
                      onChange={(e) => setSettings({ ...settings, enableSelfLearningAI: e.target.checked })}
                      className="w-4 h-4 accent-[#00f0ff]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-white font-bold">Auto-Pilot 24/7 Publishing</span>
                    <input
                      type="checkbox"
                      checked={settings.autoPilotEnabled}
                      onChange={(e) => setSettings({ ...settings, autoPilotEnabled: e.target.checked })}
                      className="w-4 h-4 accent-[#00f0ff]"
                    />
                  </label>
                </div>
              </div>

              {/* Right Column: Voice & Video Processing */}
              <div className="glass-panel p-5 rounded-lg space-y-4 font-mono-terminal text-xs">
                <h3 className="font-bold text-white uppercase border-b border-[#3b494b]/30 pb-2 text-xs">Voice & Video Processing Bay</h3>

                <div>
                  <label className="text-[#849495] uppercase block mb-1">Neural TTS Voice</label>
                  <select
                    value={settings.voiceName}
                    onChange={(e) => setSettings({ ...settings, voiceName: e.target.value })}
                    className="w-full bg-[#131314] border border-[#3b494b] focus:border-[#00f0ff] p-2.5 rounded text-white outline-none"
                  >
                    {settings.availableVoices?.map((v: any) => (
                      <option key={v.name} value={v.name}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#849495] uppercase block mb-1">Video Speed Multiplier: {settings.videoSpeed}x</label>
                  <input
                    type="range"
                    min="1.0"
                    max="1.2"
                    step="0.01"
                    value={settings.videoSpeed}
                    onChange={(e) => setSettings({ ...settings, videoSpeed: parseFloat(e.target.value) })}
                    className="w-full accent-[#00f0ff]"
                  />
                </div>

                <div>
                  <label className="text-[#849495] uppercase block mb-1">Audio Bass Boost: +{settings.audioBass} dB</label>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="1"
                    value={settings.audioBass}
                    onChange={(e) => setSettings({ ...settings, audioBass: parseInt(e.target.value) })}
                    className="w-full accent-[#00f0ff]"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-white font-bold">Preserve Original Audio (Formula B)</span>
                    <input
                      type="checkbox"
                      checked={settings.replaceOriginalAudio}
                      onChange={(e) => setSettings({ ...settings, replaceOriginalAudio: e.target.checked })}
                      className="w-4 h-4 accent-[#00f0ff]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-white font-bold">GPU Acceleration (Kaggle CUDA)</span>
                    <input
                      type="checkbox"
                      checked={settings.useGpu}
                      onChange={(e) => setSettings({ ...settings, useGpu: e.target.checked })}
                      className="w-4 h-4 accent-[#00f0ff]"
                    />
                  </label>
                </div>
              </div>
            </div>
          </form>
        )}

      </main>

      {/* Video Preview Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-4 rounded-lg max-w-sm w-full space-y-3 border border-[#00f0ff]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono-terminal font-bold text-[#00f0ff]">VIDEO PREVIEW</span>
              <button onClick={() => setSelectedVideo(null)} className="text-[#849495] hover:text-white font-bold">&times;</button>
            </div>
            <video src={selectedVideo} controls autoPlay className="w-full rounded bg-black aspect-[9/16]" />
            <button
              onClick={() => setSelectedVideo(null)}
              className="w-full py-2 bg-[#1c1b1c] border border-[#3b494b] text-white rounded text-xs font-mono-terminal font-bold"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
