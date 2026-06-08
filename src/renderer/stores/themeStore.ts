import { create } from 'zustand'

type ThemeMode = 'light' | 'dark' | 'auto'

interface ThemeStore {
  mode: ThemeMode
  effectiveTheme: 'light' | 'dark'
  darkStart: number // 0-23
  darkEnd: number   // 0-23
  setMode: (mode: ThemeMode) => void
  setDarkTime: (start: number, end: number) => void
  initTheme: () => Promise<void>
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme)
}

function getTimeBasedTheme(start: number, end: number): 'light' | 'dark' {
  const hour = new Date().getHours()
  if (start <= end) {
    return (hour >= start && hour < end) ? 'dark' : 'light'
  } else {
    return (hour >= start || hour < end) ? 'dark' : 'light'
  }
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: 'light',
  effectiveTheme: 'light',
  darkStart: 18,
  darkEnd: 6,

  setMode: (mode: ThemeMode) => {
    set({ mode })
    const { darkStart, darkEnd } = get()
    let effective: 'light' | 'dark'
    if (mode === 'auto') {
      effective = getTimeBasedTheme(darkStart, darkEnd)
    } else {
      effective = mode as 'light' | 'dark'
    }
    set({ effectiveTheme: effective })
    applyTheme(effective)
    window.api.setSetting('theme_mode', mode)
  },

  setDarkTime: (start: number, end: number) => {
    set({ darkStart: start, darkEnd: end })
    window.api.setSetting('theme_dark_start', String(start))
    window.api.setSetting('theme_dark_end', String(end))
    // 如果当前是自动模式，立即应用
    if (get().mode === 'auto') {
      const effective = getTimeBasedTheme(start, end)
      set({ effectiveTheme: effective })
      applyTheme(effective)
    }
  },

  initTheme: async () => {
    const saved = await window.api.getSetting('theme_mode')
    const savedStart = await window.api.getSetting('theme_dark_start')
    const savedEnd = await window.api.getSetting('theme_dark_end')
    const mode = (saved as ThemeMode) || 'light'
    const darkStart = savedStart ? parseInt(savedStart) : 18
    const darkEnd = savedEnd ? parseInt(savedEnd) : 6
    set({ mode, darkStart, darkEnd })

    let effective: 'light' | 'dark'
    if (mode === 'auto') {
      effective = getTimeBasedTheme(darkStart, darkEnd)
    } else {
      effective = mode as 'light' | 'dark'
    }
    set({ effectiveTheme: effective })
    applyTheme(effective)

    // 每分钟检查一次定时切换
    setInterval(() => {
      if (get().mode === 'auto') {
        const { darkStart: s, darkEnd: e } = get()
        const newTheme = getTimeBasedTheme(s, e)
        if (newTheme !== get().effectiveTheme) {
          set({ effectiveTheme: newTheme })
          applyTheme(newTheme)
        }
      }
    }, 60000)
  }
}))
