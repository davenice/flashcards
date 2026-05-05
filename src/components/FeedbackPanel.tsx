import type { AnswerResult } from '../types'

interface Props {
  result: AnswerResult
  correctAnswer: string
  userAnswer: string
  onOverride: () => void
  onNext: () => void
  isLast: boolean
}

export function FeedbackPanel({ result, correctAnswer, userAnswer, onOverride, onNext, isLast }: Props) {
  const isCorrect = result === 'correct' || result === 'overridden'

  return (
    <div className="w-full space-y-4" role="status" aria-live="polite">
      <div className={`rounded-xl p-5 border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <p className={`text-lg font-bold mb-1 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
          {isCorrect ? '✓ Correct' : '✗ Not quite'}
        </p>
        {!isCorrect && (
          <>
            <p className="text-sm text-slate-500">You wrote: <span className="font-medium text-slate-700">{userAnswer}</span></p>
            <p className="text-sm text-slate-500 mt-1">Correct answer: <span className="font-semibold text-slate-800">{correctAnswer}</span></p>
          </>
        )}
      </div>

      {result === 'incorrect' && (
        <button
          onClick={onOverride}
          className="w-full py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px]"
        >
          Actually I was right
        </button>
      )}

      <button
        onClick={onNext}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors min-h-[44px]"
        autoFocus
      >
        {isLast ? 'See results' : 'Next →'}
      </button>
    </div>
  )
}
