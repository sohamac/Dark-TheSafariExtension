document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const extremeModeToggle = document.getElementById('extreme-mode-toggle');
    const statusEl = document.getElementById('status');

    // Load saved state
    chrome.storage.local.get(['darkMode', 'extremeMode'], (result) => {
        darkModeToggle.checked = result.darkMode || false;
        extremeModeToggle.checked = result.extremeMode || false;
        updateStatusLabel(darkModeToggle.checked, extremeModeToggle.checked);
    });

    // Handle Dark Mode toggle
    darkModeToggle.addEventListener('change', () => {
        const isDark = darkModeToggle.checked;
        const isExtreme = extremeModeToggle.checked;

        chrome.storage.local.set({ darkMode: isDark });
        broadcastMessage(isDark, isExtreme);
        updateStatusLabel(isDark, isExtreme);
    });

    // Handle Extreme Mode toggle
    extremeModeToggle.addEventListener('change', () => {
        const isDark = darkModeToggle.checked;
        const isExtreme = extremeModeToggle.checked;

        chrome.storage.local.set({ extremeMode: isExtreme });
        broadcastMessage(isDark, isExtreme);
        updateStatusLabel(isDark, isExtreme);
    });

    function broadcastMessage(enabled, extreme) {
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: "updateConfig",
                    enabled: enabled,
                    extreme: extreme
                }).catch(() => { });
            });
        });
    }

    function updateStatusLabel(enabled, extreme) {
        if (!enabled) {
            statusEl.textContent = 'OFF';
            statusEl.style.color = '#86868b';
        } else {
            statusEl.textContent = extreme ? 'EXTREME ON' : 'ON';
            statusEl.style.color = '#0071e3';
        }
    }
});
