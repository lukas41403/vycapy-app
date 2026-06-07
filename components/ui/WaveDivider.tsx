/**
 * WaveDivider — jemný SVG vlnový oddeľovač sekcií (editoriálny detail).
 *
 * Dekoračné. Themeable farba (default jemný border tón).
 */

import { useThemeColors } from '@/src/theme/ThemeContext'
import { StyleProp, View, ViewStyle } from 'react-native'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color?: string
  height?: number
  /** Počet vĺn naprieč šírkou. */
  waves?: number
  style?: StyleProp<ViewStyle>
}

export function WaveDivider({ color, height = 14, waves = 4, style }: Props) {
  const t = useThemeColors()
  const stroke = color ?? t.border
  // viewBox šírka 100 jednotiek; cez ňu nakreslíme `waves` periód sínusovej vlny
  const W = 100
  const seg = W / waves
  const mid = height / 2
  const amp = height / 2 - 1.5
  let d = `M0 ${mid}`
  for (let i = 0; i < waves; i++) {
    const x0 = i * seg
    d += ` Q ${x0 + seg * 0.25} ${mid - amp} ${x0 + seg * 0.5} ${mid}`
    d += ` Q ${x0 + seg * 0.75} ${mid + amp} ${x0 + seg} ${mid}`
  }
  return (
    <View style={[{ height }, style]} accessibilityElementsHidden importantForAccessibility="no">
      <Svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none">
        <Path d={d} stroke={stroke} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  )
}

export default WaveDivider
