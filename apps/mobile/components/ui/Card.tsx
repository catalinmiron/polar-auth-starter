import { View, type ViewProps } from 'react-native'

export function Card({ className = '', children, ...props }: ViewProps) {
  return (
    <View className={`rounded-2xl border border-separator bg-surface p-5 ${className}`} {...props}>
      {children}
    </View>
  )
}
