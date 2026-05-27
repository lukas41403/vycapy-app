import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Podujatie = {
  id: string
  title: string
  popis: string | null
  kategoria: string
  datum_od: string         // kedy sa podujatie koná
  datum_do: string | null
  miesto: string | null
  obrazok_url: string | null
  is_published?: boolean
  publish_at?: string | null  // kedy sa má aktualita zverejniť (scheduled)
}

/**
 * Hook pre verejnosť — vracia iba podujatia ktoré sú:
 *   1) is_published = true
 *   2) ich datum_od je v budúcnosti
 *   3) publish_at je v minulosti (alebo NULL) — t.j. boli zverejnené
 *
 * Naplánované zverejnenie cez publish_at sa rieši defenzívne: ak stĺpec
 * v DB neexistuje, fallback vetva ho ignoruje a vráti všetky verejné.
 */
export function usePodujatia() {
  const [podujatia, setPodujatia] = useState<Podujatie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const dnes = new Date().toISOString()

    // Pokus s publish_at filterom
    const { data, error } = await supabase
      .from('podujatia')
      .select('*')
      .eq('is_published', true)
      .gte('datum_od', dnes)
      .or(`publish_at.is.null,publish_at.lte.${dnes}`)
      .order('datum_od', { ascending: true })
      .limit(20)

    if (error) {
      // Fallback — stĺpec publish_at možno neexistuje
      const { data: fb, error: fbErr } = await supabase
        .from('podujatia')
        .select('*')
        .eq('is_published', true)
        .gte('datum_od', dnes)
        .order('datum_od', { ascending: true })
        .limit(20)
      if (fbErr) setError(fbErr.message)
      else { setPodujatia(fb || []); setError(null) }
    } else {
      setPodujatia(data || []); setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const refresh = useCallback(async () => { await load() }, [load])

  return { podujatia, loading, error, refresh }
}
