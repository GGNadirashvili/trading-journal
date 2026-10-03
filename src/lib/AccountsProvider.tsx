import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { evaluateAccount, type Account, type AccountState } from './accounts'
import * as api from './accountsApi'
import { AccountsContext, type AccountsState } from './accountsContext'
import { dayKey } from './stats'
import { useTrades } from './tradesContext'

const STORAGE_KEY = 'tj-account'

function savedSelection(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? 'all'
  } catch {
    return 'all'
  }
}

export function AccountsProvider({ children }: { children: ReactNode }) {
  const { trades, assignUnassigned } = useTrades()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chosen, setChosen] = useState(savedSelection)

  useEffect(() => {
    api
      .listAccounts()
      .then(setAccounts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const states = useMemo(() => {
    const out: Record<string, AccountState> = {}
    for (const a of accounts) {
      out[a.id] = evaluateAccount(
        a,
        trades.filter((t) => t.accountId === a.id),
      )
    }
    return out
  }, [accounts, trades])

  const active = useMemo(() => accounts.filter((a) => states[a.id].status === 'active').sort((a, b) => b.openedAt.localeCompare(a.openedAt)), [accounts, states])
  const history = useMemo(
    () => accounts.filter((a) => states[a.id].status !== 'active').sort((a, b) => (states[b.id].endedOn ?? '').localeCompare(states[a.id].endedOn ?? '')),
    [accounts, states],
  )

  // A remembered account that no longer exists falls back to "all".
  const selected = chosen === 'all' || accounts.some((a) => a.id === chosen) ? chosen : 'all'
  const setSelected = useCallback((id: string) => {
    setChosen(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // not remembered; the choice still applies until the page is closed
    }
  }, [])
  const scopedTrades = useMemo(() => (selected === 'all' ? trades : trades.filter((t) => t.accountId === selected)), [trades, selected])

  const add = useCallback(
    async (input: api.AccountInput, assign: boolean) => {
      const a = await api.createAccount(input)
      setAccounts((cur) => [a, ...cur])
      if (assign) await assignUnassigned(a.id)
      return a
    },
    [assignUnassigned],
  )
  const update = useCallback(async (id: string, input: api.AccountInput) => {
    const a = await api.updateAccount(id, input)
    setAccounts((cur) => cur.map((x) => (x.id === id ? a : x)))
  }, [])
  const setResult = useCallback(async (id: string, status: 'passed' | 'failed' | null) => {
    const a = await api.setManualResult(id, status, dayKey(new Date().toISOString()))
    setAccounts((cur) => cur.map((x) => (x.id === id ? a : x)))
  }, [])
  const remove = useCallback(async (id: string) => {
    await api.deleteAccount(id)
    setAccounts((cur) => cur.filter((x) => x.id !== id))
  }, [])

  const value = useMemo<AccountsState>(
    () => ({ accounts, loading, error, states, active, history, selected, setSelected, scopedTrades, add, update, setResult, remove }),
    [accounts, loading, error, states, active, history, selected, setSelected, scopedTrades, add, update, setResult, remove],
  )
  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>
}
