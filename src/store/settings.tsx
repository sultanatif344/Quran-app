import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_EDITION, URDU_EDITIONS } from '../api/editions'
import type { ArabicScript } from '../api/alquran'

export type Theme = 'light' | 'dark' | 'system'
/** popup = tap an ayah to see its translation; inline = translation under every ayah. */
export type TranslationMode = 'popup' | 'inline'

export interface Settings {
  /** 0 … 4, index into FONT_SCALES */
  fontStep: number
  theme: Theme
  urduEdition: string
  script: ArabicScript
  translationMode: TranslationMode
}

export const FONT_SCALES = [0.85, 1, 1.15, 1.3, 1.5]
export const FONT_LABELS_URDU = ['چھوٹا', 'درمیانہ', 'بڑا', 'بہت بڑا', 'سب سے بڑا']

const STORAGE_KEY = 'quran-settings-v1'

const DEFAULTS: Settings = {
  fontStep: 2,
  theme: 'system',
  urduEdition: DEFAULT_EDITION,
  script: 'simple',
  translationMode: 'popup',
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      fontStep: Math.min(4, Math.max(0, Number(parsed.fontStep ?? DEFAULTS.fontStep))),
      theme: parsed.theme ?? DEFAULTS.theme,
      urduEdition: URDU_EDITIONS.some((e) => e.id === parsed.urduEdition)
        ? (parsed.urduEdition as string)
        : DEFAULTS.urduEdition,
      script: parsed.script === 'uthmani' ? 'uthmani' : 'simple',
      translationMode: parsed.translationMode === 'inline' ? 'inline' : 'popup',
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

  // Apply font scale + script family
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(FONT_SCALES[settings.fontStep]))
    document.documentElement.dataset.script = settings.script
  }, [settings.fontStep, settings.script])

  // Apply theme (respecting system preference when 'system')
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && mq.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      const meta = document.querySelector('meta[name="theme-color"]')
      meta?.setAttribute('content', dark ? '#17100d' : '#33190f')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [settings.theme])

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  const stepFont = useCallback((delta: number) => {
    setSettings((s) => ({ ...s, fontStep: Math.min(4, Math.max(0, s.fontStep + delta)) }))
  }, [])

  const value = useMemo(() => ({ settings, update, stepFont }), [settings, update, stepFont])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
