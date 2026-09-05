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

export const AyahCard = memo(function AyahCard({ surah, ayah, bookmarked, highlighted, onToggleBookmark }: Props) {
  return (
    <article
      id={`ayah-${ayah.numberInSurah}`}
      className={`ayah${highlighted ? ' ayah--target' : ''}`}
      data-ayah={ayah.numberInSurah}
      aria-label={`آیت ${toUrduDigits(ayah.numberInSurah)}`}
    >
      <div className="ayah__top">
        <span className="medallion" aria-hidden="true">
          {toUrduDigits(ayah.numberInSurah)}
        </span>
        <span className="ayah__badge">
          {surah}:{ayah.numberInSurah}
          {ayah.sajda && <> · سجدہ</>}
        </span>
        <button
          type="button"
          className="ayah__bookmark"
          aria-pressed={bookmarked}
          aria-label={bookmarked ? 'نشانی ہٹائیں' : 'نشانی لگائیں'}
          onClick={() => onToggleBookmark(ayah.numberInSurah)}
        >
          <span aria-hidden="true">{bookmarked ? '🔖' : '🏷️'}</span>
        </button>
      </div>
      <p className="ayah__arabic" lang="ar">
        {ayah.arabic}
      </p>
      <div className="ayah__divider" aria-hidden="true" />
      <p className="ayah__urdu" lang="ur">
        {ayah.urdu}
      </p>
    </article>
  )
})
