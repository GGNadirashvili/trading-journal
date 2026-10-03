import type { ReactNode } from 'react'
import { useI18n } from '../i18n/context'
import type { Account, AccountState } from '../lib/accounts'
import { dayLabel, money, pnlColor } from '../lib/format'

const STATUS_STYLE = { active: 'border-green text-green', passed: 'border-green bg-green/15 text-green', failed: 'border-loss bg-loss/15 text-loss' } as const

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.round(pct * 100)}%` }} />
    </div>
  )
}

/** How one prop-firm account stands: balance, progress to the goal, and how much loss is left. */
export default function AccountCard({ account, state, actions }: { account: Account; state: AccountState; actions?: ReactNode }) {
  const { t, tn, locale } = useI18n()
  const done = state.status !== 'active'
  const limitHit = state.buffer <= 0

  return (
    <article className={`space-y-4 rounded-xl border bg-surface p-4 ${state.status === 'failed' ? 'border-loss/50' : state.status === 'passed' ? 'border-green/50' : 'border-line'}`}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-lg font-semibold">{account.name}</h3>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[state.status]}`}>{t(`account.status.${state.status}`)}</span>
        <span className="text-xs text-muted">{t(`accounts.type.${account.drawdownType}`)}</span>
        {account.manualStatus && <span className="text-xs text-warn">{t('accounts.manual')}</span>}
      </header>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-xs text-muted">{t('accounts.balance')}</div>
          <div className="text-3xl font-semibold">{money(state.balance)}</div>
        </div>
        <div className={`text-lg font-semibold ${pnlColor(state.profit)}`}>{money(state.profit, { sign: true })}</div>
      </div>

      <div className="space-y-1">
        <Bar pct={state.goalPct} color="bg-green" />
        <div className="flex flex-wrap justify-between gap-x-3 text-xs">
          <span className="text-muted">{t('accounts.goal', { amount: money(account.profitGoal) })}</span>
          <span className={state.toGoal === 0 ? 'text-green' : 'text-muted'}>{state.toGoal === 0 ? t('accounts.goalReached') : t('accounts.toGoal', { amount: money(state.toGoal) })}</span>
        </div>
      </div>

      <div className="space-y-1">
        <Bar pct={state.drawdownUsedPct} color={state.drawdownUsedPct >= 0.75 ? 'bg-loss' : state.drawdownUsedPct >= 0.5 ? 'bg-warn' : 'bg-green'} />
        <div className="flex flex-wrap justify-between gap-x-3 text-xs">
          <span className="text-muted">{t('accounts.floor', { amount: money(state.floor) })}</span>
          <span className={limitHit ? 'text-loss' : 'text-muted'}>{limitHit ? t('accounts.limitReached') : t('accounts.canLose', { amount: money(state.buffer) })}</span>
        </div>
        <div className="text-xs text-muted">{t('accounts.drawdownUsed', { pct: Math.round(state.drawdownUsedPct * 100) })}</div>
      </div>

      <footer className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span>{t('accounts.size', { amount: money(account.startBalance) })}</span>
        <span>{tn('unit.trade', state.trades)}</span>
        <span>{t('accounts.opened', { date: dayLabel(account.openedAt, locale) })}</span>
        {done && state.endedOn && <span>{t('accounts.ended', { date: dayLabel(state.endedOn, locale) })}</span>}
      </footer>

      {actions && <div className="flex flex-wrap gap-2 border-t border-line pt-3">{actions}</div>}
    </article>
  )
}
