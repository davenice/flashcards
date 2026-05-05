import { useReducer } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DeckProvider } from './state/DeckContext'
import { sessionReducer, initialSessionState } from './state/sessionReducer'
import { HomePage } from './pages/HomePage'
import { SetupPage } from './pages/SetupPage'
import { SessionPage } from './pages/SessionPage'
import { SummaryPage } from './pages/SummaryPage'

export default function App() {
  const [session, dispatch] = useReducer(sessionReducer, initialSessionState)

  return (
    <DeckProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup" element={<SetupPage dispatch={dispatch} />} />
          <Route path="/session" element={<SessionPage session={session} dispatch={dispatch} />} />
          <Route path="/summary" element={<SummaryPage session={session} dispatch={dispatch} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </DeckProvider>
  )
}
