/**
 * Quran.com API v4 — used for word-by-word Urdu meanings and the Indo-Pak / Uthmani
 * verse text, fetched one parah (juz) at a time.
 * https://api.quran.com/api/v4/verses/by_juz/{n}?language=ur&words=true
 */

const BASE = 'https://api.quran.com/api/v4'
const PER_PAGE = 50

export type ArabicScript = 'simple' | 'uthmani'

export interface Word {
  arabic: string
  /** Urdu meaning of this word. */
  urdu: string
  /** Line of the printed (Madani) mushaf page this word sits on, 1–15. */
  line: number
}

export interface VerseWords {
  surah: number
  ayah: number
  page: number
  juz: number
  arabic: string
  words: Word[]
  sajda: boolean
  /** Manzil (1–7) and ruku numbers, for the printed side/bottom tabs. */
  manzil: number
  ruku: number
}

interface ApiWord {
  char_type_name: 'word' | 'end' | string
  line_number: number
  text_indopak?: string
  text_uthmani?: string
  translation?: { text: string }
}

interface ApiVerse {
  verse_key: string
  page_number: number
  juz_number: number
  sajdah_number: number | null
  manzil_number: number
  ruku_number: number
  text_indopak?: string
  text_uthmani?: string
  words: ApiWord[]
}

interface ApiPage {
  verses: ApiVerse[]
  pagination: { next_page: number | null; total_pages: number }
}

/**
 * Quran.com's Indo-Pak text carries private-use glyph codes for its own font plus
 * zero-width / bidi controls. Strip them so the text renders with the PDMS font.
 * (Built from code points so the invisible characters never appear in source.)
 */
const ch = (cp: number) => String.fromCharCode(cp)
const STRIP_RE = new RegExp(
  `[${ch(0x200b)}${ch(0x200f)}${ch(0xfeff)}${ch(0x061c)}${ch(0xe000)}-${ch(0xf8ff)}]`,
  'g',
)
const WIDE_SPACE_RE = new RegExp(`[${ch(0x2002)}${ch(0x2003)}]`, 'g')

export function cleanArabic(text: string): string {
  return text.replace(STRIP_RE, '').replace(WIDE_SPACE_RE, ' ').replace(/\s+/g, ' ').trim()
}

function mapVerse(v: ApiVerse, script: ArabicScript): VerseWords {
  const [s, a] = v.verse_key.split(':').map(Number)
  const field = script === 'uthmani' ? 'text_uthmani' : 'text_indopak'
  return {
    surah: s,
    ayah: a,
    page: v.page_number,
    juz: v.juz_number,
    arabic: cleanArabic(v[field] ?? ''),
    sajda: v.sajdah_number != null,
    manzil: v.manzil_number,
    ruku: v.ruku_number,
    words: v.words
      .filter((w) => w.char_type_name === 'word')
      .map((w) => ({
        arabic: cleanArabic(w[field] ?? ''),
        urdu: (w.translation?.text ?? '').trim(),
        line: w.line_number,
      })),
  }
}

async function getPage(juz: number, page: number, signal?: AbortSignal): Promise<ApiPage> {
  const url =
    `${BASE}/verses/by_juz/${juz}?language=ur&words=true` +
    `&word_fields=text_indopak,text_uthmani&fields=text_indopak,text_uthmani` +
    `&per_page=${PER_PAGE}&page=${page}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Quran.com HTTP ${res.status} (juz ${juz}, page ${page})`)
  return (await res.json()) as ApiPage
}

/**
 * All verses of a parah with word-by-word Urdu, in mushaf order.
 * The first page tells us how many there are; the rest are fetched in parallel.
 */
export async function fetchJuzWords(
  juz: number,
  script: ArabicScript,
  signal?: AbortSignal,
): Promise<VerseWords[]> {
  const first = await getPage(juz, 1, signal)
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.pagination.total_pages - 1) }, (_, i) => getPage(juz, i + 2, signal)),
  )
  return [first, ...rest].flatMap((p) => p.verses.map((v) => mapVerse(v, script)))
}

const bismillahCache = new Map<ArabicScript, Promise<VerseWords>>()

/** Word-by-word of 1:1 — reused as the Bismillah row at the start of every surah. Fetched once per script. */
export function fetchBismillahWords(script: ArabicScript, signal?: AbortSignal): Promise<VerseWords> {
  const cached = bismillahCache.get(script)
  if (cached) return cached
  const field = script === 'uthmani' ? 'text_uthmani' : 'text_indopak'
  const p = fetch(`${BASE}/verses/by_key/1:1?language=ur&words=true&word_fields=${field}&fields=${field}`, { signal })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Quran.com HTTP ${res.status} (1:1)`)
      const { verse } = (await res.json()) as { verse: ApiVerse }
      return mapVerse(verse, script)
    })
    .catch((err) => {
      bismillahCache.delete(script) // let the next caller retry
      throw err
    })
  bismillahCache.set(script, p)
  return p
}
