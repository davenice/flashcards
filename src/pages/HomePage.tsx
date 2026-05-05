import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseMarkdown } from '../parser/parseMarkdown'
import { useDeck } from '../state/DeckContext'

export function HomePage() {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { setDeck } = useDeck()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleParse(markdown: string) {
    const result = parseMarkdown(markdown)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setDeck(result.deck)
    navigate('/setup')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const content = ev.target?.result as string
      setText(content)
      handleParse(content)
    }
    reader.readAsText(file)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleParse(text)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 text-center">Flashcards</h1>
        <p className="text-slate-500 text-center mb-8">Paste your flashcard deck or upload a file to begin.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full h-48 p-3 border border-slate-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            placeholder={`# Theme\n## Unit\n### Section\nFrench | English\n--- | ---\nbonjour | hello`}
            value={text}
            onChange={e => { setText(e.target.value); setError(null) }}
            aria-label="Paste flashcard markdown"
          />

          {error && (
            <p role="alert" className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!text.trim()}
              className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Start
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex-1 py-3 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Upload file
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".md,.txt"
            onChange={handleFileChange}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
          />
        </form>

        <p className="mt-6 text-xs text-slate-400 text-center">
          Format: <code className="bg-slate-100 px-1 rounded"># Theme</code> &nbsp;
          <code className="bg-slate-100 px-1 rounded">## Unit</code> &nbsp;
          <code className="bg-slate-100 px-1 rounded">### Section</code> &nbsp;
          then <code className="bg-slate-100 px-1 rounded">French | English</code> rows
        </p>
      </div>
    </div>
  )
}
