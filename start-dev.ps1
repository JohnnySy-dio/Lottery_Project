# Start the Decentralized Lottery Development Environment
Write-Host "Starting the Decentralized Lottery Development Environment" -ForegroundColor Green

# Skip Ganache check for now
Write-Host "Skipping Ganache check for testing..." -ForegroundColor Yellow

Write-Host "Step 3: Starting the development server directly..." -ForegroundColor Cyan
node server.js

Read-Host "Press Enter to exit"
