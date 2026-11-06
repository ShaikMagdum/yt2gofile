import React, { useState } from 'react';
import { X, Key, Folder, ExternalLink, ShieldCheck, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  folderId: string;
  onSave: (token: string, folderId: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  token,
  folderId,
  onSave
}) => {
  const [currentToken, setCurrentToken] = useState(token);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(currentToken.trim(), currentFolderId.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white">GoFile Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-sm">
          {/* Token Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              GoFile API Token (Optional)
            </label>
            <input
              type="password"
              value={currentToken}
              onChange={e => setCurrentToken(e.target.value)}
              placeholder="e.g. your_gofile_api_token_here"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition text-sm font-mono"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>Leave blank for free anonymous guest uploads.</span>
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
              Files will be saved in your root folder if left blank.
            </p>
          </div>

          {/* Note Box */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Client-Side Storage</span>
            </div>
            <p>Your GoFile token is stored securely in your browser's local storage and only sent directly to the GoFile API.</p>
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5"
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
