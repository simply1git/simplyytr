@echo off
echo ========================================================
echo    SIMPLYYTR - 100%% BYPASS GOOGLE AUTHENTICATION
echo ========================================================
echo Opening genuine Google Chrome with uploader session profile...
echo.
echo 1. Please log in to your Google / YouTube Studio account.
echo 2. Once you see your YouTube Studio dashboard, close Chrome.
echo.

set "PROFILE_DIR=%~dp0apps\uploader-agent\storage\chrome_profile"

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="%PROFILE_DIR%" "https://studio.youtube.com"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --user-data-dir="%PROFILE_DIR%" "https://studio.youtube.com"
) else (
    echo Could not find Chrome in default locations.
    pause
)
