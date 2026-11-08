import React, { useState } from 'react';
import { X, Key, Folder, ExternalLink, ShieldCheck, Check, Server, Plus, Trash2, Globe } from 'lucide-react';
import type { GoFileServerItem } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  folderId: string;
  selectedServer: string;
  availableServers: GoFileServerItem[];
  customServers: string[];
  backendUrl?: string;
  onSave: (token: string, folderId: string, server: string, customServers: string[], backendUrl: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  token,
  folderId,
  selectedServer,
  availableServers,
  customServers: initialCustomServers,
  backendUrl: initialBackendUrl = '',
  onSave
}) => {
  const [currentToken, setCurrentToken] = useState(token);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [currentServer, setCurrentServer] = useState(selectedServer || 'auto');
  const [currentBackendUrl, setCurrentBackendUrl] = useState(initialBackendUrl);
  const [customServers, setCustomServers] = useState<string[]>(initialCustomServers || []);
  const [newServerInput, setNewServerInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [adderError, setAdderError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddCustomServer = (e: React.MouseEvent) => {
    e.preventDefault();
    setAdderError(null);
    let s = newServerInput.trim().toLowerCase();
    s = s.replace(/^https?:\/\//, '').replace(/\.gofile\.io.*$/, '').trim();

    if (!s) {
      setAdderError('Please enter a server name (e.g. store-eu-par-6 or store10)');
      return;
    }

    if (!customServers.includes(s)) {
      const updated = [...customServers, s];
      setCustomServers(updated);
      setCurrentServer(s);
      setNewServerInput('');
    } else {
      setCurrentServer(s);
      setNewServerInput('');
    }
  };

  const handleRemoveCustomServer = (serverName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customServers.filter(s => s !== serverName);
    setCustomServers(updated);
    if (currentServer === serverName) {
      setCurrentServer('auto');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      currentToken.trim(),
      currentFolderId.trim(),
      currentServer.trim(),
      customServers,
      currentBackendUrl.trim()
    );
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white">GoFile & Performance Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 text-sm overflow-y-auto">
          {/* Target Server Selection */}
          <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>GoFile Target Server</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Active: <span className="text-white font-mono font-medium">{currentServer}</span>
              </span>
            </div>

            {/* Dropdown Selector */}
            <select
              value={currentServer}
              onChange={e => setCurrentServer(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition text-sm font-mono cursor-pointer"
            >
              <option value="auto">⚡ Auto (Automatic Best Server)</option>
              {availableServers.length > 0 && (
                <optgroup label="Live GoFile Storage Clusters">
                  {availableServers.map(s => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({s.zone.toUpperCase()} Zone)
                    </option>
                  ))}
                </optgroup>
              )}
              {customServers.length > 0 && (
                <optgroup label="Custom Added Servers">
                  {customServers.map(s => (
                    <option key={s} value={s}>
                      ⭐ {s} (Custom)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {/* Manual Custom Server Adder */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-xs text-slate-400 mb-2 font-medium">Add Custom GoFile Server Manually:</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newServerInput}
                  onChange={e => {
                    setNewServerInput(e.target.value);
                    if (adderError) setAdderError(null);
                  }}
                  placeholder="e.g. store-eu-par-6 or store11"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddCustomServer}
                  className="px-3 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-1 transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Server</span>
                </button>
              </div>
              {adderError && (
                <div className="text-[11px] text-rose-400 mt-1">{adderError}</div>
              )}

              {/* List of Custom Added Servers */}
              {customServers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {customServers.map(s => (
                    <span
                      key={s}
                      onClick={() => setCurrentServer(s)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono cursor-pointer transition ${
                        currentServer === s
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:bg-slate-800'
                      }`}
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={e => handleRemoveCustomServer(s, e)}
                        className="text-slate-400 hover:text-rose-400 ml-1 p-0.5 rounded transition"
                        title="Remove custom server"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Backend API URL Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>Backend API URL</span>
            </label>
            <input
              type="text"
              value={currentBackendUrl}
              onChange={e => setCurrentBackendUrl(e.target.value)}
              placeholder="e.g. https://yt2gofile-backend.onrender.com or empty for automatic"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition text-sm font-mono"
            />
            <p className="text-[11px] text-slate-400">
              Leave blank to use automatic Cloudflare Pages Functions proxy or local server.
            </p>
          </div>

          {/* Token Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <span>GoFile API Token (Optional)</span>
            </label>
            <input
              type="password"
              value={currentToken}
              onChange={e => setCurrentToken(e.target.value)}
              placeholder="e.g. your_gofile_api_token_here"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition text-sm font-mono"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>Leave blank for anonymous guest uploads.</span>
              <a
                href="https://gofile.io/myProfile"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-0.5 font-medium"
              >
                <span>Get Token</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Folder ID Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Folder ID (Optional)</span>
            </label>
            <input
              type="text"
              value={currentFolderId}
              onChange={e => setCurrentFolderId(e.target.value)}
              placeholder="e.g. abcdef12-3456-7890"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition text-sm font-mono"
            />
            <p className="text-[11px] text-slate-400">
              Files will be saved in your root account folder if left blank.
            </p>
          </div>

          {/* Speed & Storage Info Note */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Turbo Speed & Multi-Thread Acceleration</span>
            </div>
            <p>
              YouTube downloads stream with 16 parallel fragment threads (10Mbps - 100Mbps+). GoFile uploads stream directly with high-throughput chunks to your chosen server.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
