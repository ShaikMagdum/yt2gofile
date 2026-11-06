import React from 'react';
import { Cloud, Settings, Server } from 'lucide-react';
import { YoutubeIcon } from './YoutubeIcon';

interface HeaderProps {
  bestServer: string;
  onOpenSettings: () => void;
  hasCustomToken: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  bestServer,
  onOpenSettings,
  hasCustomToken
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 shadow-lg shadow-red-500/20 text-white">
            <YoutubeIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-lg text-white">
              <span>YT</span>
              <span className="text-red-500">2</span>
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">GoFile</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">YouTube to GoFile Cloud Streamer</p>
          </div>
        </div>

        {/* Server & Settings Actions */}
        <div className="flex items-center gap-3">
          {/* Active Server Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>GoFile Server:</span>
            <span className="font-mono text-emerald-400 font-medium">{bestServer || 'Auto'}</span>
          </div>

          {/* Account Mode Indicator */}
          {hasCustomToken && (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium">
              <Cloud className="w-3 h-3" />
              <span>Account Mode</span>
            </span>
          )}

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition shadow-sm flex items-center gap-1.5 text-xs font-medium"
            title="Configure GoFile Token & Settings"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
