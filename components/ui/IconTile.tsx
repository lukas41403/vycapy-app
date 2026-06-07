/**
 * IconTile — farebná gradientová dlaždica s bielou ikonou.
 *
 * Zjednocuje "pekné farebné ikonky" naprieč appkou (rýchle akcie, menu Viac,
 * urgentná karta…). Biela ikona na sýtom gradiente = vysoký kontrast a pop.
 * Voliteľný jemný farebný tieň (glow) pridáva hĺbku.
 *
 * Použitie:
 *   <IconTile name="hlasenie" gradient={C.gradients.red} />
 *   <IconTile name="marta" gradient={C.gradients.purple} size={56} glow />
 */

import { radius as r } from '@/src/theme/tokens'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleProp, ViewStyle } from 'react-native'
import Icon, { IconName } from './Icon'

type Gradient = readonly [string, string, ...string[]]

type Props = {
  name: IconName
  gradient: Gradient
  /** Hrana dlaždice (default 48). */
  size?: number
  /** Veľkosť ikony (default ~52 % z size). */
  iconSize?: number
  /** Zaoblenie (default radius.md). */
  cornerRadius?: number
  /** Jemný farebný tieň pod dlaždicou. */
  glow?: boolean
  style?: StyleProp<ViewStyle>
}

export function IconTile({ name, gradient, size = 48, iconSize, cornerRadius = r.md, glow, style }: Props) {
  const glowStyle: ViewStyle = glow
    ? {
        shadowColor: gradient[gradient.length - 1],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
      }
    : {}

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: cornerRadius,
          justifyContent: 'center',
          alignItems: 'center',
        },
        glowStyle,
        style,
      ]}
    >
      <Icon name={name} size={iconSize ?? Math.round(size * 0.52)} color="#FFFFFF" />
    </LinearGradient>
  )
}

export default IconTile
