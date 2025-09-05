# CyberGuard - Chrome Extension (MV3)

CyberGuard detects phishing websites and explains risks in plain English.

## Features
- Verdict (Safe / Risky) with confidence
- Human-readable explanation and recommended action
- Uses Hugging Face Inference API for phishing detection
- Optional auto-check on every site, history log, and red badge for risky sites

## Setup
1. Install dependencies:
```
npm install
```
2. Add your Hugging Face API key:
   - Load the extension (see below), then open Options and paste your key.
   - Optionally change the model (default: `valurank/phishing-domain-detection-roberta`).

## Development
- Run dev server (for popup UI iteration):
```
npm run dev
```

## Build
```
npm run build:ext
```
The build outputs to `dist/`.

## Load in Chrome
1. Go to `chrome://extensions`.
2. Enable Developer Mode.
3. Click "Load unpacked" and select the `dist` folder.

## Configuration
- Options page lets you set:
  - Hugging Face API Key (stored in `chrome.storage.local`)
  - Model name
  - Auto-check toggle

## Notes
- Popup uses React + Vite + Tailwind (v4 via plugin) for a clean UI.
- Background service worker is TypeScript-bundled and handles auto-check and defaults.
