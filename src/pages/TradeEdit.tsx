import { Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import ImageGallery from '../components/ImageGallery'
import TradeForm from '../components/TradeForm'
import { useI18n } from '../i18n/context'
import { useConfirm } from '../lib/confirmContext'
import { useTrades } from '../lib/tradesContext'
import type { TradeInput } from '../lib/tradesApi'

/** Used for both /trades/new and /trades/:id. */
export default function TradeEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trades, loading, add, update, remove } = useTrades()
  const confirm = useConfirm()
  const { t } = useI18n()
  const existing = id ? trades.find((t) => t.id === id) : undefined

  if (loading) return <p className="text-muted">{t('common.loading')}</p>
  if (id && !existing) return <p className="text-loss">{t('trade.notFound')}</p>

  async function save(t: TradeInput) {
    if (existing) await update(existing.id, t)
    else await add(t)
    navigate('/trades')
  }

  async function del() {
    if (existing && (await confirm(t('trade.deleteBody'), { title: t('trade.deleteTitle'), danger: true }))) {
      await remove(existing.id)
      navigate('/trades')
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{existing ? t('trade.edit') : t('trade.new')}</h1>
        {existing && (
          <button onClick={del} className="flex items-center gap-2 text-sm text-loss hover:underline">
            <Trash2 size={16} /> {t('common.delete')}
          </button>
        )}
      </div>
      {existing ? (
        <ImageGallery tradeId={existing.id} />
      ) : (
        <p className="text-sm text-muted">{t('trade.saveFirst')}</p>
      )}
      <TradeForm initial={existing} submitLabel={existing ? t('trade.saveChanges') : t('trade.add')} onSubmit={save} />
    </div>
  )
}
