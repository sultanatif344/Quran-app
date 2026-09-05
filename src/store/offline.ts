import { get, set, del, keys } from 'idb-keyval'
import type { SurahMeta } from '../api/alquran'
import type { JuzData } from '../api/juz'
import type { ArabicScript } from '../api/quranCom'

const LIST_KEY = 'surah-list'
const juzKey = (n: number, edition: string, script: ArabicScript) => `juz:${n}:${edition}:${script}`

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

export async function cacheJuz(data: JuzData) {
  try {
    await set(juzKey(data.juz, data.urduEdition, data.script), data)
  } catch {
    /* ignore */
  }
}

export async function getCachedJuz(n: number, edition: string, script: ArabicScript): Promise<JuzData | undefined> {
  try {
    return await get<JuzData>(juzKey(n, edition, script))
  } catch {
    return undefined
  }
}

export async function countCachedJuz(): Promise<number> {
  try {
    const all = await keys()
    return all.filter((k) => typeof k === 'string' && k.startsWith('juz:')).length
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
