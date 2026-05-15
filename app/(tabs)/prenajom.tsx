import { AppHeader } from '@/components/AppHeader'
import { C } from '@/constants/colors'
import { supabase } from '@/src/lib/supabase'
import { useState } from 'react'
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
