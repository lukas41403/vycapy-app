import { useOdpady } from '@/src/hooks/useOdpady'
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView, StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'

function formatDatum(datum: string) {
  const d = new Date(datum)
  const dnes = new Date()
  const zajtra = new Date()
  zajtra.setDate(dnes.getDate() + 1)

  const jeD = d.toDateString() === dnes.toDateString()
  const jeZ = d.toDateString() === zajtra.toDateString()

  const den = d.toLocaleDateString('sk-SK', { weekday: 'long' })
  const datumStr = d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long' })

  if (jeD) return { hlavny: 'Dnes', sub: datumStr, urgent: true }
  if (jeZ) return { hlavny: 'Zajtra', sub: datumStr, urgent: true }
  return { hlavny: den.charAt(0).toUpperCase() + den.slice(1), sub: datumStr, urgent: false }
}

export default function OdpadyScreen() {
  const { odpady, loading, error } = useOdpady()

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Odpadový kalendár</Text>
        <Text style={styles.headerSub}>Najbližšie vývozy odpadu</Text>
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

      {!loading && !error && odpady.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🗓️</Text>
          <Text style={styles.emptyTitle}>Žiadne plánované vývozy</Text>
        </View>
      )}

      {!loading && !error && odpady.length > 0 && (
        <FlatList
          data={odpady}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const { hlavny, sub, urgent } = formatDatum(item.datum)
            return (
              <View style={[styles.card, urgent && styles.cardUrgent]}>
                <View style={[styles.colorBar, { backgroundColor: item.typ.farba }]} />
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.typBadge, { backgroundColor: item.typ.farba + '22' }]}>
                      <Text style={[styles.typText, { color: item.typ.farba }]}>
                        {item.typ.nazov}
                      </Text>
                    </View>
                    {item.poznamka && (
                      <Text style={styles.poznamka}>{item.poznamka}</Text>
                    )}
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={[styles.denText, urgent && styles.denUrgent]}>{hlavny}</Text>
                    <Text style={styles.datumText}>{sub}</Text>
                  </View>
                </View>
              </View>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#888', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingText: { color: '#888', fontSize: 14, marginTop: 8 },
  errorIcon: { fontSize: 36 },
  errorText: { color: '#C62828', fontSize: 15 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardUrgent: {
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  colorBar: { width: 5 },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  cardLeft: { flex: 1, gap: 4 },
  cardRight: { alignItems: 'flex-end' },
  typBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typText: { fontSize: 13, fontWeight: '700' },
  poznamka: { fontSize: 12, color: '#888' },
  denText: { fontSize: 15, fontWeight: '700', color: '#333' },
  denUrgent: { color: '#2E7D32' },
  datumText: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
})