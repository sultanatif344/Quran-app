import { get, set, del, keys } from 'idb-keyval'
import type { SurahData, SurahMeta } from '../api/alquran'

const LIST_KEY = 'surah-list'
const surahKey = (n: number, edition: string) => `surah:${n}:${edition}`

export async function cacheSurahList(list: SurahMeta[]) {
  try {
    await set(LIST_KEY, list)
  } catch {
    /* storage unavailable — ignore */
  }
}

export async function getCachedSurahList(): Promise<SurahMeta[] | undefined> {
  try {
    return await get<SurahMeta[]>(LIST_KEY)
  } catch {
    return undefined
  }
}

export async function cacheSurah(data: SurahData) {
  try {
    await set(surahKey(data.meta.number, data.urduEdition), data)
  } catch {
    /* ignore */
  }
}

export async function getCachedSurah(n: number, edition: string): Promise<SurahData | undefined> {
  try {
    return await get<SurahData>(surahKey(n, edition))
  } catch {
    return undefined
  }
}

export async function countCachedSurahs(): Promise<number> {
  try {
    const all = await keys()
    return all.filter((k) => typeof k === 'string' && k.startsWith('surah:')).length
  } catch {
    return 0
  }
}

export async function clearOfflineData() {
  try {
    const all = await keys()
    await Promise.all(all.map((k) => del(k)))
  } catch {
    /* ignore */
  }
}
