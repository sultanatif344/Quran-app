import type { SurahMeta } from '../api/alquran'
import type { Entry, JuzPageData, Line } from '../api/juz'
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
  /** Show bookmark toggles (only while the controls are visible). */
  showTools: boolean
  onToggleBookmark: (surah: number, ayah: number) => void
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WordBoxes({ words }: { words: { arabic: string; urdu: string }[] }) {
  return (
    <div className="lafzi__words" role="list">
      {words.map((w, i) => (
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
  )
}

/** One printed line: flowing Arabic, its word boxes, then the translation of ayahs ending here. */
function LafziLine({
  line,
  bookmarked,
  highlighted,
  showTools,
  onToggleBookmark,
}: {
  line: Line
  bookmarked: Set<string>
  highlighted: string | null
  showTools: boolean
  onToggleBookmark: (surah: number, ayah: number) => void
}) {
  const groups: { key: string; ayah: number; words: typeof line.words }[] = []
  for (const w of line.words) {
    const key = `${w.surah}:${w.ayah}`
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.words.push(w)
    else groups.push({ key, ayah: w.ayah, words: [w] })
  }
  // Full printed lines are stretched edge to edge; short tail lines are not.
  const justify = line.words.length >= 5

  return (
    <div className="lafzi">
      {line.rukuStart !== null && (
        <span className="lafzi__ruku" lang="ar" aria-label={`رکوع ${toUrduDigits(line.rukuStart)}`}>
          <span className="lafzi__ruku-ain">ع</span>
          <span className="lafzi__ruku-num">{toUrduDigits(line.rukuStart)}</span>
        </span>
      )}
      <p className={`lafzi__arabic${justify ? ' lafzi__arabic--justify' : ''}`} lang="ar">
        {groups.map((g) => (
          <span
            key={g.key}
            id={`ayah-${g.key.replace(':', '-')}`}
            className={`lafzi__ayah${highlighted === g.key ? ' is-highlighted' : ''}`}
            data-ayah={g.key}
          >
            {g.words.map((w, i) => (
              <span key={i}>
                {w.arabic}
                {w.ayahEnd ? (
                  <span className="lafzi__marker" aria-hidden="true">
                    {toUrduDigits(w.ayah)}
                  </span>
                ) : (
                  ' '
                )}
              </span>
            ))}{' '}
          </span>
        ))}
      </p>

      <WordBoxes words={line.words} />

      {line.ended.length > 0 && (
        <p className="lafzi__tr" lang="ur">
          {line.ended.map((e: Entry) => {
            const key = `${e.surah}:${e.ayah}`
            const isBookmarked = bookmarked.has(key)
            return (
              <span key={key} className={`lafzi__tr-ayah${highlighted === key ? ' is-highlighted' : ''}`}>
                {e.urdu}
                <span className="lafzi__tr-stop" aria-hidden="true">
                  ۔
                </span>
                {(showTools || isBookmarked) && (
                  <button
                    type="button"
                    className="lafzi__bookmark"
                    aria-pressed={isBookmarked}
                    aria-label={
                      isBookmarked ? `آیت ${toUrduDigits(e.ayah)} کی نشانی ہٹائیں` : `آیت ${toUrduDigits(e.ayah)} پر نشانی لگائیں`
                    }
                    onClick={() => onToggleBookmark(e.surah, e.ayah)}
                  >
                    <BookmarkIcon filled={isBookmarked} />
                  </button>
                )}{' '}
              </span>
            )
          })}
        </p>
      )}
    </div>
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
      <div className="lafzi-surah__crest" aria-hidden="true">
        ❁
      </div>
      <div className="lafzi-surah__box">
        <div className="lafzi-surah__title" lang="ar">
          <span className="lafzi-surah__side">{meta ? toUrduDigits(meta.numberOfAyahs) + ' آیات' : ''}</span>
          <span className="lafzi-surah__name">{meta?.name ?? `سورة ${surahNameUrdu(number)}`}</span>
          <span className="lafzi-surah__side">{meta ? (meta.revelationType === 'Meccan' ? 'مکیۃ' : 'مدنیۃ') : ''}</span>
        </div>
        {number !== 9 && (
          <p className="lafzi-surah__bismillah" lang="ar">
            {bismillah.arabic}
          </p>
        )}
      </div>
      {number !== 9 && (
        <div className="lafzi lafzi--bismillah">
          <WordBoxes words={bismillah.words} />
          <p className="lafzi__tr" lang="ur">
            {bismillahUrdu}
            <span className="lafzi__tr-stop" aria-hidden="true">
              ۔
            </span>
          </p>
        </div>
      )}
    </header>
  )
}

export function LafziPage({
  juz,
  page,
  bismillah,
  bismillahUrdu,
  surahs,
  bookmarked,
  highlighted,
  showTools,
  onToggleBookmark,
}: Props) {
  const firstSurah = page.entries[0]?.surah
  return (
    <section className="mushaf" aria-label={`صفحہ ${toUrduDigits(page.page)}`}>
      <div className="mushaf__frame">
        {/* Boxed tabs riding the top and bottom rules, like the print */}
        <span className="mushaf__tab mushaf__tab--right" lang="ar">
          {juzName(juz)} {toUrduDigits(juz)}
        </span>
        <span className="mushaf__tab mushaf__tab--center">{toUrduDigits(page.page)}</span>
        <span className="mushaf__tab mushaf__tab--left">
          {surahNameUrdu(firstSurah)} {toUrduDigits(firstSurah)}
        </span>
        <span className="mushaf__tab mushaf__tab--bottom">منزل {toUrduDigits(page.manzil)}</span>

        <div className="mushaf__inner">
          {page.lines.map((line) => (
            <div key={`${line.surah}-${line.line}`}>
              {line.startsSurah && (
                <SurahHeader
                  meta={surahs.get(line.surah)}
                  number={line.surah}
                  bismillah={bismillah}
                  bismillahUrdu={bismillahUrdu}
                />
              )}
              <LafziLine
                line={line}
                bookmarked={bookmarked}
                highlighted={highlighted}
                showTools={showTools}
                onToggleBookmark={onToggleBookmark}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
