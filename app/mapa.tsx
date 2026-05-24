/**
 * Mapa obce — REÁLNA mapa cez Leaflet + OpenStreetMap.
 *
 * Vrstvy pinov:
 *   1. POI z tenant configu — obecný úrad, zdrav. stredisko, lekáreň, pošta,
 *      fara, vet, kostol, šport, kultúra, ZŠ, MŠ, cintorín, defibrilátor
 *   2. Senzory a osvetlenie z DB (obecne_zariadenia)
 *   3. Aktívne hlásenia porúch (hlaseniaporuchy), ak má hlásenie GPS
 *
 * Filter chips:
 *   - Všetko, Služby, Šport/Kultúra, Školstvo, Infraštruktúra (osvetlenie, vet senzory), Hlásenia
 *
 * Klik na pin → otvorí inline detail panel s tlačidlami:
 *   - "Zavolať" (ak má telefón)
 *   - "Otvoriť službu" (ak je naviazaná na /sluzba/[id])
 */

import { Badge, Card } from '@/components/ui'
import LeafletMap, { LeafletMarker } from '@/components/LeafletMap'
import { C } from '@/constants/colors'
import { POIKategoria, PointZaujmu, useTenant } from '@/src/config/tenant'
import { useObecneZariadenia, Zariadenie } from '@/src/hooks/useObecneZariadenia'
import { supabase } from '@/src/lib/supabase'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const MAPA_MODRA = '#0D47A1'

// ─── Konfigurácia POI farieb a ikon ───────────────────────────────────────
const POI_STYLE: Record<POIKategoria, { color: string; emoji: string; label: string }> = {
  urad:          { color: '#C62828', emoji: '🏛️', label: 'Úrad' },
  zdravotnictvo: { color: '#1565C0', emoji: '🏥', label: 'Zdravotníctvo' },
  lekaren:       { color: '#2E7D32', emoji: '💊', label: 'Lekáreň' },
  posta:         { color: '#F9A825', emoji: '📮', label: 'Pošta' },
  veterina:      { color: '#6A1B9A', emoji: '🐾', label: 'Veterina' },
  kostol:        { color: '#5D4037', emoji: '⛪', label: 'Kostol' },
  cintorin:      { color: '#37474F', emoji: '🕯️', label: 'Cintorín' },
  sport:         { color: '#1B5E20', emoji: '⚽', label: 'Šport' },
  kultura:       { color: '#AD1457', emoji: '🎭', label: 'Kultúra' },
  skolstvo:      { color: '#00838F', emoji: '🎒', label: 'Školstvo' },
  obchod:        { color: '#E65100', emoji: '🛒', label: 'Obchod' },
  defibrilator:  { color: '#D32F2F', emoji: '🆘', label: 'AED' },
  dolezite:      { color: '#455A64', emoji: '📍', label: 'Dôležité' },
  iny:           { color: '#757575', emoji: '📌', label: 'Iné' },
}

type Hlasenie = {
  id: string
  kategoria: string
  popis: string
  adresa: string | null
  status: string
  lat: number | null
  lng: number | null
}

type Filter = 'vsetko' | 'sluzby' | 'sport_kultura' | 'skolstvo' | 'infrastruktura' | 'hlasenia'

const FILTRE: { id: Filter; label: string }[] = [
  { id: 'vsetko',         label: '🗂️ Všetko' },
  { id: 'sluzby',         label: '🏥 Služby' },
  { id: 'sport_kultura',  label: '⚽ Šport / kultúra' },
  { id: 'skolstvo',       label: '🎒 Školstvo' },
  { id: 'infrastruktura', label: '💡 Infraštruktúra' },
  { id: 'hlasenia',       label: '⚠️ Hlásenia' },
]

const SLUZBY_KAT: POIKategoria[] = ['urad', 'zdravotnictvo', 'lekaren', 'posta', 'veterina', 'kostol', 'defibrilator']
const SPORT_KULTURA_KAT: POIKategoria[] = ['sport', 'kultura']
const SKOLSTVO_KAT: POIKategoria[] = ['skolstvo']

// ─── Komponent ────────────────────────────────────────────────────────────
export default function MapaScreen() {
  const router = useRouter()
  const t = useThemeColors()
  const tenant = useTenant()
  const { zariadenia, loading: loadZ } = useObecneZariadenia()
  const [hlasenia, setHlasenia] = useState<Hlasenie[]>([])
  const [loadH, setLoadH] = useState(true)
  const [filter, setFilter] = useState<Filter>('vsetko')
  const [vybraneId, setVybraneId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHlasenia() {
      // Skúsime načítať aj GPS súradnice; ak stĺpce neexistujú, padne to defenzívne.
      const { data } = await supabase
        .from('hlaseniaporuchy')
        .select('id, kategoria, popis, adresa, status, lat, lng')
        .neq('status', 'vyriesene')
        .neq('status', 'zamietnute')
      if (data) {
        setHlasenia(data as any)
      } else {
        // Spätná kompatibilita — bez lat/lng
        const { data: fb } = await supabase
          .from('hlaseniaporuchy')
          .select('id, kategoria, popis, adresa, status')
          .neq('status', 'vyriesene')
          .neq('status', 'zamietnute')
        setHlasenia(((fb as any) || []).map((h: any) => ({ ...h, lat: null, lng: null })))
      }
      setLoadH(false)
    }
    fetchHlasenia()
  }, [])

  // Vyrobíme markers pre LeafletMap z aktívneho filtra
  const markers: LeafletMarker[] = useMemo(() => {
    const out: LeafletMarker[] = []

    // 1. POI
    const pointsToShow: PointZaujmu[] = (() => {
      if (filter === 'vsetko') return tenant.pointyZaujmu
      if (filter === 'sluzby') return tenant.pointyZaujmu.filter(p => SLUZBY_KAT.includes(p.kategoria))
      if (filter === 'sport_kultura') return tenant.pointyZaujmu.filter(p => SPORT_KULTURA_KAT.includes(p.kategoria))
      if (filter === 'skolstvo') return tenant.pointyZaujmu.filter(p => SKOLSTVO_KAT.includes(p.kategoria))
      return []
    })()

    pointsToShow.forEach(p => {
      const st = POI_STYLE[p.kategoria]
      out.push({
        id: `poi:${p.id}`,
        lat: p.lat, lng: p.lng,
        color: st.color, emoji: st.emoji,
        label: p.nazov,
        active: p.kategoria === 'defibrilator',
      })
    })

    // 2. Infraštruktúra (osvetlenie, vet senzory) — len ak ich máme s GPS
    if (filter === 'vsetko' || filter === 'infrastruktura') {
      zariadenia.forEach((z: any) => {
        const lat = z.lat ?? null
        const lng = z.lng ?? null
        if (lat == null || lng == null) return
        const isLamp = z.typ === 'osvetlenie'
        const color = isLamp ? (z.stav ? '#F9A825' : '#9E9E9E')
          : z.typ === 'senzor_vody' ? '#0288D1'
          : z.typ === 'meteo' ? '#26A69A'
          : '#5D4037'
        const emoji = isLamp ? '💡'
          : z.typ === 'senzor_vody' ? '💧'
          : z.typ === 'meteo' ? '🌡️'
          : '🗑️'
        out.push({
          id: `dev:${z.id}`,
          lat, lng, color, emoji,
          label: z.nazov || z.typ,
        })
      })
    }

    // 3. Hlásenia
    if (filter === 'vsetko' || filter === 'hlasenia') {
      hlasenia.forEach(h => {
        if (h.lat == null || h.lng == null) return
        out.push({
          id: `hla:${h.id}`,
          lat: h.lat, lng: h.lng,
          color: C.brand.red, emoji: '⚠️',
          label: `Hlásenie: ${h.kategoria}`,
          active: h.status === 'nove',
        })
      })
    }

    return out
  }, [filter, tenant.pointyZaujmu, zariadenia, hlasenia])

  // Detail vybraného pinu
  const vybrane = useMemo(() => {
    if (!vybraneId) return null
    if (vybraneId.startsWith('poi:')) {
      const id = vybraneId.slice(4)
      const poi = tenant.pointyZaujmu.find(p => p.id === id)
      return poi ? { kind: 'poi' as const, data: poi } : null
    }
    if (vybraneId.startsWith('dev:')) {
      const id = vybraneId.slice(4)
      const dev = zariadenia.find(z => z.id === id)
      return dev ? { kind: 'dev' as const, data: dev } : null
    }
    if (vybraneId.startsWith('hla:')) {
      const id = vybraneId.slice(4)
      const h = hlasenia.find(x => x.id === id)
      return h ? { kind: 'hla' as const, data: h } : null
    }
    return null
  }, [vybraneId, tenant.pointyZaujmu, zariadenia, hlasenia])

  const loading = loadZ || loadH

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={MAPA_MODRA} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: MAPA_MODRA }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} hitSlop={10}>
          <Text style={styles.backText}>← Späť</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🗺️ Mapa obce</Text>
        <Text style={styles.headerSub}>{tenant.nazov} · OpenStreetMap</Text>
      </View>

      {/* Filter chips */}
      <View style={[styles.chipsWrap, { backgroundColor: t.surface, borderBottomColor: t.borderLight }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTRE.map(f => (
            <FilterChip
              key={f.id}
              label={f.label}
              active={filter === f.id}
              onPress={() => { setFilter(f.id); setVybraneId(null) }}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {/* Reálna mapa */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <LeafletMap
            center={tenant.mapaCentrum}
            zoom={tenant.mapaCentrum.zoom}
            markers={markers}
            onMarkerPress={(id) => setVybraneId(id)}
            fitBoundsToMarkers={false}
            style={{ height: 380 }}
          />
          <Text style={[styles.caption, { color: t.textMuted }]}>
            {markers.length} {markers.length === 1 ? 'bod' : markers.length < 5 ? 'body' : 'bodov'} na mape ·
            Klepnutím na pin otvoríte detail
          </Text>
        </View>

        {/* Štatistika */}
        <View style={styles.statsRow}>
          <StatCard
            label="Bodov záujmu"
            value={tenant.pointyZaujmu.length}
            color={MAPA_MODRA}
            emoji="📍"
          />
          <StatCard
            label="Zariadení s GPS"
            value={zariadenia.filter((z: any) => z.lat != null && z.lng != null).length}
            color="#0288D1"
            emoji="📡"
          />
          <StatCard
            label="Hlásení"
            value={hlasenia.length}
            color={C.brand.red}
            emoji="⚠️"
          />
        </View>

        {/* Detail vybraného pinu */}
        {vybrane && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
            <Card>
              <View style={styles.detailHead}>
                <Text style={[styles.detailTitul, { color: t.text }]}>
                  {vybrane.kind === 'poi'
                    ? vybrane.data.nazov
                    : vybrane.kind === 'dev'
                      ? (vybrane.data as any).nazov
                      : `Hlásenie · ${(vybrane.data as Hlasenie).kategoria}`}
                </Text>
                <TouchableOpacity
                  onPress={() => setVybraneId(null)}
                  hitSlop={10}
                  style={styles.detailClose}
                >
                  <Text style={[styles.detailCloseTxt, { color: t.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {vybrane.kind === 'poi' && (
                <PoiDetail poi={vybrane.data} router={router} t={t} />
              )}
              {vybrane.kind === 'dev' && (
                <DevDetail dev={vybrane.data} t={t} />
              )}
              {vybrane.kind === 'hla' && (
                <HlasenieDetail h={vybrane.data} t={t} />
              )}
            </Card>
          </View>
        )}

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={MAPA_MODRA} />
            <Text style={[styles.loadingText, { color: t.textMuted }]}>
              Načítavam ďalšie dáta…
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Filter Chip ─────────────────────────────────────────────────────────
function FilterChip({ label, active, onPress }: {
  label: string; active: boolean; onPress: () => void
}) {
  const t = useThemeColors()
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: t.surface, borderColor: t.border },
        active && { backgroundColor: MAPA_MODRA, borderColor: MAPA_MODRA },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[
        styles.chipText,
        { color: t.textSecondary },
        active && { color: '#FFFFFF', fontWeight: '900' },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────
function StatCard({ label, value, color, emoji }: {
  label: string; value: number; color: string; emoji: string
}) {
  const t = useThemeColors()
  return (
    <View style={[styles.statCard, { backgroundColor: t.surface, shadowColor: t.shadow }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statNum, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.textSecondary }]}>{label}</Text>
    </View>
  )
}

// ─── POI Detail ──────────────────────────────────────────────────────────
function PoiDetail({ poi, router, t }: { poi: PointZaujmu; router: any; t: any }) {
  const st = POI_STYLE[poi.kategoria]
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.detailMetaRow}>
        <Badge label={st.label} tone="info" style={{ backgroundColor: st.color + '22' }} textStyle={{ color: st.color }} />
        <View style={[styles.coordPill, { backgroundColor: t.surfaceAlt }]}>
          <Text style={[styles.coordText, { color: t.textMuted }]}>
            {poi.lat.toFixed(4)}, {poi.lng.toFixed(4)}
          </Text>
        </View>
      </View>
      {poi.podtitul && (
        <Text style={[styles.detailText, { color: t.textSecondary }]}>{poi.podtitul}</Text>
      )}
      <View style={styles.actionRow}>
        {poi.telefon && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.brand.green }]}
            onPress={() => {
              Alert.alert(
                'Zavolať?',
                poi.nazov,
                [
                  { text: 'Zrušiť', style: 'cancel' },
                  { text: 'Zavolať', onPress: () => Linking.openURL(`tel:${poi.telefon}`) },
                ],
              )
            }}
          >
            <Text style={styles.actionBtnText}>📞 Zavolať</Text>
          </TouchableOpacity>
        )}
        {poi.sluzbaId && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: MAPA_MODRA }]}
            onPress={() => router.push(`/sluzba/${poi.sluzbaId}` as never)}
          >
            <Text style={styles.actionBtnText}>📋 Otvoriť detail</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: t.surfaceAlt, borderWidth: 1, borderColor: t.border }]}
          onPress={() => {
            // Otvor v default mapách (mapy.cz / Google Maps universal link)
            const url = `https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lng}`
            Linking.openURL(url)
          }}
        >
          <Text style={[styles.actionBtnText, { color: t.text }]}>🧭 Navigovať</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Dev (zariadenie) Detail ─────────────────────────────────────────────
function DevDetail({ dev, t }: { dev: Zariadenie | any; t: any }) {
  return (
    <View style={{ gap: 6 }}>
      {dev.ulica && (
        <Text style={[styles.detailText, { color: t.textSecondary }]}>📍 {dev.ulica}</Text>
      )}
      <Text style={[styles.detailText, { color: t.textSecondary }]}>Typ: {dev.typ}</Text>
      {dev.stav != null && (
        <Text style={[styles.detailText, { color: t.textSecondary }]}>
          Stav: {dev.stav
            ? <Text style={{ color: C.secondary, fontWeight: '800' }}>ZAPNUTÉ</Text>
            : <Text style={{ color: t.textMuted, fontWeight: '800' }}>VYPNUTÉ</Text>}
        </Text>
      )}
      {dev.posledna_hodnota != null && (
        <Text style={[styles.detailText, { color: t.textSecondary }]}>
          Hodnota: <Text style={{ fontWeight: '800' }}>{dev.posledna_hodnota}{dev.jednotka ?? ''}</Text>
        </Text>
      )}
    </View>
  )
}

// ─── Hlásenie Detail ─────────────────────────────────────────────────────
function HlasenieDetail({ h, t }: { h: Hlasenie; t: any }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.detailText, { color: t.textSecondary }]}>
        Kategória: <Text style={{ fontWeight: '800' }}>{h.kategoria}</Text>
      </Text>
      <Text style={[styles.detailText, { color: t.textSecondary }]}>
        Stav: <Text style={{ fontWeight: '800', color: C.brand.red }}>{h.status}</Text>
      </Text>
      {h.adresa && (
        <Text style={[styles.detailText, { color: t.textSecondary }]}>📍 {h.adresa}</Text>
      )}
      <Text style={[styles.detailText, { color: t.textSecondary, marginTop: 4 }]} numberOfLines={5}>
        {h.popis}
      </Text>
    </View>
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
  back: { alignSelf: 'flex-start' },
  backText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  headerTitle: { color: '#FFFFFF', ...typo.h1 },
  headerSub: { color: 'rgba(255,255,255,0.85)', ...typo.caption, fontWeight: '600' },

  chipsWrap: { borderBottomWidth: 1 },
  chipsRow: { padding: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  chipText: { ...typo.caption, fontWeight: '700' },

  caption: {
    ...typo.micro,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Štatistiky
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statEmoji: { fontSize: 22 },
  statNum: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  statLabel: { fontSize: 11, marginTop: 2, fontWeight: '700', textAlign: 'center' },

  // Detail
  detailHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  detailTitul: { ...typo.h3, flex: 1, paddingRight: 8 },
  detailClose: { padding: 4 },
  detailCloseTxt: { fontSize: 20 },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  coordPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  coordText: { fontSize: 11, fontWeight: '600', fontFamily: 'monospace' },
  detailText: { ...typo.body },

  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
  },
  loadingText: { fontSize: 12, fontWeight: '600' },
})
