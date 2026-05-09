import { useState, useEffect } from 'react'
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
  const [direction, setDirection] = useState<Direction>('en-to-fr')
  const [questionCount, setQuestionCount] = useState<number>(0)
  const [isManual, setIsManual] = useState(false)

  if (!deck) return <Navigate to="/" replace />
  const loadedDeck = deck

  const totalSelected = selected.size === 0
    ? deck.allCards.length
    : loadedDeck.themes.flatMap(t => t.units.flatMap(u =>
        u.sections.filter(s => {
          const key = [t.name, u.name, s.name].join('|||')
          return selected.has(key)
        }).flatMap(s => s.cards)
      )).length

  useEffect(() => {
    if (!isManual) {
      setQuestionCount(totalSelected)
    } else {
      setQuestionCount(prev => prev > totalSelected ? totalSelected : prev)
    }
  }, [totalSelected, isManual])

  const effectiveCount = Math.min(Math.max(1, questionCount), totalSelected)
  const isLimited = effectiveCount < totalSelected

  function adjust(delta: number) {
    setIsManual(true)
    setQuestionCount(c => Math.min(totalSelected, Math.max(1, c + delta)))
  }

  function handleCountInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value, 10)
    if (!isNaN(v)) {
      setIsManual(true)
      setQuestionCount(Math.min(Math.max(1, v), totalSelected))
    }
  }

  function resetToAll() {
    setIsManual(false)
    setQuestionCount(totalSelected)
  }

  function handleStart() {
    const cards = buildDeck(
      loadedDeck,
      { selectedSections: selected },
      direction,
      isLimited ? effectiveCount : undefined,
    )
    if (cards.length === 0) return
    dispatch({ type: 'START_SESSION', cards })
    navigate('/session')
  }

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

        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Sections
            <span className="ml-2 normal-case font-normal text-slate-400">
              (leave all unchecked to study everything)
            </span>
          </h2>
          <HierarchySelector deck={loadedDeck} selected={selected} onChange={setSelected} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Questions
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjust(-1)}
              disabled={effectiveCount <= 1}
              className="w-9 h-9 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease question count"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={totalSelected}
              value={effectiveCount}
              onChange={handleCountInput}
              className="w-16 text-center border border-slate-200 rounded-lg py-1.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Number of questions"
            />
            <button
              onClick={() => adjust(1)}
              disabled={effectiveCount >= totalSelected}
              className="w-9 h-9 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase question count"
            >
              +
            </button>
            <span className="text-sm text-slate-400">
              of {totalSelected} available
            </span>
            {isLimited && (
              <button
                onClick={resetToAll}
                className="ml-auto text-xs text-indigo-500 hover:text-indigo-700"
              >
                All
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={totalSelected === 0}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Start — {effectiveCount} card{effectiveCount !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}
