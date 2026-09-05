import { useSyncExternalStore } from 'react'

export interface Position {
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

const KEY = 'quran-progress-v1'

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<ProgressState>
      return { lastRead: p.lastRead ?? null, bookmarks: p.bookmarks ?? [] }
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

export function setLastRead(pos: Position) {
  if (state.lastRead && state.lastRead.surah === pos.surah && state.lastRead.ayah === pos.ayah) return
  commit({ ...state, lastRead: { ...pos, at: Date.now() } })
}

export function isBookmarked(pos: Position): boolean {
  return state.bookmarks.some((b) => b.surah === pos.surah && b.ayah === pos.ayah)
}

export function toggleBookmark(pos: Position) {
  const exists = isBookmarked(pos)
  const bookmarks = exists
    ? state.bookmarks.filter((b) => !(b.surah === pos.surah && b.ayah === pos.ayah))
    : [...state.bookmarks, pos].sort((a, b) => a.surah - b.surah || a.ayah - b.ayah)
  commit({ ...state, bookmarks })
}
