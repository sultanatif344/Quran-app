import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSurahList } from '../api/queries'
import { AppHeader } from '../components/AppHeader'
import { ErrorState, LoadingState } from '../components/States'
import { surahNameUrdu, toUrduDigits } from '../data/surahNamesUrdu'
import { useProgress } from '../store/progress'
import type { SurahMeta } from '../api/alquran'

function matches(s: SurahMeta, q: string): boolean {
  if (!q) return true
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
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => (data ?? []).filter((s) => matches(s, query)), [data, query])

  return (
    <>
      <AppHeader
        title="قرآن مجید"
        subtitle="آیت بہ آیت اردو ترجمے کے ساتھ"
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
          <button
            type="button"
            className="card continue-card"
            onClick={() => navigate(`/surah/${lastRead.surah}?ayah=${lastRead.ayah}`)}
          >
            <span className="continue-card__arrow" aria-hidden="true">
              ◀
            </span>
            <span style={{ flex: 1 }}>
              <span className="continue-card__label">جہاں چھوڑا تھا وہاں سے جاری رکھیں</span>
              <br />
              <span className="continue-card__title">
                سورۃ {surahNameUrdu(lastRead.surah)} — آیت {toUrduDigits(lastRead.ayah)}
              </span>
            </span>
          </button>
        )}

        {bookmarks.length > 0 && (
          <>
            <h2 className="section-title">نشانیاں</h2>
            <div className="chips">
              {bookmarks.map((b) => (
                <Link key={`${b.surah}:${b.ayah}`} to={`/surah/${b.surah}?ayah=${b.ayah}`} className="chip">
                  🔖 {surahNameUrdu(b.surah)} — {toUrduDigits(b.ayah)}
                </Link>
              ))}
            </div>
          </>
        )}

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

        <h2 className="section-title">سورتوں کی فہرست</h2>

        {isPending && <LoadingState />}
        {isError && <ErrorState onRetry={() => refetch()} />}

        {data && (
          <ul className="surah-list">
            {filtered.map((s) => (
              <li key={s.number}>
                <Link to={`/surah/${s.number}`} className="surah-row">
                  <span className="medallion" aria-hidden="true">
                    {toUrduDigits(s.number)}
                  </span>
                  <span className="surah-row__names">
                    <span className="surah-row__urdu">سورۃ {surahNameUrdu(s.number)}</span>
                    <br />
                    <span className="surah-row__meta">
                      {toUrduDigits(s.numberOfAyahs)} آیات · {s.revelationType === 'Meccan' ? 'مکی' : 'مدنی'}
                    </span>
                  </span>
                  <span className="surah-row__arabic" lang="ar">
                    {s.name}
                  </span>
                </Link>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="state muted">کوئی سورت نہیں ملی</li>
            )}
          </ul>
        )}
      </main>
    </>
  )
}
