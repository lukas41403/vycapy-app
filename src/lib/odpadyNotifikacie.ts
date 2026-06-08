/**
 * Lokálne push notifikácie pred vývozom odpadu.
 *
 * Princíp:
 *   - Občan otvorí appku → načítame najbližšie vývozy z DB
 *   - Pre každý vývoz naplánujeme lokálnu notifikáciu na DEŇ PRED o 18:00
 *   - Pri ďalšom otvorení appky zrušíme staré a naplánujeme znova
 *
 * Výhody oproti server-side push:
 *   - Žiadny backend / Edge Function / cron
 *   - Funguje úplne offline
 *   - Žiadny ANTHROPIC_API_KEY problém s bezpečnosťou
 *   - Zero infraštruktúra
 *
 * Defenzívne: ak expo-notifications nie je nainštalovaný, všetko tichá fallback.
 */

import { OdpadZaznam } from '../hooks/useOdpady'

// Defenzívny import — appka funguje aj bez expo-notifications
let Notifications: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications')
} catch {
  Notifications = null
}

const NOTIFICATION_HOUR = 18    // 18:00 deň pred vývozom
const NOTIFICATION_MINUTE = 0
const MAX_NOTIFICATIONS = 5      // počet vývozov dopredu na naplánovanie

/** Tag prefix pre naše notifikácie (aby sme nezrušili cudzie). */
const NOTIFICATION_TAG = 'odpad-vyvoz-'

/** Globálny flag aby sme to nespustili viackrát naraz. */
let scheduling = false

/**
 * Hlavná funkcia — zruší staré a naplánuje nové notifikácie pre vývozy odpadu.
 *
 * Bezpečne ju volaj pri každom otvorení appky alebo pri zmene odpadov.
 * Sama si overí permission a defenzívne ignoruje chyby.
 */
export async function naplanujNotifikacieOdpadu(odpady: OdpadZaznam[]): Promise<{
  naplanovane: number
  zrusene: number
} | null> {
  if (!Notifications) return null
  if (scheduling) return null
  scheduling = true

  try {
    // 1. Skontroluj permission
    const settings = await Notifications.getPermissionsAsync()
    if (settings.status !== 'granted') {
      return { naplanovane: 0, zrusene: 0 }
    }

    // 2. Zruš staré naše notifikácie (nechaj cudzie)
    const all = await Notifications.getAllScheduledNotificationsAsync()
    let zrusene = 0
    for (const n of all) {
      if (typeof n?.identifier === 'string' && n.identifier.startsWith(NOTIFICATION_TAG)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier)
        zrusene++
      }
    }

    // 3. Naplánuj nové pre najbližších N vývozov (deň pred o 18:00)
    const teraz = Date.now()
    let naplanovane = 0

    for (const odpad of odpady.slice(0, MAX_NOTIFICATIONS)) {
      const vyvozDate = new Date(odpad.datum)
      // Notifikácia o 18:00 DEŇ PRED
      const triggerDate = new Date(vyvozDate)
      triggerDate.setDate(triggerDate.getDate() - 1)
      triggerDate.setHours(NOTIFICATION_HOUR, NOTIFICATION_MINUTE, 0, 0)

      // Skontroluj že je v budúcnosti (musí byť aspoň 1 minútu)
      if (triggerDate.getTime() < teraz + 60_000) continue

      const id = NOTIFICATION_TAG + odpad.id
      const ikona = odpad.typ.ikona || '♻️'
      const nazov = odpad.typ.nazov

      try {
        await Notifications.scheduleNotificationAsync({
          identifier: id,
          content: {
            title: `${ikona} Zajtra vývoz: ${nazov}`,
            body: 'Nezabudnite vyložiť kontajner ráno pred dom.',
            data: { kind: 'odpad', odpad_id: odpad.id, typ: odpad.typ.nazov },
            sound: 'default',
          },
          trigger: {
            type: 'date',
            date: triggerDate,
          },
        })
        naplanovane++
      } catch (e) {
        // niektoré stará API očakávajú iný shape triggera — skús fallback
        try {
          await Notifications.scheduleNotificationAsync({
            identifier: id,
            content: {
              title: `${ikona} Zajtra vývoz: ${nazov}`,
              body: 'Nezabudnite vyložiť kontajner ráno pred dom.',
              data: { kind: 'odpad', odpad_id: odpad.id, typ: odpad.typ.nazov },
              sound: 'default',
            },
            trigger: triggerDate as any,
          })
          naplanovane++
        } catch {
          console.warn('[odpadyNotifikacie] scheduleNotificationAsync zlyhal:', e)
        }
      }
    }

    return { naplanovane, zrusene }
  } catch (e) {
    console.warn('[odpadyNotifikacie] zlyhalo:', e)
    return null
  } finally {
    scheduling = false
  }
}

/** Vyžiada permission od užívateľa (volá sa pri klepnutí "Zapnúť pripomienky"). */
export async function vyziadajPermissionPreOdpad(): Promise<boolean> {
  if (!Notifications) return false
  try {
    const existing = await Notifications.getPermissionsAsync()
    if (existing.status === 'granted') return true
    const result = await Notifications.requestPermissionsAsync()
    return result.status === 'granted'
  } catch {
    return false
  }
}

/** Zruší VŠETKY naše notifikácie pre odpad (užívateľ vypol pripomienky). */
export async function zrusVsetkyNotifikacieOdpadu(): Promise<number> {
  if (!Notifications) return 0
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync()
    let zrusene = 0
    for (const n of all) {
      if (typeof n?.identifier === 'string' && n.identifier.startsWith(NOTIFICATION_TAG)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier)
        zrusene++
      }
    }
    return zrusene
  } catch {
    return 0
  }
}

/** Zistí či sú momentálne naplánované nejaké notifikácie. */
export async function suNotifikacieOdpaduZapnute(): Promise<boolean> {
  if (!Notifications) return false
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync()
    return all.some((n: any) => typeof n?.identifier === 'string' && n.identifier.startsWith(NOTIFICATION_TAG))
  } catch {
    return false
  }
}
