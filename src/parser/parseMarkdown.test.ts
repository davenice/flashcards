import { describe, it, expect } from 'vitest'
import { parseMarkdown } from './parseMarkdown'

const REAL_DATA = `
# THEME 1: Aspects of French-speaking society: current trends

## Unit 1: La famille en voie de changement

### 1.1: Notre famille est spéciale
| French | English |
|--------|---------|
| à temps plein/complet | full time |
| alors que | whilst |
| un arrière-grand-père | great-grandfather |

### 1.2: Se marier – oui ou non ?
| French | English |
|--------|---------|
| adopter | to adopt |
| un(e) conjoint(e) | partner; spouse |

## Unit 2: La « cybersociété »

### 2.1: La technologie et la vie quotidienne
| French | English |
|--------|---------|
| un écran large | wide screen |
| acheter en ligne | to buy online |

# THEME 2: Artistic culture in the French-speaking world

## Unit 4: Une culture fière de son patrimoine

### 4.1: C'est quoi exactement, le patrimoine ?
| French | English |
|--------|---------|
| l'aménagement (m) | planning, development |
| les ancêtres (mf pl) | ancestors |
`

const SAMPLE = `
# Theme 1

## Unit 1.1

### Section 1.1.1

French | English
--- | ---
bonjour | hello
merci | thank you

### Section 1.1.2

French | English
--- | ---
au revoir | goodbye
`

describe('parseMarkdown — pipe-bordered table format (real data)', () => {
  it('parses leading/trailing pipe format correctly', () => {
    const result = parseMarkdown(REAL_DATA)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.deck.allCards).toHaveLength(9)
    expect(result.deck.allCards[0].french).toBe('à temps plein/complet')
    expect(result.deck.allCards[0].english).toBe('full time')
  })

  it('does not include header or separator rows as cards', () => {
    const result = parseMarkdown(REAL_DATA)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const cards = result.deck.allCards
    expect(cards.find(c => c.french === 'French')).toBeUndefined()
    expect(cards.find(c => c.french.includes('---'))).toBeUndefined()
  })

  it('handles parentheses and special characters in card values', () => {
    const result = parseMarkdown(REAL_DATA)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const conjoint = result.deck.allCards.find(c => c.french === 'un(e) conjoint(e)')
    expect(conjoint?.english).toBe('partner; spouse')
  })

  it('handles accented characters', () => {
    const result = parseMarkdown(REAL_DATA)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const ecran = result.deck.allCards.find(c => c.french === 'un écran large')
    expect(ecran?.english).toBe('wide screen')
  })
})

describe('parseMarkdown', () => {
  it('parses a valid file correctly', () => {
    const result = parseMarkdown(SAMPLE)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.deck.themes).toHaveLength(1)
    expect(result.deck.themes[0].name).toBe('Theme 1')
    expect(result.deck.themes[0].units[0].name).toBe('Unit 1.1')
    expect(result.deck.themes[0].units[0].sections).toHaveLength(2)
    expect(result.deck.allCards).toHaveLength(3)
  })

  it('skips the header row and separator row', () => {
    const result = parseMarkdown(SAMPLE)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // "French" and "English" and "---" should not appear as card values
    const cards = result.deck.allCards
    expect(cards.find(c => c.french === 'French')).toBeUndefined()
    expect(cards.find(c => c.french === '---')).toBeUndefined()
  })

  it('assigns correct sectionPath to cards', () => {
    const result = parseMarkdown(SAMPLE)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.deck.allCards[0].sectionPath).toEqual(['Theme 1', 'Unit 1.1', 'Section 1.1.1'])
  })

  it('trims whitespace from card values', () => {
    const text = `
# T
## U
### S
French | English
--- | ---
  bonjour  |  hello
`
    const result = parseMarkdown(text)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.deck.allCards[0].french).toBe('bonjour')
    expect(result.deck.allCards[0].english).toBe('hello')
  })

  it('merges duplicate theme names', () => {
    const text = `
# Theme A
## Unit A1
### Section A1.1
French | English
--- | ---
un | one

# Theme A
## Unit A2
### Section A2.1
French | English
--- | ---
deux | two
`
    const result = parseMarkdown(text)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.deck.themes).toHaveLength(1)
    expect(result.deck.themes[0].units).toHaveLength(2)
    expect(result.deck.allCards).toHaveLength(2)
  })

  it('handles multiple themes', () => {
    const text = `
# Theme A
## Unit A1
### Section A1.1
French | English
--- | ---
un | one

# Theme B
## Unit B1
### Section B1.1
French | English
--- | ---
deux | two
`
    const result = parseMarkdown(text)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.deck.themes).toHaveLength(2)
    expect(result.deck.allCards).toHaveLength(2)
  })

  it('parses two-level hierarchy (theme + section, no unit)', () => {
    const text = `
# Film Vocabulary
### Character Adjectives
| French | English |
| ---- | ---- |
| infidèle | unfaithful |
| égoïste | selfish |

### Plot Developments
| French | English |
| ---- | ---- |
| mentir | to lie |
`
    const result = parseMarkdown(text)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.deck.themes).toHaveLength(1)
    expect(result.deck.themes[0].units).toHaveLength(1)
    expect(result.deck.themes[0].units[0].name).toBe('')
    expect(result.deck.themes[0].units[0].sections).toHaveLength(2)
    expect(result.deck.allCards).toHaveLength(3)
    expect(result.deck.allCards[0].sectionPath).toEqual(['Film Vocabulary', '', 'Character Adjectives'])
  })

  it('parses cards directly under a unit heading (no section)', () => {
    const text = `
# T
## U
French | English
--- | ---
bonjour | hello
merci | thank you
`
    const result = parseMarkdown(text)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.deck.allCards).toHaveLength(2)
    expect(result.deck.allCards[0].sectionPath).toEqual(['T', 'U', ''])
  })

  it('parses cards directly under a theme heading (no unit, no section)', () => {
    const text = `
# T
French | English
--- | ---
bonjour | hello
`
    const result = parseMarkdown(text)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.deck.allCards).toHaveLength(1)
    expect(result.deck.allCards[0].sectionPath).toEqual(['T', '', ''])
  })

  it('returns error when card appears before any theme heading', () => {
    const text = `
French | English
--- | ---
bonjour | hello
`
    const result = parseMarkdown(text)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/before any theme heading/)
  })

  it('returns error for empty card value', () => {
    const text = `
# T
## U
### S
French | English
--- | ---
bonjour |
`
    const result = parseMarkdown(text)
    expect(result.ok).toBe(false)
  })

  it('returns error when file has no cards', () => {
    const result = parseMarkdown('# Theme\n## Unit\n### Section\n')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/No cards found/)
  })

  it('ignores blank lines and comments', () => {
    const text = `
# T
## U
### S
French | English
--- | ---
// this is a comment
bonjour | hello

merci | thank you
`
    const result = parseMarkdown(text)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.deck.allCards).toHaveLength(2)
  })
})
