import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.classList.contains('light') ? 'light' : 'dark'
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.classList.toggle('light', theme === 'light')
  try {
    localStorage.setItem('theme', theme)
  } catch {}
}

export function useTheme(): Theme {
  const [theme, setThemeState] = useState<Theme>(readTheme)
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeState(readTheme()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return theme
}
