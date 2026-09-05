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

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<ProgressState>
      return { lastRead: p.lastRead ?? null, bookmarks: p.bookmarks ?? [] }
    }
    // Migrate v1 (surah/ayah only) by assuming the surah's starting parah.
    const old = localStorage.getItem('quran-progress-v1')
    if (old) {
      const p = JSON.parse(old) as { lastRead?: { surah: number; ayah: number; at: number } | null; bookmarks?: { surah: number; ayah: number }[] }
      const withJuz = <T extends { surah: number }>(x: T) => ({ ...x, juz: SURAH_START_JUZ[x.surah - 1] ?? 1 })
      return {
        lastRead: p.lastRead ? withJuz(p.lastRead) : null,
        bookmarks: (p.bookmarks ?? []).map(withJuz),
      }
    }
  } catch {
    /* ignore */
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

export function isBookmarked(pos: Position): boolean {
  return state.bookmarks.some((b) => same(b, pos))
}

export function toggleBookmark(pos: Position) {
  const bookmarks = isBookmarked(pos)
    ? state.bookmarks.filter((b) => !same(b, pos))
    : [...state.bookmarks, pos].sort((a, b) => a.surah - b.surah || a.ayah - b.ayah)
  commit({ ...state, bookmarks })
}

/** Route to open a position in the reader. */
export function positionUrl(p: Position): string {
  return `/juz/${p.juz}?ayah=${p.surah}:${p.ayah}`
}
