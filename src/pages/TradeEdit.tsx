import { Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import ImageGallery from '../components/ImageGallery'
import TradeForm from '../components/TradeForm'
import { useTrades } from '../lib/tradesContext'
import type { TradeInput } from '../lib/tradesApi'

/** Used for both /trades/new and /trades/:id. */
export default function TradeEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trades, loading, add, update, remove } = useTrades()
  const existing = id ? trades.find((t) => t.id === id) : undefined

  if (loading) return <p className="text-muted">Loading…</p>
  if (id && !existing) return <p className="text-loss">Trade not found.</p>

  async function save(t: TradeInput) {
    if (existing) await update(existing.id, t)
    else await add(t)
    navigate('/trades')
  }

  async function del() {
    if (existing && window.confirm('Delete this trade? This cannot be undone.')) {
      await remove(existing.id)
      navigate('/trades')
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{existing ? 'Edit trade' : 'New trade'}</h1>
        {existing && (
          <button onClick={del} className="flex items-center gap-2 text-sm text-loss hover:underline">
            <Trash2 size={16} /> Delete
          </button>
        )}
      </div>
      {existing ? (
        <ImageGallery tradeId={existing.id} />
      ) : (
        <p className="text-sm text-muted">Save the trade first, then open it to attach screenshots.</p>
      )}
      <TradeForm initial={existing} submitLabel={existing ? 'Save changes' : 'Add trade'} onSubmit={save} />
    </div>
  )
}
