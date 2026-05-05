import { describe, it, expect } from 'vitest'
import { normalise } from './normalise'

describe('normalise', () => {
  it('trims leading and trailing whitespace', () => {
    expect(normalise('  hello  ')).toBe('hello')
  })

  it('lowercases', () => {
    expect(normalise('Hello')).toBe('hello')
    expect(normalise('AU REVOIR')).toBe('au revoir')
  })

  it('collapses internal spaces', () => {
    expect(normalise('thank  you')).toBe('thank you')
    expect(normalise('au   revoir')).toBe('au revoir')
  })

  it('combines trim, lowercase, and collapse', () => {
    expect(normalise('  Thank   You  ')).toBe('thank you')
  })

  it('handles empty string', () => {
    expect(normalise('')).toBe('')
  })

  it('handles already-normalised input unchanged', () => {
    expect(normalise('bonjour')).toBe('bonjour')
  })
})
