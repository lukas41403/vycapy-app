import { AppHeader } from '@/components/AppHeader'
import { C } from '@/constants/colors'
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
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <AppHeader
        title="Odpadový kalendár"
        subtitle="Najbližšie vývozy odpadu"
      />

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
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
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🗓️</Text>
          <Text style={styles.emptyTitle}>Žiadne plánované vývozy</Text>
          <Text style={styles.emptyText}>
            Harmonogram bude doplnený. Skontrolujte oficiálnu stránku obce.
          </Text>
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
  safe: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingText: { color: C.textMuted, fontSize: 14, marginTop: 8 },
  errorIcon: { fontSize: 36 },
  errorText: { color: C.brand.red, fontSize: 15 },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyIcon: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  emptyText: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },

  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardUrgent: {
    shadowOpacity: 0.12,
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
  poznamka: { fontSize: 12, color: C.textMuted },
  denText: { fontSize: 15, fontWeight: '700', color: C.text },
  denUrgent: { color: C.primary },
  datumText: { fontSize: 12, color: C.textPlaceholder, marginTop: 2 },
})
