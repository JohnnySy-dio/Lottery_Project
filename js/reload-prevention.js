// Reload Prevention Script
// Override window.location.reload to prevent automatic page reloads
console.log("Initializing reload prevention...");

// Store original reload function
window._originalReload = window.location.reload;

// Override the reload function
window.location.reload = function(forceGet) {
    console.log("🛑 Reload attempted - checking if prevention is active");
    
    // Check if we should prevent reloads
    if (window.location.href.toLowerCase().includes('ganache') || 
        localStorage.getItem('disableAutoReload') === 'true') {
        console.log("🛑 Reload prevented by override");
        return false;
    } else {
        console.log("✅ Reload allowed - not in prevention mode");
        return window._originalReload(forceGet);
    }
};

// Add reset button to clear localStorage (visible in console only)
window.resetReloadPrevention = function() {
    localStorage.removeItem('disableAutoReload');
    localStorage.removeItem('lastGanacheSwitch');
    sessionStorage.clear();
    console.log("🔄 Reload prevention settings reset");
};

// Set prevention flag based on URL
if (window.location.href.toLowerCase().includes('ganache')) {
    localStorage.setItem('disableAutoReload', 'true');
    console.log("🔒 Reload prevention activated based on URL");
}

// Prevent MetaMask's default chain change behavior
window.addEventListener('load', function() {
    if (window.ethereum) {
        const originalOn = window.ethereum.on;
        
        window.ethereum.on = function(eventName, listener) {
            if (eventName === 'chainChanged') {
                console.log("🔧 Intercepted chainChanged event subscription");
                
                // Replace with our own handler that doesn't reload
                return originalOn.call(window.ethereum, eventName, function(chainId) {
                    console.log("⛓️ Chain changed to:", chainId);
                    console.log("🛑 Preventing MetaMask's automatic page reload");
                    
                    // Call the original listener but prevent any reloads it might trigger
                    try {
                        listener(chainId);
                    } catch (error) {
                        console.error("Error in chainChanged handler:", error);
                    }
                });
            } else {
                // For other events, use the original behavior
                return originalOn.call(window.ethereum, eventName, listener);
            }
        };
        
        console.log("🔒 MetaMask chainChanged event modified to prevent reloads");
    }
}); 