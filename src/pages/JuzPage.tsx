import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { pageIndexOf } from '../api/juz'
import { useJuz, useSurahList } from '../api/queries'
import { AppHeader } from '../components/AppHeader'
import { GoToDialog } from '../components/GoToDialog'
import { LafziPage } from '../components/LafziPage'
import { ErrorState, LoadingState } from '../components/States'
import { isFullscreenSupported, toggleFullscreen, useImmersive } from '../components/useImmersive'
import { juzName } from '../data/juzNames'
import { toUrduDigits } from '../data/surahNamesUrdu'
import { setLastRead, toggleBookmark, useProgress } from '../store/progress'
import { MAX_STEP, useSettings } from '../store/settings'

const HINT_KEY = 'quran-reader-hint-shown'

export function JuzPage() {
  const { number } = useParams()
  const juz = Number(number)
  const valid = Number.isInteger(juz) && juz >= 1 && juz <= 30

  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { settings, stepFont } = useSettings()
  const { bookmarks } = useProgress()
  const { data, isPending, isError, refetch } = useJuz(juz, settings.urduEdition, settings.script)
  const { data: surahList } = useSurahList()
  const chrome = useImmersive()

  const surahs = useMemo(() => new Map((surahList ?? []).map((s) => [s.number, s])), [surahList])
  const bookmarkedSet = useMemo(() => new Set(bookmarks.map((b) => `${b.surah}:${b.ayah}`)), [bookmarks])

  const [pageIdx, setPageIdx] = useState(0)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [gotoOpen, setGotoOpen] = useState(false)
  const [showHint, setShowHint] = useState(() => {
    try {
      return localStorage.getItem(HINT_KEY) !== '1'
    } catch {
      return false
    }
  })

  // Initial page from ?ayah=s:a or ?page=n; otherwise the first page of the parah.
  useEffect(() => {
    if (!data) return
    const ayahParam = params.get('ayah')
    const pageParam = Number(params.get('page'))
    if (ayahParam) {
      const [s, a] = ayahParam.split(':').map(Number)
      setPageIdx(pageIndexOf(data, s, a))
      setHighlight(`${s}:${a}`)
      setParams({}, { replace: true })
      requestAnimationFrame(() =>
        document.getElementById(`ayah-${s}-${a}`)?.scrollIntoView({ block: 'center', behavior: 'auto' }),
      )
    } else if (pageParam >= 1) {
      setPageIdx(Math.min(data.pages.length - 1, pageParam - 1))
      setParams({}, { replace: true })
    } else {
      setPageIdx(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, juz])

  useEffect(() => {
    if (!showHint) return
    const t = window.setTimeout(() => {
      setShowHint(false)
      try {
        localStorage.setItem(HINT_KEY, '1')
      } catch {
        /* ignore */
      }
    }, 4000)
    return () => window.clearTimeout(t)
  }, [showHint])

  const page = data?.pages[pageIdx]

  useEffect(() => {
    if (!page) return
    const first = page.entries[0]
    setLastRead({ juz, surah: first.surah, ayah: first.ayah })
  }, [page, juz])

  useEffect(() => {
    if (!highlight) window.scrollTo({ top: 0 })
    const t = window.setTimeout(() => setHighlight(null), 3000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdx, juz])

  const total = data?.pages.length ?? 0
  const hasPrev = pageIdx > 0
  const hasNext = pageIdx < total - 1
  const prevJuz = juz > 1 ? juz - 1 : null
  const nextJuz = juz < 30 ? juz + 1 : null

  const goPrev = useCallback(() => {
    chrome.keepAlive()
    if (hasPrev) setPageIdx((i) => i - 1)
    else if (prevJuz) navigate(`/juz/${prevJuz}?page=999`)
  }, [hasPrev, prevJuz, navigate, chrome])

  const goNext = useCallback(() => {
    chrome.keepAlive()
    if (hasNext) setPageIdx((i) => i + 1)
    else if (nextJuz) navigate(`/juz/${nextJuz}`)
  }, [hasNext, nextJuz, navigate, chrome])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gotoOpen) return
      if (e.key === 'ArrowLeft') goNext()
      if (e.key === 'ArrowRight') goPrev()
      if (e.key === 'Escape') chrome.toggle()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, gotoOpen, chrome])

  /** A tap on the reading surface (not on a button or link) toggles the controls. */
  const onSurfaceClick = (e: MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('button, a, dialog')) return
    chrome.toggle()
  }

  if (!valid) {
    return (
      <>
        <AppHeader title="پارہ نہیں ملا" backTo="/" />
        <main className="page state">
          <Link to="/" className="btn btn--primary btn--big">
            فہرست پر واپس جائیں
          </Link>
        </main>
      </>
    )
  }

  const hidden = !chrome.visible

  return (
    <>
      <AppHeader
        overlay
        hidden={hidden}
        title={
          <>
            پارہ {toUrduDigits(juz)}{' '}
            <span lang="ar" style={{ fontWeight: 400 }}>
              {juzName(juz)}
            </span>
          </>
        }
        subtitle={total ? `صفحہ ${toUrduDigits(pageIdx + 1)} / ${toUrduDigits(total)}` : undefined}
        backTo="/"
        actions={
          isFullscreenSupported() ? (
            <button
              type="button"
              className="btn btn--header btn--icon"
              onClick={() => {
                chrome.keepAlive()
                void toggleFullscreen()
              }}
              aria-label="فل اسکرین"
              tabIndex={hidden ? -1 : 0}
            >
              <span aria-hidden="true">⛶</span>
            </button>
          ) : undefined
        }
      />

      <main className="page page--reader page--immersive" onClick={onSurfaceClick}>
        {isPending && <LoadingState text="پارہ لوڈ ہو رہا ہے… (پہلی بار کچھ لمحے لگ سکتے ہیں)" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {data && page && (
          <LafziPage
            juz={juz}
            page={page}
            bismillah={data.bismillah}
            bismillahUrdu={data.bismillahUrdu}
            surahs={surahs}
            bookmarked={bookmarkedSet}
            highlighted={highlight}
            showTools={chrome.visible}
            onToggleBookmark={(s, a) => {
              chrome.keepAlive()
              toggleBookmark({ juz, surah: s, ayah: a })
            }}
          />
        )}
      </main>

      {showHint && data && (
        <div className="reader-hint" role="status">
          بٹن دیکھنے کے لیے صفحے پر چھوئیں
        </div>
      )}

      <nav className={`bottom-bar${hidden ? ' is-hidden' : ''}`} aria-label="پڑھنے کے اختیارات" aria-hidden={hidden || undefined}>
        <div className="bottom-bar__inner">
          <button className="btn btn--nav" disabled={!hasPrev && !prevJuz} onClick={goPrev} aria-label="پچھلا صفحہ" tabIndex={hidden ? -1 : 0}>
            <span className="btn__icon" aria-hidden="true">
              →
            </span>
            {hasPrev ? 'پچھلا' : 'پچھلا پارہ'}
          </button>
          <button
            className="btn"
            onClick={() => {
              chrome.keepAlive()
              stepFont(-1)
            }}
            disabled={settings.fontStep === 0}
            aria-label="حروف چھوٹے کریں"
            tabIndex={hidden ? -1 : 0}
          >
            <span className="latin">A−</span>
          </button>
          <button
            className="btn"
            onClick={() => {
              chrome.keepAlive()
              setGotoOpen(true)
            }}
            disabled={!data}
            aria-label="صفحہ نمبر پر جائیں"
            tabIndex={hidden ? -1 : 0}
          >
            صفحہ
          </button>
          <button
            className="btn"
            onClick={() => {
              chrome.keepAlive()
              stepFont(1)
            }}
            disabled={settings.fontStep === MAX_STEP}
            aria-label="حروف بڑے کریں"
            tabIndex={hidden ? -1 : 0}
          >
            <span className="latin">A+</span>
          </button>
          <button className="btn btn--nav" disabled={!hasNext && !nextJuz} onClick={goNext} aria-label="اگلا صفحہ" tabIndex={hidden ? -1 : 0}>
            {hasNext ? 'اگلا' : 'اگلا پارہ'}
            <span className="btn__icon" aria-hidden="true">
              ←
            </span>
          </button>
        </div>
      </nav>

      <GoToDialog
        open={gotoOpen}
        title="اس پارے کے کس صفحے پر جانا ہے؟"
        max={total || 1}
        onClose={() => setGotoOpen(false)}
        onGo={(n) => setPageIdx(n - 1)}
      />
    </>
  )
}
