/**
 * useBookmarks — uloženie obsahu do "Môj zoznam".
 *
 * Občan si môže uložiť:
 *   - aktualitu, podujatie, výlet (okolie), inzerát (susedský predaj),
 *     službu v obci, farský oznam
 *
 * Persistencia: AsyncStorage (perzistuje medzi spusteniami appky).
 * Žiadny backend — všetko lokálne v zariadení.
 *
 * Použitie:
 *   const bm = useBookmark({ id, kind: 'aktualita', title, ... })
 *   bm.isMarked      // boolean
 *   bm.toggle()      // pridať / odstrániť
 *
 *   const { items, removeAll } = useAllBookmarks()
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

// Defenzívne import AsyncStorage — ak nie je nainštalovaný, fallback in-memory
let AsyncStorage: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AsyncStorage = require('@react-native-async-storage/async-storage').default
} catch {
  AsyncStorage = null
}

const STORAGE_KEY = 'bookmarks_v1'

export type BookmarkKind =
  | 'aktualita' | 'podujatie' | 'vylet' | 'inzerat' | 'sluzba' | 'farsky'

export type Bookmark = {
  id: string                  // unikátne v rámci kind-u
  kind: BookmarkKind
  title: string               // zobrazované meno
  podtitul?: string           // krátky popis
  kategoria?: string          // pre filtre / odznaky
  emoji?: string              // pre rýchle rozpoznanie
  datum?: string              // ISO — pre triedenie
  url?: string                // path v appke (napr. /aktualita/123)
  savedAt: string             // ISO kedy uložené
}

// ─── Module-level cache ───────────────────────────────────────────────────
let memCache: Bookmark[] | null = null
const subscribers = new Set<(items: Bookmark[]) => void>()

async function loadFromStorage(): Promise<Bookmark[]> {
  if (!AsyncStorage) return memCache ?? []
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Bookmark[]
  } catch {
    return []
  }
}

async function saveToStorage(items: Bookmark[]) {
  if (!AsyncStorage) {
    memCache = items
    return
  }
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // tichá chyba
  }
}

function notify(items: Bookmark[]) {
  memCache = items
  subscribers.forEach(fn => fn(items))
}

async function init(): Promise<Bookmark[]> {
  if (memCache != null) return memCache
  const loaded = await loadFromStorage()
  memCache = loaded
  return loaded
}

// ─── Public API ───────────────────────────────────────────────────────────

/** Hook pre konkrétny item — zistí či je uložený a vie ho pridať/odstrániť. */
export function useBookmark(meta: Omit<Bookmark, 'savedAt'> | null) {
  const { items } = useAllBookmarks()

  const isMarked = useMemo(() => {
    if (!meta) return false
    return items.some(b => b.id === meta.id && b.kind === meta.kind)
  }, [items, meta?.id, meta?.kind])

  const toggle = useCallback(async () => {
    if (!meta) return
    const current = await init()
    const exists = current.some(b => b.id === meta.id && b.kind === meta.kind)
    let next: Bookmark[]
    if (exists) {
      next = current.filter(b => !(b.id === meta.id && b.kind === meta.kind))
    } else {
      next = [{ ...meta, savedAt: new Date().toISOString() }, ...current]
    }
    await saveToStorage(next)
    notify(next)
  }, [meta?.id, meta?.kind, meta?.title, meta?.kind, meta])

  return { isMarked, toggle }
}

/** Hook pre celý zoznam uložených — používa sa v obrazovke "Môj zoznam". */
export function useAllBookmarks() {
  const [items, setItems] = useState<Bookmark[]>(memCache ?? [])
  const [loaded, setLoaded] = useState(memCache != null)

  useEffect(() => {
    let alive = true
    init().then(its => {
      if (alive) { setItems(its); setLoaded(true) }
    })
    const sub = (next: Bookmark[]) => setItems(next)
    subscribers.add(sub)
    return () => { alive = false; subscribers.delete(sub) }
  }, [])

  const remove = useCallback(async (id: string, kind: BookmarkKind) => {
    const current = await init()
    const next = current.filter(b => !(b.id === id && b.kind === kind))
    await saveToStorage(next)
    notify(next)
  }, [])

  const removeAll = useCallback(async () => {
    await saveToStorage([])
    notify([])
  }, [])

  return { items, loaded, remove, removeAll }
}
