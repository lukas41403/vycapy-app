/**
 * Farské oznamy — kedy je omša, kto umrel, krsty, sobáše, ohlášky.
 *
 * Filter chipy:
 *   - Všetko | Omše | Smútok | Krsty / Sobáše | Iné oznamy
 *
 * Empty state: ak DB tabuľka chýba alebo je prázdna, zobrazí návod
 * pre obec ako pridať dáta.
 */

import { AppHeader } from '@/components/AppHeader'
import { Badge, Card, EmptyState, Skeleton } from '@/components/ui'
import { useTenant } from '@/src/config/tenant'
import {
  FARSKY_TYP_EMOJI,
  FARSKY_TYP_LABEL,
  FARSKY_TYP_TONE,
  FarskyOznam,
  FarskyTypOznamu,
  useFarskeOznamy,
} from '@/src/hooks/useFarskeOznamy'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, spacing, typo } from '@/src/theme/tokens'
import { useMemo, useState } from 'react'
import {
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const FILTRE: { id: 'vsetko' | FarskyTypOznamu; label: string }[] = [
  { id: 'vsetko',  label: 'Všetko' },
  { id: 'omsa',    label: 'Omše' },
  { id: 'smutok',  label: 'Smútočné' },
  { id: 'krst',    label: 'Krsty' },
  { id: 'sobas',   label: 'Sobáše' },
  { id: 'ohlaska', label: 'Ohlášky' },
  { id: 'oznam',   label: 'Oznamy' },
]

function formatDatum(iso: string | null, full = false): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (full) {
    return d.toLocaleDateString('sk-SK', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }
  return d.toLocaleDateString('sk-SK', {
    weekday: 'short', day: 'numeric', month: 'long',
  })
}

function formatCas(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })
}

export default function FarskeOznamyScreen() {
  const t = useThemeColors()
  const tenant = useTenant()
  const { oznamy, loading, error, refresh } = useFarskeOznamy()
  const [filter, setFilter] = useState<'vsetko' | FarskyTypOznamu>('vsetko')
  const [refreshing, setRefreshing] = useState(false)

  const farskaSluzba = tenant.sluzby.find(s => s.kategoria === 'farsky')

  const filtrovane = useMemo(() => {
    if (filter === 'vsetko') return oznamy
    return oznamy.filter(o => o.typ === filter)
  }, [oznamy, filter])

  async function handleRefresh() {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={t.surface} />
      <AppHeader title="Farské oznamy" subtitle="Omše, smútočné, ohlášky" />

      {/* Najbližšia omša (z tenant configu) */}
      {farskaSluzba && (
        <View style={[styles.dnesBox, { backgroundColor: t.surface, borderBottomColor: t.borderLight }]}>
          <NajblizsiaOmsa />
        </View>
      )}

      {/* Filter chips */}
      <View style={[styles.filterWrap, { backgroundColor: t.surface, borderBottomColor: t.borderLight }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTRE.map(f => {
            const active = filter === f.id
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.chip,
                  { backgroundColor: t.surfaceAlt, borderColor: t.border },
                  active && { backgroundColor: t.primaryLight, borderColor: t.primary },
                ]}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[
                  styles.chipText,
                  { color: t.textSecondary },
                  active && { color: t.primary, fontWeight: '900' },
                ]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={t.primary}
            colors={[t.primary]}
          />
        }
      >
        {loading ? (
          <>
            <Skeleton height={80} radius={radius.md} style={{ marginBottom: spacing.md }} />
            <Skeleton height={80} radius={radius.md} style={{ marginBottom: spacing.md }} />
            <Skeleton height={80} radius={radius.md} />
          </>
        ) : filtrovane.length === 0 ? (
          <EmptyState
            icon="⛪"
            title={error ? 'Farské oznamy zatiaľ neaktívne' : 'Žiadne oznamy'}
            description={
              error
                ? 'Obec ešte nevytvorila tabuľku farských oznamov. Po doplnení DB skriptu z `useFarskeOznamy.ts` bude funkcionalita aktívna a referenti obce ich budú môcť pridávať z admin panelu.'
                : filter === 'vsetko'
                  ? 'Aktuálne nie sú zverejnené žiadne farské oznamy.'
                  : 'V tejto kategórii zatiaľ nič nie je.'
            }
            actionLabel={farskaSluzba?.web ? 'Otvoriť fara.sk' : undefined}
            onAction={farskaSluzba?.web ? () => Linking.openURL(farskaSluzba.web!) : undefined}
          />
        ) : (
          filtrovane.map(o => <OznamKarta key={o.id} oznam={o} />)
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Najbližšia omša (z tenant configu) ───────────────────────────────────
function NajblizsiaOmsa() {
  const t = useThemeColors()
  const tenant = useTenant()
  const fara = tenant.sluzby.find(s => s.kategoria === 'farsky')
  if (!fara?.hodiny) return null

  const dni = ['nedela','pondelok','utorok','streda','stvrtok','piatok','sobota'] as const
  const today = dni[new Date().getDay()]

  // Nájdi najbližší deň s omšou (od dnes, max 7 dní dopredu)
  let najblizsi: { den: string; hodiny: string; jeDnes: boolean; jeZajtra: boolean } | null = null
  for (let i = 0; i < 7; i++) {
    const idx = (new Date().getDay() + i) % 7
    const key = dni[idx]
    const rec = fara.hodiny.find(h => h.den === key)
    if (rec?.hodiny) {
      najblizsi = {
        den: key,
        hodiny: rec.hodiny,
        jeDnes: i === 0,
        jeZajtra: i === 1,
      }
      break
    }
  }
  if (!najblizsi) return null

  const denLabel: Record<string, string> = {
    pondelok:'Pondelok', utorok:'Utorok', streda:'Streda',
    stvrtok:'Štvrtok', piatok:'Piatok', sobota:'Sobota', nedela:'Nedeľa',
  }
  const hlavny = najblizsi.jeDnes ? 'Dnes' : najblizsi.jeZajtra ? 'Zajtra' : denLabel[najblizsi.den]

  return (
    <View style={styles.omsaCard}>
      <Text style={styles.omsaEmoji}>🙏</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.omsaLabel, { color: t.textMuted }]}>NAJBLIŽŠIA SV. OMŠA</Text>
        <Text style={[styles.omsaHlavny, { color: t.text }]}>
          {hlavny} · {najblizsi.hodiny}
        </Text>
      </View>
    </View>
  )
}

// ─── Karta oznamu ─────────────────────────────────────────────────────────
function OznamKarta({ oznam }: { oznam: FarskyOznam }) {
  const t = useThemeColors()
  const cas = formatCas(oznam.datum_od)

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Card padding={0}>
        <View style={styles.oznamObsah}>
          <View style={[styles.oznamIkonaBox, { backgroundColor: t.surfaceAlt }]}>
            <Text style={styles.oznamIkona}>{FARSKY_TYP_EMOJI[oznam.typ]}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.oznamTopRow}>
              <Badge
                label={FARSKY_TYP_LABEL[oznam.typ]}
                tone={FARSKY_TYP_TONE[oznam.typ]}
              />
              {cas && (
                <Text style={[styles.oznamCas, { color: t.primary }]}>
                  {cas}
                </Text>
              )}
            </View>
            <Text style={[styles.oznamNazov, { color: t.text }]}>
              {oznam.nazov}
            </Text>
            {oznam.popis && (
              <Text style={[styles.oznamPopis, { color: t.textSecondary }]}>
                {oznam.popis}
              </Text>
            )}
            <View style={styles.oznamMeta}>
              {oznam.datum_od && (
                <Text style={[styles.oznamMetaText, { color: t.textMuted }]}>
                  📅 {formatDatum(oznam.datum_od)}
                </Text>
              )}
              {oznam.miesto && (
                <Text style={[styles.oznamMetaText, { color: t.textMuted }]}>
                  📍 {oznam.miesto}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  dnesBox: { borderBottomWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  omsaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  omsaEmoji: { fontSize: 32 },
  omsaLabel: { ...typo.label, marginBottom: 2 },
  omsaHlavny: { ...typo.h3 },

  filterWrap: { borderBottomWidth: 1, paddingVertical: spacing.sm },
  filterRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  chipText: { ...typo.caption, fontWeight: '700' },

  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },

  oznamObsah: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  oznamIkonaBox: {
    width: 50, height: 50, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  oznamIkona: { fontSize: 26 },
  oznamTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  oznamCas: { ...typo.captionB },
  oznamNazov: { ...typo.h3, marginTop: 2 },
  oznamPopis: { ...typo.caption, marginTop: 2 },
  oznamMeta: { flexDirection: 'row', gap: spacing.md, marginTop: 6, flexWrap: 'wrap' },
  oznamMetaText: { ...typo.micro },
})
