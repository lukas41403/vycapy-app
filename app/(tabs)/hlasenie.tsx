/**
 * Hlásenie porúch — formulár pre občanov. Editorial + theme-aware.
 * Foto: kamera + galéria (max 3), upload do Supabase Storage. Input/Button systém.
 */

import { AppHeader } from '@/components/AppHeader'
import { AtmosphereBackground, Badge, Button, Icon, IconName, Input, PressableScale } from '@/components/ui'
import { useTenant } from '@/src/config/tenant'
import { supabase } from '@/src/lib/supabase'
import { ThemeColors, useThemeColors } from '@/src/theme/ThemeContext'
import { fonts, radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { Image } from 'expo-image'
const ImagePicker: any = null
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const MAX_FOTIEK = 3
const STORAGE_BUCKET = 'hlaseniafotos'

/** Best-effort ikona kategórie podľa labelu (tenant dáta nemajú ikony). */
function kategoriaIcon(label: string): IconName {
  const l = label.toLowerCase()
  if (/cest|chodník|chodnik|diera/.test(l)) return 'navigate'
  if (/osvet|lamp|svetl/.test(l)) return 'bulb'
  if (/odpad|smet|sklád|sklad|kontajn/.test(l)) return 'odpady'
  if (/zele|park|strom|tráv|trav/.test(l)) return 'leaf'
  if (/vod|kanal|kanál|potok/.test(l)) return 'water'
  if (/vandal|graffiti|poškoden|poskoden/.test(l)) return 'shield'
  if (/dopr|značk|znack|semafor/.test(l)) return 'bus2'
  return 'construct'
}

export default function HlasenieScreen() {
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])
  const tenant = useTenant()
  const router = useRouter()
  const KATEGORIE = tenant.kategoriePodnetov
  const [nazov, setNazov] = useState('')
  const [kategoria, setKategoria] = useState<string | null>(null)
  const [popis, setPopis] = useState('')
  const [adresa, setAdresa] = useState('')
  const [kontakt, setKontakt] = useState('')
  const [fotky, setFotky] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingPct, setUploadingPct] = useState<number | null>(null)
  const [odoslane, setOdoslane] = useState(false)
  const [trackingId, setTrackingId] = useState<string | null>(null)

  function picker_unavailable() {
    Alert.alert('Foto funkcia', 'Pre prácu s fotkami nainštaluj balík expo-image-picker:\n\nnpx expo install expo-image-picker')
  }
  async function vyfotit() {
    if (!ImagePicker) { picker_unavailable(); return }
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Povolenie', 'Potrebujeme prístup ku kamere.'); return }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!result.canceled && result.assets[0]) setFotky(prev => [...prev, result.assets[0].uri].slice(0, MAX_FOTIEK))
  }
  async function vybratFotku() {
    if (!ImagePicker) { picker_unavailable(); return }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Povolenie', 'Potrebujeme prístup k fotkám.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.7, selectionLimit: MAX_FOTIEK - fotky.length })
    if (!result.canceled) setFotky(prev => [...prev, ...result.assets.map((a: any) => a.uri)].slice(0, MAX_FOTIEK))
  }
  function odstranFotku(i: number) { setFotky(prev => prev.filter((_, j) => j !== i)) }

  async function uploadFotiek(): Promise<string[]> {
    const urls: string[] = []
    if (fotky.length === 0) return urls
    setUploadingPct(0)
    for (let i = 0; i < fotky.length; i++) {
      try {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
        const blob = await (await fetch(fotky[i])).blob()
        const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, blob, { contentType: 'image/jpeg' })
        if (!error && data) urls.push(supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path).data.publicUrl)
      } catch (e) { console.warn('Upload fotky zlyhal:', e) }
      setUploadingPct(Math.round(((i + 1) / fotky.length) * 100))
    }
    setUploadingPct(null)
    return urls
  }

  async function odoslatHlasenie() {
    if (!kategoria) { Alert.alert('Chýba kategória', 'Prosím vyberte kategóriu podnetu.'); return }
    if (nazov.trim().length < 3) { Alert.alert('Krátky názov', 'Názov problému musí mať aspoň 3 znaky.'); return }
    if (popis.trim().length < 10) { Alert.alert('Krátky popis', 'Popis musí mať aspoň 10 znakov.'); return }
    setLoading(true)
    const fotoUrls = await uploadFotiek()
    const popisKomplet = [`**${nazov.trim()}**`, '', popis.trim(), kontakt.trim() ? `\nKontakt: ${kontakt.trim()}` : ''].join('\n').trim()
    const { data, error } = await supabase.from('hlaseniaporuchy').insert({ kategoria, popis: popisKomplet, adresa: adresa.trim() || null, foto_urls: fotoUrls.length > 0 ? fotoUrls : null, status: 'nove' }).select('id').single()
    setLoading(false)
    if (error) Alert.alert('Chyba', 'Podnet sa nepodarilo odoslať. Skúste znova.\n\n' + error.message)
    else { setTrackingId((data as any)?.id ?? null); setOdoslane(true) }
  }

  function resetForm() { setNazov(''); setKategoria(null); setPopis(''); setAdresa(''); setKontakt(''); setFotky([]); setOdoslane(false); setTrackingId(null) }

  if (odoslane) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AtmosphereBackground />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}><Icon name="checkCircle" size={56} color={t.secondary} /></View>
          <Text style={styles.successTitle}>Podnet odoslaný!</Text>
          <Text style={styles.successText}>Vaše hlásenie bolo úspešne prijaté. {tenant.obecnyUrad.nazov} ho preverí{kontakt.trim() ? ' a bude vás kontaktovať' : ' (ak ste zadali kontakt)'}.</Text>
          {trackingId && (
            <View style={styles.trackingBox}>
              <Text style={styles.trackingLabel}>VAŠE ČÍSLO PODNETU</Text>
              <Text style={styles.trackingId}>{trackingId.slice(0, 8).toUpperCase()}</Text>
              <Text style={styles.trackingHint}>Stav podnetu sledujte v aplikácii.</Text>
            </View>
          )}
          <View style={{ gap: spacing.sm, alignSelf: 'stretch', paddingHorizontal: spacing.xl }}>
            <Button title="Podať ďalší podnet" onPress={resetForm} variant="secondary" fullWidth />
            <Button title="Späť na hlavnú" onPress={() => router.push('/' as never)} variant="ghost" fullWidth />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AtmosphereBackground />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <AppHeader title="Nahlásiť podnet" subtitle="Odfoťte problém v obci a obec ho rieši" />
        <View style={styles.content}>
          <View style={styles.stepperBox}>
            <Badge label="1. KATEGÓRIA" tone="brand" />
            <Badge label="2. POPIS" tone="neutral" />
            <Badge label="3. FOTKA" tone="neutral" />
            <Badge label="4. POSLAŤ" tone="neutral" />
          </View>

          <Text style={styles.label}>Kategória podnetu *</Text>
          <View style={styles.kategorieGrid}>
            {KATEGORIE.map((k) => {
              const active = kategoria === k.id
              return (
                <PressableScale key={k.id} style={[styles.kategoriaCard, active && styles.kategoriaCardActive]} scaleTo={0.96} onPress={() => setKategoria(k.id)} accessibilityLabel={k.label}>
                  <Icon name={kategoriaIcon(k.label)} size={24} color={active ? t.primary : t.textSecondary} />
                  <Text style={[styles.kategoriaLabel, active && styles.kategoriaLabelActive]}>{k.label}</Text>
                </PressableScale>
              )
            })}
          </View>

          <Input label="Názov problému *" icon="hlasenie" placeholder="napr. Rozbitá lampa pred kostolom" value={nazov} onChangeText={setNazov} maxLength={80} containerStyle={styles.gap} />
          <Input label="Miesto / adresa" icon="location" placeholder="napr. Hlavná ulica 12, pri parku…" value={adresa} onChangeText={setAdresa} containerStyle={styles.gap} />

          <Text style={styles.label}>Popis problému *</Text>
          <TextInput style={styles.textArea} placeholder="Opíšte problém čo najpresnejšie…" placeholderTextColor={t.textPlaceholder} value={popis} onChangeText={setPopis} multiline textAlignVertical="top" />
          <Text style={styles.charCount}>{popis.length} znakov</Text>

          <Input label="Kontakt (voliteľné)" icon="kontakty" placeholder="email alebo telefón pre spätnú väzbu" value={kontakt} onChangeText={setKontakt} keyboardType="email-address" autoCapitalize="none" containerStyle={styles.gap} />
          <Text style={styles.kontaktHint}>Ak zadáte kontakt, úrad vás môže informovať o riešení.</Text>

          <Text style={styles.label}>Fotky (voliteľné, max {MAX_FOTIEK})</Text>
          <View style={styles.fotkyRow}>
            {fotky.length < MAX_FOTIEK && (
              <>
                <PressableScale style={styles.fotoBtnAdd} scaleTo={0.95} onPress={vyfotit} accessibilityLabel="Odfotiť"><Icon name="camera" size={24} color={t.textMuted} /><Text style={styles.fotoBtnText}>Odfotiť</Text></PressableScale>
                <PressableScale style={styles.fotoBtnAdd} scaleTo={0.95} onPress={vybratFotku} accessibilityLabel="Galéria"><Icon name="image" size={24} color={t.textMuted} /><Text style={styles.fotoBtnText}>Galéria</Text></PressableScale>
              </>
            )}
            {fotky.map((uri, i) => (
              <View key={i} style={styles.fotoWrap}>
                <Image source={{ uri }} style={styles.fotoThumb} contentFit="cover" />
                <PressableScale style={styles.fotoRemove} scaleTo={0.85} onPress={() => odstranFotku(i)} accessibilityLabel="Odstrániť fotku"><Icon name="close" size={12} color="#fff" /></PressableScale>
              </View>
            ))}
          </View>

          <Button
            title={uploadingPct != null ? `Nahrávam fotky… ${uploadingPct}%` : 'Odoslať hlásenie'}
            variant="primary" size="lg" fullWidth loading={loading && uploadingPct == null} onPress={odoslatHlasenie} disabled={loading}
            icon={<Icon name="send" size={16} color="#FFFFFF" />} style={{ marginTop: spacing.lg }}
          />
          <Text style={styles.disclaimer}>* Povinné polia. Hlásenie bude spracované obecným úradom do 5 pracovných dní.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (t: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  content: { padding: spacing.lg },
  gap: { marginBottom: spacing.md },
  label: { ...typo.captionB, color: t.text, marginTop: spacing.md, marginBottom: 8 },
  stepperBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },

  kategorieGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  kategoriaCard: { width: '47%', flexGrow: 1, backgroundColor: t.surface, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', gap: 6, borderWidth: 2, borderColor: t.borderLight, ...shadows.sm, shadowColor: t.shadow },
  kategoriaCardActive: { borderColor: t.primary, backgroundColor: t.primaryLight },
  kategoriaLabel: { ...typo.caption, fontFamily: 'Inter_600SemiBold', color: t.textSecondary, textAlign: 'center' },
  kategoriaLabelActive: { color: t.primary },

  textArea: { backgroundColor: t.surfaceAlt, borderRadius: radius.md, borderWidth: 1.5, borderColor: t.border, padding: spacing.md, minHeight: 110, ...typo.body, color: t.text },
  charCount: { ...typo.micro, color: t.textPlaceholder, textAlign: 'right', marginTop: 4 },

  fotkyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: 4 },
  fotoBtnAdd: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: t.surfaceAlt, borderWidth: 1.5, borderColor: t.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 4 },
  fotoBtnText: { ...typo.micro, fontFamily: 'Inter_700Bold', color: t.textMuted },
  fotoWrap: { width: 84, height: 84, position: 'relative' },
  fotoThumb: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: t.divider },
  fotoRemove: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: C_RED, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: t.surface },
  kontaktHint: { ...typo.caption, color: t.textMuted, marginTop: 4, lineHeight: 17 },
  disclaimer: { ...typo.caption, color: t.textPlaceholder, textAlign: 'center', marginTop: spacing.sm, lineHeight: 18 },

  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl, gap: spacing.lg },
  successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: t.secondaryLight, justifyContent: 'center', alignItems: 'center' },
  successTitle: { ...typo.h1, color: t.text },
  successText: { ...typo.body, color: t.textSecondary, textAlign: 'center', lineHeight: 22 },
  trackingBox: { backgroundColor: t.surfaceAlt, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', marginVertical: spacing.sm, alignSelf: 'stretch', marginHorizontal: spacing.xl, borderWidth: 1.5, borderColor: t.border, borderStyle: 'dashed' },
  trackingLabel: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: t.textMuted, letterSpacing: 1, marginBottom: 4 },
  trackingId: { fontSize: 24, fontFamily: fonts.display, color: t.primary, letterSpacing: 2, marginBottom: 6 },
  trackingHint: { ...typo.micro, color: t.textMuted, textAlign: 'center', lineHeight: 16 },
})

const C_RED = '#C62828'
