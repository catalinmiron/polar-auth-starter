import { Link, router } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native'
import { SocialSignInButton } from '../components/auth/SocialSignInButton'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { getSession, signInWithEmail } from '../lib/auth'
import { authClient } from '../lib/authClient'
import { useAuth } from '../lib/store'

export default function LoginScreen() {
  const { setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<'github' | 'google' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    if (!email.trim() || !password) return
    setLoading(true)
    setError(null)
    try {
      const user = await signInWithEmail(email.trim(), password)
      setUser(user)
      router.replace('/')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign in failed'
      setError(
        msg.toLowerCase().includes('verify') || msg.toLowerCase().includes('verified')
          ? 'Please verify your email before signing in. Check your inbox for a verification link.'
          : msg,
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleSocialSignIn(provider: 'github' | 'google') {
    setSocialLoading(provider)
    setError(null)
    try {
      const { error: authError } = await authClient.signIn.social({
        provider,
        callbackURL: '/',
      })
      if (authError) throw new Error(authError.message ?? 'Sign in failed')
      const user = await getSession()
      if (user) {
        setUser(user)
        router.replace('/')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed')
    } finally {
      setSocialLoading(null)
    }
  }

  const isAnyLoading = loading || !!socialLoading

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background justify-center items-center p-6"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="items-center mb-8">
        <Text className="text-foreground text-2xl font-bold tracking-tight">Polar Auth Starter</Text>
      </View>

      <Card className="w-full max-w-sm gap-5">
        <View className="gap-1">
          <Text className="text-foreground text-xl font-semibold">Sign in</Text>
          <Text className="text-muted text-sm">Welcome back — access your account</Text>
        </View>

        {/* Social sign-in */}
        <View className="gap-2">
          <SocialSignInButton
            provider="github"
            onPress={() => handleSocialSignIn('github')}
            isLoading={socialLoading === 'github'}
          />
          <SocialSignInButton
            provider="google"
            onPress={() => handleSocialSignIn('google')}
            isLoading={socialLoading === 'google'}
          />
        </View>

        {/* Divider */}
        <View className="flex-row items-center gap-3">
          <View className="flex-1 h-px bg-separator" />
          <Text className="text-muted text-xs">or</Text>
          <View className="flex-1 h-px bg-separator" />
        </View>

        {/* Email / password */}
        <View className="gap-3">
          <TextField
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="next"
          />
          <TextField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
            error={error}
          />
        </View>

        <Button title="Sign in" onPress={handleSignIn} loading={loading} disabled={isAnyLoading} />

        <View className="items-center gap-2">
          <Link href="/forgot-password" asChild>
            <Text className="text-muted text-sm underline">Forgot password?</Text>
          </Link>
          <View className="flex-row gap-1">
            <Text className="text-muted text-sm">No account?</Text>
            <Link href="/signup" asChild>
              <Text className="text-foreground text-sm font-medium underline">Sign up</Text>
            </Link>
          </View>
        </View>
      </Card>
    </KeyboardAvoidingView>
  )
}
