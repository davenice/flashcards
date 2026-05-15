export interface Card {
  french: string
  english: string
  sectionPath: [string, string, string] // [themeName, unitName, sectionName]
}

export interface Section {
  name: string
  cards: Card[]
}

export interface Unit {
  name: string
  sections: Section[]
}

export interface Theme {
  name: string
  units: Unit[]
}

export interface Deck {
  themes: Theme[]
  allCards: Card[]
}

export interface SavedDeck {
  id: string        // djb2 hash of raw content — used for dedup
  label: string     // first # heading, or filename without extension
  raw: string       // original markdown — re-parsed on select
  savedAt: number   // Date.now()
  cardCount: number
  isSample?: boolean
}

export interface CardStats {
  french: string
  english: string
  correct: number   // cumulative correct + overridden
  incorrect: number // cumulative incorrect
  lastSeen: number  // Date.now() of most recent session
}

export type Direction = 'fr-to-en' | 'en-to-fr'

export interface SessionCard {
  card: Card
  prompt: string
  answer: string
}

export type AnswerResult = 'correct' | 'incorrect' | 'overridden'

export interface SessionCardResult {
  sessionCard: SessionCard
  userAnswer: string
  result: AnswerResult
  canonicalAnswer?: string  // set when answer was accepted but not an exact match
}

export type SessionPhase = 'answering' | 'revealing' | 'complete'

export interface SessionState {
  cards: SessionCard[]
  currentIndex: number
  phase: SessionPhase
  lastUserAnswer: string
  results: SessionCardResult[]
}
