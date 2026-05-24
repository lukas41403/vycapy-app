/**
 * EmptyState — empty / žiadne výsledky / žiadne dáta UI.
 *
 * Použitie:
 *   <EmptyState
 *     icon="📭"
 *     title="Žiadne aktuality"
 *     description="Momentálne nie sú zverejnené žiadne aktuality."
 *     actionLabel="Obnoviť"
 *     onAction={refresh}
 *   />
 */

import { useThemeColors } from '@/src/theme/ThemeContext'
import { spacing, typo } from '@/src/theme/tokens'
// React node import bol nepotrebný — secondaryAction zostal ako ReactNode v Props
import { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Button from './Button'

type Props = {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryAction?: ReactNode
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
}: Props) {
  const t = useThemeColors()
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.icon} accessibilityElementsHidden>{icon}</Text>
      <Text style={[styles.title, { color: t.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.desc, { color: t.textMuted }]}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <View style={{ marginTop: spacing.lg }}>
          <Button title={actionLabel} onPress={onAction} variant="primary" />
        </View>
      )}
      {secondaryAction && <View style={{ marginTop: spacing.md }}>{secondaryAction}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  icon: { fontSize: 56, marginBottom: spacing.sm },
  title: { ...typo.h2, textAlign: 'center' },
  desc: { ...typo.body, textAlign: 'center' },
})

export default EmptyState
