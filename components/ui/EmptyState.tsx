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
import { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Button from './Button'
import Icon, { IconName } from './Icon'

type Props = {
  icon?: IconName
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryAction?: ReactNode
}

export function EmptyState({
  icon = 'aktuality',
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
}: Props) {
  const t = useThemeColors()
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={[styles.iconHalo, { backgroundColor: t.surfaceAlt }]}>
        <Icon name={icon} size={36} color={t.textMuted} />
      </View>
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
  iconHalo: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typo.h2, textAlign: 'center' },
  desc: { ...typo.body, textAlign: 'center' },
})

export default EmptyState
