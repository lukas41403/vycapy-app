/**
 * useAnkety / useAnketa — hooks pre obecné ankety.
 *
 * Supabase SQL (user spustí sám):
 *
 *   CREATE TABLE public.ankety (
 *     id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
 *     otazka text NOT NULL,
 *     popis text,
 *     je_aktivna boolean DEFAULT true,
 *     deadline timestamptz,
 *     created_at timestamptz DEFAULT now()
 *   );
 *
 *   CREATE TABLE public.hlasy (
 *     id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
 *     anketa_id uuid REFERENCES ankety(id) ON DELETE CASCADE,
 *     odpoved text CHECK (odpoved IN ('pre','proti','zdrziavam')) NOT NULL,
 *     device_id text NOT NULL,
 *     created_at timestamptz DEFAULT now(),
 *     UNIQUE (anketa_id, device_id)
 *   );
 *
 *   ALTER TABLE public.ankety ENABLE ROW LEVEL SECURITY;
 *   ALTER TABLE public.hlasy  ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "ankety_read" ON ankety FOR SELECT USING (true);
 *   CREATE POLICY "hlasy_read"  ON hlasy  FOR SELECT USING (true);
 *   CREATE POLICY "hlasy_insert" ON hlasy FOR INSERT WITH CHECK (true);
 */

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Anketa = {
  id: string
  otazka: string
  popis: string | null
  je_aktivna: boolean
  deadline: string | null
  created_at: string
}

export type Odpoved = 'pre' | 'proti' | 'zdrziavam'

export type Hlas = {
  id: string
  anketa_id: string
  odpoved: Odpoved
  device_id: string
  created_at: string
}

export type Vysledok = {
  pre: number
  proti: number
  zdrziavam: number
  total: number
  mojHlas: Odpoved | null
}

// Pseudo device ID — pre demo postačí jednorazový random uložený v memory.
// V production: SecureStore / AsyncStorage pre persistenciu.
let DEVICE_ID: string | null = null
function getDeviceId(): string {
  if (DEVICE_ID) return DEVICE_ID
  DEVICE_ID = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
  return DEVICE_ID
}

export function useAktivneAnkety() {
  const [ankety, setAnkety] = useState<Anketa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ankety')
      .select('*')
      .eq('je_aktivna', true)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setAnkety((data as Anketa[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { ankety, loading, error, reload: load }
}

export function useAnketaVysledok(anketa_id: string | null) {
  const [vysledok, setVysledok] = useState<Vysledok>({
    pre: 0, proti: 0, zdrziavam: 0, total: 0, mojHlas: null,
  })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!anketa_id) return
    setLoading(true)
    const { data } = await supabase
      .from('hlasy')
      .select('odpoved, device_id')
      .eq('anketa_id', anketa_id)
    const hlasy = (data as { odpoved: Odpoved; device_id: string }[]) || []
    const devId = getDeviceId()
    const v: Vysledok = {
      pre: 0, proti: 0, zdrziavam: 0,
      total: hlasy.length,
      mojHlas: null,
    }
    hlasy.forEach(h => {
      v[h.odpoved]++
      if (h.device_id === devId) v.mojHlas = h.odpoved
    })
    setVysledok(v)
    setLoading(false)
  }, [anketa_id])

  useEffect(() => { load() }, [load])

  const hlasuj = useCallback(async (odpoved: Odpoved) => {
    if (!anketa_id) return
    const devId = getDeviceId()
    const { error } = await supabase.from('hlasy').insert({
      anketa_id, odpoved, device_id: devId,
    })
    if (error) {
      // Najčastejšie unique constraint — už hlasoval z tohto zariadenia
      throw error
    }
    await load()
  }, [anketa_id, load])

  return { vysledok, loading, hlasuj, reload: load }
}

export async function vytvorAnketu(input: {
  otazka: string
  popis?: string | null
  deadline?: string | null
}) {
  const { error } = await supabase.from('ankety').insert({
    otazka: input.otazka,
    popis: input.popis ?? null,
    deadline: input.deadline ?? null,
    je_aktivna: true,
  })
  if (error) throw error
}
