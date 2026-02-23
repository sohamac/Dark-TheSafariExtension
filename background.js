console.log("Quest: Background script initialized.");

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
  console.log("Quest: Icon clicked, toggling UI overlay on tab:", tab.id);

  // Send a message to the content script of the active tab
  chrome.tabs.sendMessage(tab.id, { action: "toggleOverlay" }).catch((err) => {
    console.error("Quest: Could not communicate with content script. Tab might be restricted or loading.", err);
  });
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Quest: Extension installed successfully.");
});
