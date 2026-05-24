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

// ─── Typography stupnica ──────────────────────────────────────────────────
// Pomenované podľa role, nie podľa rozmeru — aby sa dali jednoducho meniť.
export const typo = {
  // Display — hero, najväčšie nadpisy obrazovky
  display: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, lineHeight: 34 } as TextStyle,
  // H1 — title obrazovky
  h1:      { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, lineHeight: 28 } as TextStyle,
  // H2 — väčší nadpis sekcie
  h2:      { fontSize: 18, fontWeight: '800', letterSpacing: -0.2, lineHeight: 24 } as TextStyle,
  // H3 — nadpis karty
  h3:      { fontSize: 16, fontWeight: '700', lineHeight: 22 } as TextStyle,
  // Body
  body:    { fontSize: 15, fontWeight: '400', lineHeight: 22 } as TextStyle,
  bodyB:   { fontSize: 15, fontWeight: '700', lineHeight: 22 } as TextStyle,
  // Small
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 } as TextStyle,
  captionB:{ fontSize: 13, fontWeight: '700', lineHeight: 18 } as TextStyle,
  // Label — uppercase section header
  label:   { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', lineHeight: 14 } as TextStyle,
  // Micro — najmenší (badge, datum)
  micro:   { fontSize: 11, fontWeight: '600', lineHeight: 14 } as TextStyle,
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
