import { useAktuality } from '@/src/hooks/useAktuality';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const KATEGORIA_FARBY: Record<string, { bg: string; text: string }> = {
  oznam:      { bg: '#E3F2FD', text: '#1565C0' },
  akcia:      { bg: '#E8F5E9', text: '#2E7D32' },
  uzavierka:  { bg: '#FFF3E0', text: '#E65100' },
  vypadok:    { bg: '#FFEBEE', text: '#C62828' },
  sport:      { bg: '#F3E5F5', text: '#6A1B9A' },
  ine:        { bg: '#ECEFF1', text: '#37474F' },
}

const KATEGORIA_LABEL: Record<string, string> = {
  oznam: 'Oznam', akcia: 'Akcia', uzavierka: 'Uzávierka',
  vypadok: 'Výpadok', sport: 'Šport', ine: 'Iné',
}

export default function AktualityScreen() {
  const { aktuality, loading, error } = useAktuality()
  const router = useRouter()

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>V–O</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Výčapy-Opatovce</Text>
            <Text style={styles.headerSub}>Obecná aplikácia</Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Aktuality</Text>
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
          <Text style={styles.errorText}>Nepodarilo sa načítať aktuality</Text>
        </View>
      )}

      {!loading && !error && aktuality.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Žiadne aktuality</Text>
          <Text style={styles.emptyText}>Momentálne nie sú žiadne aktuality.</Text>
        </View>
      )}

      {!loading && !error && aktuality.length > 0 && (
        <FlatList
          data={aktuality}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const kat = KATEGORIA_FARBY[item.kategoria] ?? KATEGORIA_FARBY.ine
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => router.push(`/aktualita/${item.id}`)}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.badge, { backgroundColor: kat.bg }]}>
                    <Text style={[styles.badgeText, { color: kat.text }]}>
                      {KATEGORIA_LABEL[item.kategoria]}
                    </Text>
                  </View>
                  <Text style={styles.datum}>
                    {item.published_at
                      ? new Date(item.published_at).toLocaleDateString('sk-SK', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })
                      : ''}
                  </Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.perex && (
                  <Text style={styles.cardPerex} numberOfLines={3}>{item.perex}</Text>
                )}
                <View style={styles.cardFooter}>
                  <Text style={styles.readMore}>Čítať viac →</Text>
                </View>
              </TouchableOpacity>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  logoBadge: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#2E7D32',
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 1 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingText: { color: '#888', fontSize: 14, marginTop: 8 },
  errorIcon: { fontSize: 36 },
  errorText: { color: '#C62828', fontSize: 15 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  emptyText: { fontSize: 14, color: '#888' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  datum: { fontSize: 12, color: '#AAAAAA' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', lineHeight: 24, marginBottom: 6 },
  cardPerex: { fontSize: 14, color: '#555', lineHeight: 21, marginBottom: 12 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10 },
  readMore: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
})