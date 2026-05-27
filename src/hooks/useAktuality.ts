import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Aktualita = {
  id: string
  title: string
  perex: string | null
  body: string
  cover_url: string | null
  kategoria: 'oznam' | 'akcia' | 'uzavierka' | 'vypadok' | 'sport' | 'ine'
  published_at: string | null
  is_published?: boolean
}

/**
 * Hook pre verejnosť — vracia iba aktuality ktoré sú:
 *   1) is_published = true
 *   2) majú published_at v minulosti (alebo teraz)
 *
 * Naplánované aktuality s published_at v budúcnosti sa skryjú a automaticky
 * objavia v správny čas (žiadny cron — len Supabase filter).
 */
export function useAktuality() {
  const [aktuality, setAktuality] = useState<Aktualita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('aktuality')
      .select('*')
      .eq('is_published', true)
      .lte('published_at', now)        // ⬅️ filter naplánované do budúcna
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(20)

    if (error) setError(error.message)
    else { setAktuality((data as Aktualita[]) || []); setError(null) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const refresh = useCallback(async () => { await load() }, [load])

  return { aktuality, loading, error, refresh }
}
