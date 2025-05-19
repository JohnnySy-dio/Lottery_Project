// This script adds a test transaction button for debugging purposes
document.addEventListener('DOMContentLoaded', function() {
    console.log("Transaction test setup loaded");
    
    // Add a test button to the page
    setTimeout(() => {
        addTestTransactionButton();
    }, 200);
});

function addTestTransactionButton() {
    const container = document.getElementById('tx-status-container');
    if (!container) {
        console.warn("tx-status-container not found, can't add test button");
        return;
    }
    
    const testButton = document.createElement('button');
    testButton.className = 'btn btn-sm btn-outline-secondary mb-2';
    testButton.textContent = 'Test Transaction Tracking';
    testButton.id = 'test-tx-button';
    
    // Add click handler
    testButton.addEventListener('click', function() {
        console.log("Test transaction button clicked");
        simulateTransaction();
    });
    
    // Add to the page
    container.appendChild(testButton);
    console.log("Test transaction button added");
}

// Function to simulate a transaction for testing
function simulateTransaction() {
    // Generate a fake transaction hash
    const fakeHash = '0x' + Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('');
    
    console.log("Simulating transaction with hash:", fakeHash);
    
    // Call trackTransaction with the fake hash
    if (typeof trackTransaction === 'function') {
        trackTransaction(
            fakeHash,
            'Test transaction. This is not a real transaction, just a test.',
            function(receipt) {
                console.log("Test transaction 'succeeded':", receipt);
                showNotification('Test transaction tracking works!', 'success');
            },
            function(error) {
                console.error("Test transaction 'failed':", error);
                showError('Transaction tracking test failed: ' + error);
            }
        );
    } else {
        console.error("trackTransaction function not found for testing");
        alert("Transaction tracking function not found. Debug required.");
    }
}
