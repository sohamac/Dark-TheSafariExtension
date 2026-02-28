console.log("Quest: Background script initialized.");

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
  if (!tab || !tab.id) return;

  console.log("Quest: Icon clicked, toggling UI overlay on tab:", tab.id);

  chrome.tabs.sendMessage(tab.id, { action: "toggleSmartInvert" }, (response) => {
    // Robustness: Handle messaging errors (e.g. on restricted pages like App Store)
    if (chrome.runtime.lastError) {
      console.warn("Quest: Messaging failed (expected on system pages):", chrome.runtime.lastError.message);
    }
  });
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Quest: Extension installed successfully.");
});
