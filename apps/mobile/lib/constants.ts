import Constants from 'expo-constants'
import { Platform } from 'react-native'

function getDevApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL
  // Derive host from Metro's hostUri — works on any network without hardcoding an IP.
  // hostUri looks like "192.168.x.x:8081"; we swap the port for the API port.
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoClient?.hostUri
  if (hostUri) {
    const host = hostUri.split(':')[0]
    return `http://${host}:8787`
  }
  // Emulator fallbacks
  return Platform.OS === 'android' ? 'http://10.0.2.2:8787' : 'http://localhost:8787'
}

// TODO: replace with your deployed API origin before shipping a production build.
export const PROD_API_URL = 'https://api.example.com'

export const API_URL = __DEV__ ? getDevApiUrl() : PROD_API_URL
