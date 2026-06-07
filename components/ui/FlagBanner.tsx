/**
 * FlagBanner — signature prvok appky: trojfarebný pruh obecnej vlajky.
 *
 * Toto je „jedna zapamätateľná vec" dizajnu — opakujúci sa heraldický motív.
 * Plne themeable: farby berie z brand palety (per-obec konfigurovateľné),
 * takže pre inú obec stačí vymeniť `brand.red/gold/green` v tokens/configu.
 *
 * Varianty:
 *   - default: tenký zaoblený „ribbon" (pod nadpisom, ako akcent)
 *   - "full":  pruh cez celú šírku (divider / spodná hrana hero)
 */

import { C } from '@/constants/colors'
import { radius } from '@/src/theme/tokens'
import { StyleProp, View, ViewStyle } from 'react-native'

type Props = {
  /** Šírka pri default variante (px). Pri "full" sa ignoruje. */
  width?: number
  height?: number
  variant?: 'ribbon' | 'full'
  /** Farby pruhov — default heraldické farby obce. */
  colors?: readonly string[]
  style?: StyleProp<ViewStyle>
}

export function FlagBanner({
  width = 52,
  height = 4,
  variant = 'ribbon',
  colors = [C.brand.red, C.brand.gold, C.brand.green],
  style,
}: Props) {
  const isFull = variant === 'full'
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        {
          flexDirection: 'row',
          height,
          width: isFull ? '100%' : width,
          borderRadius: isFull ? 0 : radius.pill,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {colors.map((c, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: c }} />
      ))}
    </View>
  )
}

export default FlagBanner
