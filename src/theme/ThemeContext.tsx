/**
 * ThemeContext — runtime prepínač light / dark / auto módu.
 *
 * Použitie v komponentoch:
 *   const { mode, setMode, scheme } = useThemeMode()
 *   const t = useThemeColors()
 *   <View style={{ backgroundColor: t.background }} />
 *
 * `mode` je užívateľská preferencia ('light' | 'dark' | 'auto')
 * `scheme` je výsledná hodnota ('light' | 'dark') zohľadňujúca systémové nastavenie.
 *
 * Heraldické farby obce (red, gold, green) sú konštantné v oboch módoch.
 * Menia sa len neutral farby — background, surface, text, border.
 */

import { VOColors } from '@/constants/colors'
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type ColorScheme = 'light' | 'dark'

// Moderná neutrálna paleta na báze slate/navy (Tailwind-style) — chladnejšia,
// kohéznejšia a lepšie ladí s akcentovými gradientmi než ploché šedé.
const lightTokens = {
  background:      '#F2F5F9',  // slate-100/50 — jemne chladné pozadie
  surface:         '#FFFFFF',
  surfaceAlt:      '#F1F5F9',  // slate-100
  text:            '#0F172A',  // slate-900
  textSecondary:   '#475569',  // slate-600
  textMuted:       '#64748B',  // slate-500
  textPlaceholder: '#CBD5E1',  // slate-300
  border:          '#E2E8F0',  // slate-200
  borderLight:     '#EDF1F7',
  divider:         '#F1F5F9',
  shadow:          '#1E293B',  // slate-tinted soft shadow (modernejšie než čierna)
}

const darkTokens = {
  background:      '#0B1120',  // deep navy-slate
  surface:         '#151C2C',
  surfaceAlt:      '#1E273A',
  text:            '#F1F5F9',  // slate-100
  textSecondary:   '#CBD5E1',  // slate-300
  textMuted:       '#8593AB',
  textPlaceholder: '#475569',  // slate-600
  border:          '#293349',
  borderLight:     '#1F2737',
  divider:         '#1F2737',
  shadow:          '#000000',
}

export type ThemeColors = typeof lightTokens & {
  // re-export brand farby (konštanty)
  brand: typeof VOColors.brand
  primary: string
  primaryDark: string
  primaryLight: string
  onPrimary: string
  secondary: string
  secondaryDark: string
  secondaryLight: string
  accent: string
  accentDark: string
  accentLight: string
  status: typeof VOColors.status
}

function buildColors(scheme: ColorScheme): ThemeColors {
  const tokens = scheme === 'dark' ? darkTokens : lightTokens
  return {
    ...tokens,
    brand: VOColors.brand,
    primary: VOColors.primary,
    primaryDark: VOColors.primaryDark,
    primaryLight: scheme === 'dark' ? '#3A0F0F' : VOColors.primaryLight,
    onPrimary: VOColors.onPrimary,
    secondary: VOColors.secondary,
    secondaryDark: VOColors.secondaryDark,
    secondaryLight: scheme === 'dark' ? '#0F2A11' : VOColors.secondaryLight,
    accent: VOColors.accent,
    accentDark: VOColors.accentDark,
    accentLight: scheme === 'dark' ? '#3A2A05' : VOColors.accentLight,
    status: VOColors.status,
  }
}

type Ctx = {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
  scheme: ColorScheme
  colors: ThemeColors
}

const ThemeCtx = createContext<Ctx | null>(null)

// Module-level state aby useThemeColors() fungoval aj mimo provider
// počas hot-reloadu (Expo Router niekedy reštartuje len niektoré stromy).
let memoryMode: ThemeMode = 'auto'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme() as ColorScheme | null
  const [mode, setModeState] = useState<ThemeMode>(memoryMode)

  // Po nainštalovaní AsyncStorage možno doplniť perzistenciu:
  // useEffect(() => { AsyncStorage.getItem('themeMode').then(v => v && setModeState(v as ThemeMode)) }, [])
  useEffect(() => { memoryMode = mode }, [mode])

  const scheme: ColorScheme = mode === 'auto'
    ? (systemScheme ?? 'light')
    : mode
  const colors = useMemo(() => buildColors(scheme), [scheme])

  function setMode(m: ThemeMode) {
    memoryMode = m
    setModeState(m)
    // AsyncStorage.setItem('themeMode', m).catch(() => {})
  }

  return (
    <ThemeCtx.Provider value={{ mode, setMode, scheme, colors }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export function useThemeMode() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) {
    // Fallback: vráti light s no-op setterom
    return {
      mode: 'light' as ThemeMode,
      setMode: () => {},
      scheme: 'light' as ColorScheme,
      colors: buildColors('light'),
    }
  }
  return ctx
}

export function useThemeColors(): ThemeColors {
  return useThemeMode().colors
}
