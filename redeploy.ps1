# Decentralized Lottery Redeployment Script
Write-Host "Starting Lottery Contract Redeployment" -ForegroundColor Green

# Step 1: Check if Ganache is running
Write-Host "Step 1: Checking if Ganache is running..." -ForegroundColor Cyan
$ganacheRunning = Test-NetConnection 127.0.0.1 -Port 7545 -InformationLevel Quiet
if (-not $ganacheRunning) {
    Write-Host "ERROR: Ganache is not running on port 7545. Please start Ganache first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Ganache is running" -ForegroundColor Green

# Step 2: Compile the contract
Write-Host "Step 2: Compiling the smart contract..." -ForegroundColor Cyan
npx truffle compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Contract compilation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Contract compiled successfully" -ForegroundColor Green

# Step 3: Deploy the contract
Write-Host "Step 3: Deploying the smart contract..." -ForegroundColor Cyan
$deployOutput = npx truffle migrate --reset
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Contract deployment failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Contract deployed successfully" -ForegroundColor Green

# Step 4: Extract contract address from deployment output
Write-Host "Step 4: Extracting new contract address..." -ForegroundColor Cyan
$contractAddressPattern = "contract address:\s+([0-9a-fA-Fx]+)"
$match = $deployOutput | Select-String -Pattern $contractAddressPattern
if (-not $match) {
    Write-Host "ERROR: Could not extract contract address from deployment output" -ForegroundColor Red
    exit 1
}
$contractAddress = $match.Matches[0].Groups[1].Value
Write-Host "✅ New contract address: $contractAddress" -ForegroundColor Green

# Step 5: Update the contract address in app.js
Write-Host "Step 5: Updating app.js with new contract address..." -ForegroundColor Cyan
$appJsPath = "frontend/js/app.js"
$appJsContent = Get-Content -Path $appJsPath -Raw
$newAppJsContent = $appJsContent -replace 'const CONTRACT_ADDRESS = "([^"]+)"', "const CONTRACT_ADDRESS = `"$contractAddress`" // Updated $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Set-Content -Path $appJsPath -Value $newAppJsContent
Write-Host "✅ Contract address updated in app.js" -ForegroundColor Green

# Step 6: Clear browser cache recommendation
Write-Host "`nIMPORTANT: Please clear your browser cache or use incognito mode when reloading the application" -ForegroundColor Yellow
Write-Host "This ensures the browser loads the updated contract address instead of using a cached version.`n"

# Step 7: Ask if user wants to start development server
$startServer = Read-Host "Would you like to start the development server now? (y/n)"
if ($startServer -eq "y") {
    Write-Host "Starting development server..." -ForegroundColor Cyan
    node server.js
} else {
    Write-Host "To start the development server manually, run: node server.js" -ForegroundColor Cyan
}

Write-Host "`nRedeployment completed!" -ForegroundColor Green 