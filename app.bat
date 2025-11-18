@echo off
setlocal enabledelayedexpansion

title Application Launcher - DO NOT CLOSE

echo ========================================
echo    Product Management System Launcher
echo ========================================
echo.

:: Check for admin rights
echo [1/8] Checking administrator privileges...
NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Need administrator rights. Requesting elevation...
    PowerShell -Command "Start-Process -Verb RunAs -FilePath '%~f0'"
    goto never_exit
)

:: Force stay in current directory
cd /d "%~dp0"
echo [2/8] Current directory: %CD%
echo.

:: Check folder structure
echo [3/8] Checking project structure...
if not exist "backend" (
    echo [ERROR] Backend folder not found!
    echo [INFO] Please place this file in project root with backend/ and frontend/ folders
    goto never_exit
)

if not exist "frontend" (
    echo [ERROR] Frontend folder not found!
    goto never_exit
)

echo [SUCCESS] Project structure OK
echo.

:: Git check - wrapped in error handling
echo [4/8] Checking for updates...
2>nul (
  git --version >nul && (
    if exist ".git" (
        echo [INFO] Checking Git repository...
        for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set "branch=%%i"
        if "!branch!"=="" set "branch=main"
        echo [INFO] Branch: !branch!
        
        git fetch origin !branch! >nul 2>&1
        git rev-list --count HEAD..origin/!branch! >nul 2>&1
        if !errorlevel! equ 0 (
            for /f "tokens=*" %%j in ('git rev-list --count HEAD..origin/!branch!') do set "commits=%%j"
            if !commits! gtr 0 (
                echo.
                echo [UPDATE] !commits! new commits available!
                choice /c yn /m "Update now (y/n)?"
                if !errorlevel! equ 1 (
                    echo [INFO] Updating...
                    git pull origin !branch!
                    echo [SUCCESS] Updated!
                )
            ) else (
                echo [INFO] Already up to date
            )
        )
    )
  )
)

echo.
echo [5/8] Starting Backend...
cd backend
echo [INFO] Backend dir: %CD%

:: Start backend with error handling
echo [INFO] Installing dependencies...
cmd /c "npm install" >nul 2>&1
if exist "prisma" (
    echo [INFO] Setting up database...
    cmd /c "npx prisma generate" >nul 2>&1
    cmd /c "npx prisma db push" >nul 2>&1
)

echo [INFO] Starting backend server...
start "BACKEND SERVER" /B cmd /k "cd /d "%CD%" && echo === BACKEND SERVER === && echo Directory: %CD% && npm run dev"
cd ..

echo.
echo [6/8] Starting Frontend...
cd frontend
echo [INFO] Frontend dir: %CD%

:: Start frontend with error handling
echo [INFO] Installing dependencies...
cmd /c "npm install" >nul 2>&1

echo [INFO] Starting frontend server...
start "FRONTEND SERVER" /B cmd /k "cd /d "%CD%" && echo === FRONTEND SERVER === && echo Directory: %CD% && npm run dev"
cd ..

echo.
echo [7/8] Finalizing...
timeout /t 5 /nobreak >nul

echo [INFO] Opening browser...
start "" "http://localhost:3000" >nul 2>&1

echo.
echo ========================================
echo          LAUNCH COMPLETE
echo ========================================
echo [SUCCESS] Backend:  http://localhost:4000
echo [SUCCESS] Frontend: http://localhost:3000
echo.
echo [INFO] Two new windows should have opened for:
echo        - Backend Server
echo        - Frontend Server
echo.
echo [INFO] If no windows opened, check:
echo        - Node.js is installed
echo        - No port conflicts
echo        - Check manual_start.bat
echo.

:never_exit
echo ========================================
echo [INFO] This window will stay open.
echo [INFO] Press CTRL+C to close manually.
echo ========================================

:: Infinite loop to prevent closing
:infinite_loop
timeout /t 9999 >nul
goto infinite_loop