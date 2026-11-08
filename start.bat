@echo off
title YT2GoFile - YouTube to GoFile Turbo
echo ============================================================
echo           YT2GoFile - High Speed YouTube to GoFile
echo ============================================================
echo.

echo Starting Python FastAPI Backend on http://localhost:8000...
start "YT2GoFile Backend" cmd /k "cd /d %~dp0backend && python main.py"

timeout /t 2 /nobreak >nul

echo Starting React Vite Frontend on http://localhost:5173...
start "YT2GoFile Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo Launching YT2GoFile in your default browser...
start http://localhost:5173

echo.
echo ============================================================
echo   Services are running!
echo   Frontend UI: http://localhost:5173
echo   Backend API: http://localhost:8000
echo ============================================================
echo.
