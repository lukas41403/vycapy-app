/**
 * WebSourceBadge — zobrazí kde aktualita/podujatie pochádza.
 *
 * Pre obyvateľov je to dôležité — vidia že obsah ide z oficiálneho webu obce
 * (webygroup CMS). To vytvára dôveru.
 *
 * Pre admin je to dôležité aby vedeli ktoré položky sú "syncované" (nemali
 * by ich editovať lebo pri ďalšom sync sa prepíšu) vs. ktoré sú vlastné.
 */

import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, spacing } from '@/src/theme/tokens'
import { Linking, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native'

export type WebSourceVariant = 'badge' | 'card'

type Props = {
  source?: string | null
  externalUrl?: string | null
  syncedAt?: string | null
  variant?: WebSourceVariant
  style?: StyleProp<ViewStyle>
}

function relTime(iso: string): string {
  const d = new Date(iso)
  const min = Math.round((Date.now() - d.getTime()) / 60000)
  if (min < 1) return 'práve teraz'
  if (min < 60) return `pred ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `pred ${h} h`
  return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' })
}

export function WebSourceBadge({
  source,
  externalUrl,
  syncedAt,
  variant = 'badge',
  style,
}: Props) {
  const t = useThemeColors()

  // Iba 'webygroup' zatiaľ ukazujeme — 'manual' nie je potrebné označovať
  if (!source || source === 'manual') return null

  const labels: Record<string, string> = {
    webygroup: '🌐 Z webu obce',
    import: '📥 Importované',
  }
  const label = labels[source] ?? `📥 ${source}`

  if (variant === 'badge') {
    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: t.surfaceAlt, borderColor: t.border },
          style,
        ]}
      >
        <Text style={[styles.badgeText, { color: t.textSecondary }]}>{label}</Text>
      </View>
    )
  }

  // Card variant — väčšia, klikateľná, s linkom na originál
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: t.surfaceAlt, borderLeftColor: t.primary }, style]}
      onPress={() => externalUrl && Linking.openURL(externalUrl)}
      activeOpacity={externalUrl ? 0.7 : 1}
      disabled={!externalUrl}
      accessibilityRole={externalUrl ? 'link' : undefined}
    >
      <View style={styles.cardRow}>
        <Text style={styles.cardEmoji}>🌐</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: t.text }]}>
            Stiahnuté z webu obce
          </Text>
          <Text style={[styles.cardSub, { color: t.textMuted }]} numberOfLines={1}>
            {syncedAt
              ? `Synchronizované ${relTime(syncedAt)} · vycapy-opatovce.sk`
              : 'Zdroj: vycapy-opatovce.sk'}
          </Text>
        </View>
        {externalUrl && (
          <Text style={[styles.cardArrow, { color: t.primary }]}>↗</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

  card: {
    borderRadius: radius.md,
    borderLeftWidth: 4,
    padding: spacing.md,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardEmoji: { fontSize: 22 },
  cardTitle: { fontSize: 14, fontWeight: '800' },
  cardSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  cardArrow: { fontSize: 20, fontWeight: '900' },
})

export default WebSourceBadge
