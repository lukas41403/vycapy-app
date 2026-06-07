/**
 * Farby obce Výčapy-Opatovce.
 *
 * Heraldická paleta vychádza z erbu obce a obecnej vlajky:
 *   - červená (štít erbu, dominantná farba vlajky)
 *   - zlatá / žltá (lev, krojidlo, žltý pruh vlajky)
 *   - zelená (pažiť, smrek, zelený pruh vlajky)
 *   - strieborná / biela (radlica, biely pruh vlajky)
 *
 * Single source of truth — keď bude treba doladiť odtieň podľa
 * tlačeného erbu alebo brand-bookov obce, zmení sa tu na jednom mieste.
 */

export const VOColors = {
  // Heraldické farby obce
  brand: {
    red: '#C62828',         // hlavná farba (štít erbu) — primárka appky
    redDark: '#8E1F1F',     // tmavšia pre gradient
    redLight: '#FFEBEE',    // light variant pre badges/pozadia
    gold: '#F9A825',        // zlatá (lev) — accent
    goldDark: '#C17A00',
    goldLight: '#FFF8E1',
    green: '#2E7D32',       // tráva / pažiť — confirm/CTA
    greenDark: '#1B5E20',
    greenLight: '#E8F5E9',
    white: '#FFFFFF',       // strieborná z heraldiky
  },

  // Sémantické tokeny — používajú sa v styles
  // Vďaka tomu môžeš zmeniť napr. primary na zelenú jediným riadkom.
  primary: '#C62828',
  primaryDark: '#8E1F1F',
  primaryLight: '#FFEBEE',
  onPrimary: '#FFFFFF',

  secondary: '#2E7D32',     // zelená – pozitívne akcie, "vyriešené"
  secondaryDark: '#1B5E20',
  secondaryLight: '#E8F5E9',

  accent: '#F9A825',
  accentDark: '#C17A00',
  accentLight: '#FFF8E1',

  // Status farby (zjednotené pre badges, hlasenia, aktuality)
  status: {
    info:    { bg: '#E3F2FD', fg: '#1565C0' },
    success: { bg: '#E8F5E9', fg: '#2E7D32' },
    warning: { bg: '#FFF8E1', fg: '#F57F17' },
    danger:  { bg: '#FFEBEE', fg: '#C62828' },
    neutral: { bg: '#ECEFF1', fg: '#37474F' },
    accent:  { bg: '#F3E5F5', fg: '#6A1B9A' },
  },

  // Akcentové farby funkcií/dlaždíc — single source of truth namiesto
  // hardkódovaných hexov po obrazovkách (menu "Viac", rýchle akcie…).
  feature: {
    slate:     '#37474F',  // kontakty, neutrálne
    blue:      '#1565C0',  // šport, info
    lightBlue: '#0277BD',  // počasie, okolie
    teal:      '#00838F',  // služby, meteo
    indigo:    '#0D47A1',  // smart obec, mapa
    purple:    '#6A1B9A',  // Marta (AI referentka)
    purpleAlt: '#7B1FA2',  // ankety
    brown:     '#5D4037',  // farské oznamy, senior
    orange:    '#F57F17',  // cestovný poriadok
    greenDark: '#1B5E20',  // FC
  },

  // Farby kategórií aktualít (badge, placeholder, ikona)
  category: {
    oznam:     '#1565C0',
    akcia:     '#2E7D32',
    uzavierka: '#F57F17',
    vypadok:   '#C62828',
    sport:     '#1565C0',
    ine:       '#607D8B',
  },

  // Gradientové dvojice — pre farebné ikonové dlaždice a akcentové plochy.
  // Sýte a kontrastné; biela ikona na nich vždy vynikne (WCAG AA+).
  gradients: {
    red:    ['#EF5350', '#C62828'],
    gold:   ['#FFB300', '#F57F17'],
    green:  ['#4CAF50', '#2E7D32'],
    blue:   ['#42A5F5', '#1565C0'],
    teal:   ['#26C6DA', '#00838F'],
    purple: ['#AB47BC', '#6A1B9A'],
    slate:  ['#607D8B', '#37474F'],
    orange: ['#FFA726', '#EF6C00'],
    indigo: ['#5C6BC0', '#283593'],
    brown:  ['#8D6E63', '#4E342E'],
    pink:   ['#EC407A', '#AD1457'],
  },

  // Povrchy & texty
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAFA',

  text: '#1A1A1A',
  textSecondary: '#555555',
  textMuted: '#888888',
  textPlaceholder: '#BBBBBB',

  border: '#E0E0E0',
  borderLight: '#EEEEEE',
  divider: '#F0F0F0',

  // Tieň
  shadow: '#000000',
} as const

// Krátky alias pre pohodlnejšie volanie v komponentoch
export const C = VOColors

// Spätná kompatibilita — niektoré súbory ešte volajú '#2E7D32' priamo;
// po refaktore by ich už nemali, ale nech sa nič nerozbije.
export default VOColors
