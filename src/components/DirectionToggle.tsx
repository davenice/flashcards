import type { Direction } from '../types'

interface Props {
  value: Direction
  onChange: (d: Direction) => void
}

export function DirectionToggle({ value, onChange }: Props) {
  return (
    <div className="flex rounded-lg border border-slate-300 overflow-hidden" role="group" aria-label="Test direction">
      {(['fr-to-en', 'en-to-fr'] as Direction[]).map(dir => (
        <button
          key={dir}
          type="button"
          onClick={() => onChange(dir)}
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
            value === dir
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
          aria-pressed={value === dir}
        >
          {dir === 'fr-to-en' ? 'French → English' : 'English → French'}
        </button>
      ))}
    </div>
  )
}
