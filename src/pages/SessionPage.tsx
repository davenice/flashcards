import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { SessionState, SessionCard } from '../types'
import type { SessionAction } from '../state/sessionReducer'
import type { RewardEvent } from '../utils/rewardUtils'
import { FlashCard } from '../components/FlashCard'
import { AnswerInput } from '../components/AnswerInput'
import { FeedbackPanel } from '../components/FeedbackPanel'
import { ProgressBar } from '../components/ProgressBar'
import { CorkBoard } from '../components/CorkBoard'
import type { TrophyItem } from '../components/CorkBoard'
import { FallingEmoji } from '../components/FallingEmoji'
import { loadCardStats } from '../utils/resultStorage'
import { computeReward } from '../utils/rewardUtils'

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

  // Historical stats loaded once at mount for redemption detection
  const historicalStats = useMemo(() => {
    const stats = loadCardStats()
    return new Map(stats.map(s => [`${s.french}|||${s.english}`, s]))
  }, [])

  const [cabinetItems, setCabinetItems] = useState<TrophyItem[]>([])
  const [fallingEmojis, setFallingEmojis] = useState<Array<RewardEvent & { id: string }>>([])
  const [lastRewardType, setLastRewardType] = useState<RewardEvent['type'] | null>(null)
  const [lastMilestoneCount, setLastMilestoneCount] = useState<number>(5)
  const prevResultsLenRef = useRef(0)

  // Detect rewards on new answers
  useEffect(() => {
    const curr = session.results.length
    if (curr <= prevResultsLenRef.current) {
      prevResultsLenRef.current = curr
      return
    }
    prevResultsLenRef.current = curr
    const lastResult = session.results[curr - 1]
    const reward = computeReward(lastResult, session.results, historicalStats)
    if (reward) {
      const id = `${Date.now()}-${curr}`
      setCabinetItems(prev => [...prev, { id, emoji: reward.emoji, label: reward.label }])
      setFallingEmojis(prev => [...prev, { ...reward, id }])
      setLastRewardType(reward.type)
      if (reward.type === 'milestone') {
        const correctCount = session.results.filter(
          r => r.result === 'correct' || r.result === 'overridden'
        ).length
        setLastMilestoneCount(correctCount)
      }
    } else {
      setLastRewardType(null)
    }
  }, [session.results.length])

  // Detect milestones created by override (no length change, result changes)
  const lastResult = session.results[session.results.length - 1]
  useEffect(() => {
    if (!lastResult || lastResult.result !== 'overridden') return
    const reward = computeReward(lastResult, session.results, historicalStats)
    if (reward) {
      const id = `override-${Date.now()}`
      setCabinetItems(prev => [...prev, { id, emoji: reward.emoji, label: reward.label }])
      setFallingEmojis(prev => [...prev, { ...reward, id }])
      setLastRewardType(reward.type)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResult?.result])

  // Clear reward type when advancing to next card
  useEffect(() => {
    if (session.phase === 'answering') setLastRewardType(null)
  }, [session.phase])

  if (session.cards.length === 0 || session.phase === 'complete') return null

  const current = session.cards[session.currentIndex]
  const isLast = session.currentIndex === session.cards.length - 1
  const directionLabel = current.prompt === current.card.french ? 'French → English' : 'English → French'
  const showCabinet = cabinetItems.length > 0

  return (
    <div className={`min-h-svh bg-gradient-to-b from-slate-100 to-slate-50 flex flex-col items-center justify-start p-4 pt-8 ${showCabinet ? 'pb-16' : ''}`}>
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <ProgressBar current={session.currentIndex} total={session.cards.length} />
          </div>
          <button
            onClick={() => dispatch({ type: 'END_EARLY' })}
            className="shrink-0 text-sm text-slate-300 hover:text-red-400 transition-colors"
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
            rewardType={lastRewardType}
            milestoneCount={lastMilestoneCount}
            onOverride={() => {
              dispatch({ type: 'OVERRIDE_CORRECT' })
              dispatch({ type: 'ADVANCE' })
            }}
            onNext={() => dispatch({ type: 'ADVANCE' })}
            isLast={isLast}
          />
        )}
      </div>

      {fallingEmojis.map(e => (
        <FallingEmoji
          key={e.id}
          id={e.id}
          emoji={e.emoji}
          label={e.label}
          leftPercent={e.leftPercent}
          animationClass={e.animationClass}
          onAnimationEnd={id => setFallingEmojis(prev => prev.filter(x => x.id !== id))}
        />
      ))}

      {showCabinet && <CorkBoard items={cabinetItems} />}
    </div>
  )
}
