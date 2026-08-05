import { authClient } from '@/lib/auth-client'
import { useAccountsQuery } from '@/lib/queries'
import { Button, Input, Label, Modal, TextField } from '@heroui/react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useProfile } from './ProfileContext'
import { Section, SectionLabel } from './primitives'
import { API_URL } from './types'

export function SettingsTab() {
  const { data: accounts } = useAccountsQuery()
  const hasCredentialAccount = accounts?.some((a: { providerId: string }) => a.providerId === 'credential') ?? false
  const { user } = useProfile()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null)

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    setChangingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(false)
    const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true })
    if (result.error) {
      setPasswordError(result.error.message ?? 'Failed to update password.')
      setChangingPassword(false)
      return
    }
    setPasswordSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setChangingPassword(false)
  }

  const handleSendPasswordSetupLink = async () => {
    if (!user?.email) return
    setChangingPassword(true)
    setPasswordError(null)
    const { error } = await authClient.requestPasswordReset({
      email: user.email,
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setChangingPassword(false)
    if (error) {
      setPasswordError(error.message ?? 'Failed to send email.')
    } else {
      setPasswordSuccess(true)
    }
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    setDeleteAccountError(null)
    const res = await fetch(`${API_URL}/api/user/account`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      setDeleteAccountError(data?.error ?? 'Failed to delete account.')
      setDeletingAccount(false)
      return
    }
    window.location.href = '/'
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SectionLabel>Password</SectionLabel>
        <Section>
          {hasCredentialAccount === false ? (
            <div className="flex flex-col gap-3 px-5 py-5">
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                You signed in with a social provider and don't have a password yet. We'll email you a link to set one.
              </p>
              {passwordSuccess ? (
                <div
                  className="rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: 'color-mix(in oklch, var(--color-success, #22c55e) 40%, transparent)',
                    backgroundColor: 'color-mix(in oklch, var(--color-success, #22c55e) 10%, transparent)',
                    color: 'var(--color-success, #22c55e)',
                  }}
                >
                  Check your inbox — we sent a link to set your password.
                </div>
              ) : (
                <>
                  {passwordError && (
                    <div
                      className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm"
                      style={{ color: 'var(--color-danger, #ef4444)' }}
                    >
                      {passwordError}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="tertiary"
                    onPress={handleSendPasswordSetupLink}
                    isPending={changingPassword}
                    className="self-start"
                  >
                    Send password setup link
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 px-5 py-5">
              {passwordSuccess && (
                <div
                  className="rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: 'color-mix(in oklch, var(--color-success, #22c55e) 40%, transparent)',
                    backgroundColor: 'color-mix(in oklch, var(--color-success, #22c55e) 10%, transparent)',
                    color: 'var(--color-success, #22c55e)',
                  }}
                >
                  Password updated successfully.
                </div>
              )}
              {passwordError && (
                <div
                  className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm"
                  style={{ color: 'var(--color-danger, #ef4444)' }}
                >
                  {passwordError}
                </div>
              )}
              <TextField name="current-password" className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-foreground-2">Current password</Label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    setPasswordError(null)
                    setPasswordSuccess(false)
                  }}
                  placeholder="••••••••"
                  variant="secondary"
                />
              </TextField>
              <TextField name="new-password" className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-foreground-2">New password</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setPasswordError(null)
                    setPasswordSuccess(false)
                  }}
                  placeholder="At least 8 characters"
                  variant="secondary"
                />
              </TextField>
              <TextField name="confirm-password" className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-foreground-2">Confirm new password</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setPasswordError(null)
                    setPasswordSuccess(false)
                  }}
                  placeholder="Repeat your password"
                  variant="secondary"
                />
              </TextField>
              <div className="flex items-center justify-between">
                <Link
                  to="/forgot-password"
                  className="text-xs underline transition-colors"
                  style={{ color: 'var(--color-muted)' }}
                >
                  Forgot current password?
                </Link>
                <Button
                  size="sm"
                  onPress={handleChangePassword}
                  isPending={changingPassword}
                  isDisabled={!newPassword || !confirmPassword || !currentPassword}
                  variant="tertiary"
                >
                  Update password
                </Button>
              </div>
            </div>
          )}
        </Section>
      </div>

      <div className="space-y-3">
        <SectionLabel>Danger Zone</SectionLabel>
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            borderColor: 'color-mix(in oklch, var(--color-danger, #ef4444) 40%, transparent)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1">
              <p className="text-sm font-semibold">Delete account</p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button size="sm" variant="danger" onPress={() => setDeleteAccountOpen(true)}>
              Delete account
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={deleteAccountOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteAccountOpen(false)
            setDeleteAccountError(null)
          }
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Delete account</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  This will permanently delete your account, sign you out of all devices, and remove your access to any
                  team or subscription.{' '}
                  <span className="font-medium" style={{ color: 'var(--color-foreground)' }}>
                    This cannot be undone.
                  </span>
                </p>
                {deleteAccountError && (
                  <p
                    className="text-xs font-medium mt-3 px-3 py-2 rounded-lg"
                    style={{
                      color: 'var(--color-danger, #ef4444)',
                      backgroundColor: 'color-mix(in oklch, var(--color-danger, #ef4444) 10%, transparent)',
                    }}
                  >
                    {deleteAccountError}
                  </p>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" slot="close">
                  Cancel
                </Button>
                <Button variant="danger" onPress={handleDeleteAccount} isPending={deletingAccount}>
                  Delete my account
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  )
}
