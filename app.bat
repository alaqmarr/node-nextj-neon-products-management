@echo off

:: Check for admin rights
NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Requesting administrator privileges...
    PowerShell -Command "Start-Process -Verb RunAs -FilePath '%~f0'"
    exit /b
)

:: Change to the directory where the batch file is located
cd /d "%~dp0"

echo === Starting Application ===
echo Script directory: %CD%

:: Backend setup
echo.
echo --- Setting up Backend ---
if exist backend (
    cd backend
    echo Current directory: %CD%
    call npm install
    call npx prisma generate
    call npx prisma db push
    start "Backend" /B npm run dev > ..\backend.log 2>&1
    cd ..
) else (
    echo ERROR: Backend folder not found!
)

:: Frontend setup  
echo.
echo --- Setting up Frontend ---
if exist frontend (
    cd frontend
    echo Current directory: %CD%
    call npm install
    start "Frontend" /B npm run dev > ..\frontend.log 2>&1
    cd ..
) else (
    echo ERROR: Frontend folder not found!
)

echo.
echo --- Servers Starting ---
echo Waiting for servers to start...
timeout /t 5 /nobreak >nul

:: Open frontend in browser
echo Opening frontend in browser...
start http://localhost:3000

echo.
echo --- Servers Started Successfully ---
echo Backend: http://localhost:4000
echo Frontend: http://localhost:3000
echo.
echo Logs: backend.log and frontend.log
echo Press Ctrl+C to exit
echo.

:: Show logs
powershell -Command "Get-Content -Path 'backend.log', 'frontend.log' -Wait"