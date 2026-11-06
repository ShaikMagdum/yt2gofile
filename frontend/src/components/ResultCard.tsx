import React, { useState } from 'react';
import type { TaskStatus } from '../types';
import { formatBytes } from '../utils';
import {
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  FileCheck,
  Server,
  Share2
} from 'lucide-react';

interface ResultCardProps {
  task: TaskStatus;
  onReset: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ task, onReset }) => {
  const [copied, setCopied] = useState(false);
  const result = task.result;

  if (!result) return null;

  const downloadUrl = result.downloadPage;

  const handleCopy = () => {
    navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Success Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Upload Successful!</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-medium">
                GoFile Ready
              </span>
            </h3>
            <p className="text-xs text-slate-400">Your YouTube video is now permanently stored on GoFile.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-medium flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Download</span>
        </button>
      </div>

      {/* Main Download Link Box */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>GoFile Shareable Download Link</span>
        </label>

        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono text-sm sm:text-base font-semibold truncate select-all">
            {downloadUrl}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className={`px-4 py-3 rounded-xl font-medium transition flex items-center gap-1.5 flex-shrink-0 shadow-lg ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-semibold">Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <span>Open in GoFile</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* File Metadata Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs">
        {/* File Name */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
            <FileCheck className="w-3 h-3 text-slate-400" />
            <span>File Name</span>
          </div>
          <p className="text-slate-200 font-mono truncate font-medium" title={result.fileName}>
            {result.fileName || 'video.mp4'}
          </p>
        </div>

        {/* File Size */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">File Size</div>
          <p className="text-slate-200 font-mono font-medium">
            {result.fileSize ? formatBytes(result.fileSize) : 'N/A'}
          </p>
        </div>

        {/* GoFile Server */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
            <Server className="w-3 h-3 text-slate-400" />
            <span>Server</span>
          </div>
          <p className="text-emerald-400 font-mono font-medium">
            {result.server || 'store3'}
          </p>
        </div>

        {/* Code */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Download Code</div>
          <p className="text-slate-200 font-mono font-medium">
            {result.code || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};
