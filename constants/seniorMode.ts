/**
 * Senior mód — konštanty a typy.
 *
 * Tri úrovne veľkosti písma:
 *   - 'medium'  (default v seniorovi)  — pohodlne čitateľné z 30 cm
 *   - 'large'                           — pre vyššie chyby refrakcie
 *   - 'xlarge'                          — pre veľmi slabozraké
 *
 * Custom contacts — vlastné dôležité čísla občana (syn, dcéra, sused, lekár).
 * Persistujú sa cez useSeniorMode hook (zatiaľ v pamäti, pripravené pre AsyncStorage).
 */

export type FontScale = 'medium' | 'large' | 'xlarge'

export const FONT_SCALES: Record<FontScale, {
  small: number
  body: number
  title: number
  heading: number
  display: number
}> = {
  medium: { small: 16, body: 20, title: 26, heading: 32, display: 40 },
  large:  { small: 18, body: 24, title: 30, heading: 38, display: 46 },
  xlarge: { small: 20, body: 28, title: 36, heading: 44, display: 54 },
}

export const FONT_SCALE_LABEL: Record<FontScale, string> = {
  medium: 'Stredná',
  large:  'Veľká',
  xlarge: 'Extra veľká',
}

export const SENIOR = {
  /** Default font sizes — zostávajú spätne kompatibilné. Pre dynamické použi `useSeniorFont()`. */
  fontSize: {
    small: 18,
    body: 22,
    title: 28,
    heading: 36,
  },
  spacing: {
    padding: 24,
    gap: 20,
  },
  touchTarget: 70,        // px — WCAG odporúčanie pre seniorov (väčší ako bežné 44pt)
  highContrast: true,
  colors: {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#333333',
    primary: '#C62828',
    primaryDark: '#8E1F1F',
    accent: '#1565C0',     // modrá — pre informačné dlaždice
    success: '#2E7D32',
    border: '#000000',
    borderLight: '#666666',
    cardBg: '#FFFFFF',
  },
} as const

// ─── Telefónne kontakty obce ──────────────────────────────────────────────
export const OBECNY_TELEFON = '037779515'      // 037 / 77 951 51

/** Sústava systémových kontaktov, vždy k dispozícii v Kontaktoch. */
export const SYSTEM_KONTAKTY: SystemKontakt[] = [
  { id: 'urad',       emoji: '🏛️', meno: 'Obecný úrad',       telefon: OBECNY_TELEFON, tag: 'Obec' },
  { id: 'starosta',   emoji: '👔', meno: 'Starosta obce',     telefon: '0907167383',   tag: 'Obec' },
  { id: 'zachranka',  emoji: '🚑', meno: 'Záchranná služba',  telefon: '155',          tag: 'Núdza' },
  { id: 'policia',    emoji: '👮', meno: 'Polícia',           telefon: '158',          tag: 'Núdza' },
  { id: 'hasici',     emoji: '🚒', meno: 'Hasiči',            telefon: '150',          tag: 'Núdza' },
  { id: 'tiesnova',   emoji: '🆘', meno: 'Tiesňová linka',    telefon: '112',          tag: 'Núdza' },
  { id: 'lekarna',    emoji: '💊', meno: 'Lekáreň (príklad)', telefon: '037779000',    tag: 'Zdravie' },
  { id: 'doktor',     emoji: '👨‍⚕️', meno: 'Obvodný lekár (príklad)', telefon: '037779100', tag: 'Zdravie' },
]

export type SystemKontakt = {
  id: string
  emoji: string
  meno: string
  telefon: string
  tag: 'Obec' | 'Núdza' | 'Zdravie'
}

export type CustomKontakt = {
  id: string                   // uuid alebo timestamp string
  meno: string                 // "Syn Peter"
  telefon: string              // bez formátovania
  emoji?: string               // default 👤
  vztah?: string               // "syn", "sused", "lekár"
}

/** Default SOS kontakt — používa sa keď nie je nastavený žiadny vlastný. */
export const DEFAULT_SOS_KONTAKT = {
  meno: 'Tiesňová linka',
  telefon: '112',
}

/** Format telefónu pre zobrazenie: 037779515 → 037 / 77 951 5 */
export function formatTelefon(t: string): string {
  const clean = t.replace(/\D/g, '')
  if (clean.length === 9 && clean.startsWith('0')) {
    // 0907 167 383
    return clean.replace(/(\d{4})(\d{3})(\d{2,3})/, '$1 $2 $3')
  }
  if (clean.length === 9 && clean.startsWith('037')) {
    // 037 / 77 951 51
    return clean.replace(/(\d{3})(\d{2})(\d{3})(\d{2})?/, '$1 / $2 $3 $4').trim()
  }
  if (clean.length === 3) return clean   // 112, 150, 155, 158
  return t
}
