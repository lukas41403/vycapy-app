/**
 * useSusedskyPredaj — bazár medzi občanmi obce.
 *
 * SQL skript: pozri supabase-setup.sql (tabuľka public.susedsky_predaj).
 */

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type InzeratTyp = 'predam' | 'kupim' | 'zadarmo' | 'hladam'
export type InzeratStav = 'aktivny' | 'rezervovane' | 'predane' | 'zamietnute' | 'expirovany'

export type Inzerat = {
  id: string
  typ: InzeratTyp
  kategoria: string
  nazov: string
  popis: string | null
  cena: number | null
  mena: string | null
  foto_urls: string[]
  meno: string
  telefon: string | null
  email: string | null
  stav: InzeratStav
  je_schvaleny: boolean
  expiruje_at: string | null
  created_at: string
}

export const INZERAT_TYPY: { id: InzeratTyp; label: string; emoji: string; farba: string }[] = [
  { id: 'predam',  label: 'Predám',  emoji: '💰', farba: '#2E7D32' },
  { id: 'kupim',   label: 'Kúpim',   emoji: '🛒', farba: '#1565C0' },
  { id: 'zadarmo', label: 'Zadarmo', emoji: '🎁', farba: '#F57F17' },
  { id: 'hladam',  label: 'Hľadám',  emoji: '🔍', farba: '#6A1B9A' },
]

export const INZERAT_KATEGORIE: { id: string; label: string; emoji: string }[] = [
  { id: 'auto',       label: 'Auto-moto',          emoji: '🚗' },
  { id: 'byvanie',    label: 'Bývanie',            emoji: '🏠' },
  { id: 'domacnost',  label: 'Domácnosť',          emoji: '🍽️' },
  { id: 'zahrada',    label: 'Záhrada',            emoji: '🌱' },
  { id: 'zvierata',   label: 'Domáce zvieratá',    emoji: '🐶' },
  { id: 'elektro',    label: 'Elektro',            emoji: '📱' },
  { id: 'sport',      label: 'Šport / hobby',      emoji: '⚽' },
  { id: 'detske',     label: 'Detské veci',        emoji: '🧸' },
  { id: 'praca',      label: 'Práca',              emoji: '🔧' },
  { id: 'sluzby',     label: 'Služby',             emoji: '✂️' },
  { id: 'ine',        label: 'Iné',                emoji: '📦' },
]

/** Hook pre verejnosť — vracia iba aktívne schválené neexpirované inzeráty. */
export function useSusedskyPredaj() {
  const [inzeraty, setInzeraty] = useState<Inzerat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('susedsky_predaj')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      setError(error.message)
      setInzeraty([])
    } else {
      setInzeraty((data as Inzerat[]) || [])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const refresh = useCallback(async () => { await load() }, [load])

  return { inzeraty, loading, error, refresh }
}

/** Hook pre admin — vracia všetky, vrátane neschválených. */
export function useAdminSusedskyPredaj() {
  const [inzeraty, setInzeraty] = useState<Inzerat[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('susedsky_predaj')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    setInzeraty((data as Inzerat[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { inzeraty, loading, refresh: load }
}
