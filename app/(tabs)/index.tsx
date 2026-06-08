/**
 * Hlavná obrazovka — Dashboard / Domov.
 *
 * Hierarchia (priorita zhora dole):
 *   1. Hero header — pozdrav, dátum, status úradu
 *   2. **Najdôležitejšie dnes** — prominentná karta s urgentnou vecou
 *      (urgent aktualita PIN > vývoz dnes/zajtra > inak najbližšie podujatie)
 *   3. **Marta CTA** — veľký dôrazný blok pre AI referentku
 *   4. Rýchle akcie (2x2 grid)
 *   5. Aktuality (2 najnovšie)
 *   6. Najbližšie podujatie
 *
 * Diferenciátor: nie len feed, ale praktický obecný dashboard.
 */

import { ErbBadge } from '@/components/AppHeader'
import { Badge, Card, SectionHeader } from '@/components/ui'
import { WeatherCard } from '@/components/WeatherCard'
import { useTenant, uradStatusDnes } from '@/src/config/tenant'
import { useDnesneSviatky } from '@/src/lib/meniny'
import { useAktuality } from '@/src/hooks/useAktuality'
import { useOdpady } from '@/src/hooks/useOdpady'
import { usePodujatia } from '@/src/hooks/usePodujatia'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, shadows, spacing, typo } from '@/src/theme/tokens'
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

// ─── Pomocné ──────────────────────────────────────────────────────────────
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

function dniDo(datum: string | Date): number {
  const d = new Date(datum)
  const dnes = new Date()
  dnes.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - dnes.getTime()) / (24 * 60 * 60 * 1000))
}

function formatVyvoz(datum: string): { hlavny: string; sub: string; urgent: boolean } {
  const dni = dniDo(datum)
  const d = new Date(datum)
  const datumStr = d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long' })
  if (dni === 0) return { hlavny: 'Dnes', sub: datumStr, urgent: true }
  if (dni === 1) return { hlavny: 'Zajtra', sub: datumStr, urgent: true }
  if (dni <= 7) {
    const den = d.toLocaleDateString('sk-SK', { weekday: 'long' })
    return { hlavny: den.charAt(0).toUpperCase() + den.slice(1), sub: datumStr, urgent: false }
  }
  return { hlavny: `Za ${dni} dní`, sub: datumStr, urgent: false }
}

// ─── Akcie 2x2 ────────────────────────────────────────────────────────────
const AKCIE = [
  { id: 'hlasenie',  emoji: '⚠️', title: 'Nahlásiť podnet', path: '/hlasenie',  farba: '#C62828' },
  { id: 'podujatia', emoji: '📅', title: 'Podujatia',        path: '/podujatia', farba: '#2E7D32' },
  { id: 'prenajom',  emoji: '🏟️', title: 'Prenájom haly',    path: '/prenajom',  farba: '#F9A825' },
  { id: 'kontakty',  emoji: '📞', title: 'Kontakty',         path: '/kontakty',  farba: '#37474F' },
] as const

const KAT_LABEL: Record<string, string> = {
  oznam: 'Oznam', akcia: 'Akcia', uzavierka: 'Uzávierka',
  vypadok: 'Výpadok', sport: 'Šport', ine: 'Iné',
}

const KAT_TONE_MAP: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent'> = {
  oznam: 'info',
  akcia: 'success',
  uzavierka: 'warning',
  vypadok: 'danger',
  sport: 'info',
  ine: 'neutral',
}

const KAT_PLACEHOLDER: Record<string, { bg: string; emoji: string }> = {
  oznam:     { bg: '#90A4AE', emoji: '📋' },
  akcia:     { bg: '#1B5E20', emoji: '🎉' },
  uzavierka: { bg: '#C62828', emoji: '🚧' },
  vypadok:   { bg: '#C62828', emoji: '⚠️' },
  sport:     { bg: '#1565C0', emoji: '⚽' },
  ine:       { bg: '#607D8B', emoji: '📰' },
}

const MARTA_FIALOVA = '#6A1B9A'

// ─── Komponent ────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter()
  const t = useThemeColors()
  const tenant = useTenant()
  const { aktuality } = useAktuality()
  const { odpady } = useOdpady()
  const { podujatia } = usePodujatia()

  const pozdrav = useMemo(() => pozdravPodlaCasu(), [])
  const dnes = useMemo(() => formatDnes(), [])
  const stavUradu = useMemo(() => uradStatusDnes(tenant), [tenant])
  const { dnesneMeniny, sviatky } = useDnesneSviatky()

  const najblizsiVyvoz = odpady[0]
  const poslednych2 = aktuality.slice(0, 2)
  const najblizsie = podujatia[0]

  // "Najdôležitejšie dnes" — určuje sa dynamicky.
  // Priorita: 1) urgent aktualita (uzávierka/výpadok) 2) vývoz dnes/zajtra 3) najbližšie podujatie
  const najdolezitejsie = useMemo(() => {
    const urgentAkt = aktuality.find(a => a.kategoria === 'uzavierka' || a.kategoria === 'vypadok')
    if (urgentAkt) {
      return {
        type: 'urgent' as const,
        title: urgentAkt.title,
        subtitle: urgentAkt.perex ?? KAT_LABEL[urgentAkt.kategoria],
        cta: 'Detail',
        path: `/aktualita/${urgentAkt.id}`,
        accent: '#C62828',
        emoji: KAT_PLACEHOLDER[urgentAkt.kategoria]?.emoji ?? '⚠️',
        label: 'URGENTNÉ',
        tone: 'danger' as const,
      }
    }
    if (najblizsiVyvoz) {
      const dni = dniDo(najblizsiVyvoz.datum)
      if (dni <= 1) {
        const { hlavny } = formatVyvoz(najblizsiVyvoz.datum)
        return {
          type: 'odpad' as const,
          title: `Vývoz ${najblizsiVyvoz.typ.nazov.toLowerCase()} — ${hlavny.toLowerCase()}`,
          subtitle: najblizsiVyvoz.poznamka ?? 'Vyložte kontajner ráno pred dom',
          cta: 'Kalendár',
          path: '/explore',
          accent: najblizsiVyvoz.typ.farba,
          emoji: '🗑️',
          label: 'DNES',
          tone: 'warning' as const,
        }
      }
    }
    if (najblizsie) {
      return {
        type: 'podujatie' as const,
        title: najblizsie.title,
        subtitle: new Date(najblizsie.datum_od).toLocaleDateString('sk-SK', {
          weekday: 'long', day: 'numeric', month: 'long',
        }),
        cta: 'Detail',
        path: `/podujatie/${najblizsie.id}`,
        accent: '#F9A825',
        emoji: '📅',
        label: 'NAJBLIŽŠIE PODUJATIE',
        tone: 'accent' as const,
      }
    }
    return null
  }, [aktuality, najblizsiVyvoz, najblizsie])

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={t.primary} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* HERO ─────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { backgroundColor: t.primary }]}>
          <View style={styles.heroRow}>
            <ErbBadge variant="brand" />
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle} numberOfLines={1}>{tenant.nazov}</Text>
              <Text style={styles.heroDate}>{dnes}</Text>
            </View>
          </View>
          <View style={styles.heroBottom}>
            <Text style={styles.heroGreet}>
              {pozdrav.text}! {pozdrav.emoji}
            </Text>

            {/* Meniny + sviatky pill */}
            {(dnesneMeniny.meno || sviatky.length > 0) && (
              <View style={styles.meninyPill}>
                {sviatky[0] ? (
                  <>
                    <Text style={styles.meninyEmoji}>{sviatky[0].ikona}</Text>
                    <Text style={styles.meninyText} numberOfLines={1}>
                      {sviatky[0].nazov}
                      {dnesneMeniny.meno && !sviatky[0].nazov.includes(dnesneMeniny.meno) && (
                        ` · meniny: ${dnesneMeniny.meno}`
                      )}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.meninyEmoji}>🎂</Text>
                    <Text style={styles.meninyText} numberOfLines={1}>
                      Meniny: {dnesneMeniny.meno}
                    </Text>
                  </>
                )}
              </View>
            )}

            <View style={[styles.uradPill, { backgroundColor: stavUradu.jeOtvoreneTeraz ? 'rgba(105,240,174,0.18)' : 'rgba(255,255,255,0.18)' }]}>
              <View style={[styles.uradDot, { backgroundColor: stavUradu.jeOtvoreneTeraz ? '#69F0AE' : '#FFCDD2' }]} />
              <Text style={styles.uradText}>
                {stavUradu.jeOtvoreneTeraz
                  ? `Úrad otvorený · ${stavUradu.hodinyDnes}`
                  : 'Úrad zatvorený'}
              </Text>
            </View>
          </View>
        </View>

        {/* POČASIE ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <WeatherCard />
        </View>

        {/* NAJDÔLEŽITEJŠIE DNES ──────────────────────────────────────── */}
        {najdolezitejsie && (
          <View style={styles.section}>
            <SectionHeader title="Najdôležitejšie dnes" />
            <Card
              variant="accent"
              accentColor={najdolezitejsie.accent}
              onPress={() => router.push(najdolezitejsie.path as never)}
              padding={0}
            >
              <View style={styles.dolezitObsah}>
                <View style={[styles.dolezitIconBox, { backgroundColor: najdolezitejsie.accent + '20' }]}>
                  <Text style={styles.dolezitEmoji}>{najdolezitejsie.emoji}</Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Badge label={najdolezitejsie.label} tone={najdolezitejsie.tone} />
                  <Text style={[styles.dolezitTitle, { color: t.text }]} numberOfLines={2}>
                    {najdolezitejsie.title}
                  </Text>
                  <Text style={[styles.dolezitSub, { color: t.textMuted }]} numberOfLines={1}>
                    {najdolezitejsie.subtitle}
                  </Text>
                </View>
                <Text style={[styles.dolezitChevron, { color: t.textPlaceholder }]}>›</Text>
              </View>
            </Card>
          </View>
        )}

        {/* MARTA CTA ────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.martaCta, { backgroundColor: MARTA_FIALOVA }]}
            activeOpacity={0.9}
            onPress={() => router.push('/referentka' as never)}
            accessibilityRole="button"
            accessibilityLabel="Spýtať sa AI referentky Marty"
          >
            {/* Decoračný kruh */}
            <View style={styles.martaCircle} />

            <View style={styles.martaRow}>
              <View style={styles.martaAvatar}>
                <Text style={styles.martaEmoji}>🤖</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.martaTopRow}>
                  <Text style={styles.martaName}>Marta</Text>
                  <View style={styles.martaOnlineDot} />
                  <Text style={styles.martaOnline}>Online 24/7</Text>
                </View>
                <Text style={styles.martaPitch}>
                  AI referentka. Spýtajte sa hocičo o obci.
                </Text>
              </View>
            </View>

            {/* Suggestion chips */}
            <View style={styles.martaChips}>
              <View style={styles.martaChip}>
                <Text style={styles.martaChipText}>🗑️ Kedy je zber odpadu?</Text>
              </View>
              <View style={styles.martaChip}>
                <Text style={styles.martaChipText}>📝 Chcem podať žiadosť</Text>
              </View>
            </View>

            <View style={styles.martaCtaBtn}>
              <Text style={styles.martaCtaBtnText}>Spýtať sa Marty →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* RÝCHLE AKCIE ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader title="Rýchle akcie" />
          <View style={styles.akcieGrid}>
            {AKCIE.map(a => (
              <TouchableOpacity
                key={a.id}
                style={[styles.akciaKarta, { backgroundColor: t.surface, shadowColor: t.shadow }]}
                activeOpacity={0.85}
                onPress={() => router.push(a.path as never)}
                accessibilityRole="button"
                accessibilityLabel={a.title}
              >
                <View style={[styles.akciaIconBox, { backgroundColor: a.farba + '18' }]}>
                  <Text style={styles.akciaEmoji}>{a.emoji}</Text>
                </View>
                <Text style={[styles.akciaTitle, { color: t.text }]}>{a.title}</Text>
                <View style={[styles.akciaPas, { backgroundColor: a.farba }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* NAJBLIŽŠÍ VÝVOZ (ak nie už v "najdôležitejšie") ──────────── */}
        {najblizsiVyvoz && najdolezitejsie?.type !== 'odpad' && (
          <View style={styles.section}>
            <SectionHeader
              title="Najbližší vývoz odpadu"
              actionLabel="Kalendár"
              onAction={() => router.push('/explore' as never)}
            />
            <Card padding={0} onPress={() => router.push('/explore' as never)}>
              <View style={styles.vyvozObsah}>
                <View style={[styles.vyvozBar, { backgroundColor: najblizsiVyvoz.typ.farba }]} />
                <View style={styles.vyvozInner}>
                  <View style={{ flex: 1 }}>
                    <Badge
                      label={`♻️ ${najblizsiVyvoz.typ.nazov}`}
                      tone="neutral"
                      style={{ backgroundColor: najblizsiVyvoz.typ.farba + '22' }}
                      textStyle={{ color: najblizsiVyvoz.typ.farba }}
                    />
                    {najblizsiVyvoz.poznamka && (
                      <Text style={[styles.vyvozPoznamka, { color: t.textMuted }]}>
                        {najblizsiVyvoz.poznamka}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {(() => {
                      const { hlavny, sub, urgent } = formatVyvoz(najblizsiVyvoz.datum)
                      return (
                        <>
                          <Text style={[styles.vyvozDen, { color: urgent ? t.primary : t.text }]}>
                            {hlavny}
                          </Text>
                          <Text style={[styles.vyvozDatum, { color: t.textPlaceholder }]}>
                            {sub}
                          </Text>
                        </>
                      )
                    })()}
                  </View>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* POSLEDNÉ AKTUALITY ─────────────────────────────────────── */}
        {poslednych2.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Posledné aktuality"
              actionLabel="Zobraziť všetky"
              onAction={() => router.push('/aktuality' as never)}
            />
            {poslednych2.map(a => {
              const tone = KAT_TONE_MAP[a.kategoria] ?? 'neutral'
              const placeholder = KAT_PLACEHOLDER[a.kategoria] ?? KAT_PLACEHOLDER.ine
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.aktKarta, { backgroundColor: t.surface, shadowColor: t.shadow }]}
                  activeOpacity={0.85}
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
                      <Badge label={KAT_LABEL[a.kategoria] ?? a.kategoria} tone={tone} />
                      <Text style={[styles.aktDatum, { color: t.textPlaceholder }]}>
                        {a.published_at
                          ? new Date(a.published_at).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' })
                          : ''}
                      </Text>
                    </View>
                    <Text style={[styles.aktTitle, { color: t.text }]} numberOfLines={2}>
                      {a.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* NAJBLIŽŠIE PODUJATIE (ak nie už v najdôležitejšie) ───────── */}
        {najblizsie && najdolezitejsie?.type !== 'podujatie' && (
          <View style={styles.section}>
            <SectionHeader
              title="Najbližšie podujatie"
              actionLabel="Všetky"
              onAction={() => router.push('/podujatia' as never)}
            />
            <Card variant="accent" accentColor={'#F9A825'} onPress={() => router.push(`/podujatie/${najblizsie.id}` as never)}>
              <Text style={[styles.podTitle, { color: t.text }]}>{najblizsie.title}</Text>
              <View style={styles.podMeta}>
                <Text style={[styles.podMetaText, { color: t.textSecondary }]}>
                  📅 {new Date(najblizsie.datum_od).toLocaleDateString('sk-SK', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </Text>
                <Text style={[styles.podMetaText, { color: t.textSecondary }]}>
                  ⏰ {new Date(najblizsie.datum_od).toLocaleTimeString('sk-SK', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
                {najblizsie.miesto && (
                  <Text style={[styles.podMetaText, { color: t.textSecondary }]}>
                    📍 {najblizsie.miesto}
                  </Text>
                )}
              </View>
            </Card>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Štýly ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: spacing.lg },

  // Hero
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  heroDate: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  heroBottom: { gap: spacing.sm },
  heroGreet: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  meninyPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,232,180,0.25)',
  },
  meninyEmoji: { fontSize: 13 },
  meninyText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  uradPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  uradDot: { width: 7, height: 7, borderRadius: 3.5 },
  uradText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Sekcie
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },

  // Najdôležitejšie dnes
  dolezitObsah: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  dolezitIconBox: {
    width: 56, height: 56, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  dolezitEmoji: { fontSize: 30 },
  dolezitTitle: { ...typo.h3 },
  dolezitSub: { ...typo.caption },
  dolezitChevron: { fontSize: 28, fontWeight: '300' },

  // Marta CTA
  martaCta: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  martaCircle: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    right: -50, top: -50,
  },
  martaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  martaAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  martaEmoji: { fontSize: 28 },
  martaTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  martaName: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  martaOnlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#69F0AE' },
  martaOnline: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' },
  martaPitch: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2, fontWeight: '500' },
  martaChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: spacing.md },
  martaChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  martaChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  martaCtaBtn: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  martaCtaBtnText: { color: MARTA_FIALOVA, fontSize: 15, fontWeight: '800' },

  // Akcie 2x2
  akcieGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  akciaKarta: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 110,
    borderRadius: radius.lg,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    ...shadows.md,
    overflow: 'hidden',
  },
  akciaIconBox: {
    width: 44, height: 44, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  akciaEmoji: { fontSize: 22 },
  akciaTitle: { ...typo.h3 },
  akciaPas: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 },

  // Vývoz karta
  vyvozObsah: { flexDirection: 'row' },
  vyvozBar: { width: 6 },
  vyvozInner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  vyvozPoznamka: { ...typo.caption, marginTop: 4 },
  vyvozDen: { ...typo.h3 },
  vyvozDatum: { ...typo.micro, marginTop: 2 },

  // Aktualita karta
  aktKarta: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  aktThumb: { width: 88, height: 88 },
  aktInfo: { flex: 1, padding: spacing.md, justifyContent: 'space-between' },
  aktKartaTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  aktDatum: { ...typo.micro },
  aktTitle: { ...typo.h3 },

  // Podujatie
  podTitle: { ...typo.h3, marginBottom: 8 },
  podMeta: { gap: 4 },
  podMetaText: { ...typo.caption },
})
