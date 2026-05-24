import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type ZariadenieTyp = 'osvetlenie' | 'voda' | 'senzor_vody' | 'meteo' | 'kontajner'

export type Zariadenie = {
  id: string
  nazov: string
  typ: ZariadenieTyp
  ulica: string | null
  stav: boolean | null
  posledna_hodnota: number | null
  jednotka: string | null
  lat: number | null
  lng: number | null
  // Meteo / kvalita vzduchu — voliteľné polia, ktoré dáva senzor typu 'meteo'
  aqi?: number | null            // European AQI
  pm25?: number | null           // µg/m³
  pm10?: number | null           // µg/m³
  teplota?: number | null        // °C
  vlhkost?: number | null        // %
  updated_at: string
}

export function useObecneZariadenia() {
  const [zariadenia, setZariadenia] = useState<Zariadenie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const nacitaj = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('obecne_zariadenia')
      .select('*')
      .order('typ', { ascending: true })
      .order('nazov', { ascending: true })

    if (error) setError(error.message)
    else setZariadenia((data as Zariadenie[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { nacitaj() }, [nacitaj])

  // Toggle pre osvetlenie
  const toggleStav = useCallback(async (id: string, novyStav: boolean) => {
    // optimistic update
    setZariadenia(prev => prev.map(z => z.id === id ? { ...z, stav: novyStav } : z))
    const { error } = await supabase
      .from('obecne_zariadenia')
      .update({ stav: novyStav, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      // rollback on error
      await nacitaj()
      throw error
    }
  }, [nacitaj])

  // Hromadná akcia pre všetky osvetlenia
  const nastavitVsetkyOsvetlenia = useCallback(async (zapnut: boolean) => {
    const osvetlenia = zariadenia.filter(z => z.typ === 'osvetlenie')
    setZariadenia(prev => prev.map(z =>
      z.typ === 'osvetlenie' ? { ...z, stav: zapnut } : z
    ))
    const { error } = await supabase
      .from('obecne_zariadenia')
      .update({ stav: zapnut, updated_at: new Date().toISOString() })
      .in('id', osvetlenia.map(o => o.id))
    if (error) {
      await nacitaj()
      throw error
    }
  }, [zariadenia, nacitaj])

  return { zariadenia, loading, error, nacitaj, toggleStav, nastavitVsetkyOsvetlenia }
}
