/**
 * Data layer for https://alquran.cloud/api (free, no key, CORS enabled).
 *
 * Fallback (not wired): Quran.com API v4 — https://api.quran.com/api/v4
 *   Arabic:  /quran/verses/uthmani?chapter_number=N
 *   Urdu:    /quran/translations/234?chapter_number=N   (234 = Fateh Muhammad Jalandhari)
 */

const BASE = 'https://api.alquran.cloud/v1'

/** Arabic text editions. 'simple' is the standard orthography familiar from Indo-Pak prints. */
export type ArabicScript = 'simple' | 'uthmani'
export const ARABIC_EDITIONS: Record<ArabicScript, string> = {
  simple: 'quran-simple',
  uthmani: 'quran-uthmani',
}

export interface SurahMeta {
  number: number
  /** Arabic name, e.g. سُورَةُ ٱلْفَاتِحَةِ */
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: 'Meccan' | 'Medinan'
}

export interface Ayah {
  /** Global ayah number 1–6236 */
  number: number
  numberInSurah: number
  arabic: string
  urdu: string
  juz: number
  page: number
  ruku: number
  sajda: boolean
}

export interface SurahData {
  meta: SurahMeta
  urduEdition: string
  script: ArabicScript
  /** True when Bismillah should be shown as a header above ayah 1. */
  hasBismillah: boolean
  ayahs: Ayah[]
}

interface ApiEnvelope<T> {
  code: number
  status: string
  data: T
}

interface ApiAyah {
  number: number
  text: string
  numberInSurah: number
  juz: number
  page: number
  ruku: number
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean }
}

interface ApiSurah extends SurahMeta {
  ayahs: ApiAyah[]
  edition: { identifier: string }
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  const body = (await res.json()) as ApiEnvelope<T>
  if (body.code !== 200) throw new Error(`API error ${body.code}: ${body.status}`)
  return body.data
}

export async function fetchSurahList(signal?: AbortSignal): Promise<SurahMeta[]> {
  const list = await getJson<SurahMeta[]>('/surah', signal)
  return list.map((s) => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    englishNameTranslation: s.englishNameTranslation,
    numberOfAyahs: s.numberOfAyahs,
    revelationType: s.revelationType,
  }))
}

/**
 * alquran.cloud prepends "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ" to ayah 1 of every surah
 * except Al‑Fatiha (where it *is* ayah 1) and At‑Tawbah (which has none).
 * We strip it so it can be rendered once as a header.
 */
const ARABIC_MARKS = /[ً-ٰٟۖ-ۭ]/
const BISMILLAH_SKELETON = 'بسم الله الرحمن الرحيم'

export function stripBismillah(text: string): string {
  const t = text.trim()
  // Build a diacritic-free skeleton while remembering where each skeleton char came from.
  let skeleton = ''
  const map: number[] = []
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (ARABIC_MARKS.test(ch)) continue
    skeleton += ch === 'ٱ' ? 'ا' : ch
    map.push(i)
  }
  if (!skeleton.startsWith(BISMILLAH_SKELETON)) return t
  const lastSkeletonIdx = BISMILLAH_SKELETON.length - 1
  let end = map[lastSkeletonIdx] + 1
  // Include trailing marks attached to the final letter.
  while (end < t.length && ARABIC_MARKS.test(t[end])) end++
  return t.slice(end).trim()
}

export async function fetchSurah(
  number: number,
  urduEdition: string,
  script: ArabicScript = 'simple',
  signal?: AbortSignal,
): Promise<SurahData> {
  const arabicEdition = ARABIC_EDITIONS[script]
  const editions = await getJson<ApiSurah[]>(
    `/surah/${number}/editions/${arabicEdition},${urduEdition}`,
    signal,
  )
  const arabic = editions.find((e) => e.edition.identifier === arabicEdition)
  const urdu = editions.find((e) => e.edition.identifier === urduEdition)
  if (!arabic || !urdu) throw new Error('Unexpected API response shape')

  const hasBismillah = number !== 1 && number !== 9

  const ayahs: Ayah[] = arabic.ayahs.map((a, i) => {
    const u = urdu.ayahs[i]
    const text = hasBismillah && a.numberInSurah === 1 ? stripBismillah(a.text) : a.text.trim()
    return {
      number: a.number,
      numberInSurah: a.numberInSurah,
      arabic: text,
      urdu: (u?.text ?? '').trim(),
      juz: a.juz,
      page: a.page,
      ruku: a.ruku,
      sajda: Boolean(a.sajda),
    }
  })

  return {
    meta: {
      number: arabic.number,
      name: arabic.name,
      englishName: arabic.englishName,
      englishNameTranslation: arabic.englishNameTranslation,
      numberOfAyahs: arabic.numberOfAyahs,
      revelationType: arabic.revelationType,
    },
    urduEdition,
    script,
    hasBismillah,
    ayahs,
  }
}

export interface MushafPage {
  /** Madani mushaf page number (1–604). */
  page: number
  juz: number
  ayahs: Ayah[]
}

/** Split a surah's ayahs into the printed mushaf pages they fall on. */
export function groupByPage(ayahs: Ayah[]): MushafPage[] {
  const pages: MushafPage[] = []
  for (const a of ayahs) {
    const last = pages[pages.length - 1]
    if (last && last.page === a.page) last.ayahs.push(a)
    else pages.push({ page: a.page, juz: a.juz, ayahs: [a] })
  }
  return pages
}

export const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'
export const BISMILLAH_SIMPLE = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'

export function bismillahFor(script: ArabicScript): string {
  return script === 'simple' ? BISMILLAH_SIMPLE : BISMILLAH
}
