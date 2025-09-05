import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

function OptionsApp() {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [autoCheck, setAutoCheck] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { HF_API_KEY = '', HF_MODEL = 'valurank/phishing-domain-detection-roberta', autoCheck = false } = await chrome.storage.local.get(['HF_API_KEY', 'HF_MODEL', 'autoCheck'])
      setApiKey(HF_API_KEY)
      setModel(HF_MODEL)
      setAutoCheck(Boolean(autoCheck))
    })()
  }, [])

  async function save() {
    await chrome.storage.local.set({ HF_API_KEY: apiKey.trim(), HF_MODEL: model.trim(), autoCheck })
    alert('Saved!')
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-semibold">CyberGuard Settings</h1>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Hugging Face API Key</span>
        <input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" className="w-full border rounded px-2 py-1" placeholder="hf_xxx" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Model</span>
        <input value={model} onChange={e => setModel(e.target.value)} className="w-full border rounded px-2 py-1" />
        <span className="text-xs text-gray-500">e.g. valurank/phishing-domain-detection-roberta</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={autoCheck} onChange={e => setAutoCheck(e.target.checked)} />
        <span className="text-sm">Auto-check every site you visit</span>
      </label>
      <button onClick={save} className="bg-gray-900 text-white rounded px-3 py-1 text-sm">Save</button>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>
)

