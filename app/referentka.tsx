/**
 * AI Referentka Marta — chat UI.
 *
 * Štruktúra:
 *   Header (fialový) — 🤖 Marta · ● Online 24/7
 *   ScrollView správ (auto-scroll na koniec)
 *     - asistentka vľavo (sivá bublina)
 *     - používateľ vpravo (červená bublina)
 *     - loading: tri bodky animácia
 *   Rýchle otázky (chips)
 *   Input + Odoslať
 */

import { C } from '@/constants/colors'
import {
    generujSessionId,
    opytajSaReferentky,
    Sprava,
    ulozKonverzaciu,
} from '@/src/lib/referentka'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
    Animated,
    Easing,
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

const REFERENTKA_FIALOVA = '#6A1B9A'
const REFERENTKA_LIGHT = '#F3E5F5'

const RYCHLE_OTAZKY = [
  'Kedy je úrad otvorený?',
  'Ako sa prihlásim na trvalý pobyt?',
  'Kedy vyvážajú odpad?',
  'Telefón na starostu?',
  'Ako prenajmem halu?',
  'Kedy hrá FC Výčapy?',
]

const UVODNA_SPRAVA: Sprava = {
  rola: 'assistant',
  obsah:
    'Dobrý deň! Som Marta, vaša AI referentka Obecného úradu Výčapy-Opatovce. Som tu 24 hodín denne a rada vám pomôžem. S čím vám môžem pomôcť?',
}

export default function ReferentkaScreen() {
  const router = useRouter()
  const [spravy, setSpravy] = useState<Sprava[]>([UVODNA_SPRAVA])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [chyba, setChyba] = useState<string | null>(null)
  const scrollRef = useRef<ScrollView>(null)
  const sessionId = useRef(generujSessionId())

  // Auto-scroll na koniec pri novej správe
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
  }, [spravy, thinking])

  async function poslat(text: string) {
    const trimnute = text.trim()
    if (!trimnute || thinking) return

    const userSprava: Sprava = { rola: 'user', obsah: trimnute }
    const noveSpravy = [...spravy, userSprava]
    setSpravy(noveSpravy)
    setInput('')
    setThinking(true)
    setChyba(null)

    // Uložiť user správu do DB (best-effort)
    ulozKonverzaciu(sessionId.current, 'user', trimnute)

    // História pre API — bez prvej úvodnej (vzhľadom k tomu že
    // už je v system prompte typicky); ale aj tak ju pošleme,
    // Anthropic akceptuje úvodnú assistant správu.
    const historia = spravy.filter(s => s !== UVODNA_SPRAVA || spravy[0] === UVODNA_SPRAVA)

    try {
      const odpoved = await opytajSaReferentky(trimnute, historia)
      const martaSprava: Sprava = { rola: 'assistant', obsah: odpoved }
      setSpravy(prev => [...prev, martaSprava])
      ulozKonverzaciu(sessionId.current, 'assistant', odpoved)
    } catch (e: any) {
      setChyba(e?.message ?? 'Neznáma chyba')
      setSpravy(prev => [
        ...prev,
        {
          rola: 'assistant',
          obsah:
            '⚠️ Prepáčte, momentálne vás neviem obslúžiť. Skúste prosím neskôr alebo kontaktujte úrad priamo: 037 / 77 951 51 alebo info@vycapy-opatovce.sk.',
        },
      ])
    } finally {
      setThinking(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={REFERENTKA_FIALOVA} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Späť</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Marta — AI referentka</Text>
            <Text style={styles.headerSub}>Obecný úrad Výčapy-Opatovce</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online 24/7</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Chat */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chat}
          showsVerticalScrollIndicator={false}
        >
          {spravy.map((s, i) => (
            <Bublina key={i} sprava={s} />
          ))}
          {thinking && <TypingIndicator />}

          {/* Rýchle otázky — len pri prvej správe (uvod) alebo po reseta */}
          {spravy.length <= 1 && !thinking && (
            <View style={styles.rychleWrap}>
              <Text style={styles.rychleTitul}>Rýchle otázky:</Text>
              <View style={styles.rychleGrid}>
                {RYCHLE_OTAZKY.map(q => (
                  <TouchableOpacity
                    key={q}
                    style={styles.rychleChip}
                    onPress={() => poslat(q)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.rychleChipText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {chyba && (
            <View style={styles.errBox}>
              <Text style={styles.errText} numberOfLines={3}>
                Chyba: {chyba}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Napíšte správu pre Martu..."
            placeholderTextColor={C.textPlaceholder}
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={() => poslat(input)}
            returnKeyType="send"
            editable={!thinking}
            blurOnSubmit
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || thinking) && styles.sendBtnDisabled,
            ]}
            onPress={() => poslat(input)}
            disabled={!input.trim() || thinking}
            activeOpacity={0.8}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── Bublina správy ─────────────────────────────────────────────────────────
function Bublina({ sprava }: { sprava: Sprava }) {
  const jeUser = sprava.rola === 'user'
  return (
    <View style={[styles.bublinaRow, jeUser && styles.bublinaRowUser]}>
      {!jeUser && (
        <View style={styles.bublinaAvatar}>
          <Text style={{ fontSize: 16 }}>🤖</Text>
        </View>
      )}
      <View
        style={[
          styles.bublina,
          jeUser ? styles.bublinaUser : styles.bublinaAsist,
        ]}
      >
        <Text style={[styles.bublinaText, jeUser && styles.bublinaTextUser]}>
          {sprava.obsah}
        </Text>
      </View>
    </View>
  )
}

// ─── Loading indikátor (tri bodky pulzujú) ─────────────────────────────────
function TypingIndicator() {
  // Tri Animated.Value pre každú bodku
  const a = useRef(new Animated.Value(0)).current
  const b = useRef(new Animated.Value(0)).current
  const c = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animate = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration: 400,
            delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      )
    const anims = [animate(a, 0), animate(b, 150), animate(c, 300)]
    anims.forEach(an => an.start())
    return () => anims.forEach(an => an.stop())
  }, [a, b, c])

  const dot = (v: Animated.Value) => ({
    transform: [{
      translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }),
    }],
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
  })

  return (
    <View style={[styles.bublinaRow]}>
      <View style={styles.bublinaAvatar}>
        <Text style={{ fontSize: 16 }}>🤖</Text>
      </View>
      <View style={[styles.bublina, styles.bublinaAsist, styles.typingBublina]}>
        <Animated.View style={[styles.typingDot, dot(a)]} />
        <Animated.View style={[styles.typingDot, dot(b)]} />
        <Animated.View style={[styles.typingDot, dot(c)]} />
      </View>
    </View>
  )
}

// ─── Štýly ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  // Header
  header: {
    backgroundColor: REFERENTKA_FIALOVA,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  back: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 28 },
  headerTitle: {
    color: '#FFFFFF', fontSize: 17, fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  onlineDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#69F0AE',
  },
  onlineText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Chat
  chat: { padding: 14, gap: 10, paddingBottom: 20 },

  bublinaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '100%',
  },
  bublinaRowUser: { justifyContent: 'flex-end' },
  bublinaAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: REFERENTKA_LIGHT,
    justifyContent: 'center', alignItems: 'center',
  },
  bublina: {
    maxWidth: '78%',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18,
  },
  bublinaAsist: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  bublinaUser: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 4,
  },
  bublinaText: {
    fontSize: 14, color: C.text, lineHeight: 20,
  },
  bublinaTextUser: { color: C.onPrimary },

  // Typing indikátor
  typingBublina: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  typingDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#888',
  },

  // Rýchle otázky
  rychleWrap: { marginTop: 16, gap: 10 },
  rychleTitul: {
    fontSize: 12, fontWeight: '800', color: C.textMuted,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  rychleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rychleChip: {
    backgroundColor: REFERENTKA_LIGHT,
    borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: REFERENTKA_FIALOVA + '33',
  },
  rychleChipText: {
    fontSize: 13, fontWeight: '700', color: REFERENTKA_FIALOVA,
  },

  // Error
  errBox: {
    backgroundColor: C.primaryLight,
    borderRadius: 10, padding: 10,
    marginTop: 8,
    borderLeftWidth: 3, borderLeftColor: C.primary,
  },
  errText: { fontSize: 12, color: C.brand.redDark },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },
  input: {
    flex: 1,
    backgroundColor: C.surfaceAlt,
    borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: C.text,
    maxHeight: 100,
    minHeight: 44,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: REFERENTKA_FIALOVA,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: C.border },
  sendBtnText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: -2 },
})
