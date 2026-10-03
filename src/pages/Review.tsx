import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import ReviewList, { type ReviewListItem } from '../components/ReviewList'
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
  if (loading) return <p className="text-muted">Loading…</p>
  if (error) return <p className="text-loss">{error}</p>
  return <WeekView />
}

// Mounted only after the trades have loaded, so the starting week can depend on them.
function WeekView() {
  const { trades } = useTrades()
  const confirm = useConfirm()
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

  const leaveOk = async () => !dirty || (await confirm('You have unsaved changes. Leave without saving?', { title: 'Unsaved changes' }))

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
    setNotice(`Saved the review for ${formatWeek(r.weekStart)}. It is in the "Saved reviews" list; click it to read or edit.`)
  }

  async function remove(w: string) {
    if (!(await confirm(`Delete the review for ${formatWeek(w)}? This cannot be undone.`, { title: 'Delete review', danger: true }))) return
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
          <h1 className="mr-auto text-xl font-semibold">Weekly review</h1>
          <button onClick={() => open(addWeeks(week, -1))} title="Previous week" className="rounded p-1 text-muted hover:text-green">
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-44 text-center text-sm font-semibold">{formatWeek(week)}</span>
          <button onClick={() => open(addWeeks(week, 1))} title="Next week" className="rounded p-1 text-muted hover:text-green">
            <ChevronRight size={20} />
          </button>
          <button onClick={() => open(addWeeks(weekStartOf(new Date()), -1))} className="rounded border border-line px-2 py-1 text-xs text-muted hover:text-green">
            Last week
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
    if (alreadySaved && !loadedExisting && !(await confirm(`A review for ${formatWeek(week)} is already saved. Replace it with this one?`, { title: 'Replace saved review' }))) return
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

  if (!loaded) return <p className="text-muted">Loading…</p>

  const expected = previous && (previous.bias || previous.outlook || previous.plan || previous.keyLevels) ? previous : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Net P&L', <span key="p" className={pnlColor(stats.netPnl)}>{money(stats.netPnl)}</span>],
          ['Trades', stats.trades],
          ['Win rate', `${(stats.winRate * 100).toFixed(0)}%`],
          ['Wins / Losses', `${stats.wins} / ${stats.losses}`],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-line bg-surface p-3">
            <div className="text-xs text-muted">{label}</div>
            <div className="text-lg font-semibold">{value}</div>
          </div>
        ))}
      </div>

      {expected && (
        <Card title="What I expected for this week" subtitle="Written at the end of the previous week. Compare it with what actually happened.">
          <div className="space-y-2 text-sm">
            {expected.bias && <p><span className="text-muted">Bias:</span> <span className="font-semibold capitalize">{expected.bias}</span></p>}
            {expected.outlook && <p className="whitespace-pre-wrap"><span className="text-muted">Thoughts:</span> {expected.outlook}</p>}
            {expected.keyLevels && <p className="whitespace-pre-wrap"><span className="text-muted">Key levels:</span> {expected.keyLevels}</p>}
            {expected.plan && <p className="whitespace-pre-wrap"><span className="text-muted">Plan:</span> {expected.plan}</p>}
          </div>
        </Card>
      )}

      <Card title="Looking back at this week" subtitle="Be honest. This is only for you.">
        <Box label="Emotional analysis" hint="How did I feel? Where did emotions drive decisions (fear, FOMO, revenge, overconfidence)?" value={review.emotional} onChange={(v) => set('emotional', v)} />
        <Box label="Technical analysis" hint="What did the market do? Were my setups, entries and exits right?" value={review.technical} onChange={(v) => set('technical', v)} />
        <Box label="Mistakes I made" hint="What exactly did I do wrong? Be specific." value={review.mistakes} onChange={(v) => set('mistakes', v)} />
        <Box label="Lessons and what I will do differently" value={review.lessons} onChange={(v) => set('lessons', v)} rows={4} />
      </Card>

      <Card title="Next week outlook" subtitle={`My thoughts about the market for the week of ${formatWeek(addWeeks(week, 1))}.`}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Market bias</span>
          <select className={`${area} sm:w-60`} value={review.bias ?? ''} onChange={(e) => set('bias', (e.target.value || null) as Bias | null)}>
            <option value="">Not set</option>
            {BIASES.map((b) => (
              <option key={b} value={b} className="capitalize">
                {b}
              </option>
            ))}
          </select>
        </label>
        <Box label="Market thoughts" hint="Where do I think the market is going, and why? Events to watch (CPI, FOMC, earnings)." value={review.outlook} onChange={(v) => set('outlook', v)} />
        <Box label="Key levels" hint="Support, resistance, prior highs and lows." value={review.keyLevels} onChange={(v) => set('keyLevels', v)} rows={3} />
        <Box label="Game plan and rules" hint="What will I trade, how much, and what will I NOT do?" value={review.plan} onChange={(v) => set('plan', v)} rows={4} />
      </Card>

      {error && <p className="text-sm text-loss">{error}</p>}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving || isReviewEmpty(review)} className="rounded-lg bg-green px-5 py-2 font-semibold text-black disabled:opacity-40">
          {saving ? 'Saving…' : 'Save review'}
        </button>
        {isReviewEmpty(review) && <span className="text-xs text-muted">Write something to enable saving.</span>}
      </div>
    </div>
  )
}
