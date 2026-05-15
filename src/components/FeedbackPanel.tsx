import { useMemo } from 'react'
import type { AnswerResult } from '../types'
import type { RewardType } from '../utils/rewardUtils'
import { getCorrectMessage, getIncorrectMessage, getRedemptionMessage, getMilestoneMessage } from '../utils/messages'

interface Props {
  result: AnswerResult
  correctAnswer: string
  canonicalAnswer?: string
  userAnswer: string
  onOverride: () => void
  onNext: () => void
  isLast: boolean
  rewardType?: RewardType | null
  milestoneCount?: number
}

export function FeedbackPanel({
  result,
  correctAnswer,
  canonicalAnswer,
  userAnswer,
  onOverride,
  onNext,
  isLast,
  rewardType,
  milestoneCount,
}: Props) {
  const isCorrect = result === 'correct' || result === 'overridden'

  const rewardMessage = useMemo(() => {
    if (rewardType === 'redemption') return getRedemptionMessage()
    if (rewardType === 'milestone') return getMilestoneMessage(milestoneCount ?? 5)
    return null
  }, [rewardType])

  const headingMessage = useMemo(() => {
    if (isCorrect) return getCorrectMessage()
    return getIncorrectMessage()
  }, [result])

  const boxClass = isCorrect
    ? rewardType === 'redemption'
      ? 'bg-amber-50 border-amber-300 animate-redemption-glow'
      : 'bg-green-50 border-green-300 animate-correct-pulse'
    : 'bg-red-50 border-red-300 animate-shake'

  const headingClass = isCorrect
    ? rewardType === 'redemption'
      ? 'text-amber-700'
      : 'text-green-700'
    : 'text-red-700'

  const headingIcon = isCorrect
    ? rewardType === 'redemption' ? '🔥' : '✓'
    : '✗'

  return (
    <div className="w-full space-y-3" role="status" aria-live="polite">
      {rewardMessage && (
        <div
          role="status"
          aria-live="assertive"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold animate-slide-up-fade ${
            rewardType === 'redemption'
              ? 'bg-amber-100 border border-amber-300 text-amber-800'
              : 'bg-violet-100 border border-violet-300 text-violet-800'
          }`}
        >
          {rewardType === 'redemption' ? '🔥' : '🥐'} {rewardMessage}
        </div>
      )}

      <div className={`rounded-xl p-5 border ${boxClass}`}>
        <p className={`text-lg font-bold mb-1 ${headingClass}`}>
          {headingIcon} {headingMessage}
        </p>
        {isCorrect && canonicalAnswer && (
          <p className="text-sm text-green-700 mt-1">Expected: <span className="font-semibold">{canonicalAnswer}</span></p>
        )}
        {!isCorrect && (
          <>
            <p className="text-sm text-slate-500 mt-2">You wrote: <span className="font-medium text-slate-700">{userAnswer}</span></p>
            <p className="text-sm text-slate-500 mt-1">Correct answer: <span className="font-semibold text-slate-800">{correctAnswer}</span></p>
          </>
        )}
      </div>

      {result === 'incorrect' && (
        <button
          onClick={onOverride}
          className="w-full py-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px]"
        >
          Actually I was right
        </button>
      )}

      <button
        onClick={onNext}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-md active:scale-95 transition-all min-h-[44px]"
        autoFocus
      >
        {isLast ? 'See results' : 'Next →'}
      </button>
    </div>
  )
}
