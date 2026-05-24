/**
 * SectionHeader — uppercase label + voliteľný link/akcia napravo.
 *
 * Použitie:
 *   <SectionHeader title="Posledné aktuality" actionLabel="Zobraziť všetky" onAction={...} />
 */

import { useThemeColors } from '@/src/theme/ThemeContext'
import { spacing, typo } from '@/src/theme/tokens'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type Props = {
  title: string
  actionLabel?: string
  onAction?: () => void
  subtitle?: string
}

export function SectionHeader({ title, actionLabel, onAction, subtitle }: Props) {
  const t = useThemeColors()
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: t.textMuted }]} accessibilityRole="header">
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.sub, { color: t.textMuted }]}>{subtitle}</Text>
        )}
      </View>
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="link"
        >
          <Text style={[styles.link, { color: t.primary }]}>{actionLabel} →</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  label: { ...typo.label },
  sub:   { ...typo.caption, marginTop: 2, textTransform: 'none', fontWeight: '500' },
  link:  { ...typo.captionB },
})

export default SectionHeader
