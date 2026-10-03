import { useI18n } from '../i18n/context'
import { useAccounts } from '../lib/accountsContext'

/** Chooses which account the dashboard, trade log, reports and weekly review look at. Hidden until an account exists. */
export default function AccountFilter() {
  const { t } = useI18n()
  const { accounts, states, selected, setSelected } = useAccounts()
  if (accounts.length === 0) return null
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">{t('filter.account')}</span>
      <select value={selected} onChange={(e) => setSelected(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg">
        <option value="all">{t('filter.allAccounts')}</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
            {states[a.id].status === 'active' ? '' : ` (${t(`account.status.${states[a.id].status}`)})`}
          </option>
        ))}
      </select>
    </label>
  )
}
