import { supabase } from '@/src/lib/supabase'
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

type HistoriaZaznam = {
  novy_status: string
  stary_status: string
  created_at: string
}

type Hlasenie = {
  id: string
  kategoria: string
  popis: string
  adresa: string | null
  status: string
  created_at: string
  historia?: HistoriaZaznam[]
}

const STATUS_FARBY: Record<string, { bg: string; text: string; label: string }> = {
  nove:       { bg: '#E3F2FD', text: '#1565C0', label: 'Nové' },
  v_rieseni:  { bg: '#FFF8E1', text: '#F57F17', label: 'V riešení' },
  vyriesene:  { bg: '#E8F5E9', text: '#2E7D32', label: 'Vyriešené' },
  zamietnute: { bg: '#FFEBEE', text: '#C62828', label: 'Zamietnuté' },
}

const KATEGORIA_EMOJI: Record<string, string> = {
  cesta: '🛣️', osvietenie: '💡', zelen: '🌳',
  voda: '💧', odpad: '🗑️', ine: '📋',
}

export default function AdminScreen() {
  const [hlasenia, setHlasenia] = useState<Hlasenie[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    nacitajHlasenia()
  }, [])

  async function nacitajHlasenia() {
    setLoading(true)
    const { data } = await supabase
      .from('hlaseniaporuchy')
      .select(`
        id, kategoria, popis, adresa, status, created_at,
        historia:hlasenia_historia(novy_status, stary_status, created_at)
      `)
      .order('created_at', { ascending: false })
    setHlasenia((data as unknown as Hlasenie[]) || [])
    setLoading(false)
  }

  async function zmenStatus(id: string, novyStatus: string) {
    setUpdating(id)
    const stareHlasenie = hlasenia.find(h => h.id === id)

    await supabase
      .from('hlaseniaporuchy')
      .update({ status: novyStatus })
      .eq('id', id)

    await supabase
      .from('hlasenia_historia')
      .insert({
        hlasenie_id: id,
        stary_status: stareHlasenie?.status,
        novy_status: novyStatus,
      })

    await nacitajHlasenia()
    setUpdating(null)
  }

  const nove = hlasenia.filter(h => h.status === 'nove')
  const ostatne = hlasenia.filter(h => h.status !== 'nove')

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#1B5E20" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>V–O</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Admin panel</Text>
            <Text style={styles.headerSub}>Výčapy-Opatovce</Text>
          </View>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statNumber}>{nove.length}</Text>
          <Text style={styles.statLabel}>nových</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {nove.length > 0 && (
            <>
              <Text style={styles.sekcia}>🔴 Nové hlásenia ({nove.length})</Text>
              {nove.map(h => (
                <HlasenieKarta key={h.id} hlasenie={h} updating={updating === h.id} onZmenStatus={zmenStatus} />
              ))}
            </>
          )}
          {ostatne.length > 0 && (
            <>
              <Text style={[styles.sekcia, { marginTop: 8 }]}>📋 Ostatné hlásenia</Text>
              {ostatne.map(h => (
                <HlasenieKarta key={h.id} hlasenie={h} updating={updating === h.id} onZmenStatus={zmenStatus} />
              ))}
            </>
          )}
          {hlasenia.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>Žiadne hlásenia</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function HlasenieKarta({ hlasenie: h, updating, onZmenStatus }: {
  hlasenie: Hlasenie
  updating: boolean
  onZmenStatus: (id: string, status: string) => void
}) {
  const statusInfo = STATUS_FARBY[h.status] ?? STATUS_FARBY.nove
  const datum = new Date(h.created_at).toLocaleDateString('sk-SK', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

  return (
    <View style={styles.karta}>
      <View style={styles.kartaHeader}>
        <Text style={styles.kartaEmoji}>{KATEGORIA_EMOJI[h.kategoria] ?? '📋'}</Text>
        <View style={styles.kartaInfo}>
          <Text style={styles.kartaKategoria}>{h.kategoria.toUpperCase()}</Text>
          <Text style={styles.kartaDatum}>{datum}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
        </View>
      </View>

      <Text style={styles.kartaPopis}>{h.popis}</Text>
      {h.adresa && <Text style={styles.kartaAdresa}>📍 {h.adresa}</Text>}

      {updating ? (
        <ActivityIndicator size="small" color="#2E7D32" style={{ marginTop: 12 }} />
      ) : (
        <View style={styles.akcie}>
          {h.status !== 'v_rieseni' && (
            <TouchableOpacity style={[styles.akciaBtn, { backgroundColor: '#FFF8E1' }]} onPress={() => onZmenStatus(h.id, 'v_rieseni')}>
              <Text style={[styles.akciaBtnText, { color: '#F57F17' }]}>V riešení</Text>
            </TouchableOpacity>
          )}
          {h.status !== 'vyriesene' && (
            <TouchableOpacity style={[styles.akciaBtn, { backgroundColor: '#E8F5E9' }]} onPress={() => onZmenStatus(h.id, 'vyriesene')}>
              <Text style={[styles.akciaBtnText, { color: '#2E7D32' }]}>Vyriešené ✓</Text>
            </TouchableOpacity>
          )}
          {h.status !== 'zamietnute' && (
            <TouchableOpacity style={[styles.akciaBtn, { backgroundColor: '#FFEBEE' }]} onPress={() => onZmenStatus(h.id, 'zamietnute')}>
              <Text style={[styles.akciaBtnText, { color: '#C62828' }]}>Zamietnuť</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {h.historia && h.historia.length > 0 && (
        <View style={styles.historiaContainer}>
          <Text style={styles.historiaTitle}>HISTÓRIA ZMIEN</Text>
          {h.historia
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((z, i) => (
              <View key={i} style={styles.historiaZaznam}>
                <Text style={styles.historiaText}>
                  {STATUS_FARBY[z.stary_status]?.label ?? z.stary_status} → {STATUS_FARBY[z.novy_status]?.label ?? z.novy_status}
                </Text>
                <Text style={styles.historiaDatum}>
                  {new Date(z.created_at).toLocaleDateString('sk-SK', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBadge: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 },
  statBadge: {
    backgroundColor: '#FF5252', borderRadius: 12,
    padding: 10, alignItems: 'center', minWidth: 56,
  },
  statNumber: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 10 },
  sekcia: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 4, marginTop: 4 },
  karta: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  kartaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  kartaEmoji: { fontSize: 28 },
  kartaInfo: { flex: 1 },
  kartaKategoria: { fontSize: 12, fontWeight: '800', color: '#333', letterSpacing: 0.5 },
  kartaDatum: { fontSize: 11, color: '#AAA', marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  kartaPopis: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 6 },
  kartaAdresa: { fontSize: 12, color: '#888', marginBottom: 4 },
  akcie: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  akciaBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  akciaBtnText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#888', fontWeight: '600' },
  historiaContainer: {
    marginTop: 12, borderTopWidth: 1,
    borderTopColor: '#F0F0F0', paddingTop: 10, gap: 6,
  },
  historiaTitle: { fontSize: 10, fontWeight: '800', color: '#CCC', letterSpacing: 1, marginBottom: 4 },
  historiaZaznam: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historiaText: { fontSize: 12, color: '#666' },
  historiaDatum: { fontSize: 11, color: '#BBB' },
})