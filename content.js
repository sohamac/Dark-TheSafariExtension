function isPageAlreadyDark() {
    // Check if site explicitly uses dark theme via media query
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // If the site reacts to prefers-color-scheme: dark, it might already be dark.
        // However, some sites have it but don't use it, so we still check colors.
    }

    const bgColor = window.getComputedStyle(document.documentElement).backgroundColor ||
        window.getComputedStyle(document.body).backgroundColor;

    if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
        return false; // Assume light if we can't determine
    }

    // Parse RGB
    const rgb = bgColor.match(/\d+/g);
    if (!rgb || rgb.length < 3) return false;

    // Calculate luminance (standard formula)
    const r = parseInt(rgb[0]);
    const g = parseInt(rgb[1]);
    const b = parseInt(rgb[2]);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance < 0.5; // True if dark
}

function applyDarkMode(enabled) {
    let styleEl = document.getElementById('quest-dark-mode-style');

    if (enabled) {
        // Smart detection: only apply if the page isn't already dark
        if (isPageAlreadyDark()) {
            if (styleEl) styleEl.remove();
            console.log("Quest: Page is already dark. Skipping inversion.");
            return;
        }

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
    if (result.darkMode) {
        // Wait a bit for the body/bg to be defined if running at document_start
        if (document.body) {
            applyDarkMode(true);
        } else {
            window.addEventListener('DOMContentLoaded', () => applyDarkMode(true));
        }
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleDarkMode") {
        applyDarkMode(request.enabled);
    }
});
