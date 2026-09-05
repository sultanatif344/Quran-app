import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { URDU_EDITIONS } from '../api/editions'
import { AppHeader } from '../components/AppHeader'
import { clearOfflineData, countCachedSurahs } from '../store/offline'
import { FONT_LABELS_URDU, useSettings } from '../store/settings'
import type { Theme } from '../store/settings'
import { toUrduDigits } from '../data/surahNamesUrdu'

const THEMES: { id: Theme; label: string }[] = [
  { id: 'light', label: '☀️ دن' },
  { id: 'dark', label: '🌙 رات' },
  { id: 'system', label: 'خودکار' },
]

export function SettingsPage() {
  const { settings, update, stepFont } = useSettings()
  const qc = useQueryClient()
  const [cached, setCached] = useState<number | null>(null)
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    void countCachedSurahs().then(setCached)
  }, [cleared])

  const onClear = async () => {
    await clearOfflineData()
    qc.clear()
    setCleared(true)
  }

  return (
    <>
      <AppHeader title="ترتیبات" backTo="/" />
      <main className="page">
        <section className="card" aria-labelledby="font-title">
          <h2 id="font-title" className="section-title" style={{ marginTop: 0 }}>
            حروف کا سائز
          </h2>
          <div className="stepper">
            <button className="btn" onClick={() => stepFont(-1)} disabled={settings.fontStep === 0} aria-label="چھوٹا کریں">
              <span className="latin">A−</span>
            </button>
            <span className="stepper__value">{FONT_LABELS_URDU[settings.fontStep]}</span>
            <button className="btn" onClick={() => stepFont(1)} disabled={settings.fontStep === 4} aria-label="بڑا کریں">
              <span className="latin">A+</span>
            </button>
          </div>
          <div className="preview">
            <p className="ayah__arabic" lang="ar">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
            <p className="ayah__urdu" lang="ur">
              شروع الله کا نام لے کر جو بڑا مہربان نہایت رحم والا ہے
            </p>
          </div>
        </section>

        <section className="card" aria-labelledby="theme-title">
          <h2 id="theme-title" className="section-title" style={{ marginTop: 0 }}>
            رنگ
          </h2>
          <div className="segmented" role="group" aria-label="رنگ">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className="btn"
                aria-pressed={settings.theme === t.id}
                onClick={() => update({ theme: t.id })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section className="card" aria-labelledby="edition-title">
          <h2 id="edition-title" className="section-title" style={{ marginTop: 0 }}>
            اردو ترجمہ
          </h2>
          <ul className="option-list" role="radiogroup" aria-labelledby="edition-title">
            {URDU_EDITIONS.map((e) => (
              <li
                key={e.id}
                className="option"
                role="radio"
                tabIndex={0}
                aria-checked={settings.urduEdition === e.id}
                onClick={() => update({ urduEdition: e.id })}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault()
                    update({ urduEdition: e.id })
                  }
                }}
              >
                <span className="option__radio" aria-hidden="true" />
                <span className="option__label">
                  {e.nameUrdu}
                  <span className="option__sub">
                    {e.note && <>{e.note} · </>}
                    <span className="latin">{e.nameEnglish}</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card" aria-labelledby="offline-title">
          <h2 id="offline-title" className="section-title" style={{ marginTop: 0 }}>
            آف لائن ڈیٹا
          </h2>
          <p className="muted" style={{ marginTop: 0 }}>
            جو سورتیں آپ ایک بار کھول لیں وہ انٹرنیٹ کے بغیر بھی پڑھی جا سکتی ہیں۔
            {cached !== null && (
              <>
                <br />
                محفوظ سورتیں: {toUrduDigits(cached)}
              </>
            )}
          </p>
          <button className="btn btn--outline btn--big" onClick={onClear}>
            محفوظ ڈیٹا صاف کریں
          </button>
        </section>

        <p className="muted" style={{ textAlign: 'center', fontSize: '0.85em' }}>
          متن اور تراجم: <span className="latin">alquran.cloud</span>
        </p>
      </main>
    </>
  )
}
