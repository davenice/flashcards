import { describe, it, expect } from 'vitest'
import { buildDeck, sectionKey } from './buildDeck'
import type { Card, Deck } from '../types'

function makeCard(french: string, english: string, path: [string, string, string]): Card {
  return { french, english, sectionPath: path }
}

const s1: [string, string, string] = ['T1', 'U1', 'S1']
const s2: [string, string, string] = ['T1', 'U1', 'S2']

const deck: Deck = {
  themes: [],
  allCards: [
    makeCard('bonjour', 'hello', s1),
    makeCard('merci', 'thank you', s1),
    makeCard('au revoir', 'goodbye', s2),
  ],
}

const noSelection = { selectedSections: new Set<string>() }
const s1Only = { selectedSections: new Set([sectionKey(s1)]) }

describe('buildDeck — selection', () => {
  it('returns all cards when selection is empty', () => {
    const result = buildDeck(deck, noSelection, 'fr-to-en')
    expect(result).toHaveLength(3)
  })

  it('filters to selected section only', () => {
    const result = buildDeck(deck, s1Only, 'fr-to-en')
    expect(result).toHaveLength(2)
    const prompts = result.map(c => c.prompt).sort()
    expect(prompts).toEqual(['bonjour', 'merci'])
  })

  it('returns empty array when selected section has no cards in deck', () => {
    const emptySection = { selectedSections: new Set(['X|||Y|||Z']) }
    expect(buildDeck(deck, emptySection, 'fr-to-en')).toHaveLength(0)
  })
})

describe('buildDeck — direction', () => {
  it('fr-to-en: prompt is French, answer is English', () => {
    const result = buildDeck(deck, s1Only, 'fr-to-en')
    result.forEach(sc => {
      expect(sc.prompt).toBe(sc.card.french)
      expect(sc.answer).toBe(sc.card.english)
    })
  })

  it('en-to-fr: prompt is English, answer is French', () => {
    const result = buildDeck(deck, s1Only, 'en-to-fr')
    result.forEach(sc => {
      expect(sc.prompt).toBe(sc.card.english)
      expect(sc.answer).toBe(sc.card.french)
    })
  })
})

describe('buildDeck — limit', () => {
  it('applies limit when less than pool size', () => {
    const result = buildDeck(deck, noSelection, 'fr-to-en', 2)
    expect(result).toHaveLength(2)
  })

  it('returns all cards when limit equals pool size', () => {
    const result = buildDeck(deck, noSelection, 'fr-to-en', 3)
    expect(result).toHaveLength(3)
  })

  it('returns all cards when limit exceeds pool size', () => {
    const result = buildDeck(deck, noSelection, 'fr-to-en', 99)
    expect(result).toHaveLength(3)
  })

  it('returns all cards when limit is undefined', () => {
    const result = buildDeck(deck, noSelection, 'fr-to-en', undefined)
    expect(result).toHaveLength(3)
  })
})

describe('buildDeck — shuffle', () => {
  it('result contains the same cards regardless of order', () => {
    const result = buildDeck(deck, noSelection, 'fr-to-en')
    const prompts = result.map(c => c.prompt).sort()
    expect(prompts).toEqual(['au revoir', 'bonjour', 'merci'])
  })
})
