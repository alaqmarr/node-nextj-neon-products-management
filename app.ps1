#Requires -RunAsAdministrator

# Get the directory where this script is located
$scriptPath = $MyInvocation.MyCommand.Path
$scriptDir = Split-Path -Parent $scriptPath

Write-Host "=== Starting Application ===" -ForegroundColor Green
Write-Host "Script directory: $scriptDir" -ForegroundColor Gray

# Change to the script directory first
Set-Location $scriptDir

try {
    # Backend Setup
    Write-Host "`n--- Setting up Backend ---" -ForegroundColor Yellow
    
    if (Test-Path "backend") {
        Set-Location "backend"
        Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
        
        npm install
        npx prisma generate
        npx prisma db push
        
        Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev" -RedirectStandardOutput "$scriptDir\backend.log" -RedirectStandardError "$scriptDir\backend.log"
        
        Set-Location $scriptDir
    } else {
        Write-Host "ERROR: Backend folder not found!" -ForegroundColor Red
    }

    # Frontend Setup  
    Write-Host "`n--- Setting up Frontend ---" -ForegroundColor Yellow
    
    if (Test-Path "frontend") {
        Set-Location "frontend"
        Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
        
        npm install
        Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev" -RedirectStandardOutput "$scriptDir\frontend.log" -RedirectStandardError "$scriptDir\frontend.log"
        
        Set-Location $scriptDir
    } else {
        Write-Host "ERROR: Frontend folder not found!" -ForegroundColor Red
    }

    Write-Host "`n--- Servers Starting ---" -ForegroundColor Green
    Write-Host "Waiting for servers to start..." -ForegroundColor Yellow

    # Wait a moment for servers to start
    Start-Sleep -Seconds 5

    # Open frontend in browser
    Write-Host "Opening frontend in browser..." -ForegroundColor Cyan
    Start-Process "http://localhost:3000"

    Write-Host "`n--- Servers Started Successfully ---" -ForegroundColor Green
    Write-Host "Backend: http://localhost:4000" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "`nLogs are being written to backend.log and frontend.log" -ForegroundColor White
    Write-Host "Press Ctrl+C to exit" -ForegroundColor Yellow

    # Show logs
    Get-Content -Path "backend.log", "frontend.log" -Wait

} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    pause
}