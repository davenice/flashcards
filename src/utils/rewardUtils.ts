import type { SessionCardResult, CardStats } from '../types'

export type RewardType = 'redemption' | 'milestone'

export interface RewardEvent {
  type: RewardType
  emoji: string
  label: string
  leftPercent: number
  animationClass: string
}

function milestoneEmoji(correctCount: number): { emoji: string; label: string } | null {
  if (correctCount === 0 || correctCount % 5 !== 0) return null
  if (correctCount >= 15) return { emoji: '🗼', label: `${correctCount} correct!` }
  if (correctCount >= 10) return { emoji: '🪗', label: '10 correct!' }
  return { emoji: '🥐', label: '5 correct!' }
}

export function computeReward(
  result: SessionCardResult,
  allResults: SessionCardResult[],
  historicalStats: Map<string, CardStats>
): RewardEvent | null {
  const isCorrect = result.result === 'correct' || result.result === 'overridden'
  if (!isCorrect) return null

  const { french, english } = result.sessionCard.card
  const stats = historicalStats.get(`${french}|||${english}`)
  const leftPercent = Math.floor(Math.random() * 76) + 5

  if (stats && stats.incorrect > 0) {
    return {
      type: 'redemption',
      emoji: '🔥',
      label: 'Redemption!',
      leftPercent,
      animationClass: 'animate-fall-redemption',
    }
  }

  const correctCount = allResults.filter(
    r => r.result === 'correct' || r.result === 'overridden'
  ).length
  const milestone = milestoneEmoji(correctCount)
  if (milestone) {
    return {
      type: 'milestone',
      emoji: milestone.emoji,
      label: milestone.label,
      leftPercent,
      animationClass: milestone.emoji === '🗼' ? 'animate-fall-diamond' : 'animate-fall-milestone',
    }
  }

  return null
}
