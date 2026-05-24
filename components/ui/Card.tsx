/**
 * Card — základný kontajner pre obsah. Konzistentný radius/shadow/padding.
 *
 * Variants:
 *   - "elevated" (default): biele pozadie + jemný shadow
 *   - "flat":               bez tieňa, len border
 *   - "accent":             ľavý farebný pruh (napr. urgentný oznam)
 */

import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, shadows, spacing } from '@/src/theme/tokens'
import { ReactNode } from 'react'
import { StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native'

type Variant = 'elevated' | 'flat' | 'accent'

type Props = {
  children: ReactNode
  variant?: Variant
  accentColor?: string
  padding?: keyof typeof spacing | 0
  style?: StyleProp<ViewStyle>
  onPress?: () => void
  disabled?: boolean
}

export function Card({
  children,
  variant = 'elevated',
  accentColor,
  padding = 'lg',
  style,
  onPress,
  disabled,
}: Props) {
  const t = useThemeColors()
  const pad = padding === 0 ? 0 : spacing[padding]

  const base: ViewStyle = {
    backgroundColor: t.surface,
    borderRadius: radius.lg,
    padding: pad,
    overflow: 'hidden',
  }

  const variantStyle: ViewStyle = variant === 'elevated'
    ? { ...shadows.md, shadowColor: t.shadow }
    : variant === 'flat'
      ? { borderWidth: 1, borderColor: t.borderLight }
      : { ...shadows.sm, shadowColor: t.shadow, borderLeftWidth: 4, borderLeftColor: accentColor ?? t.primary }

  if (onPress) {
    return (
      <TouchableOpacity
        style={[base, variantStyle, style]}
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled}
      >
        {children}
      </TouchableOpacity>
    )
  }
  return <View style={[base, variantStyle, style]}>{children}</View>
}

export default Card
