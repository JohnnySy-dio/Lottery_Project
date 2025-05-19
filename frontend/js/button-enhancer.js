// Modify the event listener for the Enter Lottery button to use our enhanced transaction tracking
enterBtn.addEventListener('click', async () => {
    console.log("Enter lottery button clicked");
    // Use the enhanced version with transaction tracking
    if (typeof enterLotteryWithTracking === 'function') {
        await enterLotteryWithTracking();
    } else {
        console.error("enterLotteryWithTracking function not found, falling back to old method");
        // Original implementation goes here
    }
});

// Modify the event listener for the Set Fee button to use our enhanced transaction tracking
setFeeBtn.addEventListener('click', async () => {
    console.log("Set fee button clicked");
    const newFeeEth = entryFeeInput.value.trim();
    
    // Use the enhanced version with transaction tracking
    if (typeof setEntryFeeWithTracking === 'function') {
        await setEntryFeeWithTracking(newFeeEth);
    } else {
        console.error("setEntryFeeWithTracking function not found, falling back to old method");
        // Original implementation goes here
    }
});
