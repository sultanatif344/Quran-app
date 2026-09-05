import { useCallback, useEffect, useRef, useState } from 'react'

const AUTO_HIDE_MS = 4000

/**
 * YouTube-style chrome: controls start hidden, a tap on the reading area shows them,
 * and they slide away again after a few seconds or on the next tap.
 */
export function useImmersive() {
  const [visible, setVisible] = useState(false)
  const timer = useRef<number | null>(null)

  const clear = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
  }

  const hide = useCallback(() => {
    clear()
    setVisible(false)
  }, [])

  const show = useCallback(() => {
    clear()
    setVisible(true)
    timer.current = window.setTimeout(() => setVisible(false), AUTO_HIDE_MS)
  }, [])

  const toggle = useCallback(() => {
    setVisible((v) => {
      clear()
      if (v) return false
      timer.current = window.setTimeout(() => setVisible(false), AUTO_HIDE_MS)
      return true
    })
  }, [])

  /** Keep the controls up while the reader is using them. */
  const keepAlive = useCallback(() => {
    if (!timer.current) return
    clear()
    timer.current = window.setTimeout(() => setVisible(false), AUTO_HIDE_MS)
  }, [])

  useEffect(() => () => clear(), [])

  return { visible, show, hide, toggle, keepAlive }
}

export function isFullscreenSupported(): boolean {
  return typeof document !== 'undefined' && !!document.documentElement.requestFullscreen
}

export async function toggleFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
  } catch {
    /* unsupported (e.g. iOS Safari) — ignore */
  }
}
