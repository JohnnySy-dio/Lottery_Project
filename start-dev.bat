@echo off
echo Starting the Decentralized Lottery Development Environment

echo Step 1: Checking if Ganache is running...
powershell -Command "if ((Test-NetConnection 127.0.0.1 -Port 7545 -WarningAction SilentlyContinue).TcpTestSucceeded) { Write-Host 'Ganache is already running' } else { Write-Host 'Please start Ganache on port 7545 before continuing' }"

echo Step 2: Compiling and deploying the smart contract...
call npx truffle compile
call npx truffle migrate --reset

echo Step 3: Starting the development server...
call node server.js

pause
