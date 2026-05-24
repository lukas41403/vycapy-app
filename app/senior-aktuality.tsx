/**
 * Senior — Aktuality.
 *
 * Veľký zoznam aktualít → klik otvorí inline veľký detail.
 * Zostáva v senior móde, čiže žiadne malé písmo, žiadne ďalšie navigácie.
 *
 * Layout:
 *   - Header s ← Späť a nadpisom
 *   - Filter chips (Všetko / Oznam / Akcia / Uzávierka) — voliteľné
 *   - Zoznam kariet s veľkým titulkom + perex + dátumom
 *   - Klik → expand inline, nie navigácia na detail
 */

import { FONT_SCALES, SENIOR } from '@/constants/seniorMode'
import { useSeniorMode } from '@/hooks/useSeniorMode'
import { useAktuality } from '@/src/hooks/useAktuality'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const KAT_LABEL: Record<string, string> = {
  oznam: 'Oznam', akcia: 'Akcia', uzavierka: 'Uzávierka',
  vypadok: 'Výpadok', sport: 'Šport', ine: 'Iné',
}

const KAT_FARBA: Record<string, string> = {
  oznam: '#1565C0',
  akcia: '#2E7D32',
  uzavierka: '#E65100',
  vypadok: '#C62828',
  sport: '#1565C0',
  ine: '#37474F',
}

const KAT_EMOJI: Record<string, string> = {
  oznam: '📋',
  akcia: '🎉',
  uzavierka: '🚧',
  vypadok: '⚠️',
  sport: '⚽',
  ine: '📰',
}

export default function SeniorAktualityScreen() {
  const router = useRouter()
  const { fontScale } = useSeniorMode()
  const F = FONT_SCALES[fontScale]
  const { aktuality, loading, refresh } = useAktuality()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [filterKat, setFilterKat] = useState<string | null>(null)

  const filtrovane = useMemo(() => {
    if (!filterKat) return aktuality
    return aktuality.filter(a => a.kategoria === filterKat)
  }, [aktuality, filterKat])

  async function handleRefresh() {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Späť"
        >
          <Text style={[styles.backText, { fontSize: F.body }]}>← Späť</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: F.heading }]}>📰 Aktuality</Text>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <Chip
          label="Všetko"
          active={!filterKat}
          onPress={() => setFilterKat(null)}
          F={F}
        />
        {['oznam', 'akcia', 'uzavierka', 'vypadok'].map(k => (
          <Chip
            key={k}
            label={KAT_LABEL[k]}
            farba={KAT_FARBA[k]}
            active={filterKat === k}
            onPress={() => setFilterKat(filterKat === k ? null : k)}
            F={F}
          />
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={SENIOR.colors.primary} />
          <Text style={[styles.loadingText, { fontSize: F.body }]}>Načítavam...</Text>
        </View>
      ) : filtrovane.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>📭</Text>
          <Text style={[styles.emptyTitle, { fontSize: F.title }]}>
            Žiadne aktuality
          </Text>
          <Text style={[styles.emptySub, { fontSize: F.body }]}>
            Skontrolujte neskôr.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={SENIOR.colors.primary}
              colors={[SENIOR.colors.primary]}
              progressBackgroundColor="#FFF"
              size={2}
            />
          }
        >
          {filtrovane.map(a => {
            const farba = KAT_FARBA[a.kategoria] ?? '#37474F'
            const isExpanded = expanded === a.id
            return (
              <TouchableOpacity
                key={a.id}
                style={[styles.card, isExpanded && styles.cardExpanded]}
                activeOpacity={0.9}
                onPress={() => setExpanded(isExpanded ? null : a.id)}
                accessibilityRole="button"
                accessibilityLabel={`${a.title}, ${isExpanded ? 'zatvoriť' : 'rozbaliť detail'}`}
              >
                {a.cover_url && (
                  <Image
                    source={{ uri: a.cover_url }}
                    style={styles.cover}
                    contentFit="cover"
                    transition={250}
                  />
                )}
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={[styles.badge, { backgroundColor: farba }]}>
                      <Text style={[styles.badgeText, { fontSize: F.small }]}>
                        {KAT_EMOJI[a.kategoria]} {KAT_LABEL[a.kategoria]?.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.datum, { fontSize: F.small }]}>
                      {a.published_at
                        ? new Date(a.published_at).toLocaleDateString('sk-SK', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })
                        : ''}
                    </Text>
                  </View>
                  <Text style={[styles.cardTitle, { fontSize: F.title }]}>
                    {a.title}
                  </Text>
                  {a.perex && !isExpanded && (
                    <Text style={[styles.cardPerex, { fontSize: F.body }]} numberOfLines={3}>
                      {a.perex}
                    </Text>
                  )}
                  {isExpanded && (
                    <>
                      {a.perex && (
                        <Text style={[styles.cardPerex, { fontSize: F.body, fontWeight: '700' }]}>
                          {a.perex}
                        </Text>
                      )}
                      <Text style={[styles.cardBodyText, { fontSize: F.body }]}>
                        {a.body}
                      </Text>
                      <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setExpanded(null)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.closeBtnText, { fontSize: F.body }]}>
                          ⬆ Zavrieť
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {!isExpanded && (
                    <Text style={[styles.readMore, { fontSize: F.body }]}>
                      Čítať viac ↓
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function Chip({ label, farba, active, onPress, F }: {
  label: string
  farba?: string
  active: boolean
  onPress: () => void
  F: typeof FONT_SCALES['medium']
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active && { backgroundColor: farba ?? SENIOR.colors.text, borderColor: farba ?? SENIOR.colors.text },
      ]}
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[
        styles.chipText,
        { fontSize: F.body },
        active && { color: '#FFFFFF' },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SENIOR.colors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    borderBottomWidth: 3, borderBottomColor: SENIOR.colors.text,
    gap: 8,
  },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { color: SENIOR.colors.primary, fontWeight: '800' },
  title: { fontWeight: '900', color: SENIOR.colors.text },

  chipsRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18, paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 3,
    borderColor: SENIOR.colors.text,
  },
  chipText: { fontWeight: '800', color: SENIOR.colors.text },

  scroll: { padding: 20, gap: 16 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  loadingText: { color: SENIOR.colors.text, marginTop: 12, fontWeight: '700' },
  bigEmoji: { fontSize: 64 },
  emptyTitle: { fontWeight: '900', color: SENIOR.colors.text },
  emptySub: { color: SENIOR.colors.textSecondary, textAlign: 'center', fontWeight: '600' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: SENIOR.colors.text,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  cardExpanded: {
    borderColor: SENIOR.colors.primary,
    borderWidth: 4,
  },
  cover: {
    width: '100%',
    height: 200,
    backgroundColor: '#EEEEEE',
  },
  cardBody: { padding: 20, gap: 10 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10,
  },
  badgeText: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 0.5 },
  datum: { color: SENIOR.colors.textSecondary, fontWeight: '700' },
  cardTitle: { fontWeight: '900', color: SENIOR.colors.text, letterSpacing: -0.3 },
  cardPerex: { color: SENIOR.colors.text, fontWeight: '600', marginTop: 4 },
  cardBodyText: {
    color: SENIOR.colors.text,
    fontWeight: '500',
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 2,
    borderTopColor: SENIOR.colors.borderLight,
  },
  readMore: {
    color: SENIOR.colors.primary,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'right',
  },
  closeBtn: {
    backgroundColor: SENIOR.colors.text,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  closeBtnText: { color: '#FFFFFF', fontWeight: '900' },
})
