import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type OdpadZaznam = {
  id: string
  datum: string
  poznamka: string | null
  typ: {
    nazov: string
    farba: string
    ikona: string | null
  }
}

export function useOdpady() {
  const [odpady, setOdpady] = useState<OdpadZaznam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const dnes = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('odpady_kalendar')
      .select(`
        id,
        datum,
        poznamka,
        typ:odpady_typy(nazov, farba, ikona)
      `)
      .gte('datum', dnes)
      .order('datum', { ascending: true })
      .limit(30)

    if (error) setError(error.message)
    else { setOdpady((data as unknown as OdpadZaznam[]) || []); setError(null) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const refresh = useCallback(async () => { await load() }, [load])

  return { odpady, loading, error, refresh }
}
