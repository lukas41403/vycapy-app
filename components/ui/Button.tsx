/**
 * Button — primary CTA element.
 *
 * Variants:
 *   - "primary"   (default) — solid v brand farbe
 *   - "secondary"           — solid v zelenej (potvrdiť, schváliť)
 *   - "outline"             — borderom orámovaný, transparent fill
 *   - "ghost"                — len text, žiadne pozadie
 *   - "danger"               — solid červená pre deštrukčné akcie
 *
 * Velkost:
 *   - "md" (default) — 44px high (touch target minimum)
 *   - "lg"            — 52px high (hero CTA)
 *   - "sm"            — 36px high (inline akcie)
 */

import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, spacing, touchTarget, typo } from '@/src/theme/tokens'
import { ReactNode } from 'react'
import {
  ActivityIndicator,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type Props = {
  title: string
  onPress?: () => void
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth,
  icon,
  iconRight,
  style,
  textStyle,
}: Props) {
  const t = useThemeColors()
  const isDisabled = disabled || loading

  const heights: Record<Size, number> = {
    sm: 36,
    md: touchTarget.min,
    lg: 52,
  }
  const paddings: Record<Size, number> = {
    sm: spacing.md,
    md: spacing.lg,
    lg: spacing.xl,
  }

  const palette = ((): { bg: string; fg: string; border: string } => {
    switch (variant) {
      case 'primary':
        return { bg: t.primary, fg: t.onPrimary, border: t.primary }
      case 'secondary':
        return { bg: t.secondary, fg: '#FFFFFF', border: t.secondary }
      case 'outline':
        return { bg: 'transparent', fg: t.primary, border: t.primary }
      case 'ghost':
        return { bg: 'transparent', fg: t.primary, border: 'transparent' }
      case 'danger':
        return { bg: t.brand.red, fg: '#FFFFFF', border: t.brand.red }
    }
  })()

  const containerStyle: ViewStyle = {
    height: heights[size],
    paddingHorizontal: paddings[size],
    backgroundColor: palette.bg,
    borderColor: palette.border,
    borderWidth: variant === 'outline' ? 1.5 : 0,
    borderRadius: radius.md,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: isDisabled ? 0.5 : 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  }

  const fontSize = size === 'lg' ? 16 : size === 'sm' ? 13 : 15

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      activeOpacity={0.85}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text
            style={[
              { color: palette.fg, fontSize, fontWeight: '700', letterSpacing: 0.1 },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {iconRight && <View>{iconRight}</View>}
        </>
      )}
    </TouchableOpacity>
  )
}

export default Button
