import { Badge, Icon, IconName, IconTile, PressableScale } from '@/components/ui'
import { C } from '@/constants/colors'
import { supabase } from '@/src/lib/supabase'
import { ThemeColors, useThemeColors } from '@/src/theme/ThemeContext'
import { fonts, radius, spacing, typo } from '@/src/theme/tokens'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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

function formatDatumDlhy(iso: string) {
  const d = new Date(iso)
  const den = d.toLocaleDateString('sk-SK', { weekday: 'long' })
  const datum = d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })
  const cas = d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })
  return { den: den.charAt(0).toUpperCase() + den.slice(1), datum, cas }
}
const jeMinule = (iso: string) => new Date(iso).getTime() < Date.now()

export default function PodujatieDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])
  const [podujatie, setPodujatie] = useState<Podujatie | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOne() {
      const { data } = await supabase.from('podujatia').select('*').eq('id', id).single()
      setPodujatie(data as Podujatie)
      setLoading(false)
    }
    fetchOne()
  }, [id])

  const kat = podujatie ? katCfg(podujatie.kategoria) : katCfg('ine')

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navBar}>
        <PressableScale style={styles.backBtn} scaleTo={0.94} onPress={() => router.back()} accessibilityLabel="Späť">
          <Icon name="chevronBack" size={22} color={t.primary} />
          <Text style={styles.backText}>Späť</Text>
        </PressableScale>
      </View>

      {loading && <View style={styles.center}><ActivityIndicator size="large" color={t.primary} /></View>}

      {!loading && podujatie && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { backgroundColor: kat.gradient[kat.gradient.length - 1] + '12' }]}>
            <IconTile name={kat.icon} gradient={kat.gradient} size={60} iconSize={30} glow />
            <Badge label={kat.label} tone="neutral" style={{ backgroundColor: kat.gradient[kat.gradient.length - 1] + '1A' }} textStyle={{ color: kat.gradient[kat.gradient.length - 1] }} />
            {jeMinule(podujatie.datum_od) && (
              <View style={styles.minuleTag}><Text style={styles.minuleText}>Už prebehlo</Text></View>
            )}
          </View>

          <Text style={styles.title}>{podujatie.title}</Text>

          <View style={styles.infoBlok}>
            <DatumRiadok datum_od={podujatie.datum_od} datum_do={podujatie.datum_do} styles={styles} tint={t.primary} />
            {podujatie.miesto && (
              <View style={styles.infoRow}>
                <Icon name="location" size={18} color={t.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Miesto</Text>
                  <PressableScale scaleTo={0.97} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(podujatie.miesto!)}`)}>
                    <Text style={[styles.infoText, styles.infoLink]}>{podujatie.miesto}</Text>
                  </PressableScale>
                </View>
              </View>
            )}
          </View>

          <View style={styles.divider} />
          {podujatie.popis && <Text style={styles.body}>{podujatie.popis}</Text>}
          <Text style={styles.disclaimer}>Pre viac informácií kontaktujte obecný úrad.</Text>
        </ScrollView>
      )}

      {!loading && !podujatie && (
        <View style={styles.center}>
          <Icon name="search" size={44} color={t.textMuted} />
          <Text style={styles.errorText}>Podujatie sa nenašlo</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

function DatumRiadok({ datum_od, datum_do, styles, tint }: { datum_od: string; datum_do: string | null; styles: any; tint: string }) {
  const od = formatDatumDlhy(datum_od)
  const do_ = datum_do ? formatDatumDlhy(datum_do) : null
  const rovnakyDen = do_ && new Date(datum_od).toDateString() === new Date(datum_do!).toDateString()
  return (
    <View style={styles.infoRow}>
      <Icon name="podujatia" size={18} color={tint} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{do_ && !rovnakyDen ? 'Termín' : 'Kedy'}</Text>
        <Text style={styles.infoText}>{od.den}, {od.datum}</Text>
        <Text style={styles.infoSubText}>
          {rovnakyDen ? `${od.cas} – ${do_!.cas}` : do_ ? `${od.cas} – ${do_.datum}, ${do_.cas}` : od.cas}
        </Text>
      </View>
    </View>
  )
}

const makeStyles = (t: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.surface },
  navBar: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: t.borderLight },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', paddingVertical: 4, paddingRight: spacing.sm },
  backText: { ...typo.bodyB, color: t.primary },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  errorText: { ...typo.body, color: t.textMuted },

  content: { padding: spacing.xl, paddingBottom: 40 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  minuleTag: { marginLeft: 'auto', backgroundColor: t.surfaceAlt, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 5, borderWidth: 1, borderColor: t.border },
  minuleText: { ...typo.micro, color: t.textMuted },

  title: { fontFamily: fonts.display, fontSize: 28, color: t.text, lineHeight: 36, marginBottom: spacing.lg, letterSpacing: -0.5 },

  infoBlok: { backgroundColor: t.background, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  infoLabel: { ...typo.label, color: t.textMuted, marginBottom: 2 },
  infoText: { ...typo.bodyB, color: t.text },
  infoSubText: { ...typo.caption, color: t.textSecondary, marginTop: 2 },
  infoLink: { color: t.primary, textDecorationLine: 'underline' },

  divider: { height: 1, backgroundColor: t.divider, marginVertical: spacing.lg },
  body: { fontSize: 16, color: t.text, lineHeight: 26, fontFamily: fonts.regular },
  disclaimer: { ...typo.caption, color: t.textMuted, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
})
