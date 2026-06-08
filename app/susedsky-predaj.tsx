/**
 * Susedský predaj — bazár medzi občanmi obce.
 *
 * Zoznam inzerátov s filtrami:
 *   - Typ: Všetko / Predám / Kúpim / Zadarmo / Hľadám
 *   - Kategória: chips
 *   - Search box
 *
 * Floating tlačidlo "+ Pridať inzerát"
 */

import { AppHeader } from '@/components/AppHeader'
import { Badge, Card, EmptyState, SkeletonCard } from '@/components/ui'
import {
  INZERAT_KATEGORIE,
  INZERAT_TYPY,
  Inzerat,
  InzeratTyp,
  useSusedskyPredaj,
} from '@/src/hooks/useSusedskyPredaj'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

const FARBA_SUSED = '#AD1457'

function formatCena(inz: Inzerat): string {
  if (inz.typ === 'zadarmo') return 'Zadarmo'
  if (inz.typ === 'kupim' || inz.typ === 'hladam') return 'Hľadá sa'
  if (inz.cena == null) return 'Dohodou'
  return `${inz.cena.toLocaleString('sk-SK')} ${inz.mena ?? 'EUR'}`
}

function relTime(iso: string): string {
  const d = new Date(iso)
  const min = Math.round((Date.now() - d.getTime()) / 60000)
  if (min < 1) return 'práve teraz'
  if (min < 60) return `pred ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `pred ${h} h`
  const days = Math.round(h / 24)
  if (days === 1) return 'včera'
  if (days < 7) return `pred ${days} dňami`
  return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' })
}

export default function SusedskyPredajScreen() {
  const router = useRouter()
  const t = useThemeColors()
  const { inzeraty, loading, refresh } = useSusedskyPredaj()

  const [typFilter, setTypFilter] = useState<InzeratTyp | 'vsetko'>('vsetko')
  const [katFilter, setKatFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return inzeraty.filter(i => {
      if (typFilter !== 'vsetko' && i.typ !== typFilter) return false
      if (katFilter && i.kategoria !== katFilter) return false
      if (q) {
        const inNazov = i.nazov.toLowerCase().includes(q)
        const inPopis = i.popis?.toLowerCase().includes(q)
        if (!inNazov && !inPopis) return false
      }
      return true
    })
  }, [inzeraty, typFilter, katFilter, search])

  async function handleRefresh() {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={t.surface} />
      <AppHeader title="🛒 Susedský predaj" subtitle="Bazár medzi občanmi obce" />

      {/* Search + filter */}
      <View style={[styles.filterWrap, { backgroundColor: t.surface, borderBottomColor: t.borderLight }]}>
        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: t.surfaceAlt }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: t.text }]}
            placeholder="Hľadať v inzerátoch..."
            placeholderTextColor={t.textPlaceholder}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Text style={[styles.searchClear, { color: t.textMuted }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Typ chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <TypChip
            label="Všetko"
            emoji="📋"
            farba={FARBA_SUSED}
            active={typFilter === 'vsetko'}
            onPress={() => setTypFilter('vsetko')}
          />
          {INZERAT_TYPY.map(typ => (
            <TypChip
              key={typ.id}
              label={typ.label}
              emoji={typ.emoji}
              farba={typ.farba}
              active={typFilter === typ.id}
              onPress={() => setTypFilter(typ.id)}
            />
          ))}
        </ScrollView>

        {/* Kategória chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <TouchableOpacity
            style={[
              styles.katChip,
              { borderColor: t.border, backgroundColor: t.surfaceAlt },
              !katFilter && { backgroundColor: FARBA_SUSED, borderColor: FARBA_SUSED },
            ]}
            onPress={() => setKatFilter(null)}
          >
            <Text style={[styles.katChipText, { color: t.textSecondary }, !katFilter && { color: '#FFFFFF', fontWeight: '900' }]}>
              Všetky kategórie
            </Text>
          </TouchableOpacity>
          {INZERAT_KATEGORIE.map(k => (
            <TouchableOpacity
              key={k.id}
              style={[
                styles.katChip,
                { borderColor: t.border, backgroundColor: t.surfaceAlt },
                katFilter === k.id && { backgroundColor: FARBA_SUSED, borderColor: FARBA_SUSED },
              ]}
              onPress={() => setKatFilter(katFilter === k.id ? null : k.id)}
            >
              <Text style={[
                styles.katChipText,
                { color: t.textSecondary },
                katFilter === k.id && { color: '#FFFFFF', fontWeight: '900' },
              ]}>
                {k.emoji} {k.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Obsah */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={FARBA_SUSED} colors={[FARBA_SUSED]} />
        }
      >
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={inzeraty.length === 0 ? '📭' : '🔍'}
            title={inzeraty.length === 0 ? 'Žiadne inzeráty' : 'Nič sa nenašlo'}
            description={
              inzeraty.length === 0
                ? 'Buďte prvý a pridajte inzerát. Ostatní občania ho hneď uvidia.'
                : 'Skúste zmeniť filter alebo vyhľadávanie.'
            }
            actionLabel="+ Pridať inzerát"
            onAction={() => router.push('/susedsky-predaj/novy' as never)}
          />
        ) : (
          filtered.map(inz => <InzeratKarta key={inz.id} inz={inz} router={router} />)
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: FARBA_SUSED }]}
        onPress={() => router.push('/susedsky-predaj/novy' as never)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Pridať nový inzerát"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

function TypChip({ label, emoji, farba, active, onPress }: {
  label: string; emoji: string; farba: string; active: boolean; onPress: () => void
}) {
  const t = useThemeColors()
  return (
    <TouchableOpacity
      style={[
        styles.typChip,
        { borderColor: t.border, backgroundColor: t.surface },
        active && { backgroundColor: farba, borderColor: farba },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.typChipText, { color: t.textSecondary }, active && { color: '#FFFFFF', fontWeight: '900' }]}>
        {emoji} {label}
      </Text>
    </TouchableOpacity>
  )
}

function InzeratKarta({ inz, router }: { inz: Inzerat; router: any }) {
  const t = useThemeColors()
  const typMeta = INZERAT_TYPY.find(x => x.id === inz.typ)!
  const katMeta = INZERAT_KATEGORIE.find(k => k.id === inz.kategoria)
  const fotka = inz.foto_urls?.[0]

  return (
    <Card onPress={() => router.push(`/inzerat/${inz.id}` as never)} padding={0} style={{ marginBottom: spacing.md }}>
      <View style={styles.kartaObsah}>
        {fotka ? (
          <Image source={{ uri: fotka }} style={styles.fotka} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.fotka, styles.fotkaPlaceholder, { backgroundColor: typMeta.farba + '22' }]}>
            <Text style={{ fontSize: 36 }}>{katMeta?.emoji ?? typMeta.emoji}</Text>
          </View>
        )}
        <View style={{ flex: 1, padding: spacing.md, gap: 4 }}>
          <View style={styles.kartaTop}>
            <Badge label={typMeta.label} tone="info" style={{ backgroundColor: typMeta.farba + '22' }} textStyle={{ color: typMeta.farba }} />
            {inz.stav === 'rezervovane' && (
              <Badge label="Rezervované" tone="warning" />
            )}
          </View>
          <Text style={[styles.nazov, { color: t.text }]} numberOfLines={2}>{inz.nazov}</Text>
          <Text style={[styles.cena, { color: typMeta.farba }]}>{formatCena(inz)}</Text>
          <View style={styles.metaRow}>
            {katMeta && (
              <Text style={[styles.metaText, { color: t.textMuted }]}>
                {katMeta.emoji} {katMeta.label}
              </Text>
            )}
            <Text style={[styles.metaText, { color: t.textPlaceholder }]}>
              {relTime(inz.created_at)}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  filterWrap: { borderBottomWidth: 1, gap: 8, paddingBottom: 8 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md, height: 42,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14 },
  searchClear: { fontSize: 14, fontWeight: '700' },

  chipsRow: { paddingHorizontal: spacing.md, gap: 6, paddingVertical: 6 },
  typChip: {
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.pill, borderWidth: 1.5,
  },
  typChipText: { fontSize: 12, fontWeight: '700' },
  katChip: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill, borderWidth: 1.5,
  },
  katChipText: { fontSize: 11, fontWeight: '700' },

  scroll: { padding: spacing.lg, paddingBottom: 100 },

  kartaObsah: { flexDirection: 'row', alignItems: 'stretch' },
  fotka: { width: 110, height: 110, backgroundColor: '#EEE' },
  fotkaPlaceholder: { justifyContent: 'center', alignItems: 'center' },

  kartaTop: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  nazov: { ...typo.h3 },
  cena: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  metaText: { fontSize: 11, fontWeight: '700' },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    ...shadows.lg,
  },
  fabText: { color: '#FFFFFF', fontSize: 36, fontWeight: '300', marginTop: -4 },
})
