/**
 * Senior — Marta (AI referentka v zjednodušenej forme).
 *
 * Filozofia:
 *   - Žiadne malé chips, žiadne sticky stripy
 *   - Veľké, dotyk-priateľské tlačidlá rýchlych otázok
 *   - Prominentný mikrofón (zatiaľ placeholder, voice neskôr)
 *   - Veľké bubliny správ s veľkým písmom
 *   - "Otázka — Odpoveď" model, nie nekonečný chat history
 */

import { FONT_SCALES, SENIOR } from '@/constants/seniorMode'
import { useSeniorMode } from '@/hooks/useSeniorMode'
import { useTenant } from '@/src/config/tenant'
import {
  generujSessionId,
  opytajSaReferentky,
  Sprava,
  ulozKonverzaciu,
} from '@/src/lib/referentka'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
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

const MARTA_FIALOVA = '#6A1B9A'

const RYCHLE_OTAZKY = [
  { emoji: '🗑️', text: 'Kedy je zber odpadu?' },
  { emoji: '🕐', text: 'Aké sú úradné hodiny?' },
  { emoji: '📞', text: 'Aký je telefón na úrad?' },
  { emoji: '🏠', text: 'Ako prihlásiť trvalý pobyt?' },
  { emoji: '🎉', text: 'Aké podujatia budú v obci?' },
  { emoji: '📝', text: 'Ako podať žiadosť?' },
]

export default function SeniorMartaScreen() {
  const router = useRouter()
  const tenant = useTenant()
  const { fontScale } = useSeniorMode()
  const F = FONT_SCALES[fontScale]

  const [otazka, setOtazka] = useState('')
  const [aktualnaOtazka, setAktualnaOtazka] = useState<string | null>(null)
  const [odpoved, setOdpoved] = useState<string | null>(null)
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionId = useRef(generujSessionId())

  async function poslat(text: string) {
    const t = text.trim()
    if (!t || thinking) return
    setOtazka('')
    setAktualnaOtazka(t)
    setOdpoved(null)
    setError(null)
    setThinking(true)
    ulozKonverzaciu(sessionId.current, 'user', t)
    try {
      const r = await opytajSaReferentky(t, [])
      setOdpoved(r)
      ulozKonverzaciu(sessionId.current, 'assistant', r)
    } catch (e: any) {
      setError(e?.message ?? 'Neznáma chyba')
      setOdpoved(
        `Prepáčte, neviem teraz odpovedať. Zavolajte prosím na ${tenant.obecnyUrad.telefon} ` +
        `alebo napíšte na ${tenant.obecnyUrad.email}.`
      )
    } finally {
      setThinking(false)
    }
  }

  function novaOtazka() {
    setAktualnaOtazka(null)
    setOdpoved(null)
    setError(null)
    sessionId.current = generujSessionId()
  }

  function hlasovyVstup() {
    Alert.alert(
      'Hlasový vstup',
      'Hlasové ovládanie pre Martu pripravujeme. Onedlho budete môcť otázku jednoducho povedať namiesto písania.',
      [{ text: 'OK' }],
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={MARTA_FIALOVA} />

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
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={[styles.avatarText, { fontSize: F.heading }]}>🤖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { fontSize: F.heading }]}>Marta</Text>
            <Text style={[styles.headerSub, { fontSize: F.small }]}>
              AI poradkyňa — vždy k dispozícii
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Stav: 1. Žiadna otázka → ukáž rýchle otázky */}
          {!aktualnaOtazka && (
            <>
              <Text style={[styles.intro, { fontSize: F.title }]}>
                Dobrý deň! Spýtajte sa ma čokoľvek o obci.
              </Text>
              <Text style={[styles.introSub, { fontSize: F.body }]}>
                Vyberte otázku alebo napíšte vlastnú ▾
              </Text>
              <View style={styles.qaGrid}>
                {RYCHLE_OTAZKY.map(q => (
                  <TouchableOpacity
                    key={q.text}
                    style={styles.qaCard}
                    activeOpacity={0.85}
                    onPress={() => poslat(q.text)}
                    accessibilityRole="button"
                    accessibilityLabel={q.text}
                  >
                    <Text style={[styles.qaEmoji, { fontSize: F.heading }]}>{q.emoji}</Text>
                    <Text style={[styles.qaText, { fontSize: F.body }]}>{q.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Stav: 2. Otázka prebehla → ukáž otázku + odpoveď */}
          {aktualnaOtazka && (
            <>
              <View style={styles.otazkaBox}>
                <Text style={[styles.otazkaLabel, { fontSize: F.small }]}>
                  VAŠA OTÁZKA
                </Text>
                <Text style={[styles.otazkaText, { fontSize: F.title }]}>
                  {aktualnaOtazka}
                </Text>
              </View>

              {thinking ? (
                <View style={styles.thinkingBox}>
                  <ActivityIndicator size="large" color={MARTA_FIALOVA} />
                  <Text style={[styles.thinkingText, { fontSize: F.body }]}>
                    Marta premýšľa…
                  </Text>
                </View>
              ) : (
                odpoved && (
                  <>
                    <View style={styles.odpovedBox}>
                      <View style={styles.odpovedHead}>
                        <Text style={styles.odpovedAvatar}>🤖</Text>
                        <Text style={[styles.odpovedLabel, { fontSize: F.small }]}>
                          MARTA ODPOVEDÁ
                        </Text>
                      </View>
                      <Text style={[styles.odpovedText, { fontSize: F.body }]}>
                        {odpoved}
                      </Text>
                    </View>
                    {error && (
                      <Text style={[styles.errText, { fontSize: F.small }]}>
                        {error}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.novaOtazkaBtn}
                      onPress={novaOtazka}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.novaOtazkaText, { fontSize: F.body }]}>
                        ↻ Spýtať sa inú otázku
                      </Text>
                    </TouchableOpacity>
                  </>
                )
              )}
            </>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Input row */}
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.micBtn}
            onPress={hlasovyVstup}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Hlasový vstup"
          >
            <Text style={[styles.micText, { fontSize: F.heading }]}>🎤</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { fontSize: F.body, minHeight: 60 }]}
            placeholder="Napíšte otázku…"
            placeholderTextColor="#999"
            value={otazka}
            onChangeText={setOtazka}
            multiline
            editable={!thinking}
            onSubmitEditing={() => poslat(otazka)}
            returnKeyType="send"
            blurOnSubmit
            accessibilityLabel="Otázka pre Martu"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!otazka.trim() || thinking) && { backgroundColor: '#CCC' },
            ]}
            onPress={() => poslat(otazka)}
            disabled={!otazka.trim() || thinking}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Odoslať"
          >
            <Text style={styles.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SENIOR.colors.background },

  header: {
    backgroundColor: MARTA_FIALOVA,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20,
    gap: 12,
  },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { color: '#FFFFFF', fontWeight: '800' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: {},
  headerTitle: { color: '#FFFFFF', fontWeight: '900', letterSpacing: -0.3 },
  headerSub: { color: 'rgba(255,255,255,0.95)', fontWeight: '600', marginTop: 4 },

  scroll: { padding: 20, gap: 16 },

  intro: { fontWeight: '900', color: SENIOR.colors.text, letterSpacing: -0.3 },
  introSub: { color: SENIOR.colors.textSecondary, fontWeight: '600' },

  qaGrid: { gap: 14, marginTop: 8 },
  qaCard: {
    backgroundColor: '#F3E5F5',
    borderWidth: 3,
    borderColor: MARTA_FIALOVA,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 88,
  },
  qaEmoji: {},
  qaText: { color: MARTA_FIALOVA, fontWeight: '800', flex: 1 },

  otazkaBox: {
    backgroundColor: '#EEEEEE',
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 6,
    borderLeftColor: SENIOR.colors.text,
  },
  otazkaLabel: {
    fontWeight: '900', color: SENIOR.colors.textSecondary,
    letterSpacing: 0.8, marginBottom: 6,
  },
  otazkaText: { color: SENIOR.colors.text, fontWeight: '700' },

  thinkingBox: {
    backgroundColor: '#F3E5F5',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  thinkingText: { color: MARTA_FIALOVA, fontWeight: '700' },

  odpovedBox: {
    backgroundColor: MARTA_FIALOVA,
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  odpovedHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  odpovedAvatar: { fontSize: 28 },
  odpovedLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '900',
    letterSpacing: 1,
  },
  odpovedText: { color: '#FFFFFF', fontWeight: '600', lineHeight: undefined },

  errText: {
    color: SENIOR.colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },

  novaOtazkaBtn: {
    backgroundColor: '#F5F5F5',
    borderWidth: 3,
    borderColor: SENIOR.colors.text,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  novaOtazkaText: { color: SENIOR.colors.text, fontWeight: '900' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 3,
    borderTopColor: SENIOR.colors.text,
  },
  micBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#F3E5F5',
    borderWidth: 3,
    borderColor: MARTA_FIALOVA,
    justifyContent: 'center', alignItems: 'center',
  },
  micText: {},
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: SENIOR.colors.text,
    borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    color: SENIOR.colors.text,
    fontWeight: '600',
    maxHeight: 120,
  },
  sendBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: MARTA_FIALOVA,
    justifyContent: 'center', alignItems: 'center',
  },
  sendText: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: -3 },
})
