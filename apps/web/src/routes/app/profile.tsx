import { ProfileMenu } from '@/components/ProfileMenu'
import { QueryErrorBoundary } from '@/components/QueryErrorBoundary'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UpgradeSuccessModal } from '@/components/UpgradeSuccessModal'
import { ProfileProvider, useProfile } from '@/components/profile/ProfileContext'
import { ProfileTab } from '@/components/profile/ProfileTab'
import { SettingsTab } from '@/components/profile/SettingsTab'
import type { Tab } from '@/components/profile/types'
import { fetchAccounts, fetchSubscription, fetchTeam, queryKeys } from '@/lib/queries'
import { Gear, House, Person } from '@gravity-ui/icons'
import { Button, Skeleton, Tabs } from '@heroui/react'
import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Suspense, useEffect, useRef, useState } from 'react'
import { z } from 'zod'

const searchSchema = z.object({
  tab: z.enum(['profile', 'settings']).optional(),
  upgraded: z.coerce.boolean().optional(),
})

export const Route = createFileRoute('/app/profile')({
  validateSearch: searchSchema,
  component: ProfilePage,
  loader: ({ context: { queryClient } }) => {
    queryClient.prefetchQuery({ queryKey: queryKeys.subscription(), queryFn: fetchSubscription })
    queryClient.prefetchQuery({ queryKey: queryKeys.team(), queryFn: fetchTeam })
    queryClient.prefetchQuery({ queryKey: queryKeys.accounts(), queryFn: fetchAccounts })
  },
})

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'profile', label: 'Profile', Icon: Person },
  { key: 'settings', label: 'Settings', Icon: Gear },
]

function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-line bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Skeleton className="h-4 w-20 rounded" />
          <div className="flex-1" />
          <Skeleton className="size-7 rounded-full" />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* Mobile: horizontal tab strip + stacked content */}
        <div className="md:hidden space-y-6">
          <div className="flex gap-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-8 flex-1 rounded-lg" />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <div className="grid grid-cols-1 gap-4 pt-2">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          </div>
        </div>
        {/* Desktop: sidebar + content */}
        <div className="hidden md:flex gap-8 items-start">
          <div className="w-40 shrink-0 space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ProfilePage() {
  const { tab, upgraded } = useSearch({ from: '/app/profile' })
  const navigate = useNavigate()
  const activeTab: Tab = tab ?? 'profile'
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(upgraded === true)

  return (
    <QueryErrorBoundary>
      <Suspense fallback={<ProfilePageSkeleton />}>
        <ProfileProvider>
          <ProfilePageContent
            activeTab={activeTab}
            showUpgradeSuccess={showUpgradeSuccess}
            onDismissUpgrade={() => {
              setShowUpgradeSuccess(false)
              navigate({ to: '/app/profile', search: { tab: activeTab }, replace: true })
            }}
            onTabChange={(key) => navigate({ to: '/app/profile', search: { tab: key as Tab } })}
          />
        </ProfileProvider>
      </Suspense>
    </QueryErrorBoundary>
  )
}

type ContentProps = {
  activeTab: Tab
  showUpgradeSuccess: boolean
  onDismissUpgrade: () => void
  onTabChange: (key: React.Key) => void
}

function ProfilePageContent({ activeTab, showUpgradeSuccess, onDismissUpgrade, onTabChange }: ContentProps) {
  const { user, subscription, isOwner } = useProfile()
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  const tabListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    setIsMobile(mq.matches)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isMobile || !tabListRef.current) return
    const selected = tabListRef.current.querySelector('[aria-selected="true"]') as HTMLElement | null
    selected?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeTab, isMobile])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-line bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <h1 className="text-sm font-semibold">Account</h1>
          <div className="flex-1" />
          <Link to="/">
            <Button isIconOnly size="sm" variant="ghost" aria-label="Go to homepage">
              <House width={16} height={16} />
            </Button>
          </Link>
          <ThemeToggle iconSize={15} />
          <ProfileMenu user={user} placement="bottom end" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <Tabs
          orientation={isMobile ? 'horizontal' : 'vertical'}
          variant="secondary"
          selectedKey={activeTab}
          onSelectionChange={onTabChange}
          className={isMobile ? undefined : 'gap-8 items-start'}
        >
          <Tabs.ListContainer
            className={
              isMobile
                ? 'w-full mb-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                : 'w-40 shrink-0'
            }
          >
            <Tabs.List
              ref={tabListRef}
              aria-label="Account navigation"
              className={isMobile ? 'min-w-max w-auto' : undefined}
            >
              {TABS.map(({ key, label, Icon }) => (
                <Tabs.Tab
                  key={key}
                  id={key}
                  className={isMobile ? 'flex-1 justify-center gap-1.5' : 'justify-start gap-2.5'}
                >
                  <Tabs.Indicator />
                  <Icon width={15} height={15} style={{ flexShrink: 0 }} />
                  {label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel id="profile" className="p-0 flex-1 min-w-0">
            <QueryErrorBoundary>
              <ProfileTab />
            </QueryErrorBoundary>
          </Tabs.Panel>

          <Tabs.Panel id="settings" className="p-0 flex-1 min-w-0">
            <QueryErrorBoundary>
              <SettingsTab />
            </QueryErrorBoundary>
          </Tabs.Panel>
        </Tabs>
      </main>

      <UpgradeSuccessModal
        isOpen={showUpgradeSuccess}
        onClose={onDismissUpgrade}
        variant={subscription?.plan === 'team' ? (isOwner ? 'team-owner' : 'team-member') : 'pro'}
        firstName={user.name?.split(' ')[0] ?? 'there'}
      />
    </div>
  )
}
