/**
 * Data layer for https://alquran.cloud/api (free, no key, CORS enabled).
 * Provides the surah list and the full-ayah Urdu translations, fetched per parah.
 */

const BASE = 'https://api.alquran.cloud/v1'

export interface SurahMeta {
  number: number
  /** Arabic name, e.g. سُورَةُ ٱلْفَاتِحَةِ */
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: 'Meccan' | 'Medinan'
}

interface ApiEnvelope<T> {
  code: number
  status: string
  data: T
}

interface ApiJuzAyah {
  numberInSurah: number
  text: string
  surah: { number: number }
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

/** Map of "surah:ayah" → Urdu translation for one parah. */
export async function fetchJuzTranslation(
  juz: number,
  urduEdition: string,
  signal?: AbortSignal,
): Promise<Record<string, string>> {
  const data = await getJson<{ ayahs: ApiJuzAyah[] }>(`/juz/${juz}/${urduEdition}`, signal)
  const out: Record<string, string> = {}
  for (const a of data.ayahs) out[`${a.surah.number}:${a.numberInSurah}`] = a.text.trim()
  return out
}

const bismillahCache = new Map<string, Promise<string>>()

/** Urdu translation of 1:1 (the Bismillah) in the chosen edition. Fetched once per edition. */
export function fetchBismillahTranslation(urduEdition: string, signal?: AbortSignal): Promise<string> {
  const cached = bismillahCache.get(urduEdition)
  if (cached) return cached
  const p = getJson<{ text: string }>(`/ayah/1:1/${urduEdition}`, signal)
    .then((d) => d.text.trim())
    .catch((err) => {
      bismillahCache.delete(urduEdition)
      throw err
    })
  bismillahCache.set(urduEdition, p)
  return p
}
