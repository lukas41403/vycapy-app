/**
 * Marta — AI referentka Obecného úradu Výčapy-Opatovce.
 *
 * ⚠️  BEZPEČNOSTNÉ UPOZORNENIE:
 * EXPO_PUBLIC_* premenné sú zabalené do JS bundle a viditeľné komukoľvek,
 * kto si appku rozbalí (Android APK, iOS IPA, web). Pre verejnú produkciu
 * presmeruj tento fetch cez Supabase Edge Function alebo Vercel proxy,
 * ktorá kľúč drží na serveri. Pre demo a interné testovanie je súčasné
 * riešenie OK.
 *
 * Setup:
 *   1. Pridať do .env: EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
 *   2. .env musí byť v .gitignore (zvyčajne už je)
 *   3. Reštartnúť Expo so `npx expo start -c` aby Metro načítal premenné
 */

import { supabase } from './supabase'

const SYSTEM_PROMPT = `Si Marta, AI referentka Obecného úradu vo Výčapoch-Opatovciach.
Odpovedáš po slovensky, priateľsky a stručne. Pomáhaš občanom s informáciami o obci.

OBECNÝ ÚRAD:
- Adresa: Výčapská 467/14, 951 44 Výčapy-Opatovce
- Telefón: 037 / 77 951 51
- Email: info@vycapy-opatovce.sk
- Web: www.vycapy-opatovce.sk

ÚRADNÉ HODINY OBCE:
- Pondelok: 7:30–12:00, 12:30–16:00
- Utorok: 7:30–12:00, 12:30–15:30
- Streda: 7:30–12:00, 12:30–17:00
- Štvrtok: NESTRÁNKOVÝ DEŇ
- Piatok: 7:30–12:00

ZAMESTNANCI OBCE:
- Starosta: Ing. Jozef Holúbek, tel: 0907 167 383
- Prednostka: Ing. Jarmila Bernátová, tel: 0908 726 873
- Účtovníčka: Bc. Dáša Dávidová, tel: 0904 617 009
- Referentky: Ing. Lucia Augustíneková, Mgr. Lujza Balková, tel: 037/77 951 51

ZDRAVOTNÍCKE STREDISKO (Výčapská 472/2):
- MUDr. Jozef Kolenčík – všeobecný lekár pre dospelých, tel: 037/77 950 46
  Po 7-11, Ut 11-16, St 7-11, Št 11-14, Pi 10-12 (v ostatnom čase ordinuje v Dolných Lefantovciach)
- MUDr. Viera Uramová – detský lekár, tel: 037/77 950 48, mobil: 0905 964 255
- MUDr. Alžbeta Knoteková – zubná ambulancia, mobil: 0911 116 222 (Po-Št 7:15-15:30, Pi 7-14)
- MUDr. Mária Kubalová – gynekológia, mobil: 0915 737 926 (len streda 7-15)

LEKÁREŇ Sv. CYRILA a METODA (Výčapská 480/8):
- Tel: 037/77 952 03, Vedúca: RNDr. Darina Janoušková
- Otvorené Po-Pia 8:00-14:00

VETERINÁRNA AMBULANCIA (Výčapská 470/10, v budove pošty):
- MVDr. Slavomíra Kunová, tel: 0918 699 956
- Variabilný rozvrh — aktuálny rozvrh na Facebooku alebo telefón
- V prípade potreby ošetrenie aj v domácnosti

POŠTA VÝČAPY-OPATOVCE (Výčapská 470/10):
- Tel: 037/77 951 20, Vedúca: Mária Lapšanská
- Po, Ut, Št, Pi: 7:15-12:00, 12:30-14:30
- Streda: 7:15-11:00, 14:00-17:00
- Pre podržanie zásielky dlhšie ako 18 dní → zavolať priamo na poštu

FARSKÝ ÚRAD:
- Web: vycapy-opatovce.fara.sk
- Sv. omše: Po, Ut, Št, Pi 18:00, So 18:00 (s nedeľnou platnosťou), Ne 8:00 a 10:30
- Aktuálne smútočné oznamy, ohlášky, krsty a sobáše sú v sekcii "Farské oznamy" v aplikácii

ODPADOVÝ KALENDÁR 2026 (výber):
- Zmesový odpad: každé 2 týždne
- Papier: mesačne
- Plast + kovové obaly: mesačne
- Bio odpad: apríl–november každé 2 týždne
- Harmonogram: dostupný v sekcii Odpady v tejto aplikácii

PRENÁJOM HALY:
- Športová hala, kapacita až 200 osôb
- Cena: od 15€/hod pre obyvateľov obce
- Žiadosť: cez aplikáciu alebo osobne na úrade

TRVALÝ POBYT:
- Prihlásenie/odhlásenie: osobne na úrade
- Potrebné doklady: občiansky preukaz, list vlastníctva alebo súhlas vlastníka

FC VÝČAPY-OPATOVCE:
- Futbalový klub, Oblastná liga Nitra

NÚDZOVÉ KONTAKTY:
- Tiesňová linka: 112
- Záchranná služba: 155
- Polícia: 158
- Hasiči: 150
- V obci je defibrilátor (info v sekcii o obci)

Ak nevieš odpovedať, presmeruj na: info@vycapy-opatovce.sk alebo tel: 037/77 951 51.
Nikdy nevymýšľaj informácie. Buď stručná, maximálne 3-4 vety. Pre lekárov, lekáreň a poštu daj
priamo telefónne číslo aby občan mohol rovno zavolať.`

export type Rola = 'user' | 'assistant'
export type Sprava = { rola: Rola; obsah: string }

/**
 * Pošle správu Marte a vráti jej odpoveď.
 *
 * V produkcii volá Supabase Edge Function 'marta-chat' (server-side):
 *   - API kľúč je iba na serveri (bezpečné)
 *   - Edge Function má rate limit 10 dotazov/min/IP
 *
 * Fallback: ak EXPO_PUBLIC_USE_EDGE_FUNCTION=false, volá Anthropic priamo
 * (development mode, kľúč v .env).
 */
export async function opytajSaReferentky(
  sprava: string,
  historia: Sprava[],
): Promise<string> {
  const useEdge = (process.env.EXPO_PUBLIC_USE_EDGE_FUNCTION ?? 'true') !== 'false'

  if (useEdge) {
    return await opytajSaCezEdgeFunction(sprava, historia)
  }
  return await opytajSaPrimoAnthropic(sprava, historia)
}

// ─── Edge Function (PRODUKČNÁ cesta) ────────────────────────────────────
async function opytajSaCezEdgeFunction(sprava: string, historia: Sprava[]): Promise<string> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Chýba SUPABASE_URL alebo SUPABASE_ANON_KEY v .env')
  }

  let response: Response
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/marta-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ sprava, historia }),
    })
  } catch (e: any) {
    throw new Error('Sieťová chyba: ' + (e?.message ?? 'fetch zlyhal'))
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Príliš veľa otázok naraz. Skúste o chvíľu.')
    }
    throw new Error(data?.error ?? `Marta nie je dostupná (${response.status})`)
  }
  if (typeof data?.odpoved !== 'string') {
    throw new Error('Neočakávaný formát odpovede od Edge Function')
  }
  return data.odpoved
}

// ─── Priame volanie Anthropic (DEV cesta — kľúč v JS bundle) ─────────────
async function opytajSaPrimoAnthropic(sprava: string, historia: Sprava[]): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error(
      'Chýba API kľúč. Nastavte EXPO_PUBLIC_ANTHROPIC_API_KEY v .env súbore a reštartujte Expo cez `npx expo start -c`.',
    )
  }

  let response: Response
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: process.env.EXPO_PUBLIC_ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [
          ...historia.map(h => ({ role: h.rola, content: h.obsah })),
          { role: 'user', content: sprava },
        ],
      }),
    })
  } catch (e: any) {
    throw new Error('Sieťová chyba: ' + (e?.message ?? 'fetch zlyhal'))
  }

  if (!response.ok) {
    let detail = ''
    try {
      const err = await response.json()
      detail = err?.error?.message ?? err?.message ?? JSON.stringify(err)
    } catch {
      detail = await response.text().catch(() => '')
    }
    throw new Error(`API chyba (${response.status}): ${detail || 'neznáma'}`)
  }

  const data = await response.json()
  const text = data?.content?.[0]?.text
  if (typeof text !== 'string') {
    throw new Error('API vrátil neočakávaný formát odpovede.')
  }
  return text.trim()
}

/**
 * Uloží správu do tabuľky ai_konverzacie. Chyby logujeme ale nezhodíme
 * UI — keď DB nie je dostupná, chat stále funguje.
 */
export async function ulozKonverzaciu(
  session_id: string,
  rola: Rola,
  obsah: string,
) {
  try {
    await supabase.from('ai_konverzacie').insert({ session_id, rola, obsah })
  } catch {
    // tichá chyba — chat sa neprerušuje
  }
}

/** Náhodný session_id pre jednu inštanciu chatu. */
export function generujSessionId(): string {
  // Jednoduchý random ID, stačí pre rozlíšenie konverzácií v DB.
  return (
    'sess_' +
    Date.now().toString(36) +
    '_' +
    Math.random().toString(36).slice(2, 10)
  )
}
