import { describe, it, expect } from 'vitest'
import { sessionReducer, initialSessionState } from './sessionReducer'
import type { SessionCard } from '../types'

const card = (french: string, english: string): SessionCard => ({
  card: { french, english, sectionPath: ['T', 'U', 'S'] },
  prompt: french,
  answer: english,
})

const cards = [card('bonjour', 'hello'), card('merci', 'thank you')]

describe('sessionReducer', () => {
  it('START_SESSION initialises state', () => {
    const state = sessionReducer(initialSessionState, { type: 'START_SESSION', cards })
    expect(state.cards).toHaveLength(2)
    expect(state.currentIndex).toBe(0)
    expect(state.phase).toBe('answering')
    expect(state.results).toHaveLength(0)
  })

  it('SUBMIT_ANSWER marks correct answer', () => {
    let state = sessionReducer(initialSessionState, { type: 'START_SESSION', cards })
    state = sessionReducer(state, { type: 'SUBMIT_ANSWER', userAnswer: 'hello' })
    expect(state.phase).toBe('revealing')
    expect(state.results[0].result).toBe('correct')
  })

  it('SUBMIT_ANSWER is case-insensitive', () => {
    let state = sessionReducer(initialSessionState, { type: 'START_SESSION', cards })
    state = sessionReducer(state, { type: 'SUBMIT_ANSWER', userAnswer: 'Hello' })
    expect(state.results[0].result).toBe('correct')
  })

  it('SUBMIT_ANSWER marks incorrect answer', () => {
    let state = sessionReducer(initialSessionState, { type: 'START_SESSION', cards })
    state = sessionReducer(state, { type: 'SUBMIT_ANSWER', userAnswer: 'goodbye' })
    expect(state.results[0].result).toBe('incorrect')
  })

  it('OVERRIDE_CORRECT changes last result to overridden', () => {
    let state = sessionReducer(initialSessionState, { type: 'START_SESSION', cards })
    state = sessionReducer(state, { type: 'SUBMIT_ANSWER', userAnswer: 'wrong' })
    state = sessionReducer(state, { type: 'OVERRIDE_CORRECT' })
    expect(state.results[0].result).toBe('overridden')
    expect(state.phase).toBe('revealing')
  })

  it('ADVANCE moves to next card', () => {
    let state = sessionReducer(initialSessionState, { type: 'START_SESSION', cards })
    state = sessionReducer(state, { type: 'SUBMIT_ANSWER', userAnswer: 'hello' })
    state = sessionReducer(state, { type: 'ADVANCE' })
    expect(state.currentIndex).toBe(1)
    expect(state.phase).toBe('answering')
  })

  it('ADVANCE on last card sets phase to complete', () => {
    let state = sessionReducer(initialSessionState, { type: 'START_SESSION', cards })
    state = sessionReducer(state, { type: 'SUBMIT_ANSWER', userAnswer: 'hello' })
    state = sessionReducer(state, { type: 'ADVANCE' })
    state = sessionReducer(state, { type: 'SUBMIT_ANSWER', userAnswer: 'thank you' })
    state = sessionReducer(state, { type: 'ADVANCE' })
    expect(state.phase).toBe('complete')
  })

  it('END_EARLY during answering sets phase to complete without adding a result', () => {
    let state = sessionReducer(initialSessionState, { type: 'START_SESSION', cards })
    state = sessionReducer(state, { type: 'END_EARLY' })
    expect(state.phase).toBe('complete')
    expect(state.results).toHaveLength(0)
    expect(state.currentIndex).toBe(0)
  })

  it('END_EARLY during revealing preserves existing results', () => {
    let state = sessionReducer(initialSessionState, { type: 'START_SESSION', cards })
    state = sessionReducer(state, { type: 'SUBMIT_ANSWER', userAnswer: 'hello' })
    state = sessionReducer(state, { type: 'END_EARLY' })
    expect(state.phase).toBe('complete')
    expect(state.results).toHaveLength(1)
    expect(state.results[0].result).toBe('correct')
  })

  it('RESET returns to initial state', () => {
    let state = sessionReducer(initialSessionState, { type: 'START_SESSION', cards })
    state = sessionReducer(state, { type: 'SUBMIT_ANSWER', userAnswer: 'hello' })
    state = sessionReducer(state, { type: 'RESET' })
    expect(state).toEqual(initialSessionState)
  })
})
