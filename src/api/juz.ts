import { fetchBismillahTranslation, fetchJuzTranslation } from './alquran'
import { fetchBismillahWords, fetchJuzWords } from './quranCom'
import type { ArabicScript, VerseWords } from './quranCom'

export interface Entry extends VerseWords {
  /** Full-ayah Urdu translation (chosen edition). */
  urdu: string
}

export interface LineWord {
  arabic: string
  urdu: string
  surah: number
  ayah: number
  /** Last word of its ayah — the ayah marker follows it. */
  ayahEnd: boolean
}

/** One printed line of the mushaf: its words flow together like the print. */
export interface Line {
  line: number
  surah: number
  /** True when ayah 1 of a surah begins on this line (show the surah header before it). */
  startsSurah: boolean
  /** Ruku number when a new ruku begins on this line (printed as a side mark). */
  rukuStart: number | null
  words: LineWord[]
  /** Ayahs whose final word is on this line — their running translation goes under it. */
  ended: Entry[]
}

export interface JuzPageData {
  page: number
  manzil: number
  lines: Line[]
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

function buildLines(entries: Entry[], prevRuku: number | null): Line[] {
  const lines: Line[] = []
  let lastRuku = prevRuku
  for (const e of entries) {
    // Surah 1's ayah 1 is the Bismillah; the surah header already shows it.
    if (e.surah === 1 && e.ayah === 1) {
      lastRuku = e.ruku
      continue
    }
    const newRuku = e.ruku !== lastRuku
    lastRuku = e.ruku
    e.words.forEach((w, i) => {
      let last = lines[lines.length - 1]
      if (!last || last.line !== w.line || last.surah !== e.surah) {
        last = { line: w.line, surah: e.surah, startsSurah: false, rukuStart: null, words: [], ended: [] }
        lines.push(last)
      }
      if (i === 0) {
        if (e.ayah === 1 || (e.surah === 1 && e.ayah === 2)) last.startsSurah = true
        if (newRuku && last.rukuStart === null) last.rukuStart = e.ruku
      }
      const ayahEnd = i === e.words.length - 1
      last.words.push({ arabic: w.arabic, urdu: w.urdu, surah: e.surah, ayah: e.ayah, ayahEnd })
      if (ayahEnd) last.ended.push(e)
    })
  }
  return lines
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

  const byPage = new Map<number, Entry[]>()
  for (const v of verses) {
    const entry: Entry = { ...v, urdu: translations[`${v.surah}:${v.ayah}`] ?? '' }
    const list = byPage.get(v.page) ?? []
    list.push(entry)
    byPage.set(v.page, list)
  }

  let prevRuku: number | null = null
  const pages: JuzPageData[] = [...byPage.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([page, entries]) => {
      const lines = buildLines(entries, prevRuku)
      prevRuku = entries[entries.length - 1].ruku
      return { page, manzil: entries[0].manzil, entries, lines }
    })

  return { juz, urduEdition, script, bismillah, bismillahUrdu, pages }
}

/** Index of the page holding an ayah, or 0. */
export function pageIndexOf(data: JuzData, surah: number, ayah: number): number {
  const i = data.pages.findIndex((p) => p.entries.some((e) => e.surah === surah && e.ayah === ayah))
  return i < 0 ? 0 : i
}
