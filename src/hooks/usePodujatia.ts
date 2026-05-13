import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Podujatie = {
  id: string
  title: string
  popis: string | null
  kategoria: string
  datum_od: string
  datum_do: string | null
  miesto: string | null
  obrazok_url: string | null
}

export function usePodujatia() {
  const [podujatia, setPodujatia] = useState<Podujatie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      const dnes = new Date().toISOString()
      const { data, error } = await supabase
        .from('podujatia')
        .select('*')
        .eq('is_published', true)
        .gte('datum_od', dnes)
        .order('datum_od', { ascending: true })
        .limit(20)

      if (error) setError(error.message)
      else setPodujatia(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  return { podujatia, loading, error }
}