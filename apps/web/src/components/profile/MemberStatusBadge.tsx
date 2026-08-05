import type { CSSProperties } from 'react'

type Props = { status: 'pending' | 'claimed' | 'revoked' }

const STYLES: Record<string, CSSProperties> = {
  claimed: {
    backgroundColor: 'color-mix(in oklch, var(--color-success, #22c55e) 15%, transparent)',
    color: 'var(--color-success, #22c55e)',
  },
  pending: { backgroundColor: 'color-mix(in oklch, #f59e0b 15%, transparent)', color: '#f59e0b' },
  revoked: {
    backgroundColor: 'color-mix(in oklch, var(--color-muted, #6b7280) 15%, transparent)',
    color: 'var(--color-muted, #6b7280)',
  },
}

export function MemberStatusBadge({ status }: Props) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={STYLES[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
