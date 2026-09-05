import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'quran-install-dismissed'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * Home-screen install helper. Uses the browser's install prompt when one is offered;
 * otherwise shows manual "Add to Home screen" steps (older Android Chrome, all iPhones).
 */
export function InstallHelp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(() => {
    try {
      return isStandalone() || localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return isStandalone()
    }
  })

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setHidden(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (hidden) return null

  const dismiss = () => {
    setHidden(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setHidden(true)
    setDeferred(null)
  }

  return (
    <section className="card install" aria-labelledby="install-title">
      <div className="install__row">
        <span className="install__icon" aria-hidden="true">
          📲
        </span>
        <div style={{ flex: 1 }}>
          <h2 id="install-title" className="install__title">
            فون کی ہوم اسکرین پر لگائیں
          </h2>
          <p className="muted install__text">ایک بار لگانے کے بعد یہ عام ایپ کی طرح کھلے گا اور انٹرنیٹ کے بغیر بھی چلے گا۔</p>
        </div>
      </div>

      <div className="install__actions">
        {deferred ? (
          <button className="btn btn--primary" onClick={install}>
            ایپ انسٹال کریں
          </button>
        ) : (
          <button className="btn btn--primary" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? 'طریقہ چھپائیں' : 'طریقہ دیکھیں'}
          </button>
        )}
        <button className="btn btn--outline" onClick={dismiss}>
          بعد میں
        </button>
      </div>

      {open && !deferred && (
        <ol className="install__steps">
          {isIOS() ? (
            <>
              <li>
                نیچے <strong>Share</strong> (شیئر) کا بٹن دبائیں <span aria-hidden="true">⬆️</span>
              </li>
              <li>
                نیچے کی طرف اسکرول کر کے <strong>Add to Home Screen</strong> چنیں
              </li>
              <li>
                <strong>Add</strong> دبائیں — آئیکن ہوم اسکرین پر آ جائے گا
              </li>
            </>
          ) : (
            <>
              <li>
                اوپر دائیں کونے میں تین نقطوں <strong>⋮</strong> کا مینو کھولیں
              </li>
              <li>
                <strong>Add to Home screen</strong> یا <strong>Install app</strong> چنیں
              </li>
              <li>
                <strong>Add</strong> / <strong>Install</strong> دبائیں — آئیکن ہوم اسکرین پر آ جائے گا
              </li>
            </>
          )}
        </ol>
      )}
    </section>
  )
}
