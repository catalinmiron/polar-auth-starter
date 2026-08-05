import { Link, router } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { requestPasswordReset } from '../lib/auth'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <View className="flex-1 bg-background justify-center items-center p-6">
        <Card className="w-full max-w-sm items-center gap-4">
          <Text className="text-5xl">📬</Text>
          <Text className="text-foreground text-xl font-semibold">Check your email</Text>
          <Text className="text-muted text-sm text-center leading-5">
            If an account exists for <Text className="text-foreground font-semibold">{email.trim()}</Text>, we sent a
            password reset link. Check your inbox.
          </Text>
          <Button title="Back to sign in" variant="secondary" onPress={() => router.replace('/login')} />
        </Card>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background justify-center items-center p-6"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Card className="w-full max-w-sm gap-5">
        <View className="gap-1">
          <Text className="text-foreground text-xl font-semibold">Forgot your password?</Text>
          <Text className="text-muted text-sm">Enter your email and we'll send you a reset link.</Text>
        </View>

        <TextField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          error={error}
        />

        <Button title="Send reset link" onPress={handleSubmit} loading={loading} />

        <View className="items-center">
          <Link href="/login" asChild>
            <Text className="text-muted text-sm underline">Back to sign in</Text>
          </Link>
        </View>
      </Card>
    </KeyboardAvoidingView>
  )
}
