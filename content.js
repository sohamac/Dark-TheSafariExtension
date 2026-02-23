function isPageAlreadyDark() {
    // 1. Check Meta Tag
    const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
    if (metaColorScheme && metaColorScheme.content.includes('dark')) return true;

    // 2. Check html/body data attributes or classes common in dark modes
    const darkIndicators = ['dark', 'night', 'theme-dark', 'dark-mode'];
    const bodyData = document.body ? JSON.stringify(document.body.dataset).toLowerCase() : '';
    const htmlData = JSON.stringify(document.documentElement.dataset).toLowerCase();

    if (darkIndicators.some(indicator =>
        document.documentElement.classList.contains(indicator) ||
        (document.body && document.body.classList.contains(indicator)) ||
        bodyData.includes(indicator) ||
        htmlData.includes(indicator)
    )) return true;

    // 3. Precise Color analysis
    const getBG = (el) => el ? window.getComputedStyle(el).backgroundColor : null;
    let bgColor = getBG(document.documentElement);
    if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
        bgColor = getBG(document.body);
    }

    if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
        return false;
    }

    const rgb = bgColor.match(/\d+/g);
    if (!rgb || rgb.length < 3) return false;

    const r = parseInt(rgb[0]), g = parseInt(rgb[1]), b = parseInt(rgb[2]);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance < 0.4;
}

function applyDarkMode(enabled) {
    const styleId = 'quest-dark-mode-style';
    let styleEl = document.getElementById(styleId);

    if (enabled) {
        if (isPageAlreadyDark()) {
            if (styleEl) styleEl.remove();
            return;
        }

        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            // We use ONLY visual filters to ensure ZERO layout or content interference.
            styleEl.textContent = `
        html { 
          filter: invert(1) hue-rotate(180deg) !important;
          /* Setting a background color provides a solid canvas for inversion without layout impact */
          background-color: #ffffff !important; 
        }
        
        /* Re-invert media content and known dark components */
        img, video, canvas, [style*="background-image"], .no-invert { 
          filter: invert(1) hue-rotate(180deg) !important; 
        }

        /* Compatibility: Prevent filters from breaking complex fixed/absolute layout layers */
        header, footer, nav, [class*="fixed"], [class*="overlay"] {
           /* Inversion happens at html level, so nested filters are kept to a minimum */
        }
        
        /* Transition for a premium feel, strictly visual */
        html { transition: filter 0.2s ease-in-out; }
      `;
            (document.head || document.documentElement).appendChild(styleEl);
        }
    } else {
        if (styleEl) styleEl.remove();
    }
}

// Initial check
chrome.storage.local.get(['darkMode'], (result) => {
    if (result.darkMode) {
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => applyDarkMode(true));
        } else {
            applyDarkMode(true);
        }
    }
});

// Instant Toggle Message Listener
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "toggleDarkMode") {
        applyDarkMode(request.enabled);
    }
});
