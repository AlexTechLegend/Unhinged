chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggle_sidebar' }, () => {
    if (chrome.runtime.lastError) {
      // Content scripts might not be loaded; inject them then retry
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['analyzer.js', 'content.js'] }, () => {
        chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['styles.css'] }, () => {
          chrome.tabs.sendMessage(tab.id, { action: 'toggle_sidebar' });
        });
      });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'capture_screen') {
    const windowId = sender.tab ? sender.tab.windowId : undefined;
    chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('captureVisibleTab failed:', chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ dataUrl });
    });
    return true; // Keep the message channel open
  }
});
