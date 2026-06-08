// supabase/functions/rss-sync/index.ts
//
// Edge Function ktorá fetchne RSS feedy z WebyGroup webu obce a upsertne
// nové/zmenené položky do tabuľky `aktuality` (alebo `podujatia`, `farske_oznamy`).
//
// Deploy:
//   supabase functions deploy rss-sync --no-verify-jwt
//
// Schedule cez pg_cron (raz, manuálne v Supabase SQL editore):
//   SELECT cron.schedule(
//     'webygroup-rss-sync',
//     '*/15 * * * *',  -- každých 15 min
//     $$
//     SELECT net.http_post(
//       url := 'https://hionzftqhnxfqcegsnaj.supabase.co/functions/v1/rss-sync',
//       headers := jsonb_build_object(
//         'Authorization', 'Bearer ' || (SELECT setting FROM cron.master_settings WHERE name = 'service_role_key'),
//         'Content-Type', 'application/json'
//       ),
//       body := '{}'::jsonb
//     ) AS request_id;
//     $$
//   );
//
// Manuálne volanie pre testovanie:
//   curl -X POST https://hionzftqhnxfqcegsnaj.supabase.co/functions/v1/rss-sync \
//     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

// deno-lint-ignore-file no-explicit-any
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { parse as parseXml } from 'jsr:@libs/xml@5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Konfigurácia: ktoré RSS feedy syncujeme a kam mapujeme ────────────
// Pre nasadenie pre inú obec: zmeň feed URL.
type FeedConfig = {
  url: string
  kind: 'aktuality' | 'podujatia' | 'farske_oznamy'
  defaultKategoria?: string
}

const FEEDS: FeedConfig[] = [
  {
    url: 'https://www.vycapy-opatovce.sk/get_rss.php?id=1_atom_1395',
    kind: 'aktuality',
    defaultKategoria: 'oznam',
  },
  {
    url: 'https://www.vycapy-opatovce.sk/get_rss.php?id=1_atom_3212',
    kind: 'aktuality',
    defaultKategoria: 'oznam',  // úradná tabuľa
  },
  {
    url: 'https://www.vycapy-opatovce.sk/get_rss.php?id=3_atom',
    kind: 'podujatia',
  },
  {
    url: 'https://www.vycapy-opatovce.sk/get_rss.php?id=1_atom_16042',
    kind: 'farske_oznamy',
  },
]

// ─── Helpery ─────────────────────────────────────────────────────────────

/** Vyber text z XML poľa ktoré môže byť string alebo objekt s @text. */
function xText(v: any): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object') {
    if (typeof v['#text'] === 'string') return v['#text']
    if (typeof v['@'] === 'string') return v['@']
  }
  return ''
}

/** Strip HTML tagov z popisu. */
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
}

/** Vyber prvých N znakov ako perex. */
function makePerex(body: string, max: number = 200): string {
  const clean = stripHtml(body)
  return clean.length > max ? clean.slice(0, max) + '…' : clean
}

/** Detect kategórie z titulku (pre úradnú tabuľu / oznamy). */
function detectKategoria(title: string, defaultKat: string = 'oznam'): string {
  const t = title.toLowerCase()
  if (t.includes('uzávierka') || t.includes('uzavierka')) return 'uzavierka'
  if (t.includes('výpadok') || t.includes('vypadok')) return 'vypadok'
  if (t.includes('pozvánka') || t.includes('akcia') || t.includes('podujatie')) return 'akcia'
  if (t.includes('zápas') || t.includes('futbal') || t.includes('šport')) return 'sport'
  return defaultKat
}

// ─── RSS parsing ─────────────────────────────────────────────────────────

type ParsedItem = {
  external_id: string
  title: string
  body: string
  perex: string
  pub_date?: string
  cover_url?: string
}

async function fetchAndParseFeed(url: string): Promise<ParsedItem[]> {
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'VycapyApp-RSS-Sync/1.0' },
  })
  if (!resp.ok) throw new Error(`Feed ${url} returned ${resp.status}`)
  const xml = await resp.text()

  let parsed: any
  try {
    parsed = parseXml(xml)
  } catch (e) {
    throw new Error(`XML parse error: ${(e as Error).message}`)
  }

  // Atom feed format: <feed><entry>...</entry></feed>
  // RSS 2.0 format: <rss><channel><item>...</item></channel></rss>
  const entries: any[] = []

  if (parsed.feed?.entry) {
    const arr = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry]
    arr.forEach((e: any) => entries.push({
      id: xText(e.id),
      title: xText(e.title),
      content: xText(e.content) || xText(e.summary),
      published: xText(e.published) || xText(e.updated),
      link: typeof e.link === 'object' ? e.link['@href'] || xText(e.link) : xText(e.link),
    }))
  } else if (parsed.rss?.channel?.item) {
    const arr = Array.isArray(parsed.rss.channel.item)
      ? parsed.rss.channel.item
      : [parsed.rss.channel.item]
    arr.forEach((it: any) => entries.push({
      id: xText(it.guid) || xText(it.link),
      title: xText(it.title),
      content: xText(it.description),
      published: xText(it.pubDate),
      link: xText(it.link),
    }))
  }

  return entries.map(e => ({
    external_id: e.link || e.id,
    title: stripHtml(e.title),
    body: e.content || '',
    perex: makePerex(e.content || ''),
    pub_date: e.published,
  }))
}

// ─── Upsert do DB ────────────────────────────────────────────────────────

async function syncAktuality(
  supabase: any,
  items: ParsedItem[],
  defaultKat: string,
): Promise<{ novych: number; aktualizovanych: number }> {
  let novych = 0
  let aktualizovanych = 0
  const now = new Date().toISOString()

  for (const item of items) {
    // Skontroluj či už existuje (cez external_id)
    const { data: existing } = await supabase
      .from('aktuality')
      .select('id, body, title')
      .eq('external_id', item.external_id)
      .maybeSingle()

    const record = {
      external_id: item.external_id,
      title: item.title,
      perex: item.perex || null,
      body: item.body || item.title,
      kategoria: detectKategoria(item.title, defaultKat),
      source: 'webygroup',
      synced_at: now,
      is_published: true,
      published_at: item.pub_date || now,
    }

    if (existing) {
      // Aktualizuj iba ak sa zmenil obsah
      if (existing.body !== record.body || existing.title !== record.title) {
        await supabase.from('aktuality').update(record).eq('id', existing.id)
        aktualizovanych++
      }
    } else {
      await supabase.from('aktuality').insert(record)
      novych++
    }
  }

  return { novych, aktualizovanych }
}

async function syncPodujatia(supabase: any, items: ParsedItem[]) {
  let novych = 0
  let aktualizovanych = 0
  const now = new Date().toISOString()

  for (const item of items) {
    const { data: existing } = await supabase
      .from('podujatia')
      .select('id, title')
      .eq('external_id', item.external_id)
      .maybeSingle()

    // Pre podujatia potrebujeme datum_od — parsujeme z titulku alebo nastavíme dnes+30 dní
    const datumOd = item.pub_date || now

    const record = {
      external_id: item.external_id,
      title: item.title,
      popis: item.body || null,
      kategoria: 'ine',
      datum_od: datumOd,
      source: 'webygroup',
      synced_at: now,
      is_published: true,
      publish_at: now,
    }

    if (existing) {
      if (existing.title !== record.title) {
        await supabase.from('podujatia').update(record).eq('id', existing.id)
        aktualizovanych++
      }
    } else {
      await supabase.from('podujatia').insert(record)
      novych++
    }
  }
  return { novych, aktualizovanych }
}

async function syncFarskeOznamy(supabase: any, items: ParsedItem[]) {
  let novych = 0
  const now = new Date().toISOString()

  for (const item of items) {
    const { data: existing } = await supabase
      .from('farske_oznamy')
      .select('id')
      .eq('external_id', item.external_id)
      .maybeSingle()

    if (existing) continue // smútočné oznamy nemeníme

    await supabase.from('farske_oznamy').insert({
      external_id: item.external_id,
      typ: 'smutok',  // RSS smútočných oznamov
      nazov: item.title,
      popis: item.body,
      source: 'webygroup',
      synced_at: now,
      je_aktivny: true,
    })
    novych++
  }
  return { novych, aktualizovanych: 0 }
}

// ─── Main handler ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const startTime = Date.now()
  const results: any[] = []
  let totalNovych = 0
  let totalAktualizovanych = 0
  let totalChyba = 0

  for (const feed of FEEDS) {
    const feedStart = Date.now()
    try {
      const items = await fetchAndParseFeed(feed.url)
      let result: { novych: number; aktualizovanych: number }
      if (feed.kind === 'aktuality') {
        result = await syncAktuality(supabase, items, feed.defaultKategoria ?? 'oznam')
      } else if (feed.kind === 'podujatia') {
        result = await syncPodujatia(supabase, items)
      } else {
        result = await syncFarskeOznamy(supabase, items)
      }
      totalNovych += result.novych
      totalAktualizovanych += result.aktualizovanych

      // Log
      await supabase.from('rss_sync_log').insert({
        feed_url: feed.url,
        feed_kind: feed.kind,
        pocet_novych: result.novych,
        pocet_aktualizovanych: result.aktualizovanych,
        pocet_chyba: 0,
        trvanie_ms: Date.now() - feedStart,
      })
      results.push({ feed: feed.kind, ...result, ms: Date.now() - feedStart })
    } catch (e) {
      totalChyba++
      const chyba = (e as Error).message
      await supabase.from('rss_sync_log').insert({
        feed_url: feed.url,
        feed_kind: feed.kind,
        pocet_chyba: 1,
        trvanie_ms: Date.now() - feedStart,
        chyba,
      })
      results.push({ feed: feed.kind, error: chyba })
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      trvanie_ms: Date.now() - startTime,
      celkom_novych: totalNovych,
      celkom_aktualizovanych: totalAktualizovanych,
      celkom_chyba: totalChyba,
      details: results,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
