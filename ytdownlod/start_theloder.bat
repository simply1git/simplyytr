@echo off
title THELODER Launcher

cd /d "%~dp0"

start /B cmd /c "cd backend && npm run dev >nul 2>&1"
start /B cmd /c "cd frontend && npm run dev >nul 2>&1"

timeout /t 3 >nul

start http://localhost:5173
