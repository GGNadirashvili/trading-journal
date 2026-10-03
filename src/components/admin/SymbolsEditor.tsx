import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useConfirm } from '../../lib/confirmContext'
import { useSettings } from '../../lib/settingsContext'
import { useTrades } from '../../lib/tradesContext'

const input = 'rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green'

export default function SymbolsEditor() {
  const { symbols, addSymbol, updateSymbol, removeSymbol } = useSettings()
  const { trades } = useTrades()
  const confirm = useConfirm()
  const [code, setCode] = useState('')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<void>) => {
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function add(e: FormEvent) {
    e.preventDefault()
    const pv = Number(value)
    if (!(pv > 0)) return setError('Point value must be a number above 0.')
    void run(async () => {
      await addSymbol(code, pv)
      setCode('')
      setValue('')
    })
  }

  async function remove(id: string, symbol: string) {
    const used = trades.filter((t) => t.symbol === symbol).length
    const note = used ? `\n\n${used} existing trade(s) use ${symbol}. They are kept, but you will not be able to pick ${symbol} for new trades.` : ''
    if (await confirm(`Delete symbol ${symbol}?${note}`, { title: 'Delete symbol', danger: true })) void run(() => removeSymbol(id))
  }

  function changeValue(id: string, current: number, raw: string) {
    const pv = Number(raw)
    if (pv === current) return
    if (!(pv > 0)) return setError('Point value must be a number above 0.')
    void run(() => updateSymbol(id, pv))
  }

  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <div>
        <h2 className="text-lg font-semibold">Symbols</h2>
        <p className="text-sm text-muted">
          The point value is the dollars one full price point is worth per contract (MNQ = 2, ES = 50). It is used to compute P&L when you enter
          entry and exit prices.
        </p>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-muted">
          <tr>
            <th className="pb-2">Symbol</th>
            <th className="pb-2">$ per point</th>
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
                <button onClick={() => remove(s.id, s.code)} title={`Delete ${s.code}`} className="p-1 text-muted hover:text-loss">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
          {symbols.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-center text-muted">
                No symbols yet. Add one below.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <form onSubmit={add} className="flex flex-wrap items-center gap-2">
        <input className={`${input} w-28 uppercase`} placeholder="Symbol" value={code} onChange={(e) => setCode(e.target.value)} required />
        <input className={`${input} w-32`} type="number" step="any" min="0" placeholder="$ per point" value={value} onChange={(e) => setValue(e.target.value)} required />
        <button className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black">Add symbol</button>
      </form>
      {error && <p className="text-sm text-loss">{error}</p>}
    </section>
  )
}
