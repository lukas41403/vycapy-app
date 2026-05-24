/**
 * useWeather — počasie a kvalita vzduchu z Open-Meteo (zadarmo, žiadny API kľúč).
 *
 * Open-Meteo:
 *   Forecast:     https://open-meteo.com/en/docs
 *   Air Quality:  https://open-meteo.com/en/docs/air-quality-api
 *
 * Cachujeme v pamäti modulu (30 min) — Open-Meteo nemá rate limit pre nekomerčné
 * použitie, ale je to slušné voči API.
 *
 * Vstup: GPS súradnice (default = obec z tenant configu).
 * Výstup: aktuálne počasie + 24h hodinová predpoveď + 7-dňový prehľad + AQI.
 */

import { useCallback, useEffect, useState } from 'react'

const FORECAST_API = 'https://api.open-meteo.com/v1/forecast'
const AIR_QUALITY_API = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const CACHE_MS = 30 * 60 * 1000 // 30 minút

// ─── Typy ─────────────────────────────────────────────────────────────────
export type WeatherSnapshot = {
  // Current
  teplota: number               // °C
  teplotaPocit: number          // °C (apparent)
  vlhkost: number               // %
  vietor: number                // km/h
  smerVietra: number            // 0-360°
  zrazky: number                // mm
  kod: number                   // WMO weather code
  popis: string                 // "Polooblačno"
  emoji: string                 // 🌤️
  jeDen: boolean                // is_day
  cas: string                   // ISO timestamp

  // Hodinová (24h)
  hourly: {
    cas: string
    teplota: number
    kod: number
    emoji: string
    zrazky: number
    pravdepodobnostZrazok: number  // %
  }[]

  // Denná (7d)
  daily: {
    datum: string
    teplotaMax: number
    teplotaMin: number
    kod: number
    emoji: string
    popis: string
    zrazky: number
    pravdepodobnostZrazok: number
    vychod: string  // sunrise
    zapad: string   // sunset
  }[]

  // Kvalita vzduchu (Open-Meteo Air Quality)
  aqi: {
    european: number | null     // European AQI (0-100+)
    europeanLabel: string       // "Dobrá", "Mierna", "Stredná", "Zlá", "Veľmi zlá"
    europeanColor: string       // hex pre badge
    pm25: number | null         // µg/m³
    pm10: number | null         // µg/m³
    rada: string                // odporúčanie pre dnešný deň
  } | null
}

// ─── WMO weather code → emoji + popis ─────────────────────────────────────
function weatherInfo(code: number, isDay: boolean): { emoji: string; popis: string } {
  // https://open-meteo.com/en/docs (WMO Weather interpretation codes)
  const map: Record<number, { day: { e: string; p: string }; night: { e: string; p: string } }> = {
    0:  { day: { e: '☀️', p: 'Jasno' },                night: { e: '🌙', p: 'Jasno' } },
    1:  { day: { e: '🌤️', p: 'Slnečno' },              night: { e: '🌙', p: 'Jasno' } },
    2:  { day: { e: '⛅', p: 'Polooblačno' },           night: { e: '☁️', p: 'Polooblačno' } },
    3:  { day: { e: '☁️', p: 'Zamračené' },             night: { e: '☁️', p: 'Zamračené' } },
    45: { day: { e: '🌫️', p: 'Hmla' },                  night: { e: '🌫️', p: 'Hmla' } },
    48: { day: { e: '🌫️', p: 'Inovať' },                night: { e: '🌫️', p: 'Inovať' } },
    51: { day: { e: '🌦️', p: 'Mrholenie' },             night: { e: '🌦️', p: 'Mrholenie' } },
    53: { day: { e: '🌦️', p: 'Mrholenie' },             night: { e: '🌦️', p: 'Mrholenie' } },
    55: { day: { e: '🌧️', p: 'Husté mrholenie' },       night: { e: '🌧️', p: 'Husté mrholenie' } },
    61: { day: { e: '🌦️', p: 'Slabý dážď' },            night: { e: '🌧️', p: 'Slabý dážď' } },
    63: { day: { e: '🌧️', p: 'Dážď' },                  night: { e: '🌧️', p: 'Dážď' } },
    65: { day: { e: '🌧️', p: 'Silný dážď' },            night: { e: '🌧️', p: 'Silný dážď' } },
    71: { day: { e: '🌨️', p: 'Slabé sneženie' },        night: { e: '🌨️', p: 'Slabé sneženie' } },
    73: { day: { e: '🌨️', p: 'Sneženie' },              night: { e: '🌨️', p: 'Sneženie' } },
    75: { day: { e: '❄️', p: 'Husté sneženie' },        night: { e: '❄️', p: 'Husté sneženie' } },
    77: { day: { e: '❄️', p: 'Snehové zrnká' },         night: { e: '❄️', p: 'Snehové zrnká' } },
    80: { day: { e: '🌦️', p: 'Prehánky' },              night: { e: '🌧️', p: 'Prehánky' } },
    81: { day: { e: '🌧️', p: 'Prehánky' },              night: { e: '🌧️', p: 'Prehánky' } },
    82: { day: { e: '⛈️', p: 'Silné prehánky' },        night: { e: '⛈️', p: 'Silné prehánky' } },
    85: { day: { e: '🌨️', p: 'Snehové prehánky' },      night: { e: '🌨️', p: 'Snehové prehánky' } },
    86: { day: { e: '❄️', p: 'Silné snehové prehánky' }, night: { e: '❄️', p: 'Silné snehové prehánky' } },
    95: { day: { e: '⛈️', p: 'Búrka' },                 night: { e: '⛈️', p: 'Búrka' } },
    96: { day: { e: '⛈️', p: 'Búrka s krúpami' },       night: { e: '⛈️', p: 'Búrka s krúpami' } },
    99: { day: { e: '⛈️', p: 'Silná búrka' },           night: { e: '⛈️', p: 'Silná búrka' } },
  }
  const entry = map[code]
  if (!entry) return { emoji: '❓', popis: 'Neznáme' }
  const v = isDay ? entry.day : entry.night
  return { emoji: v.e, popis: v.p }
}

// ─── European AQI → label + farba + odporúčanie ───────────────────────────
function aqiLabel(aqi: number): { label: string; color: string; rada: string } {
  // EAQI škála 0-100+
  if (aqi <= 20)  return { label: 'Veľmi dobrá', color: '#2E7D32', rada: 'Ideálne na pobyt vonku a šport.' }
  if (aqi <= 40)  return { label: 'Dobrá',       color: '#558B2F', rada: 'Bezpečné na šport a aktivity vonku.' }
  if (aqi <= 60)  return { label: 'Stredná',     color: '#F9A825', rada: 'Citlivé osoby (deti, astmatici) by mali obmedziť intenzívny šport vonku.' }
  if (aqi <= 80)  return { label: 'Zlá',         color: '#EF6C00', rada: 'Obmedzte dlhý pobyt vonku, hlavne deti a seniori.' }
  if (aqi <= 100) return { label: 'Veľmi zlá',   color: '#C62828', rada: 'Vyhnite sa pobytu vonku, nevyvetrávajte v špičke.' }
  return { label: 'Extrémne zlá', color: '#6A1B9A', rada: 'Zostaňte v interiéri, použite respirátor pri nutnom výjazde.' }
}

// ─── Cache modulu ────────────────────────────────────────────────────────
type CacheEntry = { data: WeatherSnapshot; expiresAt: number }
const cache = new Map<string, CacheEntry>()

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`
}

// ─── Hook ────────────────────────────────────────────────────────────────
export function useWeather(lat: number, lng: number) {
  const [data, setData] = useState<WeatherSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (force = false) => {
    const key = cacheKey(lat, lng)
    if (!force) {
      const cached = cache.get(key)
      if (cached && cached.expiresAt > Date.now()) {
        setData(cached.data)
        setLoading(false)
        return
      }
    }
    setLoading(true)
    setError(null)
    try {
      const snapshot = await fetchWeather(lat, lng)
      cache.set(key, { data: snapshot, expiresAt: Date.now() + CACHE_MS })
      setData(snapshot)
    } catch (e: any) {
      setError(e?.message ?? 'Chyba pri načítaní počasia')
    } finally {
      setLoading(false)
    }
  }, [lat, lng])

  useEffect(() => { load() }, [load])

  const refresh = useCallback(() => load(true), [load])

  return { data, loading, error, refresh }
}

// ─── Fetch + parse ────────────────────────────────────────────────────────
async function fetchWeather(lat: number, lng: number): Promise<WeatherSnapshot> {
  // 1. Forecast (current + hourly 24h + daily 7d)
  const forecastUrl =
    `${FORECAST_API}?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m` +
    `&hourly=temperature_2m,weather_code,precipitation,precipitation_probability` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset` +
    `&timezone=Europe%2FBratislava&forecast_days=7`

  const fRes = await fetch(forecastUrl)
  if (!fRes.ok) throw new Error('Open-Meteo forecast vrátil ' + fRes.status)
  const f = await fRes.json()

  const current = f.current
  const isDay = current.is_day === 1
  const cur = weatherInfo(current.weather_code, isDay)

  // Hourly — vyber nasledujúcich 24 hodín od aktuálneho času
  const nowIso = current.time as string
  const hourlyTimes: string[] = f.hourly.time
  const startIdx = Math.max(0, hourlyTimes.findIndex((t: string) => t >= nowIso))
  const hourly = []
  for (let i = startIdx; i < Math.min(startIdx + 24, hourlyTimes.length); i++) {
    const code = f.hourly.weather_code[i]
    const w = weatherInfo(code, true) // zjednodušene — emoji rovnako pre deň
    hourly.push({
      cas: hourlyTimes[i],
      teplota: Math.round(f.hourly.temperature_2m[i]),
      kod: code,
      emoji: w.emoji,
      zrazky: f.hourly.precipitation[i] ?? 0,
      pravdepodobnostZrazok: f.hourly.precipitation_probability?.[i] ?? 0,
    })
  }

  // Daily — 7 dní
  const daily = f.daily.time.map((datum: string, i: number) => {
    const code = f.daily.weather_code[i]
    const w = weatherInfo(code, true)
    return {
      datum,
      teplotaMax: Math.round(f.daily.temperature_2m_max[i]),
      teplotaMin: Math.round(f.daily.temperature_2m_min[i]),
      kod: code,
      emoji: w.emoji,
      popis: w.popis,
      zrazky: f.daily.precipitation_sum[i] ?? 0,
      pravdepodobnostZrazok: f.daily.precipitation_probability_max?.[i] ?? 0,
      vychod: f.daily.sunrise[i],
      zapad: f.daily.sunset[i],
    }
  })

  // 2. Air Quality — best-effort, ak zlyhá, vrátime null
  let aqi: WeatherSnapshot['aqi'] = null
  try {
    const aqUrl = `${AIR_QUALITY_API}?latitude=${lat}&longitude=${lng}&current=european_aqi,pm10,pm2_5&timezone=Europe%2FBratislava`
    const aRes = await fetch(aqUrl)
    if (aRes.ok) {
      const a = await aRes.json()
      const european = a.current?.european_aqi
      if (typeof european === 'number') {
        const meta = aqiLabel(european)
        aqi = {
          european: Math.round(european),
          europeanLabel: meta.label,
          europeanColor: meta.color,
          pm25: a.current?.pm2_5 ?? null,
          pm10: a.current?.pm10 ?? null,
          rada: meta.rada,
        }
      }
    }
  } catch {
    // ignore — air quality je nice-to-have
  }

  return {
    teplota: Math.round(current.temperature_2m),
    teplotaPocit: Math.round(current.apparent_temperature),
    vlhkost: Math.round(current.relative_humidity_2m),
    vietor: Math.round(current.wind_speed_10m),
    smerVietra: current.wind_direction_10m,
    zrazky: current.precipitation ?? 0,
    kod: current.weather_code,
    popis: cur.popis,
    emoji: cur.emoji,
    jeDen: isDay,
    cas: nowIso,
    hourly,
    daily,
    aqi,
  }
}

// ─── Helper exports ───────────────────────────────────────────────────────
export { aqiLabel, weatherInfo }

