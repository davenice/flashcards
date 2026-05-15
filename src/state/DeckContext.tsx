import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Deck, SavedDeck } from '../types'
import { parseMarkdown } from '../parser/parseMarkdown'
import { hashContent, hasBeenSeeded, loadSavedDecks, markSeeded, persistDecks } from '../utils/deckStorage'
import sampleDeckRaw from '../data/sampleDeck.md?raw'

function extractLabel(raw: string, filename: string): string {
  const match = raw.match(/^#\s+(.+)/m)
  return match ? match[1].trim() : filename.replace(/\.md$/i, '')
}

type AddResult = { ok: true } | { ok: false; error: string }

interface DeckContextValue {
  deck: Deck | null
  savedDecks: SavedDeck[]
  addDeck: (raw: string, filename: string) => AddResult
  selectDeck: (saved: SavedDeck) => boolean
  removeDeck: (id: string) => void
}

const DeckContext = createContext<DeckContextValue | null>(null)

export function DeckProvider({ children }: { children: ReactNode }) {
  const [deck, setDeck] = useState<Deck | null>(null)
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>(() => {
    const stored = loadSavedDecks()
    if (!hasBeenSeeded()) {
      markSeeded()
      const parsed = parseMarkdown(sampleDeckRaw)
      if (parsed.ok) {
        const sample: SavedDeck = {
          id: hashContent(sampleDeckRaw),
          label: 'Sample: Common French Words',
          raw: sampleDeckRaw,
          savedAt: Date.now(),
          cardCount: parsed.deck.allCards.length,
          isSample: true,
        }
        const withSample = [sample, ...stored]
        persistDecks(withSample)
        return withSample
      }
    }
    return stored
  })

  function addDeck(raw: string, filename: string): AddResult {
    const id = hashContent(raw)
    const existing = savedDecks.find(d => d.id === id)
    if (existing) {
      selectDeck(existing)
      return { ok: true }
    }

    const parsed = parseMarkdown(raw)
    if (!parsed.ok) return { ok: false, error: parsed.error }

    const saved: SavedDeck = {
      id,
      label: extractLabel(raw, filename),
      raw,
      savedAt: Date.now(),
      cardCount: parsed.deck.allCards.length,
    }

    try {
      const updated = [...savedDecks, saved]
      persistDecks(updated)
      setSavedDecks(updated)
    } catch {
      return { ok: false, error: 'Not enough storage space to save this deck.' }
    }

    setDeck(parsed.deck)
    return { ok: true }
  }

  function selectDeck(saved: SavedDeck): boolean {
    const result = parseMarkdown(saved.raw)
    if (!result.ok) return false
    setDeck(result.deck)
    return true
  }

  function removeDeck(id: string) {
    const updated = savedDecks.filter(d => d.id !== id)
    persistDecks(updated)
    setSavedDecks(updated)
  }

  return (
    <DeckContext.Provider value={{ deck, savedDecks, addDeck, selectDeck, removeDeck }}>
      {children}
    </DeckContext.Provider>
  )
}

export function useDeck(): DeckContextValue {
  const ctx = useContext(DeckContext)
  if (!ctx) throw new Error('useDeck must be used within DeckProvider')
  return ctx
}
