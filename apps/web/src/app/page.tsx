"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

// Icon components
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
  </svg>
);

const BoltIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
  </svg>
);

export default function HybridDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState<any>({
    targetNiche: "Motivation",
    geminiTone: "Clickbaity",
    voiceName: "en-US-GuyNeural",
    voiceGender: "Male",
    enableSelfLearningAI: false,
    autoPilotEnabled: false,
    availableVoices: []
  });

  const [activeTab, setActiveTab] = useState("PIPELINE");

  useEffect(() => {
    fetchSettings();
    fetchJobs();
    
    // Poll for job updates every 5 seconds
    const interval = setInterval(() => {
      fetchJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/pipeline/jobs?limit=20");
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
      if (data.statusCounts) setStats(data.statusCounts);
    } catch (err) {
      console.error(err);
    }
  };

  const updateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      toast.success("AI Configuration Saved.");
    } catch (err) {
      toast.error("Failed to save settings");
    }
  };

  const triggerPipeline = async () => {
    if (!confirm("This will trigger a new AI script generation and start the Kaggle GPU worker. Continue?")) return;
    setLoading(true);
    const tId = toast.loading("Connecting to Vercel & Groq...");
    try {
      const res = await fetch("/api/pipeline/trigger", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_PIPELINE_SECRET || 'youtubbot_secure_pipeline_key_2026'}` // Fallback for demo
        },
        body: JSON.stringify({ count: 1, force: true }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(`Pipeline Triggered! ${data.message}`, { id: tId });
        fetchJobs();
      } else {
        toast.error(data.error || "Failed", { id: tId });
      }
    } catch (err) {
      toast.error("Network Error", { id: tId });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string, text: string, border: string }> = {
      'PENDING': { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
      'SCRIPTED': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
      'RENDERING': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
      'READY': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
      'UPLOADED': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
      'FAILED': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    };
    const c = config[status] || config['PENDING'];
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border} flex items-center gap-1.5`}>
        {status === 'RENDERING' && <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>}
        {status}
      </span>
    );
  };

  const getAvailableVoices = () => {
    if (typeof settings.availableVoices === 'string') {
      try { return JSON.parse(settings.availableVoices); } catch(e) { return []; }
    }
    return Array.isArray(settings.availableVoices) ? settings.availableVoices : [];
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-purple-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#09090b] to-[#09090b] -z-10"></div>
      
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <Toaster position="top-center" toastOptions={{ style: { background: 'rgba(24, 24, 27, 0.8)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500">
              SOTA Viral Engine
            </h1>
            <p className="text-zinc-400 mt-2 text-lg font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Phase 2 Active • OpenVoice + SadTalker + Whisper
            </p>
          </div>
          
          <button 
            onClick={triggerPipeline} 
            disabled={loading}
            className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-white transition-all duration-200 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></div>
            <span className="relative flex items-center gap-2">
              {loading ? <span className="animate-spin text-xl">⚪</span> : <BoltIcon />}
              TRIGGER PIPELINE
            </span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Jobs Processing", value: (stats['SCRIPTED'] || 0) + (stats['RENDERING'] || 0), color: "text-blue-400" },
            { label: "Ready to Upload", value: stats['READY'] || 0, color: "text-emerald-400" },
            { label: "Total Uploaded", value: stats['UPLOADED'] || 0, color: "text-purple-400" },
            { label: "Failed Jobs", value: stats['FAILED'] || 0, color: "text-red-400" },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
              <p className="text-zinc-400 text-sm font-medium mb-1">{stat.label}</p>
              <p className={`text-4xl font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl w-fit">
              {['PIPELINE', 'AI CONFIG', 'ANALYTICS'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB: PIPELINE */}
            {activeTab === 'PIPELINE' && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Active Render Jobs</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {jobs.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 font-medium">No active jobs in the pipeline.</div>
                  ) : (
                    jobs.map((job) => (
                      <div key={job.id} className="p-5 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate mb-1">
                            {job.generatedTitle || job.topic}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-zinc-500">
                            <span>ID: {job.id.slice(-6)}</span>
                            <span>•</span>
                            <span>{new Date(job.createdAt).toLocaleString()}</span>
                            {job.publishedYoutubeId && (
                              <>
                                <span>•</span>
                                <a href={`https://youtube.com/shorts/${job.publishedYoutubeId}`} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline flex items-center gap-1">
                                  <PlayIcon /> View Live
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          {getStatusBadge(job.status)}
                          {job.statusMessage && job.status !== 'UPLOADED' && job.status !== 'READY' && (
                            <span className="text-[10px] text-zinc-400 max-w-[200px] truncate animate-pulse bg-white/5 px-2 py-1 rounded-md" title={job.statusMessage}>
                              {job.statusMessage}
                            </span>
                          )}
                          {job.error && <span className="text-[10px] text-red-400 max-w-[200px] truncate" title={job.error}>{job.error}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: AI CONFIG */}
            {activeTab === 'AI CONFIG' && (
              <form onSubmit={updateSettings} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 space-y-8">
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-white border-b border-white/10 pb-4">Content Strategy</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Target Niche</label>
                    <input type="text" value={settings.targetNiche} onChange={(e) => setSettings({ ...settings, targetNiche: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow" placeholder="e.g. Motivation, Psychology Facts" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">AI Title Tone</label>
                      <select value={settings.geminiTone} onChange={(e) => setSettings({ ...settings, geminiTone: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow">
                        <option value="Clickbaity">Clickbaity (SHOCKING, 🤯)</option>
                        <option value="Mysterious">Mysterious (Wait until you see...)</option>
                        <option value="Educational">Educational (3 facts about...)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Neural Voice</label>
                      <select value={settings.voiceName} onChange={(e) => setSettings({ ...settings, voiceName: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow">
                        {getAvailableVoices().map((v: any) => (
                          <option key={v.name} value={v.name}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-white border-b border-white/10 pb-4">Automation Protocols</h3>
                  
                  <div className="flex items-center justify-between p-5 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div>
                      <p className="font-bold text-white">Full Auto-Pilot</p>
                      <p className="text-sm text-zinc-500 mt-1">Allow GitHub Actions to trigger the pipeline automatically on schedule.</p>
                    </div>
                    <button type="button" onClick={() => setSettings({ ...settings, autoPilotEnabled: !settings.autoPilotEnabled })} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.autoPilotEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.autoPilotEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-purple-900/10 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                    <div>
                      <p className="font-bold text-purple-300">Self-Learning AI Loop</p>
                      <p className="text-sm text-purple-200/60 mt-1">Groq will analyze past video performance to write better scripts.</p>
                    </div>
                    <button type="button" onClick={() => setSettings({ ...settings, enableSelfLearningAI: !settings.enableSelfLearningAI })} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.enableSelfLearningAI ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-zinc-700'}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.enableSelfLearningAI ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 px-6 py-4 rounded-xl text-sm font-bold transition-colors">
                  SAVE CONFIGURATION
                </button>
              </form>
            )}

            {/* TAB: ANALYTICS */}
            {activeTab === 'ANALYTICS' && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>📈</span> Self-Learning AI Analytics Engine
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1">
                      Views & retention data feed directly back into Groq to generate higher-CTR scripts.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const tId = toast.loading("Syncing YouTube Analytics...");
                      try {
                        const res = await fetch("/api/cron/analytics", {
                          headers: { "Authorization": `Bearer ${process.env.NEXT_PUBLIC_PIPELINE_SECRET || 'youtubbot_secure_pipeline_key_2026'}` }
                        });
                        const data = await res.json();
                        toast.success(`Analytics Synced! Updated ${data.syncedJobsCount || 0} jobs`, { id: tId });
                        fetchJobs();
                      } catch(e) {
                        toast.error("Sync Failed", { id: tId });
                      }
                    }}
                    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold transition-all"
                  >
                    SYNC YOUTUBE VIEWS
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Top Performing Content</h4>
                  {jobs.filter(j => j.views > 0 || j.publishedYoutubeId).length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 bg-black/20 rounded-xl border border-white/5 font-medium">
                      No published performance data recorded yet.<br/>Views will populate automatically after your first video uploads.
                    </div>
                  ) : (
                    jobs.filter(j => j.views > 0 || j.publishedYoutubeId)
                      .sort((a, b) => b.views - a.views)
                      .map((job, idx) => (
                        <div key={job.id} className="p-4 bg-black/30 rounded-xl border border-white/5 flex items-center justify-between gap-4 hover:border-white/10 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{job.generatedTitle || job.topic}</p>
                              <p className="text-xs text-zinc-500 truncate">ID: {job.id.slice(-6)} • {job.publishedYoutubeId ? `Shorts ID: ${job.publishedYoutubeId}` : 'Published'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-lg font-extrabold text-emerald-400">{job.views.toLocaleString()} views</p>
                              <p className="text-[10px] text-zinc-500">Retention Score: {job.retentionScore || 0}%</p>
                            </div>
                            {job.publishedYoutubeId && (
                              <a href={`https://youtube.com/shorts/${job.publishedYoutubeId}`} target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-xs">
                                ↗
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full"></div>
              <h3 className="text-lg font-bold text-white mb-4">Architecture Nodes</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold">1</span>
                    <span className="text-sm font-medium text-zinc-300">Vercel (Brain & DB)</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-emerald-500/30 bg-emerald-500/10">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold">2</span>
                    <span className="text-sm font-medium text-emerald-300">Viral Cloner Active</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium animate-pulse">OpenVoice</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400 font-bold">3</span>
                    <span className="text-sm font-medium text-zinc-300">Kaggle GPU (Worker)</span>
                  </div>
                  <span className="text-xs text-zinc-500">Idle / Ready</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400 font-bold">4</span>
                    <span className="text-sm font-medium text-zinc-300">Local Agent (Uploader)</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">Polling...</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
