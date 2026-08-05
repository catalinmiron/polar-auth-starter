import { useState } from 'react'
import { Image, Text, View } from 'react-native'
import { dicebearUrl } from '../../lib/dicebear'

type Props = {
  name?: string | null
  email?: string | null
  image?: string | null
  size?: number
}

function initialsOf(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || '?'
  return source
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function UserAvatar({ name, email, image, size = 32 }: Props) {
  const [failed, setFailed] = useState(false)
  const src = image ?? dicebearUrl(name ?? email ?? 'user')

  if (failed) {
    return (
      <View
        className="items-center justify-center bg-surface-secondary"
        style={{ width: size, height: size, borderRadius: size / 2 }}
      >
        <Text className="text-muted font-semibold" style={{ fontSize: size * 0.38 }}>
          {initialsOf(name, email)}
        </Text>
      </View>
    )
  }

  return (
    <Image
      source={{ uri: src }}
      onError={() => setFailed(true)}
      className="bg-surface-secondary"
      style={{ width: size, height: size, borderRadius: size / 2 }}
      resizeMode="cover"
    />
  )
}
