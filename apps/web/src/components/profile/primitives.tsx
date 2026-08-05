import type { ReactNode } from 'react'

export function initials(name: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Section({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
      {children}
    </div>
  )
}

export function Row({ children, last }: { children: ReactNode; last?: boolean }) {
  return <div className={`flex items-center gap-4 px-5 py-4 ${last ? '' : 'border-b border-line'}`}>{children}</div>
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      className="px-1 pb-1.5 text-[10px] font-mono font-medium uppercase tracking-widest"
      style={{ color: 'var(--color-faint)' }}
    >
      {children}
    </p>
  )
}
