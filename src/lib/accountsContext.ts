import { createContext, useContext } from 'react'
import type { Account, AccountState } from './accounts'
import type { AccountInput } from './accountsApi'
import type { Trade } from './types'

export interface AccountsState {
  accounts: Account[]
  loading: boolean
  /** Set when the accounts table cannot be read (for example migration 0006 has not been run). */
  error: string | null
  /** Where each account stands, worked out from its trades. */
  states: Record<string, AccountState>
  /** Accounts still in play, newest first. */
  active: Account[]
  /** Passed and failed accounts, most recently finished first. */
  history: Account[]
  /** The account shown on the dashboard, trade log and reports: an account id, or 'all'. */
  selected: string
  setSelected: (id: string) => void
  /** The trades of the selected account (or all trades). */
  scopedTrades: Trade[]
  add: (input: AccountInput, assignUnassigned: boolean) => Promise<Account>
  update: (id: string, input: AccountInput) => Promise<void>
  /** Marks the account passed or failed by hand (today), or clears a manual result with null. */
  setResult: (id: string, status: 'passed' | 'failed' | null) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const AccountsContext = createContext<AccountsState | null>(null)

export function useAccounts(): AccountsState {
  const ctx = useContext(AccountsContext)
  if (!ctx) throw new Error('useAccounts must be used inside AccountsProvider')
  return ctx
}
