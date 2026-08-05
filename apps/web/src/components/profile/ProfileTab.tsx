import { authClient } from '@/lib/auth-client'
import { dicebearUrl } from '@/lib/dicebear'
import { queryKeys } from '@/lib/queries'
import { CrownDiamond, Plus, TrashBin } from '@gravity-ui/icons'
import { Avatar, Button, Input, Modal } from '@heroui/react'
import type { TeamMember } from '@repo/types'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { MemberStatusBadge } from './MemberStatusBadge'
import { useProfile } from './ProfileContext'
import { Row, Section, SectionLabel, initials } from './primitives'
import { API_URL, STATUS_DOT } from './types'

export function ProfileTab() {
  const { user, subscription, team, planLabel, isTeam, isOwner, teamOwner, canManageBilling, members } = useProfile()
  const queryClient = useQueryClient()

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null)

  const handleSignOut = async () => {
    setSigningOut(true)
    await authClient.signOut()
    window.location.href = '/'
  }

  const handleInvite = async () => {
    if (!inviteEmail) return
    setInviting(true)
    setInviteError(null)
    const res = await fetch(`${API_URL}/api/user/team/invite`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || data?.error) {
      setInviteError(data?.error ?? 'Failed to send invite.')
      setInviting(false)
      return
    }
    setInviteEmail('')
    setInviting(false)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.team() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription() }),
    ])
  }

  const handleManageBilling = async () => {
    setBillingError(null)
    const res = await fetch(`${API_URL}/api/user/portal`, { credentials: 'include' })
    const data = await res.json().catch(() => null)
    if (data?.url) {
      window.location.href = data.url
    } else {
      setBillingError(data?.error ?? `Failed to open billing portal (${res.status}).`)
    }
  }

  const confirmRemove = async () => {
    if (!removeTarget) return
    const target = removeTarget
    setRemoving(target.id)
    const res = await fetch(`${API_URL}/api/user/team/member/${target.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    setRemoving(null)
    setRemoveTarget(null)
    if (res.ok) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.team() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.subscription() }),
      ])
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SectionLabel>Profile</SectionLabel>
        <Section>
          <Row>
            <Avatar size="md" color="accent">
              <Avatar.Image src={user.image ?? dicebearUrl(user.name ?? user.email)} alt={user.name ?? user.email} />
              <Avatar.Fallback className="text-sm">{initials(user.name ?? user.email)}</Avatar.Fallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>
                {user.email}
              </p>
            </div>
          </Row>
          <Row last>
            <div className="flex-1">
              <p className="text-sm">Sign out</p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Sign out of all devices
              </p>
            </div>
            <Button variant="danger-soft" size="sm" onPress={handleSignOut} isPending={signingOut}>
              Sign out
            </Button>
          </Row>
        </Section>
      </div>

      <div className="space-y-3">
        <SectionLabel>Subscription</SectionLabel>
        <Section>
          <Row last={!canManageBilling}>
            <div
              className="flex items-center justify-center rounded-lg size-9 shrink-0"
              style={{ backgroundColor: 'color-mix(in oklch, var(--color-accent) 15%, transparent)' }}
            >
              <CrownDiamond width={16} height={16} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{planLabel}</p>
                {subscription &&
                  (() => {
                    const key = subscription.cancelAtPeriodEnd ? 'canceling' : subscription.status
                    const label = subscription.cancelAtPeriodEnd
                      ? 'cancels soon'
                      : subscription.status.replace('_', ' ')
                    return (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                        <span className={`size-1.5 rounded-full ${STATUS_DOT[key]}`} />
                        {label}
                      </span>
                    )
                  })()}
              </div>
              {subscription && (
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {isTeam && `${subscription.seats} seat${subscription.seats !== 1 ? 's' : ''}`}
                  {subscription.currentPeriodEnd
                    ? (isTeam ? ' · ' : '') +
                      (subscription.cancelAtPeriodEnd
                        ? `access until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                        : `renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`)
                    : ''}
                </p>
              )}
            </div>
            {!subscription && (
              <Link to="/pricing">
                <Button size="sm">Upgrade</Button>
              </Link>
            )}
          </Row>
          {canManageBilling && (
            <Row last>
              <div className="flex-1">
                <p className="text-sm">Billing &amp; invoices</p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Manage your plan, payment method, and invoices
                </p>
                {billingError && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-danger, #ef4444)' }}>
                    {billingError}
                  </p>
                )}
              </div>
              <Button size="sm" variant="tertiary" onPress={handleManageBilling}>
                Manage
              </Button>
            </Row>
          )}
        </Section>
      </div>

      {isTeam && (
        <div className="space-y-3">
          <SectionLabel>Team</SectionLabel>
          <Section>
            {teamOwner && (
              <Row>
                <Avatar size="sm">
                  <Avatar.Image
                    src={dicebearUrl(teamOwner.name ?? teamOwner.email)}
                    alt={teamOwner.name ?? teamOwner.email}
                  />
                  <Avatar.Fallback className="text-xs">{initials(teamOwner.name ?? teamOwner.email)}</Avatar.Fallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{teamOwner.name ?? teamOwner.email}</p>
                  {teamOwner.name && (
                    <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>
                      {teamOwner.email}
                    </p>
                  )}
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full border border-line shrink-0"
                  style={{ color: 'var(--color-accent)' }}
                >
                  owner
                </span>
              </Row>
            )}
            {(isOwner ? members : members.filter((m) => m.status === 'claimed')).map((m, i, arr) => {
              const isSelf = m.externalId === user.id || m.email?.toLowerCase() === user.email?.toLowerCase()
              const canRemove = isOwner && !isSelf && m.role !== 'owner'
              const isLast = !isOwner && i === arr.length - 1
              return (
                <Row key={m.id} last={isLast}>
                  <Avatar size="sm">
                    <Avatar.Image src={dicebearUrl(m.name ?? m.email)} alt={m.name ?? m.email} />
                    <Avatar.Fallback className="text-xs">{initials(m.name ?? m.email)}</Avatar.Fallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name ?? m.email}</p>
                    {m.name && (
                      <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>
                        {m.email}
                      </p>
                    )}
                  </div>
                  {isOwner && m.role !== 'owner' && <MemberStatusBadge status={m.status} />}
                  {m.role === 'owner' && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full border border-line shrink-0"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      owner
                    </span>
                  )}
                  {canRemove && (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label="Remove member"
                      onPress={() => setRemoveTarget(m)}
                    >
                      <TrashBin width={13} height={13} />
                    </Button>
                  )}
                </Row>
              )
            })}
            {isOwner &&
              (() => {
                const availableSeats = team
                  ? Math.max(0, team.seats - members.filter((m) => m.role !== 'owner').length)
                  : 0
                return (
                  <Row last>
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      {team && team.seats > 0 && (
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {availableSeats} of {team.seats} seat{team.seats !== 1 ? 's' : ''} available
                        </p>
                      )}
                      {availableSeats > 0 ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Input
                              aria-label="Invite email"
                              type="email"
                              placeholder="teammate@example.com"
                              value={inviteEmail}
                              onChange={(e) => {
                                setInviteEmail(e.target.value)
                                setInviteError(null)
                              }}
                              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                              className="flex-1 min-w-0"
                              variant="secondary"
                            />
                            <Button size="sm" variant="tertiary" isPending={inviting} onPress={handleInvite}>
                              <Plus width={13} height={13} />
                              Invite
                            </Button>
                          </div>
                          {inviteError && (
                            <p
                              className="text-xs font-medium px-3 py-2 rounded-lg"
                              style={{
                                color: 'var(--color-danger, #ef4444)',
                                backgroundColor: 'color-mix(in oklch, var(--color-danger, #ef4444) 10%, transparent)',
                              }}
                            >
                              {inviteError}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs py-1" style={{ color: 'var(--color-muted)' }}>
                          All seats are taken.{' '}
                          <button
                            className="underline"
                            style={{ color: 'var(--color-accent)' }}
                            onClick={handleManageBilling}
                          >
                            Upgrade your plan
                          </button>{' '}
                          to add more seats.
                        </p>
                      )}
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        Members can also be managed in the{' '}
                        <button
                          className="underline"
                          style={{ color: 'var(--color-accent)' }}
                          onClick={handleManageBilling}
                        >
                          billing portal
                        </button>
                        .
                      </p>
                    </div>
                  </Row>
                )
              })()}
          </Section>
        </div>
      )}

      <Modal
        isOpen={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null)
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Remove member</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  Remove{' '}
                  <span className="font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {removeTarget?.name ?? removeTarget?.email}
                  </span>{' '}
                  from your team? They will lose access immediately.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" slot="close">
                  Cancel
                </Button>
                <Button variant="danger" onPress={confirmRemove} isPending={!!removing}>
                  Remove
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  )
}
