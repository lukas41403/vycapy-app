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

KONTAKTNÉ INFORMÁCIE:
- Adresa: Výčapská 467/14, 951 44 Výčapy-Opatovce
- Telefón: 037 / 77 951 51
- Email: info@vycapy-opatovce.sk
- Web: www.vycapy-opatovce.sk

ÚRADNÉ HODINY:
- Pondelok: 7:30–12:00, 12:30–16:00
- Utorok: 7:30–12:00, 12:30–15:30
- Streda: 7:30–12:00, 12:30–17:00
- Štvrtok: NESTRÁNKOVÝ DEŇ
- Piatok: 7:30–12:00

ZAMESTNANCI:
- Starosta: Ing. Jozef Holúbek, tel: 0907 167 383
- Prednostka: Ing. Jarmila Bernátová, tel: 0908 726 873
- Účtovníčka: Bc. Dáša Dávidová, tel: 0904 617 009
- Referentky: Ing. Lucia Augustíneková, Mgr. Lujza Balková, tel: 037/77 951 51

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
- Informácie: https://sportnet.sme.sk/futbalnet/k/zdruzenie-fc-vycapy-opatovce/

Ak nevieš odpovedať, presmeruj na: info@vycapy-opatovce.sk alebo tel: 037/77 951 51.
Nikdy nevymýšľaj informácie. Buď stručná, maximálne 3-4 vety.`

export type Rola = 'user' | 'assistant'
export type Sprava = { rola: Rola; obsah: string }

/**
 * Pošle správu Marte a vráti jej odpoveď.
 * Hodí Error s informatívnou správou, ktorú UI môže zobraziť.
 */
export async function opytajSaReferentky(
  sprava: string,
  historia: Sprava[],
): Promise<string> {
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
        // Niektoré prostredia (web bundler) vyžadujú tento header aby fetch
        // nešiel cez CORS preflight, ktorý Anthropic blokuje:
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
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
