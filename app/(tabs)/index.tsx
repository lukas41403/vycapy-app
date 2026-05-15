/**
 * Hlavná obrazovka — Dashboard / Domov.
 *
 * Sekcie:
 *   1. Hero header — erb obce + pozdrav + dátum
 *   2. Rýchle akcie (2x2 grid)
 *   3. Najbližší vývoz odpadu (1 karta)
 *   4. Posledné aktuality (2 najnovšie)
 *   5. Najbližšie podujatie
 */

import { ErbBadge } from '@/components/AppHeader'
import { C } from '@/constants/colors'
import { useAktuality } from '@/src/hooks/useAktuality'
import { useOdpady } from '@/src/hooks/useOdpady'
import { usePodujatia } from '@/src/hooks/usePodujatia'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

// ─── Pomocné funkcie ──────────────────────────────────────────────────────
function pozdravPodlaCasu(): { text: string; emoji: string } {
  const h = new Date().getHours()
  if (h >= 6 && h < 11) return { text: 'Dobré ráno', emoji: '☀️' }
  if (h >= 11 && h < 18) return { text: 'Dobrý deň', emoji: '🌤️' }
  if (h >= 18 && h < 22) return { text: 'Dobrý večer', emoji: '🌅' }
  return { text: 'Dobrú noc', emoji: '🌙' }
}

function formatDnes(): string {
  const d = new Date()
  const s = d.toLocaleDateString('sk-SK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatVyvoz(datum: string): { hlavny: string; sub: string; urgent: boolean } {
  const d = new Date(datum)
  const dnes = new Date()
  const zajtra = new Date()
  zajtra.setDate(dnes.getDate() + 1)
  const jeDnes = d.toDateString() === dnes.toDateString()
  const jeZajtra = d.toDateString() === zajtra.toDateString()
  const den = d.toLocaleDateString('sk-SK', { weekday: 'long' })
  const datumStr = d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long' })
  if (jeDnes) return { hlavny: 'Dnes', sub: datumStr, urgent: true }
  if (jeZajtra) return { hlavny: 'Zajtra', sub: datumStr, urgent: true }
  return { hlavny: den.charAt(0).toUpperCase() + den.slice(1), sub: datumStr, urgent: false }
}

// ─── Akcie v 2×2 gride ────────────────────────────────────────────────────
const AKCIE = [
  { id: 'hlasenie',  emoji: '⚠️', title: 'Nahlásiť poruchu', path: '/hlasenie',  farba: C.brand.red },
  { id: 'podujatia', emoji: '📅', title: 'Podujatia',        path: '/podujatia', farba: C.brand.green },
  { id: 'prenajom',  emoji: '🏟️', title: 'Prenájom haly',    path: '/prenajom',  farba: C.brand.gold },
  { id: 'kontakty',  emoji: '📞', title: 'Kontakty',         path: '/kontakty',  farba: '#37474F' },
] as const

const KATEGORIA_LABEL: Record<string, string> = {
  oznam: 'Oznam', akcia: 'Akcia', uzavierka: 'Uzávierka',
  vypadok: 'Výpadok', sport: 'Šport', ine: 'Iné',
}

const KATEGORIA_FARBY: Record<string, { bg: string; text: string }> = {
  oznam:     { bg: C.status.info.bg,    text: C.status.info.fg },
  akcia:     { bg: C.status.success.bg, text: C.status.success.fg },
  uzavierka: { bg: '#FFF3E0',           text: '#E65100' },
  vypadok:   { bg: C.status.danger.bg,  text: C.status.danger.fg },
  sport:     { bg: '#E3F2FD',           text: '#1565C0' },
  ine:       { bg: '#ECEFF1',           text: '#37474F' },
}

const KATEGORIA_PLACEHOLDER: Record<string, { bg: string; emoji: string }> = {
  oznam:     { bg: '#90A4AE', emoji: '📋' },
  akcia:     { bg: '#1B5E20', emoji: '🎉' },
  uzavierka: { bg: '#C62828', emoji: '🚧' },
  vypadok:   { bg: '#C62828', emoji: '⚠️' },
  sport:     { bg: '#1565C0', emoji: '⚽' },
  ine:       { bg: '#607D8B', emoji: '📰' },
}

// ─── Komponent ────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter()
  const { aktuality } = useAktuality()
  const { odpady } = useOdpady()
  const { podujatia } = usePodujatia()

  const pozdrav = useMemo(() => pozdravPodlaCasu(), [])
  const dnes = useMemo(() => formatDnes(), [])
  const najblizsiVyvoz = odpady[0] // hook už vracia zoradené od najbližšieho
  const poslednych2 = aktuality.slice(0, 2)
  const najblizsie = podujatia[0]

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <ErbBadge variant="brand" />
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle} numberOfLines={1}>Výčapy-Opatovce</Text>
              <Text style={styles.heroDate}>{dnes}</Text>
            </View>
          </View>
          <Text style={styles.heroGreet}>
            {pozdrav.text}! {pozdrav.emoji}
          </Text>
        </View>

        {/* ── RÝCHLE AKCIE ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Rýchle akcie</Text>
          <View style={styles.akcieGrid}>
            {AKCIE.map(a => (
              <TouchableOpacity
                key={a.id}
                style={styles.akciaKarta}
                activeOpacity={0.8}
                onPress={() => router.push(a.path as never)}
              >
                <View style={[styles.akciaIconBox, { backgroundColor: a.farba + '18' }]}>
                  <Text style={styles.akciaEmoji}>{a.emoji}</Text>
                </View>
                <Text style={styles.akciaTitle}>{a.title}</Text>
                <View style={[styles.akciaPas, { backgroundColor: a.farba }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── NAJBLIŽŠÍ VÝVOZ ──────────────────────────────────── */}
        {najblizsiVyvoz && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Najbližší vývoz odpadu</Text>
              <TouchableOpacity onPress={() => router.push('/explore' as never)}>
                <Text style={styles.sectionLink}>Celý kalendár →</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.vyvozKarta}
              activeOpacity={0.8}
              onPress={() => router.push('/explore' as never)}
            >
              <View style={[styles.vyvozBar, { backgroundColor: najblizsiVyvoz.typ.farba }]} />
              <View style={styles.vyvozObsah}>
                <View style={{ flex: 1 }}>
                  <View style={[styles.vyvozBadge, { backgroundColor: najblizsiVyvoz.typ.farba + '22' }]}>
                    <Text style={[styles.vyvozBadgeText, { color: najblizsiVyvoz.typ.farba }]}>
                      ♻️ {najblizsiVyvoz.typ.nazov}
                    </Text>
                  </View>
                  {najblizsiVyvoz.poznamka && (
                    <Text style={styles.vyvozPoznamka}>{najblizsiVyvoz.poznamka}</Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {(() => {
                    const { hlavny, sub, urgent } = formatVyvoz(najblizsiVyvoz.datum)
                    return (
                      <>
                        <Text style={[styles.vyvozDen, urgent && { color: C.primary }]}>{hlavny}</Text>
                        <Text style={styles.vyvozDatum}>{sub}</Text>
                      </>
                    )
                  })()}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── POSLEDNÉ AKTUALITY ───────────────────────────────── */}
        {poslednych2.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Posledné aktuality</Text>
              <TouchableOpacity onPress={() => router.push('/aktuality' as never)}>
                <Text style={styles.sectionLink}>Zobraziť všetky →</Text>
              </TouchableOpacity>
            </View>
            {poslednych2.map(a => {
              const kat = KATEGORIA_FARBY[a.kategoria] ?? KATEGORIA_FARBY.ine
              const placeholder = KATEGORIA_PLACEHOLDER[a.kategoria] ?? KATEGORIA_PLACEHOLDER.ine
              return (
                <TouchableOpacity
                  key={a.id}
                  style={styles.aktKarta}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/aktualita/${a.id}` as never)}
                >
                  {a.cover_url ? (
                    <Image
                      source={{ uri: a.cover_url }}
                      style={styles.aktThumb}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View style={[styles.aktThumb, { backgroundColor: placeholder.bg, justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 28 }}>{placeholder.emoji}</Text>
                    </View>
                  )}
                  <View style={styles.aktInfo}>
                    <View style={styles.aktKartaTop}>
                      <View style={[styles.aktBadge, { backgroundColor: kat.bg }]}>
                        <Text style={[styles.aktBadgeText, { color: kat.text }]}>
                          {KATEGORIA_LABEL[a.kategoria] ?? a.kategoria}
                        </Text>
                      </View>
                      <Text style={styles.aktDatum}>
                        {a.published_at
                          ? new Date(a.published_at).toLocaleDateString('sk-SK', {
                              day: 'numeric', month: 'short',
                            })
                          : ''}
                      </Text>
                    </View>
                    <Text style={styles.aktTitle} numberOfLines={2}>{a.title}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* ── NAJBLIŽŠIE PODUJATIE ─────────────────────────────── */}
        {najblizsie && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Najbližšie podujatie</Text>
              <TouchableOpacity onPress={() => router.push('/podujatia' as never)}>
                <Text style={styles.sectionLink}>Všetky →</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.podKarta}
              activeOpacity={0.8}
              onPress={() => router.push(`/podujatie/${najblizsie.id}` as never)}
            >
              <Text style={styles.podTitle}>{najblizsie.title}</Text>
              <View style={styles.podMeta}>
                <Text style={styles.podMetaText}>
                  📅 {new Date(najblizsie.datum_od).toLocaleDateString('sk-SK', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </Text>
                <Text style={styles.podMetaText}>
                  ⏰ {new Date(najblizsie.datum_od).toLocaleTimeString('sk-SK', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
                {najblizsie.miesto && (
                  <Text style={styles.podMetaText}>📍 {najblizsie.miesto}</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* spodok */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Štýly ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  scroll: { paddingBottom: 16 },

  // Hero
  hero: {
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  heroTitle: { color: C.onPrimary, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  heroDate: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  heroGreet: { color: C.onPrimary, fontSize: 16, fontWeight: '600' },

  // Sekcie
  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: C.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sectionLink: { fontSize: 12, fontWeight: '700', color: C.primary },

  // Akcie 2x2
  akcieGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  akciaKarta: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 110,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    paddingBottom: 18,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  akciaIconBox: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  akciaEmoji: { fontSize: 22 },
  akciaTitle: {
    fontSize: 14, fontWeight: '700', color: C.text, lineHeight: 19,
  },
  akciaPas: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
  },

  // Vývoz karta
  vyvozKarta: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  vyvozBar: { width: 6 },
  vyvozObsah: {
    flex: 1, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    padding: 14, gap: 12,
  },
  vyvozBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  vyvozBadgeText: { fontSize: 13, fontWeight: '800' },
  vyvozPoznamka: { fontSize: 12, color: C.textMuted, marginTop: 4 },
  vyvozDen: { fontSize: 16, fontWeight: '800', color: C.text },
  vyvozDatum: { fontSize: 12, color: C.textPlaceholder, marginTop: 2 },

  // Aktualita karta (malá, s thumbnail vľavo)
  aktKarta: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  aktThumb: { width: 88, height: 88, backgroundColor: C.surfaceAlt },
  aktInfo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  aktKartaTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  aktBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  aktBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  aktDatum: { fontSize: 11, color: C.textPlaceholder },
  aktTitle: { fontSize: 14, fontWeight: '700', color: C.text, lineHeight: 19 },

  // Podujatie karta
  podKarta: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: C.accent,
  },
  podTitle: { fontSize: 16, fontWeight: '700', color: C.text, lineHeight: 22, marginBottom: 8 },
  podMeta: { gap: 4 },
  podMetaText: { fontSize: 13, color: C.textSecondary },
})
