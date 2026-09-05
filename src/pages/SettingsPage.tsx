import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { URDU_EDITIONS } from '../api/editions'
import type { ArabicScript } from '../api/quranCom'
import { AppHeader } from '../components/AppHeader'
import { clearOfflineData, countCachedJuz } from '../store/offline'
import { useSettings } from '../store/settings'
import { FONT_LABELS_URDU, MAX_STEP } from '../data/fontScale'
import type { Theme } from '../store/settings'
import { toUrduDigits } from '../data/surahNamesUrdu'

const THEMES: { id: Theme; label: string }[] = [
  { id: 'light', label: '☀️ دن' },
  { id: 'dark', label: '🌙 رات' },
  { id: 'system', label: 'خودکار' },
]

const SCRIPTS: { id: ArabicScript; label: string; sub: string }[] = [
  { id: 'simple', label: 'برصغیر کا رسم الخط', sub: 'پاکستانی مصاحف جیسا (PDMS سلیم قرآن فونٹ)' },
  { id: 'uthmani', label: 'رسمِ عثمانی', sub: 'مدینہ کے مصحف جیسا' },
]

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="card" aria-labelledby={id}>
      <h2 id={id} className="section-title" style={{ marginTop: 0 }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function OptionList<T extends string>({
  options,
  value,
  onChange,
  labelledBy,
}: {
  options: { id: T; label: string; sub?: string }[]
  value: T
  onChange: (v: T) => void
  labelledBy: string
}) {
  return (
    <ul className="option-list" role="radiogroup" aria-labelledby={labelledBy}>
      {options.map((o) => (
        <li
          key={o.id}
          className="option"
          role="radio"
          tabIndex={0}
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault()
              onChange(o.id)
            }
          }}
        >
          <span className="option__radio" aria-hidden="true" />
          <span className="option__label">
            {o.label}
            {o.sub && <span className="option__sub">{o.sub}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function SettingsPage() {
  const { settings, update, stepFont } = useSettings()
  const qc = useQueryClient()
  const [cached, setCached] = useState<number | null>(null)
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    void countCachedJuz().then(setCached)
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
        <Section id="font-title" title="حروف کا سائز">
          <div className="stepper">
            <button className="btn" onClick={() => stepFont(-1)} disabled={settings.fontStep === 0} aria-label="چھوٹا کریں">
              <span className="latin">A−</span>
            </button>
            <span className="stepper__value">{FONT_LABELS_URDU[settings.fontStep]}</span>
            <button className="btn" onClick={() => stepFont(1)} disabled={settings.fontStep === MAX_STEP} aria-label="بڑا کریں">
              <span className="latin">A+</span>
            </button>
          </div>
          <div className="preview">
            <p className="lafzi__arabic lafzi__arabic--center" lang="ar" style={{ padding: 0 }}>
              بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
            </p>
            <div className="lafzi__words" style={{ border: '1px solid var(--rule)' }}>
              {[
                ['بِسْمِ', 'نام سے'],
                ['اللّٰهِ', 'اللہ کے'],
                ['الرَّحْمٰنِ', 'جو بہت مہربان'],
                ['الرَّحِيْمِ', 'رحم کرنے والا'],
              ].map(([a, u]) => (
                <div className="lafzi__cell" key={a}>
                  <span className="lafzi__word" lang="ar">
                    {a}
                  </span>
                  <span className="lafzi__meaning" lang="ur">
                    {u}
                  </span>
                </div>
              ))}
            </div>
            <p className="lafzi__tr" lang="ur" style={{ padding: '6px 0 0' }}>
              اللہ کے نام سے جو بہت مہربان، رحم کرنے والا ہے
            </p>
          </div>
        </Section>

        <Section id="script-title" title="عربی رسم الخط">
          <OptionList labelledBy="script-title" options={SCRIPTS} value={settings.script} onChange={(v) => update({ script: v })} />
        </Section>

        <Section id="theme-title" title="رنگ">
          <div className="segmented" role="group" aria-label="رنگ">
            {THEMES.map((t) => (
              <button key={t.id} className="btn" aria-pressed={settings.theme === t.id} onClick={() => update({ theme: t.id })}>
                {t.label}
              </button>
            ))}
          </div>
        </Section>

        <Section id="edition-title" title="بامحاورہ اردو ترجمہ">
          <p className="muted" style={{ margin: '0 0 10px', fontSize: '0.9em' }}>
            لفظی (لفظ بہ لفظ) معنی ہمیشہ دکھائے جاتے ہیں؛ یہاں ہر آیت کے نیچے والا مکمل ترجمہ چنیں۔
          </p>
          <OptionList
            labelledBy="edition-title"
            options={URDU_EDITIONS.map((e) => ({
              id: e.id,
              label: e.nameUrdu,
              sub: `${e.note ? `${e.note} · ` : ''}${e.nameEnglish}`,
            }))}
            value={settings.urduEdition}
            onChange={(v) => update({ urduEdition: v })}
          />
        </Section>

        <Section id="offline-title" title="آف لائن ڈیٹا">
          <p className="muted" style={{ marginTop: 0 }}>
            جو پارے آپ ایک بار کھول لیں وہ انٹرنیٹ کے بغیر بھی پڑھے جا سکتے ہیں۔
            {cached !== null && (
              <>
                <br />
                محفوظ پارے: {toUrduDigits(cached)}
              </>
            )}
          </p>
          <button className="btn btn--outline btn--big" onClick={onClear}>
            محفوظ ڈیٹا صاف کریں
          </button>
        </Section>

        <p className="muted" style={{ textAlign: 'center', fontSize: '0.85em' }}>
          متن اور لفظی معنی: <span className="latin">quran.com</span> · تراجم: <span className="latin">alquran.cloud</span>
        </p>
      </main>
    </>
  )
}
