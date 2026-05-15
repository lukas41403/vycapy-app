/**
 * useSeniorMode — prepínač senior módu.
 *
 * Aktuálna verzia drží stav iba v pamäti (resetuje sa pri reštarte appky).
 *
 * ─── PERZISTENCIA (voliteľné, neskôr) ──────────────────────────────────────
 * Ak chceš aby si appka pamätala senior mód medzi spusteniami, nainštaluj:
 *
 *   npx expo install @react-native-async-storage/async-storage
 *
 * Potom odkomentuj nasledovný riadok aj `loadFromStorage`/`saveToStorage`
 * implementácie nižšie.
 * ────────────────────────────────────────────────────────────────────────── */

// import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'seniorMode'

// ── Modul-level shared state, aby useSeniorMode v rôznych komponentoch
//    videl tú istú hodnotu kým appka beží.
let memoryValue = false
const subscribers = new Set<(v: boolean) => void>()

function setShared(v: boolean) {
  memoryValue = v
  subscribers.forEach(fn => fn(v))
}

async function loadFromStorage(): Promise<boolean> {
  // Po nainštalovaní AsyncStorage odkomentuj:
  // try {
  //   const v = await AsyncStorage.getItem(STORAGE_KEY)
  //   return v === 'true'
  // } catch { return false }
  void STORAGE_KEY
  return memoryValue
}

async function saveToStorage(v: boolean) {
  // Po nainštalovaní AsyncStorage odkomentuj:
  // try { await AsyncStorage.setItem(STORAGE_KEY, v.toString()) } catch {}
  void v
}

export function useSeniorMode() {
  const [isSenior, setIsSenior] = useState(memoryValue)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate raz pri prvom renderi
  useEffect(() => {
    let alive = true
    loadFromStorage().then(v => {
      if (alive) {
        memoryValue = v
        setIsSenior(v)
        setHydrated(true)
      }
    })
    // Subscribe na zmeny zdieľaného stavu
    const sub = (next: boolean) => setIsSenior(next)
    subscribers.add(sub)
    return () => { alive = false; subscribers.delete(sub) }
  }, [])

  const set = useCallback(async (value: boolean) => {
    setShared(value)
    await saveToStorage(value)
  }, [])

  const toggle = useCallback(() => set(!memoryValue), [set])

  return { isSenior, hydrated, set, toggle }
}
