document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('dark-mode-toggle');
    const statusEl = document.getElementById('status');

    // Load saved state
    chrome.storage.local.get(['darkMode'], (result) => {
        const isEnabled = result.darkMode || false;
        toggle.checked = isEnabled;
        updateStatusLabel(isEnabled);
    });

    // Handle toggle change
    toggle.addEventListener('change', () => {
        const isEnabled = toggle.checked;

        // Save to storage
        chrome.storage.local.set({ darkMode: isEnabled });
        updateStatusLabel(isEnabled);

        // Notify ALL tabs for instant update
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                // We use a try-catch or silence errors for tabs where script isn't loaded
                chrome.tabs.sendMessage(tab.id, {
                    action: "toggleDarkMode",
                    enabled: isEnabled
                }).catch(() => { });
            });
        });
    });

    function updateStatusLabel(enabled) {
        statusEl.textContent = enabled ? 'ON' : 'OFF';
        statusEl.style.color = enabled ? '#0071e3' : '#86868b';
    }
});
