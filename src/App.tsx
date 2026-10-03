import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Calendar from './pages/Calendar'
import Dashboard from './pages/Dashboard'
import Import from './pages/Import'
import Reports from './pages/Reports'
import Trades from './pages/Trades'

// HashRouter: GitHub Pages is a static host and cannot rewrite deep links to index.html.
export default function App() {
  return (
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
  )
}
