import { HashRouter, Route, Routes } from 'react-router-dom'
import AuthGate from './components/AuthGate'
import ConfirmProvider from './components/ConfirmProvider'
import Layout from './components/Layout'
import { AuthProvider } from './lib/auth'
import { SettingsProvider } from './lib/SettingsProvider'
import { TradesProvider } from './lib/TradesProvider'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Review from './pages/Review'
import TradeEdit from './pages/TradeEdit'
import Trades from './pages/Trades'

// HashRouter: GitHub Pages is a static host and cannot rewrite deep links to index.html.
export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <SettingsProvider>
          <TradesProvider>
            <ConfirmProvider>
              <HashRouter>
                <Routes>
                  <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="trades" element={<Trades />} />
                    <Route path="trades/new" element={<TradeEdit />} />
                    <Route path="trades/:id" element={<TradeEdit />} />
                    <Route path="review" element={<Review />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="admin" element={<Admin />} />
                  </Route>
                </Routes>
              </HashRouter>
            </ConfirmProvider>
          </TradesProvider>
        </SettingsProvider>
      </AuthGate>
    </AuthProvider>
  )
}
