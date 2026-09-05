import { fetchBismillahTranslation, fetchJuzTranslation } from './alquran'
import { fetchBismillahWords, fetchJuzWords } from './quranCom'
import type { ArabicScript, VerseWords } from './quranCom'

export interface Entry extends VerseWords {
  /** Full-ayah Urdu translation (chosen edition). */
  urdu: string
  /** True when this ayah opens a surah (show banner + Bismillah before it). */
  surahStart: boolean
}

export interface JuzPageData {
  page: number
  entries: Entry[]
}

export interface JuzData {
  juz: number
  urduEdition: string
  script: ArabicScript
  bismillah: VerseWords
  bismillahUrdu: string
  pages: JuzPageData[]
}

export async function fetchJuz(
  juz: number,
  urduEdition: string,
  script: ArabicScript,
  signal?: AbortSignal,
): Promise<JuzData> {
  const [verses, translations, bismillah, bismillahUrdu] = await Promise.all([
    fetchJuzWords(juz, script, signal),
    fetchJuzTranslation(juz, urduEdition, signal),
    fetchBismillahWords(script, signal),
    fetchBismillahTranslation(urduEdition, signal),
  ])

  const pages: JuzPageData[] = []
  for (const v of verses) {
    const entry: Entry = {
      ...v,
      urdu: translations[`${v.surah}:${v.ayah}`] ?? '',
      surahStart: v.ayah === 1,
    }
    const last = pages[pages.length - 1]
    if (last && last.page === v.page) last.entries.push(entry)
    else pages.push({ page: v.page, entries: [entry] })
  }
  return { juz, urduEdition, script, bismillah, bismillahUrdu, pages }
}

/** Index of the page holding an ayah, or 0. */
export function pageIndexOf(data: JuzData, surah: number, ayah: number): number {
  const i = data.pages.findIndex((p) => p.entries.some((e) => e.surah === surah && e.ayah === ayah))
  return i < 0 ? 0 : i
}
