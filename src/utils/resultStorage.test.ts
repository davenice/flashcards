import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadCardStats, hasAnyStats, mergeSessionResults } from './resultStorage'
import type { SessionCardResult } from '../types'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
vi.stubGlobal('localStorage', localStorageMock)

function makeResult(
  french: string,
  english: string,
  result: 'correct' | 'incorrect' | 'overridden',
): SessionCardResult {
  return {
    sessionCard: {
      card: { french, english, sectionPath: ['T', 'U', 'S'] },
      prompt: french,
      answer: english,
    },
    userAnswer: result === 'correct' ? english : 'wrong',
    result,
  }
}

beforeEach(() => localStorage.clear())

describe('loadCardStats', () => {
  it('returns empty array when nothing stored', () => {
    expect(loadCardStats()).toEqual([])
  })

  it('returns empty array on corrupt JSON', () => {
    localStorage.setItem('flashcards:results', 'not-json{{{')
    expect(loadCardStats()).toEqual([])
  })
})

describe('hasAnyStats', () => {
  it('returns false when nothing stored', () => {
    expect(hasAnyStats()).toBe(false)
  })

  it('returns false on corrupt JSON', () => {
    localStorage.setItem('flashcards:results', 'not-json{{{')
    expect(hasAnyStats()).toBe(false)
  })

  it('returns true after a session is merged', () => {
    mergeSessionResults([makeResult('bonjour', 'hello', 'correct')])
    expect(hasAnyStats()).toBe(true)
  })
})

describe('mergeSessionResults', () => {
  it('creates a record for a correct result', () => {
    mergeSessionResults([makeResult('bonjour', 'hello', 'correct')])
    const stats = loadCardStats()
    expect(stats).toHaveLength(1)
    expect(stats[0]).toMatchObject({ french: 'bonjour', english: 'hello', correct: 1, incorrect: 0 })
  })

  it('creates a record for an incorrect result', () => {
    mergeSessionResults([makeResult('bonjour', 'hello', 'incorrect')])
    const stats = loadCardStats()
    expect(stats[0]).toMatchObject({ correct: 0, incorrect: 1 })
  })

  it('counts overridden as correct', () => {
    mergeSessionResults([makeResult('bonjour', 'hello', 'overridden')])
    const stats = loadCardStats()
    expect(stats[0]).toMatchObject({ correct: 1, incorrect: 0 })
  })

  it('accumulates counts across two sessions', () => {
    mergeSessionResults([makeResult('bonjour', 'hello', 'correct')])
    mergeSessionResults([makeResult('bonjour', 'hello', 'incorrect')])
    const stats = loadCardStats()
    expect(stats).toHaveLength(1)
    expect(stats[0]).toMatchObject({ correct: 1, incorrect: 1 })
  })

  it('handles the same card answered twice in one session', () => {
    mergeSessionResults([
      makeResult('bonjour', 'hello', 'correct'),
      makeResult('bonjour', 'hello', 'incorrect'),
    ])
    const stats = loadCardStats()
    expect(stats).toHaveLength(1)
    expect(stats[0]).toMatchObject({ correct: 1, incorrect: 1 })
  })

  it('creates separate records for different cards', () => {
    mergeSessionResults([
      makeResult('bonjour', 'hello', 'correct'),
      makeResult('merci', 'thank you', 'incorrect'),
    ])
    const stats = loadCardStats()
    expect(stats).toHaveLength(2)
  })
})
