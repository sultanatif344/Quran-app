import type { SurahMeta } from '../api/alquran'
import type { Entry, JuzPageData } from '../api/juz'
import type { VerseWords } from '../api/quranCom'
import { juzName } from '../data/juzNames'
import { surahNameUrdu, toUrduDigits } from '../data/surahNamesUrdu'

interface Props {
  juz: number
  page: JuzPageData
  bismillah: VerseWords
  bismillahUrdu: string
  surahs: Map<number, SurahMeta>
  bookmarked: Set<string>
  highlighted: string | null
  onToggleBookmark: (surah: number, ayah: number) => void
}

/** One ruled block: Arabic line, word boxes, running translation. */
function LafziAyah({
  entry,
  bookmarked,
  highlighted,
  onToggleBookmark,
}: {
  entry: Entry
  bookmarked: boolean
  highlighted: boolean
  onToggleBookmark: () => void
}) {
  return (
    <article
      id={`ayah-${entry.surah}-${entry.ayah}`}
      className={`lafzi${highlighted ? ' is-highlighted' : ''}${bookmarked ? ' is-bookmarked' : ''}`}
      data-ayah={`${entry.surah}:${entry.ayah}`}
      aria-label={`آیت ${toUrduDigits(entry.ayah)}`}
    >
      <p className="lafzi__arabic" lang="ar">
        {entry.arabic}
        <span className="lafzi__marker" aria-hidden="true">
          {toUrduDigits(entry.ayah)}
        </span>
        {entry.sajda && <span className="lafzi__sajda">سجدہ</span>}
      </p>

      <div className="lafzi__words" role="list">
        {entry.words.map((w, i) => (
          <div className="lafzi__cell" role="listitem" key={i}>
            <span className="lafzi__word" lang="ar">
              {w.arabic}
            </span>
            <span className="lafzi__meaning" lang="ur">
              {w.urdu}
            </span>
          </div>
        ))}
      </div>

      <p className="lafzi__tr" lang="ur">
        {entry.urdu}
      </p>

      <button
        type="button"
        className="lafzi__bookmark"
        aria-pressed={bookmarked}
        aria-label={bookmarked ? 'نشانی ہٹائیں' : 'نشانی لگائیں'}
        onClick={onToggleBookmark}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
            fill={bookmarked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </article>
  )
}

function SurahHeader({
  meta,
  number,
  bismillah,
  bismillahUrdu,
}: {
  meta?: SurahMeta
  number: number
  bismillah: VerseWords
  bismillahUrdu: string
}) {
  return (
    <header className="lafzi-surah">
      <div className="lafzi-surah__banner" lang="ar">
        <span className="lafzi-surah__name">{meta?.name ?? `سورة ${surahNameUrdu(number)}`}</span>
        {meta && (
          <span className="lafzi-surah__meta">
            {meta.revelationType === 'Meccan' ? 'مکیۃ' : 'مدنیۃ'} · {toUrduDigits(meta.numberOfAyahs)} آیات
          </span>
        )}
      </div>
      {number !== 9 && (
        <div className="lafzi lafzi--bismillah">
          <p className="lafzi__arabic lafzi__arabic--center" lang="ar">
            {bismillah.arabic}
          </p>
          <div className="lafzi__words" role="list">
            {bismillah.words.map((w, i) => (
              <div className="lafzi__cell" role="listitem" key={i}>
                <span className="lafzi__word" lang="ar">
                  {w.arabic}
                </span>
                <span className="lafzi__meaning" lang="ur">
                  {w.urdu}
                </span>
              </div>
            ))}
          </div>
          <p className="lafzi__tr" lang="ur">
            {bismillahUrdu}
          </p>
        </div>
      )}
    </header>
  )
}

export function LafziPage({ juz, page, bismillah, bismillahUrdu, surahs, bookmarked, highlighted, onToggleBookmark }: Props) {
  const firstSurah = page.entries[0]?.surah
  return (
    <section className="mushaf" aria-label={`صفحہ ${toUrduDigits(page.page)}`}>
      <header className="mushaf__head">
        <span>
          پارہ {toUrduDigits(juz)} <span className="mushaf__head-juz" lang="ar">{juzName(juz)}</span>
        </span>
        <span className="mushaf__head-title">سورۃ {surahNameUrdu(firstSurah)}</span>
        <span>صفحہ {toUrduDigits(page.page)}</span>
      </header>

      <div className="mushaf__frame mushaf__frame--lafzi">
        {page.entries.map((e) => {
          const key = `${e.surah}:${e.ayah}`
          // Surah 1's ayah 1 is the Bismillah itself; the header already shows it.
          const skipBody = e.surah === 1 && e.ayah === 1
          return (
            <div key={key}>
              {e.surahStart && (
                <SurahHeader meta={surahs.get(e.surah)} number={e.surah} bismillah={bismillah} bismillahUrdu={bismillahUrdu} />
              )}
              {!skipBody && (
                <LafziAyah
                  entry={e}
                  bookmarked={bookmarked.has(key)}
                  highlighted={highlighted === key}
                  onToggleBookmark={() => onToggleBookmark(e.surah, e.ayah)}
                />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
