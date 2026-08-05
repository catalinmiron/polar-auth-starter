import { setTheme, useTheme } from '@/hooks/useTheme'
import { Moon, Sun } from '@gravity-ui/icons'

type ThemeToggleProps = {
  className?: string
  style?: React.CSSProperties
  iconSize?: number
}

export function ThemeToggle({ className, style, iconSize = 16 }: ThemeToggleProps) {
  const theme = useTheme()
  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className={className ?? 'flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-surface'}
      aria-label="Toggle theme"
      style={style ?? { color: 'var(--color-muted)' }}
    >
      {theme === 'light' ? <Moon width={iconSize} height={iconSize} /> : <Sun width={iconSize} height={iconSize} />}
    </button>
  )
}
