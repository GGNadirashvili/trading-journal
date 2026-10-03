import { Plus } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import AccountCard from '../components/AccountCard'
import AccountForm from '../components/AccountForm'
import { useI18n } from '../i18n/context'
import type { Account } from '../lib/accounts'
import { useAccounts } from '../lib/accountsContext'
import { useConfirm } from '../lib/confirmContext'
import { useTrades } from '../lib/tradesContext'

type Mode = { kind: 'closed' } | { kind: 'new' } | { kind: 'edit'; id: string }

function ActionButton({ onClick, children, danger }: { onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${danger ? 'border-line text-muted hover:border-loss hover:text-loss' : 'border-line hover:text-green'}`}>
      {children}
    </button>
  )
}

export default function Accounts() {
  const { t } = useI18n()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const { trades, loading: tradesLoading } = useTrades()
  const { accounts, loading, error, states, active, history, add, update, setResult, remove, setSelected } = useAccounts()
  const [mode, setMode] = useState<Mode>({ kind: 'closed' })
  const [failure, setFailure] = useState<string | null>(null)

  const unassigned = useMemo(() => trades.filter((t) => !t.accountId), [trades])
  const editing = mode.kind === 'edit' ? accounts.find((a) => a.id === mode.id) : undefined
  const editingTrades = useMemo(() => (editing ? trades.filter((t) => t.accountId === editing.id) : []), [trades, editing])

  if (loading || tradesLoading) return <p className="text-muted">{t('common.loading')}</p>

  const guard = async (fn: () => Promise<void>) => {
    setFailure(null)
    try {
      await fn()
    } catch (e) {
      setFailure((e as Error).message)
    }
  }

  const viewTrades = (a: Account) => {
    setSelected(a.id)
    navigate('/trades')
  }

  async function mark(a: Account, status: 'passed' | 'failed') {
    const key = status === 'passed' ? 'passed' : 'failed'
    if (await confirm(t(`accounts.${key}Body`, { name: a.name }), { title: t(`accounts.${key}Title`), danger: status === 'failed' })) await guard(() => setResult(a.id, status))
  }
  async function reopen(a: Account) {
    if (await confirm(t('accounts.reopenBody', { name: a.name }), { title: t('accounts.reopenTitle') })) await guard(() => setResult(a.id, null))
  }
  async function del(a: Account) {
    const n = states[a.id].trades
    if (await confirm(t('accounts.deleteBody', { name: a.name, n }), { title: t('accounts.deleteTitle'), danger: true })) await guard(() => remove(a.id))
  }

  const actions = (a: Account) => (
    <>
      <ActionButton onClick={() => navigate(`/accounts/${a.id}`)}>{t('accounts.details')}</ActionButton>
      <ActionButton onClick={() => setMode({ kind: 'edit', id: a.id })}>{t('accounts.edit')}</ActionButton>
      <ActionButton onClick={() => viewTrades(a)}>{t('accounts.viewTrades')}</ActionButton>
      {states[a.id].status === 'active' && (
        <>
          <ActionButton onClick={() => mark(a, 'passed')}>{t('accounts.markPassed')}</ActionButton>
          <ActionButton onClick={() => mark(a, 'failed')}>{t('accounts.markFailed')}</ActionButton>
        </>
      )}
      {a.manualStatus && <ActionButton onClick={() => reopen(a)}>{t('accounts.reopen')}</ActionButton>}
      <ActionButton danger onClick={() => del(a)}>
        {t('common.delete')}
      </ActionButton>
    </>
  )

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{t('accounts.title')}</h1>
        {mode.kind === 'closed' && (
          <button onClick={() => setMode({ kind: 'new' })} className="flex items-center gap-2 rounded-lg bg-green px-3 py-2 text-sm font-semibold text-black">
            <Plus size={16} /> {t('accounts.add')}
          </button>
        )}
      </div>

      {error && <p className="rounded-lg border border-warn p-3 text-sm text-warn">{t('accounts.loadError', { error })}</p>}
      {failure && <p className="text-sm text-loss">{failure}</p>}

      {mode.kind === 'new' && (
        <AccountForm
          unassigned={unassigned}
          onCancel={() => setMode({ kind: 'closed' })}
          onSubmit={async (input, assign) => {
            await add(input, assign)
            setMode({ kind: 'closed' })
          }}
        />
      )}
      {mode.kind === 'edit' && editing && (
        <AccountForm
          key={editing.id}
          initial={editing}
          currentState={states[editing.id]}
          accountTrades={editingTrades}
          onCancel={() => setMode({ kind: 'closed' })}
          onSubmit={async (input) => {
            await update(editing.id, input)
            setMode({ kind: 'closed' })
          }}
        />
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('accounts.active')}</h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted">{t('accounts.noneActive')}</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {active.map((a) => (
              <AccountCard key={a.id} account={a} state={states[a.id]} actions={actions(a)} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {t('accounts.history')} <span className="text-sm font-normal text-muted">({history.length})</span>
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted">{t('accounts.noHistory')}</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {history.map((a) => (
              <AccountCard key={a.id} account={a} state={states[a.id]} actions={actions(a)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
