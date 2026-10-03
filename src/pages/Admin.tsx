import ListEditor from '../components/admin/ListEditor'
import SymbolsEditor from '../components/admin/SymbolsEditor'
import { useSettings } from '../lib/settingsContext'
import { useTrades } from '../lib/tradesContext'

export default function Admin() {
  const { error } = useSettings()
  const { trades } = useTrades()

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold">Admin</h1>
      {error && (
        <div className="rounded-lg border border-warn p-3 text-sm text-warn">
          The settings tables could not be read, so built-in defaults are shown and changes will not save. Run
          <code className="mx-1 text-fg">supabase/migrations/0002_settings_and_reviews.sql</code>
          in the Supabase SQL editor. Details: {error}
        </div>
      )}
      <SymbolsEditor />
      <ListEditor
        kind="emotion"
        title="Emotional conditions"
        hint="The chips you can tick on a trade."
        usage={(n) => trades.filter((t) => t.emotionTags.includes(n)).length}
      />
      <ListEditor kind="tag" title="Tags" hint="Labels for trades, for example the market context or the type of day." usage={(n) => trades.filter((t) => t.tags.includes(n)).length} />
      <ListEditor
        kind="setup"
        title="Setups"
        hint="Your named trade setups. They are suggested in the Setup field of the trade form."
        usage={(n) => trades.filter((t) => t.setup === n).length}
      />
    </div>
  )
}
