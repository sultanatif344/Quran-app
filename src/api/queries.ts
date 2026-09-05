import { useQuery } from '@tanstack/react-query'
import { fetchSurah, fetchSurahList } from './alquran'
import type { SurahData, SurahMeta } from './alquran'
import { cacheSurah, cacheSurahList, getCachedSurah, getCachedSurahList } from '../store/offline'

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

async function loadSurah(n: number, edition: string, signal: AbortSignal): Promise<SurahData> {
  try {
    const data = await fetchSurah(n, edition, signal)
    void cacheSurah(data)
    return data
  } catch (err) {
    const cached = await getCachedSurah(n, edition)
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

export function useSurah(n: number, edition: string) {
  return useQuery({
    queryKey: ['surah', n, edition],
    queryFn: ({ signal }) => loadSurah(n, edition, signal),
    enabled: Number.isInteger(n) && n >= 1 && n <= 114,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  })
}
