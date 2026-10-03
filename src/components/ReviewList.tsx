import { Trash2 } from 'lucide-react'
import { useI18n } from '../i18n/context'
import { money, pnlColor } from '../lib/format'
import type { WeeklyReview } from '../lib/reviewsApi'
import { formatWeek } from '../lib/weeks'

export interface ReviewListItem {
  review: WeeklyReview
  netPnl: number
  trades: number
}

const BIAS_COLOR = { bullish: 'text-green', bearish: 'text-loss', neutral: 'text-muted', unclear: 'text-warn' } as const

const excerpt = (r: WeeklyReview) => {
  const text = [r.mistakes, r.emotional, r.technical, r.lessons, r.outlook].find((t) => t.trim()) ?? ''
  return text.length > 110 ? `${text.slice(0, 110).trim()}…` : text
}

export default function ReviewList({
  items,
  activeWeek,
  onOpen,
  onDelete,
}: {
  items: ReviewListItem[]
  activeWeek: string
  onOpen: (week: string) => void
  onDelete: (week: string) => void
}) {
  const { t, tn, locale } = useI18n()
  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <h2 className="text-lg font-semibold">
        {t('review.list.title')} <span className="text-sm font-normal text-muted">({items.length})</span>
      </h2>
      {items.length === 0 && <p className="text-sm text-muted">{t('review.list.empty')}</p>}
      <ul className="space-y-2">
        {items.map(({ review, netPnl, trades }) => (
          <li key={review.weekStart} className={`group flex items-start gap-2 rounded-lg border p-3 ${review.weekStart === activeWeek ? 'border-green' : 'border-line'}`}>
            <button onClick={() => onOpen(review.weekStart)} className="min-w-0 flex-1 text-left">
              <div className="flex flex-wrap items-center gap-x-3 text-sm font-semibold">
                {formatWeek(review.weekStart, locale)}
                {review.bias && <span className={`text-xs capitalize ${BIAS_COLOR[review.bias]}`}>{t('review.list.nextBias', { bias: t(`bias.${review.bias}`) })}</span>}
              </div>
              <div className="text-xs text-muted">
                {tn('unit.trade', trades)} · <span className={pnlColor(netPnl)}>{money(netPnl)}</span>
              </div>
              {excerpt(review) && <p className="mt-1 text-sm text-muted">{excerpt(review)}</p>}
            </button>
            <button onClick={() => onDelete(review.weekStart)} title={t('review.list.delete')} className="p-1 text-muted hover:text-loss">
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
