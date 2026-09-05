import type { MushafPage as MushafPageData, SurahMeta } from '../api/alquran'
import { BISMILLAH } from '../api/alquran'
import { surahNameUrdu, toUrduDigits } from '../data/surahNamesUrdu'
import type { TranslationMode } from '../store/settings'

interface Props {
  meta: SurahMeta
  page: MushafPageData
  /** True when this page holds ayah 1 of the surah (show title banner + Bismillah). */
  isFirstPage: boolean
  showBismillah: boolean
  mode: TranslationMode
  selectedAyah: number | null
  bookmarked: Set<number>
  onSelectAyah: (n: number) => void
}

export function MushafPage({
  meta,
  page,
  isFirstPage,
  showBismillah,
  mode,
  selectedAyah,
  bookmarked,
  onSelectAyah,
}: Props) {
  return (
    <section className="mushaf" aria-label={`صفحہ ${toUrduDigits(page.page)}`}>
      <header className="mushaf__head">
        <span>پارہ {toUrduDigits(page.juz)}</span>
        <span className="mushaf__head-title">سورۃ {surahNameUrdu(meta.number)}</span>
        <span>صفحہ {toUrduDigits(page.page)}</span>
      </header>

      <div className="mushaf__frame">
        {isFirstPage && (
          <div className="mushaf__banner" lang="ar">
            <span className="mushaf__banner-name">{meta.name}</span>
            <span className="mushaf__banner-meta">
              {meta.revelationType === 'Meccan' ? 'مکیۃ' : 'مدنیۃ'} · {toUrduDigits(meta.numberOfAyahs)} آیات
            </span>
          </div>
        )}
        {isFirstPage && showBismillah && (
          <p className="mushaf__bismillah" lang="ar">
            {BISMILLAH}
          </p>
        )}

        {mode === 'popup' ? (
          <p className="mushaf__text" lang="ar">
            {page.ayahs.map((a) => (
              <span
                key={a.number}
                role="button"
                tabIndex={0}
                className={`mushaf__ayah${selectedAyah === a.numberInSurah ? ' is-selected' : ''}${
                  bookmarked.has(a.numberInSurah) ? ' is-bookmarked' : ''
                }`}
                data-ayah={a.numberInSurah}
                aria-label={`آیت ${toUrduDigits(a.numberInSurah)}، ترجمہ دیکھیں`}
                onClick={() => onSelectAyah(a.numberInSurah)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectAyah(a.numberInSurah)
                  }
                }}
              >
                {a.arabic}
                <span className="mushaf__marker" aria-hidden="true">
                  {toUrduDigits(a.numberInSurah)}
                </span>{' '}
              </span>
            ))}
          </p>
        ) : (
          <div className="inline-list">
            {page.ayahs.map((a) => (
              <article
                key={a.number}
                id={`ayah-${a.numberInSurah}`}
                data-ayah={a.numberInSurah}
                className={`inline-ayah${selectedAyah === a.numberInSurah ? ' is-selected' : ''}${
                  bookmarked.has(a.numberInSurah) ? ' is-bookmarked' : ''
                }`}
              >
                <p className="inline-ayah__arabic" lang="ar" onClick={() => onSelectAyah(a.numberInSurah)}>
                  {a.arabic}
                  <span className="mushaf__marker" aria-hidden="true">
                    {toUrduDigits(a.numberInSurah)}
                  </span>
                </p>
                <div className="inline-ayah__tr">
                  <span className="inline-ayah__label">ترجمہ</span>
                  <p className="inline-ayah__urdu" lang="ur">
                    {a.urdu}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
