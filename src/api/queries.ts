import { useQuery } from '@tanstack/react-query'
import { fetchSurahList } from './alquran'
import type { SurahMeta } from './alquran'
import { fetchJuz } from './juz'
import type { JuzData } from './juz'
import type { ArabicScript } from './quranCom'
import { cacheJuz, cacheSurahList, getCachedJuz, getCachedSurahList } from '../store/offline'

/** Network first; fall back to IndexedDB so previously opened content works offline. */
async function loadSurahList(signal: AbortSignal): Promise<SurahMeta[]> {
  try {
    const list = await fetchSurahList(signal)
    void cacheSurahList(list)
    return list
  } catch (err) {
    const cached = await getCachedSurahList()
    if (cached?.length) return cached
    throw err
  }
}

async function loadJuz(n: number, edition: string, script: ArabicScript, signal: AbortSignal): Promise<JuzData> {
  try {
    const data = await fetchJuz(n, edition, script, signal)
    void cacheJuz(data)
    return data
  } catch (err) {
    const cached = await getCachedJuz(n, edition, script)
    if (cached) return cached
    throw err
  }
}

export function useSurahList() {
  return useQuery({
    queryKey: ['surah-list'],
    queryFn: ({ signal }) => loadSurahList(signal),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useJuz(n: number, edition: string, script: ArabicScript) {
  return useQuery({
    queryKey: ['juz', n, edition, script],
    queryFn: ({ signal }) => loadJuz(n, edition, script, signal),
    enabled: Number.isInteger(n) && n >= 1 && n <= 30,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  })
}
