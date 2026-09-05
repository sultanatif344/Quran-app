import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BISMILLAH } from '../api/alquran'
import { useSurah } from '../api/queries'
import { AppHeader } from '../components/AppHeader'
import { AyahCard } from '../components/AyahCard'
import { GoToAyahDialog } from '../components/GoToAyahDialog'
import { ErrorState, LoadingState } from '../components/States'
import { surahNameUrdu, toUrduDigits } from '../data/surahNamesUrdu'
import { setLastRead, toggleBookmark, useProgress } from '../store/progress'
import { useSettings } from '../store/settings'

export function SurahPage() {
  const { number } = useParams()
  const surahNo = Number(number)
  const valid = Number.isInteger(surahNo) && surahNo >= 1 && surahNo <= 114

  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { settings, stepFont } = useSettings()
  const { bookmarks } = useProgress()
  const { data, isPending, isError, refetch } = useSurah(surahNo, settings.urduEdition)

  const [gotoOpen, setGotoOpen] = useState(false)
  const [highlight, setHighlight] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const bookmarkedSet = useMemo(
    () => new Set(bookmarks.filter((b) => b.surah === surahNo).map((b) => b.ayah)),
    [bookmarks, surahNo],
  )

  const scrollToAyah = useCallback((n: number, smooth = true) => {
    const el = document.getElementById(`ayah-${n}`)
    if (!el) return
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
    setHighlight(n)
    window.setTimeout(() => setHighlight((h) => (h === n ? null : h)), 2500)
  }, [])

  // Jump to ?ayah=N once data is rendered, then drop the param so refresh doesn't re-jump.
  useEffect(() => {
    if (!data) return
    const target = Number(params.get('ayah'))
    if (target >= 1) {
      requestAnimationFrame(() => scrollToAyah(target, false))
      setParams({}, { replace: true })
    } else {
      window.scrollTo({ top: 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, surahNo])

  // Track the topmost visible ayah as reading progress.
  useEffect(() => {
    if (!data || !listRef.current) return
    const visible = new Set<number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const n = Number((e.target as HTMLElement).dataset.ayah)
          if (e.isIntersecting) visible.add(n)
          else visible.delete(n)
        }
        if (visible.size) setLastRead({ surah: surahNo, ayah: Math.min(...visible) })
      },
      { rootMargin: '-80px 0px -40% 0px', threshold: 0 },
    )
    listRef.current.querySelectorAll<HTMLElement>('[data-ayah]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [data, surahNo])

  const onToggleBookmark = useCallback((ayah: number) => toggleBookmark({ surah: surahNo, ayah }), [surahNo])

  if (!valid) {
    return (
      <>
        <AppHeader title="سورت نہیں ملی" backTo="/" />
        <main className="page state">
          <Link to="/" className="btn btn--primary btn--big">
            فہرست پر واپس جائیں
          </Link>
        </main>
      </>
    )
  }

  const prev = surahNo > 1 ? surahNo - 1 : null
  const next = surahNo < 114 ? surahNo + 1 : null

  return (
    <>
      <AppHeader
        title={`سورۃ ${surahNameUrdu(surahNo)}`}
        subtitle={
          data
            ? `${toUrduDigits(data.meta.numberOfAyahs)} آیات · ${data.meta.revelationType === 'Meccan' ? 'مکی' : 'مدنی'}`
            : undefined
        }
        backTo="/"
      />

      <main className="page">
        {isPending && <LoadingState />}
        {isError && <ErrorState onRetry={() => refetch()} />}

        {data && (
          <div ref={listRef}>
            {data.hasBismillah && (
              <p className="bismillah" lang="ar">
                {BISMILLAH}
              </p>
            )}
            {data.ayahs.map((a) => (
              <AyahCard
                key={a.number}
                surah={surahNo}
                ayah={a}
                bookmarked={bookmarkedSet.has(a.numberInSurah)}
                highlighted={highlight === a.numberInSurah}
                onToggleBookmark={onToggleBookmark}
              />
            ))}

            <div className="card" style={{ textAlign: 'center' }}>
              <p className="muted" style={{ margin: '0 0 12px' }}>
                سورۃ {surahNameUrdu(surahNo)} مکمل ہوئی
              </p>
              {next ? (
                <button className="btn btn--primary btn--big" onClick={() => navigate(`/surah/${next}`)}>
                  اگلی سورت: {surahNameUrdu(next)}
                  <span className="btn__icon" aria-hidden="true">
                    ←
                  </span>
                </button>
              ) : (
                <Link to="/" className="btn btn--primary btn--big">
                  فہرست پر واپس جائیں
                </Link>
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="bottom-bar" aria-label="پڑھنے کے اختیارات">
        <div className="bottom-bar__inner">
          <button
            className="btn"
            disabled={!prev}
            onClick={() => prev && navigate(`/surah/${prev}`)}
            aria-label="پچھلی سورت"
          >
            <span className="btn__icon" aria-hidden="true">
              →
            </span>
            پچھلی
          </button>
          <button
            className="btn"
            onClick={() => stepFont(-1)}
            disabled={settings.fontStep === 0}
            aria-label="حروف چھوٹے کریں"
          >
            <span className="latin">A−</span>
          </button>
          <button
            className="btn"
            onClick={() => setGotoOpen(true)}
            disabled={!data}
            aria-label="آیت نمبر پر جائیں"
          >
            آیت
          </button>
          <button
            className="btn"
            onClick={() => stepFont(1)}
            disabled={settings.fontStep === 4}
            aria-label="حروف بڑے کریں"
          >
            <span className="latin">A+</span>
          </button>
          <button
            className="btn"
            disabled={!next}
            onClick={() => next && navigate(`/surah/${next}`)}
            aria-label="اگلی سورت"
          >
            اگلی
            <span className="btn__icon" aria-hidden="true">
              ←
            </span>
          </button>
        </div>
      </nav>

      <GoToAyahDialog
        open={gotoOpen}
        max={data?.meta.numberOfAyahs ?? 1}
        onClose={() => setGotoOpen(false)}
        onGo={(n) => scrollToAyah(n)}
      />
    </>
  )
}
