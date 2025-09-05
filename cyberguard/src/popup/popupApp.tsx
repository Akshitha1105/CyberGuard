import { useEffect, useMemo, useState } from 'react'

type VerdictLabel = 'safe' | 'phishing' | 'unknown'

type DetectionResult = {
  label: VerdictLabel
  confidence: number
  explanation: string
  url: string
}

const initialState: DetectionResult = {
  label: 'unknown',
  confidence: 0,
  explanation: 'Click “Check This Site” to analyze the current page.',
  url: ''
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

function Badge({ label }: { label: VerdictLabel }) {
  const color = label === 'phishing' ? 'bg-red-100 text-red-700' : label === 'safe' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
  const text = label === 'phishing' ? 'Risky' : label === 'safe' ? 'Safe' : 'Unknown'
  return <span className={classNames('px-2 py-1 rounded text-xs font-semibold', color)}>{text}</span>
}

async function getActiveTabUrl(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab?.url ?? ''
}

async function callHuggingFace(url: string): Promise<{ label: VerdictLabel; score: number; raw: unknown }> {
  const apiKey = (await chrome.storage.local.get('HF_API_KEY'))?.HF_API_KEY || ''
  const model = (await chrome.storage.local.get('HF_MODEL'))?.HF_MODEL || 'valurank/phishing-domain-detection-roberta'
  const endpoint = `https://api-inference.huggingface.co/models/${model}`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': apiKey ? `Bearer ${apiKey}` : '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: url })
  })
  if (!res.ok) {
    throw new Error(`Model error: ${res.status}`)
  }
  const data = await res.json()
  // Normalize common HF outputs
  // Case A: array of {label, score}
  let label: VerdictLabel = 'unknown'
  let score = 0
  if (Array.isArray(data)) {
    const best = data[0]?.[0] || data[0]
    if (best?.label) {
      const l = String(best.label).toLowerCase()
      if (l.includes('phish') || l.includes('malicious') || l.includes('bad')) label = 'phishing'
      if (l.includes('safe') || l.includes('benign') || l.includes('good')) label = 'safe'
    }
    score = Number(best?.score ?? 0)
  } else if (data?.label) {
    const l = String(data.label).toLowerCase()
    if (l.includes('phish') || l.includes('malicious') || l.includes('bad')) label = 'phishing'
    if (l.includes('safe') || l.includes('benign') || l.includes('good')) label = 'safe'
    score = Number(data?.score ?? 0)
  }
  return { label, score, raw: data }
}

function extractHeuristics(urlString: string): string[] {
  const reasons: string[] = []
  try {
    const url = new URL(urlString)
    if (url.protocol !== 'https:') {
      reasons.push('This site is insecure (no HTTPS).')
    }
    const hostname = url.hostname
    // Homograph-like quick checks
    if (/[0-9]/.test(hostname) && /(paypa1|faceb00k|g00gle|m1crosoft|appl3)/i.test(hostname)) {
      reasons.push('This site imitates a brand by swapping characters.')
    }
    // Long URL path
    if (url.pathname.length > 60) {
      reasons.push('This site uses an unusually long address.')
    }
    // Many subdomains
    const parts = hostname.split('.')
    if (parts.length >= 4) {
      reasons.push('This site hides behind many subdomains.')
    }
  } catch {
    reasons.push('The address looks unusual or invalid.')
  }
  return reasons
}

function recommendedAction(label: VerdictLabel): string {
  if (label === 'phishing') return 'Avoid entering passwords or personal data.'
  if (label === 'safe') return 'You can browse normally. Stay cautious.'
  return 'Check the site before sharing any information.'
}

export default function Popup() {
  const [result, setResult] = useState<DetectionResult>(initialState)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // load last result for current URL if present
    ;(async () => {
      const url = await getActiveTabUrl()
      const history = (await chrome.storage.local.get('history'))?.history || []
      const last = history.find((h: any) => h.url === url)
      if (last) setResult(last)
    })()
  }, [])

  const cardColor = useMemo(() => {
    if (result.label === 'phishing') return 'border-red-200'
    if (result.label === 'safe') return 'border-green-200'
    return 'border-gray-200'
  }, [result.label])

  async function analyze() {
    setIsLoading(true)
    setError(null)
    try {
      const url = await getActiveTabUrl()
      if (!url) throw new Error('No active tab URL found.')

      const heuristics = extractHeuristics(url)
      const hf = await callHuggingFace(url)
      const label: VerdictLabel = hf.label === 'unknown' ? (heuristics.length ? 'phishing' : 'unknown') : hf.label
      const confidence = Math.round((hf.score || (label === 'phishing' ? 0.7 : 0.5)) * 100)
      const explanation = heuristics[0] || (label === 'phishing' ? 'This site shows signs of phishing.' : 'No clear phishing signs detected.')

      const finalResult: DetectionResult = { label, confidence, explanation, url }
      setResult(finalResult)

      // Save history
      const { history = [] } = await chrome.storage.local.get('history')
      await chrome.storage.local.set({ history: [{ ...finalResult, time: Date.now() }, ...history].slice(0, 50) })

      // Badge
      if (label === 'phishing') {
        await chrome.action.setBadgeText({ text: '!' })
        await chrome.action.setBadgeBackgroundColor({ color: '#ef4444' })
      } else {
        await chrome.action.setBadgeText({ text: '' })
      }
    } catch (e: any) {
      setError(e.message || 'Failed to analyze this site.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-[340px] p-4 bg-white text-gray-900">
      <div className={classNames('border rounded-xl p-4 shadow-sm', cardColor)}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">CyberGuard</h2>
          <Badge label={result.label} />
        </div>
        <div className="mt-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Verdict:</span>
            <span>{result.label === 'phishing' ? 'Risky' : result.label === 'safe' ? 'Safe' : 'Unknown'}</span>
            {result.confidence > 0 && (
              <span className="text-gray-500">({result.confidence}%)</span>
            )}
          </div>
          <div className="mt-2">
            <div className="font-medium text-sm mb-1">Explanation</div>
            <p className="text-gray-700 text-sm leading-5">{result.explanation}</p>
          </div>
          <div className="mt-3">
            <div className="font-medium text-sm mb-1">Recommended action</div>
            <p className="text-gray-700 text-sm leading-5">{recommendedAction(result.label)}</p>
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <button
          onClick={analyze}
          disabled={isLoading}
          className="mt-4 w-full bg-gray-900 text-white rounded-lg py-2 text-sm hover:bg-black disabled:opacity-50"
        >
          {isLoading ? 'Checking…' : 'Check This Site'}
        </button>
        <div className="mt-3 flex justify-between text-xs text-gray-500">
          <a href="#" id="open-settings" onClick={async (e) => { e.preventDefault(); await chrome.runtime.openOptionsPage?.() }}>Settings</a>
          <a href="#" id="open-history" onClick={async (e) => { e.preventDefault(); await chrome.tabs.create({ url: 'history.html' }) }}>History</a>
        </div>
      </div>
    </div>
  )
}

