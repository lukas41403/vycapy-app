/**
 * Ankety — občania hlasujú o otázkach obecného úradu. Editorial + theme-aware.
 */

import { AtmosphereBackground, Icon, IconName, PressableScale } from '@/components/ui'
import { C } from '@/constants/colors'
import { Anketa, Odpoved, useAktivneAnkety, useAnketaVysledok } from '@/src/hooks/useAnkety'
import { ThemeColors, useThemeColors } from '@/src/theme/ThemeContext'
import { fonts, radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const ANKETA_FIALOVA = '#7B1FA2'
const ANKETA_LIGHT = '#F3E5F5'
const useStyles = () => { const t = useThemeColors(); return useMemo(() => makeStyles(t), [t]) }

export default function AnketyScreen() {
  const router = useRouter()
  const t = useThemeColors()
  const styles = useStyles()
  const { ankety, loading, error, reload } = useAktivneAnkety()

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AtmosphereBackground tint={ANKETA_FIALOVA} />
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back} scaleTo={0.94} accessibilityLabel="Späť">
          <Icon name="chevronBack" size={20} color="#FFFFFF" /><Text style={styles.backText}>Späť</Text>
        </PressableScale>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}><Icon name="ankety" size={26} color="#FFFFFF" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Ankety obce</Text>
            <Text style={styles.headerSub}>Vyjadrite svoj názor</Text>
          </View>
        </View>
      </View>

      {loading && <View style={styles.center}><ActivityIndicator size="large" color={ANKETA_FIALOVA} /></View>}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Nepodarilo sa načítať ankety</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <Text style={styles.errorHint}>Tip: vytvorte tabuľky ankety a hlasy v Supabase.</Text>
          <PressableScale style={styles.errorBtn} scaleTo={0.96} onPress={reload}><Text style={styles.errorBtnText}>Skúsiť znova</Text></PressableScale>
        </View>
      )}

      {!loading && !error && ankety.length === 0 && (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Icon name="ankety" size={44} color={ANKETA_FIALOVA} /></View>
          <Text style={styles.emptyTitle}>Žiadne aktívne ankety</Text>
          <Text style={styles.emptyText}>Momentálne neprebieha žiadne hlasovanie. Keď starosta zverejní novú otázku, dáme vám vedieť.</Text>
        </View>
      )}

      {!loading && !error && ankety.length > 0 && (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {ankety.map(a => <AnketaKarta key={a.id} anketa={a} />)}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function AnketaKarta({ anketa }: { anketa: Anketa }) {
  const styles = useStyles()
  const t = useThemeColors()
  const { vysledok, hlasuj } = useAnketaVysledok(anketa.id)
  const [posielam, setPosielam] = useState<Odpoved | null>(null)
  const total = vysledok.total
  const pct = (n: number) => total === 0 ? 0 : Math.round((n / total) * 100)

  async function hlasujKlik(o: Odpoved) {
    if (vysledok.mojHlas) { Alert.alert('Už ste hlasovali', 'V tejto ankete ste už zaznamenali svoj hlas.'); return }
    setPosielam(o)
    try { await hlasuj(o); Alert.alert('Ďakujeme!', 'Váš hlas bol zaznamenaný.') }
    catch (e: any) { Alert.alert('Chyba', e?.message ?? 'Hlas sa nepodarilo odoslať.') }
    finally { setPosielam(null) }
  }

  const deadlineStr = anketa.deadline ? new Date(anketa.deadline).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' }) : null

  return (
    <View style={styles.karta}>
      <Text style={styles.otazka}>{anketa.otazka}</Text>
      {anketa.popis && <Text style={styles.popis}>{anketa.popis}</Text>}
      {deadlineStr && <View style={styles.deadlineRow}><Icon name="time" size={13} color={t.textMuted} /><Text style={styles.deadline}>Hlasovanie končí: {deadlineStr}</Text></View>}

      {!vysledok.mojHlas ? (
        <View style={styles.btnRow}>
          <HlasBtn icon="check" label="Pre" color={t.secondary} disabled={posielam !== null} loading={posielam === 'pre'} onPress={() => hlasujKlik('pre')} />
          <HlasBtn icon="close" label="Proti" color={C.brand.red} disabled={posielam !== null} loading={posielam === 'proti'} onPress={() => hlasujKlik('proti')} />
          <HlasBtn icon="ellipsis" label="Zdržiavam" color={t.textMuted} disabled={posielam !== null} loading={posielam === 'zdrziavam'} onPress={() => hlasujKlik('zdrziavam')} />
        </View>
      ) : (
        <View style={styles.mojHlasBox}>
          <Icon name="checkCircle" size={16} color={ANKETA_FIALOVA} />
          <Text style={styles.mojHlasText}>Hlasoval(a) ste: {vysledok.mojHlas === 'pre' ? 'Pre' : vysledok.mojHlas === 'proti' ? 'Proti' : 'Zdržiavam sa'}</Text>
        </View>
      )}

      {total > 0 && (
        <View style={styles.vysledky}>
          <Text style={styles.vysledkyTitul}>Výsledky ({total} {total === 1 ? 'hlas' : total < 5 ? 'hlasy' : 'hlasov'})</Text>
          <VysledokBar label="Pre" n={vysledok.pre} pct={pct(vysledok.pre)} color={t.secondary} />
          <VysledokBar label="Proti" n={vysledok.proti} pct={pct(vysledok.proti)} color={C.brand.red} />
          <VysledokBar label="Zdržiavam sa" n={vysledok.zdrziavam} pct={pct(vysledok.zdrziavam)} color={t.textMuted} />
        </View>
      )}
    </View>
  )
}

function HlasBtn({ icon, label, color, disabled, loading, onPress }: { icon: IconName; label: string; color: string; disabled: boolean; loading: boolean; onPress: () => void }) {
  const styles = useStyles()
  return (
    <PressableScale style={[styles.hlasBtn, { backgroundColor: color }, disabled && { opacity: 0.5 }]} scaleTo={0.95} disabled={disabled} onPress={onPress} accessibilityLabel={label}>
      {loading ? <ActivityIndicator color="#fff" /> : <><Icon name={icon} size={15} color="#FFFFFF" /><Text style={styles.hlasBtnText}>{label}</Text></>}
    </PressableScale>
  )
}

function VysledokBar({ label, n, pct, color }: { label: string; n: number; pct: number; color: string }) {
  const styles = useStyles()
  return (
    <View style={styles.vysledokRow}>
      <Text style={styles.vysledokLabel}>{label}</Text>
      <View style={styles.barTrack}><View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} /></View>
      <Text style={[styles.vysledokPct, { color }]}>{pct}%</Text>
      <Text style={styles.vysledokN}>({n})</Text>
    </View>
  )
}

const makeStyles = (t: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  header: { backgroundColor: ANKETA_FIALOVA, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', marginBottom: spacing.sm },
  backText: { color: '#fff', ...typo.bodyB },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 23, fontFamily: fonts.display, letterSpacing: -0.3 },
  headerSub: { color: 'rgba(255,255,255,0.85)', ...typo.caption, marginTop: 2 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl, gap: spacing.sm },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: ANKETA_LIGHT, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  emptyTitle: { ...typo.h2, color: t.text },
  emptyText: { ...typo.caption, color: t.textMuted, textAlign: 'center', lineHeight: 19 },

  errorBox: { margin: spacing.lg, padding: spacing.lg, backgroundColor: t.surface, borderRadius: radius.lg, borderLeftWidth: 4, borderLeftColor: C.brand.red, gap: 6 },
  errorTitle: { ...typo.h3, color: C.brand.red },
  errorMsg: { ...typo.caption, color: t.textSecondary, lineHeight: 19 },
  errorHint: { ...typo.micro, color: t.textMuted, lineHeight: 18, marginTop: 4 },
  errorBtn: { marginTop: spacing.sm, alignSelf: 'flex-start', backgroundColor: ANKETA_FIALOVA, borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  errorBtnText: { color: '#fff', ...typo.captionB },

  list: { padding: spacing.lg, gap: spacing.md },
  karta: { backgroundColor: t.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, ...shadows.md, shadowColor: t.shadow, borderLeftWidth: 4, borderLeftColor: ANKETA_FIALOVA },
  otazka: { ...typo.h3, fontSize: 17, color: t.text, lineHeight: 23 },
  popis: { ...typo.body, color: t.textSecondary },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  deadline: { ...typo.caption, color: t.textMuted },

  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  hlasBtn: { flex: 1, flexDirection: 'row', gap: 5, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  hlasBtnText: { color: '#fff', ...typo.captionB },

  mojHlasBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: ANKETA_LIGHT, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xs },
  mojHlasText: { color: ANKETA_FIALOVA, ...typo.captionB },

  vysledky: { borderTopWidth: 1, borderTopColor: t.divider, paddingTop: spacing.md, marginTop: spacing.sm, gap: spacing.sm },
  vysledkyTitul: { ...typo.label, color: t.textMuted, marginBottom: 4 },
  vysledokRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  vysledokLabel: { ...typo.caption, color: t.textSecondary, width: 92 },
  barTrack: { flex: 1, height: 8, backgroundColor: t.surfaceAlt, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  vysledokPct: { ...typo.captionB, width: 36, textAlign: 'right' },
  vysledokN: { ...typo.micro, color: t.textPlaceholder, width: 30 },
})
