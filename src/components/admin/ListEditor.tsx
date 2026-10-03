import { Check, Pencil, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useI18n } from '../../i18n/context'
import { useConfirm } from '../../lib/confirmContext'
import { validateNames } from '../../lib/labels'
import { DuplicateError } from '../../lib/settingsApi'
import { useSettings } from '../../lib/settingsContext'
import type { OptionKind } from '../../lib/settingsTypes'

const input = 'rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green'

interface Props {
  kind: OptionKind
  title: string
  hint: string
  /** How many saved trades use this English name, shown in the delete confirmation. */
  usage: (name: string) => number
}

export default function ListEditor({ kind, title, hint, usage }: Props) {
  const { options, addOption, setOptionKa, removeOption, label } = useSettings()
  const confirm = useConfirm()
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [nameKa, setNameKa] = useState('')
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const items = options.filter((o) => o.kind === kind)

  const describe = (err: unknown) => (err instanceof DuplicateError ? t('admin.exists', { name: err.itemName }) : (err as Error).message)

  async function add(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const problem = validateNames(name, nameKa)
    if (problem) return setError(t(problem === 'empty' ? 'admin.err.empty' : 'admin.err.englishHasGeorgian'))
    try {
      await addOption(kind, name, nameKa)
      setName('')
      setNameKa('')
    } catch (err) {
      setError(describe(err))
    }
  }

  async function saveKa() {
    if (!editing) return
    setError(null)
    if (!editing.value.trim()) return setError(t('admin.err.empty'))
    try {
      await setOptionKa(editing.id, editing.value)
      setEditing(null)
    } catch (err) {
      setError(describe(err))
    }
  }

  async function remove(id: string, itemName: string) {
    const used = usage(itemName)
    const note = used ? `\n\n${t('admin.list.usedNote', { n: used })}` : ''
    if (!(await confirm(`${t('admin.list.removeBody', { name: label(kind, itemName) })}${note}`, { title: t(`admin.${kind}.removeTitle`), danger: true }))) return
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

      {items.length === 0 ? (
        <p className="text-sm text-muted">{t('admin.nothingHere')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="pb-2">{t('admin.list.colEn')}</th>
              <th className="pb-2">{t('admin.list.colKa')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.id} className="border-t border-line">
                <td className="py-2 pr-3">{o.name}</td>
                <td className="pr-3">
                  {editing?.id === o.id ? (
                    <span className="flex items-center gap-1">
                      <input
                        autoFocus
                        className={`${input} w-48 py-1`}
                        value={editing.value}
                        onChange={(e) => setEditing({ id: o.id, value: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void saveKa()
                          if (e.key === 'Escape') setEditing(null)
                        }}
                      />
                      <button onClick={saveKa} title={t('admin.list.save')} className="p-1 text-green">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditing(null)} title={t('admin.list.cancel')} className="p-1 text-muted hover:text-loss">
                        <X size={16} />
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      {o.nameKa ?? <span className="text-warn">{label(kind, o.name) !== o.name ? label(kind, o.name) : t('admin.list.missingKa')}</span>}
                      <button onClick={() => setEditing({ id: o.id, value: o.nameKa ?? '' })} title={t('admin.list.editKa')} className="p-1 text-muted hover:text-green">
                        <Pencil size={14} />
                      </button>
                    </span>
                  )}
                </td>
                <td className="text-right">
                  <button onClick={() => remove(o.id, o.name)} title={t('admin.list.removeBtn', { name: label(kind, o.name) })} className="p-1 text-muted hover:text-loss">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={add} className="flex flex-wrap items-center gap-2">
        <input className={`${input} w-48`} placeholder={t('admin.list.nameEn')} value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={`${input} w-48`} placeholder={t('admin.list.nameKa')} value={nameKa} onChange={(e) => setNameKa(e.target.value)} required />
        <button className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black">{t('admin.add')}</button>
      </form>
      <p className="text-xs text-muted">{t('admin.list.bothNeeded')}</p>
      {error && <p className="text-sm text-loss">{error}</p>}
    </section>
  )
}
