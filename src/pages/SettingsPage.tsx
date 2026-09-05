import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { URDU_EDITIONS } from '../api/editions'
import { AppHeader } from '../components/AppHeader'
import { clearOfflineData, countCachedSurahs } from '../store/offline'
import { FONT_LABELS_URDU, useSettings } from '../store/settings'
import type { Theme, TranslationMode } from '../store/settings'
import type { ArabicScript } from '../api/alquran'
import { toUrduDigits } from '../data/surahNamesUrdu'

const THEMES: { id: Theme; label: string }[] = [
  { id: 'light', label: '☀️ دن' },
  { id: 'dark', label: '🌙 رات' },
  { id: 'system', label: 'خودکار' },
]

const MODES: { id: TranslationMode; label: string; sub: string }[] = [
  { id: 'popup', label: 'چھونے پر ترجمہ', sub: 'صفحہ مصحف کی طرح، آیت چھوئیں تو ترجمہ کھلے' },
  { id: 'inline', label: 'ہر آیت کے نیچے ترجمہ', sub: 'عربی اور اردو الگ الگ خانوں میں' },
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
        <Section id="mode-title" title="ترجمہ دکھانے کا طریقہ">
          <OptionList
            labelledBy="mode-title"
            options={MODES}
            value={settings.translationMode}
            onChange={(v) => update({ translationMode: v })}
          />
        </Section>

        <Section id="font-title" title="حروف کا سائز">
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
            <p className="mushaf__text" lang="ar" style={{ padding: 0 }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="inline-ayah__urdu" lang="ur" style={{ marginTop: 4 }}>
              شروع الله کا نام لے کر جو بڑا مہربان نہایت رحم والا ہے
            </p>
          </div>
        </Section>

        <Section id="script-title" title="عربی رسم الخط">
          <OptionList
            labelledBy="script-title"
            options={SCRIPTS}
            value={settings.script}
            onChange={(v) => update({ script: v })}
          />
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

        <Section id="edition-title" title="اردو ترجمہ">
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
        </Section>

        <p className="muted" style={{ textAlign: 'center', fontSize: '0.85em' }}>
          متن اور تراجم: <span className="latin">alquran.cloud</span>
        </p>
      </main>
    </>
  )
}
