# Unhinged Chrome Extension

This repository contains a Chrome extension named **Stock Chart Analyzer**. It opens a collapsible sidebar on any page, lets you capture a region of the screen, and performs technical analysis on sample OHLCV data. The sidebar displays indicators, pattern detection, and simple backtest results. Notes and screenshots can be stored using Chrome sync storage.

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
2. Click the extension icon to open or close the sidebar on any page. If the page was open before installation, the service worker injects both `analyzer.js` and `content.js` so you shouldn't see the "Could not establish connection" error. The content script ignores duplicate loads to avoid "Identifier already declared" errors.
3. Use **Capture Snippet** to select a region. The screenshot and a placeholder analysis appear in the sidebar. The extension requests the `tabs` permission so it can capture the visible tab.
4. Add an optional note and click **Save Note** to store it using `chrome.storage.sync`.

The analysis logic is stubbed for demonstration but shows where a real AI model could be integrated.

## Analyzer Features

The extension includes a small analysis module that demonstrates how trade signals
could be generated. The sample data is synthetic, but the module illustrates:

* Moving-average crossover and RSI calculations
* Naive candlestick pattern detection
* Automatic support/resistance level identification
* Risk/reward estimation and simple backtesting

These outputs appear below the captured screenshot inside the sidebar. They can
be saved along with notes for later review.

## Testing

The project does not require a build step. Running `npm test` or similar is unnecessary. Loading the extension and verifying the sidebar and capture behavior is sufficient.
