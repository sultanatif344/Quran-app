import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const AUTO_HIDE_MS = 4000

/**
 * YouTube-style chrome: controls start hidden, a tap on the reading area shows them,
 * and they slide away again after a few seconds or on the next tap.
 */
export function useImmersive() {
  const [visible, setVisible] = useState(false)
  const visibleRef = useRef(false)
  const timer = useRef<number | null>(null)

  const clear = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }, [])

  const set = useCallback(
    (next: boolean) => {
      clear()
      visibleRef.current = next
      setVisible(next)
      if (next) {
        timer.current = window.setTimeout(() => {
          visibleRef.current = false
          setVisible(false)
          timer.current = null
        }, AUTO_HIDE_MS)
      }
    },
    [clear],
  )

  const toggle = useCallback(() => set(!visibleRef.current), [set])

  /** Restart the auto-hide countdown while the reader is using the controls. */
  const keepAlive = useCallback(() => {
    if (visibleRef.current) set(true)
  }, [set])

  useEffect(() => clear, [clear])

  return useMemo(() => ({ visible, toggle, keepAlive }), [visible, toggle, keepAlive])
}

export function isFullscreenSupported(): boolean {
  return typeof document !== 'undefined' && typeof document.documentElement.requestFullscreen === 'function'
}

export async function toggleFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
  } catch {
    /* unsupported (e.g. iOS Safari) — ignore */
  }
}
