@echo off
setlocal enabledelayedexpansion

:: Check for admin rights
NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Requesting administrator privileges...
    PowerShell -Command "Start-Process -Verb RunAs -FilePath '%~f0'"
    exit /b
)

:: Change to the directory where the batch file is located
cd /d "%~dp0"

echo ========================================
echo    Product Management System
echo    Repository: https://github.com/alaqmarr/node-nextj-neon-products-management.git
echo ========================================
echo.

echo === GitHub Auto-Update Check ===

:: Check if git is available
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Git not found. Skipping update check.
    goto start_app
)

:: Check if this is a git repository
if not exist ".git" (
    echo Not a git repository. Skipping update check.
    goto start_app
)

:: Get current branch
for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set "current_branch=%%i"
if "!current_branch!"=="" set "current_branch=main"

echo Current branch: !current_branch!

:: Fetch updates
echo Fetching latest changes from GitHub...
git fetch origin !current_branch! >nul 2>&1

:: Check for updates
git rev-list --count HEAD..origin/!current_branch! >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('git rev-list --count HEAD..origin/!current_branch!') do set "commit_count=%%i"
    
    if !commit_count! gtr 0 (
        echo.
        echo !!! There are !commit_count! new commit(s) available on GitHub!
        echo.
        choice /c yn /m "Do you want to update now (y/n)"
        if !errorlevel! equ 1 (
            echo Pulling latest changes...
            git pull origin !current_branch!
            if !errorlevel! equ 0 (
                echo [SUCCESS] Successfully updated to latest version!
            ) else (
                echo [ERROR] Failed to pull updates. Continuing with current version.
            )
        ) else (
            echo Continuing with current version...
        )
    ) else (
        echo [OK] Already up to date with GitHub
    )
) else (
    echo [INFO] Could not check for updates. Continuing with current version.
)

:start_app
echo.
echo === Starting Application ===

:: Backend setup
echo.
echo --- Setting up Backend ---
if exist backend (
    cd backend
    echo Current directory: %CD%
    echo Installing backend dependencies...
    call npm install
    if exist prisma (
        echo Running database migrations...
        call npx prisma generate
        call npx prisma db push
    )
    echo Starting backend server...
    start "Backend Server" cmd /k "npm run dev"
    cd ..
) else (
    echo [ERROR] Backend folder not found!
    goto error_handling
)

:: Frontend setup  
echo.
echo --- Setting up Frontend ---
if exist frontend (
    cd frontend
    echo Current directory: %CD%
    echo Installing frontend dependencies...
    call npm install
    echo Starting frontend server...
    start "Frontend Server" cmd /k "npm run dev"
    cd ..
) else (
    echo [ERROR] Frontend folder not found!
    goto error_handling
)

echo.
echo --- Servers Starting ---
echo Waiting for servers to start...
timeout /t 10 /nobreak >nul

:: Open frontend in browser
echo Opening frontend in browser...
start http://localhost:3000

echo.
echo ========================================
echo        SERVERS STARTED SUCCESSFULLY
echo ========================================
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:3000
echo.
echo Both servers are running in separate windows.
echo.
echo Press any key to close this launcher...
echo (Servers will continue running independently)
echo.

pause >nul
exit /b

:error_handling
echo.
echo [ERROR] Failed to start application. Please check the errors above.
echo.
pause