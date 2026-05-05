import { describe, it, expect, beforeEach, vi } from 'vitest'
import { hashContent, loadSavedDecks, persistDecks } from './deckStorage'
import type { SavedDeck } from '../types'

// In-memory localStorage mock (test environment is Node, no browser APIs)
function makeLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
}

const localStorageMock = makeLocalStorageMock()
vi.stubGlobal('localStorage', localStorageMock)

function makeSaved(overrides: Partial<SavedDeck> = {}): SavedDeck {
  return {
    id: 'abc123',
    label: 'Test Deck',
    raw: '# Test\n## U\n### S\nFrench | English\n--- | ---\nbonjour | hello',
    savedAt: 1000000,
    cardCount: 1,
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('hashContent', () => {
  it('returns the same hash for the same input', () => {
    expect(hashContent('hello')).toBe(hashContent('hello'))
  })

  it('returns different hashes for different inputs', () => {
    expect(hashContent('hello')).not.toBe(hashContent('goodbye'))
  })

  it('returns a non-empty hex string', () => {
    const h = hashContent('test')
    expect(h).toMatch(/^[0-9a-f]+$/)
  })

  it('handles empty string without throwing', () => {
    expect(() => hashContent('')).not.toThrow()
  })
})

describe('loadSavedDecks', () => {
  it('returns empty array when nothing is stored', () => {
    expect(loadSavedDecks()).toEqual([])
  })

  it('returns empty array when stored value is corrupt JSON', () => {
    localStorage.setItem('flashcards:decks', 'not-json{{{')
    expect(loadSavedDecks()).toEqual([])
  })
})

describe('persistDecks + loadSavedDecks', () => {
  it('round-trips a single deck', () => {
    const deck = makeSaved()
    persistDecks([deck])
    expect(loadSavedDecks()).toEqual([deck])
  })

  it('round-trips multiple decks', () => {
    const decks = [makeSaved({ id: '1', label: 'A' }), makeSaved({ id: '2', label: 'B' })]
    persistDecks(decks)
    expect(loadSavedDecks()).toEqual(decks)
  })

  it('overwrites previous value', () => {
    persistDecks([makeSaved({ id: '1', label: 'First' })])
    persistDecks([makeSaved({ id: '2', label: 'Second' })])
    const result = loadSavedDecks()
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('Second')
  })

  it('persisting empty array clears the store', () => {
    persistDecks([makeSaved()])
    persistDecks([])
    expect(loadSavedDecks()).toEqual([])
  })
})
