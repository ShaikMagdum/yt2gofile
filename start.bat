@echo off
title YT2GoFile - YouTube to GoFile Downloader
echo ============================================================
echo           YT2GoFile - High Speed YouTube to GoFile
echo ============================================================
echo.

echo Starting Python FastAPI Backend on http://localhost:8000...
start "YT2GoFile Backend" cmd /k "cd /d %~dp0backend && python main.py"

timeout /t 2 /nobreak >nul

echo Starting React Vite Frontend on http://localhost:5173...
start "YT2GoFile Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================================
echo   Services are running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000 (API Docs: http://localhost:8000/docs)
echo ============================================================
echo.
