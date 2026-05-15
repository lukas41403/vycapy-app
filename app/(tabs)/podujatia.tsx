import { AppHeader } from '@/components/AppHeader'
import { C } from '@/constants/colors'
import { usePodujatia } from '@/src/hooks/usePodujatia'
import { useRouter } from 'expo-router'
import {
    ActivityIndicator, SafeAreaView, ScrollView,
    StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'

const KATEGORIA_CONFIG: Record<string, { emoji: string; farba: string; label: string }> = {
  kultura:  { emoji: '🎭', farba: '#6A1B9A',     label: 'Kultúra' },
  sport:    { emoji: '⚽', farba: '#1565C0',     label: 'Šport' },
  slavnost: { emoji: '🎉', farba: C.brand.gold,  label: 'Slávnosť' },
  kino:     { emoji: '🎬', farba: C.brand.green, label: 'Kino' },
  divadlo:  { emoji: '🎪', farba: '#880E4F',     label: 'Divadlo' },
  deti:     { emoji: '🎈', farba: '#F57F17',     label: 'Pre deti' },
  ine:      { emoji: '📅', farba: '#37474F',     label: 'Iné' },
}

function formatDatum(datum_od: string, _datum_do: string | null) {
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
  const router = useRouter()

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <AppHeader title="Podujatia" subtitle="Kalendár obecných akcií" />

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

      {!loading && !error && podujatia.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>Žiadne nadchádzajúce podujatia</Text>
          <Text style={styles.emptyText}>
            Aktuálne nie sú v kalendári žiadne podujatia. Skontrolujte neskôr.
          </Text>
        </View>
      )}

      {!loading && !error && podujatia.length > 0 && (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {podujatia.map(p => {
            const kat = KATEGORIA_CONFIG[p.kategoria] ?? KATEGORIA_CONFIG.ine
            const { den, cas } = formatDatum(p.datum_od, p.datum_do)
            const blizko = jeBlizko(p.datum_od)

            return (
              <TouchableOpacity
                key={p.id}
                style={styles.karta}
                activeOpacity={0.75}
                onPress={() => router.push(`/podujatie/${p.id}`)}
              >
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
                <View style={styles.cardFooter}>
                  <Text style={[styles.readMore, { color: kat.farba }]}>Detail podujatia →</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
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

  list: { padding: 16, gap: 12 },
  karta: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    overflow: 'hidden',
  },
  blizkoTag: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: C.accent, borderBottomLeftRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  blizkoText: { color: C.brand.redDark, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  kartaTop: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  emojiBox: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 26 },
  kartaInfo: { flex: 1, gap: 6 },
  katBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  katLabel: { fontSize: 11, fontWeight: '700' },
  kartaTitle: { fontSize: 16, fontWeight: '700', color: C.text, lineHeight: 22 },
  detaily: { gap: 4, marginBottom: 8 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailIcon: { fontSize: 13 },
  detailText: { fontSize: 13, color: C.textSecondary },
  popis: { fontSize: 13, color: C.textMuted, lineHeight: 19, marginTop: 4 },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: C.divider,
    paddingTop: 10,
    marginTop: 10,
  },
  readMore: { fontSize: 13, fontWeight: '700' },
})
