let observer = null;

function isPageAlreadyDark() {
    const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
    if (metaColorScheme && metaColorScheme.content.includes('dark')) return true;

    const darkIndicators = ['dark', 'night', 'theme-dark', 'dark-mode'];
    const bodyData = document.body ? JSON.stringify(document.body.dataset).toLowerCase() : '';
    const htmlData = JSON.stringify(document.documentElement.dataset).toLowerCase();

    if (darkIndicators.some(indicator =>
        document.documentElement.classList.contains(indicator) ||
        (document.body && document.body.classList.contains(indicator)) ||
        bodyData.includes(indicator) ||
        htmlData.includes(indicator)
    )) return true;

    const getBG = (el) => el ? window.getComputedStyle(el).backgroundColor : null;
    let bgColor = getBG(document.documentElement);
    if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
        bgColor = getBG(document.body);
    }

    if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') return false;

    const rgb = bgColor.match(/\d+/g);
    if (!rgb || rgb.length < 3) return false;

    const r = parseInt(rgb[0]), g = parseInt(rgb[1]), b = parseInt(rgb[2]);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance < 0.4;
}

function scanAndFixExtreme() {
    // Pro Route: MutationObserver behavior
    // This function would typically do deeper surgical fixes, 
    // but for MV3, we can ensure specific selectors stay non-inverted or re-inverted.
    console.log("Quest: Extreme Mode scanning DOM mutations...");
}

function applyDarkMode(enabled, extreme) {
    const styleId = 'quest-dark-mode-style';
    let styleEl = document.getElementById(styleId);

    // Stop any existing observer
    if (observer) {
        observer.disconnect();
        observer = null;
    }

    if (enabled) {
        if (isPageAlreadyDark()) {
            if (styleEl) styleEl.remove();
            return;
        }

        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.textContent = `
        html { 
          filter: invert(1) hue-rotate(180deg) !important;
          background-color: #ffffff !important; 
        }
        img, video, canvas, [style*="background-image"], .no-invert { 
          filter: invert(1) hue-rotate(180deg) !important; 
        }
        [class*="gradient"], [class*="overlay"], [class*="mask"] {
           filter: none !important;
        }
        html { transition: filter 0.2s ease-in-out; }
      `;
            (document.head || document.documentElement).appendChild(styleEl);
        }

        // Activate MutationObserver in Extreme Mode
        if (extreme) {
            observer = new MutationObserver((mutations) => {
                scanAndFixExtreme();
            });
            observer.observe(document.body || document.documentElement, {
                childList: true,
                subtree: true
            });
        }

    } else {
        if (styleEl) styleEl.remove();
    }
}

// Initial check
chrome.storage.local.get(['darkMode', 'extremeMode'], (result) => {
    const isDark = result.darkMode || false;
    const isExtreme = result.extremeMode || false;

    if (isDark) {
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => applyDarkMode(true, isExtreme));
        } else {
            applyDarkMode(true, isExtreme);
        }
    }
});

// Listener for config updates
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "updateConfig") {
        applyDarkMode(request.enabled, request.extreme);
    }
});
