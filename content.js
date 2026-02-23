function applyDarkMode(enabled) {
    const className = 'quest-dark-mode-active';
    let styleEl = document.getElementById('quest-dark-mode-style');

    if (enabled) {
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'quest-dark-mode-style';
            styleEl.textContent = `
        html { filter: invert(1) hue-rotate(180deg) !important; }
        img, video, canvas, [style*="background-image"] { filter: invert(1) hue-rotate(180deg) !important; }
        html { transition: filter 0.3s ease-in-out; }
      `;
            document.documentElement.appendChild(styleEl);
        }
    } else {
        if (styleEl) {
            styleEl.remove();
        }
    }
}

// Initial check on load
chrome.storage.local.get(['darkMode'], (result) => {
    applyDarkMode(result.darkMode);
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleDarkMode") {
        applyDarkMode(request.enabled);
    }
});
