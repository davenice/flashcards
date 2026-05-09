import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { SessionState, SessionCard } from '../types'
import type { SessionAction } from '../state/sessionReducer'
import { FlashCard } from '../components/FlashCard'
import { AnswerInput } from '../components/AnswerInput'
import { FeedbackPanel } from '../components/FeedbackPanel'
import { ProgressBar } from '../components/ProgressBar'

interface Props {
  session: SessionState
  dispatch: React.Dispatch<SessionAction>
}

export function SessionPage({ session, dispatch }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const retestCards = (location.state as { retestCards?: SessionCard[] } | null)?.retestCards ?? []

  useEffect(() => {
    if (retestCards.length > 0) {
      dispatch({ type: 'START_SESSION', cards: retestCards })
    } else if (session.cards.length === 0) {
      navigate('/setup')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Guard: on retest mount, phase is already 'complete' — don't navigate until this session reaches 'answering' first.
  const hasAnsweredRef = useRef(session.phase === 'answering')
  useEffect(() => {
    if (session.phase === 'answering') hasAnsweredRef.current = true
    if (session.phase === 'complete' && hasAnsweredRef.current) navigate('/summary')
  }, [session.phase, navigate])

  if (session.cards.length === 0 || session.phase === 'complete') return null

  const current = session.cards[session.currentIndex]
  const lastResult = session.results[session.results.length - 1]
  const isLast = session.currentIndex === session.cards.length - 1
  const directionLabel = current.prompt === current.card.french ? 'French → English' : 'English → French'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-4 pt-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <ProgressBar current={session.currentIndex} total={session.cards.length} />
          </div>
          <button
            onClick={() => dispatch({ type: 'END_EARLY' })}
            className="shrink-0 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="End test early"
          >
            End test
          </button>
        </div>

        <FlashCard prompt={current.prompt} direction={directionLabel} />

        {session.phase === 'answering' && (
          <AnswerInput
            key={session.currentIndex}
            onSubmit={answer => dispatch({ type: 'SUBMIT_ANSWER', userAnswer: answer })}
          />
        )}

        {session.phase === 'revealing' && lastResult && (
          <FeedbackPanel
            result={lastResult.result}
            correctAnswer={current.answer}
            canonicalAnswer={lastResult.canonicalAnswer}
            userAnswer={session.lastUserAnswer}
            onOverride={() => {
              dispatch({ type: 'OVERRIDE_CORRECT' })
              dispatch({ type: 'ADVANCE' })
            }}
            onNext={() => dispatch({ type: 'ADVANCE' })}
            isLast={isLast}
          />
        )}
      </div>
    </div>
  )
}
