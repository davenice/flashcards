import type { Card, Deck, Section, Theme, Unit } from '../types'

type ParseResult = { ok: true; deck: Deck } | { ok: false; error: string }

function isSeparatorLine(left: string, right: string): boolean {
  return /^-+$/.test(left.trim()) && /^-+$/.test(right.trim())
}

export function parseMarkdown(text: string): ParseResult {
  const lines = text.split('\n')
  const themes: Theme[] = []
  let currentTheme: Theme | null = null
  let currentUnit: Unit | null = null
  let currentSection: Section | null = null
  let expectingHeader = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1

    // Comments and blank lines
    if (line.trim() === '' || line.trim().startsWith('//')) continue

    // Theme — reuse existing theme if name matches
    const themeMatch = line.match(/^#\s+(.+)/)
    if (themeMatch) {
      const name = themeMatch[1].trim()
      const existing = themes.find(t => t.name === name)
      if (existing) {
        currentTheme = existing
      } else {
        currentTheme = { name, units: [] }
        themes.push(currentTheme)
      }
      currentUnit = null
      currentSection = null
      continue
    }

    // Unit — reuse existing unit within current theme if name matches
    const unitMatch = line.match(/^##\s+(.+)/)
    if (unitMatch) {
      if (!currentTheme) {
        return { ok: false, error: `Line ${lineNum}: unit heading found before any theme heading` }
      }
      const name = unitMatch[1].trim()
      const existing = currentTheme.units.find(u => u.name === name)
      if (existing) {
        currentUnit = existing
      } else {
        currentUnit = { name, sections: [] }
        currentTheme.units.push(currentUnit)
      }
      currentSection = null
      continue
    }

    // Section
    const sectionMatch = line.match(/^###\s+(.+)/)
    if (sectionMatch) {
      if (!currentUnit) {
        return { ok: false, error: `Line ${lineNum}: section heading found before any unit heading` }
      }
      currentSection = { name: sectionMatch[1].trim(), cards: [] }
      currentUnit.sections.push(currentSection)
      expectingHeader = true
      continue
    }

    // Card line (contains |)
    if (line.includes('|')) {
      // Support both `French | English` and `| French | English |` (GitHub table format)
      let inner = line.trim()
      if (inner.startsWith('|')) inner = inner.slice(1)
      if (inner.endsWith('|')) inner = inner.slice(0, -1)

      const pipeIdx = inner.indexOf('|')
      if (pipeIdx === -1) continue
      const left = inner.slice(0, pipeIdx).trim()
      const right = inner.slice(pipeIdx + 1).trim()

      // Skip separator row (--- | ---)
      if (isSeparatorLine(left, right)) continue

      // Skip header row (first | line after a ### heading)
      if (expectingHeader) {
        expectingHeader = false
        continue
      }

      if (!currentSection) {
        return { ok: false, error: `Line ${lineNum}: card found before any section heading` }
      }
      if (!left || !right) {
        return { ok: false, error: `Line ${lineNum}: card has an empty French or English value` }
      }

      const card: Card = {
        french: left,
        english: right,
        sectionPath: [currentTheme!.name, currentUnit!.name, currentSection.name],
      }
      currentSection.cards.push(card)
    }
  }

  const allCards = themes.flatMap(t => t.units.flatMap(u => u.sections.flatMap(s => s.cards)))
  if (allCards.length === 0) {
    return { ok: false, error: 'No cards found — check the file format' }
  }

  return { ok: true, deck: { themes, allCards } }
}
