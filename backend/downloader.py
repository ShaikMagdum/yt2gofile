import os
import re
import uuid
import yt_dlp
from typing import Dict, Any, List, Optional, Callable

# Check for cookies.txt in current directory or parent directory
def _find_cookie_file() -> Optional[str]:
    candidates = [
        os.path.join(os.path.dirname(__file__), "cookies.txt"),
        os.path.join(os.path.dirname(__file__), "..", "cookies.txt"),
    ]
    for c in candidates:
        if os.path.exists(c) and os.path.getsize(c) > 0:
            return os.path.abspath(c)
    return None

class YouTubeDownloader:
    @staticmethod
    def _get_base_opts() -> Dict[str, Any]:
        opts: Dict[str, Any] = {
            'quiet': True,
            'no_warnings': True,
            'extractor_args': {
                'youtube': {
                    'player_client': ['web', 'tv', 'android', 'ios']
                }
            }
        }
        cookie_file = _find_cookie_file()
        if cookie_file:
            opts['cookiefile'] = cookie_file
        return opts

    @staticmethod
    def extract_info(url: str) -> Dict[str, Any]:
        """
        Extracts metadata and format options from a YouTube URL without downloading.
        """
        ydl_opts = YouTubeDownloader._get_base_opts()
        ydl_opts.update({
            'skip_download': True,
            'extract_flat': False
        })

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                raise ValueError("Could not extract video information from the provided URL.")

            formats: List[Dict[str, Any]] = info.get('formats', [])
            heights = set()
            for f in formats:
                h = f.get('height')
                if h and isinstance(h, int):
                    heights.add(h)

            available_qualities = []
            for h in sorted(list(heights), reverse=True):
                if h >= 2160:
                    label = f"{h}p (4K UHD)"
                elif h >= 1440:
                    label = f"{h}p (2K QHD)"
                elif h >= 1080:
                    label = f"{h}p (1080p Full HD)"
                elif h >= 720:
                    label = f"{h}p (720p HD)"
                else:
                    label = f"{h}p"
                available_qualities.append({
                    "id": str(h),
                    "label": label,
                    "height": h,
                    "type": "video"
                })

            # Add MP3 Audio Option
            available_qualities.append({
                "id": "mp3",
                "label": "MP3 Audio (High Quality 320kbps)",
                "height": 0,
                "type": "audio"
            })

            return {
                "id": info.get("id"),
                "title": info.get("title") or "YouTube Video",
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration") or 0,
                "uploader": info.get("uploader") or info.get("channel") or "Unknown Channel",
                "channelUrl": info.get("channel_url") or info.get("uploader_url"),
                "viewCount": info.get("view_count") or 0,
                "webpageUrl": info.get("webpage_url") or url,
                "qualities": available_qualities
            }

    @staticmethod
    def download(
        url: str,
        quality: str,
        output_dir: str,
        progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None
    ) -> str:
        """
        Downloads the specified YouTube video/audio to disk with multi-threaded fragment acceleration.
        Returns the local file path.
        """
        os.makedirs(output_dir, exist_ok=True)
        task_id = str(uuid.uuid4())[:8]

        def ydl_hook(d: Dict[str, Any]):
            if progress_callback:
                status = d.get('status')
                if status == 'downloading':
                    total_bytes = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
                    downloaded = d.get('downloaded_bytes') or 0
                    percent = (downloaded / total_bytes * 100) if total_bytes > 0 else 0
                    speed = d.get('speed') or 0
                    eta = d.get('eta') or 0
                    progress_callback({
                        "stage": "downloading",
                        "percent": round(percent, 1),
                        "speed": speed,
                        "eta": eta,
                        "downloaded": downloaded,
                        "total": total_bytes
                    })
                elif status == 'finished':
                    progress_callback({
                        "stage": "processing",
                        "percent": 100.0,
                        "speed": 0,
                        "eta": 0
                    })

        # Base high-performance options (Multi-threaded fragment downloads for 10Mbps-100Mbps+ speeds)
        ydl_opts = YouTubeDownloader._get_base_opts()
        ydl_opts.update({
            'progress_hooks': [ydl_hook],
            'concurrent_fragment_downloads': 16, # Multi-fragment parallel acceleration
            'buffersize': 16 * 1024 * 1024,      # 16MB memory buffer
            'http_chunk_size': 10485760,         # 10MB HTTP chunk size
            'retries': 10,
            'fragment_retries': 10,
            'file_access_retries': 5,
            'windowsfilenames': True,
        })

        out_template = os.path.join(output_dir, f"%(title).80s_{task_id}.%(ext)s")
        ydl_opts['outtmpl'] = out_template

        if quality == 'mp3':
            ydl_opts.update({
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '320',
                }],
            })
        else:
            # Video download with quality cap
            height_limit = quality if quality.isdigit() else '1080'
            format_str = f"bestvideo[height<={height_limit}]+bestaudio/best[height<={height_limit}]/best"
            ydl_opts.update({
                'format': format_str,
                'merge_output_format': 'mp4',
            })

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)

            if quality == 'mp3':
                base, _ = os.path.splitext(filename)
                target_file = f"{base}.mp3"
            else:
                base, _ = os.path.splitext(filename)
                target_file = f"{base}.mp4"
                if not os.path.exists(target_file) and os.path.exists(filename):
                    target_file = filename

            if not os.path.exists(target_file):
                # Search directory for task_id in filename
                candidates = [
                    os.path.join(output_dir, f)
                    for f in os.listdir(output_dir)
                    if task_id in f
                ]
                if candidates:
                    target_file = candidates[0]
                else:
                    raise FileNotFoundError(f"Downloaded file not found for task {task_id}")

            return target_file
