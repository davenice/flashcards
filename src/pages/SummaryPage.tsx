import { useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import type { SessionState } from '../types'
import type { SessionAction } from '../state/sessionReducer'
import { mergeSessionResults } from '../utils/resultStorage'

interface Props {
  session: SessionState
  dispatch: React.Dispatch<SessionAction>
}

const SCORE_EMOJI = (pct: number) => {
  if (pct === 100) return '🏆'
  if (pct >= 80) return '⭐'
  if (pct >= 60) return '👍'
  return '💪'
}

const SCORE_MESSAGE = (pct: number) => {
  if (pct === 100) return 'Perfect score!'
  if (pct >= 80) return 'Great work!'
  if (pct >= 60) return 'Good effort!'
  return 'Keep practising!'
}

export function SummaryPage({ session, dispatch }: Props) {
  const navigate = useNavigate()

  useEffect(() => {
    if (session.results.length > 0) mergeSessionResults(session.results)
  }, [])

  if (session.results.length === 0) return <Navigate to="/" replace />

  const answeredCount = session.results.length
  const totalCards = session.cards.length
  const endedEarly = answeredCount < totalCards

  const correct = session.results.filter(r => r.result === 'correct' || r.result === 'overridden').length
  const pct = Math.round((correct / answeredCount) * 100)
  const wrong = session.results.filter(r => r.result === 'incorrect')

  function handleRetest() {
    const wrongCards = wrong.map(r => r.sessionCard)
    dispatch({ type: 'START_SESSION', cards: wrongCards })
    navigate('/session')
  }

  function handleStartOver() {
    dispatch({ type: 'RESET' })
    navigate('/')
  }

  function handleNewSession() {
    navigate('/setup')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-4 pt-8">
      <div className="w-full max-w-lg space-y-6">

        {/* Score card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <p className="text-6xl mb-3" role="img" aria-label={SCORE_MESSAGE(pct)}>
            {SCORE_EMOJI(pct)}
          </p>
          <p className="text-4xl font-bold text-slate-800 mb-1">{correct} / {answeredCount}</p>
          <p className="text-slate-500">{pct}% — {SCORE_MESSAGE(pct)}</p>
          {endedEarly && (
            <p className="text-sm text-slate-400 mt-2">
              Ended after {answeredCount} of {totalCards} cards
            </p>
          )}
        </div>

        {/* Wrong answers */}
        {wrong.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Missed ({wrong.length})
            </h2>
            <ul className="space-y-2">
              {wrong.map((r, i) => (
                <li key={i} className="flex justify-between items-baseline text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                  <span className="font-medium text-slate-700">{r.sessionCard.prompt}</span>
                  <span className="text-slate-500 ml-4">{r.sessionCard.answer}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {wrong.length > 0 && (
            <button
              onClick={handleRetest}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors min-h-[44px]"
            >
              Retest {wrong.length} missed card{wrong.length !== 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={handleNewSession}
            className="w-full py-3 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors min-h-[44px]"
          >
            New session
          </button>
          <button
            onClick={handleStartOver}
            className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Load a different deck
          </button>
        </div>
      </div>
    </div>
  )
}
