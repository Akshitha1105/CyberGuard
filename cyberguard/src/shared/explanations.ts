export function buildExplanation(_url: string, heuristics: string[], modelLabel: 'phishing' | 'safe' | 'unknown', modelConfidence: number): string {
  if (heuristics.length > 0) return heuristics[0]
  if (modelLabel === 'phishing' && modelConfidence >= 0.6) return 'This site likely tries to trick you into sharing data.'
  if (modelLabel === 'safe' && modelConfidence >= 0.6) return 'No obvious red flags found.'
  return 'We could not determine the risk clearly.'
}

