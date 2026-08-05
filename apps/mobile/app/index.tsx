import { router } from 'expo-router'
import { Settings } from 'lucide-react-native'
import { ActivityIndicator, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { UserAvatar } from '../components/auth/UserAvatar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../lib/store'

export default function HomeScreen() {
  const { user, loading } = useAuth()
  const insets = useSafeAreaInsets()

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }}
    >
      {/* Brand */}
      <View className="items-center gap-2 mt-10">
        <Text className="text-foreground text-3xl font-bold tracking-tight">Polar Auth Starter</Text>
        <Text className="text-muted text-sm">Expo + better-auth + Polar billing</Text>
      </View>

      <View className="flex-1 justify-center">
        {loading ? (
          <View className="items-center">
            <ActivityIndicator size="small" color="#8a8a99" />
          </View>
        ) : user ? (
          <Card className="gap-5">
            <View className="flex-row items-center gap-4">
              <UserAvatar name={user.name} email={user.email} image={user.image} size={48} />
              <View className="flex-1 gap-0.5">
                <Text className="text-foreground text-lg font-semibold" numberOfLines={1}>
                  Hey, {user.name || user.email}
                </Text>
                <Text className="text-muted text-sm" numberOfLines={1}>
                  You are signed in.
                </Text>
              </View>
            </View>
            <Button
              title="Settings"
              variant="secondary"
              icon={<Settings size={16} color="#8a8a99" />}
              onPress={() => router.push('/settings')}
            />
          </Card>
        ) : (
          <View className="gap-6">
            <View className="items-center gap-2">
              <Text className="text-foreground text-xl font-semibold text-center">Welcome</Text>
              <Text className="text-muted text-sm text-center leading-5">
                Sign in to your account or create a new one to see the auth and billing flows in action.
              </Text>
            </View>
            <View className="gap-3">
              <Button title="Log in" onPress={() => router.push('/login')} />
              <Button title="Sign up" variant="secondary" onPress={() => router.push('/signup')} />
            </View>
          </View>
        )}
      </View>

      {/* Footer */}
      <Text className="text-faint text-xs text-center">Open-source starter — swap in your own product and ship.</Text>
    </View>
  )
}
