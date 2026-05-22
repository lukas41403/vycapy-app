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

const lightTokens = {
  background:      '#F7F8FA',
  surface:         '#FFFFFF',
  surfaceAlt:      '#FAFAFA',
  text:            '#1A1A1A',
  textSecondary:   '#555555',
  textMuted:       '#888888',
  textPlaceholder: '#BBBBBB',
  border:          '#E0E0E0',
  borderLight:     '#EEEEEE',
  divider:         '#F0F0F0',
  shadow:          '#000000',
}

const darkTokens = {
  background:      '#0F0F12',
  surface:         '#1B1B1F',
  surfaceAlt:      '#252529',
  text:            '#F5F5F7',
  textSecondary:   '#C0C0C5',
  textMuted:       '#888892',
  textPlaceholder: '#5B5B65',
  border:          '#36363D',
  borderLight:     '#2A2A30',
  divider:         '#2A2A30',
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
