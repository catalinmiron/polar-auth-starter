import { Link, router } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { signUpWithEmail } from '../lib/auth'

export default function SignupScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !password) return
    setLoading(true)
    setError(null)
    try {
      await signUpWithEmail(name.trim(), email.trim(), password)
      setVerificationSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (verificationSent) {
    return (
      <View className="flex-1 bg-background justify-center items-center p-6">
        <Card className="w-full max-w-sm items-center gap-4">
          <Text className="text-5xl">📬</Text>
          <Text className="text-foreground text-xl font-semibold">Check your email</Text>
          <Text className="text-muted text-sm text-center leading-5">
            We sent a verification link to <Text className="text-foreground font-semibold">{email.trim()}</Text>. Click
            it to activate your account.
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
          <Text className="text-foreground text-xl font-semibold">Create your account</Text>
          <View className="flex-row gap-1">
            <Text className="text-muted text-sm">Already have an account?</Text>
            <Link href="/login" asChild>
              <Text className="text-foreground text-sm font-medium underline">Sign in</Text>
            </Link>
          </View>
        </View>

        <View className="gap-3">
          <TextField
            label="Name"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            returnKeyType="next"
          />
          <TextField
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="next"
          />
          <TextField
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
            error={error}
          />
        </View>

        <Button title="Create account" onPress={handleSignUp} loading={loading} />
      </Card>
    </KeyboardAvoidingView>
  )
}
