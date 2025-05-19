# Test Web3 connection to Ganache
Write-Host "Testing Web3 connection to Ganache..." -ForegroundColor Cyan

# Check if Ganache is running
$ganacheRunning = (Test-NetConnection 127.0.0.1 -Port 7545 -WarningAction SilentlyContinue).TcpTestSucceeded
if ($ganacheRunning) {
    Write-Host "Ganache is running on port 7545" -ForegroundColor Green
} else {
    Write-Host "Error: Ganache is not running on port 7545" -ForegroundColor Red
    Write-Host "Please start Ganache and try again."
    exit 1
}

# Start a simple server to serve the connection test page
Write-Host "Starting test server on port 8000..." -ForegroundColor Cyan
$job = Start-Job -ScriptBlock {
    cd $args[0]
    npx http-server ./frontend -p 8000 --cors
} -ArgumentList $PSScriptRoot

# Open the test page in a browser
Start-Process "http://localhost:8000/web3-test.html"

Write-Host "Press Ctrl+C to stop the test server..." -ForegroundColor Yellow
try {
    while ($true) {
        Start-Sleep -Seconds 1
        $jobInfo = Receive-Job -Job $job
        if ($jobInfo) {
            Write-Host $jobInfo
        }
    }
} finally {
    Stop-Job -Job $job
    Remove-Job -Job $job -Force
}
