// Debug wrapper for transaction tracking
console.log("Transaction debug wrapper loaded");

// Store the original trackTransaction function
if (typeof trackTransaction === 'function') {
    console.log("Found trackTransaction function, creating wrapper");
    
    const originalTrackTransaction = trackTransaction;
    
    // Replace it with our debug wrapper
    window.trackTransaction = async function(txHash, message, onSuccess, onError) {
        console.log("Debug wrapper: trackTransaction called with hash:", txHash);
        console.log("Debug wrapper: message:", message);
        
        try {
            // Call the original with extra debug logging
            console.log("Debug wrapper: calling original trackTransaction");
            await originalTrackTransaction(txHash, message, 
                function(receipt) {
                    console.log("Debug wrapper: onSuccess callback received receipt:", receipt);
                    if (onSuccess) onSuccess(receipt);
                }, 
                function(error) {
                    console.log("Debug wrapper: onError callback received error:", error);
                    if (onError) onError(error);
                }
            );
            console.log("Debug wrapper: original trackTransaction completed");
        } catch (error) {
            console.error("Debug wrapper: error in trackTransaction:", error);
            if (onError) onError(error.message || "Unknown error in trackTransaction");
        }
    };
} else {
    console.error("trackTransaction function not found!");
    
    // Create a fallback implementation
    window.trackTransaction = async function(txHash, message, onSuccess, onError) {
        console.log("FALLBACK trackTransaction called with hash:", txHash);
        console.log("FALLBACK trackTransaction message:", message);
        
        // Display fallback UI
        const txStatusContainer = document.getElementById('tx-status-container');
        if (txStatusContainer) {
            const fallbackElement = document.createElement('div');
            fallbackElement.className = 'alert alert-warning transaction-status';
            fallbackElement.innerHTML = `
                <p>${message}</p>
                <p>Transaction Hash: <code>${txHash}</code></p>
                <p><strong>Note:</strong> Transaction tracking is not fully working. Your transaction was sent, but status updates are not available.</p>
            `;
            txStatusContainer.appendChild(fallbackElement);
        }
        
        // Just assume success after 5 seconds for demo purposes
        setTimeout(() => {
            if (onSuccess) onSuccess({});
        }, 5000);
    };
}
