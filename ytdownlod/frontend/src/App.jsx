import { useState, useEffect } from 'react';
import { Search, HardDrive, FileVideo, FolderOpen, Eye, User, Clock, CheckCircle, XCircle, Download } from 'lucide-react';
import './index.css';

function App() {
  const [url, setUrl] = useState('');
  const [outputDir, setOutputDir] = useState(localStorage.getItem('outputDir') || '');
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);
  const [format, setFormat] = useState('best');
  
  // Queue state
  const [queue, setQueue] = useState(() => {
    try { return JSON.parse(localStorage.getItem('downloadQueue')) || []; } catch { return []; }
  });
  
  const [activeDownloadId, setActiveDownloadId] = useState(null);
  const [progressData, setProgressData] = useState({});

  useEffect(() => {
    localStorage.setItem('downloadQueue', JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    localStorage.setItem('outputDir', outputDir);
  }, [outputDir]);

  useEffect(() => {
    // Process queue sequentially
    if (activeDownloadId || queue.length === 0) return;
    
    const nextInQueue = queue.find(q => q.status === 'queued');
    if (nextInQueue) {
      startActualDownload(nextInQueue);
    }
  }, [queue, activeDownloadId]);

  const fetchMetadata = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true); setError(null); setMetadata(null);
    try {
      const res = await fetch('http://localhost:3001/api/metadata', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch metadata');
      setMetadata(data);
      setFormat('best'); // reset format
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const browseDirectory = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/select-directory');
      const data = await res.json();
      if (data.path) setOutputDir(data.path);
    } catch (err) {
      console.error('Failed to select directory', err);
    }
  };

  const addToQueue = () => {
    if (!metadata) return;
    const newJob = {
      id: Date.now().toString(),
      url,
      title: metadata.title,
      thumbnail: metadata.thumbnail,
      format,
      outputDir,
      status: 'queued', // queued, downloading, completed, error
    };
    setQueue(prev => [newJob, ...prev]);
    setMetadata(null);
    setUrl('');
  };

  const startActualDownload = (job) => {
    setActiveDownloadId(job.id);
    setQueue(prev => prev.map(q => q.id === job.id ? { ...q, status: 'downloading' } : q));
    setProgressData(prev => ({ ...prev, [job.id]: { percent: 0, speed: '0 MiB/s', eta: '--:--' } }));

    const queryParams = new URLSearchParams({
      url: job.url, format: job.format, ...(job.outputDir && { outputDir: job.outputDir })
    });

    const eventSource = new EventSource(`http://localhost:3001/api/download?${queryParams}`);

    eventSource.addEventListener('progress', (e) => {
      const data = JSON.parse(e.data);
      setProgressData(prev => ({ ...prev, [job.id]: data }));
    });

    eventSource.addEventListener('complete', () => {
      setProgressData(prev => ({ ...prev, [job.id]: { ...prev[job.id], percent: 100 } }));
      setQueue(prev => prev.map(q => q.id === job.id ? { ...q, status: 'completed' } : q));
      setActiveDownloadId(null);
      eventSource.close();
    });

    eventSource.addEventListener('error', (e) => {
      const data = JSON.parse(e.data);
      setQueue(prev => prev.map(q => q.id === job.id ? { ...q, status: 'error', errorMsg: data.message } : q));
      setActiveDownloadId(null);
      eventSource.close();
    });
  };

  const clearHistory = () => {
    setQueue(prev => prev.filter(q => q.status === 'queued' || q.status === 'downloading'));
  };

  const formatNumber = (num) => num ? new Intl.NumberFormat('en-US', { notation: "compact" }).format(num) : 'N/A';

  // Group formats nicely
  const getUniqueFormats = () => {
    if (!metadata) return [];
    const videoFormats = metadata.formats.filter(f => f.vcodec && f.resolution).map(f => ({
      id: f.format_id, label: `Video: ${f.resolution} (${f.ext})`
    }));
    // Remove duplicate resolutions
    const unique = [];
    const seen = new Set();
    for (const vf of videoFormats) {
      if (!seen.has(vf.label)) {
        seen.add(vf.label);
        unique.push(vf);
      }
    }
    return unique;
  };

  return (
    <>
      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      
      <div className="app-container">
        {/* LEFT PANEL */}
        <div className="glass-panel main-panel">
          <h1>THELODER</h1>
          
          <form onSubmit={fetchMetadata}>
            <div className="input-group">
              <label>YouTube Link</label>
              <input type="url" className="input-field glow-focus" placeholder="https://www.youtube.com/watch?v=..." value={url} onChange={(e) => setUrl(e.target.value)} disabled={loading} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || !url}>
              {loading ? <div className="spinner"></div> : <><Search size={20} /> Fetch Video Info</>}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}

          {metadata && !error && (
            <div className="media-card slide-up">
              <div className="media-thumbnail-wrapper">
                <img src={metadata.thumbnail} alt="Thumbnail" className="media-thumbnail" />
                <div className="media-duration">{metadata.duration}</div>
              </div>
              
              <div className="media-info">
                <div className="media-title" title={metadata.title}>{metadata.title}</div>
                <div className="media-stats">
                  <span><User size={14} /> {metadata.uploader || 'Unknown'}</span>
                  <span><Eye size={14} /> {formatNumber(metadata.view_count)} views</span>
                </div>
                
                <div className="input-group" style={{ marginTop: '1.5rem' }}>
                  <label><HardDrive size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/> Output Directory</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" className="input-field" placeholder="Default Downloads folder" value={outputDir} readOnly style={{ flex: 1, color: outputDir ? 'var(--text-main)' : 'var(--text-muted)' }} />
                    <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '0 1rem' }} onClick={browseDirectory} title="Browse Folder">
                      <FolderOpen size={20} />
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label><FileVideo size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/> Format</label>
                  <select className="input-field" value={format} onChange={(e) => setFormat(e.target.value)}>
                    <option value="best">Best Quality (Smart Select)</option>
                    <option value="audio">Audio Only (MP3)</option>
                    <optgroup label="Specific Video Resolutions">
                      {getUniqueFormats().map(f => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <button className="btn btn-success" style={{ marginTop: '1rem' }} onClick={addToQueue}>
                  <Download size={20} /> Add to Queue
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL - QUEUE & HISTORY */}
        <div className="glass-panel queue-panel">
          <div className="queue-header">
            <h2>Queue & History</h2>
            <button className="btn-text" onClick={clearHistory}>Clear Completed</button>
          </div>
          
          <div className="queue-list">
            {queue.length === 0 ? (
              <div className="empty-queue">No downloads yet. Fetch a video to start!</div>
            ) : (
              queue.map(job => {
                const prog = progressData[job.id];
                return (
                  <div key={job.id} className={`queue-item status-${job.status}`}>
                    <img src={job.thumbnail} alt="" className="queue-thumb" />
                    <div className="queue-details">
                      <div className="queue-title" title={job.title}>{job.title}</div>
                      
                      {job.status === 'queued' && <div className="queue-status"><Clock size={14} /> Queued</div>}
                      {job.status === 'completed' && <div className="queue-status success"><CheckCircle size={14} /> Completed</div>}
                      {job.status === 'error' && <div className="queue-status danger"><XCircle size={14} /> {job.errorMsg || 'Error'}</div>}
                      
                      {job.status === 'downloading' && prog && (
                        <div className="progress-container mini">
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${prog.percent || 0}%` }}></div>
                          </div>
                          <div className="progress-stats">
                            <span>{prog.percent || 0}%</span>
                            <span>{prog.speed}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
