import { useEffect, useRef } from 'react'
import type { Ayah } from '../api/alquran'
import { surahNameUrdu, toUrduDigits } from '../data/surahNamesUrdu'

interface Props {
  surah: number
  ayah: Ayah | null
  total: number
  bookmarked: boolean
  onClose: () => void
  onToggleBookmark: () => void
  onStep: (delta: number) => void
}

/** Bottom sheet showing one ayah's translation. */
export function AyahSheet({ surah, ayah, total, bookmarked, onClose, onToggleBookmark, onStep }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const open = ayah !== null

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    else if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="sheet-dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-labelledby="sheet-title"
    >
      {ayah && (
        <div className="sheet-dialog__body">
          <div className="sheet-dialog__grip" aria-hidden="true" />
          <header className="sheet-dialog__head">
            <h2 id="sheet-title" className="sheet-dialog__title">
              سورۃ {surahNameUrdu(surah)} · آیت {toUrduDigits(ayah.numberInSurah)}
            </h2>
            <button
              type="button"
              className="btn btn--icon"
              aria-pressed={bookmarked}
              aria-label={bookmarked ? 'نشانی ہٹائیں' : 'نشانی لگائیں'}
              onClick={onToggleBookmark}
              style={{ color: bookmarked ? 'var(--gold)' : undefined }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path
                  d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
                  fill={bookmarked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button type="button" className="btn btn--icon" aria-label="بند کریں" onClick={onClose}>
              ✕
            </button>
          </header>

          <div className="sheet-dialog__scroll">
            <p className="sheet-dialog__arabic" lang="ar">
              {ayah.arabic}
            </p>
            <p className="sheet-dialog__urdu" lang="ur">
              {ayah.urdu}
            </p>
          </div>

          <footer className="sheet-dialog__foot">
            <button
              type="button"
              className="btn btn--outline"
              disabled={ayah.numberInSurah <= 1}
              onClick={() => onStep(-1)}
            >
              <span aria-hidden="true">→</span> پچھلی آیت
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={ayah.numberInSurah >= total}
              onClick={() => onStep(1)}
            >
              اگلی آیت <span aria-hidden="true">←</span>
            </button>
          </footer>
        </div>
      )}
    </dialog>
  )
}
