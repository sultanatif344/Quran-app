import { memo } from 'react'
import type { Ayah } from '../api/alquran'
import { toUrduDigits } from '../data/surahNamesUrdu'

interface Props {
  surah: number
  ayah: Ayah
  bookmarked: boolean
  highlighted: boolean
  onToggleBookmark: (ayah: number) => void
}

export const AyahCard = memo(function AyahCard({ ayah, bookmarked, highlighted, onToggleBookmark }: Props) {
  return (
    <article
      id={`ayah-${ayah.numberInSurah}`}
      className={`ayah${highlighted ? ' ayah--target' : ''}${bookmarked ? ' ayah--bookmarked' : ''}`}
      data-ayah={ayah.numberInSurah}
      aria-label={`آیت ${toUrduDigits(ayah.numberInSurah)}`}
    >
      <button
        type="button"
        className="ayah__bookmark"
        aria-pressed={bookmarked}
        aria-label={bookmarked ? 'نشانی ہٹائیں' : 'نشانی لگائیں'}
        onClick={() => onToggleBookmark(ayah.numberInSurah)}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
            fill={bookmarked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <p className="ayah__arabic" lang="ar">
        {ayah.arabic}
        <span className="ayah__num" aria-hidden="true">
          {toUrduDigits(ayah.numberInSurah)}
        </span>
        {ayah.sajda && <span className="ayah__sajda">سجدہ</span>}
      </p>
      <p className="ayah__urdu" lang="ur">
        {ayah.urdu}
      </p>
    </article>
  )
})
