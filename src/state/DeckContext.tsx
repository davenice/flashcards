import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Deck } from '../types'

interface DeckContextValue {
  deck: Deck | null
  setDeck: (deck: Deck) => void
}

const DeckContext = createContext<DeckContextValue | null>(null)

export function DeckProvider({ children }: { children: ReactNode }) {
  const [deck, setDeck] = useState<Deck | null>(null)
  return <DeckContext.Provider value={{ deck, setDeck }}>{children}</DeckContext.Provider>
}

export function useDeck(): DeckContextValue {
  const ctx = useContext(DeckContext)
  if (!ctx) throw new Error('useDeck must be used within DeckProvider')
  return ctx
}
