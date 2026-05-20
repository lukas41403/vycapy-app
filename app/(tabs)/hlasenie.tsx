/**
 * Hlásenie porúch — formulár pre občanov.
 * Pridáva fotky: kamera + galéria, max 3 fotky, upload do Supabase Storage
 * bucket `hlaseniafotos`.
 *
 * Závislosť:
 *   npx expo install expo-image-picker expo-media-library
 */

import { AppHeader } from '@/components/AppHeader'
import { C } from '@/constants/colors'
import { supabase } from '@/src/lib/supabase'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
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

const MAX_FOTIEK = 3
const STORAGE_BUCKET = 'hlaseniafotos'

export default function HlasenieScreen() {
  const [kategoria, setKategoria] = useState<string | null>(null)
  const [popis, setPopis] = useState('')
  const [adresa, setAdresa] = useState('')
  const [fotky, setFotky] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingPct, setUploadingPct] = useState<number | null>(null)
  const [odoslane, setOdoslane] = useState(false)

  // ── Foto handlery ─────────────────────────────────────────────────────────
  async function vyfotit() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Povolenie', 'Potrebujeme prístup ku kamere.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!result.canceled && result.assets[0]) {
      setFotky(prev => [...prev, result.assets[0].uri].slice(0, MAX_FOTIEK))
    }
  }

  async function vybratFotku() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Povolenie', 'Potrebujeme prístup k fotkám.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: MAX_FOTIEK - fotky.length,
    })
    if (!result.canceled) {
      const uri = result.assets.map(a => a.uri)
      setFotky(prev => [...prev, ...uri].slice(0, MAX_FOTIEK))
    }
  }

  function odstranFotku(i: number) {
    setFotky(prev => prev.filter((_, j) => j !== i))
  }

  // ── Upload do Supabase Storage ────────────────────────────────────────────
  async function uploadFotiek(): Promise<string[]> {
    const urls: string[] = []
    if (fotky.length === 0) return urls

    setUploadingPct(0)
    for (let i = 0; i < fotky.length; i++) {
      const uri = fotky[i]
      try {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
        const response = await fetch(uri)
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
        console.warn('Upload fotky zlyhal:', e)
      }
      setUploadingPct(Math.round(((i + 1) / fotky.length) * 100))
    }
    setUploadingPct(null)
    return urls
  }

  // ── Odoslanie hlásenia ────────────────────────────────────────────────────
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

    const fotoUrls = await uploadFotiek()

    const { error } = await supabase
      .from('hlaseniaporuchy')
      .insert({
        kategoria,
        popis: popis.trim(),
        adresa: adresa.trim() || null,
        foto_urls: fotoUrls.length > 0 ? fotoUrls : null,
        status: 'nove',
      })

    setLoading(false)

    if (error) {
      Alert.alert('Chyba', 'Hlásenie sa nepodarilo odoslať. Skúste znova.\n\n' + error.message)
    } else {
      setOdoslane(true)
    }
  }

  function resetForm() {
    setKategoria(null)
    setPopis('')
    setAdresa('')
    setFotky([])
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

        <AppHeader title="Hlásenie porúch" subtitle="Nahláste problém obecnému úradu" />

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

          {/* FOTKY */}
          <Text style={styles.label}>Fotky (voliteľné, max {MAX_FOTIEK})</Text>
          <View style={styles.fotkyRow}>
            {fotky.length < MAX_FOTIEK && (
              <>
                <TouchableOpacity style={styles.fotoBtnAdd} onPress={vyfotit}>
                  <Text style={styles.fotoBtnIcon}>📷</Text>
                  <Text style={styles.fotoBtnText}>Odfotiť</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fotoBtnAdd} onPress={vybratFotku}>
                  <Text style={styles.fotoBtnIcon}>🖼️</Text>
                  <Text style={styles.fotoBtnText}>Galéria</Text>
                </TouchableOpacity>
              </>
            )}
            {fotky.map((uri, i) => (
              <View key={i} style={styles.fotoWrap}>
                <Image source={{ uri }} style={styles.fotoThumb} contentFit="cover" />
                <TouchableOpacity style={styles.fotoRemove} onPress={() => odstranFotku(i)}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {fotky.length > 0 && (
            <Text style={styles.fotoHint}>Pridaná fotka — krížik vpravo hore ju odstráni.</Text>
          )}

          {/* ODOSLAŤ */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={odoslatHlasenie}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color={C.onPrimary} />
                {uploadingPct != null && (
                  <Text style={{ color: C.onPrimary, fontWeight: '700' }}>
                    Nahrávam fotky… {uploadingPct}%
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.submitBtnText}>Odoslať hlásenie</Text>
            )}
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

  kategorieGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
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
  kategoriaCardActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  kategoriaEmoji: { fontSize: 28 },
  kategoriaLabel: { fontSize: 12, fontWeight: '600', color: C.textSecondary, textAlign: 'center' },
  kategoriaLabelActive: { color: C.primary },

  input: {
    backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    padding: 14, fontSize: 15, color: C.text,
  },
  textArea: { height: 120, paddingTop: 14 },
  charCount: { fontSize: 12, color: C.textPlaceholder, textAlign: 'right', marginTop: 4 },

  // Fotky
  fotkyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  fotoBtnAdd: {
    width: 84, height: 84, borderRadius: 12,
    backgroundColor: C.surfaceAlt, borderWidth: 1.5,
    borderColor: C.border, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  fotoBtnIcon: { fontSize: 24 },
  fotoBtnText: { fontSize: 11, fontWeight: '700', color: C.textMuted },
  fotoWrap: { width: 84, height: 84, position: 'relative' },
  fotoThumb: {
    width: 84, height: 84, borderRadius: 12,
    backgroundColor: C.divider,
  },
  fotoRemove: {
    position: 'absolute', top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.brand.red,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.surface,
  },
  fotoHint: { fontSize: 11, color: C.textPlaceholder, marginTop: 4 },

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
