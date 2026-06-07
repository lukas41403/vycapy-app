/**
 * AtmosphereBackground — jemná hĺbka namiesto plochej plochy.
 *
 * Vrství: (1) tenký farebný „glow" zhora (brand tint → transparent) a
 * (2) noise textúru (opacity ~0.04) cez celú plochu → editoriálna zrnitosť.
 * Dekoračné, `pointerEvents=none`. Vlož ako prvé dieťa kontajnera.
 *
 * Themeable: tint berie z brand palety (per-obec).
 */

import { C } from '@/constants/colors'
import { useThemeMode } from '@/src/theme/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { Image, StyleSheet, View } from 'react-native'

const NOISE = require('@/assets/images/noise.png')

type Props = {
  /** Farba horného glow-u (default brand červená). */
  tint?: string
  /** Intenzita noise (0–1). Default jemných 0.04. */
  noiseOpacity?: number
}

export function AtmosphereBackground({ tint = C.brand.red, noiseOpacity = 0.04 }: Props) {
  const { scheme } = useThemeMode()
  const glow = scheme === 'dark' ? 0.16 : 0.07

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[tint + Math.round(glow * 255).toString(16).padStart(2, '0'), 'transparent']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 0.45 }}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={NOISE}
        style={[StyleSheet.absoluteFill, { opacity: scheme === 'dark' ? noiseOpacity * 1.3 : noiseOpacity }]}
        resizeMode="repeat"
      />
    </View>
  )
}

export default AtmosphereBackground
