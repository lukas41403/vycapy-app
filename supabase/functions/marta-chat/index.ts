// supabase/functions/marta-chat/index.ts
//
// Edge Function ktorá volá Anthropic API z servera — kľúč nie je v JS bundle.
//
// Deploy:
//   1. Nainštaluj Supabase CLI: npm i -g supabase
//   2. supabase login
//   3. supabase link --project-ref hionzftqhnxfqcegsnaj
//   4. supabase secrets set ANTHROPIC_API_KEY="sk-ant-…"
//   5. supabase functions deploy marta-chat --no-verify-jwt
//
// Volanie z appky (referentka.ts):
//   POST {SUPABASE_URL}/functions/v1/marta-chat
//   Body: { sprava: string, historia: Sprava[] }
//   Headers: Authorization: Bearer <anon_key>

// deno-lint-ignore-file no-explicit-any
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Sanitize secrets — odstráni whitespace a non-ASCII znaky ktoré sa občas
// vlúdia pri kopírovaní cez terminal (smart quotes, mäkké medzery, …)
function sanitize(s: string | undefined): string {
  if (!s) return ''
  return s
    .trim()                          // odstráň whitespace na začiatku/konci
    .replace(/\s+/g, '')             // odstráň všetky vnútorné whitespace
    .replace(/[^\x20-\x7E]/g, '')    // ponechaj iba ASCII printable znaky
}

const ANTHROPIC_API_KEY = sanitize(Deno.env.get('ANTHROPIC_API_KEY'))
const ANTHROPIC_MODEL = sanitize(Deno.env.get('ANTHROPIC_MODEL')) || 'claude-sonnet-4-5-20250929'

// CORS hlavičky pre volania z mobilnej / web appky
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// System prompt — DRY rešpektuje ten v referentka.ts
// Pri zmene aktualizuj obe miesta alebo presuň do sharované umiestnenia.
const SYSTEM_PROMPT = `Si Marta, AI referentka Obecného úradu vo Výčapoch-Opatovciach.
Odpovedáš po slovensky, priateľsky a stručne. Pomáhaš občanom s informáciami o obci.

OBECNÝ ÚRAD:
- Adresa: Výčapská 467/14, 951 44 Výčapy-Opatovce
- Telefón: 037 / 77 951 51
- Email: info@vycapy-opatovce.sk

ÚRADNÉ HODINY:
- Pondelok 7:30-16:00, Utorok 7:30-15:30, Streda 7:30-17:00
- Štvrtok NESTRÁNKOVÝ DEŇ, Piatok 7:30-12:00

ZDRAVOTNÍCKE STREDISKO (Výčapská 472/2):
- MUDr. Jozef Kolenčík - všeobecný lekár pre dospelých, tel: 037/77 950 46
- MUDr. Viera Uramová - detský lekár, tel: 037/77 950 48, mobil: 0905 964 255
- MUDr. Alžbeta Knoteková - zubná, mobil: 0911 116 222
- MUDr. Mária Kubalová - gynekológia, mobil: 0915 737 926

LEKÁREŇ Sv. Cyrila a Metoda: Výčapská 480/8, tel: 037/77 952 03, Po-Pia 8-14

POŠTA: Výčapská 470/10, tel: 037/77 951 20, Mária Lapšanská
- Po, Ut, Št, Pi: 7:15-12:00, 12:30-14:30
- Streda: 7:15-11:00, 14:00-17:00
- Pre podržanie zásielky volajte priamo na poštu

VETERINÁRNA AMBULANCIA: MVDr. Slavomíra Kunová, mobil: 0918 699 956
- Adresa: Výčapská 470/10 (budova pošty)

ODPADOVÝ KALENDÁR:
- Zmesový odpad: každé 2 týždne
- Plast: mesačne, Papier: mesačne
- Bio odpad: apríl-november každé 2 týždne

ŠPORTOVÁ HALA: prenájom od 15€/hod, žiadosť cez aplikáciu

NÚDZA: 112, Záchranka 155, Polícia 158, Hasiči 150

Ak nevieš odpovedať, presmeruj na info@vycapy-opatovce.sk alebo 037/77 951 51.
Nikdy nevymýšľaj. Maximálne 3-4 vety. Pri lekároch a inštitúciách daj priamo
telefónne číslo aby občan mohol rovno zavolať.`

// ─── Rate limit cez Supabase tabuľku marta_rate_limit ───────────────────
// Schema:
//   create table marta_rate_limit (
//     identifier text not null,        -- IP alebo client_id
//     window_start timestamptz not null default now(),
//     pocet int not null default 1,
//     primary key (identifier)
//   );
async function checkRateLimit(
  supabase: any,
  identifier: string,
  maxPerMinute: number = 10,
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const now = new Date()
    const windowStart = new Date(now.getTime() - 60_000) // 60s window

    // Reset window ak je staršie ako 1 min
    const { data: existing, error: selErr } = await supabase
      .from('marta_rate_limit')
      .select('window_start, pocet')
      .eq('identifier', identifier)
      .maybeSingle()

    // Ak tabuľka neexistuje, defenzívne pustíme request a pustíme upozornenie
    if (selErr) {
      console.warn('[marta-chat] rate-limit table missing or error:', selErr.message)
      return { allowed: true, remaining: maxPerMinute }
    }

    if (!existing) {
      await supabase.from('marta_rate_limit').upsert({
        identifier,
        window_start: now.toISOString(),
        pocet: 1,
      })
      return { allowed: true, remaining: maxPerMinute - 1 }
    }

    const win = new Date(existing.window_start)
    if (win < windowStart) {
      await supabase.from('marta_rate_limit').upsert({
        identifier,
        window_start: now.toISOString(),
        pocet: 1,
      })
      return { allowed: true, remaining: maxPerMinute - 1 }
    }

    if (existing.pocet >= maxPerMinute) {
      return { allowed: false, remaining: 0 }
    }

    await supabase.from('marta_rate_limit')
      .update({ pocet: existing.pocet + 1 })
      .eq('identifier', identifier)

    return { allowed: true, remaining: maxPerMinute - existing.pocet - 1 }
  } catch (e) {
    console.warn('[marta-chat] rate-limit unexpected error:', (e as Error).message)
    // Defenzívne — pustíme cez, ale logneme
    return { allowed: true, remaining: maxPerMinute }
  }
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY.length < 20) {
    return new Response(
      JSON.stringify({
        error: 'Server misconfigured: ANTHROPIC_API_KEY chýba alebo má neplatný formát.',
        hint: 'Nastavte cez Supabase Dashboard → Edge Functions → Secrets (bezpečnejšie než CLI).',
        key_length: ANTHROPIC_API_KEY.length,
        key_prefix: ANTHROPIC_API_KEY.slice(0, 10) + '...',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
  if (!ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    return new Response(
      JSON.stringify({
        error: 'ANTHROPIC_API_KEY nezačína "sk-ant-" — pravdepodobne zlý kľúč.',
        key_prefix: ANTHROPIC_API_KEY.slice(0, 15),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  try {
    const body = await req.json()
    const { sprava, historia = [] } = body as { sprava: string; historia: any[] }

    if (typeof sprava !== 'string' || sprava.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or empty sprava' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (sprava.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Sprava prílis dlhá (max 2000 znakov)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Rate limit — IP-based
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    const { allowed, remaining } = await checkRateLimit(supabase, ip, 10)

    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'Príliš veľa požiadaviek. Skúste znova za chvíľu.',
          rate_limit_remaining: 0,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Volanie Anthropic API
    const aResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [
          ...historia.map((h: any) => ({ role: h.rola, content: h.obsah })),
          { role: 'user', content: sprava },
        ],
      }),
    })

    if (!aResp.ok) {
      const errBody = await aResp.text().catch(() => '')
      console.error('Anthropic API error', aResp.status, errBody)
      return new Response(
        JSON.stringify({
          error: `Marta nie je dostupná (${aResp.status})`,
          anthropic_status: aResp.status,
          anthropic_error: errBody.slice(0, 500),
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const data = await aResp.json()
    const text = data?.content?.[0]?.text
    if (typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Neočakávaný formát odpovede' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        odpoved: text.trim(),
        rate_limit_remaining: remaining,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    const err = e as Error
    console.error('marta-chat error', err.name, err.message, err.stack)
    return new Response(
      JSON.stringify({
        error: 'Interná chyba servera',
        debug_name: err.name,
        debug_message: err.message?.slice(0, 500),
        // V produkcii toto vymaž — pre teraz dáva visibility čo zlyhá
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
