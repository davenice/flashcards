import type { Card, Deck, Direction, SessionCard } from '../types'

export interface SelectionState {
  // Set of sectionPath keys: "themeName|||unitName|||sectionName"
  selectedSections: Set<string>
}

function sectionKey(sectionPath: [string, string, string]): string {
  return sectionPath.join('|||')
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function cardToSessionCard(card: Card, direction: Direction): SessionCard {
  return {
    card,
    prompt: direction === 'fr-to-en' ? card.french : card.english,
    answer: direction === 'fr-to-en' ? card.english : card.french,
  }
}

export function buildDeck(
  deck: Deck,
  selection: SelectionState,
  direction: Direction,
  limit?: number,
): SessionCard[] {
  const filtered: Card[] =
    selection.selectedSections.size === 0
      ? deck.allCards
      : deck.allCards.filter(c => selection.selectedSections.has(sectionKey(c.sectionPath)))

  const shuffled = shuffle(filtered.map(c => cardToSessionCard(c, direction)))
  return limit != null && limit < shuffled.length ? shuffled.slice(0, limit) : shuffled
}

export { sectionKey }
