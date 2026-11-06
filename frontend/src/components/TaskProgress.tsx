import React from 'react';
import type { TaskStatus } from '../types';
import { formatBytes } from '../utils';
import { Download, CloudUpload, Loader2, CheckCircle2, Clock, Zap } from 'lucide-react';

interface TaskProgressProps {
  task: TaskStatus;
}

export const TaskProgress: React.FC<TaskProgressProps> = ({ task }) => {
  const isDownloading = task.stage === 'downloading' || task.stage === 'processing';
  const isUploading = task.stage === 'uploading';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
          <h3 className="font-semibold text-white text-base">Processing YouTube Video</h3>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
          {task.stage === 'uploading' ? 'GoFile Uploading' : 'Downloading'}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>
            {isDownloading && 'Downloading video from YouTube...'}
            {isUploading && 'Uploading directly to GoFile cloud server...'}
          </span>
          <span className="font-mono text-emerald-400 font-bold">
            {task.percent > 0 ? `${task.percent.toFixed(1)}%` : 'Initializing...'}
          </span>
        </div>

        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-300 ease-out shadow-lg"
            style={{ width: `${Math.max(5, Math.min(100, task.percent))}%` }}
          />
        </div>
      </div>

      {/* Stats Indicators */}
      {isDownloading && (task.speed > 0 || task.eta > 0) && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          {task.speed > 0 && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Speed</span>
                <span className="font-mono text-xs text-slate-200 font-semibold">{formatBytes(task.speed)}/s</span>
              </div>
            </div>
          )}

          {task.eta > 0 && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">ETA</span>
                <span className="font-mono text-xs text-slate-200 font-semibold">{task.eta}s remaining</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step Indicators */}
      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-4 text-xs">
        {/* Step 1: Download */}
        <div className={`flex items-center gap-2 ${isDownloading ? 'text-blue-400 font-medium' : isUploading ? 'text-slate-400' : 'text-slate-500'}`}>
          {isUploading ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
          )}
          <span>1. YouTube Extraction</span>
        </div>

        {/* Step 2: Upload */}
        <div className={`flex items-center gap-2 ${isUploading ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
          <CloudUpload className={`w-4 h-4 ${isUploading ? 'animate-pulse' : ''}`} />
          <span>2. GoFile Cloud Upload</span>
        </div>
      </div>
    </div>
  );
};
