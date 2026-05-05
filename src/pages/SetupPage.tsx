import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useDeck } from '../state/DeckContext'
import { HierarchySelector } from '../components/HierarchySelector'
import { DirectionToggle } from '../components/DirectionToggle'
import { buildDeck } from '../utils/buildDeck'
import type { Direction } from '../types'
import type { SessionAction } from '../state/sessionReducer'

interface Props {
  dispatch: React.Dispatch<SessionAction>
}

export function SetupPage({ dispatch }: Props) {
  const { deck } = useDeck()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [direction, setDirection] = useState<Direction>('fr-to-en')

  if (!deck) return <Navigate to="/" replace />
  const loadedDeck = deck

  function handleStart() {
    const cards = buildDeck(loadedDeck, { selectedSections: selected }, direction)
    if (cards.length === 0) return
    dispatch({ type: 'START_SESSION', cards })
    navigate('/session')
  }

  const totalSelected = selected.size === 0
    ? deck.allCards.length
    : loadedDeck.themes.flatMap(t => t.units.flatMap(u =>
        u.sections.filter(s => {
          const key = [t.name, u.name, s.name].join('|||')
          return selected.has(key)
        }).flatMap(s => s.cards)
      )).length

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-4 pt-8">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Choose your session</h1>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-slate-400 hover:text-slate-600"
            aria-label="Back to home"
          >
            ← Back
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Direction</h2>
          <DirectionToggle value={direction} onChange={setDirection} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Sections
            <span className="ml-2 normal-case font-normal text-slate-400">
              (leave all unchecked to study everything)
            </span>
          </h2>
          <HierarchySelector deck={loadedDeck} selected={selected} onChange={setSelected} />
        </div>

        <button
          onClick={handleStart}
          disabled={totalSelected === 0}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Start — {totalSelected} card{totalSelected !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}
