import { AppHeader } from '@/components/AppHeader'
import { C } from '@/constants/colors'
import { useAktuality } from '@/src/hooks/useAktuality'
import { useRouter } from 'expo-router'
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const KATEGORIA_FARBY: Record<string, { bg: string; text: string }> = {
  oznam:     C.status.info,
  akcia:     C.status.success,
  uzavierka: { bg: '#FFF3E0', text: '#E65100' },
  vypadok:   C.status.danger,
  sport:     C.status.accent,
  ine:       C.status.neutral,
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
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <AppHeader title="Aktuality" subtitle="Čo nové v obci" />

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
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
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Žiadne aktuality</Text>
          <Text style={styles.emptyText}>
            Momentálne nie sú zverejnené žiadne aktuality. Pozrite sa neskôr.
          </Text>
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
  safe: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingText: { color: C.textMuted, fontSize: 14, marginTop: 8 },
  errorIcon: { fontSize: 36 },
  errorText: { color: C.brand.red, fontSize: 15 },

  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 40, gap: 8,
  },
  emptyIcon: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  emptyText: {
    fontSize: 14, color: C.textMuted, textAlign: 'center',
    lineHeight: 20, marginTop: 4,
  },

  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: C.surface, borderRadius: 16, padding: 18,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  datum: { fontSize: 12, color: C.textPlaceholder },
  cardTitle: {
    fontSize: 17, fontWeight: '700', color: C.text,
    lineHeight: 24, marginBottom: 6,
  },
  cardPerex: { fontSize: 14, color: C.textSecondary, lineHeight: 21, marginBottom: 12 },
  cardFooter: { borderTopWidth: 1, borderTopColor: C.divider, paddingTop: 10 },
  readMore: { fontSize: 13, fontWeight: '700', color: C.primary },
})
