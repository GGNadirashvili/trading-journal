import { HashRouter, Route, Routes } from 'react-router-dom'
import AuthGate from './components/AuthGate'
import ConfirmProvider from './components/ConfirmProvider'
import Layout from './components/Layout'
import LanguageProvider from './i18n/LanguageProvider'
import { AccountsProvider } from './lib/AccountsProvider'
import { AuthProvider } from './lib/auth'
import { SettingsProvider } from './lib/SettingsProvider'
import { TradesProvider } from './lib/TradesProvider'
import Accounts from './pages/Accounts'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Review from './pages/Review'
import TradeEdit from './pages/TradeEdit'
import Trades from './pages/Trades'

// HashRouter: GitHub Pages is a static host and cannot rewrite deep links to index.html.
export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AuthGate>
          <SettingsProvider>
            <TradesProvider>
              <AccountsProvider>
                <ConfirmProvider>
                  <HashRouter>
                    <Routes>
                      <Route element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="accounts" element={<Accounts />} />
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
              </AccountsProvider>
            </TradesProvider>
          </SettingsProvider>
        </AuthGate>
      </AuthProvider>
    </LanguageProvider>
  )
}
