# Unhinged Chrome Extension

This repository contains a simple Chrome extension named **Stock Chart Analyzer**. It opens a collapsible sidebar on any page, lets you capture a region of the screen, and shows a mocked analysis of stock chart patterns. Notes and screenshots can be stored using Chrome sync storage.

## Directory Structure

```
extension/
  manifest.json      - Chrome manifest (MV3)
  background.js      - Service worker for capture and toggle events
  content.js         - Injected script that creates the sidebar and handles UI
  styles.css         - Basic styles for sidebar and overlay
```

## Development

1. Load the `extension` folder as an unpacked extension in Chrome. If you see an
   error like **"Manifest file is missing or unreadable"**, double-check that you
   selected the `extension` directory itself rather than the repository root.
2. Click the extension icon to open or close the sidebar on any page.
3. Use **Capture Snippet** to select a region. The screenshot and a placeholder analysis appear in the sidebar. The extension requests the `tabs` permission so it can capture the visible tab.
4. Add an optional note and click **Save Note** to store it using `chrome.storage.sync`.

The analysis logic is stubbed for demonstration but shows where a real AI model could be integrated.

## Testing

The project does not require a build step. Running `npm test` or similar is unnecessary. Loading the extension and verifying the sidebar and capture behavior is sufficient.
