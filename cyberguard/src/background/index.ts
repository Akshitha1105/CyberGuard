import './messaging'

chrome.runtime.onInstalled.addListener(async () => {
  const { HF_MODEL } = await chrome.storage.local.get('HF_MODEL')
  if (!HF_MODEL) {
    await chrome.storage.local.set({ HF_MODEL: 'valurank/phishing-domain-detection-roberta' })
  }
  await chrome.action.setBadgeText({ text: '' })
})

// Optional auto-check: when enabled, analyze on navigation
chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return
  const { autoCheck } = await chrome.storage.local.get('autoCheck')
  if (!autoCheck) return
  try {
    await chrome.runtime.sendMessage({ type: 'ANALYZE_URL', url: tab.url })
  } catch {}
})

