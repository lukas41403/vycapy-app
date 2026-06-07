/**
 * Voľný čas v okolí — mapa s rádiusom + zoznam aktivít.
 *
 * Filtre:
 *   - Rádius: 10 km / 20 km / 50 km
 *   - Kategória: Všetko, Cyklotrasy, Turistika, Pre deti, Wellness,
 *     Kultúra, Príroda, Šport
 *
 * Mapa:
 *   - LeafletMap so zobrazením kruhu okolo obce
 *   - Pins iba pre miesta vnútri rádia
 *   - Klik na pin → posun zoznamu na danú položku
 *
 * Zoznam pod mapou:
 *   - Karta každého miesta: emoji, názov, podtitul, vzdialenosť, tagy
 *   - Klik → otvorí inline detail s popisom + tlačidlami (Navigovať, Web)
 */

import LeafletMap, { LeafletCircle, LeafletMarker } from '@/components/LeafletMap'
import { AtmosphereBackground, Badge, Card, Icon, IconName, PressableScale } from '@/components/ui'
import {
  useTenant,
  VolnyCasKategoria,
} from '@/src/config/tenant'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius as r, shadows, spacing, typo } from '@/src/theme/tokens'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// ─── Konštanty ────────────────────────────────────────────────────────────
const OKOLIE_MODRA = '#0277BD'

const RADIUSY: { km: number; label: string }[] = [
  { km: 10, label: '10 km' },
  { km: 20, label: '20 km' },
  { km: 50, label: '50 km' },
]

const KAT_META: Record<VolnyCasKategoria | 'vsetko', { label: string; emoji: string; icon: IconName; color: string }> = {
  vsetko:     { label: 'Všetko',       emoji: '🗺️', icon: 'grid',     color: OKOLIE_MODRA },
  cyklotrasa: { label: 'Cyklotrasy',   emoji: '🚴', icon: 'bicycle',  color: '#00838F' },
  turistika:  { label: 'Turistika',    emoji: '🥾', icon: 'walk',     color: '#1B5E20' },
  deti:       { label: 'Pre deti',     emoji: '👶', icon: 'happy',    color: '#F57F17' },
  wellness:   { label: 'Wellness',     emoji: '♨️', icon: 'water',    color: '#AD1457' },
  kultura:    { label: 'Kultúra',      emoji: '🏰', icon: 'sparkles', color: '#5D4037' },
  priroda:    { label: 'Príroda',      emoji: '🌳', icon: 'leaf',     color: '#2E7D32' },
  sport:      { label: 'Šport',        emoji: '⚽', icon: 'fc',       color: '#1565C0' },
  vylet:      { label: 'Výlety',       emoji: '🚌', icon: 'bus2',     color: '#6A1B9A' },
}

// ─── Haversine: vzdialenosť medzi dvomi GPS bodmi v km ───────────────────
function vzdialenostKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371 // polomer Zeme v km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function formatVzdialenost(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

// ─── Komponent ────────────────────────────────────────────────────────────
export default function OkolieScreen() {
  const router = useRouter()
  const t = useThemeColors()
  const tenant = useTenant()

  const [radius, setRadius] = useState<10 | 20 | 50>(20)
  const [kategoria, setKategoria] = useState<VolnyCasKategoria | 'vsetko'>('vsetko')
  const [vybraneId, setVybraneId] = useState<string | null>(null)

  const obecCentrum = tenant.mapaCentrum

  // Vypočítaj vzdialenosti pre všetky miesta
  const miestaSVzdialenost = useMemo(() => {
    return tenant.volnyCasMiesta.map(m => ({
      ...m,
      vzdialenostKm: vzdialenostKm(obecCentrum, m),
    })).sort((a, b) => a.vzdialenostKm - b.vzdialenostKm)
  }, [tenant.volnyCasMiesta, obecCentrum])

  // Filter podľa rádiusu a kategórie
  const filtrovane = useMemo(() => {
    return miestaSVzdialenost.filter(m => {
      if (m.vzdialenostKm > radius) return false
      if (kategoria !== 'vsetko' && m.kategoria !== kategoria) return false
      return true
    })
  }, [miestaSVzdialenost, radius, kategoria])

  // Markers pre mapu
  const markers: LeafletMarker[] = useMemo(() =>
    filtrovane.map(m => {
      const meta = KAT_META[m.kategoria]
      return {
        id: m.id,
        lat: m.lat, lng: m.lng,
        color: meta.color,
        emoji: meta.emoji,
        label: m.nazov,
        active: m.id === vybraneId,
      }
    }),
  [filtrovane, vybraneId])

  // Kruh okolo obce
  const circle: LeafletCircle = useMemo(() => ({
    lat: obecCentrum.lat,
    lng: obecCentrum.lng,
    radiusMeters: radius * 1000,
    color: OKOLIE_MODRA,
    fillOpacity: 0.06,
    dashArray: '8,8',
  }), [obecCentrum.lat, obecCentrum.lng, radius])

  // Detail vybraného miesta
  const vybrane = useMemo(() =>
    vybraneId ? filtrovane.find(m => m.id === vybraneId) : null,
  [vybraneId, filtrovane])

  // Štatistiky podľa kategórie (v aktuálnom rádiuse)
  const statyKategorie = useMemo(() => {
    const vRadiuse = miestaSVzdialenost.filter(m => m.vzdialenostKm <= radius)
    const counts: Record<string, number> = {}
    vRadiuse.forEach(m => { counts[m.kategoria] = (counts[m.kategoria] || 0) + 1 })
    return counts
  }, [miestaSVzdialenost, radius])

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]} edges={['top']}>
      <AtmosphereBackground tint={OKOLIE_MODRA} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: OKOLIE_MODRA }]}>
        <PressableScale onPress={() => router.back()} style={styles.back} scaleTo={0.94} accessibilityLabel="Späť">
          <Icon name="chevronBack" size={20} color="#FFFFFF" /><Text style={styles.backText}>Späť</Text>
        </PressableScale>
        <View style={styles.headerTitleRow}>
          <Icon name="okolie" size={22} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Voľný čas v okolí</Text>
        </View>
        <Text style={styles.headerSub}>
          {filtrovane.length} {filtrovane.length === 1 ? 'tip' : filtrovane.length < 5 ? 'tipy' : 'tipov'}
          {' '}do {radius} km · {tenant.nazov}
        </Text>
      </View>

      {/* Rádius selector — veľký, dôrazný */}
      <View style={[styles.radiusWrap, { backgroundColor: t.surface, borderBottomColor: t.borderLight }]}>
        <Text style={[styles.radiusLabel, { color: t.textMuted }]}>VZDIALENOSŤ OD OBCE</Text>
        <View style={styles.radiusRow}>
          {RADIUSY.map(r => {
            const active = radius === r.km
            return (
              <PressableScale
                key={r.km}
                style={[
                  styles.radiusBtn,
                  { backgroundColor: t.surfaceAlt, borderColor: t.border },
                  active && { backgroundColor: OKOLIE_MODRA, borderColor: OKOLIE_MODRA },
                ]}
                scaleTo={0.96}
                onPress={() => { setRadius(r.km as 10 | 20 | 50); setVybraneId(null) }}
                accessibilityLabel={r.label}
              >
                <Text style={[styles.radiusBtnText, { color: active ? '#FFFFFF' : t.textSecondary }]}>{r.label}</Text>
              </PressableScale>
            )
          })}
        </View>
      </View>

      {/* Kategória chips */}
      <View style={[styles.chipsWrap, { backgroundColor: t.surface, borderBottomColor: t.borderLight }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {(['vsetko', 'cyklotrasa', 'turistika', 'deti', 'wellness', 'kultura', 'priroda', 'sport'] as const).map(k => {
            const meta = KAT_META[k]
            const active = kategoria === k
            const count = k === 'vsetko' ? Object.values(statyKategorie).reduce((a, b) => a + b, 0) : (statyKategorie[k] ?? 0)
            return (
              <PressableScale
                key={k}
                style={[
                  styles.chip,
                  { backgroundColor: t.surface, borderColor: t.border },
                  active && { backgroundColor: meta.color, borderColor: meta.color },
                ]}
                scaleTo={0.95}
                onPress={() => { setKategoria(k); setVybraneId(null) }}
                accessibilityLabel={meta.label}
              >
                <Icon name={meta.icon} size={14} color={active ? '#FFFFFF' : t.textSecondary} />
                <Text style={[styles.chipText, { color: active ? '#FFFFFF' : t.textSecondary }]}>
                  {meta.label}{count > 0 ? ` · ${count}` : ''}
                </Text>
              </PressableScale>
            )
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {/* Mapa s rádius kruhom */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <LeafletMap
            center={obecCentrum}
            zoom={11}
            markers={markers}
            circle={circle}
            fitBoundsToCircle
            onMarkerPress={(id) => setVybraneId(id)}
            style={{ height: 380 }}
          />
          <Text style={[styles.caption, { color: t.textMuted }]}>
            Modrý kruh = rádius {radius} km od obce · Klepnutím na pin otvoríte detail
          </Text>
        </View>

        {/* Detail vybraného miesta — zobrazený nad zoznamom */}
        {vybrane && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
            <Card variant="accent" accentColor={KAT_META[vybrane.kategoria].color}>
              <View style={styles.detailHead}>
                <View style={{ flex: 1 }}>
                  <View style={styles.detailMetaRow}>
                    <Badge
                      label={KAT_META[vybrane.kategoria].label}
                      tone="info"
                      style={{ backgroundColor: KAT_META[vybrane.kategoria].color + '22' }}
                      textStyle={{ color: KAT_META[vybrane.kategoria].color }}
                    />
                    <View style={[styles.distancePill, { backgroundColor: t.primaryLight }]}>
                      <Icon name="navigate" size={11} color={t.primary} />
                      <Text style={[styles.distancePillText, { color: t.primary }]}>{formatVzdialenost(vybrane.vzdialenostKm)}</Text>
                    </View>
                  </View>
                  <Text style={[styles.detailTitul, { color: t.text }]}>{vybrane.nazov}</Text>
                </View>
                <PressableScale onPress={() => setVybraneId(null)} scaleTo={0.85} style={styles.detailClose} accessibilityLabel="Zavrieť">
                  <Icon name="close" size={20} color={t.textMuted} />
                </PressableScale>
              </View>

              {vybrane.popis && (
                <Text style={[styles.detailPopis, { color: t.textSecondary }]}>
                  {vybrane.popis}
                </Text>
              )}

              <View style={styles.metaPills}>
                {vybrane.trvanie && (
                  <View style={[styles.metaPill, styles.metaPillRow, { backgroundColor: t.surfaceAlt }]}>
                    <Icon name="time" size={11} color={t.textSecondary} />
                    <Text style={[styles.metaPillText, { color: t.textSecondary }]}>{vybrane.trvanie}</Text>
                  </View>
                )}
                {vybrane.tagy?.map(tag => (
                  <View key={tag} style={[styles.metaPill, { backgroundColor: t.surfaceAlt }]}>
                    <Text style={[styles.metaPillText, { color: t.textSecondary }]}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionRow}>
                <PressableScale
                  style={[styles.actionBtn, { backgroundColor: OKOLIE_MODRA }]}
                  scaleTo={0.96}
                  onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${vybrane.lat},${vybrane.lng}`)}
                  accessibilityLabel="Navigovať"
                >
                  <Icon name="navigate" size={14} color="#FFFFFF" /><Text style={styles.actionBtnText}>Navigovať</Text>
                </PressableScale>
                {vybrane.web && (
                  <PressableScale style={[styles.actionBtn, { backgroundColor: t.surfaceAlt, borderWidth: 1, borderColor: t.border }]} scaleTo={0.96} onPress={() => Linking.openURL(vybrane.web!)} accessibilityLabel="Webstránka">
                    <Icon name="globe" size={14} color={t.text} /><Text style={[styles.actionBtnText, { color: t.text }]}>Webstránka</Text>
                  </PressableScale>
                )}
              </View>
            </Card>
          </View>
        )}

        {/* Zoznam miest */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          {filtrovane.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: t.surface }]}>
              <Icon name="search" size={44} color={t.textPlaceholder} style={{ marginBottom: 4 }} />
              <Text style={[styles.emptyTitle, { color: t.text }]}>
                V rádiuse {radius} km nič nenájdené
              </Text>
              <Text style={[styles.emptyText, { color: t.textMuted }]}>
                Skúste zväčšiť rádius alebo zmeniť kategóriu.
              </Text>
            </View>
          ) : (
            filtrovane.map(m => {
              const meta = KAT_META[m.kategoria]
              const isSelected = m.id === vybraneId
              return (
                <PressableScale
                  key={m.id}
                  style={[
                    styles.miestoCard,
                    { backgroundColor: t.surface, shadowColor: t.shadow },
                    isSelected && { borderColor: meta.color, borderWidth: 2 },
                  ]}
                  scaleTo={0.98}
                  onPress={() => setVybraneId(isSelected ? null : m.id)}
                  accessibilityLabel={`${m.nazov}, ${formatVzdialenost(m.vzdialenostKm)} od obce`}
                >
                  <View style={[styles.miestoIkonaBox, { backgroundColor: meta.color + '22' }]}>
                    <Icon name={meta.icon} size={24} color={meta.color} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.miestoTop}>
                      <Text style={[styles.miestoNazov, { color: t.text }]} numberOfLines={1}>{m.nazov}</Text>
                      <Text style={[styles.miestoDist, { color: meta.color }]}>{formatVzdialenost(m.vzdialenostKm)}</Text>
                    </View>
                    {m.podtitul && (
                      <Text style={[styles.miestoSub, { color: t.textMuted }]} numberOfLines={2}>{m.podtitul}</Text>
                    )}
                  </View>
                  <Icon name={isSelected ? 'chevronDown' : 'chevron'} size={20} color={t.textPlaceholder} />
                </PressableScale>
              )
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Štýly ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: 4,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', marginBottom: 6 },
  backText: { color: '#FFFFFF', ...typo.bodyB },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { color: '#FFFFFF', ...typo.h1 },
  headerSub: { color: 'rgba(255,255,255,0.9)', ...typo.caption, fontFamily: 'Inter_600SemiBold', marginTop: 2 },

  // Rádius
  radiusWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  radiusLabel: { ...typo.label },
  radiusRow: { flexDirection: 'row', gap: spacing.sm },
  radiusBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: r.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  radiusBtnText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  // Kategória chips
  chipsWrap: { borderBottomWidth: 1, paddingVertical: spacing.sm },
  chipsRow: { paddingHorizontal: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: r.pill,
    borderWidth: 1.5,
  },
  chipText: { ...typo.caption, fontWeight: '700' },

  caption: {
    ...typo.micro,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Detail
  detailHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  distancePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: r.sm,
  },
  distancePillText: { fontSize: 12, fontFamily: 'Inter_800ExtraBold' },
  detailTitul: { ...typo.h2, marginTop: 6 },
  detailClose: { padding: 4 },
  detailCloseTxt: { fontSize: 22 },
  detailPopis: { ...typo.body, lineHeight: 22, marginBottom: spacing.sm },
  metaPills: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  metaPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: r.sm,
  },
  metaPillRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaPillText: { fontSize: 11, fontWeight: '700' },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: r.sm,
  },
  actionBtnText: { color: '#FFFFFF', ...typo.captionB },

  // Karta miesta
  miestoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: r.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  miestoIkonaBox: {
    width: 50, height: 50, borderRadius: r.md,
    justifyContent: 'center', alignItems: 'center',
  },
  miestoEmoji: { fontSize: 26 },
  miestoTop: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between',
  },
  miestoNazov: { ...typo.h3, flex: 1 },
  miestoDist: { fontSize: 13, fontWeight: '900' },
  miestoSub: { ...typo.caption },
  chevron: { fontSize: 24, fontWeight: '300' },

  // Empty
  empty: {
    borderRadius: r.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { ...typo.h3, textAlign: 'center' },
  emptyText: { ...typo.caption, textAlign: 'center' },
})
