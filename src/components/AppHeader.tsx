import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSettings } from '../store/settings'

interface Props {
  title: ReactNode
  subtitle?: ReactNode
  /** Where the back button goes; omit to hide it. */
  backTo?: string
  /** Extra buttons on the trailing side. */
  actions?: ReactNode
  /** Float over the content and slide away when hidden (reader). */
  overlay?: boolean
  hidden?: boolean
}

function resolveIsDark(theme: string): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function AppHeader({ title, subtitle, backTo, actions, overlay, hidden }: Props) {
  const { settings, update } = useSettings()
  const isDark = resolveIsDark(settings.theme)

  const toggleTheme = () => update({ theme: isDark ? 'light' : 'dark' })

  return (
    <header
      className={`app-header${overlay ? ' app-header--overlay' : ''}${hidden ? ' is-hidden' : ''}`}
      aria-hidden={hidden || undefined}
    >
      <div className="app-header__inner">
        {backTo && (
          <Link to={backTo} className="btn btn--header btn--icon" aria-label="واپس" tabIndex={hidden ? -1 : 0}>
            <span aria-hidden="true">→</span>
          </Link>
        )}
        <h1 className="app-header__title">
          {title}
          {subtitle && <span className="app-header__subtitle">{subtitle}</span>}
        </h1>
        {actions}
        <button
          type="button"
          className="btn btn--header btn--icon"
          onClick={toggleTheme}
          aria-label={isDark ? 'دن کا موڈ' : 'رات کا موڈ'}
          tabIndex={hidden ? -1 : 0}
        >
          <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
        </button>
      </div>
    </header>
  )
}
