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
}

export function useAktuality() {
  const [aktuality, setAktuality] = useState<Aktualita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('aktuality')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(20)

    if (error) setError(error.message)
    else { setAktuality(data || []); setError(null) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const refresh = useCallback(async () => { await load() }, [load])

  return { aktuality, loading, error, refresh }
}
