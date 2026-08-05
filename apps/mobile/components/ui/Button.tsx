import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-accent',
  secondary: 'bg-surface-secondary border border-separator',
  ghost: 'bg-transparent',
  danger: 'bg-transparent border border-danger/40',
}

const LABEL: Record<ButtonVariant, string> = {
  primary: 'text-accent-foreground',
  secondary: 'text-foreground',
  ghost: 'text-muted',
  danger: 'text-danger',
}

// ActivityIndicator needs a concrete color value (it is not a Text node)
const SPINNER_COLOR: Record<ButtonVariant, string> = {
  primary: '#ffffff',
  secondary: '#8a8a99',
  ghost: '#8a8a99',
  danger: '#e5484d',
}

type Props = {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  /** Extra classes for the container (e.g. "mt-4 self-stretch") */
  className?: string
  /** Optional icon rendered before the label */
  icon?: ReactNode
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, className = '', icon }: Props) {
  const isDisabled = disabled || loading
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`h-12 flex-row items-center justify-center gap-2 rounded-xl px-4 ${CONTAINER[variant]} ${className}`}
      style={({ pressed }) => ({ opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1 })}
    >
      {loading ? (
        <ActivityIndicator size="small" color={SPINNER_COLOR[variant]} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={`text-base font-semibold ${LABEL[variant]}`}>{title}</Text>
        </View>
      )}
    </Pressable>
  )
}
