import { useAktuality } from '@/src/hooks/useAktuality'
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const KATEGORIA_FARBY: Record<string, string> = {
  oznam: '#1565C0',
  akcia: '#2E7D32',
  uzavierka: '#E65100',
  vypadok: '#B71C1C',
  sport: '#4A148C',
  ine: '#37474F',
}

const KATEGORIA_LABEL: Record<string, string> = {
  oznam: 'Oznam',
  akcia: 'Akcia',
  uzavierka: 'Uzávierka',
  vypadok: 'Výpadok',
  sport: 'Šport',
  ine: 'Iné',
}

export default function AktualityScreen() {
  const { aktuality, loading, error } = useAktuality()

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Chyba: {error}</Text>
      </View>
    )
  }

  if (aktuality.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Žiadne aktuality</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={aktuality}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: KATEGORIA_FARBY[item.kategoria] }]}>
                <Text style={styles.badgeText}>{KATEGORIA_LABEL[item.kategoria]}</Text>
              </View>
              <Text style={styles.datum}>
                {item.published_at ? new Date(item.published_at).toLocaleDateString('sk-SK') : ''}
              </Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            {item.perex && <Text style={styles.perex}>{item.perex}</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  datum: { color: '#757575', fontSize: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  perex: { fontSize: 14, color: '#555', lineHeight: 20 },
  errorText: { color: 'red', fontSize: 16 },
  emptyText: { color: '#757575', fontSize: 16 },
})