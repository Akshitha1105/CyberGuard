chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  if (message?.type === 'ANALYZE_URL' && typeof message.url === 'string') {
    // This is a hook point if we later move model call into SW
    sendResponse({ ok: true })
  }
  // Return true to keep the channel open for async sendResponse if needed
  return false
})

