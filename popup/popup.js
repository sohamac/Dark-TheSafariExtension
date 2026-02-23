document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const extremeModeToggle = document.getElementById('extreme-mode-toggle');
    const statusEl = document.getElementById('status');

    const darkIcon = document.querySelector('.icon-dark');
    const extremeIcon = document.querySelector('.icon-extreme');

    // Load saved state
    chrome.storage.local.get(['darkMode', 'extremeMode'], (result) => {
        darkModeToggle.checked = result.darkMode || false;
        extremeModeToggle.checked = result.extremeMode || false;
        updateUI(darkModeToggle.checked, extremeModeToggle.checked);
    });

    // Handle Dark Mode toggle
    darkModeToggle.addEventListener('change', () => {
        const isDark = darkModeToggle.checked;
        const isExtreme = extremeModeToggle.checked;
        chrome.storage.local.set({ darkMode: isDark });
        broadcastMessage(isDark, isExtreme);
        updateUI(isDark, isExtreme);
    });

    // Handle Extreme Mode toggle
    extremeModeToggle.addEventListener('change', () => {
        const isDark = darkModeToggle.checked;
        const isExtreme = extremeModeToggle.checked;
        chrome.storage.local.set({ extremeMode: isExtreme });
        broadcastMessage(isDark, isExtreme);
        updateUI(isDark, isExtreme);
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

    function updateUI(enabled, extreme) {
        // Update Status Label
        if (!enabled) {
            statusEl.textContent = 'OFF';
            statusEl.style.color = '#86868b';
        } else {
            statusEl.textContent = extreme ? 'EXTREME MODE' : 'DARK MODE ACTIVE';
            statusEl.style.color = '#34c759';
        }

        // Update Icon Highlights
        if (enabled) {
            darkIcon.classList.add('active-dark');
        } else {
            darkIcon.classList.remove('active-dark');
        }

        if (enabled && extreme) {
            extremeIcon.classList.add('active-extreme');
        } else {
            extremeIcon.classList.remove('active-extreme');
        }
    }
});
