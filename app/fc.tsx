/**
 * FC Výčapy-Opatovce — sekcia futbalového klubu (Program / Výsledky / Hráči / Futbalnet).
 * Editorial + theme-aware (useStyles hook), Icon systém. Klubová zelená je konštantná.
 */

import { Button, Icon, IconName, PressableScale } from '@/components/ui'
import { C } from '@/constants/colors'
import { Hrac, useFcHraci, useFcZapasy, Zapas } from '@/src/hooks/useFc'
import { ThemeColors, useThemeColors } from '@/src/theme/ThemeContext'
import { fonts, radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const FC_GREEN = '#1B5E20'
const FC_GREEN_LIGHT = '#E8F5E9'
const FUTBALNET_URL = 'https://sportnet.sme.sk/futbalnet/k/zdruzenie-fc-vycapy-opatovce/tim/dospeli-m-a/program/'

const useStyles = () => { const t = useThemeColors(); return useMemo(() => makeStyles(t), [t]) }

type TabKey = 'program' | 'vysledky' | 'hraci' | 'futbalnet'
const TABS: { id: TabKey; icon: IconName; label: string }[] = [
  { id: 'program',   icon: 'podujatia', label: 'Program' },
  { id: 'vysledky',  icon: 'trophy',    label: 'Výsledky' },
  { id: 'hraci',     icon: 'people',    label: 'Hráči' },
  { id: 'futbalnet', icon: 'globe',     label: 'Futbalnet' },
]

export default function FcScreen() {
  const t = useThemeColors()
  const styles = useStyles()
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('program')

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back} scaleTo={0.94} accessibilityLabel="Späť">
          <Icon name="chevronBack" size={20} color="#FFFFFF" />
          <Text style={styles.backText}>Späť</Text>
        </PressableScale>
        <View style={styles.headerRow}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>FC</Text>
            <Text style={styles.logoVO}>V-O</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>FC Výčapy-Opatovce</Text>
            <Text style={styles.headerSub}>Oblastná liga Nitra · Sezóna 2025/26</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tb => {
          const active = tab === tb.id
          return (
            <PressableScale key={tb.id} style={[styles.tab, active && styles.tabActive]} scaleTo={0.95} onPress={() => setTab(tb.id)} accessibilityLabel={tb.label}>
              <Icon name={tb.icon} size={18} color={active ? FC_GREEN : t.textMuted} variant={active ? 'filled' : 'outline'} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>{tb.label}</Text>
            </PressableScale>
          )
        })}
      </View>

      {tab === 'program'   && <ProgramTab />}
      {tab === 'vysledky'  && <VysledkyTab />}
      {tab === 'hraci'     && <HraciTab />}
      {tab === 'futbalnet' && <FutbalnetTab />}
    </SafeAreaView>
  )
}

function ProgramTab() {
  const styles = useStyles()
  const t = useThemeColors()
  const { zapasy, loading, error } = useFcZapasy()
  const [view, setView] = useState<'list' | 'month'>('list')
  const nadchadzajuce = zapasy.filter(z => z.goly_my == null).sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())

  if (loading) return <Loading />
  if (error) return <ErrorBox msg={error} hint="Skontroluj že tabuľka fc_zapasy existuje v Supabase." />
  if (nadchadzajuce.length === 0) return <Empty icon="podujatia" title="Žiadne nadchádzajúce zápasy" />

  const podlaMesiaca = nadchadzajuce.reduce((acc, z) => {
    const m = new Date(z.datum).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' })
    const key = m.charAt(0).toUpperCase() + m.slice(1)
    if (!acc[key]) acc[key] = []
    acc[key].push(z)
    return acc
  }, {} as Record<string, typeof nadchadzajuce>)

  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      <View style={styles.fcModeBar}>
        {(['list', 'month'] as const).map(v => (
          <PressableScale key={v} style={[styles.fcModeBtn, view === v && styles.fcModeBtnActive]} scaleTo={0.96} onPress={() => setView(v)} accessibilityLabel={v === 'list' ? 'Zoznam' : 'Mesiac'}>
            <Icon name={v === 'list' ? 'list' : 'podujatia'} size={14} color={view === v ? FC_GREEN : t.textMuted} />
            <Text style={[styles.fcModeBtnText, view === v && styles.fcModeBtnTextActive]}>{v === 'list' ? 'Zoznam' : 'Mesiac'}</Text>
          </PressableScale>
        ))}
      </View>
      {view === 'list'
        ? nadchadzajuce.map(z => <ZapasKarta key={z.id} zapas={z} typ="program" />)
        : Object.entries(podlaMesiaca).map(([m, zList]) => (
          <View key={m} style={{ gap: spacing.md, marginBottom: spacing.sm }}>
            <View style={styles.fcMonthHeader}><View style={styles.fcMonthLine} /><Text style={styles.fcMonthLabel}>{m}</Text><View style={styles.fcMonthLine} /></View>
            {zList.map(z => <ZapasKarta key={z.id} zapas={z} typ="program" />)}
          </View>
        ))}
    </ScrollView>
  )
}

function VysledkyTab() {
  const styles = useStyles()
  const { zapasy, loading, error } = useFcZapasy()
  const odohrate = zapasy.filter(z => z.goly_my != null && z.goly_supar != null).sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
  if (loading) return <Loading />
  if (error) return <ErrorBox msg={error} hint="Skontroluj že tabuľka fc_zapasy existuje v Supabase." />
  if (odohrate.length === 0) return <Empty icon="trophy" title="Žiadne odohraté zápasy" />
  return <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>{odohrate.map(z => <ZapasKarta key={z.id} zapas={z} typ="vysledok" />)}</ScrollView>
}

function ZapasKarta({ zapas, typ }: { zapas: Zapas; typ: 'program' | 'vysledok' }) {
  const styles = useStyles()
  const t = useThemeColors()
  const datum = new Date(zapas.datum)
  const denStr = datum.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const cas = datum.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })
  const open = () => { if (zapas.futbalnet_url) Linking.openURL(zapas.futbalnet_url) }

  let vysledokTyp: 'vyhra' | 'prehra' | 'remiza' | null = null
  if (typ === 'vysledok' && zapas.goly_my != null && zapas.goly_supar != null) {
    if (zapas.goly_my > zapas.goly_supar) vysledokTyp = 'vyhra'
    else if (zapas.goly_my < zapas.goly_supar) vysledokTyp = 'prehra'
    else vysledokTyp = 'remiza'
  }
  const vysledokConfig = {
    vyhra:  { label: 'Výhra',  color: FC_GREEN, bg: FC_GREEN_LIGHT },
    prehra: { label: 'Prehra', color: C.brand.red, bg: t.primaryLight },
    remiza: { label: 'Remíza', color: t.textSecondary, bg: t.surfaceAlt },
  }

  return (
    <PressableScale style={styles.zapasKarta} scaleTo={zapas.futbalnet_url ? 0.98 : 1} onPress={open} accessibilityLabel={`Zápas vs ${zapas.supar}`}>
      <View style={styles.zapasTop}>
        <View style={[styles.domaBadge, { backgroundColor: zapas.je_doma ? FC_GREEN_LIGHT : t.surfaceAlt }]}>
          <Icon name={zapas.je_doma ? 'domov' : 'navigate'} size={12} color={zapas.je_doma ? FC_GREEN : t.textSecondary} />
          <Text style={[styles.domaText, { color: zapas.je_doma ? FC_GREEN : t.textSecondary }]}>{zapas.je_doma ? 'DOMA' : 'VONKU'}</Text>
        </View>
        {typ === 'vysledok' && vysledokTyp && (
          <View style={[styles.vysledokBadge, { backgroundColor: vysledokConfig[vysledokTyp].bg }]}>
            <Text style={[styles.vysledokBadgeText, { color: vysledokConfig[vysledokTyp].color }]}>{vysledokConfig[vysledokTyp].label}</Text>
          </View>
        )}
      </View>

      {typ === 'program' ? (
        <Text style={styles.zapasTitle}>vs {zapas.supar}</Text>
      ) : (
        <View style={styles.skoreRow}>
          <Text style={styles.skoreTeam}>FC V-O</Text>
          <View style={styles.skoreBox}>
            <Text style={[styles.skoreText, vysledokTyp === 'vyhra' && { color: FC_GREEN }, vysledokTyp === 'prehra' && { color: C.brand.red }]}>{zapas.goly_my} : {zapas.goly_supar}</Text>
          </View>
          <Text style={[styles.skoreTeam, { textAlign: 'right' }]} numberOfLines={1}>{zapas.supar}</Text>
        </View>
      )}

      <View style={styles.zapasMeta}>
        <MetaRow icon="podujatia" text={denStr.charAt(0).toUpperCase() + denStr.slice(1)} />
        {typ === 'program' && <MetaRow icon="time" text={cas} />}
        {zapas.miesto && <MetaRow icon="location" text={zapas.miesto} />}
        <MetaRow icon="trophy" text={zapas.sutaz} />
      </View>

      {typ === 'program' && zapas.futbalnet_url && (
        <View style={styles.zapasFooter}><Text style={styles.zapasLink}>Detail na Futbalnet →</Text></View>
      )}
    </PressableScale>
  )
}

function MetaRow({ icon, text }: { icon: IconName; text: string }) {
  const styles = useStyles()
  const t = useThemeColors()
  return <View style={styles.metaRow}><Icon name={icon} size={13} color={t.textMuted} /><Text style={styles.zapasMetaText}>{text}</Text></View>
}

function HraciTab() {
  const styles = useStyles()
  const { hraci, loading, error } = useFcHraci()
  if (loading) return <Loading />
  if (error) return <ErrorBox msg={error} hint="Skontroluj že tabuľka fc_hraci existuje v Supabase." />
  if (hraci.length === 0) return <Empty icon="people" title="Káder zatiaľ neuvedený" />

  const sekcie: { titul: string; data: Hrac[]; jeTrener?: boolean }[] = [
    { titul: 'Tréneri', data: hraci.filter(h => h.je_trener), jeTrener: true },
    { titul: 'Brankári', data: hraci.filter(h => !h.je_trener && h.pozicia === 'brankár') },
    { titul: 'Obrancovia', data: hraci.filter(h => !h.je_trener && h.pozicia === 'obranca') },
    { titul: 'Záložníci', data: hraci.filter(h => !h.je_trener && h.pozicia === 'záložník') },
    { titul: 'Útočníci', data: hraci.filter(h => !h.je_trener && h.pozicia === 'útočník') },
  ]

  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {sekcie.filter(s => s.data.length > 0).map(s => (
        <View key={s.titul} style={{ marginBottom: spacing.lg }}>
          <Text style={styles.hraciSekciaTitul}>{s.titul}</Text>
          <View style={styles.hraciGrid}>
            {s.data.map(h => (
              <View key={h.id} style={styles.hracKarta}>
                <View style={[styles.hracCislo, s.jeTrener && styles.hracCisloTrener]}>
                  <Text style={[styles.hracCisloText, s.jeTrener && styles.hracCisloTrenerText]}>{s.jeTrener ? 'T' : (h.cislo_dresu ?? '–')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hracMeno} numberOfLines={1}>{h.meno}</Text>
                  <Text style={styles.hracPriezvisko} numberOfLines={1}>{h.priezvisko}</Text>
                  {!s.jeTrener && <Text style={styles.hracPozicia}>{h.pozicia}</Text>}
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

function FutbalnetTab() {
  const styles = useStyles()
  return (
    <ScrollView contentContainerStyle={styles.futbalnetWrap} showsVerticalScrollIndicator={false}>
      <View style={styles.futbalnetCard}>
        <View style={styles.futbalnetLogo}><Icon name="globe" size={32} color="#FFFFFF" /></View>
        <Text style={styles.futbalnetTitle}>Futbalnet.sk</Text>
        <Text style={styles.futbalnetSub}>Oficiálne výsledky, tabuľka a program pre FC Výčapy-Opatovce v Oblastnej lige Nitra.</Text>
        <Button title="Otvoriť Futbalnet" variant="secondary" size="lg" fullWidth onPress={() => Linking.openURL(FUTBALNET_URL)} iconRight={<Icon name="arrowRight" size={16} color="#FFFFFF" />} />
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>O klube</Text>
        <Text style={styles.infoText}>FC Výčapy-Opatovce pôsobí v Oblastnej lige Nitra. Domáce zápasy hráme na obecnom ihrisku. Pravidelné tréningy, mládežnícke družstvá aj A-tím — sledujte nás na Futbalnet.sk.</Text>
      </View>
    </ScrollView>
  )
}

function Loading() { const styles = useStyles(); return <View style={styles.center}><ActivityIndicator size="large" color={FC_GREEN} /></View> }
function ErrorBox({ msg, hint }: { msg: string; hint?: string }) {
  const styles = useStyles()
  return <View style={{ padding: spacing.lg }}><View style={styles.errBox}><Text style={styles.errTitle}>Nepodarilo sa načítať dáta</Text><Text style={styles.errMsg}>{msg}</Text>{hint && <Text style={styles.errHint}>{hint}</Text>}</View></View>
}
function Empty({ icon, title }: { icon: IconName; title: string }) {
  const styles = useStyles(); const t = useThemeColors()
  return <View style={styles.center}><Icon name={icon} size={52} color={t.textPlaceholder} /><Text style={styles.emptyTitle}>{title}</Text></View>
}

const makeStyles = (t: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  header: { backgroundColor: FC_GREEN, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', marginBottom: spacing.sm },
  backText: { color: '#FFFFFF', ...typo.bodyB },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  logoText: { color: FC_GREEN, fontSize: 14, fontFamily: 'Inter_800ExtraBold', lineHeight: 16 },
  logoVO: { color: FC_GREEN, fontSize: 11, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.5 },
  headerTitle: { color: '#FFFFFF', fontSize: 21, fontFamily: fonts.display, letterSpacing: -0.3 },
  headerSub: { color: 'rgba(255,255,255,0.85)', ...typo.caption, marginTop: 2 },

  tabBar: { flexDirection: 'row', backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.borderLight },
  tab: { flex: 1, paddingVertical: spacing.sm, paddingHorizontal: 4, alignItems: 'center', gap: 2, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: FC_GREEN },
  tabLabel: { ...typo.micro, color: t.textMuted },
  tabLabelActive: { color: FC_GREEN, fontFamily: 'Inter_800ExtraBold' },

  list: { padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl, gap: spacing.sm },
  emptyTitle: { ...typo.h3, color: t.text, marginTop: spacing.sm },

  zapasKarta: { backgroundColor: t.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadows.sm, shadowColor: t.shadow, gap: spacing.sm },
  zapasTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  domaBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  domaText: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.4 },
  vysledokBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  vysledokBadgeText: { fontSize: 11, fontFamily: 'Inter_800ExtraBold' },
  zapasTitle: { ...typo.h2, color: t.text },
  skoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  skoreTeam: { flex: 1, ...typo.bodyB, color: t.text },
  skoreBox: { paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: t.surfaceAlt, borderRadius: radius.md, minWidth: 78, alignItems: 'center' },
  skoreText: { fontSize: 22, fontFamily: 'Inter_800ExtraBold', color: t.text, letterSpacing: 1 },
  zapasMeta: { gap: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  zapasMetaText: { ...typo.caption, color: t.textSecondary },
  zapasFooter: { borderTopWidth: 1, borderTopColor: t.divider, paddingTop: spacing.sm, marginTop: 2 },
  zapasLink: { ...typo.captionB, color: FC_GREEN },

  hraciSekciaTitul: { ...typo.label, color: t.textMuted, marginBottom: spacing.sm },
  hraciGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hracKarta: { flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: t.surface, borderRadius: radius.md, padding: spacing.sm, ...shadows.sm, shadowColor: t.shadow },
  hracCislo: { width: 38, height: 38, borderRadius: 19, backgroundColor: FC_GREEN, justifyContent: 'center', alignItems: 'center' },
  hracCisloTrener: { backgroundColor: C.brand.gold },
  hracCisloText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_800ExtraBold' },
  hracCisloTrenerText: { color: '#5D4037' },
  hracMeno: { ...typo.caption, color: t.textMuted },
  hracPriezvisko: { ...typo.h3, color: t.text },
  hracPozicia: { fontSize: 10, color: t.textPlaceholder, textTransform: 'uppercase', letterSpacing: 0.3, fontFamily: 'Inter_600SemiBold' },

  futbalnetWrap: { padding: spacing.lg, gap: spacing.md },
  futbalnetCard: { backgroundColor: t.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.md, ...shadows.md, shadowColor: t.shadow },
  futbalnetLogo: { width: 72, height: 72, borderRadius: radius.lg, backgroundColor: FC_GREEN, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  futbalnetTitle: { ...typo.h1, color: t.text },
  futbalnetSub: { ...typo.body, color: t.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: spacing.sm, paddingHorizontal: spacing.sm },
  infoCard: { backgroundColor: t.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderLeftWidth: 4, borderLeftColor: FC_GREEN },
  infoTitle: { ...typo.h3, color: t.text },
  infoText: { ...typo.caption, color: t.textSecondary, lineHeight: 19 },

  errBox: { backgroundColor: t.surface, borderRadius: radius.lg, padding: spacing.lg, borderLeftWidth: 4, borderLeftColor: C.brand.red, gap: 6 },
  errTitle: { ...typo.h3, color: C.brand.red },
  errMsg: { ...typo.caption, color: t.textSecondary, lineHeight: 19 },
  errHint: { ...typo.micro, color: t.textMuted, lineHeight: 18 },

  fcModeBar: { flexDirection: 'row', gap: spacing.sm, marginBottom: 2 },
  fcModeBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: t.surfaceAlt, borderWidth: 1, borderColor: 'transparent' },
  fcModeBtnActive: { backgroundColor: FC_GREEN_LIGHT, borderColor: FC_GREEN },
  fcModeBtnText: { ...typo.caption, fontFamily: 'Inter_700Bold', color: t.textMuted },
  fcModeBtnTextActive: { color: FC_GREEN },
  fcMonthHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: 2 },
  fcMonthLine: { flex: 1, height: 1, backgroundColor: t.border },
  fcMonthLabel: { ...typo.label, color: t.textMuted },
})
