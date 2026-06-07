/**
 * Demo Supabase klient — fallback pre vývoj/náhľad bez backendu.
 *
 * Aktivuje sa IBA keď chýbajú `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY`
 * (viď src/lib/supabase.ts). V produkcii s nastaveným env sa nikdy nepoužije,
 * takže správanie nasadenej appky nemení — slúži len na to, aby sa appka dala
 * spustiť a vizuálne testovať bez živej databázy (realistický obsah namiesto
 * prázdnych obrazoviek).
 *
 * Mock query builder je chainable + thenable: metódy (.select/.eq/.order/…)
 * vracajú samé seba a `await` vráti `{ data, error: null }`. Filtre sa
 * neaplikujú — dáta sú už vopred pripravené v správnom tvare a s relatívnymi
 * dátumami, aby UI logika (dniDo, najbližší vývoz…) fungovala.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ── Pomocné: relatívne dátumy voči dnešku ─────────────────────────────────
const DAY = 24 * 60 * 60 * 1000
function inDays(days: number, hour = 9, min = 0): string {
  const d = new Date()
  d.setHours(hour, min, 0, 0)
  return new Date(d.getTime() + days * DAY).toISOString()
}
function dateOnly(days: number): string {
  return new Date(Date.now() + days * DAY).toISOString().split('T')[0]
}

// ── Fixtures ──────────────────────────────────────────────────────────────
const AKTUALITY = [
  {
    id: 'a1',
    title: 'Plánovaný výpadok vody 22. júna',
    perex: 'Z dôvodu opráv vodovodu od 8:00 do 14:00.',
    body: 'Západoslovenská vodárenská spoločnosť oznamuje plánovaný výpadok pitnej vody. Postihnuté ulice: Hlavná, Školská, Záhradná. Náhradné zásobovanie cisternou bude pri obecnom úrade.',
    cover_url: 'https://images.unsplash.com/photo-1504016798967-59a258e9d78c?w=800&q=80',
    kategoria: 'vypadok',
    published_at: inDays(-1, 7),
    is_published: true,
  },
  {
    id: 'a2',
    title: 'Komunikácia bude opravená',
    perex: 'Hlavná ulica dostane nový asfalt v júni 2026.',
    body: 'Vážení občania, počas mesiaca jún 2026 sa uskutoční rekonštrukcia Hlavnej ulice v dvoch etapách. Žiadame o trpezlivosť a rešpektovanie dopravného značenia.',
    cover_url: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=800&q=80',
    kategoria: 'oznam',
    published_at: inDays(-2, 9),
    is_published: true,
  },
  {
    id: 'a3',
    title: 'Nové detské ihrisko pri škôlke',
    perex: 'Projekt schválený. Realizácia začína v júli.',
    body: 'Vďaka dotácii z eurofondov vznikne v areáli materskej školy nové detské ihrisko s 12 hracími prvkami. Súčasťou bude aj nový plot a okrasná zeleň.',
    cover_url: 'https://images.unsplash.com/photo-1575364289203-8b8f23ef2f4b?w=800&q=80',
    kategoria: 'akcia',
    published_at: inDays(-4, 11),
    is_published: true,
  },
  {
    id: 'a4',
    title: 'Futbalový turnaj o pohár starostu',
    perex: 'Sobota 7. júna, ihrisko TJ. Vstup voľný.',
    body: 'Pozývame všetkých na tradičný futbalový turnaj. Občerstvenie zabezpečené, pre deti sprievodný program.',
    cover_url: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80',
    kategoria: 'sport',
    published_at: inDays(-6, 12),
    is_published: true,
  },
  {
    id: 'a5',
    title: 'Zber veľkoobjemového odpadu',
    perex: 'Kontajnery pristavené 14.–16. júna pri cintoríne.',
    body: 'Obec zabezpečuje pristavenie veľkoobjemových kontajnerov. Nevhadzujte nebezpečný odpad ani pneumatiky.',
    cover_url: null,
    kategoria: 'oznam',
    published_at: inDays(-8, 10),
    is_published: true,
  },
]

const ODPADY = [
  { id: 'o1', datum: dateOnly(1),  poznamka: 'Vyložte kontajner ráno pred dom', typ: { nazov: 'Komunálny odpad', farba: '#37474F', ikona: null } },
  { id: 'o2', datum: dateOnly(5),  poznamka: 'Žlté vrecia',                      typ: { nazov: 'Plast', farba: '#F9A825', ikona: null } },
  { id: 'o3', datum: dateOnly(9),  poznamka: null,                               typ: { nazov: 'Papier', farba: '#1565C0', ikona: null } },
  { id: 'o4', datum: dateOnly(12), poznamka: 'Hnedá nádoba',                     typ: { nazov: 'Bioodpad', farba: '#2E7D32', ikona: null } },
  { id: 'o5', datum: dateOnly(16), poznamka: null,                               typ: { nazov: 'Sklo', farba: '#00838F', ikona: null } },
]

const PODUJATIA = [
  { id: 'p1', title: 'Futbalový turnaj o pohár starostu', popis: 'Tradičný turnaj amatérskych mužstiev.', kategoria: 'sport',   datum_od: inDays(1, 10), datum_do: inDays(1, 16),  miesto: 'Ihrisko TJ Výčapy', obrazok_url: null, is_published: true },
  { id: 'p2', title: 'Deň detí v parku',                  popis: 'Súťaže, skákací hrad, maľovanie na tvár.', kategoria: 'akcia', datum_od: inDays(8, 14), datum_do: inDays(8, 18),  miesto: 'Obecný park',       obrazok_url: null, is_published: true },
  { id: 'p3', title: 'Verejné zasadnutie OZ',             popis: 'Rokovanie obecného zastupiteľstva.',       kategoria: 'oznam', datum_od: inDays(15, 18), datum_do: null,          miesto: 'Sála obecného úradu', obrazok_url: null, is_published: true },
]

const TABLES: Record<string, any[]> = {
  aktuality: AKTUALITY,
  odpady_kalendar: ODPADY,
  podujatia: PODUJATIA,
}

function demoFor(table: string): any[] {
  return TABLES[table] ?? []
}

// ── Chainable + thenable mock query builder ───────────────────────────────
function makeQuery(rows: any[]): any {
  const result = { data: rows, error: null, count: rows.length, status: 200, statusText: 'OK' }
  const single = { data: rows[0] ?? null, error: null, status: 200, statusText: 'OK' }
  const handler: ProxyHandler<any> = {
    get(_t, prop) {
      if (prop === 'then') return (resolve: (v: any) => void) => resolve(result)
      if (prop === 'single' || prop === 'maybeSingle') return () => Promise.resolve(single)
      if (prop === 'csv' || prop === 'geojson') return () => Promise.resolve({ data: '', error: null })
      return () => proxy // každá ďalšia metóda je chainable
    },
  }
  const proxy: any = new Proxy({}, handler)
  return proxy
}

function makeChannel(): any {
  const ch = {
    on: () => ch,
    subscribe: () => ch,
    unsubscribe: () => Promise.resolve('ok'),
    send: () => Promise.resolve('ok'),
  }
  return ch
}

const auth = {
  getSession: async () => ({ data: { session: null }, error: null }),
  getUser: async () => ({ data: { user: null }, error: null }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  signInWithPassword: async () => ({ data: { session: null, user: null }, error: { message: 'Demo režim — prihlásenie nie je dostupné bez backendu.' } }),
  signUp: async () => ({ data: { session: null, user: null }, error: { message: 'Demo režim' } }),
  signOut: async () => ({ error: null }),
}

export function createDemoClient(): SupabaseClient {
  const client = {
    from: (table: string) => makeQuery(demoFor(table)),
    rpc: () => makeQuery([]),
    channel: () => makeChannel(),
    removeChannel: () => Promise.resolve('ok'),
    removeAllChannels: () => Promise.resolve([]),
    getChannels: () => [],
    auth,
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
        upload: async () => ({ data: null, error: { message: 'Demo režim' } }),
      }),
    },
  }
  return client as unknown as SupabaseClient
}
