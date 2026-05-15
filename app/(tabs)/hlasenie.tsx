import { AppHeader } from '@/components/AppHeader'
import { C } from '@/constants/colors'
import { supabase } from '@/src/lib/supabase'
import { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View,
} from 'react-native'

const KATEGORIE = [
  { id: 'cesta', label: 'Cesta / chodník', emoji: '🛣️' },
  { id: 'osvietenie', label: 'Verejné osvetlenie', emoji: '💡' },
  { id: 'zelen', label: 'Zeleň / stromy', emoji: '🌳' },
  { id: 'voda', label: 'Voda / kanalizácia', emoji: '💧' },
  { id: 'odpad', label: 'Odpad / kontajnery', emoji: '🗑️' },
  { id: 'ine', label: 'Iné', emoji: '📋' },
]

export default function HlasenieScreen() {
  const [kategoria, setKategoria] = useState<string | null>(null)
  const [popis, setPopis] = useState('')
  const [adresa, setAdresa] = useState('')
  const [loading, setLoading] = useState(false)
  const [odoslane, setOdoslane] = useState(false)

  async function odoslatHlasenie() {
    if (!kategoria) {
      Alert.alert('Chýba kategória', 'Prosím vyberte kategóriu poruchy.')
      return
    }
    if (popis.trim().length < 10) {
      Alert.alert('Krátky popis', 'Popis musí mať aspoň 10 znakov.')
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('hlaseniaporuchy')
      .insert({
        kategoria,
        popis: popis.trim(),
        adresa: adresa.trim() || null,
        status: 'nove',
      })

    setLoading(false)

    if (error) {
      Alert.alert('Chyba', 'Hlásenie sa nepodarilo odoslať. Skúste znova.')
    } else {
      setOdoslane(true)
    }
  }

  function resetForm() {
    setKategoria(null)
    setPopis('')
    setAdresa('')
    setOdoslane(false)
  }

  if (odoslane) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successTitle}>Hlásenie odoslané!</Text>
          <Text style={styles.successText}>
            Vaše hlásenie bolo úspešne prijaté. Obecný úrad ho preverí a bude vás kontaktovať.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={resetForm}>
            <Text style={styles.resetBtnText}>Podať ďalšie hlásenie</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <ScrollView showsVerticalScrollIndicator={false}>

        <AppHeader
          title="Hlásenie porúch"
          subtitle="Nahláste problém obecnému úradu"
        />

        <View style={styles.content}>

          {/* KATEGÓRIA */}
          <Text style={styles.label}>Kategória poruchy *</Text>
          <View style={styles.kategorieGrid}>
            {KATEGORIE.map((k) => (
              <TouchableOpacity
                key={k.id}
                style={[styles.kategoriaCard, kategoria === k.id && styles.kategoriaCardActive]}
                onPress={() => setKategoria(k.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.kategoriaEmoji}>{k.emoji}</Text>
                <Text style={[styles.kategoriaLabel, kategoria === k.id && styles.kategoriaLabelActive]}>
                  {k.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ADRESA */}
          <Text style={styles.label}>Miesto / adresa</Text>
          <TextInput
            style={styles.input}
            placeholder="napr. Hlavná ulica 12, pri parku..."
            placeholderTextColor={C.textPlaceholder}
            value={adresa}
            onChangeText={setAdresa}
          />

          {/* POPIS */}
          <Text style={styles.label}>Popis poruchy *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Opíšte problém čo najpresnejšie..."
            placeholderTextColor={C.textPlaceholder}
            value={popis}
            onChangeText={setPopis}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{popis.length} znakov</Text>

          {/* ODOSLAŤ */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={odoslatHlasenie}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={C.onPrimary} />
              : <Text style={styles.submitBtnText}>Odoslať hlásenie</Text>
            }
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            * Povinné polia. Hlásenie bude spracované obecným úradom do 5 pracovných dní.
          </Text>

        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: C.text, marginTop: 12, marginBottom: 8 },

  kategorieGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kategoriaCard: {
    width: '47%',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: C.borderLight,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  kategoriaCardActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryLight,
  },
  kategoriaEmoji: { fontSize: 28 },
  kategoriaLabel: { fontSize: 12, fontWeight: '600', color: C.textSecondary, textAlign: 'center' },
  kategoriaLabelActive: { color: C.primary },

  input: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 14,
    fontSize: 15,
    color: C.text,
  },
  textArea: { height: 120, paddingTop: 14 },
  charCount: { fontSize: 12, color: C.textPlaceholder, textAlign: 'right', marginTop: 4 },

  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: C.onPrimary, fontSize: 16, fontWeight: '700' },

  disclaimer: { fontSize: 12, color: C.textPlaceholder, textAlign: 'center', marginTop: 8, lineHeight: 18 },

  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
  successEmoji: { fontSize: 64 },
  successTitle: { fontSize: 24, fontWeight: '800', color: C.text },
  successText: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
  resetBtn: {
    backgroundColor: C.secondary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginTop: 8,
  },
  resetBtnText: { color: C.onPrimary, fontSize: 15, fontWeight: '700' },
})
