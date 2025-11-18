#Requires -RunAsAdministrator

# Get the directory where this script is located
$scriptPath = $MyInvocation.MyCommand.Path
$scriptDir = Split-Path -Parent $scriptPath

function CheckGitUpdates {
    Write-Host "`n--- Checking for GitHub Updates ---" -ForegroundColor Magenta
    
    # Check if this is a git repository
    if (-not (Test-Path ".git")) {
        Write-Host "Not a git repository. Skipping update check." -ForegroundColor Yellow
        return $false
    }

    try {
        # Check if git is available
        $gitCheck = git --version 2>$null
        if (-not $gitCheck) {
            Write-Host "Git is not installed or not in PATH. Skipping update check." -ForegroundColor Yellow
            return $false
        }

        # Get current branch
        $currentBranch = git branch --show-current
        if (-not $currentBranch) {
            $currentBranch = "main"
        }
        Write-Host "Current branch: $currentBranch" -ForegroundColor Gray

        # Fetch latest changes from remote
        Write-Host "Fetching latest changes from GitHub..." -ForegroundColor Cyan
        git fetch origin $currentBranch 2>$null

        # Check if we're behind remote
        $localCommit = git rev-parse HEAD
        $remoteCommit = git rev-parse "origin/$currentBranch" 2>$null

        if ($LASTEXITCODE -ne 0) {
            Write-Host "Could not check remote status. Continuing with local version." -ForegroundColor Yellow
            return $false
        }

        if ($localCommit -eq $remoteCommit) {
            Write-Host "✓ Already up to date with GitHub" -ForegroundColor Green
            return $false
        } else {
            Write-Host "! New updates available on GitHub!" -ForegroundColor Yellow
            
            # Show what's changed
            $commitCount = git rev-list --count "HEAD..origin/$currentBranch"
            Write-Host "There are $commitCount new commit(s)" -ForegroundColor Cyan
            
            # Ask user if they want to update
            do {
                $response = Read-Host "Do you want to update now? (y/n)"
            } while ($response -notmatch '^[yn]$')
            
            if ($response -eq 'y') {
                Write-Host "Pulling latest changes..." -ForegroundColor Green
                $pullResult = git pull origin $currentBranch 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✓ Successfully updated to latest version!" -ForegroundColor Green
                    
                    # Show latest commit message
                    $latestCommit = git log -1 --pretty=format:"%s"
                    Write-Host "Latest commit: $latestCommit" -ForegroundColor Gray
                    return $true
                } else {
                    Write-Host "✗ Failed to pull updates: $pullResult" -ForegroundColor Red
                    Write-Host "Continuing with current version..." -ForegroundColor Yellow
                    return $false
                }
            } else {
                Write-Host "Continuing with current version..." -ForegroundColor Yellow
                return $false
            }
        }
    }
    catch {
        Write-Host "Error checking for updates: $_. Continuing with current version." -ForegroundColor Red
        return $false
    }
}

function StartApplication {
    Write-Host "`n=== Starting Application ===" -ForegroundColor Green

    # Change to the script directory first
    Set-Location $scriptDir

    # Backend Setup
    Write-Host "`n--- Setting up Backend ---" -ForegroundColor Yellow
    
    if (Test-Path "backend") {
        Set-Location "backend"
        Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
        
        Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
        npm install
        
        if (Test-Path "prisma") {
            Write-Host "Running database migrations..." -ForegroundColor Cyan
            npx prisma generate
            npx prisma db push
        }
        
        Write-Host "Starting backend server..." -ForegroundColor Cyan
        $backendProcess = Start-Process -PassThru -FilePath "npm" -ArgumentList "run", "dev" -RedirectStandardOutput "$scriptDir\backend.log" -RedirectStandardError "$scriptDir\backend.log"
        
        Set-Location $scriptDir
    } else {
        Write-Host "ERROR: Backend folder not found!" -ForegroundColor Red
        return
    }

    # Frontend Setup  
    Write-Host "`n--- Setting up Frontend ---" -ForegroundColor Yellow
    
    if (Test-Path "frontend") {
        Set-Location "frontend"
        Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
        
        Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
        npm install
        
        Write-Host "Starting frontend server..." -ForegroundColor Cyan
        $frontendProcess = Start-Process -PassThru -FilePath "npm" -ArgumentList "run", "dev" -RedirectStandardOutput "$scriptDir\frontend.log" -RedirectStandardError "$scriptDir\frontend.log"
        
        Set-Location $scriptDir
    } else {
        Write-Host "ERROR: Frontend folder not found!" -ForegroundColor Red
        return
    }

    Write-Host "`n--- Servers Starting ---" -ForegroundColor Green
    Write-Host "Waiting for servers to start..." -ForegroundColor Yellow

    # Wait for servers to start
    Start-Sleep -Seconds 8

    # Open frontend in browser
    Write-Host "Opening frontend in browser..." -ForegroundColor Cyan
    Start-Process "http://localhost:3000"

    Write-Host "`n--- Servers Started Successfully ---" -ForegroundColor Green
    Write-Host "Backend: http://localhost:4000" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "`nLogs are being written to:" -ForegroundColor White
    Write-Host "- $scriptDir\backend.log" -ForegroundColor White
    Write-Host "- $scriptDir\frontend.log" -ForegroundColor White
    Write-Host "`nPress Ctrl+C to stop monitoring (servers will keep running)" -ForegroundColor Yellow

    # Show logs and keep the script alive
    try {
        Get-Content -Path "$scriptDir\backend.log", "$scriptDir\frontend.log" -Wait
    }
    catch [System.Management.Automation.PipelineStoppedException] {
        # This is expected when user presses Ctrl+C
        Write-Host "`nStopped monitoring. Servers are still running." -ForegroundColor Yellow
        Write-Host "Backend PID: $($backendProcess.Id)" -ForegroundColor Gray
        Write-Host "Frontend PID: $($frontendProcess.Id)" -ForegroundColor Gray
    }
}

# Main execution
try {
    # Check for updates first
    Write-Host "Repository: https://github.com/alaqmarr/node-nextj-neon-products-management.git" -ForegroundColor Cyan
    $wasUpdated = CheckGitUpdates
    
    # If updated, we might need to reinstall dependencies
    if ($wasUpdated) {
        Write-Host "`nUpdates were installed. Application will now start with latest version..." -ForegroundColor Green
    }
    
    # Start the application
    StartApplication
    
    # Keep the window open
    Write-Host "`nPress any key to close this window (servers will keep running)..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}