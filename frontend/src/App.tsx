import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { VideoInfoCard } from './components/VideoInfoCard';
import { TaskProgress } from './components/TaskProgress';
import { ResultCard } from './components/ResultCard';
import { HistoryList } from './components/HistoryList';
import { YoutubeIcon } from './components/YoutubeIcon';
import type { VideoInfo, TaskStatus, DownloadHistoryItem } from './types';
import {
  Search,
  Sparkles,
  AlertCircle,
  Clipboard,
  ShieldCheck,
  Zap,
  HardDrive
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export function App() {
  const [url, setUrl] = useState('');
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [currentTask, setCurrentTask] = useState<TaskStatus | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [gofileToken, setGofileToken] = useState(() => localStorage.getItem('yt2gofile_token') || '');
  const [gofileFolderId, setGofileFolderId] = useState(() => localStorage.getItem('yt2gofile_folder_id') || '');
  const [bestServer, setBestServer] = useState('store3');

  // History
  const [history, setHistory] = useState<DownloadHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('yt2gofile_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Query best server on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/gofile-servers`)
      .then(res => res.json())
      .then(data => {
        if (data.bestServer) setBestServer(data.bestServer);
      })
      .catch(() => {});
  }, []);

  // Poll active task status
  useEffect(() => {
    if (!taskId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/status/${taskId}`);
        if (!res.ok) return;
        const data = await res.json();
        const task: TaskStatus = data.task;
        setCurrentTask(task);

        if (task.status === 'completed' || task.status === 'failed') {
          clearInterval(interval);

          if (task.status === 'completed' && task.result && videoInfo) {
            // Save to history
            const newItem: DownloadHistoryItem = {
              id: task.id,
              title: videoInfo.title,
              thumbnail: videoInfo.thumbnail,
              quality: task.quality,
              downloadPage: task.result.downloadPage,
              fileName: task.result.fileName || 'video.mp4',
              fileSize: task.result.fileSize || 0,
              createdAt: new Date().toISOString()
            };
            setHistory(prev => {
              const updated = [newItem, ...prev.filter(i => i.id !== newItem.id)].slice(0, 20);
              localStorage.setItem('yt2gofile_history', JSON.stringify(updated));
              return updated;
            });
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [taskId, videoInfo]);

  const handleInspectUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setError(null);
    setIsLoadingInfo(true);
    setVideoInfo(null);
    setCurrentTask(null);
    setTaskId(null);

    try {
      const res = await fetch(`${API_BASE}/api/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to inspect YouTube URL');
      }

      setVideoInfo(data.data);
    } catch (err: any) {
      setError(err.message || 'Error connecting to backend service.');
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
      }
    } catch {
      // ignore clipboard error
    }
  };

  const handleStartDownload = async (quality: string) => {
    if (!url.trim()) return;

    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          quality,
          gofileToken: gofileToken || null,
          gofileFolderId: gofileFolderId || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to start download task');
      }

      setTaskId(data.taskId);
      setCurrentTask({
        id: data.taskId,
        url: url.trim(),
        quality,
        status: 'processing',
        stage: 'downloading',
        percent: 0,
        speed: 0,
        eta: 0
      });
    } catch (err: any) {
      setError(err.message || 'Error triggering download.');
    }
  };

  const handleSaveSettings = (newToken: string, newFolderId: string) => {
    setGofileToken(newToken);
    setGofileFolderId(newFolderId);
    localStorage.setItem('yt2gofile_token', newToken);
    localStorage.setItem('yt2gofile_folder_id', newFolderId);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('yt2gofile_history');
  };

  const handleReset = () => {
    setUrl('');
    setVideoInfo(null);
    setCurrentTask(null);
    setTaskId(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        bestServer={bestServer}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasCustomToken={Boolean(gofileToken)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12 space-y-8">
        {/* Hero Title & Description */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>High-Speed yt-dlp + GoFile Cloud Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Download YouTube to <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">GoFile</span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Extract YouTube videos in 4K, 1080p, 720p or 320kbps MP3 audio and automatically generate an instant, permanent GoFile download link.
          </p>
        </div>

        {/* Search / Input Box */}
        <form onSubmit={handleInspectUrl} className="relative group">
          <div className="flex items-center bg-slate-900 border-2 border-slate-800 focus-within:border-emerald-500/80 rounded-2xl shadow-2xl overflow-hidden transition duration-200">
            <div className="pl-4 text-slate-500">
              <YoutubeIcon className="w-6 h-6 text-red-500" />
            </div>

            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Paste YouTube video or Shorts link here..."
              className="flex-1 px-4 py-4 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm md:text-base"
            />

            {/* Quick Paste Button */}
            {!url && (
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
            )}

            {/* Submit / Fetch Button */}
            <button
              type="submit"
              disabled={isLoadingInfo || !url.trim()}
              className="m-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isLoadingInfo ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Inspecting...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Fetch Info</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-3 animate-in fade-in duration-150">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Task Progress Stepper */}
        {currentTask && currentTask.status === 'processing' && (
          <TaskProgress task={currentTask} />
        )}

        {/* Result Card when task completed */}
        {currentTask && currentTask.status === 'completed' && (
          <ResultCard task={currentTask} onReset={handleReset} />
        )}

        {/* Video Preview & Quality Selection (shown when inspected and not downloading/completed) */}
        {videoInfo && (!currentTask || currentTask.status === 'failed') && (
          <VideoInfoCard
            info={videoInfo}
            onStartDownload={handleStartDownload}
            isLoading={Boolean(currentTask && currentTask.status === 'processing')}
          />
        )}

        {/* Feature Badges */}
        {!videoInfo && !currentTask && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-white text-sm">Ultra High Quality</h4>
              <p className="text-xs text-slate-400">Preserves original 4K, 1080p 60fps video and 320kbps crystal clear audio.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <HardDrive className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-white text-sm">Direct GoFile Link</h4>
              <p className="text-xs text-slate-400">Streamed straight to GoFile servers for fast, uncapped download speeds.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-white text-sm">Zero Storage Clutter</h4>
              <p className="text-xs text-slate-400">Temporary server files are automatically purged the second upload completes.</p>
            </div>
          </div>
        )}

        {/* Recent Downloads History */}
        <HistoryList history={history} onClear={handleClearHistory} />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        token={gofileToken}
        folderId={gofileFolderId}
        onSave={handleSaveSettings}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>YT2GoFile — YouTube to GoFile automated downloader. Not affiliated with Google, YouTube, or GoFile.</p>
      </footer>
    </div>
  );
}

export default App;
