/**
 * Mapa obce — schematická obecná mapa s pinmi:
 *   - žltá  = verejné osvetlenie (zapnuté / vypnuté)
 *   - modrá = senzory (hladina, teplota, kontajner)
 *   - červená = nahlásené poruchy s adresou
 *
 * Toto je schematická SVG-like reprezentácia bez real-time Google Maps —
 * netreba inštalovať react-native-maps ani API kľúč. Pre prezentáciu
 * starostovi a demo úplne stačí, vizuálne je to čisté a interaktívne.
 *
 * Pre produkciu odporúčam neskôr `react-native-maps` s real GPS pinmi,
 * keď budú zariadenia mať lat/lng v DB.
 */

import { C } from '@/constants/colors'
import { useObecneZariadenia, Zariadenie } from '@/src/hooks/useObecneZariadenia'
import { supabase } from '@/src/lib/supabase'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const MAPA_MODRA = '#0D47A1'

// Schematické pozície pinov (% v ploche mapy)
// Hash z `id` zariadenia → deterministická pozícia.
function hashPos(id: string): { x: number; y: number } {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h << 5) - h + id.charCodeAt(i)
    h |= 0
  }
  const x = Math.abs(h) % 80 + 10        // 10–90 %
  const y = Math.abs(h * 31) % 70 + 15   // 15–85 %
  return { x, y }
}

type Hlasenie = {
  id: string
  kategoria: string
  popis: string
  adresa: string | null
  status: string
}

type Filter = 'all' | 'osvetlenie' | 'senzory' | 'hlasenia'

export default function MapaScreen() {
  const router = useRouter()
  const { zariadenia, loading: loadZ, error: errZ } = useObecneZariadenia()
  const [hlasenia, setHlasenia] = useState<Hlasenie[]>([])
  const [loadH, setLoadH] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [vybrane, setVybrane] = useState<{
    kind: 'zariadenie' | 'hlasenie'
    data: Zariadenie | Hlasenie
  } | null>(null)

  useEffect(() => {
    async function fetchHlasenia() {
      const { data } = await supabase
        .from('hlaseniaporuchy')
        .select('id, kategoria, popis, adresa, status')
        .neq('status', 'vyriesene')
        .neq('status', 'zamietnute')
      if (data) setHlasenia(data as Hlasenie[])
      setLoadH(false)
    }
    fetchHlasenia()
  }, [])

  const osvetlenia = zariadenia.filter(z => z.typ === 'osvetlenie')
  const senzory = zariadenia.filter(z => z.typ !== 'osvetlenie')

  const pinsToShow = (() => {
    const arr: { id: string; pos: { x: number; y: number }; color: string; emoji: string; data: any; kind: 'zariadenie' | 'hlasenie' }[] = []

    if (filter === 'all' || filter === 'osvetlenie') {
      osvetlenia.forEach(o => arr.push({
        id: o.id,
        pos: hashPos(o.id),
        color: o.stav ? C.brand.gold : '#9E9E9E',
        emoji: '💡',
        data: o,
        kind: 'zariadenie',
      }))
    }
    if (filter === 'all' || filter === 'senzory') {
      senzory.forEach(s => {
        const c = s.typ === 'senzor_vody' ? '#0288D1'
          : s.typ === 'meteo' ? '#26A69A'
          : '#5D4037' // kontajner
        const e = s.typ === 'senzor_vody' ? '💧'
          : s.typ === 'meteo' ? '🌡️'
          : '🗑️'
        arr.push({
          id: s.id, pos: hashPos(s.id), color: c, emoji: e, data: s, kind: 'zariadenie',
        })
      })
    }
    if (filter === 'all' || filter === 'hlasenia') {
      hlasenia.forEach(h => arr.push({
        id: h.id, pos: hashPos(h.id), color: C.brand.red, emoji: '⚠️',
        data: h, kind: 'hlasenie',
      }))
    }
    return arr
  })()

  const loading = loadZ || loadH

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={MAPA_MODRA} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Späť</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🗺️ Mapa obce</Text>
        <Text style={styles.headerSub}>Schematický prehľad infraštruktúry</Text>
      </View>

      {/* Filter chips */}
      <View style={styles.chipsRow}>
        <FilterChip label="Všetko" active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterChip label="💡 Osvetlenie" active={filter === 'osvetlenie'} onPress={() => setFilter('osvetlenie')} />
        <FilterChip label="📡 Senzory" active={filter === 'senzory'} onPress={() => setFilter('senzory')} />
        <FilterChip label="⚠️ Hlásenia" active={filter === 'hlasenia'} onPress={() => setFilter('hlasenia')} />
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={MAPA_MODRA} />
        </View>
      )}

      {errZ && (
        <View style={styles.errorBox}>
          <Text style={styles.errorMsg}>{errZ}</Text>
          <Text style={styles.errorHint}>
            Tip: vytvorte tabuľku obecne_zariadenia v Supabase.
          </Text>
        </View>
      )}

      {!loading && (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Schematic mapa */}
          <View style={styles.mapaWrap}>
            <View style={styles.mapa}>
              {/* Pozadie — štylizovaná obecná silueta */}
              <View style={styles.river} />
              <View style={styles.road1} />
              <View style={styles.road2} />
              <View style={styles.center_marker}>
                <Text style={styles.centerLabel}>VÝČAPY-OPATOVCE</Text>
              </View>

              {/* Piny */}
              {pinsToShow.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.pin,
                    {
                      left: `${p.pos.x}%`,
                      top: `${p.pos.y}%`,
                      backgroundColor: p.color,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setVybrane({ kind: p.kind, data: p.data })}
                >
                  <Text style={styles.pinEmoji}>{p.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.mapaCaption}>
              Schematické zobrazenie. Klikni na pin pre detail.
            </Text>
          </View>

          {/* Štatistika */}
          <View style={styles.statsRow}>
            <StatCard
              label="Osvetlenie"
              total={osvetlenia.length}
              active={osvetlenia.filter(o => o.stav).length}
              color={C.brand.gold}
              emoji="💡"
            />
            <StatCard
              label="Senzory"
              total={senzory.length}
              active={senzory.length}
              color="#0288D1"
              emoji="📡"
            />
            <StatCard
              label="Aktívne hlásenia"
              total={hlasenia.length}
              active={hlasenia.length}
              color={C.brand.red}
              emoji="⚠️"
            />
          </View>

          {/* Detail vybraného pinu */}
          {vybrane && (
            <View style={styles.detail}>
              <View style={styles.detailHead}>
                <Text style={styles.detailTitul}>
                  {vybrane.kind === 'zariadenie'
                    ? (vybrane.data as Zariadenie).nazov
                    : `Hlásenie: ${(vybrane.data as Hlasenie).kategoria}`}
                </Text>
                <TouchableOpacity onPress={() => setVybrane(null)} style={styles.detailClose}>
                  <Text style={{ fontSize: 18, color: C.textMuted }}>✕</Text>
                </TouchableOpacity>
              </View>
              {vybrane.kind === 'zariadenie' ? (
                <ZariadenieDetail z={vybrane.data as Zariadenie} />
              ) : (
                <HlasenieDetail h={vybrane.data as Hlasenie} />
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function FilterChip({ label, active, onPress }: {
  label: string; active: boolean; onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

function StatCard({ label, total, active, color, emoji }: {
  label: string; total: number; active: number; color: string; emoji: string
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statNum, { color }]}>{active}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {label === 'Osvetlenie' && (
        <Text style={styles.statSub}>z {total}</Text>
      )}
    </View>
  )
}

function ZariadenieDetail({ z }: { z: Zariadenie }) {
  return (
    <View style={{ gap: 6 }}>
      {z.ulica && <Text style={styles.detailRow}>📍 {z.ulica}</Text>}
      <Text style={styles.detailRow}>Typ: {z.typ}</Text>
      {z.stav != null && (
        <Text style={styles.detailRow}>
          Stav: {z.stav
            ? <Text style={{ color: C.secondary, fontWeight: '800' }}>ZAPNUTÉ</Text>
            : <Text style={{ color: C.textMuted, fontWeight: '800' }}>VYPNUTÉ</Text>}
        </Text>
      )}
      {z.posledna_hodnota != null && (
        <Text style={styles.detailRow}>
          Hodnota: <Text style={{ fontWeight: '800' }}>{z.posledna_hodnota}{z.jednotka ?? ''}</Text>
        </Text>
      )}
    </View>
  )
}

function HlasenieDetail({ h }: { h: Hlasenie }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.detailRow}>Kategória: <Text style={{ fontWeight: '800' }}>{h.kategoria}</Text></Text>
      <Text style={styles.detailRow}>Stav: <Text style={{ fontWeight: '800', color: C.brand.red }}>{h.status}</Text></Text>
      {h.adresa && <Text style={styles.detailRow}>📍 {h.adresa}</Text>}
      <Text style={[styles.detailRow, { marginTop: 4, color: C.textSecondary }]}>
        {h.popis}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },

  header: {
    backgroundColor: MAPA_MODRA,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18,
    gap: 4,
  },
  back: { alignSelf: 'flex-start' },
  backText: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.borderLight,
  },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1.5, borderColor: C.border,
  },
  chipActive: { backgroundColor: MAPA_MODRA, borderColor: MAPA_MODRA },
  chipText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  chipTextActive: { color: '#fff' },

  errorBox: { margin: 16, padding: 14, backgroundColor: C.surface, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: C.brand.red, gap: 4 },
  errorMsg: { fontSize: 13, color: C.textSecondary },
  errorHint: { fontSize: 12, color: C.textMuted, lineHeight: 18 },

  // Mapa
  mapaWrap: { padding: 16 },
  mapa: {
    height: 360,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: C.border,
  },
  // Štylizovaný "potok"
  river: {
    position: 'absolute',
    top: '40%',
    left: 0, right: 0,
    height: 10,
    backgroundColor: '#90CAF9',
    transform: [{ rotate: '-3deg' }],
  },
  // Cesty
  road1: {
    position: 'absolute',
    top: '20%', bottom: '20%',
    left: '30%',
    width: 4,
    backgroundColor: 'rgba(0,0,0,0.18)',
    transform: [{ rotate: '5deg' }],
  },
  road2: {
    position: 'absolute',
    left: 0, right: 0,
    top: '65%',
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  center_marker: {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: [{ translateX: -80 }, { translateY: -10 }],
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
  },
  centerLabel: {
    fontSize: 11, fontWeight: '900',
    color: C.text, letterSpacing: 0.5,
  },

  pin: {
    position: 'absolute',
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  pinEmoji: { fontSize: 16 },

  mapaCaption: {
    fontSize: 11, color: C.textMuted,
    textAlign: 'center', marginTop: 10,
  },

  // Štatistiky
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statEmoji: { fontSize: 22 },
  statNum: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  statLabel: { fontSize: 11, color: C.textSecondary, marginTop: 2, fontWeight: '700', textAlign: 'center' },
  statSub: { fontSize: 10, color: C.textPlaceholder, marginTop: 1 },

  // Detail pinu
  detail: {
    backgroundColor: C.surface,
    margin: 16,
    marginTop: 0,
    borderRadius: 14,
    padding: 14,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  detailHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  detailTitul: {
    flex: 1,
    fontSize: 15, fontWeight: '800', color: C.text,
    paddingRight: 8,
  },
  detailClose: { padding: 4 },
  detailRow: { fontSize: 13, color: C.text },
})
