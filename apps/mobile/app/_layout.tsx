import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { Appearance } from 'react-native'
import { Uniwind } from 'uniwind'
import '../global.css'
import { getSession } from '../lib/auth'
import { auth$ } from '../lib/store'

export const THEME_STORAGE_KEY = 'app:theme'

// Synchronously apply device theme before first render to avoid flash
Uniwind.setTheme(Appearance.getColorScheme() === 'light' ? 'light' : 'dark')

// Keep the native splash visible until we finish loading theme + session
SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24, // 24h — keep cache across sessions
    },
  },
})

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'REACT_QUERY_CACHE',
  throttleTime: 3_000,
})

export default function RootLayout() {
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
        // Only override if user has a stored manual preference
        if (saved === 'light' || saved === 'dark') Uniwind.setTheme(saved)
      }),
      getSession().then((u) => {
        auth$.user.set(u)
        auth$.loading.set(false)
      }),
    ]).then(() => SplashScreen.hideAsync())

    const sub = Appearance.addChangeListener(async ({ colorScheme }) => {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY)
      // Only follow device if user hasn't set a manual preference
      if (saved !== 'light' && saved !== 'dark') {
        Uniwind.setTheme(colorScheme === 'light' ? 'light' : 'dark')
      }
    })
    return () => sub.remove()
  }, [])

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="settings" />
      </Stack>
    </PersistQueryClientProvider>
  )
}
