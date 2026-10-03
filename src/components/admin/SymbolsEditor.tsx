import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useI18n } from '../../i18n/context'
import { useConfirm } from '../../lib/confirmContext'
import { DuplicateError } from '../../lib/settingsApi'
import { useSettings } from '../../lib/settingsContext'
import { useTrades } from '../../lib/tradesContext'

const input = 'rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green'

export default function SymbolsEditor() {
  const { symbols, addSymbol, updateSymbol, removeSymbol } = useSettings()
  const { trades } = useTrades()
  const confirm = useConfirm()
  const { t } = useI18n()
  const [code, setCode] = useState('')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<void>) => {
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof DuplicateError ? t('admin.exists', { name: e.itemName }) : (e as Error).message)
    }
  }

  function add(e: FormEvent) {
    e.preventDefault()
    const pv = Number(value)
    if (!(pv > 0)) return setError(t('admin.symbols.invalidValue'))
    void run(async () => {
      await addSymbol(code, pv)
      setCode('')
      setValue('')
    })
  }

  async function remove(id: string, symbol: string) {
    const used = trades.filter((t) => t.symbol === symbol).length
    const note = used ? `\n\n${t('admin.symbols.usedNote', { n: used, symbol })}` : ''
    if (await confirm(`${t('admin.symbols.deleteBody', { symbol })}${note}`, { title: t('admin.symbols.deleteTitle'), danger: true })) void run(() => removeSymbol(id))
  }

  function changeValue(id: string, current: number, raw: string) {
    const pv = Number(raw)
    if (pv === current) return
    if (!(pv > 0)) return setError(t('admin.symbols.invalidValue'))
    void run(() => updateSymbol(id, pv))
  }

  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <div>
        <h2 className="text-lg font-semibold">{t('admin.symbols.title')}</h2>
        <p className="text-sm text-muted">{t('admin.symbols.desc')}</p>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-muted">
          <tr>
            <th className="pb-2">{t('admin.symbols.col.symbol')}</th>
            <th className="pb-2">{t('admin.symbols.col.value')}</th>
            <th className="pb-2 text-right" />
          </tr>
        </thead>
        <tbody>
          {symbols.map((s) => (
            <tr key={s.id} className="border-t border-line">
              <td className="py-2 font-semibold">{s.code}</td>
              <td>
                <input
                  className={`${input} w-28`}
                  type="number"
                  step="any"
                  min="0"
                  defaultValue={s.pointValue}
                  onBlur={(e) => changeValue(s.id, s.pointValue, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                />
              </td>
              <td className="text-right">
                <button onClick={() => remove(s.id, s.code)} title={t('admin.symbols.deleteBtn', { code: s.code })} className="p-1 text-muted hover:text-loss">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
          {symbols.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-center text-muted">
                {t('admin.symbols.empty')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <form onSubmit={add} className="flex flex-wrap items-center gap-2">
        <input className={`${input} w-28 uppercase`} placeholder={t('admin.symbols.codePlaceholder')} value={code} onChange={(e) => setCode(e.target.value)} required />
        <input className={`${input} w-32`} type="number" step="any" min="0" placeholder={t('admin.symbols.valuePlaceholder')} value={value} onChange={(e) => setValue(e.target.value)} required />
        <button className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black">{t('admin.symbols.add')}</button>
      </form>
      {error && <p className="text-sm text-loss">{error}</p>}
    </section>
  )
}
