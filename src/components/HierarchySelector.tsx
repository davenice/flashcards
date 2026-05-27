import type { Deck } from '../types'
import { sectionKey } from '../utils/buildDeck'

interface Props {
  deck: Deck
  selected: Set<string>
  onChange: (selected: Set<string>) => void
}

export function HierarchySelector({ deck, selected, onChange }: Props) {
  function allSectionKeys(): string[] {
    return deck.themes.flatMap(t =>
      t.units.flatMap(u =>
        u.sections.map(s => sectionKey([t.name, u.name, s.name]))
      )
    )
  }

  function toggleSection(key: string) {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange(next)
  }

  function toggleUnit(themeName: string, unitName: string, sections: string[]) {
    const keys = sections.map(s => sectionKey([themeName, unitName, s]))
    const allOn = keys.every(k => selected.has(k))
    const next = new Set(selected)
    if (allOn) keys.forEach(k => next.delete(k))
    else keys.forEach(k => next.add(k))
    onChange(next)
  }

  function toggleTheme(themeName: string, unitSections: { unitName: string; sections: string[] }[]) {
    const keys = unitSections.flatMap(u =>
      u.sections.map(s => sectionKey([themeName, u.unitName, s]))
    )
    const allOn = keys.every(k => selected.has(k))
    const next = new Set(selected)
    if (allOn) keys.forEach(k => next.delete(k))
    else keys.forEach(k => next.add(k))
    onChange(next)
  }

  function toggleAll() {
    const keys = allSectionKeys()
    const allOn = keys.every(k => selected.has(k))
    onChange(allOn ? new Set() : new Set(keys))
  }

  const allKeys = allSectionKeys()
  const allSelected = allKeys.length > 0 && allKeys.every(k => selected.has(k))

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="w-4 h-4 accent-indigo-600"
        />
        All sections
      </label>

      {deck.themes.map(theme => {
        const themeUnitSections = theme.units.map(u => ({
          unitName: u.name,
          sections: u.sections.map(s => s.name),
        }))
        const themeKeys = themeUnitSections.flatMap(u =>
          u.sections.map(s => sectionKey([theme.name, u.unitName, s]))
        )
        const themeAllOn = themeKeys.every(k => selected.has(k))

        return (
          <div key={theme.name} className="ml-0">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
              <input
                type="checkbox"
                checked={themeAllOn}
                onChange={() => toggleTheme(theme.name, themeUnitSections)}
                className="w-4 h-4 accent-indigo-600"
              />
              {theme.name}
            </label>

            {theme.units.map(unit => {
              const unitKeys = unit.sections.map(s => sectionKey([theme.name, unit.name, s.name]))
              const unitAllOn = unitKeys.every(k => selected.has(k))
              const hasUnitName = unit.name !== ''

              return (
                <div key={unit.name || '__sections__'} className="ml-6 mt-1 space-y-1">
                  {hasUnitName && (
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={unitAllOn}
                        onChange={() =>
                          toggleUnit(theme.name, unit.name, unit.sections.map(s => s.name))
                        }
                        className="w-4 h-4 accent-indigo-600"
                      />
                      {unit.name}
                    </label>
                  )}

                  {unit.sections.map(section => {
                    if (!section.name) return null
                    const key = sectionKey([theme.name, unit.name, section.name])
                    const cardCount = section.cards.length
                    return (
                      <label key={key} className={`flex items-center gap-2 ${hasUnitName ? 'ml-6' : ''} cursor-pointer text-slate-600 text-sm`}>
                        <input
                          type="checkbox"
                          checked={selected.has(key)}
                          onChange={() => toggleSection(key)}
                          className="w-4 h-4 accent-indigo-600"
                        />
                        {section.name}
                        <span className="text-slate-400">({cardCount})</span>
                      </label>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
