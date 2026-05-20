/**
 * Aktuality — news feed s 3 zobrazeniami:
 *   - list  (default): veľké karty s cover fotkou
 *   - grid:  2-stĺpcový grid s thumbnail
 *   - month: zoskupenie podľa mesiaca
 */

import { AppHeader } from '@/components/AppHeader'
import { C } from '@/constants/colors'
import { useAktuality } from '@/src/hooks/useAktuality'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const KATEGORIA_FARBY: Record<string, { bg: string; text: string }> = {
  oznam:     { bg: C.status.info.bg,    text: C.status.info.fg },
  akcia:     { bg: C.status.success.bg, text: C.status.success.fg },
  uzavierka: { bg: '#FFF3E0',           text: '#E65100' },
  vypadok:   { bg: C.status.danger.bg,  text: C.status.danger.fg },
  sport:     { bg: '#E3F2FD',           text: '#1565C0' },
  ine:       { bg: '#ECEFF1',           text: '#37474F' },
}

const KATEGORIA_LABEL: Record<string, string> = {
  oznam: 'Oznam', akcia: 'Akcia', uzavierka: 'Uzávierka',
  vypadok: 'Výpadok', sport: 'Šport', ine: 'Iné',
}

const KATEGORIA_PLACEHOLDER: Record<string, { bg: string; emoji: string }> = {
  oznam:     { bg: '#90A4AE', emoji: '📋' },
  akcia:     { bg: '#1B5E20', emoji: '🎉' },
  uzavierka: { bg: '#C62828', emoji: '🚧' },
  vypadok:   { bg: '#C62828', emoji: '⚠️' },
  sport:     { bg: '#1565C0', emoji: '⚽' },
  ine:       { bg: '#607D8B', emoji: '📰' },
}

type ViewMode = 'list' | 'grid' | 'month'
type AktualitaItem = ReturnType<typeof useAktuality>['aktuality'][number]

export default function AktualityScreen() {
  const { aktuality, loading, error } = useAktuality()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  // Zoskupenie podľa mesiaca pre month view
  const podlaMesiaca = useMemo(() => {
    const grouped = aktuality.reduce((acc, a) => {
      const mesiac = a.published_at
        ? new Date(a.published_at).toLocaleDateString('sk-SK', {
            month: 'long', year: 'numeric',
          })
        : 'Bez dátumu'
      const key = mesiac.charAt(0).toUpperCase() + mesiac.slice(1)
      if (!acc[key]) acc[key] = []
      acc[key].push(a)
      return acc
    }, {} as Record<string, AktualitaItem[]>)
    return grouped
  }, [aktuality])

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <AppHeader title="Aktuality" subtitle="Čo nové v obci" />

      {/* Prepínač zobrazenia */}
      {!loading && !error && aktuality.length > 0 && (
        <View style={styles.modeBar}>
          <ModeBtn
            label="☰ Zoznam"
            active={viewMode === 'list'}
            onPress={() => setViewMode('list')}
          />
          <ModeBtn
            label="⊞ Grid"
            active={viewMode === 'grid'}
            onPress={() => setViewMode('grid')}
          />
          <ModeBtn
            label="📅 Mesiac"
            active={viewMode === 'month'}
            onPress={() => setViewMode('month')}
          />
        </View>
      )}

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Načítavam...</Text>
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Nepodarilo sa načítať aktuality</Text>
        </View>
      )}

      {!loading && !error && aktuality.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Žiadne aktuality</Text>
          <Text style={styles.emptyText}>
            Momentálne nie sú zverejnené žiadne aktuality. Pozrite sa neskôr.
          </Text>
        </View>
      )}

      {/* LIST */}
      {!loading && !error && aktuality.length > 0 && viewMode === 'list' && (
        <FlatList
          data={aktuality}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ListCard item={item} router={router} />}
        />
      )}

      {/* GRID */}
      {!loading && !error && aktuality.length > 0 && viewMode === 'grid' && (
        <FlatList
          data={aktuality}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={{ gap: 12 }}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <GridCard item={item} router={router} />}
        />
      )}

      {/* MONTH */}
      {!loading && !error && aktuality.length > 0 && viewMode === 'month' && (
        <ScrollView
          contentContainerStyle={styles.monthScroll}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(podlaMesiaca).map(([mesiac, items]) => (
            <View key={mesiac} style={styles.monthGroup}>
              <View style={styles.monthHeader}>
                <View style={styles.monthLine} />
                <Text style={styles.monthLabel}>{mesiac}</Text>
                <View style={styles.monthLine} />
              </View>
              {items.map(item => <ListCard key={item.id} item={item} router={router} />)}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

// ─── Mode button ────────────────────────────────────────────────────────────
function ModeBtn({ label, active, onPress }: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.modeBtn, active && styles.modeBtnActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

// ─── List card (default) ────────────────────────────────────────────────────
function ListCard({ item, router }: { item: AktualitaItem; router: any }) {
  const kat = KATEGORIA_FARBY[item.kategoria] ?? KATEGORIA_FARBY.ine
  const placeholder = KATEGORIA_PLACEHOLDER[item.kategoria] ?? KATEGORIA_PLACEHOLDER.ine
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/aktualita/${item.id}`)}
    >
      {item.cover_url ? (
        <Image
          source={{ uri: item.cover_url }}
          style={styles.cover}
          contentFit="cover"
          transition={250}
        />
      ) : (
        <View style={[styles.coverPlaceholder, { backgroundColor: placeholder.bg }]}>
          <Text style={styles.coverEmoji}>{placeholder.emoji}</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.badge, { backgroundColor: kat.bg }]}>
            <Text style={[styles.badgeText, { color: kat.text }]}>
              {KATEGORIA_LABEL[item.kategoria] ?? item.kategoria}
            </Text>
          </View>
          <Text style={styles.datum}>
            {item.published_at
              ? new Date(item.published_at).toLocaleDateString('sk-SK', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })
              : ''}
          </Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.perex && (
          <Text style={styles.cardPerex} numberOfLines={2}>{item.perex}</Text>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.readMore}>Čítať viac →</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ─── Grid card (2 stĺpce) ───────────────────────────────────────────────────
function GridCard({ item, router }: { item: AktualitaItem; router: any }) {
  const kat = KATEGORIA_FARBY[item.kategoria] ?? KATEGORIA_FARBY.ine
  const placeholder = KATEGORIA_PLACEHOLDER[item.kategoria] ?? KATEGORIA_PLACEHOLDER.ine
  return (
    <TouchableOpacity
      style={styles.gridCard}
      activeOpacity={0.85}
      onPress={() => router.push(`/aktualita/${item.id}`)}
    >
      {item.cover_url ? (
        <Image
          source={{ uri: item.cover_url }}
          style={styles.gridCover}
          contentFit="cover"
          transition={250}
        />
      ) : (
        <View style={[styles.gridCover, { backgroundColor: placeholder.bg, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 36, opacity: 0.9 }}>{placeholder.emoji}</Text>
        </View>
      )}
      <View style={styles.gridBody}>
        <View style={[styles.gridBadge, { backgroundColor: kat.bg }]}>
          <Text style={[styles.gridBadgeText, { color: kat.text }]}>
            {KATEGORIA_LABEL[item.kategoria] ?? item.kategoria}
          </Text>
        </View>
        <Text style={styles.gridTitle} numberOfLines={3}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  )
}

// ─── Štýly ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingText: { color: C.textMuted, fontSize: 14, marginTop: 8 },
  errorIcon: { fontSize: 36 },
  errorText: { color: '#C62828', fontSize: 15 },

  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 40, gap: 8,
  },
  emptyIcon: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  emptyText: {
    fontSize: 14, color: C.textMuted, textAlign: 'center',
    lineHeight: 20, marginTop: 4,
  },

  // Mode bar
  modeBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeBtnActive: {
    backgroundColor: C.primaryLight,
    borderColor: C.primary,
  },
  modeBtnText: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  modeBtnTextActive: { color: C.primary },

  // LIST
  list: { padding: 16, gap: 16 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
  },
  cover: { width: '100%', height: 200, backgroundColor: C.surfaceAlt },
  coverPlaceholder: {
    width: '100%', height: 200,
    justifyContent: 'center', alignItems: 'center',
  },
  coverEmoji: { fontSize: 72, opacity: 0.9 },

  cardBody: { padding: 16 },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  datum: { fontSize: 12, color: C.textPlaceholder },

  cardTitle: {
    fontSize: 18, fontWeight: '800', color: C.text,
    lineHeight: 24, marginBottom: 6, letterSpacing: -0.2,
  },
  cardPerex: { fontSize: 14, color: C.textSecondary, lineHeight: 20, marginBottom: 12 },
  cardFooter: { borderTopWidth: 1, borderTopColor: C.divider, paddingTop: 10 },
  readMore: { fontSize: 13, fontWeight: '700', color: C.primary },

  // GRID
  gridContent: { padding: 16, gap: 12 },
  gridCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gridCover: { width: '100%', height: 110, backgroundColor: C.surfaceAlt },
  gridBody: { padding: 10, gap: 6 },
  gridBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  gridBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  gridTitle: {
    fontSize: 13, fontWeight: '700', color: C.text,
    lineHeight: 17,
  },

  // MONTH
  monthScroll: { padding: 16, paddingBottom: 24 },
  monthGroup: { marginBottom: 8 },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  monthLine: { flex: 1, height: 1, backgroundColor: C.border },
  monthLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
})
