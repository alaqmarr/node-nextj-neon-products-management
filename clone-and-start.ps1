#Requires -RunAsAdministrator

$repoUrl = "https://github.com/alaqmarr/node-nextj-neon-products-management.git"
$folderName = "node-nextj-neon-products-management"

Write-Host "=== Cloning Repository ===" -ForegroundColor Green
Write-Host "Repository: $repoUrl" -ForegroundColor Cyan

# Clone the repository
git clone $repoUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Successfully cloned repository" -ForegroundColor Green
    Set-Location $folderName
    
    # Run the main script
    .\start-app.ps1
} else {
    Write-Host "✗ Failed to clone repository" -ForegroundColor Red
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}