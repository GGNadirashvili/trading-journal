import { HashRouter, Route, Routes } from 'react-router-dom'
import AuthGate from './components/AuthGate'
import ConfirmProvider from './components/ConfirmProvider'
import Layout from './components/Layout'
import LanguageProvider from './i18n/LanguageProvider'
import { AccountsProvider } from './lib/AccountsProvider'
import { AuthProvider } from './lib/auth'
import { NotesProvider } from './lib/NotesProvider'
import { SettingsProvider } from './lib/SettingsProvider'
import { TradesProvider } from './lib/TradesProvider'
import AccountDetail from './pages/AccountDetail'
import Accounts from './pages/Accounts'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import NoteEdit from './pages/NoteEdit'
import Notes from './pages/Notes'
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
                <NotesProvider>
                  <ConfirmProvider>
                    <HashRouter>
                      <Routes>
                        <Route element={<Layout />}>
                          <Route index element={<Dashboard />} />
                          <Route path="accounts" element={<Accounts />} />
                          <Route path="accounts/:id" element={<AccountDetail />} />
                          <Route path="trades" element={<Trades />} />
                          <Route path="trades/new" element={<TradeEdit />} />
                          <Route path="trades/:id" element={<TradeEdit />} />
                          <Route path="notes" element={<Notes />} />
                          <Route path="notes/new" element={<NoteEdit />} />
                          <Route path="notes/:id" element={<NoteEdit />} />
                          <Route path="review" element={<Review />} />
                          <Route path="reports" element={<Reports />} />
                          <Route path="admin" element={<Admin />} />
                        </Route>
                      </Routes>
                    </HashRouter>
                  </ConfirmProvider>
                </NotesProvider>
              </AccountsProvider>
            </TradesProvider>
          </SettingsProvider>
        </AuthGate>
      </AuthProvider>
    </LanguageProvider>
  )
}
