# 🚀 YT2GoFile — YouTube to GoFile Downloader & Cloud Uploader

A modern, high-performance web platform that extracts YouTube videos (in **4K UHD**, **2K QHD**, **1080p Full HD**, **720p HD**, or **320kbps MP3 Audio**) using `yt-dlp` and automatically uploads them to [GoFile](https://gofile.io), instantly generating a shareable download link.

---

## ✨ Key Features

- **⚡ Direct yt-dlp Backend Streaming**: Uses the latest `yt-dlp` and `ffmpeg` engine to extract and merge video + audio streams with zero quality degradation.
- **☁️ Automated GoFile Cloud Uploads**:
  - Automatically queries `https://api.gofile.io/servers` for the fastest available GoFile server.
  - Streams the file directly to GoFile.
  - Generates instant `https://gofile.io/d/XXXXXX` download links with one-click copy.
- **🔑 Flexible Authentication**:
  - **Free Anonymous Uploads**: Ready out of the box with zero credentials needed.
  - **Account Mode**: Enter your optional GoFile API token in Settings to save files straight to your GoFile personal account and target folder.
- **🎨 Modern Cyberpunk / Dark UI**:
  - React 19 + Vite + Tailwind CSS + Lucide Icons.
  - Live progress stepper showing download percentage, download speed (MB/s), ETA, and GoFile upload status.
  - Recent Downloads History saved in browser storage.
- **🧹 Zero Disk Clutter**: Temporary video files on the local server are automatically purged the moment the GoFile upload succeeds.

---

## 🏗️ Project Architecture

```
YT2GoFile/
├── backend/
│   ├── main.py              # FastAPI application & task orchestration
│   ├── downloader.py        # yt-dlp metadata extraction & multi-quality downloader
│   ├── gofile.py            # GoFile server discovery & chunked upload client
│   ├── requirements.txt     # Python backend dependencies
│   └── temp_downloads/      # Temporary processing folder (auto-cleaned)
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Header, VideoCard, Progress, Result, Settings)
│   │   ├── App.tsx          # Main application flow & polling state
│   │   ├── types.ts         # TypeScript definitions
│   │   └── utils.ts         # Formatting helpers (duration, bytes, views)
│   ├── package.json
│   └── vite.config.ts
├── start.bat                # 1-click concurrent launcher for Windows
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
1. **Python 3.10+**: Ensure Python is installed (`python --version`).
2. **Node.js 18+**: Ensure Node is installed (`node --version`).
3. **FFmpeg**: Required by `yt-dlp` to merge 1080p/4K streams (already available on system).

### Running with 1-Click (Windows)
Double click `start.bat` in the project root:
- Starts **FastAPI Backend** on `http://localhost:8000`
- Starts **React Frontend** on `http://localhost:5173`

### Manual Execution

#### 1. Start the Backend
```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```
*API Swagger Documentation is accessible at: `http://localhost:8000/docs`*

#### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check & service status |
| `GET` | `/api/gofile-servers` | Fetches the best active GoFile server |
| `POST` | `/api/info` | Extracts YouTube video metadata & available qualities |
| `POST` | `/api/download` | Starts async download & GoFile upload job |
| `GET` | `/api/status/{task_id}` | Polls real-time progress, speed, ETA, and GoFile link |

---

## 📄 License
MIT License.
