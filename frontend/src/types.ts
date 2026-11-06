export interface VideoQuality {
  id: string;
  label: string;
  height: number;
  type: 'video' | 'audio';
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  channelUrl?: string;
  viewCount: number;
  webpageUrl: string;
  qualities: VideoQuality[];
}

export interface TaskStatus {
  id: string;
  url: string;
  quality: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  stage: 'starting' | 'downloading' | 'processing' | 'uploading' | 'finished';
  percent: number;
  speed: number;
  eta: number;
  result?: {
    status: string;
    server: string;
    downloadPage: string;
    code: string;
    fileId?: string;
    fileName?: string;
    fileSize?: number;
    md5?: string;
    parentFolder?: string;
  };
  error?: string;
}

export interface DownloadHistoryItem {
  id: string;
  title: string;
  thumbnail: string;
  quality: string;
  downloadPage: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}
