import os
import sys
import uuid
import asyncio
import yt_dlp

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from downloader import YouTubeDownloader
from gofile import GoFileUploader

app = FastAPI(
    title="YouTube to GoFile Turbo API",
    description="High-Speed YouTube Video Downloader with Automated GoFile Uploads & Custom Server Selection",
    version="2.0.0"
)

# Enable CORS for frontend development & local network access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOADS_DIR = os.path.join(os.path.dirname(__file__), "temp_downloads")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# In-memory task tracker
tasks: Dict[str, Dict[str, Any]] = {}

class InfoRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    url: str
    quality: str = "1080"
    gofileServer: Optional[str] = "auto"
    gofileToken: Optional[str] = None
    gofileFolderId: Optional[str] = None

@app.get("/")
def read_root():
    return {
        "service": "YouTube to GoFile Turbo API",
        "status": "online",
        "version": "2.0.0"
    }

@app.get("/api/debug")
def debug_info():
    import subprocess
    import shutil
    deno_path = shutil.which("deno")
    node_path = shutil.which("node")
    ffmpeg_path = shutil.which("ffmpeg")
    return {
        "deno": deno_path,
        "node": node_path,
        "ffmpeg": ffmpeg_path,
        "path": os.environ.get("PATH"),
        "ytdlp_version": yt_dlp.version.__version__
    }

@app.get("/api/gofile-servers")
async def get_gofile_servers():
    """
    Returns list of live GoFile servers and current recommended server.
    """
    return await GoFileUploader.get_servers_data()

@app.post("/api/info")
async def get_video_info(req: InfoRequest):
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="YouTube URL is required")
    try:
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(None, YouTubeDownloader.extract_info, req.url.strip())
        return {"status": "success", "data": info}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def run_download_and_upload(
    task_id: str,
    url: str,
    quality: str,
    server: Optional[str],
    token: Optional[str],
    folder_id: Optional[str]
):
    local_file = None
    try:
        tasks[task_id]["status"] = "processing"
        tasks[task_id]["stage"] = "downloading"
        tasks[task_id]["percent"] = 0.0

        def on_download_progress(p: Dict[str, Any]):
            tasks[task_id]["stage"] = p.get("stage", "downloading")
            dl_percent = p.get("percent", 0.0)
            # Map download phase to 0% - 50%
            tasks[task_id]["percent"] = round(dl_percent * 0.5, 1)
            tasks[task_id]["speed"] = p.get("speed", 0)
            tasks[task_id]["eta"] = p.get("eta", 0)

        # Step 1: Accelerated Multi-threaded Download
        local_file = YouTubeDownloader.download(
            url=url,
            quality=quality,
            output_dir=DOWNLOADS_DIR,
            progress_callback=on_download_progress
        )

        tasks[task_id]["stage"] = "uploading"
        tasks[task_id]["percent"] = 50.0
        tasks[task_id]["localFile"] = os.path.basename(local_file)

        def on_upload_progress(uploaded: int, total: int, speed: float, eta: float):
            tasks[task_id]["stage"] = "uploading"
            up_percent = (uploaded / total * 100) if total > 0 else 0
            # Map upload phase to 50% - 99%
            tasks[task_id]["percent"] = round(50.0 + (up_percent * 0.49), 1)
            tasks[task_id]["speed"] = speed
            tasks[task_id]["eta"] = eta

        # Step 2: High-Speed Upload to Selected / Custom GoFile Server
        gofile_res = GoFileUploader.upload_file_sync(
            file_path=local_file,
            server=server,
            token=token,
            folder_id=folder_id,
            progress_callback=on_upload_progress
        )

        tasks[task_id]["status"] = "completed"
        tasks[task_id]["stage"] = "finished"
        tasks[task_id]["percent"] = 100.0
        tasks[task_id]["speed"] = 0
        tasks[task_id]["eta"] = 0
        tasks[task_id]["result"] = gofile_res

    except Exception as e:
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["error"] = str(e)
    finally:
        # Step 3: Cleanup local file from disk
        if local_file and os.path.exists(local_file):
            try:
                os.remove(local_file)
            except Exception:
                pass

@app.post("/api/download")
async def start_download_task(req: DownloadRequest, background_tasks: BackgroundTasks):
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="YouTube URL is required")

    task_id = str(uuid.uuid4())
    tasks[task_id] = {
        "id": task_id,
        "url": req.url.strip(),
        "quality": req.quality,
        "server": req.gofileServer or "auto",
        "status": "queued",
        "stage": "starting",
        "percent": 0.0,
        "speed": 0,
        "eta": 0,
        "result": None,
        "error": None
    }

    background_tasks.add_task(
        run_download_and_upload,
        task_id=task_id,
        url=req.url.strip(),
        quality=req.quality,
        server=req.gofileServer,
        token=req.gofileToken,
        folder_id=req.gofileFolderId
    )

    return {"status": "ok", "taskId": task_id}

@app.get("/api/status/{task_id}")
async def get_task_status(task_id: str):
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "ok", "task": task}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
