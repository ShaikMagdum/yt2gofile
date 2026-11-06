import React, { useState } from 'react';
import type { VideoInfo } from '../types';
import { formatDuration, formatViews } from '../utils';
import { Film, Music, Check, ArrowRight, Eye, User, Sparkles } from 'lucide-react';

interface VideoInfoCardProps {
  info: VideoInfo;
  onStartDownload: (quality: string) => void;
  isLoading: boolean;
}

export const VideoInfoCard: React.FC<VideoInfoCardProps> = ({
  info,
  onStartDownload,
  isLoading
}) => {
  // Default to 1080p if available, else first quality
  const defaultQuality = info.qualities.find(q => q.id === '1080')?.id || info.qualities[0]?.id || 'best';
  const [selectedQuality, setSelectedQuality] = useState<string>(defaultQuality);

  const videoQualities = info.qualities.filter(q => q.type === 'video');
  const audioQualities = info.qualities.filter(q => q.type === 'audio');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Video Thumbnail */}
        <div className="relative flex-shrink-0 w-full md:w-80 aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 group shadow-lg">
          <img
            src={info.thumbnail}
            alt={info.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          {info.duration > 0 && (
            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-xs font-mono font-semibold text-white border border-white/10 shadow">
              {formatDuration(info.duration)}
            </div>
          )}
        </div>

        {/* Video Details */}
        <div className="flex-1 space-y-3 min-w-0">
          <h2 className="text-lg md:text-xl font-bold text-white line-clamp-2 leading-snug">
            {info.title}
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <User className="w-3.5 h-3.5 text-red-500" />
              {info.channelUrl ? (
                <a
                  href={info.channelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-red-400 hover:underline transition truncate max-w-[200px]"
                >
                  {info.uploader}
                </a>
              ) : (
                <span className="truncate max-w-[200px]">{info.uploader}</span>
              )}
            </div>

            {info.viewCount > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>{formatViews(info.viewCount)}</span>
              </div>
            )}
          </div>

          <div className="pt-2 text-xs text-slate-400">
            Select your preferred resolution or audio format below. The video will be downloaded in full quality and directly uploaded to GoFile.
          </div>
        </div>
      </div>

      {/* Format & Quality Selector */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        {/* Video Qualities */}
        {videoQualities.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-blue-400" />
              <span>Video Formats (MP4)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {videoQualities.map(q => {
                const isSelected = selectedQuality === q.id;
                const isHighRes = q.height >= 1080;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSelectedQuality(q.id)}
                    className={`relative px-3.5 py-3 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/20 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-1.5">
                        <span>{q.label}</span>
                        {isHighRes && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 uppercase">
                            HD
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">Video + Audio</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Audio Qualities */}
        {audioQualities.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-purple-400" />
              <span>Audio Only</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {audioQualities.map(q => {
                const isSelected = selectedQuality === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSelectedQuality(q.id)}
                    className={`relative px-3.5 py-3 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-600/15 border-purple-500 ring-2 ring-purple-500/20 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-1.5">
                        <span>{q.label}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 uppercase">
                          MP3
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">Extracted 320kbps MP3</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="pt-2">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onStartDownload(selectedQuality)}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-emerald-600 hover:from-red-500 hover:to-emerald-500 text-white font-semibold shadow-xl shadow-red-600/20 transition duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition duration-200" />
          <span>Download & Upload to GoFile</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition duration-200" />
        </button>
      </div>
    </div>
  );
};
