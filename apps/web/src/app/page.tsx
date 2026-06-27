"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function TrendVault() {
  const [trends, setTrends] = useState<any[]>([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [systemStatus, setSystemStatus] = useState("Sleeping / Waiting for Next Task");

  const [settings, setSettings] = useState<any>({
    targetNiche: "Podcast Clips shorts",
    geminiTone: "Clickbaity",
    autoPilotEnabled: false,
    enableSelfLearningAI: false,
    scrapeIntervalMinutes: 60,
    uploadTimes: "15:00,18:00",
    maxDownloadsPerRun: 1,
    maxUploadsPerDay: 2,
    videoSpeed: 1.05,
    audioBass: 3,
    colorScramble: true,
    overlayText: "Wait for the end...",
    overlayPosition: "CENTER",
    overlayFontSize: 80
  });

  const [activeTab, setActiveTab] = useState("CORE");

  useEffect(() => {
    fetchTrends();
    fetchSettings();
    
    // Poll system status every 2 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:3001/api/status");
        const data = await res.json();
        if (data.task) setSystemStatus(data.task);
      } catch (err) {}
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/settings");
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (err) {
      console.error(err);
    }
  };

  const updateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("http://localhost:3001/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      toast.success("Settings updated successfully! The Master Clock is now running with your new rules.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    }
  };

  const fetchTrends = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/trends");
      const data = await res.json();
      setTrends(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("http://localhost:3001/api/trends/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      setUrl("");
      fetchTrends();
      toast.success("Ingested successfully! It will be scraped soon.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to ingest URL");
    } finally {
      setLoading(false);
    }
  };

  const forceUpload = async () => {
    const tId = toast.loading("Forcing upload of next ready video...");
    try {
      const res = await fetch("http://localhost:3001/api/publish/force-next", { method: "POST" });
      const data = await res.json();
      
      if (data.needsAuth) {
        const authRes = await fetch("http://localhost:3001/api/publish/auth");
        const authData = await authRes.json();
        if (authData.authUrl) {
           window.location.href = authData.authUrl;
           toast.dismiss(tId);
        } else {
           toast.error("Could not load Auth URL.", { id: tId });
        }
      } else if (data.status === 'success') {
        toast.success(`Upload successful! Video ID: ${data.videoId}`, { id: tId });
        fetchTrends();
      } else {
        toast.error(data.error || "Upload failed", { id: tId });
      }
    } catch (err) {
      toast.error("Failed to force upload", { id: tId });
    }
  };

  const deleteTrend = async (youtubeId: string) => {
    if (!confirm("Are you sure you want to delete this trend?")) return;
    try {
      await fetch(`http://localhost:3001/api/trends/${youtubeId}`, { method: "DELETE" });
      toast.success("Trend deleted");
      fetchTrends();
    } catch (err) {
      toast.error("Failed to delete trend");
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'DOWNLOADING': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      case 'COMPLETED': return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'UPLOADED': return 'bg-purple-500/20 text-purple-500 border-purple-500/50';
      case 'FAILED': return 'bg-red-500/20 text-red-500 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <Toaster position="top-right" toastOptions={{ style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' } }} />
      
      {/* System Status Bar */}
      <div className="flex items-center justify-between bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex h-3 w-3">
            {systemStatus !== "Sleeping / Waiting for Next Task" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${systemStatus === "Sleeping / Waiting for Next Task" ? 'bg-gray-500' : 'bg-blue-500'}`}></span>
          </div>
          <span className="text-sm font-medium text-blue-200">System Activity: <strong className="text-white">{systemStatus}</strong></span>
        </div>
      </div>

      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          YouTubBot God Mode
        </h1>
        <p className="text-[#a1a1aa] mt-2 text-lg">
          Absolute control over your automated YouTube empire.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Settings Panel (Takes 2 columns) */}
        <div className="lg:col-span-2 bg-[#18181b] border border-[#27272a] rounded-xl shadow-lg overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-[#27272a] bg-[#09090b]">
            {['CORE', 'LIMITS', 'EDITOR', 'AI'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === tab ? 'text-blue-400 border-b-2 border-blue-400 bg-[#18181b]' : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a]'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={updateSettings} className="p-8 space-y-6">
            
            {/* CORE TAB */}
            {activeTab === 'CORE' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-xl font-bold text-white mb-6">Master Engine Core</h2>
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">Target Niche (Search Term)</label>
                  <input type="text" value={settings.targetNiche} onChange={(e) => setSettings({ ...settings, targetNiche: e.target.value })} className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#a1a1aa] mb-2">Scrape Interval (Minutes)</label>
                    <input type="number" min="1" value={settings.scrapeIntervalMinutes} onChange={(e) => setSettings({ ...settings, scrapeIntervalMinutes: e.target.value })} className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#a1a1aa] mb-2">Upload Times (HH:MM)</label>
                    <input type="text" value={settings.uploadTimes} onChange={(e) => setSettings({ ...settings, uploadTimes: e.target.value })} placeholder="15:00, 18:00" className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#27272a]/30 rounded-lg border border-[#27272a]">
                  <div>
                    <label className="text-base font-medium text-white block">Engage Auto-Pilot</label>
                    <span className="text-xs text-[#a1a1aa]">Allows the Master Clock to execute cron tasks automatically.</span>
                  </div>
                  <button type="button" onClick={() => setSettings({ ...settings, autoPilotEnabled: !settings.autoPilotEnabled })} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${settings.autoPilotEnabled ? 'bg-blue-600' : 'bg-[#3f3f46]'}`}>
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${settings.autoPilotEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            )}

            {/* LIMITS TAB */}
            {activeTab === 'LIMITS' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-xl font-bold text-white mb-6">Volume & Limits</h2>
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2 flex justify-between">
                    <span>Max Downloads Per Scrape</span>
                    <span className="text-blue-400 font-bold">{settings.maxDownloadsPerRun}</span>
                  </label>
                  <input type="range" min="1" max="10" value={settings.maxDownloadsPerRun} onChange={(e) => setSettings({ ...settings, maxDownloadsPerRun: e.target.value })} className="w-full accent-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2 flex justify-between">
                    <span>Max Uploads Per Day</span>
                    <span className="text-blue-400 font-bold">{settings.maxUploadsPerDay}</span>
                  </label>
                  <input type="range" min="1" max="10" value={settings.maxUploadsPerDay} onChange={(e) => setSettings({ ...settings, maxUploadsPerDay: e.target.value })} className="w-full accent-blue-500" />
                  <p className="text-xs text-[#a1a1aa] mt-2">Warning: More than 4 uploads per day may flag your channel as spam.</p>
                </div>
              </div>
            )}

            {/* EDITOR TAB */}
            {activeTab === 'EDITOR' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-xl font-bold text-white mb-6">FFmpeg Rendering Engine</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#a1a1aa] mb-2 flex justify-between">
                      <span>Video Speed</span>
                      <span className="text-blue-400 font-bold">{settings.videoSpeed}x</span>
                    </label>
                    <input type="range" min="1.0" max="1.5" step="0.01" value={settings.videoSpeed} onChange={(e) => setSettings({ ...settings, videoSpeed: e.target.value })} className="w-full accent-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#a1a1aa] mb-2 flex justify-between">
                      <span>Audio Bass Boost</span>
                      <span className="text-blue-400 font-bold">g={settings.audioBass}</span>
                    </label>
                    <input type="range" min="0" max="10" value={settings.audioBass} onChange={(e) => setSettings({ ...settings, audioBass: e.target.value })} className="w-full accent-blue-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#27272a]/30 rounded-lg border border-[#27272a]">
                  <label className="text-sm font-medium text-white">Cryptographic Color Scramble</label>
                  <button type="button" onClick={() => setSettings({ ...settings, colorScramble: !settings.colorScramble })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.colorScramble ? 'bg-blue-600' : 'bg-[#3f3f46]'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.colorScramble ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="pt-4 border-t border-[#27272a]">
                  <h3 className="text-lg font-medium text-white mb-4">Video Overlay Branding</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#a1a1aa] mb-2">Overlay Hook Text</label>
                      <input type="text" value={settings.overlayText} onChange={(e) => setSettings({ ...settings, overlayText: e.target.value })} className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-[#a1a1aa] mb-2">Overlay Position</label>
                        <select value={settings.overlayPosition} onChange={(e) => setSettings({ ...settings, overlayPosition: e.target.value })} className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="TOP">Top (Y: 20%)</option>
                          <option value="CENTER">Center (Y: 50%)</option>
                          <option value="BOTTOM">Bottom (Y: 80%)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-[#a1a1aa] mb-2">Font Size ({settings.overlayFontSize}px)</label>
                        <input type="range" min="40" max="150" value={settings.overlayFontSize} onChange={(e) => setSettings({ ...settings, overlayFontSize: e.target.value })} className="w-full mt-2 accent-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI TAB */}
            {activeTab === 'AI' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-xl font-bold text-white mb-6">Gemini Director Configuration</h2>
                
                <div className="flex items-center justify-between p-6 bg-purple-900/20 rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <div>
                    <label className="text-lg font-bold text-purple-300 block mb-1">🧠 Enable AI Self-Learning</label>
                    <span className="text-sm text-purple-200/70">Allows Gemini to analyze views and automatically rewrite your Target Niche every Sunday.</span>
                  </div>
                  <button type="button" onClick={() => setSettings({ ...settings, enableSelfLearningAI: !settings.enableSelfLearningAI })} className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300 ${settings.enableSelfLearningAI ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'bg-[#3f3f46]'}`}>
                    <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform duration-300 ${settings.enableSelfLearningAI ? 'translate-x-11' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="mt-8">
                  <label className="block text-sm text-[#a1a1aa] mb-2">AI Title Tone / Vibe</label>
                  <select value={settings.geminiTone} onChange={(e) => setSettings({ ...settings, geminiTone: e.target.value })} className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="Clickbaity">Clickbaity (SHOCKING, 🤯, OMG)</option>
                    <option value="Mysterious">Mysterious (Wait until you see...)</option>
                    <option value="Aggressive">Aggressive (You NEED to see this...)</option>
                    <option value="Professional">Professional (Informative and clean)</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl text-lg font-bold transition-all shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]">
              SAVE CONFIGURATION TO MASTER CLOCK
            </button>
          </form>
        </div>

        {/* Intelligence Vault Side Panel */}
        <div className="space-y-6">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Manual Ingest Signal</h2>
            <form onSubmit={handleIngest} className="flex flex-col gap-4">
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste YouTube URL..." required className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="submit" disabled={loading} className="w-full bg-[#27272a] hover:bg-[#3f3f46] text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {loading ? "Scraping..." : "Force Download Video"}
              </button>
            </form>
          </div>

          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-sm min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Vault ({trends.length})</h2>
              <button onClick={forceUpload} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow-lg transition-transform active:scale-95">
                Force Upload Next
              </button>
            </div>
            {fetching ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-[#27272a] rounded-lg"></div>
                ))}
              </div>
            ) : trends.length === 0 ? (
              <div className="text-center py-12 text-[#a1a1aa]">Vault is empty.</div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {trends.map((trend) => {
                  const meta = trend.metadata ? JSON.parse(trend.metadata) : {};
                  return (
                    <div key={trend.id} className="bg-[#09090b] border border-[#27272a] rounded-lg p-3 hover:border-[#3f3f46] transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-xs line-clamp-2 leading-tight pr-2">{trend.topic}</h3>
                        <button onClick={() => deleteTrend(trend.youtubeId)} className="text-[#a1a1aa] hover:text-red-500">×</button>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-[#a1a1aa]">
                        <span className={`px-2 py-0.5 rounded-full border ${getStatusColor(trend.downloadStatus)}`}>
                          {trend.downloadStatus}
                        </span>
                        <span className="text-blue-400 font-bold">Views: {meta.viewCount || "N/A"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
