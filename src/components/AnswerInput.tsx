import { useEffect, useRef, useState } from 'react'

const ACCENT_MAP: Record<string, string[]> = {
  a: ['à', 'â', 'ä', 'æ'],
  e: ['é', 'è', 'ê', 'ë'],
  i: ['î', 'ï'],
  o: ['ô', 'ö', 'œ'],
  u: ['ù', 'û', 'ü'],
  c: ['ç'],
}

const ALL_ACCENTS = ['é', 'è', 'ê', 'ë', 'à', 'â', 'ä', 'æ', 'î', 'ï', 'ô', 'ö', 'œ', 'ù', 'û', 'ü', 'ç']

interface Props {
  onSubmit: (value: string) => void
}

export function AnswerInput({ onSubmit }: Props) {
  const [value, setValue] = useState('')
  const [cursor, setCursor] = useState({ start: 0, end: 0 })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function syncCursor() {
    const input = inputRef.current
    if (!input) return
    setCursor({ start: input.selectionStart ?? 0, end: input.selectionEnd ?? 0 })
  }

  const activeChar = (() => {
    const { start, end } = cursor
    if (end - start === 1) return value[start]?.toLowerCase() ?? null
    if (start > 0) return value[start - 1]?.toLowerCase() ?? null
    return null
  })()

  const enabledAccents = activeChar ? (ACCENT_MAP[activeChar] ?? []) : []

  function insertAccent(accent: string) {
    const input = inputRef.current
    if (!input) return
    const { start, end } = cursor

    let newValue: string
    let newPos: number

    if (end - start === 1) {
      newValue = value.slice(0, start) + accent + value.slice(end)
      newPos = start + 1
    } else {
      if (start === 0) return
      newValue = value.slice(0, start - 1) + accent + value.slice(start)
      newPos = start
    }

    setValue(newValue)
    setCursor({ start: newPos, end: newPos })
    requestAnimationFrame(() => {
      input.focus()
      input.setSelectionRange(newPos, newPos)
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    onSubmit(value)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => {
          setValue(e.target.value)
          setCursor({ start: e.target.selectionStart ?? 0, end: e.target.selectionEnd ?? 0 })
        }}
        onSelect={syncCursor}
        onKeyUp={syncCursor}
        placeholder="Type your answer…"
        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Your answer"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      <div className="flex flex-wrap gap-1.5">
        {ALL_ACCENTS.map(accent => {
          const enabled = enabledAccents.includes(accent)
          return (
            <button
              key={accent}
              type="button"
              disabled={!enabled}
              onMouseDown={e => e.preventDefault()}
              onClick={() => insertAccent(accent)}
              className={`px-2.5 py-1 text-base border rounded-md transition-colors min-h-[36px] min-w-[36px] ${
                enabled
                  ? 'border-indigo-300 text-indigo-700 hover:bg-indigo-50 cursor-pointer'
                  : 'border-slate-200 text-slate-300 cursor-default'
              }`}
            >
              {accent}
            </button>
          )
        })}
      </div>
      <button
        type="submit"
        disabled={!value.trim()}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
      >
        Check
      </button>
    </form>
  )
}
