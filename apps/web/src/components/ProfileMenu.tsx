import { authClient } from '@/lib/auth-client'
import { dicebearUrl } from '@/lib/dicebear'
import { queryKeys } from '@/lib/queries'
import { ArrowRightFromSquare, Gear, Person, Tag } from '@gravity-ui/icons'
import { Avatar, Dropdown, Label, Separator } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export type ProfileMenuUser = {
  name?: string | null
  email?: string | null
  image?: string | null
}

type ProfileMenuProps = {
  user: ProfileMenuUser | null | undefined
  placement?: string
  triggerClassName?: string
}

function UserAvatar({
  user,
  displayName,
  size = 'sm',
}: {
  user: ProfileMenuUser | null | undefined
  displayName: string
  size?: 'sm'
}) {
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return (
    <Avatar size={size} color="accent" className="cursor-pointer size-7">
      <Avatar.Image src={user?.image ?? dicebearUrl(displayName)} alt={displayName} />
      <Avatar.Fallback className="text-[10px]">{initials}</Avatar.Fallback>
    </Avatar>
  )
}

export function ProfileMenu({ user, placement = 'bottom end', triggerClassName }: ProfileMenuProps) {
  const displayName = user?.name ?? user?.email ?? ''
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
      <Dropdown.Trigger className={['rounded-full outline-none', triggerClassName].filter(Boolean).join(' ')}>
        <UserAvatar user={user} displayName={displayName} />
      </Dropdown.Trigger>
      <Dropdown.Popover placement={placement as any} className="w-[220px] min-w-0 max-w-[220px]">
        {/* User info header */}
        <div className="px-3 pt-3 pb-3 min-w-0 overflow-hidden border-b border-line">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0">
              <UserAvatar user={user} displayName={displayName} />
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden gap-0.5">
              {user?.name && (
                <p
                  className="text-[12px] font-semibold leading-none truncate"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  {user.name}
                </p>
              )}
              {user?.email && (
                <p className="text-[11px] leading-none truncate" style={{ color: 'var(--color-muted)' }}>
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </div>
        <Dropdown.Menu
          onAction={(key) => {
            setIsOpen(false)
            if (key === 'profile') {
              navigate({ to: '/app/profile', search: { tab: 'profile' } })
            } else if (key === 'settings') {
              navigate({ to: '/app/profile', search: { tab: 'settings' } })
            } else if (key === 'pricing') {
              navigate({ to: '/pricing' })
            } else if (key === 'logout') {
              authClient.signOut().then(() => {
                queryClient.setQueryData(queryKeys.session(), null)
                navigate({ to: '/' })
              })
            }
          }}
        >
          <Dropdown.Item id="profile" textValue="Profile">
            <div className="flex w-full items-center justify-between gap-2">
              <Label>Profile</Label>
              <Person className="size-3.5 text-muted shrink-0" />
            </div>
          </Dropdown.Item>
          <Dropdown.Item id="settings" textValue="Settings">
            <div className="flex w-full items-center justify-between gap-2">
              <Label>Settings</Label>
              <Gear className="size-3.5 text-muted shrink-0" />
            </div>
          </Dropdown.Item>
          <Dropdown.Item id="pricing" textValue="Pricing">
            <div className="flex w-full items-center justify-between gap-2">
              <Label>Pricing</Label>
              <Tag className="size-3.5 text-muted shrink-0" />
            </div>
          </Dropdown.Item>
          <Separator />
          <Dropdown.Item id="logout" textValue="Log out" variant="danger">
            <div className="flex w-full items-center justify-between gap-2">
              <Label>Log out</Label>
              <ArrowRightFromSquare className="size-3.5 shrink-0" style={{ color: 'var(--color-danger)' }} />
            </div>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
