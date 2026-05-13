import { usePodujatia } from '@/src/hooks/usePodujatia';
import {
    ActivityIndicator, SafeAreaView, ScrollView,
    StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';

const KATEGORIA_CONFIG: Record<string, { emoji: string; farba: string; label: string }> = {
  kultura:  { emoji: '🎭', farba: '#6A1B9A', label: 'Kultúra' },
  sport:    { emoji: '⚽', farba: '#1565C0', label: 'Šport' },
  slavnost: { emoji: '🎉', farba: '#E65100', label: 'Slávnosť' },
  kino:     { emoji: '🎬', farba: '#1B5E20', label: 'Kino' },
  divadlo:  { emoji: '🎪', farba: '#880E4F', label: 'Divadlo' },
  deti:     { emoji: '🎈', farba: '#F57F17', label: 'Pre deti' },
  ine:      { emoji: '📅', farba: '#37474F', label: 'Iné' },
}

function formatDatum(datum_od: string, datum_do: string | null) {
  const od = new Date(datum_od)
  const den = od.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' })
  const cas = od.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })
  return { den: den.charAt(0).toUpperCase() + den.slice(1), cas }
}

function jeBlizko(datum: string) {
  const d = new Date(datum)
  const dnes = new Date()
  const diff = (d.getTime() - dnes.getTime()) / (1000 * 60 * 60 * 24)
  return diff <= 7
}

export default function PodujatiaScreen() {
  const { podujatia, loading, error } = usePodujatia()

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Podujatia</Text>
        <Text style={styles.headerSub}>Kalendár obecných akcií</Text>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Načítavam...</Text>
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Chyba pri načítaní</Text>
        </View>
      )}

      {!loading && !error && podujatia.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>Žiadne nadchádzajúce podujatia</Text>
        </View>
      )}

      {!loading && !error && podujatia.length > 0 && (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {podujatia.map(p => {
            const kat = KATEGORIA_CONFIG[p.kategoria] ?? KATEGORIA_CONFIG.ine
            const { den, cas } = formatDatum(p.datum_od, p.datum_do)
            const blizko = jeBlizko(p.datum_od)

            return (
              <TouchableOpacity key={p.id} style={styles.karta} activeOpacity={0.75}>
                {blizko && (
                  <View style={styles.blizkoTag}>
                    <Text style={styles.blizkoText}>Tento týždeň</Text>
                  </View>
                )}
                <View style={styles.kartaTop}>
                  <View style={[styles.emojiBox, { backgroundColor: kat.farba + '18' }]}>
                    <Text style={styles.emoji}>{kat.emoji}</Text>
                  </View>
                  <View style={styles.kartaInfo}>
                    <View style={[styles.katBadge, { backgroundColor: kat.farba + '18' }]}>
                      <Text style={[styles.katLabel, { color: kat.farba }]}>{kat.label}</Text>
                    </View>
                    <Text style={styles.kartaTitle}>{p.title}</Text>
                  </View>
                </View>

                <View style={styles.detaily}>
                  <View style={styles.detail}>
                    <Text style={styles.detailIcon}>📅</Text>
                    <Text style={styles.detailText}>{den}</Text>
                  </View>
                  <View style={styles.detail}>
                    <Text style={styles.detailIcon}>⏰</Text>
                    <Text style={styles.detailText}>{cas}</Text>
                  </View>
                  {p.miesto && (
                    <View style={styles.detail}>
                      <Text style={styles.detailIcon}>📍</Text>
                      <Text style={styles.detailText}>{p.miesto}</Text>
                    </View>
                  )}
                </View>

                {p.popis && (
                  <Text style={styles.popis} numberOfLines={2}>{p.popis}</Text>
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
  },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#888', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingText: { color: '#888', fontSize: 14, marginTop: 8 },
  errorIcon: { fontSize: 36 },
  errorText: { color: '#C62828', fontSize: 15 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  list: { padding: 16, gap: 12 },
  karta: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    overflow: 'hidden',
  },
  blizkoTag: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#E65100', borderBottomLeftRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  blizkoText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  kartaTop: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  emojiBox: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 26 },
  kartaInfo: { flex: 1, gap: 6 },
  katBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  katLabel: { fontSize: 11, fontWeight: '700' },
  kartaTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', lineHeight: 22 },
  detaily: { gap: 4, marginBottom: 8 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailIcon: { fontSize: 13 },
  detailText: { fontSize: 13, color: '#555' },
  popis: { fontSize: 13, color: '#888', lineHeight: 19, marginTop: 4 },
})