import DataAndAccount from '../components/admin/DataAndAccount'
import ListEditor from '../components/admin/ListEditor'
import SymbolsEditor from '../components/admin/SymbolsEditor'
import { useI18n } from '../i18n/context'
import { useSettings } from '../lib/settingsContext'
import { useTrades } from '../lib/tradesContext'

export default function Admin() {
  const { error } = useSettings()
  const { t } = useI18n()
  const { trades } = useTrades()

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold">{t('nav.admin')}</h1>
      {error && (
        <div className="rounded-lg border border-warn p-3 text-sm text-warn">
          {t('admin.tablesMissing.before')}
          <code className="mx-1 text-fg">supabase/migrations/0002_settings_and_reviews.sql</code>
          {t('admin.tablesMissing.after', { error })}
        </div>
      )}
      <SymbolsEditor />
      <ListEditor
        kind="emotion"
        title={t('admin.emotion.title')}
        hint={t('admin.emotion.hint')}
        usage={(n) => trades.filter((t) => t.emotionTags.includes(n)).length}
      />
      <ListEditor kind="tag" title={t('admin.tag.title')} hint={t('admin.tag.hint')} usage={(n) => trades.filter((t) => t.tags.includes(n)).length} />
      <ListEditor
        kind="setup"
        title={t('admin.setup.title')}
        hint={t('admin.setup.hint')}
        usage={(n) => trades.filter((t) => t.setup === n).length}
      />
      <DataAndAccount />
    </div>
  )
}
