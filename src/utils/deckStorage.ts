import type { SavedDeck } from '../types'

const STORAGE_KEY = 'flashcards:decks'
const SEEDED_KEY = 'flashcards:seeded'

export function hasBeenSeeded(): boolean {
  return localStorage.getItem(SEEDED_KEY) === 'true'
}

export function markSeeded(): void {
  localStorage.setItem(SEEDED_KEY, 'true')
}

export function hashContent(raw: string): string {
  let hash = 5381
  for (let i = 0; i < raw.length; i++) {
    hash = (((hash << 5) + hash) ^ raw.charCodeAt(i)) >>> 0
  }
  return hash.toString(16)
}

export function loadSavedDecks(): SavedDeck[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as SavedDeck[]) : []
  } catch {
    return []
  }
}

export function persistDecks(decks: SavedDeck[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks))
}
