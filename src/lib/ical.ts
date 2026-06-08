/**
 * iCal export — generuje .ics súbor pre podujatie a ponúkne ho cez Share.
 *
 * Užívateľ klepne tlačidlo "Pridať do kalendára" → appka vygeneruje .ics
 * → Share sheet → vyberie Google Calendar / Apple Calendar / Outlook → import.
 *
 * Implementácia:
 *   - V appke vygenerujeme RFC 5545 .ics text
 *   - Použijeme `data:text/calendar` URI alebo expo-file-system + Sharing
 *   - Ak nemáme `expo-file-system`, fallback: skopírujeme do clipboard
 *
 * RFC 5545 ref: https://datatracker.ietf.org/doc/html/rfc5545
 */

import { Share } from 'react-native'

// Defenzívne importy — ak balíky nie sú nainštalované, fallback
let FileSystem: any = null
let Sharing: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  FileSystem = require('expo-file-system')
} catch { FileSystem = null }
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Sharing = require('expo-sharing')
} catch { Sharing = null }

export type ICalEvent = {
  id: string                    // uid v kalendári
  title: string
  description?: string | null
  location?: string | null
  start: Date | string          // začiatok
  end?: Date | string | null    // koniec (default = start + 2h)
  url?: string                  // odkaz späť do appky
}

/** Escape pre iCal text fields (RFC 5545 §3.3.11). */
function esc(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

/** Format Date → "20260615T180000Z" (UTC). */
function fmtDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) + 'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) + 'Z'
  )
}

/** Vyrobí .ics text pre jednu udalosť. */
export function buildIcs(event: ICalEvent): string {
  const start = new Date(event.start)
  const end = event.end
    ? new Date(event.end)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000) // default +2h

  const now = new Date()
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vycapy-Opatovce//Obecna appka//SK',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@vycapy-opatovce.sk`,
    `DTSTAMP:${fmtDate(now)}`,
    `DTSTART:${fmtDate(start)}`,
    `DTEND:${fmtDate(end)}`,
    `SUMMARY:${esc(event.title)}`,
  ]
  if (event.description) lines.push(`DESCRIPTION:${esc(event.description)}`)
  if (event.location) lines.push(`LOCATION:${esc(event.location)}`)
  if (event.url) lines.push(`URL:${event.url}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')

  // RFC 5545 vyžaduje CRLF
  return lines.join('\r\n')
}

/**
 * Hlavná export funkcia — vyrobí .ics a otvorí share sheet.
 *
 * - Ak je expo-file-system + expo-sharing dostupné → uloží .ics a otvorí Sharing.
 *   Toto dovoľuje "Pridať do Google Kalendára / Apple Kalendára".
 * - Inak fallback: pošle text cez React Native Share — užívateľ ho dostane do
 *   clipboard / email a vie ho importovať ručne.
 */
export async function pridajDoKalendara(event: ICalEvent): Promise<boolean> {
  const ics = buildIcs(event)
  const filename = `podujatie-${event.id.slice(0, 8)}.ics`

  // Pokus o file-based sharing (najlepšia UX — natívny "Open With" dialog)
  if (FileSystem && Sharing) {
    try {
      const isAvailable = await Sharing.isAvailableAsync()
      if (isAvailable) {
        const path = `${FileSystem.cacheDirectory}${filename}`
        await FileSystem.writeAsStringAsync(path, ics, {
          encoding: FileSystem.EncodingType?.UTF8 ?? 'utf8',
        })
        await Sharing.shareAsync(path, {
          mimeType: 'text/calendar',
          dialogTitle: `Pridať "${event.title}" do kalendára`,
          UTI: 'public.calendar-event',
        })
        return true
      }
    } catch (e) {
      console.warn('[ical] file sharing zlyhal:', e)
    }
  }

  // Fallback: React Native Share s textom
  try {
    const start = new Date(event.start)
    const datum = start.toLocaleString('sk-SK', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    await Share.share({
      title: event.title,
      message:
        `📅 ${event.title}\n` +
        `${datum}\n` +
        (event.location ? `📍 ${event.location}\n` : '') +
        `\nPre pridanie do kalendára:\n` +
        `${ics}`,
    })
    return true
  } catch (e) {
    console.warn('[ical] share zlyhal:', e)
    return false
  }
}
