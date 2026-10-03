import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { money, pnlColor } from '../lib/format'
import { BIASES, emptyReview, getReview, saveReview, type Bias, type WeeklyReview } from '../lib/reviewsApi'
import { computeStats, dayKey } from '../lib/stats'
import { useTrades } from '../lib/tradesContext'
import { addWeeks, formatWeek, inWeek, weekStartOf } from '../lib/weeks'

const area = 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green'

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
  // Open on the week of the newest trade, otherwise the week before today.
  const [week, setWeek] = useState(() => (trades[0] ? weekStartOf(new Date(trades[0].entryTime)) : addWeeks(weekStartOf(new Date()), -1)))
  const [dirty, setDirty] = useState(false)

  const goTo = (w: string) => {
    if (dirty && !window.confirm('You have unsaved changes. Leave this week without saving?')) return
    setDirty(false)
    setWeek(w)
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-semibold">Weekly review</h1>
        <button onClick={() => goTo(addWeeks(week, -1))} title="Previous week" className="rounded p-1 text-muted hover:text-green">
          <ChevronLeft size={20} />
        </button>
        <span className="min-w-44 text-center text-sm font-semibold">{formatWeek(week)}</span>
        <button onClick={() => goTo(addWeeks(week, 1))} title="Next week" className="rounded p-1 text-muted hover:text-green">
          <ChevronRight size={20} />
        </button>
        <button onClick={() => goTo(addWeeks(weekStartOf(new Date()), -1))} className="rounded border border-line px-2 py-1 text-xs text-muted hover:text-green">
          Last week
        </button>
      </div>
      {/* key remounts the editor, so each week loads its own text */}
      <ReviewEditor key={week} week={week} onDirty={setDirty} />
    </div>
  )
}

function ReviewEditor({ week, onDirty }: { week: string; onDirty: (d: boolean) => void }) {
  const { trades } = useTrades()
  const [review, setReview] = useState<WeeklyReview>(() => emptyReview(week))
  const [previous, setPrevious] = useState<WeeklyReview | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'saving' | 'saved'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getReview(week), getReview(addWeeks(week, -1))])
      .then(([current, prev]) => {
        if (cancelled) return
        if (current) setReview(current)
        setPrevious(prev)
        setState('ready')
      })
      .catch((e: Error) => {
        if (cancelled) return
        setError(e.message)
        setState('ready')
      })
    return () => {
      cancelled = true
    }
  }, [week])

  const stats = useMemo(() => computeStats(trades.filter((t) => inWeek(dayKey(t.entryTime), week))), [trades, week])

  const set = <K extends keyof WeeklyReview>(key: K, value: WeeklyReview[K]) => {
    setReview((r) => ({ ...r, [key]: value }))
    setState('ready')
    onDirty(true)
  }

  async function save() {
    setState('saving')
    setError(null)
    try {
      await saveReview(review)
      onDirty(false)
      setState('saved')
    } catch (e) {
      setError((e as Error).message)
      setState('ready')
    }
  }

  if (state === 'loading') return <p className="text-muted">Loading…</p>

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
        <button onClick={save} disabled={state === 'saving'} className="rounded-lg bg-green px-5 py-2 font-semibold text-black disabled:opacity-50">
          {state === 'saving' ? 'Saving…' : 'Save review'}
        </button>
        {state === 'saved' && <span className="text-sm text-green">Saved</span>}
      </div>
    </div>
  )
}
