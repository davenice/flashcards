import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SessionState } from '../types'
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

  useEffect(() => {
    if (session.cards.length === 0) {
      navigate('/setup')
    }
  }, [session.cards.length, navigate])

  useEffect(() => {
    if (session.phase === 'complete') {
      navigate('/summary')
    }
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
