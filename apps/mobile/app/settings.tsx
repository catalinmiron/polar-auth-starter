import AsyncStorage from '@react-native-async-storage/async-storage'
import { PLAN_LABELS } from '@repo/types'
import { useQueryClient } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
import { LogOut } from 'lucide-react-native'
import { useEffect, useState, type ReactNode } from 'react'
import { ActivityIndicator, ScrollView, Switch, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Uniwind, useUniwind } from 'uniwind'
import { UserAvatar } from '../components/auth/UserAvatar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { THEME_STORAGE_KEY } from './_layout'
import { signOut } from '../lib/auth'
import { useSubscription } from '../lib/queries'
import { useAuth } from '../lib/store'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'text-success' },
  canceled: { label: 'Canceled', className: 'text-muted' },
  past_due: { label: 'Past due', className: 'text-warning' },
}

export default function SettingsScreen() {
  const { user, loading: authLoading, setUser } = useAuth()
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()
  const { theme } = useUniwind()
  const { data: subscription, isLoading: loading } = useSubscription()
  const [signingOut, setSigningOut] = useState(false)

  const isDark = theme === 'dark'
  const bgColor = isDark ? '#0e0d16' : '#f7f7f9'
  const fgColor = isDark ? '#f2f2f7' : '#1c1c22'

  // Auth guard — this screen is only for signed-in users
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user])

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    queryClient.clear()
    setUser(null)
    router.replace('/')
  }

  const planLabel = subscription ? (PLAN_LABELS[subscription.plan] ?? subscription.plan) : PLAN_LABELS.free
  const statusConfig = subscription ? STATUS_CONFIG[subscription.status] : null
  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  if (authLoading || !user) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="small" color="#8a8a99" />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: { backgroundColor: bgColor },
          headerTitleStyle: { color: fgColor },
          headerTintColor: fgColor,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
      >
        {/* Profile */}
        <Card>
          <View className="flex-row items-center gap-4">
            <UserAvatar name={user.name} email={user.email} image={user.image} size={56} />
            <View className="flex-1 gap-0.5">
              <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
                {user.name || '—'}
              </Text>
              <Text className="text-muted text-sm" numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          </View>
        </Card>

        {/* Plan */}
        <SectionLabel>Plan</SectionLabel>
        <Card className="p-0">
          {loading ? (
            <View className="h-16 justify-center items-center">
              <ActivityIndicator size="small" color="#8a8a99" />
            </View>
          ) : (
            <>
              <Row label="Current plan">
                <View className="bg-surface-secondary rounded-lg px-3 py-1">
                  <Text className="text-accent text-sm font-semibold">{planLabel}</Text>
                </View>
              </Row>

              {statusConfig && (
                <Row label="Status" separator>
                  <Text className={`text-sm font-medium ${statusConfig.className}`}>{statusConfig.label}</Text>
                </Row>
              )}

              {periodEnd && (
                <Row label={subscription?.cancelAtPeriodEnd ? 'Cancels on' : 'Renews on'} separator>
                  <Text className="text-muted text-sm">{periodEnd}</Text>
                </Row>
              )}

              {!subscription && (
                <View className="px-4 pb-4">
                  <Text className="text-muted text-sm">Upgrade on the web app to unlock paid features.</Text>
                </View>
              )}
            </>
          )}
        </Card>

        {/* Preferences */}
        <SectionLabel>Preferences</SectionLabel>
        <Card className="p-0">
          <View className="flex-row items-center justify-between px-4 py-3">
            <View className="gap-0.5">
              <Text className="text-foreground text-base">Dark mode</Text>
              <Text className="text-muted text-xs">{isDark ? 'Enabled' : 'Disabled'}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(val) => {
                const newTheme = val ? 'dark' : 'light'
                Uniwind.setTheme(newTheme)
                AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme)
              }}
            />
          </View>
        </Card>

        {/* Account */}
        <SectionLabel>Account</SectionLabel>
        <Button
          title={signingOut ? 'Signing out…' : 'Sign out'}
          variant="danger"
          loading={signingOut}
          icon={<LogOut size={16} color="#e5484d" />}
          onPress={handleSignOut}
        />
      </ScrollView>
    </>
  )
}

function Row({ label, children, separator }: { label: string; children: ReactNode; separator?: boolean }) {
  return (
    <>
      {separator && <View className="h-px bg-separator mx-4" />}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-foreground text-base">{label}</Text>
        {children}
      </View>
    </>
  )
}

function SectionLabel({ children }: { children: string }) {
  return <Text className="text-muted text-xs font-medium uppercase tracking-wider ml-1 mt-2">{children}</Text>
}
