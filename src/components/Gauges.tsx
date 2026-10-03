// Small SVG visuals for the dashboard cards. Green = good, red = bad.

/** Half-circle split into wins (green) and losses (red). */
export function WinGauge({ wins, losses, wash, rate }: { wins: number; losses: number; wash: number; rate: number }) {
  const len = Math.PI * 80
  const total = wins + losses
  const green = total ? (len * wins) / total : 0
  const arc = 'M 20 100 A 80 80 0 0 1 180 100'
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-full max-w-[260px]">
        <path d={arc} fill="none" stroke="var(--color-line)" strokeWidth="14" strokeLinecap="round" />
        {total > 0 && (
          <>
            <path d={arc} fill="none" stroke="var(--color-loss)" strokeWidth="14" strokeDasharray={`${len - green} ${len}`} strokeDashoffset={-green} />
            <path d={arc} fill="none" stroke="var(--color-green)" strokeWidth="14" strokeDasharray={`${green} ${len}`} />
          </>
        )}
        <text x="100" y="90" textAnchor="middle" fill="currentColor" fontSize="22" fontWeight="600">
          {(rate * 100).toFixed(1)}%
        </text>
      </svg>
      <div className="mt-1 flex gap-2 text-xs">
        <span className="rounded-full bg-green/20 px-2 py-0.5 text-green">{wins}</span>
        <span className="rounded-full bg-muted/20 px-2 py-0.5 text-muted">{wash}</span>
        <span className="rounded-full bg-loss/20 px-2 py-0.5 text-loss">{losses}</span>
      </div>
    </div>
  )
}

/** Donut of gross profit vs gross loss. */
export function ProfitDonut({ grossWin, grossLoss }: { grossWin: number; grossLoss: number }) {
  const r = 28
  const c = 2 * Math.PI * r
  const total = grossWin - grossLoss
  const green = total ? (c * grossWin) / total : 0
  return (
    <svg viewBox="0 0 70 70" className="h-16 w-16 -rotate-90">
      <circle cx="35" cy="35" r={r} fill="none" stroke="var(--color-line)" strokeWidth="8" />
      {total > 0 && (
        <>
          <circle cx="35" cy="35" r={r} fill="none" stroke="var(--color-loss)" strokeWidth="8" />
          <circle cx="35" cy="35" r={r} fill="none" stroke="var(--color-green)" strokeWidth="8" strokeDasharray={`${green} ${c}`} />
        </>
      )}
    </svg>
  )
}

/** Horizontal bar: green share = avg win vs red share = avg loss. */
export function WinLossBar({ avgWin, avgLoss }: { avgWin: number; avgLoss: number }) {
  const total = avgWin + Math.abs(avgLoss)
  const pct = total ? (avgWin / total) * 100 : 50
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-line">
      <div className="bg-green" style={{ width: `${pct}%` }} />
      <div className="bg-loss" style={{ width: `${100 - pct}%` }} />
    </div>
  )
}
