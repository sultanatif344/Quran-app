import { useSyncExternalStore } from 'react'
import { SURAH_START_JUZ } from '../data/juzNames'

export interface Position {
  juz: number
  surah: number
  ayah: number
}

export interface LastRead extends Position {
  at: number
}

interface ProgressState {
  lastRead: LastRead | null
  bookmarks: Position[]
}

const KEY = 'quran-progress-v2'

const inRange = (v: unknown, max: number): v is number => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= max

/** Accept only well-formed positions from storage; anything else is dropped. */
function asPosition(x: unknown): Position | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  if (!inRange(o.surah, 114) || !inRange(o.ayah, 286)) return null
  const juz = inRange(o.juz, 30) ? o.juz : SURAH_START_JUZ[o.surah - 1]
  return { juz, surah: o.surah, ayah: o.ayah }
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem('quran-progress-v1')
    if (raw) {
      const p = JSON.parse(raw) as { lastRead?: unknown; bookmarks?: unknown }
      const last = asPosition(p.lastRead)
      const at = (p.lastRead as { at?: unknown } | null)?.at
      return {
        lastRead: last ? { ...last, at: typeof at === 'number' ? at : Date.now() } : null,
        bookmarks: Array.isArray(p.bookmarks) ? p.bookmarks.map(asPosition).filter((b): b is Position => b !== null) : [],
      }
    }
  } catch {
    /* corrupt storage — start fresh */
  }
  return { lastRead: null, bookmarks: [] }
}

let state: ProgressState = load()
const listeners = new Set<() => void>()

function commit(next: ProgressState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, () => state)
}

const same = (a: Position, b: Position) => a.surah === b.surah && a.ayah === b.ayah

export function setLastRead(pos: Position) {
  if (state.lastRead && same(state.lastRead, pos)) return
  commit({ ...state, lastRead: { ...pos, at: Date.now() } })
}

export function toggleBookmark(pos: Position) {
  const bookmarks = state.bookmarks.some((b) => same(b, pos))
    ? state.bookmarks.filter((b) => !same(b, pos))
    : [...state.bookmarks, pos].sort((a, b) => a.surah - b.surah || a.ayah - b.ayah)
  commit({ ...state, bookmarks })
}

/** Route to open a position in the reader. */
export function positionUrl(p: Position): string {
  return `/juz/${p.juz}?ayah=${p.surah}:${p.ayah}`
}
