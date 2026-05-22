import { AppHeader } from '@/components/AppHeader'
import { C } from '@/constants/colors'
import { supabase } from '@/src/lib/supabase'
import { useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator, Alert, SafeAreaView, ScrollView,
    StatusBar, StyleSheet, Text, TextInput,
    TouchableOpacity, View,
} from 'react-native'

const UCELY = [
  { id: 'sport', label: '⚽ Šport / tréning' },
  { id: 'kultura', label: '🎭 Kultúrna akcia' },
  { id: 'oslava', label: '🎉 Oslava / party' },
  { id: 'firemne', label: '💼 Firemné podujatie' },
  { id: 'ine', label: '📋 Iné' },
]

type Rezervacia = {
  id: string
  datum: string       // YYYY-MM-DD
  cas_od: string      // HH:MM
  cas_do: string      // HH:MM
  ucel: string
  status?: string | null
}

const MESIACE_SK = [
  'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December',
]

export default function PrenajomScreen() {
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

  // Voľný kalendár — schválené rezervácie
  const [rezervacie, setRezervacie] = useState<Rezervacia[]>([])
  useEffect(() => {
    async function fetchRezervacie() {
      const dnes = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('prenajom_haly')
        .select('id, datum, cas_od, cas_do, ucel, status')
        .eq('status', 'schvalene')
        .gte('datum', dnes)
        .order('datum', { ascending: true })
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
      meno: meno.trim(),
      email: email.trim(),
      telefon: telefon.trim(),
      datum,
      cas_od: casOd,
      cas_do: casDo,
      ucel,
      pocet_osob: pocetOsob ? parseInt(pocetOsob) : null,
      poznamka: poznamka.trim() || null,
    })
    setLoading(false)

    if (error) {
      Alert.alert('Chyba', 'Žiadosť sa nepodarilo odoslať.')
    } else {
      setOdoslane(true)
    }
  }

  if (odoslane) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successTitle}>Žiadosť odoslaná!</Text>
          <Text style={styles.successText}>
            Vaša žiadosť o prenájom bola prijatá. Obecný úrad vás bude kontaktovať do 3 pracovných dní na zadaný email alebo telefón.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={() => {
            setOdoslane(false)
            setMeno(''); setEmail(''); setTelefon('')
            setDatum(''); setCasOd(''); setCasDo('')
            setUcel(''); setPocetOsob(''); setPoznamka('')
          }}>
            <Text style={styles.resetBtnText}>Nová žiadosť</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <ScrollView showsVerticalScrollIndicator={false}>

        <AppHeader title="Prenájom haly" subtitle="Športová hala Výčapy-Opatovce" />

        {/* INFO KARTA */}
        <View style={styles.infoKarta}>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>📍</Text>
            <Text style={styles.infoText}>Športová hala, Výčapy-Opatovce</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>⏰</Text>
            <Text style={styles.infoText}>Dostupná: Po–Ne, 8:00–22:00</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>👥</Text>
            <Text style={styles.infoText}>Kapacita: až 200 osôb</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>💶</Text>
            <Text style={styles.infoText}>Cena: od 15€/hod (pre obyvateľov obce)</Text>
          </View>
        </View>

        {/* VOĽNÝ KALENDÁR */}
        <KalendarObsadenosti
          rezervacie={rezervacie}
          vybranyDatum={datum}
          onPick={(iso) => setDatum(iso)}
        />

        <View style={styles.content}>

          {/* ÚČEL */}
          <Text style={styles.label}>Účel prenájmu *</Text>
          <View style={styles.ucelyGrid}>
            {UCELY.map(u => (
              <TouchableOpacity
                key={u.id}
                style={[styles.ucelBtn, ucel === u.id && styles.ucelBtnActive]}
                onPress={() => setUcel(u.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.ucelBtnText, ucel === u.id && styles.ucelBtnTextActive]}>
                  {u.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* KONTAKT */}
          <Text style={styles.sectionLabel}>Kontaktné údaje</Text>

          <Text style={styles.label}>Meno a priezvisko *</Text>
          <TextInput style={styles.input} placeholder="Ján Novák" placeholderTextColor={C.textPlaceholder}
            value={meno} onChangeText={setMeno} />

          <Text style={styles.label}>Email *</Text>
          <TextInput style={styles.input} placeholder="jan.novak@email.sk" placeholderTextColor={C.textPlaceholder}
            value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

          <Text style={styles.label}>Telefón *</Text>
          <TextInput style={styles.input} placeholder="+421 900 000 000" placeholderTextColor={C.textPlaceholder}
            value={telefon} onChangeText={setTelefon} keyboardType="phone-pad" />

          {/* TERMÍN */}
          <Text style={styles.sectionLabel}>Termín prenájmu</Text>

          <Text style={styles.label}>Dátum * (RRRR-MM-DD)</Text>
          <TextInput style={styles.input} placeholder="napr. 2026-06-15" placeholderTextColor={C.textPlaceholder}
            value={datum} onChangeText={setDatum} />

          <View style={styles.casRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Od *</Text>
              <TextInput style={styles.input} placeholder="08:00" placeholderTextColor={C.textPlaceholder}
                value={casOd} onChangeText={setCasOd} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Do *</Text>
              <TextInput style={styles.input} placeholder="10:00" placeholderTextColor={C.textPlaceholder}
                value={casDo} onChangeText={setCasDo} />
            </View>
          </View>

          <Text style={styles.label}>Počet osôb</Text>
          <TextInput style={styles.input} placeholder="napr. 30" placeholderTextColor={C.textPlaceholder}
            value={pocetOsob} onChangeText={setPocetOsob} keyboardType="number-pad" />

          <Text style={styles.label}>Poznámka</Text>
          <TextInput style={[styles.input, { height: 100 }]}
            placeholder="Doplňujúce informácie..."
            placeholderTextColor={C.textPlaceholder}
            value={poznamka} onChangeText={setPoznamka}
            multiline textAlignVertical="top" />

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={odoslatZiadost}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={C.onPrimary} />
              : <Text style={styles.submitBtnText}>Odoslať žiadosť o prenájom</Text>
            }
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            * Povinné polia. Po odoslaní vás budeme kontaktovať do 3 pracovných dní.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Kalendár obsadenosti haly ──────────────────────────────────────────────
function KalendarObsadenosti({
  rezervacie,
  vybranyDatum,
  onPick,
}: {
  rezervacie: Rezervacia[]
  vybranyDatum: string
  onPick: (iso: string) => void
}) {
  const [zobrazeny, setZobrazeny] = useState(new Date())

  // Group rezervacie po dni
  const podlaDna = useMemo(() => {
    const m: Record<string, Rezervacia[]> = {}
    rezervacie.forEach(r => {
      if (!m[r.datum]) m[r.datum] = []
      m[r.datum].push(r)
    })
    return m
  }, [rezervacie])

  const rok = zobrazeny.getFullYear()
  const mesiac = zobrazeny.getMonth()
  const prvyDen = new Date(rok, mesiac, 1)
  const dniVMesiaci = new Date(rok, mesiac + 1, 0).getDate()
  const startDay = (prvyDen.getDay() + 6) % 7
  const dnes = new Date()
  const dnesKey = dnes.toISOString().split('T')[0]

  function keyFor(d: number) {
    // Lokálny dátum bez UTC offsetu
    const mm = String(mesiac + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return `${rok}-${mm}-${dd}`
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= dniVMesiaci; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const obsadenoVMesiaci = Object.entries(podlaDna).filter(([key]) => {
    const d = new Date(key)
    return d.getFullYear() === rok && d.getMonth() === mesiac
  }).length

  return (
    <View style={kalStyles.box}>
      {/* Header */}
      <View style={kalStyles.head}>
        <Text style={kalStyles.title}>📅 Voľný kalendár haly</Text>
        <Text style={kalStyles.sub}>
          {obsadenoVMesiaci === 0
            ? 'V tomto mesiaci sú všetky dni voľné'
            : `Obsadených dní v mesiaci: ${obsadenoVMesiaci}`}
        </Text>
      </View>

      {/* Mesiac navigátor */}
      <View style={kalStyles.nav}>
        <TouchableOpacity
          style={kalStyles.navBtn}
          onPress={() => setZobrazeny(new Date(rok, mesiac - 1, 1))}
        >
          <Text style={kalStyles.navTxt}>←</Text>
        </TouchableOpacity>
        <Text style={kalStyles.monthTitle}>{MESIACE_SK[mesiac]} {rok}</Text>
        <TouchableOpacity
          style={kalStyles.navBtn}
          onPress={() => setZobrazeny(new Date(rok, mesiac + 1, 1))}
        >
          <Text style={kalStyles.navTxt}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Dni hlavička */}
      <View style={kalStyles.weekHeader}>
        {['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'].map(d => (
          <Text key={d} style={kalStyles.weekDay}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      <View style={kalStyles.grid}>
        {cells.map((d, idx) => {
          if (d === null) return <View key={idx} style={kalStyles.cell} />
          const key = keyFor(d)
          const rez = podlaDna[key] ?? []
          const isObsadene = rez.length > 0
          const isToday = key === dnesKey
          const isSelected = vybranyDatum === key
          const isPast = key < dnesKey
          return (
            <View key={idx} style={kalStyles.cell}>
              <TouchableOpacity
                style={[
                  kalStyles.cellInner,
                  isObsadene && kalStyles.cellObsadene,
                  isToday && !isObsadene && kalStyles.cellToday,
                  isSelected && kalStyles.cellSelected,
                  isPast && kalStyles.cellPast,
                ]}
                activeOpacity={isPast ? 1 : 0.7}
                disabled={isPast}
                onPress={() => onPick(key)}
              >
                <Text style={[
                  kalStyles.dayNum,
                  isObsadene && kalStyles.dayNumOnColor,
                  isToday && !isObsadene && kalStyles.dayNumToday,
                  isPast && kalStyles.dayNumPast,
                ]}>
                  {d}
                </Text>
                {isObsadene && (
                  <Text style={kalStyles.casLabel} numberOfLines={1}>
                    {rez[0].cas_od}–{rez[0].cas_do}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )
        })}
      </View>

      {/* Legenda */}
      <View style={kalStyles.legenda}>
        <LegendaItem color={C.secondary} label="Voľné" />
        <LegendaItem color={C.brand.red} label="Obsadené" />
        <LegendaItem color={C.accent} label="Vybraté" />
      </View>

      {/* Hint */}
      <Text style={kalStyles.hint}>
        💡 Klikni na voľný deň pre predvyplnenie do formulára nižšie.
      </Text>
    </View>
  )
}

function LegendaItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={kalStyles.legRow}>
      <View style={[kalStyles.legDot, { backgroundColor: color }]} />
      <Text style={kalStyles.legText}>{label}</Text>
    </View>
  )
}

const kalStyles = StyleSheet.create({
  box: {
    margin: 16, marginTop: 0,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 12,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  head: { paddingHorizontal: 4, marginBottom: 8 },
  title: { fontSize: 15, fontWeight: '800', color: C.text },
  sub: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4, marginBottom: 8,
  },
  navBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.surfaceAlt,
    justifyContent: 'center', alignItems: 'center',
  },
  navTxt: { fontSize: 16, fontWeight: '900', color: C.primary },
  monthTitle: { fontSize: 15, fontWeight: '800', color: C.text },

  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  weekDay: {
    flex: 1, textAlign: 'center',
    fontSize: 11, fontWeight: '800', color: C.textSecondary,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    padding: 1.5,
  },
  cellInner: {
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.secondaryLight,
    borderWidth: 1,
    borderColor: C.secondary + '40',
  },
  cellObsadene: {
    backgroundColor: C.brand.red,
    borderColor: C.brand.redDark,
  },
  cellToday: {
    backgroundColor: C.primaryLight,
    borderColor: C.primary,
  },
  cellSelected: {
    backgroundColor: C.accentLight,
    borderColor: C.accent,
    borderWidth: 2,
  },
  cellPast: {
    backgroundColor: C.surfaceAlt,
    borderColor: 'transparent',
    opacity: 0.5,
  },
  dayNum: {
    fontSize: 13, fontWeight: '700', color: C.secondaryDark,
  },
  dayNumOnColor: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  dayNumToday: { color: C.primary, fontWeight: '900' },
  dayNumPast: { color: C.textPlaceholder },
  casLabel: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
    paddingHorizontal: 2,
  },

  legenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    marginTop: 4,
  },
  legRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legDot: { width: 10, height: 10, borderRadius: 5 },
  legText: { fontSize: 11, color: C.textSecondary, fontWeight: '600' },

  hint: {
    fontSize: 11, color: C.textMuted,
    textAlign: 'center', marginTop: 8, lineHeight: 16,
  },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  infoKarta: {
    backgroundColor: C.secondaryLight, margin: 16, borderRadius: 14,
    padding: 16, gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: C.secondary,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoEmoji: { fontSize: 16 },
  infoText: { fontSize: 14, color: C.secondaryDark, fontWeight: '500' },
  content: { padding: 16, gap: 4 },
  sectionLabel: {
    fontSize: 16, fontWeight: '800', color: C.text,
    marginTop: 16, marginBottom: 8,
  },
  label: { fontSize: 13, fontWeight: '700', color: C.textSecondary, marginBottom: 8, marginTop: 8 },
  ucelyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  ucelBtn: {
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border,
  },
  ucelBtnActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  ucelBtnText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  ucelBtnTextActive: { color: C.primary, fontWeight: '700' },
  input: {
    backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    padding: 14, fontSize: 15, color: C.text,
  },
  casRow: { flexDirection: 'row', gap: 12 },
  submitBtn: {
    backgroundColor: C.primary, borderRadius: 14,
    padding: 18, alignItems: 'center', marginTop: 16,
  },
  submitBtnText: { color: C.onPrimary, fontSize: 16, fontWeight: '700' },
  disclaimer: { fontSize: 12, color: C.textPlaceholder, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
  successEmoji: { fontSize: 64 },
  successTitle: { fontSize: 24, fontWeight: '800', color: C.text },
  successText: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
  resetBtn: {
    backgroundColor: C.secondary, borderRadius: 14,
    paddingHorizontal: 32, paddingVertical: 16, marginTop: 8,
  },
  resetBtnText: { color: C.onPrimary, fontSize: 15, fontWeight: '700' },
})
