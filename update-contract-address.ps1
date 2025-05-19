# Update Contract Address Script
param(
    [Parameter(Mandatory=$true)]
    [string]$ContractAddress
)

Write-Host "Updating Contract Address in app.js" -ForegroundColor Green
Write-Host "New address: $ContractAddress" -ForegroundColor Cyan

# Update app.js
$appJsPath = "frontend/js/app.js"
$appJsContent = Get-Content -Path $appJsPath -Raw

if (-not $appJsContent) {
    Write-Host "ERROR: Could not read app.js file" -ForegroundColor Red
    exit 1
}

# Replace the contract address
$newAppJsContent = $appJsContent -replace 'const CONTRACT_ADDRESS = "([^"]+)"', "const CONTRACT_ADDRESS = `"$ContractAddress`" // Updated $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Set-Content -Path $appJsPath -Value $newAppJsContent

Write-Host "✅ Contract address updated successfully" -ForegroundColor Green
Write-Host "`nIMPORTANT: Please clear your browser cache or use incognito mode when reloading the application" -ForegroundColor Yellow
Write-Host "This ensures the browser loads the updated contract address instead of using a cached version."

# Ask if user wants to restart the server
$restartServer = Read-Host "`nWould you like to restart the development server? (y/n)"
if ($restartServer -eq "y") {
    # Check if there's a running node server
    $nodeProcess = Get-Process node -ErrorAction SilentlyContinue
    if ($nodeProcess) {
        Write-Host "Stopping existing server..." -ForegroundColor Cyan
        Stop-Process -Name node -Force
        Start-Sleep -Seconds 2
    }
    
    Write-Host "Starting development server..." -ForegroundColor Cyan
    Start-Process -FilePath "node" -ArgumentList "server.js"
    Write-Host "Server started!" -ForegroundColor Green
} else {
    Write-Host "Remember to restart your development server if it's running" -ForegroundColor Cyan
} 