/**
 * Aktuality — news feed s 3 zobrazeniami + vyhľadávanie + filter kategórie.
 *
 *   Search:  TextInput hore (Icon search), filtruje title + perex
 *   Filter:  chips s kategóriami (farba podľa kategórie)
 *   View:    list / grid / month toggle (Icon)
 *
 * Plne theme-aware, jednotný Icon systém, farebné gradientové placeholdery.
 */

import { AppHeader } from '@/components/AppHeader'
import { AnimatedEntrance, AtmosphereBackground, Badge, EmptyState, Icon, IconName, IconTile, PressableScale } from '@/components/ui'
import { katLabel, katTone, katVisual } from '@/src/config/kategorie'
import { useAktuality } from '@/src/hooks/useAktuality'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const KATEGORIE_FILTER = ['oznam', 'akcia', 'uzavierka', 'vypadok', 'sport', 'ine']

type ViewMode = 'list' | 'grid' | 'month'
type AktualitaItem = ReturnType<typeof useAktuality>['aktuality'][number]
const MODES: { id: ViewMode; label: string; icon: IconName }[] = [
  { id: 'list',  label: 'Zoznam', icon: 'list' },
  { id: 'grid',  label: 'Grid',   icon: 'grid' },
  { id: 'month', label: 'Mesiac', icon: 'podujatia' },
]

export default function AktualityScreen() {
  const t = useThemeColors()
  const { aktuality, loading, error, refresh } = useAktuality()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [activeKat, setActiveKat] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  const filtrovane = useMemo(() => {
    const q = search.trim().toLowerCase()
    return aktuality.filter(a => {
      if (activeKat && a.kategoria !== activeKat) return false
      if (q) {
        const inTitle = a.title?.toLowerCase().includes(q)
        const inPerex = a.perex?.toLowerCase().includes(q)
        if (!inTitle && !inPerex) return false
      }
      return true
    })
  }, [aktuality, search, activeKat])

  const podlaMesiaca = useMemo(() => {
    return filtrovane.reduce((acc, a) => {
      const mesiac = a.published_at
        ? new Date(a.published_at).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' })
        : 'Bez dátumu'
      const key = mesiac.charAt(0).toUpperCase() + mesiac.slice(1)
      if (!acc[key]) acc[key] = []
      acc[key].push(a)
      return acc
    }, {} as Record<string, AktualitaItem[]>)
  }, [filtrovane])

  const hasFilter = search.trim().length > 0 || activeKat !== null

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]} edges={['top']}>
      <AtmosphereBackground />
      <AppHeader title="Aktuality" subtitle="Čo nové v obci" />

      {!loading && !error && aktuality.length > 0 && (
        <View style={[styles.filterWrap, { backgroundColor: t.surface, borderBottomColor: t.borderLight }]}>
          {/* Search */}
          <View style={[styles.searchRow, { backgroundColor: t.surfaceAlt }]}>
            <Icon name="search" size={18} color={t.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: t.text }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Hľadať v aktualitách…"
              placeholderTextColor={t.textPlaceholder}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <PressableScale
                onPress={() => setSearch('')}
                style={[styles.searchClear, { backgroundColor: t.border }]}
                scaleTo={0.9}
                accessibilityLabel="Vymazať hľadanie"
              >
                <Icon name="close" size={13} color={t.textSecondary} />
              </PressableScale>
            )}
          </View>

          {/* Kategória chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <Chip label="Všetko" active={!activeKat} color={t.primary} onPress={() => setActiveKat(null)} />
            {KATEGORIE_FILTER.map(k => (
              <Chip
                key={k}
                label={katLabel(k)}
                active={activeKat === k}
                color={katVisual(k).color}
                onPress={() => setActiveKat(activeKat === k ? null : k)}
              />
            ))}
          </ScrollView>

          {/* Mode bar */}
          <View style={styles.modeBar}>
            {MODES.map(m => {
              const active = viewMode === m.id
              return (
                <PressableScale
                  key={m.id}
                  style={[
                    styles.modeBtn,
                    { backgroundColor: t.surfaceAlt, borderColor: 'transparent' },
                    active && { backgroundColor: t.primaryLight, borderColor: t.primary },
                  ]}
                  scaleTo={0.96}
                  onPress={() => setViewMode(m.id)}
                  accessibilityLabel={`Zobrazenie: ${m.label}`}
                >
                  <Icon name={m.icon} size={15} color={active ? t.primary : t.textMuted} />
                  <Text style={[styles.modeBtnText, { color: active ? t.primary : t.textMuted }]}>{m.label}</Text>
                </PressableScale>
              )
            })}
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.primary} />
          <Text style={[styles.loadingText, { color: t.textMuted }]}>Načítavam…</Text>
        </View>
      )}

      {error && (
        <View style={styles.centerPad}>
          <EmptyState icon="info" title="Nepodarilo sa načítať aktuality" description="Skontrolujte pripojenie a skúste to znova." actionLabel="Skúsiť znova" onAction={handleRefresh} />
        </View>
      )}

      {!loading && !error && aktuality.length > 0 && filtrovane.length === 0 && (
        <View style={styles.centerPad}>
          <EmptyState
            icon="search"
            title="Nič sa nenašlo"
            description="Skús zmeniť hľadaný výraz alebo zrušiť filter kategórie."
            actionLabel={hasFilter ? 'Zrušiť filter' : undefined}
            onAction={hasFilter ? () => { setSearch(''); setActiveKat(null) } : undefined}
          />
        </View>
      )}

      {!loading && !error && aktuality.length === 0 && (
        <View style={styles.centerPad}>
          <EmptyState icon="aktuality" title="Žiadne aktuality" description="Momentálne nie sú zverejnené žiadne aktuality. Pozrite sa neskôr." />
        </View>
      )}

      {/* LIST */}
      {!loading && !error && filtrovane.length > 0 && viewMode === 'list' && (
        <FlatList
          data={filtrovane}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.primary} />}
          renderItem={({ item }) => <ListCard item={item} onPress={() => router.push(`/aktualita/${item.id}` as never)} />}
        />
      )}

      {/* GRID */}
      {!loading && !error && filtrovane.length > 0 && viewMode === 'grid' && (
        <FlatList
          data={filtrovane}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={{ gap: spacing.md }}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.primary} />}
          renderItem={({ item }) => <GridCard item={item} onPress={() => router.push(`/aktualita/${item.id}` as never)} />}
        />
      )}

      {/* MONTH */}
      {!loading && !error && filtrovane.length > 0 && viewMode === 'month' && (
        <ScrollView
          contentContainerStyle={styles.monthScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.primary} />}
        >
          {Object.entries(podlaMesiaca).map(([mesiac, items]) => (
            <View key={mesiac} style={styles.monthGroup}>
              <View style={styles.monthHeader}>
                <View style={[styles.monthLine, { backgroundColor: t.border }]} />
                <Text style={[styles.monthLabel, { color: t.textMuted }]}>{mesiac}</Text>
                <View style={[styles.monthLine, { backgroundColor: t.border }]} />
              </View>
              {items.map(item => (
                <ListCard key={item.id} item={item} onPress={() => router.push(`/aktualita/${item.id}` as never)} />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

// ─── Chip ─────────────────────────────────────────────────────────────────
function Chip({ label, active, color, onPress }: { label: string; active: boolean; color: string; onPress: () => void }) {
  const t = useThemeColors()
  return (
    <PressableScale
      style={[
        styles.chip,
        { backgroundColor: t.surface, borderColor: t.border },
        active && { backgroundColor: color + '1A', borderColor: color },
      ]}
      scaleTo={0.95}
      onPress={onPress}
      accessibilityLabel={label}
    >
      <Text style={[styles.chipText, { color: active ? color : t.textSecondary }]}>{label}</Text>
    </PressableScale>
  )
}

// ─── List card ──────────────────────────────────────────────────────────────
function ListCard({ item, onPress }: { item: AktualitaItem; onPress: () => void }) {
  const t = useThemeColors()
  const vis = katVisual(item.kategoria)
  return (
    <AnimatedEntrance>
    <PressableScale style={[styles.card, { backgroundColor: t.surface, shadowColor: t.shadow }]} onPress={onPress} accessibilityLabel={item.title}>
      {item.cover_url ? (
        <Image source={{ uri: item.cover_url }} style={styles.cover} contentFit="cover" transition={250} />
      ) : (
        <IconTile name={vis.icon} gradient={vis.gradient} cornerRadius={0} style={styles.coverPlaceholder} iconSize={56} />
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Badge label={katLabel(item.kategoria)} tone={katTone(item.kategoria)} />
          <Text style={[styles.datum, { color: t.textPlaceholder }]}>
            {item.published_at ? new Date(item.published_at).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
          </Text>
        </View>
        <Text style={[styles.cardTitle, { color: t.text }]}>{item.title}</Text>
        {item.perex && <Text style={[styles.cardPerex, { color: t.textSecondary }]} numberOfLines={2}>{item.perex}</Text>}
        <View style={[styles.cardFooter, { borderTopColor: t.divider }]}>
          <Text style={[styles.readMore, { color: t.primary }]}>Čítať viac</Text>
          <Icon name="arrowRight" size={14} color={t.primary} />
        </View>
      </View>
    </PressableScale>
    </AnimatedEntrance>
  )
}

// ─── Grid card ────────────────────────────────────────────────────────────
function GridCard({ item, onPress }: { item: AktualitaItem; onPress: () => void }) {
  const t = useThemeColors()
  const vis = katVisual(item.kategoria)
  return (
    <PressableScale style={[styles.gridCard, { backgroundColor: t.surface, shadowColor: t.shadow }]} onPress={onPress} accessibilityLabel={item.title}>
      {item.cover_url ? (
        <Image source={{ uri: item.cover_url }} style={styles.gridCover} contentFit="cover" transition={250} />
      ) : (
        <IconTile name={vis.icon} gradient={vis.gradient} cornerRadius={0} style={styles.gridCover} iconSize={40} />
      )}
      <View style={styles.gridBody}>
        <Badge label={katLabel(item.kategoria)} tone={katTone(item.kategoria)} />
        <Text style={[styles.gridTitle, { color: t.text }]} numberOfLines={3}>{item.title}</Text>
      </View>
    </PressableScale>
  )
}

// ─── Štýly ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  centerPad: { flex: 1, justifyContent: 'center' },
  loadingText: { ...typo.caption, marginTop: spacing.sm },

  filterWrap: { borderBottomWidth: 1 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  searchClear: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },

  chipsRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1.5 },
  chipText: { fontSize: 12, fontWeight: '700' },

  modeBar: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  modeBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5,
    paddingVertical: spacing.sm, borderRadius: radius.sm, borderWidth: 1,
  },
  modeBtnText: { fontSize: 12, fontWeight: '700' },

  list: { padding: spacing.lg, gap: spacing.lg },
  card: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.lg, ...shadows.md },
  cover: { width: '100%', height: 190 },
  coverPlaceholder: { width: '100%', height: 190, borderRadius: 0 },
  cardBody: { padding: spacing.lg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  datum: { ...typo.caption },
  cardTitle: { ...typo.h2, marginBottom: 6 },
  cardPerex: { ...typo.body, marginBottom: spacing.md },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, paddingTop: spacing.md },
  readMore: { ...typo.captionB },

  gridContent: { padding: spacing.lg, gap: spacing.md },
  gridCard: { flex: 1, borderRadius: radius.lg, overflow: 'hidden', ...shadows.sm },
  gridCover: { width: '100%', height: 110, borderRadius: 0 },
  gridBody: { padding: spacing.md, gap: 6 },
  gridTitle: { ...typo.captionB, fontSize: 13, lineHeight: 17 },

  monthScroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  monthGroup: { marginBottom: spacing.sm },
  monthHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md, marginTop: 4 },
  monthLine: { flex: 1, height: 1 },
  monthLabel: { ...typo.label },
})
