/**
 * Môj zoznam — uložené aktuality, podujatia, výlety, inzeráty, služby.
 *
 * Filtre podľa typu (Všetko / Aktuality / Podujatia / Výlety / …).
 * Swipe-to-delete alebo X tlačidlo.
 * "Zmazať všetko" tlačidlo na konci s confirm dialogom.
 */

import { AppHeader } from '@/components/AppHeader'
import { Badge, Button, EmptyState } from '@/components/ui'
import { Bookmark, BookmarkKind, useAllBookmarks } from '@/src/hooks/useBookmarks'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const KIND_META: Record<BookmarkKind | 'vsetko', { emoji: string; label: string; path?: (id: string) => string }> = {
  vsetko:    { emoji: '📌', label: 'Všetko' },
  aktualita: { emoji: '📰', label: 'Aktuality',     path: (id) => `/aktualita/${id}` },
  podujatie: { emoji: '🎉', label: 'Podujatia',     path: (id) => `/podujatie/${id}` },
  vylet:     { emoji: '🌍', label: 'Výlety',        path: () => `/okolie` },
  inzerat:   { emoji: '🛒', label: 'Inzeráty',      path: () => `/susedsky-predaj` },
  sluzba:    { emoji: '🏥', label: 'Služby',        path: (id) => `/sluzba/${id}` },
  farsky:    { emoji: '⛪', label: 'Farské oznamy', path: () => `/farske-oznamy` },
}

function formatRel(iso: string): string {
  const d = new Date(iso)
  const days = Math.round((Date.now() - d.getTime()) / 86400000)
  if (days < 1) {
    const h = Math.round((Date.now() - d.getTime()) / 3600000)
    if (h < 1) return 'pred chvíľou'
    return `pred ${h} h`
  }
  if (days === 1) return 'včera'
  if (days < 7) return `pred ${days} dňami`
  return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' })
}

export default function MojZoznamScreen() {
  const router = useRouter()
  const t = useThemeColors()
  const { items, loaded, remove, removeAll } = useAllBookmarks()
  const [filter, setFilter] = useState<BookmarkKind | 'vsetko'>('vsetko')

  // Filtruj + spočítaj
  const filtered = useMemo(() => {
    if (filter === 'vsetko') return items
    return items.filter(b => b.kind === filter)
  }, [items, filter])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    items.forEach(b => { c[b.kind] = (c[b.kind] || 0) + 1 })
    return c
  }, [items])

  function open(b: Bookmark) {
    const meta = KIND_META[b.kind]
    if (meta.path) {
      router.push(meta.path(b.id) as never)
    }
  }

  function confirmRemoveAll() {
    Alert.alert(
      'Vyprázdniť zoznam?',
      `Odstrániť všetkých ${items.length} uložených položiek?`,
      [
        { text: 'Zrušiť', style: 'cancel' },
        { text: 'Vyprázdniť', style: 'destructive', onPress: removeAll },
      ],
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={t.surface} />
      <AppHeader title="🔖 Môj zoznam" subtitle={`${items.length} uložených položiek`} />

      {/* Filter chips */}
      {items.length > 0 && (
        <View style={[styles.chipsWrap, { backgroundColor: t.surface, borderBottomColor: t.borderLight }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {(['vsetko', 'aktualita', 'podujatie', 'vylet', 'inzerat', 'sluzba', 'farsky'] as const).map(k => {
              const meta = KIND_META[k]
              const count = k === 'vsetko' ? items.length : (counts[k] ?? 0)
              if (count === 0 && k !== 'vsetko') return null
              const active = filter === k
              return (
                <TouchableOpacity
                  key={k}
                  style={[
                    styles.chip,
                    { backgroundColor: t.surfaceAlt, borderColor: t.border },
                    active && { backgroundColor: t.primary, borderColor: t.primary },
                  ]}
                  onPress={() => setFilter(k)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[
                    styles.chipText,
                    { color: t.textSecondary },
                    active && { color: '#FFFFFF', fontWeight: '900' },
                  ]}>
                    {meta.emoji} {meta.label} · {count}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!loaded ? null : items.length === 0 ? (
          <EmptyState
            icon="🔖"
            title="Zoznam je prázdny"
            description="Pri každej aktualite, podujatí, výlete alebo službe nájdete tlačidlo 🏷️. Klepnutím ich uložíte do Môjho zoznamu pre rýchly prístup."
            actionLabel="Prejsť na aktuality"
            onAction={() => router.push('/aktuality' as never)}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="V tejto kategórii nič nemáte"
            description="Skúste vybrať inú kategóriu."
          />
        ) : (
          <>
            {filtered.map(b => {
              const meta = KIND_META[b.kind]
              return (
                <TouchableOpacity
                  key={`${b.kind}:${b.id}`}
                  style={[styles.card, { backgroundColor: t.surface, shadowColor: t.shadow }]}
                  activeOpacity={0.85}
                  onPress={() => open(b)}
                  accessibilityRole="button"
                  accessibilityLabel={b.title}
                >
                  <View style={[styles.iconBox, { backgroundColor: t.surfaceAlt }]}>
                    <Text style={styles.iconEmoji}>{b.emoji ?? meta.emoji}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.cardTop}>
                      <Badge label={meta.label} tone="neutral" />
                      <Text style={[styles.savedAt, { color: t.textPlaceholder }]}>
                        {formatRel(b.savedAt)}
                      </Text>
                    </View>
                    <Text style={[styles.title, { color: t.text }]} numberOfLines={2}>
                      {b.title}
                    </Text>
                    {b.podtitul && (
                      <Text style={[styles.podtitul, { color: t.textMuted }]} numberOfLines={2}>
                        {b.podtitul}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation?.(); remove(b.id, b.kind) }}
                    hitSlop={10}
                    style={styles.removeBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Odstrániť z môjho zoznamu"
                  >
                    <Text style={[styles.removeText, { color: t.textMuted }]}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )
            })}

            {items.length > 0 && (
              <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
                <Button title="Vyprázdniť celý zoznam" variant="outline" onPress={confirmRemoveAll} />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  chipsWrap: { borderBottomWidth: 1, paddingVertical: spacing.sm },
  chipsRow: { paddingHorizontal: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  chipText: { ...typo.caption, fontWeight: '700' },

  scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  iconBox: {
    width: 50, height: 50, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  iconEmoji: { fontSize: 26 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'space-between' },
  savedAt: { ...typo.micro, fontWeight: '600' },
  title: { ...typo.h3 },
  podtitul: { ...typo.caption },
  removeBtn: { padding: 6 },
  removeText: { fontSize: 18, fontWeight: '700' },
})
