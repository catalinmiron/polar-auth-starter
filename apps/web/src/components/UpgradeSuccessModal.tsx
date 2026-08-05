import { CrownDiamond } from '@gravity-ui/icons'
import { Button, Modal } from '@heroui/react'

export type UpgradeVariant = 'pro' | 'team-owner' | 'team-member'

const COPY: Record<UpgradeVariant, { heading: (name: string) => string; body: string; pill: string; color: string }> = {
  pro: {
    heading: (name) => `Welcome to Pro, ${name}.`,
    body: 'Your plan is active. Everything included with Pro is now unlocked on your account.',
    pill: 'Pro',
    color: 'var(--color-accent)',
  },
  'team-owner': {
    heading: (name) => `Welcome to Team, ${name}.`,
    body: 'Your team plan is live. Invite teammates from your profile and build together.',
    pill: 'Team',
    color: 'oklch(0.50 0.22 295)',
  },
  'team-member': {
    heading: (name) => `You're on the team, ${name}.`,
    body: 'Your seat is active. Everything included with your team plan is now unlocked.',
    pill: 'Team',
    color: 'oklch(0.52 0.17 175)',
  },
}

const CSS = `
  @keyframes um-badge-enter {
    from { opacity: 0; transform: scale(0.65) rotate(-10deg); }
    to   { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes um-shimmer {
    0%   { transform: translateX(-140%) skewX(-18deg); }
    100% { transform: translateX(260%) skewX(-18deg); }
  }
  @keyframes um-ring-expand {
    from { opacity: 0.5; transform: scale(1); }
    to   { opacity: 0;   transform: scale(2.4); }
  }
  @keyframes um-slide-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .um-badge-enter, .um-shimmer, .um-ring-expand, .um-slide-up {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
  }
`

export function UpgradeSuccessModal({
  isOpen,
  onClose,
  variant,
  firstName,
}: {
  isOpen: boolean
  onClose: () => void
  variant: UpgradeVariant
  firstName: string
}) {
  const copy = COPY[variant]
  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Modal.Container>
        <Modal.Dialog className="max-w-sm">
          <style>{CSS}</style>
          <Modal.Body className="flex flex-col items-center px-8 pt-10 pb-8 text-center" style={{ gap: 0 }}>
            {/* Badge + ring */}
            <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
              <div
                className="um-ring-expand absolute rounded-2xl"
                style={{
                  width: 80,
                  height: 80,
                  border: `2px solid ${copy.color}`,
                  animation: 'um-ring-expand 1s cubic-bezier(0.16,1,0.3,1) 0.2s both',
                }}
              />
              <div
                className="um-badge-enter relative flex items-center justify-center rounded-2xl overflow-hidden"
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: copy.color,
                  animation: 'um-badge-enter 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both',
                  boxShadow: `0 12px 40px color-mix(in oklch, ${copy.color} 38%, transparent)`,
                }}
              >
                <CrownDiamond width={36} height={36} style={{ color: '#fff', position: 'relative', zIndex: 1 }} />
                <div
                  className="um-shimmer absolute top-0 bottom-0"
                  style={{
                    width: '42%',
                    left: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%)',
                    animation: 'um-shimmer 1.2s cubic-bezier(0.16,1,0.3,1) 0.75s both',
                  }}
                />
              </div>
              <div
                className="um-slide-up absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold font-mono px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: copy.color,
                  color: '#fff',
                  animation: 'um-slide-up 0.35s cubic-bezier(0.16,1,0.3,1) 0.6s both',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.06em',
                }}
              >
                {copy.pill}
              </div>
            </div>

            {/* Heading + body */}
            <div
              className="flex flex-col gap-2 mt-7"
              style={{ animation: 'um-slide-up 0.45s cubic-bezier(0.16,1,0.3,1) 0.38s both' }}
            >
              <h2 className="text-lg font-semibold text-foreground tracking-[-0.02em]">{copy.heading(firstName)}</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                {copy.body}
              </p>
            </div>

            {/* CTA */}
            <div
              className="flex flex-col gap-2 w-full mt-6"
              style={{ animation: 'um-slide-up 0.4s cubic-bezier(0.16,1,0.3,1) 0.52s both' }}
            >
              <Button variant="primary" onPress={onClose} className="w-full">
                View my account
              </Button>
            </div>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
