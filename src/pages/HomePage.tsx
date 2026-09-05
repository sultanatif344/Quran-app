import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSurahList } from '../api/queries'
import { AppHeader } from '../components/AppHeader'
import { ErrorState, LoadingState } from '../components/States'
import { JUZ_NAMES, SURAH_START_JUZ } from '../data/juzNames'
import { surahNameUrdu, toUrduDigits } from '../data/surahNamesUrdu'
import { positionUrl, useProgress } from '../store/progress'
import type { SurahMeta } from '../api/alquran'

type Tab = 'juz' | 'surah'

function matches(s: SurahMeta, q: string): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  if (String(s.number) === needle || toUrduDigits(s.number) === needle) return true
  return (
    s.englishName.toLowerCase().includes(needle) ||
    s.englishNameTranslation.toLowerCase().includes(needle) ||
    s.name.replace(/[ً-ْٰ]/g, '').includes(needle) ||
    surahNameUrdu(s.number).includes(needle)
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useSurahList()
  const { lastRead, bookmarks } = useProgress()
  const [tab, setTab] = useState<Tab>(() => {
    try {
      return localStorage.getItem('quran-home-tab') === 'surah' ? 'surah' : 'juz'
    } catch {
      return 'juz'
    }
  })
  const [query, setQuery] = useState('')

  const switchTab = (t: Tab) => {
    setTab(t)
    try {
      localStorage.setItem('quran-home-tab', t)
    } catch {
      /* ignore */
    }
  }

  const filtered = useMemo(() => (data ?? []).filter((s) => matches(s, query)), [data, query])

  return (
    <>
      <AppHeader
        title="قرآن مجید"
        subtitle="لفظی اور بامحاورہ اردو ترجمے کے ساتھ"
        actions={
          <Link to="/settings" className="btn btn--header" aria-label="ترتیبات">
            <span className="btn__icon" aria-hidden="true">
              ⚙️
            </span>
            ترتیبات
          </Link>
        }
      />

      <main className="page">
        {lastRead && (
          <button type="button" className="card continue-card" onClick={() => navigate(positionUrl(lastRead))}>
            <span className="continue-card__arrow" aria-hidden="true">
              ◀
            </span>
            <span style={{ flex: 1 }}>
              <span className="continue-card__label">جہاں چھوڑا تھا وہاں سے جاری رکھیں</span>
              <br />
              <span className="continue-card__title">
                پارہ {toUrduDigits(lastRead.juz)} · سورۃ {surahNameUrdu(lastRead.surah)} · آیت {toUrduDigits(lastRead.ayah)}
              </span>
            </span>
          </button>
        )}

        {bookmarks.length > 0 && (
          <>
            <h2 className="section-title">نشانیاں</h2>
            <div className="chips">
              {bookmarks.map((b) => (
                <Link key={`${b.surah}:${b.ayah}`} to={positionUrl(b)} className="chip">
                  🔖 {surahNameUrdu(b.surah)} — {toUrduDigits(b.ayah)}
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="segmented" role="tablist" aria-label="فہرست" style={{ marginTop: 16 }}>
          <button role="tab" className="btn" aria-selected={tab === 'juz'} aria-pressed={tab === 'juz'} onClick={() => switchTab('juz')}>
            پارے
          </button>
          <button role="tab" className="btn" aria-selected={tab === 'surah'} aria-pressed={tab === 'surah'} onClick={() => switchTab('surah')}>
            سورتیں
          </button>
        </div>

        {tab === 'juz' && (
          <ul className="surah-list" style={{ marginTop: 12 }}>
            {JUZ_NAMES.map((name, i) => (
              <li key={i}>
                <Link to={`/juz/${i + 1}`} className="surah-row">
                  <span className="medallion" aria-hidden="true">
                    {toUrduDigits(i + 1)}
                  </span>
                  <span className="surah-row__names">
                    <span className="surah-row__urdu">پارہ {toUrduDigits(i + 1)}</span>
                  </span>
                  <span className="surah-row__arabic" lang="ar">
                    {name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {tab === 'surah' && (
          <>
            <div className="search">
              <label htmlFor="surah-search" className="visually-hidden">
                سورت تلاش کریں
              </label>
              <input
                id="surah-search"
                className="search__input"
                type="search"
                placeholder="سورت کا نام یا نمبر لکھیں…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </div>

            {isPending && <LoadingState />}
            {isError && <ErrorState onRetry={() => refetch()} />}

            {data && (
              <ul className="surah-list">
                {filtered.map((s) => (
                  <li key={s.number}>
                    <Link to={`/juz/${SURAH_START_JUZ[s.number - 1]}?ayah=${s.number}:1`} className="surah-row">
                      <span className="medallion" aria-hidden="true">
                        {toUrduDigits(s.number)}
                      </span>
                      <span className="surah-row__names">
                        <span className="surah-row__urdu">سورۃ {surahNameUrdu(s.number)}</span>
                        <br />
                        <span className="surah-row__meta">
                          پارہ {toUrduDigits(SURAH_START_JUZ[s.number - 1])} · {toUrduDigits(s.numberOfAyahs)} آیات ·{' '}
                          {s.revelationType === 'Meccan' ? 'مکی' : 'مدنی'}
                        </span>
                      </span>
                      <span className="surah-row__arabic" lang="ar">
                        {s.name}
                      </span>
                    </Link>
                  </li>
                ))}
                {filtered.length === 0 && <li className="state muted">کوئی سورت نہیں ملی</li>}
              </ul>
            )}
          </>
        )}
      </main>
    </>
  )
}
