/**
 * Design tokens — single source of truth pre spacing, radius, shadows, typography.
 *
 * Pravidlo: žiadny ďalší komponent nesmie hardkódovať `padding: 16`,
 * `borderRadius: 12`, atď. Vždy cez tokeny. Tým získame:
 *   - vizuálnu konzistenciu naprieč obrazovkami,
 *   - jednoducho prispôsobiteľný UI (zmena radiusu na jednom mieste),
 *   - lepšiu prácu so screen reader-mi (zarovnané rozostupy → predikovateľné gestá).
 *
 * Tokeny vychádzajú z 4pt grid systému (4, 8, 12, 16, 24, 32, 48).
 */

import { Platform, TextStyle, ViewStyle } from 'react-native'

// ─── Spacing (4pt grid) ───────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const

// ─── Border radius ────────────────────────────────────────────────────────
export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const

// ─── Shadows / elevation ──────────────────────────────────────────────────
// Tri úrovne. Používame ich v Card a tlačidlách — nie viac.
export const shadows = {
  none: {
    shadowOpacity: 0,
    elevation: 0,
  } as ViewStyle,
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  } as ViewStyle,
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  } as ViewStyle,
} as const

// ─── Fonty ───────────────────────────────────────────────────────────────
// Jeden konzistentný, vysoko čitateľný sans-serif naprieč celou appkou:
// **Inter** (identický vzhľad na iOS aj Androide → maximálna konzistencia +
// brand identita). Pri custom fontoch v RN nesie váhu PRIAMO rodina
// (fontWeight sa ignoruje), preto má každá rola explicitnú rodinu.
// Názvy = kľúče načítané v useFonts() v app/_layout.tsx.
export const fonts = {
  display:     'Inter_800ExtraBold',   // hero, najväčšie nadpisy
  displaySemi: 'Inter_700Bold',
  black:       'Inter_800ExtraBold',
  bold:        'Inter_700Bold',
  semibold:    'Inter_600SemiBold',
  medium:      'Inter_500Medium',
  regular:     'Inter_400Regular',
} as const

/** Mapovanie číselnej váhy na rodinu — pre globálny default a inline texty. */
export function fontFor(weight?: TextStyle['fontWeight']): string {
  switch (String(weight)) {
    case '800':
    case '900': return fonts.black
    case '700': return fonts.bold
    case '600': return fonts.semibold
    case '500': return fonts.medium
    default:    return fonts.regular
  }
}

// ─── Typography stupnica ──────────────────────────────────────────────────
// Pomenované podľa role, nie podľa rozmeru — aby sa dali jednoducho meniť.
export const typo = {
  // Display — hero, najväčšie nadpisy obrazovky (serif)
  display: { fontFamily: fonts.display, fontSize: 30, letterSpacing: -0.6, lineHeight: 36 } as TextStyle,
  // H1 — title obrazovky (serif)
  h1:      { fontFamily: fonts.display, fontSize: 24, letterSpacing: -0.4, lineHeight: 30 } as TextStyle,
  // H2 — väčší nadpis sekcie (grotesk)
  h2:      { fontFamily: fonts.black, fontSize: 18, letterSpacing: -0.2, lineHeight: 24 } as TextStyle,
  // H3 — nadpis karty
  h3:      { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 } as TextStyle,
  // Body
  body:    { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 } as TextStyle,
  bodyB:   { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 } as TextStyle,
  // Small
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 } as TextStyle,
  captionB:{ fontFamily: fonts.bold, fontSize: 13, lineHeight: 18 } as TextStyle,
  // Label — uppercase section header
  label:   { fontFamily: fonts.black, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', lineHeight: 14 } as TextStyle,
  // Micro — najmenší (badge, datum)
  micro:   { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 } as TextStyle,
} as const

// ─── Touch targets — minimum 44pt pre prístupnosť ─────────────────────────
export const touchTarget = {
  min: 44,
  comfortable: 48,
} as const

// ─── Animation durations ──────────────────────────────────────────────────
export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
} as const

// ─── Platform helpers ─────────────────────────────────────────────────────
export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'
export const isWeb = Platform.OS === 'web'

// ─── Layout ───────────────────────────────────────────────────────────────
export const layout = {
  screenPadding: spacing.lg, // 16px – konzistentný okraj obrazoviek
  cardGap: spacing.md,       // 12px medzi kartami v zozname
  sectionGap: spacing.xl,    // 24px medzi sekciami
} as const
