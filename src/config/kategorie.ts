/**
 * Vizuálna definícia kategórií aktualít — single source of truth.
 * Používa Domov aj obrazovka Aktuality, aby boli štítky, ikony a farby
 * konzistentné. (DRY — predtým duplikované v oboch súboroch.)
 */

import type { IconName } from '@/components/ui/Icon'
import type { BadgeTone } from '@/components/ui/Badge'
import { C } from '@/constants/colors'

export type KategoriaKey = 'oznam' | 'akcia' | 'uzavierka' | 'vypadok' | 'sport' | 'ine'

export const KAT_LABEL: Record<string, string> = {
  oznam: 'Oznam', akcia: 'Akcia', uzavierka: 'Uzávierka',
  vypadok: 'Výpadok', sport: 'Šport', ine: 'Iné',
}

export const KAT_TONE: Record<string, BadgeTone> = {
  oznam: 'info', akcia: 'success', uzavierka: 'warning',
  vypadok: 'danger', sport: 'info', ine: 'neutral',
}

export type KatVisual = {
  icon: IconName
  color: string
  gradient: readonly [string, string, ...string[]]
}

const KAT_VISUAL: Record<string, KatVisual> = {
  oznam:     { icon: 'info',      color: C.category.oznam,     gradient: C.gradients.blue },
  akcia:     { icon: 'sparkles',  color: C.category.akcia,     gradient: C.gradients.green },
  uzavierka: { icon: 'hlasenie',  color: C.category.uzavierka, gradient: C.gradients.orange },
  vypadok:   { icon: 'hlasenie',  color: C.category.vypadok,   gradient: C.gradients.red },
  sport:     { icon: 'fc',        color: C.category.sport,     gradient: C.gradients.blue },
  ine:       { icon: 'aktuality', color: C.category.ine,       gradient: C.gradients.slate },
}

export function katVisual(kat: string): KatVisual {
  return KAT_VISUAL[kat] ?? KAT_VISUAL.ine
}

export function katLabel(kat: string): string {
  return KAT_LABEL[kat] ?? kat
}

export function katTone(kat: string): BadgeTone {
  return KAT_TONE[kat] ?? 'neutral'
}
