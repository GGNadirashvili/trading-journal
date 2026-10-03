import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import ReviewList, { type ReviewListItem } from '../components/ReviewList'
import { useI18n } from '../i18n/context'
import { useConfirm } from '../lib/confirmContext'
import { money, pnlColor } from '../lib/format'
import { BIASES, deleteReview, emptyReview, getReview, isReviewEmpty, listReviews, saveReview, type Bias, type WeeklyReview } from '../lib/reviewsApi'
import { computeStats, dayKey } from '../lib/stats'
import { useTrades } from '../lib/tradesContext'
import type { Trade } from '../lib/types'
import { addWeeks, formatWeek, inWeek, weekStartOf } from '../lib/weeks'

const area = 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green'

const tradesOfWeek = (trades: Trade[], week: string) => trades.filter((t) => inWeek(dayKey(t.entryTime), week))

function Box({ label, hint, value, onChange, rows = 5 }: { label: string; hint?: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {hint && <span className="mb-1 block text-xs text-muted">{hint}</span>}
      <textarea className={area} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-line bg-surface p-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

export default function Review() {
  const { loading, error } = useTrades()
  const { t } = useI18n()
  if (loading) return <p className="text-muted">{t('common.loading')}</p>
  if (error) return <p className="text-loss">{error}</p>
  return <WeekView />
}

// Mounted only after the trades have loaded, so the starting week can depend on them.
function WeekView() {
  const { trades } = useTrades()
  const confirm = useConfirm()
  const { t, locale } = useI18n()
  // Open on the week of the newest trade, otherwise the week before today.
  const [week, setWeek] = useState(() => (trades[0] ? weekStartOf(new Date(trades[0].entryTime)) : addWeeks(weekStartOf(new Date()), -1)))
  const [dirty, setDirty] = useState(false)
  const [reviews, setReviews] = useState<WeeklyReview[]>([])
  const [listError, setListError] = useState<string | null>(null)
  // After a save the form starts empty (blank) instead of reloading what was just saved.
  const [blank, setBlank] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    listReviews()
      .then((r) => setReviews(r))
      .catch((e: Error) => setListError(e.message))
  }, [])

  const items: ReviewListItem[] = useMemo(
    () =>
      [...reviews]
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
        .map((review) => {
          const stats = computeStats(tradesOfWeek(trades, review.weekStart))
          return { review, netPnl: stats.netPnl, trades: stats.trades }
        }),
    [reviews, trades],
  )

  const leaveOk = async () => !dirty || (await confirm(t('review.unsavedBody'), { title: t('review.unsavedTitle') }))

  async function open(w: string) {
    if (!(await leaveOk())) return
    setDirty(false)
    setBlank(false)
    setNotice(null)
    setWeek(w)
    setEditorKey((k) => k + 1)
  }

  function saved(r: WeeklyReview) {
    setReviews((cur) => [...cur.filter((x) => x.weekStart !== r.weekStart), r])
    setDirty(false)
    setBlank(true)
    setEditorKey((k) => k + 1)
    setNotice(t('review.saved', { week: formatWeek(r.weekStart, locale) }))
  }

  async function remove(w: string) {
    if (!(await confirm(t('review.deleteBody', { week: formatWeek(w, locale) }), { title: t('review.deleteTitle'), danger: true }))) return
    try {
      await deleteReview(w)
      setReviews((cur) => cur.filter((x) => x.weekStart !== w))
      if (w === week) {
        setDirty(false)
        setBlank(true)
        setEditorKey((k) => k + 1)
      }
    } catch (e) {
      setListError((e as Error).message)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-xl font-semibold">{t('review.title')}</h1>
          <button onClick={() => open(addWeeks(week, -1))} title={t('review.prevWeek')} className="rounded p-1 text-muted hover:text-green">
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-44 text-center text-sm font-semibold">{formatWeek(week, locale)}</span>
          <button onClick={() => open(addWeeks(week, 1))} title={t('review.nextWeek')} className="rounded p-1 text-muted hover:text-green">
            <ChevronRight size={20} />
          </button>
          <button onClick={() => open(addWeeks(weekStartOf(new Date()), -1))} className="rounded border border-line px-2 py-1 text-xs text-muted hover:text-green">
            {t('review.lastWeek')}
          </button>
        </div>
        {notice && <p className="rounded-lg border border-green p-3 text-sm text-green">{notice}</p>}
        <ReviewEditor
          key={`${week}-${editorKey}`}
          week={week}
          startBlank={blank}
          alreadySaved={reviews.some((r) => r.weekStart === week)}
          onDirty={(d) => {
            setDirty(d)
            if (d) setNotice(null)
          }}
          onSaved={saved}
        />
      </div>
      <aside className="space-y-2">
        {listError && <p className="text-sm text-loss">{listError}</p>}
        <ReviewList items={items} activeWeek={week} onOpen={open} onDelete={remove} />
      </aside>
    </div>
  )
}

function ReviewEditor({
  week,
  startBlank,
  alreadySaved,
  onDirty,
  onSaved,
}: {
  week: string
  startBlank: boolean
  alreadySaved: boolean
  onDirty: (d: boolean) => void
  onSaved: (r: WeeklyReview) => void
}) {
  const { trades } = useTrades()
  const confirm = useConfirm()
  const { t, locale } = useI18n()
  const [review, setReview] = useState<WeeklyReview>(() => emptyReview(week))
  const [previous, setPrevious] = useState<WeeklyReview | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadedExisting, setLoadedExisting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([startBlank ? Promise.resolve(null) : getReview(week), getReview(addWeeks(week, -1))])
      .then(([current, prev]) => {
        if (cancelled) return
        if (current) {
          setReview(current)
          setLoadedExisting(true)
        }
        setPrevious(prev)
        setLoaded(true)
      })
      .catch((e: Error) => {
        if (cancelled) return
        setError(e.message)
        setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [week, startBlank])

  const stats = useMemo(() => computeStats(tradesOfWeek(trades, week)), [trades, week])

  const set = <K extends keyof WeeklyReview>(key: K, value: WeeklyReview[K]) => {
    setReview((r) => ({ ...r, [key]: value }))
    onDirty(true)
  }

  async function save() {
    // Typing into a blank form for a week that already has a saved review would replace it, so ask first.
    if (alreadySaved && !loadedExisting && !(await confirm(t('review.replaceBody', { week: formatWeek(week, locale) }), { title: t('review.replaceTitle') }))) return
    setSaving(true)
    setError(null)
    try {
      await saveReview(review)
      onSaved(review)
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  if (!loaded) return <p className="text-muted">{t('common.loading')}</p>

  const expected = previous && (previous.bias || previous.outlook || previous.plan || previous.keyLevels) ? previous : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [t('review.stat.net'), <span key="p" className={pnlColor(stats.netPnl)}>{money(stats.netPnl)}</span>],
          [t('review.stat.trades'), stats.trades],
          [t('review.stat.winRate'), `${(stats.winRate * 100).toFixed(0)}%`],
          [t('review.stat.winsLosses'), `${stats.wins} / ${stats.losses}`],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-line bg-surface p-3">
            <div className="text-xs text-muted">{label}</div>
            <div className="text-lg font-semibold">{value}</div>
          </div>
        ))}
      </div>

      {expected && (
        <Card title={t('review.expected.title')} subtitle={t('review.expected.sub')}>
          <div className="space-y-2 text-sm">
            {expected.bias && <p><span className="text-muted">{t('review.expected.bias')}</span> <span className="font-semibold capitalize">{t(`bias.${expected.bias}`)}</span></p>}
            {expected.outlook && <p className="whitespace-pre-wrap"><span className="text-muted">{t('review.expected.thoughts')}</span> {expected.outlook}</p>}
            {expected.keyLevels && <p className="whitespace-pre-wrap"><span className="text-muted">{t('review.expected.levels')}</span> {expected.keyLevels}</p>}
            {expected.plan && <p className="whitespace-pre-wrap"><span className="text-muted">{t('review.expected.plan')}</span> {expected.plan}</p>}
          </div>
        </Card>
      )}

      <Card title={t('review.back.title')} subtitle={t('review.back.sub')}>
        <Box label={t('review.emotional')} hint={t('review.emotional.hint')} value={review.emotional} onChange={(v) => set('emotional', v)} />
        <Box label={t('review.technical')} hint={t('review.technical.hint')} value={review.technical} onChange={(v) => set('technical', v)} />
        <Box label={t('review.mistakes')} hint={t('review.mistakes.hint')} value={review.mistakes} onChange={(v) => set('mistakes', v)} />
        <Box label={t('review.lessons')} value={review.lessons} onChange={(v) => set('lessons', v)} rows={4} />
      </Card>

      <Card title={t('review.next.title')} subtitle={t('review.next.sub', { week: formatWeek(addWeeks(week, 1), locale) })}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t('review.bias')}</span>
          <select className={`${area} sm:w-60`} value={review.bias ?? ''} onChange={(e) => set('bias', (e.target.value || null) as Bias | null)}>
            <option value="">{t('review.bias.none')}</option>
            {BIASES.map((b) => (
              <option key={b} value={b} className="capitalize">
                {t(`bias.${b}`)}
              </option>
            ))}
          </select>
        </label>
        <Box label={t('review.outlook')} hint={t('review.outlook.hint')} value={review.outlook} onChange={(v) => set('outlook', v)} />
        <Box label={t('review.levels')} hint={t('review.levels.hint')} value={review.keyLevels} onChange={(v) => set('keyLevels', v)} rows={3} />
        <Box label={t('review.plan')} hint={t('review.plan.hint')} value={review.plan} onChange={(v) => set('plan', v)} rows={4} />
      </Card>

      {error && <p className="text-sm text-loss">{error}</p>}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving || isReviewEmpty(review)} className="rounded-lg bg-green px-5 py-2 font-semibold text-black disabled:opacity-40">
          {saving ? t('review.saving') : t('review.save')}
        </button>
        {isReviewEmpty(review) && <span className="text-xs text-muted">{t('review.writeFirst')}</span>}
      </div>
    </div>
  )
}
