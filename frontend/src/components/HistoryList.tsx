import React, { useState } from 'react';
import type { DownloadHistoryItem } from '../types';
import { formatBytes } from '../utils';
import { History, Copy, Check, ExternalLink, Trash2 } from 'lucide-react';

interface HistoryListProps {
  history: DownloadHistoryItem[];
  onClear: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onClear }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (history.length === 0) return null;

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-white text-sm">Recent Downloads ({history.length})</h3>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-500 hover:text-red-400 transition flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="divide-y divide-slate-800/80">
        {history.map(item => (
          <div key={item.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3 min-w-0">
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-14 h-9 object-cover rounded-lg bg-black flex-shrink-0 border border-slate-800"
                />
              ) : (
                <div className="w-14 h-9 rounded-lg bg-slate-950 flex-shrink-0 border border-slate-800" />
              )}
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-white truncate max-w-sm sm:max-w-md">
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                  <span className="uppercase text-emerald-400 font-mono font-medium">{item.quality}</span>
                  <span>•</span>
                  <span>{formatBytes(item.fileSize)}</span>
                  <span>•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(item.id, item.downloadPage)}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
                title="Copy Link"
              >
                {copiedId === item.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              <a
                href={item.downloadPage}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 transition"
                title="Open GoFile Link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
