import os
import re
import uuid
import base64
import tempfile
import yt_dlp
from typing import Dict, Any, List, Optional, Callable

def _resolve_cookie_file() -> Optional[str]:
    """
    Resolves, extracts, or decodes a valid cookies.txt file for yt-dlp.
    Supports:
    1. YOUTUBE_COOKIES_B64 environment variable (for Render/Cloud hosting)
    2. /etc/secrets/cookies.txt (Render secret file mount)
    3. Local backend/cookies.txt or project root cookies.txt
    4. Auto-extraction from local browser (Firefox)
    """
    # 1. Environment variable base64 encoded
    b64_cookies = os.environ.get("YOUTUBE_COOKIES_B64")
    if b64_cookies and len(b64_cookies.strip()) > 50:
        try:
            target_path = os.path.join(tempfile.gettempdir(), "cookies.txt")
            with open(target_path, "wb") as f:
                f.write(base64.b64decode(b64_cookies.strip()))
            if os.path.exists(target_path) and os.path.getsize(target_path) > 0:
                return target_path
        except Exception:
            pass

    # 2. Render secret file mount
    if os.path.exists("/etc/secrets/cookies.txt"):
        try:
            import shutil
            target_path = os.path.join(tempfile.gettempdir(), "render_cookies.txt")
            shutil.copyfile("/etc/secrets/cookies.txt", target_path)
            if os.path.exists(target_path) and os.path.getsize(target_path) > 0:
                return target_path
        except Exception:
            pass

    # 3. Local disk files
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(backend_dir, "cookies.txt"),
        os.path.join(backend_dir, "..", "cookies.txt"),
    ]
    for c in candidates:
        if os.path.exists(c) and os.path.getsize(c) > 0:
            return os.path.abspath(c)

    # 4. Auto-extract from Firefox on local machine
    try:
        from yt_dlp.cookies import extract_cookies_from_browser
        jar = extract_cookies_from_browser('firefox')
        if jar and len(jar) > 0:
            save_path = os.path.join(backend_dir, "cookies.txt")
            jar.save(save_path, ignore_discard=True, ignore_expires=True)
            return save_path
    except Exception:
        pass

    return None


class YouTubeDownloader:
    @staticmethod
    def _get_base_opts() -> Dict[str, Any]:
        cookie_file = _resolve_cookie_file()
        opts: Dict[str, Any] = {
            'quiet': True,
            'no_warnings': True,
            'nocheckcertificate': True,
            'source_address': '0.0.0.0',
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        }
        if cookie_file:
            opts['cookiefile'] = cookie_file
        else:
            opts['extractor_args'] = {
                'youtube': {
                    'player_client': ['tv', 'android', 'web']
                }
            }
        return opts

    @staticmethod
    def extract_info(url: str) -> Dict[str, Any]:
        """
        Extracts metadata and format options from a YouTube URL without downloading.
        Accurately discovers all available qualities (4K UHD 2160p, 2K 1440p, 1080p, 720p, 480p, 360p, MP3).
        """
        ydl_opts = YouTubeDownloader._get_base_opts()
        ydl_opts.update({
            'skip_download': True,
            'extract_flat': False
        })

        info = None
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
        except Exception as e:
            err_msg = str(e).lower()
            if "not a bot" in err_msg or "sign in" in err_msg:
                # Fallback to alternate player client
                ydl_opts['extractor_args'] = {'youtube': {'player_client': ['tv', 'android', 'web']}}
                with yt_dlp.YoutubeDL(ydl_opts) as ydl_retry:
                    info = ydl_retry.extract_info(url, download=False)
            else:
                raise e

        if not info:
            raise ValueError("Could not extract video information from the provided URL.")

        formats: List[Dict[str, Any]] = info.get('formats', [])
        heights = set()
        for f in formats:
            vcodec = f.get('vcodec') or ''
            h = f.get('height')
            format_note = str(f.get('format_note') or '')
            # Filter out storyboards, audio-only formats, and tiny previews (<360p)
            if vcodec != 'none' and 'storyboard' not in format_note and isinstance(h, int) and h >= 360:
                heights.add(h)

        max_height = max(heights) if heights else 1080
        standard_ladder = [2160, 1440, 1080, 720, 480, 360]
        final_heights = sorted(list({h for h in standard_ladder if h <= max_height} | heights), reverse=True)

        available_qualities = []
        for h in final_heights:
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

        # Add High Quality MP3 Audio Option
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

        # High-performance options (Multi-threaded fragment downloads for 10Mbps-100Mbps+ speeds)
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
            # Video download with quality cap (e.g. 2160p, 1440p, 1080p, 720p)
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
