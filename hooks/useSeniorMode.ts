/**
 * useSeniorMode — prepínač senior módu + nastavenia (font scale, vlastné kontakty).
 *
 * Aktuálna verzia drží stav v pamäti modulu — pri reštarte appky sa resetuje.
 * Pre perzistenciu medzi spusteniami:
 *   npx expo install @react-native-async-storage/async-storage
 * → odkomentuj loadFromStorage / saveToStorage funkcie nižšie.
 *
 * API:
 *   const { isSenior, set, toggle } = useSeniorMode()
 *   const { fontScale, setFontScale } = useSeniorMode()
 *   const { customKontakty, addKontakt, removeKontakt } = useSeniorMode()
 *
 *   const fonts = useSeniorFontSizes()  // → reaktívne podľa fontScale
 */

// import AsyncStorage from '@react-native-async-storage/async-storage'
import { CustomKontakt, FontScale, FONT_SCALES } from '@/constants/seniorMode'
import { useCallback, useEffect, useMemo, useState } from 'react'

const KEY_ENABLED = 'seniorMode'
const KEY_SCALE   = 'seniorFontScale'
const KEY_KONTAKTY= 'seniorCustomKontakty'

// ─── Module-level shared state ────────────────────────────────────────────
type State = {
  enabled: boolean
  fontScale: FontScale
  customKontakty: CustomKontakt[]
}

let mem: State = {
  enabled: false,
  fontScale: 'medium',
  customKontakty: [],
}

const subscribers = new Set<(s: State) => void>()

function setShared(next: Partial<State>) {
  mem = { ...mem, ...next }
  subscribers.forEach(fn => fn(mem))
}

async function loadFromStorage(): Promise<State> {
  // Po nainštalovaní AsyncStorage:
  // try {
  //   const [en, sc, k] = await Promise.all([
  //     AsyncStorage.getItem(KEY_ENABLED),
  //     AsyncStorage.getItem(KEY_SCALE),
  //     AsyncStorage.getItem(KEY_KONTAKTY),
  //   ])
  //   return {
  //     enabled: en === 'true',
  //     fontScale: (sc as FontScale) || 'medium',
  //     customKontakty: k ? JSON.parse(k) : [],
  //   }
  // } catch { return mem }
  void [KEY_ENABLED, KEY_SCALE, KEY_KONTAKTY]
  return mem
}

async function saveEnabled(v: boolean) {
  // try { await AsyncStorage.setItem(KEY_ENABLED, String(v)) } catch {}
  void v
}
async function saveScale(s: FontScale) {
  // try { await AsyncStorage.setItem(KEY_SCALE, s) } catch {}
  void s
}
async function saveKontakty(k: CustomKontakt[]) {
  // try { await AsyncStorage.setItem(KEY_KONTAKTY, JSON.stringify(k)) } catch {}
  void k
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useSeniorMode() {
  const [state, setState] = useState<State>(mem)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let alive = true
    loadFromStorage().then(s => {
      if (alive) {
        mem = s
        setState(s)
        setHydrated(true)
      }
    })
    const sub = (next: State) => setState(next)
    subscribers.add(sub)
    return () => { alive = false; subscribers.delete(sub) }
  }, [])

  // Toggle / set enabled
  const set = useCallback(async (value: boolean) => {
    setShared({ enabled: value })
    await saveEnabled(value)
  }, [])
  const toggle = useCallback(() => set(!mem.enabled), [set])

  // Font scale
  const setFontScale = useCallback(async (scale: FontScale) => {
    setShared({ fontScale: scale })
    await saveScale(scale)
  }, [])

  // Custom kontakty
  const addKontakt = useCallback(async (k: Omit<CustomKontakt, 'id'>) => {
    const next: CustomKontakt = { ...k, id: Date.now().toString(36) }
    const list = [...mem.customKontakty, next]
    setShared({ customKontakty: list })
    await saveKontakty(list)
    return next
  }, [])

  const removeKontakt = useCallback(async (id: string) => {
    const list = mem.customKontakty.filter(k => k.id !== id)
    setShared({ customKontakty: list })
    await saveKontakty(list)
  }, [])

  const updateKontakt = useCallback(async (id: string, patch: Partial<CustomKontakt>) => {
    const list = mem.customKontakty.map(k => (k.id === id ? { ...k, ...patch } : k))
    setShared({ customKontakty: list })
    await saveKontakty(list)
  }, [])

  return {
    isSenior: state.enabled,
    hydrated,
    set,
    toggle,
    fontScale: state.fontScale,
    setFontScale,
    customKontakty: state.customKontakty,
    addKontakt,
    removeKontakt,
    updateKontakt,
  }
}

/**
 * Vráti aktuálnu sadu veľkostí písma podľa fontScale nastavenia.
 * Komponenty by mali volať tento hook namiesto priameho SENIOR.fontSize.
 */
export function useSeniorFontSizes() {
  const { fontScale } = useSeniorMode()
  return useMemo(() => FONT_SCALES[fontScale], [fontScale])
}
