import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useSettings } from '../../lib/settingsContext'
import type { OptionKind } from '../../lib/settingsTypes'

const input = 'rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green'

interface Props {
  kind: OptionKind
  title: string
  hint: string
  /** How many saved trades use this name, shown in the delete confirmation. */
  usage: (name: string) => number
}

export default function ListEditor({ kind, title, hint, usage }: Props) {
  const { options, addOption, removeOption } = useSettings()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const items = options.filter((o) => o.kind === kind)

  async function add(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await addOption(kind, name)
      setName('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function remove(id: string, itemName: string) {
    const used = usage(itemName)
    const note = used ? `\n\n${used} existing trade(s) use it. They keep it; it just disappears from the pick-list.` : ''
    if (!window.confirm(`Remove "${itemName}"?${note}`)) return
    setError(null)
    try {
      await removeOption(id)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted">{hint}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((o) => (
          <span key={o.id} className="flex items-center gap-1 rounded-full border border-line py-1 pl-3 pr-1 text-sm">
            {o.name}
            <button onClick={() => remove(o.id, o.name)} title={`Remove ${o.name}`} className="rounded-full p-1 text-muted hover:text-loss">
              <X size={14} />
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-sm text-muted">Nothing here yet.</span>}
      </div>
      <form onSubmit={add} className="flex gap-2">
        <input className={`${input} w-56`} placeholder={`New ${kind}`} value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black">Add</button>
      </form>
      {error && <p className="text-sm text-loss">{error}</p>}
    </section>
  )
}
