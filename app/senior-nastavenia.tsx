/**
 * Senior — Nastavenia.
 *
 * Dva bloky:
 *   1. Veľkosť písma — 3 úrovne (Stredná / Veľká / Extra veľká), tap a hneď vidieť rozdiel
 *   2. Vlastné kontakty — pridať, upraviť, odstrániť (manželka, syn, sused, lekár)
 *
 * Tlačidlo "Vypnúť senior mód" je tiež tu.
 */

import {
  CustomKontakt,
  FontScale,
  FONT_SCALES,
  FONT_SCALE_LABEL,
  formatTelefon,
  SENIOR,
} from '@/constants/seniorMode'
import { useSeniorMode } from '@/hooks/useSeniorMode'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

const EMOJI_VYBER = ['👤', '👨', '👩', '👴', '👵', '👨‍⚕️', '👩‍⚕️', '🏠', '👶', '🚑']

export default function SeniorNastaveniaScreen() {
  const router = useRouter()
  const {
    set: setSenior,
    fontScale, setFontScale,
    customKontakty, addKontakt, removeKontakt, updateKontakt,
  } = useSeniorMode()
  const F = FONT_SCALES[fontScale]

  const [editor, setEditor] = useState<{ id?: string; meno: string; telefon: string; vztah: string; emoji: string } | null>(null)

  function otvorPridanie() {
    setEditor({ meno: '', telefon: '', vztah: '', emoji: '👤' })
  }

  function otvorUpravu(k: CustomKontakt) {
    setEditor({
      id: k.id,
      meno: k.meno,
      telefon: k.telefon,
      vztah: k.vztah ?? '',
      emoji: k.emoji ?? '👤',
    })
  }

  async function ulozKontakt() {
    if (!editor) return
    if (editor.meno.trim().length < 2) {
      Alert.alert('Krátke meno', 'Meno musí mať aspoň 2 znaky.')
      return
    }
    const cisloClean = editor.telefon.replace(/\s/g, '')
    if (cisloClean.length < 3) {
      Alert.alert('Telefón', 'Zadajte platné telefónne číslo.')
      return
    }
    if (editor.id) {
      await updateKontakt(editor.id, {
        meno: editor.meno.trim(),
        telefon: cisloClean,
        vztah: editor.vztah.trim() || undefined,
        emoji: editor.emoji,
      })
    } else {
      await addKontakt({
        meno: editor.meno.trim(),
        telefon: cisloClean,
        vztah: editor.vztah.trim() || undefined,
        emoji: editor.emoji,
      })
    }
    setEditor(null)
  }

  function potvrditOdstranenie(k: CustomKontakt) {
    Alert.alert(
      'Odstrániť kontakt?',
      `${k.meno} bude odstránený zo zoznamu.`,
      [
        { text: 'Zrušiť', style: 'cancel' },
        {
          text: 'Odstrániť',
          style: 'destructive',
          onPress: () => removeKontakt(k.id),
        },
      ]
    )
  }

  function vypnutSenior() {
    Alert.alert(
      'Vypnúť senior mód?',
      'Aplikácia sa prepne do bežného zobrazenia.',
      [
        { text: 'Zrušiť', style: 'cancel' },
        {
          text: 'Vypnúť',
          onPress: async () => {
            await setSenior(false)
            router.replace('/' as never)
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Späť"
        >
          <Text style={[styles.backText, { fontSize: F.body }]}>← Späť</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: F.heading }]}>⚙ Nastavenia</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ──── Veľkosť písma ──── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: F.title }]}>
            🔤 Veľkosť písma
          </Text>
          <Text style={[styles.sectionSub, { fontSize: F.small }]}>
            Vyberte čo najlepšie vyhovuje vašim očiam.
          </Text>

          {(['medium', 'large', 'xlarge'] as FontScale[]).map(scale => {
            const active = fontScale === scale
            const preview = FONT_SCALES[scale]
            return (
              <TouchableOpacity
                key={scale}
                style={[styles.scaleCard, active && styles.scaleCardActive]}
                activeOpacity={0.85}
                onPress={() => setFontScale(scale)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={FONT_SCALE_LABEL[scale]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.scaleLabel, { fontSize: F.body }]}>
                    {FONT_SCALE_LABEL[scale]}
                  </Text>
                  <Text style={[styles.scalePreview, { fontSize: preview.body }]}>
                    Ukážka — Dobrý deň
                  </Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* ──── Vlastné kontakty ──── */}
        <View style={styles.section}>
          <View style={styles.sectionHeadRow}>
            <Text style={[styles.sectionTitle, { fontSize: F.title }]}>
              👥 Vlastné kontakty
            </Text>
          </View>
          <Text style={[styles.sectionSub, { fontSize: F.small }]}>
            Rodina, sused, osobný lekár. Budú v Kontaktoch a v SOS menu.
          </Text>

          {customKontakty.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { fontSize: F.body }]}>
                Zatiaľ nemáte vlastné kontakty.
              </Text>
            </View>
          ) : (
            customKontakty.map(k => (
              <View key={k.id} style={styles.kontaktRow}>
                <Text style={[styles.kontaktEmoji, { fontSize: F.heading }]}>
                  {k.emoji ?? '👤'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.kontaktMeno, { fontSize: F.title }]} numberOfLines={1}>
                    {k.meno}
                  </Text>
                  <Text style={[styles.kontaktTel, { fontSize: F.body }]}>
                    {formatTelefon(k.telefon)}
                  </Text>
                  {k.vztah && (
                    <Text style={[styles.kontaktVztah, { fontSize: F.small }]}>
                      {k.vztah}
                    </Text>
                  )}
                </View>
                <View style={{ gap: 8 }}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => otvorUpravu(k)}
                    accessibilityRole="button"
                    accessibilityLabel={`Upraviť ${k.meno}`}
                  >
                    <Text style={[styles.editBtnText, { fontSize: F.small }]}>UPRAVIŤ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.delBtn}
                    onPress={() => potvrditOdstranenie(k)}
                    accessibilityRole="button"
                    accessibilityLabel={`Odstrániť ${k.meno}`}
                  >
                    <Text style={[styles.delBtnText, { fontSize: F.small }]}>ZMAZAŤ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.85}
            onPress={otvorPridanie}
            accessibilityRole="button"
            accessibilityLabel="Pridať nový kontakt"
          >
            <Text style={[styles.addBtnEmoji, { fontSize: F.heading }]}>＋</Text>
            <Text style={[styles.addBtnText, { fontSize: F.body }]}>
              Pridať nový kontakt
            </Text>
          </TouchableOpacity>
        </View>

        {/* ──── Vypnúť senior mód ──── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.offBtn}
            activeOpacity={0.85}
            onPress={vypnutSenior}
          >
            <Text style={[styles.offBtnText, { fontSize: F.body }]}>
              Vypnúť senior mód
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Editor kontaktu — modal */}
      <Modal
        visible={!!editor}
        transparent
        animationType="slide"
        onRequestClose={() => setEditor(null)}
      >
        <Pressable style={editStyles.backdrop} onPress={() => setEditor(null)}>
          <Pressable style={editStyles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={editStyles.handle} />
            <Text style={[editStyles.title, { fontSize: F.heading }]}>
              {editor?.id ? 'Upraviť kontakt' : 'Nový kontakt'}
            </Text>

            <ScrollView contentContainerStyle={{ gap: 18 }}>
              {/* Emoji výber */}
              <View>
                <Text style={[editStyles.label, { fontSize: F.body }]}>Ikona</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {EMOJI_VYBER.map(e => (
                    <TouchableOpacity
                      key={e}
                      style={[
                        editStyles.emojiBtn,
                        editor?.emoji === e && editStyles.emojiBtnActive,
                      ]}
                      onPress={() => editor && setEditor({ ...editor, emoji: e })}
                    >
                      <Text style={{ fontSize: F.title }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Meno */}
              <View>
                <Text style={[editStyles.label, { fontSize: F.body }]}>Meno *</Text>
                <TextInput
                  style={[editStyles.input, { fontSize: F.body }]}
                  placeholder="napr. Syn Peter"
                  placeholderTextColor="#999"
                  value={editor?.meno}
                  onChangeText={v => editor && setEditor({ ...editor, meno: v })}
                />
              </View>

              {/* Vzťah */}
              <View>
                <Text style={[editStyles.label, { fontSize: F.body }]}>Vzťah (voliteľné)</Text>
                <TextInput
                  style={[editStyles.input, { fontSize: F.body }]}
                  placeholder="syn, dcéra, sused, lekár…"
                  placeholderTextColor="#999"
                  value={editor?.vztah}
                  onChangeText={v => editor && setEditor({ ...editor, vztah: v })}
                />
              </View>

              {/* Telefón */}
              <View>
                <Text style={[editStyles.label, { fontSize: F.body }]}>Telefón *</Text>
                <TextInput
                  style={[editStyles.input, { fontSize: F.title, letterSpacing: 1 }]}
                  placeholder="0905 123 456"
                  placeholderTextColor="#999"
                  value={editor?.telefon}
                  onChangeText={v => editor && setEditor({ ...editor, telefon: v })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  style={[editStyles.btn, editStyles.btnCancel]}
                  onPress={() => setEditor(null)}
                >
                  <Text style={[editStyles.btnText, { fontSize: F.body, color: SENIOR.colors.text }]}>
                    Zrušiť
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[editStyles.btn, editStyles.btnSave]}
                  onPress={ulozKontakt}
                >
                  <Text style={[editStyles.btnText, { fontSize: F.body, color: '#FFFFFF' }]}>
                    Uložiť
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SENIOR.colors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    borderBottomWidth: 3, borderBottomColor: SENIOR.colors.text,
    gap: 8,
  },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { color: SENIOR.colors.primary, fontWeight: '800' },
  title: { fontWeight: '900', color: SENIOR.colors.text },

  scroll: { padding: 20, gap: 28 },

  section: { gap: 14 },
  sectionHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontWeight: '900', color: SENIOR.colors.text, letterSpacing: -0.2 },
  sectionSub: { color: SENIOR.colors.textSecondary, fontWeight: '600', marginTop: -4 },

  // Font scale cards
  scaleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 3,
    borderColor: SENIOR.colors.text,
    paddingHorizontal: 18, paddingVertical: 16,
    gap: 12,
  },
  scaleCardActive: {
    backgroundColor: '#FFEBEE',
    borderColor: SENIOR.colors.primary,
    borderWidth: 4,
  },
  scaleLabel: { fontWeight: '900', color: SENIOR.colors.text },
  scalePreview: { color: SENIOR.colors.textSecondary, fontWeight: '600', marginTop: 6 },
  radio: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 3, borderColor: SENIOR.colors.text,
    justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: SENIOR.colors.primary },
  radioInner: { width: 16, height: 16, borderRadius: 8, backgroundColor: SENIOR.colors.primary },

  // Empty
  empty: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: SENIOR.colors.borderLight,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  emptyText: { color: SENIOR.colors.textSecondary, fontWeight: '600' },

  // Kontakt row
  kontaktRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 3,
    borderColor: SENIOR.colors.text,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  kontaktEmoji: {},
  kontaktMeno: { fontWeight: '900', color: SENIOR.colors.text },
  kontaktTel: { color: SENIOR.colors.text, fontWeight: '700', marginTop: 4 },
  kontaktVztah: { color: SENIOR.colors.textSecondary, fontWeight: '600', marginTop: 2 },
  editBtn: {
    backgroundColor: SENIOR.colors.accent,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, minWidth: 78, alignItems: 'center',
  },
  editBtnText: { color: '#FFFFFF', fontWeight: '900' },
  delBtn: {
    backgroundColor: '#FFCDD2',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, minWidth: 78, alignItems: 'center',
    borderWidth: 2, borderColor: SENIOR.colors.primary,
  },
  delBtnText: { color: SENIOR.colors.primary, fontWeight: '900' },

  // Pridať kontakt
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: SENIOR.colors.success,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  addBtnEmoji: { color: '#FFFFFF', fontWeight: '900' },
  addBtnText: { color: '#FFFFFF', fontWeight: '900' },

  // Vypnúť
  offBtn: {
    backgroundColor: '#F5F5F5',
    borderWidth: 3,
    borderColor: SENIOR.colors.text,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  offBtnText: { color: SENIOR.colors.text, fontWeight: '900' },
})

const editStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
    maxHeight: '90%',
  },
  handle: {
    width: 48, height: 5,
    backgroundColor: '#CCC',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: { fontWeight: '900', color: SENIOR.colors.text, marginBottom: 18, textAlign: 'center' },
  label: { fontWeight: '800', color: SENIOR.colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: SENIOR.colors.text,
    borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    color: SENIOR.colors.text,
    fontWeight: '600',
  },
  emojiBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#F5F5F5',
    borderWidth: 2, borderColor: '#DDD',
    justifyContent: 'center', alignItems: 'center',
  },
  emojiBtnActive: {
    backgroundColor: '#FFEBEE',
    borderColor: SENIOR.colors.primary,
    borderWidth: 3,
  },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: '#EEEEEE',
    borderWidth: 2,
    borderColor: SENIOR.colors.borderLight,
  },
  btnSave: { backgroundColor: SENIOR.colors.success },
  btnText: { fontWeight: '900' },
})
