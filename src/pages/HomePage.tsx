import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDeck } from '../state/DeckContext'
import { hasAnyStats } from '../utils/resultStorage'
import type { SavedDeck } from '../types'

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
  const { savedDecks, addDeck, selectDeck, removeDeck } = useDeck()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = addDeck(ev.target?.result as string, file.name)
      if (!result.ok) {
        setError(result.error)
      } else {
        navigate('/setup')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleStudy(saved: SavedDeck) {
    const ok = selectDeck(saved)
    if (ok) {
      navigate('/setup')
    } else {
      setError(`Failed to load "${saved.label}" — try removing and re-uploading it.`)
    }
  }

  function handleRemove(saved: SavedDeck) {
    const message = saved.isSample
      ? `Remove the sample deck? It won't come back automatically.`
      : `Remove "${saved.label}"? You'll need to upload the file again to use it.`
    if (window.confirm(message)) {
      removeDeck(saved.id)
    }
  }

  const hasSavedDecks = savedDecks.length > 0

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 text-center">Flashcards</h1>

        {hasSavedDecks ? (
          <>
            <p className="text-slate-500 text-center mb-6">Choose a deck to study.</p>

            <ul className="space-y-2 mb-6">
              {savedDecks.map(saved => (
                <li
                  key={saved.id}
                  className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800 truncate">{saved.label}</p>
                      {saved.isSample && (
                        <span className="shrink-0 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                          Sample
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{saved.cardCount} card{saved.cardCount !== 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={() => handleStudy(saved)}
                    className="shrink-0 px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Study
                  </button>
                  <button
                    onClick={() => handleRemove(saved)}
                    className="shrink-0 text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                    aria-label={`Remove ${saved.label}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full py-3 bg-white text-slate-700 font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Upload another file…
            </button>
          </>
        ) : (
          <>
            <p className="text-slate-500 text-center mb-8">Upload a markdown file to begin.</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-lg min-h-[56px]"
            >
              Choose file…
            </button>
          </>
        )}

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

        {hasAnyStats() && (
          <p className="mt-4 text-center">
            <Link to="/stats" className="text-sm text-slate-400 hover:text-indigo-600 transition-colors">
              View stats →
            </Link>
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
