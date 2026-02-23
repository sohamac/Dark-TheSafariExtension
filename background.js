console.log("Quest Safari Extension background script loaded.");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed.");
});
