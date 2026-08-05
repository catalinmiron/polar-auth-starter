import { Text, TextInput, View, type TextInputProps } from 'react-native'

type Props = TextInputProps & {
  label: string
  error?: string | null
}

export function TextField({ label, error, className = '', ...inputProps }: Props) {
  return (
    <View className="gap-1.5">
      <Text className="text-foreground text-sm font-medium">{label}</Text>
      <TextInput
        placeholderTextColor="#8a8a99"
        className={`h-12 rounded-xl border px-4 text-base text-foreground bg-background ${
          error ? 'border-danger' : 'border-separator'
        } ${className}`}
        {...inputProps}
      />
      {error ? <Text className="text-danger text-xs">{error}</Text> : null}
    </View>
  )
}
