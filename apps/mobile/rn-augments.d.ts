// Module augmentation — makes className available on React Native core components.
// This mirrors the augmentations in node_modules/uniwind/types.d.ts but is loaded
// via the tsconfig include pattern (*.d.ts at app root).
import 'react-native'

declare module 'react-native' {
  interface ViewProps {
    className?: string
  }
  interface TextProps {
    className?: string
  }
  interface TextInputProps {
    className?: string
  }
  interface ImageProps {
    className?: string
  }
  interface PressableProps {
    className?: string
  }
  interface ScrollViewProps {
    className?: string
  }
  interface KeyboardAvoidingViewProps {
    className?: string
  }
}
