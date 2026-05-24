/**
 * Badge — malý status indikátor.
 * Tone definuje farbu (info/success/warning/danger/neutral/accent).
 * Variant "solid" má vyplnené pozadie, "soft" má svetlé pozadie + tmavý text.
 */

import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, spacing } from '@/src/theme/tokens'
import { StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native'

export type BadgeTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent' | 'brand'
type Variant = 'soft' | 'solid'

type Props = {
  label: string
  tone?: BadgeTone
  variant?: Variant
  icon?: string
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export function Badge({
  label,
  tone = 'neutral',
  variant = 'soft',
  icon,
  style,
  textStyle,
}: Props) {
  const t = useThemeColors()

  const palette = ((): { bg: string; fg: string } => {
    if (tone === 'brand') return { bg: t.primaryLight, fg: t.primary }
    const map = t.status
    return map[tone] ? { bg: map[tone].bg, fg: map[tone].fg } : { bg: map.neutral.bg, fg: map.neutral.fg }
  })()

  const containerStyle: ViewStyle = {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: variant === 'soft' ? palette.bg : palette.fg,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.sm,
  }

  const txt: TextStyle = {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    color: variant === 'soft' ? palette.fg : '#FFFFFF',
  }

  return (
    <View style={[containerStyle, style]}>
      {icon && <Text style={[txt, { fontWeight: '400' }]}>{icon}</Text>}
      <Text style={[txt, textStyle]}>{label}</Text>
    </View>
  )
}

export default Badge
