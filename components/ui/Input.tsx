/**
 * Input — jednotné textové pole dizajnového systému.
 *
 * Voliteľná ikona vľavo, focus stav (brand orámovanie), label, error text.
 * Theme-aware, prístupné (min. výška 48, accessibilityLabel).
 */

import { radius, spacing, typo } from '@/src/theme/tokens'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { useState } from 'react'
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native'
import Icon, { IconName } from './Icon'

type Props = TextInputProps & {
  label?: string
  icon?: IconName
  error?: string
  containerStyle?: StyleProp<ViewStyle>
}

export function Input({ label, icon, error, containerStyle, style, onFocus, onBlur, ...rest }: Props) {
  const t = useThemeColors()
  const [focused, setFocused] = useState(false)

  const borderColor = error ? t.status.danger.fg : focused ? t.primary : t.border

  return (
    <View style={containerStyle}>
      {label && <Text style={[styles.label, { color: t.textSecondary }]}>{label}</Text>}
      <View style={[styles.field, { backgroundColor: t.surfaceAlt, borderColor }]}>
        {icon && <Icon name={icon} size={18} color={focused ? t.primary : t.textMuted} />}
        <TextInput
          style={[styles.input, { color: t.text }, style]}
          placeholderTextColor={t.textPlaceholder}
          onFocus={(e) => { setFocused(true); onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); onBlur?.(e) }}
          {...rest}
        />
      </View>
      {error && <Text style={[styles.error, { color: t.status.danger.fg }]}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  label: { ...typo.captionB, marginBottom: 6, marginLeft: 2 },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    minHeight: 48, paddingHorizontal: spacing.md,
    borderRadius: radius.md, borderWidth: 1.5,
  },
  input: { flex: 1, height: '100%', ...typo.body },
  error: { ...typo.micro, marginTop: 4, marginLeft: 2 },
})

export default Input
