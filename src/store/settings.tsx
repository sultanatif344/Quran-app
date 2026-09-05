import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_EDITION, URDU_EDITIONS } from '../api/editions'
import type { ArabicScript } from '../api/quranCom'
import { DEFAULT_STEP, FONT_SCALES, MAX_STEP } from '../data/fontScale'

export type Theme = 'light' | 'dark' | 'system'

export interface Settings {
  /** Index into FONT_SCALES */
  fontStep: number
  theme: Theme
  urduEdition: string
  script: ArabicScript
}

const STORAGE_KEY = 'quran-settings-v3'

const DEFAULTS: Settings = {
  fontStep: DEFAULT_STEP,
  theme: 'system',
  urduEdition: DEFAULT_EDITION,
  script: 'simple',
}

function load(): Settings {
  try {
    let raw = localStorage.getItem(STORAGE_KEY)
    let migrated = false
    if (!raw) {
      // v2 → v3: keep font/theme/script, but take the new default translation.
      raw = localStorage.getItem('quran-settings-v2')
      migrated = true
    }
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Settings>
    if (migrated) parsed.urduEdition = DEFAULTS.urduEdition
    return {
      fontStep: Math.min(MAX_STEP, Math.max(0, Number(parsed.fontStep ?? DEFAULTS.fontStep))),
      theme: parsed.theme ?? DEFAULTS.theme,
      urduEdition: URDU_EDITIONS.some((e) => e.id === parsed.urduEdition)
        ? (parsed.urduEdition as string)
        : DEFAULTS.urduEdition,
      script: parsed.script === 'uthmani' ? 'uthmani' : 'simple',
    }
  } catch {
    return DEFAULTS
  }
}

interface SettingsContextValue {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  stepFont: (delta: number) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      /* ignore */
    }
  }, [settings])

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(FONT_SCALES[settings.fontStep]))
    document.documentElement.dataset.script = settings.script
  }, [settings.fontStep, settings.script])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && mq.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#17100d' : '#33190f')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [settings.theme])

  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), [])
  const stepFont = useCallback(
    (delta: number) => setSettings((s) => ({ ...s, fontStep: Math.min(MAX_STEP, Math.max(0, s.fontStep + delta)) })),
    [],
  )

  const value = useMemo(() => ({ settings, update, stepFont }), [settings, update, stepFont])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
