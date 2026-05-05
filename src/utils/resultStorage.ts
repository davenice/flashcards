import type { CardStats, SessionCardResult } from '../types'

const STORAGE_KEY = 'flashcards:results'

function cardKey(french: string, english: string): string {
  return `${french}|||${english}`
}

export function loadCardStats(): CardStats[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as CardStats[]) : []
  } catch {
    return []
  }
}

export function hasAnyStats(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return false
    return (JSON.parse(stored) as CardStats[]).length > 0
  } catch {
    return false
  }
}

export function mergeSessionResults(results: SessionCardResult[]): void {
  const existing = loadCardStats()
  const map = new Map<string, CardStats>(
    existing.map(s => [cardKey(s.french, s.english), s])
  )

  const now = Date.now()

  for (const r of results) {
    const { french, english } = r.sessionCard.card
    const key = cardKey(french, english)
    const prev = map.get(key) ?? { french, english, correct: 0, incorrect: 0, lastSeen: now }
    const isCorrect = r.result === 'correct' || r.result === 'overridden'
    map.set(key, {
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      lastSeen: now,
    })
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify([...map.values()]))
}
