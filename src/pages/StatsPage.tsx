import { Link } from 'react-router-dom'
import { loadCardStats } from '../utils/resultStorage'

export function StatsPage() {
  const stats = loadCardStats().sort(
    (a, b) => b.incorrect - a.incorrect || b.correct - a.correct
  )

  const totalSeen = stats.length
  const totalAttempts = stats.reduce((n, s) => n + s.correct + s.incorrect, 0)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-4 pt-8">
      <div className="w-full max-w-lg space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Stats</h1>
          <Link to="/" className="text-sm text-slate-400 hover:text-slate-600" aria-label="Back to home">
            ← Back
          </Link>
        </div>

        {totalSeen === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500">No sessions completed yet.</p>
            <Link to="/" className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-800">
              Start studying →
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{totalSeen}</p>
                <p className="text-xs text-slate-400 mt-0.5">cards seen</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{totalAttempts}</p>
                <p className="text-xs text-slate-400 mt-0.5">total attempts</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              <div className="px-4 py-3 flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                <span className="flex-1">Card</span>
                <span className="w-16 text-right text-green-600">Correct</span>
                <span className="w-16 text-right text-red-500">Missed</span>
              </div>
              {stats.map(s => (
                <div
                  key={`${s.french}|||${s.english}`}
                  className="px-4 py-3 flex items-center"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.french}</p>
                    <p className="text-xs text-slate-400 truncate">{s.english}</p>
                  </div>
                  <span className="w-16 text-right text-sm font-semibold text-green-600">{s.correct}</span>
                  <span className="w-16 text-right text-sm font-semibold text-red-500">{s.incorrect}</span>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
