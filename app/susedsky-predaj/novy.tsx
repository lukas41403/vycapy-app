/**
 * Pridať inzerát — formulár pre občanov.
 *
 * Občan zadá:
 *   - typ (Predám / Kúpim / Zadarmo / Hľadám)
 *   - kategória
 *   - názov, popis, cena (voliteľná)
 *   - meno + telefón alebo email
 *   - voliteľne fotky
 */

import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui'
import { INZERAT_KATEGORIE, INZERAT_TYPY, InzeratTyp } from '@/src/hooks/useSusedskyPredaj'
import { supabase } from '@/src/lib/supabase'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, spacing, typo } from '@/src/theme/tokens'
// Defenzívny image picker
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ImagePicker: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ImagePicker = require('expo-image-picker')
} catch { ImagePicker = null }
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

const MAX_FOTIEK = 3
const STORAGE_BUCKET = 'susedsky-predaj'

export default function NovyInzeratScreen() {
  const router = useRouter()
  const t = useThemeColors()

  const [typ, setTyp] = useState<InzeratTyp>('predam')
  const [kategoria, setKategoria] = useState<string>('ine')
  const [nazov, setNazov] = useState('')
  const [popis, setPopis] = useState('')
  const [cena, setCena] = useState('')
  const [meno, setMeno] = useState('')
  const [telefon, setTelefon] = useState('')
  const [email, setEmail] = useState('')
  const [fotky, setFotky] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [hotovo, setHotovo] = useState(false)

  const trebaCena = typ === 'predam'  // pri predaji odporúčame cenu

  async function vybratFotky() {
    if (!ImagePicker) {
      Alert.alert(
        'Foto funkcia',
        'Pre nahrávanie fotiek nainštaluj balík:\n\nnpx expo install expo-image-picker',
      )
      return
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Povolenie', 'Potrebujeme prístup k fotkám.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? 'Images',
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: MAX_FOTIEK - fotky.length,
    })
    if (!result.canceled) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const uri = result.assets.map((a: any) => a.uri)
      setFotky(prev => [...prev, ...uri].slice(0, MAX_FOTIEK))
    }
  }

  async function uploadFotky(): Promise<string[]> {
    const urls: string[] = []
    for (let i = 0; i < fotky.length; i++) {
      try {
        const fileName = `inz-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.jpg`
        const response = await fetch(fotky[i])
        const blob = await response.blob()
        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, blob, { contentType: 'image/jpeg' })
        if (!error && data) {
          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(data.path)
          urls.push(urlData.publicUrl)
        }
      } catch (e) {
        console.warn('upload fotky zlyhal:', e)
      }
    }
    return urls
  }

  async function pridatInzerat() {
    if (nazov.trim().length < 3) {
      Alert.alert('Krátky názov', 'Názov inzerátu musí mať aspoň 3 znaky.')
      return
    }
    if (meno.trim().length < 2) {
      Alert.alert('Chýba meno', 'Zadajte vaše meno alebo prezývku.')
      return
    }
    if (!telefon.trim() && !email.trim()) {
      Alert.alert('Chýba kontakt', 'Zadajte aspoň telefón alebo email aby vás kupujúci mohli kontaktovať.')
      return
    }

    setLoading(true)
    const foto_urls = fotky.length > 0 ? await uploadFotky() : []

    const cenaNum = cena.trim() ? parseFloat(cena.replace(',', '.')) : null
    const cenaValid = cenaNum != null && !isNaN(cenaNum) ? cenaNum : null

    const { error } = await supabase.from('susedsky_predaj').insert({
      typ,
      kategoria,
      nazov: nazov.trim(),
      popis: popis.trim() || null,
      cena: typ === 'zadarmo' ? null : cenaValid,
      mena: 'EUR',
      foto_urls,
      meno: meno.trim(),
      telefon: telefon.trim() || null,
      email: email.trim() || null,
      stav: 'aktivny',
      je_schvaleny: true,                                  // alebo false pre opt-in moderation
    })

    setLoading(false)
    if (error) {
      Alert.alert('Chyba', 'Inzerát sa nepodarilo pridať.\n\n' + error.message)
    } else {
      setHotovo(true)
    }
  }

  if (hotovo) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
        <View style={styles.uspechBox}>
          <Text style={styles.uspechEmoji}>🎉</Text>
          <Text style={[styles.uspechTitle, { color: t.text }]}>Inzerát pridaný!</Text>
          <Text style={[styles.uspechText, { color: t.textSecondary }]}>
            Váš inzerát je teraz viditeľný všetkým občanom obce.
            Platnosť 30 dní.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <Button title="Späť na zoznam" onPress={() => router.replace('/susedsky-predaj' as never)} />
            <Button title="Domov" variant="ghost" onPress={() => router.replace('/' as never)} />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={t.surface} />
      <AppHeader title="Pridať inzerát" subtitle="Predaj / Kúpa / Zadarmo / Hľadám" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* TYP */}
          <Text style={[styles.label, { color: t.text }]}>Typ inzerátu *</Text>
          <View style={styles.typGrid}>
            {INZERAT_TYPY.map(tt => (
              <TouchableOpacity
                key={tt.id}
                style={[
                  styles.typCard,
                  { backgroundColor: t.surface, borderColor: t.border },
                  typ === tt.id && { borderColor: tt.farba, backgroundColor: tt.farba + '15' },
                ]}
                onPress={() => setTyp(tt.id)}
                activeOpacity={0.85}
              >
                <Text style={styles.typEmoji}>{tt.emoji}</Text>
                <Text style={[styles.typLabel, { color: typ === tt.id ? tt.farba : t.text }]}>
                  {tt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* KATEGÓRIA */}
          <Text style={[styles.label, { color: t.text }]}>Kategória *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.katRow}>
            {INZERAT_KATEGORIE.map(k => (
              <TouchableOpacity
                key={k.id}
                style={[
                  styles.katBtn,
                  { backgroundColor: t.surface, borderColor: t.border },
                  kategoria === k.id && { backgroundColor: t.primaryLight, borderColor: t.primary },
                ]}
                onPress={() => setKategoria(k.id)}
              >
                <Text style={[
                  styles.katBtnText,
                  { color: t.textSecondary },
                  kategoria === k.id && { color: t.primary, fontWeight: '900' },
                ]}>
                  {k.emoji} {k.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* NÁZOV */}
          <Text style={[styles.label, { color: t.text }]}>Názov *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.text }]}
            placeholder="napr. Detský bicykel, veľkosť 24"
            placeholderTextColor={t.textPlaceholder}
            value={nazov}
            onChangeText={setNazov}
            maxLength={100}
          />

          {/* POPIS */}
          <Text style={[styles.label, { color: t.text }]}>Popis</Text>
          <TextInput
            style={[styles.input, styles.textarea, { backgroundColor: t.surface, borderColor: t.border, color: t.text }]}
            placeholder="Stav, vek, dôvod predaja, miesto vyzdvihnutia..."
            placeholderTextColor={t.textPlaceholder}
            value={popis}
            onChangeText={setPopis}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />

          {/* CENA — len pre predám */}
          {typ === 'predam' && (
            <>
              <Text style={[styles.label, { color: t.text }]}>
                Cena {trebaCena ? '(odporúčané)' : '(voliteľné)'}
              </Text>
              <View style={styles.cenaRow}>
                <TextInput
                  style={[styles.input, styles.cenaInput, { backgroundColor: t.surface, borderColor: t.border, color: t.text }]}
                  placeholder="napr. 25"
                  placeholderTextColor={t.textPlaceholder}
                  value={cena}
                  onChangeText={setCena}
                  keyboardType="decimal-pad"
                />
                <View style={[styles.menaBox, { backgroundColor: t.surfaceAlt }]}>
                  <Text style={[styles.menaText, { color: t.textSecondary }]}>EUR</Text>
                </View>
              </View>
              <Text style={[styles.hint, { color: t.textMuted }]}>
                {'Prázdna cena = „Dohodou“'}
              </Text>
            </>
          )}

          {/* FOTKY */}
          <Text style={[styles.label, { color: t.text }]}>
            Fotky (voliteľné, max {MAX_FOTIEK})
          </Text>
          <View style={styles.fotkyRow}>
            {fotky.length < MAX_FOTIEK && (
              <TouchableOpacity
                style={[styles.fotoAdd, { borderColor: t.border, backgroundColor: t.surfaceAlt }]}
                onPress={vybratFotky}
              >
                <Text style={{ fontSize: 24 }}>📷</Text>
                <Text style={[styles.fotoAddText, { color: t.textMuted }]}>Pridať</Text>
              </TouchableOpacity>
            )}
            {fotky.map((uri, i) => (
              <View key={i} style={styles.fotoWrap}>
                <Image source={{ uri }} style={styles.fotoThumb} contentFit="cover" />
                <TouchableOpacity
                  style={styles.fotoX}
                  onPress={() => setFotky(prev => prev.filter((_, j) => j !== i))}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* KONTAKT */}
          <View style={[styles.kontaktBox, { backgroundColor: t.surfaceAlt, borderLeftColor: t.primary }]}>
            <Text style={[styles.kontaktTitle, { color: t.text }]}>
              📞 Vaše kontaktné údaje
            </Text>
            <Text style={[styles.hint, { color: t.textMuted, marginBottom: spacing.sm }]}>
              Bez kontaktu vás kupujúci/predávajúci nedokážu zastihnúť.
            </Text>

            <Text style={[styles.labelMaly, { color: t.text }]}>Meno / prezývka *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.text }]}
              placeholder="napr. Peter z Hlavnej ulice"
              placeholderTextColor={t.textPlaceholder}
              value={meno}
              onChangeText={setMeno}
              maxLength={50}
            />

            <Text style={[styles.labelMaly, { color: t.text }]}>Telefón</Text>
            <TextInput
              style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.text }]}
              placeholder="0905 123 456"
              placeholderTextColor={t.textPlaceholder}
              value={telefon}
              onChangeText={setTelefon}
              keyboardType="phone-pad"
            />

            <Text style={[styles.labelMaly, { color: t.text }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.text }]}
              placeholder="meno@email.sk"
              placeholderTextColor={t.textPlaceholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* SUBMIT */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={pridatInzerat}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>🛒 Pridať inzerát</Text>}
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: t.textPlaceholder }]}>
            * Povinné polia. Inzerát platí 30 dní, potom expiruje.
            Obec môže odstrániť nevhodný obsah.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, gap: 4, paddingBottom: 40 },

  label: { ...typo.bodyB, marginTop: spacing.md, marginBottom: 8 },
  labelMaly: { fontSize: 13, fontWeight: '700', marginTop: 10, marginBottom: 6 },
  hint: { fontSize: 11, marginTop: 4 },

  typGrid: { flexDirection: 'row', gap: 8 },
  typCard: {
    flex: 1, alignItems: 'center', gap: 4,
    paddingVertical: 14, borderRadius: radius.md,
    borderWidth: 2,
  },
  typEmoji: { fontSize: 24 },
  typLabel: { fontSize: 12, fontWeight: '800' },

  katRow: { gap: 8, paddingVertical: 4 },
  katBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.pill, borderWidth: 1.5,
  },
  katBtnText: { fontSize: 12, fontWeight: '700' },

  input: {
    borderRadius: radius.md, borderWidth: 1.5,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: 15,
  },
  textarea: { minHeight: 100, paddingTop: 12 },

  cenaRow: { flexDirection: 'row', gap: 8 },
  cenaInput: { flex: 1 },
  menaBox: {
    width: 60, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  menaText: { fontSize: 14, fontWeight: '800' },

  fotkyRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  fotoAdd: {
    width: 84, height: 84, borderRadius: 12,
    borderWidth: 1.5, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  fotoAddText: { fontSize: 11, fontWeight: '700' },
  fotoWrap: { width: 84, height: 84, position: 'relative' },
  fotoThumb: { width: 84, height: 84, borderRadius: 12 },
  fotoX: {
    position: 'absolute', top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#C62828',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },

  kontaktBox: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    padding: spacing.md,
  },
  kontaktTitle: { ...typo.h3, marginBottom: 4 },

  submitBtn: {
    marginTop: spacing.lg,
    backgroundColor: '#AD1457',
    borderRadius: radius.md,
    padding: 16, alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: 8, lineHeight: 15 },

  uspechBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 12 },
  uspechEmoji: { fontSize: 64 },
  uspechTitle: { ...typo.h1, textAlign: 'center' },
  uspechText: { ...typo.body, textAlign: 'center', maxWidth: 320 },
})
