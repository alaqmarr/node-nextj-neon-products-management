@echo off

:: Check for admin rights
NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Requesting administrator privileges...
    PowerShell -Command "Start-Process -Verb RunAs -FilePath '%~f0'"
    exit /b
)

echo ========================================
echo    CLONING PRODUCT MANAGEMENT SYSTEM
echo ========================================
echo.

set "repo_url=https://github.com/alaqmarr/node-nextj-neon-products-management.git"
set "folder_name=node-nextj-neon-products-management"

echo Repository: %repo_url%
echo.

:: Check if folder already exists
if exist "%folder_name%" (
    echo Folder already exists. Switching to it...
    cd /d "%folder_name%"
    echo.
    call start-app.bat
    exit /b
)

:: Clone the repository
echo Cloning repository...
git clone %repo_url%

if %errorlevel% equ 0 (
    echo [SUCCESS] Repository cloned successfully!
    cd /d "%folder_name%"
    echo.
    call start-app.bat
) else (
    echo [ERROR] Failed to clone repository
    echo.
    pause
)