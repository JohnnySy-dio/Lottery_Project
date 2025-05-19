// This script fixes the event listeners for our enhanced transaction tracking
document.addEventListener('DOMContentLoaded', function() {
    console.log("Button enhancer: Setting up enhanced event listeners");
    
    // Wait for all scripts to be loaded
    setTimeout(() => {
        setupEnhancedEventListeners();
    }, 100);
});

function setupEnhancedEventListeners() {
    console.log("Setting up enhanced event listeners");
    
    const enterBtn = document.getElementById('enter-btn');
    const setFeeBtn = document.getElementById('set-fee-btn');
    const entryFeeInput = document.getElementById('entry-fee-input');
    
    // First, remove existing event listeners (if possible)
    if (enterBtn) {
        console.log("Enhancing Enter Lottery button");
        const newEnterBtn = enterBtn.cloneNode(true);
        enterBtn.parentNode.replaceChild(newEnterBtn, enterBtn);
        
        // Add our enhanced event listener
        newEnterBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            console.log("Enter lottery button clicked (enhanced)");
            
            // Use the enhanced version with transaction tracking
            if (typeof enterLotteryWithTracking === 'function') {
                await enterLotteryWithTracking();
            } else {
                console.error("enterLotteryWithTracking function not found");
                alert("Transaction tracking function not found. Please refresh the page and try again.");
            }
        });
    } else {
        console.warn("Enter lottery button not found");
    }
    
    // Replace Set Fee button event listener
    if (setFeeBtn && entryFeeInput) {
        console.log("Enhancing Set Fee button");
        const newSetFeeBtn = setFeeBtn.cloneNode(true);
        setFeeBtn.parentNode.replaceChild(newSetFeeBtn, setFeeBtn);
        
        // Add our enhanced event listener
        newSetFeeBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            console.log("Set fee button clicked (enhanced)");
            const newFeeEth = entryFeeInput.value.trim();
            
            // Use the enhanced version with transaction tracking
            if (typeof setEntryFeeWithTracking === 'function') {
                await setEntryFeeWithTracking(newFeeEth);
            } else {
                console.error("setEntryFeeWithTracking function not found");
                alert("Transaction tracking function not found. Please refresh the page and try again.");
            }
        });
    } else {
        console.warn("Set fee button or input not found");
    }
    
    console.log("Enhanced event listeners setup complete");
}
