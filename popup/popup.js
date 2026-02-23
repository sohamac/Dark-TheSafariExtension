document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('dark-mode-toggle');
    const statusEl = document.getElementById('status');

    // Load saved state
    chrome.storage.local.get(['darkMode'], (result) => {
        toggle.checked = result.darkMode || false;
        updateStatusLabel(toggle.checked);
    });

    // Handle toggle change
    toggle.addEventListener('change', () => {
        const isEnabled = toggle.checked;

        // Save to storage
        chrome.storage.local.set({ darkMode: isEnabled });
        updateStatusLabel(isEnabled);

        // Notify all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: "toggleDarkMode",
                    enabled: isEnabled
                }).catch(err => {
                    // Ignore errors for tabs where extension can't run (like safari settings)
                });
            });
        });
    });

    function updateStatusLabel(enabled) {
        statusEl.textContent = enabled ? 'ON' : 'OFF';
        statusEl.style.color = enabled ? '#0071e3' : '#86868b';
    }
});
