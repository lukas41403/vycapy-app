/**
 * Hooks pre FC Výčapy-Opatovce — hráči a zápasy.
 *
 * Tabuľky:
 *   fc_hraci    — meno, priezvisko, pozicia, cislo_dresu, je_trener
 *   fc_zapasy   — datum, superár, je_doma, goly_my, goly_supar, sutaz, miesto, futbalnet_url
 *
 * Poznámka: stĺpec `superár` má diakritiku — Postgres to povolí ale je to
 * nezvyčajné. Necháme ako je, aby kód súhlasil s SQL z user-ovho zadania.
 */

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Hrac = {
  id: string
  meno: string
  priezvisko: string
  pozicia: 'brankár' | 'obranca' | 'záložník' | 'útočník'
  cislo_dresu: number | null
  foto_url: string | null
  je_trener: boolean
  is_active: boolean
  created_at: string
}

export type Zapas = {
  id: string
  datum: string
  superár: string
  je_doma: boolean
  goly_my: number | null
  goly_supar: number | null
  sutaz: string
  miesto: string | null
  futbalnet_url: string | null
  created_at: string
}

export function useFcHraci() {
  const [hraci, setHraci] = useState<Hrac[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('fc_hraci')
        .select('*')
        .eq('is_active', true)
        .order('je_trener', { ascending: false })
        .order('cislo_dresu', { ascending: true, nullsFirst: false })

      if (error) setError(error.message)
      else setHraci((data as Hrac[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  return { hraci, loading, error }
}

export function useFcZapasy() {
  const [zapasy, setZapasy] = useState<Zapas[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('fc_zapasy')
        .select('*')
        .order('datum', { ascending: false })

      if (error) setError(error.message)
      else setZapasy((data as Zapas[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  return { zapasy, loading, error }
}
