@echo off
echo Stopping THELODER Backend (Port 3001)...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :3001') DO (
    taskkill /F /PID %%T >nul 2>&1
)

echo Stopping THELODER Frontend (Port 5173)...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :5173') DO (
    taskkill /F /PID %%T >nul 2>&1
)

echo THELODER successfully stopped!
timeout /t 2 >nul
