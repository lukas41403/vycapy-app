/**
 * Hlavná obrazovka — Dashboard / Domov.
 *
 * Hierarchia (priorita zhora dole):
 *   1. Hero header — pozdrav, dátum, status úradu (bleeduje pod status bar)
 *   2. Počasie
 *   3. **Najdôležitejšie dnes** — prominentná karta s urgentnou vecou
 *   4. **Marta CTA** — veľký dôrazný blok pre AI referentku
 *   5. Rýchle akcie (2x2 grid)
 *   6. Najbližší vývoz / aktuality / podujatie
 *
 * Ikony: jednotný <Icon> systém (Ionicons), žiadne emoji.
 * Interakcie: PressableScale (scale + haptika).
 */

import { ErbBadge } from '@/components/AppHeader'
import { AnimatedEntrance, AtmosphereBackground, Badge, Card, FlagBanner, GradientIcon, Icon, IconName, IconTile, PressableScale, ScrollToTop, SectionHeader } from '@/components/ui'
import { WeatherCard } from '@/components/WeatherCard'
import { C } from '@/constants/colors'
import { useTenant, uradStatusDnes } from '@/src/config/tenant'
import { katLabel, katTone, katVisual } from '@/src/config/kategorie'
import { useAktuality } from '@/src/hooks/useAktuality'
import { useOdpady } from '@/src/hooks/useOdpady'
import { usePodujatia } from '@/src/hooks/usePodujatia'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { fonts, radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { StatusBar, StyleSheet, Text, View } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

// ─── Pomocné ──────────────────────────────────────────────────────────────
function pozdravPodlaCasu(): { text: string; icon: IconName } {
  const h = new Date().getHours()
  if (h >= 6 && h < 11) return { text: 'Dobré ráno', icon: 'sun' }
  if (h >= 11 && h < 18) return { text: 'Dobrý deň', icon: 'pocasie' }
  if (h >= 18 && h < 22) return { text: 'Dobrý večer', icon: 'moon' }
  return { text: 'Dobrú noc', icon: 'moon' }
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

// ─── Rýchle akcie 2x2 ───────────────────────────────────────────────────────
type Akcia = { id: string; icon: IconName; title: string; path: string; gradient: readonly [string, string, ...string[]] }
const AKCIE: Akcia[] = [
  { id: 'hlasenie',  icon: 'hlasenie',  title: 'Nahlásiť podnet', path: '/hlasenie',  gradient: C.gradients.red },
  { id: 'podujatia', icon: 'podujatia', title: 'Podujatia',        path: '/podujatia', gradient: C.gradients.green },
  { id: 'prenajom',  icon: 'prenajom',  title: 'Prenájom haly',    path: '/prenajom',  gradient: C.gradients.gold },
  { id: 'kontakty',  icon: 'kontakty',  title: 'Kontakty',         path: '/kontakty',  gradient: C.gradients.slate },
]

// ─── Komponent ────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter()
  const t = useThemeColors()
  const insets = useSafeAreaInsets()
  const tenant = useTenant()
  const { aktuality } = useAktuality()
  const { odpady } = useOdpady()
  const { podujatia } = usePodujatia()

  const pozdrav = useMemo(() => pozdravPodlaCasu(), [])
  const dnes = useMemo(() => formatDnes(), [])
  const stavUradu = useMemo(() => uradStatusDnes(tenant), [tenant])

  const najblizsiVyvoz = odpady[0]
  const poslednych2 = aktuality.slice(0, 2)
  const najblizsie = podujatia[0]

  const najdolezitejsie = useMemo(() => {
    const urgentAkt = aktuality.find(a => a.kategoria === 'uzavierka' || a.kategoria === 'vypadok')
    if (urgentAkt) {
      const vis = katVisual(urgentAkt.kategoria)
      return {
        type: 'urgent' as const,
        title: urgentAkt.title,
        subtitle: urgentAkt.perex ?? katLabel(urgentAkt.kategoria),
        path: `/aktualita/${urgentAkt.id}`,
        accent: vis.color,
        gradient: vis.gradient,
        icon: vis.icon,
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
          path: '/explore',
          accent: najblizsiVyvoz.typ.farba,
          gradient: C.gradients.green,
          icon: 'odpady' as IconName,
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
        path: `/podujatie/${najblizsie.id}`,
        accent: C.brand.gold,
        gradient: C.gradients.gold,
        icon: 'podujatia' as IconName,
        label: 'NAJBLIŽŠIE PODUJATIE',
        tone: 'accent' as const,
      }
    }
    return null
  }, [aktuality, najblizsiVyvoz, najblizsie])

  // Parallax / stretch hero pri scrollovaní
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollY = useScrollViewOffset(scrollRef)
  const heroAnim = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(scrollY.value, [-220, 0], [1.18, 1], Extrapolation.CLAMP) },
    ],
  }))

  const [showTop, setShowTop] = useState(false)
  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true })

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <StatusBar barStyle="light-content" />
      <AtmosphereBackground />
      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xl }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => setShowTop(e.nativeEvent.contentOffset.y > 420)}
      >

        {/* HERO ─────────────────────────────────────────────────────── */}
        <AnimatedLinearGradient
          colors={[t.primary, C.brand.redDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing.md }, heroAnim]}
        >
          <View style={styles.heroRow}>
            <ErbBadge variant="brand" />
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle} numberOfLines={1}>{tenant.nazov}</Text>
              <FlagBanner width={58} height={4} style={{ marginTop: 6, marginBottom: 2 }} />
              <Text style={styles.heroDate}>{dnes}</Text>
            </View>
          </View>
          <View style={styles.heroBottom}>
            <View style={styles.greetRow}>
              <Icon name={pozdrav.icon} size={18} color="rgba(255,255,255,0.95)" />
              <Text style={styles.heroGreet}>{pozdrav.text}</Text>
            </View>
            <View style={[styles.uradPill, { backgroundColor: stavUradu.jeOtvoreneTeraz ? 'rgba(105,240,174,0.18)' : 'rgba(255,255,255,0.16)' }]}>
              <View style={[styles.uradDot, { backgroundColor: stavUradu.jeOtvoreneTeraz ? '#69F0AE' : '#FFCDD2' }]} />
              <Text style={styles.uradText}>
                {stavUradu.jeOtvoreneTeraz
                  ? `Úrad otvorený · ${stavUradu.hodinyDnes}`
                  : 'Úrad zatvorený'}
              </Text>
            </View>
          </View>
        </AnimatedLinearGradient>

        {/* POČASIE ──────────────────────────────────────────────────── */}
        <AnimatedEntrance style={styles.section} delay={0}>
          <WeatherCard />
        </AnimatedEntrance>

        {/* NAJDÔLEŽITEJŠIE DNES ──────────────────────────────────────── */}
        {najdolezitejsie && (
          <AnimatedEntrance style={styles.section} delay={70}>
            <SectionHeader title="Najdôležitejšie dnes" />
            <Card
              variant="accent"
              accentColor={najdolezitejsie.accent}
              onPress={() => router.push(najdolezitejsie.path as never)}
              padding={0}
            >
              <View style={styles.dolezitObsah}>
                <IconTile name={najdolezitejsie.icon} gradient={najdolezitejsie.gradient} size={56} iconSize={28} glow />
                <View style={{ flex: 1, gap: 4 }}>
                  <Badge label={najdolezitejsie.label} tone={najdolezitejsie.tone} />
                  <Text style={[styles.dolezitTitle, { color: t.text }]} numberOfLines={2}>
                    {najdolezitejsie.title}
                  </Text>
                  <Text style={[styles.dolezitSub, { color: t.textMuted }]} numberOfLines={1}>
                    {najdolezitejsie.subtitle}
                  </Text>
                </View>
                <Icon name="chevron" size={22} color={t.textPlaceholder} />
              </View>
            </Card>
          </AnimatedEntrance>
        )}

        {/* MARTA CTA ────────────────────────────────────────────────── */}
        <AnimatedEntrance style={styles.section} delay={140}>
          <PressableScale
            style={styles.martaWrap}
            onPress={() => router.push('/referentka' as never)}
            accessibilityLabel="Spýtať sa AI referentky Marty"
          >
           <LinearGradient
             colors={[C.feature.purple, '#4A148C']}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 1 }}
             style={styles.martaCta}
           >
            {/* Decoračný kruh */}
            <View style={styles.martaCircle} />

            <View style={styles.martaRow}>
              <View style={styles.martaAvatar}>
                <Icon name="marta" size={26} color="#FFFFFF" />
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
                <Icon name="odpady" size={13} color="#FFFFFF" />
                <Text style={styles.martaChipText}>Kedy je zber odpadu?</Text>
              </View>
              <View style={styles.martaChip}>
                <Icon name="aktuality" size={13} color="#FFFFFF" />
                <Text style={styles.martaChipText}>Chcem podať žiadosť</Text>
              </View>
            </View>

            <View style={styles.martaCtaBtn}>
              <Text style={styles.martaCtaBtnText}>Spýtať sa Marty</Text>
              <Icon name="arrowRight" size={16} color={C.feature.purple} />
            </View>
           </LinearGradient>
          </PressableScale>
        </AnimatedEntrance>

        {/* RÝCHLE AKCIE ─────────────────────────────────────────────── */}
        <AnimatedEntrance style={styles.section} delay={210}>
          <SectionHeader title="Rýchle akcie" />
          <View style={styles.akcieGrid}>
            {AKCIE.map(a => (
              <PressableScale
                key={a.id}
                style={[styles.akciaKarta, { backgroundColor: t.surface, shadowColor: t.shadow }]}
                onPress={() => router.push(a.path as never)}
                accessibilityLabel={a.title}
              >
                <IconTile name={a.icon} gradient={a.gradient} size={46} iconSize={24} glow style={{ marginBottom: spacing.sm }} />
                <Text style={[styles.akciaTitle, { color: t.text }]}>{a.title}</Text>
                <View style={[styles.akciaPas, { backgroundColor: a.gradient[a.gradient.length - 1] }]} />
              </PressableScale>
            ))}
          </View>
        </AnimatedEntrance>

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
                    <View style={[styles.vyvozChip, { backgroundColor: najblizsiVyvoz.typ.farba + '1A' }]}>
                      <Icon name="odpady" size={14} color={najblizsiVyvoz.typ.farba} />
                      <Text style={[styles.vyvozChipText, { color: najblizsiVyvoz.typ.farba }]}>
                        {najblizsiVyvoz.typ.nazov}
                      </Text>
                    </View>
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
                          <Text style={[styles.vyvozDen, { color: urgent ? t.primary : t.text }]}>{hlavny}</Text>
                          <Text style={[styles.vyvozDatum, { color: t.textPlaceholder }]}>{sub}</Text>
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
              const tone = katTone(a.kategoria)
              const vis = katVisual(a.kategoria)
              return (
                <PressableScale
                  key={a.id}
                  style={[styles.aktKarta, { backgroundColor: t.surface, shadowColor: t.shadow }]}
                  onPress={() => router.push(`/aktualita/${a.id}` as never)}
                  accessibilityLabel={a.title}
                >
                  {a.cover_url ? (
                    <Image source={{ uri: a.cover_url }} style={styles.aktThumb} contentFit="cover" transition={200} />
                  ) : (
                    <IconTile name={vis.icon} gradient={vis.gradient} size={92} iconSize={32} cornerRadius={0} />
                  )}
                  <View style={styles.aktInfo}>
                    <View style={styles.aktKartaTop}>
                      <Badge label={katLabel(a.kategoria)} tone={tone} />
                      <Text style={[styles.aktDatum, { color: t.textPlaceholder }]}>
                        {a.published_at
                          ? new Date(a.published_at).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' })
                          : ''}
                      </Text>
                    </View>
                    <Text style={[styles.aktTitle, { color: t.text }]} numberOfLines={2}>{a.title}</Text>
                  </View>
                </PressableScale>
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
            <Card variant="accent" accentColor={C.brand.gold} onPress={() => router.push(`/podujatie/${najblizsie.id}` as never)}>
              <Text style={[styles.podTitle, { color: t.text }]}>{najblizsie.title}</Text>
              <View style={styles.podMeta}>
                <View style={styles.podMetaRow}>
                  <GradientIcon name="podujatia" gradient={C.gradients.gold} size={16} />
                  <Text style={[styles.podMetaText, { color: t.textSecondary }]}>
                    {new Date(najblizsie.datum_od).toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Text>
                </View>
                <View style={styles.podMetaRow}>
                  <GradientIcon name="time" gradient={C.gradients.gold} size={16} />
                  <Text style={[styles.podMetaText, { color: t.textSecondary }]}>
                    {new Date(najblizsie.datum_od).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {najblizsie.miesto && (
                  <View style={styles.podMetaRow}>
                    <GradientIcon name="location" gradient={C.gradients.gold} size={16} />
                    <Text style={[styles.podMetaText, { color: t.textSecondary }]}>{najblizsie.miesto}</Text>
                  </View>
                )}
              </View>
            </Card>
          </View>
        )}

      </Animated.ScrollView>
      <ScrollToTop visible={showTop} onPress={scrollToTop} />
    </View>
  )
}

// ─── Štýly ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {},

  // Hero
  hero: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  heroTitle: { color: '#FFFFFF', fontSize: 23, fontFamily: fonts.display, letterSpacing: -0.3 },
  heroDate: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 3, fontFamily: fonts.medium },
  heroBottom: { gap: spacing.sm },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroGreet: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
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
  dolezitObsah: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  dolezitIconBox: { width: 56, height: 56, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  dolezitTitle: { ...typo.h3 },
  dolezitSub: { ...typo.caption },

  // Marta CTA
  martaWrap: { borderRadius: radius.lg, ...shadows.md },
  martaCta: { borderRadius: radius.lg, padding: spacing.lg, overflow: 'hidden' },
  martaCircle: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)', right: -50, top: -50,
  },
  martaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  martaAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  martaTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  martaName: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  martaOnlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#69F0AE' },
  martaOnline: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' },
  martaPitch: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2, fontWeight: '500' },
  martaChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: spacing.md },
  martaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.pill,
  },
  martaChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  martaCtaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)', paddingVertical: 11, borderRadius: radius.md,
  },
  martaCtaBtnText: { color: C.feature.purple, fontSize: 15, fontWeight: '800' },

  // Akcie 2x2
  akcieGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  akciaKarta: {
    flexBasis: '47%', flexGrow: 1, minHeight: 112,
    borderRadius: radius.lg, padding: spacing.md, paddingBottom: spacing.lg,
    ...shadows.sm, overflow: 'hidden',
  },
  akciaIconBox: {
    width: 44, height: 44, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
  },
  akciaTitle: { ...typo.h3 },
  akciaPas: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 },

  // Vývoz karta
  vyvozObsah: { flexDirection: 'row' },
  vyvozBar: { width: 6 },
  vyvozInner: {
    flex: 1, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: spacing.lg, gap: spacing.md,
  },
  vyvozChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.sm,
  },
  vyvozChipText: { fontSize: 12, fontWeight: '800' },
  vyvozPoznamka: { ...typo.caption, marginTop: 6 },
  vyvozDen: { ...typo.h3 },
  vyvozDatum: { ...typo.micro, marginTop: 2 },

  // Aktualita karta
  aktKarta: {
    flexDirection: 'row', borderRadius: radius.lg, marginBottom: spacing.md,
    overflow: 'hidden', ...shadows.sm,
  },
  aktThumb: { width: 92, height: 92 },
  aktInfo: { flex: 1, padding: spacing.md, justifyContent: 'space-between' },
  aktKartaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  aktDatum: { ...typo.micro },
  aktTitle: { ...typo.h3 },

  // Podujatie
  podTitle: { ...typo.h3, marginBottom: spacing.sm },
  podMeta: { gap: 6 },
  podMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  podMetaText: { ...typo.caption },
})
