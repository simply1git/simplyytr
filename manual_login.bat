@echo off
echo ====================================================================
echo YOUTUBBOT - MANUAL LOGIN BYPASS
echo ====================================================================
echo.
echo Launching the bot's dedicated Chrome profile...
echo.
echo Please log into your YouTube account in the Chrome window that opens.
echo Once you have fully logged in and reached the YouTube Studio dashboard,
echo you can safely close the Chrome window and press any key to exit this script.
echo.

"C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="%~dp0apps\backend\storage\chrome_profile" "https://studio.youtube.com"

pause
