import os
import uuid
import asyncio
import shutil
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from downloader import YouTubeDownloader
from gofile import GoFileUploader

app = FastAPI(
    title="YouTube to GoFile Downloader API",
    description="High-Speed YouTube Video Downloader with Automated GoFile Uploads",
    version="1.0.0"
)

# Enable CORS for frontend Vite development & production
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
    gofileToken: Optional[str] = None
    gofileFolderId: Optional[str] = None

@app.get("/")
def read_root():
    return {
        "service": "YouTube to GoFile Downloader",
        "status": "online",
        "version": "1.0.0"
    }

@app.get("/api/gofile-servers")
async def get_gofile_servers():
    server = await GoFileUploader.get_best_server()
    return {"status": "ok", "bestServer": server}

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

def run_download_and_upload(task_id: str, url: str, quality: str, token: Optional[str], folder_id: Optional[str]):
    local_file = None
    try:
        tasks[task_id]["status"] = "processing"
        tasks[task_id]["stage"] = "downloading"
        tasks[task_id]["percent"] = 0.0

        def on_download_progress(p: Dict[str, Any]):
            tasks[task_id]["stage"] = p.get("stage", "downloading")
            tasks[task_id]["percent"] = p.get("percent", 0.0)
            tasks[task_id]["speed"] = p.get("speed", 0)
            tasks[task_id]["eta"] = p.get("eta", 0)

        # Step 1: Download with yt-dlp
        local_file = YouTubeDownloader.download(
            url=url,
            quality=quality,
            output_dir=DOWNLOADS_DIR,
            progress_callback=on_download_progress
        )

        tasks[task_id]["stage"] = "uploading"
        tasks[task_id]["percent"] = 50.0
        tasks[task_id]["localFile"] = os.path.basename(local_file)

        # Step 2: Upload to GoFile
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        gofile_res = loop.run_until_complete(
            GoFileUploader.upload_file(
                file_path=local_file,
                token=token,
                folder_id=folder_id
            )
        )
        loop.close()

        tasks[task_id]["status"] = "completed"
        tasks[task_id]["stage"] = "finished"
        tasks[task_id]["percent"] = 100.0
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
