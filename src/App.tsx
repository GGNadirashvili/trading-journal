import { HashRouter, Route, Routes } from 'react-router-dom'
import AuthGate from './components/AuthGate'
import Layout from './components/Layout'
import { AuthProvider } from './lib/auth'
import { TradesProvider } from './lib/TradesProvider'
import Calendar from './pages/Calendar'
import Dashboard from './pages/Dashboard'
import Import from './pages/Import'
import Reports from './pages/Reports'
import Trades from './pages/Trades'

// HashRouter: GitHub Pages is a static host and cannot rewrite deep links to index.html.
export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <TradesProvider>
          <HashRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="trades" element={<Trades />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="reports" element={<Reports />} />
                <Route path="import" element={<Import />} />
              </Route>
            </Routes>
          </HashRouter>
        </TradesProvider>
      </AuthGate>
    </AuthProvider>
  )
}
