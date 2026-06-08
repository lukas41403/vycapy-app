/**
 * Zdieľanie obsahu — wrapper okolo React Native Share API.
 *
 * Použitie:
 *   import { zdielajAktualitu, zdielajPodujatie } from '@/src/lib/share'
 *   await zdielajAktualitu({ id: '...', title: '...', perex: '...' })
 *
 * Funguje:
 *   - iOS: natívny share sheet (SMS, Mail, Telegram, …)
 *   - Android: chooser dialóg
 *   - Web: Web Share API ak je dostupné, fallback na clipboard
 *
 * Deep linking:
 *   Appka má scheme `vycapyapp://` (z app.json). Linky vyzerajú:
 *     vycapyapp://aktualita/{id}
 *     vycapyapp://podujatie/{id}
 *   Ak používateľ nemá appku, môžeme pridať universal link fallback
 *   na web obce — to ale zatiaľ nie je natívne.
 */

import { Share, Platform } from 'react-native'

const APP_SCHEME = 'vycapyapp'  // z app.json

export type ShareInput = {
  title: string
  message: string
  url?: string
}

/** Generic share — vytvorí share sheet. */
export async function zdielaj(input: ShareInput): Promise<boolean> {
  try {
    const result = await Share.share(
      {
        title: input.title,
        message: input.url
          // iOS oddeľuje URL od message v iOS share sheete
          ? (Platform.OS === 'ios' ? input.message : `${input.message}\n\n${input.url}`)
          : input.message,
        url: input.url,  // iOS only
      },
      {
        dialogTitle: input.title,
        subject: input.title,  // pre email
      },
    )
    return result.action === Share.sharedAction
  } catch (e) {
    console.warn('[share] zlyhalo:', e)
    return false
  }
}

/** Zdieľať aktualitu — formátovaná správa s odkazom späť do appky. */
export async function zdielajAktualitu(aktualita: {
  id: string
  title: string
  perex?: string | null
  body?: string
}): Promise<boolean> {
  const teaser = aktualita.perex || aktualita.body?.slice(0, 200) || ''
  const teaserTrimmed = teaser.length > 200 ? teaser.slice(0, 200) + '…' : teaser

  return zdielaj({
    title: aktualita.title,
    message: `📰 ${aktualita.title}\n\n${teaserTrimmed}\n\nViac v aplikácii Výčapy-Opatovce`,
    url: `${APP_SCHEME}://aktualita/${aktualita.id}`,
  })
}

/** Zdieľať podujatie — vrátane dátumu a miesta. */
export async function zdielajPodujatie(podujatie: {
  id: string
  title: string
  datum_od: string
  miesto?: string | null
  popis?: string | null
}): Promise<boolean> {
  const datum = new Date(podujatie.datum_od).toLocaleDateString('sk-SK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const lines = [
    `🎉 ${podujatie.title}`,
    `📅 ${datum}`,
  ]
  if (podujatie.miesto) lines.push(`📍 ${podujatie.miesto}`)
  if (podujatie.popis) lines.push('', podujatie.popis.slice(0, 200))
  lines.push('', 'Detaily v aplikácii Výčapy-Opatovce')

  return zdielaj({
    title: podujatie.title,
    message: lines.join('\n'),
    url: `${APP_SCHEME}://podujatie/${podujatie.id}`,
  })
}

/** Zdieľať službu obce — kontakt + adresa. */
export async function zdielajSluzbu(sluzba: {
  nazov: string
  adresa?: string
  telefon?: string
  hodiny?: string
}): Promise<boolean> {
  const lines = [`🏥 ${sluzba.nazov}`]
  if (sluzba.adresa) lines.push(`📍 ${sluzba.adresa}`)
  if (sluzba.telefon) lines.push(`📞 ${sluzba.telefon}`)
  if (sluzba.hodiny) lines.push(`🕐 ${sluzba.hodiny}`)
  lines.push('', 'Vďaka aplikácii Výčapy-Opatovce')

  return zdielaj({
    title: sluzba.nazov,
    message: lines.join('\n'),
  })
}
