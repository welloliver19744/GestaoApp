import { useState, useEffect, useCallback } from 'react'

const THEME_KEY = 'gestaocasa-theme'

export function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark'
    return (localStorage.getItem(THEME_KEY) as 'dark' | 'light') || 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('light', theme === 'light')
    root.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggle = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(THEME_KEY, next)
      return next
    })
  }, [])

  const setTheme = useCallback((t: 'dark' | 'light') => {
    localStorage.setItem(THEME_KEY, t)
    setThemeState(t)
  }, [])

  return { theme, toggle, setTheme }
}
