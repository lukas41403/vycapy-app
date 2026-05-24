/**
 * useFarskeOznamy — hook na načítanie farských oznamov.
 *
 * ─── DB schéma (Supabase) ──────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS public.farske_oznamy (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   typ text NOT NULL CHECK (typ IN ('omsa', 'smutok', 'krst', 'sobas', 'ohlaska', 'oznam')),
 *   nazov text NOT NULL,
 *   popis text,
 *   datum_od timestamptz,
 *   datum_do timestamptz,
 *   miesto text DEFAULT 'Kostol Výčapy-Opatovce',
 *   je_aktivny boolean DEFAULT true,
 *   created_at timestamptz DEFAULT now()
 * );
 * ALTER TABLE public.farske_oznamy ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "farske_oznamy_read"  ON farske_oznamy FOR SELECT USING (je_aktivny = true);
 * CREATE POLICY "farske_oznamy_write" ON farske_oznamy FOR ALL USING (auth.role() = 'authenticated');
 *
 * ─── Fallback ──────────────────────────────────────────────────────────
 * Ak DB tabuľka neexistuje, hook vráti prázdne pole a komponent zobrazí
 * "Zatiaľ tu nie sú farské oznamy. Obec ich pridá cez admin panel."
 */

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type FarskyTypOznamu = 'omsa' | 'smutok' | 'krst' | 'sobas' | 'ohlaska' | 'oznam'

export type FarskyOznam = {
  id: string
  typ: FarskyTypOznamu
  nazov: string                // "Sobotná sv. omša" / "Zomrel Ján Novák" / "Sobáš Peter & Mária"
  popis: string | null
  datum_od: string | null      // ISO string
  datum_do: string | null
  miesto: string | null
  je_aktivny: boolean
  created_at: string
}

export const FARSKY_TYP_LABEL: Record<FarskyTypOznamu, string> = {
  omsa:    'Sv. omša',
  smutok:  'Smútočný oznam',
  krst:    'Krst',
  sobas:   'Sobáš',
  ohlaska: 'Ohláška',
  oznam:   'Oznam',
}

export const FARSKY_TYP_EMOJI: Record<FarskyTypOznamu, string> = {
  omsa:    '🙏',
  smutok:  '🕯️',
  krst:    '👶',
  sobas:   '💒',
  ohlaska: '📣',
  oznam:   '📋',
}

export const FARSKY_TYP_TONE: Record<FarskyTypOznamu, 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent'> = {
  omsa:    'info',
  smutok:  'neutral',
  krst:    'success',
  sobas:   'accent',
  ohlaska: 'warning',
  oznam:   'neutral',
}

export function useFarskeOznamy() {
  const [oznamy, setOznamy] = useState<FarskyOznam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('farske_oznamy')
      .select('*')
      .eq('je_aktivny', true)
      .order('datum_od', { ascending: true, nullsFirst: false })
      .limit(50)

    if (error) {
      // Najčastejšie: tabuľka neexistuje. Vrátime prázdne pole s mäkkou chybou.
      setError(error.message)
      setOznamy([])
    } else {
      setOznamy((data as FarskyOznam[]) || [])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const refresh = useCallback(async () => { await load() }, [load])

  return { oznamy, loading, error, refresh }
}
