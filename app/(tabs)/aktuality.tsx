/**
 * Aktuality — news feed s veľkými cover fotkami.
 */

import { AppHeader } from '@/components/AppHeader'
import { C } from '@/constants/colors'
import { useAktuality } from '@/src/hooks/useAktuality'
import { Image } from 'expo-image'
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
  oznam:     { bg: C.status.info.bg,    text: C.status.info.fg },
  akcia:     { bg: C.status.success.bg, text: C.status.success.fg },
  uzavierka: { bg: '#FFF3E0',           text: '#E65100' },
  vypadok:   { bg: C.status.danger.bg,  text: C.status.danger.fg },
  sport:     { bg: '#E3F2FD',           text: '#1565C0' },
  ine:       { bg: '#ECEFF1',           text: '#37474F' },
}

const KATEGORIA_LABEL: Record<string, string> = {
  oznam: 'Oznam', akcia: 'Akcia', uzavierka: 'Uzávierka',
  vypadok: 'Výpadok', sport: 'Šport', ine: 'Iné',
}

const KATEGORIA_PLACEHOLDER: Record<string, { bg: string; emoji: string }> = {
  oznam:     { bg: '#90A4AE', emoji: '📋' },
  akcia:     { bg: '#1B5E20', emoji: '🎉' },
  uzavierka: { bg: '#C62828', emoji: '🚧' },
  vypadok:   { bg: '#C62828', emoji: '⚠️' },
  sport:     { bg: '#1565C0', emoji: '⚽' },
  ine:       { bg: '#607D8B', emoji: '📰' },
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
            const placeholder = KATEGORIA_PLACEHOLDER[item.kategoria] ?? KATEGORIA_PLACEHOLDER.ine
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push(`/aktualita/${item.id}`)}
              >
                {item.cover_url ? (
                  <Image
                    source={{ uri: item.cover_url }}
                    style={styles.cover}
                    contentFit="cover"
                    transition={250}
                  />
                ) : (
                  <View style={[styles.coverPlaceholder, { backgroundColor: placeholder.bg }]}>
                    <Text style={styles.coverEmoji}>{placeholder.emoji}</Text>
                  </View>
                )}

                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={[styles.badge, { backgroundColor: kat.bg }]}>
                      <Text style={[styles.badgeText, { color: kat.text }]}>
                        {KATEGORIA_LABEL[item.kategoria] ?? item.kategoria}
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
                    <Text style={styles.cardPerex} numberOfLines={2}>{item.perex}</Text>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.readMore}>Čítať viac →</Text>
                  </View>
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
  errorText: { color: '#C62828', fontSize: 15 },

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

  list: { padding: 16, gap: 16 },

  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  cover: {
    width: '100%',
    height: 200,
    backgroundColor: C.surfaceAlt,
  },
  coverPlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverEmoji: { fontSize: 72, opacity: 0.9 },

  cardBody: { padding: 16 },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  datum: { fontSize: 12, color: C.textPlaceholder },

  cardTitle: {
    fontSize: 18, fontWeight: '800', color: C.text,
    lineHeight: 24, marginBottom: 6, letterSpacing: -0.2,
  },
  cardPerex: { fontSize: 14, color: C.textSecondary, lineHeight: 20, marginBottom: 12 },
  cardFooter: { borderTopWidth: 1, borderTopColor: C.divider, paddingTop: 10 },
  readMore: { fontSize: 13, fontWeight: '700', color: C.primary },
})