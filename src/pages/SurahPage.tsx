import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { groupByPage } from '../api/alquran'
import { useSurah } from '../api/queries'
import { AppHeader } from '../components/AppHeader'
import { AyahSheet } from '../components/AyahSheet'
import { GoToAyahDialog } from '../components/GoToAyahDialog'
import { MushafPage } from '../components/MushafPage'
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
  const { data, isPending, isError, refetch } = useSurah(surahNo, settings.urduEdition, settings.script)

  const pages = useMemo(() => (data ? groupByPage(data.ayahs) : []), [data])
  const [pageIdx, setPageIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [gotoOpen, setGotoOpen] = useState(false)

  const bookmarkedSet = useMemo(
    () => new Set(bookmarks.filter((b) => b.surah === surahNo).map((b) => b.ayah)),
    [bookmarks, surahNo],
  )

  const pageIndexOf = useCallback(
    (ayah: number) => Math.max(0, pages.findIndex((p) => p.ayahs.some((a) => a.numberInSurah === ayah))),
    [pages],
  )

  // Initial page: from ?ayah=N (continue reading / bookmark), otherwise the first page.
  useEffect(() => {
    if (!pages.length) return
    const target = Number(params.get('ayah'))
    if (target >= 1) {
      setPageIdx(pageIndexOf(target))
      setSelected(target)
      setParams({}, { replace: true })
    } else {
      setPageIdx(0)
      setSelected(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, surahNo])

  const page = pages[pageIdx]

  // Reading progress: the selected ayah, else the first ayah of the visible page.
  useEffect(() => {
    if (!page) return
    setLastRead({ surah: surahNo, ayah: selected ?? page.ayahs[0].numberInSurah })
  }, [page, selected, surahNo])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pageIdx, surahNo])

  const prevSurah = surahNo > 1 ? surahNo - 1 : null
  const nextSurah = surahNo < 114 ? surahNo + 1 : null
  const hasPrevPage = pageIdx > 0
  const hasNextPage = pageIdx < pages.length - 1

  const goPrev = useCallback(() => {
    if (hasPrevPage) setPageIdx((i) => i - 1)
    else if (prevSurah) navigate(`/surah/${prevSurah}`)
  }, [hasPrevPage, prevSurah, navigate])

  const goNext = useCallback(() => {
    if (hasNextPage) setPageIdx((i) => i + 1)
    else if (nextSurah) navigate(`/surah/${nextSurah}`)
  }, [hasNextPage, nextSurah, navigate])

  // Keyboard: in RTL reading, the left arrow moves forward.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selected !== null || gotoOpen) return
      if (e.key === 'ArrowLeft') goNext()
      if (e.key === 'ArrowRight') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, selected, gotoOpen])

  const stepAyah = useCallback(
    (delta: number) => {
      if (selected === null || !data) return
      const n = Math.min(data.meta.numberOfAyahs, Math.max(1, selected + delta))
      setSelected(n)
      setPageIdx(pageIndexOf(n))
    },
    [selected, data, pageIndexOf],
  )

  const jumpTo = useCallback(
    (n: number) => {
      setPageIdx(pageIndexOf(n))
      setSelected(n)
      if (settings.translationMode === 'inline') {
        requestAnimationFrame(() => document.getElementById(`ayah-${n}`)?.scrollIntoView({ block: 'start' }))
      }
    },
    [pageIndexOf, settings.translationMode],
  )

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

  const selectedAyah = selected !== null ? (data?.ayahs[selected - 1] ?? null) : null
  const showSheet = settings.translationMode === 'popup' ? selectedAyah : null

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

      <main className="page page--reader">
        {isPending && <LoadingState />}
        {isError && <ErrorState onRetry={() => refetch()} />}

        {data && page && (
          <MushafPage
            meta={data.meta}
            page={page}
            isFirstPage={pageIdx === 0}
            showBismillah={data.hasBismillah}
            mode={settings.translationMode}
            selectedAyah={selected}
            bookmarked={bookmarkedSet}
            onSelectAyah={(n) => setSelected(n)}
          />
        )}

        {data && pages.length > 0 && (
          <p className="page-indicator muted">
            صفحہ {toUrduDigits(pageIdx + 1)} / {toUrduDigits(pages.length)}
            {settings.translationMode === 'popup' && (
              <>
                <br />
                <span style={{ fontSize: '0.85em' }}>ترجمہ دیکھنے کے لیے کسی آیت کو چھوئیں</span>
              </>
            )}
          </p>
        )}
      </main>

      <nav className="bottom-bar" aria-label="پڑھنے کے اختیارات">
        <div className="bottom-bar__inner">
          <button className="btn btn--nav" disabled={!hasPrevPage && !prevSurah} onClick={goPrev} aria-label="پچھلا صفحہ">
            <span className="btn__icon" aria-hidden="true">
              →
            </span>
            {hasPrevPage ? 'پچھلا' : 'پچھلی سورت'}
          </button>
          <button className="btn" onClick={() => stepFont(-1)} disabled={settings.fontStep === 0} aria-label="حروف چھوٹے کریں">
            <span className="latin">A−</span>
          </button>
          <button className="btn" onClick={() => setGotoOpen(true)} disabled={!data} aria-label="آیت نمبر پر جائیں">
            آیت
          </button>
          <button className="btn" onClick={() => stepFont(1)} disabled={settings.fontStep === 4} aria-label="حروف بڑے کریں">
            <span className="latin">A+</span>
          </button>
          <button className="btn btn--nav" disabled={!hasNextPage && !nextSurah} onClick={goNext} aria-label="اگلا صفحہ">
            {hasNextPage ? 'اگلا' : 'اگلی سورت'}
            <span className="btn__icon" aria-hidden="true">
              ←
            </span>
          </button>
        </div>
      </nav>

      <AyahSheet
        surah={surahNo}
        ayah={showSheet}
        total={data?.meta.numberOfAyahs ?? 1}
        bookmarked={selected !== null && bookmarkedSet.has(selected)}
        onClose={() => setSelected(null)}
        onToggleBookmark={() => selected !== null && toggleBookmark({ surah: surahNo, ayah: selected })}
        onStep={stepAyah}
      />

      <GoToAyahDialog
        open={gotoOpen}
        max={data?.meta.numberOfAyahs ?? 1}
        onClose={() => setGotoOpen(false)}
        onGo={jumpTo}
      />
    </>
  )
}
