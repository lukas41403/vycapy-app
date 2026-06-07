import { AppHeader } from '@/components/AppHeader'
import { AnimatedEntrance, AtmosphereBackground, EmptyState, Icon, IconName, IconTile, PressableScale } from '@/components/ui'
import { C } from '@/constants/colors'
import { usePodujatia } from '@/src/hooks/usePodujatia'
import { ThemeColors, useThemeColors } from '@/src/theme/ThemeContext'
import { radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type KatCfg = { icon: IconName; gradient: readonly [string, string, ...string[]]; label: string }
const KATEGORIA_CONFIG: Record<string, KatCfg> = {
  kultura:  { icon: 'music',     gradient: C.gradients.purple, label: 'Kultúra' },
  sport:    { icon: 'fc',        gradient: C.gradients.blue,   label: 'Šport' },
  slavnost: { icon: 'sparkles',  gradient: C.gradients.gold,   label: 'Slávnosť' },
  kino:     { icon: 'film',      gradient: C.gradients.indigo, label: 'Kino' },
  divadlo:  { icon: 'theater',   gradient: C.gradients.pink,   label: 'Divadlo' },
  deti:     { icon: 'happy',     gradient: C.gradients.orange, label: 'Pre deti' },
  ine:      { icon: 'podujatia', gradient: C.gradients.slate,  label: 'Iné' },
}
const katCfg = (k: string): KatCfg => KATEGORIA_CONFIG[k] ?? KATEGORIA_CONFIG.ine

function formatDatum(datum_od: string) {
  const od = new Date(datum_od)
  const den = od.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' })
  const cas = od.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })
  return { den: den.charAt(0).toUpperCase() + den.slice(1), cas }
}
function jeBlizko(datum: string) {
  const diff = (new Date(datum).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return diff <= 7
}

export default function PodujatiaScreen() {
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])
  const { podujatia, loading, error, refresh } = usePodujatia()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AtmosphereBackground />
      <AppHeader title="Podujatia" subtitle="Kalendár obecných akcií" />

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.primary} />
          <Text style={styles.loadingText}>Načítavam…</Text>
        </View>
      )}

      {error && (
        <View style={styles.centerPad}>
          <EmptyState icon="info" title="Chyba pri načítaní" description="Skontrolujte pripojenie a skúste znova." actionLabel="Skúsiť znova" onAction={handleRefresh} />
        </View>
      )}

      {!loading && !error && podujatia.length === 0 && (
        <View style={styles.centerPad}>
          <EmptyState icon="podujatia" title="Žiadne nadchádzajúce podujatia" description="Aktuálne nie sú v kalendári žiadne podujatia. Skontrolujte neskôr." />
        </View>
      )}

      {!loading && !error && podujatia.length > 0 && (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.primary} />}
        >
          {podujatia.map(p => {
            const kat = katCfg(p.kategoria)
            const { den, cas } = formatDatum(p.datum_od)
            const blizko = jeBlizko(p.datum_od)
            return (
              <AnimatedEntrance key={p.id}>
                <PressableScale style={styles.karta} onPress={() => router.push(`/podujatie/${p.id}` as never)} accessibilityLabel={p.title}>
                  {blizko && (
                    <View style={styles.blizkoTag}>
                      <Text style={styles.blizkoText}>Tento týždeň</Text>
                    </View>
                  )}
                  <View style={styles.kartaTop}>
                    <IconTile name={kat.icon} gradient={kat.gradient} size={52} iconSize={26} glow />
                    <View style={styles.kartaInfo}>
                      <View style={[styles.katBadge, { backgroundColor: kat.gradient[kat.gradient.length - 1] + '1A' }]}>
                        <Text style={[styles.katLabel, { color: kat.gradient[kat.gradient.length - 1] }]}>{kat.label}</Text>
                      </View>
                      <Text style={styles.kartaTitle}>{p.title}</Text>
                    </View>
                  </View>

                  <View style={styles.detaily}>
                    <View style={styles.detail}><Icon name="podujatia" size={14} color={t.textMuted} /><Text style={styles.detailText}>{den}</Text></View>
                    <View style={styles.detail}><Icon name="time" size={14} color={t.textMuted} /><Text style={styles.detailText}>{cas}</Text></View>
                    {p.miesto && <View style={styles.detail}><Icon name="location" size={14} color={t.textMuted} /><Text style={styles.detailText}>{p.miesto}</Text></View>}
                  </View>

                  {p.popis && <Text style={styles.popis} numberOfLines={2}>{p.popis}</Text>}
                  <View style={styles.cardFooter}>
                    <Text style={[styles.readMore, { color: kat.gradient[kat.gradient.length - 1] }]}>Detail podujatia</Text>
                    <Icon name="arrowRight" size={14} color={kat.gradient[kat.gradient.length - 1]} />
                  </View>
                </PressableScale>
              </AnimatedEntrance>
            )
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const makeStyles = (t: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  centerPad: { flex: 1, justifyContent: 'center' },
  loadingText: { ...typo.caption, color: t.textMuted, marginTop: spacing.sm },

  list: { padding: spacing.lg, gap: spacing.md },
  karta: { backgroundColor: t.surface, borderRadius: radius.lg, padding: spacing.lg, overflow: 'hidden', ...shadows.md, shadowColor: t.shadow },
  blizkoTag: { position: 'absolute', top: 0, right: 0, backgroundColor: t.accent, borderBottomLeftRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 4 },
  blizkoText: { color: C.brand.redDark, fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.3 },
  kartaTop: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md, alignItems: 'flex-start' },
  kartaInfo: { flex: 1, gap: 6 },
  katBadge: { alignSelf: 'flex-start', borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  katLabel: { ...typo.micro, fontFamily: 'Inter_800ExtraBold' },
  kartaTitle: { ...typo.h3, color: t.text },
  detaily: { gap: 5, marginBottom: spacing.sm },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { ...typo.caption, color: t.textSecondary },
  popis: { ...typo.caption, color: t.textMuted, lineHeight: 19, marginTop: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: t.divider, paddingTop: spacing.md, marginTop: spacing.md },
  readMore: { ...typo.captionB },
})
