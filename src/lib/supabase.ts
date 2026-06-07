/**
 * Supabase klient.
 *
 * SSR poznámka: Expo Router web export môže pri „static" outpute spustiť
 * tento súbor v Node.js prostredí, ktoré nemá natívny WebSocket. Supabase
 * Realtime sa pri instanciácii pokúša WebSocket vytvoriť → crash.
 *
 * Riešenia (oba aplikované):
 *   1. web.output: "single" v app.json (SPA — žiadne SSR)
 *   2. WebSocket polyfill cez `ws` package keď global WebSocket chýba
 */

import { createClient } from '@supabase/supabase-js'
import { createDemoClient } from './demoSupabase'

// ── WebSocket polyfill pre Node.js SSR ────────────────────────────────────
// V prehliadači aj v React Native existuje globálny WebSocket.
// V Node.js < 22 chýba, čo crashne Supabase Realtime.
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).WebSocket === 'undefined') {
  try {
    // `ws` je v dependencies (^8.20.1). Require ho len v Node prostredí —
    // Metro/Webpack ho do client bundlu nezahŕňa, lebo `globalThis.WebSocket`
    // je v RN/web vždy definovaný a táto vetva sa nikdy nespustí.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ws = require('ws')
    ;(globalThis as any).WebSocket = ws.WebSocket || ws
  } catch {
    // ws nie je dostupné — DB operácie (REST) stále fungujú,
    // len realtime subscriptions by neboli k dispozícii.
  }
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

/**
 * Demo režim — keď chýba Supabase konfigurácia, appka nepadne, ale beží
 * s lokálnymi ukážkovými dátami (viď demoSupabase.ts). V produkcii sú env
 * premenné nastavené, takže sa použije reálny klient.
 */
export const isDemoMode = !supabaseUrl || !supabaseAnonKey

export const supabase = isDemoMode
  ? createDemoClient()
  : createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })

if (isDemoMode && __DEV__) {
  console.log('[supabase] Demo režim — EXPO_PUBLIC_SUPABASE_URL/ANON_KEY nie sú nastavené, používam ukážkové dáta.')
}
