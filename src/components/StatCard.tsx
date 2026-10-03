import type { ReactNode } from 'react'

export default function StatCard({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-line bg-surface p-4 ${className}`}>
      <div className="mb-2 text-sm text-muted">{title}</div>
      {children}
    </div>
  )
}
