# Decentralized Lottery - Project Architecture

```
+------------------------------+       +------------------------+
|                              |       |                        |
|  Frontend (Web Interface)    |       |  Ethereum Blockchain   |
|  http://localhost:4000       |<----->|  (Ganache on port 7545)|
|                              |       |                        |
+------------------------------+       +------------------------+
           |                                     ^
           |                                     |
           v                                     |
+------------------------------+       +------------------------+
|                              |       |                        |
|  Web3.js                     |------>|  Smart Contract        |
|  JavaScript Library          |       |  DecentralizedLottery  |
|                              |       |                        |
+------------------------------+       +------------------------+

```

## Data Flow Diagram

```
User Actions                  Smart Contract Response
+--------------+              +--------------------+
| Connect      |------------->| Get Balance        |
| Wallet       |<-------------| Get Participants   |
+--------------+              | Get Lottery Info   |
                              +--------------------+
+--------------+                     |
| Enter        |                     v
| Lottery      |---> ETH Payment ---> Contract Balance ↑
+--------------+                      Player Count ↑
                                      Events Emitted
+--------------+                     |
| Admin        |                     v
| Actions      |---> Transaction ---> Contract State Change
+--------------+                      Prize Distribution
                                      New Lottery Round
```

## Project Structure

```
project/
├── build/                       # Compiled contract artifacts
│   └── contracts/
│       └── DecentralizedLottery.json
│
├── contracts/                   # Smart contract source code
│   └── DecentralizedLottery.sol
│
├── frontend/                    # Web interface
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js              # Main application logic
│   │   ├── test-connection.js  # Diagnostic tools
│   │   └── web3-test.js
│   ├── index.html              # Main application page
│   ├── connection-test.html    # Test pages
│   ├── simple-test.html
│   └── web3-test.html
│
├── migrations/                  # Deployment scripts
│   └── 1_deploy_lottery.js
│
├── server.js                    # Express server for frontend
├── start-dev.ps1                # Startup scripts
├── start-dev.bat
├── test-connection.ps1          # Testing script
├── truffle-config.js            # Truffle configuration
├── utils.js                     # Utility functions
├── DOCUMENTATION.md             # Comprehensive documentation
└── QUICK-START.md               # Quick start guide
```

## Lottery Process Flow

```
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
|  Lottery       |---->|  Participants  |---->|  Lottery       |
|  Created       |     |  Join          |     |  Closed        |
|                |     |                |     |                |
+----------------+     +----------------+     +----------------+
                                                      |
                                                      v
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
|  New Lottery   |<----|  Prize         |<----|  Winner       |
|  Starts        |     |  Distribution  |     |  Selected     |
|                |     |                |     |                |
+----------------+     +----------------+     +----------------+
```
