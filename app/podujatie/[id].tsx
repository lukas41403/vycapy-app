import { C } from '@/constants/colors'
import { useBookmark } from '@/src/hooks/useBookmarks'
import { pridajDoKalendara } from '@/src/lib/ical'
import { zdielajPodujatie } from '@/src/lib/share'
import { supabase } from '@/src/lib/supabase'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator, Linking, SafeAreaView, ScrollView,
    StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'

type Podujatie = {
  id: string
  title: string
  popis: string | null
  kategoria: string
  datum_od: string
  datum_do: string | null
  miesto: string | null
  obrazok_url: string | null
}

const KATEGORIA_CONFIG: Record<string, { emoji: string; farba: string; label: string }> = {
  kultura:  { emoji: '🎭', farba: '#6A1B9A',     label: 'Kultúra' },
  sport:    { emoji: '⚽', farba: '#1565C0',     label: 'Šport' },
  slavnost: { emoji: '🎉', farba: C.brand.gold,  label: 'Slávnosť' },
  kino:     { emoji: '🎬', farba: C.brand.green, label: 'Kino' },
  divadlo:  { emoji: '🎪', farba: '#880E4F',     label: 'Divadlo' },
  deti:     { emoji: '🎈', farba: '#F57F17',     label: 'Pre deti' },
  ine:      { emoji: '📅', farba: '#37474F',     label: 'Iné' },
}

function formatDatumDlhy(iso: string) {
  const d = new Date(iso)
  const den = d.toLocaleDateString('sk-SK', { weekday: 'long' })
  const datum = d.toLocaleDateString('sk-SK', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const cas = d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })
  return {
    den: den.charAt(0).toUpperCase() + den.slice(1),
    datum,
    cas,
  }
}

function jeMinule(iso: string) {
  return new Date(iso).getTime() < Date.now()
}

export default function PodujatieDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [podujatie, setPodujatie] = useState<Podujatie | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('podujatia')
        .select('*')
        .eq('id', id)
        .single()
      setPodujatie(data)
      setLoading(false)
    }
    fetch()
  }, [id])

  const kat = podujatie
    ? KATEGORIA_CONFIG[podujatie.kategoria] ?? KATEGORIA_CONFIG.ine
    : KATEGORIA_CONFIG.ine

  const bookmark = useBookmark(
    podujatie
      ? {
          id: podujatie.id,
          kind: 'podujatie',
          title: podujatie.title,
          podtitul: podujatie.miesto ?? undefined,
          kategoria: podujatie.kategoria,
          emoji: kat.emoji,
          datum: podujatie.datum_od,
        }
      : null,
  )

  async function zdielat() {
    if (!podujatie) return
    await zdielajPodujatie(podujatie)
  }

  async function pridatDoKal() {
    if (!podujatie) return
    await pridajDoKalendara({
      id: podujatie.id,
      title: podujatie.title,
      description: podujatie.popis ?? undefined,
      location: podujatie.miesto ?? undefined,
      start: podujatie.datum_od,
      end: podujatie.datum_do ?? undefined,
    })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Späť</Text>
        </TouchableOpacity>
        {podujatie && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={bookmark.toggle}
              style={[styles.iconBtn, bookmark.isMarked && styles.iconBtnActive]}
              accessibilityRole="button"
              accessibilityLabel={bookmark.isMarked ? 'Odstrániť z môjho zoznamu' : 'Pridať do môjho zoznamu'}
            >
              <Text style={styles.iconText}>{bookmark.isMarked ? '🔖' : '🏷️'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={zdielat}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Zdieľať podujatie"
            >
              <Text style={styles.iconText}>↗</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      )}

      {!loading && podujatie && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero — kategória + emoji */}
          <View style={[styles.hero, { backgroundColor: kat.farba + '12' }]}>
            <View style={[styles.emojiBox, { backgroundColor: kat.farba + '22' }]}>
              <Text style={styles.heroEmoji}>{kat.emoji}</Text>
            </View>
            <View style={[styles.katBadge, { backgroundColor: kat.farba }]}>
              <Text style={styles.katBadgeText}>{kat.label}</Text>
            </View>
            {jeMinule(podujatie.datum_od) && (
              <View style={styles.minuleTag}>
                <Text style={styles.minuleText}>Už prebehlo</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{podujatie.title}</Text>

          {/* Detaily — kedy / kde */}
          <View style={styles.infoBlok}>
            <DatumRiadok datum_od={podujatie.datum_od} datum_do={podujatie.datum_do} />

            {podujatie.miesto && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Miesto</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(podujatie.miesto!)}`
                  )}>
                    <Text style={[styles.infoText, styles.infoLink]}>{podujatie.miesto}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {podujatie.popis ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.body}>{podujatie.popis}</Text>
            </>
          ) : (
            <View style={styles.divider} />
          )}

          {!jeMinule(podujatie.datum_od) && (
            <TouchableOpacity
              style={styles.calBtn}
              onPress={pridatDoKal}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Pridať podujatie do kalendára"
            >
              <Text style={styles.calBtnEmoji}>📅</Text>
              <Text style={styles.calBtnText}>Pridať do kalendára</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.disclaimer}>
            Pre viac informácií kontaktujte obecný úrad.
          </Text>
        </ScrollView>
      )}

      {!loading && !podujatie && (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>🔍</Text>
          <Text style={styles.errorText}>Podujatie sa nenašlo</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

function DatumRiadok({ datum_od, datum_do }: { datum_od: string; datum_do: string | null }) {
  const od = formatDatumDlhy(datum_od)
  const do_ = datum_do ? formatDatumDlhy(datum_do) : null

  // Rovnaký deň → ukáž jeden dátum + časový rozsah
  // Iný deň → ukáž dve riadky (od / do)
  const rovnakyDen =
    do_ && new Date(datum_od).toDateString() === new Date(datum_do!).toDateString()

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>📅</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{do_ && !rovnakyDen ? 'Termín' : 'Kedy'}</Text>
        <Text style={styles.infoText}>{od.den}, {od.datum}</Text>
        <Text style={styles.infoSubText}>
          {rovnakyDen
            ? `${od.cas} – ${do_!.cas}`
            : do_
              ? `${od.cas} – ${do_.datum}, ${do_.cas}`
              : od.cas}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },
  navBar: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: { alignSelf: 'flex-start' },
  backText: { fontSize: 16, color: C.primary, fontWeight: '700' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  iconBtnActive: {
    backgroundColor: C.accent + '33',
    borderWidth: 2,
    borderColor: C.primary,
  },
  iconText: { fontSize: 18, color: C.primary, fontWeight: '800' },
  calBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.secondary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 20,
  },
  calBtnEmoji: { fontSize: 22 },
  calBtnText: { color: C.onPrimary, fontSize: 15, fontWeight: '800' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  errorIcon: { fontSize: 48 },
  errorText: { fontSize: 16, color: C.textMuted },

  content: { padding: 20, paddingBottom: 40 },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  emojiBox: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  heroEmoji: { fontSize: 30 },
  katBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  katBadgeText: { color: C.onPrimary, fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  minuleTag: {
    marginLeft: 'auto',
    backgroundColor: C.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.border,
  },
  minuleText: { color: C.textMuted, fontSize: 11, fontWeight: '700' },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: C.text,
    lineHeight: 36,
    marginBottom: 20,
    letterSpacing: -0.5,
  },

  infoBlok: {
    backgroundColor: C.background,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIcon: { fontSize: 18, width: 22 },
  infoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoText: { fontSize: 15, color: C.text, fontWeight: '600' },
  infoSubText: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  infoLink: { color: C.primary, textDecorationLine: 'underline' },

  divider: { height: 1, backgroundColor: C.divider, marginVertical: 20 },
  body: { fontSize: 16, color: C.text, lineHeight: 26 },
  disclaimer: {
    fontSize: 12, color: C.textMuted, textAlign: 'center',
    marginTop: 24, lineHeight: 18,
  },
})
