import { useReducer } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DeckProvider } from './state/DeckContext'
import { sessionReducer, initialSessionState } from './state/sessionReducer'
import { HomePage } from './pages/HomePage'
import { SetupPage } from './pages/SetupPage'
import { SessionPage } from './pages/SessionPage'
import { SummaryPage } from './pages/SummaryPage'
import { StatsPage } from './pages/StatsPage'
import { UpdatePrompt } from './components/UpdatePrompt'

export default function App() {
  const [session, dispatch] = useReducer(sessionReducer, initialSessionState)

  return (
    <DeckProvider>
      <UpdatePrompt />
      <div className="fixed bottom-2 right-3 text-xs text-slate-300 select-none pointer-events-none">
        {__BUILD_DATE__} · {__COMMIT_HASH__}
      </div>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup" element={<SetupPage dispatch={dispatch} />} />
          <Route path="/session" element={<SessionPage session={session} dispatch={dispatch} />} />
          <Route path="/summary" element={<SummaryPage session={session} dispatch={dispatch} />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </DeckProvider>
  )
}
