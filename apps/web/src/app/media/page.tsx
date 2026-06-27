"use client";

import { useState, useEffect } from "react";

export default function MediaLibrary() {
  const [media, setMedia] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchMedia();
    const interval = setInterval(fetchMedia, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMedia = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/trends");
      const data = await res.json();
      setMedia(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const deleteTrend = async (youtubeId: string) => {
    if (!confirm("Are you sure you want to delete this media?")) return;
    try {
      await fetch(`http://localhost:3001/api/trends/${youtubeId}`, { method: "DELETE" });
      fetchMedia();
    } catch (err) {
      alert("Failed to delete media");
    }
  };

  const handlePublish = async (youtubeId: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/publish/${youtubeId}`, {
        method: "POST"
      });
      const data = await res.json();
      
      if (data.needsAuth) {
        // Fetch Auth URL
        const authRes = await fetch("http://localhost:3001/api/publish/auth");
        const authData = await authRes.json();
        if (authData.authUrl) {
           window.location.href = authData.authUrl;
        } else {
           alert("Could not load Auth URL. Do you have client_secret.json installed?");
        }
      } else if (data.videoId) {
        alert("Upload successful! YouTube Video ID: " + data.videoId);
      } else {
        alert("Error: " + JSON.stringify(data));
      }
    } catch (err) {
      alert("Failed to publish: " + String(err));
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
        <p className="text-[#a1a1aa] mt-2">
          Your downloaded and auto-edited viral clips, ready for publishing.
        </p>
      </div>

      <div className="space-y-4">
        {fetching && media.length === 0 ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-24 bg-[#18181b] border border-[#27272a] rounded-xl"></div>
            </div>
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-16 text-[#a1a1aa] bg-[#18181b] border border-[#27272a] rounded-xl border-dashed">
            No media harvested yet. Go to the Harvester to download a video.
          </div>
        ) : (
          <div className="space-y-4">
            {media.map((asset) => (
              <div key={asset.id} className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex flex-col space-y-2">
                  <h3 className="font-semibold text-lg text-[#fafafa] leading-tight">
                    {asset.topic}
                  </h3>
                  <div className="flex space-x-4 text-xs font-medium">
                    <span className={`px-2 py-1 rounded-full ${
                      asset.downloadStatus === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                      asset.downloadStatus === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      Download: {asset.downloadStatus}
                    </span>
                    {asset.processedFilePath && (
                      <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                        Edited: Ready
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#a1a1aa] font-mono">
                    {asset.processedFilePath ? asset.processedFilePath : (asset.localFilePath || 'Waiting for media...')}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => deleteTrend(asset.youtubeId)}
                    className="bg-gray-800 hover:bg-gray-700 text-[#a1a1aa] hover:text-red-400 px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handlePublish(asset.youtubeId)}
                    disabled={!asset.processedFilePath}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ▶ Publish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
