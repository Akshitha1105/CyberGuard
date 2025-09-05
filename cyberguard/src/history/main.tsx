import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

type Item = { url: string; label: 'safe' | 'phishing' | 'unknown'; confidence: number; explanation: string; time: number }

function HistoryApp() {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    ;(async () => {
      const { history = [] } = await chrome.storage.local.get('history')
      setItems(history)
    })()
  }, [])

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-3">Checked Sites</h1>
      <ul className="space-y-2">
        {items.map((it, idx) => (
          <li key={idx} className="border rounded p-3">
            <div className="text-sm flex justify-between">
              <span className="truncate max-w-[70%]">{it.url}</span>
              <span className="text-xs text-gray-500">{new Date(it.time).toLocaleString()}</span>
            </div>
            <div className="text-sm mt-1">{it.label.toUpperCase()} {it.confidence ? `(${it.confidence}%)` : ''}</div>
            <div className="text-xs text-gray-600 mt-1">{it.explanation}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HistoryApp />
  </StrictMode>
)

