import type { SessionCard, SessionCardResult, SessionState } from '../types'
import { checkAnswer } from '../utils/checkAnswer'

export type SessionAction =
  | { type: 'START_SESSION'; cards: SessionCard[] }
  | { type: 'SUBMIT_ANSWER'; userAnswer: string }
  | { type: 'OVERRIDE_CORRECT' }
  | { type: 'ADVANCE' }
  | { type: 'END_EARLY' }
  | { type: 'RESET' }

export const initialSessionState: SessionState = {
  cards: [],
  currentIndex: 0,
  phase: 'answering',
  lastUserAnswer: '',
  results: [],
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        cards: action.cards,
        currentIndex: 0,
        phase: 'answering',
        lastUserAnswer: '',
        results: [],
      }

    case 'SUBMIT_ANSWER': {
      const current = state.cards[state.currentIndex]
      const match = checkAnswer(action.userAnswer, current.answer)
      const result: SessionCardResult = {
        sessionCard: current,
        userAnswer: action.userAnswer,
        result: match.outcome !== 'incorrect' ? 'correct' : 'incorrect',
        ...(match.outcome === 'accepted' && { canonicalAnswer: match.canonical }),
      }
      return {
        ...state,
        phase: 'revealing',
        lastUserAnswer: action.userAnswer,
        results: [...state.results, result],
      }
    }

    case 'OVERRIDE_CORRECT': {
      const updated = [...state.results]
      updated[updated.length - 1] = { ...updated[updated.length - 1], result: 'overridden' }
      return { ...state, results: updated }
    }

    case 'ADVANCE': {
      const nextIndex = state.currentIndex + 1
      if (nextIndex >= state.cards.length) {
        return { ...state, currentIndex: nextIndex, phase: 'complete' }
      }
      return { ...state, currentIndex: nextIndex, phase: 'answering', lastUserAnswer: '' }
    }

    case 'END_EARLY':
      return { ...state, phase: 'complete' }

    case 'RESET':
      return initialSessionState

    default:
      return state
  }
}
