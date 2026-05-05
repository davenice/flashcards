import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseMarkdown } from '../parser/parseMarkdown'
import { useDeck } from '../state/DeckContext'

const FORMAT_EXAMPLE = `# Theme name

## Unit name

### Section name
| French | English |
|--------|---------|
| bonjour | hello |
| merci | thank you |
| au revoir | goodbye |`

export function HomePage() {
  const [error, setError] = useState<string | null>(null)
  const [showFormat, setShowFormat] = useState(false)
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
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => handleParse(ev.target?.result as string)
    reader.readAsText(file)
    // Reset so the same file can be re-selected if needed
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 text-center">Flashcards</h1>
        <p className="text-slate-500 text-center mb-8">Upload a markdown file to begin.</p>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-lg min-h-[56px]"
        >
          Choose file…
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".md,.txt"
          onChange={handleFileChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />

        {error && (
          <p role="alert" className="mt-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => setShowFormat(f => !f)}
          className="mt-6 w-full text-sm text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
          aria-expanded={showFormat}
        >
          <span>{showFormat ? '▾' : '▸'}</span>
          What format should the file be in?
        </button>

        {showFormat && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <pre className="p-4 text-xs text-slate-600 font-mono leading-relaxed overflow-x-auto whitespace-pre">{FORMAT_EXAMPLE}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
