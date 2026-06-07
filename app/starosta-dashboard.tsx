/**
 * Starosta dashboard — IoT a infraštruktúra obce. Editorial + theme-aware.
 * Verejné osvetlenie (toggle), senzory (animované Counter hodnoty), varovanie občanom.
 */

import { AtmosphereBackground, Button, Counter, Icon, IconName, Input, PressableScale } from '@/components/ui'
import { C } from '@/constants/colors'
import { useObecneZariadenia, Zariadenie } from '@/src/hooks/useObecneZariadenia'
import { odoslatVarovanie } from '@/src/lib/pushNotifications'
import { supabase } from '@/src/lib/supabase'
import { ThemeColors, useThemeColors } from '@/src/theme/ThemeContext'
import { fonts, radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const useStyles = () => { const t = useThemeColors(); return useMemo(() => makeStyles(t), [t]) }

export default function StarostaDashboard() {
  const router = useRouter()
  const t = useThemeColors()
  const styles = useStyles()
  const [authChecked, setAuthChecked] = useState(false)
  const { zariadenia, loading, error, nacitaj, toggleStav, nastavitVsetkyOsvetlenia } = useObecneZariadenia()
  const [pushOpen, setPushOpen] = useState(false)
  const [pushTitle, setPushTitle] = useState('')
  const [pushBody, setPushBody] = useState('')
  const [pushSending, setPushSending] = useState(false)

  async function poslaPush() {
    if (pushTitle.trim().length < 3 || pushBody.trim().length < 5) { Alert.alert('Vyplňte správu', 'Titulok aspoň 3 znaky, text aspoň 5 znakov.'); return }
    setPushSending(true)
    try {
      const r = await odoslatVarovanie({ title: pushTitle.trim(), body: pushBody.trim() })
      Alert.alert('Hotovo', `Odoslané: ${r.ok}\nChyby: ${r.chyba}\nCelkom tokenov: ${r.total}`)
      setPushTitle(''); setPushBody(''); setPushOpen(false)
    } catch (e: any) {
      Alert.alert('Chyba', e?.message ?? 'Push sa nepodarilo odoslať.')
    } finally { setPushSending(false) }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/admin-login' as never)
      else setAuthChecked(true)
    })
  }, [router])

  if (!authChecked) {
    return <SafeAreaView style={styles.safe} edges={['top']}><View style={styles.center}><ActivityIndicator size="large" color={t.primary} /></View></SafeAreaView>
  }

  const osvetlenia = zariadenia.filter(z => z.typ === 'osvetlenie')
  const senzory = zariadenia.filter(z => z.typ !== 'osvetlenie')
  const zapnutych = osvetlenia.filter(o => o.stav).length

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <PressableScale onPress={() => router.back()} scaleTo={0.94} style={styles.headBtn} accessibilityLabel="Späť"><Icon name="chevronBack" size={20} color="#fff" /><Text style={styles.headBtnText}>Späť</Text></PressableScale>
          <PressableScale onPress={nacitaj} scaleTo={0.94} style={styles.headBtn} accessibilityLabel="Obnoviť"><Icon name="refresh" size={16} color="rgba(255,255,255,0.85)" /><Text style={styles.refreshText}>Obnoviť</Text></PressableScale>
        </View>
        <Text style={styles.headerTitle}>Starosta dashboard</Text>
        <Text style={styles.headerSub}>Ing. Jozef Holúbek · Správa obce</Text>
      </View>

      {loading && <View style={styles.center}><ActivityIndicator size="large" color={t.primary} /></View>}

      {error && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Nepodarilo sa načítať zariadenia</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <Text style={styles.errorHint}>Tip: vytvorte tabuľku obecne_zariadenia v Supabase.</Text>
          <PressableScale style={styles.errorBtn} scaleTo={0.96} onPress={nacitaj}><Text style={styles.errorBtnText}>Skúsiť znova</Text></PressableScale>
        </View>
      )}

      {!loading && !error && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Sekcia title="Verejné osvetlenie" sub={`${zapnutych} / ${osvetlenia.length} zapnutých`}>
            <View style={styles.hromadne}>
              <PressableScale style={[styles.hromBtn, styles.hromBtnZap]} scaleTo={0.96} onPress={() => nastavitVsetkyOsvetlenia(true)} accessibilityLabel="Všetko zapnúť"><Icon name="sun" size={16} color={t.secondary} /><Text style={[styles.hromBtnText, { color: t.secondary }]}>Všetko zapnúť</Text></PressableScale>
              <PressableScale style={[styles.hromBtn, styles.hromBtnVyp]} scaleTo={0.96} onPress={() => nastavitVsetkyOsvetlenia(false)} accessibilityLabel="Všetko vypnúť"><Icon name="moon" size={16} color={t.textSecondary} /><Text style={[styles.hromBtnText, { color: t.textSecondary }]}>Všetko vypnúť</Text></PressableScale>
            </View>
            <View style={styles.karta}>
              {osvetlenia.map((o, i) => (
                <View key={o.id} style={[styles.osvRow, i < osvetlenia.length - 1 && styles.osvRowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.osvNazov}>{o.nazov}</Text>
                    {o.ulica && <Text style={styles.osvUlica}>{o.ulica}</Text>}
                  </View>
                  <View style={styles.osvStav}>
                    <Text style={[styles.osvStavText, { color: o.stav ? t.secondary : t.textPlaceholder }]}>{o.stav ? 'ZAP' : 'VYP'}</Text>
                    <Switch value={!!o.stav} onValueChange={(v) => toggleStav(o.id, v)} trackColor={{ false: t.border, true: t.secondary + '88' }} thumbColor={o.stav ? t.secondary : '#F4F4F4'} ios_backgroundColor={t.border} />
                  </View>
                </View>
              ))}
              {osvetlenia.length === 0 && <Text style={styles.muted}>Žiadne body osvetlenia zatiaľ.</Text>}
            </View>
          </Sekcia>

          <Sekcia title="Senzory" sub="Aktuálne hodnoty (read-only)">
            <View style={{ gap: spacing.sm }}>
              {senzory.map(s => <SenzorKarta key={s.id} z={s} />)}
              {senzory.length === 0 && <Text style={styles.muted}>Žiadne senzory zatiaľ.</Text>}
            </View>
          </Sekcia>

          <Sekcia title="Rýchle akcie">
            <PressableScale style={styles.akciaBtn} scaleTo={0.98} onPress={() => setPushOpen(true)} accessibilityLabel="Poslať varovanie občanom">
              <View style={[styles.akciaIcon, { backgroundColor: C.brand.red + '1A' }]}><Icon name="notifications" size={22} color={C.brand.red} /></View>
              <View style={{ flex: 1 }}><Text style={styles.akciaBtnTitle}>Poslať varovanie občanom</Text><Text style={styles.akciaBtnSub}>Push notifikácia do appky</Text></View>
              <Icon name="chevron" size={20} color={t.textPlaceholder} />
            </PressableScale>
            <PressableScale style={styles.akciaBtn} scaleTo={0.98} onPress={() => router.push('/admin' as never)} accessibilityLabel="Štatistiky hlásení">
              <View style={[styles.akciaIcon, { backgroundColor: t.primaryLight }]}><Icon name="ankety" size={22} color={t.primary} /></View>
              <View style={{ flex: 1 }}><Text style={styles.akciaBtnTitle}>Štatistiky hlásení</Text><Text style={styles.akciaBtnSub}>Otvor admin panel</Text></View>
              <Icon name="chevron" size={20} color={t.textPlaceholder} />
            </PressableScale>
          </Sekcia>
          <View style={{ height: spacing.lg }} />
        </ScrollView>
      )}

      <Modal visible={pushOpen} animationType="slide" transparent onRequestClose={() => setPushOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalTitleRow}><Icon name="notifications" size={20} color={C.brand.red} /><Text style={styles.modalTitle}>Varovanie občanom</Text></View>
            <Text style={styles.modalSub}>Notifikácia príde všetkým, čo majú appku nainštalovanú.</Text>
            <Input label="Titulok" value={pushTitle} onChangeText={setPushTitle} placeholder="napr. Výpadok vody" maxLength={60} containerStyle={{ marginTop: spacing.sm }} />
            <Input label="Text správy" value={pushBody} onChangeText={setPushBody} placeholder="napr. Dnes 14:00–16:00 bude prerušená dodávka…" multiline maxLength={240} style={{ height: 84, paddingTop: 6 }} containerStyle={{ marginTop: spacing.sm }} />
            <View style={styles.modalActions}>
              <Button title="Zrušiť" variant="outline" onPress={() => setPushOpen(false)} style={{ flex: 1 }} />
              <Button title="Odoslať" variant="danger" loading={pushSending} onPress={poslaPush} icon={<Icon name="send" size={16} color="#fff" />} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function Sekcia({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  const styles = useStyles()
  return (
    <View style={styles.sekcia}>
      <View style={styles.sekciaHead}><Text style={styles.sekciaTitle}>{title}</Text>{sub && <Text style={styles.sekciaSub}>{sub}</Text>}</View>
      {children}
    </View>
  )
}

function SenzorKarta({ z }: { z: Zariadenie }) {
  const styles = useStyles()
  const t = useThemeColors()
  const hodnota = z.posledna_hodnota
  const jednotka = z.jednotka ?? ''

  if (z.typ === 'senzor_vody') {
    const farba = hodnota == null ? t.textMuted : hodnota < 60 ? t.secondary : hodnota < 80 ? '#F57F17' : C.brand.red
    const stav = hodnota == null ? 'N/A' : hodnota < 60 ? 'V poriadku' : hodnota < 80 ? 'Zvýšená' : 'Kritická'
    return (
      <View style={styles.karta}>
        <View style={styles.senRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.senLabelRow}><Icon name="water" size={16} color={farba} /><Text style={styles.senLabel}>{z.nazov}</Text></View>
            {z.ulica && <Text style={styles.osvUlica}>{z.ulica}</Text>}
            <View style={[styles.senBadge, { backgroundColor: farba + '22' }]}><Text style={[styles.senBadgeText, { color: farba }]}>{stav}</Text></View>
          </View>
          <Text style={[styles.senHodnota, { color: farba }]}>{hodnota != null ? <Counter value={hodnota} style={[styles.senHodnota, { color: farba }]} /> : '—'}<Text style={styles.senJednotka}>{jednotka}</Text></Text>
        </View>
      </View>
    )
  }

  if (z.typ === 'kontajner') {
    const pct = Math.min(100, Math.max(0, hodnota ?? 0))
    const farba = pct < 50 ? t.secondary : pct < 80 ? '#F57F17' : C.brand.red
    return (
      <View style={styles.karta}>
        <View style={styles.senLabelRow}><Icon name="odpady" size={16} color={farba} /><Text style={styles.senLabel}>{z.nazov}</Text></View>
        {z.ulica && <Text style={styles.osvUlica}>{z.ulica}</Text>}
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: farba }]} /></View>
        <Text style={[styles.progressText, { color: farba }]}>{pct}% naplnené</Text>
      </View>
    )
  }

  return (
    <View style={styles.karta}>
      <View style={styles.senRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.senLabelRow}><Icon name={z.typ === 'meteo' ? 'meteo' : 'flash'} size={16} color={t.primary} /><Text style={styles.senLabel}>{z.nazov}</Text></View>
          {z.ulica && <Text style={styles.osvUlica}>{z.ulica}</Text>}
        </View>
        <Text style={styles.senHodnota}>{hodnota != null ? <Counter value={hodnota} style={styles.senHodnota} /> : '—'}<Text style={styles.senJednotka}>{jednotka}</Text></Text>
      </View>
    </View>
  )
}

const makeStyles = (t: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: C.brand.redDark, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  headBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headBtnText: { color: '#fff', ...typo.bodyB },
  refreshText: { color: 'rgba(255,255,255,0.85)', ...typo.caption, fontFamily: 'Inter_600SemiBold' },
  headerTitle: { color: '#fff', fontSize: 24, fontFamily: fonts.display, marginTop: spacing.sm, letterSpacing: -0.3 },
  headerSub: { color: 'rgba(255,255,255,0.85)', ...typo.caption },

  errorBox: { margin: spacing.lg, padding: spacing.lg, backgroundColor: t.surface, borderRadius: radius.lg, borderLeftWidth: 4, borderLeftColor: t.primary, gap: 6 },
  errorTitle: { ...typo.h3, color: t.primary },
  errorMsg: { ...typo.caption, color: t.textSecondary, lineHeight: 19 },
  errorHint: { ...typo.micro, color: t.textMuted, lineHeight: 18, marginTop: 4 },
  errorBtn: { marginTop: spacing.sm, alignSelf: 'flex-start', backgroundColor: t.primary, borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  errorBtnText: { color: '#fff', ...typo.captionB },

  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sekcia: { marginBottom: spacing.xl },
  sekciaHead: { marginBottom: spacing.sm },
  sekciaTitle: { ...typo.label, color: t.textMuted },
  sekciaSub: { ...typo.caption, color: t.textPlaceholder, marginTop: 2 },

  hromadne: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  hromBtn: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  hromBtnZap: { backgroundColor: t.secondaryLight },
  hromBtnVyp: { backgroundColor: t.surfaceAlt, borderWidth: 1, borderColor: t.border },
  hromBtnText: { ...typo.captionB },

  karta: { backgroundColor: t.surface, borderRadius: radius.lg, padding: spacing.md, ...shadows.sm, shadowColor: t.shadow },
  osvRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md },
  osvRowBorder: { borderBottomWidth: 1, borderBottomColor: t.divider },
  osvNazov: { ...typo.bodyB, color: t.text },
  osvUlica: { ...typo.caption, color: t.textMuted, marginTop: 2 },
  osvStav: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  osvStavText: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.5, width: 28, textAlign: 'right' },

  senRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  senLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  senLabel: { ...typo.bodyB, color: t.text },
  senHodnota: { fontSize: 26, fontFamily: 'Inter_800ExtraBold', color: t.text },
  senJednotka: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: t.textMuted },
  senBadge: { alignSelf: 'flex-start', borderRadius: radius.xs, paddingHorizontal: spacing.sm, paddingVertical: 3, marginTop: 6 },
  senBadgeText: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.3 },
  progressTrack: { height: 12, backgroundColor: t.surfaceAlt, borderRadius: 6, overflow: 'hidden', marginTop: spacing.sm },
  progressFill: { height: '100%', borderRadius: 6 },
  progressText: { ...typo.captionB, marginTop: 6 },
  muted: { ...typo.caption, color: t.textMuted, fontStyle: 'italic' },

  akciaBtn: { backgroundColor: t.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md, ...shadows.sm, shadowColor: t.shadow },
  akciaIcon: { width: 44, height: 44, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  akciaBtnTitle: { ...typo.h3, color: t.text },
  akciaBtnSub: { ...typo.caption, color: t.textMuted, marginTop: 2 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: spacing.lg },
  modalBox: { backgroundColor: t.surface, borderRadius: radius.xl, padding: spacing.xl, ...shadows.lg, shadowColor: '#000' },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  modalTitle: { ...typo.h2, color: t.text },
  modalSub: { ...typo.caption, color: t.textMuted, marginTop: 4 },
  modalLabel: { ...typo.captionB, color: t.textSecondary, marginTop: spacing.md, marginBottom: 6 },
  textareaWrap: { height: 0 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
})
