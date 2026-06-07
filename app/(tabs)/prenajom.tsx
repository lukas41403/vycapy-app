import { AppHeader } from '@/components/AppHeader'
import { AtmosphereBackground, Button, Icon, IconName, Input, PressableScale } from '@/components/ui'
import { C } from '@/constants/colors'
import { supabase } from '@/src/lib/supabase'
import { ThemeColors, useThemeColors } from '@/src/theme/ThemeContext'
import { radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const UCELY: { id: string; label: string; icon: IconName }[] = [
  { id: 'sport',   label: 'Šport / tréning',    icon: 'fc' },
  { id: 'kultura', label: 'Kultúrna akcia',     icon: 'music' },
  { id: 'oslava',  label: 'Oslava / party',     icon: 'sparkles' },
  { id: 'firemne', label: 'Firemné podujatie',  icon: 'document' },
  { id: 'ine',     label: 'Iné',                icon: 'grid' },
]

type Rezervacia = { id: string; datum: string; cas_od: string; cas_do: string; ucel: string; status?: string | null }
const MESIACE_SK = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December']

export default function PrenajomScreen() {
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])
  const [meno, setMeno] = useState('')
  const [email, setEmail] = useState('')
  const [telefon, setTelefon] = useState('')
  const [datum, setDatum] = useState('')
  const [casOd, setCasOd] = useState('')
  const [casDo, setCasDo] = useState('')
  const [ucel, setUcel] = useState('')
  const [pocetOsob, setPocetOsob] = useState('')
  const [poznamka, setPoznamka] = useState('')
  const [loading, setLoading] = useState(false)
  const [odoslane, setOdoslane] = useState(false)
  const [rezervacie, setRezervacie] = useState<Rezervacia[]>([])

  useEffect(() => {
    async function fetchRezervacie() {
      const dnes = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('prenajom_haly').select('id, datum, cas_od, cas_do, ucel, status').eq('status', 'schvalene').gte('datum', dnes).order('datum', { ascending: true })
      if (data) setRezervacie(data as Rezervacia[])
    }
    fetchRezervacie()
  }, [])

  async function odoslatZiadost() {
    if (!meno || !email || !telefon || !datum || !casOd || !casDo || !ucel) {
      Alert.alert('Chýbajú údaje', 'Vyplňte všetky povinné polia.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('prenajom_haly').insert({
      meno: meno.trim(), email: email.trim(), telefon: telefon.trim(), datum, cas_od: casOd, cas_do: casDo, ucel,
      pocet_osob: pocetOsob ? parseInt(pocetOsob) : null, poznamka: poznamka.trim() || null,
    })
    setLoading(false)
    if (error) Alert.alert('Chyba', 'Žiadosť sa nepodarilo odoslať.')
    else setOdoslane(true)
  }

  if (odoslane) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AtmosphereBackground />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}><Icon name="checkCircle" size={56} color={t.secondary} /></View>
          <Text style={styles.successTitle}>Žiadosť odoslaná!</Text>
          <Text style={styles.successText}>Vaša žiadosť o prenájom bola prijatá. Obecný úrad vás bude kontaktovať do 3 pracovných dní na zadaný email alebo telefón.</Text>
          <Button title="Nová žiadosť" variant="secondary" onPress={() => {
            setOdoslane(false); setMeno(''); setEmail(''); setTelefon(''); setDatum(''); setCasOd(''); setCasDo(''); setUcel(''); setPocetOsob(''); setPoznamka('')
          }} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AtmosphereBackground />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        <AppHeader title="Prenájom haly" subtitle="Športová hala Výčapy-Opatovce" />

        {/* INFO KARTA */}
        <View style={styles.infoKarta}>
          <InfoRow icon="location" text="Športová hala, Výčapy-Opatovce" styles={styles} tint={t.secondary} />
          <InfoRow icon="time" text="Dostupná: Po–Ne, 8:00–22:00" styles={styles} tint={t.secondary} />
          <InfoRow icon="people" text="Kapacita: až 200 osôb" styles={styles} tint={t.secondary} />
          <InfoRow icon="tag" text="Cena: od 15 €/hod (pre obyvateľov obce)" styles={styles} tint={t.secondary} />
        </View>

        <KalendarObsadenosti rezervacie={rezervacie} vybranyDatum={datum} onPick={setDatum} t={t} />

        <View style={styles.content}>
          <Text style={styles.label}>Účel prenájmu *</Text>
          <View style={styles.ucelyGrid}>
            {UCELY.map(u => {
              const active = ucel === u.id
              return (
                <PressableScale key={u.id} style={[styles.ucelBtn, active && styles.ucelBtnActive]} scaleTo={0.96} onPress={() => setUcel(u.id)} accessibilityLabel={u.label}>
                  <Icon name={u.icon} size={15} color={active ? t.primary : t.textMuted} />
                  <Text style={[styles.ucelBtnText, active && styles.ucelBtnTextActive]}>{u.label}</Text>
                </PressableScale>
              )
            })}
          </View>

          <Text style={styles.sectionLabel}>Kontaktné údaje</Text>
          <Input label="Meno a priezvisko *" icon="person" placeholder="Ján Novák" value={meno} onChangeText={setMeno} containerStyle={styles.gap} />
          <Input label="Email *" icon="aktuality" placeholder="jan.novak@email.sk" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" containerStyle={styles.gap} />
          <Input label="Telefón *" icon="kontakty" placeholder="+421 900 000 000" value={telefon} onChangeText={setTelefon} keyboardType="phone-pad" containerStyle={styles.gap} />

          <Text style={styles.sectionLabel}>Termín prenájmu</Text>
          <Input label="Dátum * (RRRR-MM-DD)" icon="podujatia" placeholder="napr. 2026-06-15" value={datum} onChangeText={setDatum} containerStyle={styles.gap} />
          <View style={styles.casRow}>
            <Input label="Od *" placeholder="08:00" value={casOd} onChangeText={setCasOd} containerStyle={{ flex: 1 }} />
            <Input label="Do *" placeholder="10:00" value={casDo} onChangeText={setCasDo} containerStyle={{ flex: 1 }} />
          </View>
          <Input label="Počet osôb" icon="people" placeholder="napr. 30" value={pocetOsob} onChangeText={setPocetOsob} keyboardType="number-pad" containerStyle={styles.gap} />

          <Text style={styles.label}>Poznámka</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Doplňujúce informácie…"
            placeholderTextColor={t.textPlaceholder}
            value={poznamka}
            onChangeText={setPoznamka}
            multiline
            textAlignVertical="top"
          />

          <Button title="Odoslať žiadosť o prenájom" variant="primary" size="lg" fullWidth loading={loading} onPress={odoslatZiadost} style={{ marginTop: spacing.lg }} icon={<Icon name="send" size={16} color="#FFFFFF" />} />
          <Text style={styles.disclaimer}>* Povinné polia. Po odoslaní vás budeme kontaktovať do 3 pracovných dní.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function InfoRow({ icon, text, styles, tint }: { icon: IconName; text: string; styles: any; tint: string }) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={16} color={tint} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  )
}

// ─── Kalendár obsadenosti ───────────────────────────────────────────────────
function KalendarObsadenosti({ rezervacie, vybranyDatum, onPick, t }: { rezervacie: Rezervacia[]; vybranyDatum: string; onPick: (iso: string) => void; t: ThemeColors }) {
  const k = useMemo(() => makeKalStyles(t), [t])
  const [zobrazeny, setZobrazeny] = useState(new Date())
  const podlaDna = useMemo(() => {
    const m: Record<string, Rezervacia[]> = {}
    rezervacie.forEach(r => { if (!m[r.datum]) m[r.datum] = []; m[r.datum].push(r) })
    return m
  }, [rezervacie])

  const rok = zobrazeny.getFullYear(); const mesiac = zobrazeny.getMonth()
  const prvyDen = new Date(rok, mesiac, 1)
  const dniVMesiaci = new Date(rok, mesiac + 1, 0).getDate()
  const startDay = (prvyDen.getDay() + 6) % 7
  const dnesKey = new Date().toISOString().split('T')[0]
  const keyFor = (d: number) => `${rok}-${String(mesiac + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const cells: (number | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= dniVMesiaci; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const obsadenoVMesiaci = Object.keys(podlaDna).filter(key => { const d = new Date(key); return d.getFullYear() === rok && d.getMonth() === mesiac }).length

  return (
    <View style={k.box}>
      <View style={k.head}>
        <Text style={k.title}>Voľný kalendár haly</Text>
        <Text style={k.sub}>{obsadenoVMesiaci === 0 ? 'V tomto mesiaci sú všetky dni voľné' : `Obsadených dní v mesiaci: ${obsadenoVMesiaci}`}</Text>
      </View>
      <View style={k.nav}>
        <PressableScale style={k.navBtn} scaleTo={0.9} onPress={() => setZobrazeny(new Date(rok, mesiac - 1, 1))} accessibilityLabel="Predchádzajúci mesiac"><Icon name="chevronBack" size={18} color={t.primary} /></PressableScale>
        <Text style={k.monthTitle}>{MESIACE_SK[mesiac]} {rok}</Text>
        <PressableScale style={k.navBtn} scaleTo={0.9} onPress={() => setZobrazeny(new Date(rok, mesiac + 1, 1))} accessibilityLabel="Nasledujúci mesiac"><Icon name="chevron" size={18} color={t.primary} /></PressableScale>
      </View>
      <View style={k.weekHeader}>{['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'].map(d => <Text key={d} style={k.weekDay}>{d}</Text>)}</View>
      <View style={k.grid}>
        {cells.map((d, idx) => {
          if (d === null) return <View key={idx} style={k.cell} />
          const key = keyFor(d); const rez = podlaDna[key] ?? []
          const isObsadene = rez.length > 0; const isToday = key === dnesKey
          const isSelected = vybranyDatum === key; const isPast = key < dnesKey
          return (
            <View key={idx} style={k.cell}>
              <PressableScale
                style={[k.cellInner, isObsadene && k.cellObsadene, isToday && !isObsadene && k.cellToday, isSelected && k.cellSelected, isPast && k.cellPast]}
                scaleTo={isPast ? 1 : 0.9}
                disabled={isPast}
                onPress={() => onPick(key)}
                accessibilityLabel={`${d}. ${MESIACE_SK[mesiac]}${isObsadene ? ', obsadené' : ', voľné'}`}
              >
                <Text style={[k.dayNum, isObsadene && k.dayNumOnColor, isToday && !isObsadene && k.dayNumToday, isPast && k.dayNumPast]}>{d}</Text>
                {isObsadene && <Text style={k.casLabel} numberOfLines={1}>{rez[0].cas_od}–{rez[0].cas_do}</Text>}
              </PressableScale>
            </View>
          )
        })}
      </View>
      <View style={k.legenda}>
        <Legenda color={t.secondary} label="Voľné" k={k} />
        <Legenda color={C.brand.red} label="Obsadené" k={k} />
        <Legenda color={t.accent} label="Vybraté" k={k} />
      </View>
    </View>
  )
}

function Legenda({ color, label, k }: { color: string; label: string; k: any }) {
  return <View style={k.legRow}><View style={[k.legDot, { backgroundColor: color }]} /><Text style={k.legText}>{label}</Text></View>
}

const makeStyles = (t: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  gap: { marginBottom: spacing.md },
  infoKarta: { backgroundColor: t.secondaryLight, margin: spacing.lg, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderLeftWidth: 4, borderLeftColor: t.secondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { ...typo.body, color: t.secondaryDark, fontFamily: 'Inter_500Medium' },
  content: { padding: spacing.lg },
  sectionLabel: { ...typo.h2, color: t.text, marginTop: spacing.lg, marginBottom: spacing.md },
  label: { ...typo.captionB, color: t.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  ucelyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  ucelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: t.surface, borderWidth: 1.5, borderColor: t.border },
  ucelBtnActive: { borderColor: t.primary, backgroundColor: t.primaryLight },
  ucelBtnText: { ...typo.caption, fontFamily: 'Inter_600SemiBold', color: t.textSecondary },
  ucelBtnTextActive: { color: t.primary },
  casRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  textarea: { backgroundColor: t.surfaceAlt, borderRadius: radius.md, borderWidth: 1.5, borderColor: t.border, padding: spacing.md, minHeight: 90, ...typo.body, color: t.text },
  disclaimer: { ...typo.caption, color: t.textPlaceholder, textAlign: 'center', marginTop: spacing.md, lineHeight: 18 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl, gap: spacing.lg },
  successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: t.secondaryLight, justifyContent: 'center', alignItems: 'center' },
  successTitle: { ...typo.h1, color: t.text },
  successText: { ...typo.body, color: t.textSecondary, textAlign: 'center', lineHeight: 22 },
})

const makeKalStyles = (t: ThemeColors) => StyleSheet.create({
  box: { margin: spacing.lg, marginTop: 0, backgroundColor: t.surface, borderRadius: radius.lg, padding: spacing.md, ...shadows.sm, shadowColor: t.shadow },
  head: { paddingHorizontal: 4, marginBottom: spacing.sm },
  title: { ...typo.h3, color: t.text },
  sub: { ...typo.caption, color: t.textMuted, marginTop: 2 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: spacing.sm },
  navBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: t.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  monthTitle: { ...typo.h3, color: t.text },
  weekHeader: { flexDirection: 'row', paddingHorizontal: 2, marginBottom: 4 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: t.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, padding: 1.5 },
  cellInner: { aspectRatio: 1, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center', backgroundColor: t.secondaryLight, borderWidth: 1, borderColor: t.secondary + '40' },
  cellObsadene: { backgroundColor: C.brand.red, borderColor: C.brand.redDark },
  cellToday: { backgroundColor: t.primaryLight, borderColor: t.primary },
  cellSelected: { backgroundColor: t.accentLight, borderColor: t.accent, borderWidth: 2 },
  cellPast: { backgroundColor: t.surfaceAlt, borderColor: 'transparent', opacity: 0.5 },
  dayNum: { fontSize: 13, fontFamily: 'Inter_700Bold', color: t.secondaryDark },
  dayNumOnColor: { color: '#FFFFFF' },
  dayNumToday: { color: t.primary },
  dayNumPast: { color: t.textPlaceholder },
  casLabel: { color: '#FFFFFF', fontSize: 8, fontFamily: 'Inter_700Bold', marginTop: 1, paddingHorizontal: 2 },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', paddingTop: spacing.md, paddingBottom: 4, borderTopWidth: 1, borderTopColor: t.divider, marginTop: 4 },
  legRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legDot: { width: 10, height: 10, borderRadius: 5 },
  legText: { ...typo.micro, color: t.textSecondary },
})
